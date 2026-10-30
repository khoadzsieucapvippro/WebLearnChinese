/**
 * =============================================================================
 * ADMIN SYSTEM-WIDE LESSON OVERSIGHT & SUPERVISORY ARBITER CONTROLLER (TASK 7.2)
 * Module: frontend/js/pages/admin-lessons-page.js
 *
 * Responsibilities:
 * - Integration with authoritative backend endpoints:
 *   * GET /api/v1/admin/lessons (Paginated system-wide lessons with status filter)
 *   * GET /api/v1/admin/lessons/{id} or fallback detail
 *   * POST /api/v1/admin/lessons/{id}/revoke (Emergency Take-Down of harmful lessons)
 *   * POST /api/v1/admin/lessons/{id}/approve (Supervisory Arbiter Approval for disputes)
 * - Self-Review Prohibition (Invariant 6):
 *   Admin CANNOT approve or revoke lessons they personally created.
 * - Clean UI Layout:
 *   * Zero breadcrumbs, zero tab repetition, zero page size dropdowns, zero summary labels.
 *   * Standardized First/Last pagination (<< < 1 2 3 > >>) aligned to the right.
 *   * Responsive table container (.table-responsive-clean).
 * - Safe DOM construction (zero unsafe innerHTML) & native HTML5 <dialog> modals.
 * =============================================================================
 */

import { apiClient, ApiError } from '../api/api.js';
import { authManager } from '../auth/auth-state.js';
import { initNavbarAuth } from '../ui/nav.js';
import { createSafeElement, clearContainer, sanitizeResourceUrl } from '../ui/security.js';
import { setComponentState, showToast, createSpeechButton, playPronunciation } from '../ui/ui.js';

/* -----------------------------------------------------------------------------
 * 1. PURE LOGIC & UTILITY HELPERS (Exported for Unit Testing)
 * ----------------------------------------------------------------------------- */

/**
 * Valid lifecycle statuses supported by backend.
 */
export const VALID_LESSON_STATUSES = Object.freeze(['Draft', 'Pending', 'Approved', 'Rejected']);

/**
 * Verifies whether the current authenticated session has administrative access.
 * Strict Invariant: JSON role representation is canonical 'Admin' (rejects 'ROLE_' prefixes).
 *
 * @param {object} [authManagerInstance=authManager]
 * @returns {boolean}
 */
export function hasAdminAccess(authManagerInstance = authManager) {
  if (!authManagerInstance || typeof authManagerInstance.hasRole !== 'function') {
    return false;
  }
  return authManagerInstance.hasRole('Admin');
}

/**
 * Normalizes a status filter string to a valid backend lifecycle status or empty string.
 *
 * @param {string|null|undefined} status
 * @returns {string} canonical status ('Draft', 'Pending', 'Approved', 'Rejected') or ''
 */
export function normalizeStatusFilter(status) {
  if (!status || typeof status !== 'string') return '';
  const trimmed = status.trim();
  if (trimmed.toLowerCase() === 'all' || trimmed === '') return '';
  const match = VALID_LESSON_STATUSES.find(s => s.toLowerCase() === trimmed.toLowerCase());
  return match || '';
}

/**
 * Maps a lesson status string to its Vietnamese human-friendly label.
 *
 * @param {string|null|undefined} status
 * @returns {string}
 */
export function mapStatusLabel(status) {
  if (!status || typeof status !== 'string') return 'Không xác định';
  switch (status.trim().toLowerCase()) {
    case 'draft':
      return 'Bản nháp';
    case 'pending':
      return 'Chờ duyệt';
    case 'approved':
      return 'Đã duyệt';
    case 'rejected':
      return 'Bị từ chối';
    default:
      return status;
  }
}

/**
 * Maps a lesson status to its Bootstrap badge presentation attributes.
 *
 * @param {string|null|undefined} status
 * @returns {{ className: string, label: string }}
 */
export function mapStatusBadge(status) {
  const label = mapStatusLabel(status);
  if (!status || typeof status !== 'string') {
    return { className: 'badge bg-light text-dark border', label };
  }
  switch (status.trim().toLowerCase()) {
    case 'draft':
      return { className: 'badge bg-secondary-subtle text-secondary border', label };
    case 'pending':
      return { className: 'badge bg-warning-subtle text-dark border border-warning', label };
    case 'approved':
      return { className: 'badge bg-success-subtle text-success border border-success', label };
    case 'rejected':
      return { className: 'badge bg-danger-subtle text-danger border border-danger', label };
    default:
      return { className: 'badge bg-light text-dark border', label };
  }
}

/**
 * Builds query parameters for GET /api/v1/admin/lessons.
 * Omits 'status' if empty or 'All'.
 *
 * @param {object|string} [statusOrOptions='']
 * @param {number} [pageArg=0]
 * @param {number} [sizeArg=20]
 * @returns {Record<string, string|number>}
 */
export function buildAdminLessonsParams(statusOrOptions = '', pageArg = 0, sizeArg = 20) {
  let status = '';
  let page = 0;
  let size = 20;

  if (typeof statusOrOptions === 'object' && statusOrOptions !== null) {
    status = normalizeStatusFilter(statusOrOptions.status);
    page = typeof statusOrOptions.page === 'number' && statusOrOptions.page >= 0 ? statusOrOptions.page : 0;
    size = typeof statusOrOptions.size === 'number' && statusOrOptions.size > 0 ? statusOrOptions.size : 20;
  } else {
    status = normalizeStatusFilter(statusOrOptions);
    page = typeof pageArg === 'number' && pageArg >= 0 ? pageArg : 0;
    size = typeof sizeArg === 'number' && sizeArg > 0 ? sizeArg : 20;
  }

  const params = { page, size };
  if (status) {
    params.status = status;
  }
  return params;
}

/**
 * Determines strategy for fetching lesson detail based on status.
 *
 * @param {string|null|undefined} status
 * @param {string|number|null} [lessonId=null]
 * @returns {{ strategy: 'APPROVED' | 'PENDING' | 'UNSUPPORTED', canFetchDetail: boolean, endpoint: string | null, limitationNotice: string | null }}
 */
