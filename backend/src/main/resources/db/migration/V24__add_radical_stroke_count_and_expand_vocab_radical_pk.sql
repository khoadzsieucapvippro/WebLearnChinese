-- =============================================================================
-- Migration: V24__add_radical_stroke_count_and_expand_vocab_radical_pk.sql
-- Description:
--   1. Add stroke_count TINYINT UNSIGNED NOT NULL to RADICAL table
--   2. Backfill authoritative Kangxi stroke counts (1..17) for all 214 radicals
--   3. Expand VOCAB_RADICAL schema:
--      - Convert hanzi_char to VARCHAR(10) NOT NULL DEFAULT ''
--      - Add component_type VARCHAR(50) NOT NULL DEFAULT 'kangxi_radical'
--      - Add verification_status VARCHAR(50) NOT NULL DEFAULT 'verified'
--      - Expand composite primary key to (vocab_id, radical_id, hanzi_char) to preserve
--        per-character constituent radical attributions in multi-character words
--   4. Insert missing constituent radical associations previously dropped due to old PK
-- Database: MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Add stroke_count to RADICAL table and backfill all 214 radicals
-- -----------------------------------------------------------------------------
ALTER TABLE `RADICAL`
    ADD COLUMN `stroke_count` TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER `meaning_vi`;

UPDATE `RADICAL` SET `stroke_count` = 1 WHERE `radical_id` BETWEEN 1 AND 6;
UPDATE `RADICAL` SET `stroke_count` = 2 WHERE `radical_id` BETWEEN 7 AND 29;
UPDATE `RADICAL` SET `stroke_count` = 3 WHERE `radical_id` BETWEEN 30 AND 60;
UPDATE `RADICAL` SET `stroke_count` = 4 WHERE `radical_id` BETWEEN 61 AND 94;
UPDATE `RADICAL` SET `stroke_count` = 5 WHERE `radical_id` BETWEEN 95 AND 117;
UPDATE `RADICAL` SET `stroke_count` = 6 WHERE `radical_id` BETWEEN 118 AND 146;
UPDATE `RADICAL` SET `stroke_count` = 7 WHERE `radical_id` BETWEEN 147 AND 166;
UPDATE `RADICAL` SET `stroke_count` = 8 WHERE `radical_id` BETWEEN 167 AND 175;
UPDATE `RADICAL` SET `stroke_count` = 9 WHERE `radical_id` BETWEEN 176 AND 186;
UPDATE `RADICAL` SET `stroke_count` = 10 WHERE `radical_id` BETWEEN 187 AND 194;
UPDATE `RADICAL` SET `stroke_count` = 11 WHERE `radical_id` BETWEEN 195 AND 200;
UPDATE `RADICAL` SET `stroke_count` = 12 WHERE `radical_id` BETWEEN 201 AND 204;
UPDATE `RADICAL` SET `stroke_count` = 13 WHERE `radical_id` BETWEEN 205 AND 208;
UPDATE `RADICAL` SET `stroke_count` = 14 WHERE `radical_id` BETWEEN 209 AND 210;
UPDATE `RADICAL` SET `stroke_count` = 15 WHERE `radical_id` = 211;
UPDATE `RADICAL` SET `stroke_count` = 16 WHERE `radical_id` IN (212, 213);
UPDATE `RADICAL` SET `stroke_count` = 17 WHERE `radical_id` = 214;

-- -----------------------------------------------------------------------------
-- Step 2: Expand VOCAB_RADICAL schema to composite key (vocab_id, radical_id, hanzi_char)
-- -----------------------------------------------------------------------------
UPDATE `VOCAB_RADICAL` SET `hanzi_char` = '' WHERE `hanzi_char` IS NULL;

ALTER TABLE `VOCAB_RADICAL` MODIFY COLUMN `hanzi_char` VARCHAR(10) NOT NULL DEFAULT '';
ALTER TABLE `VOCAB_RADICAL` ADD COLUMN `component_type` VARCHAR(50) NOT NULL DEFAULT 'kangxi_radical' AFTER `hanzi_char`;
ALTER TABLE `VOCAB_RADICAL` ADD COLUMN `verification_status` VARCHAR(50) NOT NULL DEFAULT 'verified' AFTER `component_type`;

ALTER TABLE `VOCAB_RADICAL`
    DROP PRIMARY KEY,
    ADD PRIMARY KEY (`vocab_id`, `radical_id`, `hanzi_char`);

