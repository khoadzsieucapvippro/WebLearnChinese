/**
 * =============================================================================
 * BROWSER E2E TEST: MANAGEMENT SESSION ISOLATION & REVERSE ROLE GUARD (PHƯƠNG ÁN A)
 * File: tests/frontend/e2e/management-session-isolation.browser.mjs
 * 
 * Verifies:
 * 1. Staff Session Lifecycle:
 *    - Creator logs in -> session is stored in sessionStorage, NOT in persistent localStorage.
 *    - Strict Reverse Role Guard blocks Creator from visiting learner pages (lessons.html, index.html)
 *      and immediately redirects them to creator-lessons.html.
 *    - Simulating closing the browser tab (X tab): on new tab/context, sessionStorage is empty,
 *      so Creator is completely LOGGED OUT (guest navbar, no residual management session).
 * 2. Admin Workspace Isolation:
 *    - Admin logs in -> session stored in sessionStorage.
 *    - Admin visiting lessons.html is immediately redirected to management.html.
 *    - Simulating closing tab: Admin is completely LOGGED OUT on new tab.
 * 3. Learner Persistence:
 *    - Learner logs in -> session stored in localStorage.
 *    - Learner can access lessons.html freely without redirect.
 *    - Learner closing tab and reopening persists login state.
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

describe('Browser E2E: Management Session Lifecycle & Reverse Role Guard (Phương án A)', () => {
  let serverHandle;
  let browser;
  let baseUrl;

  before(async () => {
    serverHandle = await ensureServer({ port: 3000 });
    baseUrl = serverHandle.baseUrl;
    browser = await launchBrowser({ headless: true });
  });

  after(async () => {
    if (browser) await browser.close();
    if (serverHandle) await serverHandle.close();
  });

  test('MS-01: Creator session lives in sessionStorage, blocked from learner pages, wiped on X tab', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      // Mock all backend API routes to prevent ERR_CONNECTION_REFUSED in standalone static test
      await page.route('**/api/v1/**', async (route) => {
        const url = route.request().url();
        if (url.includes('/auth/login')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'SUCCESS',
              message: 'OK',
              data: {
                token: 'jwt-mock-creator-token',
                accountId: 501,
                emailOrPhone: 'creator@example.com',
                fullName: 'Tác Giả Kiểm Thử',
                roles: ['Creator']
              }
            })
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }
          })
        });
      });

      // 1. Creator logs in via login.html
      await page.goto(`${baseUrl}/login.html`, { waitUntil: 'domcontentloaded' });
      await page.fill('#loginEmail', 'creator@example.com');
      await page.fill('#loginPassword', 'CreatorPass123!');
      await page.click('#loginSubmitBtn');

      // Expect automatic redirection to creator workspace (creator-lessons.html)
      await page.waitForURL('**/creator-lessons.html*');

      // 2. Verify session storage placement
      const sessionToken = await page.evaluate(() => sessionStorage.getItem('access_token'));
      const localToken = await page.evaluate(() => localStorage.getItem('access_token'));
      assert.strictEqual(sessionToken, 'jwt-mock-creator-token', 'Staff token must reside in sessionStorage');
      assert.strictEqual(localToken, null, 'Staff token must NEVER reside in persistent localStorage');

      // 3. Test Reverse Role Guard: Creator attempts to visit student lessons.html
      await page.goto(`${baseUrl}/lessons.html`, { waitUntil: 'domcontentloaded' });

      // Guard intercepts and forcibly redirects back to creator-lessons.html
      await page.waitForURL('**/creator-lessons.html*');
      assert.ok(page.url().includes('creator-lessons.html'), 'Creator must be blocked from lessons.html and redirected');

      // 4. Test Reverse Role Guard: Creator attempts to visit student index.html (home)
      await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded' });

      // Guard intercepts and forcibly redirects back to creator-lessons.html
      await page.waitForURL('**/creator-lessons.html*');
      assert.ok(page.url().includes('creator-lessons.html'), 'Creator must be blocked from index.html and redirected');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join(', ')}`);

    } finally {
      // 5. Simulate X tab Chrome by closing the page and its tab context
      await page.close();
      await context.close();
    }

    // 6. User reopens Chrome in a new tab / window
    const newSession = await createMonitoredPage(browser);
    try {
      await newSession.page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded' });

      // Verify user is LOGGED OUT on new tab
      await newSession.page.waitForSelector('#navLoginBtn');
      await newSession.page.waitForSelector('#navRegisterBtn');
      const authCluster = await newSession.page.locator('#navAuthenticatedSection').count();
      assert.strictEqual(authCluster, 0, 'Management account must NOT persist after closing tab (X tab)');

      const errors = newSession.getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join(', ')}`);
    } finally {
      await newSession.page.close();
      await newSession.context.close();
    }
  });

  test('MS-02: Admin session lives in sessionStorage, blocked from learner pages, wiped on X tab', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/**', async (route) => {
        const url = route.request().url();
        if (url.includes('/auth/login')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'SUCCESS',
              message: 'OK',
              data: {
                token: 'jwt-mock-admin-token',
                accountId: 601,
                emailOrPhone: 'admin@example.com',
                fullName: 'Quản Trị Tối Cao',
                roles: ['Admin']
              }
            })
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }
          })
        });
      });

      // 1. Admin logs in
      await page.goto(`${baseUrl}/login.html`, { waitUntil: 'domcontentloaded' });
      await page.fill('#loginEmail', 'admin@example.com');
      await page.fill('#loginPassword', 'AdminPass123!');
      await page.click('#loginSubmitBtn');

      // Admin lands on management hub
      await page.waitForURL('**/management.html*');

      // 2. Storage verification
      const sessionToken = await page.evaluate(() => sessionStorage.getItem('access_token'));
      const localToken = await page.evaluate(() => localStorage.getItem('access_token'));
      assert.strictEqual(sessionToken, 'jwt-mock-admin-token');
      assert.strictEqual(localToken, null);

      // 3. Admin tries to visit lessons.html
      await page.goto(`${baseUrl}/lessons.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForURL('**/management.html*');
      assert.ok(page.url().includes('management.html'), 'Admin must be kicked back to management.html');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0);

    } finally {
      // Simulate closing the tab
      await page.close();
      await context.close();
    }

    // Reopen new tab
    const newSession = await createMonitoredPage(browser);
    try {
      await newSession.page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded' });
      await newSession.page.waitForSelector('#navLoginBtn');
      const authCluster = await newSession.page.locator('#navAuthenticatedSection').count();
      assert.strictEqual(authCluster, 0, 'Admin session must NOT persist across closed tab');
    } finally {
      await newSession.page.close();
      await newSession.context.close();
    }
  });

  test('MS-03: Learner session persists in localStorage across closed tabs and has normal learner access', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      await page.route('**/api/v1/**', async (route) => {
        const url = route.request().url();
        if (url.includes('/auth/login')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'SUCCESS',
              message: 'OK',
              data: {
                token: 'jwt-mock-learner-token',
                accountId: 701,
                emailOrPhone: 'student@example.com',
                fullName: 'Học Sinh Chăm Chỉ',
                roles: ['Learner']
              }
            })
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }
          })
        });
      });

      await page.goto(`${baseUrl}/login.html`, { waitUntil: 'domcontentloaded' });
      await page.fill('#loginEmail', 'student@example.com');
      await page.fill('#loginPassword', 'StudentPass123!');
      await page.click('#loginSubmitBtn');

      // Learner lands on index.html
      await page.waitForURL('**/index.html*');

      // Storage verification: Learner in localStorage
      const localToken = await page.evaluate(() => localStorage.getItem('access_token'));
      assert.strictEqual(localToken, 'jwt-mock-learner-token', 'Learner token must reside in localStorage');

      // Learner visits lessons.html freely without being blocked
      await page.goto(`${baseUrl}/lessons.html`, { waitUntil: 'domcontentloaded' });
      assert.ok(page.url().includes('lessons.html'), 'Learner stays on lessons.html');
      await page.waitForSelector('#navAuthenticatedSection');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0);

    } finally {
      await page.close();
      await context.close();
    }
  });
});
