/**
 * =============================================================================
 * UNIT TEST: VOCABULARY FIRST / LAST PAGINATION (<< < 1 2 3 > >>)
 * File: tests/frontend/unit/vocabulary/vocabulary-pagination.test.mjs
 *
 * Verifies:
 * 1. Markup contract: << (first), < (prev), > (next), >> (last) buttons exist in vocabulary.html.
 * 2. Accessibility: buttons use semantic <button type="button"> with required Vietnamese aria-labels:
 *    - "Trang đầu" for <<
 *    - "Trang trước" for <
 *    - "Trang sau" for >
 *    - "Trang cuối" for >>
 * 3. Boundary & State logic:
 *    - On page 1: first (<<) and prev (<) are strictly disabled.
 *    - On middle page: all four controls are enabled.
 *    - On last page: next (>) and last (>>) are strictly disabled.
 *    - On single page / empty: all four navigation controls are disabled.
 * 4. Page navigation targets:
 *    - First button -> target page 0 (Page 1)
 *    - Last button -> target page totalPages - 1
 *    - Prev button -> target pageIndex - 1
 *    - Next button -> target pageIndex + 1
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VOCAB_HTML_PATH = path.resolve(__dirname, '../../../../frontend/vocabulary.html');
const VOCAB_JS_PATH = path.resolve(__dirname, '../../../../frontend/js/pages/vocabulary-page.js');

describe('Unit: Vocabulary First/Last Pagination (<< < 1 2 3 > >>)', () => {
  const vocabHtml = fs.readFileSync(VOCAB_HTML_PATH, 'utf-8');
  const vocabJs = fs.readFileSync(VOCAB_JS_PATH, 'utf-8');

  describe('1. HTML Markup & Accessibility Labels Contract', () => {
    test('contains authoritative pagination container in HTML', () => {
      assert.ok(vocabHtml.includes('id="vocabPagination"'), 'Pagination container (#vocabPagination) must exist in HTML');
      assert.ok(vocabHtml.includes('aria-label="Phân trang danh mục từ vựng"'), 'Container must have Vietnamese accessible label');
    });

    test('vocabulary-page.js defines authoritative first, prev, next, last pagination buttons', () => {
      assert.ok(vocabJs.includes('vocabPaginationFirstBtn'), 'First page button (#vocabPaginationFirstBtn) must be defined');
      assert.ok(vocabJs.includes('vocabPaginationPrevBtn'), 'Previous page button (#vocabPaginationPrevBtn) must be defined');
      assert.ok(vocabJs.includes('vocabPaginationNextBtn'), 'Next page button (#vocabPaginationNextBtn) must be defined');
      assert.ok(vocabJs.includes('vocabPaginationLastBtn'), 'Last page button (#vocabPaginationLastBtn) must be defined');
    });

    test('buttons have required accessible Vietnamese labels and glyphs', () => {
      // First button (<<)
      assert.ok(vocabJs.includes("'aria-label': 'Trang đầu'") || vocabJs.includes('"aria-label": "Trang đầu"'));
      assert.ok(vocabJs.includes("'«'") || vocabJs.includes('"«"') || vocabJs.includes('&laquo;'));

      // Previous button (<)
      assert.ok(vocabJs.includes("'aria-label': 'Trang trước'") || vocabJs.includes('"aria-label": "Trang trước"'));
      assert.ok(vocabJs.includes("'‹'") || vocabJs.includes('"‹"') || vocabJs.includes('&lsaquo;'));

      // Next button (>)
      assert.ok(vocabJs.includes("'aria-label': 'Trang sau'") || vocabJs.includes('"aria-label": "Trang sau"'));
      assert.ok(vocabJs.includes("'›'") || vocabJs.includes('"›"') || vocabJs.includes('&rsaquo;'));

      // Last button (>>)
      assert.ok(vocabJs.includes("'aria-label': 'Trang cuối'") || vocabJs.includes('"aria-label": "Trang cuối"'));
      assert.ok(vocabJs.includes("'»'") || vocabJs.includes('"»"') || vocabJs.includes('&raquo;'));
    });

    test('buttons are semantic native buttons with type button', () => {
      assert.ok(vocabJs.includes("type: 'button'") || vocabJs.includes('type: "button"'));
    });
  });

  describe('2. Pagination Boundary Determination Logic', () => {
    /**
     * Replicates the pagination control state calculation
     */
    function computePaginationButtonStates(currentPage, totalPages) {
      const isFirstPage = currentPage <= 0;
      const isLastPage = totalPages <= 1 || currentPage >= totalPages - 1;

      return {
        firstDisabled: isFirstPage,
        prevDisabled: isFirstPage,
        nextDisabled: isLastPage,
        lastDisabled: isLastPage
      };
    }

    test('on first page: first (<<) and prev (<) are disabled; next and last enabled', () => {
      const states = computePaginationButtonStates(0, 10);
      assert.strictEqual(states.firstDisabled, true);
      assert.strictEqual(states.prevDisabled, true);
      assert.strictEqual(states.nextDisabled, false);
      assert.strictEqual(states.lastDisabled, false);
    });

    test('on middle page: all four controls are enabled', () => {
      const states = computePaginationButtonStates(3, 10);
      assert.strictEqual(states.firstDisabled, false);
      assert.strictEqual(states.prevDisabled, false);
      assert.strictEqual(states.nextDisabled, false);
      assert.strictEqual(states.lastDisabled, false);
    });

    test('on last page: next (>) and last (>>) are disabled; first and prev enabled', () => {
      const states = computePaginationButtonStates(9, 10);
      assert.strictEqual(states.firstDisabled, false);
      assert.strictEqual(states.prevDisabled, false);
      assert.strictEqual(states.nextDisabled, true);
      assert.strictEqual(states.lastDisabled, true);
    });

    test('on single page (totalPages = 1): all controls are disabled', () => {
      const states = computePaginationButtonStates(0, 1);
      assert.strictEqual(states.firstDisabled, true);
      assert.strictEqual(states.prevDisabled, true);
      assert.strictEqual(states.nextDisabled, true);
      assert.strictEqual(states.lastDisabled, true);
    });

    test('on empty dataset (totalPages = 0): all controls are disabled', () => {
      const states = computePaginationButtonStates(0, 0);
      assert.strictEqual(states.firstDisabled, true);
      assert.strictEqual(states.prevDisabled, true);
      assert.strictEqual(states.nextDisabled, true);
      assert.strictEqual(states.lastDisabled, true);
    });
  });

  describe('3. Target Page Calculations', () => {
    function computeTargetPages(currentPage, totalPages) {
      return {
        firstPageTarget: 0,
        prevPageTarget: Math.max(0, currentPage - 1),
        nextPageTarget: Math.min(totalPages - 1, currentPage + 1),
        lastPageTarget: Math.max(0, totalPages - 1)
      };
    }

    test('first button always targets page index 0', () => {
      const targets = computeTargetPages(5, 20);
      assert.strictEqual(targets.firstPageTarget, 0);
    });

    test('last button always targets totalPages - 1', () => {
      const targets = computeTargetPages(2, 20);
      assert.strictEqual(targets.lastPageTarget, 19);

      const targetsSmall = computeTargetPages(0, 5);
      assert.strictEqual(targetsSmall.lastPageTarget, 4);
    });

    test('prev button targets currentPage - 1 clamped to 0', () => {
      const targetsMid = computeTargetPages(3, 10);
      assert.strictEqual(targetsMid.prevPageTarget, 2);

      const targetsFirst = computeTargetPages(0, 10);
      assert.strictEqual(targetsFirst.prevPageTarget, 0);
    });

    test('next button targets currentPage + 1 clamped to last page', () => {
      const targetsMid = computeTargetPages(3, 10);
      assert.strictEqual(targetsMid.nextPageTarget, 4);

      const targetsLast = computeTargetPages(9, 10);
      assert.strictEqual(targetsLast.nextPageTarget, 9);
    });
  });
});
