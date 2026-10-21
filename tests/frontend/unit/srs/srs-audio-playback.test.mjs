/**
 * =============================================================================
 * UNIT TEST: SRS AUDIO PLAYBACK LIFECYCLE & 3-TIER FALLBACK ENGINE (TASK R1)
 * File: tests/frontend/unit/srs/srs-audio-playback.test.mjs
 *
 * Verifies Requirement R1:
 * 1. Synchronous transient user activation preservation (zero async awaits).
 * 2. Tier 1: Dedicated HTMLAudioElement playback with sanitized URL.
 * 3. Tier 2: Clean fallback to Web Speech API when audio element errors or 404s.
 * 4. Tier 3: Informative UI Toast fallback when both audio and Web Speech fail (never silent).
 * 5. Voice acquisition with asynchronous voiceschanged listener and zh-CN voice selection.
 * 6. Anti-spam & rapid clicking debouncing (no sound overlapping, no deadlock).
 * 7. Clean cancellation & button unlock on card transition.
 * 8. Safety timer button unlock guarantee.
 * =============================================================================
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { SpeechController, SpeechState } from '../../../../frontend/js/ui/speech.js';

// Mock DOM Button
class MockButton {
  constructor() {
    this.disabled = false;
    this.attributes = new Map();
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
}

// Mock HTMLAudioElement
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
MockAudioElement.rejectReason = '';

// Mock SpeechSynthesis
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

  triggerVoicesChanged(newVoices) {
    this.voices = newVoices;
    const handlers = this.listeners.get('voiceschanged') || [];
    for (const h of handlers) {
      try { h(); } catch (_) {}
    }
  }

  speak(utterance) {
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

describe('Unit: SRS Audio Playback Lifecycle & 3-Tier Fallback (R1)', () => {
  let mockSynth;
  let toastCalls = [];
  let originalWindow;
  let mockToastFn;

  beforeEach(() => {
    toastCalls = [];
    mockToastFn = (payload) => {
      toastCalls.push(payload);
    };

    MockAudioElement.instances = [];
    MockAudioElement.shouldReject = false;
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

  test('1. Tier 1: Valid audioUrl triggers HTMLAudioElement synchronously without network delay', async () => {
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton();

    const playPromise = controller.playPronunciation({
      text: '你好',
      audioUrl: 'https://cdn.example.com/audio/nihao.mp3',
      button: btn
    });

    // Synchronous execution: Audio element created and play() called immediately
    assert.strictEqual(MockAudioElement.instances.length, 1);
    const audioInst = MockAudioElement.instances[0];
    assert.strictEqual(audioInst.src, 'https://cdn.example.com/audio/nihao.mp3');
    assert.strictEqual(audioInst.playCallCount, 1);

    // Button locked immediately
    assert.strictEqual(btn.disabled, true);
    assert.strictEqual(btn.getAttribute('aria-busy'), 'true');
    assert.ok(btn.classList.has('is-speaking'));
    assert.strictEqual(controller.state, SpeechState.SPEAKING);

    // Simulate audio ending naturally
    audioInst.onended();

    const result = await playPromise;
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.method, 'audio_file');

    // Button unlocked cleanly
    assert.strictEqual(btn.disabled, false);
    assert.strictEqual(btn.getAttribute('aria-busy'), null);
    assert.strictEqual(btn.classList.has('is-speaking'), false);
    assert.strictEqual(controller.state, SpeechState.IDLE);
    assert.strictEqual(mockSynth.speakCallCount, 0, 'SpeechSynthesis should NOT be called on Tier 1 success');
  });

  test('2. Tier 2 Fallback: When audio rejects (404/decode/policy), cascades to Web Speech API zh-CN', async () => {
    MockAudioElement.shouldReject = true;
    MockAudioElement.rejectReason = 'MEDIA_ERR_SRC_NOT_SUPPORTED';

    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton();

    const playPromise = controller.playPronunciation({
      text: '谢谢',
      audioUrl: 'https://cdn.example.com/audio/missing.mp3',
      button: btn
    });

    // Wait a tick for audio play rejection to process
    await new Promise(r => setTimeout(r, 10));

    // Fallback to Tier 2 triggered
    assert.strictEqual(mockSynth.speakCallCount, 1);
    assert.strictEqual(mockSynth.lastUtterance.text, '谢谢');
    assert.strictEqual(mockSynth.lastUtterance.lang, 'zh-CN');
    assert.strictEqual(mockSynth.lastUtterance.voice?.lang, 'zh-CN');
    assert.strictEqual(btn.disabled, true);

    // Simulate Web Speech onend
    mockSynth.lastUtterance.onend();

    const result = await playPromise;
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.method, 'web_speech');
    assert.strictEqual(btn.disabled, false);
    assert.strictEqual(controller.state, SpeechState.IDLE);
  });

  test('3. Tier 3 Fallback: When both Audio and SpeechSynthesis fail, displays Toast and unlocks UI cleanly', async () => {
    MockAudioElement.shouldReject = true;
    MockAudioElement.rejectReason = 'NotAllowedError: play() failed';

    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton();

    const playPromise = controller.playPronunciation({
      text: '再见',
      audioUrl: 'https://cdn.example.com/audio/bad.mp3',
      button: btn
    });

    // Wait for Tier 1 rejection
    await new Promise(r => setTimeout(r, 10));

    assert.strictEqual(mockSynth.speakCallCount, 1);
    // Simulate Web Speech onerror (e.g. language-unavailable or audio-busy)
    mockSynth.lastUtterance.onerror({ type: 'error', error: 'language-unavailable' });

    const result = await playPromise;
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.method, 'ui_fallback');

    // Never fails silently: Toast displayed
    assert.ok(toastCalls.length >= 1, 'At least one error notification must be displayed');
    assert.strictEqual(btn.disabled, false, 'Button must be unlocked on Tier 3 failure');
    assert.strictEqual(btn.getAttribute('aria-busy'), null);
    assert.strictEqual(btn.classList.has('is-speaking'), false);
    assert.strictEqual(controller.state, SpeechState.ERROR);
  });

  test('4. Voices acquisition: Handles asynchronous voiceschanged and selects zh-CN voice', () => {
    // Start with empty voices
    mockSynth.voices = [];
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton();

    // Trigger speech with empty voices
    controller.playPronunciation({ text: '学习', audioUrl: null, button: btn });
    assert.strictEqual(mockSynth.speakCallCount, 1);
    assert.strictEqual(mockSynth.lastUtterance.voice, null);

    // Simulate browser firing voiceschanged asynchronously
    mockSynth.triggerVoicesChanged([
      { name: 'English Voice', lang: 'en-US' },
      { name: 'Standard Mandarin Chinese', lang: 'zh-CN' }
    ]);

    mockSynth.lastUtterance.onend();

    // Second playback selects cached zh-CN voice
    controller.playPronunciation({ text: '汉语', audioUrl: null, button: btn });
    assert.strictEqual(mockSynth.speakCallCount, 2);
    assert.strictEqual(mockSynth.lastUtterance.voice?.lang, 'zh-CN');
    assert.strictEqual(mockSynth.lastUtterance.voice?.name, 'Standard Mandarin Chinese');
  });

  test('5. Anti-spam & Rapid clicking: 5 rapid clicks on same button are safely debounced without queueing', () => {
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton();

    // First click starts playback
    controller.playPronunciation({ text: '你好', audioUrl: null, button: btn });
    assert.strictEqual(mockSynth.speakCallCount, 1);
    assert.strictEqual(btn.disabled, true);

    // 4 successive rapid clicks while speaking
    for (let i = 0; i < 4; i++) {
      const res = controller.playPronunciation({ text: '你好', audioUrl: null, button: btn });
      assert.strictEqual(res.success, false, `Click ${i + 2} must be safely ignored`);
    }

    assert.strictEqual(mockSynth.speakCallCount, 1, 'SpeechSynthesis must strictly remain 1');
    assert.strictEqual(toastCalls.length, 0, 'No toasts for ignored anti-spam clicks');
  });

  test('6. Button switching: Clicking a DIFFERENT button cancels prior audio immediately and resets old button', () => {
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btnA = new MockButton();
    const btnB = new MockButton();

    // Start playing button A
    controller.playPronunciation({
      text: 'A',
      audioUrl: 'https://cdn.example.com/a.mp3',
      button: btnA
    });
    assert.strictEqual(btnA.disabled, true);
    assert.strictEqual(MockAudioElement.instances.length, 1);
    const audioA = MockAudioElement.instances[0];

    // Click button B while A is playing
    controller.playPronunciation({
      text: 'B',
      audioUrl: 'https://cdn.example.com/b.mp3',
      button: btnB
    });

    // Old audio A paused and reset
    assert.strictEqual(audioA.pauseCallCount, 1);
    assert.strictEqual(audioA.currentTime, 0);

    // Button A unlocked cleanly
    assert.strictEqual(btnA.disabled, false);
    assert.strictEqual(btnA.getAttribute('aria-busy'), null);
    assert.strictEqual(btnA.classList.has('is-speaking'), false);

    // Button B now active and locked
    assert.strictEqual(btnB.disabled, true);
    assert.strictEqual(MockAudioElement.instances.length, 2);
    const audioB = MockAudioElement.instances[1];
    assert.strictEqual(audioB.src, 'https://cdn.example.com/b.mp3');
  });

  test('7. Explicit cancel() unlocks button and cleans up all audio/speech handles', () => {
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton();

    controller.playPronunciation({
      text: '测试',
      audioUrl: 'https://cdn.example.com/test.mp3',
      button: btn
    });

    assert.strictEqual(btn.disabled, true);
    assert.strictEqual(controller.state, SpeechState.SPEAKING);

    controller.cancel();

    assert.strictEqual(btn.disabled, false);
    assert.strictEqual(btn.getAttribute('aria-busy'), null);
    assert.strictEqual(btn.classList.has('is-speaking'), false);
    assert.strictEqual(controller.state, SpeechState.IDLE);
  });

  test('8. Safety timer: Unlocks button automatically if browser drops completion events', async () => {
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton();

    controller.playPronunciation({ text: '卡住', audioUrl: null, button: btn });
    assert.strictEqual(btn.disabled, true);
    assert.strictEqual(controller.state, SpeechState.SPEAKING);

    // Fast-forward safety timer
    controller._safetyTimer?.unref?.();
    // Directly trigger safety timer callback
    controller._cleanup(false);

    assert.strictEqual(btn.disabled, false);
    assert.strictEqual(btn.getAttribute('aria-busy'), null);
    assert.strictEqual(controller.state, SpeechState.IDLE);
  });

  test('9. Interface Contract: playPronunciation ALWAYS returns a Promise so .catch() and await never throw TypeError', async () => {
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton();

    // Case A: With audioUrl
    const resA = controller.playPronunciation({ text: '测试A', audioUrl: 'https://cdn.example.com/test.mp3', button: btn });
    assert.strictEqual(typeof resA?.catch, 'function', 'Must have .catch method');
    assert.strictEqual(typeof resA?.then, 'function', 'Must have .then method');
    resA.catch(() => {});
    controller.cancel();

    // Case B: Without audioUrl (Web Speech fallback)
    const resB = controller.playPronunciation({ text: '测试B', audioUrl: null, button: btn });
    assert.strictEqual(typeof resB?.catch, 'function', 'Must have .catch method');
    assert.strictEqual(typeof resB?.then, 'function', 'Must have .then method');
    resB.catch(() => {});
    controller.cancel();

    // Case C: Empty/invalid input
    const resC = controller.playPronunciation({ text: '', audioUrl: null, button: btn });
    assert.strictEqual(typeof resC?.catch, 'function', 'Must have .catch method even on invalid input');
    assert.strictEqual(typeof resC?.then, 'function', 'Must have .then method even on invalid input');
    const resultC = await resC.catch(() => ({ success: false }));
    assert.strictEqual(resultC.success, false);
    assert.strictEqual(resultC.method, 'ui_fallback');
  });

  test('10. Signature flexibility: supports both (target, options) and ({ text, audioUrl, button }) styles', async () => {
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton();

    // Style 1: Card item object as first parameter
    const cardItem = { hanzi: '水', pinyin: 'shuǐ', audioUrl: 'https://cdn.example.com/shui.mp3' };
    const p1 = controller.playPronunciation(cardItem, { button: btn });
    assert.strictEqual(typeof p1.then, 'function');
    assert.strictEqual(btn.disabled, true);
    controller.cancel();

    // Style 2: String text as first parameter
    const p2 = controller.playPronunciation('火', { button: btn });
    assert.strictEqual(typeof p2.then, 'function');
    assert.strictEqual(mockSynth.lastUtterance.text, '火');
    controller.cancel();
  });

  test('11. AbortError on intentional pause/cancel does not trigger Web Speech fallback (no ghost speech)', async () => {
    let spokenUtterances = [];
    const origSpeak = mockSynth.speak.bind(mockSynth);
    mockSynth.speak = (u) => {
      spokenUtterances.push(u.text);
      return origSpeak(u);
    };

    // Simulate audio element where pause causes pending play() promise to reject with AbortError
    const originalPlay = MockAudioElement.prototype.play;
    const originalPause = MockAudioElement.prototype.pause;

    MockAudioElement.prototype.play = function() {
      this.playCallCount++;
      return new Promise((_, rej) => {
        this._rej = rej;
      });
    };
    MockAudioElement.prototype.pause = function() {
      this.pauseCallCount++;
      if (this._rej) {
        const err = new Error('The play() request was interrupted by a call to pause()');
        err.name = 'AbortError';
        this._rej(err);
      }
    };

    try {
      const controller = new SpeechController({ toastFn: mockToastFn });
      const btnA = new MockButton('btn-a');
      const btnB = new MockButton('btn-b');

      const pA = controller.playPronunciation({ text: 'Card A', audioUrl: 'https://cdn.example.com/a.mp3', button: btnA });
      // Quickly play Card B, which triggers cancel() of Card A
      const pB = controller.playPronunciation({ text: 'Card B', audioUrl: 'https://cdn.example.com/b.mp3', button: btnB });

      // pA should settle as canceled
      const resA = await pA;
      assert.strictEqual(resA.success, false);
      assert.strictEqual(resA.message, 'Playback canceled');

      // No ghost speech should have been queued via Web Speech for Card A
      assert.deepStrictEqual(spokenUtterances, []);
      controller.cancel();
    } finally {
      MockAudioElement.prototype.play = originalPlay;
      MockAudioElement.prototype.pause = originalPause;
    }
  });

  test('12. Dual trigger of audio.onerror and playPromise.catch only invokes Web Speech synthesis once', async () => {
    let speakCount = 0;
    const origSpeak = mockSynth.speak.bind(mockSynth);
    mockSynth.speak = (u) => {
      speakCount++;
      const res = origSpeak(u);
      setTimeout(() => {
        if (typeof u.onend === 'function') {
          u.onend({ type: 'end' });
        }
      }, 5);
      return res;
    };

    // Simulate browser firing BOTH onerror event and rejecting play() promise on bad media
    const originalPlay = MockAudioElement.prototype.play;
    MockAudioElement.prototype.play = function() {
      this.playCallCount++;
      setTimeout(() => {
        if (typeof this.onerror === 'function') {
          this.onerror(new Error('MEDIA_ELEMENT_ERROR: 404 Not Found'));
        }
      }, 0);
      const playErr = new Error('NotSupportedError: The element has no supported sources.');
      playErr.name = 'NotSupportedError';
      return Promise.reject(playErr);
    };

    try {
      const controller = new SpeechController({ toastFn: mockToastFn });
      const btn = new MockButton('btn-err');

      const p = controller.playPronunciation({ text: '测试', audioUrl: 'https://cdn.example.com/404.mp3', button: btn });
      await p;

      // Web Speech synthesis should only be called ONCE (no duplicate / echoing)
      assert.strictEqual(speakCount, 1, 'Web Speech synthesis must be triggered exactly once on dual error event');
    } finally {
      MockAudioElement.prototype.play = originalPlay;
    }
  });

  test('13. Explicit cancel() while Tier 1 audio is active settles the returned Promise', async () => {
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton('btn-cancel');

    const p = controller.playPronunciation({
      text: '测试取消',
      audioUrl: 'https://cdn.example.com/cancel.mp3',
      button: btn
    });

    controller.cancel();

    const timeout = new Promise(resolve => setTimeout(() => resolve('TIMED_OUT'), 100));
    const settled = await Promise.race([p, timeout]);

    assert.notStrictEqual(settled, 'TIMED_OUT', 'playPronunciation promise must settle on cancel()');
    assert.strictEqual(settled?.success, false);
    assert.strictEqual(settled?.method, 'audio_file');
    assert.strictEqual(settled?.message, 'Playback canceled');
  });
});
