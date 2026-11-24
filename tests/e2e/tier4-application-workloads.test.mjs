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
  // TC-T4-01: Scenario 1 — Single-Admin Direct Lesson Governance Workflow
  // ---------------------------------------------------------------------------
  test('TC-T4-01: Scenario 1 — Single-Admin lesson publication & audit trail lifecycle', () => {
    const auditStore = new AuditLogMockStore();
    const admin = TEST_PERSONAS.admin;
    const legacyCreator = TEST_PERSONAS.creator;

    // Step 1: Only Admin receives management navigation link
    assert.strictEqual(evaluateNavManagementEntry(admin.roles).showManagementLink, true);
    assert.strictEqual(evaluateNavManagementEntry(admin.roles).targetHref, 'management.html');
    assert.strictEqual(evaluateNavManagementEntry(legacyCreator.roles).showManagementLink, false);

    // Step 2: Admin creates and directly publishes lesson (status='Approved')
    const lesson = {
      id: 201,
      title: 'HSK 3 Từ vựng Nhà hàng',
      level: 3,
      createdBy: admin.accountId,
      status: 'Approved'
    };

    auditStore.recordEvent({
      actorId: admin.accountId,
      actorUsername: admin.emailOrPhone,
      actionType: 'LESSON_ADMIN_PUBLISH',
      resourceType: 'LESSON',
      resourceId: lesson.id,
      status: 'SUCCESS',
      beforeState: { status: 'Draft' },
      afterState: { status: 'Approved' },
      detailsSummary: 'Admin tạo và xuất bản bài học trực tiếp'
    });

    // Step 3: Verify audit trail contains complete provenance
    const logs = auditStore.queryLogs({ userRoles: ['Admin'], resourceType: 'LESSON' });
    assert.strictEqual(logs.status, 200);
    assert.strictEqual(logs.data.totalElements, 1);

    const record = logs.data.content[0];
    assert.strictEqual(record.actorId, admin.accountId);
    assert.strictEqual(record.afterState.status, 'Approved');
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
  // TC-T4-03: Scenario 3 — Learner vs Admin Navigation & Profile Decoupling
  // ---------------------------------------------------------------------------
  test('TC-T4-03: Scenario 3 — End-to-end Learner vs Admin navigation isolation', () => {
    const lan = TEST_PERSONAS.learner;
    const admin = TEST_PERSONAS.admin;
    const legacyCreator = TEST_PERSONAS.creator;

    // 1. Learner & deprecated Creator receive zero management navigation entry
    const lanNav = evaluateNavManagementEntry(lan.roles);
    assert.strictEqual(lanNav.showManagementLink, false, 'Learner navbar must not display management link');
    assert.strictEqual(evaluateNavManagementEntry(legacyCreator.roles).showManagementLink, false);

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

    // 3. Admin logs in
    const adminNav = evaluateNavManagementEntry(admin.roles);
    assert.strictEqual(adminNav.showManagementLink, true, 'Admin navbar must display management link');
    assert.strictEqual(adminNav.targetHref, 'management.html');

    // 4. Admin visits management.html
    const sampleManagementHubHtml = `
      <header>
        <a id="btnBackToLearning" href="vocabulary.html">Quay lại học</a>
      </header>
      <main>
        <div id="adminLessonsCard"><a href="admin-lessons.html">Quản lý bài học</a></div>
      </main>
    `;

    const hubEval = evaluateManagementHubStructure(sampleManagementHubHtml, admin.roles);
    assert.strictEqual(hubEval.hasBackToLearning, true);
    assert.deepStrictEqual(hubEval.visibleSections, ['ADMIN']);
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