export function determineDetailStrategy(status, lessonId = null) {
  const norm = normalizeStatusFilter(status);
  if (norm === 'Approved') {
    return {
      strategy: 'APPROVED',
      canFetchDetail: true,
      endpoint: lessonId ? `/lessons/${lessonId}` : '/lessons/{id}',
      limitationNotice: null
    };
  }
  if (norm === 'Pending') {
    return {
      strategy: 'PENDING',
      canFetchDetail: true,
      endpoint: lessonId ? `/moderator/lessons/${lessonId}` : '/moderator/lessons/{id}',
      limitationNotice: null
    };
  }
  return {
    strategy: 'UNSUPPORTED',
    canFetchDetail: false,
    endpoint: null,
    limitationNotice: `Nội dung chi tiết của bài học ở trạng thái "${mapStatusLabel(norm) || 'này'}" chưa có endpoint quản trị trong backend hiện tại.`
  };
}

/**
 * Formats an ISO date/timestamp string into a human-friendly Vietnamese format.
 *
 * @param {string|null|undefined} isoString
 * @returns {string}
 */
export function formatLessonDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
}

/**
 * Calculates human-readable pagination summary info for unit testing.
 *
 * @param {number} page
 * @param {number} size
 * @param {number} totalElements
 * @returns {{ start: number, end: number, total: number, totalPages: number, currentPage: number, hasPrevious: boolean, hasNext: boolean }}
 */
export function calculatePaginationSummary(page, size, totalElements) {
  const safeTotal = Math.max(0, typeof totalElements === 'number' ? totalElements : 0);
  const safeSize = Math.max(1, typeof size === 'number' ? size : 20);
  const totalPages = safeTotal === 0 ? 1 : Math.ceil(safeTotal / safeSize);
  const safePage = Math.max(0, Math.min(typeof page === 'number' ? page : 0, totalPages - 1));

  if (safeTotal === 0) {
    return {
      start: 0,
      end: 0,
      total: 0,
      totalPages: 1,
      currentPage: 0,
      hasPrevious: false,
      hasNext: false
    };
  }

  const start = safePage * safeSize + 1;
  const end = Math.min((safePage + 1) * safeSize, safeTotal);

  return {
    start,
    end,
    total: safeTotal,
    totalPages,
    currentPage: safePage,
    hasPrevious: safePage > 0,
    hasNext: safePage < totalPages - 1
  };
}

/**
 * Polymorphic pagination helper for First/Last pagination (<< < 1 2 3 > >>).
 */
export function calculatePagination(currentPageOrPage, totalPagesOrSize, maxVisibleOrTotalElements, maybeTotalPages, maybeMaxButtons = 5) {
  if (arguments.length >= 4) {
    const page = currentPageOrPage;
    const size = totalPagesOrSize;
    const totalElements = maxVisibleOrTotalElements;
    const totalPages = maybeTotalPages;
    const maxButtons = maybeMaxButtons;

    const safeTotalPages = Math.max(0, totalPages || 0);
    const safePage = Math.max(0, Math.min(page || 0, Math.max(0, safeTotalPages - 1)));
    const hasPrev = safePage > 0;
    const hasNext = safePage < safeTotalPages - 1;
    const startRecord = totalElements === 0 ? 0 : safePage * size + 1;
    const endRecord = Math.min((safePage + 1) * size, totalElements);

    let startPage = 0;
    let endPage = -1;
    if (safeTotalPages > 0) {
      startPage = Math.max(0, safePage - Math.floor(maxButtons / 2));
      endPage = Math.min(safeTotalPages - 1, startPage + maxButtons - 1);
      if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(0, endPage - maxButtons + 1);
      }
    }

    return {
      currentPage: safePage,
      totalPages: safeTotalPages,
      hasPrev,
      hasNext,
      startRecord,
      endRecord,
      startPage,
      endPage
    };
  }

  const currentPage = currentPageOrPage;
  const totalPages = totalPagesOrSize;
  const maxVisible = maxVisibleOrTotalElements !== undefined ? maxVisibleOrTotalElements : 5;

  if (totalPages <= 0) return [];
  if (totalPages <= maxVisible) {
    const pages = [];
    for (let i = 0; i < totalPages; i++) pages.push(i);
    return pages;
  }
  let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages - 1, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(0, end - maxVisible + 1);
  }
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

/**
 * Extracts totalElements safely from multi-status API probe responses.
 *
 * @param {object|null|undefined} responses
 * @returns {{ total: number|null, draft: number|null, pending: number|null, approved: number|null, rejected: number|null }}
 */
export function extractStatusCounts(responses) {
  if (!responses || typeof responses !== 'object') {
    return { total: null, draft: null, pending: null, approved: null, rejected: null };
  }

  const extract = (res) => {
    if (res && typeof res === 'object') {
      if (typeof res.totalElements === 'number') return res.totalElements;
      if (res.data && typeof res.data.totalElements === 'number') return res.data.totalElements;
    }
    return null;
  };

  return {
    total: extract(responses.total),
    draft: extract(responses.draft),
    pending: extract(responses.pending),
    approved: extract(responses.approved),
    rejected: extract(responses.rejected)
  };
}

/**
 * Parses PageResponse payload safely.
 *
 * @param {object|null|undefined} data
 * @returns {{ items: Array<object>, page: number, size: number, totalElements: number, totalPages: number, first: boolean, last: boolean }}
 */
export function parsePageResponse(data) {
  if (!data || typeof data !== 'object') {
    return {
      items: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true
    };
  }

  const items = Array.isArray(data.items)
    ? data.items
    : (Array.isArray(data.content) ? data.content : []);

  const totalElements = typeof data.totalElements === 'number'
    ? data.totalElements
    : items.length;

  const size = typeof data.size === 'number' && data.size > 0 ? data.size : 20;
  const totalPages = typeof data.totalPages === 'number'
    ? data.totalPages
    : (totalElements === 0 ? 0 : Math.ceil(totalElements / size));

  const page = typeof data.page === 'number'
    ? data.page
    : (typeof data.number === 'number' ? data.number : 0);

  const first = typeof data.first === 'boolean' ? data.first : page === 0;
  const last = typeof data.last === 'boolean' ? data.last : page >= Math.max(0, totalPages - 1);

  return {
    items,
    page,
    size,
    totalElements,
    totalPages,
    first,
    last
  };
}

