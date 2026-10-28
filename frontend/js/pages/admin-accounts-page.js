/**
 * =============================================================================
 * ADMIN ACCOUNTS LIFECYCLE CONTROLLER (TASK 9F.1)
 * Module: frontend/js/pages/admin-accounts-page.js
 * 
 * Responsibilities:
 * - Authoritative administrative integration with Spring Boot:
 *   * GET /api/v1/admin/accounts (pageable, status, search)
 *   * PUT /api/v1/admin/accounts/{id}/status
 * - Role-guarded UX: strictly accessible to 'Admin' (authManager.hasRole('Admin')).
 * - Server-side pagination mapping PageResponse<AccountResponse> contract.
 * - Dynamic search supporting email, phone, and full name with input trimming.
 * - Status filtering: 'Active', 'Inactive', 'Banned', or All.
 * - Native <dialog> confirmation modal for account status transitions.
 * - Accurate token invalidation disclosure via server-side authorization version (DEC-42).
 * - Self-protection defense-in-depth (POL-8D-01): Disables self-deactivation in UI.
 * - Safe DOM construction (zero unsafe innerHTML) defending against XSS.
 * - Three-state UI (Loading / Empty / Error with retry callback).
 * - Non-blocking Toast notifications for administrative feedback.
 * =============================================================================
 */

import { apiClient, ApiError } from '../api/api.js';
import { authManager } from '../auth/auth-state.js';
import { initNavbarAuth, getRoleLabel, getRoleBadgeClass } from '../ui/nav.js';
import { createSafeElement, clearContainer } from '../ui/security.js';
import { setComponentState, showToast } from '../ui/ui.js';

/* -----------------------------------------------------------------------------
 * 1. PURE LOGIC & UTILITY HELPERS (Exported for Unit Testability)
 * ----------------------------------------------------------------------------- */

/**
 * Checks whether the current authenticated session has administrative access.
 * Strict Invariant: JSON role representation is 'Admin' (rejects 'ROLE_' prefixes).
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
 * Determines whether a target account represents the currently authenticated administrator.
 * Matches by accountId (if available) or normalized emailOrPhone.
 * 
 * @param {object|null|undefined} targetAccount - AccountResponse item
 * @param {object|null|undefined} currentUser - User identity from authManager.getUser()
 * @returns {boolean}
 */
export function isSelfAccount(targetAccount, currentUser) {
  if (!targetAccount || !currentUser) {
    return false;
  }

  // Compare by account ID if both are available
  if (targetAccount.accountId !== undefined && targetAccount.accountId !== null &&
      currentUser.accountId !== undefined && currentUser.accountId !== null) {
    if (Number(targetAccount.accountId) === Number(currentUser.accountId)) {
      return true;
    }
  }

  // Compare by normalized email or phone
  const targetEmail = typeof targetAccount.emailOrPhone === 'string' ? targetAccount.emailOrPhone.trim().toLowerCase() : '';
  const currentEmail = typeof currentUser.emailOrPhone === 'string' ? currentUser.emailOrPhone.trim().toLowerCase() : '';

  return targetEmail.length > 0 && currentEmail.length > 0 && targetEmail === currentEmail;
}

/**
 * Safely parses and normalizes a single AccountResponse item.
 * Defensively handles @JsonInclude(NON_NULL) omissions.
 * 
 * @param {any} item 
 * @returns {{
 *   accountId: number,
 *   emailOrPhone: string,
 *   fullName: string|null,
 *   status: string,
 *   roles: string[],
 *   createdAt: string|null,
 *   updatedAt: string|null
 * }}
 */
export function parseAccountResponse(item) {
  if (!item || typeof item !== 'object') {
    return {
      accountId: 0,
      emailOrPhone: '',
      fullName: null,
      status: 'Inactive',
      roles: [],
      createdAt: null,
      updatedAt: null
    };
  }

  const rawStatus = typeof item.status === 'string' ? item.status.trim() : '';
  let normalizedStatus = 'Inactive';
  if (/^active$/i.test(rawStatus)) normalizedStatus = 'Active';
  else if (/^banned$/i.test(rawStatus)) normalizedStatus = 'Banned';
  else if (/^inactive$/i.test(rawStatus)) normalizedStatus = 'Inactive';

  return {
    accountId: Math.max(0, Number(item.accountId) || 0),
    emailOrPhone: typeof item.emailOrPhone === 'string' ? item.emailOrPhone.trim() : '',
    fullName: typeof item.fullName === 'string' && item.fullName.trim().length > 0 ? item.fullName.trim() : null,
    status: normalizedStatus,
    roles: Array.isArray(item.roles) ? [...item.roles] : [],
    createdAt: typeof item.createdAt === 'string' && item.createdAt.trim().length > 0 ? item.createdAt.trim() : null,
    updatedAt: typeof item.updatedAt === 'string' && item.updatedAt.trim().length > 0 ? item.updatedAt.trim() : null
  };
}

/**
 * Safely parses backend PageResponse<AccountResponse> payload.
 * 
 * @param {any} envelopeOrData 
 * @returns {{
 *   items: Array<ReturnType<typeof parseAccountResponse>>,
 *   page: number,
 *   size: number,
 *   totalElements: number,
 *   totalPages: number
 * }}
 */
export function parseAccountsPageResponse(envelopeOrData) {
  if (!envelopeOrData || typeof envelopeOrData !== 'object') {
    return { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 };
  }

  const data = (envelopeOrData.data && typeof envelopeOrData.data === 'object')
    ? envelopeOrData.data
    : envelopeOrData;

  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items = rawItems.map(parseAccountResponse);

  const page = Math.max(0, Number(data.page) || 0);
  const size = Math.max(1, Number(data.size) || 20);
  const totalElements = typeof data.totalElements === 'number' ? Math.max(0, data.totalElements) : items.length;
  const totalPages = typeof data.totalPages === 'number' ? Math.max(0, data.totalPages) : (totalElements > 0 ? Math.ceil(totalElements / size) : 0);

  return { items, page, size, totalElements, totalPages };
}

