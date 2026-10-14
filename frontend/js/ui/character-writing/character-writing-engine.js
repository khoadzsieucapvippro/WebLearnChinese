/**
 * =============================================================================
 * CHARACTER WRITING ENGINE
 * Core orchestration engine for Hanzi / Kangxi Radical writing experiences:
 * Mode 1: 'demo'     - "Cách viết"  (Stroke-by-stroke animation demonstration)
 * Mode 2: 'practice' - "Luyện nét"  (Guided tracing over visible outline)
 * Mode 3: 'quiz'     - "Luyện viết" (Freehand memory recall with miss hints)
 *
 * Adheres strictly to OWASP DOM Security (Zero dangerous sinks)
 * and WCAG 2.2 accessibility standards.
 * =============================================================================
 */

import HanziWriter from '../../vendor/hanzi-writer.js';
import { loadStrokeData, extractCleanChar } from './stroke-data-loader.js';

export const WRITING_MODES = {
  DEMO: 'demo',
  PRACTICE: 'practice',
  QUIZ: 'quiz'
};

export class CharacterWritingEngine {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.targetElement - The DOM container for the SVG canvas
   * @param {number} [options.width=160]
   * @param {number} [options.height=160]
   * @param {string} [options.strokeColor='#1976D2']
   * @param {string} [options.radicalColor='#C83C23']
   * @param {string} [options.outlineColor='#D1D5DB']
   * @param {string} [options.drawingColor='#374151']
   * @param {Function} [options.onStatusChange] - Callback receiving state updates
   * @param {Function} [options.onComplete] - Callback when character writing is finished
   */
  constructor(options = {}) {
    if (!options.targetElement) {
      throw new Error('CharacterWritingEngine requires a targetElement DOM container.');
    }

    this.container = options.targetElement;
    this.width = options.width || 160;
    this.height = options.height || 160;
    this.strokeColor = options.strokeColor || '#1976D2';
    this.radicalColor = options.radicalColor || '#C83C23';
    this.outlineColor = options.outlineColor || '#D1D5DB';
    this.drawingColor = options.drawingColor || '#374151';
    this.onStatusChange = typeof options.onStatusChange === 'function' ? options.onStatusChange : null;
    this.onComplete = typeof options.onComplete === 'function' ? options.onComplete : null;

    this.writer = null;
    this.currentCharacter = '';
    this.currentMode = WRITING_MODES.DEMO;
    this.strokeCount = 0;
    this.currentStrokeIndex = 0;
    this.isAnimating = false;
    this.isDestroyed = false;
    this.activeTimeoutId = null;
  }

  /**
   * Sets up or updates the active character.
   *
   * @param {string} character
   * @param {string} [initialMode=WRITING_MODES.DEMO]
   * @returns {Promise<boolean>} success
   */
  async load(character, initialMode = WRITING_MODES.DEMO) {
    if (this.isDestroyed) return false;

    this.cancelPendingTimers();
    const cleanChar = extractCleanChar(character);
    if (!cleanChar) return false;

    this.currentCharacter = cleanChar;
    this.currentMode = initialMode;

    // Load stroke geometry
    const strokeData = await loadStrokeData(cleanChar);
    if (!strokeData || this.isDestroyed) {
      return false;
    }

    this.strokeCount = strokeData.strokes.length;
    this.currentStrokeIndex = 0;

    return this.renderCurrentMode();
  }

  /**
   * Changes the interactive mode ('demo' | 'practice' | 'quiz') and re-renders.
   *
   * @param {string} newMode
   * @returns {Promise<boolean>}
   */
  async setMode(newMode) {
    if (this.isDestroyed || !this.currentCharacter) return false;
    if (!Object.values(WRITING_MODES).includes(newMode)) return false;

    this.currentMode = newMode;
    return this.renderCurrentMode();
  }

