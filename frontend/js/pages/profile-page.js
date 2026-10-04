/**
 * =============================================================================
 * USER PROFILE PAGE CONTROLLER (TASK 9B.1)
 * Module: frontend/js/pages/profile-page.js
 * 
 * Responsibilities:
 * - Authentication guard for protected profile view.
 * - Profile data loading via GET /api/v1/users/profile with 3-state UI lifecycle.
 * - Role display decoupled from UserProfileResponse (sourced authoritatively from authManager).
 * - Profile update via PUT /api/v1/users/profile with client validation.
 * - Session synchronization via authManager.updateUser() and auth:update event.
 * - Defense-in-depth resource URL sanitization for user avatar images.
 * - WCAG 2.2 AA compliant inline validation and accessible toast announcements.
 * =============================================================================
 */

import { apiClient, ApiError, parseFieldErrors } from '../api/api.js';
import { authManager } from '../auth/auth-state.js';
import { initNavbarAuth, getRoleLabel, getRoleBadgeClass, getPrimaryRole } from '../ui/nav.js';
import { setComponentState, showToast } from '../ui/ui.js';
import { sanitizeResourceUrl, createSafeElement, clearContainer } from '../ui/security.js';

const DEFAULT_AVATAR_PLACEHOLDER = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23F3EFEA" rx="40"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="32" fill="%2378716C">学</text></svg>';

let currentProfile = null;
let currentSrsSettings = null;

/**
 * Validates Profile Form inputs.
 * 
 * @param {string} fullName 
 * @param {string} [avatarUrl=''] 
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateProfileForm(fullName, avatarUrl = '') {
  const errors = {};

  const cleanName = (fullName || '').trim();
  if (!cleanName) {
    errors.fullName = 'Họ và tên không được để trống.';
  } else if (cleanName.length > 100) {
    errors.fullName = 'Họ và tên không được vượt quá 100 ký tự.';
  }

  const cleanAvatar = (avatarUrl || '').trim();
  if (cleanAvatar) {
    if (cleanAvatar.length > 500) {
      errors.avatarUrl = 'Đường dẫn ảnh đại diện không được vượt quá 500 ký tự.';
    } else {
      const sanitized = sanitizeResourceUrl(cleanAvatar);
      if (sanitized === 'about:blank') {
        errors.avatarUrl = 'Đường dẫn ảnh không hợp lệ. Vui lòng nhập URL bắt đầu bằng http:// hoặc https://';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Sets avatar image source with strict defense against unsafe protocols.
 * 
 * @param {HTMLImageElement} imgEl 
 * @param {string|null} candidateUrl 
 */
export function setSafeAvatarSrc(imgEl, candidateUrl) {
  if (!imgEl) return;
  if (!candidateUrl || !candidateUrl.trim()) {
    imgEl.src = DEFAULT_AVATAR_PLACEHOLDER;
    return;
  }
  const sanitized = sanitizeResourceUrl(candidateUrl.trim());
  imgEl.src = (sanitized === 'about:blank') ? DEFAULT_AVATAR_PLACEHOLDER : sanitized;
}

/**
 * Formats ISO date string to localized Vietnamese format.
 * 
 * @param {string|null} isoString 
 * @returns {string}
 */
export function formatCreatedAt(isoString) {
  if (!isoString) return '---';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (_) {
    return String(isoString);
  }
}

/**
 * Loads user profile from backend via GET /api/v1/users/profile.
 */
async function loadProfile() {
  const stateContainer = document.getElementById('profileStateContainer');
  const profileCard = document.getElementById('profileCard');

  if (stateContainer) {
    stateContainer.classList.remove('d-none');
    setComponentState(stateContainer, 'LOADING', {
      message: 'Đang tải thông tin hồ sơ người dùng...'
    });
  }

  if (profileCard) {
    profileCard.classList.add('d-none');
  }

  try {
    const profile = await apiClient('/users/profile');
    currentProfile = profile;

    if (stateContainer) {
      stateContainer.classList.add('d-none');
    }

    if (profileCard) {
      profileCard.classList.remove('d-none');
      renderProfileData(profile);
    }

  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      // 401 Unauthorized triggers centralized session expiration
      authManager.handleUnauthorized();
      return;
    }

    if (stateContainer) {
      setComponentState(stateContainer, 'ERROR', {
        title: 'Không thể tải hồ sơ',
        message: err.message || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.',
        retryText: 'Thử lại',
        onRetry: () => loadProfile()
      });
    }
  }
}

