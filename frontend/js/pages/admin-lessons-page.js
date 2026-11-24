/**
 * =============================================================================
 * ADMIN LESSON MANAGEMENT CONTROLLER (TASK: ADMIN LESSONS UNIFIED)
 * Module: frontend/js/pages/admin-lessons-page.js
 *
 * Responsibilities:
 * - Direct Admin lesson creation, editing, excel importing, and deletion.
 * - Integration with authoritative backend endpoints:
 *   * GET /api/v1/admin/lessons (Paginated system-wide lessons)
 *   * GET /api/v1/admin/lessons/{id} (Full lesson detail with vocabulary list)
 *   * POST /api/v1/admin/lessons (Create lesson and auto-publish)
 *   * PUT /api/v1/admin/lessons/{id} (Update lesson title)
 *   * DELETE /api/v1/admin/lessons/{id} (Permanently delete lesson)
 *   * POST /api/v1/admin/lessons/{id}/vocabularies/{vocabId} (Add vocabulary to lesson)
 *   * DELETE /api/v1/admin/lessons/{id}/vocabularies/{vocabId} (Remove vocabulary from lesson)
 *   * PUT /api/v1/admin/lessons/{id}/reorder (Reorder vocabulary items)
 *   * POST /api/v1/admin/lessons/import (Preview excel file upload)
 *   * POST /api/v1/admin/lessons/import/confirm (Confirm excel import)
 * - Safe DOM construction (zero innerHTML sinks) & native HTML5 <dialog> modals.
 * - Single design style aligned with admin-radicals and admin-vocabulary.
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
  const normalized = normalizeStatusFilter(status);
  const id = lessonId !== null && lessonId !== undefined ? lessonId : '';

  if (normalized === 'Approved') {
    return {
      strategy: 'APPROVED',
      canFetchDetail: true,
      endpoint: id ? `/lessons/${id}` : null,
      limitationNotice: null
    };
  }

  if (id) {
    return {
      strategy: normalized === 'Pending' ? 'PENDING' : 'ADMIN',
      canFetchDetail: true,
      endpoint: `/admin/lessons/${id}`,
      limitationNotice: null
    };
  }

  return {
    strategy: 'UNSUPPORTED',
    canFetchDetail: false,
    endpoint: null,
    limitationNotice: 'Chưa có ID bài học hợp lệ để tải chi tiết nội dung.'
  };
}

/**
 * Formats ISO date string to localized Vietnamese datetime format.
 *
 * @param {string|null|undefined} dateString
 * @returns {string}
 */
export function formatLessonDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
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
 * Calculates pagination summary info.
 *
 * @param {number} page 0-based page index
 * @param {number} size items per page
 * @param {number} totalElements total count across database
 * @returns {{ start: number, end: number, total: number, totalPages: number, hasPrevious: boolean, hasNext: boolean }}
 */
export function calculatePaginationSummary(page, size, totalElements) {
  const safePage = Math.max(0, page || 0);
  const safeSize = Math.max(1, size || 20);
  const safeTotal = Math.max(0, totalElements || 0);
  const totalPages = safeTotal === 0 ? 1 : Math.ceil(safeTotal / safeSize);

  const start = safeTotal === 0 ? 0 : safePage * safeSize + 1;
  const end = Math.min((safePage + 1) * safeSize, safeTotal);

  return {
    start,
    end,
    total: safeTotal,
    totalPages,
    hasPrevious: safePage > 0,
    hasNext: safePage < totalPages - 1
  };
}

/**
 * Calculates pagination buttons array or full pagination state.
 */