/* -----------------------------------------------------------------------------
 * 2. ADMIN LESSONS PAGE CONTROLLER CLASS
 * ----------------------------------------------------------------------------- */

export class AdminLessonsPageController {
  constructor() {
    this.currentStatusFilter = ''; // '' represents 'All'
    this.currentPage = 0;
    this.pageSize = 20;
    this.totalElements = 0;
    this.totalPages = 0;
    this.currentLessons = [];
    this.targetLesson = null; // Target lesson for modal operations
    this.lastFocusedElement = null;

    this.elements = {};
  }

  /**
   * Initializes the controller, caches DOM nodes, verifies role, and loads data.
   */
  async init() {
    initNavbarAuth();

    // Cache elements
    this.cacheElements();

    // Verify Admin authorization
    if (!hasAdminAccess()) {
      if (this.elements.authGuard) this.elements.authGuard.classList.remove('d-none');
      if (this.elements.mainContent) this.elements.mainContent.classList.add('d-none');
      return;
    }

    if (this.elements.authGuard) this.elements.authGuard.classList.add('d-none');
    if (this.elements.mainContent) this.elements.mainContent.classList.remove('d-none');

    // Attach event listeners
    this.attachEventListeners();

    // Initial load
    await Promise.all([
      this.loadLessons(),
      this.refreshStatusCounts()
    ]);
  }

  /**
   * Caches all required interactive DOM elements.
   */
  cacheElements() {
    this.elements = {
      authGuard: document.getElementById('adminAuthGuardContainer'),
      mainContent: document.getElementById('adminLessonsMainContent'),

      // KPI Elements
      btnRefreshKpi: document.getElementById('btnRefreshKpi'),
      refreshKpiSpinner: document.getElementById('refreshKpiSpinner'),
      kpiCountTotal: document.getElementById('kpiCountTotal'),
      kpiCountDraft: document.getElementById('kpiCountDraft'),
      kpiCountPending: document.getElementById('kpiCountPending'),
      kpiCountApproved: document.getElementById('kpiCountApproved'),
      kpiCountRejected: document.getElementById('kpiCountRejected'),

      // Filter Buttons
      filterButtons: [
        document.getElementById('filterStatusAll'),
        document.getElementById('filterStatusDraft'),
        document.getElementById('filterStatusPending'),
        document.getElementById('filterStatusApproved'),
        document.getElementById('filterStatusRejected')
      ].filter(Boolean),

      resultCountBadge: document.getElementById('lessonResultCount'),
      stateContainer: document.getElementById('lessonStateContainer'),
      tableCard: document.getElementById('lessonTableCard'),
      tableBody: document.getElementById('lessonTableBody'),

      // Standard First/Last Pagination Controls
      paginationNav: document.getElementById('lessonPaginationNav'),
      paginationList: document.getElementById('lessonPaginationList'),

      // Legacy pagination fallback containers
      legacyPaginationSummary: document.getElementById('paginationSummary'),
      legacyPaginationControls: document.getElementById('paginationControls'),

      // Detail Modal
      detailModal: document.getElementById('lessonDetailModal'),
      detailModalCloseBtn: document.getElementById('modalDetailCloseBtn'),
      detailModalCancelBtn: document.getElementById('btnCancelDetailModal'),
      detailLessonTitle: document.getElementById('detailLessonTitle'),
      detailLessonStatusBadge: document.getElementById('detailLessonStatusBadge'),
      detailLessonId: document.getElementById('detailLessonId'),
      detailLessonTimestamp: document.getElementById('detailLessonTimestamp'),
      detailContractLimitationAlert: document.getElementById('detailContractLimitationAlert'),
      detailContractLimitationMessage: document.getElementById('detailContractLimitationMessage'),
      detailRejectionAlert: document.getElementById('detailRejectionAlert'),
      detailRejectionMessage: document.getElementById('detailRejectionMessage'),
      detailVocabLoadingPrompt: document.getElementById('detailVocabLoadingPrompt'),
      detailErrorAlert: document.getElementById('detailErrorAlert'),
      detailErrorMessage: document.getElementById('detailErrorMessage'),
      detailVocabSection: document.getElementById('detailVocabSection'),
      detailVocabCount: document.getElementById('detailVocabCount'),
      detailVocabEmptyPrompt: document.getElementById('detailVocabEmptyPrompt'),
      detailVocabList: document.getElementById('detailVocabList'),

      // Revoke Modal (TASK-7.2)
      revokeModal: document.getElementById('revokeLessonModal'),
      btnCancelRevoke: document.getElementById('btnCancelRevoke'),
      btnCancelRevokeClose: document.getElementById('btnCancelRevokeClose'),
      btnConfirmRevoke: document.getElementById('btnConfirmRevoke'),
      revokeLessonTitleText: document.getElementById('revokeLessonTitleText'),
      revokeReasonInput: document.getElementById('revokeReasonInput'),
      revokeModalError: document.getElementById('revokeModalError'),
      revokeSpinner: document.getElementById('revokeSpinner'),

      // Arbiter Approve Modal (TASK-7.2)
      arbiterModal: document.getElementById('arbiterApproveModal'),
      btnCancelArbiter: document.getElementById('btnCancelArbiter'),
      btnCancelArbiterClose: document.getElementById('btnCancelArbiterClose'),
      btnConfirmArbiter: document.getElementById('btnConfirmArbiter'),
      arbiterLessonTitleText: document.getElementById('arbiterLessonTitleText'),
      arbiterNoteInput: document.getElementById('arbiterNoteInput'),
      arbiterModalError: document.getElementById('arbiterModalError'),
      arbiterSpinner: document.getElementById('arbiterSpinner')
    };
  }

