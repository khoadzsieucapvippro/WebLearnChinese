package com.weblearnchinese.model.enums;

/**
 * Audit resource type enum (alias for com.elearning.common.AuditResourceType).
 */
public enum AuditResourceType {
    USER,
    ROLE,
    LESSON,
    VOCABULARY,
    RADICAL,
    SYSTEM_SETTING;

    public com.elearning.common.AuditResourceType toCore() {
        return com.elearning.common.AuditResourceType.valueOf(this.name());
    }

    public static AuditResourceType fromCore(com.elearning.common.AuditResourceType core) {
        return core != null ? AuditResourceType.valueOf(core.name()) : null;
    }
}
