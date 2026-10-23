/**
 * =============================================================================
 * BROWSER E2E TEST: INTERACTIVE SRS FLASHCARD REVIEW SESSION (TASK 9C.3)
 * File: tests/frontend/e2e/srs-review.browser.mjs
 * 
 * Verifies:
 * - SR-01: Anonymous user displays login-required state without calling protected SRS API.
 * - SR-02: Authenticated user loads due cards session, renders prompt card, starts reaction timer.
 * - SR-03: 3D Flip interaction toggles between front prompt and back answer (click & Space).
 * - SR-04: Keyboard rating shortcut (1..4) submits authoritative review to backend and advances.
 * - SR-05: Rating Again (1) requeues card to the end of the local session queue.
 * - SR-06: Session completes with truthful statistics (total reviewed, Again, Good/Easy, time).
 * - SR-07: Lesson query mode (?lessonId=10) retrieves new cards from approved lesson.
 * - SR-08: Contextual personal notes modal opens from vocabulary card back-face.
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

function createMockDueCards() {
  return [
    {
      itemType: 'VOCABULARY',
      itemId: 101,
      hanzi: '学',
      pinyin: 'xué',
      meaningHanViet: 'Học',
      meaningVi: 'Học tập, nghiên cứu',
      exampleSentence: '我在大学学中文。',
      exampleTranslation: 'Tôi học tiếng Trung ở trường đại học.',
      strokeCount: null,
      repetitions: 1,
      easeFactor: 2.50,
      intervalDays: 1,
      nextReviewAt: '2026-09-14T10:00:00',
      isNew: false
    },
    {
      itemType: 'VOCABULARY',
      itemId: 102,
      hanzi: '书',
      pinyin: 'shū',
      meaningHanViet: 'Thư',
      meaningVi: 'Sách, vở',
      exampleSentence: '这是一本好书。',
      exampleTranslation: 'Đây là một cuốn sách hay.',
      strokeCount: null,
      repetitions: 0,
      easeFactor: 2.50,
      intervalDays: 0,
      nextReviewAt: null,
      isNew: true
    }
  ];
}

async function setupAuthenticatedSession(page) {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'test_srs_learner_jwt');
    localStorage.setItem('user_info', JSON.stringify({
      accountId: 1001,
      emailOrPhone: 'srs_learner@example.com',
      fullName: 'Học Viên SRS',
      roles: ['Learner']
    }));
  });

  await page.route('**/api/v1/**/notes*', async (route) => {
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

  await page.route('**/api/v1/radicals*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: { items: [], page: 0, size: 214, totalElements: 0, totalPages: 0 }
      })
    });
  });

  await page.route('**/api/v1/lessons*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: { items: [], page: 0, size: 100, totalElements: 0, totalPages: 0 }
      })
    });
  });

  await page.route('**/api/v1/vocabulary/*', async (route) => {
    const url = route.request().url();
    const idMatch = url.match(/\/vocabulary\/(\d+)/);
    const id = idMatch ? Number(idMatch[1]) : 0;
    const mockMap = {
      101: {
        vocabId: 101,
        hanzi: '学',
        pinyin: 'xué',
        meaningHanViet: 'Học',
        meaningVi: 'Học tập, nghiên cứu',
        radicals: [
          { radicalId: 39, character: '子', meaningHanViet: 'Tử', hanziChar: '学' }
        ]
      },
      102: {
        vocabId: 102,
        hanzi: '书',
        pinyin: 'shū',
        meaningHanViet: 'Thư',
        meaningVi: 'Sách, vở',
        radicals: [
          { radicalId: 6, character: '亅', meaningHanViet: 'Quyết', hanziChar: '书' }
        ]
      }
    };
    const data = mockMap[id] || {
      vocabId: id,
      hanzi: '字',
      pinyin: 'zì',
      meaningHanViet: 'Tự',
      meaningVi: 'Chữ',
      radicals: []
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data
      })
    });
  });
}

