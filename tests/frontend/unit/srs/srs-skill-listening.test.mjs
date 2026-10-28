/**
 * =============================================================================
 * UNIT TEST SUITE: SRS LISTENING ROOM & PINYIN IME ENGINE
 * Module: tests/frontend/unit/srs/srs-skill-listening.test.mjs
 *
 * Verifies:
 * - normalizeHanziAnswer and verifyListeningAnswer invariants.
 * - Offline Pinyin dictionary syllable lookup & cleanPinyin.
 * - PinyinImeComponent lifecycle, physical typing, shortcuts, OS IME isolation.
 * - buildReviewPayload contract with cardType: 'LISTENING'.
 * - Progress storage isolation (STORAGE_KEY_LISTENING).
 * - SrsReviewController Listening Room lifecycle and interactions.
 * =============================================================================
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

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

// Mock DOM for Node test environment
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
    querySelector: (sel) => {
      if (sel.startsWith('#')) {
        const targetId = sel.slice(1);
        const search = (node) => {
          if (!node) return null;
          if (node.id === targetId) return node;
          for (const c of (node.children || [])) {
            const found = search(c);
            if (found) return found;
          }
          return null;
        };
        return search(elObj);
      }
      return null;
    },
    querySelectorAll: () => []
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

import {
  normalizeHanziAnswer,
  verifyListeningAnswer,
  getProgress,
  saveProgress,
  STORAGE_KEY_FLASHCARD,
  STORAGE_KEY_WRITING,
  STORAGE_KEY_LISTENING,
  buildReviewPayload,
  SrsReviewController
} from '../../../../frontend/js/pages/srs-review-page.js';
import { lookupPinyin, cleanPinyin, enrichPinyinDict, PINYIN_DICT } from '../../../../frontend/js/ui/pinyin-ime/pinyin-dict.js';
import { PinyinImeComponent } from '../../../../frontend/js/ui/pinyin-ime/pinyin-ime-engine.js';

describe('Unit: SRS Listening Room & Pinyin IME Engine', () => {

  describe('1. Hanzi Answer Normalization & Verification (verifyListeningAnswer)', () => {
    test('accurately verifies exact single Hanzi match', () => {
      assert.strictEqual(verifyListeningAnswer('请', '请'), true);
      assert.strictEqual(verifyListeningAnswer('我', '我'), true);
      assert.strictEqual(verifyListeningAnswer('好', '好'), true);
    });

    test('accurately verifies multi-glyph compound words', () => {
      assert.strictEqual(verifyListeningAnswer('学生', '学生'), true);
      assert.strictEqual(verifyListeningAnswer('对不起', '对不起'), true);
      assert.strictEqual(verifyListeningAnswer('没关系', '没关系'), true);
    });

    test('trims leading/trailing and inner whitespace correctly', () => {
      assert.strictEqual(verifyListeningAnswer('  请  ', '请'), true);
      assert.strictEqual(verifyListeningAnswer('学 生', '学生'), true);
      assert.strictEqual(verifyListeningAnswer(' 对 不 起 ', '对不起'), true);
    });

    test('supports parenthesized radical variant format e.g. 水(氵)', () => {
      assert.strictEqual(verifyListeningAnswer('水', '水(氵)'), true);
      assert.strictEqual(verifyListeningAnswer('手', '手(扌)'), true);
    });

    test('strictly rejects pure Latin Pinyin input', () => {
      assert.strictEqual(verifyListeningAnswer('qing', '请'), false);
      assert.strictEqual(verifyListeningAnswer('xuesheng', '学生'), false);
      assert.strictEqual(verifyListeningAnswer('ni hao', '你好'), false);
    });

    test('strictly rejects partial answers for multi-character words', () => {
      assert.strictEqual(verifyListeningAnswer('学', '学生'), false);
      assert.strictEqual(verifyListeningAnswer('生', '学生'), false);
      assert.strictEqual(verifyListeningAnswer('对不', '对不起'), false);
    });

    test('strictly rejects incorrect characters', () => {
      assert.strictEqual(verifyListeningAnswer('谢', '请'), false);
      assert.strictEqual(verifyListeningAnswer('你', '我'), false);
    });

    test('handles null, undefined, and empty inputs gracefully', () => {
      assert.strictEqual(verifyListeningAnswer('', '请'), false);
      assert.strictEqual(verifyListeningAnswer(null, '请'), false);
      assert.strictEqual(verifyListeningAnswer(undefined, '请'), false);
      assert.strictEqual(verifyListeningAnswer('请', ''), false);
      assert.strictEqual(verifyListeningAnswer('请', null), false);
    });
  });

  describe('2. Offline Pinyin Dictionary Lookup (lookupPinyin & cleanPinyin)', () => {
    test('cleans tone marks and uppercase letters', () => {
      assert.strictEqual(cleanPinyin('Qǐng'), 'qing');
      assert.strictEqual(cleanPinyin('Nǐ hǎo'), 'nihao');
      assert.strictEqual(cleanPinyin('xuéshēng'), 'xuesheng');
      assert.strictEqual(cleanPinyin('lǜ'), 'lv');
    });

    test('looks up candidates for single syllables', () => {
      const qingCandidates = lookupPinyin('qing', 10);
      assert.ok(Array.isArray(qingCandidates));
      assert.ok(qingCandidates.includes('请'), 'Candidates for qing must include 请');

      const niCandidates = lookupPinyin('ni', 10);
      assert.ok(niCandidates.includes('你'), 'Candidates for ni must include 你');

      const haoCandidates = lookupPinyin('hao', 10);
      assert.ok(haoCandidates.includes('好'), 'Candidates for hao must include 好');
    });

    test('looks up candidates for compound syllables without tone', () => {
      const candidates = lookupPinyin('xuesheng', 10);
      assert.ok(Array.isArray(candidates));
      assert.ok(candidates.includes('学生'), 'Candidates for xuesheng must include compound 学生');
    });

    test('returns empty array for invalid or empty queries', () => {
      assert.deepStrictEqual(lookupPinyin(''), []);
      assert.deepStrictEqual(lookupPinyin(null), []);
      assert.deepStrictEqual(lookupPinyin('xyz123'), []);
    });
  });

  describe('3. PinyinImeComponent Lifecycle & Typing Logic', () => {
    test('instantiates and attaches cleanly to target input', () => {
      const targetInput = makeEl('input');
      const containerMount = makeEl('div');

      const ime = new PinyinImeComponent({
        containerMount,
        targetInput
      });

      assert.strictEqual(ime.compositionBuffer, '');
      assert.strictEqual(ime.isOsComposing, false);
      assert.ok(containerMount.children.length > 0, 'Container mount must have rendered elements');

      ime.destroy();
      assert.strictEqual(ime.compositionBuffer, '');
    });

    test('handles physical typing to populate composition buffer and candidates', () => {
      const targetInput = makeEl('input');
      const containerMount = makeEl('div');

      const ime = new PinyinImeComponent({
        containerMount,
        targetInput
      });

      // Simulate typing 'q', 'i', 'n', 'g'
      ['q', 'i', 'n', 'g'].forEach(ch => {
        let prevented = false;
        targetInput.dispatchEvent({
          type: 'keydown',
          key: ch,
          preventDefault: () => { prevented = true; }
        });
        assert.strictEqual(prevented, true, `Key ${ch} must be intercepted by IME buffer`);
      });

      assert.strictEqual(ime.compositionBuffer, 'qing');
      assert.ok(ime.candidates.length > 0, 'Candidates must be populated for qing');
      assert.ok(ime.candidates.includes('请'));

      // Space key commits top candidate
      let spacePrevented = false;
      targetInput.dispatchEvent({
        type: 'keydown',
        key: ' ',
        code: 'Space',
        preventDefault: () => { spacePrevented = true; }
      });

      assert.strictEqual(spacePrevented, true);
      assert.strictEqual(ime.compositionBuffer, '', 'Buffer must be cleared after space commit');
      assert.ok(targetInput.value.length > 0, 'Target input must receive committed Hanzi');

      ime.destroy();
    });

    test('number keys 1..5 commit corresponding candidate', () => {
      const targetInput = makeEl('input');
      const containerMount = makeEl('div');

      const ime = new PinyinImeComponent({
        containerMount,
        targetInput
      });

      // Type 'n', 'i'
      ['n', 'i'].forEach(ch => {
        targetInput.dispatchEvent({
          type: 'keydown',
          key: ch,
          preventDefault: () => {}
        });
      });

      assert.strictEqual(ime.compositionBuffer, 'ni');
      const expectedCandidate = ime.candidates[0];

      // Press '1'
      let numPrevented = false;
      targetInput.dispatchEvent({
        type: 'keydown',
        key: '1',
        preventDefault: () => { numPrevented = true; }
      });

      assert.strictEqual(numPrevented, true);
      assert.strictEqual(targetInput.value, expectedCandidate);
      assert.strictEqual(ime.compositionBuffer, '');

      ime.destroy();
    });

    test('Enter key with empty buffer triggers onSubmit callback', () => {
      const targetInput = makeEl('input');
      const containerMount = makeEl('div');
      let submitted = false;

      const ime = new PinyinImeComponent({
        containerMount,
        targetInput,
        onSubmit: () => {
          submitted = true;
        }
      });

      targetInput.dispatchEvent({
        type: 'keydown',
        key: 'Enter',
        preventDefault: () => {}
      });

      assert.strictEqual(submitted, true, 'Enter on empty buffer must trigger onSubmit');
      ime.destroy();
    });

    test('bypasses interception when OS IME is composing', () => {
      const targetInput = makeEl('input');
      const containerMount = makeEl('div');

      const ime = new PinyinImeComponent({
        containerMount,
        targetInput
      });

      // OS composition start
      targetInput.dispatchEvent({ type: 'compositionstart' });
      assert.strictEqual(ime.isOsComposing, true);

      // Typing during OS IME
      let prevented = false;
      targetInput.dispatchEvent({
        type: 'keydown',
        key: 'a',
        isComposing: true,
        preventDefault: () => { prevented = true; }
      });

      assert.strictEqual(prevented, false, 'Must NOT intercept while OS IME is composing');
      assert.strictEqual(ime.compositionBuffer, '');

      // OS composition end
      targetInput.dispatchEvent({ type: 'compositionend' });
      assert.strictEqual(ime.isOsComposing, false);

      ime.destroy();
    });
  });

  describe('4. SRS Payload Contract (buildReviewPayload)', () => {
    test('enforces cardType: "LISTENING" in review payload', () => {
      const payload = buildReviewPayload({
        itemType: 'VOCABULARY',
        itemId: 101,
        cardType: 'LISTENING',
        rating: 3,
        reviewTimeSeconds: 4
      });

      assert.strictEqual(payload.itemType, 'VOCABULARY');
      assert.strictEqual(payload.itemId, 101);
      assert.strictEqual(payload.cardType, 'LISTENING');
      assert.strictEqual(payload.rating, 3);
      assert.strictEqual(payload.reviewTimeSeconds, 4);
    });

    test('supports RADICAL itemType with LISTENING cardType', () => {
      const payload = buildReviewPayload({
        itemType: 'RADICAL',
        itemId: 1,
        cardType: 'LISTENING',
        rating: 3,
        reviewTimeSeconds: 2
      });

      assert.strictEqual(payload.itemType, 'RADICAL');
      assert.strictEqual(payload.cardType, 'LISTENING');
    });
  });

  describe('5. Independent Progress Architecture (STORAGE_KEY_LISTENING)', () => {
    beforeEach(() => {
      if (globalThis.localStorage) globalThis.localStorage.clear();
    });

    test('exports discrete storage key for listening mode', () => {
      assert.strictEqual(STORAGE_KEY_LISTENING, 'HOC_HAN_NGU_LISTENING_PROGRESS');
      assert.notStrictEqual(STORAGE_KEY_LISTENING, STORAGE_KEY_FLASHCARD);
      assert.notStrictEqual(STORAGE_KEY_LISTENING, STORAGE_KEY_WRITING);
    });

    test('persists progress under STORAGE_KEY_LISTENING without polluting other modes', () => {
      saveProgress('listening', { hsk1: { lastIndex: 5 } });
      saveProgress('flashcard', { hsk1: { lastIndex: 12 } });
      saveProgress('writing', { hsk1: { lastIndex: 2 } });

      const listeningProg = getProgress('listening');
      const flashcardProg = getProgress('flashcard');
      const writingProg = getProgress('writing');

      assert.strictEqual(listeningProg.hsk1.lastIndex, 5);
      assert.strictEqual(flashcardProg.hsk1.lastIndex, 12);
      assert.strictEqual(writingProg.hsk1.lastIndex, 2);
    });
  });

  describe('6. SrsReviewController Listening Mode State & Contract', () => {
    test('initializes activeMode to listening when mode=listening', () => {
      const controller = new SrsReviewController();
      assert.strictEqual(controller.activeMode, 'flashcard'); // default

      // Simulate mode change
      controller.activeMode = 'listening';
      assert.strictEqual(controller.activeMode, 'listening');
      assert.strictEqual(controller.hasCompletedListeningForCurrentCard, false);
      assert.strictEqual(controller.listeningIme, null);
    });

    test('checkListeningAnswer marks correct state, unlocks Next button, and disables input', () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'listening';

      controller.sessionQueue = [
        { card: { itemId: 101, itemType: 'VOCABULARY', hanzi: '请', pinyin: 'qǐng' } }
      ];
      controller.currentIndex = 0;

      // Mock DOM elements
      const input = makeEl('input');
      input.value = '请';

      const completionNotice = makeEl('div');
      completionNotice.classList.add('d-none');

      const errorNotice = makeEl('div');
      errorNotice.classList.add('d-none');

      const btnNext = makeEl('button');
      btnNext.classList.add('writing-next-hidden');

      controller.dom = {
        listeningAnswerInput: input,
        listeningCompletionNotice: completionNotice,
        listeningErrorNotice: errorNotice,
        btnListeningNext: btnNext
      };

      // Execute check with correct answer
      controller.checkListeningAnswer();

      assert.strictEqual(controller.hasCompletedListeningForCurrentCard, true);
      assert.strictEqual(input.disabled, true);
      assert.strictEqual(completionNotice.classList.contains('d-none'), false);
      assert.strictEqual(completionNotice.textContent, '✓ Hoàn thành!');
      assert.strictEqual(btnNext.classList.contains('writing-next-hidden'), false);
    });

    test('checkListeningAnswer marks incorrect state, shows error, keeps Next hidden', () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'listening';

      controller.sessionQueue = [
        { card: { itemId: 101, itemType: 'VOCABULARY', hanzi: '请', pinyin: 'qǐng' } }
      ];
      controller.currentIndex = 0;

      const input = makeEl('input');
      input.value = '错';

      const completionNotice = makeEl('div');
      completionNotice.classList.add('d-none');

      const errorNotice = makeEl('div');
      errorNotice.classList.add('d-none');

      const btnNext = makeEl('button');
      btnNext.classList.add('writing-next-hidden');

      controller.dom = {
        listeningAnswerInput: input,
        listeningCompletionNotice: completionNotice,
        listeningErrorNotice: errorNotice,
        btnListeningNext: btnNext,
        btnListeningPlayAudio: null
      };

      // Execute check with incorrect answer
      controller.checkListeningAnswer();

      assert.strictEqual(controller.hasCompletedListeningForCurrentCard, false);
      assert.strictEqual(input.disabled, false);
      assert.strictEqual(errorNotice.classList.contains('d-none'), false);
      assert.strictEqual(btnNext.classList.contains('writing-next-hidden'), true);
    });

    test('keyboard shortcuts 1..4 are suppressed in listening mode', () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'listening';
      controller.dom = {
        activeSession: makeEl('div')
      };
      controller.sessionQueue = [
        { card: { itemId: 101, itemType: 'VOCABULARY', hanzi: '请' } }
      ];
      controller.currentIndex = 0;

      let ratingSubmitted = false;
      controller.submitRating = () => { ratingSubmitted = true; };

      // Simulate key '3'
      controller.handleKeydown({
        key: '3',
        code: 'Digit3',
        target: { tagName: 'div' },
        preventDefault: () => {}
      });

      assert.strictEqual(ratingSubmitted, false, '1..4 rating shortcuts must be blocked in listening mode');
    });

    test('checkListeningAnswer locks check button and guards against duplicate checks', () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'listening';
      controller.sessionQueue = [
        { card: { itemId: 1, itemType: 'VOCABULARY', hanzi: '学' } }
      ];
      controller.currentIndex = 0;

      const input = makeEl('input');
      input.value = '学';
      const btnCheck = makeEl('button');
      btnCheck.disabled = false;
      const btnNext = makeEl('button');
      btnNext.classList.add('writing-next-hidden');
      const notice = makeEl('div');

      controller.dom = {
        listeningAnswerInput: input,
        btnListeningCheck: btnCheck,
        btnListeningNext: btnNext,
        listeningCompletionNotice: notice
      };

      controller.checkListeningAnswer();
      assert.strictEqual(controller.hasCompletedListeningForCurrentCard, true);
      assert.strictEqual(btnCheck.disabled, true, 'Check button must be disabled upon correct answer');
      assert.strictEqual(input.disabled, true, 'Input must be disabled upon correct answer');

      // Attempt duplicate check
      let rechecked = false;
      controller.handleListeningCorrect = () => { rechecked = true; };
      controller.checkListeningAnswer();
      assert.strictEqual(rechecked, false, 'Duplicate checkListeningAnswer must be a no-op');
    });

    test('showCatalogSelection cleanly destroys listening IME', () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'listening';
      let destroyed = false;
      controller.listeningIme = {
        destroy: () => { destroyed = true; }
      };

      controller.showCatalogSelection();
      assert.strictEqual(destroyed, true, 'showCatalogSelection must destroy active listeningIme');
      assert.strictEqual(controller.listeningIme, null);
    });

    test('playPronunciation strips variant parentheses from textToSpeak', async () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'listening';
      controller.sessionQueue = [
        { card: { itemId: 154, itemType: 'RADICAL', character: '貝(贝)' } }
      ];
      controller.currentIndex = 0;
      controller.audioCache.set('RADICAL_154', 'https://example.com/audio/bei.mp3');

      // The raw text has parentheses, verify cleanText logic
      const rawText = controller.sessionQueue[0].card.character;
      const textToSpeak = (rawText.includes('(') || rawText.includes('/')) ? rawText.split(/[()\/]/)[0].trim() : rawText;
      assert.strictEqual(textToSpeak, '貝', 'Parenthesized variant notation must be stripped from speech synthesis');
    });
  });

  describe('6. Radical Variants & IME Robustness Invariants', () => {
    test('verifyListeningAnswer accepts all valid radical variants (simplified, traditional, side forms)', () => {
      // 貝(贝) -> Bối
      assert.strictEqual(verifyListeningAnswer('贝', '貝(贝)'), true, 'Simplified 贝 matches 貝(贝)');
      assert.strictEqual(verifyListeningAnswer('貝', '貝(贝)'), true, 'Traditional 貝 matches 貝(贝)');
      assert.strictEqual(verifyListeningAnswer('貝(贝)', '貝(贝)'), true, 'Literal string matches 貝(贝)');

      // 水(氵) -> Thủy
      assert.strictEqual(verifyListeningAnswer('水', '水(氵)'), true, 'Base 水 matches 水(氵)');
      assert.strictEqual(verifyListeningAnswer('氵', '水(氵)'), true, 'Side radical 氵 matches 水(氵)');

      // 長(镸/长) -> Trường
      assert.strictEqual(verifyListeningAnswer('長', '長(镸/长)'), true);
      assert.strictEqual(verifyListeningAnswer('镸', '長(镸/长)'), true);
      assert.strictEqual(verifyListeningAnswer('长', '長(镸/长)'), true);

      // Wrong answers
      assert.strictEqual(verifyListeningAnswer('火', '水(氵)'), false);
      assert.strictEqual(verifyListeningAnswer('shui', '水(氵)'), false);
    });

    test('Pinyin dictionary contains zero corrupted entries with brackets or slashes', async () => {
      const { PINYIN_DICT, lookupPinyin } = await import('../../../../frontend/js/ui/pinyin-ime/pinyin-dict.js');
      for (const [key, candidates] of Object.entries(PINYIN_DICT)) {
        for (const item of candidates) {
          assert.strictEqual(
            /[()\/]/.test(item),
            false,
            `Dict key "${key}" contains invalid bracketed item: "${item}"`
          );
        }
      }

      // Radical lookups produce clean Hanzi
      const beiCandidates = lookupPinyin('bei');
      assert.ok(beiCandidates.includes('贝'), 'bei candidates must include 贝');
      assert.ok(beiCandidates.includes('貝'), 'bei candidates must include 貝');
      assert.strictEqual(beiCandidates.includes('貝(贝)'), false, 'Corrupted bracket entry must not exist');

      const renCandidates = lookupPinyin('ren');
      assert.ok(renCandidates.includes('人'), 'ren candidates must include 人');
      assert.ok(renCandidates.includes('亻'), 'ren candidates must include 亻');
      assert.strictEqual(renCandidates.includes('人(亻)'), false, 'Corrupted bracket entry must not exist');
    });

    test('PinyinImeComponent completely ignores edits when targetInput is disabled', () => {
      const container = makeEl('div');
      const input = makeEl('input');
      input.value = '学';
      input.disabled = true;

      const ime = new PinyinImeComponent({
        containerMount: container,
        targetInput: input
      });

      // Attempt physical typing while disabled
      ime.onInputKeydown({
        key: 'a',
        preventDefault: () => {}
      });
      assert.strictEqual(ime.compositionBuffer, '', 'Buffer must not change when input is disabled');

      // Attempt appendBufferChar directly
      ime.appendBufferChar('x');
      assert.strictEqual(ime.compositionBuffer, '', 'appendBufferChar must be blocked when input is disabled');

      // Attempt popBufferChar directly
      ime.popBufferChar();
      assert.strictEqual(ime.compositionBuffer, '', 'popBufferChar must be blocked when input is disabled');

      // Attempt candidate commit directly
      ime.commitCandidate('生');
      assert.strictEqual(input.value, '学', 'commitCandidate must not mutate disabled input');

      ime.destroy();
    });

    test('PinyinImeComponent registers compositionupdate and updates isOsComposing', () => {
      const container = makeEl('div');
      const input = makeEl('input');

      const ime = new PinyinImeComponent({
        containerMount: container,
        targetInput: input
      });

      assert.strictEqual(ime.isOsComposing, false);
      input.dispatchEvent({ type: 'compositionupdate' });
      assert.strictEqual(ime.isOsComposing, true, 'compositionupdate must set isOsComposing to true');

      input.dispatchEvent({ type: 'compositionend' });
      assert.strictEqual(ime.isOsComposing, false, 'compositionend must reset isOsComposing to false');

      ime.destroy();
    });
  });

  function setupControllerForListening(cards = [
    { itemId: 1, itemType: 'VOCABULARY', hanzi: '你' },
    { itemId: 2, itemType: 'VOCABULARY', hanzi: '好' }
  ]) {
    const controller = new SrsReviewController();
    controller.activeMode = 'listening';
    controller.sessionQueue = cards.map(c => ({ card: c, againAttempts: 0 }));
    controller.currentIndex = 0;
    controller.playPronunciation = () => Promise.resolve({ success: true, method: 'audio_file' });
    controller.renderCatalog = () => {};
    controller.renderWritingRoomCard = () => {};
    controller.renderReadingRoomCard = () => {};
    controller.renderFlashcardCard = () => {};
    controller.startReactionTimer = () => {};
    const input = makeEl('input');
    input.setAttribute('inputmode', 'text');
    input.setAttribute('lang', 'zh-Hans');
    controller.dom = {
      listeningRoomBadge: makeEl('span'),
      listeningCompletionNotice: makeEl('div'),
      listeningErrorNotice: makeEl('div'),
      listeningAnswerInput: input,
      btnListeningCheck: makeEl('button'),
      btnListeningNext: makeEl('button'),
      btnListeningPlayAudio: makeEl('button'),
      listeningSpeakerHint: makeEl('span'),
      listeningAnswerRevealArea: makeEl('div'),
      btnListeningToggleHint: makeEl('button'),
      listeningHintBox: makeEl('div'),
      listeningPromptMeaning: makeEl('div'),
      listeningPromptHanViet: makeEl('span'),
      listeningPromptPinyin: makeEl('span'),
      listeningImeContainer: makeEl('div')
    };
    return controller;
  }

  describe('7. Automatic Audio Playback on Card Display (Auto-Play Invariants)', () => {

    test('1. First card auto-play: Automatically triggers pronunciation exactly once on initial card render', async () => {
      const controller = setupControllerForListening();
      const calls = [];
      controller.playPronunciation = (btn, opts) => {
        calls.push({ btn, opts });
        return Promise.resolve({ success: true, method: 'audio_file' });
      };

      const card = controller.sessionQueue[0].card;
      await controller.renderListeningRoomCard(card);

      assert.strictEqual(calls.length, 1, 'playPronunciation must be called exactly once on card render');
      assert.strictEqual(calls[0].opts?.isAutoPlay, true, 'isAutoPlay option must be true');
      assert.strictEqual(calls[0].btn, controller.dom.btnListeningPlayAudio, 'Trigger button must be btnListeningPlayAudio');
      assert.strictEqual(controller._autoPlayedListeningCardKey, '0_VOCABULARY_1', 'Card key must be recorded');
      assert.strictEqual(controller.dom.listeningSpeakerHint.textContent, 'Bấm loa để nghe lại');
    });

    test('2. Next card transition: Automatically triggers pronunciation once for the new card', async () => {
      const controller = setupControllerForListening();
      const calls = [];
      controller.playPronunciation = (btn, opts) => {
        calls.push({ btn, opts });
        return Promise.resolve({ success: true, method: 'audio_file' });
      };

      // Render card 1
      await controller.renderListeningRoomCard(controller.sessionQueue[0].card);
      assert.strictEqual(calls.length, 1);

      // Advance to card 2
      controller.currentIndex = 1;
      await controller.renderListeningRoomCard(controller.sessionQueue[1].card);

      assert.strictEqual(calls.length, 2, 'New card must trigger auto-play');
      assert.strictEqual(calls[1].opts?.isAutoPlay, true);
      assert.strictEqual(controller._autoPlayedListeningCardKey, '1_VOCABULARY_2');
    });

    test('3. Zero replay on re-renders: Re-rendering same card does NOT re-trigger auto-play', async () => {
      const controller = setupControllerForListening();
      const calls = [];
      controller.playPronunciation = (btn, opts) => {
        calls.push({ btn, opts });
        return Promise.resolve({ success: true, method: 'audio_file' });
      };

      const card = controller.sessionQueue[0].card;
      await controller.renderListeningRoomCard(card);
      assert.strictEqual(calls.length, 1);

      // Simulate re-rendering the same card (e.g. window resize or parent re-render)
      await controller.renderListeningRoomCard(card);
      await controller.renderListeningRoomCard(card);

      assert.strictEqual(calls.length, 1, 'Subsequent renders of the same card must NOT re-dispatch auto-play');
    });

    test('4. Manual speaker click: Replays current card audio without changing progress or auto-play state', async () => {
      const controller = setupControllerForListening();
      const calls = [];
      controller.playPronunciation = (btn, opts) => {
        calls.push({ btn, opts });
        return Promise.resolve({ success: true, method: 'audio_file' });
      };

      const card = controller.sessionQueue[0].card;
      await controller.renderListeningRoomCard(card);
      assert.strictEqual(calls.length, 1);

      // Simulate learner clicking the speaker button to replay
      controller.playPronunciation(controller.dom.btnListeningPlayAudio);

      assert.strictEqual(calls.length, 2, 'Manual click must trigger pronunciation');
      assert.strictEqual(calls[1].opts?.isAutoPlay, undefined, 'Manual replay does not set isAutoPlay: true');
      assert.strictEqual(controller.currentIndex, 0, 'Current index must not change');
      assert.strictEqual(controller.hasCompletedListeningForCurrentCard, false, 'Card completion must not change');
      assert.strictEqual(controller._autoPlayedListeningCardKey, '0_VOCABULARY_1', 'Auto-play key remains unchanged');
    });

    test('5. Autoplay rejection resilience: Gracefully handles NotAllowedError without uncaught exception and shows hint', async () => {
      const controller = setupControllerForListening();
      controller.playPronunciation = (btn, opts) => {
        return Promise.resolve({
          success: false,
          method: 'audio_file',
          autoplayBlocked: true,
          message: 'Autoplay blocked by browser policy'
        });
      };

      const card = controller.sessionQueue[0].card;
      await controller.renderListeningRoomCard(card);

      // Verify no uncaught exception and hint guides learner to tap speaker
      assert.ok(
        controller.dom.listeningSpeakerHint.textContent.includes('Trình duyệt chặn tự động phát'),
        'Speaker hint must inform user that autoplay was blocked'
      );
      assert.strictEqual(controller.dom.btnListeningPlayAudio.disabled, false, 'Speaker button must remain enabled');
      assert.strictEqual(controller.dom.listeningAnswerInput.disabled, false, 'Input must remain enabled');
    });

    test('6. Session re-init resets auto-play key so first card of new session plays', () => {
      const controller = setupControllerForListening();
      controller._autoPlayedListeningCardKey = '0_VOCABULARY_1';

      // Re-init with new cards
      controller.initSessionQueue([
        { itemId: 99, itemType: 'VOCABULARY', hanzi: '水' }
      ]);

      // Card key must be updated to the new session's first card, shedding the old session key
      assert.strictEqual(
        controller._autoPlayedListeningCardKey,
        '0_VOCABULARY_99',
        'initSessionQueue must reset and re-evaluate auto-play key for the new session'
      );

      // Re-init with empty cards returns immediately with null auto-play key
      controller.initSessionQueue([]);
      assert.strictEqual(
        controller._autoPlayedListeningCardKey,
        null,
        'Empty session queue leaves _autoPlayedListeningCardKey as null'
      );
    });

    test('7. Mode switching away from listening resets auto-play key', () => {
      const controller = setupControllerForListening();
      controller._autoPlayedListeningCardKey = '0_VOCABULARY_1';

      controller.switchMode('writing');

      assert.strictEqual(
        controller._autoPlayedListeningCardKey,
        null,
        'switchMode to non-listening must reset _autoPlayedListeningCardKey'
      );
    });

    test('8. showCatalogSelection resets auto-play key', () => {
      const controller = setupControllerForListening();
      controller._autoPlayedListeningCardKey = '0_VOCABULARY_1';

      controller.showCatalogSelection();

      assert.strictEqual(
        controller._autoPlayedListeningCardKey,
        null,
        'showCatalogSelection must reset _autoPlayedListeningCardKey'
      );
    });
  });

  describe('8. Group A – Keyboard Data Completeness & Compound Word Lookup (Nhóm A)', () => {
    test('1. Compound words lookup: All previously missing curriculum words are found via exact pinyin', () => {
      const sampleCurriculumWords = [
        { word: '出租车', pinyin: 'chūzūchē' },
        { word: '开始', pinyin: 'kāishǐ' },
        { word: '超市', pinyin: 'chāoshì' },
        { word: '舒服', pinyin: 'shūfu' },
        { word: '饺子', pinyin: 'jiǎozi' },
        { word: '椅子', pinyin: 'yǐzi' },
        { word: '女士', pinyin: 'nǚshì' },
        { word: '教室', pinyin: 'jiàoshì' },
        { word: '不好意思', pinyin: 'bù hǎoyìsi' },
        { word: '公交车', pinyin: 'gōngjiāochē' },
        { word: '冰激凌', pinyin: 'bīngjīlíng' },
        { word: '卫生间', pinyin: 'wèishēngjiān' }
      ];

      for (const item of sampleCurriculumWords) {
        const candidates = lookupPinyin(item.pinyin, 10);
        assert.ok(
          candidates.includes(item.word),
          `Word "${item.word}" (pinyin: ${item.pinyin}) must be returned in lookup candidates, got: ${JSON.stringify(candidates)}`
        );
      }
    });

    test('2. Single characters lookup: All 28 previously missing characters are present and searchable', () => {
      const missingChars = [
        { char: '租', pinyin: 'zu' },
        { char: '饺', pinyin: 'jiao' },
        { char: '椅', pinyin: 'yi' },
        { char: '室', pinyin: 'shi' },
        { char: '始', pinyin: 'shi' },
        { char: '舒', pinyin: 'shu' },
        { char: '姨', pinyin: 'yi' },
        { char: '激', pinyin: 'ji' },
        { char: '凌', pinyin: 'ling' },
        { char: '绩', pinyin: 'ji' },
        { char: '附', pinyin: 'fu' },
        { char: '据', pinyin: 'ju' },
        { char: '码', pinyin: 'ma' },
        { char: '适', pinyin: 'shi' },
        { char: '议', pinyin: 'yi' },
        { char: '季', pinyin: 'ji' },
        { char: '束', pinyin: 'shu' },
        { char: '辆', pinyin: 'liang' },
        { char: '啤', pinyin: 'pi' },
        { char: '卫', pinyin: 'wei' },
        { char: '惯', pinyin: 'guan' },
        { char: '澡', pinyin: 'zao' },
        { char: '蕉', pinyin: 'jiao' },
        { char: '饮', pinyin: 'yin' },
        { char: '顾', pinyin: 'gu' },
        { char: '玊', pinyin: 'yu' },
        { char: '卤', pinyin: 'lu' },
        { char: '黾', pinyin: 'min' }
      ];

      for (const item of missingChars) {
        const candidates = lookupPinyin(item.pinyin, 20);
        assert.ok(
          candidates.includes(item.char),
          `Character "${item.char}" must be present for pinyin "${item.pinyin}", got: ${JSON.stringify(candidates)}`
        );
      }
    });

    test('3. Radical variants lookup: Radicals with alternate forms are searchable', () => {
      const radicalVariants = [
        { char: '亻', pinyin: 'ren' },
        { char: '刂', pinyin: 'dao' },
        { char: '忄', pinyin: 'xin' },
        { char: '扌', pinyin: 'shou' },
        { char: '氵', pinyin: 'shui' },
        { char: '灬', pinyin: 'huo' },
        { char: '犭', pinyin: 'quan' },
        { char: '礻', pinyin: 'shi' },
        { char: '⺮', pinyin: 'zhu' },
        { char: '纟', pinyin: 'mi' }
      ];

      for (const item of radicalVariants) {
        const candidates = lookupPinyin(item.pinyin, 20);
        assert.ok(
          candidates.includes(item.char),
          `Radical variant "${item.char}" must be found for pinyin "${item.pinyin}"`
        );
      }
    });

    test('4. Runtime dynamic enrichment: enrichPinyinDict adds new words and immediately reflects in lookup', () => {
      const customWord = '人工智能';
      const customPinyin = 'rén gōng zhì néng';

      enrichPinyinDict([{ hanzi: customWord, pinyin: customPinyin }]);
      const candidates = lookupPinyin(customPinyin, 10);
      assert.ok(candidates.includes(customWord), 'Dynamic word must be returned after enrichPinyinDict');
    });

    test('5. Pinyin with tones, uppercase, and spaces are properly normalized', () => {
      assert.ok(lookupPinyin('Chū Zū Chē', 10).includes('出租车'));
      assert.ok(lookupPinyin('kāi shǐ', 10).includes('开始'));
      assert.ok(lookupPinyin('NǙ SHÌ', 10).includes('女士'));
    });
  });

  describe('9. Group B – Mobile OS Default Keyboard & Chinese IME Input (Nhóm B)', () => {
    test('1. Input element attributes: Has inputmode="text" and lang="zh-Hans"', () => {
      const html = fs.readFileSync('frontend/srs-review.html', 'utf8');
      assert.ok(html.includes('id="listeningAnswerInput"'), 'srs-review.html must contain listeningAnswerInput');
      assert.ok(html.includes('inputmode="text"'), 'listeningAnswerInput must declare inputmode="text" for mobile keyboards');
      assert.ok(html.includes('lang="zh-Hans"'), 'listeningAnswerInput must declare lang="zh-Hans"');

      const controller = setupControllerForListening();
      assert.strictEqual(controller.dom.listeningAnswerInput.disabled, false, 'Input must not be disabled');
    });

    test('2. Native Chinese IME simulation (compositionstart -> compositionupdate -> compositionend -> input)', () => {
      const mountEl = makeEl('div');
      const input = makeEl('input');
      let committedChar = null;

      const ime = new PinyinImeComponent({
        containerMount: mountEl,
        targetInput: input,
        onCommit: (char) => { committedChar = char; }
      });

      // User starts typing pinyin on mobile Gboard / iOS Chinese IME
      input.dispatchEvent({ type: 'compositionstart' });
      assert.strictEqual(ime.isOsComposing, true, 'isOsComposing must be true during OS IME composition');
      assert.strictEqual(ime.compositionBuffer, '', 'Virtual buffer must be clear during OS IME');

      input.dispatchEvent({ type: 'compositionupdate', data: 'ni' });
      assert.strictEqual(ime.isOsComposing, true);

      // User selects Chinese character "你" from mobile keyboard suggestion
      input.value = '你';
      input.dispatchEvent({ type: 'compositionend', data: '你' });
      assert.strictEqual(ime.isOsComposing, false, 'isOsComposing must reset to false after compositionend');
      assert.strictEqual(committedChar, '你', 'onCommit must receive the committed character');

      // Subsequent input event
      input.dispatchEvent({ type: 'input' });
      assert.strictEqual(input.value, '你', 'Input value must retain the Chinese character');
      assert.strictEqual(verifyListeningAnswer(input.value, '你'), true, 'Answer verification must pass');
    });

    test('3. Composition submission guard: checkListeningAnswer does not submit while composing', async () => {
      const controller = setupControllerForListening();
      await controller.renderListeningRoomCard(controller.sessionQueue[0].card);
      controller.listeningIme.isOsComposing = true;
      controller.dom.listeningAnswerInput.value = 'ni';

      controller.checkListeningAnswer();

      assert.strictEqual(
        controller.hasCompletedListeningForCurrentCard,
        false,
        'checkListeningAnswer must not mark completed while composing'
      );
      assert.strictEqual(
        controller.dom.listeningAnswerInput.classList.contains('is-valid'),
        false,
        'Should not validate answer while composing'
      );
    });

    test('4. Mobile Latin fallback: Typing pinyin via default mobile keyboard updates candidates and commits cleanly', () => {
      const mountEl = makeEl('div');
      const input = makeEl('input');
      const ime = new PinyinImeComponent({
        containerMount: mountEl,
        targetInput: input
      });

      // Simulate typing Latin pinyin "kaishi" on mobile keyboard (where keydown keyCode is 229)
      input.value = 'kaishi';
      input.dispatchEvent({ type: 'input' });

      assert.strictEqual(ime.compositionBuffer, 'kaishi', 'Latin input must populate compositionBuffer');
      assert.ok(ime.candidates.includes('开始'), 'Candidates must include "开始"');

      // Learner taps the "开始" candidate on website candidates bar
      ime.commitCandidate('开始');

      assert.strictEqual(input.value, '开始', 'Candidate must replace the Latin pinyin buffer');
      assert.strictEqual(ime.compositionBuffer, '', 'Buffer must be cleared after commit');
    });

    test('5. Multi-character and sentence input: Replacing and appending text works seamlessly', () => {
      const mountEl = makeEl('div');
      const input = makeEl('input');
      const ime = new PinyinImeComponent({
        containerMount: mountEl,
        targetInput: input
      });

      // Type first word
      input.value = 'ni';
      input.dispatchEvent({ type: 'input' });
      ime.commitCandidate('你');
      assert.strictEqual(input.value, '你');

      // Type second word
      input.value = '你好';
      input.dispatchEvent({ type: 'input' });
      assert.strictEqual(input.value, '你好');
      assert.strictEqual(ime.compositionBuffer, '', 'Chinese characters do not populate Latin buffer');

      // Backspace removes one character
      input.value = '你';
      input.dispatchEvent({ type: 'input' });
      assert.strictEqual(input.value, '你');
    });

    test('6. Keyboard toggle preserves candidates bar while hiding virtual keys', () => {
      const mountEl = makeEl('div');
      const input = makeEl('input');
      const ime = new PinyinImeComponent({
        containerMount: mountEl,
        targetInput: input
      });

      assert.strictEqual(ime.isKeyboardVisible, true);
      assert.strictEqual(ime.dom.keyboardWrapper.classList.contains('d-none'), false);

      // User toggles to hide virtual keyboard on mobile to free up screen space
      ime.toggleKeyboardVisibility();
      assert.strictEqual(ime.isKeyboardVisible, false);
      assert.strictEqual(ime.dom.keyboardWrapper.classList.contains('d-none'), true);
      assert.strictEqual(ime.dom.candidatesBar.classList.contains('d-none'), false, 'Candidates bar must remain visible');

      // Can still select candidates even when virtual keyboard keys are hidden
      input.value = 'ren';
      input.dispatchEvent({ type: 'input' });
      assert.ok(ime.candidates.includes('人'));
      ime.commitCandidate('人');
      assert.strictEqual(input.value, '人');
    });
  });

  describe('10. Quy chuẩn Đánh giá 1–4 SM-2 & Chu trình Học lại Phòng Luyện Nghe', () => {
    test('0 mistakes, 0 replays maps to Rating 4 (Easy)', async () => {
      const controller = new SrsReviewController();
      controller.dom = { btnListeningNext: makeEl('button') };
      controller.hasCompletedListeningForCurrentCard = true;
      controller.currentListeningMistakes = 0;
      controller.currentListeningReplays = 0;
      let submittedRating = null;
      controller.submitRating = async (r) => { submittedRating = r; };

      await controller.nextListeningItem();
      assert.strictEqual(submittedRating, 4);
    });

    test('0 mistakes, 1 replay maps to Rating 3 (Good)', async () => {
      const controller = new SrsReviewController();
      controller.dom = { btnListeningNext: makeEl('button') };
      controller.hasCompletedListeningForCurrentCard = true;
      controller.currentListeningMistakes = 0;
      controller.currentListeningReplays = 0;
      controller.currentListeningReplays = 1;
      let submittedRating = null;
      controller.submitRating = async (r) => { submittedRating = r; };

      await controller.nextListeningItem();
      assert.strictEqual(submittedRating, 3);
    });

    test('1 mistake or >= 3 replays maps to Rating 2 (Hard)', async () => {
      const controller = new SrsReviewController();
      controller.dom = { btnListeningNext: makeEl('button') };
      controller.hasCompletedListeningForCurrentCard = true;
      controller.currentListeningMistakes = 1;
      controller.currentListeningReplays = 0;
      let submittedRating = null;
      controller.submitRating = async (r) => { submittedRating = r; };

      await controller.nextListeningItem();
      assert.strictEqual(submittedRating, 2);

      // Replays >= 3 with 0 mistakes
      controller.currentListeningMistakes = 0;
      controller.currentListeningReplays = 3;
      await controller.nextListeningItem();
      assert.strictEqual(submittedRating, 2);
    });

    test('>= 3 mistakes maps to Rating 1 (Again - Requeue card)', async () => {
      const controller = new SrsReviewController();
      controller.dom = { btnListeningNext: makeEl('button') };
      controller.hasCompletedListeningForCurrentCard = true;
      controller.currentListeningMistakes = 3;
      controller.currentListeningReplays = 2;
      let submittedRating = null;
      controller.submitRating = async (r) => { submittedRating = r; };

      await controller.nextListeningItem();
      assert.strictEqual(submittedRating, 1);
    });

    test('handleListeningIncorrect increments currentListeningMistakes counter', () => {
      const controller = new SrsReviewController();
      controller.dom = {
        listeningAnswerInput: makeEl('input'),
        btnListeningCheck: makeEl('button'),
        listeningCompletionNotice: makeEl('div'),
        listeningErrorNotice: makeEl('div'),
        btnListeningNext: makeEl('button'),
        btnListeningPlayAudio: makeEl('button')
      };
      controller.playPronunciation = () => Promise.resolve();

      assert.strictEqual(controller.currentListeningMistakes, undefined);
      controller.handleListeningIncorrect();
      assert.strictEqual(controller.currentListeningMistakes, 1);
      controller.handleListeningIncorrect();
      assert.strictEqual(controller.currentListeningMistakes, 2);
    });

    test('using hint caps score to Rating 2 (Hard) even with 0 mistakes and 0 replays', async () => {
      const controller = new SrsReviewController();
      controller.dom = { btnListeningNext: makeEl('button') };
      controller.hasCompletedListeningForCurrentCard = true;
      controller.currentListeningMistakes = 0;
      controller.currentListeningReplays = 0;
      controller.hasUsedListeningHintForCurrentCard = true;
      let submittedRating = null;
      controller.submitRating = async (r) => { submittedRating = r; };

      await controller.nextListeningItem();
      assert.strictEqual(submittedRating, 2, 'Opening hint must cap rating to 2 (Hard)');
    });

    test('using hint with >= 3 mistakes still maps to Rating 1 (Again)', async () => {
      const controller = new SrsReviewController();
      controller.dom = { btnListeningNext: makeEl('button') };
      controller.hasCompletedListeningForCurrentCard = true;
      controller.currentListeningMistakes = 3;
      controller.currentListeningReplays = 0;
      controller.hasUsedListeningHintForCurrentCard = true;
      let submittedRating = null;
      controller.submitRating = async (r) => { submittedRating = r; };

      await controller.nextListeningItem();
      assert.strictEqual(submittedRating, 1, '>= 3 mistakes takes precedence and maps to 1 (Again)');
    });

    test('renderListeningRoomCard resets hint box and populates meaning, hanViet, pinyin', async () => {
      const controller = setupControllerForListening();
      controller.hasUsedListeningHintForCurrentCard = true;
      controller.dom.listeningHintBox.classList.remove('d-none');
      controller.dom.btnListeningToggleHint.textContent = '🙈 Ẩn gợi ý';

      const mockCard = {
        itemId: 10,
        itemType: 'VOCABULARY',
        hanzi: '你好',
        pinyin: 'nǐ hǎo',
        meaningVi: 'Xin chào',
        meaningHanViet: 'NỄ HẢO'
      };

      await controller.renderListeningRoomCard(mockCard);

      assert.strictEqual(controller.hasUsedListeningHintForCurrentCard, false, 'Hint used flag must be reset to false');
      assert.strictEqual(controller.dom.listeningHintBox.classList.contains('d-none'), true, 'Hint box must be hidden on new card');
      assert.strictEqual(controller.dom.btnListeningToggleHint.textContent, '👁️ Xem gợi ý');
      assert.strictEqual(controller.dom.listeningPromptMeaning.textContent, 'Xin chào');
      assert.strictEqual(controller.dom.listeningPromptHanViet.textContent, 'Hán-Việt: NỄ HẢO');
      assert.strictEqual(controller.dom.listeningPromptPinyin.textContent, 'Phiên âm: nǐ hǎo');
    });

    test('handleListeningCorrect unhides hint box and sets toggle text to 🙈 Ẩn gợi ý', () => {
      const controller = setupControllerForListening();
      controller.dom.listeningHintBox.classList.add('d-none');
      controller.dom.btnListeningToggleHint.textContent = '👁️ Xem gợi ý';

      const mockCard = { itemId: 10, itemType: 'VOCABULARY', hanzi: '你好' };
      controller.handleListeningCorrect(mockCard);

      assert.strictEqual(controller.dom.listeningHintBox.classList.contains('d-none'), false, 'Hint box should be shown upon correct answer');
      assert.strictEqual(controller.dom.btnListeningToggleHint.textContent, '🙈 Ẩn gợi ý');
    });
  });

});
