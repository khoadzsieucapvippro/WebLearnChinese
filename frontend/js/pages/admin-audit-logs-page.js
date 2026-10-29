/**
 * =============================================================================
 * CENTRALIZED MANAGEMENT AUDIT LOGS CONTROLLER (MILESTONE M3 / REQUIREMENT R5)
 * Module: frontend/js/pages/admin-audit-logs-page.js
 *
 * Responsibilities:
 * - Authoritative administrative integration with Spring Boot:
 *   * GET /api/v1/admin/audit-logs (paginated, multi-criteria filters)
 *   * GET /api/v1/admin/audit-logs/{id} (detailed before/after payload diff)
 * - Strict Role Guard: Admin-only access (authManager.hasRole('Admin')).
 * - Safe DOM manipulation (Zero unsafe innerHTML) defending against XSS.
 * - Three-State UI engine: LOADING, EMPTY, and ERROR with retry callback.
 * - Native <dialog> modal for detailed metadata and formatted JSON snapshot diffs.
 * - First, Prev, Next, Last pagination navigation controls.
 * - Multi-criteria filter toolbar: actionType, resourceType, status, actor, date range.
 * =============================================================================
 */

import { apiClient, ApiError } from '../api/api.js';
import { authManager } from '../auth/auth-state.js';
import { initNavbarAuth } from '../ui/nav.js';
import { createSafeElement, clearContainer } from '../ui/security.js';
import { setComponentState, showToast } from '../ui/ui.js';

/* -----------------------------------------------------------------------------
 * 1. PURE LOGIC & UTILITY HELPERS (Exported for Unit Tests)
 * ----------------------------------------------------------------------------- */

/**
 * Checks whether the current user has administrative authority.
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
 * Formats ISO datetime string to localized Vietnamese format.
 *
 * @param {string|null|undefined} isoString
 * @returns {string}
 */
export function formatTimestamp(isoString) {
  if (!isoString) {
    return '—';
  }
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return String(isoString);
    }
    const pad = (n) => String(n).padStart(2, '0');
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  } catch (_e) {
    return String(isoString);
  }
}

/**
 * Determines CSS badge class for audit action types.
 *
 * @param {string} actionType
 * @returns {string}
 */
export function getActionBadgeClass(actionType) {
  if (!actionType) return 'badge bg-secondary';
  const action = actionType.toUpperCase();
  if (action.includes('ROLE')) return 'badge bg-primary';
  if (action.includes('STATUS')) return 'badge bg-warning text-dark';
  if (action.includes('APPROVE')) return 'badge bg-success';
  if (action.includes('REJECT')) return 'badge bg-danger';
  if (action.includes('CREATE')) return 'badge bg-info text-dark';
  if (action.includes('UPDATE')) return 'badge bg-secondary';
  if (action.includes('DELETE')) return 'badge bg-dark';
  return 'badge bg-secondary';
}

/**
 * Determines CSS badge class for status.
 *
 * @param {string} status
 * @returns {string}
 */
export function getStatusBadgeClass(status) {
  if (!status) return 'badge bg-secondary';
  return status.toUpperCase() === 'SUCCESS' ? 'badge bg-success' : 'badge bg-danger';
}

/**
 * Pretty-formats JSON string for diff display, or provides placeholder.
 *
 * @param {string|null|undefined} jsonStr
 * @returns {string}
 */
export function formatPayloadJson(jsonStr) {
  if (!jsonStr || jsonStr.trim() === '') {
    return '(Trống — Không có dữ liệu thay đổi)';
  }
  try {
    const parsed = JSON.parse(jsonStr);
    return JSON.stringify(parsed, null, 2);
  } catch (_e) {
    return jsonStr;
  }
}

/**
 * Constructs sanitized query params object for audit logs API.
 *
 * @param {object} params
 * @returns {Record<string, string|number>}
 */
