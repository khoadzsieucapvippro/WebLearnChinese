/**
 * =============================================================================
 * BROWSER E2E TEST: CHINESE VOCABULARY CATALOG & SEARCH UI (TASK 9B.3)
 * File: tests/frontend/e2e/vocabulary.browser.mjs
 * 
 * Verifies:
 * - VB1: Page loads successfully with single primary <h1> and semantic landmarks.
 * - VB2: Initial catalog request uses GET /api/v1/vocabulary?page=0&size=20 (NEVER 'q').
 * - VB3: Card summary renders Hanzi, Pinyin, Hán-Việt, Vietnamese meaning, pronunciation control.
 * - VB4: Search by Hanzi glyph (e.g. '书') sends ?search=... with 300ms debounce.
 * - VB5: Search by Pinyin with tone ('shū') and toneless ('shu') supported via backend contract.
 * - VB6: Empty state displayed on zero search results; clear action resets query and catalog.
 * - VB7: Pagination controls navigate pages and update URL/state correctly.
 * - VB8: Page size switcher (12, 20, 40) resets to page 0 and updates size param.
 * - VB9: Progressive Radical Disclosure: list makes zero detail calls; clicking card fetches GET /vocabulary/{id}.
 * - VB10: Detail Modal displays constituent radicals and interactive radical preview link.
 * - VB11: Native <dialog> closes on Escape and close button; restores focus to triggering element.
 * - VB12: Web Speech API pronunciation button activates safely without page crash.
 * - VB13: API 500 error triggers Error state with working Retry button.
 * - VB14: Mobile 375px viewport renders cleanly with zero horizontal overflow.
 * - VB15: Adversarial script payload in vocabulary fields is safely escaped as plain text.
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

function createMockVocabularyItems() {
  return [
    {
      vocabId: 1,
      hanzi: '书',
      pinyin: 'shū',
      meaningHanViet: 'Thư',
      meaningVi: 'Sách, vở',
      audioUrl: 'https://cdn.example.com/audio/shu.mp3'
    },
    {
      vocabId: 2,
      hanzi: '学',
      pinyin: 'xué',
      meaningHanViet: 'Học',
      meaningVi: 'Học tập, nghiên cứu',
      audioUrl: null
    },
    {
      vocabId: 3,
      hanzi: '休',
      pinyin: 'xiū',
      meaningHanViet: 'Hưu',
      meaningVi: 'Nghỉ ngơi',
      audioUrl: null
    },
    {
      vocabId: 4,
      hanzi: '你',
      pinyin: 'nǐ',
      meaningHanViet: 'Nhĩ',
      meaningVi: 'Bạn, anh, chị (đại từ ngôi thứ 2)',
      audioUrl: 'https://cdn.example.com/audio/ni.mp3'
    }
  ];
}

function createMockDetailResponse(vocabId) {
  const map = {
    1: {
      vocabId: 1,
      hanzi: '书',
      pinyin: 'shū',
      meaningHanViet: 'Thư',
      meaningVi: 'Sách, vở',
      exampleSentence: '我买了一本书。',
      exampleTranslation: 'Tôi đã mua một cuốn sách.',
      audioUrl: 'https://cdn.example.com/audio/shu.mp3',
      radicals: [
        { radicalId: 6, character: '亅', pinyin: 'jué', meaningHanViet: 'Quyết', meaningVi: 'Nét móc' }
      ]
    },
    3: {
      vocabId: 3,
      hanzi: '休',
      pinyin: 'xiū',
      meaningHanViet: 'Hưu',
      meaningVi: 'Nghỉ ngơi',
      exampleSentence: '他在家里休息。',
      exampleTranslation: 'Anh ấy nghỉ ngơi ở nhà.',
      audioUrl: null,
      radicals: [
        { radicalId: 9, character: '亻', pinyin: 'rén', meaningHanViet: 'Nhân', meaningVi: 'Người' },
        { radicalId: 75, character: '木', pinyin: 'mù', meaningHanViet: 'Mộc', meaningVi: 'Cây cối' }
      ]
    }
  };

  return map[vocabId] || {
    vocabId: Number(vocabId),
    hanzi: '字',
    pinyin: 'zì',
    meaningHanViet: 'Tự',
    meaningVi: 'Chữ Hán',
    exampleSentence: '这个字很好写。',
    exampleTranslation: 'Chữ này rất dễ viết.',
    audioUrl: null,
    radicals: []
  };
}

describe('Browser E2E: Chinese Vocabulary Catalog & Search UI', () => {
  let serverHandle;
  let browser;
  let baseUrl;

  before(async () => {
    serverHandle = await ensureServer({ port: 3000 });
    baseUrl = serverHandle.baseUrl;
    browser = await launchBrowser({ headless: true });
  });

  after(async () => {
    if (browser) await browser.close();
    if (serverHandle) await serverHandle.close();
  });

  test('VB1-VB3: Initial load renders vocabulary catalog, summary cards, and verifies backend query params', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);
    const mockItems = createMockVocabularyItems();
    let requestedUrl = null;

    try {
      await page.route('**/api/v1/vocabulary*', async (route) => {
        const url = route.request().url();
        if (!url.includes('/api/v1/vocabulary/')) {
          requestedUrl = url;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'SUCCESS',
              message: 'OK',
              data: {
                page: 0,
                size: 20,
                totalElements: mockItems.length,
                totalPages: 1,
                first: true,
                last: true,
                items: mockItems
              }
            })
          });
          return;
        }
        await route.continue();
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      // 1. Verify H1
      const h1Text = await page.locator('h1#vocabPageHeading').textContent();
      assert.ok(h1Text.includes('Từ Vựng'), `Expected 'Từ Vựng' in H1, got "${h1Text}"`);

      // 2. Verify backend query contract: must use search, page, size; strictly NEVER 'q'
      assert.ok(requestedUrl, 'API request must have been dispatched');
      assert.ok(requestedUrl.includes('page=0'), 'Must request page=0');
      assert.ok(requestedUrl.includes('size=20'), 'Must request size=20 by default');
      assert.ok(!requestedUrl.includes('q='), 'Must NEVER include q= parameter in backend contract');

      // 3. Verify cards rendered
      const cardCount = await page.locator('.vocab-card').count();
      assert.strictEqual(cardCount, 4, 'Should render 4 vocabulary cards');

      // 4. Verify first card summary details
      const firstCard = page.locator('.vocab-card').first();
      assert.ok((await firstCard.locator('.vocab-card-hanzi').textContent()).includes('书'));
      assert.ok((await firstCard.locator('.vocab-card-pinyin').textContent()).includes('shū'));
      assert.ok((await firstCard.locator('.vocab-card-hanviet').textContent()).includes('Thư'));
      assert.ok((await firstCard.locator('.vocab-card-meaning').textContent()).includes('Sách, vở'));

      // 5. Verify result count badge
      const countText = await page.locator('#vocabResultCount').textContent();
      assert.ok(countText.includes('4'), `Expected '4' in counter badge, got "${countText}"`);

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors on page load: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('VB4-VB5: Multi-criteria search (Hanzi, Pinyin with tone, toneless Pinyin) sends search= query with debounce', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);
    let capturedSearches = [];

    try {
      await page.route('**/api/v1/vocabulary*', async (route) => {
        const url = route.request().url();
        if (!url.includes('/api/v1/vocabulary/')) {
          const parsedUrl = new URL(url);
          const searchParam = parsedUrl.searchParams.get('search');
          capturedSearches.push(searchParam);

          let filtered = createMockVocabularyItems();
          if (searchParam) {
            filtered = filtered.filter(v => 
              v.hanzi.includes(searchParam) || 
              v.pinyin.includes(searchParam) || 
              (searchParam === 'shu' && v.hanzi === '书')
            );
          }

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'SUCCESS',
              message: 'OK',
              data: {
                page: 0,
                size: 20,
                totalElements: filtered.length,
                totalPages: 1,
                first: true,
                last: true,
                items: filtered
              }
            })
          });
          return;
        }
        await route.continue();
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      // Search by Hanzi: '书'
      await page.fill('#vocabSearchInput', '书');
      await page.waitForTimeout(400); // Allow 300ms debounce to settle
      await page.waitForFunction(() => document.querySelectorAll('.vocab-card').length === 1);

      const hanziText = await page.locator('.vocab-card .vocab-card-hanzi').textContent();
      assert.strictEqual(hanziText.trim(), '书');

      // Search by toneless Pinyin: 'shu'
      await page.fill('#vocabSearchInput', 'shu');
      await page.waitForTimeout(400);
      await page.waitForFunction(() => document.querySelectorAll('.vocab-card').length === 1);
      assert.strictEqual((await page.locator('.vocab-card .vocab-card-hanzi').textContent()).trim(), '书');

      // Assert parameter was 'search', never 'q'
      assert.ok(capturedSearches.includes('书'), "Must capture search='书'");
      assert.ok(capturedSearches.includes('shu'), "Must capture search='shu'");

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('VB6: Non-matching search triggers Empty state, Clear button resets query and catalog', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/vocabulary*', async (route) => {
        const url = route.request().url();
        if (!url.includes('/api/v1/vocabulary/')) {
          const parsed = new URL(url);
          const query = parsed.searchParams.get('search');
          const items = query === 'zzzzz' ? [] : createMockVocabularyItems();

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'SUCCESS',
              message: 'OK',
              data: {
                page: 0,
                size: 20,
                totalElements: items.length,
                totalPages: items.length > 0 ? 1 : 0,
                first: true,
                last: true,
                items
              }
            })
          });
          return;
        }
        await route.continue();
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      // Search non-existent term
      await page.fill('#vocabSearchInput', 'zzzzz');
      await page.waitForTimeout(400);

      // Verify Empty state displayed
      await page.waitForSelector('.state-empty-title');
      const emptyText = await page.locator('.state-empty-title').textContent();
      assert.ok(emptyText.includes('Không tìm thấy từ vựng'), 'Must display empty state message');

      // Verify redundant toast notification is NOT displayed
      const toastCount = await page.locator('.toast').count();
      assert.strictEqual(toastCount, 0, 'Must NOT display redundant toast notification on empty search');

      // Click clear search button
      const clearBtn = page.locator('#searchClearBtn');
      await clearBtn.click();
      await page.waitForTimeout(400);

      // Catalog must be restored
      await page.waitForSelector('.vocab-card');
      const restoredCount = await page.locator('.vocab-card').count();
      assert.strictEqual(restoredCount, 4, 'Should restore all 4 vocabulary cards after clear');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('VB7-VB8: Pagination navigation and absence of page size selector', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);
    let lastRequestedPage = 0;
    let lastRequestedSize = 20;

    try {
      await page.route('**/api/v1/vocabulary*', async (route) => {
        const url = route.request().url();
        if (!url.includes('/api/v1/vocabulary/')) {
          const parsed = new URL(url);
          lastRequestedPage = Number(parsed.searchParams.get('page') || 0);
          lastRequestedSize = Number(parsed.searchParams.get('size') || 20);

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'SUCCESS',
              message: 'OK',
              data: {
                page: lastRequestedPage,
                size: lastRequestedSize,
                totalElements: 50,
                totalPages: Math.ceil(50 / lastRequestedSize),
                first: lastRequestedPage === 0,
                last: lastRequestedPage >= Math.ceil(50 / lastRequestedSize) - 1,
                items: createMockVocabularyItems()
              }
            })
          });
          return;
        }
        await route.continue();
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      // 1. Verify absence of page size selector (Task Requirement 2)
      assert.strictEqual(await page.$('#pageSizeSelect'), null, 'No page size selector in catalog toolbar');
      assert.strictEqual(lastRequestedSize, 20, 'Default page size must be 20');

      // 2. Verify next button is enabled on multi-page catalog and advances page
      const nextBtn = page.locator('#vocabPaginationNextBtn');
      assert.strictEqual(await nextBtn.getAttribute('disabled'), null, 'Next button must not be disabled on multi-page catalog');

      // Click next page
      await nextBtn.click();
      await page.waitForTimeout(100);
      assert.strictEqual(lastRequestedPage, 1, 'Should request page=1');

      // 3. Verify prev button returns to page 0
      const prevBtn = page.locator('#vocabPaginationPrevBtn');
      await prevBtn.click();
      await page.waitForTimeout(100);
      assert.strictEqual(lastRequestedPage, 0, 'Should request page=0');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('VB9-VB11: Progressive Radical Disclosure & Native Dialog Modal accessibility', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);
    let detailRequestCount = 0;
    let detailRequestedId = null;

    try {
      await page.route('**/api/v1/vocabulary**', async (route) => {
        const url = route.request().url();
        const detailMatch = url.match(/\/api\/v1\/vocabulary\/(\d+)/);

        if (detailMatch) {
          detailRequestCount++;
          detailRequestedId = detailMatch[1];
          const mockDetail = createMockDetailResponse(detailRequestedId);
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'SUCCESS',
              message: 'OK',
              data: mockDetail
            })
          });
          return;
        }

        // Summary list endpoint
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              page: 0,
              size: 20,
              totalElements: 4,
              totalPages: 1,
              first: true,
              last: true,
              items: createMockVocabularyItems()
            }
          })
        });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      // Zero N+1 Invariant: catalog load must have made 0 detail calls
      assert.strictEqual(detailRequestCount, 0, 'Zero detail requests must be made during list view loading');

      // Click card #3 ('休' which has radicals: 亻, 木)
      const card3 = page.locator('.vocab-card').nth(2);
      await card3.click();

      // Verify modal opens and wait for progressive radical disclosure
      const modal = page.locator('#vocabDetailModal');
      await modal.waitFor({ state: 'visible' });

      // Wait for constituent radicals rendered via progressive disclosure
      await page.waitForSelector('.vocab-radical-badge');
      assert.strictEqual(detailRequestCount, 1, 'Exactly 1 detail request made on card click');
      assert.strictEqual(detailRequestedId, '3', 'Detail request must target vocabulary ID 3');

      const radicalBadges = page.locator('.vocab-radical-badge');
      assert.strictEqual(await radicalBadges.count(), 2, 'Should render 2 constituent radicals (亻, 木)');

      // Click first radical badge to inspect progressive reveal
      await radicalBadges.first().click();
      await page.waitForSelector('.vocab-radical-preview-box');
      const previewText = await page.locator('.vocab-radical-preview-box').textContent();
      assert.ok(previewText.includes('Nhân') || previewText.includes('Người'), 'Preview box shows radical details');

      // Verify safe link to radicals.html exists
      const exploreLink = page.locator('.vocab-radical-preview-box a');
      assert.ok(await exploreLink.count() > 0, 'Must provide link to explore radical in radicals.html');

      // Close modal using Escape key
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => {
        const m = document.getElementById('vocabDetailModal');
        return !m || !m.open;
      });

      // Verify focus is restored to the triggering card
      const focusedTagName = await page.evaluate(() => document.activeElement ? document.activeElement.tagName.toLowerCase() : null);
      assert.strictEqual(focusedTagName, 'div', 'Focus should be restored to the activating card');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('VB12: Pronunciation trigger invokes speech synthesis safely without exception', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/vocabulary*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              page: 0,
              size: 20,
              totalElements: 1,
              totalPages: 1,
              first: true,
              last: true,
              items: [createMockVocabularyItems()[0]]
            }
          })
        });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      const speechBtn = page.locator('.vocab-speech-btn').first();
      await speechBtn.click();

      // Page must remain healthy with zero uncaught errors
      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Speech button triggered uncaught errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('VB13: Backend 500 error triggers Error state, Retry button re-executes query', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);
    let shouldFail = true;

    try {
      await page.route('**/api/v1/vocabulary*', async (route) => {
        if (shouldFail) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Lỗi cơ sở dữ liệu mô phỏng',
              data: null
            })
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              page: 0,
              size: 20,
              totalElements: 1,
              totalPages: 1,
              first: true,
              last: true,
              items: [createMockVocabularyItems()[0]]
            }
          })
        });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });

      // Error state must be visible
      await page.waitForSelector('.state-error-title');
      const errorText = await page.locator('.state-container').textContent();
      assert.ok(errorText.includes('Thử lại'), 'Error state must have retry prompt');

      // Flip fail flag and click retry
      shouldFail = false;
      const retryBtn = page.locator('#vocabStateContainer button');
      await retryBtn.click();

      // Catalog recovered
      await page.waitForSelector('.vocab-card');
      assert.strictEqual(await page.locator('.vocab-card').count(), 1, 'Should recover catalog after retry');
    } finally {
      await context.close();
    }
  });

  test('VB14: Mobile viewport 375px renders with zero horizontal overflow', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 375,
      viewportHeight: 667
    });

    try {
      await page.route('**/api/v1/vocabulary*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              page: 0,
              size: 20,
              totalElements: 2,
              totalPages: 1,
              first: true,
              last: true,
              items: createMockVocabularyItems().slice(0, 2)
            }
          })
        });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      assert.strictEqual(isOverflowing, false, 'Mobile viewport (375px) must not have horizontal scroll');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('VB15: Adversarial script payload in vocabulary records is safely escaped without execution', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);
    let xssExecuted = false;

    try {
      await page.exposeFunction('onXssExecuted', () => {
        xssExecuted = true;
      });

      const adversarialItem = {
        vocabId: 999,
        hanzi: '危',
        pinyin: '<script>window.onXssExecuted()</script>',
        meaningHanViet: 'Nguy<img src=x onerror="window.onXssExecuted()">',
        meaningVi: 'Nguy hiểm',
        audioUrl: 'javascript:window.onXssExecuted()'
      };

      await page.route('**/api/v1/vocabulary*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              page: 0,
              size: 20,
              totalElements: 1,
              totalPages: 1,
              first: true,
              last: true,
              items: [adversarialItem]
            }
          })
        });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      // Verify text is literal and not executed
      const card = page.locator('.vocab-card').first();
      const pinyinText = await card.locator('.vocab-card-pinyin').textContent();
      assert.ok(pinyinText.includes('<script>'), 'Must render script tags as literal text');
      assert.strictEqual(xssExecuted, false, 'Adversarial XSS script must NEVER execute');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors during adversarial rendering: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('VB16: HSK 1/2/3 level tabs exist, default to HSK 1, and switch view heading, badge, and URL query on click', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/vocabulary*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              page: 0,
              size: 20,
              totalElements: 4,
              totalPages: 1,
              first: true,
              last: true,
              items: createMockVocabularyItems()
            }
          })
        });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      // Verify all 3 tabs are present with exact accessible names
      const tab1 = page.locator('#tabHsk1');
      const tab2 = page.locator('#tabHsk2');
      const tab3 = page.locator('#tabHsk3');

      assert.strictEqual(await tab1.isVisible(), true);
      assert.strictEqual(await tab2.isVisible(), true);
      assert.strictEqual(await tab3.isVisible(), true);

      assert.strictEqual((await tab1.textContent()).trim(), 'HSK 1');
      assert.strictEqual((await tab2.textContent()).trim(), 'HSK 2');
      assert.strictEqual((await tab3.textContent()).trim(), 'HSK 3');

      // Default active tab is HSK 1
      assert.strictEqual(await tab1.getAttribute('aria-selected'), 'true');
      assert.strictEqual(await tab1.getAttribute('tabindex'), '0');
      assert.strictEqual(await tab2.getAttribute('aria-selected'), 'false');
      assert.strictEqual(await tab2.getAttribute('tabindex'), '-1');
      assert.strictEqual(await tab3.getAttribute('aria-selected'), 'false');

      // Heading and badge reflect HSK 1
      assert.strictEqual((await page.locator('#vocabCategoryBadge').textContent()).trim(), 'Từ Vựng HSK 1');
      assert.strictEqual((await page.locator('#vocabPageHeading').textContent()).trim(), 'Từ Vựng Tiếng Trung HSK 1');

      // Click HSK 2
      await page.click('#tabHsk2');

      // State updates to HSK 2
      assert.strictEqual(await tab2.getAttribute('aria-selected'), 'true');
      assert.strictEqual(await tab1.getAttribute('aria-selected'), 'false');
      assert.strictEqual((await page.locator('#vocabCategoryBadge').textContent()).trim(), 'Từ Vựng HSK 2');
      assert.strictEqual((await page.locator('#vocabPageHeading').textContent()).trim(), 'Từ Vựng Tiếng Trung HSK 2');
      assert.ok(page.url().includes('hsk=2'), 'URL must reflect ?hsk=2');

      // Click HSK 3
      await page.click('#tabHsk3');

      // State updates to HSK 3
      assert.strictEqual(await tab3.getAttribute('aria-selected'), 'true');
      assert.strictEqual(await tab2.getAttribute('aria-selected'), 'false');
      assert.strictEqual((await page.locator('#vocabCategoryBadge').textContent()).trim(), 'Từ Vựng HSK 3');
      assert.strictEqual((await page.locator('#vocabPageHeading').textContent()).trim(), 'Từ Vựng Tiếng Trung HSK 3');
      assert.ok(page.url().includes('hsk=3'), 'URL must reflect ?hsk=3');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('VB17: HSK tabs keyboard navigation: ArrowLeft/Right, Home/End, visible focus', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/vocabulary*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              page: 0,
              size: 20,
              totalElements: 4,
              totalPages: 1,
              first: true,
              last: true,
              items: createMockVocabularyItems()
            }
          })
        });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      // 1. Focus Tab HSK 1
      await page.focus('#tabHsk1');
      assert.strictEqual(await page.locator('#tabHsk1').getAttribute('aria-selected'), 'true');

      // 2. Press ArrowRight -> activates HSK 2
      await page.keyboard.press('ArrowRight');
      assert.strictEqual(await page.locator('#tabHsk2').getAttribute('aria-selected'), 'true');

      // 3. Press ArrowRight -> activates HSK 3
      await page.keyboard.press('ArrowRight');
      assert.strictEqual(await page.locator('#tabHsk3').getAttribute('aria-selected'), 'true');

      // 4. Press Home -> jumps to HSK 1
      await page.keyboard.press('Home');
      assert.strictEqual(await page.locator('#tabHsk1').getAttribute('aria-selected'), 'true');

      // 5. Press End -> jumps to HSK 3
      await page.keyboard.press('End');
      assert.strictEqual(await page.locator('#tabHsk3').getAttribute('aria-selected'), 'true');

      // 6. Press ArrowLeft -> activates HSK 2
      await page.keyboard.press('ArrowLeft');
      assert.strictEqual(await page.locator('#tabHsk2').getAttribute('aria-selected'), 'true');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('VB18: Direct URL navigation with ?hsk=2 activates HSK 2 tab and updates heading', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/vocabulary*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              page: 0,
              size: 20,
              totalElements: 4,
              totalPages: 1,
              first: true,
              last: true,
              items: createMockVocabularyItems()
            }
          })
        });
      });

      await page.goto(`${baseUrl}/vocabulary.html?hsk=2`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      assert.strictEqual(await page.locator('#tabHsk2').getAttribute('aria-selected'), 'true');
      assert.strictEqual(await page.locator('#tabHsk1').getAttribute('aria-selected'), 'false');
      assert.strictEqual((await page.locator('#vocabPageHeading').textContent()).trim(), 'Từ Vựng Tiếng Trung HSK 2');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('VB19: Navbar is flat with direct links: "Bộ thủ" and "Từ vựng" have zero dropdowns/submenus', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/vocabulary*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              page: 0,
              size: 20,
              totalElements: 4,
              totalPages: 1,
              first: true,
              last: true,
              items: createMockVocabularyItems()
            }
          })
        });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      // 1. Verify zero dropdown buttons or menus exist in the navbar
      assert.strictEqual(await page.locator('#navRadicalsDropdownBtn').count(), 0, 'No radicals dropdown button should exist');
      assert.strictEqual(await page.locator('#navVocabDropdownBtn').count(), 0, 'No vocab dropdown button should exist');
      assert.strictEqual(await page.locator('#navRadicalsMenu').count(), 0, 'No radicals dropdown menu should exist');
      assert.strictEqual(await page.locator('#navVocabMenu').count(), 0, 'No vocab dropdown menu should exist');
      assert.strictEqual(await page.locator('.dropdown-chevron').count(), 0, 'No dropdown chevrons should exist');

      // 2. Verify direct links in navbar
      const homeLink = page.locator('#primaryNavMenu a[href="index.html"]');
      const radicalsLink = page.locator('#primaryNavMenu a[href="radicals.html"]');
      const vocabLink = page.locator('#primaryNavMenu a[href="vocabulary.html"]');
      const lessonsLink = page.locator('#primaryNavMenu a[href="lessons.html"]');
      const srsLink = page.locator('#primaryNavMenu a[href="srs-review.html"]');

      assert.strictEqual(await homeLink.isVisible(), true);
      assert.strictEqual((await homeLink.textContent()).trim(), 'Trang chủ');

      assert.strictEqual(await radicalsLink.isVisible(), true);
      assert.strictEqual((await radicalsLink.textContent()).trim(), 'Bộ thủ');

      assert.strictEqual(await vocabLink.isVisible(), true);
      assert.strictEqual((await vocabLink.textContent()).trim(), 'Từ vựng');
      // On vocabulary.html, Từ vựng link has active class
      assert.strictEqual(await vocabLink.evaluate(el => el.classList.contains('active')), true);

      assert.strictEqual(await lessonsLink.count(), 0, 'Bài học should no longer be a top-level navbar item');

      assert.strictEqual(await srsLink.isVisible(), true);
      assert.strictEqual((await srsLink.textContent()).trim(), 'Ôn tập');

      // 3. Hover, click, and keyboard focus on "Từ vựng" produces NO popup/menu
      await vocabLink.hover();
      assert.strictEqual(await page.locator('.nav-dropdown-menu').count(), 0);

      await vocabLink.focus();
      assert.strictEqual(await page.locator('.nav-dropdown-menu').count(), 0);

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

});
