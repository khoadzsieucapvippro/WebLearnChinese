-- =============================================================================
-- Migration: V38__add_purpose_to_password_reset_token.sql
-- Description: Mở rộng bảng password_reset_token với cột purpose để lưu OTP
--              xác thực email cho cả Quên mật khẩu (PASSWORD_RESET) và
--              Đăng ký tài khoản (REGISTRATION).
--              Tách thành từng lệnh ALTER TABLE đơn lẻ để tương thích TiDB Cloud Serverless
--              (TiDB không hỗ trợ nhiều thay đổi schema trong cùng 1 câu ALTER TABLE).
-- Database: MySQL 8.4+ & TiDB Cloud Serverless
-- =============================================================================

ALTER TABLE `password_reset_token`
    ADD COLUMN `purpose` VARCHAR(30) NOT NULL DEFAULT 'PASSWORD_RESET' AFTER `email`;

ALTER TABLE `password_reset_token`
    DROP INDEX `uk_password_reset_token_email`;

ALTER TABLE `password_reset_token`
    ADD CONSTRAINT `uk_password_reset_token_email_purpose` UNIQUE (`email`, `purpose`);
