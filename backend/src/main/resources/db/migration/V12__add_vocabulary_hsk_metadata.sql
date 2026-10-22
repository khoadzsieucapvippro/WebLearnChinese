-- =============================================================================
-- Migration: V12__add_vocabulary_hsk_metadata.sql
-- Description: Bổ sung metadata cấp độ HSK (HSK 3.0 Standard) cho từ vựng
-- Database: MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

ALTER TABLE `VOCABULARY`
    ADD COLUMN `hsk_level` TINYINT UNSIGNED NULL AFTER `meaning_vi`;

ALTER TABLE `VOCABULARY`
    ADD COLUMN `hsk_standard` VARCHAR(20) NOT NULL DEFAULT 'HSK 3.0' AFTER `hsk_level`;

CREATE INDEX `idx_vocab_hsk_level` ON `VOCABULARY` (`hsk_level`);
