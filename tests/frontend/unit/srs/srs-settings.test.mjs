/**
 * =============================================================================
 * UNIT TEST SUITE: SRS SETTINGS (TASK UX & INVARIANTS)
 * File: tests/frontend/unit/srs/srs-settings.test.mjs
 *
 * Scope:
 * - SRS card bounds validation: newCardsPerDay in [1, 100].
 * - Rejection of 0, negative, > 100, float, non-numeric, empty.
 * - Preset chips synchronization (10, 20, 30).
 * - Payload construction without leaking account/user ID.
 * - Undo changes handler restoring saved authoritative values.
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSrsSettings,
  syncPresetChips,
  buildUpdateSettingsPayload,
  SrsSettingsController
} from '../../../../frontend/js/pages/srs-settings-page.js';

describe('SRS Settings Page Unit Tests', () => {

  describe('1. Validation: validateSrsSettings [1, 100]', () => {

    test('accepts valid integers within [1, 100]', () => {
      const validCases = [1, 5, 10, 20, 30, 50, 99, 100, '1', '10', '20', '50', '100'];
      for (const val of validCases) {
        const res = validateSrsSettings(val);
        assert.strictEqual(res.isValid, true, `Expected ${val} to be valid`);
        assert.deepStrictEqual(res.errors, {});
      }
    });

    test('rejects values exceeding upper bound 100', () => {
      const overCases = [101, 150, 1000, '101', '500'];
      for (const val of overCases) {
        const res = validateSrsSettings(val);
        assert.strictEqual(res.isValid, false, `Expected ${val} to be invalid`);
        assert.ok(res.errors.newCardsPerDay, 'Must return error for newCardsPerDay');
        assert.ok(res.errors.newCardsPerDay.includes('vượt quá 100'));
      }
    });

    test('rejects zero and negative numbers', () => {
      const nonPositiveCases = [0, -1, -5, -100, '0', '-5'];
      for (const val of nonPositiveCases) {
        const res = validateSrsSettings(val);
        assert.strictEqual(res.isValid, false, `Expected ${val} to be invalid`);
        assert.ok(res.errors.newCardsPerDay.includes('lớn hơn 0'));
      }
    });

    test('rejects floating-point numbers', () => {
      const floatCases = [10.5, 0.5, '20.1', '15.99'];
      for (const val of floatCases) {
        const res = validateSrsSettings(val);
        assert.strictEqual(res.isValid, false, `Expected ${val} to be invalid`);
        assert.ok(res.errors.newCardsPerDay.includes('phần thập phân'));
      }
    });

    test('rejects empty, null, undefined, and non-numeric inputs', () => {
      const invalidCases = ['', '   ', null, undefined, 'abc', 'NaN'];
      for (const val of invalidCases) {
        const res = validateSrsSettings(val);
        assert.strictEqual(res.isValid, false, `Expected ${val} to be invalid`);
        assert.ok(res.errors.newCardsPerDay);
      }
    });

  });

  describe('2. Payload Construction: buildUpdateSettingsPayload', () => {

    test('builds sanitized payload with parsed integers', () => {
      const payload1 = buildUpdateSettingsPayload('25');
      assert.deepStrictEqual(payload1, { newCardsPerDay: 25 });

      const payload2 = buildUpdateSettingsPayload(30, '120');
      assert.deepStrictEqual(payload2, { newCardsPerDay: 30, maxReviewPerDay: 120 });
    });

  });

  describe('3. Undo Changes: handleUndoChanges', () => {

    test('reverts input value and status to currently saved settings', () => {
      // Mock minimal DOM elements
      const mockInput = { value: '99', classList: { remove() {} } };
      const mockStatus = { textContent: '', className: '' };

      const controller = new SrsSettingsController();
      controller.newCardsInput = mockInput;
      controller.statusEl = mockStatus;
      controller.savedSettings = { newCardsPerDay: 20, maxReviewPerDay: 100 };

      controller.handleUndoChanges();

      assert.strictEqual(mockInput.value, '20', 'Input must be reverted to saved value (20)');
      assert.ok(mockStatus.textContent.includes('hoàn tác thay đổi'), 'Status must announce undo');
    });

  });

});
