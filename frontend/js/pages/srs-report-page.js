/**
 * =============================================================================
 * VOCABULARY LEARNING REPORT & COLUMN CHART CONTROLLER
 * Module: frontend/js/pages/srs-report-page.js
 *
 * Responsibilities:
 * - Authoritative display of vocabulary learning progress by day, month, or quarter
 *   via GET /api/v1/srs/vocabulary-report.
 * - Zero fabricated analytics: backend (or demo fallback engine) is source of truth.
 * - Pure Zero-Build Vanilla DOM rendering (100% createElement / textContent; zero innerHTML).
 * - Accessible ARIA tablist keyboard navigation, live region detail readout, and
 *   semantic data table fallback.
 * =============================================================================
 */

import { apiClient } from '../api/api.js';
import { authManager } from '../auth/auth-state.js';
import { initNavbarAuth } from '../ui/nav.js';
import { createSafeElement, clearContainer } from '../ui/security.js';
import { showToast } from '../ui/ui.js';

/**
 * Computes a clean, human-friendly upper bound for the chart Y-axis
 * divisible by 4 so the 5 Y-axis gridlines render integer tick marks.
 *
 * @param {number} maxDataValue
 * @param {number} [dailyGoal=0]
 * @returns {number}
 */
export function computeNiceScaleMax(maxDataValue, dailyGoal = 0) {
  const rawMax = Math.max(Number(maxDataValue) || 0, Number(dailyGoal) || 0, 4);
  if (rawMax <= 4) return 4;
  if (rawMax <= 8) return 8;
  if (rawMax <= 12) return 12;
  if (rawMax <= 20) return 20;

  const stepBase = Math.ceil(rawMax / 4);
  const magnitude = Math.pow(10, Math.floor(Math.log10(stepBase)));
  const niceUnit = magnitude >= 10 ? 5 * Math.pow(10, Math.floor(Math.log10(stepBase)) - 1) : 5;
  const roundedStep = Math.ceil(stepBase / Math.max(1, niceUnit)) * Math.max(1, niceUnit);
  return roundedStep * 4;
}

/**
 * Formats the month-over-month comparison helper text for the "Tháng này" KPI card.
 *
 * @param {number} currentMonth
 * @param {number} previousMonth
 * @returns {string}
 */
export function formatMonthComparison(currentMonth, previousMonth) {
  const cur = Number(currentMonth) || 0;
  const prev = Number(previousMonth) || 0;
  const diff = cur - prev;
  if (prev === 0 && cur === 0) {
    return 'Chưa có từ mới trong 2 tháng gần đây';
  }
  if (prev === 0) {
    return `Tháng trước: 0 từ (+${cur} từ mới)`;
  }
  if (diff > 0) {
    return `Tăng +${diff} từ so với tháng trước (${prev})`;
  }
  if (diff < 0) {
    return `Tháng trước: ${prev} từ (chênh ${diff} từ)`;
  }
  return `Bằng tháng trước (${prev} từ)`;
}

/**
 * Builds the sanitized query string for GET /srs/vocabulary-report.
 *
 * @param {{ period: string, year: number, days: number }} state
 * @returns {string}
 */
export function buildReportQueryPath({ period, year, days, cardType = 'ALL' }) {
  const params = new URLSearchParams();
  const safePeriod = ['day', 'month', 'quarter'].includes(period) ? period : 'day';
  params.set('period', safePeriod);
  if (safePeriod === 'day') {
    const safeDays = [7, 14, 30].includes(Number(days)) ? Number(days) : 14;
    params.set('days', String(safeDays));
  } else {
    const safeYear = Number.isInteger(Number(year)) ? Number(year) : new Date().getFullYear();
    params.set('year', String(safeYear));
  }
  const safeSkill = String(cardType || 'ALL').toUpperCase();
  if (['FLASHCARD', 'READING', 'LISTENING', 'WRITING'].includes(safeSkill)) {
    params.set('cardType', safeSkill);
  }
  return `/srs/vocabulary-report?${params.toString()}`;
}

