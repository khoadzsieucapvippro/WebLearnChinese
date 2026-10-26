/**
 * =============================================================================
 * SHARED ACCESSIBLE UI PRIMITIVES
 * Primitives: 3-State UI (Loading, Empty, Error), Toast System, Modal Dialog
 * Accessibility: WCAG 2.2 AA Aligned & WAI-ARIA APG Patterns
 * =============================================================================
 */

import { createSafeElement, clearContainer } from './security.js';

/* -----------------------------------------------------------------------------
 * 1. THREE-STATE UI ENGINE (LOADING, EMPTY, ERROR)
 * ----------------------------------------------------------------------------- */

/**
 * Displays an accessible loading indicator inside the specified container.
 * 
 * @param {HTMLElement} container - target container element
 * @param {Object} [options]
 * @param {string} [options.message='Đang tải dữ liệu...'] - loading message
 */
export function showLoading(container, { message = 'Đang tải dữ liệu...' } = {}) {
  if (!container) return;
  clearContainer(container);
  container.setAttribute('aria-busy', 'true');

  const wrapper = createSafeElement('div', {
    className: 'state-container',
    attrs: { 'role': 'status', 'aria-live': 'polite' },
    children: [
      createSafeElement('div', {
        className: 'state-spinner',
        attrs: { 'aria-hidden': 'true' }
      }),
      createSafeElement('p', {
        className: 'state-loading-text',
        text: message
      })
    ]
  });

  container.appendChild(wrapper);
}

/**
 * Displays an accessible empty state inside the specified container.
 * 
 * @param {HTMLElement} container - target container element
 * @param {Object} [options]
 * @param {string} [options.glyph='空'] - decorative Chinese character for emptiness
 * @param {string} [options.title='Chưa có dữ liệu'] - empty state heading
 * @param {string} [options.description='Không tìm thấy dữ liệu nào phù hợp.'] - description text
 * @param {string} [options.actionText] - optional button label
 * @param {Function} [options.onAction] - optional button click handler
 */
export function showEmpty(container, {
  glyph = '空',
  title = 'Chưa có dữ liệu',
  description = 'Không tìm thấy dữ liệu nào phù hợp.',
  actionText = null,
  actionId = null,
  onAction = null
} = {}) {
  if (!container) return;
  clearContainer(container);
  container.removeAttribute('aria-busy');

  const children = [
    createSafeElement('div', {
      className: 'state-empty-glyph',
      attrs: { 'aria-hidden': 'true' },
      text: glyph
    }),
    createSafeElement('h3', {
      className: 'state-empty-title',
      text: title
    }),
    createSafeElement('p', {
      className: 'state-empty-desc',
      text: description
    })
  ];

  if (actionText && typeof onAction === 'function') {
    const actionAttrs = { 'type': 'button' };
    if (actionId) {
      actionAttrs.id = actionId;
    }
    const actionBtn = createSafeElement('button', {
      className: 'btn-chinese-primary',
      attrs: actionAttrs,
      text: actionText
    });
    actionBtn.addEventListener('click', onAction);
    children.push(actionBtn);
  }

  const wrapper = createSafeElement('div', {
    className: 'state-container',
    children
  });

  container.appendChild(wrapper);
}

/**
 * Displays an accessible error state with an actionable retry button inside the container.
 * 
 * @param {HTMLElement} container - target container element
 * @param {Object} [options]
 * @param {string} [options.title='Đã xảy ra lỗi'] - error title
 * @param {string} [options.message='Không thể tải dữ liệu. Vui lòng kiểm tra lại.'] - error details
 * @param {string} [options.retryText='Thử lại'] - retry button label
 * @param {Function} [options.onRetry] - retry callback function
 */
