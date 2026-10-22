/**
 * =============================================================================
 * SRS SETTINGS CONTROLLER (TASK UX / BUSINESS INVARIANTS)
 * Module: frontend/js/pages/srs-settings-page.js
 *
 * Responsibilities:
 * - Manage personalized Spaced Repetition System (SRS) parameters via GET/PUT /api/v1/srs/settings.
 * - Enforce card limit bounds: newCardsPerDay in [1, 100].
 * - Provide undo mechanism: "Hoàn tác thay đổi" button reverts unsaved input to last saved settings.
 * - Synchronize preset chips (10, 20, 30 cards/day) and steppers (-5, +5).
 * - Safe DOM updates (100% textContent / setAttribute; zero innerHTML sinks).
 * - Accessible live status announcements and WCAG 2.2 compliant form controls.
 * =============================================================================
 */

import { apiClient, ApiError } from '../api/api.js';
import { authManager } from '../auth/auth-state.js';
import { initNavbarAuth } from '../ui/nav.js';
import { showToast } from '../ui/ui.js';

/**
 * Validates SRS Daily Settings input value for newCardsPerDay.
 * Enforces positive integer in range [1, 100].
 *
 * @param {string|number} newCardsPerDay
 * @param {string|number} [maxReviewPerDay]
 * @returns {{ isValid: boolean, errors: { newCardsPerDay?: string, maxReviewPerDay?: string } }}
 */