/**
 * Constructs clean query parameters for GET /api/v1/admin/accounts.
 * Omits empty, null, or undefined keys to match backend semantics.
 * 
 * @param {object} params
 * @param {number} [params.page=0]
 * @param {number} [params.size=20]
 * @param {string} [params.status='']
 * @param {string} [params.search='']
 * @returns {Record<string, string|number>}
 */
export function buildAccountsQueryParams({ page = 0, size = 20, status = '', search = '' } = {}) {
  const numericPage = (page !== undefined && page !== null && !isNaN(Number(page))) ? Number(page) : 0;
  const numericSize = (size !== undefined && size !== null && !isNaN(Number(size))) ? Number(size) : 20;

  const query = {
    page: Math.max(0, numericPage),
    size: Math.max(1, numericSize)
  };

  if (status && typeof status === 'string') {
    const trimmedStatus = status.trim();
    if (['Active', 'Inactive', 'Banned'].includes(trimmedStatus)) {
      query.status = trimmedStatus;
    }
  }

  if (search && typeof search === 'string') {
    const trimmedSearch = search.trim();
    if (trimmedSearch.length > 0) {
      query.search = trimmedSearch;
    }
  }

  return query;
}

/**
 * Returns scholarly Vietnamese label and design-token CSS badge class for an account status.
 * 
 * @param {string|null|undefined} status 
 * @returns {{ label: string, badgeClass: string }}
 */
export function getStatusBadgeMeta(status) {
  switch (status) {
    case 'Active':
      return {
        label: 'Hoạt động',
        badgeClass: 'badge-status badge-status-active'
      };
    case 'Inactive':
      return {
        label: 'Tạm khóa',
        badgeClass: 'badge-status badge-status-inactive'
      };
    case 'Banned':
      return {
        label: 'Bị cấm',
        badgeClass: 'badge-status badge-status-banned'
      };
    default:
      return {
        label: status || 'Không rõ',
        badgeClass: 'badge-status badge-status-draft'
      };
  }
}

/**
 * Formats an ISO datetime string into human-friendly Vietnamese format (DD/MM/YYYY HH:mm).
 * Preserves audit timestamp accuracy.
 * 
 * @param {string|null|undefined} isoString 
 * @returns {string}
 */
export function formatAccountDateTime(isoString) {
  if (!isoString || typeof isoString !== 'string') {
    return '—';
  }
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return isoString;
    }
    const pad = (num) => String(num).padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (_) {
    return isoString;
  }
}

/**
 * Computes accessible pagination pages list for rendering.
/**
 * Computes accessible pagination pages list for rendering.
 * Supports both:
 * 1. 5-argument form: (page, size, totalElements, totalPages, maxButtons = 5) returning pagination calculation object.
 * 2. Legacy 2/3-argument form: (currentPage, totalPages, maxVisible = 5) returning array of page numbers and ellipsis.
 */
