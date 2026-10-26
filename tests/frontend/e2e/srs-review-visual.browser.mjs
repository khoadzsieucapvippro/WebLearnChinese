/**
 * =============================================================================
 * VISUAL & RESPONSIVE E2E TEST: SRS REVIEW REDESIGN VERIFICATION
 * File: tests/frontend/e2e/srs-review-visual.browser.mjs
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

function createMockRadicals(count = 50) {
  const radicals = [];
  for (let i = 1; i <= count; i++) {
    radicals.push({
      radicalId: i,
      character: `字${i}`,
      pinyin: `zì${i}`,
      meaningVi: `Nghĩa bộ thủ ${i}`,
      meaningHanViet: `Hán Việt ${i}`,
      strokeCount: (i % 6) + 1,
      frequencyRank: i
    });
  }
  return radicals;
}

function setupMockAuth(page) {
  return page.addInitScript(() => {
    localStorage.setItem('access_token', 'mock_jwt_visual_testing');
    localStorage.setItem('user_info', JSON.stringify({
      accountId: 1001,
      emailOrPhone: 'visual_learner@example.com',
      fullName: 'Học Viên Visual Test',
      roles: ['Learner']
    }));
    localStorage.setItem('srs_flashcard_progress', JSON.stringify({
      radicals50: {
        chapter_0: 10,
        chapter_1: 4
      }
    }));
  });
}

describe('Browser E2E: SRS Review Redesign & Visual Invariants', () => {
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

  test('VR-01: Desktop Viewport (1280px) Layout & Invariants', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 800
    });

    try {
      await setupMockAuth(page);

      // Route mocks
      await page.route('**/api/v1/radicals*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              items: createMockRadicals(50),
              page: 0,
              size: 50,
              totalElements: 50,
              totalPages: 1
            }
          })
        });
      });

      await page.route('**/api/v1/srs/due*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: [
              { itemType: 'RADICAL', itemId: 1, character: '字1', isDue: true },
              { itemType: 'RADICAL', itemId: 2, character: '字2', isDue: true }
            ]
          })
        });
      });

      await page.route('**/api/v1/**/notes*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: { items: [] } })
        });
      });

      // Navigate with explicit ?group=radicals50 to ensure catalog selection view
      await page.goto(`${baseUrl}/srs-review.html?group=radicals50`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.stage-card', { timeout: 8000 });

      // 1. Check Subtitle
      const subtitle = await page.$eval('#srsPageSubheading', el => el.textContent.trim());
      assert.strictEqual(subtitle, 'Luyện tập ghi nhớ bộ thủ và từ vựng HSK theo phương pháp lặp lại ngắt quãng (SRS).');

      // 2. Check 4 Skill Tabs Centered & Prominent
      const tabsWrapper = await page.$('.srs-segmented-skills');
      assert.ok(tabsWrapper, 'srs-segmented-skills must exist');
      const tabButtons = await page.$$('.srs-segment-btn');
      assert.strictEqual(tabButtons.length, 4, 'Must have 4 skill tabs');
      const tabHeight = await page.$eval('.srs-segment-btn', el => el.getBoundingClientRect().height);
      assert.ok(tabHeight >= 44, `Tab button height should be >= 44px, got ${tabHeight}px`);

      // 3. Check Shelf - "KỆ 5 GIÁO TRÌNH" deleted
      const shelfText = await page.$eval('#srsCatalogSelection', el => el.innerText);
      assert.ok(!shelfText.includes('KỆ 5 GIÁO TRÌNH'), 'Heading "KỆ 5 GIÁO TRÌNH" must be removed');

      // Check 5 Deck Cards
      const deckCards = await page.$$('.srs-deck-card');
      assert.strictEqual(deckCards.length, 5, 'Must have 5 deck cards');

      // Active deck card styling
      const activeDeck = await page.$('.srs-deck-card.active');
      assert.ok(activeDeck, 'Active deck card must exist');
      const activeDeckBorder = await activeDeck.evaluate(el => window.getComputedStyle(el).borderColor);
      assert.strictEqual(activeDeckBorder, 'rgb(200, 60, 35)', 'Active deck card border must be cinnabar #C83C23');

      // Mini progress bars in deck cards
      const miniProgressBars = await page.$$('.srs-deck-progress.mini-progress');
      assert.strictEqual(miniProgressBars.length, 5, 'Each deck card must have a mini progress bar');

      // Due badge format is compact ⚡ N
      const dueBadge = await page.$('#deckDueBadge_radicals50');
      const badgeText = await dueBadge.evaluate(el => el.textContent.trim());
      assert.ok(/^⚡\s*\d+$/.test(badgeText), `Due badge should be in format "⚡ N", got "${badgeText}"`);

      // Deck card titles must stay on a single line (avoid dropping to second line per Requirement 2)
      const deckTitleHeights = await page.$$eval('.srs-deck-title', titles => titles.map(t => t.getBoundingClientRect().height));
      const lineHeights = await page.$$eval('.srs-deck-title', titles => titles.map(t => parseFloat(window.getComputedStyle(t).lineHeight)));
      deckTitleHeights.forEach((h, idx) => {
        assert.ok(h <= lineHeights[idx] * 1.25, `Deck title #${idx + 1} must stay on 1 line (height ${h}px vs single-line ${lineHeights[idx]}px)`);
      });

      // All 5 deck cards must have equal heights
      const deckHeights = await Promise.all(deckCards.map(c => c.evaluate(el => el.getBoundingClientRect().height)));
      const deckHeightDiff = Math.max(...deckHeights) - Math.min(...deckHeights);
      assert.ok(deckHeightDiff <= 1.0, `All 5 shelf deck cards must have equal heights, got diff ${deckHeightDiff}px`);

      // 4. Redundant text between shelf and stage grid hidden
      const visuallyHiddenHeaders = await page.$('.visually-hidden #catalogGroupTitle');
      assert.ok(visuallyHiddenHeaders, '#catalogGroupTitle must be in .visually-hidden');

      // 5. Stage Grid & Equal Card Heights
      const stageGrid = await page.$('.stage-grid');
      assert.ok(stageGrid, '.stage-grid must exist');

      const stageCards = await page.$$('.stage-card');
      assert.strictEqual(stageCards.length, 5, 'Must render exactly 5 stage cards for 50 radicals');

      const heights = await Promise.all(stageCards.map(c => c.evaluate(el => el.getBoundingClientRect().height)));
      // Row 1 cards: index 0, 1, 2 on 3-col grid
      const row1Heights = heights.slice(0, 3);
      const maxDiff = Math.max(...row1Heights) - Math.min(...row1Heights);
      assert.ok(maxDiff <= 1.0, `Cards in the same row must have equal heights (max diff <= 1px, got ${maxDiff}px)`);

      // Verify Stage Card Tiers
      // Tier 1: Title and Count badge, NO red due badge
      const tier1RedBadges = await stageCards[0].$$('.d-flex.justify-content-between.align-items-start .badge.bg-danger');
      assert.strictEqual(tier1RedBadges.length, 0, 'Tier 1 must not contain a red due badge');

      // Tier 2: Preview
      const preview = await stageCards[0].$('.srs-chapter-preview');
      assert.ok(preview, 'Tier 2 preview area must exist');

      // Tier 3: Progress Box with min-height 28px on top row
      const progressBoxTop = await stageCards[0].$('.srs-progress-box-top');
      assert.ok(progressBoxTop, 'Tier 3 srs-progress-box-top must exist');
      const topRowHeight = await progressBoxTop.evaluate(el => el.getBoundingClientRect().height);
      assert.ok(topRowHeight >= 28, `Top row min-height should be >= 28px, got ${topRowHeight}px`);

      // Tier 4: Footer actions box with min-height 32px
      const actionsBox = await stageCards[0].$('.srs-chapter-actions');
      assert.ok(actionsBox, 'Tier 4 srs-chapter-actions must exist');
      const actionsMinHeight = await actionsBox.evaluate(e => parseFloat(window.getComputedStyle(e).minHeight));
      assert.ok(actionsMinHeight >= 32, `Actions box min-height should be >= 32px, got ${actionsMinHeight}px`);

      // Check no horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      assert.strictEqual(hasHorizontalScroll, false, 'Desktop layout must not have horizontal overflow');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero runtime errors');
    } finally {
      await context.close();
    }
  });

  test('VR-02: Mobile Viewport (375px) Responsiveness & Zero Overflow', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 375,
      viewportHeight: 667
    });

    try {
      await setupMockAuth(page);

      await page.route('**/api/v1/radicals*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: { items: createMockRadicals(50), page: 0, size: 50, totalElements: 50, totalPages: 1 }
          })
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
          body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: { items: [] } })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html?group=radicals50`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.stage-card', { timeout: 8000 });

      // Check tabs in 2 columns on mobile
      const tabsGridCols = await page.$eval('.srs-segmented-skills', el => window.getComputedStyle(el).gridTemplateColumns.split(' ').length);
      assert.strictEqual(tabsGridCols, 2, 'Skill tabs should wrap to 2 columns on mobile (<= 575px)');

      // Check shelf in 2 columns on mobile
      const shelfGridCols = await page.$eval('.srs-curricula-shelf', el => window.getComputedStyle(el).gridTemplateColumns.split(' ').length);
      assert.strictEqual(shelfGridCols, 2, 'Shelf should wrap to 2 columns on mobile (<= 575px)');

      // Check stage grid in 1 column on mobile
      const stageGridCols = await page.$eval('.stage-grid', el => window.getComputedStyle(el).gridTemplateColumns.split(' ').length);
      assert.strictEqual(stageGridCols, 1, 'Stage grid should be 1 column on mobile (<= 575px)');

      // Check no horizontal overflow on mobile
      const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      assert.strictEqual(hasHorizontalScroll, false, 'Mobile layout must have zero horizontal overflow');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero runtime errors');
    } finally {
      await context.close();
    }
  });

  test('VR-03: HSK Curriculum Stage Grid & Equal Heights with Due Button in Progress Box', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 800
    });

    try {
      await setupMockAuth(page);

      await page.route('**/api/v1/radicals*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: { items: [], page: 0, size: 214, totalElements: 0, totalPages: 0 }
          })
        });
      });

      await page.route('**/api/v1/srs/due*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: [
              { itemType: 'VOCABULARY', itemId: 296, isDue: true },
              { itemType: 'VOCABULARY', itemId: 505, isDue: true }
            ]
          })
        });
      });

      await page.route('**/api/v1/lessons*', async (route) => {
        const mockLessons = Array.from({ length: 15 }, (_, i) => ({
          lessonId: i + 1,
          title: `HSK 1 — Bài ${String(i + 1).padStart(2, '0')}`,
          status: 'Approved'
        }));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: { items: mockLessons } })
        });
      });

      await page.route('**/api/v1/**/notes*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: { items: [] } })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html?group=hsk1`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.stage-card', { timeout: 8000 });

      // Verify active deck card is HSK 1
      const activeDeck = await page.$('.srs-deck-card.active');
      assert.ok(activeDeck, 'Active deck card must exist');
      const activeId = await activeDeck.getAttribute('id');
      assert.strictEqual(activeId, 'groupTabHsk1', 'Active deck card must be groupTabHsk1');

      // Verify stage grid has 15 topic cards (standardized HSK 3.0 curriculum: 15 topics for HSK 1)
      const stageCards = await page.$$('.stage-card');
      assert.strictEqual(stageCards.length, 15, 'HSK 1 must render 15 topic cards');

      // Verify equal height across row 1
      const heights = await Promise.all(stageCards.map(c => c.evaluate(el => el.getBoundingClientRect().height)));
      const row1Heights = heights.slice(0, 3);
      const maxDiff = Math.max(...row1Heights) - Math.min(...row1Heights);
      assert.ok(maxDiff <= 1.0, `HSK cards in the same row must have equal heights, got diff ${maxDiff}px`);

      // Verify compact due button inside top row of progress box for Topic 1 (which has vocab 101, 102)
      const dueBtn = await stageCards[0].$('.srs-progress-box-top .srs-btn-due-compact');
      assert.ok(dueBtn, 'Compact due button must be inside progress box top row');
      const dueText = await dueBtn.textContent();
      assert.ok(dueText.includes('⚡ Ôn'), `Due button should contain "⚡ Ôn", got "${dueText}"`);

      // Verify Tier 1 of Topic 1 does NOT have due badge
      const tier1RedBadge = await stageCards[0].$('.d-flex.justify-content-between.align-items-start .badge.bg-danger');
      assert.strictEqual(tier1RedBadge, null, 'Tier 1 must not contain red due badge');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero runtime errors');
    } finally {
      await context.close();
    }
  });

  test('VR-04: Writing Mode 3-State Lifecycle & Visual Invariants (State 1 -> State 2 -> State 3)', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 800
    });

    try {
      await setupMockAuth(page);

      await page.route('**/api/v1/vocabulary/101', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              vocabId: 101,
              hanzi: '请',
              pinyin: 'qǐng',
              meaningHanViet: 'Thỉnh',
              meaningVi: 'Mời; mời mọc',
              audioUrl: '/audio/101.mp3'
            }
          })
        });
      });

      await page.route('**/api/v1/radicals*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: { items: [], page: 0, size: 214, totalElements: 0, totalPages: 0 } })
        });
      });

      await page.route('**/audio/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'audio/mpeg', body: '' });
      });

      await page.route('**/api/v1/**/notes*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: { items: [] } })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html?mode=writing&vocabId=101`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.srs-writing-card', { timeout: 8000 });

      // === STATE 1: Mới vào từ mới ===
      // 1. Single unified large card centered, max-width 580px, white background
      const cardStyle = await page.$eval('.srs-writing-card', el => {
        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          bgColor: cs.backgroundColor,
          maxWidth: cs.maxWidth,
          width: rect.width
        };
      });
      assert.strictEqual(cardStyle.bgColor, 'rgb(255, 255, 255)', 'Card background must be white (#ffffff)');
      assert.strictEqual(cardStyle.maxWidth, '580px', 'Card max-width must be 580px');
      assert.ok(cardStyle.width <= 580, `Card rendered width ${cardStyle.width}px must be <= 580px`);

      // 2. "Từ vựng" / "Bộ thủ" badge must be hidden
      const isBadgeHidden = await page.$eval('#writingRoomBadge', el => el.classList.contains('d-none'));
      assert.strictEqual(isBadgeHidden, true, '#writingRoomBadge must be hidden');

      // 3. Word info
      const pinyinText = await page.$eval('#writingPromptPinyin', el => el.textContent.trim());
      assert.strictEqual(pinyinText, 'qǐng', 'Pinyin must be qǐng');
      const hvText = await page.$eval('#writingPromptHanViet', el => el.textContent.trim());
      assert.strictEqual(hvText, '[Thỉnh]', 'Han-Viet must be [Thỉnh]');
      const meaningText = await page.$eval('#writingPromptMeaning', el => el.textContent.trim());
      assert.strictEqual(meaningText, 'Mời; mời mọc', 'Meaning must be "Mời; mời mọc"');

      // 4. Speaker button hidden initially in State 1
      const isAudioHidden = await page.$eval('#btnWritingAudio', el => el.classList.contains('d-none'));
      assert.strictEqual(isAudioHidden, true, 'Speaker button must be hidden initially in State 1');

      // 5. Completion notice hidden initially
      const isNoticeHidden = await page.$eval('#writingCompletionNotice', el => el.classList.contains('d-none'));
      assert.strictEqual(isNoticeHidden, true, 'Completion notice must be hidden initially in State 1');

      // 6. Rice grid box has normal gray border (no .is-completed)
      const hasCompletedClass = await page.$eval('.writing-rice-grid-box', el => el.classList.contains('is-completed'));
      assert.strictEqual(hasCompletedClass, false, 'Rice grid box must not have is-completed class in State 1');

      // 7. 3 secondary tools visible with neutral gray styling
      const toolButtons = await page.$$eval('.btn-writing-tool', btns => btns.map(b => ({
        text: b.textContent.trim(),
        visible: window.getComputedStyle(b).display !== 'none'
      })));
      assert.strictEqual(toolButtons.length, 3, 'Must render 3 secondary tool buttons');
      assert.ok(toolButtons.some(b => b.text.includes('Phát lại nét') && b.visible));
      assert.ok(toolButtons.some(b => b.text.includes('Xem gợi ý') && b.visible));
      assert.ok(toolButtons.some(b => b.text.includes('Viết lại') && b.visible));

      // 8. Next button hidden with reserved space
      const isNextHidden = await page.$eval('#btnWritingNext', el => el.classList.contains('writing-next-hidden'));
      assert.strictEqual(isNextHidden, true, 'Next button must have writing-next-hidden in State 1');
      const nextContainerHeight = await page.$eval('#writingNextContainer', el => el.getBoundingClientRect().height);
      assert.ok(nextContainerHeight >= 50, `Next container min-height must reserve vertical space (got ${nextContainerHeight}px)`);

      // 9. Pressing Space / Enter does NOT advance in State 1
      await page.keyboard.press('Space');
      await page.waitForTimeout(100);
      const stillSamePinyin = await page.$eval('#writingPromptPinyin', el => el.textContent.trim());
      assert.strictEqual(stillSamePinyin, 'qǐng', 'Space must not advance in State 1');

      // === STATE 2: Khi hoàn thành nét cuối ===
      await page.evaluate(() => {
        window.srsReviewController.handleWritingItemCompleted();
      });

      // 1. Audio speaker shown
      const isAudioVisibleState2 = await page.$eval('#btnWritingAudio', el => !el.classList.contains('d-none'));
      assert.strictEqual(isAudioVisibleState2, true, 'Speaker button must be visible in State 2');

      // 2. Rice grid green border
      const isGridCompletedState2 = await page.$eval('.writing-rice-grid-box', el => el.classList.contains('is-completed'));
      assert.strictEqual(isGridCompletedState2, true, 'Rice grid box must have .is-completed in State 2');
      const gridBorderColor = await page.$eval('.writing-rice-grid-box.is-completed', el => window.getComputedStyle(el).borderColor);
      assert.strictEqual(gridBorderColor, 'rgb(27, 122, 75)', 'Rice grid box border must be green #1B7A4B');

      // 3. Completion notice visible
      const isNoticeVisibleState2 = await page.$eval('#writingCompletionNotice', el => !el.classList.contains('d-none') && el.textContent.includes('✓ Hoàn thành!'));
      assert.strictEqual(isNoticeVisibleState2, true, 'Completion notice must show "✓ Hoàn thành!" in State 2');

      // 4. [Xem gợi ý] hidden, only [Phát lại nét] and [Viết lại] visible
      const isOutlineHiddenState2 = await page.$eval('#btnWritingOutline', el => el.classList.contains('d-none'));
      assert.strictEqual(isOutlineHiddenState2, true, 'Outline button must be hidden in State 2');

      // 5. Next button visible
      const isNextVisibleState2 = await page.$eval('#btnWritingNext', el => !el.classList.contains('writing-next-hidden'));
      assert.strictEqual(isNextVisibleState2, true, 'Next button must be visible in State 2');

      // === STATE 3: Bấm "Viết lại" sau khi đã hoàn thành ===
      await page.click('#btnWritingClear');

      // 1. Rice grid returns to normal gray
      const isGridCompletedState3 = await page.$eval('.writing-rice-grid-box', el => el.classList.contains('is-completed'));
      assert.strictEqual(isGridCompletedState3, false, 'Rice grid box must lose .is-completed in State 3');

      // 2. Completion notice hidden
      const isNoticeHiddenState3 = await page.$eval('#writingCompletionNotice', el => el.classList.contains('d-none'));
      assert.strictEqual(isNoticeHiddenState3, true, 'Completion notice must be hidden in State 3');

      // 3. Outline button restored
      const isOutlineVisibleState3 = await page.$eval('#btnWritingOutline', el => !el.classList.contains('d-none'));
      assert.strictEqual(isOutlineVisibleState3, true, 'Outline button must be visible again in State 3');

      // 4. Speaker button REMAINS visible
      const isAudioVisibleState3 = await page.$eval('#btnWritingAudio', el => !el.classList.contains('d-none'));
      assert.strictEqual(isAudioVisibleState3, true, 'Speaker button must remain visible in State 3');

      // 5. CRITICAL: Next button REMAINS VISIBLE
      const isNextVisibleState3 = await page.$eval('#btnWritingNext', el => !el.classList.contains('writing-next-hidden'));
      assert.strictEqual(isNextVisibleState3, true, 'Next button MUST REMAIN VISIBLE in State 3');

      const runtimeErrors = getRuntimeErrors();
      assert.strictEqual(runtimeErrors.length, 0, `Runtime errors:\n${runtimeErrors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('VR-05: Writing Mode Mobile Viewport (375px) Responsiveness & Zero Overflow', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 375,
      viewportHeight: 667
    });

    try {
      await setupMockAuth(page);

      await page.route('**/api/v1/vocabulary/101', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'OK',
            data: {
              vocabId: 101,
              hanzi: '请',
              pinyin: 'qǐng',
              meaningHanViet: 'Thỉnh',
              meaningVi: 'Mời; mời mọc',
              audioUrl: '/audio/101.mp3'
            }
          })
        });
      });

      await page.route('**/api/v1/radicals*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: { items: [], page: 0, size: 214, totalElements: 0, totalPages: 0 } })
        });
      });

      await page.route('**/api/v1/**/notes*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: { items: [] } })
        });
      });

      await page.goto(`${baseUrl}/srs-review.html?mode=writing&vocabId=101`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.srs-writing-card', { timeout: 8000 });

      // Check card fits within 375px mobile viewport
      const cardRect = await page.$eval('.srs-writing-card', el => {
        const r = el.getBoundingClientRect();
        return { width: r.width, left: r.left, right: r.right };
      });
      assert.ok(cardRect.width <= 375, `Card width ${cardRect.width}px must fit within 375px`);

      // Check all 3 tool buttons fit without overflow
      const toolsWidth = await page.$eval('#writingToolsRow', el => el.getBoundingClientRect().width);
      assert.ok(toolsWidth <= 375, `Tools row width ${toolsWidth}px must fit within 375px`);

      // Check zero document-level horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      assert.strictEqual(hasHorizontalScroll, false, 'Mobile writing room must have zero horizontal overflow');

      assert.strictEqual(getRuntimeErrors().length, 0, 'Zero runtime errors');
    } finally {
      await context.close();
    }
  });
});

