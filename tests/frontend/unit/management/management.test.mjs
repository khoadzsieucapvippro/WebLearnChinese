/**
 * =============================================================================
 * UNIT TEST SUITE: MANAGEMENT HUB & ROLE ACCESS (TASK R1 / FEATURE F14)
 * File: tests/frontend/unit/management/management.test.mjs
 * 
 * Scope:
 * - hasManagementAccess pure function across single and multi-role states.
 * - getVisibleManagementSections visibility matrix computation per RBAC rules.
 * - Invariant: Learner NEVER has management access.
 * - Invariant: Admin has access to all 3 sections (Creator, Moderator, Admin).
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasManagementAccess,
  getVisibleManagementSections
} from '../../../../frontend/js/pages/management-page.js';

describe('Management Hub Logic & RBAC Invariants', () => {

  describe('1. Access Gate: hasManagementAccess', () => {

    test('grants access to Admin role (canonical and prefixed)', () => {
      assert.strictEqual(hasManagementAccess(['Admin']), true);
      assert.strictEqual(hasManagementAccess(['ROLE_ADMIN']), true);
      assert.strictEqual(hasManagementAccess(['Learner', 'Admin']), true);
    });

    test('grants access to Moderator role', () => {
      assert.strictEqual(hasManagementAccess(['Moderator']), true);
      assert.strictEqual(hasManagementAccess(['ROLE_MODERATOR']), true);
      assert.strictEqual(hasManagementAccess(['Learner', 'Moderator']), true);
    });

    test('grants access to Creator role', () => {
      assert.strictEqual(hasManagementAccess(['Creator']), true);
      assert.strictEqual(hasManagementAccess(['ROLE_CREATOR']), true);
      assert.strictEqual(hasManagementAccess(['Learner', 'Creator']), true);
    });

    test('grants access to dual Creator + Moderator role', () => {
      assert.strictEqual(hasManagementAccess(['Creator', 'Moderator']), true);
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
      assert.strictEqual(hasManagementAccess({ roles: ['Learner'] }), false);
    });

  });

  describe('2. Visibility Matrix: getVisibleManagementSections', () => {

    test('Admin role receives full access to Creator, Moderator, and Administration sections', () => {
      const sections = getVisibleManagementSections(['Admin']);
      assert.deepStrictEqual(sections, {
        creator: true,
        moderator: true,
        admin: true
      });
    });

    test('Moderator role receives only Moderation section access', () => {
      const sections = getVisibleManagementSections(['Moderator']);
      assert.deepStrictEqual(sections, {
        creator: false,
        moderator: true,
        admin: false
      });
    });

    test('Creator role receives only Creator Studio section access', () => {
      const sections = getVisibleManagementSections(['Creator']);
      assert.deepStrictEqual(sections, {
        creator: true,
        moderator: false,
        admin: false
      });
    });

    test('Dual Creator + Moderator receives Creator and Moderation sections, but not Administration', () => {
      const sections = getVisibleManagementSections(['Creator', 'Moderator']);
      assert.deepStrictEqual(sections, {
        creator: true,
        moderator: true,
        admin: false
      });
    });

    test('Learner role receives no management section access (all false)', () => {
      const sections = getVisibleManagementSections(['Learner']);
      assert.deepStrictEqual(sections, {
        creator: false,
        moderator: false,
        admin: false
      });
    });

    test('Empty or null input safely returns all false', () => {
      assert.deepStrictEqual(getVisibleManagementSections([]), {
        creator: false,
        moderator: false,
        admin: false
      });
      assert.deepStrictEqual(getVisibleManagementSections(null), {
        creator: false,
        moderator: false,
        admin: false
      });
    });

  });

});
