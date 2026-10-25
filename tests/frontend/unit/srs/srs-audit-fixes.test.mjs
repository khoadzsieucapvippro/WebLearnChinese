/**
 * =============================================================================
 * UNIT TEST SUITE: SRS FLASHCARD & WRITING AUDIT FIXES (AREAS A - F)
 * Module: tests/frontend/unit/srs/srs-audit-fixes.test.mjs
 * 
 * Verifies the 6 key bug fixes across Flashcard and Luyện viết:
 * - Area A: Inconsistent stroke data loading (case insensitivity & hex fallbacks)
 * - Area B: Writing premature auto-completion prevention (0 chars, partial multi-char)
 * - Area C: Chapter progress persistence & restoration (chapter_* keys, mode isolation)
 * - Area D: SRS Review API failure handling (non-swallowed errors, preserved retry)
 * - Area E: Card type filter & progress isolation (READING vs WRITING)
 * - Area F: Concurrency lock & anti multi-triggering in Writing
 * =============================================================================
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  SrsReviewController,
  getProgress,
  saveProgress,
  buildReviewPayload,
  STORAGE_KEY_FLASHCARD,
  STORAGE_KEY_WRITING
} from '../../../../frontend/js/pages/srs-review-page.js';
import { loadStrokeData } from '../../../../frontend/js/ui/character-writing/stroke-data-loader.js';

if (typeof global.document === 'undefined') {
  function makeEl(tag = 'div') {
    const classes = new Set();
    const attrs = new Map();
    const children = [];
    const elObj = {
      tagName: tag.toUpperCase(),
      id: '',
      children,
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
      style: {},
      textContent: '',
      disabled: false,
      addEventListener: () => {},
      removeEventListener: () => {},
      replaceChildren: (...newChildren) => {
        children.length = 0;
        if (newChildren.length > 0) children.push(...newChildren);
      },
      appendChild: (ch) => { children.push(ch); return ch; },
      querySelector: (selector) => {
        function find(node) {
          if (!node) return null;
          if (selector.startsWith('#') && node.id === selector.slice(1)) return node;
          if (selector.startsWith('.') && node.classList?.contains(selector.slice(1))) return node;
          if (node.tagName && selector.toUpperCase() === node.tagName) return node;
          if (Array.isArray(node.children)) {
            for (const child of node.children) {
              const match = find(child);
              if (match) return match;
            }
          }
          return null;
        }
        for (const ch of children) {
          const match = find(ch);
          if (match) return match;
        }
        return null;
      },
      querySelectorAll: () => []
    };
    return elObj;
  }

  global.document = {
    body: makeEl('body'),
    documentElement: { getAttribute: () => null },
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => makeEl(tag),
    createElementNS: (ns, tag) => makeEl(tag),
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

function createMockDom() {
  return {
    ratingFeedback: global.document.createElement('div'),
    btnRatingAgain: global.document.createElement('button'),
    btnRatingHard: global.document.createElement('button'),
    btnRatingGood: global.document.createElement('button'),
    btnRatingEasy: global.document.createElement('button'),
    btnWritingNext: global.document.createElement('button'),
    btnWritingAudio: global.document.createElement('button'),
    btnWritingOutline: global.document.createElement('button'),
    writingCanvasContainer: global.document.createElement('div'),
    writingCompletionNotice: global.document.createElement('div'),
    writingMissingWarning: global.document.createElement('div')
  };
}

describe('Unit: SRS Flashcard & Writing Audit Fixes', () => {

  beforeEach(() => {
    globalThis.localStorage.clear();
    authManager.clearSession();
  });

  // ---------------------------------------------------------------------------
  // AREA A: Inconsistent Stroke Data Loading
  // ---------------------------------------------------------------------------
  describe('Area A: Stroke Data Loading & Fallback Candidates', () => {
    test('loadStrokeData successfully loads existing character data (学)', async () => {
      const data = await loadStrokeData('学');
      assert.ok(data, 'Stroke data for 学 should load successfully');
      assert.ok(Array.isArray(data.strokes), 'Strokes must be an array');
      assert.ok(Array.isArray(data.medians), 'Medians must be an array');
    });

    test('loadStrokeData returns null gracefully for non-existent characters', async () => {
      const data = await loadStrokeData('𠀀'); // Rare/missing character
      assert.strictEqual(data, null, 'Non-existent character must return null without unhandled crashes');
    });
  });

  // ---------------------------------------------------------------------------
  // AREA B: Premature Writing Auto-completion
  // ---------------------------------------------------------------------------
  describe('Area B: Writing Premature Auto-Completion Prevention', () => {
    test('renderWritingRoomCard does NOT complete card when characters length is 0', async () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'writing';
      controller.dom = createMockDom();
      let completedCalled = false;
      controller.handleWritingItemCompleted = () => { completedCalled = true; };

      await controller.renderWritingRoomCard({ hanzi: '' });
      assert.strictEqual(completedCalled, false, 'Should not auto-complete on empty hanzi');
      assert.strictEqual(controller.hasCompletedWritingForCurrentCard, false);
    });

    test('multi-character word (学生) does NOT complete when only 1 character is finished', () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'writing';
      controller.dom = createMockDom();
      controller.totalRequiredCharCount = 2;
      controller.writingEngines = [{}, {}]; // 2 loaded engines

      let completedCalled = false;
      controller.handleWritingItemCompleted = () => { completedCalled = true; };

      // Finish first character only
      controller.handleWritingCharComplete(0);

      assert.strictEqual(completedCalled, false, 'Must NOT complete when only 1 of 2 characters is finished');
      assert.strictEqual(controller.completedCharIndices.has(0), true);
      assert.strictEqual(controller.completedCharIndices.size, 1);

      // Finish second character
      controller.handleWritingCharComplete(1);
      assert.strictEqual(completedCalled, true, 'Must complete when all 2 characters are finished');
    });

    test('multi-character word does NOT complete if fewer engines loaded than required', () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'writing';
      controller.dom = createMockDom();
      controller.totalRequiredCharCount = 2;
      controller.writingEngines = [{}]; // Only 1 engine loaded due to missing data

      let completedCalled = false;
      controller.handleWritingItemCompleted = () => { completedCalled = true; };

      controller.handleWritingCharComplete(0);
      assert.strictEqual(completedCalled, false, 'Must NOT complete if engine count is less than total required characters');
    });
  });

  // ---------------------------------------------------------------------------
  // AREA C: Chapter Progress Persistence & Restoration
  // ---------------------------------------------------------------------------
  describe('Area C: Chapter Progress Persistence & Restoration', () => {
    test('persistProgress saves chapter index under chapter_${idx} and updates lastChapterIdx', () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'flashcard';
      controller.activeGroup = 'radicals50';
      controller.currentChapterIdx = 2; // Chapter 3 (0-indexed)
      controller.lessonId = null;

      controller.persistProgress('flashcard', 5);

      const saved = getProgress('flashcard');
      assert.ok(saved.radicals50, 'radicals50 progress must exist');
      assert.strictEqual(saved.radicals50.chapter_2, 5, 'chapter_2 must store progress index 5');
      assert.strictEqual(saved.radicals50.lastChapterIdx, 2, 'lastChapterIdx must be 2');
    });

    test('different chapters in the same deck maintain distinct progress without overwriting', () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'flashcard';
      controller.activeGroup = 'radicals214';
      controller.lessonId = null;

      controller.currentChapterIdx = 0;
      controller.persistProgress('flashcard', 10);

      controller.currentChapterIdx = 1;
      controller.persistProgress('flashcard', 7);

      const saved = getProgress('flashcard');
      assert.strictEqual(saved.radicals214.chapter_0, 10, 'chapter_0 progress must be preserved');
      assert.strictEqual(saved.radicals214.chapter_1, 7, 'chapter_1 progress must be preserved');
      assert.strictEqual(saved.radicals214.lastChapterIdx, 1, 'lastChapterIdx must track latest chapter');
    });

    test('Flashcard and Writing progress are completely isolated', () => {
      const controller = new SrsReviewController();
      controller.activeGroup = 'radicals50';
      controller.currentChapterIdx = 0;
      controller.lessonId = null;

      // Persist in flashcard mode
      controller.activeMode = 'flashcard';
      controller.persistProgress('flashcard', 4);

      // Persist in writing mode
      controller.activeMode = 'writing';
      controller.persistProgress('writing', 8);

      const fcProgress = getProgress('flashcard');
      const wrProgress = getProgress('writing');

      assert.strictEqual(fcProgress.radicals50.chapter_0, 4, 'Flashcard progress must be 4');
      assert.strictEqual(wrProgress.radicals50.chapter_0, 8, 'Writing progress must be 8');
    });

    test('startChapterSession with continue action restores queue at savedIndex', async () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'flashcard';

      // Pre-seed progress for radicals50 chapter 0
      saveProgress('flashcard', {
        radicals50: {
          chapter_0: 3
        }
      });

      controller.fetchRadicalsData = async () => {};
      controller.commonRadicals = Array.from({ length: 50 }, (_, i) => ({
        radicalId: i + 1,
        character: `字${i + 1}`,
        meaningVi: `Nghĩa ${i + 1}`
      }));

      let passedQueue = null;
      let passedIndex = null;
      controller.initSessionQueue = (queue, isReview, startIndex) => {
        passedQueue = queue;
        passedIndex = startIndex;
      };

      await controller.startChapterSession('radicals50', 0, 'continue');

      assert.strictEqual(passedQueue.length, 10, 'Chapter 0 must have 10 radicals');
      assert.strictEqual(passedIndex, 3, 'Must restore startIndex to savedIndex = 3');
    });
  });

  // ---------------------------------------------------------------------------
  // AREA D: SRS Review API Failure Handling
  // ---------------------------------------------------------------------------
  describe('Area D: SRS Review API Failure Handling', () => {
    test('submitRating does not advance or persist progress when API fails, offers retry', async () => {
      authManager.setSession({ token: 'test-token', user: { accountId: 1 } });
      const controller = new SrsReviewController();
      controller.activeMode = 'flashcard';
      controller.dom = createMockDom();
      controller.sessionQueue = [
        { card: { itemId: 101, itemType: 'VOCABULARY', hanzi: '好', cardType: 'READING' } },
        { card: { itemId: 102, itemType: 'VOCABULARY', hanzi: '你', cardType: 'READING' } }
      ];
      controller.currentIndex = 0;

      let persistCalled = false;
      controller.persistProgress = () => { persistCalled = true; };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url) => {
        if (String(url).includes('/srs/review')) {
          return {
            ok: false,
            status: 500,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ code: 'ERROR', message: 'Database connection failed' })
          };
        }
        throw new Error('Not found');
      };

      try {
        await controller.submitRating(3);

        // Verification of invariants on API failure:
        assert.strictEqual(controller.currentIndex, 0, 'Index must NOT advance on API failure');
        assert.strictEqual(controller.stats.totalReviewed, 0, 'Stats must NOT count failed review');
        assert.strictEqual(persistCalled, false, 'Progress must NOT be persisted on API failure');
        assert.strictEqual(controller.isSubmitting, false, 'isSubmitting lock must be released');

        // Check retry UI
        const retryBtn = controller.dom.ratingFeedback.querySelector('#btn-retry-rating');
        assert.ok(retryBtn, 'Retry button must be rendered in ratingFeedback');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('nextWritingItem does not advance or persist progress when API fails', async () => {
      authManager.setSession({ token: 'test-token', user: { accountId: 1 } });
      const controller = new SrsReviewController();
      controller.activeMode = 'writing';
      controller.dom = createMockDom();
      controller.sessionQueue = [
        { card: { itemId: 201, itemType: 'VOCABULARY', hanzi: '谢', cardType: 'WRITING' } },
        { card: { itemId: 202, itemType: 'VOCABULARY', hanzi: '见', cardType: 'WRITING' } }
      ];
      controller.currentIndex = 0;
      controller.hasCompletedWritingForCurrentCard = true;

      let persistCalled = false;
      controller.persistProgress = () => { persistCalled = true; };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url) => {
        if (String(url).includes('/srs/review')) {
          return {
            ok: false,
            status: 500,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ code: 'SERVER_ERROR', message: 'Internal error' })
          };
        }
        throw new Error('Not found');
      };

      try {
        await controller.nextWritingItem();

        assert.strictEqual(controller.currentIndex, 0, 'Writing index must NOT advance on API failure');
        assert.strictEqual(persistCalled, false, 'Writing progress must NOT be saved on API failure');
        assert.strictEqual(controller.isSubmittingWriting, false, 'Writing submission lock must be released');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // ---------------------------------------------------------------------------
  // AREA E: Card Type Isolation (READING vs WRITING)
  // ---------------------------------------------------------------------------
  describe('Area E: Card Type Filter & Progress Isolation', () => {
    test('normalizeVocabCard tags cardType READING for flashcard and WRITING for writing', () => {
      const controller = new SrsReviewController();
      const rawVocab = { vocabId: 10, hanzi: '大', pinyin: 'dà', meaningVi: 'To lớn' };

      controller.activeMode = 'flashcard';
      const cardFc = controller.normalizeVocabCard(rawVocab);
      assert.strictEqual(cardFc.cardType, 'READING', 'Flashcard vocab card must have cardType READING');

      controller.activeMode = 'writing';
      const cardWr = controller.normalizeVocabCard(rawVocab);
      assert.strictEqual(cardWr.cardType, 'WRITING', 'Writing vocab card must have cardType WRITING');
    });

    test('buildReviewPayload enforces cardType according to mode', () => {
      const readingPayload = buildReviewPayload({
        itemType: 'VOCABULARY',
        itemId: 10,
        cardType: 'READING',
        rating: 3,
        reviewTimeSeconds: 5
      });
      assert.strictEqual(readingPayload.cardType, 'READING');

      const writingPayload = buildReviewPayload({
        itemType: 'VOCABULARY',
        itemId: 10,
        cardType: 'WRITING',
        rating: 3,
        reviewTimeSeconds: 5
      });
      assert.strictEqual(writingPayload.cardType, 'WRITING');
    });
  });

  // ---------------------------------------------------------------------------
  // AREA F: Prevent Multi-Triggering in Writing
  // ---------------------------------------------------------------------------
  describe('Area F: Prevent Multi-Triggering in Writing', () => {
    test('nextWritingItem locks against concurrent execution via isSubmittingWriting', async () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'writing';
      controller.dom = createMockDom();
      controller.sessionQueue = [
        { card: { itemId: 301, itemType: 'VOCABULARY', hanzi: '再' } },
        { card: { itemId: 302, itemType: 'VOCABULARY', hanzi: '见' } }
      ];
      controller.currentIndex = 0;
      controller.hasCompletedWritingForCurrentCard = true;
      controller.renderCurrentCard = () => {};

      // Simulate first call that takes some time
      controller.isSubmittingWriting = true;

      // Second call during in-flight submission
      await controller.nextWritingItem();

      // Ensure no double advance occurred
      assert.strictEqual(controller.currentIndex, 0, 'Must NOT advance while isSubmittingWriting is true');
      assert.strictEqual(controller.stats.totalReviewed, 0);
    });
  });

  // ---------------------------------------------------------------------------
  // AREA G: Multi-Account LocalStorage Progress & Note Isolation (P1-DATA-1)
  // ---------------------------------------------------------------------------
  describe('Area G: Multi-Account Progress & Note Isolation (P1-DATA-1)', () => {
    test('isolates SRS progress and radical notes between different authenticated accounts on the same browser', () => {
      const originalGetUser = authManager.getUser;
      try {
        // 1. Account 101 logs in and saves progress
        authManager.getUser = () => ({ accountId: 101, emailOrPhone: 'user101@example.com', roles: ['Learner'] });
        saveProgress('flashcard', { hsk1: { chapter_0: 9, lastChapterIdx: 0 } });

        const acc101Progress = getProgress('flashcard');
        assert.strictEqual(acc101Progress.hsk1?.chapter_0, 9);

        // 2. Account 202 logs in on the same browser — must NOT inherit Account 101's progress
        authManager.getUser = () => ({ accountId: 202, emailOrPhone: 'user202@example.com', roles: ['Learner'] });
        const acc202Initial = getProgress('flashcard');
        assert.deepStrictEqual(acc202Initial, {}, 'Account 202 must not read Account 101 progress');

        saveProgress('flashcard', { hsk1: { chapter_0: 3, lastChapterIdx: 0 } });
        assert.strictEqual(getProgress('flashcard').hsk1?.chapter_0, 3);

        // 3. Switch back to Account 101 — must still have Account 101's progress (9) intact
        authManager.getUser = () => ({ accountId: 101, emailOrPhone: 'user101@example.com', roles: ['Learner'] });
        assert.strictEqual(getProgress('flashcard').hsk1?.chapter_0, 9, 'Account 101 progress must remain 9');
      } finally {
        authManager.getUser = originalGetUser;
      }
    });
  });
});
