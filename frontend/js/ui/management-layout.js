/**
 * =============================================================================
 * CENTRAL MANAGEMENT WORKSPACE LAYOUT & SIDEBAR CONTROLLER
 * Module: frontend/js/ui/management-layout.js
 * 
 * Responsibilities:
 * - Single authoritative layout and navigation controller for Management Workspace.
 * - Renders dedicated management header (brand pointing to management.html,
 *   workspace badge, exit to learner space, auth session cluster).
 * - Renders role-gated sidebar navigation (Overview, Creator Studio, Moderation,
 *   System Administration) based strictly on authenticated RBAC roles.
 * - Enforces zero learner menu items (no Trang chủ, Bộ thủ, Từ vựng, Ôn tập)
 *   in the management interface.
 * - Manages active link highlighting with aria-current="page" and parent mapping
 *   for detail pages (e.g. creator-lesson-editor.html -> creator-lessons.html).
 * - Mobile responsive drawer/offcanvas with hamburger toggle, overlay backdrop,
 *   keyboard escape handling, and focus management.
 * - Dynamic reaction to auth lifecycle events: 'auth:login', 'auth:logout',
 *   'auth:update', 'auth:expired'.
 * - Safe DOM construction (zero unsafe innerHTML) defending against XSS.
 * =============================================================================
 */

import { authManager } from '../auth/auth-state.js';
import { createSafeElement, clearContainer } from './security.js';

/**
 * Normalizes role strings to uppercase without 'ROLE_' prefix.
 * 
 * @param {string} role 
 * @returns {string}
 */
export function normalizeRole(role) {
  return String(role || '').trim().toUpperCase().replace(/^ROLE_/, '');
}

/**
 * Checks whether the user/roles has management access (Admin only).
 * Supports passing an authManager instance, a session object, or an array of roles.
 * 
 * @param {object|string[]} [subject=authManager] 
 * @returns {boolean}
 */
export function hasManagementAccess(subject = authManager) {
  let roles = [];
  if (Array.isArray(subject)) {
    roles = subject;
  } else if (subject && typeof subject.getRoles === 'function') {
    if (typeof subject.isAuthenticated === 'function' && !subject.isAuthenticated()) {
      return false;
    }
    roles = subject.getRoles();
  } else if (subject && Array.isArray(subject.roles)) {
    roles = subject.roles;
  }

  if (!roles || !roles.length) return false;
  const norm = roles.map(normalizeRole);
  return norm.includes('ADMIN');
}

/**
 * Computes visibility matrix for management sections based on user roles.
 * 
 * Policy (Single-Admin):
 * - Admin: sees Administration section.
 * - Non-Admin: all false.
 * 
 * @param {string[]} [roles=[]]
 * @returns {{ admin: boolean }}
 */
export function getVisibleManagementSections(roles = []) {
  const norm = (Array.isArray(roles) ? roles : []).map(normalizeRole);
  const isAdmin = norm.includes('ADMIN');

  return {
    admin: isAdmin
  };
}

/**
 * High-level configuration of all functional management routes (Admin only).
 */
export const MANAGEMENT_NAV_CONFIG = [
  {
    id: 'admin',
    title: '',
    requiredRole: ['Admin'],
    items: [
      {
        id: 'navMgmtAdminDashboard',
        label: 'Tổng quan hệ thống',
        href: 'management.html',
        icon: '📊',
        matchPages: ['management.html', 'admin-dashboard.html']
      },
      {
        id: 'navMgmtAdminLessons',
        label: 'Quản lý & Đẩy bài học',
        href: 'admin-lessons.html',
        icon: '📚',
        matchPages: ['admin-lessons.html']
      },
      {
        id: 'navMgmtAdminAccounts',
        label: 'Quản trị tài khoản',
        href: 'admin-accounts.html',
        icon: '👥',
        matchPages: ['admin-accounts.html']
      },
      {
        id: 'navMgmtAdminRoles',
        label: 'Phân quyền vai trò',
        href: 'admin-roles.html',
        icon: '🛡️',
        matchPages: ['admin-roles.html']
      },
      {
        id: 'navMgmtAdminRadicals',
        label: 'Quản trị bộ thủ',
        href: 'admin-radicals.html',
        icon: '部',
        matchPages: ['admin-radicals.html']
      },
      {
        id: 'navMgmtAdminVocabulary',
        label: 'Quản trị từ vựng',
        href: 'admin-vocabulary.html',
        icon: '词',
        matchPages: ['admin-vocabulary.html']
      },
      {
        id: 'navMgmtAdminAuditLogs',
        label: 'Nhật ký kiểm toán',
        href: 'admin-audit-logs.html',
        icon: '📋',
        matchPages: ['admin-audit-logs.html']
      }
      // Note: navMgmtAdminSettings ('⚙️ Cài đặt hệ thống', 'admin-settings.html') is temporarily hidden per user request:
      // {
      //   id: 'navMgmtAdminSettings',
      //   label: 'Cài đặt hệ thống',
      //   href: 'admin-settings.html',
      //   icon: '⚙️',
      //   matchPages: ['admin-settings.html']
      // }
    ]
  }
];

