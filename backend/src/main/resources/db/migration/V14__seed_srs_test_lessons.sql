-- =============================================================================
-- Migration: V14__seed_srs_test_lessons.sql
-- Description: Seed 3 Approved Lessons specifically for SRS Verification:
--              1. 'SRS Test - Basic Recall'
--              2. 'SRS Test - Failure Recovery'
--              3. 'SRS Test - Due Review'
--              Reuses authentic HSK 1 vocabulary entries (zero fake items, zero radicals).
-- Database: MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

SET @creator_id = (SELECT `account_id` FROM `account` WHERE `email_or_phone` = 'creator@test.com' LIMIT 1);
SET @creator_id = IFNULL(@creator_id, (SELECT `account_id` FROM `account` LIMIT 1));

-- -----------------------------------------------------------------------------
-- Lesson 1: SRS Test - Basic Recall
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'SRS Test - Basic Recall', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'SRS Test - Basic Recall');

SET @lesson1_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'SRS Test - Basic Recall' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson1_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '爱' LIMIT 1;

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson1_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '爱好' LIMIT 1;

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson1_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '八' LIMIT 1;

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson1_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '爸爸' LIMIT 1;

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson1_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '吧' LIMIT 1;

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson1_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '白' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 2: SRS Test - Failure Recovery
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'SRS Test - Failure Recovery', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'SRS Test - Failure Recovery');

SET @lesson2_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'SRS Test - Failure Recovery' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson2_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '白天' LIMIT 1;

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson2_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '百' LIMIT 1;

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson2_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '班' LIMIT 1;

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson2_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '半' LIMIT 1;

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson2_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '半年' LIMIT 1;

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson2_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '半天' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 3: SRS Test - Due Review
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'SRS Test - Due Review', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'SRS Test - Due Review');

SET @lesson3_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'SRS Test - Due Review' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson3_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '帮' LIMIT 1;

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson3_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '帮忙' LIMIT 1;

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson3_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '包' LIMIT 1;

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson3_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '包子' LIMIT 1;

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson3_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '杯' LIMIT 1;

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson3_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '杯子' LIMIT 1;
