/**
 * =============================================================================
 * ADVERSARIAL AUDIO PLAYBACK LIFECYCLE & HANG PREVENTION SUITE
 * File: tests/frontend/unit/srs/srs-audio-adversarial.test.mjs
 *
 * Verifies non-hanging lifecycle on unresolving audio/speech mock promises.
 * =============================================================================
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { SpeechController, SpeechState } from '../../../../frontend/js/ui/speech.js';

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
  setAttribute(name, val) { this.attributes.set(name, String(val)); }
  removeAttribute(name) { this.attributes.delete(name); }
  getAttribute(name) { return this.attributes.get(name) || null; }
}

describe('Adversarial Mock Audio Playback: Zero-Hang Contract', () => {
  let originalWindow;

  beforeEach(() => {
    originalWindow = globalThis.window;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  test('Never hangs when play() promise never settles and cancel() is invoked', async () => {
    globalThis.window = {
      Audio: class {
        constructor(src) { this.src = src; }
        play() {
          return new Promise(() => {}); // Intentionally unresolving
        }
        pause() {}
      },
      speechSynthesis: {
        speaking: false,
        paused: false,
        getVoices: () => [],
        cancel: () => {},
        speak: () => {}
      },
      SpeechSynthesisUtterance: class {}
    };

    const ctrl = new SpeechController();
    const button = new MockButton();

    const p = ctrl.playPronunciation({
      text: '防假死测试',
      audioUrl: 'https://cdn.example.com/audio.mp3',
      button
    });

    assert.strictEqual(ctrl.state, SpeechState.SPEAKING);
    assert.strictEqual(button.disabled, true);

    // cancel() must resolve the promise without hanging
    ctrl.cancel();

    const result = await Promise.race([
      p,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Promise hung')), 500))
    ]);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.method, 'audio_file');
    assert.strictEqual(ctrl.state, SpeechState.IDLE);
    assert.strictEqual(button.disabled, false);
  });

  test('Never hangs when Audio constructor throws synchronously', async () => {
    globalThis.window = {
      Audio: class {
        constructor() {
          throw new Error('Sync Audio instantiation failure');
        }
      },
      speechSynthesis: {
        speaking: false,
        paused: false,
        getVoices: () => [{ name: 'Alex', lang: 'en-US' }],
        cancel: () => {},
        speak: () => {}
      },
      SpeechSynthesisUtterance: class {}
    };

    const ctrl = new SpeechController();
    const button = new MockButton();

    const p = ctrl.playPronunciation({
      text: '同步抛异常',
      audioUrl: 'https://cdn.example.com/audio.mp3',
      button
    });

    const result = await Promise.race([
      p,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Promise hung')), 500))
    ]);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.method, 'ui_fallback');
    assert.strictEqual(ctrl.state, SpeechState.ERROR);
    assert.strictEqual(button.disabled, false);
  });
});
