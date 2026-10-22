/**
 * =============================================================================
 * MANAGEMENT DECOUPLING, NAVIGATION & SETTINGS CONTEXT UTILITY
 * File: tests/e2e/utils/management-e2e-context.mjs
 * 
 * Verifies Frontend Decoupling, RBAC Navigation, and Account Security (R1, R3):
 * 1. Role-based navigation contracts in nav.js (F14, F15).
 * 2. Profile page decoupling and workspace removal (F16).
 * 3. Consistent management sub-navigation with "Quay lại học" (F17).
 * 4. Audio/Writing settings localStorage integration and disclaimer banner (F18).
 * 5. Password change client validation and zero Web Storage exposure (F19).
 * =============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Standard test personas for multi-role application testing.
 */
export const TEST_PERSONAS = {
  learner: {
    accountId: 101,
    emailOrPhone: 'learner_lan@example.com',
    fullName: 'Nguyễn Thị Lan',
    roles: ['Learner']
  },
  creator: {
    accountId: 202,
    emailOrPhone: 'creator_bao@example.com',
    fullName: 'Trần Gia Bảo',
    roles: ['Creator']
  },
  moderator: {
    accountId: 303,
    emailOrPhone: 'moderator_morgan@example.com',
    fullName: 'Morgan Kiểm Duyệt',
    roles: ['Moderator']
  },
  creatorModerator: {
    accountId: 404,
    emailOrPhone: 'dual_alex@example.com',
    fullName: 'Alex Song Vai',
    roles: ['Creator', 'Moderator']
  },
  admin: {
    accountId: 505,
    emailOrPhone: 'admin_hethong@example.com',
    fullName: 'Quản Trị Viên Hệ Thống',
    roles: ['Admin']
  },
  adminTwo: {
    accountId: 506,
    emailOrPhone: 'admin_backup@example.com',
    fullName: 'Quản Trị Viên Phụ',
    roles: ['Admin']
  }
};

/**
 * Evaluates navigation role visibility according to F15 contract.
 * - Learner: "Khu vực quản lý" MUST BE HIDDEN.
 * - Creator, Moderator, Admin: "Khu vực quản lý" MUST BE VISIBLE and point to 'management.html'.
 * 
 * @param {string[]} roles
 * @returns {{ showManagementLink: boolean, targetHref: string }}
 */
export function evaluateNavManagementEntry(roles = []) {
  const safeRoles = Array.isArray(roles) ? roles : [];
  const normRoles = safeRoles.map(r => String(r || '').toUpperCase().replace(/^ROLE_/, ''));
  const hasManagementRole = normRoles.includes('CREATOR') ||
                            normRoles.includes('MODERATOR') ||
                            normRoles.includes('ADMIN');

  return {
    showManagementLink: hasManagementRole,
    targetHref: hasManagementRole ? 'management.html' : ''
  };
}

/**
 * Evaluates Management Central Hub HTML/Component structure (F14).
 * 
 * @param {string} htmlContent
 * @param {string[]} userRoles
 * @returns {{ hasBackToLearning: boolean, visibleSections: string[], errors: string[] }}
 */
export function evaluateManagementHubStructure(htmlContent, userRoles = []) {
  const errors = [];
  const normRoles = userRoles.map(r => r.toUpperCase().replace(/^ROLE_/, ''));

  // Must have "Quay lại học" link
  const hasBackToLearning = /Quay lại học|href=["'](index\.html|vocabulary\.html|srs-dashboard\.html)["']/i.test(htmlContent);
  if (!hasBackToLearning) {
    errors.push('Management hub must feature "Quay lại học" link or button leading back to learning area');
  }

  const visibleSections = [];
  if (normRoles.includes('CREATOR') || normRoles.includes('ADMIN')) {
    visibleSections.push('CREATOR');
  }
  if (normRoles.includes('MODERATOR') || normRoles.includes('ADMIN')) {
    visibleSections.push('MODERATOR');
  }
  if (normRoles.includes('ADMIN')) {
    visibleSections.push('ADMIN');
  }

  return {
    hasBackToLearning,
    visibleSections,
    errors
  };
}

/**
 * Verifies that Profile page adheres to Decoupling Invariants (F16):
 * - Zero profileRoleWorkspacesSection
 * - Zero management navigation buttons (e.g. Creator Studio, Moderator Queue buttons)
 * 
 * @param {string} htmlContent
 * @returns {{ decoupled: boolean, violations: string[] }}
 */
export function verifyProfileDecoupling(htmlContent) {
  const violations = [];

  if (htmlContent.includes('id="profileRoleWorkspacesSection"') ||
      htmlContent.includes('id=\'profileRoleWorkspacesSection\'')) {
    violations.push('profileRoleWorkspacesSection found in profile HTML (Must be removed per F16)');
  }

  if (htmlContent.includes('btnGoCreatorStudio') ||
      htmlContent.includes('btnGoModeratorQueue') ||
      htmlContent.includes('btnGoAdminPanel')) {
    violations.push('Administrative/workspace navigation buttons found in profile HTML');
  }

  return {
    decoupled: violations.length === 0,
    violations
  };
}

/**
 * Validates Password Change Request payload according to F19 specification.
 * Contract:
 * - currentPassword: string, non-blank
 * - newPassword: string, length >= 6, !== currentPassword
 * 
 * @param {Object} body
 * @returns {{ valid: boolean, status: number, error?: string }}
 */
export function validateChangePasswordContract(body) {
  if (!body) {
    return { valid: false, status: 400, error: 'Request body cannot be null' };
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.trim() === '') {
    return { valid: false, status: 400, error: 'Mật khẩu hiện tại không được để trống' };
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
    return { valid: false, status: 400, error: 'Mật khẩu mới không được để trống' };
  }

  if (newPassword.length < 6) {
    return { valid: false, status: 400, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
  }

  if (newPassword === currentPassword) {
    return { valid: false, status: 400, error: 'Mật khẩu mới không được trùng với mật khẩu hiện tại' };
  }

  return { valid: true, status: 200 };
}

/**
 * Verifies that Web Storage contains zero raw passwords (Zero Web Storage Exposure Policy).
 * 
 * @param {Record<string, string>} storageMap
 * @returns {{ secure: boolean, leakedKeys: string[] }}
 */
export function auditWebStorageForPasswords(storageMap = {}) {
  const leakedKeys = [];

  function scanObject(prefix, obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const [key, val] of Object.entries(obj)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      if (/password/i.test(key)) {
        leakedKeys.push(fullPath);
      } else if (typeof val === 'object' && val !== null) {
        scanObject(fullPath, val);
      }
    }
  }

  for (const [key, rawValue] of Object.entries(storageMap)) {
    // Check if key itself represents stored password
    if (/password|currentpassword|newpassword|user_password/i.test(key)) {
      leakedKeys.push(key);
      continue;
    }
    // Check if JSON values inside stored objects contain plain password properties
    try {
      const parsed = JSON.parse(rawValue);
      if (typeof parsed === 'object' && parsed !== null) {
        scanObject(key, parsed);
      }
    } catch {
      // not JSON, ignore
    }
  }

  return {
    secure: leakedKeys.length === 0,
    leakedKeys
  };
}
