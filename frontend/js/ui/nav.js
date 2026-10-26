/**
 * =============================================================================
 * SESSION-AWARE NAVIGATION COMPONENT (TASK 9B.1)
 * Module: frontend/js/ui/nav.js
 * 
 * Responsibilities:
 * - Single authoritative navbar session rendering across the application.
 * - Renders Guest state (Đăng nhập, Đăng ký) vs Authenticated state
 *   (User Name, Role Badge, Hồ sơ link, Đăng xuất button).
 * - Reacts automatically to auth events: 'auth:login', 'auth:logout',
 *   'auth:expired', 'auth:update', and multi-tab synchronization.
 * - Safe DOM construction (zero unsafe innerHTML) defending against XSS.
 * - Accessible keyboard navigation and WCAG 2.2 AA compliant focus states.
 * =============================================================================
 */

import { authManager } from '../auth/auth-state.js';
import { createSafeElement, clearContainer, sanitizeResourceUrl } from './security.js';
import { showToast } from './ui.js';
import { apiClient, isDemoFallbackActive, isGitHubPagesEnvironment, isApiConfigured } from '../api/api.js';

export const MANAGEMENT_PAGE_SET = new Set([
  'management.html',
  'creator-lessons.html',
  'creator-lesson-editor.html',
  'creator-import.html',
  'moderator-queue.html',
  'moderator-review.html',
  'moderator-history.html',
  'admin-accounts.html',
  'admin-roles.html',
  'admin-lessons.html',
  'admin-radicals.html',
  'admin-vocabulary.html',
  'admin-audit-logs.html',
  'ui-verification.html'
]);

/**
 * Creates the persistent Demo Mode Simulation Warning Badge.
 * Contract: <span class="badge badge-warning ...">🟡 Dữ liệu mô phỏng</span>
 * 
 * @returns {HTMLElement}
 */
export function createDemoSimulationBadge() {
  return createSafeElement('span', {
    className: 'badge badge-warning bg-warning text-dark fw-semibold',
    text: '🟡 Dữ liệu mô phỏng',
    attrs: {
      id: 'demoSimulationBadge',
      role: 'status',
      'aria-label': 'Dữ liệu mô phỏng',
      title: 'Đang chạy ở chế độ mô phỏng client-side (Demo Mode)'
    }
  });
}

/**
 * Maps backend JSON role string to scholarly Vietnamese display label.
 * Contract: Backend roles are ["Learner"], ["Creator"], ["Moderator"], ["Admin"].
 * 
 * @param {string} role 
 * @returns {string}
 */
export function getRoleLabel(role) {
  switch (role) {
    case 'Admin': return 'Quản trị';
    case 'Moderator': return 'Kiểm duyệt';
    case 'Creator': return 'Tác giả';
    case 'Learner':
    default:
      return 'Học viên';
  }
}

/**
 * Maps backend role to CSS badge classes defined in style.css.
 * 
 * @param {string} role 
 * @returns {string}
 */
export function getRoleBadgeClass(role) {
  switch (role) {
    case 'Admin':
      return 'badge-status badge-status-approved';
    case 'Moderator':
      return 'badge-status badge-status-active';
    case 'Creator':
      return 'badge-status badge-status-pending';
    case 'Learner':
    default:
      return 'badge-status badge-status-draft';
  }
}

/**
 * Resolves the primary/highest-privileged role from an array of roles.
 * Priority hierarchy: Admin > Moderator > Creator > Learner.
 * 
 * @param {string[]} roles 
 * @returns {string}
 */
export function getPrimaryRole(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return 'Learner';
  if (roles.includes('Admin')) return 'Admin';
  if (roles.includes('Moderator')) return 'Moderator';
  if (roles.includes('Creator')) return 'Creator';
  return 'Learner';
}

/**
 * Authoritatively renders the authentication actions inside the navbar container.
 * 
 * @param {HTMLElement} container 
 */
