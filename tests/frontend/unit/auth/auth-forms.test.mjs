/**
 * =============================================================================
 * UNIT TEST: AUTHENTICATION FORMS, REDIRECT SECURITY & NAVIGATION (TASK 9B.1)
 * File: tests/frontend/unit/auth/auth-forms.test.mjs
 * 
 * Verifies:
 * - Login & Registration form validation constraints matching backend.
 * - Open Redirect defense on ?redirect= parameter (CWE-601).
 * - Profile edit form validation and avatar resource URL sanitization.
 * - Session-aware navigation rendering (Guest vs Authenticated states).
 * - Role representation and localization mapping.
 * =============================================================================
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { 
  validateLoginForm, 
  validateRegisterForm, 
  validateInternalRedirect 
} from '../../../../frontend/js/pages/auth-page.js';

import { 
  validateProfileForm, 
  formatCreatedAt,
  processAvatarFile
} from '../../../../frontend/js/pages/profile-page.js';
import { setupPasswordToggle } from '../../../../frontend/js/ui/ui.js';
import fsPromises from 'node:fs/promises';

import { 
  getRoleLabel, 
  getRoleBadgeClass, 
  getPrimaryRole,
  renderNavbarAuth 
} from '../../../../frontend/js/ui/nav.js';

import { authManager } from '../../../../frontend/js/auth/auth-state.js';

// In-memory mock storage and DOM for headless node testing
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

class MockElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.className = '';
    this.textContent = '';
    this.children = [];
    this.attributes = new Map();
    this.eventListeners = new Map();
  }

  get classList() {
    const self = this;
    return {
      contains: (cls) => self.className.split(/\s+/).includes(cls),
      add: (...clss) => {
        const set = new Set(self.className.split(/\s+/).filter(Boolean));
        clss.forEach(c => set.add(c));
        self.className = Array.from(set).join(' ');
      },
      remove: (...clss) => {
        const set = new Set(self.className.split(/\s+/).filter(Boolean));
        clss.forEach(c => set.delete(c));
        self.className = Array.from(set).join(' ');
      }
    };
  }

  setAttribute(name, val) {
    this.attributes.set(name, String(val));
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  appendChild(child) {
    this.children.push(child);
  }

  replaceChildren(...children) {
    this.children = [...children];
  }

  querySelector(selector) {
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      return this._findChild(el => el.getAttribute?.('id') === id);
    }
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      return this._findChild(el => el.classList?.contains?.(cls));
    }
    return null;
  }

  _findChild(predicate) {
    for (const child of this.children) {
      if (child instanceof MockElement) {
        if (predicate(child)) return child;
        const nested = child._findChild(predicate);
        if (nested) return nested;
      }
    }
    return null;
  }

  addEventListener(type, fn) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type).add(fn);
  }
}

describe('Authentication Form Validation & Business Constraints', () => {

  describe('Login Form Validation', () => {
    test('rejects empty credentials', () => {
      const result = validateLoginForm('', '');
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.emailOrPhone);
      assert.ok(result.errors.password);
    });

    test('rejects emailOrPhone exceeding 191 characters', () => {
      const longIdentifier = 'a'.repeat(192) + '@example.com';
      const result = validateLoginForm(longIdentifier, 'validpass123');
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.emailOrPhone.includes('191'));
    });

    test('accepts valid email and password inputs', () => {
      const result = validateLoginForm('learner@test.local', 'password123');
      assert.strictEqual(result.isValid, true);
      assert.deepStrictEqual(result.errors, {});
    });

    test('accepts valid phone number input', () => {
      const result = validateLoginForm('0912345678', 'securePass123');
      assert.strictEqual(result.isValid, true);
      assert.deepStrictEqual(result.errors, {});
    });
  });

  describe('Registration Form Validation', () => {
    test('rejects empty registration fields', () => {
      const result = validateRegisterForm('', '', '');
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.fullName);
      assert.ok(result.errors.emailOrPhone);
      assert.ok(result.errors.password);
    });

    test('rejects password shorter than 6 characters', () => {
      const result = validateRegisterForm('Nguyen Van A', 'test@example.com', '12345');
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.password.includes('6'));
    });

    test('rejects password longer than 100 characters', () => {
      const result = validateRegisterForm('Nguyen Van A', 'test@example.com', 'a'.repeat(101));
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.password.includes('100'));
    });

    test('rejects fullName longer than 100 characters', () => {
      const result = validateRegisterForm('a'.repeat(101), 'test@example.com', 'validpass');
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.fullName.includes('100'));
    });

    test('accepts valid registration payload matching backend constraints', () => {
      const result = validateRegisterForm('Nguyen Van A', 'nguyenvana@example.com', 'SuperSecret!123');
      assert.strictEqual(result.isValid, true);
      assert.deepStrictEqual(result.errors, {});
    });
  });

  describe('Redirect Security (Open Redirect Prevention CWE-601)', () => {
    test('defaults to index.html when redirect parameter is null or empty', () => {
      assert.strictEqual(validateInternalRedirect(null), 'index.html');
      assert.strictEqual(validateInternalRedirect(''), 'index.html');
      assert.strictEqual(validateInternalRedirect('   '), 'index.html');
    });

    test('permits legitimate internal relative paths', () => {
      assert.strictEqual(validateInternalRedirect('profile.html'), 'profile.html');
      assert.strictEqual(validateInternalRedirect('/profile.html'), 'profile.html');
      assert.strictEqual(validateInternalRedirect('radicals.html?category=nature#top'), 'radicals.html?category=nature#top');
      assert.strictEqual(validateInternalRedirect('/lessons.html?id=42'), 'lessons.html?id=42');
    });

    test('strictly rejects external origin URLs', () => {
      assert.strictEqual(validateInternalRedirect('https://evil.example.com'), 'index.html');
      assert.strictEqual(validateInternalRedirect('http://attacker.org/phishing'), 'index.html');
      assert.strictEqual(validateInternalRedirect('https://google.com'), 'index.html');
    });

    test('strictly rejects protocol-relative URLs (//evil.example)', () => {
      assert.strictEqual(validateInternalRedirect('//evil.example.com'), 'index.html');
      assert.strictEqual(validateInternalRedirect('//attacker.org/test'), 'index.html');
    });

    test('strictly rejects executable pseudo-schemes (javascript:, data:, vbscript:)', () => {
      assert.strictEqual(validateInternalRedirect('javascript:alert(document.cookie)'), 'index.html');
      assert.strictEqual(validateInternalRedirect('JAVASCRIPT:alert(1)'), 'index.html');
      assert.strictEqual(validateInternalRedirect('data:text/html,<script>alert(1)</script>'), 'index.html');
      assert.strictEqual(validateInternalRedirect('vbscript:msgbox(1)'), 'index.html');
    });
  });

  describe('Profile Form Validation & Resource URL Sanitization', () => {
    test('rejects empty fullName in profile update', () => {
      const result = validateProfileForm('', 'https://example.com/avatar.jpg');
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.fullName);
    });

    test('rejects fullName exceeding 100 characters', () => {
      const result = validateProfileForm('x'.repeat(101));
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.fullName.includes('100'));
    });

    test('permits optional empty avatarUrl', () => {
      const result = validateProfileForm('Valid Name', '');
      assert.strictEqual(result.isValid, true);
      assert.deepStrictEqual(result.errors, {});
    });

    test('rejects unsafe avatar URLs', () => {
      const dangerous = validateProfileForm('Valid Name', 'javascript:alert(1)');
      assert.strictEqual(dangerous.isValid, false);
      assert.ok(dangerous.errors.avatarUrl);

      const protoRelative = validateProfileForm('Valid Name', '//attacker.com/pic.jpg');
      assert.strictEqual(protoRelative.isValid, false);
      assert.ok(protoRelative.errors.avatarUrl);
    });

    test('accepts valid http/https avatar URL within 500 characters', () => {
      const result = validateProfileForm('Học Viên Mẫu', 'https://example.com/avatars/user123.jpg');
      assert.strictEqual(result.isValid, true);
      assert.deepStrictEqual(result.errors, {});
    });

    test('formatCreatedAt gracefully handles null and ISO dates', () => {
      assert.strictEqual(formatCreatedAt(null), '---');
      assert.strictEqual(formatCreatedAt(''), '---');
      const formatted = formatCreatedAt('2026-01-15T10:30:00Z');
      assert.ok(formatted.includes('2026') || formatted.includes('15'));
    });
  });

  describe('Session-Aware Navigation Component (nav.js)', () => {
    let originalStorage;
    let originalDoc;
    let originalWindow;
    let mockStorage;

    beforeEach(() => {
      mockStorage = new MockLocalStorage();
      originalStorage = globalThis.localStorage;
      originalDoc = globalThis.document;
      originalWindow = globalThis.window;
      originalNode = globalThis.Node;

      globalThis.localStorage = mockStorage;
      globalThis.Node = MockElement;

      globalThis.document = {
        createElement: (tag) => new MockElement(tag),
        createTextNode: (text) => text
      };

      globalThis.window = {
        location: { origin: 'http://localhost', pathname: '/index.html' },
        dispatchEvent: () => true,
        addEventListener: () => {},
        removeEventListener: () => {}
      };
    });

    let originalNode;

    afterEach(() => {
      globalThis.localStorage = originalStorage;
      globalThis.document = originalDoc;
      globalThis.window = originalWindow;
      globalThis.Node = originalNode;
    });

    test('role localization correctly maps all backend roles to scholarly Vietnamese', () => {
      assert.strictEqual(getRoleLabel('Learner'), 'Học viên');
      assert.strictEqual(getRoleLabel('Creator'), 'Tác giả');
      assert.strictEqual(getRoleLabel('Moderator'), 'Kiểm duyệt');
      assert.strictEqual(getRoleLabel('Admin'), 'Quản trị');
      assert.strictEqual(getRoleLabel(null), 'Học viên');
    });

    test('role badge classes provide distinct visual cues', () => {
      assert.ok(getRoleBadgeClass('Admin').includes('badge-status-approved'));
      assert.ok(getRoleBadgeClass('Moderator').includes('badge-status-active'));
      assert.ok(getRoleBadgeClass('Creator').includes('badge-status-pending'));
      assert.ok(getRoleBadgeClass('Learner').includes('badge-status-draft'));
    });

    test('renderNavbarAuth renders Guest actions when unauthenticated', () => {
      const container = new MockElement('div');
      renderNavbarAuth(container);

      const loginBtn = container.querySelector('#navLoginBtn');
      const registerBtn = container.querySelector('#navRegisterBtn');
      assert.ok(loginBtn, 'Must render login button for guest');
      assert.ok(registerBtn, 'Must render register button for guest');
      assert.strictEqual(loginBtn.textContent, 'Đăng nhập');
      assert.strictEqual(registerBtn.textContent, 'Đăng ký');
      assert.strictEqual(loginBtn.getAttribute('aria-current'), null);
      assert.strictEqual(registerBtn.getAttribute('aria-current'), null);
    });

    test('renderNavbarAuth assigns active state and aria-current on register.html', () => {
      globalThis.window.location.pathname = '/register.html';
      const container = new MockElement('div');
      renderNavbarAuth(container);

      const registerBtn = container.querySelector('#navRegisterBtn');
      const loginBtn = container.querySelector('#navLoginBtn');
      assert.strictEqual(registerBtn.textContent, 'Đăng ký');
      assert.strictEqual(registerBtn.getAttribute('aria-current'), 'page');
      assert.ok(registerBtn.classList.contains('active'));
      assert.strictEqual(loginBtn.getAttribute('aria-current'), null);
      assert.ok(!loginBtn.classList.contains('active'));
    });

    test('renderNavbarAuth assigns active state and aria-current on login.html', () => {
      globalThis.window.location.pathname = '/login.html';
      const container = new MockElement('div');
      renderNavbarAuth(container);

      const registerBtn = container.querySelector('#navRegisterBtn');
      const loginBtn = container.querySelector('#navLoginBtn');
      assert.strictEqual(loginBtn.textContent, 'Đăng nhập');
      assert.strictEqual(loginBtn.getAttribute('aria-current'), 'page');
      assert.ok(loginBtn.classList.contains('active'));
      assert.strictEqual(registerBtn.getAttribute('aria-current'), null);
      assert.ok(!registerBtn.classList.contains('active'));
    });

    test('renderNavbarAuth renders User Info, Role Badge, Profile link, and Logout when authenticated', () => {
      authManager.setSession({
        token: 'valid-jwt-token',
        accountId: 101,
        fullName: 'Lý Bạch',
        emailOrPhone: 'lybach@tang.cn',
        roles: ['Creator']
      });

      const container = new MockElement('div');
      renderNavbarAuth(container);

      const authSection = container.querySelector('#navAuthenticatedSection');
      assert.ok(authSection, 'Authenticated section must exist');

      const roleBadge = container.querySelector('#navRoleBadge');
      assert.ok(roleBadge, 'Role badge must exist');
      assert.strictEqual(roleBadge.textContent, 'Tác giả');

      const nameLink = container.querySelector('#navUserNameLink');
      assert.ok(nameLink, 'User name link must exist');
      assert.strictEqual(nameLink.textContent, 'Lý Bạch');

      const profileBtn = container.querySelector('#navProfileBtn');
      assert.ok(profileBtn, 'Profile button must exist');

      const logoutBtn = container.querySelector('#navLogoutBtn');
      assert.ok(logoutBtn, 'Logout button must exist');
    });

    test('getPrimaryRole correctly resolves role hierarchy (Admin > Moderator > Creator > Learner)', () => {
      assert.strictEqual(getPrimaryRole(['Learner', 'Admin']), 'Admin');
      assert.strictEqual(getPrimaryRole(['Learner', 'Moderator']), 'Moderator');
      assert.strictEqual(getPrimaryRole(['Learner', 'Creator']), 'Creator');
      assert.strictEqual(getPrimaryRole(['Learner']), 'Learner');
      assert.strictEqual(getPrimaryRole([]), 'Learner');
      assert.strictEqual(getPrimaryRole(null), 'Learner');
    });

    test('renderNavbarAuth renders Moderator Queue button and badge for Moderator session', () => {
      authManager.setSession({
        token: 'mod-jwt-token',
        accountId: 102,
        fullName: 'Bao Chửng',
        emailOrPhone: 'baochung@song.cn',
        roles: ['Learner', 'Moderator']
      });

      const container = new MockElement('div');
      renderNavbarAuth(container);

      const roleBadge = container.querySelector('#navRoleBadge');
      assert.ok(roleBadge, 'Role badge must exist');
      assert.strictEqual(roleBadge.textContent, 'Kiểm duyệt', 'Badge must display Kiểm duyệt for multi-role Moderator');
      assert.ok(roleBadge.className.includes('badge-status-active'));

      const mgmtBtn = container.querySelector('#navManagementBtn');
      assert.ok(mgmtBtn, 'Management button must exist');
      assert.strictEqual(mgmtBtn.textContent, 'Khu vực quản lý');
      assert.ok(mgmtBtn.getAttribute('href').includes('management.html'));
    });

    test('renderNavbarAuth renders Admin, Moderator, and Studio buttons for Admin session', () => {
      authManager.setSession({
        token: 'admin-jwt-token',
        accountId: 103,
        fullName: 'Địch Nhân Kiệt',
        emailOrPhone: 'dichnhankiet@duong.cn',
        roles: ['Learner', 'Admin']
      });

      const container = new MockElement('div');
      renderNavbarAuth(container);

      const roleBadge = container.querySelector('#navRoleBadge');
      assert.ok(roleBadge, 'Role badge must exist');
      assert.strictEqual(roleBadge.textContent, 'Quản trị', 'Badge must display Quản trị for Admin');
      assert.ok(roleBadge.className.includes('badge-status-approved'));

      const mgmtBtn = container.querySelector('#navManagementBtn');
      assert.ok(mgmtBtn, 'Management button must exist');
      assert.strictEqual(mgmtBtn.textContent, 'Khu vực quản lý');
      assert.ok(mgmtBtn.getAttribute('href').includes('management.html'));
    });
  });

  describe('Password Visibility Toggle & Device Avatar Processing (TASK-1.2)', () => {

    test('setupPasswordToggle toggles input type between password and text', () => {
      const input = new MockElement('input');
      input.type = 'password';

      const eye = new MockElement('svg');
      eye.className = 'eye-icon';
      const eyeOff = new MockElement('svg');
      eyeOff.className = 'eye-off-icon d-none';

      const btn = new MockElement('button');
      btn.appendChild(eye);
      btn.appendChild(eyeOff);

      setupPasswordToggle(btn, input);

      // Trigger click
      const clickHandlers = btn.eventListeners.get('click');
      assert.ok(clickHandlers && clickHandlers.size > 0, 'Click listener must be registered');
      const clickFn = Array.from(clickHandlers)[0];

      // First click: password -> text
      clickFn();
      assert.strictEqual(input.type, 'text');
      assert.strictEqual(btn.getAttribute('aria-label'), 'Ẩn mật khẩu');
      assert.ok(eye.classList.contains('d-none'));
      assert.strictEqual(eyeOff.classList.contains('d-none'), false);

      // Second click: text -> password
      clickFn();
      assert.strictEqual(input.type, 'password');
      assert.strictEqual(btn.getAttribute('aria-label'), 'Hiện mật khẩu');
      assert.strictEqual(eye.classList.contains('d-none'), false);
      assert.ok(eyeOff.classList.contains('d-none'));
    });

    test('processAvatarFile rejects non-image or invalid files', async () => {
      await assert.rejects(
        () => processAvatarFile(null),
        /chọn một tệp hình ảnh/
      );

      await assert.rejects(
        () => processAvatarFile({ type: 'application/pdf', size: 100 }),
        /Định dạng hình ảnh không được hỗ trợ/
      );

      await assert.rejects(
        () => processAvatarFile({ type: 'image/png', size: 6 * 1024 * 1024 }),
        /vượt quá giới hạn 5MB/
      );
    });

    test('verifies login.html contains updated labels, password toggle, and forgot password modal', async () => {
      const html = await fsPromises.readFile('frontend/login.html', 'utf8');
      assert.ok(html.includes('Email đăng nhập'), 'Label must be Email đăng nhập');
      assert.ok(html.includes('id="toggleLoginPasswordBtn"'), 'Must have toggle password button');
      assert.ok(html.includes('Quên mật khẩu?'), 'Must have forgot password link');
      assert.ok(html.includes('id="forgotPasswordModal"'), 'Must have forgot password modal');
    });

    test('verifies register.html contains updated labels and password toggle', async () => {
      const html = await fsPromises.readFile('frontend/register.html', 'utf8');
      assert.ok(html.includes('Email đăng ký'), 'Label must be Email đăng ký');
      assert.ok(html.includes('id="toggleRegPasswordBtn"'), 'Must have toggle password button');
    });

    test('verifies profile.html contains device file picker controls and password toggles', async () => {
      const html = await fsPromises.readFile('frontend/profile.html', 'utf8');
      assert.ok(html.includes('id="profileChooseFileBtn"'), 'Must have choose file button');
      assert.ok(html.includes('id="profileAvatarFileInput"'), 'Must have hidden file input');
      assert.ok(html.includes('id="profileRemoveAvatarBtn"'), 'Must have remove avatar button');
      assert.ok(html.includes('id="toggleCurrentPasswordBtn"'), 'Must have toggle for current password');
      assert.ok(html.includes('id="toggleNewPasswordBtn"'), 'Must have toggle for new password');
      assert.ok(html.includes('id="toggleConfirmNewPasswordBtn"'), 'Must have toggle for confirm password');
    });

  });

});