export function showError(container, {
  title = 'Đã xảy ra lỗi',
  message = 'Không thể tải dữ liệu. Vui lòng kiểm tra lại.',
  retryText = 'Thử lại',
  onRetry = null
} = {}) {
  if (!container) return;
  clearContainer(container);
  container.removeAttribute('aria-busy');

  const children = [
    createSafeElement('div', {
      className: 'state-error-icon',
      attrs: { 'aria-hidden': 'true' },
      text: '!'
    }),
    createSafeElement('h3', {
      className: 'state-error-title',
      text: title
    }),
    createSafeElement('p', {
      className: 'state-error-desc',
      text: message
    })
  ];

  if (typeof onRetry === 'function') {
    const retryBtn = createSafeElement('button', {
      className: 'btn-chinese-primary',
      attrs: { 'type': 'button' },
      text: retryText
    });
    retryBtn.addEventListener('click', onRetry);
    children.push(retryBtn);
  }

  const wrapper = createSafeElement('div', {
    className: 'state-container',
    attrs: { 'role': 'alert' },
    children
  });

  container.appendChild(wrapper);
}

/**
 * Unified 3-State UI dispatcher.
 * 
 * @param {HTMLElement} container - container element
 * @param {'LOADING'|'EMPTY'|'ERROR'|'READY'} state - target UI state
 * @param {Object} [options] - state options passed to respective helper
 */
export function setComponentState(container, state, options = {}) {
  if (!container) return;
  switch (state) {
    case 'LOADING':
      showLoading(container, options);
      break;
    case 'EMPTY':
      showEmpty(container, options);
      break;
    case 'ERROR':
      showError(container, options);
      break;
    case 'READY':
      container.removeAttribute('aria-busy');
      clearContainer(container);
      break;
    default:
      console.warn(`[UI] Unknown component state: "${state}"`);
  }
}

/* -----------------------------------------------------------------------------
 * 2. TOAST NOTIFICATION SYSTEM (WCAG 2.2 SC 4.1.3 STATUS MESSAGES)
 * ----------------------------------------------------------------------------- */

/**
 * Dispatches a non-blocking toast notification to the screen reader live region.
 * 
 * @param {Object} options
 * @param {'success'|'warning'|'danger'|'info'} [options.type='info'] - notification semantic type
 * @param {string} [options.title=''] - toast title
 * @param {string} [options.message=''] - toast body text
 * @param {number} [options.duration=4000] - auto dismiss duration in ms (0 for manual dismiss)
 */
// Track recent toasts for deduplication and spam prevention
let _lastToastKey = '';
let _lastToastTimestamp = 0;

export function showToast({
  type = 'info',
  title = '',
  message = '',
  duration = 2500
} = {}) {
  if (typeof document === 'undefined') return;

  // 1. Deduplication guard: ignore identical toast messages within 2.0s
  const toastKey = `${type}::${title}::${message}`;
  const now = Date.now();
  if (toastKey === _lastToastKey && (now - _lastToastTimestamp) < 2000) {
    return;
  }
  _lastToastKey = toastKey;
  _lastToastTimestamp = now;

  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = createSafeElement('div', {
      className: 'toast-container-custom',
      attrs: {
        'id': 'toastContainer',
        'role': 'status',
        'aria-live': 'polite',
        'aria-atomic': 'true'
      }
    });
    document.body.appendChild(toastContainer);
  }

  // 2. Strict Max Toasts constraint: keep maximum 2 toasts at any time
  const existingToasts = toastContainer.querySelectorAll('.toast-custom');
  if (existingToasts.length >= 2) {
    for (let i = 0; i <= existingToasts.length - 2; i++) {
      existingToasts[i].remove();
    }
  }

  const typeClass = `toast-${type}`;
  const toastEl = createSafeElement('div', {
    className: `toast-custom ${typeClass}`,
    children: [
      createSafeElement('div', {
        className: 'toast-content',
        children: [
          title ? createSafeElement('div', { className: 'toast-title', text: title }) : '',
          message ? createSafeElement('p', { className: 'toast-message', text: message }) : ''
        ].filter(Boolean)
      }),
      createSafeElement('button', {
        className: 'toast-close-btn',
        attrs: {
          'type': 'button',
          'aria-label': 'Đóng thông báo'
        },
        text: '✕'
      })
    ]
  });

  const closeBtn = toastEl.querySelector('.toast-close-btn');
  const dismiss = () => {
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateY(8px)';
    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, 200);
  };

  closeBtn.addEventListener('click', dismiss);

  toastContainer.appendChild(toastEl);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
}

