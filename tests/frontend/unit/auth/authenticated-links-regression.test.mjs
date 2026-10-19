/**
 * =============================================================================
 * REGRESSION TEST: AUTHENTICATED LINK GENERATION & SESSION INTEGRITY
 * 
 * Verifies:
 * 1. Authenticated navigation links (profile.html, creator-lessons.html,
 *    moderator-queue.html, admin-lessons.html) maintain document-relative hrefs
 *    without stripping the GitHub Pages subpath (/WebLearnChinese/).
 * 2. Role-based navbar item visibility (Learner, Creator, Moderator, Admin).
 * 3. Lesson detail links (lesson-detail.html?id=1) preserve relative resolution.
 * 4. SRS Zero-due invariant: no phantom card fabrication (dueCards: 0, cards = []).
 * 5. SRS Multi-skill card isolation: reviews update the exact cardType.
 * 6. Multi-user personal notes isolation: User A's notes do not leak to User B.
 * 7. Authentic backend 404 with JSON is never swallowed by demo fallback.
 * =============================================================================
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// In-memory DOM simulation for Node.js unit testing
class MockElement {
  constructor(tagName) {
    this.tagName = String(tagName).toUpperCase();
    this.children = [];
    this.attrs = {};
    this.className = '';
    this.textContent = '';
  }

  get innerHTML() {
    return String(this.textContent || '');
  }

  setAttribute(key, value) {
    this.attrs[key] = String(value);
  }

  getAttribute(key) {
    return this.attrs[key] || null;
  }

  removeAttribute(key) {
    delete this.attrs[key];
  }

  appendChild(child) {
    this.children.push(child);
  }

  replaceChildren(...children) {
    this.children = [...children];
  }

  addEventListener() {}
  removeEventListener() {}
}

class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(k) { return this.store.has(k) ? this.store.get(k) : null; }
  setItem(k, v) { this.store.set(k, String(v)); }
  removeItem(k) { this.store.delete(k); }
  clear() { this.store.clear(); }
}

const mockStorage = new MockLocalStorage();
globalThis.localStorage = mockStorage;
globalThis.Node = MockElement;
globalThis.HTMLElement = MockElement;
globalThis.document = {
  createElement: (tag) => new MockElement(tag),
  createTextNode: (text) => {
    const el = new MockElement('#text');
    el.textContent = String(text);
    return el;
  },
  getElementById: () => null
};
globalThis.window = {
  location: {
    origin: 'https://khoadzsieucapvippro.github.io',
    pathname: '/WebLearnChinese/index.html',
    href: 'https://khoadzsieucapvippro.github.io/WebLearnChinese/index.html'
  },
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() { return true; }
};

// Dynamic imports after globals are established
const { sanitizeNavigationUrl, createSafeElement } = await import('../../../../frontend/js/ui/security.js');
const { authManager } = await import('../../../../frontend/js/auth/auth-state.js');
const { renderNavbarAuth } = await import('../../../../frontend/js/ui/nav.js');
const { demoFallbackEngine } = await import('../../../../frontend/js/api/demo-fallback-engine.js');
const { apiClient, ApiError } = await import('../../../../frontend/js/api/api.js');
const { validateInternalRedirect, getAppBaseUrl } = await import('../../../../frontend/js/pages/auth-page.js');

describe('Regression: Authenticated Links, Relative Paths & Data Isolation', () => {

  beforeEach(() => {
    mockStorage.clear();
    authManager.logout(false);
    demoFallbackEngine.resetInMemoryData();
  });

  // ---------------------------------------------------------------------------
  // 1. Authenticated Navbar Link Resolution (GitHub Pages Subpath Protection)
  // ---------------------------------------------------------------------------
  describe('Navbar link generation across auth states & roles', () => {

    test('Unauthenticated guest: renders relative login.html and register.html with scholarly labels', () => {
      const container = new MockElement('div');
      renderNavbarAuth(container);

      const links = container.children.filter(c => c.tagName === 'A');
      assert.strictEqual(links.length, 2);
      assert.strictEqual(links[0].getAttribute('href'), 'login.html');
      assert.strictEqual(links[0].textContent, 'Đăng nhập');
      assert.strictEqual(links[1].getAttribute('href'), 'register.html');
      assert.strictEqual(links[1].textContent, 'Đăng ký');
    });

    test('Authenticated Learner: profile link preserves document-relative profile.html', () => {
      authManager.setSession({
        token: 'mock-learner-token',
        accountId: 1,
        emailOrPhone: 'learner@gmail.com',
        fullName: 'Học Viên Test',
        roles: ['Learner']
      });

      const container = new MockElement('div');
      renderNavbarAuth(container);

      // Verify profile link inside dropdown cluster
      const profileLink = findElementByAttr(container, 'id', 'navProfileBtn');
      assert.ok(profileLink, 'Profile link must be present in navbar');
      assert.strictEqual(profileLink.getAttribute('href'), 'profile.html');
      assert.ok(!profileLink.getAttribute('href').startsWith('https://khoadzsieucapvippro.github.io/profile.html'),
        'Must NOT strip repository subpath /WebLearnChinese/');

      // Verify learning progress link (#navLearningProgressBtn) is immediately below #navProfileBtn
      const learningProgressLink = findElementByAttr(container, 'id', 'navLearningProgressBtn');
      assert.ok(learningProgressLink, 'Learning progress link (#navLearningProgressBtn) must be present in avatar dropdown');
      assert.strictEqual(learningProgressLink.getAttribute('href'), 'srs-dashboard.html');
      assert.strictEqual(learningProgressLink.textContent, 'Tiến độ học tập');

      const dropdownPanel = findElementByAttr(container, 'id', 'navAccountDropdownMenu');
      assert.ok(dropdownPanel, 'Dropdown panel #navAccountDropdownMenu must exist');
      const dropdownLinksContainer = dropdownPanel.children[1];
      const profileIdx = dropdownLinksContainer.children.indexOf(profileLink);
      const progressIdx = dropdownLinksContainer.children.indexOf(learningProgressLink);
      assert.strictEqual(progressIdx, profileIdx + 1, '#navLearningProgressBtn must appear immediately below #navProfileBtn');

      // Verify privileged links are absent for Learner
      assert.strictEqual(findElementByAttr(container, 'id', 'navCreatorStudioBtn'), null);
      assert.strictEqual(findElementByAttr(container, 'id', 'navModeratorBtn'), null);
      assert.strictEqual(findElementByAttr(container, 'id', 'navAdminBtn'), null);
    });

    test('Authenticated Creator: renders relative creator-lessons.html', () => {
      authManager.setSession({
        token: 'mock-creator-token',
        accountId: 2,
        emailOrPhone: 'creator@gmail.com',
        fullName: 'Biên Soạn Test',
        roles: ['Creator', 'Learner']
      });

      const container = new MockElement('div');
      renderNavbarAuth(container);

      const profileLink = findElementByAttr(container, 'id', 'navProfileBtn');
      assert.strictEqual(profileLink.getAttribute('href'), 'profile.html');

      const studioLink = findElementByAttr(container, 'id', 'navCreatorStudioBtn');
      assert.ok(studioLink, 'Studio link must be present for Creator');
      assert.strictEqual(studioLink.getAttribute('href'), 'creator-lessons.html');
    });

    test('Authenticated Moderator: renders relative moderator-queue.html', () => {
      authManager.setSession({
        token: 'mock-mod-token',
        accountId: 3,
        emailOrPhone: 'moderator@gmail.com',
        fullName: 'Kiểm Duyệt Test',
        roles: ['Moderator', 'Learner']
      });

      const container = new MockElement('div');
      renderNavbarAuth(container);

      const modLink = findElementByAttr(container, 'id', 'navModeratorBtn');
      assert.ok(modLink, 'Moderator queue link must be present for Moderator');
      assert.strictEqual(modLink.getAttribute('href'), 'moderator-queue.html');
    });

    test('Authenticated Admin: renders Studio, Moderator, and Admin relative links', () => {
      authManager.setSession({
        token: 'mock-admin-token',
        accountId: 4,
        emailOrPhone: 'admin@gmail.com',
        fullName: 'Quản Trị Test',
        roles: ['Admin']
      });

      const container = new MockElement('div');
      renderNavbarAuth(container);

      const studioLink = findElementByAttr(container, 'id', 'navCreatorStudioBtn');
      const modLink = findElementByAttr(container, 'id', 'navModeratorBtn');
      const adminLink = findElementByAttr(container, 'id', 'navAdminBtn');

      assert.ok(studioLink);
      assert.strictEqual(studioLink.getAttribute('href'), 'creator-lessons.html');
      assert.ok(modLink);
      assert.strictEqual(modLink.getAttribute('href'), 'moderator-queue.html');
      assert.ok(adminLink);
      assert.strictEqual(adminLink.getAttribute('href'), 'admin-lessons.html');
    });

    test('Lesson detail link in createSafeElement maintains document-relative path', () => {
      const lessonCardLink = createSafeElement('a', {
        attrs: {
          href: 'lesson-detail.html?id=1',
          className: 'lesson-card-link'
        }
      });
      assert.strictEqual(lessonCardLink.getAttribute('href'), 'lesson-detail.html?id=1');
      assert.ok(!lessonCardLink.getAttribute('href').startsWith('https://khoadzsieucapvippro.github.io/lesson-detail.html'),
        'Lesson detail link must NOT strip /WebLearnChinese/ subpath');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. SRS & Vocabulary Invariant & Data Isolation
  // ---------------------------------------------------------------------------
  describe('SRS & Vocabulary Invariant & Data Isolation', () => {

    test('SRS Stats: returns cardsDue 0 when no cards are due (no fake 5 cards)', async () => {
      // Manipulate seed cards so all nextReviewAt are far in the future
      const data = demoFallbackEngine.getData();
      const future = new Date(Date.now() + 1000 * 86400 * 30).toISOString();
      data.srsCards.forEach(c => {
        c.isNew = false;
        c.nextReviewAt = future;
      });
      demoFallbackEngine.saveData();

      const stats = await demoFallbackEngine.handleRequest('/srs/stats');
      assert.strictEqual(stats.cardsDue, 0, 'cardsDue must be 0 when no cards are due (MUST NOT fallback to 5)');
      assert.strictEqual(stats.cardsDueListening, 0);
      assert.strictEqual(stats.cardsDueWriting, 0);
      assert.strictEqual(stats.cardsDueReading, 0);
    });

    test('SRS Due Cards: returns empty array when 0 cards due (does NOT resurrect 5 cards)', async () => {
      const data = demoFallbackEngine.getData();
      const future = new Date(Date.now() + 1000 * 86400 * 30).toISOString();
      data.srsCards.forEach(c => {
        c.isNew = false;
        c.nextReviewAt = future;
      });
      demoFallbackEngine.saveData();

      const dueCards = await demoFallbackEngine.handleRequest('/srs/due');
      assert.ok(Array.isArray(dueCards));
      assert.strictEqual(dueCards.length, 0, 'Must return 0 cards, not fabricate 5');
    });

    test('SRS Review: matches exact cardType and does not overwrite other skill types', async () => {
      const data = demoFallbackEngine.getData();
      // Ensure we have two distinct cards for the same itemId with different cardTypes
      data.srsCards.push(
        {
          cardId: 991,
          itemType: 'VOCABULARY',
          itemId: 99,
          cardType: 'READING',
          hanzi: '学',
          repetitions: 0,
          intervalDays: 0,
          easeFactor: 2.5,
          isNew: false
        },
        {
          cardId: 992,
          itemType: 'VOCABULARY',
          itemId: 99,
          cardType: 'WRITING',
          hanzi: '学',
          repetitions: 0,
          intervalDays: 0,
          easeFactor: 2.5,
          isNew: false
        }
      );
      demoFallbackEngine.saveData();

      // Submit review for WRITING card
      await demoFallbackEngine.handleRequest('/srs/review', {
        method: 'POST',
        body: { itemId: 99, itemType: 'VOCABULARY', cardType: 'WRITING', rating: 4 }
      });

      const updatedWriting = data.srsCards.find(c => c.cardId === 992);
      const unchangedReading = data.srsCards.find(c => c.cardId === 991);

      assert.strictEqual(updatedWriting.repetitions, 1, 'Writing card must have advanced repetition');
      assert.strictEqual(unchangedReading.repetitions, 0, 'Reading card must remain untouched');
    });

    test('Personal Notes: User A notes are not leaked to User B', async () => {
      // User A creates a note
      authManager.setSession({
        token: 'token-a',
        accountId: 101,
        emailOrPhone: 'userA@gmail.com',
        fullName: 'User A',
        roles: ['Learner']
      });

      await demoFallbackEngine.handleRequest('/vocabularies/1/notes', {
        method: 'POST',
        body: { content: 'Secret personal mnemonic by User A' }
      });

      const userANotes = await demoFallbackEngine.handleRequest('/vocabularies/1/notes');
      assert.ok(userANotes.items.some(n => n.content.includes('User A')));

      // Switch session to User B
      authManager.logout(false);
      demoFallbackEngine.resetInMemoryData();

      authManager.setSession({
        token: 'token-b',
        accountId: 202,
        emailOrPhone: 'userB@gmail.com',
        fullName: 'User B',
        roles: ['Learner']
      });

      const userBNotes = await demoFallbackEngine.handleRequest('/vocabularies/1/notes');
      assert.strictEqual(userBNotes.items.some(n => n.content.includes('User A')), false,
        'User B must NOT see User A personal notes');
    });

    test('Backend 404 with JSON is never swallowed by demo fallback', async () => {
      globalThis.fetch = async () => {
        return {
          status: 404,
          ok: false,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          async json() {
            return {
              code: 'NOT_FOUND',
              message: 'Bài học 888 không tồn tại',
              data: null,
              errors: []
            };
          }
        };
      };

      await assert.rejects(
        async () => {
          await apiClient('/lessons/888');
        },
        (err) => {
          assert.ok(err instanceof ApiError);
          assert.strictEqual(err.status, 404);
          assert.strictEqual(err.code, 'NOT_FOUND');
          assert.strictEqual(err.message, 'Bài học 888 không tồn tại');
          return true;
        }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Internal Redirect Normalization & Project Base Path Resolution Contract
  // ---------------------------------------------------------------------------
  describe('Internal Redirect Normalization & Base Path Resolution Contract', () => {
    const ghPagesBaseHref = 'https://khoadzsieucapvippro.github.io/WebLearnChinese/login.html';
    const localBaseHref = 'http://localhost:3000/login.html';

    test('GitHub Pages base URL helper resolves app root directory', () => {
      const baseUrl = getAppBaseUrl(ghPagesBaseHref);
      assert.strictEqual(baseUrl.origin, 'https://khoadzsieucapvippro.github.io');
      assert.strictEqual(baseUrl.pathname, '/WebLearnChinese/');
      assert.strictEqual(baseUrl.href, 'https://khoadzsieucapvippro.github.io/WebLearnChinese/');
    });

    test('Localhost base URL helper resolves root directory', () => {
      const baseUrl = getAppBaseUrl(localBaseHref);
      assert.strictEqual(baseUrl.origin, 'http://localhost:3000');
      assert.strictEqual(baseUrl.pathname, '/');
      assert.strictEqual(baseUrl.href, 'http://localhost:3000/');
    });

    test('CRITICAL REGRESSION: /WebLearnChinese/vocabulary.html DOES NOT DUPLICATE PREFIX', () => {
      // Replicates the exact bug reported in the P0 incident
      const target = validateInternalRedirect('/WebLearnChinese/vocabulary.html', ghPagesBaseHref);
      assert.strictEqual(target, 'vocabulary.html');

      // Final resolved URL when assigned to window.location.href from login.html
      const resolved = new URL(target, ghPagesBaseHref).href;
      assert.strictEqual(resolved, 'https://khoadzsieucapvippro.github.io/WebLearnChinese/vocabulary.html');
      assert.notStrictEqual(
        resolved,
        'https://khoadzsieucapvippro.github.io/WebLearnChinese/WebLearnChinese/vocabulary.html',
        'CRITICAL: Project prefix /WebLearnChinese/ must NEVER be duplicated!'
      );
    });

    test('Crucial test case from prompt: login.html?redirect=%2FWebLearnChinese%2Fvocabulary.html', () => {
      const rawParam = decodeURIComponent('%2FWebLearnChinese%2Fvocabulary.html');
      assert.strictEqual(rawParam, '/WebLearnChinese/vocabulary.html');

      const target = validateInternalRedirect(rawParam, ghPagesBaseHref);
      const resolved = new URL(target, ghPagesBaseHref).href;

      assert.strictEqual(resolved, 'https://khoadzsieucapvippro.github.io/WebLearnChinese/vocabulary.html');
      assert.ok(!resolved.includes('/WebLearnChinese/WebLearnChinese/'));
    });

    test('Redirect to profile.html from /WebLearnChinese/login.html stays within app base', () => {
      const target = validateInternalRedirect('profile.html', ghPagesBaseHref);
      assert.strictEqual(target, 'profile.html');
      const resolved = new URL(target, ghPagesBaseHref).href;
      assert.strictEqual(resolved, 'https://khoadzsieucapvippro.github.io/WebLearnChinese/profile.html');
    });

    test('Redirect to /profile.html (root-relative) from /WebLearnChinese/login.html is normalized into app base', () => {
      const target = validateInternalRedirect('/profile.html', ghPagesBaseHref);
      assert.strictEqual(target, 'profile.html');
      const resolved = new URL(target, ghPagesBaseHref).href;
      assert.strictEqual(resolved, 'https://khoadzsieucapvippro.github.io/WebLearnChinese/profile.html');
    });

    test('Redirect to /WebLearnChinese/profile.html from /WebLearnChinese/login.html is normalized correctly', () => {
      const target = validateInternalRedirect('/WebLearnChinese/profile.html', ghPagesBaseHref);
      assert.strictEqual(target, 'profile.html');
      const resolved = new URL(target, ghPagesBaseHref).href;
      assert.strictEqual(resolved, 'https://khoadzsieucapvippro.github.io/WebLearnChinese/profile.html');
    });

    test('Redirect with query and hash: /WebLearnChinese/vocabulary.html?keyword=test#result', () => {
      const target = validateInternalRedirect('/WebLearnChinese/vocabulary.html?keyword=test#result', ghPagesBaseHref);
      assert.strictEqual(target, 'vocabulary.html?keyword=test#result');
      const resolved = new URL(target, ghPagesBaseHref).href;
      assert.strictEqual(resolved, 'https://khoadzsieucapvippro.github.io/WebLearnChinese/vocabulary.html?keyword=test#result');
    });

    test('Admin page guard redirect parameter without leading slash is normalized without duplicate prefix', () => {
      // admin-accounts-page.js previously stripped leading slash creating 'WebLearnChinese/admin-accounts.html'
      const target = validateInternalRedirect('WebLearnChinese/admin-accounts.html', ghPagesBaseHref);
      assert.strictEqual(target, 'admin-accounts.html');
      const resolved = new URL(target, ghPagesBaseHref).href;
      assert.strictEqual(resolved, 'https://khoadzsieucapvippro.github.io/WebLearnChinese/admin-accounts.html');
      assert.ok(!resolved.includes('/WebLearnChinese/WebLearnChinese/'));
    });

    test('Full same-origin URL is normalized cleanly', () => {
      const target = validateInternalRedirect(
        'https://khoadzsieucapvippro.github.io/WebLearnChinese/vocabulary.html?tab=due',
        ghPagesBaseHref
      );
      assert.strictEqual(target, 'vocabulary.html?tab=due');
      const resolved = new URL(target, ghPagesBaseHref).href;
      assert.strictEqual(resolved, 'https://khoadzsieucapvippro.github.io/WebLearnChinese/vocabulary.html?tab=due');
    });

    test('Local / root deployment: does NOT add /WebLearnChinese/ to URL', () => {
      const targetProfile = validateInternalRedirect('profile.html', localBaseHref);
      assert.strictEqual(targetProfile, 'profile.html');
      const resolvedProfile = new URL(targetProfile, localBaseHref).href;
      assert.strictEqual(resolvedProfile, 'http://localhost:3000/profile.html');
      assert.ok(!resolvedProfile.includes('WebLearnChinese'));

      const targetVocab = validateInternalRedirect('/vocabulary.html?keyword=test', localBaseHref);
      assert.strictEqual(targetVocab, 'vocabulary.html?keyword=test');
      const resolvedVocab = new URL(targetVocab, localBaseHref).href;
      assert.strictEqual(resolvedVocab, 'http://localhost:3000/vocabulary.html?keyword=test');
      assert.ok(!resolvedVocab.includes('WebLearnChinese'));
    });

    test('Strict defense against Open Redirect and dangerous protocols', () => {
      assert.strictEqual(validateInternalRedirect('https://evil.example.com', ghPagesBaseHref), 'index.html');
      assert.strictEqual(validateInternalRedirect('//evil.example.com/phishing', ghPagesBaseHref), 'index.html');
      assert.strictEqual(validateInternalRedirect('/\\evil.example.com', ghPagesBaseHref), 'index.html');
      assert.strictEqual(validateInternalRedirect('\\evil.example.com', ghPagesBaseHref), 'index.html');
      assert.strictEqual(validateInternalRedirect('javascript:alert(1)', ghPagesBaseHref), 'index.html');
      assert.strictEqual(validateInternalRedirect('data:text/html,<script>alert(1)</script>', ghPagesBaseHref), 'index.html');
      assert.strictEqual(validateInternalRedirect('vbscript:msgbox(1)', ghPagesBaseHref), 'index.html');
      assert.strictEqual(validateInternalRedirect('file:///etc/passwd', ghPagesBaseHref), 'index.html');
      assert.strictEqual(validateInternalRedirect('about:blank', ghPagesBaseHref), 'index.html');
    });

    test('Strict defense against directory traversal escaping app base path', () => {
      assert.strictEqual(validateInternalRedirect('../index.html', ghPagesBaseHref), 'index.html');
      assert.strictEqual(validateInternalRedirect('../../etc/passwd', ghPagesBaseHref), 'index.html');
    });

    test('Fallback to index.html for empty, null, directory root, or login.html targets', () => {
      assert.strictEqual(validateInternalRedirect(null, ghPagesBaseHref), 'index.html');
      assert.strictEqual(validateInternalRedirect('', ghPagesBaseHref), 'index.html');
      assert.strictEqual(validateInternalRedirect('   ', ghPagesBaseHref), 'index.html');
      assert.strictEqual(validateInternalRedirect('/', ghPagesBaseHref), 'index.html');
      assert.strictEqual(validateInternalRedirect('/WebLearnChinese/', ghPagesBaseHref), 'index.html');
      assert.strictEqual(validateInternalRedirect('login.html', ghPagesBaseHref), 'index.html');
      assert.strictEqual(validateInternalRedirect('/WebLearnChinese/login.html', ghPagesBaseHref), 'index.html');
    });

    test('Multi-cycle navigation simulation (5 cycles back-and-forth) proves ZERO pathname accumulation', () => {
      let currentHref = 'https://khoadzsieucapvippro.github.io/WebLearnChinese/vocabulary.html';

      for (let cycle = 1; cycle <= 5; cycle++) {
        // Step 1: Open notes modal which triggers promptLogin with current pathname
        const currentUrl = new URL(currentHref);
        const returnUrl = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
        assert.strictEqual(returnUrl, '/WebLearnChinese/vocabulary.html');

        // Step 2: Navigate to login.html?redirect=...
        const loginUrl = new URL(`login.html?redirect=${encodeURIComponent(returnUrl)}`, currentHref).href;
        assert.strictEqual(
          loginUrl,
          'https://khoadzsieucapvippro.github.io/WebLearnChinese/login.html?redirect=%2FWebLearnChinese%2Fvocabulary.html'
        );

        // Step 3: Login form validates redirect and assigns window.location.href
        const redirectParam = new URL(loginUrl).searchParams.get('redirect');
        const target = validateInternalRedirect(redirectParam, loginUrl);
        assert.strictEqual(target, 'vocabulary.html');

        // Step 4: Browser navigates to resolved target
        currentHref = new URL(target, loginUrl).href;
        assert.strictEqual(currentHref, 'https://khoadzsieucapvippro.github.io/WebLearnChinese/vocabulary.html');

        // Step 5: Navigate across navbar: profile -> lessons -> vocabulary
        currentHref = new URL('profile.html', currentHref).href;
        assert.strictEqual(currentHref, 'https://khoadzsieucapvippro.github.io/WebLearnChinese/profile.html');

        currentHref = new URL('lessons.html', currentHref).href;
        assert.strictEqual(currentHref, 'https://khoadzsieucapvippro.github.io/WebLearnChinese/lessons.html');

        currentHref = new URL('vocabulary.html', currentHref).href;
        assert.strictEqual(currentHref, 'https://khoadzsieucapvippro.github.io/WebLearnChinese/vocabulary.html');

        // Invariant: Pathname MUST remain exactly '/WebLearnChinese/vocabulary.html'
        assert.strictEqual(new URL(currentHref).pathname, '/WebLearnChinese/vocabulary.html');
        assert.ok(!currentHref.includes('/WebLearnChinese/WebLearnChinese/'), `Cycle ${cycle} must not accumulate prefix`);
      }
    });
  });
});

/**
 * Recursive helper to search MockElement subtree by attribute value.
 */
function findElementByAttr(node, attrName, attrValue) {
  if (!node) return null;
  if ((node.getAttribute && node.getAttribute(attrName) === attrValue) || node[attrName] === attrValue) {
    return node;
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findElementByAttr(child, attrName, attrValue);
      if (found) return found;
    }
  }
  return null;
}