export function buildQueryParams(params = {}) {
  const query = {
    page: Number(params.page) >= 0 ? Number(params.page) : 0,
    size: Number(params.size) > 0 ? Number(params.size) : 20,
    sort: params.sort || 'createdAt,desc;logId,desc'
  };

  if (params.actionType && String(params.actionType).trim() !== '') {
    query.actionType = String(params.actionType).trim();
  }
  if (params.resourceType && String(params.resourceType).trim() !== '') {
    query.resourceType = String(params.resourceType).trim();
  }
  if (params.status && String(params.status).trim() !== '') {
    query.status = String(params.status).trim();
  }
  if (params.actor && String(params.actor).trim() !== '') {
    query.actor = String(params.actor).trim();
  }
  if (params.startDate && String(params.startDate).trim() !== '') {
    query.startDate = String(params.startDate).trim();
  }
  if (params.endDate && String(params.endDate).trim() !== '') {
    query.endDate = String(params.endDate).trim();
  }

  return query;
}

/**
 * Pure helper calculating standardized pagination model matching project contract.
 *
 * @param {number} currentPageOrPage
 * @param {number} totalPagesOrSize
 * @param {number} [maxVisibleOrTotalElements=5]
 * @param {number} [maybeTotalPages]
 * @param {number} [maybeMaxButtons=5]
 * @returns {object}
 */
export function calculatePagination(currentPageOrPage, totalPagesOrSize, maxVisibleOrTotalElements, maybeTotalPages, maybeMaxButtons = 5) {
  let page = 0;
  let totalPages = 1;
  let maxButtons = 5;

  if (maybeTotalPages !== undefined) {
    page = Number(currentPageOrPage) || 0;
    totalPages = Number(maybeTotalPages) || 1;
    maxButtons = Number(maybeMaxButtons) || 5;
  } else {
    page = Number(currentPageOrPage) || 0;
    totalPages = Number(totalPagesOrSize) || 1;
    maxButtons = Number(maxVisibleOrTotalElements) || 5;
  }

  const safeTotalPages = Math.max(1, totalPages);
  const clampedPage = Math.max(0, Math.min(page, safeTotalPages - 1));
  const safeMaxButtons = Math.max(1, maxButtons);

  let startPage = Math.max(0, clampedPage - Math.floor(safeMaxButtons / 2));
  let endPage = Math.min(safeTotalPages - 1, startPage + safeMaxButtons - 1);

  if (endPage - startPage + 1 < safeMaxButtons) {
    startPage = Math.max(0, endPage - safeMaxButtons + 1);
  }

  const pages = [];
  for (let p = startPage; p <= endPage; p++) {
    pages.push(p);
  }

  return {
    currentPage: clampedPage,
    totalPages: safeTotalPages,
    startPage,
    endPage,
    pages,
    hasPrev: clampedPage > 0,
    hasNext: clampedPage < safeTotalPages - 1
  };
}

/**
 * Generates RFC 4180 compliant CSV string with UTF-8 BOM for Audit Logs.
 * Escapes quotes and wraps fields to ensure perfect rendering across Excel and Google Sheets.
 *
 * @param {Array<object>} logs
 * @returns {string}
 */
