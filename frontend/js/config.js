/**
 * =============================================================================
 * RUNTIME ENVIRONMENT CONFIGURATION (TASK FE-REMEDIATION-03 & DEPLOYMENT)
 * Module: frontend/js/config.js
 * 
 * Architectural Invariants:
 * 1. Single Source of Truth: Configures runtime environment settings for frontend execution.
 * 2. Deterministic Dev Routing: When served from standard local static dev servers
 *    (localhost / 127.0.0.1 on ports 3000, 5500, 5173, 8000, 8081), automatically points
 *    API requests to the local Spring Boot backend ('http://localhost:8080/api/v1').
 * 3. Codespaces & Same-Origin Production Default: In GitHub Codespaces (*.app.github.dev,
 *    *.github.dev), same-origin deployments (e.g. Nginx reverse proxy, production domains,
 *    or when served on port 8080 directly), defaults to relative '/api/v1'.
 * 4. GitHub Pages Dynamic Resolution: On *.github.io (/WebLearnChinese/), dynamically resolves cloud backend URL:
 *    a. URL param ?apiUrl=... (persisted to localStorage)
 *    b. Cached URL in localStorage ('ELEARNING_CLOUD_API_URL')
 *    c. Injected window.__ENV__.API_BASE_URL
 *    d. CI-injected CLOUD_PRODUCTION_API_URL constant (via deploy-pages.yml)
 *    e. Non-silent fallback to '/api/v1' with explicit warning and setup guidance
 * 5. Override Preservation: If window.__ENV__ is pre-injected (e.g., by container injection,
 *    server-side templating, or automated test runners), respects existing API_BASE_URL.
 * 6. Immutability: The resulting configuration object is frozen via Object.freeze.
 * =============================================================================
 */

(function initRuntimeConfig(globalScope) {
  'use strict';

  const CLOUD_PRODUCTION_API_URL = '__CLOUD_BACKEND_API_URL__';

  const root = typeof window !== 'undefined'
    ? window
    : (typeof globalScope !== 'undefined' ? globalScope : globalThis);

  if (!root) {
    return;
  }

  // Preserve pre-existing __ENV__ properties if already defined
  const currentEnv = (root.__ENV__ && typeof root.__ENV__ === 'object') ? root.__ENV__ : {};

  let apiBaseUrl = currentEnv.API_BASE_URL;

  const loc = root.location;
  if (loc && typeof loc.hostname === 'string' && loc.hostname.endsWith('github.io')) {
    // GitHub Pages dynamic resolution pipeline (/WebLearnChinese/)
    let apiUrlParam = null;
    try {
      const searchStr = loc.search || (loc.href && loc.href.includes('?') ? '?' + loc.href.split('?')[1].split('#')[0] : '');
      if (typeof URLSearchParams !== 'undefined' && searchStr) {
        const searchParams = new URLSearchParams(searchStr);
        apiUrlParam = searchParams.get('apiUrl');
      }
      if (!apiUrlParam && searchStr) {
        const match = searchStr.match(/[?&]apiUrl=([^&#]+)/i);
        if (match) {
          apiUrlParam = decodeURIComponent(match[1]);
        }
      }
    } catch (_) {}

    const storage = (typeof root.localStorage !== 'undefined') ? root.localStorage : (typeof localStorage !== 'undefined' ? localStorage : null);

    if (apiUrlParam) {
      if (storage) {
        try {
          storage.setItem('ELEARNING_CLOUD_API_URL', apiUrlParam);
        } catch (_) {}
      }
      apiBaseUrl = apiUrlParam.replace(/\/$/, '');
    } else {
      let savedCloudUrl = null;
      if (storage) {
        try {
          savedCloudUrl = storage.getItem('ELEARNING_CLOUD_API_URL');
        } catch (_) {}
      }

      if (savedCloudUrl && (savedCloudUrl.startsWith('https://') || savedCloudUrl.startsWith('http://'))) {
        apiBaseUrl = savedCloudUrl.replace(/\/$/, '');
      } else if (currentEnv.API_BASE_URL) {
        apiBaseUrl = currentEnv.API_BASE_URL;
      } else if (CLOUD_PRODUCTION_API_URL !== '__CLOUD_BACKEND_API_URL__' && CLOUD_PRODUCTION_API_URL.startsWith('http')) {
        apiBaseUrl = CLOUD_PRODUCTION_API_URL.replace(/\/$/, '');
      } else {
        apiBaseUrl = '/api/v1';
        if (typeof console !== 'undefined' && typeof console.warn === 'function') {
          console.warn(
            '[Config] Cảnh báo GitHub Pages (/WebLearnChinese/): Chưa cấu hình URL API Backend (API_BASE_URL).\n' +
            'Yêu cầu tương đối tới "/api/v1" trên máy chủ tĩnh GitHub Pages có thể trả về HTTP 404.\n' +
            'Hướng dẫn thiết lập kết nối Backend:\n' +
            '  1. Thêm tham số URL: ?apiUrl=https://<your-backend>.onrender.com/api/v1\n' +
            '  2. Hoặc cấu hình biến BACKEND_API_URL trong GitHub Actions repository variables\n' +
            '  3. Hoặc thiết lập window.__ENV__.API_BASE_URL trước khi load config.js.'
          );
        }
      }
    }
  } else if (!apiBaseUrl) {
    if (loc) {
      const hostname = loc.hostname || '';
      const port = String(loc.port || '');

      const isCodespaces = hostname.endsWith('.app.github.dev') || hostname.endsWith('.github.dev');
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
      const isDevStaticPort = ['3000', '5500', '5173', '8000', '8081'].includes(port);

      if (isCodespaces) {
        apiBaseUrl = '/api/v1';
      } else if (isLocalhost && isDevStaticPort) {
        apiBaseUrl = 'http://localhost:8080/api/v1';
      } else {
        apiBaseUrl = '/api/v1';
      }
    } else {
      apiBaseUrl = '/api/v1';
    }
  }

  // Define frozen read-only configuration
  root.__ENV__ = Object.freeze({
    ...currentEnv,
    API_BASE_URL: apiBaseUrl
  });

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
