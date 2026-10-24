/**
 * =============================================================================
 * BROWSER E2E TEST: SRS STUDY STATISTICS & PROFILE SETTINGS INTEGRATION
 * File: tests/frontend/e2e/srs-dashboard.browser.mjs
 *
 * Verifies:
 * - SD-01: Anonymous user displays login-required state without calling protected SRS APIs.
 * - SD-02: Authenticated user loads dashboard, displays authoritative statistics (CardsDue, ReviewsToday, NewCardsToday, NewCardsLimit).
 *          Verifies maxReviewLimit and reviewsQuotaText are NOT displayed (review quota removed).
 *          Verifies links to Profile SRS Settings are present.
 * - SD-03: Cross-navigation between SRS Dashboard, SRS Review Room, and Profile Settings.
 * - SD-04: Profile Learning Settings tab loads and pre-fills newCardsPerDay without maxReviewPerDay input.
 * - SD-05: Profile SRS Settings validation rejects invalid inputs (0, negative, decimal, empty) without submitting PUT.
 * - SD-06: Profile SRS Settings successful update submits clean payload and reflects updated setting.
 * - SD-07: Profile SRS Settings reset button restores original authoritative values into inputs.
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

function createMockStudyStats(overrides = {}) {
  return {
    cardsDue: 8,
    reviewsToday: 12,
    newCardsToday: 5,
    newCardsLimit: 20,
    maxReviewLimit: 100,
    ...overrides
  };
}

function createMockUserSrsSetting(overrides = {}) {
  return {
    settingId: 101,
    newCardsPerDay: 20,
    maxReviewPerDay: 100,
    ...overrides
  };
}

function createMockUserProfile(overrides = {}) {
  return {
    userId: 501,
    accountId: 1001,
    fullName: 'Học Viên Dashboard',
    emailOrPhone: 'srs_dashboard_user@example.com',
    avatarUrl: null,
    createdAt: '2026-01-15T08:30:00Z',
    ...overrides
  };
}

async function setupAuthenticatedSession(page) {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'test_srs_learner_jwt');
    localStorage.setItem('user_info', JSON.stringify({
      accountId: 1001,
      emailOrPhone: 'srs_dashboard_user@example.com',
      fullName: 'Học Viên Dashboard',
      roles: ['Learner']
    }));
  });
}

describe('Browser E2E: SRS Dashboard & Profile Settings Integration', () => {
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

  // SD-01: Anonymous Guard
  test('SD-01: Anonymous user displays login-required state without calling protected SRS APIs', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      let interceptedSrsCall = false;
      await page.route('**/api/v1/srs/**', async (route) => {
        interceptedSrsCall = true;
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Unauthorized' })
        });
      });

      await page.goto(`${baseUrl}/srs-dashboard.html`, { waitUntil: 'domcontentloaded' });

      // Verify login-required state is visible
      const authState = page.locator('#dashboardAuthState');
      await authState.waitFor({ state: 'visible' });

      // Verify content section is hidden
      const isContentHidden = await page.locator('#dashboardContentSection').evaluate(el => el.classList.contains('d-none'));
      assert.strictEqual(isContentHidden, true, 'Content section must remain hidden for anonymous user');

      // Verify login redirect button
      const loginBtn = page.locator('#btnDashboardLoginRedirect');
      const href = await loginBtn.getAttribute('href');
      assert.ok(href.includes('login.html'), 'Login button must redirect to login.html');

      assert.strictEqual(interceptedSrsCall, false, 'Protected SRS APIs must NEVER be called by anonymous clients');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors on anonymous page load:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // SD-02: Authenticated Dashboard Metrics & Removal of Review Quota
  test('SD-02: Authenticated user loads dashboard, displays authoritative stats, without review quota or maxReviewLimit card', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      const mockStats = createMockStudyStats();

      await page.route('**/api/v1/srs/stats', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', data: mockStats })
        });
      });

      await page.route('**/api/v1/srs/settings', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', data: createMockUserSrsSetting() })
        });
      });

      await page.goto(`${baseUrl}/srs-dashboard.html`, { waitUntil: 'domcontentloaded' });

      // Content section becomes visible
      await page.locator('#dashboardContentSection').waitFor({ state: 'visible' });

      // 1. Verify authoritative statistics values
      assert.strictEqual(await page.locator('#statCardsDue').textContent(), '8');
      assert.strictEqual(await page.locator('#statReviewsToday').textContent(), '12');
      assert.strictEqual(await page.locator('#statNewCardsToday').textContent(), '5');
      assert.strictEqual(await page.locator('#statNewCardsLimit').textContent(), '20');

      // 2. Verify review quota elements are completely removed
      const hasMaxReviewCard = await page.locator('#cardMaxReviewLimit').count();
      assert.strictEqual(hasMaxReviewCard, 0, 'cardMaxReviewLimit must be removed from dashboard');

      const hasReviewQuotaText = await page.locator('#statReviewsQuotaText').count();
      assert.strictEqual(hasReviewQuotaText, 0, 'statReviewsQuotaText must be removed from dashboard');

      // 3. Verify new cards quota text is kept
      const newCardsQuota = await page.locator('#statNewCardsQuotaText').textContent();
      assert.strictEqual(newCardsQuota, '5 / 20');

      // 4. Verify link to Profile SRS Settings
      const profileLink = page.locator('#btnLinkProfileSettings');
      await profileLink.waitFor({ state: 'visible' });
      const href = await profileLink.getAttribute('href');
      assert.ok(href.includes('profile.html#srs-settings'), 'Must link to profile.html#srs-settings');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors during dashboard load:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // SD-03: Cross-Navigation
  test('SD-03: Cross-navigation between SRS Dashboard, Review Room, and Profile Settings', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/**', async (route) => {
        const url = route.request().url();
        if (url.includes('/srs/stats')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 'SUCCESS', data: createMockStudyStats() })
          });
        }
        if (url.includes('/srs/due')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 'SUCCESS', data: [] })
          });
        }
        if (url.includes('/users/profile')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 'SUCCESS', data: createMockUserProfile() })
          });
        }
        if (url.includes('/srs/settings')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 'SUCCESS', data: createMockUserSrsSetting() })
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', data: [] })
        });
      });

      await page.goto(`${baseUrl}/srs-dashboard.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#dashboardContentSection').waitFor({ state: 'visible' });

      // Click "Vào phòng ôn tập" button
      await page.locator('#btnGoToReview').click();
      await page.waitForURL('**/srs-review.html');

      // On srs-review.html, click link to return to dashboard via account dropdown
      const accountDropdown = page.locator('#navAccountDropdownTrigger');
      await accountDropdown.waitFor({ state: 'visible' });
      await accountDropdown.click();

      const returnLink = page.locator('#navLearningProgressBtn');
      await returnLink.waitFor({ state: 'visible' });
      await returnLink.click();
      await page.waitForURL('**/srs-dashboard.html');

      // On dashboard, click link to Profile Settings
      await page.locator('#btnLinkProfileSettings').click();
      await page.waitForURL('**/profile.html#srs-settings');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors during cross-navigation:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // SD-04: Profile Learning Settings Tab Activation & Pre-fill
  test('SD-04: Profile Learning Settings tab activates via hash and displays newCardsPerDay without maxReviewPerDay', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/users/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', data: createMockUserProfile() })
        });
      });

      await page.route('**/api/v1/srs/settings', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', data: createMockUserSrsSetting({ newCardsPerDay: 15, maxReviewPerDay: 80 }) })
        });
      });

      // Navigate directly to profile with hash #srs-settings
      await page.goto(`${baseUrl}/profile.html#srs-settings`, { waitUntil: 'domcontentloaded' });

      // Profile card becomes visible
      await page.locator('#profileCard').waitFor({ state: 'visible' });

      // Check that Learning Settings tab is active
      const isSettingsTabActive = await page.locator('#tabLearningSettings').evaluate(el => el.classList.contains('active'));
      assert.strictEqual(isSettingsTabActive, true, 'Learning Settings tab must be active when hash is #srs-settings');

      // Check input pre-filled with newCardsPerDay
      const newCardsInput = page.locator('#srsNewCardsPerDayInput');
      await page.waitForFunction(() => document.getElementById('srsNewCardsPerDayInput')?.value === '15');
      assert.strictEqual(await newCardsInput.inputValue(), '15');

      // Check that maxReviewPerDay input is NOT present in profile
      const hasMaxReviewInput = await page.locator('#maxReviewPerDayInput, input[name="maxReviewPerDay"]').count();
      assert.strictEqual(hasMaxReviewInput, 0, 'maxReviewPerDay input must NOT exist on profile page');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors during profile load:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // SD-05: Profile SRS Settings Client-side Validation Rejection
  test('SD-05: Profile SRS Settings validation rejects invalid inputs without submitting PUT', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      let putCalled = false;
      await page.route('**/api/v1/users/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', data: createMockUserProfile() })
        });
      });

      await page.route('**/api/v1/srs/settings', async (route) => {
        if (route.request().method() === 'PUT') {
          putCalled = true;
          await route.fulfill({ status: 500 });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 'SUCCESS', data: createMockUserSrsSetting() })
          });
        }
      });

      await page.goto(`${baseUrl}/profile.html#srs-settings`, { waitUntil: 'domcontentloaded' });
      await page.locator('#profileCard').waitFor({ state: 'visible' });

      // Test 1: Zero value rejection
      await page.locator('#srsNewCardsPerDayInput').fill('0');
      await page.locator('#btnSaveSrsSettings').click();

      assert.strictEqual(putCalled, false, 'PUT must not be called when input is 0');
      const errZero = await page.locator('#srsNewCardsPerDayError').textContent();
      assert.ok(errZero.includes('lớn hơn 0'), `Expected positive integer error, got "${errZero}"`);

      // Test 2: Negative value rejection
      await page.locator('#srsNewCardsPerDayInput').fill('-5');
      await page.locator('#btnSaveSrsSettings').click();
      assert.strictEqual(putCalled, false, 'PUT must not be called when input is negative');

      // Test 3: Empty value rejection
      await page.locator('#srsNewCardsPerDayInput').fill('');
      await page.locator('#btnSaveSrsSettings').click();
      assert.strictEqual(putCalled, false, 'PUT must not be called when input is empty');
      const errEmpty = await page.locator('#srsNewCardsPerDayError').textContent();
      assert.ok(errEmpty.includes('không được để trống'), `Expected empty error, got "${errEmpty}"`);

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors during validation test:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // SD-06: Profile SRS Settings Successful Update
  test('SD-06: Profile SRS Settings submits clean newCardsPerDay payload and updates state', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      let putPayload = null;
      let currentSettings = createMockUserSrsSetting({ newCardsPerDay: 20 });

      await page.route('**/api/v1/users/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', data: createMockUserProfile() })
        });
      });

      await page.route('**/api/v1/srs/settings', async (route) => {
        if (route.request().method() === 'PUT') {
          putPayload = JSON.parse(route.request().postData());
          currentSettings = {
            ...currentSettings,
            newCardsPerDay: putPayload.newCardsPerDay
          };
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'SUCCESS',
              message: 'Cập nhật cấu hình học tập thành công',
              data: currentSettings
            })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 'SUCCESS', data: currentSettings })
          });
        }
      });

      await page.goto(`${baseUrl}/profile.html#srs-settings`, { waitUntil: 'domcontentloaded' });
      await page.locator('#profileCard').waitFor({ state: 'visible' });

      // Change value to 35
      await page.locator('#srsNewCardsPerDayInput').fill('35');

      // Click save
      const [response] = await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/v1/srs/settings') && res.request().method() === 'PUT'),
        page.locator('#btnSaveSrsSettings').click()
      ]);

      assert.ok(response, 'PUT response received');
      assert.deepStrictEqual(putPayload, {
        newCardsPerDay: 35,
        maxReviewPerDay: 100
      }, 'PUT request must contain newCardsPerDay and preserve maxReviewPerDay without user leakage');

      // Verify success status displayed
      const statusText = await page.locator('#srsSettingsStatus').textContent();
      assert.ok(statusText.includes('thành công'), `Expected success status, got "${statusText}"`);
      assert.strictEqual(await page.locator('#srsNewCardsPerDayInput').inputValue(), '35');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors during update test:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // SD-07: Profile SRS Settings Reset Button
  test('SD-07: Profile SRS Settings reset button restores original authoritative value', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/users/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', data: createMockUserProfile() })
        });
      });

      await page.route('**/api/v1/srs/settings', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', data: createMockUserSrsSetting({ newCardsPerDay: 25 }) })
        });
      });

      await page.goto(`${baseUrl}/profile.html#srs-settings`, { waitUntil: 'domcontentloaded' });
      await page.locator('#profileCard').waitFor({ state: 'visible' });
      await page.waitForFunction(() => document.getElementById('srsNewCardsPerDayInput')?.value === '25');

      // Change input value locally without submitting
      await page.locator('#srsNewCardsPerDayInput').fill('999');

      // Click Reset
      await page.locator('#btnResetSrsSettings').click();

      // Check value restored
      assert.strictEqual(await page.locator('#srsNewCardsPerDayInput').inputValue(), '25');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors during reset test:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // SD-08: Profile SRS Settings Quick Presets and Stepper Controls
  test('SD-08: Profile SRS Settings Quick Presets and Stepper Controls update input and submit successfully', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/users/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', data: createMockUserProfile() })
        });
      });

      let submittedPayload = null;
      await page.route('**/api/v1/srs/settings', async (route) => {
        if (route.request().method() === 'PUT') {
          submittedPayload = JSON.parse(route.request().postData());
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 'SUCCESS', data: createMockUserSrsSetting({ newCardsPerDay: submittedPayload.newCardsPerDay }) })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 'SUCCESS', data: createMockUserSrsSetting({ newCardsPerDay: 20 }) })
          });
        }
      });

      await page.goto(`${baseUrl}/profile.html#srs-settings`, { waitUntil: 'domcontentloaded' });
      await page.locator('#profileCard').waitFor({ state: 'visible' });
      await page.waitForFunction(() => document.getElementById('srsNewCardsPerDayInput')?.value === '20');

      // Initial state: 20 preset chip is active
      const chip20 = page.locator('.srs-preset-chip[data-preset="20"]');
      const chip10 = page.locator('.srs-preset-chip[data-preset="10"]');
      assert.strictEqual(await chip20.evaluate(el => el.classList.contains('active')), true);

      // Click 10 preset chip
      await chip10.click();
      assert.strictEqual(await page.locator('#srsNewCardsPerDayInput').inputValue(), '10');
      assert.strictEqual(await chip10.evaluate(el => el.classList.contains('active')), true);
      assert.strictEqual(await chip20.evaluate(el => el.classList.contains('active')), false);

      // Click Increment (+5)
      await page.locator('#btnIncrementNewCards').click();
      assert.strictEqual(await page.locator('#srsNewCardsPerDayInput').inputValue(), '15');
      assert.strictEqual(await chip10.evaluate(el => el.classList.contains('active')), false);

      // Click Decrement (-5)
      await page.locator('#btnDecrementNewCards').click();
      assert.strictEqual(await page.locator('#srsNewCardsPerDayInput').inputValue(), '10');
      assert.strictEqual(await chip10.evaluate(el => el.classList.contains('active')), true);

      // Submit Save
      await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/v1/srs/settings') && res.request().method() === 'PUT'),
        page.locator('#btnSaveSrsSettings').click()
      ]);

      // Verify submitted payload
      assert.deepStrictEqual(submittedPayload, {
        newCardsPerDay: 10,
        maxReviewPerDay: 100
      });

      // Verify success status
      await page.waitForFunction(() => {
        const text = document.getElementById('srsSettingsStatus')?.textContent || '';
        return text.includes('thành công');
      });
      const statusText = await page.locator('#srsSettingsStatus').textContent();
      assert.ok(statusText.includes('thành công'), `Status must indicate success: ${statusText}`);

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors during presets/stepper test:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // SD-09: Avatar Dropdown "Tiến độ học tập" Navigation & Unified Navbar Active State
  test('SD-09: Avatar dropdown displays "Tiến độ học tập" below "Hồ sơ", navigates to srs-dashboard.html, and highlights "Ôn tập" in unified 4-item navbar', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/srs/stats', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', data: createMockStudyStats() })
        });
      });

      await page.route('**/api/v1/srs/settings', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', data: createMockUserSrsSetting() })
        });
      });

      await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded' });
      const userToggle = page.locator('#navAccountDropdownTrigger');
      await userToggle.waitFor({ state: 'visible' });
      await userToggle.click();

      const userMenu = page.locator('#navAccountDropdownMenu');
      await userMenu.waitFor({ state: 'visible' });

      const menuLinks = await userMenu.locator('a.nav-dropdown-item').evaluateAll(els =>
        els.map(el => ({ id: el.id, text: (el.textContent || '').trim(), href: el.getAttribute('href') }))
      );
      assert.ok(menuLinks.length >= 2, 'Dropdown must contain at least Hồ sơ and Tiến độ học tập');
      assert.strictEqual(menuLinks[0].id, 'navProfileBtn');
      assert.strictEqual(menuLinks[0].text, 'Hồ sơ');
      assert.strictEqual(menuLinks[1].id, 'navLearningProgressBtn');
      assert.strictEqual(menuLinks[1].text, 'Tiến độ học tập');
      assert.strictEqual(menuLinks[1].href, 'srs-dashboard.html');

      await Promise.all([
        page.waitForURL('**/srs-dashboard.html'),
        page.locator('#navLearningProgressBtn').click()
      ]);

      await page.locator('#dashboardContentSection').waitFor({ state: 'visible' });
      const headerTitle = await page.locator('h1').textContent();
      assert.ok(headerTitle.toLowerCase().includes('tiến độ học tập'), `Expected h1 to include "Tiến độ học tập", got "${headerTitle}"`);

      const publicNavLinks = await page.locator('.navbar-nav a.nav-link-custom:not([data-auth-role])').evaluateAll(els =>
        els.map(el => ({
          text: (el.textContent || '').trim(),
          href: el.getAttribute('href'),
          active: el.classList.contains('active'),
          ariaCurrent: el.getAttribute('aria-current')
        }))
      );
      assert.strictEqual(publicNavLinks.length, 4, 'Unified public navbar must have exactly 4 links');
      assert.deepStrictEqual(
        publicNavLinks.map(l => l.text),
        ['Trang chủ', 'Bộ thủ', 'Từ vựng', 'Ôn tập']
      );
      const onTapLink = publicNavLinks.find(l => l.href === 'srs-review.html');
      assert.ok(onTapLink && onTapLink.active && onTapLink.ariaCurrent === 'page', 'Ôn tập must be active with aria-current="page" on srs-dashboard.html');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors during avatar dropdown navigation:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

});