export function generateAuditLogsCsv(logs = []) {
  const headers = [
    'Mã nhật ký',
    'Thời gian',
    'Người thực hiện (Actor)',
    'Hành vi (Action)',
    'Tài nguyên (Resource)',
    'Mã tài nguyên (Resource ID)',
    'Kết quả (Status)',
    'Địa chỉ IP',
    'Chi tiết thay đổi'
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = [headers.map(escapeCsv).join(',')];

  for (const log of logs) {
    const row = [
      escapeCsv(log.logId !== undefined ? `#${log.logId}` : '—'),
      escapeCsv(formatTimestamp(log.createdAt)),
      escapeCsv(log.actorEmail || (log.actorId ? `Account #${log.actorId}` : 'Hệ thống')),
      escapeCsv(log.actionType || '—'),
      escapeCsv(log.resourceType || '—'),
      escapeCsv(log.resourceId !== undefined ? log.resourceId : '—'),
      escapeCsv(log.status || 'SUCCESS'),
      escapeCsv(log.ipAddress || '—'),
      escapeCsv(log.details || log.payloadDiff || '—')
    ];
    rows.push(row.join(','));
  }

  // UTF-8 BOM (﻿)
  return '\uFEFF' + rows.join('\r\n');
}

/**
 * Triggers browser download of generated CSV file.
 *
 * @param {string} content
 * @param {string} [fileName='audit-logs.csv']
 */
export function downloadCsvFile(content, fileName = 'audit-logs.csv') {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


/* -----------------------------------------------------------------------------
 * 2. STATE MANAGEMENT & DOM CONTROLLER
 * ----------------------------------------------------------------------------- */

let currentPage = 0;
const pageSize = 20;
let totalPages = 1;
let totalElements = 0;
let isLoading = false;
let currentAuditLogs = [];

/**
 * Initializes the Audit Logs page.
 */
export async function initAdminAuditLogsPage() {
  initNavbarAuth();

  const authGuardContainer = document.getElementById('adminAuthGuardContainer');
  const workspaceSection = document.getElementById('adminAuditLogsWorkspaceSection');

  // Verify Admin authorization
  if (!hasAdminAccess()) {
    if (authGuardContainer) authGuardContainer.classList.remove('d-none');
    if (workspaceSection) workspaceSection.classList.add('d-none');
    return;
  }

  if (authGuardContainer) authGuardContainer.classList.add('d-none');
  if (workspaceSection) workspaceSection.classList.remove('d-none');

  setupEventListeners();
  await loadAuditLogs(0);
}

/**
 * Registers all UI event listeners.
 */
function setupEventListeners() {
  const btnApplyFilter = document.getElementById('btnApplyFilter');
  if (btnApplyFilter) {
    btnApplyFilter.addEventListener('click', () => {
      currentPage = 0;
      loadAuditLogs(0);
    });
  }

  const btnExportCsv = document.getElementById('btnExportCsv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      if (!currentAuditLogs || currentAuditLogs.length === 0) {
        showToast('Không có bản ghi nào để xuất CSV', 'warning');
        return;
      }
      const csv = generateAuditLogsCsv(currentAuditLogs);
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadCsvFile(csv, `audit-logs-${dateStr}.csv`);
      showToast(`Đã xuất ${currentAuditLogs.length} bản ghi ra file CSV thành công`, 'success');
    });
  }

  const btnResetFilter = document.getElementById('btnResetFilter');
  if (btnResetFilter) {
    btnResetFilter.addEventListener('click', () => {
      const actionSelect = document.getElementById('actionTypeFilter');
      const resourceSelect = document.getElementById('resourceTypeFilter');
      const statusSelect = document.getElementById('statusFilter');
      const actorInput = document.getElementById('actorSearchInput');
      const startInput = document.getElementById('startDateInput');
      const endInput = document.getElementById('endDateInput');

      if (actionSelect) actionSelect.value = '';
      if (resourceSelect) resourceSelect.value = '';
      if (statusSelect) statusSelect.value = '';
      if (actorInput) actorInput.value = '';
      if (startInput) startInput.value = '';
      if (endInput) endInput.value = '';

      currentPage = 0;
      loadAuditLogs(0);
    });
  }

  // Pagination buttons
  const btnFirst = document.getElementById('btnFirstPage');
  if (btnFirst) {
    btnFirst.addEventListener('click', () => {
      if (currentPage > 0 && !isLoading) {
        loadAuditLogs(0);
      }
    });
  }

  const btnPrev = document.getElementById('btnPrevPage');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (currentPage > 0 && !isLoading) {
        loadAuditLogs(currentPage - 1);
      }
    });
  }

  const btnNext = document.getElementById('btnNextPage');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (currentPage < totalPages - 1 && !isLoading) {
        loadAuditLogs(currentPage + 1);
      }
    });
  }

  const btnLast = document.getElementById('btnLastPage');
  if (btnLast) {
    btnLast.addEventListener('click', () => {
      if (currentPage < totalPages - 1 && !isLoading) {
        loadAuditLogs(totalPages - 1);
      }
    });
  }

  // Dialog Close buttons
  const detailDialog = document.getElementById('auditDetailDialog');
  const btnCloseModal = document.getElementById('btnCloseDetailModal');
  const btnCloseModalX = document.getElementById('btnCloseDetailModalX');

  if (btnCloseModal && detailDialog) {
    btnCloseModal.addEventListener('click', () => detailDialog.close());
  }
  if (btnCloseModalX && detailDialog) {
    btnCloseModalX.addEventListener('click', () => detailDialog.close());
  }

  // Close modal when pressing Escape or clicking backdrop
  if (detailDialog) {
    detailDialog.addEventListener('click', (e) => {
      if (e.target === detailDialog) {
        detailDialog.close();
      }
    });
  }
}

