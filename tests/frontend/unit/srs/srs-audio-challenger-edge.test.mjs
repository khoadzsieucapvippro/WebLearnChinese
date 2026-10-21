/**
 * =============================================================================
 * ADVERSARIAL CHALLENGER EDGE & STRESS PROBE (CHALLENGER 1 - ITERATION 2)
 * File: tests/frontend/unit/srs/srs-audio-challenger-edge.test.mjs
 *
 * Empirical verification of edge cases, race conditions, and invariants:
 * 1. Concurrent cancellations and rapid interleaved cancel() invocations.
 * 2. Late-arriving audio.onerror / audio.onended after cancel().
 * 3. Double-fault cascading (Audio sync throws -> SpeechSynthesis sync throws).
 * 4. Microtask race: cancel() called immediately before/after playPromise settlement.
 * 5. Button DOM state resilience: button never remains stuck disabled.
 * 6. Non-throwing contract: All calls settle to standard response object without throwing.
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

describe('Adversarial Challenger Edge Probes: SpeechController', () => {
  let originalWindow;

  beforeEach(() => {
    originalWindow = globalThis.window;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  test('Edge 1: cancel() immediately clears audio listeners and prevents ghost speech', async () => {
    let speakCalls = 0;
    let audioInstance = null;

    globalThis.window = {
      Audio: class {
        constructor(src) {
          this.src = src;
          audioInstance = this;
        }
        play() {
          return new Promise(() => {}); // never settles
        }
        pause() {}
      },
      speechSynthesis: {
        speaking: false,
        paused: false,
        getVoices: () => [],
        cancel: () => {},
        resume: () => {},
        speak: () => { speakCalls++; }
      },
      SpeechSynthesisUtterance: class {
        constructor(t) { this.text = t; }
      }
    };

    const ctrl = new SpeechController();
    const button = new MockButton();

    const promise = ctrl.playPronunciation({
      text: '你好',
      audioUrl: 'https://example.com/audio.mp3',
      button
    });

    assert.strictEqual(ctrl.state, SpeechState.SPEAKING);
    assert.strictEqual(typeof audioInstance.onerror, 'function');
    assert.strictEqual(typeof audioInstance.onended, 'function');

    // Cancel while playing
    ctrl.cancel();
    assert.strictEqual(ctrl.state, SpeechState.IDLE);
    assert.strictEqual(button.disabled, false);

    // Audio element listeners must be cleanly detached
    assert.strictEqual(audioInstance.onerror, null, 'onerror must be detached');
    assert.strictEqual(audioInstance.onended, null, 'onended must be detached');

    const res = await promise;
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.method, 'audio_file');
    assert.strictEqual(res.message, 'Playback canceled');

    // Wait a tick to ensure no async fallback happened
    await new Promise((r) => setTimeout(r, 20));

    assert.strictEqual(speakCalls, 0, 'No ghost Web Speech triggered');
    assert.strictEqual(ctrl.state, SpeechState.IDLE, 'State must remain IDLE');
    assert.strictEqual(button.disabled, false);
  });

  test('Edge 2: Double-fault cascading (Audio throws sync AND Speech throws sync) settles cleanly to ui_fallback', async () => {
    globalThis.window = {
      Audio: class {
        constructor() {
          throw new Error('Audio constructor crashed synchronously');
        }
      },
      speechSynthesis: {
        speaking: false,
        paused: false,
        getVoices: () => [],
        cancel: () => {},
        speak: () => {
          throw new Error('speechSynthesis.speak crashed synchronously');
        }
      },
      SpeechSynthesisUtterance: class {}
    };

    const ctrl = new SpeechController();
    const button = new MockButton();

    let res;
    assert.doesNotThrow(async () => {
      res = await ctrl.playPronunciation({
        text: '测试',
        audioUrl: 'https://example.com/test.mp3',
        button
      });
    });

    res = await ctrl.playPronunciation({
      text: '测试',
      audioUrl: 'https://example.com/test.mp3',
      button
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.method, 'ui_fallback');
    assert.strictEqual(ctrl.state, SpeechState.ERROR, 'State is ERROR on total failure');
    assert.strictEqual(button.disabled, false, 'Button must be unlocked despite ERROR state');
  });

  test('Edge 3: 50 concurrent rapid cancel() calls during microtask transition leave no unhandled rejection', async () => {
    let playResolve;
    globalThis.window = {
      Audio: class {
        play() {
          return new Promise((resolve) => {
            playResolve = resolve;
          });
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
      text: '快速点击',
      audioUrl: 'https://example.com/audio.mp3',
      button
    });

    // Fire 50 cancels concurrently
    for (let i = 0; i < 50; i++) {
      ctrl.cancel();
    }

    const res = await p;
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.method, 'audio_file');
    assert.strictEqual(ctrl.state, SpeechState.IDLE);
    assert.strictEqual(button.disabled, false);

    // Resolve play promise late
    if (playResolve) playResolve();
    await new Promise((r) => setTimeout(r, 10));

    assert.strictEqual(ctrl.state, SpeechState.IDLE);
  });

  test('Edge 4: Repeated alternating cancel() and playPronunciation() on rapid card flip', async () => {
    let activeAudioInstance = null;
    globalThis.window = {
      Audio: class {
        constructor(src) {
          this.src = src;
          activeAudioInstance = this;
        }
        play() {
          return new Promise((resolve, reject) => {
            this._reject = reject;
          });
        }
        pause() {
          if (this._reject) {
            const err = new Error('The play() request was interrupted by a call to pause()');
            err.name = 'AbortError';
            this._reject(err);
          }
        }
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

    const results = [];
    for (let i = 0; i < 15; i++) {
      const p = ctrl.playPronunciation({
        text: `Word ${i}`,
        audioUrl: `https://example.com/${i}.mp3`,
        button
      });
      results.push(p);
      if (i % 2 === 0) {
        ctrl.cancel();
      }
    }

    // Finally cancel
    ctrl.cancel();

    const settled = await Promise.all(results);
    for (const r of settled) {
      assert.strictEqual(typeof r.success, 'boolean');
      assert.ok(['audio_file', 'web_speech', 'ui_fallback'].includes(r.method));
    }

    assert.strictEqual(ctrl.state, SpeechState.IDLE);
    assert.strictEqual(button.disabled, false);
  });
});
