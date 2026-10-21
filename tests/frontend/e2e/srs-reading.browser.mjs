/**
 * =============================================================================
 * BROWSER E2E TEST: SRS READING ROOM & GEMINI PRONUNCIATION ASSESSMENT
 * File: tests/frontend/e2e/srs-reading.browser.mjs
 *
 * Verifies on real browser (Microsoft Edge):
 * - SR-01: Direct URL navigation with mode=reading displays dedicated Reading Room.
 * - SR-02: Flashcard, Writing, Listening, and Rating bars are strictly hidden.
 * - SR-03: Quick switcher marks "Đọc" button active.
 * - SR-04: State A (Ready) displays prominent target Hanzi and "Bắt đầu đọc" button.
 * - SR-05: Pinyin preview toggle reveals/hides phonetic and meaning info.
 * - SR-06: Mock assessment SCORED response displays State D breakdown and unlocks Next button.
 * - SR-07: Mock assessment UNCONFIGURED response displays State E guidance without fake scores.
 * - SR-08: Mobile viewport (375px) renders cleanly without horizontal overflow.
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

async function setupReadingMockBackend(page, options = {}) {
  const reviewsSubmitted = [];
  const assessRequests = [];

  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'test_reading_learner_jwt');
    localStorage.setItem('user_info', JSON.stringify({
      accountId: 3001,
      emailOrPhone: 'reading_learner@example.com',
      fullName: 'Học Viên Luyện Đọc',
      roles: ['Learner']
    }));
  });

  await page.route('**/api/v1/radicals*', async (route) => {
    const url = route.request().url();
    if (/\/api\/v1\/radicals\/\d+/.test(url)) {
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
      return;
    }

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

  await page.route('**/api/v1/srs/study-stats*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: {
          totalCards: 50,
          dueCards: 0,
          learnedCards: 0,
          retentionRate: 100
        }
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

  await page.route('**/api/v1/srs/reading/status*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: {
          configured: options.configured ?? true,
          model: 'gemini-3.8-flash',
          freeTier: true
        }
      })
    });
  });

  await page.route('**/api/v1/srs/reading/assess*', async (route) => {
    assessRequests.push(route.request());
    if (options.unconfigured) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          message: 'OK',
          data: {
            status: 'UNCONFIGURED',
            targetText: '一',
            targetPinyin: 'yī',
            recognizedText: '',
            overallScore: null,
            confidence: null,
            summaryVi: 'Tính năng Luyện đọc AI sử dụng Google Gemini (Gói miễn phí) nhưng máy chủ chưa cấu hình GEMINI_API_KEY.',
            components: null,
            retryAdvice: 'Quản trị viên cần đặt biến môi trường GEMINI_API_KEY trước khi khởi động backend.',
            limitations: 'Gemini API Free Tier'
          }
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
          status: 'SCORED',
          targetText: '一',
          targetPinyin: 'yī',
          recognizedText: '一',
          overallScore: 92,
          confidence: 'HIGH',
          summaryVi: 'Phát âm rất rõ ràng, thanh điệu ngang chuẩn xác.',
          components: {
            initials: 'Âm mở đầu y- mượt mà.',
            finals: 'Vận mẫu -ī ngân đủ dài.',
            tones: 'Thanh 1 (bình) cao và bằng phẳng chuẩn.'
          },
          retryAdvice: 'Hãy duy trì độ rõ này ở các thẻ tiếp theo.',
          limitations: 'Ước lượng từ Gemini API (Gói miễn phí)'
        }
      })
    });
  });

  await page.route('**/api/v1/srs/review*', async (route) => {
    try {
      const payload = JSON.parse(route.request().postData() || '{}');
      reviewsSubmitted.push(payload);
    } catch (e) {}
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: { reviewId: 9999, nextReview: '2026-10-25T10:00:00Z', intervalDays: 3, easeFactor: 2.5 }
      })
    });
  });

  return { reviewsSubmitted, assessRequests };
}

