-- =============================================================================
-- Migration: V28__remediate_vocabulary_ids_and_linguistic_defects.sql
-- Description:
--   1. Restore linguistic meanings and Sino-Vietnamese readings for 6 words mistakenly
--      updated in V26/V27 due to seed ID discrepancy:
--      - #726 到处: restore meaning_han_viet = 'Đáo Xứ'
--      - #886 难过: restore meaning_han_viet = 'Nan Quá'
--      - #890 年级: restore meaning_han_viet = 'Niên Cấp'
--      - #891 年轻: restore meaning_han_viet = 'Niên Khinh'
--      - #983 相信: restore meaning_han_viet = 'Tương Tín'
--      - #1042 运动会: restore meaning_han_viet = 'Vận Động Hội',
--                      meaning_vi = 'Đại hội thể thao; hội thao',
--                      example_sentence = '学校下个月开运动会。',
--                      example_translation = 'Trường học tháng sau tổ chức đại hội thể thao.'
--   2. Apply intended updates to authoritative MySQL vocab_id records:
--      - #734 丢: meaning_han_viet = 'Đưu'
--      - #894 爬: meaning_han_viet = 'Bà'
--      - #898 胖: meaning_han_viet = 'Bàng'
--      - #899 啤酒: meaning_han_viet = 'Tỳ Tửu'
--      - #991 校长: meaning_han_viet = 'Hiệu Trưởng'
--      - #1050 长 (zhǎng): meaning_han_viet = 'Trưởng',
--                         meaning_vi = 'Trưởng, lớn lên, sinh ra, đứng đầu',
--                         example_sentence = '他长得很高。',
--                         example_translation = 'Anh ấy lớn lên rất cao / dáng người rất cao.'
--      - #501 干什么: meaning_han_viet = 'Can Thập Ma'
--      - #502 哪里: meaning_han_viet = 'Na Lý'
--      - #504 哪些: meaning_han_viet = 'Na Ta'
--      - #506 什么: meaning_han_viet = 'Thập Ma'
--      - #507 怎么: meaning_han_viet = 'Chẩm Ma'
--   3. Restore missing radical #1 一 for 出租车 (vocab_id 512, hanzi_char 车).
-- Database: MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Restore corrupted vocabulary records
-- -----------------------------------------------------------------------------
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Đáo Xứ', `updated_at` = NOW() WHERE `vocab_id` = 726 AND `hanzi` = '到处';
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Nan Quá', `updated_at` = NOW() WHERE `vocab_id` = 886 AND `hanzi` = '难过';
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Niên Cấp', `updated_at` = NOW() WHERE `vocab_id` = 890 AND `hanzi` = '年级';
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Niên Khinh', `updated_at` = NOW() WHERE `vocab_id` = 891 AND `hanzi` = '年轻';
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Tương Tín', `updated_at` = NOW() WHERE `vocab_id` = 983 AND `hanzi` = '相信';
UPDATE `VOCABULARY` SET 
    `meaning_han_viet` = 'Vận Động Hội',
    `meaning_vi` = 'Đại hội thể thao; hội thao',
    `example_sentence` = '学校下个月开运动会。',
    `example_translation` = 'Trường học tháng sau tổ chức đại hội thể thao.',
    `updated_at` = NOW()
WHERE `vocab_id` = 1042 AND `hanzi` = '运动会';

-- -----------------------------------------------------------------------------
-- Step 2: Apply intended updates to correct MySQL vocab_id records
-- -----------------------------------------------------------------------------
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Đưu', `updated_at` = NOW() WHERE `vocab_id` = 734 AND `hanzi` = '丢';
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Bà', `updated_at` = NOW() WHERE `vocab_id` = 894 AND `hanzi` = '爬';
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Bàng', `updated_at` = NOW() WHERE `vocab_id` = 898 AND `hanzi` = '胖';
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Tỳ Tửu', `updated_at` = NOW() WHERE `vocab_id` = 899 AND `hanzi` = '啤酒';
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Hiệu Trưởng', `updated_at` = NOW() WHERE `vocab_id` = 991 AND `hanzi` = '校长';
UPDATE `VOCABULARY` SET 
    `meaning_han_viet` = 'Trưởng',
    `meaning_vi` = 'Trưởng, lớn lên, sinh ra, đứng đầu',
    `example_sentence` = '他长得很高。',
    `example_translation` = 'Anh ấy lớn lên rất cao / dáng người rất cao.',
    `updated_at` = NOW()
WHERE `vocab_id` = 1050 AND `hanzi` = '长';

UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Can Thập Ma', `updated_at` = NOW() WHERE `vocab_id` = 501 AND `hanzi` = '干什么';
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Na Lý', `updated_at` = NOW() WHERE `vocab_id` = 502 AND `hanzi` = '哪里';
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Na Ta', `updated_at` = NOW() WHERE `vocab_id` = 504 AND `hanzi` = '哪些';
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thập Ma', `updated_at` = NOW() WHERE `vocab_id` = 506 AND `hanzi` = '什么';
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Chẩm Ma', `updated_at` = NOW() WHERE `vocab_id` = 507 AND `hanzi` = '怎么';

-- -----------------------------------------------------------------------------
-- Step 3: Restore radical #1 一 for 出租车 (vocab_id 512, hanzi_char 车)
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
VALUES (512, 1, '车', 'kangxi_radical', 'verified');
