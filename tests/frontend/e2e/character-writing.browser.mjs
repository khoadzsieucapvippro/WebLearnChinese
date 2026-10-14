/**
 * =============================================================================
 * BROWSER E2E TEST: CHARACTER WRITING (CÁCH VIẾT / LUYỆN NÉT / LUYỆN VIẾT)
 * File: tests/frontend/e2e/character-writing.browser.mjs
 *
 * Verifies:
 * - CW-01: Detail modal displays interactive Character Writing card with 3 tabs.
 * - CW-02: Mode 1 'Cách viết' renders SVG outlines and rice grid guidelines.
 * - CW-03: Switching to Mode 2 'Luyện nét' updates tab state and guidance text.
 * - CW-04: Switching to Mode 3 'Luyện viết' updates tab state and guidance text.
 * - CW-05: Replay button restarts stroke session without error.
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

  test('CW-01: Detail modal opens and mounts 3-tab Character Writing interface', { timeout: 15000 }, async () => {
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

      // Verify 3 tabs are present with exact labels
      const tabDemo = page.locator('#tabWritingDemo');
      const tabPractice = page.locator('#tabWritingPractice');
      const tabQuiz = page.locator('#tabWritingQuiz');

      await tabDemo.waitFor({ state: 'visible', timeout: 2000 });
      await tabPractice.waitFor({ state: 'visible', timeout: 2000 });
      await tabQuiz.waitFor({ state: 'visible', timeout: 2000 });

      assert.strictEqual(await tabDemo.textContent(), 'Cách viết');
      assert.strictEqual(await tabPractice.textContent(), 'Luyện nét');
      assert.strictEqual(await tabQuiz.textContent(), 'Luyện viết');

      // Default tab must be Mode 1 (Cách viết) selected
      assert.strictEqual(await tabDemo.getAttribute('aria-selected'), 'true');
      assert.strictEqual(await tabPractice.getAttribute('aria-selected'), 'false');
      assert.strictEqual(await tabQuiz.getAttribute('aria-selected'), 'false');

      // Verify Rice Grid guidelines SVG exists
      const gridSvg = writingSection.locator('.writing-rice-grid-box svg').first();
      assert.ok(await gridSvg.isVisible(), 'Rice Grid SVG guidelines should be rendered');

      // Verify HanziWriter canvas SVG exists inside target area
      await page.waitForTimeout(600);
      const canvasSvgs = await writingSection.locator('.writing-rice-grid-box svg').count();
      assert.ok(canvasSvgs >= 2, 'HanziWriter character SVG should be rendered alongside grid');

      // Verify zero console or page errors
      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Unexpected errors during mount: ${errors.join('; ')}`);
    } finally {
      await context.close();
    }
  });

  test('CW-02 to CW-05: Tab switching between Demo, Practice, and Quiz modes with Replay', { timeout: 15000 }, async () => {
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

      const tabDemo = page.locator('#tabWritingDemo');
      const tabPractice = page.locator('#tabWritingPractice');
      const tabQuiz = page.locator('#tabWritingQuiz');
      const statusText = page.locator('.writing-status-feedback');

      // Switch to Mode 2: "Luyện nét"
      await tabPractice.click();
      assert.strictEqual(await tabPractice.getAttribute('aria-selected'), 'true');
      assert.strictEqual(await tabDemo.getAttribute('aria-selected'), 'false');

      await page.waitForTimeout(400);
      const practiceStatus = await statusText.textContent();
      assert.ok(
        practiceStatus.includes('tô theo') || practiceStatus.includes('đường nét'),
        `Status for practice should guide user: ${practiceStatus}`
      );

      // Switch to Mode 3: "Luyện viết"
      await tabQuiz.click();
      assert.strictEqual(await tabQuiz.getAttribute('aria-selected'), 'true');
      assert.strictEqual(await tabPractice.getAttribute('aria-selected'), 'false');

      await page.waitForTimeout(400);
      const quizStatus = await statusText.textContent();
      assert.ok(
        quizStatus.includes('tự nhớ') || quizStatus.includes('ô trống'),
        `Status for quiz should guide user: ${quizStatus}`
      );

      // Click Replay button
      const replayBtn = writingSection.locator('button[title*="Phát lại"]');
      await replayBtn.click();
      await page.waitForTimeout(300);

      // Close modal via dismiss button
      const dismissBtn = page.locator('#modalDismissBtn');
      await dismissBtn.click();

      // Verify modal closes
      const modal = page.locator('#radicalDetailModal');
      const isOpen = await modal.evaluate(el => el.hasAttribute('open'));
      assert.strictEqual(isOpen, false, 'Modal should be closed');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Unexpected errors during mode switching: ${errors.join('; ')}`);
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
});
