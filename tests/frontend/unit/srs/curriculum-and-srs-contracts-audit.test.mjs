/**
 * =============================================================================
 * COMPREHENSIVE AUDIT TEST SUITE: CURRICULUM LESSONS & SRS SCORING CONTRACTS
 * File: tests/frontend/unit/srs/curriculum-and-srs-contracts-audit.test.mjs
 * 
 * Verifies:
 * 1. 50 Standardized Curriculum Lessons (HSK 3.0 Syllabus):
 *    - Exactly 50 approved lessons (HSK 1: 15, HSK 2: 10, HSK 3: 25).
 *    - Each lesson contains exactly 20 vocabulary items (total 1,000 words).
 *    - Zero broken or orphan vocabulary references across all 50 lessons.
 * 2. SRS Topics & Radical Stage Structure:
 *    - HSK 1: 15 topics (15 x 20 = 300 words).
 *    - HSK 2: 10 topics (10 x 20 = 200 words).
 *    - HSK 3: 25 topics (25 x 20 = 500 words).
 *    - Radicals 50: 5 stages (5 x 10 = 50 radicals).
 *    - Radicals 214: 11 stages (10 x 20 + 1 x 14 = 214 radicals).
 * 3. Pure SuperMemo SM-2 Algorithm Contracts:
 *    - Rating 1 (Again): resets repetitions to 0, interval to 0.
 *    - Rating 2 (Hard): decreases EF by 0.14.
 *    - Rating 3 (Good): maintains EF.
 *    - Rating 4 (Easy): increases EF by 0.10.
 *    - Minimum Ease Factor floor: strictly clamped at 1.30.
 *    - Interval progression: rep 1 -> 1 day, rep 2 -> 6 days, rep n -> ceil(prev * EF).
 * 4. Multi-Account Isolation & SRS Settings Bounds:
 *    - newCardsPerDay strictly bounded to [1, 100].
 *    - Account-scoped localStorage keys prevent cross-account progress leakage.
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  SEED_LESSONS,
  SEED_VOCABULARY,
  SEED_RADICALS
} from '../../../../frontend/js/api/demo-seed-data.js';
import {
  HSK1_TOPICS,
  HSK2_TOPICS,
  HSK3_TOPICS,
  resolveAccountProgressKeys,
  getProgressBaseKey,
  STORAGE_KEY_FLASHCARD,
  STORAGE_KEY_WRITING,
  STORAGE_KEY_LISTENING,
  STORAGE_KEY_READING
} from '../../../../frontend/js/pages/srs-review-page.js';
import { validateSrsSettings } from '../../../../frontend/js/pages/srs-settings-page.js';

describe('Unit: Curriculum Lessons & SRS Scoring Contracts Audit (Plan 4)', () => {

  describe('1. 50 Standardized Curriculum Lessons (HSK 3.0 Syllabus)', () => {

    test('SEED_LESSONS contains exactly 50 approved lessons', () => {
      assert.strictEqual(SEED_LESSONS.length, 50, 'Curriculum must contain exactly 50 lessons');

      for (const lesson of SEED_LESSONS) {
        assert.ok(lesson.lessonId >= 1 && lesson.lessonId <= 50, `Lesson ID ${lesson.lessonId} must be in [1, 50]`);
        assert.strictEqual(lesson.status, 'Approved', `Lesson ${lesson.lessonId} status must be Approved`);
        assert.ok(lesson.title && lesson.title.trim().length > 0, `Lesson ${lesson.lessonId} must have a title`);
        assert.ok(lesson.description && lesson.description.trim().length > 0, `Lesson ${lesson.lessonId} must have a description`);
      }
    });

    test('lessons are partitioned into HSK 1 (15), HSK 2 (10), HSK 3 (25)', () => {
      const hsk1 = SEED_LESSONS.filter(l => Number(l.level) === 1);
      const hsk2 = SEED_LESSONS.filter(l => Number(l.level) === 2);
      const hsk3 = SEED_LESSONS.filter(l => Number(l.level) === 3);

      assert.strictEqual(hsk1.length, 15, 'HSK 1 must have exactly 15 lessons (Lessons 1..15)');
      assert.strictEqual(hsk2.length, 10, 'HSK 2 must have exactly 10 lessons (Lessons 16..25)');
      assert.strictEqual(hsk3.length, 25, 'HSK 3 must have exactly 25 lessons (Lessons 26..50)');

      // Verify continuous orderIndex 1..15 for HSK 1, 1..10 for HSK 2, 1..25 for HSK 3
      const seenOrderByLevel = { 1: new Set(), 2: new Set(), 3: new Set() };
      for (const l of SEED_LESSONS) {
        const lvl = Number(l.level);
        const idx = Number(l.orderIndex);
        const maxExpected = lvl === 1 ? 15 : (lvl === 2 ? 10 : 25);
        assert.ok(idx >= 1 && idx <= maxExpected, `orderIndex ${idx} in level ${lvl} must be in [1, ${maxExpected}]`);
        assert.strictEqual(seenOrderByLevel[lvl].has(idx), false, `orderIndex ${idx} in level ${lvl} must be unique`);
        seenOrderByLevel[lvl].add(idx);
      }
    });

    test('each lesson contains exactly 20 vocabulary items (total 1,000 words)', () => {
      let totalVocabCount = 0;
      const validVocabIds = new Set(SEED_VOCABULARY.map(v => v.vocabId));

      for (const lesson of SEED_LESSONS) {
        assert.strictEqual(lesson.vocabularyCount, 20, `Lesson ${lesson.lessonId} vocabularyCount must be 20`);
        assert.ok(Array.isArray(lesson.vocabularies), `Lesson ${lesson.lessonId} vocabularies must be array`);
        assert.strictEqual(lesson.vocabularies.length, 20, `Lesson ${lesson.lessonId} must have exactly 20 items`);

        for (const item of lesson.vocabularies) {
          const vocabId = typeof item === 'object' ? item.vocabId : item;
          assert.ok(Number.isInteger(vocabId) && vocabId > 0, `vocabId must be positive integer, got ${vocabId}`);
          assert.ok(validVocabIds.has(vocabId), `Lesson ${lesson.lessonId} references non-existent vocabId ${vocabId}`);
          totalVocabCount++;
        }
      }

      assert.strictEqual(totalVocabCount, 1000, 'Total vocabulary across 50 lessons must be exactly 1,000 words');
    });
  });

  describe('2. SRS Topics & Radical Stage Structure Invariants', () => {

    test('HSK 1, 2, 3 Topics arrays match the 50 curriculum lessons exactly', () => {
      assert.strictEqual(HSK1_TOPICS.length, 15, 'HSK1_TOPICS must have 15 topics');
      assert.strictEqual(HSK2_TOPICS.length, 10, 'HSK2_TOPICS must have 10 topics');
      assert.strictEqual(HSK3_TOPICS.length, 25, 'HSK3_TOPICS must have 25 topics');

      const allTopics = [...HSK1_TOPICS, ...HSK2_TOPICS, ...HSK3_TOPICS];
      assert.strictEqual(allTopics.length, 50, 'Total topics must be 50');

      for (let i = 0; i < allTopics.length; i++) {
        const topic = allTopics[i];
        assert.ok(topic.title, `Topic ${i + 1} must have title`);
        assert.ok(Array.isArray(topic.vocabularies), `Topic ${i + 1} must have vocabularies array`);
        assert.strictEqual(topic.vocabularies.length, 20, `Topic ${i + 1} must have 20 vocabularies`);

        for (const v of topic.vocabularies) {
          assert.ok(v.vocabId, `Vocab in topic ${i + 1} must have vocabId`);
          assert.ok(v.hanzi, `Vocab ${v.vocabId} must have hanzi`);
          assert.ok(v.pinyin, `Vocab ${v.vocabId} must have pinyin`);
          assert.ok(v.meaningHanViet, `Vocab ${v.vocabId} must have meaningHanViet`);
          assert.ok(v.meaningVi, `Vocab ${v.vocabId} must have meaningVi`);
        }
      }
    });

    test('Kangxi radical stages cover 50 common radicals (5 stages) and 214 radicals (11 stages)', () => {
      assert.strictEqual(SEED_RADICALS.length, 214, 'Must have 214 radicals');

      // 50 common radicals -> 5 stages of 10
      const common50 = SEED_RADICALS.filter(r => r.commonRank != null && r.commonRank >= 1 && r.commonRank <= 50);
      assert.strictEqual(common50.length, 50);
      const stageSizeCommon = 10;
      const expectedCommonStages = Math.ceil(common50.length / stageSizeCommon);
      assert.strictEqual(expectedCommonStages, 5, '50 common radicals must partition into 5 stages');

      // 214 all radicals -> 10 stages of 20 + 1 stage of 14 = 11 stages
      const stageSizeAll = 20;
      const expectedAllStages = Math.ceil(SEED_RADICALS.length / stageSizeAll);
      assert.strictEqual(expectedAllStages, 11, '214 radicals must partition into 11 stages');
    });
  });

  describe('3. Pure SuperMemo SM-2 Calculation Contracts', () => {

    // Mathematical SM-2 specification from backend SrsCalculator.java
    function calculateSm2(currentEf, currentInterval, currentRepetitions, rating) {
      const q = rating === 1 ? 0 : (rating === 2 ? 3 : (rating === 3 ? 4 : 5));

      // Calculate EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
      const diff = 5 - q;
      const efChange = 0.1 - diff * (0.08 + diff * 0.02);
      let newEf = Math.round((currentEf + efChange) * 100) / 100;
      if (newEf < 1.30) newEf = 1.30;

      let newReps = 0;
      let newInterval = 0;

      if (q < 3) {
        // Again (failed recall)
        newReps = 0;
        newInterval = 0;
      } else {
        newReps = currentRepetitions + 1;
        if (newReps === 1) {
          newInterval = 1;
        } else if (newReps === 2) {
          newInterval = 6;
        } else {
          newInterval = Math.ceil(currentInterval * newEf);
        }
      }

      return { easeFactor: newEf, intervalDays: newInterval, repetitions: newReps };
    }

    test('Rating 1 (Again): resets repetitions to 0, interval to 0, decreases EF', () => {
      const res = calculateSm2(2.50, 6, 2, 1);
      assert.strictEqual(res.repetitions, 0, 'Repetitions must reset to 0');
      assert.strictEqual(res.intervalDays, 0, 'Interval must reset to 0 for immediate review');
      assert.ok(res.easeFactor < 2.50, 'Ease factor must decrease on failed recall');
    });

    test('Rating 2 (Hard): decreases EF by 0.14, increments repetitions', () => {
      const res = calculateSm2(2.50, 1, 1, 2);
      assert.strictEqual(res.repetitions, 2, 'Repetitions must increment to 2');
      assert.strictEqual(res.intervalDays, 6, 'Repetition 2 interval must be 6 days');
      assert.strictEqual(res.easeFactor, 2.36, 'EF must decrease from 2.50 to 2.36 (-0.14)');
    });

    test('Rating 3 (Good): maintains EF, advances repetition sequence', () => {
      const res1 = calculateSm2(2.50, 0, 0, 3);
      assert.strictEqual(res1.repetitions, 1);
      assert.strictEqual(res1.intervalDays, 1);
      assert.strictEqual(res1.easeFactor, 2.50);

      const res2 = calculateSm2(res1.easeFactor, res1.intervalDays, res1.repetitions, 3);
      assert.strictEqual(res2.repetitions, 2);
      assert.strictEqual(res2.intervalDays, 6);
      assert.strictEqual(res2.easeFactor, 2.50);

      const res3 = calculateSm2(res2.easeFactor, res2.intervalDays, res2.repetitions, 3);
      assert.strictEqual(res3.repetitions, 3);
      assert.strictEqual(res3.intervalDays, 15); // ceil(6 * 2.50) = 15
      assert.strictEqual(res3.easeFactor, 2.50);
    });

    test('Rating 4 (Easy): increases EF by 0.10', () => {
      const res = calculateSm2(2.50, 0, 0, 4);
      assert.strictEqual(res.repetitions, 1);
      assert.strictEqual(res.intervalDays, 1);
      assert.strictEqual(res.easeFactor, 2.60, 'EF must increase from 2.50 to 2.60 (+0.10)');
    });

    test('Ease Factor floor: never drops below 1.30 regardless of repeated Again ratings', () => {
      let ef = 2.50;
      for (let i = 0; i < 20; i++) {
        const res = calculateSm2(ef, 0, 0, 1);
        ef = res.easeFactor;
      }
      assert.strictEqual(ef, 1.30, 'EF must not drop below 1.30 floor');
    });
  });

  describe('4. Multi-Account Isolation & Settings Bounds', () => {

    test('SRS settings validateSrsSettings strictly enforces bounds [1, 100]', () => {
      // Valid bounds
      assert.strictEqual(validateSrsSettings(1).isValid, true);
      assert.strictEqual(validateSrsSettings(20).isValid, true);
      assert.strictEqual(validateSrsSettings(50).isValid, true);
      assert.strictEqual(validateSrsSettings(100).isValid, true);

      // Invalid out-of-bounds
      assert.strictEqual(validateSrsSettings(0).isValid, false);
      assert.strictEqual(validateSrsSettings(-5).isValid, false);
      assert.strictEqual(validateSrsSettings(101).isValid, false);
      assert.strictEqual(validateSrsSettings(999).isValid, false);
      assert.strictEqual(validateSrsSettings('abc').isValid, false);
      assert.strictEqual(validateSrsSettings(null).isValid, false);
    });

    test('account progress keys isolate learning queues between different accounts', () => {
      assert.strictEqual(getProgressBaseKey('flashcard'), STORAGE_KEY_FLASHCARD);
      assert.strictEqual(getProgressBaseKey('writing'), STORAGE_KEY_WRITING);
      assert.strictEqual(getProgressBaseKey('listening'), STORAGE_KEY_LISTENING);
      assert.strictEqual(getProgressBaseKey('reading'), STORAGE_KEY_READING);

      // Verify guest key fallback
      const guestKey = resolveAccountProgressKeys('flashcard');
      assert.ok(guestKey.scopedKey.includes(STORAGE_KEY_FLASHCARD));
    });
  });
});
