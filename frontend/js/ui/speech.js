/**
 * =============================================================================
 * CENTRALIZED SPEECH & AUDIO SYNTHESIS CONTROLLER
 * Module: frontend/js/ui/speech.js
 *
 * Responsibilities:
 * - Centralized Web Speech API SpeechSynthesis controller.
 * - Robust anti-spam engine: locks triggering button during speech lifecycle.
 * - Strictly prevents utterance queuing, race conditions, and duplicate speech dispatches.
 * - Debounces and throttles error toast notifications to prevent alert storms.
 * - Handles full Web Speech API lifecycle: start, end, error, cancel.
 * - Guards against garbage collection (GC) bugs by retaining utterance references.
 * - Provides safety timeouts to ensure buttons never stay permanently locked.
 * =============================================================================
 */

import { showToast } from './ui.js';
import { sanitizeResourceUrl } from './security.js';

/**
 * Speech Controller state enumeration
 * @readonly
 * @enum {string}
 */
export const SpeechState = Object.freeze({
  IDLE: 'idle',
  SPEAKING: 'speaking',
  ERROR: 'error'
});

/**
 * Checks Web Speech API SpeechSynthesis availability in the current environment.
 * Safe for server-side / headless test runners.
 *
 * @returns {boolean}
 */
export function isSpeechSynthesisAvailable() {
  return typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window &&
    typeof window.speechSynthesis?.speak === 'function';
}

export class SpeechController {
  constructor({ toastFn = showToast, toastCooldownMs = 3500 } = {}) {
    /** @type {Function} */
    this._toastFn = toastFn;

    /** @type {string} */
    this._state = SpeechState.IDLE;

    /** @type {HTMLElement|null} */
    this._currentButton = null;

    /** @type {string|null} */
    this._currentText = null;

    /**
     * Retains active utterance in module memory to prevent browser garbage collection
     * from prematurely terminating speech or dropping onend/onerror events.
     * @type {SpeechSynthesisUtterance|null}
     */
    this._activeUtterance = null;

    /**
     * Active HTMLAudioElement instance when playing dedicated audio files.
     * @type {HTMLAudioElement|null}
     */
    this._activeAudio = null;

    /** @type {number|null} */
    this._safetyTimer = null;

    /** @type {number} */
    this._lastToastTimestamp = 0;

    /** @type {number} Minimum cooldown between toasts (ms) */
    this._toastCooldownMs = toastCooldownMs;
  }

  /**
   * Current speech engine state
   * @returns {string}
   */
  get state() {
    return this._state;
  }

  /**
   * Currently active Hanzi text
   * @returns {string|null}
   */
  get currentText() {
    return this._currentText;
  }

  /**
   * Whether speech is currently in progress
   * @returns {boolean}
   */
  get isSpeaking() {
    return this._state === SpeechState.SPEAKING;
  }

  /**
   * Alias for speak()
   */
  speakHanzi(text, options) {
    return this.speak(text, options);
  }

  /**
   * Internal helper to display error toasts with anti-spam cooldown.
   *
   * @param {string} title
   * @param {string} message
   * @param {'info'|'warning'|'danger'} [type='info']
   */
  _showThrottledToast(title, message, type = 'info') {
    const now = Date.now();
    if (now - this._lastToastTimestamp < this._toastCooldownMs) {
      return;
    }
    this._lastToastTimestamp = now;

    try {
      if (typeof this._toastFn === 'function') {
        if (typeof document === 'undefined' && this._toastFn === showToast) {
          return;
        }
        this._toastFn({ type, title, message });
      } else if (typeof document !== 'undefined' && typeof showToast === 'function') {
        showToast({ type, title, message });
      }
    } catch (err) {
      console.warn('[SpeechController] Toast notification failed:', err);
    }
  }

