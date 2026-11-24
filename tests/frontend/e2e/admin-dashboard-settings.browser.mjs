/**
 * =============================================================================
 * BROWSER E2E TEST: ADMIN DASHBOARD OVERVIEW & SYSTEM SETTINGS
 * File: tests/frontend/e2e/admin-dashboard-settings.browser.mjs
 * 
 * Verifies:
 * 1. Admin Dashboard Overview (management.html / admin-dashboard.html):
 *    - 3 enterprise blocks: 4 KPIs, 4 Quick Actions, Recent Activities table.
 *    - Sidebar item 1 (navMgmtAdminDashboard) active with aria-current="page".
 *    - Lessons link (navMgmtAdminLessons) NOT active when on dashboard.
 * 2. Admin System Settings (admin-settings.html):
 *    - Sidebar item 8 (navMgmtAdminSettings) temporarily hidden.
 *    - Form fields populated with defaults (newCardsPerDay = 20, toggles, email).
 *    - Enforces SRS bounds [1, 100] on submission.
 *    - Successful save persists settings and triggers toast.
 *    - Learner session blocked by role guard.
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

async function setupAdminSession(page, email = 'admin@hannguhoc.edu.vn', accountId = 999) {
  await page.addInitScript(`
    sessionStorage.setItem('access_token', 'jwt-mock-admin-token');
    sessionStorage.setItem('user_info', JSON.stringify({
      accountId: ${accountId},
      emailOrPhone: '${email}',
      fullName: 'Quản Trị Tối Cao',
      roles: ['Admin']
    }));
    localStorage.setItem('access_token', 'jwt-mock-admin-token');
    localStorage.setItem('user_info', JSON.stringify({
      accountId: ${accountId},
      emailOrPhone: '${email}',
      fullName: 'Quản Trị Tối Cao',
      roles: ['Admin']
    }));
  `);
}

async function setupLearnerSession(page) {
  await page.addInitScript(`
    localStorage.setItem('access_token', 'jwt-mock-learner-token');
    localStorage.setItem('user_info', JSON.stringify({
      accountId: 101,
      emailOrPhone: 'learner@example.com',
      fullName: 'Học Viên Lan',
      roles: ['Learner']
    }));
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user_info');
  `);
}

async function setupCreatorSession(page) {
  await page.addInitScript(`
    sessionStorage.setItem('access_token', 'jwt-mock-creator-token');
    sessionStorage.setItem('user_info', JSON.stringify({
      accountId: 501,
      emailOrPhone: 'creator@hannguhoc.edu.vn',
      fullName: 'Tác Giả Kiểm Thử',
      roles: ['Creator']
    }));
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
  `);
}

async function mockBackendRoutes(page) {
  await page.route(/\/api\/v1\/.*/, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/admin/audit-logs')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          message: 'Thành công',
          data: {
            items: [
              {
                logId: 105,
                createdAt: new Date().toISOString(),
                actorEmail: 'admin@hannguhoc.edu.vn',
                actorUsername: 'admin_sys',
                actionType: 'LESSON_PUBLISH',
                resourceType: 'LESSON',
                status: 'SUCCESS'
              },
              {
                logId: 104,
                createdAt: new Date().toISOString(),
                actorEmail: 'admin@hannguhoc.edu.vn',
                actorUsername: 'admin_sys',
                actionType: 'ROLE_ASSIGN',
                resourceType: 'ACCOUNT',
                status: 'SUCCESS'
              }
            ],
            page: 0,
            size: 5,
            totalElements: 2,
            totalPages: 1
          }
        })
      });
    }

    if (url.includes('/lessons')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          message: 'Thành công',
          data: {
            content: [],
            totalElements: 63
          }
        })
      });
    }

    if (url.includes('/admin/accounts')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          message: 'Thành công',
          data: {
            items: [],
            totalElements: 15
          }
        })
      });
    }

    if (url.includes('/srs/settings')) {
      if (method === 'PUT') {
        const postData = route.request().postDataJSON() || {};
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'Cập nhật cấu hình SRS thành công',
            data: postData
          })
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          message: 'Thành công',
          data: {
            newCardsPerDay: 20,
            autoPlayAudio: true,
            checkWriting: true
          }
        })
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'SUCCESS', data: {} })
    });
  });
}

