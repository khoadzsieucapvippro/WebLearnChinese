/**
 * =============================================================================
 * BROWSER E2E TEST: SRS LISTENING ROOM & PINYIN IME (TASK 9C.3 + LISTENING ROOM)
 * File: tests/frontend/e2e/srs-listening.browser.mjs
 *
 * Verifies:
 * - SL-01: Direct URL navigation with mode=listening displays dedicated Listening Room.
 * - SL-02: Flashcard, Writing, and Rating bars are strictly hidden (zero leakage).
 * - SL-03: Incorrect answer shows error notice, replays audio, keeps Next button locked.
 * - SL-04: Virtual Pinyin IME and physical typing commit characters without leakage.
 * - SL-05: Correct answer reveals "✓ Hoàn thành!", unlocks Next button, submits cardType: 'LISTENING'.
 * - SL-06: Mobile viewport (375px) renders cleanly without horizontal overflow.
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
      strokeCount: 1,
      commonRank: 1,
      audioUrl: null
    },
    {
      radicalId: 2,
      character: '丨',
      pinyin: 'gǔn',
      meaningHanViet: 'Cổn',
      meaningVi: 'Nét sổ',
      strokeCount: 1,
      commonRank: 2,
      audioUrl: null
    }
  ];

  for (let id = 3; id <= 50; id++) {
    radicals.push({
      radicalId: id,
      character: String.fromCodePoint(0x4E00 + id),
      pinyin: `py_${id}`,
      meaningHanViet: `HV_${id}`,
      meaningVi: `Nghĩa ${id}`,
      strokeCount: 2,
      commonRank: id,
      audioUrl: null
    });
  }

  return radicals;
}

async function setupListeningMockBackend(page, options = {}) {
  const reviewsSubmitted = [];

  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'test_listening_learner_jwt');
    localStorage.setItem('user_info', JSON.stringify({
      accountId: 2001,
      emailOrPhone: 'listening_learner@example.com',
      fullName: 'Học Viên Luyện Nghe',
      roles: ['Learner']
    }));
  });

  await page.route('**/api/v1/radicals*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: {
          items: createMockRadicals(),
          page: 0,
          size: 50,
          totalElements: 50,
          totalPages: 1
        }
      })
    });
  });

  await page.route('**/api/v1/radicals/*', async (route) => {
    const url = route.request().url();
    const match = url.match(/\/api\/v1\/radicals\/(\d+)/);
    const id = match ? parseInt(match[1], 10) : 1;
    const radicals = createMockRadicals();
    const found = radicals.find(r => r.radicalId === id) || radicals[0];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: found
      })
    });
  });

  await page.route('**/api/v1/srs/review*', async (route) => {
    const postData = route.request().postDataJSON();
    reviewsSubmitted.push(postData);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: {}
      })
    });
  });

  await page.route('**/api/v1/srs/due*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: []
      })
    });
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

  return { reviewsSubmitted };
}

