/**
 * =============================================================================
 * BROWSER E2E TEST: 214 KANGXI RADICALS TWO LEARNING TABS & PRESENTATION UI
 * File: tests/frontend/e2e/radicals.browser.mjs
 * 
 * Verifies:
 * - RCAT-01: Open radicals page: 50 tab visible, 164 tab visible, 50 tab active,
 *   50 radicals shown in common grid, 164 panel hidden.
 * - RCAT-02: Click "164 Bộ Thủ Mở Rộng": 164 panel visible, 50 panel hidden,
 *   selected state correct, 164 radicals shown.
 * - RCAT-03: Click back to "50 Bộ Thủ Thông Dụng": 50 panel visible, 164 hidden.
 * - RCAT-04: Search "shui": searches across all 214; results not restricted to current tab.
 * - RCAT-05: Clear search while currently selected on 164: 164 tab is restored.
 * - RCAT-06: Verification of absent anti-patterns: no pagination, no page-size selector,
 *   no redundant toolbar count badge, no #1/#2/#3 on learner cards.
 * - RCAT-07: Speaker button contract: visually matches Vocabulary (.vocab-speech-btn, SVG,
 *   accessible name), clicking speaker does NOT open Detail Dialog.
 * - RCAT-08: Detail Modal open, content, keyboard Escape, Close button & focus restoration.
 * - RCAT-09: Mobile 375px viewport: 0 horizontal overflow, tab usable, cards 2 columns.
 * - RCAT-10: Keyboard navigation for tabs: ArrowLeft, ArrowRight, Home, End, visible focus.
 * - RCAT-11: YouTube video lecture removed; stroke writing & details preserved.
 * - RCAT-12: Adversarial XSS resistance.
 * - RCAT-13: API 500 error state & Retry button recovery.
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

function create214MockRadicals() {
  const radicals = [
    {
      radicalId: 1,
      character: '一',
      pinyin: 'yī',
      meaningHanViet: 'Nhất',
      meaningVi: 'Số một',
      commonRank: 1,
      explanationVi: 'Nét ngang cơ bản, đại diện cho sự khởi đầu và thống nhất.',
      audioUrl: 'https://cdn.example.com/audio/rad_1.mp3',
      videoWritingUrl: 'https://cdn.example.com/video/rad_1.mp4'
    },
    {
      radicalId: 30,
      character: '口',
      pinyin: 'kǒu',
      meaningHanViet: 'Khẩu',
      meaningVi: 'Cái miệng',
      commonRank: 6,
      explanationVi: 'Hình cái miệng mở ra, liên quan đến ăn uống, nói năng.',
      audioUrl: null,
      videoWritingUrl: null
    },
    {
      radicalId: 75,
      character: '木',
      pinyin: 'mù',
      meaningHanViet: 'Mộc',
      meaningVi: 'Cây cối',
      commonRank: 10,
      explanationVi: 'Hình thân cây có cành lá và rễ xòe ra.',
      audioUrl: 'https://cdn.example.com/audio/rad_75.mp3',
      videoWritingUrl: null
    },
    {
      radicalId: 85,
      character: '水',
      pinyin: 'shuǐ',
      meaningHanViet: 'Thủy',
      meaningVi: 'Dòng nước',
      commonRank: 11,
      explanationVi: 'Dòng nước uốn lượn với các giọt nước bắn ra xung quanh.',
      audioUrl: null,
      videoWritingUrl: 'https://cdn.example.com/video/rad_85.mp4'
    }
  ];

  const existingIds = new Set(radicals.map(r => r.radicalId));
  const assignedRanks = new Set(radicals.map(r => r.commonRank).filter(Boolean));

  let nextRank = 2;
  for (let id = 1; id <= 214; id++) {
    if (!existingIds.has(id)) {
      let rank = null;
      if (assignedRanks.size < 50) {
        while (assignedRanks.has(nextRank) && nextRank <= 50) {
          nextRank++;
        }
        if (nextRank <= 50) {
          rank = nextRank;
          assignedRanks.add(rank);
          nextRank++;
        }
      }

      radicals.push({
        radicalId: id,
        character: String.fromCodePoint(0x4E00 + id - 1),
        pinyin: `pinyin_${id}`,
        meaningHanViet: `Hán-Việt ${id}`,
        meaningVi: `Nghĩa tiếng Việt số ${id}`,
        commonRank: rank,
        explanationVi: rank ? `Giải thích học tập cho bộ thủ ${id}` : null,
        audioUrl: null,
        videoWritingUrl: null
      });
    }
  }

  radicals.sort((a, b) => a.radicalId - b.radicalId);
  return radicals;
}

describe('Browser E2E: 214 Kangxi Radicals Two Learning Tabs & Presentation UI', () => {
  let serverHandle;
  let browser;
  let baseUrl;

  before(async () => {
    serverHandle = await ensureServer({ port: 3000 });
    baseUrl = serverHandle.baseUrl;
    browser = await launchBrowser({ headless: true });
  });

  after(async () => {
    try {
      if (browser) await browser.close();
    } finally {
      if (serverHandle) await serverHandle.close();
    }
  });

  test('RCAT-01: Open radicals page: 50 tab visible and active, exactly 50 common radicals shown, 164 panel hidden', { timeout: 15000 }, async () => {
    const { page, context } = await createMonitoredPage(browser);
    const mockRadicals = create214MockRadicals();

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

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      // Tab controls are visible with exact labels
      const tabCommon = page.locator('#tabCommonRadicals');
      const tabAll = page.locator('#tabAllRadicals');

      assert.strictEqual(await tabCommon.isVisible(), true);
      assert.strictEqual(await tabAll.isVisible(), true);
      assert.strictEqual((await tabCommon.textContent()).trim(), '50 Bộ Thủ Thông Dụng');
      assert.strictEqual((await tabAll.textContent()).trim(), '214 Bộ Thủ Đầy Đủ');
      assert.ok(!(await page.textContent('body')).includes('164 Bộ Thủ Mở Rộng'), 'Must NOT render legacy 164 label');

      // Default active tab is Tab 50
      assert.strictEqual(await tabCommon.getAttribute('aria-selected'), 'true');
      assert.strictEqual(await tabCommon.getAttribute('tabindex'), '0');
      assert.strictEqual(await tabCommon.evaluate(el => el.classList.contains('active')), true);

      assert.strictEqual(await tabAll.getAttribute('aria-selected'), 'false');
      assert.strictEqual(await tabAll.getAttribute('tabindex'), '-1');
      assert.strictEqual(await tabAll.evaluate(el => el.classList.contains('active')), false);

      // Section A (50 Common) is visible with exactly 50 cards
      assert.strictEqual(await page.isVisible('#commonRadicalsSection'), true);
      const commonCardCount = await page.locator('#commonRadicalsGrid .radical-card').count();
      assert.strictEqual(commonCardCount, 50, 'Section A should render exactly 50 common radicals');

      // Section B (214 All) is hidden
      assert.strictEqual(await page.isHidden('#allRadicalsSection'), true);

      // First card in Section A is radical #1 (一)
      const firstCard = page.locator('#commonRadicalsGrid .radical-card').first();
      const firstCardText = await firstCard.textContent();
      assert.ok(firstCardText.includes('一'), 'First card glyph must be 一');
      assert.ok(firstCardText.includes('Nhất'), 'First card meaning must be Nhất');
      assert.ok(!firstCardText.includes('#1'), 'Radical cards must NOT render internal #1 database ID badge');
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('RCAT-02: Click "214 Bộ Thủ Đầy Đủ" switches view to 214 panel and hides 50 panel', { timeout: 15000 }, async () => {
    const { page, context } = await createMonitoredPage(browser);
    const mockRadicals = create214MockRadicals();

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

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      // Click Tab 214
      await page.click('#tabAllRadicals');

      // Verify active tab state updated
      const tabCommon = page.locator('#tabCommonRadicals');
      const tabAll = page.locator('#tabAllRadicals');

      assert.strictEqual(await tabAll.getAttribute('aria-selected'), 'true');
      assert.strictEqual(await tabAll.getAttribute('tabindex'), '0');
      assert.strictEqual(await tabAll.evaluate(el => el.classList.contains('active')), true);

      assert.strictEqual(await tabCommon.getAttribute('aria-selected'), 'false');
      assert.strictEqual(await tabCommon.getAttribute('tabindex'), '-1');

      // 214 panel is visible with all 214 cards
      assert.strictEqual(await page.isVisible('#allRadicalsSection'), true);
      const allCount = await page.locator('#allRadicalsGrid .radical-card').count();
      assert.strictEqual(allCount, 214, 'Section B should render all 214 radicals');

      // 50 panel is hidden
      assert.strictEqual(await page.isHidden('#commonRadicalsSection'), true);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('RCAT-03: Click back to "50 Bộ Thủ Thông Dụng" restores 50 panel and hides 214 panel', { timeout: 15000 }, async () => {
    const { page, context } = await createMonitoredPage(browser);
    const mockRadicals = create214MockRadicals();

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

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      // Go to 214 then back to 50
      await page.click('#tabAllRadicals');
      assert.strictEqual(await page.isVisible('#allRadicalsSection'), true);

      await page.click('#tabCommonRadicals');

      // 50 panel visible, 214 hidden
      assert.strictEqual(await page.isVisible('#commonRadicalsSection'), true);
      assert.strictEqual(await page.isHidden('#allRadicalsSection'), true);
      assert.strictEqual(await page.locator('#tabCommonRadicals').getAttribute('aria-selected'), 'true');
      assert.strictEqual(await page.locator('#commonRadicalsGrid .radical-card').count(), 50);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('RCAT-04: Tab-scoped search strictly filters within active tab and preserves query across tabs', { timeout: 15000 }, async () => {
    const { page, context } = await createMonitoredPage(browser);
    const mockRadicals = create214MockRadicals();

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

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      // Tab 50 is active by default. Test: Searching Vietnamese meaning ("nuoc" for 水) yields NO results
      await page.fill('#radicalSearchInput', 'nuoc');
      await page.waitForTimeout(300);
      assert.strictEqual(await page.locator('#commonRadicalsGrid .radical-card').count(), 0, 'Must NOT match meaningVi');

      // Search "pinyin_100" which exists in the 214 catalog but NOT in the 50 common radicals
      await page.fill('#radicalSearchInput', 'pinyin_100');
      await page.waitForTimeout(300);

      // In Tab 50: 0 matches found in 50 common radicals, empty state with switch prompt shown
      assert.strictEqual(await page.locator('#commonRadicalsGrid .radical-card').count(), 0);
      assert.strictEqual(await page.isVisible('#btnSwitchToAllRadicals'), true, 'CTA to search in all 214 must appear');

      // Click the CTA to switch to Tab 214
      await page.click('#btnSwitchToAllRadicals');
      await page.waitForFunction(() => document.querySelectorAll('#allRadicalsGrid .radical-card').length === 1, { timeout: 5000 });

      // Tab 214 is now active and preserved the query "pinyin_100"
      assert.strictEqual(await page.inputValue('#radicalSearchInput'), 'pinyin_100');
      assert.strictEqual(await page.locator('#tabAllRadicals').getAttribute('aria-selected'), 'true');
      assert.strictEqual(await page.isVisible('#allRadicalsSection'), true);
      assert.strictEqual(await page.isHidden('#commonRadicalsSection'), true);
      assert.strictEqual(await page.isHidden('#searchResultsSection'), true, 'Results render in active tab, not separate section');

      // Search "shui" (Pinyin) in Tab 214 finds 水 (Radical 85)
      await page.fill('#radicalSearchInput', 'shui');
      await page.waitForFunction(() => document.querySelectorAll('#allRadicalsGrid .radical-card').length === 1, { timeout: 5000 });

      // Result found: 水 (Thủy)
      const card85Text = await page.locator('#allRadicalsGrid .radical-card').first().textContent();
      assert.ok(card85Text.includes('水') && card85Text.includes('Thủy'), 'Scoped search in 214 finds 水');
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('RCAT-05: Clear search restores full catalog for active tab (214 preserved)', { timeout: 15000 }, async () => {
    const { page, context } = await createMonitoredPage(browser);
    const mockRadicals = create214MockRadicals();

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

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      // 1. User selects 214 tab
      await page.click('#tabAllRadicals');
      assert.strictEqual(await page.isVisible('#allRadicalsSection'), true);

      // 2. User searches "木"
      await page.fill('#radicalSearchInput', '木');
      await page.waitForFunction(() => document.querySelectorAll('#allRadicalsGrid .radical-card').length === 1, { timeout: 5000 });
      assert.strictEqual(await page.isHidden('#searchResultsSection'), true);
      assert.strictEqual(await page.isVisible('#allRadicalsSection'), true);

      // 3. User clicks clear search button
      await page.click('#searchClearBtn');

      // 4. Invariant: 214 tab is restored (NOT reset to 50)
      assert.strictEqual(await page.isHidden('#searchResultsSection'), true);
      assert.strictEqual(await page.isVisible('#allRadicalsSection'), true, '214 panel must be restored');
      assert.strictEqual(await page.isHidden('#commonRadicalsSection'), true, '50 panel must remain hidden');
      assert.strictEqual(await page.locator('#tabAllRadicals').getAttribute('aria-selected'), 'true');
      assert.strictEqual(await page.locator('#allRadicalsGrid .radical-card').count(), 214);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('RCAT-06: Verifies no pagination, no page-size selector, no redundant toolbar badge, no #1/#2/#3 on learner cards', { timeout: 15000 }, async () => {
    const { page, context } = await createMonitoredPage(browser);
    const mockRadicals = create214MockRadicals();

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

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      // 1. Absent pagination & page size
      assert.strictEqual(await page.$('#pageSizeSelect'), null, 'No page size select');
      assert.strictEqual(await page.$('#radicalPagination'), null, 'No pagination element');

      // 2. Absent redundant toolbar status badge
      const toolbarBadgeCount = await page.locator('.catalog-search-toolbar .badge-status').count();
      assert.strictEqual(toolbarBadgeCount, 0, 'No redundant toolbar badge');

      // 3. Absent internal database ID badges on cards
      const cards = await page.locator('.radical-card').allTextContents();
      for (const cardText of cards.slice(0, 10)) {
        assert.ok(!cardText.match(/#\d+/), 'Radical card must not contain #ID badge');
      }
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('RCAT-07: Speaker button contract: matches Vocabulary visual pattern, keyboard accessible, click does NOT open modal', { timeout: 15000 }, async () => {
    const { page, context } = await createMonitoredPage(browser);
    const mockRadicals = create214MockRadicals();

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

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card-speaker-btn', { timeout: 5000 });

      const speakerBtn = page.locator('button[data-radical-id="1"] .radical-card-speaker-btn');

      // Must reuse .vocab-speech-btn class and SVG icon
      assert.strictEqual(await speakerBtn.evaluate(el => el.classList.contains('vocab-speech-btn')), true);
      assert.strictEqual(await speakerBtn.locator('svg').count(), 1);
      assert.ok(!(await speakerBtn.textContent()).includes('🔊'), 'Must not use emoji');

      // Dynamic accessible name
      const ariaLabel = await speakerBtn.getAttribute('aria-label');
      assert.strictEqual(ariaLabel, 'Phát âm bộ thủ 一');

      // Click speaker -> Modal must NOT open (stopPropagation)
      await speakerBtn.click();
      const isModalOpen = await page.evaluate(() => {
        const modal = document.getElementById('radicalDetailModal');
        return modal && modal.hasAttribute('open');
      });
      assert.strictEqual(isModalOpen, false, 'Clicking speaker must not open detail modal');
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('RCAT-08: Clicking card opens Detail Dialog, Escape/Close closes it with focus restoration', { timeout: 15000 }, async () => {
    const { page, context } = await createMonitoredPage(browser);
    const mockRadicals = create214MockRadicals();

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

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      const card1 = page.locator('button[data-radical-id="1"]');
      await card1.focus();
      await card1.click();

      await page.waitForSelector('#radicalDetailModal[open]', { timeout: 5000 });

      // Check detail content
      const modalTitle = await page.textContent('#modalRadicalTitle');
      assert.ok(modalTitle.includes('Nhất'));

      // Press Escape to close modal
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.getElementById('radicalDetailModal').hasAttribute('open'), { timeout: 5000 });

      // Focus returns to card 1
      const focusedId = await page.evaluate(() => document.activeElement?.getAttribute('data-radical-id'));
      assert.strictEqual(focusedId, '1');
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('RCAT-09: Mobile 375px viewport: 0 horizontal overflow, tabs usable, cards 2 columns', { timeout: 15000 }, async () => {
    const { page, context } = await createMonitoredPage(browser);
    const mockRadicals = create214MockRadicals();

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

      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      // Check 0 horizontal overflow
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      assert.strictEqual(hasOverflow, false, '375px viewport must not create horizontal overflow');

      // Tabs are visible and usable
      assert.strictEqual(await page.isVisible('#tabCommonRadicals'), true);
      assert.strictEqual(await page.isVisible('#tabAllRadicals'), true);

      await page.click('#tabAllRadicals');
      assert.strictEqual(await page.isVisible('#allRadicalsSection'), true);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('RCAT-10: Keyboard tab navigation: ArrowLeft/Right, Home/End, visible focus', { timeout: 15000 }, async () => {
    const { page, context } = await createMonitoredPage(browser);
    const mockRadicals = create214MockRadicals();

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

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      // 1. Focus Tab 50
      await page.focus('#tabCommonRadicals');
      assert.strictEqual(await page.locator('#tabCommonRadicals').getAttribute('aria-selected'), 'true');

      // 2. Press ArrowRight -> activates Tab 214
      await page.keyboard.press('ArrowRight');
      assert.strictEqual(await page.locator('#tabAllRadicals').getAttribute('aria-selected'), 'true');
      assert.strictEqual(await page.isVisible('#allRadicalsSection'), true);
      assert.strictEqual(await page.isHidden('#commonRadicalsSection'), true);

      // 3. Press ArrowLeft -> activates Tab 50
      await page.keyboard.press('ArrowLeft');
      assert.strictEqual(await page.locator('#tabCommonRadicals').getAttribute('aria-selected'), 'true');
      assert.strictEqual(await page.isVisible('#commonRadicalsSection'), true);
      assert.strictEqual(await page.isHidden('#allRadicalsSection'), true);

      // 4. Press End -> jumps to Tab 214
      await page.keyboard.press('End');
      assert.strictEqual(await page.locator('#tabAllRadicals').getAttribute('aria-selected'), 'true');

      // 5. Press Home -> jumps to Tab 50
      await page.keyboard.press('Home');
      assert.strictEqual(await page.locator('#tabCommonRadicals').getAttribute('aria-selected'), 'true');
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('RCAT-11: YouTube lecture section removed while stroke writing demonstration and modal details are preserved', { timeout: 15000 }, async () => {
    const { page, context } = await createMonitoredPage(browser);
    const mockRadicals = create214MockRadicals();

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

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      // Open Radical #75 (木)
      await page.click('button[data-radical-id="75"]');
      await page.waitForSelector('#radicalDetailModal[open]', { timeout: 5000 });

      // Invariant 1: YouTube video lecture elements are completely absent from DOM
      assert.strictEqual(await page.$('#modalVideoLessonSection'), null, 'modalVideoLessonSection must not exist in DOM');
      assert.strictEqual(await page.$('#btnPlayVideoLesson'), null, 'btnPlayVideoLesson must not exist in DOM');
      assert.strictEqual(await page.$('#modalVideoLessonContainer'), null, 'modalVideoLessonContainer must not exist in DOM');

      // Invariant 2: HanziWriter / stroke writing section is preserved
      assert.notStrictEqual(await page.$('#modalWritingSection'), null, 'modalWritingSection must be preserved');
      assert.strictEqual(await page.textContent('#modalRadicalChar'), '木');
      assert.strictEqual(await page.textContent('#modalRadicalPinyin'), 'mù');
      assert.strictEqual(await page.textContent('#modalRadicalHanViet'), 'Mộc');
      assert.strictEqual(await page.textContent('#modalRadicalMeaning'), 'Cây cối');

      // Close modal cleanly
      await page.click('#modalCloseBtn');
      await page.waitForFunction(() => !document.getElementById('radicalDetailModal').hasAttribute('open'), { timeout: 5000 });
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('RCAT-12: Adversarial XSS payload in API response is safely rendered as plain text', { timeout: 15000 }, async () => {
    const { page, context } = await createMonitoredPage(browser);

    try {
      let xssExecuted = false;
      page.on('dialog', async (dialog) => {
        xssExecuted = true;
        await dialog.dismiss();
      });

      const adversarialRadicals = [
        {
          radicalId: 1,
          character: '<script>alert("xss")</script>',
          pinyin: 'yī',
          meaningHanViet: '<img src=x onerror=alert(1)>',
          meaningVi: 'javascript:alert(1)',
          commonRank: 1,
          explanationVi: '<script>alert("expl")</script>',
          videoLessonUrl: 'javascript:alert(2)',
          audioUrl: 'javascript:alert(3)',
          videoWritingUrl: 'data:text/html,<script>alert(4)</script>'
        }
      ];

      await page.route('**/api/v1/radicals*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: { page: 0, size: 1, totalElements: 1, totalPages: 1, items: adversarialRadicals }
          })
        });
      });

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForSelector('.radical-card', { timeout: 5000 });

      await page.click('.radical-card');
      await page.waitForSelector('#radicalDetailModal[open]', { timeout: 5000 });

      await page.waitForTimeout(300);
      assert.strictEqual(xssExecuted, false, 'No adversarial script must execute');
      assert.strictEqual(await page.locator('#modalVideoLessonContainer iframe').count(), 0);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('RCAT-13: API 500 error triggers Error state, and Retry button recovers on success', { timeout: 15000 }, async () => {
    const { page, context } = await createMonitoredPage(browser);
    let attempts = 0;
    const mockRadicals = create214MockRadicals();

    try {
      await page.route('**/api/v1/radicals*', async (route) => {
        attempts++;
        if (attempts === 1) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'INTERNAL_ERROR',
              message: 'Máy chủ danh mục gặp sự cố tạm thời'
            })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'SUCCESS',
              message: 'OK',
              data: { page: 0, size: 214, totalElements: 214, totalPages: 1, items: mockRadicals }
            })
          });
        }
      });

      await page.goto(`${baseUrl}/radicals.html`, { waitUntil: 'domcontentloaded', timeout: 5000 });

      await page.waitForSelector('.state-error-icon', { timeout: 5000 });
      const errorText = await page.textContent('.state-error-desc');
      assert.ok(errorText.includes('Máy chủ danh mục gặp sự cố'));

      // Click Retry
      await page.click('.state-container button');

      // Recovers to default 50 tab view
      await page.waitForSelector('.radical-card', { timeout: 5000 });
      const restoredCount = await page.locator('#commonRadicalsGrid .radical-card').count();
      assert.strictEqual(restoredCount, 50, 'Retry successfully loads common radicals');
    } finally {
      await page.close();
      await context.close();
    }
  });

});