/**
 * Resolves current pathname to active management route, mapping detail sub-pages
 * (e.g. admin-dashboard.html, management.html) to their parent navigation item.
 * 
 * @param {string} [currentPath='']
 * @returns {string}
 */
export function getActiveManagementRoute(currentPath = '') {
  let path = currentPath;
  if (!path && typeof window !== 'undefined' && window.location) {
    path = window.location.pathname || '';
  }
  const cleanPath = String(path || '').split('?')[0].split('#')[0];
  const page = (cleanPath.split('/').pop() || 'management.html').toLowerCase();

  if (page === 'admin-dashboard.html' || page === 'management.html') {
    return 'management.html';
  }
  return page;
}

/**
 * Returns filtered navigation groups visible to user's assigned roles (Admin only).
 * 
 * @param {string[]} [roles=[]]
 * @returns {Array<object>}
 */
export function getVisibleManagementNavConfig(roles = []) {
  const norm = (Array.isArray(roles) ? roles : []).map(normalizeRole);
  if (!norm.length) return [];

  const isAdmin = norm.includes('ADMIN');
  if (!isAdmin) {
    return [];
  }

  return MANAGEMENT_NAV_CONFIG.filter(section => section.id === 'admin');
}

/**
 * Renders the management sidebar navigation into the target container.
 * Uses safe DOM elements defending against XSS.
 * 
 * @param {HTMLElement} navContainer 
 * @param {string[]} [roles=[]] 
 * @param {string} [currentPath=''] 
 */
export function renderManagementSidebar(navContainer, roles = [], currentPath = '') {
  if (!navContainer) return;
  clearContainer(navContainer);

  const effectiveRoute = getActiveManagementRoute(currentPath);
  const sections = getVisibleManagementNavConfig(roles);

  if (sections.length === 0) {
    const emptyNotice = createSafeElement('div', {
      className: 'p-3 text-secondary small text-center',
      attrs: { role: 'status', id: 'mgmtSidebarAccessNotice' },
      children: [
        createSafeElement('div', { className: 'mb-2 fs-4', text: '🔒' }),
        createSafeElement('div', { className: 'fw-semibold text-dark mb-1', text: 'Quyền Truy Cập Bị Giới Hạn' }),
        createSafeElement('div', { text: 'Khu vực quản lý dành riêng cho Quản trị viên (Admin).' })
      ]
    });
    navContainer.appendChild(emptyNotice);
    return;
  }

  // Render navigation groups
  sections.forEach(sec => {
    const groupChildren = [];
    if (sec.title && sec.title.trim()) {
      groupChildren.push(
        createSafeElement('div', {
          className: 'management-nav-heading text-uppercase small fw-bold px-3 py-1 text-secondary',
          text: sec.title
        })
      );
    }

    groupChildren.push(
      createSafeElement('ul', {
        className: 'management-nav-list list-unstyled mb-0',
        children: sec.items.map(item => {
          const isActive = item.matchPages.includes(effectiveRoute) || item.href === effectiveRoute;
          const linkAttrs = {
            href: item.href,
            id: item.id,
            className: `management-nav-link d-flex align-items-center gap-2 px-3 py-2 text-decoration-none rounded-2${isActive ? ' active' : ''}`
          };
          if (isActive) {
            linkAttrs['aria-current'] = 'page';
          }

          return createSafeElement('li', {
            className: 'management-nav-item mb-1',
            children: [
              createSafeElement('a', {
                className: linkAttrs.className,
                attrs: linkAttrs,
                children: [
                  createSafeElement('span', {
                    className: 'management-nav-icon',
                    text: item.icon,
                    attrs: { 'aria-hidden': 'true' }
                  }),
                  createSafeElement('span', {
                    className: 'management-nav-text flex-grow-1',
                    text: item.label
                  })
                ]
              })
            ]
          });
        })
      })
    );

    const groupEl = createSafeElement('div', {
      className: 'management-nav-group mb-3',
      attrs: { 'data-group-id': sec.id },
      children: groupChildren
    });

    navContainer.appendChild(groupEl);
  });
}

