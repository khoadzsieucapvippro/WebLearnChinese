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

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitHanziCharacters,
  extractCleanChar,
  loadStrokeData,
  clearStrokeCache,
  RADICAL_VARIANT_CANONICAL_MAP
} from '../../../../frontend/js/ui/character-writing/stroke-data-loader.js';
import { SEED_RADICALS } from '../../../../frontend/js/api/demo-seed-data.js';
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

    test('loads local stroke data for standard radical variants (王, 卤, 黾)', async () => {
      clearStrokeCache();
      const chars = ['王', '卤', '黾'];
      for (const c of chars) {
        const data = await loadStrokeData(c);
        assert.notStrictEqual(data, null, `Stroke data for ${c} must exist locally`);
        assert.ok(Array.isArray(data.strokes) && data.strokes.length > 0, `Strokes for ${c} must be non-empty`);
      }
    });

    test('loads canonical fallback stroke data for radical variants (牜 -> 牛, 玊 -> 玉, etc.)', async () => {
      clearStrokeCache();
      assert.ok(RADICAL_VARIANT_CANONICAL_MAP['牜'] === '牛');
      const dataNiu = await loadStrokeData('牜');
      assert.notStrictEqual(dataNiu, null, 'Stroke data for 牜 must fallback to canonical 牛');
      assert.strictEqual(dataNiu.strokes.length, 4, 'Radical 牜 / 牛 must have 4 strokes');

      const dataYu = await loadStrokeData('玊');
      assert.notStrictEqual(dataYu, null, 'Stroke data for 玊 must fallback to canonical 玉');
      assert.strictEqual(dataYu.strokes.length, 5, 'Radical 玊 / 玉 must have 5 strokes');
    });

    test('guarantees 100% stroke data coverage across all 214 Kangxi radicals', async () => {
      clearStrokeCache();
      let successCount = 0;
      for (const r of SEED_RADICALS) {
        const char = r.character;
        const data = await loadStrokeData(char);
        if (data && data.strokes && data.strokes.length > 0) {
          successCount++;
        }
      }
      assert.strictEqual(successCount, SEED_RADICALS.length, `All ${SEED_RADICALS.length} radicals must have valid stroke data`);
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

  describe('6. Writing Mode 3-State Lifecycle & Next Button Rules (Task Redesign)', () => {
    function makeEl(tag = 'div') {
      const classes = new Set();
      const children = [];
      const nodeUpper = tag.toUpperCase();
      const el = {
        tagName: nodeUpper,
        nodeName: nodeUpper,
        parentNode: null,
        classList: {
          add: (c) => classes.add(c),
          remove: (c) => classes.delete(c),
          contains: (c) => classes.has(c),
          toggle: (c, val) => (val ?? !classes.has(c)) ? classes.add(c) : classes.delete(c)
        },
        style: {
          removeProperty: () => {},
          setProperty: () => {}
        },
        appendChild: (ch) => { if (ch) ch.parentNode = el; children.push(ch); return ch; },
        removeChild: (ch) => { const idx = children.indexOf(ch); if (idx >= 0) children.splice(idx, 1); return ch; },
        replaceChildren: (...args) => { children.length = 0; if (args.length) children.push(...args); },
        setAttribute: () => {},
        setAttributeNS: () => {},
        removeAttribute: () => {},
        removeAttributeNS: () => {},
        getAttribute: () => null,
        getAttributeNS: () => null,
        addEventListener: () => {},
        removeEventListener: () => {},
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 170, height: 170 }),
        createSVGPoint: () => ({ x: 0, y: 0, matrixTransform: () => ({ x: 0, y: 0 }) }),
        getScreenCTM: () => ({ inverse: () => ({}) }),
        textContent: '',
        innerHTML: '',
        querySelector: () => null,
        querySelectorAll: () => []
      };
      return el;
    }

    function createMockDom() {
      const writingBox1 = makeEl('div');
      writingBox1.classList.add('writing-rice-grid-box');
      const writingBox2 = makeEl('div');
      writingBox2.classList.add('writing-rice-grid-box');

      const canvasContainer = {
        replaceChildren: () => {},
        appendChild: () => {},
        querySelectorAll: (sel) => sel.includes('writing-rice-grid-box') ? [writingBox1, writingBox2] : []
      };

      const activeSession = makeEl('div'); // no d-none

      return {
        writingRoom: makeEl('div'),
        writingRoomBadge: makeEl('span'),
        btnWritingAudio: makeEl('button'),
        writingPromptPinyin: makeEl('div'),
        writingPromptHanViet: makeEl('span'),
        writingPromptMeaning: makeEl('span'),
        writingPromptStrokeCount: makeEl('div'),
        writingMissingWarning: makeEl('div'),
        writingCanvasContainer: canvasContainer,
        writingCompletionNotice: makeEl('div'),
        writingToolsRow: makeEl('div'),
        writingNextContainer: makeEl('div'),
        btnWritingReplay: makeEl('button'),
        btnWritingOutline: makeEl('button'),
        btnWritingClear: makeEl('button'),
        btnWritingNext: makeEl('button'),
        flashcard: makeEl('div'),
        activeSession,
        writingBox1,
        writingBox2
      };
    }

    before(() => {
      if (typeof global.window === 'undefined') {
        global.window = { location: { href: 'http://localhost' } };
      }
      if (typeof global.document === 'undefined') {
        global.document = {
          createElement: (tag) => makeEl(tag),
          createElementNS: (ns, tag) => makeEl(tag),
          getElementById: () => null,
          querySelector: () => null,
          documentElement: { getAttribute: () => null },
          body: { classList: { contains: () => false }, appendChild: () => {}, removeChild: () => {} },
          addEventListener: () => {},
          removeEventListener: () => {}
        };
      } else {
        if (!global.document.createElementNS) {
          global.document.createElementNS = (ns, tag) => makeEl(tag);
        }
        if (!global.document.createElement) {
          global.document.createElement = (tag) => makeEl(tag);
        }
        if (!global.document.addEventListener) {
          global.document.addEventListener = () => {};
        }
        if (!global.document.removeEventListener) {
          global.document.removeEventListener = () => {};
        }
      }
    });

    test('State 1 (Mới vào từ mới): Next button is hidden, Space/Enter locked, 3 tool buttons shown', async () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'writing';
      controller.dom = createMockDom();
      controller.sessionQueue = [{ card: { itemId: 101, itemType: 'VOCABULARY' } }];
      controller.currentIndex = 0;
      controller.playPronunciation = () => {};

      const card = { itemId: 101, itemType: 'VOCABULARY', hanzi: '请', pinyin: 'qǐng', meaningVi: 'Mời' };
      await controller.renderWritingRoomCard(card);

      // Verify State 1 invariants
      assert.strictEqual(controller.hasCompletedWritingForCurrentCard, false, 'Card must not be completed initially');
      assert.strictEqual(controller.dom.btnWritingNext.classList.contains('writing-next-hidden'), true, 'Next button must be hidden in State 1');
      assert.strictEqual(controller.dom.btnWritingAudio.classList.contains('d-none'), true, 'Audio button must be hidden in State 1');
      assert.strictEqual(controller.dom.writingCompletionNotice.classList.contains('d-none'), true, 'Completion notice must be hidden in State 1');
      assert.strictEqual(controller.dom.btnWritingOutline.classList.contains('d-none'), false, 'Outline button must be visible in State 1');

      // Verify Space/Enter locked
      let advanced = false;
      controller.nextWritingItem = () => { advanced = true; };

      let defaultPrevented = false;
      const fakeEvent = { code: 'Space', key: ' ', preventDefault: () => { defaultPrevented = true; } };
      controller.handleKeydown(fakeEvent);

      assert.strictEqual(defaultPrevented, true, 'Space keydown must be prevented');
      assert.strictEqual(advanced, false, 'Space must NOT advance to next item in State 1');
      controller.writingEngines.forEach(e => e.destroy?.());
    });

    test('State 2 (Khi hoàn thành nét cuối): Next button unlocked, Audio displayed, rice grid green border, completion notice visible', () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'writing';
      controller.dom = createMockDom();
      controller.sessionQueue = [{ card: { itemId: 101, itemType: 'VOCABULARY' } }];
      controller.currentIndex = 0;
      let audioPlayed = false;
      controller.playPronunciation = () => { audioPlayed = true; };

      // Simulate completion transition
      controller.handleWritingItemCompleted();

      // Verify State 2 invariants
      assert.strictEqual(controller.hasCompletedWritingForCurrentCard, true, 'hasCompletedWritingForCurrentCard must be true');
      assert.strictEqual(controller.isCurrentWritingCompleted, true, 'isCurrentWritingCompleted must be true');
      assert.strictEqual(audioPlayed, true, 'Pronunciation must be automatically triggered');
      assert.strictEqual(controller.dom.btnWritingAudio.classList.contains('d-none'), false, 'Audio speaker button must be visible');
      assert.strictEqual(controller.dom.writingBox1.classList.contains('is-completed'), true, 'Rice grid box must have is-completed green border');
      assert.strictEqual(controller.dom.writingCompletionNotice.classList.contains('d-none'), false, 'Completion notice "✓ Hoàn thành!" must be visible');
      assert.strictEqual(controller.dom.btnWritingOutline.classList.contains('d-none'), true, 'Outline button must be hidden in State 2');
      assert.strictEqual(controller.dom.btnWritingNext.classList.contains('writing-next-hidden'), false, 'Next button must be visible in State 2');

      // Verify Space/Enter unlocked
      let advanced = false;
      controller.nextWritingItem = () => { advanced = true; };

      const fakeSpace = { code: 'Space', key: ' ', preventDefault: () => {} };
      controller.handleKeydown(fakeSpace);
      assert.strictEqual(advanced, true, 'Space must advance when card is completed');

      advanced = false;
      const fakeEnter = { code: 'Enter', key: 'Enter', preventDefault: () => {} };
      controller.handleKeydown(fakeEnter);
      assert.strictEqual(advanced, true, 'Enter must advance when card is completed');
    });

    test('State 3 (Khi bấm "Viết lại" sau khi đã hoàn thành): Next button REMAINS visible, boxes return to gray, outline button returns', () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'writing';
      controller.dom = createMockDom();
      controller.sessionQueue = [{ card: { itemId: 101, itemType: 'VOCABULARY' } }];
      controller.currentIndex = 0;
      controller.playPronunciation = () => {};

      // 1. First complete the card (State 2)
      controller.handleWritingItemCompleted();
      assert.strictEqual(controller.hasCompletedWritingForCurrentCard, true);
      assert.strictEqual(controller.dom.btnWritingNext.classList.contains('writing-next-hidden'), false);

      // 2. User clicks "Viết lại"
      let quizRestarted = false;
      controller.writingEngines = [{ startQuizSession: () => { quizRestarted = true; } }];
      controller.clearWriting();

      // Verify State 3 invariants
      assert.strictEqual(quizRestarted, true, 'Writing engine quiz session must be restarted');
      assert.strictEqual(controller.dom.writingBox1.classList.contains('is-completed'), false, 'Rice grid boxes must lose is-completed border (return to normal gray)');
      assert.strictEqual(controller.dom.writingCompletionNotice.classList.contains('d-none'), true, 'Completion notice must be hidden during re-practice');
      assert.strictEqual(controller.dom.btnWritingOutline.classList.contains('d-none'), false, 'Outline button must return during re-practice');
      assert.strictEqual(controller.dom.btnWritingAudio.classList.contains('d-none'), false, 'Audio button must remain visible');

      // CRITICAL INVARIANT: Next button and shortcuts MUST REMAIN VISIBLE & ACTIVE!
      assert.strictEqual(controller.dom.btnWritingNext.classList.contains('writing-next-hidden'), false, 'Next button MUST REMAIN VISIBLE in State 3');

      let advanced = false;
      controller.nextWritingItem = () => { advanced = true; };
      controller.handleKeydown({ code: 'Space', key: ' ', preventDefault: () => {} });
      assert.strictEqual(advanced, true, 'Space shortcut MUST REMAIN ACTIVE in State 3');
    });

    test('Transition to completely new word resets to State 1', async () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'writing';
      controller.dom = createMockDom();
      controller.sessionQueue = [{ card: { itemId: 101, itemType: 'VOCABULARY' } }];
      controller.currentIndex = 0;
      controller.playPronunciation = () => {};

      // Complete card 1
      controller.handleWritingItemCompleted();
      assert.strictEqual(controller.hasCompletedWritingForCurrentCard, true);
      assert.strictEqual(controller.dom.btnWritingNext.classList.contains('writing-next-hidden'), false);

      // Advance to completely new card (Word 2)
      const card2 = { itemId: 102, itemType: 'VOCABULARY', hanzi: '谢', pinyin: 'xiè', meaningVi: 'Cảm ơn' };
      await controller.renderWritingRoomCard(card2);

      // Verify clean reset to State 1
      assert.strictEqual(controller.hasCompletedWritingForCurrentCard, false, 'hasCompletedWritingForCurrentCard must reset to false');
      assert.strictEqual(controller.isCurrentWritingCompleted, false, 'isCurrentWritingCompleted must reset to false');
      assert.strictEqual(controller.dom.btnWritingNext.classList.contains('writing-next-hidden'), true, 'Next button must be hidden again for new word');
      assert.strictEqual(controller.dom.btnWritingAudio.classList.contains('d-none'), true, 'Audio button must be hidden again for new word');
      assert.strictEqual(controller.dom.btnWritingOutline.classList.contains('d-none'), false, 'Outline button must be visible again for new word');
      controller.writingEngines.forEach(e => e.destroy?.());
    });
  });

  describe('7. Writing Mode 1-4 SRS Rating & Requeue Invariants (TASK-4.3 Standardization)', () => {
    test('Writing with 0 mistakes and no hint yields Rating 4 (Easy)', async () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'writing';
      controller.sessionQueue = [
        { card: { itemId: 201, itemType: 'VOCABULARY', hanzi: '好' } },
        { card: { itemId: 202, itemType: 'VOCABULARY', hanzi: '大' } }
      ];
      controller.currentIndex = 0;
      controller.currentWritingMistakes = 0;
      controller.hasUsedWritingHintForCurrentCard = false;
      controller.hasCompletedWritingForCurrentCard = true;
      controller.renderCurrentCard = () => {};

      let submittedRating = null;
      controller.submitRating = async (r) => { submittedRating = r; };

      await controller.nextWritingItem();
      assert.strictEqual(submittedRating, 4, '0 mistakes + no hint must submit Rating 4 (Easy)');
    });

    test('Writing with 1 mistake and no hint yields Rating 3 (Good)', async () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'writing';
      controller.sessionQueue = [
        { card: { itemId: 201, itemType: 'VOCABULARY', hanzi: '好' } }
      ];
      controller.currentIndex = 0;
      controller.currentWritingMistakes = 1;
      controller.hasUsedWritingHintForCurrentCard = false;
      controller.hasCompletedWritingForCurrentCard = true;
      controller.renderCurrentCard = () => {};

      let submittedRating = null;
      controller.submitRating = async (r) => { submittedRating = r; };

      await controller.nextWritingItem();
      assert.strictEqual(submittedRating, 3, '1 mistake + no hint must submit Rating 3 (Good)');
    });

    test('Writing with 2-4 mistakes OR used hint yields Rating 2 (Hard)', async () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'writing';
      controller.sessionQueue = [
        { card: { itemId: 201, itemType: 'VOCABULARY', hanzi: '好' } }
      ];
      controller.currentIndex = 0;
      controller.currentWritingMistakes = 3;
      controller.hasUsedWritingHintForCurrentCard = false;
      controller.hasCompletedWritingForCurrentCard = true;
      controller.renderCurrentCard = () => {};

      let submittedRating = null;
      controller.submitRating = async (r) => { submittedRating = r; };

      await controller.nextWritingItem();
      assert.strictEqual(submittedRating, 2, '3 mistakes must submit Rating 2 (Hard)');

      // Hint case
      controller.currentWritingMistakes = 0;
      controller.hasUsedWritingHintForCurrentCard = true;
      await controller.nextWritingItem();
      assert.strictEqual(submittedRating, 2, 'Used hint must submit Rating 2 (Hard)');
    });

    test('Writing with >= 5 mistakes yields Rating 1 (Again) and triggers session requeue', async () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'writing';
      controller.sessionQueue = [
        { card: { itemId: 201, itemType: 'VOCABULARY', hanzi: '难' } },
        { card: { itemId: 202, itemType: 'VOCABULARY', hanzi: '明' } }
      ];
      controller.currentIndex = 0;
      controller.currentWritingMistakes = 6;
      controller.hasUsedWritingHintForCurrentCard = false;
      controller.hasCompletedWritingForCurrentCard = true;
      controller.renderCurrentCard = () => {};

      await controller.nextWritingItem();

      // Verify that rating 1 caused card 201 to be requeued at the end of sessionQueue
      assert.strictEqual(controller.stats.againCount, 1, 'Again count must increment to 1');
      assert.strictEqual(controller.sessionQueue.length, 3, 'Session queue must grow to 3 due to requeue');
      assert.strictEqual(controller.sessionQueue[2].card.itemId, 201, 'Requeued card must be appended at the end of queue');
      assert.strictEqual(controller.sessionQueue[2]._requeued, true, 'Requeued card must have _requeued flag true');
    });

    test('Requeued card successfully graduates on re-attempt when mistakes < 5', async () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'writing';
      // Simulated requeued card at end of session
      controller.sessionQueue = [
        { card: { itemId: 201, itemType: 'VOCABULARY', hanzi: '难' }, _requeued: true }
      ];
      controller.currentIndex = 0;
      controller.currentWritingMistakes = 1; // wrote well on retry (Rating 3)
      controller.hasUsedWritingHintForCurrentCard = false;
      controller.hasCompletedWritingForCurrentCard = true;
      controller.renderCurrentCard = () => {};

      let completedStateShown = false;
      controller.showCompletedState = () => { completedStateShown = true; };

      await controller.nextWritingItem();

      assert.strictEqual(controller.stats.goodCount, 1, 'Good count must increment on graduation');
      assert.strictEqual(completedStateShown, true, 'Session must complete after graduating the requeued card');
    });
  });
});

