/**
 * =============================================================================
 * BROWSER E2E TEST: MOBILE PHONE KEYBOARD & VIRTUAL IME (PIXEL 7 & IPHONE 14)
 * File: tests/frontend/e2e/mobile-keyboard.browser.mjs
 *
 * Emulates authentic physical smartphone environments:
 * - Google Pixel 7 (Android 14 Mobile Chrome, 412x839, DPR 2.625, Touch enabled)
 * - Apple iPhone 14 (iOS 16 Mobile Safari, 390x664, DPR 3.0, Touch enabled)
 * - Compact Android (360x640, DPR 2.0, Touch enabled)
 *
 * Verifies:
 * - MK-01: Pixel 7 Touch & Target Size Audit (WCAG 2.2 SC 2.5.8 Target Size >= 40px)
 * - MK-02: Android Gboard Chinese IME Simulation (Full Composition Lifecycle)
 * - MK-03: Android Default Latin Keyboard Fallback (Pinyin -> Touch Candidate -> Commit)
 * - MK-04: iPhone 14 Mobile Safari Compound Word Lookup & Typing (chuzuche -> 出租车)
 * - MK-05: Mobile Screen Ergonomics: Virtual Keyboard Toggle (Freeing up Viewport)
 * - MK-06: Compact Mobile Viewport Reflow & Zero Horizontal Overflow (360px)
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser } from '../utils/browser-runner.mjs';
import { devices } from 'playwright-core';

function createMockRadicals() {
  return [
    {
      radicalId: 1,
      character: '一',
      pinyin: 'yī',
      meaningHanViet: 'Nhất',
      meaningVi: 'Số một',
      strokeCount: 1,
      commonRank: 1,
      audioUrl: null
    },
    {
      radicalId: 2,
      character: '丨',
      pinyin: 'gǔn',
      meaningHanViet: 'Cổn',
      meaningVi: 'Nét sổ',
      strokeCount: 1,
      commonRank: 2,
      audioUrl: null
    }
  ];
}

async function setupMockBackend(page, capturedReviews = []) {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'test_mobile_learner_jwt');
    localStorage.setItem('user_info', JSON.stringify({
      accountId: 3001,
      emailOrPhone: 'mobile_learner@example.com',
      fullName: 'Học Viên Di Động',
      roles: ['Learner']
    }));
  });

  await page.route('**/api/v1/radicals*', async (route) => {
    const url = route.request().url();
    const match = url.match(/\/api\/v1\/radicals\/(\d+)/);
    if (match) {
      const id = parseInt(match[1], 10);
      const found = createMockRadicals().find(r => r.radicalId === id) || createMockRadicals()[0];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: found })
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        message: 'OK',
        data: {
          items: createMockRadicals(),
          page: 0,
          size: 50,
          totalElements: 2,
          totalPages: 1
        }
      })
    });
  });

  await page.route('**/api/v1/srs/review*', async (route) => {
    const postData = route.request().postDataJSON();
    capturedReviews.push(postData);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: {} })
    });
  });

  await page.route('**/api/v1/srs/due*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: [] })
    });
  });

  await page.route('**/api/v1/**/notes*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: { items: [], totalElements: 0 } })
    });
  });
}

