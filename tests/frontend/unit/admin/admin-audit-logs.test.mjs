/**
 * =============================================================================
 * TARGETED UNIT TESTS: CENTRALIZED MANAGEMENT AUDIT LOGS (MILESTONE M3)
 * Module: tests/frontend/unit/admin/admin-audit-logs.test.mjs
 * 
 * Scope:
 * - Pure logic unit testing of admin-audit-logs-page.js functions:
 *   1. hasAdminAccess: Admin role guard invariant.
 *   2. formatTimestamp: Safe ISO datetime parsing and Vietnamese localized formatting.
 *   3. getActionBadgeClass: Semantic design token badges for audit actions.
 *   4. getStatusBadgeClass: Status badge resolution for SUCCESS and FAILED.
 *   5. formatPayloadJson: JSON pretty-formatting and empty snapshot fallback.
 *   6. buildQueryParams: Defensive query parameter serialization and filtering.
 * =============================================================================
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  hasAdminAccess,
  formatTimestamp,
  getActionBadgeClass,
  getStatusBadgeClass,
  formatPayloadJson,
  buildQueryParams
} from '../../../../frontend/js/pages/admin-audit-logs-page.js';

describe('Milestone M3 — Admin Audit Logs Pure Logic Unit Tests', () => {

  /* ---------------------------------------------------------------------------
   * 1. hasAdminAccess (RBAC Role Guard Invariant)
   * --------------------------------------------------------------------------- */
  describe('1. hasAdminAccess', () => {
    test('returns true when session has authoritative Admin role', () => {
      const mockManager = { hasRole: (role) => role === 'Admin' };
      assert.strictEqual(hasAdminAccess(mockManager), true);
    });

    test('strictly rejects ROLE_ADMIN prefix (contract requires canonical Admin)', () => {
      const mockManager = { hasRole: (role) => role === 'ROLE_ADMIN' };
      assert.strictEqual(hasAdminAccess(mockManager), false);
    });

    test('returns false for non-admin roles (Learner, Creator, Moderator)', () => {
      const mockLearner = { hasRole: (role) => role === 'Learner' };
      assert.strictEqual(hasAdminAccess(mockLearner), false);

      const mockCreator = { hasRole: (role) => role === 'Creator' };
      assert.strictEqual(hasAdminAccess(mockCreator), false);

      const mockModerator = { hasRole: (role) => role === 'Moderator' };
      assert.strictEqual(hasAdminAccess(mockModerator), false);
    });

    test('defensively handles null, undefined, or invalid authManager instances', () => {
      assert.strictEqual(hasAdminAccess(null), false);
      assert.strictEqual(hasAdminAccess(undefined), false);
      assert.strictEqual(hasAdminAccess({}), false);
      assert.strictEqual(hasAdminAccess({ hasRole: 'not-a-function' }), false);
    });
  });

  /* ---------------------------------------------------------------------------
   * 2. formatTimestamp (ISO Datetime Formatting)
   * --------------------------------------------------------------------------- */
  describe('2. formatTimestamp', () => {
    test('returns dash placeholder for null, undefined, or empty string', () => {
      assert.strictEqual(formatTimestamp(null), '—');
      assert.strictEqual(formatTimestamp(undefined), '—');
      assert.strictEqual(formatTimestamp(''), '—');
    });

    test('formats valid ISO datetime string into HH:mm:ss DD/MM/YYYY format', () => {
      // Create a deterministic local date
      const testDate = new Date(2026, 9, 21, 14, 30, 45); // Month is 0-indexed: 9 = October
      const iso = testDate.toISOString();
      const formatted = formatTimestamp(iso);
      
      assert.match(formatted, /^14:30:45 21\/10\/2026$/);
    });

    test('returns raw string gracefully for invalid date strings without throwing', () => {
      assert.strictEqual(formatTimestamp('invalid-date-token'), 'invalid-date-token');
    });
  });

  /* ---------------------------------------------------------------------------
   * 3. getActionBadgeClass (Semantic Action Badges)
   * --------------------------------------------------------------------------- */
  describe('3. getActionBadgeClass', () => {
    test('returns correct badge classes for standard audit action types', () => {
      assert.strictEqual(getActionBadgeClass('USER_ROLE_UPDATE'), 'badge bg-primary');
      assert.strictEqual(getActionBadgeClass('ACCOUNT_STATUS_UPDATE'), 'badge bg-warning text-dark');
      assert.strictEqual(getActionBadgeClass('LESSON_APPROVE'), 'badge bg-success');
      assert.strictEqual(getActionBadgeClass('LESSON_REJECT'), 'badge bg-danger');
      assert.strictEqual(getActionBadgeClass('VOCABULARY_CREATE'), 'badge bg-info text-dark');
      assert.strictEqual(getActionBadgeClass('RADICAL_UPDATE'), 'badge bg-secondary');
      assert.strictEqual(getActionBadgeClass('VOCABULARY_DELETE'), 'badge bg-dark');
    });

    test('handles case-insensitivity and fallback for unknown/empty action types', () => {
      assert.strictEqual(getActionBadgeClass('vocabulary_create'), 'badge bg-info text-dark');
      assert.strictEqual(getActionBadgeClass('UNKNOWN_CUSTOM_ACTION'), 'badge bg-secondary');
      assert.strictEqual(getActionBadgeClass(null), 'badge bg-secondary');
      assert.strictEqual(getActionBadgeClass(''), 'badge bg-secondary');
    });
  });

  /* ---------------------------------------------------------------------------
   * 4. getStatusBadgeClass (Status Badges)
   * --------------------------------------------------------------------------- */
  describe('4. getStatusBadgeClass', () => {
    test('returns success badge for SUCCESS and danger badge for FAILED', () => {
      assert.strictEqual(getStatusBadgeClass('SUCCESS'), 'badge bg-success');
      assert.strictEqual(getStatusBadgeClass('success'), 'badge bg-success');
      assert.strictEqual(getStatusBadgeClass('FAILED'), 'badge bg-danger');
      assert.strictEqual(getStatusBadgeClass('failed'), 'badge bg-danger');
    });

    test('returns secondary badge fallback for null, undefined, or empty status', () => {
      assert.strictEqual(getStatusBadgeClass(null), 'badge bg-secondary');
      assert.strictEqual(getStatusBadgeClass(''), 'badge bg-secondary');
    });
  });

  /* ---------------------------------------------------------------------------
   * 5. formatPayloadJson (Payload Formatting & Pretty-Printing)
   * --------------------------------------------------------------------------- */
  describe('5. formatPayloadJson', () => {
    test('returns empty placeholder for null, undefined, or empty/whitespace string', () => {
      assert.strictEqual(formatPayloadJson(null), '(Trống — Không có dữ liệu thay đổi)');
      assert.strictEqual(formatPayloadJson(undefined), '(Trống — Không có dữ liệu thay đổi)');
      assert.strictEqual(formatPayloadJson(''), '(Trống — Không có dữ liệu thay đổi)');
      assert.strictEqual(formatPayloadJson('   '), '(Trống — Không có dữ liệu thay đổi)');
    });

    test('pretty prints valid JSON payload with 2-space indentation', () => {
      const rawJson = '{"status":"APPROVED","count":42}';
      const expected = JSON.stringify({ status: 'APPROVED', count: 42 }, null, 2);
      assert.strictEqual(formatPayloadJson(rawJson), expected);
    });

    test('returns raw string safely if payload is not valid JSON without throwing', () => {
      const rawText = 'plain non-json text payload';
      assert.strictEqual(formatPayloadJson(rawText), rawText);
    });
  });

  /* ---------------------------------------------------------------------------
   * 6. buildQueryParams (Query Parameter Construction)
   * --------------------------------------------------------------------------- */
  describe('6. buildQueryParams', () => {
    test('provides sensible defaults when empty object is passed', () => {
      const query = buildQueryParams({});
      assert.deepStrictEqual(query, {
        page: 0,
        size: 20,
        sort: 'createdAt,desc;logId,desc'
      });
    });

    test('preserves valid pagination and custom sort', () => {
      const query = buildQueryParams({ page: 2, size: 50, sort: 'createdAt,asc' });
      assert.strictEqual(query.page, 2);
      assert.strictEqual(query.size, 50);
      assert.strictEqual(query.sort, 'createdAt,asc');
    });

    test('falls back to default page=0 and size=20 on invalid negative or NaN inputs', () => {
      const query = buildQueryParams({ page: -5, size: -10 });
      assert.strictEqual(query.page, 0);
      assert.strictEqual(query.size, 20);
    });

    test('trims and includes non-empty filter parameters', () => {
      const query = buildQueryParams({
        actionType: '  USER_ROLE_UPDATE ',
        resourceType: 'ACCOUNT  ',
        status: 'SUCCESS',
        actor: '  admin_master ',
        startDate: '2026-10-01T00:00:00Z',
        endDate: '2026-10-21T23:59:59Z'
      });

      assert.strictEqual(query.actionType, 'USER_ROLE_UPDATE');
      assert.strictEqual(query.resourceType, 'ACCOUNT');
      assert.strictEqual(query.status, 'SUCCESS');
      assert.strictEqual(query.actor, 'admin_master');
      assert.strictEqual(query.startDate, '2026-10-01T00:00:00Z');
      assert.strictEqual(query.endDate, '2026-10-21T23:59:59Z');
    });

    test('omits empty or whitespace-only filter parameters', () => {
      const query = buildQueryParams({
        actionType: '   ',
        resourceType: '',
        status: null,
        actor: undefined
      });

      assert.strictEqual(query.actionType, undefined);
      assert.strictEqual(query.resourceType, undefined);
      assert.strictEqual(query.status, undefined);
      assert.strictEqual(query.actor, undefined);
    });
  });

});
