-- =============================================================================
-- Migration: V8__add_radical_learning_fields.sql
-- Description: Add learning metadata columns to RADICAL table
-- Columns added:
--   - explanation_vi: Short pedagogical explanation/mnemonic for radical
--   - video_lesson_url: URL to video lesson (YouTube Privacy-Enhanced)
--   - common_rank: Ranking for 50 common radicals (1..50), NULL for remaining 164
-- Constraints:
--   - uk_radical_common_rank: Unique non-null common_rank
--   - chk_radical_common_rank: Range check (1..50) when not null
-- Database: MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

ALTER TABLE `radical`
    ADD COLUMN `explanation_vi` VARCHAR(1000) NULL AFTER `meaning_vi`,
    ADD COLUMN `video_lesson_url` VARCHAR(500) NULL AFTER `video_writing_url`,
    ADD COLUMN `common_rank` TINYINT UNSIGNED NULL AFTER `video_lesson_url`;

ALTER TABLE `radical`
    ADD CONSTRAINT `uk_radical_common_rank` UNIQUE (`common_rank`),
    ADD CONSTRAINT `chk_radical_common_rank` CHECK (`common_rank` IS NULL OR (`common_rank` >= 1 AND `common_rank` <= 50));