/* -----------------------------------------------------------------------------
 * 3. ACCESSIBLE MODAL / DIALOG PRIMITIVE (WAI-ARIA APG PATTERN)
 * ----------------------------------------------------------------------------- */

/**
 * Opens an accessible confirmation or detail modal utilizing Bootstrap 5.3's modal engine.
 * Leverages native Bootstrap focus trapping and focus restoration to the trigger element.
 * 
 * @param {Object} options
 * @param {string} options.title - modal header title
 * @param {string|Node} options.body - modal body content (string or DOM Node)
 * @param {string} [options.confirmText='Xác nhận'] - primary confirmation button text
 * @param {string} [options.cancelText='Hủy'] - cancellation button text
 * @param {'primary'|'danger'|'secondary'} [options.variant='primary'] - confirmation button variant
 * @returns {Promise<boolean>} resolves to true on confirmation, false on cancellation/dismissal
 */
export function openModal({
  title,
  body,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'primary'
} = {}) {
  return new Promise((resolve) => {
    // Capture trigger element for accessible focus restoration (WCAG 2.2 APG Pattern)
    const activeElementBeforeOpen = document.activeElement;

    // Unique ID for ARIA labeling
    const modalId = `modal_${Date.now()}`;
    const titleId = `${modalId}_title`;
    const bodyId = `${modalId}_body`;

    const confirmBtnClass = variant === 'danger' ? 'btn-chinese-primary' : 'btn-chinese-primary';
    if (variant === 'danger') {
      // Use status danger styling
    }

    const modalEl = createSafeElement('div', {
      className: 'modal fade',
      attrs: {
        'id': modalId,
        'tabindex': '-1',
        'role': 'dialog',
        'aria-labelledby': titleId,
        'aria-describedby': bodyId,
        'aria-modal': 'true'
      },
      children: [
        createSafeElement('div', {
          className: 'modal-dialog modal-dialog-centered',
          children: [
            createSafeElement('div', {
              className: 'modal-content modal-content-custom',
              children: [
                // Modal Header
                createSafeElement('div', {
                  className: 'modal-header modal-header-custom',
                  children: [
                    createSafeElement('h2', {
                      className: 'h5 modal-title mb-0',
                      attrs: { 'id': titleId },
                      text: title
                    }),
                    createSafeElement('button', {
                      className: 'btn-close',
                      attrs: {
                        'type': 'button',
                        'data-bs-dismiss': 'modal',
                        'aria-label': 'Đóng hộp thoại'
                      }
                    })
                  ]
                }),
                // Modal Body
                createSafeElement('div', {
                  className: 'modal-body modal-body-custom',
                  attrs: { 'id': bodyId },
                  children: typeof body === 'string' 
                    ? [createSafeElement('p', { className: 'mb-0', text: body })]
                    : [body]
                }),
                // Modal Footer
                createSafeElement('div', {
                  className: 'modal-footer modal-footer-custom',
                  children: [
                    cancelText ? createSafeElement('button', {
                      className: 'btn-chinese-secondary',
                      attrs: {
                        'type': 'button',
                        'data-bs-dismiss': 'modal'
                      },
                      text: cancelText
                    }) : '',
                    createSafeElement('button', {
                      className: confirmBtnClass,
                      attrs: {
                        'type': 'button',
                        'id': `${modalId}_confirmBtn`
                      },
                      text: confirmText
                    })
                  ].filter(Boolean)
                })
              ]
            })
          ]
        })
      ]
    });

    document.body.appendChild(modalEl);

    // If Bootstrap JS is loaded on window
    const bsModal = window.bootstrap && typeof window.bootstrap.Modal === 'function'
      ? new window.bootstrap.Modal(modalEl, { backdrop: true, keyboard: true })
      : null;

    let userConfirmed = false;

    const confirmBtn = modalEl.querySelector(`#${modalId}_confirmBtn`);
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        userConfirmed = true;
        if (bsModal) {
          bsModal.hide();
        } else {
          cleanUp();
          resolve(true);
        }
      });
    }

    const cleanUp = () => {
      if (modalEl.parentNode) {
        modalEl.parentNode.removeChild(modalEl);
      }
    };

    if (bsModal) {
      modalEl.addEventListener('hidden.bs.modal', () => {
        cleanUp();
        if (activeElementBeforeOpen && typeof activeElementBeforeOpen.focus === 'function') {
          activeElementBeforeOpen.focus();
        }
        resolve(userConfirmed);
      });
      bsModal.show();
    } else {
      // Fallback if bootstrap bundle is not loaded
      modalEl.classList.add('show');
      modalEl.style.display = 'block';
    }
  });
}

