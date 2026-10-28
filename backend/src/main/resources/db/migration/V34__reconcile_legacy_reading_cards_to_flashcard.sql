-- =============================================================================
-- Migration: V34__reconcile_legacy_reading_cards_to_flashcard.sql
-- Description: 
--   1. Reconcile legacy CARD_PROGRESS records where card_type = 'READING' into
--      'FLASHCARD' for users who do not yet have corresponding 'FLASHCARD' entries.
--   2. Reconcile legacy REVIEW_LOG records where card_type = 'READING' into
--      'FLASHCARD' for items that do not yet have corresponding 'FLASHCARD' logs.
--   3. Preserve TiDB nonclustered key compatibility and utf8mb4 collation.
-- Database: TiDB Cloud Serverless / MySQL 8.0+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Reconcile CARD_PROGRESS from READING to FLASHCARD
-- -----------------------------------------------------------------------------
INSERT INTO `CARD_PROGRESS` (
    `user_id`,
    `item_type`,
    `card_type`,
    `item_id`,
    `ease_factor`,
    `interval_days`,
    `repetitions`,
    `next_review_at`,
    `version`
)
SELECT 
    cp.`user_id`,
    cp.`item_type`,
    'FLASHCARD',
    cp.`item_id`,
    cp.`ease_factor`,
    cp.`interval_days`,
    cp.`repetitions`,
    cp.`next_review_at`,
    0
FROM `CARD_PROGRESS` cp
WHERE cp.`card_type` = 'READING'
  AND NOT EXISTS (
      SELECT 1 
      FROM `CARD_PROGRESS` target
      WHERE target.`user_id` = cp.`user_id`
        AND target.`item_type` = cp.`item_type`
        AND target.`item_id` = cp.`item_id`
        AND target.`card_type` = 'FLASHCARD'
  );

-- -----------------------------------------------------------------------------
-- Step 2: Reconcile REVIEW_LOG from READING to FLASHCARD
-- -----------------------------------------------------------------------------
INSERT INTO `REVIEW_LOG` (
    `user_id`,
    `item_type`,
    `card_type`,
    `item_id`,
    `rating`,
    `interval_before`,
    `interval_after`,
    `review_time_seconds`,
    `reviewed_at`
)
SELECT
    rl.`user_id`,
    rl.`item_type`,
    'FLASHCARD',
    rl.`item_id`,
    rl.`rating`,
    rl.`interval_before`,
    rl.`interval_after`,
    rl.`review_time_seconds`,
    rl.`reviewed_at`
FROM `REVIEW_LOG` rl
WHERE rl.`card_type` = 'READING'
  AND NOT EXISTS (
      SELECT 1
      FROM `REVIEW_LOG` target
      WHERE target.`user_id` = rl.`user_id`
        AND target.`item_type` = rl.`item_type`
        AND target.`item_id` = rl.`item_id`
        AND target.`card_type` = 'FLASHCARD'
  );
