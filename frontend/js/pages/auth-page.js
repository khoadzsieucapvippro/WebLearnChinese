/**
 * =============================================================================
 * AUTHENTICATION PAGE CONTROLLER (TASK 9B.1)
 * Module: frontend/js/pages/auth-page.js
 * 
 * Responsibilities:
 * - Login & Register form submission orchestration.
 * - Client-side validation aligned with Spring Boot backend constraints.
 * - Double-submission prevention and accessible button loading states.
 * - Centralized API integration via apiClient() and session management via authManager.
 * - Strict defense against Open Redirect attacks on ?redirect= parameter.
 * - WCAG 2.2 AA accessible inline validation error feedback and ARIA live regions.
 * - Preserves user inputs on failure and prevents leaking sensitive system details.
 * =============================================================================
 */

import { apiClient, ApiError, parseFieldErrors } from '../api/api.js';
import { authManager } from '../auth/auth-state.js';
import { initNavbarAuth } from '../ui/nav.js';
import { showToast } from '../ui/ui.js';

/**
 * Resolves the application base URL (directory containing HTML pages).
 * Respects GitHub Pages project subpath (e.g. /WebLearnChinese/) and root deployments (/).
 *
 * @param {string} [baseHref]
 * @returns {URL}
 */
export function getAppBaseUrl(baseHref) {
  const currentHref = baseHref || (
    typeof window !== 'undefined' && window.location?.href
      ? window.location.href
      : 'http://localhost/index.html'
  );
  return new URL('./', currentHref);
}

/**
 * Validates candidates for internal navigation redirect.
 * Strictly defends against Open Redirect vulnerabilities (CWE-601).
 * Rejects absolute URLs to external hosts, protocol-relative URLs (//),
 * backslash host vectors (/\, \\), and executable schemes (javascript:, data:, vbscript:).
 *
 * Handles project-relative, root-relative, and same-origin paths consistently across
 * both GitHub Pages project sites (/WebLearnChinese/) and local/root deployments (/),
 * preventing path truncation, directory escape, or duplicated project subpaths.
 *
 * @param {string|null} targetUrl Candidate redirect destination
 * @param {string} [baseHref] Optional context URL for resolution (defaults to current window.location.href)
 * @returns {string} Safe document-relative path or 'index.html' fallback
 */
export function validateInternalRedirect(targetUrl, baseHref) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return 'index.html';
  }

  let trimmed = targetUrl.trim();
  if (!trimmed) {
    return 'index.html';
  }

  // Reject ASCII control characters (defense against obfuscated protocol injection)
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return 'index.html';
  }

  // Reject protocol-relative and backslash host vectors
  if (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.startsWith('\\') ||
    trimmed.startsWith('\\/')
  ) {
    return 'index.html';
  }

  // Reject dangerous executable schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('about:')
  ) {
    return 'index.html';
  }

  try {
    const baseUrl = getAppBaseUrl(baseHref);
    const basePath = baseUrl.pathname; // e.g. '/WebLearnChinese/' or '/'
    const baseSubdir = basePath === '/' ? '' : basePath.replace(/^\/+|\/+$/g, ''); // e.g. 'WebLearnChinese'

    // Normalize input string:
    // If input starts with project subpath without leading slash (e.g. 'WebLearnChinese/vocabulary.html'),
    // normalize with leading '/' so standard URL parsing treats it as root-relative.
    if (baseSubdir && (trimmed.startsWith(`${baseSubdir}/`) || trimmed === baseSubdir)) {
      trimmed = '/' + trimmed;
    }

    let parsed;
    // Check if trimmed is already an absolute URL with scheme
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
      parsed = new URL(trimmed);
      // Strictly enforce same-origin constraint
      if (parsed.origin !== baseUrl.origin) {
        return 'index.html';
      }
    } else if (trimmed.startsWith('/')) {
      // Root-relative path
      // If deployed in a project subpath (e.g. /WebLearnChinese/), check if input already includes it.
      if (basePath !== '/') {
        if (trimmed.startsWith(basePath)) {
          parsed = new URL(trimmed, baseUrl.origin);
        } else {
          // e.g. trimmed is '/vocabulary.html' -> map into app base directory: '/WebLearnChinese/vocabulary.html'
          const relativePart = trimmed.replace(/^\/+/, '');
          parsed = new URL(relativePart, baseUrl);
        }
      } else {
        parsed = new URL(trimmed, baseUrl.origin);
      }
    } else {
      // Relative path (e.g. 'vocabulary.html', './vocabulary.html')
      parsed = new URL(trimmed, baseUrl);
    }

    // Defense against directory traversal out of app base path:
    // parsed.pathname MUST start with baseUrl.pathname
    if (!parsed.pathname.startsWith(baseUrl.pathname)) {
      return 'index.html';
    }

    // Extract app-relative file path by stripping baseUrl.pathname prefix
    let relativePath = parsed.pathname.slice(baseUrl.pathname.length);

    // If empty or points to directory root or login.html, fallback to index.html
    if (!relativePath || relativePath === 'login.html') {
      relativePath = 'index.html';
    }

    // Preserve valid search and hash
    return `${relativePath}${parsed.search}${parsed.hash}`;
  } catch (_) {
    return 'index.html';
  }
}

