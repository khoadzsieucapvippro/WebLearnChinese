/**
 * =============================================================================
 * UNIT TEST SUITE: ADMIN SYSTEM SETTINGS & SRS CARD BOUNDS
 * File: tests/frontend/unit/management/admin-settings.test.mjs
 * 
 * Scope:
 * - validateAdminSettings pure validator:
 *   * newCardsPerDay bounds: [1, 100]
 *   * platformName required
 *   * supportEmail RFC validation
 * - Settings storage and persistence helpers
 * - Invariant: SRS card limit bounds [1, 100] enforced
 * =============================================================================
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAdminSettings,
  DEFAULT_ADMIN_SETTINGS,
  SYSTEM_SETTINGS_STORAGE_KEY,
  getSavedAdminSettings,
  persistAdminSettings
} from '../../../../frontend/js/pages/admin-settings-page.js';

describe('Admin System Settings & Operations Logic', () => {

  describe('1. SRS Card Bounds & Algorithm Configuration Validation', () => {

    test('accepts valid boundary and nominal newCardsPerDay values [1, 100]', () => {
      const nominal = validateAdminSettings({
        newCardsPerDay: 20,
        platformName: 'Hán Ngữ Học',
        supportEmail: 'admin@hannguhoc.edu.vn'
      });
      assert.strictEqual(nominal.isValid, true);
      assert.deepStrictEqual(nominal.errors, {});

      const lowerBound = validateAdminSettings({
        newCardsPerDay: 1,
        platformName: 'Hán Ngữ Học',
        supportEmail: 'admin@hannguhoc.edu.vn'
      });
      assert.strictEqual(lowerBound.isValid, true);

      const upperBound = validateAdminSettings({
        newCardsPerDay: 100,
        platformName: 'Hán Ngữ Học',
        supportEmail: 'admin@hannguhoc.edu.vn'
      });
      assert.strictEqual(upperBound.isValid, true);
    });

    test('rejects newCardsPerDay exceeding upper bound 100 (> 100)', () => {
      const res101 = validateAdminSettings({
        newCardsPerDay: 101,
        platformName: 'Hán Ngữ Học',
        supportEmail: 'admin@hannguhoc.edu.vn'
      });
      assert.strictEqual(res101.isValid, false);
      assert.strictEqual(res101.errors.newCardsPerDay, 'Số lượng thẻ mới mỗi ngày không được vượt quá 100 thẻ.');

      const res999 = validateAdminSettings({
        newCardsPerDay: 999,
        platformName: 'Hán Ngữ Học',
        supportEmail: 'admin@hannguhoc.edu.vn'
      });
      assert.strictEqual(res999.isValid, false);
    });

    test('rejects newCardsPerDay lower than 1 (<= 0 or negative)', () => {
      const res0 = validateAdminSettings({
        newCardsPerDay: 0,
        platformName: 'Hán Ngữ Học',
        supportEmail: 'admin@hannguhoc.edu.vn'
      });
      assert.strictEqual(res0.isValid, false);
      assert.strictEqual(res0.errors.newCardsPerDay, 'Số lượng thẻ mới phải là số nguyên dương lớn hơn 0.');

      const resNeg = validateAdminSettings({
        newCardsPerDay: -10,
        platformName: 'Hán Ngữ Học',
        supportEmail: 'admin@hannguhoc.edu.vn'
      });
      assert.strictEqual(resNeg.isValid, false);
    });

    test('rejects non-integer, NaN, or blank newCardsPerDay values', () => {
      const resFloat = validateAdminSettings({
        newCardsPerDay: 15.5,
        platformName: 'Hán Ngữ Học',
        supportEmail: 'admin@hannguhoc.edu.vn'
      });
      assert.strictEqual(resFloat.isValid, false);
      assert.strictEqual(resFloat.errors.newCardsPerDay, 'Số lượng thẻ mới phải là số nguyên (không chứa phần thập phân).');

      const resEmpty = validateAdminSettings({
        newCardsPerDay: '',
        platformName: 'Hán Ngữ Học',
        supportEmail: 'admin@hannguhoc.edu.vn'
      });
      assert.strictEqual(resEmpty.isValid, false);
      assert.strictEqual(resEmpty.errors.newCardsPerDay, 'Số lượng thẻ mới mỗi ngày không được để trống.');

      const resNaN = validateAdminSettings({
        newCardsPerDay: 'hai-muoi',
        platformName: 'Hán Ngữ Học',
        supportEmail: 'admin@hannguhoc.edu.vn'
      });
      assert.strictEqual(resNaN.isValid, false);
      assert.strictEqual(resNaN.errors.newCardsPerDay, 'Số lượng thẻ mới phải là một số hợp lệ.');
    });

  });

  describe('2. Platform & Ecosystem Information Validation', () => {

    test('rejects blank platform name', () => {
      const res = validateAdminSettings({
        newCardsPerDay: 20,
        platformName: '   ',
        supportEmail: 'admin@example.com'
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.errors.platformName, 'Tên nền tảng không được để trống.');
    });

    test('rejects blank or malformed support emails', () => {
      const resBlank = validateAdminSettings({
        newCardsPerDay: 20,
        platformName: 'Hán Ngữ Học',
        supportEmail: ''
      });
      assert.strictEqual(resBlank.isValid, false);
      assert.strictEqual(resBlank.errors.supportEmail, 'Email hỗ trợ học viên không được để trống.');

      const resInvalid = validateAdminSettings({
        newCardsPerDay: 20,
        platformName: 'Hán Ngữ Học',
        supportEmail: 'not-an-email'
      });
      assert.strictEqual(resInvalid.isValid, false);
      assert.strictEqual(resInvalid.errors.supportEmail, 'Email hỗ trợ học viên không đúng định dạng.');
    });

    test('accepts valid platform information', () => {
      const res = validateAdminSettings({
        newCardsPerDay: 25,
        platformName: 'Hán Ngữ Học Đường',
        supportEmail: 'support@hannguhoc.edu.vn'
      });
      assert.strictEqual(res.isValid, true);
    });

  });

  describe('3. Storage & Default Configuration Management', () => {
    let mockStorage = {};

    beforeEach(() => {
      mockStorage = {};
      globalThis.localStorage = {
        getItem: (k) => mockStorage[k] || null,
        setItem: (k, v) => { mockStorage[k] = String(v); },
        removeItem: (k) => { delete mockStorage[k]; },
        clear: () => { mockStorage = {}; }
      };
    });

    test('falls back to DEFAULT_ADMIN_SETTINGS when storage is uninitialized', () => {
      const settings = getSavedAdminSettings();
      assert.strictEqual(settings.newCardsPerDay, DEFAULT_ADMIN_SETTINGS.newCardsPerDay);
      assert.strictEqual(settings.platformName, DEFAULT_ADMIN_SETTINGS.platformName);
      assert.strictEqual(settings.supportEmail, DEFAULT_ADMIN_SETTINGS.supportEmail);
      assert.strictEqual(settings.maintenanceMode, false);
    });

    test('persists and retrieves custom configuration cleanly', () => {
      const customConfig = {
        newCardsPerDay: 40,
        autoPlayAudio: false,
        checkWriting: true,
        platformName: 'Tân Hán Ngữ',
        supportEmail: 'admin@tanhangu.vn',
        maintenanceMode: true
      };

      persistAdminSettings(customConfig);
      const loaded = getSavedAdminSettings();
      assert.strictEqual(loaded.newCardsPerDay, 40);
      assert.strictEqual(loaded.autoPlayAudio, false);
      assert.strictEqual(loaded.platformName, 'Tân Hán Ngữ');
      assert.strictEqual(loaded.supportEmail, 'admin@tanhangu.vn');
      assert.strictEqual(loaded.maintenanceMode, true);
    });

  });

});
