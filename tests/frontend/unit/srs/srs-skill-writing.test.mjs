/**
 * =============================================================================
 * UNIT TEST SUITE: MULTI-SKILL SRS & VOCABULARY WRITING ORCHESTRATOR
 * Module: tests/frontend/unit/srs/srs-skill-writing.test.mjs
 *
 * Verifies:
 * - Hanzi character splitting contract across 1, 2, 3+ character words.
 * - VocabWritingOrchestrator instantiation and lifecycle destruction.
 * - Responsive layout adaptation contract: Dual box vs Stepper mode.
 * - buildReviewPayload contract with explicit skill cardType (LISTENING, WRITING, READING).
 * - Backward compatibility when cardType is omitted.
 * - Quota independence: multi-skill reviews share word-level identity without double-counting.
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitHanziCharacters,
  extractCleanChar,
  loadStrokeData,
  clearStrokeCache
} from '../../../../frontend/js/ui/character-writing/stroke-data-loader.js';
import {
  VocabWritingOrchestrator,
  WRITING_MODES
} from '../../../../frontend/js/ui/character-writing/vocab-writing-orchestrator.js';
import {
  buildReviewPayload,
  mapRatingValue,
  SrsReviewController
} from '../../../../frontend/js/pages/srs-review-page.js';

describe('Unit: Multi-Skill SRS & Vocabulary Writing Orchestrator', () => {

  describe('1. CJK Character Splitting & Extraction (splitHanziCharacters)', () => {
    test('extracts single Hanzi character accurately', () => {
      const chars = splitHanziCharacters('请');
      assert.deepStrictEqual(chars, ['请']);
    });

    test('extracts two Hanzi characters for compound word', () => {
      const chars = splitHanziCharacters('学生');
      assert.deepStrictEqual(chars, ['学', '生']);
    });

    test('extracts three Hanzi characters for 3-glyph word', () => {
      const chars = splitHanziCharacters('对不起');
      assert.deepStrictEqual(chars, ['对', '不', '起']);
    });

    test('extracts base character from Kangxi radical with parenthesized variant', () => {
      const chars = splitHanziCharacters('水(氵)');
      assert.deepStrictEqual(chars, ['水']);
    });

    test('filters out Latin punctuation, spaces, numbers, and symbols', () => {
      const chars = splitHanziCharacters('你好, Hello 123 !');
      assert.deepStrictEqual(chars, ['你', '好']);
    });

    test('returns empty array for non-Chinese strings or nullish input', () => {
      assert.deepStrictEqual(splitHanziCharacters(''), []);
      assert.deepStrictEqual(splitHanziCharacters('Hello World'), []);
      assert.deepStrictEqual(splitHanziCharacters(null), []);
      assert.deepStrictEqual(splitHanziCharacters(undefined), []);
    });
  });

  describe('2. Local Stroke Geometry Coverage for HSK 1 Curriculum', () => {
    test('loads local stroke data for 1-character HSK 1 words without network lookup', async () => {
      clearStrokeCache();
      const data = await loadStrokeData('请');
      assert.notStrictEqual(data, null, 'Stroke data for 请 must exist locally');
      assert.ok(Array.isArray(data.strokes), 'Strokes must be an array');
      assert.ok(Array.isArray(data.medians), 'Medians must be an array');
    });

    test('loads local stroke data for both characters of compound word "学生"', async () => {
      clearStrokeCache();
      const d1 = await loadStrokeData('学');
      const d2 = await loadStrokeData('生');
      assert.notStrictEqual(d1, null, 'Stroke data for 学 must exist locally');
      assert.notStrictEqual(d2, null, 'Stroke data for 生 must exist locally');
      assert.ok(d1.strokes.length > 0);
      assert.ok(d2.strokes.length > 0);
    });

    test('loads local stroke data for all 3 characters of "对不起"', async () => {
      clearStrokeCache();
      const chars = ['对', '不', '起'];
      const results = await Promise.all(chars.map(c => loadStrokeData(c)));
      results.forEach((res, i) => {
        assert.notStrictEqual(res, null, `Stroke data for ${chars[i]} must exist locally`);
        assert.ok(res.strokes.length > 0);
      });
    });
  });

  describe('3. VocabWritingOrchestrator Architecture & Modes', () => {
    test('requires a mountElement DOM container on instantiation', () => {
      assert.throws(() => {
        new VocabWritingOrchestrator({});
      }, /requires a mountElement/);
    });

    test('initializes with default DEMO mode when not specified', () => {
      const mockContainer = { replaceChildren: () => {}, appendChild: () => {} };
      const orch = new VocabWritingOrchestrator({ mountElement: mockContainer });
      assert.strictEqual(orch.currentMode, WRITING_MODES.DEMO);
      orch.destroy();
    });

    test('determines side-by-side mode appropriately (unified to false for all words)', () => {
      const mockContainer = { replaceChildren: () => {}, appendChild: () => {} };
      const orch = new VocabWritingOrchestrator({ mountElement: mockContainer });

      // 1 char -> false
      orch.characters = ['请'];
      assert.strictEqual(orch.isDualSideBySideMode(), false);

      // 3 chars -> false (requires stepper)
      orch.characters = ['对', '不', '起'];
      assert.strictEqual(orch.isDualSideBySideMode(), false);

      // 2 chars -> false (unified to stepper tab mode like 3-char words)
      orch.characters = ['学', '生'];
      assert.strictEqual(orch.isDualSideBySideMode(), false);

      orch.destroy();
    });

    test('destroy() cleans up child engines and resets DOM safely', () => {
      const mockContainer = { replaceChildren: () => {} };
      const orch = new VocabWritingOrchestrator({ mountElement: mockContainer });
      orch.destroy();
      assert.strictEqual(orch.isDestroyed, true);
      assert.strictEqual(orch.engines.size, 0);
      assert.strictEqual(orch.missingStrokesSet.size, 0);
    });

    test('supports demoOnly configuration for vocabulary detail view', () => {
      const mockContainer = { replaceChildren: () => {}, appendChild: () => {} };
      const orch = new VocabWritingOrchestrator({
        mountElement: mockContainer,
        initialMode: 'demo',
        demoOnly: true
      });
      assert.strictEqual(orch.demoOnly, true);
      assert.strictEqual(orch.currentMode, WRITING_MODES.DEMO);
      orch.destroy();
    });
  });

  describe('4. Review Payload Contract with Skill cardType (POST /api/v1/srs/review)', () => {
    test('builds valid review payload with LISTENING skill cardType', () => {
      const payload = buildReviewPayload({
        itemType: 'VOCABULARY',
        itemId: 201,
        cardType: 'LISTENING',
        rating: 3,
        reviewTimeSeconds: 4
      });

      assert.deepStrictEqual(payload, {
        itemType: 'VOCABULARY',
        itemId: 201,
        cardType: 'LISTENING',
        rating: 3,
        reviewTimeSeconds: 4
      });
    });

    test('builds valid review payload with WRITING skill cardType', () => {
      const payload = buildReviewPayload({
        itemType: 'VOCABULARY',
        itemId: 201,
        cardType: 'WRITING',
        rating: 4,
        reviewTimeSeconds: 8
      });

      assert.deepStrictEqual(payload, {
        itemType: 'VOCABULARY',
        itemId: 201,
        cardType: 'WRITING',
        rating: 4,
        reviewTimeSeconds: 8
      });
    });

    test('preserves backward compatibility when cardType is omitted', () => {
      const payload = buildReviewPayload({
        itemType: 'VOCABULARY',
        itemId: 105,
        rating: 2,
        reviewTimeSeconds: 6
      });

      assert.deepStrictEqual(payload, {
        itemType: 'VOCABULARY',
        itemId: 105,
        rating: 2,
        reviewTimeSeconds: 6
      });
      assert.strictEqual('cardType' in payload, false, 'Omitting cardType should not attach empty field');
    });

    test('normalizes lowercase skill string to uppercase ("writing" -> "WRITING")', () => {
      const payload = buildReviewPayload({
        itemType: 'VOCABULARY',
        itemId: 105,
        cardType: 'writing',
        rating: 3,
        reviewTimeSeconds: 5
      });

      assert.strictEqual(payload.cardType, 'WRITING');
    });
  });

  describe('5. SRS Writing Review Room Controller & Writing Lifecycle', () => {
    test('initializes controller with clean writing state', () => {
      const controller = new SrsReviewController();
      assert.strictEqual(controller.isWritingOutlineShown, false);
      assert.ok(Array.isArray(controller.writingEngines));
      assert.strictEqual(controller.writingEngines.length, 0);
      assert.strictEqual(controller.vocabId, null);
    });

    test('parseQueryParams extracts vocabId and sets writing mode', () => {
      const origWindow = global.window;
      try {
        global.window = {
          location: {
            search: '?mode=writing&group=hsk1&vocabId=101'
          }
        };

        const controller = new SrsReviewController();
        controller.parseQueryParams();

        assert.strictEqual(controller.activeMode, 'writing');
        assert.strictEqual(controller.activeGroup, 'hsk1');
        assert.strictEqual(controller.vocabId, 101);
      } finally {
        global.window = origWindow;
      }
    });

    test('startVocabSession queues matching vocabulary card from curriculum', async () => {
      const controller = new SrsReviewController();
      controller.renderCurrentCard = () => {}; // Stub view render

      await controller.startVocabSession(101, 'continue');

      assert.strictEqual(controller.sessionQueue.length, 1);
      const card = controller.sessionQueue[0].card;
      assert.strictEqual(card.itemId, 101);
      assert.strictEqual(card.hanzi, '请');
      assert.strictEqual(card.pinyin, 'qǐng');
      assert.strictEqual(card.meaningHanViet, 'Thỉnh');
      assert.strictEqual(card.meaningVi, 'Mời; mời mọc');
      assert.strictEqual(card.itemType, 'VOCABULARY');
    });

    test('toggleWritingOutline toggles visibility state and button label', () => {
      const controller = new SrsReviewController();
      let outlineState = false;
      const mockEngine = {
        writer: {
          showOutline: () => { outlineState = true; },
          hideOutline: () => { outlineState = false; }
        },
        isOutlineShown: false
      };
      controller.writingEngines = [mockEngine];

      let btnText = '👁️ Xem gợi ý';
      let btnPressed = 'false';
      controller.dom = {
        btnWritingOutline: {
          get textContent() { return btnText; },
          set textContent(v) { btnText = v; },
          setAttribute: (name, val) => { if (name === 'aria-pressed') btnPressed = val; }
        }
      };

      // Toggle ON
      controller.toggleWritingOutline();
      assert.strictEqual(controller.isWritingOutlineShown, true);
      assert.strictEqual(mockEngine.isOutlineShown, true);
      assert.strictEqual(outlineState, true);
      assert.strictEqual(btnText, '👁️ Ẩn gợi ý');
      assert.strictEqual(btnPressed, 'true');

      // Toggle OFF
      controller.toggleWritingOutline();
      assert.strictEqual(controller.isWritingOutlineShown, false);
      assert.strictEqual(mockEngine.isOutlineShown, false);
      assert.strictEqual(outlineState, false);
      assert.strictEqual(btnText, '👁️ Xem gợi ý');
      assert.strictEqual(btnPressed, 'false');
    });

    test('clearWriting triggers quiz restart without throwing', () => {
      const controller = new SrsReviewController();
      let quizRestarted = false;
      const mockEngine = {
        startQuizSession: () => { quizRestarted = true; }
      };
      controller.writingEngines = [mockEngine];

      controller.clearWriting();
      assert.strictEqual(quizRestarted, true, 'clearWriting must invoke startQuizSession');
    });

    test('replayWriting animates character and resets quiz on completion', () => {
      const controller = new SrsReviewController();
      let animated = false;
      let quizRestarted = false;
      const mockEngine = {
        writer: {
          animateCharacter: (options) => {
            animated = true;
            if (options && typeof options.onComplete === 'function') {
              options.onComplete();
            }
          }
        },
        startQuizSession: () => { quizRestarted = true; }
      };
      controller.writingEngines = [mockEngine];

      controller.replayWriting();
      assert.strictEqual(animated, true, 'replayWriting must call animateCharacter');
      assert.strictEqual(quizRestarted, true, 'replayWriting must restart quiz upon animation completion');
    });

    test('nextWritingItem advances index, updates statistics, and saves writing progress', async () => {
      const controller = new SrsReviewController();
      controller.sessionQueue = [
        { card: { itemId: 101, itemType: 'VOCABULARY', hanzi: '请' } },
        { card: { itemId: 102, itemType: 'VOCABULARY', hanzi: '请问' } }
      ];
      controller.currentIndex = 0;
      controller.cardStartTime = Date.now() - 3000;
      controller.renderCurrentCard = () => {};

      let savedMode = null;
      let savedIndex = null;
      controller.persistProgress = (mode, index) => {
        savedMode = mode;
        savedIndex = index;
      };

      await controller.nextWritingItem();

      assert.strictEqual(controller.currentIndex, 1, 'Current index must advance by 1');
      assert.strictEqual(controller.stats.totalReviewed, 1, 'Total reviewed must increment');
      assert.strictEqual(controller.stats.goodEasyCount, 1, 'Good/Easy count must increment');
      assert.strictEqual(savedMode, 'writing', 'Progress must be saved under writing mode');
      assert.strictEqual(savedIndex, 1, 'Progress saved index must be 1');
    });
  });
});
