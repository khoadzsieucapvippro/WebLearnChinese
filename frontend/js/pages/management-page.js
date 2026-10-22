/**
 * =============================================================================
 * CENTRAL MANAGEMENT & WORKSPACE HUB CONTROLLER (FEATURE F14)
 * Module: frontend/js/pages/management-page.js
 * 
 * Responsibilities:
 * - Aggregates management tasks and operations per authenticated role:
 *   * Creator Studio: creator-lessons.html, creator-import.html
 *   * Moderation: moderator-queue.html, moderator-history.html
 *   * Administration: admin-accounts.html, admin-roles.html, admin-lessons.html,
 *     admin-radicals.html, admin-vocabulary.html, admin-audit-logs.html
 * - Enforces RBAC access guard:
 *   * Unauthenticated: prompts login redirect.
 *   * Learner only: displays polite role alert and redirects to learning.
 *   * Creator / Moderator: displays authorized operational cards.
 *   * Admin: full access to Creator, Moderator, and Admin sections.
 * - Single point of entry ("Khu vực quản lý") decoupled from learner profile settings.
 * =============================================================================
 */

import { authManager } from '../auth/auth-state.js';
import { initNavbarAuth, getPrimaryRole, getRoleLabel, getRoleBadgeClass } from '../ui/nav.js';
import {
  hasManagementAccess,
  getVisibleManagementSections,
  initManagementLayout
} from '../ui/management-layout.js';

export { hasManagementAccess, getVisibleManagementSections };

/**
 * Initializes the Management Hub Page.
 */
export function initManagementPage() {
  if (typeof document === 'undefined') return;

  // Initialize navbar authentication state and listeners
  initNavbarAuth();

  // Initialize management workspace sidebar and drawer
  initManagementLayout();

  const authGuardContainer = document.getElementById('managementAuthGuardContainer');
  const authGuardMessage = document.getElementById('managementAuthGuardMessage');
  const btnManagementLogin = document.getElementById('btnManagementLogin');
  const sectionsContainer = document.getElementById('managementSectionsContainer');
  const userBadge = document.getElementById('managementUserBadge');

  const sectionCreator = document.getElementById('sectionCreatorStudio');
  const sectionModeration = document.getElementById('sectionModeration');
  const sectionAdmin = document.getElementById('sectionAdministration');

  const isAuthenticated = authManager.isAuthenticated();
  const roles = authManager.getRoles();
  const primaryRole = getPrimaryRole(roles);

  if (!isAuthenticated) {
    if (authGuardContainer) {
      authGuardContainer.classList.remove('d-none');
    }
    if (authGuardMessage) {
      authGuardMessage.textContent = 'Bạn cần đăng nhập với vai trò Tác giả, Kiểm duyệt viên hoặc Quản trị viên để truy cập Khu vực quản lý.';
    }
    if (btnManagementLogin) {
      btnManagementLogin.classList.remove('d-none');
    }
    if (sectionsContainer) {
      sectionsContainer.classList.add('d-none');
    }
    if (userBadge) {
      userBadge.textContent = 'Chưa đăng nhập';
      userBadge.className = 'badge bg-secondary-subtle text-secondary border small';
    }
    return;
  }

  if (!hasManagementAccess(roles)) {
    // Authenticated as Learner only
    if (authGuardContainer) {
      authGuardContainer.classList.remove('d-none');
    }
    if (authGuardMessage) {
      authGuardMessage.textContent = 'Tài khoản của bạn hiện chỉ có quyền Học viên. Khu vực quản lý dành riêng cho Tác giả (Creator), Kiểm duyệt viên (Moderator) và Quản trị viên (Admin).';
    }
    if (btnManagementLogin) {
      btnManagementLogin.classList.add('d-none');
    }
    if (sectionsContainer) {
      sectionsContainer.classList.add('d-none');
    }
    if (userBadge) {
      userBadge.textContent = getRoleLabel(primaryRole);
      userBadge.className = `${getRoleBadgeClass(primaryRole)} small`;
    }
    return;
  }

  // User has authorized management role
  if (authGuardContainer) {
    authGuardContainer.classList.add('d-none');
  }
  if (sectionsContainer) {
    sectionsContainer.classList.remove('d-none');
  }
  if (userBadge) {
    userBadge.textContent = getRoleLabel(primaryRole);
    userBadge.className = `${getRoleBadgeClass(primaryRole)} small`;
  }

  const visibility = getVisibleManagementSections(roles);

  if (sectionCreator) {
    if (visibility.creator) {
      sectionCreator.classList.remove('d-none');
    } else {
      sectionCreator.classList.add('d-none');
    }
  }

  if (sectionModeration) {
    if (visibility.moderator) {
      sectionModeration.classList.remove('d-none');
    } else {
      sectionModeration.classList.add('d-none');
    }
  }

  if (sectionAdmin) {
    if (visibility.admin) {
      sectionAdmin.classList.remove('d-none');
    } else {
      sectionAdmin.classList.add('d-none');
    }
  }
}

// Auto-run on DOM ready in browser
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initManagementPage());
  } else {
    initManagementPage();
  }
}