-- -----------------------------------------------------------------------------
-- Step 3: Insert missing constituent radicals for official HSK 1-3 vocabulary
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, m.`radical_id`, m.`hanzi_char`, 'kangxi_radical', 'verified'
FROM (
  SELECT 14 AS `hsk_source_id`, 1 AS `radical_id`, '不' AS `hanzi_char` UNION ALL
  SELECT 14 AS `hsk_source_id`, 40 AS `radical_id`, '客' AS `hanzi_char` UNION ALL
  SELECT 14 AS `hsk_source_id`, 30 AS `radical_id`, '客' AS `hanzi_char` UNION ALL
  SELECT 14 AS `hsk_source_id`, 34 AS `radical_id`, '客' AS `hanzi_char` UNION ALL
  SELECT 14 AS `hsk_source_id`, 84 AS `radical_id`, '气' AS `hanzi_char` UNION ALL
  SELECT 328 AS `hsk_source_id`, 1 AS `radical_id`, '车' AS `hanzi_char` UNION ALL
  SELECT 24 AS `hsk_source_id`, 64 AS `radical_id`, '打' AS `hanzi_char` UNION ALL
  SELECT 24 AS `hsk_source_id`, 1 AS `radical_id`, '打' AS `hanzi_char` UNION ALL
  SELECT 24 AS `hsk_source_id`, 73 AS `radical_id`, '电' AS `hanzi_char` UNION ALL
  SELECT 24 AS `hsk_source_id`, 5 AS `radical_id`, '电' AS `hanzi_char` UNION ALL
  SELECT 24 AS `hsk_source_id`, 149 AS `radical_id`, '话' AS `hanzi_char` UNION ALL
  SELECT 24 AS `hsk_source_id`, 135 AS `radical_id`, '话' AS `hanzi_char` UNION ALL
  SELECT 329 AS `hsk_source_id`, 1 AS `radical_id`, '开' AS `hanzi_char` UNION ALL
  SELECT 31 AS `hsk_source_id`, 118 AS `radical_id`, '第' AS `hanzi_char` UNION ALL
  SELECT 31 AS `hsk_source_id`, 57 AS `radical_id`, '第' AS `hanzi_char` UNION ALL
  SELECT 31 AS `hsk_source_id`, 12 AS `radical_id`, '第' AS `hanzi_char` UNION ALL
  SELECT 68 AS `hsk_source_id`, 39 AS `radical_id`, '子' AS `hanzi_char` UNION ALL
  SELECT 75 AS `hsk_source_id`, 10 AS `radical_id`, '儿' AS `hanzi_char` UNION ALL
  SELECT 682 AS `hsk_source_id`, 30 AS `radical_id`, '答' AS `hanzi_char` UNION ALL
  SELECT 98 AS `hsk_source_id`, 1 AS `radical_id`, '车' AS `hanzi_char` UNION ALL
  SELECT 736 AS `hsk_source_id`, 75 AS `radical_id`, '本' AS `hanzi_char` UNION ALL
  SELECT 763 AS `hsk_source_id`, 30 AS `radical_id`, '口' AS `hanzi_char` UNION ALL
  SELECT 766 AS `hsk_source_id`, 1 AS `radical_id`, '上' AS `hanzi_char` UNION ALL
  SELECT 120 AS `hsk_source_id`, 85 AS `radical_id`, '没' AS `hanzi_char` UNION ALL
  SELECT 120 AS `hsk_source_id`, 79 AS `radical_id`, '没' AS `hanzi_char` UNION ALL
  SELECT 120 AS `hsk_source_id`, 12 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 120 AS `hsk_source_id`, 37 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 120 AS `hsk_source_id`, 1 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 120 AS `hsk_source_id`, 120 AS `radical_id`, '系' AS `hanzi_char` UNION ALL
  SELECT 120 AS `hsk_source_id`, 4 AS `radical_id`, '系' AS `hanzi_char` UNION ALL
  SELECT 124 AS `hsk_source_id`, 9 AS `radical_id`, '们' AS `hanzi_char` UNION ALL
  SELECT 124 AS `hsk_source_id`, 169 AS `radical_id`, '们' AS `hanzi_char` UNION ALL
  SELECT 148 AS `hsk_source_id`, 9 AS `radical_id`, '们' AS `hanzi_char` UNION ALL
  SELECT 153 AS `hsk_source_id`, 38 AS `radical_id`, '女' AS `hanzi_char` UNION ALL
  SELECT 153 AS `hsk_source_id`, 10 AS `radical_id`, '儿' AS `hanzi_char` UNION ALL
  SELECT 806 AS `hsk_source_id`, 1 AS `radical_id`, '天' AS `hanzi_char` UNION ALL
  SELECT 171 AS `hsk_source_id`, 149 AS `radical_id`, '识' AS `hanzi_char` UNION ALL
  SELECT 174 AS `hsk_source_id`, 30 AS `radical_id`, '店' AS `hanzi_char` UNION ALL
  SELECT 186 AS `hsk_source_id`, 72 AS `radical_id`, '间' AS `hanzi_char` UNION ALL
  SELECT 197 AS `hsk_source_id`, 149 AS `radical_id`, '话' AS `hanzi_char` UNION ALL
  SELECT 203 AS `hsk_source_id`, 9 AS `radical_id`, '们' AS `hanzi_char` UNION ALL
  SELECT 451 AS `hsk_source_id`, 122 AS `radical_id`, '网' AS `hanzi_char` UNION ALL
  SELECT 451 AS `hsk_source_id`, 1 AS `radical_id`, '上' AS `hanzi_char` UNION ALL
  SELECT 451 AS `hsk_source_id`, 25 AS `radical_id`, '上' AS `hanzi_char` UNION ALL
  SELECT 227 AS `hsk_source_id`, 1 AS `radical_id`, '下' AS `hanzi_char` UNION ALL
  SELECT 227 AS `hsk_source_id`, 25 AS `radical_id`, '下' AS `hanzi_char` UNION ALL
  SELECT 227 AS `hsk_source_id`, 173 AS `radical_id`, '雨' AS `hanzi_char` UNION ALL
  SELECT 237 AS `hsk_source_id`, 42 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 238 AS `hsk_source_id`, 42 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 244 AS `hsk_source_id`, 72 AS `radical_id`, '日' AS `hanzi_char` UNION ALL
  SELECT 245 AS `hsk_source_id`, 1 AS `radical_id`, '天' AS `hanzi_char` UNION ALL
  SELECT 266 AS `hsk_source_id`, 74 AS `radical_id`, '有' AS `hanzi_char` UNION ALL
  SELECT 266 AS `hsk_source_id`, 7 AS `radical_id`, '些' AS `hanzi_char` UNION ALL
  SELECT 266 AS `hsk_source_id`, 77 AS `radical_id`, '些' AS `hanzi_char` UNION ALL
  SELECT 266 AS `hsk_source_id`, 21 AS `radical_id`, '些' AS `hanzi_char` UNION ALL
  SELECT 272 AS `hsk_source_id`, 13 AS `radical_id`, '见' AS `hanzi_char` UNION ALL
  SELECT 276 AS `hsk_source_id`, 4 AS `radical_id`, '么' AS `hanzi_char` UNION ALL
  SELECT 280 AS `hsk_source_id`, 162 AS `radical_id`, '边' AS `hanzi_char` UNION ALL
  SELECT 992 AS `hsk_source_id`, 39 AS `radical_id`, '子' AS `hanzi_char` UNION ALL
  SELECT 297 AS `hsk_source_id`, 1 AS `radical_id`, '天' AS `hanzi_char` UNION ALL
  SELECT 22 AS `hsk_source_id`, 1 AS `radical_id`, '车' AS `hanzi_char` UNION ALL
  SELECT 157 AS `hsk_source_id`, 1 AS `radical_id`, '宜' AS `hanzi_char` UNION ALL
  SELECT 259 AS `hsk_source_id`, 1 AS `radical_id`, '下' AS `hanzi_char` UNION ALL
  SELECT 277 AS `hsk_source_id`, 4 AS `radical_id`, '么' AS `hanzi_char` UNION ALL
  SELECT 313 AS `hsk_source_id`, 61 AS `radical_id`, '思' AS `hanzi_char` UNION ALL
  SELECT 331 AS `hsk_source_id`, 72 AS `radical_id`, '是' AS `hanzi_char` UNION ALL
  SELECT 339 AS `hsk_source_id`, 184 AS `radical_id`, '馆' AS `hanzi_char` UNION ALL
  SELECT 346 AS `hsk_source_id`, 12 AS `radical_id`, '交' AS `hanzi_char` UNION ALL
  SELECT 377 AS `hsk_source_id`, 30 AS `radical_id`, '啡' AS `hanzi_char` UNION ALL
  SELECT 394 AS `hsk_source_id`, 70 AS `radical_id`, '游' AS `hanzi_char` UNION ALL
  SELECT 398 AS `hsk_source_id`, 61 AS `radical_id`, '思' AS `hanzi_char` UNION ALL
  SELECT 425 AS `hsk_source_id`, 1 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 458 AS `hsk_source_id`, 1 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 467 AS `hsk_source_id`, 109 AS `radical_id`, '睛' AS `hanzi_char` UNION ALL
  SELECT 474 AS `hsk_source_id`, 61 AS `radical_id`, '思' AS `hanzi_char` UNION ALL
  SELECT 478 AS `hsk_source_id`, 85 AS `radical_id`, '泳' AS `hanzi_char` UNION ALL
  SELECT 479 AS `hsk_source_id`, 61 AS `radical_id`, '思' AS `hanzi_char` UNION ALL
  SELECT 485 AS `hsk_source_id`, 7 AS `radical_id`, '动' AS `hanzi_char` UNION ALL
  SELECT 485 AS `hsk_source_id`, 28 AS `radical_id`, '动' AS `hanzi_char` UNION ALL
  SELECT 487 AS `hsk_source_id`, 1 AS `radical_id`, '夫' AS `hanzi_char` UNION ALL
  SELECT 512 AS `hsk_source_id`, 12 AS `radical_id`, '公' AS `hanzi_char` UNION ALL
  SELECT 533 AS `hsk_source_id`, 40 AS `radical_id`, '馆' AS `hanzi_char` UNION ALL
  SELECT 535 AS `hsk_source_id`, 85 AS `radical_id`, '激' AS `hanzi_char` UNION ALL
  SELECT 535 AS `hsk_source_id`, 15 AS `radical_id`, '凌' AS `hanzi_char` UNION ALL
  SELECT 538 AS `hsk_source_id`, 1 AS `radical_id`, '但' AS `hanzi_char` UNION ALL
  SELECT 555 AS `hsk_source_id`, 13 AS `radical_id`, '见' AS `hanzi_char` UNION ALL
  SELECT 558 AS `hsk_source_id`, 145 AS `radical_id`, '衫' AS `hanzi_char` UNION ALL
  SELECT 571 AS `hsk_source_id`, 64 AS `radical_id`, '扫' AS `hanzi_char` UNION ALL
  SELECT 572 AS `hsk_source_id`, 1 AS `radical_id`, '算' AS `hanzi_char` UNION ALL
  SELECT 604 AS `hsk_source_id`, 7 AS `radical_id`, '园' AS `hanzi_char` UNION ALL
  SELECT 637 AS `hsk_source_id`, 1 AS `radical_id`, '兴' AS `hanzi_char` UNION ALL
  SELECT 650 AS `hsk_source_id`, 30 AS `radical_id`, '事' AS `hanzi_char` UNION ALL
  SELECT 670 AS `hsk_source_id`, 120 AS `radical_id`, '绿' AS `hanzi_char` UNION ALL
  SELECT 697 AS `hsk_source_id`, 32 AS `radical_id`, '持' AS `hanzi_char` UNION ALL
  SELECT 698 AS `hsk_source_id`, 1 AS `radical_id`, '查' AS `hanzi_char` UNION ALL
  SELECT 698 AS `hsk_source_id`, 75 AS `radical_id`, '查' AS `hanzi_char` UNION ALL
  SELECT 712 AS `hsk_source_id`, 30 AS `radical_id`, '束' AS `hanzi_char` UNION ALL
  SELECT 714 AS `hsk_source_id`, 38 AS `radical_id`, '妹' AS `hanzi_char` UNION ALL
  SELECT 714 AS `hsk_source_id`, 1 AS `radical_id`, '妹' AS `hanzi_char` UNION ALL
  SELECT 742 AS `hsk_source_id`, 85 AS `radical_id`, '水' AS `hanzi_char` UNION ALL
  SELECT 761 AS `hsk_source_id`, 75 AS `radical_id`, '梯' AS `hanzi_char` UNION ALL
  SELECT 786 AS `hsk_source_id`, 19 AS `radical_id`, '力' AS `hanzi_char` UNION ALL
  SELECT 859 AS `hsk_source_id`, 30 AS `radical_id`, '事' AS `hanzi_char` UNION ALL
  SELECT 862 AS `hsk_source_id`, 94 AS `radical_id`, '然' AS `hanzi_char` UNION ALL
  SELECT 870 AS `hsk_source_id`, 30 AS `radical_id`, '点' AS `hanzi_char` UNION ALL
  SELECT 888 AS `hsk_source_id`, 85 AS `radical_id`, '澡' AS `hanzi_char` UNION ALL
  SELECT 889 AS `hsk_source_id`, 1 AS `radical_id`, '天' AS `hanzi_char` UNION ALL
  SELECT 896 AS `hsk_source_id`, 75 AS `radical_id`, '机' AS `hanzi_char` UNION ALL
  SELECT 911 AS `hsk_source_id`, 9 AS `radical_id`, '假' AS `hanzi_char` UNION ALL
  SELECT 923 AS `hsk_source_id`, 1 AS `radical_id`, '共' AS `hanzi_char` UNION ALL
  SELECT 934 AS `hsk_source_id`, 1 AS `radical_id`, '直' AS `hanzi_char` UNION ALL
  SELECT 951 AS `hsk_source_id`, 149 AS `radical_id`, '言' AS `hanzi_char` UNION ALL
  SELECT 957 AS `hsk_source_id`, 61 AS `radical_id`, '意' AS `hanzi_char` UNION ALL
  SELECT 960 AS `hsk_source_id`, 7 AS `radical_id`, '动' AS `hanzi_char` UNION ALL
  SELECT 960 AS `hsk_source_id`, 28 AS `radical_id`, '动' AS `hanzi_char` UNION ALL
  SELECT 960 AS `hsk_source_id`, 7 AS `radical_id`, '会' AS `hanzi_char` UNION ALL
  SELECT 960 AS `hsk_source_id`, 28 AS `radical_id`, '会' AS `hanzi_char` UNION ALL
  SELECT 961 AS `hsk_source_id`, 7 AS `radical_id`, '动' AS `hanzi_char` UNION ALL
  SELECT 961 AS `hsk_source_id`, 28 AS `radical_id`, '动' AS `hanzi_char` UNION ALL
  SELECT 964 AS `hsk_source_id`, 4 AS `radical_id`, '么' AS `hanzi_char` UNION ALL
  SELECT 1000 AS `hsk_source_id`, 1 AS `radical_id`, '业' AS `hanzi_char`
) m
JOIN `VOCABULARY` v ON v.`hsk_source_id` = m.`hsk_source_id`;

