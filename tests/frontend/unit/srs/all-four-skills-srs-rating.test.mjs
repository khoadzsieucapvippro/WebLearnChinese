/**
 * =============================================================================
 * UNIT TEST SUITE: 4 SKILLS SRS RATING UNIFICATION & REQUEUE VERIFICATION
 * Module: tests/frontend/unit/srs/all-four-skills-srs-rating.test.mjs
 *
 * Verifies the 4-skill unified SM-2 rating contract:
 * 1. FLASHCARD: Direct UI ratings 1..4 (Again, Hard, Good, Easy).
 * 2. WRITING: Derived from stroke mistakes and hints:
 *    - >= 5 mistakes -> 1 (Again / Requeue)
 *    - 2..4 mistakes or hint -> 2 (Hard)
 *    - 1 mistake -> 3 (Good)
 *    - 0 mistakes -> 4 (Easy)
 * 3. LISTENING: Derived from typing mistakes and audio replays:
 *    - >= 3 mistakes -> 1 (Again / Requeue)
 *    - 1..2 mistakes OR >= 3 replays -> 2 (Hard)
 *    - 0 mistakes + 1..2 replays -> 3 (Good)
 *    - 0 mistakes + 0 replays -> 4 (Easy)
 * 4. READING: Derived from Chao 5-scale F0 pitch tone sandhi score:
 *    - Score < 45 -> 1 (Again / Requeue)
 *    - 45 <= Score < 60 -> 2 (Hard)
 *    - 60 <= Score < 85 -> 3 (Good)
 *    - Score >= 85 -> 4 (Easy)
 * 5. Relearn Graduation & Due Cache Isolation across all 4 skill modalities.
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

// Mock DOM element factory
function makeEl(tag = 'div') {
  const classes = new Set();
  const attrs = new Map();
  const children = [];
  const listeners = {};
  const el = {
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
      if (k === 'id') el.id = String(v);
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
    remove: () => {},
    querySelectorAll: (sel) => {
      const results = [];
      function traverse(node) {
        if (!node) return;
        if (sel.startsWith('.') && node.classList && node.classList.contains(sel.slice(1))) {
          results.push(node);
        }
        if (Array.isArray(node.children)) {
          for (const child of node.children) traverse(child);
        }
      }
      traverse(el);
      return results;
    },
    querySelector: (sel) => {
      const all = el.querySelectorAll(sel);
      return all[0] || null;
    }
  };
  return el;
}

if (typeof global.document === 'undefined') {
  global.document = {
    body: makeEl('body'),
    createElement: (tag) => makeEl(tag),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  };
}

import { SrsReviewController } from '../../../../frontend/js/pages/srs-review-page.js';

describe('Unified 4-Skill SRS Evaluation & Requeue Contract', () => {

  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  test('1. FLASHCARD Skill: Receives direct rating and activates requeue on 1', async () => {
    const controller = new SrsReviewController();
    controller.activeMode = 'flashcard';
    controller.sessionQueue = [
      { card: { itemId: 101, hanzi: '你好', itemType: 'VOCABULARY' } },
      { card: { itemId: 102, hanzi: '谢谢', itemType: 'VOCABULARY' } }
    ];
    controller.currentIndex = 0;
    controller.dueItemsCache = { vocab: [], radicals: [] };
    controller.dom = {
      ratingFeedback: makeEl('div'),
      flashcard: makeEl('div'),
      cardFront: makeEl('div'),
      cardBack: makeEl('div')
    };

    // Submit rating 1 (Again)
    await controller.submitRating(1);

    // Queue length expands from 2 to 3 due to requeue at the end
    assert.strictEqual(controller.sessionQueue.length, 3, 'Requeued card appended to end');
    assert.strictEqual(controller.sessionQueue[2].card.itemId, 101);
    assert.strictEqual(controller.sessionQueue[2]._requeued, true);
    assert.strictEqual(controller.stats.againCount, 1);
  });

  test('2. WRITING Skill: Converts mistakes to rating 1..4 and integrates with submitRating', async () => {
    const controller = new SrsReviewController();
    controller.activeMode = 'writing';
    controller.dom = { btnWritingNext: makeEl('button') };
    controller.hasCompletedWritingForCurrentCard = true;

    let submittedRatings = [];
    controller.submitRating = async (r) => { submittedRatings.push(r); };

    // Case A: 0 mistakes, no hint -> Rating 4 (Easy)
    controller.currentWritingMistakes = 0;
    controller.hasUsedWritingHintForCurrentCard = false;
    await controller.nextWritingItem();
    assert.strictEqual(submittedRatings[0], 4);

    // Case B: 1 mistake, no hint -> Rating 3 (Good)
    controller.currentWritingMistakes = 1;
    controller.hasUsedWritingHintForCurrentCard = false;
    await controller.nextWritingItem();
    assert.strictEqual(submittedRatings[1], 3);

    // Case C: 2 mistakes -> Rating 2 (Hard)
    controller.currentWritingMistakes = 2;
    controller.hasUsedWritingHintForCurrentCard = false;
    await controller.nextWritingItem();
    assert.strictEqual(submittedRatings[2], 2);

    // Case D: 0 mistakes but used hint -> Rating 2 (Hard)
    controller.currentWritingMistakes = 0;
    controller.hasUsedWritingHintForCurrentCard = true;
    await controller.nextWritingItem();
    assert.strictEqual(submittedRatings[3], 2);

    // Case E: >= 5 mistakes -> Rating 1 (Again / Requeue)
    controller.currentWritingMistakes = 6;
    controller.hasUsedWritingHintForCurrentCard = false;
    await controller.nextWritingItem();
    assert.strictEqual(submittedRatings[4], 1);
  });

  test('3. LISTENING Skill: Converts typing mistakes and replays to rating 1..4 and integrates with submitRating', async () => {
    const controller = new SrsReviewController();
    controller.activeMode = 'listening';
    controller.dom = { btnListeningNext: makeEl('button') };
    controller.hasCompletedListeningForCurrentCard = true;

    let submittedRatings = [];
    controller.submitRating = async (r) => { submittedRatings.push(r); };

    // Case A: 0 mistakes, 0 replays -> Rating 4 (Easy)
    controller.currentListeningMistakes = 0;
    controller.currentListeningReplays = 0;
    await controller.nextListeningItem();
    assert.strictEqual(submittedRatings[0], 4);

    // Case B: 0 mistakes, 1 replay -> Rating 3 (Good)
    controller.currentListeningMistakes = 0;
    controller.currentListeningReplays = 1;
    await controller.nextListeningItem();
    assert.strictEqual(submittedRatings[1], 3);

    // Case C: 1 mistake -> Rating 2 (Hard)
    controller.currentListeningMistakes = 1;
    controller.currentListeningReplays = 0;
    await controller.nextListeningItem();
    assert.strictEqual(submittedRatings[2], 2);

    // Case D: 0 mistakes, 3 replays -> Rating 2 (Hard)
    controller.currentListeningMistakes = 0;
    controller.currentListeningReplays = 3;
    await controller.nextListeningItem();
    assert.strictEqual(submittedRatings[3], 2);

    // Case E: >= 3 mistakes -> Rating 1 (Again / Requeue)
    controller.currentListeningMistakes = 3;
    controller.currentListeningReplays = 1;
    await controller.nextListeningItem();
    assert.strictEqual(submittedRatings[4], 1);
  });

  test('4. READING Skill: Converts F0 pitch/tone sandhi score to rating 1..4 and integrates with submitRating', async () => {
    const controller = new SrsReviewController();
    controller.activeMode = 'reading';
    controller.dom = { btnReadingNext: makeEl('button') };
    controller.hasCompletedReadingForCurrentCard = true;

    let submittedRatings = [];
    controller.submitRating = async (r) => { submittedRatings.push(r); };

    // Case A: Score 95 -> Rating 4 (Easy)
    controller.currentReadingScore = 95;
    await controller.nextReadingItem();
    assert.strictEqual(submittedRatings[0], 4);

    // Case B: Score 75 -> Rating 3 (Good)
    controller.currentReadingScore = 75;
    await controller.nextReadingItem();
    assert.strictEqual(submittedRatings[1], 3);

    // Case C: Score 50 -> Rating 2 (Hard)
    controller.currentReadingScore = 50;
    await controller.nextReadingItem();
    assert.strictEqual(submittedRatings[2], 2);

    // Case D: Score 30 -> Rating 1 (Again / Requeue)
    controller.currentReadingScore = 30;
    await controller.nextReadingItem();
    assert.strictEqual(submittedRatings[3], 1);
  });

  test('5. Relearn Graduation Contract: All 4 skills graduate upon successful re-attempt', async () => {
    const skills = ['flashcard', 'writing', 'listening', 'reading'];

    for (const skill of skills) {
      const controller = new SrsReviewController();
      controller.activeMode = skill;
      controller.sessionQueue = [
        { card: { itemId: 201, hanzi: '水', itemType: 'VOCABULARY' }, _requeued: true }
      ];
      controller.currentIndex = 0;
      controller.dueItemsCache = { vocab: [{ itemId: 201, hanzi: '水' }], radicals: [] };
      controller.dom = {
        ratingFeedback: makeEl('div'),
        flashcard: makeEl('div'),
        cardFront: makeEl('div'),
        cardBack: makeEl('div')
      };

      // Card is in requeue drill (_requeued = true).
      // On re-attempt, learner scores Rating >= 2 (Graduation)
      await controller.submitRating(2);

      // Verify optimistic dueItemsCache eviction upon graduation
      assert.strictEqual(
        controller.dueItemsCache.vocab.length,
        0,
        `Skill ${skill} evicted graduated card from dueItemsCache`
      );
      assert.strictEqual(controller.stats.hardCount, 1);
    }
  });

  test('6. Flashcard Graceful Fallback: Recovers with READING if server validates against legacy cardType schema', async () => {
    const controller = new SrsReviewController();
    controller.activeMode = 'flashcard';
    controller.sessionQueue = [
      { card: { itemId: 74, character: '月', itemType: 'RADICAL' }, _requeued: false }
    ];
    controller.currentIndex = 0;
    controller.dom = {
      ratingFeedback: makeEl('div'),
      flashcard: makeEl('div'),
      cardFront: makeEl('div'),
      cardBack: makeEl('div')
    };

    // When submitRating runs, if backend rejects cardType: 'FLASHCARD' with validation error,
    // it automatically retries with 'READING' and succeeds without error
    await controller.submitRating(3);

    assert.strictEqual(controller.stats.goodCount, 1, 'Good count must increment upon successful submission/fallback');
    assert.strictEqual(controller.currentIndex, 1, 'Index must advance to 1');
  });

});