/**
 * Populates DOM elements with profile data.
 * 
 * @param {object} profile 
 */
function renderProfileData(profile) {
  const nameDisplay = document.getElementById('profileFullNameDisplay');
  const emailDisplay = document.getElementById('profileEmailDisplay');
  const userIdDisplay = document.getElementById('profileUserIdDisplay');
  const accountIdDisplay = document.getElementById('profileAccountIdDisplay');
  const createdAtDisplay = document.getElementById('profileCreatedAtDisplay');
  const roleBadge = document.getElementById('profileRoleBadge');
  const avatarImg = document.getElementById('profileAvatarImg');

  const fullNameInput = document.getElementById('profileFullNameInput');
  const avatarUrlInput = document.getElementById('profileAvatarUrlInput');

  if (nameDisplay) {
    nameDisplay.textContent = profile?.fullName?.trim() || 'Chưa cập nhật tên';
  }
  if (emailDisplay) {
    emailDisplay.textContent = profile?.emailOrPhone || '---';
  }
  const settingsEmailDisplay = document.getElementById('settingsAccountEmailDisplay');
  if (settingsEmailDisplay) {
    settingsEmailDisplay.textContent = profile?.emailOrPhone || '---';
  }
  if (userIdDisplay) {
    userIdDisplay.textContent = profile?.userId != null ? String(profile.userId) : '---';
  }
  if (accountIdDisplay) {
    accountIdDisplay.textContent = profile?.accountId != null ? String(profile.accountId) : '---';
  }
  if (createdAtDisplay) {
    createdAtDisplay.textContent = formatCreatedAt(profile?.createdAt);
  }

  // ROLES: Sourced strictly from authManager/session, NOT UserProfileResponse
  const roles = authManager.getRoles();
  const primaryRole = getPrimaryRole(roles);

  if (roleBadge) {
    roleBadge.textContent = getRoleLabel(primaryRole);
    roleBadge.className = `${getRoleBadgeClass(primaryRole)}`;
    roleBadge.setAttribute('aria-label', `Vai trò tài khoản: ${getRoleLabel(primaryRole)}`);
  }

  // Render role workspaces if user has elevated privileges
  const workspacesSection = document.getElementById('profileRoleWorkspacesSection');
  const workspacesContainer = document.getElementById('profileWorkspacesContainer');
  if (workspacesSection && workspacesContainer) {
    clearContainer(workspacesContainer);
    const workspaceLinks = [];

    if (roles.includes('Admin')) {
      workspaceLinks.push(
        createSafeElement('a', {
          className: 'btn-chinese-primary py-1 px-3 btn-sm text-decoration-none d-inline-flex align-items-center gap-1',
          text: 'Quản trị hệ thống',
          attrs: { href: 'admin-lessons.html', id: 'profileWorkspaceAdmin' }
        })
      );
    }

    if (roles.includes('Moderator') || roles.includes('Admin')) {
      workspaceLinks.push(
        createSafeElement('a', {
          className: 'btn-chinese-secondary py-1 px-3 btn-sm text-decoration-none d-inline-flex align-items-center gap-1',
          text: 'Hàng đợi kiểm duyệt',
          attrs: { href: 'moderator-queue.html', id: 'profileWorkspaceModerator' }
        }),
        createSafeElement('a', {
          className: 'btn-chinese-outline py-1 px-3 btn-sm text-decoration-none d-inline-flex align-items-center gap-1',
          text: 'Lịch sử kiểm duyệt',
          attrs: { href: 'moderator-history.html', id: 'profileWorkspaceHistory' }
        })
      );
    }

    if (roles.includes('Creator') || roles.includes('Admin')) {
      workspaceLinks.push(
        createSafeElement('a', {
          className: 'btn-chinese-secondary py-1 px-3 btn-sm text-decoration-none d-inline-flex align-items-center gap-1',
          text: 'Creator Studio',
          attrs: { href: 'creator-lessons.html', id: 'profileWorkspaceCreator' }
        }),
        createSafeElement('a', {
          className: 'btn-chinese-outline py-1 px-3 btn-sm text-decoration-none d-inline-flex align-items-center gap-1',
          text: 'Nhập từ Excel',
          attrs: { href: 'creator-import.html', id: 'profileWorkspaceImport' }
        })
      );
    }

    if (workspaceLinks.length > 0) {
      workspaceLinks.forEach(link => workspacesContainer.appendChild(link));
      workspacesSection.classList.remove('d-none');
    } else {
      workspacesSection.classList.add('d-none');
    }
  }

  if (avatarImg) {
    setSafeAvatarSrc(avatarImg, profile?.avatarUrl);
  }

  // Populate form fields
  if (fullNameInput) {
    fullNameInput.value = profile?.fullName || '';
  }
  if (avatarUrlInput) {
    avatarUrlInput.value = profile?.avatarUrl || '';
  }
}

