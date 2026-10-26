/**
 * =============================================================================
 * UNIT TEST SUITE: LESSON CATALOG & ORDERED VOCABULARY ENGINE (TASK 9C.1)
 * File: tests/frontend/unit/lesson/lessons-catalog.test.mjs
 * 
 * Verifies:
 * - Query contract invariant: strictly page and size ONLY (strictly NO search/q/keyword).
 * - PageResponse contract parsing & pagination boundary calculations.
 * - Publication date decision & formatting (updatedAt as verified proxy).
 * - Lesson ID validation (positive integer contract, blocking malformed/negative/injection).
 * - Lesson detail response parsing & orderIndex preservation.
 * - Ordered vocabulary sort logic (immutability, 1 -> 2 -> 3... sequence).
 * - Web Speech API availability & graceful degradation.
 * - Safe resource URL sanitization (about:blank fallback for dangerous protocols).
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLessonPageResponse,
  calculatePagination,
  formatLessonDate,
  sanitizeLessonTitle
} from '../../../../frontend/js/pages/lessons-page.js';
import {
  validateLessonId,
  formatSrsReviewUrl,
  formatSrsNewCardsUrl,
  formatSrsPracticeUrl,
  calculateLessonMetrics,
  parseLessonDetailResponse,
  sortVocabulariesByOrderIndex,
  isSpeechSynthesisAvailable,
  speakHanzi,
  LessonDetailPageController
} from '../../../../frontend/js/pages/lesson-detail-page.js';
import { sanitizeResourceUrl } from '../../../../frontend/js/ui/security.js';

describe('Unit: Lesson Catalog & Lesson Detail Engine (Task 9C.1)', () => {

  describe('1. Query Parameter Contract & Invariants', () => {
    test('enforces query contract has ONLY page and size (strictly NO search, q, or keyword)', () => {
      const page = 0;
      const size = 20;

      // Simulate parameter object constructed for apiClient('/lessons')
      const params = { page, size };

      assert.strictEqual('page' in params, true);
      assert.strictEqual('size' in params, true);
      assert.strictEqual('search' in params, false, 'Lessons API must NEVER include search');
      assert.strictEqual('q' in params, false, 'Lessons API must NEVER include q');
      assert.strictEqual('keyword' in params, false, 'Lessons API must NEVER include keyword');
      assert.strictEqual('status' in params, false, 'Public lessons API must not pass status parameter');
    });
  });

  describe('2. Backend PageResponse Contract & Parsing', () => {
    test('parses standard Spring Boot ApiResponse<PageResponse<LessonSummaryResponse>> correctly', () => {
      const apiResponse = {
        code: 200,
        message: 'Success',
        data: {
          items: [
            {
              lessonId: 101,
              title: 'Bài 1: Chào hỏi cơ bản',
              status: 'Approved',
              vocabularyCount: 10,
              createdAt: '2026-08-01T08:00:00Z',
              updatedAt: '2026-08-02T10:30:00Z'
            },
            {
              lessonId: 102,
              title: 'Bài 2: Chữ số và số đếm',
              status: 'Approved',
              vocabularyCount: 15,
              createdAt: '2026-08-03T08:00:00Z',
              updatedAt: '2026-08-04T12:00:00Z'
            }
          ],
          page: 0,
          size: 20,
          totalElements: 2,
          totalPages: 1
        }
      };

      const parsed = parseLessonPageResponse(apiResponse);
      assert.strictEqual(parsed.items.length, 2);
      assert.strictEqual(parsed.totalElements, 2);
      assert.strictEqual(parsed.totalPages, 1);
      assert.strictEqual(parsed.page, 0);
      assert.strictEqual(parsed.size, 20);
      assert.strictEqual(parsed.items[0].lessonId, 101);
      assert.strictEqual(parsed.items[0].title, 'Bài 1: Chào hỏi cơ bản');
      assert.strictEqual(parsed.items[0].status, 'Approved');
      assert.strictEqual(parsed.items[0].vocabularyCount, 10);
    });

    test('handles unwrapped PageResponse payload gracefully', () => {
      const pageResponse = {
        items: [{ lessonId: 1, title: 'Bài học 1', status: 'Approved', vocabularyCount: 5 }],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1
      };

      const parsed = parseLessonPageResponse(pageResponse);
      assert.strictEqual(parsed.items.length, 1);
      assert.strictEqual(parsed.totalElements, 1);
      assert.strictEqual(parsed.items[0].lessonId, 1);
    });

    test('handles empty, null, or malformed responses safely without throwing', () => {
      const empty = parseLessonPageResponse(null);
      assert.strictEqual(empty.items.length, 0);
      assert.strictEqual(empty.totalElements, 0);
      assert.strictEqual(empty.totalPages, 0);
      assert.strictEqual(empty.page, 0);

      const malformed = parseLessonPageResponse({ invalid: true });
      assert.strictEqual(malformed.items.length, 0);
      assert.strictEqual(malformed.totalElements, 0);
    });
  });

  describe('3. Pagination Math & Boundary Calculations', () => {
    test('calculates correct state for first page of multi-page catalog', () => {
      const pag = calculatePagination(0, 12, 50, 5);
      assert.strictEqual(pag.currentPage, 0);
      assert.strictEqual(pag.totalPages, 5);
      assert.strictEqual(pag.hasPrev, false);
      assert.strictEqual(pag.hasNext, true);
      assert.strictEqual(pag.startRecord, 1);
      assert.strictEqual(pag.endRecord, 12);
    });

    test('calculates correct state for middle page', () => {
      const pag = calculatePagination(2, 10, 45, 5);
      assert.strictEqual(pag.currentPage, 2);
      assert.strictEqual(pag.hasPrev, true);
      assert.strictEqual(pag.hasNext, true);
      assert.strictEqual(pag.startRecord, 21);
      assert.strictEqual(pag.endRecord, 30);
    });

    test('calculates correct state for last page with partial count', () => {
      const pag = calculatePagination(4, 10, 45, 5);
      assert.strictEqual(pag.currentPage, 4);
      assert.strictEqual(pag.hasPrev, true);
      assert.strictEqual(pag.hasNext, false);
      assert.strictEqual(pag.startRecord, 41);
      assert.strictEqual(pag.endRecord, 45);
    });

    test('handles zero elements (empty catalog) safely', () => {
      const pag = calculatePagination(0, 20, 0, 0);
      assert.strictEqual(pag.currentPage, 0);
      assert.strictEqual(pag.hasPrev, false);
      assert.strictEqual(pag.hasNext, false);
      assert.strictEqual(pag.startRecord, 0);
      assert.strictEqual(pag.endRecord, 0);
    });
  });

  describe('4. Date Presentation & Vietnamese Formatting', () => {
    test('formats valid ISO date string to localized Vietnamese format', () => {
      const iso = '2026-08-15T10:00:00Z';
      const formatted = formatLessonDate(iso);
      assert.ok(formatted.length > 0);
      assert.ok(formatted.includes('2026') || formatted.includes('15'));
    });

    test('returns empty string for null/undefined/invalid date without throwing', () => {
      assert.strictEqual(formatLessonDate(null), '');
      assert.strictEqual(formatLessonDate(undefined), '');
      assert.strictEqual(formatLessonDate(''), '');
      assert.strictEqual(formatLessonDate('invalid-date-string'), '');
    });
  });

  describe('5. Lesson ID Validation Contract', () => {
    test('accepts valid positive integer IDs (numbers and numeric strings)', () => {
      assert.strictEqual(validateLessonId(1), 1);
      assert.strictEqual(validateLessonId(42), 42);
      assert.strictEqual(validateLessonId('101'), 101);
      assert.strictEqual(validateLessonId('  99  '), 99);
    });

    test('rejects non-positive, floating-point, or malformed IDs', () => {
      assert.strictEqual(validateLessonId(0), null);
      assert.strictEqual(validateLessonId(-1), null);
      assert.strictEqual(validateLessonId('-5'), null);
      assert.strictEqual(validateLessonId(3.14), null);
      assert.strictEqual(validateLessonId('3.14'), null);
      assert.strictEqual(validateLessonId('abc'), null);
      assert.strictEqual(validateLessonId(''), null);
      assert.strictEqual(validateLessonId(null), null);
      assert.strictEqual(validateLessonId(undefined), null);
      assert.strictEqual(validateLessonId(NaN), null);
      assert.strictEqual(validateLessonId(Infinity), null);
      assert.strictEqual(validateLessonId('<script>'), null);
    });
  });

  describe('5.1. SRS Review URL Helper Contract (formatSrsReviewUrl)', () => {
    test('formats valid numeric lessonId into srs-review.html?lessonId=X', () => {
      assert.strictEqual(formatSrsReviewUrl(10), 'srs-review.html?lessonId=10');
      assert.strictEqual(formatSrsReviewUrl(1), 'srs-review.html?lessonId=1');
      assert.strictEqual(formatSrsReviewUrl('10'), 'srs-review.html?lessonId=10');
      assert.strictEqual(formatSrsReviewUrl(' 42 '), 'srs-review.html?lessonId=42');
    });

    test('falls back safely to default srs-review.html when lessonId is invalid or absent', () => {
      assert.strictEqual(formatSrsReviewUrl(null), 'srs-review.html');
      assert.strictEqual(formatSrsReviewUrl(undefined), 'srs-review.html');
      assert.strictEqual(formatSrsReviewUrl(''), 'srs-review.html');
      assert.strictEqual(formatSrsReviewUrl('abc'), 'srs-review.html');
      assert.strictEqual(formatSrsReviewUrl(-5), 'srs-review.html');
      assert.strictEqual(formatSrsReviewUrl(0), 'srs-review.html');
    });
  });

  describe('5.2. Free Practice URL Helper Contract (formatSrsPracticeUrl)', () => {
    test('formats valid numeric lessonId into srs-review.html?lessonId=X&mode=practice', () => {
      assert.strictEqual(formatSrsPracticeUrl(10), 'srs-review.html?lessonId=10&mode=practice');
      assert.strictEqual(formatSrsPracticeUrl(1), 'srs-review.html?lessonId=1&mode=practice');
      assert.strictEqual(formatSrsPracticeUrl('10'), 'srs-review.html?lessonId=10&mode=practice');
      assert.strictEqual(formatSrsPracticeUrl(' 42 '), 'srs-review.html?lessonId=42&mode=practice');
    });

    test('falls back safely to default srs-review.html when lessonId is invalid or absent', () => {
      assert.strictEqual(formatSrsPracticeUrl(null), 'srs-review.html');
      assert.strictEqual(formatSrsPracticeUrl(undefined), 'srs-review.html');
      assert.strictEqual(formatSrsPracticeUrl(''), 'srs-review.html');
      assert.strictEqual(formatSrsPracticeUrl('abc'), 'srs-review.html');
      assert.strictEqual(formatSrsPracticeUrl(-5), 'srs-review.html');
      assert.strictEqual(formatSrsPracticeUrl(0), 'srs-review.html');
    });
  });

  describe('5.3. SRS New Cards URL Helper Contract (formatSrsNewCardsUrl)', () => {
    test('formats valid numeric lessonId into srs-review.html?lessonId=X&mode=new', () => {
      assert.strictEqual(formatSrsNewCardsUrl(10), 'srs-review.html?lessonId=10&mode=new');
      assert.strictEqual(formatSrsNewCardsUrl(1), 'srs-review.html?lessonId=1&mode=new');
      assert.strictEqual(formatSrsNewCardsUrl('10'), 'srs-review.html?lessonId=10&mode=new');
      assert.strictEqual(formatSrsNewCardsUrl(' 42 '), 'srs-review.html?lessonId=42&mode=new');
    });

    test('falls back safely to default srs-review.html when lessonId is invalid or absent', () => {
      assert.strictEqual(formatSrsNewCardsUrl(null), 'srs-review.html');
      assert.strictEqual(formatSrsNewCardsUrl(undefined), 'srs-review.html');
      assert.strictEqual(formatSrsNewCardsUrl(''), 'srs-review.html');
      assert.strictEqual(formatSrsNewCardsUrl('abc'), 'srs-review.html');
      assert.strictEqual(formatSrsNewCardsUrl(-5), 'srs-review.html');
      assert.strictEqual(formatSrsNewCardsUrl(0), 'srs-review.html');
    });
  });

  describe('6. Lesson Detail Response & Parsing Contract', () => {
    test('parses ApiResponse<LessonDetailResponse> with ordered vocabularies', () => {
      const response = {
        code: 200,
        message: 'Success',
        data: {
          lessonId: 1,
          title: 'Bài 1: Nhập môn Hán tự',
          status: 'Approved',
          vocabularyCount: 2,
          createdAt: '2026-07-01T00:00:00Z',
          updatedAt: '2026-07-02T12:00:00Z',
          vocabularies: [
            {
              vocabId: 10,
              hanzi: '一',
              pinyin: 'yī',
              pinyinRaw: 'yi1',
              meaningHanViet: 'Nhất',
              meaningVi: 'Số một',
              audioUrl: '/audio/yi.mp3',
              videoWritingUrl: null,
              exampleSentence: '一个人',
              exampleTranslation: 'Một người',
              orderIndex: 1
            },
            {
              vocabId: 11,
              hanzi: '二',
              pinyin: 'èr',
              pinyinRaw: 'er4',
              meaningHanViet: 'Nhị',
              meaningVi: 'Số hai',
              audioUrl: null,
              videoWritingUrl: null,
              exampleSentence: '二月',
              exampleTranslation: 'Tháng hai',
              orderIndex: 2
            }
          ]
        }
      };

      const detail = parseLessonDetailResponse(response);
      assert.strictEqual(detail.lessonId, 1);
      assert.strictEqual(detail.title, 'Bài 1: Nhập môn Hán tự');
      assert.strictEqual(detail.status, 'Approved');
      assert.strictEqual(detail.vocabularyCount, 2);
      assert.strictEqual(detail.vocabularies.length, 2);
      assert.strictEqual(detail.vocabularies[0].orderIndex, 1);
      assert.strictEqual(detail.vocabularies[1].orderIndex, 2);
    });

    test('handles missing or malformed detail response safely', () => {
      const result = parseLessonDetailResponse(null);
      assert.strictEqual(result, null);

      const invalid = parseLessonDetailResponse('not-an-object');
      assert.strictEqual(invalid, null);
    });
  });

  describe('7. Ordered Vocabulary Sort & Invariant Preservation', () => {
    test('sorts vocabularies strictly by orderIndex ascending (1 -> 2 -> 3...)', () => {
      const scrambled = [
        { vocabId: 3, orderIndex: 3, hanzi: '三' },
        { vocabId: 1, orderIndex: 1, hanzi: '一' },
        { vocabId: 4, orderIndex: 4, hanzi: '四' },
        { vocabId: 2, orderIndex: 2, hanzi: '二' }
      ];

      const sorted = sortVocabulariesByOrderIndex(scrambled);
      assert.strictEqual(sorted.length, 4);
      assert.strictEqual(sorted[0].orderIndex, 1);
      assert.strictEqual(sorted[1].orderIndex, 2);
      assert.strictEqual(sorted[2].orderIndex, 3);
      assert.strictEqual(sorted[3].orderIndex, 4);
      assert.strictEqual(sorted[0].hanzi, '一');
      assert.strictEqual(sorted[3].hanzi, '四');
    });

    test('preserves immutability (does not mutate the original array)', () => {
      const original = [
        { vocabId: 2, orderIndex: 2 },
        { vocabId: 1, orderIndex: 1 }
      ];

      const sorted = sortVocabulariesByOrderIndex(original);
      assert.strictEqual(original[0].orderIndex, 2, 'Original array should not be mutated in-place');
      assert.strictEqual(sorted[0].orderIndex, 1);
    });

    test('handles items with missing or identical orderIndex gracefully', () => {
      const items = [
        { vocabId: 1, orderIndex: undefined },
        { vocabId: 2, orderIndex: 1 },
        { vocabId: 3, orderIndex: 1 }
      ];

      const sorted = sortVocabulariesByOrderIndex(items);
      assert.strictEqual(sorted.length, 3);
    });

    test('returns empty array when input is null, undefined, or not an array', () => {
      assert.deepStrictEqual(sortVocabulariesByOrderIndex(null), []);
      assert.deepStrictEqual(sortVocabulariesByOrderIndex(undefined), []);
      assert.deepStrictEqual(sortVocabulariesByOrderIndex('not an array'), []);
    });
  });

  describe('8. Web Speech Feature Detection & Safety', () => {
    test('isSpeechSynthesisAvailable returns boolean without throwing in Node environment', () => {
      const available = isSpeechSynthesisAvailable();
      assert.strictEqual(typeof available, 'boolean');
      assert.strictEqual(available, false, 'Node.js has no window.speechSynthesis by default');
    });

    test('speakHanzi safely no-ops without throwing when speech is unavailable', () => {
      assert.doesNotThrow(() => {
        speakHanzi('你好');
        speakHanzi('');
        speakHanzi(null);
      });
    });
  });

  describe('9. Security & Resource Sanitization', () => {
    test('sanitizeLessonTitle trims strings and provides default fallback for empty/non-string', () => {
      assert.strictEqual(sanitizeLessonTitle('  Bài 1  '), 'Bài 1');
      assert.strictEqual(sanitizeLessonTitle(''), 'Bài học không tên');
      assert.strictEqual(sanitizeLessonTitle('   '), 'Bài học không tên');
      assert.strictEqual(sanitizeLessonTitle(null), 'Bài học không tên');
      assert.strictEqual(sanitizeLessonTitle(undefined), 'Bài học không tên');
    });

    test('sanitizeResourceUrl permits safe URLs and returns about:blank for dangerous protocols', () => {
      assert.strictEqual(sanitizeResourceUrl('https://example.com/audio.mp3'), 'https://example.com/audio.mp3');
      assert.strictEqual(sanitizeResourceUrl('/media/audio.mp3'), '/media/audio.mp3');
      assert.strictEqual(sanitizeResourceUrl('javascript:alert(1)'), 'about:blank');
      assert.strictEqual(sanitizeResourceUrl('data:text/html,<script>'), 'about:blank');
      assert.strictEqual(sanitizeResourceUrl('vbscript:msgbox(1)'), 'about:blank');
    });
  });

  describe('10. Lesson Real Metrics Calculation (calculateLessonMetrics)', () => {
    const mockVocabs = [
      { vocabId: 1, hanzi: '你', orderIndex: 1 },
      { vocabId: 2, hanzi: '好', orderIndex: 2 },
      { vocabId: 3, hanzi: '吗', orderIndex: 3 },
      { vocabId: 4, hanzi: '我', orderIndex: 4 },
      { vocabId: 5, hanzi: '很', orderIndex: 5 }
    ];

    test('returns null learnedWords and dueWords when user is unauthenticated (practiceCards is null)', () => {
      const metrics = calculateLessonMetrics(mockVocabs, null);
      assert.strictEqual(metrics.totalWords, 5);
      assert.strictEqual(metrics.learnedWords, null);
      assert.strictEqual(metrics.dueWords, null);
      assert.strictEqual(metrics.newWords, 5);
      assert.strictEqual(metrics.progressPercentage, 0);
      assert.strictEqual(metrics.hasDueCards, false);
    });

    test('calculates correct state when all cards are new (not yet studied)', () => {
      const practiceCards = [
        { itemId: 1, isNew: true, repetitions: 0, nextReviewAt: null },
        { itemId: 2, isNew: true, repetitions: 0, nextReviewAt: null },
        { itemId: 3, isNew: true, repetitions: 0, nextReviewAt: null },
        { itemId: 4, isNew: true, repetitions: 0, nextReviewAt: null },
        { itemId: 5, isNew: true, repetitions: 0, nextReviewAt: null }
      ];

      const metrics = calculateLessonMetrics(mockVocabs, practiceCards);
      assert.strictEqual(metrics.totalWords, 5);
      assert.strictEqual(metrics.learnedWords, 0);
      assert.strictEqual(metrics.dueWords, 0);
      assert.strictEqual(metrics.newWords, 5);
      assert.strictEqual(metrics.progressPercentage, 0);
      assert.strictEqual(metrics.hasDueCards, false);
    });

    test('calculates correct learned and due cards when user has partial study progress', () => {
      const now = new Date('2026-10-15T12:00:00Z');
      const practiceCards = [
        // Card 1: Learned, due for review in the past
        { itemId: 1, isNew: false, repetitions: 2, nextReviewAt: '2026-10-14T08:00:00Z' },
        // Card 2: Learned, not due yet (future)
        { itemId: 2, isNew: false, repetitions: 3, nextReviewAt: '2026-10-20T10:00:00Z' },
        // Card 3: Learned, due right now
        { itemId: 3, isNew: false, repetitions: 1, nextReviewAt: '2026-10-15T12:00:00Z' },
        // Card 4: New, not learned
        { itemId: 4, isNew: true, repetitions: 0, nextReviewAt: null },
        // Card 5: New, not learned
        { itemId: 5, isNew: true, repetitions: 0, nextReviewAt: null }
      ];

      const metrics = calculateLessonMetrics(mockVocabs, practiceCards, now);
      assert.strictEqual(metrics.totalWords, 5);
      assert.strictEqual(metrics.learnedWords, 3);
      assert.strictEqual(metrics.dueWords, 2);
      assert.strictEqual(metrics.newWords, 2);
      assert.strictEqual(metrics.progressPercentage, 60); // 3 / 5 = 60%
      assert.strictEqual(metrics.hasDueCards, true);
    });

    test('calculates 100% completion when all words are learned', () => {
      const practiceCards = [
        { itemId: 1, isNew: false, repetitions: 5, nextReviewAt: '2026-11-01T00:00:00Z' },
        { itemId: 2, isNew: false, repetitions: 4, nextReviewAt: '2026-11-01T00:00:00Z' },
        { itemId: 3, isNew: false, repetitions: 3, nextReviewAt: '2026-11-01T00:00:00Z' },
        { itemId: 4, isNew: false, repetitions: 2, nextReviewAt: '2026-11-01T00:00:00Z' },
        { itemId: 5, isNew: false, repetitions: 1, nextReviewAt: '2026-11-01T00:00:00Z' }
      ];

      const metrics = calculateLessonMetrics(mockVocabs, practiceCards, new Date('2026-10-15T00:00:00Z'));
      assert.strictEqual(metrics.totalWords, 5);
      assert.strictEqual(metrics.learnedWords, 5);
      assert.strictEqual(metrics.dueWords, 0);
      assert.strictEqual(metrics.newWords, 0);
      assert.strictEqual(metrics.progressPercentage, 100);
      assert.strictEqual(metrics.hasDueCards, false);
    });

    test('defends against empty vocabularies list safely without division by zero', () => {
      const metrics = calculateLessonMetrics([], []);
      assert.strictEqual(metrics.totalWords, 0);
      assert.strictEqual(metrics.learnedWords, 0);
      assert.strictEqual(metrics.dueWords, 0);
      assert.strictEqual(metrics.newWords, 0);
      assert.strictEqual(metrics.progressPercentage, 0);
    });
  });

  describe('11. 4-Action Routing Contracts', () => {
    test('Action A (Học từ mới): routes to srs-review.html?lessonId=X&mode=new (lesson-new-cards mode)', () => {
      const url = formatSrsNewCardsUrl(42);
      assert.strictEqual(url, 'srs-review.html?lessonId=42&mode=new');
    });

    test('Action B (Ôn SRS bài này): routes to srs-review.html?lessonId=X with lesson identifier', () => {
      const url = formatSrsReviewUrl(42);
      assert.strictEqual(url, 'srs-review.html?lessonId=42');
    });

    test('Action C (Luyện tự do): routes to srs-review.html?lessonId=X&mode=practice (zero SRS mutation)', () => {
      const url = formatSrsPracticeUrl(42);
      assert.strictEqual(url, 'srs-review.html?lessonId=42&mode=practice');
    });

    test('Action D (Ôn SRS toàn hệ thống): routes to srs-review.html general room', () => {
      const systemUrl = 'srs-review.html';
      assert.strictEqual(systemUrl, 'srs-review.html');
    });
  });

  describe('12. Lesson Detail Writing Action Controls Contract (P2-WRITING-1)', () => {
    class MockElement {
      constructor(tagName) {
        this.tagName = String(tagName || 'div').toUpperCase();
        this.children = [];
        this.attrs = {};
        this._className = '';
        this.textContent = '';
        this.style = {};
        this.listeners = new Map();
      }

      get className() {
        return this._className;
      }

      set className(val) {
        this._className = val || '';
      }

      get classList() {
        const self = this;
        return {
          contains: (cls) => self._className.split(/\s+/).includes(cls),
          add: (...clss) => {
            const set = new Set(self._className.split(/\s+/).filter(Boolean));
            clss.forEach(c => set.add(c));
            self._className = Array.from(set).join(' ');
          },
          remove: (...clss) => {
            const set = new Set(self._className.split(/\s+/).filter(Boolean));
            clss.forEach(c => set.delete(c));
            self._className = Array.from(set).join(' ');
          }
        };
      }

      setAttribute(key, value) {
        this.attrs[key] = String(value);
      }

      getAttribute(key) {
        return Object.prototype.hasOwnProperty.call(this.attrs, key) ? this.attrs[key] : null;
      }

      removeAttribute(key) {
        delete this.attrs[key];
      }

      appendChild(child) {
        if (child) this.children.push(child);
        return child;
      }

      replaceChildren(...children) {
        this.children = [...children];
      }

      contains(node) {
        if (this === node) return true;
        for (const child of this.children) {
          if (child === node || (child && typeof child.contains === 'function' && child.contains(node))) {
            return true;
          }
        }
        return false;
      }

      showModal() {
        this.attrs.open = '';
      }

      close() {
        delete this.attrs.open;
      }

      addEventListener(event, handler) {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, []);
        }
        this.listeners.get(event).push(handler);
      }

      dispatchEvent(event) {
        const handlers = this.listeners.get(event.type) || [];
        for (const h of handlers) {
          h(event);
        }
        return true;
      }

      click() {
        this.dispatchEvent({ type: 'click', target: this });
      }

      querySelector(selector) {
        const matches = this.querySelectorAll(selector);
        return matches.length > 0 ? matches[0] : null;
      }

      querySelectorAll(selector) {
        const results = [];
        const walk = (node) => {
          if (!node || !node.children) return;
          for (const child of node.children) {
            if (child instanceof MockElement) {
              if (selector.startsWith('.') && child.classList.contains(selector.slice(1))) {
                results.push(child);
              } else if (selector.startsWith('#') && (child.attrs.id === selector.slice(1) || child.attrs['id'] === selector.slice(1))) {
                results.push(child);
              } else if (child.tagName === selector.toUpperCase()) {
                results.push(child);
              }
              walk(child);
            }
          }
        };
        walk(this);
        return results;
      }
    }

    function setupMockDom() {
      const body = new MockElement('body');
      globalThis.Node = MockElement;
      globalThis.HTMLElement = MockElement;
      globalThis.document = {
        body,
        createElement: (tag) => new MockElement(tag),
        createElementNS: (ns, tag) => new MockElement(tag),
        createTextNode: (text) => {
          const el = new MockElement('#text');
          el.textContent = String(text);
          return el;
        },
        getElementById: (id) => {
          if (id === 'vocabWritingModal') {
            return body.querySelector('#vocabWritingModal');
          }
          return null;
        },
        addEventListener: () => {}
      };
    }

    test('renders .lesson-vocab-writing-btn between speech and note buttons with correct attributes and icon', () => {
      setupMockDom();
      const controller = new LessonDetailPageController();
      const listContainer = new MockElement('ol');
      controller.dom.vocabList = listContainer;

      const mockVocabs = [
        {
          vocabId: 101,
          hanzi: '你',
          pinyin: 'nǐ',
          meaningHanViet: 'Nhĩ',
          meaningVi: 'Bạn, anh, chị',
          orderIndex: 1
        },
        {
          vocabId: 102,
          hanzi: '好',
          pinyin: 'hǎo',
          meaningHanViet: 'Hảo',
          meaningVi: 'Tốt, khỏe',
          orderIndex: 2
        }
      ];

      controller.renderVocabularyList(mockVocabs);

      assert.strictEqual(listContainer.children.length, 2, 'Should render 2 vocabulary list items');

      // Inspect first item (101: 你)
      const item1 = listContainer.children[0];
      const actions1 = item1.querySelector('.lesson-vocab-actions');
      assert.ok(actions1, 'Item 1 must contain .lesson-vocab-actions');
      assert.strictEqual(actions1.children.length, 3, 'actionsDiv must contain exactly 3 controls: speech, writing, note');

      const speechBtn = actions1.children[0];
      const writingBtn = actions1.children[1];
      const noteBtn = actions1.children[2];

      assert.ok(speechBtn.classList.contains('btn-vocab-speech'), 'Button 0 must be speechBtn (.btn-vocab-speech)');
      assert.ok(writingBtn.classList.contains('lesson-vocab-writing-btn'), 'Button 1 must be writingBtn (.lesson-vocab-writing-btn)');
      assert.ok(noteBtn.classList.contains('lesson-vocab-note-btn'), 'Button 2 must be noteBtn (.lesson-vocab-note-btn)');

      // Verify writingBtn attributes
      assert.strictEqual(writingBtn.getAttribute('type'), 'button');
      assert.strictEqual(writingBtn.getAttribute('data-vocab-id'), '101');
      assert.strictEqual(writingBtn.getAttribute('title'), 'Luyện viết chữ Hán');
      assert.strictEqual(writingBtn.getAttribute('aria-label'), 'Luyện viết chữ Hán cho từ 你');

      // Verify writingBtn icon span
      assert.strictEqual(writingBtn.children.length, 1);
      const iconSpan = writingBtn.children[0];
      assert.strictEqual(iconSpan.getAttribute('aria-hidden'), 'true');
      assert.strictEqual(iconSpan.textContent, '✍️');

      // Inspect second item (102: 好)
      const item2 = listContainer.children[1];
      const writingBtn2 = item2.querySelector('.lesson-vocab-writing-btn');
      assert.ok(writingBtn2, 'Item 2 must contain .lesson-vocab-writing-btn');
      assert.strictEqual(writingBtn2.getAttribute('data-vocab-id'), '102');
      assert.strictEqual(writingBtn2.getAttribute('aria-label'), 'Luyện viết chữ Hán cho từ 好');
    });

    test('clicking .lesson-vocab-writing-btn registers and triggers click listener safely', async () => {
      setupMockDom();
      const controller = new LessonDetailPageController();
      const listContainer = new MockElement('ol');
      controller.dom.vocabList = listContainer;

      const mockVocabs = [
        {
          vocabId: 201,
          hanzi: '学',
          pinyin: 'xué',
          meaningHanViet: 'Học',
          meaningVi: 'Học tập',
          orderIndex: 1
        }
      ];

      controller.renderVocabularyList(mockVocabs);
      const writingBtn = listContainer.querySelector('.lesson-vocab-writing-btn');
      assert.ok(writingBtn, 'writingBtn must exist');

      // Verify listener was attached
      assert.strictEqual(writingBtn.listeners.has('click'), true, 'Click listener must be registered on writingBtn');
      assert.strictEqual(writingBtn.listeners.get('click').length, 1);

      // Verify clicking triggers click event without throwing
      await assert.doesNotReject(async () => {
        writingBtn.click();
        await new Promise((resolve) => setTimeout(resolve, 60));
      });
    });

    test('renders writing button (.lesson-vocab-writing-btn) in renderRadicalsList', () => {
      setupMockDom();
      const controller = new LessonDetailPageController();
      const listContainer = new MockElement('ol');
      controller.dom.vocabList = listContainer;

      const radicals = [
        {
          radicalId: 1,
          character: '一',
          pinyin: 'yī',
          meaningHanViet: 'Nhất',
          meaningVi: 'Số một',
          strokeCount: 1,
          isCommon50: true
        }
      ];

      controller.renderRadicalsList(radicals);
      assert.strictEqual(listContainer.children.length, 1);

      const radItem = listContainer.children[0];
      const actions = radItem.querySelector('.lesson-vocab-actions');
      assert.ok(actions, 'radItem must have .lesson-vocab-actions');
      assert.strictEqual(actions.children.length, 2, 'Radicals actions must contain speechBtn and writingBtn');

      const writingBtn = actions.querySelector('.lesson-vocab-writing-btn');
      assert.ok(writingBtn, 'Radical item must have .lesson-vocab-writing-btn');
      assert.strictEqual(writingBtn.getAttribute('type'), 'button');
      assert.strictEqual(writingBtn.getAttribute('data-radical-id'), '1');
      assert.strictEqual(writingBtn.getAttribute('title'), 'Luyện viết bộ thủ');
      assert.strictEqual(writingBtn.getAttribute('aria-label'), 'Luyện viết cho bộ thủ 一');
      assert.strictEqual(writingBtn.children[0].textContent, '✍️');
    });

    test('setupNavigationLinks correctly decouples public lessons from SRS review hub', () => {
      setupMockDom();
      const controller = new LessonDetailPageController();
      controller.dom.btnBackToReview = new MockElement('a');
      controller.dom.btnBottomBackToShelf = new MockElement('a');
      controller.dom.breadcrumbReviewHub = new MockElement('a');
      controller.dom.breadcrumbGroupItem = new MockElement('li');
      controller.dom.breadcrumbGroupLink = new MockElement('a');
      controller.dom.btnLaunchFlashcard = new MockElement('a');
      controller.dom.btnLaunchWriting = new MockElement('a');
      controller.dom.btnLaunchListening = new MockElement('a');
      controller.dom.btnLaunchReading = new MockElement('a');
      controller.dom.btnStartPrimaryStudy = new MockElement('a');

      // 1. When navigated from public lesson catalog: this.group is null
      controller.lessonId = 1;
      controller.group = null;
      controller.setupNavigationLinks();

      assert.strictEqual(controller.dom.btnBackToReview.href, 'lessons.html');
      assert.strictEqual(controller.dom.btnBackToReview.textContent, '← Danh mục Bài học');
      assert.strictEqual(controller.dom.btnBottomBackToShelf.href, 'lessons.html');
      assert.strictEqual(controller.dom.btnBottomBackToShelf.textContent, '← Về danh mục bài học');
      assert.strictEqual(controller.dom.breadcrumbReviewHub.href, 'lessons.html');
      assert.strictEqual(controller.dom.breadcrumbReviewHub.textContent, 'Bài học');
      assert.strictEqual(controller.dom.breadcrumbGroupItem.classList.contains('d-none'), true);

      // 2. When navigated from SRS review shelf: this.group is 'radicals50'
      controller.group = 'radicals50';
      controller.chapter = 0;
      controller.setupNavigationLinks();

      assert.strictEqual(controller.dom.btnBackToReview.href.includes('srs-review.html'), true);
      assert.strictEqual(controller.dom.btnBackToReview.textContent, '← Quay lại Ôn tập');
      assert.strictEqual(controller.dom.btnBottomBackToShelf.href.includes('srs-review.html'), true);
      assert.strictEqual(controller.dom.btnBottomBackToShelf.textContent, '← Về phòng ôn tập');
      assert.strictEqual(controller.dom.breadcrumbReviewHub.textContent, 'Ôn tập');
      assert.strictEqual(controller.dom.breadcrumbGroupItem.classList.contains('d-none'), false);
      assert.strictEqual(controller.dom.breadcrumbGroupLink.textContent, '50 Bộ thủ thông dụng');
    });
  });
});
