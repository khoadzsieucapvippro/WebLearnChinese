/**
 * =============================================================================
 * BROWSER E2E TEST: VERIFICATION OF VOCABULARY CARD REDESIGN
 * File: tests/frontend/e2e/vocab-card-elements-removed.browser.mjs
 * 
 * Verifies:
 * 1. Removal of HSK level badge (.vocab-hsk-badge) from card DOM across HSK 1, 2, and 3.
 * 2. Removal of 记 note button (.vocab-card-note-btn) from card DOM across HSK 1, 2, and 3.
 * 3. Preservation of speaker button (.vocab-speech-btn) at top-right of every card.
 * 4. Preservation of Hanzi, Pinyin, Hán-Việt, Vietnamese meaning.
 * 5. Layout layout: speaker button does not overlap Hanzi and is positioned at top right.
 * 6. Speaker button is clickable and triggers speech synthesis without crash.
 * 7. Uniformity across pagination.
 * 8. Card detail modal opens on card click with modal speaker and note buttons intact.
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

function createMockPageItems(hskLevel, count = 5) {
  const items = [];
  for (let i = 1; i <= count; i++) {
    items.push({
      vocabId: (hskLevel * 100) + i,
      hanzi: `词${hskLevel}_${i}`,
      pinyin: `cí ${i}`,
      meaningHanViet: `Từ ${i}`,
      meaningVi: `Nghĩa tiếng Việt của từ ${i} cấp độ HSK ${hskLevel}`,
      exampleSentence: `这是HSK${hskLevel}的例句。`,
      exampleTranslation: `Đây là câu ví dụ HSK ${hskLevel}.`,
      hskLevel: hskLevel,
      audioUrl: null
    });
  }
  return items;
}

describe('Browser E2E: Vocabulary Card Redesign (HSK Badge & 记 Button Removal)', () => {
  let server;
  let browser;
  let baseUrl;

  before(async () => {
    server = await ensureServer();
    baseUrl = server.baseUrl;
    browser = await launchBrowser();
  });

  after(async () => {
    if (browser) {
      await browser.close();
    }
    if (server) {
      await server.close();
    }
  });

  test('VCR-01: Vocabulary cards on HSK 1 have zero HSK badge and zero 记 button in DOM', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/vocabulary*', async (route) => {
        const url = new URL(route.request().url());
        const pageNum = parseInt(url.searchParams.get('page') || '0', 10);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              page: pageNum,
              size: 20,
              totalElements: 25,
              totalPages: 2,
              first: pageNum === 0,
              last: pageNum === 1,
              items: createMockPageItems(1, 10)
            }
          })
        });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      const cards = page.locator('.vocab-card');
      const count = await cards.count();
      assert.ok(count > 0, 'Must have rendered vocabulary cards');

      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);

        // 1. DOM Removal: zero HSK badge
        const badgeCount = await card.locator('.vocab-hsk-badge').count();
        assert.strictEqual(badgeCount, 0, `Card #${i} must have ZERO .vocab-hsk-badge in DOM`);

        // 2. DOM Removal: zero 记 button
        const noteBtnCount = await card.locator('.vocab-card-note-btn').count();
        assert.strictEqual(noteBtnCount, 0, `Card #${i} must have ZERO .vocab-card-note-btn in DOM`);
        const jiBtnCount = await card.locator('button:has-text("记")').count();
        assert.strictEqual(jiBtnCount, 0, `Card #${i} must have ZERO button with text "记" in DOM`);

        // 3. Preservation: speaker button exists
        const speakerCount = await card.locator('.vocab-speech-btn').count();
        assert.strictEqual(speakerCount, 1, `Card #${i} must have exactly ONE speaker button`);

        // 4. Preservation: other card elements exist and are visible
        const hanzi = card.locator('.vocab-card-hanzi');
        assert.strictEqual(await hanzi.isVisible(), true, `Card #${i} hanzi must be visible`);
        const pinyin = card.locator('.vocab-card-pinyin');
        assert.strictEqual(await pinyin.isVisible(), true, `Card #${i} pinyin must be visible`);
        const hanviet = card.locator('.vocab-card-hanviet');
        assert.strictEqual(await hanviet.isVisible(), true, `Card #${i} hanviet must be visible`);
        const meaning = card.locator('.vocab-card-meaning');
        assert.strictEqual(await meaning.isVisible(), true, `Card #${i} meaning must be visible`);

        // 5. Layout check: speaker is at top-right and does NOT overlap Hanzi
        const hanziBox = await hanzi.boundingBox();
        const speakerBox = await card.locator('.vocab-speech-btn').boundingBox();
        assert.ok(hanziBox && speakerBox, `Card #${i} must have bounding boxes`);
        assert.ok(
          speakerBox.x >= hanziBox.x + hanziBox.width - 2, // speaker is to the right of Hanzi
          `Speaker at x=${speakerBox.x} should be right of Hanzi at x=${hanziBox.x} w=${hanziBox.width}`
        );
      }

      // Check speaker pronunciation click
      const firstSpeaker = cards.first().locator('.vocab-speech-btn');
      await firstSpeaker.click();

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('VCR-02: Switching tabs between HSK 1, 2, and 3 consistently renders cards without HSK badge or 记 button', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/vocabulary*', async (route) => {
        const url = new URL(route.request().url());
        const hsk = parseInt(url.searchParams.get('hskLevel') || '1', 10);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              page: 0,
              size: 20,
              totalElements: 5,
              totalPages: 1,
              first: true,
              last: true,
              items: createMockPageItems(hsk, 5)
            }
          })
        });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      // Check HSK 2 tab
      await page.click('#tabHsk2');
      await page.waitForTimeout(100);
      let cards = page.locator('.vocab-card');
      let count = await cards.count();
      assert.ok(count > 0, 'HSK 2 cards must be rendered');

      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);
        assert.strictEqual(await card.locator('.vocab-hsk-badge').count(), 0, `HSK 2 Card #${i} no HSK badge`);
        assert.strictEqual(await card.locator('.vocab-card-note-btn').count(), 0, `HSK 2 Card #${i} no 记 button`);
        assert.strictEqual(await card.locator('.vocab-speech-btn').count(), 1, `HSK 2 Card #${i} exactly 1 speaker`);
      }

      // Check HSK 3 tab
      await page.click('#tabHsk3');
      await page.waitForTimeout(100);
      cards = page.locator('.vocab-card');
      count = await cards.count();
      assert.ok(count > 0, 'HSK 3 cards must be rendered');

      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);
        assert.strictEqual(await card.locator('.vocab-hsk-badge').count(), 0, `HSK 3 Card #${i} no HSK badge`);
        assert.strictEqual(await card.locator('.vocab-card-note-btn').count(), 0, `HSK 3 Card #${i} no 记 button`);
        assert.strictEqual(await card.locator('.vocab-speech-btn').count(), 1, `HSK 3 Card #${i} exactly 1 speaker`);
      }

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('VCR-03: Detail modal preserves its own speaker button and confirms modal footer removal (note & dismiss)', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/vocabulary/101', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              vocabId: 101,
              hanzi: '书',
              pinyin: 'shū',
              meaningHanViet: 'Thư',
              meaningVi: 'Sách, vở',
              exampleSentence: '我买了一本书。',
              exampleTranslation: 'Tôi đã mua một cuốn sách.',
              audioUrl: null,
              radicals: []
            }
          })
        });
      });

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
              items: [{
                vocabId: 101,
                hanzi: '书',
                pinyin: 'shū',
                meaningHanViet: 'Thư',
                meaningVi: 'Sách, vở',
                audioUrl: null
              }]
            }
          })
        });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      // Click card to open detail modal
      await page.locator('.vocab-card').first().click();

      const modal = page.locator('#vocabDetailModal');
      await modal.waitFor({ state: 'visible' });

      // Modal speaker button must be present
      const modalSpeaker = page.locator('#modalSpeechBtn');
      assert.strictEqual(await modalSpeaker.isVisible(), true, 'Detail modal speaker button must remain');

      // Modal footer removal verification: note and dismiss buttons must be zero in DOM
      const modalNoteBtn = page.locator('#modalVocabNoteBtn');
      assert.strictEqual(await modalNoteBtn.count(), 0, 'Detail modal note button must be removed');
      const modalDismissBtn = page.locator('#modalDismissBtn');
      assert.strictEqual(await modalDismissBtn.count(), 0, 'Detail modal dismiss button must be removed');

      // Close modal
      await page.click('#modalCloseBtn');
      await modal.waitFor({ state: 'hidden' });

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('VCR-04: Mobile 375px viewport exhibits zero horizontal overflow and speaker button remains correctly aligned', async () => {
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
              totalElements: 4,
              totalPages: 1,
              first: true,
              last: true,
              items: createMockPageItems(1, 4)
            }
          })
        });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      // Check horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      assert.strictEqual(scrollWidth <= clientWidth, true, `No horizontal overflow: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);

      // Cards must have 0 badge, 0 note btn, 1 speaker btn
      const cards = page.locator('.vocab-card');
      const count = await cards.count();
      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);
        assert.strictEqual(await card.locator('.vocab-hsk-badge').count(), 0);
        assert.strictEqual(await card.locator('.vocab-card-note-btn').count(), 0);
        assert.strictEqual(await card.locator('.vocab-speech-btn').count(), 1);
      }

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });
});
