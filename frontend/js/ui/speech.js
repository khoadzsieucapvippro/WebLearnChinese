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

/**
 * Resolves a candidate audio URL safely across root deployments (/) and
 * project subpath deployments (e.g. GitHub Pages /WebLearnChinese/).
 * Preserves absolute http(s) URLs while preventing root-relative /assets/... paths
 * from breaking under a repository subpath.
 *
 * @param {string} url - Raw audio URL
 * @param {Location|Object|null} [locationObj] - Optional location object for testing
 * @returns {string} Sanitized and subpath-resolved URL, or 'about:blank' if invalid
 */
export function resolveSubpathAudioUrl(url, locationObj = (typeof window !== 'undefined' ? window.location : null)) {
  const safeUrl = sanitizeResourceUrl(url);
  if (!safeUrl || safeUrl === 'about:blank') {
    return 'about:blank';
  }

  if (/^https?:\/\//i.test(safeUrl)) {
    return safeUrl;
  }

  if (safeUrl.startsWith('/') && !safeUrl.startsWith('//') && locationObj && typeof locationObj.pathname === 'string') {
    const segments = locationObj.pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      const firstSeg = segments[0];
      const isHtmlFile = firstSeg.endsWith('.html');
      if (!isHtmlFile && firstSeg !== 'assets' && firstSeg !== 'api' && !safeUrl.startsWith(`/${firstSeg}/`)) {
        return `/${firstSeg}${safeUrl}`;
      }
    }
  }

  return safeUrl;
}

export class SpeechController {
  constructor({ toastFn = showToast, toastCooldownMs = 3500, voiceLoadTimeoutMs = 120, waitForVoicesOnEmpty = false } = {}) {
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

    /** @type {number} Max wait time (ms) for delayed voiceschanged event when getVoices() is initially empty */
    this._voiceLoadTimeoutMs = voiceLoadTimeoutMs;

    /** @type {boolean} Whether to await voiceschanged before first speak() when getVoices() is empty */
    this._waitForVoicesOnEmpty = waitForVoicesOnEmpty;

    /** @type {Array} Cached voices from speechSynthesis */
    this._cachedVoices = [];

    /** @type {boolean} Whether voiceschanged listener has been attached */
    this._voiceListenerInitialized = false;

    /** @type {boolean} Whether voiceschanged event has fired at least once */
    this._voicesChangedFired = false;

    /** @type {number} Timestamp of last cancel() call to debounce rapid successive clicks */
    this._lastCancelTimestamp = 0;

    /** @type {Record<string, string>|null} Static audio manifest map by hanzi */
    this._manifestHanziMap = null;

    /** @type {Record<string, string>|null} Static audio manifest map by radicalId */
    this._manifestRadicalsMap = null;

    /** @type {boolean} Whether audio manifest has loaded */
    this._manifestLoaded = false;

    /** @type {Object} Non-sensitive diagnostic snapshot of the last playback attempt */
    this._lastDiagnostics = {
      timestamp: null,
      method: null,
      audioUrl: null,
      audioPlayResult: null,
      audioErrorName: null,
      speechResult: null,
      utteranceErrorCode: null,
      fallbackReason: null
    };

    this._initVoiceListener();
    this._loadManifest();
  }