  /**
   * Attaches event listeners to buttons and modals.
   */
  attachEventListeners() {
    // KPI Refresh
    if (this.elements.btnRefreshKpi) {
      this.elements.btnRefreshKpi.addEventListener('click', () => this.refreshStatusCounts());
    }

    // Filter Buttons
    for (const btn of this.elements.filterButtons) {
      btn.addEventListener('click', (e) => {
        const targetStatus = e.currentTarget.getAttribute('data-status') || '';
        this.setStatusFilter(targetStatus);
      });
    }

    // KPI Cards click to filter
    const statusContainer = document.getElementById('statusCountsContainer');
    if (statusContainer) {
      statusContainer.addEventListener('click', (e) => {
        const card = e.target.closest('[data-status]');
        if (card) {
          const status = card.getAttribute('data-status') || '';
          this.setStatusFilter(status);
        }
      });
    }

    // Detail Modal Close
    if (this.elements.detailModalCloseBtn) {
      this.elements.detailModalCloseBtn.addEventListener('click', () => this.closeModal(this.elements.detailModal));
    }
    if (this.elements.detailModalCancelBtn) {
      this.elements.detailModalCancelBtn.addEventListener('click', () => this.closeModal(this.elements.detailModal));
    }

    // Revoke Modal Cancel & Confirm
    if (this.elements.btnCancelRevoke) {
      this.elements.btnCancelRevoke.addEventListener('click', () => this.closeModal(this.elements.revokeModal));
    }
    if (this.elements.btnCancelRevokeClose) {
      this.elements.btnCancelRevokeClose.addEventListener('click', () => this.closeModal(this.elements.revokeModal));
    }
    if (this.elements.btnConfirmRevoke) {
      this.elements.btnConfirmRevoke.addEventListener('click', () => this.handleConfirmRevoke());
    }

    // Arbiter Modal Cancel & Confirm
    if (this.elements.btnCancelArbiter) {
      this.elements.btnCancelArbiter.addEventListener('click', () => this.closeModal(this.elements.arbiterModal));
    }
    if (this.elements.btnCancelArbiterClose) {
      this.elements.btnCancelArbiterClose.addEventListener('click', () => this.closeModal(this.elements.arbiterModal));
    }
    if (this.elements.btnConfirmArbiter) {
      this.elements.btnConfirmArbiter.addEventListener('click', () => this.handleConfirmArbiter());
    }

    // Modal keyboard escape handling (ESC key)
    if (this.elements.detailModal) {
      this.elements.detailModal.addEventListener('cancel', (e) => {
        e.preventDefault();
        this.closeModal(this.elements.detailModal);
      });
    }
    if (this.elements.revokeModal) {
      this.elements.revokeModal.addEventListener('cancel', (e) => {
        e.preventDefault();
        this.closeModal(this.elements.revokeModal);
      });
    }
    if (this.elements.arbiterModal) {
      this.elements.arbiterModal.addEventListener('cancel', (e) => {
        e.preventDefault();
        this.closeModal(this.elements.arbiterModal);
      });
    }
  }

  /**
   * Sets current lifecycle status filter, resets page, and updates UI.
   *
   * @param {string} status
   */
  setStatusFilter(status) {
    this.currentStatusFilter = normalizeStatusFilter(status);
    this.currentPage = 0;

    for (const btn of this.elements.filterButtons) {
      const btnStatus = btn.getAttribute('data-status') || '';
      if (btnStatus === this.currentStatusFilter) {
        btn.classList.remove('btn-outline-secondary');
        btn.classList.add('btn-chinese-primary', 'active');
      } else {
        btn.classList.remove('btn-chinese-primary', 'active');
        btn.classList.add('btn-outline-secondary');
      }
    }

    this.loadLessons();
  }

  /**
   * Checks if current authenticated admin is the creator of the lesson (Self-Review Prohibition).
   *
   * @param {object} lesson
   * @returns {boolean}
   */
  isSelfReview(lesson) {
    if (!lesson) return false;
    const user = authManager.getUser();
    if (!user) return false;

    const currentId = user.accountId;
    const currentEmail = (user.emailOrPhone || user.email || '').trim().toLowerCase();

    if (lesson.creatorId && currentId && lesson.creatorId === currentId) {
      return true;
    }
    if (lesson.creatorEmail && currentEmail && lesson.creatorEmail.trim().toLowerCase() === currentEmail) {
      return true;
    }
    return false;
  }

  /**
   * Loads lessons for current status filter and pagination page.
   */
  async loadLessons() {
    setComponentState(this.elements.stateContainer, 'LOADING');
    if (this.elements.tableCard) this.elements.tableCard.classList.add('d-none');
    if (this.elements.paginationNav) this.elements.paginationNav.classList.add('d-none');

    const params = buildAdminLessonsParams({
      status: this.currentStatusFilter,
      page: this.currentPage,
      size: this.pageSize
    });

    try {
      const response = await apiClient('/admin/lessons', { params });
      const rawData = response.data || response;
      const parsed = parsePageResponse(rawData);

      this.currentLessons = parsed.items;
      this.currentPage = parsed.page;
      this.pageSize = parsed.size;
      this.totalElements = parsed.totalElements;
      this.totalPages = parsed.totalPages;

      this.updateResultBadge();

      if (this.currentLessons.length === 0) {
        setComponentState(this.elements.stateContainer, 'EMPTY', {
          title: 'Không có bài học nào',
          message: this.currentStatusFilter
            ? `Chưa có bài học nào ở trạng thái "${mapStatusLabel(this.currentStatusFilter)}".`
            : 'Hệ thống chưa ghi nhận bất kỳ bài học nào.'
        });
        return;
      }

      setComponentState(this.elements.stateContainer, 'READY');
      if (this.elements.tableCard) this.elements.tableCard.classList.remove('d-none');

      this.renderTableRows();
      this.renderPagination();

    } catch (err) {
      setComponentState(this.elements.stateContainer, 'ERROR', {
        title: 'Lỗi tải danh sách bài học',
        message: err?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
        onRetry: () => this.loadLessons()
      });
    }
  }

