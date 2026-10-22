/**
 * =============================================================================
 * CENTRALIZED MANAGEMENT AUDIT LOG SYSTEM VERIFIER
 * File: tests/e2e/utils/audit-log-verifier.mjs
 * 
 * Verifies Audit Logging System Requirements (R5, F8, F9, F10, F11, F12, F13):
 * 1. Flyway V29 non-destructive schema, column contracts, and indexing.
 * 2. Sensitive data sanitization (passwords, JWTs, tokens redacted to [REDACTED]).
 * 3. Audit logging hooks for role changes, user locking, resource edits, moderation.
 * 4. Admin-only REST API with pagination, sorting, and filtering.
 * =============================================================================
 */

const SENSITIVE_KEY_PATTERN = /password|passwd|secret|jwt|token|bearer|authorization|creditcard/i;

/**
 * Recursively redacts sensitive credentials from JSON objects/arrays.
 * Conforms to F10 AuditDataSanitizer contract.
 * 
 * @param {any} input
 * @returns {any}
 */
export function sanitizeAuditPayload(input) {
  if (input === null || input === undefined) return input;

  if (typeof input === 'string') {
    // If string itself looks like a JWT token (eyJhbGciOi...)
    if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(input.trim())) {
      return '[REDACTED]';
    }
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeAuditPayload(item));
  }

  if (typeof input === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeAuditPayload(value);
      } else if (typeof value === 'string' && /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value.trim())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return input;
}

/**
 * Validates Flyway V29 migration SQL against architectural specifications (F8).
 * 
 * @param {string} sqlContent
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAuditMigrationSchema(sqlContent) {
  const errors = [];
  const upperSql = sqlContent.toUpperCase();

  // Must not drop or truncate existing tables
  if (upperSql.includes('DROP TABLE VOCABULARY') ||
      upperSql.includes('DROP TABLE LESSON') ||
      upperSql.includes('TRUNCATE')) {
    errors.push('Destructive SQL commands (DROP/TRUNCATE) detected in migration');
  }

  // Must create MANAGEMENT_AUDIT_LOG table
  if (!upperSql.includes('CREATE TABLE') || !upperSql.includes('MANAGEMENT_AUDIT_LOG')) {
    errors.push('Must create MANAGEMENT_AUDIT_LOG table');
  }

  // Required columns check
  const requiredColumns = [
    'ACTOR_ID',
    'ACTOR_USERNAME',
    'ACTION_TYPE',
    'RESOURCE_TYPE',
    'RESOURCE_ID',
    'STATUS',
    'DETAILS_SUMMARY',
    'TIMESTAMP'
  ];

  for (const col of requiredColumns) {
    if (!upperSql.includes(col)) {
      errors.push(`Missing mandatory column ${col} in MANAGEMENT_AUDIT_LOG definition`);
    }
  }

  // Indexes check
  const indexKeywords = ['INDEX', 'KEY'];
  const hasIndexes = indexKeywords.some(kw => upperSql.includes(kw));
  if (!hasIndexes) {
    errors.push('Table must declare performance indexes for actor, action_type, resource_type, timestamp');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * In-memory Audit Log Store conforming to F9, F11, F12 contract specifications.
 */
export class AuditLogMockStore {
  constructor() {
    this.logs = [];
    this.nextId = 1;
  }

  /**
   * Records an audit event with sanitization.
   */
  recordEvent({
    actorId,
    actorUsername,
    actionType,
    resourceType,
    resourceId,
    status = 'SUCCESS',
    detailsSummary = '',
    beforeState = null,
    afterState = null,
    ipAddress = '127.0.0.1'
  }) {
    const entry = {
      id: this.nextId++,
      actorId,
      actorUsername,
      actionType,
      resourceType,
      resourceId: resourceId !== undefined ? String(resourceId) : null,
      status,
      detailsSummary,
      beforeState: sanitizeAuditPayload(beforeState),
      afterState: sanitizeAuditPayload(afterState),
      ipAddress,
      timestamp: new Date().toISOString()
    };
    this.logs.unshift(entry);
    return entry;
  }

  /**
   * Evaluates query to GET /api/v1/admin/audit-logs.
   * Enforces Admin role check, pagination, and multi-field filtering.
   */
  queryLogs({
    userRoles = [],
    page = 0,
    size = 20,
    sort = 'timestamp,desc',
    actionType,
    resourceType,
    actor,
    status,
    startDate,
    endDate
  } = {}) {
    // 1. RBAC check: Must have Admin role
    const isAdmin = userRoles.map(r => r.toUpperCase()).includes('ROLE_ADMIN') || userRoles.includes('Admin');
    if (!isAdmin) {
      return {
        status: 403,
        error: 'Forbidden',
        message: 'Chỉ Quản trị viên (Admin) mới có quyền truy cập nhật ký kiểm toán'
      };
    }

    // 2. Validate and clamp pagination
    const clampedSize = Math.max(1, Math.min(Number(size) || 20, 100));
    const targetPage = Math.max(0, Number(page) || 0);

    // 3. Filter entries
    let filtered = [...this.logs];

    if (actionType) {
      filtered = filtered.filter(l => l.actionType === actionType);
    }
    if (resourceType) {
      filtered = filtered.filter(l => l.resourceType === resourceType);
    }
    if (actor) {
      const q = actor.toLowerCase();
      filtered = filtered.filter(l => (l.actorUsername || '').toLowerCase().includes(q));
    }
    if (status) {
      filtered = filtered.filter(l => l.status === status);
    }
    if (startDate) {
      const startMs = new Date(startDate).getTime();
      filtered = filtered.filter(l => new Date(l.timestamp).getTime() >= startMs);
    }
    if (endDate) {
      const endMs = new Date(endDate).getTime();
      filtered = filtered.filter(l => new Date(l.timestamp).getTime() <= endMs);
    }

    // 4. Sort
    if (sort.includes('asc')) {
      filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else {
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    // 5. Slice page
    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / clampedSize) || 1;
    const startIndex = targetPage * clampedSize;
    const content = filtered.slice(startIndex, startIndex + clampedSize);

    return {
      status: 200,
      data: {
        content,
        page: targetPage,
        size: clampedSize,
        totalElements,
        totalPages,
        first: targetPage === 0,
        last: targetPage >= totalPages - 1
      }
    };
  }

  /**
   * Detail endpoint GET /api/v1/admin/audit-logs/{id}
   */
  getById(id, userRoles = []) {
    const isAdmin = userRoles.map(r => r.toUpperCase()).includes('ROLE_ADMIN') || userRoles.includes('Admin');
    if (!isAdmin) {
      return { status: 403, error: 'Forbidden' };
    }

    const log = this.logs.find(l => l.id === Number(id));
    if (!log) {
      return { status: 404, error: 'Not Found', message: 'Không tìm thấy nhật ký kiểm toán với ID: ' + id };
    }

    return { status: 200, data: log };
  }
}
