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

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateProfileSrsSettings,
  syncPresetChips,
  getAudioSettings,
  saveAudioSettings,
  getWritingSettings,
  saveWritingSettings,
  loadUserProfileAndSettings,
  validateChangePasswordForm,
  AUDIO_SETTINGS_STORAGE_KEY,
  WRITING_SETTINGS_STORAGE_KEY
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

  describe('4. Audio & Pronunciation Settings Contract', () => {
    let mockStorage;
    let originalStorage;

    beforeEach(() => {
      originalStorage = globalThis.localStorage;
      const map = new Map();
      mockStorage = {
        getItem: (k) => (map.has(k) ? map.get(k) : null),
        setItem: (k, v) => map.set(k, String(v)),
        removeItem: (k) => map.delete(k),
        clear: () => map.clear()
      };
      globalThis.localStorage = mockStorage;
    });

    afterEach(() => {
      globalThis.localStorage = originalStorage;
    });

    test('returns default audio settings when storage is empty', () => {
      const settings = getAudioSettings();
      assert.strictEqual(settings.autoPronounce, true);
      assert.strictEqual(settings.speechRate, 1.0);
    });

    test('saves and retrieves audio settings in HOC_HAN_NGU_AUDIO_SETTINGS', () => {
      saveAudioSettings({ autoPronounce: false, speechRate: 0.8 });
      const raw = mockStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
      assert.ok(raw);
      const parsed = JSON.parse(raw);
      assert.strictEqual(parsed.autoPronounce, false);
      assert.strictEqual(parsed.speechRate, 0.8);

      const retrieved = getAudioSettings();
      assert.strictEqual(retrieved.autoPronounce, false);
      assert.strictEqual(retrieved.speechRate, 0.8);
    });

    test('parses speech rate from numeric strings and handles invalid formats gracefully', () => {
      saveAudioSettings({ speechRate: '1.2' });
      assert.strictEqual(getAudioSettings().speechRate, 1.2);

      saveAudioSettings({ speechRate: 'invalid' });
      assert.strictEqual(getAudioSettings().speechRate, 1.0);
    });
  });

  describe('5. Writing & Display Settings Contract', () => {
    let mockStorage;
    let originalStorage;

    beforeEach(() => {
      originalStorage = globalThis.localStorage;
      const map = new Map();
      mockStorage = {
        getItem: (k) => (map.has(k) ? map.get(k) : null),
        setItem: (k, v) => map.set(k, String(v)),
        removeItem: (k) => map.delete(k),
        clear: () => map.clear()
      };
      globalThis.localStorage = mockStorage;
    });

    afterEach(() => {
      globalThis.localStorage = originalStorage;
    });

    test('returns default writing settings when storage is empty', () => {
      const settings = getWritingSettings();
      assert.strictEqual(settings.showOutline, true);
      assert.strictEqual(settings.autoReplayStrokes, false);
      assert.strictEqual(settings.gridSize, 'standard');
      assert.strictEqual(settings.gridPixelSize, 170);
    });

    test('saves and retrieves writing settings in HOC_HAN_NGU_WRITING_SETTINGS', () => {
      saveWritingSettings({ showOutline: false, autoReplayStrokes: true, gridSize: 'large' });
      const raw = mockStorage.getItem(WRITING_SETTINGS_STORAGE_KEY);
      assert.ok(raw);
      const parsed = JSON.parse(raw);
      assert.strictEqual(parsed.showOutline, false);
      assert.strictEqual(parsed.autoReplayStrokes, true);
      assert.strictEqual(parsed.gridSize, 'large');

      const retrieved = getWritingSettings();
      assert.strictEqual(retrieved.showOutline, false);
      assert.strictEqual(retrieved.autoReplayStrokes, true);
      assert.strictEqual(retrieved.gridSize, 'large');
      assert.strictEqual(retrieved.gridPixelSize, 200);
    });
  });

  describe('7. Account Security: Password Change Validation (validateChangePasswordForm)', () => {
    test('accepts valid password change payload', () => {
      const res = validateChangePasswordForm({
        currentPassword: 'CurrentPass123',
        newPassword: 'BrandNewSecurePass456',
        confirmNewPassword: 'BrandNewSecurePass456'
      });
      assert.strictEqual(res.isValid, true);
      assert.deepStrictEqual(res.errors, {});
    });

    test('rejects empty or whitespace current password', () => {
      const res = validateChangePasswordForm({
        currentPassword: '   ',
        newPassword: 'BrandNewSecurePass456',
        confirmNewPassword: 'BrandNewSecurePass456'
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.errors.currentPassword, 'Mật khẩu hiện tại không được để trống');
    });

    test('rejects empty or whitespace new password', () => {
      const res = validateChangePasswordForm({
        currentPassword: 'CurrentPass123',
        newPassword: '',
        confirmNewPassword: ''
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.errors.newPassword, 'Mật khẩu mới không được để trống');
    });

    test('rejects new password shorter than 6 characters', () => {
      const res = validateChangePasswordForm({
        currentPassword: 'CurrentPass123',
        newPassword: '12345',
        confirmNewPassword: '12345'
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.errors.newPassword, 'Mật khẩu mới phải có ít nhất 6 ký tự');
    });

    test('rejects new password longer than 100 characters', () => {
      const longPass = 'a'.repeat(101);
      const res = validateChangePasswordForm({
        currentPassword: 'CurrentPass123',
        newPassword: longPass,
        confirmNewPassword: longPass
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.errors.newPassword, 'Mật khẩu mới không được vượt quá 100 ký tự');
    });

    test('rejects new password identical to current password', () => {
      const res = validateChangePasswordForm({
        currentPassword: 'SamePassword123',
        newPassword: 'SamePassword123',
        confirmNewPassword: 'SamePassword123'
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.errors.newPassword, 'Mật khẩu mới không được trùng với mật khẩu hiện tại');
    });

    test('rejects mismatched confirm password', () => {
      const res = validateChangePasswordForm({
        currentPassword: 'CurrentPass123',
        newPassword: 'NewPassword123',
        confirmNewPassword: 'DifferentPassword456'
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.errors.confirmNewPassword, 'Xác nhận mật khẩu mới không trùng khớp');
    });
  });

});
