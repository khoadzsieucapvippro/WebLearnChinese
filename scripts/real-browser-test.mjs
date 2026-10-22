import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

const ARTIFACT_DIR = path.resolve('tests/screenshots');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function runRealBrowserVerification() {
  console.log('=== REAL BROWSER VERIFICATION (Chromium) ===');
  
  // Find local Chrome or Edge executable if playwright browser is not downloaded
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  
  const executablePath = possiblePaths.find(p => fs.existsSync(p));
  console.log('Using browser executable:', executablePath || 'Playwright bundled Chromium');

  const launchOptions = {
    headless: true,
    ...(executablePath ? { executablePath } : {})
  };

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER PAGEERROR:', err.message));

  // Route API requests to simulate live backend responses
  await page.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/auth/login') && method === 'POST') {
      const postData = JSON.parse(route.request().postData() || '{}');
      const isAdmin = postData.emailOrPhone?.includes('admin');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          message: 'OK',
          data: {
            token: isAdmin ? 'admin-mock-jwt-token' : 'learner-mock-jwt-token',
            type: 'Bearer',
            accountId: isAdmin ? 1 : 101,
            emailOrPhone: postData.emailOrPhone,
            fullName: isAdmin ? 'Quản Trị Viên Mẫu' : 'Học Viên Mẫu',
            roles: isAdmin ? ['Admin'] : ['Learner']
          }
        })
      });
    }

    if (url.includes('/users/profile')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          message: 'OK',
          data: {
            accountId: 1,
            emailOrPhone: 'admin@weblearnchinese.com',
            fullName: 'Quản Trị Viên Mẫu',
            roles: ['Admin'],
            status: 'Active',
            createdAt: '2026-01-01T00:00:00Z'
          }
        })
      });
    }

    if (url.includes('/srs/settings')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          message: 'OK',
          data: {
            newCardsPerDay: 20,
            maxReviewPerDay: 100
          }
        })
      });
    }

    if (url.includes('/srs/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          message: 'OK',
          data: {
            totalLearned: 50,
            dueToday: 10,
            streakDays: 5
          }
        })
      });
    }

    // Default fallback for any other API call
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: [] })
    });
  });

  try {
    // =========================================================================
    // STEP 1: Visit login.html as Guest
    // =========================================================================
    console.log('\n--- Step 1: Navigating to login.html ---');
    await page.goto('http://localhost:3000/login.html', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-login-page.png'), fullPage: false });
    console.log('Saved screenshot: 01-login-page.png');

    // =========================================================================
    // STEP 2: Login as Admin
    // =========================================================================
    console.log('\n--- Step 2: Logging in as Admin (admin@weblearnchinese.com) ---');
    await page.fill('#loginEmail', 'admin@weblearnchinese.com');
    await page.fill('#loginPassword', 'Admin@123456');
    await page.click('#loginSubmitBtn');

    // Wait for redirect to management.html
    await page.waitForURL('**/management.html*', { timeout: 10000 });
    console.log('SUCCESS: Admin redirected to:', page.url());
    assert.ok(page.url().includes('management.html'), 'CRITICAL: Admin MUST be redirected to management.html, NOT index.html');

    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-admin-management-hub.png'), fullPage: false });
    console.log('Saved screenshot: 02-admin-management-hub.png');

    // =========================================================================
    // STEP 3: Verify Management Header & Navigation
    // =========================================================================
    console.log('\n--- Step 3: Verifying Management Workspace Isolation ---');
    // Check brand seal and title in management header
    const brandSeal = await page.locator('.management-header .chinese-seal-icon, .management-header .brand-seal-mark').first().textContent();
    console.log('Brand seal text:', brandSeal.trim());
    assert.strictEqual(brandSeal.trim(), '管', 'Management seal must be 管');

    // Verify Learner navigation links are ABSENT from header
    const navText = await page.locator('.management-header, .site-header').first().textContent();
    console.log('Header text preview:', navText.replace(/\s+/g, ' ').slice(0, 100));
    assert.ok(!navText.includes('Trang chủ'), 'Header must NOT contain "Trang chủ"');
    assert.ok(!navText.includes('Bộ thủ'), 'Header must NOT contain "Bộ thủ"');
    assert.ok(!navText.includes('Từ vựng'), 'Header must NOT contain "Từ vựng"');
    assert.ok(!navText.includes('Ôn tập'), 'Header must NOT contain "Ôn tập"');
    assert.ok(!navText.includes('Không gian học'), 'Header must NOT contain "Không gian học"');

    // =========================================================================
    // STEP 4: Inspect Account Dropdown in Management Workspace
    // =========================================================================
    console.log('\n--- Step 4: Inspecting Account Dropdown in Management Workspace ---');
    await page.click('#navAccountDropdownTrigger');
    await page.waitForSelector('#navAccountDropdownMenu:not([hidden])');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-management-account-dropdown.png') });
    console.log('Saved screenshot: 03-management-account-dropdown.png');

    const dropdownText = await page.locator('#navAccountDropdownMenu').textContent();
    console.log('Dropdown links text:', dropdownText.replace(/\s+/g, ' '));
    assert.ok(dropdownText.includes('Hồ sơ tài khoản'), 'Must contain "Hồ sơ tài khoản"');
    assert.ok(!dropdownText.includes('Tiến độ học tập'), 'Must NOT contain "Tiến độ học tập"');
    assert.ok(!dropdownText.includes('Không gian học tập'), 'Must NOT contain "Không gian học tập"');
    assert.ok(!dropdownText.includes('Trung tâm quản lý'), 'Must NOT contain duplicate "Trung tâm quản lý" while on management.html');

    // =========================================================================
    // STEP 5: Navigate to Profile from Management Workspace
    // =========================================================================
    console.log('\n--- Step 5: Navigating to Profile from Management Workspace ---');
    await page.click('#navProfileBtn');
    await page.waitForURL('**/profile.html*');
    await page.waitForLoadState('networkidle');
    console.log('Navigated to:', page.url());

    // Verify Profile header is adapted for management
    const profileBrandSeal = await page.locator('header .brand-seal-mark, header .chinese-seal-icon').first().textContent();
    assert.strictEqual(profileBrandSeal.trim(), '管', 'Profile header for staff must display 管 seal');

    const profileNavText = await page.locator('.management-header, .site-header').first().textContent();
    assert.ok(!profileNavText.includes('Trang chủ'), 'Profile header must NOT contain "Trang chủ" for staff');
    assert.ok(!profileNavText.includes('Bộ thủ'), 'Profile header must NOT contain "Bộ thủ" for staff');
    assert.ok(!profileNavText.includes('Từ vựng'), 'Profile header must NOT contain "Từ vựng" for staff');
    assert.ok(!profileNavText.includes('Ôn tập'), 'Profile header must NOT contain "Ôn tập" for staff');

    // Verify learning settings DOM elements are EXCISED
    const srsCard = await page.$('#srs-settings-card');
    const audioCard = await page.$('#audio-settings-card');
    const writingCard = await page.$('#writing-settings-card');
    assert.strictEqual(srsCard, null, '#srs-settings-card must be completely removed for staff');
    assert.strictEqual(audioCard, null, '#audio-settings-card must be completely removed for staff');
    assert.strictEqual(writingCard, null, '#writing-settings-card must be completely removed for staff');
    console.log('Confirmed: All 3 learning settings cards excised from profile for staff');

    // Check Tab 2 label
    const tab2Text = await page.locator('#tabLearningSettings').textContent();
    console.log('Tab 2 label:', tab2Text.trim());
    assert.strictEqual(tab2Text.trim(), 'Bảo mật & Cài đặt');

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-profile-management-mode.png'), fullPage: true });
    console.log('Saved screenshot: 04-profile-management-mode.png');

    // =========================================================================
    // STEP 6: Logout
    // =========================================================================
    console.log('\n--- Step 6: Logging out ---');
    await page.click('#navLogoutBtn');
    await page.waitForLoadState('networkidle');
    console.log('Logged out cleanly. Current URL:', page.url());

    // =========================================================================
    // STEP 7: Login as Learner
    // =========================================================================
    console.log('\n--- Step 7: Logging in as Learner (learner@gmail.com) ---');
    await page.goto('http://localhost:3000/login.html', { waitUntil: 'domcontentloaded' });
    await page.fill('#loginEmail', 'learner@gmail.com');
    await page.fill('#loginPassword', 'Password@123');
    await page.click('#loginSubmitBtn');

    await page.waitForURL('**/index.html*', { timeout: 10000 });
    console.log('SUCCESS: Learner redirected to:', page.url());
    assert.ok(page.url().includes('index.html'), 'Learner MUST be redirected to index.html');

    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-learner-index-page.png'), fullPage: false });
    console.log('Saved screenshot: 05-learner-index-page.png');

    // =========================================================================
    // STEP 8: Verify Learner Profile has full SRS settings preserved
    // =========================================================================
    console.log('\n--- Step 8: Verifying Learner Profile Preserves Full Settings ---');
    await page.goto('http://localhost:3000/profile.html', { waitUntil: 'networkidle' });
    const learnerSrsCard = await page.$('#srs-settings-card');
    assert.ok(learnerSrsCard !== null, 'Learner MUST have #srs-settings-card present');
    
    const learnerHeaderSeal = await page.locator('.brand-seal-mark').first().textContent();
    assert.strictEqual(learnerHeaderSeal.trim(), '字', 'Learner header seal must be 字');

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06-profile-learner-mode.png'), fullPage: true });
    console.log('Saved screenshot: 06-profile-learner-mode.png');

    console.log('\n=============================================');
    console.log('ALL REAL BROWSER VERIFICATIONS PASSED 100%!');
    console.log('=============================================');

  } finally {
    await browser.close();
  }
}

runRealBrowserVerification().catch(err => {
  console.error('Real browser verification FAILED:', err);
  process.exit(1);
});
