-- =============================================================================
-- Migration: V16__seed_5_words_test_lesson.sql
-- Description: Seed an approved 5-word lesson for testing:
--              'Bài học 5 từ - Giao tiếp cơ bản'
--              Reuses authentic vocabulary entries:
--              1. 你好 (nǐ hǎo - Xin chào)
--              2. 谢谢 (xiè xiè - Cảm ơn)
--              3. 再见 (zài jiàn - Tạm biệt)
--              4. 对不起 (duì bu qǐ - Xin lỗi)
--              5. 没关系 (méi guān xi - Không sao)
-- Database: MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

SET @creator_id = (SELECT `account_id` FROM `account` WHERE `email_or_phone` = 'creator@test.com' LIMIT 1);
SET @creator_id = IFNULL(@creator_id, (SELECT `account_id` FROM `account` LIMIT 1));

-- -----------------------------------------------------------------------------
-- Seed Lesson: 'Bài học 5 từ - Giao tiếp cơ bản'
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'Bài học 5 từ - Giao tiếp cơ bản', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'Bài học 5 từ - Giao tiếp cơ bản');

SET @test_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'Bài học 5 từ - Giao tiếp cơ bản' LIMIT 1);

-- 1. 你好 (Xin chào)
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @test_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '你好' LIMIT 1;

-- 2. 谢谢 (Cảm ơn)
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @test_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '谢谢' AND `pinyin_raw` = 'xie xie' LIMIT 1;

-- 3. 再见 (Tạm biệt)
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @test_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '再见' AND `pinyin_raw` = 'zai jian' LIMIT 1;

-- 4. 对不起 (Xin lỗi)
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @test_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '对不起' AND `pinyin_raw` = 'dui bu qi' LIMIT 1;

-- 5. 没关系 (Không sao)
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @test_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '没关系' AND `pinyin_raw` = 'mei guan xi' LIMIT 1;
