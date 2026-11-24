/**
 * =============================================================================
 * UNIT TEST SUITE: MANAGEMENT HUB & ROLE ACCESS (2-ROLE SIMPLIFIED MODEL)
 * File: tests/frontend/unit/management/management.test.mjs
 * 
 * Scope:
 * - hasManagementAccess pure function across single and multi-role states.
 * - getVisibleManagementSections visibility matrix computation per RBAC rules.
 * - Invariant: Only Admin has management access.
 * - Invariant: Learner, deprecated Creator, and Moderator NEVER have management access.
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasManagementAccess,
  getVisibleManagementSections,
  formatTimestamp,
  getActionBadgeClass,
  getStatusBadgeClass,
  FALLBACK_AUDIT_LOGS
} from '../../../../frontend/js/pages/management-page.js';

describe('Management Hub Logic & RBAC Invariants', () => {

  describe('1. Access Gate: hasManagementAccess', () => {

    test('grants access to Admin role (canonical and prefixed)', () => {
      assert.strictEqual(hasManagementAccess(['Admin']), true);
      assert.strictEqual(hasManagementAccess(['ROLE_ADMIN']), true);
      assert.strictEqual(hasManagementAccess(['Learner', 'Admin']), true);
    });

    test('strictly denies access to deprecated Moderator role', () => {
      assert.strictEqual(hasManagementAccess(['Moderator']), false);
      assert.strictEqual(hasManagementAccess(['ROLE_MODERATOR']), false);
      assert.strictEqual(hasManagementAccess(['Learner', 'Moderator']), false);
    });

    test('strictly denies access to deprecated Creator role', () => {
      assert.strictEqual(hasManagementAccess(['Creator']), false);
      assert.strictEqual(hasManagementAccess(['ROLE_CREATOR']), false);
      assert.strictEqual(hasManagementAccess(['Learner', 'Creator']), false);
    });

    test('strictly denies access to dual Creator + Moderator role', () => {
      assert.strictEqual(hasManagementAccess(['Creator', 'Moderator']), false);
    });

    test('strictly denies access to Learner-only sessions', () => {
      assert.strictEqual(hasManagementAccess(['Learner']), false);
      assert.strictEqual(hasManagementAccess(['ROLE_LEARNER']), false);
      assert.strictEqual(hasManagementAccess([]), false);
      assert.strictEqual(hasManagementAccess(null), false);
      assert.strictEqual(hasManagementAccess(undefined), false);
    });

    test('supports authManager mock instances', () => {
      const mockAdminAuth = {
        isAuthenticated: () => true,
        getRoles: () => ['Admin']
      };
      assert.strictEqual(hasManagementAccess(mockAdminAuth), true);

      const mockLearnerAuth = {
        isAuthenticated: () => true,
        getRoles: () => ['Learner']
      };
      assert.strictEqual(hasManagementAccess(mockLearnerAuth), false);

      const mockUnauthenticatedAuth = {
        isAuthenticated: () => false,
        getRoles: () => ['Admin']
      };
      assert.strictEqual(hasManagementAccess(mockUnauthenticatedAuth), false);
    });

    test('supports session object with roles array', () => {
      assert.strictEqual(hasManagementAccess({ roles: ['Admin'] }), true);
      assert.strictEqual(hasManagementAccess({ roles: ['Creator'] }), false);
      assert.strictEqual(hasManagementAccess({ roles: ['Moderator'] }), false);
      assert.strictEqual(hasManagementAccess({ roles: ['Learner'] }), false);
    });

  });

  describe('2. Visibility Matrix: getVisibleManagementSections', () => {

    test('Admin role receives full access to Administration section', () => {
      const sections = getVisibleManagementSections(['Admin']);
      assert.deepStrictEqual(sections, {
        admin: true
      });
    });

    test('Deprecated Moderator role receives no section access', () => {
      const sections = getVisibleManagementSections(['Moderator']);
      assert.deepStrictEqual(sections, {
        admin: false
      });
    });

    test('Deprecated Creator role receives no section access', () => {
      const sections = getVisibleManagementSections(['Creator']);
      assert.deepStrictEqual(sections, {
        admin: false
      });
    });

    test('Learner role receives no management section access (admin: false)', () => {
      const sections = getVisibleManagementSections(['Learner']);
      assert.deepStrictEqual(sections, {
        admin: false
      });
    });

    test('Empty or null input safely returns admin: false', () => {
      assert.deepStrictEqual(getVisibleManagementSections([]), {
        admin: false
      });
      assert.deepStrictEqual(getVisibleManagementSections(null), {
        admin: false
      });
    });

  });

  describe('3. Dashboard Helpers & Formatting', () => {

    test('formatTimestamp correctly formats ISO date or falls back gracefully', () => {
      assert.strictEqual(formatTimestamp(null), '—');
      assert.strictEqual(formatTimestamp(''), '—');
      assert.strictEqual(formatTimestamp(undefined), '—');

      const formatted = formatTimestamp('2026-11-05T12:30:45Z');
      assert.ok(formatted.includes('2026'), 'Formatted timestamp must contain the year');
      assert.ok(formatted.includes(':'), 'Formatted timestamp must contain time colons');
    });

    test('getActionBadgeClass assigns semantic badge classes', () => {
      assert.ok(getActionBadgeClass('ROLE_ASSIGN').includes('badge'));
      assert.ok(getActionBadgeClass('ACCOUNT_LOCK').includes('warning'));
      assert.ok(getActionBadgeClass('LESSON_APPROVE').includes('success'));
      assert.ok(getActionBadgeClass('LESSON_REJECT').includes('danger'));
    });

    test('getStatusBadgeClass assigns success vs danger badges', () => {
      assert.ok(getStatusBadgeClass('SUCCESS').includes('bg-success'));
      assert.ok(getStatusBadgeClass('FAILURE').includes('bg-danger'));
      assert.ok(getStatusBadgeClass(null).includes('bg-secondary'));
    });

    test('FALLBACK_AUDIT_LOGS contains exactly 5 authoritative entries', () => {
      assert.strictEqual(FALLBACK_AUDIT_LOGS.length, 5);
      for (const log of FALLBACK_AUDIT_LOGS) {
        assert.ok(log.actorUsername);
        assert.ok(log.actionType);
        assert.strictEqual(log.status, 'SUCCESS');
      }
    });

  });

});
