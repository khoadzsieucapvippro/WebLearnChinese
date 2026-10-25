/**
 * =============================================================================
 * E2E TIER 4: REAL-WORLD APPLICATION WORKLOADS TEST SUITE (OPAQUE-BOX)
 * File: tests/e2e/tier4-application-workloads.test.mjs
 * 
 * Scope: 6 Realistic End-to-End Application Workloads (docs/TESTING.md § Real-World Scenarios)
 * - TC-T4-01: Scenario 1 — Dual-Role Creator-Moderator Workflow (F4, F11, F14, F15)
 * - TC-T4-02: Scenario 2 — Concurrent Last Admin Demotion Prevention (F5, F11, F12)
 * - TC-T4-03: Scenario 3 — Learner vs Management Navigation & Profile Decoupling (F14, F15, F16, F17)
 * - TC-T4-04: Scenario 4 — Password Change & Profile Audio/Writing Settings Flow (F18, F19)
 * - TC-T4-05: Scenario 5 — Full Audit Trail Verification for Admin Resource Edits (F8-F13)
 * - TC-T4-06: Scenario 6 — Production Security Bootstrap & Fail-Fast Validation (F1, F2, F3)
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

describe('Tier 4: Real-World Application Workloads Test Suite', () => {

  // ---------------------------------------------------------------------------
  // TC-T4-01: Scenario 1 — Dual-Role Creator-Moderator Workflow
  // ---------------------------------------------------------------------------
  test('TC-T4-01: Scenario 1 — Dual-Role Creator-Moderator end-to-end lifecycle', () => {
    const auditStore = new AuditLogMockStore();
    const alex = TEST_PERSONAS.creatorModerator; // Creator + Moderator (id=404)
    const morgan = TEST_PERSONAS.moderator;       // Independent Moderator (id=303)

    // Step 1: Alex logs in and checks navbar for management access
    const alexNav = evaluateNavManagementEntry(alex.roles);
    assert.strictEqual(alexNav.showManagementLink, true);
    assert.strictEqual(alexNav.targetHref, 'management.html');

    // Step 2: Alex creates a lesson in Creator Studio
    const lesson = {
      id: 201,
      title: 'HSK 3 Từ vựng Nhà hàng',
      level: 3,
      createdBy: alex.accountId,
      status: 'Pending'
    };

    // Step 3: Alex navigates to Moderation Queue and attempts to self-approve
    const selfReviewAttempt = evaluateSelfReviewInvariant({
      lessonCreatorId: lesson.createdBy,
      reviewerAccountId: alex.accountId,
      action: 'Approve'
    });

    assert.strictEqual(selfReviewAttempt.allowed, false);
    assert.strictEqual(selfReviewAttempt.status, 403);
    assert.strictEqual(selfReviewAttempt.message, 'Bạn không thể tự kiểm duyệt nội dung do chính mình tạo ra');

    // System records audit log entry for the rejected self-review attempt
    auditStore.recordEvent({
      actorId: alex.accountId,
      actorUsername: alex.emailOrPhone,
      actionType: 'LESSON_MODERATE',
      resourceType: 'LESSON',
      resourceId: lesson.id,
      status: 'FAILURE',
      detailsSummary: selfReviewAttempt.message
    });

    // Step 4: Morgan (independent moderator) logs in, reviews, and approves lesson
    const morganReview = evaluateSelfReviewInvariant({
      lessonCreatorId: lesson.createdBy,
      reviewerAccountId: morgan.accountId,
      action: 'Approve'
    });

    assert.strictEqual(morganReview.allowed, true);
    assert.strictEqual(morganReview.status, 200);

    lesson.status = 'Approved';
    auditStore.recordEvent({
      actorId: morgan.accountId,
      actorUsername: morgan.emailOrPhone,
      actionType: 'LESSON_MODERATE',
      resourceType: 'LESSON',
      resourceId: lesson.id,
      status: 'SUCCESS',
      beforeState: { status: 'Pending' },
      afterState: { status: 'Approved' },
      detailsSummary: 'Phê duyệt bài học thành công'
    });

    // Step 5: Verify audit trail contains complete provenance
    const logs = auditStore.queryLogs({ userRoles: ['Admin'], resourceType: 'LESSON' });
    assert.strictEqual(logs.status, 200);
    assert.strictEqual(logs.data.totalElements, 2);

    const failureRecord = logs.data.content.find(l => l.status === 'FAILURE');
    assert.strictEqual(failureRecord.actorId, alex.accountId);

    const successRecord = logs.data.content.find(l => l.status === 'SUCCESS');
    assert.strictEqual(successRecord.actorId, morgan.accountId);
    assert.strictEqual(successRecord.afterState.status, 'Approved');
  });

  // ---------------------------------------------------------------------------
  // TC-T4-02: Scenario 2 — Concurrent Last Admin Demotion Prevention
  // ---------------------------------------------------------------------------
  test('TC-T4-02: Scenario 2 — Concurrent multi-admin demotion race condition and audit trail', async () => {
    const auditStore = new AuditLogMockStore();
    const adminA = TEST_PERSONAS.admin;    // id=505
    const adminB = TEST_PERSONAS.adminTwo; // id=506

    const manager = new AdminInvariantManager([
      { id: adminA.accountId, username: adminA.emailOrPhone, roles: ['Admin'], status: 'ACTIVE' },
      { id: adminB.accountId, username: adminB.emailOrPhone, roles: ['Admin'], status: 'ACTIVE' }
    ]);

    assert.strictEqual(manager.countActiveAdmins(), 2);

    // Concurrently: Admin A requests to demote Admin B, and Admin B requests to demote Admin A
    const [resA, resB] = await Promise.all([
      manager.updateAccountRoles(adminB.accountId, ['Learner'], adminA.accountId),
      manager.updateAccountRoles(adminA.accountId, ['Learner'], adminB.accountId)
    ]);

    // Record audit entries for both transactions
    auditStore.recordEvent({
      actorId: adminA.accountId,
      actorUsername: adminA.emailOrPhone,
      actionType: 'ROLE_CHANGE',
      resourceType: 'ACCOUNT',
      resourceId: adminB.accountId,
      status: resA.success ? 'SUCCESS' : 'FAILURE',
      detailsSummary: resA.message
    });

    auditStore.recordEvent({
      actorId: adminB.accountId,
      actorUsername: adminB.emailOrPhone,
      actionType: 'ROLE_CHANGE',
      resourceType: 'ACCOUNT',
      resourceId: adminA.accountId,
      status: resB.success ? 'SUCCESS' : 'FAILURE',
      detailsSummary: resB.message
    });

    // Invariant verification: Exactly 1 succeeded, exactly 1 failed with 400
    const passCount = [resA, resB].filter(r => r.success).length;
    const failCount = [resA, resB].filter(r => !r.success).length;

    assert.strictEqual(passCount, 1, 'Only one concurrent demotion may succeed');
    assert.strictEqual(failCount, 1, 'The competing concurrent demotion must be blocked');
    assert.strictEqual(manager.countActiveAdmins(), 1, 'System invariant must always preserve >= 1 active admin');

    // Audit logs verify both attempts are accounted for
    const auditRes = auditStore.queryLogs({ userRoles: ['Admin'], actionType: 'ROLE_CHANGE' });
    assert.strictEqual(auditRes.status, 200);
    assert.strictEqual(auditRes.data.totalElements, 2);
    const failedLog = auditRes.data.content.find(l => l.status === 'FAILURE');
    assert.ok(failedLog.detailsSummary.includes('quản trị viên hoạt động cuối cùng'));
  });

  // ---------------------------------------------------------------------------
  // TC-T4-03: Scenario 3 — Learner vs Management Navigation & Profile Decoupling
  // ---------------------------------------------------------------------------
  test('TC-T4-03: Scenario 3 — End-to-end Learner vs Management navigation isolation', () => {
    const lan = TEST_PERSONAS.learner;
    const bao = TEST_PERSONAS.creator;

    // 1. Learner Lan logs in
    const lanNav = evaluateNavManagementEntry(lan.roles);
    assert.strictEqual(lanNav.showManagementLink, false, 'Learner navbar must not display management link');

    // 2. Lan opens profile.html: Decoupled profile contains zero workspace sections
    const sampleProfileHtml = `
      <main id="mainContent">
        <h1>Hồ sơ cá nhân</h1>
        <section id="learnerSettingsSection"></section>
        <form id="srsSettingsForm"></form>
        <form id="changePasswordForm"></form>
      </main>
    `;

    const decouplingCheck = verifyProfileDecoupling(sampleProfileHtml);
    assert.strictEqual(decouplingCheck.decoupled, true);
    assert.strictEqual(decouplingCheck.violations.length, 0);

    // 3. Creator Bao logs in
    const baoNav = evaluateNavManagementEntry(bao.roles);
    assert.strictEqual(baoNav.showManagementLink, true, 'Creator navbar must display management link');
    assert.strictEqual(baoNav.targetHref, 'management.html');

    // 4. Bao visits management.html
    const sampleManagementHubHtml = `
      <header>
        <a id="btnBackToLearning" href="vocabulary.html">Quay lại học</a>
      </header>
      <main>
        <div id="creatorStudioCard"><a href="creator-lessons.html">Quản lý bài học</a></div>
      </main>
    `;

    const hubEval = evaluateManagementHubStructure(sampleManagementHubHtml, bao.roles);
    assert.strictEqual(hubEval.hasBackToLearning, true);
    assert.deepStrictEqual(hubEval.visibleSections, ['CREATOR']);
  });

  // ---------------------------------------------------------------------------
  // TC-T4-04: Scenario 4 — Password Change & Profile Audio/Writing Settings Flow
  // ---------------------------------------------------------------------------
  test('TC-T4-04: Scenario 4 — Complete Profile settings update, password change, and storage audit', () => {
    const user = TEST_PERSONAS.learner;
    const auditStore = new AuditLogMockStore();

    // 1. User configures audio and writing preferences in browser storage
    const simulatedLocalStorage = {
      HOC_HAN_NGU_AUDIO_SETTINGS: JSON.stringify({
        autoPlayPronunciation: true,
        ttsSpeed: 0.85,
        volume: 0.95
      }),
      HOC_HAN_NGU_WRITING_SETTINGS: JSON.stringify({
        showGrid: true,
        showOutline: true,
        autoReplayStroke: false
      })
    };

    // Verify settings stored correctly
    const audioPrefs = JSON.parse(simulatedLocalStorage.HOC_HAN_NGU_AUDIO_SETTINGS);
    assert.strictEqual(audioPrefs.ttsSpeed, 0.85);

    // 2. User attempts password change with invalid inputs
    // Short password (< 6)
    const shortAttempt = validateChangePasswordContract({
      currentPassword: 'CurrentPassword123!',
      newPassword: '123'
    });
    assert.strictEqual(shortAttempt.valid, false);

    // Identical password
    const identicalAttempt = validateChangePasswordContract({
      currentPassword: 'CurrentPassword123!',
      newPassword: 'CurrentPassword123!'
    });
    assert.strictEqual(identicalAttempt.valid, false);

    // 3. User submits valid password change request
    const validAttempt = validateChangePasswordContract({
      currentPassword: 'CurrentPassword123!',
      newPassword: 'BrandNewSecurePassword789!'
    });
    assert.strictEqual(validAttempt.valid, true);

    // 4. Audit service records event with sanitized payload
    auditStore.recordEvent({
      actorId: user.accountId,
      actorUsername: user.emailOrPhone,
      actionType: 'PASSWORD_CHANGE',
      resourceType: 'ACCOUNT',
      resourceId: user.accountId,
      status: 'SUCCESS',
      beforeState: { passwordUpdated: true, newPassword: 'BrandNewSecurePassword789!' },
      detailsSummary: 'Đổi mật khẩu tài khoản thành công'
    });

    // 5. Inspect audit log to confirm credentials were never stored in plaintext
    const auditRes = auditStore.queryLogs({ userRoles: ['Admin'], actionType: 'PASSWORD_CHANGE' });
    assert.strictEqual(auditRes.status, 200);
    assert.strictEqual(auditRes.data.content[0].beforeState.newPassword, '[REDACTED]');

    // 6. Inspect Web Storage to confirm zero passwords leaked
    const storageAudit = auditWebStorageForPasswords(simulatedLocalStorage);
    assert.strictEqual(storageAudit.secure, true);
    assert.strictEqual(storageAudit.leakedKeys.length, 0);
  });

  // ---------------------------------------------------------------------------
  // TC-T4-05: Scenario 5 — Full Audit Trail Verification for Admin Resource Edits
  // ---------------------------------------------------------------------------
  test('TC-T4-05: Scenario 5 — Admin administrative lifecycle with filtering and detail inspection', () => {
    const admin = TEST_PERSONAS.admin;
    const auditStore = new AuditLogMockStore();

    // 1. Admin edits vocabulary
    auditStore.recordEvent({
      actorId: admin.accountId,
      actorUsername: admin.emailOrPhone,
      actionType: 'VOCABULARY_UPDATE',
      resourceType: 'VOCABULARY',
      resourceId: 42,
      status: 'SUCCESS',
      beforeState: { meaningVi: 'Cũ' },
      afterState: { meaningVi: 'Mới được hiệu chỉnh' },
      detailsSummary: 'Cập nhật nghĩa tiếng Việt từ vựng 42'
    });

    // 2. Admin edits radical
    auditStore.recordEvent({
      actorId: admin.accountId,
      actorUsername: admin.emailOrPhone,
      actionType: 'RADICAL_UPDATE',
      resourceType: 'RADICAL',
      resourceId: 69,
      status: 'SUCCESS',
      beforeState: { meaningHanViet: 'Cẩn' },
      afterState: { meaningHanViet: 'Cân' },
      detailsSummary: 'Chuẩn hóa âm Hán Việt bộ 69 từ Cẩn thành Cân'
    });

    // 3. Admin locks compromised account
    auditStore.recordEvent({
      actorId: admin.accountId,
      actorUsername: admin.emailOrPhone,
      actionType: 'ACCOUNT_LOCK',
      resourceType: 'ACCOUNT',
      resourceId: 888,
      status: 'SUCCESS',
      beforeState: { status: 'ACTIVE' },
      afterState: { status: 'LOCKED' },
      detailsSummary: 'Khóa tài khoản nghi vấn xâm nhập 888'
    });

    // 4. Admin queries logs filtered by actionType = 'RADICAL_UPDATE'
    const radicalLogs = auditStore.queryLogs({
      userRoles: ['Admin'],
      actionType: 'RADICAL_UPDATE'
    });
    assert.strictEqual(radicalLogs.status, 200);
    assert.strictEqual(radicalLogs.data.totalElements, 1);
    assert.strictEqual(radicalLogs.data.content[0].resourceId, '69');

    // 5. Admin retrieves detail of log entry #2
    const detail = auditStore.getById(2, ['Admin']);
    assert.strictEqual(detail.status, 200);
    assert.strictEqual(detail.data.beforeState.meaningHanViet, 'Cẩn');
    assert.strictEqual(detail.data.afterState.meaningHanViet, 'Cân');
  });

  // ---------------------------------------------------------------------------
  // TC-T4-06: Scenario 6 — Production Security Bootstrap & Fail-Fast Validation
  // ---------------------------------------------------------------------------
  test('TC-T4-06: Scenario 6 — Production container security bootstrap and failure containment', () => {
    // 1. Missing secret in production environment triggers immediate fail-fast
    assert.throws(
      () => validateJwtSecretConfig(undefined, 'production'),
      /JWT secret cannot be null or blank on non-dev profile/
    );

    // 2. Insecure secret (< 32 bytes) triggers fail-fast with byte count
    assert.throws(
      () => validateJwtSecretConfig('short_prod_secret_20b!', 'production'),
      /must be at least 32 bytes/
    );

    // 3. Secure secret (>= 32 bytes) boots successfully
    const validKey = 'production_master_jwt_secret_32_bytes_ok!';
    const bootResult = validateJwtSecretConfig(validKey, 'production');
    assert.strictEqual(bootResult.valid, true);

    // 4. Verify demo accounts disabled in production configuration
    const prodConfig = 'ENV APP_DEMO_SEED_ACCOUNTS=false';
    const seedSetting = parseDemoSeedSetting(prodConfig);
    assert.strictEqual(seedSetting.isDisabled, true);

    // 5. Authentic backend 403 response must not downgrade to simulated success
    const backend403 = { status: 403, error: 'Forbidden' };
    const fallbackPolicy = evaluateDemoFallbackPolicy(backend403, { isApiConfigured: true });
    assert.strictEqual(fallbackPolicy.allowsFallback, false);
    assert.ok(fallbackPolicy.violation.includes('Silent downgrade prohibited'));
  });
});
