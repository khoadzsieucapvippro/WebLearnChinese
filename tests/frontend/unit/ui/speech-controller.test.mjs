/**
 * =============================================================================
 * UNIT TEST: SPEECH CONTROLLER ANTI-SPAM & LIFECYCLE MANAGEMENT
 * File: tests/frontend/unit/ui/speech-controller.test.mjs
 *
 * Verifies:
 * 1. Single click starts speech exactly once.
 * 2. Rapid repeated clicks during speaking are strictly ignored (zero queueing, zero speak calls).
 * 3. Active button is locked (disabled, aria-busy="true", .is-speaking).
 * 4. End event cleanly unlocks active button and resets state to idle.
 * 5. Error event safely unlocks active button and avoids lockouts.
 * 6. Repeated errors/clicks do not produce toast storms (throttling cooldown).
 * 7. Switching items while speaking cleanly cancels the previous session before playing new.
 * =============================================================================
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { SpeechController } from '../../../../frontend/js/ui/speech.js';

// Mock MockButton Element
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

// Mock SpeechSynthesis
class MockSpeechSynthesis {
  constructor() {
    this.speaking = false;
    this.pending = false;
    this.paused = false;
    this.speakCallCount = 0;
    this.cancelCallCount = 0;
    this.lastUtterance = null;
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
    if (this.lastUtterance && this.lastUtterance.onerror) {
      // Browsers often fire error with 'canceled' or 'interrupted'
      this.lastUtterance.onerror({ type: 'error', error: 'canceled' });
    }
    this.lastUtterance = null;
  }
}

// Mock SpeechSynthesisUtterance
class MockUtterance {
  constructor(text) {
    this.text = text;
    this.lang = 'zh-CN';
    this.rate = 0.85;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }
}

describe('Unit: Speech Controller Anti-Spam & Lifecycle', () => {
  let mockSynth;
  let mockToastFn;
  let toastCalls = [];
  let originalWindow;

  beforeEach(() => {
    mockSynth = new MockSpeechSynthesis();
    toastCalls = [];
    mockToastFn = (payload) => {
      toastCalls.push(payload);
    };

    // Polyfill global window & speechSynthesis for node test environment
    originalWindow = globalThis.window;
    globalThis.window = {
      speechSynthesis: mockSynth,
      SpeechSynthesisUtterance: MockUtterance
    };
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  test('1. Click 1 time invokes speak exactly once', () => {
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton();

    const started = controller.speakHanzi('你好', { button: btn });
    assert.strictEqual(started, true);
    assert.strictEqual(mockSynth.speakCallCount, 1);
    assert.strictEqual(controller.state, 'speaking');
  });

  test('2. Multiple rapid clicks during speaking are strictly ignored without queueing', () => {
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton();

    // First click
    const firstCall = controller.speakHanzi('你好', { button: btn });
    assert.strictEqual(firstCall, true);
    assert.strictEqual(mockSynth.speakCallCount, 1);

    // Repeated clicks while speaking
    const secondCall = controller.speakHanzi('你好', { button: btn });
    const thirdCall = controller.speakHanzi('你好', { button: btn });
    const tenthCall = controller.speakHanzi('你好', { button: btn });

    assert.strictEqual(secondCall, false);
    assert.strictEqual(thirdCall, false);
    assert.strictEqual(tenthCall, false);
    assert.strictEqual(mockSynth.speakCallCount, 1, 'mockSynth.speak must strictly remain 1');
    assert.strictEqual(toastCalls.length, 0, 'No toasts generated on ignored clicks');
  });

  test('3. Active button is locked during speaking (disabled, aria-busy, class is-speaking)', () => {
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton();

    controller.speakHanzi('朋友', { button: btn });

    assert.strictEqual(btn.disabled, true);
    assert.strictEqual(btn.getAttribute('aria-busy'), 'true');
    assert.ok(btn.classList.has('is-speaking'));
  });

  test('4. End event cleanly unlocks button and transitions state back to idle', () => {
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton();

    controller.speakHanzi('中国', { button: btn });
    assert.strictEqual(btn.disabled, true);

    // Simulate browser onend event
    assert.ok(mockSynth.lastUtterance.onend, 'onend callback must be registered');
    mockSynth.lastUtterance.onend({ type: 'end' });

    assert.strictEqual(controller.state, 'idle');
    assert.strictEqual(btn.disabled, false);
    assert.strictEqual(btn.getAttribute('aria-busy'), null);
    assert.strictEqual(btn.classList.has('is-speaking'), false);
  });

  test('5. Error event safely unlocks button without permanent lock', () => {
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton();

    controller.speakHanzi('汉字', { button: btn });
    assert.strictEqual(btn.disabled, true);

    // Simulate browser onerror event
    assert.ok(mockSynth.lastUtterance.onerror, 'onerror callback must be registered');
    mockSynth.lastUtterance.onerror({ type: 'error', error: 'audio-busy' });

    assert.strictEqual(btn.disabled, false, 'Button must be unlocked on error');
    assert.strictEqual(btn.getAttribute('aria-busy'), null);
    assert.strictEqual(controller.state, 'error');
    assert.strictEqual(controller.isSpeaking, false);
    assert.strictEqual(toastCalls.length, 1, 'Single error toast emitted');
  });

  test('6. Repeated error clicks do not create a toast storm (throttling cooldown)', () => {
    const controller = new SpeechController({ toastFn: mockToastFn, toastCooldownMs: 2000 });
    const btn = new MockButton();

    // Trigger error 1
    controller.speakHanzi('词', { button: btn });
    mockSynth.lastUtterance.onerror({ type: 'error', error: 'network' });
    assert.strictEqual(toastCalls.length, 1);

    // Trigger error 2 within cooldown
    controller.speakHanzi('词', { button: btn });
    mockSynth.lastUtterance.onerror({ type: 'error', error: 'network' });
    assert.strictEqual(toastCalls.length, 1, 'Second error must not emit toast within cooldown');
  });

  test('7. Switching item cleanly cancels prior session and starts new item', () => {
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btnA = new MockButton();
    const btnB = new MockButton();

    // Item A starts speaking
    controller.speakHanzi('A', { button: btnA });
    assert.strictEqual(btnA.disabled, true);
    assert.strictEqual(controller.currentText, 'A');

    // User explicitly cancels or switches to item B
    controller.cancel();
    assert.strictEqual(btnA.disabled, false, 'Button A must be unlocked on cancel');
    assert.strictEqual(mockSynth.cancelCallCount, 1);

    // Now item B can speak cleanly
    const startedB = controller.speakHanzi('B', { button: btnB });
    assert.strictEqual(startedB, true);
    assert.strictEqual(btnB.disabled, true);
    assert.strictEqual(controller.currentText, 'B');
    assert.strictEqual(mockSynth.speakCallCount, 2);
  });

  test('8. playPronunciation falls back to speech synthesis when audioUrl is null', () => {
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton();

    controller.playPronunciation({
      text: '你好',
      audioUrl: null,
      button: btn
    });

    assert.strictEqual(btn.disabled, true);
    assert.strictEqual(btn.getAttribute('aria-busy'), 'true');
    assert.ok(btn.classList.has('is-speaking'));
    assert.strictEqual(mockSynth.speakCallCount, 1);
    assert.strictEqual(mockSynth.lastUtterance.text, '你好');
  });

  test('9. playPronunciation handles audio failure and falls back gracefully', () => {
    const controller = new SpeechController({ toastFn: mockToastFn });
    const btn = new MockButton();

    // Mock Audio in global/window
    class MockAudio {
      constructor(src) {
        this.src = src;
        this.onended = null;
        this.onerror = null;
      }
      play() {
        // Return a rejecting promise to simulate audio failure
        return Promise.reject(new Error('Audio load failed'));
      }
      pause() {}
    }
    const prevAudio = global.Audio;
    global.Audio = MockAudio;

    try {
      controller.playPronunciation({
        text: '谢谢',
        audioUrl: 'https://example.com/audio/test.mp3',
        button: btn
      });

      // Since Audio playback rejected, it should fallback to speech synthesis
      assert.strictEqual(mockSynth.speakCallCount, 1);
      assert.strictEqual(mockSynth.lastUtterance.text, '谢谢');
    } finally {
      global.Audio = prevAudio;
    }
  });
});

