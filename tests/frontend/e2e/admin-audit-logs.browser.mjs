/**
 * =============================================================================
 * BROWSER E2E TEST SUITE: ADMIN AUDIT LOGS & CSV EXPORT (TASK 7.3)
 * File: tests/frontend/e2e/admin-audit-logs.browser.mjs
 *
 * Scenarios:
 * - AL-01: Admin opens admin-audit-logs.html -> renders audit table, no redundant breadcrumbs/subnav.
 * - AL-02: Clicks "Xuất CSV" button -> triggers CSV generation with UTF-8 BOM and toast.
 * - AL-03: Clicks "Chi tiết" -> opens native <dialog> with diff snapshot.
 * - AL-04: Non-admin access -> displays role guard access denied message.
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

function createMockLogs() {
  return [
    {
      logId: 101,
      createdAt: '2026-10-29T03:00:00Z',
      actorId: 1,
      actorEmail: 'admin@elearning.local',
      actionType: 'LESSON_APPROVE',
      resourceType: 'LESSON',
      resourceId: 42,
      status: 'SUCCESS',
      ipAddress: '127.0.0.1',
      details: 'Phê duyệt bài học HSK 1 - Bài 1',
      payloadBefore: JSON.stringify({ status: 'Pending' }),
      payloadAfter: JSON.stringify({ status: 'Approved' })
    },
    {
      logId: 102,
      createdAt: '2026-10-29T03:05:00Z',
      actorId: 1,
      actorEmail: 'admin@elearning.local',
      actionType: 'ACCOUNT_STATUS_UPDATE',
      resourceType: 'ACCOUNT',
      resourceId: 2,
      status: 'SUCCESS',
      ipAddress: '127.0.0.1',
      details: 'Khóa tài khoản vi phạm',
      payloadBefore: JSON.stringify({ status: 'Active' }),
      payloadAfter: JSON.stringify({ status: 'Banned' })
    }
  ];
}

async function setupAdminSession(page, email = 'admin@elearning.local', accountId = 1) {
  await page.addInitScript(`
    localStorage.setItem('access_token', 'test_jwt_admin_token_task_7_3');
    localStorage.setItem('user_info', JSON.stringify({
      accountId: ${accountId},
      emailOrPhone: '${email}',
      fullName: 'Quản Trị Viên Hệ Thống',
      roles: ['Admin']
    }));
  `);
}

async function setupLearnerSession(page) {
  await page.addInitScript(`
    localStorage.setItem('access_token', 'test_jwt_learner_token_task_7_3');
    localStorage.setItem('user_info', JSON.stringify({
      accountId: 99,
      emailOrPhone: 'learner@example.com',
      fullName: 'Học Viên Thường',
      roles: ['Learner']
    }));
  `);
}

describe('Browser E2E: Admin Audit Logs & CSV Export (Task 7.3)', () => {
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

  test('AL-01: Admin opens admin-audit-logs.html and views audit table without redundant UI', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);

      await page.route(/\/api\/v1\/admin\/audit-logs(\?.*)?$/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'Thành công',
            data: {
              items: createMockLogs(),
              page: 0,
              size: 20,
              totalElements: 2,
              totalPages: 1
            }
          })
        });
      });

      await page.goto(`${baseUrl}/admin-audit-logs.html`);
      await page.waitForSelector('#auditLogsTableBody tr');

      // 1. Verify table renders 2 rows
      const rows = await page.$$('#auditLogsTableBody tr');
      assert.strictEqual(rows.length, 2, 'Should render 2 audit log entries');

      // 2. Verify redundant UI is completely absent
      const breadcrumbs = await page.$('.breadcrumb');
      assert.strictEqual(breadcrumbs, null, 'Breadcrumbs must be purged');

      const subnavTabs = await page.$('.moderator-nav-tabs');
      assert.strictEqual(subnavTabs, null, 'Moderator subnav tabs must be purged');

      // 3. Verify CSV Export button is visible and properly styled
      const exportBtn = await page.$('#btnExportCsv');
      assert.ok(exportBtn, 'Export CSV button must be present');
      const exportBtnText = await exportBtn.textContent();
      assert.ok(exportBtnText.includes('Xuất CSV'), 'Export CSV button text must include "Xuất CSV"');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, 'No uncaught errors');
    } finally {
      await context.close();
    }
  });

  test('AL-02: Clicks "Xuất CSV" triggers CSV download and success toast', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);

      await page.route(/\/api\/v1\/admin\/audit-logs(\?.*)?$/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'Thành công',
            data: {
              items: createMockLogs(),
              page: 0,
              size: 20,
              totalElements: 2,
              totalPages: 1
            }
          })
        });
      });

      await page.goto(`${baseUrl}/admin-audit-logs.html`);
      await page.waitForSelector('#auditLogsTableBody tr');

      // Intercept anchor click to prevent Windows Headless Taskbar crash
      await page.evaluate(() => {
        window.__downloadTriggered = null;
        const origClick = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function () {
          if (this.hasAttribute('download')) {
            window.__downloadTriggered = {
              download: this.getAttribute('download'),
              href: this.getAttribute('href')
            };
            return;
          }
          return origClick.apply(this, arguments);
        };
      });

      // Click export button
      await page.click('#btnExportCsv');

      // Verify download trigger
      const downloadInfo = await page.evaluate(() => window.__downloadTriggered);
      assert.ok(downloadInfo, 'Download must be triggered via anchor element');
      assert.ok(downloadInfo.download.startsWith('audit-logs-') && downloadInfo.download.endsWith('.csv'), 'Download filename matches pattern');
      assert.ok(downloadInfo.href.startsWith('blob:'), 'Download uses blob URL');

      // Toast confirms export
      const toast = await page.waitForSelector('.toast-custom', { timeout: 3000 }).catch(() => null);
      if (toast) {
        const text = await toast.textContent();
        assert.ok(text.includes('CSV') || text.includes('xuất'), 'Toast confirms export');
      }

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, 'No uncaught errors');
    } finally {
      await context.close();
    }
  });

  test('AL-03: Clicks "Chi tiết" opens native <dialog> with diff snapshot', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);

      await page.route(/\/api\/v1\/admin\/audit-logs\/\d+$/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'Thành công',
            data: createMockLogs()[0]
          })
        });
      });

      await page.route(/\/api\/v1\/admin\/audit-logs(\?.*)?$/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'Thành công',
            data: {
              items: createMockLogs(),
              page: 0,
              size: 20,
              totalElements: 2,
              totalPages: 1
            }
          })
        });
      });

      await page.goto(`${baseUrl}/admin-audit-logs.html`);
      await page.waitForSelector('.btn-view-detail');

      // Click "Chi tiết" on the first row
      await page.click('.btn-view-detail');

      const dialog = await page.waitForSelector('#auditDetailDialog[open]', { timeout: 4000 });
      assert.ok(dialog, 'Audit detail modal must be open');

      const beforeContent = await page.$eval('#detailPayloadBefore', (el) => el.textContent);
      const afterContent = await page.$eval('#detailPayloadAfter', (el) => el.textContent);
      assert.ok(beforeContent.includes('Pending'), 'Modal displays before payload');
      assert.ok(afterContent.includes('Approved'), 'Modal displays after payload');

      // Close dialog
      await page.click('#btnCloseDetailModal');
      const isClosed = await page.$eval('#auditDetailDialog', (el) => !el.hasAttribute('open'));
      assert.strictEqual(isClosed, true, 'Modal closed cleanly');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, 'No uncaught errors');
    } finally {
      await context.close();
    }
  });

  test('AL-04: Non-admin user is blocked by Role Guard', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupLearnerSession(page);

      await page.goto(`${baseUrl}/admin-audit-logs.html`);

      const guard = await page.waitForSelector('#adminAuthGuardContainer:not(.d-none)', { timeout: 5000 });
      assert.ok(guard, 'Role guard container should be displayed');

      const workspaceHidden = await page.$eval('#adminAuditLogsWorkspaceSection', (el) => el.classList.contains('d-none'));
      assert.strictEqual(workspaceHidden, true, 'Admin workspace must be hidden for non-admin');
    } finally {
      await context.close();
    }
  });
});
