/**
 * =============================================================================
 * EMPIRICAL ADVERSARIAL SECURITY & INVARIANT CHALLENGE HARNESS
 * File: tests/adversarial-security-challenge.test.mjs
 * 
 * Challenger: Challenger 1 (Security & Invariant Challenger)
 * Roles: critic, specialist
 * 
 * Challenges:
 * 1. Moderation Self-Review Invariant (Approve / Reject own lesson -> 403 FORBIDDEN)
 * 2. Last Active Admin Invariant & Pessimistic Lock Concurrency Safety
 * 3. JWT Secret Fail-Fast in Production/Non-Dev Environments
 * 4. Demo Fallback Anti-Downgrade & Authentic Error Preservation
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { evaluateSelfReviewInvariant, AdminInvariantManager } from './e2e/utils/invariants-verifier.mjs';
import { validateJwtSecretConfig, parseDemoSeedSetting, evaluateDemoFallbackPolicy, verifyDemoBadgeStandard } from './e2e/utils/security-verifier.mjs';
import { isApiConfigured, isDemoFallbackActive, ApiError, apiClient } from '../frontend/js/api/api.js';
import { authManager } from '../frontend/js/auth/auth-state.js';

describe('Adversarial Challenge 1: Moderation Self-Review Invariant', () => {

  test('ADV-SR-01: Creator with Moderator role attempting to self-approve own lesson is REJECTED with 403 FORBIDDEN', () => {
    const creatorId = 101;
    const reviewerId = 101; // Same account ID

    const result = evaluateSelfReviewInvariant({
      lessonCreatorId: creatorId,
      reviewerAccountId: reviewerId,
      action: 'Approve'
    });

    assert.strictEqual(result.allowed, false, 'Self-approval must be disallowed');
    assert.strictEqual(result.status, 403, 'Must return HTTP status 403');
    assert.strictEqual(result.errorCode, 'FORBIDDEN', 'Must return error code FORBIDDEN');
    assert.match(result.message, /không thể tự kiểm duyệt/i, 'Must contain Vietnamese self-review error message');
  });

  test('ADV-SR-02: Creator with Moderator role attempting to self-reject own lesson is REJECTED with 403 FORBIDDEN', () => {
    const creatorId = 101;
    const reviewerId = 101; // Same account ID

    const result = evaluateSelfReviewInvariant({
      lessonCreatorId: creatorId,
      reviewerAccountId: reviewerId,
      action: 'Reject'
    });

    assert.strictEqual(result.allowed, false, 'Self-rejection must be disallowed');
    assert.strictEqual(result.status, 403, 'Must return HTTP status 403');
    assert.strictEqual(result.errorCode, 'FORBIDDEN', 'Must return error code FORBIDDEN');
    assert.match(result.message, /không thể tự kiểm duyệt/i, 'Must contain Vietnamese self-review error message');
  });

  test('ADV-SR-03: String vs Numeric account ID representation mismatch still strictly rejects self-review', () => {
    // Attack: attempting to bypass check via type coercion ("101" vs 101)
    const resultApprove = evaluateSelfReviewInvariant({
      lessonCreatorId: '101',
      reviewerAccountId: 101,
      action: 'Approve'
    });
    assert.strictEqual(resultApprove.allowed, false);
    assert.strictEqual(resultApprove.status, 403);

    const resultReject = evaluateSelfReviewInvariant({
      lessonCreatorId: 101,
      reviewerAccountId: '101',
      action: 'Reject'
    });
    assert.strictEqual(resultReject.allowed, false);
    assert.strictEqual(resultReject.status, 403);
  });

  test('ADV-SR-04: Independent Moderator (different account ID) successfully approves and rejects', () => {
    const creatorId = 101;
    const independentModeratorId = 102; // Different account ID

    const approveResult = evaluateSelfReviewInvariant({
      lessonCreatorId: creatorId,
      reviewerAccountId: independentModeratorId,
      action: 'Approve'
    });
    assert.strictEqual(approveResult.allowed, true);
    assert.strictEqual(approveResult.status, 200);

    const rejectResult = evaluateSelfReviewInvariant({
      lessonCreatorId: creatorId,
      reviewerAccountId: independentModeratorId,
      action: 'Reject'
    });
    assert.strictEqual(rejectResult.allowed, true);
    assert.strictEqual(rejectResult.status, 200);
  });

  test('ADV-SR-05: Missing creator or reviewer ID throws defensive validation exception', () => {
    assert.throws(() => {
      evaluateSelfReviewInvariant({ lessonCreatorId: null, reviewerAccountId: 101 });
    }, /required/i);

    assert.throws(() => {
      evaluateSelfReviewInvariant({ lessonCreatorId: 101, reviewerAccountId: null });
    }, /required/i);
  });
});

describe('Adversarial Challenge 2: Last Active Admin Invariant & Pessimistic Concurrency', () => {

  test('ADV-ADM-01: System with exactly 1 active admin strictly rejects demotion (HTTP 400)', async () => {
    const manager = new AdminInvariantManager([
      { id: 1, username: 'admin1', roles: ['Admin'], status: 'ACTIVE' },
      { id: 2, username: 'learner1', roles: ['Learner'], status: 'ACTIVE' }
    ]);

    assert.strictEqual(manager.countActiveAdmins(), 1);

    // Actor 999 attempts to demote Admin 1 to Learner
    const result = await manager.updateAccountRoles(1, ['Learner'], 999);
    assert.strictEqual(result.success, false, 'Demoting last active admin must fail');
    assert.strictEqual(result.status, 400, 'Must return HTTP 400 BAD_REQUEST');
    assert.strictEqual(manager.countActiveAdmins(), 1, 'Active admin count must remain 1');
  });

  test('ADV-ADM-02: Inactive, Locked, or Banned Admins do not satisfy active admin invariant', async () => {
    const manager = new AdminInvariantManager([
      { id: 1, username: 'active_admin', roles: ['Admin'], status: 'ACTIVE' },
      { id: 2, username: 'inactive_admin', roles: ['Admin'], status: 'INACTIVE' },
      { id: 3, username: 'locked_admin', roles: ['Admin'], status: 'LOCKED' },
      { id: 4, username: 'banned_admin', roles: ['Admin'], status: 'BANNED' }
    ]);

    // Total admin roles is 4, but active admins is strictly 1!
    assert.strictEqual(manager.countActiveAdmins(), 1, 'Only ACTIVE admins count towards invariant');

    // Attempting to demote the single active admin must be blocked
    const result = await manager.updateAccountRoles(1, ['Learner'], 999);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, 400);
    assert.strictEqual(manager.countActiveAdmins(), 1);
  });

  test('ADV-ADM-03: Two simultaneous concurrent demotions on the last 2 active admins serialize safely via pessimistic lock', async () => {
    // Invariant: If 2 active admins exist, exactly ONE demotion can succeed; the other MUST be rejected.
    // Leaves exactly 1 active admin (never 0).
    const manager = new AdminInvariantManager([
      { id: 10, username: 'admin_alpha', roles: ['Admin'], status: 'ACTIVE' },
      { id: 20, username: 'admin_beta', roles: ['Admin'], status: 'ACTIVE' }
    ]);

    assert.strictEqual(manager.countActiveAdmins(), 2);

    // Simulating concurrent request race: Alpha demotes Beta, Beta demotes Alpha
    const [resAlphaDemotesBeta, resBetaDemotesAlpha] = await Promise.all([
      manager.updateAccountRoles(20, ['Learner'], 10),
      manager.updateAccountRoles(10, ['Learner'], 20)
    ]);

    const successes = [resAlphaDemotesBeta, resBetaDemotesAlpha].filter(r => r.success);
    const failures = [resAlphaDemotesBeta, resBetaDemotesAlpha].filter(r => !r.success);

    assert.strictEqual(successes.length, 1, 'Exactly one concurrent demotion request must succeed');
    assert.strictEqual(failures.length, 1, 'Exactly one concurrent demotion request must fail');
    assert.strictEqual(failures[0].status, 400, 'Failed request must receive HTTP 400');
    assert.strictEqual(manager.countActiveAdmins(), 1, 'Final active admin count MUST be exactly 1, NEVER 0');
  });

  test('ADV-ADM-04: High concurrency burst (10 simultaneous demotion attempts) on last active admin all safely rejected', async () => {
    const manager = new AdminInvariantManager([
      { id: 1, username: 'sole_admin', roles: ['Admin'], status: 'ACTIVE' }
    ]);

    const attempts = Array.from({ length: 10 }, (_, i) => 
      manager.updateAccountRoles(1, ['Learner'], 100 + i)
    );

    const results = await Promise.all(attempts);
    assert.strictEqual(results.every(r => !r.success && r.status === 400), true, 'All 10 attempts must be rejected');
    assert.strictEqual(manager.countActiveAdmins(), 1, 'Active admin must survive intact');
  });
});

describe('Adversarial Challenge 3: JWT Secret Fail-Fast in Production / Non-Dev', () => {

  test('ADV-JWT-01: Null, undefined, empty, or whitespace secret halts startup in production profile', () => {
    assert.throws(() => {
      validateJwtSecretConfig(null, 'production');
    }, /Fail-fast/i, 'Null secret must fail-fast');

    assert.throws(() => {
      validateJwtSecretConfig(undefined, 'production');
    }, /Fail-fast/i, 'Undefined secret must fail-fast');

    assert.throws(() => {
      validateJwtSecretConfig('', 'production');
    }, /Fail-fast/i, 'Empty secret must fail-fast');

    assert.throws(() => {
      validateJwtSecretConfig('     ', 'production');
    }, /Fail-fast/i, 'Whitespace secret must fail-fast');
  });

  test('ADV-JWT-02: Secret with 31 bytes (248 bits) is REJECTED (< 32 bytes)', () => {
    const key31Bytes = '1234567890123456789012345678901'; // 31 chars = 31 bytes
    assert.strictEqual(Buffer.byteLength(key31Bytes, 'utf8'), 31);

    assert.throws(() => {
      validateJwtSecretConfig(key31Bytes, 'production');
    }, /at least 32 bytes/i, '31-byte key must be rejected');
  });

  test('ADV-JWT-03: Secret with exactly 32 bytes (256 bits) is ACCEPTED (boundary value)', () => {
    const key32Bytes = '12345678901234567890123456789012'; // 32 chars = 32 bytes
    assert.strictEqual(Buffer.byteLength(key32Bytes, 'utf8'), 32);

    const result = validateJwtSecretConfig(key32Bytes, 'production');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.byteLength, 32);
  });

  test('ADV-JWT-04: Multi-byte UTF-8 secrets correctly counted by bytes, not string length', () => {
    // Chinese characters: each takes 3 bytes in UTF-8
    // 10 chars = 30 bytes (< 32 bytes) -> MUST BE REJECTED
    const key10Chars = '一二三四五六七八九十';
    assert.strictEqual(key10Chars.length, 10);
    assert.strictEqual(Buffer.byteLength(key10Chars, 'utf8'), 30);

    assert.throws(() => {
      validateJwtSecretConfig(key10Chars, 'production');
    }, /at least 32 bytes/i);

    // 11 chars = 33 bytes (>= 32 bytes) -> MUST BE ACCEPTED
    const key11Chars = '一二三四五六七八九十一';
    assert.strictEqual(key11Chars.length, 11);
    assert.strictEqual(Buffer.byteLength(key11Chars, 'utf8'), 33);

    const validResult = validateJwtSecretConfig(key11Chars, 'production');
    assert.strictEqual(validResult.valid, true);
    assert.strictEqual(validResult.byteLength, 33);
  });

  test('ADV-JWT-05: Non-production profiles (local, dev, test) permit dev fallback key', () => {
    const devFallback = validateJwtSecretConfig('', 'dev');
    assert.strictEqual(devFallback.valid, true);

    const localFallback = validateJwtSecretConfig(null, 'local');
    assert.strictEqual(localFallback.valid, true);
  });
});

describe('Adversarial Challenge 4: Demo Fallback Anti-Downgrade & Authentic Error Preservation', () => {

  test('ADV-DF-01: When API is configured, authentic HTTP 401 error is NOT downgraded to simulated demo auth', () => {
    const policyResult = evaluateDemoFallbackPolicy(
      { status: 401, contentType: 'application/json' },
      { isApiConfigured: true }
    );

    assert.strictEqual(policyResult.allowsFallback, false, 'Must not fallback on 401 when API configured');
    assert.match(policyResult.violation, /Silent downgrade prohibited/i);
  });

  test('ADV-DF-02: When API is configured, authentic HTTP 500 error is NOT converted to mock data', () => {
    const policyResult = evaluateDemoFallbackPolicy(
      { status: 500, contentType: 'application/json' },
      { isApiConfigured: true }
    );

    assert.strictEqual(policyResult.allowsFallback, false, 'Must not fallback on 500 when API configured');
    assert.match(policyResult.violation, /Silent downgrade prohibited/i);
  });

  test('ADV-DF-03: When API is configured, authentic HTTP 403 Forbidden is NOT intercepted by demo fallback', () => {
    const policyResult = evaluateDemoFallbackPolicy(
      { status: 403, contentType: 'application/json' },
      { isApiConfigured: true }
    );

    assert.strictEqual(policyResult.allowsFallback, false, 'Must not fallback on 403 when API configured');
  });

  test('ADV-DF-04: In demo mode (GitHub Pages or DEMO_MODE), simulation indicator badge is displayed and meets standard', () => {
    const validBadge = verifyDemoBadgeStandard({
      visible: true,
      text: '🟡 Dữ liệu mô phỏng',
      className: 'badge badge-warning demo-indicator'
    });
    assert.strictEqual(validBadge, true, 'Badge must meet visibility and text standards');

    const invalidBadgeHidden = verifyDemoBadgeStandard({
      visible: false,
      text: '🟡 Dữ liệu mô phỏng',
      className: 'badge badge-warning'
    });
    assert.strictEqual(invalidBadgeHidden, false, 'Hidden badge fails standard');

    const invalidBadgeNoText = verifyDemoBadgeStandard({
      visible: true,
      text: 'Normal System',
      className: 'badge badge-warning'
    });
    assert.strictEqual(invalidBadgeNoText, false, 'Badge without simulation text fails standard');
  });

  test('ADV-DF-05: apiClient network failure with configured API propagates NETWORK_ERROR without fallback', async () => {
    // Setup mock global window.__ENV__ with explicit API_BASE_URL
    const previousWindow = globalThis.window;
    try {
      globalThis.window = {
        __ENV__: { API_BASE_URL: 'https://api.weblearnchinese.com/api/v1' }
      };

      assert.strictEqual(isApiConfigured(), true, 'API must be detected as configured');

      // Intercept fetch to simulate network connection drop (TypeError)
      const previousFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        throw new TypeError('Failed to fetch (Network connection refused)');
      };

      try {
        await apiClient('/lessons', { retry: false });
        assert.fail('apiClient should have thrown an ApiError');
      } catch (err) {
        assert.strictEqual(err instanceof ApiError, true, 'Must throw ApiError');
        assert.strictEqual(err.code, 'NETWORK_ERROR', 'Error code must be NETWORK_ERROR');
        assert.strictEqual(err.status, 0, 'Status code must be 0 for network failure');
        assert.match(err.message, /kết nối/i, 'Must contain network connection error message');
      } finally {
        globalThis.fetch = previousFetch;
      }
    } finally {
      globalThis.window = previousWindow;
    }
  });

  test('ADV-DF-06: apiClient HTTP 401 with configured API propagates UNAUTHORIZED without fallback', async () => {
    const previousWindow = globalThis.window;
    try {
      globalThis.window = {
        __ENV__: { API_BASE_URL: 'https://api.weblearnchinese.com/api/v1' }
      };

      assert.strictEqual(isApiConfigured(), true);

      const previousFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return {
          status: 401,
          ok: false,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: async () => ({
            code: 'UNAUTHORIZED',
            message: 'Phiên đăng nhập đã hết hạn'
          })
        };
      };

      try {
        await apiClient('/auth/profile', { retry: false });
        assert.fail('apiClient should have thrown an ApiError');
      } catch (err) {
        assert.strictEqual(err instanceof ApiError, true);
        assert.strictEqual(err.status, 401);
        assert.strictEqual(err.code, 'UNAUTHORIZED');
        assert.match(err.message, /hết hạn/i);
      } finally {
        globalThis.fetch = previousFetch;
      }
    } finally {
      globalThis.window = previousWindow;
    }
  });

  test('ADV-DF-07: apiClient HTTP 500 with configured API propagates SERVER_ERROR without fallback', async () => {
    const previousWindow = globalThis.window;
    try {
      globalThis.window = {
        __ENV__: { API_BASE_URL: 'https://api.weblearnchinese.com/api/v1' }
      };

      assert.strictEqual(isApiConfigured(), true);

      const previousFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return {
          status: 500,
          ok: false,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: async () => ({
            code: 'INTERNAL_ERROR',
            message: 'Lỗi nội bộ hệ thống'
          })
        };
      };

      try {
        await apiClient('/creator/lessons', { retry: false });
        assert.fail('apiClient should have thrown an ApiError');
      } catch (err) {
        assert.strictEqual(err instanceof ApiError, true);
        assert.strictEqual(err.status, 500);
        assert.strictEqual(err.code, 'INTERNAL_ERROR');
      } finally {
        globalThis.fetch = previousFetch;
      }
    } finally {
      globalThis.window = previousWindow;
    }
  });
});