  /**
   * Updates result count status badge.
   */
  updateResultBadge() {
    if (!this.elements.resultCountBadge) return;
    if (this.totalElements === 0) {
      this.elements.resultCountBadge.textContent = '0 bài học';
      this.elements.resultCountBadge.className = 'badge-status badge-status-draft text-nowrap';
    } else {
      this.elements.resultCountBadge.textContent = `${this.totalElements.toLocaleString('vi-VN')} bài học`;
      this.elements.resultCountBadge.className = 'badge-status badge-status-published text-nowrap';
    }
  }

  /**
   * Renders semantic table rows using safe DOM elements.
   */
  renderTableRows() {
    if (!this.elements.tableBody) return;
    clearContainer(this.elements.tableBody);

    for (const lesson of this.currentLessons) {
      const tr = createSafeElement('tr', {
        attrs: { id: `lessonRow-${lesson.lessonId}` }
      });

      // 1. ID Column
      const tdId = createSafeElement('td', {
        className: 'text-center text-secondary small ps-3',
        attrs: { 'data-label': 'ID' }
      });
      tdId.appendChild(createSafeElement('code', { text: `#${lesson.lessonId}` }));
      tr.appendChild(tdId);

      // 2. Title Column
      const tdTitle = createSafeElement('td', {
        className: 'fw-semibold text-dark',
        attrs: { 'data-label': 'Tên bài học' }
      });
      tdTitle.appendChild(createSafeElement('span', { text: lesson.title || 'Bài học không tên' }));
      tr.appendChild(tdTitle);

      // 3. Status Column
      const tdStatus = createSafeElement('td', {
        className: 'text-center',
        attrs: { 'data-label': 'Trạng thái' }
      });
      const badgeInfo = mapStatusBadge(lesson.status);
      const spanStatus = createSafeElement('span', {
        className: badgeInfo.className,
        text: badgeInfo.label
      });
      tdStatus.appendChild(spanStatus);
      tr.appendChild(tdStatus);

      // 4. Vocabulary Count Column
      const tdVocab = createSafeElement('td', {
        className: 'text-center text-secondary small',
        attrs: { 'data-label': 'Số từ vựng' }
      });
      const count = typeof lesson.vocabularyCount === 'number' ? lesson.vocabularyCount : 0;
      tdVocab.appendChild(createSafeElement('span', { text: `${count} từ` }));
      tr.appendChild(tdVocab);

      // 5. Updated Timestamp Column
      const tdUpdated = createSafeElement('td', {
        className: 'text-secondary small',
        attrs: { 'data-label': 'Cập nhật' }
      });
      tdUpdated.appendChild(createSafeElement('span', {
        text: formatLessonDate(lesson.updatedAt || lesson.createdAt)
      }));
      tr.appendChild(tdUpdated);

      // 6. Actions Column (View Detail, Emergency Revoke, Arbiter Approve)
      const tdActions = createSafeElement('td', {
        className: 'text-end pe-3 text-nowrap',
        attrs: { 'data-label': 'Thao tác' }
      });

      const actionsWrapper = createSafeElement('div', {
        className: 'd-inline-flex align-items-center gap-1 justify-content-end text-nowrap flex-nowrap'
      });

      // Detail Button (Always present)
      const btnDetail = createSafeElement('button', {
        className: 'btn btn-outline-secondary btn-sm text-nowrap',
        text: 'Xem chi tiết',
        attrs: {
          type: 'button',
          id: `btnDetailLesson-${lesson.lessonId}`,
          'aria-label': `Xem chi tiết bài học ${lesson.title || `#${lesson.lessonId}`}`
        }
      });
      btnDetail.addEventListener('click', (e) => {
        this.lastFocusedElement = e.currentTarget;
        this.openDetailModal(lesson);
      });
      actionsWrapper.appendChild(btnDetail);

      const selfReview = this.isSelfReview(lesson);

      // Emergency Revoke Button (For 'Approved' lessons)
      if (lesson.status === 'Approved') {
        const btnRevoke = createSafeElement('button', {
          className: 'btn btn-chinese-outline btn-sm text-danger border-danger text-nowrap',
          text: '🚨 Gỡ bài',
          attrs: {
            type: 'button',
            id: `btnRevokeLesson-${lesson.lessonId}`,
            'aria-label': `Thu hồi bài học vi phạm ${lesson.title || `#${lesson.lessonId}`}`,
            ...(selfReview ? {
              disabled: 'true',
              title: 'Bạn không thể tự thu hồi bài học do chính mình tạo ra'
            } : {})
          }
        });
        if (!selfReview) {
          btnRevoke.addEventListener('click', (e) => {
            this.lastFocusedElement = e.currentTarget;
            this.openRevokeModal(lesson);
          });
        }
        actionsWrapper.appendChild(btnRevoke);
      }

      // Supervisory Arbiter Approval Button (For 'Pending' or 'Rejected' lessons)
      // Đã ẩn tính năng duyệt trọng tài theo yêu cầu
      /*
      if (lesson.status === 'Pending' || lesson.status === 'Rejected') {
        const btnApprove = createSafeElement('button', {
          className: 'btn btn-chinese-primary btn-sm text-nowrap',
          text: '⚖️ Duyệt trọng tài',
          attrs: {
            type: 'button',
            id: `btnApproveLesson-${lesson.lessonId}`,
            'aria-label': `Phê duyệt trọng tài bài học ${lesson.title || `#${lesson.lessonId}`}`,
            ...(selfReview ? {
              disabled: 'true',
              title: 'Bạn không thể tự phê duyệt bài học do chính mình tạo ra'
            } : {})
          }
        });
        if (!selfReview) {
          btnApprove.addEventListener('click', (e) => {
            this.lastFocusedElement = e.currentTarget;
            this.openArbiterModal(lesson);
          });
        }
        actionsWrapper.appendChild(btnApprove);
      }
      */

      tdActions.appendChild(actionsWrapper);
      tr.appendChild(tdActions);

      this.elements.tableBody.appendChild(tr);
    }
  }

