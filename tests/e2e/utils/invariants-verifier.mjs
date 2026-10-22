/**
 * =============================================================================
 * MANAGEMENT BUSINESS INVARIANTS & SRS CONSTRAINTS VERIFIER
 * File: tests/e2e/utils/invariants-verifier.mjs
 * 
 * Verifies Business Invariants & Constraints (R4, F4, F5, F6, F7):
 * 1. Self-Review Invariant (Moderator cannot review own lesson).
 * 2. Last Active Admin Invariant with Concurrency-Safe Pessimistic Locking.
 * 3. SRS newCardsPerDay upper bound constraint (1 <= N <= 100).
 * 4. SRS "Hoàn tác thay đổi" standardization.
 * =============================================================================
 */

/**
 * Evaluates Moderation Self-Review Invariant (F4).
 * Contract:
 * When lesson.createdBy.accountId === reviewer.accountId:
 *   Throws/Rejects HTTP 403 FORBIDDEN with message:
 *   "Bạn không thể tự kiểm duyệt nội dung do chính mình tạo ra"
 * 
 * @param {Object} params
 * @param {number|string} params.lessonCreatorId
 * @param {number|string} params.reviewerAccountId
 * @param {string} [params.action='Approve'] 'Approve' or 'Reject'
 * @returns {{ allowed: boolean, status: number, errorCode?: string, message?: string }}
 */
export function evaluateSelfReviewInvariant({ lessonCreatorId, reviewerAccountId, action = 'Approve' }) {
  if (lessonCreatorId === undefined || lessonCreatorId === null ||
      reviewerAccountId === undefined || reviewerAccountId === null) {
    throw new Error('lessonCreatorId and reviewerAccountId are required');
  }

  const isSelf = String(lessonCreatorId) === String(reviewerAccountId);
  if (isSelf) {
    return {
      allowed: false,
      status: 403,
      errorCode: 'FORBIDDEN',
      message: 'Bạn không thể tự kiểm duyệt nội dung do chính mình tạo ra'
    };
  }

  return {
    allowed: true,
    status: 200,
    message: `Thao tác ${action} bài học thành công`
  };
}

/**
 * Concurrency-safe state manager for Admin Account & Role invariant tests.
 */
export class AdminInvariantManager {
  /**
   * @param {Array<{ id: number, username: string, roles: string[], status: string }>} initialAccounts
   */
  constructor(initialAccounts = []) {
    this.accounts = JSON.parse(JSON.stringify(initialAccounts));
    this.lockHeld = false;
  }

  /**
   * Counts currently active admins.
   * @returns {number}
   */
  countActiveAdmins() {
    return this.accounts.filter(a =>
      a.roles.map(r => r.toUpperCase()).includes('ROLE_ADMIN') ||
      a.roles.includes('Admin')
    ).filter(a => a.status === 'ACTIVE').length;
  }

  /**
   * Simulates pessimistic row lock and role update (SELECT FOR UPDATE).
   * 
   * @param {number} targetAccountId
   * @param {string[]} requestedRoles
   * @param {number} actorAccountId
   * @returns {Promise<{ success: boolean, status: number, message: string }>}
   */
  async updateAccountRoles(targetAccountId, requestedRoles, actorAccountId) {
    // Acquire simulated pessimistic lock
    while (this.lockHeld) {
      await new Promise(r => setTimeout(r, 10));
    }
    this.lockHeld = true;

    try {
      // Simulate DB query delay
      await new Promise(r => setTimeout(r, 5));

      const target = this.accounts.find(a => a.id === targetAccountId);
      if (!target) {
        return { success: false, status: 404, message: 'Account not found' };
      }

      const isTargetActiveAdmin = (target.roles.includes('Admin') || target.roles.includes('ROLE_ADMIN')) &&
                                  target.status === 'ACTIVE';
      const willHaveAdminRole = requestedRoles.some(r => r.toUpperCase() === 'ROLE_ADMIN' || r === 'Admin');

      // Check self-demotion
      if (target.id === actorAccountId && !willHaveAdminRole && isTargetActiveAdmin) {
        return {
          success: false,
          status: 400,
          errorCode: 'BAD_REQUEST',
          message: 'Không thể tự tước quyền Quản trị viên (Admin) của chính mình'
        };
      }

      // Check last active admin invariant
      if (isTargetActiveAdmin && !willHaveAdminRole) {
        const activeCount = this.countActiveAdmins();
        if (activeCount <= 1) {
          return {
            success: false,
            status: 400,
            errorCode: 'BAD_REQUEST',
            message: 'Không thể hạ quyền hoặc vô hiệu hóa quản trị viên hoạt động cuối cùng của hệ thống'
          };
        }
      }

      // Apply update
      target.roles = [...requestedRoles];
      return { success: true, status: 200, message: 'Cập nhật vai trò thành công' };
    } finally {
      this.lockHeld = false;
    }
  }

