import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

function createMockResponse(items) {
  return {
    code: 'SUCCESS',
    message: 'OK',
    data: {
      page: 0,
      size: 20,
      totalElements: items.length,
      totalPages: 1,
      first: true,
      last: true,
      items
    }
  };
}

function create214MockRadicals() {
  const radicals = [];
  for (let i = 1; i <= 214; i++) {
    const isCommon = i <= 50;
    radicals.push({
      radicalId: i,
      character: i === 75 ? '木' : (i === 9 ? '亻' : String.fromCodePoint(0x2F00 + i - 1)),
      pinyin: i === 75 ? 'mù' : (i === 9 ? 'rén' : `py_${i}`),
      meaningHanViet: i === 75 ? 'Mộc' : (i === 9 ? 'Nhân' : `HV_${i}`),
      meaningVi: i === 75 ? 'Cây cối, gỗ' : (i === 9 ? 'Người' : `Nghĩa ${i}`),
      explanationVi: isCommon ? `Giải thích ghi nhớ cho bộ thủ số ${i}` : null,
      commonRank: isCommon ? i : null,
      videoWritingUrl: null
    });
  }
  return radicals;
}

describe('Browser E2E: Constituent Radical Preview Cleanse & Direct Deep Link to 214 Radicals', () => {
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

  test('VR-NAV-01: Removes circled text from preview and verifies direct link to radicals.html?id=75', async () => {
    const item = {
      vocabId: 201,
      hanzi: '机',
      pinyin: 'jī',
      meaningHanViet: 'Cơ',
      meaningVi: 'Máy móc, bàn'
    };

    const detail = {
      vocabId: 201,
      hanzi: '机',
      pinyin: 'jī',
      meaningHanViet: 'Cơ',
      meaningVi: 'Máy móc, bàn',
      radicals: [
        {
          radicalId: 75,
          character: '木',
          pinyin: 'mù',
          meaningHanViet: 'Mộc',
          meaningVi: 'Cây cối, gỗ'
        }
      ]
    };

    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 800
    });

    try {
      await page.route('**/api/v1/vocabulary**', async (route) => {
        const url = route.request().url();
        if (url.includes('/api/v1/vocabulary/201')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 'SUCCESS', data: detail })
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockResponse([item]))
        });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      // Click card for "机" to open vocabulary detail modal
      await page.locator('.vocab-card').first().click();

      // Wait for constituent radical badge "(木 · Bộ Mộc)"
      await page.waitForSelector('.vocab-radical-badge');
      const radicalBadge = page.locator('.vocab-radical-badge').first();
      const badgeText = await radicalBadge.innerText();
      assert.ok(badgeText.includes('木') && badgeText.includes('Bộ Mộc'), `Badge text should be (木 · Bộ Mộc), got: ${badgeText}`);

      // Click badge to expand radical preview box
      await radicalBadge.click();

      const preview = page.locator('#modalRadicalPreview');
      await preview.waitFor({ state: 'visible' });

      // 1. VERIFY: The circled text "• Bộ #75 (Mộc) • Cho chữ "机"" is completely removed!
      const previewText = await preview.innerText();
      assert.strictEqual(previewText.includes('• Bộ #75'), false, 'Preview must NOT contain "• Bộ #75"');
      assert.strictEqual(previewText.includes('Cho chữ'), false, 'Preview must NOT contain "Cho chữ"');
      assert.strictEqual(previewText.includes('机'), false, 'Preview must NOT contain target word glyph "机"');

      // VERIFY: Close button (X) is completely removed from preview card
      const closeButtons = preview.locator('.btn-close');
      assert.strictEqual(await closeButtons.count(), 0, 'Preview must NOT contain any close button (X)');

      // VERIFY: "Nghĩa:" prefix is removed
      assert.strictEqual(previewText.includes('Nghĩa:'), false, 'Preview must NOT contain "Nghĩa:" prefix');

      // Verify character and pinyin remain cleanly present
      assert.strictEqual(await preview.locator('.font-hanzi').innerText(), '木');
      assert.ok(previewText.includes('mù'), 'Preview must retain pinyin mù');
      assert.ok(previewText.includes('Cây cối, gỗ'), 'Preview must retain Vietnamese meaning');

      // 2. VERIFY: The button "[Xem trong 214 Bộ Thủ ↗]" links directly to radicals.html?id=75
      const catalogLink = preview.locator('a:has-text("Xem trong 214 Bộ Thủ")');
      assert.ok(await catalogLink.isVisible(), 'Link [Xem trong 214 Bộ Thủ ↗] must be visible');
      const href = await catalogLink.getAttribute('href');
      assert.strictEqual(href, 'radicals.html?id=75', `Link href must be radicals.html?id=75, got: ${href}`);

      // VERIFY: Link must navigate in the SAME tab (target="_blank" removed)
      const targetAttr = await catalogLink.getAttribute('target');
      assert.ok(!targetAttr || targetAttr === '_self', 'Link must NOT open in a new tab (target="_blank" removed)');

      const errors = getRuntimeErrors().filter(e => !e.includes('favicon'));
      assert.strictEqual(errors.length, 0, 'Zero runtime errors during vocabulary preview');
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('VR-NAV-02: Clicking link / navigating to radicals.html?id=75 points directly to Radical 75', async () => {
    const mockRadicals = create214MockRadicals();
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 800
    });

    try {
      await page.route('**/api/v1/radicals*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: { page: 0, size: 214, totalElements: 214, totalPages: 1, items: mockRadicals }
          })
        });
      });

      // Navigate to radicals.html?id=75
      await page.goto(`${baseUrl}/radicals.html?id=75`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      // 1. Tab "214 Bộ Thủ Đầy Đủ" is active
      const tabAll = page.locator('#tabAllRadicals');
      assert.strictEqual(await tabAll.getAttribute('aria-selected'), 'true', 'Tab 214 must be active');
      assert.strictEqual(await tabAll.evaluate(el => el.classList.contains('active')), true);

      // 2. Card for Radical 75 is targeted
      const targetCard = page.locator('button[data-radical-id="75"]');
      await targetCard.waitFor({ state: 'visible', timeout: 5000 });
      assert.strictEqual(await targetCard.evaluate(el => el.classList.contains('radical-card-targeted')), true);

      // 3. Detail modal automatically opens pointing to Radical 75 (Bộ Mộc)
      const modal = page.locator('#radicalDetailModal');
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      const modalChar = await page.textContent('#modalRadicalChar');
      assert.strictEqual(modalChar.trim(), '木', 'Modal glyph must be 木');
      const modalTitle = await page.textContent('#modalRadicalTitle');
      assert.ok(modalTitle.includes('Mộc'), `Modal title should be Bộ Mộc (木), got: ${modalTitle}`);

      // 4. Close modal and verify focus restores directly to Radical 75 card
      await page.click('#modalCloseBtn');
      await modal.waitFor({ state: 'hidden', timeout: 5000 });
      const focusedRadicalId = await page.evaluate(() => document.activeElement?.getAttribute('data-radical-id'));
      assert.strictEqual(focusedRadicalId, '75', 'Focus must restore to card 75');

      const errors = getRuntimeErrors().filter(e => !e.includes('favicon'));
      assert.strictEqual(errors.length, 0, 'Zero runtime errors during deep-link navigation');
    } finally {
      await page.close();
      await context.close();
    }
  });
});
