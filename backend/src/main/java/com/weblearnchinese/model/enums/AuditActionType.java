package com.weblearnchinese.model.enums;

/**
 * Audit action type enum (alias for com.elearning.common.AuditActionType).
 */
public enum AuditActionType {
    USER_ROLE_UPDATE,
    ACCOUNT_STATUS_UPDATE,
    LESSON_APPROVE,
    LESSON_REJECT,
    LESSON_CREATE,
    LESSON_UPDATE,
    LESSON_DELETE,
    VOCABULARY_CREATE,
    VOCABULARY_UPDATE,
    VOCABULARY_DELETE,
    RADICAL_CREATE,
    RADICAL_UPDATE,
    RADICAL_DELETE;

    public com.elearning.common.AuditActionType toCore() {
        return com.elearning.common.AuditActionType.valueOf(this.name());
    }

    public static AuditActionType fromCore(com.elearning.common.AuditActionType core) {
        return core != null ? AuditActionType.valueOf(core.name()) : null;
    }
}
