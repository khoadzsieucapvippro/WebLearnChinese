/**
 * =============================================================================
 * ADMIN SYSTEM SETTINGS CONTROLLER (FEATURE F21)
 * Module: frontend/js/pages/admin-settings-page.js
 * 
 * Responsibilities:
 * - System-wide configuration management for Administrator:
 *   1. SRS Learning Algorithm Settings:
 *      - newCardsPerDay (bounded within [1, 100])
 *      - autoPlayAudio (boolean toggle)
 *      - checkWriting (boolean toggle)
 *   2. Ecosystem & Platform Settings:
 *      - platformName (string, default "Hán Ngữ Học")
 *      - supportEmail (valid email, default "support@hannguhoc.edu.vn")
 *      - maintenanceMode (boolean toggle with status indicator)
 * - Safe persistence:
 *   - Synchronizes newCardsPerDay with backend /api/v1/srs/settings
 *   - Persists complete administrative profile to HOC_HAN_NGU_SYSTEM_SETTINGS
 * - Safe DOM construction (zero unsafe innerHTML) defending against XSS.
 * =============================================================================
 */

import { authManager } from '../auth/auth-state.js';
import { initNavbarAuth } from '../ui/nav.js';
import { initManagementLayout } from '../ui/management-layout.js';
import { showToast } from '../ui/ui.js';
import { createSafeElement, clearContainer } from '../ui/security.js';
import { apiClient } from '../api/api.js';

export const SYSTEM_SETTINGS_STORAGE_KEY = 'HOC_HAN_NGU_SYSTEM_SETTINGS';

export const DEFAULT_ADMIN_SETTINGS = {
  newCardsPerDay: 20,
  autoPlayAudio: true,
  checkWriting: true,
  platformName: 'Hán Ngữ Học',
  supportEmail: 'support@hannguhoc.edu.vn',
  maintenanceMode: false
};

/**
 * Validates admin system settings fields according to business rules and invariants.
 *
 * @param {object} settings
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateAdminSettings(settings = {}) {
  const errors = {};

  // 1. Validate newCardsPerDay (1 <= N <= 100)
  const newCardsRaw = settings.newCardsPerDay;
  const newCardsStr = String(newCardsRaw ?? '').trim();
  if (newCardsStr === '') {
    errors.newCardsPerDay = 'Số lượng thẻ mới mỗi ngày không được để trống.';
  } else {
    const num = Number(newCardsStr);
    if (!Number.isFinite(num)) {
      errors.newCardsPerDay = 'Số lượng thẻ mới phải là một số hợp lệ.';
    } else if (!Number.isInteger(num)) {
      errors.newCardsPerDay = 'Số lượng thẻ mới phải là số nguyên (không chứa phần thập phân).';
    } else if (num < 1) {
      errors.newCardsPerDay = 'Số lượng thẻ mới phải là số nguyên dương lớn hơn 0.';
    } else if (num > 100) {
      errors.newCardsPerDay = 'Số lượng thẻ mới mỗi ngày không được vượt quá 100 thẻ.';
    }
  }

  // 2. Validate platformName
  const platformName = String(settings.platformName ?? '').trim();
  if (!platformName) {
    errors.platformName = 'Tên nền tảng không được để trống.';
  }

  // 3. Validate supportEmail
  const supportEmail = String(settings.supportEmail ?? '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!supportEmail) {
    errors.supportEmail = 'Email hỗ trợ học viên không được để trống.';
  } else if (!emailRegex.test(supportEmail)) {
    errors.supportEmail = 'Email hỗ trợ học viên không đúng định dạng.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Loads current admin settings from local storage or defaults.
 *
 * @returns {typeof DEFAULT_ADMIN_SETTINGS}
 */
export function getSavedAdminSettings() {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_ADMIN_SETTINGS };
    const raw = localStorage.getItem(SYSTEM_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ADMIN_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_ADMIN_SETTINGS,
      ...parsed
    };
  } catch (_e) {
    return { ...DEFAULT_ADMIN_SETTINGS };
  }
}