/**
 * Initializes Profile Edit form handler.
 */
function initProfileEditForm() {
  const form = document.getElementById('profileEditForm');
  if (!form) return;

  const fullNameInput = document.getElementById('profileFullNameInput');
  const avatarUrlInput = document.getElementById('profileAvatarUrlInput');
  const fullNameError = document.getElementById('profileFullNameError');
  const avatarUrlError = document.getElementById('profileAvatarUrlError');
  const globalAlert = document.getElementById('profileGlobalAlert');
  const saveBtn = document.getElementById('profileSaveBtn');
  const resetBtn = document.getElementById('profileResetBtn');

  function clearErrors() {
    [fullNameInput, avatarUrlInput].forEach(inp => {
      if (inp) {
        inp.classList.remove('is-invalid');
        inp.removeAttribute('aria-invalid');
      }
    });
    [fullNameError, avatarUrlError].forEach(errEl => {
      if (errEl) {
        errEl.textContent = '';
        errEl.classList.add('d-none');
      }
    });
    if (globalAlert) {
      globalAlert.textContent = '';
      globalAlert.className = 'alert alert-danger d-none mb-3';
    }
  }

  let isSubmitting = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    clearErrors();

    const fullName = fullNameInput?.value || '';
    const avatarUrl = avatarUrlInput?.value || '';

    // Client-side validation
    const validation = validateProfileForm(fullName, avatarUrl);
    if (!validation.isValid) {
      if (validation.errors.fullName && fullNameInput && fullNameError) {
        fullNameInput.classList.add('is-invalid');
        fullNameInput.setAttribute('aria-invalid', 'true');
        fullNameError.textContent = validation.errors.fullName;
        fullNameError.classList.remove('d-none');
      }
      if (validation.errors.avatarUrl && avatarUrlInput && avatarUrlError) {
        avatarUrlInput.classList.add('is-invalid');
        avatarUrlInput.setAttribute('aria-invalid', 'true');
        avatarUrlError.textContent = validation.errors.avatarUrl;
        avatarUrlError.classList.remove('d-none');
      }
      return;
    }

    isSubmitting = true;
    if (saveBtn) {
      saveBtn.disabled = true;
      const btnText = saveBtn.querySelector('.btn-text');
      const spinner = saveBtn.querySelector('.spinner-border');
      if (btnText) btnText.textContent = 'Đang lưu...';
      if (spinner) spinner.classList.remove('d-none');
    }

    try {
      const updatedProfile = await apiClient('/users/profile', {
        method: 'PUT',
        body: {
          fullName: fullName.trim(),
          avatarUrl: avatarUrl.trim() || null
        }
      });

      currentProfile = updatedProfile;

      // Update UI
      renderProfileData(updatedProfile);

      // Synchronize session state via authManager
      authManager.updateUser({ fullName: updatedProfile.fullName });

      // Show success notification
      showToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: 'Thông tin hồ sơ cá nhân đã được lưu thành công.'
      });

    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        authManager.handleUnauthorized();
        return;
      }

      if (err instanceof ApiError && err.status === 400) {
        const fieldErrors = parseFieldErrors(err.errors);
        if (fieldErrors.fullName && fullNameInput && fullNameError) {
          fullNameInput.classList.add('is-invalid');
          fullNameInput.setAttribute('aria-invalid', 'true');
          fullNameError.textContent = fieldErrors.fullName;
          fullNameError.classList.remove('d-none');
        }
        if (fieldErrors.avatarUrl && avatarUrlInput && avatarUrlError) {
          avatarUrlInput.classList.add('is-invalid');
          avatarUrlInput.setAttribute('aria-invalid', 'true');
          avatarUrlError.textContent = fieldErrors.avatarUrl;
          avatarUrlError.classList.remove('d-none');
        }
        if (globalAlert) {
          globalAlert.className = 'alert alert-danger mb-3';
          globalAlert.textContent = err.message || 'Dữ liệu không hợp lệ.';
          globalAlert.classList.remove('d-none');
        }
      } else if (globalAlert) {
        globalAlert.className = 'alert alert-danger mb-3';
        globalAlert.textContent = err.message || 'Không thể lưu thay đổi. Vui lòng thử lại.';
        globalAlert.classList.remove('d-none');
      }
    } finally {
      isSubmitting = false;
      if (saveBtn) {
        saveBtn.disabled = false;
        const btnText = saveBtn.querySelector('.btn-text');
        const spinner = saveBtn.querySelector('.spinner-border');
        if (btnText) btnText.textContent = 'Lưu thay đổi';
        if (spinner) spinner.classList.add('d-none');
      }
    }
  });

  // Reset button restores loaded profile data
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      clearErrors();
      if (currentProfile) {
        renderProfileData(currentProfile);
      }
    });
  }
}

