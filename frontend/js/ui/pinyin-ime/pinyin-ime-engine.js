/**
 * =============================================================================
 * CHINESE PINYIN VIRTUAL KEYBOARD & IME CONTROLLER
 * Module: frontend/js/ui/pinyin-ime/pinyin-ime-engine.js
 *
 * Implements:
 * - Dual Physical & Virtual Pinyin IME typing on HTMLInputElement.
 * - Non-intrusive OS IME handling: respects compositionstart/update/end and KeyboardEvent.isComposing.
 * - Standard QWERTY Virtual Keyboard with candidates strip.
 * - Number shortcut candidate selection (1..9), Space, Enter, Backspace, Arrow navigation.
 * - Strict DOM Safety: Pure createElement/textContent/replaceChildren (Zero innerHTML).
 * - Responsive layout adaptation (fits <= 375px mobile without overflow).
 * =============================================================================
 */

import { lookupPinyin, cleanPinyin } from './pinyin-dict.js';

export const PAGE_SIZE = 5;

export class PinyinImeComponent {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.containerMount Target DOM element to render candidates & keyboard
   * @param {HTMLInputElement} options.targetInput Input element receiving Chinese characters
   * @param {Function} [options.onCommit] Callback when candidate is committed: (char) => void
   * @param {Function} [options.onSubmit] Callback when Enter is pressed with empty buffer: () => void
   */
  constructor(options = {}) {
    this.containerMount = options.containerMount;
    this.targetInput = options.targetInput;
    this.onCommit = options.onCommit || null;
    this.onSubmit = options.onSubmit || null;

    this.compositionBuffer = '';
    this.candidates = [];
    this.currentPage = 0;
    this.selectedIndex = 0;
    this.isOsComposing = false;
    this.isKeyboardVisible = true;

    // Bound listeners for clean destruction
    this.handleInputKeydown = this.onInputKeydown.bind(this);
    this.handleBeforeInput = this.onBeforeInput.bind(this);
    this.handleInputEvent = this.onInputEvent.bind(this);
    this.handleCompositionStart = this.onCompositionStart.bind(this);
    this.handleCompositionUpdate = this.onCompositionUpdate.bind(this);
    this.handleCompositionEnd = this.onCompositionEnd.bind(this);

    this.dom = {
      wrapper: null,
      candidatesBar: null,
      bufferDisplay: null,
      candidatesList: null,
      prevPageBtn: null,
      nextPageBtn: null,
      keyboardWrapper: null,
      toggleBtn: null
    };

    if (this.containerMount && this.targetInput) {
      this.mount();
    }
  }

  /**
   * Mounts component and attaches input listeners.
   */
  mount() {
    this.render();
    this.attachInputListeners();
  }

  /**
   * Attaches physical keyboard, input, & composition listeners to targetInput.
   */
  attachInputListeners() {
    if (!this.targetInput) return;
    this.targetInput.addEventListener('keydown', this.handleInputKeydown);
    this.targetInput.addEventListener('beforeinput', this.handleBeforeInput);
    this.targetInput.addEventListener('input', this.handleInputEvent);
    this.targetInput.addEventListener('compositionstart', this.handleCompositionStart);
    this.targetInput.addEventListener('compositionupdate', this.handleCompositionUpdate);
    this.targetInput.addEventListener('compositionend', this.handleCompositionEnd);
  }

  /**
   * Removes input listeners.
   */
  detachInputListeners() {
    if (!this.targetInput) return;
    this.targetInput.removeEventListener('keydown', this.handleInputKeydown);
    this.targetInput.removeEventListener('beforeinput', this.handleBeforeInput);
    this.targetInput.removeEventListener('input', this.handleInputEvent);
    this.targetInput.removeEventListener('compositionstart', this.handleCompositionStart);
    this.targetInput.removeEventListener('compositionupdate', this.handleCompositionUpdate);
    this.targetInput.removeEventListener('compositionend', this.handleCompositionEnd);
  }

  /**
   * Modern mobile/desktop beforeinput handler.
   * @param {InputEvent} e
   */
  onBeforeInput(e) {
    if (this.targetInput?.disabled) return;
    // Let OS IME proceed without interference
    if (this.isOsComposing || e?.isComposing) {
      return;
    }
  }