/**
 * Loads audit logs from backend API.
 *
 * @param {number} targetPage
 */
export async function loadAuditLogs(targetPage = 0) {
  if (isLoading) return;
  isLoading = true;

  const tableBody = document.getElementById('auditLogsTableBody');
  const stateContainer = document.getElementById('auditLogsStateContainer');
  const countBadge = document.getElementById('auditLogCountBadge');

  if (stateContainer) {
    setComponentState(stateContainer, 'LOADING', {
      title: 'Đang tải nhật ký kiểm toán...',
      description: 'Vui lòng chờ trong giây lát.'
    });
  }
  if (tableBody) {
    clearContainer(tableBody);
  }

  const actionSelect = document.getElementById('actionTypeFilter');
  const resourceSelect = document.getElementById('resourceTypeFilter');
  const statusSelect = document.getElementById('statusFilter');
  const actorInput = document.getElementById('actorSearchInput');
  const startInput = document.getElementById('startDateInput');
  const endInput = document.getElementById('endDateInput');

  const filterParams = {
    page: targetPage,
    size: pageSize,
    actionType: actionSelect ? actionSelect.value : '',
    resourceType: resourceSelect ? resourceSelect.value : '',
    status: statusSelect ? statusSelect.value : '',
    actor: actorInput ? actorInput.value : '',
    startDate: startInput ? startInput.value : '',
    endDate: endInput ? endInput.value : ''
  };

  const query = buildQueryParams(filterParams);

  try {
    const response = await apiClient('/admin/audit-logs', { params: query });
    const pageData = (response && response.data && typeof response.data === 'object') ? response.data : response;

    currentPage = pageData ? pageData.page : 0;
    totalPages = pageData ? Math.max(1, pageData.totalPages) : 1;
    totalElements = pageData ? pageData.totalElements : 0;

    if (countBadge) {
      countBadge.textContent = `${totalElements} bản ghi`;
    }

    const items = pageData && Array.isArray(pageData.items) ? pageData.items : [];
    currentAuditLogs = items;

    if (items.length === 0) {
      if (stateContainer) {
        setComponentState(stateContainer, 'EMPTY', {
          title: 'Không tìm thấy nhật ký kiểm toán',
          description: 'Không có bản ghi nhật ký nào khớp với điều kiện lọc hiện tại.'
        });
      }
    } else {
      if (stateContainer) {
        clearContainer(stateContainer);
      }
      renderAuditLogsTable(items);
    }

    updatePaginationUI();
  } catch (error) {
    console.error('Lỗi khi tải nhật ký kiểm toán:', error);
    const errorMessage = error instanceof ApiError
      ? error.message
      : 'Không thể tải nhật ký kiểm toán do lỗi mạng hoặc máy chủ.';

    if (stateContainer) {
      setComponentState(stateContainer, 'ERROR', {
        title: 'Lỗi tải dữ liệu',
        description: errorMessage,
        onRetry: () => loadAuditLogs(targetPage)
      });
    }
    showToast('Lỗi: ' + errorMessage, 'danger');
  } finally {
    isLoading = false;
  }
}

/**
 * Renders audit logs rows safely into the table body.
 *
 * @param {Array<object>} items
 */