export function calculatePagination(currentPageOrPage, totalPagesOrSize, maxVisibleOrTotalElements, totalPages, maxButtons = 5) {
  if (arguments.length >= 4) {
    const page = currentPageOrPage;
    const size = totalPagesOrSize;
    const totalElements = maxVisibleOrTotalElements;
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
  const tPages = totalPagesOrSize;
  const maxVisible = maxVisibleOrTotalElements !== undefined ? maxVisibleOrTotalElements : 5;

  if (tPages <= 0) return [];
  if (tPages <= maxVisible) {
    const pages = [];
    for (let i = 0; i < tPages; i++) pages.push(i);
    return pages;
  }
  let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(tPages - 1, start + maxVisible - 1);
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
    this.searchQuery = '';
    this.currentPage = 0;
    this.pageSize = 20;
    this.totalElements = 0;
    this.totalPages = 0;
    this.currentLessons = [];

    // State for Unified Lesson Form Modal (Create / Edit)
    this.editingLesson = null;
    this.formVocabularies = [];
    this.initialVocabIds = [];
    this.vocabSearchDebounceTimer = null;

    // State for Delete Lesson Modal
    this.targetLessonForDelete = null;

    // State for Excel Import Modal
    this.previewReport = null;

    this.lastFocusedElement = null;
    this.elements = {};
  }

  /**
   * Initializes the controller, caches DOM nodes, verifies role, and loads data.
   */
  async init() {
    initNavbarAuth();

    this.cacheElements();

    // Verify Admin authorization
    if (!hasAdminAccess()) {
      if (this.elements.authGuard) this.elements.authGuard.classList.remove('d-none');
      if (this.elements.mainContent) this.elements.mainContent.classList.add('d-none');
      return;
    }

    if (this.elements.authGuard) this.elements.authGuard.classList.add('d-none');
    if (this.elements.mainContent) this.elements.mainContent.classList.remove('d-none');

    this.attachEventListeners();
    await this.loadLessons();
    this.checkInitialUrlActions();
  }

  /**
   * Checks query parameters and hash to auto-open modals triggered from Dashboard Quick Actions.
   */
  checkInitialUrlActions() {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        const hash = window.location.hash;
        if (action === 'create' || hash === '#create') {
          this.openCreateLessonModal();
        } else if (action === 'import' || hash === '#import') {
          this.openImportLessonModal();
        }
      }
    } catch (_) {
      // Ignore URL parsing errors
    }
  }

  /**
   * Caches all required interactive DOM elements.
   */
  cacheElements() {
    this.elements = {
      authGuard: document.getElementById('adminAuthGuardContainer'),
      mainContent: document.getElementById('adminLessonsMainContent'),

      // Header Actions
      btnOpenImportLessonModal: document.getElementById('btnOpenImportLessonModal'),
      btnOpenCreateLessonModal: document.getElementById('btnOpenCreateLessonModal'),
      resultCountBadge: document.getElementById('lessonResultCount'),

      // Search Toolbar
      lessonSearchInput: document.getElementById('lessonSearchInput'),
      btnLessonSearch: document.getElementById('btnLessonSearch'),
      btnLessonClearSearch: document.getElementById('btnLessonClearSearch'),

      // Table & State
      stateContainer: document.getElementById('lessonStateContainer'),
      tableCard: document.getElementById('lessonTableCard'),
      tableBody: document.getElementById('lessonTableBody'),

      // Standard Pagination Controls
      paginationNav: document.getElementById('lessonPaginationNav'),
      paginationList: document.getElementById('lessonPaginationList'),

      // Modal 1: Unified Lesson Form Modal (Create / Edit)
      lessonFormModal: document.getElementById('lessonFormModal'),
      lessonFormModalTitle: document.getElementById('lessonFormModalTitle'),
      lessonFormModalSubtitle: document.getElementById('lessonFormModalSubtitle'),
      lessonFormModalCloseBtn: document.getElementById('lessonFormModalCloseBtn'),
      lessonForm: document.getElementById('lessonForm'),
      lessonFormTitleInput: document.getElementById('lessonFormTitleInput'),
      lessonFormVocabSearch: document.getElementById('lessonFormVocabSearch'),
      btnAddVocabToForm: document.getElementById('btnAddVocabToForm'),
      lessonFormVocabSearchResults: document.getElementById('lessonFormVocabSearchResults'),
      lessonFormVocabCount: document.getElementById('lessonFormVocabCount'),
      formVocabTable: document.getElementById('formVocabTable'),
      formVocabTbody: document.getElementById('formVocabTbody'),
      lessonFormModalError: document.getElementById('lessonFormModalError'),
      btnCancelLessonForm: document.getElementById('btnCancelLessonForm'),
      btnSaveLessonForm: document.getElementById('btnSaveLessonForm'),
      saveLessonFormSpinner: document.getElementById('saveLessonFormSpinner'),
      saveLessonFormText: document.getElementById('saveLessonFormText'),

      // Modal 2: Import Lesson From Excel Modal
      importExcelModal: document.getElementById('importExcelModal'),
      importExcelModalTitle: document.getElementById('importExcelModalTitle'),
      importExcelModalCloseBtn: document.getElementById('importExcelModalCloseBtn'),
      importExcelFileInput: document.getElementById('importExcelFileInput'),
      btnPreviewImportExcel: document.getElementById('btnPreviewImportExcel'),
      previewImportSpinner: document.getElementById('previewImportSpinner'),
      importExcelTitleInput: document.getElementById('importExcelTitleInput'),
      importExcelPreviewArea: document.getElementById('importExcelPreviewArea'),
      importPreviewBadge: document.getElementById('importPreviewBadge'),
      importTotalRows: document.getElementById('importTotalRows'),
      importValidRows: document.getElementById('importValidRows'),
      importInvalidRows: document.getElementById('importInvalidRows'),
      importPreviewSampleContainer: document.getElementById('importPreviewSampleContainer'),
      importExcelModalError: document.getElementById('importExcelModalError'),
      btnCancelImportExcel: document.getElementById('btnCancelImportExcel'),
      btnConfirmImportExcel: document.getElementById('btnConfirmImportExcel'),
      confirmImportSpinner: document.getElementById('confirmImportSpinner'),
      confirmImportText: document.getElementById('confirmImportText'),

      // Modal 3: Delete Lesson Confirmation Modal
      deleteLessonModal: document.getElementById('deleteLessonModal'),
      deleteLessonModalTitle: document.getElementById('deleteLessonModalTitle'),
      deleteLessonModalCloseBtn: document.getElementById('deleteLessonModalCloseBtn'),
      deleteLessonTargetTitle: document.getElementById('deleteLessonTargetTitle'),
      deleteLessonTargetId: document.getElementById('deleteLessonTargetId'),
      deleteLessonTargetVocabCount: document.getElementById('deleteLessonTargetVocabCount'),
      deleteLessonModalError: document.getElementById('deleteLessonModalError'),
      btnCancelDeleteLesson: document.getElementById('btnCancelDeleteLesson'),
      btnConfirmDeleteLesson: document.getElementById('btnConfirmDeleteLesson'),
      deleteLessonBtnSpinner: document.getElementById('deleteLessonBtnSpinner'),
      deleteLessonBtnText: document.getElementById('deleteLessonBtnText')
    };
  }

  /**
   * Attaches event listeners to buttons and modals.
   */
  attachEventListeners() {
    // Search Toolbar
    if (this.elements.btnLessonSearch) {
      this.elements.btnLessonSearch.addEventListener('click', () => this.handleSearch());
    }
    if (this.elements.lessonSearchInput) {
      this.elements.lessonSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSearch();
        }
      });
    }
    if (this.elements.btnLessonClearSearch) {
      this.elements.btnLessonClearSearch.addEventListener('click', () => this.handleClearSearch());
    }

    // Modal 1 Triggers & Actions
    if (this.elements.btnOpenCreateLessonModal) {
      this.elements.btnOpenCreateLessonModal.addEventListener('click', () => this.openCreateLessonModal());
    }
    if (this.elements.lessonFormModalCloseBtn) {
      this.elements.lessonFormModalCloseBtn.addEventListener('click', () => this.closeModal(this.elements.lessonFormModal));
    }
    if (this.elements.btnCancelLessonForm) {
      this.elements.btnCancelLessonForm.addEventListener('click', () => this.closeModal(this.elements.lessonFormModal));
    }
    if (this.elements.lessonFormModal) {
      this.elements.lessonFormModal.addEventListener('cancel', (e) => {
        e.preventDefault();
        this.closeModal(this.elements.lessonFormModal);
      });
    }
    if (this.elements.btnAddVocabToForm) {
      this.elements.btnAddVocabToForm.addEventListener('click', () => this.handleVocabSearchOrAdd());
    }
    if (this.elements.lessonFormVocabSearch) {
      this.elements.lessonFormVocabSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleVocabSearchOrAdd();
        }
      });
      this.elements.lessonFormVocabSearch.addEventListener('input', () => {
        clearTimeout(this.vocabSearchDebounceTimer);
        this.vocabSearchDebounceTimer = setTimeout(() => this.searchVocabAutoSuggestions(), 300);
      });
    }
    if (this.elements.btnSaveLessonForm) {
      this.elements.btnSaveLessonForm.addEventListener('click', () => this.handleSaveLessonForm());
    }

    // Modal 2 Triggers & Actions (Excel Import)
    if (this.elements.btnOpenImportLessonModal) {
      this.elements.btnOpenImportLessonModal.addEventListener('click', () => this.openImportExcelModal());
    }
    if (this.elements.importExcelModalCloseBtn) {
      this.elements.importExcelModalCloseBtn.addEventListener('click', () => this.closeModal(this.elements.importExcelModal));
    }
    if (this.elements.btnCancelImportExcel) {
      this.elements.btnCancelImportExcel.addEventListener('click', () => this.closeModal(this.elements.importExcelModal));
    }
    if (this.elements.importExcelModal) {
      this.elements.importExcelModal.addEventListener('cancel', (e) => {
        e.preventDefault();
        this.closeModal(this.elements.importExcelModal);
      });
    }
    if (this.elements.importExcelFileInput) {
      this.elements.importExcelFileInput.addEventListener('change', () => {
        const file = this.elements.importExcelFileInput.files?.[0];
        if (file && this.elements.importExcelTitleInput && !this.elements.importExcelTitleInput.value.trim()) {
          const suggested = file.name.replace(/\.[^/.]+$/, '');
          this.elements.importExcelTitleInput.value = suggested;
        }
      });
    }
    if (this.elements.btnPreviewImportExcel) {
      this.elements.btnPreviewImportExcel.addEventListener('click', () => this.handlePreviewImportExcel());
    }
    if (this.elements.btnConfirmImportExcel) {
      this.elements.btnConfirmImportExcel.addEventListener('click', () => this.handleConfirmImportExcel());
    }

    // Modal 3 Triggers & Actions (Delete Lesson)
    if (this.elements.deleteLessonModalCloseBtn) {
      this.elements.deleteLessonModalCloseBtn.addEventListener('click', () => this.closeModal(this.elements.deleteLessonModal));
    }
    if (this.elements.btnCancelDeleteLesson) {
      this.elements.btnCancelDeleteLesson.addEventListener('click', () => this.closeModal(this.elements.deleteLessonModal));
    }
    if (this.elements.deleteLessonModal) {
      this.elements.deleteLessonModal.addEventListener('cancel', (e) => {
        e.preventDefault();
        this.closeModal(this.elements.deleteLessonModal);
      });
    }
    if (this.elements.btnConfirmDeleteLesson) {
      this.elements.btnConfirmDeleteLesson.addEventListener('click', () => this.handleConfirmDeleteLesson());
    }
  }

  /**
   * Performs search by title or lesson ID.
   */
  handleSearch() {
    const query = (this.elements.lessonSearchInput?.value || '').trim();
    this.searchQuery = query;
    this.currentPage = 0;
    this.loadLessons();
  }

  /**
   * Clears search input and reloads lessons.
   */
  handleClearSearch() {
    if (this.elements.lessonSearchInput) {
      this.elements.lessonSearchInput.value = '';
    }
    this.searchQuery = '';
    this.currentPage = 0;
    this.loadLessons();
  }

  /**
   * Loads lessons for current pagination page.
   */
  async loadLessons() {
    setComponentState(this.elements.stateContainer, 'LOADING');
    if (this.elements.tableCard) this.elements.tableCard.classList.add('d-none');
    if (this.elements.paginationNav) this.elements.paginationNav.classList.add('d-none');

    const params = buildAdminLessonsParams({
      page: this.currentPage,
      size: this.pageSize
    });

    try {
      const response = await apiClient('/admin/lessons', { params });
      const rawData = response.data || response;
      const parsed = parsePageResponse(rawData);

      let items = parsed.items;
      let total = parsed.totalElements;

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        items = items.filter(item => {
          const matchTitle = (item.title || '').toLowerCase().includes(query);
          const matchId = String(item.lessonId || '').includes(query);
          return matchTitle || matchId;
        });
        total = items.length;
      }

      this.currentLessons = items;
      this.currentPage = parsed.page;
      this.pageSize = parsed.size;
      this.totalElements = total;
      this.totalPages = this.searchQuery ? (items.length > 0 ? 1 : 0) : parsed.totalPages;

      this.updateResultBadge();

      if (this.currentLessons.length === 0) {
        setComponentState(this.elements.stateContainer, 'EMPTY', {
          title: this.searchQuery ? 'Không tìm thấy bài học phù hợp' : 'Không có bài học nào',
          message: this.searchQuery
            ? `Không tìm thấy bài học nào khớp với từ khóa "${this.searchQuery}".`
            : 'Hệ thống chưa ghi nhận bất kỳ bài học nào. Bạn có thể bấm "＋ Tạo bài học mới" hoặc "📊 Nhập từ Excel" để bắt đầu.'
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
   * Updates result count status badge in header.
   */
  updateResultBadge() {
    if (!this.elements.resultCountBadge) return;
    this.elements.resultCountBadge.textContent = `${this.totalElements.toLocaleString('vi-VN')} bài học`;
    this.elements.resultCountBadge.className = 'badge-status badge-status-draft text-nowrap';
  }

  /**
   * Renders semantic table rows using safe DOM elements.
   * Standard 5 columns: ID, Tên bài học, Số từ vựng, Cập nhật, Thao tác.
   */
  renderTableRows() {
    if (!this.elements.tableBody) return;
    clearContainer(this.elements.tableBody);

    for (const lesson of this.currentLessons) {
      const id = lesson.lessonId !== undefined ? lesson.lessonId : '—';
      const title = lesson.title || 'Bài học không tên';
      const count = typeof lesson.vocabularyCount === 'number' ? lesson.vocabularyCount : 0;
      const updatedText = formatLessonDate(lesson.updatedAt || lesson.createdAt);

      const tr = createSafeElement('tr', {
        attrs: { id: `lessonRow-${id}` }
      });

      // 1. ID Column
      const tdId = createSafeElement('td', {
        className: 'text-center text-secondary small ps-3',
        attrs: { 'data-label': 'ID' }
      });
      tdId.appendChild(createSafeElement('code', { text: `#${id}` }));
      tr.appendChild(tdId);

      // 2. Title Column
      const tdTitle = createSafeElement('td', {
        className: 'fw-semibold text-dark',
        attrs: { 'data-label': 'Tên bài học' }
      });
      tdTitle.appendChild(createSafeElement('span', { text: title }));
      tr.appendChild(tdTitle);

      // 3. Vocabulary Count Column
      const tdVocab = createSafeElement('td', {
        className: 'text-center text-secondary small',
        attrs: { 'data-label': 'Số từ vựng' }
      });
      tdVocab.appendChild(createSafeElement('span', { text: `${count} từ` }));
      tr.appendChild(tdVocab);

      // 4. Updated Timestamp Column
      const tdUpdated = createSafeElement('td', {
        className: 'text-secondary small',
        attrs: { 'data-label': 'Cập nhật' }
      });
      tdUpdated.appendChild(createSafeElement('span', { text: updatedText }));
      tr.appendChild(tdUpdated);

      // 5. Actions Column (Sửa & Xóa in unified btn-group-sm)
      const tdActions = createSafeElement('td', {
        className: 'text-end pe-3 text-nowrap',
        attrs: { 'data-label': 'Thao tác' }
      });

      const actionGroup = createSafeElement('div', {
        className: 'btn-group btn-group-sm',
        attrs: {
          role: 'group',
          'aria-label': `Thao tác cho bài học ${title}`
        }
      });

      // Button Sửa
      const btnEdit = createSafeElement('button', {
        className: 'btn btn-outline-secondary btn-edit-lesson',
        text: 'Sửa',
        attrs: {
          type: 'button',
          id: `btnEditLesson-${id}`,
          'aria-label': `Chỉnh sửa bài học ${title}`
        }
      });
      btnEdit.addEventListener('click', (e) => {
        this.lastFocusedElement = e.currentTarget;
        this.openEditLessonModal(lesson);
      });
      actionGroup.appendChild(btnEdit);

      // Button Xóa
      const btnDelete = createSafeElement('button', {
        className: 'btn btn-outline-danger btn-delete-lesson',
        text: 'Xóa',
        attrs: {
          type: 'button',
          id: `btnDeleteLesson-${id}`,
          'aria-label': `Xóa bài học ${title}`
        }
      });
      btnDelete.addEventListener('click', (e) => {
        this.lastFocusedElement = e.currentTarget;
        this.openDeleteLessonModal(lesson);
      });
      actionGroup.appendChild(btnDelete);

      tdActions.appendChild(actionGroup);
      tr.appendChild(tdActions);

      this.elements.tableBody.appendChild(tr);
    }
  }

  /**
   * Renders standardized First/Last pagination controls (<< < 1 2 3 > >>).
   */
  renderPagination() {
    if (!this.elements.paginationNav || !this.elements.paginationList) return;

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

  /* ---------------------------------------------------------------------------
   * 3. MODAL 1: UNIFIED LESSON FORM MODAL (CREATE / EDIT)
   * --------------------------------------------------------------------------- */

  /**
   * Opens the unified lesson form modal in Create mode.
   */
  openCreateLessonModal() {
    if (!this.elements.lessonFormModal) return;

    this.editingLesson = null;
    this.formVocabularies = [];
    this.initialVocabIds = [];

    if (this.elements.lessonFormModalTitle) {
      this.elements.lessonFormModalTitle.textContent = 'Thêm Bài Học Mới';
    }
    if (this.elements.lessonFormModalSubtitle) {
      this.elements.lessonFormModalSubtitle.textContent = 'Thiết lập tiêu đề bài học và thêm các từ vựng cấu thành vào giáo trình.';
    }
    if (this.elements.saveLessonFormText) {
      this.elements.saveLessonFormText.textContent = 'Lưu bài học';
    }

    if (this.elements.lessonFormTitleInput) {
      this.elements.lessonFormTitleInput.value = '';
    }
    if (this.elements.lessonFormVocabSearch) {
      this.elements.lessonFormVocabSearch.value = '';
    }
    this.clearVocabSearchResults();
    this.hideFormModalError();

    this.renderFormVocabs();
    this.showDialog(this.elements.lessonFormModal);

    if (this.elements.lessonFormTitleInput) {
      setTimeout(() => this.elements.lessonFormTitleInput.focus(), 50);
    }
  }

  /**
   * Opens the unified lesson form modal in Edit mode.
   *
   * @param {object} lesson
   */
  async openEditLessonModal(lesson) {
    if (!this.elements.lessonFormModal) return;

    this.editingLesson = lesson;
    this.formVocabularies = [];
    this.initialVocabIds = [];

    if (this.elements.lessonFormModalTitle) {
      this.elements.lessonFormModalTitle.textContent = 'Chỉnh Sửa Bài Học';
    }
    if (this.elements.lessonFormModalSubtitle) {
      this.elements.lessonFormModalSubtitle.textContent = `Cập nhật tiêu đề bài học #${lesson.lessonId} và sắp xếp từ vựng.`;
    }
    if (this.elements.saveLessonFormText) {
      this.elements.saveLessonFormText.textContent = 'Lưu thay đổi';
    }

    if (this.elements.lessonFormTitleInput) {
      this.elements.lessonFormTitleInput.value = lesson.title || '';
    }
    if (this.elements.lessonFormVocabSearch) {
      this.elements.lessonFormVocabSearch.value = '';
    }
    this.clearVocabSearchResults();
    this.hideFormModalError();

    this.renderFormVocabs();
    this.showDialog(this.elements.lessonFormModal);

    // Fetch full lesson detail to populate vocabularies
    try {
      const res = await apiClient(`/admin/lessons/${lesson.lessonId}`);
      const detail = res.data || res;
      const vocabs = Array.isArray(detail.vocabularies) ? detail.vocabularies : [];
      this.formVocabularies = vocabs.map((v, idx) => ({
        vocabId: Number(v.vocabId || v.vocabularyId || v.id),
        hanzi: v.hanzi || '',
        pinyin: v.pinyin || '',
        meaningHanViet: v.meaningHanViet || '',
        meaningVi: v.meaningVi || '',
        orderIndex: typeof v.orderIndex === 'number' ? v.orderIndex : idx + 1
      }));
      this.initialVocabIds = this.formVocabularies.map(v => v.vocabId);
      this.renderFormVocabs();
    } catch (err) {
      console.warn('[AdminLessons] Could not load detailed vocabularies:', err);
    }
  }

  /**
   * Renders the current list of vocabulary items in the form modal.
   */
  renderFormVocabs() {
    if (!this.elements.formVocabTbody) return;
    clearContainer(this.elements.formVocabTbody);

    if (this.elements.lessonFormVocabCount) {
      this.elements.lessonFormVocabCount.textContent = String(this.formVocabularies.length);
    }

    if (this.formVocabularies.length === 0) {
      const emptyTr = createSafeElement('tr');
      const emptyTd = createSafeElement('td', {
        className: 'text-center text-secondary py-3 small',
        attrs: { colspan: '5' },
        text: 'Chưa có từ vựng nào trong bài học. Hãy tìm kiếm và thêm từ vựng ở trên.'
      });
      emptyTr.appendChild(emptyTd);
      this.elements.formVocabTbody.appendChild(emptyTr);
      return;
    }

    this.formVocabularies.forEach((vocab, idx) => {
      const tr = createSafeElement('tr', {
        attrs: { id: `formVocabRow-${vocab.vocabId}` }
      });

      // STT
      tr.appendChild(createSafeElement('td', {
        className: 'text-center text-muted small',
        text: String(idx + 1)
      }));

      // Hanzi
      tr.appendChild(createSafeElement('td', {
        className: 'font-chinese fw-bold text-chinese-red fs-6',
        text: vocab.hanzi || '—'
      }));

      // Pinyin
      tr.appendChild(createSafeElement('td', {
        className: 'text-secondary small',
        text: vocab.pinyin ? `[${vocab.pinyin}]` : '—'
      }));

      // Meaning
      tr.appendChild(createSafeElement('td', {
        className: 'small text-dark',
        text: vocab.meaningVi || vocab.meaningHanViet || '—'
      }));

      // Actions (Up, Down, Remove)
      const tdActions = createSafeElement('td', {
        className: 'text-end pe-3 text-nowrap'
      });

      const btnGroup = createSafeElement('div', {
        className: 'btn-group btn-group-sm',
        attrs: { role: 'group', 'aria-label': `Sắp xếp từ vựng ${vocab.hanzi}` }
      });

      // Move Up
      const btnUp = createSafeElement('button', {
        className: 'btn btn-outline-secondary btn-sm',
        text: '↑',
        attrs: {
          type: 'button',
          title: 'Di chuyển lên',
          'aria-label': `Di chuyển lên ${vocab.hanzi}`,
          ...(idx === 0 ? { disabled: 'true' } : {})
        }
      });
      if (idx > 0) {
        btnUp.addEventListener('click', () => {
          const temp = this.formVocabularies[idx];
          this.formVocabularies[idx] = this.formVocabularies[idx - 1];
          this.formVocabularies[idx - 1] = temp;
          this.renderFormVocabs();
        });
      }
      btnGroup.appendChild(btnUp);

      // Move Down
      const btnDown = createSafeElement('button', {
        className: 'btn btn-outline-secondary btn-sm',
        text: '↓',
        attrs: {
          type: 'button',
          title: 'Di chuyển xuống',
          'aria-label': `Di chuyển xuống ${vocab.hanzi}`,
          ...(idx === this.formVocabularies.length - 1 ? { disabled: 'true' } : {})
        }
      });
      if (idx < this.formVocabularies.length - 1) {
        btnDown.addEventListener('click', () => {
          const temp = this.formVocabularies[idx];
          this.formVocabularies[idx] = this.formVocabularies[idx + 1];
          this.formVocabularies[idx + 1] = temp;
          this.renderFormVocabs();
        });
      }
      btnGroup.appendChild(btnDown);

      // Remove
      const btnRemove = createSafeElement('button', {
        className: 'btn btn-outline-danger btn-sm',
        text: '✕',
        attrs: {
          type: 'button',
          title: 'Xóa khỏi bài học',
          'aria-label': `Xóa từ vựng ${vocab.hanzi} khỏi bài học`
        }
      });
      btnRemove.addEventListener('click', () => {
        this.formVocabularies.splice(idx, 1);
        this.renderFormVocabs();
      });
      btnGroup.appendChild(btnRemove);

      tdActions.appendChild(btnGroup);
      tr.appendChild(tdActions);

      this.elements.formVocabTbody.appendChild(tr);
    });
  }

  /**
   * Automatically queries vocabulary suggestions as user types.
   */
  async searchVocabAutoSuggestions() {
    const raw = (this.elements.lessonFormVocabSearch?.value || '').trim();
    if (!raw || raw.length < 1) {
      this.clearVocabSearchResults();
      return;
    }

    try {
      const res = await apiClient('/vocabulary', {
        params: { search: raw, size: 6 }
      });
      const data = res.data || res;
      const items = Array.isArray(data.items) ? data.items : [];

      if (!this.elements.lessonFormVocabSearchResults) return;
      clearContainer(this.elements.lessonFormVocabSearchResults);

      if (items.length === 0) {
        const noItem = createSafeElement('div', {
          className: 'list-group-item list-group-item-light small text-muted text-center py-2',
          text: 'Không tìm thấy từ vựng phù hợp'
        });
        this.elements.lessonFormVocabSearchResults.appendChild(noItem);
        this.elements.lessonFormVocabSearchResults.classList.remove('d-none');
        return;
      }

      items.forEach(item => {
        const id = Number(item.vocabId || item.id);
        const exists = this.formVocabularies.some(v => v.vocabId === id);

        const a = createSafeElement('button', {
          className: 'list-group-item list-group-item-action d-flex align-items-center justify-content-between py-2 px-3 small border-0',
          attrs: {
            type: 'button',
            ...(exists ? { disabled: 'true' } : {})
          }
        });

        const left = createSafeElement('div', { className: 'd-flex align-items-center gap-2' });
        left.appendChild(createSafeElement('span', {
          className: 'font-chinese fw-bold text-chinese-red',
          text: item.hanzi || '—'
        }));
        left.appendChild(createSafeElement('span', {
          className: 'text-secondary',
          text: item.pinyin ? `[${item.pinyin}]` : ''
        }));
        left.appendChild(createSafeElement('span', {
          className: 'text-dark',
          text: item.meaningVi || item.meaningHanViet || ''
        }));
        a.appendChild(left);

        const right = createSafeElement('span', {
          className: exists ? 'badge bg-secondary-subtle text-secondary' : 'badge bg-primary-subtle text-primary',
          text: exists ? 'Đã thêm' : '＋ Chọn'
        });
        a.appendChild(right);

        if (!exists) {
          a.addEventListener('click', () => {
            this.addVocabToFormList(item);
          });
        }

        this.elements.lessonFormVocabSearchResults.appendChild(a);
      });

      this.elements.lessonFormVocabSearchResults.classList.remove('d-none');
    } catch (err) {
      console.warn('[AdminLessons] Vocab auto-search failed:', err);
    }
  }

  /**
   * Adds a vocabulary item to the form list.
   *
   * @param {object} item
   */
  addVocabToFormList(item) {
    const id = Number(item.vocabId || item.vocabularyId || item.id);
    if (!id) return;

    if (this.formVocabularies.length >= 20) {
      this.showFormModalError('Bài học chỉ được chứa tối đa 20 từ vựng theo quy chuẩn sư phạm.');
      return;
    }

    if (this.formVocabularies.some(v => v.vocabId === id)) {
      this.showFormModalError('Từ vựng này đã có trong danh sách bài học.');
      return;
    }

    this.hideFormModalError();
    this.formVocabularies.push({
      vocabId: id,
      hanzi: item.hanzi || '',
      pinyin: item.pinyin || '',
      meaningHanViet: item.meaningHanViet || '',
      meaningVi: item.meaningVi || '',
      orderIndex: this.formVocabularies.length + 1
    });

    if (this.elements.lessonFormVocabSearch) {
      this.elements.lessonFormVocabSearch.value = '';
    }
    this.clearVocabSearchResults();
    this.renderFormVocabs();
  }

  /**
   * Handles user explicitly clicking "Thêm vào bài" or pressing enter.
   */
  async handleVocabSearchOrAdd() {
    const raw = (this.elements.lessonFormVocabSearch?.value || '').trim();
    if (!raw) return;

    const numId = parseInt(raw, 10);
    if (!isNaN(numId) && numId > 0 && String(numId) === raw) {
      try {
        const res = await apiClient(`/vocabulary/${numId}`);
        const vocab = res.data || res;
        this.addVocabToFormList(vocab);
        return;
      } catch {
        // Fallback to text query
      }
    }

    try {
      const res = await apiClient('/vocabulary', { params: { search: raw, size: 10 } });
      const data = res.data || res;
      const items = Array.isArray(data.items) ? data.items : [];
      if (items.length === 1) {
        this.addVocabToFormList(items[0]);
      } else if (items.length > 1) {
        this.searchVocabAutoSuggestions();
      } else {
        this.showFormModalError(`Không tìm thấy từ vựng nào khớp với "${raw}".`);
      }
    } catch (err) {
      this.showFormModalError(err?.message || 'Không thể tìm kiếm từ vựng.');
    }
  }

  clearVocabSearchResults() {
    if (this.elements.lessonFormVocabSearchResults) {
      clearContainer(this.elements.lessonFormVocabSearchResults);
      this.elements.lessonFormVocabSearchResults.classList.add('d-none');
    }
  }

  showFormModalError(message) {
    if (this.elements.lessonFormModalError) {
      this.elements.lessonFormModalError.textContent = message;
      this.elements.lessonFormModalError.classList.remove('d-none');
    }
  }

  hideFormModalError() {
    if (this.elements.lessonFormModalError) {
      this.elements.lessonFormModalError.textContent = '';
      this.elements.lessonFormModalError.classList.add('d-none');
    }
  }

  /**
   * Saves lesson form (Creates new or updates existing).
   */
  async handleSaveLessonForm() {
    const title = (this.elements.lessonFormTitleInput?.value || '').trim();
    if (!title) {
      this.showFormModalError('Vui lòng nhập tiêu đề bài học.');
      if (this.elements.lessonFormTitleInput) this.elements.lessonFormTitleInput.focus();
      return;
    }

    if (title.length > 200) {
      this.showFormModalError('Tiêu đề bài học không được vượt quá 200 ký tự.');
      return;
    }

    if (this.elements.saveLessonFormSpinner) this.elements.saveLessonFormSpinner.classList.remove('d-none');
    if (this.elements.btnSaveLessonForm) this.elements.btnSaveLessonForm.disabled = true;

    try {
      if (this.editingLesson) {
        const lessonId = this.editingLesson.lessonId;

        // 1. Update Title if changed
        if (title !== this.editingLesson.title) {
          await apiClient(`/admin/lessons/${lessonId}`, {
            method: 'PUT',
            body: { title }
          });
          this.editingLesson.title = title;
        }

        // 2. Sync Vocabularies incrementally so retries never re-send already added/removed items
        const currentIds = this.formVocabularies.map(v => v.vocabId);
        const toRemove = this.initialVocabIds.filter(id => !currentIds.includes(id));
        const toAdd = currentIds.filter(id => !this.initialVocabIds.includes(id));

        for (const remId of toRemove) {
          await apiClient(`/admin/lessons/${lessonId}/vocabularies/${remId}`, {
            method: 'DELETE'
          });
          this.initialVocabIds = this.initialVocabIds.filter(id => id !== remId);
        }

        for (const addId of toAdd) {
          await apiClient(`/admin/lessons/${lessonId}/vocabularies/${addId}`, {
            method: 'POST'
          });
          if (!this.initialVocabIds.includes(addId)) {
            this.initialVocabIds.push(addId);
          }
        }

        // 3. Reorder if more than 1 vocab
        if (currentIds.length > 0) {
          await apiClient(`/admin/lessons/${lessonId}/reorder`, {
            method: 'PUT',
            body: {
              orderedVocabIds: currentIds,
              orderedVocabularyIds: currentIds
            }
          });
          this.initialVocabIds = [...currentIds];
        }

        showToast('Cập nhật bài học thành công', 'success');
        this.closeModal(this.elements.lessonFormModal);
        await this.loadLessons();

      } else {
        // Create Mode: Direct create and auto-publish
        const currentIds = this.formVocabularies.map(v => v.vocabId);
        const createRes = await apiClient('/admin/lessons', {
          method: 'POST',
          body: { title, vocabularyIds: currentIds }
        });
        const createdData = createRes.data || createRes;
        const newLessonId = createdData.lessonId || (createdData.data && createdData.data.lessonId);
        const alreadySavedVocabCount = Array.isArray(createdData.vocabularies)
          ? createdData.vocabularies.length
          : (createdData.vocabularyCount || 0);

        // Add vocabularies if backend/demo did not already attach them during POST /admin/lessons
        if (newLessonId && currentIds.length > 0 && alreadySavedVocabCount === 0) {
          for (const vocabId of currentIds) {
            await apiClient(`/admin/lessons/${newLessonId}/vocabularies/${vocabId}`, {
              method: 'POST'
            });
          }
          if (currentIds.length > 1) {
            await apiClient(`/admin/lessons/${newLessonId}/reorder`, {
              method: 'PUT',
              body: {
                orderedVocabIds: currentIds,
                orderedVocabularyIds: currentIds
              }
            });
          }
        }

        showToast('Đã tạo bài học mới thành công', 'success');
        this.closeModal(this.elements.lessonFormModal);
        await this.loadLessons();
      }

    } catch (err) {
      this.showFormModalError(err?.message || 'Không thể lưu bài học. Vui lòng thử lại.');
    } finally {
      if (this.elements.saveLessonFormSpinner) this.elements.saveLessonFormSpinner.classList.add('d-none');
      if (this.elements.btnSaveLessonForm) this.elements.btnSaveLessonForm.disabled = false;
    }
  }

  /* ---------------------------------------------------------------------------
   * 4. MODAL 2: IMPORT LESSON FROM EXCEL MODAL
   * --------------------------------------------------------------------------- */

  /**
   * Opens the import from excel modal.
   */
  openImportExcelModal() {
    if (!this.elements.importExcelModal) return;

    this.previewReport = null;

    if (this.elements.importExcelFileInput) {
      this.elements.importExcelFileInput.value = '';
    }
    if (this.elements.importExcelTitleInput) {
      this.elements.importExcelTitleInput.value = '';
    }
    if (this.elements.importExcelPreviewArea) {
      this.elements.importExcelPreviewArea.classList.add('d-none');
    }
    if (this.elements.importExcelModalError) {
      this.elements.importExcelModalError.classList.add('d-none');
      this.elements.importExcelModalError.textContent = '';
    }
    if (this.elements.btnConfirmImportExcel) {
      this.elements.btnConfirmImportExcel.disabled = false;
    }

    this.showDialog(this.elements.importExcelModal);
  }

  /**
   * Previews the uploaded Excel file.
   */
  async handlePreviewImportExcel() {
    const file = this.elements.importExcelFileInput?.files?.[0];
    if (!file) {
      this.showImportModalError('Vui lòng chọn tệp bảng tính Excel (.xlsx).');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      this.showImportModalError('Định dạng tệp không hợp lệ. Chỉ chấp nhận tệp .xlsx.');
      return;
    }

    if (this.elements.previewImportSpinner) this.elements.previewImportSpinner.classList.remove('d-none');
    if (this.elements.btnPreviewImportExcel) this.elements.btnPreviewImportExcel.disabled = true;
    this.hideImportModalError();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient('/admin/lessons/import', {
        method: 'POST',
        body: formData
      });
      const report = res.data || res;
      this.previewReport = report;

      const totalRows = report.totalRows ?? 0;
      const validRows = report.validRows ?? report.validRowsCount ?? 0;
      const invalidRows = report.invalidRows ?? report.invalidRowsCount ?? 0;
      const previewItems = Array.isArray(report.items)
        ? report.items
        : (Array.isArray(report.rows) ? report.rows : []);

      if (this.elements.importTotalRows) {
        this.elements.importTotalRows.textContent = String(totalRows);
      }
      if (this.elements.importValidRows) {
        this.elements.importValidRows.textContent = String(validRows);
      }
      if (this.elements.importInvalidRows) {
        this.elements.importInvalidRows.textContent = String(invalidRows);
      }

      if (this.elements.importPreviewBadge) {
        const isValid = report.allValid !== undefined ? Boolean(report.allValid) : (!invalidRows || invalidRows === 0);
        this.elements.importPreviewBadge.className = isValid ? 'badge bg-success' : 'badge bg-warning text-dark';
        this.elements.importPreviewBadge.textContent = isValid ? 'Hợp lệ' : 'Có cảnh báo';
      }

      if (this.elements.importPreviewSampleContainer) {
        clearContainer(this.elements.importPreviewSampleContainer);
        if (previewItems.length > 0) {
          const sampleText = previewItems.slice(0, 5).map(it => `${it.hanzi || '—'} [${it.pinyin || '—'}] : ${it.meaningVi || '—'}`).join(' • ');
          this.elements.importPreviewSampleContainer.textContent = `Xem trước: ${sampleText}`;
        } else if (Array.isArray(report.errors) && report.errors.length > 0) {
          const errText = report.errors.slice(0, 3).map(err => {
            if (typeof err === 'string') return err;
            return `Dòng ${err.rowNumber || '?'}: ${err.message || err.errorCode || 'Lỗi dữ liệu'}`;
          }).join('; ');
          this.elements.importPreviewSampleContainer.textContent = `Lỗi: ${errText}`;
        }
      }

      if (this.elements.importExcelPreviewArea) {
        this.elements.importExcelPreviewArea.classList.remove('d-none');
      }

    } catch (err) {
      this.showImportModalError(err?.message || 'Không thể xem trước tệp Excel. Vui lòng kiểm tra định dạng.');
    } finally {
      if (this.elements.previewImportSpinner) this.elements.previewImportSpinner.classList.add('d-none');
      if (this.elements.btnPreviewImportExcel) this.elements.btnPreviewImportExcel.disabled = false;
    }
  }

  /**
   * Confirms Excel file import and lesson creation.
   */
  async handleConfirmImportExcel() {
    const file = this.elements.importExcelFileInput?.files?.[0];
    const title = (this.elements.importExcelTitleInput?.value || '').trim();

    if (!file) {
      this.showImportModalError('Vui lòng chọn tệp bảng tính Excel (.xlsx).');
      return;
    }

    if (!title) {
      this.showImportModalError('Vui lòng nhập tiêu đề bài học.');
      if (this.elements.importExcelTitleInput) this.elements.importExcelTitleInput.focus();
      return;
    }

    if (this.elements.confirmImportSpinner) this.elements.confirmImportSpinner.classList.remove('d-none');
    if (this.elements.btnConfirmImportExcel) this.elements.btnConfirmImportExcel.disabled = true;
    this.hideImportModalError();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    try {
      await apiClient('/admin/lessons/import/confirm', {
        method: 'POST',
        body: formData
      });

      showToast('Đã nhập bài học từ Excel thành công', 'success');
      this.closeModal(this.elements.importExcelModal);
      await this.loadLessons();
    } catch (err) {
      this.showImportModalError(err?.message || 'Không thể nhập bài học từ Excel. Vui lòng thử lại.');
    } finally {
      if (this.elements.confirmImportSpinner) this.elements.confirmImportSpinner.classList.add('d-none');
      if (this.elements.btnConfirmImportExcel) this.elements.btnConfirmImportExcel.disabled = false;
    }
  }

  showImportModalError(message) {
    if (this.elements.importExcelModalError) {
      this.elements.importExcelModalError.textContent = message;
      this.elements.importExcelModalError.classList.remove('d-none');
    }
  }

  hideImportModalError() {
    if (this.elements.importExcelModalError) {
      this.elements.importExcelModalError.textContent = '';
      this.elements.importExcelModalError.classList.add('d-none');
    }
  }

  /* ---------------------------------------------------------------------------
   * 5. MODAL 3: DELETE LESSON CONFIRMATION MODAL
   * --------------------------------------------------------------------------- */

  /**
   * Opens the delete lesson confirmation modal.
   *
   * @param {object} lesson
   */
  openDeleteLessonModal(lesson) {
    if (!this.elements.deleteLessonModal) return;

    this.targetLessonForDelete = lesson;

    if (this.elements.deleteLessonTargetTitle) {
      this.elements.deleteLessonTargetTitle.textContent = lesson.title || 'Bài học không tên';
    }
    if (this.elements.deleteLessonTargetId) {
      this.elements.deleteLessonTargetId.textContent = `#${lesson.lessonId}`;
    }
    if (this.elements.deleteLessonTargetVocabCount) {
      this.elements.deleteLessonTargetVocabCount.textContent = String(lesson.vocabularyCount || 0);
    }
    if (this.elements.deleteLessonModalError) {
      this.elements.deleteLessonModalError.classList.add('d-none');
      this.elements.deleteLessonModalError.textContent = '';
    }
    if (this.elements.deleteLessonBtnSpinner) {
      this.elements.deleteLessonBtnSpinner.classList.add('d-none');
    }
    if (this.elements.btnConfirmDeleteLesson) {
      this.elements.btnConfirmDeleteLesson.disabled = false;
    }

    this.showDialog(this.elements.deleteLessonModal);
  }

  /**
   * Confirms permanent deletion of the lesson.
   */
  async handleConfirmDeleteLesson() {
    if (!this.targetLessonForDelete) return;

    const lessonId = this.targetLessonForDelete.lessonId;
    if (this.elements.deleteLessonBtnSpinner) this.elements.deleteLessonBtnSpinner.classList.remove('d-none');
    if (this.elements.btnConfirmDeleteLesson) this.elements.btnConfirmDeleteLesson.disabled = true;

    try {
      await apiClient(`/admin/lessons/${lessonId}`, {
        method: 'DELETE'
      });

      showToast('Đã xóa bài học vĩnh viễn thành công', 'success');
      this.closeModal(this.elements.deleteLessonModal);
      if (this.currentLessons && this.currentLessons.length === 1 && this.currentPage > 0) {
        this.currentPage--;
      }
      await this.loadLessons();
    } catch (err) {
      if (this.elements.deleteLessonModalError) {
        this.elements.deleteLessonModalError.textContent = err?.message || 'Không thể xóa bài học. Vui lòng thử lại.';
        this.elements.deleteLessonModalError.classList.remove('d-none');
      }
    } finally {
      if (this.elements.deleteLessonBtnSpinner) this.elements.deleteLessonBtnSpinner.classList.add('d-none');
      if (this.elements.btnConfirmDeleteLesson) this.elements.btnConfirmDeleteLesson.disabled = false;
    }
  }

  /* ---------------------------------------------------------------------------
   * 6. DIALOG MANAGEMENT HELPERS
   * --------------------------------------------------------------------------- */

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
}

// Auto-initialize on DOM ready in browser
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const controller = new AdminLessonsPageController();
    controller.init();
  });
}