/**
 * Persists admin settings to local storage.
 *
 * @param {typeof DEFAULT_ADMIN_SETTINGS} settings
 */
export function persistAdminSettings(settings) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SYSTEM_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Updates maintenance badge indicator in UI.
 *
 * @param {boolean} isMaintenance
 */
export function updateMaintenanceBadge(isMaintenance) {
  const badgeContainer = document.getElementById('maintenanceStatusBadge');
  if (!badgeContainer) return;

  clearContainer(badgeContainer);

  const badge = createSafeElement('span', {
    className: isMaintenance
      ? 'badge bg-warning text-dark border border-warning-subtle'
      : 'badge bg-success-subtle text-success border border-success-subtle',
    text: isMaintenance
      ? 'Hệ thống đang ở chế độ bảo trì (Học viên bị tạm dừng truy cập)'
      : 'Hệ thống đang hoạt động bình thường'
  });
  badgeContainer.appendChild(badge);
}

/**
 * Populates form inputs with current settings.
 *
 * @param {typeof DEFAULT_ADMIN_SETTINGS} settings
 */
export function populateSettingsForm(settings) {
  const elNewCards = document.getElementById('settingNewCardsPerDay');
  const elAutoPlay = document.getElementById('settingAutoPlayAudio');
  const elCheckWriting = document.getElementById('settingCheckWriting');
  const elPlatformName = document.getElementById('settingPlatformName');
  const elSupportEmail = document.getElementById('settingSupportEmail');
  const elMaintenance = document.getElementById('settingMaintenanceMode');

  if (elNewCards) elNewCards.value = String(settings.newCardsPerDay ?? 20);
  if (elAutoPlay) elAutoPlay.checked = Boolean(settings.autoPlayAudio);
  if (elCheckWriting) elCheckWriting.checked = Boolean(settings.checkWriting);
  if (elPlatformName) elPlatformName.value = settings.platformName || DEFAULT_ADMIN_SETTINGS.platformName;
  if (elSupportEmail) elSupportEmail.value = settings.supportEmail || DEFAULT_ADMIN_SETTINGS.supportEmail;
  if (elMaintenance) elMaintenance.checked = Boolean(settings.maintenanceMode);

  updateMaintenanceBadge(Boolean(settings.maintenanceMode));
}

/**
 * Reads form values from DOM inputs.
 *
 * @returns {typeof DEFAULT_ADMIN_SETTINGS}
 */
export function readSettingsForm() {
  const elNewCards = document.getElementById('settingNewCardsPerDay');
  const elAutoPlay = document.getElementById('settingAutoPlayAudio');
  const elCheckWriting = document.getElementById('settingCheckWriting');
  const elPlatformName = document.getElementById('settingPlatformName');
  const elSupportEmail = document.getElementById('settingSupportEmail');
  const elMaintenance = document.getElementById('settingMaintenanceMode');

  return {
    newCardsPerDay: elNewCards ? parseInt(elNewCards.value, 10) : 20,
    autoPlayAudio: elAutoPlay ? elAutoPlay.checked : true,
    checkWriting: elCheckWriting ? elCheckWriting.checked : true,
    platformName: elPlatformName ? elPlatformName.value.trim() : DEFAULT_ADMIN_SETTINGS.platformName,
    supportEmail: elSupportEmail ? elSupportEmail.value.trim() : DEFAULT_ADMIN_SETTINGS.supportEmail,
    maintenanceMode: elMaintenance ? elMaintenance.checked : false
  };
}

/**
 * Displays or clears field error message safely without XSS.
 *
 * @param {string} inputId
 * @param {string} errorId
 * @param {string|undefined} errorMessage
 */
function setFieldError(inputId, errorId, errorMessage) {
  const inputEl = document.getElementById(inputId);
  const errorEl = document.getElementById(errorId);

  if (inputEl) {
    if (errorMessage) {
      inputEl.classList.add('is-invalid');
    } else {
      inputEl.classList.remove('is-invalid');
    }
  }

  if (errorEl) {
    if (errorMessage) {
      errorEl.textContent = errorMessage;
      errorEl.classList.remove('d-none');
    } else {
      errorEl.textContent = '';
      errorEl.classList.add('d-none');
    }
  }
}

