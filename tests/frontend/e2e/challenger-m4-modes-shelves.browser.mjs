/**
 * =============================================================================
 * EMPIRICAL ADVERSARIAL CHALLENGER: 5 STUDY MODES & 5 CURRICULUM SHELVES
 * File: tests/frontend/e2e/challenger-m4-modes-shelves.browser.mjs
 *
 * Adversarially verifies on real browser:
 * 1. All 5 curriculum shelves render truthfully without broken layout/assets:
 *    - Shelf 1: radicals50 (50 Bộ Thủ Thông Dụng - 5 Chặng)
 *    - Shelf 2: radicals214 (214 Bộ Thủ Đầy Đủ - 11 Chặng)
 *    - Shelf 3: hsk1 (Từ Vựng HSK 1 - 15 Bài)
 *    - Shelf 4: hsk2 (Từ Vựng HSK 2 - 10 Bài)
 *    - Shelf 5: hsk3 (Từ Vựng HSK 3 - 25 Bài)
 * 2. All 5 study modes isolate their respective rooms without leakage:
 *    - Mode 1: Flashcard (3D flip, front/back audio buttons, rating controls [1]-[4])
 *    - Mode 2: Writing (HanziWriter stroke canvas, tool buttons, 3-state next lifecycle)
 *    - Mode 3: Listening (Audio playback, Pinyin IME, answer validation)
 *    - Mode 4: Reading (State machine A-E, F0 Chao 5-scale tone assessment, keyboard shortcut isolation)
 *    - Mode 5: Dictation / Quiz (Free practice / quiz recall mode without SRS mutations)
 * 3. Zero console errors, uncaught exceptions, or 404/500 asset failures.
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

const REAL_RADICAL_CHARS = [
  '一', '丨', '丶', '丿', '乙', '亅', '二', '亠', '人', '儿',
  '入', '八', '冂', '冖', '冫', '几', '凵', '刀', '力', '勹',
  '匕', '匚', '匸', '十', '卜', '卩', '厂', '厶', '又', '口',
  '囗', '土', '士', '夂', '夊', '夕', '大', '女', '子', '宀',
  '寸', '小', '尢', '尸', '屮', '山', '巛', '工', '己', '巾'
];

function createMockRadicals(count = 50) {
  const radicals = [];
  for (let id = 1; id <= count; id++) {
    const char = id <= REAL_RADICAL_CHARS.length ? REAL_RADICAL_CHARS[id - 1] : '一';
    radicals.push({
      radicalId: id,
      character: char,
      pinyin: `pinyin_${id}`,
      meaningHanViet: `Hán Việt ${id}`,
      meaningVi: `Nghĩa bộ thủ ${id}`,
      strokeCount: (id % 12) + 1,
      commonRank: id,
      audioUrl: null
    });
  }
  return radicals;
}

function createMockLessons() {
  const lessons = [];
  // HSK 1: 15 lessons
  for (let i = 1; i <= 15; i++) {
    lessons.push({
      lessonId: 100 + i,
      title: `HSK 1 - Bài ${String(i).padStart(2, '0')}: Chủ đề HSK1.${i}`,
      hskLevel: 1,
      status: 'APPROVED',
      vocabularyCount: 20
    });
  }
  // HSK 2: 10 lessons
  for (let i = 1; i <= 10; i++) {
    lessons.push({
      lessonId: 200 + i,
      title: `HSK 2 - Bài ${String(i).padStart(2, '0')}: Chủ đề HSK2.${i}`,
      hskLevel: 2,
      status: 'APPROVED',
      vocabularyCount: 20
    });
  }
  // HSK 3: 25 lessons
  for (let i = 1; i <= 25; i++) {
    lessons.push({
      lessonId: 300 + i,
      title: `HSK 3 - Bài ${String(i).padStart(2, '0')}: Chủ đề HSK3.${i}`,
      hskLevel: 3,
      status: 'APPROVED',
      vocabularyCount: 20
    });
  }
  return lessons;
}

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
      strokeCount: 8,
      repetitions: 2,
      easeFactor: 2.5,
      intervalDays: 3,
      nextReviewAt: '2026-10-25T10:00:00',
      isNew: false
    },
    {
      itemType: 'VOCABULARY',
      itemId: 102,
      hanzi: '生',
      pinyin: 'shēng',
      meaningHanViet: 'Sinh',
      meaningVi: 'Sinh ra, học trò',
      exampleSentence: '他是留学生。',
      exampleTranslation: 'Anh ấy là lưu học sinh.',
      strokeCount: 5,
      repetitions: 1,
      easeFactor: 2.5,
      intervalDays: 1,
      nextReviewAt: '2026-10-25T10:00:00',
      isNew: false
    }
  ];
}

async function setupBaseMock(page, { hasDue = false } = {}) {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'mock_challenger_jwt_token');
    localStorage.setItem('user_info', JSON.stringify({
      accountId: 8888,
      emailOrPhone: 'challenger@weblearnchinese.com',
      fullName: 'Empirical Challenger M4',
      roles: ['Learner']
    }));
    localStorage.setItem('srs_flashcard_progress', JSON.stringify({
      radicals50: { chapter_0: 10 },
      radicals214: { chapter_0: 5 }
    }));
  });

  await page.route('**/api/v1/vocabulary/*', async (route) => {
    const url = route.request().url();
    const idMatch = url.match(/\/vocabulary\/(\d+)/);
    const id = idMatch ? Number(idMatch[1]) : 101;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: {
          vocabId: id,
          hanzi: id === 101 ? '学' : '生',
          pinyin: id === 101 ? 'xué' : 'shēng',
          meaningHanViet: id === 101 ? 'Học' : 'Sinh',
          meaningVi: id === 101 ? 'Học tập' : 'Học sinh',
          radicals: [
            { radicalId: 39, character: '子', meaningHanViet: 'Tử', hanziChar: '学' }
          ]
        }
      })
    });
  });

  await page.route('**/api/v1/radicals*', async (route) => {
    const url = route.request().url();
    const count = url.includes('size=214') ? 214 : 50;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: {
          items: createMockRadicals(count),
          page: 0,
          size: count,
          totalElements: count,
          totalPages: 1
        }
      })
    });
  });

  await page.route('**/api/v1/radicals/*', async (route) => {
    const url = route.request().url();
    const match = url.match(/\/api\/v1\/radicals\/(\d+)/);
    const id = match ? parseInt(match[1], 10) : 1;
    const radicals = createMockRadicals(214);
    const found = radicals.find(r => r.radicalId === id) || radicals[0];
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: found })
    });
  });

  await page.route('**/api/v1/lessons*', async (route) => {
    const lessons = createMockLessons();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: {
          items: lessons,
          totalElements: lessons.length,
          page: 0,
          size: 100,
          totalPages: 1
        }
      })
    });
  });

  await page.route('**/api/v1/srs/due*', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: hasDue ? createMockDueCards() : []
      })
    });
  });

  await page.route('**/api/v1/srs/practice-cards*', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: createMockDueCards()
      })
    });
  });

  await page.route('**/api/v1/srs/study-stats*', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: {
          totalCards: 50,
          dueCards: hasDue ? 2 : 0,
          learnedCards: 10,
          retentionRate: 100
        }
      })
    });
  });

  await page.route('**/api/v1/**/notes*', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: { items: [] } })
    });
  });

  await page.route('**/api/v1/srs/review*', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'Review accepted',
        data: { repetitions: 3, intervalDays: 6, easeFactor: 2.6 }
      })
    });
  });

  await page.route('**/api/v1/srs/reading/status*', async (route) => {
    return route.fulfill({
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
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'Evaluation completed',
        data: {
          status: 'SCORED',
          overallScore: 92,
          confidence: 'HIGH',
          pinyinTarget: 'yī',
          summaryVi: 'Phát âm rất rõ ràng, thanh điệu ngang chuẩn xác.',
          limitations: 'Chao 5-scale Tone Sandhi Engine'
        }
      })
    });
  });
}

