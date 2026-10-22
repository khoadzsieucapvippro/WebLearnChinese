/**
 * =============================================================================
 * E2E TIER 3: CROSS-FEATURE COMBINATIONS TEST SUITE (OPAQUE-BOX)
 * File: tests/e2e/tier3-cross-feature-combinations.test.mjs
 * 
 * Scope: Pairwise & Cross-Feature Interactions
 * - TC-T3-01: Creator-Moderator Self-Review Attempt + Audit Log Generation (F4 + F11 + F12)
 * - TC-T3-02: Last Admin Role Change + Audit Log Verification (F5 + F10 + F11)
 * - TC-T3-03: Management Hub Navigation + Audit Logs RBAC Enforcement (F12 + F14 + F15)
 * - TC-T3-04: Password Change API + Sensitive Sanitization + Zero Web Storage Leak (F10 + F18 + F19)
 * - TC-T3-05: SRS Upper Bound Constraint + Profile Revert Button Interaction (F6 + F7 + F18)
 * - TC-T3-06: Production Security Boot + Demo Error Non-Bypass + Navigation Guard (F1 + F2 + F3 + F15)
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateJwtSecretConfig,
  parseDemoSeedSetting,
  evaluateDemoFallbackPolicy,
  verifyDemoBadgeStandard
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
  TEST_PERSONAS,
  evaluateNavManagementEntry,
  evaluateManagementHubStructure,
  verifyProfileDecoupling,
  validateChangePasswordContract,
  auditWebStorageForPasswords
} from './utils/management-e2e-context.mjs';

describe('Tier 3: Cross-Feature Combinations Test Suite', () => {

  // ---------------------------------------------------------------------------
  // TC-T3-01: Creator-Moderator Self-Review Attempt + Audit Log Generation
  // ---------------------------------------------------------------------------
  test('TC-T3-01: Self-review violation generates audit failure log retrievable by Admin', () => {
    const auditStore = new AuditLogMockStore();
    const dualUser = TEST_PERSONAS.creatorModerator; // accountId 404

    // 1. Dual-role user creates lesson (id=101)
    const lesson = { id: 101, title: 'HSK 2 Bài 1', createdBy: dualUser.accountId, status: 'Pending' };

    // 2. Dual-role user attempts to approve their own lesson
    const reviewResult = evaluateSelfReviewInvariant({
      lessonCreatorId: lesson.createdBy,
      reviewerAccountId: dualUser.accountId,
      action: 'Approve'
    });

    assert.strictEqual(reviewResult.allowed, false);
    assert.strictEqual(reviewResult.status, 403);

    // 3. System records audit log hook for failed review attempt
    auditStore.recordEvent({
      actorId: dualUser.accountId,
      actorUsername: dualUser.emailOrPhone,
      actionType: 'LESSON_MODERATE',
      resourceType: 'LESSON',
      resourceId: lesson.id,
      status: 'FAILURE',
      detailsSummary: reviewResult.message
    });

    // 4. Admin inspects audit logs via REST API
    const adminQuery = auditStore.queryLogs({
      userRoles: ['Admin'],
      actionType: 'LESSON_MODERATE',
      status: 'FAILURE'
    });

    assert.strictEqual(adminQuery.status, 200);
    assert.strictEqual(adminQuery.data.totalElements, 1);
    const logEntry = adminQuery.data.content[0];
    assert.strictEqual(logEntry.actorId, dualUser.accountId);
    assert.strictEqual(logEntry.status, 'FAILURE');
    assert.ok(logEntry.detailsSummary.includes('tự kiểm duyệt nội dung'));
  });

  // ---------------------------------------------------------------------------
  // TC-T3-02: Last Admin Role Change + Audit Log Verification
  // ---------------------------------------------------------------------------
  test('TC-T3-02: Last admin demotion failure and subsequent multi-admin success audit logging', async () => {
    const auditStore = new AuditLogMockStore();
    const manager = new AdminInvariantManager([
      { id: 505, username: 'admin_sys', roles: ['Admin'], status: 'ACTIVE' }
    ]);

    // 1. Admin attempts demotion while being the only admin -> BLOCKED
    const failDemote = await manager.updateAccountRoles(505, ['Learner'], 999);
    assert.strictEqual(failDemote.success, false);
    assert.strictEqual(failDemote.status, 400);

    // Log the failure
    auditStore.recordEvent({
      actorId: 999,
      actorUsername: 'operator',
      actionType: 'ROLE_CHANGE',
      resourceType: 'ACCOUNT',
      resourceId: 505,
      status: 'FAILURE',
      detailsSummary: failDemote.message
    });

    // 2. Add second admin
    manager.accounts.push({ id: 506, username: 'admin_backup', roles: ['Admin'], status: 'ACTIVE' });
    assert.strictEqual(manager.countActiveAdmins(), 2);

    // 3. Retry demoting admin 505 -> SUCCEEDS
    const successDemote = await manager.updateAccountRoles(505, ['Learner'], 506);
    assert.strictEqual(successDemote.success, true);
    assert.strictEqual(successDemote.status, 200);

    // Log the success with sanitized states
    auditStore.recordEvent({
      actorId: 506,
      actorUsername: 'admin_backup',
      actionType: 'ROLE_CHANGE',
      resourceType: 'ACCOUNT',
      resourceId: 505,
      status: 'SUCCESS',
      beforeState: { roles: ['Admin'] },
      afterState: { roles: ['Learner'] },
      detailsSummary: 'Demoted admin_sys to Learner'
    });

    // 4. Verify audit trail has exactly 1 failure and 1 success for role change
    const allRoleLogs = auditStore.queryLogs({ userRoles: ['Admin'], actionType: 'ROLE_CHANGE' });
    assert.strictEqual(allRoleLogs.status, 200);
    assert.strictEqual(allRoleLogs.data.totalElements, 2);

    const successLog = allRoleLogs.data.content.find(l => l.status === 'SUCCESS');
    assert.ok(successLog);
    assert.deepStrictEqual(successLog.afterState.roles, ['Learner']);
  });

  // ---------------------------------------------------------------------------
  // TC-T3-03: Management Hub Navigation + Audit Logs RBAC Enforcement
  // ---------------------------------------------------------------------------
  test('TC-T3-03: Moderator sees management hub but is blocked from Admin audit logs API and cards', () => {
    const auditStore = new AuditLogMockStore();
    auditStore.recordEvent({
      actorId: 505,
      actorUsername: 'admin_sys',
      actionType: 'SYSTEM_CONFIG',
      resourceType: 'SYSTEM',
      status: 'SUCCESS'
    });

    const moderator = TEST_PERSONAS.moderator;

    // 1. Navigation bar renders management entry for Moderator
    const navEval = evaluateNavManagementEntry(moderator.roles);
    assert.strictEqual(navEval.showManagementLink, true);

    // 2. Management Hub reflects only Moderator tools, hides Admin audit log cards
    const hubEval = evaluateManagementHubStructure('<div><a href="index.html">Quay lại học</a></div>', moderator.roles);
    assert.ok(hubEval.visibleSections.includes('MODERATOR'));
    assert.strictEqual(hubEval.visibleSections.includes('ADMIN'), false);

    // 3. Moderator attempts direct REST call to /api/v1/admin/audit-logs -> 403 Forbidden
    const directApiCall = auditStore.queryLogs({ userRoles: moderator.roles });
    assert.strictEqual(directApiCall.status, 403);
    assert.ok(directApiCall.message.includes('Quản trị viên'));

    // 4. Admin accesses same endpoint -> 200 OK
    const adminApiCall = auditStore.queryLogs({ userRoles: ['Admin'] });
    assert.strictEqual(adminApiCall.status, 200);
    assert.strictEqual(adminApiCall.data.totalElements, 1);
  });

  // ---------------------------------------------------------------------------
  // TC-T3-04: Password Change API + Sensitive Sanitization + Zero Web Storage Leak
  // ---------------------------------------------------------------------------
  test('TC-T3-04: Password change flow sanitizes audit payloads and leaves zero Web Storage traces', () => {
    const user = TEST_PERSONAS.learner;
    const requestPayload = {
      currentPassword: 'ExistingSecurePassword123!',
      newPassword: 'BrandNewReplacementPassword456!'
    };

    // 1. Validate change password request contract
    const validation = validateChangePasswordContract(requestPayload);
    assert.strictEqual(validation.valid, true);

    // 2. Audit logging hook sanitizes password payload before persisting
    const auditStore = new AuditLogMockStore();
    const event = auditStore.recordEvent({
      actorId: user.accountId,
      actorUsername: user.emailOrPhone,
      actionType: 'PASSWORD_CHANGE',
      resourceType: 'ACCOUNT',
      resourceId: user.accountId,
      status: 'SUCCESS',
      beforeState: { passwordChangeRequested: true, payload: requestPayload }
    });

    // Assert that the raw passwords are NEVER stored in beforeState
    assert.strictEqual(event.beforeState.payload.currentPassword, '[REDACTED]');
    assert.strictEqual(event.beforeState.payload.newPassword, '[REDACTED]');

    // 3. Audit client localStorage & sessionStorage: zero credentials leaked
    const clientStorage = {
      access_token: 'valid.jwt.token',
      user_info: JSON.stringify({ fullName: user.fullName, emailOrPhone: user.emailOrPhone }),
      HOC_HAN_NGU_AUDIO_SETTINGS: JSON.stringify({ ttsSpeed: 1.0 }),
      HOC_HAN_NGU_WRITING_SETTINGS: JSON.stringify({ showGrid: true })
    };

    const storageAudit = auditWebStorageForPasswords(clientStorage);
    assert.strictEqual(storageAudit.secure, true);
    assert.strictEqual(storageAudit.leakedKeys.length, 0);
  });

  // ---------------------------------------------------------------------------
  // TC-T3-05: SRS Upper Bound Constraint + Profile Revert Button Interaction
  // ---------------------------------------------------------------------------
  test('TC-T3-05: Exceeding SRS upper bound is rejected and clean revert restores valid saved settings', () => {
    const originalServerSettings = { newCardsPerDay: 20, maxReviewPerDay: 50 };

    // 1. User inputs invalid limit exceeding upper bound (150 > 100)
    const invalidInput = 150;
    const boundCheck = validateSrsCardLimitBounds(invalidInput);
    assert.strictEqual(boundCheck.valid, false);
    assert.strictEqual(boundCheck.error, 'Số thẻ mới mỗi ngày không được vượt quá 100');

    // 2. Form state reflects uncommitted edit
    const formState = {
      original: originalServerSettings,
      current: { newCardsPerDay: 150, maxReviewPerDay: 50 }
    };

    // 3. User clicks "Hoàn tác thay đổi" button
    formState.current = { ...originalServerSettings };
    const revertCheck = evaluateSrsButtonStandardization({ label: 'Hoàn tác thay đổi' }, formState);

    assert.strictEqual(revertCheck.labelValid, true);
    assert.strictEqual(revertCheck.revertsCleanly, true);
    assert.strictEqual(formState.current.newCardsPerDay, 20);
  });

  // ---------------------------------------------------------------------------
  // TC-T3-06: Production Configuration Boot + Demo Error Non-Bypass + Navigation Guard
  // ---------------------------------------------------------------------------
  test('TC-T3-06: Production security boot rejects demo downgrade on unauthenticated requests', () => {
    // 1. Container configuration: APP_DEMO_SEED_ACCOUNTS disabled
    const dockerfile = 'ENV PORT=8080 APP_DEMO_SEED_ACCOUNTS=false';
    const parsedConfig = parseDemoSeedSetting(dockerfile);
    assert.strictEqual(parsedConfig.isDisabled, true);

    // 2. Backend JWT secret validated with fail-fast
    const prodSecret = 'prod-jwt-secret-minimum-32-bytes-length-ok!';
    const jwtCheck = validateJwtSecretConfig(prodSecret, 'production');
    assert.strictEqual(jwtCheck.valid, true);

    // 3. Unauthenticated request to protected endpoint returns HTTP 401
    const authenticError = { status: 401, error: 'Unauthorized' };
    const downgradeCheck = evaluateDemoFallbackPolicy(authenticError, { isApiConfigured: true });

    // Must NOT allow demo fallback
    assert.strictEqual(downgradeCheck.allowsFallback, false);
    assert.ok(downgradeCheck.violation.includes('Silent downgrade prohibited'));

    // 4. Navbar for unauthenticated guest renders only login & register, zero management links
    const guestNav = evaluateNavManagementEntry([]);
    assert.strictEqual(guestNav.showManagementLink, false);
  });
});
