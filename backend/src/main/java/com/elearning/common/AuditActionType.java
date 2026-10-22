package com.elearning.common;

/**
 * Standard audit action types for administrative operations.
 */
public enum AuditActionType {
    // Quản trị người dùng & vai trò
    USER_ROLE_UPDATE,
    ACCOUNT_STATUS_UPDATE,

    // Kiểm duyệt bài học
    LESSON_APPROVE,
    LESSON_REJECT,

    // Quản lý bài học toàn hệ thống
    LESSON_CREATE,
    LESSON_UPDATE,
    LESSON_DELETE,

    // Quản lý từ vựng HSK
    VOCABULARY_CREATE,
    VOCABULARY_UPDATE,
    VOCABULARY_DELETE,

    // Quản lý 214 bộ thủ Khang Hy
    RADICAL_CREATE,
    RADICAL_UPDATE,
    RADICAL_DELETE
}