  /**
   * Internal renderer configuring HanziWriter options according to the active mode.
   *
   * @private
   * @returns {boolean}
   */
  renderCurrentMode() {
    if (this.isDestroyed || !this.currentCharacter) return false;

    this.cancelPendingTimers();
    this.clearContainer();

    try {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
                     document.body.classList.contains('dark-theme');

      const baseConfig = {
        width: this.width,
        height: this.height,
        padding: 8,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 350,
        drawingFadeDuration: 120,
        strokeColor: this.strokeColor,
        radicalColor: this.radicalColor,
        highlightColor: '#1B7A4B',
        outlineColor: isDark ? '#4B5563' : this.outlineColor,
        drawingColor: isDark ? '#E5E7EB' : this.drawingColor,
        charDataLoader: (char, onComplete, onErr) => {
          loadStrokeData(char)
            .then(data => {
              if (data) onComplete(data);
              else onErr(new Error(`Stroke data not found for ${char}`));
            })
            .catch(onErr);
        }
      };

      if (this.currentMode === WRITING_MODES.DEMO) {
        // Tab 1: "Cách viết" - Full outline, filled character preview, sequential stroke animation
        baseConfig.showOutline = true;
        baseConfig.showCharacter = true;
      } else if (this.currentMode === WRITING_MODES.PRACTICE) {
        // Tab 2: "Luyện nét" - Visible target outline, hidden filled character, user traces
        baseConfig.showOutline = true;
        baseConfig.showCharacter = false;
        baseConfig.showHintAfterMisses = 2;
      } else if (this.currentMode === WRITING_MODES.QUIZ) {
        // Tab 3: "Luyện viết" - Hidden outline (blank grid), memory recall, hint after 1 miss
        baseConfig.showOutline = false;
        baseConfig.showCharacter = false;
        baseConfig.showHintAfterMisses = 1;
        baseConfig.highlightOnComplete = true;
      }

      this.writer = HanziWriter.create(this.container, this.currentCharacter, baseConfig);

      // Launch mode-specific action
      if (this.currentMode === WRITING_MODES.DEMO) {
        this.notifyStatus('Đang chuẩn bị minh họa cách viết...');
        this.activeTimeoutId = setTimeout(() => {
          if (!this.isDestroyed && this.writer) {
            this.animate();
          }
        }, 400);
      } else {
        this.notifyStatus(
          this.currentMode === WRITING_MODES.PRACTICE
            ? 'Hãy tô theo đường nét mờ chỉ dẫn.'
            : 'Hãy tự nhớ và viết toàn bộ chữ vào ô trống.'
        );
        this.activeTimeoutId = setTimeout(() => {
          if (!this.isDestroyed && this.writer) {
            this.startQuizSession();
          }
        }, 300);
      }

      return true;
    } catch (err) {
      console.error('[CharacterWritingEngine] Initialization error:', err);
      return false;
    }
  }

  /**
   * Starts an interactive quiz session with events.
   *
   * @private
   */
  startQuizSession() {
    if (!this.writer || this.isDestroyed) return;

    this.writer.quiz({
      onCorrectStroke: data => {
        if (this.isDestroyed) return;
        this.currentStrokeIndex = (data.strokeNum || 0) + 1;
        this.notifyStatus(`✓ Đúng nét ${this.currentStrokeIndex}/${this.strokeCount}.`);
      },
      onMistake: data => {
        if (this.isDestroyed) return;
        const strokeNum = (data.strokeNum || 0) + 1;
        this.notifyStatus(`Chưa đúng nét ${strokeNum}. Hãy thử lại.`);
      },
      onComplete: summary => {
        if (this.isDestroyed) return;
        const totalMistakes = summary.totalMistakes || 0;
        this.notifyStatus(`🎉 Hoàn thành xuất sắc chữ "${this.currentCharacter}"! (Lỗi: ${totalMistakes})`);
        if (this.onComplete) {
          this.onComplete({
            character: this.currentCharacter,
            mode: this.currentMode,
            totalMistakes
          });
        }
      }
    });
  }

  /**
   * Replays animation or restarts active practice/quiz session.
   */
  replay() {
    if (this.isDestroyed || !this.writer) return;

    this.cancelPendingTimers();
    if (this.currentMode === WRITING_MODES.DEMO) {
      this.animate();
    } else {
      this.renderCurrentMode();
    }
  }

  /**
   * Executes stroke-by-stroke animation.
   */
  animate() {
    if (!this.writer || this.isDestroyed) return;

    this.isAnimating = true;
    this.notifyStatus(`Đang trình chiếu thứ tự nét (Tổng cộng: ${this.strokeCount} nét)...`);

    this.writer.animateCharacter({
      onComplete: () => {
        if (this.isDestroyed) return;
        this.isAnimating = false;
        this.notifyStatus(`Đã hoàn tất trình chiếu ${this.strokeCount} nét.`);
      }
    });
  }

  /**
   * Dispatches status message to the status callback.
   *
   * @private
   * @param {string} message
   */
  notifyStatus(message) {
    if (this.onStatusChange) {
      this.onStatusChange({
        message,
        mode: this.currentMode,
        character: this.currentCharacter,
        strokeCount: this.strokeCount,
        currentStroke: this.currentStrokeIndex
      });
    }
  }

  /**
   * Safely clears container DOM nodes using native replaceChildren (Zero DOM sinks).
   *
   * @private
   */
  clearContainer() {
    if (this.container && typeof this.container.replaceChildren === 'function') {
      this.container.replaceChildren();
    }
  }

  /**
   * Cancels any pending scheduled timer.
   *
   * @private
   */
  cancelPendingTimers() {
    if (this.activeTimeoutId !== null) {
      clearTimeout(this.activeTimeoutId);
      this.activeTimeoutId = null;
    }
  }

  /**
   * Destroys active session, cleans up DOM and releases references to prevent leaks.
   */
  destroy() {
    this.isDestroyed = true;
    this.cancelPendingTimers();

    if (this.writer && typeof this.writer.cancelQuiz === 'function') {
      try {
        this.writer.cancelQuiz();
      } catch (e) {
        // Safe dismissal
      }
    }

    this.writer = null;
    this.clearContainer();
  }
}