describe('Browser E2E: Mobile Phone Keyboard & Chinese IME Emulation', () => {
  let serverHandle;
  let browser;
  let baseUrl;

  before(async () => {
    serverHandle = await ensureServer({ port: 3000 });
    baseUrl = serverHandle.baseUrl;
    browser = await launchBrowser();
  });

  after(async () => {
    if (browser) await browser.close();
    if (serverHandle) await serverHandle.close();
  });

  test('MK-01: Pixel 7 (Android 14) mobile touch & target size audit (WCAG 2.2 >= 40px, no overflow)', async () => {
    const context = await browser.newContext({
      ...devices['Pixel 7'],
      locale: 'zh-CN'
    });
    const page = await context.newPage();
    await setupMockBackend(page);

    await page.goto(`${baseUrl}/srs-review.html?mode=listening&group=radicals50&action=continue`, {
      waitUntil: 'domcontentloaded'
    });

    await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });
    await page.locator('#srsListeningRoom').waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('#listeningAnswerInput').waitFor({ state: 'visible', timeout: 5000 });

    // 1. Verify mobile input attributes
    const inputAttrs = await page.$eval('#listeningAnswerInput', el => ({
      inputmode: el.getAttribute('inputmode'),
      lang: el.getAttribute('lang'),
      disabled: el.disabled
    }));
    assert.strictEqual(inputAttrs.inputmode, 'text', 'Mobile input must specify inputmode="text"');
    assert.strictEqual(inputAttrs.lang, 'zh-Hans', 'Mobile input must specify lang="zh-Hans"');
    assert.strictEqual(inputAttrs.disabled, false, 'Input must not be disabled');

    // 2. Verify touch target size on virtual keys >= 40px (WCAG 2.2 SC 2.5.8)
    const keyMetrics = await page.$$eval('.pinyin-key', keys => {
      return keys.slice(0, 10).map(k => {
        const rect = k.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });
    });
    assert.ok(keyMetrics.length > 0, 'Virtual keyboard keys must be rendered');
    for (const m of keyMetrics) {
      assert.ok(m.height >= 40, `Virtual key height (${m.height}px) must be >= 40px for mobile touch targets`);
    }

    // 3. Verify zero horizontal overflow on Pixel 7 viewport (412px)
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
    });
    assert.strictEqual(overflow, true, 'Page must not have horizontal scrollbar on Pixel 7 (412px)');

    await context.close();
  });

  test('MK-02: Android Gboard Chinese IME simulation (Full Composition Lifecycle)', async () => {
    const context = await browser.newContext({
      ...devices['Pixel 7'],
      locale: 'zh-CN'
    });
    const page = await context.newPage();
    const reviews = [];
    await setupMockBackend(page, reviews);

    await page.goto(`${baseUrl}/srs-review.html?mode=listening&group=radicals50&action=continue`, {
      waitUntil: 'domcontentloaded'
    });

    await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });
    await page.locator('#listeningAnswerInput').waitFor({ state: 'visible', timeout: 5000 });

    // Focus input field via touch tap
    await page.tap('#listeningAnswerInput');

    // Simulate Android Gboard Chinese IME composition events:
    // 1. compositionstart
    // 2. compositionupdate (data: 'yi')
    // 3. compositionend (data: '一')
    // 4. input (inputType: 'insertCompositionText', data: '一')
    await page.evaluate(() => {
      const input = document.getElementById('listeningAnswerInput');
      input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      input.dispatchEvent(new CompositionEvent('compositionupdate', { bubbles: true, data: 'yi' }));
      input.value = '一';
      input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '一' }));
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText', data: '一' }));
    });

    const inputValue = await page.$eval('#listeningAnswerInput', el => el.value);
    assert.strictEqual(inputValue, '一', 'Input must contain Chinese character 一');

    // Tap "Kiểm tra" button via mobile touch
    await page.tap('#btnListeningCheck');

    // Verify submission succeeds
    await page.waitForSelector('#listeningAnswerInput.is-valid', { timeout: 5000 });
    const completionNotice = await page.$eval('#listeningCompletionNotice', el => el.classList.contains('d-none'));
    assert.strictEqual(completionNotice, false, 'Completion notice must be revealed');

    const nextDisabled = await page.$eval('#btnListeningNext', el => el.disabled);
    assert.strictEqual(nextDisabled, false, 'Next button must be unlocked');

    await context.close();
  });

  test('MK-03: Android Default Latin Keyboard Fallback (Pinyin -> Touch Candidate -> Commit)', async () => {
    const context = await browser.newContext({
      ...devices['Pixel 7']
    });
    const page = await context.newPage();
    const reviews = [];
    await setupMockBackend(page, reviews);

    await page.goto(`${baseUrl}/srs-review.html?mode=listening&group=radicals50&action=continue`, {
      waitUntil: 'domcontentloaded'
    });

    await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });
    await page.locator('#listeningAnswerInput').waitFor({ state: 'visible', timeout: 5000 });

    // Learner taps input and types Latin pinyin 'yi' on standard English/Vietnamese mobile keyboard
    await page.tap('#listeningAnswerInput');
    await page.evaluate(() => {
      const input = document.getElementById('listeningAnswerInput');
      input.value = 'yi';
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'yi' }));
    });

    // Wait for candidate strip to render candidates
    await page.waitForSelector('.pinyin-candidate-item', { timeout: 3000 });

    // Check first candidate is 一
    const firstCandidateText = await page.$eval('.pinyin-candidate-item', el => el.textContent.trim());
    assert.ok(firstCandidateText.includes('一'), 'First candidate must contain 一');

    // Learner taps the first candidate with touch
    await page.tap('.pinyin-candidate-item');

    // Verify input value was cleanly replaced with Chinese character (zero Latin leftover)
    const committedValue = await page.$eval('#listeningAnswerInput', el => el.value);
    assert.strictEqual(committedValue, '一', 'Latin pinyin "yi" must be cleanly replaced by "一"');

    // Tap "Kiểm tra" button
    await page.tap('#btnListeningCheck');
    await page.waitForSelector('#listeningAnswerInput.is-valid', { timeout: 5000 });

    await context.close();
  });

  test('MK-04: iPhone 14 (iOS 16 Mobile Safari) Compound Word Lookup & Typing (chuzuche -> 出租车)', async () => {
    const context = await browser.newContext({
      ...devices['iPhone 14'],
      locale: 'zh-CN'
    });
    const page = await context.newPage();
    const reviews = [];
    await setupMockBackend(page, reviews);

    await page.goto(`${baseUrl}/srs-review.html?mode=listening&group=radicals50&action=continue`, {
      waitUntil: 'domcontentloaded'
    });

    await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });
    await page.locator('#listeningAnswerInput').waitFor({ state: 'visible', timeout: 5000 });

    // User types compound pinyin "chuzuche" on iOS Safari
    await page.tap('#listeningAnswerInput');
    await page.evaluate(() => {
      const input = document.getElementById('listeningAnswerInput');
      input.value = 'chuzuche';
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'chuzuche' }));
    });

    // Verify candidate bar displays "出租车"
    await page.waitForSelector('.pinyin-candidate-item', { timeout: 3000 });
    const candidatesText = await page.$$eval('.pinyin-candidate-item', els => els.map(e => e.textContent.trim()));
    const hasTaxi = candidatesText.some(t => t.includes('出租车'));
    assert.strictEqual(hasTaxi, true, 'Candidates must include compound word "出租车"');

    // Find and tap the 出租车 candidate button
    const taxiCandidateSelector = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.pinyin-candidate-item'));
      const idx = items.findIndex(el => el.textContent.includes('出租车'));
      return idx !== -1 ? `#pinyinCandidate-${idx}` : null;
    });
    assert.ok(taxiCandidateSelector, 'Taxi candidate button selector must exist');
    await page.tap(taxiCandidateSelector);

    // Verify input contains 出租车
    const finalValue = await page.$eval('#listeningAnswerInput', el => el.value);
    assert.strictEqual(finalValue, '出租车', 'Input must be "出租车"');

    await context.close();
  });

  test('MK-05: Mobile Screen Ergonomics: Virtual Keyboard Toggle (Freeing up Viewport)', async () => {
    const context = await browser.newContext({
      ...devices['Pixel 7']
    });
    const page = await context.newPage();
    await setupMockBackend(page);

    await page.goto(`${baseUrl}/srs-review.html?mode=listening&group=radicals50&action=continue`, {
      waitUntil: 'domcontentloaded'
    });

    await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });
    await page.locator('.pinyin-virtual-keyboard').waitFor({ state: 'visible', timeout: 5000 });

    // Initially, virtual keyboard is visible
    const initialVisibility = await page.$eval('.pinyin-virtual-keyboard', el => !el.classList.contains('d-none'));
    assert.strictEqual(initialVisibility, true, 'Virtual keyboard must be visible initially');

    // Learner taps "Ẩn bàn phím" toggle button on mobile
    await page.tap('.btn-toggle-pinyin-keyboard');

    // Verify keyboard keys are hidden to free up mobile screen space
    const isHidden = await page.$eval('.pinyin-virtual-keyboard', el => el.classList.contains('d-none'));
    assert.strictEqual(isHidden, true, 'Virtual keyboard must be hidden after toggle');

    // Candidate bar MUST remain visible so user can type on mobile OS keyboard and pick candidates
    const candidatesBarVisible = await page.$eval('.pinyin-candidates-bar', el => !el.classList.contains('d-none'));
    assert.strictEqual(candidatesBarVisible, true, 'Candidate bar must remain visible when virtual keys are hidden');

    // User types pinyin "yi" while keys are hidden
    await page.evaluate(() => {
      const input = document.getElementById('listeningAnswerInput');
      input.value = 'yi';
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'yi' }));
    });

    // Candidate button appears in candidate bar
    await page.waitForSelector('.pinyin-candidate-item', { timeout: 3000 });
    await page.tap('.pinyin-candidate-item');

    const committed = await page.$eval('#listeningAnswerInput', el => el.value);
    assert.strictEqual(committed, '一', 'Can still pick candidates with virtual keyboard hidden');

    // Learner taps toggle button again to restore keyboard
    await page.tap('.btn-toggle-pinyin-keyboard');
    const isRestored = await page.$eval('.pinyin-virtual-keyboard', el => !el.classList.contains('d-none'));
    assert.strictEqual(isRestored, true, 'Virtual keyboard must be restored after second toggle');

    await context.close();
  });

  test('MK-06: Compact Mobile Viewport Reflow & Zero Horizontal Overflow (360px)', async () => {
    const context = await browser.newContext({
      viewport: { width: 360, height: 640 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    const page = await context.newPage();
    await setupMockBackend(page);

    await page.goto(`${baseUrl}/srs-review.html?mode=listening&group=radicals50&action=continue`, {
      waitUntil: 'domcontentloaded'
    });

    await page.locator('#srsActiveSession').waitFor({ state: 'visible', timeout: 8000 });
    await page.locator('#srsListeningRoom').waitFor({ state: 'visible', timeout: 5000 });

    // Check horizontal overflow on 360px screen
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth
    }));

    assert.ok(metrics.scrollWidth <= metrics.clientWidth, `Document scrollWidth (${metrics.scrollWidth}px) must be <= clientWidth (${metrics.clientWidth}px)`);
    assert.ok(metrics.bodyScrollWidth <= metrics.bodyClientWidth, `Body scrollWidth (${metrics.bodyScrollWidth}px) must be <= clientWidth (${metrics.bodyClientWidth}px)`);

    await context.close();
  });
});