export function calculatePagination(currentPageOrPage, totalPagesOrSize, maxVisibleOrTotalElements, maybeTotalPages, maybeMaxButtons = 5) {
  // If called with 4 or 5 arguments: (page, size, totalElements, totalPages, maxButtons = 5)
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

  // Legacy 2 or 3 arguments: (currentPage, totalPages, maxVisible = 5)
  const currentPage = currentPageOrPage;
  const totalPages = totalPagesOrSize;
  const maxVisible = maxVisibleOrTotalElements !== undefined ? maxVisibleOrTotalElements : 5;

  if (totalPages <= 0) return [];
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages = [];
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(0, currentPage - half);
  let end = Math.min(totalPages - 1, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(0, end - maxVisible + 1);
  }

  if (start > 0) {
    pages.push(0);
    if (start > 1) {
      pages.push('...');
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages - 1) {
    if (end < totalPages - 2) {
      pages.push('...');
    }
    pages.push(totalPages - 1);
  }

  return pages;
}

/* -----------------------------------------------------------------------------
 * 2. ADMIN ACCOUNTS PAGE CONTROLLER
 * ----------------------------------------------------------------------------- */

export class AdminAccountsController {
  constructor() {
    this.currentPage = 0;
    this.pageSize = 20;
    this.currentStatus = '';
    this.searchQuery = '';
    this.currentAccounts = [];
    this.totalElements = 0;
    this.totalPages = 0;

    this.activeAccountForMutation = null;
    this.isSubmitting = false;
    this.activeElementBeforeOpen = null;

    this.dom = {};
  }

  /**
   * Initializes the page controller, caches DOM nodes, and verifies authentication.
   */
  async init() {
    this.cacheDomElements();

    // 1. Role Guard & Authentication Evaluation
    if (!authManager.isAuthenticated()) {
      this.handleUnauthenticated();
      return;
    }

    if (!hasAdminAccess(authManager)) {
      this.handleForbidden();
      return;
    }

    // 2. Authenticated Admin Session Confirmed
    this.dom.adminAuthGuardContainer?.classList.add('d-none');
    this.dom.workspaceSection?.classList.remove('d-none');

    // Authoritative session navbar
    initNavbarAuth('navAuthContainer');

    // 3. Bind UI Event Listeners
    this.bindEvents();

    // 4. Load initial account records
    await this.loadAccounts();
  }

  /**
   * Caches critical DOM references.
   */
  cacheDomElements() {
    this.dom = {
      adminAuthGuardContainer: document.getElementById('adminAuthGuardContainer'),
      adminAuthGuardMessage: document.getElementById('adminAuthGuardMessage'),
      workspaceSection: document.getElementById('adminAccountsWorkspaceSection'),
      resultCountBadge: document.getElementById('accountResultCountBadge'),
      
      searchInput: document.getElementById('accountSearchInput'),
      btnSearch: document.getElementById('btnAccountSearch'),
      btnClearSearch: document.getElementById('btnAccountClearSearch'),
      statusFilterSelect: document.getElementById('statusFilterSelect'),
      pageSizeSelect: document.getElementById('pageSizeSelect'),
      
      stateContainer: document.getElementById('accountStateContainer'),
      tableContainer: document.getElementById('accountsTableContainer'),
      table: document.getElementById('accountsTable'),
      tableBody: document.getElementById('accountsTableBody'),
      
      paginationNav: document.getElementById('accountsPaginationNav'),
      paginationSummary: document.getElementById('accountsPaginationSummary'),
      paginationList: document.getElementById('accountsPaginationList'),
      
      statusModal: document.getElementById('statusConfirmModal'),
      btnCloseModal: document.getElementById('btnCloseStatusModal'),
      btnCancelModal: document.getElementById('btnCancelStatusModal'),
      btnConfirmUpdate: document.getElementById('btnConfirmStatusUpdate'),
      
      modalTargetEmail: document.getElementById('modalTargetEmail'),
      modalTargetFullName: document.getElementById('modalTargetFullName'),
      modalTargetAccountId: document.getElementById('modalTargetAccountId'),
      modalCurrentStatusBadge: document.getElementById('modalCurrentStatusBadge'),
      modalNewStatusSelect: document.getElementById('modalNewStatusSelect'),
      modalStatusSelectGroup: document.getElementById('modalStatusSelectGroup'),
      modalWarningNotice: document.getElementById('statusModalWarningNotice'),
      modalSelfProtectionNotice: document.getElementById('statusModalSelfProtectionNotice'),
      modalError: document.getElementById('statusModalError'),

      // Reset Password Modal
      resetPasswordModal: document.getElementById('resetPasswordModal'),
      btnCloseResetPasswordModal: document.getElementById('btnCloseResetPasswordModal'),
      btnCancelResetPasswordModal: document.getElementById('btnCancelResetPasswordModal'),
      btnConfirmResetPassword: document.getElementById('btnConfirmResetPassword'),
      resetModalTargetEmail: document.getElementById('resetModalTargetEmail'),
      resetModalTargetInfo: document.getElementById('resetModalTargetInfo'),
      resetPasswordConfirmSection: document.getElementById('resetPasswordConfirmSection'),
      resetPasswordResultSection: document.getElementById('resetPasswordResultSection'),
      temporaryPasswordDisplay: document.getElementById('temporaryPasswordDisplay'),
      btnCopyTemporaryPassword: document.getElementById('btnCopyTemporaryPassword'),
      resetModalError: document.getElementById('resetModalError')
    };
  }

  /**
   * Handles unauthenticated guest state.
   */
  handleUnauthenticated() {
    if (this.dom.adminAuthGuardContainer) {
      this.dom.adminAuthGuardContainer.classList.remove('d-none');
      if (this.dom.adminAuthGuardMessage) {
        this.dom.adminAuthGuardMessage.textContent = 'Bạn cần đăng nhập với tài khoản Quản trị viên (Admin) để truy cập trang này.';
      }
    }
    if (this.dom.workspaceSection) {
      this.dom.workspaceSection.classList.add('d-none');
    }
    // Redirect if in real browser environment
    if (typeof window !== 'undefined' && window.location) {
      const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}` || 'admin-accounts.html';
      window.location.href = `login.html?redirect=${encodeURIComponent(returnUrl)}`;
    }
  }

  /**
   * Handles authenticated non-Admin session.
   */
  handleForbidden() {
    if (this.dom.adminAuthGuardContainer) {
      this.dom.adminAuthGuardContainer.classList.remove('d-none');
      if (this.dom.adminAuthGuardMessage) {
        this.dom.adminAuthGuardMessage.textContent = 'Tài khoản của bạn không có vai trò Quản trị viên (Admin). Quyền truy cập bị từ chối.';
      }
    }
    if (this.dom.workspaceSection) {
      this.dom.workspaceSection.classList.add('d-none');
    }
  }

  /**
   * Binds interactive DOM listeners for search, filter, pagination, and modal dialog.
   */
  bindEvents() {
    // Search form submission
    this.dom.btnSearch?.addEventListener('click', () => this.handleSearch());
    this.dom.searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleSearch();
      }
    });

    // Clear search
    this.dom.btnClearSearch?.addEventListener('click', () => {
      if (this.dom.searchInput) {
        this.dom.searchInput.value = '';
      }
      this.handleSearch();
    });

    // Status filter dropdown
    this.dom.statusFilterSelect?.addEventListener('change', (e) => {
      this.currentStatus = e.target.value;
      this.currentPage = 0;
      this.loadAccounts();
    });

    // Page size dropdown
    this.dom.pageSizeSelect?.addEventListener('change', (e) => {
      this.pageSize = Math.max(1, Number(e.target.value) || 20);
      this.currentPage = 0;
      this.loadAccounts();
    });

    // Modal close and cancel handlers
    this.dom.btnCloseModal?.addEventListener('click', () => this.closeStatusModal());
    this.dom.btnCancelModal?.addEventListener('click', () => this.closeStatusModal());

    // Native dialog cancel event (Escape key)
    this.dom.statusModal?.addEventListener('cancel', (e) => {
      e.preventDefault();
      this.closeStatusModal();
    });

    // Dialog backdrop click
    this.dom.statusModal?.addEventListener('click', (e) => {
      if (e.target === this.dom.statusModal) {
        this.closeStatusModal();
      }
    });

    // Modal confirmation submission
    this.dom.btnConfirmUpdate?.addEventListener('click', () => this.submitStatusUpdate());

    // Reset Password Modal listeners
    this.dom.btnCloseResetPasswordModal?.addEventListener('click', () => this.closeResetPasswordModal());
    this.dom.btnCancelResetPasswordModal?.addEventListener('click', () => this.closeResetPasswordModal());
    this.dom.resetPasswordModal?.addEventListener('cancel', (e) => {
      e.preventDefault();
      this.closeResetPasswordModal();
    });
    this.dom.resetPasswordModal?.addEventListener('click', (e) => {
      if (e.target === this.dom.resetPasswordModal) {
        this.closeResetPasswordModal();
      }
    });
    this.dom.btnConfirmResetPassword?.addEventListener('click', () => this.submitResetPassword());
    this.dom.btnCopyTemporaryPassword?.addEventListener('click', () => this.copyTemporaryPassword());
  }

  /**
   * Triggers a search with the current input value.
   */
  handleSearch() {
    const rawVal = this.dom.searchInput?.value || '';
    this.searchQuery = rawVal.trim();
    this.currentPage = 0;
    this.loadAccounts();
  }

  /**
   * Loads accounts from backend with current query parameters.
   */
  async loadAccounts() {
    if (this.dom.tableContainer) {
      this.dom.tableContainer.classList.add('d-none');
    }
    if (this.dom.paginationNav) {
      this.dom.paginationNav.classList.add('d-none');
    }

    setComponentState(this.dom.stateContainer, 'LOADING', {
      message: 'Đang tải danh sách tài khoản người dùng...'
    });

    if (this.dom.resultCountBadge) {
      this.dom.resultCountBadge.textContent = 'Đang tải...';
    }

    const queryParams = buildAccountsQueryParams({
      page: this.currentPage,
      size: this.pageSize,
      status: this.currentStatus,
      search: this.searchQuery
    });

    try {
      const response = await apiClient('/admin/accounts', { params: queryParams });
      const parsed = parseAccountsPageResponse(response);

      this.currentAccounts = parsed.items;
      this.totalElements = parsed.totalElements;
      this.totalPages = parsed.totalPages;
      this.currentPage = parsed.page;

      this.updateResultCountBadge();

      if (parsed.items.length === 0) {
        let emptyDesc = 'Không tìm thấy tài khoản người dùng nào.';
        if (this.searchQuery || this.currentStatus) {
          emptyDesc = 'Không có tài khoản nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại.';
        }
        setComponentState(this.dom.stateContainer, 'EMPTY', {
          title: 'Chưa có tài khoản',
          description: emptyDesc,
          actionText: (this.searchQuery || this.currentStatus) ? 'Xóa bộ lọc' : null,
          onAction: (this.searchQuery || this.currentStatus) ? () => this.resetFilters() : null
        });
        return;
      }

      setComponentState(this.dom.stateContainer, 'READY');
      this.renderTable(parsed.items);
      this.renderPagination();

    } catch (err) {
      console.error('[AdminAccounts] Failed to fetch accounts:', err);
      let errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại.';
      if (err instanceof ApiError) {
        if (err.status === 401) {
          errorMessage = 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (err.status === 403) {
          errorMessage = 'Bạn không có quyền thực hiện thao tác này (Yêu cầu vai trò Admin).';
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

      setComponentState(this.dom.stateContainer, 'ERROR', {
        title: 'Lỗi tải danh sách tài khoản',
        message: errorMessage,
        retryText: 'Thử lại',
        onRetry: () => this.loadAccounts()
      });
    }
  }

  /**
   * Resets all search and status filters to defaults.
   */
  resetFilters() {
    if (this.dom.searchInput) this.dom.searchInput.value = '';
    if (this.dom.statusFilterSelect) this.dom.statusFilterSelect.value = '';
    this.searchQuery = '';
    this.currentStatus = '';
    this.currentPage = 0;
    this.loadAccounts();
  }

  /**
   * Updates the summary result count badge.
   */
  updateResultCountBadge() {
    if (!this.dom.resultCountBadge) return;
    this.dom.resultCountBadge.textContent = `${this.totalElements} tài khoản`;
  }

  /**
   * Renders the account items table safely using standard DOM APIs.
   * 
   * @param {Array<ReturnType<typeof parseAccountResponse>>} items 
   */
  renderTable(items) {
    if (!this.dom.tableBody || !this.dom.tableContainer) return;

    clearContainer(this.dom.tableBody);
    const currentUser = authManager.getUser();

    items.forEach(account => {
      const row = this.createAccountTableRow(account, currentUser);
      this.dom.tableBody.appendChild(row);
    });

    this.dom.tableContainer.classList.remove('d-none');
  }

  /**
   * Constructs a single safe table row <tr> for an account.
   * 
   * @param {ReturnType<typeof parseAccountResponse>} account 
   * @param {object|null} currentUser 
   * @returns {HTMLTableRowElement}
   */
  createAccountTableRow(account, currentUser) {
    const tr = document.createElement('tr');
    tr.id = `accountRow_${account.accountId}`;

    const isCurrentAdmin = isSelfAccount(account, currentUser);

    // 1. ID Cell
    const tdId = createSafeElement('td', {
      className: 'py-3 px-3 text-center text-muted font-monospace small',
      attrs: { 'data-label': 'ID' },
      text: `#${account.accountId}`
    });

    // 2. Email / Phone Cell
    const emailWrapperChildren = [
      createSafeElement('span', {
        className: 'fw-semibold text-dark text-break',
        text: account.emailOrPhone || '—'
      })
    ];

    if (isCurrentAdmin) {
      emailWrapperChildren.push(
        createSafeElement('span', {
          className: 'badge bg-secondary ms-2 small',
          text: 'Tài khoản của bạn',
          attrs: { 'title': 'Tài khoản Admin hiện đang đăng nhập' }
        })
      );
    }

    const tdEmail = createSafeElement('td', {
      className: 'py-3 px-3',
      attrs: { 'data-label': 'Tài khoản' },
      children: [
        createSafeElement('div', {
          className: 'd-flex align-items-center flex-wrap gap-1',
          children: emailWrapperChildren
        })
      ]
    });

    // 3. Full Name Cell
    const tdFullName = createSafeElement('td', {
      className: 'py-3 px-3 text-secondary small',
      attrs: { 'data-label': 'Họ và tên' },
      text: account.fullName || '—'
    });

    // 4. Roles Cell
    const roleBadges = account.roles.map(role => {
      return createSafeElement('span', {
        className: `${getRoleBadgeClass(role)} me-1`,
        text: getRoleLabel(role)
      });
    });

    const tdRoles = createSafeElement('td', {
      className: 'py-3 px-3',
      attrs: { 'data-label': 'Vai trò' },
      children: [
        createSafeElement('div', {
          className: 'd-flex flex-wrap gap-1 align-items-center',
          children: roleBadges.length > 0 ? roleBadges : [
            createSafeElement('span', {
              className: 'badge-status badge-status-draft',
              text: 'Chưa có'
            })
          ]
        })
      ]
    });

    // 5. Status Cell
    const statusMeta = getStatusBadgeMeta(account.status);
    const tdStatus = createSafeElement('td', {
      className: 'text-center py-3 px-2',
      attrs: { 'data-label': 'Trạng thái' },
      children: [
        createSafeElement('span', {
          className: statusMeta.badgeClass,
          text: statusMeta.label,
          attrs: { id: `accountStatusBadge_${account.accountId}` }
        })
      ]
    });

    // 6. Created At Cell
    const tdCreatedAt = createSafeElement('td', {
      className: 'py-3 px-3 small text-secondary',
      attrs: { 'data-label': 'Thời gian tạo' },
      text: formatAccountDateTime(account.createdAt)
    });

    // 7. Actions Cell
    const tdAction = createSafeElement('td', {
      className: 'text-center py-3 px-3',
      attrs: { 'data-label': 'Hành động' }
    });

    const actionContainer = createSafeElement('div', {
      className: 'd-flex align-items-center justify-content-center gap-1'
    });

    if (isCurrentAdmin) {
      // Self-Protection Policy (POL-8D-01): Admin cannot deactivate or ban self
      const selfDisabledBtn = createSafeElement('button', {
        className: 'btn btn-chinese-secondary btn-sm opacity-50 btn-change-status',
        attrs: {
          'type': 'button',
          'id': `btnChangeStatus_${account.accountId}`,
          'disabled': 'true',
          'aria-disabled': 'true',
          'aria-label': 'Không thể tự đổi trạng thái tài khoản đang đăng nhập (POL-8D-01)',
          'title': 'Không thể tự vô hiệu hóa hoặc khóa tài khoản của chính mình (POL-8D-01)'
        },
        text: 'Đổi trạng thái'
      });
      actionContainer.appendChild(selfDisabledBtn);

      const selfResetDisabledBtn = createSafeElement('button', {
        className: 'btn btn-chinese-secondary btn-sm opacity-50',
        attrs: {
          'type': 'button',
          'id': `btnResetPassword_${account.accountId}`,
          'disabled': 'true',
          'aria-disabled': 'true',
          'aria-label': 'Không thể tự đặt lại mật khẩu của chính mình qua tính năng quản trị',
          'title': 'Không thể tự đặt lại mật khẩu của chính mình qua tính năng quản trị'
        },
        text: '🔑'
      });
      actionContainer.appendChild(selfResetDisabledBtn);
    } else {
      const changeStatusBtn = createSafeElement('button', {
        className: 'btn btn-chinese-secondary btn-sm btn-change-status',
        attrs: {
          'type': 'button',
          'id': `btnChangeStatus_${account.accountId}`,
          'aria-label': `Đổi trạng thái cho tài khoản ${account.emailOrPhone}`,
          'data-account-id': String(account.accountId)
        },
        text: 'Đổi trạng thái'
      });

      changeStatusBtn.addEventListener('click', () => {
        this.openStatusModal(account);
      });

      actionContainer.appendChild(changeStatusBtn);

      const resetPasswordBtn = createSafeElement('button', {
        className: 'btn btn-chinese-secondary btn-sm btn-reset-password',
        attrs: {
          'type': 'button',
          'id': `btnResetPassword_${account.accountId}`,
          'aria-label': `Đặt lại mật khẩu cho tài khoản ${account.emailOrPhone}`,
          'title': `Đặt lại mật khẩu cho tài khoản ${account.emailOrPhone}`,
          'data-account-id': String(account.accountId)
        },
        text: '🔑'
      });

      resetPasswordBtn.addEventListener('click', () => {
        this.openResetPasswordModal(account);
      });

      actionContainer.appendChild(resetPasswordBtn);
    }

    tdAction.appendChild(actionContainer);

    tr.appendChild(tdId);
    tr.appendChild(tdEmail);
    tr.appendChild(tdFullName);
    tr.appendChild(tdRoles);
    tr.appendChild(tdStatus);
    tr.appendChild(tdCreatedAt);
    tr.appendChild(tdAction);

    return tr;
  }

  /**
   * Renders server-side pagination bar.
   */
  renderPagination() {
    if (!this.dom.paginationNav || !this.dom.paginationList) {
      return;
    }

    if (this.totalPages <= 1) {
      this.dom.paginationNav.classList.add('d-none');
      clearContainer(this.dom.paginationList);
      return;
    }

    this.dom.paginationNav.classList.remove('d-none');
    clearContainer(this.dom.paginationList);

    const calc = calculatePagination(this.currentPage, this.pageSize, this.totalElements, this.totalPages, 5);

    // 1. First Page Button (<<)
    const firstBtn = createSafeElement('button', {
      className: 'pagination-btn',
      attrs: {
        type: 'button',
        'aria-label': 'Trang đầu',
        id: 'accountsPaginationFirstBtn'
      },
      text: '<<'
    });
    if (calc.currentPage === 0) {
      firstBtn.setAttribute('disabled', 'true');
      firstBtn.disabled = true;
    } else {
      firstBtn.addEventListener('click', () => {
        this.currentPage = 0;
        this.loadAccounts();
      });
    }
    this.dom.paginationList.appendChild(firstBtn);

    // 2. Previous Button (<)
    const prevBtn = createSafeElement('button', {
      className: 'pagination-btn',
      attrs: {
        type: 'button',
        'aria-label': 'Trang trước',
        id: 'accountsPaginationPrevBtn'
      },
      text: '<'
    });
    if (!calc.hasPrev) {
      prevBtn.setAttribute('disabled', 'true');
      prevBtn.disabled = true;
    } else {
      prevBtn.addEventListener('click', () => {
        this.currentPage = calc.currentPage - 1;
        this.loadAccounts();
      });
    }
    this.dom.paginationList.appendChild(prevBtn);

    // 3. Numbered Buttons (Smart Window)
    for (let p = calc.startPage; p <= calc.endPage; p++) {
      const isCurrent = p === calc.currentPage;
      const pageBtn = createSafeElement('button', {
        className: `pagination-btn ${isCurrent ? 'active' : ''}`,
        attrs: {
          type: 'button',
          'aria-label': `Trang ${p + 1}`,
          'aria-current': isCurrent ? 'page' : 'false'
        },
        text: String(p + 1)
      });

      if (!isCurrent) {
        pageBtn.addEventListener('click', () => {
          this.currentPage = p;
          this.loadAccounts();
        });
      }

      this.dom.paginationList.appendChild(pageBtn);
    }

    // 4. Next Button (>)
    const nextBtn = createSafeElement('button', {
      className: 'pagination-btn',
      attrs: {
        type: 'button',
        'aria-label': 'Trang sau',
        id: 'accountsPaginationNextBtn'
      },
      text: '>'
    });
    if (!calc.hasNext) {
      nextBtn.setAttribute('disabled', 'true');
      nextBtn.disabled = true;
    } else {
      nextBtn.addEventListener('click', () => {
        this.currentPage = calc.currentPage + 1;
        this.loadAccounts();
      });
    }
    this.dom.paginationList.appendChild(nextBtn);

    // 5. Last Page Button (>>)
    const lastBtn = createSafeElement('button', {
      className: 'pagination-btn',
      attrs: {
        type: 'button',
        'aria-label': 'Trang cuối',
        id: 'accountsPaginationLastBtn'
      },
      text: '>>'
    });
    if (calc.currentPage >= calc.totalPages - 1) {
      lastBtn.setAttribute('disabled', 'true');
      lastBtn.disabled = true;
    } else {
      lastBtn.addEventListener('click', () => {
        this.currentPage = calc.totalPages - 1;
        this.loadAccounts();
      });
    }
    this.dom.paginationList.appendChild(lastBtn);
  }

  /**
   * Opens the accessible native <dialog> confirmation modal for account status mutation.
   * 
   * @param {ReturnType<typeof parseAccountResponse>} account 
   */
  openStatusModal(account) {
    if (this.isSubmitting) return;

    const currentUser = authManager.getUser();
    if (isSelfAccount(account, currentUser)) {
      showToast({
        type: 'warning',
        title: 'Bảo vệ tự thân (POL-8D-01)',
        message: 'Bạn không thể tự vô hiệu hóa hoặc khóa tài khoản của chính mình.'
      });
      return;
    }

    this.activeAccountForMutation = account;
    this.activeElementBeforeOpen = document.activeElement;

    // Populate modal fields
    if (this.dom.modalTargetEmail) {
      this.dom.modalTargetEmail.textContent = account.emailOrPhone || '—';
    }
    if (this.dom.modalTargetFullName) {
      this.dom.modalTargetFullName.textContent = account.fullName || '—';
    }
    if (this.dom.modalTargetAccountId) {
      this.dom.modalTargetAccountId.textContent = `#${account.accountId}`;
    }

    if (this.dom.modalCurrentStatusBadge) {
      const meta = getStatusBadgeMeta(account.status);
      this.dom.modalCurrentStatusBadge.textContent = meta.label;
      this.dom.modalCurrentStatusBadge.className = meta.badgeClass;
    }

    if (this.dom.modalNewStatusSelect) {
      this.dom.modalNewStatusSelect.value = account.status;
    }

    // Hide error banner and reset notices
    if (this.dom.modalError) {
      this.dom.modalError.textContent = '';
      this.dom.modalError.classList.add('d-none');
    }
    this.dom.modalSelfProtectionNotice?.classList.add('d-none');
    this.dom.modalWarningNotice?.classList.remove('d-none');

    // Enable buttons
    if (this.dom.btnConfirmUpdate) {
      this.dom.btnConfirmUpdate.disabled = false;
      this.dom.btnConfirmUpdate.textContent = 'Xác nhận cập nhật';
    }

    // Show native dialog modal
    if (this.dom.statusModal) {
      if (typeof this.dom.statusModal.showModal === 'function') {
        this.dom.statusModal.showModal();
      } else {
        this.dom.statusModal.setAttribute('open', '');
      }
      this.dom.modalNewStatusSelect?.focus();
    }
  }

  /**
   * Closes the confirmation dialog and restores accessible keyboard focus.
   */
  closeStatusModal() {
    if (this.dom.statusModal) {
      if (typeof this.dom.statusModal.close === 'function') {
        this.dom.statusModal.close();
      } else {
        this.dom.statusModal.removeAttribute('open');
      }
    }
    this.activeAccountForMutation = null;
    this.isSubmitting = false;

    // WCAG 2.2 APG Pattern: Restore focus to trigger button
    if (this.activeElementBeforeOpen && typeof this.activeElementBeforeOpen.focus === 'function') {
      this.activeElementBeforeOpen.focus();
    }
  }

  /**
   * Submits the status update mutation to backend PUT /api/v1/admin/accounts/{id}/status.
   */
  async submitStatusUpdate() {
    if (this.isSubmitting || !this.activeAccountForMutation) return;

    const account = this.activeAccountForMutation;
    const currentUser = authManager.getUser();

    // Defense-in-depth: Self-Protection Policy (POL-8D-01)
    if (isSelfAccount(account, currentUser)) {
      this.showModalError('Không thể tự vô hiệu hóa hoặc khóa tài khoản đang đăng nhập (POL-8D-01).');
      return;
    }

    const newStatus = this.dom.modalNewStatusSelect?.value || 'Active';

    // No-op detection
    if (newStatus.toLowerCase() === account.status.toLowerCase()) {
      showToast({
        type: 'info',
        title: 'Không thay đổi',
        message: `Tài khoản ${account.emailOrPhone} đã ở trạng thái ${getStatusBadgeMeta(newStatus).label}.`
      });
      this.closeStatusModal();
      return;
    }

    this.isSubmitting = true;
    if (this.dom.btnConfirmUpdate) {
      this.dom.btnConfirmUpdate.disabled = true;
      this.dom.btnConfirmUpdate.textContent = 'Đang lưu...';
    }
    if (this.dom.btnCancelModal) {
      this.dom.btnCancelModal.disabled = true;
    }
    if (this.dom.modalError) {
      this.dom.modalError.classList.add('d-none');
    }

    try {
      const response = await apiClient(`/admin/accounts/${account.accountId}/status`, {
        method: 'PUT',
        body: { status: newStatus }
      });

      const updatedAccount = parseAccountResponse(response);

      // Successful mutation: Treat server response as authoritative
      this.applyAuthoritativeAccountUpdate(updatedAccount);

      showToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: `Đã đổi trạng thái tài khoản ${updatedAccount.emailOrPhone} thành "${getStatusBadgeMeta(updatedAccount.status).label}". Token/phiên làm việc đã bị thu hồi qua authorization version.`
      });

      this.closeStatusModal();

    } catch (err) {
      console.error('[AdminAccounts] Status update failed:', err);
      let errorMsg = 'Không thể cập nhật trạng thái tài khoản. Vui lòng thử lại.';
      if (err instanceof ApiError) {
        if (err.status === 400) {
          errorMsg = err.message || 'Yêu cầu không hợp lệ hoặc vi phạm chính sách bảo vệ tài khoản.';
        } else if (err.status === 403) {
          errorMsg = 'Bạn không có quyền thực hiện thao tác này.';
        } else if (err.status === 404) {
          errorMsg = 'Không tìm thấy tài khoản người dùng tương ứng (dữ liệu có thể đã bị xóa).';
        } else if (err.message) {
          errorMsg = err.message;
        }
      }

      this.showModalError(errorMsg);
    } finally {
      this.isSubmitting = false;
      if (this.dom.btnConfirmUpdate) {
        this.dom.btnConfirmUpdate.disabled = false;
        this.dom.btnConfirmUpdate.textContent = 'Xác nhận cập nhật';
      }
      if (this.dom.btnCancelModal) {
        this.dom.btnCancelModal.disabled = false;
      }
    }
  }

  /**
   * Displays an accessible error message inside the status modal.
   * 
   * @param {string} message 
   */
  showModalError(message) {
    if (!this.dom.modalError) return;
    this.dom.modalError.textContent = message;
    this.dom.modalError.classList.remove('d-none');
  }

  /**
   * Updates local state and row DOM authoritatively from server response without full-page reload.
   * 
   * @param {ReturnType<typeof parseAccountResponse>} updatedAccount 
   */
  applyAuthoritativeAccountUpdate(updatedAccount) {
    const idx = this.currentAccounts.findIndex(a => a.accountId === updatedAccount.accountId);
    if (idx !== -1) {
      this.currentAccounts[idx] = updatedAccount;
    }

    const badgeEl = document.getElementById(`accountStatusBadge_${updatedAccount.accountId}`);
    if (badgeEl) {
      const meta = getStatusBadgeMeta(updatedAccount.status);
      badgeEl.textContent = meta.label;
      badgeEl.className = meta.badgeClass;
    }
  }

  /**
   * Opens the Reset Password confirmation modal for target account.
   * 
   * @param {ReturnType<typeof parseAccountResponse>} account 
   */
  openResetPasswordModal(account) {
    if (!this.dom.resetPasswordModal || this.isSubmitting) return;

    const currentUser = authManager.getUser();
    if (isSelfAccount(account, currentUser)) {
      showToast({
        type: 'warning',
        title: 'Bảo vệ tự thân (POL-8D-01)',
        message: 'Bạn không thể tự đặt lại mật khẩu của chính mình qua tính năng quản trị.'
      });
      return;
    }

    this.selectedResetAccount = account;
    this.lastActiveElement = document.activeElement;

    // Populate target preview
    if (this.dom.resetModalTargetEmail) {
      this.dom.resetModalTargetEmail.textContent = account.emailOrPhone || '--';
    }
    if (this.dom.resetModalTargetInfo) {
      const name = account.fullName ? ` • ${account.fullName}` : '';
      this.dom.resetModalTargetInfo.textContent = `ID: #${account.accountId}${name}`;
    }

    // Reset modal sections to initial prompt state
    if (this.dom.resetPasswordConfirmSection) {
      this.dom.resetPasswordConfirmSection.classList.remove('d-none');
    }
    if (this.dom.resetPasswordResultSection) {
      this.dom.resetPasswordResultSection.classList.add('d-none');
    }
    if (this.dom.temporaryPasswordDisplay) {
      this.dom.temporaryPasswordDisplay.value = '';
    }
    if (this.dom.btnConfirmResetPassword) {
      this.dom.btnConfirmResetPassword.classList.remove('d-none');
      this.dom.btnConfirmResetPassword.disabled = false;
      this.dom.btnConfirmResetPassword.textContent = 'Tạo mật khẩu tạm';
    }
    if (this.dom.btnCancelResetPasswordModal) {
      this.dom.btnCancelResetPasswordModal.textContent = 'Hủy bỏ';
    }
    if (this.dom.resetModalError) {
      this.dom.resetModalError.textContent = '';
      this.dom.resetModalError.classList.add('d-none');
    }

    this.dom.resetPasswordModal.showModal();

    if (this.dom.btnConfirmResetPassword) {
      this.dom.btnConfirmResetPassword.focus();
    }
  }

  /**
   * Closes the Reset Password modal dialog.
   */
  closeResetPasswordModal() {
    if (!this.dom.resetPasswordModal) return;
    this.dom.resetPasswordModal.close();
    this.selectedResetAccount = null;

    if (this.lastActiveElement && typeof this.lastActiveElement.focus === 'function') {
      this.lastActiveElement.focus();
      this.lastActiveElement = null;
    }
  }

  /**
   * Submits temporary password generation to POST /api/v1/admin/accounts/{id}/reset-password.
   */
  async submitResetPassword() {
    if (this.isSubmitting || !this.selectedResetAccount) return;

    const account = this.selectedResetAccount;
    this.isSubmitting = true;

    if (this.dom.btnConfirmResetPassword) {
      this.dom.btnConfirmResetPassword.disabled = true;
      this.dom.btnConfirmResetPassword.textContent = 'Đang xử lý...';
    }
    if (this.dom.resetModalError) {
      this.dom.resetModalError.classList.add('d-none');
    }

    try {
      const response = await apiClient(`/admin/accounts/${account.accountId}/reset-password`, {
        method: 'POST'
      });

      const resData = (response && response.data) ? response.data : response;
      const temporaryPassword = resData?.temporaryPassword || '';

      // Switch to result view
      if (this.dom.resetPasswordConfirmSection) {
        this.dom.resetPasswordConfirmSection.classList.add('d-none');
      }
      if (this.dom.resetPasswordResultSection) {
        this.dom.resetPasswordResultSection.classList.remove('d-none');
      }
      if (this.dom.temporaryPasswordDisplay) {
        this.dom.temporaryPasswordDisplay.value = temporaryPassword;
      }
      if (this.dom.btnConfirmResetPassword) {
        this.dom.btnConfirmResetPassword.classList.add('d-none');
      }
      if (this.dom.btnCancelResetPasswordModal) {
        this.dom.btnCancelResetPasswordModal.textContent = 'Đóng';
        this.dom.btnCancelResetPasswordModal.focus();
      }

      showToast({
        type: 'success',
        title: 'Đặt lại mật khẩu thành công',
        message: `Đã tạo mật khẩu tạm thời cho tài khoản ${account.emailOrPhone}. Mọi phiên làm việc cũ đã bị thu hồi.`
      });

    } catch (err) {
      console.error('[AdminAccounts] Reset password failed:', err);
      let errorMsg = 'Không thể đặt lại mật khẩu. Vui lòng thử lại.';
      if (err instanceof ApiError) {
        if (err.status === 400) {
          errorMsg = err.message || 'Yêu cầu không hợp lệ.';
        } else if (err.status === 403) {
          errorMsg = 'Bạn không có quyền thực hiện thao tác này.';
        } else if (err.status === 404) {
          errorMsg = 'Không tìm thấy tài khoản người dùng tương ứng.';
        } else if (err.message) {
          errorMsg = err.message;
        }
      }

      if (this.dom.resetModalError) {
        this.dom.resetModalError.textContent = errorMsg;
        this.dom.resetModalError.classList.remove('d-none');
      }
      if (this.dom.btnConfirmResetPassword) {
        this.dom.btnConfirmResetPassword.disabled = false;
        this.dom.btnConfirmResetPassword.textContent = 'Tạo mật khẩu tạm';
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Copies generated temporary password to system clipboard.
   */
  copyTemporaryPassword() {
    const input = this.dom.temporaryPasswordDisplay;
    const tempPassword = input?.value;
    if (!tempPassword) return;

    if (input) {
      input.focus();
      input.select();
    }

    const setCopiedFeedback = () => {
      if (this.dom.btnCopyTemporaryPassword) {
        const originalText = this.dom.btnCopyTemporaryPassword.textContent;
        this.dom.btnCopyTemporaryPassword.textContent = 'Đã chép!';
        setTimeout(() => {
          if (this.dom.btnCopyTemporaryPassword) {
            this.dom.btnCopyTemporaryPassword.textContent = originalText;
          }
        }, 2000);
      }
      showToast({
        type: 'info',
        title: 'Đã sao chép',
        message: 'Mật khẩu tạm thời đã được sao chép vào bộ nhớ tạm.'
      });
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(tempPassword).then(() => {
        setCopiedFeedback();
      }).catch(err => {
        console.warn('Clipboard writeText failed, trying execCommand fallback:', err);
        try {
          if (document.execCommand('copy')) {
            setCopiedFeedback();
          }
        } catch (_) {}
      });
    } else {
      try {
        if (document.execCommand('copy')) {
          setCopiedFeedback();
        }
      } catch (_) {}
    }
  }
}

/**
 * Page initialization entry point.
 * Guarded against execution when imported on non-admin-accounts pages.
 * 
 * @returns {AdminAccountsController|null}
 */
export function initAdminAccountsPage() {
  if (typeof document === 'undefined') return null;
  const root = document.getElementById('adminAccountsWorkspaceSection') || document.getElementById('accountsTable');
  if (!root) return null;

  const controller = new AdminAccountsController();
  controller.init();
  return controller;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initAdminAccountsPage();
    });
  } else {
    initAdminAccountsPage();
  }
}

