/**
 * =============================================================================
 * UNIT TEST: UI PRIMITIVES CONTRACT (3-STATE UI, TOAST, MODAL)
 * Verifies state machine transitions, attributes, and options contract.
 * =============================================================================
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

// Lightweight in-memory DOM simulation for Node.js unit testing of pure UI primitives
class MockElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.attrs = {};
    this._className = '';
    this.classList = {
      _classes: new Set(),
      add: (c) => {
        this.classList._classes.add(c);
        this._className = Array.from(this.classList._classes).join(' ');
      },
      remove: (c) => {
        this.classList._classes.delete(c);
        this._className = Array.from(this.classList._classes).join(' ');
      },
      contains: (c) => this.classList._classes.has(c)
    };
    this.textContent = '';
    this.listeners = {};
  }

  set className(val) {
    this._className = val || '';
    this.classList._classes.clear();
    if (this._className) {
      this._className.split(/\s+/).filter(Boolean).forEach(c => this.classList._classes.add(c));
    }
  }

  get className() {
    return this._className || '';
  }

  setAttribute(key, value) {
    this.attrs[key] = String(value);
  }

  getAttribute(key) {
    return this.attrs[key] || null;
  }

  removeAttribute(key) {
    delete this.attrs[key];
  }

  appendChild(child) {
    this.children.push(child);
  }

  replaceChildren(...children) {
    this.children = [...children];
  }

  addEventListener(event, handler) {
    this.listeners[event] = handler;
  }

  querySelector(selector) {
    // Simple selector resolution for unit checks
    return this.children.find(c => c instanceof MockElement) || null;
  }
}

// Setup environment globals prior to importing UI primitives
globalThis.Node = MockElement;
globalThis.HTMLElement = MockElement;
globalThis.document = {
  createElement: (tag) => new MockElement(tag),
  createElementNS: (ns, tag) => new MockElement(tag),
  createTextNode: (text) => {
    const el = new MockElement('#text');
    el.textContent = text;
    return el;
  },
  getElementById: (id) => null
};

// Dynamic import after globals are established
const { setComponentState, showLoading, showEmpty, showError, createSpeakerIcon, createSpeechButton } = await import('../../../../frontend/js/ui/ui.js');

describe('Unit: UI Primitives & Three-State Engine Contract', () => {

  test('showLoading sets aria-busy="true" and polite role="status"', () => {
    const container = new MockElement('div');
    showLoading(container, { message: 'Đang tải bộ thủ...' });

    assert.strictEqual(container.getAttribute('aria-busy'), 'true');
    assert.strictEqual(container.children.length, 1);

    const wrapper = container.children[0];
    assert.strictEqual(wrapper.getAttribute('role'), 'status');
    assert.strictEqual(wrapper.getAttribute('aria-live'), 'polite');
  });

  test('showEmpty clears aria-busy and renders empty glyph and title', () => {
    const container = new MockElement('div');
    container.setAttribute('aria-busy', 'true');

    showEmpty(container, {
      glyph: '空',
      title: 'Không tìm thấy dữ liệu',
      description: 'Thử tìm từ khóa khác.'
    });

    assert.strictEqual(container.getAttribute('aria-busy'), null, 'Must remove aria-busy attribute on empty');
    assert.strictEqual(container.children.length, 1);
  });

  test('showError clears aria-busy and establishes role="alert" for immediate AT notice', () => {
    const container = new MockElement('div');
    container.setAttribute('aria-busy', 'true');

    showError(container, {
      title: 'Lỗi kết nối máy chủ',
      message: 'Vui lòng kiểm tra lại đường truyền mạng.',
      onRetry: () => {}
    });

    assert.strictEqual(container.getAttribute('aria-busy'), null, 'Must remove aria-busy attribute on error');
    assert.strictEqual(container.children.length, 1);
    const wrapper = container.children[0];
    assert.strictEqual(wrapper.getAttribute('role'), 'alert', 'Error state must have role="alert" (WCAG live region)');
  });

  test('setComponentState cleanly switches across state machine transitions', () => {
    const container = new MockElement('div');

    // 1. Transition: READY -> LOADING
    setComponentState(container, 'LOADING');
    assert.strictEqual(container.getAttribute('aria-busy'), 'true');

    // 2. Transition: LOADING -> EMPTY
    setComponentState(container, 'EMPTY');
    assert.strictEqual(container.getAttribute('aria-busy'), null);

    // 3. Transition: EMPTY -> ERROR
    setComponentState(container, 'ERROR', { title: 'Network Error' });
    assert.strictEqual(container.getAttribute('aria-busy'), null);

    // 4. Transition: ERROR -> READY
    setComponentState(container, 'READY');
    assert.strictEqual(container.getAttribute('aria-busy'), null);
    assert.strictEqual(container.children.length, 0, 'READY state clears temporary state banners');
  });

  test('createSpeakerIcon creates safe SVG icon with polygon and sound waves matching design system', () => {
    const icon16 = createSpeakerIcon(16);
    assert.strictEqual(icon16.tagName, 'svg');
    assert.strictEqual(icon16.getAttribute('width'), '16');
    assert.strictEqual(icon16.getAttribute('height'), '16');
    assert.strictEqual(icon16.getAttribute('viewBox'), '0 0 24 24');
    assert.strictEqual(icon16.getAttribute('fill'), 'none');
    assert.strictEqual(icon16.getAttribute('stroke'), 'currentColor');
    assert.strictEqual(icon16.getAttribute('aria-hidden'), 'true');
    assert.strictEqual(icon16.children.length, 2);

    const polygon = icon16.children[0];
    assert.strictEqual(polygon.tagName, 'polygon');
    assert.strictEqual(polygon.getAttribute('points'), '11 5 6 9 2 9 2 15 6 15 11 19 11 5');

    const path = icon16.children[1];
    assert.strictEqual(path.tagName, 'path');
    assert.strictEqual(path.getAttribute('d'), 'M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07');

    // Custom size support
    const icon20 = createSpeakerIcon(20);
    assert.strictEqual(icon20.getAttribute('width'), '20');
    assert.strictEqual(icon20.getAttribute('height'), '20');
  });

  test('createSpeechButton generates standardized circular button matching .vocab-speech-btn contract', () => {
    let clicked = false;
    const btn = createSpeechButton({
      id: 'testSpeechBtn',
      className: 'custom-speech-class',
      ariaLabel: 'Phát âm từ 你好',
      title: 'Phát âm: 你好',
      iconSize: 16,
      onClick: () => { clicked = true; }
    });

    assert.strictEqual(btn.tagName, 'button');
    assert.strictEqual(btn.getAttribute('type'), 'button');
    assert.strictEqual(btn.id, 'testSpeechBtn');
    assert.ok(btn.classList.contains('vocab-speech-btn'));
    assert.ok(btn.classList.contains('custom-speech-class'));
    assert.strictEqual(btn.getAttribute('aria-label'), 'Phát âm từ 你好');
    assert.strictEqual(btn.getAttribute('title'), 'Phát âm: 你好');
    assert.strictEqual(btn.children.length, 1);
    assert.strictEqual(btn.children[0].tagName, 'svg');

    // Click handler invocation
    assert.strictEqual(typeof btn.listeners['click'], 'function');
    btn.listeners['click']();
    assert.strictEqual(clicked, true);
  });

});
