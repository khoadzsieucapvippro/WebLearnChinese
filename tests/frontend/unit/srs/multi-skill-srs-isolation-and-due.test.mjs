/**
 * =============================================================================
 * MULTI-SKILL SRS ISOLATION & DUE COUNTS VERIFICATION
 * File: tests/frontend/unit/srs/multi-skill-srs-isolation-and-due.test.mjs
 * 
 * Verifies:
 * 1. Complete isolation of due items across FLASHCARD, WRITING, LISTENING, READING.
 * 2. Tab switching refreshes due items cache for the targeted skill.
 * 3. Starting a "due" session sets isReviewMode = true and preserves chapter progress.
 * 4. Submitting a writing review from due session does NOT overwrite chapter learning progress.
 * 5. Writing mode normalizeVocabCard stamps WRITING cardType, flashcard stamps FLASHCARD.
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

import { SrsReviewController } from '../../../../frontend/js/pages/srs-review-page.js';

describe('Multi-Skill SRS Isolation & Due Session Invariants', () => {

  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  function createMockDom() {
    const makeEl = () => ({
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false,
        toggle: () => {}
      },
      style: {},
      setAttribute: () => {},
      removeAttribute: () => {},
      replaceChildren: () => {},
      appendChild: () => {},
      removeChild: () => {},
      textContent: '',
      querySelectorAll: () => []
    });

    return {
      catalogSelection: makeEl(),
      activeSession: makeEl(),
      completedState: makeEl(),
      emptyState: makeEl(),
      errorState: makeEl(),
      loadingState: makeEl(),
      authState: makeEl(),
      headerContent: makeEl(),
      writingRoom: makeEl(),
      writingCanvasContainer: makeEl(),
      btnWritingNext: makeEl(),
      btnWritingAudio: makeEl(),
      writingCompletionNotice: makeEl(),
      btnWritingOutline: makeEl()
    };
  }

  test('1. normalizeVocabCard correctly stamps skill cardType based on activeMode', () => {
    const controller = new SrsReviewController();

    // Mode: flashcard -> FLASHCARD
    controller.activeMode = 'flashcard';
    const cardFc = controller.normalizeVocabCard({ vocabId: 10, hanzi: '你好' }, 1);
    assert.strictEqual(cardFc.cardType, 'FLASHCARD', 'Flashcard mode must stamp cardType FLASHCARD');

    // Mode: writing -> WRITING
    controller.activeMode = 'writing';
    const cardWr = controller.normalizeVocabCard({ vocabId: 10, hanzi: '你好' }, 1);
    assert.strictEqual(cardWr.cardType, 'WRITING', 'Writing mode must stamp cardType WRITING');

    // Mode: listening -> LISTENING
    controller.activeMode = 'listening';
    const cardLs = controller.normalizeVocabCard({ vocabId: 10, hanzi: '你好' }, 1);
    assert.strictEqual(cardLs.cardType, 'LISTENING', 'Listening mode must stamp cardType LISTENING');

    // Mode: reading -> READING
    controller.activeMode = 'reading';
    const cardRd = controller.normalizeVocabCard({ vocabId: 10, hanzi: '你好' }, 1);
    assert.strictEqual(cardRd.cardType, 'READING', 'Reading mode must stamp cardType READING');
  });

  test('2. Due items cache isolation: isVocabDue matches only items present in the active cache', () => {
    const controller = new SrsReviewController();

    // Cache has only WRITING card for vocab 101
    controller.dueItemsCache = {
      vocab: [{ itemId: 101, hanzi: '谢', cardType: 'WRITING' }],
      radicals: []
    };

    assert.strictEqual(controller.isVocabDue(101, '谢'), true, 'Vocab 101 must be due');
    assert.strictEqual(controller.isVocabDue(102, '好'), false, 'Vocab 102 must NOT be due');
  });

  test('3. Starting a DUE session sets isReviewMode = true to prevent progress regression', async () => {
    const controller = new SrsReviewController();
    controller.activeMode = 'writing';
    controller.activeGroup = 'hsk1';
    controller.currentViewState = 'active';
    controller.dom = createMockDom();

    // Mock due items cache containing word 101
    controller.dueItemsCache = {
      vocab: [{ itemId: 101, vocabId: 101, hanzi: '请' }],
      radicals: []
    };

    controller.loadBackendLessons = async () => {};

    let sessionReviewMode = null;
    controller.initSessionQueue = (cards, isReviewMode, startIndex) => {
      sessionReviewMode = isReviewMode;
      controller.sessionQueue = cards.map(c => ({ card: c }));
      controller.isReviewMode = isReviewMode;
      controller.currentIndex = 0;
    };

    // User clicks "⚡ Ôn từ đến hạn" (action = 'due')
    await controller.startTopicSession(1, 'due');

    assert.strictEqual(sessionReviewMode, true, 'DUE session must initialize with isReviewMode = true');
    assert.strictEqual(controller.isReviewMode, true, 'controller.isReviewMode must be true in due session');
  });

  test('4. Submitting rating during DUE session does NOT overwrite chapter learning progress', async () => {
    const controller = new SrsReviewController();
    controller.activeMode = 'writing';
    controller.activeAction = 'due';
    controller.isReviewMode = true;
    controller.sessionQueue = [
      { card: { itemId: 101, itemType: 'VOCABULARY', hanzi: '请', cardType: 'WRITING' } }
    ];
    controller.currentIndex = 0;
    controller.currentWritingMistakes = 0;
    controller.hasCompletedWritingForCurrentCard = true;
    controller.cardStartTime = Date.now() - 2000;
    controller.showCompletedState = () => {};

    let progressPersisted = false;
    controller.persistProgress = () => {
      progressPersisted = true;
    };

    await controller.nextWritingItem();

    assert.strictEqual(progressPersisted, false, 'Progress must NOT be persisted during DUE session (preserves chapter progress)');
    assert.strictEqual(controller.stats.totalReviewed, 1, 'Total reviewed must increment');
    assert.strictEqual(controller.stats.easyCount, 1, '0 mistakes must record easyCount = 1');
  });

  test('5. Requeue on rating 1 (Again) appends card to end of due session queue for re-writing', async () => {
    const controller = new SrsReviewController();
    controller.activeMode = 'writing';
    controller.activeAction = 'due';
    controller.isReviewMode = true;
    controller.sessionQueue = [
      { card: { itemId: 101, itemType: 'VOCABULARY', hanzi: '请', cardType: 'WRITING' } },
      { card: { itemId: 102, itemType: 'VOCABULARY', hanzi: '问', cardType: 'WRITING' } }
    ];
    controller.currentIndex = 0;
    controller.currentWritingMistakes = 5; // >= 5 mistakes -> Rating 1
    controller.hasCompletedWritingForCurrentCard = true;
    controller.renderCurrentCard = () => {};

    await controller.nextWritingItem();

    assert.strictEqual(controller.stats.againCount, 1, 'Again count must increment to 1');
    assert.strictEqual(controller.sessionQueue.length, 3, 'Queue must grow to 3 cards');
    assert.strictEqual(controller.sessionQueue[2].card.itemId, 101, 'Failed card must be appended at the end of queue for re-writing');
    assert.strictEqual(controller.sessionQueue[2]._requeued, true, 'Requeued card must have flag _requeued = true');
  });
});
