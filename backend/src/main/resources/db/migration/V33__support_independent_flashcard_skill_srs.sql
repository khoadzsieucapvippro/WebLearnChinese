-- =============================================================================
-- Migration: V33__support_independent_flashcard_skill_srs.sql
-- Description: 
--   1. Expand card_type CHECK constraints on CARD_PROGRESS and REVIEW_LOG to include 'FLASHCARD'.
--   2. Allow completely independent SRS scheduling for Flashcard, Reading, Listening, and Writing.
-- Database: TiDB Cloud Serverless / MySQL 8.0+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

ALTER TABLE `CARD_PROGRESS`
    DROP CHECK `chk_card_progress_card_type`,
    ADD CONSTRAINT `chk_card_progress_card_type` 
        CHECK (`card_type` IN ('FLASHCARD', 'READING', 'LISTENING', 'WRITING'));

ALTER TABLE `REVIEW_LOG`
    DROP CHECK `chk_review_log_card_type`,
    ADD CONSTRAINT `chk_review_log_card_type` 
        CHECK (`card_type` IN ('FLASHCARD', 'READING', 'LISTENING', 'WRITING'));