describe('Browser E2E: Admin Dashboard Overview & System Settings', () => {
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

  test('AD-01: Admin opens management.html, sees 4 KPIs, 4 Quick Actions, and Recent Activities Feed', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);
      await mockBackendRoutes(page);

      await page.goto(`${baseUrl}/management.html`, { waitUntil: 'domcontentloaded' });

      // Verify Single H1
      const h1Count = await page.locator('h1').count();
      assert.strictEqual(h1Count, 1, 'Page must have exactly one <h1> heading');
      const h1Text = await page.locator('h1').textContent();
      assert.ok(h1Text.includes('Tổng Quan Quản Trị'), 'H1 heading must reflect Dashboard Overview');

      // 1. Verify 4 KPIs
      await page.waitForSelector('#kpiLessonsCount');
      const lessonsCount = await page.locator('#kpiLessonsCount').textContent();
      const accountsCount = await page.locator('#kpiAccountsCount').textContent();
      const vocabCount = await page.locator('#kpiVocabCount').textContent();
      const radicalsCount = await page.locator('#kpiRadicalsCount').textContent();

      assert.strictEqual(lessonsCount, '63', 'KPI Lessons count must default to 63');
      assert.strictEqual(accountsCount, '15', 'KPI Accounts count must default to 15');
      assert.strictEqual(vocabCount, '1.072', 'KPI Vocab count must default to 1.072');
      assert.strictEqual(radicalsCount, '214', 'KPI Radicals count must default to 214');

      // 2. Verify 4 Quick Actions
      const btnCreate = await page.locator('#btnQuickCreateLesson').count();
      const btnImport = await page.locator('#btnQuickImportExcel').count();
      const btnAccounts = await page.locator('#btnQuickManageAccounts').count();
      const btnAudit = await page.locator('#btnQuickAuditLogs').count();

      assert.strictEqual(btnCreate, 1, 'Quick action Create Lesson must exist');
      assert.strictEqual(btnImport, 1, 'Quick action Import Excel must exist');
      assert.strictEqual(btnAccounts, 1, 'Quick action Manage Accounts must exist');
      assert.strictEqual(btnAudit, 1, 'Quick action View Audit Logs must exist');

      // 3. Verify Recent Activities Feed table
      await page.waitForSelector('#dashboardAuditTable');
      const captionText = await page.locator('#dashboardAuditTable caption').textContent();
      assert.ok(captionText.length > 0, 'Table must have a descriptive caption');

      const rowCount = await page.locator('#dashboardAuditTableBody tr').count();
      assert.ok(rowCount >= 1 && rowCount <= 5, `Expected 1 to 5 audit log rows, got ${rowCount}`);

      // 4. Verify Sidebar active item (Fix "treo đầu dê bán thịt chó")
      const navLinks = page.locator('#managementSidebarNav .management-nav-link');
      assert.strictEqual(await navLinks.count(), 7, 'Admin sidebar must render exactly 7 navigation links');
      const settingsNavCount = await page.locator('#navMgmtAdminSettings').count();
      assert.strictEqual(settingsNavCount, 0, 'navMgmtAdminSettings must not exist in management.html sidebar');

      const dashboardNavLink = page.locator('#navMgmtAdminDashboard');
      assert.strictEqual(await dashboardNavLink.getAttribute('aria-current'), 'page', 'Dashboard link must have aria-current="page"');
      const isDashboardActive = await dashboardNavLink.evaluate(el => el.classList.contains('active'));
      assert.strictEqual(isDashboardActive, true, 'Dashboard link must have .active class');

      const lessonsNavLink = page.locator('#navMgmtAdminLessons');
      assert.strictEqual(await lessonsNavLink.getAttribute('aria-current'), null, 'Lessons link must NOT have aria-current');
      const isLessonsActive = await lessonsNavLink.evaluate(el => el.classList.contains('active'));
      assert.strictEqual(isLessonsActive, false, 'Lessons link must NOT have .active class when on management.html');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors on management.html: ${errors.join(', ')}`);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('AD-02: admin-dashboard.html renders identical 3-block enterprise layout and active sidebar', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);
      await mockBackendRoutes(page);

      await page.goto(`${baseUrl}/admin-dashboard.html`, { waitUntil: 'domcontentloaded' });

      // Verify KPIs and Quick actions exist
      await page.waitForSelector('#kpiLessonsCount');
      assert.strictEqual(await page.locator('#kpiLessonsCount').textContent(), '63');
      assert.strictEqual(await page.locator('#btnQuickCreateLesson').count(), 1);

      // Verify Sidebar Highlights item 1
      const dashboardNavLink = page.locator('#navMgmtAdminDashboard');
      assert.strictEqual(await dashboardNavLink.getAttribute('aria-current'), 'page');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors on admin-dashboard.html: ${errors.join(', ')}`);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('AD-03: Learner visiting management.html is blocked by role guard and admin dashboard is hidden', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupLearnerSession(page);
      await mockBackendRoutes(page);

      await page.goto(`${baseUrl}/management.html`, { waitUntil: 'domcontentloaded' });

      // Verify guard alert displayed and dashboard hidden
      await page.waitForSelector('#managementAuthGuardContainer:not(.d-none)');
      const guardMsg = await page.locator('#managementAuthGuardMessage').textContent();
      assert.ok(guardMsg.includes('Học viên'), 'Guard message must mention learner role');

      const isDashboardHidden = await page.locator('#managementDashboardContent').evaluate(el => el.classList.contains('d-none'));
      assert.strictEqual(isDashboardHidden, true, 'Dashboard content must be hidden from learner session');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('AD-04: Creator visiting management.html is redirected to creator-lessons.html workspace', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupCreatorSession(page);
      await mockBackendRoutes(page);

      await page.goto(`${baseUrl}/management.html`, { waitUntil: 'domcontentloaded' });

      // Expect automatic redirection to creator workspace
      await page.waitForURL('**/creator-lessons.html*');
      assert.ok(page.url().includes('creator-lessons.html'), 'Creator must be redirected to creator-lessons.html');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('AD-05: Empty audit activities list renders empty state notice cleanly', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);
      await mockBackendRoutes(page);

      // Override audit-logs route to return empty items array
      await page.route(/\/api\/v1\/admin\/audit-logs.*/, async (route) => {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              items: [],
              page: 0,
              size: 5,
              totalElements: 0,
              totalPages: 0
            }
          })
        });
      });

      await page.goto(`${baseUrl}/management.html`, { waitUntil: 'domcontentloaded' });

      // Verify empty state container is visible
      await page.waitForSelector('#dashboardAuditState:not(.d-none)');
      const emptyMsg = await page.locator('#dashboardAuditState').textContent();
      assert.ok(emptyMsg.includes('Chưa có hoạt động kiểm toán nào'), `Expected empty message, got: ${emptyMsg}`);

      // Verify table body has 0 rows
      const rowCount = await page.locator('#dashboardAuditTableBody tr').count();
      assert.strictEqual(rowCount, 0, 'Table body must contain zero rows when audit log list is empty');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('AD-06: Quick action "Tạo bài học mới" with ?action=create auto-opens create modal on admin-lessons.html', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);
      await mockBackendRoutes(page);

      await page.goto(`${baseUrl}/management.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#btnQuickCreateLesson');

      // Click "＋ Tạo bài học mới"
      await Promise.all([
        page.waitForURL('**/admin-lessons.html?action=create*'),
        page.click('#btnQuickCreateLesson')
      ]);

      // Verify #lessonFormModal is open
      await page.waitForSelector('#lessonFormModal[open]');
      const modalTitle = await page.locator('#lessonFormModalTitle').textContent();
      assert.ok(modalTitle.includes('Bài Học Mới'), `Modal title must be Bài Học Mới, got: ${modalTitle}`);

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('AS-01: Admin opens admin-settings.html, confirms item 8 is hidden from sidebar, and form defaults are populated', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);
      await mockBackendRoutes(page);

      await page.goto(`${baseUrl}/admin-settings.html`, { waitUntil: 'domcontentloaded' });

      // Verify Single H1
      const h1Count = await page.locator('h1').count();
      assert.strictEqual(h1Count, 1);
      const h1Text = await page.locator('h1').textContent();
      assert.ok(h1Text.includes('Cài Đặt Hệ Thống'));

      // Verify Sidebar item 8 (navMgmtAdminSettings) is temporarily hidden
      const navLinks = page.locator('#managementSidebarNav .management-nav-link');
      assert.strictEqual(await navLinks.count(), 7, 'Admin sidebar must render exactly 7 navigation links on admin-settings.html');
      const settingsNavCount = await page.locator('#navMgmtAdminSettings').count();
      assert.strictEqual(settingsNavCount, 0, 'navMgmtAdminSettings should be hidden from sidebar');
      const activeNavCount = await page.locator('#managementSidebarNav .management-nav-link[aria-current="page"]').count();
      assert.strictEqual(activeNavCount, 0, 'No links should have aria-current="page" on unlisted admin-settings.html');

      // Verify form inputs populated with defaults
      await page.waitForSelector('#settingNewCardsPerDay');
      const newCardsVal = await page.locator('#settingNewCardsPerDay').inputValue();
      assert.strictEqual(newCardsVal, '20', 'Default newCardsPerDay must be 20');

      const autoPlayChecked = await page.locator('#settingAutoPlayAudio').isChecked();
      assert.strictEqual(autoPlayChecked, true, 'Default autoPlayAudio must be checked');

      const checkWritingChecked = await page.locator('#settingCheckWriting').isChecked();
      assert.strictEqual(checkWritingChecked, true, 'Default checkWriting must be checked');

      const platformNameVal = await page.locator('#settingPlatformName').inputValue();
      assert.strictEqual(platformNameVal, 'Hán Ngữ Học');

      const supportEmailVal = await page.locator('#settingSupportEmail').inputValue();
      assert.strictEqual(supportEmailVal, 'support@hannguhoc.edu.vn');

      const maintenanceChecked = await page.locator('#settingMaintenanceMode').isChecked();
      assert.strictEqual(maintenanceChecked, false, 'Default maintenanceMode must be false');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors on admin-settings.html: ${errors.join(', ')}`);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('AS-02: Form validates SRS card bounds [1, 100] and blocks invalid inputs', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);
      await mockBackendRoutes(page);

      await page.goto(`${baseUrl}/admin-settings.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#settingNewCardsPerDay');

      // Attempt > 100
      await page.fill('#settingNewCardsPerDay', '150');
      await page.click('#btnSaveSettings');

      await page.waitForSelector('#settingNewCardsError:not(.d-none)');
      const errText = await page.locator('#settingNewCardsError').textContent();
      assert.ok(errText.includes('không được vượt quá 100'), `Expected bound error, got: ${errText}`);

      // Attempt 0
      await page.fill('#settingNewCardsPerDay', '0');
      await page.click('#btnSaveSettings');
      const errZero = await page.locator('#settingNewCardsError').textContent();
      assert.ok(errZero.includes('lớn hơn 0'), `Expected >0 error, got: ${errZero}`);

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('AS-03: Valid configuration save triggers success toast and persists settings', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);
      await mockBackendRoutes(page);

      await page.goto(`${baseUrl}/admin-settings.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#settingNewCardsPerDay');

      // Enter valid custom configuration
      await page.fill('#settingNewCardsPerDay', '45');
      await page.fill('#settingPlatformName', 'Hán Ngữ Học Đường Enterprise');
      await page.click('#btnSaveSettings');

      // Verify success toast
      await page.waitForSelector('.toast-custom, .toast');
      const toastText = await page.locator('.toast-custom, .toast').first().textContent();
      assert.ok(toastText.includes('thành công'), `Toast must indicate success, got: ${toastText}`);

      // Verify localStorage persistence
      const savedRaw = await page.evaluate(() => localStorage.getItem('HOC_HAN_NGU_SYSTEM_SETTINGS'));
      assert.ok(savedRaw, 'Configuration must be saved in localStorage');
      const saved = JSON.parse(savedRaw);
      assert.strictEqual(saved.newCardsPerDay, 45);
      assert.strictEqual(saved.platformName, 'Hán Ngữ Học Đường Enterprise');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('AS-04: Non-admin learner session is blocked on admin-settings.html by role guard', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupLearnerSession(page);
      await mockBackendRoutes(page);

      await page.goto(`${baseUrl}/admin-settings.html`, { waitUntil: 'domcontentloaded' });

      // Verify guard alert displayed and form hidden
      await page.waitForSelector('#adminAuthGuardContainer:not(.d-none)');
      const guardText = await page.locator('#adminAuthGuardMessage').textContent();
      assert.ok(guardText.includes('Quản trị viên (Admin)'), 'Guard message must require Admin role');

      const isFormHidden = await page.locator('#adminSettingsFormContainer').evaluate(el => el.classList.contains('d-none'));
      assert.strictEqual(isFormHidden, true, 'Settings form container must be hidden from non-admin users');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0);
    } finally {
      await page.close();
      await context.close();
    }
  });

});
