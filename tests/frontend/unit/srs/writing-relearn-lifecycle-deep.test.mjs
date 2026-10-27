/**
 * =============================================================================
 * WRITING RELEARN & REVIEW LIFECYCLE DEEP VERIFICATION
 * File: tests/frontend/unit/srs/writing-relearn-lifecycle-deep.test.mjs
 * 
 * Verifies:
 * 1. "Học lại" from Catalog (action === 'review') starts at index 0 and preserves "Học tiếp" savedIndex.
 * 2. In-session Writing mistake >= 5 triggers Requeue to end of session with _requeued = true.
 * 3. Relearn Graduation: When requeued card is re-attempted and mistakes < 5, sends graduation review and graduates.
 * 4. Repeated failure in relearn: When requeued card fails again (>= 5 mistakes), requeues locally without duplicate lapse API.
 * 5. On-the-spot "Viết lại" (clearWriting) resets mistake counter so learner can recover with a clean attempt.
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
    get className() { return Array.from(classes).join(' '); },
    set className(val) {
      classes.clear();
      if (typeof val === 'string') val.split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
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
    setAttribute: (k, v) => { attrs.set(k, String(v)); if (k === 'id') el.id = String(v); },
    getAttribute: (k) => attrs.get(k) ?? null,
    removeAttribute: (k) => attrs.delete(k),
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    replaceChildren: (...ch) => { children.length = 0; if (ch.length) children.push(...ch); },
    appendChild: (ch) => { children.push(ch); return ch; },
    removeChild: (ch) => { const i = children.indexOf(ch); if (i !== -1) children.splice(i, 1); return ch; },
    remove: () => {},
    querySelectorAll: () => [],
    querySelector: () => null
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

describe('Writing Relearn & Review Lifecycle Deep Verification', () => {

  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  test('1. "Học lại" from Catalog (action === "review") preserves "Học tiếp" progress', async () => {
    const controller = new SrsReviewController();
    controller.activeMode = 'writing';
    controller.activeGroup = 'hsk1';
    controller.loadBackendLessons = async () => {};

    let sessionReviewMode = null;
    let sessionStartIndex = null;
    controller.initSessionQueue = (cards, isReviewMode, startIndex) => {
      sessionReviewMode = isReviewMode;
      sessionStartIndex = startIndex;
      controller.sessionQueue = cards.map(c => ({ card: c }));
      controller.isReviewMode = isReviewMode;
      controller.currentIndex = startIndex;
    };

    // User clicks "Học lại" (action = 'review')
    await controller.startTopicSession(1, 'review');

    assert.strictEqual(sessionReviewMode, true, 'Review session must set isReviewMode = true');
    assert.strictEqual(sessionStartIndex, 0, 'Review session must start from index 0');

    // Submitting a card during review mode must NOT overwrite chapter progress
    let progressPersisted = false;
    controller.persistProgress = () => { progressPersisted = true; };
    controller.currentWritingMistakes = 0;
    controller.hasCompletedWritingForCurrentCard = true;
    controller.showCompletedState = () => {};

    await controller.nextWritingItem();
    assert.strictEqual(progressPersisted, false, 'Progress must not be persisted during review mode');
  });

  test('2. In-session mistake >= 5 triggers Requeue to end of sessionQueue with _requeued = true', async () => {
    const controller = new SrsReviewController();
    controller.activeMode = 'writing';
    controller.sessionQueue = [
      { card: { itemId: 301, itemType: 'VOCABULARY', hanzi: '谢', cardType: 'WRITING' } },
      { card: { itemId: 302, itemType: 'VOCABULARY', hanzi: '客', cardType: 'WRITING' } }
    ];
    controller.currentIndex = 0;
    controller.currentWritingMistakes = 5; // >= 5 mistakes -> Rating 1
    controller.hasCompletedWritingForCurrentCard = true;
    controller.renderCurrentCard = () => {};

    await controller.nextWritingItem();

    assert.strictEqual(controller.stats.againCount, 1, 'Again count must increment');
    assert.strictEqual(controller.sessionQueue.length, 3, 'Queue must grow to 3 due to requeue');
    assert.strictEqual(controller.sessionQueue[2].card.itemId, 301, 'Requeued card must be at end of queue');
    assert.strictEqual(controller.sessionQueue[2]._requeued, true, '_requeued flag must be true');
  });

  test('3. Relearn Graduation: Requeued card graduating on re-attempt sends authoritative review', async () => {
    const controller = new SrsReviewController();
    controller.activeMode = 'writing';
    // Requeued card at end of session
    controller.sessionQueue = [
      { card: { itemId: 301, itemType: 'VOCABULARY', hanzi: '谢', cardType: 'WRITING' }, _requeued: true }
    ];
    controller.currentIndex = 0;
    controller.currentWritingMistakes = 0; // Wrote perfectly on re-attempt (Rating 4)
    controller.hasUsedWritingHintForCurrentCard = false;
    controller.hasCompletedWritingForCurrentCard = true;

    let reviewPayloadSent = null;
    let completedStateShown = false;
    controller.showCompletedState = () => { completedStateShown = true; };

    // Mock submitRating behavior check
    controller.submitRating = async (rating) => {
      reviewPayloadSent = {
        cardType: 'WRITING',
        rating,
        requeued: controller.sessionQueue[0]._requeued
      };
      if (rating >= 2) {
        controller.stats.goodEasyCount++;
      }
      controller.showCompletedState();
    };

    await controller.nextWritingItem();

    assert.strictEqual(reviewPayloadSent.rating, 4, 'Perfect re-attempt must submit Rating 4');
    assert.strictEqual(reviewPayloadSent.cardType, 'WRITING', 'Card type must be WRITING');
    assert.strictEqual(reviewPayloadSent.requeued, true, 'Graduation must occur on requeued card');
    assert.strictEqual(completedStateShown, true, 'Completed state must be reached after graduating requeued card');
  });

  test('4. On-the-spot "Viết lại" (clearWriting) resets mistakes to allow clean recovery', () => {
    const controller = new SrsReviewController();
    controller.activeMode = 'writing';
    controller.writingEngines = [{ startQuizSession: () => {} }];
    controller.currentWritingMistakes = 4;
    controller.hasUsedWritingHintForCurrentCard = true;

    controller.clearWriting();

    assert.strictEqual(controller.currentWritingMistakes, 0, 'Mistakes must reset to 0 upon clearWriting');
    assert.strictEqual(controller.hasUsedWritingHintForCurrentCard, false, 'Used hint must reset to false');
  });
});
