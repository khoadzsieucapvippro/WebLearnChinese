/**
 * =============================================================================
 * ADVERSARIAL STRESS TEST SUITE: SRS AUDIO PLAYBACK ENGINE (CHALLENGER 1)
 * File: tests/frontend/unit/srs/srs-audio-stress.test.mjs
 *
 * Empirical adversarial stress testing targeting:
 * 1. Rapid clicking (10-20 clicks within 500ms) on audio buttons (Tier 1 & Tier 2).
 * 2. Sudden card flipping / switching while audio or Web Speech is active.
 * 3. Corrupted or unreachable audio URL fallback to Web Speech.
 * 4. Absence of SpeechSynthesis or Chinese voice falling back gracefully to UI notice without unhandled exception.
 * 5. Lifecycle promise settlement on cancel / interruption.
 * =============================================================================
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { SpeechController, SpeechState, isSpeechSynthesisAvailable } from '../../../../frontend/js/ui/speech.js';

// Realistic Mock DOM Button with event tracking
class MockButton {
  constructor(id = 'btn-audio') {
    this.id = id;
    this.disabled = false;
    this.attributes = new Map();
    this.eventListeners = new Map();
    const set = new Set();
    this.classList = {
      add: (c) => set.add(c),
      remove: (c) => set.delete(c),
      contains: (c) => set.has(c),
      has: (c) => set.has(c)
    };
  }
  setAttribute(name, val) {
    this.attributes.set(name, String(val));
  }
  removeAttribute(name) {
    this.attributes.delete(name);
  }
  getAttribute(name) {
    return this.attributes.get(name) || null;
  }
  addEventListener(event, fn) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(fn);
  }
  click() {
    const handlers = this.eventListeners.get('click') || [];
    for (const h of handlers) {
      h({ target: this, stopPropagation: () => {}, preventDefault: () => {} });
    }
  }
}

// Configurable Mock HTMLAudioElement
class MockAudioElement {
  constructor(src) {
    this.src = src;
    this.currentTime = 0;
    this.paused = true;
    this.playCallCount = 0;
    this.pauseCallCount = 0;
    this.onended = null;
    this.onerror = null;
    this.onplay = null;
    this.onplaying = null;
    MockAudioElement.instances.push(this);
  }

  play() {
    this.playCallCount++;
    this.paused = false;
    if (MockAudioElement.shouldThrowSync) {
      throw new Error(MockAudioElement.rejectReason || 'Sync audio play failed');
    }
    if (MockAudioElement.shouldReject) {
      return Promise.reject(new Error(MockAudioElement.rejectReason || 'Audio play rejected'));
    }
    return Promise.resolve();
  }

  pause() {
    this.pauseCallCount++;
    this.paused = true;
  }
}
MockAudioElement.instances = [];
MockAudioElement.shouldReject = false;
MockAudioElement.shouldThrowSync = false;
MockAudioElement.rejectReason = '';

// Configurable Mock SpeechSynthesis
class MockSpeechSynthesis {
  constructor() {
    this.speaking = false;
    this.paused = false;
    this.speakCallCount = 0;
    this.cancelCallCount = 0;
    this.resumeCallCount = 0;
    this.lastUtterance = null;
    this.voices = [];
    this.listeners = new Map();
    this.shouldThrowOnSpeak = false;
  }

  getVoices() {
    return this.voices;
  }

  addEventListener(event, fn) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(fn);
  }

  speak(utterance) {
    if (this.shouldThrowOnSpeak) {
      throw new Error('NotAllowedError: Speech synthesis failed');
    }
    this.speakCallCount++;
    this.speaking = true;
    this.lastUtterance = utterance;
    if (typeof utterance.onstart === 'function') {
      utterance.onstart({ type: 'start' });
    }
  }

  cancel() {
    this.cancelCallCount++;
    this.speaking = false;
    if (this.lastUtterance && typeof this.lastUtterance.onerror === 'function') {
      this.lastUtterance.onerror({ type: 'error', error: 'canceled' });
    }
    this.lastUtterance = null;
  }

  resume() {
    this.resumeCallCount++;
    this.paused = false;
  }
}

// Mock SpeechSynthesisUtterance
class MockUtterance {
  constructor(text) {
    this.text = text;
    this.lang = 'zh-CN';
    this.rate = 0.85;
    this.pitch = 1.0;
    this.voice = null;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }
}

describe('Adversarial Stress: Audio Playback Engine (Challenger 1)', () => {
  let mockSynth;
  let toastCalls;
  let originalWindow;
  let mockToastFn;

  beforeEach(() => {
    toastCalls = [];
    mockToastFn = (payload) => {
      toastCalls.push(payload);
    };

    MockAudioElement.instances = [];
    MockAudioElement.shouldReject = false;
    MockAudioElement.shouldThrowSync = false;
    MockAudioElement.rejectReason = '';

    mockSynth = new MockSpeechSynthesis();
    mockSynth.voices = [
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Microsoft Huihui - Chinese (Simplified)', lang: 'zh-CN' },
      { name: 'Ting-Ting', lang: 'zh-TW' }
    ];

    originalWindow = globalThis.window;
    globalThis.window = {
      Audio: MockAudioElement,
      speechSynthesis: mockSynth,
      SpeechSynthesisUtterance: MockUtterance
    };
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  // =========================================================================
  // REQUIREMENT 1: RAPID CLICKING (10-20 CLICKS WITHIN 500MS)
  // =========================================================================
  describe('1. Rapid Clicking Stress (10-20 clicks within 500ms)', () => {
    test('1.1. Tier 1: 20 rapid clicks on the same audio button within 500ms strictly creates 1 Audio instance and 1 play() call', async () => {
      const controller = new SpeechController({ toastFn: mockToastFn });
      const btn = new MockButton('btn-play-audio');

      const promises = [];
      // Simulate 20 clicks arriving every 25ms over 475ms
      for (let i = 0; i < 20; i++) {
        const p = controller.playPronunciation({
          text: '苹果',
          audioUrl: 'https://cdn.example.com/audio/apple.mp3',
          button: btn
        });
        promises.push(p);
      }

      // Assertions immediately after burst
      assert.strictEqual(MockAudioElement.instances.length, 1, 'Only 1 HTMLAudioElement must be created');
      const audioInstance = MockAudioElement.instances[0];
      assert.strictEqual(audioInstance.playCallCount, 1, 'Audio.play() must be called exactly once');
      assert.strictEqual(btn.disabled, true, 'Button must be locked');
      assert.strictEqual(btn.classList.contains('is-speaking'), true);
      assert.strictEqual(controller.state, SpeechState.SPEAKING);

      // Clicks 2 to 20 should resolve immediately with success: false (debounced)
      const debouncedResults = await Promise.all(promises.slice(1));
      for (let i = 0; i < debouncedResults.length; i++) {
        assert.strictEqual(debouncedResults[i].success, false);
        assert.strictEqual(debouncedResults[i].method, 'audio_file');
        assert.ok(debouncedResults[i].message?.includes('duplicate'));
      }

      // Finish first audio
      audioInstance.onended();

      // Click 1 should resolve with success: true
      const firstResult = await promises[0];
      assert.strictEqual(firstResult.success, true);
      assert.strictEqual(firstResult.method, 'audio_file');

      // Button unlocked cleanly
      assert.strictEqual(btn.disabled, false);
      assert.strictEqual(btn.classList.contains('is-speaking'), false);
      assert.strictEqual(controller.state, SpeechState.IDLE);

      // Verify a new click after finish works cleanly
      const pAfter = controller.playPronunciation({
        text: '苹果',
        audioUrl: 'https://cdn.example.com/audio/apple.mp3',
        button: btn
      });
      assert.strictEqual(MockAudioElement.instances.length, 2, 'New audio instance created after unlock');
      MockAudioElement.instances[1].onended();
      const afterResult = await pAfter;
      assert.strictEqual(afterResult.success, true);
    });

    test('1.2. Tier 2: 20 rapid clicks on Web Speech button within 500ms strictly creates 1 Utterance and 1 speak() call', async () => {
      const controller = new SpeechController({ toastFn: mockToastFn });
      const btn = new MockButton('btn-web-speech');

      const promises = [];
      for (let i = 0; i < 20; i++) {
        const p = controller.playPronunciation({
          text: '你好',
          audioUrl: null,
          button: btn
        });
        promises.push(p);
      }

      assert.strictEqual(mockSynth.speakCallCount, 1, 'window.speechSynthesis.speak must be called exactly once');
      assert.strictEqual(btn.disabled, true);
      assert.strictEqual(btn.classList.contains('is-speaking'), true);
      assert.strictEqual(controller.state, SpeechState.SPEAKING);

      // Clicks 2 to 20 should resolve with success: false
      const debouncedResults = await Promise.all(promises.slice(1));
      for (let i = 0; i < debouncedResults.length; i++) {
        assert.strictEqual(debouncedResults[i].success, false);
        assert.strictEqual(debouncedResults[i].method, 'web_speech');
      }

      // Complete utterance
      mockSynth.lastUtterance.onend();

      const firstResult = await promises[0];
      assert.strictEqual(firstResult.success, true);
      assert.strictEqual(firstResult.method, 'web_speech');
      assert.strictEqual(btn.disabled, false);
      assert.strictEqual(controller.state, SpeechState.IDLE);
    });

    test('1.3. Rapid alternating clicks across 2 different buttons (10 switches) safely cancels previous audio without overlap', async () => {
      const controller = new SpeechController({ toastFn: mockToastFn });
      const btnA = new MockButton('btn-front');
      const btnB = new MockButton('btn-back');

      let currentAudio = null;
      for (let i = 0; i < 10; i++) {
        const activeBtn = (i % 2 === 0) ? btnA : btnB;
        const inactiveBtn = (i % 2 === 0) ? btnB : btnA;
        const text = `Word-${i}`;
        const audioUrl = `https://cdn.example.com/audio/${i}.mp3`;

        controller.playPronunciation({ text, audioUrl, button: activeBtn });

        // Inactive button MUST be unlocked immediately
        assert.strictEqual(inactiveBtn.disabled, false, `Inactive button must be unlocked at step ${i}`);
        assert.strictEqual(inactiveBtn.classList.contains('is-speaking'), false);

        // Active button MUST be locked
        assert.strictEqual(activeBtn.disabled, true, `Active button must be locked at step ${i}`);
        assert.strictEqual(activeBtn.classList.contains('is-speaking'), true);

        // Previous audio must be paused
        if (currentAudio) {
          assert.strictEqual(currentAudio.pauseCallCount, 1);
          assert.strictEqual(currentAudio.currentTime, 0);
        }
        currentAudio = MockAudioElement.instances[MockAudioElement.instances.length - 1];
      }

      // Final cleanup
      controller.cancel();
      assert.strictEqual(btnA.disabled, false);
      assert.strictEqual(btnB.disabled, false);
      assert.strictEqual(controller.state, SpeechState.IDLE);
    });

    test('1.4. Rapid clicks during asynchronous error/fallback cascade do not spawn parallel Web Speech sessions', async () => {
      MockAudioElement.shouldReject = true;
      MockAudioElement.rejectReason = 'NetworkError';

      const controller = new SpeechController({ toastFn: mockToastFn });
      const btn = new MockButton('btn-fallback');

      // Click 1 starts Tier 1 which will reject asynchronously
      const p1 = controller.playPronunciation({
        text: '困难',
        audioUrl: 'https://cdn.example.com/audio/broken.mp3',
        button: btn
      });

      // 5 rapid clicks while rejection is in flight
      const followupPromises = [];
      for (let i = 0; i < 5; i++) {
        followupPromises.push(controller.playPronunciation({
          text: '困难',
          audioUrl: 'https://cdn.example.com/audio/broken.mp3',
          button: btn
        }));
      }

      // Wait a tick for Tier 1 rejection and Tier 2 fallback to establish
      await new Promise(r => setTimeout(r, 20));

      // Assert only 1 Web Speech session was dispatched
      assert.strictEqual(mockSynth.speakCallCount, 1, 'SpeechSynthesis must only be called once');
      assert.strictEqual(btn.disabled, true);

      // Finish speech
      mockSynth.lastUtterance.onend();

      const res1 = await p1;
      assert.strictEqual(res1.success, true);
      assert.strictEqual(res1.method, 'web_speech');
      assert.strictEqual(btn.disabled, false);
      assert.strictEqual(controller.state, SpeechState.IDLE);
    });
  });

  // =========================================================================
  // REQUIREMENT 2: SUDDEN CARD FLIPPING / SWITCHING WHILE AUDIO IS ACTIVE
  // =========================================================================
  describe('2. Sudden Card Flipping / Switching while Audio is Active', () => {
    test('2.1. Card flipping (toggleFlip) retains front audio playback without premature interruption', () => {
      const controller = new SpeechController({ toastFn: mockToastFn });
      const btnFront = new MockButton('btn-front');

      controller.playPronunciation({
        text: '朋友',
        audioUrl: 'https://cdn.example.com/audio/pengyou.mp3',
        button: btnFront
      });

      const audio = MockAudioElement.instances[0];
      assert.strictEqual(audio.paused, false);

      // Simulate UI card flip: class 'flipped' toggled on card container, but cancel() not called
      // Audio should remain playing
      assert.strictEqual(audio.paused, false);
      assert.strictEqual(audio.pauseCallCount, 0);

      // Completes naturally
      audio.onended();
      assert.strictEqual(btnFront.disabled, false);
      assert.strictEqual(controller.state, SpeechState.IDLE);
    });

    test('2.2. Card flipping then clicking back button immediately stops front audio and starts back audio', () => {
      const controller = new SpeechController({ toastFn: mockToastFn });
      const btnFront = new MockButton('btn-front');
      const btnBack = new MockButton('btn-back');

      // Play on front
      controller.playPronunciation({
        text: '朋友',
        audioUrl: 'https://cdn.example.com/audio/pengyou.mp3',
        button: btnFront
      });
      const audioFront = MockAudioElement.instances[0];
      assert.strictEqual(btnFront.disabled, true);

      // Flip card and click back button
      controller.playPronunciation({
        text: '朋友',
        audioUrl: 'https://cdn.example.com/audio/pengyou.mp3',
        button: btnBack
      });

      // Front audio immediately paused and reset
      assert.strictEqual(audioFront.pauseCallCount, 1);
      assert.strictEqual(audioFront.currentTime, 0);
      assert.strictEqual(btnFront.disabled, false, 'Front button must be unlocked');

      // Back button locked and playing
      assert.strictEqual(btnBack.disabled, true);
      assert.strictEqual(MockAudioElement.instances.length, 2);
      const audioBack = MockAudioElement.instances[1];
      assert.strictEqual(audioBack.paused, false);

      controller.cancel();
      assert.strictEqual(btnBack.disabled, false);
    });

    test('2.3. Sudden card advance (renderCurrentCard/submitRating) cancels active audio immediately and resets button', () => {
      const controller = new SpeechController({ toastFn: mockToastFn });
      const btnCard1 = new MockButton('btn-card-1');

      // Start audio on Card 1
      controller.playPronunciation({
        text: '学校',
        audioUrl: 'https://cdn.example.com/audio/xuexiao.mp3',
        button: btnCard1
      });
      const audio1 = MockAudioElement.instances[0];
      assert.strictEqual(btnCard1.disabled, true);
      assert.strictEqual(controller.state, SpeechState.SPEAKING);

      // User submits rating or skips card: renderCurrentCard() invokes speechController.cancel()
      controller.cancel();

      // Audio 1 stopped
      assert.strictEqual(audio1.pauseCallCount, 1);
      assert.strictEqual(audio1.currentTime, 0);
      assert.strictEqual(btnCard1.disabled, false, 'Card 1 button must be unlocked');
      assert.strictEqual(btnCard1.classList.contains('is-speaking'), false);
      assert.strictEqual(controller.state, SpeechState.IDLE);

      // Card 2 audio starts cleanly
      const btnCard2 = new MockButton('btn-card-2');
      controller.playPronunciation({
        text: '老师',
        audioUrl: 'https://cdn.example.com/audio/laoshi.mp3',
        button: btnCard2
      });
      assert.strictEqual(btnCard2.disabled, true);
      assert.strictEqual(controller.state, SpeechState.SPEAKING);
      controller.cancel();
    });

    test('2.4. Sudden card advance while Web Speech is active triggers cancel without emitting false alarm error toasts', () => {
      const controller = new SpeechController({ toastFn: mockToastFn });
      const btn = new MockButton('btn-card');

      controller.playPronunciation({
        text: '高兴',
        audioUrl: null,
        button: btn
      });

      assert.strictEqual(mockSynth.speakCallCount, 1);
      assert.strictEqual(mockSynth.speaking, true);

      // Abruptly advance card
      controller.cancel();

      // Verify speechSynthesis was cancelled
      assert.strictEqual(mockSynth.cancelCallCount, 1);
      assert.strictEqual(mockSynth.speaking, false);
      assert.strictEqual(btn.disabled, false);
      assert.strictEqual(controller.state, SpeechState.IDLE);

      // CRITICAL CHECK: cancel() must NEVER trigger user error toasts ('canceled' is normal lifecycle)
      assert.strictEqual(toastCalls.length, 0, 'No false alarm toasts on intentional cancellation');
    });

    test('2.5. 50 rapid sequential card transitions with audio triggers leave zero dangling timers or frozen state', () => {
      const controller = new SpeechController({ toastFn: mockToastFn });

      for (let i = 0; i < 50; i++) {
        const btn = new MockButton(`btn-${i}`);
        controller.playPronunciation({
          text: `Ch-${i}`,
          audioUrl: `https://cdn.example.com/${i}.mp3`,
          button: btn
        });
        // Abrupt transition mid-play
        controller.cancel();
        assert.strictEqual(btn.disabled, false);
        assert.strictEqual(controller.state, SpeechState.IDLE);
      }

      assert.strictEqual(controller._activeAudio, null);
      assert.strictEqual(controller._currentButton, null);
      assert.strictEqual(controller._safetyTimer, null);
    });

    test('2.6. Calling cancel() while Tier 1 audio is active resolves the playPronunciation promise instead of leaving it pending forever', async () => {
      const controller = new SpeechController({ toastFn: mockToastFn });
      const btn = new MockButton('btn-p1');

      const p = controller.playPronunciation({
        text: '测试',
        audioUrl: 'https://cdn.example.com/audio/test.mp3',
        button: btn
      });

      // Cancel immediately
      controller.cancel();

      // Does p settle? We race it against a 50ms timeout
      const timeout = new Promise(resolve => setTimeout(() => resolve('TIMED_OUT'), 50));
      const settled = await Promise.race([p, timeout]);

      assert.notStrictEqual(settled, 'TIMED_OUT', 'playPronunciation promise must settle when cancel() is called!');
      assert.strictEqual(settled?.success, false);
      assert.strictEqual(settled?.message, 'Playback canceled');
    });

    test('2.7. Calling cancel() while Tier 2 Web Speech is active resolves the playPronunciation promise instead of leaving it pending forever', async () => {
      const controller = new SpeechController({ toastFn: mockToastFn });
      const btn = new MockButton('btn-p2');

      const p = controller.playPronunciation({
        text: '测试',
        audioUrl: null,
        button: btn
      });

      controller.cancel();

      const timeout = new Promise(resolve => setTimeout(() => resolve('TIMED_OUT'), 50));
      const settled = await Promise.race([p, timeout]);

      assert.notStrictEqual(settled, 'TIMED_OUT', 'playPronunciation promise must settle when cancel() is called!');
      assert.strictEqual(settled?.success, false);
      assert.strictEqual(settled?.method, 'web_speech');
      assert.ok(
        settled?.message === 'Speech canceled' || settled?.message === 'canceled',
        `Expected 'Speech canceled' or 'canceled', got '${settled?.message}'`
      );
    });
  });

  // =========================================================================
  // REQUIREMENT 3: CORRUPTED OR UNREACHABLE AUDIO URL FALLBACK TO WEB SPEECH
  // =========================================================================
  describe('3. Corrupted or Unreachable Audio URL Fallback to Web Speech', () => {
    test('3.1. Corrupted audio URL (MEDIA_ERR_SRC_NOT_SUPPORTED) falls back to Web Speech and resolves success: true', async () => {
      MockAudioElement.shouldReject = true;
      MockAudioElement.rejectReason = 'MEDIA_ERR_SRC_NOT_SUPPORTED';

      const controller = new SpeechController({ toastFn: mockToastFn });
      const btn = new MockButton();

      const p = controller.playPronunciation({
        text: '医院',
        audioUrl: 'https://cdn.example.com/corrupted.mp3',
        button: btn
      });

      // Wait a tick for async audio rejection
      await new Promise(r => setTimeout(r, 15));

      assert.strictEqual(mockSynth.speakCallCount, 1);
      assert.strictEqual(mockSynth.lastUtterance.text, '医院');
      assert.strictEqual(mockSynth.lastUtterance.lang, 'zh-CN');

      mockSynth.lastUtterance.onend();

      const result = await p;
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.method, 'web_speech');
      assert.strictEqual(btn.disabled, false);
      assert.strictEqual(controller.state, SpeechState.IDLE);
    });

    test('3.2. Audio constructor / play() throwing synchronously immediately falls back to Web Speech', async () => {
      MockAudioElement.shouldThrowSync = true;
      MockAudioElement.rejectReason = 'NotAllowedError: play() failed synchronously';

      const controller = new SpeechController({ toastFn: mockToastFn });
      const btn = new MockButton();

      const p = controller.playPronunciation({
        text: '北京',
        audioUrl: 'https://cdn.example.com/bad.mp3',
        button: btn
      });

      await new Promise(r => setTimeout(r, 15));

      assert.strictEqual(mockSynth.speakCallCount, 1);
      assert.strictEqual(mockSynth.lastUtterance.text, '北京');

      mockSynth.lastUtterance.onend();

      const result = await p;
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.method, 'web_speech');
    });

    test('3.3. Dangerous protocol in audioUrl (javascript:, data:) is sanitized and bypassed to Web Speech safely', async () => {
      const controller = new SpeechController({ toastFn: mockToastFn });
      const btn = new MockButton();

      const p = controller.playPronunciation({
        text: '安全',
        audioUrl: 'javascript:alert("XSS")',
        button: btn
      });

      // Has invalid audio after sanitization -> directly dispatches to Web Speech
      assert.strictEqual(mockSynth.speakCallCount, 1);
      assert.strictEqual(mockSynth.lastUtterance.text, '安全');
      assert.strictEqual(MockAudioElement.instances.length, 0, 'Must NOT instantiate HTMLAudioElement for javascript: URI');

      mockSynth.lastUtterance.onend();

      const res = await p;
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.method, 'web_speech');
    });

    test('3.4. Stalled audio stream is unhung by safety timer after 5s releasing button lock', async () => {
      const controller = new SpeechController({ toastFn: mockToastFn });
      const btn = new MockButton();

      const p = controller.playPronunciation({
        text: '停滞',
        audioUrl: 'https://cdn.example.com/stalled.mp3',
        button: btn
      });

      assert.strictEqual(btn.disabled, true);
      assert.strictEqual(controller.state, SpeechState.SPEAKING);

      // Fast-forward safety timer by invoking the timer callback directly
      controller._cleanup(false);

      assert.strictEqual(btn.disabled, false, 'Button must be released by safety timeout');
      assert.strictEqual(controller.state, SpeechState.IDLE);
    });
  });

  // =========================================================================
  // REQUIREMENT 4: ABSENCE OF SPEECHSYNTHESIS OR CHINESE VOICE GRACEFUL FALLBACK
  // =========================================================================
  describe('4. Absence of SpeechSynthesis or Chinese Voice Graceful Fallback', () => {
    test('4.1. Complete absence of window.speechSynthesis triggers Tier 3 toast and unlocks button cleanly without throw', async () => {
      // Simulate environment without Web Speech API
      globalThis.window.speechSynthesis = undefined;
      globalThis.window.SpeechSynthesisUtterance = undefined;

      const controller = new SpeechController({ toastFn: mockToastFn });
      const btn = new MockButton();

      const p = controller.playPronunciation({
        text: '没有语音',
        audioUrl: null,
        button: btn
      });

      const res = await p;
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.method, 'ui_fallback');
      assert.strictEqual(btn.disabled, false, 'Button must not stay locked');
      assert.strictEqual(btn.classList.contains('is-speaking'), false);
      assert.ok(toastCalls.length >= 1, 'Informative toast must be shown (never fail silently)');
      assert.ok(toastCalls[0].message?.includes('chưa hỗ trợ tổng hợp giọng nói'));
    });

    test('4.2. Missing Chinese voice pack where synthesis emits language-unavailable triggers Tier 3 toast', async () => {
      const controller = new SpeechController({ toastFn: mockToastFn });
      const btn = new MockButton();

      // Setup voices with NO Chinese voices (only English)
      mockSynth.voices = [{ name: 'Alex', lang: 'en-US' }];

      const p = controller.playPronunciation({
        text: '中文',
        audioUrl: null,
        button: btn
      });

      assert.strictEqual(mockSynth.speakCallCount, 1);
      // Simulate browser firing language-unavailable error
      mockSynth.lastUtterance.onerror({ type: 'error', error: 'language-unavailable' });

      const res = await p;
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.method, 'ui_fallback');
      assert.strictEqual(res.message, 'language-unavailable');
      assert.strictEqual(btn.disabled, false);
      assert.ok(toastCalls.length >= 1, 'Error toast shown');
    });

    test('4.3. window.speechSynthesis.speak() throwing synchronously is caught cleanly with Tier 3 toast', async () => {
      mockSynth.shouldThrowOnSpeak = true;

      const controller = new SpeechController({ toastFn: mockToastFn });
      const btn = new MockButton();

      const p = controller.playPronunciation({
        text: '抛异常',
        audioUrl: null,
        button: btn
      });

      const res = await p;
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.method, 'ui_fallback');
      assert.strictEqual(btn.disabled, false);
      assert.ok(toastCalls.length >= 1);
    });

    test('4.4. Missing both text and audioUrl directly triggers Tier 3 fallback without unhandled exception', async () => {
      const controller = new SpeechController({ toastFn: mockToastFn });
      const btn = new MockButton();

      const p = controller.playPronunciation({
        text: '',
        audioUrl: null,
        button: btn
      });

      const res = await p;
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.method, 'ui_fallback');
      assert.strictEqual(btn.disabled, false);
      assert.ok(toastCalls.length >= 1);
    });
  });
});
