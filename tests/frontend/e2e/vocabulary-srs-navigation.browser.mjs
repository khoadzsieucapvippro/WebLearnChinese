/**
 * =============================================================================
 * BROWSER E2E TEST: VOCABULARY & SRS NAVIGATION CONSISTENCY VERIFICATION
 * File: tests/frontend/e2e/vocabulary-srs-navigation.browser.mjs
 * 
 * Verifies Bugfix: "VOCABULARY UI REVERTS TO OLD VERSION AFTER SRS NAVIGATION"
 * 
 * Test Scenarios:
 * 1. Target real running origin (http://localhost:3000 via ensureServer).
 * 2. Scenario 1: Replicate Navigation Loop (5 consecutive cycles back-and-forth).
 *    - /vocabulary.html -> #vocabGroupBanner visible, #vocabGroupTotalCount exists, #tabHsk1 exists.
 *    - Click "Ôn tập SRS" -> wait for /srs-review.html, assert .srs-skill-tab-toolbar / #srsSkillTabReading.
 *    - Click "Từ vựng" -> wait for /vocabulary.html, assert STILL new version.
 *    - Repeat 5 times in the same session with normal browser cache.
 * 3. Scenario 2: Browser Restart Persistence.
 *    - Close browser context / instance, launch fresh browser instance.
 *    - Navigate directly to /vocabulary.html.
 *    - Assert new UI (#vocabGroupBanner) appears immediately.
 * 4. Scenario 3: Direct URL Access.
 *    - Direct goto /vocabulary.html -> /srs-review.html -> /vocabulary.html.
 *    - Verify HTML hash and #vocabGroupBanner marker consistency.
 * 5. Scenario 4: HTTP Response Headers & 304 Revalidation.
 *    - Inspect /vocabulary.html network headers.
 *    - Verify Cache-Control is 'no-cache, must-revalidate'.
 *    - Verify ETag and Last-Modified are present.
 *    - Send conditional request with If-None-Match: <etag> -> 304 Not Modified.
 *    - Verify no obsolete UI string or old markup is served.
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

describe('Browser E2E: Vocabulary UI Reversion Fix after SRS Navigation', () => {
  let serverHandle;
  let browser;
  let baseUrl;

  before(async () => {
    serverHandle = await ensureServer({ port: 3000 });
    baseUrl = serverHandle.baseUrl;
    browser = await launchBrowser({ headless: true });
  });

  after(async () => {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (serverHandle) {
      await serverHandle.close().catch(() => {});
    }
  });

  // Scenario 1: Replicate Navigation Loop (at least 5 cycles)
  test('Scenario 1: Replicate Navigation Loop (5 cycles back-and-forth in same session with browser cache)', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      const TOTAL_CYCLES = 5;
      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });

      for (let cycle = 1; cycle <= TOTAL_CYCLES; cycle++) {
        // Step 1: Assert new UI markers on /vocabulary.html
        const banner = page.locator('#vocabGroupBanner');
        await banner.waitFor({ state: 'visible', timeout: 5000 });
        assert.ok(await banner.isVisible(), `[Cycle ${cycle}] #vocabGroupBanner must be visible on /vocabulary.html`);

        const totalCountEl = page.locator('#vocabGroupTotalCount');
        assert.ok((await totalCountEl.count()) > 0, `[Cycle ${cycle}] #vocabGroupTotalCount must exist in DOM`);

        const tabHsk1 = page.locator('#tabHsk1');
        assert.ok((await tabHsk1.count()) > 0, `[Cycle ${cycle}] #tabHsk1 must exist in DOM`);

        const vocabHtml = await page.content();
        assert.ok(vocabHtml.includes('vocabGroupBanner'), `[Cycle ${cycle}] Content must contain 'vocabGroupBanner'`);
        assert.ok(!vocabHtml.includes('(Phím 1)'), `[Cycle ${cycle}] Must not contain obsolete markers`);

        // Step 2: Click "Ôn tập SRS"
        // Alternate between #vocabBtnSrsReview (banner action) and #primaryNavMenu a[href="srs-review.html"] (navbar)
        const srsBtn = page.locator('#vocabBtnSrsReview');
        const navSrsLink = page.locator('#primaryNavMenu a[href="srs-review.html"]');

        const useBannerBtn = (cycle % 2 === 1) && (await srsBtn.isVisible().catch(() => false));
        const clickTarget = useBannerBtn ? srsBtn : navSrsLink;

        await Promise.all([
          page.waitForURL((url) => url.pathname.includes('srs-review.html'), { timeout: 10000 }),
          clickTarget.click()
        ]);
        await page.waitForLoadState('domcontentloaded');

        // Step 3: Assert SRS review page new markers
        const srsToolbar = page.locator('.srs-skill-tab-toolbar');
        const srsReadingTab = page.locator('#srsSkillTabReading');
        await srsToolbar.waitFor({ state: 'visible', timeout: 5000 });
        assert.ok(await srsToolbar.isVisible(), `[Cycle ${cycle}] .srs-skill-tab-toolbar must be visible on /srs-review.html`);
        assert.ok(await srsReadingTab.isVisible(), `[Cycle ${cycle}] #srsSkillTabReading must be visible on /srs-review.html`);

        // Step 4: Click "Từ vựng" to return to /vocabulary.html
        const navVocabLink = page.locator('#primaryNavMenu a[href="vocabulary.html"]');
        await navVocabLink.waitFor({ state: 'visible', timeout: 5000 });

        await Promise.all([
          page.waitForURL((url) => url.pathname.includes('vocabulary.html'), { timeout: 10000 }),
          navVocabLink.click()
        ]);
        await page.waitForLoadState('domcontentloaded');

        // Step 5: Assert /vocabulary.html is STILL the new version
        await banner.waitFor({ state: 'visible', timeout: 5000 });
        assert.ok(await banner.isVisible(), `[Cycle ${cycle}] #vocabGroupBanner must remain visible after returning from SRS`);
        assert.ok((await totalCountEl.count()) > 0, `[Cycle ${cycle}] #vocabGroupTotalCount must remain in DOM`);
        assert.ok((await tabHsk1.count()) > 0, `[Cycle ${cycle}] #tabHsk1 must remain in DOM`);

        const postReturnHtml = await page.content();
        assert.ok(postReturnHtml.includes('vocabGroupBanner'), `[Cycle ${cycle}] HTML must retain 'vocabGroupBanner'`);
        assert.ok(!postReturnHtml.includes('(Phím 1)'), `[Cycle ${cycle}] Must not revert to old UI markers`);
      }

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero runtime errors across all 5 navigation cycles');
    } finally {
      await context.close().catch(() => {});
    }
  });

  // Scenario 2: Browser Restart Persistence
  test('Scenario 2: Browser Restart Persistence (fresh instance immediately renders new UI)', async () => {
    // Launch a completely new, isolated browser instance
    const freshBrowser = await launchBrowser({ headless: true });
    try {
      const { page: freshPage, context: freshContext, getRuntimeErrors: freshErrors } = await createMonitoredPage(freshBrowser, {
        viewportWidth: 1280,
        viewportHeight: 720
      });

      try {
        await freshPage.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });

        const banner = freshPage.locator('#vocabGroupBanner');
        await banner.waitFor({ state: 'visible', timeout: 5000 });
        assert.ok(await banner.isVisible(), '#vocabGroupBanner appears immediately on fresh browser instance');

        const totalCount = freshPage.locator('#vocabGroupTotalCount');
        assert.ok((await totalCount.count()) > 0, '#vocabGroupTotalCount exists on fresh browser instance');

        const tabHsk1 = freshPage.locator('#tabHsk1');
        assert.ok((await tabHsk1.count()) > 0, '#tabHsk1 exists on fresh browser instance');

        const content = await freshPage.content();
        assert.ok(content.includes('vocabGroupBanner'), 'Fresh browser instance serves new UI markup');
        assert.ok(!content.includes('(Phím 1)'), 'No obsolete markup present on fresh launch');

        assert.strictEqual(freshErrors().length, 0, 'Zero runtime errors on fresh browser launch');
      } finally {
        await freshContext.close().catch(() => {});
      }
    } finally {
      await freshBrowser.close().catch(() => {});
    }
  });

  // Scenario 3: Direct URL Access
  test('Scenario 3: Direct URL Access (vocabulary.html -> srs-review.html -> vocabulary.html hash consistency)', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      // Direct access 1: /vocabulary.html
      const response1 = await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      const banner1 = page.locator('#vocabGroupBanner');
      await banner1.waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await banner1.isVisible(), '#vocabGroupBanner visible on initial direct access');

      const rawHtml1 = await response1.text();
      const hash1 = crypto.createHash('sha256').update(rawHtml1).digest('hex');
      assert.ok(rawHtml1.includes('vocabGroupBanner'), 'Direct load 1 response contains vocabGroupBanner marker');

      // Direct access 2: /srs-review.html
      await page.goto(`${baseUrl}/srs-review.html`, { waitUntil: 'domcontentloaded' });
      const srsMarker = page.locator('.srs-skill-tab-toolbar');
      await srsMarker.waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await srsMarker.isVisible(), 'srs-review.html toolbar visible on direct access');

      // Direct access 3: /vocabulary.html again
      const response2 = await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      const banner2 = page.locator('#vocabGroupBanner');
      await banner2.waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await banner2.isVisible(), '#vocabGroupBanner visible on direct return access');

      const rawHtml2 = await response2.text();
      const hash2 = crypto.createHash('sha256').update(rawHtml2).digest('hex');
      assert.ok(rawHtml2.includes('vocabGroupBanner'), 'Direct load 2 response contains vocabGroupBanner marker');

      // Hash and marker consistency assertion
      assert.strictEqual(hash1, hash2, 'Direct URL access yields consistent HTML content and SHA256 hash');
      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero runtime errors during direct URL navigation');
    } finally {
      await context.close().catch(() => {});
    }
  });

  // Scenario 4: HTTP Response Headers & 304 Revalidation
  test('Scenario 4: HTTP Response Headers & 304 Revalidation for /vocabulary.html', async () => {
    // 1. Initial unconditional GET
    const response = await fetch(`${baseUrl}/vocabulary.html`);
    assert.strictEqual(response.status, 200, 'Unconditional request returns HTTP 200 OK');

    // 2. Cache-Control validation
    const cacheControl = response.headers.get('cache-control');
    assert.ok(cacheControl, 'Cache-Control header must be present');
    assert.strictEqual(cacheControl, 'no-cache, must-revalidate', 'Cache-Control must be exactly "no-cache, must-revalidate"');

    // 3. ETag and Last-Modified presence
    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');
    assert.ok(etag && etag.length > 0, `ETag header must be present: received "${etag}"`);
    assert.ok(lastModified && lastModified.length > 0, `Last-Modified header must be present: received "${lastModified}"`);

    // 4. Conditional GET with If-None-Match (ETag) -> 304 Not Modified
    const conditionalEtagRes = await fetch(`${baseUrl}/vocabulary.html`, {
      headers: {
        'if-none-match': etag
      }
    });
    assert.strictEqual(conditionalEtagRes.status, 304, 'Conditional request with matching ETag must yield HTTP 304 Not Modified');

    // 5. Conditional GET with If-Modified-Since -> 304 Not Modified
    const conditionalImsRes = await fetch(`${baseUrl}/vocabulary.html`, {
      headers: {
        'if-modified-since': lastModified
      }
    });
    assert.strictEqual(conditionalImsRes.status, 304, 'Conditional request with Last-Modified must yield HTTP 304 Not Modified');

    // 6. Verify served content has new markers and zero obsolete UI markup
    const responseBody = await response.text();
    assert.ok(responseBody.includes('vocabGroupBanner'), 'Served HTML contains #vocabGroupBanner');
    assert.ok(responseBody.includes('vocabGroupTotalCount'), 'Served HTML contains #vocabGroupTotalCount');
    assert.ok(responseBody.includes('tabHsk1'), 'Served HTML contains #tabHsk1');
    assert.ok(!responseBody.includes('(Phím 1)'), 'Served HTML must not contain obsolete SRS markup');
  });
});
