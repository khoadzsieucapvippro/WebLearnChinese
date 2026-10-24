/**
 * ADVERSARIAL STRESS TEST SUITE: SRS Reading Error Handling & Non-blocking Isolation
 * Author: teamwork_preview_challenger_m1_1 (EMPIRICAL CHALLENGER)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Install trap for legacy dialogs
function installDialogTraps() {
  const trap = (name) => () => {
    throw new Error(`VIOLATION: Legacy dialog ${name}() was called!`);
  };
  globalThis.alert = trap('alert');
  globalThis.confirm = trap('confirm');
  globalThis.prompt = trap('prompt');
  if (typeof window !== 'undefined') {
    window.alert = globalThis.alert;
    window.confirm = globalThis.confirm;
    window.prompt = globalThis.prompt;
  }
}

// Minimal Mock Factory
function makeEl(tag = 'div') {
  const classes = new Set();
  const attrs = new Map();
  const children = [];
  const listeners = {};
  const elObj = {
    tagName: tag.toUpperCase(),
    textContent: '',
    disabled: false,
    style: {},
    focusCalled: false,
    focus() { this.focusCalled = true; },
    blur() {},
    get className() { return Array.from(classes).join(' '); },
    set className(val) {
      classes.clear();
      if (typeof val === 'string') val.split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
    },
    classList: {
      add: (...cls) => cls.forEach(c => classes.add(c)),
      remove: (...cls) => cls.forEach(c => classes.delete(c)),
      toggle: (c, force) => {
        if (force === undefined) {
          if (classes.has(c)) { classes.delete(c); return false; }
          else { classes.add(c); return true; }
        }
        if (force) { classes.add(c); return true; }
        else { classes.delete(c); return false; }
      },
      contains: (c) => classes.has(c)
    },
    setAttribute: (k, v) => attrs.set(k, String(v)),
    getAttribute: (k) => attrs.get(k) ?? null,
    removeAttribute: (k) => attrs.delete(k),
    addEventListener: (evt, fn) => {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    },
    removeEventListener: (evt, fn) => {
      if (listeners[evt]) listeners[evt] = listeners[evt].filter(f => f !== fn);
    },
    appendChild: (ch) => { children.push(ch); return ch; },
    querySelectorAll: (sel) => {
      const res = [];
      function walk(node) {
        if (sel.startsWith('.') && node.classList && node.classList.contains(sel.slice(1))) {
          res.push(node);
        }
        if (node.children) {
          for (const c of node.children) walk(c);
        }
      }
      for (const c of children) walk(c);
      return res;
    },
    querySelector: (sel) => {
      return elObj.querySelectorAll(sel)[0] || null;
    },
    children
  };
  return elObj;
}

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    body: makeEl('body'),
    createElement: (tag) => makeEl(tag),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  };
}

// Import module under test
import { SrsReviewController } from '../frontend/js/pages/srs-review-page.js';

describe('Adversarial Stress Test: SRS Reading Error Handling & Legacy Dialog Absence', () => {
  beforeEach(() => {
    installDialogTraps();
  });

  test('Trap verification: invoking legacy dialog immediately throws violation', () => {
    assert.throws(() => globalThis.alert('test'), /VIOLATION: Legacy dialog alert\(\) was called/);
    assert.throws(() => globalThis.confirm('test'), /VIOLATION: Legacy dialog confirm\(\) was called/);
    assert.throws(() => globalThis.prompt('test'), /VIOLATION: Legacy dialog prompt\(\) was called/);
  });

  test('showReadingError safely handles adversarial inputs without throwing or injecting HTML', () => {
    const ctrl = Object.create(SrsReviewController.prototype);
    ctrl.dom = {
      readingErrorTitle: makeEl('h4'),
      readingErrorMessage: makeEl('p'),
      readingErrorAdvice: makeEl('p'),
      readingPinyinMeaningBox: makeEl('div'),
      btnReadingSkipOnError: makeEl('button'),
      btnReadingNext: makeEl('button')
    };
    ctrl.setReadingState = (st) => { ctrl.state = st; };

    // 1. Adversarial HTML / XSS Injection strings
    const xssTitle = '<script>alert("hacked")</script>';
    const xssMessage = '<img src=x onerror=alert(1)>';
    const xssAdvice = '<b>Click <a href="javascript:alert(1)">here</a></b>';

    assert.doesNotThrow(() => {
      ctrl.showReadingError(xssTitle, xssMessage, xssAdvice);
    });

    assert.equal(ctrl.dom.readingErrorTitle.textContent, xssTitle, 'Must set textContent literally, not innerHTML');
    assert.equal(ctrl.dom.readingErrorMessage.textContent, xssMessage, 'Must set textContent literally');
    assert.equal(ctrl.dom.readingErrorAdvice.textContent, xssAdvice, 'Must set textContent literally');
    assert.equal(ctrl.dom.btnReadingSkipOnError.disabled, false, 'Skip button must be enabled');
    assert.equal(ctrl.dom.btnReadingNext.classList.contains('writing-next-hidden'), true, 'Next button must be hidden in error');

    // 2. Null / undefined / empty arguments
    assert.doesNotThrow(() => {
      ctrl.showReadingError(null, undefined, null);
    });

    // 3. 10,000 character stress payload
    const longPayload = 'A'.repeat(10000);
    assert.doesNotThrow(() => {
      ctrl.showReadingError(longPayload, longPayload, longPayload);
    });
    assert.equal(ctrl.dom.readingErrorTitle.textContent.length, 10000);
  });

  test('handleAssessmentResponse handles all edge statuses without throwing or calling alert', () => {
    const ctrl = Object.create(SrsReviewController.prototype);
    ctrl.dom = {
      readingErrorTitle: makeEl('h4'),
      readingErrorMessage: makeEl('p'),
      readingErrorAdvice: makeEl('p'),
      readingPinyinMeaningBox: makeEl('div'),
      btnReadingSkipOnError: makeEl('button'),
      btnReadingNext: makeEl('button'),
      readingOverallScoreBadge: makeEl('div'),
      readingResultSummary: makeEl('div'),
      readingComponentsWrapper: makeEl('div')
    };
    ctrl.setReadingState = (st) => { ctrl.state = st; };
    const dummyCard = { hanzi: '水', pinyin: 'shuǐ' };

    const edgeResponses = [
      null,
      undefined,
      {},
      { status: 'UNCONFIGURED' },
      { status: 'QUOTA_EXCEEDED' },
      { status: 'engine_unavailable' },
      { status: 'ENGINE_UNAVAILABLE' },
      { status: 'cold_start' },
      { status: 'coldStartWakingUp' },
      { status: 'NOT_SCORABLE', summaryVi: 'Không nghe thấy âm thanh' },
      { status: 'UNKNOWN_RANDOM_500' },
      { status: 503 },
      { status: false },
      { status: 'SCORED', overallScore: null },
      { status: 'assessed', overallScore: undefined, components: null }
    ];

    for (const resp of edgeResponses) {
      assert.doesNotThrow(() => {
        ctrl.handleAssessmentResponse(resp, dummyCard);
      }, `Failed handling response: ${JSON.stringify(resp)}`);
    }
  });

  test('handleRecordingFinished catches short audio blobs cleanly', async () => {
    const ctrl = Object.create(SrsReviewController.prototype);
    ctrl.dom = {
      readingErrorTitle: makeEl('h4'),
      readingErrorMessage: makeEl('p'),
      readingErrorAdvice: makeEl('p'),
      readingPinyinMeaningBox: makeEl('div'),
      btnReadingSkipOnError: makeEl('button'),
      btnReadingNext: makeEl('button')
    };
    ctrl.setReadingState = (st) => { ctrl.state = st; };
    ctrl.sessionQueue = [{ card: { hanzi: '人', itemId: 1 } }];
    ctrl.currentIndex = 0;

    // 1. Audio blob null
    await assert.doesNotReject(async () => {
      await ctrl.handleRecordingFinished(null);
    });
    assert.equal(ctrl.dom.readingErrorTitle.textContent, 'Bản ghi âm quá ngắn');

    // 2. Audio blob size too small (< 500)
    await assert.doesNotReject(async () => {
      await ctrl.handleRecordingFinished({ size: 100 });
    });
    assert.equal(ctrl.dom.readingErrorTitle.textContent, 'Bản ghi âm quá ngắn');
  });

  test('skipReadingCard transitions cleanly without freezing session or throwing', () => {
    let renderedCount = 0;
    let completedCalled = false;

    const ctrl = Object.create(SrsReviewController.prototype);
    ctrl.dom = {
      readingErrorTitle: makeEl('h4'),
      readingErrorMessage: makeEl('p'),
      readingErrorAdvice: makeEl('p'),
      readingPinyinMeaningBox: makeEl('div'),
      btnReadingSkipOnError: makeEl('button'),
      btnReadingNext: makeEl('button')
    };
    ctrl.sessionQueue = [
      { card: { hanzi: '一' } },
      { card: { hanzi: '二' } }
    ];
    ctrl.currentIndex = 0;
    ctrl.isReviewMode = false;
    ctrl.persistProgress = () => {};
    ctrl.cleanUpReadingMedia = () => {};
    ctrl.renderCurrentCard = () => { renderedCount++; };
    ctrl.showCompletedState = () => { completedCalled = true; };

    // Skip card 0 -> transitions to card 1
    assert.doesNotThrow(() => {
      ctrl.skipReadingCard();
    });
    assert.equal(ctrl.currentIndex, 1);
    assert.equal(renderedCount, 1);
    assert.equal(completedCalled, false);

    // Skip card 1 -> reaches completed state
    assert.doesNotThrow(() => {
      ctrl.skipReadingCard();
    });
    assert.equal(ctrl.currentIndex, 2);
    assert.equal(completedCalled, true);
  });
});
