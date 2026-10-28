/**
 * =============================================================================
 * BROWSER E2E TEST: SELF-SERVICE PASSWORD RESET (MODEL A) & ADMIN ZERO-KNOWLEDGE
 * File: tests/frontend/e2e/forgot-password-model-a.browser.mjs
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

const ARTIFACTS_DIR = 'C:/Users/LENOVO/.gemini/antigravity/brain/e46cf599-98c5-46de-b4e5-42bb9873a11e';

describe('E2E: Self-Service Password Reset (Model A) & Admin Zero-Knowledge', () => {
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

  test('FP-01: User can self-reset password via 2-step verification code flow on login.html', async () => {
    const { page, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 800
    });
    page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.text()));

    try {
      // Mock Auth endpoints for self-service password reset
      await page.route('**/api/v1/auth/forgot-password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'Nếu email tồn tại trong hệ thống, mã xác thực đã được gửi đến hòm thư của bạn.',
            data: null,
            demoCode: '123456'
          })
        });
      });

      await page.route('**/api/v1/auth/reset-password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.',
            data: null
          })
        });
      });

      await page.goto(`${baseUrl}/login.html`, { waitUntil: 'networkidle' });

      // 1. Click "Quên mật khẩu?"
      await page.waitForSelector('#forgotPasswordLink', { state: 'visible', timeout: 5000 });
      await page.click('#forgotPasswordLink');

      // 2. Wait for modal & Step 1 input
      await page.waitForSelector('#forgotEmailInput', { state: 'visible', timeout: 5000 });
      await page.fill('#forgotEmailInput', 'learner@example.com');

      // Screenshot Step 1
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, 'login_forgot_password_step1.png'),
        fullPage: false
      });

      // 3. Click "Gửi mã xác nhận"
      await page.click('#btnSendResetCode');

      // 4. Wait for Step 2 to become visible
      await page.waitForSelector('#forgotCodeInput', { state: 'visible', timeout: 5000 });
      const targetEmailText = await page.textContent('#forgotTargetEmailDisplay');
      assert.strictEqual(targetEmailText.trim(), 'learner@example.com');

      // Fill Step 2 inputs
      await page.fill('#forgotCodeInput', '123456');
      await page.fill('#forgotNewPasswordInput', 'NewSecurePass@123');
      await page.fill('#forgotConfirmPasswordInput', 'NewSecurePass@123');

      // Screenshot Step 2
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, 'login_forgot_password_step2.png'),
        fullPage: false
      });

      // 5. Submit reset password
      await page.click('#btnSubmitResetPassword');

      // 6. Wait for Success Step
      await page.waitForSelector('#forgotSuccessSection', { state: 'visible', timeout: 5000 });

      // Screenshot Step 3
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, 'login_forgot_password_step3.png'),
        fullPage: false
      });

      // Click "Đăng nhập ngay"
      await page.click('#btnGoToLogin');

      // Wait a moment for modal hide transition
      await page.waitForTimeout(500);

      // Verify email is prefilled in login form
      const prefilledEmail = await page.inputValue('#loginEmail');
      assert.strictEqual(prefilledEmail, 'learner@example.com', 'Login form email must be pre-filled');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `No console errors: ${errors.join(', ')}`);
    } finally {
      await page.close();
    }
  });

  test('FP-02: Admin accounts management page strictly enforces Zero-Knowledge (no reset button/modal)', async () => {
    const { page, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 800
    });
    page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.text()));

    try {
      // Simulate Admin authenticated session
      await page.addInitScript(`
        localStorage.setItem('access_token', 'test_jwt_admin_token_task_9f1');
        localStorage.setItem('user_info', JSON.stringify({
          accountId: 1,
          emailOrPhone: 'admin@example.com',
          fullName: 'Quản Trị Viên Chính',
          roles: ['Admin']
        }));
      `);

      // Mock admin accounts API
      await page.route(/\/api\/v1\/admin\/accounts(\?.*)?$/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'Thành công',
            data: {
              items: [
                {
                  accountId: 1,
                  emailOrPhone: 'admin@example.com',
                  fullName: 'Quản Trị Viên Chính',
                  status: 'Active',
                  roles: ['Admin'],
                  createdAt: '2026-09-01T08:00:00Z',
                  updatedAt: '2026-09-01T08:00:00Z'
                },
                {
                  accountId: 2,
                  emailOrPhone: 'learner1@example.com',
                  fullName: 'Học Viên Một',
                  status: 'Active',
                  roles: ['Learner'],
                  createdAt: '2026-09-05T09:30:00Z',
                  updatedAt: '2026-09-05T09:30:00Z'
                },
                {
                  accountId: 3,
                  emailOrPhone: 'creator1@example.com',
                  fullName: 'Tác Giả Một',
                  status: 'Inactive',
                  roles: ['Creator'],
                  createdAt: '2026-09-10T14:15:00Z',
                  updatedAt: '2026-09-10T14:15:00Z'
                }
              ],
              page: 0,
              size: 20,
              totalElements: 3,
              totalPages: 1
            }
          })
        });
      });

      await page.goto(`${baseUrl}/admin-accounts.html`, { waitUntil: 'networkidle' });

      // Wait for table to populate
      await page.waitForSelector('#accountsTableBody tr', { state: 'visible', timeout: 10000 });

      // Assert #resetPasswordModal does not exist in DOM
      const modalCount = await page.locator('#resetPasswordModal').count();
      assert.strictEqual(modalCount, 0, '#resetPasswordModal must NOT exist in DOM');

      // Assert .btn-reset-password does not exist anywhere in table
      const resetBtnCount = await page.locator('.btn-reset-password').count();
      assert.strictEqual(resetBtnCount, 0, 'No .btn-reset-password elements should exist in the accounts table');

      // Capture Table Screenshot showing horizontal buttons [ Phân quyền ] and [ Khóa tài khoản ] only
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, 'admin_accounts_table_no_reset_btn.png'),
        fullPage: false
      });

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `No console errors: ${errors.join(', ')}`);
    } finally {
      await page.close();
    }
  });
});