export function validateSrsSettings(newCardsPerDay, maxReviewPerDay = undefined) {
  const errors = {};

  const newCardsStr = String(newCardsPerDay ?? '').trim();
  if (!newCardsStr) {
    errors.newCardsPerDay = 'Số lượng thẻ mới mỗi ngày không được để trống.';
  } else {
    const num = Number(newCardsStr);
    if (Number.isNaN(num) || !/^-?\d+(\.\d+)?$/.test(newCardsStr)) {
      errors.newCardsPerDay = 'Số lượng thẻ mới phải là một số hợp lệ.';
    } else if (!Number.isInteger(num) || !/^-?\d+$/.test(newCardsStr)) {
      errors.newCardsPerDay = 'Số lượng thẻ mới phải là số nguyên (không chứa phần thập phân).';
    } else if (num <= 0) {
      errors.newCardsPerDay = 'Số lượng thẻ mới phải là số nguyên dương lớn hơn 0.';
    } else if (num > 100) {
      errors.newCardsPerDay = 'Số lượng thẻ mới mỗi ngày không được vượt quá 100 thẻ.';
    }
  }

  if (arguments.length >= 2 && maxReviewPerDay !== undefined && maxReviewPerDay !== null && String(maxReviewPerDay).trim() !== '') {
    const maxReviewStr = String(maxReviewPerDay).trim();
    const maxNum = Number(maxReviewStr);
    if (Number.isNaN(maxNum) || !/^-?\d+(\.\d+)?$/.test(maxReviewStr)) {
      errors.maxReviewPerDay = 'Số lượt ôn tập phải là một số hợp lệ.';
    } else if (!Number.isInteger(maxNum) || !/^-?\d+$/.test(maxReviewStr)) {
      errors.maxReviewPerDay = 'Số lượt ôn tập phải là số nguyên (không chứa phần thập phân).';
    } else if (maxNum <= 0) {
      errors.maxReviewPerDay = 'Số lượt ôn tập phải là số nguyên dương lớn hơn 0.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Synchronizes visual active state on preset chips based on current input value.
 *
 * @param {number|string} currentVal
 */
export function syncPresetChips(currentVal) {
  if (typeof document === 'undefined') return;
  const targetVal = Number(currentVal);
  const chips = document.querySelectorAll('.srs-preset-chip, [data-preset]');
  chips.forEach(chip => {
    const chipVal = Number(chip.getAttribute('data-preset') || chip.getAttribute('data-value'));
    if (chipVal === targetVal) {
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
    } else {
      chip.classList.remove('active');
      chip.setAttribute('aria-pressed', 'false');
    }
  });
}

/**
 * Constructs sanitized payload for PUT /api/v1/srs/settings.
 *
 * @param {string|number} newCardsPerDay
 * @param {string|number} [maxReviewPerDay]
 * @returns {{ newCardsPerDay: number, maxReviewPerDay?: number }}
 */
export function buildUpdateSettingsPayload(newCardsPerDay, maxReviewPerDay = undefined) {
  const payload = {
    newCardsPerDay: parseInt(String(newCardsPerDay).trim(), 10)
  };
  if (maxReviewPerDay !== undefined && maxReviewPerDay !== null && String(maxReviewPerDay).trim() !== '') {
    payload.maxReviewPerDay = parseInt(String(maxReviewPerDay).trim(), 10);
  }
  return payload;
}

/**
 * Main Controller for SRS Settings Page.
 */
export class SrsSettingsController {
  constructor() {
    const doc = typeof document !== 'undefined' ? document : null;
    this.form = doc?.getElementById('srsSettingsForm') || null;
    this.newCardsInput = doc ? (doc.getElementById('srsNewCardsPerDayInput') || doc.getElementById('newCardsPerDayInput')) : null;
    this.newCardsError = doc ? (doc.getElementById('srsNewCardsPerDayError') || doc.getElementById('newCardsPerDayError')) : null;
    this.statusEl = doc ? (doc.getElementById('srsSettingsStatus') || doc.getElementById('settingsFormStatus')) : null;
    this.btnSave = doc?.getElementById('btnSaveSrsSettings') || null;
    this.btnReset = doc?.getElementById('btnResetSrsSettings') || null;
    this.btnDecrement = doc?.getElementById('btnDecrementNewCards') || null;
    this.btnIncrement = doc?.getElementById('btnIncrementNewCards') || null;

    // Cached authoritative settings from server
    this.savedSettings = { newCardsPerDay: 20, maxReviewPerDay: 100 };
    this.isSubmitting = false;
  }

  async init() {
    initNavbarAuth();
    this.bindEvents();
    await this.loadSettings();
  }

  bindEvents() {
    if (this.newCardsInput) {
      this.newCardsInput.addEventListener('input', () => {
        this.clearError();
        const val = this.newCardsInput.value;
        if (val) {
          syncPresetChips(val);
        }
      });
    }

    if (this.btnDecrement && this.newCardsInput) {
      this.btnDecrement.addEventListener('click', () => {
        const cur = parseInt(this.newCardsInput.value, 10) || 20;
        const next = Math.max(1, cur - 5);
        this.newCardsInput.value = String(next);
        this.clearError();
        syncPresetChips(next);
      });
    }

    if (this.btnIncrement && this.newCardsInput) {
      this.btnIncrement.addEventListener('click', () => {
        const cur = parseInt(this.newCardsInput.value, 10) || 20;
        const next = Math.min(100, cur + 5);
        this.newCardsInput.value = String(next);
        this.clearError();
        syncPresetChips(next);
      });
    }

    // Preset chip clicks
    const chips = document.querySelectorAll('.srs-preset-chip, [data-preset]');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-preset') || chip.getAttribute('data-value');
        if (val && this.newCardsInput) {
          this.newCardsInput.value = val;
          this.clearError();
          syncPresetChips(val);
        }
      });
    });

    // "Hoàn tác thay đổi" button reverts unsaved changes to savedSettings
    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => {
        this.handleUndoChanges();
      });
    }

    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }
  }

  clearError() {
    if (this.newCardsError) {
      this.newCardsError.textContent = '';
      this.newCardsError.classList.add('d-none');
    }
    if (this.newCardsInput) {
      this.newCardsInput.classList.remove('is-invalid');
    }
    if (this.statusEl) {
      this.statusEl.textContent = '';
      this.statusEl.className = 'small';
    }
  }

  showError(msg) {
    if (this.newCardsError) {
      this.newCardsError.textContent = msg;
      this.newCardsError.classList.remove('d-none');
    }
    if (this.newCardsInput) {
      this.newCardsInput.classList.add('is-invalid');
      this.newCardsInput.focus();
    }
  }

  handleUndoChanges() {
    this.clearError();
    if (this.savedSettings && this.newCardsInput && this.savedSettings.newCardsPerDay != null) {
      this.newCardsInput.value = String(this.savedSettings.newCardsPerDay);
      syncPresetChips(this.savedSettings.newCardsPerDay);
      if (this.statusEl) {
        this.statusEl.textContent = 'Đã hoàn tác thay đổi về giá trị đã lưu.';
        this.statusEl.className = 'small text-muted mt-2';
      }
    }
  }

  async loadSettings() {
    try {
      const res = await apiClient.get('/srs/settings');
      const data = res?.data || res;
      if (data && data.newCardsPerDay != null) {
        this.savedSettings = {
          newCardsPerDay: Number(data.newCardsPerDay),
          maxReviewPerDay: data.maxReviewPerDay != null ? Number(data.maxReviewPerDay) : 100
        };
        if (this.newCardsInput) {
          this.newCardsInput.value = String(this.savedSettings.newCardsPerDay);
          syncPresetChips(this.savedSettings.newCardsPerDay);
        }
      }
    } catch (err) {
      // In unauthenticated or offline fallback mode, fallback gracefully to default 20
      if (this.newCardsInput && !this.newCardsInput.value) {
        this.newCardsInput.value = '20';
        syncPresetChips(20);
      }
    }
  }

  async handleSubmit() {
    if (this.isSubmitting) return;

    const val = this.newCardsInput ? this.newCardsInput.value : '';
    const validation = validateSrsSettings(val);

    if (!validation.isValid) {
      this.showError(validation.errors.newCardsPerDay || 'Dữ liệu không hợp lệ.');
      return;
    }

    this.isSubmitting = true;
    this.setButtonLoading(true);

    try {
      const payload = buildUpdateSettingsPayload(val);
      const res = await apiClient.put('/srs/settings', payload);
      const updated = res?.data || res;

      this.savedSettings.newCardsPerDay = Number(updated.newCardsPerDay || val);
      if (updated.maxReviewPerDay != null) {
        this.savedSettings.maxReviewPerDay = Number(updated.maxReviewPerDay);
      }

      syncPresetChips(this.savedSettings.newCardsPerDay);
      if (this.statusEl) {
        this.statusEl.textContent = 'Đã lưu cấu hình học tập thành công.';
        this.statusEl.className = 'small text-success mt-2 fw-semibold';
      }
      showToast('Cập nhật cài đặt học tập thành công!', 'success');
    } catch (err) {
      const errMsg = err?.message || 'Không thể lưu cài đặt. Vui lòng thử lại sau.';
      if (this.statusEl) {
        this.statusEl.textContent = errMsg;
        this.statusEl.className = 'small text-danger mt-2';
      }
      showToast(errMsg, 'error');
    } finally {
      this.isSubmitting = false;
      this.setButtonLoading(false);
    }
  }

  setButtonLoading(loading) {
    if (!this.btnSave) return;
    const btnText = this.btnSave.querySelector('.btn-text');
    const spinner = this.btnSave.querySelector('.spinner-border');

    if (loading) {
      this.btnSave.disabled = true;
      if (btnText) btnText.textContent = 'Đang lưu...';
      if (spinner) spinner.classList.remove('d-none');
    } else {
      this.btnSave.disabled = false;
      if (btnText) btnText.textContent = 'Lưu cài đặt học tập';
      if (spinner) spinner.classList.add('d-none');
    }
  }
}

/**
 * Auto-initializes on DOM load when running in browser.
 */
export function initSrsSettingsPage() {
  const controller = new SrsSettingsController();
  controller.init();
  return controller;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSrsSettingsPage);
  } else {
    initSrsSettingsPage();
  }
}