function renderAuditLogsTable(items) {
  const tableBody = document.getElementById('auditLogsTableBody');
  if (!tableBody) return;
  clearContainer(tableBody);

  items.forEach((item) => {
    const tr = createSafeElement('tr');

    // 1. Time
    const tdTime = createSafeElement('td', { class: 'small text-secondary font-monospace' });
    tdTime.textContent = formatTimestamp(item.createdAt);
    tr.appendChild(tdTime);

    // 2. Actor
    const tdActor = createSafeElement('td', { class: 'small' });
    const actorStrong = createSafeElement('strong', { class: 'd-block text-dark text-truncate', style: 'max-width: 150px;' });
    actorStrong.textContent = item.actorUsername || 'SYSTEM';
    tdActor.appendChild(actorStrong);
    if (item.actorRoles) {
      const roleSmall = createSafeElement('span', { class: 'text-muted small' });
      roleSmall.textContent = item.actorRoles;
      tdActor.appendChild(roleSmall);
    }
    tr.appendChild(tdActor);

    // 3. Action Type
    const tdAction = createSafeElement('td');
    const actionBadge = createSafeElement('span', { class: getActionBadgeClass(item.actionType) });
    actionBadge.textContent = item.actionType || 'UNKNOWN';
    tdAction.appendChild(actionBadge);
    tr.appendChild(tdAction);

    // 4. Resource Type
    const tdResource = createSafeElement('td', { class: 'small fw-semibold text-secondary' });
    tdResource.textContent = item.resourceType || '—';
    tr.appendChild(tdResource);

    // 5. Resource ID
    const tdResourceId = createSafeElement('td', { class: 'small font-monospace' });
    tdResourceId.textContent = item.resourceId ? `#${item.resourceId}` : '—';
    tr.appendChild(tdResourceId);

    // 6. Status
    const tdStatus = createSafeElement('td');
    const statusBadge = createSafeElement('span', { class: getStatusBadgeClass(item.status) });
    statusBadge.textContent = item.status || 'SUCCESS';
    tdStatus.appendChild(statusBadge);
    tr.appendChild(tdStatus);

    // 7. Details
    const tdDetails = createSafeElement('td', { class: 'small text-secondary text-truncate', style: 'max-width: 250px;' });
    tdDetails.textContent = item.details || '—';
    tdDetails.setAttribute('title', item.details || '');
    tr.appendChild(tdDetails);

    // 8. Actions
    const tdOps = createSafeElement('td', { className: 'text-end' });
    const btnView = createSafeElement('button', {
      className: 'btn btn-outline-primary btn-sm py-0 px-2 btn-view-detail',
      attrs: { type: 'button', 'data-action': 'view-detail' }
    });
    btnView.textContent = 'Chi tiết';
    btnView.addEventListener('click', () => openDetailModal(item.logId));
    tdOps.appendChild(btnView);
    tr.appendChild(tdOps);

    tableBody.appendChild(tr);
  });
}

/**
 * Fetches and displays detailed audit log record in dialog.
 *
 * @param {number} logId
 */
export async function openDetailModal(logId) {
  const dialog = document.getElementById('auditDetailDialog');
  if (!dialog) return;

  try {
    const response = await apiClient(`/admin/audit-logs/${logId}`);
    const data = (response && response.data && typeof response.data === 'object') ? response.data : response;
    if (!data) {
      showToast('Không tìm thấy chi tiết bản ghi kiểm toán', 'warning');
      return;
    }

    const setFieldText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text != null ? String(text) : '—';
    };

    setFieldText('detailLogId', data.logId);
    setFieldText('detailActorUsername', data.actorUsername || 'SYSTEM');
    setFieldText('detailActorRoles', data.actorRoles || '—');
    setFieldText('detailActionType', data.actionType || '—');
    setFieldText('detailResourceInfo', `${data.resourceType || '—'} (ID: ${data.resourceId || '—'})`);
    setFieldText('detailStatus', data.status || 'SUCCESS');
    setFieldText('detailCreatedAt', formatTimestamp(data.createdAt));
    setFieldText('detailIpAddress', data.ipAddress || '—');
    setFieldText('detailUserAgent', data.userAgent || '—');
    setFieldText('detailDescription', data.details || '(Không có diễn giải chi tiết)');

    const uaEl = document.getElementById('detailUserAgent');
    if (uaEl && data.userAgent) {
      uaEl.setAttribute('title', data.userAgent);
    }

    // Error message container
    const errorContainer = document.getElementById('detailErrorMessageContainer');
    const errorMsgEl = document.getElementById('detailErrorMessage');
    if (errorContainer && errorMsgEl) {
      if (data.errorMessage) {
        errorMsgEl.textContent = data.errorMessage;
        errorContainer.classList.remove('d-none');
      } else {
        errorContainer.classList.add('d-none');
      }
    }

    // Payloads
    setFieldText('detailPayloadBefore', formatPayloadJson(data.payloadBefore));
    setFieldText('detailPayloadAfter', formatPayloadJson(data.payloadAfter));

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  } catch (error) {
    console.error('Lỗi khi mở modal chi tiết:', error);
    showToast('Lỗi: Không thể tải chi tiết bản ghi', 'danger');
  }
}

