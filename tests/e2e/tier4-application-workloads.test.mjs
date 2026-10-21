/**
 * =============================================================================
 * E2E TIER 4: REAL-WORLD APPLICATION WORKLOADS TEST SUITE
 * File: tests/e2e/tier4-application-workloads.test.mjs
 *
 * Scope:
 * - TC-T4-01: Complete SRS Multi-Card Learning & Review Session (Full lifecycle & stats)
 * - TC-T4-02: Real-World Listening Session Workflow (Prompt, retry, correct, advance)
 * - TC-T4-03: Real-World Reading Evaluation Workflow (Prompt, score breakdown, next)
 * - TC-T4-04: Seamless Multi-Skill Quick Switching Workflow
 * =============================================================================
 */

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createE2ETestContext } from './utils/e2e-test-context.mjs';

describe('Tier 4: Real-World Application Workloads Test Suite', () => {
  let ctx;

  before(async () => {
    ctx = await createE2ETestContext();
  });

  after(async () => {
    if (ctx) {
      await ctx.cleanup();
    }
  });

  beforeEach(() => {
    // Reset review submissions between tests
    if (ctx && ctx.submittedReviews) {
      ctx.submittedReviews.length = 0;
    }
  });

  // ---------------------------------------------------------------------------
  // TC-T4-01: Complete SRS Multi-Card Learning & Review Session
  // ---------------------------------------------------------------------------
  test('TC-T4-01: Complete multi-card SRS session progresses through queue and displays truthful stats', async () => {
    const { page } = ctx;
    await page.goto(`${ctx.server.baseUrl}/srs-review.html?lessonId=1&action=continue`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#srsActiveSession', { state: 'visible', timeout: 5000 });

    const flashcard = page.locator('#flashcard');
    const btnAgain = page.locator('#btnRatingAgain');
    const btnGood = page.locator('#btnRatingGood');
    const btnEasy = page.locator('#btnRatingEasy');

    // Card 1: Rate "Again" (1) -> Requeued to the end
    await flashcard.click();
    await page.waitForTimeout(300);
    await btnAgain.click();
    await page.waitForTimeout(400);

    // Card 2: Rate "Good" (3) -> Advances
    await flashcard.click();
    await page.waitForTimeout(300);
    await btnGood.click();
    await page.waitForTimeout(400);

    // Card 3: Rate "Easy" (4) -> Advances
    await flashcard.click();
    await page.waitForTimeout(300);
    await btnEasy.click();
    await page.waitForTimeout(400);

    // Remaining items in queue until completion
    let maxSteps = 10;
    while (maxSteps-- > 0) {
      const isCompleted = await page.locator('#srsCompletedState').isVisible();
      if (isCompleted) break;

      const isCardFront = await page.locator('#cardFront').isVisible();
      if (isCardFront) {
        await flashcard.click();
        await page.waitForTimeout(300);
        await btnGood.click();
        await page.waitForTimeout(400);
      }
    }

    // Verify session reached completion screen
    const completedState = page.locator('#srsCompletedState');
    await completedState.waitFor({ state: 'visible', timeout: 5000 });
    assert.ok(await completedState.isVisible(), 'Session must reach Completed state');

    // Verify completion statistics
    const totalReviewed = await page.locator('#statTotalReviewed').textContent();
    assert.ok(Number(totalReviewed) >= 3, `Total reviewed (${totalReviewed}) must reflect all cards studied`);

    const againCount = await page.locator('#statAgainCount').textContent();
    assert.ok(Number(againCount) >= 1, `Again count (${againCount}) must record at least 1 requeue`);

    const goodEasyCount = await page.locator('#statGoodEasyCount').textContent();
    assert.ok(Number(goodEasyCount) >= 2, `Good/Easy count (${goodEasyCount}) must record positive ratings`);

    const totalTime = await page.locator('#statTotalTime').textContent();
    assert.ok(totalTime && totalTime.trim().length > 0, 'Total elapsed study time must be recorded');
  });

  // ---------------------------------------------------------------------------
  // TC-T4-02: Real-World Listening Session Workflow
  // ---------------------------------------------------------------------------
  test('TC-T4-02: End-to-end listening workflow validates answer, locks/unlocks Next button, and advances', async () => {
    const { page } = ctx;
    await page.goto(`${ctx.server.baseUrl}/srs-review.html?lessonId=1&mode=listening&action=continue`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#srsActiveSession', { state: 'visible', timeout: 5000 });

    const listeningRoom = page.locator('#srsListeningRoom');
    await listeningRoom.waitFor({ state: 'visible', timeout: 5000 });

    // 1. Play audio prompt
    const btnAudio = page.locator('#btnListeningPlayAudio');
    await btnAudio.click();
    await page.waitForTimeout(200);

    // Retrieve expected character from session card
    const expectedHanzi = await page.evaluate(() => {
      const ctrl = window.srsReviewController || window.__SRS_PAGE_CONTROLLER;
      const card = ctrl?.sessionQueue[ctrl.currentIndex]?.card;
      return card?.hanzi || card?.character || '学';
    });

    // 2. Submit wrong answer
    const answerInput = page.locator('#listeningAnswerInput');
    await answerInput.fill('错');
    await page.locator('#btnListeningCheck').click();
    await page.waitForTimeout(300);

    // Verify error notice is displayed and Next button is locked
    const errorNotice = page.locator('#listeningErrorNotice');
    assert.ok(await errorNotice.isVisible(), 'Error notice must appear on incorrect answer');

    const nextBtn = page.locator('#btnListeningNext');
    const nextBtnClassWrong = await nextBtn.getAttribute('class');
    assert.ok(nextBtnClassWrong.includes('writing-next-hidden'), 'Next button must remain locked on incorrect answer');

    // 3. Clear and submit correct answer
    await answerInput.fill(expectedHanzi);
    await page.locator('#btnListeningCheck').click();
    await page.waitForTimeout(300);

    // Verify completion notice is displayed and Next button is unlocked
    const completionNotice = page.locator('#listeningCompletionNotice');
    assert.ok(await completionNotice.isVisible(), 'Completion notice must appear on correct answer');

    const nextBtnClassCorrect = await nextBtn.getAttribute('class');
    assert.ok(!nextBtnClassCorrect.includes('writing-next-hidden'), 'Next button must be unlocked on correct answer');

    // 4. Click Next to advance
    const reviewsBefore = ctx.submittedReviews.length;
    await nextBtn.click();
    await page.waitForTimeout(400);

    // Verify review submission with cardType: 'LISTENING'
    assert.ok(ctx.submittedReviews.length > reviewsBefore, 'Review submission must be dispatched on Next');
    const latestReview = ctx.submittedReviews[ctx.submittedReviews.length - 1];
    assert.strictEqual(latestReview.cardType, 'LISTENING');
  });

  // ---------------------------------------------------------------------------
  // TC-T4-03: Real-World Reading Evaluation Workflow
  // ---------------------------------------------------------------------------
  test('TC-T4-03: End-to-end reading evaluation renders structured syllable feedback and transitions cleanly', async () => {
    const { page } = ctx;
    await page.goto(`${ctx.server.baseUrl}/srs-review.html?lessonId=1&mode=reading&action=continue`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#srsActiveSession', { state: 'visible', timeout: 5000 });

    const readingRoom = page.locator('#srsReadingRoom');
    await readingRoom.waitFor({ state: 'visible', timeout: 5000 });

    // 1. Verify prompt Hanzi is displayed
    const promptHanzi = await page.locator('#readingPromptHanzi').textContent();
    assert.ok(promptHanzi && promptHanzi.trim().length > 0, 'Target prompt Hanzi must be present');

    // 2. Simulate complete assessment response in reading room controller
    await page.evaluate(() => {
      const ctrl = window.srsReviewController || window.__SRS_PAGE_CONTROLLER;
      if (ctrl) {
        ctrl.handleAssessmentResponse({
          status: 'SCORED',
          overallScore: 90,
          confidence: 'HIGH',
          recognizedText: '学',
          summaryVi: 'Phát âm chuẩn xác, thanh điệu 2 mượt mà.',
          components: {
            initials: 'Âm x- chuẩn xác.',
            finals: 'Vận mẫu -ué tròn vành.',
            tones: 'Thanh 2 hướng lên cao tốt.'
          },
          retryAdvice: 'Tiếp tục phát huy.'
        }, ctrl.sessionQueue[ctrl.currentIndex]?.card);
      }
    });

    // 3. Verify State D (Result) is visible with structured feedback
    const resultState = page.locator('#readingStateResult');
    await resultState.waitFor({ state: 'visible', timeout: 3000 });
    assert.ok(await resultState.isVisible(), 'State D (Result) must be displayed');

    const scoreBadge = await page.locator('#readingOverallScoreBadge').textContent();
    assert.ok(scoreBadge.includes('90'), 'Score badge must display 90');

    // 4. Verify Next button is unlocked
    const nextBtn = page.locator('#btnReadingNext');
    const nextClasses = await nextBtn.getAttribute('class');
    assert.ok(!nextClasses.includes('writing-next-hidden'), 'Next button must be unlocked');

    // 5. Click Next to advance
    const reviewsBefore = ctx.submittedReviews.length;
    await nextBtn.click();
    await page.waitForTimeout(400);

    assert.ok(ctx.submittedReviews.length > reviewsBefore, 'SRS review submission must be recorded for Reading');
    const latestReview = ctx.submittedReviews[ctx.submittedReviews.length - 1];
    assert.strictEqual(latestReview.cardType, 'READING');
  });

  // ---------------------------------------------------------------------------
  // TC-T4-04: Cross-Mode Navigation & Transition
  // ---------------------------------------------------------------------------
  test('TC-T4-04: Seamless quick switching across Flashcard, Reading, and Listening rooms without collision', async () => {
    const { page } = ctx;
    const errorsBefore = ctx.getRuntimeErrors().length;

    await page.goto(`${ctx.server.baseUrl}/srs-review.html?lessonId=1&action=continue`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#srsActiveSession', { state: 'visible', timeout: 5000 });

    const flashcardContainer = page.locator('#srsFlashcardContainer');
    const readingRoom = page.locator('#srsReadingRoom');
    const listeningRoom = page.locator('#srsListeningRoom');

    // Initially in Flashcard mode
    assert.ok(await flashcardContainer.isVisible(), 'Flashcard container must be visible initially');
    assert.strictEqual(await readingRoom.isVisible(), false, 'Reading Room must be hidden');
    assert.strictEqual(await listeningRoom.isVisible(), false, 'Listening Room must be hidden');

    // Switch to Reading Room
    await page.locator('#quickSkillReading').click();
    await page.waitForTimeout(300);
    assert.strictEqual(await flashcardContainer.isVisible(), false, 'Flashcard must hide when in Reading');
    assert.ok(await readingRoom.isVisible(), 'Reading Room must be visible');
    assert.strictEqual(await listeningRoom.isVisible(), false, 'Listening Room must remain hidden');

    // Switch to Listening Room
    await page.locator('#quickSkillListening').click();
    await page.waitForTimeout(300);
    assert.strictEqual(await readingRoom.isVisible(), false, 'Reading Room must hide when in Listening');
    assert.ok(await listeningRoom.isVisible(), 'Listening Room must be visible');
    assert.strictEqual(await flashcardContainer.isVisible(), false, 'Flashcard must remain hidden');

    // Switch back to Flashcard
    await page.locator('#quickSkillFlashcard').click();
    await page.waitForTimeout(300);
    assert.ok(await flashcardContainer.isVisible(), 'Flashcard must be restored');
    assert.strictEqual(await readingRoom.isVisible(), false, 'Reading Room must be hidden');
    assert.strictEqual(await listeningRoom.isVisible(), false, 'Listening Room must be hidden');

    // Verify zero fatal console errors occurred strictly during this test
    const errorsDuringTest = ctx.getRuntimeErrors().slice(errorsBefore).filter(e =>
      e.includes('Uncaught') || e.includes('TypeError') || e.includes('ReferenceError')
    );
    assert.strictEqual(errorsDuringTest.length, 0, `No fatal errors during quick switching: ${errorsDuringTest.join(', ')}`);
  });
});
