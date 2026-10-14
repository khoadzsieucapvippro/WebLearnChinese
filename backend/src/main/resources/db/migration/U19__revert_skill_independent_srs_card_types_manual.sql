-- =============================================================================
-- Manual Rollback Script: U19__revert_skill_independent_srs_card_types_manual.sql
-- Description: 
--   Manual emergency reversal script for V19 (Flyway Community Edition).
--   Reverts CARD_PROGRESS and REVIEW_LOG to single-card schema.
--   CAUTION: Execute only during manual disaster recovery on a verified backup.
-- Database: MySQL 8.4+
-- =============================================================================

ALTER TABLE `CARD_PROGRESS` DROP CONSTRAINT IF EXISTS `chk_card_progress_card_type`;
ALTER TABLE `CARD_PROGRESS` DROP INDEX IF EXISTS `idx_card_progress_skill_due`;
ALTER TABLE `CARD_PROGRESS` DROP INDEX IF EXISTS `uk_card_progress_user_item_skill`;
ALTER TABLE `CARD_PROGRESS` ADD CONSTRAINT `uk_card_progress_user_item` UNIQUE (`user_id`, `item_type`, `item_id`);
ALTER TABLE `CARD_PROGRESS` DROP COLUMN IF EXISTS `card_type`;

ALTER TABLE `REVIEW_LOG` DROP CONSTRAINT IF EXISTS `chk_review_log_card_type`;
ALTER TABLE `REVIEW_LOG` DROP INDEX IF EXISTS `idx_review_log_user_skill_date`;
ALTER TABLE `REVIEW_LOG` DROP COLUMN IF EXISTS `card_type`;

DELETE FROM `flyway_schema_history` WHERE `version` = '19';