/**
 * Validates SRS Daily Settings for profile page (Task UX/FE Remediation).
 * Only validates newCardsPerDay (> 0, positive integer).
 * 
 * @param {string|number} newCardsPerDay 
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateProfileSrsSettings(newCardsPerDay) {
  const errors = {};
  const newCardsStr = String(newCardsPerDay ?? '').trim();
  if (!newCardsStr) {
    errors.newCardsPerDay = 'Số lượng thẻ mới mỗi ngày không được để trống.';
  } else {
    const num = Number(newCardsStr);
    if (Number.isNaN(num)) {
      errors.newCardsPerDay = 'Số lượng thẻ mới phải là một số nguyên hợp lệ.';
    } else if (!Number.isInteger(num)) {
      errors.newCardsPerDay = 'Số lượng thẻ mới phải là số nguyên (không chứa phần thập phân).';
    } else if (num <= 0) {
      errors.newCardsPerDay = 'Số lượng thẻ mới phải là số nguyên dương lớn hơn 0.';
    }
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Synchronizes active visual state across preset chips based on numeric value.
 * 
 * @param {string|number} value 
 */
export function syncPresetChips(value) {
  const numVal = parseInt(String(value ?? '').trim(), 10);
  const chips = document.querySelectorAll('.srs-preset-chip');
  chips.forEach(chip => {
    const presetVal = parseInt(chip.dataset.preset, 10);
    if (!isNaN(numVal) && presetVal === numVal) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

/**
 * Loads SRS settings from backend via GET /api/v1/srs/settings.
 */
export async function loadSrsSettings() {
  const input = document.getElementById('srsNewCardsPerDayInput');
  try {
    const settings = await apiClient('/srs/settings');
    currentSrsSettings = settings;
    if (input && settings?.newCardsPerDay != null) {
      input.value = String(settings.newCardsPerDay);
      syncPresetChips(settings.newCardsPerDay);
    }
  } catch (err) {
    console.warn('[ProfilePage] Failed to load SRS settings:', err);
  }
}

/**
 * Initializes the Profile SRS Settings form handler.
 */
export function initProfileSrsSettingsForm() {
  const form = document.getElementById('profileSrsSettingsForm');
  if (!form) return;

  const input = document.getElementById('srsNewCardsPerDayInput');
  const errorEl = document.getElementById('srsNewCardsPerDayError');
  const saveBtn = document.getElementById('btnSaveSrsSettings');
  const resetBtn = document.getElementById('btnResetSrsSettings');
  const statusEl = document.getElementById('srsSettingsStatus');
  const btnDecrement = document.getElementById('btnDecrementNewCards');
  const btnIncrement = document.getElementById('btnIncrementNewCards');
  const presetChips = document.querySelectorAll('.srs-preset-chip');

  function clearSrsErrors() {
    if (input) {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
    }
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('d-none');
    }
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.className = 'small mt-2';
    }
  }

  // Stepper: Decrement (-5)
  if (btnDecrement) {
    btnDecrement.addEventListener('click', () => {
      clearSrsErrors();
      const current = parseInt(input?.value || '20', 10);
      const nextVal = Math.max(1, isNaN(current) ? 20 : current - 5);
      if (input) {
        input.value = String(nextVal);
        syncPresetChips(nextVal);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

  // Stepper: Increment (+5)
  if (btnIncrement) {
    btnIncrement.addEventListener('click', () => {
      clearSrsErrors();
      const current = parseInt(input?.value || '20', 10);
      const nextVal = isNaN(current) ? 20 : current + 5;
      if (input) {
        input.value = String(nextVal);
        syncPresetChips(nextVal);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

  // Preset Chips Quick Pick
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      clearSrsErrors();
      const preset = chip.dataset.preset;
      if (input && preset) {
        input.value = preset;
        syncPresetChips(preset);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });

  if (input) {
    input.addEventListener('input', () => {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('d-none');
      }
      syncPresetChips(input.value);
    });
  }

  let isSubmitting = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    clearSrsErrors();

    const newCardsVal = input?.value || '';
    const validation = validateProfileSrsSettings(newCardsVal);
    if (!validation.isValid) {
      if (input && errorEl) {
        input.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');
        errorEl.textContent = validation.errors.newCardsPerDay || '';
        errorEl.classList.remove('d-none');
        input.focus();
      }
      return;
    }

    isSubmitting = true;
    if (saveBtn) {
      saveBtn.disabled = true;
      const btnText = saveBtn.querySelector('.btn-text');
      const spinner = saveBtn.querySelector('.spinner-border');
      if (btnText) btnText.textContent = 'Đang lưu...';
      if (spinner) spinner.classList.remove('d-none');
    }
    if (statusEl) {
      statusEl.textContent = 'Đang lưu cài đặt học tập...';
      statusEl.className = 'small text-secondary mt-2';
    }

    try {
      const updated = await apiClient('/srs/settings', {
        method: 'PUT',
        body: {
          newCardsPerDay: parseInt(String(newCardsVal).trim(), 10)
        }
      });

      currentSrsSettings = updated;
      if (input && updated?.newCardsPerDay != null) {
        input.value = String(updated.newCardsPerDay);
        syncPresetChips(updated.newCardsPerDay);
      }

      if (statusEl) {
        statusEl.textContent = '✓ Đã cập nhật cài đặt học tập SRS thành công!';
        statusEl.className = 'small text-success fw-semibold mt-2';
      }

      showToast({
        type: 'success',
        title: 'Cài đặt học tập',
        message: 'Đã lưu số thẻ mới mỗi ngày thành công.'
      });
    } catch (err) {
      console.error('[ProfilePage] Failed to save SRS settings:', err);
      const msg = err.message || 'Không thể lưu cài đặt. Vui lòng thử lại sau.';
      if (statusEl) {
        statusEl.textContent = `⚠️ ${msg}`;
        statusEl.className = 'small text-danger fw-semibold mt-2';
      }
      showToast({
        type: 'danger',
        title: 'Lỗi cập nhật',
        message: msg
      });
    } finally {
      isSubmitting = false;
      if (saveBtn) {
        saveBtn.disabled = false;
        const btnText = saveBtn.querySelector('.btn-text');
        const spinner = saveBtn.querySelector('.spinner-border');
        if (btnText) btnText.textContent = 'Lưu cài đặt học tập';
        if (spinner) spinner.classList.add('d-none');
      }
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      clearSrsErrors();
      if (currentSrsSettings && input && currentSrsSettings.newCardsPerDay != null) {
        input.value = String(currentSrsSettings.newCardsPerDay);
        syncPresetChips(currentSrsSettings.newCardsPerDay);
        if (statusEl) {
          statusEl.textContent = 'Đã khôi phục giá trị đã lưu.';
          statusEl.className = 'small text-muted mt-2';
        }
      }
    });
  }
}

/**
 * Manages tab switching between Personal Info and Settings.
 * Supports URL hash navigation (#srs-settings / #settings / #personal-info) and accessible attributes.
 */
export function initProfileTabs() {
  const tabPersonal = document.getElementById('tabPersonalInfo');
  const tabSettings = document.getElementById('tabLearningSettings');
  const panePersonal = document.getElementById('panePersonalInfo');
  const paneSettings = document.getElementById('paneLearningSettings');

  if (!tabPersonal || !tabSettings || !panePersonal || !paneSettings) return;

  function switchTab(activeTab, activePane, inactiveTab, inactivePane) {
    activeTab.classList.add('active');
    activeTab.setAttribute('aria-selected', 'true');
    inactiveTab.classList.remove('active');
    inactiveTab.setAttribute('aria-selected', 'false');

    activePane.classList.add('show', 'active');
    inactivePane.classList.remove('show', 'active');
  }

  function activatePersonalTab() {
    switchTab(tabPersonal, panePersonal, tabSettings, paneSettings);
  }

  function activateSettingsTab() {
    switchTab(tabSettings, paneSettings, tabPersonal, panePersonal);
  }

  tabPersonal.addEventListener('click', () => {
    activatePersonalTab();
    if (typeof history !== 'undefined' && history.replaceState) {
      history.replaceState(null, '', '#personal-info');
    }
  });

  tabSettings.addEventListener('click', () => {
    activateSettingsTab();
    loadSrsSettings();
    if (typeof history !== 'undefined' && history.replaceState) {
      history.replaceState(null, '', '#settings');
    }
  });

  function checkHash() {
    const hash = (typeof window !== 'undefined' && window.location.hash) || '';
    if (hash === '#srs-settings' || hash === '#settings') {
      activateSettingsTab();
      loadSrsSettings();
      if (hash === '#srs-settings') {
        const srsCard = document.getElementById('srs-settings-card');
        const srsInput = document.getElementById('srsNewCardsPerDayInput');
        if (srsCard && typeof srsCard.scrollIntoView === 'function') {
          srsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        if (srsInput && typeof srsInput.focus === 'function') {
          srsInput.focus();
        }
      }
    } else if (hash === '#personal-info') {
      activatePersonalTab();
    }
  }

  checkHash();
  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', checkHash);
  }
}


if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Guard check: Unauthenticated users are redirected to login
    if (!authManager.isAuthenticated()) {
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = 'login.html?redirect=profile.html';
      }
      return;
    }

    // 2. Initialize shared navbar auth watcher
    initNavbarAuth('navAuthContainer');

    // 3. Initialize tabs and form controls
    initProfileTabs();
    initProfileEditForm();
    initProfileSrsSettingsForm();
    loadProfile();
  });
}