/**
 * Initializes mobile drawer open/close behavior and accessible keyboard controls.
 * 
 * @returns {() => void} Cleanup function
 */
export function initMobileSidebarDrawer() {
  if (typeof document === 'undefined') return () => {};

  const toggleBtn = document.getElementById('managementSidebarToggle');
  const sidebar = document.getElementById('managementSidebar');
  const closeBtn = document.getElementById('managementSidebarClose');
  const backdrop = document.getElementById('managementSidebarBackdrop');

  if (!toggleBtn || !sidebar) return () => {};

  const setDrawerOpen = (open) => {
    if (open) {
      sidebar.classList.add('show');
      toggleBtn.setAttribute('aria-expanded', 'true');
      if (backdrop) {
        backdrop.classList.add('show');
      }
      if (closeBtn) {
        closeBtn.focus();
      }
    } else {
      sidebar.classList.remove('show');
      toggleBtn.setAttribute('aria-expanded', 'false');
      if (backdrop) {
        backdrop.classList.remove('show');
      }
    }
  };

  const handleToggleClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    const isCurrentlyOpen = sidebar.classList.contains('show');
    setDrawerOpen(!isCurrentlyOpen);
  };

  const handleCloseClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    setDrawerOpen(false);
    toggleBtn.focus();
  };

  const handleBackdropClick = () => {
    setDrawerOpen(false);
    toggleBtn.focus();
  };

  const handleKeydown = (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('show')) {
      setDrawerOpen(false);
      toggleBtn.focus();
    }
  };

  toggleBtn.addEventListener('click', handleToggleClick);
  if (closeBtn) closeBtn.addEventListener('click', handleCloseClick);
  if (backdrop) backdrop.addEventListener('click', handleBackdropClick);
  document.addEventListener('keydown', handleKeydown);

  // Close drawer when clicking any sidebar link on mobile viewports (< 992px)
  const handleLinkClick = (e) => {
    const link = e.target && e.target.closest && e.target.closest('.management-nav-link');
    if (link && typeof window !== 'undefined' && window.innerWidth < 992) {
      setDrawerOpen(false);
    }
  };
  sidebar.addEventListener('click', handleLinkClick);

  return () => {
    toggleBtn.removeEventListener('click', handleToggleClick);
    if (closeBtn) closeBtn.removeEventListener('click', handleCloseClick);
    if (backdrop) backdrop.removeEventListener('click', handleBackdropClick);
    document.removeEventListener('keydown', handleKeydown);
    sidebar.removeEventListener('click', handleLinkClick);
  };
}

/**
 * Initializes the Management Workspace layout on the page.
 */
export function initManagementLayout() {
  if (typeof document === 'undefined') return;

  const sidebarNavContainer = document.getElementById('managementSidebarNav');
  if (sidebarNavContainer) {
    const roles = authManager.getRoles();
    const rawPath = (typeof window !== 'undefined' && window.location) ? window.location.pathname : '';
    renderManagementSidebar(sidebarNavContainer, roles, rawPath);
  }

  initMobileSidebarDrawer();

  // Watch for authentication changes to re-render sidebar dynamically
  const handleAuthUpdate = () => {
    if (sidebarNavContainer) {
      const roles = authManager.getRoles();
      const rawPath = (typeof window !== 'undefined' && window.location) ? window.location.pathname : '';
      renderManagementSidebar(sidebarNavContainer, roles, rawPath);
    }
  };

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('auth:login', handleAuthUpdate);
    window.addEventListener('auth:logout', handleAuthUpdate);
    window.addEventListener('auth:update', handleAuthUpdate);
  }
}

// Auto-boot in browser environment when management sidebar is present
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('managementSidebar')) {
        initManagementLayout();
      }
    });
  } else {
    if (document.getElementById('managementSidebar')) {
      initManagementLayout();
    }
  }
}
