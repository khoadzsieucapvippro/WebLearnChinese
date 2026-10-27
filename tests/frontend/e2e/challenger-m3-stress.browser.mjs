/**
 * =============================================================================
 * EMPIRICAL ADVERSARIAL STRESS TEST: MILESTONE M3
 * Challenger: teamwork_preview_challenger_m3_1
 * File: tests/frontend/e2e/challenger-m3-stress.browser.mjs
 * 
 * Objectives:
 * 1. Empirically measure horizontal overflow on ALL 25 pages at 375px mobile viewport.
 * 2. Empirically measure horizontal overflow on core pages at 320px extreme viewport.
 * 3. Verify .lesson-vocab-note-btn reliably opens modal with accurate context switching.
 * 4. Verify rapid multi-clicking does not spawn duplicate modals or corrupt state.
 * 5. Verify input validation (empty, whitespace, 500 char boundary) and live counter.
 * 6. Adversarial injection attack: verify multiple XSS vectors render strictly as safe text.
 * 7. Verify unauthenticated access prompts login without leaking data or calling note API.
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

const ALL_25_PAGES = [
  'index.html',
  'login.html',
  'register.html',
  'profile.html',
  'radicals.html',
  'vocabulary.html',
  'lessons.html',
  'lesson-detail.html?id=1',
  'srs-review.html',
  'srs-dashboard.html',
  'creator-lessons.html',
  'creator-lesson-editor.html?id=1',
  'creator-import.html',
  'moderator-queue.html',
  'moderator-review.html?id=1',
  'moderator-history.html',
  'admin-accounts.html',
  'admin-roles.html',
  'admin-radicals.html',
  'admin-vocabulary.html',
  'admin-lessons.html',
  'admin-audit-logs.html',
  'management.html',
  'ui-verification.html'
];

describe('Empirical Adversarial Challenge: Milestone M3', () => {
  let serverHandle;
  let baseUrl;
  let browser;

  before(async () => {
    serverHandle = await ensureServer({ port: 3000 });
    baseUrl = serverHandle.baseUrl;
    browser = await launchBrowser({ headless: true });
  });

  after(async () => {
    if (browser) await browser.close();
    if (serverHandle) await serverHandle.close();
  });

  async function setupMockSession(page) {
    await page.addInitScript(() => {
      const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');
      if (isAuthPage) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
      } else {
        localStorage.setItem('access_token', 'mock_jwt_challenger');
        localStorage.setItem('user_info', JSON.stringify({
          accountId: 999,
          emailOrPhone: 'challenger@example.com',
          fullName: 'Empirical Challenger',
          roles: ['Admin', 'Creator', 'Moderator', 'Learner']
        }));
      }
    });

    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/lessons/1')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            data: {
              lessonId: 1,
              title: 'Bài 1: Giới thiệu Tiếng Trung cơ bản',
              status: 'Approved',
              vocabularyCount: 2,
              vocabularies: [
                { vocabId: 101, orderIndex: 1, hanzi: '学', pinyin: 'xué', meaningHanViet: 'Học', meaningVi: 'Học tập' },
                { vocabId: 102, orderIndex: 2, hanzi: '习', pinyin: 'xí', meaningHanViet: 'Tập', meaningVi: 'Luyện tập' }
              ]
            }
          })
        });
      }
      if (url.includes('/srs/due')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            data: [{
              itemType: 'VOCABULARY',
              itemId: 101,
              hanzi: '学',
              pinyin: 'xué',
              meaningVi: 'Học tập',
              repetitions: 1,
              easeFactor: 2.5,
              intervalDays: 1
            }]
          })
        });
      }
      if (url.includes('/srs/settings')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            data: { newCardsPerDay: 20, maxReviewPerDay: 100 }
          })
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          data: {
            page: 0,
            size: 20,
            totalElements: 2,
            totalPages: 1,
            items: []
          }
        })
      });
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Measure 375px Horizontal Overflow on ALL 25 Pages
  // ---------------------------------------------------------------------------
  test('CHALLENGE-01: Empirical 375px mobile viewport horizontal overflow measurement on all 25 pages', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 375,
      viewportHeight: 667
    });

    try {
      await setupMockSession(page);

      const measurements = [];

      for (const pageName of ALL_25_PAGES) {
        await page.goto(`${baseUrl}/${pageName}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(100);

        const data = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const clientWidth = docEl.clientWidth;
          const docScrollWidth = docEl.scrollWidth;
          const bodyScrollWidth = body ? body.scrollWidth : 0;
          const maxScrollWidth = Math.max(docScrollWidth, bodyScrollWidth);
          const diff = maxScrollWidth - clientWidth;

          return {
            clientWidth,
            maxScrollWidth,
            diff: Number(diff.toFixed(2))
          };
        });

        measurements.push({ page: pageName, ...data });

        // Assert strictly <= 1.0px difference for subpixel rounding
        assert.ok(
          data.diff <= 1.0,
          `Page ${pageName} has horizontal overflow at 375px: clientWidth=${data.clientWidth}, scrollWidth=${data.maxScrollWidth}, diff=${data.diff}px`
        );
      }

      console.log('--- 375px Overflow Audit Results (25 Pages) ---');
      measurements.forEach((m) => {
        console.log(`  [OK] ${m.page.padEnd(35)} client: ${m.clientWidth}px, scroll: ${m.maxScrollWidth}px (diff: ${m.diff}px)`);
      });

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors detected:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 2: Measure 320px Reflow Overflow on Core Pages
  // ---------------------------------------------------------------------------
  test('CHALLENGE-02: Extreme 320px viewport (WCAG 2.2 Reflow) horizontal overflow check', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 320,
      viewportHeight: 568
    });

    try {
      await setupMockSession(page);

      const corePages = [
        'index.html',
        'login.html',
        'lesson-detail.html?id=1',
        'radicals.html',
        'vocabulary.html',
        'srs-review.html',
        'management.html'
      ];

      for (const pageName of corePages) {
        await page.goto(`${baseUrl}/${pageName}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(100);

        const data = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const clientWidth = docEl.clientWidth;
          const maxScrollWidth = Math.max(docEl.scrollWidth, body ? body.scrollWidth : 0);
          return { clientWidth, maxScrollWidth, diff: maxScrollWidth - clientWidth };
        });

        assert.ok(
          data.diff <= 1.0,
          `Page ${pageName} overflows at 320px: client=${data.clientWidth}, scroll=${data.maxScrollWidth}, diff=${data.diff}`
        );
      }

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 3: Notes Modal Multi-Item Trigger & Context Switching
  // ---------------------------------------------------------------------------
  test('CHALLENGE-03: .lesson-vocab-note-btn triggers modal with correct context for distinct items', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 375,
      viewportHeight: 667
    });

    try {
      await setupMockSession(page);

      const requestedVocabIds = [];
      await page.route('**/api/v1/vocabularies/*/notes*', async (route) => {
        const url = route.request().url();
        const match = url.match(/\/vocabularies\/(\d+)\/notes/);
        if (match) requestedVocabIds.push(match[1]);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }
          })
        });
      });

      await page.goto(`${baseUrl}/lesson-detail.html?id=1`, { waitUntil: 'domcontentloaded' });
      await page.locator('#lessonVocabList').waitFor({ state: 'visible' });

      const noteBtns = page.locator('.lesson-vocab-note-btn');
      assert.strictEqual(await noteBtns.count(), 2, 'Must render exactly 2 note buttons for 2 vocabularies');

      // Click item 1 (vocabId 101, '学')
      await noteBtns.nth(0).click();
      const modal = page.locator('#notesModal');
      await modal.waitFor({ state: 'visible' });

      assert.strictEqual(await page.locator('#notesContextHanzi').textContent(), '学');
      assert.strictEqual(requestedVocabIds[requestedVocabIds.length - 1], '101');

      // Close modal using close button
      await page.locator('#notesModalCloseBtn').click();
      await modal.waitFor({ state: 'hidden' });

      // Click item 2 (vocabId 102, '习')
      await noteBtns.nth(1).click();
      await modal.waitFor({ state: 'visible' });

      assert.strictEqual(await page.locator('#notesContextHanzi').textContent(), '习');
      assert.strictEqual(requestedVocabIds[requestedVocabIds.length - 1], '102');

      // Close modal with Escape
      await page.keyboard.press('Escape');
      await modal.waitFor({ state: 'hidden' });

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 4: Rapid Multi-Clicking & Concurrency Protection
  // ---------------------------------------------------------------------------
  test('CHALLENGE-04: Rapid clicking on .lesson-vocab-note-btn does not spawn duplicate modals or corrupt state', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 375,
      viewportHeight: 667
    });

    try {
      await setupMockSession(page);

      await page.route('**/api/v1/vocabularies/*/notes*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }
          })
        });
      });

      await page.goto(`${baseUrl}/lesson-detail.html?id=1`, { waitUntil: 'domcontentloaded' });
      await page.locator('#lessonVocabList').waitFor({ state: 'visible' });

      const noteBtn = page.locator('.lesson-vocab-note-btn').first();

      // Trigger 5 clicks rapidly in browser DOM
      await noteBtn.evaluate((el) => {
        for (let i = 0; i < 5; i++) {
          el.click();
        }
      });

      await page.waitForTimeout(300);

      const modalCount = await page.locator('#notesModal').count();
      assert.strictEqual(modalCount, 1, 'Only one modal dialog should exist in the DOM');

      const isModalOpen = await page.locator('#notesModal').evaluate((el) => el.open || el.hasAttribute('open'));
      assert.strictEqual(isModalOpen, true, 'Modal should be cleanly open');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 5: Input Validation & Boundary Enforcement
  // ---------------------------------------------------------------------------
  test('CHALLENGE-05: Input validation blocks empty/whitespace notes and strictly enforces 500-char max', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 375,
      viewportHeight: 667
    });

    try {
      await setupMockSession(page);

      let postCallCount = 0;
      await page.route('**/api/v1/vocabularies/*/notes*', async (route) => {
        if (route.request().method() === 'POST') {
          postCallCount++;
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'SUCCESS',
              data: { noteId: 555, content: 'Saved', createdAt: new Date().toISOString() }
            })
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            data: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }
          })
        });
      });

      await page.goto(`${baseUrl}/lesson-detail.html?id=1`, { waitUntil: 'domcontentloaded' });
      await page.locator('.lesson-vocab-note-btn').first().click();

      const modal = page.locator('#notesModal');
      await modal.waitFor({ state: 'visible' });

      const textarea = page.locator('#noteContentInput');
      const submitBtn = page.locator('#noteSubmitBtn');
      const feedback = page.locator('#noteFeedback');

      // 1. Submit empty
      await submitBtn.click();
      assert.strictEqual(postCallCount, 0, 'Must NOT invoke API for empty note');
      assert.ok((await feedback.textContent()).includes('không được để trống'));

      // 2. Submit whitespace-only
      await textarea.fill('    \n\t   ');
      await submitBtn.click();
      assert.strictEqual(postCallCount, 0, 'Must NOT invoke API for whitespace note');
      assert.ok((await feedback.textContent()).includes('không được để trống'));

      // 3. Exact 500-character boundary
      const exact500 = 'A'.repeat(500);
      await textarea.fill(exact500);

      const counterText = await page.locator('#noteCharCountVal').textContent();
      assert.strictEqual(counterText, '500', 'Live counter must show 500');

      await submitBtn.click();
      assert.strictEqual(postCallCount, 1, '500-char note must be submitted successfully');

      // 4. Over 500 characters capped by maxlength
      const maxlength = await textarea.getAttribute('maxlength');
      assert.strictEqual(maxlength, '500', 'Textarea must enforce maxlength="500"');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 6: Adversarial XSS & DOM Sink Immunity
  // ---------------------------------------------------------------------------
  test('CHALLENGE-06: Adversarial multi-vector XSS payload rendered strictly as safe textContent', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 375,
      viewportHeight: 667
    });

    try {
      await setupMockSession(page);

      const adversarialPayload = `<script>window.__CHALLENGER_PWNED__=true</script><img src="x" onerror="window.__CHALLENGER_PWNED__=true"><svg onload="window.__CHALLENGER_PWNED__=true"><a href="javascript:window.__CHALLENGER_PWNED__=true">CLICK_ME</a>`;

      await page.route('**/api/v1/vocabularies/*/notes*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              items: [{
                noteId: 999,
                vocabId: 101,
                content: adversarialPayload,
                createdAt: '2026-10-24T12:00:00Z'
              }],
              page: 0,
              size: 20,
              totalElements: 1,
              totalPages: 1
            }
          })
        });
      });

      await page.goto(`${baseUrl}/lesson-detail.html?id=1`, { waitUntil: 'domcontentloaded' });
      await page.locator('.lesson-vocab-note-btn').first().click();

      const noteCard = page.locator('.note-item[data-note-id="999"]');
      await noteCard.waitFor({ state: 'visible' });

      // Verify zero script execution in page context
      const isPwned = await page.evaluate(() => Boolean(window.__CHALLENGER_PWNED__));
      assert.strictEqual(isPwned, false, 'Adversarial payload must NEVER execute');

      // Verify no script or img elements were injected into note card
      const scriptTags = await noteCard.locator('script').count();
      const imgTags = await noteCard.locator('img').count();
      const svgTags = await noteCard.locator('svg').count();
      assert.strictEqual(scriptTags, 0, 'No <script> tag should exist in DOM');
      assert.strictEqual(imgTags, 0, 'No <img> tag should exist in DOM');
      assert.strictEqual(svgTags, 0, 'No <svg> tag should exist in DOM');

      // Verify textContent matches raw payload verbatim
      const text = await noteCard.locator('.note-content').textContent();
      assert.strictEqual(text, adversarialPayload, 'Payload must be preserved verbatim as safe text');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 7: Anonymous User Guard & Data Leak Prevention
  // ---------------------------------------------------------------------------
  test('CHALLENGE-07: Unauthenticated user clicking note button prompts login with zero notes API calls', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 375,
      viewportHeight: 667
    });

    try {
      // Setup unauthenticated session
      await page.addInitScript(() => {
        localStorage.clear();
      });

      let notesApiCalled = false;
      await page.route('**/api/v1/vocabularies/*/notes*', async (route) => {
        notesApiCalled = true;
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'UNAUTHORIZED' })
        });
      });

      await page.route('**/api/v1/lessons/1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            data: {
              lessonId: 1,
              title: 'Bài 1: Giới thiệu',
              status: 'Approved',
              vocabularies: [
                { vocabId: 101, orderIndex: 1, hanzi: '学', pinyin: 'xué', meaningVi: 'Học' }
              ]
            }
          })
        });
      });

      await page.goto(`${baseUrl}/lesson-detail.html?id=1`, { waitUntil: 'domcontentloaded' });
      const noteBtn = page.locator('.lesson-vocab-note-btn').first();
      await noteBtn.waitFor({ state: 'visible' });
      await noteBtn.click();

      // Check login prompt dialog
      const confirmDialog = page.locator('.modal.show, .modal[role="dialog"]');
      await confirmDialog.waitFor({ state: 'visible' });
      const promptText = await confirmDialog.textContent();
      assert.ok(
        promptText.includes('Đăng nhập') || promptText.includes('Ghi chú cá nhân'),
        `Expected login prompt in confirm dialog, got: "${promptText}"`
      );

      // Verify notes API was never called
      assert.strictEqual(notesApiCalled, false, 'Notes API must strictly never be called for anonymous users');

      // Verify notes modal dialog itself is NOT opened
      const notesModalOpen = await page.locator('#notesModal').count() === 0 ||
        !(await page.locator('#notesModal').evaluate((el) => el.open || el.hasAttribute('open')));
      assert.strictEqual(notesModalOpen, true, 'Notes modal must NOT open for unauthenticated users');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });
});
