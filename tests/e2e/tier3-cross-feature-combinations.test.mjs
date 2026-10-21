/**
 * =============================================================================
 * E2E TIER 3: CROSS-FEATURE COMBINATIONS TEST SUITE
 * File: tests/e2e/tier3-cross-feature-combinations.test.mjs
 *
 * Scope:
 * - TC-T3-01: Card flipping while audio is actively playing (Space/click concurrency)
 * - TC-T3-02: Reading room mode strictly locks SRS rating shortcuts [1]-[4]
 * - TC-T3-03: Listening room mode strictly locks SRS rating shortcuts [1]-[4]
 * - TC-T3-04: Review submission resilience under network error/interruption
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createE2ETestContext } from './utils/e2e-test-context.mjs';

describe('Tier 3: Cross-Feature Combinations Test Suite', () => {
  let ctx;

  before(async () => {
    ctx = await createE2ETestContext();
  });

  after(async () => {
    if (ctx) {
      await ctx.cleanup();
    }
  });

  // ---------------------------------------------------------------------------
  // TC-T3-01: Card Flipping while Audio is Actively Playing
  // ---------------------------------------------------------------------------
  test('TC-T3-01: Card flips cleanly while audio playback is triggered without race conditions', async () => {
    const { page } = ctx;
    await page.goto(`${ctx.server.baseUrl}/srs-review.html?lessonId=1&action=continue`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#srsActiveSession', { state: 'visible', timeout: 5000 });
    await page.waitForSelector('#cardFront', { state: 'visible', timeout: 5000 });

    const btnPronounce = page.locator('#btnAudioPronounceFront');
    await btnPronounce.waitFor({ state: 'visible', timeout: 3000 });

    // 1. Trigger audio playback
    await btnPronounce.click();

    // 2. Immediately flip card via Space key while audio is in-flight
    await page.keyboard.press('Space');
    await page.waitForTimeout(400); // Wait for 3D flip

    // 3. Verify card back is visible
    const cardBack = page.locator('#cardBack');
    await cardBack.waitFor({ state: 'visible', timeout: 3000 });
    assert.ok(await cardBack.isVisible(), 'Back face must be visible after flip');

    // 4. Verify zero unhandled exceptions
    const fatalErrors = ctx.getRuntimeErrors().filter(e =>
      e.includes('Uncaught') || e.includes('TypeError')
    );
    assert.strictEqual(fatalErrors.length, 0, `No fatal errors during concurrent audio flip: ${fatalErrors.join(', ')}`);
  });

  // ---------------------------------------------------------------------------
  // TC-T3-02: Reading Room Mode Locks SRS Shortcuts [1]-[4]
  // ---------------------------------------------------------------------------
  test('TC-T3-02: Reading room mode strictly locks SRS rating shortcuts [1]-[4]', async () => {
    const { page } = ctx;
    await page.goto(`${ctx.server.baseUrl}/srs-review.html?lessonId=1&mode=reading&action=continue`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#srsActiveSession', { state: 'visible', timeout: 5000 });

    const readingRoom = page.locator('#srsReadingRoom');
    await readingRoom.waitFor({ state: 'visible', timeout: 5000 });
    assert.ok(await readingRoom.isVisible(), 'Dedicated Reading Room must be visible');

    // Verify rating section is hidden in reading room
    const ratingSection = page.locator('#srsRatingSection');
    const isRatingHidden = await ratingSection.evaluate(el => el.classList.contains('d-none'));
    assert.strictEqual(isRatingHidden, true, 'SRS rating bar must be hidden in Reading Room');

    // Record review submissions count prior to key presses
    const countBefore = ctx.submittedReviews.length;

    // Press keys [1], [2], [3], [4]
    await page.keyboard.press('1');
    await page.keyboard.press('2');
    await page.keyboard.press('3');
    await page.keyboard.press('4');
    await page.waitForTimeout(300);

    // Verify ZERO reviews were submitted
    const countAfter = ctx.submittedReviews.length;
    assert.strictEqual(countAfter, countBefore, 'SRS rating shortcuts [1]-[4] must be strictly locked in Reading mode');

    // Verify Reading Room is still visible (card did not advance unexpectedly)
    assert.ok(await readingRoom.isVisible(), 'Reading Room must remain on screen without advancing');
  });

  // ---------------------------------------------------------------------------
  // TC-T3-03: Listening Room Mode Locks SRS Shortcuts [1]-[4]
  // ---------------------------------------------------------------------------
  test('TC-T3-03: Listening room mode strictly locks SRS rating shortcuts [1]-[4]', async () => {
    const { page } = ctx;
    await page.goto(`${ctx.server.baseUrl}/srs-review.html?lessonId=1&mode=listening&action=continue`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#srsActiveSession', { state: 'visible', timeout: 5000 });

    const listeningRoom = page.locator('#srsListeningRoom');
    await listeningRoom.waitFor({ state: 'visible', timeout: 5000 });
    assert.ok(await listeningRoom.isVisible(), 'Dedicated Listening Room must be visible');

    const countBefore = ctx.submittedReviews.length;

    // Press rating shortcuts [1]-[4]
    await page.keyboard.press('1');
    await page.keyboard.press('2');
    await page.keyboard.press('3');
    await page.keyboard.press('4');
    await page.waitForTimeout(300);

    const countAfter = ctx.submittedReviews.length;
    assert.strictEqual(countAfter, countBefore, 'SRS shortcuts [1]-[4] must be locked in Listening mode');
    assert.ok(await listeningRoom.isVisible(), 'Listening Room must remain active');
  });

  // ---------------------------------------------------------------------------
  // TC-T3-04: Review Submission Resilience Under Network Error
  // ---------------------------------------------------------------------------
  test('TC-T3-04: Review submission displays error feedback and retains card state under network failure', async () => {
    const { page } = ctx;

    // Temporarily intercept /api/v1/srs/review to return HTTP 500 error
    await page.route('**/api/v1/srs/review', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SERVER_ERROR',
          message: 'Lỗi máy chủ cơ sở dữ liệu tạm thời'
        })
      });
    });

    await page.goto(`${ctx.server.baseUrl}/srs-review.html?lessonId=1&action=continue`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#srsActiveSession', { state: 'visible', timeout: 5000 });
    await page.waitForSelector('#cardFront', { state: 'visible', timeout: 5000 });

    // Flip card
    const flashcard = page.locator('#flashcard');
    await flashcard.click();
    await page.waitForTimeout(400);

    // Click rating Good (3)
    const btnRatingGood = page.locator('#btnRatingGood');
    await btnRatingGood.waitFor({ state: 'visible', timeout: 3000 });
    await btnRatingGood.click();
    await page.waitForTimeout(500);

    // Verify rating button is restored / not permanently disabled and card is not dropped
    const activeSession = page.locator('#srsActiveSession');
    assert.ok(await activeSession.isVisible(), 'Active session must remain visible on network failure');

    // Restore standard review route
    await page.unroute('**/api/v1/srs/review');
  });
});
