/**
 * =============================================================================
 * UNIT TESTS: STRICT REVERSE ROLE GUARD & WORKSPACE ISOLATION (PHƯƠNG ÁN A)
 * File: tests/frontend/unit/ui/role-workspace-guard.test.mjs
 * 
 * Verifies:
 * 1. resolveStaffLandingPage:
 *    - Admin -> management.html
 *    - Creator -> creator-lessons.html
 *    - Moderator -> moderator-queue.html
 *    - Admin + Creator -> management.html (Admin takes precedence)
 * 2. Strict Reverse Role Guard (enforceRoleWorkspaceGuard):
 *    - Guest / Unauthenticated users are NOT redirected on learner pages.
 *    - Learners are NOT redirected on learner pages (index, lessons, radicals, etc.).
 *    - Management roles (Admin, Creator, Moderator) are STRICTLY BLOCKED from learner pages:
 *      * Admin on lessons.html -> redirects to management.html
 *      * Admin on index.html -> redirects to management.html
 *      * Creator on lessons.html -> redirects to creator-lessons.html
 *      * Creator on vocabulary.html -> redirects to creator-lessons.html
 *      * Creator on srs-review.html -> redirects to creator-lessons.html
 *      * Moderator on lessons.html -> redirects to moderator-queue.html
 *      * Moderator on radicals.html -> redirects to moderator-queue.html
 *    - Management roles are ALLOWED on management workspace pages and profile.html:
 *      * Admin on management.html -> no redirect
 *      * Creator on creator-lessons.html -> no redirect
 *      * Moderator on moderator-queue.html -> no redirect
 *      * Creator/Admin on profile.html -> no redirect
 * =============================================================================
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// In-memory mock storage
class MockStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, val) {
    this.map.set(key, String(val));
  }
  removeItem(key) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}

const mockLocal = new MockStorage();
const mockSession = new MockStorage();

let redirectedTo = null;

class MockLocation {
  constructor(pathname = '/index.html') {
    this.pathname = pathname;
    this.href = pathname;
  }
  replace(url) {
    redirectedTo = url;
    this.href = url;
    this.pathname = '/' + url;
  }
}

globalThis.localStorage = mockLocal;
globalThis.sessionStorage = mockSession;
globalThis.window = {
  location: new MockLocation('/index.html')
};

// Dynamic imports
const { authManager } = await import('../../../../frontend/js/auth/auth-state.js');
const {
  resolveStaffLandingPage,
  enforceRoleWorkspaceGuard,
  MANAGEMENT_PAGE_SET
} = await import('../../../../frontend/js/ui/nav.js');

describe('Strict Reverse Role Guard & Workspace Isolation (Phương án A)', () => {
  beforeEach(() => {
    mockLocal.clear();
    mockSession.clear();
    redirectedTo = null;
    globalThis.window.location = new MockLocation('/index.html');
  });

  afterEach(() => {
    mockLocal.clear();
    mockSession.clear();
    redirectedTo = null;
  });

  describe('1. Staff Landing Page Resolution', () => {
    test('Admin resolves to management.html', () => {
      assert.strictEqual(resolveStaffLandingPage(['Admin']), 'management.html');
      assert.strictEqual(resolveStaffLandingPage(['Admin', 'Creator']), 'management.html');
      assert.strictEqual(resolveStaffLandingPage(['Admin', 'Moderator']), 'management.html');
    });

    test('Creator resolves to creator-lessons.html', () => {
      assert.strictEqual(resolveStaffLandingPage(['Creator']), 'creator-lessons.html');
      assert.strictEqual(resolveStaffLandingPage(['Creator', 'Learner']), 'creator-lessons.html');
    });

    test('Moderator resolves to moderator-queue.html', () => {
      assert.strictEqual(resolveStaffLandingPage(['Moderator']), 'moderator-queue.html');
      assert.strictEqual(resolveStaffLandingPage(['Moderator', 'Learner']), 'moderator-queue.html');
    });

    test('Fallback for empty or unprivileged roles defaults to management.html', () => {
      assert.strictEqual(resolveStaffLandingPage([]), 'management.html');
      assert.strictEqual(resolveStaffLandingPage(['Learner']), 'management.html');
    });
  });

  describe('2. Unauthenticated Guests and Regular Learners', () => {
    test('Unauthenticated guest on lessons.html is NOT redirected by role guard', () => {
      globalThis.window.location = new MockLocation('/lessons.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, false);
      assert.strictEqual(redirectedTo, null);
    });

    test('Learner on index.html is NOT redirected', () => {
      authManager.setSession({
        token: 'learner-token',
        accountId: 10,
        emailOrPhone: 'learner@example.com',
        roles: ['Learner']
      });
      globalThis.window.location = new MockLocation('/index.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, false);
      assert.strictEqual(redirectedTo, null);
    });

    test('Learner on lessons.html is NOT redirected', () => {
      authManager.setSession({
        token: 'learner-token',
        accountId: 10,
        emailOrPhone: 'learner@example.com',
        roles: ['Learner']
      });
      globalThis.window.location = new MockLocation('/lessons.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, false);
      assert.strictEqual(redirectedTo, null);
    });

    test('Learner on vocabulary.html is NOT redirected', () => {
      authManager.setSession({
        token: 'learner-token',
        accountId: 10,
        emailOrPhone: 'learner@example.com',
        roles: ['Learner']
      });
      globalThis.window.location = new MockLocation('/vocabulary.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, false);
      assert.strictEqual(redirectedTo, null);
    });
  });

  describe('3. Strict Reverse Guard: Management Roles Prohibited from Learner Pages', () => {
    test('Admin on lessons.html is forcibly redirected to management.html', () => {
      authManager.setSession({
        token: 'admin-token',
        accountId: 1,
        emailOrPhone: 'admin@example.com',
        roles: ['Admin']
      });
      globalThis.window.location = new MockLocation('/lessons.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, true);
      assert.strictEqual(redirectedTo, 'management.html');
    });

    test('Admin on index.html (home) is forcibly redirected to management.html', () => {
      authManager.setSession({
        token: 'admin-token',
        accountId: 1,
        emailOrPhone: 'admin@example.com',
        roles: ['Admin']
      });
      globalThis.window.location = new MockLocation('/index.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, true);
      assert.strictEqual(redirectedTo, 'management.html');
    });

    test('Creator on lessons.html is forcibly redirected to creator-lessons.html', () => {
      authManager.setSession({
        token: 'creator-token',
        accountId: 2,
        emailOrPhone: 'creator@example.com',
        roles: ['Creator']
      });
      globalThis.window.location = new MockLocation('/lessons.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, true);
      assert.strictEqual(redirectedTo, 'creator-lessons.html');
    });

    test('Creator on vocabulary.html is forcibly redirected to creator-lessons.html', () => {
      authManager.setSession({
        token: 'creator-token',
        accountId: 2,
        emailOrPhone: 'creator@example.com',
        roles: ['Creator']
      });
      globalThis.window.location = new MockLocation('/vocabulary.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, true);
      assert.strictEqual(redirectedTo, 'creator-lessons.html');
    });

    test('Creator on srs-review.html is forcibly redirected to creator-lessons.html', () => {
      authManager.setSession({
        token: 'creator-token',
        accountId: 2,
        emailOrPhone: 'creator@example.com',
        roles: ['Creator']
      });
      globalThis.window.location = new MockLocation('/srs-review.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, true);
      assert.strictEqual(redirectedTo, 'creator-lessons.html');
    });

    test('Moderator on lessons.html is forcibly redirected to moderator-queue.html', () => {
      authManager.setSession({
        token: 'mod-token',
        accountId: 3,
        emailOrPhone: 'mod@example.com',
        roles: ['Moderator']
      });
      globalThis.window.location = new MockLocation('/lessons.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, true);
      assert.strictEqual(redirectedTo, 'moderator-queue.html');
    });

    test('Moderator on radicals.html is forcibly redirected to moderator-queue.html', () => {
      authManager.setSession({
        token: 'mod-token',
        accountId: 3,
        emailOrPhone: 'mod@example.com',
        roles: ['Moderator']
      });
      globalThis.window.location = new MockLocation('/radicals.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, true);
      assert.strictEqual(redirectedTo, 'moderator-queue.html');
    });
  });

  describe('4. Permitted Management and Utility Workspaces', () => {
    test('Admin on management.html is NOT redirected', () => {
      authManager.setSession({
        token: 'admin-token',
        accountId: 1,
        roles: ['Admin']
      });
      globalThis.window.location = new MockLocation('/management.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, false);
      assert.strictEqual(redirectedTo, null);
    });

    test('Creator on creator-lessons.html is NOT redirected', () => {
      authManager.setSession({
        token: 'creator-token',
        accountId: 2,
        roles: ['Creator']
      });
      globalThis.window.location = new MockLocation('/creator-lessons.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, false);
      assert.strictEqual(redirectedTo, null);
    });

    test('Creator on creator-import.html is NOT redirected', () => {
      authManager.setSession({
        token: 'creator-token',
        accountId: 2,
        roles: ['Creator']
      });
      globalThis.window.location = new MockLocation('/creator-import.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, false);
      assert.strictEqual(redirectedTo, null);
    });

    test('Moderator on moderator-queue.html is NOT redirected', () => {
      authManager.setSession({
        token: 'mod-token',
        accountId: 3,
        roles: ['Moderator']
      });
      globalThis.window.location = new MockLocation('/moderator-queue.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, false);
      assert.strictEqual(redirectedTo, null);
    });

    test('Staff on profile.html is NOT redirected (account profile permitted for all)', () => {
      authManager.setSession({
        token: 'creator-token',
        accountId: 2,
        roles: ['Creator']
      });
      globalThis.window.location = new MockLocation('/profile.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, false);
      assert.strictEqual(redirectedTo, null);
    });

    test('Staff on login.html is NOT redirected by guard (auth page handles login redirects)', () => {
      authManager.setSession({
        token: 'creator-token',
        accountId: 2,
        roles: ['Creator']
      });
      globalThis.window.location = new MockLocation('/login.html');
      const didRedirect = enforceRoleWorkspaceGuard();
      assert.strictEqual(didRedirect, false);
      assert.strictEqual(redirectedTo, null);
    });
  });
});
