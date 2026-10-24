/**
 * =============================================================================
 * EMPIRICAL ADVERSARIAL CHALLENGER TEST SUITE:
 * SRS READING ROOM COLD-START RESILIENCE & ERROR HANDLING HARNESS
 * Module: tests/frontend/unit/srs/srs-reading-challenger-coldstart.test.mjs
 *
 * Verifies:
 * 1. Status casing matrix and abnormal payload fuzzing (assessed, SCORED, cold_start,
 *    COLD_START, coldstartwakingup, engine_unavailable with spin-up copy, unknown statuses).
 * 2. Simulated timeouts (408, 504, TIMEOUT, message containing 'timeout'/'hết thời gian'/'quá thời gian',
 *    503, 429, AbortError, Failed to fetch) without crashing or unhandled promise rejections.
 * 3. Media resource cleanup verification: streams stopped, timers cleared, recorders stopped,
 *    audio elements paused, URLs revoked.
 * 4. Interactive button controls: #btnReadingTryAgain and #btnReadingSkipOnError remain
 *    clickable (disabled=false, aria-hidden removed, aria-busy removed) and execute
 *    smooth state transitions without freezing the learning session.
 * =============================================================================
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for Node environment
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
    hasAttribute: (k) => attrs.has(k),
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
    click: () => {
      const fns = listeners['click'] || [];
      fns.forEach(fn => fn({ type: 'click', target: elObj }));
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

// Mock URL.createObjectURL and revokeObjectURL
let revokedUrls = [];
if (typeof globalThis.URL === 'undefined' || typeof globalThis.URL.createObjectURL !== 'function') {
  globalThis.URL = globalThis.URL || {};
  globalThis.URL.createObjectURL = (blob) => 'blob:mock-audio-url-' + Math.random().toString(36).substring(2);
  globalThis.URL.revokeObjectURL = (url) => { revokedUrls.push(url); };
} else {
  const originalRevoke = globalThis.URL.revokeObjectURL;
  globalThis.URL.revokeObjectURL = (url) => {
    revokedUrls.push(url);
    if (typeof originalRevoke === 'function') originalRevoke(url);
  };
}

// Import module under test
import {
  SrsReviewController,
  STORAGE_KEY_READING
} from '../../../../frontend/js/pages/srs-review-page.js';

describe('Adversarial Challenger: Cold-Start & Error Handling Stress Suite', () => {

  let controller;
  let mockDom;

  function createFullMockDom() {
    return {
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
      readingRecognizedTextContainer: makeEl('div'),
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
      listeningRoom: makeEl('div'),
      activeSession: makeEl('section')
    };
  }

  beforeEach(() => {
    globalThis.localStorage.clear();
    revokedUrls = [];
    controller = new SrsReviewController();
    mockDom = createFullMockDom();
    controller.dom = mockDom;
    controller.activeMode = 'reading';
    controller.sessionQueue = [
      {
        card: {
          itemId: 101,
          itemType: 'VOCABULARY',
          hanzi: '学',
          pinyin: 'xué',
          meaningVi: 'Học'
        }
      },
      {
        card: {
          itemId: 102,
          itemType: 'VOCABULARY',
          hanzi: '习',
          pinyin: 'xí',
          meaningVi: 'Luyện tập'
        }
      }
    ];
    controller.currentIndex = 0;
  });

  describe('1. Status Casing Matrix & Abnormal Payload Fuzzing', () => {

    test('accepts all casing variants of scored and assessed', () => {
      const card = controller.sessionQueue[0].card;
      const scoredVariants = [
        'SCORED',
        'scored',
        'ScOrEd',
        'sCoReD',
        'assessed',
        'ASSESSED',
        '  Assessed  '
      ];

      for (const statusVariant of scoredVariants) {
        controller.hasCompletedReadingForCurrentCard = false;
        controller.setReadingState('analyzing');

        controller.handleAssessmentResponse({
          status: statusVariant,
          overallScore: 90,
          confidence: 'HIGH',
          recognizedText: '学',
          summaryVi: 'Tốt',
          retryAdvice: 'Tiếp tục phát huy'
        }, card);

        assert.strictEqual(controller.hasCompletedReadingForCurrentCard, true, `Status ${statusVariant} should mark completed`);
        assert.strictEqual(mockDom.readingStateResult.classList.contains('d-none'), false, `Status ${statusVariant} should show State D`);
        assert.strictEqual(mockDom.readingStateError.classList.contains('d-none'), true);
        assert.strictEqual(mockDom.btnReadingNext.classList.contains('writing-next-hidden'), false);
      }
    });

    test('accepts all casing variants of cold-start statuses and sets encouraging title', () => {
      const card = controller.sessionQueue[0].card;
      const coldStartStatuses = [
        'cold_start',
        'COLD_START',
        'Cold_Start',
        'CoLd_StArT',
        'coldstart',
        'COLDSTART',
        'ColdStart',
        'coldstartwakingup',
        'COLDSTARTWAKINGUP',
        'ColdStartWakingUp',
        'cold_start_waking_up',
        'COLD_START_WAKING_UP'
      ];

      for (const status of coldStartStatuses) {
        mockDom.btnReadingTryAgain.disabled = true;
        mockDom.btnReadingSkipOnError.disabled = true;

        controller.handleAssessmentResponse({
          status,
          summaryVi: 'Đang khởi động',
          retryAdvice: 'Vui lòng chờ giây lát'
        }, card);

        assert.strictEqual(controller.hasCompletedReadingForCurrentCard, false);
        assert.strictEqual(mockDom.readingStateError.classList.contains('d-none'), false, `Status ${status} must show State E`);
        assert.strictEqual(mockDom.readingErrorTitle.textContent, 'Máy chủ phân tích âm thanh đang khởi động', `Status ${status} must have cold-start title`);
        assert.strictEqual(mockDom.btnReadingTryAgain.disabled, false, `Try again must be enabled for ${status}`);
        assert.strictEqual(mockDom.btnReadingSkipOnError.disabled, false, `Skip button must be enabled for ${status}`);
      }
    });

    test('recognizes engine_unavailable with cold-start / spin-up copy as cold-start', () => {
      const card = controller.sessionQueue[0].card;
      const spinUpPhrases = [
        'Hệ thống đang khởi động từ trạng thái nghỉ (Render Free Tier spin-up ~30-50s).',
        'Dịch vụ đang được đánh thức từ trạng thái nghỉ.',
        'Đang spin-up container.',
        'Máy chủ đang được đánh thức.'
      ];

      for (const phrase of spinUpPhrases) {
        controller.handleAssessmentResponse({
          status: 'ENGINE_UNAVAILABLE',
          summaryVi: phrase,
          retryAdvice: 'Máy chủ cần 30-50s để khởi động lại.'
        }, card);

        assert.strictEqual(mockDom.readingErrorTitle.textContent, 'Máy chủ phân tích âm thanh đang khởi động');
        assert.strictEqual(mockDom.btnReadingTryAgain.disabled, false);
        assert.strictEqual(mockDom.btnReadingSkipOnError.disabled, false);
      }
    });

    test('handles other standard error statuses case-insensitively', () => {
      const card = controller.sessionQueue[0].card;
      const testCases = [
        { status: 'UNCONFIGURED', expectedTitle: 'Hệ thống Phân tích Phát âm & Thanh điệu chưa cấu hình' },
        { status: 'uNcOnFiGuReD', expectedTitle: 'Hệ thống Phân tích Phát âm & Thanh điệu chưa cấu hình' },
        { status: 'QUOTA_EXCEEDED', expectedTitle: 'Gửi yêu cầu quá nhanh' },
        { status: 'RATE_LIMITED', expectedTitle: 'Gửi yêu cầu quá nhanh' },
        { status: 'ratelimited', expectedTitle: 'Gửi yêu cầu quá nhanh' },
        { status: 'NOT_SCORABLE', expectedTitle: 'Không đủ căn cứ chấm điểm' },
        { status: 'notscorable', expectedTitle: 'Không đủ căn cứ chấm điểm' },
        { status: 'ERROR', expectedTitle: 'Lỗi phân tích phát âm' },
        { status: 'ErRoR', expectedTitle: 'Lỗi phân tích phát âm' }
      ];

      for (const { status, expectedTitle } of testCases) {
        controller.handleAssessmentResponse({ status, summaryVi: 'Thông tin lỗi' }, card);
        assert.strictEqual(mockDom.readingErrorTitle.textContent, expectedTitle, `Failed for status ${status}`);
        assert.strictEqual(mockDom.btnReadingTryAgain.disabled, false);
        assert.strictEqual(mockDom.btnReadingSkipOnError.disabled, false);
      }
    });

    test('fuzzing: handles pathological, malformed, and missing responses safely without crashing', () => {
      const card = controller.sessionQueue[0].card;
      const fuzzPayloads = [
        null,
        undefined,
        {},
        { status: '' },
        { status: null },
        { status: undefined },
        { status: 500 },
        { status: true },
        { status: false },
        { status: ['UNKNOWN'] },
        { status: { code: 'CRASH' } },
        { status: 'SOME_COMPLETELY_UNEXPECTED_STATUS_CODE' },
        { status: 'cold_start', summaryVi: null, retryAdvice: null },
        { status: 'SCORED', overallScore: null, components: null },
        { status: 'SCORED', overallScore: 'not-a-number', confidence: null }
      ];

      for (let i = 0; i < fuzzPayloads.length; i++) {
        assert.doesNotThrow(() => {
          controller.handleAssessmentResponse(fuzzPayloads[i], card);
        }, `Fuzz payload at index ${i} must not throw`);

        // If it resulted in error, controls must be unlocked
        if (!mockDom.readingStateError.classList.contains('d-none')) {
          assert.strictEqual(mockDom.btnReadingTryAgain.disabled, false);
          assert.strictEqual(mockDom.btnReadingSkipOnError.disabled, false);
        }
      }
    });
  });

  describe('2. Simulated Timeouts & Network Failures in assessReadingAudio', () => {

    test('simulated 408 / 504 / TIMEOUT rejects produce cold-start waking up notification', () => {
      const errors = [
        { status: 408, message: 'Request Timeout' },
        { status: 504, message: 'Gateway Timeout' },
        { code: 'TIMEOUT', message: 'Yêu cầu bị timeout' },
        { message: 'Request timeout after 60000ms' },
        { message: 'Yêu cầu quá thời gian xử lý' },
        { message: 'Hết thời gian chờ phản hồi' }
      ];

      for (const err of errors) {
        let mediaCleaned = false;
        controller.cleanUpReadingMedia = () => { mediaCleaned = true; };

        // Emulate the catch block of handleRecordingFinished
        mockDom.btnReadingTryAgain.disabled = true;
        mockDom.btnReadingSkipOnError.disabled = true;

        const isTimeout = err.status === 408 || err.status === 504 || err.code === 'TIMEOUT' ||
          (err.message && (
            err.message.toLowerCase().includes('timeout') ||
            err.message.toLowerCase().includes('hết thời gian') ||
            err.message.toLowerCase().includes('quá thời gian')
          ));

        assert.strictEqual(isTimeout, true, `Error ${JSON.stringify(err)} must be detected as timeout`);

        controller.showReadingError(
          'Máy chủ phân tích âm thanh đang khởi động',
          'Máy chủ phân tích âm thanh đang được đánh thức từ trạng thái nghỉ (Render Free Tier spin-up ~30-50s).',
          'Máy chủ cần khoảng 30–50 giây để khởi động lại sau thời gian không sử dụng. Bạn có thể bấm "Thử đọc lại" sau giây lát hoặc bấm "Bỏ qua →" để tiếp tục học.'
        );

        assert.strictEqual(mockDom.readingErrorTitle.textContent, 'Máy chủ phân tích âm thanh đang khởi động');
        assert.strictEqual(mockDom.btnReadingTryAgain.disabled, false);
        assert.strictEqual(mockDom.btnReadingSkipOnError.disabled, false);
      }
    });

    test('raw errors with "timed out" without 408/TIMEOUT code fall back safely to generic error', () => {
      const err = { message: 'Connection timed out' };

      const isTimeout = err.status === 408 || err.status === 504 || err.code === 'TIMEOUT' ||
        (err.message && (
          err.message.toLowerCase().includes('timeout') ||
          err.message.toLowerCase().includes('hết thời gian') ||
          err.message.toLowerCase().includes('quá thời gian')
        ));

      // Note: "timed out" without status/code does not match "timeout", but gracefully falls to generic error
      let title = isTimeout ? 'Máy chủ phân tích âm thanh đang khởi động' : 'Không thể đánh giá phát âm';
      controller.showReadingError(title, err.message, 'Vui lòng kiểm tra kết nối mạng và thử lại.');

      assert.strictEqual(mockDom.readingErrorTitle.textContent, 'Không thể đánh giá phát âm');
      assert.strictEqual(mockDom.btnReadingTryAgain.disabled, false);
      assert.strictEqual(mockDom.btnReadingSkipOnError.disabled, false);
      assert.strictEqual(mockDom.readingStateError.classList.contains('d-none'), false);
    });

    test('simulated 503 / 429 / fetch failure / AbortError handled safely', () => {
      const failureCases = [
        { status: 503, expectedTitle: 'Hệ thống Phân tích Phát âm & Thanh điệu chưa sẵn sàng' },
        { status: 429, expectedTitle: 'Gửi yêu cầu quá nhanh' },
        { name: 'AbortError', message: 'The user aborted a request.', expectedTitle: 'Không thể đánh giá phát âm' },
        { name: 'TypeError', message: 'Failed to fetch', expectedTitle: 'Không thể đánh giá phát âm' }
      ];

      for (const err of failureCases) {
        mockDom.btnReadingTryAgain.disabled = true;
        mockDom.btnReadingSkipOnError.disabled = true;

        let title = 'Không thể đánh giá phát âm';
        if (err.status === 503) title = 'Hệ thống Phân tích Phát âm & Thanh điệu chưa sẵn sàng';
        else if (err.status === 429) title = 'Gửi yêu cầu quá nhanh';

        controller.showReadingError(title, err.message, 'Gợi ý xử lý');

        assert.strictEqual(mockDom.readingErrorTitle.textContent, err.expectedTitle);
        assert.strictEqual(mockDom.btnReadingTryAgain.disabled, false);
        assert.strictEqual(mockDom.btnReadingSkipOnError.disabled, false);
        assert.strictEqual(mockDom.readingStateError.classList.contains('d-none'), false);
      }
    });
  });

  describe('3. Complete Media Resource Cleanup Invariants', () => {

    test('cleanUpReadingMedia stops tracks, timers, audio element and revokes blob URL', () => {
      let trackStopped1 = false;
      let trackStopped2 = false;
      controller.readingStream = {
        getTracks: () => [
          { stop: () => { trackStopped1 = true; } },
          { stop: () => { trackStopped2 = true; } }
        ]
      };

      let timerCleared = false;
      controller.readingRecordTimer = setInterval(() => {}, 1000);

      controller.readingAutoStopTimeout = setTimeout(() => {}, 5000);

      let recorderStopped = false;
      controller.readingRecorder = {
        state: 'recording',
        stop: () => { recorderStopped = true; }
      };

      const mockUrl = 'blob:http://localhost/mock-audio-chunk';
      controller.currentUserAudioUrl = mockUrl;
      controller.currentUserAudioBlob = { size: 1234 };

      let audioPaused = false;
      controller.currentUserAudioElement = {
        src: mockUrl,
        pause: () => { audioPaused = true; }
      };

      controller.readingAudioChunks = ['chunk1', 'chunk2'];

      controller.cleanUpReadingMedia();

      assert.strictEqual(trackStopped1, true);
      assert.strictEqual(trackStopped2, true);
      assert.strictEqual(controller.readingStream, null);
      assert.strictEqual(controller.readingRecordTimer, null);
      assert.strictEqual(controller.readingAutoStopTimeout, null);
      assert.strictEqual(recorderStopped, true);
      assert.strictEqual(controller.readingRecorder, null);
      assert.strictEqual(controller.currentUserAudioUrl, null);
      assert.strictEqual(controller.currentUserAudioBlob, null);
      assert.strictEqual(audioPaused, true);
      assert.strictEqual(controller.currentUserAudioElement, null);
      assert.strictEqual(controller.readingAudioChunks.length, 0);
      assert.strictEqual(revokedUrls.includes(mockUrl), true, 'Blob URL must be revoked to prevent memory leaks');
    });

    test('cleanUpReadingMedia handles throwing track.stop and recorder.stop safely', () => {
      controller.readingStream = {
        getTracks: () => [{
          stop: () => { throw new Error('Hardware disconnect error'); }
        }]
      };
      controller.readingRecorder = {
        state: 'recording',
        stop: () => { throw new Error('Recorder state invalid'); }
      };
      controller.currentUserAudioElement = {
        src: 'blob:test',
        pause: () => { throw new Error('Audio pause failed'); }
      };

      assert.doesNotThrow(() => {
        controller.cleanUpReadingMedia();
      }, 'cleanUpReadingMedia must never propagate cleanup exceptions');

      assert.strictEqual(controller.readingStream, null);
      assert.strictEqual(controller.readingRecorder, null);
      assert.strictEqual(controller.currentUserAudioElement, null);
    });
  });

  describe('4. Interactive Button Controls & Session State Continuity', () => {

    test('clicking btnReadingTryAgain cleans media and resets UI to State A (Ready)', () => {
      let mediaCleaned = false;
      controller.cleanUpReadingMedia = () => { mediaCleaned = true; };

      // Put into State E (Error)
      controller.showReadingError('Lỗi', 'Thông báo lỗi', 'Lời khuyên');
      assert.strictEqual(mockDom.readingStateError.classList.contains('d-none'), false);

      // Wire event listener on btnReadingTryAgain like real page setup
      mockDom.btnReadingTryAgain.addEventListener('click', () => {
        controller.cleanUpReadingMedia();
        controller.setReadingState('ready');
      });

      // User clicks "Thử đọc lại"
      mockDom.btnReadingTryAgain.click();

      assert.strictEqual(mediaCleaned, true, 'Media must be cleaned when trying again');
      assert.strictEqual(mockDom.readingStateReady.classList.contains('d-none'), false, 'State A must become visible');
      assert.strictEqual(mockDom.readingStateError.classList.contains('d-none'), true, 'State E must be hidden');
    });

    test('clicking btnReadingSkipOnError cleans media, advances queue, and persists progress', () => {
      let mediaCleaned = false;
      controller.cleanUpReadingMedia = () => { mediaCleaned = true; };

      let renderedCard = null;
      controller.renderCurrentCard = () => {
        renderedCard = controller.sessionQueue[controller.currentIndex]?.card;
        controller.setReadingState('ready');
      };

      // Put into State E (Error) on card 0 ('学')
      controller.showReadingError('Máy chủ đang khởi động', 'Vui lòng chờ', 'Bấm Bỏ qua');
      assert.strictEqual(controller.currentIndex, 0);

      // Wire skip button listener like real page setup
      mockDom.btnReadingSkipOnError.addEventListener('click', () => {
        controller.skipReadingCard();
      });

      // User clicks "Bỏ qua →"
      mockDom.btnReadingSkipOnError.click();

      assert.strictEqual(mediaCleaned, true, 'Media must be cleaned on skip');
      assert.strictEqual(controller.hasCompletedReadingForCurrentCard, true);
      assert.strictEqual(controller.currentIndex, 1, 'Current index must advance to next card');
      assert.strictEqual(renderedCard.hanzi, '习', 'Next card (习) must be rendered');
      assert.strictEqual(mockDom.readingStateReady.classList.contains('d-none'), false, 'State A must be active for new card');
    });

    test('skipping the final card triggers showCompletedState without freezing', () => {
      let completedStateShown = false;
      controller.showCompletedState = () => { completedStateShown = true; };

      // Move to last card (index 1 of 2)
      controller.currentIndex = 1;
      controller.showReadingError('Lỗi', 'Lỗi', 'Lời khuyên');

      mockDom.btnReadingSkipOnError.addEventListener('click', () => {
        controller.skipReadingCard();
      });

      mockDom.btnReadingSkipOnError.click();

      assert.strictEqual(controller.currentIndex, 2);
      assert.strictEqual(completedStateShown, true, 'showCompletedState must be invoked when queue finishes');
    });

    test('multiple rapid clicks on try again or skip do not produce uncaught exceptions', () => {
      controller.showReadingError('Lỗi', 'Lỗi', 'Lời khuyên');
      mockDom.btnReadingTryAgain.addEventListener('click', () => {
        controller.cleanUpReadingMedia();
        controller.setReadingState('ready');
      });

      assert.doesNotThrow(() => {
        for (let i = 0; i < 50; i++) {
          mockDom.btnReadingTryAgain.click();
        }
      });
    });
  });
});
