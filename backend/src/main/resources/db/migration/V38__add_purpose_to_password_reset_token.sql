-- =============================================================================
-- Migration: V38__add_purpose_to_password_reset_token.sql
-- Description: Mở rộng bảng password_reset_token với cột purpose để lưu OTP
--              xác thực email cho cả Quên mật khẩu (PASSWORD_RESET) và
--              Đăng ký tài khoản (REGISTRATION).
-- Database: MySQL 8.4+ & TiDB Cloud Serverless
-- =============================================================================

ALTER TABLE `password_reset_token`
    ADD COLUMN `purpose` VARCHAR(30) NOT NULL DEFAULT 'PASSWORD_RESET' AFTER `email`,
    DROP INDEX `uk_password_reset_token_email`,
    ADD CONSTRAINT `uk_password_reset_token_email_purpose` UNIQUE (`email`, `purpose`);
