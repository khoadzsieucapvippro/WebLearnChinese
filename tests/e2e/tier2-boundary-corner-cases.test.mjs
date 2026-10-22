/**
 * =============================================================================
 * E2E TIER 2: BOUNDARY & CORNER CASES TEST SUITE (OPAQUE-BOX)
 * File: tests/e2e/tier2-boundary-corner-cases.test.mjs
 * 
 * Scope: 5 Feature Domains (Boundary & Stress Conditions)
 * - Domain 1: JWT Secret Length & Profile Boundaries, Demo Seed Flag Edge Cases
 * - Domain 2: SRS [1..100] Card Bounds, Self-Review Boundaries, Concurrent Admin Race
 * - Domain 3: Deeply Nested Sensitive Sanitization, Pagination Clamping, Date Boundaries
 * - Domain 4: Role Array Boundaries, Case Sensitivity, Hub Section Isolation
 * - Domain 5: Password Length Boundaries (5 vs 6 chars), Unicode/Long Passwords
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateJwtSecretConfig,
  parseDemoSeedSetting,
  evaluateDemoFallbackPolicy
} from './utils/security-verifier.mjs';

import {
  evaluateSelfReviewInvariant,
  AdminInvariantManager,
  validateSrsCardLimitBounds,
  evaluateSrsButtonStandardization
} from './utils/invariants-verifier.mjs';

import {
  sanitizeAuditPayload,
  AuditLogMockStore
} from './utils/audit-log-verifier.mjs';

import {
  evaluateNavManagementEntry,
  evaluateManagementHubStructure,
  validateChangePasswordContract,
  auditWebStorageForPasswords
} from './utils/management-e2e-context.mjs';

describe('Tier 2: Boundary & Corner Cases Test Suite', () => {

  // ===========================================================================
  // DOMAIN 1: PRODUCTION SECURITY BOUNDARIES
  // ===========================================================================
  describe('Domain 1: Production Security Boundaries', () => {

    test('TC-T2-D1-01: JWT Secret boundary: exactly 31 bytes (248 bits) is REJECTED', () => {
      // 31 ASCII characters = exactly 31 bytes
      const secret31Bytes = '1234567890123456789012345678901';
      assert.strictEqual(Buffer.byteLength(secret31Bytes, 'utf8'), 31);

      assert.throws(
        () => validateJwtSecretConfig(secret31Bytes, 'production'),
        /Provided length: 31 bytes/,
        'Fail-fast must trigger when secret is 31 bytes'
      );
    });

    test('TC-T2-D1-02: JWT Secret boundary: exactly 32 bytes (256 bits) is ACCEPTED', () => {
      // 32 ASCII characters = exactly 32 bytes
      const secret32Bytes = '12345678901234567890123456789012';
      assert.strictEqual(Buffer.byteLength(secret32Bytes, 'utf8'), 32);

      const result = validateJwtSecretConfig(secret32Bytes, 'production');
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.byteLength, 32);
    });

    test('TC-T2-D1-03: JWT Secret boundary: whitespace-only string of 32+ characters is REJECTED', () => {
      const whitespaceSecret = '                                     '; // 37 spaces
      assert.ok(Buffer.byteLength(whitespaceSecret, 'utf8') >= 32);

      assert.throws(
        () => validateJwtSecretConfig(whitespaceSecret, 'production'),
        /JWT secret cannot be null or blank/,
        'Whitespace-only secret must be rejected as blank'
      );
    });

    test('TC-T2-D1-04: JWT Secret boundary: Multi-byte UTF-8 characters correctly count bytes not chars', () => {
      // '字' is 3 bytes in UTF-8. 11 characters = 33 bytes.
      const chineseSecret = '字字字字字字字字字字字';
      assert.strictEqual(chineseSecret.length, 11);
      assert.strictEqual(Buffer.byteLength(chineseSecret, 'utf8'), 33);

      const result = validateJwtSecretConfig(chineseSecret, 'production');
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.byteLength, 33);
    });

    test('TC-T2-D1-05: Non-production profiles (local, dev, test) permit fallback dev secret', () => {
      const devRes = validateJwtSecretConfig('', 'dev');
      assert.strictEqual(devRes.valid, true);

      const localRes = validateJwtSecretConfig(null, 'local');
      assert.strictEqual(localRes.valid, true);

      const testRes = validateJwtSecretConfig('short', 'test');
      assert.strictEqual(testRes.valid, true);
    });

    test('TC-T2-D1-06: Demo seed flag edge case parsing across representations', () => {
      const variants = [
        { text: 'APP_DEMO_SEED_ACCOUNTS=false', expected: true },
        { text: 'APP_DEMO_SEED_ACCOUNTS=0', expected: true },
        { text: 'APP_DEMO_SEED_ACCOUNTS="no"', expected: true },
        { text: 'APP_DEMO_SEED_ACCOUNTS=FALSE', expected: true },
        { text: 'APP_DEMO_SEED_ACCOUNTS=true', expected: false },
        { text: 'APP_DEMO_SEED_ACCOUNTS=1', expected: false }
      ];

      for (const v of variants) {
        const parsed = parseDemoSeedSetting(v.text);
        assert.strictEqual(parsed.isDisabled, v.expected, `Failed for ${v.text}`);
      }
    });
  });

  // ===========================================================================
  // DOMAIN 2: BUSINESS INVARIANTS & SRS BOUNDARIES
  // ===========================================================================
  describe('Domain 2: Business Invariants & SRS Boundaries', () => {

    test('TC-T2-D2-01: SRS newCardsPerDay upper boundary: exactly 100 is ACCEPTED', () => {
      const res = validateSrsCardLimitBounds(100);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.sanitizedValue, 100);
    });

    test('TC-T2-D2-02: SRS newCardsPerDay upper boundary: exactly 101 is REJECTED', () => {
      const res = validateSrsCardLimitBounds(101);
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'Số thẻ mới mỗi ngày không được vượt quá 100');
    });

    test('TC-T2-D2-03: SRS newCardsPerDay lower boundary: 1 is ACCEPTED, 0 is REJECTED', () => {
      const one = validateSrsCardLimitBounds(1);
      assert.strictEqual(one.valid, true);

      const zero = validateSrsCardLimitBounds(0);
      assert.strictEqual(zero.valid, false);
      assert.strictEqual(zero.error, 'Số thẻ mới mỗi ngày phải là số nguyên dương lớn hơn 0');
    });

    test('TC-T2-D2-04: SRS newCardsPerDay extreme values: float, NaN, and MAX_SAFE_INTEGER', () => {
      const floatVal = validateSrsCardLimitBounds(15.5);
      assert.strictEqual(floatVal.valid, false);
      assert.strictEqual(floatVal.error, 'Số thẻ mới mỗi ngày phải là số nguyên');

      const stringVal = validateSrsCardLimitBounds('abc');
      assert.strictEqual(stringVal.valid, false);

      const hugeVal = validateSrsCardLimitBounds(Number.MAX_SAFE_INTEGER);
      assert.strictEqual(hugeVal.valid, false);
      assert.strictEqual(hugeVal.error, 'Số thẻ mới mỗi ngày không được vượt quá 100');
    });

    test('TC-T2-D2-05: Self-review boundary: Dual-role user (Creator & Moderator) on own content is REJECTED', () => {
      const selfReview = evaluateSelfReviewInvariant({
        lessonCreatorId: 404,
        reviewerAccountId: 404,
        action: 'Approve'
      });
      assert.strictEqual(selfReview.allowed, false);
      assert.strictEqual(selfReview.status, 403);
    });

    test('TC-T2-D2-06: Last admin boundary: exactly 2 active admins, 1 demoted leaves 1 active admin (ACCEPTED)', async () => {
      const manager = new AdminInvariantManager([
        { id: 501, username: 'admin_a', roles: ['Admin'], status: 'ACTIVE' },
        { id: 502, username: 'admin_b', roles: ['Admin'], status: 'ACTIVE' }
      ]);

      // Admin A demotes Admin B
      const result = await manager.updateAccountRoles(502, ['Learner'], 501);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.status, 200);
      assert.strictEqual(manager.countActiveAdmins(), 1);
    });

    test('TC-T2-D2-07: Last admin boundary: exactly 1 active admin demotion attempt is REJECTED (status 400)', async () => {
      const manager = new AdminInvariantManager([
        { id: 501, username: 'admin_a', roles: ['Admin'], status: 'ACTIVE' }
      ]);

      const result = await manager.updateAccountRoles(501, ['Learner'], 999);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.status, 400);
      assert.strictEqual(manager.countActiveAdmins(), 1);
    });

    test('TC-T2-D2-08: Last admin boundary: Locked/Inactive Admin accounts do not count towards active quota', async () => {
      const manager = new AdminInvariantManager([
        { id: 501, username: 'admin_active', roles: ['Admin'], status: 'ACTIVE' },
        { id: 502, username: 'admin_locked', roles: ['Admin'], status: 'LOCKED' },
        { id: 503, username: 'admin_inactive', roles: ['Admin'], status: 'INACTIVE' }
      ]);

      // Active admins is only 1!
      assert.strictEqual(manager.countActiveAdmins(), 1);

      // Attempting to demote the only active admin 501 must be blocked
      const result = await manager.updateAccountRoles(501, ['Learner'], 999);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.status, 400);
    });

    test('TC-T2-D2-09: Concurrent demotion stress: 2 simultaneous demotion requests on 2 remaining admins', async () => {
      const manager = new AdminInvariantManager([
        { id: 501, username: 'admin_1', roles: ['Admin'], status: 'ACTIVE' },
        { id: 502, username: 'admin_2', roles: ['Admin'], status: 'ACTIVE' }
      ]);

      // Admin 1 tries to demote Admin 2, while simultaneously Admin 2 tries to demote Admin 1
      const [res1, res2] = await Promise.all([
        manager.updateAccountRoles(502, ['Learner'], 501),
        manager.updateAccountRoles(501, ['Learner'], 502)
      ]);

      // Exactly ONE must succeed and ONE must fail
      const successes = [res1, res2].filter(r => r.success);
      const failures = [res1, res2].filter(r => !r.success);

      assert.strictEqual(successes.length, 1, 'Exactly one concurrent demotion must succeed');
      assert.strictEqual(failures.length, 1, 'Exactly one concurrent demotion must fail');
      assert.strictEqual(failures[0].status, 400);
      assert.strictEqual(manager.countActiveAdmins(), 1, 'Invariant must preserve >= 1 active admin');
    });
  });

  // ===========================================================================
  // DOMAIN 3: AUDIT LOGGING BOUNDARIES
  // ===========================================================================
  describe('Domain 3: Audit Logging Boundaries', () => {

    test('TC-T2-D3-01: Deeply nested JSON payload (6 levels) with sensitive keys is completely redacted', () => {
      const deepPayload = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  level6: {
                    userPassword: 'RawSecretPassword123!',
                    normalField: 'Accessible'
                  }
                }
              }
            }
          }
        }
      };

      const sanitized = sanitizeAuditPayload(deepPayload);
      assert.strictEqual(sanitized.level1.level2.level3.level4.level5.level6.userPassword, '[REDACTED]');
      assert.strictEqual(sanitized.level1.level2.level3.level4.level5.level6.normalField, 'Accessible');
    });

    test('TC-T2-D3-02: Case-insensitive sensitive key variations are all redacted', () => {
      const variedKeys = {
        PASSWORD: '123',
        passwd: '456',
        CURRENT_PASSWORD: '789',
        new_password: 'abc',
        JwtSecret: 'xyz',
        bearer_token: 'def',
        Api_Token: 'ghi'
      };

      const sanitized = sanitizeAuditPayload(variedKeys);
      for (const val of Object.values(sanitized)) {
        assert.strictEqual(val, '[REDACTED]');
      }
    });

    test('TC-T2-D3-03: Audit log pagination boundaries: size clamping and negative page normalization', () => {
      const store = new AuditLogMockStore();
      for (let i = 1; i <= 150; i++) {
        store.recordEvent({
          actorId: 505,
          actorUsername: 'admin_sys',
          actionType: 'ROLE_CHANGE',
          resourceType: 'ACCOUNT',
          status: 'SUCCESS'
        });
      }

      // Max size clamped to 100
      const clampedRes = store.queryLogs({ userRoles: ['Admin'], page: 0, size: 500 });
      assert.strictEqual(clampedRes.status, 200);
      assert.strictEqual(clampedRes.data.content.length, 100);

      // Negative page normalized to 0
      const negRes = store.queryLogs({ userRoles: ['Admin'], page: -5, size: 20 });
      assert.strictEqual(negRes.status, 200);
      assert.strictEqual(negRes.data.page, 0);
    });

    test('TC-T2-D3-04: Audit log date range filter: inverted date range yields 0 records', () => {
      const store = new AuditLogMockStore();
      store.recordEvent({
        actorId: 505,
        actorUsername: 'admin_sys',
        actionType: 'ROLE_CHANGE',
        resourceType: 'ACCOUNT',
        status: 'SUCCESS'
      });

      // startDate is future, endDate is past
      const invertedRes = store.queryLogs({
        userRoles: ['Admin'],
        startDate: '2026-12-31T00:00:00Z',
        endDate: '2026-01-01T00:00:00Z'
      });

      assert.strictEqual(invertedRes.status, 200);
      assert.strictEqual(invertedRes.data.totalElements, 0);
    });

    test('TC-T2-D3-05: Audit log payload boundary: null and empty JSON states handled cleanly', () => {
      const store = new AuditLogMockStore();
      const emptyEntry = store.recordEvent({
        actorId: 505,
        actorUsername: 'admin_sys',
        actionType: 'RESOURCE_DELETE',
        resourceType: 'VOCABULARY',
        beforeState: null,
        afterState: {}
      });

      assert.strictEqual(emptyEntry.beforeState, null);
      assert.deepStrictEqual(emptyEntry.afterState, {});
    });
  });

  // ===========================================================================
  // DOMAIN 4: NAVIGATION & DECOUPLING BOUNDARIES
  // ===========================================================================
  describe('Domain 4: Navigation & Decoupling Boundaries', () => {

    test('TC-T2-D4-01: Empty or null roles array does not render management link', () => {
      assert.strictEqual(evaluateNavManagementEntry([]).showManagementLink, false);
      assert.strictEqual(evaluateNavManagementEntry(null).showManagementLink, false);
      assert.strictEqual(evaluateNavManagementEntry(undefined).showManagementLink, false);
    });

    test('TC-T2-D4-02: Unknown or custom non-management roles do not render management link', () => {
      const guestRole = evaluateNavManagementEntry(['ROLE_GUEST', 'Student', 'Auditor']);
      assert.strictEqual(guestRole.showManagementLink, false);
    });

    test('TC-T2-D4-03: Case-insensitive and prefix role variants are handled consistently', () => {
      assert.strictEqual(evaluateNavManagementEntry(['creator']).showManagementLink, true);
      assert.strictEqual(evaluateNavManagementEntry(['ROLE_MODERATOR']).showManagementLink, true);
      assert.strictEqual(evaluateNavManagementEntry(['admin']).showManagementLink, true);
      assert.strictEqual(evaluateNavManagementEntry(['ROLE_ADMIN']).showManagementLink, true);
    });

    test('TC-T2-D4-04: Management hub role section isolation: Moderator cannot see Admin section', () => {
      const hub = evaluateManagementHubStructure('<div><a href="index.html">Quay lại học</a></div>', ['Moderator']);
      assert.ok(hub.visibleSections.includes('MODERATOR'));
      assert.strictEqual(hub.visibleSections.includes('ADMIN'), false);
    });

    test('TC-T2-D4-05: Management hub role section isolation: Creator cannot see Moderator or Admin section', () => {
      const hub = evaluateManagementHubStructure('<div><a href="index.html">Quay lại học</a></div>', ['Creator']);
      assert.deepStrictEqual(hub.visibleSections, ['CREATOR']);
    });
  });

  // ===========================================================================
  // DOMAIN 5: SETTINGS & PASSWORD BOUNDARIES
  // ===========================================================================
  describe('Domain 5: Settings & Password Boundaries', () => {

    test('TC-T2-D5-01: Password change length boundary: 5 chars is REJECTED (< 6)', () => {
      const res = validateChangePasswordContract({
        currentPassword: 'ValidCurrentPassword1',
        newPassword: 'abc12' // 5 chars
      });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'Mật khẩu mới phải có ít nhất 6 ký tự');
    });

    test('TC-T2-D5-02: Password change length boundary: exactly 6 chars is ACCEPTED (>= 6)', () => {
      const res = validateChangePasswordContract({
        currentPassword: 'ValidCurrentPassword1',
        newPassword: 'abc123' // 6 chars
      });
      assert.strictEqual(res.valid, true);
    });

    test('TC-T2-D5-03: Password change boundary: whitespace-only new password is REJECTED', () => {
      const res = validateChangePasswordContract({
        currentPassword: 'ValidCurrentPassword1',
        newPassword: '          ' // 10 spaces
      });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'Mật khẩu mới không được để trống');
    });

    test('TC-T2-D5-04: Password change boundary: 128 characters with Unicode characters is ACCEPTED', () => {
      const longUnicodePass = '字'.repeat(64) + 'Secure@1234567890'.repeat(4);
      assert.ok(longUnicodePass.length > 100);

      const res = validateChangePasswordContract({
        currentPassword: 'OldPassword123',
        newPassword: longUnicodePass
      });
      assert.strictEqual(res.valid, true);
    });

    test('TC-T2-D5-05: Web Storage audit boundary: Deep nested JSON values with password fields detected', () => {
      const leakyStorage = {
        session_cache: JSON.stringify({
          user: {
            auth: {
              password: 'plaintext_password_leak'
            }
          }
        })
      };

      const audit = auditWebStorageForPasswords(leakyStorage);
      assert.strictEqual(audit.secure, false);
      assert.ok(audit.leakedKeys.includes('session_cache.user.auth.password'));
    });
  });
});