/**
 * Clears all inline error messages.
 */
function clearAllErrors() {
  setFieldError('settingNewCardsPerDay', 'settingNewCardsError', undefined);
  setFieldError('settingPlatformName', 'settingPlatformNameError', undefined);
  setFieldError('settingSupportEmail', 'settingSupportEmailError', undefined);
}

/**
 * Initializes the Admin Settings Page.
 */
export function initAdminSettingsPage() {
  if (typeof document === 'undefined') return;

  initNavbarAuth();
  initManagementLayout();

  const authGuard = document.getElementById('adminAuthGuardContainer');
  const settingsContainer = document.getElementById('adminSettingsFormContainer');
  const form = document.getElementById('adminSettingsForm');
  const btnReset = document.getElementById('btnResetSettings');
  const elMaintenance = document.getElementById('settingMaintenanceMode');

  const isAuthenticated = authManager.isAuthenticated();
  const roles = authManager.getRoles();
  const isAdmin = roles.some(r => String(r).toUpperCase().replace(/^ROLE_/, '') === 'ADMIN');

  if (!isAuthenticated || !isAdmin) {
    if (authGuard) authGuard.classList.remove('d-none');
    if (settingsContainer) settingsContainer.classList.add('d-none');
    return;
  }

  if (authGuard) authGuard.classList.add('d-none');
  if (settingsContainer) settingsContainer.classList.remove('d-none');

  // Load and populate settings
  let currentSettings = getSavedAdminSettings();
  populateSettingsForm(currentSettings);

  // Sync with backend SRS settings if available
  apiClient('/srs/settings')
    .then((res) => {
      const data = res?.data || res;
      if (data && typeof data.newCardsPerDay === 'number') {
        currentSettings.newCardsPerDay = data.newCardsPerDay;
        const elNewCards = document.getElementById('settingNewCardsPerDay');
        if (elNewCards) elNewCards.value = String(data.newCardsPerDay);
        persistAdminSettings(currentSettings);
      }
    })
    .catch(() => {
      // Offline fallback ok
    });

  // Maintenance toggle change listener
  if (elMaintenance) {
    elMaintenance.addEventListener('change', () => {
      updateMaintenanceBadge(elMaintenance.checked);
    });
  }

  // Handle Form Submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors();

      const formValues = readSettingsForm();
      const validation = validateAdminSettings(formValues);

      if (!validation.isValid) {
        if (validation.errors.newCardsPerDay) {
          setFieldError('settingNewCardsPerDay', 'settingNewCardsError', validation.errors.newCardsPerDay);
        }
        if (validation.errors.platformName) {
          setFieldError('settingPlatformName', 'settingPlatformNameError', validation.errors.platformName);
        }
        if (validation.errors.supportEmail) {
          setFieldError('settingSupportEmail', 'settingSupportEmailError', validation.errors.supportEmail);
        }
        showToast('Vui lòng kiểm tra lại các trường cấu hình chưa hợp lệ.', 'warning');
        return;
      }

      // Persist locally
      currentSettings = formValues;
      persistAdminSettings(currentSettings);

      // Persist to backend srs settings
      try {
        await apiClient('/srs/settings', {
          method: 'PUT',
          body: {
            newCardsPerDay: formValues.newCardsPerDay
          }
        });
      } catch (_e) {
        // Fallback to local storage persistence
      }

      showToast('Đã lưu cấu hình hệ thống thành công!', 'success');
    });
  }

  // Handle Reset / Undo Button
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      clearAllErrors();
      currentSettings = getSavedAdminSettings();
      populateSettingsForm(currentSettings);
      showToast('Đã hoàn tác các thay đổi chưa lưu.', 'info');
    });
  }
}

// Auto-run on DOM ready in browser
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAdminSettingsPage());
  } else {
    initAdminSettingsPage();
  }
}