/**
 * Calculates safe completion percentage (0 - 100%).
 *
 * @param {number} current
 * @param {number} max
 * @returns {number}
 */
export function calculateProgressPct(current, max) {
  const cur = Number(current);
  const total = Number(max);
  if (!Number.isFinite(cur) || !Number.isFinite(total) || total <= 0 || cur <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((cur / total) * 100)));
}

export class SrsReportController {
  constructor() {
    // Page States
    this.loadingState = document.getElementById('reportLoadingState');
    this.authState = document.getElementById('reportAuthState');
    this.errorState = document.getElementById('reportErrorState');
    this.errorMessage = document.getElementById('reportErrorMessage');
    this.contentSection = document.getElementById('reportContentSection');

    // Summary KPI Sinks
    this.statTodayLearned = document.getElementById('statTodayLearned');
    this.statTodayMeta = document.getElementById('statTodayMeta');
    this.statMonthNew = document.getElementById('statMonthNew');
    this.statMonthMeta = document.getElementById('statMonthMeta');
    this.statQuarterNew = document.getElementById('statQuarterNew');
    this.statQuarterMeta = document.getElementById('statQuarterMeta');
    this.statTotalLearned = document.getElementById('statTotalLearned');
    this.statTotalQuotaText = document.getElementById('statTotalQuotaText');
    this.statTotalProgressBar = document.getElementById('statTotalProgressBar');

    // Controls
    this.btnRefreshReport = document.getElementById('btnRefreshReport');
    this.btnReportRetry = document.getElementById('btnReportRetry');
    this.tabButtons = Array.from(document.querySelectorAll('.srs-report-tab[data-period]'));
    this.skillFilterButtons = Array.from(document.querySelectorAll('.srs-skill-pill[data-card-type]'));
    this.dayWindowGroup = document.getElementById('dayWindowGroup');
    this.reportDaysSelect = document.getElementById('reportDaysSelect');
    this.yearStepperGroup = document.getElementById('yearStepperGroup');
    this.btnPrevYear = document.getElementById('btnPrevYear');
    this.btnNextYear = document.getElementById('btnNextYear');
    this.reportYearLabel = document.getElementById('reportYearLabel');
    this.chkIncludeReviewed = document.getElementById('chkIncludeReviewed');

    // Chart Elements
    this.reportChartCard = document.getElementById('reportChartCard');
    this.reportChartLoadingBadge = document.getElementById('reportChartLoadingBadge');
    this.legendReviewedItem = document.getElementById('legendReviewedItem');
    this.legendGoalItem = document.getElementById('legendGoalItem');
    this.legendGoalText = document.getElementById('legendGoalText');
    this.reportChartYAxis = document.getElementById('reportChartYAxis');
    this.reportChartPlot = document.getElementById('reportChartPlot');
    this.reportGoalLine = document.getElementById('reportGoalLine');
    this.reportGoalTag = document.getElementById('reportGoalTag');
    this.reportChartColumns = document.getElementById('reportChartColumns');
    this.reportSelectedDetail = document.getElementById('reportSelectedDetail');

    // Table Toggle
    this.btnToggleReportTable = document.getElementById('btnToggleReportTable');
    this.reportTableContainer = document.getElementById('reportTableContainer');
    this.reportTableBody = document.getElementById('reportTableBody');

    // View State
    this.state = {
      period: 'day',
      cardType: 'ALL',
      days: 14,
      year: new Date().getFullYear(),
      includeReviewed: this.chkIncludeReviewed ? Boolean(this.chkIncludeReviewed.checked) : true,
      selectedBucketKey: null,
      tableExpanded: false
    };

    this.hasLoadedOnce = false;
    this.activeRequestToken = 0;
    this.reportData = null;
  }