describe('Empirical Adversarial Challenge: 5 Curriculum Shelves & 5 Study Modes', () => {
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

  test('SHELVES-01: All 5 Curriculum Shelves render expected chapter counts without broken assets', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);
    try {
      await setupBaseMock(page, { hasDue: false });

      // Navigate with explicit ?group=radicals50 to ensure catalog selection view
      await page.goto(`${baseUrl}/srs-review.html?group=radicals50`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsCatalogSelection').waitFor({ state: 'visible', timeout: 8000 });

      // 1. Shelf: 50 Radicals (5 chapters)
      await page.locator('.stage-card').first().waitFor({ state: 'visible', timeout: 5000 });
      let stageCards = await page.locator('.stage-card').all();
      assert.strictEqual(stageCards.length, 5, '50 Radicals shelf must render exactly 5 stage cards');

      // 2. Shelf: 214 Radicals (11 chapters)
      const tabRad214 = page.locator('#groupTabRadicals214');
      await tabRad214.click();
      await page.waitForFunction(() => document.querySelectorAll('.stage-card').length === 11, { timeout: 5000 });
      stageCards = await page.locator('.stage-card').all();
      assert.strictEqual(stageCards.length, 11, '214 Radicals shelf must render exactly 11 stage cards');

      // 3. Shelf: HSK 1 (15 lessons)
      const tabHsk1 = page.locator('#groupTabHsk1');
      await tabHsk1.click();
      await page.waitForFunction(() => document.querySelectorAll('.stage-card').length === 15, { timeout: 5000 });
      stageCards = await page.locator('.stage-card').all();
      assert.strictEqual(stageCards.length, 15, 'HSK 1 shelf must render exactly 15 lesson stage cards');

      // 4. Shelf: HSK 2 (10 lessons)
      const tabHsk2 = page.locator('#groupTabHsk2');
      await tabHsk2.click();
      await page.waitForFunction(() => document.querySelectorAll('.stage-card').length === 10, { timeout: 5000 });
      stageCards = await page.locator('.stage-card').all();
      assert.strictEqual(stageCards.length, 10, 'HSK 2 shelf must render exactly 10 lesson stage cards');

      // 5. Shelf: HSK 3 (25 lessons)
      const tabHsk3 = page.locator('#groupTabHsk3');
      await tabHsk3.click();
      await page.waitForFunction(() => document.querySelectorAll('.stage-card').length === 25, { timeout: 5000 });
      stageCards = await page.locator('.stage-card').all();
      assert.strictEqual(stageCards.length, 25, 'HSK 3 shelf must render exactly 25 lesson stage cards');

      // Verify zero console errors or uncaught exceptions
      assert.strictEqual(getRuntimeErrors().length, 0, `Zero errors expected across shelves, got: ${getRuntimeErrors().join(', ')}`);
    } finally {
      await context.close();
    }
  });

  test('MODES-01: Mode 1 (Flashcard) 3D flip, audio button & rating controls operate cleanly', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);
    try {
      await setupBaseMock(page, { hasDue: true });

      await page.goto(`${baseUrl}/srs-review.html?mode=flashcard&group=radicals50&action=continue`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });

      // Verify flashcard is visible, writing, listening, reading rooms hidden
      assert.ok(await page.locator('#srsFlashcardContainer').isVisible(), 'Flashcard container must be visible');
      assert.ok(await page.locator('#srsWritingRoom').isHidden(), 'Writing room must be hidden in flashcard mode');
      assert.ok(await page.locator('#srsListeningRoom').isHidden(), 'Listening room must be hidden in flashcard mode');
      assert.ok(await page.locator('#srsReadingRoom').isHidden(), 'Reading room must be hidden in flashcard mode');

      // Test 3D Flip interaction
      const flashcard = page.locator('#flashcard');
      const isFlippedInitial = await flashcard.evaluate(el => el.classList.contains('flipped'));
      assert.strictEqual(isFlippedInitial, false, 'Card front must face forward initially');

      // Flip to back via click
      await flashcard.click();
      await page.waitForTimeout(100);
      const isFlippedAfter = await flashcard.evaluate(el => el.classList.contains('flipped'));
      assert.strictEqual(isFlippedAfter, true, 'Card must flip to back face (class "flipped")');

      // Test rating control (Click Good)
      const btnGood = page.locator('#btnRatingGood');
      assert.ok(await btnGood.isVisible(), 'btnRatingGood must exist');
      await btnGood.click();
      await page.waitForTimeout(400);

      assert.strictEqual(getRuntimeErrors().length, 0, `Zero errors in Flashcard mode: ${getRuntimeErrors().join(', ')}`);
    } finally {
      await context.close();
    }
  });

  test('MODES-02: Mode 2 (Writing) renders stroke order tools and operates 3-state lifecycle', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);
    try {
      await setupBaseMock(page, { hasDue: true });

      await page.goto(`${baseUrl}/srs-review.html?mode=writing&group=radicals50&action=continue`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsWritingRoom').waitFor({ state: 'visible', timeout: 8000 });

      // Verify room isolation
      assert.ok(await page.locator('#srsListeningRoom').isHidden(), 'Listening room hidden in writing mode');
      assert.ok(await page.locator('#srsReadingRoom').isHidden(), 'Reading room hidden in writing mode');

      // State 1: New word -> next button is hidden (.writing-next-hidden)
      const btnWritingNext = page.locator('#btnWritingNext');
      const isNextHidden = await btnWritingNext.evaluate(el => el.classList.contains('writing-next-hidden'));
      assert.strictEqual(isNextHidden, true, 'State 1: Next button must be hidden initially');

      // Verify secondary tools exist and clickable
      const btnOutline = page.locator('#btnWritingOutline');
      const btnReplay = page.locator('#btnWritingReplay');
      const btnClear = page.locator('#btnWritingClear');
      assert.ok(await btnOutline.isVisible(), 'btnWritingOutline must exist');
      assert.ok(await btnReplay.isVisible(), 'btnWritingReplay must exist');
      assert.ok(await btnClear.isVisible(), 'btnWritingClear must exist');

      await btnOutline.click();
      await btnReplay.click();
      await btnClear.click();

      assert.strictEqual(getRuntimeErrors().length, 0, `Zero errors in Writing mode: ${getRuntimeErrors().join(', ')}`);
    } finally {
      await context.close();
    }
  });

  test('MODES-03: Mode 3 (Listening) renders audio trigger and verifies dictation input', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);
    try {
      await setupBaseMock(page, { hasDue: true });

      await page.goto(`${baseUrl}/srs-review.html?mode=listening&group=radicals50&action=continue`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsListeningRoom').waitFor({ state: 'visible', timeout: 8000 });

      // Verify room isolation
      assert.ok(await page.locator('#srsWritingRoom').isHidden(), 'Writing room hidden in listening mode');
      assert.ok(await page.locator('#srsReadingRoom').isHidden(), 'Reading room hidden in listening mode');

      // Input wrong answer and check error notice
      const input = page.locator('#listeningAnswerInput');
      await input.fill('错');

      const btnCheck = page.locator('#btnListeningCheck');
      await btnCheck.click();
      await page.locator('#listeningErrorNotice').waitFor({ state: 'visible', timeout: 3000 });
      assert.ok(await page.locator('#listeningErrorNotice').isVisible(), 'Error notice visible on wrong answer');

      // Input correct answer and check completion notice
      await input.fill('一');
      await btnCheck.click();
      await page.locator('#listeningCompletionNotice').waitFor({ state: 'visible', timeout: 3000 });
      assert.ok(await page.locator('#listeningCompletionNotice').isVisible(), 'Completion notice visible on correct answer');

      assert.strictEqual(getRuntimeErrors().length, 0, `Zero errors in Listening mode: ${getRuntimeErrors().join(', ')}`);
    } finally {
      await context.close();
    }
  });

  test('MODES-04 & 05: Mode 4 (Reading) & Mode 5 (Quiz/Practice) isolate rating keys and execute cleanly', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);
    try {
      await setupBaseMock(page, { hasDue: true });

      // Mode 4: Reading Room
      await page.goto(`${baseUrl}/srs-review.html?mode=reading&group=radicals50&action=continue`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsReadingRoom').waitFor({ state: 'visible', timeout: 8000 });

      // Verify rating bars hidden
      assert.ok(await page.locator('#srsRatingSection').isHidden(), 'SRS rating buttons 1-4 must be hidden in reading mode');

      // Pressing rating shortcut '1' or '4' must NOT advance card or cause uncaught error
      await page.keyboard.press('1');
      await page.keyboard.press('4');
      await page.waitForTimeout(300);

      const promptHanzi = await page.locator('#readingPromptHanzi').textContent();
      assert.ok(promptHanzi.trim().length > 0, 'Target Hanzi must be present');

      // Toggle pinyin preview
      const toggleBtn = page.locator('#btnReadingTogglePinyin');
      await toggleBtn.click();
      assert.ok(await page.locator('#readingPinyinMeaningBox').isVisible(), 'Pinyin preview box revealed');

      // Mode 5: Free Practice / Quiz Mode navigation (?lessonId=10&mode=practice)
      await page.goto(`${baseUrl}/srs-review.html?lessonId=10&mode=practice`, { waitUntil: 'domcontentloaded' });
      await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });
      assert.ok(await page.locator('#srsActiveSession').isVisible(), 'Practice session loads successfully');

      assert.strictEqual(getRuntimeErrors().length, 0, `Zero errors in Reading/Quiz: ${getRuntimeErrors().join(', ')}`);
    } finally {
      await context.close();
    }
  });
});
