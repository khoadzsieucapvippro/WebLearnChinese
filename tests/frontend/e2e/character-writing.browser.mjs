/**
 * =============================================================================
 * BROWSER E2E TEST: CHARACTER WRITING (STROKE ORDER DEMONSTRATION)
 * File: tests/frontend/e2e/character-writing.browser.mjs
 *
 * Verifies:
 * - CW-01: Detail modal displays simplified Stroke Order card (no practice tabs, no practice link).
 * - CW-02: Stroke order simulation renders SVG outlines and rice grid guidelines.
 * - CW-03: No practice modes or tab switching buttons exist in radical detail modal.
 * - CW-04: Replay button restarts stroke demonstration cleanly.
 * - CW-05: Modal footer & modalDismissBtn removed; modalCloseBtn cleanly closes modal.
 * - CW-06: Modal closing cleanly tears down HanziWriter and DOM without console errors.
 * - CW-07: Responsive layout on mobile (375px) has zero horizontal overflow.
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

function createMockRadicals() {
  const radicals = [
    {
      radicalId: 1,
      character: '一',
      pinyin: 'yī',
      meaningHanViet: 'Nhất',
      meaningVi: 'Số một',
      commonRank: 1,
      explanationVi: 'Nét ngang cơ bản.',
      videoLessonUrl: null,
      audioUrl: null,
      videoWritingUrl: null
    },
    {
      radicalId: 85,
      character: '水',
      pinyin: 'shuǐ',
      meaningHanViet: 'Thủy',
      meaningVi: 'Dòng nước',
      commonRank: 2,
      explanationVi: 'Dòng nước uốn lượn.',
      videoLessonUrl: null,
      audioUrl: null,
      videoWritingUrl: null
    }
  ];

  // Fill up to 214 so catalog invariants pass
  for (let id = 2; id <= 214; id++) {
    if (id !== 85) {
      radicals.push({
        radicalId: id,
        character: String.fromCodePoint(0x4E00 + id),
        pinyin: `py_${id}`,
        meaningHanViet: `HV_${id}`,
        meaningVi: `Nghĩa ${id}`,
        commonRank: id <= 50 ? id : null,
        explanationVi: null,
        videoLessonUrl: null,
        audioUrl: null,
        videoWritingUrl: null
      });
    }
  }

  radicals.sort((a, b) => a.radicalId - b.radicalId);
  return radicals;
}

function mockApiResponse() {
  return JSON.stringify({
    code: 'SUCCESS',
    message: 'OK',
    data: {
      page: 0,
      size: 214,
      totalElements: 214,
      totalPages: 1,
      items: createMockRadicals()
    }
  });
}

describe('Browser E2E: Character Writing Subsystem (OnJLPT Parity)', () => {
  let serverHandle;
  let browser;
  let baseUrl;

  before(async () => {
    serverHandle = await ensureServer({ port: 3000 });
    baseUrl = serverHandle.baseUrl;
    browser = await launchBrowser({ headless: true });
  });

  after(async () => {
    try {
      if (browser) await browser.close();
    } finally {
      if (serverHandle) await serverHandle.close();
    }
  });

  test('CW-01: Detail modal opens with simplified Stroke Order interface (no practice tabs, no practice link)', { timeout: 15000 }, async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/radicals*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: mockApiResponse()
        });
      });

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      // Click on the first radical card (radical 一)
      const card = page.locator('.radical-card').first();
      await card.click();

      // Verify dialog opens
      const modal = page.locator('#radicalDetailModal');
      await modal.waitFor({ state: 'visible', timeout: 3000 });

      // Verify Character Writing section exists inside modal
      const writingSection = page.locator('#modalWritingSection');
      await writingSection.waitFor({ state: 'visible', timeout: 3000 });

      // Verify static label "Thứ tự nét" is present
      const label = writingSection.locator('.writing-engine-card .fw-bold').first();
      assert.strictEqual(await label.textContent(), 'Thứ tự nét');

      // Verify old title is absent
      const cardText = await writingSection.locator('.writing-engine-card').textContent();
      assert.ok(!cardText.includes('Luyện viết chữ & Thứ tự nét'), 'Old title must not be present');

      // Verify 3 tabs are completely absent from DOM
      const tabDemo = page.locator('#tabWritingDemo');
      const tabPractice = page.locator('#tabWritingPractice');
      const tabQuiz = page.locator('#tabWritingQuiz');
      assert.strictEqual(await tabDemo.count(), 0, 'tabWritingDemo must be removed');
      assert.strictEqual(await tabPractice.count(), 0, 'tabWritingPractice must be removed');
      assert.strictEqual(await tabQuiz.count(), 0, 'tabWritingQuiz must be removed');

      // Verify practice link shortcut is completely absent from DOM
      assert.ok(!cardText.includes('Luyện viết bộ thủ này'), 'Practice shortcut button must be removed');

      // Verify visible status feedback line does not occupy layout space
      const visibleStatus = writingSection.locator('.writing-status-feedback');
      assert.strictEqual(await visibleStatus.count(), 0, 'Visible status line must be removed');

      // Verify Rice Grid guidelines SVG exists
      const gridSvg = writingSection.locator('.writing-rice-grid-box svg').first();
      assert.ok(await gridSvg.isVisible(), 'Rice Grid SVG guidelines should be rendered');

      // Verify HanziWriter canvas SVG exists inside target area
      await page.waitForTimeout(600);
      const canvasSvgs = await writingSection.locator('.writing-rice-grid-box svg').count();
      assert.ok(canvasSvgs >= 2, 'HanziWriter character SVG should be rendered alongside grid');

      // Verify footer dismiss button does NOT exist in DOM
      const dismissBtn = page.locator('#modalDismissBtn');
      assert.strictEqual(await dismissBtn.count(), 0, 'modalDismissBtn must be removed');

      // Verify zero console or page errors
      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Unexpected errors during mount: ${errors.join('; ')}`);
    } finally {
      await context.close();
    }
  });

  test('CW-02 to CW-05: Stroke order simulation replay and modal close lifecycle', { timeout: 15000 }, async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/radicals*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: mockApiResponse()
        });
      });

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      // Open detail for radical 水 (4 strokes)
      const shuiCard = page.locator('.radical-card', { hasText: '水' });
      await shuiCard.waitFor({ state: 'visible', timeout: 5000 });
      await shuiCard.click();

      const writingSection = page.locator('#modalWritingSection');
      await writingSection.waitFor({ state: 'visible', timeout: 3000 });

      // Click Replay button
      const replayBtn = writingSection.locator('button[title*="Phát lại"]');
      await replayBtn.waitFor({ state: 'visible', timeout: 3000 });
      await replayBtn.click();
      await page.waitForTimeout(300);

      // Verify modal close button in top right (#modalCloseBtn) is present and functional
      const closeBtn = page.locator('#modalCloseBtn');
      assert.ok(await closeBtn.isVisible(), 'Top-right close button (modalCloseBtn) must remain visible and functional');
      await closeBtn.click();

      // Verify modal closes
      const modal = page.locator('#radicalDetailModal');
      await page.waitForFunction(() => !document.getElementById('radicalDetailModal').hasAttribute('open'), { timeout: 5000 });
      const isOpen = await modal.evaluate(el => el.hasAttribute('open'));
      assert.strictEqual(isOpen, false, 'Modal should be closed');

      // Verify focus is restored to the triggering radical card
      const focusedText = await page.evaluate(() => document.activeElement?.textContent || '');
      assert.ok(focusedText.includes('水'), 'Focus must be restored to triggering card');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Unexpected errors during replay and close: ${errors.join('; ')}`);
    } finally {
      await context.close();
    }
  });

  test('CW-07: Responsive 375px mobile viewport exhibits zero horizontal overflow', { timeout: 15000 }, async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, { viewportWidth: 375, viewportHeight: 667 });

    try {
      await page.route('**/api/v1/radicals*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: mockApiResponse()
        });
      });

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      const card = page.locator('.radical-card').first();
      await card.click();

      const writingSection = page.locator('#modalWritingSection');
      await writingSection.waitFor({ state: 'visible', timeout: 3000 });

      // Check modal horizontal overflow
      const overflowDetected = await page.evaluate(() => {
        const modal = document.getElementById('radicalDetailModal');
        const box = document.querySelector('.writing-rice-grid-box');
        return {
          bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          modalOverflow: modal ? modal.scrollWidth > modal.clientWidth : false,
          boxWidth: box ? box.offsetWidth : 0
        };
      });

      assert.strictEqual(overflowDetected.bodyOverflow, false, 'Document should not horizontally overflow');
      assert.strictEqual(overflowDetected.boxWidth, 170, 'Calligraphy grid should remain exactly 170px');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Errors during mobile test: ${errors.join('; ')}`);
    } finally {
      await context.close();
    }
  });

  test('CW-08: Missing stroke data fallback cleanly renders centered notice and hides replay button', { timeout: 15000 }, async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      const mockRadicals = createMockRadicals();
      // Replace character of radical 2 with a character with no local stroke data
      mockRadicals[1].character = '龘';

      await page.route('**/api/v1/radicals*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              page: 0,
              size: 214,
              totalElements: 214,
              totalPages: 1,
              items: mockRadicals
            }
          })
        });
      });

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      // Click the card with no stroke data (龘)
      const dCard = page.locator('.radical-card', { hasText: '龘' });
      await dCard.waitFor({ state: 'visible', timeout: 5000 });
      await dCard.click();

      const writingSection = page.locator('#modalWritingSection');
      await writingSection.waitFor({ state: 'visible', timeout: 3000 });

      // Fallback message rendered
      await page.waitForFunction(() => {
        const text = document.getElementById('modalWritingSection')?.textContent || '';
        return text.includes('hiện chưa có dữ liệu nét chi tiết');
      }, { timeout: 5000 });

      const sectionText = await writingSection.textContent();
      assert.ok(sectionText.includes('龘'), 'Fallback text must contain character glyph');
      assert.ok(sectionText.includes('chưa có dữ liệu nét chi tiết'), 'Fallback notice text must be present');

      // Replay button must be hidden when fallback is rendered
      const replayBtn = writingSection.locator('button[title*="Phát lại"]');
      const isReplayHidden = await replayBtn.evaluate(el => el.classList.contains('d-none') || el.style.display === 'none');
      assert.strictEqual(isReplayHidden, true, 'Replay button must be hidden when stroke data is missing');

      // Close modal
      const closeBtn = page.locator('#modalCloseBtn');
      await closeBtn.click();
      await page.waitForFunction(() => !document.getElementById('radicalDetailModal').hasAttribute('open'), { timeout: 5000 });

      // Filter out expected 404 for the deliberately missing stroke data asset
      const errors = getRuntimeErrors().filter(e => !e.includes('404'));
      assert.strictEqual(errors.length, 0, `Unexpected errors during fallback test: ${errors.join('; ')}`);
    } finally {
      await context.close();
    }
  });

  test('CW-09: Modal dismisses via backdrop click and Escape key with focus restoration', { timeout: 15000 }, async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/radicals*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: mockApiResponse()
        });
      });

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      const card = page.locator('.radical-card').first();
      await card.click();

      const modal = page.locator('#radicalDetailModal');
      await modal.waitFor({ state: 'visible', timeout: 3000 });

      // 1. Dismiss via backdrop click (click top-left corner of viewport outside dialog)
      await page.mouse.click(10, 10);
      await page.waitForFunction(() => !document.getElementById('radicalDetailModal').hasAttribute('open'), { timeout: 5000 });
      assert.strictEqual(await modal.evaluate(el => el.hasAttribute('open')), false, 'Modal should close on backdrop click');

      // 2. Open again and dismiss via Escape key
      await card.click();
      await modal.waitFor({ state: 'visible', timeout: 3000 });

      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.getElementById('radicalDetailModal').hasAttribute('open'), { timeout: 5000 });
      assert.strictEqual(await modal.evaluate(el => el.hasAttribute('open')), false, 'Modal should close on Escape key');

      // 3. Verify focus restored
      const activeText = await page.evaluate(() => document.activeElement?.textContent || '');
      assert.ok(activeText.includes('一'), 'Focus must be restored to triggering card');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Errors during backdrop/escape test: ${errors.join('; ')}`);
    } finally {
      await context.close();
    }
  });
});
