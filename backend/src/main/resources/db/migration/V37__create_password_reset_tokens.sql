-- =============================================================================
-- Migration: V37__create_password_reset_tokens.sql
-- Description: Lưu trữ mã xác thực đặt lại mật khẩu (OTP băm SHA-256 + salt)
--              cùng bộ đếm số lần nhập sai và thời gian chống spam gửi lại.
-- Database: MySQL 8.4+ & TiDB Cloud Serverless
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

CREATE TABLE `password_reset_token` (
    `token_id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(191) NOT NULL,
    `code_hash` VARCHAR(200) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `last_sent_at` DATETIME NOT NULL,
    `failed_attempts` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `uk_password_reset_token_email` UNIQUE (`email`),
    INDEX `idx_password_reset_token_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