-- -----------------------------------------------------------------------------
-- Step 4: Insert missing constituent radicals for supplementary curriculum vocabulary
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, m.`radical_id`, m.`hanzi_char`, 'kangxi_radical', 'verified'
FROM (
  SELECT '唱歌' AS `hanzi`, 'changge' AS `pinyin_raw`, 30 AS `radical_id`, '歌' AS `hanzi_char` UNION ALL
  SELECT '车上' AS `hanzi`, 'che shang' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char` UNION ALL
  SELECT '打球' AS `hanzi`, 'da qiu' AS `pinyin_raw`, 1 AS `radical_id`, '球' AS `hanzi_char` UNION ALL
  SELECT '干什么' AS `hanzi`, 'gan shenme' AS `pinyin_raw`, 24 AS `radical_id`, '什' AS `hanzi_char` UNION ALL
  SELECT '关上' AS `hanzi`, 'guanshang' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char` UNION ALL
  SELECT '教学楼' AS `hanzi`, 'jiaoxuelou' AS `pinyin_raw`, 39 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT '上车' AS `hanzi`, 'shang che' AS `pinyin_raw`, 1 AS `radical_id`, '车' AS `hanzi_char` UNION ALL
  SELECT '玩儿' AS `hanzi`, 'wanr' AS `pinyin_raw`, 10 AS `radical_id`, '儿' AS `hanzi_char` UNION ALL
  SELECT '下车' AS `hanzi`, 'xia che' AS `pinyin_raw`, 1 AS `radical_id`, '车' AS `hanzi_char` UNION ALL
  SELECT '一下儿' AS `hanzi`, 'yixiar' AS `pinyin_raw`, 1 AS `radical_id`, '下' AS `hanzi_char` UNION ALL
  SELECT '知识' AS `hanzi`, 'zhishi' AS `pinyin_raw`, 30 AS `radical_id`, '识' AS `hanzi_char`
) m
JOIN `VOCABULARY` v ON v.`hanzi` = m.`hanzi` AND v.`pinyin_raw` = m.`pinyin_raw`;