/**
 * Updates pagination buttons and indicators.
 */
function updatePaginationUI() {
  const nav = document.getElementById('auditPaginationNav');
  const controls = document.getElementById('paginationControls');
  if (!nav || !controls) return;

  clearContainer(controls);

  if (totalPages <= 1) {
    nav.classList.add('d-none');
    return;
  }

  nav.classList.remove('d-none');
  const calc = calculatePagination(currentPage, totalPages, 5);

  // 1. First button (<<)
  const firstBtn = createSafeElement('button', {
    className: 'pagination-btn',
    attrs: {
      type: 'button',
      'aria-label': 'Trang đầu',
      id: 'btnFirstPage'
    },
    text: '<<'
  });
  if (!calc.hasPrev) {
    firstBtn.disabled = true;
    firstBtn.setAttribute('disabled', 'true');
  } else {
    firstBtn.addEventListener('click', () => {
      if (!isLoading) loadAuditLogs(0);
    });
  }
  controls.appendChild(firstBtn);

  // 2. Prev button (<)
  const prevBtn = createSafeElement('button', {
    className: 'pagination-btn',
    attrs: {
      type: 'button',
      'aria-label': 'Trang trước',
      id: 'btnPrevPage'
    },
    text: '<'
  });
  if (!calc.hasPrev) {
    prevBtn.disabled = true;
    prevBtn.setAttribute('disabled', 'true');
  } else {
    prevBtn.addEventListener('click', () => {
      if (!isLoading) loadAuditLogs(calc.currentPage - 1);
    });
  }
  controls.appendChild(prevBtn);

  // 3. Numbered buttons
  for (const p of calc.pages) {
    const pageNumBtn = createSafeElement('button', {
      className: `pagination-btn ${p === calc.currentPage ? 'active' : ''}`.trim(),
      attrs: {
        type: 'button',
        'aria-label': `Trang ${p + 1}`,
        ...(p === calc.currentPage ? { 'aria-current': 'page' } : {})
      },
      text: String(p + 1)
    });
    if (p !== calc.currentPage) {
      pageNumBtn.addEventListener('click', () => {
        if (!isLoading) loadAuditLogs(p);
      });
    }
    controls.appendChild(pageNumBtn);
  }

  // 4. Next button (>)
  const nextBtn = createSafeElement('button', {
    className: 'pagination-btn',
    attrs: {
      type: 'button',
      'aria-label': 'Trang sau',
      id: 'btnNextPage'
    },
    text: '>'
  });
  if (!calc.hasNext) {
    nextBtn.disabled = true;
    nextBtn.setAttribute('disabled', 'true');
  } else {
    nextBtn.addEventListener('click', () => {
      if (!isLoading) loadAuditLogs(calc.currentPage + 1);
    });
  }
  controls.appendChild(nextBtn);

  // 5. Last button (>>)
  const lastBtn = createSafeElement('button', {
    className: 'pagination-btn',
    attrs: {
      type: 'button',
      'aria-label': 'Trang cuối',
      id: 'btnLastPage'
    },
    text: '>>'
  });
  if (!calc.hasNext) {
    lastBtn.disabled = true;
    lastBtn.setAttribute('disabled', 'true');
  } else {
    lastBtn.addEventListener('click', () => {
      if (!isLoading) loadAuditLogs(calc.totalPages - 1);
    });
  }
  controls.appendChild(lastBtn);
}

// Auto-run on DOM ready strictly when on admin-audit-logs.html
if (typeof document !== 'undefined') {
  const isTargetPage = () => Boolean(document.getElementById('adminAuditLogsWorkspaceSection'));
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (isTargetPage()) initAdminAuditLogsPage();
    });
  } else if (isTargetPage()) {
    initAdminAuditLogsPage();
  }
}