  /**
   * Renders standardized First/Last pagination controls (<< < 1 2 3 > >>).
   */
  renderPagination() {
    if (this.elements.paginationNav && this.elements.paginationList) {
      if (this.totalPages <= 1) {
        this.elements.paginationNav.classList.add('d-none');
        clearContainer(this.elements.paginationList);
        return;
      }

      this.elements.paginationNav.classList.remove('d-none');
      clearContainer(this.elements.paginationList);

      const calc = calculatePagination(this.currentPage, this.pageSize, this.totalElements, this.totalPages, 5);

      // 1. First Page Button (<<)
      const firstBtn = createSafeElement('button', {
        className: 'pagination-btn',
        text: '<<',
        attrs: {
          type: 'button',
          'aria-label': 'Trang đầu',
          id: 'lessonPaginationFirstBtn',
          ...(calc.currentPage === 0 ? { disabled: 'true' } : {})
        }
      });
      if (calc.currentPage > 0) {
        firstBtn.addEventListener('click', () => {
          this.currentPage = 0;
          this.loadLessons();
        });
      }
      this.elements.paginationList.appendChild(firstBtn);

      // 2. Previous Button (<)
      const prevBtn = createSafeElement('button', {
        className: 'pagination-btn',
        text: '<',
        attrs: {
          type: 'button',
          'aria-label': 'Trang trước',
          id: 'lessonPaginationPrevBtn',
          ...(!calc.hasPrev ? { disabled: 'true' } : {})
        }
      });
      if (calc.hasPrev) {
        prevBtn.addEventListener('click', () => {
          this.currentPage = calc.currentPage - 1;
          this.loadLessons();
        });
      }
      this.elements.paginationList.appendChild(prevBtn);

      // 3. Numbered Buttons
      for (let p = calc.startPage; p <= calc.endPage; p++) {
        const isCurrent = p === calc.currentPage;
        const pageBtn = createSafeElement('button', {
          className: `pagination-btn ${isCurrent ? 'active' : ''}`,
          text: String(p + 1),
          attrs: {
            type: 'button',
            'aria-label': `Trang ${p + 1}`,
            'aria-current': isCurrent ? 'page' : 'false'
          }
        });
        if (!isCurrent) {
          pageBtn.addEventListener('click', () => {
            this.currentPage = p;
            this.loadLessons();
          });
        }
        this.elements.paginationList.appendChild(pageBtn);
      }

      // 4. Next Button (>)
      const nextBtn = createSafeElement('button', {
        className: 'pagination-btn',
        text: '>',
        attrs: {
          type: 'button',
          'aria-label': 'Trang kế tiếp',
          id: 'lessonPaginationNextBtn',
          ...(!calc.hasNext ? { disabled: 'true' } : {})
        }
      });
      if (calc.hasNext) {
        nextBtn.addEventListener('click', () => {
          this.currentPage = calc.currentPage + 1;
          this.loadLessons();
        });
      }
      this.elements.paginationList.appendChild(nextBtn);

      // 5. Last Page Button (>>)
      const lastBtn = createSafeElement('button', {
        className: 'pagination-btn',
        text: '>>',
        attrs: {
          type: 'button',
          'aria-label': 'Trang cuối',
          id: 'lessonPaginationLastBtn',
          ...(calc.currentPage >= calc.totalPages - 1 ? { disabled: 'true' } : {})
        }
      });
      if (calc.currentPage < calc.totalPages - 1) {
        lastBtn.addEventListener('click', () => {
          this.currentPage = calc.totalPages - 1;
          this.loadLessons();
        });
      }
      this.elements.paginationList.appendChild(lastBtn);
    }
  }