export function renderNavbarAuth(container) {
  if (!container) return;

  clearContainer(container);

  const isDemo = (isDemoFallbackActive() || isGitHubPagesEnvironment()) && !isApiConfigured();
  const rawPath = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
  const currentPage = (rawPath.split('/').pop() || '').toLowerCase();
  const activeRoles = authManager.getRoles();
  const hasStaffRole = activeRoles.includes('Admin') || activeRoles.includes('Creator') || activeRoles.includes('Moderator');
  const isManagement = MANAGEMENT_PAGE_SET.has(currentPage) || (currentPage === 'profile.html' && hasStaffRole);

  if (!authManager.isAuthenticated()) {
    // --- GUEST STATE ---
    if (isManagement) {
      // In Management Workspace: render direct login button without student registration
      const loginAttrs = {
        href: currentPage ? `login.html?redirect=${currentPage}` : 'login.html',
        id: 'navLoginBtn',
        'aria-label': 'Đăng nhập vào không gian quản lý'
      };

      const loginLink = createSafeElement('a', {
        className: 'btn-chinese-primary py-2 px-3 text-decoration-none',
        text: 'Đăng nhập',
        attrs: loginAttrs
      });

      if (isDemo) {
        container.appendChild(createDemoSimulationBadge());
      }
      container.appendChild(loginLink);
    } else {
      const isLoginActive = currentPage === 'login.html';
      const isRegisterActive = currentPage === 'register.html';

      const loginAttrs = {
        href: 'login.html',
        id: 'navLoginBtn'
      };
      if (isLoginActive) {
        loginAttrs['aria-current'] = 'page';
      }

      const registerAttrs = {
        href: 'register.html',
        id: 'navRegisterBtn'
      };
      if (isRegisterActive) {
        registerAttrs['aria-current'] = 'page';
      }

      const loginLink = createSafeElement('a', {
        className: `btn-chinese-secondary py-2 px-3 text-decoration-none${isLoginActive ? ' active' : ''}`,
        text: 'Đăng nhập',
        attrs: loginAttrs
      });

      const registerLink = createSafeElement('a', {
        className: `btn-chinese-primary py-2 px-3 text-decoration-none${isRegisterActive ? ' active' : ''}`,
        text: 'Đăng ký',
        attrs: registerAttrs
      });

      if (isDemo) {
        container.appendChild(createDemoSimulationBadge());
      }
      container.appendChild(loginLink);
      container.appendChild(registerLink);
    }
  } else {
    // --- AUTHENTICATED STATE ---
    const user = authManager.getUser();
    const displayName = user?.fullName?.trim() || user?.emailOrPhone || 'Học viên';
    const emailOrPhone = user?.emailOrPhone || '';
    const initial = (displayName.charAt(0) || '字').toUpperCase();
    const roles = authManager.getRoles();
    const primaryRole = getPrimaryRole(roles);

    // Build role shortcut links for the account dropdown
    const dropdownLinks = [];

    if (isManagement) {
      // In Management Workspace: purely administrative account menu
      // 1. Account profile & security
      dropdownLinks.push(
        createSafeElement('a', {
          className: 'nav-dropdown-item py-2 px-3 text-decoration-none d-flex align-items-center gap-2',
          text: 'Hồ sơ tài khoản',
          attrs: {
            href: 'profile.html',
            id: 'navProfileBtn',
            'aria-label': 'Trang quản lý hồ sơ và bảo mật tài khoản'
          }
        })
      );

      // 2. Hub return shortcut: ONLY show when on a sub-operational page (never duplicate on management.html)
      if (currentPage !== 'management.html') {
        dropdownLinks.push(
          createSafeElement('a', {
            className: 'nav-dropdown-item py-2 px-3 text-decoration-none d-flex align-items-center gap-2',
            text: 'Trung tâm quản lý',
            attrs: {
              href: 'management.html',
              id: 'navManagementBtn',
              'aria-label': 'Quay về trang tổng quan trung tâm quản lý'
            }
          })
        );
      }
      // Strictly zero learning links ("Tiến độ học tập", "Không gian học tập") in Management Workspace
    } else {
      // In Learner Workspace: standard learner account menu
      dropdownLinks.push(
        createSafeElement('a', {
          className: 'nav-dropdown-item py-2 px-3 text-decoration-none d-flex align-items-center gap-2',
          text: 'Hồ sơ',
          attrs: {
            href: 'profile.html',
            id: 'navProfileBtn',
            'aria-label': 'Trang quản lý hồ sơ cá nhân'
          }
        })
      );

      // Learning Progress link (Tiến độ học tập - ngay dưới Hồ sơ)
      dropdownLinks.push(
        createSafeElement('a', {
          className: 'nav-dropdown-item py-2 px-3 text-decoration-none d-flex align-items-center gap-2',
          text: 'Tiến độ học tập',
          attrs: {
            href: 'srs-dashboard.html',
            id: 'navLearningProgressBtn',
            'aria-label': 'Theo dõi tiến độ học tập và cài đặt SRS'
          }
        })
      );

      // Management Area gateway for Creator, Moderator, or Admin
      const hasManagementRole = roles.includes('Creator') || roles.includes('Moderator') || roles.includes('Admin');
      if (hasManagementRole) {
        dropdownLinks.push(
          createSafeElement('a', {
            className: 'nav-dropdown-item py-2 px-3 text-decoration-none d-flex align-items-center gap-2',
            text: 'Khu vực quản lý',
            attrs: {
              href: 'management.html',
              id: 'navManagementBtn',
              'aria-label': 'Khu vực quản lý và tác nghiệp chuyên biệt'
            }
          })
        );
      }
    }

    // Dropdown Menu Panel
    const dropdownPanel = createSafeElement('div', {
      className: 'nav-account-dropdown-menu shadow-sm',
      attrs: {
        id: 'navAccountDropdownMenu',
        hidden: 'hidden'
      },
      children: [
        createSafeElement('div', {
          className: 'nav-dropdown-header px-3 py-2 border-bottom',
          children: [
            createSafeElement('div', {
              className: 'fw-bold small text-truncate',
              text: displayName,
              attrs: { title: displayName }
            }),
            createSafeElement('div', {
              className: 'text-muted small text-truncate',
              text: emailOrPhone || getRoleLabel(primaryRole)
            })
          ]
        }),
        createSafeElement('div', {
          className: 'nav-dropdown-links py-1',
          children: dropdownLinks
        })
      ]
    });

    // Resolve user avatar (custom local or online URL)
    const accountId = user?.accountId || 'current';
    let userAvatarUrl = user?.avatarUrl || null;
    if (!userAvatarUrl) {
      try {
        if (typeof localStorage !== 'undefined') {
          userAvatarUrl = localStorage.getItem(`weblearnchinese_custom_avatar_${accountId}`);
        }
      } catch (_) {}
    }
    const safeAvatar = userAvatarUrl ? sanitizeResourceUrl(userAvatarUrl) : null;
    const hasValidAvatar = safeAvatar && safeAvatar !== 'about:blank';

    const avatarNode = hasValidAvatar
      ? createSafeElement('img', {
          className: 'nav-user-avatar-img',
          attrs: {
            src: safeAvatar,
            alt: `Ảnh của ${displayName}`,
            'aria-hidden': 'true'
          }
        })
      : createSafeElement('span', {
          className: 'nav-user-avatar',
          text: initial,
          attrs: { 'aria-hidden': 'true' }
        });

    // Dropdown Trigger Button (Disclosure Pattern)
    const dropdownTrigger = createSafeElement('button', {
      className: 'nav-account-trigger btn py-1 px-2 d-inline-flex align-items-center gap-2',
      attrs: {
        type: 'button',
        id: 'navAccountDropdownTrigger',
        'aria-expanded': 'false',
        'aria-controls': 'navAccountDropdownMenu',
        'aria-label': `Tài khoản ${displayName} — Nhấn để mở menu phân hệ`
      },
      children: [
        avatarNode,
        createSafeElement('span', {
          className: 'nav-user-name fw-semibold',
          text: displayName,
          attrs: { id: 'navUserNameLink' }
        }),
        createSafeElement('span', {
          className: 'nav-dropdown-caret',
          text: '▾',
          attrs: { 'aria-hidden': 'true' }
        })
      ]
    });

    const dropdownWrapper = createSafeElement('div', {
      className: 'nav-account-dropdown-wrapper position-relative',
      attrs: { id: 'navAccountDropdownWrapper' },
      children: [dropdownTrigger, dropdownPanel]
    });

    // Wire disclosure toggle behavior
    const toggleMenu = (shouldOpen) => {
      const isCurrentlyExpanded = dropdownTrigger.getAttribute('aria-expanded') === 'true';
      const open = typeof shouldOpen === 'boolean' ? shouldOpen : !isCurrentlyExpanded;

      dropdownTrigger.setAttribute('aria-expanded', String(open));
      if (open) {
        dropdownPanel.removeAttribute('hidden');
      } else {
        dropdownPanel.setAttribute('hidden', 'hidden');
      }
    };

    dropdownTrigger.addEventListener('click', (e) => {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      toggleMenu();
    });

    dropdownTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggleMenu(false);
        dropdownTrigger.focus();
      }
    });

    dropdownPanel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggleMenu(false);
        dropdownTrigger.focus();
      }
    });

    // Close on outside click
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      const outsideClickListener = (e) => {
        if (dropdownWrapper.contains && !dropdownWrapper.contains(e.target)) {
          toggleMenu(false);
        }
      };
      document.addEventListener('click', outsideClickListener);
    }

    // Role Badge
    const roleBadge = createSafeElement('span', {
      className: getRoleBadgeClass(primaryRole),
      text: getRoleLabel(primaryRole),
      attrs: {
        id: 'navRoleBadge',
        'aria-label': `Vai trò: ${getRoleLabel(primaryRole)}`
      }
    });

    // Logout button
    const logoutBtn = createSafeElement('button', {
      className: 'btn-chinese-secondary py-1 px-3 btn-sm',
      text: 'Đăng xuất',
      attrs: {
        type: 'button',
        id: 'navLogoutBtn',
        'aria-label': 'Đăng xuất khỏi phiên làm việc'
      }
    });

    const userWrapper = createSafeElement('div', {
      className: 'nav-account-cluster d-flex align-items-center gap-2',
      attrs: { id: 'navAuthenticatedSection' },
      children: [
        ...(isDemo ? [createDemoSimulationBadge()] : []),
        roleBadge,
        dropdownWrapper,
        logoutBtn
      ]
    });

    // Bind logout handler
    const handleLogout = () => {
      const isProtectedPage = typeof window !== 'undefined' && 
        (window.location.pathname.endsWith('profile.html') ||
         window.location.pathname.endsWith('srs-dashboard.html') ||
         window.location.pathname.endsWith('srs-review.html') ||
         window.location.pathname.endsWith('creator-lessons.html') ||
         window.location.pathname.endsWith('creator-lesson-editor.html') ||
         window.location.pathname.endsWith('creator-import.html') ||
         window.location.pathname.endsWith('moderator-queue.html') ||
         window.location.pathname.endsWith('moderator-review.html') ||
         window.location.pathname.endsWith('moderator-history.html') ||
         window.location.pathname.endsWith('admin-accounts.html') ||
         window.location.pathname.endsWith('admin-roles.html') ||
         window.location.pathname.endsWith('admin-radicals.html') ||
         window.location.pathname.endsWith('admin-vocabulary.html') ||
         window.location.pathname.endsWith('admin-lessons.html') ||
         window.location.pathname.endsWith('management.html') ||
         window.location.pathname.endsWith('admin-audit-logs.html'));

      if (authManager.isAuthenticated()) {
        try {
          apiClient('/auth/logout', { method: 'POST', skipAuthRedirect: true }).catch(() => null);
        } catch (_) {}
      }

      authManager.logout(false);

      if (isProtectedPage) {
        window.location.href = 'index.html';
      } else {
        try {
          showToast({
            type: 'info',
            title: 'Phiên làm việc',
            message: 'Bạn đã đăng xuất thành công.'
          });
        } catch (_) {
          // Toast notification optional in standalone environments
        }
      }
    };

    logoutBtn.addEventListener('click', handleLogout);

    container.appendChild(userWrapper);
  }
}

