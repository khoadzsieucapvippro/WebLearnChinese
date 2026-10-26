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
import { setComponentState, showToast, setupPasswordToggle } from '../ui/ui.js';
import { sanitizeResourceUrl, createSafeElement, clearContainer } from '../ui/security.js';


/**
 * Reads and optimizes an image File from local device/folder.
 * Downscales to square thumbnail (default 160x160) and encodes as JPEG data URL.
 * 
 * @param {File} file 
 * @param {number} [maxDimension=160]
 * @returns {Promise<string>} safe raster data URL
 */
export function processAvatarFile(file, maxDimension = 160) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Vui lòng chọn một tệp hình ảnh.'));
    }
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    const fileType = (file.type || '').toLowerCase();
    const fileName = (file.name || '').toLowerCase();
    const hasValidExt = /\.(png|jpe?g|webp|gif)$/i.test(fileName);

    if ((!fileType && !hasValidExt) || (fileType && !validMimes.includes(fileType) && !hasValidExt)) {
      return reject(new Error('Định dạng hình ảnh không được hỗ trợ. Vui lòng chọn tệp PNG, JPEG hoặc WebP.'));
    }
    if (file.size > 5 * 1024 * 1024) {
      return reject(new Error('Kích thước ảnh vượt quá giới hạn 5MB. Vui lòng chọn ảnh nhỏ hơn.'));
    }

    if (typeof FileReader === 'undefined') {
      return reject(new Error('Trình duyệt không hỗ trợ FileReader API.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh từ thiết bị.'));
    reader.onload = (e) => {
      const result = e.target?.result;
      if (!result || typeof result !== 'string') {
        return reject(new Error('Dữ liệu ảnh rỗng hoặc không hợp lệ.'));
      }

      if (typeof Image === 'undefined' || typeof document === 'undefined' || !document.createElement) {
        return resolve(result);
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Không thể phân tích dữ liệu hình ảnh đã chọn.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = maxDimension;
          canvas.height = maxDimension;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(result);
          }

          // Center crop to square
          const minSide = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
          const sx = ((img.naturalWidth || img.width) - minSide) / 2;
          const sy = ((img.naturalHeight || img.height) - minSide) / 2;

          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxDimension, maxDimension);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedDataUrl);
        } catch (_) {
          resolve(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

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



  if (avatarImg) {
    const accountId = profile?.accountId || authManager.getUser()?.accountId || 'current';
    let customLocalAvatar = null;
    try {
      if (typeof localStorage !== 'undefined') {
        customLocalAvatar = localStorage.getItem(`weblearnchinese_custom_avatar_${accountId}`);
      }
    } catch (_) {}
    const avatarCandidate = customLocalAvatar || profile?.avatarUrl || authManager.getUser()?.avatarUrl;
    setSafeAvatarSrc(avatarImg, avatarCandidate);
  }

  // Populate form fields
  if (fullNameInput) {
    fullNameInput.value = profile?.fullName || '';
  }
  if (avatarUrlInput) {
    avatarUrlInput.value = profile?.avatarUrl || '';
  }

  const avatarPendingBadge = document.getElementById('profileAvatarPendingBadge');
  if (avatarPendingBadge) {
    avatarPendingBadge.classList.add('d-none');
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
  const chooseFileBtn = document.getElementById('profileChooseFileBtn');
  const formChooseFileBtn = document.getElementById('profileFormChooseFileBtn');
  const cameraOverlayBtn = document.getElementById('profileCameraOverlayBtn');
  const fileInput = document.getElementById('profileAvatarFileInput');
  const removeAvatarBtn = document.getElementById('profileRemoveAvatarBtn');
  const avatarImg = document.getElementById('profileAvatarImg');
  const avatarDropZone = document.getElementById('profileAvatarDropZone');
  const avatarPendingBadge = document.getElementById('profileAvatarPendingBadge');

  let pendingCustomAvatar = null;

  async function handleAvatarFile(file) {
    if (!file) return;

    try {
      const dataUrl = await processAvatarFile(file);
      pendingCustomAvatar = dataUrl;
      setSafeAvatarSrc(avatarImg, dataUrl);
      if (avatarUrlInput) {
        avatarUrlInput.value = '';
      }
      if (avatarPendingBadge) {
        avatarPendingBadge.textContent = 'Đã chọn ảnh mới (Chưa lưu)';
        avatarPendingBadge.className = 'badge bg-warning-subtle text-warning-emphasis border border-warning-subtle small';
        avatarPendingBadge.classList.remove('d-none');
      }
      showToast({
        type: 'info',
        title: 'Đã tải ảnh lên',
        message: 'Ảnh đại diện đã được cập nhật bản xem trước. Nhấn "Lưu thay đổi" để áp dụng vào hồ sơ.'
      });
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Lỗi tải ảnh',
        message: err.message || 'Không thể xử lý tệp ảnh đã chọn.'
      });
    } finally {
      if (fileInput) fileInput.value = '';
    }
  }

  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleAvatarFile(file);
      }
    });
  }

  if (chooseFileBtn && fileInput) {
    chooseFileBtn.addEventListener('click', () => {
      fileInput.click();
    });
  }

  if (formChooseFileBtn && fileInput) {
    formChooseFileBtn.addEventListener('click', () => {
      fileInput.click();
    });
  }

  if (cameraOverlayBtn && fileInput) {
    cameraOverlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (avatarDropZone && fileInput) {
    avatarDropZone.addEventListener('click', (e) => {
      if (e.target.closest('#profileCameraOverlayBtn')) return;
      fileInput.click();
    });

    let dragCounter = 0;

    avatarDropZone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      avatarDropZone.classList.add('is-dragover');
    });

    avatarDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
      avatarDropZone.classList.add('is-dragover');
    });

    avatarDropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        avatarDropZone.classList.remove('is-dragover');
      }
    });

    avatarDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      avatarDropZone.classList.remove('is-dragover');

      const droppedFiles = e.dataTransfer?.files;
      if (droppedFiles && droppedFiles.length > 0) {
        handleAvatarFile(droppedFiles[0]);
      }
    });
  }

  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener('click', () => {
      pendingCustomAvatar = 'REMOVE';
      setSafeAvatarSrc(avatarImg, null);
      if (avatarUrlInput) {
        avatarUrlInput.value = '';
      }
      if (avatarPendingBadge) {
        avatarPendingBadge.textContent = 'Đã chọn ảnh mặc định (Chưa lưu)';
        avatarPendingBadge.className = 'badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle small';
        avatarPendingBadge.classList.remove('d-none');
      }
      showToast({
        type: 'info',
        title: 'Ảnh đại diện mặc định',
        message: 'Đã khôi phục biểu tượng mặc định. Nhấn "Lưu thay đổi" để hoàn tất.'
      });
    });
  }

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
      let payloadAvatarUrl = currentProfile?.avatarUrl ?? null;
      if (pendingCustomAvatar === 'REMOVE') {
        payloadAvatarUrl = null;
      } else if (pendingCustomAvatar) {
        payloadAvatarUrl = null;
      } else if (avatarUrlInput && avatarUrl.trim().length > 0) {
        payloadAvatarUrl = avatarUrl.trim();
      }

      const updatedProfile = await apiClient('/users/profile', {
        method: 'PUT',
        body: {
          fullName: fullName.trim(),
          avatarUrl: payloadAvatarUrl
        }
      });

      currentProfile = updatedProfile;

      const accountId = updatedProfile.accountId || authManager.getUser()?.accountId || 'current';
      if (pendingCustomAvatar === 'REMOVE') {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(`weblearnchinese_custom_avatar_${accountId}`);
          }
        } catch (_) {}
        authManager.updateUser({ avatarUrl: null });
        pendingCustomAvatar = null;
      } else if (pendingCustomAvatar) {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`weblearnchinese_custom_avatar_${accountId}`, pendingCustomAvatar);
          }
        } catch (_) {}
        authManager.updateUser({ avatarUrl: pendingCustomAvatar });
        pendingCustomAvatar = null;
      } else if (avatarUrlInput && avatarUrlInput.value.trim().length > 0) {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(`weblearnchinese_custom_avatar_${accountId}`);
          }
        } catch (_) {}
        authManager.updateUser({ avatarUrl: payloadAvatarUrl });
      }

      if (avatarPendingBadge) {
        avatarPendingBadge.classList.add('d-none');
      }

      // Update UI
      renderProfileData(updatedProfile);

      // Synchronize session state via authManager
      authManager.updateUser({ fullName: updatedProfile.fullName });

      // Show success notification
      showToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: 'Thông tin hồ sơ cá nhân và ảnh đại diện đã được lưu thành công.'
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
      pendingCustomAvatar = null;
      if (fileInput) {
        fileInput.value = '';
      }
      if (avatarPendingBadge) {
        avatarPendingBadge.classList.add('d-none');
      }
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
      const maxReview = (currentSrsSettings && typeof currentSrsSettings.maxReviewPerDay === 'number' && currentSrsSettings.maxReviewPerDay > 0)
        ? currentSrsSettings.maxReviewPerDay
        : 100;

      const updated = await apiClient('/srs/settings', {
        method: 'PUT',
        body: {
          newCardsPerDay: parseInt(String(newCardsVal).trim(), 10),
          maxReviewPerDay: maxReview
        }
      });

      currentSrsSettings = updated;
      if (input && updated?.newCardsPerDay != null) {
        input.value = String(updated.newCardsPerDay);
        syncPresetChips(updated.newCardsPerDay);
      }

      if (statusEl) {
        statusEl.textContent = '✓ Đã cập nhật cài đặt học tập thành công!';
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
    const roles = authManager.getRoles();
    const isStaff = roles.includes('Admin') || roles.includes('Creator') || roles.includes('Moderator');
    if (!isStaff) {
      loadSrsSettings();
      initDisplayAndAudioSettings();
    }
    if (typeof history !== 'undefined' && history.replaceState) {
      history.replaceState(null, '', '#settings');
    }
  });

  function checkHash() {
    const hash = (typeof window !== 'undefined' && window.location.hash) || '';
    if (hash === '#srs-settings' || hash === '#settings' || hash === '#security') {
      activateSettingsTab();
      const roles = authManager.getRoles();
      const isStaff = roles.includes('Admin') || roles.includes('Creator') || roles.includes('Moderator');
      if (!isStaff) {
        loadSrsSettings();
        initDisplayAndAudioSettings();
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

export const AUDIO_SETTINGS_STORAGE_KEY = 'HOC_HAN_NGU_AUDIO_SETTINGS';
export const WRITING_SETTINGS_STORAGE_KEY = 'HOC_HAN_NGU_WRITING_SETTINGS';

export const DEFAULT_AUDIO_SETTINGS = Object.freeze({
  autoPronounce: true,
  speechRate: 1.0
});

export const DEFAULT_WRITING_SETTINGS = Object.freeze({
  showOutline: true,
  autoReplayStrokes: false,
  gridSize: 'standard',
  gridPixelSize: 170
});

/**
 * Retrieves audio and pronunciation preferences from localStorage.
 * Safe for SSR and environments without localStorage.
 * 
 * @returns {{ autoPronounce: boolean, speechRate: number }}
 */
export function getAudioSettings() {
  if (typeof localStorage === 'undefined') {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
  try {
    const raw = localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AUDIO_SETTINGS };
    const parsed = JSON.parse(raw);
    const autoPronounce = typeof parsed?.autoPronounce === 'boolean'
      ? parsed.autoPronounce
      : (parsed?.autoPronounce === 'false' || parsed?.autoPronounce === false ? false : true);
    const rate = parseFloat(parsed?.speechRate);
    const speechRate = (!isNaN(rate) && rate > 0) ? rate : DEFAULT_AUDIO_SETTINGS.speechRate;
    return { autoPronounce, speechRate };
  } catch (_) {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

/**
 * Saves audio and pronunciation preferences to localStorage.
 * 
 * @param {Partial<{ autoPronounce: boolean, speechRate: number }>} [settings={}]
 * @returns {{ autoPronounce: boolean, speechRate: number }}
 */
export function saveAudioSettings(settings = {}) {
  const current = getAudioSettings();
  let rate = current.speechRate;
  if (settings.speechRate !== undefined) {
    const parsed = parseFloat(settings.speechRate);
    rate = (!isNaN(parsed) && parsed > 0) ? parsed : DEFAULT_AUDIO_SETTINGS.speechRate;
  }
  const next = {
    autoPronounce: typeof settings.autoPronounce === 'boolean'
      ? settings.autoPronounce
      : (settings.autoPronounce !== undefined ? Boolean(settings.autoPronounce) : current.autoPronounce),
    speechRate: rate
  };
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[ProfilePage] Failed to save audio settings to localStorage:', e);
    }
  }
  return next;
}

/**
 * Retrieves character writing and display preferences from localStorage.
 * 
 * @returns {{ showOutline: boolean, autoReplayStrokes: boolean, gridSize: string, gridPixelSize: number }}
 */
export function getWritingSettings() {
  if (typeof localStorage === 'undefined') {
    return { ...DEFAULT_WRITING_SETTINGS };
  }
  try {
    const raw = localStorage.getItem(WRITING_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_WRITING_SETTINGS };
    const parsed = JSON.parse(raw);
    const showOutline = typeof parsed?.showOutline === 'boolean'
      ? parsed.showOutline
      : (parsed?.showOutline === 'false' || parsed?.showOutline === false ? false : true);
    const autoReplayStrokes = typeof parsed?.autoReplayStrokes === 'boolean'
      ? parsed.autoReplayStrokes
      : (parsed?.autoReplayStrokes === 'true' || parsed?.autoReplayStrokes === true);
    const gridSize = (parsed?.gridSize === 'large' || parsed?.gridSize === 'standard')
      ? parsed.gridSize
      : DEFAULT_WRITING_SETTINGS.gridSize;
    return {
      showOutline,
      autoReplayStrokes,
      gridSize,
      gridPixelSize: gridSize === 'large' ? 200 : 170
    };
  } catch (_) {
    return { ...DEFAULT_WRITING_SETTINGS };
  }
}

/**
 * Saves character writing and display preferences to localStorage.
 * 
 * @param {Partial<{ showOutline: boolean, autoReplayStrokes: boolean, gridSize: string }>} [settings={}]
 * @returns {{ showOutline: boolean, autoReplayStrokes: boolean, gridSize: string, gridPixelSize: number }}
 */
export function saveWritingSettings(settings = {}) {
  const current = getWritingSettings();
  const next = {
    showOutline: typeof settings.showOutline === 'boolean'
      ? settings.showOutline
      : (settings.showOutline !== undefined ? Boolean(settings.showOutline) : current.showOutline),
    autoReplayStrokes: typeof settings.autoReplayStrokes === 'boolean'
      ? settings.autoReplayStrokes
      : (settings.autoReplayStrokes !== undefined ? Boolean(settings.autoReplayStrokes) : current.autoReplayStrokes),
    gridSize: (settings.gridSize === 'large' || settings.gridSize === 'standard')
      ? settings.gridSize
      : current.gridSize
  };
  next.gridPixelSize = next.gridSize === 'large' ? 200 : 170;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(WRITING_SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[ProfilePage] Failed to save writing settings to localStorage:', e);
    }
  }
  return next;
}

/**
 * Initializes controls and listeners for Audio and Writing display settings (Task UX Yêu cầu 7).
 */
export function initDisplayAndAudioSettings() {
  const autoPronounceEl = document.getElementById('settingAutoPronounce');
  const speechRateEl = document.getElementById('settingSpeechRate');
  const showOutlineEl = document.getElementById('settingShowOutline');
  const autoReplayStrokesEl = document.getElementById('settingAutoReplayStrokes');
  const gridSizeEl = document.getElementById('settingGridSize');
  const saveBtn = document.getElementById('btnSaveDisplayAudioSettings');
  const statusEl = document.getElementById('displayAudioSettingsStatus');

  const audioPrefs = getAudioSettings();
  const writingPrefs = getWritingSettings();

  if (autoPronounceEl) {
    autoPronounceEl.checked = audioPrefs.autoPronounce;
  }
  if (speechRateEl) {
    speechRateEl.value = String(audioPrefs.speechRate);
  }
  if (showOutlineEl) {
    showOutlineEl.checked = writingPrefs.showOutline;
  }
  if (autoReplayStrokesEl) {
    autoReplayStrokesEl.checked = writingPrefs.autoReplayStrokes;
  }
  if (gridSizeEl) {
    gridSizeEl.value = writingPrefs.gridSize;
  }

  function handleSave() {
    const updatedAudio = {
      autoPronounce: autoPronounceEl ? autoPronounceEl.checked : true,
      speechRate: speechRateEl ? parseFloat(speechRateEl.value) || 1.0 : 1.0
    };
    const updatedWriting = {
      showOutline: showOutlineEl ? showOutlineEl.checked : true,
      autoReplayStrokes: autoReplayStrokesEl ? autoReplayStrokesEl.checked : false,
      gridSize: gridSizeEl ? gridSizeEl.value : 'standard'
    };

    saveAudioSettings(updatedAudio);
    saveWritingSettings(updatedWriting);

    if (statusEl) {
      statusEl.textContent = '✓ Đã lưu cài đặt hiển thị & âm thanh thành công!';
      statusEl.className = 'small text-success fw-semibold';
      setTimeout(() => {
        if (statusEl && statusEl.textContent.includes('Đã lưu cài đặt')) {
          statusEl.textContent = '';
        }
      }, 4000);
    }

    showToast({
      type: 'success',
      title: 'Cài đặt hiển thị & âm thanh',
      message: 'Đã lưu cấu hình phát âm và luyện viết thành công.'
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', handleSave);
  }

  const controls = [autoPronounceEl, speechRateEl, showOutlineEl, autoReplayStrokesEl, gridSizeEl];
  controls.forEach(ctrl => {
    if (ctrl) {
      ctrl.addEventListener('change', () => {
        const updatedAudio = {
          autoPronounce: autoPronounceEl ? autoPronounceEl.checked : true,
          speechRate: speechRateEl ? parseFloat(speechRateEl.value) || 1.0 : 1.0
        };
        const updatedWriting = {
          showOutline: showOutlineEl ? showOutlineEl.checked : true,
          autoReplayStrokes: autoReplayStrokesEl ? autoReplayStrokesEl.checked : false,
          gridSize: gridSizeEl ? gridSizeEl.value : 'standard'
        };
        saveAudioSettings(updatedAudio);
        saveWritingSettings(updatedWriting);
        if (statusEl) {
          statusEl.textContent = '✓ Đã lưu thay đổi!';
          statusEl.className = 'small text-success fw-semibold';
          setTimeout(() => {
            if (statusEl && statusEl.textContent.includes('Đã lưu thay đổi')) {
              statusEl.textContent = '';
            }
          }, 3000);
        }
      });
    }
  });
}

/**
 * Validates password change form inputs (Task R3 / Feature F19).
 * Contract:
 * - currentPassword: string, non-blank
 * - newPassword: string, length 6-100, !== currentPassword
 * - confirmNewPassword: string, === newPassword
 *
 * @param {Object} payload
 * @param {string} payload.currentPassword
 * @param {string} payload.newPassword
 * @param {string} [payload.confirmNewPassword]
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateChangePasswordForm(payload = {}) {
  const errors = {};
  const currentPassword = typeof payload.currentPassword === 'string' ? payload.currentPassword.trim() : '';
  const newPassword = typeof payload.newPassword === 'string' ? payload.newPassword.trim() : '';
  const confirmNewPassword = typeof payload.confirmNewPassword === 'string' ? payload.confirmNewPassword.trim() : '';

  if (!currentPassword) {
    errors.currentPassword = 'Mật khẩu hiện tại không được để trống';
  }

  if (!newPassword) {
    errors.newPassword = 'Mật khẩu mới không được để trống';
  } else if (newPassword.length < 6) {
    errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
  } else if (newPassword.length > 100) {
    errors.newPassword = 'Mật khẩu mới không được vượt quá 100 ký tự';
  } else if (currentPassword && newPassword === currentPassword) {
    errors.newPassword = 'Mật khẩu mới không được trùng với mật khẩu hiện tại';
  }

  if (payload.confirmNewPassword !== undefined) {
    if (!confirmNewPassword) {
      errors.confirmNewPassword = 'Vui lòng xác nhận mật khẩu mới';
    } else if (newPassword && confirmNewPassword !== newPassword) {
      errors.confirmNewPassword = 'Xác nhận mật khẩu mới không trùng khớp';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Initializes the Account Security / Change Password form.
 * Calls POST /api/v1/auth/change-password.
 * Strictly adheres to Zero Web Storage Exposure: never stores passwords in storage.
 */
export function initAccountSecurity() {
  if (typeof document === 'undefined') return;

  const form = document.getElementById('changePasswordForm');
  if (!form) return;

  const currentInput = document.getElementById('currentPasswordInput');
  const newInput = document.getElementById('newPasswordInput');
  const confirmInput = document.getElementById('confirmNewPasswordInput');

  const toggleCurrentBtn = document.getElementById('toggleCurrentPasswordBtn');
  if (toggleCurrentBtn && currentInput) {
    setupPasswordToggle(toggleCurrentBtn, currentInput);
  }
  const toggleNewBtn = document.getElementById('toggleNewPasswordBtn');
  if (toggleNewBtn && newInput) {
    setupPasswordToggle(toggleNewBtn, newInput);
  }
  const toggleConfirmBtn = document.getElementById('toggleConfirmNewPasswordBtn');
  if (toggleConfirmBtn && confirmInput) {
    setupPasswordToggle(toggleConfirmBtn, confirmInput);
  }
  const submitBtn = document.getElementById('btnChangePassword');
  const resetBtn = document.getElementById('btnResetPasswordForm');
  const globalAlert = document.getElementById('changePasswordGlobalAlert');
  const currentFeedback = document.getElementById('currentPasswordFeedback');
  const newFeedback = document.getElementById('newPasswordFeedback');
  const confirmFeedback = document.getElementById('confirmNewPasswordFeedback');

  function clearFieldErrors() {
    [currentInput, newInput, confirmInput].forEach(inp => {
      if (inp) {
        inp.classList.remove('is-invalid');
        inp.classList.remove('is-valid');
      }
    });
    [currentFeedback, newFeedback, confirmFeedback].forEach(fb => {
      if (fb) fb.textContent = '';
    });
    if (globalAlert) {
      globalAlert.classList.add('d-none');
      globalAlert.textContent = '';
      globalAlert.className = 'mb-3 d-none';
    }
  }

  function showGlobalAlert(message, type = 'danger') {
    if (!globalAlert) return;
    globalAlert.className = `alert alert-${type} py-2 px-3 small mb-3`;
    globalAlert.textContent = message;
    globalAlert.classList.remove('d-none');
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      clearFieldErrors();
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors();

    const currentPassword = currentInput ? currentInput.value : '';
    const newPassword = newInput ? newInput.value : '';
    const confirmNewPassword = confirmInput ? confirmInput.value : '';

    const validation = validateChangePasswordForm({
      currentPassword,
      newPassword,
      confirmNewPassword
    });

    if (!validation.isValid) {
      if (validation.errors.currentPassword && currentInput && currentFeedback) {
        currentInput.classList.add('is-invalid');
        currentFeedback.textContent = validation.errors.currentPassword;
      }
      if (validation.errors.newPassword && newInput && newFeedback) {
        newInput.classList.add('is-invalid');
        newFeedback.textContent = validation.errors.newPassword;
      }
      if (validation.errors.confirmNewPassword && confirmInput && confirmFeedback) {
        confirmInput.classList.add('is-invalid');
        confirmFeedback.textContent = validation.errors.confirmNewPassword;
      }
      return;
    }

    // Set loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      const spinner = submitBtn.querySelector('.spinner-border');
      if (spinner) spinner.classList.remove('d-none');
    }

    try {
      await apiClient('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      // Refresh active session JWT after authorizationVersion increment on backend
      const currentUser = authManager.getUser();
      if (currentUser?.emailOrPhone) {
        try {
          const reloginData = await apiClient('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
              emailOrPhone: currentUser.emailOrPhone,
              password: newPassword
            }),
            skipAuthRedirect: true
          }).catch(() => null);
          const sessionPayload = reloginData?.data || reloginData;
          if (sessionPayload && typeof sessionPayload.token === 'string' && sessionPayload.token.trim()) {
            authManager.setSession(sessionPayload);
          }
        } catch (_) {}
      }

      // Reset form and clear password variables immediately (Zero Web Storage Exposure)
      form.reset();
      clearFieldErrors();

      showGlobalAlert('✓ Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới cho các lần đăng nhập tiếp theo.', 'success');
      showToast({
        type: 'success',
        title: 'Bảo mật tài khoản',
        message: 'Đổi mật khẩu thành công.'
      });
    } catch (err) {
      const message = err.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại thông tin.';
      if (err.status === 401 || (err.status === 400 && message.toLowerCase().includes('mật khẩu hiện tại'))) {
        if (currentInput && currentFeedback) {
          currentInput.classList.add('is-invalid');
          currentFeedback.textContent = message;
        }
      }
      showGlobalAlert(message, 'danger');
      showToast({
        type: 'error',
        title: 'Lỗi đổi mật khẩu',
        message: message
      });
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        const spinner = submitBtn.querySelector('.spinner-border');
        if (spinner) spinner.classList.add('d-none');
      }
    }
  });
}

