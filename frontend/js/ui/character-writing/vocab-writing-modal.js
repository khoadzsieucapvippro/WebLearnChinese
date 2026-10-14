/**
 * =============================================================================
 * VOCABULARY WRITING MODAL CONTROLLER
 * Module: frontend/js/ui/character-writing/vocab-writing-modal.js
 *
 * Responsibilities:
 * - Standalone contextual modal for Chinese vocabulary writing practice.
 * - Reusable across lesson-detail.html, vocabulary.html, and srs-review.html.
 * - Lazy creation of native <dialog id="vocabWritingModal"> with zero memory overhead.
 * - Full WCAG 2.2 APG Dialog Pattern (Escape key dismissal, backdrop click, focus restore).
 * - Mounts VocabWritingOrchestrator and tears it down cleanly on modal close.
 * - 100% Safe DOM construction (zero innerHTML sinks).
 * =============================================================================
 */

import { VocabWritingOrchestrator, WRITING_MODES } from './vocab-writing-orchestrator.js';

let sharedModalInstance = null;

export class VocabWritingModalController {
  constructor() {
    this.dialog = null;
    this.orchestrator = null;
    this.triggerElement = null;
    this.elements = {};
  }

  /**
   * Ensures the <dialog id="vocabWritingModal"> element exists in the DOM.
   *
   * @returns {HTMLDialogElement}
   */
  ensureDialog() {
    if (this.dialog && document.body.contains(this.dialog)) {
      return this.dialog;
    }

    let dialog = document.getElementById('vocabWritingModal');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'vocabWritingModal';
      dialog.className = 'vocab-writing-modal border-0 rounded-4 shadow-lg p-0';
      dialog.setAttribute('aria-labelledby', 'vocabWritingModalTitle');
      dialog.style.maxWidth = 'min(92vw, 680px)';
      dialog.style.width = '100%';
      dialog.style.backgroundColor = 'var(--bg-surface, #ffffff)';
      dialog.style.color = 'var(--text-primary, #1e293b)';

      // Modal Container Box
      const box = document.createElement('div');
      box.className = 'd-flex flex-column p-3 p-md-4';

      // Header
      const header = document.createElement('div');
      header.className = 'd-flex align-items-center justify-content-between mb-3 border-bottom pb-2';

      const title = document.createElement('h2');
      title.id = 'vocabWritingModalTitle';
      title.className = 'h5 fw-bold mb-0 text-dark d-flex align-items-center gap-2';
      title.textContent = '✍️ Luyện Viết Chữ Hán';
      header.appendChild(title);

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'btn-close';
      closeBtn.setAttribute('aria-label', 'Đóng bảng luyện viết');
      closeBtn.addEventListener('click', () => this.close());
      header.appendChild(closeBtn);

      box.appendChild(header);

      // Mount container for orchestrator
      const mountContainer = document.createElement('div');
      mountContainer.id = 'vocabWritingMountContainer';
      box.appendChild(mountContainer);

      dialog.appendChild(box);
      document.body.appendChild(dialog);
    }

    this.dialog = dialog;
    this.elements.mountContainer = dialog.querySelector('#vocabWritingMountContainer');

    // Backdrop click dismiss
    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) {
        this.close();
      }
    });

    // Native cancel event (Escape key)
    this.dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      this.close();
    });

    return this.dialog;
  }

  /**
   * Opens the vocabulary writing modal.
   *
   * @param {Object} options
   * @param {Object|string} options.vocabItem - { hanzi, pinyin, meaningVi, ... }
   * @param {HTMLElement} [options.triggerElement] - Element to return focus to on close
   * @param {string} [options.initialMode='demo']
   * @returns {Promise<boolean>}
   */
  async open({ vocabItem, triggerElement = null, initialMode = WRITING_MODES.DEMO }) {
    this.triggerElement = triggerElement;
    this.ensureDialog();

    if (!this.elements.mountContainer) return false;

    // Destroy existing orchestrator session if any
    if (this.orchestrator) {
      this.orchestrator.destroy();
      this.orchestrator = null;
    }

    this.orchestrator = new VocabWritingOrchestrator({
      mountElement: this.elements.mountContainer,
      initialMode
    });

    // Open native dialog modal
    if (typeof this.dialog.showModal === 'function') {
      try {
        this.dialog.showModal();
      } catch (err) {
        // Safe fallback if already open
      }
    } else {
      this.dialog.setAttribute('open', '');
      this.dialog.style.display = 'block';
    }

    return this.orchestrator.mount(vocabItem);
  }

  /**
   * Closes the modal, destroys the active orchestrator, and restores focus.
   */
  close() {
    if (!this.dialog) return;

    if (this.orchestrator) {
      this.orchestrator.destroy();
      this.orchestrator = null;
    }

    if (typeof this.dialog.close === 'function') {
      try {
        this.dialog.close();
      } catch (e) {
        // Safe dismissal
      }
    } else {
      this.dialog.removeAttribute('open');
      this.dialog.style.display = 'none';
    }

    // Restore focus (WCAG 2.2 APG)
    if (this.triggerElement && typeof this.triggerElement.focus === 'function') {
      try {
        this.triggerElement.focus();
      } catch (e) {
        // Safe dismissal
      }
    }
    this.triggerElement = null;
  }
}

/**
 * Convenience global function to open the shared vocabulary writing modal.
 *
 * @param {Object} options
 * @returns {Promise<boolean>}
 */
export function openVocabWritingModal(options) {
  if (!sharedModalInstance) {
    sharedModalInstance = new VocabWritingModalController();
  }
  return sharedModalInstance.open(options);
}
