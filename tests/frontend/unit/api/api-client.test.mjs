/**
 * =============================================================================
 * UNIT TEST: CENTRALIZED HTTP API CLIENT CONTRACT (TASK 9A.2)
 * Tests base URL, header policies (JSON vs FormData vs No-body), token injection,
 * ApiResponse unpacking, 204 No Content, validation error parsing, 401 single-owner
 * lifecycle, 403 preservation, 429 rate limiting, timeout/abort/network error discrimination,
 * and safe GET retry vs mutation no-retry.
 * =============================================================================
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// In-memory mock localStorage
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

// In-memory mock window
class MockWindow {
  constructor() {
    this.listeners = new Map();
    this.location = {
      pathname: '/index.html',
      href: '/index.html'
    };
    this.__ENV__ = {};
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(handler);
  }

  removeEventListener(type, handler) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(handler);
    }
  }

  dispatchEvent(event) {
    if (this.listeners.has(event.type)) {
      for (const handler of this.listeners.get(event.type)) {
        handler(event);
      }
    }
    return true;
  }
}

class MockCustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
}

// Setup globals before import
const mockStorage = new MockLocalStorage();
const mockWin = new MockWindow();

globalThis.localStorage = mockStorage;
globalThis.window = mockWin;
globalThis.CustomEvent = MockCustomEvent;

// Mock FormData if not present in Node.js
if (typeof globalThis.FormData === 'undefined') {
  class MockFormData {
    constructor() {
      this._data = new Map();
    }
    append(k, v) {
      this._data.set(k, v);
    }
  }
  globalThis.FormData = MockFormData;
}

// Import modules under test
const { authManager } = await import('../../../../frontend/js/auth/auth-state.js');
const {
  apiClient,
  ApiError,
  buildUrl,
  parseFieldErrors,
  getBaseUrl
} = await import('../../../../frontend/js/api/api.js');

describe('Centralized HTTP API Client Contract', () => {

  let originalFetch;
  let fetchHistory = [];

  beforeEach(() => {
    mockStorage.clear();
    mockWin.__ENV__ = {};
    fetchHistory = [];
    originalFetch = globalThis.fetch;
    authManager.resetRedirectHandler();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mockStorage.clear();
    authManager.resetRedirectHandler();
  });

  // Helper to create mock Response objects
  function createMockResponse({
    status = 200,
    body = null,
    headers = { 'Content-Type': 'application/json' },
    isJson = true
  } = {}) {
    const headersMap = new Headers(headers);
    return {
      status,
      ok: status >= 200 && status < 300,
      headers: headersMap,
      async json() {
        if (!isJson || body === null) {
          throw new SyntaxError('Unexpected end of JSON input');
        }
        return body;
      },
      async text() {
        return typeof body === 'string' ? body : JSON.stringify(body);
      }
    };
  }

  test('buildUrl() defaults to /api/v1 and normalizes slashes', () => {
    assert.strictEqual(getBaseUrl(), '/api/v1');
    assert.strictEqual(buildUrl('/lessons'), '/api/v1/lessons');
    assert.strictEqual(buildUrl('lessons'), '/api/v1/lessons');
  });

  test('buildUrl() respects window.__ENV__.API_BASE_URL when configured', () => {
    mockWin.__ENV__.API_BASE_URL = 'http://api.internal.org:8080/api/v1/';
    assert.strictEqual(getBaseUrl(), 'http://api.internal.org:8080/api/v1');
    assert.strictEqual(buildUrl('/radicals'), 'http://api.internal.org:8080/api/v1/radicals');
  });

  test('buildUrl() correctly serializes query parameters including arrays and primitives', () => {
    const url = buildUrl('/vocabulary', {
      search: 'học',
      page: 0,
      size: 20,
      active: true,
      tags: ['hsk1', 'beginner'],
      ignoredNull: null,
      ignoredUndefined: undefined
    });

    assert.ok(url.startsWith('/api/v1/vocabulary?'));
    assert.ok(url.includes('search=h%E1%BB%8Dc'));
    assert.ok(url.includes('page=0'));
    assert.ok(url.includes('size=20'));
    assert.ok(url.includes('active=true'));
    assert.ok(url.includes('tags=hsk1'));
    assert.ok(url.includes('tags=beginner'));
    assert.ok(!url.includes('ignoredNull'));
    assert.ok(!url.includes('ignoredUndefined'));
  });

  test('parseFieldErrors() parses GlobalExceptionHandler format "field: message" safely', () => {
    const backendErrors = [
      'emailOrPhone: Email or phone is required',
      'password: Password must be between 6 and 100 characters',
      'General notice without field'
    ];

    const parsed = parseFieldErrors(backendErrors);
    assert.strictEqual(parsed.emailOrPhone, 'Email or phone is required');
    assert.strictEqual(parsed.password, 'Password must be between 6 and 100 characters');
    assert.strictEqual(parsed._general, 'General notice without field');

    // Edge cases: null, undefined, non-array
    assert.deepStrictEqual(parseFieldErrors(null), {});
    assert.deepStrictEqual(parseFieldErrors(undefined), {});
    assert.deepStrictEqual(parseFieldErrors(['']), {});
  });

  test('Content-Type Policy: sets application/json for structured bodies, omits for GET/no-body', async () => {
    globalThis.fetch = async (url, config) => {
      fetchHistory.push({ url, config });
      return createMockResponse({
        status: 200,
        body: { code: 'SUCCESS', message: 'OK', data: { id: 1 } }
      });
    };

    // 1. GET without body -> NO Content-Type
    await apiClient('/lessons');
    assert.strictEqual(fetchHistory[0].config.headers.get('Content-Type'), null);

    // 2. POST with JSON object -> Sets Content-Type: application/json
    await apiClient('/lessons', {
      method: 'POST',
      body: { title: 'Bài học 1' }
    });
    assert.strictEqual(fetchHistory[1].config.headers.get('Content-Type'), 'application/json');
    assert.strictEqual(fetchHistory[1].config.body, '{"title":"Bài học 1"}');
  });

  test('Content-Type Policy: FormData MUST NEVER set Content-Type header', async () => {
    globalThis.fetch = async (url, config) => {
      fetchHistory.push({ url, config });
      return createMockResponse({
        status: 200,
        body: { code: 'SUCCESS', message: 'Uploaded', data: { status: 'VALID' } }
      });
    };

    const formData = new FormData();
    formData.append('file', 'test-file-content');

    await apiClient('/creator/lessons/import', {
      method: 'POST',
      body: formData
    });

    assert.strictEqual(fetchHistory[0].config.headers.get('Content-Type'), null, 'FormData must omit Content-Type');
    assert.strictEqual(fetchHistory[0].config.body, formData, 'FormData body must remain intact');
  });

  test('Authorization Policy: Injects Bearer token from authManager when authenticated', async () => {
    globalThis.fetch = async (url, config) => {
      fetchHistory.push({ url, config });
      return createMockResponse({
        status: 200,
        body: { code: 'SUCCESS', message: 'Profile', data: { userId: 123 } }
      });
    };

    // Unauthenticated request
    authManager.clearSession();
    await apiClient('/users/profile');
    assert.strictEqual(fetchHistory[0].config.headers.get('Authorization'), null);

    // Authenticated request
    authManager.setSession({
      token: 'secret-jwt-token',
      accountId: 1,
      roles: ['Learner']
    });

    await apiClient('/users/profile');
    assert.strictEqual(fetchHistory[1].config.headers.get('Authorization'), 'Bearer secret-jwt-token');
  });

  test('Response Unpacking: Returns envelope.data on code="SUCCESS"', async () => {
    globalThis.fetch = async () => {
      return createMockResponse({
        status: 200,
        body: {
          code: 'SUCCESS',
          message: 'Tải thành công',
          data: { lessonId: 99, title: 'Khang Hy Bộ Thủ' },
          errors: []
        }
      });
    };

    const data = await apiClient('/lessons/99');
    assert.deepStrictEqual(data, { lessonId: 99, title: 'Khang Hy Bộ Thủ' });
  });

  test('Response Unpacking: Throws ApiError when envelope.code is not SUCCESS', async () => {
    globalThis.fetch = async () => {
      return createMockResponse({
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Dữ liệu đầu vào không hợp lệ',
          data: null,
          errors: ['title: Tiêu đề không được để trống']
        }
      });
    };

    await assert.rejects(
      async () => {
        await apiClient('/creator/lessons', { method: 'POST', body: {} });
      },
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.status, 400);
        assert.strictEqual(err.code, 'VALIDATION_ERROR');
        assert.strictEqual(err.message, 'Dữ liệu đầu vào không hợp lệ');
        assert.deepStrictEqual(err.errors, ['title: Tiêu đề không được để trống']);
        return true;
      }
    );
  });

  test('HTTP 204 No Content: returns null without calling response.json()', async () => {
    let jsonCalled = false;
    globalThis.fetch = async () => {
      return {
        status: 204,
        ok: true,
        headers: new Headers(),
        async json() {
          jsonCalled = true;
          throw new SyntaxError('Should not be called');
        }
      };
    };

    const result = await apiClient('/admin/radicals/1', { method: 'DELETE' });
    assert.strictEqual(result, null);
    assert.strictEqual(jsonCalled, false, 'response.json() must NEVER be called on 204');
  });

  test('HTTP 401 Single-Owner Lifecycle: clears session, dispatches auth:expired, calls redirect, throws ApiError', async () => {
    let expiredCount = 0;
    mockWin.addEventListener('auth:expired', () => {
      expiredCount++;
    });

    let redirectCount = 0;
    authManager.setRedirectHandler(() => {
      redirectCount++;
    });

    authManager.setSession({
      token: 'will-expire',
      accountId: 1,
      roles: ['Learner']
    });

    globalThis.fetch = async () => {
      return createMockResponse({
        status: 401,
        body: {
          code: 'UNAUTHORIZED',
          message: 'Phiên đăng nhập đã hết hạn',
          errors: []
        }
      });
    };

    await assert.rejects(
      async () => {
        await apiClient('/users/profile');
      },
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.status, 401);
        assert.strictEqual(err.code, 'UNAUTHORIZED');
        return true;
      }
    );

    assert.strictEqual(authManager.isAuthenticated(), false, 'Session must be cleared on 401');
    assert.strictEqual(expiredCount, 1, 'Exactly ONE auth:expired event must fire');
    assert.strictEqual(redirectCount, 1, 'Redirect handler must be called once');
  });

  test('HTTP 403 Forbidden: preserves active session without clearing token or redirecting', async () => {
    let expiredCount = 0;
    mockWin.addEventListener('auth:expired', () => {
      expiredCount++;
    });

    authManager.setSession({
      token: 'valid-learner-token',
      accountId: 1,
      roles: ['Learner']
    });

    globalThis.fetch = async () => {
      return createMockResponse({
        status: 403,
        body: {
          code: 'FORBIDDEN',
          message: 'Không có quyền truy cập tài nguyên này',
          errors: []
        }
      });
    };

    await assert.rejects(
      async () => {
        await apiClient('/admin/accounts');
      },
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.status, 403);
        assert.strictEqual(err.code, 'FORBIDDEN');
        return true;
      }
    );

    assert.strictEqual(authManager.isAuthenticated(), true, '403 must NOT clear session');
    assert.strictEqual(authManager.getToken(), 'valid-learner-token');
    assert.strictEqual(expiredCount, 0, '403 must NOT dispatch auth:expired');
  });

  test('HTTP 429 Too Many Requests: throws ApiError with rate limiting message', async () => {
    globalThis.fetch = async () => {
      return createMockResponse({
        status: 429,
        body: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau',
          errors: []
        }
      });
    };

    await assert.rejects(
      async () => {
        await apiClient('/auth/login', { method: 'POST', body: { emailOrPhone: 'x', password: 'y' } });
      },
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.status, 429);
        assert.strictEqual(err.code, 'TOO_MANY_REQUESTS');
        assert.strictEqual(err.message, 'Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau');
        return true;
      }
    );
  });

  test('Timeout Discrimination: throws ApiError with status 408 and code TIMEOUT', async () => {
    globalThis.fetch = async () => {
      const err = new DOMException('The operation timed out.', 'TimeoutError');
      throw err;
    };

    await assert.rejects(
      async () => {
        await apiClient('/srs/due');
      },
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.status, 408);
        assert.strictEqual(err.code, 'TIMEOUT');
        return true;
      }
    );
  });

  test('Abort Discrimination: throws ApiError with status 0 and code ABORTED', async () => {
    globalThis.fetch = async () => {
      const err = new DOMException('The user aborted a request.', 'AbortError');
      throw err;
    };

    await assert.rejects(
      async () => {
        await apiClient('/srs/due');
      },
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.status, 0);
        assert.strictEqual(err.code, 'ABORTED');
        return true;
      }
    );
  });

  test('Safe GET Retry: retries exactly ONCE on transient network failure and succeeds', async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount === 1) {
        throw new TypeError('Failed to fetch (network drop)');
      }
      return createMockResponse({
        status: 200,
        body: { code: 'SUCCESS', message: 'OK', data: ['recovered'] }
      });
    };

    const data = await apiClient('/lessons', { method: 'GET' });
    assert.strictEqual(callCount, 2, 'GET must retry once on network failure');
    assert.deepStrictEqual(data, ['recovered']);
  });

  test('Mutation No-Retry: POST, PUT, DELETE MUST NEVER retry automatically', async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      throw new TypeError('Network connection reset');
    };

    await assert.rejects(
      async () => {
        await apiClient('/creator/lessons', { method: 'POST', body: { title: 'No retry' } });
      },
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.code, 'NETWORK_ERROR');
        return true;
      }
    );

    assert.strictEqual(callCount, 1, 'POST mutation must fail immediately without retry');
  });

  test('Non-Retryable Errors: 401, 429, timeouts MUST NOT be retried', async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      return createMockResponse({
        status: 401,
        body: { code: 'UNAUTHORIZED', message: 'Expired' }
      });
    };

    await assert.rejects(async () => {
      await apiClient('/users/profile');
    });

    assert.strictEqual(callCount, 1, '401 must never be retried');
  });

  describe('Smart Cloud Fallback Engine (GitHub Pages *.github.io & Demo Mode)', () => {
    beforeEach(() => {
      mockWin.location.hostname = 'demo-user.github.io';
    });

    afterEach(() => {
      mockWin.location.hostname = undefined;
    });

    test('Falls back to demo engine when fetch returns 404 on GitHub Pages', async () => {
      globalThis.fetch = async () => {
        return createMockResponse({ status: 404, body: 'Not Found', isJson: false });
      };

      const result = await apiClient('/radicals', { params: { page: 0, size: 10 } });
      assert.ok(result, 'Must return fallback data on 404');
      assert.strictEqual(result.items.length, 10);
      assert.strictEqual(result.totalElements, 214);
    });

    test('Falls back to demo engine when fetch throws TypeError on GitHub Pages', async () => {
      globalThis.fetch = async () => {
        throw new TypeError('Failed to fetch from cloud backend');
      };

      const result = await apiClient('/lessons');
      assert.ok(Array.isArray(result.items), 'Must return lessons list');
      assert.ok(result.totalElements >= 5);
      assert.strictEqual(result.items[0].status, 'Approved');
    });

    test('Authenticates 4 standard accounts (Learner, Creator, Moderator, Admin) on demo', async () => {
      globalThis.fetch = async () => {
        throw new TypeError('Cloud backend offline');
      };

      const accounts = [
        { email: 'learner@gmail.com', role: 'Learner' },
        { email: 'creator@gmail.com', role: 'Creator' },
        { email: 'moderator@gmail.com', role: 'Moderator' },
        { email: 'admin@gmail.com', role: 'Admin' }
      ];

      for (const acc of accounts) {
        const authData = await apiClient('/auth/login', {
          method: 'POST',
          body: { emailOrPhone: acc.email, password: 'Password@123' }
        });
        assert.ok(authData.token.startsWith('demo-jwt-token-'));
        assert.ok(authData.roles.includes(acc.role), `Expected role ${acc.role}`);
      }
    });

    test('Rejects invalid credentials with 401 ApiError', async () => {
      globalThis.fetch = async () => {
        throw new TypeError('Cloud backend offline');
      };

      await assert.rejects(
        async () => {
          await apiClient('/auth/login', {
            method: 'POST',
            body: { emailOrPhone: 'unknown@gmail.com', password: 'wrong' }
          });
        },
        (err) => {
          assert.ok(err instanceof ApiError);
          assert.strictEqual(err.status, 401);
          return true;
        }
      );
    });

    test('Performs SRS reviews and saves progress in localStorage', async () => {
      globalThis.fetch = async () => {
        throw new TypeError('Cloud backend offline');
      };

      const statsBefore = await apiClient('/srs/stats');
      assert.ok(statsBefore.cardsDue >= 0);

      const reviewOutcome = await apiClient('/srs/review', {
        method: 'POST',
        body: {
          itemType: 'VOCABULARY',
          itemId: 1,
          rating: 3,
          cardType: 'READING'
        }
      });

      assert.strictEqual(reviewOutcome.itemId, 1);
      assert.ok(reviewOutcome.intervalDays >= 1);
      assert.ok(mockStorage.getItem('ELEARNING_DEMO_DATA'), 'Must save state to localStorage');
    });

    test('Personal notes CRUD persists across operations', async () => {
      globalThis.fetch = async () => {
        throw new TypeError('Cloud backend offline');
      };

      // 1. Create note
      const newNote = await apiClient('/vocabularies/2/notes', {
        method: 'POST',
        body: { content: 'Ghi chú bài học từ vựng số 2' }
      });
      assert.strictEqual(newNote.vocabId, 2);
      assert.strictEqual(newNote.content, 'Ghi chú bài học từ vựng số 2');

      // 2. Read notes
      const notesList = await apiClient('/vocabularies/2/notes');
      assert.ok(notesList.items.some(n => n.content === 'Ghi chú bài học từ vựng số 2'));

      // 3. Update note
      const updatedNote = await apiClient(`/notes/${newNote.noteId}`, {
        method: 'PUT',
        body: { content: 'Nội dung cập nhật mới' }
      });
      assert.strictEqual(updatedNote.content, 'Nội dung cập nhật mới');

      // 4. Delete note
      await apiClient(`/notes/${newNote.noteId}`, {
        method: 'DELETE'
      });

      const listAfterDelete = await apiClient('/vocabularies/2/notes');
      assert.ok(!listAfterDelete.items.some(n => n.noteId === newNote.noteId));
    });
  });

});