/**
 * Adapts header layout for staff members (Admin, Creator, Moderator).
 * Ensures zero student navigation links and brand links directly to management hub.
 */
export function adaptHeaderForManagement() {
  const headerEl = document.querySelector('header.site-header');
  if (!headerEl) return;

  headerEl.className = 'management-header sticky-top';

  const brandLink = createSafeElement('a', {
    className: 'management-brand d-flex align-items-center gap-2 text-decoration-none',
    attrs: { href: 'management.html' },
    children: [
      createSafeElement('span', { className: 'chinese-seal-icon', text: '管', attrs: { 'aria-hidden': 'true' } }),
      createSafeElement('div', {
        className: 'd-flex flex-column',
        children: [
          createSafeElement('span', { className: 'fw-bold fs-5 text-chinese-red lh-1', text: 'Hán Ngữ' }),
          createSafeElement('span', { className: 'fs-7 text-secondary tracking-wide', text: 'QUẢN LÝ & TÁC NGHIỆP' })
        ]
      }),
      createSafeElement('span', { className: 'management-brand-badge d-none d-sm-inline-block', text: 'Hồ sơ tài khoản' })
    ]
  });

  const authContainer = createSafeElement('div', {
    className: 'd-flex align-items-center gap-2',
    attrs: { id: 'navAuthContainer' }
  });

  const leftBox = createSafeElement('div', {
    className: 'd-flex align-items-center gap-2 gap-lg-3',
    children: [brandLink]
  });

  const rightBox = createSafeElement('div', {
    className: 'd-flex align-items-center gap-2',
    children: [authContainer]
  });

  const row = createSafeElement('div', {
    className: 'd-flex align-items-center justify-content-between py-2',
    children: [leftBox, rightBox]
  });

  const containerFluid = createSafeElement('div', {
    className: 'container-fluid px-3 px-lg-4',
    children: [row]
  });

  headerEl.replaceChildren(containerFluid);
  initNavbarAuth('navAuthContainer');
}