const REVIEW_HUB_SUBPAGES = new Set([
  'srs-review.html',
  'srs-dashboard.html',
  'lessons.html',
  'lesson-detail.html'
]);

/**
 * Synchronizes the active state and aria-current="page" on primary navbar links (.navbar-nav),
 * ensuring sub-pages of the Review Hub (srs-dashboard.html, lessons.html, lesson-detail.html)
 * highlight "Ôn tập" (srs-review.html).
 */
export function syncActiveNavLinks() {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !window.location) return;
  if (typeof document.querySelector !== 'function') return;

  const rawPath = window.location.pathname || '';
  const currentPage = (rawPath.split('/').pop() || 'index.html').toLowerCase();

  let effectiveNavTarget = currentPage;
  if (REVIEW_HUB_SUBPAGES.has(currentPage)) {
    effectiveNavTarget = 'srs-review.html';
  } else if (currentPage.startsWith('creator-')) {
    effectiveNavTarget = 'creator-lessons.html';
  } else if (currentPage.startsWith('moderator-')) {
    effectiveNavTarget = 'moderator-queue.html';
  }

  const navContainer = document.querySelector('.navbar-nav');
  if (!navContainer || typeof navContainer.querySelectorAll !== 'function') return;

  const navLinks = navContainer.querySelectorAll('a.nav-link-custom, a.nav-link');
  navLinks.forEach((link) => {
    const href = (link.getAttribute('href') || '').trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

    const linkPage = href.split('?')[0].split('#')[0].split('/').pop().toLowerCase();
    const isAdminMatch = currentPage.startsWith('admin-') && linkPage.startsWith('admin-');

    if (linkPage === effectiveNavTarget || isAdminMatch) {
      if (link.classList) link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      if (link.classList) link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });

  const loginBtn = document.getElementById('navLoginBtn');
  if (loginBtn) {
    if (currentPage === 'login.html') {
      if (loginBtn.classList) loginBtn.classList.add('active');
      loginBtn.setAttribute('aria-current', 'page');
    } else {
      if (loginBtn.classList) loginBtn.classList.remove('active');
      loginBtn.removeAttribute('aria-current');
    }
  }

  const registerBtn = document.getElementById('navRegisterBtn');
  if (registerBtn) {
    if (currentPage === 'register.html') {
      if (registerBtn.classList) registerBtn.classList.add('active');
      registerBtn.setAttribute('aria-current', 'page');
    } else {
      if (registerBtn.classList) registerBtn.classList.remove('active');
      registerBtn.removeAttribute('aria-current');
    }
  }
}