  /**
   * Releases button lock and clears active speech state safely.
   *
   * @param {boolean} [isError=false]
   */
  _cleanup(isError = false) {
    if (this._safetyTimer) {
      clearTimeout(this._safetyTimer);
      this._safetyTimer = null;
    }

    if (this._activeAudio) {
      try {
        this._activeAudio.pause();
      } catch (_) {}
      this._activeAudio.onended = null;
      this._activeAudio.onerror = null;
      this._activeAudio = null;
    }

    if (this._currentButton) {
      this._currentButton.disabled = false;
      this._currentButton.removeAttribute('aria-busy');
      this._currentButton.classList.remove('is-speaking');
      this._currentButton = null;
    }

    if (this._activeUtterance) {
      this._activeUtterance.onstart = null;
      this._activeUtterance.onend = null;
      this._activeUtterance.onerror = null;
      this._activeUtterance = null;
    }

    this._currentText = null;
    this._state = isError ? SpeechState.ERROR : SpeechState.IDLE;
  }

  /**
   * Cancels any active speech or audio playback, cleans up listeners, and resets button state.
   */
  cancel() {
    if (this._activeAudio) {
      try {
        this._activeAudio.pause();
      } catch (_) {}
      this._activeAudio.onended = null;
      this._activeAudio.onerror = null;
      this._activeAudio = null;
    }

    if (isSpeechSynthesisAvailable()) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        console.warn('[SpeechController] cancel() failed:', err);
      }
    }
    this._cleanup(false);
  }

  /**
   * Synthesizes Mandarin pronunciation of given Hanzi text with anti-spam button lock.
   *
   * Anti-spam Behavior:
   * - First click starts speech and locks the button.
   * - Subsequent clicks on the same button during speech are IGNORED (no extra utterance, no toast, no speak).
   * - Clicking a DIFFERENT button or item cancels the old session and starts the new one cleanly.
   * - When speech completes or encounters an error, the button unlocks automatically.
   *
   * @param {string} text - Chinese character(s) to pronounce
   * @param {Object} [options]
   * @param {HTMLElement} [options.button=null] - Triggering button element to lock/unlock
   * @param {string} [options.lang='zh-CN'] - BCP-47 language tag
   * @param {number} [options.rate=0.85] - Speech rate
   * @param {Function} [options.onEnd=null] - Optional completion callback
   * @param {Function} [options.onError=null] - Optional error callback
   * @returns {boolean} true if utterance was dispatched, false if ignored or unsupported
   */
  speak(text, {
    button = null,
    lang = 'zh-CN',
    rate = 0.85,
    onEnd = null,
    onError = null
  } = {}) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      return false;
    }

    const cleanText = text.trim();

    // 1. Feature detection
    if (!isSpeechSynthesisAvailable()) {
      this._showThrottledToast(
        'Phát âm không khả dụng',
        'Trình duyệt hiện tại không hỗ trợ Web Speech API.',
        'info'
      );
      return false;
    }

    // 2. Anti-spam Check: If speech is already in progress
    if (this._state === SpeechState.SPEAKING) {
      // If the SAME button or same text is clicked while speaking -> IGNORE COMPLETELY!
      if (button && this._currentButton === button) {
        return false;
      }
      if (!button && this._currentText === cleanText) {
        return false;
      }

      // If user clicked a DIFFERENT button / item: cancel previous session and proceed with new one
      this.cancel();
    }

    return this._speakUtterance(cleanText, { button, lang, rate, onEnd, onError });
  }

  /**
   * Dispatches speech utterance after locks and state transitions are established.
   * 
   * @private
   */
  _speakUtterance(cleanText, { button = null, lang = 'zh-CN', rate = 0.85, onEnd = null, onError = null } = {}) {
    try {
      // Lock button and transition state
      this._state = SpeechState.SPEAKING;
      this._currentButton = button || null;
      this._currentText = cleanText;

      if (this._currentButton) {
        this._currentButton.disabled = true;
        this._currentButton.setAttribute('aria-busy', 'true');
        this._currentButton.classList.add('is-speaking');
      }

      // Create and configure Utterance
      const UtteranceClass = (typeof window !== 'undefined' && window.SpeechSynthesisUtterance) || (typeof SpeechSynthesisUtterance !== 'undefined' ? SpeechSynthesisUtterance : null);
      const utterance = new UtteranceClass(cleanText);
      utterance.lang = lang;
      utterance.rate = rate;

      // Select Chinese voice if available
      try {
        const voices = window.speechSynthesis.getVoices?.() || [];
        const chineseVoice = voices.find(v => v && v.lang && (v.lang.startsWith('zh') || v.lang.startsWith('cmn')));
        if (chineseVoice) {
          utterance.voice = chineseVoice;
        }
      } catch {
        // Voice lookup non-fatal
      }

      // Lifecycle event listeners
      utterance.onstart = () => {
        this._state = SpeechState.SPEAKING;
      };

      utterance.onend = () => {
        if (typeof onEnd === 'function') {
          try { onEnd(); } catch (_) {}
        }
        this._cleanup(false);
      };

      utterance.onerror = (e) => {
        const errType = e?.error || 'unknown';
        // 'canceled' and 'interrupted' are natural lifecycle results of intentional cancellation
        if (errType !== 'canceled' && errType !== 'interrupted') {
          console.warn('[SpeechController] Utterance error:', errType);
          this._showThrottledToast(
            'Phát âm tự động',
            'Không thể phát âm thanh trên thiết bị này.',
            'info'
          );
        }

        if (typeof onError === 'function') {
          try { onError(e); } catch (_) {}
        }
        this._cleanup(true);
      };

      // Safety fallback timer: prevents button lock if browser drops end/error events
      this._safetyTimer = setTimeout(() => {
        if (this._state === SpeechState.SPEAKING) {
          console.warn('[SpeechController] Safety timeout reached, releasing button lock');
          this._cleanup(false);
        }
      }, 10000);
      if (this._safetyTimer && typeof this._safetyTimer.unref === 'function') {
        this._safetyTimer.unref();
      }

      // Retain reference against GC and dispatch speech
      this._activeUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;

    } catch (err) {
      console.warn('[SpeechController] Speech dispatch failed:', err);
      this._showThrottledToast(
        'Lỗi phát âm',
        'Không thể khởi động bộ phát âm trên trình duyệt.',
        'warning'
      );
      this._cleanup(true);
      return false;
    }
  }

  /**
   * Unified pronunciation player with dedicated audio priority and automatic Web Speech API fallback.
   *
   * Behavior:
   * 1. If audioUrl is provided and valid: attempts HTMLAudioElement playback.
   * 2. If audio fails, errors, or audioUrl is missing: falls back cleanly to Web Speech API.
   * 3. Synchronizes button state: locked (.is-speaking, disabled, aria-busy) during playback.
   * 4. Anti-spam: rapid clicks on the same button/item are safely ignored without queueing.
   *
   * @param {Object} options
   * @param {string} [options.text] - Chinese character(s) to pronounce
   * @param {string|null} [options.audioUrl=null] - Optional audio media URL
   * @param {HTMLElement|null} [options.button=null] - Triggering button element
   * @param {string} [options.lang='zh-CN'] - BCP-47 language tag
   * @param {number} [options.rate=0.85] - Speech rate
   * @param {Function} [options.onEnd=null] - Completion callback
   * @param {Function} [options.onError=null] - Error callback
   * @returns {boolean} true if audio or speech synthesis was dispatched, false otherwise
   */
  playPronunciation({
    text = '',
    audioUrl = null,
    button = null,
    lang = 'zh-CN',
    rate = 0.85,
    onEnd = null,
    onError = null
  } = {}) {
    const cleanText = (typeof text === 'string') ? text.trim() : '';
    const safeAudioUrl = audioUrl ? sanitizeResourceUrl(audioUrl) : null;
    const hasValidAudio = safeAudioUrl && safeAudioUrl !== 'about:blank';

    if (!cleanText && !hasValidAudio) {
      return false;
    }

    // 1. Anti-spam Check: If already speaking/playing
    if (this._state === SpeechState.SPEAKING) {
      // If user clicked the SAME button or same text/audioUrl: ignore
      if (button && this._currentButton === button) {
        return false;
      }
      if (!button && (this._currentText === cleanText || (hasValidAudio && this._currentText === safeAudioUrl))) {
        return false;
      }

      // If user clicked a DIFFERENT button or item: cancel prior audio/speech cleanly
      this.cancel();
    }

    // 2. Try playing dedicated audio file first if URL is valid and Audio constructor exists
    if (hasValidAudio && typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
      try {
        this._state = SpeechState.SPEAKING;
        this._currentButton = button || null;
        this._currentText = cleanText || safeAudioUrl;

        if (this._currentButton) {
          this._currentButton.disabled = true;
          this._currentButton.setAttribute('aria-busy', 'true');
          this._currentButton.classList.add('is-speaking');
        }

        const audio = new window.Audio(safeAudioUrl);
        this._activeAudio = audio;

        audio.onended = () => {
          this._activeAudio = null;
          if (typeof onEnd === 'function') {
            try { onEnd(); } catch (_) {}
          }
          this._cleanup(false);
        };

        audio.onerror = (e) => {
          this._activeAudio = null;
          // Audio playback failed, fallback to Web Speech API
          if (cleanText) {
            this._speakUtterance(cleanText, { button, lang, rate, onEnd, onError });
          } else {
            if (typeof onError === 'function') {
              try { onError(e); } catch (_) {}
            }
            this._cleanup(true);
          }
        };

        const playPromise = audio.play();
        if (playPromise !== undefined && typeof playPromise.catch === 'function') {
          playPromise.catch((err) => {
            this._activeAudio = null;
            // Play rejected (e.g. autoplay policy, 404, or abort) -> fallback to Web Speech
            if (cleanText) {
              this._speakUtterance(cleanText, { button, lang, rate, onEnd, onError });
            } else {
              if (typeof onError === 'function') {
                try { onError(err); } catch (_) {}
              }
              this._cleanup(true);
            }
          });
        }

        this._safetyTimer = setTimeout(() => {
          if (this._state === SpeechState.SPEAKING) {
            console.warn('[SpeechController] Safety timeout reached, releasing button lock');
            this.cancel();
          }
        }, 10000);

        return true;
      } catch (err) {
        this._activeAudio = null;
        if (cleanText) {
          return this._speakUtterance(cleanText, { button, lang, rate, onEnd, onError });
        } else {
          this._cleanup(true);
          return false;
        }
      }
    }

    // 3. Fallback to Web Speech API
    if (cleanText) {
      return this.speak(cleanText, { button, lang, rate, onEnd, onError });
    }

    return false;
  }
}

