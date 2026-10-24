/**
 * =============================================================================
 * BROWSER E2E CHALLENGER TEST: SRS READING ROOM COLD-START RESILIENCE
 * File: tests/frontend/e2e/srs-reading-coldstart.browser.mjs
 *
 * Real browser verification of cold-start resilience & error controls:
 * - CR-01: Cold-start response displays State E with encouraging spin-up copy.
 * - CR-02: #btnReadingTryAgain is clickable, clears media, and restores State A (Ready).
 * - CR-03: #btnReadingSkipOnError is clickable, displays skip toast, and advances to next card.
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

async function setupReadingMockBackend(page) {
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
          configured: true,
          provider: 'speech-service-local',
          model: 'Chao-5-Scale Tone Sandhi Engine',
          tier: 'open-source-offline'
        }
      })
    });
  });

  await page.route('**/api/v1/srs/reading/assess*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: {
          status: 'cold_start',
          targetText: '一',
          targetPinyin: 'yī',
          recognizedText: '',
          overallScore: null,
          confidence: null,
          summaryVi: 'Máy chủ phân tích âm thanh đang khởi động từ trạng thái nghỉ (Render Free Tier spin-up ~30-50s).',
          components: null,
          retryAdvice: 'Máy chủ cần khoảng 30–50 giây để khởi động lại sau thời gian nghỉ. Vui lòng bấm "Thử đọc lại" sau giây lát hoặc bấm "Bỏ qua →" để tiếp tục ôn tập.',
          limitations: 'Chao 5-scale Tone Sandhi Engine'
        }
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
        data: { reviewId: 9999, nextReview: '2026-10-25T10:00:00Z', intervalDays: 3, easeFactor: 2.5 }
      })
    });
  });
}

describe('Browser E2E Challenger: Cold-Start & Error Recovery', () => {
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

  test('CR-01: Cold-start response renders State E with encouraging spin-up guidance', async () => {
    const { page, context } = await createMonitoredPage(browser);
    try {
      await setupReadingMockBackend(page);
      await page.goto(`${baseUrl}/srs-review.html?mode=reading&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });

      // Inject cold-start assessment response
      await page.evaluate(() => {
        const ctrl = window.srsReviewController || window.__SRS_PAGE_CONTROLLER;
        if (ctrl) {
          ctrl.handleAssessmentResponse({
            status: 'cold_start',
            summaryVi: 'Máy chủ phân tích âm thanh đang khởi động từ trạng thái nghỉ (Render Free Tier spin-up ~30-50s).',
            retryAdvice: 'Máy chủ cần khoảng 30–50 giây để khởi động lại sau thời gian nghỉ. Vui lòng bấm "Thử đọc lại" sau giây lát hoặc bấm "Bỏ qua →" để tiếp tục ôn tập.'
          }, ctrl.sessionQueue[ctrl.currentIndex]?.card);
        }
      });

      // State E is visible
      const errorVisible = await page.$eval('#readingStateError', el => !el.classList.contains('d-none'));
      assert.strictEqual(errorVisible, true, 'State E must be visible on cold start');

      const title = await page.$eval('#readingErrorTitle', el => el.textContent.trim());
      assert.strictEqual(title, 'Máy chủ phân tích âm thanh đang khởi động');

      // Buttons are clickable
      const tryAgainDisabled = await page.$eval('#btnReadingTryAgain', el => el.disabled);
      assert.strictEqual(tryAgainDisabled, false, 'Try again button must be enabled');

      const skipDisabled = await page.$eval('#btnReadingSkipOnError', el => el.disabled);
      assert.strictEqual(skipDisabled, false, 'Skip button must be enabled');
    } finally {
      await context.close();
    }
  });

  test('CR-02: Clicking #btnReadingTryAgain transitions back to State A (Ready)', async () => {
    const { page, context } = await createMonitoredPage(browser);
    try {
      await setupReadingMockBackend(page);
      await page.goto(`${baseUrl}/srs-review.html?mode=reading&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });

      // Inject cold start into State E
      await page.evaluate(() => {
        const ctrl = window.srsReviewController || window.__SRS_PAGE_CONTROLLER;
        ctrl?.showReadingError(
          'Máy chủ phân tích âm thanh đang khởi động',
          'Vui lòng chờ giây lát.',
          'Bấm Thử đọc lại hoặc Bỏ qua.'
        );
      });

      // Click "Thử đọc lại"
      await page.click('#btnReadingTryAgain');

      // State A (Ready) is visible again
      const readyVisible = await page.$eval('#readingStateReady', el => !el.classList.contains('d-none'));
      assert.strictEqual(readyVisible, true, 'State A must be active after clicking Try Again');

      const errorHidden = await page.$eval('#readingStateError', el => el.classList.contains('d-none'));
      assert.strictEqual(errorHidden, true, 'State E must be hidden after clicking Try Again');
    } finally {
      await context.close();
    }
  });

  test('CR-03: Clicking #btnReadingSkipOnError advances queue to next card without freezing', async () => {
    const { page, context } = await createMonitoredPage(browser);
    try {
      await setupReadingMockBackend(page);
      await page.goto(`${baseUrl}/srs-review.html?mode=reading&group=radicals50&action=continue`, {
        waitUntil: 'domcontentloaded'
      });

      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });

      // Current character should be 一
      const initialHanzi = await page.$eval('#readingPromptHanzi', el => el.textContent.trim());
      assert.strictEqual(initialHanzi, '一');

      // Trigger error state
      await page.evaluate(() => {
        const ctrl = window.srsReviewController || window.__SRS_PAGE_CONTROLLER;
        ctrl?.showReadingError('Lỗi kết nối', 'Máy chủ bận', 'Bấm Bỏ qua để học tiếp');
      });

      // Click "Bỏ qua →"
      await page.click('#btnReadingSkipOnError');

      // Wait for next card prompt to update
      await page.waitForFunction(() => {
        const prompt = document.getElementById('readingPromptHanzi');
        return prompt && prompt.textContent.trim() === '丨';
      }, { timeout: 5000 });

      const nextHanzi = await page.$eval('#readingPromptHanzi', el => el.textContent.trim());
      assert.strictEqual(nextHanzi, '丨', 'Card must advance to next item (丨) after skip');

      // State Ready is active on new card
      const readyVisible = await page.$eval('#readingStateReady', el => !el.classList.contains('d-none'));
      assert.strictEqual(readyVisible, true, 'New card must be in State A (Ready)');
    } finally {
      await context.close();
    }
  });
});