/**
 * Initializes the navbar authentication watcher and binds auth lifecycle events.
 * 
 * @param {string|HTMLElement} containerOrId - Container ID or HTMLElement instance
 * @returns {() => void} Cleanup function to unbind listeners
 */
export function initNavbarAuth(containerOrId = 'navAuthContainer') {
  syncActiveNavLinks();

  const container = typeof containerOrId === 'string'
    ? document.getElementById(containerOrId)
    : containerOrId;

  if (!container) return () => {};

  renderNavbarAuth(container);

  const handleAuthChange = () => {
    renderNavbarAuth(container);
  };

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('auth:login', handleAuthChange);
    window.addEventListener('auth:logout', handleAuthChange);
    window.addEventListener('auth:expired', handleAuthChange);
    window.addEventListener('auth:update', handleAuthChange);
  }

  return () => {
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('auth:login', handleAuthChange);
      window.removeEventListener('auth:logout', handleAuthChange);
      window.removeEventListener('auth:expired', handleAuthChange);
      window.removeEventListener('auth:update', handleAuthChange);
    }
  };
}

/**
 * Deprecated: Navbar dropdowns removed in favor of direct links.
 * Kept as no-op for backward compatibility.
 */
export function initNavbarDropdowns() {
  // No-op: Navbar is flat with direct links (Trang chủ, Bộ thủ, Từ vựng, Ôn tập)
}

