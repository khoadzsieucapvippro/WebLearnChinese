/**
 * =============================================================================
 * CENTRAL E2E TEST CONTEXT & ENVIRONMENT MANAGER
 * File: tests/e2e/utils/e2e-test-context.mjs
 *
 * Provides isolated browser page context, mock backend routes, and assertion helpers.
 * Compatible with both live services and standalone static server test runs.
 * =============================================================================
 */

import { ensureServer } from '../../frontend/utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../../frontend/utils/browser-runner.mjs';
import { evaluateReadingSubmission } from './mock-speech-service.mjs';
import { generateSyntheticWav } from './audio-generator.mjs';

/**
 * Creates standardized mock SRS due cards for review tests.
 * @returns {Array<Object>}
 */
export function createTestDueCards() {
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
      strokeCount: 8,
      repetitions: 1,
      easeFactor: 2.50,
      intervalDays: 1,
      nextReviewAt: '2026-10-21T08:00:00',
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
      strokeCount: 4,
      repetitions: 0,
      easeFactor: 2.50,
      intervalDays: 0,
      nextReviewAt: null,
      isNew: true
    },
    {
      itemType: 'VOCABULARY',
      itemId: 103,
      hanzi: '不对',
      pinyin: 'bù duì',
      meaningHanViet: 'Bất Đối',
      meaningVi: 'Không đúng, sai rồi',
      exampleSentence: '这个答案不对。',
      exampleTranslation: 'Đáp án này không đúng.',
      strokeCount: 9,
      repetitions: 2,
      easeFactor: 2.60,
      intervalDays: 6,
      nextReviewAt: '2026-10-22T10:00:00',
      isNew: false
    },
    {
      itemType: 'VOCABULARY',
      itemId: 104,
      hanzi: '一个',
      pinyin: 'yī gè',
      meaningHanViet: 'Nhất Cá',
      meaningVi: 'Một cái, một người',
      exampleSentence: '我有一个苹果。',
      exampleTranslation: 'Tôi có một quả táo.',
      strokeCount: 4,
      repetitions: 3,
      easeFactor: 2.50,
      intervalDays: 12,
      nextReviewAt: '2026-10-25T14:00:00',
      isNew: false
    },
    {
      itemType: 'RADICAL',
      itemId: 69,
      character: '斤',
      pinyin: 'jīn',
      meaningHanViet: 'Cân',
      meaningVi: 'Cái rìu, cân lạng',
      explanationVi: 'Chiếc rìu đẽo gỗ có lưỡi cong sắc...',
      strokeCount: 4,
      repetitions: 0,
      easeFactor: 2.50,
      intervalDays: 0,
      nextReviewAt: null,
      isNew: true
    }
  ];
}

/**
 * Initializes an E2E test harness with static server, browser, and monitored context.
 *
 * @param {Object} [options]
 * @param {boolean} [options.authenticated=true]
 * @param {number} [options.port=3000]
 * @param {Array<Object>} [options.initialCards]
 * @returns {Promise<{
 *   server: Object,
 *   browser: Object,
 *   page: import('playwright-core').Page,
 *   context: import('playwright-core').BrowserContext,
 *   getRuntimeErrors: () => string[],
 *   submittedReviews: Array<Object>,
 *   assessmentRequests: Array<Object>,
 *   currentCards: Array<Object>,
 *   cleanup: () => Promise<void>
 * }>}
 */
export async function createE2ETestContext({
  authenticated = true,
  port = 3000,
  initialCards = createTestDueCards()
} = {}) {
  const server = await ensureServer({ port });
  const browser = await launchBrowser({ headless: true });
  const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
    viewportWidth: 1280,
    viewportHeight: 720
  });

  const submittedReviews = [];
  const assessmentRequests = [];
  let currentCards = [...initialCards];

  if (authenticated) {
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'test_e2e_jwt_token_learner');
      localStorage.setItem('user_info', JSON.stringify({
        accountId: 9001,
        emailOrPhone: 'e2e_tester@example.com',
        fullName: 'E2E Test User',
        roles: ['Learner']
      }));
    });
  }

  // Intercept backend API routes to guarantee deterministic testing across all tiers
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathName = url.pathname;
    const method = request.method();

    // 1. SRS Due Cards (both /srs/due and /srs/due-cards)
    if (pathName.includes('/api/v1/srs/due')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          message: 'Retrieved due cards',
          data: currentCards
        })
      });
    }

    // 2. SRS Review Submission
    if (pathName.includes('/api/v1/srs/review') && method === 'POST') {
      try {
        const body = request.postDataJSON ? request.postDataJSON() : JSON.parse(request.postData() || '{}');
        submittedReviews.push(body);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'Review saved successfully',
            data: {
              logId: 1000 + submittedReviews.length,
              itemId: body.itemId,
              itemType: body.itemType,
              rating: body.rating,
              newIntervalDays: body.rating === 1 ? 1 : 6,
              newEaseFactor: 2.50,
              reviewedAt: new Date().toISOString()
            }
          })
        });
      } catch (e) {
        return route.fulfill({ status: 400, body: JSON.stringify({ success: false, error: e.message }) });
      }
    }

    // 3. Speech Evaluation Status
    if (pathName.includes('/api/v1/srs/reading/status')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          message: 'OK',
          data: {
            configured: true,
            tier: 'free',
            provider: 'Local Speech Microservice',
            audioInputSupported: true
          }
        })
      });
    }

    // 4. Reading Assessment Evaluation
    if (pathName.includes('/api/v1/reading-assessment/evaluate') || pathName.includes('/api/v1/srs/reading/assess')) {
      assessmentRequests.push({ url: url.toString(), method });
      const sampleWav = generateSyntheticWav({ type: 'speech', durationSec: 1.0 });
      const assessmentResult = evaluateReadingSubmission({
        audioBuffer: sampleWav,
        targetText: '你好',
        expectedPinyin: 'nǐ hǎo',
        targetType: 'VOCABULARY',
        targetId: 101
      });

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          message: 'OK',
          data: assessmentResult
        })
      });
    }

    // 5. Notes routes
    if (pathName.includes('/notes')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          message: 'OK',
          data: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }
        })
      });
    }

    // 6. Radicals catalog routes
    if (pathName.includes('/radicals')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          message: 'OK',
          data: { items: [], page: 0, size: 214, totalElements: 0, totalPages: 0 }
        })
      });
    }

    // 7. Vocabulary catalog routes
    if (pathName.includes('/vocabulary')) {
      return route.fulfill({
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
            meaningVi: 'Học tập',
            radicals: []
          }
        })
      });
    }

    // Default safe response for any other /api/v1/** call
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: {}
      })
    });
  });

  const cleanup = async () => {
    try {
      await browser.close();
    } catch {
      // Ignore
    }
    if (server && !server.isExternal) {
      try {
        await server.close();
      } catch {
        // Ignore
      }
    }
  };

  return {
    server,
    browser,
    page,
    context,
    getRuntimeErrors: () => getRuntimeErrors().filter(e => !e.includes('favicon.ico')),
    submittedReviews,
    assessmentRequests,
    currentCards,
    cleanup
  };
}
