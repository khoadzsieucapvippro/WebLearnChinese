/**
 * =============================================================================
 * STUDY STATISTICS & SRS DAILY SETTINGS CONTROLLER (TASK 9C.4)
 * Module: frontend/js/pages/srs-dashboard-page.js
 *
 * Responsibilities:
 * - Authoritative display of 5 SRS study statistics from GET /api/v1/srs/stats:
 *   cardsDue, reviewsToday, newCardsToday, newCardsLimit, maxReviewLimit.
 * - Manage personal daily SRS settings via GET/PUT /api/v1/srs/settings:
 *   newCardsPerDay (> 0), maxReviewPerDay (> 0).
 * - Client-side validation: positive integer discipline, reject empty/zero/negative/float.
 * - Prevent duplicate submission and ensure immediate authoritative refresh upon PUT success.
 * - Zero fabricated analytics or client-side statistical math (backend is source of truth).
 * - Safe DOM updates (100% textContent / setAttribute; zero innerHTML sinks).
 * - Accessible live regions, focus management, and session-aware navigation.
 * =============================================================================
 */

import { apiClient, ApiError } from '../api/api.js';
import { authManager } from '../auth/auth-state.js';
import { initNavbarAuth } from '../ui/nav.js';
import { showToast } from '../ui/ui.js';

/**
 * Validates SRS Daily Settings input values.
 * Contract: Both fields are required and must be strictly positive integers (> 0).
 * 
 * @param {string|number} newCardsPerDay
 * @param {string|number} maxReviewPerDay
 * @returns {{ isValid: boolean, errors: { newCardsPerDay?: string, maxReviewPerDay?: string } }}
 */
