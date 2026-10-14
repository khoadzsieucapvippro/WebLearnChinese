/**
 * =============================================================================
 * UNIT TEST: RUNTIME ENVIRONMENT CONFIGURATION (TASK FE-REMEDIATION-03)
 * Module: tests/frontend/unit/config/config.test.mjs
 * =============================================================================
 */

import { test, it, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_SCRIPT_PATH = path.resolve(__dirname, '../../../../frontend/js/config.js');
const configScriptCode = fs.readFileSync(CONFIG_SCRIPT_PATH, 'utf-8');

/**
 * Helper to run config.js in a sandboxed window context
 */
function runConfigInContext(mockWindow) {
  const context = vm.createContext({
    window: mockWindow,
    globalThis: mockWindow,
    Object,
    URLSearchParams
  });
  vm.runInContext(configScriptCode, context);
  return mockWindow.__ENV__;
}

describe('Runtime Environment Configuration (config.js)', () => {

  test('routes localhost:3000 to http://localhost:8080/api/v1', () => {
    const mockWin = {
      location: {
        hostname: 'localhost',
        port: '3000'
      }
    };

    const env = runConfigInContext(mockWin);
    assert.strictEqual(env.API_BASE_URL, 'http://localhost:8080/api/v1');
    assert.ok(Object.isFrozen(env), 'window.__ENV__ must be frozen');
  });

  test('routes 127.0.0.1:5500 to http://localhost:8080/api/v1', () => {
    const mockWin = {
      location: {
        hostname: '127.0.0.1',
        port: '5500'
      }
    };

    const env = runConfigInContext(mockWin);
    assert.strictEqual(env.API_BASE_URL, 'http://localhost:8080/api/v1');
  });

  test('routes other dev static ports (5173, 8000, 8081) on localhost to backend', () => {
    for (const port of ['5173', '8000', '8081']) {
      const mockWin = {
        location: {
          hostname: 'localhost',
          port
        }
      };
      const env = runConfigInContext(mockWin);
      assert.strictEqual(env.API_BASE_URL, 'http://localhost:8080/api/v1', `Port ${port} should map to backend`);
    }
  });

  test('defaults to relative /api/v1 on same-origin backend port 8080', () => {
    const mockWin = {
      location: {
        hostname: 'localhost',
        port: '8080'
      }
    };

    const env = runConfigInContext(mockWin);
    assert.strictEqual(env.API_BASE_URL, '/api/v1');
  });

  test('defaults to relative /api/v1 on production domains', () => {
    const mockWin = {
      location: {
        hostname: 'elearning.chinese.edu',
        port: ''
      }
    };

    const env = runConfigInContext(mockWin);
    assert.strictEqual(env.API_BASE_URL, '/api/v1');
  });

  it('routes GitHub Codespaces domain (*.app.github.dev / *.github.dev) to relative /api/v1', () => {
    const codespaceLocations = [
      { hostname: 'improved-winner-xxx-3000.app.github.dev', port: '' },
      { hostname: 'preview-yyy.github.dev', port: '' }
    ];

    for (const loc of codespaceLocations) {
      const mockWin = {
        location: loc
      };
      const env = runConfigInContext(mockWin);
      assert.strictEqual(env.API_BASE_URL, '/api/v1', `Host ${loc.hostname} should route to relative /api/v1`);
      assert.strictEqual(Object.isFrozen(env), true, `Environment for ${loc.hostname} should be frozen`);
    }
  });

  test('preserves pre-injected window.__ENV__.API_BASE_URL override', () => {
    const mockWin = {
      location: {
        hostname: 'localhost',
        port: '3000'
      },
      __ENV__: {
        API_BASE_URL: 'https://staging-api.example.com/v1',
        CUSTOM_FLAG: true
      }
    };

    const env = runConfigInContext(mockWin);
    assert.strictEqual(env.API_BASE_URL, 'https://staging-api.example.com/v1');
    assert.strictEqual(env.CUSTOM_FLAG, true);
    assert.ok(Object.isFrozen(env));
  });

  test('handles missing or partial location object safely without throwing', () => {
    const mockWin = {};
    const env = runConfigInContext(mockWin);
    assert.strictEqual(env.API_BASE_URL, '/api/v1');
    assert.ok(Object.isFrozen(env));
  });

  describe('GitHub Pages (*.github.io) Dynamic Cloud API Resolution', () => {
    function createMockStorage() {
      const store = new Map();
      return {
        getItem: (k) => store.has(k) ? store.get(k) : null,
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
        clear: () => store.clear()
      };
    }

    test('a. uses and persists ?apiUrl= URL query param', () => {
      const storage = createMockStorage();
      const mockWin = {
        location: {
          hostname: 'myuser.github.io',
          search: '?apiUrl=https://elearning-backend.up.railway.app/api/v1/'
        },
        localStorage: storage
      };

      const env = runConfigInContext(mockWin);
      assert.strictEqual(env.API_BASE_URL, 'https://elearning-backend.up.railway.app/api/v1');
      assert.strictEqual(storage.getItem('ELEARNING_CLOUD_API_URL'), 'https://elearning-backend.up.railway.app/api/v1/');
    });

    test('b. uses valid URL from localStorage when no query param exists', () => {
      const storage = createMockStorage();
      storage.setItem('ELEARNING_CLOUD_API_URL', 'https://api.onrender.com/api/v1/');
      const mockWin = {
        location: {
          hostname: 'myuser.github.io',
          search: ''
        },
        localStorage: storage
      };

      const env = runConfigInContext(mockWin);
      assert.strictEqual(env.API_BASE_URL, 'https://api.onrender.com/api/v1');
    });

    test('c. uses currentEnv.API_BASE_URL when no param or localStorage exists', () => {
      const storage = createMockStorage();
      const mockWin = {
        location: {
          hostname: 'myuser.github.io',
          search: ''
        },
        localStorage: storage,
        __ENV__: {
          API_BASE_URL: 'https://staging.koyeb.app/api/v1'
        }
      };

      const env = runConfigInContext(mockWin);
      assert.strictEqual(env.API_BASE_URL, 'https://staging.koyeb.app/api/v1');
    });

    test('d. uses CI-injected CLOUD_PRODUCTION_API_URL when not default placeholder', () => {
      const storage = createMockStorage();
      const mockWin = {
        location: {
          hostname: 'myuser.github.io',
          search: ''
        },
        localStorage: storage
      };

      const injectedCode = configScriptCode.replace(
        '__CLOUD_BACKEND_API_URL__',
        'https://injected-railway.up.railway.app/api/v1/'
      );
      const context = vm.createContext({
        window: mockWin,
        globalThis: mockWin,
        Object,
        URLSearchParams
      });
      vm.runInContext(injectedCode, context);
      assert.strictEqual(mockWin.__ENV__.API_BASE_URL, 'https://injected-railway.up.railway.app/api/v1');
    });

    test('e. defaults to /api/v1 on GitHub Pages when nothing else is configured', () => {
      const storage = createMockStorage();
      const mockWin = {
        location: {
          hostname: 'myuser.github.io',
          search: ''
        },
        localStorage: storage
      };

      const env = runConfigInContext(mockWin);
      assert.strictEqual(env.API_BASE_URL, '/api/v1');
      assert.ok(Object.isFrozen(env));
    });
  });
});