describe('Browser E2E: SRS Listening Room & Pinyin IME', () => {
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
    if (serverHandle && serverHandle.close) await serverHandle.close();
  });

  test('SL-01: Direct navigation with mode=listening displays dedicated Listening Room and hides other rooms', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);
    try {
      await setupListeningMockBackend(page);

      await page.goto(`${baseUrl}/srs-review.html?mode=listening&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      // Verify active session is visible
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 5000 });

      // Verify Listening Room is visible
      const listeningRoom = page.locator('#srsListeningRoom');
      assert.strictEqual(await listeningRoom.isVisible(), true, 'Listening Room must be visible');

      // Verify Flashcard and Writing rooms are hidden
      const flashcardContainer = page.locator('#srsFlashcardContainer');
      const writingRoom = page.locator('#srsWritingRoom');
      const ratingBar = page.locator('#srsRatingSection');

      assert.strictEqual(await flashcardContainer.isVisible(), false, 'Flashcard container must be hidden');
      assert.strictEqual(await writingRoom.isVisible(), false, 'Writing Room must be hidden');
      assert.strictEqual(await ratingBar.isVisible(), false, 'Rating bar must be hidden in listening mode');

      // Verify Speaker Hero Button is present, unlocked, and interactive
      const heroAudioBtn = page.locator('#btnListeningPlayAudio');
      assert.strictEqual(await heroAudioBtn.isVisible(), true, 'Speaker hero button must be visible');
      assert.strictEqual(await heroAudioBtn.isDisabled(), false, 'Speaker button must not be disabled on load');
      const heroAudioClass = await heroAudioBtn.getAttribute('class');
      assert.strictEqual(heroAudioClass.includes('is-speaking'), false, 'Speaker button must not be stuck in speaking state');

      // Verify clicking speaker button works cleanly
      await heroAudioBtn.click();
      await page.waitForTimeout(100);

      // Verify input field is present and empty
      const answerInput = page.locator('#listeningAnswerInput');
      assert.strictEqual(await answerInput.isVisible(), true, 'Answer input must be visible');
      assert.strictEqual(await answerInput.inputValue(), '');

      // Verify Next button is hidden in State 1
      const nextBtn = page.locator('#btnListeningNext');
      const nextBtnClasses = await nextBtn.getAttribute('class');
      assert.ok(nextBtnClasses.includes('writing-next-hidden'), 'Next button must be hidden initially');

      // Verify Virtual Pinyin keyboard / candidate bar is mounted
      const imeContainer = page.locator('#listeningImeContainer');
      assert.strictEqual(await imeContainer.isVisible(), true, 'IME container must be visible');

      // Verify Virtual Pinyin Enter key styling is white secondary (btn-chinese-secondary)
      const enterKey = page.locator('.pinyin-key-submit');
      assert.strictEqual(await enterKey.isVisible(), true, 'Enter key must be visible');
      const enterKeyClass = await enterKey.getAttribute('class');
      assert.ok(enterKeyClass.includes('btn-chinese-secondary'), 'Enter key must use btn-chinese-secondary');
      assert.strictEqual(enterKeyClass.includes('btn-chinese-primary'), false, 'Enter key must not use btn-chinese-primary');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero runtime errors');
    } finally {
      await context.close();
    }
  });

  test('SL-02: Incorrect answer shows error notice, allows re-editing, and keeps Next button locked', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);
    try {
      const { reviewsSubmitted } = await setupListeningMockBackend(page);

      await page.goto(`${baseUrl}/srs-review.html?mode=listening&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      await page.locator('#srsListeningRoom').waitFor({ state: 'visible', timeout: 5000 });

      // Fill wrong answer
      const answerInput = page.locator('#listeningAnswerInput');
      await answerInput.fill('错');

      // Click "Kiểm tra"
      await page.locator('#btnListeningCheck').click();
      await page.waitForTimeout(200);

      // Verify error notice is displayed
      const errorNotice = page.locator('#listeningErrorNotice');
      assert.strictEqual(await errorNotice.isVisible(), true, 'Error notice must be visible');
      const errorText = await errorNotice.textContent();
      assert.ok(errorText.includes('Chưa chính xác'), 'Error notice must guide the user');

      // Verify input has is-invalid class and is still editable
      const inputClass = await answerInput.getAttribute('class');
      assert.ok(inputClass.includes('is-invalid'), 'Input must have is-invalid styling');
      assert.strictEqual(await answerInput.isDisabled(), false, 'Input must remain enabled for correction');

      // Verify Next button remains hidden
      const nextBtn = page.locator('#btnListeningNext');
      const nextBtnClasses = await nextBtn.getAttribute('class');
      assert.ok(nextBtnClasses.includes('writing-next-hidden'), 'Next button must remain locked');

      // Verify ZERO SRS reviews submitted to backend
      assert.strictEqual(reviewsSubmitted.length, 0, 'No review should be submitted on incorrect answer');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero runtime errors');
    } finally {
      await context.close();
    }
  });

  test('SL-03: Virtual Pinyin IME and candidates typing support', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);
    try {
      await setupListeningMockBackend(page);

      await page.goto(`${baseUrl}/srs-review.html?mode=listening&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      await page.locator('#srsListeningRoom').waitFor({ state: 'visible', timeout: 5000 });

      const answerInput = page.locator('#listeningAnswerInput');
      await answerInput.click();

      // Type "yi" via physical keyboard
      await page.keyboard.type('yi');
      await page.waitForTimeout(100);

      // Verify candidate bar displays candidates
      const candidateList = page.locator('#pinyinCandidatesList');
      assert.strictEqual(await candidateList.isVisible(), true, 'Candidate list must appear');

      // Verify candidate item "一" exists
      const firstCandidate = page.locator('.pinyin-candidate-item').first();
      const candText = await firstCandidate.textContent();
      assert.ok(candText.includes('一'), 'First candidate for yi must be 一');

      // Press '1' to commit candidate
      await page.keyboard.press('Digit1');
      await page.waitForTimeout(100);

      // Verify input received committed Hanzi
      assert.strictEqual(await answerInput.inputValue(), '一', 'Input must contain 一');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero runtime errors');
    } finally {
      await context.close();
    }
  });

  test('SL-04: Correct answer reveals completion, unlocks Next button, and submits SRS review', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);
    try {
      const { reviewsSubmitted } = await setupListeningMockBackend(page);

      await page.goto(`${baseUrl}/srs-review.html?mode=listening&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      await page.locator('#srsListeningRoom').waitFor({ state: 'visible', timeout: 5000 });

      // Enter correct answer '一' directly
      const answerInput = page.locator('#listeningAnswerInput');
      await answerInput.fill('一');

      // Click "Kiểm tra"
      await page.locator('#btnListeningCheck').click();
      await page.waitForTimeout(200);

      // Verify completion notice is visible
      const completionNotice = page.locator('#listeningCompletionNotice');
      assert.strictEqual(await completionNotice.isVisible(), true, 'Completion notice must be visible');
      assert.ok((await completionNotice.textContent()).includes('Hoàn thành'), 'Completion notice must show Hoàn thành');

      // Verify input is disabled and marked valid
      assert.strictEqual(await answerInput.isDisabled(), true, 'Input must be locked upon completion');
      const inputClass = await answerInput.getAttribute('class');
      assert.ok(inputClass.includes('is-valid'), 'Input must have is-valid styling');

      // Verify check button is locked
      const checkBtn = page.locator('#btnListeningCheck');
      assert.strictEqual(await checkBtn.isDisabled(), true, 'Check button must be disabled upon completion');

      // Verify Next button is unlocked
      const nextBtn = page.locator('#btnListeningNext');
      const nextClasses = await nextBtn.getAttribute('class');
      assert.ok(!nextClasses.includes('writing-next-hidden'), 'Next button must be unlocked');

      // Click Next button to advance
      await nextBtn.click();
      await page.waitForTimeout(400);

      // Verify review payload was submitted with cardType: 'LISTENING' and rating: 3
      assert.strictEqual(reviewsSubmitted.length, 1, 'Exactly one SRS review should be submitted');
      assert.strictEqual(reviewsSubmitted[0].cardType, 'LISTENING', 'cardType must be LISTENING');
      assert.strictEqual(reviewsSubmitted[0].rating, 3, 'rating must be 3 (Good)');
      assert.strictEqual(reviewsSubmitted[0].itemId, 1, 'itemId must match card 1');

      // Verify advance to Card 2
      const progressText = await page.locator('#srsProgressText').textContent();
      assert.ok(progressText.includes('Thẻ 2'), 'Must advance to card 2');

      // Verify separate localStorage progress key updated
      const storedProgress = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('HOC_HAN_NGU_LISTENING_PROGRESS') || '{}');
      });
      assert.strictEqual(storedProgress.radicals50?.lastIndex, 1, 'Progress must be saved under HOC_HAN_NGU_LISTENING_PROGRESS');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero runtime errors: ' + JSON.stringify(getRuntimeErrors().map(e => String(e?.message || e))));
    } finally {
      await context.close();
    }
  });

  test('SL-05: Mobile viewport (375px) renders cleanly without horizontal overflow', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 375,
      viewportHeight: 667
    });
    try {
      await setupListeningMockBackend(page);

      await page.goto(`${baseUrl}/srs-review.html?mode=listening&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      await page.locator('#srsListeningRoom').waitFor({ state: 'visible', timeout: 5000 });

      // Check overflow-x
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      assert.strictEqual(hasHorizontalScroll, false, 'Mobile viewport must NOT have horizontal overflow');

      // Check input width fits within viewport
      const inputWidth = await page.locator('#listeningAnswerInput').evaluate(el => el.getBoundingClientRect().width);
      assert.ok(inputWidth <= 375, 'Input field must fit inside 375px viewport');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero runtime errors');
    } finally {
      await context.close();
    }
  });

  test('SL-06: Real static audio asset playback (HTTP 200, valid MIME audio/wav, playing event, currentTime > 0)', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);
    try {
      await setupListeningMockBackend(page);

      // Override radicals route so card #1 has a real static WAV audio asset
      const radicalsWithRealAudio = createMockRadicals();
      radicalsWithRealAudio[0].audioUrl = '/assets/audio/fixtures/diagnostic-tone.wav';

      await page.route('**/api/v1/radicals*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              items: radicalsWithRealAudio,
              page: 0,
              size: 50,
              totalElements: 50,
              totalPages: 1
            }
          })
        });
      });

      // Wrap native window.Audio to observe real HTMLAudioElement lifecycle without mocking decoding
      await page.addInitScript(() => {
        window.__audioProbe = {
          playingFired: false,
          endedFired: false,
          maxCurrentTime: 0,
          errorFired: null
        };
        const NativeAudio = window.Audio;
        window.Audio = function(src) {
          const el = new NativeAudio(src);
          el.addEventListener('playing', () => {
            window.__audioProbe.playingFired = true;
          });
          el.addEventListener('timeupdate', () => {
            if (el.currentTime > window.__audioProbe.maxCurrentTime) {
              window.__audioProbe.maxCurrentTime = el.currentTime;
            }
          });
          el.addEventListener('ended', () => {
            if (el.currentTime > window.__audioProbe.maxCurrentTime) {
              window.__audioProbe.maxCurrentTime = el.currentTime;
            }
            window.__audioProbe.endedFired = true;
          });
          el.addEventListener('error', (err) => {
            window.__audioProbe.errorFired = err?.message || 'MediaError';
          });
          return el;
        };
      });

      let audioHttpStatus = null;
      let audioContentType = null;
      page.on('response', (res) => {
        if (res.url().includes('/assets/audio/fixtures/diagnostic-tone.wav')) {
          audioHttpStatus = res.status();
          audioContentType = res.headers()['content-type'] || '';
        }
      });

      await page.goto(`${baseUrl}/srs-review.html?mode=listening&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      await page.locator('#srsListeningRoom').waitFor({ state: 'visible', timeout: 5000 });

      const heroAudioBtn = page.locator('#btnListeningPlayAudio');
      await heroAudioBtn.click();

      // Wait for the 0.35s WAV file to play and finish in real browser engine
      await page.waitForFunction(() => window.__audioProbe && window.__audioProbe.endedFired === true, { timeout: 4000 });

      const probe = await page.evaluate(() => window.__audioProbe);
      assert.strictEqual(audioHttpStatus, 200, 'Static audio file request must return HTTP 200');
      assert.ok(audioContentType.includes('audio/wav'), `Expected audio/wav Content-Type, got "${audioContentType}"`);
      assert.strictEqual(probe.errorFired, null, 'HTMLAudioElement must decode WAV without MediaError');
      assert.strictEqual(probe.playingFired, true, 'HTMLAudioElement must fire "playing" event');
      assert.ok(probe.maxCurrentTime > 0, `Expected currentTime > 0 during real playback, got ${probe.maxCurrentTime}`);
      assert.strictEqual(await heroAudioBtn.isDisabled(), false, 'Speaker button must unlock after playback completes');
      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero runtime errors during real audio playback');
    } finally {
      await context.close();
    }
  });

});