describe('Browser E2E: Interactive SRS Flashcard Review Session (9C.3)', () => {
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

  // SR-01: Anonymous Guard
  test('SR-01: Anonymous user displays login-required state without calling protected SRS API', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      let interceptedSrsCall = false;
      await page.route('**/api/v1/srs/**', async (route) => {
        interceptedSrsCall = true;
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'UNAUTHORIZED', message: 'Unauthorized' })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html`, { waitUntil: 'domcontentloaded' });

      // Check auth required view
      const authState = page.locator('#srsAuthState');
      await authState.waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await authState.isVisible(), 'Authentication-required container must be visible');

      const loginBtn = page.locator('#btnSrsLoginRedirect');
      assert.ok(await loginBtn.isVisible(), 'Login redirect button must be visible');
      const href = await loginBtn.getAttribute('href');
      assert.ok(href.includes('login.html'), 'Link must direct to login.html');

      assert.strictEqual(interceptedSrsCall, false, 'Frontend must NOT call protected SRS API when unauthenticated');
      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero unexpected runtime console/page errors');
    } finally {
      await context.close();
    }
  });

  // SR-02: Authenticated user loads due cards & starts reaction timer
  test('SR-02: Authenticated user loads due cards session, renders prompt card, starts reaction timer', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/srs/due*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: createMockDueCards()
          })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html`, { waitUntil: 'domcontentloaded' });

      // Active session visible
      const activeSession = page.locator('#srsActiveSession');
      await activeSession.waitFor({ state: 'visible', timeout: 5000 });

      // Check Card 1 prompt
      const frontHanzi = page.locator('#cardFrontHanzi');
      await frontHanzi.waitFor({ state: 'visible' });
      assert.strictEqual(await frontHanzi.textContent(), '学', 'Front face must display Hanzi "学"');

      const frontPinyin = page.locator('#cardFrontPinyin');
      assert.strictEqual(await frontPinyin.textContent(), 'xué', 'Front face must display Pinyin "xué"');

      // Progress bar & counter
      const progressText = page.locator('#srsProgressText');
      assert.ok((await progressText.textContent()).includes('Thẻ 1 / 2'));

      // Timer badge exists and contains ⏱️
      const timerBadge = page.locator('#reactionTimerBadge');
      assert.ok((await timerBadge.textContent()).includes('⏱️'));

      // Rating buttons are enabled on front prompt (flipping is optional)
      const btnGood = page.locator('#btnRatingGood');
      assert.strictEqual(await btnGood.isDisabled(), false, 'Rating buttons must be enabled while viewing front prompt');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero unexpected runtime errors');
    } finally {
      await context.close();
    }
  });

  // SR-03: 3D Flip interaction (click and Space key)
  test('SR-03: 3D Flip interaction toggles between front prompt and back answer (click & Space)', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/srs/due*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: createMockDueCards()
          })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 5000 });

      const flashcard = page.locator('#flashcard');
      const cardFront = page.locator('#cardFront');
      const cardBack = page.locator('#cardBack');

      // Initial state
      assert.strictEqual(await cardFront.getAttribute('aria-hidden'), 'false');
      assert.strictEqual(await cardBack.getAttribute('aria-hidden'), 'true');

      // Click to flip
      await flashcard.click();
      await page.waitForTimeout(100);

      // Flipped state
      const isFlipped = await flashcard.evaluate(el => el.classList.contains('flipped'));
      assert.strictEqual(isFlipped, true, 'Flashcard must have class "flipped"');
      assert.strictEqual(await cardFront.getAttribute('aria-hidden'), 'true');
      assert.strictEqual(await cardBack.getAttribute('aria-hidden'), 'false');

      // Check answer details on back
      const meaningVi = page.locator('#cardBackMeaningVi');
      assert.strictEqual(await meaningVi.textContent(), 'Học tập, nghiên cứu');

      // Rating buttons must remain enabled when flipped
      const btnGood = page.locator('#btnRatingGood');
      assert.strictEqual(await btnGood.isDisabled(), false, 'Rating buttons must be enabled when flipped');

      // Press Space to flip back to front
      await page.keyboard.press('Space');
      await page.waitForTimeout(100);

      const isFlippedAfterSpace = await flashcard.evaluate(el => el.classList.contains('flipped'));
      assert.strictEqual(isFlippedAfterSpace, false, 'Flashcard must unflip when Space is pressed again');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero unexpected runtime errors');
    } finally {
      await context.close();
    }
  });

  // SR-04: Keyboard rating shortcut (1..4) submits authoritative review and advances
  test('SR-04: Keyboard rating shortcut (1..4) submits authoritative review to backend and advances', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/srs/due*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: createMockDueCards()
          })
        });
      });

      let capturedPayload = null;
      await page.route('**/api/v1/srs/review', async (route) => {
        capturedPayload = JSON.parse(route.request().postData());
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              itemType: 'VOCABULARY',
              itemId: 101,
              hanzi: '学',
              intervalDays: 6,
              repetitions: 2,
              easeFactor: 2.50
            }
          })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 5000 });

      // Flip card first
      await page.locator('#flashcard').click();
      await page.waitForTimeout(100);

      // Press '3' (Good)
      await page.keyboard.press('3');
      await page.waitForTimeout(200);

      // Verify payload sent to backend
      assert.ok(capturedPayload, 'POST /api/v1/srs/review must be invoked');
      assert.strictEqual(capturedPayload.itemType, 'VOCABULARY');
      assert.strictEqual(capturedPayload.itemId, 101);
      assert.strictEqual(capturedPayload.rating, 3);
      assert.ok(typeof capturedPayload.reviewTimeSeconds === 'number' && capturedPayload.reviewTimeSeconds >= 0);
      assert.strictEqual('userId' in capturedPayload, false, 'No userId in payload');

      // Should have advanced to Card 2 ("书")
      const frontHanzi = page.locator('#cardFrontHanzi');
      await frontHanzi.waitFor({ state: 'visible' });
      assert.strictEqual(await frontHanzi.textContent(), '书', 'Session must advance to card 2 ("书")');

      const progressText = page.locator('#srsProgressText');
      assert.ok((await progressText.textContent()).includes('Thẻ 2 / 2'));

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero unexpected runtime errors');
    } finally {
      await context.close();
    }
  });

  // SR-05: Rating Again (1) requeues card to the end of the session
  test('SR-05: Rating Again (1) requeues card to the end of the local session queue', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/srs/due*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: [createMockDueCards()[0]] // 1 card
          })
        });
      });

      let reviewCount = 0;
      await page.route('**/api/v1/srs/review', async (route) => {
        reviewCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: { itemId: 101, intervalDays: 0 }
          })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 5000 });

      // Flip card
      await page.locator('#flashcard').click();
      await page.waitForTimeout(100);

      // Select Again (button or key '1')
      await page.locator('#btnRatingAgain').click();
      await page.waitForTimeout(200);

      // Card should be requeued, queue is now 2 items, and card appears again
      const progressText = page.locator('#srsProgressText');
      assert.ok((await progressText.textContent()).includes('Thẻ 2 / 2'), 'Requeued card must update progress to Thẻ 2 / 2');

      // The status badge should display "Học lại"
      const statusBadge = page.locator('#cardStatusBadgeFront');
      assert.strictEqual(await statusBadge.textContent(), 'Học lại');

      assert.strictEqual(reviewCount, 1, 'First review must have been recorded');
      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero unexpected runtime errors');
    } finally {
      await context.close();
    }
  });

  // SR-06: Session completes with truthful statistics
  test('SR-06: Session completes with truthful statistics (total reviewed, Again, Good/Easy, time)', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/srs/due*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: [createMockDueCards()[0]] // 1 card
          })
        });
      });

      await page.route('**/api/v1/srs/review', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: { itemId: 101, intervalDays: 1 }
          })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 5000 });

      // Flip card and rate Easy (4)
      await page.locator('#flashcard').click();
      await page.waitForTimeout(100);
      await page.locator('#btnRatingEasy').click();

      // Session completes
      const completedState = page.locator('#srsCompletedState');
      await completedState.waitFor({ state: 'visible', timeout: 5000 });

      const totalReviewed = page.locator('#statTotalReviewed');
      assert.strictEqual(await totalReviewed.textContent(), '1');

      const goodEasyCount = page.locator('#statGoodEasyCount');
      assert.strictEqual(await goodEasyCount.textContent(), '1');

      const againCount = page.locator('#statAgainCount');
      assert.strictEqual(await againCount.textContent(), '0');

      const restartBtn = page.locator('#btnRestartSession');
      assert.ok(await restartBtn.isVisible());

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero unexpected runtime errors');
    } finally {
      await context.close();
    }
  });

  // SR-07: Lesson query mode (?lessonId=10) retrieves due cards by lessonId
  test('SR-07: Lesson query mode (?lessonId=10) retrieves due cards by lessonId', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      let requestedLessonParam = null;
      await page.route('**/api/v1/srs/due*', async (route) => {
        const url = new URL(route.request().url());
        requestedLessonParam = url.searchParams.get('lessonId');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: [createMockDueCards()[1]] // Card 2 with isNew=true
          })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html?lessonId=10`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 5000 });

      assert.strictEqual(requestedLessonParam, '10', 'Endpoint must be requested with lessonId=10');

      // Mode badge displays Lesson context
      const modeBadge = page.locator('#srsSessionModeBadge');
      assert.ok((await modeBadge.textContent()).includes('10'));

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero unexpected runtime errors');
    } finally {
      await context.close();
    }
  });

  // SR-08: Redesigned compact inline note on card back (Requirements 1, 2, 3)
  test('SR-08: Redesigned compact inline editable note on card back with auto-save, char counter, and shortcut protection', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/srs/due*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: [createMockDueCards()[0]] // Vocab card itemId: 101, hanzi: '学'
          })
        });
      });

      let interceptedNotesGet = false;
      let interceptedNotesPost = false;
      let savedNoteContent = '';

      await page.route('**/api/v1/vocabularies/101/notes*', async (route) => {
        if (route.request().method() === 'GET') {
          interceptedNotesGet = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'SUCCESS',
              message: 'OK',
              data: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }
            })
          });
        } else if (route.request().method() === 'POST') {
          interceptedNotesPost = true;
          const body = JSON.parse(route.request().postData() || '{}');
          savedNoteContent = body.content || '';
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'SUCCESS',
              message: 'OK',
              data: { noteId: 999, content: savedNoteContent, createdAt: new Date().toISOString() }
            })
          });
        }
      });

      await page.goto(`${baseUrl}/srs-review.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 5000 });

      // Flip card to reveal answer
      await page.locator('#flashcard').click();
      await page.waitForTimeout(150);

      // 1. Requirement 1: Redundant elements strictly hidden/removed
      const cardTypeBadge = page.locator('#cardTypeBadgeBack');
      assert.strictEqual(await cardTypeBadge.isHidden(), true, 'Card type badge ("Từ vựng") must be hidden');

      const oldNoteBtn = page.locator('#btnCardNote');
      assert.strictEqual(await oldNoteBtn.isHidden(), true, 'Old "📝 Ghi chú" button must be hidden');

      const cardBackText = await page.locator('#cardBack').innerText();
      assert.ok(!cardBackText.includes('Chọn 1 trong 4 mức đánh giá bên dưới để tiếp tục'), 'Bottom helper text must be removed');
      assert.ok(!cardBackText.includes('Ghi chú đã lưu'), 'Old 2-column "Ghi chú đã lưu" must be removed');
      assert.ok(!cardBackText.includes('Thêm ghi chú mới'), 'Old 2-column "Thêm ghi chú mới" must be removed');

      // 2. Requirement 2: Single inline note box displayed inside example box with dashed divider
      const exampleBox = page.locator('#cardBackExampleBox');
      assert.ok(await exampleBox.isVisible(), 'Example box must be visible for vocabulary with example');

      const inlineNoteContainer = page.locator('#cardInlineNoteContainer');
      assert.ok(await inlineNoteContainer.isVisible(), 'Inline note container must be visible');

      const inlineNoteDisplay = page.locator('#cardInlineNoteDisplay');
      assert.ok(await inlineNoteDisplay.isVisible(), 'Inline note display state must be visible initially');

      const initialDisplayText = (await page.locator('#cardInlineNoteText').textContent()).trim();
      assert.ok(initialDisplayText.includes('Thêm mẹo nhớ hoặc ghi chú...'), 'Empty note must show placeholder');

      // 3. Requirement 2: Click to edit
      await inlineNoteDisplay.click();
      await page.waitForTimeout(100);

      const editWrapper = page.locator('#cardInlineNoteEditWrapper');
      assert.ok(await editWrapper.isVisible(), 'Clicking note switches to edit mode');

      const input = page.locator('#cardInlineNoteInput');
      assert.ok(await input.isVisible(), 'Note input field must be visible');

      // Check max length 150
      const maxLength = await input.getAttribute('maxlength');
      assert.strictEqual(maxLength, '150', 'Note input must have maxlength="150"');

      // Check live character counter
      const charCount = page.locator('#cardInlineNoteCharCount');
      assert.strictEqual((await charCount.textContent()).trim(), '0/150', 'Initial counter must show 0/150');

      // Check checkmark save button exists and is visible at end of input bar
      const saveBtn = page.locator('#btnSaveInlineNote');
      assert.ok(await saveBtn.isVisible(), 'Checkmark save button must be visible at end of input bar');

      // 4. Requirement 3: Typing & keyboard safety (Space & 1..4 locked while editing)
      await input.type('Học tập mỗi ngày');
      assert.strictEqual((await charCount.textContent()).trim(), '16/150', 'Character counter must update live to 16/150');

      // Press Space while typing in input - must NOT flip card back
      await page.keyboard.press('Space');
      await page.waitForTimeout(100);
      const isFlipped = await page.evaluate(() => {
        const fc = document.getElementById('flashcard');
        return fc ? (fc.classList.contains('flipped') || fc.classList.contains('is-flipped')) : false;
      });
      assert.strictEqual(isFlipped, true, 'Space key inside input must NOT flip flashcard');

      // Press rating key '3' while typing in input - must NOT trigger rating
      await page.keyboard.press('3');
      await page.waitForTimeout(100);
      const activeCardText = (await page.locator('#cardBackHanzi').textContent()).trim();
      assert.strictEqual(activeCardText, '学', 'Rating shortcut inside input must NOT advance card');

      // 5. Auto-save on Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      // Verify edit mode closed and display mode reopened
      assert.strictEqual(await editWrapper.isHidden(), true, 'Edit mode must close on Enter');
      assert.ok(await inlineNoteDisplay.isVisible(), 'Display mode must be restored');

      // Verify display text updated
      const updatedDisplayText = (await page.locator('#cardInlineNoteText').textContent()).trim();
      assert.ok(updatedDisplayText.includes('Học tập mỗi ngày 3'), 'Updated text must display saved note content');

      // Verify API was called
      assert.strictEqual(interceptedNotesPost, true, 'POST /vocabularies/101/notes must be called to persist note');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero unexpected runtime errors');
    } finally {
      await context.close();
    }
  });

  // SR-09: Speech button visual synchronization and keyboard conflict safety
  test('SR-09: Speech button matches Vocabulary design system (.vocab-speech-btn) with zero emoji and no flip conflict', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/srs/due*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: [createMockDueCards()[0]] // Vocab card itemId: 101, hanzi: '学'
          })
        });
      });

      await page.route('**/api/v1/vocabulary/101', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: { id: 101, hanzi: '学', pinyin: 'xué', audioUrl: null }
          })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 5000 });

      const frontSpeechBtn = page.locator('#btnAudioPronounceFront');
      await frontSpeechBtn.waitFor({ state: 'visible', timeout: 5000 });

      // 1. Visual & Markup Verification
      const frontClasses = await frontSpeechBtn.getAttribute('class');
      assert.ok(frontClasses.includes('vocab-speech-btn'), 'SRS front speech button must have class "vocab-speech-btn"');

      const frontText = await frontSpeechBtn.innerText();
      assert.strictEqual(frontText.trim(), '', 'Front speech button must contain only SVG icon (zero text, no emoji 🔊)');

      const frontSvg = frontSpeechBtn.locator('svg');
      assert.ok(await frontSvg.isVisible(), 'SVG speaker icon must be present inside speech button');

      const frontAria = await frontSpeechBtn.getAttribute('aria-label');
      assert.ok(frontAria && frontAria.includes('Phát âm'), 'Must provide accessible name mentioning "Phát âm"');

      // Check computed dimensions
      const btnBox = await frontSpeechBtn.boundingBox();
      assert.ok(btnBox, 'Bounding box must exist');
      assert.ok(Math.abs(btnBox.width - 34) <= 2, `Button width should be ~34px, got ${btnBox.width}`);
      assert.ok(Math.abs(btnBox.height - 34) <= 2, `Button height should be ~34px, got ${btnBox.height}`);

      // 2. Keyboard conflict test: Space when focused on speech button must NOT flip card
      const flashcard = page.locator('#flashcard');
      const cardBack = page.locator('#cardBack');

      await frontSpeechBtn.focus();
      assert.strictEqual(await flashcard.getAttribute('aria-expanded'), 'false');
      assert.ok(await cardBack.getAttribute('aria-hidden') === 'true');

      // Press Space while speech button is focused
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);

      // Flashcard MUST still be on front face (not flipped)
      assert.strictEqual(await flashcard.getAttribute('aria-expanded'), 'false', 'Space on speech button must not flip card');
      assert.strictEqual(await cardBack.getAttribute('aria-hidden'), 'true', 'Card back must remain hidden');

      // Click speech button directly - must also not flip card
      await frontSpeechBtn.click();
      await page.waitForTimeout(200);
      assert.strictEqual(await flashcard.getAttribute('aria-expanded'), 'false', 'Click on speech button must not flip card');

      // 3. Now flip card using Space on the card scene / background
      await page.locator('#flashcard').click();
      await page.waitForTimeout(200);
      assert.strictEqual(await flashcard.getAttribute('aria-expanded'), 'true', 'Click on card body flips card');

      // 4. Back face speech button verification
      const backSpeechBtn = page.locator('#btnAudioPronounceBack');
      await backSpeechBtn.waitFor({ state: 'visible', timeout: 5000 });

      const backClasses = await backSpeechBtn.getAttribute('class');
      assert.ok(backClasses.includes('vocab-speech-btn'), 'SRS back speech button must have class "vocab-speech-btn"');

      const backText = await backSpeechBtn.innerText();
      assert.strictEqual(backText.trim(), '', 'Back speech button must contain only SVG icon (zero text, no emoji 🔊)');

      const backSvg = backSpeechBtn.locator('svg');
      assert.ok(await backSvg.isVisible(), 'SVG speaker icon must be present on back face');

      // Click back speech button - card must remain on back face (not unflip)
      await backSpeechBtn.click();
      await page.waitForTimeout(200);
      assert.strictEqual(await flashcard.getAttribute('aria-expanded'), 'true', 'Clicking speech button on back must not unflip card');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero unexpected runtime errors');
    } finally {
      await context.close();
    }
  });

  // SR-10: Free practice query mode (?lessonId=10&mode=practice) with Zero SRS Mutation
  test('SR-10: Free practice query mode (?lessonId=10&mode=practice) retrieves practice cards and completes without POST /api/v1/srs/review', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      let practiceCardsCalled = false;
      let reviewPostCalled = false;

      await page.route('**/api/v1/srs/practice-cards*', async (route) => {
        practiceCardsCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: [
              {
                cardProgressId: 10,
                itemType: 'VOCABULARY',
                itemId: 101,
                hanzi: '你好',
                pinyin: 'nǐ hǎo',
                meaningVi: 'Xin chào',
                meaningHanViet: 'Nhĩ hảo',
                exampleSentence: '你好！很高兴认识你。',
                exampleTranslation: 'Xin chào! Rất vui được gặp bạn.',
                audioUrl: null,
                isNew: false,
                interval: 3,
                easeFactor: 2.5,
                repetitions: 2,
                nextReviewAt: '2026-10-15T00:00:00Z',
                orderIndex: 1
              }
            ]
          })
        });
      });

      await page.route('**/api/v1/srs/review', async (route) => {
        reviewPostCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: {} })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html?lessonId=10&mode=practice`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 5000 });

      assert.strictEqual(practiceCardsCalled, true, 'Practice cards endpoint must be invoked in mode=practice');

      // Verify mode badge
      const badgeText = await page.locator('#srsSessionModeBadge').textContent();
      assert.ok(badgeText.includes('Luyện tự do #10'), `Badge must reflect free practice mode: ${badgeText}`);

      // Flip card and rate
      await page.locator('#flashcard').click();
      await page.waitForTimeout(100);

      // Click Good (3)
      await page.locator('#btnRatingGood').click();

      // Session completes
      await page.locator('#srsCompletedState').waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await page.locator('#srsCompletedState').isVisible(), 'Completed state must be revealed');

      const completedTitle = await page.locator('#srsCompletedTitle').textContent();
      assert.ok(completedTitle.includes('Luyện Tập Tự Do'), `Completion title must reflect practice: ${completedTitle}`);

      // Verify ZERO SRS MUTATION: /srs/review must NEVER be called
      assert.strictEqual(reviewPostCalled, false, 'Free practice must have ZERO mutation on SRS review API');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero unexpected runtime errors');
    } finally {
      await context.close();
    }
  });

  // SR-11: Rating directly on front prompt without flipping (Mouse & Keyboard Numpad/Digit)
  test('SR-11: Rating directly on front prompt without flipping (Mouse click & Numpad)', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/srs/due*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: createMockDueCards()
          })
        });
      });

      const reviewCalls = [];
      await page.route('**/api/v1/srs/review', async (route) => {
        const payload = JSON.parse(route.request().postData());
        reviewCalls.push(payload);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: { itemId: payload.itemId, rating: payload.rating }
          })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 5000 });

      // Verify hint displays shortcut badges [1], [2], [3], [4]
      const againShortcut = await page.locator('#btnRatingAgain .btn-rating-shortcut').textContent();
      const hardShortcut = await page.locator('#btnRatingHard .btn-rating-shortcut').textContent();
      const goodShortcut = await page.locator('#btnRatingGood .btn-rating-shortcut').textContent();
      const easyShortcut = await page.locator('#btnRatingEasy .btn-rating-shortcut').textContent();
      assert.strictEqual(againShortcut.trim(), '[1]');
      assert.strictEqual(hardShortcut.trim(), '[2]');
      assert.strictEqual(goodShortcut.trim(), '[3]');
      assert.strictEqual(easyShortcut.trim(), '[4]');

      // Thẻ đang ở MẶT TRƯỚC (chưa lật đáp án)
      const flashcard = page.locator('#flashcard');
      assert.strictEqual(await flashcard.getAttribute('aria-expanded'), 'false');
      assert.strictEqual(await page.locator('#cardFront').getAttribute('aria-hidden'), 'false');

      // Đánh giá trực tiếp bằng chuột (Click Good [3]) mà KHÔNG lật thẻ
      await page.locator('#btnRatingGood').click();
      await page.waitForTimeout(200);

      // Verify call 1 went through for Card 1
      assert.strictEqual(reviewCalls.length, 1);
      assert.strictEqual(reviewCalls[0].itemId, 101);
      assert.strictEqual(reviewCalls[0].rating, 3);

      // Advanced to Card 2 ("书"), still on front face
      await page.locator('#cardFrontHanzi').waitFor({ state: 'visible' });
      assert.strictEqual(await page.locator('#cardFrontHanzi').textContent(), '书');
      assert.strictEqual(await flashcard.getAttribute('aria-expanded'), 'false');

      // Đánh giá trực tiếp bằng Numpad4 (Easy) mà KHÔNG lật thẻ
      await page.keyboard.press('Numpad4');
      await page.waitForTimeout(200);

      assert.strictEqual(reviewCalls.length, 2);
      assert.strictEqual(reviewCalls[1].itemId, 102);
      assert.strictEqual(reviewCalls[1].rating, 4);

      // Session completes
      await page.locator('#srsCompletedState').waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await page.locator('#srsCompletedState').isVisible());

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero unexpected runtime errors');
    } finally {
      await context.close();
    }
  });

  // SR-12: Ignores rating shortcuts when typing in inputs/modals and guards against double-submission
  test('SR-12: Ignores rating shortcuts in input focus and prevents double-submission', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/srs/due*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: [createMockDueCards()[0]]
          })
        });
      });

      let reviewCallsCount = 0;
      await page.route('**/api/v1/srs/review', async (route) => {
        reviewCallsCount++;
        // Add artificial latency to test double submission guard
        await new Promise(r => setTimeout(r, 150));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: {} })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 5000 });

      // Create a temporary input element to test focus bypass
      await page.evaluate(() => {
        const inp = document.createElement('input');
        inp.id = 'testInputFocus';
        document.body.appendChild(inp);
        inp.focus();
      });

      // Press '3' while focused on input - must NOT trigger rating
      await page.keyboard.press('3');
      await page.waitForTimeout(100);
      assert.strictEqual(reviewCallsCount, 0, 'Keystroke in input must NOT trigger rating');

      // Blur the input
      await page.evaluate(() => {
        const inp = document.getElementById('testInputFocus');
        inp.blur();
        inp.remove();
      });

      // Rapidly press '3' twice to verify double-submission protection
      await Promise.all([
        page.keyboard.press('3'),
        page.keyboard.press('3')
      ]);
      await page.waitForTimeout(300);

      assert.strictEqual(reviewCallsCount, 1, 'Double submission guard must allow only 1 review request');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero unexpected runtime errors');
    } finally {
      await context.close();
    }
  });


  // SR-13: Radical card note in srs_radical_notes and race-condition immunity during rating
  test('SR-13: Radical card note in srs_radical_notes and zero cross-card pollution when rating during edit', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      await page.addInitScript(() => {
        // Pre-populate radical 1 note
        localStorage.setItem('srs_radical_notes', JSON.stringify({
          '1': {
            radicalId: 1,
            content: 'Nét gạch ngang nhất nguyên',
            updatedAt: new Date().toISOString()
          }
        }));
      });

      await page.route('**/api/v1/srs/due*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: [
              {
                cardId: 201,
                itemType: 'RADICAL',
                itemId: 1,
                cardType: 'READING',
                hanzi: '一',
                pinyin: 'yī',
                meaningVi: 'Số một',
                strokeCount: 1,
                exampleSentence: null,
                exampleTranslation: null,
                state: 'REVIEW',
                rating: 3,
                due: true
              },
              {
                cardId: 202,
                itemType: 'VOCABULARY',
                itemId: 102,
                cardType: 'READING',
                hanzi: '生',
                pinyin: 'shēng',
                meaningVi: 'Sinh',
                exampleSentence: '他是大学学生。',
                exampleTranslation: 'Anh ấy là sinh viên.',
                state: 'REVIEW',
                rating: 3,
                due: true
              }
            ]
          })
        });
      });

      await page.route('**/api/v1/srs/review*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: {} })
        });
      });

      await page.route('**/api/v1/vocabularies/102/notes*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: { items: [] } })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 5000 });

      // Flip Radical card
      await page.locator('#flashcard').click();
      await page.waitForTimeout(200);

      // Verify stroke count badge is visible
      const strokeCountBadge = page.locator('#cardBackStrokeCount');
      assert.strictEqual(await strokeCountBadge.isVisible(), true, 'Stroke count badge must be visible for radicals');

      // Verify radical note was loaded from srs_radical_notes
      const initialText = (await page.locator('#cardInlineNoteText').textContent()).trim();
      assert.ok(initialText.includes('Nét gạch ngang nhất nguyên'), 'Must display note from srs_radical_notes');

      // Edit radical note
      await page.locator('#cardInlineNoteDisplay').click();
      await page.waitForTimeout(100);

      const input = page.locator('#cardInlineNoteInput');
      await input.fill('Mẹo nhớ số 1 sửa đổi');

      // Verify IME composition does not submit on Enter
      await page.evaluate(() => {
        const inp = document.getElementById('cardInlineNoteInput');
        const evt = new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, bubbles: true });
        Object.defineProperty(evt, 'isComposing', { value: true });
        inp.dispatchEvent(evt);
      });
      await page.waitForTimeout(100);
      assert.strictEqual(await input.isVisible(), true, 'IME Enter must not exit edit mode');

      // Directly click rating button [3] to advance to next card (Vocab: '生')
      await page.locator('#btnRatingGood').click();
      await page.waitForTimeout(500);

      // Flip card 2
      await page.locator('#flashcard').click();
      await page.waitForTimeout(200);

      // Check card 2 is indeed '生' and has empty note placeholder (NOT polluted by Card 1!)
      const card2Hanzi = (await page.locator('#cardBackHanzi').textContent()).trim();
      assert.strictEqual(card2Hanzi, '生', 'Must advance to card 2');

      const card2NoteText = (await page.locator('#cardInlineNoteText').textContent()).trim();
      assert.ok(card2NoteText.includes('Thêm mẹo nhớ hoặc ghi chú...'), 'Card 2 must show empty placeholder, not Card 1 note');

      // Verify srs_radical_notes in localStorage was updated with the edited content
      const storedRadicals = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('srs_radical_notes') || '{}');
      });
      assert.strictEqual(storedRadicals['1']?.content, 'Mẹo nhớ số 1 sửa đổi', 'srs_radical_notes must persist edited note');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero unexpected runtime errors');
    } finally {
      await context.close();
    }
  });

  // SR-14: Constituent Radicals on Card Back (shows for vocabulary, hides for radicals)
  test('SR-14: Constituent Radicals on Card Back (shows for vocabulary, hides for radicals)', async () => {
    const { context, page, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await setupAuthenticatedSession(page);

      const mixedCards = [
        {
          itemType: 'VOCABULARY',
          itemId: 101,
          hanzi: '学',
          pinyin: 'xué',
          meaningHanViet: 'Học',
          meaningVi: 'Học tập, nghiên cứu',
          exampleSentence: '我在大学学中文。',
          exampleTranslation: 'Tôi học tiếng Trung ở trường đại học.',
          strokeCount: null,
          repetitions: 1,
          easeFactor: 2.50,
          intervalDays: 1,
          nextReviewAt: '2026-09-14T10:00:00',
          isNew: false
        },
        {
          itemType: 'RADICAL',
          itemId: 1,
          hanzi: '一',
          pinyin: 'yī',
          meaningHanViet: 'Nhất',
          meaningVi: 'Một, số một',
          exampleSentence: null,
          exampleTranslation: null,
          strokeCount: 1,
          repetitions: 1,
          easeFactor: 2.50,
          intervalDays: 1,
          nextReviewAt: '2026-09-14T10:00:00',
          isNew: false
        }
      ];

      await page.route('**/api/v1/srs/due*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: mixedCards
          })
        });
      });

      await page.route('**/api/v1/srs/review*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              cardId: 101,
              rating: 3,
              nextReviewAt: '2026-09-17T10:00:00'
            }
          })
        });
      });

      await page.route('**/api/v1/vocabulary/101', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              vocabId: 101,
              hanzi: '学',
              pinyin: 'xué',
              meaningHanViet: 'Học',
              meaningVi: 'Học tập, nghiên cứu',
              radicals: [
                { radicalId: 39, character: '子', meaningHanViet: 'Tử', hanziChar: '学' }
              ]
            }
          })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 5000 });

      // Card 1 (Vocab: '学') - flip card
      await page.locator('#flashcard').click();
      await page.waitForTimeout(200);

      // Verify constituent radicals row is visible and contains '子 (Tử)'
      const radicalsRow = page.locator('#cardBackRadicalsRow');
      await radicalsRow.waitFor({ state: 'visible', timeout: 5000 });
      const radicalsContent = await page.locator('#cardBackRadicalsContent').textContent();
      assert.ok(radicalsContent.includes('子 (Tử)'), `Expected radicals to contain '子 (Tử)', got: ${radicalsContent}`);

      // Advance to Card 2 (Radical: '一')
      await page.locator('#btnRatingGood').click();
      await page.waitForTimeout(300);

      // Card 2 - flip card
      await page.locator('#flashcard').click();
      await page.waitForTimeout(200);

      // Verify constituent radicals row is hidden for radicals
      const isRadicalsRowHidden = await radicalsRow.evaluate(el => el.classList.contains('d-none') || el.style.display === 'none');
      assert.strictEqual(isRadicalsRowHidden, true, 'Constituent radicals row must be hidden for radicals');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero unexpected runtime errors');
    } finally {
      await context.close();
    }
  });

});
