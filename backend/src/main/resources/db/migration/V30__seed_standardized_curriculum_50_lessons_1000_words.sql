-- =============================================================================
-- Migration: V30__seed_standardized_curriculum_50_lessons_1000_words.sql
-- Description: Standardize all 50 official curriculum lessons for HSK 1, 2, and 3
--              (HSK 1: 15 lessons / 300 words, HSK 2: 10 lessons / 200 words,
--               HSK 3: 25 lessons / 500 words = 1,000 words total).
--              Cleans up legacy unstandardized 10 lessons from V17.
-- Database: TiDB Cloud Serverless / MySQL 8.0+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- Ensure creator account exists for valid foreign key reference
INSERT INTO `account` (`email_or_phone`, `password_hash`, `status`, `created_at`, `updated_at`, `authorization_version`)
SELECT 'creator@test.com', '$2a$10$UPN3ubt5uNRTKHbXcMsEgOjsd70AqQ.EMiekc6.7ngAuynlOFuFCm', 'Active', NOW(), NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM `account` WHERE `email_or_phone` = 'creator@test.com');

SET @creator_id = (SELECT `account_id` FROM `account` WHERE `email_or_phone` = 'creator@test.com' LIMIT 1);
SET @creator_id = IFNULL(@creator_id, (SELECT `account_id` FROM `account` LIMIT 1));

-- Clean up legacy unstandardized lessons from V17/V14/V16
DELETE lv FROM `lesson_vocabulary` lv
JOIN `lesson` l ON lv.`lesson_id` = l.`lesson_id`
WHERE l.`title` LIKE 'Bài 0%' OR l.`title` LIKE 'Bài 1%' OR l.`title` LIKE 'HSK %' OR l.`title` LIKE 'SRS Test%';

DELETE FROM `lesson`
WHERE `title` LIKE 'Bài 0%' OR `title` LIKE 'Bài 1%' OR `title` LIKE 'HSK %' OR `title` LIKE 'SRS Test%';

