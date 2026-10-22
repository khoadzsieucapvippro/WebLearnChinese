-- =============================================================================
-- Migration: V24__add_radical_stroke_count_and_expand_vocab_radical_pk.sql
-- Description:
--   1. Rebuild RADICAL with stroke_count TINYINT UNSIGNED NOT NULL (1..17)
--   2. Rebuild VOCAB_RADICAL with the expanded primary key
--      (vocab_id, radical_id, hanzi_char) and component metadata
--   3. Insert missing constituent radical associations previously dropped by the
--      old primary key
--
-- IMPORTANT - TiDB Cloud Serverless compatibility:
--   TiDB does NOT support ALTER TABLE ... DROP PRIMARY KEY when the existing
--   primary key is CLUSTERED, and it cannot convert CLUSTERED <-> NONCLUSTERED.
--   The connection parameter `sessionVariables=tidb_enable_clustered_index=OFF`
--   only affects tables created afterwards; it cannot change an existing table.
--   Therefore this migration rebuilds both tables with CREATE + INSERT + an
--   atomic RENAME instead of altering the primary key in place.
--
--   The rebuild is restartable and works for:
--     - a fresh database (V23 schema),
--     - a database where an older V24 failed after adding some columns,
--     - MySQL 8.x (the /*T![...]*/ TiDB hint is a normal comment there).
--   Data is copied before the atomic swap; old tables are dropped only after
--   the swap succeeds. Leftovers from an interrupted run are removed first.
-- Database: MySQL 8.4+ / TiDB Cloud Serverless
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 0: Remove leftovers from an interrupted V24 run.
-- These tables are internal to this migration; the live tables are still intact
-- until the atomic RENAME below, so dropping the staging tables is safe.
-- -----------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `VOCAB_RADICAL_V24_TMP`;
DROP TABLE IF EXISTS `VOCAB_RADICAL_V24_OLD`;
DROP TABLE IF EXISTS `RADICAL_V24_TMP`;
DROP TABLE IF EXISTS `RADICAL_V24_OLD`;