/* -----------------------------------------------------------------------------
 * 4. STANDARDIZED ACCESSIBLE SPEECH & AUDIO TRIGGER BUTTON
 * ----------------------------------------------------------------------------- */

/**
 * Safely creates an SVG speaker icon element via createElementNS (Zero unsafe innerHTML).
 * Standardized across Vocabulary, Radicals, and SRS Review flashcard views.
 *
 * @param {number} [size=16] - icon width and height in pixels
 * @returns {SVGElement}
 */
export function createSpeakerIcon(size = 16) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');

  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', '11 5 6 9 2 9 2 15 6 15 11 19 11 5');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07');

  svg.appendChild(polygon);
  svg.appendChild(path);
  return svg;
}

/**
 * Safely creates a standardized speech/pronunciation trigger button matching Vocabulary visual contract.
 * Uses .vocab-speech-btn with SVG speaker icon (Zero unsafe innerHTML).
 *
 * @param {Object} [options]
 * @param {string} [options.id] - optional element id
 * @param {string} [options.className] - additional class names
 * @param {string} [options.ariaLabel='Phát âm'] - accessible name
 * @param {string} [options.title='Phát âm'] - tooltip title
 * @param {number} [options.iconSize=16] - SVG icon size in pixels
 * @param {Function} [options.onClick] - click handler
 * @returns {HTMLButtonElement}
 */
export function createSpeechButton({
  id = null,
  className = '',
  ariaLabel = 'Phát âm',
  title = 'Phát âm',
  iconSize = 16,
  onClick = null
} = {}) {
  const btn = createSafeElement('button', {
    className: `vocab-speech-btn ${className}`.trim(),
    attrs: {
      type: 'button',
      'aria-label': ariaLabel,
      title: title
    }
  });
  if (id) {
    btn.id = id;
  }
  btn.appendChild(createSpeakerIcon(iconSize));
  if (typeof onClick === 'function') {
    btn.addEventListener('click', onClick);
  }
  return btn;
}


/**
 * Attaches accessible show/hide password toggle behavior to a button and input.
 * Supports both mouse and keyboard accessibility (WCAG 2.2 SC 4.1.2).
 * 
 * @param {HTMLButtonElement|null} buttonEl - toggle trigger button
 * @param {HTMLInputElement|null} inputEl - target password input
 */
export function setupPasswordToggle(buttonEl, inputEl) {
  if (!buttonEl || !inputEl) return;

  buttonEl.addEventListener('click', () => {
    const isPassword = inputEl.type === 'password';
    inputEl.type = isPassword ? 'text' : 'password';

    const eyeIcon = buttonEl.querySelector('.eye-icon');
    const eyeOffIcon = buttonEl.querySelector('.eye-off-icon');

    if (eyeIcon && eyeOffIcon) {
      if (isPassword) {
        eyeIcon.classList.add('d-none');
        eyeOffIcon.classList.remove('d-none');
      } else {
        eyeIcon.classList.remove('d-none');
        eyeOffIcon.classList.add('d-none');
      }
    }

    const label = isPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu';
    buttonEl.setAttribute('aria-label', label);
    buttonEl.setAttribute('title', label);
  });
}

// Re-export speech synthesis primitives from centralized speech controller
export {
  SpeechState,
  isSpeechSynthesisAvailable,
  speechController,
  speakHanzi,
  playPronunciation
} from './speech.js';
