-- =============================================================================
-- Migration: V27__clean_radical_components_and_fix_linguistic_defects.sql
-- Description:
--   1. Fix 6 minor linguistic & radical defects:
--      - Radical #212 龍: restore stroke_count = 16 (authoritative Kangxi standard)
--      - Vocab #416 行: meaning_han_viet = 'Hành' (was 'Hàng')
--      - Vocab #983 校长: meaning_han_viet = 'Hiệu Trưởng' (was 'Hiệu Trường')
--      - Vocab #104 放假: meaning_han_viet = 'Phóng Giá' (was 'Phóng Giả')
--      - Vocab #297 请假: meaning_han_viet = 'Thỉnh Giá' (was 'Thỉnh Giả')
--      - Vocab #234 没什么: meaning_vi = 'Không có gì; không sao đâu' (deduplicated)
--      - Vocab #148 后边: meaning_vi = 'Phía sau; đằng sau' (deduplicated)
--   2. Clean up spurious/pseudo-radical decompositions in VOCAB_RADICAL:
--      - 且 group (助, 姐, 租, 宜, 且): remove spurious #1 一 and #74 月 (keep #1 for 且 itself)
--      - 也 group (他, 她, 地): remove spurious #5 乙
--      - 丁 group (打, 灯, 可, 河, 啊, 阿, 奇, 椅, 骑): remove padding stroke #1 一
--      - Visual decomposition cleanups:
--        * 爬: remove #49 己, keep #87 爪 (consistent with 爸, 吧, 把)
--        * 球: remove spurious #1 一 and #85 水, keep #96 玉
--        * 进, 讲: remove spurious #7 二
--        * 吃: remove spurious #5 乙
--        * 妹: remove spurious #1 一
--        * 考, 号: remove spurious #1 一
--        * 叫, 收: remove spurious #2 丨
--        * 孩, 该, 刻: remove spurious #8 亠
--        * 新: remove #1 一, #42 小; add authentic constituent #75 木
--        * 乍 group (作, 昨, 怎): remove #1 一, #4 丿
--        * 便: remove #1 一, #4 丿, #73 曰; add authentic constituent #72 日
--        * 最: remove #72 日 (avoid duplication with #73 曰)
--        * 愿: replace #85 水 with #42 小 (原 = 厂 + 白 + 小)
--        * 交 group (交, 校, 较, 饺): unify 交 as #8 亠 + #88 父 (remove #4, #12)
-- Database: MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Fix 6 minor linguistic & radical defects
-- -----------------------------------------------------------------------------
UPDATE `RADICAL` SET `stroke_count` = 16, `updated_at` = NOW() WHERE `radical_id` = 212;

UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Hành', `updated_at` = NOW() WHERE `vocab_id` = 416;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Hiệu Trưởng', `updated_at` = NOW() WHERE `vocab_id` = 983;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Phóng Giá', `updated_at` = NOW() WHERE `vocab_id` = 104;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thỉnh Giá', `updated_at` = NOW() WHERE `vocab_id` = 297;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Không có gì; không sao đâu', `updated_at` = NOW() WHERE `vocab_id` = 234;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Phía sau; đằng sau', `updated_at` = NOW() WHERE `vocab_id` = 148;

-- -----------------------------------------------------------------------------
-- Step 2: Remove pseudo-radicals from VOCAB_RADICAL
-- -----------------------------------------------------------------------------

-- 1. 且 group: remove #1 一 and #74 月
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` IN ('助', '姐', '租', '宜') OR `vocab_id` IN (658, 178, 403, 828, 504, 520)) AND `radical_id` IN (1, 74);
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` = '且' OR `vocab_id` = 739) AND `radical_id` = 74;

-- 2. 也 group: remove #5 乙
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` IN ('他', '她', '地') OR `vocab_id` IN (354, 355, 897, 356, 357, 66, 69, 70, 71, 72, 73, 551, 687, 952)) AND `radical_id` = 5;

-- 3. 丁 group: remove #1 一
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` IN ('打', '灯', '可', '河', '啊', '阿', '奇', '椅', '骑') OR `vocab_id` IN (56, 57, 58, 59, 60, 707, 708, 723, 789, 512, 575, 844, 845, 846, 786, 538, 646, 894, 895, 532)) AND `radical_id` = 1;

-- 4. 爬: remove #49 己, keep #87 爪
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` = '爬' OR `vocab_id` = 886) AND `radical_id` = 49;

-- 5. 球: remove #1 一 and #85 水, keep #96 玉
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` = '球' OR `vocab_id` IN (60, 301, 579, 645, 904, 958, 1024)) AND `radical_id` IN (1, 85);

-- 6. 进, 讲: remove #7 二
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` IN ('进', '讲') OR `vocab_id` IN (182, 183, 184, 298, 817)) AND `radical_id` = 7;

-- 7. 吃: remove #5 乙
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` = '吃' OR `vocab_id` IN (46, 47, 139)) AND `radical_id` = 5;

-- 8. 妹: remove #1 一
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` = '妹' OR `vocab_id` IN (237, 828)) AND `radical_id` = 1;

-- 9. 考, 号: remove #1 一
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` IN ('考', '号') OR `vocab_id` IN (196, 197, 143, 785)) AND `radical_id` = 1;

-- 10. 叫, 收: remove #2 丨
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` IN ('叫', '收') OR `vocab_id` IN (176, 925, 926)) AND `radical_id` = 2;

-- 11. 孩, 该, 刻: remove #8 亠
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` IN ('孩', '该', '刻') OR `vocab_id` IN (135, 262, 278, 402, 758, 1016, 847)) AND `radical_id` = 8;

-- 12. 新: remove #1 一, #42 小; add authentic constituent #75 木
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` = '新' OR `vocab_id` IN (411, 412, 986, 987)) AND `radical_id` IN (1, 42);
INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 75, '新', 'kangxi_radical', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%新%';

-- 13. 乍 in 作, 昨, 怎: remove #1 一, #4 丿
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` IN ('作', '昨', '怎') OR `vocab_id` IN (88, 124, 460, 495, 534, 770, 1038, 1039)) AND `radical_id` IN (1, 4);

-- 14. 便: remove #1 一, #4 丿, #73 曰; add authentic constituent #72 日
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` = '便' OR `vocab_id` IN (520, 747, 748)) AND `radical_id` IN (1, 4, 73);
INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 72, '便', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%便%';

-- 15. 最: remove #72 日 (avoid duplicate with #73 曰)
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` = '最' OR `vocab_id` IN (492, 493, 494, 1066)) AND `radical_id` = 72;

-- 16. 愿: replace #85 水 with #42 小
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` = '愿' OR `vocab_id` = 1031) AND `radical_id` = 85;
INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 42, '愿', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%愿%';

-- 17. 交 group: unify 交 as #8 亠 + #88 父 (remove #4, #12)
DELETE FROM `VOCAB_RADICAL` WHERE (`hanzi_char` IN ('较', '饺', '交') OR `vocab_id` IN (511, 557, 664)) AND `radical_id` IN (4, 12);
INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 88, '交', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%交%';
INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 88, '校', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%校%';
INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 88, '较', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%较%';
INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 88, '饺', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%饺%';
