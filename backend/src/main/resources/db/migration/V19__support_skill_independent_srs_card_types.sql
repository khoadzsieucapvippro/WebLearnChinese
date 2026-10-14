-- =============================================================================
-- Migration: V19__support_skill_independent_srs_card_types.sql
-- Description: 
--   1. Add card_type column to CARD_PROGRESS and REVIEW_LOG.
--   2. Preserve 100% legacy study progress and review history as 'READING'.
--   3. Enable skill-independent spaced repetition scheduling for 'LISTENING' and 'WRITING'.
--   4. Update composite unique constraint to (user_id, item_type, item_id, card_type).
--   5. Add optimized composite indices for skill-filtered due and log queries.
-- Database: MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Add card_type column to CARD_PROGRESS with legacy default 'READING'
-- -----------------------------------------------------------------------------
ALTER TABLE `CARD_PROGRESS`
    ADD COLUMN `card_type` VARCHAR(20) NOT NULL DEFAULT 'READING' AFTER `item_id`;

-- -----------------------------------------------------------------------------
-- Step 2: Update unique constraint on CARD_PROGRESS to include card_type
-- -----------------------------------------------------------------------------
ALTER TABLE `CARD_PROGRESS`
    DROP INDEX `uk_card_progress_user_item`,
    ADD CONSTRAINT `uk_card_progress_user_item_skill` 
        UNIQUE (`user_id`, `item_type`, `item_id`, `card_type`);

-- -----------------------------------------------------------------------------
-- Step 3: Add CHECK constraint on card_type for CARD_PROGRESS
-- -----------------------------------------------------------------------------
ALTER TABLE `CARD_PROGRESS`
    ADD CONSTRAINT `chk_card_progress_card_type` 
        CHECK (`card_type` IN ('READING', 'LISTENING', 'WRITING'));

-- -----------------------------------------------------------------------------
-- Step 4: Add index for due cards retrieval filtered by skill
-- -----------------------------------------------------------------------------
ALTER TABLE `CARD_PROGRESS`
    ADD INDEX `idx_card_progress_skill_due` (`user_id`, `card_type`, `next_review_at`);

-- -----------------------------------------------------------------------------
-- Step 5: Add card_type column to REVIEW_LOG with legacy default 'READING'
-- -----------------------------------------------------------------------------
ALTER TABLE `REVIEW_LOG`
    ADD COLUMN `card_type` VARCHAR(20) NOT NULL DEFAULT 'READING' AFTER `item_id`;

-- -----------------------------------------------------------------------------
-- Step 6: Add CHECK constraint on card_type for REVIEW_LOG
-- -----------------------------------------------------------------------------
ALTER TABLE `REVIEW_LOG`
    ADD CONSTRAINT `chk_review_log_card_type` 
        CHECK (`card_type` IN ('READING', 'LISTENING', 'WRITING'));

-- -----------------------------------------------------------------------------
-- Step 7: Add index for review logs retrieval filtered by skill
-- -----------------------------------------------------------------------------
ALTER TABLE `REVIEW_LOG`
    ADD INDEX `idx_review_log_user_skill_date` (`user_id`, `card_type`, `reviewed_at`);
