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

    /** @type {Function|null} Active promise resolver for HTMLAudioElement playback */
    this._activeAudioSettle = null;

    /** @type {Function|null} Active promise resolver for Web Speech playback */
    this._activeSpeechSettle = null;

    /** @type {number|null} */
    this._safetyTimer = null;

    /** @type {number} */
    this._lastToastTimestamp = 0;

    /** @type {number} Minimum cooldown between toasts (ms) */
    this._toastCooldownMs = toastCooldownMs;

    /** @type {Array} Cached voices from speechSynthesis */
    this._cachedVoices = [];

    /** @type {boolean} Whether voiceschanged listener has been attached */
    this._voiceListenerInitialized = false;

    /** @type {number} Timestamp of last cancel() call to debounce rapid successive clicks */
    this._lastCancelTimestamp = 0;
  }

  /**
   * Initializes voice listener to handle asynchronous voice loading in Chromium/Safari.
   * @private
   */
  _initVoiceListener() {
    if (typeof window === 'undefined' || !window.speechSynthesis || this._voiceListenerInitialized) {
      return;
    }
    this._voiceListenerInitialized = true;
    const updateVoices = () => {
      try {
        const v = window.speechSynthesis.getVoices?.();
        if (Array.isArray(v) && v.length > 0) {
          this._cachedVoices = v;
        }
      } catch (_) {}
    };
    updateVoices();
    try {
      if (typeof window.speechSynthesis.addEventListener === 'function') {
        window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
      } else {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    } catch (_) {}
  }

  /**
   * Selects an optimal Chinese voice (zh-CN / zh) from Web Speech API.
   * @returns {SpeechSynthesisVoice|null}
   * @private
   */
  _getChineseVoice() {
    if (!isSpeechSynthesisAvailable()) return null;
    this._initVoiceListener();
    let voices = [];
    try {
      voices = window.speechSynthesis.getVoices?.() || [];
    } catch (_) {}
    if ((!voices || voices.length === 0) && this._cachedVoices.length > 0) {
      voices = this._cachedVoices;
    }
    if (!Array.isArray(voices) || voices.length === 0) return null;

    // Preference: zh-CN -> cmn-Hans-CN -> zh-TW -> general zh/cmn
    return voices.find(v => v && v.lang && (v.lang === 'zh-CN' || v.lang === 'zh_CN')) ||
      voices.find(v => v && v.lang && v.lang.toLowerCase().startsWith('zh-cn')) ||
      voices.find(v => v && v.lang && (v.lang.startsWith('zh') || v.lang.startsWith('cmn'))) ||
      null;
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
   * Locks the trigger button synchronously with ARIA attributes and styling.
   * @private
   */
  _lockButton(button) {
    if (!button) return;
    this._currentButton = button;
    try {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.classList.add('is-speaking');
    } catch (_) {}
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
        this._activeAudio.currentTime = 0;
      } catch (_) {}
      this._activeAudio.onended = null;
      this._activeAudio.onerror = null;
      this._activeAudio.onplay = null;
      this._activeAudio.onplaying = null;
      this._activeAudio = null;
    }

    if (this._currentButton) {
      try {
        this._currentButton.disabled = false;
        this._currentButton.removeAttribute('aria-busy');
        this._currentButton.classList.remove('is-speaking');
      } catch (_) {}
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
    this._lastCancelTimestamp = Date.now();
    if (this._activeAudio) {
      try {
        this._activeAudio.pause();
        this._activeAudio.currentTime = 0;
      } catch (_) {}
      this._activeAudio.onended = null;
      this._activeAudio.onerror = null;
      this._activeAudio.onplay = null;
      this._activeAudio.onplaying = null;
      this._activeAudio = null;
    }

    if (this._activeAudioSettle) {
      const settle = this._activeAudioSettle;
      this._activeAudioSettle = null;
      try {
        settle({
          success: false,
          method: 'audio_file',
          message: 'Playback canceled'
        });
      } catch (_) {}
    }

    if (isSpeechSynthesisAvailable()) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.cancel();
      } catch (err) {
        console.warn('[SpeechController] cancel() failed:', err);
      }
    }

    if (this._activeSpeechSettle) {
      const settle = this._activeSpeechSettle;
      this._activeSpeechSettle = null;
      try {
        settle({
          success: false,
          method: 'web_speech',
          message: 'Speech canceled'
        });
      } catch (_) {}
    }

    this._cleanup(false);
  }

  /**
   * Arms a safety timer that unlocks button state if the browser drops lifecycle events.
   * @private
   */
  _setSafetyTimeout(fn, ms = 5000) {
    if (this._safetyTimer) {
      clearTimeout(this._safetyTimer);
    }
    this._safetyTimer = setTimeout(() => {
      this._safetyTimer = null;
      try {
        fn();
      } catch (_) {}
    }, ms);
    if (this._safetyTimer && typeof this._safetyTimer.unref === 'function') {
      this._safetyTimer.unref();
    }
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
   * @param {number} [options.pitch=1.0] - Speech pitch
   * @param {Function} [options.onEnd=null] - Optional completion callback
   * @param {Function} [options.onError=null] - Optional error callback
   * @returns {boolean} true if utterance was dispatched, false if ignored or unsupported
   */
  speak(text, {
    button = null,
    lang = 'zh-CN',
    rate = 0.85,
    pitch = 1.0,
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
      if (typeof onError === 'function') {
        try { onError(new Error('Web Speech API not supported')); } catch (_) {}
      }
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

    return this._speakUtterance(cleanText, { button, lang, rate, pitch, onEnd, onError });
  }

  /**
   * Dispatches speech utterance after locks and state transitions are established.
   * @private
   */
  _speakUtterance(cleanText, { button = null, lang = 'zh-CN', rate = 0.85, pitch = 1.0, onEnd = null, onError = null } = {}) {
    try {
      // Lock button and transition state synchronously
      this._state = SpeechState.SPEAKING;
      this._currentButton = button || null;
      this._currentText = cleanText;

      if (this._currentButton) {
        this._lockButton(this._currentButton);
      }

      // Create and configure Utterance
      const UtteranceClass = (typeof window !== 'undefined' && window.SpeechSynthesisUtterance) ||
        (typeof SpeechSynthesisUtterance !== 'undefined' ? SpeechSynthesisUtterance : null);
      if (!UtteranceClass) {
        this._cleanup(true);
        return false;
      }

      const utterance = new UtteranceClass(cleanText);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;

      // Select Chinese voice if available
      const chineseVoice = this._getChineseVoice();
      if (chineseVoice) {
        utterance.voice = chineseVoice;
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
        const isCanceled = (errType === 'canceled' || errType === 'interrupted');
        // 'canceled' and 'interrupted' are natural lifecycle results of intentional cancellation
        if (!isCanceled) {
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
        this._cleanup(!isCanceled);
      };

      // Safety fallback timer: prevents button lock if browser drops end/error events
      this._setSafetyTimeout(() => {
        if (this._state === SpeechState.SPEAKING) {
          console.warn('[SpeechController] Safety timeout reached, releasing button lock');
          this._cleanup(false);
        }
      }, 5000);

      // Retain reference against GC and dispatch speech
      this._activeUtterance = utterance;

      // Resume paused engine to avoid Chromium queue freeze
      if (window.speechSynthesis.paused) {
        try { window.speechSynthesis.resume(); } catch (_) {}
      }

      window.speechSynthesis.speak(utterance);
      return true;

    } catch (err) {
      console.warn('[SpeechController] Speech dispatch failed:', err);
      this._showThrottledToast(
        'Lỗi phát âm',
        'Không thể khởi động bộ phát âm trên trình duyệt.',
        'warning'
      );
      if (typeof onError === 'function') {
        try { onError(err); } catch (_) {}
      }
      this._cleanup(true);
      return false;
    }
  }

  /**
   * Unified 3-Tier Pronunciation Player:
   * Tier 1: Dedicated HTMLAudioElement (if audioUrl present and playable).
   * Tier 2: Web Speech API (window.speechSynthesis with zh-CN voice selection).
   * Tier 3: Informative UI Toast / notification (never fail silently!).
   *
   * Executes synchronously to preserve browser Transient User Activation.
   *
   * @param {Object|string} target - Options object, Card item, or string text to pronounce
   * @param {Object} [options] - Additional/override options
   * @returns {Promise<{ success: boolean, method: string, message?: string }>}
   */
  playPronunciation(target = {}, options = {}) {
    let rawText = '';
    let rawAudioUrl = null;
    let button = null;
    let lang = 'zh-CN';
    let rate = 0.85;
    let pitch = 1.0;
    let onEnd = null;
    let onError = null;

    if (typeof target === 'string') {
      rawText = target;
      if (options && typeof options === 'object') {
        rawAudioUrl = options.audioUrl || null;
        button = options.button || null;
        lang = options.lang || 'zh-CN';
        rate = options.rate ?? 0.85;
        pitch = options.pitch ?? 1.0;
        onEnd = options.onEnd || null;
        onError = options.onError || null;
      }
    } else if (target && typeof target === 'object') {
      rawText = target.text || target.hanzi || target.character || '';
      rawAudioUrl = target.audioUrl || options.audioUrl || null;
      button = target.button || options.button || null;
      lang = target.lang || options.lang || 'zh-CN';
      rate = target.rate ?? options.rate ?? 0.85;
      pitch = target.pitch ?? options.pitch ?? 1.0;
      onEnd = target.onEnd || options.onEnd || null;
      onError = target.onError || options.onError || null;
    }

    let cleanText = (typeof rawText === 'string') ? rawText.trim() : '';
    if (cleanText.includes('(') || cleanText.includes('/')) {
      cleanText = cleanText.split(/[()\/]/)[0].trim();
    }

    const safeAudioUrl = rawAudioUrl ? sanitizeResourceUrl(rawAudioUrl) : null;
    const hasValidAudio = safeAudioUrl && safeAudioUrl !== 'about:blank';

    if (!cleanText && !hasValidAudio) {
      return this._executeTier3ToastFallback({
        button,
        onError,
        message: 'No text or audio URL provided'
      });
    }

    // 1. Anti-spam Check: If already speaking/playing
    if (this._state === SpeechState.SPEAKING) {
      if (button && this._currentButton === button) {
        const res = { success: false, method: hasValidAudio ? 'audio_file' : 'web_speech', message: 'Ignored duplicate click' };
        const prom = Promise.resolve(res);
        prom.success = false;
        prom.method = res.method;
        return prom;
      }
      if (!button && (this._currentText === cleanText || (hasValidAudio && this._currentText === safeAudioUrl))) {
        const res = { success: false, method: hasValidAudio ? 'audio_file' : 'web_speech', message: 'Ignored duplicate text' };
        const prom = Promise.resolve(res);
        prom.success = false;
        prom.method = res.method;
        return prom;
      }
      this.cancel();
    }

    // Audio constructor detection
    const AudioConstructor = (typeof window !== 'undefined' && window.Audio) ? window.Audio : null;

    // TIER 1: Dedicated Audio Element Playback
    if (hasValidAudio && AudioConstructor) {
      this._state = SpeechState.SPEAKING;
      this._currentButton = button || null;
      this._currentText = cleanText || safeAudioUrl;
      if (this._currentButton) {
        this._lockButton(this._currentButton);
      }

      let audio;
      try {
        audio = new AudioConstructor(safeAudioUrl);
        this._activeAudio = audio;
      } catch (audioInitErr) {
        this._activeAudio = null;
        return this._executeTier2OrTier3({ cleanText, button, lang, rate, pitch, onEnd, onError, reason: audioInitErr?.message });
      }

      let promiseResolve;
      const playPromiseResult = new Promise((resolve) => {
        promiseResolve = resolve;
      });
      playPromiseResult.success = true;
      playPromiseResult.method = 'audio_file';

      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        this._activeAudioSettle = null;
        this._cleanup(!result.success);
        if (promiseResolve) {
          promiseResolve(result);
          promiseResolve = null;
        }
      };

      this._activeAudioSettle = (result) => {
        finish(result);
      };

      audio.onended = () => {
        this._activeAudio = null;
        if (typeof onEnd === 'function') {
          try { onEnd(); } catch (_) {}
        }
        finish({ success: true, method: 'audio_file' });
      };

      let fallbackInitiated = false;
      const handleAudioError = (e) => {
        // Ignore AbortError when playback was intentionally stopped by pause()/cancel()
        if (e && (e.name === 'AbortError' || (typeof e.message === 'string' && e.message.includes('interrupted by a call to pause')))) {
          finish({ success: false, method: 'audio_file', message: 'Playback canceled' });
          return;
        }
        if (fallbackInitiated) return;
        fallbackInitiated = true;

        this._activeAudio = null;
        this._activeAudioSettle = null;
        // Fallback to Tier 2 (Web Speech API)
        this._executeTier2OrTier3({
          cleanText,
          button,
          lang,
          rate,
          pitch,
          onEnd,
          onError,
          reason: e?.message || 'Audio playback failed'
        }).then(finish);
      };

      audio.onerror = (e) => {
        handleAudioError(e);
      };

      try {
        const playPromise = audio.play();
        if (playPromise !== undefined && typeof playPromise.catch === 'function') {
          playPromise.catch((err) => {
            if (err && (err.name === 'AbortError' || (typeof err.message === 'string' && err.message.includes('interrupted by a call to pause')))) {
              finish({ success: false, method: 'audio_file', message: 'Playback canceled' });
              return;
            }
            handleAudioError(err);
          });
        }
      } catch (err) {
        if (err && (err.name === 'AbortError' || (typeof err.message === 'string' && err.message.includes('interrupted by a call to pause')))) {
          finish({ success: false, method: 'audio_file', message: 'Playback canceled' });
        } else {
          handleAudioError(err);
        }
      }

      this._setSafetyTimeout(() => {
        if (this._state === SpeechState.SPEAKING) {
          console.warn('[SpeechController] Audio safety timeout reached, releasing button lock');
          this._activeAudioSettle = null;
          this.cancel();
          finish({ success: false, method: 'audio_file', message: 'Audio timeout' });
        }
      }, 5000);

      return playPromiseResult;
    }

    // TIER 2 & TIER 3: Web Speech API with Informative Fallback
    return this._executeTier2OrTier3({
      cleanText,
      button,
      lang,
      rate,
      pitch,
      onEnd,
      onError,
      reason: hasValidAudio ? 'Audio constructor unavailable' : 'No audioUrl provided'
    });
  }

  /**
   * Dispatches Tier 2 (Web Speech API) or cascades to Tier 3 (Informative Toast).
   * @private
   */
  _executeTier2OrTier3({ cleanText, button, lang, rate, pitch, onEnd, onError, reason }) {
    if (cleanText && isSpeechSynthesisAvailable()) {
      let promiseResolve;
      const prom = new Promise((resolve) => {
        promiseResolve = resolve;
      });
      prom.success = true;
      prom.method = 'web_speech';

      this._activeSpeechSettle = (result) => {
        if (promiseResolve) {
          promiseResolve(result);
          promiseResolve = null;
        }
      };

      const wrappedOnEnd = () => {
        this._activeSpeechSettle = null;
        if (typeof onEnd === 'function') {
          try { onEnd(); } catch (_) {}
        }
        if (promiseResolve) {
          promiseResolve({ success: true, method: 'web_speech' });
          promiseResolve = null;
        }
      };

      const wrappedOnError = (e) => {
        this._activeSpeechSettle = null;
        const errType = e?.error || 'unknown';
        const isCanceled = (errType === 'canceled' || errType === 'interrupted');

        if (typeof onError === 'function') {
          try { onError(e); } catch (_) {}
        }
        // Tier 3 Informative notification on failure (only if NOT canceled or interrupted)
        if (!isCanceled) {
          this._showThrottledToast(
            'Không thể phát âm thanh',
            'Không thể phát âm thanh trên thiết bị này.',
            'info'
          );
        }
        if (promiseResolve) {
          promiseResolve({
            success: false,
            method: isCanceled ? 'web_speech' : 'ui_fallback',
            message: isCanceled ? 'Speech canceled' : (e?.error || 'Speech synthesis error')
          });
          promiseResolve = null;
        }
      };

      // Synchronous dispatch to Web Speech API to preserve user gesture activation
      const dispatched = this._speakUtterance(cleanText, {
        button,
        lang,
        rate,
        pitch,
        onEnd: wrappedOnEnd,
        onError: wrappedOnError
      });

      if (!dispatched) {
        this._activeSpeechSettle = null;
        return this._executeTier3ToastFallback({ button, onError, message: 'Web Speech dispatch returned false' });
      }

      return prom;
    }

    // TIER 3: Informative Toast Fallback (Never fail silently!)
    return this._executeTier3ToastFallback({ button, onError, message: reason });
  }

  /**
   * Tier 3 UI Notification fallback: Displays informative toast and unlocks UI cleanly.
   * @private
   */
  _executeTier3ToastFallback({ button, onError, message = '' }) {
    this._cleanup(true);
    this._showThrottledToast(
      'Không thể phát âm thanh',
      'Không tìm thấy file phát âm và thiết bị chưa hỗ trợ tổng hợp giọng nói tiếng Trung.',
      'warning'
    );
    if (typeof onError === 'function') {
      try { onError(new Error(message || 'Audio playback unavailable')); } catch (_) {}
    }
    const res = {
      success: false,
      method: 'ui_fallback',
      message: message || 'Audio and Web Speech both unavailable'
    };
    const prom = Promise.resolve(res);
    prom.success = false;
    prom.method = 'ui_fallback';
    return prom;
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
 * Plays pronunciation with 3-tier fallback:
 * Tier 1: Dedicated audio file (if audioUrl present).
 * Tier 2: Web Speech API (window.speechSynthesis).
 * Tier 3: Informative UI Toast / notification.
 *
 * @param {Object|string} target - Options object, Card item, or string text to pronounce
 * @param {Object} [options] - Options overrides
 * @returns {Promise<{ success: boolean, method: string, message?: string }>}
 */
export function playPronunciation(target = {}, options = {}) {
  return speechController.playPronunciation(target, options);
}
