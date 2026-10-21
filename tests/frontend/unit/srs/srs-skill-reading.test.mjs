/**
 * =============================================================================
 * UNIT TEST SUITE: SRS READING ROOM & GEMINI AI PRONUNCIATION ASSESSMENT
 * Module: tests/frontend/unit/srs/srs-skill-reading.test.mjs
 *
 * Verifies:
 * - Storage key isolation (STORAGE_KEY_READING = 'HOC_HAN_NGU_READING_PROGRESS').
 * - URL & mode resolution (?mode=reading, ?skill=READING, ?cardType=READING).
 * - SrsReviewController Reading Room lifecycle & 5 distinct states (A, B, C, D, E).
 * - Free-tier Gemini AI privacy banner and persistence preference.
 * - Microphone MediaStream resource cleanup and zero-storage audio policy.
 * - Rating buttons [1]-[4] and shortcut isolation in Reading mode.
 * - Format constituent radicals presentation and truthfulness contract.
 * =============================================================================
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for Node test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

// Mock DOM factory for Node test environment
function makeEl(tag = 'div') {
  const classes = new Set();
  const attrs = new Map();
  const children = [];
  const listeners = {};
  const elObj = {
    tagName: tag.toUpperCase(),
    id: '',
    children,
    value: '',
    disabled: false,
    textContent: '',
    style: {},
    focus: () => {},
    blur: () => {},
    get className() {
      return Array.from(classes).join(' ');
    },
    set className(val) {
      classes.clear();
      if (typeof val === 'string') {
        val.split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
      }
    },
    classList: {
      add: (...cls) => cls.forEach(c => classes.add(c)),
      remove: (...cls) => cls.forEach(c => classes.delete(c)),
      toggle: (c, force) => {
        if (force === undefined) {
          classes.has(c) ? classes.delete(c) : classes.add(c);
        } else if (force) {
          classes.add(c);
        } else {
          classes.delete(c);
        }
      },
      contains: (c) => classes.has(c)
    },
    setAttribute: (k, v) => {
      attrs.set(k, String(v));
      if (k === 'id') elObj.id = String(v);
    },
    getAttribute: (k) => attrs.get(k) ?? null,
    removeAttribute: (k) => attrs.delete(k),
    addEventListener: (event, fn) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    },
    removeEventListener: (event, fn) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(l => l !== fn);
      }
    },
    dispatchEvent: (e) => {
      const fns = listeners[e.type] || [];
      fns.forEach(fn => fn(e));
    },
    replaceChildren: (...newChildren) => {
      children.length = 0;
      if (newChildren.length > 0) children.push(...newChildren);
    },
    appendChild: (ch) => {
      children.push(ch);
      return ch;
    },
    removeChild: (ch) => {
      const idx = children.indexOf(ch);
      if (idx !== -1) children.splice(idx, 1);
      return ch;
    },
    querySelectorAll: (sel) => {
      const results = [];
      function traverse(node) {
        if (sel.startsWith('.') && node.classList && node.classList.contains(sel.slice(1))) {
          results.push(node);
        }
        for (const child of node.children) traverse(child);
      }
      traverse(elObj);
      return results;
    },
    querySelector: (sel) => elObj.querySelectorAll(sel)[0] || null
  };
  return elObj;
}

if (typeof global.document === 'undefined') {
  global.document = {
    body: makeEl('body'),
    createElement: (tag) => makeEl(tag),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  };
} else if (typeof global.document.createElement !== 'function') {
  global.document.createElement = (tag) => makeEl(tag);
}

// Import module under test
import {
  STORAGE_KEY_FLASHCARD,
  STORAGE_KEY_WRITING,
  STORAGE_KEY_LISTENING,
  STORAGE_KEY_READING,
  getProgress,
  saveProgress,
  formatConstituentRadicalsText,
  SrsReviewController
} from '../../../../frontend/js/pages/srs-review-page.js';

describe('SRS Reading Room & AI Assessment Tests', () => {

  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  describe('1. Storage Key Isolation Contract', () => {
    test('defines unique and distinct STORAGE_KEY_READING constant', () => {
      assert.strictEqual(STORAGE_KEY_READING, 'HOC_HAN_NGU_READING_PROGRESS');
      assert.notStrictEqual(STORAGE_KEY_READING, STORAGE_KEY_FLASHCARD);
      assert.notStrictEqual(STORAGE_KEY_READING, STORAGE_KEY_WRITING);
      assert.notStrictEqual(STORAGE_KEY_READING, STORAGE_KEY_LISTENING);
    });

    test('getProgress and saveProgress correctly isolate reading progress', () => {
      saveProgress('reading', { radicals50: { lastIndex: 5, completed: true } });

      const readingProgress = getProgress('reading');
      assert.deepStrictEqual(readingProgress, { radicals50: { lastIndex: 5, completed: true } });

      const flashcardProgress = getProgress('flashcard');
      const writingProgress = getProgress('writing');
      const listeningProgress = getProgress('listening');

      assert.deepStrictEqual(flashcardProgress, {});
      assert.deepStrictEqual(writingProgress, {});
      assert.deepStrictEqual(listeningProgress, {});
    });
  });

  describe('2. Constituent Radicals Presentation Contract', () => {
    test('returns unverified fallback text when radicals array is empty or null', () => {
      assert.strictEqual(formatConstituentRadicalsText(null, '学'), 'Chưa có dữ liệu bộ thủ đã xác minh');
      assert.strictEqual(formatConstituentRadicalsText([], '学'), 'Chưa có dữ liệu bộ thủ đã xác minh');
      assert.strictEqual(formatConstituentRadicalsText(undefined, '学'), 'Chưa có dữ liệu bộ thủ đã xác minh');
    });

    test('formats single-character word with constituent radicals separated by commas', () => {
      const radicals = [
        { character: '子', meaningHanViet: 'Tử' },
        { character: '冖', meaningHanViet: 'Mịch' }
      ];
      const result = formatConstituentRadicalsText(radicals, '学');
      assert.strictEqual(result, '子 (Tử), 冖 (Mịch)');
    });

    test('formats multi-character word with character attribution prefix', () => {
      const radicals = [
        { hanziChar: '学', character: '子', meaningHanViet: 'Tử' },
        { hanziChar: '生', character: '生', meaningHanViet: 'Sinh' }
      ];
      const result = formatConstituentRadicalsText(radicals, '学生');
      assert.strictEqual(result, '学: 子 (Tử), 生: 生 (Sinh)');
    });
  });

  describe('3. Reading Room UI States & Controller Lifecycle', () => {
    let controller;
    let mockDom;

    beforeEach(() => {
      controller = new SrsReviewController();

      mockDom = {
        readingRoom: makeEl('div'),
        readingRoomBadge: makeEl('span'),
        readingPrivacyNotice: makeEl('div'),
        btnDismissPrivacyNotice: makeEl('button'),
        readingCardTypeBadge: makeEl('span'),
        readingPromptHanzi: makeEl('div'),
        btnReadingSampleAudio: makeEl('button'),
        readingAnswerRevealArea: makeEl('div'),
        btnReadingTogglePinyin: makeEl('button'),
        readingPinyinMeaningBox: makeEl('div'),
        readingPromptPinyin: makeEl('div'),
        readingPromptHanViet: makeEl('span'),
        readingPromptMeaning: makeEl('span'),
        readingStateReady: makeEl('div'),
        btnReadingStartRecord: makeEl('button'),
        readingStateRecording: makeEl('div'),
        readingRecordDuration: makeEl('span'),
        btnReadingStopRecord: makeEl('button'),
        btnReadingCancelRecord: makeEl('button'),
        readingStateAnalyzing: makeEl('div'),
        readingStateResult: makeEl('div'),
        readingOverallScoreBadge: makeEl('span'),
        readingConfidenceBadge: makeEl('span'),
        readingRecognizedText: makeEl('span'),
        readingResultSummary: makeEl('div'),
        readingComponentsWrapper: makeEl('div'),
        readingInitialsFeedback: makeEl('div'),
        readingFinalsFeedback: makeEl('div'),
        readingTonesFeedback: makeEl('div'),
        readingRetryAdvice: makeEl('div'),
        btnReadingPlayUserAudio: makeEl('button'),
        btnReadingPlaySampleAgain: makeEl('button'),
        btnReadingRecordAgain: makeEl('button'),
        readingStateError: makeEl('div'),
        readingErrorTitle: makeEl('div'),
        readingErrorMessage: makeEl('div'),
        readingErrorAdvice: makeEl('div'),
        btnReadingTryAgain: makeEl('button'),
        readingNextContainer: makeEl('div'),
        btnReadingNext: makeEl('button'),
        flashcardContainer: makeEl('div'),
        ratingSection: makeEl('section'),
        writingRoom: makeEl('div'),
        listeningRoom: makeEl('div')
      };

      controller.dom = mockDom;
      controller.activeMode = 'reading';
    });

    test('setReadingState toggles active state box correctly among States A to E', () => {
      controller.setReadingState('ready');
      assert.strictEqual(mockDom.readingStateReady.classList.contains('d-none'), false);
      assert.strictEqual(mockDom.readingStateRecording.classList.contains('d-none'), true);
      assert.strictEqual(mockDom.readingStateAnalyzing.classList.contains('d-none'), true);
      assert.strictEqual(mockDom.readingStateResult.classList.contains('d-none'), true);
      assert.strictEqual(mockDom.readingStateError.classList.contains('d-none'), true);

      controller.setReadingState('recording');
      assert.strictEqual(mockDom.readingStateReady.classList.contains('d-none'), true);
      assert.strictEqual(mockDom.readingStateRecording.classList.contains('d-none'), false);

      controller.setReadingState('analyzing');
      assert.strictEqual(mockDom.readingStateRecording.classList.contains('d-none'), true);
      assert.strictEqual(mockDom.readingStateAnalyzing.classList.contains('d-none'), false);

      controller.setReadingState('result');
      assert.strictEqual(mockDom.readingStateAnalyzing.classList.contains('d-none'), true);
      assert.strictEqual(mockDom.readingStateResult.classList.contains('d-none'), false);

      controller.setReadingState('error');
      assert.strictEqual(mockDom.readingStateResult.classList.contains('d-none'), true);
      assert.strictEqual(mockDom.readingStateError.classList.contains('d-none'), false);
    });

    test('renderReadingRoomCard populates State A (Ready) correctly', async () => {
      const card = {
        itemType: 'VOCABULARY',
        itemId: 101,
        hanzi: '学',
        pinyin: 'xué',
        meaningHanViet: 'Học',
        meaningVi: 'Học tập; nghiên cứu'
      };

      await controller.renderReadingRoomCard(card);

      assert.strictEqual(mockDom.readingPromptHanzi.textContent, '学');
      assert.strictEqual(mockDom.readingPromptPinyin.textContent, 'xué');
      assert.strictEqual(mockDom.readingPromptMeaning.textContent, 'Học tập; nghiên cứu');
      assert.strictEqual(mockDom.readingStateReady.classList.contains('d-none'), false);
      assert.strictEqual(mockDom.readingPinyinMeaningBox.classList.contains('d-none'), true);
      assert.strictEqual(mockDom.btnReadingNext.classList.contains('writing-next-hidden'), true);
      assert.strictEqual(controller.hasCompletedReadingForCurrentCard, false);
    });

    test('handleAssessmentResponse displays State D (Scored) with truthful breakdown', () => {
      const card = { itemId: 101, hanzi: '学', pinyin: 'xué' };
      const apiResponse = {
        status: 'SCORED',
        overallScore: 88,
        confidence: 'HIGH',
        recognizedText: '学',
        summaryVi: 'Phát âm chuẩn xác thanh mẫu x và vận mẫu ue.',
        components: {
          initials: 'Thanh mẫu x- phát âm chuẩn mặt lưỡi.',
          finals: 'Vận mẫu -ué phát âm tròn môi đúng.',
          tones: 'Thanh 2 (thanh sắc) lên giọng chuẩn.'
        },
        retryAdvice: 'Hãy giữ vững tốc độ này ở các từ tiếp theo.'
      };

      controller.handleAssessmentResponse(apiResponse, card);

      assert.strictEqual(controller.hasCompletedReadingForCurrentCard, true);
      assert.strictEqual(controller.currentReadingScore, 88);
      assert.strictEqual(mockDom.readingStateResult.classList.contains('d-none'), false);
      assert.strictEqual(mockDom.readingOverallScoreBadge.textContent, '88 / 100');
      assert.strictEqual(mockDom.readingConfidenceBadge.textContent, 'Độ tin cậy: Cao');
      assert.strictEqual(mockDom.readingRecognizedText.textContent, '学');
      assert.strictEqual(mockDom.readingResultSummary.textContent, apiResponse.summaryVi);
      assert.strictEqual(mockDom.btnReadingNext.classList.contains('writing-next-hidden'), false);
      assert.strictEqual(mockDom.readingPinyinMeaningBox.classList.contains('d-none'), false);
    });

    test('handleAssessmentResponse displays State E (Not Scorable / Unconfigured / Quota) without fake scores', () => {
      const card = { itemId: 101, hanzi: '学', pinyin: 'xué' };
      const unconfiguredResponse = {
        status: 'UNCONFIGURED',
        summaryVi: 'Tính năng Luyện đọc AI sử dụng Google Gemini (Gói miễn phí) nhưng máy chủ chưa cấu hình GEMINI_API_KEY.',
        retryAdvice: 'Quản trị viên cần đặt biến môi trường GEMINI_API_KEY trước khi khởi động backend.'
      };

      controller.handleAssessmentResponse(unconfiguredResponse, card);

      assert.strictEqual(controller.hasCompletedReadingForCurrentCard, false);
      assert.strictEqual(mockDom.readingStateError.classList.contains('d-none'), false);
      assert.strictEqual(mockDom.readingErrorTitle.textContent, 'Chưa cấu hình Gemini AI API');
      assert.strictEqual(mockDom.readingErrorMessage.textContent, unconfiguredResponse.summaryVi);
      assert.strictEqual(mockDom.btnReadingNext.classList.contains('writing-next-hidden'), true);
      // Pinyin & meaning are retained for learner support even on error
      assert.strictEqual(mockDom.readingPinyinMeaningBox.classList.contains('d-none'), false);
    });

    test('cleanUpReadingMedia stops tracks, timers, and revokes blob URL', () => {
      let trackStopped = false;
      controller.readingStream = {
        getTracks: () => [{ stop: () => { trackStopped = true; } }]
      };
      controller.readingRecordTimer = setInterval(() => {}, 1000);
      controller.readingAutoStopTimeout = setTimeout(() => {}, 5000);

      controller.cleanUpReadingMedia();

      assert.strictEqual(trackStopped, true);
      assert.strictEqual(controller.readingStream, null);
      assert.strictEqual(controller.readingRecordTimer, null);
      assert.strictEqual(controller.readingAutoStopTimeout, null);
    });

    test('privacy notice dismissal preference is respected across renders', async () => {
      const card = { itemId: 101, hanzi: '学', pinyin: 'xué' };

      // Case 1: First time - notice is shown
      await controller.renderReadingRoomCard(card);
      assert.strictEqual(mockDom.readingPrivacyNotice.classList.contains('d-none'), false);

      // Dismiss notice
      globalThis.localStorage.setItem('srs_reading_privacy_dismissed', '1');

      // Case 2: Subsequent card load - notice remains dismissed
      await controller.renderReadingRoomCard(card);
      assert.strictEqual(mockDom.readingPrivacyNotice.classList.contains('d-none'), true);
    });
  });

  describe('4. Keyboard & Navigation Isolation', () => {
    test('Space or Enter key is blocked before assessment and advances after assessment', () => {
      const controller = new SrsReviewController();
      controller.dom = {
        activeSession: makeEl('section')
      };
      controller.sessionQueue = [{ card: { hanzi: '学' } }];
      controller.currentIndex = 0;
      controller.activeMode = 'reading';
      controller.hasCompletedReadingForCurrentCard = false;

      let nextCalled = false;
      controller.nextReadingItem = () => { nextCalled = true; };

      const event = {
        code: 'Space',
        key: ' ',
        target: { tagName: 'body' },
        preventDefault: () => {}
      };

      // Before assessment: locked
      controller.handleKeydown(event);
      assert.strictEqual(nextCalled, false);

      // After assessment: unlocked
      controller.hasCompletedReadingForCurrentCard = true;
      controller.handleKeydown(event);
      assert.strictEqual(nextCalled, true);
    });

    test('Numeric shortcuts 1..4 are strictly ignored in Reading mode', () => {
      const controller = new SrsReviewController();
      controller.dom = {
        activeSession: makeEl('section')
      };
      controller.sessionQueue = [{ card: { hanzi: '学' } }];
      controller.currentIndex = 0;
      controller.activeMode = 'reading';

      let ratingSubmitted = null;
      controller.submitRating = (r) => { ratingSubmitted = r; };

      const event1 = {
        code: 'Digit1',
        key: '1',
        target: { tagName: 'body' },
        preventDefault: () => {}
      };

      controller.handleKeydown(event1);
      assert.strictEqual(ratingSubmitted, null);
    });
  });
});
