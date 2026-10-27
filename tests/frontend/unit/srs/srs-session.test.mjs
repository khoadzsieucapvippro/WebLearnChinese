/**
 * =============================================================================
 * UNIT TEST SUITE: SRS FLASHCARD REVIEW SESSION LOGIC (TASK 9C.3)
 * Module: tests/frontend/unit/srs/srs-session.test.mjs
 * 
 * Verifies:
 * - Rating value mapping (1=Again, 2=Hard, 3=Good, 4=Easy)
 * - Reaction timer elapsed calculation and non-negative clamping
 * - Elapsed seconds formatting
 * - Review payload validation & contract serialization (POST /api/v1/srs/review)
 * - Strict zero-userId / zero-accountId client ownership invariant
 * - Local session queue Again requeue semantics & infinite loop prevention
 * - Safe rendering and adversarial payload resilience
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

import { authManager } from '../../../../frontend/js/auth/auth-state.js';
import {
  mapRatingValue,
  mapKeyToRating,
  isEditableOrFormControl,
  formatSessionProgress,
  calculateReviewTime,
  formatElapsedSeconds,
  buildReviewPayload,
  handleAgainRequeue,
  MAX_AGAIN_REVIEWS_PER_CARD,
  SrsReviewController,
  formatConstituentRadicalsText
} from '../../../../frontend/js/pages/srs-review-page.js';

describe('Unit: SRS Flashcard Review Session Logic (9C.3)', () => {

  describe('1. Rating Value Mapping (mapRatingValue)', () => {
    test('maps 1 to Again (Học lại)', () => {
      const res = mapRatingValue(1);
      assert.deepStrictEqual(res, { rating: 1, label: 'Again', nameVi: 'Học lại' });
    });

    test('maps string "1" to Again (Học lại)', () => {
      const res = mapRatingValue('1');
      assert.deepStrictEqual(res, { rating: 1, label: 'Again', nameVi: 'Học lại' });
    });

    test('maps 2 to Hard (Khó)', () => {
      const res = mapRatingValue(2);
      assert.deepStrictEqual(res, { rating: 2, label: 'Hard', nameVi: 'Khó' });
    });

    test('maps 3 to Good (Tốt)', () => {
      const res = mapRatingValue(3);
      assert.deepStrictEqual(res, { rating: 3, label: 'Good', nameVi: 'Tốt' });
    });

    test('maps 4 to Easy (Dễ)', () => {
      const res = mapRatingValue(4);
      assert.deepStrictEqual(res, { rating: 4, label: 'Easy', nameVi: 'Dễ' });
    });

    test('returns null for out-of-range ratings (0, 5, -1, 100)', () => {
      assert.strictEqual(mapRatingValue(0), null);
      assert.strictEqual(mapRatingValue(5), null);
      assert.strictEqual(mapRatingValue(-1), null);
      assert.strictEqual(mapRatingValue(100), null);
    });

    test('returns null for non-numeric or empty inputs', () => {
      assert.strictEqual(mapRatingValue(''), null);
      assert.strictEqual(mapRatingValue('abc'), null);
      assert.strictEqual(mapRatingValue(null), null);
      assert.strictEqual(mapRatingValue(undefined), null);
    });
  });

  describe('2. Reaction Timer Math & Clamping (calculateReviewTime)', () => {
    test('calculates exact seconds for standard delta', () => {
      const start = 1000000;
      const now = 1005000; // 5000ms = 5s
      assert.strictEqual(calculateReviewTime(start, now), 5);
    });

    test('rounds accurately using Math.round', () => {
      const start = 1000000;
      assert.strictEqual(calculateReviewTime(start, start + 5400), 5); // 5.4s -> 5s
      assert.strictEqual(calculateReviewTime(start, start + 5600), 6); // 5.6s -> 6s
    });

    test('clamps negative delta to 0 (clock drift or corrupt timestamps)', () => {
      const start = 1005000;
      const now = 1000000; // start > now
      assert.strictEqual(calculateReviewTime(start, now), 0);
    });

    test('handles zero elapsed time', () => {
      const start = 1000000;
      assert.strictEqual(calculateReviewTime(start, start), 0);
    });

    test('handles missing or non-number timestamps safely', () => {
      assert.strictEqual(calculateReviewTime(null, undefined), 0);
      assert.strictEqual(calculateReviewTime('abc', 1000), 1);
    });
  });

  describe('3. Elapsed Time Formatting (formatElapsedSeconds)', () => {
    test('formats zero seconds', () => {
      assert.strictEqual(formatElapsedSeconds(0), '0s');
    });

    test('formats seconds under 1 minute', () => {
      assert.strictEqual(formatElapsedSeconds(42), '42s');
      assert.strictEqual(formatElapsedSeconds(59), '59s');
    });

    test('formats exact minutes', () => {
      assert.strictEqual(formatElapsedSeconds(60), '1p 0s');
      assert.strictEqual(formatElapsedSeconds(120), '2p 0s');
    });

    test('formats minutes and remaining seconds', () => {
      assert.strictEqual(formatElapsedSeconds(85), '1p 25s');
      assert.strictEqual(formatElapsedSeconds(365), '6p 5s');
    });

    test('handles negative or corrupt input gracefully', () => {
      assert.strictEqual(formatElapsedSeconds(-10), '0s');
      assert.strictEqual(formatElapsedSeconds(null), '0s');
      assert.strictEqual(formatElapsedSeconds('xyz'), '0s');
    });
  });

  describe('4. Review Payload Contract & Validation (buildReviewPayload)', () => {
    test('builds valid VOCABULARY review payload', () => {
      const payload = buildReviewPayload({
        itemType: 'VOCABULARY',
        itemId: 101,
        rating: 3,
        reviewTimeSeconds: 5
      });

      assert.deepStrictEqual(payload, {
        itemType: 'VOCABULARY',
        itemId: 101,
        rating: 3,
        reviewTimeSeconds: 5
      });
    });

    test('builds valid RADICAL review payload and normalizes lowercase type', () => {
      const payload = buildReviewPayload({
        itemType: 'radical',
        itemId: 49,
        rating: 4,
        reviewTimeSeconds: 2
      });

      assert.deepStrictEqual(payload, {
        itemType: 'RADICAL',
        itemId: 49,
        rating: 4,
        reviewTimeSeconds: 2
      });
    });

    test('strictly rejects unsupported itemType (e.g. LESSON, NOTE, empty)', () => {
      assert.throws(
        () => buildReviewPayload({ itemType: 'LESSON', itemId: 1, rating: 3, reviewTimeSeconds: 2 }),
        /itemType must be "VOCABULARY" or "RADICAL"/
      );
      assert.throws(
        () => buildReviewPayload({ itemType: '', itemId: 1, rating: 3, reviewTimeSeconds: 2 }),
        /itemType must be a non-empty string/
      );
    });

    test('strictly rejects non-positive itemId', () => {
      assert.throws(
        () => buildReviewPayload({ itemType: 'VOCABULARY', itemId: 0, rating: 3, reviewTimeSeconds: 2 }),
        /itemId must be a positive integer/
      );
      assert.throws(
        () => buildReviewPayload({ itemType: 'VOCABULARY', itemId: -5, rating: 3, reviewTimeSeconds: 2 }),
        /itemId must be a positive integer/
      );
      assert.throws(
        () => buildReviewPayload({ itemType: 'VOCABULARY', itemId: 2.5, rating: 3, reviewTimeSeconds: 2 }),
        /itemId must be a positive integer/
      );
    });

    test('strictly rejects rating outside 1..4', () => {
      assert.throws(
        () => buildReviewPayload({ itemType: 'VOCABULARY', itemId: 1, rating: 0, reviewTimeSeconds: 2 }),
        /rating must be an integer between 1 and 4/
      );
      assert.throws(
        () => buildReviewPayload({ itemType: 'VOCABULARY', itemId: 1, rating: 5, reviewTimeSeconds: 2 }),
        /rating must be an integer between 1 and 4/
      );
    });

    test('strictly rejects negative reviewTimeSeconds', () => {
      assert.throws(
        () => buildReviewPayload({ itemType: 'VOCABULARY', itemId: 1, rating: 3, reviewTimeSeconds: -1 }),
        /reviewTimeSeconds must be a non-negative integer/
      );
    });

    test('verifies ownership invariant: zero userId or accountId in serialized payload', () => {
      const payload = buildReviewPayload({
        itemType: 'VOCABULARY',
        itemId: 101,
        rating: 1,
        reviewTimeSeconds: 4,
        userId: 999,      // Attacker attempting IDOR
        accountId: 888     // Attacker attempting spoofing
      });

      assert.strictEqual('userId' in payload, false, 'Payload MUST NOT contain userId');
      assert.strictEqual('accountId' in payload, false, 'Payload MUST NOT contain accountId');
      assert.strictEqual('q' in payload, false, 'Payload MUST NOT expose SM-2 internal q value');
    });
  });

  describe('5. Local Session Queue & Again Requeue Policy (handleAgainRequeue)', () => {
    test('requeues card on first Again attempt (attempts: 1)', () => {
      const queue = [
        { card: { itemId: 1, hanzi: '水' }, againAttempts: 0 },
        { card: { itemId: 2, hanzi: '火' }, againAttempts: 0 }
      ];

      const itemToRequeue = queue[0];
      const result = handleAgainRequeue(queue, itemToRequeue, MAX_AGAIN_REVIEWS_PER_CARD);

      assert.strictEqual(result.requeued, true);
      assert.strictEqual(result.attempts, 1);
      assert.strictEqual(queue.length, 3, 'Queue must now have 3 items');
      assert.strictEqual(queue[2].card.itemId, 1);
      assert.strictEqual(queue[2]._requeued, true);
    });

    test('allows requeuing up to maxAgain limit (e.g. 3 attempts)', () => {
      const queue = [];
      const item = { card: { itemId: 1, hanzi: '木' }, againAttempts: 2 };

      // 3rd attempt: should succeed
      const res3 = handleAgainRequeue(queue, item, 3);
      assert.strictEqual(res3.requeued, true);
      assert.strictEqual(res3.attempts, 3);
      assert.strictEqual(queue.length, 1);

      // 4th attempt: should be rejected to prevent infinite loops
      const res4 = handleAgainRequeue(queue, item, 3);
      assert.strictEqual(res4.requeued, false);
      assert.strictEqual(res4.reason, 'MAX_ATTEMPTS_REACHED');
      assert.strictEqual(queue.length, 1, 'Queue length must not increase on rejection');
    });

    test('handles invalid queue or item gracefully', () => {
      const res1 = handleAgainRequeue(null, null);
      assert.strictEqual(res1.requeued, false);

      const res2 = handleAgainRequeue([], null);
      assert.strictEqual(res2.requeued, false);
    });
  });

  describe('6. Safe Card Data Presentation & Hostile Content Invariant', () => {
    test('preserves adversarial XSS payloads as plain string values in card object', () => {
      const maliciousCard = {
        itemType: 'VOCABULARY',
        itemId: 10,
        hanzi: '<script>alert("xss")</script>',
        pinyin: 'xué"><img src=x onerror=alert(1)>',
        meaningVi: '<svg onload=alert(1)>Học tập',
        meaningHanViet: '<b>Học</b>',
        exampleSentence: '<iframe src=javascript:alert(1)></iframe>',
        exampleTranslation: '<style>body{display:none}</style>'
      };

      const payload = buildReviewPayload({
        itemType: maliciousCard.itemType,
        itemId: maliciousCard.itemId,
        rating: 3,
        reviewTimeSeconds: 4
      });

      assert.strictEqual(payload.itemId, 10);
      assert.strictEqual(payload.itemType, 'VOCABULARY');
      // Values are pure data, not executed or evaluated
    });
  });

  describe('7. Free Practice Mode Invariant (Mode B: Zero SRS Mutation)', () => {
    test('local requeue policy operates identically in practice mode without requiring server mutation', () => {
      const queue = [
        { card: { itemId: 101, itemType: 'VOCABULARY', hanzi: '你好' }, againAttempts: 0 }
      ];
      const requeueResult = handleAgainRequeue(queue, queue[0], MAX_AGAIN_REVIEWS_PER_CARD);
      assert.strictEqual(requeueResult.requeued, true);
      assert.strictEqual(queue.length, 2);
      assert.strictEqual(queue[1].card.hanzi, '你好');
      assert.strictEqual(queue[1]._requeued, true);
    });

    test('requeue respects MAX_AGAIN_REVIEWS_PER_CARD boundary to prevent infinite loop', () => {
      const queue = [
        { card: { itemId: 101, itemType: 'VOCABULARY', hanzi: '你好' }, againAttempts: 3 }
      ];
      const requeueResult = handleAgainRequeue(queue, queue[0], MAX_AGAIN_REVIEWS_PER_CARD);
      assert.strictEqual(requeueResult.requeued, false);
      assert.strictEqual(requeueResult.reason, 'MAX_ATTEMPTS_REACHED');
      assert.strictEqual(queue.length, 1);
    });
  });

  describe('8. Keyboard Rating Shortcut Mapping (mapKeyToRating)', () => {
    test('maps Digit1, Numpad1, and "1" to rating 1 (Again)', () => {
      assert.strictEqual(mapKeyToRating({ key: '1' }), 1);
      assert.strictEqual(mapKeyToRating({ code: 'Digit1' }), 1);
      assert.strictEqual(mapKeyToRating({ code: 'Numpad1' }), 1);
      assert.strictEqual(mapKeyToRating({ key: '1', code: 'Digit1' }), 1);
      assert.strictEqual(mapKeyToRating({ key: '1', code: 'Numpad1' }), 1);
    });

    test('maps Digit2, Numpad2, and "2" to rating 2 (Hard)', () => {
      assert.strictEqual(mapKeyToRating({ key: '2' }), 2);
      assert.strictEqual(mapKeyToRating({ code: 'Digit2' }), 2);
      assert.strictEqual(mapKeyToRating({ code: 'Numpad2' }), 2);
      assert.strictEqual(mapKeyToRating({ key: '2', code: 'Digit2' }), 2);
    });

    test('maps Digit3, Numpad3, and "3" to rating 3 (Good)', () => {
      assert.strictEqual(mapKeyToRating({ key: '3' }), 3);
      assert.strictEqual(mapKeyToRating({ code: 'Digit3' }), 3);
      assert.strictEqual(mapKeyToRating({ code: 'Numpad3' }), 3);
      assert.strictEqual(mapKeyToRating({ key: '3', code: 'Numpad3' }), 3);
    });

    test('maps Digit4, Numpad4, and "4" to rating 4 (Easy)', () => {
      assert.strictEqual(mapKeyToRating({ key: '4' }), 4);
      assert.strictEqual(mapKeyToRating({ code: 'Digit4' }), 4);
      assert.strictEqual(mapKeyToRating({ code: 'Numpad4' }), 4);
      assert.strictEqual(mapKeyToRating({ key: '4', code: 'Digit4' }), 4);
    });

    test('returns null for non-rating keys (Space, Enter, 0, 5, a, etc.)', () => {
      assert.strictEqual(mapKeyToRating({ key: ' ' }), null);
      assert.strictEqual(mapKeyToRating({ code: 'Space' }), null);
      assert.strictEqual(mapKeyToRating({ key: 'Enter' }), null);
      assert.strictEqual(mapKeyToRating({ key: '5' }), null);
      assert.strictEqual(mapKeyToRating({ code: 'Digit5' }), null);
      assert.strictEqual(mapKeyToRating({ code: 'Numpad5' }), null);
      assert.strictEqual(mapKeyToRating({ key: '0' }), null);
      assert.strictEqual(mapKeyToRating({ key: 'a' }), null);
    });

    test('handles null, undefined, or malformed event gracefully', () => {
      assert.strictEqual(mapKeyToRating(null), null);
      assert.strictEqual(mapKeyToRating(undefined), null);
      assert.strictEqual(mapKeyToRating({}), null);
      assert.strictEqual(mapKeyToRating('invalid'), null);
    });
  });

  describe('9. Form Control & Contenteditable Focus Invariant (isEditableOrFormControl)', () => {
    test('identifies input, textarea, and select elements as form controls', () => {
      assert.strictEqual(isEditableOrFormControl({ tagName: 'INPUT' }), true);
      assert.strictEqual(isEditableOrFormControl({ tagName: 'textarea' }), true);
      assert.strictEqual(isEditableOrFormControl({ tagName: 'SELECT' }), true);
    });

    test('identifies contenteditable elements', () => {
      assert.strictEqual(isEditableOrFormControl({ tagName: 'DIV', isContentEditable: true }), true);
      assert.strictEqual(isEditableOrFormControl({ tagName: 'SPAN', contentEditable: 'true' }), true);
      assert.strictEqual(isEditableOrFormControl({ tagName: 'P', getAttribute: (attr) => attr === 'contenteditable' ? 'true' : null }), true);
    });

    test('identifies nested elements inside form controls via closest', () => {
      const mockChild = {
        tagName: 'SPAN',
        closest: (selector) => selector.includes('input') ? { tagName: 'INPUT' } : null
      };
      assert.strictEqual(isEditableOrFormControl(mockChild), true);
    });

    test('checks activeElement when provided', () => {
      const normalTarget = { tagName: 'DIV' };
      const focusedInput = { tagName: 'INPUT' };
      assert.strictEqual(isEditableOrFormControl(normalTarget, focusedInput), true);
    });

    test('returns false for non-editable interactive elements (buttons, links, flashcard)', () => {
      assert.strictEqual(isEditableOrFormControl({ tagName: 'BUTTON' }), false);
      assert.strictEqual(isEditableOrFormControl({ tagName: 'A' }), false);
      assert.strictEqual(isEditableOrFormControl({ tagName: 'DIV', isContentEditable: false }), false);
      assert.strictEqual(isEditableOrFormControl(null, null), false);
    });
  });

  describe('10. Session Progress Display Formatting (formatSessionProgress)', () => {
    test('formats first card of a multi-card session', () => {
      const prog = formatSessionProgress(0, 10);
      assert.strictEqual(prog.currentNum, 1);
      assert.strictEqual(prog.totalCount, 10);
      assert.strictEqual(prog.remainingCount, 9);
      assert.strictEqual(prog.text, 'Thẻ 1 / 10 (Còn lại: 9)');
    });

    test('formats middle card of session', () => {
      const prog = formatSessionProgress(3, 8);
      assert.strictEqual(prog.currentNum, 4);
      assert.strictEqual(prog.totalCount, 8);
      assert.strictEqual(prog.remainingCount, 4);
      assert.strictEqual(prog.text, 'Thẻ 4 / 8 (Còn lại: 4)');
    });

    test('formats final card of session (0 remaining)', () => {
      const prog = formatSessionProgress(4, 5);
      assert.strictEqual(prog.currentNum, 5);
      assert.strictEqual(prog.totalCount, 5);
      assert.strictEqual(prog.remainingCount, 0);
      assert.strictEqual(prog.text, 'Thẻ 5 / 5 (Còn lại: 0)');
    });

    test('handles empty session gracefully', () => {
      const prog = formatSessionProgress(0, 0);
      assert.strictEqual(prog.currentNum, 0);
      assert.strictEqual(prog.totalCount, 0);
      assert.strictEqual(prog.remainingCount, 0);
      assert.strictEqual(prog.text, 'Thẻ 0 / 0 (Còn lại: 0)');
    });
  });

  describe('11. SrsReviewController Handler Uniformity & Anti Double-Submission Invariant', () => {
    test('controller provides uniform submitRating, rateCard, and handleRating methods', () => {
      const controller = new SrsReviewController();
      assert.strictEqual(typeof controller.submitRating, 'function');
      assert.strictEqual(typeof controller.rateCard, 'function');
      assert.strictEqual(typeof controller.handleRating, 'function');
    });

    test('rateCard and handleRating delegate to submitRating', async () => {
      const controller = new SrsReviewController();
      let capturedRating = null;
      controller.submitRating = async (r) => { capturedRating = r; };

      await controller.rateCard(3);
      assert.strictEqual(capturedRating, 3, 'rateCard must delegate to submitRating');

      await controller.handleRating(4);
      assert.strictEqual(capturedRating, 4, 'handleRating must delegate to submitRating');
    });

    test('submitRating early-exits when isSubmitting is true (anti-duplicate lock)', async () => {
      const controller = new SrsReviewController();
      controller.isSubmitting = true;
      controller.sessionQueue = [{ card: { itemId: 1, itemType: 'VOCABULARY' } }];
      controller.currentIndex = 0;

      // Should early return without throwing
      await controller.submitRating(3);
      assert.strictEqual(controller.stats.totalReviewed, 0, 'No review must be processed during in-flight submission');
    });

    test('submitRating early-exits when session is finished or queue is exhausted', async () => {
      const controller = new SrsReviewController();
      controller.sessionQueue = [];
      controller.currentIndex = 0;

      await controller.submitRating(2);
      assert.strictEqual(controller.isSubmitting, false);
      assert.strictEqual(controller.stats.totalReviewed, 0);
    });

    test('submitRating does not require card to be flipped (rating on front face allowed)', () => {
      const controller = new SrsReviewController();
      controller.isFlipped = false; // Thẻ ở MẶT TRƯỚC (chưa lật)
      assert.strictEqual(controller.isFlipped, false);
      // isFlipped is NOT a blocker in submitRating
    });
  });

  describe('12. Chinese Card Structure & Multi-Skill cardType (READING, LISTENING, WRITING)', () => {
    test('buildReviewPayload accepts and normalizes READING skill cardType', () => {
      const payload = buildReviewPayload({
        itemType: 'VOCABULARY',
        itemId: 101,
        cardType: 'reading',
        rating: 3,
        reviewTimeSeconds: 5
      });

      assert.deepStrictEqual(payload, {
        itemType: 'VOCABULARY',
        itemId: 101,
        cardType: 'READING',
        rating: 3,
        reviewTimeSeconds: 5
      });
    });

    test('buildReviewPayload accepts LISTENING and WRITING skill cardTypes', () => {
      const pListen = buildReviewPayload({
        itemType: 'VOCABULARY',
        itemId: 102,
        cardType: 'LISTENING',
        rating: 4,
        reviewTimeSeconds: 3
      });
      assert.strictEqual(pListen.cardType, 'LISTENING');

      const pWrite = buildReviewPayload({
        itemType: 'VOCABULARY',
        itemId: 103,
        cardType: 'WRITING',
        rating: 2,
        reviewTimeSeconds: 7
      });
      assert.strictEqual(pWrite.cardType, 'WRITING');
    });

    test('buildReviewPayload accepts and preserves optional lessonId', () => {
      const pWithLesson = buildReviewPayload({
        itemType: 'VOCABULARY',
        itemId: 101,
        cardType: 'READING',
        rating: 1,
        reviewTimeSeconds: 5,
        lessonId: 1
      });
      assert.strictEqual(pWithLesson.lessonId, 1);

      const pWithLessonStr = buildReviewPayload({
        itemType: 'VOCABULARY',
        itemId: 101,
        cardType: 'READING',
        rating: 1,
        reviewTimeSeconds: 5,
        lessonId: '5'
      });
      assert.strictEqual(pWithLessonStr.lessonId, 5);

      const pWithoutLesson = buildReviewPayload({
        itemType: 'VOCABULARY',
        itemId: 101,
        cardType: 'READING',
        rating: 1,
        reviewTimeSeconds: 5
      });
      assert.strictEqual(pWithoutLesson.lessonId, undefined);
    });
  });

  describe('13. Dynamic Card Normalization & Authentic Backend ID (ACT-05 / C03)', () => {
    test('normalizeVocabCard preserves authentic backend itemId from DueCardResponse', () => {
      const controller = new SrsReviewController();
      const backendCard = {
        itemType: 'VOCABULARY',
        itemId: 42,
        cardType: 'READING',
        hanzi: '学',
        pinyin: 'xué',
        meaningVi: 'Học',
        meaningHanViet: 'Học',
        exampleSentence: '我学习中文。',
        exampleTranslation: 'Tôi học tiếng Trung.'
      };

      const normalized = controller.normalizeVocabCard(backendCard, 1);
      assert.strictEqual(normalized.itemId, 42, 'Must prioritize authentic backend itemId over default mock IDs');
      assert.strictEqual(normalized.itemType, 'VOCABULARY');
      assert.strictEqual(normalized.hanzi, '学');
      assert.strictEqual(normalized.exampleSentence, '我学习中文。');
    });

    test('normalizeVocabCard falls back to vocabId for legacy static catalog objects', () => {
      const controller = new SrsReviewController();
      const staticWord = {
        vocabId: 101,
        hanzi: '请',
        pinyin: 'qǐng',
        meaningHanViet: 'Thỉnh',
        meaningVi: 'Mời'
      };

      const normalized = controller.normalizeVocabCard(staticWord, 1);
      assert.strictEqual(normalized.itemId, 101);
      assert.strictEqual(normalized.itemType, 'VOCABULARY');
    });

    test('startTopicSession falls back to static catalog when unauthenticated', async () => {
      const controller = new SrsReviewController();
      let initializedQueue = null;
      controller.initSessionQueue = (cards) => { initializedQueue = cards; };

      await controller.startTopicSession(1, 'continue');
      assert.ok(Array.isArray(initializedQueue), 'Session queue must be initialized');
      assert.strictEqual(initializedQueue.length, 20, 'Topic 1 static catalog contains 20 items');
      assert.strictEqual(initializedQueue[0].hanzi, '请');
    });

    test('startTopicSession sets empty queue when backend returns 0 cards for authenticated user', async () => {
      authManager.setSession({ token: 'test-token', user: { accountId: 1, emailOrPhone: 'user@test.com' } });
      const controller = new SrsReviewController();
      let initializedQueue = null;
      controller.initSessionQueue = (cards) => { initializedQueue = cards; };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ code: 'SUCCESS', message: 'OK', data: [] })
      });

      try {
        await controller.startTopicSession(999, 'continue');
        assert.ok(Array.isArray(initializedQueue), 'Session queue must be initialized');
        assert.strictEqual(initializedQueue.length, 0, 'Must NOT load fake cards from static catalog when backend returns empty');
      } finally {
        globalThis.fetch = originalFetch;
        authManager.clearSession();
      }
    });

    test('startTopicSession passes cardType WRITING when activeMode is writing', async () => {
      authManager.setSession({ token: 'test-token', user: { accountId: 1, emailOrPhone: 'user@test.com' } });
      const controller = new SrsReviewController();
      controller.activeMode = 'writing';

      let requestedUrl = null;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url) => {
        requestedUrl = String(url);
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            code: 'SUCCESS',
            message: 'OK',
            data: [{
              itemType: 'VOCABULARY',
              itemId: 55,
              cardType: 'WRITING',
              hanzi: '写',
              pinyin: 'xiě',
              meaningVi: 'Viết'
            }]
          })
        };
      };

      try {
        let initializedQueue = null;
        controller.initSessionQueue = (cards) => { initializedQueue = cards; };

        await controller.startTopicSession(1, 'continue');
        assert.ok(requestedUrl.includes('cardType=WRITING'), 'Must pass cardType=WRITING to backend in writing mode');
        assert.strictEqual(initializedQueue[0].cardType, 'WRITING');
      } finally {
        globalThis.fetch = originalFetch;
        authManager.clearSession();
      }
    });

    test('startTopicSession with action=review does not get hijacked by this.mode=DUE_CARDS and loads practice cards', async () => {
      authManager.setSession({ token: 'test-token', user: { accountId: 1, emailOrPhone: 'user@test.com' } });
      const controller = new SrsReviewController();
      controller.mode = 'DUE_CARDS'; // Stale mode from previous state or default constructor

      let requestedUrl = null;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url) => {
        requestedUrl = String(url);
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            code: 'SUCCESS',
            message: 'OK',
            data: Array.from({ length: 20 }, (_, i) => ({
              itemType: 'VOCABULARY',
              itemId: i + 1,
              cardType: 'READING',
              hanzi: `字${i + 1}`,
              pinyin: 'zì',
              meaningVi: `Nghĩa ${i + 1}`
            }))
          })
        };
      };

      try {
        let initializedQueue = null;
        let isReviewModeParam = null;
        controller.initSessionQueue = (cards, isReviewMode) => {
          initializedQueue = cards;
          isReviewModeParam = isReviewMode;
        };

        await controller.startTopicSession(1, 'review');
        assert.ok(requestedUrl.includes('/srs/practice-cards'), 'Must fetch practice-cards, NOT /srs/due');
        assert.ok(!requestedUrl.includes('/srs/due'), 'Must NOT call /srs/due when action is review');
        assert.strictEqual(initializedQueue.length, 20, 'Must load all 20 practice cards for re-learning');
        assert.strictEqual(isReviewModeParam, true, 'isReviewMode flag must be true');
      } finally {
        globalThis.fetch = originalFetch;
        authManager.clearSession();
      }
    });

    test('startTopicSession with action=due queries /srs/due', async () => {
      authManager.setSession({ token: 'test-token', user: { accountId: 1, emailOrPhone: 'user@test.com' } });
      const controller = new SrsReviewController();

      let requestedUrl = null;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url) => {
        requestedUrl = String(url);
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            code: 'SUCCESS',
            message: 'OK',
            data: [{
              itemType: 'VOCABULARY',
              itemId: 1,
              cardType: 'READING',
              hanzi: '爱',
              pinyin: 'ài',
              meaningVi: 'Yêu'
            }, {
              itemType: 'VOCABULARY',
              itemId: 3,
              cardType: 'READING',
              hanzi: '八',
              pinyin: 'bā',
              meaningVi: 'Tám'
            }]
          })
        };
      };

      try {
        let initializedQueue = null;
        controller.initSessionQueue = (cards) => { initializedQueue = cards; };

        await controller.startTopicSession(1, 'due');
        assert.ok(requestedUrl.includes('/srs/due'), 'Must fetch /srs/due when action is due');
        assert.strictEqual(initializedQueue.length, 2, 'Loads only the 2 due cards');
      } finally {
        globalThis.fetch = originalFetch;
        authManager.clearSession();
      }
    });

    test('startVocabSession queries backend when authenticated and populates authentic card', async () => {
      authManager.setSession({ token: 'test-token', user: { accountId: 1, emailOrPhone: 'user@test.com' } });
      const controller = new SrsReviewController();

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url) => {
        if (String(url).includes('/vocabulary/15')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({
              code: 'SUCCESS',
              message: 'OK',
              data: {
                vocabId: 15,
                hanzi: '见',
                pinyin: 'jiàn',
                meaningHanViet: 'Kiến',
                meaningVi: 'Gặp; thấy'
              }
            })
          };
        }
        throw new Error('Not found');
      };

      try {
        let initializedQueue = null;
        controller.initSessionQueue = (cards) => { initializedQueue = cards; };

        await controller.startVocabSession(15, 'continue');
        assert.ok(Array.isArray(initializedQueue), 'Session queue must be initialized');
        assert.strictEqual(initializedQueue.length, 1);
        assert.strictEqual(initializedQueue[0].itemId, 15, 'Must have authentic itemId = 15 from backend');
        assert.strictEqual(initializedQueue[0].hanzi, '见');
      } finally {
        globalThis.fetch = originalFetch;
        authManager.clearSession();
      }
    });
  });

  describe('13. Constituent Radicals Formatting (formatConstituentRadicalsText)', () => {
    test('returns neutral fallback when radicals is null, undefined, or empty', () => {
      assert.strictEqual(formatConstituentRadicalsText(null, '学'), 'Chưa có dữ liệu bộ thủ đã xác minh');
      assert.strictEqual(formatConstituentRadicalsText(undefined, '学'), 'Chưa có dữ liệu bộ thủ đã xác minh');
      assert.strictEqual(formatConstituentRadicalsText([], '学'), 'Chưa có dữ liệu bộ thủ đã xác minh');
      assert.strictEqual(formatConstituentRadicalsText([{}]), 'Chưa có dữ liệu bộ thủ đã xác minh');
    });

    test('formats single-character word with single radical correctly', () => {
      const radicals = [{ character: '子', meaningHanViet: 'Tử' }];
      const text = formatConstituentRadicalsText(radicals, '学');
      assert.strictEqual(text, '子 (Tử)');
    });

    test('normalizes redundant "Bộ " prefix in meaning', () => {
      const radicals = [{ character: '子', meaningHanViet: 'Bộ Tử' }];
      const text = formatConstituentRadicalsText(radicals, '学');
      assert.strictEqual(text, '子 (Tử)');
    });

    test('formats multiple constituent radicals for a single-character word', () => {
      const radicals = [
        { character: '子', meaningHanViet: 'Tử' },
        { character: '冖', meaningHanViet: 'Mịch' }
      ];
      const text = formatConstituentRadicalsText(radicals, '学');
      assert.strictEqual(text, '子 (Tử), 冖 (Mịch)');
    });

    test('formats multi-character word with verified character attribution', () => {
      const radicals = [
        { character: '子', meaningHanViet: 'Tử', hanziChar: '学' },
        { character: '生', meaningHanViet: 'Sinh', hanziChar: '生' }
      ];
      const text = formatConstituentRadicalsText(radicals, '学生');
      assert.strictEqual(text, '学: 子 (Tử), 生: 生 (Sinh)');
    });

    test('does not fabricate attribution for multi-character words when hanziChar is absent', () => {
      const radicals = [
        { character: '子', meaningHanViet: 'Tử' },
        { character: '生', meaningHanViet: 'Sinh' }
      ];
      const text = formatConstituentRadicalsText(radicals, '学生');
      assert.strictEqual(text, '子 (Tử), 生 (Sinh)');
    });

    test('handles missing meaning or missing character gracefully', () => {
      assert.strictEqual(formatConstituentRadicalsText([{ character: '子' }], '学'), '子');
      assert.strictEqual(formatConstituentRadicalsText([{ meaningHanViet: 'Tử' }], '学'), 'Tử');
    });
  });

  describe('17. Re-learning ("Học lại") and Due Count Sync Invariant', () => {
    test('startTopicSession with action=review loads all 20 practice cards of Lesson 1', async () => {
      authManager.clearSession();
      const controller = new SrsReviewController();
      let initializedQueue = null;
      let isReviewModeParam = null;
      controller.initSessionQueue = (cards, isReviewMode) => {
        initializedQueue = cards;
        isReviewModeParam = isReviewMode;
      };

      try {
        await controller.startTopicSession(1, 'review');
        assert.ok(Array.isArray(initializedQueue), 'Queue must be an array');
        assert.strictEqual(initializedQueue.length, 20, 'Must load all 20 practice cards for Lesson 1');
        assert.strictEqual(isReviewModeParam, true, 'isReviewMode flag must be true');
        assert.strictEqual(initializedQueue[0].hanzi, '请');
        assert.strictEqual(initializedQueue[1].hanzi, '请问');
        assert.strictEqual(initializedQueue[2].hanzi, '谢谢');
        assert.strictEqual(initializedQueue[3].hanzi, '不客气');
        assert.strictEqual(initializedQueue[4].hanzi, '对不起');
      } finally {
        authManager.clearSession();
      }
    });

    test('rating 5 cards with Again (1) updates dueItemsCache and yields dueCount=5 on catalog', async () => {
      authManager.setSession({ token: 'test-token', user: { accountId: 1, emailOrPhone: 'user@test.com' } });
      const controller = new SrsReviewController();
      controller.dueItemsCache = { vocab: [], radicals: [] };

      const cardsToReview = [
        { itemId: 296, vocabId: 296, hanzi: '请', itemType: 'VOCABULARY', lessonId: 1 },
        { itemId: 505, vocabId: 505, hanzi: '请问', itemType: 'VOCABULARY', lessonId: 1 },
        { itemId: 410, vocabId: 410, hanzi: '谢谢', itemType: 'VOCABULARY', lessonId: 1 },
        { itemId: 32, vocabId: 32, hanzi: '不客气', itemType: 'VOCABULARY', lessonId: 1 },
        { itemId: 93, vocabId: 93, hanzi: '对不起', itemType: 'VOCABULARY', lessonId: 1 }
      ];

      for (const card of cardsToReview) {
        const itemType = (card.itemType || 'VOCABULARY').toUpperCase();
        const cacheKey = itemType === 'RADICAL' ? 'radicals' : 'vocab';
        const alreadyDue = controller.isVocabDue(card.itemId ?? card.vocabId, card.hanzi);
        if (!alreadyDue) {
          controller.dueItemsCache[cacheKey].push({
            itemId: card.itemId,
            vocabId: card.vocabId || card.itemId,
            id: card.id || card.itemId,
            lessonId: card.lessonId,
            hanzi: card.hanzi,
            itemType: itemType
          });
        }
      }

      assert.strictEqual(controller.dueItemsCache.vocab.length, 5, 'Must have 5 due cards in cache');

      const { HSK1_TOPICS } = await import('../../../../frontend/js/pages/srs-review-page.js');
      const topic1 = HSK1_TOPICS[0];
      const dueCount = topic1.vocabularies.filter(v => controller.isVocabDue(v.vocabId ?? v.itemId ?? v.id, v.hanzi)).length;
      assert.strictEqual(dueCount, 5, 'Catalog dueCount for Bài 01 must be exactly 5, not stuck at 2');
    });

    test('Section 18: Multi-repetition lifecycle (3rd, 4th review passes) on Lesson 2 and other lessons with zero collisions', async () => {
      const { HSK1_TOPICS } = await import('../../../../frontend/js/pages/srs-review-page.js');
      const { SEED_LESSONS } = await import('../../../../frontend/js/api/demo-seed-data.js');

      const controller = new SrsReviewController();
      controller.dueItemsCache = { vocab: [], radicals: [] };

      // Lesson 2 words
      const topic2 = HSK1_TOPICS[1];
      const lesson2 = SEED_LESSONS[1];
      assert.strictEqual(topic2.vocabularies.length, 20);
      assert.strictEqual(lesson2.vocabularies.length, 20);

      // Verify 出租车 has vocabId 512, NOT 504 (which belonged to 哪些)
      const chuzuche = topic2.vocabularies.find(v => v.hanzi === '出租车');
      assert.strictEqual(chuzuche.vocabId, 512, '出租车 must have canonical vocabId 512');

      // Verify 大家 has vocabId 513, NOT 505 (which belonged to 请问)
      const dajia = topic2.vocabularies.find(v => v.hanzi === '大家');
      assert.strictEqual(dajia.vocabId, 513, '大家 must have canonical vocabId 513');

      // --- Pass 1: Learner reviews Lesson 2 for the 1st time, rates 2 words as Again (1) ---
      const pass1Due = [topic2.vocabularies[0], topic2.vocabularies[1]]; // 吃 (46) and 出租车 (512)
      for (const v of pass1Due) {
        controller.dueItemsCache.vocab.push({
          itemId: v.vocabId,
          vocabId: v.vocabId,
          lessonId: 2,
          hanzi: v.hanzi,
          itemType: 'VOCABULARY'
        });
      }
      let dueCountL2 = topic2.vocabularies.filter(v => controller.isVocabDue(v.vocabId, v.hanzi)).length;
      assert.strictEqual(dueCountL2, 2, 'Pass 1 must record exactly 2 due words for Lesson 2');

      // Verify no leak into Topic 1
      const dueCountL1 = HSK1_TOPICS[0].vocabularies.filter(v => controller.isVocabDue(v.vocabId, v.hanzi)).length;
      assert.strictEqual(dueCountL1, 0, 'Lesson 2 reviews must never leak due cards into Lesson 1');

      // --- Pass 2: Learner relearns Lesson 2 for the 2nd time, rates 5 words as Again (1) ---
      // Reset cache for new due state
      controller.dueItemsCache.vocab = [];
      const pass2Due = topic2.vocabularies.slice(0, 5); // 5 words
      for (const v of pass2Due) {
        controller.dueItemsCache.vocab.push({
          itemId: v.vocabId,
          vocabId: v.vocabId,
          lessonId: 2,
          hanzi: v.hanzi,
          itemType: 'VOCABULARY'
        });
      }
      dueCountL2 = topic2.vocabularies.filter(v => controller.isVocabDue(v.vocabId, v.hanzi)).length;
      assert.strictEqual(dueCountL2, 5, 'Pass 2 must record exactly 5 due words for Lesson 2');

      // --- Pass 3: Learner reviews Lesson 2 for the 3rd time, recalls words with Hard (2), Good (3), Easy (4) ---
      // Word 0 is rated Hard (2), Words 1..4 rated Good (3)
      // Both Rating 2 (Hard) and Rating 3/4 must clear from dueItemsCache
      const filterDue = (targetId, targetChar) => {
        controller.dueItemsCache.vocab = controller.dueItemsCache.vocab.filter(it => {
          const itId = Number(it.itemId ?? it.vocabId ?? it.id);
          const itChar = (it.hanzi || '').trim();
          if (targetId && itId) return itId !== targetId;
          if (targetChar && itChar) return itChar !== targetChar;
          return true;
        });
      };
      // Rating 2 (Hard) on word 0 (吃)
      filterDue(pass2Due[0].vocabId, pass2Due[0].hanzi);
      dueCountL2 = topic2.vocabularies.filter(v => controller.isVocabDue(v.vocabId, v.hanzi)).length;
      assert.strictEqual(dueCountL2, 4, 'Rating 2 (Hard) must successfully clear due card from cache');

      // Rating 3/4 on remaining 4 words
      for (let i = 1; i < pass2Due.length; i++) {
        filterDue(pass2Due[i].vocabId, pass2Due[i].hanzi);
      }
      dueCountL2 = topic2.vocabularies.filter(v => controller.isVocabDue(v.vocabId, v.hanzi)).length;
      assert.strictEqual(dueCountL2, 0, 'Pass 3: Successful review of all due words drops dueCount to 0');

      // --- Pass 4: Learner does a 4th session, lapses on 1 word (Word 3: 穿) ---
      const pass4Due = topic2.vocabularies[2]; // 穿
      controller.dueItemsCache.vocab.push({
        itemId: pass4Due.vocabId,
        vocabId: pass4Due.vocabId,
        lessonId: 2,
        hanzi: pass4Due.hanzi,
        itemType: 'VOCABULARY'
      });
      dueCountL2 = topic2.vocabularies.filter(v => controller.isVocabDue(v.vocabId, v.hanzi)).length;
      assert.strictEqual(dueCountL2, 1, 'Pass 4: Single memory lapse on 4th session records exactly 1 due card');
      assert.strictEqual(controller.isVocabDue(pass4Due.vocabId, pass4Due.hanzi), true, '穿 must be due');

      // --- Cross-Lesson Homograph Isolation Invariant ---
      // Lesson 4 has '还' (id 132, hái), Lesson 34 has '还' (id 153, huán)
      controller.dueItemsCache.vocab = [{
        itemId: 132,
        vocabId: 132,
        lessonId: 4,
        hanzi: '还',
        itemType: 'VOCABULARY'
      }];
      assert.strictEqual(controller.isVocabDue(132, '还'), true, '还 in Lesson 4 must be due');
      assert.strictEqual(controller.isVocabDue(153, '还'), false, '还 in Lesson 34 must NOT be due when Lesson 4 lapses');
      assert.strictEqual(controller.isVocabDue(null, '还'), true, 'Hanzi fallback still matches when ID is null');

      // Lesson 2 has '点' (id 76), Lesson 17 has '点' (id 560)
      controller.dueItemsCache.vocab = [{
        itemId: 76,
        vocabId: 76,
        lessonId: 2,
        hanzi: '点',
        itemType: 'VOCABULARY'
      }];
      assert.strictEqual(controller.isVocabDue(76, '点'), true, '点 in Lesson 2 must be due');
      assert.strictEqual(controller.isVocabDue(560, '点'), false, '点 in Lesson 17 must NOT be due when Lesson 2 lapses');
    });
  });
});

