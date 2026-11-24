/**
 * =============================================================================
 * BROWSER E2E TEST: VOCABULARY REPORT & COLUMN CHART (METHOD A)
 * File: tests/frontend/e2e/srs-report.browser.mjs
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

function createMockReport(period = 'day', days = 14, year = 2026, cardType = 'ALL') {
  const factor = cardType === 'LISTENING' ? 5 : null;
  let buckets;
  if (period === 'month') {
    buckets = Array.from({ length: 12 }, (_, idx) => {
      const m = idx + 1;
      return {
        key: `${year}-${String(m).padStart(2, '0')}`,
        label: `T${m}`,
        fullLabel: `Tháng ${m}/${year}`,
        newWordsCount: factor !== null ? (m === 11 ? factor : 0) : (m === 11 ? 35 : (m % 3) * 8),
        reviewedWordsCount: factor !== null ? (m === 11 ? factor : 0) : (m === 11 ? 62 : (m % 4) * 14),
        reviewActionsCount: factor !== null ? (m === 11 ? factor : 0) : (m === 11 ? 110 : (m % 4) * 20),
        current: year === 2026 && m === 11,
        skillReviewedCounts: { FLASHCARD: 10, READING: 8, LISTENING: 5, WRITING: 3 }
      };
    });
  } else if (period === 'quarter') {
    buckets = [1, 2, 3, 4].map((q) => ({
      key: `${year}-Q${q}`,
      label: `Quý ${q}`,
      fullLabel: `Quý ${q}/${year} (T${(q - 1) * 3 + 1}–T${q * 3})`,
      newWordsCount: factor !== null ? (q === 4 ? factor : 0) : (q === 4 ? 54 : q * 15),
      reviewedWordsCount: factor !== null ? (q === 4 ? factor : 0) : (q === 4 ? 90 : q * 25),
      reviewActionsCount: factor !== null ? (q === 4 ? factor : 0) : (q === 4 ? 170 : q * 40),
      current: year === 2026 && q === 4,
      skillReviewedCounts: { FLASHCARD: 20, READING: 15, LISTENING: 5, WRITING: 4 }
    }));
  } else {
    buckets = Array.from({ length: days }, (_, idx) => ({
      key: `2026-11-${String(11 + idx).padStart(2, '0')}`,
      label: `${String(11 + idx).padStart(2, '0')}/11`,
      fullLabel: `Thứ 2, ${String(11 + idx).padStart(2, '0')}/11/2026`,
      newWordsCount: factor !== null ? (idx === days - 1 ? factor : 0) : (idx === days - 1 ? 12 : (idx * 3) % 24),
      reviewedWordsCount: factor !== null ? (idx === days - 1 ? factor : 0) : (idx === days - 1 ? 26 : ((idx * 5) % 30) + 2),
      reviewActionsCount: 30 + idx,
      current: idx === days - 1,
      skillReviewedCounts: { FLASHCARD: 12, READING: 7, LISTENING: 5, WRITING: 2 }
    }));
  }

  return {
    period,
    cardType,
    year,
    days,
    endDate: '2026-11-24',
    dailyGoal: 20,
    summary: {
      todayNewCount: factor !== null ? factor : 12,
      todayReviewedCount: factor !== null ? factor : 26,
      monthNewCount: factor !== null ? factor : 35,
      monthReviewedCount: factor !== null ? factor : 62,
      previousMonthNewCount: 19,
      quarterNewCount: factor !== null ? factor : 54,
      quarterReviewedCount: factor !== null ? factor : 90,
      totalLearnedVocab: factor !== null ? factor : 142,
      totalSystemVocab: 1000
    },
    buckets,
    availableYears: [2026, 2025]
  };
}

async function setupAuthenticatedSession(page) {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'test_srs_report_jwt');
    localStorage.setItem('user_info', JSON.stringify({
      accountId: 1001,
      emailOrPhone: 'srs_report_user@example.com',
      fullName: 'Học Viên Báo Cáo',
      roles: ['Learner']
    }));
  });
}

describe('Browser E2E: Vocabulary Report & Column Chart', () => {
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

  test('SR-01: Anonymous user sees login guard without calling report API', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      let calledReportApi = false;
      await page.route('**/api/v1/srs/vocabulary-report**', async (route) => {
        calledReportApi = true;
        await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
      });

      await page.goto(`${baseUrl}/srs-report.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#reportAuthState').waitFor({ state: 'visible' });
      assert.strictEqual(calledReportApi, false, 'Anonymous user must not trigger protected API');
      assert.strictEqual(getRuntimeErrors().length, 0);
    } finally {
      await context.close();
    }
  });

  test('SR-02: Dropdown link directly below Tiến độ học tập opens srs-report.html and renders Day/Month/Quarter columns cleanly', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/srs/vocabulary-report**', async (route) => {
        const url = new URL(route.request().url());
        const period = url.searchParams.get('period') || 'day';
        const days = Number(url.searchParams.get('days') || '14');
        const year = Number(url.searchParams.get('year') || '2026');
        const cardType = url.searchParams.get('cardType') || 'ALL';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', data: createMockReport(period, days, year, cardType) })
        });
      });

      await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#navAccountDropdownTrigger').click();
      await page.locator('#navAccountDropdownMenu').waitFor({ state: 'visible' });

      const menuLinks = await page.locator('#navAccountDropdownMenu a.nav-dropdown-item').evaluateAll((els) =>
        els.map((el) => ({ id: el.id, text: (el.textContent || '').trim(), href: el.getAttribute('href') }))
      );
      assert.strictEqual(menuLinks[1].id, 'navLearningProgressBtn');
      assert.strictEqual(menuLinks[2].id, 'navVocabularyReportBtn');
      assert.strictEqual(menuLinks[2].text, 'Báo cáo ôn tập');
      assert.strictEqual(menuLinks[2].href, 'srs-report.html');

      await Promise.all([
        page.waitForURL('**/srs-report.html'),
        page.locator('#navVocabularyReportBtn').click()
      ]);

      await page.locator('#reportContentSection').waitFor({ state: 'visible' });
      assert.strictEqual(await page.locator('#statTodayLearned').textContent(), '26');
      assert.strictEqual(await page.locator('#statMonthNew').textContent(), '35');
      assert.strictEqual(await page.locator('#statQuarterNew').textContent(), '54');
      assert.strictEqual(await page.locator('#statTotalLearned').textContent(), '142');
      assert.strictEqual(await page.locator('.srs-chart-col-btn').count(), 14);
      assert.strictEqual(await page.locator('.srs-chart-bar-reviewed').count(), 14);
      assert.strictEqual(await page.locator('#reportGoalLine').isVisible(), true);

      // Toggle off paired reviewed column, then back on
      await page.locator('#chkIncludeReviewed').click();
      assert.strictEqual(await page.locator('.srs-chart-bar-reviewed').count(), 0);
      await page.locator('#chkIncludeReviewed').click();
      assert.strictEqual(await page.locator('.srs-chart-bar-reviewed').count(), 14);

      // Scroll down to chart section and verify switching tabs preserves scroll position (never resets to 0)
      await page.locator('#tabPeriodMonth').scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollTo(0, 260));
      const scrollBeforeSwitch = await page.evaluate(() => window.scrollY);
      assert.ok(scrollBeforeSwitch >= 150, `Expected scrolled position >= 150, got ${scrollBeforeSwitch}`);

      // Switch to Month tab (12 columns)
      await page.locator('#tabPeriodMonth').click();
      await page.waitForFunction(() => document.querySelectorAll('.srs-chart-col-btn').length === 12);
      assert.strictEqual(await page.locator('#tabPeriodMonth').getAttribute('aria-selected'), 'true');
      assert.strictEqual(await page.locator('#reportGoalLine').isVisible(), false);
      const scrollAfterMonth = await page.evaluate(() => window.scrollY);
      assert.ok(
        Math.abs(scrollAfterMonth - scrollBeforeSwitch) <= 10,
        `Scroll jumped on Month tab switch: before=${scrollBeforeSwitch}, after=${scrollAfterMonth}`
      );

      // Switch to Quarter tab (4 columns)
      await page.locator('#tabPeriodQuarter').click();
      await page.waitForFunction(() => document.querySelectorAll('.srs-chart-col-btn').length === 4);
      const scrollAfterQuarter = await page.evaluate(() => window.scrollY);
      assert.ok(
        Math.abs(scrollAfterQuarter - scrollBeforeSwitch) <= 10,
        `Scroll jumped on Quarter tab switch: before=${scrollBeforeSwitch}, after=${scrollAfterQuarter}`
      );

      // Filter by Listening skill and confirm count updates + scroll stays preserved
      await page.locator('#btnSkillListening').click();
      await page.waitForFunction(() => document.getElementById('statTodayLearned')?.textContent === '5');
      assert.strictEqual(await page.locator('#btnSkillListening').getAttribute('aria-pressed'), 'true');
      assert.strictEqual(await page.locator('#btnSkillAll').getAttribute('aria-pressed'), 'false');
      const scrollAfterSkill = await page.evaluate(() => window.scrollY);
      assert.ok(
        Math.abs(scrollAfterSkill - scrollBeforeSwitch) <= 10,
        `Scroll jumped on Skill filter switch: before=${scrollBeforeSwitch}, after=${scrollAfterSkill}`
      );

      // Toggle accessible data table
      await page.locator('#btnToggleReportTable').click();
      assert.strictEqual(await page.locator('#reportTableContainer').isVisible(), true);
      assert.strictEqual(await page.locator('#reportTableBody tr').count(), 4);

      assert.strictEqual(getRuntimeErrors().length, 0);
    } finally {
      await context.close();
    }
  });

  test('SR-03: Mobile viewport (375x812) renders chart without horizontal page overflow', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 375,
      viewportHeight: 812
    });

    try {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/srs/vocabulary-report**', async (route) => {
        const url = new URL(route.request().url());
        const period = url.searchParams.get('period') || 'day';
        const days = Number(url.searchParams.get('days') || '14');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'SUCCESS', data: createMockReport(period, days, 2026) })
        });
      });

      await page.goto(`${baseUrl}/srs-report.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#reportContentSection').waitFor({ state: 'visible' });

      // Select 30 days dense mode on mobile
      await page.locator('#reportDaysSelect').selectOption('30');
      await page.waitForFunction(() => document.querySelectorAll('.srs-chart-col-btn').length === 30);

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));
      assert.ok(
        overflow.scrollWidth <= overflow.clientWidth,
        `Page overflowed horizontally on mobile: ${overflow.scrollWidth} > ${overflow.clientWidth}`
      );
      assert.strictEqual(getRuntimeErrors().length, 0);
    } finally {
      await context.close();
    }
  });
});
