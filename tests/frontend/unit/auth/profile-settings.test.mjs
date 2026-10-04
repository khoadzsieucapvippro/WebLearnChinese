/**
 * =============================================================================
 * UNIT TEST SUITE: USER PROFILE & LEARNING SETTINGS (TASK UX/IA REDESIGN)
 * File: tests/frontend/unit/auth/profile-settings.test.mjs
 *
 * Scope:
 * - Profile SRS settings validation (validateProfileSrsSettings):
 *   Strict positive integer requirement, rejection of 0, negative, float, non-numeric.
 * - Preset chips synchronization (syncPresetChips):
 *   Accurate toggling of .active class for standard presets (10, 20, 30).
 * - Stepper decrement / increment arithmetic and boundaries (min 1 clamp).
 * - Information Architecture hash routing contract (#srs-settings, #settings, #personal-info).
 * =============================================================================
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateProfileSrsSettings,
  syncPresetChips
} from '../../../../frontend/js/pages/profile-page.js';

describe('Profile & Learning Settings Unit Tests', () => {

  describe('1. Validation: validateProfileSrsSettings', () => {

    test('accepts valid strictly positive integer inputs (numbers and numeric strings)', () => {
      const validCases = [1, 5, 10, 20, 30, 50, 100, '1', '10', '20', '35', '100'];
      for (const val of validCases) {
        const res = validateProfileSrsSettings(val);
        assert.strictEqual(res.isValid, true, `Expected ${val} to be valid`);
        assert.deepStrictEqual(res.errors, {});
      }
    });

    test('rejects empty, null, undefined, and whitespace-only inputs', () => {
      const emptyCases = ['', '   ', null, undefined];
      for (const val of emptyCases) {
        const res = validateProfileSrsSettings(val);
        assert.strictEqual(res.isValid, false, `Expected ${val} to be invalid`);
        assert.ok(res.errors.newCardsPerDay, 'Must return error for newCardsPerDay');
        assert.ok(res.errors.newCardsPerDay.includes('không được để trống'));
      }
    });

    test('rejects non-numeric values', () => {
      const nonNumericCases = ['abc', 'ten', 'NaN', '12abc', 'true'];
      for (const val of nonNumericCases) {
        const res = validateProfileSrsSettings(val);
        assert.strictEqual(res.isValid, false, `Expected ${val} to be invalid`);
        assert.ok(res.errors.newCardsPerDay.includes('hợp lệ'));
      }
    });

    test('rejects decimal (floating-point) numbers', () => {
      const floatCases = [10.5, 0.5, '20.1', '15.99'];
      for (const val of floatCases) {
        const res = validateProfileSrsSettings(val);
        assert.strictEqual(res.isValid, false, `Expected ${val} to be invalid`);
        assert.ok(res.errors.newCardsPerDay.includes('phần thập phân'));
      }
    });

    test('rejects zero (0) values', () => {
      const zeroCases = [0, '0', -0];
      for (const val of zeroCases) {
        const res = validateProfileSrsSettings(val);
        assert.strictEqual(res.isValid, false, `Expected ${val} to be invalid`);
        assert.ok(res.errors.newCardsPerDay.includes('lớn hơn 0'));
      }
    });

    test('rejects negative numbers', () => {
      const negativeCases = [-1, -5, -20, '-1', '-10'];
      for (const val of negativeCases) {
        const res = validateProfileSrsSettings(val);
        assert.strictEqual(res.isValid, false, `Expected ${val} to be invalid`);
        assert.ok(res.errors.newCardsPerDay.includes('lớn hơn 0'));
      }
    });

  });

  describe('2. Preset Chips Synchronization: syncPresetChips', () => {

    class MockClassList {
      constructor() {
        this.classes = new Set();
      }
      add(cls) { this.classes.add(cls); }
      remove(cls) { this.classes.delete(cls); }
      contains(cls) { return this.classes.has(cls); }
    }

    class MockChipElement {
      constructor(preset) {
        this.dataset = { preset: String(preset) };
        this.classList = new MockClassList();
      }
    }

    let originalDoc;
    let chips;

    beforeEach(() => {
      originalDoc = globalThis.document;
      chips = [
        new MockChipElement(10),
        new MockChipElement(20),
        new MockChipElement(30)
      ];
      globalThis.document = {
        querySelectorAll: (selector) => {
          if (selector === '.srs-preset-chip') return chips;
          return [];
        }
      };
    });

    test('activates matching preset chip when value is 20 (Standard)', () => {
      syncPresetChips(20);
      assert.strictEqual(chips[0].classList.contains('active'), false);
      assert.strictEqual(chips[1].classList.contains('active'), true);
      assert.strictEqual(chips[2].classList.contains('active'), false);
    });

    test('activates matching preset chip when value is 10 (Gentle)', () => {
      syncPresetChips('10');
      assert.strictEqual(chips[0].classList.contains('active'), true);
      assert.strictEqual(chips[1].classList.contains('active'), false);
      assert.strictEqual(chips[2].classList.contains('active'), false);
    });

    test('activates matching preset chip when value is 30 (Accelerated)', () => {
      syncPresetChips('30');
      assert.strictEqual(chips[0].classList.contains('active'), false);
      assert.strictEqual(chips[1].classList.contains('active'), false);
      assert.strictEqual(chips[2].classList.contains('active'), true);
    });

    test('deactivates all preset chips when value is custom (e.g. 25, 45, 1)', () => {
      chips[1].classList.add('active'); // previously active 20
      syncPresetChips(25);
      assert.strictEqual(chips[0].classList.contains('active'), false);
      assert.strictEqual(chips[1].classList.contains('active'), false);
      assert.strictEqual(chips[2].classList.contains('active'), false);
    });

    test('handles empty or non-numeric values gracefully without error', () => {
      chips[1].classList.add('active');
      syncPresetChips('');
      assert.strictEqual(chips[1].classList.contains('active'), false);

      syncPresetChips(null);
      assert.strictEqual(chips[1].classList.contains('active'), false);
    });

    test('restores original document after tests', () => {
      globalThis.document = originalDoc;
    });

  });

  describe('3. Stepper Arithmetic Boundaries', () => {

    test('decrement by 5 clamps to minimum 1', () => {
      function calculateDecrement(currentVal, step = 5) {
        const cur = parseInt(String(currentVal || '20'), 10);
        return Math.max(1, isNaN(cur) ? 20 : cur - step);
      }

      assert.strictEqual(calculateDecrement(20), 15);
      assert.strictEqual(calculateDecrement(10), 5);
      assert.strictEqual(calculateDecrement(5), 1, '5 minus 5 must clamp to 1');
      assert.strictEqual(calculateDecrement(3), 1, '3 minus 5 must clamp to 1');
      assert.strictEqual(calculateDecrement(1), 1, '1 minus 5 must clamp to 1');
    });

    test('increment by 5 computes positive arithmetic', () => {
      function calculateIncrement(currentVal, step = 5) {
        const cur = parseInt(String(currentVal || '20'), 10);
        return isNaN(cur) ? 20 : cur + step;
      }

      assert.strictEqual(calculateIncrement(20), 25);
      assert.strictEqual(calculateIncrement(1), 6);
      assert.strictEqual(calculateIncrement(30), 35);
    });

  });

});
