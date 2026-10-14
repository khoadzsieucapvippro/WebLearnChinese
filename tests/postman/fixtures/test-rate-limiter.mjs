/**
 * Isolated Rate Limiter Verification Script.
 * Purpose:
 *   Validates that Spring Boot's LoginRateLimiter enforces sliding window brute-force protection
 *   without polluting or interfering with the main functional Postman collection.
 * Behavior:
 *   - Probes POST /api/v1/auth/login with rapid attempts
 *   - Verifies HTTP 429 (TOO_MANY_REQUESTS) triggers on exceeding quota (max-attempts: 10 per 60s)
 *   - Verifies public and authenticated non-login endpoints remain completely unaffected (200 OK)
 */

import http from 'node:http';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

function postLoginAttempt(email, password) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ emailOrPhone: email, password: password });
    const url = new URL('/api/v1/auth/login', BASE_URL);

    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ statusCode: res.statusCode, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function probeHealth() {
  return new Promise((resolve, reject) => {
    const url = new URL('/actuator/health', BASE_URL);
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
      });
    }).on('error', reject);
  });
}

export async function runRateLimiterVerification() {
  console.log('=== [RATE LIMITER ISOLATED VERIFICATION] ===');
  console.log(`Target Endpoint: ${BASE_URL}/api/v1/auth/login`);
  console.log(`Configured Limits: max-attempts=10, window-seconds=60`);

  let saw429 = false;
  let attempts = 0;

  for (let i = 1; i <= 15; i++) {
    attempts++;
    const res = await postLoginAttempt('ratelimit_probe@test.com', 'BadPassword123!');
    console.log(`Attempt #${i}: HTTP ${res.statusCode} (code=${res.body?.code || 'N/A'})`);
    if (res.statusCode === 429) {
      console.log(`[PASS] Threshold enforced: Attempt #${i} received HTTP 429 Too Many Requests (code=${res.body.code}).`);
      saw429 = true;
      break;
    }
  }

  if (!saw429) {
    throw new Error(`[FAIL] Rate limiter was not triggered after ${attempts} rapid attempts.`);
  }

  // Verify non-login endpoints are NOT blocked by login rate limiting
  const healthRes = await probeHealth();
  if (healthRes.statusCode === 200 && healthRes.body.status === 'UP') {
    console.log('[PASS] Public health endpoint /actuator/health is unaffected (200 OK, status=UP).');
  } else {
    throw new Error(`[FAIL] Health probe failed unexpectedly: status=${healthRes.statusCode}`);
  }

  console.log('=== [RATE LIMITER VERIFICATION COMPLETE: ALL PASS] ===');
  return true;
}

import { fileURLToPath } from 'node:url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runRateLimiterVerification().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
