/**
 * =============================================================================
 * EMPIRICAL ADVERSARIAL CHALLENGER: VIEWPORT & CROSS-FEATURE (MILESTONE 1)
 * File: tests/frontend/e2e/challenger-m1-writing-viewport.browser.mjs
 *
 * Adversarially verifies:
 * 1. Mobile viewport constraint (375px width & 320px reflow boundary):
 *    - Zero horizontal scrollbar on 375px mobile viewport when rendering lesson
 *      vocabulary list with the new ✍️ button.
 *    - Adversarial stress tests with long Chinese phrases, multi-radical badges,
 *      lengthy definitions, and complex example sentences.
 *    - Radical chapter rendering (renderRadicalsList) on 375px mobile viewport.
 * 2. Button Interaction Isolation:
 *    - Clicking .lesson-vocab-writing-btn opens #vocabWritingModal cleanly.
 *    - Writing button click does NOT trigger speech synthesis or audio playback.
 *    - Writing button click does NOT trigger personal notes modal (#notesModal).
 *    - Closing writing modal does NOT trigger speech or notes.
 *    - Clicking speech button does NOT open writing modal or notes modal.
 *    - Clicking notes button does NOT open writing modal or trigger speech.
 * 3. Cross-Feature Lesson Navigation & Study Rooms (Overview, Practice, Quiz):
 *    - Quick Launch 4-room buttons (Flashcard, Writing, Listening, Reading).
 *    - Primary study launch & back-to-review buttons.
 *    - Practice mode navigation (?lessonId=1&mode=practice) on srs-review.html.
 *    - Zero console errors or uncaught runtime exceptions throughout.
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

function createAdversarialLessonDetail(lessonId = 1) {
  return {
    lessonId: Number(lessonId),
    title: 'Bài 1: Từ Vựng Chào Hỏi & Cấu Trúc Ngữ Pháp Phức Hợp',
    status: 'Approved',
    vocabularyCount: 4,
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-02T10:30:00Z',
    vocabularies: [
      {
        vocabId: 101,
        hanzi: '你',
        pinyin: 'nǐ',
        pinyinRaw: 'ni3',
        meaningHanViet: 'Nhĩ',
        meaningVi: 'Bạn, anh, chị (đại từ ngôi thứ 2 thông dụng trong giao tiếp)',
        audioUrl: 'https://cdn.example.com/audio/ni.mp3',
        videoWritingUrl: null,
        exampleSentence: '你好！很高兴认识你。',
        exampleTranslation: 'Xin chào! Rất vui được làm quen với bạn.',
        orderIndex: 1,
        radicals: [
          { radicalId: 9, character: '人', pinyin: 'rén', meaningHanViet: 'Nhân', meaningVi: 'Người', hanziChar: '亻' }
        ]
      },
      {
        vocabId: 102,
        hanzi: '迫不及待',
        pinyin: 'pò bù jí dài',
        pinyinRaw: 'po4 bu4 ji2 dai4',
        meaningHanViet: 'Bách Bất Cập Đãi',
        meaningVi: 'Nôn nóng, sốt ruột, không thể chờ đợi thêm được nữa (thành ngữ)',
        audioUrl: null,
        videoWritingUrl: null,
        exampleSentence: '他迫不及待地打开了生日礼物盒子。',
        exampleTranslation: 'Anh ấy nôn nóng mở chiếc hộp quà sinh nhật ra.',
        orderIndex: 2,
        radicals: [
          { radicalId: 162, character: '辵', pinyin: 'chuò', meaningHanViet: 'Sước', meaningVi: 'Bước đi dài', hanziChar: '辶' },
          { radicalId: 1, character: '一', pinyin: 'yī', meaningHanViet: 'Nhất', meaningVi: 'Số một', hanziChar: '一' },
          { radicalId: 29, character: '又', pinyin: 'yòu', meaningHanViet: 'Hựu', meaningVi: 'Lại, thêm nữa', hanziChar: '又' },
          { radicalId: 60, character: '彳', pinyin: 'chì', meaningHanViet: 'Xích', meaningVi: 'Bước chân trái', hanziChar: '彳' }
        ]
      },
      {
        vocabId: 103,
        hanzi: '自由自在',
        pinyin: 'zì yóu zì zài',
        pinyinRaw: 'zi4 you2 zi4 zai4',
        meaningHanViet: 'Tự Do Tự Tại',
        meaningVi: 'Tự do tự tại, thanh thản ung dung, không bị bất kỳ ràng buộc nào',
        audioUrl: null,
        videoWritingUrl: null,
        exampleSentence: '小鸟在蔚蓝的天空中自由自在地飞翔。',
        exampleTranslation: 'Chú chim nhỏ bay lượn tự do tự tại giữa bầu trời xanh biếc.',
        orderIndex: 3,
        radicals: [
          { radicalId: 132, character: '自', pinyin: 'zì', meaningHanViet: 'Tự', meaningVi: 'Bản thân mình', hanziChar: '自' },
          { radicalId: 102, character: '田', pinyin: 'tián', meaningHanViet: 'Điền', meaningVi: 'Ruộng đồng', hanziChar: '由' },
          { radicalId: 32, character: '土', pinyin: 'tǔ', meaningHanViet: 'Thổ', meaningVi: 'Đất cát', hanziChar: '在' }
        ]
      },
      {
        vocabId: 104,
        hanzi: '谢谢',
        pinyin: 'xièxie',
        pinyinRaw: 'xie4xie',
        meaningHanViet: 'Tạ Tạ',
        meaningVi: 'Cảm ơn, cảm tạ sự giúp đỡ nhiệt tình',
        audioUrl: 'https://cdn.example.com/audio/xiexie.mp3',
        videoWritingUrl: null,
        exampleSentence: '谢谢你的热情帮助！',
        exampleTranslation: 'Cảm ơn sự giúp đỡ nhiệt tình của bạn!',
        orderIndex: 4,
        radicals: [
          { radicalId: 149, character: '言', pinyin: 'yán', meaningHanViet: 'Ngôn', meaningVi: 'Lời nói', hanziChar: '讠' },
          { radicalId: 158, character: '身', pinyin: 'shēn', meaningHanViet: 'Thân', meaningVi: 'Thân thể', hanziChar: '身' },
          { radicalId: 41, character: '寸', pinyin: 'cùn', meaningHanViet: 'Thốn', meaningVi: 'Tấc, đơn vị đo', hanziChar: '寸' }
        ]
      }
    ]
  };
}

describe('Challenger M1: Viewport & Cross-Feature Adversarial Harness', () => {
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

  // =========================================================================
  // CHALLENGE 1: Mobile Viewport (375px & 320px) Zero Horizontal Overflow
  // =========================================================================

  test('CH-M1-01: 375px mobile viewport has zero horizontal scrollbar with vocab actions (3 buttons)', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 375,
      viewportHeight: 667
    });

    try {
      await page.route('**/api/v1/lessons/1**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            data: createAdversarialLessonDetail(1)
          })
        });
      });

      await page.goto(`${baseUrl}/lesson-detail.html?id=1`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#lessonVocabList .lesson-vocab-item');

      // 1. Verify global page horizontal scrollbar
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      assert.strictEqual(
        scrollWidth <= clientWidth,
        true,
        `Page horizontal overflow on 375px viewport: scrollWidth (${scrollWidth}) > clientWidth (${clientWidth})`
      );

      // 2. Verify all vocabulary list items contain all 3 buttons
      const items = page.locator('#lessonVocabList .lesson-vocab-item');
      const itemCount = await items.count();
      assert.strictEqual(itemCount, 4, 'Must render all 4 adversarial vocabulary items');

      for (let i = 0; i < itemCount; i++) {
        const item = items.nth(i);
        const speechBtn = item.locator('.btn-vocab-speech');
        const writingBtn = item.locator('.lesson-vocab-writing-btn');
        const noteBtn = item.locator('.lesson-vocab-note-btn');

        assert.ok(await speechBtn.isVisible(), `Item ${i} speech button must be visible`);
        assert.ok(await writingBtn.isVisible(), `Item ${i} writing button must be visible`);
        assert.ok(await noteBtn.isVisible(), `Item ${i} note button must be visible`);
      }

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('CH-M1-02: 320px reflow boundary has zero horizontal scrollbar on lesson detail', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 320,
      viewportHeight: 568
    });

    try {
      await page.route('**/api/v1/lessons/1**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            data: createAdversarialLessonDetail(1)
          })
        });
      });

      await page.goto(`${baseUrl}/lesson-detail.html?id=1`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#lessonVocabList .lesson-vocab-item');

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      assert.strictEqual(
        scrollWidth <= clientWidth,
        true,
        `Reflow horizontal overflow on 320px viewport: scrollWidth (${scrollWidth}) > clientWidth (${clientWidth})`
      );

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('CH-M1-03: 375px mobile viewport has zero horizontal scroll on radicals chapter list', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 375,
      viewportHeight: 667
    });

    try {
      await page.route('**/api/v1/radicals**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            data: {
              items: [],
              totalElements: 0
            }
          })
        });
      });

      await page.goto(`${baseUrl}/lesson-detail.html?group=radicals50&chapter=0`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#lessonVocabList .lesson-vocab-item');

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      assert.strictEqual(
        scrollWidth <= clientWidth,
        true,
        `Radicals chapter overflow on 375px viewport: scrollWidth (${scrollWidth}) > clientWidth (${clientWidth})`
      );

      // Verify radical item has speech and writing buttons
      const firstItem = page.locator('#lessonVocabList .lesson-vocab-item').first();
      assert.ok(await firstItem.locator('.btn-vocab-speech').isVisible(), 'Radical speech button visible');
      assert.ok(await firstItem.locator('.lesson-vocab-writing-btn').isVisible(), 'Radical writing button visible');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // =========================================================================
  // CHALLENGE 2: Button Interaction Isolation & Event Independence
  // =========================================================================

  test('CH-M1-04: Clicking writing button does NOT trigger speech or open notes modal', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/lessons/1**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            data: createAdversarialLessonDetail(1)
          })
        });
      });

      await page.goto(`${baseUrl}/lesson-detail.html?id=1`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#lessonVocabList .lesson-vocab-item');

      // Track speech synthesis and notes modal triggers via in-page spies
      await page.evaluate(() => {
        window.__speechCalled = false;
        window.__notesModalOpened = false;

        if (window.speechSynthesis) {
          const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
          window.speechSynthesis.speak = function (utterance) {
            window.__speechCalled = true;
            return originalSpeak(utterance);
          };
        }

        const observer = new MutationObserver(() => {
          const notesModal = document.getElementById('notesModal');
          if (notesModal && (notesModal.open || notesModal.classList.contains('show') || notesModal.style.display !== 'none')) {
            window.__notesModalOpened = true;
          }
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      });

      // Target writing button on first vocabulary item
      const firstItem = page.locator('#lessonVocabList .lesson-vocab-item').nth(0);
      const writingBtn = firstItem.locator('.lesson-vocab-writing-btn');
      await writingBtn.click();

      // Writing modal must be visible
      const writingModal = page.locator('#vocabWritingModal');
      await writingModal.waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await writingModal.isVisible(), '#vocabWritingModal must be open');

      // Verify speech and notes modal were NOT triggered
      const speechCalled = await page.evaluate(() => window.__speechCalled);
      const notesOpened = await page.evaluate(() => window.__notesModalOpened);
      assert.strictEqual(speechCalled, false, 'Adversarial check: Writing modal click MUST NOT trigger speech synthesis');
      assert.strictEqual(notesOpened, false, 'Adversarial check: Writing modal click MUST NOT trigger notes modal');

      // Close writing modal
      const closeBtn = writingModal.locator('.btn-close');
      await closeBtn.click();
      await writingModal.waitFor({ state: 'hidden', timeout: 3000 });

      // After closing, speech and notes must STILL be uncalled
      const speechCalledAfterClose = await page.evaluate(() => window.__speechCalled);
      const notesOpenedAfterClose = await page.evaluate(() => window.__notesModalOpened);
      assert.strictEqual(speechCalledAfterClose, false, 'Closing writing modal MUST NOT trigger speech');
      assert.strictEqual(notesOpenedAfterClose, false, 'Closing writing modal MUST NOT trigger notes modal');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('CH-M1-05: Clicking speech button does NOT trigger writing modal or notes modal', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/lessons/1**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            data: createAdversarialLessonDetail(1)
          })
        });
      });

      await page.goto(`${baseUrl}/lesson-detail.html?id=1`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#lessonVocabList .lesson-vocab-item');

      // Click speech button on first item
      const firstItem = page.locator('#lessonVocabList .lesson-vocab-item').nth(0);
      const speechBtn = firstItem.locator('.btn-vocab-speech');
      await speechBtn.click();

      // Wait a moment for any side-effects
      await page.waitForTimeout(400);

      // Verify writing modal dialog did NOT open
      const writingModal = page.locator('#vocabWritingModal');
      const writingModalCount = await writingModal.count();
      if (writingModalCount > 0) {
        assert.strictEqual(await writingModal.isVisible(), false, 'Writing modal must remain hidden on speech click');
      }

      // Verify notes modal did NOT open
      const notesModal = page.locator('#notesModal');
      const notesModalCount = await notesModal.count();
      if (notesModalCount > 0) {
        assert.strictEqual(await notesModal.isVisible(), false, 'Notes modal must remain hidden on speech click');
      }

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('CH-M1-06: Clicking notes button opens notes modal and does NOT open writing modal or trigger speech', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      // Authenticate session so NotesModalController permits opening
      await page.addInitScript(() => {
        localStorage.setItem('access_token', 'mock_token_for_notes_test');
        localStorage.setItem('user_info', JSON.stringify({ userId: 1, username: 'testlearner', role: 'Learner' }));
      });

      // Mock personal notes API and auth/me
      await page.route('**/api/v1/**', async (route) => {
        const url = route.request().url();
        if (url.includes('/api/v1/lessons/1')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'SUCCESS',
              data: createAdversarialLessonDetail(1)
            })
          });
          return;
        }
        if (url.includes('/api/v1/notes')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 'SUCCESS', data: { page: 0, size: 20, totalElements: 0, items: [] } })
          });
          return;
        }
        if (url.includes('/api/v1/auth/me')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 'SUCCESS', data: { id: 1, username: 'testlearner', role: 'Learner' } })
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', data: {} })
        });
      });

      await page.goto(`${baseUrl}/lesson-detail.html?id=1`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#lessonVocabList .lesson-vocab-item');

      // Setup speech spy
      await page.evaluate(() => {
        window.__speechCalled = false;
        if (window.speechSynthesis) {
          const orig = window.speechSynthesis.speak.bind(window.speechSynthesis);
          window.speechSynthesis.speak = function (u) {
            window.__speechCalled = true;
            return orig(u);
          };
        }
      });

      // Click notes button on first item
      const firstItem = page.locator('#lessonVocabList .lesson-vocab-item').nth(0);
      const noteBtn = firstItem.locator('.lesson-vocab-note-btn');
      await noteBtn.click();

      // Verify notes modal dialog opens
      const notesModal = page.locator('#notesModal');
      await notesModal.waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await notesModal.isVisible(), '#notesModal must open on noteBtn click');

      // Verify writing modal is NOT open
      const writingModal = page.locator('#vocabWritingModal');
      const writingCount = await writingModal.count();
      if (writingCount > 0) {
        assert.strictEqual(await writingModal.isVisible(), false, 'Writing modal must remain closed on noteBtn click');
      }

      // Verify speech was NOT called
      const speechCalled = await page.evaluate(() => window.__speechCalled);
      assert.strictEqual(speechCalled, false, 'Speech must NOT be triggered on noteBtn click');

      // Close notes modal
      const notesCloseBtn = notesModal.locator('.btn-close, [data-bs-dismiss="modal"]');
      if (await notesCloseBtn.count() > 0) {
        await notesCloseBtn.first().click();
        await notesModal.waitFor({ state: 'hidden', timeout: 3000 });
      }

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // =========================================================================
  // CHALLENGE 3: Cross-Feature Tabs & Study Rooms (Overview, Practice, Quiz)
  // =========================================================================

  test('CH-M1-07: Unified 4-Room Quick Launch Bar & Study CTAs are fully intact and configured', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/lessons/1**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            data: createAdversarialLessonDetail(1)
          })
        });
      });

      await page.goto(`${baseUrl}/lesson-detail.html?id=1`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#lessonVocabList');

      // Verify all 4 study room launch buttons exist with valid target URLs
      const flashcardBtn = page.locator('#btnLaunchFlashcard');
      const writingBtn = page.locator('#btnLaunchWriting');
      const listeningBtn = page.locator('#btnLaunchListening');
      const readingBtn = page.locator('#btnLaunchReading');

      assert.ok(await flashcardBtn.isVisible(), 'Flashcard launch button visible');
      assert.ok(await writingBtn.isVisible(), 'Writing launch button visible');
      assert.ok(await listeningBtn.isVisible(), 'Listening launch button visible');
      assert.ok(await readingBtn.isVisible(), 'Reading launch button visible');

      const flashcardHref = await flashcardBtn.getAttribute('href');
      const writingHref = await writingBtn.getAttribute('href');
      const listeningHref = await listeningBtn.getAttribute('href');
      const readingHref = await readingBtn.getAttribute('href');

      assert.ok(flashcardHref.includes('mode=flashcard'), 'Flashcard href matches mode');
      assert.ok(writingHref.includes('mode=writing'), 'Writing href matches mode');
      assert.ok(listeningHref.includes('mode=listening'), 'Listening href matches mode');
      assert.ok(readingHref.includes('mode=reading'), 'Reading href matches mode');

      // Verify Primary CTA and Back to review links
      const startStudyBtn = page.locator('#btnStartPrimaryStudy');
      const backBtn = page.locator('#btnBackToReview');
      const bottomBackBtn = page.locator('#btnBottomBackToShelf');

      assert.ok(await startStudyBtn.isVisible(), 'Primary study button visible');
      assert.ok(await backBtn.isVisible(), 'Header back button visible');
      assert.ok(await bottomBackBtn.isVisible(), 'Bottom back button visible');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('CH-M1-08: SRS Review Practice Mode (?lessonId=1&mode=practice) loads successfully without regression', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      // Setup authenticated learner session and mock all required endpoints
      await page.addInitScript(() => {
        localStorage.setItem('access_token', 'mock_token');
        localStorage.setItem('user_info', JSON.stringify({ userId: 1, username: 'learner', role: 'Learner' }));
      });

      await page.route('**/api/v1/**', async (route) => {
        const url = route.request().url();
        if (url.includes('/srs/practice-cards')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'SUCCESS',
              data: [
                { vocabId: 101, hanzi: '你', pinyin: 'nǐ', meaningVi: 'Bạn, anh, chị', orderIndex: 1 },
                { vocabId: 102, hanzi: '好', pinyin: 'hǎo', meaningVi: 'Tốt, đẹp', orderIndex: 2 }
              ]
            })
          });
          return;
        }
        if (url.includes('/srs/settings')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 'SUCCESS', data: { newCardsPerDay: 20 } })
          });
          return;
        }
        if (url.includes('/srs/due')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 'SUCCESS', data: [] })
          });
          return;
        }
        if (url.includes('/auth/me')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 'SUCCESS', data: { id: 1, username: 'learner', role: 'Learner' } })
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', data: {} })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html?lessonId=1&mode=practice`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });

      assert.ok(await page.locator('#srsActiveSession').isVisible(), 'Practice session loaded successfully');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });
});