-- -----------------------------------------------------------------------------
-- Step 1: Rebuild VOCAB_RADICAL with the final schema.
-- The primary key is explicitly NONCLUSTERED for TiDB so future ALTERs never
-- hit the "Unsupported drop primary key ... clustered index" error.
-- -----------------------------------------------------------------------------
CREATE TABLE `VOCAB_RADICAL_V24_TMP` (
    `vocab_id` BIGINT UNSIGNED NOT NULL,
    `radical_id` INT UNSIGNED NOT NULL,
    `hanzi_char` VARCHAR(10) NOT NULL DEFAULT '',
    `component_type` VARCHAR(50) NOT NULL DEFAULT 'kangxi_radical',
    `verification_status` VARCHAR(50) NOT NULL DEFAULT 'verified',
    PRIMARY KEY (`vocab_id`, `radical_id`, `hanzi_char`) /*T![clustered_index] NONCLUSTERED */,
    INDEX `idx_vocab_radical_hanzi_char` (`hanzi_char`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `VOCAB_RADICAL_V24_TMP` (`vocab_id`, `radical_id`, `hanzi_char`)
SELECT `vocab_id`, `radical_id`, COALESCE(`hanzi_char`, '')
FROM `VOCAB_RADICAL`;

RENAME TABLE `VOCAB_RADICAL` TO `VOCAB_RADICAL_V24_OLD`,
             `VOCAB_RADICAL_V24_TMP` TO `VOCAB_RADICAL`;

DROP TABLE `VOCAB_RADICAL_V24_OLD`;

-- -----------------------------------------------------------------------------
-- Step 2: Rebuild RADICAL with stroke_count and backfill the 214 Kangxi counts.
-- The CASE expression is equivalent to the previous per-range UPDATEs and also
-- repairs a RADICAL table where a failed V24 already added stroke_count.
-- -----------------------------------------------------------------------------
CREATE TABLE `RADICAL_V24_TMP` (
    `radical_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `character` VARCHAR(10) NOT NULL,
    `pinyin` VARCHAR(50) NOT NULL,
    `meaning_han_viet` VARCHAR(100) NOT NULL,
    `meaning_vi` VARCHAR(255) NOT NULL,
    `stroke_count` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `explanation_vi` VARCHAR(1000) NULL,
    `audio_url` VARCHAR(500) NULL,
    `video_writing_url` VARCHAR(500) NULL,
    `common_rank` TINYINT UNSIGNED NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`radical_id`),
    UNIQUE KEY `uk_radical_character` (`character`),
    UNIQUE KEY `uk_radical_common_rank` (`common_rank`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `RADICAL_V24_TMP` (
    `radical_id`, `character`, `pinyin`, `meaning_han_viet`, `meaning_vi`,
    `stroke_count`, `explanation_vi`, `audio_url`, `video_writing_url`,
    `common_rank`, `created_at`, `updated_at`)
SELECT `radical_id`, `character`, `pinyin`, `meaning_han_viet`, `meaning_vi`,
    CASE
        WHEN `radical_id` BETWEEN 1 AND 6 THEN 1
        WHEN `radical_id` BETWEEN 7 AND 29 THEN 2
        WHEN `radical_id` BETWEEN 30 AND 60 THEN 3
        WHEN `radical_id` BETWEEN 61 AND 94 THEN 4
        WHEN `radical_id` BETWEEN 95 AND 117 THEN 5
        WHEN `radical_id` BETWEEN 118 AND 146 THEN 6
        WHEN `radical_id` BETWEEN 147 AND 166 THEN 7
        WHEN `radical_id` BETWEEN 167 AND 175 THEN 8
        WHEN `radical_id` BETWEEN 176 AND 186 THEN 9
        WHEN `radical_id` BETWEEN 187 AND 194 THEN 10
        WHEN `radical_id` BETWEEN 195 AND 200 THEN 11
        WHEN `radical_id` BETWEEN 201 AND 204 THEN 12
        WHEN `radical_id` BETWEEN 205 AND 208 THEN 13
        WHEN `radical_id` BETWEEN 209 AND 210 THEN 14
        WHEN `radical_id` = 211 THEN 15
        WHEN `radical_id` IN (212, 213) THEN 16
        WHEN `radical_id` = 214 THEN 17
        ELSE 1
    END,
    `explanation_vi`, `audio_url`, `video_writing_url`, `common_rank`,
    `created_at`, `updated_at`
FROM `RADICAL`;

RENAME TABLE `RADICAL` TO `RADICAL_V24_OLD`,
             `RADICAL_V24_TMP` TO `RADICAL`;

DROP TABLE `RADICAL_V24_OLD`;

-- The CHECK constraint name is schema-global in MySQL, so it can only be
-- created after the old RADICAL table (which still owns the name) is dropped.
ALTER TABLE `RADICAL`
    ADD CONSTRAINT `chk_radical_common_rank`
        CHECK (`common_rank` IS NULL OR (`common_rank` >= 1 AND `common_rank` <= 50));

-- -----------------------------------------------------------------------------
-- Step 3: Restore the foreign keys on the rebuilt child table.
-- -----------------------------------------------------------------------------
ALTER TABLE `VOCAB_RADICAL`
    ADD CONSTRAINT `fk_vocab_radical_vocab` FOREIGN KEY (`vocab_id`)
        REFERENCES `VOCABULARY` (`vocab_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_vocab_radical_radical` FOREIGN KEY (`radical_id`)
        REFERENCES `RADICAL` (`radical_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- Step 4: Insert missing constituent radicals for official HSK 1-3 vocabulary
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
-- Step 5: Insert missing constituent radicals for supplementary curriculum vocabulary
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
JOIN `VOCABULARY` v
  ON v.`hanzi` = m.`hanzi` COLLATE utf8mb4_unicode_ci
 AND v.`pinyin_raw` = m.`pinyin_raw` COLLATE utf8mb4_unicode_ci;