  /**
   * Preloads the static audio manifest to auto-resolve audioUrl by Hanzi or Radical ID.
   * @private
   */
  async _loadManifest() {
    if (this._manifestLoaded || typeof window === 'undefined' || typeof fetch !== 'function') {
      return;
    }
    try {
      const manifestUrl = resolveSubpathAudioUrl('assets/audio/manifest.json');
      const res = await fetch(manifestUrl);
      if (res && res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          if (data.hanzi && typeof data.hanzi === 'object') {
            this._manifestHanziMap = data.hanzi;
          }
          if (data.radicals && typeof data.radicals === 'object') {
            this._manifestRadicalsMap = data.radicals;
          }
          this._manifestLoaded = true;
        }
      }
    } catch (_) {
      // Non-blocking: If fetch fails, speechController falls back gracefully
    }
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
        window.speechSynthesis.addEventListener('voiceschanged', () => {
          this._voicesChangedFired = true;
          updateVoices();
        });
      } else if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          this._voicesChangedFired = true;
          updateVoices();
        };
      }
    } catch (_) {}
  }

  /**
   * Returns all currently available SpeechSynthesis voices from browser or cache.
   * @returns {Array<SpeechSynthesisVoice>}
   * @private
   */
  _getAvailableVoices() {
    if (!isSpeechSynthesisAvailable()) return [];
    this._initVoiceListener();
    let voices = [];
    try {
      voices = window.speechSynthesis.getVoices?.() || [];
    } catch (_) {}
    if ((!Array.isArray(voices) || voices.length === 0) && this._cachedVoices.length > 0) {
      voices = this._cachedVoices;
    } else if (Array.isArray(voices) && voices.length > 0) {
      this._cachedVoices = voices;
    }
    return Array.isArray(voices) ? voices : [];
  }

  /**
   * Selects an optimal Chinese voice (zh-CN / cmn / zh) from Web Speech API.
   * @returns {SpeechSynthesisVoice|null}
   * @private
   */
  _getChineseVoice() {
    const voices = this._getAvailableVoices();
    if (voices.length === 0) return null;

    // Preference: zh-CN -> cmn-Hans-CN -> zh-TW/zh-HK -> general zh/cmn -> Chinese voice name
    return voices.find(v => v && v.lang && (v.lang === 'zh-CN' || v.lang === 'zh_CN')) ||
      voices.find(v => v && v.lang && v.lang.toLowerCase().startsWith('zh-cn')) ||
      voices.find(v => v && v.lang && v.lang.toLowerCase().startsWith('cmn-hans')) ||
      voices.find(v => v && v.lang && (v.lang.toLowerCase().startsWith('zh') || v.lang.toLowerCase().startsWith('cmn'))) ||
      voices.find(v => v && v.name && /chinese|mandarin|putonghua|普通话|中文/i.test(v.name)) ||
      null;
  }

  /**
   * Waits briefly for voiceschanged when getVoices() is initially empty on mobile/Chromium.
   * Only waits if speechSynthesis supports voiceschanged events and voices are currently empty.
   *
   * @returns {Promise<Array<SpeechSynthesisVoice>>}
   * @private
   */
  _waitForVoicesIfEmpty() {
    const initialVoices = this._getAvailableVoices();
    if (initialVoices.length > 0 || !isSpeechSynthesisAvailable()) {
      return Promise.resolve(initialVoices);
    }

    const synth = window.speechSynthesis;
    const supportsVoicesChanged = typeof synth.addEventListener === 'function' || 'onvoiceschanged' in synth;
    if (!supportsVoicesChanged || this._voiceLoadTimeoutMs <= 0) {
      return Promise.resolve(initialVoices);
    }

    return new Promise((resolve) => {
      let settled = false;
      let timer = null;

      const finish = () => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        if (typeof synth.removeEventListener === 'function') {
          try { synth.removeEventListener('voiceschanged', onVoicesChanged); } catch (_) {}
        }
        resolve(this._getAvailableVoices());
      };

      const onVoicesChanged = () => {
        this._voicesChangedFired = true;
        finish();
      };

      try {
        if (typeof synth.addEventListener === 'function') {
          synth.addEventListener('voiceschanged', onVoicesChanged);
        } else {
          const prevHandler = synth.onvoiceschanged;
          synth.onvoiceschanged = (ev) => {
            if (typeof prevHandler === 'function') {
              try { prevHandler(ev); } catch (_) {}
            }
            onVoicesChanged();
          };
        }
      } catch (_) {
        finish();
        return;
      }

      timer = setTimeout(finish, this._voiceLoadTimeoutMs);
      if (timer && typeof timer.unref === 'function') {
        timer.unref();
      }
    });
  }

  /**
   * Returns a non-sensitive diagnostic snapshot for troubleshooting mobile/desktop audio.
   * Strictly excludes tokens, credentials, and private user data.
   *
   * @returns {Object}
   */
  getDiagnostics() {
    const voices = this._getAvailableVoices();
    const chineseVoices = voices
      .filter(v => v && ((v.lang && /^(zh|cmn)/i.test(v.lang)) || (v.name && /chinese|mandarin|putonghua|普通话|中文/i.test(v.name))))
      .map(v => ({ name: v.name || 'unknown', lang: v.lang || 'unknown', localService: Boolean(v.localService) }));

    return {
      userAgent: typeof navigator !== 'undefined' ? (navigator.userAgent || 'unknown') : 'node',
      speechSynthesisAvailable: isSpeechSynthesisAvailable(),
      voicesCount: voices.length,
      hasChineseVoice: chineseVoices.length > 0,
      chineseVoices,
      voicesChangedFired: this._voicesChangedFired,
      state: this._state,
      lastAttempt: { ...this._lastDiagnostics }
    };
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
        const synth = window.speechSynthesis;
        if (this._activeUtterance !== null || synth.speaking || synth.pending) {
          if (synth.paused && typeof synth.resume === 'function') {
            synth.resume();
          }
          synth.cancel();
        }
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
   * Resolves effective speech rate from options or localStorage preference (HOC_HAN_NGU_AUDIO_SETTINGS).
   *
   * @param {number} [rate=0.85]
   * @param {boolean} [isAudioElement=false]
   * @returns {number}
   * @private
   */
  _getEffectiveSpeechRate(rate = 0.85, isAudioElement = false) {
    let customSavedRate = null;
    try {
      if (typeof localStorage !== 'undefined') {
        const rawAudioSettings = localStorage.getItem('HOC_HAN_NGU_AUDIO_SETTINGS');
        if (rawAudioSettings) {
          const parsed = JSON.parse(rawAudioSettings);
          const candidate = parseFloat(parsed?.speechRate);
          if (!isNaN(candidate) && candidate >= 0.5 && candidate <= 2.0) {
            customSavedRate = candidate;
          }
        }
      }
    } catch (_) {}

    if (rate !== 0.85 && typeof rate === 'number' && !isNaN(rate) && rate > 0) {
      return rate;
    }
    if (customSavedRate !== null) {
      return customSavedRate;
    }
    return isAudioElement ? 1.0 : 0.85;
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

      const effectiveRate = this._getEffectiveSpeechRate(rate, false);

      const utterance = new UtteranceClass(cleanText);
      utterance.lang = lang;
      utterance.rate = effectiveRate;
      utterance.pitch = pitch;

      // Select Chinese voice if available
      const chineseVoice = this._getChineseVoice();
      if (chineseVoice) {
        utterance.voice = chineseVoice;
        if (chineseVoice.lang) {
          utterance.lang = chineseVoice.lang;
        }
      }

      let hasStarted = false;

      // Lifecycle event listeners
      utterance.onstart = () => {
        hasStarted = true;
        this._state = SpeechState.SPEAKING;
        this._lastDiagnostics.speechResult = 'started';
      };

      utterance.onend = () => {
        this._lastDiagnostics.speechResult = 'ended';
        if (typeof onEnd === 'function') {
          try { onEnd(); } catch (_) {}
        }
        this._cleanup(false);
      };

      utterance.onerror = (e) => {
        const errType = e?.error || 'unknown';
        const isCanceled = (errType === 'canceled' || errType === 'interrupted');
        this._lastDiagnostics.utteranceErrorCode = errType;
        this._lastDiagnostics.speechResult = isCanceled ? 'canceled' : 'error';
        // 'canceled' and 'interrupted' are natural lifecycle results of intentional cancellation
        if (!isCanceled) {
          console.warn('[SpeechController] Utterance error:', errType);
          this._showThrottledToast(
            'Không thể phát âm thanh',
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
        if (this._state === SpeechState.SPEAKING && this._activeUtterance === utterance) {
          console.warn('[SpeechController] Safety timeout reached, releasing button lock');
          if (!hasStarted) {
            this._lastDiagnostics.speechResult = 'timeout_before_start';
            this._showThrottledToast(
              'Không thể phát âm thanh',
              'Bộ tổng hợp giọng nói trên thiết bị không phản hồi. Vui lòng thử lại.',
              'warning'
            );
            if (typeof onError === 'function') {
              try { onError({ error: 'timeout', message: 'Speech synthesis timed out without starting' }); } catch (_) {}
            }
            this._cleanup(true);
          } else {
            this._lastDiagnostics.speechResult = 'timeout_after_start';
            if (typeof onEnd === 'function') {
              try { onEnd(); } catch (_) {}
            }
            this._cleanup(false);
          }
        }
      }, 5000);

      // Retain reference against GC and dispatch speech
      this._activeUtterance = utterance;

      // Resume paused engine to avoid Chromium queue freeze
      if (window.speechSynthesis.paused) {
        try { window.speechSynthesis.resume(); } catch (_) {}
      }

      this._lastDiagnostics.speechResult = 'dispatched';
      window.speechSynthesis.speak(utterance);
      return true;

    } catch (err) {
      console.warn('[SpeechController] Speech dispatch failed:', err);
      this._lastDiagnostics.speechResult = 'exception';
      this._lastDiagnostics.utteranceErrorCode = err?.name || err?.message || 'exception';
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
   * Tier 2: Web Speech API (window.speechSynthesis with zh-CN/cmn voice verification).
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

    let safeAudioUrl = rawAudioUrl ? resolveSubpathAudioUrl(rawAudioUrl) : null;
    if ((!safeAudioUrl || safeAudioUrl === 'about:blank') && cleanText && this._manifestHanziMap && this._manifestHanziMap[cleanText]) {
      safeAudioUrl = resolveSubpathAudioUrl(this._manifestHanziMap[cleanText]);
    }
    const hasValidAudio = Boolean(safeAudioUrl && safeAudioUrl !== 'about:blank');

    this._lastDiagnostics = {
      timestamp: Date.now(),
      method: null,
      audioUrl: hasValidAudio ? safeAudioUrl : null,
      audioPlayResult: null,
      audioErrorName: null,
      speechResult: null,
      utteranceErrorCode: null,
      fallbackReason: null
    };

    if (!cleanText && !hasValidAudio) {
      this._lastDiagnostics.method = 'ui_fallback';
      this._lastDiagnostics.fallbackReason = 'empty_input';
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
      this._lastDiagnostics.method = 'audio_file';
      if (this._currentButton) {
        this._lockButton(this._currentButton);
      }

      let audio;
      try {
        audio = new AudioConstructor(safeAudioUrl);
        const effectiveAudioRate = this._getEffectiveSpeechRate(rate, true);
        if (effectiveAudioRate !== 1.0) {
          try {
            audio.playbackRate = effectiveAudioRate;
          } catch (_) {}
        }
        this._activeAudio = audio;
      } catch (audioInitErr) {
        this._activeAudio = null;
        this._lastDiagnostics.audioPlayResult = 'init_error';
        this._lastDiagnostics.audioErrorName = audioInitErr?.name || 'Error';
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

      audio.onplaying = () => {
        this._lastDiagnostics.audioPlayResult = 'playing';
      };

      audio.onended = () => {
        this._activeAudio = null;
        this._lastDiagnostics.audioPlayResult = 'ended';
        if (typeof onEnd === 'function') {
          try { onEnd(); } catch (_) {}
        }
        finish({ success: true, method: 'audio_file' });
      };

      let fallbackInitiated = false;
      const handleAudioError = (e) => {
        // Ignore AbortError when playback was intentionally stopped by pause()/cancel()
        if (e && (e.name === 'AbortError' || (typeof e.message === 'string' && e.message.includes('interrupted by a call to pause')))) {
          this._lastDiagnostics.audioPlayResult = 'aborted';
          this._lastDiagnostics.audioErrorName = 'AbortError';
          finish({ success: false, method: 'audio_file', message: 'Playback canceled' });
          return;
        }
        if (fallbackInitiated) return;
        fallbackInitiated = true;

        this._lastDiagnostics.audioPlayResult = 'error';
        this._lastDiagnostics.audioErrorName = e?.name || e?.target?.error?.code || 'MediaError';
        this._lastDiagnostics.fallbackReason = e?.message || 'Audio playback failed';

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
              this._lastDiagnostics.audioPlayResult = 'aborted';
              this._lastDiagnostics.audioErrorName = 'AbortError';
              finish({ success: false, method: 'audio_file', message: 'Playback canceled' });
              return;
            }
            handleAudioError(err);
          });
        }
      } catch (err) {
        if (err && (err.name === 'AbortError' || (typeof err.message === 'string' && err.message.includes('interrupted by a call to pause')))) {
          this._lastDiagnostics.audioPlayResult = 'aborted';
          this._lastDiagnostics.audioErrorName = 'AbortError';
          finish({ success: false, method: 'audio_file', message: 'Playback canceled' });
        } else {
          handleAudioError(err);
        }
      }

      this._setSafetyTimeout(() => {
        if (this._state === SpeechState.SPEAKING && this._activeAudio === audio) {
          console.warn('[SpeechController] Audio safety timeout reached, releasing button lock');
          this._lastDiagnostics.audioPlayResult = 'timeout';
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
   * Handles delayed voiceschanged loading and verifies Chinese (zh/cmn) voice availability
   * when the browser enumerates voices, preventing silent fake playback on mobile/desktop.
   * @private
   */
  _executeTier2OrTier3({ cleanText, button, lang, rate, pitch, onEnd, onError, reason }) {
    if (cleanText && isSpeechSynthesisAvailable()) {
      const synth = window.speechSynthesis;
      const initialVoices = this._getAvailableVoices();
      const supportsAsyncVoices = typeof synth.addEventListener === 'function' || 'onvoiceschanged' in synth;

      // Case A: Voices are initially empty AND waitForVoicesOnEmpty is enabled -> wait briefly for voiceschanged
      if (initialVoices.length === 0 && supportsAsyncVoices && this._waitForVoicesOnEmpty && this._voiceLoadTimeoutMs > 0) {
        this._state = SpeechState.SPEAKING;
        this._currentButton = button || null;
        this._currentText = cleanText;
        if (this._currentButton) {
          this._lockButton(this._currentButton);
        }

        let promiseResolve;
        const prom = new Promise((resolve) => {
          promiseResolve = resolve;
        });
        prom.success = true;
        prom.method = 'web_speech';

        let canceledWhileWaiting = false;
        this._activeSpeechSettle = (result) => {
          canceledWhileWaiting = true;
          if (promiseResolve) {
            promiseResolve(result);
            promiseResolve = null;
          }
        };

        this._waitForVoicesIfEmpty().then((loadedVoices) => {
          if (canceledWhileWaiting || this._state !== SpeechState.SPEAKING) {
            return;
          }
          if (loadedVoices.length > 0 && !this._getChineseVoice()) {
            this._activeSpeechSettle = null;
            this._lastDiagnostics.method = 'ui_fallback';
            this._lastDiagnostics.fallbackReason = 'no_chinese_voice_after_voiceschanged';
            this._executeTier3ToastFallback({
              button,
              onError,
              title: 'Thiếu giọng đọc tiếng Trung',
              toastMessage: 'Thiết bị hoặc trình duyệt chưa cài đặt gói giọng đọc tiếng Trung (zh-CN).',
              message: 'Chinese voice unavailable'
            }).then((res) => {
              if (promiseResolve) {
                promiseResolve(res);
                promiseResolve = null;
              }
            });
            return;
          }

          this._dispatchTier2Speech({
            cleanText,
            button,
            lang,
            rate,
            pitch,
            onEnd,
            onError,
            promiseResolve: (res) => {
              if (promiseResolve) {
                promiseResolve(res);
                promiseResolve = null;
              }
            }
          });
        });

        return prom;
      }

      // Case B: Browser has enumerated voices (voices.length > 0), verify Chinese voice exists
      if (initialVoices.length > 0 && !this._getChineseVoice()) {
        this._lastDiagnostics.method = 'ui_fallback';
        this._lastDiagnostics.fallbackReason = 'no_chinese_voice';
        return this._executeTier3ToastFallback({
          button,
          onError,
          title: 'Thiếu giọng đọc tiếng Trung',
          toastMessage: 'Thiết bị hoặc trình duyệt chưa cài đặt gói giọng đọc tiếng Trung (zh-CN).',
          message: 'Chinese voice unavailable'
        });
      }

      // Case C: Chinese voice is available (or environment does not enumerate voices) -> synchronous dispatch
      let promiseResolve;
      const prom = new Promise((resolve) => {
        promiseResolve = resolve;
      });
      prom.success = true;
      prom.method = 'web_speech';

      const dispatched = this._dispatchTier2Speech({
        cleanText,
        button,
        lang,
        rate,
        pitch,
        onEnd,
        onError,
        promiseResolve: (res) => {
          if (promiseResolve) {
            promiseResolve(res);
            promiseResolve = null;
          }
        }
      });

      if (!dispatched) {
        this._activeSpeechSettle = null;
        return this._executeTier3ToastFallback({
          button,
          onError,
          message: 'Web Speech dispatch returned false',
          suppressToast: true
        });
      }

      return prom;
    }

    // TIER 3: Informative Toast Fallback (Never fail silently!)
    this._lastDiagnostics.method = 'ui_fallback';
    this._lastDiagnostics.fallbackReason = reason || 'speech_synthesis_unavailable';
    return this._executeTier3ToastFallback({ button, onError, message: reason });
  }

  /**
   * Internal helper to wire Tier 2 callbacks and invoke _speakUtterance.
   * @private
   */
  _dispatchTier2Speech({ cleanText, button, lang, rate, pitch, onEnd, onError, promiseResolve }) {
    this._lastDiagnostics.method = 'web_speech';
    this._activeSpeechSettle = (result) => {
      promiseResolve(result);
    };

    const wrappedOnEnd = () => {
      this._activeSpeechSettle = null;
      if (typeof onEnd === 'function') {
        try { onEnd(); } catch (_) {}
      }
      promiseResolve({ success: true, method: 'web_speech' });
    };

    const wrappedOnError = (e) => {
      this._activeSpeechSettle = null;
      const errType = e?.error || 'unknown';
      const isCanceled = (errType === 'canceled' || errType === 'interrupted');

      if (typeof onError === 'function') {
        try { onError(e); } catch (_) {}
      }
      promiseResolve({
        success: false,
        method: isCanceled ? 'web_speech' : 'ui_fallback',
        message: isCanceled ? 'Speech canceled' : (e?.error || e?.message || 'Speech synthesis error')
      });
    };

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
      promiseResolve({
        success: false,
        method: 'ui_fallback',
        message: 'Web Speech dispatch returned false'
      });
    }

    return dispatched;
  }

  /**
   * Tier 3 UI Notification fallback: Displays informative toast and unlocks UI cleanly.
   * @private
   */
  _executeTier3ToastFallback({
    button,
    onError,
    title = 'Không thể phát âm thanh',
    toastMessage = 'Không tìm thấy file phát âm và thiết bị chưa hỗ trợ tổng hợp giọng nói tiếng Trung.',
    message = '',
    suppressToast = false
  }) {
    this._cleanup(true);
    if (!suppressToast) {
      this._showThrottledToast(title, toastMessage, 'warning');
    }
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