  /**
   * Simulates locking/deactivating an admin account.
   */
  async updateAccountStatus(targetAccountId, newStatus, actorAccountId) {
    while (this.lockHeld) {
      await new Promise(r => setTimeout(r, 10));
    }
    this.lockHeld = true;

    try {
      await new Promise(r => setTimeout(r, 5));
      const target = this.accounts.find(a => a.id === targetAccountId);
      if (!target) return { success: false, status: 404, message: 'Account not found' };

      const isTargetActiveAdmin = (target.roles.includes('Admin') || target.roles.includes('ROLE_ADMIN')) &&
                                  target.status === 'ACTIVE';

      if (isTargetActiveAdmin && newStatus !== 'ACTIVE') {
        const activeCount = this.countActiveAdmins();
        if (activeCount <= 1) {
          return {
            success: false,
            status: 400,
            errorCode: 'BAD_REQUEST',
            message: 'Không thể hạ quyền hoặc vô hiệu hóa quản trị viên hoạt động cuối cùng của hệ thống'
          };
        }
      }

      target.status = newStatus;
      return { success: true, status: 200, message: 'Cập nhật trạng thái thành công' };
    } finally {
      this.lockHeld = false;
    }
  }
}

/**
 * Validates SRS newCardsPerDay bound according to F6 contract (1 <= N <= 100).
 * 
 * @param {any} value
 * @returns {{ valid: boolean, error?: string, sanitizedValue?: number }}
 */
export function validateSrsCardLimitBounds(value) {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: 'Số thẻ mới mỗi ngày không được để trống' };
  }

  const num = Number(value);
  if (isNaN(num) || !Number.isInteger(num)) {
    return { valid: false, error: 'Số thẻ mới mỗi ngày phải là số nguyên' };
  }

  if (num <= 0) {
    return { valid: false, error: 'Số thẻ mới mỗi ngày phải là số nguyên dương lớn hơn 0' };
  }

  if (num > 100) {
    return { valid: false, error: 'Số thẻ mới mỗi ngày không được vượt quá 100' };
  }

  return { valid: true, sanitizedValue: num };
}

/**
 * Evaluates SRS Settings Revert Button Label and Behavior (F7).
 * 
 * @param {Object} buttonProps
 * @param {string} buttonProps.label
 * @param {Object} formState
 * @param {Object} formState.original
 * @param {Object} formState.current
 * @returns {{ labelValid: boolean, revertsCleanly: boolean }}
 */
export function evaluateSrsButtonStandardization(buttonProps, formState) {
  const cleanLabel = (buttonProps.label || '').trim().toLowerCase();
  const labelValid = cleanLabel.includes('hoàn tác thay đổi') ||
                     cleanLabel === 'hoàn tác thay đổi' ||
                     cleanLabel.includes('revert');

  // After revert action, current state should match original
  const revertsCleanly = JSON.stringify(formState.original) === JSON.stringify(formState.current);

  return { labelValid, revertsCleanly };
}