/**
 * Validates Login Form inputs client-side.
 * 
 * @param {string} emailOrPhone 
 * @param {string} password 
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateLoginForm(emailOrPhone, password) {
  const errors = {};

  const cleanEmail = (emailOrPhone || '').trim();
  if (!cleanEmail) {
    errors.emailOrPhone = 'Vui lòng nhập email hoặc số điện thoại.';
  } else if (cleanEmail.length > 191) {
    errors.emailOrPhone = 'Email hoặc số điện thoại không được vượt quá 191 ký tự.';
  }

  const cleanPassword = password || '';
  if (!cleanPassword) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates Registration Form inputs client-side.
 * Matches backend RegisterRequest constraints:
 * - fullName: 1..100
 * - emailOrPhone: 1..191
 * - password: 6..100
 * 
 * @param {string} fullName 
 * @param {string} emailOrPhone 
 * @param {string} password 
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateRegisterForm(fullName, emailOrPhone, password) {
  const errors = {};

  const cleanName = (fullName || '').trim();
  if (!cleanName) {
    errors.fullName = 'Vui lòng nhập họ và tên.';
  } else if (cleanName.length > 100) {
    errors.fullName = 'Họ và tên không được vượt quá 100 ký tự.';
  }

  const cleanEmail = (emailOrPhone || '').trim();
  if (!cleanEmail) {
    errors.emailOrPhone = 'Vui lòng nhập email hoặc số điện thoại.';
  } else if (cleanEmail.length > 191) {
    errors.emailOrPhone = 'Email hoặc số điện thoại không được vượt quá 191 ký tự.';
  }

  const cleanPassword = password || '';
  if (!cleanPassword) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  } else if (cleanPassword.length < 6) {
    errors.password = 'Mật khẩu phải có tối thiểu 6 ký tự.';
  } else if (cleanPassword.length > 100) {
    errors.password = 'Mật khẩu không được vượt quá 100 ký tự.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Clears form validation feedback and resets accessibility attributes.
 * 
 * @param {HTMLFormElement} form 
 * @param {HTMLElement|null} globalAlert 
 */
function clearFormErrors(form, globalAlert) {
  if (!form) return;

  const inputs = form.querySelectorAll('input');
  inputs.forEach(input => {
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
  });

  const feedbacks = form.querySelectorAll('.invalid-feedback');
  feedbacks.forEach(fb => {
    fb.textContent = '';
    fb.classList.add('d-none');
  });

  if (globalAlert) {
    globalAlert.textContent = '';
    globalAlert.className = 'alert alert-danger d-none mb-3';
  }
}

/**
 * Displays field-level validation feedback with WCAG-compliant attributes.
 * 
 * @param {HTMLInputElement} inputEl 
 * @param {HTMLElement} errorEl 
 * @param {string} message 
 */
function setFieldError(inputEl, errorEl, message) {
  if (!inputEl || !errorEl || !message) return;
  inputEl.classList.add('is-invalid');
  inputEl.setAttribute('aria-invalid', 'true');
  errorEl.textContent = message;
  errorEl.classList.remove('d-none');
}

/**
 * Displays a global status banner inside the form card.
 * 
 * @param {HTMLElement} alertEl 
 * @param {string} message 
 * @param {string} [type='danger'] 
 */