  /**
   * Refreshes server-side status totalElement metrics in parallel.
   */
  async refreshStatusCounts() {
    if (this.elements.refreshKpiSpinner) {
      this.elements.refreshKpiSpinner.classList.remove('d-none');
    }

    const resetSpinners = () => {
      const targets = [
        this.elements.kpiCountTotal,
        this.elements.kpiCountDraft,
        this.elements.kpiCountPending,
        this.elements.kpiCountApproved,
        this.elements.kpiCountRejected
      ];
      for (const el of targets) {
        if (el) {
          clearContainer(el);
          el.appendChild(createSafeElement('span', {
            className: 'spinner-border spinner-border-sm text-secondary',
            attrs: { role: 'status', 'aria-hidden': 'true' }
          }));
        }
      }
    };
    resetSpinners();

    try {
      const probe = async (status) => {
        try {
          const params = { page: 0, size: 1 };
          if (status) params.status = status;
          const res = await apiClient('/admin/lessons', { params });
          return res.data || res;
        } catch {
          return null;
        }
      };

      const [totalRes, draftRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
        probe(''),
        probe('Draft'),
        probe('Pending'),
        probe('Approved'),
        probe('Rejected')
      ]);

      const counts = extractStatusCounts({
        total: totalRes,
        draft: draftRes,
        pending: pendingRes,
        approved: approvedRes,
        rejected: rejectedRes
      });

      const renderCount = (el, val) => {
        if (!el) return;
        clearContainer(el);
        el.textContent = typeof val === 'number' ? val.toLocaleString('vi-VN') : '—';
      };

      renderCount(this.elements.kpiCountTotal, counts.total);
      renderCount(this.elements.kpiCountDraft, counts.draft);
      renderCount(this.elements.kpiCountPending, counts.pending);
      renderCount(this.elements.kpiCountApproved, counts.approved);
      renderCount(this.elements.kpiCountRejected, counts.rejected);

    } catch (err) {
      console.warn('[AdminLessons] Failed to probe global status counts:', err);
    } finally {
      if (this.elements.refreshKpiSpinner) {
        this.elements.refreshKpiSpinner.classList.add('d-none');
      }
    }
  }

  /**
   * Opens and renders the read-only lesson detail modal.
   *
   * @param {object} lesson
   */
  async openDetailModal(lesson) {
    if (!this.elements.detailModal) return;

    // Reset modal sections
    if (this.elements.detailLessonTitle) this.elements.detailLessonTitle.textContent = lesson.title || '—';
    if (this.elements.detailLessonId) this.elements.detailLessonId.textContent = `#${lesson.lessonId}`;
    if (this.elements.detailLessonTimestamp) this.elements.detailLessonTimestamp.textContent = formatLessonDate(lesson.updatedAt || lesson.createdAt);

    if (this.elements.detailLessonStatusBadge) {
      const badgeInfo = mapStatusBadge(lesson.status);
      this.elements.detailLessonStatusBadge.className = badgeInfo.className;
      this.elements.detailLessonStatusBadge.textContent = badgeInfo.label;
    }

    if (this.elements.detailContractLimitationAlert) {
      this.elements.detailContractLimitationAlert.classList.add('d-none');
    }
    if (this.elements.detailRejectionAlert) {
      this.elements.detailRejectionAlert.classList.add('d-none');
    }
    if (this.elements.detailErrorAlert) {
      this.elements.detailErrorAlert.classList.add('d-none');
    }
    if (this.elements.detailVocabSection) {
      this.elements.detailVocabSection.classList.add('d-none');
    }
    if (this.elements.detailVocabLoadingPrompt) {
      this.elements.detailVocabLoadingPrompt.classList.add('d-none');
    }

    // Show rejection reason if available
    if (lesson.status === 'Rejected' && lesson.rejectionReason && this.elements.detailRejectionAlert) {
      if (this.elements.detailRejectionMessage) {
        this.elements.detailRejectionMessage.textContent = lesson.rejectionReason;
      }
      this.elements.detailRejectionAlert.classList.remove('d-none');
    }

    const detailStrategy = determineDetailStrategy(lesson.status, lesson.lessonId);

    this.showDialog(this.elements.detailModal);

    if (!detailStrategy.canFetchDetail) {
      if (this.elements.detailContractLimitationAlert && this.elements.detailContractLimitationMessage) {
        this.elements.detailContractLimitationMessage.textContent = detailStrategy.limitationNotice;
        this.elements.detailContractLimitationAlert.classList.remove('d-none');
      }
      return;
    }

    if (this.elements.detailVocabLoadingPrompt) {
      this.elements.detailVocabLoadingPrompt.classList.remove('d-none');
    }

    try {
      const response = await apiClient(detailStrategy.endpoint);
      const detail = response.data || response;

      this.renderDetailVocabularies(detail.vocabularies || []);
    } catch (err) {
      if (this.elements.detailErrorAlert && this.elements.detailErrorMessage) {
        this.elements.detailErrorMessage.textContent = err?.message || 'Không thể tải chi tiết bài học từ máy chủ.';
        this.elements.detailErrorAlert.classList.remove('d-none');
      }
    } finally {
      if (this.elements.detailVocabLoadingPrompt) {
        this.elements.detailVocabLoadingPrompt.classList.add('d-none');
      }
    }
  }

  /**
   * Opens Emergency Lesson Revocation Modal (TASK-7.2).
   *
   * @param {object} lesson
   */
  openRevokeModal(lesson) {
    if (!this.elements.revokeModal) return;
    this.targetLesson = lesson;

    if (this.elements.revokeLessonTitleText) {
      this.elements.revokeLessonTitleText.textContent = `${lesson.title || `#${lesson.lessonId}`}`;
    }
    if (this.elements.revokeReasonInput) {
      this.elements.revokeReasonInput.value = '';
    }
    if (this.elements.revokeModalError) {
      this.elements.revokeModalError.classList.add('d-none');
      this.elements.revokeModalError.textContent = '';
    }
    if (this.elements.revokeSpinner) {
      this.elements.revokeSpinner.classList.add('d-none');
    }

    this.showDialog(this.elements.revokeModal);
    if (this.elements.revokeReasonInput) {
      setTimeout(() => this.elements.revokeReasonInput.focus(), 50);
    }
  }

  /**
   * Handles confirming Emergency Revocation.
   */
  async handleConfirmRevoke() {
    if (!this.targetLesson) return;
    const reason = (this.elements.revokeReasonInput?.value || '').trim();

    if (!reason) {
      if (this.elements.revokeModalError) {
        this.elements.revokeModalError.textContent = 'Vui lòng nhập lý do thu hồi bài học vi phạm.';
        this.elements.revokeModalError.classList.remove('d-none');
      }
      if (this.elements.revokeReasonInput) {
        this.elements.revokeReasonInput.focus();
      }
      return;
    }

    if (this.elements.revokeSpinner) this.elements.revokeSpinner.classList.remove('d-none');
    if (this.elements.btnConfirmRevoke) this.elements.btnConfirmRevoke.disabled = true;

    try {
      await apiClient(`/admin/lessons/${this.targetLesson.lessonId}/revoke`, {
        method: 'POST',
        body: { reason }
      });

      showToast('Đã thu hồi bài học vi phạm khẩn cấp thành công', 'success');
      this.closeModal(this.elements.revokeModal);

      await Promise.all([
        this.loadLessons(),
        this.refreshStatusCounts()
      ]);
    } catch (err) {
      if (this.elements.revokeModalError) {
        this.elements.revokeModalError.textContent = err?.message || 'Không thể thu hồi bài học. Vui lòng thử lại.';
        this.elements.revokeModalError.classList.remove('d-none');
      }
    } finally {
      if (this.elements.revokeSpinner) this.elements.revokeSpinner.classList.add('d-none');
      if (this.elements.btnConfirmRevoke) this.elements.btnConfirmRevoke.disabled = false;
    }
  }

  /**
   * Opens Supervisory Arbiter Approval Modal (TASK-7.2).
   *
   * @param {object} lesson
   */
  openArbiterModal(lesson) {
    if (!this.elements.arbiterModal) return;
    this.targetLesson = lesson;

    if (this.elements.arbiterLessonTitleText) {
      this.elements.arbiterLessonTitleText.textContent = `${lesson.title || `#${lesson.lessonId}`}`;
    }
    if (this.elements.arbiterNoteInput) {
      this.elements.arbiterNoteInput.value = '';
    }
    if (this.elements.arbiterModalError) {
      this.elements.arbiterModalError.classList.add('d-none');
      this.elements.arbiterModalError.textContent = '';
    }
    if (this.elements.arbiterSpinner) {
      this.elements.arbiterSpinner.classList.add('d-none');
    }

    this.showDialog(this.elements.arbiterModal);
    if (this.elements.arbiterNoteInput) {
      setTimeout(() => this.elements.arbiterNoteInput.focus(), 50);
    }
  }

  /**
   * Handles confirming Supervisory Arbiter Approval.
   */
  async handleConfirmArbiter() {
    if (!this.targetLesson) return;
    const note = (this.elements.arbiterNoteInput?.value || '').trim();

    if (this.elements.arbiterSpinner) this.elements.arbiterSpinner.classList.remove('d-none');
    if (this.elements.btnConfirmArbiter) this.elements.btnConfirmArbiter.disabled = true;

    try {
      await apiClient(`/admin/lessons/${this.targetLesson.lessonId}/approve`, {
        method: 'POST',
        body: note ? { note } : {}
      });

      showToast('Đã phê duyệt trọng tài bài học thành công', 'success');
      this.closeModal(this.elements.arbiterModal);

      await Promise.all([
        this.loadLessons(),
        this.refreshStatusCounts()
      ]);
    } catch (err) {
      if (this.elements.arbiterModalError) {
        this.elements.arbiterModalError.textContent = err?.message || 'Không thể phê duyệt bài học. Vui lòng thử lại.';
        this.elements.arbiterModalError.classList.remove('d-none');
      }
    } finally {
      if (this.elements.arbiterSpinner) this.elements.arbiterSpinner.classList.add('d-none');
      if (this.elements.btnConfirmArbiter) this.elements.btnConfirmArbiter.disabled = false;
    }
  }

  /**
   * Renders the ordered vocabularies list inside the detail modal.
   *
   * @param {Array<object>} vocabularies
   */
  renderDetailVocabularies(vocabularies) {
    if (!this.elements.detailVocabSection || !this.elements.detailVocabList) return;
    clearContainer(this.elements.detailVocabList);

    const count = Array.isArray(vocabularies) ? vocabularies.length : 0;
    if (this.elements.detailVocabCount) {
      this.elements.detailVocabCount.textContent = String(count);
    }

    if (count === 0) {
      if (this.elements.detailVocabEmptyPrompt) {
        this.elements.detailVocabEmptyPrompt.classList.remove('d-none');
      }
      this.elements.detailVocabSection.classList.remove('d-none');
      return;
    }

    if (this.elements.detailVocabEmptyPrompt) {
      this.elements.detailVocabEmptyPrompt.classList.add('d-none');
    }

    for (let i = 0; i < vocabularies.length; i++) {
      const item = vocabularies[i];
      const order = typeof item.orderIndex === 'number' ? item.orderIndex : i + 1;

      const row = createSafeElement('div', {
        className: 'list-group-item d-flex align-items-center justify-content-between py-2 px-3 gap-3'
      });

      // Left: Order + Hanzi + Pinyin
      const leftCol = createSafeElement('div', { className: 'd-flex align-items-center gap-3' });
      const orderBadge = createSafeElement('span', {
        className: 'badge bg-light text-secondary border small text-center',
        attrs: { style: 'width: 32px;' },
        text: `#${order}`
      });
      leftCol.appendChild(orderBadge);

      const hanziSpan = createSafeElement('span', {
        className: 'font-chinese fs-5 fw-bold text-chinese-red',
        text: item.hanzi || '—'
      });
      leftCol.appendChild(hanziSpan);

      const pinyinSpan = createSafeElement('span', {
        className: 'small text-dark fw-semibold',
        text: item.pinyin ? `[${item.pinyin}]` : ''
      });
      leftCol.appendChild(pinyinSpan);

      row.appendChild(leftCol);

      // Right: Meanings + Audio
      const rightCol = createSafeElement('div', { className: 'd-flex align-items-center gap-2 text-end' });
      if (item.meaningHanViet) {
        const hvSpan = createSafeElement('span', {
          className: 'small text-muted d-none d-sm-inline',
          text: `(${item.meaningHanViet})`
        });
        rightCol.appendChild(hvSpan);
      }

      const viSpan = createSafeElement('span', {
        className: 'small text-dark fw-medium',
        text: item.meaningVi || ''
      });
      rightCol.appendChild(viSpan);

      const safeAudio = item.audioUrl ? sanitizeResourceUrl(item.audioUrl) : null;
      const speechBtn = createSpeechButton({
        className: 'ms-2 flex-shrink-0',
        ariaLabel: `Nghe phát âm từ vựng ${item.hanzi || ''}`,
        title: `Phát âm: ${item.hanzi || ''}`,
        iconSize: 14,
        onClick: (e) => {
          e.stopPropagation();
          if (item.hanzi) {
            playPronunciation({
              text: item.hanzi,
              audioUrl: safeAudio && safeAudio !== 'about:blank' ? safeAudio : null,
              button: speechBtn
            });
          }
        }
      });
      speechBtn.style.width = '30px';
      speechBtn.style.height = '30px';
      rightCol.appendChild(speechBtn);

      row.appendChild(rightCol);

      this.elements.detailVocabList.appendChild(row);
    }

    this.elements.detailVocabSection.classList.remove('d-none');
  }

  /**
   * Displays modal dialog safely.
   *
   * @param {HTMLDialogElement} dialog
   */
  showDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  /**
   * Closes modal dialog and restores focus.
   *
   * @param {HTMLDialogElement} dialog
   */
  closeModal(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }

    if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
      this.lastFocusedElement.focus();
    }
  }

  closeDetailModal() {
    this.closeModal(this.elements.detailModal);
  }
}

// Auto-initialize on DOM ready in browser
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const controller = new AdminLessonsPageController();
    controller.init();
  });
}
