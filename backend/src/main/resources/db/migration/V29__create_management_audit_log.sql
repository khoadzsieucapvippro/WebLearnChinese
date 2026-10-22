-- =============================================================================
-- Migration: V29__create_management_audit_log.sql
-- Description: Tạo bảng MANAGEMENT_AUDIT_LOG phục vụ hệ thống nhật ký kiểm toán quản trị tập trung (R5)
-- Database: MySQL 8.4+ & H2 Compatibility
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

CREATE TABLE `MANAGEMENT_AUDIT_LOG` (
    `log_id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `actor_id` BIGINT UNSIGNED NULL,
    `actor_username` VARCHAR(191) NOT NULL,
    `actor_roles` VARCHAR(100) NULL,
    `action_type` VARCHAR(50) NOT NULL,
    `resource_type` VARCHAR(50) NOT NULL,
    `resource_id` VARCHAR(100) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    `error_message` VARCHAR(500) NULL,
    `details` TEXT NULL,
    `payload_before` LONGTEXT NULL,
    `payload_after` LONGTEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `chk_management_audit_status` CHECK (`status` IN ('SUCCESS', 'FAILED')),
    CONSTRAINT `fk_management_audit_actor` FOREIGN KEY (`actor_id`) 
        REFERENCES `ACCOUNT` (`account_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_management_audit_actor_username` (`actor_username`),
    INDEX `idx_management_audit_action_type` (`action_type`),
    INDEX `idx_management_audit_resource` (`resource_type`, `resource_id`),
    INDEX `idx_management_audit_created_at` (`created_at`),
    INDEX `idx_management_audit_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
