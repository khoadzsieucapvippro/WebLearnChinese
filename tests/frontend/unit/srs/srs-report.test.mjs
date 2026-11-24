/**
 * =============================================================================
 * UNIT TESTS: VOCABULARY LEARNING REPORT & COLUMN CHART
 * File: tests/frontend/unit/srs/srs-report.test.mjs
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeNiceScaleMax,
  formatMonthComparison,
  buildReportQueryPath,
  calculateProgressPct
} from '../../../../frontend/js/pages/srs-report-page.js';

describe('Unit: Vocabulary Report Helpers', () => {
  test('computeNiceScaleMax returns multiples of 4 covering max value and daily goal', () => {
    assert.strictEqual(computeNiceScaleMax(0, 0), 4);
    assert.strictEqual(computeNiceScaleMax(3, 0), 4);
    assert.strictEqual(computeNiceScaleMax(7, 0), 8);
    assert.strictEqual(computeNiceScaleMax(5, 20), 20);
    assert.strictEqual(computeNiceScaleMax(23, 20), 40);
    assert.strictEqual(computeNiceScaleMax(42, 20), 60);
    assert.strictEqual(computeNiceScaleMax(100, 20) % 4, 0);
  });

  test('formatMonthComparison handles zero, increase, decrease, and equal months', () => {
    assert.strictEqual(formatMonthComparison(0, 0), 'Chưa có từ mới trong 2 tháng gần đây');
    assert.strictEqual(formatMonthComparison(12, 0), 'Tháng trước: 0 từ (+12 từ mới)');
    assert.strictEqual(formatMonthComparison(25, 10), 'Tăng +15 từ so với tháng trước (10)');
    assert.strictEqual(formatMonthComparison(8, 20), 'Tháng trước: 20 từ (chênh -12 từ)');
    assert.strictEqual(formatMonthComparison(15, 15), 'Bằng tháng trước (15 từ)');
  });

  test('buildReportQueryPath builds sanitized period/days/year query parameters', () => {
    assert.strictEqual(
      buildReportQueryPath({ period: 'day', days: 7, year: 2026 }),
      '/srs/vocabulary-report?period=day&days=7'
    );
    assert.strictEqual(
      buildReportQueryPath({ period: 'day', days: 999, year: 2026 }),
      '/srs/vocabulary-report?period=day&days=14'
    );
    assert.strictEqual(
      buildReportQueryPath({ period: 'month', days: 14, year: 2025 }),
      '/srs/vocabulary-report?period=month&year=2025'
    );
    assert.strictEqual(
      buildReportQueryPath({ period: 'quarter', days: 14, year: 2026 }),
      '/srs/vocabulary-report?period=quarter&year=2026'
    );
    assert.strictEqual(
      buildReportQueryPath({ period: 'invalid', days: 14, year: 2026 }),
      '/srs/vocabulary-report?period=day&days=14'
    );
    assert.strictEqual(
      buildReportQueryPath({ period: 'day', days: 14, year: 2026, cardType: 'LISTENING' }),
      '/srs/vocabulary-report?period=day&days=14&cardType=LISTENING'
    );
    assert.strictEqual(
      buildReportQueryPath({ period: 'month', days: 14, year: 2026, cardType: 'ALL' }),
      '/srs/vocabulary-report?period=month&year=2026'
    );
  });

  test('calculateProgressPct safely clamps percentage between 0 and 100', () => {
    assert.strictEqual(calculateProgressPct(0, 1000), 0);
    assert.strictEqual(calculateProgressPct(250, 1000), 25);
    assert.strictEqual(calculateProgressPct(1200, 1000), 100);
    assert.strictEqual(calculateProgressPct(10, 0), 0);
  });
});