function setGlobalAlert(alertEl, message, type = 'danger') {
  if (!alertEl || !message) return;
  alertEl.className = `alert alert-${type} mb-3`;
  alertEl.setAttribute('role', type === 'danger' ? 'alert' : 'status');
  alertEl.setAttribute('aria-live', type === 'danger' ? 'assertive' : 'polite');
  alertEl.textContent = message;
  alertEl.classList.remove('d-none');
}

/**
 * Updates button UI during asynchronous operations.
 * 
 * @param {HTMLButtonElement} button 
 * @param {boolean} isLoading 
 * @param {string} [loadingText='Đang xử lý...'] 
 */
function setButtonLoading(button, isLoading, loadingText = 'Đang xử lý...') {
  if (!button) return;
  const btnText = button.querySelector('.btn-text');
  const spinner = button.querySelector('.spinner-border');

  if (isLoading) {
    button.disabled = true;
    if (btnText) btnText.dataset.originalText = btnText.textContent;
    if (btnText) btnText.textContent = loadingText;
    if (spinner) spinner.classList.remove('d-none');
  } else {
    button.disabled = false;
    if (btnText && btnText.dataset.originalText) {
      btnText.textContent = btnText.dataset.originalText;
    }
    if (spinner) spinner.classList.add('d-none');
  }
}