  async init() {
    initNavbarAuth();

    if (!authManager.isAuthenticated()) {
      this.showState('auth');
      return;
    }

    this.bindEvents();
    await this.loadReportData();

    if (typeof window !== 'undefined') {
      window.addEventListener('pageshow', (e) => {
        if (e.persisted && authManager.isAuthenticated() && this.hasLoadedOnce) {
          this.loadReportData(true).catch(() => {});
        }
      });
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && authManager.isAuthenticated() && this.hasLoadedOnce) {
          this.loadReportData(true).catch(() => {});
        }
      });
    }
  }

  bindEvents() {
    if (this.btnRefreshReport) {
      this.btnRefreshReport.addEventListener('click', () => this.handleRefresh());
    }

    if (this.btnReportRetry) {
      this.btnReportRetry.addEventListener('click', () => this.loadReportData());
    }

    this.tabButtons.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const nextPeriod = btn.getAttribute('data-period');
        if (nextPeriod && nextPeriod !== this.state.period) {
          this.switchPeriod(nextPeriod);
        }
      });

      btn.addEventListener('keydown', (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        let targetIdx = idx;
        if (e.key === 'ArrowRight') targetIdx = (idx + 1) % this.tabButtons.length;
        if (e.key === 'ArrowLeft') targetIdx = (idx - 1 + this.tabButtons.length) % this.tabButtons.length;
        if (e.key === 'Home') targetIdx = 0;
        if (e.key === 'End') targetIdx = this.tabButtons.length - 1;
        const targetBtn = this.tabButtons[targetIdx];
        if (targetBtn) {
          targetBtn.focus();
          const nextPeriod = targetBtn.getAttribute('data-period');
          if (nextPeriod && nextPeriod !== this.state.period) {
            this.switchPeriod(nextPeriod);
          }
        }
      });
    });

    if (this.reportDaysSelect) {
      this.reportDaysSelect.addEventListener('change', () => {
        const nextDays = parseInt(this.reportDaysSelect.value, 10);
        if (Number.isFinite(nextDays)) {
          this.state.days = nextDays;
          this.state.selectedBucketKey = null;
          this.loadReportData();
        }
      });
    }

    if (this.btnPrevYear) {
      this.btnPrevYear.addEventListener('click', () => {
        this.state.year = Math.max(2000, this.state.year - 1);
        this.state.selectedBucketKey = null;
        this.loadReportData();
      });
    }

    if (this.btnNextYear) {
      this.btnNextYear.addEventListener('click', () => {
        const currentYear = new Date().getFullYear();
        if (this.state.year < currentYear) {
          this.state.year += 1;
          this.state.selectedBucketKey = null;
          this.loadReportData();
        }
      });
    }

    if (this.chkIncludeReviewed) {
      this.chkIncludeReviewed.addEventListener('change', () => {
        this.state.includeReviewed = Boolean(this.chkIncludeReviewed.checked);
        if (this.reportData) {
          this.renderChart(this.reportData);
        }
      });
    }

    this.skillFilterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextSkill = btn.getAttribute('data-card-type') || 'ALL';
        if (nextSkill !== this.state.cardType) {
          this.state.cardType = nextSkill;
          this.state.selectedBucketKey = null;
          this.syncPeriodControls();
          this.loadReportData();
        }
      });
    });

    if (this.btnToggleReportTable) {
      this.btnToggleReportTable.addEventListener('click', () => {
        this.state.tableExpanded = !this.state.tableExpanded;
        this.syncTableVisibility();
      });
    }
  }

  switchPeriod(nextPeriod) {
    this.state.period = nextPeriod;
    this.state.selectedBucketKey = null;
    this.syncPeriodControls();
    this.loadReportData();
  }

  syncPeriodControls() {
    this.tabButtons.forEach((btn) => {
      const active = btn.getAttribute('data-period') === this.state.period;
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    this.skillFilterButtons.forEach((btn) => {
      const active = btn.getAttribute('data-card-type') === this.state.cardType;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const isDay = this.state.period === 'day';
    if (this.dayWindowGroup) this.dayWindowGroup.classList.toggle('d-none', !isDay);
    if (this.yearStepperGroup) this.yearStepperGroup.classList.toggle('d-none', isDay);

    if (this.reportYearLabel) {
      this.reportYearLabel.textContent = String(this.state.year);
    }
    if (this.btnNextYear) {
      const currentYear = new Date().getFullYear();
      this.btnNextYear.disabled = this.state.year >= currentYear;
    }
    if (this.btnPrevYear) {
      const minYear = this.getMinAvailableYear();
      this.btnPrevYear.disabled = this.state.year <= minYear;
    }
  }

  getMinAvailableYear() {
    const years = this.reportData?.availableYears;
    if (Array.isArray(years) && years.length > 0) {
      return Math.min(...years.map(Number).filter(Number.isFinite), this.state.year - 1);
    }
    return Math.max(2020, new Date().getFullYear() - 5);
  }

  showState(state) {
    if (this.loadingState) this.loadingState.classList.toggle('d-none', state !== 'loading');
    if (this.authState) this.authState.classList.toggle('d-none', state !== 'auth');
    if (this.errorState) this.errorState.classList.toggle('d-none', state !== 'error');
    if (this.contentSection) this.contentSection.classList.toggle('d-none', state !== 'content');
  }

  setChartLoading(isLoading) {
    if (this.reportChartCard) {
      this.reportChartCard.classList.toggle('is-loading', isLoading);
    }
    if (this.reportChartLoadingBadge) {
      this.reportChartLoadingBadge.classList.toggle('d-none', !isLoading);
    }
    if (this.reportChartColumns) {
      this.reportChartColumns.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    }
  }

  async loadReportData(isSilent = false) {
    const requestToken = ++this.activeRequestToken;
    const preserveScroll = this.hasLoadedOnce;
    const savedScrollY = (preserveScroll && typeof window !== 'undefined') ? window.scrollY : 0;

    if (!preserveScroll && !isSilent) {
      this.showState('loading');
    } else if (!isSilent) {
      this.setChartLoading(true);
    }
    this.syncPeriodControls();

    try {
      const path = buildReportQueryPath(this.state);
      const data = await apiClient(path);
      if (requestToken !== this.activeRequestToken) return;

      this.reportData = data;
      this.hasLoadedOnce = true;
      this.renderReport(data);
      this.showState('content');

      if (preserveScroll && typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        if (Math.abs(window.scrollY - savedScrollY) > 2) {
          window.scrollTo({ top: savedScrollY, behavior: 'instant' });
        }
      }
    } catch (err) {
      if (requestToken !== this.activeRequestToken) return;
      console.error('[SrsReport] Failed to load vocabulary report:', err);
      if (!preserveScroll && !isSilent) {
        if (this.errorMessage) {
          this.errorMessage.textContent = err.message || 'Không thể tải dữ liệu báo cáo từ máy chủ.';
        }
        this.showState('error');
      } else if (!isSilent) {
        showToast({
          type: 'danger',
          title: 'Không thể cập nhật biểu đồ',
          message: err.message || 'Đã xảy ra lỗi khi tải dữ liệu mới.'
        });
      } else {
        throw err;
      }
    } finally {
      if (requestToken === this.activeRequestToken) {
        this.setChartLoading(false);
      }
    }
  }

  async handleRefresh() {
    if (!this.btnRefreshReport) return;
    this.btnRefreshReport.disabled = true;
    const originalText = this.btnRefreshReport.textContent;
    this.btnRefreshReport.textContent = 'Đang tải...';

    try {
      await this.loadReportData(true);
      showToast({
        type: 'info',
        title: 'Báo cáo ôn tập',
        message: 'Đã cập nhật số liệu học tập mới nhất.'
      });
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Lỗi làm mới',
        message: err.message || 'Không thể làm mới báo cáo ôn tập.'
      });
    } finally {
      this.btnRefreshReport.disabled = false;
      this.btnRefreshReport.textContent = originalText;
    }
  }

  renderReport(data) {
    if (!data) return;
    this.syncPeriodControls();
    this.renderSummary(data.summary);
    this.renderChart(data);
    this.renderTable(data.buckets || []);
    this.syncTableVisibility();
  }

  renderSummary(summary) {
    if (!summary) return;

    const todayNew = summary.todayNewCount ?? 0;
    const todayReviewed = summary.todayReviewedCount ?? 0;
    const monthNew = summary.monthNewCount ?? 0;
    const prevMonthNew = summary.previousMonthNewCount ?? 0;
    const quarterNew = summary.quarterNewCount ?? 0;
    const quarterReviewed = summary.quarterReviewedCount ?? 0;
    const totalLearned = summary.totalLearnedVocab ?? 0;
    const totalSystem = summary.totalSystemVocab ?? 0;

    if (this.statTodayLearned) this.statTodayLearned.textContent = String(todayReviewed);
    if (this.statTodayMeta) {
      this.statTodayMeta.textContent = `Gồm ${todayNew} từ mới lần đầu • ${todayReviewed} từ đã ôn/học`;
    }

    if (this.statMonthNew) this.statMonthNew.textContent = String(monthNew);
    if (this.statMonthMeta) {
      this.statMonthMeta.textContent = formatMonthComparison(monthNew, prevMonthNew);
    }

    if (this.statQuarterNew) this.statQuarterNew.textContent = String(quarterNew);
    if (this.statQuarterMeta) {
      const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
      this.statQuarterMeta.textContent = `Q${currentQuarter}/${new Date().getFullYear()} • ${quarterReviewed} từ đã học/ôn`;
    }

    if (this.statTotalLearned) this.statTotalLearned.textContent = String(totalLearned);
    if (this.statTotalQuotaText) {
      this.statTotalQuotaText.textContent = totalSystem > 0
        ? `${totalLearned} / ${totalSystem}`
        : `${totalLearned} từ`;
    }
    if (this.statTotalProgressBar) {
      const pct = calculateProgressPct(totalLearned, totalSystem);
      this.statTotalProgressBar.style.width = `${pct}%`;
      this.statTotalProgressBar.setAttribute('aria-valuenow', String(pct));
    }
  }

  renderChart(data) {
    const buckets = Array.isArray(data.buckets) ? data.buckets : [];
    const includeReviewed = this.state.includeReviewed;
    const isDay = data.period === 'day';
    const dailyGoal = Number(data.dailyGoal) || 0;

    if (this.legendReviewedItem) {
      this.legendReviewedItem.classList.toggle('d-none', !includeReviewed);
    }
    if (this.legendGoalItem) {
      this.legendGoalItem.classList.toggle('d-none', !isDay || dailyGoal <= 0);
    }
    if (this.legendGoalText && dailyGoal > 0) {
      this.legendGoalText.textContent = `Mục tiêu (${dailyGoal} từ/ngày)`;
    }

    // Compute scale max across visible series
    let rawMax = 0;
    buckets.forEach((b) => {
      rawMax = Math.max(rawMax, Number(b.newWordsCount) || 0);
      if (includeReviewed) {
        rawMax = Math.max(rawMax, Number(b.reviewedWordsCount) || 0);
      }
    });
    const scaleMax = computeNiceScaleMax(rawMax, isDay ? dailyGoal : 0);

    // Render Y-axis 5 ticks (top to 0)
    if (this.reportChartYAxis) {
      clearContainer(this.reportChartYAxis);
      for (let i = 4; i >= 0; i--) {
        const val = Math.round((scaleMax * i) / 4);
        this.reportChartYAxis.appendChild(createSafeElement('span', { text: String(val) }));
      }
    }

    // Dense layout handling for 30-day window
    if (this.reportChartPlot) {
      this.reportChartPlot.classList.toggle('is-dense', buckets.length > 16);
    }

    // Render daily goal reference line
    if (this.reportGoalLine) {
      if (isDay && dailyGoal > 0 && scaleMax > 0) {
        const goalPct = Math.min(100, Math.max(0, (dailyGoal / scaleMax) * 100));
        // Plot area uses padding-top: 24px and padding-bottom: 34px
        // Position relative to the inner gridline track: calc(34px + (100% - 58px) * goalRatio)
        this.reportGoalLine.style.bottom = `calc(34px + (100% - 58px) * ${(goalPct / 100).toFixed(4)})`;
        this.reportGoalLine.classList.remove('d-none');
        if (this.reportGoalTag) {
          this.reportGoalTag.textContent = `Mục tiêu: ${dailyGoal}`;
        }
      } else {
        this.reportGoalLine.classList.add('d-none');
      }
    }

    // Ensure a sensible default selected bucket (current bucket or last bucket)
    if (!this.state.selectedBucketKey || !buckets.some(b => b.key === this.state.selectedBucketKey)) {
      const currentBucket = buckets.find(b => b.current) || buckets[buckets.length - 1] || null;
      this.state.selectedBucketKey = currentBucket ? currentBucket.key : null;
    }

    if (!this.reportChartColumns) return;
    clearContainer(this.reportChartColumns);

    const showEverySecondLabel = buckets.length > 16;

    buckets.forEach((bucket, index) => {
      const newCount = Number(bucket.newWordsCount) || 0;
      const revCount = Number(bucket.reviewedWordsCount) || 0;
      const isSelected = bucket.key === this.state.selectedBucketKey;

      const colBtn = createSafeElement('button', {
        className: `srs-chart-col-btn${bucket.current ? ' is-current' : ''}${isSelected ? ' is-selected' : ''}`,
        attrs: {
          type: 'button',
          role: 'listitem',
          'data-bucket-key': bucket.key,
          'aria-pressed': isSelected ? 'true' : 'false',
          'aria-label': `${bucket.fullLabel}: ${newCount} từ mới đã học, ${revCount} từ đã ôn tập`
        }
      });

      const pair = createSafeElement('div', { className: 'srs-chart-bars-pair' });

      // Primary Bar: Newly learned words
      const newWrap = createSafeElement('div', { className: 'srs-chart-bar-wrap' });
      const newValLabel = createSafeElement('span', {
        className: 'srs-chart-bar-value',
        text: newCount > 0 ? String(newCount) : (includeReviewed ? '' : '0')
      });
      const newBar = createSafeElement('div', {
        className: `srs-chart-bar srs-chart-bar-new${newCount === 0 ? ' is-zero' : ''}`
      });
      if (newCount > 0) {
        const pct = Math.max(3, Math.round((newCount / scaleMax) * 100));
        newBar.style.height = `${pct}%`;
      } else {
        newBar.style.height = '2px';
      }
      newWrap.appendChild(newValLabel);
      newWrap.appendChild(newBar);
      pair.appendChild(newWrap);

      // Optional Secondary Bar: Distinct reviewed words
      if (includeReviewed) {
        const revWrap = createSafeElement('div', { className: 'srs-chart-bar-wrap' });
        const revValLabel = createSafeElement('span', {
          className: 'srs-chart-bar-value',
          text: revCount > 0 ? String(revCount) : ''
        });
        const revBar = createSafeElement('div', {
          className: `srs-chart-bar srs-chart-bar-reviewed${revCount === 0 ? ' is-zero' : ''}`
        });
        if (revCount > 0) {
          const pct = Math.max(3, Math.round((revCount / scaleMax) * 100));
          revBar.style.height = `${pct}%`;
        } else {
          revBar.style.height = '2px';
        }
        revWrap.appendChild(revValLabel);
        revWrap.appendChild(revBar);
        pair.appendChild(revWrap);
      }

      const showXLabel = !showEverySecondLabel || index % 2 === 0 || index === buckets.length - 1 || bucket.current;
      const xLabel = createSafeElement('span', {
        className: 'srs-chart-col-label',
        text: showXLabel ? bucket.label : ''
      });

      colBtn.appendChild(pair);
      colBtn.appendChild(xLabel);

      const selectThisBucket = () => {
        this.state.selectedBucketKey = bucket.key;
        this.updateSelectedColumnUI(buckets);
      };

      colBtn.addEventListener('click', selectThisBucket);
      colBtn.addEventListener('mouseenter', selectThisBucket);

      this.reportChartColumns.appendChild(colBtn);
    });

    this.renderSelectedDetail(buckets);
  }

  updateSelectedColumnUI(buckets) {
    if (this.reportChartColumns) {
      const cols = this.reportChartColumns.querySelectorAll('.srs-chart-col-btn');
      cols.forEach((btn) => {
        const isSel = btn.getAttribute('data-bucket-key') === this.state.selectedBucketKey;
        btn.classList.toggle('is-selected', isSel);
        btn.setAttribute('aria-pressed', isSel ? 'true' : 'false');
      });
    }
    this.renderSelectedDetail(buckets);
  }

  renderSelectedDetail(buckets) {
    if (!this.reportSelectedDetail) return;
    clearContainer(this.reportSelectedDetail);

    const active = buckets.find(b => b.key === this.state.selectedBucketKey);
    if (!active) {
      this.reportSelectedDetail.appendChild(
        createSafeElement('span', { text: 'Chưa có dữ liệu ôn tập trong khoảng thời gian này.' })
      );
      return;
    }

    const left = createSafeElement('div', {
      children: [
        createSafeElement('strong', { text: active.fullLabel }),
        createSafeElement('span', {
          className: 'ms-2 text-secondary',
          text: active.current ? '(Kỳ hiện tại)' : ''
        })
      ]
    });

    const right = createSafeElement('div', {
      className: 'd-flex flex-wrap gap-3 small',
      children: [
        createSafeElement('span', {
          className: 'fw-semibold text-success',
          text: `Từ mới học: ${active.newWordsCount ?? 0}`
        }),
        createSafeElement('span', {
          className: 'fw-semibold text-primary',
          text: `Từ đã ôn: ${active.reviewedWordsCount ?? 0}`
        }),
        createSafeElement('span', {
          className: 'text-secondary',
          text: `Lượt ôn: ${active.reviewActionsCount ?? 0}`
        })
      ]
    });

    if (this.state.cardType === 'ALL' && active.skillReviewedCounts) {
      const sc = active.skillReviewedCounts;
      const skillSummary = `Flashcard: ${sc.FLASHCARD ?? 0} • Đọc: ${sc.READING ?? 0} • Nghe: ${sc.LISTENING ?? 0} • Viết: ${sc.WRITING ?? 0}`;
      left.appendChild(createSafeElement('div', {
        className: 'small text-secondary mt-1',
        text: skillSummary
      }));
    }

    this.reportSelectedDetail.appendChild(left);
    this.reportSelectedDetail.appendChild(right);
  }

  renderTable(buckets) {
    if (!this.reportTableBody) return;
    clearContainer(this.reportTableBody);

    if (!buckets.length) {
      const tr = createSafeElement('tr', {
        children: [
          createSafeElement('td', {
            className: 'text-center text-secondary py-3',
            text: 'Chưa có dữ liệu thống kê.',
            attrs: { colspan: '4' }
          })
        ]
      });
      this.reportTableBody.appendChild(tr);
      return;
    }

    buckets.forEach((b) => {
      const tr = createSafeElement('tr', {
        className: b.current ? 'table-active fw-semibold' : '',
        children: [
          createSafeElement('th', {
            text: b.current ? `${b.fullLabel} (Hiện tại)` : b.fullLabel,
            attrs: { scope: 'row' }
          }),
          createSafeElement('td', {
            className: 'text-end',
            text: String(b.newWordsCount ?? 0)
          }),
          createSafeElement('td', {
            className: 'text-end',
            text: String(b.reviewedWordsCount ?? 0)
          }),
          createSafeElement('td', {
            className: 'text-end text-secondary',
            text: String(b.reviewActionsCount ?? 0)
          })
        ]
      });
      this.reportTableBody.appendChild(tr);
    });
  }

  syncTableVisibility() {
    if (this.reportTableContainer) {
      this.reportTableContainer.classList.toggle('d-none', !this.state.tableExpanded);
    }
    if (this.btnToggleReportTable) {
      this.btnToggleReportTable.setAttribute('aria-expanded', this.state.tableExpanded ? 'true' : 'false');
      this.btnToggleReportTable.textContent = this.state.tableExpanded
        ? 'Ẩn bảng số liệu chi tiết'
        : 'Xem bảng số liệu chi tiết';
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const controller = new SrsReportController();
    controller.init();
  });
}
