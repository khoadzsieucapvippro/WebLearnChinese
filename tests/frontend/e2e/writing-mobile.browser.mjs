/**
 * =============================================================================
 * BROWSER E2E TEST: WRITING ROOM MOBILE VIEWPORT & STROKE INTEGRITY
 * File: tests/frontend/e2e/writing-mobile.browser.mjs
 *
 * Verifies (Method 1 Acceptance Criteria):
 * - WM-01: Compact Mobile (360px): Zero horizontal overflow with compound 2-character word (爱好).
 * - WM-02: iPhone SE (375px), iPhone 14 (390px), Pixel 7 (412px): Clean responsive reflow with zero overflow.
 * - WM-03: Responsive dual-box layout adapts between stacked (mobile) and side-by-side (desktop).
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser } from '../utils/browser-runner.mjs';

async function setupLearnerAuth(page) {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('access_token', 'test_writing_mobile_jwt');
    localStorage.setItem('user_info', JSON.stringify({
      accountId: 4001,
      emailOrPhone: 'writing_learner@example.com',
      fullName: 'Học Viên Luyện Viết Di Động',
      roles: ['Learner']
    }));
  });
}

async function waitForBothBoxes(page, timeout = 10000) {
  await page.waitForFunction(() => {
    return document.querySelectorAll('.writing-rice-grid-box').length >= 2;
  }, null, { timeout });
}

describe('Browser E2E: Writing Room Mobile Viewport & Stroke Integrity (Method 1)', () => {
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
      if (serverHandle && serverHandle.close) {
        await serverHandle.close();
      }
    }
  });

  test('WM-01: Compact Mobile Viewport (360px) has ZERO horizontal overflow for 2-character word', async () => {
    const context = await browser.newContext({
      viewport: { width: 360, height: 640 },
      hasTouch: true
    });
    const page = await context.newPage();
    await setupLearnerAuth(page);

    await page.goto(`${baseUrl}/srs-review.html?mode=writing&vocabId=2`, { waitUntil: 'domcontentloaded' });
    await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });
    await page.locator('#srsWritingRoom').waitFor({ state: 'visible', timeout: 8000 });
    await waitForBothBoxes(page);

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        clientWidth: doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        boxCount: document.querySelectorAll('.writing-rice-grid-box').length
      };
    });

    assert.strictEqual(metrics.boxCount, 2, '2-character word 爱好 must render 2 canvas boxes');
    assert.ok(
      metrics.scrollWidth <= metrics.clientWidth,
      `Document scrollWidth (${metrics.scrollWidth}px) must be <= clientWidth (${metrics.clientWidth}px)`
    );
    assert.ok(
      metrics.bodyScrollWidth <= metrics.bodyClientWidth,
      `Body scrollWidth (${metrics.bodyScrollWidth}px) must be <= clientWidth (${metrics.bodyClientWidth}px)`
    );

    await context.close();
  });

  test('WM-02: iPhone SE (375px), iPhone 14 (390px), Pixel 7 (412px) render cleanly without overflow', async () => {
    const mobileViewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 14', width: 390, height: 844 },
      { name: 'Pixel 7', width: 412, height: 915 }
    ];

    for (const vp of mobileViewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        hasTouch: true
      });
      const page = await context.newPage();
      await setupLearnerAuth(page);

      await page.goto(`${baseUrl}/srs-review.html?mode=writing&vocabId=2`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });
      await page.locator('#srsWritingRoom').waitFor({ state: 'visible', timeout: 8000 });
      await waitForBothBoxes(page);

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
      });

      assert.strictEqual(overflow, true, `Viewport ${vp.name} (${vp.width}px) must exhibit zero horizontal overflow`);
      await context.close();
    }
  });

  test('WM-03: Responsive dual-box layout adapts between stacked (mobile) and side-by-side (desktop)', async () => {
    // 1. Mobile: Stacked layout
    const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const mobilePage = await mobileCtx.newPage();
    await setupLearnerAuth(mobilePage);
    await mobilePage.goto(`${baseUrl}/srs-review.html?mode=writing&vocabId=2`, { waitUntil: 'domcontentloaded' });
    await waitForBothBoxes(mobilePage);

    const mobileArrangement = await mobilePage.evaluate(() => {
      const boxes = Array.from(document.querySelectorAll('.writing-rice-grid-box')).map(b => b.getBoundingClientRect());
      return Math.abs(boxes[0].top - boxes[1].top) > 50; // true if stacked vertically
    });
    assert.strictEqual(mobileArrangement, true, 'Dual canvas boxes must stack vertically on narrow mobile');
    await mobileCtx.close();

    // 2. Desktop: Side-by-side layout
    const desktopCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const desktopPage = await desktopCtx.newPage();
    await setupLearnerAuth(desktopPage);
    await desktopPage.goto(`${baseUrl}/srs-review.html?mode=writing&vocabId=2`, { waitUntil: 'domcontentloaded' });
    await waitForBothBoxes(desktopPage);

    const desktopArrangement = await desktopPage.evaluate(() => {
      const boxes = Array.from(document.querySelectorAll('.writing-rice-grid-box')).map(b => b.getBoundingClientRect());
      return Math.abs(boxes[0].top - boxes[1].top) < 10; // true if side-by-side horizontally
    });
    assert.strictEqual(desktopArrangement, true, 'Dual canvas boxes must align side-by-side on wide desktop');
    await desktopCtx.close();
  });
});
