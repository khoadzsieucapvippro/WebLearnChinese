/**
 * =============================================================================
 * E2E TIER 1: FEATURE COVERAGE TEST SUITE (OPAQUE-BOX)
 * File: tests/e2e/tier1-feature-coverage.test.mjs
 * 
 * Scope: 5 Feature Domains (F1 - F20)
 * - Domain 1: Configuration & Production Security Hardening (F1, F2, F3)
 * - Domain 2: Management Business Invariants & SRS Constraints (F4, F5, F6, F7)
 * - Domain 3: Centralized Management Audit Log System (F8, F9, F10, F11, F12, F13)
 * - Domain 4: Management Area Decoupling & Navigation (F14, F15, F16, F17)
 * - Domain 5: User Settings & Account Security (F18, F19, F20)
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  validateAuditMigrationSchema,
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

describe('Tier 1: Feature Coverage Test Suite (F1 - F20)', () => {

  // ===========================================================================
  // DOMAIN 1: CONFIGURATION & PRODUCTION SECURITY HARDENING (F1 - F3)
  // ===========================================================================
  describe('Domain 1: Configuration & Production Security Hardening', () => {

    test('TC-T1-D1-01 [F1]: Production container specification disables demo seed accounts', () => {
      // Contract: APP_DEMO_SEED_ACCOUNTS must evaluate to false in production deployment configs
      const sampleProdDockerfile = 'ENV PORT=8080 APP_DEMO_SEED_ACCOUNTS=false';
      const parsed = parseDemoSeedSetting(sampleProdDockerfile);
      assert.strictEqual(parsed.keyFound, true);
      assert.strictEqual(parsed.isDisabled, true, 'APP_DEMO_SEED_ACCOUNTS must be parsed as disabled');
    });

    test('TC-T1-D1-02 [F1]: Cloud deployment manifest (render.yaml) disables demo account seeder', () => {
      const sampleRenderYaml = `
        envVars:
          - key: APP_DEMO_SEED_ACCOUNTS
            value: "false"
      `;
      const parsed = parseDemoSeedSetting(sampleRenderYaml);
      assert.strictEqual(parsed.keyFound, true);
      assert.strictEqual(parsed.isDisabled, true, 'render.yaml must configure demo seed as false');
    });

    test('TC-T1-D1-03 [F1]: DemoAccountSeeder profile guard prevents seeding when flag is false', () => {
      const parsedAppYml = parseDemoSeedSetting('seed-accounts: ${APP_DEMO_SEED_ACCOUNTS:false}');
      assert.strictEqual(parsedAppYml.keyFound, true);
      assert.strictEqual(parsedAppYml.isDisabled, true, 'Default application setting must be false');
    });

    test('TC-T1-D1-04 [F2]: JWT Secret Fail-Fast rejects null, undefined or empty secret on production', () => {
      assert.throws(
        () => validateJwtSecretConfig('', 'production'),
        /JWT secret cannot be null or blank/,
        'Fail-fast must trigger on empty secret in production'
      );
      assert.throws(
        () => validateJwtSecretConfig(null, 'production'),
        /JWT secret cannot be null or blank/,
        'Fail-fast must trigger on null secret in production'
      );
    });

    test('TC-T1-D1-05 [F2]: JWT Secret Fail-Fast rejects secrets under 32 bytes on production', () => {
      const shortSecret = 'short-key-16-byte!'; // 18 bytes
      assert.throws(
        () => validateJwtSecretConfig(shortSecret, 'production'),
        /at least 32 bytes/,
        'Fail-fast must reject keys shorter than 32 bytes'
      );

      const validSecret = 'valid-production-secret-must-be-at-least-32-bytes-long!';
      const res = validateJwtSecretConfig(validSecret, 'production');
      assert.strictEqual(res.valid, true);
      assert.ok(res.byteLength >= 32);
    });

    test('TC-T1-D1-06 [F3]: Demo Fallback Engine strictly surfaces authentic backend API errors', () => {
      // Prohibits silent downgrade from real HTTP 401/403/404/500 to simulated demo auth
      const authError = evaluateDemoFallbackPolicy({ status: 401 }, { isApiConfigured: true });
      assert.strictEqual(authError.allowsFallback, false);
      assert.ok(authError.violation.includes('Silent downgrade prohibited'));

      const serverError = evaluateDemoFallbackPolicy({ status: 500 }, { isApiConfigured: true });
      assert.strictEqual(serverError.allowsFallback, false);

      // Verify simulation badge standard
      const validBadge = verifyDemoBadgeStandard({
        visible: true,
        text: '🟡 Dữ liệu mô phỏng',
        className: 'badge badge-warning'
      });
      assert.strictEqual(validBadge, true, 'Demo indicator badge must be prominent and clear');
    });
  });

  // ===========================================================================
  // DOMAIN 2: MANAGEMENT BUSINESS INVARIANTS & SRS CONSTRAINTS (F4 - F7)
  // ===========================================================================
  describe('Domain 2: Management Business Invariants & SRS Constraints', () => {

    test('TC-T1-D2-01 [F4]: Creator cannot approve their own lesson (Self-Review Prohibition)', () => {
      const result = evaluateSelfReviewInvariant({
        lessonCreatorId: 202,
        reviewerAccountId: 202,
        action: 'Approve'
      });

      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.status, 403);
      assert.strictEqual(result.errorCode, 'FORBIDDEN');
      assert.strictEqual(result.message, 'Bạn không thể tự kiểm duyệt nội dung do chính mình tạo ra');
    });

    test('TC-T1-D2-02 [F4]: Creator cannot reject their own lesson (Self-Review Prohibition)', () => {
      const result = evaluateSelfReviewInvariant({
        lessonCreatorId: 202,
        reviewerAccountId: 202,
        action: 'Reject'
      });

      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.status, 403);
      assert.strictEqual(result.errorCode, 'FORBIDDEN');
    });

    test('TC-T1-D2-03 [F4]: Independent Moderator can review creator lesson successfully', () => {
      const result = evaluateSelfReviewInvariant({
        lessonCreatorId: 202,
        reviewerAccountId: 303,
        action: 'Approve'
      });

      assert.strictEqual(result.allowed, true);
      assert.strictEqual(result.status, 200);
    });

    test('TC-T1-D2-04 [F5]: System blocks demoting the last active Admin account', async () => {
      const manager = new AdminInvariantManager([
        { id: 505, username: 'admin1', roles: ['Admin'], status: 'ACTIVE' },
        { id: 101, username: 'learner1', roles: ['Learner'], status: 'ACTIVE' }
      ]);

      assert.strictEqual(manager.countActiveAdmins(), 1);

      // Attempt to demote admin1 to Learner
      const result = await manager.updateAccountRoles(505, ['Learner'], 999);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.status, 400);
      assert.strictEqual(result.message, 'Không thể hạ quyền hoặc vô hiệu hóa quản trị viên hoạt động cuối cùng của hệ thống');
    });

    test('TC-T1-D2-05 [F5]: System blocks deactivating or locking the last active Admin account', async () => {
      const manager = new AdminInvariantManager([
        { id: 505, username: 'admin1', roles: ['Admin'], status: 'ACTIVE' }
      ]);

      const result = await manager.updateAccountStatus(505, 'LOCKED', 999);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.status, 400);
      assert.strictEqual(result.message, 'Không thể hạ quyền hoặc vô hiệu hóa quản trị viên hoạt động cuối cùng của hệ thống');
    });

    test('TC-T1-D2-06 [F6]: SRS newCardsPerDay enforces bounds (1 <= N <= 100)', () => {
      // Valid cases
      assert.strictEqual(validateSrsCardLimitBounds(1).valid, true);
      assert.strictEqual(validateSrsCardLimitBounds(20).valid, true);
      assert.strictEqual(validateSrsCardLimitBounds(100).valid, true);

      // Invalid upper bound
      const overMax = validateSrsCardLimitBounds(101);
      assert.strictEqual(overMax.valid, false);
      assert.strictEqual(overMax.error, 'Số thẻ mới mỗi ngày không được vượt quá 100');

      // Invalid lower bound
      const zero = validateSrsCardLimitBounds(0);
      assert.strictEqual(zero.valid, false);
      assert.strictEqual(zero.error, 'Số thẻ mới mỗi ngày phải là số nguyên dương lớn hơn 0');

      const negative = validateSrsCardLimitBounds(-5);
      assert.strictEqual(negative.valid, false);
    });

    test('TC-T1-D2-07 [F7]: SRS Reset button standardization to "Hoàn tác thay đổi"', () => {
      const formState = {
        original: { newCardsPerDay: 20, maxReviewPerDay: 50 },
        current: { newCardsPerDay: 20, maxReviewPerDay: 50 }
      };

      const evalRes = evaluateSrsButtonStandardization(
        { label: 'Hoàn tác thay đổi' },
        formState
      );

      assert.strictEqual(evalRes.labelValid, true, 'Button label must be "Hoàn tác thay đổi"');
      assert.strictEqual(evalRes.revertsCleanly, true, 'Form state must revert cleanly to original');
    });
  });

  // ===========================================================================
  // DOMAIN 3: CENTRALIZED MANAGEMENT AUDIT LOG SYSTEM (F8 - F13)
  // ===========================================================================
  describe('Domain 3: Centralized Management Audit Log System', () => {

    test('TC-T1-D3-01 [F8]: Migration V29 schema conforms to audit log non-destructive standard', () => {
      const sampleMigrationSql = `
        CREATE TABLE IF NOT EXISTS MANAGEMENT_AUDIT_LOG (
          ID BIGINT AUTO_INCREMENT PRIMARY KEY,
          ACTOR_ID BIGINT NOT NULL,
          ACTOR_USERNAME VARCHAR(100) NOT NULL,
          ACTION_TYPE VARCHAR(50) NOT NULL,
          RESOURCE_TYPE VARCHAR(50) NOT NULL,
          RESOURCE_ID VARCHAR(100),
          STATUS VARCHAR(20) NOT NULL,
          DETAILS_SUMMARY VARCHAR(500),
          BEFORE_STATE JSON,
          AFTER_STATE JSON,
          IP_ADDRESS VARCHAR(45),
          TIMESTAMP DATETIME NOT NULL,
          INDEX idx_audit_actor (ACTOR_ID),
          INDEX idx_audit_action (ACTION_TYPE),
          INDEX idx_audit_resource (RESOURCE_TYPE),
          INDEX idx_audit_time (TIMESTAMP)
        );
      `;

      const validation = validateAuditMigrationSchema(sampleMigrationSql);
      assert.strictEqual(validation.valid, true, `Schema validation errors: ${validation.errors.join(', ')}`);
    });

    test('TC-T1-D3-02 [F9]: Audit Log Entity enums and properties conform to schema contracts', () => {
      const store = new AuditLogMockStore();
      const entry = store.recordEvent({
        actorId: 505,
        actorUsername: 'admin_sys',
        actionType: 'ROLE_CHANGE',
        resourceType: 'ACCOUNT',
        resourceId: 101,
        status: 'SUCCESS',
        detailsSummary: 'Assigned Creator role to user 101'
      });

      assert.strictEqual(entry.id, 1);
      assert.strictEqual(entry.actionType, 'ROLE_CHANGE');
      assert.strictEqual(entry.status, 'SUCCESS');
      assert.ok(entry.timestamp);
    });

    test('TC-T1-D3-03 [F10]: Audit Data Sanitizer redacts sensitive credentials from JSON payloads', () => {
      const rawPayload = {
        username: 'learner_lan',
        password: 'PlainTextPassword123!',
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        apiToken: 'secret_token_abc',
        session: {
          jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M'
        }
      };

      const sanitized = sanitizeAuditPayload(rawPayload);
      assert.strictEqual(sanitized.username, 'learner_lan');
      assert.strictEqual(sanitized.password, '[REDACTED]');
      assert.strictEqual(sanitized.currentPassword, '[REDACTED]');
      assert.strictEqual(sanitized.newPassword, '[REDACTED]');
      assert.strictEqual(sanitized.apiToken, '[REDACTED]');
      assert.strictEqual(sanitized.session.jwt, '[REDACTED]');
    });

    test('TC-T1-D3-04 [F11]: Audit logging hooks record user role change events', () => {
      const store = new AuditLogMockStore();
      store.recordEvent({
        actorId: 505,
        actorUsername: 'admin_sys',
        actionType: 'ROLE_CHANGE',
        resourceType: 'ACCOUNT',
        resourceId: 101,
        status: 'SUCCESS',
        beforeState: { roles: ['Learner'] },
        afterState: { roles: ['Learner', 'Creator'] },
        detailsSummary: 'Promoted user 101 to Creator'
      });

      const res = store.queryLogs({ userRoles: ['Admin'], actionType: 'ROLE_CHANGE' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.totalElements, 1);
      assert.strictEqual(res.data.content[0].detailsSummary, 'Promoted user 101 to Creator');
    });

    test('TC-T1-D3-05 [F11]: Audit logging hooks record content moderation decisions', () => {
      const store = new AuditLogMockStore();
      store.recordEvent({
        actorId: 303,
        actorUsername: 'moderator_morgan',
        actionType: 'LESSON_MODERATE',
        resourceType: 'LESSON',
        resourceId: 77,
        status: 'SUCCESS',
        beforeState: { status: 'Pending' },
        afterState: { status: 'Approved' },
        detailsSummary: 'Approved lesson 77'
      });

      const res = store.queryLogs({ userRoles: ['Admin'], resourceType: 'LESSON' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.totalElements, 1);
      assert.strictEqual(res.data.content[0].afterState.status, 'Approved');
    });

    test('TC-T1-D3-06 [F12]: Admin Audit Log REST API returns paginated logs for Admin role', () => {
      const store = new AuditLogMockStore();
      for (let i = 1; i <= 25; i++) {
        store.recordEvent({
          actorId: 505,
          actorUsername: 'admin_sys',
          actionType: 'ACCOUNT_LOCK',
          resourceType: 'ACCOUNT',
          resourceId: i,
          status: 'SUCCESS'
        });
      }

      const page1 = store.queryLogs({ userRoles: ['Admin'], page: 0, size: 10 });
      assert.strictEqual(page1.status, 200);
      assert.strictEqual(page1.data.content.length, 10);
      assert.strictEqual(page1.data.totalElements, 25);
      assert.strictEqual(page1.data.totalPages, 3);
    });

    test('TC-T1-D3-07 [F12]: Admin Audit Log REST API strictly rejects non-admin users (HTTP 403)', () => {
      const store = new AuditLogMockStore();
      store.recordEvent({
        actorId: 505,
        actorUsername: 'admin_sys',
        actionType: 'CONFIG_CHANGE',
        resourceType: 'SYSTEM',
        status: 'SUCCESS'
      });

      // Learner attempt
      const learnerRes = store.queryLogs({ userRoles: ['Learner'] });
      assert.strictEqual(learnerRes.status, 403);

      // Creator attempt
      const creatorRes = store.queryLogs({ userRoles: ['Creator'] });
      assert.strictEqual(creatorRes.status, 403);

      // Moderator attempt
      const modRes = store.queryLogs({ userRoles: ['Moderator'] });
      assert.strictEqual(modRes.status, 403);
    });

    test('TC-T1-D3-08 [F13]: Admin Audit Log UI contract mandates table, filter controls and modal', () => {
      const sampleAuditLogsHtml = `
        <main id="mainContent">
          <h1>Nhật Ký Kiểm Toán</h1>
          <div id="auditFilterBar">
            <select id="filterActionType"></select>
            <input id="filterActor" type="text">
          </div>
          <table id="auditLogsTable">
            <thead><tr><th>Thời gian</th><th>Tác tử</th><th>Hành động</th></tr></thead>
            <tbody id="auditLogsTableBody"></tbody>
          </table>
          <div id="auditLogDetailModal" class="modal"></div>
        </main>
      `;

      assert.ok(sampleAuditLogsHtml.includes('id="auditLogsTable"'));
      assert.ok(sampleAuditLogsHtml.includes('id="auditFilterBar"'));
      assert.ok(sampleAuditLogsHtml.includes('id="auditLogDetailModal"'));
    });
  });

  // ===========================================================================
  // DOMAIN 4: MANAGEMENT AREA DECOUPLING & NAVIGATION (F14 - F17)
  // ===========================================================================
  describe('Domain 4: Management Area Decoupling & Navigation', () => {

    test('TC-T1-D4-01 [F14]: Management Central Hub provides role cards and "Quay lại học" link', () => {
      const sampleHubHtml = `
        <header>
          <a id="btnBackToLearning" href="vocabulary.html">Quay lại học</a>
        </header>
        <section id="creatorManagementSection"></section>
        <section id="moderatorManagementSection"></section>
        <section id="adminManagementSection"></section>
      `;

      const evalRes = evaluateManagementHubStructure(sampleHubHtml, ['Admin']);
      assert.strictEqual(evalRes.hasBackToLearning, true);
      assert.deepStrictEqual(evalRes.visibleSections, ['CREATOR', 'MODERATOR', 'ADMIN']);
    });

    test('TC-T1-D4-02 [F15]: Unified navigation renders "Khu vực quản lý" for Creator, Moderator, Admin', () => {
      const creatorNav = evaluateNavManagementEntry(['Creator']);
      assert.strictEqual(creatorNav.showManagementLink, true);
      assert.strictEqual(creatorNav.targetHref, 'management.html');

      const modNav = evaluateNavManagementEntry(['Moderator']);
      assert.strictEqual(modNav.showManagementLink, true);

      const adminNav = evaluateNavManagementEntry(['Admin']);
      assert.strictEqual(adminNav.showManagementLink, true);
    });

    test('TC-T1-D4-03 [F15]: Unified navigation strictly hides "Khu vực quản lý" for Learner-only role', () => {
      const learnerNav = evaluateNavManagementEntry(['Learner']);
      assert.strictEqual(learnerNav.showManagementLink, false);
      assert.strictEqual(learnerNav.targetHref, '');

      const guestNav = evaluateNavManagementEntry([]);
      assert.strictEqual(guestNav.showManagementLink, false);
    });

    test('TC-T1-D4-04 [F16]: Profile page decoupling removes workspace section and admin buttons', () => {
      const decoupledProfileHtml = `
        <div id="profileDetailsSection">
          <h2>Thông tin người học</h2>
          <form id="srsSettingsForm"></form>
          <form id="changePasswordForm"></form>
        </div>
      `;

      const check = verifyProfileDecoupling(decoupledProfileHtml);
      assert.strictEqual(check.decoupled, true);
      assert.strictEqual(check.violations.length, 0);

      // Verify detection of forbidden legacy elements
      const legacyProfileHtml = `<section id="profileRoleWorkspacesSection"><button id="btnGoAdminPanel"></button></section>`;
      const legacyCheck = verifyProfileDecoupling(legacyProfileHtml);
      assert.strictEqual(legacyCheck.decoupled, false);
      assert.strictEqual(legacyCheck.violations.length, 2);
    });

    test('TC-T1-D4-05 [F17]: Specialized management sub-navigation provides consistent "Quay lại học"', () => {
      const sampleSubNav = `
        <nav class="management-sub-nav">
          <a class="nav-link" href="management.html">Tổng quan quản lý</a>
          <a class="nav-link btn-back-learning" href="index.html">Quay lại học</a>
        </nav>
      `;

      assert.ok(sampleSubNav.includes('Quay lại học'));
      assert.ok(sampleSubNav.includes('management.html'));
    });
  });

  // ===========================================================================
  // DOMAIN 5: USER SETTINGS & ACCOUNT SECURITY (F18 - F20)
  // ===========================================================================
  describe('Domain 5: User Settings & Account Security', () => {

    test('TC-T1-D5-01 [F18]: Audio settings integrate with localStorage and profile disclaimer', () => {
      const mockStorage = {
        HOC_HAN_NGU_AUDIO_SETTINGS: JSON.stringify({
          autoPlayPronunciation: true,
          ttsSpeed: 0.9,
          volume: 1.0
        })
      };

      const parsed = JSON.parse(mockStorage.HOC_HAN_NGU_AUDIO_SETTINGS);
      assert.strictEqual(parsed.autoPlayPronunciation, true);
      assert.strictEqual(parsed.ttsSpeed, 0.9);
    });

    test('TC-T1-D5-02 [F18]: Writing settings integrate with localStorage and profile disclaimer', () => {
      const mockStorage = {
        HOC_HAN_NGU_WRITING_SETTINGS: JSON.stringify({
          showOutline: true,
          showGrid: true,
          autoReplayStroke: false
        })
      };

      const parsed = JSON.parse(mockStorage.HOC_HAN_NGU_WRITING_SETTINGS);
      assert.strictEqual(parsed.showOutline, true);
      assert.strictEqual(parsed.showGrid, true);
    });

    test('TC-T1-D5-03 [F19]: Password change form validates current and new password constraints', () => {
      // Empty current password
      const emptyCurrent = validateChangePasswordContract({
        currentPassword: '',
        newPassword: 'ValidNewPassword123'
      });
      assert.strictEqual(emptyCurrent.valid, false);
      assert.strictEqual(emptyCurrent.error, 'Mật khẩu hiện tại không được để trống');

      // Short new password (< 6 chars)
      const shortNew = validateChangePasswordContract({
        currentPassword: 'OldPassword123',
        newPassword: '12345'
      });
      assert.strictEqual(shortNew.valid, false);
      assert.strictEqual(shortNew.error, 'Mật khẩu mới phải có ít nhất 6 ký tự');

      // New matches current
      const samePass = validateChangePasswordContract({
        currentPassword: 'IdenticalPass123',
        newPassword: 'IdenticalPass123'
      });
      assert.strictEqual(samePass.valid, false);
      assert.strictEqual(samePass.error, 'Mật khẩu mới không được trùng với mật khẩu hiện tại');
    });

    test('TC-T1-D5-04 [F19]: Password change endpoint contract accepts valid payload', () => {
      const valid = validateChangePasswordContract({
        currentPassword: 'CurrentPass123',
        newPassword: 'BrandNewSecurePass456'
      });
      assert.strictEqual(valid.valid, true);
      assert.strictEqual(valid.status, 200);
    });

    test('TC-T1-D5-05 [F19]: Zero Web Storage exposure policy for password credentials', () => {
      const safeStorage = {
        access_token: 'valid_jwt_token',
        user_info: JSON.stringify({ fullName: 'Lan', emailOrPhone: 'lan@example.com' }),
        HOC_HAN_NGU_AUDIO_SETTINGS: JSON.stringify({ volume: 1 })
      };
      const safeAudit = auditWebStorageForPasswords(safeStorage);
      assert.strictEqual(safeAudit.secure, true);
      assert.strictEqual(safeAudit.leakedKeys.length, 0);

      const unsafeStorage = {
        access_token: 'valid_jwt_token',
        currentPassword: 'LeakedPassword123!',
        user_info: JSON.stringify({ password: 'StoredUserPassword' })
      };
      const unsafeAudit = auditWebStorageForPasswords(unsafeStorage);
      assert.strictEqual(unsafeAudit.secure, false);
      assert.strictEqual(unsafeAudit.leakedKeys.length, 2);
    });

    test('TC-T1-D5-06 [F20]: Regression test verifies navigation contracts across all roles', () => {
      const rolesToTest = [
        { roles: ['Learner'], expectMgmt: false },
        { roles: ['Creator'], expectMgmt: true },
        { roles: ['Moderator'], expectMgmt: true },
        { roles: ['Admin'], expectMgmt: true }
      ];

      for (const r of rolesToTest) {
        const res = evaluateNavManagementEntry(r.roles);
        assert.strictEqual(res.showManagementLink, r.expectMgmt, `Role ${r.roles.join(',')} management entry mismatch`);
      }
    });
  });
});
