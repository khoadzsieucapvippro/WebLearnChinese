/**
 * =============================================================================
 * RUNTIME ENVIRONMENT CONFIGURATION (TASK FE-REMEDIATION-03)
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
 * 4. Override Preservation: If window.__ENV__ is pre-injected (e.g., by container injection,
 *    server-side templating, or automated test runners), respects existing API_BASE_URL.
 * 5. Immutability: The resulting configuration object is frozen via Object.freeze.
 * =============================================================================
 */

/**
 * =============================================================================
 * RUNTIME ENVIRONMENT CONFIGURATION (TASK FE-REMEDIATION-03)
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
 * 4. GitHub Pages Dynamic Resolution: On *.github.io, dynamically resolves cloud backend URL:
 *    a. URL param ?apiUrl=... (persisted to localStorage)
 *    b. Cached URL in localStorage ('ELEARNING_CLOUD_API_URL')
 *    c. Injected window.__ENV__.API_BASE_URL
 *    d. CI-injected CLOUD_PRODUCTION_API_URL constant
 *    e. Default to '/api/v1'
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
  if (loc && typeof loc.hostname === 'string' && loc.hostname.endsWith('.github.io')) {
    // GitHub Pages dynamic resolution pipeline
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
