/**
 * =============================================================================
 * UNIT TESTS: NAVBAR ACTIVE LINK SYNCHRONIZATION & TAB DECOUPLING
 * File: tests/frontend/unit/ui/nav-active-sync.test.mjs
 * 
 * Verifies:
 * 1. Strict decoupling of "Bài học" (Lesson Hub) and "Ôn tập" (SRS Review Hub):
 *    - LESSON_HUB_SUBPAGES: lessons.html, lesson-detail.html
 *    - REVIEW_HUB_SUBPAGES: srs-review.html, srs-dashboard.html, srs-settings.html
 * 2. Active Tab Synchronization on Primary Navbar (.navbar-nav):
 *    - On lessons.html: "Bài học" link is active, "Ôn tập" is strictly inactive.
 *    - On lesson-detail.html: "Bài học" link is active, "Ôn tập" is strictly inactive.
 *    - On srs-review.html: "Ôn tập" link is active, "Bài học" is strictly inactive.
 *    - On srs-dashboard.html: "Ôn tập" link is active, "Bài học" is strictly inactive.
 *    - On srs-settings.html: "Ôn tập" link is active, "Bài học" is strictly inactive.
 *    - On vocabulary.html: "Từ vựng" is active; both "Bài học" and "Ôn tập" are inactive.
 *    - On radicals.html: "Bộ thủ" is active; both "Bài học" and "Ôn tập" are inactive.
 *    - On index.html: "Trang chủ" is active; both "Bài học" and "Ôn tập" are inactive.
 * 3. Invariant: "Bài học" and "Ôn tập" are two distinct, non-overlapping modules.
 * =============================================================================
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  syncActiveNavLinks,
  REVIEW_HUB_SUBPAGES,
  LESSON_HUB_SUBPAGES
} from '../../../../frontend/js/ui/nav.js';

class MockElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.className = '';
    this.textContent = '';
    this.children = [];
    this.attributes = new Map();
  }

  get classList() {
    const self = this;
    return {
      contains: (cls) => self.className.split(/\s+/).filter(Boolean).includes(cls),
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

  querySelectorAll(selector) {
    const results = [];
    const check = (el) => {
      if (selector.includes('nav-link') && (el.tagName === 'A' || el.className.includes('nav-link'))) {
        results.push(el);
      }
      for (const child of el.children) {
        check(child);
      }
    };
    for (const child of this.children) {
      check(child);
    }
    return results;
  }
}

describe('Unit: Navbar Active Link Synchronization & Tab Decoupling', () => {
  let originalDoc;
  let originalWindow;
  let navContainer;
  let linkHome;
  let linkRadicals;
  let linkVocab;
  let linkLessons;
  let linkSrs;

  beforeEach(() => {
    originalDoc = globalThis.document;
    originalWindow = globalThis.window;

    navContainer = new MockElement('ul');
    navContainer.className = 'navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3 gap-1';

    const createNavLink = (href, text) => {
      const li = new MockElement('li');
      li.className = 'nav-item';
      const a = new MockElement('a');
      a.className = 'nav-link-custom';
      a.setAttribute('href', href);
      a.textContent = text;
      li.appendChild(a);
      navContainer.appendChild(li);
      return a;
    };

    linkHome = createNavLink('index.html', 'Trang chủ');
    linkRadicals = createNavLink('radicals.html', 'Bộ thủ');
    linkVocab = createNavLink('vocabulary.html', 'Từ vựng');
    linkLessons = createNavLink('lessons.html', 'Bài học');
    linkSrs = createNavLink('srs-review.html', 'Ôn tập');

    globalThis.document = {
      querySelector: (selector) => {
        if (selector === '.navbar-nav') return navContainer;
        return null;
      },
      getElementById: () => null
    };

    globalThis.window = {
      location: { pathname: '/index.html' }
    };
  });

  afterEach(() => {
    globalThis.document = originalDoc;
    globalThis.window = originalWindow;
  });

  describe('1. Subpage Set Invariants', () => {
    test('LESSON_HUB_SUBPAGES strictly contains lessons.html and lesson-detail.html', () => {
      assert.strictEqual(LESSON_HUB_SUBPAGES.has('lessons.html'), true);
      assert.strictEqual(LESSON_HUB_SUBPAGES.has('lesson-detail.html'), true);
      assert.strictEqual(LESSON_HUB_SUBPAGES.size, 2);
    });

    test('REVIEW_HUB_SUBPAGES strictly contains srs-review.html, srs-dashboard.html, and srs-settings.html', () => {
      assert.strictEqual(REVIEW_HUB_SUBPAGES.has('srs-review.html'), true);
      assert.strictEqual(REVIEW_HUB_SUBPAGES.has('srs-dashboard.html'), true);
      assert.strictEqual(REVIEW_HUB_SUBPAGES.has('srs-settings.html'), true);
      assert.strictEqual(REVIEW_HUB_SUBPAGES.size, 3);
    });

    test('Zero overlap between LESSON_HUB_SUBPAGES and REVIEW_HUB_SUBPAGES (2 distinct modules)', () => {
      for (const page of LESSON_HUB_SUBPAGES) {
        assert.strictEqual(
          REVIEW_HUB_SUBPAGES.has(page),
          false,
          `Lesson subpage "${page}" must never belong to Review Hub`
        );
      }
      for (const page of REVIEW_HUB_SUBPAGES) {
        assert.strictEqual(
          LESSON_HUB_SUBPAGES.has(page),
          false,
          `Review subpage "${page}" must never belong to Lesson Hub`
        );
      }
    });
  });

  describe('2. Active Navbar State Synchronization', () => {
    test('On lessons.html: "Bài học" is active, "Ôn tập" is strictly inactive', () => {
      globalThis.window.location.pathname = '/lessons.html';
      syncActiveNavLinks();

      assert.strictEqual(linkLessons.classList.contains('active'), true, 'Bài học must have .active class');
      assert.strictEqual(linkLessons.getAttribute('aria-current'), 'page', 'Bài học must have aria-current="page"');

      assert.strictEqual(linkSrs.classList.contains('active'), false, 'Ôn tập must not have .active class');
      assert.strictEqual(linkSrs.getAttribute('aria-current'), null, 'Ôn tập must not have aria-current');

      assert.strictEqual(linkVocab.classList.contains('active'), false);
      assert.strictEqual(linkHome.classList.contains('active'), false);
    });

    test('On lesson-detail.html: "Bài học" is active, "Ôn tập" is strictly inactive', () => {
      globalThis.window.location.pathname = '/lesson-detail.html';
      syncActiveNavLinks();

      assert.strictEqual(linkLessons.classList.contains('active'), true, 'Bài học must have .active on lesson detail');
      assert.strictEqual(linkLessons.getAttribute('aria-current'), 'page', 'Bài học must have aria-current="page"');

      assert.strictEqual(linkSrs.classList.contains('active'), false, 'Ôn tập must not be active on lesson detail');
      assert.strictEqual(linkSrs.getAttribute('aria-current'), null);
    });

    test('On srs-review.html: "Ôn tập" is active, "Bài học" is strictly inactive', () => {
      globalThis.window.location.pathname = '/srs-review.html';
      syncActiveNavLinks();

      assert.strictEqual(linkSrs.classList.contains('active'), true, 'Ôn tập must have .active on review page');
      assert.strictEqual(linkSrs.getAttribute('aria-current'), 'page', 'Ôn tập must have aria-current="page"');

      assert.strictEqual(linkLessons.classList.contains('active'), false, 'Bài học must not be active on review page');
      assert.strictEqual(linkLessons.getAttribute('aria-current'), null);
    });

    test('On srs-dashboard.html: "Ôn tập" is active, "Bài học" is strictly inactive', () => {
      globalThis.window.location.pathname = '/srs-dashboard.html';
      syncActiveNavLinks();

      assert.strictEqual(linkSrs.classList.contains('active'), true, 'Ôn tập must have .active on dashboard');
      assert.strictEqual(linkSrs.getAttribute('aria-current'), 'page', 'Ôn tập must have aria-current="page"');

      assert.strictEqual(linkLessons.classList.contains('active'), false, 'Bài học must not be active on dashboard');
      assert.strictEqual(linkLessons.getAttribute('aria-current'), null);
    });

    test('On srs-settings.html: "Ôn tập" is active, "Bài học" is strictly inactive', () => {
      globalThis.window.location.pathname = '/srs-settings.html';
      syncActiveNavLinks();

      assert.strictEqual(linkSrs.classList.contains('active'), true, 'Ôn tập must have .active on settings');
      assert.strictEqual(linkSrs.getAttribute('aria-current'), 'page', 'Ôn tập must have aria-current="page"');

      assert.strictEqual(linkLessons.classList.contains('active'), false, 'Bài học must not be active on settings');
      assert.strictEqual(linkLessons.getAttribute('aria-current'), null);
    });

    test('On vocabulary.html: "Từ vựng" is active; neither "Bài học" nor "Ôn tập" is active', () => {
      globalThis.window.location.pathname = '/vocabulary.html';
      syncActiveNavLinks();

      assert.strictEqual(linkVocab.classList.contains('active'), true);
      assert.strictEqual(linkVocab.getAttribute('aria-current'), 'page');
      assert.strictEqual(linkLessons.classList.contains('active'), false);
      assert.strictEqual(linkSrs.classList.contains('active'), false);
    });

    test('On radicals.html: "Bộ thủ" is active; neither "Bài học" nor "Ôn tập" is active', () => {
      globalThis.window.location.pathname = '/radicals.html';
      syncActiveNavLinks();

      assert.strictEqual(linkRadicals.classList.contains('active'), true);
      assert.strictEqual(linkRadicals.getAttribute('aria-current'), 'page');
      assert.strictEqual(linkLessons.classList.contains('active'), false);
      assert.strictEqual(linkSrs.classList.contains('active'), false);
    });

    test('On index.html: "Trang chủ" is active; neither "Bài học" nor "Ôn tập" is active', () => {
      globalThis.window.location.pathname = '/index.html';
      syncActiveNavLinks();

      assert.strictEqual(linkHome.classList.contains('active'), true);
      assert.strictEqual(linkHome.getAttribute('aria-current'), 'page');
      assert.strictEqual(linkLessons.classList.contains('active'), false);
      assert.strictEqual(linkSrs.classList.contains('active'), false);
    });
  });
});