  /**
   * Unified input event handler.
   * Handles direct mobile OS keyboard entry, IME candidate selection, and Latin fallback.
   * @param {InputEvent} e
   */
  onInputEvent(e) {
    if (this.targetInput?.disabled) return;

    // 1. If OS IME is actively composing (e.g. typing in Gboard / iOS Chinese IME),
    // do not interfere with the native composition session
    if (this.isOsComposing || e?.isComposing) {
      return;
    }

    const val = this.targetInput?.value || '';

    // 2. If the input contains Chinese characters, clear any leftover virtual composition buffer
    // because user has successfully entered Hanzi via OS IME / handwriting / voice / paste
    if (/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u2E80-\u2EFF]/.test(val)) {
      if (this.compositionBuffer.length > 0) {
        this.clearBuffer();
      }
      if (typeof this.onCommit === 'function') {
        this.onCommit(val);
      }
      return;
    }

    // 3. Mobile Latin fallback: When typing on mobile software keyboard without native Chinese IME
    // (Android keyCode 229 or unintercepted a-z input), extract Latin characters and populate candidate strip
    if (/^[a-zA-Z\s]+$/.test(val)) {
      const clean = cleanPinyin(val);
      if (clean !== this.compositionBuffer) {
        this.compositionBuffer = clean;
        this.currentPage = 0;
        this.selectedIndex = 0;
        this.refreshCandidates();
      }
    } else if (!val && this.compositionBuffer.length > 0) {
      // Input was cleared externally
      this.clearBuffer();
    }
  }

  onCompositionStart() {
    this.isOsComposing = true;
    this.clearBuffer();
  }

  onCompositionUpdate() {
    this.isOsComposing = true;
  }

  onCompositionEnd(e) {
    this.isOsComposing = false;
    this.clearBuffer();
    if (typeof this.onCommit === 'function' && e?.data) {
      this.onCommit(e.data);
    }
  }

  /**
   * Physical keyboard event handler on the target input element.
   * @param {KeyboardEvent} e
   */
  onInputKeydown(e) {
    if (this.targetInput?.disabled) return;
    // 1. If OS IME is active, do not intercept
    if (this.isOsComposing || e.isComposing || e.keyCode === 229) {
      return;
    }

    const key = e.key;

    // 2. Alphabetic keys a-z
    if (/^[a-zA-Z]$/.test(key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      this.appendBufferChar(key.toLowerCase());
      return;
    }

    // 3. Buffer is active: handle candidate shortcuts & navigation
    if (this.compositionBuffer.length > 0) {
      // Number selection: 1..PAGE_SIZE
      if (/^[1-9]$/.test(key)) {
        const num = parseInt(key, 10);
        const pageStart = this.currentPage * PAGE_SIZE;
        const targetCandidateIndex = pageStart + (num - 1);
        if (targetCandidateIndex < this.candidates.length) {
          e.preventDefault();
          this.commitCandidate(this.candidates[targetCandidateIndex]);
          return;
        }
      }

      // Space: commit currently highlighted candidate (default: first on page)
      if (key === ' ' || e.code === 'Space') {
        e.preventDefault();
        const candidate = this.getCurrentHighlightedCandidate();
        if (candidate) {
          this.commitCandidate(candidate);
        } else {
          this.clearBuffer();
        }
        return;
      }

      // Enter: commit current candidate or raw buffer
      if (key === 'Enter') {
        e.preventDefault();
        const candidate = this.getCurrentHighlightedCandidate();
        if (candidate) {
          this.commitCandidate(candidate);
        } else {
          this.clearBuffer();
        }
        return;
      }

      // Backspace: delete character from buffer
      if (key === 'Backspace') {
        e.preventDefault();
        this.popBufferChar();
        return;
      }

      // Arrow keys: candidate navigation
      if (key === 'ArrowRight' || key === 'ArrowDown') {
        e.preventDefault();
        this.selectNextCandidate();
        return;
      }
      if (key === 'ArrowLeft' || key === 'ArrowUp') {
        e.preventDefault();
        this.selectPrevCandidate();
        return;
      }

      // Escape: discard composition buffer
      if (key === 'Escape') {
        e.preventDefault();
        this.clearBuffer();
        return;
      }
    } else {
      // 4. Buffer is empty: Enter triggers submission ONLY when not composing with OS IME
      if (key === 'Enter') {
        if (!this.isOsComposing && !e.isComposing && e.keyCode !== 229 && typeof this.onSubmit === 'function') {
          e.preventDefault();
          this.onSubmit();
        }
      }
    }
  }

  /**
   * Appends character to composition buffer and refreshes candidates.
   * @param {string} ch
   */
  appendBufferChar(ch) {
    if (this.targetInput?.disabled) return;
    this.compositionBuffer += ch;
    this.currentPage = 0;
    this.selectedIndex = 0;
    this.refreshCandidates();
  }

  /**
   * Pops last character from composition buffer.
   */
  popBufferChar() {
    if (this.targetInput?.disabled) return;
    if (this.compositionBuffer.length > 0) {
      this.compositionBuffer = this.compositionBuffer.slice(0, -1);
      this.currentPage = 0;
      this.selectedIndex = 0;
      this.refreshCandidates();
    }
  }

  /**
   * Clears composition buffer and candidates.
   */
  clearBuffer() {
    this.compositionBuffer = '';
    this.candidates = [];
    this.currentPage = 0;
    this.selectedIndex = 0;
    this.updateCandidatesView();
  }

  /**
   * Refreshes candidate list based on current buffer.
   */
  refreshCandidates() {
    if (!this.compositionBuffer) {
      this.candidates = [];
    } else {
      this.candidates = lookupPinyin(this.compositionBuffer, 25);
    }
    this.updateCandidatesView();
  }

  /**
   * Gets currently highlighted candidate.
   * @returns {string|null}
   */
  getCurrentHighlightedCandidate() {
    if (!this.candidates || this.candidates.length === 0) return null;
    const pageStart = this.currentPage * PAGE_SIZE;
    const index = pageStart + this.selectedIndex;
    return this.candidates[index] || this.candidates[pageStart] || null;
  }

  /**
   * Moves selection to next candidate.
   */
  selectNextCandidate() {
    const pageStart = this.currentPage * PAGE_SIZE;
    const pageItemsCount = Math.min(PAGE_SIZE, this.candidates.length - pageStart);
    if (this.selectedIndex + 1 < pageItemsCount) {
      this.selectedIndex++;
      this.updateCandidatesView();
    } else if ((this.currentPage + 1) * PAGE_SIZE < this.candidates.length) {
      this.currentPage++;
      this.selectedIndex = 0;
      this.updateCandidatesView();
    }
  }

  /**
   * Moves selection to previous candidate.
   */
  selectPrevCandidate() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.updateCandidatesView();
    } else if (this.currentPage > 0) {
      this.currentPage--;
      this.selectedIndex = Math.min(PAGE_SIZE, this.candidates.length - this.currentPage * PAGE_SIZE) - 1;
      this.updateCandidatesView();
    }
  }

  /**
   * Commits chosen candidate into target input.
   * @param {string} candidate
   */
  commitCandidate(candidate) {
    if (!candidate || !this.targetInput || this.targetInput.disabled) return;

    const input = this.targetInput;
    const val = input.value;

    // If input consists purely of Latin characters matching current composition buffer (mobile Latin fallback),
    // replace the Latin buffer with the chosen Chinese candidate
    if (this.compositionBuffer && /^[a-zA-Z\s]+$/.test(val)) {
      input.value = candidate;
      const newCursor = candidate.length;
      if (typeof input.setSelectionRange === 'function') {
        input.setSelectionRange(newCursor, newCursor);
      }
    } else {
      const start = input.selectionStart ?? val.length;
      const end = input.selectionEnd ?? val.length;

      let before = val.slice(0, start);
      const after = val.slice(end);

      // If text directly preceding cursor ends with current composition buffer, strip the buffer
      if (this.compositionBuffer && before.toLowerCase().endsWith(this.compositionBuffer.toLowerCase())) {
        before = before.slice(0, before.length - this.compositionBuffer.length);
      }

      input.value = before + candidate + after;

      const newCursor = before.length + candidate.length;
      if (typeof input.setSelectionRange === 'function') {
        input.setSelectionRange(newCursor, newCursor);
      }
    }

    this.clearBuffer();

    // Trigger standard input event on input element
    input.dispatchEvent(new Event('input', { bubbles: true }));

    if (typeof this.onCommit === 'function') {
      this.onCommit(candidate);
    }

    // Keep focus on input
    try {
      input.focus();
    } catch (e) {}
  }

  /**
   * Renders the complete DOM structure using createElement & DOM APIs.
   */
  render() {
    if (!this.containerMount) return;
    this.containerMount.replaceChildren();

    const wrapper = document.createElement('div');
    wrapper.className = 'pinyin-ime-wrapper d-flex flex-column align-items-center w-100';

    // 1. Candidate Strip (Hàng ứng viên)
    const candidatesBar = document.createElement('div');
    candidatesBar.className = 'pinyin-candidates-bar w-100 d-flex align-items-center justify-content-between px-2 py-1 mb-2';
    candidatesBar.setAttribute('role', 'region');
    candidatesBar.setAttribute('aria-label', 'Hàng ứng viên chữ Hán');

    // Buffer indicator
    const bufferDisplay = document.createElement('div');
    bufferDisplay.id = 'pinyinBufferDisplay';
    bufferDisplay.className = 'pinyin-buffer-display me-2 text-nowrap fw-semibold small';
    bufferDisplay.textContent = '';
    candidatesBar.appendChild(bufferDisplay);

    // Candidates list container
    const candidatesList = document.createElement('div');
    candidatesList.id = 'pinyinCandidatesList';
    candidatesList.className = 'pinyin-candidates-list d-flex align-items-center gap-1 flex-grow-1 overflow-x-auto';
    candidatesBar.appendChild(candidatesList);

    // Pagination controls
    const navControls = document.createElement('div');
    navControls.className = 'pinyin-candidates-nav d-flex align-items-center gap-1 ms-1';

    const prevPageBtn = document.createElement('button');
    prevPageBtn.type = 'button';
    prevPageBtn.className = 'btn btn-sm btn-outline-secondary py-0 px-2 pinyin-page-btn d-none';
    prevPageBtn.setAttribute('aria-label', 'Trang trước');
    prevPageBtn.textContent = '◀';
    prevPageBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.currentPage > 0) {
        this.currentPage--;
        this.selectedIndex = 0;
        this.updateCandidatesView();
      }
    });

    const nextPageBtn = document.createElement('button');
    nextPageBtn.type = 'button';
    nextPageBtn.className = 'btn btn-sm btn-outline-secondary py-0 px-2 pinyin-page-btn d-none';
    nextPageBtn.setAttribute('aria-label', 'Trang sau');
    nextPageBtn.textContent = '▶';
    nextPageBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if ((this.currentPage + 1) * PAGE_SIZE < this.candidates.length) {
        this.currentPage++;
        this.selectedIndex = 0;
        this.updateCandidatesView();
      }
    });

    navControls.appendChild(prevPageBtn);
    navControls.appendChild(nextPageBtn);
    candidatesBar.appendChild(navControls);

    wrapper.appendChild(candidatesBar);

    // 2. Virtual Keyboard Container
    const keyboardWrapper = document.createElement('div');
    keyboardWrapper.className = 'pinyin-virtual-keyboard w-100';

    this.renderKeyboardKeys(keyboardWrapper);
    wrapper.appendChild(keyboardWrapper);

    // 3. Keyboard Visibility Toggle Bar
    const toggleBar = document.createElement('div');
    toggleBar.className = 'd-flex justify-content-end w-100 mt-1';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn btn-sm btn-link text-decoration-none text-muted py-0 px-1 small btn-toggle-pinyin-keyboard';
    toggleBtn.textContent = '⌨️ Ẩn bàn phím';
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.addEventListener('click', () => {
      this.toggleKeyboardVisibility();
    });

    toggleBar.appendChild(toggleBtn);
    wrapper.appendChild(toggleBar);

    this.containerMount.appendChild(wrapper);

    this.dom = {
      wrapper,
      candidatesBar,
      bufferDisplay,
      candidatesList,
      prevPageBtn,
      nextPageBtn,
      keyboardWrapper,
      toggleBtn
    };

    this.updateCandidatesView();
  }

  /**
   * Toggles virtual keyboard visibility.
   */
  toggleKeyboardVisibility() {
    this.isKeyboardVisible = !this.isKeyboardVisible;
    if (this.dom.keyboardWrapper) {
      this.dom.keyboardWrapper.classList.toggle('d-none', !this.isKeyboardVisible);
    }
    if (this.dom.toggleBtn) {
      this.dom.toggleBtn.textContent = this.isKeyboardVisible ? '⌨️ Ẩn bàn phím' : '⌨️ Hiện bàn phím';
      this.dom.toggleBtn.setAttribute('aria-expanded', this.isKeyboardVisible ? 'true' : 'false');
    }
  }

  /**
   * Renders the 4 rows of virtual keyboard keys.
   * @param {HTMLElement} mountEl
   */
  renderKeyboardKeys(mountEl) {
    mountEl.replaceChildren();

    const rows = [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
      ['clear', 'space', 'submit']
    ];

    rows.forEach((rowKeys, rowIdx) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'pinyin-key-row d-flex justify-content-center gap-1 mb-1';

      rowKeys.forEach(k => {
        const keyBtn = document.createElement('button');
        keyBtn.type = 'button';

        if (k === 'backspace') {
          keyBtn.className = 'btn btn-chinese-secondary pinyin-key pinyin-key-action pinyin-key-backspace';
          keyBtn.textContent = '⌫';
          keyBtn.setAttribute('aria-label', 'Xóa ký tự');
          keyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.targetInput?.disabled) return;
            if (this.compositionBuffer.length > 0) {
              this.popBufferChar();
            } else if (this.targetInput && this.targetInput.value.length > 0) {
              const val = this.targetInput.value;
              const start = this.targetInput.selectionStart ?? val.length;
              if (start > 0) {
                this.targetInput.value = val.slice(0, start - 1) + val.slice(start);
                const pos = start - 1;
                this.targetInput.setSelectionRange(pos, pos);
                this.targetInput.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
          });
        } else if (k === 'clear') {
          keyBtn.className = 'btn btn-chinese-secondary pinyin-key pinyin-key-action pinyin-key-clear';
          keyBtn.textContent = 'Xóa hết';
          keyBtn.setAttribute('aria-label', 'Xóa toàn bộ đáp án');
          keyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.targetInput?.disabled) return;
            this.clearBuffer();
            if (this.targetInput) {
              this.targetInput.value = '';
              this.targetInput.dispatchEvent(new Event('input', { bubbles: true }));
              try { this.targetInput.focus(); } catch (err) {}
            }
          });
        } else if (k === 'space') {
          keyBtn.className = 'btn btn-chinese-secondary pinyin-key pinyin-key-space';
          keyBtn.textContent = 'Dấu cách';
          keyBtn.setAttribute('aria-label', 'Khoảng trắng / Chọn từ');
          keyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.targetInput?.disabled) return;
            if (this.compositionBuffer.length > 0) {
              const candidate = this.getCurrentHighlightedCandidate();
              if (candidate) this.commitCandidate(candidate);
            } else if (this.targetInput) {
              const val = this.targetInput.value;
              const start = this.targetInput.selectionStart ?? val.length;
              this.targetInput.value = val.slice(0, start) + ' ' + val.slice(start);
              const pos = start + 1;
              this.targetInput.setSelectionRange(pos, pos);
              this.targetInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });
        } else if (k === 'submit') {
          keyBtn.className = 'btn btn-chinese-secondary pinyin-key pinyin-key-action pinyin-key-submit';
          keyBtn.textContent = 'Enter ↵';
          keyBtn.setAttribute('aria-label', 'Phím Enter xác nhận đáp án');
          keyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.compositionBuffer.length > 0 && !this.targetInput?.disabled) {
              const candidate = this.getCurrentHighlightedCandidate();
              if (candidate) this.commitCandidate(candidate);
            } else if (typeof this.onSubmit === 'function') {
              this.onSubmit();
            }
          });
        } else {
          // Standard character key
          keyBtn.className = 'btn btn-chinese-secondary pinyin-key pinyin-key-letter';
          keyBtn.textContent = k;
          keyBtn.setAttribute('data-key', k);
          keyBtn.setAttribute('aria-label', `Phím ${k}`);
          keyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.targetInput?.disabled) return;
            this.appendBufferChar(k);
          });
        }

        rowEl.appendChild(keyBtn);
      });

      mountEl.appendChild(rowEl);
    });
  }

  /**
   * Updates candidates strip and buffer indicator based on state.
   */
  updateCandidatesView() {
    if (!this.dom.candidatesList || !this.dom.bufferDisplay) return;

    this.dom.candidatesList.replaceChildren();

    if (this.compositionBuffer.length === 0) {
      this.dom.bufferDisplay.textContent = '';
      this.dom.bufferDisplay.classList.add('d-none');

      const placeholder = document.createElement('span');
      placeholder.className = 'text-muted small fst-italic';
      placeholder.textContent = 'Gõ Pinyin hoặc bấm phím ảo để chọn chữ Hán...';
      this.dom.candidatesList.appendChild(placeholder);

      if (this.dom.prevPageBtn) this.dom.prevPageBtn.classList.add('d-none');
      if (this.dom.nextPageBtn) this.dom.nextPageBtn.classList.add('d-none');
      return;
    }

    // Active buffer
    this.dom.bufferDisplay.classList.remove('d-none');
    this.dom.bufferDisplay.textContent = `拼: ${this.compositionBuffer}`;

    const totalPages = Math.ceil(this.candidates.length / PAGE_SIZE) || 1;
    this.currentPage = Math.max(0, Math.min(this.currentPage, totalPages - 1));

    const start = this.currentPage * PAGE_SIZE;
    const pageCandidates = this.candidates.slice(start, start + PAGE_SIZE);

    if (pageCandidates.length === 0) {
      const noMatch = document.createElement('span');
      noMatch.className = 'text-muted small fst-italic';
      noMatch.textContent = 'Không tìm thấy ứng viên chữ Hán';
      this.dom.candidatesList.appendChild(noMatch);
    } else {
      pageCandidates.forEach((candidate, idx) => {
        const itemBtn = document.createElement('button');
        itemBtn.type = 'button';
        itemBtn.id = `pinyinCandidate-${idx}`;
        const isSelected = idx === this.selectedIndex;
        itemBtn.className = `btn btn-sm pinyin-candidate-item text-nowrap d-inline-flex align-items-center ${
          isSelected ? 'is-selected' : ''
        }`;
        itemBtn.setAttribute('data-candidate', candidate);
        itemBtn.setAttribute('data-index', String(idx));
        itemBtn.setAttribute('aria-label', `Ứng viên ${idx + 1}: ${candidate}`);

        const numSpan = document.createElement('span');
        numSpan.className = 'candidate-num me-1 opacity-75';
        numSpan.textContent = `${idx + 1}.`;

        const textSpan = document.createElement('span');
        textSpan.className = 'candidate-hanzi font-hanzi fw-bold';
        textSpan.textContent = candidate;

        itemBtn.appendChild(numSpan);
        itemBtn.appendChild(textSpan);

        itemBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.commitCandidate(candidate);
        });

        this.dom.candidatesList.appendChild(itemBtn);
      });
    }

    // Pagination controls
    if (this.dom.prevPageBtn) {
      const showPrev = this.currentPage > 0;
      this.dom.prevPageBtn.classList.toggle('d-none', !showPrev);
      this.dom.prevPageBtn.disabled = !showPrev;
    }
    if (this.dom.nextPageBtn) {
      const showNext = (this.currentPage + 1) * PAGE_SIZE < this.candidates.length;
      this.dom.nextPageBtn.classList.toggle('d-none', !showNext);
      this.dom.nextPageBtn.disabled = !showNext;
    }
  }

  /**
   * Cleans up component and removes listeners.
   */
  destroy() {
    this.detachInputListeners();
    if (this.containerMount) {
      this.containerMount.replaceChildren();
    }
    this.compositionBuffer = '';
    this.candidates = [];
  }
}