-- =============================================================================
-- Seed 50 Standardized Curriculum Lessons (1,000 Words)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Lesson 01/50: HSK 1 — Bài 01: Chào hỏi & Giao tiếp cơ bản
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 1 — Bài 01: Chào hỏi & Giao tiếp cơ bản', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 1 — Bài 01: Chào hỏi & Giao tiếp cơ bản');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 1 — Bài 01: Chào hỏi & Giao tiếp cơ bản' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '请' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '请问' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '谢谢' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '不客气' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '对不起' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '没关系' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '没事' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '再见' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '你好' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '您' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '问' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '说' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '说话' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '见' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '认识' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '好' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '对' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '不' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '行' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '吧' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 02/50: HSK 1 — Bài 02: Phương tiện, Trường học & Thiết bị
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 1 — Bài 02: Phương tiện, Trường học & Thiết bị', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 1 — Bài 02: Phương tiện, Trường học & Thiết bị');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 1 — Bài 02: Phương tiện, Trường học & Thiết bị' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '吃' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '出租车' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '穿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '打电话' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '大' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '大家' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '大学' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '大学生' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '到' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '的' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '第' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '弟弟' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '点' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '店' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '电话' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '电脑' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '电视' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '电影' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '电影院' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '东西' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 03/50: HSK 1 — Bài 03: Thời gian, Ăn uống & Cảm xúc
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 1 — Bài 03: Thời gian, Ăn uống & Cảm xúc', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 1 — Bài 03: Thời gian, Ăn uống & Cảm xúc');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 1 — Bài 03: Thời gian, Ăn uống & Cảm xúc' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '都' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '读' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '读书' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '对' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '对不起' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '多' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '多少' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '儿子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '二' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '饭' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '饭店' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '房间' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '非常' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '飞机' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '分' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '分钟' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '高兴' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '歌' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '哥哥' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '个' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 04/50: HSK 1 — Bài 04: Công việc, Ngôn ngữ & Tính từ cơ bản
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 1 — Bài 04: Công việc, Ngôn ngữ & Tính từ cơ bản', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 1 — Bài 04: Công việc, Ngôn ngữ & Tính từ cơ bản');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 1 — Bài 04: Công việc, Ngôn ngữ & Tính từ cơ bản' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '给' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '公司' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '工作' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '狗' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '贵' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '国' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '还' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '孩子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '汉语' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '汉字' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '好' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '好吃' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '好看' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '好听' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '好玩儿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '号' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '喝' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '和' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '很' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '后' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 05/50: HSK 1 — Bài 05: Thời gian, Gia đình & Hoạt động thường nhật
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 1 — Bài 05: Thời gian, Gia đình & Hoạt động thường nhật', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 1 — Bài 05: Thời gian, Gia đình & Hoạt động thường nhật');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 1 — Bài 05: Thời gian, Gia đình & Hoạt động thường nhật' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '回' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '会' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '火车' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '鸡蛋' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '几' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '家' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '家人' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '见' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '件' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '饺子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '叫' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '姐姐' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '今年' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '今天' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '九' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '觉得' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '开' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '开车' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '看' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '看病' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 06/50: HSK 1 — Bài 06: Mua bán, Thầy cô & Số đếm
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 1 — Bài 06: Mua bán, Thầy cô & Số đếm', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 1 — Bài 06: Mua bán, Thầy cô & Số đếm');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 1 — Bài 06: Mua bán, Thầy cô & Số đếm' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '看见' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '可以' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '课' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '口' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '块' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '来' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '老师' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '了' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '冷' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '里' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '两' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '零' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '六' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '妈妈' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '吗' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '买' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '卖' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '忙' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '猫' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '没关系' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 07/50: HSK 1 — Bài 07: Ẩm thực, Đại từ chỉ định & Nơi chốn
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 1 — Bài 07: Ẩm thực, Đại từ chỉ định & Nơi chốn', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 1 — Bài 07: Ẩm thực, Đại từ chỉ định & Nơi chốn');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 1 — Bài 07: Ẩm thực, Đại từ chỉ định & Nơi chốn' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '没事' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '没有' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '妹妹' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '们' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '米饭' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '面包' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '面条儿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '明年' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '明天' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '名字' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '哪' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '哪个' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '哪里' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '哪儿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '哪些' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '那' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '那边' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '那个' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '那里' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '那儿' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 08/50: HSK 1 — Bài 08: Đại từ xưng hô, Mối quan hệ & Đời sống
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 1 — Bài 08: Đại từ xưng hô, Mối quan hệ & Đời sống', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 1 — Bài 08: Đại từ xưng hô, Mối quan hệ & Đời sống');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 1 — Bài 08: Đại từ xưng hô, Mối quan hệ & Đời sống' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '那些' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '男' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '男朋友' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '呢' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '能' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '你' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '你好' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '你们' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '年' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '您' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '牛奶' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '女' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '女儿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '女朋友' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '女士' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '朋友' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '便宜' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '漂亮' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '苹果' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '七' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 09/50: HSK 1 — Bài 09: Lễ nghi, Thời gian & Công việc hàng ngày
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 1 — Bài 09: Lễ nghi, Thời gian & Công việc hàng ngày', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 1 — Bài 09: Lễ nghi, Thời gian & Công việc hàng ngày');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 1 — Bài 09: Lễ nghi, Thời gian & Công việc hàng ngày' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '起床' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '千' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '前' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '钱' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '请' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '请问' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '去' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '去年' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '热' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '人' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '认识' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '日' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '三' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '商店' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '上' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '上班' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '上课' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '上午' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '上学' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '少' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 10/50: HSK 1 — Bài 10: Giờ giấc, Nhu cầu sinh hoạt & Trò chuyện
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 1 — Bài 10: Giờ giấc, Nhu cầu sinh hoạt & Trò chuyện', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 1 — Bài 10: Giờ giấc, Nhu cầu sinh hoạt & Trò chuyện');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 1 — Bài 10: Giờ giấc, Nhu cầu sinh hoạt & Trò chuyện' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '谁' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '什么' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '生病' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '十' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '时候' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '时间' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '事' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '是' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '手机' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '书' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '书店' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '水' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '水果' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '睡' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '睡觉' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '说' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '说话' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '四' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '岁' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '他' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 11/50: HSK 1 — Bài 11: Thời tiết, Đại từ & Lịch trình tuần
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 1 — Bài 11: Thời tiết, Đại từ & Lịch trình tuần', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 1 — Bài 11: Thời tiết, Đại từ & Lịch trình tuần');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 1 — Bài 11: Thời tiết, Đại từ & Lịch trình tuần' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '它' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '她' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '他们' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '它们' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '她们' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '太' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '天' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '天气' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '听' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '听见' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '同学' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '外' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '外边' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '玩' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '晚' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '晚饭' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '晚上' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '喂' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '问' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '问题' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 12/50: HSK 1 — Bài 12: Trang phục, Y tế & Sinh hoạt gia đình
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 1 — Bài 12: Trang phục, Y tế & Sinh hoạt gia đình', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 1 — Bài 12: Trang phục, Y tế & Sinh hoạt gia đình');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 1 — Bài 12: Trang phục, Y tế & Sinh hoạt gia đình' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '我' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '我们' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '五' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '午饭' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '喜欢' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '下' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '下雨' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '下班' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '下课' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '下午' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '先生' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '现在' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '想' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '小' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '小朋友' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '小时' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '小学' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '小学生' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '些' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '写' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 13/50: HSK 1 — Bài 13: Bữa sáng, Chỉ dẫn vị trí & Không gian
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 1 — Bài 13: Bữa sáng, Chỉ dẫn vị trí & Không gian', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 1 — Bài 13: Bữa sáng, Chỉ dẫn vị trí & Không gian');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 1 — Bài 13: Bữa sáng, Chỉ dẫn vị trí & Không gian' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '谢谢' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '新' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '星期' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '星期日' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '星期天' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '休息' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '学' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '学生' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '学习' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '学校' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '雪' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '要' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '也' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '一' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '衣服' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '医生' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '医院' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '一半' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '一下' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '椅子' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 14/50: HSK 1 — Bài 14: Hành động, Địa điểm & Cuộc sống học đường
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 1 — Bài 14: Hành động, Địa điểm & Cuộc sống học đường', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 1 — Bài 14: Hành động, Địa điểm & Cuộc sống học đường');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 1 — Bài 14: Hành động, Địa điểm & Cuộc sống học đường' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '一点儿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '一些' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '有' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '有的' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '有点儿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '有些' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '雨' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '元' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '月' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '再' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '在' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '再见' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '早' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '早饭' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '早上' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '怎么' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '怎么样' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '找' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '这' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '这边' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 15/50: HSK 1 — Bài 15: Đồ vật, Động từ & Biểu đạt giao tiếp
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 1 — Bài 15: Đồ vật, Động từ & Biểu đạt giao tiếp', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 1 — Bài 15: Đồ vật, Động từ & Biểu đạt giao tiếp');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 1 — Bài 15: Đồ vật, Động từ & Biểu đạt giao tiếp' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '这个' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '这里' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '这儿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '这些' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '真' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '正在' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '只' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '知道' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '中国' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '中文' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '中午' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '中学' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '中学生' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '住' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '桌子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '字' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '昨天' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '坐' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '做' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '做饭' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 16/50: HSK 2 — Bài 01: Xã giao, Đời sống & Xuất hành
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 2 — Bài 01: Xã giao, Đời sống & Xuất hành', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 2 — Bài 01: Xã giao, Đời sống & Xuất hành');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 2 — Bài 01: Xã giao, Đời sống & Xuất hành' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '啊' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '爱好' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '白色' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '班' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '帮' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '帮忙' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '包' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '本子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '比' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '笔' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '别' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '不错' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '不好意思' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '长' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '车站' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '出' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '出国' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '出来' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '出门' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '出去' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 17/50: HSK 2 — Bài 02: Di chuyển, Tàu điện & Cảm nhận
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 2 — Bài 02: Di chuyển, Tàu điện & Cảm nhận', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 2 — Bài 02: Di chuyển, Tàu điện & Cảm nhận');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 2 — Bài 02: Di chuyển, Tàu điện & Cảm nhận' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '床' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '词' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '次' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '从' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '从小' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '错' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '打' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '打车' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '打开' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '但' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '但是' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '得' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '地' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '等' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '地铁' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '点' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '懂' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '动' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '饭馆' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '飞' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 18/50: HSK 2 — Bài 03: Màu sắc, Xe buýt & Phương hướng
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 2 — Bài 03: Màu sắc, Xe buýt & Phương hướng', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 2 — Bài 03: Màu sắc, Xe buýt & Phương hướng');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 2 — Bài 03: Màu sắc, Xe buýt & Phương hướng' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '高' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '高中' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '告诉' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '个子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '跟' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '公交车' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '过' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '过来' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '过年' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '过去' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '过' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '还是' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '黑色' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '红茶' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '红色' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '后面' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '花' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '花' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '画' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '坏' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 19/50: HSK 2 — Bài 04: Sân bay, Lớp học & Khách sạn
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 2 — Bài 04: Sân bay, Lớp học & Khách sạn', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 2 — Bài 04: Sân bay, Lớp học & Khách sạn');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 2 — Bài 04: Sân bay, Lớp học & Khách sạn' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '回来' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '回去' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '机场' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '机票' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '记得' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '间' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '教' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '教室' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '介绍' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '进' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '近' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '进来' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '进去' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '经常' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '酒店' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '就' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '咖啡' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '开始' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '开学' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '考' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 20/50: HSK 2 — Bài 05: Trang phục, Thể thao & Du lịch
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 2 — Bài 05: Trang phục, Thể thao & Du lịch', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 2 — Bài 05: Trang phục, Thể thao & Du lịch');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 2 — Bài 05: Trang phục, Thể thao & Du lịch' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '考试' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '可能' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '裤子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '快' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '快乐' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '快要' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '篮球' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '累' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '离' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '里面' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '楼' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '路' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '路上' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '旅游' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '绿茶' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '绿色' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '慢' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '没意思' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '每' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '门' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 21/50: HSK 2 — Bài 06: Gia đình, Công viên & Thời tiết
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 2 — Bài 06: Gia đình, Công viên & Thời tiết', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 2 — Bài 06: Gia đình, Công viên & Thời tiết');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 2 — Bài 06: Gia đình, Công viên & Thời tiết' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '门口' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '门票' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '面' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '名' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '拿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '那么' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '那样' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '奶茶' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '奶奶' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '男孩儿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '鸟' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '女孩儿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '旁边' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '跑' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '跑步' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '票' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '妻子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '起来' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '前面' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '晴' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 22/50: HSK 2 — Bài 07: Sức khỏe, Đồng hồ & Cảm xúc
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 2 — Bài 07: Sức khỏe, Đồng hồ & Cảm xúc', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 2 — Bài 07: Sức khỏe, Đồng hồ & Cảm xúc');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 2 — Bài 07: Sức khỏe, Đồng hồ & Cảm xúc' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '球' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '让' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '肉' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '商场' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '上来' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '上面' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '上去' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '上网' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '身体' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '生日' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '时' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '事情' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '手' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '手表' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '书包' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '舒服' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '送' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '虽然' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '所以' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '疼' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 23/50: HSK 2 — Bài 08: Thể thao, Khiêu vũ & Vị trí ngoài trời
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 2 — Bài 08: Thể thao, Khiêu vũ & Vị trí ngoài trời', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 2 — Bài 08: Thể thao, Khiêu vũ & Vị trí ngoài trời');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 2 — Bài 08: Thể thao, Khiêu vũ & Vị trí ngoài trời' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '踢' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '题' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '条' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '跳舞' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '头' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '外国' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '外面' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '完' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '万' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '往' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '网上' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '忘' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '位' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '为什么' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '希望' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '洗' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '洗手间' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '下来' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '下面' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '下去' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 24/50: HSK 2 — Bài 09: Sức khỏe, Hiệu thuốc & Giải trí
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 2 — Bài 09: Sức khỏe, Hiệu thuốc & Giải trí', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 2 — Bài 09: Sức khỏe, Hiệu thuốc & Giải trí');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 2 — Bài 09: Sức khỏe, Hiệu thuốc & Giải trí' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '小孩儿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '小时候' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '笑' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '姓' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '姓名' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '颜色' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '眼睛' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '药' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '药店' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '爷爷' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '一会儿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '已经' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '一起' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '意思' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '阴' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '因为' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '游' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '游泳' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '有意思' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '有时' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 25/50: HSK 2 — Bài 10: Vận động, Chuẩn bị & Phương hướng
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 2 — Bài 10: Vận động, Chuẩn bị & Phương hướng', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 2 — Bài 10: Vận động, Chuẩn bị & Phương hướng');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 2 — Bài 10: Vận động, Chuẩn bị & Phương hướng' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '右' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '右边' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '鱼' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '远' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '运动' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '站' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '丈夫' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '这么' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '这样' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '着' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '正' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '周' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '准备' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '自己' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '走' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '走路' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '足球' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '最' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '左' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '左边' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 26/50: HSK 3 — Bài 01: Bạn bè, Gia đình & An toàn
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 01: Bạn bè, Gia đình & An toàn', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 01: Bạn bè, Gia đình & An toàn');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 01: Bạn bè, Gia đình & An toàn' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '阿姨' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '矮' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '爱人' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '安静' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '安全' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '把' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '搬' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '班级' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '搬家' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '办' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '办法' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '办公室' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '半天' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '帮助' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '饱' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '报纸' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '北' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '北方' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '被' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '笔记' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 27/50: HSK 3 — Bài 02: Thi đấu, So sánh & Kế hoạch
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 02: Thi đấu, So sánh & Kế hoạch', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 02: Thi đấu, So sánh & Kế hoạch');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 02: Thi đấu, So sánh & Kế hoạch' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '比较' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '笔记本' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '比如' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '比赛' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '必须' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '变' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '遍' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '变成' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '变化' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '表演' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '别的' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '别人' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '宾馆' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '冰' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '冰激凌' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '冰箱' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '病人' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '不但' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '不见' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '不用' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 28/50: HSK 3 — Bài 03: Thực đơn, Thành tích & Thành phố
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 03: Thực đơn, Thành tích & Thành phố', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 03: Thực đơn, Thành tích & Thành phố');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 03: Thực đơn, Thành tích & Thành phố' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '不同' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '不久' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '不行' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '才' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '菜单' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '参加' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '草' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '草地' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '层' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '查' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '差' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '差不多' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '尝' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '常' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '常见' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '常用' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '常常' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '衬衫' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '成绩' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '城市' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 29/50: HSK 3 — Bài 04: Xuất phát, Sinh nhật & Bánh ngọt
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 04: Xuất phát, Sinh nhật & Bánh ngọt', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 04: Xuất phát, Sinh nhật & Bánh ngọt');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 04: Xuất phát, Sinh nhật & Bánh ngọt' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '迟到' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '出发' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '出生' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '出院' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '初中' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '除了' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '船' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '春天' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '词典' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '聪明' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '打扫' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '打算' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '大概' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '大人' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '大小' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '大熊猫' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '大衣' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '带' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '担心' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '蛋糕' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 30/50: HSK 3 — Bài 05: Cơ hội, Điểm số & Phương hướng
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 05: Cơ hội, Điểm số & Phương hướng', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 05: Cơ hội, Điểm số & Phương hướng');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 05: Cơ hội, Điểm số & Phương hướng' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '当然' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '到处' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '得' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '得到' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '得分' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '的话' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '得' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '灯' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '地' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '地点' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '地方' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '地图' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '电' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '电梯' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '电子书' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '丢' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '东' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '东北' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '东方' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '东南' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 31/50: HSK 3 — Bài 06: Mùa đông, Động vật & Tiện lợi
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 06: Mùa đông, Động vật & Tiện lợi', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 06: Mùa đông, Động vật & Tiện lợi');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 06: Mùa đông, Động vật & Tiện lợi' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '冬天' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '懂得' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '动物' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '动物园' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '短' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '短裤' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '段' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '锻炼' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '对话' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '饿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '而且' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '耳朵' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '耳机' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '发' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '发烧' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '发生' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '发现' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '发展' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '方便' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '方便面' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 32/50: HSK 3 — Bài 07: Phương pháp, Cảm mạo & Công việc
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 07: Phương pháp, Cảm mạo & Công việc', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 07: Phương pháp, Cảm mạo & Công việc');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 07: Phương pháp, Cảm mạo & Công việc' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '方法' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '方向' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '房子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '放' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '放假' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '放心' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '放学' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '分开' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '风' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '封' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '夫妻' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '服务' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '附近' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '复习' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '该' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '干净' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '感兴趣' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '感到' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '感冒' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '干' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 33/50: HSK 3 — Bài 08: Đường sắt cao tốc, Quốc gia & Lễ tết
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 08: Đường sắt cao tốc, Quốc gia & Lễ tết', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 08: Đường sắt cao tốc, Quốc gia & Lễ tết');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 08: Đường sắt cao tốc, Quốc gia & Lễ tết' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '刚' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '刚才' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '刚刚' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '高铁' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '根据' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '更' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '公斤' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '公园' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '工作日' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '故事' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '刮' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '关' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '关机' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '关系' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '关心' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '关于' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '关注' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '国家' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '过节' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '过去' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 34/50: HSK 3 — Bài 09: Biển cả, Môi trường & Đổi trả
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 09: Biển cả, Môi trường & Đổi trả', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 09: Biển cả, Môi trường & Đổi trả');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 09: Biển cả, Môi trường & Đổi trả' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '海' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '害怕' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '好多' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '好久' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '好像' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '号码' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '河' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '合适' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '黑板' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '红绿灯' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '后来' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '后年' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '后天' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '护照' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '花园' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '画家' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '欢迎' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '还' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '环境' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '换' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 35/50: HSK 3 — Bài 10: Hội nghị, Trả lời & Kiểm tra vé
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 10: Hội nghị, Trả lời & Kiểm tra vé', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 10: Hội nghị, Trả lời & Kiểm tra vé');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 10: Hội nghị, Trả lời & Kiểm tra vé' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '黄色' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '回答' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '会' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '会议' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '或' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '或者' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '鸡' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '几乎' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '机会' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '极' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '急' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '记' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '季' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '季节' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '加' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '假期' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '坚持' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '检查' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '简单' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '检票' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 36/50: HSK 3 — Bài 11: Sức khỏe, Gặp gỡ & Quản lý
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 11: Sức khỏe, Gặp gỡ & Quản lý', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 11: Sức khỏe, Gặp gỡ & Quản lý');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 11: Sức khỏe, Gặp gỡ & Quản lý' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '健康' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '见面' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '讲' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '角' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '脚' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '接' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '街' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '节' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '结婚' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '节目' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '节日' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '结束' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '解决' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '姐妹' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '借' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '斤' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '经过' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '经理' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '久' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '酒' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 37/50: HSK 3 — Bài 12: Quyết định, Thẻ từ & Điều hòa
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 12: Quyết định, Thẻ từ & Điều hòa', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 12: Quyết định, Thẻ từ & Điều hòa');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 12: Quyết định, Thẻ từ & Điều hòa' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '旧' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '句' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '句子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '决定' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '卡' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '开花' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '开会' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '开机' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '开心' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '看来' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '可' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '渴' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '可爱' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '可是' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '刻' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '课本' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '客人' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '课文' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '空调' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '哭' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 38/50: HSK 3 — Bài 13: Đồ dùng, Du học & Hàng xóm
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 13: Đồ dùng, Du học & Hàng xóm', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 13: Đồ dùng, Du học & Hàng xóm');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 13: Đồ dùng, Du học & Hàng xóm' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '筷子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '矿泉水' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '来自' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '蓝' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '老' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '老人' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '离开' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '礼物' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '历史' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '脸' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '练' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '练习' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '凉快' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '辆' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '聊' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '聊天儿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '了解' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '邻居' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '留学' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '留学生' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 39/50: HSK 3 — Bài 14: Giao thông, Bậc thang & Phố xá
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 14: Giao thông, Bậc thang & Phố xá', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 14: Giao thông, Bậc thang & Phố xá');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 14: Giao thông, Bậc thang & Phố xá' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '楼梯' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '路边' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '路口' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '马' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '马路' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '马上' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '满意' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '毛' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '米' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '面前' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '明白' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '名单' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '名人' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '南' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '难' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '南方' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '难过' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '难看' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '男人' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '男生' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 40/50: HSK 3 — Bài 15: Độ khó, Lớp học & Sự kỳ lạ
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 15: Độ khó, Lớp học & Sự kỳ lạ', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 15: Độ khó, Lớp học & Sự kỳ lạ');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 15: Độ khó, Lớp học & Sự kỳ lạ' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '难题' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '难听' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '年级' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '年轻' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '牛' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '努力' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '女人' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '女生' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '爬' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '怕' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '拍照' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '盘子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '胖' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '啤酒' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '平时' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '瓶子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '骑' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '奇怪' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '其实' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '其他' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 41/50: HSK 3 — Bài 16: Khởi hành, Bút chì & Dễ dàng
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 16: Khởi hành, Bút chì & Dễ dàng', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 16: Khởi hành, Bút chì & Dễ dàng');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 16: Khởi hành, Bút chì & Dễ dàng' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '起' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '起飞' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '汽车' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '铅笔' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '前年' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '前天' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '清楚' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '请假' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '请客' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '秋天' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '球场' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '裙子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '然后' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '热情' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '认得' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '认为' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '认真' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '容易' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '如果' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '伞' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 42/50: HSK 3 — Bài 17: Nhà cửa, Trang phục & Cảm nhận
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 17: Nhà cửa, Trang phục & Cảm nhận', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 17: Nhà cửa, Trang phục & Cảm nhận');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 17: Nhà cửa, Trang phục & Cảm nhận' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '扫' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '沙发' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '山' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '上衣' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '勺子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '身边' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '身高' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '声' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '生活' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '生气' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '声音' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '市' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '试' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '室' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '世界' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '收' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '收到' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '受' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '瘦' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '受到' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 43/50: HSK 3 — Bài 18: Toán học, Đồng nghiệp & Đồng ý
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 18: Toán học, Đồng nghiệp & Đồng ý', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 18: Toán học, Đồng nghiệp & Đồng ý');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 18: Toán học, Đồng nghiệp & Đồng ý' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '叔叔' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '树' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '数学' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '刷' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '双' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '水平' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '司机' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '四季' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '太阳' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '糖' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '特别' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '提高' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '体育' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '体育馆' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '甜' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '跳' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '听说' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '挺' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '同事' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '同意' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 44/50: HSK 3 — Bài 19: Thư viện, Văn hóa & Căn phòng
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 19: Thư viện, Văn hóa & Căn phòng', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 19: Thư viện, Văn hóa & Căn phòng');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 19: Thư viện, Văn hóa & Căn phòng' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '头发' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '突然' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '图书馆' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '腿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '外地' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '外卖' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '外语' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '完成' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '碗' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '晚点' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '晚会' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '网球' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '网站' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '忘记' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '为' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '为了' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '卫生间' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '文化' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '屋子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '西' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 45/50: HSK 3 — Bài 20: Phương hướng, Thói quen & Hiệu trưởng
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 20: Phương hướng, Thói quen & Hiệu trưởng', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 20: Phương hướng, Thói quen & Hiệu trưởng');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 20: Phương hướng, Thói quen & Hiệu trưởng' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '西北' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '西方' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '西瓜' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '西南' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '习惯' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '喜爱' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '洗衣机' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '洗澡' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '夏天' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '先' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '香蕉' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '相信' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '箱子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '向' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '像' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '相机' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '小区' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '小心' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '校园' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '校长' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 46/50: HSK 3 — Bài 21: Tin tức, Báo chí & Yêu cầu
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 21: Tin tức, Báo chí & Yêu cầu', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 21: Tin tức, Báo chí & Yêu cầu');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 21: Tin tức, Báo chí & Yêu cầu' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '鞋' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '心里' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '新年' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '新闻' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '新鲜' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '信' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '信用卡' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '行' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '行李' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '兴趣' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '休假' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '需要' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '选' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '选择' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '学期' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '牙' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '牙刷' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '羊' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '养' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '要求' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 47/50: HSK 3 — Bài 22: Trang sách, Tương đồng & Ảnh hưởng
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 22: Trang sách, Tương đồng & Ảnh hưởng', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 22: Trang sách, Tương đồng & Ảnh hưởng');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 22: Trang sách, Tương đồng & Ảnh hưởng' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '页' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '一定' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '一共' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '一块儿' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '一样' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '以后' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '以前' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '以上' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '以外' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '以为' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '以下' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '一般' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '一边' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '一直' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '音乐' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '银行' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '银行卡' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '饮料' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '应该' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '影响' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 48/50: HSK 3 — Bài 23: Trò chơi, Hòm thư & Đại hội thể thao
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 23: Trò chơi, Hòm thư & Đại hội thể thao', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 23: Trò chơi, Hòm thư & Đại hội thể thao');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 23: Trò chơi, Hòm thư & Đại hội thể thao' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '用' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '邮件' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '游客' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '游戏' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '邮箱' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '有关' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '有名' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '有用' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '又' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '羽毛球' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '语言' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '雨衣' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '遇到' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '遇见' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '园' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '员' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '愿意' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '越' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '月亮' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '运动会' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 49/50: HSK 3 — Bài 24: Vận động viên, Vệ sinh & Điều kiện
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 24: Vận động viên, Vệ sinh & Điều kiện', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 24: Vận động viên, Vệ sinh & Điều kiện');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 24: Vận động viên, Vệ sinh & Điều kiện' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '运动员' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '咱们' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '脏' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '怎么办' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '怎样' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '站' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '张' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '长' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '着急' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '照' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '照顾' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '照片' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '照相' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '直到' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '只' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '纸' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '只能' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '只是' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '只要' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '只有' LIMIT 1;

-- -----------------------------------------------------------------------------
-- Lesson 50/50: HSK 3 — Bài 25: Trọng tâm, Cuộc sống & Bài tập về nhà
-- -----------------------------------------------------------------------------
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'HSK 3 — Bài 25: Trọng tâm, Cuộc sống & Bài tập về nhà', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'HSK 3 — Bài 25: Trọng tâm, Cuộc sống & Bài tập về nhà');

SET @current_lesson_id = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'HSK 3 — Bài 25: Trọng tâm, Cuộc sống & Bài tập về nhà' LIMIT 1);

INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '中' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '中间' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '终于' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '种' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '重要' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '周末' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '主要' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '注意' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '住院' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '字典' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '自行车' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '子' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '总' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '总是' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '嘴' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '最好' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '最后' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '最近' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '做客' LIMIT 1;
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @current_lesson_id, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '作业' LIMIT 1;
