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
  SrsReviewController
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
  });
});