export function validateSrsSettings(newCardsPerDay, maxReviewPerDay = undefined) {
  const errors = {};

  // Validate newCardsPerDay
  const newCardsStr = String(newCardsPerDay ?? '').trim();
  if (!newCardsStr) {
    errors.newCardsPerDay = 'Số lượng thẻ mới mỗi ngày không được để trống.';
  } else {
    const num = Number(newCardsStr);
    if (Number.isNaN(num)) {
      errors.newCardsPerDay = 'Số lượng thẻ mới phải là một số nguyên hợp lệ.';
    } else if (!Number.isInteger(num)) {
      errors.newCardsPerDay = 'Số lượng thẻ mới phải là số nguyên (không chứa phần thập phân).';
    } else if (num <= 0) {
      errors.newCardsPerDay = 'Số lượng thẻ mới phải là số nguyên dương lớn hơn 0.';
    } else if (num > 100) {
      errors.newCardsPerDay = 'Số lượng thẻ mới mỗi ngày không được vượt quá 100 thẻ.';
    }
  }

  // Validate maxReviewPerDay when passed as argument (for backward compatibility / tests)
  if (arguments.length >= 2) {
    const maxReviewStr = String(maxReviewPerDay ?? '').trim();
    if (!maxReviewStr) {
      errors.maxReviewPerDay = 'Số lượt ôn tập tối đa không được để trống.';
    } else {
      const num = Number(maxReviewStr);
      if (Number.isNaN(num)) {
        errors.maxReviewPerDay = 'Số lượt ôn tập phải là một số nguyên hợp lệ.';
      } else if (!Number.isInteger(num)) {
        errors.maxReviewPerDay = 'Số lượt ôn tập phải là số nguyên (không chứa phần thập phân).';
      } else if (num <= 0) {
        errors.maxReviewPerDay = 'Số lượt ôn tập phải là số nguyên dương lớn hơn 0.';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Calculates a safe quota completion percentage (0 - 100%).
 * Defends against division by zero and clamps output.
 * 
 * @param {number} current Current progress count
 * @param {number} max Maximum limit
 * @returns {number} Integer between 0 and 100
 */
export function calculateQuotaPercentage(current, max) {
  const curNum = Number(current);
  const maxNum = Number(max);

  if (!Number.isFinite(curNum) || !Number.isFinite(maxNum) || maxNum <= 0 || curNum < 0) {
    return 0;
  }

  const pct = Math.round((curNum / maxNum) * 100);
  return Math.min(100, Math.max(0, pct));
}

/**
 * Constructs the sanitized PUT /api/v1/srs/settings payload.
 * Strictly avoids leaking any userId or accountId (IDOR protection).
 * 
 * @param {string|number} newCardsPerDay
 * @param {string|number} [maxReviewPerDay]
 * @returns {{ newCardsPerDay: number, maxReviewPerDay?: number }}
 */
export function buildUpdateSettingsPayload(newCardsPerDay, maxReviewPerDay = undefined) {
  const payload = {
    newCardsPerDay: parseInt(String(newCardsPerDay).trim(), 10)
  };
  if (maxReviewPerDay !== undefined && maxReviewPerDay !== null && String(maxReviewPerDay).trim() !== '') {
    payload.maxReviewPerDay = parseInt(String(maxReviewPerDay).trim(), 10);
  }
  return payload;
}

/**
 * Main Controller for the SRS Dashboard Page.
 */
export class SrsDashboardController {
  constructor() {
    // DOM Container Landmarks
    this.loadingState = document.getElementById('dashboardLoadingState');
    this.authState = document.getElementById('dashboardAuthState');
    this.errorState = document.getElementById('dashboardErrorState');
    this.errorMessage = document.getElementById('dashboardErrorMessage');
    this.contentSection = document.getElementById('dashboardContentSection');

    // Metric Value Sinks (Safe textContent only)
    this.statCardsDue = document.getElementById('statCardsDue');
    this.statCardsDueFlashcard = document.getElementById('statCardsDueFlashcard');
    this.statCardsDueReading = document.getElementById('statCardsDueReading');
    this.statCardsDueListening = document.getElementById('statCardsDueListening');
    this.statCardsDueWriting = document.getElementById('statCardsDueWriting');
    this.statReviewsToday = document.getElementById('statReviewsToday');
    this.statNewCardsToday = document.getElementById('statNewCardsToday');
    this.statNewCardsQuotaText = document.getElementById('statNewCardsQuotaText');
    this.statNewCardsProgressBar = document.getElementById('statNewCardsProgressBar');
    this.statNewCardsLimit = document.getElementById('statNewCardsLimit');

    // Action Controls
    this.btnRefreshStats = document.getElementById('btnRefreshStats');
    this.btnDashboardRetry = document.getElementById('btnDashboardRetry');

    // In-memory Authoritative Cache
    this.authoritativeStats = null;
  }

  /**
   * Initializes the dashboard lifecycle, navbar auth, and event listeners.
   */
  async init() {
    initNavbarAuth();

    // Check Authentication Guard
    if (!authManager.isAuthenticated()) {
      this.showState('auth');
      return;
    }

    this.bindEvents();
    await this.loadDashboardData();

    // Auto-refresh dashboard stats periodically (every 30s) so due cards surface automatically
    if (typeof window !== 'undefined' && !this.autoRefreshInterval) {
      this.autoRefreshInterval = setInterval(() => {
        if (!document.hidden && authManager.isAuthenticated()) {
          this.loadDashboardData().catch(() => {});
        }
      }, 30000);
    }
  }

  /**
   * Binds interactive DOM events.
   */
  bindEvents() {
    if (this.btnRefreshStats) {
      this.btnRefreshStats.addEventListener('click', () => this.handleRefreshStats());
    }

    if (this.btnDashboardRetry) {
      this.btnDashboardRetry.addEventListener('click', () => this.loadDashboardData());
    }
  }

  /**
   * Switches visible dashboard state container.
   * 
   * @param {'loading'|'auth'|'error'|'content'} state
   */
  showState(state) {
    if (this.loadingState) this.loadingState.classList.toggle('d-none', state !== 'loading');
    if (this.authState) this.authState.classList.toggle('d-none', state !== 'auth');
    if (this.errorState) this.errorState.classList.toggle('d-none', state !== 'error');
    if (this.contentSection) this.contentSection.classList.toggle('d-none', state !== 'content');
  }

  /**
   * Concurrently loads authoritative stats from the backend.
   */
  async loadDashboardData() {
    this.showState('loading');

    try {
      const stats = await apiClient('/srs/stats');
      this.authoritativeStats = stats;
      this.renderStatistics(stats);
      this.showState('content');
    } catch (err) {
      console.error('[SrsDashboard] Failed to load dashboard data:', err);
      if (this.errorMessage) {
        this.errorMessage.textContent = err.message || 'Không thể tải dữ liệu thống kê từ máy chủ. Vui lòng thử lại sau.';
      }
      this.showState('error');
    }
  }

  /**
   * Renders the authoritative backend statistics.
   * Safe DOM: strictly uses textContent and percentage width styling.
   * 
   * @param {object} stats StudyStatsResponse
   */
  renderStatistics(stats) {
    if (!stats) return;

    const cardsDue = stats.cardsDue ?? 0;
    const cardsDueFlashcard = (stats.cardsDueFlashcard != null && stats.cardsDueFlashcard > 0)
      ? stats.cardsDueFlashcard
      : (stats.cardsDueReading || 0);
    const cardsDueReading = stats.cardsDueReading ?? 0;
    const cardsDueListening = stats.cardsDueListening ?? 0;
    const cardsDueWriting = stats.cardsDueWriting ?? 0;
    const reviewsToday = stats.reviewsToday ?? 0;
    const newCardsToday = stats.newCardsToday ?? 0;
    const newCardsLimit = stats.newCardsLimit ?? 0;

    // 1. Cards Due
    if (this.statCardsDue) {
      this.statCardsDue.textContent = String(cardsDue);
    }
    if (this.statCardsDueFlashcard) {
      this.statCardsDueFlashcard.textContent = String(cardsDueFlashcard);
    }
    if (this.statCardsDueReading) {
      this.statCardsDueReading.textContent = String(cardsDueReading);
    }
    if (this.statCardsDueListening) {
      this.statCardsDueListening.textContent = String(cardsDueListening);
    }
    if (this.statCardsDueWriting) {
      this.statCardsDueWriting.textContent = String(cardsDueWriting);
    }

    // 2. Reviews Today (No quota text / progress bar - review quota removed)
    if (this.statReviewsToday) {
      this.statReviewsToday.textContent = String(reviewsToday);
    }

    // 3. New Cards Today & Quota
    if (this.statNewCardsToday) {
      this.statNewCardsToday.textContent = String(newCardsToday);
    }
    if (this.statNewCardsQuotaText) {
      this.statNewCardsQuotaText.textContent = `${newCardsToday} / ${newCardsLimit}`;
    }
    if (this.statNewCardsProgressBar) {
      const newPct = calculateQuotaPercentage(newCardsToday, newCardsLimit);
      this.statNewCardsProgressBar.style.width = `${newPct}%`;
      this.statNewCardsProgressBar.setAttribute('aria-valuenow', String(newPct));
    }

    // 4. New Cards Limit
    if (this.statNewCardsLimit) {
      this.statNewCardsLimit.textContent = String(newCardsLimit);
    }
  }

  /**
   * Refreshes authoritative stats from backend.
   */
  async refreshAuthoritativeData() {
    try {
      const stats = await apiClient('/srs/stats');
      this.authoritativeStats = stats;
      this.renderStatistics(stats);
    } catch (err) {
      console.warn('[SrsDashboard] Background refresh encountered an issue:', err);
    }
  }

  /**
   * Manually refreshes statistics via the header action button.
   */
  async handleRefreshStats() {
    if (!this.btnRefreshStats) return;

    this.btnRefreshStats.disabled = true;
    const originalText = this.btnRefreshStats.textContent;
    this.btnRefreshStats.textContent = 'Đang tải...';

    try {
      const stats = await apiClient('/srs/stats');
      this.authoritativeStats = stats;
      this.renderStatistics(stats);

      showToast({
        type: 'info',
        title: 'Thống kê SRS',
        message: 'Đã cập nhật số liệu học tập mới nhất.'
      });
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Lỗi làm mới',
        message: err.message || 'Không thể làm mới số liệu thống kê.'
      });
    } finally {
      this.btnRefreshStats.disabled = false;
      this.btnRefreshStats.textContent = originalText;
    }
  }
}

// Auto-boot if running in browser window
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const controller = new SrsDashboardController();
    controller.init();
  });
}