/**
 * Initializes the Login Form controller.
 */
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const emailError = document.getElementById('loginEmailError');
  const passwordError = document.getElementById('loginPasswordError');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const globalAlert = document.getElementById('loginGlobalAlert');
  const statusNotice = document.getElementById('loginStatusNotice');

  // Check URL parameters for contextual messages
  if (typeof window !== 'undefined' && window.location?.search) {
    const params = new URLSearchParams(window.location.search);

    if (params.get('expired') === 'true' && statusNotice) {
      setGlobalAlert(statusNotice, 'Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại.', 'warning');
    } else if (params.get('registered') === 'true' && statusNotice) {
      setGlobalAlert(statusNotice, 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.', 'success');
    }
  }

  let isSubmitting = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSubmitting) return; // Prevent double submit

    clearFormErrors(form, globalAlert);

    const emailOrPhone = emailInput?.value || '';
    const password = passwordInput?.value || '';

    // Client-side validation
    const validation = validateLoginForm(emailOrPhone, password);
    if (!validation.isValid) {
      if (validation.errors.emailOrPhone && emailInput && emailError) {
        setFieldError(emailInput, emailError, validation.errors.emailOrPhone);
      }
      if (validation.errors.password && passwordInput && passwordError) {
        setFieldError(passwordInput, passwordError, validation.errors.password);
      }

      // Focus first invalid field
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    isSubmitting = true;
    setButtonLoading(submitBtn, true, 'Đang đăng nhập...');

    try {
      const authData = await apiClient('/auth/login', {
        method: 'POST',
        body: {
          emailOrPhone: emailOrPhone.trim(),
          password: password
        }
      });

      // Synchronize session state via authManager
      authManager.setSession(authData);

      // Handle safe redirect
      const urlParams = new URLSearchParams(window.location.search);
      const target = validateInternalRedirect(urlParams.get('redirect'));
      window.location.href = target;

    } catch (err) {
      isSubmitting = false;
      setButtonLoading(submitBtn, false);

      if (err instanceof ApiError) {
        if (err.status === 401) {
          setGlobalAlert(globalAlert, 'Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại email/số điện thoại hoặc mật khẩu.');
          if (passwordInput) passwordInput.focus();
        } else if (err.status === 429) {
          setGlobalAlert(globalAlert, 'Bạn đã gửi quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau ít phút.');
        } else if (err.status === 400) {
          const fieldErrors = parseFieldErrors(err.errors);
          if (fieldErrors.emailOrPhone && emailInput && emailError) {
            setFieldError(emailInput, emailError, fieldErrors.emailOrPhone);
          }
          if (fieldErrors.password && passwordInput && passwordError) {
            setFieldError(passwordInput, passwordError, fieldErrors.password);
          }
          setGlobalAlert(globalAlert, err.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
        } else if (err.status === 0 || err.code === 'NETWORK_ERROR') {
          setGlobalAlert(globalAlert, 'Không thể kết nối đến máy chủ backend. Vui lòng kiểm tra trạng thái máy chủ.');
        } else if (err.status === 408 || err.code === 'TIMEOUT') {
          setGlobalAlert(globalAlert, 'Yêu cầu đăng nhập hết thời gian chờ (Timeout). Vui lòng thử lại.');
        } else if (err.status === 404 || err.code === 'NOT_FOUND') {
          setGlobalAlert(globalAlert, 'Không tìm thấy dịch vụ đăng nhập (404). Vui lòng kiểm tra cấu hình máy chủ.');
        } else {
          setGlobalAlert(globalAlert, 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.');
        }
      } else {
        setGlobalAlert(globalAlert, 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.');
      }
    }
  });
}

/**
 * Initializes the Register Form controller.
 */
function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const fullNameInput = document.getElementById('regFullName');
  const emailInput = document.getElementById('regEmail');
  const passwordInput = document.getElementById('regPassword');
  const fullNameError = document.getElementById('regFullNameError');
  const emailError = document.getElementById('regEmailError');
  const passwordError = document.getElementById('regPasswordError');
  const submitBtn = document.getElementById('registerSubmitBtn');
  const globalAlert = document.getElementById('registerGlobalAlert');

  let isSubmitting = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSubmitting) return; // Anti double-submit

    clearFormErrors(form, globalAlert);

    const fullName = fullNameInput?.value || '';
    const emailOrPhone = emailInput?.value || '';
    const password = passwordInput?.value || '';

    // Client-side validation
    const validation = validateRegisterForm(fullName, emailOrPhone, password);
    if (!validation.isValid) {
      if (validation.errors.fullName && fullNameInput && fullNameError) {
        setFieldError(fullNameInput, fullNameError, validation.errors.fullName);
      }
      if (validation.errors.emailOrPhone && emailInput && emailError) {
        setFieldError(emailInput, emailError, validation.errors.emailOrPhone);
      }
      if (validation.errors.password && passwordInput && passwordError) {
        setFieldError(passwordInput, passwordError, validation.errors.password);
      }

      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    isSubmitting = true;
    setButtonLoading(submitBtn, true, 'Đang tạo tài khoản...');

    try {
      await apiClient('/auth/register', {
        method: 'POST',
        body: {
          fullName: fullName.trim(),
          emailOrPhone: emailOrPhone.trim(),
          password: password
        }
      });

      // On successful registration, redirect to login with success indicator
      window.location.href = 'login.html?registered=true';

    } catch (err) {
      isSubmitting = false;
      setButtonLoading(submitBtn, false);

      if (err instanceof ApiError) {
        if (err.status === 409) {
          // Conflict: email/phone already registered
          if (emailInput && emailError) {
            setFieldError(emailInput, emailError, 'Email hoặc số điện thoại này đã được sử dụng.');
            emailInput.focus();
          }
          setGlobalAlert(globalAlert, 'Email hoặc số điện thoại này đã được sử dụng. Vui lòng chọn tài khoản khác hoặc đăng nhập.');
        } else if (err.status === 400) {
          const fieldErrors = parseFieldErrors(err.errors);
          if (fieldErrors.fullName && fullNameInput && fullNameError) {
            setFieldError(fullNameInput, fullNameError, fieldErrors.fullName);
          }
          if (fieldErrors.emailOrPhone && emailInput && emailError) {
            setFieldError(emailInput, emailError, fieldErrors.emailOrPhone);
          }
          if (fieldErrors.password && passwordInput && passwordError) {
            setFieldError(passwordInput, passwordError, fieldErrors.password);
          }
          setGlobalAlert(globalAlert, err.message || 'Thông tin đăng ký không hợp lệ. Vui lòng kiểm tra lại.');
        } else if (err.status === 0 || err.code === 'NETWORK_ERROR') {
          setGlobalAlert(globalAlert, 'Không thể kết nối đến máy chủ backend. Vui lòng kiểm tra trạng thái máy chủ.');
        } else if (err.status === 408 || err.code === 'TIMEOUT') {
          setGlobalAlert(globalAlert, 'Yêu cầu đăng ký hết thời gian chờ (Timeout). Vui lòng thử lại.');
        } else if (err.status === 404 || err.code === 'NOT_FOUND') {
          setGlobalAlert(globalAlert, 'Không tìm thấy dịch vụ đăng ký (404). Vui lòng kiểm tra cấu hình máy chủ.');
        } else {
          setGlobalAlert(globalAlert, 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.');
        }
      } else {
        setGlobalAlert(globalAlert, 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.');
      }
    }
  });
}

if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('DOMContentLoaded', () => {
    initNavbarAuth('navAuthContainer');
    initLoginForm();
    initRegisterForm();
  });
}