describe('Browser E2E: SRS Reading Room & AI Assessment', () => {
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

  test('SR-01: Direct URL navigation with mode=reading activates dedicated Reading Room', async () => {
    const { page, context } = await createMonitoredPage(browser);
    try {
      await setupReadingMockBackend(page);
      await page.goto(`${baseUrl}/srs-review.html?mode=reading&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });

      // Assert reading room is visible
      const readingRoom = page.locator('#srsReadingRoom');
      assert.strictEqual(await readingRoom.isVisible(), true, 'Reading Room must be visible');
    } finally {
      await context.close();
    }
  });

  test('SR-02: Flashcard, Writing, Listening, and Rating bars are strictly hidden (zero leakage)', async () => {
    const { page, context } = await createMonitoredPage(browser);
    try {
      await setupReadingMockBackend(page);
      await page.goto(`${baseUrl}/srs-review.html?mode=reading&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });

      const flashcardHidden = await page.$eval('#srsFlashcardContainer', el => el.classList.contains('d-none'));
      assert.strictEqual(flashcardHidden, true, 'Flashcard container must be hidden');

      const writingHidden = await page.$eval('#srsWritingRoom', el => el.classList.contains('d-none'));
      assert.strictEqual(writingHidden, true, 'Writing room must be hidden');

      const listeningHidden = await page.$eval('#srsListeningRoom', el => el.classList.contains('d-none'));
      assert.strictEqual(listeningHidden, true, 'Listening room must be hidden');

      const ratingHidden = await page.$eval('#srsRatingSection', el => el.classList.contains('d-none'));
      assert.strictEqual(ratingHidden, true, 'Rating section must be hidden');
    } finally {
      await context.close();
    }
  });

  test('SR-03: Quick skill switcher highlights Đọc button as active', async () => {
    const { page, context } = await createMonitoredPage(browser);
    try {
      await setupReadingMockBackend(page);
      await page.goto(`${baseUrl}/srs-review.html?mode=reading&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });

      const isReadingBtnActive = await page.$eval('#quickSkillReading', el => el.classList.contains('active'));
      assert.strictEqual(isReadingBtnActive, true, 'Quick skill reading button must be active');

      const isFlashcardActive = await page.$eval('#quickSkillFlashcard', el => el.classList.contains('active'));
      assert.strictEqual(isFlashcardActive, false, 'Quick skill flashcard button must not be active');
    } finally {
      await context.close();
    }
  });

  test('SR-04: State A (Ready) displays target Hanzi and Start Recording button with Pinyin hidden', async () => {
    const { page, context } = await createMonitoredPage(browser);
    try {
      await setupReadingMockBackend(page);
      await page.goto(`${baseUrl}/srs-review.html?mode=reading&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });

      // Target Hanzi is displayed
      const targetText = await page.$eval('#readingPromptHanzi', el => el.textContent.trim());
      assert.strictEqual(targetText, '一');

      // State Ready is visible
      const readyVisible = await page.$eval('#readingStateReady', el => !el.classList.contains('d-none'));
      assert.strictEqual(readyVisible, true);

      // Pinyin box is hidden by default in State A
      const pinyinHidden = await page.$eval('#readingPinyinMeaningBox', el => el.classList.contains('d-none'));
      assert.strictEqual(pinyinHidden, true);

      // Next button is initially hidden
      const nextHidden = await page.$eval('#btnReadingNext', el => el.classList.contains('writing-next-hidden'));
      assert.strictEqual(nextHidden, true);
    } finally {
      await context.close();
    }
  });

  test('SR-05: Pinyin preview toggle reveals/hides phonetic and meaning info', async () => {
    const { page, context } = await createMonitoredPage(browser);
    try {
      await setupReadingMockBackend(page);
      await page.goto(`${baseUrl}/srs-review.html?mode=reading&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });

      // Click to toggle
      await page.click('#btnReadingTogglePinyin');

      const pinyinVisible = await page.$eval('#readingPinyinMeaningBox', el => !el.classList.contains('d-none'));
      assert.strictEqual(pinyinVisible, true);

      const pinyinText = await page.$eval('#readingPromptPinyin', el => el.textContent.trim());
      assert.strictEqual(pinyinText, 'yī');
    } finally {
      await context.close();
    }
  });

  test('SR-06: State D renders assessment score and unlocks Next button', async () => {
    const { page, context } = await createMonitoredPage(browser);
    try {
      await setupReadingMockBackend(page);
      await page.goto(`${baseUrl}/srs-review.html?mode=reading&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });

      // Inject assessment response directly into controller to test State D UI
      await page.evaluate(() => {
        const ctrl = window.srsReviewController || window.__SRS_PAGE_CONTROLLER;
        if (ctrl) {
          ctrl.handleAssessmentResponse({
            status: 'SCORED',
            overallScore: 92,
            confidence: 'HIGH',
            recognizedText: '一',
            summaryVi: 'Phát âm rất rõ ràng, thanh điệu ngang chuẩn xác.',
            components: {
              initials: 'Âm mở đầu y- mượt mà.',
              finals: 'Vận mẫu -ī ngân đủ dài.',
              tones: 'Thanh 1 (bình) cao và bằng phẳng chuẩn.'
            },
            retryAdvice: 'Hãy duy trì độ rõ này ở các thẻ tiếp theo.'
          }, ctrl.sessionQueue[ctrl.currentIndex]?.card);
        }
      });

      // State D is visible
      const resultVisible = await page.$eval('#readingStateResult', el => !el.classList.contains('d-none'));
      assert.strictEqual(resultVisible, true);

      const scoreText = await page.$eval('#readingOverallScoreBadge', el => el.textContent.trim());
      assert.strictEqual(scoreText, '92 / 100');

      const nextUnlocked = await page.$eval('#btnReadingNext', el => !el.classList.contains('writing-next-hidden'));
      assert.strictEqual(nextUnlocked, true);
    } finally {
      await context.close();
    }
  });

  test('SR-07: State E renders unconfigured guidance without generating fake score', async () => {
    const { page, context } = await createMonitoredPage(browser);
    try {
      await setupReadingMockBackend(page);
      await page.goto(`${baseUrl}/srs-review.html?mode=reading&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });

      // Inject unconfigured assessment response
      await page.evaluate(() => {
        const ctrl = window.srsReviewController || window.__SRS_PAGE_CONTROLLER;
        if (ctrl) {
          ctrl.handleAssessmentResponse({
            status: 'UNCONFIGURED',
            summaryVi: 'Tính năng Luyện đọc AI sử dụng Google Gemini (Gói miễn phí) nhưng máy chủ chưa cấu hình GEMINI_API_KEY.',
            retryAdvice: 'Quản trị viên cần đặt biến môi trường GEMINI_API_KEY trước khi khởi động backend.'
          }, ctrl.sessionQueue[ctrl.currentIndex]?.card);
        }
      });

      // State E is visible
      const errorVisible = await page.$eval('#readingStateError', el => !el.classList.contains('d-none'));
      assert.strictEqual(errorVisible, true);

      const errorTitle = await page.$eval('#readingErrorTitle', el => el.textContent.trim());
      assert.strictEqual(errorTitle, 'Chưa cấu hình Gemini AI API');

      // Next button remains locked
      const nextLocked = await page.$eval('#btnReadingNext', el => el.classList.contains('writing-next-hidden'));
      assert.strictEqual(nextLocked, true);
    } finally {
      await context.close();
    }
  });

  test('SR-08: Mobile viewport (375px) renders cleanly without horizontal overflow', async () => {
    const { page, context } = await createMonitoredPage(browser, { viewportWidth: 375, viewportHeight: 667 });
    try {
      await setupReadingMockBackend(page);
      await page.goto(`${baseUrl}/srs-review.html?mode=reading&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      assert.ok(scrollWidth <= clientWidth + 1, `Horizontal scroll detected: ${scrollWidth} > ${clientWidth}`);
    } finally {
      await context.close();
    }
  });
});