/**
 * Applies contextual separation of learning settings for management staff.
 * - For staff: removes learning/SRS widgets, updates tab label to "Bảo mật & Cài đặt".
 * - For learner: preserves standard learner experience and initializes study settings.
 */
export function applyProfileContext() {
  const roles = authManager.getRoles();
  const hasManagementRole = roles.includes('Admin') || roles.includes('Creator') || roles.includes('Moderator');

  if (hasManagementRole) {
    adaptHeaderForManagement();

    const srsCard = document.getElementById('srs-settings-card');
    if (srsCard && typeof srsCard.remove === 'function') srsCard.remove();

    const localNotice = document.getElementById('localSettingsNotice');
    if (localNotice && typeof localNotice.remove === 'function') localNotice.remove();

    const audioCard = document.getElementById('audio-settings-card');
    if (audioCard && typeof audioCard.remove === 'function') audioCard.remove();

    const writingCard = document.getElementById('writing-settings-card');
    if (writingCard && typeof writingCard.remove === 'function') writingCard.remove();

    const tabSettings = document.getElementById('tabLearningSettings');
    if (tabSettings) {
      const labelSpan = tabSettings.querySelector('span > span:last-child');
      if (labelSpan) labelSpan.textContent = 'Bảo mật & Cài đặt';
    }
    const paneHeading = document.querySelector('#paneLearningSettings h2');
    if (paneHeading) {
      paneHeading.textContent = 'Cài Đặt Tài Khoản & Bảo Mật';
    }
    const paneSubtext = document.querySelector('#paneLearningSettings h2 + p');
    if (paneSubtext) {
      paneSubtext.textContent = 'Quản lý thông tin định danh và bảo mật tài khoản tác nghiệp.';
    }
  } else {
    initProfileSrsSettingsForm();
    initDisplayAndAudioSettings();
  }
}

/**
 * Loads both user profile and SRS settings, and synchronizes local audio/writing settings.
 */
export async function loadUserProfileAndSettings() {
  await Promise.allSettled([
    loadProfile(),
    loadSrsSettings()
  ]);
  initDisplayAndAudioSettings();
  initAccountSecurity();
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

    // 3. Initialize tabs, form controls, and apply contextual separation
    initProfileTabs();
    initProfileEditForm();
    applyProfileContext();
    initAccountSecurity();
    loadProfile();
  });
}
