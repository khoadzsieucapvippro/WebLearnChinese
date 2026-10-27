/**
 * =============================================================================
 * UNIT TEST SUITE: SRS READING ROOM & CHAO 5-SCALE TONE SANDHI ASSESSMENT
 * Module: tests/frontend/unit/srs/srs-skill-reading.test.mjs
 *
 * Verifies:
 * - Storage key isolation (STORAGE_KEY_READING = 'HOC_HAN_NGU_READING_PROGRESS').
 * - URL & mode resolution (?mode=reading, ?skill=READING, ?cardType=READING).
 * - SrsReviewController Reading Room lifecycle & 5 distinct states (A, B, C, D, E).
 * - Reading error card and state machine feedback.
 * - Microphone MediaStream resource cleanup and zero-storage audio policy.
 * - Rating buttons [1]-[4] and shortcut isolation in Reading mode.
 * - Format constituent radicals presentation and truthfulness contract.
 * =============================================================================
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

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
        btnReadingSkipOnError: makeEl('button'),
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
        summaryVi: 'Hệ thống Phân tích Phát âm & Thanh điệu chưa được cấu hình địa chỉ dịch vụ.',
        retryAdvice: 'Quản trị viên vui lòng thiết lập biến môi trường SPEECH_SERVICE_URL trên máy chủ.'
      };

      controller.handleAssessmentResponse(unconfiguredResponse, card);

      assert.strictEqual(controller.hasCompletedReadingForCurrentCard, false);
      assert.strictEqual(mockDom.readingStateError.classList.contains('d-none'), false);
      assert.strictEqual(mockDom.readingErrorTitle.textContent, 'Hệ thống Phân tích Phát âm & Thanh điệu chưa cấu hình');
      assert.strictEqual(mockDom.readingErrorMessage.textContent, unconfiguredResponse.summaryVi);
      assert.strictEqual(mockDom.btnReadingNext.classList.contains('writing-next-hidden'), true);
      // Pinyin & meaning are retained for learner support even on error
      assert.strictEqual(mockDom.readingPinyinMeaningBox.classList.contains('d-none'), false);
    });

    test('handleAssessmentResponse handles cold-start waking up encouragingly and case-insensitively', () => {
      const card = { itemId: 101, hanzi: '好', pinyin: 'hǎo' };

      // Case 1: status = 'cold_start'
      const coldStartResp = {
        status: 'cold_start',
        summaryVi: 'Máy chủ phân tích âm thanh đang khởi động lại từ trạng thái nghỉ (Render Free Tier spin-up ~30-50s).',
        retryAdvice: 'Máy chủ cần khoảng 30–50 giây để khởi động lại sau thời gian nghỉ. Vui lòng bấm "Thử đọc lại" sau giây lát hoặc bấm "Bỏ qua →" để tiếp tục ôn tập.'
      };
      controller.handleAssessmentResponse(coldStartResp, card);

      assert.strictEqual(controller.hasCompletedReadingForCurrentCard, false);
      assert.strictEqual(mockDom.readingStateError.classList.contains('d-none'), false);
      assert.strictEqual(mockDom.readingErrorTitle.textContent, 'Máy chủ phân tích âm thanh đang khởi động');
      assert.strictEqual(mockDom.readingErrorMessage.textContent, coldStartResp.summaryVi);
      assert.strictEqual(mockDom.btnReadingTryAgain.disabled, false);
      assert.strictEqual(mockDom.btnReadingSkipOnError.disabled, false);

      // Case 2: status = 'coldstartwakingup'
      const wakingUpResp = {
        status: 'coldstartwakingup',
        summaryVi: 'Dịch vụ phân tích phát âm đang thức giấc.',
        retryAdvice: 'Vui lòng bấm "Thử đọc lại" sau giây lát.'
      };
      controller.handleAssessmentResponse(wakingUpResp, card);
      assert.strictEqual(mockDom.readingErrorTitle.textContent, 'Máy chủ phân tích âm thanh đang khởi động');

      // Case 3: status = 'engine_unavailable' with spin-up summary
      const engineColdResp = {
        status: 'engine_unavailable',
        summaryVi: 'Hệ thống Phân tích Phát âm & Thanh điệu đang khởi động từ trạng thái nghỉ (Render Free Tier spin-up ~30-50s).',
        retryAdvice: 'Máy chủ phân tích âm thanh cần khoảng 30-50 giây để khởi động lại sau thời gian nghỉ.'
      };
      controller.handleAssessmentResponse(engineColdResp, card);
      assert.strictEqual(mockDom.readingErrorTitle.textContent, 'Máy chủ phân tích âm thanh đang khởi động');
    });

    test('handleAssessmentResponse handles case-insensitive statuses (assessed, SCORED, NOT_SCORABLE, error)', () => {
      const card = { itemId: 102, hanzi: '水', pinyin: 'shuǐ' };

      // Case 1: lowercase 'assessed'
      const assessedResp = {
        status: 'assessed',
        overallScore: 92,
        summaryVi: 'Phát âm rất chuẩn.',
        retryAdvice: 'Giữ vững phong độ!'
      };
      controller.handleAssessmentResponse(assessedResp, card);
      assert.strictEqual(controller.hasCompletedReadingForCurrentCard, true);
      assert.strictEqual(controller.currentReadingScore, 92);
      assert.strictEqual(mockDom.readingStateResult.classList.contains('d-none'), false);

      // Case 2: lowercase 'not_scorable'
      const notScorableResp = {
        status: 'not_scorable',
        summaryVi: 'Âm thanh không rõ hoặc có nhiều tạp âm.',
        retryAdvice: 'Vui lòng đọc lại to và gần micro hơn.'
      };
      controller.handleAssessmentResponse(notScorableResp, card);
      assert.strictEqual(controller.hasCompletedReadingForCurrentCard, false);
      assert.strictEqual(mockDom.readingStateError.classList.contains('d-none'), false);
      assert.strictEqual(mockDom.readingErrorTitle.textContent, 'Không đủ căn cứ chấm điểm');

      // Case 3: uppercase 'ERROR'
      const errorResp = {
        status: 'ERROR',
        summaryVi: 'Lỗi máy chủ nội bộ.',
        retryAdvice: 'Vui lòng thử lại sau.'
      };
      controller.handleAssessmentResponse(errorResp, card);
      assert.strictEqual(mockDom.readingErrorTitle.textContent, 'Lỗi phân tích phát âm');
    });

    test('showReadingError unlocks btnReadingTryAgain and btnReadingSkipOnError controls without freezing', () => {
      mockDom.btnReadingTryAgain.disabled = true;
      mockDom.btnReadingSkipOnError.disabled = true;

      controller.showReadingError('Kiểm tra lỗi', 'Nội dung lỗi', 'Gợi ý xử lý');

      assert.strictEqual(mockDom.btnReadingTryAgain.disabled, false);
      assert.strictEqual(mockDom.btnReadingSkipOnError.disabled, false);
      assert.strictEqual(mockDom.readingErrorTitle.textContent, 'Kiểm tra lỗi');
      assert.strictEqual(mockDom.readingErrorMessage.textContent, 'Nội dung lỗi');
      assert.strictEqual(mockDom.readingErrorAdvice.textContent, 'Gợi ý xử lý');
      assert.strictEqual(mockDom.readingStateError.classList.contains('d-none'), false);
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

  describe('5. Quy chuẩn Đánh giá 1–4 SM-2 & Chu trình Học lại Phòng Luyện Đọc', () => {
    test('score >= 85 maps to Rating 4 (Easy)', async () => {
      const controller = new SrsReviewController();
      controller.dom = { btnReadingNext: makeEl('button') };
      controller.hasCompletedReadingForCurrentCard = true;
      controller.currentReadingScore = 92;
      let submittedRating = null;
      controller.submitRating = async (r) => { submittedRating = r; };

      await controller.nextReadingItem();
      assert.strictEqual(submittedRating, 4);
    });

    test('60 <= score < 85 maps to Rating 3 (Good)', async () => {
      const controller = new SrsReviewController();
      controller.dom = { btnReadingNext: makeEl('button') };
      controller.hasCompletedReadingForCurrentCard = true;
      controller.currentReadingScore = 75;
      let submittedRating = null;
      controller.submitRating = async (r) => { submittedRating = r; };

      await controller.nextReadingItem();
      assert.strictEqual(submittedRating, 3);
    });

    test('45 <= score < 60 maps to Rating 2 (Hard)', async () => {
      const controller = new SrsReviewController();
      controller.dom = { btnReadingNext: makeEl('button') };
      controller.hasCompletedReadingForCurrentCard = true;
      controller.currentReadingScore = 52;
      let submittedRating = null;
      controller.submitRating = async (r) => { submittedRating = r; };

      await controller.nextReadingItem();
      assert.strictEqual(submittedRating, 2);
    });

    test('score < 45 maps to Rating 1 (Again - Requeue card)', async () => {
      const controller = new SrsReviewController();
      controller.dom = { btnReadingNext: makeEl('button') };
      controller.hasCompletedReadingForCurrentCard = true;
      controller.currentReadingScore = 38;
      let submittedRating = null;
      controller.submitRating = async (r) => { submittedRating = r; };

      await controller.nextReadingItem();
      assert.strictEqual(submittedRating, 1);
    });
  });

  describe('6. Pedagogical Feedback & Absence of Rigid Technical Notice (Phần A & D)', () => {
    test('srs-review.html strictly omits rigid technical notice (F0, Chao 5-scale disclaimer)', () => {
      const htmlPath = path.resolve('frontend/srs-review.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');

      // Rigid technical disclaimer must be completely absent
      assert.strictEqual(htmlContent.includes('🎯 Đánh giá thanh điệu (Tone Evaluation)'), false);
      assert.strictEqual(htmlContent.includes('Phân tích đường cao độ F0 theo thang chuẩn Chao'), false);
      assert.strictEqual(htmlContent.includes('không nhận diện chữ ASR'), false);

      // Friendly pedagogical analyzing state
      assert.strictEqual(htmlContent.includes('Đang lắng nghe và đánh giá phát âm của bạn...'), true);

      // Label "Số thẻ hoàn thành" in completed statistics
      assert.strictEqual(htmlContent.includes('Số thẻ hoàn thành'), true);

      // Strictly omit item 2 (Tỷ lệ thành công) and item 3 (Thời gian trung bình mỗi thẻ)
      assert.strictEqual(htmlContent.includes('Tỷ lệ thành công'), false);
      assert.strictEqual(htmlContent.includes('Thời gian trung bình mỗi thẻ'), false);

      // 3 standard completion action buttons must exist
      assert.strictEqual(htmlContent.includes('id="btnCompletionRestartLesson"'), true);
      assert.strictEqual(htmlContent.includes('id="btnCompletionNextChapter"'), true);
      assert.strictEqual(htmlContent.includes('id="btnCompletionBackToCatalog"'), true);
    });
  });

  describe('7. Web Audio Client-side VAD & Silence Rejection (Phần B)', () => {
    test('handleRecordingFinished rejects pure silence / low energy without calling server', async () => {
      const controller = new SrsReviewController();
      controller.dom = {
        readingStateError: makeEl('div'),
        readingErrorTitle: makeEl('div'),
        readingErrorMessage: makeEl('div'),
        readingErrorAdvice: makeEl('div'),
        btnReadingNext: makeEl('button')
      };
      controller.readingPeakRms = 0.005; // Low energy silence
      controller.readingSpeechFrames = 0; // No speech detected

      let assessCalled = false;
      controller.assessReadingPronunciation = () => { assessCalled = true; };

      const dummyBlob = { size: 500, type: 'audio/webm' };
      await controller.handleRecordingFinished(dummyBlob);

      // Server should NOT be called
      assert.strictEqual(assessCalled, false);
      // Friendly pedagogical error state should be rendered
      assert.strictEqual(controller.dom.readingErrorTitle.textContent, 'Không phát hiện thấy tiếng nói');
      assert.strictEqual(controller.dom.readingStateError.classList.contains('d-none'), false);
    });

    test('handleRecordingFinished rejects pure zero silence (muted microphone)', async () => {
      const controller = new SrsReviewController();
      controller.dom = {
        readingStateError: makeEl('div'),
        readingErrorTitle: makeEl('div'),
        readingErrorMessage: makeEl('div'),
        readingErrorAdvice: makeEl('div'),
        btnReadingNext: makeEl('button')
      };
      controller.readingAudioContext = { state: 'running' };
      controller.readingPeakRms = 0; // Pure digital silence / muted mic
      controller.readingSpeechFrames = 0;

      let assessCalled = false;
      controller.assessReadingPronunciation = () => { assessCalled = true; };

      const dummyBlob = { size: 500, type: 'audio/webm' };
      await controller.handleRecordingFinished(dummyBlob);

      // Server should NOT be called
      assert.strictEqual(assessCalled, false);
      // Friendly pedagogical error state should be rendered
      assert.strictEqual(controller.dom.readingErrorTitle.textContent, 'Không phát hiện thấy tiếng nói');
      assert.strictEqual(controller.dom.readingStateError.classList.contains('d-none'), false);
    });

    test('cleanUpReadingMedia properly cleans up VAD interval, AudioContext, and resets peak RMS', () => {
      const controller = new SrsReviewController();
      let closedAudioCtx = false;
      controller.readingAudioContext = {
        state: 'running',
        close: () => { closedAudioCtx = true; }
      };
      controller.readingVadInterval = setInterval(() => {}, 1000);
      controller.readingPeakRms = 0.08;
      controller.readingSpeechFrames = 15;
      controller.readingAnalyser = {};

      controller.cleanUpReadingMedia();

      assert.strictEqual(controller.readingVadInterval, null);
      assert.strictEqual(controller.readingAudioContext, null);
      assert.strictEqual(closedAudioCtx, true);
      assert.strictEqual(controller.readingAnalyser, null);
      assert.strictEqual(controller.readingPeakRms, 0);
      assert.strictEqual(controller.readingSpeechFrames, 0);
    });
  });

  describe('8. Completed State Action Buttons & Session Progression (Phần D & E)', () => {
    test('restartCurrentSession triggers startTopicSession with review action when lessonId was completed', () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'reading';
      controller.syncToolbarUi = () => {};
      controller._lastCompletedSession = {
        lessonId: 5,
        activeAction: 'continue',
        activeMode: 'reading'
      };

      let restartCalled = false;
      controller.startTopicSession = (topicId, action) => {
        restartCalled = true;
        assert.strictEqual(topicId, 5);
        assert.strictEqual(action, 'review'); // Must start with review from card 0
      };

      controller.restartCurrentSession();
      assert.strictEqual(restartCalled, true);
    });

    test('restartCurrentSession triggers startChapterSession with deck and review action', () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'reading';
      controller.syncToolbarUi = () => {};
      controller._lastCompletedSession = {
        currentChapterIdx: 2,
        activeGroup: 'radicals50',
        activeMode: 'reading'
      };

      let chapterCalled = false;
      controller.startChapterSession = (deck, idx, action) => {
        chapterCalled = true;
        assert.strictEqual(deck, 'radicals50');
        assert.strictEqual(idx, 2);
        assert.strictEqual(action, 'review');
      };

      controller.restartCurrentSession();
      assert.strictEqual(chapterCalled, true);
    });

    test('advanceToNextChapter advances to next topic with continue action', () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'reading';
      controller.syncToolbarUi = () => {};
      controller._lastCompletedSession = {
        lessonId: 1, // HSK 1 lesson 1
        activeGroup: 'hsk1',
        activeMode: 'reading'
      };

      let nextTopicCalled = false;
      controller.startTopicSession = (topicId, action) => {
        nextTopicCalled = true;
        assert.strictEqual(topicId, 2);
        assert.strictEqual(action, 'continue');
      };

      controller.advanceToNextChapter();
      assert.strictEqual(nextTopicCalled, true);
      assert.strictEqual(controller.currentChapterIdx, 1);
    });

    test('startChapterSession handles polymorphic arguments defensively (chapterIdx without deck)', async () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'reading';
      controller.activeGroup = 'radicals50';
      controller.fetchRadicalsData = async () => {};
      controller.commonRadicals = Array.from({ length: 50 }, (_, i) => ({ radicalId: i + 1, character: '字', pinyin: 'zì' }));
      let queueInited = false;
      controller.initSessionQueue = (queue, isReview, startIndex) => {
        queueInited = true;
        assert.strictEqual(queue.length, 10);
        assert.strictEqual(controller.currentChapterIdx, 1);
        assert.strictEqual(startIndex, 0);
      };
      await controller.startChapterSession(1, 'review');
      assert.strictEqual(queueInited, true);
    });
  });
});
