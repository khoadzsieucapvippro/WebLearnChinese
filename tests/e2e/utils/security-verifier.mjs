/**
 * =============================================================================
 * SECURITY & CONFIGURATION VERIFIER UTILITY
 * File: tests/e2e/utils/security-verifier.mjs
 * 
 * Verifies Production Security Hardening Requirements (R2, F1, F2, F3):
 * 1. APP_DEMO_SEED_ACCOUNTS disabled in production container/deployment specs.
 * 2. JWT secret fail-fast validation logic (>= 32 bytes, non-blank, non-dev).
 * 3. Demo fallback simulation indicator and anti-downgrade policy.
 * =============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Validates JWT Secret against production security requirements.
 * - Minimum 32 bytes (256 bits) for HMAC-SHA256
 * - Cannot be null, undefined, or blank
 * - In production profiles ('prod', 'production'), missing or insecure secret triggers fatal fail-fast
 * - In local/dev profiles, fallback key is permitted
 * 
 * @param {string|null|undefined} secret
 * @param {string} [profile='production']
 * @returns {{ valid: boolean, byteLength: number, error?: string }}
 */
export function validateJwtSecretConfig(secret, profile = 'production') {
  const isDevOrLocal = ['dev', 'local', 'test'].includes(profile.toLowerCase());

  if (secret === null || secret === undefined || (typeof secret === 'string' && secret.trim() === '')) {
    if (isDevOrLocal) {
      return { valid: true, byteLength: 32, note: 'Allowed fallback on dev/local profile' };
    }
    throw new Error('JWT secret cannot be null or blank on non-dev profile (Fail-fast)');
  }

  const byteLength = Buffer.byteLength(secret, 'utf8');
  if (byteLength < 32) {
    if (isDevOrLocal) {
      return { valid: true, byteLength, note: 'Weak key tolerated on dev/local' };
    }
    throw new Error(`JWT secret must be at least 32 bytes (256 bits). Provided length: ${byteLength} bytes`);
  }

  return { valid: true, byteLength };
}

/**
 * Inspects Dockerfile, backend/Dockerfile, or render.yaml content for demo seed setting.
 * 
 * @param {string} content
 * @returns {{ keyFound: boolean, value: string, isDisabled: boolean }}
 */
export function parseDemoSeedSetting(content) {
  // Dockerfile ENV style: APP_DEMO_SEED_ACCOUNTS=false or APP_DEMO_SEED_ACCOUNTS="false"
  const envRegex = /APP_DEMO_SEED_ACCOUNTS\s*=\s*["']?([^\s"']+)["']?/i;
  const envMatch = content.match(envRegex);
  if (envMatch) {
    const val = envMatch[1].trim().toLowerCase();
    return {
      keyFound: true,
      value: val,
      isDisabled: val === 'false' || val === '0' || val === 'no'
    };
  }

  // render.yaml or yaml style:
  // - key: APP_DEMO_SEED_ACCOUNTS
  //   value: "false"
  const yamlKeyRegex = /key:\s*APP_DEMO_SEED_ACCOUNTS[\s\S]*?value:\s*["']?([^\s"'\r\n]+)["']?/i;
  const yamlMatch = content.match(yamlKeyRegex);
  if (yamlMatch) {
    const val = yamlMatch[1].trim().toLowerCase();
    return {
      keyFound: true,
      value: val,
      isDisabled: val === 'false' || val === '0' || val === 'no'
    };
  }

  // application.yml style: seed-accounts: false
  const appYmlRegex = /seed-accounts:\s*\$\{APP_DEMO_SEED_ACCOUNTS:\s*([^\s}]+)\}/i;
  const appYmlMatch = content.match(appYmlRegex);
  if (appYmlMatch) {
    const val = appYmlMatch[1].trim().toLowerCase();
    return {
      keyFound: true,
      value: val,
      isDisabled: val === 'false' || val === '0' || val === 'no'
    };
  }

  return { keyFound: false, value: '', isDisabled: false };
}

/**
 * Evaluates Demo Fallback Engine behavior against authentic backend errors.
 * Policy: Authentic HTTP 401, 403, 404, or 500 responses with JSON MUST NEVER
 * be swallowed or silently downgraded to simulated demo auth/actions.
 * 
 * @param {Object} response
 * @param {number} response.status
 * @param {string} [response.contentType]
 * @param {Object} [options]
 * @param {boolean} [options.isApiConfigured=true]
 * @returns {{ allowsFallback: boolean, violation?: string }}
 */
export function evaluateDemoFallbackPolicy(response, { isApiConfigured = true } = {}) {
  const { status, contentType = 'application/json' } = response;

  if (isApiConfigured) {
    // If API is configured, authentic HTTP error status codes from server must propagate
    if ([401, 403, 404, 409, 422, 500].includes(status)) {
      return {
        allowsFallback: false,
        violation: `Silent downgrade prohibited: Authentic backend HTTP ${status} must be surfaced to user/caller`
      };
    }
  }

  return { allowsFallback: true };
}

/**
 * Evaluates whether Demo Mode indicator badge meets visibility and clarity standard.
 * 
 * @param {Object} indicatorProps
 * @param {boolean} indicatorProps.visible
 * @param {string} indicatorProps.text
 * @param {string} indicatorProps.className
 * @returns {boolean}
 */
export function verifyDemoBadgeStandard(indicatorProps) {
  if (!indicatorProps || !indicatorProps.visible) return false;
  const text = (indicatorProps.text || '').toLowerCase();
  const hasWarningIndicator = text.includes('dữ liệu mô phỏng') || text.includes('demo');
  const hasBadgeClass = (indicatorProps.className || '').includes('badge') ||
                        (indicatorProps.className || '').includes('warning') ||
                        (indicatorProps.className || '').includes('demo');
  return hasWarningIndicator && hasBadgeClass;
}