/**
 * Singleton speech controller instance
 */
export const speechController = new SpeechController();

/**
 * Synthesizes Chinese Mandarin pronunciation of given Hanzi text.
 * Backwards-compatible signature matching existing page usage.
 *
 * @param {string} text - Chinese character(s) to pronounce
 * @param {Object} [options]
 * @param {HTMLElement} [options.button=null] - Button element to lock during speech
 * @param {string} [options.lang='zh-CN'] - Language tag
 * @param {number} [options.rate=0.85] - Speech rate
 * @returns {boolean} true if utterance was dispatched, false otherwise
 */
export function speakHanzi(text, { button = null, lang = 'zh-CN', rate = 0.85 } = {}) {
  return speechController.speak(text, { button, lang, rate });
}

/**
 * Plays pronunciation with dedicated audio file priority and Web Speech API fallback.
 *
 * @param {Object} options
 * @param {string} [options.text] - Chinese character(s) to pronounce
 * @param {string|null} [options.audioUrl=null] - Audio URL
 * @param {HTMLElement|null} [options.button=null] - Triggering button
 * @param {string} [options.lang='zh-CN'] - Language tag
 * @param {number} [options.rate=0.85] - Speech rate
 * @param {Function} [options.onEnd=null] - Completion callback
 * @param {Function} [options.onError=null] - Error callback
 * @returns {boolean} true if audio or utterance dispatched
 */
export function playPronunciation({
  text = '',
  audioUrl = null,
  button = null,
  lang = 'zh-CN',
  rate = 0.85,
  onEnd = null,
  onError = null
} = {}) {
  return speechController.playPronunciation({ text, audioUrl, button, lang, rate, onEnd, onError });
}
