package com.weblearnchinese.model.enums;

/**
 * Audit status enum (alias for com.elearning.common.AuditStatus).
 */
public enum AuditStatus {
    SUCCESS,
    FAILED;

    public com.elearning.common.AuditStatus toCore() {
        return com.elearning.common.AuditStatus.valueOf(this.name());
    }

    public static AuditStatus fromCore(com.elearning.common.AuditStatus core) {
        return core != null ? AuditStatus.valueOf(core.name()) : null;
    }
}
