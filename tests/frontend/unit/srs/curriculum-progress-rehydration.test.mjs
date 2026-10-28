/**
 * =============================================================================
 * UNIT TEST SUITE: CURRICULUM PROGRESS REHYDRATION & MULTI-DEVICE SYNC
 * File: tests/frontend/unit/srs/curriculum-progress-rehydration.test.mjs
 *
 * Verifies:
 * 1. resolveLessonId priority: legacy range 5..14 is evaluated before 1..15.
 * 2. rehydrateCurriculumProgressIfEmpty: restores progress from /srs/curriculum-progress
 *    when local storage is empty or missing for active user.
 * 3. demo-fallback-engine account preservation: ensures newly registered accounts
 *    are never wiped when dataset version is bumped.
 * 4. demo-fallback-engine /srs/curriculum-progress endpoint: returns compliant payload.
 * =============================================================================
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { SrsReviewController } from '../../../../frontend/js/pages/srs-review-page.js';
import { getProgress, saveProgress } from '../../../../frontend/js/pages/srs-review-page.js';
import { authManager } from '../../../../frontend/js/auth/auth-state.js';
import { demoFallbackEngine } from '../../../../frontend/js/api/demo-fallback-engine.js';

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

describe('Curriculum Progress Rehydration & Multi-Device Sync', () => {

  describe('1. resolveLessonId range priority (Legacy 5..14 vs 1..15)', () => {

    test('maps legacy ID 5..14 to lessons[numId - 5] before checking 1..15', () => {
      const controller = new SrsReviewController();
      controller.backendLessons = [
        { lessonId: 101, title: 'HSK 1 — Bài 01: Chào hỏi' },
        { lessonId: 102, title: 'HSK 1 — Bài 02: Cảm ơn' },
        { lessonId: 103, title: 'HSK 1 — Bài 03: Số đếm' },
        { lessonId: 104, title: 'HSK 1 — Bài 04: Gia đình' },
        { lessonId: 105, title: 'HSK 1 — Bài 05: Thời gian' }
      ];

      // Legacy ID 5 maps to index 0 (lessonId 101)
      const resolved5 = controller.resolveLessonId(5);
      assert.strictEqual(resolved5, 101, 'Legacy ID 5 must map to lessons[0] (lessonId 101)');

      // Legacy ID 6 maps to index 1 (lessonId 102)
      const resolved6 = controller.resolveLessonId(6);
      assert.strictEqual(resolved6, 102, 'Legacy ID 6 must map to lessons[1] (lessonId 102)');
    });

    test('falls back to HSK 1 range (1..15) when ID is 1..4 (outside legacy 5..14)', () => {
      const controller = new SrsReviewController();
      controller.backendLessons = [
        { lessonId: 101, title: 'HSK 1 — Bài 01: Chào hỏi' },
        { lessonId: 102, title: 'HSK 1 — Bài 02: Cảm ơn' },
        { lessonId: 103, title: 'HSK 1 — Bài 03: Số đếm' },
        { lessonId: 104, title: 'HSK 1 — Bài 04: Gia đình' }
      ];

      const resolved1 = controller.resolveLessonId(1);
      assert.strictEqual(resolved1, 101, 'ID 1 should match HSK 1 Bài 01');

      const resolved2 = controller.resolveLessonId(2);
      assert.strictEqual(resolved2, 102, 'ID 2 should match HSK 1 Bài 02');
    });

  });

  describe('2. rehydrateCurriculumProgressIfEmpty', () => {

    beforeEach(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
      authManager.clearSession();
    });

    test('does not overwrite existing local progress', async () => {
      const controller = new SrsReviewController();
      authManager.setSession({ token: 'mock-jwt-token-99', accountId: 99, emailOrPhone: 'user99@test.com', roles: ['Learner'] });

      // Simulate existing local progress
      saveProgress('flashcard', {
        hsk1: { topic_1: 20 }
      });

      let apiCalled = false;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        apiCalled = true;
        return { ok: true, json: async () => ({ code: 'SUCCESS', data: {} }) };
      };

      try {
        await controller.rehydrateCurriculumProgressIfEmpty();
        assert.strictEqual(apiCalled, false, 'Should not fetch curriculum-progress if local storage already has progress');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('rehydrates progress into localStorage when local storage is empty', async () => {
      const controller = new SrsReviewController();
      authManager.setSession({ token: 'mock-jwt-token-100', accountId: 100, emailOrPhone: 'syncuser@test.com', roles: ['Learner'] });

      controller.backendLessons = [
        { lessonId: 1, title: 'HSK 1 — Bài 01: Chào hỏi' },
        { lessonId: 2, title: 'HSK 1 — Bài 02: Cảm ơn' }
      ];
      controller.fullRadicalsCatalog = Array.from({ length: 214 }, (_, i) => ({
        radicalId: i + 1,
        character: String.fromCharCode(0x4e00 + i)
      }));
      controller.commonRadicals = controller.fullRadicalsCatalog.slice(0, 50);

      // Mock API response from /srs/curriculum-progress
      const mockApiResponse = {
        code: 'SUCCESS',
        data: {
          lessonProgress: { 1: 20, 2: 12 },
          chapterProgress: {
            radicals50_chapter_0: 10,
            radicals214_chapter_0: 20
          },
          totalLearnedVocabularies: 32,
          totalLearnedRadicals: 30,
          learnedVocabIds: [1, 2, 3],
          learnedRadicalIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        }
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url) => {
        if (String(url).includes('/srs/curriculum-progress')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => mockApiResponse
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ code: 'SUCCESS', data: [] })
        };
      };

      try {
        await controller.rehydrateCurriculumProgressIfEmpty();

        const rehydrated = getProgress('flashcard');
        assert.ok(rehydrated.hsk1, 'hsk1 progress must exist');
        assert.strictEqual(rehydrated.hsk1.topic_1, 20, 'topic_1 progress should be 20');
        assert.ok(rehydrated.radicals50, 'radicals50 progress must exist');
        assert.strictEqual(rehydrated.radicals50.chapter_0, 10, 'chapter_0 progress should be 10');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('does not overwrite flashcard mode if flashcard already has progress when rehydrating in writing mode', async () => {
      const controller = new SrsReviewController();
      controller.activeMode = 'writing';
      authManager.setSession({ token: 'mock-jwt-token-101', accountId: 101, emailOrPhone: 'multi@test.com', roles: ['Learner'] });

      // Simulate flashcard having existing local progress, but writing mode is empty
      saveProgress('flashcard', {
        hsk1: { topic_1: 25 }
      });

      controller.backendLessons = [{ lessonId: 1, title: 'HSK 1 — Bài 01: Chào hỏi' }];
      controller.fullRadicalsCatalog = [];
      controller.commonRadicals = [];

      const mockApiResponse = {
        code: 'SUCCESS',
        data: {
          lessonProgress: { 1: 10 },
          chapterProgress: {},
          totalLearnedVocabularies: 10,
          totalLearnedRadicals: 0,
          learnedVocabIds: [1],
          learnedRadicalIds: []
        }
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockApiResponse
      });

      try {
        await controller.rehydrateCurriculumProgressIfEmpty();

        const flashcardProgress = getProgress('flashcard');
        const writingProgress = getProgress('writing');

        // flashcard progress must NOT be overwritten from 25 down to 10
        assert.strictEqual(flashcardProgress.hsk1.topic_1, 25, 'Existing flashcard progress must be preserved');
        // writing progress should be rehydrated
        assert.strictEqual(writingProgress.hsk1.topic_1, 10, 'Empty writing progress should be rehydrated');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

  });

  describe('3. demo-fallback-engine: Account preservation on version bump & /srs/curriculum-progress', () => {

    test('preserves registered accounts, srsSettings, and personal notes when schemaVersion is bumped', () => {
      if (typeof localStorage !== 'undefined') {
        const oldData = {
          schemaVersion: 1, // older version
          accounts: [
            { accountId: 1, email: 'learner@gmail.com', roles: ['Learner'] },
            { accountId: 999, email: 'custom_registered@gmail.com', fullName: 'Học Viên Mới', roles: ['Learner'] }
          ],
          srsSettings: {
            newCardsPerDay: 45,
            maxReviewsPerDay: 90
          },
          notes: [
            {
              noteId: 77,
              vocabId: 2,
              content: 'Custom personal note for testing preservation',
              createdAt: '2026-08-01T10:00:00Z',
              updatedAt: '2026-08-01T10:00:00Z'
            }
          ],
          radicals: [],
          srsCards: []
        };
        localStorage.setItem('ELEARNING_DEMO_DATA', JSON.stringify(oldData));
        demoFallbackEngine.resetInMemoryData();

        const data = demoFallbackEngine.getData();
        const preservedUser = data.accounts.find(a => a.email === 'custom_registered@gmail.com');
        assert.ok(preservedUser, 'Registered user must be preserved after schema version bump');
        assert.strictEqual(preservedUser.accountId, 999);

        assert.strictEqual(data.srsSettings.newCardsPerDay, 45, 'Custom srsSettings must be preserved');
        assert.strictEqual(data.notes.some(n => n.noteId === 77), true, 'Custom personal notes must be preserved');
      }
    });

    test('handles GET /srs/curriculum-progress in demo fallback engine with commonRank mapped radicals', async () => {
      demoFallbackEngine.resetInMemoryData();
      const progress = await demoFallbackEngine.handleRequest('/srs/curriculum-progress', { method: 'GET' });

      assert.ok(progress, 'Response must be returned');
      assert.ok(typeof progress.lessonProgress === 'object', 'lessonProgress must be an object');
      assert.ok(typeof progress.chapterProgress === 'object', 'chapterProgress must be an object');
      assert.ok(Array.isArray(progress.learnedVocabIds), 'learnedVocabIds must be an array');
      assert.ok(Array.isArray(progress.learnedRadicalIds), 'learnedRadicalIds must be an array');
    });

  });

});

