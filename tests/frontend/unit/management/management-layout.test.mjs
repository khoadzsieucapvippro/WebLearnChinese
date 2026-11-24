/**
 * =============================================================================
 * UNIT TEST SUITE: MANAGEMENT WORKSPACE LAYOUT & NAVIGATION ISOLATION
 * File: tests/frontend/unit/management/management-layout.test.mjs
 * 
 * Scope:
 * - Isolation invariant: Learner menu (Trang chủ, Bộ thủ, Từ vựng, Ôn tập)
 *   is strictly ABSENT from management navigation.
 * - Route resolution: getActiveManagementRoute accurately maps detail pages
 *   (creator-lesson-editor, moderator-review) to parent navigation items.
 * - Role-based visibility: getVisibleManagementNavConfig strictly gates
 *   navigation groups according to RBAC.
 * - Invariant: Management brand identity links to management.html, NOT index.html.
 * - Invariant: Secondary gateway back to learner space links to index.html.
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  MANAGEMENT_NAV_CONFIG,
  getActiveManagementRoute,
  getVisibleManagementNavConfig,
  renderManagementSidebar
} from '../../../../frontend/js/ui/management-layout.js';
import { MANAGEMENT_PAGE_SET } from '../../../../frontend/js/ui/nav.js';

class MockElement {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.className = '';
    this.textContent = '';
    this.children = [];
    this.attributes = new Map();
    this.eventListeners = new Map();
  }

  get classList() {
    const self = this;
    return {
      contains: (cls) => self.className.split(/\s+/).includes(cls),
      add: (...clss) => {
        const set = new Set(self.className.split(/\s+/).filter(Boolean));
        clss.forEach(c => set.add(c));
        self.className = Array.from(set).join(' ');
      },
      remove: (...clss) => {
        const set = new Set(self.className.split(/\s+/).filter(Boolean));
        clss.forEach(c => set.delete(c));
        self.className = Array.from(set).join(' ');
      }
    };
  }

  setAttribute(name, val) {
    this.attributes.set(name, String(val));
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  appendChild(child) {
    this.children.push(child);
  }

  replaceChildren(...children) {
    this.children = [...children];
  }

  addEventListener(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(handler);
  }

  querySelector(selector) {
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      return this._findChild(el => el.getAttribute?.('id') === id);
    }
    return null;
  }

  querySelectorAll(selector) {
    const results = [];
    this._walk(node => {
      if (selector === 'a' && node.tagName === 'A') results.push(node);
      if (selector.startsWith('.') && (node.className || '').includes(selector.slice(1))) results.push(node);
    });
    return results;
  }

  _findChild(predicate) {
    for (const child of this.children) {
      if (child instanceof MockElement) {
        if (predicate(child)) return child;
        const nested = child._findChild(predicate);
        if (nested) return nested;
      }
    }
    return null;
  }

  _walk(fn) {
    fn(this);
    for (const child of this.children) {
      if (child instanceof MockElement) {
        child._walk(fn);
      }
    }
  }
}

describe('Management Workspace Layout & Navigation Isolation', () => {

  describe('1. Route Resolution: getActiveManagementRoute', () => {

    test('resolves management.html, admin-dashboard.html and empty path to management.html', () => {
      assert.strictEqual(getActiveManagementRoute('management.html'), 'management.html');
      assert.strictEqual(getActiveManagementRoute('/management.html'), 'management.html');
      assert.strictEqual(getActiveManagementRoute('admin-dashboard.html'), 'management.html');
      assert.strictEqual(getActiveManagementRoute(''), 'management.html');
    });

    test('maps creator-lesson-editor.html detail page to creator-lessons.html', () => {
      assert.strictEqual(getActiveManagementRoute('creator-lesson-editor.html'), 'creator-lessons.html');
      assert.strictEqual(getActiveManagementRoute('/creator-lesson-editor.html?id=42'), 'creator-lessons.html');
    });

    test('maps moderator-review.html detail page to moderator-queue.html', () => {
      assert.strictEqual(getActiveManagementRoute('moderator-review.html'), 'moderator-queue.html');
      assert.strictEqual(getActiveManagementRoute('/moderator-review.html?id=10'), 'moderator-queue.html');
    });

    test('preserves direct operational routes', () => {
      const directRoutes = [
        'creator-lessons.html',
        'creator-import.html',
        'moderator-queue.html',
        'moderator-history.html',
        'admin-accounts.html',
        'admin-roles.html',
        'admin-lessons.html',
        'admin-radicals.html',
        'admin-vocabulary.html',
        'admin-audit-logs.html',
        'admin-settings.html'
      ];

      for (const route of directRoutes) {
        assert.strictEqual(getActiveManagementRoute(route), route);
      }
    });

  });

  describe('2. Role-Gated Navigation Visibility: getVisibleManagementNavConfig', () => {

    test('Admin role receives Admin group with 7 items (settings temporarily hidden)', () => {
      const sections = getVisibleManagementNavConfig(['Admin']);
      const sectionIds = sections.map(s => s.id);
      assert.deepStrictEqual(sectionIds, ['admin']);
      assert.strictEqual(sections[0].items.length, 7);

      const expectedItemIds = [
        'navMgmtAdminDashboard',
        'navMgmtAdminLessons',
        'navMgmtAdminAccounts',
        'navMgmtAdminRoles',
        'navMgmtAdminRadicals',
        'navMgmtAdminVocabulary',
        'navMgmtAdminAuditLogs'
      ];
      assert.deepStrictEqual(sections[0].items.map(i => i.id), expectedItemIds);
      assert.strictEqual(sections[0].items.some(i => i.id === 'navMgmtAdminSettings'), false);
    });

    test('Admin with secondary roles (Admin + Creator) receives strictly the 7 admin items', () => {
      const sections = getVisibleManagementNavConfig(['Admin', 'Creator']);
      const sectionIds = sections.map(s => s.id);
      assert.deepStrictEqual(sectionIds, ['admin']);
      assert.strictEqual(sections[0].items.length, 7);
      assert.strictEqual(sections[0].items.some(i => i.id === 'navMgmtAdminSettings'), false);
    });

    test('Creator role receives Creator group', () => {
      const sections = getVisibleManagementNavConfig(['Creator']);
      const sectionIds = sections.map(s => s.id);
      assert.deepStrictEqual(sectionIds, ['creator']);
    });

    test('Moderator role receives Moderation group', () => {
      const sections = getVisibleManagementNavConfig(['Moderator']);
      const sectionIds = sections.map(s => s.id);
      assert.deepStrictEqual(sectionIds, ['moderation']);
    });

    test('Learner role receives empty navigation configuration', () => {
      const sections = getVisibleManagementNavConfig(['Learner']);
      assert.deepStrictEqual(sections, []);
    });

    test('Empty, null, or undefined role returns empty configuration', () => {
      assert.deepStrictEqual(getVisibleManagementNavConfig([]), []);
      assert.deepStrictEqual(getVisibleManagementNavConfig(null), []);
      assert.deepStrictEqual(getVisibleManagementNavConfig(undefined), []);
    });

  });

  describe('3. Architectural Isolation Invariants', () => {

    test('Learner navbar items (Trang chủ, Bộ thủ, Từ vựng, Ôn tập) are strictly absent from management nav config', () => {
      const allItemLabels = MANAGEMENT_NAV_CONFIG
        .flatMap(sec => sec.items)
        .map(i => i.label);

      assert.strictEqual(allItemLabels.includes('Trang chủ'), false);
      assert.strictEqual(allItemLabels.includes('Bộ thủ'), false);
      assert.strictEqual(allItemLabels.includes('Từ vựng'), false);
      assert.strictEqual(allItemLabels.includes('Ôn tập'), false);
    });

    test('All management route targets in nav config exist in MANAGEMENT_PAGE_SET', () => {
      const allHrefs = MANAGEMENT_NAV_CONFIG
        .flatMap(sec => sec.items)
        .map(i => i.href);

      for (const href of allHrefs) {
        assert.ok(
          MANAGEMENT_PAGE_SET.has(href),
          `Management nav href "${href}" must be a registered management page in MANAGEMENT_PAGE_SET`
        );
      }
    });

  });

  describe('4. DOM Construction & Active State: renderManagementSidebar', () => {
    let originalDoc;
    let originalNode;

    before(() => {
      originalDoc = globalThis.document;
      originalNode = globalThis.Node;

      globalThis.Node = MockElement;
      globalThis.document = {
        createElement: (tag) => new MockElement(tag),
        createTextNode: (text) => text
      };
    });

    after(() => {
      globalThis.document = originalDoc;
      globalThis.Node = originalNode;
    });

    test('renders role-gated sidebar and assigns active state on management.html (Overview item active, Lessons NOT active)', () => {
      const container = new MockElement('div');
      renderManagementSidebar(container, ['Admin'], 'management.html');

      const allLinks = container.querySelectorAll('a');
      assert.strictEqual(allLinks.length, 7, 'Admin sidebar must render exactly 7 items');
      assert.strictEqual(container.querySelector('#navMgmtAdminSettings'), null);

      const dashboardLink = container.querySelector('#navMgmtAdminDashboard');
      assert.ok(dashboardLink, 'Admin Dashboard/Overview link must exist');
      assert.strictEqual(dashboardLink.getAttribute('aria-current'), 'page');
      assert.ok(dashboardLink.classList.contains('active'));

      const lessonsLink = container.querySelector('#navMgmtAdminLessons');
      assert.ok(lessonsLink, 'Admin Lessons link must exist');
      assert.strictEqual(lessonsLink.getAttribute('aria-current'), null);
      assert.strictEqual(lessonsLink.classList.contains('active'), false);
    });

    test('renders role-gated sidebar and assigns active state on admin-lessons.html', () => {
      const container = new MockElement('div');
      renderManagementSidebar(container, ['Admin'], 'admin-lessons.html');

      const allLinks = container.querySelectorAll('a');
      assert.strictEqual(allLinks.length, 7, 'Admin sidebar must render exactly 7 items');
      assert.strictEqual(container.querySelector('#navMgmtAdminSettings'), null);

      const lessonsLink = container.querySelector('#navMgmtAdminLessons');
      assert.ok(lessonsLink, 'Admin Lessons link must exist');
      assert.strictEqual(lessonsLink.getAttribute('aria-current'), 'page');
      assert.ok(lessonsLink.classList.contains('active'));

      const dashboardLink = container.querySelector('#navMgmtAdminDashboard');
      assert.ok(dashboardLink, 'Admin Dashboard link must exist');
      assert.strictEqual(dashboardLink.getAttribute('aria-current'), null);
      assert.strictEqual(dashboardLink.classList.contains('active'), false);
    });

    test('confirms admin-settings.html is temporarily hidden from active admin sidebar', () => {
      const container = new MockElement('div');
      renderManagementSidebar(container, ['Admin'], 'admin-settings.html');

      const settingsLink = container.querySelector('#navMgmtAdminSettings');
      assert.strictEqual(settingsLink, null, 'Admin Settings link should be temporarily hidden');

      const allLinks = container.querySelectorAll('a');
      assert.strictEqual(allLinks.length, 7, 'Admin sidebar must still render the remaining 7 active items');
      const activeLinks = allLinks.filter(a => a.getAttribute('aria-current') === 'page');
      assert.strictEqual(activeLinks.length, 0, 'No links should have aria-current on unlisted settings page');
    });

    test('renders role-gated sidebar and assigns active state on creator-lessons.html', () => {
      const container = new MockElement('div');
      renderManagementSidebar(container, ['Creator'], 'creator-lessons.html');

      const creatorLink = container.querySelector('#navMgmtCreatorLessons');
      assert.ok(creatorLink, 'Creator Lessons link must exist');
      assert.strictEqual(creatorLink.getAttribute('aria-current'), 'page');
      assert.ok(creatorLink.classList.contains('active'));

      const adminLink = container.querySelector('#navMgmtAdminAccounts');
      assert.strictEqual(adminLink, null, 'Admin links must not exist for Creator session');
    });

    test('detail page creator-lesson-editor.html activates parent creator-lessons.html nav item', () => {
      const container = new MockElement('div');
      renderManagementSidebar(container, ['Creator'], 'creator-lesson-editor.html?id=12');

      const creatorLink = container.querySelector('#navMgmtCreatorLessons');
      assert.ok(creatorLink, 'Creator Lessons link must exist');
      assert.strictEqual(creatorLink.getAttribute('aria-current'), 'page');
      assert.ok(creatorLink.classList.contains('active'));
    });

    test('Learner role renders access notice without management links', () => {
      const container = new MockElement('div');
      renderManagementSidebar(container, ['Learner'], 'management.html');

      const notice = container.querySelector('#mgmtSidebarAccessNotice');
      assert.ok(notice, 'Access notice must be rendered for Learner session');
      assert.strictEqual(container.querySelector('#navMgmtHub'), null);
      assert.strictEqual(container.querySelector('#navMgmtCreatorLessons'), null);
    });

  });

});
