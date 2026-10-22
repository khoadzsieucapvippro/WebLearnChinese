-- =============================================================================
-- Migration: V23__standardize_hsk_1_to_3_vocabulary_2025.sql
-- Description:
--   Standardize all vocabulary for HSK 1-3 according to the official
--   HSK 3.0 November 2025 Examination Syllabus (新版HSK考试大纲, chinesetest.cn).
--   Exact metrics:
--     - HSK 1: exactly 300 entries (official IDs 1..300)
--     - HSK 2: exactly 200 entries (official IDs 301..500)
--     - HSK 3: exactly 500 entries (official IDs 501..1000)
--     - Total official entries: exactly 1,000 entries
--     - Preserved supplementary entries: exactly 68 entries (hsk_level = 0, hsk_standard = 'Curriculum Supplementary')
--     - Total vocabulary entries in DB: exactly 1,068 entries
-- Database: MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Schema updates (DDL)
-- -----------------------------------------------------------------------------
ALTER TABLE `VOCABULARY` MODIFY COLUMN `hsk_standard` VARCHAR(50) NOT NULL DEFAULT 'HSK 3.0';

-- Drop physical unique index to allow homographs with same pinyin_raw (e.g. 会, 过, 花, 得, 点)
-- Reorder indexes so composite uk_vocab_hanzi_pinyin_raw precedes single-column indexes for optimizer selection
ALTER TABLE `VOCABULARY` DROP INDEX `uk_vocab_hanzi_pinyin_raw`;
ALTER TABLE `VOCABULARY` DROP INDEX `idx_vocab_pinyin_raw`;
ALTER TABLE `VOCABULARY` DROP INDEX `idx_vocab_hanzi`;
ALTER TABLE `VOCABULARY` ADD INDEX `uk_vocab_hanzi_pinyin_raw` (`hanzi`, `pinyin_raw`);
ALTER TABLE `VOCABULARY` ADD INDEX `idx_vocab_pinyin_raw` (`pinyin_raw`);
ALTER TABLE `VOCABULARY` ADD INDEX `idx_vocab_hanzi` (`hanzi`);

-- Add HSK 2025 syllabus metadata columns
ALTER TABLE `VOCABULARY` ADD COLUMN `hsk_source_id` INT NULL AFTER `hsk_standard`;
ALTER TABLE `VOCABULARY` ADD COLUMN `hsk_source_label` VARCHAR(50) NULL AFTER `hsk_source_id`;
ALTER TABLE `VOCABULARY` ADD COLUMN `hsk_edition` VARCHAR(50) NOT NULL DEFAULT '2025' AFTER `hsk_source_label`;
ALTER TABLE `VOCABULARY` ADD COLUMN `part_of_speech` VARCHAR(50) NULL AFTER `hsk_edition`;
ALTER TABLE `VOCABULARY` ADD COLUMN `homograph_index` INT NULL AFTER `part_of_speech`;
ALTER TABLE `VOCABULARY` ADD COLUMN `source_pdf_page` INT NULL AFTER `homograph_index`;

ALTER TABLE `VOCABULARY` ADD CONSTRAINT `uk_vocab_hsk_source` UNIQUE (`hsk_source_id`);

-- -----------------------------------------------------------------------------
-- Step 2: Update 432 existing vocabulary entries matching official HSK 1-3 items
-- -----------------------------------------------------------------------------
UPDATE `VOCABULARY` SET `pinyin` = 'ài', `pinyin_raw` = 'ai', `meaning_han_viet` = 'Ái', `meaning_vi` = 'Yêu; thích; tình cảm', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 1, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '爱' AND `pinyin_raw` = 'ai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'àihào', `pinyin_raw` = 'aihao', `meaning_han_viet` = 'Ái Hảo', `meaning_vi` = 'Thích; đam mê; lấy làm thú vui; say mê; sở thích', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 302, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动、名', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '爱好' AND `pinyin_raw` = 'aihao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bā', `pinyin_raw` = 'ba', `meaning_han_viet` = 'Bát', `meaning_vi` = 'Tám; 8', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 2, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '数', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '八' AND `pinyin_raw` = 'ba' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bàba', `pinyin_raw` = 'baba', `meaning_han_viet` = 'Ba Ba', `meaning_vi` = 'Cha; ba', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 3, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '爸爸' AND `pinyin_raw` = 'baba' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'ba', `pinyin_raw` = 'ba', `meaning_han_viet` = 'Ba', `meaning_vi` = 'Trợ từ ngữ khí: nhé, thôi, đi, chứ', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 4, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '助', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '吧' AND `pinyin_raw` = 'ba' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'báitiān', `pinyin_raw` = 'baitian', `meaning_han_viet` = 'Bạch Thiên', `meaning_vi` = 'Ban ngày; trong ngày', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 5, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '白天' AND `pinyin_raw` = 'baitian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bǎi', `pinyin_raw` = 'bai', `meaning_han_viet` = 'Bách', `meaning_vi` = 'Một trăm; trăm', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 6, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '数', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '百' AND `pinyin_raw` = 'bai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bān', `pinyin_raw` = 'ban', `meaning_han_viet` = 'Ban', `meaning_vi` = 'Lớp học; ca làm việc', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 304, `hsk_source_label` = '2（5）', `hsk_edition` = '2025', `part_of_speech` = '名、（量）', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '班' AND `pinyin_raw` = 'ban' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bàn', `pinyin_raw` = 'ban', `meaning_han_viet` = 'Bán', `meaning_vi` = 'Một nửa, nửa', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 7, `hsk_source_label` = '1（4）', `hsk_edition` = '2025', `part_of_speech` = '数、（副）', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '半' AND `pinyin_raw` = 'ban' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bàntiān', `pinyin_raw` = 'bantian', `meaning_han_viet` = 'Bán Thiên', `meaning_vi` = 'Nửa ngày; một thời gian dài', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 513, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '数量', `homograph_index` = NULL, `source_pdf_page` = '92', `updated_at` = NOW() WHERE `hanzi` = '半天' AND `pinyin_raw` = 'bantian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bāng', `pinyin_raw` = 'bang', `meaning_han_viet` = 'Bang', `meaning_vi` = 'Giúp; giúp đỡ', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 305, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '帮' AND `pinyin_raw` = 'bang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bāngmáng', `pinyin_raw` = 'bangmang', `meaning_han_viet` = 'Bang Mang', `meaning_vi` = 'Giúp; giúp đỡ', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 306, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '帮忙' AND `pinyin_raw` = 'bangmang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bāo', `pinyin_raw` = 'bao', `meaning_han_viet` = 'Bao', `meaning_vi` = 'Túi; bao; gói', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 307, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动、名、量', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '包' AND `pinyin_raw` = 'bao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bāozi', `pinyin_raw` = 'baozi', `meaning_han_viet` = 'Bao Tử', `meaning_vi` = 'Bánh bao', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 8, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '包子' AND `pinyin_raw` = 'baozi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bēizi', `pinyin_raw` = 'beizi', `meaning_han_viet` = 'Bôi Tử', `meaning_vi` = 'Cốc; ly', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 9, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '杯子' AND `pinyin_raw` = 'beizi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'běi', `pinyin_raw` = 'bei', `meaning_han_viet` = 'Bắc', `meaning_vi` = 'Phía bắc; bị đánh bại', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 517, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '92', `updated_at` = NOW() WHERE `hanzi` = '北' AND `pinyin_raw` = 'bei' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'běn', `pinyin_raw` = 'ben', `meaning_han_viet` = 'Bản', `meaning_vi` = 'Quyển; cuốn (sách); gốc', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 10, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '量', `homograph_index` = '1', `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '本' AND `pinyin_raw` = 'ben' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'běnzi', `pinyin_raw` = 'benzi', `meaning_han_viet` = 'Bản Tử', `meaning_vi` = 'Vở, quyển vở, sổ tay', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 308, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '本子' AND `pinyin_raw` = 'benzi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bǐ', `pinyin_raw` = 'bi', `meaning_han_viet` = 'Tỷ', `meaning_vi` = 'So sánh; so với; hơn', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 309, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动、介', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '比' AND `pinyin_raw` = 'bi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bié', `pinyin_raw` = 'bie', `meaning_han_viet` = 'Biệt', `meaning_vi` = 'Đừng; chớ; khác', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 311, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = '1', `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '别' AND `pinyin_raw` = 'bie' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'biéde', `pinyin_raw` = 'biede', `meaning_han_viet` = 'Biệt Đích', `meaning_vi` = 'Khác', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 531, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '93', `updated_at` = NOW() WHERE `hanzi` = '别的' AND `pinyin_raw` = 'biede' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'biérén', `pinyin_raw` = 'bieren', `meaning_han_viet` = 'Biệt Nhân', `meaning_vi` = 'Người khác; những người khác', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 532, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '93', `updated_at` = NOW() WHERE `hanzi` = '别人' AND `pinyin_raw` = 'bieren' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bìng', `pinyin_raw` = 'bing', `meaning_han_viet` = 'Bệnh', `meaning_vi` = 'Bệnh; ốm đau', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 12, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名、动', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '病' AND `pinyin_raw` = 'bing' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bìngrén', `pinyin_raw` = 'bingren', `meaning_han_viet` = 'Bệnh Nhân', `meaning_vi` = 'Người bệnh; bệnh nhân', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 537, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '93', `updated_at` = NOW() WHERE `hanzi` = '病人' AND `pinyin_raw` = 'bingren' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bú kèqi', `pinyin_raw` = 'bukeqi', `meaning_han_viet` = 'Bất Khách Khí', `meaning_vi` = 'Không có chi; đừng nhắc đến', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 14, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '不客气' AND (`pinyin_raw` = 'bu keqi' OR `pinyin_raw` = 'bukeqi') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'búyòng', `pinyin_raw` = 'buyong', `meaning_han_viet` = 'Bất Dụng', `meaning_vi` = 'Không cần', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 540, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '93', `updated_at` = NOW() WHERE `hanzi` = '不用' AND `pinyin_raw` = 'buyong' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'bù', `pinyin_raw` = 'bu', `meaning_han_viet` = 'Bất', `meaning_vi` = 'Không; không phải; không; bất-', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 13, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '不' AND `pinyin_raw` = 'bu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'cài', `pinyin_raw` = 'cai', `meaning_han_viet` = 'Thái', `meaning_vi` = 'Rau; món ăn', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 16, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '菜' AND `pinyin_raw` = 'cai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'chá', `pinyin_raw` = 'cha', `meaning_han_viet` = 'Trà', `meaning_vi` = 'Trà; cây trà', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 17, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '茶' AND `pinyin_raw` = 'cha' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'chà', `pinyin_raw` = 'cha', `meaning_han_viet` = 'Sai', `meaning_vi` = 'Kém, tồi; thiếu; chênh lệch', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 551, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '形、动', `homograph_index` = NULL, `source_pdf_page` = '93', `updated_at` = NOW() WHERE `hanzi` = '差' AND `pinyin_raw` = 'cha' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'cháng', `pinyin_raw` = 'chang', `meaning_han_viet` = 'Thường', `meaning_vi` = 'Thường; thường xuyên', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 554, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '93', `updated_at` = NOW() WHERE `hanzi` = '常' AND `pinyin_raw` = 'chang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'chángcháng', `pinyin_raw` = 'changchang', `meaning_han_viet` = 'Thường Thường', `meaning_vi` = 'Thường xuyên; thường', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 557, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '93', `updated_at` = NOW() WHERE `hanzi` = '常常' AND `pinyin_raw` = 'changchang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'chàng', `pinyin_raw` = 'chang', `meaning_han_viet` = 'Xướng', `meaning_vi` = 'Hát; gọi to', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 18, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '唱' AND `pinyin_raw` = 'chang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'chē', `pinyin_raw` = 'che', `meaning_han_viet` = 'Xa', `meaning_vi` = 'Xe, xe cộ', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 20, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '车' AND `pinyin_raw` = 'che' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'chēzhàn', `pinyin_raw` = 'chezhan', `meaning_han_viet` = 'Xa Trạm', `meaning_vi` = 'Ga tàu; dừng xe buýt', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 315, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '车站' AND `pinyin_raw` = 'chezhan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'chī', `pinyin_raw` = 'chi', `meaning_han_viet` = 'Cật', `meaning_vi` = 'Ăn; tiêu thụ; ăn ở', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 21, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '吃' AND `pinyin_raw` = 'chi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'chū', `pinyin_raw` = 'chu', `meaning_han_viet` = 'Xuất', `meaning_vi` = 'Ra; xuất; đi ra', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 316, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '出' AND `pinyin_raw` = 'chu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'chūlái', `pinyin_raw` = 'chulai', `meaning_han_viet` = 'Xuất Lai', `meaning_vi` = 'Đi ra; xuất hiện', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 318, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '出来' AND `pinyin_raw` = 'chulai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'chūqù', `pinyin_raw` = 'chuqu', `meaning_han_viet` = 'Xuất Khứ', `meaning_vi` = 'Đi ra ngoài', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 320, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '出去' AND `pinyin_raw` = 'chuqu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'chuān', `pinyin_raw` = 'chuan', `meaning_han_viet` = 'Xuyên', `meaning_vi` = 'Mặc (áo); đi (giày)', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 23, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '穿' AND `pinyin_raw` = 'chuan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'chuáng', `pinyin_raw` = 'chuang', `meaning_han_viet` = 'Sàng', `meaning_vi` = 'Giường; ghế dài', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 321, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '床' AND `pinyin_raw` = 'chuang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'cì', `pinyin_raw` = 'ci', `meaning_han_viet` = 'Thứ', `meaning_vi` = 'Lần, lượt, thứ tự', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 323, `hsk_source_label` = '2（7-9）', `hsk_edition` = '2025', `part_of_speech` = '量、（形）', `homograph_index` = NULL, `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '次' AND `pinyin_raw` = 'ci' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'cóng', `pinyin_raw` = 'cong', `meaning_han_viet` = 'Tòng', `meaning_vi` = 'Từ, theo, đi từ', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 324, `hsk_source_label` = '2（4）', `hsk_edition` = '2025', `part_of_speech` = '介、（副）', `homograph_index` = NULL, `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '从' AND `pinyin_raw` = 'cong' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'cuò', `pinyin_raw` = 'cuo', `meaning_han_viet` = 'Thác', `meaning_vi` = 'Sai; nhầm lẫn', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 326, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '错' AND `pinyin_raw` = 'cuo' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dǎ', `pinyin_raw` = 'da', `meaning_han_viet` = 'Tá', `meaning_vi` = 'Đánh; gọi (điện thoại); chơi (bóng)', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 327, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = '1', `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '打' AND `pinyin_raw` = 'da' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dǎchē', `pinyin_raw` = 'dache', `meaning_han_viet` = 'Tá Xa', `meaning_vi` = 'Bắt taxi; đón xe', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 328, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '打车' AND `pinyin_raw` = 'dache' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dǎ diànhuà', `pinyin_raw` = 'dadianhua', `meaning_han_viet` = 'Tá Điện Thoại', `meaning_vi` = 'Gọi điện thoại', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 24, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '打电话' AND (`pinyin_raw` = 'da dianhua' OR `pinyin_raw` = 'dadianhua') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dǎkāi', `pinyin_raw` = 'dakai', `meaning_han_viet` = 'Tá Khai', `meaning_vi` = 'Mở; cho xem', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 329, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '打开' AND `pinyin_raw` = 'dakai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dà', `pinyin_raw` = 'da', `meaning_han_viet` = 'Đại', `meaning_vi` = 'Lớn; to', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 25, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '大' AND `pinyin_raw` = 'da' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dàxué', `pinyin_raw` = 'daxue', `meaning_han_viet` = 'Đại Học', `meaning_vi` = 'Trường đại học, đại học', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 27, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '大学' AND `pinyin_raw` = 'daxue' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dàxuéshēng', `pinyin_raw` = 'daxuesheng', `meaning_han_viet` = 'Đại Học Sinh', `meaning_vi` = 'Sinh viên đại học; sinh viên cao đẳng', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 28, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '大学生' AND `pinyin_raw` = 'daxuesheng' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dào', `pinyin_raw` = 'dao', `meaning_han_viet` = 'Đáo', `meaning_vi` = 'Đến; tới', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 29, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '到' AND `pinyin_raw` = 'dao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dédào', `pinyin_raw` = 'dedao', `meaning_han_viet` = 'Đắc Đáo', `meaning_vi` = 'Được; đạt được; nhận được', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 584, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '94', `updated_at` = NOW() WHERE `hanzi` = '得到' AND `pinyin_raw` = 'dedao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'de', `pinyin_raw` = 'de', `meaning_han_viet` = 'Địa', `meaning_vi` = 'Trợ từ kết cấu (nối trạng ngữ với động từ)', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 333, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '助', `homograph_index` = NULL, `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '地' AND `pinyin_raw` = 'de' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'de', `pinyin_raw` = 'de', `meaning_han_viet` = 'Đích', `meaning_vi` = 'Của; trợ từ sở hữu hoặc bổ nghĩa', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 30, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '助', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '的' AND `pinyin_raw` = 'de' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'děng', `pinyin_raw` = 'deng', `meaning_han_viet` = 'Đẳng', `meaning_vi` = 'Đợi; chờ đợi; vân vân', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 334, `hsk_source_label` = '2（4）', `hsk_edition` = '2025', `part_of_speech` = '动、（介）', `homograph_index` = '1', `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '等' AND `pinyin_raw` = 'deng' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dì', `pinyin_raw` = 'di', `meaning_han_viet` = 'Địa', `meaning_vi` = 'Trợ từ kết cấu (nối trạng ngữ với động từ)', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 589, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '94', `updated_at` = NOW() WHERE `hanzi` = '地' AND `pinyin_raw` = 'di' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dìdiǎn', `pinyin_raw` = 'didian', `meaning_han_viet` = 'Địa Điểm', `meaning_vi` = 'Nơi; chỗ', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 590, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '94', `updated_at` = NOW() WHERE `hanzi` = '地点' AND `pinyin_raw` = 'didian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dìfang', `pinyin_raw` = 'difang', `meaning_han_viet` = 'Địa Phương', `meaning_vi` = 'Nơi chốn, chỗ, địa phương', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 591, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '94', `updated_at` = NOW() WHERE `hanzi` = '地方' AND `pinyin_raw` = 'difang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dìtú', `pinyin_raw` = 'ditu', `meaning_han_viet` = 'Địa Đồ', `meaning_vi` = 'Bản đồ', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 592, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '94', `updated_at` = NOW() WHERE `hanzi` = '地图' AND `pinyin_raw` = 'ditu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dìdi', `pinyin_raw` = 'didi', `meaning_han_viet` = 'Đệ Đệ', `meaning_vi` = 'Em trai', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 32, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '弟弟' AND `pinyin_raw` = 'didi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dì', `pinyin_raw` = 'di', `meaning_han_viet` = 'Đệ', `meaning_vi` = 'Thứ, đệ (tiền tố đặt trước số thứ tự)', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 31, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '前缀', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '第' AND (`pinyin_raw` = 'di' OR `pinyin_raw` = 'di (di-er)' OR `pinyin_raw` = 'di(dier)') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'diǎn', `pinyin_raw` = 'dian', `meaning_han_viet` = 'Điểm', `meaning_vi` = 'Giờ; điểm; chấm; chút ít', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 33, `hsk_source_label` = '1（3）', `hsk_edition` = '2025', `part_of_speech` = '量、（名）', `homograph_index` = '1', `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '点' AND `pinyin_raw` = 'dian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'diàn', `pinyin_raw` = 'dian', `meaning_han_viet` = 'Điện', `meaning_vi` = 'Điện; pin', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 593, `hsk_source_label` = '3（5）', `hsk_edition` = '2025', `part_of_speech` = '名、（动）', `homograph_index` = NULL, `source_pdf_page` = '94', `updated_at` = NOW() WHERE `hanzi` = '电' AND `pinyin_raw` = 'dian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'diànhuà', `pinyin_raw` = 'dianhua', `meaning_han_viet` = 'Điện Thoại', `meaning_vi` = 'Điện thoại; cuộc gọi điện thoại', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 35, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '电话' AND `pinyin_raw` = 'dianhua' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'diànnǎo', `pinyin_raw` = 'diannao', `meaning_han_viet` = 'Điện Não', `meaning_vi` = 'Máy tính', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 36, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '电脑' AND `pinyin_raw` = 'diannao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'diànshì', `pinyin_raw` = 'dianshi', `meaning_han_viet` = 'Điện Thị', `meaning_vi` = 'Truyền hình; TV', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 37, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '电视' AND `pinyin_raw` = 'dianshi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'diànyǐng', `pinyin_raw` = 'dianying', `meaning_han_viet` = 'Điện Ảnh', `meaning_vi` = 'Phim; điện ảnh', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 38, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '电影' AND `pinyin_raw` = 'dianying' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'diànyǐngyuàn', `pinyin_raw` = 'dianyingyuan', `meaning_han_viet` = 'Điện Ảnh Viện', `meaning_vi` = 'Rạp chiếu phim; rạp phim', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 39, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '电影院' AND `pinyin_raw` = 'dianyingyuan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dōng', `pinyin_raw` = 'dong', `meaning_han_viet` = 'Đông', `meaning_vi` = 'Phía đông, phương đông', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 597, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '94', `updated_at` = NOW() WHERE `hanzi` = '东' AND `pinyin_raw` = 'dong' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dōngxi', `pinyin_raw` = 'dongxi', `meaning_han_viet` = 'Đông Tây', `meaning_vi` = 'Đồ vật, đồ đạc, cái', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 40, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '80', `updated_at` = NOW() WHERE `hanzi` = '东西' AND `pinyin_raw` = 'dongxi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dòng', `pinyin_raw` = 'dong', `meaning_han_viet` = 'Động', `meaning_vi` = 'Động; cử động; chuyển động', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 338, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '动' AND `pinyin_raw` = 'dong' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dōu', `pinyin_raw` = 'dou', `meaning_han_viet` = 'Đô', `meaning_vi` = 'Đều; tất cả', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 41, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '都' AND `pinyin_raw` = 'dou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dú', `pinyin_raw` = 'du', `meaning_han_viet` = 'Độc', `meaning_vi` = 'Đọc; học tập', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 42, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '读' AND `pinyin_raw` = 'du' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'dúshū', `pinyin_raw` = 'dushu', `meaning_han_viet` = 'Độc Thư', `meaning_vi` = 'Đọc sách; học', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 43, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '读书' AND `pinyin_raw` = 'dushu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'duì', `pinyin_raw` = 'dui', `meaning_han_viet` = 'Đối', `meaning_vi` = 'Đúng; chính xác; đối với', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 44, `hsk_source_label` = '1（4）', `hsk_edition` = '2025', `part_of_speech` = '形、介、（动、量）', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '对' AND `pinyin_raw` = 'dui' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'duìbuqǐ', `pinyin_raw` = 'duibuqi', `meaning_han_viet` = 'Đối Bất Khởi', `meaning_vi` = 'Tôi xin lỗi; xin thứ lỗi; tôi xin tha thứ; làm  thất vọng; không đạt kỳ vọng', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 45, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '对不起' AND `pinyin_raw` = 'duibuqi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'duō', `pinyin_raw` = 'duo', `meaning_han_viet` = 'Đa', `meaning_vi` = 'Nhiều', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 46, `hsk_source_label` = '1（2）', `hsk_edition` = '2025', `part_of_speech` = '形、动、代、（数、副）', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '多' AND `pinyin_raw` = 'duo' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'duōshao', `pinyin_raw` = 'duoshao', `meaning_han_viet` = 'Đa Thiểu', `meaning_vi` = 'Số lượng; mức độ; phần nào', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 47, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '多少' AND `pinyin_raw` = 'duoshao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'è', `pinyin_raw` = 'e', `meaning_han_viet` = 'Ngạ', `meaning_vi` = 'Đói; làm cho đói', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 610, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '95', `updated_at` = NOW() WHERE `hanzi` = '饿' AND `pinyin_raw` = 'e' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'érzi', `pinyin_raw` = 'erzi', `meaning_han_viet` = 'Nhân Tử', `meaning_vi` = 'Con trai', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 48, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '儿子' AND `pinyin_raw` = 'erzi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'èr', `pinyin_raw` = 'er', `meaning_han_viet` = 'Nhị', `meaning_vi` = 'Hai; 2', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 49, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '数', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '二' AND `pinyin_raw` = 'er' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'fàn', `pinyin_raw` = 'fan', `meaning_han_viet` = 'Phạn', `meaning_vi` = 'Cơm đã nấu; bữa ăn', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 50, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '饭' AND `pinyin_raw` = 'fan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'fàndiàn', `pinyin_raw` = 'fandian', `meaning_han_viet` = 'Phạn Điếm', `meaning_vi` = 'Nhà hàng; khách sạn', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 51, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '饭店' AND `pinyin_raw` = 'fandian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'fángjiān', `pinyin_raw` = 'fangjian', `meaning_han_viet` = 'Phòng Gian', `meaning_vi` = 'Phòng', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 52, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '房间' AND `pinyin_raw` = 'fangjian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'fángzi', `pinyin_raw` = 'fangzi', `meaning_han_viet` = 'Phòng Tử', `meaning_vi` = 'Nhà; tòa nhà', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 623, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '95', `updated_at` = NOW() WHERE `hanzi` = '房子' AND `pinyin_raw` = 'fangzi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'fàng', `pinyin_raw` = 'fang', `meaning_han_viet` = 'Phóng', `meaning_vi` = 'Đặt; để; buông; thả', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 624, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '95', `updated_at` = NOW() WHERE `hanzi` = '放' AND `pinyin_raw` = 'fang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'fàngjià', `pinyin_raw` = 'fangjia', `meaning_han_viet` = 'Phóng Giả', `meaning_vi` = 'Nghỉ lễ hoặc kỳ nghỉ', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 625, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '95', `updated_at` = NOW() WHERE `hanzi` = '放假' AND `pinyin_raw` = 'fangjia' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'fàngxué', `pinyin_raw` = 'fangxue', `meaning_han_viet` = 'Phóng Học', `meaning_vi` = 'Tan học', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 627, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '95', `updated_at` = NOW() WHERE `hanzi` = '放学' AND `pinyin_raw` = 'fangxue' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'fēi', `pinyin_raw` = 'fei', `meaning_han_viet` = 'Phi', `meaning_vi` = 'Bay', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 340, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '飞' AND `pinyin_raw` = 'fei' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'fēijī', `pinyin_raw` = 'feiji', `meaning_han_viet` = 'Phi Cơ', `meaning_vi` = 'Máy bay', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 54, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '飞机' AND `pinyin_raw` = 'feiji' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'fēicháng', `pinyin_raw` = 'feichang', `meaning_han_viet` = 'Phi Thường', `meaning_vi` = 'Rất; thực sự; khác thường; phi thường', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 53, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '非常' AND `pinyin_raw` = 'feichang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'fēn', `pinyin_raw` = 'fen', `meaning_han_viet` = 'Phân', `meaning_vi` = 'Phút; điểm; phân chia', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 55, `hsk_source_label` = '1（3）', `hsk_edition` = '2025', `part_of_speech` = '量、（动、名）', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '分' AND `pinyin_raw` = 'fen' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'fēng', `pinyin_raw` = 'feng', `meaning_han_viet` = 'Phong', `meaning_vi` = 'Gió; tin tức', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 629, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '95', `updated_at` = NOW() WHERE `hanzi` = '风' AND `pinyin_raw` = 'feng' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'gānjìng', `pinyin_raw` = 'ganjing', `meaning_han_viet` = 'Can Tịnh', `meaning_vi` = 'Sạch; gọn gàng', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 636, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '95', `updated_at` = NOW() WHERE `hanzi` = '干净' AND `pinyin_raw` = 'ganjing' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'gàn', `pinyin_raw` = 'gan', `meaning_han_viet` = 'Can', `meaning_vi` = 'Làm; khô ráo', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 640, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '95', `updated_at` = NOW() WHERE `hanzi` = '干' AND (`pinyin_raw` = 'gan4' OR `pinyin` COLLATE utf8mb4_bin = 'gàn') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'gāo', `pinyin_raw` = 'gao', `meaning_han_viet` = 'Cao', `meaning_vi` = 'Cao', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 341, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '形、名', `homograph_index` = NULL, `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '高' AND `pinyin_raw` = 'gao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'gāoxìng', `pinyin_raw` = 'gaoxing', `meaning_han_viet` = 'Cao Hưng', `meaning_vi` = 'Vui; vui vẻ', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 57, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '高兴' AND `pinyin_raw` = 'gaoxing' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'gàosu', `pinyin_raw` = 'gaosu', `meaning_han_viet` = 'Cáo Tố', `meaning_vi` = 'Khởi kiện; nộp đơn khiếu nại', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 343, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '告诉' AND `pinyin_raw` = 'gaosu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'gēge', `pinyin_raw` = 'gege', `meaning_han_viet` = 'Ca Ca', `meaning_vi` = 'Anh trai', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 59, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '哥哥' AND `pinyin_raw` = 'gege' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'gē', `pinyin_raw` = 'ge', `meaning_han_viet` = 'Ca', `meaning_vi` = 'Bài hát; hát', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 58, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '歌' AND `pinyin_raw` = 'ge' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'gè', `pinyin_raw` = 'ge', `meaning_han_viet` = 'Cá', `meaning_vi` = 'Cái; quả; con; lượng từ chung', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 60, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '量', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '个' AND `pinyin_raw` = 'ge' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'gěi', `pinyin_raw` = 'gei', `meaning_han_viet` = 'Cấp', `meaning_vi` = 'Cho; đưa cho', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 61, `hsk_source_label` = '1（2）', `hsk_edition` = '2025', `part_of_speech` = '动、（介）', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '给' AND `pinyin_raw` = 'gei' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'gēn', `pinyin_raw` = 'gen', `meaning_han_viet` = 'Cân', `meaning_vi` = 'Cùng; với; theo', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 345, `hsk_source_label` = '2（5）', `hsk_edition` = '2025', `part_of_speech` = '介、连、（名、动）', `homograph_index` = NULL, `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '跟' AND `pinyin_raw` = 'gen' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'gōngzuò', `pinyin_raw` = 'gongzuo', `meaning_han_viet` = 'Công Tác', `meaning_vi` = 'Làm việc; vận hành', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 63, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动、名', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '工作' AND `pinyin_raw` = 'gongzuo' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'guān', `pinyin_raw` = 'guan', `meaning_han_viet` = 'Quan', `meaning_vi` = 'Đóng; tắt; quan hệ', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 652, `hsk_source_label` = '3（5）', `hsk_edition` = '2025', `part_of_speech` = '动、（名）', `homograph_index` = NULL, `source_pdf_page` = '96', `updated_at` = NOW() WHERE `hanzi` = '关' AND `pinyin_raw` = 'guan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'guì', `pinyin_raw` = 'gui', `meaning_han_viet` = 'Quý', `meaning_vi` = 'Đắt; được coi trọng; quý giá', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 65, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '贵' AND `pinyin_raw` = 'gui' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'guó', `pinyin_raw` = 'guo', `meaning_han_viet` = 'Quốc', `meaning_vi` = 'Quốc gia, đất nước', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 66, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '国' AND `pinyin_raw` = 'guo' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'guójiā', `pinyin_raw` = 'guojia', `meaning_han_viet` = 'Quốc Gia', `meaning_vi` = 'Quốc gia; dân tộc; nhà nước', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 658, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '96', `updated_at` = NOW() WHERE `hanzi` = '国家' AND `pinyin_raw` = 'guojia' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'guo', `pinyin_raw` = 'guo', `meaning_han_viet` = 'Quá', `meaning_vi` = 'Trợ từ động thái (từng trải qua)', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 351, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '助', `homograph_index` = NULL, `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '过' AND `pinyin_raw` = 'guo' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'hái', `pinyin_raw` = 'hai', `meaning_han_viet` = 'Hoàn', `meaning_vi` = 'Vẫn; còn; trả lại', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 67, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '还' AND `pinyin_raw` = 'hai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'háishi', `pinyin_raw` = 'haishi', `meaning_han_viet` = 'Hoàn Thị', `meaning_vi` = 'Vẫn; nên', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 352, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '副、连', `homograph_index` = NULL, `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '还是' AND `pinyin_raw` = 'haishi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'háizi', `pinyin_raw` = 'haizi', `meaning_han_viet` = 'Hài Tử', `meaning_vi` = 'Trẻ em', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 68, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '孩子' AND `pinyin_raw` = 'haizi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'Hànyǔ', `pinyin_raw` = 'hanyu', `meaning_han_viet` = 'Hán Ngữ', `meaning_vi` = 'Ngôn ngữ tiếng Trung', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 69, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '汉语' AND `pinyin_raw` = 'hanyu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'Hànzì', `pinyin_raw` = 'hanzi', `meaning_han_viet` = 'Hán Tự', `meaning_vi` = 'Chữ Hán; Nhật: kanji', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 70, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '汉字' AND `pinyin_raw` = 'hanzi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'hǎo', `pinyin_raw` = 'hao', `meaning_han_viet` = 'Hảo', `meaning_vi` = 'Tốt; đẹp; xong', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 71, `hsk_source_label` = '1（2）（4）', `hsk_edition` = '2025', `part_of_speech` = '形、（副）、（动）', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '好' AND `pinyin_raw` = 'hao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'hǎochī', `pinyin_raw` = 'haochi', `meaning_han_viet` = 'Hảo Cật', `meaning_vi` = 'Ngon; ngon miệng', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 72, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '好吃' AND `pinyin_raw` = 'haochi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'hǎokàn', `pinyin_raw` = 'haokan', `meaning_han_viet` = 'Hảo Khán', `meaning_vi` = 'Ưa nhìn; xinh đẹp', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 73, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '好看' AND `pinyin_raw` = 'haokan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'hǎotīng', `pinyin_raw` = 'haoting', `meaning_han_viet` = 'Hảo Dẫn', `meaning_vi` = 'Nghe hay', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 74, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '好听' AND `pinyin_raw` = 'haoting' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'hǎowánr', `pinyin_raw` = 'haowanr', `meaning_han_viet` = 'Hảo Ngoạn Nhi', `meaning_vi` = 'Thú vị, vui, vui nhộn', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 75, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '好玩儿' AND `pinyin_raw` = 'haowanr' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'hào', `pinyin_raw` = 'hao', `meaning_han_viet` = 'Hiệu', `meaning_vi` = 'Số; ngày (trong tháng)', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 76, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名、量', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '号' AND `pinyin_raw` = 'hao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'hē', `pinyin_raw` = 'he', `meaning_han_viet` = 'Húp', `meaning_vi` = 'Uống', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 77, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '喝' AND `pinyin_raw` = 'he' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'hé', `pinyin_raw` = 'he', `meaning_han_viet` = 'Hoà', `meaning_vi` = 'Và; cùng với; hòa thuận', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 78, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '介、连', `homograph_index` = '1', `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '和' AND `pinyin_raw` = 'he' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'hěn', `pinyin_raw` = 'hen', `meaning_han_viet` = 'Ngận', `meaning_vi` = 'Rất; lắm', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 79, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '很' AND `pinyin_raw` = 'hen' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'hòu', `pinyin_raw` = 'hou', `meaning_han_viet` = 'Hậu', `meaning_vi` = 'Sau; phía sau', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 80, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '81', `updated_at` = NOW() WHERE `hanzi` = '后' AND `pinyin_raw` = 'hou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'hòutiān', `pinyin_raw` = 'houtian', `meaning_han_viet` = 'Hậu Thiên', `meaning_vi` = 'Ngày mốt; cuộc sống sau khi sinh', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 673, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '96', `updated_at` = NOW() WHERE `hanzi` = '后天' AND `pinyin_raw` = 'houtian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'huā', `pinyin_raw` = 'hua', `meaning_han_viet` = 'Hoa', `meaning_vi` = 'Hoa, bông hoa', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 358, `hsk_source_label` = '2（6）', `hsk_edition` = '2025', `part_of_speech` = '名、（形）', `homograph_index` = '2', `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '花' AND `pinyin_raw` = 'hua' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'huài', `pinyin_raw` = 'huai', `meaning_han_viet` = 'Hoại', `meaning_vi` = 'Xấu; bị hỏng', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 360, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '88', `updated_at` = NOW() WHERE `hanzi` = '坏' AND `pinyin_raw` = 'huai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'huán', `pinyin_raw` = 'huan', `meaning_han_viet` = 'Hoàn', `meaning_vi` = 'Vẫn; còn; trả lại', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 678, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '96', `updated_at` = NOW() WHERE `hanzi` = '还' AND `pinyin_raw` = 'huan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'huí', `pinyin_raw` = 'hui', `meaning_han_viet` = 'Hồi', `meaning_vi` = 'Xoay vòng; quay lại', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 81, `hsk_source_label` = '1（3）', `hsk_edition` = '2025', `part_of_speech` = '动、（量）', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '回' AND `pinyin_raw` = 'hui' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'huídá', `pinyin_raw` = 'huida', `meaning_han_viet` = 'Hồi Đáp', `meaning_vi` = 'Trả lời; đáp; trả lời; đáp án', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 682, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '97', `updated_at` = NOW() WHERE `hanzi` = '回答' AND `pinyin_raw` = 'huida' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'huílái', `pinyin_raw` = 'huilai', `meaning_han_viet` = 'Hồi Lai', `meaning_vi` = 'Trở về; quay lại', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 361, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '回来' AND `pinyin_raw` = 'huilai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'huíqù', `pinyin_raw` = 'huiqu', `meaning_han_viet` = 'Hồi Khứ', `meaning_vi` = 'Trở về; quay lại', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 362, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '回去' AND `pinyin_raw` = 'huiqu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'huì', `pinyin_raw` = 'hui', `meaning_han_viet` = 'Hội', `meaning_vi` = 'Biết, sẽ, có thể', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 82, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = '1', `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '会' AND `pinyin_raw` = 'hui' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'huǒchē', `pinyin_raw` = 'huoche', `meaning_han_viet` = 'Hoả Xa', `meaning_vi` = 'Tàu hỏa', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 83, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '火车' AND `pinyin_raw` = 'huoche' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jīchǎng', `pinyin_raw` = 'jichang', `meaning_han_viet` = 'Cơ Tràng', `meaning_vi` = 'Sân bay; phi trường; nhà cung cấp dịch vụ cho Shadowsocks hoặc phần mềm tương tự để vượt kiểm duyệt Internet', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 363, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '机场' AND `pinyin_raw` = 'jichang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jīpiào', `pinyin_raw` = 'jipiao', `meaning_han_viet` = 'Cơ Phiếu', `meaning_vi` = 'Vé máy bay; vé hành khách', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 364, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '机票' AND `pinyin_raw` = 'jipiao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jīdàn', `pinyin_raw` = 'jidan', `meaning_han_viet` = 'Kê Đản', `meaning_vi` = 'Trứng; trứng gà', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 84, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '鸡蛋' AND `pinyin_raw` = 'jidan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jǐ', `pinyin_raw` = 'ji', `meaning_han_viet` = 'Cơ', `meaning_vi` = 'Mấy; vài', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 85, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代、数', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '几' AND `pinyin_raw` = 'ji' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jì', `pinyin_raw` = 'ji', `meaning_han_viet` = 'Ký', `meaning_vi` = 'Ghi chép; ghi lại', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 692, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '97', `updated_at` = NOW() WHERE `hanzi` = '记' AND `pinyin_raw` = 'ji' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jìde', `pinyin_raw` = 'jide', `meaning_han_viet` = 'Ký Đắc', `meaning_vi` = 'Nhớ', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 365, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '记得' AND `pinyin_raw` = 'jide' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jiā', `pinyin_raw` = 'jia', `meaning_han_viet` = 'Gia', `meaning_vi` = 'Nhà, gia đình; nhà (chuyên gia)', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 86, `hsk_source_label` = '1（3）', `hsk_edition` = '2025', `part_of_speech` = '名、量、（后缀）', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '家' AND `pinyin_raw` = 'jia' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jiārén', `pinyin_raw` = 'jiaren', `meaning_han_viet` = 'Gia Nhân', `meaning_vi` = 'Thành viên gia đình; người hầu', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 87, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '家人' AND `pinyin_raw` = 'jiaren' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jiān', `pinyin_raw` = 'jian', `meaning_han_viet` = 'Gian', `meaning_vi` = 'Giữa; trong số', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 366, `hsk_source_label` = '2（4）', `hsk_edition` = '2025', `part_of_speech` = '量、（名）', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '间' AND `pinyin_raw` = 'jian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jiàn', `pinyin_raw` = 'jian', `meaning_han_viet` = 'Kiến', `meaning_vi` = 'Gặp; thấy', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 88, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '见' AND `pinyin_raw` = 'jian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jiànmiàn', `pinyin_raw` = 'jianmian', `meaning_han_viet` = 'Kiến Diện', `meaning_vi` = 'Gặp mặt; gặp nhau', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 702, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '97', `updated_at` = NOW() WHERE `hanzi` = '见面' AND `pinyin_raw` = 'jianmian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jiāo', `pinyin_raw` = 'jiao', `meaning_han_viet` = 'Giáo', `meaning_vi` = 'Dạy; giảng dạy', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 367, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '教' AND `pinyin_raw` = 'jiao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jiào', `pinyin_raw` = 'jiao', `meaning_han_viet` = 'Khiếu', `meaning_vi` = 'Kêu; gọi; tên là', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 91, `hsk_source_label` = '1（4）', `hsk_edition` = '2025', `part_of_speech` = '动、（介）', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '叫' AND `pinyin_raw` = 'jiao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jiějie', `pinyin_raw` = 'jiejie', `meaning_han_viet` = 'Tỷ Tỷ', `meaning_vi` = 'Chị gái', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 92, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '姐姐' AND `pinyin_raw` = 'jiejie' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jièshào', `pinyin_raw` = 'jieshao', `meaning_han_viet` = 'Giới Thiệu', `meaning_vi` = 'Giới thiệu; thuyết trình', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 369, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '介绍' AND `pinyin_raw` = 'jieshao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jīnnián', `pinyin_raw` = 'jinnian', `meaning_han_viet` = 'Kim Niên', `meaning_vi` = 'Năm nay', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 93, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '今年' AND `pinyin_raw` = 'jinnian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jīntiān', `pinyin_raw` = 'jintian', `meaning_han_viet` = 'Kim Thiên', `meaning_vi` = 'Hôm nay; thời điểm hiện tại; bây giờ', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 94, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '今天' AND `pinyin_raw` = 'jintian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jìn', `pinyin_raw` = 'jin', `meaning_han_viet` = 'Tiến', `meaning_vi` = 'Vào; tiến vào', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 370, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '进' AND `pinyin_raw` = 'jin' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jìnlái', `pinyin_raw` = 'jinlai', `meaning_han_viet` = 'Tiến Lai', `meaning_vi` = 'Đến; vào', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 372, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '进来' AND `pinyin_raw` = 'jinlai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jìnqù', `pinyin_raw` = 'jinqu', `meaning_han_viet` = 'Tiến Khứ', `meaning_vi` = 'Đi vào', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 373, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '进去' AND `pinyin_raw` = 'jinqu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jiǔ', `pinyin_raw` = 'jiu', `meaning_han_viet` = 'Cửu', `meaning_vi` = 'Chín; 9', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 95, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '数', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '九' AND `pinyin_raw` = 'jiu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'jiù', `pinyin_raw` = 'jiu', `meaning_han_viet` = 'Tựu', `meaning_vi` = 'Thì; liền; ngay', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 376, `hsk_source_label` = '2（7-9）', `hsk_edition` = '2025', `part_of_speech` = '副、（介）', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '就' AND `pinyin_raw` = 'jiu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'juéde', `pinyin_raw` = 'juede', `meaning_han_viet` = 'Giáo Đắc', `meaning_vi` = 'Nghĩ rằng ...; cảm thấy rằng ...; cảm thấy', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 96, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '觉得' AND `pinyin_raw` = 'juede' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'kāi', `pinyin_raw` = 'kai', `meaning_han_viet` = 'Khai', `meaning_vi` = 'Mở; lái (xe); bật', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 97, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '开' AND `pinyin_raw` = 'kai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'kāichē', `pinyin_raw` = 'kaiche', `meaning_han_viet` = 'Khai Xa', `meaning_vi` = 'Lái xe', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 98, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '开车' AND `pinyin_raw` = 'kaiche' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'kāihuì', `pinyin_raw` = 'kaihui', `meaning_han_viet` = 'Khai Hội', `meaning_vi` = 'Tổ chức cuộc họp; tham gia cuộc họp', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 727, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '98', `updated_at` = NOW() WHERE `hanzi` = '开会' AND `pinyin_raw` = 'kaihui' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'kàn', `pinyin_raw` = 'kan', `meaning_han_viet` = 'Khán', `meaning_vi` = 'Nhìn; xem; thăm', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 99, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '看' AND `pinyin_raw` = 'kan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'kànbìng', `pinyin_raw` = 'kanbing', `meaning_han_viet` = 'Khán Bệnh', `meaning_vi` = 'Đi khám bệnh; khám bệnh nhân', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 100, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '看病' AND `pinyin_raw` = 'kanbing' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'kànjiàn', `pinyin_raw` = 'kanjian', `meaning_han_viet` = 'Khán Kiến', `meaning_vi` = 'Nhìn thấy; bắt gặp', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 101, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '看见' AND `pinyin_raw` = 'kanjian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'kǎo', `pinyin_raw` = 'kao', `meaning_han_viet` = 'Khảo', `meaning_vi` = 'Đánh; đập', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 380, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '考' AND `pinyin_raw` = 'kao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'kǎoshì', `pinyin_raw` = 'kaoshi', `meaning_han_viet` = 'Khảo Thí', `meaning_vi` = 'Dự thi; kỳ thi', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 381, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动、名', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '考试' AND `pinyin_raw` = 'kaoshi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'kě', `pinyin_raw` = 'ke', `meaning_han_viet` = 'Khát', `meaning_vi` = 'Khát', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 732, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '98', `updated_at` = NOW() WHERE `hanzi` = '渴' AND `pinyin_raw` = 'ke' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'kè', `pinyin_raw` = 'ke', `meaning_han_viet` = 'Khoá', `meaning_vi` = 'Môn học; khoá học', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 103, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '课' AND `pinyin_raw` = 'ke' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'kèběn', `pinyin_raw` = 'keben', `meaning_han_viet` = 'Khoá Bản', `meaning_vi` = 'Sách giáo khoa', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 736, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '98', `updated_at` = NOW() WHERE `hanzi` = '课本' AND `pinyin_raw` = 'keben' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'kèwén', `pinyin_raw` = 'kewen', `meaning_han_viet` = 'Khoá Văn', `meaning_vi` = 'Bài đọc', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 738, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '98', `updated_at` = NOW() WHERE `hanzi` = '课文' AND `pinyin_raw` = 'kewen' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'kǒu', `pinyin_raw` = 'kou', `meaning_han_viet` = 'Khẩu', `meaning_vi` = 'Miệng; lượng từ cho những thứ có miệng', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 104, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名、量', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '口' AND `pinyin_raw` = 'kou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'kuài', `pinyin_raw` = 'kuai', `meaning_han_viet` = 'Khối', `meaning_vi` = 'Cục; tảng; miếng; lượng từ cho miếng vải, bánh, xà phòng, v.v.', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 105, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '量', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '块' AND `pinyin_raw` = 'kuai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'kuài', `pinyin_raw` = 'kuai', `meaning_han_viet` = 'Khoái', `meaning_vi` = 'Nhanh; sắp sửa', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 384, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '形、副', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '快' AND `pinyin_raw` = 'kuai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'lái', `pinyin_raw` = 'lai', `meaning_han_viet` = 'Lai', `meaning_vi` = 'Đến; tới', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 106, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '来' AND `pinyin_raw` = 'lai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'lǎo', `pinyin_raw` = 'lao', `meaning_han_viet` = 'Lão', `meaning_vi` = 'Già; cũ; lâu năm', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 745, `hsk_source_label` = '3（4）', `hsk_edition` = '2025', `part_of_speech` = '形、前缀、（副）', `homograph_index` = NULL, `source_pdf_page` = '98', `updated_at` = NOW() WHERE `hanzi` = '老' AND `pinyin_raw` = 'lao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'lǎorén', `pinyin_raw` = 'laoren', `meaning_han_viet` = 'Lão Nhân', `meaning_vi` = 'Ông già hoặc bà già; người cao tuổi', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 746, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '98', `updated_at` = NOW() WHERE `hanzi` = '老人' AND `pinyin_raw` = 'laoren' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'lǎoshī', `pinyin_raw` = 'laoshi', `meaning_han_viet` = 'Lão Sư', `meaning_vi` = 'Giáo viên', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 107, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '老师' AND `pinyin_raw` = 'laoshi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'le', `pinyin_raw` = 'le', `meaning_han_viet` = 'Liễu', `meaning_vi` = 'Rồi; đã (trợ từ ngữ khí/thời thái)', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 108, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '助', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '了' AND `pinyin_raw` = 'le' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'lèi', `pinyin_raw` = 'lei', `meaning_han_viet` = 'Luỵ', `meaning_vi` = 'Tích lũy; liên lụy hoặc dính líu', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 388, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '形、动', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '累' AND `pinyin_raw` = 'lei' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'lěng', `pinyin_raw` = 'leng', `meaning_han_viet` = 'Lạnh', `meaning_vi` = 'Lạnh', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 109, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '冷' AND `pinyin_raw` = 'leng' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'lǐ', `pinyin_raw` = 'li', `meaning_han_viet` = 'Lý', `meaning_vi` = 'Trong; bên trong', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 110, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '里' AND `pinyin_raw` = 'li' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'liǎng', `pinyin_raw` = 'liang', `meaning_han_viet` = 'Lưỡng', `meaning_vi` = 'Hai; cả hai', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 111, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '数', `homograph_index` = '1', `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '两' AND `pinyin_raw` = 'liang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'líng', `pinyin_raw` = 'ling', `meaning_han_viet` = 'Linh', `meaning_vi` = 'Không; số không', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 112, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '数', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '零' AND `pinyin_raw` = 'ling' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'liù', `pinyin_raw` = 'liu', `meaning_han_viet` = 'Lục', `meaning_vi` = 'Sáu; 6', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 113, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '数', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '六' AND `pinyin_raw` = 'liu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'lóu', `pinyin_raw` = 'lou', `meaning_han_viet` = 'Lâu', `meaning_vi` = 'Tòa nhà, tầng gác', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 391, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '楼' AND `pinyin_raw` = 'lou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'lù', `pinyin_raw` = 'lu', `meaning_han_viet` = 'Lộ', `meaning_vi` = 'Đường, con đường', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 392, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '路' AND `pinyin_raw` = 'lu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'lùkǒu', `pinyin_raw` = 'lukou', `meaning_han_viet` = 'Lộ Khẩu', `meaning_vi` = 'Giao lộ; ngã tư', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 763, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '99', `updated_at` = NOW() WHERE `hanzi` = '路口' AND `pinyin_raw` = 'lukou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'lùshang', `pinyin_raw` = 'lushang', `meaning_han_viet` = 'Lộ Thướng', `meaning_vi` = 'Trên đường; trên đường; đang đi', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 393, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '路上' AND `pinyin_raw` = 'lushang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'māma', `pinyin_raw` = 'mama', `meaning_han_viet` = 'Má Má', `meaning_vi` = 'Mẹ; má', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 114, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '妈妈' AND `pinyin_raw` = 'mama' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'mǎlù', `pinyin_raw` = 'malu', `meaning_han_viet` = 'Mã Lộ', `meaning_vi` = 'Đường phố; đường', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 765, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '99', `updated_at` = NOW() WHERE `hanzi` = '马路' AND `pinyin_raw` = 'malu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'mǎshàng', `pinyin_raw` = 'mashang', `meaning_han_viet` = 'Mã Thướng', `meaning_vi` = 'Ngay lập tức; ngay tức khắc', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 766, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '99', `updated_at` = NOW() WHERE `hanzi` = '马上' AND `pinyin_raw` = 'mashang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'ma', `pinyin_raw` = 'ma', `meaning_han_viet` = 'Ma', `meaning_vi` = 'Phải không; không (trợ từ nghi vấn)', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 115, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '助', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '吗' AND `pinyin_raw` = 'ma' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'mǎi', `pinyin_raw` = 'mai', `meaning_han_viet` = 'Mãi', `meaning_vi` = 'Mua', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 116, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '买' AND `pinyin_raw` = 'mai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'màn', `pinyin_raw` = 'man', `meaning_han_viet` = 'Mạn', `meaning_vi` = 'Chậm', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 397, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '慢' AND `pinyin_raw` = 'man' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'máng', `pinyin_raw` = 'mang', `meaning_han_viet` = 'Mang', `meaning_vi` = 'Bận rộn; bận', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 118, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形、动', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '忙' AND `pinyin_raw` = 'mang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'máo', `pinyin_raw` = 'mao', `meaning_han_viet` = 'Mao', `meaning_vi` = 'Lông, sợi; hào (tiền)', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 768, `hsk_source_label` = '3（5）', `hsk_edition` = '2025', `part_of_speech` = '量、（名）', `homograph_index` = NULL, `source_pdf_page` = '99', `updated_at` = NOW() WHERE `hanzi` = '毛' AND `pinyin_raw` = 'mao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'méi guānxi', `pinyin_raw` = 'meiguanxi', `meaning_han_viet` = 'Một Quan Hệ', `meaning_vi` = 'Không sao đâu', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 120, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '', `homograph_index` = NULL, `source_pdf_page` = '82', `updated_at` = NOW() WHERE `hanzi` = '没关系' AND (`pinyin_raw` = 'mei guanxi' OR `pinyin_raw` = 'meiguanxi') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'méiyǒu', `pinyin_raw` = 'meiyou', `meaning_han_viet` = 'Một Hữu', `meaning_vi` = 'Không có; không tồn tại', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 122, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动、副', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '没有' AND `pinyin_raw` = 'meiyou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'mèimei', `pinyin_raw` = 'meimei', `meaning_han_viet` = 'Muội Muội', `meaning_vi` = 'Em gái; phụ nữ trẻ', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 123, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '妹妹' AND `pinyin_raw` = 'meimei' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'mén', `pinyin_raw` = 'men', `meaning_han_viet` = 'Môn', `meaning_vi` = 'Cửa; cổng', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 400, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '89', `updated_at` = NOW() WHERE `hanzi` = '门' AND `pinyin_raw` = 'men' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'ménkǒu', `pinyin_raw` = 'menkou', `meaning_han_viet` = 'Môn Khẩu', `meaning_vi` = 'Cửa ra vào; cổng', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 401, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '门口' AND `pinyin_raw` = 'menkou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'ménpiào', `pinyin_raw` = 'menpiao', `meaning_han_viet` = 'Môn Phiếu', `meaning_vi` = 'Vé', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 402, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '门票' AND `pinyin_raw` = 'menpiao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'men', `pinyin_raw` = 'men', `meaning_han_viet` = 'Môn', `meaning_vi` = 'Dùng để chỉ số nhiều cho đại từ và danh từ chỉ người', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 124, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '后缀', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '们' AND (`pinyin_raw` = 'men' OR `pinyin_raw` = 'men (pengyoumen)' OR `pinyin_raw` = 'men(pengyoumen)') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'mǐfàn', `pinyin_raw` = 'mifan', `meaning_han_viet` = 'Mễ Phạn', `meaning_vi` = 'Đã nấu', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 125, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '米饭' AND `pinyin_raw` = 'mifan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'miànbāo', `pinyin_raw` = 'mianbao', `meaning_han_viet` = 'Diện Bao', `meaning_vi` = 'Bánh mì', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 126, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '面包' AND `pinyin_raw` = 'mianbao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'miàntiáor', `pinyin_raw` = 'miantiaor', `meaning_han_viet` = 'Diện Điều Nhi', `meaning_vi` = 'Mì, sợi mì', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 127, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '面条儿' AND `pinyin_raw` = 'miantiaor' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'míngzi', `pinyin_raw` = 'mingzi', `meaning_han_viet` = 'Danh Tự', `meaning_vi` = 'Tên', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 130, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '名字' AND `pinyin_raw` = 'mingzi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'míngbai', `pinyin_raw` = 'mingbai', `meaning_han_viet` = 'Minh Bạch', `meaning_vi` = 'Rõ ràng; hiển nhiên', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 771, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '形、动', `homograph_index` = NULL, `source_pdf_page` = '99', `updated_at` = NOW() WHERE `hanzi` = '明白' AND `pinyin_raw` = 'mingbai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'míngnián', `pinyin_raw` = 'mingnian', `meaning_han_viet` = 'Minh Niên', `meaning_vi` = 'Năm sau', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 128, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '明年' AND `pinyin_raw` = 'mingnian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'míngtiān', `pinyin_raw` = 'mingtian', `meaning_han_viet` = 'Minh Thiên', `meaning_vi` = 'Ngày mai', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 129, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '明天' AND `pinyin_raw` = 'mingtian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'ná', `pinyin_raw` = 'na', `meaning_han_viet` = 'Nã', `meaning_vi` = 'Cầm; lấy', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 405, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '拿' AND `pinyin_raw` = 'na' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nǎ', `pinyin_raw` = 'na', `meaning_han_viet` = 'Nả', `meaning_vi` = 'Nào, cái nào', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 131, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '哪' AND `pinyin_raw` = 'na' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nǎlǐ', `pinyin_raw` = 'nali', `meaning_han_viet` = 'Nả Lý', `meaning_vi` = 'Ở đâu, chỗ nào; đâu có (khiêm tốn)', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 133, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '哪里' AND `pinyin_raw` = 'nali' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nǎr', `pinyin_raw` = 'nar', `meaning_han_viet` = 'Na Nhi', `meaning_vi` = 'Ở đâu, đâu', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 134, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '哪儿' AND `pinyin_raw` = 'nar' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nǎxiē', `pinyin_raw` = 'naxie', `meaning_han_viet` = 'Nả Ta', `meaning_vi` = 'Những cái nào, những ai', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 135, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '哪些' AND `pinyin_raw` = 'naxie' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nà', `pinyin_raw` = 'na', `meaning_han_viet` = 'Na', `meaning_vi` = 'Kia, đó', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 136, `hsk_source_label` = '1（2）', `hsk_edition` = '2025', `part_of_speech` = '代、（连）', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '那' AND `pinyin_raw` = 'na' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nàbiān', `pinyin_raw` = 'nabian', `meaning_han_viet` = 'Na Biên', `meaning_vi` = 'Đằng kia; ở đằng đó', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 137, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '那边' AND `pinyin_raw` = 'nabian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nàlǐ', `pinyin_raw` = 'nali', `meaning_han_viet` = 'Na Lý', `meaning_vi` = 'Ở đó; nơi đó', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 139, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '那里' AND `pinyin_raw` = 'nali' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nàr', `pinyin_raw` = 'nar', `meaning_han_viet` = 'Na Nhi', `meaning_vi` = 'Ở đó', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 140, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '那儿' AND `pinyin_raw` = 'nar' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nàxiē', `pinyin_raw` = 'naxie', `meaning_han_viet` = 'Na Ta', `meaning_vi` = 'Những cái đó', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 141, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '那些' AND `pinyin_raw` = 'naxie' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nǎinai', `pinyin_raw` = 'nainai', `meaning_han_viet` = 'Nãi Nãi', `meaning_vi` = 'Bà; bà chủ nhà', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 409, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '奶奶' AND `pinyin_raw` = 'nainai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nán', `pinyin_raw` = 'nan', `meaning_han_viet` = 'Nam', `meaning_vi` = 'Nam; Nam tước, cấp thấp nhất trong năm cấp bậc quý tộc 五等爵位', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 142, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '男' AND `pinyin_raw` = 'nan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nánháir', `pinyin_raw` = 'nanhair', `meaning_han_viet` = 'Nam Hài Nhi', `meaning_vi` = 'Bé trai, cậu bé, con trai', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 410, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '男孩儿' AND `pinyin_raw` = 'nanhair' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nánpéngyou', `pinyin_raw` = 'nanpengyou', `meaning_han_viet` = 'Nam Bằng Hữu', `meaning_vi` = 'Bạn trai', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 143, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '男朋友' AND `pinyin_raw` = 'nanpengyou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nánrén', `pinyin_raw` = 'nanren', `meaning_han_viet` = 'Nam Nhân', `meaning_vi` = 'Một người đàn ông; một nam giới', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 779, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '99', `updated_at` = NOW() WHERE `hanzi` = '男人' AND `pinyin_raw` = 'nanren' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nánshēng', `pinyin_raw` = 'nansheng', `meaning_han_viet` = 'Nam Sinh', `meaning_vi` = 'Nam sinh; học sinh nam', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 780, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '99', `updated_at` = NOW() WHERE `hanzi` = '男生' AND `pinyin_raw` = 'nansheng' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nán', `pinyin_raw` = 'nan', `meaning_han_viet` = 'Nam', `meaning_vi` = 'Phía nam, phương nam', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 774, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '99', `updated_at` = NOW() WHERE `hanzi` = '南' AND `pinyin_raw` = 'nan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nán', `pinyin_raw` = 'nan', `meaning_han_viet` = 'Nan', `meaning_vi` = 'Khó; nan giải', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 775, `hsk_source_label` = '3（6）', `hsk_edition` = '2025', `part_of_speech` = '形、（动）', `homograph_index` = NULL, `source_pdf_page` = '99', `updated_at` = NOW() WHERE `hanzi` = '难' AND `pinyin_raw` = 'nan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'ne', `pinyin_raw` = 'ne', `meaning_han_viet` = 'Ni', `meaning_vi` = 'Thế; nhỉ; còn... thì sao (trợ từ ngữ khí)', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 144, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '助', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '呢' AND `pinyin_raw` = 'ne' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'néng', `pinyin_raw` = 'neng', `meaning_han_viet` = 'Năng', `meaning_vi` = 'Có thể, khả năng', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 145, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '能' AND `pinyin_raw` = 'neng' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nǐ', `pinyin_raw` = 'ni', `meaning_han_viet` = 'Nễ', `meaning_vi` = 'Bạn', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 146, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '你' AND `pinyin_raw` = 'ni' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nǐmen', `pinyin_raw` = 'nimen', `meaning_han_viet` = 'Nễ Môn', `meaning_vi` = 'Các bạn', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 148, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '你们' AND `pinyin_raw` = 'nimen' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nián', `pinyin_raw` = 'nian', `meaning_han_viet` = 'Niên', `meaning_vi` = 'Năm (thời gian)', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 149, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名、量', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '年' AND `pinyin_raw` = 'nian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nín', `pinyin_raw` = 'nin', `meaning_han_viet` = 'Nâm', `meaning_vi` = 'Bạn', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 150, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '您' AND `pinyin_raw` = 'nin' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'niúnǎi', `pinyin_raw` = 'niunai', `meaning_han_viet` = 'Ngưu Nãi', `meaning_vi` = 'Sữa bò', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 151, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '牛奶' AND `pinyin_raw` = 'niunai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nǚ', `pinyin_raw` = 'nu', `meaning_han_viet` = 'Nữ', `meaning_vi` = 'Nữ; phụ nữ', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 152, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '女' AND `pinyin_raw` = 'nu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nǚ’ér', `pinyin_raw` = 'nuer', `meaning_han_viet` = 'Nữ Nhi', `meaning_vi` = 'Con gái', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 153, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '女儿' AND (`pinyin_raw` = 'nuer' OR `pinyin_raw` = 'nu''er') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nǚháir', `pinyin_raw` = 'nuhair', `meaning_han_viet` = 'Nữ Hài Nhi', `meaning_vi` = 'Bé gái, cô bé, con gái', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 412, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '女孩儿' AND `pinyin_raw` = 'nuhair' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nǚpéngyou', `pinyin_raw` = 'nupengyou', `meaning_han_viet` = 'Nữ Bằng Hữu', `meaning_vi` = 'Bạn gái', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 154, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '女朋友' AND `pinyin_raw` = 'nupengyou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nǚrén', `pinyin_raw` = 'nuren', `meaning_han_viet` = 'Nữ Nhân', `meaning_vi` = 'Phụ nữ', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 787, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '99', `updated_at` = NOW() WHERE `hanzi` = '女人' AND `pinyin_raw` = 'nuren' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'nǚshēng', `pinyin_raw` = 'nusheng', `meaning_han_viet` = 'Nữ Sinh', `meaning_vi` = 'Nữ sinh; học sinh nữ', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 788, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '99', `updated_at` = NOW() WHERE `hanzi` = '女生' AND `pinyin_raw` = 'nusheng' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'pángbiān', `pinyin_raw` = 'pangbian', `meaning_han_viet` = 'Bàng Biên', `meaning_vi` = 'Bên; nơi liền kề', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 413, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '旁边' AND `pinyin_raw` = 'pangbian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'pǎo', `pinyin_raw` = 'pao', `meaning_han_viet` = 'Bào', `meaning_vi` = 'Chạy', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 414, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '跑' AND `pinyin_raw` = 'pao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'péngyou', `pinyin_raw` = 'pengyou', `meaning_han_viet` = 'Bằng Hữu', `meaning_vi` = 'Bạn', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 156, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '朋友' AND `pinyin_raw` = 'pengyou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'piào', `pinyin_raw` = 'piao', `meaning_han_viet` = 'Phiếu', `meaning_vi` = 'Vé; phiếu', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 416, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '票' AND `pinyin_raw` = 'piao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'qī', `pinyin_raw` = 'qi', `meaning_han_viet` = 'Thất', `meaning_vi` = 'Bảy; 7', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 160, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '数', `homograph_index` = NULL, `source_pdf_page` = '83', `updated_at` = NOW() WHERE `hanzi` = '七' AND `pinyin_raw` = 'qi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'qǐ', `pinyin_raw` = 'qi', `meaning_han_viet` = 'Khởi', `meaning_vi` = 'Dậy; khởi đầu; bắt đầu', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 801, `hsk_source_label` = '3（5）', `hsk_edition` = '2025', `part_of_speech` = '动、（量）', `homograph_index` = NULL, `source_pdf_page` = '100', `updated_at` = NOW() WHERE `hanzi` = '起' AND `pinyin_raw` = 'qi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'qǐchuáng', `pinyin_raw` = 'qichuang', `meaning_han_viet` = 'Khởi Sàng', `meaning_vi` = 'Thức dậy; ngủ dậy', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 161, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '起床' AND `pinyin_raw` = 'qichuang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'qǐlái', `pinyin_raw` = 'qilai', `meaning_han_viet` = 'Khởi Lai', `meaning_vi` = 'Đứng lên, dậy; bắt đầu', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 418, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '起来' AND `pinyin_raw` = 'qilai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'qìchē', `pinyin_raw` = 'qiche', `meaning_han_viet` = 'Khí Xa', `meaning_vi` = 'Xe hơi; xe ô tô', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 803, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '100', `updated_at` = NOW() WHERE `hanzi` = '汽车' AND `pinyin_raw` = 'qiche' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'qián', `pinyin_raw` = 'qian', `meaning_han_viet` = 'Tiền', `meaning_vi` = 'Trước; phía trước', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 163, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '前' AND `pinyin_raw` = 'qian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'qiántiān', `pinyin_raw` = 'qiantian', `meaning_han_viet` = 'Tiền Thiên', `meaning_vi` = 'Ngày hôm kia', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 806, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '100', `updated_at` = NOW() WHERE `hanzi` = '前天' AND `pinyin_raw` = 'qiantian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'qián', `pinyin_raw` = 'qian', `meaning_han_viet` = 'Tiền', `meaning_vi` = 'Tiền, tiền bạc', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 164, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '钱' AND `pinyin_raw` = 'qian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'qǐng', `pinyin_raw` = 'qing', `meaning_han_viet` = 'Thỉnh', `meaning_vi` = 'Mời; mời mọc', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 165, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '请' AND `pinyin_raw` = 'qing' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'qǐngjià', `pinyin_raw` = 'qingjia', `meaning_han_viet` = 'Thỉnh Giả', `meaning_vi` = 'Xin nghỉ phép', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 808, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '100', `updated_at` = NOW() WHERE `hanzi` = '请假' AND `pinyin_raw` = 'qingjia' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'qǐngwèn', `pinyin_raw` = 'qingwen', `meaning_han_viet` = 'Thỉnh Vấn', `meaning_vi` = 'Xin hỏi, cho hỏi', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 166, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '请问' AND `pinyin_raw` = 'qingwen' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'qiú', `pinyin_raw` = 'qiu', `meaning_han_viet` = 'Cầu', `meaning_vi` = 'Quả bóng; hình cầu', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 421, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '球' AND `pinyin_raw` = 'qiu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'qù', `pinyin_raw` = 'qu', `meaning_han_viet` = 'Khứ', `meaning_vi` = 'Đi; đi đến', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 167, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '去' AND `pinyin_raw` = 'qu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'qùnián', `pinyin_raw` = 'qunian', `meaning_han_viet` = 'Khứ Niên', `meaning_vi` = 'Năm ngoái', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 168, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '去年' AND `pinyin_raw` = 'qunian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'rè', `pinyin_raw` = 're', `meaning_han_viet` = 'Nhiệt', `meaning_vi` = 'Nóng; nhiệt tình', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 169, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '热' AND `pinyin_raw` = 're' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'rén', `pinyin_raw` = 'ren', `meaning_han_viet` = 'Nhân', `meaning_vi` = 'Người; mọi người', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 170, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '人' AND `pinyin_raw` = 'ren' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'rènshi', `pinyin_raw` = 'renshi', `meaning_han_viet` = 'Nhận Thức', `meaning_vi` = 'Biết; nhận ra', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 171, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '认识' AND `pinyin_raw` = 'renshi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'rènzhēn', `pinyin_raw` = 'renzhen', `meaning_han_viet` = 'Nhận Chân', `meaning_vi` = 'Tận tâm; nghiêm túc', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 817, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '100', `updated_at` = NOW() WHERE `hanzi` = '认真' AND `pinyin_raw` = 'renzhen' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'rì', `pinyin_raw` = 'ri', `meaning_han_viet` = 'Nhật', `meaning_vi` = 'Ngày; mặt trời', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 172, `hsk_source_label` = '1（4）', `hsk_edition` = '2025', `part_of_speech` = '量、（名）', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '日' AND `pinyin_raw` = 'ri' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'ròu', `pinyin_raw` = 'rou', `meaning_han_viet` = 'Nhục', `meaning_vi` = 'Thịt; thịt quả', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 423, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '肉' AND `pinyin_raw` = 'rou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'sān', `pinyin_raw` = 'san', `meaning_han_viet` = 'Tam', `meaning_vi` = 'Số ba, 3', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 173, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '数', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '三' AND `pinyin_raw` = 'san' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shān', `pinyin_raw` = 'shan', `meaning_han_viet` = 'Sơn', `meaning_vi` = 'Núi, ngọn núi', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 823, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '100', `updated_at` = NOW() WHERE `hanzi` = '山' AND `pinyin_raw` = 'shan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shāngchǎng', `pinyin_raw` = 'shangchang', `meaning_han_viet` = 'Thương Tràng', `meaning_vi` = 'Trung tâm mua sắm; trung tâm thương mại', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 424, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '商场' AND `pinyin_raw` = 'shangchang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shāngdiàn', `pinyin_raw` = 'shangdian', `meaning_han_viet` = 'Thương Điếm', `meaning_vi` = 'Cửa hàng; tiệm', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 174, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '商店' AND `pinyin_raw` = 'shangdian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shàng', `pinyin_raw` = 'shang', `meaning_han_viet` = 'Thướng', `meaning_vi` = 'Lên; trên; đi làm; vào học', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 175, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名、动', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '上' AND `pinyin_raw` = 'shang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shàngbān', `pinyin_raw` = 'shangban', `meaning_han_viet` = 'Thướng Ban', `meaning_vi` = 'Đi làm; đi trực', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 176, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '上班' AND `pinyin_raw` = 'shangban' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shàngkè', `pinyin_raw` = 'shangke', `meaning_han_viet` = 'Thướng Khoá', `meaning_vi` = 'Đi học; tham dự lớp', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 177, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '上课' AND `pinyin_raw` = 'shangke' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shàngwǎng', `pinyin_raw` = 'shangwang', `meaning_han_viet` = 'Thướng Võng', `meaning_vi` = 'Lên mạng; kết nối Internet', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 428, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '上网' AND `pinyin_raw` = 'shangwang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shàngwǔ', `pinyin_raw` = 'shangwu', `meaning_han_viet` = 'Thướng Ngọ', `meaning_vi` = 'Buổi sáng', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 178, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '上午' AND `pinyin_raw` = 'shangwu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shàngxué', `pinyin_raw` = 'shangxue', `meaning_han_viet` = 'Thướng Học', `meaning_vi` = 'Đi học; theo học', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 179, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '上学' AND `pinyin_raw` = 'shangxue' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shǎo', `pinyin_raw` = 'shao', `meaning_han_viet` = 'Thiểu', `meaning_vi` = 'Ít; thiếu', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 180, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形、动', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '少' AND `pinyin_raw` = 'shao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shéi/shuí', `pinyin_raw` = 'shei/shui', `meaning_han_viet` = 'Thuỳ', `meaning_vi` = 'Ai, người nào', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 181, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '谁' AND `pinyin_raw` = 'shei/shui' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shēntǐ', `pinyin_raw` = 'shenti', `meaning_han_viet` = 'Thân Thể', `meaning_vi` = 'Cơ thể; sức khỏe', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 429, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '身体' AND `pinyin_raw` = 'shenti' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shénme', `pinyin_raw` = 'shenme', `meaning_han_viet` = 'Thậm Yêu', `meaning_vi` = 'Gì, cái gì', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 182, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '什么' AND `pinyin_raw` = 'shenme' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shēngbìng', `pinyin_raw` = 'shengbing', `meaning_han_viet` = 'Sinh Bệnh', `meaning_vi` = 'Bị ốm', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 183, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '生病' AND `pinyin_raw` = 'shengbing' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shēngqì', `pinyin_raw` = 'shengqi', `meaning_han_viet` = 'Sinh Khí', `meaning_vi` = 'Nổi giận; tức giận; sinh khí; sức sống', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 830, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '100', `updated_at` = NOW() WHERE `hanzi` = '生气' AND `pinyin_raw` = 'shengqi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shēngrì', `pinyin_raw` = 'shengri', `meaning_han_viet` = 'Sinh Nhật', `meaning_vi` = 'Sinh nhật', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 430, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '生日' AND `pinyin_raw` = 'shengri' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shí', `pinyin_raw` = 'shi', `meaning_han_viet` = 'Thập', `meaning_vi` = 'Mười; 10', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 184, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '数', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '十' AND `pinyin_raw` = 'shi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shíhou', `pinyin_raw` = 'shihou', `meaning_han_viet` = 'Thời Hậu', `meaning_vi` = 'Thời gian; khoảng thời gian', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 185, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '时候' AND `pinyin_raw` = 'shihou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shíjiān', `pinyin_raw` = 'shijian', `meaning_han_viet` = 'Thời Gian', `meaning_vi` = 'Thời gian', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 186, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '时间' AND `pinyin_raw` = 'shijian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shì', `pinyin_raw` = 'shi', `meaning_han_viet` = 'Sự', `meaning_vi` = 'Sự việc; điều', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 187, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '事' AND `pinyin_raw` = 'shi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shì', `pinyin_raw` = 'shi', `meaning_han_viet` = 'Thí', `meaning_vi` = 'Thử; thí nghiệm', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 833, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '100', `updated_at` = NOW() WHERE `hanzi` = '试' AND `pinyin_raw` = 'shi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shì', `pinyin_raw` = 'shi', `meaning_han_viet` = 'Thị', `meaning_vi` = 'Là; đúng; phải; thật', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 188, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '是' AND `pinyin_raw` = 'shi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shǒu', `pinyin_raw` = 'shou', `meaning_han_viet` = 'Thủ', `meaning_vi` = 'Tay; cầm', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 433, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '手' AND `pinyin_raw` = 'shou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shǒujī', `pinyin_raw` = 'shouji', `meaning_han_viet` = 'Thủ Cơ', `meaning_vi` = 'Điện thoại di động', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 189, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '手机' AND `pinyin_raw` = 'shouji' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shū', `pinyin_raw` = 'shu', `meaning_han_viet` = 'Thư', `meaning_vi` = 'Sách, cuốn sách', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 190, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '书' AND `pinyin_raw` = 'shu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shūbāo', `pinyin_raw` = 'shubao', `meaning_han_viet` = 'Thư Bao', `meaning_vi` = 'Cặp sách; cặp đeo lưng', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 435, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '书包' AND `pinyin_raw` = 'shubao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shūdiàn', `pinyin_raw` = 'shudian', `meaning_han_viet` = 'Thư Điếm', `meaning_vi` = 'Nhà sách', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 191, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '书店' AND `pinyin_raw` = 'shudian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shù', `pinyin_raw` = 'shu', `meaning_han_viet` = 'Thụ', `meaning_vi` = 'Cây; trồng', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 842, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '101', `updated_at` = NOW() WHERE `hanzi` = '树' AND `pinyin_raw` = 'shu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shuǐ', `pinyin_raw` = 'shui', `meaning_han_viet` = 'Thuỷ', `meaning_vi` = 'Nước', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 192, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '水' AND `pinyin_raw` = 'shui' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shuǐguǒ', `pinyin_raw` = 'shuiguo', `meaning_han_viet` = 'Thuỷ Quả', `meaning_vi` = 'Trái cây', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 193, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '水果' AND `pinyin_raw` = 'shuiguo' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shuì', `pinyin_raw` = 'shui', `meaning_han_viet` = 'Thuỵ', `meaning_vi` = 'Ngủ; nằm xuống', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 194, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '睡' AND `pinyin_raw` = 'shui' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shuìjiào', `pinyin_raw` = 'shuijiao', `meaning_han_viet` = 'Thuỵ Giáo', `meaning_vi` = 'Đi ngủ; ngủ', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 195, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '睡觉' AND `pinyin_raw` = 'shuijiao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shuō', `pinyin_raw` = 'shuo', `meaning_han_viet` = 'Thuyết', `meaning_vi` = 'Nói', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 196, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '说' AND `pinyin_raw` = 'shuo' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'shuōhuà', `pinyin_raw` = 'shuohua', `meaning_han_viet` = 'Thuyết Thoại', `meaning_vi` = 'Nói; trò chuyện', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 197, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '说话' AND `pinyin_raw` = 'shuohua' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'sì', `pinyin_raw` = 'si', `meaning_han_viet` = 'Tứ', `meaning_vi` = 'Bốn; 4', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 198, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '数', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '四' AND `pinyin_raw` = 'si' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'sòng', `pinyin_raw` = 'song', `meaning_han_viet` = 'Tống', `meaning_vi` = 'Gửi; giao; truyền; tặng', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 437, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '90', `updated_at` = NOW() WHERE `hanzi` = '送' AND `pinyin_raw` = 'song' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'suì', `pinyin_raw` = 'sui', `meaning_han_viet` = 'Tuế', `meaning_vi` = 'Tuổi', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 199, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '量', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '岁' AND `pinyin_raw` = 'sui' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'tā', `pinyin_raw` = 'ta', `meaning_han_viet` = 'Tha', `meaning_vi` = 'Anh ấy; ông ấy; khác', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 200, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '84', `updated_at` = NOW() WHERE `hanzi` = '他' AND `pinyin_raw` = 'ta' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'tāmen', `pinyin_raw` = 'tamen', `meaning_han_viet` = 'Tha Môn', `meaning_vi` = 'Họ; bọn họ', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 203, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '他们' AND `pinyin_raw` = 'tamen' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'tā', `pinyin_raw` = 'ta', `meaning_han_viet` = 'Tha', `meaning_vi` = 'Cô ấy', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 202, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '她' AND `pinyin_raw` = 'ta' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'tāmen', `pinyin_raw` = 'tamen', `meaning_han_viet` = 'Tha Môn', `meaning_vi` = 'Họ; các cô ấy', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 205, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '她们' AND `pinyin_raw` = 'tamen' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'tài', `pinyin_raw` = 'tai', `meaning_han_viet` = 'Thái', `meaning_vi` = 'Quá; lắm', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 206, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '太' AND `pinyin_raw` = 'tai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'tiān', `pinyin_raw` = 'tian', `meaning_han_viet` = 'Thiên', `meaning_vi` = 'Ngày; trời', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 207, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名、量', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '天' AND `pinyin_raw` = 'tian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'tiānqì', `pinyin_raw` = 'tianqi', `meaning_han_viet` = 'Thiên Khí', `meaning_vi` = 'Thời tiết', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 208, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '天气' AND `pinyin_raw` = 'tianqi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'tīng', `pinyin_raw` = 'ting', `meaning_han_viet` = 'Dẫn', `meaning_vi` = 'Nghe', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 209, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '听' AND `pinyin_raw` = 'ting' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'tīngjiàn', `pinyin_raw` = 'tingjian', `meaning_han_viet` = 'Dẫn Kiến', `meaning_vi` = 'Nghe thấy', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 210, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '听见' AND `pinyin_raw` = 'tingjian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'tóngxué', `pinyin_raw` = 'tongxue', `meaning_han_viet` = 'Đồng Học', `meaning_vi` = 'Học cùng trường; bạn học', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 211, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '同学' AND `pinyin_raw` = 'tongxue' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'túshūguǎn', `pinyin_raw` = 'tushuguan', `meaning_han_viet` = 'Đồ Thư Quán', `meaning_vi` = 'Thư viện', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 863, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '101', `updated_at` = NOW() WHERE `hanzi` = '图书馆' AND `pinyin_raw` = 'tushuguan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'wài', `pinyin_raw` = 'wai', `meaning_han_viet` = 'Ngoại', `meaning_vi` = 'Bên ngoài; thêm vào', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 212, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '外' AND `pinyin_raw` = 'wai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'wàibian', `pinyin_raw` = 'waibian', `meaning_han_viet` = 'Ngoại Biên', `meaning_vi` = 'Bên ngoài; bề mặt ngoài', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 213, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '外边' AND `pinyin_raw` = 'waibian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'wàiguó', `pinyin_raw` = 'waiguo', `meaning_han_viet` = 'Ngoại Quốc', `meaning_vi` = 'Nước ngoài', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 446, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '91', `updated_at` = NOW() WHERE `hanzi` = '外国' AND `pinyin_raw` = 'waiguo' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'wàiyǔ', `pinyin_raw` = 'waiyu', `meaning_han_viet` = 'Ngoại Ngữ', `meaning_vi` = 'Ngoại ngữ, tiếng nước ngoài', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 867, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '101', `updated_at` = NOW() WHERE `hanzi` = '外语' AND `pinyin_raw` = 'waiyu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'wǎn', `pinyin_raw` = 'wan', `meaning_han_viet` = 'Vãn', `meaning_vi` = 'Buổi tối; đêm', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 215, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '晚' AND `pinyin_raw` = 'wan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'wǎnfàn', `pinyin_raw` = 'wanfan', `meaning_han_viet` = 'Vãn Phạn', `meaning_vi` = 'Bữa tối; cơm tối', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 216, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '晚饭' AND `pinyin_raw` = 'wanfan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'wǎnshang', `pinyin_raw` = 'wanshang', `meaning_han_viet` = 'Vãn Thướng', `meaning_vi` = 'Buổi tối; đêm', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 217, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '晚上' AND `pinyin_raw` = 'wanshang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'wǎngshang', `pinyin_raw` = 'wangshang', `meaning_han_viet` = 'Võng Thướng', `meaning_vi` = 'Trực tuyến', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 451, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '91', `updated_at` = NOW() WHERE `hanzi` = '网上' AND (`pinyin_raw` = 'wang shang' OR `pinyin_raw` = 'wangshang') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'wàng', `pinyin_raw` = 'wang', `meaning_han_viet` = 'Vong', `meaning_vi` = 'Quên; bỏ qua', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 452, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '91', `updated_at` = NOW() WHERE `hanzi` = '忘' AND `pinyin_raw` = 'wang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'wàngjì', `pinyin_raw` = 'wangji', `meaning_han_viet` = 'Vong Ký', `meaning_vi` = 'Quên', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 874, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '101', `updated_at` = NOW() WHERE `hanzi` = '忘记' AND `pinyin_raw` = 'wangji' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'wèn', `pinyin_raw` = 'wen', `meaning_han_viet` = 'Vấn', `meaning_vi` = 'Hỏi', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 219, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '问' AND `pinyin_raw` = 'wen' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'wǒ', `pinyin_raw` = 'wo', `meaning_han_viet` = 'Ngã', `meaning_vi` = 'Tôi; mình; của tôi', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 221, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '我' AND `pinyin_raw` = 'wo' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'wǒmen', `pinyin_raw` = 'women', `meaning_han_viet` = 'Ngã Môn', `meaning_vi` = 'Chúng tôi; chúng ta; bản thân chúng ta; của chúng tôi', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 222, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '我们' AND `pinyin_raw` = 'women' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'wǔ', `pinyin_raw` = 'wu', `meaning_han_viet` = 'Ngũ', `meaning_vi` = 'Năm; 5', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 223, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '数', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '五' AND `pinyin_raw` = 'wu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'wǔfàn', `pinyin_raw` = 'wufan', `meaning_han_viet` = 'Ngọ Phạn', `meaning_vi` = 'Bữa trưa', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 224, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '午饭' AND `pinyin_raw` = 'wufan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xī', `pinyin_raw` = 'xi', `meaning_han_viet` = 'Tây', `meaning_vi` = 'Phương Tây; tiếng Tây Ban Nha', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 880, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '101', `updated_at` = NOW() WHERE `hanzi` = '西' AND `pinyin_raw` = 'xi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xǐ', `pinyin_raw` = 'xi', `meaning_han_viet` = 'Tẩy', `meaning_vi` = 'Rửa; tắm; rửa ảnh', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 456, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '91', `updated_at` = NOW() WHERE `hanzi` = '洗' AND `pinyin_raw` = 'xi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xǐshǒujiān', `pinyin_raw` = 'xishoujian', `meaning_han_viet` = 'Tẩy Thủ Gian', `meaning_vi` = 'Nhà vệ sinh; phòng vệ sinh', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 457, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '91', `updated_at` = NOW() WHERE `hanzi` = '洗手间' AND `pinyin_raw` = 'xishoujian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xǐhuan', `pinyin_raw` = 'xihuan', `meaning_han_viet` = 'Hỷ Hoan', `meaning_vi` = 'Thích; ưa thích', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 225, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '喜欢' AND `pinyin_raw` = 'xihuan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xià', `pinyin_raw` = 'xia', `meaning_han_viet` = 'Hạ', `meaning_vi` = 'Dưới; xuống; tan làm; tan học', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 226, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名、动、量', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '下' AND `pinyin_raw` = 'xia' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xiàbān', `pinyin_raw` = 'xiaban', `meaning_han_viet` = 'Hạ Ban', `meaning_vi` = 'Tan làm; tan ca', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 228, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '下班' AND `pinyin_raw` = 'xiaban' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xiàkè', `pinyin_raw` = 'xiake', `meaning_han_viet` = 'Hạ Khoá', `meaning_vi` = 'Tan học; ra khỏi lớp', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 229, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '下课' AND `pinyin_raw` = 'xiake' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xiàwǔ', `pinyin_raw` = 'xiawu', `meaning_han_viet` = 'Hạ Ngọ', `meaning_vi` = 'Buổi chiều; p.m.', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 230, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '下午' AND `pinyin_raw` = 'xiawu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xià yǔ', `pinyin_raw` = 'xiayu', `meaning_han_viet` = 'Hạ Vũ', `meaning_vi` = 'Trời mưa', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 227, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '下雨' AND (`pinyin_raw` = 'xia yu' OR `pinyin_raw` = 'xiayu') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xiān', `pinyin_raw` = 'xian', `meaning_han_viet` = 'Tiên', `meaning_vi` = 'Trước; tiên quyết', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 890, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '102', `updated_at` = NOW() WHERE `hanzi` = '先' AND `pinyin_raw` = 'xian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xiānsheng', `pinyin_raw` = 'xiansheng', `meaning_han_viet` = 'Tiên Sinh', `meaning_vi` = 'Giáo viên; quý ông; ngài; ông', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 231, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '先生' AND `pinyin_raw` = 'xiansheng' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xiànzài', `pinyin_raw` = 'xianzai', `meaning_han_viet` = 'Hiện Tại', `meaning_vi` = 'Bây giờ; hiện tại', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 232, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '现在' AND `pinyin_raw` = 'xianzai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xiǎng', `pinyin_raw` = 'xiang', `meaning_han_viet` = 'Tưởng', `meaning_vi` = 'Nghĩ; muốn; nhớ', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 233, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '想' AND `pinyin_raw` = 'xiang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xiǎo', `pinyin_raw` = 'xiao', `meaning_han_viet` = 'Tiểu', `meaning_vi` = 'Nhỏ; bé', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 234, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形、前缀', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '小' AND `pinyin_raw` = 'xiao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xiǎoháir', `pinyin_raw` = 'xiaohair', `meaning_han_viet` = 'Tiểu Hài Nhi', `meaning_vi` = 'Trẻ con, đứa trẻ, em bé', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 461, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '91', `updated_at` = NOW() WHERE `hanzi` = '小孩儿' AND `pinyin_raw` = 'xiaohair' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xiǎopéngyǒu', `pinyin_raw` = 'xiaopengyou', `meaning_han_viet` = 'Tiểu Bằng Hữu', `meaning_vi` = 'Trẻ em', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 235, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '小朋友' AND `pinyin_raw` = 'xiaopengyou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xiǎoshí', `pinyin_raw` = 'xiaoshi', `meaning_han_viet` = 'Tiểu Thời', `meaning_vi` = 'Giờ, tiếng đồng hồ', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 236, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '小时' AND `pinyin_raw` = 'xiaoshi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xiǎoxué', `pinyin_raw` = 'xiaoxue', `meaning_han_viet` = 'Tiểu Học', `meaning_vi` = 'Trường tiểu học; trường cấp một', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 237, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '小学' AND `pinyin_raw` = 'xiaoxue' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xiǎoxuéshēng', `pinyin_raw` = 'xiaoxuesheng', `meaning_han_viet` = 'Tiểu Học Sinh', `meaning_vi` = 'Học sinh tiểu học; trẻ em đi học', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 238, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '小学生' AND `pinyin_raw` = 'xiaoxuesheng' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xiào', `pinyin_raw` = 'xiao', `meaning_han_viet` = 'Tiếu', `meaning_vi` = 'Cười, mỉm cười', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 463, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '91', `updated_at` = NOW() WHERE `hanzi` = '笑' AND `pinyin_raw` = 'xiao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xiě', `pinyin_raw` = 'xie', `meaning_han_viet` = 'Tả', `meaning_vi` = 'Viết', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 240, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '85', `updated_at` = NOW() WHERE `hanzi` = '写' AND `pinyin_raw` = 'xie' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xièxie', `pinyin_raw` = 'xiexie', `meaning_han_viet` = 'Tạ Tạ', `meaning_vi` = 'Cảm ơn; cảm ơn bạn', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 241, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '谢谢' AND `pinyin_raw` = 'xiexie' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xīn', `pinyin_raw` = 'xin', `meaning_han_viet` = 'Tân', `meaning_vi` = 'Mới', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 242, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '新' AND `pinyin_raw` = 'xin' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xīnnián', `pinyin_raw` = 'xinnian', `meaning_han_viet` = 'Tân Niên', `meaning_vi` = 'Năm mới, tết', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 903, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '102', `updated_at` = NOW() WHERE `hanzi` = '新年' AND `pinyin_raw` = 'xinnian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xīngqī', `pinyin_raw` = 'xingqi', `meaning_han_viet` = 'Tinh Kỳ', `meaning_vi` = 'Tuần; ngày trong tuần', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 243, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '星期' AND `pinyin_raw` = 'xingqi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xīngqīrì', `pinyin_raw` = 'xingqiri', `meaning_han_viet` = 'Tinh Kỳ Nhật', `meaning_vi` = 'Chủ nhật', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 244, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '星期日' AND `pinyin_raw` = 'xingqiri' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xīngqītiān', `pinyin_raw` = 'xingqitian', `meaning_han_viet` = 'Tinh Kỳ Thiên', `meaning_vi` = 'Chủ Nhật', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 245, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '星期天' AND `pinyin_raw` = 'xingqitian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xíng', `pinyin_raw` = 'xing', `meaning_han_viet` = 'Hàng', `meaning_vi` = 'Được; đi; thực hiện', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 908, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '动、形', `homograph_index` = NULL, `source_pdf_page` = '102', `updated_at` = NOW() WHERE `hanzi` = '行' AND `pinyin_raw` = 'xing' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xiūxi', `pinyin_raw` = 'xiuxi', `meaning_han_viet` = 'Hưu Tức', `meaning_vi` = 'Nghỉ; nghỉ ngơi', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 246, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '休息' AND `pinyin_raw` = 'xiuxi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xué', `pinyin_raw` = 'xue', `meaning_han_viet` = 'Học', `meaning_vi` = 'Học; bắt chước', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 247, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '学' AND `pinyin_raw` = 'xue' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xuéshēng', `pinyin_raw` = 'xuesheng', `meaning_han_viet` = 'Học Sinh', `meaning_vi` = 'Học sinh; trẻ đi học', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 248, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '学生' AND `pinyin_raw` = 'xuesheng' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xuéxí', `pinyin_raw` = 'xuexi', `meaning_han_viet` = 'Học Tập', `meaning_vi` = 'Học; tìm hiểu', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 249, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '学习' AND `pinyin_raw` = 'xuexi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'xuéxiào', `pinyin_raw` = 'xuexiao', `meaning_han_viet` = 'Học Hiệu', `meaning_vi` = 'Trường học, trường', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 250, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '学校' AND `pinyin_raw` = 'xuexiao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yào', `pinyin_raw` = 'yao', `meaning_han_viet` = 'Yêu', `meaning_vi` = 'Muốn; cần; phải', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 252, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '要' AND `pinyin_raw` = 'yao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yéye', `pinyin_raw` = 'yeye', `meaning_han_viet` = 'Gia Gia', `meaning_vi` = 'Ông nội; ông bên nội', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 470, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '91', `updated_at` = NOW() WHERE `hanzi` = '爷爷' AND `pinyin_raw` = 'yeye' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yě', `pinyin_raw` = 'ye', `meaning_han_viet` = 'Dã', `meaning_vi` = 'Cũng, cũng vậy', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 253, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '也' AND `pinyin_raw` = 'ye' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yè', `pinyin_raw` = 'ye', `meaning_han_viet` = 'Hiệt', `meaning_vi` = 'Đầu', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 921, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '量', `homograph_index` = NULL, `source_pdf_page` = '103', `updated_at` = NOW() WHERE `hanzi` = '页' AND `pinyin_raw` = 'ye' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yī', `pinyin_raw` = 'yi', `meaning_han_viet` = 'Nhất', `meaning_vi` = 'Một; đơn', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 254, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '数', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '一' AND `pinyin_raw` = 'yi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yīfu', `pinyin_raw` = 'yifu', `meaning_han_viet` = 'Y Phục', `meaning_vi` = 'Quần áo', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 255, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '衣服' AND `pinyin_raw` = 'yifu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yīshēng', `pinyin_raw` = 'yisheng', `meaning_han_viet` = 'Y Sinh', `meaning_vi` = 'Bác sĩ', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 256, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '医生' AND `pinyin_raw` = 'yisheng' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yīyuàn', `pinyin_raw` = 'yiyuan', `meaning_han_viet` = 'Y Viện', `meaning_vi` = 'Bệnh viện', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 257, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '医院' AND `pinyin_raw` = 'yiyuan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yíbàn', `pinyin_raw` = 'yiban', `meaning_han_viet` = 'Nhất Bán', `meaning_vi` = 'Một nửa', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 258, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '数', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '一半' AND `pinyin_raw` = 'yiban' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yíhuìr', `pinyin_raw` = 'yihuir', `meaning_han_viet` = 'Nhất Hội Nhi', `meaning_vi` = 'Một lúc; một thời gian', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 471, `hsk_source_label` = '2（3）', `hsk_edition` = '2025', `part_of_speech` = '数量、（副）', `homograph_index` = NULL, `source_pdf_page` = '91', `updated_at` = NOW() WHERE `hanzi` = '一会儿' AND `pinyin_raw` = 'yihuir' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yíkuàir', `pinyin_raw` = 'yikuair', `meaning_han_viet` = 'Nhất Khối Nhi', `meaning_vi` = 'Cùng nhau, cùng một nơi', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 924, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名、副', `homograph_index` = NULL, `source_pdf_page` = '103', `updated_at` = NOW() WHERE `hanzi` = '一块儿' AND `pinyin_raw` = 'yikuair' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yíyàng', `pinyin_raw` = 'yiyang', `meaning_han_viet` = 'Nhất Dạng', `meaning_vi` = 'Giống; như', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 925, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '103', `updated_at` = NOW() WHERE `hanzi` = '一样' AND `pinyin_raw` = 'yiyang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yìbiān', `pinyin_raw` = 'yibian', `meaning_han_viet` = 'Nhất Biên', `meaning_vi` = 'Một bên; mỗi bên', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 933, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '103', `updated_at` = NOW() WHERE `hanzi` = '一边' AND `pinyin_raw` = 'yibian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yìdiǎnr', `pinyin_raw` = 'yidianr', `meaning_han_viet` = 'Nhất Điểm Nhi', `meaning_vi` = 'Một chút, một ít', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 261, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '数量', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '一点儿' AND `pinyin_raw` = 'yidianr' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yìqǐ', `pinyin_raw` = 'yiqi', `meaning_han_viet` = 'Nhất Khởi', `meaning_vi` = 'Ở cùng một nơi; cùng nhau', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 473, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '91', `updated_at` = NOW() WHERE `hanzi` = '一起' AND `pinyin_raw` = 'yiqi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yìxiē', `pinyin_raw` = 'yixie', `meaning_han_viet` = 'Nhất Ta', `meaning_vi` = 'Một số; một vài', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 262, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '数量', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '一些' AND `pinyin_raw` = 'yixie' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yòng', `pinyin_raw` = 'yong', `meaning_han_viet` = 'Dụng', `meaning_vi` = 'Dùng; sử dụng', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 941, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '103', `updated_at` = NOW() WHERE `hanzi` = '用' AND `pinyin_raw` = 'yong' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yǒu', `pinyin_raw` = 'you', `meaning_han_viet` = 'Hữu', `meaning_vi` = 'Có', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 263, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '有' AND `pinyin_raw` = 'you' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yǒude', `pinyin_raw` = 'youde', `meaning_han_viet` = 'Hữu Đích', `meaning_vi` = 'Một số', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 264, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '有的' AND `pinyin_raw` = 'youde' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yǒumíng', `pinyin_raw` = 'youming', `meaning_han_viet` = 'Hữu Danh', `meaning_vi` = 'Nổi tiếng; được biết đến', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 947, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '103', `updated_at` = NOW() WHERE `hanzi` = '有名' AND `pinyin_raw` = 'youming' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yǒuxiē', `pinyin_raw` = 'youxie', `meaning_han_viet` = 'Hữu Ta', `meaning_vi` = 'Một số; hơi', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 266, `hsk_source_label` = '1（3）', `hsk_edition` = '2025', `part_of_speech` = '代、（副）', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '有些' AND (`pinyin_raw` = 'you(yi)xie' OR `pinyin_raw` = 'youxie') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yǒuyòng', `pinyin_raw` = 'youyong', `meaning_han_viet` = 'Hữu Dụng', `meaning_vi` = 'Hữu ích', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 948, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '103', `updated_at` = NOW() WHERE `hanzi` = '有用' AND `pinyin_raw` = 'youyong' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yòu', `pinyin_raw` = 'you', `meaning_han_viet` = 'Hữu', `meaning_vi` = 'Phải; bên phải', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 481, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '92', `updated_at` = NOW() WHERE `hanzi` = '右' AND `pinyin_raw` = 'you' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yòubian', `pinyin_raw` = 'youbian', `meaning_han_viet` = 'Hữu Biên', `meaning_vi` = 'Bên phải; phải, về bên phải', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 482, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '92', `updated_at` = NOW() WHERE `hanzi` = '右边' AND `pinyin_raw` = 'youbian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yǔ', `pinyin_raw` = 'yu', `meaning_han_viet` = 'Vũ', `meaning_vi` = 'Mưa, cơn mưa', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 267, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '雨' AND `pinyin_raw` = 'yu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yuán', `pinyin_raw` = 'yuan', `meaning_han_viet` = 'Nguyên', `meaning_vi` = 'Đồng tệ, nguyên (đơn vị tiền tệ)', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 268, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '量', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '元' AND `pinyin_raw` = 'yuan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yuǎn', `pinyin_raw` = 'yuan', `meaning_han_viet` = 'Viễn', `meaning_vi` = 'Xa; xa xôi', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 484, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '92', `updated_at` = NOW() WHERE `hanzi` = '远' AND `pinyin_raw` = 'yuan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'yuè', `pinyin_raw` = 'yue', `meaning_han_viet` = 'Nguyệt', `meaning_vi` = 'Mặt trăng; tháng', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 269, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '月' AND `pinyin_raw` = 'yue' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zài', `pinyin_raw` = 'zai', `meaning_han_viet` = 'Tái', `meaning_vi` = 'Lại; một lần nữa; tái-; lần thứ hai; cái khác', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 270, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '再' AND `pinyin_raw` = 'zai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zàijiàn', `pinyin_raw` = 'zaijian', `meaning_han_viet` = 'Tái Kiến', `meaning_vi` = 'Tạm biệt; gặp lại sau', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 272, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '再见' AND `pinyin_raw` = 'zaijian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zài', `pinyin_raw` = 'zai', `meaning_han_viet` = 'Tại', `meaning_vi` = 'Ở; tại; đang', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 271, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动、介、副', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '在' AND `pinyin_raw` = 'zai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zǎo', `pinyin_raw` = 'zao', `meaning_han_viet` = 'Tảo', `meaning_vi` = 'Sớm; buổi sáng', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 273, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '早' AND `pinyin_raw` = 'zao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zǎofàn', `pinyin_raw` = 'zaofan', `meaning_han_viet` = 'Tảo Phạn', `meaning_vi` = 'Bữa sáng', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 274, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '早饭' AND `pinyin_raw` = 'zaofan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zǎoshang', `pinyin_raw` = 'zaoshang', `meaning_han_viet` = 'Tảo Thướng', `meaning_vi` = 'Buổi sáng sớm', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 275, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '早上' AND `pinyin_raw` = 'zaoshang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zěnme', `pinyin_raw` = 'zenme', `meaning_han_viet` = 'Chẩm Yêu', `meaning_vi` = 'Như thế nào, làm sao, thế nào', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 276, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '怎么' AND `pinyin_raw` = 'zenme' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhàn', `pinyin_raw` = 'zhan', `meaning_han_viet` = 'Trạm', `meaning_vi` = 'Ga, bến, trạm xe', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 486, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = '1', `source_pdf_page` = '92', `updated_at` = NOW() WHERE `hanzi` = '站' AND `pinyin_raw` = 'zhan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhǎo', `pinyin_raw` = 'zhao', `meaning_han_viet` = 'Trảo', `meaning_vi` = 'Tìm; kiếm; thối lại tiền', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 278, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '找' AND `pinyin_raw` = 'zhao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhè', `pinyin_raw` = 'zhe', `meaning_han_viet` = 'Giá', `meaning_vi` = 'Này; những...này; này', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 279, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '这' AND `pinyin_raw` = 'zhe' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhèbiān', `pinyin_raw` = 'zhebian', `meaning_han_viet` = 'Giá Biên', `meaning_vi` = 'Bên này; ở đây', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 280, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '86', `updated_at` = NOW() WHERE `hanzi` = '这边' AND `pinyin_raw` = 'zhebian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhèlǐ', `pinyin_raw` = 'zheli', `meaning_han_viet` = 'Giá Lý', `meaning_vi` = 'Ở đây, chỗ này, nơi này', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 282, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '这里' AND `pinyin_raw` = 'zheli' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhèr', `pinyin_raw` = 'zher', `meaning_han_viet` = 'Giá Nhi', `meaning_vi` = 'Ở đây', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 283, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '这儿' AND `pinyin_raw` = 'zher' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhèxiē', `pinyin_raw` = 'zhexie', `meaning_han_viet` = 'Giá Ta', `meaning_vi` = 'Những... này', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 284, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '代', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '这些' AND `pinyin_raw` = 'zhexie' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhe', `pinyin_raw` = 'zhe', `meaning_han_viet` = 'Trước', `meaning_vi` = 'Đang (trợ từ biểu thị trạng thái tiếp diễn)', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 490, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '助', `homograph_index` = NULL, `source_pdf_page` = '92', `updated_at` = NOW() WHERE `hanzi` = '着' AND `pinyin_raw` = 'zhe' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhēn', `pinyin_raw` = 'zhen', `meaning_han_viet` = 'Chân', `meaning_vi` = 'Thật; sự thật', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 285, `hsk_source_label` = '1（4）', `hsk_edition` = '2025', `part_of_speech` = '副、（形）', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '真' AND `pinyin_raw` = 'zhen' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhèng', `pinyin_raw` = 'zheng', `meaning_han_viet` = 'Chinh', `meaning_vi` = 'Đúng; chính; đang', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 491, `hsk_source_label` = '2（5）', `hsk_edition` = '2025', `part_of_speech` = '副、（形）', `homograph_index` = NULL, `source_pdf_page` = '92', `updated_at` = NOW() WHERE `hanzi` = '正' AND `pinyin_raw` = 'zheng' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhèngzài', `pinyin_raw` = 'zhengzai', `meaning_han_viet` = 'Chinh Tại', `meaning_vi` = 'Đang ở; ngay tại', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 286, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '正在' AND `pinyin_raw` = 'zhengzai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhīdào', `pinyin_raw` = 'zhidao', `meaning_han_viet` = 'Tri Đạo', `meaning_vi` = 'Biết, hiểu rõ', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 288, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '知道' AND `pinyin_raw` = 'zhidao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhōng', `pinyin_raw` = 'zhong', `meaning_han_viet` = 'Trung', `meaning_vi` = 'Trong; giữa; trúng', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 981, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '104', `updated_at` = NOW() WHERE `hanzi` = '中' AND `pinyin_raw` = 'zhong' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'Zhōngguó', `pinyin_raw` = 'zhongguo', `meaning_han_viet` = 'Trung Quốc', `meaning_vi` = 'Trung Quốc', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 289, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '中国' AND `pinyin_raw` = 'zhongguo' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhōngjiān', `pinyin_raw` = 'zhongjian', `meaning_han_viet` = 'Trung Gian', `meaning_vi` = 'Ở giữa; bên trong; ở giữa; trong; giữa; trong số', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 982, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '104', `updated_at` = NOW() WHERE `hanzi` = '中间' AND `pinyin_raw` = 'zhongjian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'Zhōngwén', `pinyin_raw` = 'zhongwen', `meaning_han_viet` = 'Trung Văn', `meaning_vi` = 'Ngôn ngữ Trung Quốc', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 290, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '中文' AND `pinyin_raw` = 'zhongwen' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhōngwǔ', `pinyin_raw` = 'zhongwu', `meaning_han_viet` = 'Trung Ngọ', `meaning_vi` = 'Buổi trưa; trưa', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 291, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '中午' AND `pinyin_raw` = 'zhongwu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhōngxué', `pinyin_raw` = 'zhongxue', `meaning_han_viet` = 'Trung Học', `meaning_vi` = 'Trường trung học', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 292, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '中学' AND `pinyin_raw` = 'zhongxue' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhōngxuéshēng', `pinyin_raw` = 'zhongxuesheng', `meaning_han_viet` = 'Trung Học Sinh', `meaning_vi` = 'Học sinh trung học; học sinh cấp ba', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 293, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '中学生' AND `pinyin_raw` = 'zhongxuesheng' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhòngyào', `pinyin_raw` = 'zhongyao', `meaning_han_viet` = 'Trùng Yêu', `meaning_vi` = 'Quan trọng; đáng kể; chính yếu', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 985, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '形', `homograph_index` = NULL, `source_pdf_page` = '104', `updated_at` = NOW() WHERE `hanzi` = '重要' AND `pinyin_raw` = 'zhongyao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhù', `pinyin_raw` = 'zhu', `meaning_han_viet` = 'Trú', `meaning_vi` = 'Ở; cư trú', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 294, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '住' AND `pinyin_raw` = 'zhu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhǔnbèi', `pinyin_raw` = 'zhunbei', `meaning_han_viet` = 'Chuẩn Bị', `meaning_vi` = 'Sự chuẩn bị; chuẩn bị', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 493, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '92', `updated_at` = NOW() WHERE `hanzi` = '准备' AND `pinyin_raw` = 'zhunbei' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zhuōzi', `pinyin_raw` = 'zhuozi', `meaning_han_viet` = 'Trác Tử', `meaning_vi` = 'Bàn; bàn làm việc', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 295, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '桌子' AND `pinyin_raw` = 'zhuozi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zì', `pinyin_raw` = 'zi', `meaning_han_viet` = 'Tự', `meaning_vi` = 'Chữ; ký hiệu', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 296, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '字' AND `pinyin_raw` = 'zi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zi', `pinyin_raw` = 'zi', `meaning_han_viet` = 'Tử', `meaning_vi` = 'Con trai; trẻ em', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 992, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '后缀', `homograph_index` = NULL, `source_pdf_page` = '104', `updated_at` = NOW() WHERE `hanzi` = '子' AND (`pinyin_raw` = 'zi' OR `pinyin_raw` = 'zi (zhuozi)' OR `pinyin_raw` = 'zi(zhuozi)') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zǒu', `pinyin_raw` = 'zou', `meaning_han_viet` = 'Tẩu', `meaning_vi` = 'Đi; rời đi', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 495, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '92', `updated_at` = NOW() WHERE `hanzi` = '走' AND `pinyin_raw` = 'zou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zǒulù', `pinyin_raw` = 'zoulu', `meaning_han_viet` = 'Tẩu Lộ', `meaning_vi` = 'Đi bộ; đi bằng chân', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 496, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '92', `updated_at` = NOW() WHERE `hanzi` = '走路' AND `pinyin_raw` = 'zoulu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zuì', `pinyin_raw` = 'zui', `meaning_han_viet` = 'Tối', `meaning_vi` = 'Nhất', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 498, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '92', `updated_at` = NOW() WHERE `hanzi` = '最' AND `pinyin_raw` = 'zui' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zuìhǎo', `pinyin_raw` = 'zuihao', `meaning_han_viet` = 'Tối Hảo', `meaning_vi` = 'Tốt nhất; nên ...; tốt hơn hết nên ...', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 996, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '副', `homograph_index` = NULL, `source_pdf_page` = '104', `updated_at` = NOW() WHERE `hanzi` = '最好' AND `pinyin_raw` = 'zuihao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zuìhòu', `pinyin_raw` = 'zuihou', `meaning_han_viet` = 'Tối Hậu', `meaning_vi` = 'Cuối cùng; sau cùng', `hsk_level` = 3, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 997, `hsk_source_label` = '3', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '104', `updated_at` = NOW() WHERE `hanzi` = '最后' AND `pinyin_raw` = 'zuihou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zuótiān', `pinyin_raw` = 'zuotian', `meaning_han_viet` = 'Tạc Thiên', `meaning_vi` = 'Hôm qua', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 297, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '昨天' AND `pinyin_raw` = 'zuotian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zuǒ', `pinyin_raw` = 'zuo', `meaning_han_viet` = 'Tả', `meaning_vi` = 'Trái; bên trái', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 499, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '92', `updated_at` = NOW() WHERE `hanzi` = '左' AND `pinyin_raw` = 'zuo' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zuǒbian', `pinyin_raw` = 'zuobian', `meaning_han_viet` = 'Tả Biên', `meaning_vi` = 'Bên trái; phía trái', `hsk_level` = 2, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 500, `hsk_source_label` = '2', `hsk_edition` = '2025', `part_of_speech` = '名', `homograph_index` = NULL, `source_pdf_page` = '92', `updated_at` = NOW() WHERE `hanzi` = '左边' AND `pinyin_raw` = 'zuobian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zuò', `pinyin_raw` = 'zuo', `meaning_han_viet` = 'Toạ', `meaning_vi` = 'Ngồi; đi (xe, tàu)', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 298, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '坐' AND `pinyin_raw` = 'zuo' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `pinyin` = 'zuò', `pinyin_raw` = 'zuo', `meaning_han_viet` = 'Tố', `meaning_vi` = 'Làm; chế tạo', `hsk_level` = 1, `hsk_standard` = 'HSK 3.0', `hsk_source_id` = 299, `hsk_source_label` = '1', `hsk_edition` = '2025', `part_of_speech` = '动', `homograph_index` = NULL, `source_pdf_page` = '87', `updated_at` = NOW() WHERE `hanzi` = '做' AND `pinyin_raw` = 'zuo' AND `hsk_source_id` IS NULL;

-- -----------------------------------------------------------------------------
-- Step 3: Update 68 preserved curriculum supplementary entries (hsk_level = 0)
-- -----------------------------------------------------------------------------
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Bạch', `meaning_vi` = 'Màu trắng; trắng', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '白' AND `pinyin_raw` = 'bai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Bán Niên', `meaning_vi` = 'Nửa năm', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '半年' AND (`pinyin_raw` = 'ban nian' OR `pinyin_raw` = 'bannian') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Bôi', `meaning_vi` = 'Cốc; ly; chén', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '杯' AND `pinyin_raw` = 'bei' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Bắc Biên', `meaning_vi` = 'Phía bắc; mặt bắc', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '北边' AND `pinyin_raw` = 'beibian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Bắc Kinh', `meaning_vi` = 'Bắc Kinh, thủ đô nước Cộng hòa Nhân dân Trung Hoa', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '北京' AND `pinyin_raw` = 'beijing' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Bất Đại', `meaning_vi` = 'Không quá; không nhiều', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '不大' AND (`pinyin_raw` = 'bu da' OR `pinyin_raw` = 'buda') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Bất Đối', `meaning_vi` = 'Không chính xác; sai', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '不对' AND `pinyin_raw` = 'budui' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Xướng Ca', `meaning_vi` = 'Hát một bài hát', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '唱歌' AND `pinyin_raw` = 'changge' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Xa Phiếu', `meaning_vi` = 'Vé', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '车票' AND `pinyin_raw` = 'chepiao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Xa Thướng', `meaning_vi` = 'Trên xe', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '车上' AND (`pinyin_raw` = 'che shang' OR `pinyin_raw` = 'cheshang') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Cật Phạn', `meaning_vi` = 'Dùng bữa; ăn', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '吃饭' AND `pinyin_raw` = 'chifan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Tá Cầu', `meaning_vi` = 'Chơi bóng; chơi với bóng', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '打球' AND (`pinyin_raw` = 'da qiu' OR `pinyin_raw` = 'daqiu') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Địa Thướng', `meaning_vi` = 'Trên mặt đất; trên sàn nhà', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '地上' AND `pinyin_raw` = 'dishang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Điện Thị Cơ', `meaning_vi` = 'Máy thu hình', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '电视机' AND `pinyin_raw` = 'dianshiji' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Đông Biên', `meaning_vi` = 'Hướng đông; phía đông', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '东边' AND `pinyin_raw` = 'dongbian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Động Tác', `meaning_vi` = 'Chuyển động; cử động; hành động; diễn; di chuyển', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '动作' AND `pinyin_raw` = 'dongzuo' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Can', `meaning_vi` = 'Làm; khô ráo', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '干' AND (`pinyin_raw` = 'gan' AND `pinyin` COLLATE utf8mb4_bin = 'gān') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Can Thậm Yêu', `meaning_vi` = 'Bạn đang làm gì?; anh ấy đang định làm gì?', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '干什么' AND (`pinyin_raw` = 'gan shenme' OR `pinyin_raw` = 'ganshenme') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Công Nhân', `meaning_vi` = 'Công nhân, người lao động', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '工人' AND `pinyin_raw` = 'gongren' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Quan Thướng', `meaning_vi` = 'Đóng; tắt', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '关上' AND `pinyin_raw` = 'guanshang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Quốc Ngoại', `meaning_vi` = 'Ở nước ngoài; ngoại', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '国外' AND (`pinyin_raw` = 'guo wai' OR `pinyin_raw` = 'guowai') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Hoàn Hữu', `meaning_vi` = 'Vẫn còn; còn có; thêm vào đó', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '还有' AND (`pinyin_raw` = 'hai you' OR `pinyin_raw` = 'haiyou') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Hậu Biên', `meaning_vi` = 'Phía sau; đằng sau; phần cuối; đằng sau; gần cuối; ở phía sau', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '后边' AND `pinyin_raw` = 'houbian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thoại', `meaning_vi` = 'Phương ngữ; ngôn ngữ', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '话' AND `pinyin_raw` = 'hua' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Hồi Đáo', `meaning_vi` = 'Trở về', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '回到' AND `pinyin_raw` = 'huidao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Hồi Gia', `meaning_vi` = 'Trở về nhà', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '回家' AND (`pinyin_raw` = 'hui jia' OR `pinyin_raw` = 'huijia') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Ký Trú', `meaning_vi` = 'Nhớ; ghi nhớ', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '记住' AND `pinyin_raw` = 'jizhu' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Gia Lý', `meaning_vi` = 'Nhà', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '家里' AND (`pinyin_raw` = 'jia li' OR `pinyin_raw` = 'jiali') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Giáo Học Lâu', `meaning_vi` = 'Tòa nhà trường học; tòa nhà học thuật', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '教学楼' AND `pinyin_raw` = 'jiaoxuelou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Khai Ngoạn Tiếu', `meaning_vi` = 'Đùa giỡn; chế nhạo; nói đùa', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '开玩笑' AND (`pinyin_raw` = 'kai wanxiao' OR `pinyin_raw` = 'kaiwanxiao') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Khán Đáo', `meaning_vi` = 'Nhìn thấy', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '看到' AND `pinyin_raw` = 'kandao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Lai Đáo', `meaning_vi` = 'Đến; tới', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '来到' AND `pinyin_raw` = 'laidao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Lý Biên', `meaning_vi` = 'Bên trong', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '里边' AND `pinyin_raw` = 'libian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Lâu Thướng', `meaning_vi` = 'Tầng trên, trên lầu', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '楼上' AND (`pinyin_raw` = 'lou shang' OR `pinyin_raw` = 'loushang') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Lâu Hạ', `meaning_vi` = 'Tầng dưới', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '楼下' AND (`pinyin_raw` = 'lou xia' OR `pinyin_raw` = 'louxia') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Một', `meaning_vi` = 'Không; chưa có', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '没' AND `pinyin_raw` = 'mei' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Một Thậm Yêu', `meaning_vi` = 'Không sao; không có gì; đừng bận tâm; nghĩ không có gì; rất hân hạnh; không có chi; không có gì', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '没什么' AND (`pinyin_raw` = 'mei shenme' OR `pinyin_raw` = 'meishenme') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Một Sự Nhi', `meaning_vi` = 'Có thời gian rảnh; rảnh rỗi', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '没事儿' AND `pinyin_raw` = 'meishir' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Nãi', `meaning_vi` = 'Sữa; bà nội', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '奶' AND `pinyin_raw` = 'nai' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Nam Biên', `meaning_vi` = 'Phía nam; mặt nam', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '南边' AND `pinyin_raw` = 'nanbian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Tiền Biên', `meaning_vi` = 'Phía trước; mặt trước', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '前边' AND `pinyin_raw` = 'qianbian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Tiền Bao', `meaning_vi` = 'Ví; bóp tiền', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '钱包' AND `pinyin_raw` = 'qianbao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thỉnh Tiến', `meaning_vi` = 'Mời vào', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '请进' AND (`pinyin_raw` = 'qing jin' OR `pinyin_raw` = 'qingjin') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thỉnh Toạ', `meaning_vi` = 'Mời ngồi', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '请坐' AND (`pinyin_raw` = 'qing zuo' OR `pinyin_raw` = 'qingzuo') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Nhật Kỳ', `meaning_vi` = 'Ngày tháng', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '日期' AND `pinyin_raw` = 'riqi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thướng Biên', `meaning_vi` = 'Phía trên; bên trên', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '上边' AND `pinyin_raw` = 'shangbian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thướng Xa', `meaning_vi` = 'Lên', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '上车' AND (`pinyin_raw` = 'shang che' OR `pinyin_raw` = 'shangche') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thướng Thứ', `meaning_vi` = 'Lần trước', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '上次' AND (`pinyin_raw` = 'shang ci' OR `pinyin_raw` = 'shangci') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thân Thướng', `meaning_vi` = 'Trên cơ thể; trong tay', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '身上' AND `pinyin_raw` = 'shenshang' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thị Bất Thị', `meaning_vi` = 'Có phải hay không; phải hoặc không', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '是不是' AND (`pinyin_raw` = 'shi bu shi' OR `pinyin_raw` = 'shibushi') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Dẫn Đáo', `meaning_vi` = 'Nghe thấy', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '听到' AND `pinyin_raw` = 'tingdao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Dẫn Tả', `meaning_vi` = 'Viết chính tả; bài chính tả; chép lại bằng tai', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '听写' AND `pinyin_raw` = 'tingxie' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Ngoạn Nhi', `meaning_vi` = 'Chơi; vui chơi', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '玩儿' AND `pinyin_raw` = 'wanr' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Võng Hữu', `meaning_vi` = 'Bạn online; người dùng Internet', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '网友' AND `pinyin_raw` = 'wangyou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Tây Biên', `meaning_vi` = 'Phía tây; bên phía tây', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '西边' AND `pinyin_raw` = 'xibian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Hạ Biên', `meaning_vi` = 'Ở dưới; mặt dưới', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '下边' AND `pinyin_raw` = 'xiabian' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Hạ Xa', `meaning_vi` = 'Xuống', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '下车' AND (`pinyin_raw` = 'xia che' OR `pinyin_raw` = 'xiache') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Hạ Thứ', `meaning_vi` = 'Lần tới', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '下次' AND (`pinyin_raw` = 'xia ci' OR `pinyin_raw` = 'xiaci') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Tiểu Tỷ', `meaning_vi` = 'Cô gái; cô', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '小姐' AND `pinyin_raw` = 'xiaojie' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Học Viện', `meaning_vi` = 'Trường cao đẳng; học viện', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '学院' AND `pinyin_raw` = 'xueyuan' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Nhất Hạ Nhi', `meaning_vi` = 'Một chút, một lát, một hồi', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '一下儿' AND `pinyin_raw` = 'yixiar' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Hữu Thời Hậu', `meaning_vi` = 'Đôi khi', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '有时候' AND `pinyin_raw` = 'youshihou' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Tại Gia', `meaning_vi` = 'Ở nhà; có mặt', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '在家' AND `pinyin_raw` = 'zaijia' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Trảo Đáo', `meaning_vi` = 'Tìm thấy', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '找到' AND `pinyin_raw` = 'zhaodao' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Chân Đích', `meaning_vi` = 'Thực sự; thật sự; quả thật; thật; đúng; chính xác', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '真的' AND (`pinyin_raw` = 'zhen de' OR `pinyin_raw` = 'zhende') AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Tri Thức', `meaning_vi` = 'Kiến thức; trí thức', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '知识' AND `pinyin_raw` = 'zhishi' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Trùng', `meaning_vi` = 'Lặp lại; sự lặp lại', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '重' AND `pinyin_raw` = 'zhong' AND `hsk_source_id` IS NULL;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Toạ Hạ', `meaning_vi` = 'Ngồi xuống', `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `hsk_source_label` = 'Supplementary', `hsk_edition` = '2025', `part_of_speech` = NULL, `homograph_index` = NULL, `source_pdf_page` = NULL, `updated_at` = NOW() WHERE `hanzi` = '坐下' AND (`pinyin_raw` = 'zuo xia' OR `pinyin_raw` = 'zuoxia') AND `hsk_source_id` IS NULL;

-- -----------------------------------------------------------------------------
-- Step 4: Insert 568 missing official HSK 1-3 entries
-- -----------------------------------------------------------------------------
INSERT INTO `VOCABULARY` (
  `hanzi`, `pinyin`, `pinyin_raw`, `meaning_han_viet`, `meaning_vi`,
  `hsk_level`, `hsk_standard`, `hsk_source_id`, `hsk_source_label`, `hsk_edition`,
  `part_of_speech`, `homograph_index`, `source_pdf_page`, `example_sentence`,
  `example_translation`, `created_at`, `updated_at`
) VALUES
  ('边', 'biān', 'bian', 'Biên', 'Bên, mép, cạnh, phía', 1, 'HSK 3.0', 11, '1', '2025', '名、后缀', NULL, '80', '书在桌子旁边。', 'Sách ở bên cạnh cái bàn.', NOW(), NOW()),
  ('不要', 'búyào', 'buyao', 'Bất Yếu', 'Đừng, không được, không cần', 1, 'HSK 3.0', 15, '1', '2025', '副', NULL, '80', '你不要在这里大声说话。', 'Bạn đừng nói chuyện to ở đây.', NOW(), NOW()),
  ('超市', 'chāoshì', 'chaoshi', 'Siêu Thị', 'Siêu thị', 1, 'HSK 3.0', 19, '1', '2025', '名', NULL, '80', '妈妈去超市买新鲜的水果。', 'Mẹ đi siêu thị mua hoa quả tươi.', NOW(), NOW()),
  ('出租车', 'chūzūchē', 'chuzuche', 'Xuất Tô Xa', 'Xe taxi', 1, 'HSK 3.0', 22, '1', '2025', '名', NULL, '80', '我们坐出租车去机场吧。', 'Chúng ta đi taxi ra sân bay nhé.', NOW(), NOW()),
  ('大家', 'dàjiā', 'dajia', 'Đại Gia', 'Mọi người, tất cả mọi người', 1, 'HSK 3.0', 26, '1', '2025', '代', NULL, '80', '大家好，欢迎来到中文班。', 'Chào mọi người, hoan nghênh đến với lớp tiếng Trung.', NOW(), NOW()),
  ('店', 'diàn', 'dian', 'Điếm', 'Cửa hàng, tiệm', 1, 'HSK 3.0', 34, '1', '2025', '名', NULL, '80', '学校旁边有一家书店。', 'Bên cạnh trường học có một hiệu sách.', NOW(), NOW()),
  ('分钟', 'fēnzhōng', 'fenzhong', 'Phân Chung', 'Phút (thời gian)', 1, 'HSK 3.0', 56, '1', '2025', '量', NULL, '81', '请等我十分钟。', 'Xin hãy đợi tôi mười phút.', NOW(), NOW()),
  ('公司', 'gōngsī', 'gongsi', 'Công Ty', 'Công ty', 1, 'HSK 3.0', 62, '1', '2025', '名', NULL, '81', '我哥哥在一家电脑公司工作。', 'Anh trai tôi làm việc ở một công ty máy tính.', NOW(), NOW()),
  ('狗', 'gǒu', 'gou', 'Cẩu', 'Con chó', 1, 'HSK 3.0', 64, '1', '2025', '名', NULL, '81', '他家养了一只可爱的小狗。', 'Nhà anh ấy nuôi một chú chó nhỏ đáng yêu.', NOW(), NOW()),
  ('件', 'jiàn', 'jian', 'Kiện', 'Chiếc, cái, kiện (lượng từ cho quần áo, sự việc)', 1, 'HSK 3.0', 89, '1', '2025', '量', NULL, '82', '这件衣服很漂亮。', 'Chiếc áo này rất đẹp.', NOW(), NOW()),
  ('饺子', 'jiǎozi', 'jiaozi', 'Giảo Tử', 'Bánh sủi cảo, bánh chẻo', 1, 'HSK 3.0', 90, '1', '2025', '名', NULL, '82', '中国人过年常常吃饺子。', 'Người Trung Quốc ăn Tết thường ăn sủi cảo.', NOW(), NOW()),
  ('可以', 'kěyǐ', 'keyi', 'Khả Dĩ', 'Có thể, được phép', 1, 'HSK 3.0', 102, '1', '2025', '动、形', NULL, '82', '我可以借用一下你的笔吗？', 'Tôi có thể mượn bút của bạn một chút không?', NOW(), NOW()),
  ('卖', 'mài', 'mai', 'Mại', 'Bán', 1, 'HSK 3.0', 117, '1', '2025', '动', NULL, '82', '这个商店卖各种新鲜水果。', 'Cửa hàng này bán các loại hoa quả tươi.', NOW(), NOW()),
  ('猫', 'māo', 'mao', 'Miêu', 'Con mèo', 1, 'HSK 3.0', 119, '1', '2025', '名', NULL, '82', '我家的小猫喜欢睡在椅子上。', 'Con mèo nhỏ nhà tôi thích ngủ trên ghế.', NOW(), NOW()),
  ('没事', 'méishì', 'meishi', 'Một Sự', 'Không có gì, không sao, rảnh rỗi', 1, 'HSK 3.0', 121, '1', '2025', '动', NULL, '83', '别担心，我真的一点儿也没事。', 'Đừng lo, tôi thật sự không sao cả.', NOW(), NOW()),
  ('哪个', 'nǎge', 'nage', 'Na Cá', 'Cái nào, người nào', 1, 'HSK 3.0', 132, '1', '2025', '代', NULL, '83', '你想买哪个苹果？', 'Bạn muốn mua quả táo nào?', NOW(), NOW()),
  ('那个', 'nàge', 'nage', 'Na Cá', 'Cái đó, cái kia', 1, 'HSK 3.0', 138, '1', '2025', '代', NULL, '83', '那个包子很好吃。', 'Chiếc bánh bao kia rất ngon.', NOW(), NOW()),
  ('你好', 'nǐ hǎo', 'nihao', 'Nễ Hảo', 'Xin chào', 1, 'HSK 3.0', 147, '1', '2025', '', NULL, '83', '你好，很高兴认识你。', 'Xin chào, rất vui được làm quen với bạn.', NOW(), NOW()),
  ('女士', 'nǚshì', 'nushi', 'Nữ Sĩ', 'Quý cô, quý bà, phụ nữ', 1, 'HSK 3.0', 155, '1', '2025', '名', NULL, '83', '那位女士是我们的汉语老师。', 'Vị quý cô kia là giáo viên tiếng Trung của chúng tôi.', NOW(), NOW()),
  ('便宜', 'piányi', 'pianyi', 'Tiện Nghi', 'Rẻ, giá rẻ', 1, 'HSK 3.0', 157, '1', '2025', '形', NULL, '83', '这本书既实用又便宜。', 'Cuốn sách này vừa thực dụng vừa rẻ.', NOW(), NOW()),
  ('漂亮', 'piàoliang', 'piaoliang', 'Phiêu Lượng', 'Đẹp, xinh đẹp', 1, 'HSK 3.0', 158, '1', '2025', '形', NULL, '83', '今天你穿得真漂亮。', 'Hôm nay bạn mặc thật là đẹp.', NOW(), NOW()),
  ('苹果', 'píngguǒ', 'pingguo', 'Bình Quả', 'Quả táo', 1, 'HSK 3.0', 159, '1', '2025', '名', NULL, '83', '我想吃一个红苹果。', 'Tôi muốn ăn một quả táo đỏ.', NOW(), NOW()),
  ('千', 'qiān', 'qian', 'Thiên', 'Nghìn, ngàn (1.000)', 1, 'HSK 3.0', 162, '1', '2025', '数', NULL, '84', '这个电脑要五千元。', 'Chiếc máy tính này giá năm nghìn tệ.', NOW(), NOW()),
  ('它', 'tā', 'ta', 'Tha', 'Nó (chỉ đồ vật, con vật)', 1, 'HSK 3.0', 201, '1', '2025', '代', NULL, '85', '这是一只小猫，它的眼睛很大。', 'Đây là một con mèo con, mắt của nó rất to.', NOW(), NOW()),
  ('它们', 'tāmen', 'tamen', 'Tha Môn', 'Chúng nó, chúng (số nhiều đồ vật, con vật)', 1, 'HSK 3.0', 204, '1', '2025', '代', NULL, '85', '这些鸟真可爱，它们在树上唱歌。', 'Những con chim này thật đáng yêu, chúng đang hót trên cây.', NOW(), NOW()),
  ('玩', 'wán', 'wan', 'Ngoạn', 'Chơi, vui chơi', 1, 'HSK 3.0', 214, '1', '2025', '动', NULL, '85', '周末孩子们在公园里开心地玩。', 'Cuối tuần lũ trẻ vui vẻ chơi đùa trong công viên.', NOW(), NOW()),
  ('喂', 'wèi', 'wei', 'Uý', 'A lô, này, ơi', 1, 'HSK 3.0', 218, '1', '2025', '叹', '1', '85', '喂，请问王老师在吗？', 'A lô, xin hỏi thầy Vương có ở đó không?', NOW(), NOW()),
  ('问题', 'wèntí', 'wenti', 'Vấn Đề', 'Câu hỏi, vấn đề', 1, 'HSK 3.0', 220, '1', '2025', '名', NULL, '85', '老师，我有一个问题想问您。', 'Thưa thầy, em có một câu hỏi muốn hỏi thầy.', NOW(), NOW()),
  ('些', 'xiē', 'xie', 'Ta', 'Một vài, một ít, những', 1, 'HSK 3.0', 239, '1', '2025', '量', NULL, '85', '桌子上有一些新书。', 'Trên bàn có một vài cuốn sách mới.', NOW(), NOW()),
  ('雪', 'xuě', 'xue', 'Tuyết', 'Tuyết', 1, 'HSK 3.0', 251, '1', '2025', '名', NULL, '86', '冬天下雪的时候外面很冷。', 'Mùa đông khi tuyết rơi bên ngoài rất lạnh.', NOW(), NOW()),
  ('一下', 'yíxià', 'yixia', 'Nhất Hạ', 'Một chút, một lát, một cái', 1, 'HSK 3.0', 259, '1', '2025', '数量、（副）', NULL, '86', '请等一下，我马上就来。', 'Xin đợi một chút, tôi đến ngay đây.', NOW(), NOW()),
  ('椅子', 'yǐzi', 'yizi', 'Ỷ Tử', 'Cái ghế', 1, 'HSK 3.0', 260, '1', '2025', '名', NULL, '86', '请坐在这把椅子上休息。', 'Xin mời ngồi trên chiếc ghế này nghỉ ngơi.', NOW(), NOW()),
  ('有点儿', 'yǒudiǎnr', 'youdianr', 'Hữu Điểm Nhi', 'Hơi, có chút, hơi hơi', 1, 'HSK 3.0', 265, '1', '2025', '副', NULL, '86', '今天天气有点儿冷。', 'Thời tiết hôm nay hơi lạnh.', NOW(), NOW()),
  ('怎么样', 'zěnmeyàng', 'zenmeyang', 'Chẩm Ma Dạng', 'Thế nào, ra sao', 1, 'HSK 3.0', 277, '1', '2025', '代', NULL, '86', '你最近身体怎么样？', 'Dạo này sức khỏe của bạn thế nào?', NOW(), NOW()),
  ('这个', 'zhège', 'zhege', 'Giá Cá', 'Cái này, điều này', 1, 'HSK 3.0', 281, '1', '2025', '代', NULL, '87', '这个汉字怎么读？', 'Chữ Hán này đọc như thế nào?', NOW(), NOW()),
  ('只', 'zhī', 'zhi', 'Chỉ', 'Con, cái, chiếc (lượng từ động vật, chiếc trong cặp)', 1, 'HSK 3.0', 287, '1', '2025', '量', NULL, '87', '树上有一只小鸟。', 'Trên cây có một con chim nhỏ.', NOW(), NOW()),
  ('做饭', 'zuò fàn', 'zuofan', 'Tố Phạn', 'Nấu cơm, nấu ăn', 1, 'HSK 3.0', 300, '1', '2025', '', NULL, '87', '妈妈每天都在家做饭。', 'Mẹ ngày nào cũng nấu cơm ở nhà.', NOW(), NOW()),
  ('啊', 'a', 'a', 'A', 'À, ư, nhé, cơ (trợ từ ngữ khí)', 2, 'HSK 3.0', 301, '2', '2025', '助', NULL, '87', '这里的风景真美啊！', 'Phong cảnh ở đây thật là đẹp quá!', NOW(), NOW()),
  ('白色', 'báisè', 'baise', 'Bạch Sắc', 'Màu trắng', 2, 'HSK 3.0', 303, '2', '2025', '名', NULL, '87', '他今天穿了一件白色的衬衫。', 'Hôm nay anh ấy mặc một chiếc áo sơ mi màu trắng.', NOW(), NOW()),
  ('笔', 'bǐ', 'bi', 'Bút', 'Bút, cây bút', 2, 'HSK 3.0', 310, '2', '2025', '名、（量）', NULL, '87', '我可以用一下你的笔吗？', 'Tôi có thể dùng bút của bạn một chút không?', NOW(), NOW()),
  ('不错', 'búcuò', 'bucuo', 'Bất Thác', 'Tốt, khá, không tồi', 2, 'HSK 3.0', 312, '2', '2025', '形', NULL, '87', '这家饭馆的菜味道真不错。', 'Món ăn của quán này hương vị thật không tồi.', NOW(), NOW()),
  ('不好意思', 'bù hǎoyìsi', 'buhaoyisi', 'Bất Hảo Ý Tư', 'Ngại quá, xin lỗi, áy náy', 2, 'HSK 3.0', 313, '2', '2025', '', NULL, '87', '不好意思，让您久等了。', 'Ngại quá, để ngài phải đợi lâu rồi.', NOW(), NOW()),
  ('长', 'cháng', 'chang', 'Trường', 'Dài', 2, 'HSK 3.0', 314, '2', '2025', '形', NULL, '87', '这条河很长，流过很多城市。', 'Con sông này rất dài, chảy qua nhiều thành phố.', NOW(), NOW()),
  ('出国', 'chūguó', 'chuguo', 'Xuất Quốc', 'Ra nước ngoài, xuất ngoại', 2, 'HSK 3.0', 317, '2', '2025', '动', NULL, '87', '他打算明年出国留学。', 'Anh ấy dự định năm sau ra nước ngoài du học.', NOW(), NOW()),
  ('出门', 'chūmén', 'chumen', 'Xuất Môn', 'Ra ngoài, ra khỏi nhà', 2, 'HSK 3.0', 319, '2', '2025', '动', NULL, '87', '外面下雨了，出门记得带伞。', 'Bên ngoài trời mưa rồi, ra ngoài nhớ mang theo ô.', NOW(), NOW()),
  ('词', 'cí', 'ci', 'Từ', 'Từ ngữ, lời nói', 2, 'HSK 3.0', 322, '2', '2025', '名', NULL, '88', '这个生词是什么意思？', 'Từ mới này có nghĩa là gì?', NOW(), NOW()),
  ('从小', 'cóngxiǎo', 'congxiao', 'Tòng Tiểu', 'Từ nhỏ, từ bé', 2, 'HSK 3.0', 325, '2', '2025', '副', NULL, '88', '他从小就非常喜欢画画。', 'Từ nhỏ anh ấy đã rất thích vẽ tranh.', NOW(), NOW()),
  ('但', 'dàn', 'dan', 'Đãn', 'Nhưng, nhưng mà', 2, 'HSK 3.0', 330, '2', '2025', '连、（副）', NULL, '88', '他虽然年纪小，但懂得很多道理。', 'Cậu ấy tuy tuổi còn nhỏ nhưng hiểu biết rất nhiều đạo lý.', NOW(), NOW()),
  ('但是', 'dànshì', 'danshi', 'Đãn Thị', 'Nhưng, nhưng mà, tuy nhiên', 2, 'HSK 3.0', 331, '2', '2025', '连', NULL, '88', '我想去旅行，但是最近太忙了。', 'Tôi muốn đi du lịch, nhưng dạo này bận quá.', NOW(), NOW()),
  ('得', 'de', 'de', 'Đắc', 'Đến mức, được (trợ từ kết cấu)', 2, 'HSK 3.0', 332, '2', '2025', '助', NULL, '88', '弟弟跑得很快。', 'Em trai chạy rất nhanh.', NOW(), NOW()),
  ('地铁', 'dìtiě', 'ditie', 'Địa Thiết', 'Tàu điện ngầm', 2, 'HSK 3.0', 335, '2', '2025', '名', NULL, '88', '坐地铁去火车站非常方便。', 'Đi tàu điện ngầm đến ga tàu hỏa rất thuận tiện.', NOW(), NOW()),
  ('点', 'diǎn', 'dian', 'Điểm', 'Gọi (món), châm (lửa), bấm, điểm', 2, 'HSK 3.0', 336, '2', '2025', '动、（名、量）', '2', '88', '服务员，我们现在想点菜。', 'Phục vụ viên, bây giờ chúng tôi muốn gọi món.', NOW(), NOW()),
  ('懂', 'dǒng', 'dong', 'Đổng', 'Hiểu, hiểu rõ', 2, 'HSK 3.0', 337, '2', '2025', '动', NULL, '88', '老师讲的内容你都听懂了吗？', 'Nội dung thầy giảng bạn đã nghe hiểu hết chưa?', NOW(), NOW()),
  ('饭馆', 'fànguǎn', 'fanguan', 'Phạn Quán', 'Quán ăn, nhà hàng', 2, 'HSK 3.0', 339, '2', '2025', '名', NULL, '88', '学校附近有一家好吃的中国饭馆。', 'Gần trường có một quán ăn Trung Quốc rất ngon.', NOW(), NOW()),
  ('高中', 'gāozhōng', 'gaozhong', 'Cao Trung', 'Trường cấp 3, trung học phổ thông', 2, 'HSK 3.0', 342, '2', '2025', '名', NULL, '88', '我们是从高中就开始做朋友的。', 'Chúng tôi làm bạn với nhau từ thời cấp ba.', NOW(), NOW()),
  ('个子', 'gèzi', 'gezi', 'Cá Tử', 'Dáng người, chiều cao, vóc dáng', 2, 'HSK 3.0', 344, '2', '2025', '名', NULL, '88', '他的个子很高，喜欢打篮球。', 'Vóc dáng anh ấy rất cao, thích chơi bóng rổ.', NOW(), NOW()),
  ('公交车', 'gōngjiāochē', 'gongjiaoche', 'Công Giao Xa', 'Xe buýt, xe công cộng', 2, 'HSK 3.0', 346, '2', '2025', '名', NULL, '88', '每天早上我都坐公交车去上班。', 'Mỗi sáng tôi đều đi xe buýt đi làm.', NOW(), NOW()),
  ('过', 'guò', 'guo', 'Quá', 'Đi qua, qua (đường, cầu)', 2, 'HSK 3.0', 347, '2', '2025', '动', NULL, '88', '过马路的时候要注意安全。', 'Khi qua đường phải chú ý an toàn.', NOW(), NOW()),
  ('过来', 'guòlái', 'guolai', 'Quá Lai', 'Qua đây, lại đây', 2, 'HSK 3.0', 348, '2', '2025', '动', NULL, '88', '请你过来帮我看一下这个问题。', 'Xin mời bạn qua đây giúp tôi xem câu hỏi này.', NOW(), NOW()),
  ('过年', 'guònián', 'guonian', 'Quá Niên', 'Ăn tết, đón tết', 2, 'HSK 3.0', 349, '2', '2025', '动', NULL, '88', '过年的时候全家人聚在一起吃年夜饭。', 'Dịp đón tết cả gia đình quây quần ăn bữa cơm tất niên.', NOW(), NOW()),
  ('过去', 'guòqù', 'guoqu', 'Quá Khứ', 'Đi qua đó, qua bên kia', 2, 'HSK 3.0', 350, '2', '2025', '动', '1', '88', '我们从这里走过去只要五分钟。', 'Chúng ta đi bộ qua đó từ đây chỉ mất năm phút.', NOW(), NOW()),
  ('黑色', 'hēisè', 'heise', 'Hắc Sắc', 'Màu đen', 2, 'HSK 3.0', 353, '2', '2025', '名', NULL, '88', '她买了一双黑色的皮鞋。', 'Cô ấy đã mua một đôi giày da màu đen.', NOW(), NOW()),
  ('红茶', 'hóngchá', 'hongcha', 'Hồng Trà', 'Trà đen, hồng trà', 2, 'HSK 3.0', 354, '2', '2025', '名', NULL, '88', '中国人喜欢在下午喝一杯热红茶。', 'Người Trung Quốc thích uống một ly hồng trà nóng vào buổi chiều.', NOW(), NOW()),
  ('红色', 'hóngsè', 'hongse', 'Hồng Sắc', 'Màu đỏ', 2, 'HSK 3.0', 355, '2', '2025', '名', NULL, '88', '中国人过年时喜欢用红色的东西。', 'Người Trung Quốc khi đón tết thích dùng đồ màu đỏ.', NOW(), NOW()),
  ('后面', 'hòumiàn', 'houmian', 'Hậu Diện', 'Phía sau, đằng sau', 2, 'HSK 3.0', 356, '2', '2025', '名', NULL, '88', '图书馆就在教学楼的后面。', 'Thư viện ở ngay phía sau tòa nhà giảng dạy.', NOW(), NOW()),
  ('花', 'huā', 'hua', 'Hoa', 'Tiêu, tốn (tiền, thời gian)', 2, 'HSK 3.0', 357, '2', '2025', '动', '1', '88', '买这辆自行车花了我很多钱。', 'Mua chiếc xe đạp này đã tốn của tôi rất nhiều tiền.', NOW(), NOW()),
  ('画', 'huà', 'hua', 'Hoạ', 'Vẽ, bức tranh, bức họa', 2, 'HSK 3.0', 359, '2', '2025', '动、名', NULL, '88', '墙上挂着一幅漂亮的中国山水画。', 'Trên tường treo một bức tranh sơn thủy Trung Quốc rất đẹp.', NOW(), NOW()),
  ('教室', 'jiàoshì', 'jiaoshi', 'Giáo Thất', 'Phòng học, lớp học', 2, 'HSK 3.0', 368, '2', '2025', '名', NULL, '89', '同学们都在教室里认真听讲。', 'Các bạn học sinh đều đang chăm chú nghe giảng trong phòng học.', NOW(), NOW()),
  ('近', 'jìn', 'jin', 'Cận', 'Gần (khoảng cách, quan hệ)', 2, 'HSK 3.0', 371, '2', '2025', '形', NULL, '89', '我家离学校非常近，走路十分钟就到。', 'Nhà tôi cách trường rất gần, đi bộ mười phút là tới.', NOW(), NOW()),
  ('经常', 'jīngcháng', 'jingchang', 'Kinh Thường', 'Thường xuyên, hay', 2, 'HSK 3.0', 374, '2', '2025', '副', NULL, '89', '他经常在周末去图书馆借书。', 'Anh ấy thường xuyên đi thư viện mượn sách vào cuối tuần.', NOW(), NOW()),
  ('酒店', 'jiǔdiàn', 'jiudian', 'Tửu Điếm', 'Khách sạn', 2, 'HSK 3.0', 375, '2', '2025', '名', NULL, '89', '这家五星级酒店的服务非常周到。', 'Dịch vụ của khách sạn năm sao này rất chu đáo.', NOW(), NOW()),
  ('咖啡', 'kāfēi', 'kafei', 'Ca Phê', 'Cà phê', 2, 'HSK 3.0', 377, '2', '2025', '名', NULL, '89', '喝一杯热咖啡能让人精神起来。', 'Uống một tách cà phê nóng giúp tinh thần tỉnh táo hơn.', NOW(), NOW()),
  ('开始', 'kāishǐ', 'kaishi', 'Khai Thuỷ', 'Bắt đầu, khởi đầu', 2, 'HSK 3.0', 378, '2', '2025', '动、名', NULL, '89', '电影马上就要开始了，大家请坐好。', 'Bộ phim sắp bắt đầu rồi, mọi người hãy ngồi ngay ngắn.', NOW(), NOW()),
  ('开学', 'kāixué', 'kaixue', 'Khai Học', 'Khai giảng, vào năm học mới', 2, 'HSK 3.0', 379, '2', '2025', '动', NULL, '89', '下个星期一我们学校就要开学了。', 'Thứ hai tuần sau trường chúng tôi sẽ khai giảng rồi.', NOW(), NOW()),
  ('可能', 'kěnéng', 'keneng', 'Khả Năng', 'Có thể, có lẽ, khả năng', 2, 'HSK 3.0', 382, '2', '2025', '形、名、动', NULL, '89', '明天可能会下雨，出门记得带伞。', 'Ngày mai có thể trời sẽ mưa, ra ngoài nhớ mang theo ô.', NOW(), NOW()),
  ('裤子', 'kùzi', 'kuzi', 'Khố Tử', 'Cái quần', 2, 'HSK 3.0', 383, '2', '2025', '名', NULL, '89', '这条黑色的裤子穿起来很合身。', 'Chiếc quần màu đen này mặc vào rất vừa vặn.', NOW(), NOW()),
  ('快乐', 'kuàilè', 'kuaile', 'Khoái Nhạc', 'Vui vẻ, hạnh phúc, vui sướng', 2, 'HSK 3.0', 385, '2', '2025', '形', NULL, '89', '祝你生日快乐，身体健康！', 'Chúc bạn sinh nhật vui vẻ, dồi dào sức khỏe!', NOW(), NOW()),
  ('快要', 'kuàiyào', 'kuaiyao', 'Khoái Yếu', 'Sắp, sắp sửa (xảy ra)', 2, 'HSK 3.0', 386, '2', '2025', '副', NULL, '89', '天阴了，快要下大雨了。', 'Trời râm rồi, sắp mưa to rồi.', NOW(), NOW()),
  ('篮球', 'lánqiú', 'lanqiu', 'Lam Cầu', 'Bóng rổ', 2, 'HSK 3.0', 387, '2', '2025', '名', NULL, '89', '下课后男同学们喜欢一起打篮球。', 'Tan học các bạn nam thích cùng nhau chơi bóng rổ.', NOW(), NOW()),
  ('离', 'lí', 'li', 'Ly', 'Cách, rời khỏi (khoảng cách, thời gian)', 2, 'HSK 3.0', 389, '2', '2025', '动', NULL, '89', '我家离医院不太远。', 'Nhà tôi cách bệnh viện không xa lắm.', NOW(), NOW()),
  ('里面', 'lǐmiàn', 'limian', 'Lý Diện', 'Bên trong, trong', 2, 'HSK 3.0', 390, '2', '2025', '名', NULL, '89', '书包里面装满了课本和笔记本。', 'Bên trong cặp sách chứa đầy sách giáo khoa và vở ghi.', NOW(), NOW()),
  ('旅游', 'lǚyóu', 'luyou', 'Lữ Du', 'Du lịch, đi chơi', 2, 'HSK 3.0', 394, '2', '2025', '动', NULL, '89', '今年暑假我们全家打算去北京旅游。', 'Kỳ nghỉ hè năm nay cả nhà chúng tôi dự định đi du lịch Bắc Kinh.', NOW(), NOW()),
  ('绿茶', 'lǜchá', 'lucha', 'Lục Trà', 'Trà xanh, lục trà', 2, 'HSK 3.0', 395, '2', '2025', '名', NULL, '89', '夏天喝一杯冰绿茶让人感觉很清凉。', 'Mùa hè uống một ly trà xanh đá làm người ta thấy rất thanh mát.', NOW(), NOW()),
  ('绿色', 'lǜsè', 'luse', 'Lục Sắc', 'Màu xanh lá cây', 2, 'HSK 3.0', 396, '2', '2025', '名、（形）', NULL, '89', '春天来了，公园里到处都是绿色的草地。', 'Mùa xuân đến rồi, trong công viên khắp nơi đều là bãi cỏ màu xanh lá.', NOW(), NOW()),
  ('没意思', 'méi yìsi', 'meiyisi', 'Một Ý Tư', 'Không thú vị, buồn tẻ, nhàm chán', 2, 'HSK 3.0', 398, '2', '2025', '', NULL, '89', '这部电影剧情太拖沓，很没意思。', 'Cốt truyện bộ phim này quá rườm rà, rất nhàm chán.', NOW(), NOW()),
  ('每', 'měi', 'mei', 'Mỗi', 'Mỗi, từng', 2, 'HSK 3.0', 399, '2', '2025', '代、（副）', NULL, '89', '每天早上他都坚持晨跑半个小时。', 'Mỗi buổi sáng anh ấy đều kiên trì chạy bộ nửa tiếng.', NOW(), NOW()),
  ('面', 'miàn', 'mian', 'Diện', 'Mặt, phía, hướng, mì sợi', 2, 'HSK 3.0', 403, '2', '2025', '后缀、（动、名、量）', '1', '90', '学校东面是一片绿色的草坪。', 'Phía đông trường học là một bãi cỏ xanh mướt.', NOW(), NOW()),
  ('名', 'míng', 'ming', 'Danh', 'Tên, người, vị (lượng từ danh dự)', 2, 'HSK 3.0', 404, '2', '2025', '名、量', NULL, '90', '我们班有三十名热情的学生。', 'Lớp chúng tôi có ba mươi học sinh nhiệt tình.', NOW(), NOW()),
  ('那么', 'nàme', 'name', 'Na Ma', 'Như vậy, như thế, vậy thì', 2, 'HSK 3.0', 406, '2', '2025', '代、连', NULL, '90', '既然大家都在，那么我们就开始开会吧。', 'Nếu mọi người đều có mặt, vậy thì chúng ta bắt đầu họp nhé.', NOW(), NOW()),
  ('那样', 'nàyàng', 'nayang', 'Na Dạng', 'Như thế, như vậy, kiểu đó', 2, 'HSK 3.0', 407, '2', '2025', '代', NULL, '90', '你应该像他那样认真学习。', 'Bạn nên học tập chăm chỉ như anh ấy vậy.', NOW(), NOW()),
  ('奶茶', 'nǎichá', 'naicha', 'Nãi Trà', 'Trà sữa', 2, 'HSK 3.0', 408, '2', '2025', '名', NULL, '90', '现在的年轻人很喜欢在下午喝奶茶。', 'Giới trẻ ngày nay rất thích uống trà sữa vào buổi chiều.', NOW(), NOW()),
  ('鸟', 'niǎo', 'niao', 'Điểu', 'Con chim', 2, 'HSK 3.0', 411, '2', '2025', '名', NULL, '90', '树上有许多美丽的鸟在欢快地唱歌。', 'Trên cây có nhiều chú chim xinh đẹp đang vui vẻ hót.', NOW(), NOW()),
  ('跑步', 'pǎobù', 'paobu', 'Bào Bộ', 'Chạy bộ', 2, 'HSK 3.0', 415, '2', '2025', '动', NULL, '90', '坚持每天跑步能增强身体免疫力。', 'Kiên trì chạy bộ mỗi ngày có thể tăng cường sức đề kháng cho cơ thể.', NOW(), NOW()),
  ('妻子', 'qīzi', 'qizi', 'Thê Tử', 'Vợ', 2, 'HSK 3.0', 417, '2', '2025', '名', NULL, '90', '他的妻子是一位温柔的医生。', 'Vợ anh ấy là một bác sĩ rất dịu dàng.', NOW(), NOW()),
  ('前面', 'qiánmiàn', 'qianmian', 'Tiền Diện', 'Phía trước, đằng trước', 2, 'HSK 3.0', 419, '2', '2025', '名', NULL, '90', '前面那栋高楼就是我们的图书馆。', 'Tòa nhà cao tầng đằng trước kia chính là thư viện của chúng tôi.', NOW(), NOW()),
  ('晴', 'qíng', 'qing', 'Tình', 'Trời nắng, trong xanh, quang đãng', 2, 'HSK 3.0', 420, '2', '2025', '形', NULL, '90', '今天是个大晴天，阳光明媚。', 'Hôm nay là một ngày nắng đẹp, ánh nắng chan hòa.', NOW(), NOW()),
  ('让', 'ràng', 'rang', 'Nhượng', 'Để, cho phép, nhường, khiến cho', 2, 'HSK 3.0', 422, '2', '2025', '动、（介）', NULL, '90', '老师让我们分成几个小组讨论问题。', 'Thầy giáo bảo chúng tôi chia thành vài nhóm nhỏ thảo luận vấn đề.', NOW(), NOW()),
  ('上来', 'shànglái', 'shanglai', 'Thượng Lai', 'Lên đây, đi lên', 2, 'HSK 3.0', 425, '2', '2025', '动', NULL, '90', '电梯到了，大家快点儿上来吧。', 'Thang máy đến rồi, mọi người mau bước lên đi.', NOW(), NOW()),
  ('上面', 'shàngmiàn', 'shangmian', 'Thượng Diện', 'Phía trên, bên trên', 2, 'HSK 3.0', 426, '2', '2025', '名', NULL, '90', '桌子上面放着一本厚厚的词典。', 'Phía trên bàn đặt một cuốn từ điển dày cộp.', NOW(), NOW()),
  ('上去', 'shàngqù', 'shangqu', 'Thượng Khứ', 'Lên đó, đi lên trên', 2, 'HSK 3.0', 427, '2', '2025', '动', NULL, '90', '楼梯很陡，你上去的时候要小心。', 'Cầu thang rất dốc, khi bạn đi lên đó phải cẩn thận.', NOW(), NOW()),
  ('时', 'shí', 'shi', 'Thời', 'Lúc, khi, thời gian', 2, 'HSK 3.0', 431, '2', '2025', '名、（量）', NULL, '90', '看书时请保持安静，不要打扰别人。', 'Khi đọc sách xin hãy giữ trật tự, đừng làm phiền người khác.', NOW(), NOW()),
  ('事情', 'shìqing', 'shiqing', 'Sự Tình', 'Sự việc, việc, chuyện', 2, 'HSK 3.0', 432, '2', '2025', '名', NULL, '90', '今天我有很多重要的事情要处理。', 'Hôm nay tôi có rất nhiều chuyện quan trọng cần giải quyết.', NOW(), NOW()),
  ('手表', 'shǒubiǎo', 'shoubiao', 'Thủ Biểu', 'Đồng hồ đeo tay', 2, 'HSK 3.0', 434, '2', '2025', '名', NULL, '90', '这只手表是爸爸送给我的生日礼物。', 'Chiếc đồng hồ đeo tay này là món quà sinh nhật bố tặng tôi.', NOW(), NOW()),
  ('舒服', 'shūfu', 'shufu', 'Thư Phục', 'Dễ chịu, thoải mái, khỏe khoắn', 2, 'HSK 3.0', 436, '2', '2025', '形', NULL, '90', '洗了个温水澡之后感觉非常舒服。', 'Sau khi tắm nước ấm xong cảm thấy vô cùng thoải mái.', NOW(), NOW()),
  ('虽然', 'suīrán', 'suiran', 'Tuy Nhiên', 'Mặc dù, tuy rằng', 2, 'HSK 3.0', 438, '2', '2025', '连', NULL, '90', '虽然天气很冷，但他依然坚持锻炼。', 'Tuy rằng thời tiết rất lạnh, nhưng anh ấy vẫn kiên trì rèn luyện.', NOW(), NOW()),
  ('所以', 'suǒyǐ', 'suoyi', 'Sở Dĩ', 'Cho nên, vì vậy', 2, 'HSK 3.0', 439, '2', '2025', '连', NULL, '90', '因为下大雨，所以运动会推迟了。', 'Vì trời mưa to, cho nên đại hội thể thao đã bị hoãn lại.', NOW(), NOW()),
  ('疼', 'téng', 'teng', 'Đông', 'Đau, nhức', 2, 'HSK 3.0', 440, '2', '2025', '形、（动）', NULL, '90', '昨天吃了冷饮，今天胃有点儿疼。', 'Hôm qua uống đồ lạnh, hôm nay dạ dày hơi đau.', NOW(), NOW()),
  ('踢', 'tī', 'ti', 'Thích', 'Đá (bóng), đạp', 2, 'HSK 3.0', 441, '2', '2025', '动', NULL, '91', '周末男孩子们喜欢在草地上踢足球。', 'Cuối tuần các cậu bé thích đá bóng trên bãi cỏ.', NOW(), NOW()),
  ('题', 'tí', 'ti', 'Đề', 'Đề thi, câu hỏi, đề mục', 2, 'HSK 3.0', 442, '2', '2025', '名', NULL, '91', '这次考试的数学题都比较简单。', 'Các câu hỏi toán học trong bài thi lần này tương đối đơn giản.', NOW(), NOW()),
  ('条', 'tiáo', 'tiao', 'Điều', 'Con, sợi, cái, tuyến (lượng từ vật dài)', 2, 'HSK 3.0', 443, '2', '2025', '量、（名）', NULL, '91', '门前有一条清澈的小河。', 'Trước cửa có một con sông nhỏ trong vắt.', NOW(), NOW()),
  ('跳舞', 'tiàowǔ', 'tiaowu', 'Khiêu Vũ', 'Khiêu vũ, nhảy múa', 2, 'HSK 3.0', 444, '2', '2025', '动', NULL, '91', '姐姐从小就学习跳舞，跳得很优美。', 'Chị gái học khiêu vũ từ nhỏ, nhảy rất uyển chuyển.', NOW(), NOW()),
  ('头', 'tóu', 'tou', 'Đầu', 'Đầu, khởi đầu, con (lượng từ gia súc)', 2, 'HSK 3.0', 445, '2', '2025', '名、（量）、（形）', NULL, '91', '他低下头认真地看着手里的书。', 'Cậu ấy cúi đầu chăm chú nhìn cuốn sách trong tay.', NOW(), NOW()),
  ('外面', 'wàimiàn', 'waimian', 'Ngoại Diện', 'Bên ngoài, phía ngoài', 2, 'HSK 3.0', 447, '2', '2025', '名', NULL, '91', '外面下着雪，屋里却很暖和。', 'Bên ngoài tuyết đang rơi, trong nhà lại rất ấm áp.', NOW(), NOW()),
  ('完', 'wán', 'wan', 'Hoàn', 'Xong, hết, hoàn thành', 2, 'HSK 3.0', 448, '2', '2025', '动', NULL, '91', '我做完今天的作业就可以去看电影了。', 'Tôi làm xong bài tập hôm nay là có thể đi xem phim rồi.', NOW(), NOW()),
  ('万', 'wàn', 'wan', 'Vạn', 'Vạn, mười nghìn (10.000)', 2, 'HSK 3.0', 449, '2', '2025', '数', NULL, '91', '这个大型体育场可以容纳五万人。', 'Sân vận động lớn này có thể chứa được năm vạn người.', NOW(), NOW()),
  ('往', 'wǎng', 'wang', 'Vãng', 'Hướng về, về phía', 2, 'HSK 3.0', 450, '2', '2025', '动、介', NULL, '91', '请大家一直往前走，图书馆就在右手边。', 'Xin mọi người cứ đi thẳng về phía trước, thư viện ở ngay bên tay phải.', NOW(), NOW()),
  ('位', 'wèi', 'wei', 'Vị', 'Vị, người (lượng từ lịch sự chỉ người)', 2, 'HSK 3.0', 453, '2', '2025', '量', NULL, '91', '请问您是找哪位老师？', 'Xin hỏi ngài đang tìm vị thầy cô nào?', NOW(), NOW()),
  ('为什么', 'wèi shénme', 'weishenme', 'Vi Thập Ma', 'Tại sao, vì sao', 2, 'HSK 3.0', 454, '2', '2025', '', NULL, '91', '你今天为什么没有来参加汉语课？', 'Hôm nay tại sao bạn không đến tham gia lớp tiếng Trung?', NOW(), NOW()),
  ('希望', 'xīwàng', 'xiwang', 'Hi Vọng', 'Hy vọng, mong muốn', 2, 'HSK 3.0', 455, '2', '2025', '动', NULL, '91', '我希望大家都能够顺利通过汉语考试。', 'Tôi hy vọng mọi người đều có thể thuận lợi vượt qua kỳ thi tiếng Trung.', NOW(), NOW()),
  ('下来', 'xiàlái', 'xialai', 'Hạ Lai', 'Xuống đây, đi xuống', 2, 'HSK 3.0', 458, '2', '2025', '动', NULL, '91', '公车到站了，乘客们排队走下来。', 'Xe buýt đến trạm rồi, các hành khách xếp hàng bước xuống.', NOW(), NOW()),
  ('下面', 'xiàmiàn', 'xiamian', 'Hạ Diện', 'Phía dưới, bên dưới', 2, 'HSK 3.0', 459, '2', '2025', '名', NULL, '91', '大树下面乘凉的人很多。', 'Dưới gốc cây lớn có rất nhiều người hóng mát.', NOW(), NOW()),
  ('下去', 'xiàqù', 'xiaqu', 'Hạ Khứ', 'Xuống đó, tiếp tục', 2, 'HSK 3.0', 460, '2', '2025', '动', NULL, '91', '太阳下去了，天渐渐黑了下来。', 'Mặt trời lặn xuống rồi, trời dần dần tối lại.', NOW(), NOW()),
  ('小时候', 'xiǎoshíhou', 'xiaoshihou', 'Tiểu Thời Hậu', 'Hồi nhỏ, lúc bé, thời thơ ấu', 2, 'HSK 3.0', 462, '2', '2025', '名', NULL, '91', '小时候我最喜欢听奶奶讲故事。', 'Hồi nhỏ tôi thích nhất nghe bà kể chuyện.', NOW(), NOW()),
  ('姓', 'xìng', 'xing', 'Tính', 'Họ (tên họ), mang họ', 2, 'HSK 3.0', 464, '2', '2025', '名、动', NULL, '91', '请问先生贵姓？我姓李。', 'Xin hỏi quý tính của tiên sinh? Tôi họ Lý.', NOW(), NOW()),
  ('姓名', 'xìngmíng', 'xingming', 'Tính Danh', 'Họ và tên', 2, 'HSK 3.0', 465, '2', '2025', '名', NULL, '91', '请在表格的第一行写下您的姓名。', 'Xin hãy viết họ và tên của ngài vào dòng đầu tiên của biểu mẫu.', NOW(), NOW()),
  ('颜色', 'yánsè', 'yanse', 'Nhan Sắc', 'Màu sắc', 2, 'HSK 3.0', 466, '2', '2025', '名', NULL, '91', '你最喜欢什么颜色的衣服？', 'Bạn thích quần áo màu sắc gì nhất?', NOW(), NOW()),
  ('眼睛', 'yǎnjing', 'yanjing', 'Nhãn Tinh', 'Mắt, đôi mắt', 2, 'HSK 3.0', 467, '2', '2025', '名', NULL, '91', '多看远处的绿色植物对眼睛好。', 'Nhìn nhiều cây cối màu xanh ở phía xa rất tốt cho mắt.', NOW(), NOW()),
  ('药', 'yào', 'yao', 'Dược', 'Thuốc, viên thuốc', 2, 'HSK 3.0', 468, '2', '2025', '名', NULL, '91', '生病了就要按时吃药多喝水。', 'Bị ốm rồi thì phải uống thuốc đúng giờ và uống nhiều nước.', NOW(), NOW()),
  ('药店', 'yàodiàn', 'yaodian', 'Dược Điếm', 'Hiệu thuốc, tiệm thuốc', 2, 'HSK 3.0', 469, '2', '2025', '名', NULL, '91', '医院对面有一家二十四小时营业的药店。', 'Đối diện bệnh viện có một hiệu thuốc mở cửa hai mươi tư giờ.', NOW(), NOW()),
  ('已经', 'yǐjīng', 'yijing', 'Dĩ Kinh', 'Đã, rồi', 2, 'HSK 3.0', 472, '2', '2025', '副', NULL, '91', '我已经把所有的课文都预习好了。', 'Tôi đã chuẩn bị trước tất cả các bài khóa xong rồi.', NOW(), NOW()),
  ('意思', 'yìsi', 'yisi', 'Ý Tư', 'Ý nghĩa, ý tứ', 2, 'HSK 3.0', 474, '2', '2025', '名', NULL, '91', '你能告诉我这个句子的具体意思吗？', 'Bạn có thể nói cho tôi biết ý nghĩa cụ thể của câu này không?', NOW(), NOW()),
  ('阴', 'yīn', 'yin', 'Âm', 'U ám, râm, âm (âm dương)', 2, 'HSK 3.0', 475, '2', '2025', '形', NULL, '91', '今天天气阴沉沉的，好像要下雨了。', 'Thời tiết hôm nay u ám, hình như sắp mưa rồi.', NOW(), NOW()),
  ('因为', 'yīnwèi', 'yinwei', 'Nhân Vi', 'Bởi vì, vì', 2, 'HSK 3.0', 476, '2', '2025', '介、连', NULL, '91', '因为今天堵车，所以我迟到了十分钟。', 'Bởi vì hôm nay tắc đường, cho nên tôi đã đến muộn mười phút.', NOW(), NOW()),
  ('游', 'yóu', 'you', 'Du', 'Bơi, bơi lội, du ngoạn', 2, 'HSK 3.0', 477, '2', '2025', '动', NULL, '91', '一群小鱼在清澈的溪水里自由自在地游。', 'Một đàn cá nhỏ đang tung tăng bơi lội trong dòng suối trong veo.', NOW(), NOW()),
  ('游泳', 'yóuyǒng', 'youyong', 'Du Vịnh', 'Bơi lội', 2, 'HSK 3.0', 478, '2', '2025', '动', NULL, '91', '夏天很多人喜欢去海边游泳。', 'Mùa hè rất nhiều người thích đi biển bơi lội.', NOW(), NOW()),
  ('有意思', 'yǒu yìsi', 'youyisi', 'Hữu Ý Tư', 'Thú vị, hay ho, có ý nghĩa', 2, 'HSK 3.0', 479, '2', '2025', '', NULL, '91', '这本书写得很有意思，值得一读。', 'Cuốn sách này viết rất thú vị, đáng để đọc một lần.', NOW(), NOW()),
  ('有时', 'yǒushí', 'youshi', 'Hữu Thời', 'Có khi, đôi khi, thỉnh thoảng', 2, 'HSK 3.0', 480, '2', '2025', '副', NULL, '91', '周末我有时去爬山，有时在家里看书。', 'Cuối tuần tôi thỉnh thoảng đi leo núi, thỉnh thoảng đọc sách ở nhà.', NOW(), NOW()),
  ('鱼', 'yú', 'yu', 'Ngư', 'Con cá', 2, 'HSK 3.0', 483, '2', '2025', '名', NULL, '92', '清蒸鱼是广东非常有名的一道菜。', 'Cá hấp thanh đạm là một món ăn rất nổi tiếng của Quảng Đông.', NOW(), NOW()),
  ('运动', 'yùndòng', 'yundong', 'Vận Động', 'Vận động, thể thao', 2, 'HSK 3.0', 485, '2', '2025', '动、名', NULL, '92', '每天坚持适量运动有利于身体健康。', 'Mỗi ngày kiên trì vận động điều độ rất có lợi cho sức khỏe.', NOW(), NOW()),
  ('丈夫', 'zhàngfu', 'zhangfu', 'Trượng Phu', 'Chồng', 2, 'HSK 3.0', 487, '2', '2025', '名', NULL, '92', '她的丈夫是一位资深的大学教授。', 'Chồng của cô ấy là một giáo sư đại học kỳ cựu.', NOW(), NOW()),
  ('这么', 'zhème', 'zheme', 'Giá Ma', 'Như thế này, như vậy', 2, 'HSK 3.0', 488, '2', '2025', '代', NULL, '92', '你怎么走得这么快，等等我！', 'Sao bạn đi nhanh thế này, đợi tôi với!', NOW(), NOW()),
  ('这样', 'zhèyàng', 'zheyang', 'Giá Dạng', 'Như vậy, thế này, kiểu này', 2, 'HSK 3.0', 489, '2', '2025', '代', NULL, '92', '这样做是完全正确的，不要改变。', 'Làm thế này là hoàn toàn chính xác, đừng thay đổi.', NOW(), NOW()),
  ('周', 'zhōu', 'zhou', 'Chu', 'Tuần, chu kỳ, vòng quanh', 2, 'HSK 3.0', 492, '2', '2025', '名、（量）', NULL, '92', '我们下周一有一个很重要的中文考试。', 'Thứ hai tuần sau chúng tôi có một kỳ thi tiếng Trung rất quan trọng.', NOW(), NOW()),
  ('自己', 'zìjǐ', 'ziji', 'Tự Kỷ', 'Tự mình, bản thân', 2, 'HSK 3.0', 494, '2', '2025', '代', NULL, '92', '有些事情要靠自己去努力完成。', 'Có những việc phải dựa vào bản thân tự nỗ lực hoàn thành.', NOW(), NOW()),
  ('足球', 'zúqiú', 'zuqiu', 'Túc Cầu', 'Bóng đá, quả bóng đá', 2, 'HSK 3.0', 497, '2', '2025', '名', NULL, '92', '世界杯足球比赛吸引了全世界的球迷。', 'Trận đấu bóng đá World Cup đã thu hút người hâm mộ bóng đá trên toàn thế giới.', NOW(), NOW()),
  ('阿姨', 'āyí', 'ayi', 'A Di', 'Dì, cô, bác gái', 3, 'HSK 3.0', 501, '3', '2025', '名', NULL, '92', '王阿姨热心地帮我们照看孩子。', 'Dì Vương nhiệt tình giúp chúng tôi trông nom lũ trẻ.', NOW(), NOW()),
  ('矮', 'ǎi', 'ai', 'Ải', 'Thấp, lùn', 3, 'HSK 3.0', 502, '3', '2025', '形', NULL, '92', '弟弟比哥哥矮了半个头。', 'Em trai thấp hơn anh trai nửa cái đầu.', NOW(), NOW()),
  ('爱人', 'àiren', 'airen', 'Ái Nhân', 'Vợ, chồng, người bạn đời', 3, 'HSK 3.0', 503, '3', '2025', '名', NULL, '92', '他和他的爱人感情非常融洽。', 'Anh ấy và người bạn đời tình cảm rất hòa thuận.', NOW(), NOW()),
  ('安静', 'ānjìng', 'anjing', 'An Tĩnh', 'Yên tĩnh, tĩnh lặng, trật tự', 3, 'HSK 3.0', 504, '3', '2025', '形', NULL, '92', '请大家在图书馆里保持安静。', 'Xin mọi người hãy giữ trật tự trong thư viện.', NOW(), NOW()),
  ('安全', 'ānquán', 'anquan', 'An Toàn', 'An toàn', 3, 'HSK 3.0', 505, '3', '2025', '形', NULL, '92', '过马路时一定要注意交通安全。', 'Khi qua đường nhất định phải chú ý an toàn giao thông.', NOW(), NOW()),
  ('把', 'bǎ', 'ba', 'Bả', 'Cầm, nắm, chiếc (lượng từ ghế/dao/ô), câu chữ 把', 3, 'HSK 3.0', 506, '3', '2025', '量、介', NULL, '92', '请你把桌子上的书递给我。', 'Xin bạn hãy đưa cuốn sách trên bàn cho tôi.', NOW(), NOW()),
  ('搬', 'bān', 'ban', 'Ban', 'Dọn, khiêng, chuyển (đồ đạc)', 3, 'HSK 3.0', 507, '3', '2025', '动', NULL, '92', '我们一起把这台重机器搬出去。', 'Chúng ta cùng khiêng cỗ máy nặng này ra ngoài.', NOW(), NOW()),
  ('班级', 'bānjí', 'banji', 'Ban Cấp', 'Lớp học, cấp lớp', 3, 'HSK 3.0', 508, '3', '2025', '名', NULL, '92', '我们班级一共有三十名学生。', 'Lớp học của chúng tôi có tổng cộng ba mươi học sinh.', NOW(), NOW()),
  ('搬家', 'bānjiā', 'banjia', 'Ban Gia', 'Chuyển nhà, dọn nhà', 3, 'HSK 3.0', 509, '3', '2025', '动', NULL, '92', '下个月我们全家就要搬家了。', 'Tháng sau cả gia đình chúng tôi sẽ chuyển nhà rồi.', NOW(), NOW()),
  ('办', 'bàn', 'ban', 'Biện', 'Làm, xử lý, giải quyết', 3, 'HSK 3.0', 510, '3', '2025', '动', NULL, '92', '这件事情你打算怎么去办？', 'Chuyện này bạn dự định giải quyết như thế nào?', NOW(), NOW()),
  ('办法', 'bànfǎ', 'banfa', 'Biện Pháp', 'Biện pháp, cách thức, phương pháp', 3, 'HSK 3.0', 511, '3', '2025', '名', NULL, '92', '大家都在想办法解决这个难题。', 'Mọi người đều đang nghĩ biện pháp giải quyết vấn đề khó khăn này.', NOW(), NOW()),
  ('办公室', 'bàngōngshì', 'bangongshi', 'Biện Công Thất', 'Văn phòng làm việc', 3, 'HSK 3.0', 512, '3', '2025', '名', NULL, '92', '王经理现在正在办公室处理文件。', 'Giám đốc Vương hiện đang ở văn phòng xử lý văn kiện.', NOW(), NOW()),
  ('帮助', 'bāngzhù', 'bangzhu', 'Bang Trợ', 'Giúp đỡ, viện trợ', 3, 'HSK 3.0', 514, '3', '2025', '动', NULL, '92', '非常感谢你在我困难时给我的帮助。', 'Vô cùng cảm ơn sự giúp đỡ bạn đã dành cho tôi khi tôi gặp khó khăn.', NOW(), NOW()),
  ('饱', 'bǎo', 'bao', 'Bão', 'No, no nê', 3, 'HSK 3.0', 515, '3', '2025', '形', NULL, '92', '今天中午的菜太丰富，我都吃饱了。', 'Bữa trưa hôm nay nhiều món quá, tôi ăn no rồi.', NOW(), NOW()),
  ('报纸', 'bàozhǐ', 'baozhi', 'Báo Chỉ', 'Báo, tờ báo', 3, 'HSK 3.0', 516, '3', '2025', '名', NULL, '92', '爷爷每天早晨都有看报纸的习惯。', 'Ông nội mỗi buổi sáng đều có thói quen đọc báo.', NOW(), NOW()),
  ('北方', 'běifāng', 'beifang', 'Bắc Phương', 'Phương bắc, miền bắc', 3, 'HSK 3.0', 518, '3', '2025', '名', NULL, '92', '中国的北方冬天经常下大雪。', 'Miền bắc Trung Quốc vào mùa đông thường xuyên có tuyết rơi lớn.', NOW(), NOW()),
  ('被', 'bèi', 'bei', 'Bị', 'Bị, được (câu bị động)', 3, 'HSK 3.0', 519, '3', '2025', '介', NULL, '92', '桌子上的蛋糕被调皮的小猫吃掉了。', 'Miếng bánh ngọt trên bàn đã bị chú mèo nghịch ngợm ăn mất rồi.', NOW(), NOW()),
  ('笔记', 'bǐjì', 'biji', 'Bút Ký', 'Ghi chép, bài ghi, biên bản', 3, 'HSK 3.0', 520, '3', '2025', '名', NULL, '92', '上课时要认真做好课堂笔记。', 'Trong giờ học cần chăm chú ghi chép bài đầy đủ.', NOW(), NOW()),
  ('比较', 'bǐjiào', 'bijiao', 'Tỉ Giảo', 'So sánh, khá, tương đối', 3, 'HSK 3.0', 521, '3', '2025', '动、介、副', NULL, '93', '这门课程比我想象中要比较容易。', 'Môn học này tương đối dễ hơn so với tôi tưởng tượng.', NOW(), NOW()),
  ('笔记本', 'bǐjìběn', 'bijiben', 'Bút Ký Bản', 'Vở ghi chép, máy tính xách tay', 3, 'HSK 3.0', 522, '3', '2025', '名', NULL, '93', '这台笔记本电脑轻巧便携，很适合办公。', 'Chiếc máy tính xách tay này nhẹ nhàng tiện lợi, rất hợp cho công việc văn phòng.', NOW(), NOW()),
  ('比如', 'bǐrú', 'biru', 'Tỉ Như', 'Ví dụ như, chẳng hạn', 3, 'HSK 3.0', 523, '3', '2025', '动', NULL, '93', '很多水果维生素含量很高，比如橙子和猕猴桃。', 'Nhiều loại hoa quả hàm lượng vitamin rất cao, ví dụ như cam và kiwi.', NOW(), NOW()),
  ('比赛', 'bǐsài', 'bisai', 'Tỉ Tái', 'Thi đấu, trận đấu, cuộc thi', 3, 'HSK 3.0', 524, '3', '2025', '动、名', NULL, '93', '他们学校的足球队赢得了这场比赛。', 'Đội bóng đá của trường họ đã thắng trong trận thi đấu này.', NOW(), NOW()),
  ('必须', 'bìxū', 'bixu', 'Tất Tu', 'Phải, bắt buộc phải', 3, 'HSK 3.0', 525, '3', '2025', '副', NULL, '93', '明天出发前大家必须带齐有效证件。', 'Trước khi xuất phát vào ngày mai mọi người bắt buộc phải mang đầy đủ giấy tờ tùy thân.', NOW(), NOW()),
  ('变', 'biàn', 'bian', 'Biến', 'Biến đổi, thay đổi, trở nên', 3, 'HSK 3.0', 526, '3', '2025', '动', NULL, '93', '几场秋雨过后，天气渐渐变凉了。', 'Sau vài cơn mưa thu, thời tiết dần dần trở nên se lạnh.', NOW(), NOW()),
  ('遍', 'biàn', 'bian', 'Biến', 'Lần, lượt (từ đầu đến cuối)', 3, 'HSK 3.0', 527, '3', '2025', '量', NULL, '93', '这篇长文章我认真读了三遍。', 'Bài văn dài này tôi đã chăm chú đọc ba lần từ đầu đến cuối.', NOW(), NOW()),
  ('变成', 'biànchéng', 'biancheng', 'Biến Thành', 'Biến thành, trở thành', 3, 'HSK 3.0', 528, '3', '2025', '动', NULL, '93', '经过刻苦努力，他变成了一位优秀的翻译官。', 'Qua nỗ lực miệt mài, anh ấy đã trở thành một phiên dịch viên ưu tú.', NOW(), NOW()),
  ('变化', 'biànhuà', 'bianhua', 'Biến Hoá', 'Biến đổi, sự thay đổi', 3, 'HSK 3.0', 529, '3', '2025', '动、名', NULL, '93', '最近几年，这座城市发生了巨大的变化。', 'Những năm gần đây, thành phố này đã diễn ra sự thay đổi to lớn.', NOW(), NOW()),
  ('表演', 'biǎoyǎn', 'biaoyan', 'Biểu Diễn', 'Biểu diễn, trình diễn', 3, 'HSK 3.0', 530, '3', '2025', '动', NULL, '93', '杂技团演员的表演赢得了全场热烈的掌声。', 'Màn biểu diễn của diễn viên đoàn xiếc đã nhận được tràng pháo tay nồng nhiệt từ khán phòng.', NOW(), NOW()),
  ('宾馆', 'bīnguǎn', 'binguan', 'Tân Quán', 'Khách sạn, nhà khách', 3, 'HSK 3.0', 533, '3', '2025', '名', NULL, '93', '这家涉外宾馆的设施非常现代化。', 'Cơ sở vật chất của khách sạn đón khách quốc tế này rất hiện đại.', NOW(), NOW()),
  ('冰', 'bīng', 'bing', 'Băng', 'Băng, đá lạnh', 3, 'HSK 3.0', 534, '3', '2025', '名、（动）', NULL, '93', '湖面上结了一层厚厚坚硬的冰。', 'Trên mặt hồ đã đóng một lớp băng dày và cứng.', NOW(), NOW()),
  ('冰激凌', 'bīngjīlíng', 'bingjiling', 'Băng Kích Lăng', 'Kem, kem que', 3, 'HSK 3.0', 535, '3', '2025', '名', NULL, '93', '炎热的夏日里吃一支冰激凌真解渴。', 'Trong ngày hè nóng nực ăn một que kem thật là đã khát.', NOW(), NOW()),
  ('冰箱', 'bīngxiāng', 'bingxiang', 'Băng Sương', 'Tủ lạnh', 3, 'HSK 3.0', 536, '3', '2025', '名', NULL, '93', '请把喝不完的鲜牛奶放进冰箱保鲜。', 'Xin hãy cất chỗ sữa tươi chưa uống hết vào tủ lạnh để bảo quản.', NOW(), NOW()),
  ('不但', 'búdàn', 'budan', 'Bất Đãn', 'Không những, không chỉ', 3, 'HSK 3.0', 538, '3', '2025', '连', NULL, '93', '他不但会说流利的汉语，还会说法语。', 'Anh ấy không những nói lưu loát tiếng Trung mà còn biết nói tiếng Pháp.', NOW(), NOW()),
  ('不见', 'bújiàn', 'bujian', 'Bất Kiến', 'Mất hút, không thấy, biến mất', 3, 'HSK 3.0', 539, '3', '2025', '动', NULL, '93', '刚刚还在桌上的钢笔怎么突然不见了？', 'Chiếc bút máy vừa nãy còn trên bàn sao bỗng nhiên không thấy đâu nữa?', NOW(), NOW()),
  ('不同', 'bù tóng', 'butong', 'Bất Đồng', 'Khác nhau, không giống', 3, 'HSK 3.0', 541, '3', '2025', '', NULL, '93', '每个人对幸福的定义都有所不同。', 'Mỗi người đối với định nghĩa về hạnh phúc đều có điểm khác nhau.', NOW(), NOW()),
  ('不久', 'bùjiǔ', 'bujiu', 'Bất Cửu', 'Không lâu, chẳng bao lâu', 3, 'HSK 3.0', 542, '3', '2025', '形', NULL, '93', '他们结婚不久就迎来了可爱的宝宝。', 'Họ kết hôn chẳng bao lâu thì đón chào một em bé kháu khỉnh.', NOW(), NOW()),
  ('不行', 'bùxíng', 'buxing', 'Bất Hành', 'Không được, không thể', 3, 'HSK 3.0', 543, '3', '2025', '动、形', NULL, '93', '这样违反纪律的行为是绝对不行的。', 'Hành vi vi phạm kỷ luật như vậy là tuyệt đối không được.', NOW(), NOW()),
  ('才', 'cái', 'cai', 'Tài', 'Mới, vừa mới, tài năng', 3, 'HSK 3.0', 544, '3', '2025', '副', '1', '93', '经过一番周折，我们直到现在才到达目的地。', 'Sau bao trắc trở, mãi đến bây giờ chúng tôi mới tới được đích đến.', NOW(), NOW()),
  ('菜单', 'càidān', 'caidan', 'Thái Đơn', 'Thực đơn, menu', 3, 'HSK 3.0', 545, '3', '2025', '名', NULL, '93', '服务员，请给我们拿一份最新的菜单。', 'Phục vụ viên, xin hãy đem cho chúng tôi một cuốn thực đơn mới nhất.', NOW(), NOW()),
  ('参加', 'cānjiā', 'canjia', 'Tham Gia', 'Tham gia, tham dự', 3, 'HSK 3.0', 546, '3', '2025', '动', NULL, '93', '下周六我打算参加学校举行的汉字听写比赛。', 'Thứ bảy tuần sau tôi dự định tham gia cuộc thi nghe viết chữ Hán của trường.', NOW(), NOW()),
  ('草', 'cǎo', 'cao', 'Thảo', 'Cỏ, cây cỏ', 3, 'HSK 3.0', 547, '3', '2025', '名', NULL, '93', '山坡上长满了茂盛碧绿的小草。', 'Trên sườn núi mọc đầy những ngọn cỏ xanh tốt um tùm.', NOW(), NOW()),
  ('草地', 'cǎodì', 'caodi', 'Thảo Địa', 'Bãi cỏ, đồng cỏ', 3, 'HSK 3.0', 548, '3', '2025', '名', NULL, '93', '孩子们在广阔的草地上开心地踢足球。', 'Lũ trẻ đang vui vẻ đá bóng trên bãi cỏ rộng thênh thang.', NOW(), NOW()),
  ('层', 'céng', 'ceng', 'Tằng', 'Tầng (nhà), lớp (bụi, sơn)', 3, 'HSK 3.0', 549, '3', '2025', '量', NULL, '93', '我们的汉语教室在教学楼的三层。', 'Phòng học tiếng Trung của chúng tôi ở tầng ba của tòa nhà giảng dạy.', NOW(), NOW()),
  ('查', 'chá', 'cha', 'Tra', 'Tra cứu, kiểm tra', 3, 'HSK 3.0', 550, '3', '2025', '动', NULL, '93', '遇到不认识的生词可以用手机查词典。', 'Khi gặp từ mới không biết có thể dùng điện thoại tra từ điển.', NOW(), NOW()),
  ('差不多', 'chàbuduō', 'chabuduo', 'Sai Bất Đa', 'Xấp xỉ, gần như, suýt soát', 3, 'HSK 3.0', 552, '3', '2025', '形、副', NULL, '93', '两个孩子的年龄差不多大，玩得很投机。', 'Độ tuổi của hai đứa trẻ xấp xỉ nhau, chơi với nhau rất hợp.', NOW(), NOW()),
  ('尝', 'cháng', 'chang', 'Thường', 'Nếm thử, thưởng thức', 3, 'HSK 3.0', 553, '3', '2025', '动', NULL, '93', '你快来尝尝我亲手做的新鲜草莓蛋糕。', 'Bạn mau tới nếm thử chiếc bánh kem dâu tây do tự tay tôi làm.', NOW(), NOW()),
  ('常见', 'cháng jiàn', 'changjian', 'Thường Kiến', 'Thường thấy, phổ biến', 3, 'HSK 3.0', 555, '3', '2025', '', NULL, '93', '这是一种在北方很常见的落叶植物。', 'Đây là một loại thực vật rụng lá rất thường thấy ở miền Bắc.', NOW(), NOW()),
  ('常用', 'cháng yòng', 'changyong', 'Thường Dụng', 'Thường dùng, thông dụng', 3, 'HSK 3.0', 556, '3', '2025', '', NULL, '93', '这本小册子收录了三百个常用汉字。', 'Cuốn cẩm nang nhỏ này thu thập ba trăm chữ Hán thông dụng.', NOW(), NOW()),
  ('衬衫', 'chènshān', 'chenshan', 'Sấn Sam', 'Áo sơ mi', 3, 'HSK 3.0', 558, '3', '2025', '名', NULL, '93', '他穿了一件洁白挺括的衬衫去面试。', 'Anh ấy mặc một chiếc áo sơ mi trắng tinh phẳng phiu đi phỏng vấn.', NOW(), NOW()),
  ('成绩', 'chéngjì', 'chengji', 'Thành Tích', 'Thành tích, kết quả học tập', 3, 'HSK 3.0', 559, '3', '2025', '名', NULL, '93', '经过刻苦努力，她的期末考试成绩名列前茅。', 'Nhờ nỗ lực chăm chỉ, thành tích thi cuối kỳ của cô ấy đứng hàng đầu.', NOW(), NOW()),
  ('城市', 'chéngshì', 'chengshi', 'Thành Thị', 'Thành phố, đô thị', 3, 'HSK 3.0', 560, '3', '2025', '名', NULL, '93', '上海是一座充满生机与机遇的现代化大城市。', 'Thượng Hải là một thành phố lớn hiện đại tràn đầy sức sống và cơ hội.', NOW(), NOW()),
  ('迟到', 'chídào', 'chidao', 'Trì Đáo', 'Trễ, muộn', 3, 'HSK 3.0', 561, '3', '2025', '动', NULL, '94', '因为早高峰堵车，他今天上班迟到了十分钟。', 'Vì tắc đường vào giờ cao điểm buổi sáng, hôm nay anh ấy đi làm muộn mười phút.', NOW(), NOW()),
  ('出发', 'chūfā', 'chufa', 'Xuất Phát', 'Xuất phát, khởi hành', 3, 'HSK 3.0', 562, '3', '2025', '动', NULL, '94', '明天清晨六点我们准时在校门口集合出发。', 'Sáu giờ sáng mai chúng tôi tập trung đúng giờ ở cổng trường để xuất phát.', NOW(), NOW()),
  ('出生', 'chūshēng', 'chusheng', 'Xuất Sinh', 'Sinh ra, chào đời', 3, 'HSK 3.0', 563, '3', '2025', '动', NULL, '94', '他出生在一个风景优美的水乡小镇。', 'Anh ấy sinh ra ở một thị trấn sông nước phong cảnh hữu tình.', NOW(), NOW()),
  ('出院', 'chūyuàn', 'chuyuan', 'Xuất Viện', 'Xuất viện, ra viện', 3, 'HSK 3.0', 564, '3', '2025', '动', NULL, '94', '经过医生的精心治疗，奶奶今天终于出院了。', 'Sau thời gian được bác sĩ tận tình điều trị, bà nội hôm nay rốt cuộc đã xuất viện rồi.', NOW(), NOW()),
  ('初中', 'chūzhōng', 'chuzhong', 'Sơ Trung', 'Trường cấp hai, trung học cơ sở', 3, 'HSK 3.0', 565, '3', '2025', '名', NULL, '94', '我们是从初中开始就同班的好朋友。', 'Chúng tôi là đôi bạn thân học cùng lớp từ thời cấp hai.', NOW(), NOW()),
  ('除了', 'chúle', 'chule', 'Trừ Liễu', 'Ngoài ra, trừ... ra', 3, 'HSK 3.0', 566, '3', '2025', '介', NULL, '94', '除了英语以外，他还自学了简单的日常日语。', 'Ngoài tiếng Anh ra, anh ấy còn tự học thêm tiếng Nhật giao tiếp đơn giản.', NOW(), NOW()),
  ('船', 'chuán', 'chuan', 'Thuyền', 'Thuyền, tàu, đò', 3, 'HSK 3.0', 567, '3', '2025', '名', NULL, '94', '江面上缓缓驶过几艘满载货物的大船。', 'Trên mặt sông chầm chậm lướt qua mấy con thuyền lớn chở đầy hàng hóa.', NOW(), NOW()),
  ('春天', 'chūntiān', 'chuntian', 'Xuân Thiên', 'Mùa xuân', 3, 'HSK 3.0', 568, '3', '2025', '名', NULL, '94', '春天万物复苏，公园里百花齐放格外绚丽。', 'Mùa xuân vạn vật hồi sinh, trong công viên trăm hoa đua nở vô cùng rực rỡ.', NOW(), NOW()),
  ('词典', 'cídiǎn', 'cidian', 'Từ Điển', 'Từ điển', 3, 'HSK 3.0', 569, '3', '2025', '名', NULL, '94', '遇到生词时查词典是最扎实的学习习惯。', 'Khi gặp từ mới tra từ điển là thói quen học tập vững chắc nhất.', NOW(), NOW()),
  ('聪明', 'cōngmíng', 'congming', 'Thông Minh', 'Thông minh, lanh lợi', 3, 'HSK 3.0', 570, '3', '2025', '形', NULL, '94', '小王非常聪明伶俐，总能迅速领会领导的意图。', 'Tiểu Vương rất thông minh lanh lợi, luôn nhanh chóng nắm bắt được ý đồ của cấp trên.', NOW(), NOW()),
  ('打扫', 'dǎsǎo', 'dasao', 'Đả Tảo', 'Quét dọn, dọn dẹp', 3, 'HSK 3.0', 571, '3', '2025', '动', NULL, '94', '周末全家人一起把屋子彻底打扫得干干净净。', 'Cuối tuần cả nhà cùng nhau quét dọn căn nhà sạch sẽ tinh tươm.', NOW(), NOW()),
  ('打算', 'dǎsuàn', 'dasuan', 'Đả Toán', 'Dự định, kế hoạch', 3, 'HSK 3.0', 572, '3', '2025', '动、名', NULL, '94', '放假后我打算去拜访多年未见的老朋友。', 'Sau khi nghỉ lễ tôi dự định đi thăm người bạn cũ nhiều năm chưa gặp.', NOW(), NOW()),
  ('大概', 'dàgài', 'dagai', 'Đại Khái', 'Đại khái, khoảng chừng', 3, 'HSK 3.0', 573, '3', '2025', '形、副、（名）', NULL, '94', '从这里坐车到市中心大概需要四十分钟。', 'Từ đây đi xe vào trung tâm thành phố đại khái cần bốn mươi phút.', NOW(), NOW()),
  ('大人', 'dàren', 'daren', 'Đại Nhân', 'Người lớn, người trưởng thành', 3, 'HSK 3.0', 574, '3', '2025', '名', NULL, '94', '大人们正在客厅里商量春节的聚会安排。', 'Người lớn đang ở phòng khách bàn bạc sắp xếp buổi tụ họp dịp Tết.', NOW(), NOW()),
  ('大小', 'dàxiǎo', 'daxiao', 'Đại Tiểu', 'Kích cỡ, lớn nhỏ, độ to nhỏ', 3, 'HSK 3.0', 575, '3', '2025', '名', NULL, '94', '这双皮鞋的大小正合适，穿着很舒服。', 'Kích cỡ của đôi giày da này vừa vặn, đi rất êm chân.', NOW(), NOW()),
  ('大熊猫', 'dàxióngmāo', 'daxiongmao', 'Đại Hùng Miêu', 'Gấu trúc lớn', 3, 'HSK 3.0', 576, '3', '2025', '名', NULL, '94', '憨态可掬的大熊猫深受世界各国人民的喜爱。', 'Những chú gấu trúc lớn ngộ nghĩnh đáng yêu được người dân khắp thế giới yêu thích.', NOW(), NOW()),
  ('大衣', 'dàyī', 'dayi', 'Đại Y', 'Áo khoác lớn, áo choàng, áo dạ', 3, 'HSK 3.0', 577, '3', '2025', '名', NULL, '94', '冬天出门一定要穿上厚实保暖的羊毛大衣。', 'Mùa đông ra ngoài nhất định phải mặc chiếc áo khoác dạ len dày dặn giữ ấm.', NOW(), NOW()),
  ('带', 'dài', 'dai', 'Đới', 'Mang theo, dẫn dắt, dây đai', 3, 'HSK 3.0', 578, '3', '2025', '动、（名）', NULL, '94', '明天去郊游记得带好雨伞和足够的水。', 'Ngày mai đi dã ngoại nhớ mang theo ô và đủ nước uống.', NOW(), NOW()),
  ('担心', 'dānxīn', 'danxin', 'Đảm Tâm', 'Lo lắng, lo âu, bận tâm', 3, 'HSK 3.0', 579, '3', '2025', '动', NULL, '94', '妈妈总是担心一个人在异国他乡求学的我。', 'Mẹ lúc nào cũng lo lắng cho tôi một mình học tập nơi đất khách quê người.', NOW(), NOW()),
  ('蛋糕', 'dàngāo', 'dangao', 'Đản Cao', 'Bánh gato, bánh kem', 3, 'HSK 3.0', 580, '3', '2025', '名', NULL, '94', '生日聚会上，大家一起品尝美味的水果蛋糕。', 'Trong bữa tiệc sinh nhật, mọi người cùng thưởng thức chiếc bánh kem hoa quả thơm ngon.', NOW(), NOW()),
  ('当然', 'dāngrán', 'dangran', 'Đương Nhiên', 'Đương nhiên, tất nhiên', 3, 'HSK 3.0', 581, '3', '2025', '副', NULL, '94', '朋友有难，我们当然应该全力以赴提供帮助。', 'Bạn bè gặp khó khăn, chúng ta đương nhiên nên dốc hết sức giúp đỡ.', NOW(), NOW()),
  ('到处', 'dàochù', 'daochu', 'Đáo Xứ', 'Khắp nơi, mọi nơi, chốn chốn', 3, 'HSK 3.0', 582, '3', '2025', '副', NULL, '94', '春天一到，漫山遍野到处盛开着五颜六色的野花。', 'Mùa xuân vừa đến, khắp đồi núi mọi nơi nở rộ những bông hoa dại muôn màu muôn vẻ.', NOW(), NOW()),
  ('得', 'dé', 'de', 'Đắc', 'Được, đạt được, nhận được', 3, 'HSK 3.0', 583, '3', '2025', '动', NULL, '94', '他在这次中文朗诵大赛中得了一等奖。', 'Cậu ấy đã đạt được giải nhất trong cuộc thi ngâm thơ tiếng Trung lần này.', NOW(), NOW()),
  ('得分', 'défēn', 'defen', 'Đắc Phân', 'Ghi điểm, đạt điểm số', 3, 'HSK 3.0', 585, '3', '2025', '动、名', NULL, '94', '在前锋的精彩配合下，校足球队率先得分。', 'Dưới sự phối hợp ăn ý của tiền đạo, đội bóng đá trường đã dẫn trước ghi điểm.', NOW(), NOW()),
  ('的话', 'dehuà', 'dehua', 'Đích Thoại', 'Nếu, nếu như (ở cuối phân câu)', 3, 'HSK 3.0', 586, '3', '2025', '助', NULL, '94', '如果明天不下雨的话，我们就按原计划去爬山。', 'Nếu ngày mai trời không mưa, chúng ta sẽ theo kế hoạch cũ đi leo núi.', NOW(), NOW()),
  ('得', 'děi', 'dei', 'Đắc', 'Phải, cần phải (trợ động từ)', 3, 'HSK 3.0', 587, '3', '2025', '动', NULL, '94', '时间不早了，我得马上赶回公司处理紧急事务。', 'Thời gian không còn sớm nữa, tôi phải mau chóng quay về công ty xử lý việc gấp.', NOW(), NOW()),
  ('灯', 'dēng', 'deng', 'Đăng', 'Đèn, ngọn đèn, cây đèn', 3, 'HSK 3.0', 588, '3', '2025', '名', NULL, '94', '夜晚的书桌前，台灯散发着柔和温馨的光线。', 'Trước bàn học ban đêm, ngọn đèn bàn tỏa ra ánh sáng ấm áp dịu nhẹ.', NOW(), NOW()),
  ('电梯', 'diàntī', 'dianti', 'Điện Thê', 'Thang máy', 3, 'HSK 3.0', 594, '3', '2025', '名', NULL, '94', '高峰期乘坐电梯请大家自觉遵守秩序排队。', 'Giờ cao điểm đi thang máy xin mọi người hãy tự giác tuân thủ trật tự xếp hàng.', NOW(), NOW()),
  ('电子书', 'diànzǐshū', 'dianzishu', 'Điện Tử Thư', 'Sách điện tử', 3, 'HSK 3.0', 595, '3', '2025', '名', NULL, '94', '用阅读器看电子书非常方便，随时随地都能学。', 'Dùng máy đọc sách xem sách điện tử rất tiện lợi, có thể học mọi lúc mọi nơi.', NOW(), NOW()),
  ('丢', 'diū', 'diu', 'Đâu', 'Vứt, đánh mất, rơi', 3, 'HSK 3.0', 596, '3', '2025', '动', NULL, '94', '他不小心把刚刚借来的图书给弄丢了。', 'Anh ấy sơ ý làm mất cuốn sách vừa mới mượn về.', NOW(), NOW()),
  ('东北', 'dōngběi', 'dongbei', 'Đông Bắc', 'Vùng đông bắc', 3, 'HSK 3.0', 598, '3', '2025', '名', NULL, '94', '中国的东北地区有广袤肥沃的黑土地和壮丽雪景。', 'Vùng đông bắc Trung Quốc có vùng đất đen màu mỡ bao la và cảnh tuyết tráng lệ.', NOW(), NOW()),
  ('东方', 'dōngfāng', 'dongfang', 'Đông Phương', 'Phương đông, phía đông', 3, 'HSK 3.0', 599, '3', '2025', '名', NULL, '94', '太阳从东方冉冉升起，照亮了崭新的一天。', 'Mặt trời từ phương đông từ từ nhô lên, chiếu sáng một ngày mới tinh khôi.', NOW(), NOW()),
  ('东南', 'dōngnán', 'dongnan', 'Đông Nam', 'Đông nam, phía đông nam', 3, 'HSK 3.0', 600, '3', '2025', '名', NULL, '94', '东南亚地区以宜人的热带海岛风光闻名世界。', 'Khu vực Đông Nam Á nổi tiếng thế giới với phong cảnh đảo nhiệt đới dễ chịu.', NOW(), NOW()),
  ('冬天', 'dōngtiān', 'dongtian', 'Đông Thiên', 'Mùa đông', 3, 'HSK 3.0', 601, '3', '2025', '名', NULL, '95', '北方冬天的气温常常会降到零下十几度。', 'Nhiệt độ mùa đông ở miền bắc thường giảm xuống âm mười mấy độ.', NOW(), NOW()),
  ('懂得', 'dǒngde', 'dongde', 'Đổng Đắc', 'Hiểu được, thấu hiểu', 3, 'HSK 3.0', 602, '3', '2025', '动', NULL, '95', '经过老师的循循善诱，他终于懂得如何解这道题了。', 'Nhờ thầy giáo ân cần chỉ bảo, cậu ấy rốt cuộc đã hiểu được cách giải bài toán này.', NOW(), NOW()),
  ('动物', 'dòngwù', 'dongwu', 'Động Vật', 'Động vật, con vật', 3, 'HSK 3.0', 603, '3', '2025', '名', NULL, '95', '关爱和保护身边的流浪小动物是善良的表现。', 'Yêu thương và bảo vệ động vật nhỏ lang thang quanh mình là biểu hiện của lòng nhân ái.', NOW(), NOW()),
  ('动物园', 'dòngwùyuán', 'dongwuyuan', 'Động Vật Viên', 'Vườn thú, sở thú', 3, 'HSK 3.0', 604, '3', '2025', '名', NULL, '95', '周末许多家长带着孩子去动物园观察各种鸟类。', 'Cuối tuần nhiều phụ huynh dẫn con đi sở thú quan sát các loài chim.', NOW(), NOW()),
  ('短', 'duǎn', 'duan', 'Đoản', 'Ngắn (độ dài, thời gian)', 3, 'HSK 3.0', 605, '3', '2025', '形', NULL, '95', '这段假期虽然很短，但我们过得非常充实愉快。', 'Kỳ nghỉ này tuy rất ngắn nhưng chúng tôi đã trải qua vô cùng trọn vẹn và vui vẻ.', NOW(), NOW()),
  ('短裤', 'duǎnkù', 'duanku', 'Đoản Khố', 'Quần đùi, quần soóc', 3, 'HSK 3.0', 606, '3', '2025', '名', NULL, '95', '夏天气温高，大家都喜欢穿轻爽透气的短裤。', 'Mùa hè nhiệt độ cao, mọi người đều thích mặc quần soóc thoáng mát nhẹ nhàng.', NOW(), NOW()),
  ('段', 'duàn', 'duan', 'Đoạn', 'Đoạn, quãng (thời gian, đường)', 3, 'HSK 3.0', 607, '3', '2025', '量', NULL, '95', '这段精彩的课文需要大家在下课后背诵下来。', 'Đoạn văn bài khóa đặc sắc này cần mọi người học thuộc sau giờ học.', NOW(), NOW()),
  ('锻炼', 'duànliàn', 'duanlian', 'Đoàn Luyện', 'Rèn luyện, tập luyện', 3, 'HSK 3.0', 608, '3', '2025', '动', NULL, '95', '每天坚持慢跑锻炼有助于增强心肺功能。', 'Mỗi ngày kiên trì chạy bộ rèn luyện giúp tăng cường chức năng tim phổi.', NOW(), NOW()),
  ('对话', 'duìhuà', 'duihua', 'Đối Thoại', 'Đối thoại, hội thoại', 3, 'HSK 3.0', 609, '3', '2025', '动', NULL, '95', '两位老朋友在咖啡馆里进行着亲切的面对面对话。', 'Hai người bạn cũ đang có cuộc đối thoại trực tiếp thân mật trong quán cà phê.', NOW(), NOW()),
  ('而且', 'érqiě', 'erqie', 'Nhi Thả', 'Mà còn, hơn nữa', 3, 'HSK 3.0', 611, '3', '2025', '连', NULL, '95', '她不仅歌唱得动听，而且舞姿也十分优美。', 'Cô ấy không chỉ hát rất êm tai mà hơn nữa vũ điệu cũng vô cùng uyển chuyển.', NOW(), NOW()),
  ('耳朵', 'ěrduo', 'erduo', 'Nhĩ Đoá', 'Tai, đôi tai', 3, 'HSK 3.0', 612, '3', '2025', '名', NULL, '95', '保护耳朵健康，平时听音乐音量不要开得过大。', 'Bảo vệ đôi tai khỏe mạnh, thường ngày nghe nhạc âm lượng đừng mở quá to.', NOW(), NOW()),
  ('耳机', 'ěrjī', 'erji', 'Nhĩ Cơ', 'Tai nghe', 3, 'HSK 3.0', 613, '3', '2025', '名', NULL, '95', '在安静的公共自习室里听录音请一定要戴上耳机。', 'Trong phòng tự học công cộng yên tĩnh nghe băng ghi âm xin nhất định phải đeo tai nghe.', NOW(), NOW()),
  ('发', 'fā', 'fa', 'Phát', 'Gửi, phát, xuất phát, phát ra', 3, 'HSK 3.0', 614, '3', '2025', '动', NULL, '95', '我已经把修改好的电子版报告发到您的邮箱里了。', 'Tôi đã gửi bản báo cáo điện tử đã sửa vào hòm thư của bạn rồi.', NOW(), NOW()),
  ('发烧', 'fāshāo', 'fashao', 'Phát Thiêu', 'Phát sốt, sốt', 3, 'HSK 3.0', 615, '3', '2025', '动', NULL, '95', '孩子今天额头发烧发烫，需要马上送医院检查。', 'Trán em bé hôm nay sốt nóng ran, cần lập tức đưa đến bệnh viện khám.', NOW(), NOW()),
  ('发生', 'fāshēng', 'fasheng', 'Phát Sinh', 'Xảy ra, phát sinh', 3, 'HSK 3.0', 616, '3', '2025', '动', NULL, '95', '十字路口发生了一起因闯红灯引起的轻微擦伤事故。', 'Tại ngã tư đã xảy ra một vụ va quẹt nhẹ do vượt đèn đỏ.', NOW(), NOW()),
  ('发现', 'fāxiàn', 'faxian', 'Phát Hiện', 'Phát hiện, nhận ra', 3, 'HSK 3.0', 617, '3', '2025', '动', NULL, '95', '科学家在显微镜下发现了这种全新微生物的结构。', 'Các nhà khoa học dưới kính hiển vi đã phát hiện ra cấu trúc của loài vi sinh vật hoàn toàn mới này.', NOW(), NOW()),
  ('发展', 'fāzhǎn', 'fazhan', 'Phát Triển', 'Phát triển, mở rộng', 3, 'HSK 3.0', 618, '3', '2025', '动', NULL, '95', '随着科技的飞速发展，人工智能深刻改变着世界。', 'Cùng với sự phát triển thần tốc của công nghệ, trí tuệ nhân tạo đang thay đổi sâu sắc thế giới.', NOW(), NOW()),
  ('方便', 'fāngbiàn', 'fangbian', 'Phương Tiện', 'Thuận tiện, tiện lợi', 3, 'HSK 3.0', 619, '3', '2025', '形', NULL, '95', '移动支付的全面普及给人们的日常生活带来了极大方便。', 'Sự phổ cập toàn diện của thanh toán di động mang lại sự thuận tiện to lớn cho cuộc sống thường ngày.', NOW(), NOW()),
  ('方便面', 'fāngbiànmiàn', 'fangbianmian', 'Phương Tiện Diện', 'Mì ăn liền, mì tôm', 3, 'HSK 3.0', 620, '3', '2025', '名', NULL, '95', '虽然方便面快捷美味，但平时还是应该多吃新鲜饭菜。', 'Tuy mì ăn liền nhanh gọn ngon miệng nhưng thường ngày vẫn nên ăn nhiều cơm canh tươi ngon.', NOW(), NOW()),
  ('方法', 'fāngfǎ', 'fangfa', 'Phương Pháp', 'Phương pháp, cách thức', 3, 'HSK 3.0', 621, '3', '2025', '名', NULL, '95', '掌握科学有效的背诵方法能够极大提高词汇记忆速度。', 'Nắm vững phương pháp học thuộc khoa học hiệu quả có thể nâng cao tốc độ ghi nhớ từ vựng rất nhiều.', NOW(), NOW()),
  ('方向', 'fāngxiàng', 'fangxiang', 'Phương Hướng', 'Phương hướng, hướng', 3, 'HSK 3.0', 622, '3', '2025', '名', NULL, '95', '指南针在茫茫的大海上始终为水手们指引正确方向。', 'Chiếc la bàn trên biển cả bao la luôn chỉ dẫn phương hướng chính xác cho các thủy thủ.', NOW(), NOW()),
  ('放心', 'fàngxīn', 'fangxin', 'Phóng Tâm', 'Yên tâm, an lòng', 3, 'HSK 3.0', 626, '3', '2025', '动', NULL, '95', '有经验丰富的老医生主刀，请家属们尽管放心。', 'Có bác sĩ lâu năm giàu kinh nghiệm mổ chính, xin người nhà hãy yên tâm.', NOW(), NOW()),
  ('分开', 'fēnkāi', 'fenkai', 'Phân Khai', 'Tách ra, phân tách', 3, 'HSK 3.0', 628, '3', '2025', '动', NULL, '95', '毕业后大家虽然分开了，但深厚的友谊永不褪色。', 'Sau khi tốt nghiệp tuy mọi người đã tách rời nhưng tình bạn sâu sắc không bao giờ phai nhạt.', NOW(), NOW()),
  ('封', 'fēng', 'feng', 'Phong', 'Bức, phong (lượng từ thư từ), phong tỏa', 3, 'HSK 3.0', 630, '3', '2025', '量、（动）', NULL, '95', '他给远方的父母寄去了一封充满真情的家书。', 'Anh ấy đã gửi về cho cha mẹ ở phương xa một phong thư nhà chan chứa tình cảm chân thành.', NOW(), NOW()),
  ('夫妻', 'fūqī', 'fuqi', 'Phu Thê', 'Vợ chồng', 3, 'HSK 3.0', 631, '3', '2025', '名', NULL, '95', '这对老夫妻相濡以沫走过了整整五十个春秋。', 'Cặp vợ chồng già này đã gắn bó sớm tối bên nhau trải qua trọn vẹn năm mươi mùa xuân thu.', NOW(), NOW()),
  ('服务', 'fúwù', 'fuwu', 'Phục Vụ', 'Phục vụ, dịch vụ', 3, 'HSK 3.0', 632, '3', '2025', '动', NULL, '95', '这家航空公司的空乘人员以周到热情的高品质服务闻名。', 'Đội ngũ tiếp viên của hãng hàng không này nổi tiếng với dịch vụ chu đáo nhiệt tình chất lượng cao.', NOW(), NOW()),
  ('附近', 'fùjìn', 'fujin', 'Phụ Cận', 'Gần đây, vùng lân cận', 3, 'HSK 3.0', 633, '3', '2025', '名', NULL, '95', '学校附近生活配套设施齐全，有许多便利店和餐馆。', 'Vùng lân cận trường học các tiện ích sinh hoạt rất đầy đủ, có nhiều cửa hàng tiện lợi và quán ăn.', NOW(), NOW()),
  ('复习', 'fùxí', 'fuxi', 'Phục Tập', 'Ôn tập, xem lại bài', 3, 'HSK 3.0', 634, '3', '2025', '动', NULL, '95', '期末考试前大家都在抓紧时间全面复习所学知识。', 'Trước kỳ thi cuối kỳ mọi người đều đang tranh thủ thời gian ôn tập toàn diện kiến thức đã học.', NOW(), NOW()),
  ('该', 'gāi', 'gai', 'Cai', 'Nên, cần phải, đến lượt', 3, 'HSK 3.0', 635, '3', '2025', '动', '1', '95', '大家轮流值日，今天按照规定该轮到你打扫卫生了。', 'Mọi người luân phiên trực nhật, hôm nay theo quy định nên đến lượt bạn quét dọn vệ sinh rồi.', NOW(), NOW()),
  ('感兴趣', 'gǎn xìngqù', 'ganxingqu', 'Cảm Hứng Thú', 'Có hứng thú, quan tâm', 3, 'HSK 3.0', 637, '3', '2025', '', NULL, '95', '他对中国悠久独特的传统陶瓷艺术非常感兴趣。', 'Anh ấy vô cùng có hứng thú với nghệ thuật gốm sứ truyền thống lâu đời độc đáo của Trung Quốc.', NOW(), NOW()),
  ('感到', 'gǎndào', 'gandao', 'Cảm Đáo', 'Cảm thấy, thấy', 3, 'HSK 3.0', 638, '3', '2025', '动', NULL, '95', '看到学生们取得了优异的成绩，老师感到无比欣慰。', 'Nhìn thấy các học sinh đạt được thành tích xuất sắc, thầy giáo cảm thấy vô cùng an lòng và tự hào.', NOW(), NOW()),
  ('感冒', 'gǎnmào', 'ganmao', 'Cảm Mạo', 'Cảm cúm, bị cúm', 3, 'HSK 3.0', 639, '3', '2025', '名、动', NULL, '95', '最近流感流行，如果不幸感冒了一定要多休息多喝水。', 'Gần đây cúm đang lây lan, nếu không may bị cảm cúm nhất định phải nghỉ ngơi nhiều và uống nhiều nước.', NOW(), NOW()),
  ('刚', 'gāng', 'gang', 'Cương', 'Vừa, vừa mới, cứng', 3, 'HSK 3.0', 641, '3', '2025', '副', NULL, '96', '新泡的热茶温度刚合适，喝一口满嘴留香。', 'Tách trà nóng mới pha nhiệt độ vừa vặn, nhấp một ngụm hương thơm lưu lại đầy vòm miệng.', NOW(), NOW()),
  ('刚才', 'gāngcái', 'gangcai', 'Cương Tài', 'Vừa mới, ban nãy', 3, 'HSK 3.0', 642, '3', '2025', '名', NULL, '96', '他刚才还在操场跑步，现在已经回宿舍冲凉了。', 'Cậu ấy vừa nãy còn chạy bộ ở sân vận động, bây giờ đã về ký túc xá tắm mát rồi.', NOW(), NOW()),
  ('刚刚', 'gānggāng', 'ganggang', 'Cương Cương', 'Vừa mới đây, vừa xong', 3, 'HSK 3.0', 643, '3', '2025', '副', NULL, '96', '妈妈刚刚烤好的香甜饼干散发着诱人的奶香味。', 'Món bánh quy thơm ngọt mẹ vừa mới nướng xong tỏa ra hương thơm ngậy của sữa đầy cuốn hút.', NOW(), NOW()),
  ('高铁', 'gāotiě', 'gaotie', 'Cao Thiết', 'Đường sắt cao tốc, tàu cao tốc', 3, 'HSK 3.0', 644, '3', '2025', '名', NULL, '96', '乘坐高铁从北京到上海只需要四个多小时。', 'Ngồi tàu cao tốc từ Bắc Kinh đến Thượng Hải chỉ mất hơn bốn tiếng đồng hồ.', NOW(), NOW()),
  ('根据', 'gēnjù', 'genju', 'Căn Cứ', 'Căn cứ vào, dựa theo', 3, 'HSK 3.0', 645, '3', '2025', '动、介、（名）', NULL, '96', '我们要根据实际的市场调研数据来制定营销策略。', 'Chúng ta phải căn cứ vào số liệu điều tra thị trường thực tế để hoạch định chiến lược tiếp thị.', NOW(), NOW()),
  ('更', 'gèng', 'geng', 'Canh', 'Càng, hơn nữa', 3, 'HSK 3.0', 646, '3', '2025', '副', NULL, '96', '雨过天晴之后，整座青山显得更加青翠欲滴。', 'Sau cơn mưa trời hửng nắng, toàn bộ ngọn núi xanh hiện lên càng thêm mướt mát xanh tươi.', NOW(), NOW()),
  ('公斤', 'gōngjīn', 'gongjin', 'Công Cân', 'Kilôgam, cân tây (kg)', 3, 'HSK 3.0', 647, '3', '2025', '量', NULL, '96', '请给我称两公斤新鲜红透的富士苹果。', 'Xin hãy cân giúp tôi hai kilôgam táo Phú Sĩ đỏ tươi chín mọng.', NOW(), NOW()),
  ('公园', 'gōngyuán', 'gongyuan', 'Công Viên', 'Công viên', 3, 'HSK 3.0', 648, '3', '2025', '名', NULL, '96', '清晨许多老年人在绿树成荫的城市公园里打太极拳。', 'Sáng sớm nhiều người cao tuổi tập thái cực quyền trong công viên thành phố rợp bóng cây xanh.', NOW(), NOW()),
  ('工作日', 'gōngzuòrì', 'gongzuori', 'Công Tác Nhật', 'Ngày làm việc', 3, 'HSK 3.0', 649, '3', '2025', '名', NULL, '96', '银行在工作日正常对外营业，周末仅办理部分业务。', 'Ngân hàng mở cửa giao dịch bình thường vào ngày làm việc, cuối tuần chỉ xử lý một phần nghiệp vụ.', NOW(), NOW()),
  ('故事', 'gùshi', 'gushi', 'Cố Sự', 'Câu chuyện, tích xưa', 3, 'HSK 3.0', 650, '3', '2025', '名', NULL, '96', '睡前给孩子讲一个生动有趣的寓言故事能够启发智慧。', 'Trước giờ ngủ kể cho con nghe một câu chuyện ngụ ngôn sinh động thú vị có thể gợi mở trí tuệ.', NOW(), NOW()),
  ('刮', 'guā', 'gua', 'Quát', 'Thổi (gió), cạo (râu)', 3, 'HSK 3.0', 651, '3', '2025', '动', NULL, '96', '呼啸的北风刮得树叶沙沙作响漫天飞舞。', 'Cơn gió bắc rít từng cơn thổi lá cây xào xạc bay ngập trời.', NOW(), NOW()),
  ('关机', 'guānjī', 'guanji', 'Quan Cơ', 'Tắt máy (điện thoại, máy tính)', 3, 'HSK 3.0', 653, '3', '2025', '动', NULL, '96', '飞机起飞和降落阶段请旅客们务必自觉关机。', 'Giai đoạn máy bay cất cánh và hạ cánh xin hành khách nhất thiết tự giác tắt máy.', NOW(), NOW()),
  ('关系', 'guānxì', 'guanxi', 'Quan Hệ', 'Quan hệ, mối quan hệ', 3, 'HSK 3.0', 654, '3', '2025', '名、（动）', NULL, '96', '良好的邻里关系有助于营造和谐温馨的居住环境。', 'Mối quan hệ hàng xóm láng giềng tốt đẹp giúp tạo dựng môi trường sống hòa thuận ấm cúng.', NOW(), NOW()),
  ('关心', 'guānxīn', 'guanxin', 'Quan Tâm', 'Quan tâm, săn sóc', 3, 'HSK 3.0', 655, '3', '2025', '动', NULL, '96', '父母无微不至的关心是我们成长路上最坚强的后盾。', 'Sự quan tâm chu đáo từng li từng tí của cha mẹ là chỗ dựa vững chắc nhất trên đường ta khôn lớn.', NOW(), NOW()),
  ('关于', 'guānyú', 'guanyu', 'Quan Vu', 'Về, liên quan đến', 3, 'HSK 3.0', 656, '3', '2025', '介', NULL, '96', '今天下午有一场关于环境保护的专业专题学术讲座。', 'Chiều hôm nay có một buổi tọa đàm học thuật chuyên đề về bảo vệ môi trường.', NOW(), NOW()),
  ('关注', 'guānzhù', 'guanzhu', 'Quan Chú', 'Theo dõi, chú ý, quan tâm', 3, 'HSK 3.0', 657, '3', '2025', '动', NULL, '96', '欢迎大家持续关注我们公众号发布的最新权威资讯。', 'Hoan nghênh mọi người tiếp tục theo dõi các thông tin uy tín mới nhất đăng tải trên tài khoản chính thức của chúng tôi.', NOW(), NOW()),
  ('过节', 'guòjié', 'guojie', 'Quá Tiết', 'Đón lễ, ăn tết, đón ngày lễ', 3, 'HSK 3.0', 659, '3', '2025', '动', NULL, '96', '每逢过节，家家户户门前都会张贴喜庆的红色春联。', 'Mỗi dịp đón ngày lễ, trước cửa mỗi nhà đều dán đôi câu đối đỏ rộn ràng đón xuân.', NOW(), NOW()),
  ('过去', 'guòqù', 'guoqu', 'Quá Khứ', 'Quá khứ, trước kia', 3, 'HSK 3.0', 660, '3', '2025', '名', '2', '96', '过去的经验教训能够为未来的前行指引正确方向。', 'Những kinh nghiệm và bài học trong quá khứ có thể chỉ dẫn phương hướng đúng đắn cho chặng đường phía trước.', NOW(), NOW()),
  ('海', 'hǎi', 'hai', 'Hải', 'Biển, đại dương', 3, 'HSK 3.0', 661, '3', '2025', '名', NULL, '96', '蔚蓝辽阔的大海边，海鸥在波涛之上展翅翱翔。', 'Bên bờ biển xanh thẳm bao la, đàn hải âu dang rộng đôi cánh lượn bay trên sóng biếc.', NOW(), NOW()),
  ('害怕', 'hàipà', 'haipa', 'Hại Phạ', 'Sợ hãi, lo sợ', 3, 'HSK 3.0', 662, '3', '2025', '动', NULL, '96', '面对突如其来的困难，勇敢坚强的人从不感到害怕。', 'Đối diện với khó khăn ập đến bất ngờ, người dũng cảm kiên cường chưa từng biết sợ hãi.', NOW(), NOW()),
  ('好多', 'hǎoduō', 'haoduo', 'Hảo Đa', 'Rất nhiều, nhiều', 3, 'HSK 3.0', 663, '3', '2025', '数', NULL, '96', '他在中国留学的几年里结识了好多志同道合的好朋友。', 'Trong mấy năm du học tại Trung Quốc anh ấy đã làm quen được rất nhiều người bạn thân cùng chí hướng.', NOW(), NOW()),
  ('好久', 'hǎojiǔ', 'haojiu', 'Hảo Cửu', 'Lâu rồi, thời gian dài', 3, 'HSK 3.0', 664, '3', '2025', '形', NULL, '96', '我们已经好久没有坐在一起促膝长谈了。', 'Chúng ta đã lâu lắm rồi không ngồi cùng nhau trò chuyện tâm tình.', NOW(), NOW()),
  ('好像', 'hǎoxiàng', 'haoxiang', 'Hảo Tượng', 'Hình như, dường như', 3, 'HSK 3.0', 665, '3', '2025', '动、副', NULL, '96', '看这阴沉沉的天色，外面好像马上就要下雷阵雨了。', 'Nhìn sắc trời u ám thế này, hình như bên ngoài sắp sửa đổ mưa rào sấm chớp rồi.', NOW(), NOW()),
  ('号码', 'hàomǎ', 'haoma', 'Hiệu Mã', 'Mã số, số hiệu', 3, 'HSK 3.0', 666, '3', '2025', '名', NULL, '96', '请在回执单上清晰工整地留下您的手机联系号码。', 'Xin hãy để lại số điện thoại di động liên lạc của bạn một cách rõ ràng ngay ngắn trên phiếu biên nhận.', NOW(), NOW()),
  ('河', 'hé', 'he', 'Hà', 'Sông, dòng sông', 3, 'HSK 3.0', 667, '3', '2025', '名', NULL, '96', '一条清澈碧绿的母亲河穿过整座古老悠远的小镇。', 'Một dòng sông mẹ trong xanh hiền hòa chảy xuyên qua toàn bộ thị trấn cổ kính xa xưa.', NOW(), NOW()),
  ('合适', 'héshì', 'heshi', 'Hợp Thích', 'Phù hợp, thích hợp', 3, 'HSK 3.0', 668, '3', '2025', '形', NULL, '96', '找一份自己真正喜欢且各方面合适的工作并不容易。', 'Tìm được một công việc mà bản thân thực sự yêu thích và mọi mặt đều phù hợp quả thực không dễ.', NOW(), NOW()),
  ('黑板', 'hēibǎn', 'heiban', 'Hắc Bản', 'Bảng đen', 3, 'HSK 3.0', 669, '3', '2025', '名', NULL, '96', '上课时老师在黑板上用白色粉笔工整地书写重点汉字。', 'Trong giờ học thầy giáo dùng phấn trắng viết nắn nót các chữ Hán trọng tâm lên bảng đen.', NOW(), NOW()),
  ('红绿灯', 'hóng-lǜdēng', 'hongludeng', 'Hồng Lục Đăng', 'Đèn giao thông, đèn đỏ đèn xanh', 3, 'HSK 3.0', 670, '3', '2025', '名', NULL, '96', '过繁忙十字路口一定要严格看清红绿灯指示再通行。', 'Khi qua ngã tư bận rộn nhất định phải nhìn thật kỹ tín hiệu đèn giao thông rồi mới qua đường.', NOW(), NOW()),
  ('后来', 'hòulái', 'houlai', 'Hậu Lai', 'Sau này, về sau', 3, 'HSK 3.0', 671, '3', '2025', '名', NULL, '96', '他后来凭借刻苦不懈的钻研成为了一名行业领军专家。', 'Về sau nhờ sự nghiên cứu miệt mài không ngừng anh ấy đã trở thành một chuyên gia đầu ngành.', NOW(), NOW()),
  ('后年', 'hòunián', 'hounian', 'Hậu Niên', 'Năm kia (hai năm sau)', 3, 'HSK 3.0', 672, '3', '2025', '名', NULL, '96', '按照学制规划，她预计将在后年夏天顺利完成硕士学业。', 'Theo kế hoạch đào tạo, cô ấy dự kiến sẽ hoàn thành thuận lợi chương trình thạc sĩ vào mùa hè năm kia.', NOW(), NOW()),
  ('护照', 'hùzhào', 'huzhao', 'Hộ Chiếu', 'Hộ chiếu', 3, 'HSK 3.0', 674, '3', '2025', '名', NULL, '96', '出国旅游前一定要仔细检查本人护照的有效签证期限。', 'Trước khi ra nước ngoài du lịch nhất định phải kiểm tra kỹ thời hạn thị thực còn hiệu lực trên hộ chiếu cá nhân.', NOW(), NOW()),
  ('花园', 'huāyuán', 'huayuan', 'Hoa Viên', 'Vườn hoa', 3, 'HSK 3.0', 675, '3', '2025', '名', NULL, '96', '小区的花园里春天百花争艳，草木青翠宜人。', 'Trong vườn hoa của khu dân cư mùa xuân trăm hoa đua nở, cây cỏ xanh tươi dễ chịu.', NOW(), NOW()),
  ('画家', 'huàjiā', 'huajia', 'Hoạ Gia', 'Họa sĩ', 3, 'HSK 3.0', 676, '3', '2025', '名', NULL, '96', '著名中国画画家齐白石笔下的人物花鸟跃然纸上。', 'Nhân vật, hoa cỏ chim muông dưới ngòi bút của họa sĩ tranh Trung Quốc trứ danh Tề Bạch Thạch sống động như thật.', NOW(), NOW()),
  ('欢迎', 'huānyíng', 'huanying', 'Hoan Nghênh', 'Hoan nghênh, chào đón', 3, 'HSK 3.0', 677, '3', '2025', '动', NULL, '96', '热烈欢迎来自五湖四海的新留学生来到我们大学深造。', 'Nhiệt liệt chào đón các tân du học sinh đến từ bốn phương về học tập nâng cao tại trường đại học chúng tôi.', NOW(), NOW()),
  ('环境', 'huánjìng', 'huanjing', 'Hoàn Cảnh', 'Môi trường, hoàn cảnh', 3, 'HSK 3.0', 679, '3', '2025', '名', NULL, '96', '保护生态环境是全人类共同的重大责任。', 'Bảo vệ môi trường sinh thái là trách nhiệm lớn lao chung của toàn nhân loại.', NOW(), NOW()),
  ('换', 'huàn', 'huan', 'Hoán', 'Đổi, thay đổi, đổi tiền', 3, 'HSK 3.0', 680, '3', '2025', '动', NULL, '96', '我想去中国银行把一些美元换成人民币。', 'Tôi muốn đến Ngân hàng Trung Quốc đổi một ít đô la Mỹ lấy nhân dân tệ.', NOW(), NOW()),
  ('黄色', 'huángsè', 'huangse', 'Hoàng Sắc', 'Màu vàng', 3, 'HSK 3.0', 681, '3', '2025', '名', NULL, '97', '秋天到了，银杏树的叶子都变成了金黄色。', 'Mùa thu đến rồi, lá cây ngân hạnh đều biến thành màu vàng óng.', NOW(), NOW()),
  ('会', 'huì', 'hui', 'Hội', 'Hội nghị, cuộc họp, buổi họp', 3, 'HSK 3.0', 683, '3', '2025', '名', '2', '97', '全体部门负责人正在三楼会议室开会。', 'Toàn thể người phụ trách bộ phận đang họp tại phòng hội nghị tầng ba.', NOW(), NOW()),
  ('会议', 'huìyì', 'huiyi', 'Hội Nghị', 'Hội nghị, cuộc họp', 3, 'HSK 3.0', 684, '3', '2025', '名', NULL, '97', '国际气候变化峰会是一场非常重要的会议。', 'Hội nghị thượng đỉnh về biến đổi khí hậu quốc tế là một cuộc họp vô cùng quan trọng.', NOW(), NOW()),
  ('或', 'huò', 'huo', 'Hoặc', 'Hoặc, hoặc là', 3, 'HSK 3.0', 685, '3', '2025', '连、（副）', NULL, '97', '明天下午你可以来图书馆找我，或给我发邮件。', 'Chiều mai bạn có thể đến thư viện tìm tôi, hoặc gửi email cho tôi.', NOW(), NOW()),
  ('或者', 'huòzhě', 'huozhe', 'Hoặc Giả', 'Hoặc là, hay là', 3, 'HSK 3.0', 686, '3', '2025', '连', NULL, '97', '周末我通常在宿舍看书或者去操场锻炼身体。', 'Cuối tuần tôi thường đọc sách ở ký túc xá hoặc ra sân vận động rèn luyện thân thể.', NOW(), NOW()),
  ('鸡', 'jī', 'ji', 'Kê', 'Con gà', 3, 'HSK 3.0', 687, '3', '2025', '名', NULL, '97', '农场里散养的土鸡每天清晨都会喔喔啼叫。', 'Những chú gà nuôi thả trong trang trại sáng sớm nào cũng gáy vang.', NOW(), NOW()),
  ('几乎', 'jīhū', 'jihu', 'Kỷ Hồ', 'Hầu như, suýt nữa, gần như', 3, 'HSK 3.0', 688, '3', '2025', '副', NULL, '97', '他今天忙得不可开交，几乎连喝水的时间都没有。', 'Hôm nay anh ấy bận túi bụi, hầu như ngay cả thời gian uống nước cũng không có.', NOW(), NOW()),
  ('机会', 'jīhuì', 'jihui', 'Cơ Hội', 'Cơ hội, dịp may', 3, 'HSK 3.0', 689, '3', '2025', '名', NULL, '97', '能够去北京大学交流学习是一次非常难得的机会。', 'Có thể đến Đại học Bắc Kinh giao lưu học tập là một cơ hội vô cùng quý báu.', NOW(), NOW()),
  ('极', 'jí', 'ji', 'Cực', 'Cực kỳ, vô cùng', 3, 'HSK 3.0', 690, '3', '2025', '副', NULL, '97', '经历了漫长的旅途，大家此刻感到极度疲惫。', 'Trải qua chuyến đi dài đằng đẵng, mọi người lúc này cảm thấy cực kỳ mệt mỏi.', NOW(), NOW()),
  ('急', 'jí', 'ji', 'Cấp', 'Vội vàng, sốt ruột, khẩn cấp', 3, 'HSK 3.0', 691, '3', '2025', '形、动', NULL, '97', '他有紧急公事需要处理，走得非常急促。', 'Anh ấy có công vụ khẩn cấp cần giải quyết, bước đi vô cùng vội vã.', NOW(), NOW()),
  ('季', 'jì', 'ji', 'Quý', 'Mùa, quý', 3, 'HSK 3.0', 693, '3', '2025', '名', NULL, '97', '秋季是一年之中气候最宜人舒适的美好季节。', 'Mùa thu là mùa đẹp đẽ dễ chịu và thoải mái nhất trong năm.', NOW(), NOW()),
  ('季节', 'jìjié', 'jijie', 'Quý Tiết', 'Mùa, mùa màng, thời tiết', 3, 'HSK 3.0', 694, '3', '2025', '名', NULL, '97', '一年之中你最喜欢哪个季节？', 'Trong một năm bạn thích nhất mùa nào?', NOW(), NOW()),
  ('加', 'jiā', 'jia', 'Gia', 'Thêm, cộng, gia tăng', 3, 'HSK 3.0', 695, '3', '2025', '动', NULL, '97', '这杯热咖啡太苦了，请帮我加一点儿牛奶和糖。', 'Tách cà phê nóng này đắng quá, xin hãy giúp tôi thêm chút sữa và đường.', NOW(), NOW()),
  ('假期', 'jiàqī', 'jiaqi', 'Giá Kỳ', 'Kỳ nghỉ, ngày nghỉ', 3, 'HSK 3.0', 696, '3', '2025', '名', NULL, '97', '漫长充实的暑期假期是学生们放松充电的好时光。', 'Kỳ nghỉ hè dài trọn vẹn là khoảng thời gian tuyệt vời để học sinh thư giãn và nạp lại năng lượng.', NOW(), NOW()),
  ('坚持', 'jiānchí', 'jianchi', 'Kiên Trì', 'Kiên trì, giữ vững', 3, 'HSK 3.0', 697, '3', '2025', '动', NULL, '97', '只有持之以恒地坚持练习，口语水平才能突飞猛进。', 'Chỉ có kiên trì luyện tập không ngừng thì trình độ khẩu ngữ mới tiến bộ vượt bậc.', NOW(), NOW()),
  ('检查', 'jiǎnchá', 'jiancha', 'Kiểm Tra', 'Kiểm tra, xem xét', 3, 'HSK 3.0', 698, '3', '2025', '动', NULL, '97', '交卷前务必仔细检查一遍姓名和考号是否填对。', 'Trước khi nộp bài thi nhất thiết phải kiểm tra kỹ một lượt xem họ tên và số báo danh đã điền đúng chưa.', NOW(), NOW()),
  ('简单', 'jiǎndān', 'jiandan', 'Giản Đơn', 'Đơn giản, dễ dàng', 3, 'HSK 3.0', 699, '3', '2025', '形', NULL, '97', '这道汉语语法题其实比大家想象的要简单得多。', 'Câu ngữ pháp tiếng Trung này thực ra đơn giản hơn mọi người tưởng tượng nhiều.', NOW(), NOW()),
  ('检票', 'jiǎnpiào', 'jianpiao', 'Kiểm Phiếu', 'Soát vé, kiểm vé', 3, 'HSK 3.0', 700, '3', '2025', '动', NULL, '97', '高铁还有十五分钟就要发车了，检票口已经开放。', 'Tàu cao tốc còn mười lăm phút nữa là khởi hành, cửa soát vé đã mở rồi.', NOW(), NOW()),
  ('健康', 'jiànkāng', 'jiankang', 'Kiện Khang', 'Sức khỏe, khỏe mạnh', 3, 'HSK 3.0', 701, '3', '2025', '形', NULL, '97', '平时保持均衡饮食和规律作息有助于身心健康。', 'Thường ngày duy trì ăn uống điều độ và nghỉ ngơi điều độ giúp thân thể khỏe mạnh.', NOW(), NOW()),
  ('讲', 'jiǎng', 'jiang', 'Giảng', 'Nói, giảng, kể', 3, 'HSK 3.0', 703, '3', '2025', '动', NULL, '97', '王教授今天在学术报告厅给我们讲中国当代文学。', 'Giáo sư Vương hôm nay ở hội trường học thuật giảng cho chúng tôi nghe về văn học đương đại Trung Quốc.', NOW(), NOW()),
  ('角', 'jiǎo', 'jiao', 'Giác', 'Góc, hào (1/10 tệ)', 3, 'HSK 3.0', 704, '3', '2025', '量', NULL, '97', '房间的一角静静地摆放着一把古色古香的吉他。', 'Ở một góc phòng lặng lẽ đặt một cây đàn ghi-ta mang nét cổ kính.', NOW(), NOW()),
  ('脚', 'jiǎo', 'jiao', 'Cước', 'Bàn chân, chân', 3, 'HSK 3.0', 705, '3', '2025', '名', NULL, '97', '昨天登山走了好几公里山路，今天双脚格外酸痛。', 'Hôm qua leo núi đi bộ mấy cây số đường đèo, hôm nay hai bàn chân đặc biệt mỏi nhừ.', NOW(), NOW()),
  ('接', 'jiē', 'jie', 'Tiếp', 'Đón, tiếp nhận, nhận điện thoại', 3, 'HSK 3.0', 706, '3', '2025', '动', NULL, '97', '他刚才去火车站接远道而来的父母了。', 'Vừa nãy anh ấy ra ga xe lửa đón cha mẹ từ xa đến rồi.', NOW(), NOW()),
  ('街', 'jiē', 'jie', 'Nhai', 'Phố, đường phố', 3, 'HSK 3.0', 707, '3', '2025', '名', NULL, '97', '周末繁华的步行街上人来人往，热闹非凡。', 'Cuối tuần trên con phố đi bộ sầm uất người qua kẻ lại, vô cùng náo nhiệt.', NOW(), NOW()),
  ('节', 'jié', 'jie', 'Tiết', 'Tiết (học), đốt, lễ, ngày lễ', 3, 'HSK 3.0', 708, '3', '2025', '量、名、（动）', NULL, '97', '今天上午我们连着上了三节非常重要的专业课。', 'Sáng nay chúng tôi học liền ba tiết môn chuyên ngành rất quan trọng.', NOW(), NOW()),
  ('结婚', 'jiéhūn', 'jiehun', 'Kết Hôn', 'Kết hôn, cưới', 3, 'HSK 3.0', 709, '3', '2025', '动', NULL, '97', '他们相恋五年之后，决定在今年国庆节结婚。', 'Sau năm năm yêu nhau, họ quyết định kết hôn vào dịp Quốc khánh năm nay.', NOW(), NOW()),
  ('节目', 'jiémù', 'jiemu', 'Tiết Mục', 'Tiết mục, chương trình', 3, 'HSK 3.0', 710, '3', '2025', '名', NULL, '97', '今晚电视文艺晚会上的舞蹈节目精彩纷呈。', 'Tiết mục múa trong đêm hội văn nghệ truyền hình tối nay vô cùng đặc sắc.', NOW(), NOW()),
  ('节日', 'jiérì', 'jieri', 'Tiết Nhật', 'Ngày lễ, ngày hội', 3, 'HSK 3.0', 711, '3', '2025', '名', NULL, '97', '春节是中国民间最隆重热闹的传统节日。', 'Tết Nguyên Đán là ngày lễ truyền thống long trọng và náo nhiệt nhất trong dân gian Trung Hoa.', NOW(), NOW()),
  ('结束', 'jiéshù', 'jieshu', 'Kết Thúc', 'Kết thúc, chấm dứt', 3, 'HSK 3.0', 712, '3', '2025', '动', NULL, '97', '期末考试全部结束后，大家开心地走出考场。', 'Sau khi toàn bộ kỳ thi cuối kỳ kết thúc, mọi người vui vẻ bước ra khỏi phòng thi.', NOW(), NOW()),
  ('解决', 'jiějué', 'jiejue', 'Giải Quyết', 'Giải quyết', 3, 'HSK 3.0', 713, '3', '2025', '动', NULL, '97', '经过大家集思广益，这个棘手的难题终于解决了。', 'Nhờ mọi người cùng nhau hiến kế, vấn đề hóc búa này rốt cuộc đã được giải quyết rồi.', NOW(), NOW()),
  ('姐妹', 'jiěmèi', 'jiemei', 'Tỉ Muội', 'Chị em gái', 3, 'HSK 3.0', 714, '3', '2025', '名', NULL, '97', '这对亲姐妹长得十分相像，感情也格外亲密。', 'Hai chị em ruột này ngoại hình rất giống nhau, tình cảm cũng vô cùng thân thiết.', NOW(), NOW()),
  ('借', 'jiè', 'jie', 'Tá', 'Mượn, vay', 3, 'HSK 3.0', 715, '3', '2025', '动', NULL, '97', '请问我可以在大学图书馆借几本外语参考书吗？', 'Xin hỏi tôi có thể mượn mấy cuốn sách tham khảo ngoại ngữ ở thư viện đại học không?', NOW(), NOW()),
  ('斤', 'jīn', 'jin', 'Cân', 'Cân Tàu (0.5 kg)', 3, 'HSK 3.0', 716, '3', '2025', '量', NULL, '97', '他在果蔬超市买了三斤新鲜脆甜的水蜜桃。', 'Anh ấy đã mua ba cân đào mật giòn ngọt tươi ngon ở siêu thị rau quả.', NOW(), NOW()),
  ('经过', 'jīngguò', 'jingguo', 'Kinh Quá', 'Trải qua, đi qua, quá trình', 3, 'HSK 3.0', 717, '3', '2025', '动、名', NULL, '97', '经过多轮严格选拔，他顺利入选了国家集训队。', 'Trải qua nhiều vòng tuyển chọn khắt khe, anh ấy đã thuận lợi lọt vào đội tuyển tập huấn quốc gia.', NOW(), NOW()),
  ('经理', 'jīnglǐ', 'jingli', 'Kinh Lý', 'Giám đốc, quản lý', 3, 'HSK 3.0', 718, '3', '2025', '名', NULL, '97', '李经理正在会议室与重要客户商谈业务合作。', 'Giám đốc Lý đang cùng khách hàng quan trọng bàn bạc hợp tác kinh doanh trong phòng họp.', NOW(), NOW()),
  ('久', 'jiǔ', 'jiu', 'Cửu', 'Lâu, thời gian dài', 3, 'HSK 3.0', 719, '3', '2025', '形', NULL, '97', '我们已经分别好久了，今天相见格外激动。', 'Chúng tôi đã chia tay nhau lâu lắm rồi, hôm nay gặp lại vô cùng xúc động.', NOW(), NOW()),
  ('酒', 'jiǔ', 'jiu', 'Tửu', 'Rượu, chất cồn', 3, 'HSK 3.0', 720, '3', '2025', '名', NULL, '97', '中国茶文化与酒文化在历史上都源远流长。', 'Văn hóa trà và văn hóa rượu Trung Hoa trong lịch sử đều có nguồn gốc sâu xa lâu đời.', NOW(), NOW()),
  ('旧', 'jiù', 'jiu', 'Cựu', 'Cũ, xưa, cổ', 3, 'HSK 3.0', 721, '3', '2025', '形', NULL, '98', '这本泛黄的旧相册里珍藏着许多童年的珍贵回忆。', 'Trong cuốn an-bum ảnh cũ ố vàng này lưu giữ bao kỷ niệm quý giá thời thơ ấu.', NOW(), NOW()),
  ('句', 'jù', 'ju', 'Cú', 'Câu (lượng từ lời nói, câu văn)', 3, 'HSK 3.0', 722, '3', '2025', '量', NULL, '98', '请大家用今天学到的三个重点生词各造一句话。', 'Xin mọi người hãy dùng ba từ mới trọng tâm học hôm nay để đặt một câu văn.', NOW(), NOW()),
  ('句子', 'jùzi', 'juzi', 'Cú Tử', 'Câu văn, câu cú', 3, 'HSK 3.0', 723, '3', '2025', '名', NULL, '98', '写文章要做到语法正确、句子通顺自然。', 'Viết văn cần đạt được ngữ pháp chính xác, câu cú mạch lạc trôi chảy tự nhiên.', NOW(), NOW()),
  ('决定', 'juédìng', 'jueding', 'Quyết Định', 'Quyết định', 3, 'HSK 3.0', 724, '3', '2025', '动、名', NULL, '98', '经过深思熟虑，他决定留在母校攻读博士学位。', 'Sau khi suy nghĩ chín chắn, anh ấy quyết định ở lại trường cũ học tiếp tiến sĩ.', NOW(), NOW()),
  ('卡', 'kǎ', 'ka', 'Tạp', 'Thẻ, cạc (ngân hàng, sinh viên)', 3, 'HSK 3.0', 725, '3', '2025', '名', NULL, '98', '在食堂刷校园卡用餐既快捷又安全方便。', 'Quẹt thẻ sinh viên trong căng tin ăn cơm vừa nhanh vừa an toàn tiện lợi.', NOW(), NOW()),
  ('开花', 'kāihuā', 'kaihua', 'Khai Hoa', 'Nở hoa, trổ hoa', 3, 'HSK 3.0', 726, '3', '2025', '动', NULL, '98', '春天到了，院子里的樱花树悄然开花了。', 'Mùa xuân đến rồi, cây hoa anh đào trong sân đã lặng lẽ nở hoa.', NOW(), NOW()),
  ('开机', 'kāijī', 'kaiji', 'Khai Cơ', 'Mở máy, bật máy', 3, 'HSK 3.0', 728, '3', '2025', '动', NULL, '98', '飞机安全降落滑行完毕后，乘客们纷纷开机。', 'Sau khi máy bay hạ cánh an toàn chạy xong đường băng, các hành khách rủ nhau mở máy.', NOW(), NOW()),
  ('开心', 'kāixīn', 'kaixin', 'Khai Tâm', 'Vui vẻ, vui lòng, phấn khởi', 3, 'HSK 3.0', 729, '3', '2025', '形', NULL, '98', '得知考试通过的好消息，大家心里都感到非常开心。', 'Biết được tin vui thi đỗ, trong lòng mọi người đều cảm thấy vô cùng phấn khởi.', NOW(), NOW()),
  ('看来', 'kànlái', 'kanlai', 'Khán Lai', 'Xem ra, xem chừng, nhìn nhận', 3, 'HSK 3.0', 730, '3', '2025', '动', NULL, '98', '看今天这乌云密布的天气，看来一场暴雨不可避免。', 'Nhìn sắc trời mây đen vần vũ hôm nay, xem ra một cơn mưa dông khó lòng tránh khỏi.', NOW(), NOW()),
  ('可', 'kě', 'ke', 'Khả', 'Có thể, đáng, nhưng', 3, 'HSK 3.0', 731, '3', '2025', '连、（副）', NULL, '98', '这本关于历史的故事书写得通俗易懂，真是一本可读的好书。', 'Cuốn sách truyện lịch sử này viết rất dễ hiểu, quả là một cuốn sách đáng đọc.', NOW(), NOW()),
  ('可爱', 'kě’ài', 'keai', 'Khả Ái', 'Đáng yêu, dễ thương', 3, 'HSK 3.0', 733, '3', '2025', '形', NULL, '98', '草坪上奔跑玩耍的小泰迪狗长得真是太可爱了。', 'Chú chó Teddy nhỏ chạy nhảy đùa nghịch trên bãi cỏ trông thật là đáng yêu quá.', NOW(), NOW()),
  ('可是', 'kěshì', 'keshi', 'Khả Thị', 'Nhưng, nhưng mà', 3, 'HSK 3.0', 734, '3', '2025', '连', NULL, '98', '虽然他已经尽了最大努力，可是比赛结果还是留有遗憾。', 'Tuy anh ấy đã cố hết sức mình, nhưng mà kết quả thi đấu vẫn còn chút tiếc nuối.', NOW(), NOW()),
  ('刻', 'kè', 'ke', 'Khắc', 'Khắc (15 phút), khắc chạm', 3, 'HSK 3.0', 735, '3', '2025', '量、（动）', NULL, '98', '现在是八点一刻，距离早自习开始还有十五分钟。', 'Bây giờ là tám giờ một khắc, cách giờ bắt đầu tự học buổi sáng còn mười lăm phút.', NOW(), NOW()),
  ('客人', 'kèrén', 'keren', 'Khách Nhân', 'Khách, vị khách', 3, 'HSK 3.0', 737, '3', '2025', '名', NULL, '98', '今天家里来了一位远道而来的尊贵客人。', 'Hôm nay trong nhà có một vị khách quý từ xa đến chơi.', NOW(), NOW()),
  ('空调', 'kōngtiáo', 'kongtiao', 'Không Điệu', 'Điều hòa nhiệt độ, máy lạnh', 3, 'HSK 3.0', 739, '3', '2025', '名', NULL, '98', '炎热难耐的夏季，在开着空调的房间里格外清爽。', 'Mùa hè nóng bức khó chịu, ở trong căn phòng bật điều hòa đặc biệt mát mẻ.', NOW(), NOW()),
  ('哭', 'kū', 'ku', 'Khốc', 'Khóc', 3, 'HSK 3.0', 740, '3', '2025', '动', NULL, '98', '小姑娘摔倒擦破了膝盖，委屈地哭了起来。', 'Bé gái bị ngã trầy xước đầu gối, ấm ức òa khóc nức nở.', NOW(), NOW()),
  ('筷子', 'kuàizi', 'kuaizi', 'Khoái Tử', 'Đôi đũa', 3, 'HSK 3.0', 741, '3', '2025', '名', NULL, '98', '学会熟练使用筷子是了解中国饮食文化的第一步。', 'Học được cách dùng đũa thành thạo là bước đầu tiên để tìm hiểu văn hóa ẩm thực Trung Quốc.', NOW(), NOW()),
  ('矿泉水', 'kuàngquánshuǐ', 'kuangquanshui', 'Khoáng Tuyền Thuỷ', 'Nước khoáng', 3, 'HSK 3.0', 742, '3', '2025', '名', NULL, '98', '运动过后请及时饮用适量的矿泉水补充身体水分。', 'Sau khi vận động xin hãy kịp thời uống lượng nước khoáng thích hợp để bù nước cho cơ thể.', NOW(), NOW()),
  ('来自', 'láizì', 'laizi', 'Lai Tự', 'Đến từ, xuất thân từ', 3, 'HSK 3.0', 743, '3', '2025', '动', NULL, '98', '我们班的留学生来自世界各地不同的友好国家。', 'Du học sinh lớp chúng tôi đến từ các quốc gia hữu nghị khác nhau trên khắp thế giới.', NOW(), NOW()),
  ('蓝', 'lán', 'lan', 'Lam', 'Màu xanh lam, xanh da trời', 3, 'HSK 3.0', 744, '3', '2025', '形', NULL, '98', '晴空万里的大海上倒映着一片深邃蔚蓝的天空。', 'Trên mặt biển trong xanh vạn dặm soi bóng một vòm trời xanh thẳm bao la.', NOW(), NOW()),
  ('离开', 'líkāi', 'likai', 'Ly Khai', 'Rời khỏi, rời xa', 3, 'HSK 3.0', 747, '3', '2025', '动', NULL, '98', '他依依不舍地挥手告别，离开了生活多年的故乡。', 'Anh ấy lưu luyến vẫy tay từ biệt, rời khỏi quê hương nơi mình đã gắn bó bao năm.', NOW(), NOW()),
  ('礼物', 'lǐwù', 'liwu', 'Lễ Vật', 'Quà tặng, lễ vật', 3, 'HSK 3.0', 748, '3', '2025', '名', NULL, '98', '这套精致的中国茶具是朋友送给我的珍贵生日礼物。', 'Bộ ấm chén trà Trung Quốc tinh tế này là món quà sinh nhật quý giá người bạn tặng tôi.', NOW(), NOW()),
  ('历史', 'lìshǐ', 'lishi', 'Lịch Sử', 'Lịch sử', 3, 'HSK 3.0', 749, '3', '2025', '名', NULL, '98', '北京故宫是一座承载着数百年厚重历史的宏伟建筑。', 'Tử Cấm Thành Bắc Kinh là một công trình kiến trúc đồ sộ chở che bề dày lịch sử hàng trăm năm.', NOW(), NOW()),
  ('脸', 'liǎn', 'lian', 'Liễm', 'Mặt, khuôn mặt', 3, 'HSK 3.0', 750, '3', '2025', '名', NULL, '98', '清晨用冷水洗脸能让人立刻精神振奋。', 'Buổi sáng dùng nước lạnh rửa mặt có thể giúp con người lập tức tỉnh táo tinh thần.', NOW(), NOW()),
  ('练', 'liàn', 'lian', 'Luyện', 'Luyện tập, rèn luyện', 3, 'HSK 3.0', 751, '3', '2025', '动', NULL, '98', '想要写出一手刚劲有力漂亮的毛笔字需要常年勤学苦练。', 'Muốn viết được nét chữ bút lông cứng cáp đẹp đẽ cần phải dày công rèn luyện qua năm tháng.', NOW(), NOW()),
  ('练习', 'liànxí', 'lianxi', 'Luyện Tập', 'Bài tập, luyện tập', 3, 'HSK 3.0', 752, '3', '2025', '动、名', NULL, '98', '课后请大家认真完成教材配套的各课语法练习。', 'Sau giờ học xin mọi người chăm chỉ hoàn thành bài tập ngữ pháp từng bài trong sách giáo khoa.', NOW(), NOW()),
  ('凉快', 'liángkuai', 'liangkuai', 'Lương Khoái', 'Mát mẻ, mát dịu', 3, 'HSK 3.0', 753, '3', '2025', '形', NULL, '98', '秋天傍晚的微风徐徐吹来，让人感到格外凉快舒适。', 'Gió chiều mùa thu hiu hiu thổi tới, khiến người ta cảm thấy đặc biệt mát mẻ dễ chịu.', NOW(), NOW()),
  ('辆', 'liàng', 'liang', 'Lượng', 'Chiếc, cỗ (lượng từ xe cộ)', 3, 'HSK 3.0', 754, '3', '2025', '量', NULL, '98', '校门口整齐停放着一辆环保的新能源公交车。', 'Trước cổng trường đỗ ngay ngắn một chiếc xe buýt năng lượng mới thân thiện với môi trường.', NOW(), NOW()),
  ('聊', 'liáo', 'liao', 'Liêu', 'Trò chuyện, tán gẫu', 3, 'HSK 3.0', 755, '3', '2025', '动', NULL, '98', '老同学们围坐在一起愉快地聊着往昔校园里的趣事。', 'Các bạn học cũ quây quần bên nhau vui vẻ trò chuyện về những kỷ niệm vui thời đi học.', NOW(), NOW()),
  ('聊天儿', 'liáotiānr', 'liaotianr', 'Liêu Thiên Nhi', 'Tán gẫu, trò chuyện', 3, 'HSK 3.0', 756, '3', '2025', '动', NULL, '98', '下午闲暇时喝茶聊天儿是老舍茶馆里最具特色的风景。', 'Chiều rảnh rỗi uống trà tán gẫu là nét phong cảnh đặc sắc nhất ở quán trà Lão Xá.', NOW(), NOW()),
  ('了解', 'liǎojiě', 'liaojie', 'Liễu Giải', 'Hiểu rõ, tìm hiểu', 3, 'HSK 3.0', 757, '3', '2025', '动', NULL, '98', '通过这次实地深入走访，我们更全面地了解了当地风俗。', 'Thông qua chuyến đi thực tế sâu sát này, chúng tôi đã hiểu rõ toàn diện hơn về phong tục địa phương.', NOW(), NOW()),
  ('邻居', 'línjū', 'linju', 'Lân Cư', 'Hàng xóm, láng giềng', 3, 'HSK 3.0', 758, '3', '2025', '名', NULL, '98', '我和隔壁邻居的关系非常融洽。', 'Tôi và người hàng xóm bên cạnh quan hệ rất hòa thuận.', NOW(), NOW()),
  ('留学', 'liúxué', 'liuxue', 'Lưu Học', 'Du học', 3, 'HSK 3.0', 759, '3', '2025', '动', NULL, '98', '他从小立志长大后去世界知名顶尖学府留学深造。', 'Từ nhỏ cậu ấy đã lập chí lớn lên sẽ đi du học nâng cao tại trường đại học hàng đầu thế giới.', NOW(), NOW()),
  ('留学生', 'liúxuéshēng', 'liuxuesheng', 'Lưu Học Sinh', 'Du học sinh, lưu học sinh', 3, 'HSK 3.0', 760, '3', '2025', '名', NULL, '98', '我们大学每年招收数百名来自世界各地的国际留学生。', 'Trường đại học chúng tôi mỗi năm tuyển sinh hàng trăm du học sinh quốc tế đến từ khắp nơi trên thế giới.', NOW(), NOW()),
  ('楼梯', 'lóutī', 'louti', 'Lâu Thê', 'Cầu thang bộ', 3, 'HSK 3.0', 761, '3', '2025', '名', NULL, '99', '为了强身健体，他每天坚持步行上下楼梯而不乘电梯。', 'Để rèn luyện sức khỏe, anh ấy mỗi ngày kiên trì đi bộ lên xuống cầu thang thay vì đi thang máy.', NOW(), NOW()),
  ('路边', 'lùbiān', 'lubian', 'Lộ Biên', 'Ven đường, lề đường', 3, 'HSK 3.0', 762, '3', '2025', '名', NULL, '99', '夏日路边整齐栽种着许多枝繁叶茂的高大梧桐树。', 'Mùa hè ven đường trồng ngay ngắn nhiều cây ngô đồng to lớn cành lá tốt tươi.', NOW(), NOW()),
  ('马', 'mǎ', 'ma', 'Mã', 'Con ngựa', 3, 'HSK 3.0', 764, '3', '2025', '名', NULL, '99', '在辽阔广袤的内蒙古大草原上，骏马正在欢快奔腾。', 'Trên thảo nguyên Nội Mông bao la bát ngát, đàn tuấn mã đang vui vẻ tung vó phi nước đại.', NOW(), NOW()),
  ('满意', 'mǎnyì', 'manyi', 'Mãn Ý', 'Hài lòng, vừa ý', 3, 'HSK 3.0', 767, '3', '2025', '动', NULL, '99', '客户对我们团队这次高质量高效提交的设计方案十分满意。', 'Khách hàng vô cùng hài lòng với phương án thiết kế chất lượng cao tiến độ nhanh mà đội ngũ chúng tôi nộp lần này.', NOW(), NOW()),
  ('米', 'mǐ', 'mi', 'Mễ', 'Gạo, mét (đo lường)', 3, 'HSK 3.0', 769, '3', '2025', '量', NULL, '99', '大米是中国南方家庭每天餐桌上不可或缺的主食。', 'Gạo là lương thực chính không thể thiếu trên bàn ăn mỗi ngày của các gia đình miền Nam Trung Quốc.', NOW(), NOW()),
  ('面前', 'miànqián', 'mianqian', 'Diện Tiền', 'Trước mặt, phía trước', 3, 'HSK 3.0', 770, '3', '2025', '名', NULL, '99', '面对摆在面前的全新挑战，我们应当坚定信心迎难而上。', 'Đối diện với thử thách hoàn toàn mới bày ra trước mặt, chúng ta cần vững tin dũng cảm xốc tới.', NOW(), NOW()),
  ('名单', 'míngdān', 'mingdan', 'Danh Đơn', 'Danh sách, bảng tên', 3, 'HSK 3.0', 772, '3', '2025', '名', NULL, '99', '期末奖学金评选名单已经正式公布在学院官方公告栏上。', 'Danh sách bình chọn học bổng cuối kỳ đã chính thức niêm yết trên bảng thông báo chính thức của học viện.', NOW(), NOW()),
  ('名人', 'míngrén', 'mingren', 'Danh Nhân', 'Người nổi tiếng, danh nhân', 3, 'HSK 3.0', 773, '3', '2025', '名', NULL, '99', '不少文化名人都曾在这座百年老校里驻足讲学留下佳话。', 'Không ít danh nhân văn hóa từng dừng bước giảng dạy tại ngôi trường trăm năm này để lại giai thoại đẹp.', NOW(), NOW()),
  ('南方', 'nánfāng', 'nanfang', 'Nam Phương', 'Miền nam, phương nam', 3, 'HSK 3.0', 776, '3', '2025', '名', NULL, '99', '中国南方水网纵横密布，气候温暖湿润景色宜人。', 'Miền nam Trung Quốc sông ngòi dày đặc chằng chịt, khí hậu ấm áp ẩm ướt cảnh sắc hữu tình.', NOW(), NOW()),
  ('难过', 'nánguò', 'nanguo', 'Nan Quá', 'Buồn bã, đau lòng, khó chịu', 3, 'HSK 3.0', 777, '3', '2025', '形', NULL, '99', '听到心爱的小宠物生病住院的消息，她心里难过极了。', 'Nghe tin thú cưng yêu quý bị ốm phải nhập viện, trong lòng cô ấy buồn bã vô cùng.', NOW(), NOW()),
  ('难看', 'nánkàn', 'nankan', 'Nan Khán', 'Khó coi, xấu xí', 3, 'HSK 3.0', 778, '3', '2025', '形', NULL, '99', '虽然字迹写得有点儿难看，但内容条理十分严密清晰。', 'Tuy nét chữ viết có phần hơi khó coi nhưng nội dung lại vô cùng mạch lạc chặt chẽ.', NOW(), NOW()),
  ('难题', 'nántí', 'nanti', 'Nan Đề', 'Đề tài hóc búa, bài toán khó', 3, 'HSK 3.0', 781, '3', '2025', '名', NULL, '99', '面对这道奥数难题，同学们集思广益展开了热烈讨论。', 'Đối diện với bài toán khó thi học sinh giỏi này, các bạn học sinh cùng nhau hiến kế thảo luận sôi nổi.', NOW(), NOW()),
  ('难听', 'nántīng', 'nanting', 'Nan Thính', 'Khó nghe, chói tai', 3, 'HSK 3.0', 782, '3', '2025', '形', NULL, '99', '这把老旧的小提琴音准不准，拉出来的声音十分难听。', 'Cây đàn vĩ cầm cũ kỹ này dây không chuẩn, kéo ra âm thanh vô cùng chói tai.', NOW(), NOW()),
  ('年级', 'niánjí', 'nianji', 'Niên Cấp', 'Lớp, khối lớp, cấp bậc', 3, 'HSK 3.0', 783, '3', '2025', '名', NULL, '99', '他今年刚刚升入大学三年级，开始接触专业核心课程。', 'Năm nay anh ấy vừa lên năm thứ ba đại học, bắt đầu tiếp cận các môn học cốt lõi chuyên ngành.', NOW(), NOW()),
  ('年轻', 'niánqīng', 'nianqing', 'Niên Khinh', 'Trẻ tuổi, thanh niên', 3, 'HSK 3.0', 784, '3', '2025', '形', NULL, '99', '他虽然年轻，但是工作经验非常丰富。', 'Anh ấy tuy trẻ tuổi nhưng kinh nghiệm làm việc rất phong phú.', NOW(), NOW()),
  ('牛', 'niú', 'niu', 'Ngưu', 'Con bò, con trâu', 3, 'HSK 3.0', 785, '3', '2025', '名、（形）', NULL, '99', '老黄牛在田野间默默耕作，是中国勤劳奉献的传统象征。', 'Chú bò vàng lặng lẽ cày bừa trên đồng ruộng, là biểu tượng truyền thống cho sự cần cù cống hiến của Trung Hoa.', NOW(), NOW()),
  ('努力', 'nǔlì', 'nuli', 'Nỗ Lực', 'Nỗ lực, chăm chỉ', 3, 'HSK 3.0', 786, '3', '2025', '动、形', NULL, '99', '只要今天脚踏实地努力拼搏，明天的梦想就一定能实现。', 'Chỉ cần hôm nay vững bước nỗ lực hết mình, ước mơ ngày mai nhất định sẽ trở thành hiện thực.', NOW(), NOW()),
  ('爬', 'pá', 'pa', 'Ba', 'Leo, trèo, bò', 3, 'HSK 3.0', 789, '3', '2025', '动', NULL, '99', '秋高气爽的重阳节，登高爬山是中华民族的古老传统。', 'Dịp Tết Trùng Cửu thu cao khí mát, leo núi lên cao là truyền thống ngàn đời của dân tộc Trung Hoa.', NOW(), NOW()),
  ('怕', 'pà', 'pa', 'Phạ', 'Sợ, e rằng', 3, 'HSK 3.0', 790, '3', '2025', '动、（副）', NULL, '99', '暴风雨快要来临了，怕是今天下午的户外活动不得不取消。', 'Bão dông sắp kéo đến rồi, e rằng hoạt động ngoài trời chiều nay buộc phải hủy bỏ.', NOW(), NOW()),
  ('拍照', 'pāizhào', 'paizhao', 'Phách Chiếu', 'Chụp ảnh, chụp hình', 3, 'HSK 3.0', 791, '3', '2025', '动', NULL, '99', '金秋时节游客们纷纷在枫叶林前驻足拍照留念。', 'Tiết trời thu vàng du khách rủ nhau dừng bước chụp ảnh lưu niệm trước rừng lá phong.', NOW(), NOW()),
  ('盘子', 'pánzi', 'panzi', 'Bàn Tử', 'Cái đĩa, cái đĩa đựng thức ăn', 3, 'HSK 3.0', 792, '3', '2025', '名', NULL, '99', '服务员麻利地将洗得干干净净的白色瓷质盘子摆上餐桌。', 'Người phục vụ nhanh nhẹn bày những chiếc đĩa sứ trắng sạch bong lên bàn ăn.', NOW(), NOW()),
  ('胖', 'pàng', 'pang', 'Bàn', 'Mập, béo, mập mạp', 3, 'HSK 3.0', 793, '3', '2025', '形', NULL, '99', '猫咪经过几个月的精心喂养，长成了一只胖乎乎的大橘猫。', 'Chú mèo qua vài tháng được chăm bẵm cẩn thận đã lớn thành một chú mèo mướp vàng béo tròn xoe.', NOW(), NOW()),
  ('啤酒', 'píjiǔ', 'pijiu', 'Bia Tửu', 'Bia (đồ uống)', 3, 'HSK 3.0', 794, '3', '2025', '名', NULL, '99', '青岛啤酒是中国享誉世界知名品牌的传统酿造饮品之一。', 'Bia Thanh Đảo là một trong những thức uống ủ truyền thống mang thương hiệu nổi tiếng thế giới của Trung Quốc.', NOW(), NOW()),
  ('平时', 'píngshí', 'pingshi', 'Bình Thời', 'Bình thường, thường ngày', 3, 'HSK 3.0', 795, '3', '2025', '名', NULL, '99', '平时多注重身体保健锻炼，生病的概率就会大大降低。', 'Bình thường chú trọng chăm sóc sức khỏe và rèn luyện, tỷ lệ mắc bệnh sẽ giảm đi rất nhiều.', NOW(), NOW()),
  ('瓶子', 'píngzi', 'pingzi', 'Bình Tử', 'Cái chai, cái lọ', 3, 'HSK 3.0', 796, '3', '2025', '名', NULL, '99', '请把用完的空塑料瓶子随手投入可回收物垃圾箱内。', 'Xin hãy tiện tay vứt chiếc chai nhựa rỗng dùng xong vào thùng rác tái chế.', NOW(), NOW()),
  ('骑', 'qí', 'qi', 'Kỵ', 'Cưỡi, đi (xe đạp, xe máy)', 3, 'HSK 3.0', 797, '3', '2025', '动', NULL, '99', '骑共享单车穿行在大街小巷不仅低碳环保而且锻炼身体。', 'Đi xe đạp công cộng qua lại trên các ngõ phố không chỉ giảm khí thải bảo vệ môi trường mà còn rèn luyện sức khỏe.', NOW(), NOW()),
  ('奇怪', 'qíguài', 'qiguai', 'Kỳ Quái', 'Kỳ lạ, quái lạ', 3, 'HSK 3.0', 798, '3', '2025', '形', NULL, '99', '这只小鸟发出了一种以前从未听过的奇怪叫声。', 'Chú chim nhỏ này phát ra một tiếng kêu kỳ lạ chưa từng nghe thấy bao giờ.', NOW(), NOW()),
  ('其实', 'qíshí', 'qishi', 'Kỳ Thực', 'Kỳ thực, thực ra, thực chất', 3, 'HSK 3.0', 799, '3', '2025', '副', NULL, '99', '学中文看似很难，其实只要掌握了汉字规律就会变得很有趣。', 'Học tiếng Trung nhìn qua có vẻ khó, thực ra chỉ cần nắm chắc quy luật chữ Hán sẽ trở nên rất thú vị.', NOW(), NOW()),
  ('其他', 'qítā', 'qita', 'Kỳ Tha', 'Khác, cái khác, người khác', 3, 'HSK 3.0', 800, '3', '2025', '代', NULL, '99', '除了这个问题以外，大家还有其他需要补充的意见吗？', 'Ngoài vấn đề này ra, mọi người còn có ý kiến nào khác cần bổ sung không?', NOW(), NOW()),
  ('起飞', 'qǐfēi', 'qifei', 'Khởi Phi', 'Cất cánh, bay lên', 3, 'HSK 3.0', 802, '3', '2025', '动', NULL, '100', '飞往北京的大型民航客机准点在跑道上起飞升空。', 'Chuyến bay chở khách dân dụng cỡ lớn đi Bắc Kinh cất cánh bay lên đúng giờ trên đường băng.', NOW(), NOW()),
  ('铅笔', 'qiānbǐ', 'qianbi', 'Diên Bút', 'Bút chì', 3, 'HSK 3.0', 804, '3', '2025', '名', NULL, '100', '小学生初学写汉字时通常选用硬度适中的木质铅笔。', 'Học sinh tiểu học khi mới bắt đầu học viết chữ Hán thường chọn bút chì gỗ có độ cứng vừa phải.', NOW(), NOW()),
  ('前年', 'qiánnián', 'qiannian', 'Tiền Niên', 'Năm kia (hai năm trước)', 3, 'HSK 3.0', 805, '3', '2025', '名', NULL, '100', '我们全家在前年春节曾一起去哈尔滨观赏冰雕艺术。', 'Cả gia đình chúng tôi dịp Tết năm kia từng cùng nhau đi Cáp Nhĩ Tân ngắm nghệ thuật điêu khắc băng.', NOW(), NOW()),
  ('清楚', 'qīngchu', 'qingchu', 'Thanh Sở', 'Rõ ràng, minh bạch', 3, 'HSK 3.0', 807, '3', '2025', '形、动', NULL, '100', '老师把解题步骤详细写在黑板上，字迹格外清楚。', 'Thầy giáo viết các bước giải bài chi tiết lên bảng đen, nét chữ đặc biệt rõ ràng.', NOW(), NOW()),
  ('请客', 'qǐngkè', 'qingke', 'Thỉnh Khách', 'Mời khách, khao, bao chầu', 3, 'HSK 3.0', 809, '3', '2025', '动', NULL, '100', '今天我通过了汉语水平考试，晚上一定要请客庆祝一下！', 'Hôm nay tôi đã vượt qua kỳ thi năng lực Hán ngữ, tối nay nhất định phải khao một chầu để ăn mừng!', NOW(), NOW()),
  ('秋天', 'qiūtiān', 'qiutian', 'Thu Thiên', 'Mùa thu', 3, 'HSK 3.0', 810, '3', '2025', '名', NULL, '100', '秋天是硕果累累五谷丰登的金黄色丰收季节。', 'Mùa thu là mùa thu hoạch vàng óng trĩu quả mùa màng bội thu.', NOW(), NOW()),
  ('球场', 'qiúchǎng', 'qiuchang', 'Cầu Trường', 'Sân bóng', 3, 'HSK 3.0', 811, '3', '2025', '名', NULL, '100', '下午放学后，宽阔的绿茵球场上活跃着热爱运动的学生。', 'Chiều sau giờ tan học, trên sân bóng cỏ xanh rộng lớn rộn ràng các bạn học sinh yêu thích thể thao.', NOW(), NOW()),
  ('裙子', 'qúnzi', 'qunzi', 'Quần Tử', 'Váy, chân váy', 3, 'HSK 3.0', 812, '3', '2025', '名', NULL, '100', '这条红色的裙子非常适合你。', 'Chiếc váy màu đỏ này rất hợp với bạn.', NOW(), NOW()),
  ('然后', 'ránhòu', 'ranhou', 'Nhiên Hậu', 'Sau đó, rồi thì', 3, 'HSK 3.0', 813, '3', '2025', '连', NULL, '100', '我们先参观了国家博物馆，然后一起漫步天安门广场。', 'Chúng tôi tham quan Bảo tàng Quốc gia trước, sau đó cùng nhau tản bộ trên Quảng trường Thiên An Môn.', NOW(), NOW()),
  ('热情', 'rèqíng', 'reqing', 'Nhiệt Tình', 'Nhiệt tình, niềm nở', 3, 'HSK 3.0', 814, '3', '2025', '形', NULL, '100', '当地百姓非常热情好客，端出最好的特色美食招待远方客人。', 'Người dân địa phương vô cùng nhiệt tình hiếu khách, bưng ra những món ngon đặc sản nhất thết đãi khách phương xa.', NOW(), NOW()),
  ('认得', 'rènde', 'rende', 'Nhận Đắc', 'Nhận ra, nhận biết', 3, 'HSK 3.0', 815, '3', '2025', '动', NULL, '100', '多年未见，老同学在茫茫人海中依然一眼就认得彼此。', 'Nhiều năm chưa gặp, đôi bạn học cũ giữa biển người mênh mông vẫn nhận ra nhau ngay từ cái nhìn đầu tiên.', NOW(), NOW()),
  ('认为', 'rènwéi', 'renwei', 'Nhận Vi', 'Cho rằng, nghĩ rằng', 3, 'HSK 3.0', 816, '3', '2025', '动', NULL, '100', '大多数专家认为这种绿色能源具有非常广阔的应用前景。', 'Đa số các chuyên gia cho rằng loại năng lượng xanh này có triển vọng ứng dụng vô cùng rộng mở.', NOW(), NOW()),
  ('容易', 'róngyì', 'rongyi', 'Dung Dị', 'Dễ dàng, thuận lợi', 3, 'HSK 3.0', 818, '3', '2025', '形', NULL, '100', '天下无难事，只要肯登攀，没有克服不了的容易或艰难。', 'Dưới gầm trời không việc gì khó, chỉ cần quyết chí trèo cao, không có gian nan hay dễ dàng nào không vượt qua được.', NOW(), NOW()),
  ('如果', 'rúguǒ', 'ruguo', 'Như Quả', 'Nếu như, giả sử', 3, 'HSK 3.0', 819, '3', '2025', '连', NULL, '100', '如果明天下大雨，我们原定的户外长跑活动就改为室内进行。', 'Nếu như ngày mai trời mưa to, hoạt động chạy bền ngoài trời đã định của chúng ta sẽ chuyển sang tổ chức trong nhà.', NOW(), NOW()),
  ('伞', 'sǎn', 'san', 'Tản', 'Cái ô, cái dù', 3, 'HSK 3.0', 820, '3', '2025', '名', NULL, '100', '夏季多阵雨，出门包里常备一把折叠伞防患于未然。', 'Mùa hè hay có mưa dông, trong túi ra ngoài thường để sẵn một chiếc ô gấp để phòng khi cần.', NOW(), NOW()),
  ('扫', 'sǎo', 'sao', 'Tảo', 'Quét, quét dọn', 3, 'HSK 3.0', 821, '3', '2025', '动', NULL, '100', '环卫工人们清晨五点就拿起大扫帚把马路打扫得干干净净。', 'Các công nhân vệ sinh môi trường từ năm giờ sáng đã cầm chổi lớn quét dọn đường phố sạch bong.', NOW(), NOW()),
  ('沙发', 'shāfā', 'shafa', 'Sa Phát', 'Ghế sofa, đi-văng', 3, 'HSK 3.0', 822, '3', '2025', '名', NULL, '100', '结束了一整天繁忙的工作后，瘫坐在舒适柔软的沙发上最惬意。', 'Sau khi kết thúc một ngày làm việc bận rộn, ngả lưng trên chiếc sofa êm ái mềm mại là thư thái nhất.', NOW(), NOW()),
  ('上衣', 'shàngyī', 'shangyi', 'Thượng Y', 'Áo khoác trên, áo mặc trên', 3, 'HSK 3.0', 824, '3', '2025', '名', NULL, '100', '他今天穿了一件深蓝色的保暖夹克上衣去上班。', 'Hôm nay anh ấy mặc một chiếc áo khoác ấm màu xanh lam sẫm đi làm.', NOW(), NOW()),
  ('勺子', 'sháozi', 'shaozi', 'Chước Tử', 'Cái thìa, cái muỗng', 3, 'HSK 3.0', 825, '3', '2025', '名', NULL, '100', '喝热汤的时候请用专用的陶瓷小勺子，避免烫伤。', 'Khi húp canh nóng xin hãy dùng chiếc thìa sứ chuyên dụng để tránh bị bỏng.', NOW(), NOW()),
  ('身边', 'shēnbiān', 'shenbian', 'Thân Biên', 'Bên cạnh, bên mình', 3, 'HSK 3.0', 826, '3', '2025', '名', NULL, '100', '无论走到天涯海角，亲人的深情牵挂永远陪伴在我们身边。', 'Dù có đi đến chân trời góc biển, tình cảm chở che của người thân mãi luôn đồng hành bên cạnh chúng ta.', NOW(), NOW()),
  ('身高', 'shēngāo', 'shengao', 'Thân Cao', 'Chiều cao, chiều cao cơ thể', 3, 'HSK 3.0', 827, '3', '2025', '名', NULL, '100', '定期测量身高体重是监测青少年儿童健康发育的重要指标。', 'Đo chiều cao cân nặng định kỳ là chỉ số quan trọng để theo dõi sự phát triển thể chất của thanh thiếu niên trẻ em.', NOW(), NOW()),
  ('声', 'shēng', 'sheng', 'Thanh', 'Tiếng, âm thanh (lượng từ lời nói)', 3, 'HSK 3.0', 828, '3', '2025', '名、量', NULL, '100', '远处群山间传来了一声清脆悦耳的鸟鸣。', 'Giữa những ngọn núi xa xa vọng lại một tiếng chim hót lảnh lót êm tai.', NOW(), NOW()),
  ('生活', 'shēnghuó', 'shenghuo', 'Sinh Hoạt', 'Cuộc sống, đời sống, sinh hoạt', 3, 'HSK 3.0', 829, '3', '2025', '名、动', NULL, '100', '积极乐观的人生态度能够让平凡的生活充满欢歌笑语。', 'Thái độ nhân sinh tích cực lạc quan có thể làm cho cuộc sống bình dị tràn đầy tiếng cười và lời ca.', NOW(), NOW()),
  ('声音', 'shēngyīn', 'shengyin', 'Thanh Âm', 'Âm thanh, tiếng vang', 3, 'HSK 3.0', 831, '3', '2025', '名', NULL, '100', '教室里传出了同学们整齐响亮的朗读课文声音。', 'Trong phòng học vang lên âm thanh đọc bài khóa đồng thanh to rõ của các bạn học sinh.', NOW(), NOW()),
  ('市', 'shì', 'shi', 'Thị', 'Thị xã, thành phố, chợ', 3, 'HSK 3.0', 832, '3', '2025', '名', NULL, '100', '这座沿海开放城市近年来经济活力十足，发展迅速。', 'Thành phố mở ven biển này những năm gần đây sức sống kinh tế dồi dào, phát triển thần tốc.', NOW(), NOW()),
  ('室', 'shì', 'shi', 'Thất', 'Phòng, buồng', 3, 'HSK 3.0', 834, '3', '2025', '名', NULL, '100', '我们在三楼的安静图书阅览室里认真查阅文献资料。', 'Chúng tôi ở trong phòng đọc sách yên tĩnh tại tầng ba chăm chú tra cứu tài liệu văn kiện.', NOW(), NOW()),
  ('世界', 'shìjiè', 'shijie', 'Thế Giới', 'Thế giới', 3, 'HSK 3.0', 835, '3', '2025', '名', NULL, '100', '互联网技术彻底拉近了世界各国人民之间的距离。', 'Công nghệ internet đã kéo lại gần hoàn toàn khoảng cách giữa nhân dân các nước trên toàn thế giới.', NOW(), NOW()),
  ('收', 'shōu', 'shou', 'Thu', 'Thu, nhận, dọn dẹp, thu dọn', 3, 'HSK 3.0', 836, '3', '2025', '动', NULL, '100', '期末离校前请同学们把个人物品妥善收拾干净带走。', 'Trước khi rời trường cuối kỳ xin các bạn học sinh thu dọn gọn gàng đồ đạc cá nhân mang về.', NOW(), NOW()),
  ('收到', 'shōudào', 'shoudao', 'Thu Đáo', 'Nhận được, tiếp nhận', 3, 'HSK 3.0', 837, '3', '2025', '动', NULL, '100', '今天下午我终于收到了大学录取通知书的挂号信。', 'Chiều nay tôi rốt cuộc đã nhận được thư bảo đảm báo tin trúng tuyển đại học.', NOW(), NOW()),
  ('受', 'shòu', 'shou', 'Thụ', 'Chịu đựng, nhận, chịu', 3, 'HSK 3.0', 838, '3', '2025', '动', NULL, '100', '无论遇到多么严酷的考验，他都勇敢经受住了考验。', 'Dù gặp phải khảo nghiệm khắc nghiệt đến đâu, anh ấy đều dũng cảm vượt qua chịu đựng.', NOW(), NOW()),
  ('瘦', 'shòu', 'shou', 'Sấu', 'Gầy, ốm, chật hẹp', 3, 'HSK 3.0', 839, '3', '2025', '形', NULL, '100', '几个月坚持规律锻炼和健康膳食，他明显瘦了一圈。', 'Mấy tháng kiên trì rèn luyện điều độ và ăn uống lành mạnh, anh ấy đã gầy đi trông thấy.', NOW(), NOW()),
  ('受到', 'shòudào', 'shoudao', 'Thụ Đáo', 'Nhận được, chịu sự (ảnh hưởng, khen ngợi)', 3, 'HSK 3.0', 840, '3', '2025', '动', NULL, '100', '这名年轻志愿者的无私奉献精神受到了社会各界广泛好评。', 'Tinh thần cống hiến vô tư của bạn tình nguyện viên trẻ này đã nhận được sự khen ngợi rộng rãi từ các giới xã hội.', NOW(), NOW()),
  ('叔叔', 'shūshu', 'shushu', 'Thúc Thúc', 'Chú, bác', 3, 'HSK 3.0', 841, '3', '2025', '名', NULL, '101', '热心的邻居张叔叔常常帮大伙儿维修各种损坏的小家电。', 'Bác Trương hàng xóm nhiệt tình thường hay giúp mọi người sửa chữa các đồ điện gia dụng nhỏ bị hỏng.', NOW(), NOW()),
  ('数学', 'shùxué', 'shuxue', 'Số Học', 'Toán học, môn toán', 3, 'HSK 3.0', 843, '3', '2025', '名', NULL, '101', '学好基础数学能够培养人严谨缜密的逻辑思维能力。', 'Học tốt toán học cơ bản có thể bồi dưỡng năng lực tư duy logic chặt chẽ cẩn trọng cho con người.', NOW(), NOW()),
  ('刷', 'shuā', 'shua', 'Loát', 'Chải, quét (thẻ), rửa', 3, 'HSK 3.0', 844, '3', '2025', '动', NULL, '101', '每天早晚认真刷牙是保持口腔卫生预防龋齿的基本要求。', 'Mỗi sáng tối chăm chỉ đánh răng là yêu cầu cơ bản để giữ vệ sinh răng miệng phòng ngừa sâu răng.', NOW(), NOW()),
  ('双', 'shuāng', 'shuang', 'Song', 'Đôi, cặp (lượng từ giày, đũa, mắt)', 3, 'HSK 3.0', 845, '3', '2025', '量', NULL, '101', '过年时妈妈给我买了一双崭新的白色运动鞋。', 'Dịp đón tết mẹ đã mua cho tôi một đôi giày thể thao màu trắng mới tinh.', NOW(), NOW()),
  ('水平', 'shuǐpíng', 'shuiping', 'Thuỷ Bình', 'Trình độ, mức độ, tiêu chuẩn', 3, 'HSK 3.0', 846, '3', '2025', '名', NULL, '101', '经过半年沉浸式学习，他的汉语口语水平有了质的飞跃。', 'Qua nửa năm học tập đắm chìm, trình độ khẩu ngữ tiếng Trung của anh ấy đã có bước tiến nhảy vọt về chất.', NOW(), NOW()),
  ('司机', 'sījī', 'siji', 'Ty Cơ', 'Tài xế, bác tài', 3, 'HSK 3.0', 847, '3', '2025', '名', NULL, '101', '公交车老司机行车经验极其丰富，驾驶技术平稳安全。', 'Bác tài xế xe buýt lâu năm kinh nghiệm lái xe cực kỳ phong phú, kỹ thuật điều khiển xe êm ái an toàn.', NOW(), NOW()),
  ('四季', 'sìjì', 'siji', 'Tứ Quý', 'Bốn mùa, bốn quý', 3, 'HSK 3.0', 848, '3', '2025', '名', NULL, '101', '昆明气候宜人四季如春，享有春城的美誉。', 'Côn Minh khí hậu dễ chịu bốn mùa như xuân, được ngợi ca với danh xưng Thành phố Mùa Xuân.', NOW(), NOW()),
  ('太阳', 'tàiyáng', 'taiyang', 'Thái Dương', 'Mặt trời, ánh thái dương', 3, 'HSK 3.0', 849, '3', '2025', '名', NULL, '101', '明媚温暖的太阳照耀着大地，融化了冰封的雪水。', 'Mặt trời ấm áp rực rỡ chiếu rọi đất trời, làm tan chảy dòng nước tuyết đóng băng.', NOW(), NOW()),
  ('糖', 'táng', 'tang', 'Đường', 'Đường, kẹo', 3, 'HSK 3.0', 850, '3', '2025', '名', NULL, '101', '小孩子吃完含糖糖果后要及时漱口以防止蛀牙。', 'Trẻ nhỏ sau khi ăn kẹo ngọt có đường cần kịp thời súc miệng để phòng tránh sâu răng.', NOW(), NOW()),
  ('特别', 'tèbié', 'tebie', 'Đặc Biệt', 'Đặc biệt, vô cùng', 3, 'HSK 3.0', 851, '3', '2025', '形、副', NULL, '101', '今天全班同学为老师准备了一份特别有意义的教师节礼物。', 'Hôm nay toàn thể học sinh trong lớp đã chuẩn bị cho thầy cô một món quà ngày Nhà giáo đặc biệt có ý nghĩa.', NOW(), NOW()),
  ('提高', 'tígāo', 'tigao', 'Đề Cao', 'Nâng cao, cải thiện, tăng cường', 3, 'HSK 3.0', 852, '3', '2025', '动', NULL, '101', '坚持每天阅读中文原版报刊能够显著提高阅读理解速度。', 'Kiên trì mỗi ngày đọc báo chí ấn bản gốc tiếng Trung có thể nâng cao tốc độ đọc hiểu một cách rõ rệt.', NOW(), NOW()),
  ('体育', 'tǐyù', 'tiyu', 'Thể Dục', 'Thể dục, thể thao', 3, 'HSK 3.0', 853, '3', '2025', '名', NULL, '101', '学校每年春季都按时举办盛大的全校性体育运动会。', 'Trường học mỗi năm vào mùa xuân đều tổ chức đại hội thể dục thể thao toàn trường tưng bừng đúng hẹn.', NOW(), NOW()),
  ('体育馆', 'tǐyùguǎn', 'tiyuguan', 'Thể Dục Quán', 'Nhà thi đấu, phòng tập thể dục', 3, 'HSK 3.0', 854, '3', '2025', '名', NULL, '101', '这座现代化体育馆能承办国际一流规格的羽毛球比赛。', 'Nhà thi đấu hiện đại này có thể tổ chức các giải thi đấu cầu lông quy mô tiêu chuẩn hàng đầu quốc tế.', NOW(), NOW()),
  ('甜', 'tián', 'tian', 'Điềm', 'Ngọt, ngọt ngào', 3, 'HSK 3.0', 855, '3', '2025', '形', NULL, '101', '新疆吐鲁番昼夜温差大，出产的葡萄格外甘甜多汁。', 'Thổ Lỗ Phiên ở Tân Cương chênh lệch nhiệt độ ngày đêm lớn, nho sản xuất ra đặc biệt ngọt ngào mọng nước.', NOW(), NOW()),
  ('跳', 'tiào', 'tiao', 'Khiêu', 'Nhảy, bật, khiêu vũ', 3, 'HSK 3.0', 856, '3', '2025', '动', NULL, '101', '欢快的小袋鼠在草原上一下又一下敏捷地跳跃着。', 'Những chú chuột túi nhỏ tinh nghịch thoăn thoắt nhảy từng bước từng bước trên đồng cỏ.', NOW(), NOW()),
  ('听说', 'tīngshuō', 'tingshuo', 'Thính Thuyết', 'Nghe nói, nghe đồn', 3, 'HSK 3.0', 857, '3', '2025', '动', NULL, '101', '听说下周学校艺术节将有一场精彩的中外学生大合唱。', 'Nghe nói tuần sau trong ngày hội nghệ thuật của trường sẽ có một màn hợp xướng tuyệt vời của sinh viên trong và ngoài nước.', NOW(), NOW()),
  ('挺', 'tǐng', 'ting', 'Đĩnh', 'Rất, thẳng, kiên cường', 3, 'HSK 3.0', 858, '3', '2025', '副、（动）', NULL, '101', '这本新出版的历史小说写得挺有深度的。', 'Cuốn tiểu thuyết lịch sử mới xuất bản này viết rất có chiều sâu.', NOW(), NOW()),
  ('同事', 'tóngshì', 'tongshi', 'Đồng Sự', 'Đồng nghiệp', 3, 'HSK 3.0', 859, '3', '2025', '名', NULL, '101', '我和部门里的几位同事相处得非常融洽愉快。', 'Tôi và vài đồng nghiệp trong bộ phận sống chan hòa hòa thuận với nhau rất vui vẻ.', NOW(), NOW()),
  ('同意', 'tóngyì', 'tongyi', 'Đồng Ý', 'Đồng ý, tán thành', 3, 'HSK 3.0', 860, '3', '2025', '动', NULL, '101', '经过充分讨论，大家一致同意采纳这个创新方案。', 'Sau khi thảo luận kỹ lưỡng, mọi người nhất trí đồng ý tiếp thu phương án đổi mới này.', NOW(), NOW()),
  ('头发', 'tóufa', 'toufa', 'Đầu Phát', 'Tóc, mái tóc', 3, 'HSK 3.0', 861, '3', '2025', '名', NULL, '101', '她留着一头乌黑柔顺的长头发，显得格外温婉。', 'Cô ấy để một mái tóc dài đen nhánh mềm mượt, trông đặc biệt dịu dàng đằm thắm.', NOW(), NOW()),
  ('突然', 'tūrán', 'turan', 'Đột Nhiên', 'Đột nhiên, bất ngờ', 3, 'HSK 3.0', 862, '3', '2025', '形', NULL, '101', '刚才还是晴空万里，突然间就下起了瓢泼大雨。', 'Vừa nãy trời còn trong xanh vạn dặm, bỗng chốc đã đổ cơn mưa như trút nước.', NOW(), NOW()),
  ('腿', 'tuǐ', 'tui', 'Thoái', 'Chân, cẳng chân', 3, 'HSK 3.0', 864, '3', '2025', '名', NULL, '101', '踢足球时不慎拉伤了腿部肌肉，需要好好静养。', 'Khi đá bóng không may bị căng cơ chân, cần tĩnh dưỡng nghỉ ngơi cẩn thận.', NOW(), NOW()),
  ('外地', 'wàidì', 'waidi', 'Ngoại Địa', 'Nơi khác, vùng khác, ngoại tỉnh', 3, 'HSK 3.0', 865, '3', '2025', '名', NULL, '101', '许多来自外地的游客趁着黄金周假期来北京观光。', 'Rất nhiều du khách đến từ nơi khác tranh thủ kỳ nghỉ tuần lễ vàng đến Bắc Kinh tham quan.', NOW(), NOW()),
  ('外卖', 'wàimài', 'waimai', 'Ngoại Mại', 'Đồ ăn mang về, đồ giao tận nơi', 3, 'HSK 3.0', 866, '3', '2025', '动、名', NULL, '101', '下班晚了不想做饭，点一份热乎乎的外卖很方便。', 'Tan sở muộn không muốn nấu cơm, gọi một suất đồ ăn giao tận nơi nóng hổi rất tiện.', NOW(), NOW()),
  ('完成', 'wánchéng', 'wancheng', 'Hoàn Thành', 'Hoàn thành, làm xong', 3, 'HSK 3.0', 868, '3', '2025', '动', NULL, '101', '我们团队在截止日期前保质保量地完成了整个项目。', 'Nhóm chúng tôi trước thời hạn chót đã hoàn thành toàn bộ dự án đảm bảo chất lượng và số lượng.', NOW(), NOW()),
  ('碗', 'wǎn', 'wan', 'Oản', 'Bát, chén (ăn cơm), bát (lượng từ)', 3, 'HSK 3.0', 869, '3', '2025', '名', NULL, '101', '妈妈在厨房里盛了一碗热气腾腾的鸡汤端给我。', 'Mẹ múc một bát canh gà bốc khói nghi ngút trong bếp bưng cho tôi.', NOW(), NOW()),
  ('晚点', 'wǎndiǎn', 'wandian', 'Vãn Điểm', 'Đến muộn, trễ giờ (tàu, xe)', 3, 'HSK 3.0', 870, '3', '2025', '动', NULL, '101', '由于暴风雪天气影响，多趟北上的列车出现晚点。', 'Do ảnh hưởng của thời tiết bão tuyết, nhiều chuyến tàu chạy về phía bắc đã bị trễ giờ.', NOW(), NOW()),
  ('晚会', 'wǎnhuì', 'wanhui', 'Vãn Hội', 'Dạ hội, buổi liên hoan tối', 3, 'HSK 3.0', 871, '3', '2025', '名', NULL, '101', '学校举行的新春迎新晚会节目精彩纷呈引人入胜。', 'Đêm dạ hội đón mừng năm mới do trường tổ chức các tiết mục vô cùng đặc sắc cuốn hút.', NOW(), NOW()),
  ('网球', 'wǎngqiú', 'wangqiu', 'Võng Cầu', 'Quần vợt, bóng tennis', 3, 'HSK 3.0', 872, '3', '2025', '名', NULL, '101', '他每个周末都约上朋友去体育馆打两小时网球。', 'Cứ mỗi cuối tuần anh ấy đều hẹn bạn bè đến nhà thi đấu chơi quần vợt hai tiếng.', NOW(), NOW()),
  ('网站', 'wǎngzhàn', 'wangzhan', 'Võng Trạm', 'Trang web, website', 3, 'HSK 3.0', 873, '3', '2025', '名', NULL, '101', '欢迎访问我们学校官方网站查询最新招生简章。', 'Hoan nghênh truy cập trang web chính thức của trường chúng tôi để tra cứu thông báo tuyển sinh mới nhất.', NOW(), NOW()),
  ('为', 'wèi', 'wei', 'Vi', 'Vì, cho, làm', 3, 'HSK 3.0', 875, '3', '2025', '介', NULL, '101', '大家都在为实现中华民族的伟大复兴而努力奋斗。', 'Mọi người đều đang vì mục tiêu phấn đấu thực hiện sự phục hưng vĩ đại của dân tộc.', NOW(), NOW()),
  ('为了', 'wèile', 'weile', 'Vi Liễu', 'Để, vì (mục đích)', 3, 'HSK 3.0', 876, '3', '2025', '介', NULL, '101', '为了能够顺利通过汉语水平考试，他每天刻苦练习听力。', 'Để có thể vượt qua kỳ thi năng lực tiếng Trung một cách thuận lợi, anh ấy mỗi ngày khổ luyện nghe.', NOW(), NOW()),
  ('卫生间', 'wèishēngjiān', 'weishengjian', 'Vệ Sinh Gian', 'Nhà vệ sinh, phòng vệ sinh', 3, 'HSK 3.0', 877, '3', '2025', '名', NULL, '101', '请问图书馆二楼的卫生间应该往哪个方向走？', 'Xin hỏi nhà vệ sinh ở tầng hai thư viện nên đi theo hướng nào?', NOW(), NOW()),
  ('文化', 'wénhuà', 'wenhua', 'Văn Hoá', 'Văn hóa', 3, 'HSK 3.0', 878, '3', '2025', '名', NULL, '101', '博大精深的中华传统文化吸引了世界各地的汉学爱好者。', 'Văn hóa truyền thống Trung Hoa sâu rộng uyên bác đã thu hút những người yêu thích Hán học khắp nơi trên thế giới.', NOW(), NOW()),
  ('屋子', 'wūzi', 'wuzi', 'Ốc Tử', 'Căn phòng, căn nhà', 3, 'HSK 3.0', 879, '3', '2025', '名', NULL, '101', '阳光洒进这间整洁宽敞的屋子里，让人倍感温馨。', 'Ánh nắng chan hòa rọi vào căn phòng sạch sẽ rộng rãi này, khiến lòng người thêm ấm áp.', NOW(), NOW()),
  ('西北', 'xīběi', 'xibei', 'Tây Bắc', 'Tây bắc, vùng tây bắc', 3, 'HSK 3.0', 881, '3', '2025', '名', NULL, '102', '中国西北地区有着雄浑辽阔的大漠戈壁风光。', 'Vùng tây bắc Trung Quốc có phong cảnh sa mạc sa mạc đá mênh mông hùng vĩ.', NOW(), NOW()),
  ('西方', 'xīfāng', 'xifang', 'Tây Phương', 'Phương tây, phía tây', 3, 'HSK 3.0', 882, '3', '2025', '名', NULL, '102', '中西方文化交流与对话促进了不同文明之间的互鉴。', 'Giao lưu và đối thoại văn hóa giữa Trung Hoa và phương Tây đã thúc đẩy sự học hỏi lẫn nhau giữa các nền văn minh.', NOW(), NOW()),
  ('西瓜', 'xīguā', 'xigua', 'Tây Qua', 'Dưa hấu', 3, 'HSK 3.0', 883, '3', '2025', '名', NULL, '102', '炎炎酷暑夏日里，切开一个冰镇西瓜格外清甜解暑。', 'Trong ngày hè nắng nóng gay gắt, bổ một quả dưa hấu ướp lạnh đặc biệt ngọt mát xua tan cái nóng.', NOW(), NOW()),
  ('西南', 'xīnán', 'xinan', 'Tây Nam', 'Tây nam, vùng tây nam', 3, 'HSK 3.0', 884, '3', '2025', '名', NULL, '102', '中国西南的云南省素有彩云之南和动植物王国的美誉。', 'Tỉnh Vân Nam ở vùng tây nam Trung Quốc vốn có danh xưng miền nam mây ngũ sắc và vương quốc động thực vật.', NOW(), NOW()),
  ('习惯', 'xíguàn', 'xiguan', 'Tập Quán', 'Thói quen, quen với', 3, 'HSK 3.0', 885, '3', '2025', '动、名', NULL, '102', '养成每天坚持晨读的好习惯将让人终身受益无穷。', 'Rèn luyện thói quen tốt kiên trì đọc sách buổi sáng mỗi ngày sẽ khiến con người ta được hưởng lợi vô cùng suốt đời.', NOW(), NOW()),
  ('喜爱', 'xǐ’ài', 'xiai', 'Hỉ Ái', 'Yêu thích, mến chuộng', 3, 'HSK 3.0', 886, '3', '2025', '动', NULL, '102', '这首经典的中国民间乐曲深受各年龄段群众的喜爱。', 'Khúc nhạc dân gian Trung Hoa kinh điển này được quần chúng ở mọi lứa tuổi vô cùng mến chuộng.', NOW(), NOW()),
  ('洗衣机', 'xǐyījī', 'xiyiji', 'Tẩy Y Cơ', 'Máy giặt', 3, 'HSK 3.0', 887, '3', '2025', '名', NULL, '102', '全自动滚筒洗衣机的普及彻底解放了人们的双手。', 'Sự phổ cập của máy giặt lồng ngang hoàn toàn tự động đã giải phóng hoàn toàn đôi bàn tay con người.', NOW(), NOW()),
  ('洗澡', 'xǐzǎo', 'xizao', 'Tẩy Táo', 'Tắm, tắm rửa', 3, 'HSK 3.0', 888, '3', '2025', '动', NULL, '102', '每天晚上睡前洗澡是个好习惯。', 'Mỗi tối tắm trước khi đi ngủ là một thói quen tốt.', NOW(), NOW()),
  ('夏天', 'xiàtiān', 'xiatian', 'Hạ Thiên', 'Mùa hè', 3, 'HSK 3.0', 889, '3', '2025', '名', NULL, '102', '夏天池塘里荷花盛开，粉红翠绿相映成趣美不胜收。', 'Mùa hè hoa sen trong đầm nở rộ, hồng thắm xanh tươi hòa quyện tạo nên cảnh đẹp khó tả.', NOW(), NOW()),
  ('香蕉', 'xiāngjiāo', 'xiangjiao', 'Hương Tiêu', 'Quả chuối', 3, 'HSK 3.0', 891, '3', '2025', '名', NULL, '102', '香蕉富含丰富的钾元素，是运动后补充能量的理想水果。', 'Quả chuối giàu nguyên tố kali phong phú, là loại hoa quả lý tưởng để bổ sung năng lượng sau vận động.', NOW(), NOW()),
  ('相信', 'xiāngxìn', 'xiangxin', 'Tương Tín', 'Tin tưởng, tin tưởng vào', 3, 'HSK 3.0', 892, '3', '2025', '动', NULL, '102', '我相信只要坚持努力，就一定能成功。', 'Tôi tin rằng chỉ cần kiên trì nỗ lực thì nhất định sẽ thành công.', NOW(), NOW()),
  ('箱子', 'xiāngzi', 'xiangzi', 'Sương Tử', 'Chiếc hòm, vali, hộp', 3, 'HSK 3.0', 893, '3', '2025', '名', NULL, '102', '出发远行前，他将随身换洗衣物整齐地装入旅行箱子里。', 'Trước khi lên đường đi xa, anh ấy xếp gọn quần áo thay thường ngày vào trong chiếc vali du lịch.', NOW(), NOW()),
  ('向', 'xiàng', 'xiang', 'Hướng', 'Hướng về, về phía', 3, 'HSK 3.0', 894, '3', '2025', '动、介', NULL, '102', '清晨的向日葵迎着冉冉升起的红日，始终坚定地向着阳光。', 'Hoa hướng dương buổi sớm đón vầng thái dương đỏ rực đang mọc, luôn hướng về phía ánh sáng một cách kiên định.', NOW(), NOW()),
  ('像', 'xiàng', 'xiang', 'Tượng', 'Giống như, như', 3, 'HSK 3.0', 895, '3', '2025', '动、（副）、（名）', NULL, '102', '那双清澈明亮的大眼睛像天空中闪烁的晶莹繁星。', 'Đôi mắt to tròn trong sáng long lanh kia giống như muôn ngàn vì sao lấp lánh trên bầu trời.', NOW(), NOW()),
  ('相机', 'xiàngjī', 'xiangji', 'Tương Cơ', 'Máy ảnh, máy chụp hình', 3, 'HSK 3.0', 896, '3', '2025', '名', NULL, '102', '摄影师拿起专业单反相机，精准记录下飞鸟展翅的瞬间。', 'Nhiếp ảnh gia cầm máy ảnh chuyên dụng lên, ghi lại chuẩn xác khoảnh khắc đàn chim sải cánh tung bay.', NOW(), NOW()),
  ('小区', 'xiǎoqū', 'xiaoqu', 'Tiểu Khu', 'Khu dân cư, tiểu khu', 3, 'HSK 3.0', 897, '3', '2025', '名', NULL, '102', '我们小区的绿化覆盖率很高，生活配套设施也一应俱全。', 'Tỷ lệ phủ xanh của khu dân cư chúng tôi rất cao, các tiện ích sinh hoạt cũng đầy đủ vẹn toàn.', NOW(), NOW()),
  ('小心', 'xiǎoxīn', 'xiaoxin', 'Tiểu Tâm', 'Cẩn thận, chú ý', 3, 'HSK 3.0', 898, '3', '2025', '动、形', NULL, '102', '下雨天路面湿滑，骑车出行一定要格外小心慢行。', 'Ngày mưa mặt đường trơn ướt, đi xe ra ngoài nhất định phải đặc biệt cẩn thận đi chậm rãi.', NOW(), NOW()),
  ('校园', 'xiàoyuán', 'xiaoyuan', 'Hiệu Viên', 'Khuôn viên trường, sân trường', 3, 'HSK 3.0', 899, '3', '2025', '名', NULL, '102', '秋日的大学校园里落叶金黄，处处洋溢着青春的书卷气。', 'Khuôn viên trường đại học ngày thu lá vàng rơi ngập lối, khắp nơi tràn ngập hơi thở thanh xuân đèn sách.', NOW(), NOW()),
  ('校长', 'xiàozhǎng', 'xiaozhang', 'Hiệu Trường', 'Hiệu trưởng', 3, 'HSK 3.0', 900, '3', '2025', '名', NULL, '102', '在毕业典礼上，德高望重的老校长发表了语重心长的讲话。', 'Trong lễ tốt nghiệp, vị hiệu trưởng già đức cao vọng trọng đã phát biểu những lời dặn dò thấm thía sâu sắc.', NOW(), NOW()),
  ('鞋', 'xié', 'xie', 'Hài', 'Giày, đôi giày', 3, 'HSK 3.0', 901, '3', '2025', '名', NULL, '102', '登山一定要穿一双防滑耐磨透气性能良好的专业徒步鞋。', 'Đi leo núi nhất định phải đi một đôi giày đi bộ chuyên dụng chống trượt mài mòn và thoáng khí tốt.', NOW(), NOW()),
  ('心里', 'xīnlǐ', 'xinli', 'Tâm Lý', 'Trong lòng, nội tâm', 3, 'HSK 3.0', 902, '3', '2025', '名', NULL, '102', '听到远方家人的平安报信，他悬在心里的石头终于落地了。', 'Nghe được tin báo bình an của người thân ở phương xa, tảng đá đè nặng trong lòng anh ấy rốt cuộc đã rơi xuống.', NOW(), NOW()),
  ('新闻', 'xīnwén', 'xinwen', 'Tân Văn', 'Tin tức, thời sự', 3, 'HSK 3.0', 904, '3', '2025', '名', NULL, '102', '爷爷每天傍晚准时收看中央电视台的新闻联播节目。', 'Ông nội mỗi buổi chập tối đều đúng giờ đón xem chương trình thời sự của đài truyền hình trung ương.', NOW(), NOW()),
  ('新鲜', 'xīnxiān', 'xinxian', 'Tân Tiên', 'Tươi, tươi mới, mới mẻ', 3, 'HSK 3.0', 905, '3', '2025', '形', NULL, '102', '清晨早市上的各种蔬菜瓜果都带着露珠，格外新鲜脆甜。', 'Các loại rau củ hoa quả ở chợ sớm ban mai còn đọng giọt sương, đặc biệt tươi ngon giòn ngọt.', NOW(), NOW()),
  ('信', 'xìn', 'xin', 'Tín', 'Bức thư, tin tưởng, thư từ', 3, 'HSK 3.0', 906, '3', '2025', '动、名', NULL, '102', '今天下午我收到了朋友寄来的一封信。', 'Chiều nay tôi đã nhận được một bức thư bạn gửi đến.', NOW(), NOW()),
  ('信用卡', 'xìnyòngkǎ', 'xinyongka', 'Tín Dụng Tạp', 'Thẻ tín dụng', 3, 'HSK 3.0', 907, '3', '2025', '名', NULL, '102', '使用信用卡进行境外刷卡消费时要注意保管好个人信息安全。', 'Khi dùng thẻ tín dụng quẹt thẻ chi tiêu ở nước ngoài cần chú ý bảo vệ an toàn thông tin cá nhân.', NOW(), NOW()),
  ('行李', 'xíngli', 'xingli', 'Hành Lý', 'Hành lý', 3, 'HSK 3.0', 909, '3', '2025', '名', NULL, '102', '乘坐高铁时，大件随身行李请有序存放在车厢连接处的行李架上。', 'Khi đi tàu cao tốc, hành lý cồng kềnh mang theo xin hãy để ngay ngắn trên giá để hành lý ở nơi nối toa.', NOW(), NOW()),
  ('兴趣', 'xìngqù', 'xingqu', 'Hứng Thú', 'Hứng thú, niềm đam mê', 3, 'HSK 3.0', 910, '3', '2025', '名', NULL, '102', '培养对中华书法艺术的浓厚兴趣能够修身养性陶冶情操。', 'Bồi dưỡng niềm hứng thú sâu sắc với nghệ thuật thư pháp Trung Hoa có thể tu dưỡng tâm tính nuôi dưỡng tâm hồn.', NOW(), NOW()),
  ('休假', 'xiūjià', 'xiujia', 'Hưu Giá', 'Nghỉ phép, nghỉ lễ', 3, 'HSK 3.0', 911, '3', '2025', '动', NULL, '102', '忙碌了整整一年，他终于批准休假一周陪伴年迈的父母。', 'Sau một năm ròng rã bận rộn, anh ấy rốt cuộc đã được duyệt nghỉ phép một tuần để ở bên cha mẹ già.', NOW(), NOW()),
  ('需要', 'xūyào', 'xuyao', 'Nhu Yếu', 'Cần, nhu cầu, đòi hỏi', 3, 'HSK 3.0', 912, '3', '2025', '动、名', NULL, '102', '完成这项复杂的科研攻关任务需要团队全体成员精诚协作。', 'Hoàn thành nhiệm vụ nghiên cứu khoa học phức tạp này đòi hỏi toàn thể thành viên trong đội ngũ phải hợp tác chân thành.', NOW(), NOW()),
  ('选', 'xuǎn', 'xuan', 'Tuyển', 'Chọn, tuyển chọn', 3, 'HSK 3.0', 913, '3', '2025', '动', NULL, '102', '大学期间选一门自己真正热爱又具有发展前景的专业至关重要。', 'Thời đại học chọn được một chuyên ngành bản thân thực sự đam mê lại có triển vọng phát triển là vô cùng quan trọng.', NOW(), NOW()),
  ('选择', 'xuǎnzé', 'xuanze', 'Tuyển Trạch', 'Lựa chọn', 3, 'HSK 3.0', 914, '3', '2025', '动', NULL, '102', '面对人生的重大十字路口，我们要坚定而清醒地做出正确选择。', 'Đối diện với ngã rẽ lớn của cuộc đời, chúng ta cần phải kiên định và tỉnh táo đưa ra sự lựa chọn đúng đắn.', NOW(), NOW()),
  ('学期', 'xuéqī', 'xueqi', 'Học Kỳ', 'Học kỳ', 3, 'HSK 3.0', 915, '3', '2025', '名', NULL, '102', '新学期伊始，同学们个个精神饱满地投入到紧张的学习中。', 'Học kỳ mới vừa bắt đầu, các bạn học sinh ai nấy đều tràn đầy tinh thần hăng say bước vào học tập khẩn trương.', NOW(), NOW()),
  ('牙', 'yá', 'ya', 'Nha', 'Răng', 3, 'HSK 3.0', 916, '3', '2025', '名', NULL, '102', '保持牙齿健康整洁，每天坚持饭后漱口和正确早晚刷牙。', 'Giữ hàm răng khỏe mạnh sạch sẽ, mỗi ngày kiên trì súc miệng sau bữa ăn và đánh răng đúng cách sáng tối.', NOW(), NOW()),
  ('牙刷', 'yáshuā', 'yashua', 'Nha Loát', 'Bàn chải đánh răng', 3, 'HSK 3.0', 917, '3', '2025', '名', NULL, '102', '牙医建议大家每隔两到三个月就应该定期更换一次新牙刷。', 'Bác sĩ nha khoa khuyên mọi người cứ cách hai đến ba tháng nên định kỳ thay bàn chải đánh răng mới một lần.', NOW(), NOW()),
  ('羊', 'yáng', 'yang', 'Dương', 'Con cừu, con dê', 3, 'HSK 3.0', 918, '3', '2025', '名', NULL, '102', '茫茫草原上一群洁白如雪的绵羊正在悠闲惬意地啃食青草。', 'Trên thảo nguyên bao la một đàn cừu trắng muốt như tuyết đang thong thả gặm cỏ xanh.', NOW(), NOW()),
  ('养', 'yǎng', 'yang', 'Dưỡng', 'Nuôi, dưỡng, chăm sóc', 3, 'HSK 3.0', 919, '3', '2025', '动', NULL, '102', '退休后的爷爷在宽敞的后院里养了许多名贵兰花和观赏金鱼。', 'Sau khi nghỉ hưu ông nội nuôi trồng rất nhiều hoa lan quý và cá vàng ngắm cảnh ở khoảng sân sau rộng rãi.', NOW(), NOW()),
  ('要求', 'yāoqiú', 'yaoqiu', 'Yếu Cầu', 'Yêu cầu, đòi hỏi', 3, 'HSK 3.0', 920, '3', '2025', '动、名', NULL, '102', '老师对我们的汉字笔画书写顺序和字形结构有着严格要求。', 'Thầy giáo có yêu cầu rất khắt khe đối với thứ tự nét bút chữ Hán và kết cấu nét chữ của chúng tôi.', NOW(), NOW()),
  ('一定', 'yídìng', 'yiding', 'Nhất Định', 'Nhất định, chắc chắn', 3, 'HSK 3.0', 922, '3', '2025', '形、副', NULL, '103', '只要持之以恒坚持不懈，你的中文水平就一定能取得飞跃进步。', 'Chỉ cần kiên trì không ngừng nghỉ thì trình độ tiếng Trung của bạn nhất định sẽ đạt được bước tiến nhảy vọt.', NOW(), NOW()),
  ('一共', 'yígòng', 'yigong', 'Nhất Cộng', 'Tổng cộng, hết thảy', 3, 'HSK 3.0', 923, '3', '2025', '副', NULL, '103', '我们班级一共有来自十几个国家的三十五名留学生。', 'Lớp học của chúng tôi tổng cộng có ba mươi lăm bạn du học sinh đến từ mười mấy quốc gia.', NOW(), NOW()),
  ('以后', 'yǐhòu', 'yihou', 'Dĩ Hậu', 'Sau này, về sau, sau khi', 3, 'HSK 3.0', 926, '3', '2025', '名', NULL, '103', '经过这次教训以后，他做事变得格外沉着稳重与严谨细致。', 'Sau bài học lần này về sau anh ấy làm việc trở nên đặc biệt điềm tĩnh chín chắn và cẩn trọng tỉ mỉ.', NOW(), NOW()),
  ('以前', 'yǐqián', 'yiqian', 'Dĩ Tiền', 'Trước đây, trước kia, trước khi', 3, 'HSK 3.0', 927, '3', '2025', '名', NULL, '103', '在来中国留学以前，他已经自学了半年的基础汉语语音知识。', 'Trước khi đến Trung Quốc du học, anh ấy đã tự học kiến thức ngữ âm tiếng Trung cơ bản nửa năm.', NOW(), NOW()),
  ('以上', 'yǐshàng', 'yishang', 'Dĩ Thượng', 'Trở lên, trên (con số, mức độ)', 3, 'HSK 3.0', 928, '3', '2025', '名', NULL, '103', '凡是汉语水平考试成绩在两百分以上的考生均可申请该项奖学金。', 'Phàm là thí sinh có điểm thi năng lực Hán ngữ đạt từ hai trăm điểm trở lên đều có thể nộp đơn xin học bổng này.', NOW(), NOW()),
  ('以外', 'yǐwài', 'yiwai', 'Dĩ Ngoại', 'Ngoài... ra, bên ngoài', 3, 'HSK 3.0', 929, '3', '2025', '名', NULL, '103', '除了上课学习专业知识以外，他还积极参加各类社会公益实践活动。', 'Ngoài việc lên lớp học kiến thức chuyên ngành ra, anh ấy còn tích cực tham gia các hoạt động thực tiễn công ích xã hội.', NOW(), NOW()),
  ('以为', 'yǐwéi', 'yiwei', 'Dĩ Vi', 'Tưởng rằng, ngỡ là (nghĩ sai)', 3, 'HSK 3.0', 930, '3', '2025', '动', NULL, '103', '我原本以为今天下午会下大雨，没想到天空反而放晴万里无云。', 'Tôi vốn tưởng rằng chiều nay sẽ mưa to, không ngờ trời lại hửng nắng trong xanh không một gợn mây.', NOW(), NOW()),
  ('以下', 'yǐxià', 'yixia', 'Dĩ Hạ', 'Trở xuống, dưới (mức độ, con số)', 3, 'HSK 3.0', 931, '3', '2025', '名', NULL, '103', '气温骤降到零摄氏度以下时，道路表面极易结冰造成行车困难。', 'Khi nhiệt độ giảm đột ngột xuống dưới không độ C, mặt đường rất dễ đóng băng gây khó khăn cho việc đi lại.', NOW(), NOW()),
  ('一般', 'yìbān', 'yiban', 'Nhất Ban', 'Bình thường, thông thường, phổ biến', 3, 'HSK 3.0', 932, '3', '2025', '形', NULL, '103', '在日常生活中，他一般习惯在早晨六点准时起床晨练跑步。', 'Trong đời sống thường ngày, anh ấy thông thường có thói quen thức dậy đúng sáu giờ sáng để tập thể dục chạy bộ.', NOW(), NOW()),
  ('一直', 'yìzhí', 'yizhi', 'Nhất Trực', 'Thẳng, liên tục, suốt', 3, 'HSK 3.0', 934, '3', '2025', '副', NULL, '103', '从校门口沿着这条林荫大道一直往前走，右手边就是图书馆。', 'Từ cổng trường dọc theo đại lộ rợp bóng cây này đi thẳng mãi về phía trước, bên tay phải chính là thư viện.', NOW(), NOW()),
  ('音乐', 'yīnyuè', 'yinyue', 'Âm Nhạc', 'Âm nhạc', 3, 'HSK 3.0', 935, '3', '2025', '名', NULL, '103', '闲暇时听听古典音乐能让人心情放松。', 'Lúc rảnh rỗi nghe chút âm nhạc cổ điển có thể giúp tâm trạng thư giãn.', NOW(), NOW()),
  ('银行', 'yínháng', 'yinhang', 'Ngân Hành', 'Ngân hàng', 3, 'HSK 3.0', 936, '3', '2025', '名', NULL, '103', '他今天下午请假去中国银行办理跨境学费转账业务。', 'Chiều nay anh ấy xin nghỉ phép đến Ngân hàng Trung Quốc làm thủ tục chuyển khoản học phí qua biên giới.', NOW(), NOW()),
  ('银行卡', 'yínhángkǎ', 'yinhangka', 'Ngân Hành Tạp', 'Thẻ ngân hàng', 3, 'HSK 3.0', 937, '3', '2025', '名', NULL, '103', '在自动取款机办理业务后，请务必随手收好您的银行卡与凭条。', 'Sau khi giao dịch tại cây ATM, xin nhất thiết hãy cất kỹ thẻ ngân hàng và biên lai của bạn.', NOW(), NOW()),
  ('饮料', 'yǐnliào', 'yinliao', 'Ẩm Liệu', 'Đồ uống, thức uống', 3, 'HSK 3.0', 938, '3', '2025', '名', NULL, '103', '夏天冷饮店里供应着各种用新鲜水果鲜榨的冰镇健康饮料。', 'Mùa hè tiệm đồ uống lạnh cung cấp nhiều loại đồ uống giải khát mát lạnh bổ dưỡng ép từ hoa quả tươi.', NOW(), NOW()),
  ('应该', 'yīnggāi', 'yinggai', 'Ứng Cai', 'Nên, phải, cần phải', 3, 'HSK 3.0', 939, '3', '2025', '动', NULL, '103', '遇到不懂的语法难点时，大家应该主动大胆向授课老师请教。', 'Khi gặp điểm khó ngữ pháp không hiểu, mọi người nên chủ động mạnh dạn thỉnh giáo thầy cô giảng dạy.', NOW(), NOW()),
  ('影响', 'yǐngxiǎng', 'yingxiang', 'Ảnh Hưởng', 'Ảnh hưởng, tác động', 3, 'HSK 3.0', 940, '3', '2025', '动、名', NULL, '103', '在公共阅览室里大声接打电话会严重影响其他读者的安静阅读。', 'Nói chuyện điện thoại to trong phòng đọc công cộng sẽ ảnh hưởng nghiêm trọng đến việc đọc sách yên tĩnh của người khác.', NOW(), NOW()),
  ('邮件', 'yóujiàn', 'youjian', 'Bưu Kiện', 'Bưu phẩm, thư điện tử, bưu kiện', 3, 'HSK 3.0', 942, '3', '2025', '名', NULL, '103', '他刚刚收到了海外合作大学招生办发来的一封正式录取确认邮件。', 'Anh ấy vừa nhận được một bức thư điện tử xác nhận trúng tuyển chính thức từ phòng tuyển sinh đại học đối tác ở nước ngoài.', NOW(), NOW()),
  ('游客', 'yóukè', 'youke', 'Du Khách', 'Du khách, khách tham quan', 3, 'HSK 3.0', 943, '3', '2025', '名', NULL, '103', '每年金秋十月都有成千上万的中外游客登临北京八达岭长城。', 'Hằng năm vào tháng mười mùa thu vàng có hàng vạn du khách trong và ngoài nước bước lên Vạn Lý Trường Thành Bát Đạt Lĩnh Bắc Kinh.', NOW(), NOW()),
  ('游戏', 'yóuxì', 'youxi', 'Du Hí', 'Trò chơi, game', 3, 'HSK 3.0', 944, '3', '2025', '名', NULL, '103', '适度玩益智类电子游戏可以开发智力，但沉迷其中则有害学业。', 'Chơi game điện tử rèn luyện trí tuệ ở mức độ vừa phải có thể phát triển trí thông minh, nhưng sa đà vào đó sẽ hại cho việc học hành.', NOW(), NOW()),
  ('邮箱', 'yóuxiāng', 'youxiang', 'Bưu Sương', 'Hòm thư, hộp thư, hộp thư điện tử', 3, 'HSK 3.0', 945, '3', '2025', '名', NULL, '103', '请在个人简历里务必准确注明您经常查阅的常用电子邮箱地址。', 'Trong sơ yếu lý lịch cá nhân xin nhất định phải ghi rõ ràng địa chỉ hộp thư điện tử thường dùng của bạn.', NOW(), NOW()),
  ('有关', 'yǒuguān', 'youguan', 'Hữu Quan', 'Có liên quan, liên can', 3, 'HSK 3.0', 946, '3', '2025', '动、介', NULL, '103', '有关这次学术研讨会的具体日程安排已经正式公布在学院网上了。', 'Lịch trình cụ thể có liên quan đến hội thảo học thuật lần này đã được đăng tải chính thức trên trang mạng của học viện.', NOW(), NOW()),
  ('又', 'yòu', 'you', 'Hựu', 'Lại, vừa... lại...', 3, 'HSK 3.0', 949, '3', '2025', '副', NULL, '103', '今天下午天空中下着蒙蒙细雨，刮着微风，天气又清凉又舒适。', 'Chiều nay trên trời đổ cơn mưa phùn lất phất, gió thoảng hiu hiu, thời tiết vừa mát mẻ lại vừa dễ chịu.', NOW(), NOW()),
  ('羽毛球', 'yǔmáoqiú', 'yumaoqiu', 'Vũ Mao Cầu', 'Cầu lông, môn cầu lông', 3, 'HSK 3.0', 950, '3', '2025', '名', NULL, '103', '下课后体育馆的羽毛球场地总是非常抢手，挤满了运动健儿。', 'Sau giờ tan học sân cầu lông của nhà thi đấu lúc nào cũng rất đắt khách, chật kín các bạn trẻ yêu thể thao.', NOW(), NOW()),
  ('语言', 'yǔyán', 'yuyan', 'Ngữ Ngôn', 'Ngôn ngữ, tiếng nói', 3, 'HSK 3.0', 951, '3', '2025', '名', NULL, '103', '语言不仅是人类交流思想的工具，更是了解一个民族文化的桥梁。', 'Ngôn ngữ không chỉ là công cụ giao lưu tư tưởng của con người mà còn là chiếc cầu nối để tìm hiểu văn hóa của một dân tộc.', NOW(), NOW()),
  ('雨衣', 'yǔyī', 'yuyi', 'Vũ Y', 'Áo mưa', 3, 'HSK 3.0', 952, '3', '2025', '名', NULL, '103', '夏日骑电动车出门前一定要在车座底下备上一件轻便的雨衣。', 'Mùa hè trước khi đi xe máy điện ra ngoài nhất định phải để sẵn một chiếc áo mưa tiện lợi dưới cốp xe.', NOW(), NOW()),
  ('遇到', 'yùdào', 'yudao', 'Ngộ Đáo', 'Gặp phải, bắt gặp (tình cờ/khó khăn)', 3, 'HSK 3.0', 953, '3', '2025', '动', NULL, '103', '在异国求学道路上难免会遇到挫折，关键在于拥有克服困难的勇气。', 'Trên con đường du học nơi đất khách khó lòng tránh khỏi gặp phải trắc trở, điều cốt lõi nằm ở lòng dũng cảm vượt qua khó khăn.', NOW(), NOW()),
  ('遇见', 'yùjiàn', 'yujian', 'Ngộ Kiến', 'Gặp, bắt gặp (người)', 3, 'HSK 3.0', 954, '3', '2025', '动', NULL, '103', '今天在大学图书馆借书处偶然遇见了多年未曾联络的中学校友。', 'Hôm nay ở nơi mượn sách thư viện đại học tình cờ bắt gặp người bạn học thời cấp hai nhiều năm chưa từng liên lạc.', NOW(), NOW()),
  ('园', 'yuán', 'yuan', 'Viên', 'Vườn, công viên, khu vực', 3, 'HSK 3.0', 955, '3', '2025', '名', NULL, '103', '周末漫步在环境清幽的城市公园里，让人心旷神怡扫尽一周疲惫。', 'Cuối tuần dạo bước trong công viên thành phố môi trường thanh tĩnh làm lòng người sảng khoái xua tan mệt mỏi cả tuần.', NOW(), NOW()),
  ('员', 'yuán', 'yuan', 'Viên', 'Nhân viên, thành viên', 3, 'HSK 3.0', 956, '3', '2025', '后缀', NULL, '103', '全体工作人员以热情高度的责任心为本次大赛提供了周密保障。', 'Toàn thể nhân viên làm việc với tinh thần trách nhiệm nhiệt tình cao đã đem đến sự bảo đảm chu đáo cho cuộc thi lần này.', NOW(), NOW()),
  ('愿意', 'yuànyì', 'yuanyi', 'Nguyện Ý', 'Sẵn lòng, bằng lòng, muốn', 3, 'HSK 3.0', 957, '3', '2025', '动', NULL, '103', '如果有机会去偏远贫困山区支教，我非常愿意奉献自己的一份力量。', 'Nếu có cơ hội được đến miền núi xa xôi nghèo khó dạy học tình nguyện, tôi rất sẵn lòng cống hiến một phần sức lực của mình.', NOW(), NOW()),
  ('越', 'yuè', 'yue', 'Việt', 'Càng, vượt qua, vượt bậc', 3, 'HSK 3.0', 958, '3', '2025', '副', NULL, '103', '经过持之以恒的刻苦苦练，他的中文发音咬字越来越地道标准了。', 'Qua thời gian khổ luyện kiên trì không ngừng, phát âm nhả chữ tiếng Trung của cậu ấy càng ngày càng chuẩn xác tự nhiên.', NOW(), NOW()),
  ('月亮', 'yuèliang', 'yueliang', 'Nguyệt Lượng', 'Mặt trăng', 3, 'HSK 3.0', 959, '3', '2025', '名', NULL, '103', '八月十五中秋佳节之夜，天空中挂着一轮皎洁如玉的明亮月亮。', 'Đêm tết Trung thu rằm tháng tám, trên bầu trời treo một vầng trăng sáng vằng vặc trong ngần như ngọc.', NOW(), NOW()),
  ('运动会', 'yùndònghuì', 'yundonghui', 'Vận Động Hội', 'Đại hội thể thao, hội thao', 3, 'HSK 3.0', 960, '3', '2025', '名', NULL, '103', '在一年一度的春季田径运动会上，运动健儿们顽强拼搏屡创佳绩。', 'Tại đại hội thể thao điền kinh mùa xuân thường niên, các vận động viên ngoan cường nỗ lực liên tiếp lập thành tích tốt.', NOW(), NOW()),
  ('运动员', 'yùndòngyuán', 'yundongyuan', 'Vận Động Viên', 'Vận động viên', 3, 'HSK 3.0', 961, '3', '2025', '名', NULL, '104', '优秀运动员们在国际赛场上顽强拼搏，为祖国赢得了巨大的荣誉。', 'Các vận động viên ưu tú kiên cường thi đấu trên đấu trường quốc tế, mang lại vinh quang to lớn cho tổ quốc.', NOW(), NOW()),
  ('咱们', 'zánmen', 'zanmen', 'Trá Môn', 'Chúng ta, chúng mình (bao gồm người nghe)', 3, 'HSK 3.0', 962, '3', '2025', '代', NULL, '104', '既然大家都在这里，咱们就抓紧时间坐下来商量具体分工吧。', 'Nếu mọi người đều ở đây rồi, chúng mình mau tranh thủ thời gian ngồi lại bàn bạc phân công cụ thể nhé.', NOW(), NOW()),
  ('脏', 'zāng', 'zang', 'Tạng', 'Bẩn, dơ, ô uế', 3, 'HSK 3.0', 963, '3', '2025', '形', NULL, '104', '踢完足球回到家后请先把脏衣服换下来放进洗衣篮里。', 'Đá bóng xong về nhà xin hãy thay bộ quần áo bẩn ra trước rồi để vào giỏ giặt.', NOW(), NOW()),
  ('怎么办', 'zěnme bàn', 'zenmeban', 'Chẩm Ma Biện', 'Làm sao bây giờ, phải làm sao', 3, 'HSK 3.0', 964, '3', '2025', '', NULL, '104', '马上就要开始正式演讲了，我的幻灯片突然打不开怎么办？', 'Sắp bắt đầu bài thuyết trình chính thức rồi, slide của tôi đột nhiên không mở được thì phải làm sao bây giờ?', NOW(), NOW()),
  ('怎样', 'zěnyàng', 'zenyang', 'Chẩm Dạng', 'Thế nào, ra làm sao, bằng cách nào', 3, 'HSK 3.0', 965, '3', '2025', '代', NULL, '104', '请问我们要怎样才能在短时间内快速提高汉语听力与口语表达？', 'Xin hỏi chúng ta phải làm thế nào mới có thể nhanh chóng nâng cao kỹ năng nghe và biểu đạt khẩu ngữ tiếng Trung trong thời gian ngắn?', NOW(), NOW()),
  ('站', 'zhàn', 'zhan', 'Trạm', 'Đứng, dựng đứng (động từ)', 3, 'HSK 3.0', 966, '3', '2025', '动', '2', '104', '公交车上大家都站着，没有空座位。', 'Trên xe buýt mọi người đều đứng, không có chỗ ngồi trống.', NOW(), NOW()),
  ('张', 'zhāng', 'zhang', 'Trương', 'Tấm, tờ, chiếc (lượng từ giấy/bàn/giường/vé)', 3, 'HSK 3.0', 967, '3', '2025', '动、量', NULL, '104', '请在桌上铺开一张崭新雪白的宣纸，我们马上要开始练习国画。', 'Xin hãy trải một tờ giấy xuyến trắng tinh mới lên bàn, chúng ta sắp bắt đầu luyện vẽ tranh thủy mặc.', NOW(), NOW()),
  ('长', 'zhǎng', 'zhang', 'Trường', 'Trưởng, lớn lên, phát triển', 3, 'HSK 3.0', 968, '3', '2025', '动、后缀', NULL, '104', '小树苗在阳光雨露的滋润下茁壮健康地长成了一棵参天大树。', 'Cây non nhờ có mưa thuận gió hòa nuôi dưỡng đã vươn mình lớn mạnh thành một cây đại thụ cao vút.', NOW(), NOW()),
  ('着急', 'zháojí', 'zhaoji', 'Trước Cấp', 'Sốt ruột, lo lắng, gấp gáp', 3, 'HSK 3.0', 969, '3', '2025', '形', NULL, '104', '快迟到了，他心里感到非常着急。', 'Sắp muộn rồi, trong lòng anh ấy cảm thấy rất sốt ruột.', NOW(), NOW()),
  ('照', 'zhào', 'zhao', 'Chiếu', 'Chiếu, soi, chụp, hướng theo', 3, 'HSK 3.0', 970, '3', '2025', '动', NULL, '104', '温暖的阳光照在湖面上，风景十分美丽。', 'Ánh nắng ấm áp chiếu lên mặt hồ, phong cảnh vô cùng đẹp đẽ.', NOW(), NOW()),
  ('照顾', 'zhàogù', 'zhaogu', 'Chiếu Cố', 'Chăm sóc, trông nom, săn sóc', 3, 'HSK 3.0', 971, '3', '2025', '动', NULL, '104', '父母生病住院期间，他请假在医院病床前无微不至地悉心照顾。', 'Thời gian cha mẹ ốm nằm viện, anh ấy xin nghỉ phép túc trực trước giường bệnh chăm sóc ân cần chu đáo.', NOW(), NOW()),
  ('照片', 'zhàopiàn', 'zhaopian', 'Chiếu Phiến', 'Bức ảnh, tấm hình', 3, 'HSK 3.0', 972, '3', '2025', '名', NULL, '104', '翻开珍藏多年的毕业纪念相册，一张张泛黄的老照片唤醒了青春。', 'Lật mở cuốn an-bum kỷ yếu tốt nghiệp trân quý bao năm, từng bức ảnh cũ ố vàng đánh thức cả tuổi thanh xuân.', NOW(), NOW()),
  ('照相', 'zhàoxiàng', 'zhaoxiang', 'Chiếu Tương', 'Chụp ảnh, chụp hình', 3, 'HSK 3.0', 973, '3', '2025', '动', NULL, '104', '来到雄伟壮丽的长城烽火台前，游客们纷纷拿出手机照相留念。', 'Đến trước đài phong hỏa Vạn Lý Trường Thành hùng vĩ tráng lệ, du khách rủ nhau lấy điện thoại ra chụp ảnh kỷ niệm.', NOW(), NOW()),
  ('直到', 'zhídào', 'zhidao', 'Trực Đáo', 'Cho đến, mãi đến tận', 3, 'HSK 3.0', 974, '3', '2025', '动', NULL, '104', '大家在图书馆自习室里全神贯注地复习，直到深夜闭馆才依依不舍离开。', 'Mọi người chăm chú ôn tập trong phòng tự học thư viện, mãi đến khi thư viện đóng cửa lúc đêm muộn mới lưu luyến ra về.', NOW(), NOW()),
  ('只', 'zhǐ', 'zhi', 'Chỉ', 'Chỉ, chỉ có (phó từ)', 3, 'HSK 3.0', 975, '3', '2025', '副', NULL, '104', '虽然路途遥远坎坷，但只要心中有梦，我们就只管风雨兼程。', 'Tuy đường sá xa xôi gập ghềnh nhưng chỉ cần trong lòng có ước mơ, chúng ta chỉ việc vững bước dãi gió dầm mưa.', NOW(), NOW()),
  ('纸', 'zhǐ', 'zhi', 'Chỉ', 'Tờ giấy, giấy tờ', 3, 'HSK 3.0', 976, '3', '2025', '名', NULL, '104', '请大家在分发下来的空白答题纸上规范端正地写下答案。', 'Xin mọi người hãy viết câu trả lời ngay ngắn chuẩn mực lên tờ giấy làm bài thi trắng được phát.', NOW(), NOW()),
  ('只能', 'zhǐ néng', 'zhineng', 'Chỉ Năng', 'Chỉ có thể, đành phải', 3, 'HSK 3.0', 977, '3', '2025', '', NULL, '104', '因为突降大暴雨航班被迫取消，我们只能改乘次日早晨的高铁。', 'Do mưa dông bất ngờ chuyến bay bị buộc hủy bỏ, chúng tôi đành phải đổi sang đi tàu cao tốc sáng hôm sau.', NOW(), NOW()),
  ('只是', 'zhǐshì', 'zhishi', 'Chỉ Thị', 'Chỉ là, chẳng qua là', 3, 'HSK 3.0', 978, '3', '2025', '副、连', NULL, '104', '他平时性格内向不善言辞，并不是骄傲自满，只是有些腼腆害羞。', 'Anh ấy thường ngày tính tình hướng nội ít nói, không phải là kiêu ngạo tự mãn mà chỉ là có phần e thẹn ngượng ngùng.', NOW(), NOW()),
  ('只要', 'zhǐyào', 'zhiyao', 'Chỉ Yếu', 'Chỉ cần (liên từ điều kiện)', 3, 'HSK 3.0', 979, '3', '2025', '连', NULL, '104', '世上无难事，只要肯登攀，任何艰难险阻都终将被勇敢者踩在脚下。', 'Trên đời không việc gì khó chỉ cần chịu khó trèo lên, bất kỳ chông gai hiểm trở nào rốt cuộc cũng bị người dũng cảm giẫm dưới chân.', NOW(), NOW()),
  ('只有', 'zhǐyǒu', 'zhiyou', 'Chỉ Hữu', 'Chỉ có... mới... (liên từ duy nhất)', 3, 'HSK 3.0', 980, '3', '2025', '连', NULL, '104', '只有脚踏实地持之以恒地刻苦努力，才能最终攀登科学事业的高峰。', 'Chỉ có vững bước kiên trì nỗ lực hết mình mới có thể leo lên đến đỉnh cao của sự nghiệp khoa học.', NOW(), NOW()),
  ('终于', 'zhōngyú', 'zhongyu', 'Chung Vu', 'Cuối cùng, rốt cuộc', 3, 'HSK 3.0', 983, '3', '2025', '副', NULL, '104', '经过无数次推倒重来的艰辛探索，科研团队终于攻克了这项技术难题。', 'Trải qua vô số lần tìm tòi gian khổ làm đi làm lại, nhóm nghiên cứu khoa học cuối cùng đã khắc phục được cửa ải công nghệ khó khăn này.', NOW(), NOW()),
  ('种', 'zhǒng', 'zhong', 'Chủng', 'Loài, loại, giống (lượng từ)', 3, 'HSK 3.0', 984, '3', '2025', '量', NULL, '104', '植物园里温室精心培育着数百种形态各异的珍稀热带植物。', 'Trong nhà kính vườn thực vật chăm bẵm tỉ mỉ hàng trăm loài thực vật nhiệt đới quý hiếm hình thái muôn vẻ.', NOW(), NOW()),
  ('周末', 'zhōumò', 'zhoumo', 'Chu Mạt', 'Cuối tuần', 3, 'HSK 3.0', 986, '3', '2025', '名', NULL, '104', '周末闲暇时我喜欢约上两三好友一起去郊外露营亲近大自然。', 'Dịp rảnh rỗi cuối tuần tôi thích rủ hai ba người bạn thân cùng nhau đi cắm trại ngoại ô hòa mình với thiên nhiên.', NOW(), NOW()),
  ('主要', 'zhǔyào', 'zhuyao', 'Chủ Yếu', 'Chủ yếu, trọng yếu', 3, 'HSK 3.0', 987, '3', '2025', '形', NULL, '104', '这篇学术论文的主要学术贡献在于提出了全新的数据分析计算模型。', 'Đóng góp học thuật chủ yếu của luận văn này nằm ở việc đề xuất một mô hình tính toán phân tích dữ liệu hoàn toàn mới.', NOW(), NOW()),
  ('注意', 'zhùyì', 'zhuyi', 'Chú Ý', 'Chú ý, cẩn thận', 3, 'HSK 3.0', 988, '3', '2025', '动', NULL, '104', '在实验室进行化学实验操作时，请大家严格注意人身防范安全。', 'Khi thực hiện thao tác thí nghiệm hóa học trong phòng thí nghiệm, xin mọi người nghiêm ngặt chú ý an toàn phòng hộ bản thân.', NOW(), NOW()),
  ('住院', 'zhùyuàn', 'zhuyuan', 'Trú Viện', 'Nằm viện, nhập viện', 3, 'HSK 3.0', 989, '3', '2025', '动', NULL, '104', '爷爷因突发急性胃肠炎在医院住院观察治疗了一个星期。', 'Ông nội vì viêm dạ dày ruột cấp tính đột phát đã nằm viện theo dõi điều trị một tuần lễ.', NOW(), NOW()),
  ('字典', 'zìdiǎn', 'zidian', 'Tự Điển', 'Từ điển (chữ Hán)', 3, 'HSK 3.0', 990, '3', '2025', '名', NULL, '104', '遇到笔画复杂生僻的罕见汉字，查阅新华字典是最权威的选择。', 'Khi gặp chữ Hán hiếm nét bút phức tạp, tra cứu Tân Hoa Tự Điển là sự lựa chọn uy tín nhất.', NOW(), NOW()),
  ('自行车', 'zìxíngchē', 'zixingche', 'Tự Hành Xa', 'Xe đạp', 3, 'HSK 3.0', 991, '3', '2025', '名', NULL, '104', '早晨骑自行车穿行在绿意盎然的校园林荫道上格外惬意清爽。', 'Buổi sáng đạp xe đạp qua lại trên con đường rợp bóng cây xanh mướt của khuôn viên trường thật là thư thái thanh lành.', NOW(), NOW()),
  ('总', 'zǒng', 'zong', 'Tổng', 'Tổng, luôn luôn, tóm lại', 3, 'HSK 3.0', 993, '3', '2025', '副、（动、形）', NULL, '104', '他在日常团队合作中总是任劳任怨，深受领导和同事们的信任。', 'Trong công việc hợp tác nhóm thường ngày anh ấy luôn không nề hà khó nhọc, được lãnh đạo và đồng nghiệp vô cùng tín nhiệm.', NOW(), NOW()),
  ('总是', 'zǒngshì', 'zongshi', 'Tổng Thị', 'Luôn luôn, lúc nào cũng', 3, 'HSK 3.0', 994, '3', '2025', '副', NULL, '104', '妈妈总是无微不至地关心着在外地求学的儿女的健康与饮食。', 'Mẹ lúc nào cũng ân cần chu đáo quan tâm đến sức khỏe và bữa ăn của con cái đang học tập nơi phương xa.', NOW(), NOW()),
  ('嘴', 'zuǐ', 'zui', 'Chuỷ', 'Miệng, mồm', 3, 'HSK 3.0', 995, '3', '2025', '名', NULL, '104', '感冒发烧咳嗽的时候要多补充温水，保持嘴唇与咽喉部湿润。', 'Khi bị cảm cúm sốt ho cần uống bổ sung nhiều nước ấm để giữ cho môi và cổ họng luôn ẩm mượt.', NOW(), NOW()),
  ('最近', 'zuìjìn', 'zuijin', 'Tối Cận', 'Gần đây, dạo này', 3, 'HSK 3.0', 998, '3', '2025', '名', NULL, '104', '最近天气气温变化剧烈无常，出门时请大家随时注意添衣保暖。', 'Thời tiết dạo này nhiệt độ thay đổi thất thường dữ dội, khi ra ngoài xin mọi người chú ý mặc thêm áo ấm.', NOW(), NOW()),
  ('做客', 'zuòkè', 'zuoke', 'Tố Khách', 'Làm khách, đến chơi nhà', 3, 'HSK 3.0', 999, '3', '2025', '动', NULL, '104', '周末王老师热情邀请我们几位外国留学生去他家里做客品尝家常菜。', 'Cuối tuần thầy Vương nhiệt tình mời mấy bạn lưu học sinh nước ngoài chúng tôi đến nhà chơi làm khách nếm món ăn gia đình.', NOW(), NOW()),
  ('作业', 'zuòyè', 'zuoye', 'Tác Nghiệp', 'Bài tập, bài làm về nhà', 3, 'HSK 3.0', 1000, '3', '2025', '名', NULL, '104', '每天放学回到家后，他总是自觉认真地先独立完成各科家庭作业。', 'Mỗi ngày tan trường về đến nhà, cậu ấy luôn tự giác chăm chỉ hoàn thành độc lập bài tập về nhà các môn trước.', NOW(), NOW());

-- -----------------------------------------------------------------------------
-- Step 5: Insert constituent Kangxi radicals for new vocabulary entries
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`)
SELECT v.`vocab_id`, m.`radical_id`, m.`hanzi_char`
FROM (
  SELECT 11 AS `hsk_source_id`, 162 AS `radical_id`, '边' AS `hanzi_char` UNION ALL
  SELECT 11 AS `hsk_source_id`, 19 AS `radical_id`, '边' AS `hanzi_char` UNION ALL
  SELECT 15 AS `hsk_source_id`, 1 AS `radical_id`, '不' AS `hanzi_char` UNION ALL
  SELECT 15 AS `hsk_source_id`, 146 AS `radical_id`, '要' AS `hanzi_char` UNION ALL
  SELECT 15 AS `hsk_source_id`, 38 AS `radical_id`, '要' AS `hanzi_char` UNION ALL
  SELECT 19 AS `hsk_source_id`, 18 AS `radical_id`, '超' AS `hanzi_char` UNION ALL
  SELECT 19 AS `hsk_source_id`, 30 AS `radical_id`, '超' AS `hanzi_char` UNION ALL
  SELECT 19 AS `hsk_source_id`, 156 AS `radical_id`, '超' AS `hanzi_char` UNION ALL
  SELECT 19 AS `hsk_source_id`, 8 AS `radical_id`, '市' AS `hanzi_char` UNION ALL
  SELECT 19 AS `hsk_source_id`, 50 AS `radical_id`, '市' AS `hanzi_char` UNION ALL
  SELECT 22 AS `hsk_source_id`, 17 AS `radical_id`, '出' AS `hanzi_char` UNION ALL
  SELECT 22 AS `hsk_source_id`, 45 AS `radical_id`, '出' AS `hanzi_char` UNION ALL
  SELECT 22 AS `hsk_source_id`, 1 AS `radical_id`, '租' AS `hanzi_char` UNION ALL
  SELECT 22 AS `hsk_source_id`, 74 AS `radical_id`, '租' AS `hanzi_char` UNION ALL
  SELECT 22 AS `hsk_source_id`, 115 AS `radical_id`, '租' AS `hanzi_char` UNION ALL
  SELECT 22 AS `hsk_source_id`, 159 AS `radical_id`, '车' AS `hanzi_char` UNION ALL
  SELECT 22 AS `hsk_source_id`, 5 AS `radical_id`, '车' AS `hanzi_char` UNION ALL
  SELECT 22 AS `hsk_source_id`, 24 AS `radical_id`, '车' AS `hanzi_char` UNION ALL
  SELECT 26 AS `hsk_source_id`, 37 AS `radical_id`, '大' AS `hanzi_char` UNION ALL
  SELECT 26 AS `hsk_source_id`, 40 AS `radical_id`, '家' AS `hanzi_char` UNION ALL
  SELECT 26 AS `hsk_source_id`, 152 AS `radical_id`, '家' AS `hanzi_char` UNION ALL
  SELECT 34 AS `hsk_source_id`, 53 AS `radical_id`, '店' AS `hanzi_char` UNION ALL
  SELECT 34 AS `hsk_source_id`, 25 AS `radical_id`, '店' AS `hanzi_char` UNION ALL
  SELECT 34 AS `hsk_source_id`, 30 AS `radical_id`, '店' AS `hanzi_char` UNION ALL
  SELECT 56 AS `hsk_source_id`, 18 AS `radical_id`, '分' AS `hanzi_char` UNION ALL
  SELECT 56 AS `hsk_source_id`, 12 AS `radical_id`, '分' AS `hanzi_char` UNION ALL
  SELECT 56 AS `hsk_source_id`, 2 AS `radical_id`, '钟' AS `hanzi_char` UNION ALL
  SELECT 56 AS `hsk_source_id`, 30 AS `radical_id`, '钟' AS `hanzi_char` UNION ALL
  SELECT 56 AS `hsk_source_id`, 167 AS `radical_id`, '钟' AS `hanzi_char` UNION ALL
  SELECT 62 AS `hsk_source_id`, 12 AS `radical_id`, '公' AS `hanzi_char` UNION ALL
  SELECT 62 AS `hsk_source_id`, 28 AS `radical_id`, '公' AS `hanzi_char` UNION ALL
  SELECT 62 AS `hsk_source_id`, 30 AS `radical_id`, '司' AS `hanzi_char` UNION ALL
  SELECT 64 AS `hsk_source_id`, 20 AS `radical_id`, '狗' AS `hanzi_char` UNION ALL
  SELECT 64 AS `hsk_source_id`, 30 AS `radical_id`, '狗' AS `hanzi_char` UNION ALL
  SELECT 64 AS `hsk_source_id`, 94 AS `radical_id`, '狗' AS `hanzi_char` UNION ALL
  SELECT 89 AS `hsk_source_id`, 9 AS `radical_id`, '件' AS `hanzi_char` UNION ALL
  SELECT 89 AS `hsk_source_id`, 93 AS `radical_id`, '件' AS `hanzi_char` UNION ALL
  SELECT 90 AS `hsk_source_id`, 4 AS `radical_id`, '饺' AS `hanzi_char` UNION ALL
  SELECT 90 AS `hsk_source_id`, 8 AS `radical_id`, '饺' AS `hanzi_char` UNION ALL
  SELECT 90 AS `hsk_source_id`, 12 AS `radical_id`, '饺' AS `hanzi_char` UNION ALL
  SELECT 90 AS `hsk_source_id`, 184 AS `radical_id`, '饺' AS `hanzi_char` UNION ALL
  SELECT 90 AS `hsk_source_id`, 39 AS `radical_id`, '子' AS `hanzi_char` UNION ALL
  SELECT 102 AS `hsk_source_id`, 1 AS `radical_id`, '可' AS `hanzi_char` UNION ALL
  SELECT 102 AS `hsk_source_id`, 30 AS `radical_id`, '可' AS `hanzi_char` UNION ALL
  SELECT 102 AS `hsk_source_id`, 9 AS `radical_id`, '以' AS `hanzi_char` UNION ALL
  SELECT 117 AS `hsk_source_id`, 24 AS `radical_id`, '卖' AS `hanzi_char` UNION ALL
  SELECT 117 AS `hsk_source_id`, 37 AS `radical_id`, '卖' AS `hanzi_char` UNION ALL
  SELECT 119 AS `hsk_source_id`, 94 AS `radical_id`, '猫' AS `hanzi_char` UNION ALL
  SELECT 119 AS `hsk_source_id`, 102 AS `radical_id`, '猫' AS `hanzi_char` UNION ALL
  SELECT 119 AS `hsk_source_id`, 140 AS `radical_id`, '猫' AS `hanzi_char` UNION ALL
  SELECT 121 AS `hsk_source_id`, 85 AS `radical_id`, '没' AS `hanzi_char` UNION ALL
  SELECT 121 AS `hsk_source_id`, 79 AS `radical_id`, '没' AS `hanzi_char` UNION ALL
  SELECT 121 AS `hsk_source_id`, 6 AS `radical_id`, '事' AS `hanzi_char` UNION ALL
  SELECT 121 AS `hsk_source_id`, 1 AS `radical_id`, '事' AS `hanzi_char` UNION ALL
  SELECT 121 AS `hsk_source_id`, 30 AS `radical_id`, '事' AS `hanzi_char` UNION ALL
  SELECT 121 AS `hsk_source_id`, 58 AS `radical_id`, '事' AS `hanzi_char` UNION ALL
  SELECT 132 AS `hsk_source_id`, 30 AS `radical_id`, '哪' AS `hanzi_char` UNION ALL
  SELECT 132 AS `hsk_source_id`, 163 AS `radical_id`, '哪' AS `hanzi_char` UNION ALL
  SELECT 132 AS `hsk_source_id`, 2 AS `radical_id`, '个' AS `hanzi_char` UNION ALL
  SELECT 132 AS `hsk_source_id`, 9 AS `radical_id`, '个' AS `hanzi_char` UNION ALL
  SELECT 138 AS `hsk_source_id`, 163 AS `radical_id`, '那' AS `hanzi_char` UNION ALL
  SELECT 138 AS `hsk_source_id`, 2 AS `radical_id`, '个' AS `hanzi_char` UNION ALL
  SELECT 138 AS `hsk_source_id`, 9 AS `radical_id`, '个' AS `hanzi_char` UNION ALL
  SELECT 147 AS `hsk_source_id`, 9 AS `radical_id`, '你' AS `hanzi_char` UNION ALL
  SELECT 147 AS `hsk_source_id`, 42 AS `radical_id`, '你' AS `hanzi_char` UNION ALL
  SELECT 147 AS `hsk_source_id`, 18 AS `radical_id`, '你' AS `hanzi_char` UNION ALL
  SELECT 147 AS `hsk_source_id`, 38 AS `radical_id`, '好' AS `hanzi_char` UNION ALL
  SELECT 147 AS `hsk_source_id`, 39 AS `radical_id`, '好' AS `hanzi_char` UNION ALL
  SELECT 155 AS `hsk_source_id`, 38 AS `radical_id`, '女' AS `hanzi_char` UNION ALL
  SELECT 155 AS `hsk_source_id`, 33 AS `radical_id`, '士' AS `hanzi_char` UNION ALL
  SELECT 157 AS `hsk_source_id`, 1 AS `radical_id`, '便' AS `hanzi_char` UNION ALL
  SELECT 157 AS `hsk_source_id`, 4 AS `radical_id`, '便' AS `hanzi_char` UNION ALL
  SELECT 157 AS `hsk_source_id`, 9 AS `radical_id`, '便' AS `hanzi_char` UNION ALL
  SELECT 157 AS `hsk_source_id`, 73 AS `radical_id`, '便' AS `hanzi_char` UNION ALL
  SELECT 157 AS `hsk_source_id`, 40 AS `radical_id`, '宜' AS `hanzi_char` UNION ALL
  SELECT 157 AS `hsk_source_id`, 74 AS `radical_id`, '宜' AS `hanzi_char` UNION ALL
  SELECT 158 AS `hsk_source_id`, 85 AS `radical_id`, '漂' AS `hanzi_char` UNION ALL
  SELECT 158 AS `hsk_source_id`, 113 AS `radical_id`, '漂' AS `hanzi_char` UNION ALL
  SELECT 158 AS `hsk_source_id`, 146 AS `radical_id`, '漂' AS `hanzi_char` UNION ALL
  SELECT 158 AS `hsk_source_id`, 8 AS `radical_id`, '亮' AS `hanzi_char` UNION ALL
  SELECT 158 AS `hsk_source_id`, 14 AS `radical_id`, '亮' AS `hanzi_char` UNION ALL
  SELECT 158 AS `hsk_source_id`, 16 AS `radical_id`, '亮' AS `hanzi_char` UNION ALL
  SELECT 158 AS `hsk_source_id`, 30 AS `radical_id`, '亮' AS `hanzi_char` UNION ALL
  SELECT 159 AS `hsk_source_id`, 3 AS `radical_id`, '苹' AS `hanzi_char` UNION ALL
  SELECT 159 AS `hsk_source_id`, 51 AS `radical_id`, '苹' AS `hanzi_char` UNION ALL
  SELECT 159 AS `hsk_source_id`, 53 AS `radical_id`, '苹' AS `hanzi_char` UNION ALL
  SELECT 159 AS `hsk_source_id`, 140 AS `radical_id`, '苹' AS `hanzi_char` UNION ALL
  SELECT 159 AS `hsk_source_id`, 75 AS `radical_id`, '果' AS `hanzi_char` UNION ALL
  SELECT 159 AS `hsk_source_id`, 102 AS `radical_id`, '果' AS `hanzi_char` UNION ALL
  SELECT 162 AS `hsk_source_id`, 4 AS `radical_id`, '千' AS `hanzi_char` UNION ALL
  SELECT 162 AS `hsk_source_id`, 24 AS `radical_id`, '千' AS `hanzi_char` UNION ALL
  SELECT 201 AS `hsk_source_id`, 21 AS `radical_id`, '它' AS `hanzi_char` UNION ALL
  SELECT 201 AS `hsk_source_id`, 40 AS `radical_id`, '它' AS `hanzi_char` UNION ALL
  SELECT 204 AS `hsk_source_id`, 21 AS `radical_id`, '它' AS `hanzi_char` UNION ALL
  SELECT 204 AS `hsk_source_id`, 40 AS `radical_id`, '它' AS `hanzi_char` UNION ALL
  SELECT 204 AS `hsk_source_id`, 9 AS `radical_id`, '们' AS `hanzi_char` UNION ALL
  SELECT 204 AS `hsk_source_id`, 169 AS `radical_id`, '们' AS `hanzi_char` UNION ALL
  SELECT 214 AS `hsk_source_id`, 96 AS `radical_id`, '玩' AS `hanzi_char` UNION ALL
  SELECT 214 AS `hsk_source_id`, 10 AS `radical_id`, '玩' AS `hanzi_char` UNION ALL
  SELECT 214 AS `hsk_source_id`, 7 AS `radical_id`, '玩' AS `hanzi_char` UNION ALL
  SELECT 218 AS `hsk_source_id`, 1 AS `radical_id`, '喂' AS `hanzi_char` UNION ALL
  SELECT 218 AS `hsk_source_id`, 30 AS `radical_id`, '喂' AS `hanzi_char` UNION ALL
  SELECT 218 AS `hsk_source_id`, 102 AS `radical_id`, '喂' AS `hanzi_char` UNION ALL
  SELECT 220 AS `hsk_source_id`, 169 AS `radical_id`, '问' AS `hanzi_char` UNION ALL
  SELECT 220 AS `hsk_source_id`, 30 AS `radical_id`, '问' AS `hanzi_char` UNION ALL
  SELECT 220 AS `hsk_source_id`, 72 AS `radical_id`, '题' AS `hanzi_char` UNION ALL
  SELECT 220 AS `hsk_source_id`, 103 AS `radical_id`, '题' AS `hanzi_char` UNION ALL
  SELECT 220 AS `hsk_source_id`, 181 AS `radical_id`, '题' AS `hanzi_char` UNION ALL
  SELECT 239 AS `hsk_source_id`, 7 AS `radical_id`, '些' AS `hanzi_char` UNION ALL
  SELECT 239 AS `hsk_source_id`, 77 AS `radical_id`, '些' AS `hanzi_char` UNION ALL
  SELECT 239 AS `hsk_source_id`, 21 AS `radical_id`, '些' AS `hanzi_char` UNION ALL
  SELECT 251 AS `hsk_source_id`, 58 AS `radical_id`, '雪' AS `hanzi_char` UNION ALL
  SELECT 251 AS `hsk_source_id`, 173 AS `radical_id`, '雪' AS `hanzi_char` UNION ALL
  SELECT 259 AS `hsk_source_id`, 1 AS `radical_id`, '一' AS `hanzi_char` UNION ALL
  SELECT 259 AS `hsk_source_id`, 25 AS `radical_id`, '下' AS `hanzi_char` UNION ALL
  SELECT 260 AS `hsk_source_id`, 1 AS `radical_id`, '椅' AS `hanzi_char` UNION ALL
  SELECT 260 AS `hsk_source_id`, 30 AS `radical_id`, '椅' AS `hanzi_char` UNION ALL
  SELECT 260 AS `hsk_source_id`, 37 AS `radical_id`, '椅' AS `hanzi_char` UNION ALL
  SELECT 260 AS `hsk_source_id`, 75 AS `radical_id`, '椅' AS `hanzi_char` UNION ALL
  SELECT 260 AS `hsk_source_id`, 39 AS `radical_id`, '子' AS `hanzi_char` UNION ALL
  SELECT 265 AS `hsk_source_id`, 74 AS `radical_id`, '有' AS `hanzi_char` UNION ALL
  SELECT 265 AS `hsk_source_id`, 86 AS `radical_id`, '点' AS `hanzi_char` UNION ALL
  SELECT 265 AS `hsk_source_id`, 25 AS `radical_id`, '点' AS `hanzi_char` UNION ALL
  SELECT 265 AS `hsk_source_id`, 30 AS `radical_id`, '点' AS `hanzi_char` UNION ALL
  SELECT 265 AS `hsk_source_id`, 10 AS `radical_id`, '儿' AS `hanzi_char` UNION ALL
  SELECT 277 AS `hsk_source_id`, 61 AS `radical_id`, '怎' AS `hanzi_char` UNION ALL
  SELECT 277 AS `hsk_source_id`, 4 AS `radical_id`, '怎' AS `hanzi_char` UNION ALL
  SELECT 277 AS `hsk_source_id`, 1 AS `radical_id`, '怎' AS `hanzi_char` UNION ALL
  SELECT 277 AS `hsk_source_id`, 28 AS `radical_id`, '么' AS `hanzi_char` UNION ALL
  SELECT 277 AS `hsk_source_id`, 75 AS `radical_id`, '样' AS `hanzi_char` UNION ALL
  SELECT 277 AS `hsk_source_id`, 123 AS `radical_id`, '样' AS `hanzi_char` UNION ALL
  SELECT 281 AS `hsk_source_id`, 162 AS `radical_id`, '这' AS `hanzi_char` UNION ALL
  SELECT 281 AS `hsk_source_id`, 67 AS `radical_id`, '这' AS `hanzi_char` UNION ALL
  SELECT 281 AS `hsk_source_id`, 2 AS `radical_id`, '个' AS `hanzi_char` UNION ALL
  SELECT 281 AS `hsk_source_id`, 9 AS `radical_id`, '个' AS `hanzi_char` UNION ALL
  SELECT 287 AS `hsk_source_id`, 12 AS `radical_id`, '只' AS `hanzi_char` UNION ALL
  SELECT 287 AS `hsk_source_id`, 30 AS `radical_id`, '只' AS `hanzi_char` UNION ALL
  SELECT 300 AS `hsk_source_id`, 9 AS `radical_id`, '做' AS `hanzi_char` UNION ALL
  SELECT 300 AS `hsk_source_id`, 66 AS `radical_id`, '做' AS `hanzi_char` UNION ALL
  SELECT 300 AS `hsk_source_id`, 184 AS `radical_id`, '饭' AS `hanzi_char` UNION ALL
  SELECT 300 AS `hsk_source_id`, 29 AS `radical_id`, '饭' AS `hanzi_char` UNION ALL
  SELECT 300 AS `hsk_source_id`, 27 AS `radical_id`, '饭' AS `hanzi_char` UNION ALL
  SELECT 301 AS `hsk_source_id`, 1 AS `radical_id`, '啊' AS `hanzi_char` UNION ALL
  SELECT 301 AS `hsk_source_id`, 30 AS `radical_id`, '啊' AS `hanzi_char` UNION ALL
  SELECT 301 AS `hsk_source_id`, 170 AS `radical_id`, '啊' AS `hanzi_char` UNION ALL
  SELECT 303 AS `hsk_source_id`, 106 AS `radical_id`, '白' AS `hanzi_char` UNION ALL
  SELECT 303 AS `hsk_source_id`, 139 AS `radical_id`, '色' AS `hanzi_char` UNION ALL
  SELECT 310 AS `hsk_source_id`, 82 AS `radical_id`, '笔' AS `hanzi_char` UNION ALL
  SELECT 310 AS `hsk_source_id`, 118 AS `radical_id`, '笔' AS `hanzi_char` UNION ALL
  SELECT 312 AS `hsk_source_id`, 1 AS `radical_id`, '不' AS `hanzi_char` UNION ALL
  SELECT 312 AS `hsk_source_id`, 167 AS `radical_id`, '错' AS `hanzi_char` UNION ALL
  SELECT 312 AS `hsk_source_id`, 72 AS `radical_id`, '错' AS `hanzi_char` UNION ALL
  SELECT 313 AS `hsk_source_id`, 1 AS `radical_id`, '不' AS `hanzi_char` UNION ALL
  SELECT 313 AS `hsk_source_id`, 38 AS `radical_id`, '好' AS `hanzi_char` UNION ALL
  SELECT 313 AS `hsk_source_id`, 39 AS `radical_id`, '好' AS `hanzi_char` UNION ALL
  SELECT 313 AS `hsk_source_id`, 61 AS `radical_id`, '意' AS `hanzi_char` UNION ALL
  SELECT 313 AS `hsk_source_id`, 180 AS `radical_id`, '意' AS `hanzi_char` UNION ALL
  SELECT 313 AS `hsk_source_id`, 102 AS `radical_id`, '思' AS `hanzi_char` UNION ALL
  SELECT 314 AS `hsk_source_id`, 168 AS `radical_id`, '长' AS `hanzi_char` UNION ALL
  SELECT 317 AS `hsk_source_id`, 17 AS `radical_id`, '出' AS `hanzi_char` UNION ALL
  SELECT 317 AS `hsk_source_id`, 45 AS `radical_id`, '出' AS `hanzi_char` UNION ALL
  SELECT 317 AS `hsk_source_id`, 31 AS `radical_id`, '国' AS `hanzi_char` UNION ALL
  SELECT 317 AS `hsk_source_id`, 96 AS `radical_id`, '国' AS `hanzi_char` UNION ALL
  SELECT 319 AS `hsk_source_id`, 17 AS `radical_id`, '出' AS `hanzi_char` UNION ALL
  SELECT 319 AS `hsk_source_id`, 45 AS `radical_id`, '出' AS `hanzi_char` UNION ALL
  SELECT 319 AS `hsk_source_id`, 169 AS `radical_id`, '门' AS `hanzi_char` UNION ALL
  SELECT 319 AS `hsk_source_id`, 3 AS `radical_id`, '门' AS `hanzi_char` UNION ALL
  SELECT 319 AS `hsk_source_id`, 2 AS `radical_id`, '门' AS `hanzi_char` UNION ALL
  SELECT 322 AS `hsk_source_id`, 30 AS `radical_id`, '词' AS `hanzi_char` UNION ALL
  SELECT 322 AS `hsk_source_id`, 149 AS `radical_id`, '词' AS `hanzi_char` UNION ALL
  SELECT 325 AS `hsk_source_id`, 9 AS `radical_id`, '从' AS `hanzi_char` UNION ALL
  SELECT 325 AS `hsk_source_id`, 42 AS `radical_id`, '小' AS `hanzi_char` UNION ALL
  SELECT 330 AS `hsk_source_id`, 1 AS `radical_id`, '但' AS `hanzi_char` UNION ALL
  SELECT 330 AS `hsk_source_id`, 9 AS `radical_id`, '但' AS `hanzi_char` UNION ALL
  SELECT 330 AS `hsk_source_id`, 72 AS `radical_id`, '但' AS `hanzi_char` UNION ALL
  SELECT 331 AS `hsk_source_id`, 1 AS `radical_id`, '但' AS `hanzi_char` UNION ALL
  SELECT 331 AS `hsk_source_id`, 9 AS `radical_id`, '但' AS `hanzi_char` UNION ALL
  SELECT 331 AS `hsk_source_id`, 72 AS `radical_id`, '但' AS `hanzi_char` UNION ALL
  SELECT 331 AS `hsk_source_id`, 103 AS `radical_id`, '是' AS `hanzi_char` UNION ALL
  SELECT 332 AS `hsk_source_id`, 60 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 332 AS `hsk_source_id`, 72 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 332 AS `hsk_source_id`, 1 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 332 AS `hsk_source_id`, 41 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 335 AS `hsk_source_id`, 32 AS `radical_id`, '地' AS `hanzi_char` UNION ALL
  SELECT 335 AS `hsk_source_id`, 5 AS `radical_id`, '地' AS `hanzi_char` UNION ALL
  SELECT 335 AS `hsk_source_id`, 1 AS `radical_id`, '铁' AS `hanzi_char` UNION ALL
  SELECT 335 AS `hsk_source_id`, 4 AS `radical_id`, '铁' AS `hanzi_char` UNION ALL
  SELECT 335 AS `hsk_source_id`, 37 AS `radical_id`, '铁' AS `hanzi_char` UNION ALL
  SELECT 335 AS `hsk_source_id`, 167 AS `radical_id`, '铁' AS `hanzi_char` UNION ALL
  SELECT 336 AS `hsk_source_id`, 86 AS `radical_id`, '点' AS `hanzi_char` UNION ALL
  SELECT 336 AS `hsk_source_id`, 25 AS `radical_id`, '点' AS `hanzi_char` UNION ALL
  SELECT 336 AS `hsk_source_id`, 30 AS `radical_id`, '点' AS `hanzi_char` UNION ALL
  SELECT 337 AS `hsk_source_id`, 4 AS `radical_id`, '懂' AS `hanzi_char` UNION ALL
  SELECT 337 AS `hsk_source_id`, 24 AS `radical_id`, '懂' AS `hanzi_char` UNION ALL
  SELECT 337 AS `hsk_source_id`, 61 AS `radical_id`, '懂' AS `hanzi_char` UNION ALL
  SELECT 337 AS `hsk_source_id`, 140 AS `radical_id`, '懂' AS `hanzi_char` UNION ALL
  SELECT 337 AS `hsk_source_id`, 166 AS `radical_id`, '懂' AS `hanzi_char` UNION ALL
  SELECT 339 AS `hsk_source_id`, 184 AS `radical_id`, '饭' AS `hanzi_char` UNION ALL
  SELECT 339 AS `hsk_source_id`, 29 AS `radical_id`, '饭' AS `hanzi_char` UNION ALL
  SELECT 339 AS `hsk_source_id`, 27 AS `radical_id`, '饭' AS `hanzi_char` UNION ALL
  SELECT 339 AS `hsk_source_id`, 40 AS `radical_id`, '馆' AS `hanzi_char` UNION ALL
  SELECT 342 AS `hsk_source_id`, 189 AS `radical_id`, '高' AS `hanzi_char` UNION ALL
  SELECT 342 AS `hsk_source_id`, 2 AS `radical_id`, '中' AS `hanzi_char` UNION ALL
  SELECT 342 AS `hsk_source_id`, 30 AS `radical_id`, '中' AS `hanzi_char` UNION ALL
  SELECT 344 AS `hsk_source_id`, 2 AS `radical_id`, '个' AS `hanzi_char` UNION ALL
  SELECT 344 AS `hsk_source_id`, 9 AS `radical_id`, '个' AS `hanzi_char` UNION ALL
  SELECT 344 AS `hsk_source_id`, 39 AS `radical_id`, '子' AS `hanzi_char` UNION ALL
  SELECT 346 AS `hsk_source_id`, 12 AS `radical_id`, '公' AS `hanzi_char` UNION ALL
  SELECT 346 AS `hsk_source_id`, 28 AS `radical_id`, '公' AS `hanzi_char` UNION ALL
  SELECT 346 AS `hsk_source_id`, 4 AS `radical_id`, '交' AS `hanzi_char` UNION ALL
  SELECT 346 AS `hsk_source_id`, 8 AS `radical_id`, '交' AS `hanzi_char` UNION ALL
  SELECT 346 AS `hsk_source_id`, 159 AS `radical_id`, '车' AS `hanzi_char` UNION ALL
  SELECT 346 AS `hsk_source_id`, 1 AS `radical_id`, '车' AS `hanzi_char` UNION ALL
  SELECT 346 AS `hsk_source_id`, 5 AS `radical_id`, '车' AS `hanzi_char` UNION ALL
  SELECT 346 AS `hsk_source_id`, 24 AS `radical_id`, '车' AS `hanzi_char` UNION ALL
  SELECT 347 AS `hsk_source_id`, 162 AS `radical_id`, '过' AS `hanzi_char` UNION ALL
  SELECT 347 AS `hsk_source_id`, 41 AS `radical_id`, '过' AS `hanzi_char` UNION ALL
  SELECT 348 AS `hsk_source_id`, 162 AS `radical_id`, '过' AS `hanzi_char` UNION ALL
  SELECT 348 AS `hsk_source_id`, 41 AS `radical_id`, '过' AS `hanzi_char` UNION ALL
  SELECT 348 AS `hsk_source_id`, 75 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 348 AS `hsk_source_id`, 1 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 348 AS `hsk_source_id`, 12 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 349 AS `hsk_source_id`, 162 AS `radical_id`, '过' AS `hanzi_char` UNION ALL
  SELECT 349 AS `hsk_source_id`, 41 AS `radical_id`, '过' AS `hanzi_char` UNION ALL
  SELECT 349 AS `hsk_source_id`, 51 AS `radical_id`, '年' AS `hanzi_char` UNION ALL
  SELECT 350 AS `hsk_source_id`, 162 AS `radical_id`, '过' AS `hanzi_char` UNION ALL
  SELECT 350 AS `hsk_source_id`, 41 AS `radical_id`, '过' AS `hanzi_char` UNION ALL
  SELECT 350 AS `hsk_source_id`, 28 AS `radical_id`, '去' AS `hanzi_char` UNION ALL
  SELECT 350 AS `hsk_source_id`, 32 AS `radical_id`, '去' AS `hanzi_char` UNION ALL
  SELECT 353 AS `hsk_source_id`, 203 AS `radical_id`, '黑' AS `hanzi_char` UNION ALL
  SELECT 353 AS `hsk_source_id`, 139 AS `radical_id`, '色' AS `hanzi_char` UNION ALL
  SELECT 354 AS `hsk_source_id`, 48 AS `radical_id`, '红' AS `hanzi_char` UNION ALL
  SELECT 354 AS `hsk_source_id`, 120 AS `radical_id`, '红' AS `hanzi_char` UNION ALL
  SELECT 354 AS `hsk_source_id`, 140 AS `radical_id`, '茶' AS `hanzi_char` UNION ALL
  SELECT 354 AS `hsk_source_id`, 9 AS `radical_id`, '茶' AS `hanzi_char` UNION ALL
  SELECT 354 AS `hsk_source_id`, 75 AS `radical_id`, '茶' AS `hanzi_char` UNION ALL
  SELECT 355 AS `hsk_source_id`, 48 AS `radical_id`, '红' AS `hanzi_char` UNION ALL
  SELECT 355 AS `hsk_source_id`, 120 AS `radical_id`, '红' AS `hanzi_char` UNION ALL
  SELECT 355 AS `hsk_source_id`, 139 AS `radical_id`, '色' AS `hanzi_char` UNION ALL
  SELECT 356 AS `hsk_source_id`, 30 AS `radical_id`, '后' AS `hanzi_char` UNION ALL
  SELECT 356 AS `hsk_source_id`, 176 AS `radical_id`, '面' AS `hanzi_char` UNION ALL
  SELECT 357 AS `hsk_source_id`, 140 AS `radical_id`, '花' AS `hanzi_char` UNION ALL
  SELECT 357 AS `hsk_source_id`, 21 AS `radical_id`, '花' AS `hanzi_char` UNION ALL
  SELECT 357 AS `hsk_source_id`, 9 AS `radical_id`, '花' AS `hanzi_char` UNION ALL
  SELECT 359 AS `hsk_source_id`, 1 AS `radical_id`, '画' AS `hanzi_char` UNION ALL
  SELECT 359 AS `hsk_source_id`, 17 AS `radical_id`, '画' AS `hanzi_char` UNION ALL
  SELECT 359 AS `hsk_source_id`, 102 AS `radical_id`, '画' AS `hanzi_char` UNION ALL
  SELECT 368 AS `hsk_source_id`, 66 AS `radical_id`, '教' AS `hanzi_char` UNION ALL
  SELECT 368 AS `hsk_source_id`, 39 AS `radical_id`, '教' AS `hanzi_char` UNION ALL
  SELECT 368 AS `hsk_source_id`, 125 AS `radical_id`, '教' AS `hanzi_char` UNION ALL
  SELECT 368 AS `hsk_source_id`, 40 AS `radical_id`, '室' AS `hanzi_char` UNION ALL
  SELECT 368 AS `hsk_source_id`, 133 AS `radical_id`, '室' AS `hanzi_char` UNION ALL
  SELECT 371 AS `hsk_source_id`, 69 AS `radical_id`, '近' AS `hanzi_char` UNION ALL
  SELECT 371 AS `hsk_source_id`, 162 AS `radical_id`, '近' AS `hanzi_char` UNION ALL
  SELECT 374 AS `hsk_source_id`, 48 AS `radical_id`, '经' AS `hanzi_char` UNION ALL
  SELECT 374 AS `hsk_source_id`, 120 AS `radical_id`, '经' AS `hanzi_char` UNION ALL
  SELECT 374 AS `hsk_source_id`, 50 AS `radical_id`, '常' AS `hanzi_char` UNION ALL
  SELECT 374 AS `hsk_source_id`, 42 AS `radical_id`, '常' AS `hanzi_char` UNION ALL
  SELECT 374 AS `hsk_source_id`, 13 AS `radical_id`, '常' AS `hanzi_char` UNION ALL
  SELECT 374 AS `hsk_source_id`, 30 AS `radical_id`, '常' AS `hanzi_char` UNION ALL
  SELECT 375 AS `hsk_source_id`, 85 AS `radical_id`, '酒' AS `hanzi_char` UNION ALL
  SELECT 375 AS `hsk_source_id`, 164 AS `radical_id`, '酒' AS `hanzi_char` UNION ALL
  SELECT 375 AS `hsk_source_id`, 53 AS `radical_id`, '店' AS `hanzi_char` UNION ALL
  SELECT 375 AS `hsk_source_id`, 25 AS `radical_id`, '店' AS `hanzi_char` UNION ALL
  SELECT 375 AS `hsk_source_id`, 30 AS `radical_id`, '店' AS `hanzi_char` UNION ALL
  SELECT 377 AS `hsk_source_id`, 19 AS `radical_id`, '咖' AS `hanzi_char` UNION ALL
  SELECT 377 AS `hsk_source_id`, 30 AS `radical_id`, '咖' AS `hanzi_char` UNION ALL
  SELECT 377 AS `hsk_source_id`, 175 AS `radical_id`, '啡' AS `hanzi_char` UNION ALL
  SELECT 378 AS `hsk_source_id`, 55 AS `radical_id`, '开' AS `hanzi_char` UNION ALL
  SELECT 378 AS `hsk_source_id`, 1 AS `radical_id`, '开' AS `hanzi_char` UNION ALL
  SELECT 378 AS `hsk_source_id`, 28 AS `radical_id`, '始' AS `hanzi_char` UNION ALL
  SELECT 378 AS `hsk_source_id`, 30 AS `radical_id`, '始' AS `hanzi_char` UNION ALL
  SELECT 378 AS `hsk_source_id`, 38 AS `radical_id`, '始' AS `hanzi_char` UNION ALL
  SELECT 379 AS `hsk_source_id`, 55 AS `radical_id`, '开' AS `hanzi_char` UNION ALL
  SELECT 379 AS `hsk_source_id`, 1 AS `radical_id`, '开' AS `hanzi_char` UNION ALL
  SELECT 379 AS `hsk_source_id`, 39 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 379 AS `hsk_source_id`, 42 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 379 AS `hsk_source_id`, 14 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 382 AS `hsk_source_id`, 1 AS `radical_id`, '可' AS `hanzi_char` UNION ALL
  SELECT 382 AS `hsk_source_id`, 30 AS `radical_id`, '可' AS `hanzi_char` UNION ALL
  SELECT 382 AS `hsk_source_id`, 130 AS `radical_id`, '能' AS `hanzi_char` UNION ALL
  SELECT 382 AS `hsk_source_id`, 28 AS `radical_id`, '能' AS `hanzi_char` UNION ALL
  SELECT 382 AS `hsk_source_id`, 21 AS `radical_id`, '能' AS `hanzi_char` UNION ALL
  SELECT 383 AS `hsk_source_id`, 53 AS `radical_id`, '裤' AS `hanzi_char` UNION ALL
  SELECT 383 AS `hsk_source_id`, 145 AS `radical_id`, '裤' AS `hanzi_char` UNION ALL
  SELECT 383 AS `hsk_source_id`, 159 AS `radical_id`, '裤' AS `hanzi_char` UNION ALL
  SELECT 383 AS `hsk_source_id`, 39 AS `radical_id`, '子' AS `hanzi_char` UNION ALL
  SELECT 385 AS `hsk_source_id`, 61 AS `radical_id`, '快' AS `hanzi_char` UNION ALL
  SELECT 385 AS `hsk_source_id`, 37 AS `radical_id`, '快' AS `hanzi_char` UNION ALL
  SELECT 385 AS `hsk_source_id`, 4 AS `radical_id`, '乐' AS `hanzi_char` UNION ALL
  SELECT 385 AS `hsk_source_id`, 42 AS `radical_id`, '乐' AS `hanzi_char` UNION ALL
  SELECT 386 AS `hsk_source_id`, 61 AS `radical_id`, '快' AS `hanzi_char` UNION ALL
  SELECT 386 AS `hsk_source_id`, 37 AS `radical_id`, '快' AS `hanzi_char` UNION ALL
  SELECT 386 AS `hsk_source_id`, 146 AS `radical_id`, '要' AS `hanzi_char` UNION ALL
  SELECT 386 AS `hsk_source_id`, 38 AS `radical_id`, '要' AS `hanzi_char` UNION ALL
  SELECT 387 AS `hsk_source_id`, 108 AS `radical_id`, '篮' AS `hanzi_char` UNION ALL
  SELECT 387 AS `hsk_source_id`, 118 AS `radical_id`, '篮' AS `hanzi_char` UNION ALL
  SELECT 387 AS `hsk_source_id`, 96 AS `radical_id`, '球' AS `hanzi_char` UNION ALL
  SELECT 387 AS `hsk_source_id`, 85 AS `radical_id`, '球' AS `hanzi_char` UNION ALL
  SELECT 387 AS `hsk_source_id`, 1 AS `radical_id`, '球' AS `hanzi_char` UNION ALL
  SELECT 389 AS `hsk_source_id`, 4 AS `radical_id`, '离' AS `hanzi_char` UNION ALL
  SELECT 389 AS `hsk_source_id`, 8 AS `radical_id`, '离' AS `hanzi_char` UNION ALL
  SELECT 389 AS `hsk_source_id`, 17 AS `radical_id`, '离' AS `hanzi_char` UNION ALL
  SELECT 389 AS `hsk_source_id`, 114 AS `radical_id`, '离' AS `hanzi_char` UNION ALL
  SELECT 390 AS `hsk_source_id`, 166 AS `radical_id`, '里' AS `hanzi_char` UNION ALL
  SELECT 390 AS `hsk_source_id`, 176 AS `radical_id`, '面' AS `hanzi_char` UNION ALL
  SELECT 394 AS `hsk_source_id`, 70 AS `radical_id`, '旅' AS `hanzi_char` UNION ALL
  SELECT 394 AS `hsk_source_id`, 83 AS `radical_id`, '旅' AS `hanzi_char` UNION ALL
  SELECT 394 AS `hsk_source_id`, 39 AS `radical_id`, '游' AS `hanzi_char` UNION ALL
  SELECT 394 AS `hsk_source_id`, 85 AS `radical_id`, '游' AS `hanzi_char` UNION ALL
  SELECT 395 AS `hsk_source_id`, 58 AS `radical_id`, '绿' AS `hanzi_char` UNION ALL
  SELECT 395 AS `hsk_source_id`, 85 AS `radical_id`, '绿' AS `hanzi_char` UNION ALL
  SELECT 395 AS `hsk_source_id`, 120 AS `radical_id`, '绿' AS `hanzi_char` UNION ALL
  SELECT 395 AS `hsk_source_id`, 140 AS `radical_id`, '茶' AS `hanzi_char` UNION ALL
  SELECT 395 AS `hsk_source_id`, 9 AS `radical_id`, '茶' AS `hanzi_char` UNION ALL
  SELECT 395 AS `hsk_source_id`, 75 AS `radical_id`, '茶' AS `hanzi_char` UNION ALL
  SELECT 396 AS `hsk_source_id`, 58 AS `radical_id`, '绿' AS `hanzi_char` UNION ALL
  SELECT 396 AS `hsk_source_id`, 85 AS `radical_id`, '绿' AS `hanzi_char` UNION ALL
  SELECT 396 AS `hsk_source_id`, 120 AS `radical_id`, '绿' AS `hanzi_char` UNION ALL
  SELECT 396 AS `hsk_source_id`, 139 AS `radical_id`, '色' AS `hanzi_char` UNION ALL
  SELECT 398 AS `hsk_source_id`, 85 AS `radical_id`, '没' AS `hanzi_char` UNION ALL
  SELECT 398 AS `hsk_source_id`, 79 AS `radical_id`, '没' AS `hanzi_char` UNION ALL
  SELECT 398 AS `hsk_source_id`, 61 AS `radical_id`, '意' AS `hanzi_char` UNION ALL
  SELECT 398 AS `hsk_source_id`, 180 AS `radical_id`, '意' AS `hanzi_char` UNION ALL
  SELECT 398 AS `hsk_source_id`, 102 AS `radical_id`, '思' AS `hanzi_char` UNION ALL
  SELECT 399 AS `hsk_source_id`, 80 AS `radical_id`, '每' AS `hanzi_char` UNION ALL
  SELECT 403 AS `hsk_source_id`, 176 AS `radical_id`, '面' AS `hanzi_char` UNION ALL
  SELECT 404 AS `hsk_source_id`, 30 AS `radical_id`, '名' AS `hanzi_char` UNION ALL
  SELECT 404 AS `hsk_source_id`, 36 AS `radical_id`, '名' AS `hanzi_char` UNION ALL
  SELECT 406 AS `hsk_source_id`, 163 AS `radical_id`, '那' AS `hanzi_char` UNION ALL
  SELECT 406 AS `hsk_source_id`, 4 AS `radical_id`, '么' AS `hanzi_char` UNION ALL
  SELECT 406 AS `hsk_source_id`, 28 AS `radical_id`, '么' AS `hanzi_char` UNION ALL
  SELECT 407 AS `hsk_source_id`, 163 AS `radical_id`, '那' AS `hanzi_char` UNION ALL
  SELECT 407 AS `hsk_source_id`, 75 AS `radical_id`, '样' AS `hanzi_char` UNION ALL
  SELECT 407 AS `hsk_source_id`, 123 AS `radical_id`, '样' AS `hanzi_char` UNION ALL
  SELECT 408 AS `hsk_source_id`, 38 AS `radical_id`, '奶' AS `hanzi_char` UNION ALL
  SELECT 408 AS `hsk_source_id`, 4 AS `radical_id`, '奶' AS `hanzi_char` UNION ALL
  SELECT 408 AS `hsk_source_id`, 140 AS `radical_id`, '茶' AS `hanzi_char` UNION ALL
  SELECT 408 AS `hsk_source_id`, 9 AS `radical_id`, '茶' AS `hanzi_char` UNION ALL
  SELECT 408 AS `hsk_source_id`, 75 AS `radical_id`, '茶' AS `hanzi_char` UNION ALL
  SELECT 411 AS `hsk_source_id`, 196 AS `radical_id`, '鸟' AS `hanzi_char` UNION ALL
  SELECT 415 AS `hsk_source_id`, 157 AS `radical_id`, '跑' AS `hanzi_char` UNION ALL
  SELECT 415 AS `hsk_source_id`, 20 AS `radical_id`, '跑' AS `hanzi_char` UNION ALL
  SELECT 415 AS `hsk_source_id`, 49 AS `radical_id`, '跑' AS `hanzi_char` UNION ALL
  SELECT 415 AS `hsk_source_id`, 77 AS `radical_id`, '步' AS `hanzi_char` UNION ALL
  SELECT 417 AS `hsk_source_id`, 24 AS `radical_id`, '妻' AS `hanzi_char` UNION ALL
  SELECT 417 AS `hsk_source_id`, 38 AS `radical_id`, '妻' AS `hanzi_char` UNION ALL
  SELECT 417 AS `hsk_source_id`, 58 AS `radical_id`, '妻' AS `hanzi_char` UNION ALL
  SELECT 417 AS `hsk_source_id`, 39 AS `radical_id`, '子' AS `hanzi_char` UNION ALL
  SELECT 419 AS `hsk_source_id`, 18 AS `radical_id`, '前' AS `hanzi_char` UNION ALL
  SELECT 419 AS `hsk_source_id`, 12 AS `radical_id`, '前' AS `hanzi_char` UNION ALL
  SELECT 419 AS `hsk_source_id`, 1 AS `radical_id`, '前' AS `hanzi_char` UNION ALL
  SELECT 419 AS `hsk_source_id`, 74 AS `radical_id`, '前' AS `hanzi_char` UNION ALL
  SELECT 419 AS `hsk_source_id`, 176 AS `radical_id`, '面' AS `hanzi_char` UNION ALL
  SELECT 420 AS `hsk_source_id`, 72 AS `radical_id`, '晴' AS `hanzi_char` UNION ALL
  SELECT 420 AS `hsk_source_id`, 174 AS `radical_id`, '晴' AS `hanzi_char` UNION ALL
  SELECT 422 AS `hsk_source_id`, 1 AS `radical_id`, '让' AS `hanzi_char` UNION ALL
  SELECT 422 AS `hsk_source_id`, 2 AS `radical_id`, '让' AS `hanzi_char` UNION ALL
  SELECT 422 AS `hsk_source_id`, 149 AS `radical_id`, '让' AS `hanzi_char` UNION ALL
  SELECT 425 AS `hsk_source_id`, 1 AS `radical_id`, '上' AS `hanzi_char` UNION ALL
  SELECT 425 AS `hsk_source_id`, 25 AS `radical_id`, '上' AS `hanzi_char` UNION ALL
  SELECT 425 AS `hsk_source_id`, 75 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 425 AS `hsk_source_id`, 12 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 426 AS `hsk_source_id`, 1 AS `radical_id`, '上' AS `hanzi_char` UNION ALL
  SELECT 426 AS `hsk_source_id`, 25 AS `radical_id`, '上' AS `hanzi_char` UNION ALL
  SELECT 426 AS `hsk_source_id`, 176 AS `radical_id`, '面' AS `hanzi_char` UNION ALL
  SELECT 427 AS `hsk_source_id`, 1 AS `radical_id`, '上' AS `hanzi_char` UNION ALL
  SELECT 427 AS `hsk_source_id`, 25 AS `radical_id`, '上' AS `hanzi_char` UNION ALL
  SELECT 427 AS `hsk_source_id`, 28 AS `radical_id`, '去' AS `hanzi_char` UNION ALL
  SELECT 427 AS `hsk_source_id`, 32 AS `radical_id`, '去' AS `hanzi_char` UNION ALL
  SELECT 431 AS `hsk_source_id`, 72 AS `radical_id`, '时' AS `hanzi_char` UNION ALL
  SELECT 431 AS `hsk_source_id`, 41 AS `radical_id`, '时' AS `hanzi_char` UNION ALL
  SELECT 432 AS `hsk_source_id`, 6 AS `radical_id`, '事' AS `hanzi_char` UNION ALL
  SELECT 432 AS `hsk_source_id`, 1 AS `radical_id`, '事' AS `hanzi_char` UNION ALL
  SELECT 432 AS `hsk_source_id`, 30 AS `radical_id`, '事' AS `hanzi_char` UNION ALL
  SELECT 432 AS `hsk_source_id`, 58 AS `radical_id`, '事' AS `hanzi_char` UNION ALL
  SELECT 432 AS `hsk_source_id`, 61 AS `radical_id`, '情' AS `hanzi_char` UNION ALL
  SELECT 432 AS `hsk_source_id`, 174 AS `radical_id`, '情' AS `hanzi_char` UNION ALL
  SELECT 434 AS `hsk_source_id`, 64 AS `radical_id`, '手' AS `hanzi_char` UNION ALL
  SELECT 434 AS `hsk_source_id`, 82 AS `radical_id`, '表' AS `hanzi_char` UNION ALL
  SELECT 434 AS `hsk_source_id`, 145 AS `radical_id`, '表' AS `hanzi_char` UNION ALL
  SELECT 436 AS `hsk_source_id`, 1 AS `radical_id`, '舒' AS `hanzi_char` UNION ALL
  SELECT 436 AS `hsk_source_id`, 6 AS `radical_id`, '舒' AS `hanzi_char` UNION ALL
  SELECT 436 AS `hsk_source_id`, 9 AS `radical_id`, '舒' AS `hanzi_char` UNION ALL
  SELECT 436 AS `hsk_source_id`, 135 AS `radical_id`, '舒' AS `hanzi_char` UNION ALL
  SELECT 436 AS `hsk_source_id`, 74 AS `radical_id`, '服' AS `hanzi_char` UNION ALL
  SELECT 436 AS `hsk_source_id`, 26 AS `radical_id`, '服' AS `hanzi_char` UNION ALL
  SELECT 436 AS `hsk_source_id`, 29 AS `radical_id`, '服' AS `hanzi_char` UNION ALL
  SELECT 438 AS `hsk_source_id`, 30 AS `radical_id`, '虽' AS `hanzi_char` UNION ALL
  SELECT 438 AS `hsk_source_id`, 142 AS `radical_id`, '虽' AS `hanzi_char` UNION ALL
  SELECT 438 AS `hsk_source_id`, 86 AS `radical_id`, '然' AS `hanzi_char` UNION ALL
  SELECT 438 AS `hsk_source_id`, 94 AS `radical_id`, '然' AS `hanzi_char` UNION ALL
  SELECT 438 AS `hsk_source_id`, 130 AS `radical_id`, '然' AS `hanzi_char` UNION ALL
  SELECT 439 AS `hsk_source_id`, 63 AS `radical_id`, '所' AS `hanzi_char` UNION ALL
  SELECT 439 AS `hsk_source_id`, 69 AS `radical_id`, '所' AS `hanzi_char` UNION ALL
  SELECT 439 AS `hsk_source_id`, 9 AS `radical_id`, '以' AS `hanzi_char` UNION ALL
  SELECT 440 AS `hsk_source_id`, 34 AS `radical_id`, '疼' AS `hanzi_char` UNION ALL
  SELECT 440 AS `hsk_source_id`, 104 AS `radical_id`, '疼' AS `hanzi_char` UNION ALL
  SELECT 441 AS `hsk_source_id`, 4 AS `radical_id`, '踢' AS `hanzi_char` UNION ALL
  SELECT 441 AS `hsk_source_id`, 20 AS `radical_id`, '踢' AS `hanzi_char`
) m
JOIN `VOCABULARY` v ON v.`hsk_source_id` = m.`hsk_source_id`;

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`)
SELECT v.`vocab_id`, m.`radical_id`, m.`hanzi_char`
FROM (
  SELECT 441 AS `hsk_source_id`, 72 AS `radical_id`, '踢' AS `hanzi_char` UNION ALL
  SELECT 441 AS `hsk_source_id`, 157 AS `radical_id`, '踢' AS `hanzi_char` UNION ALL
  SELECT 442 AS `hsk_source_id`, 72 AS `radical_id`, '题' AS `hanzi_char` UNION ALL
  SELECT 442 AS `hsk_source_id`, 103 AS `radical_id`, '题' AS `hanzi_char` UNION ALL
  SELECT 442 AS `hsk_source_id`, 181 AS `radical_id`, '题' AS `hanzi_char` UNION ALL
  SELECT 443 AS `hsk_source_id`, 75 AS `radical_id`, '条' AS `hanzi_char` UNION ALL
  SELECT 443 AS `hsk_source_id`, 34 AS `radical_id`, '条' AS `hanzi_char` UNION ALL
  SELECT 444 AS `hsk_source_id`, 10 AS `radical_id`, '跳' AS `hanzi_char` UNION ALL
  SELECT 444 AS `hsk_source_id`, 157 AS `radical_id`, '跳' AS `hanzi_char` UNION ALL
  SELECT 444 AS `hsk_source_id`, 86 AS `radical_id`, '舞' AS `hanzi_char` UNION ALL
  SELECT 444 AS `hsk_source_id`, 136 AS `radical_id`, '舞' AS `hanzi_char` UNION ALL
  SELECT 445 AS `hsk_source_id`, 37 AS `radical_id`, '头' AS `hanzi_char` UNION ALL
  SELECT 447 AS `hsk_source_id`, 36 AS `radical_id`, '外' AS `hanzi_char` UNION ALL
  SELECT 447 AS `hsk_source_id`, 25 AS `radical_id`, '外' AS `hanzi_char` UNION ALL
  SELECT 447 AS `hsk_source_id`, 176 AS `radical_id`, '面' AS `hanzi_char` UNION ALL
  SELECT 448 AS `hsk_source_id`, 7 AS `radical_id`, '完' AS `hanzi_char` UNION ALL
  SELECT 448 AS `hsk_source_id`, 10 AS `radical_id`, '完' AS `hanzi_char` UNION ALL
  SELECT 448 AS `hsk_source_id`, 40 AS `radical_id`, '完' AS `hanzi_char` UNION ALL
  SELECT 449 AS `hsk_source_id`, 1 AS `radical_id`, '万' AS `hanzi_char` UNION ALL
  SELECT 450 AS `hsk_source_id`, 60 AS `radical_id`, '往' AS `hanzi_char` UNION ALL
  SELECT 450 AS `hsk_source_id`, 96 AS `radical_id`, '往' AS `hanzi_char` UNION ALL
  SELECT 453 AS `hsk_source_id`, 9 AS `radical_id`, '位' AS `hanzi_char` UNION ALL
  SELECT 453 AS `hsk_source_id`, 117 AS `radical_id`, '位' AS `hanzi_char` UNION ALL
  SELECT 454 AS `hsk_source_id`, 3 AS `radical_id`, '为' AS `hanzi_char` UNION ALL
  SELECT 454 AS `hsk_source_id`, 19 AS `radical_id`, '为' AS `hanzi_char` UNION ALL
  SELECT 454 AS `hsk_source_id`, 9 AS `radical_id`, '什' AS `hanzi_char` UNION ALL
  SELECT 454 AS `hsk_source_id`, 24 AS `radical_id`, '什' AS `hanzi_char` UNION ALL
  SELECT 454 AS `hsk_source_id`, 4 AS `radical_id`, '么' AS `hanzi_char` UNION ALL
  SELECT 454 AS `hsk_source_id`, 28 AS `radical_id`, '么' AS `hanzi_char` UNION ALL
  SELECT 455 AS `hsk_source_id`, 4 AS `radical_id`, '希' AS `hanzi_char` UNION ALL
  SELECT 455 AS `hsk_source_id`, 50 AS `radical_id`, '希' AS `hanzi_char` UNION ALL
  SELECT 455 AS `hsk_source_id`, 8 AS `radical_id`, '望' AS `hanzi_char` UNION ALL
  SELECT 455 AS `hsk_source_id`, 74 AS `radical_id`, '望' AS `hanzi_char` UNION ALL
  SELECT 455 AS `hsk_source_id`, 96 AS `radical_id`, '望' AS `hanzi_char` UNION ALL
  SELECT 458 AS `hsk_source_id`, 1 AS `radical_id`, '下' AS `hanzi_char` UNION ALL
  SELECT 458 AS `hsk_source_id`, 25 AS `radical_id`, '下' AS `hanzi_char` UNION ALL
  SELECT 458 AS `hsk_source_id`, 75 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 458 AS `hsk_source_id`, 12 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 459 AS `hsk_source_id`, 1 AS `radical_id`, '下' AS `hanzi_char` UNION ALL
  SELECT 459 AS `hsk_source_id`, 25 AS `radical_id`, '下' AS `hanzi_char` UNION ALL
  SELECT 459 AS `hsk_source_id`, 176 AS `radical_id`, '面' AS `hanzi_char` UNION ALL
  SELECT 460 AS `hsk_source_id`, 1 AS `radical_id`, '下' AS `hanzi_char` UNION ALL
  SELECT 460 AS `hsk_source_id`, 25 AS `radical_id`, '下' AS `hanzi_char` UNION ALL
  SELECT 460 AS `hsk_source_id`, 28 AS `radical_id`, '去' AS `hanzi_char` UNION ALL
  SELECT 460 AS `hsk_source_id`, 32 AS `radical_id`, '去' AS `hanzi_char` UNION ALL
  SELECT 462 AS `hsk_source_id`, 42 AS `radical_id`, '小' AS `hanzi_char` UNION ALL
  SELECT 462 AS `hsk_source_id`, 72 AS `radical_id`, '时' AS `hanzi_char` UNION ALL
  SELECT 462 AS `hsk_source_id`, 41 AS `radical_id`, '时' AS `hanzi_char` UNION ALL
  SELECT 462 AS `hsk_source_id`, 9 AS `radical_id`, '候' AS `hanzi_char` UNION ALL
  SELECT 462 AS `hsk_source_id`, 111 AS `radical_id`, '候' AS `hanzi_char` UNION ALL
  SELECT 464 AS `hsk_source_id`, 38 AS `radical_id`, '姓' AS `hanzi_char` UNION ALL
  SELECT 464 AS `hsk_source_id`, 100 AS `radical_id`, '姓' AS `hanzi_char` UNION ALL
  SELECT 465 AS `hsk_source_id`, 38 AS `radical_id`, '姓' AS `hanzi_char` UNION ALL
  SELECT 465 AS `hsk_source_id`, 100 AS `radical_id`, '姓' AS `hanzi_char` UNION ALL
  SELECT 465 AS `hsk_source_id`, 30 AS `radical_id`, '名' AS `hanzi_char` UNION ALL
  SELECT 465 AS `hsk_source_id`, 36 AS `radical_id`, '名' AS `hanzi_char` UNION ALL
  SELECT 466 AS `hsk_source_id`, 3 AS `radical_id`, '颜' AS `hanzi_char` UNION ALL
  SELECT 466 AS `hsk_source_id`, 8 AS `radical_id`, '颜' AS `hanzi_char` UNION ALL
  SELECT 466 AS `hsk_source_id`, 27 AS `radical_id`, '颜' AS `hanzi_char` UNION ALL
  SELECT 466 AS `hsk_source_id`, 59 AS `radical_id`, '颜' AS `hanzi_char` UNION ALL
  SELECT 466 AS `hsk_source_id`, 181 AS `radical_id`, '颜' AS `hanzi_char` UNION ALL
  SELECT 466 AS `hsk_source_id`, 139 AS `radical_id`, '色' AS `hanzi_char` UNION ALL
  SELECT 467 AS `hsk_source_id`, 109 AS `radical_id`, '眼' AS `hanzi_char` UNION ALL
  SELECT 467 AS `hsk_source_id`, 138 AS `radical_id`, '眼' AS `hanzi_char` UNION ALL
  SELECT 467 AS `hsk_source_id`, 174 AS `radical_id`, '睛' AS `hanzi_char` UNION ALL
  SELECT 468 AS `hsk_source_id`, 3 AS `radical_id`, '药' AS `hanzi_char` UNION ALL
  SELECT 468 AS `hsk_source_id`, 20 AS `radical_id`, '药' AS `hanzi_char` UNION ALL
  SELECT 468 AS `hsk_source_id`, 120 AS `radical_id`, '药' AS `hanzi_char` UNION ALL
  SELECT 468 AS `hsk_source_id`, 140 AS `radical_id`, '药' AS `hanzi_char` UNION ALL
  SELECT 469 AS `hsk_source_id`, 3 AS `radical_id`, '药' AS `hanzi_char` UNION ALL
  SELECT 469 AS `hsk_source_id`, 20 AS `radical_id`, '药' AS `hanzi_char` UNION ALL
  SELECT 469 AS `hsk_source_id`, 120 AS `radical_id`, '药' AS `hanzi_char` UNION ALL
  SELECT 469 AS `hsk_source_id`, 140 AS `radical_id`, '药' AS `hanzi_char` UNION ALL
  SELECT 469 AS `hsk_source_id`, 53 AS `radical_id`, '店' AS `hanzi_char` UNION ALL
  SELECT 469 AS `hsk_source_id`, 25 AS `radical_id`, '店' AS `hanzi_char` UNION ALL
  SELECT 469 AS `hsk_source_id`, 30 AS `radical_id`, '店' AS `hanzi_char` UNION ALL
  SELECT 472 AS `hsk_source_id`, 49 AS `radical_id`, '已' AS `hanzi_char` UNION ALL
  SELECT 472 AS `hsk_source_id`, 48 AS `radical_id`, '经' AS `hanzi_char` UNION ALL
  SELECT 472 AS `hsk_source_id`, 120 AS `radical_id`, '经' AS `hanzi_char` UNION ALL
  SELECT 474 AS `hsk_source_id`, 61 AS `radical_id`, '意' AS `hanzi_char` UNION ALL
  SELECT 474 AS `hsk_source_id`, 180 AS `radical_id`, '意' AS `hanzi_char` UNION ALL
  SELECT 474 AS `hsk_source_id`, 102 AS `radical_id`, '思' AS `hanzi_char` UNION ALL
  SELECT 475 AS `hsk_source_id`, 74 AS `radical_id`, '阴' AS `hanzi_char` UNION ALL
  SELECT 475 AS `hsk_source_id`, 170 AS `radical_id`, '阴' AS `hanzi_char` UNION ALL
  SELECT 476 AS `hsk_source_id`, 31 AS `radical_id`, '因' AS `hanzi_char` UNION ALL
  SELECT 476 AS `hsk_source_id`, 37 AS `radical_id`, '因' AS `hanzi_char` UNION ALL
  SELECT 476 AS `hsk_source_id`, 3 AS `radical_id`, '为' AS `hanzi_char` UNION ALL
  SELECT 476 AS `hsk_source_id`, 19 AS `radical_id`, '为' AS `hanzi_char` UNION ALL
  SELECT 477 AS `hsk_source_id`, 39 AS `radical_id`, '游' AS `hanzi_char` UNION ALL
  SELECT 477 AS `hsk_source_id`, 70 AS `radical_id`, '游' AS `hanzi_char` UNION ALL
  SELECT 477 AS `hsk_source_id`, 85 AS `radical_id`, '游' AS `hanzi_char` UNION ALL
  SELECT 478 AS `hsk_source_id`, 39 AS `radical_id`, '游' AS `hanzi_char` UNION ALL
  SELECT 478 AS `hsk_source_id`, 70 AS `radical_id`, '游' AS `hanzi_char` UNION ALL
  SELECT 478 AS `hsk_source_id`, 85 AS `radical_id`, '游' AS `hanzi_char` UNION ALL
  SELECT 479 AS `hsk_source_id`, 74 AS `radical_id`, '有' AS `hanzi_char` UNION ALL
  SELECT 479 AS `hsk_source_id`, 61 AS `radical_id`, '意' AS `hanzi_char` UNION ALL
  SELECT 479 AS `hsk_source_id`, 180 AS `radical_id`, '意' AS `hanzi_char` UNION ALL
  SELECT 479 AS `hsk_source_id`, 102 AS `radical_id`, '思' AS `hanzi_char` UNION ALL
  SELECT 480 AS `hsk_source_id`, 74 AS `radical_id`, '有' AS `hanzi_char` UNION ALL
  SELECT 480 AS `hsk_source_id`, 72 AS `radical_id`, '时' AS `hanzi_char` UNION ALL
  SELECT 480 AS `hsk_source_id`, 41 AS `radical_id`, '时' AS `hanzi_char` UNION ALL
  SELECT 483 AS `hsk_source_id`, 195 AS `radical_id`, '鱼' AS `hanzi_char` UNION ALL
  SELECT 485 AS `hsk_source_id`, 7 AS `radical_id`, '运' AS `hanzi_char` UNION ALL
  SELECT 485 AS `hsk_source_id`, 28 AS `radical_id`, '运' AS `hanzi_char` UNION ALL
  SELECT 485 AS `hsk_source_id`, 162 AS `radical_id`, '运' AS `hanzi_char` UNION ALL
  SELECT 485 AS `hsk_source_id`, 19 AS `radical_id`, '动' AS `hanzi_char` UNION ALL
  SELECT 487 AS `hsk_source_id`, 1 AS `radical_id`, '丈' AS `hanzi_char` UNION ALL
  SELECT 487 AS `hsk_source_id`, 29 AS `radical_id`, '丈' AS `hanzi_char` UNION ALL
  SELECT 487 AS `hsk_source_id`, 37 AS `radical_id`, '夫' AS `hanzi_char` UNION ALL
  SELECT 488 AS `hsk_source_id`, 162 AS `radical_id`, '这' AS `hanzi_char` UNION ALL
  SELECT 488 AS `hsk_source_id`, 67 AS `radical_id`, '这' AS `hanzi_char` UNION ALL
  SELECT 488 AS `hsk_source_id`, 4 AS `radical_id`, '么' AS `hanzi_char` UNION ALL
  SELECT 488 AS `hsk_source_id`, 28 AS `radical_id`, '么' AS `hanzi_char` UNION ALL
  SELECT 489 AS `hsk_source_id`, 162 AS `radical_id`, '这' AS `hanzi_char` UNION ALL
  SELECT 489 AS `hsk_source_id`, 67 AS `radical_id`, '这' AS `hanzi_char` UNION ALL
  SELECT 489 AS `hsk_source_id`, 75 AS `radical_id`, '样' AS `hanzi_char` UNION ALL
  SELECT 489 AS `hsk_source_id`, 123 AS `radical_id`, '样' AS `hanzi_char` UNION ALL
  SELECT 492 AS `hsk_source_id`, 13 AS `radical_id`, '周' AS `hanzi_char` UNION ALL
  SELECT 492 AS `hsk_source_id`, 30 AS `radical_id`, '周' AS `hanzi_char` UNION ALL
  SELECT 492 AS `hsk_source_id`, 32 AS `radical_id`, '周' AS `hanzi_char` UNION ALL
  SELECT 494 AS `hsk_source_id`, 132 AS `radical_id`, '自' AS `hanzi_char` UNION ALL
  SELECT 494 AS `hsk_source_id`, 49 AS `radical_id`, '己' AS `hanzi_char` UNION ALL
  SELECT 497 AS `hsk_source_id`, 157 AS `radical_id`, '足' AS `hanzi_char` UNION ALL
  SELECT 497 AS `hsk_source_id`, 96 AS `radical_id`, '球' AS `hanzi_char` UNION ALL
  SELECT 497 AS `hsk_source_id`, 85 AS `radical_id`, '球' AS `hanzi_char` UNION ALL
  SELECT 497 AS `hsk_source_id`, 1 AS `radical_id`, '球' AS `hanzi_char` UNION ALL
  SELECT 501 AS `hsk_source_id`, 1 AS `radical_id`, '阿' AS `hanzi_char` UNION ALL
  SELECT 501 AS `hsk_source_id`, 30 AS `radical_id`, '阿' AS `hanzi_char` UNION ALL
  SELECT 501 AS `hsk_source_id`, 170 AS `radical_id`, '阿' AS `hanzi_char` UNION ALL
  SELECT 501 AS `hsk_source_id`, 37 AS `radical_id`, '姨' AS `hanzi_char` UNION ALL
  SELECT 501 AS `hsk_source_id`, 38 AS `radical_id`, '姨' AS `hanzi_char` UNION ALL
  SELECT 501 AS `hsk_source_id`, 57 AS `radical_id`, '姨' AS `hanzi_char` UNION ALL
  SELECT 502 AS `hsk_source_id`, 38 AS `radical_id`, '矮' AS `hanzi_char` UNION ALL
  SELECT 502 AS `hsk_source_id`, 111 AS `radical_id`, '矮' AS `hanzi_char` UNION ALL
  SELECT 502 AS `hsk_source_id`, 115 AS `radical_id`, '矮' AS `hanzi_char` UNION ALL
  SELECT 503 AS `hsk_source_id`, 87 AS `radical_id`, '爱' AS `hanzi_char` UNION ALL
  SELECT 503 AS `hsk_source_id`, 14 AS `radical_id`, '爱' AS `hanzi_char` UNION ALL
  SELECT 503 AS `hsk_source_id`, 29 AS `radical_id`, '爱' AS `hanzi_char` UNION ALL
  SELECT 503 AS `hsk_source_id`, 9 AS `radical_id`, '人' AS `hanzi_char` UNION ALL
  SELECT 504 AS `hsk_source_id`, 38 AS `radical_id`, '安' AS `hanzi_char` UNION ALL
  SELECT 504 AS `hsk_source_id`, 40 AS `radical_id`, '安' AS `hanzi_char` UNION ALL
  SELECT 504 AS `hsk_source_id`, 6 AS `radical_id`, '静' AS `hanzi_char` UNION ALL
  SELECT 504 AS `hsk_source_id`, 18 AS `radical_id`, '静' AS `hanzi_char` UNION ALL
  SELECT 504 AS `hsk_source_id`, 58 AS `radical_id`, '静' AS `hanzi_char` UNION ALL
  SELECT 504 AS `hsk_source_id`, 174 AS `radical_id`, '静' AS `hanzi_char` UNION ALL
  SELECT 505 AS `hsk_source_id`, 38 AS `radical_id`, '安' AS `hanzi_char` UNION ALL
  SELECT 505 AS `hsk_source_id`, 40 AS `radical_id`, '安' AS `hanzi_char` UNION ALL
  SELECT 505 AS `hsk_source_id`, 11 AS `radical_id`, '全' AS `hanzi_char` UNION ALL
  SELECT 505 AS `hsk_source_id`, 96 AS `radical_id`, '全' AS `hanzi_char` UNION ALL
  SELECT 506 AS `hsk_source_id`, 64 AS `radical_id`, '把' AS `hanzi_char` UNION ALL
  SELECT 507 AS `hsk_source_id`, 64 AS `radical_id`, '搬' AS `hanzi_char` UNION ALL
  SELECT 507 AS `hsk_source_id`, 79 AS `radical_id`, '搬' AS `hanzi_char` UNION ALL
  SELECT 507 AS `hsk_source_id`, 137 AS `radical_id`, '搬' AS `hanzi_char` UNION ALL
  SELECT 508 AS `hsk_source_id`, 96 AS `radical_id`, '班' AS `hanzi_char` UNION ALL
  SELECT 508 AS `hsk_source_id`, 18 AS `radical_id`, '班' AS `hanzi_char` UNION ALL
  SELECT 508 AS `hsk_source_id`, 29 AS `radical_id`, '级' AS `hanzi_char` UNION ALL
  SELECT 508 AS `hsk_source_id`, 120 AS `radical_id`, '级' AS `hanzi_char` UNION ALL
  SELECT 509 AS `hsk_source_id`, 64 AS `radical_id`, '搬' AS `hanzi_char` UNION ALL
  SELECT 509 AS `hsk_source_id`, 79 AS `radical_id`, '搬' AS `hanzi_char` UNION ALL
  SELECT 509 AS `hsk_source_id`, 137 AS `radical_id`, '搬' AS `hanzi_char` UNION ALL
  SELECT 509 AS `hsk_source_id`, 40 AS `radical_id`, '家' AS `hanzi_char` UNION ALL
  SELECT 509 AS `hsk_source_id`, 152 AS `radical_id`, '家' AS `hanzi_char` UNION ALL
  SELECT 510 AS `hsk_source_id`, 12 AS `radical_id`, '办' AS `hanzi_char` UNION ALL
  SELECT 510 AS `hsk_source_id`, 19 AS `radical_id`, '办' AS `hanzi_char` UNION ALL
  SELECT 511 AS `hsk_source_id`, 12 AS `radical_id`, '办' AS `hanzi_char` UNION ALL
  SELECT 511 AS `hsk_source_id`, 19 AS `radical_id`, '办' AS `hanzi_char` UNION ALL
  SELECT 511 AS `hsk_source_id`, 28 AS `radical_id`, '法' AS `hanzi_char` UNION ALL
  SELECT 511 AS `hsk_source_id`, 32 AS `radical_id`, '法' AS `hanzi_char` UNION ALL
  SELECT 511 AS `hsk_source_id`, 85 AS `radical_id`, '法' AS `hanzi_char` UNION ALL
  SELECT 512 AS `hsk_source_id`, 12 AS `radical_id`, '办' AS `hanzi_char` UNION ALL
  SELECT 512 AS `hsk_source_id`, 19 AS `radical_id`, '办' AS `hanzi_char` UNION ALL
  SELECT 512 AS `hsk_source_id`, 28 AS `radical_id`, '公' AS `hanzi_char` UNION ALL
  SELECT 512 AS `hsk_source_id`, 40 AS `radical_id`, '室' AS `hanzi_char` UNION ALL
  SELECT 512 AS `hsk_source_id`, 133 AS `radical_id`, '室' AS `hanzi_char` UNION ALL
  SELECT 514 AS `hsk_source_id`, 50 AS `radical_id`, '帮' AS `hanzi_char` UNION ALL
  SELECT 514 AS `hsk_source_id`, 163 AS `radical_id`, '帮' AS `hanzi_char` UNION ALL
  SELECT 514 AS `hsk_source_id`, 1 AS `radical_id`, '助' AS `hanzi_char` UNION ALL
  SELECT 514 AS `hsk_source_id`, 19 AS `radical_id`, '助' AS `hanzi_char` UNION ALL
  SELECT 514 AS `hsk_source_id`, 74 AS `radical_id`, '助' AS `hanzi_char` UNION ALL
  SELECT 515 AS `hsk_source_id`, 20 AS `radical_id`, '饱' AS `hanzi_char` UNION ALL
  SELECT 515 AS `hsk_source_id`, 184 AS `radical_id`, '饱' AS `hanzi_char` UNION ALL
  SELECT 516 AS `hsk_source_id`, 26 AS `radical_id`, '报' AS `hanzi_char` UNION ALL
  SELECT 516 AS `hsk_source_id`, 29 AS `radical_id`, '报' AS `hanzi_char` UNION ALL
  SELECT 516 AS `hsk_source_id`, 64 AS `radical_id`, '报' AS `hanzi_char` UNION ALL
  SELECT 516 AS `hsk_source_id`, 83 AS `radical_id`, '纸' AS `hanzi_char` UNION ALL
  SELECT 516 AS `hsk_source_id`, 120 AS `radical_id`, '纸' AS `hanzi_char` UNION ALL
  SELECT 518 AS `hsk_source_id`, 21 AS `radical_id`, '北' AS `hanzi_char` UNION ALL
  SELECT 518 AS `hsk_source_id`, 70 AS `radical_id`, '方' AS `hanzi_char` UNION ALL
  SELECT 519 AS `hsk_source_id`, 107 AS `radical_id`, '被' AS `hanzi_char` UNION ALL
  SELECT 519 AS `hsk_source_id`, 145 AS `radical_id`, '被' AS `hanzi_char` UNION ALL
  SELECT 520 AS `hsk_source_id`, 82 AS `radical_id`, '笔' AS `hanzi_char` UNION ALL
  SELECT 520 AS `hsk_source_id`, 118 AS `radical_id`, '笔' AS `hanzi_char` UNION ALL
  SELECT 520 AS `hsk_source_id`, 149 AS `radical_id`, '记' AS `hanzi_char` UNION ALL
  SELECT 520 AS `hsk_source_id`, 49 AS `radical_id`, '记' AS `hanzi_char` UNION ALL
  SELECT 521 AS `hsk_source_id`, 81 AS `radical_id`, '比' AS `hanzi_char` UNION ALL
  SELECT 521 AS `hsk_source_id`, 4 AS `radical_id`, '较' AS `hanzi_char` UNION ALL
  SELECT 521 AS `hsk_source_id`, 8 AS `radical_id`, '较' AS `hanzi_char` UNION ALL
  SELECT 521 AS `hsk_source_id`, 12 AS `radical_id`, '较' AS `hanzi_char` UNION ALL
  SELECT 521 AS `hsk_source_id`, 159 AS `radical_id`, '较' AS `hanzi_char` UNION ALL
  SELECT 522 AS `hsk_source_id`, 82 AS `radical_id`, '笔' AS `hanzi_char` UNION ALL
  SELECT 522 AS `hsk_source_id`, 118 AS `radical_id`, '笔' AS `hanzi_char` UNION ALL
  SELECT 522 AS `hsk_source_id`, 149 AS `radical_id`, '记' AS `hanzi_char` UNION ALL
  SELECT 522 AS `hsk_source_id`, 49 AS `radical_id`, '记' AS `hanzi_char` UNION ALL
  SELECT 522 AS `hsk_source_id`, 75 AS `radical_id`, '本' AS `hanzi_char` UNION ALL
  SELECT 522 AS `hsk_source_id`, 1 AS `radical_id`, '本' AS `hanzi_char` UNION ALL
  SELECT 523 AS `hsk_source_id`, 81 AS `radical_id`, '比' AS `hanzi_char` UNION ALL
  SELECT 523 AS `hsk_source_id`, 30 AS `radical_id`, '如' AS `hanzi_char` UNION ALL
  SELECT 523 AS `hsk_source_id`, 38 AS `radical_id`, '如' AS `hanzi_char` UNION ALL
  SELECT 524 AS `hsk_source_id`, 81 AS `radical_id`, '比' AS `hanzi_char` UNION ALL
  SELECT 524 AS `hsk_source_id`, 40 AS `radical_id`, '赛' AS `hanzi_char` UNION ALL
  SELECT 524 AS `hsk_source_id`, 154 AS `radical_id`, '赛' AS `hanzi_char` UNION ALL
  SELECT 525 AS `hsk_source_id`, 4 AS `radical_id`, '必' AS `hanzi_char` UNION ALL
  SELECT 525 AS `hsk_source_id`, 61 AS `radical_id`, '必' AS `hanzi_char` UNION ALL
  SELECT 525 AS `hsk_source_id`, 59 AS `radical_id`, '须' AS `hanzi_char` UNION ALL
  SELECT 525 AS `hsk_source_id`, 181 AS `radical_id`, '须' AS `hanzi_char` UNION ALL
  SELECT 526 AS `hsk_source_id`, 8 AS `radical_id`, '变' AS `hanzi_char` UNION ALL
  SELECT 526 AS `hsk_source_id`, 29 AS `radical_id`, '变' AS `hanzi_char` UNION ALL
  SELECT 527 AS `hsk_source_id`, 63 AS `radical_id`, '遍' AS `hanzi_char` UNION ALL
  SELECT 527 AS `hsk_source_id`, 162 AS `radical_id`, '遍' AS `hanzi_char` UNION ALL
  SELECT 528 AS `hsk_source_id`, 8 AS `radical_id`, '变' AS `hanzi_char` UNION ALL
  SELECT 528 AS `hsk_source_id`, 29 AS `radical_id`, '变' AS `hanzi_char` UNION ALL
  SELECT 528 AS `hsk_source_id`, 1 AS `radical_id`, '成' AS `hanzi_char` UNION ALL
  SELECT 528 AS `hsk_source_id`, 62 AS `radical_id`, '成' AS `hanzi_char` UNION ALL
  SELECT 529 AS `hsk_source_id`, 8 AS `radical_id`, '变' AS `hanzi_char` UNION ALL
  SELECT 529 AS `hsk_source_id`, 29 AS `radical_id`, '变' AS `hanzi_char` UNION ALL
  SELECT 529 AS `hsk_source_id`, 9 AS `radical_id`, '化' AS `hanzi_char` UNION ALL
  SELECT 529 AS `hsk_source_id`, 21 AS `radical_id`, '化' AS `hanzi_char` UNION ALL
  SELECT 530 AS `hsk_source_id`, 82 AS `radical_id`, '表' AS `hanzi_char` UNION ALL
  SELECT 530 AS `hsk_source_id`, 145 AS `radical_id`, '表' AS `hanzi_char` UNION ALL
  SELECT 530 AS `hsk_source_id`, 1 AS `radical_id`, '演' AS `hanzi_char` UNION ALL
  SELECT 530 AS `hsk_source_id`, 12 AS `radical_id`, '演' AS `hanzi_char` UNION ALL
  SELECT 530 AS `hsk_source_id`, 40 AS `radical_id`, '演' AS `hanzi_char` UNION ALL
  SELECT 530 AS `hsk_source_id`, 85 AS `radical_id`, '演' AS `hanzi_char` UNION ALL
  SELECT 530 AS `hsk_source_id`, 102 AS `radical_id`, '演' AS `hanzi_char` UNION ALL
  SELECT 533 AS `hsk_source_id`, 1 AS `radical_id`, '宾' AS `hanzi_char` UNION ALL
  SELECT 533 AS `hsk_source_id`, 12 AS `radical_id`, '宾' AS `hanzi_char` UNION ALL
  SELECT 533 AS `hsk_source_id`, 40 AS `radical_id`, '宾' AS `hanzi_char` UNION ALL
  SELECT 533 AS `hsk_source_id`, 69 AS `radical_id`, '宾' AS `hanzi_char` UNION ALL
  SELECT 533 AS `hsk_source_id`, 184 AS `radical_id`, '馆' AS `hanzi_char` UNION ALL
  SELECT 534 AS `hsk_source_id`, 15 AS `radical_id`, '冰' AS `hanzi_char` UNION ALL
  SELECT 534 AS `hsk_source_id`, 85 AS `radical_id`, '冰' AS `hanzi_char` UNION ALL
  SELECT 535 AS `hsk_source_id`, 15 AS `radical_id`, '冰' AS `hanzi_char` UNION ALL
  SELECT 535 AS `hsk_source_id`, 85 AS `radical_id`, '冰' AS `hanzi_char` UNION ALL
  SELECT 535 AS `hsk_source_id`, 66 AS `radical_id`, '激' AS `hanzi_char` UNION ALL
  SELECT 535 AS `hsk_source_id`, 70 AS `radical_id`, '激' AS `hanzi_char` UNION ALL
  SELECT 535 AS `hsk_source_id`, 106 AS `radical_id`, '激' AS `hanzi_char` UNION ALL
  SELECT 535 AS `hsk_source_id`, 12 AS `radical_id`, '凌' AS `hanzi_char` UNION ALL
  SELECT 535 AS `hsk_source_id`, 32 AS `radical_id`, '凌' AS `hanzi_char` UNION ALL
  SELECT 535 AS `hsk_source_id`, 34 AS `radical_id`, '凌' AS `hanzi_char` UNION ALL
  SELECT 535 AS `hsk_source_id`, 35 AS `radical_id`, '凌' AS `hanzi_char` UNION ALL
  SELECT 536 AS `hsk_source_id`, 15 AS `radical_id`, '冰' AS `hanzi_char` UNION ALL
  SELECT 536 AS `hsk_source_id`, 85 AS `radical_id`, '冰' AS `hanzi_char` UNION ALL
  SELECT 536 AS `hsk_source_id`, 75 AS `radical_id`, '箱' AS `hanzi_char` UNION ALL
  SELECT 536 AS `hsk_source_id`, 109 AS `radical_id`, '箱' AS `hanzi_char` UNION ALL
  SELECT 536 AS `hsk_source_id`, 118 AS `radical_id`, '箱' AS `hanzi_char` UNION ALL
  SELECT 538 AS `hsk_source_id`, 1 AS `radical_id`, '不' AS `hanzi_char` UNION ALL
  SELECT 538 AS `hsk_source_id`, 9 AS `radical_id`, '但' AS `hanzi_char` UNION ALL
  SELECT 538 AS `hsk_source_id`, 72 AS `radical_id`, '但' AS `hanzi_char` UNION ALL
  SELECT 539 AS `hsk_source_id`, 1 AS `radical_id`, '不' AS `hanzi_char` UNION ALL
  SELECT 539 AS `hsk_source_id`, 147 AS `radical_id`, '见' AS `hanzi_char` UNION ALL
  SELECT 539 AS `hsk_source_id`, 13 AS `radical_id`, '见' AS `hanzi_char` UNION ALL
  SELECT 539 AS `hsk_source_id`, 10 AS `radical_id`, '见' AS `hanzi_char` UNION ALL
  SELECT 541 AS `hsk_source_id`, 1 AS `radical_id`, '不' AS `hanzi_char` UNION ALL
  SELECT 541 AS `hsk_source_id`, 30 AS `radical_id`, '同' AS `hanzi_char` UNION ALL
  SELECT 541 AS `hsk_source_id`, 16 AS `radical_id`, '同' AS `hanzi_char` UNION ALL
  SELECT 541 AS `hsk_source_id`, 3 AS `radical_id`, '同' AS `hanzi_char` UNION ALL
  SELECT 542 AS `hsk_source_id`, 1 AS `radical_id`, '不' AS `hanzi_char` UNION ALL
  SELECT 542 AS `hsk_source_id`, 4 AS `radical_id`, '久' AS `hanzi_char` UNION ALL
  SELECT 542 AS `hsk_source_id`, 20 AS `radical_id`, '久' AS `hanzi_char` UNION ALL
  SELECT 543 AS `hsk_source_id`, 1 AS `radical_id`, '不' AS `hanzi_char` UNION ALL
  SELECT 543 AS `hsk_source_id`, 144 AS `radical_id`, '行' AS `hanzi_char` UNION ALL
  SELECT 544 AS `hsk_source_id`, 64 AS `radical_id`, '才' AS `hanzi_char` UNION ALL
  SELECT 545 AS `hsk_source_id`, 140 AS `radical_id`, '菜' AS `hanzi_char` UNION ALL
  SELECT 545 AS `hsk_source_id`, 165 AS `radical_id`, '菜' AS `hanzi_char` UNION ALL
  SELECT 545 AS `hsk_source_id`, 87 AS `radical_id`, '菜' AS `hanzi_char` UNION ALL
  SELECT 545 AS `hsk_source_id`, 75 AS `radical_id`, '菜' AS `hanzi_char` UNION ALL
  SELECT 545 AS `hsk_source_id`, 3 AS `radical_id`, '单' AS `hanzi_char` UNION ALL
  SELECT 546 AS `hsk_source_id`, 28 AS `radical_id`, '参' AS `hanzi_char` UNION ALL
  SELECT 546 AS `hsk_source_id`, 37 AS `radical_id`, '参' AS `hanzi_char` UNION ALL
  SELECT 546 AS `hsk_source_id`, 59 AS `radical_id`, '参' AS `hanzi_char` UNION ALL
  SELECT 546 AS `hsk_source_id`, 19 AS `radical_id`, '加' AS `hanzi_char` UNION ALL
  SELECT 546 AS `hsk_source_id`, 30 AS `radical_id`, '加' AS `hanzi_char` UNION ALL
  SELECT 547 AS `hsk_source_id`, 24 AS `radical_id`, '草' AS `hanzi_char` UNION ALL
  SELECT 547 AS `hsk_source_id`, 72 AS `radical_id`, '草' AS `hanzi_char` UNION ALL
  SELECT 547 AS `hsk_source_id`, 140 AS `radical_id`, '草' AS `hanzi_char` UNION ALL
  SELECT 548 AS `hsk_source_id`, 24 AS `radical_id`, '草' AS `hanzi_char` UNION ALL
  SELECT 548 AS `hsk_source_id`, 72 AS `radical_id`, '草' AS `hanzi_char` UNION ALL
  SELECT 548 AS `hsk_source_id`, 140 AS `radical_id`, '草' AS `hanzi_char` UNION ALL
  SELECT 548 AS `hsk_source_id`, 32 AS `radical_id`, '地' AS `hanzi_char` UNION ALL
  SELECT 548 AS `hsk_source_id`, 5 AS `radical_id`, '地' AS `hanzi_char` UNION ALL
  SELECT 549 AS `hsk_source_id`, 7 AS `radical_id`, '层' AS `hanzi_char` UNION ALL
  SELECT 549 AS `hsk_source_id`, 28 AS `radical_id`, '层' AS `hanzi_char` UNION ALL
  SELECT 549 AS `hsk_source_id`, 44 AS `radical_id`, '层' AS `hanzi_char` UNION ALL
  SELECT 550 AS `hsk_source_id`, 1 AS `radical_id`, '查' AS `hanzi_char` UNION ALL
  SELECT 550 AS `hsk_source_id`, 72 AS `radical_id`, '查' AS `hanzi_char` UNION ALL
  SELECT 550 AS `hsk_source_id`, 75 AS `radical_id`, '查' AS `hanzi_char` UNION ALL
  SELECT 552 AS `hsk_source_id`, 48 AS `radical_id`, '差' AS `hanzi_char` UNION ALL
  SELECT 552 AS `hsk_source_id`, 123 AS `radical_id`, '差' AS `hanzi_char` UNION ALL
  SELECT 552 AS `hsk_source_id`, 1 AS `radical_id`, '不' AS `hanzi_char` UNION ALL
  SELECT 552 AS `hsk_source_id`, 36 AS `radical_id`, '多' AS `hanzi_char` UNION ALL
  SELECT 553 AS `hsk_source_id`, 7 AS `radical_id`, '尝' AS `hanzi_char` UNION ALL
  SELECT 553 AS `hsk_source_id`, 13 AS `radical_id`, '尝' AS `hanzi_char` UNION ALL
  SELECT 553 AS `hsk_source_id`, 28 AS `radical_id`, '尝' AS `hanzi_char` UNION ALL
  SELECT 553 AS `hsk_source_id`, 30 AS `radical_id`, '尝' AS `hanzi_char` UNION ALL
  SELECT 553 AS `hsk_source_id`, 42 AS `radical_id`, '尝' AS `hanzi_char` UNION ALL
  SELECT 555 AS `hsk_source_id`, 50 AS `radical_id`, '常' AS `hanzi_char` UNION ALL
  SELECT 555 AS `hsk_source_id`, 42 AS `radical_id`, '常' AS `hanzi_char` UNION ALL
  SELECT 555 AS `hsk_source_id`, 13 AS `radical_id`, '常' AS `hanzi_char` UNION ALL
  SELECT 555 AS `hsk_source_id`, 30 AS `radical_id`, '常' AS `hanzi_char` UNION ALL
  SELECT 555 AS `hsk_source_id`, 147 AS `radical_id`, '见' AS `hanzi_char` UNION ALL
  SELECT 555 AS `hsk_source_id`, 10 AS `radical_id`, '见' AS `hanzi_char` UNION ALL
  SELECT 556 AS `hsk_source_id`, 50 AS `radical_id`, '常' AS `hanzi_char` UNION ALL
  SELECT 556 AS `hsk_source_id`, 42 AS `radical_id`, '常' AS `hanzi_char` UNION ALL
  SELECT 556 AS `hsk_source_id`, 13 AS `radical_id`, '常' AS `hanzi_char` UNION ALL
  SELECT 556 AS `hsk_source_id`, 30 AS `radical_id`, '常' AS `hanzi_char` UNION ALL
  SELECT 556 AS `hsk_source_id`, 101 AS `radical_id`, '用' AS `hanzi_char` UNION ALL
  SELECT 558 AS `hsk_source_id`, 41 AS `radical_id`, '衬' AS `hanzi_char` UNION ALL
  SELECT 558 AS `hsk_source_id`, 145 AS `radical_id`, '衬' AS `hanzi_char` UNION ALL
  SELECT 558 AS `hsk_source_id`, 59 AS `radical_id`, '衫' AS `hanzi_char` UNION ALL
  SELECT 559 AS `hsk_source_id`, 1 AS `radical_id`, '成' AS `hanzi_char` UNION ALL
  SELECT 559 AS `hsk_source_id`, 62 AS `radical_id`, '成' AS `hanzi_char` UNION ALL
  SELECT 559 AS `hsk_source_id`, 120 AS `radical_id`, '绩' AS `hanzi_char` UNION ALL
  SELECT 559 AS `hsk_source_id`, 154 AS `radical_id`, '绩' AS `hanzi_char` UNION ALL
  SELECT 560 AS `hsk_source_id`, 1 AS `radical_id`, '城' AS `hanzi_char` UNION ALL
  SELECT 560 AS `hsk_source_id`, 32 AS `radical_id`, '城' AS `hanzi_char` UNION ALL
  SELECT 560 AS `hsk_source_id`, 62 AS `radical_id`, '城' AS `hanzi_char` UNION ALL
  SELECT 560 AS `hsk_source_id`, 8 AS `radical_id`, '市' AS `hanzi_char` UNION ALL
  SELECT 560 AS `hsk_source_id`, 50 AS `radical_id`, '市' AS `hanzi_char` UNION ALL
  SELECT 561 AS `hsk_source_id`, 44 AS `radical_id`, '迟' AS `hanzi_char` UNION ALL
  SELECT 561 AS `hsk_source_id`, 162 AS `radical_id`, '迟' AS `hanzi_char` UNION ALL
  SELECT 561 AS `hsk_source_id`, 18 AS `radical_id`, '到' AS `hanzi_char` UNION ALL
  SELECT 561 AS `hsk_source_id`, 133 AS `radical_id`, '到' AS `hanzi_char` UNION ALL
  SELECT 562 AS `hsk_source_id`, 17 AS `radical_id`, '出' AS `hanzi_char` UNION ALL
  SELECT 562 AS `hsk_source_id`, 45 AS `radical_id`, '出' AS `hanzi_char` UNION ALL
  SELECT 562 AS `hsk_source_id`, 29 AS `radical_id`, '发' AS `hanzi_char` UNION ALL
  SELECT 563 AS `hsk_source_id`, 17 AS `radical_id`, '出' AS `hanzi_char` UNION ALL
  SELECT 563 AS `hsk_source_id`, 45 AS `radical_id`, '出' AS `hanzi_char` UNION ALL
  SELECT 563 AS `hsk_source_id`, 100 AS `radical_id`, '生' AS `hanzi_char` UNION ALL
  SELECT 564 AS `hsk_source_id`, 17 AS `radical_id`, '出' AS `hanzi_char` UNION ALL
  SELECT 564 AS `hsk_source_id`, 45 AS `radical_id`, '出' AS `hanzi_char` UNION ALL
  SELECT 564 AS `hsk_source_id`, 170 AS `radical_id`, '院' AS `hanzi_char` UNION ALL
  SELECT 564 AS `hsk_source_id`, 40 AS `radical_id`, '院' AS `hanzi_char` UNION ALL
  SELECT 565 AS `hsk_source_id`, 18 AS `radical_id`, '初' AS `hanzi_char` UNION ALL
  SELECT 565 AS `hsk_source_id`, 145 AS `radical_id`, '初' AS `hanzi_char` UNION ALL
  SELECT 565 AS `hsk_source_id`, 2 AS `radical_id`, '中' AS `hanzi_char` UNION ALL
  SELECT 565 AS `hsk_source_id`, 30 AS `radical_id`, '中' AS `hanzi_char` UNION ALL
  SELECT 566 AS `hsk_source_id`, 9 AS `radical_id`, '除' AS `hanzi_char` UNION ALL
  SELECT 566 AS `hsk_source_id`, 170 AS `radical_id`, '除' AS `hanzi_char` UNION ALL
  SELECT 566 AS `hsk_source_id`, 6 AS `radical_id`, '了' AS `hanzi_char` UNION ALL
  SELECT 566 AS `hsk_source_id`, 5 AS `radical_id`, '了' AS `hanzi_char` UNION ALL
  SELECT 567 AS `hsk_source_id`, 16 AS `radical_id`, '船' AS `hanzi_char` UNION ALL
  SELECT 567 AS `hsk_source_id`, 30 AS `radical_id`, '船' AS `hanzi_char` UNION ALL
  SELECT 567 AS `hsk_source_id`, 137 AS `radical_id`, '船' AS `hanzi_char` UNION ALL
  SELECT 568 AS `hsk_source_id`, 72 AS `radical_id`, '春' AS `hanzi_char` UNION ALL
  SELECT 568 AS `hsk_source_id`, 37 AS `radical_id`, '天' AS `hanzi_char` UNION ALL
  SELECT 568 AS `hsk_source_id`, 1 AS `radical_id`, '天' AS `hanzi_char` UNION ALL
  SELECT 569 AS `hsk_source_id`, 30 AS `radical_id`, '词' AS `hanzi_char` UNION ALL
  SELECT 569 AS `hsk_source_id`, 149 AS `radical_id`, '词' AS `hanzi_char` UNION ALL
  SELECT 569 AS `hsk_source_id`, 2 AS `radical_id`, '典' AS `hanzi_char` UNION ALL
  SELECT 569 AS `hsk_source_id`, 12 AS `radical_id`, '典' AS `hanzi_char` UNION ALL
  SELECT 569 AS `hsk_source_id`, 73 AS `radical_id`, '典' AS `hanzi_char` UNION ALL
  SELECT 570 AS `hsk_source_id`, 3 AS `radical_id`, '聪' AS `hanzi_char` UNION ALL
  SELECT 570 AS `hsk_source_id`, 30 AS `radical_id`, '聪' AS `hanzi_char` UNION ALL
  SELECT 570 AS `hsk_source_id`, 61 AS `radical_id`, '聪' AS `hanzi_char` UNION ALL
  SELECT 570 AS `hsk_source_id`, 128 AS `radical_id`, '聪' AS `hanzi_char` UNION ALL
  SELECT 570 AS `hsk_source_id`, 72 AS `radical_id`, '明' AS `hanzi_char` UNION ALL
  SELECT 570 AS `hsk_source_id`, 74 AS `radical_id`, '明' AS `hanzi_char` UNION ALL
  SELECT 571 AS `hsk_source_id`, 64 AS `radical_id`, '打' AS `hanzi_char` UNION ALL
  SELECT 571 AS `hsk_source_id`, 1 AS `radical_id`, '打' AS `hanzi_char` UNION ALL
  SELECT 571 AS `hsk_source_id`, 58 AS `radical_id`, '扫' AS `hanzi_char` UNION ALL
  SELECT 572 AS `hsk_source_id`, 64 AS `radical_id`, '打' AS `hanzi_char` UNION ALL
  SELECT 572 AS `hsk_source_id`, 1 AS `radical_id`, '打' AS `hanzi_char` UNION ALL
  SELECT 572 AS `hsk_source_id`, 12 AS `radical_id`, '算' AS `hanzi_char` UNION ALL
  SELECT 572 AS `hsk_source_id`, 109 AS `radical_id`, '算' AS `hanzi_char` UNION ALL
  SELECT 572 AS `hsk_source_id`, 118 AS `radical_id`, '算' AS `hanzi_char` UNION ALL
  SELECT 573 AS `hsk_source_id`, 37 AS `radical_id`, '大' AS `hanzi_char` UNION ALL
  SELECT 573 AS `hsk_source_id`, 75 AS `radical_id`, '概' AS `hanzi_char` UNION ALL
  SELECT 574 AS `hsk_source_id`, 37 AS `radical_id`, '大' AS `hanzi_char` UNION ALL
  SELECT 574 AS `hsk_source_id`, 9 AS `radical_id`, '人' AS `hanzi_char` UNION ALL
  SELECT 575 AS `hsk_source_id`, 37 AS `radical_id`, '大' AS `hanzi_char` UNION ALL
  SELECT 575 AS `hsk_source_id`, 42 AS `radical_id`, '小' AS `hanzi_char` UNION ALL
  SELECT 576 AS `hsk_source_id`, 37 AS `radical_id`, '大' AS `hanzi_char` UNION ALL
  SELECT 576 AS `hsk_source_id`, 21 AS `radical_id`, '熊' AS `hanzi_char` UNION ALL
  SELECT 576 AS `hsk_source_id`, 28 AS `radical_id`, '熊' AS `hanzi_char` UNION ALL
  SELECT 576 AS `hsk_source_id`, 86 AS `radical_id`, '熊' AS `hanzi_char` UNION ALL
  SELECT 576 AS `hsk_source_id`, 130 AS `radical_id`, '熊' AS `hanzi_char` UNION ALL
  SELECT 576 AS `hsk_source_id`, 94 AS `radical_id`, '猫' AS `hanzi_char` UNION ALL
  SELECT 576 AS `hsk_source_id`, 102 AS `radical_id`, '猫' AS `hanzi_char` UNION ALL
  SELECT 576 AS `hsk_source_id`, 140 AS `radical_id`, '猫' AS `hanzi_char` UNION ALL
  SELECT 577 AS `hsk_source_id`, 37 AS `radical_id`, '大' AS `hanzi_char` UNION ALL
  SELECT 577 AS `hsk_source_id`, 145 AS `radical_id`, '衣' AS `hanzi_char` UNION ALL
  SELECT 578 AS `hsk_source_id`, 1 AS `radical_id`, '带' AS `hanzi_char` UNION ALL
  SELECT 578 AS `hsk_source_id`, 2 AS `radical_id`, '带' AS `hanzi_char` UNION ALL
  SELECT 578 AS `hsk_source_id`, 4 AS `radical_id`, '带' AS `hanzi_char` UNION ALL
  SELECT 578 AS `hsk_source_id`, 14 AS `radical_id`, '带' AS `hanzi_char` UNION ALL
  SELECT 578 AS `hsk_source_id`, 24 AS `radical_id`, '带' AS `hanzi_char` UNION ALL
  SELECT 578 AS `hsk_source_id`, 50 AS `radical_id`, '带' AS `hanzi_char` UNION ALL
  SELECT 579 AS `hsk_source_id`, 1 AS `radical_id`, '担' AS `hanzi_char` UNION ALL
  SELECT 579 AS `hsk_source_id`, 64 AS `radical_id`, '担' AS `hanzi_char` UNION ALL
  SELECT 579 AS `hsk_source_id`, 72 AS `radical_id`, '担' AS `hanzi_char`
) m
JOIN `VOCABULARY` v ON v.`hsk_source_id` = m.`hsk_source_id`;

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`)
SELECT v.`vocab_id`, m.`radical_id`, m.`hanzi_char`
FROM (
  SELECT 579 AS `hsk_source_id`, 61 AS `radical_id`, '心' AS `hanzi_char` UNION ALL
  SELECT 580 AS `hsk_source_id`, 142 AS `radical_id`, '蛋' AS `hanzi_char` UNION ALL
  SELECT 580 AS `hsk_source_id`, 103 AS `radical_id`, '蛋' AS `hanzi_char` UNION ALL
  SELECT 580 AS `hsk_source_id`, 86 AS `radical_id`, '糕' AS `hanzi_char` UNION ALL
  SELECT 580 AS `hsk_source_id`, 119 AS `radical_id`, '糕' AS `hanzi_char` UNION ALL
  SELECT 580 AS `hsk_source_id`, 123 AS `radical_id`, '糕' AS `hanzi_char` UNION ALL
  SELECT 581 AS `hsk_source_id`, 42 AS `radical_id`, '当' AS `hanzi_char` UNION ALL
  SELECT 581 AS `hsk_source_id`, 58 AS `radical_id`, '当' AS `hanzi_char` UNION ALL
  SELECT 581 AS `hsk_source_id`, 86 AS `radical_id`, '然' AS `hanzi_char` UNION ALL
  SELECT 581 AS `hsk_source_id`, 94 AS `radical_id`, '然' AS `hanzi_char` UNION ALL
  SELECT 581 AS `hsk_source_id`, 130 AS `radical_id`, '然' AS `hanzi_char` UNION ALL
  SELECT 582 AS `hsk_source_id`, 18 AS `radical_id`, '到' AS `hanzi_char` UNION ALL
  SELECT 582 AS `hsk_source_id`, 133 AS `radical_id`, '到' AS `hanzi_char` UNION ALL
  SELECT 582 AS `hsk_source_id`, 25 AS `radical_id`, '处' AS `hanzi_char` UNION ALL
  SELECT 582 AS `hsk_source_id`, 34 AS `radical_id`, '处' AS `hanzi_char` UNION ALL
  SELECT 583 AS `hsk_source_id`, 60 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 583 AS `hsk_source_id`, 72 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 583 AS `hsk_source_id`, 1 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 583 AS `hsk_source_id`, 41 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 585 AS `hsk_source_id`, 60 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 585 AS `hsk_source_id`, 72 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 585 AS `hsk_source_id`, 1 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 585 AS `hsk_source_id`, 41 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 585 AS `hsk_source_id`, 18 AS `radical_id`, '分' AS `hanzi_char` UNION ALL
  SELECT 585 AS `hsk_source_id`, 12 AS `radical_id`, '分' AS `hanzi_char` UNION ALL
  SELECT 586 AS `hsk_source_id`, 106 AS `radical_id`, '的' AS `hanzi_char` UNION ALL
  SELECT 586 AS `hsk_source_id`, 20 AS `radical_id`, '的' AS `hanzi_char` UNION ALL
  SELECT 586 AS `hsk_source_id`, 3 AS `radical_id`, '的' AS `hanzi_char` UNION ALL
  SELECT 586 AS `hsk_source_id`, 149 AS `radical_id`, '话' AS `hanzi_char` UNION ALL
  SELECT 586 AS `hsk_source_id`, 135 AS `radical_id`, '话' AS `hanzi_char` UNION ALL
  SELECT 587 AS `hsk_source_id`, 60 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 587 AS `hsk_source_id`, 72 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 587 AS `hsk_source_id`, 1 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 587 AS `hsk_source_id`, 41 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 588 AS `hsk_source_id`, 1 AS `radical_id`, '灯' AS `hanzi_char` UNION ALL
  SELECT 588 AS `hsk_source_id`, 86 AS `radical_id`, '灯' AS `hanzi_char` UNION ALL
  SELECT 594 AS `hsk_source_id`, 73 AS `radical_id`, '电' AS `hanzi_char` UNION ALL
  SELECT 594 AS `hsk_source_id`, 5 AS `radical_id`, '电' AS `hanzi_char` UNION ALL
  SELECT 594 AS `hsk_source_id`, 3 AS `radical_id`, '梯' AS `hanzi_char` UNION ALL
  SELECT 594 AS `hsk_source_id`, 57 AS `radical_id`, '梯' AS `hanzi_char` UNION ALL
  SELECT 594 AS `hsk_source_id`, 75 AS `radical_id`, '梯' AS `hanzi_char` UNION ALL
  SELECT 595 AS `hsk_source_id`, 73 AS `radical_id`, '电' AS `hanzi_char` UNION ALL
  SELECT 595 AS `hsk_source_id`, 5 AS `radical_id`, '电' AS `hanzi_char` UNION ALL
  SELECT 595 AS `hsk_source_id`, 39 AS `radical_id`, '子' AS `hanzi_char` UNION ALL
  SELECT 595 AS `hsk_source_id`, 2 AS `radical_id`, '书' AS `hanzi_char` UNION ALL
  SELECT 596 AS `hsk_source_id`, 1 AS `radical_id`, '丢' AS `hanzi_char` UNION ALL
  SELECT 596 AS `hsk_source_id`, 28 AS `radical_id`, '丢' AS `hanzi_char` UNION ALL
  SELECT 596 AS `hsk_source_id`, 96 AS `radical_id`, '丢' AS `hanzi_char` UNION ALL
  SELECT 598 AS `hsk_source_id`, 1 AS `radical_id`, '东' AS `hanzi_char` UNION ALL
  SELECT 598 AS `hsk_source_id`, 5 AS `radical_id`, '东' AS `hanzi_char` UNION ALL
  SELECT 598 AS `hsk_source_id`, 42 AS `radical_id`, '东' AS `hanzi_char` UNION ALL
  SELECT 598 AS `hsk_source_id`, 21 AS `radical_id`, '北' AS `hanzi_char` UNION ALL
  SELECT 599 AS `hsk_source_id`, 1 AS `radical_id`, '东' AS `hanzi_char` UNION ALL
  SELECT 599 AS `hsk_source_id`, 5 AS `radical_id`, '东' AS `hanzi_char` UNION ALL
  SELECT 599 AS `hsk_source_id`, 42 AS `radical_id`, '东' AS `hanzi_char` UNION ALL
  SELECT 599 AS `hsk_source_id`, 70 AS `radical_id`, '方' AS `hanzi_char` UNION ALL
  SELECT 600 AS `hsk_source_id`, 1 AS `radical_id`, '东' AS `hanzi_char` UNION ALL
  SELECT 600 AS `hsk_source_id`, 5 AS `radical_id`, '东' AS `hanzi_char` UNION ALL
  SELECT 600 AS `hsk_source_id`, 42 AS `radical_id`, '东' AS `hanzi_char` UNION ALL
  SELECT 600 AS `hsk_source_id`, 24 AS `radical_id`, '南' AS `hanzi_char` UNION ALL
  SELECT 600 AS `hsk_source_id`, 13 AS `radical_id`, '南' AS `hanzi_char` UNION ALL
  SELECT 600 AS `hsk_source_id`, 12 AS `radical_id`, '南' AS `hanzi_char` UNION ALL
  SELECT 600 AS `hsk_source_id`, 51 AS `radical_id`, '南' AS `hanzi_char` UNION ALL
  SELECT 601 AS `hsk_source_id`, 34 AS `radical_id`, '冬' AS `hanzi_char` UNION ALL
  SELECT 601 AS `hsk_source_id`, 37 AS `radical_id`, '天' AS `hanzi_char` UNION ALL
  SELECT 601 AS `hsk_source_id`, 1 AS `radical_id`, '天' AS `hanzi_char` UNION ALL
  SELECT 602 AS `hsk_source_id`, 4 AS `radical_id`, '懂' AS `hanzi_char` UNION ALL
  SELECT 602 AS `hsk_source_id`, 24 AS `radical_id`, '懂' AS `hanzi_char` UNION ALL
  SELECT 602 AS `hsk_source_id`, 61 AS `radical_id`, '懂' AS `hanzi_char` UNION ALL
  SELECT 602 AS `hsk_source_id`, 140 AS `radical_id`, '懂' AS `hanzi_char` UNION ALL
  SELECT 602 AS `hsk_source_id`, 166 AS `radical_id`, '懂' AS `hanzi_char` UNION ALL
  SELECT 602 AS `hsk_source_id`, 60 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 602 AS `hsk_source_id`, 72 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 602 AS `hsk_source_id`, 1 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 602 AS `hsk_source_id`, 41 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 603 AS `hsk_source_id`, 19 AS `radical_id`, '动' AS `hanzi_char` UNION ALL
  SELECT 603 AS `hsk_source_id`, 7 AS `radical_id`, '动' AS `hanzi_char` UNION ALL
  SELECT 603 AS `hsk_source_id`, 28 AS `radical_id`, '动' AS `hanzi_char` UNION ALL
  SELECT 603 AS `hsk_source_id`, 4 AS `radical_id`, '物' AS `hanzi_char` UNION ALL
  SELECT 603 AS `hsk_source_id`, 20 AS `radical_id`, '物' AS `hanzi_char` UNION ALL
  SELECT 603 AS `hsk_source_id`, 93 AS `radical_id`, '物' AS `hanzi_char` UNION ALL
  SELECT 604 AS `hsk_source_id`, 19 AS `radical_id`, '动' AS `hanzi_char` UNION ALL
  SELECT 604 AS `hsk_source_id`, 7 AS `radical_id`, '动' AS `hanzi_char` UNION ALL
  SELECT 604 AS `hsk_source_id`, 28 AS `radical_id`, '动' AS `hanzi_char` UNION ALL
  SELECT 604 AS `hsk_source_id`, 4 AS `radical_id`, '物' AS `hanzi_char` UNION ALL
  SELECT 604 AS `hsk_source_id`, 20 AS `radical_id`, '物' AS `hanzi_char` UNION ALL
  SELECT 604 AS `hsk_source_id`, 93 AS `radical_id`, '物' AS `hanzi_char` UNION ALL
  SELECT 604 AS `hsk_source_id`, 10 AS `radical_id`, '园' AS `hanzi_char` UNION ALL
  SELECT 604 AS `hsk_source_id`, 31 AS `radical_id`, '园' AS `hanzi_char` UNION ALL
  SELECT 605 AS `hsk_source_id`, 111 AS `radical_id`, '短' AS `hanzi_char` UNION ALL
  SELECT 605 AS `hsk_source_id`, 151 AS `radical_id`, '短' AS `hanzi_char` UNION ALL
  SELECT 606 AS `hsk_source_id`, 111 AS `radical_id`, '短' AS `hanzi_char` UNION ALL
  SELECT 606 AS `hsk_source_id`, 151 AS `radical_id`, '短' AS `hanzi_char` UNION ALL
  SELECT 606 AS `hsk_source_id`, 53 AS `radical_id`, '裤' AS `hanzi_char` UNION ALL
  SELECT 606 AS `hsk_source_id`, 145 AS `radical_id`, '裤' AS `hanzi_char` UNION ALL
  SELECT 606 AS `hsk_source_id`, 159 AS `radical_id`, '裤' AS `hanzi_char` UNION ALL
  SELECT 607 AS `hsk_source_id`, 79 AS `radical_id`, '段' AS `hanzi_char` UNION ALL
  SELECT 608 AS `hsk_source_id`, 79 AS `radical_id`, '锻' AS `hanzi_char` UNION ALL
  SELECT 608 AS `hsk_source_id`, 167 AS `radical_id`, '锻' AS `hanzi_char` UNION ALL
  SELECT 608 AS `hsk_source_id`, 12 AS `radical_id`, '炼' AS `hanzi_char` UNION ALL
  SELECT 608 AS `hsk_source_id`, 30 AS `radical_id`, '炼' AS `hanzi_char` UNION ALL
  SELECT 608 AS `hsk_source_id`, 75 AS `radical_id`, '炼' AS `hanzi_char` UNION ALL
  SELECT 608 AS `hsk_source_id`, 86 AS `radical_id`, '炼' AS `hanzi_char` UNION ALL
  SELECT 609 AS `hsk_source_id`, 41 AS `radical_id`, '对' AS `hanzi_char` UNION ALL
  SELECT 609 AS `hsk_source_id`, 29 AS `radical_id`, '对' AS `hanzi_char` UNION ALL
  SELECT 609 AS `hsk_source_id`, 149 AS `radical_id`, '话' AS `hanzi_char` UNION ALL
  SELECT 609 AS `hsk_source_id`, 135 AS `radical_id`, '话' AS `hanzi_char` UNION ALL
  SELECT 611 AS `hsk_source_id`, 126 AS `radical_id`, '而' AS `hanzi_char` UNION ALL
  SELECT 611 AS `hsk_source_id`, 1 AS `radical_id`, '且' AS `hanzi_char` UNION ALL
  SELECT 611 AS `hsk_source_id`, 74 AS `radical_id`, '且' AS `hanzi_char` UNION ALL
  SELECT 612 AS `hsk_source_id`, 128 AS `radical_id`, '耳' AS `hanzi_char` UNION ALL
  SELECT 612 AS `hsk_source_id`, 16 AS `radical_id`, '朵' AS `hanzi_char` UNION ALL
  SELECT 612 AS `hsk_source_id`, 75 AS `radical_id`, '朵' AS `hanzi_char` UNION ALL
  SELECT 613 AS `hsk_source_id`, 128 AS `radical_id`, '耳' AS `hanzi_char` UNION ALL
  SELECT 613 AS `hsk_source_id`, 75 AS `radical_id`, '机' AS `hanzi_char` UNION ALL
  SELECT 613 AS `hsk_source_id`, 16 AS `radical_id`, '机' AS `hanzi_char` UNION ALL
  SELECT 614 AS `hsk_source_id`, 29 AS `radical_id`, '发' AS `hanzi_char` UNION ALL
  SELECT 615 AS `hsk_source_id`, 29 AS `radical_id`, '发' AS `hanzi_char` UNION ALL
  SELECT 615 AS `hsk_source_id`, 1 AS `radical_id`, '烧' AS `hanzi_char` UNION ALL
  SELECT 615 AS `hsk_source_id`, 10 AS `radical_id`, '烧' AS `hanzi_char` UNION ALL
  SELECT 615 AS `hsk_source_id`, 62 AS `radical_id`, '烧' AS `hanzi_char` UNION ALL
  SELECT 615 AS `hsk_source_id`, 86 AS `radical_id`, '烧' AS `hanzi_char` UNION ALL
  SELECT 616 AS `hsk_source_id`, 29 AS `radical_id`, '发' AS `hanzi_char` UNION ALL
  SELECT 616 AS `hsk_source_id`, 100 AS `radical_id`, '生' AS `hanzi_char` UNION ALL
  SELECT 617 AS `hsk_source_id`, 29 AS `radical_id`, '发' AS `hanzi_char` UNION ALL
  SELECT 617 AS `hsk_source_id`, 96 AS `radical_id`, '现' AS `hanzi_char` UNION ALL
  SELECT 617 AS `hsk_source_id`, 147 AS `radical_id`, '现' AS `hanzi_char` UNION ALL
  SELECT 618 AS `hsk_source_id`, 29 AS `radical_id`, '发' AS `hanzi_char` UNION ALL
  SELECT 618 AS `hsk_source_id`, 44 AS `radical_id`, '展' AS `hanzi_char` UNION ALL
  SELECT 618 AS `hsk_source_id`, 145 AS `radical_id`, '展' AS `hanzi_char` UNION ALL
  SELECT 619 AS `hsk_source_id`, 70 AS `radical_id`, '方' AS `hanzi_char` UNION ALL
  SELECT 619 AS `hsk_source_id`, 1 AS `radical_id`, '便' AS `hanzi_char` UNION ALL
  SELECT 619 AS `hsk_source_id`, 4 AS `radical_id`, '便' AS `hanzi_char` UNION ALL
  SELECT 619 AS `hsk_source_id`, 9 AS `radical_id`, '便' AS `hanzi_char` UNION ALL
  SELECT 619 AS `hsk_source_id`, 73 AS `radical_id`, '便' AS `hanzi_char` UNION ALL
  SELECT 620 AS `hsk_source_id`, 70 AS `radical_id`, '方' AS `hanzi_char` UNION ALL
  SELECT 620 AS `hsk_source_id`, 1 AS `radical_id`, '便' AS `hanzi_char` UNION ALL
  SELECT 620 AS `hsk_source_id`, 4 AS `radical_id`, '便' AS `hanzi_char` UNION ALL
  SELECT 620 AS `hsk_source_id`, 9 AS `radical_id`, '便' AS `hanzi_char` UNION ALL
  SELECT 620 AS `hsk_source_id`, 73 AS `radical_id`, '便' AS `hanzi_char` UNION ALL
  SELECT 620 AS `hsk_source_id`, 176 AS `radical_id`, '面' AS `hanzi_char` UNION ALL
  SELECT 621 AS `hsk_source_id`, 70 AS `radical_id`, '方' AS `hanzi_char` UNION ALL
  SELECT 621 AS `hsk_source_id`, 28 AS `radical_id`, '法' AS `hanzi_char` UNION ALL
  SELECT 621 AS `hsk_source_id`, 32 AS `radical_id`, '法' AS `hanzi_char` UNION ALL
  SELECT 621 AS `hsk_source_id`, 85 AS `radical_id`, '法' AS `hanzi_char` UNION ALL
  SELECT 622 AS `hsk_source_id`, 70 AS `radical_id`, '方' AS `hanzi_char` UNION ALL
  SELECT 622 AS `hsk_source_id`, 30 AS `radical_id`, '向' AS `hanzi_char` UNION ALL
  SELECT 626 AS `hsk_source_id`, 66 AS `radical_id`, '放' AS `hanzi_char` UNION ALL
  SELECT 626 AS `hsk_source_id`, 70 AS `radical_id`, '放' AS `hanzi_char` UNION ALL
  SELECT 626 AS `hsk_source_id`, 61 AS `radical_id`, '心' AS `hanzi_char` UNION ALL
  SELECT 628 AS `hsk_source_id`, 18 AS `radical_id`, '分' AS `hanzi_char` UNION ALL
  SELECT 628 AS `hsk_source_id`, 12 AS `radical_id`, '分' AS `hanzi_char` UNION ALL
  SELECT 628 AS `hsk_source_id`, 55 AS `radical_id`, '开' AS `hanzi_char` UNION ALL
  SELECT 628 AS `hsk_source_id`, 1 AS `radical_id`, '开' AS `hanzi_char` UNION ALL
  SELECT 630 AS `hsk_source_id`, 32 AS `radical_id`, '封' AS `hanzi_char` UNION ALL
  SELECT 630 AS `hsk_source_id`, 41 AS `radical_id`, '封' AS `hanzi_char` UNION ALL
  SELECT 631 AS `hsk_source_id`, 1 AS `radical_id`, '夫' AS `hanzi_char` UNION ALL
  SELECT 631 AS `hsk_source_id`, 37 AS `radical_id`, '夫' AS `hanzi_char` UNION ALL
  SELECT 631 AS `hsk_source_id`, 24 AS `radical_id`, '妻' AS `hanzi_char` UNION ALL
  SELECT 631 AS `hsk_source_id`, 38 AS `radical_id`, '妻' AS `hanzi_char` UNION ALL
  SELECT 631 AS `hsk_source_id`, 58 AS `radical_id`, '妻' AS `hanzi_char` UNION ALL
  SELECT 632 AS `hsk_source_id`, 74 AS `radical_id`, '服' AS `hanzi_char` UNION ALL
  SELECT 632 AS `hsk_source_id`, 26 AS `radical_id`, '服' AS `hanzi_char` UNION ALL
  SELECT 632 AS `hsk_source_id`, 29 AS `radical_id`, '服' AS `hanzi_char` UNION ALL
  SELECT 632 AS `hsk_source_id`, 19 AS `radical_id`, '务' AS `hanzi_char` UNION ALL
  SELECT 632 AS `hsk_source_id`, 34 AS `radical_id`, '务' AS `hanzi_char` UNION ALL
  SELECT 633 AS `hsk_source_id`, 9 AS `radical_id`, '附' AS `hanzi_char` UNION ALL
  SELECT 633 AS `hsk_source_id`, 41 AS `radical_id`, '附' AS `hanzi_char` UNION ALL
  SELECT 633 AS `hsk_source_id`, 170 AS `radical_id`, '附' AS `hanzi_char` UNION ALL
  SELECT 633 AS `hsk_source_id`, 69 AS `radical_id`, '近' AS `hanzi_char` UNION ALL
  SELECT 633 AS `hsk_source_id`, 162 AS `radical_id`, '近' AS `hanzi_char` UNION ALL
  SELECT 634 AS `hsk_source_id`, 9 AS `radical_id`, '复' AS `hanzi_char` UNION ALL
  SELECT 634 AS `hsk_source_id`, 34 AS `radical_id`, '复' AS `hanzi_char` UNION ALL
  SELECT 634 AS `hsk_source_id`, 35 AS `radical_id`, '复' AS `hanzi_char` UNION ALL
  SELECT 634 AS `hsk_source_id`, 72 AS `radical_id`, '复' AS `hanzi_char` UNION ALL
  SELECT 634 AS `hsk_source_id`, 15 AS `radical_id`, '习' AS `hanzi_char` UNION ALL
  SELECT 635 AS `hsk_source_id`, 8 AS `radical_id`, '该' AS `hanzi_char` UNION ALL
  SELECT 635 AS `hsk_source_id`, 149 AS `radical_id`, '该' AS `hanzi_char` UNION ALL
  SELECT 637 AS `hsk_source_id`, 1 AS `radical_id`, '感' AS `hanzi_char` UNION ALL
  SELECT 637 AS `hsk_source_id`, 4 AS `radical_id`, '感' AS `hanzi_char` UNION ALL
  SELECT 637 AS `hsk_source_id`, 30 AS `radical_id`, '感' AS `hanzi_char` UNION ALL
  SELECT 637 AS `hsk_source_id`, 61 AS `radical_id`, '感' AS `hanzi_char` UNION ALL
  SELECT 637 AS `hsk_source_id`, 62 AS `radical_id`, '感' AS `hanzi_char` UNION ALL
  SELECT 637 AS `hsk_source_id`, 12 AS `radical_id`, '兴' AS `hanzi_char` UNION ALL
  SELECT 637 AS `hsk_source_id`, 42 AS `radical_id`, '兴' AS `hanzi_char` UNION ALL
  SELECT 637 AS `hsk_source_id`, 29 AS `radical_id`, '趣' AS `hanzi_char` UNION ALL
  SELECT 637 AS `hsk_source_id`, 128 AS `radical_id`, '趣' AS `hanzi_char` UNION ALL
  SELECT 637 AS `hsk_source_id`, 156 AS `radical_id`, '趣' AS `hanzi_char` UNION ALL
  SELECT 638 AS `hsk_source_id`, 1 AS `radical_id`, '感' AS `hanzi_char` UNION ALL
  SELECT 638 AS `hsk_source_id`, 4 AS `radical_id`, '感' AS `hanzi_char` UNION ALL
  SELECT 638 AS `hsk_source_id`, 30 AS `radical_id`, '感' AS `hanzi_char` UNION ALL
  SELECT 638 AS `hsk_source_id`, 61 AS `radical_id`, '感' AS `hanzi_char` UNION ALL
  SELECT 638 AS `hsk_source_id`, 62 AS `radical_id`, '感' AS `hanzi_char` UNION ALL
  SELECT 638 AS `hsk_source_id`, 18 AS `radical_id`, '到' AS `hanzi_char` UNION ALL
  SELECT 638 AS `hsk_source_id`, 133 AS `radical_id`, '到' AS `hanzi_char` UNION ALL
  SELECT 639 AS `hsk_source_id`, 1 AS `radical_id`, '感' AS `hanzi_char` UNION ALL
  SELECT 639 AS `hsk_source_id`, 4 AS `radical_id`, '感' AS `hanzi_char` UNION ALL
  SELECT 639 AS `hsk_source_id`, 30 AS `radical_id`, '感' AS `hanzi_char` UNION ALL
  SELECT 639 AS `hsk_source_id`, 61 AS `radical_id`, '感' AS `hanzi_char` UNION ALL
  SELECT 639 AS `hsk_source_id`, 62 AS `radical_id`, '感' AS `hanzi_char` UNION ALL
  SELECT 639 AS `hsk_source_id`, 13 AS `radical_id`, '冒' AS `hanzi_char` UNION ALL
  SELECT 639 AS `hsk_source_id`, 72 AS `radical_id`, '冒' AS `hanzi_char` UNION ALL
  SELECT 639 AS `hsk_source_id`, 109 AS `radical_id`, '冒' AS `hanzi_char` UNION ALL
  SELECT 641 AS `hsk_source_id`, 4 AS `radical_id`, '刚' AS `hanzi_char` UNION ALL
  SELECT 641 AS `hsk_source_id`, 13 AS `radical_id`, '刚' AS `hanzi_char` UNION ALL
  SELECT 641 AS `hsk_source_id`, 18 AS `radical_id`, '刚' AS `hanzi_char` UNION ALL
  SELECT 642 AS `hsk_source_id`, 4 AS `radical_id`, '刚' AS `hanzi_char` UNION ALL
  SELECT 642 AS `hsk_source_id`, 13 AS `radical_id`, '刚' AS `hanzi_char` UNION ALL
  SELECT 642 AS `hsk_source_id`, 18 AS `radical_id`, '刚' AS `hanzi_char` UNION ALL
  SELECT 642 AS `hsk_source_id`, 64 AS `radical_id`, '才' AS `hanzi_char` UNION ALL
  SELECT 643 AS `hsk_source_id`, 4 AS `radical_id`, '刚' AS `hanzi_char` UNION ALL
  SELECT 643 AS `hsk_source_id`, 13 AS `radical_id`, '刚' AS `hanzi_char` UNION ALL
  SELECT 643 AS `hsk_source_id`, 18 AS `radical_id`, '刚' AS `hanzi_char` UNION ALL
  SELECT 644 AS `hsk_source_id`, 189 AS `radical_id`, '高' AS `hanzi_char` UNION ALL
  SELECT 644 AS `hsk_source_id`, 1 AS `radical_id`, '铁' AS `hanzi_char` UNION ALL
  SELECT 644 AS `hsk_source_id`, 4 AS `radical_id`, '铁' AS `hanzi_char` UNION ALL
  SELECT 644 AS `hsk_source_id`, 37 AS `radical_id`, '铁' AS `hanzi_char` UNION ALL
  SELECT 644 AS `hsk_source_id`, 167 AS `radical_id`, '铁' AS `hanzi_char` UNION ALL
  SELECT 645 AS `hsk_source_id`, 75 AS `radical_id`, '根' AS `hanzi_char` UNION ALL
  SELECT 645 AS `hsk_source_id`, 138 AS `radical_id`, '根' AS `hanzi_char` UNION ALL
  SELECT 645 AS `hsk_source_id`, 24 AS `radical_id`, '据' AS `hanzi_char` UNION ALL
  SELECT 645 AS `hsk_source_id`, 30 AS `radical_id`, '据' AS `hanzi_char` UNION ALL
  SELECT 645 AS `hsk_source_id`, 63 AS `radical_id`, '据' AS `hanzi_char` UNION ALL
  SELECT 645 AS `hsk_source_id`, 64 AS `radical_id`, '据' AS `hanzi_char` UNION ALL
  SELECT 646 AS `hsk_source_id`, 1 AS `radical_id`, '更' AS `hanzi_char` UNION ALL
  SELECT 646 AS `hsk_source_id`, 4 AS `radical_id`, '更' AS `hanzi_char` UNION ALL
  SELECT 646 AS `hsk_source_id`, 73 AS `radical_id`, '更' AS `hanzi_char` UNION ALL
  SELECT 647 AS `hsk_source_id`, 12 AS `radical_id`, '公' AS `hanzi_char` UNION ALL
  SELECT 647 AS `hsk_source_id`, 28 AS `radical_id`, '公' AS `hanzi_char` UNION ALL
  SELECT 647 AS `hsk_source_id`, 69 AS `radical_id`, '斤' AS `hanzi_char` UNION ALL
  SELECT 648 AS `hsk_source_id`, 12 AS `radical_id`, '公' AS `hanzi_char` UNION ALL
  SELECT 648 AS `hsk_source_id`, 28 AS `radical_id`, '公' AS `hanzi_char` UNION ALL
  SELECT 648 AS `hsk_source_id`, 7 AS `radical_id`, '园' AS `hanzi_char` UNION ALL
  SELECT 648 AS `hsk_source_id`, 10 AS `radical_id`, '园' AS `hanzi_char` UNION ALL
  SELECT 648 AS `hsk_source_id`, 31 AS `radical_id`, '园' AS `hanzi_char` UNION ALL
  SELECT 649 AS `hsk_source_id`, 48 AS `radical_id`, '工' AS `hanzi_char` UNION ALL
  SELECT 649 AS `hsk_source_id`, 9 AS `radical_id`, '作' AS `hanzi_char` UNION ALL
  SELECT 649 AS `hsk_source_id`, 4 AS `radical_id`, '作' AS `hanzi_char` UNION ALL
  SELECT 649 AS `hsk_source_id`, 1 AS `radical_id`, '作' AS `hanzi_char` UNION ALL
  SELECT 649 AS `hsk_source_id`, 72 AS `radical_id`, '日' AS `hanzi_char` UNION ALL
  SELECT 650 AS `hsk_source_id`, 24 AS `radical_id`, '故' AS `hanzi_char` UNION ALL
  SELECT 650 AS `hsk_source_id`, 30 AS `radical_id`, '故' AS `hanzi_char` UNION ALL
  SELECT 650 AS `hsk_source_id`, 66 AS `radical_id`, '故' AS `hanzi_char` UNION ALL
  SELECT 650 AS `hsk_source_id`, 6 AS `radical_id`, '事' AS `hanzi_char` UNION ALL
  SELECT 650 AS `hsk_source_id`, 1 AS `radical_id`, '事' AS `hanzi_char` UNION ALL
  SELECT 650 AS `hsk_source_id`, 58 AS `radical_id`, '事' AS `hanzi_char` UNION ALL
  SELECT 651 AS `hsk_source_id`, 18 AS `radical_id`, '刮' AS `hanzi_char` UNION ALL
  SELECT 651 AS `hsk_source_id`, 135 AS `radical_id`, '刮' AS `hanzi_char` UNION ALL
  SELECT 653 AS `hsk_source_id`, 12 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 653 AS `hsk_source_id`, 37 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 653 AS `hsk_source_id`, 1 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 653 AS `hsk_source_id`, 75 AS `radical_id`, '机' AS `hanzi_char` UNION ALL
  SELECT 653 AS `hsk_source_id`, 16 AS `radical_id`, '机' AS `hanzi_char` UNION ALL
  SELECT 654 AS `hsk_source_id`, 12 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 654 AS `hsk_source_id`, 37 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 654 AS `hsk_source_id`, 1 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 654 AS `hsk_source_id`, 120 AS `radical_id`, '系' AS `hanzi_char` UNION ALL
  SELECT 654 AS `hsk_source_id`, 4 AS `radical_id`, '系' AS `hanzi_char` UNION ALL
  SELECT 655 AS `hsk_source_id`, 12 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 655 AS `hsk_source_id`, 37 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 655 AS `hsk_source_id`, 1 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 655 AS `hsk_source_id`, 61 AS `radical_id`, '心' AS `hanzi_char` UNION ALL
  SELECT 656 AS `hsk_source_id`, 12 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 656 AS `hsk_source_id`, 37 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 656 AS `hsk_source_id`, 1 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 656 AS `hsk_source_id`, 6 AS `radical_id`, '于' AS `hanzi_char` UNION ALL
  SELECT 656 AS `hsk_source_id`, 7 AS `radical_id`, '于' AS `hanzi_char` UNION ALL
  SELECT 657 AS `hsk_source_id`, 12 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 657 AS `hsk_source_id`, 37 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 657 AS `hsk_source_id`, 1 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 657 AS `hsk_source_id`, 3 AS `radical_id`, '注' AS `hanzi_char` UNION ALL
  SELECT 657 AS `hsk_source_id`, 85 AS `radical_id`, '注' AS `hanzi_char` UNION ALL
  SELECT 657 AS `hsk_source_id`, 96 AS `radical_id`, '注' AS `hanzi_char` UNION ALL
  SELECT 659 AS `hsk_source_id`, 162 AS `radical_id`, '过' AS `hanzi_char` UNION ALL
  SELECT 659 AS `hsk_source_id`, 41 AS `radical_id`, '过' AS `hanzi_char` UNION ALL
  SELECT 659 AS `hsk_source_id`, 140 AS `radical_id`, '节' AS `hanzi_char` UNION ALL
  SELECT 660 AS `hsk_source_id`, 162 AS `radical_id`, '过' AS `hanzi_char` UNION ALL
  SELECT 660 AS `hsk_source_id`, 41 AS `radical_id`, '过' AS `hanzi_char` UNION ALL
  SELECT 660 AS `hsk_source_id`, 28 AS `radical_id`, '去' AS `hanzi_char` UNION ALL
  SELECT 660 AS `hsk_source_id`, 32 AS `radical_id`, '去' AS `hanzi_char` UNION ALL
  SELECT 661 AS `hsk_source_id`, 80 AS `radical_id`, '海' AS `hanzi_char` UNION ALL
  SELECT 661 AS `hsk_source_id`, 85 AS `radical_id`, '海' AS `hanzi_char` UNION ALL
  SELECT 662 AS `hsk_source_id`, 1 AS `radical_id`, '害' AS `hanzi_char` UNION ALL
  SELECT 662 AS `hsk_source_id`, 2 AS `radical_id`, '害' AS `hanzi_char` UNION ALL
  SELECT 662 AS `hsk_source_id`, 7 AS `radical_id`, '害' AS `hanzi_char` UNION ALL
  SELECT 662 AS `hsk_source_id`, 30 AS `radical_id`, '害' AS `hanzi_char` UNION ALL
  SELECT 662 AS `hsk_source_id`, 40 AS `radical_id`, '害' AS `hanzi_char` UNION ALL
  SELECT 662 AS `hsk_source_id`, 61 AS `radical_id`, '怕' AS `hanzi_char` UNION ALL
  SELECT 662 AS `hsk_source_id`, 106 AS `radical_id`, '怕' AS `hanzi_char` UNION ALL
  SELECT 663 AS `hsk_source_id`, 38 AS `radical_id`, '好' AS `hanzi_char` UNION ALL
  SELECT 663 AS `hsk_source_id`, 39 AS `radical_id`, '好' AS `hanzi_char` UNION ALL
  SELECT 663 AS `hsk_source_id`, 36 AS `radical_id`, '多' AS `hanzi_char` UNION ALL
  SELECT 664 AS `hsk_source_id`, 38 AS `radical_id`, '好' AS `hanzi_char` UNION ALL
  SELECT 664 AS `hsk_source_id`, 39 AS `radical_id`, '好' AS `hanzi_char` UNION ALL
  SELECT 664 AS `hsk_source_id`, 4 AS `radical_id`, '久' AS `hanzi_char` UNION ALL
  SELECT 664 AS `hsk_source_id`, 20 AS `radical_id`, '久' AS `hanzi_char` UNION ALL
  SELECT 665 AS `hsk_source_id`, 38 AS `radical_id`, '好' AS `hanzi_char` UNION ALL
  SELECT 665 AS `hsk_source_id`, 39 AS `radical_id`, '好' AS `hanzi_char` UNION ALL
  SELECT 665 AS `hsk_source_id`, 9 AS `radical_id`, '像' AS `hanzi_char` UNION ALL
  SELECT 665 AS `hsk_source_id`, 18 AS `radical_id`, '像' AS `hanzi_char` UNION ALL
  SELECT 665 AS `hsk_source_id`, 30 AS `radical_id`, '像' AS `hanzi_char` UNION ALL
  SELECT 665 AS `hsk_source_id`, 152 AS `radical_id`, '像' AS `hanzi_char` UNION ALL
  SELECT 666 AS `hsk_source_id`, 30 AS `radical_id`, '号' AS `hanzi_char` UNION ALL
  SELECT 666 AS `hsk_source_id`, 1 AS `radical_id`, '号' AS `hanzi_char` UNION ALL
  SELECT 666 AS `hsk_source_id`, 112 AS `radical_id`, '码' AS `hanzi_char` UNION ALL
  SELECT 666 AS `hsk_source_id`, 187 AS `radical_id`, '码' AS `hanzi_char` UNION ALL
  SELECT 667 AS `hsk_source_id`, 1 AS `radical_id`, '河' AS `hanzi_char` UNION ALL
  SELECT 667 AS `hsk_source_id`, 30 AS `radical_id`, '河' AS `hanzi_char` UNION ALL
  SELECT 667 AS `hsk_source_id`, 85 AS `radical_id`, '河' AS `hanzi_char` UNION ALL
  SELECT 668 AS `hsk_source_id`, 1 AS `radical_id`, '合' AS `hanzi_char` UNION ALL
  SELECT 668 AS `hsk_source_id`, 9 AS `radical_id`, '合' AS `hanzi_char` UNION ALL
  SELECT 668 AS `hsk_source_id`, 30 AS `radical_id`, '合' AS `hanzi_char` UNION ALL
  SELECT 668 AS `hsk_source_id`, 135 AS `radical_id`, '适' AS `hanzi_char` UNION ALL
  SELECT 668 AS `hsk_source_id`, 162 AS `radical_id`, '适' AS `hanzi_char` UNION ALL
  SELECT 669 AS `hsk_source_id`, 203 AS `radical_id`, '黑' AS `hanzi_char` UNION ALL
  SELECT 669 AS `hsk_source_id`, 27 AS `radical_id`, '板' AS `hanzi_char` UNION ALL
  SELECT 669 AS `hsk_source_id`, 29 AS `radical_id`, '板' AS `hanzi_char` UNION ALL
  SELECT 669 AS `hsk_source_id`, 75 AS `radical_id`, '板' AS `hanzi_char` UNION ALL
  SELECT 670 AS `hsk_source_id`, 48 AS `radical_id`, '红' AS `hanzi_char` UNION ALL
  SELECT 670 AS `hsk_source_id`, 120 AS `radical_id`, '红' AS `hanzi_char` UNION ALL
  SELECT 670 AS `hsk_source_id`, 58 AS `radical_id`, '绿' AS `hanzi_char` UNION ALL
  SELECT 670 AS `hsk_source_id`, 85 AS `radical_id`, '绿' AS `hanzi_char` UNION ALL
  SELECT 670 AS `hsk_source_id`, 1 AS `radical_id`, '灯' AS `hanzi_char` UNION ALL
  SELECT 670 AS `hsk_source_id`, 86 AS `radical_id`, '灯' AS `hanzi_char` UNION ALL
  SELECT 671 AS `hsk_source_id`, 30 AS `radical_id`, '后' AS `hanzi_char` UNION ALL
  SELECT 671 AS `hsk_source_id`, 75 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 671 AS `hsk_source_id`, 1 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 671 AS `hsk_source_id`, 12 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 672 AS `hsk_source_id`, 30 AS `radical_id`, '后' AS `hanzi_char` UNION ALL
  SELECT 672 AS `hsk_source_id`, 51 AS `radical_id`, '年' AS `hanzi_char` UNION ALL
  SELECT 674 AS `hsk_source_id`, 63 AS `radical_id`, '护' AS `hanzi_char` UNION ALL
  SELECT 674 AS `hsk_source_id`, 64 AS `radical_id`, '护' AS `hanzi_char` UNION ALL
  SELECT 674 AS `hsk_source_id`, 18 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 674 AS `hsk_source_id`, 30 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 674 AS `hsk_source_id`, 72 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 674 AS `hsk_source_id`, 86 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 675 AS `hsk_source_id`, 140 AS `radical_id`, '花' AS `hanzi_char` UNION ALL
  SELECT 675 AS `hsk_source_id`, 21 AS `radical_id`, '花' AS `hanzi_char` UNION ALL
  SELECT 675 AS `hsk_source_id`, 9 AS `radical_id`, '花' AS `hanzi_char` UNION ALL
  SELECT 675 AS `hsk_source_id`, 7 AS `radical_id`, '园' AS `hanzi_char` UNION ALL
  SELECT 675 AS `hsk_source_id`, 10 AS `radical_id`, '园' AS `hanzi_char` UNION ALL
  SELECT 675 AS `hsk_source_id`, 31 AS `radical_id`, '园' AS `hanzi_char` UNION ALL
  SELECT 676 AS `hsk_source_id`, 1 AS `radical_id`, '画' AS `hanzi_char` UNION ALL
  SELECT 676 AS `hsk_source_id`, 17 AS `radical_id`, '画' AS `hanzi_char` UNION ALL
  SELECT 676 AS `hsk_source_id`, 102 AS `radical_id`, '画' AS `hanzi_char` UNION ALL
  SELECT 676 AS `hsk_source_id`, 40 AS `radical_id`, '家' AS `hanzi_char` UNION ALL
  SELECT 676 AS `hsk_source_id`, 152 AS `radical_id`, '家' AS `hanzi_char` UNION ALL
  SELECT 677 AS `hsk_source_id`, 76 AS `radical_id`, '欢' AS `hanzi_char` UNION ALL
  SELECT 677 AS `hsk_source_id`, 29 AS `radical_id`, '欢' AS `hanzi_char` UNION ALL
  SELECT 677 AS `hsk_source_id`, 21 AS `radical_id`, '迎' AS `hanzi_char` UNION ALL
  SELECT 677 AS `hsk_source_id`, 26 AS `radical_id`, '迎' AS `hanzi_char` UNION ALL
  SELECT 677 AS `hsk_source_id`, 162 AS `radical_id`, '迎' AS `hanzi_char` UNION ALL
  SELECT 679 AS `hsk_source_id`, 1 AS `radical_id`, '环' AS `hanzi_char` UNION ALL
  SELECT 679 AS `hsk_source_id`, 96 AS `radical_id`, '环' AS `hanzi_char` UNION ALL
  SELECT 679 AS `hsk_source_id`, 10 AS `radical_id`, '境' AS `hanzi_char` UNION ALL
  SELECT 679 AS `hsk_source_id`, 32 AS `radical_id`, '境' AS `hanzi_char` UNION ALL
  SELECT 679 AS `hsk_source_id`, 117 AS `radical_id`, '境' AS `hanzi_char` UNION ALL
  SELECT 679 AS `hsk_source_id`, 180 AS `radical_id`, '境' AS `hanzi_char` UNION ALL
  SELECT 680 AS `hsk_source_id`, 13 AS `radical_id`, '换' AS `hanzi_char` UNION ALL
  SELECT 680 AS `hsk_source_id`, 18 AS `radical_id`, '换' AS `hanzi_char` UNION ALL
  SELECT 680 AS `hsk_source_id`, 37 AS `radical_id`, '换' AS `hanzi_char` UNION ALL
  SELECT 680 AS `hsk_source_id`, 64 AS `radical_id`, '换' AS `hanzi_char` UNION ALL
  SELECT 681 AS `hsk_source_id`, 201 AS `radical_id`, '黄' AS `hanzi_char` UNION ALL
  SELECT 681 AS `hsk_source_id`, 139 AS `radical_id`, '色' AS `hanzi_char` UNION ALL
  SELECT 683 AS `hsk_source_id`, 9 AS `radical_id`, '会' AS `hanzi_char` UNION ALL
  SELECT 683 AS `hsk_source_id`, 7 AS `radical_id`, '会' AS `hanzi_char` UNION ALL
  SELECT 683 AS `hsk_source_id`, 28 AS `radical_id`, '会' AS `hanzi_char` UNION ALL
  SELECT 684 AS `hsk_source_id`, 9 AS `radical_id`, '会' AS `hanzi_char` UNION ALL
  SELECT 684 AS `hsk_source_id`, 7 AS `radical_id`, '会' AS `hanzi_char` UNION ALL
  SELECT 684 AS `hsk_source_id`, 28 AS `radical_id`, '会' AS `hanzi_char` UNION ALL
  SELECT 684 AS `hsk_source_id`, 3 AS `radical_id`, '议' AS `hanzi_char` UNION ALL
  SELECT 684 AS `hsk_source_id`, 4 AS `radical_id`, '议' AS `hanzi_char` UNION ALL
  SELECT 684 AS `hsk_source_id`, 149 AS `radical_id`, '议' AS `hanzi_char` UNION ALL
  SELECT 685 AS `hsk_source_id`, 1 AS `radical_id`, '或' AS `hanzi_char` UNION ALL
  SELECT 685 AS `hsk_source_id`, 30 AS `radical_id`, '或' AS `hanzi_char` UNION ALL
  SELECT 685 AS `hsk_source_id`, 62 AS `radical_id`, '或' AS `hanzi_char` UNION ALL
  SELECT 686 AS `hsk_source_id`, 1 AS `radical_id`, '或' AS `hanzi_char` UNION ALL
  SELECT 686 AS `hsk_source_id`, 30 AS `radical_id`, '或' AS `hanzi_char` UNION ALL
  SELECT 686 AS `hsk_source_id`, 62 AS `radical_id`, '或' AS `hanzi_char` UNION ALL
  SELECT 686 AS `hsk_source_id`, 72 AS `radical_id`, '者' AS `hanzi_char` UNION ALL
  SELECT 686 AS `hsk_source_id`, 125 AS `radical_id`, '者' AS `hanzi_char` UNION ALL
  SELECT 687 AS `hsk_source_id`, 196 AS `radical_id`, '鸡' AS `hanzi_char` UNION ALL
  SELECT 687 AS `hsk_source_id`, 29 AS `radical_id`, '鸡' AS `hanzi_char` UNION ALL
  SELECT 688 AS `hsk_source_id`, 16 AS `radical_id`, '几' AS `hanzi_char` UNION ALL
  SELECT 688 AS `hsk_source_id`, 3 AS `radical_id`, '乎' AS `hanzi_char` UNION ALL
  SELECT 688 AS `hsk_source_id`, 4 AS `radical_id`, '乎' AS `hanzi_char` UNION ALL
  SELECT 689 AS `hsk_source_id`, 75 AS `radical_id`, '机' AS `hanzi_char` UNION ALL
  SELECT 689 AS `hsk_source_id`, 16 AS `radical_id`, '机' AS `hanzi_char` UNION ALL
  SELECT 689 AS `hsk_source_id`, 9 AS `radical_id`, '会' AS `hanzi_char` UNION ALL
  SELECT 689 AS `hsk_source_id`, 7 AS `radical_id`, '会' AS `hanzi_char` UNION ALL
  SELECT 689 AS `hsk_source_id`, 28 AS `radical_id`, '会' AS `hanzi_char` UNION ALL
  SELECT 690 AS `hsk_source_id`, 29 AS `radical_id`, '极' AS `hanzi_char` UNION ALL
  SELECT 690 AS `hsk_source_id`, 75 AS `radical_id`, '极' AS `hanzi_char` UNION ALL
  SELECT 691 AS `hsk_source_id`, 18 AS `radical_id`, '急' AS `hanzi_char` UNION ALL
  SELECT 691 AS `hsk_source_id`, 58 AS `radical_id`, '急' AS `hanzi_char` UNION ALL
  SELECT 691 AS `hsk_source_id`, 61 AS `radical_id`, '急' AS `hanzi_char` UNION ALL
  SELECT 693 AS `hsk_source_id`, 39 AS `radical_id`, '季' AS `hanzi_char` UNION ALL
  SELECT 693 AS `hsk_source_id`, 115 AS `radical_id`, '季' AS `hanzi_char` UNION ALL
  SELECT 694 AS `hsk_source_id`, 39 AS `radical_id`, '季' AS `hanzi_char` UNION ALL
  SELECT 694 AS `hsk_source_id`, 115 AS `radical_id`, '季' AS `hanzi_char`
) m
JOIN `VOCABULARY` v ON v.`hsk_source_id` = m.`hsk_source_id`;

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`)
SELECT v.`vocab_id`, m.`radical_id`, m.`hanzi_char`
FROM (
  SELECT 694 AS `hsk_source_id`, 140 AS `radical_id`, '节' AS `hanzi_char` UNION ALL
  SELECT 695 AS `hsk_source_id`, 19 AS `radical_id`, '加' AS `hanzi_char` UNION ALL
  SELECT 695 AS `hsk_source_id`, 30 AS `radical_id`, '加' AS `hanzi_char` UNION ALL
  SELECT 696 AS `hsk_source_id`, 9 AS `radical_id`, '假' AS `hanzi_char` UNION ALL
  SELECT 696 AS `hsk_source_id`, 29 AS `radical_id`, '假' AS `hanzi_char` UNION ALL
  SELECT 696 AS `hsk_source_id`, 74 AS `radical_id`, '期' AS `hanzi_char` UNION ALL
  SELECT 696 AS `hsk_source_id`, 12 AS `radical_id`, '期' AS `hanzi_char` UNION ALL
  SELECT 696 AS `hsk_source_id`, 99 AS `radical_id`, '期' AS `hanzi_char` UNION ALL
  SELECT 696 AS `hsk_source_id`, 1 AS `radical_id`, '期' AS `hanzi_char` UNION ALL
  SELECT 697 AS `hsk_source_id`, 29 AS `radical_id`, '坚' AS `hanzi_char` UNION ALL
  SELECT 697 AS `hsk_source_id`, 32 AS `radical_id`, '坚' AS `hanzi_char` UNION ALL
  SELECT 697 AS `hsk_source_id`, 41 AS `radical_id`, '持' AS `hanzi_char` UNION ALL
  SELECT 697 AS `hsk_source_id`, 64 AS `radical_id`, '持' AS `hanzi_char` UNION ALL
  SELECT 698 AS `hsk_source_id`, 1 AS `radical_id`, '检' AS `hanzi_char` UNION ALL
  SELECT 698 AS `hsk_source_id`, 9 AS `radical_id`, '检' AS `hanzi_char` UNION ALL
  SELECT 698 AS `hsk_source_id`, 42 AS `radical_id`, '检' AS `hanzi_char` UNION ALL
  SELECT 698 AS `hsk_source_id`, 75 AS `radical_id`, '检' AS `hanzi_char` UNION ALL
  SELECT 698 AS `hsk_source_id`, 72 AS `radical_id`, '查' AS `hanzi_char` UNION ALL
  SELECT 699 AS `hsk_source_id`, 72 AS `radical_id`, '简' AS `hanzi_char` UNION ALL
  SELECT 699 AS `hsk_source_id`, 118 AS `radical_id`, '简' AS `hanzi_char` UNION ALL
  SELECT 699 AS `hsk_source_id`, 169 AS `radical_id`, '简' AS `hanzi_char` UNION ALL
  SELECT 699 AS `hsk_source_id`, 3 AS `radical_id`, '单' AS `hanzi_char` UNION ALL
  SELECT 700 AS `hsk_source_id`, 1 AS `radical_id`, '检' AS `hanzi_char` UNION ALL
  SELECT 700 AS `hsk_source_id`, 9 AS `radical_id`, '检' AS `hanzi_char` UNION ALL
  SELECT 700 AS `hsk_source_id`, 42 AS `radical_id`, '检' AS `hanzi_char` UNION ALL
  SELECT 700 AS `hsk_source_id`, 75 AS `radical_id`, '检' AS `hanzi_char` UNION ALL
  SELECT 700 AS `hsk_source_id`, 113 AS `radical_id`, '票' AS `hanzi_char` UNION ALL
  SELECT 700 AS `hsk_source_id`, 146 AS `radical_id`, '票' AS `hanzi_char` UNION ALL
  SELECT 701 AS `hsk_source_id`, 9 AS `radical_id`, '健' AS `hanzi_char` UNION ALL
  SELECT 701 AS `hsk_source_id`, 54 AS `radical_id`, '健' AS `hanzi_char` UNION ALL
  SELECT 701 AS `hsk_source_id`, 129 AS `radical_id`, '健' AS `hanzi_char` UNION ALL
  SELECT 701 AS `hsk_source_id`, 53 AS `radical_id`, '康' AS `hanzi_char` UNION ALL
  SELECT 701 AS `hsk_source_id`, 171 AS `radical_id`, '康' AS `hanzi_char` UNION ALL
  SELECT 703 AS `hsk_source_id`, 7 AS `radical_id`, '讲' AS `hanzi_char` UNION ALL
  SELECT 703 AS `hsk_source_id`, 149 AS `radical_id`, '讲' AS `hanzi_char` UNION ALL
  SELECT 704 AS `hsk_source_id`, 148 AS `radical_id`, '角' AS `hanzi_char` UNION ALL
  SELECT 705 AS `hsk_source_id`, 26 AS `radical_id`, '脚' AS `hanzi_char` UNION ALL
  SELECT 705 AS `hsk_source_id`, 28 AS `radical_id`, '脚' AS `hanzi_char` UNION ALL
  SELECT 705 AS `hsk_source_id`, 32 AS `radical_id`, '脚' AS `hanzi_char` UNION ALL
  SELECT 705 AS `hsk_source_id`, 130 AS `radical_id`, '脚' AS `hanzi_char` UNION ALL
  SELECT 706 AS `hsk_source_id`, 38 AS `radical_id`, '接' AS `hanzi_char` UNION ALL
  SELECT 706 AS `hsk_source_id`, 64 AS `radical_id`, '接' AS `hanzi_char` UNION ALL
  SELECT 706 AS `hsk_source_id`, 160 AS `radical_id`, '接' AS `hanzi_char` UNION ALL
  SELECT 707 AS `hsk_source_id`, 32 AS `radical_id`, '街' AS `hanzi_char` UNION ALL
  SELECT 707 AS `hsk_source_id`, 144 AS `radical_id`, '街' AS `hanzi_char` UNION ALL
  SELECT 708 AS `hsk_source_id`, 140 AS `radical_id`, '节' AS `hanzi_char` UNION ALL
  SELECT 709 AS `hsk_source_id`, 30 AS `radical_id`, '结' AS `hanzi_char` UNION ALL
  SELECT 709 AS `hsk_source_id`, 33 AS `radical_id`, '结' AS `hanzi_char` UNION ALL
  SELECT 709 AS `hsk_source_id`, 120 AS `radical_id`, '结' AS `hanzi_char` UNION ALL
  SELECT 709 AS `hsk_source_id`, 38 AS `radical_id`, '婚' AS `hanzi_char` UNION ALL
  SELECT 709 AS `hsk_source_id`, 72 AS `radical_id`, '婚' AS `hanzi_char` UNION ALL
  SELECT 709 AS `hsk_source_id`, 83 AS `radical_id`, '婚' AS `hanzi_char` UNION ALL
  SELECT 710 AS `hsk_source_id`, 140 AS `radical_id`, '节' AS `hanzi_char` UNION ALL
  SELECT 710 AS `hsk_source_id`, 109 AS `radical_id`, '目' AS `hanzi_char` UNION ALL
  SELECT 711 AS `hsk_source_id`, 140 AS `radical_id`, '节' AS `hanzi_char` UNION ALL
  SELECT 711 AS `hsk_source_id`, 72 AS `radical_id`, '日' AS `hanzi_char` UNION ALL
  SELECT 712 AS `hsk_source_id`, 30 AS `radical_id`, '结' AS `hanzi_char` UNION ALL
  SELECT 712 AS `hsk_source_id`, 33 AS `radical_id`, '结' AS `hanzi_char` UNION ALL
  SELECT 712 AS `hsk_source_id`, 120 AS `radical_id`, '结' AS `hanzi_char` UNION ALL
  SELECT 712 AS `hsk_source_id`, 75 AS `radical_id`, '束' AS `hanzi_char` UNION ALL
  SELECT 713 AS `hsk_source_id`, 18 AS `radical_id`, '解' AS `hanzi_char` UNION ALL
  SELECT 713 AS `hsk_source_id`, 93 AS `radical_id`, '解' AS `hanzi_char` UNION ALL
  SELECT 713 AS `hsk_source_id`, 148 AS `radical_id`, '解' AS `hanzi_char` UNION ALL
  SELECT 713 AS `hsk_source_id`, 15 AS `radical_id`, '决' AS `hanzi_char` UNION ALL
  SELECT 713 AS `hsk_source_id`, 37 AS `radical_id`, '决' AS `hanzi_char` UNION ALL
  SELECT 714 AS `hsk_source_id`, 38 AS `radical_id`, '姐' AS `hanzi_char` UNION ALL
  SELECT 714 AS `hsk_source_id`, 1 AS `radical_id`, '姐' AS `hanzi_char` UNION ALL
  SELECT 714 AS `hsk_source_id`, 74 AS `radical_id`, '姐' AS `hanzi_char` UNION ALL
  SELECT 714 AS `hsk_source_id`, 75 AS `radical_id`, '妹' AS `hanzi_char` UNION ALL
  SELECT 715 AS `hsk_source_id`, 1 AS `radical_id`, '借' AS `hanzi_char` UNION ALL
  SELECT 715 AS `hsk_source_id`, 9 AS `radical_id`, '借' AS `hanzi_char` UNION ALL
  SELECT 715 AS `hsk_source_id`, 55 AS `radical_id`, '借' AS `hanzi_char` UNION ALL
  SELECT 715 AS `hsk_source_id`, 72 AS `radical_id`, '借' AS `hanzi_char` UNION ALL
  SELECT 716 AS `hsk_source_id`, 69 AS `radical_id`, '斤' AS `hanzi_char` UNION ALL
  SELECT 717 AS `hsk_source_id`, 48 AS `radical_id`, '经' AS `hanzi_char` UNION ALL
  SELECT 717 AS `hsk_source_id`, 120 AS `radical_id`, '经' AS `hanzi_char` UNION ALL
  SELECT 717 AS `hsk_source_id`, 162 AS `radical_id`, '过' AS `hanzi_char` UNION ALL
  SELECT 717 AS `hsk_source_id`, 41 AS `radical_id`, '过' AS `hanzi_char` UNION ALL
  SELECT 718 AS `hsk_source_id`, 48 AS `radical_id`, '经' AS `hanzi_char` UNION ALL
  SELECT 718 AS `hsk_source_id`, 120 AS `radical_id`, '经' AS `hanzi_char` UNION ALL
  SELECT 718 AS `hsk_source_id`, 96 AS `radical_id`, '理' AS `hanzi_char` UNION ALL
  SELECT 718 AS `hsk_source_id`, 166 AS `radical_id`, '理' AS `hanzi_char` UNION ALL
  SELECT 719 AS `hsk_source_id`, 4 AS `radical_id`, '久' AS `hanzi_char` UNION ALL
  SELECT 719 AS `hsk_source_id`, 20 AS `radical_id`, '久' AS `hanzi_char` UNION ALL
  SELECT 720 AS `hsk_source_id`, 85 AS `radical_id`, '酒' AS `hanzi_char` UNION ALL
  SELECT 720 AS `hsk_source_id`, 164 AS `radical_id`, '酒' AS `hanzi_char` UNION ALL
  SELECT 721 AS `hsk_source_id`, 2 AS `radical_id`, '旧' AS `hanzi_char` UNION ALL
  SELECT 721 AS `hsk_source_id`, 72 AS `radical_id`, '旧' AS `hanzi_char` UNION ALL
  SELECT 722 AS `hsk_source_id`, 20 AS `radical_id`, '句' AS `hanzi_char` UNION ALL
  SELECT 722 AS `hsk_source_id`, 30 AS `radical_id`, '句' AS `hanzi_char` UNION ALL
  SELECT 723 AS `hsk_source_id`, 20 AS `radical_id`, '句' AS `hanzi_char` UNION ALL
  SELECT 723 AS `hsk_source_id`, 30 AS `radical_id`, '句' AS `hanzi_char` UNION ALL
  SELECT 723 AS `hsk_source_id`, 39 AS `radical_id`, '子' AS `hanzi_char` UNION ALL
  SELECT 724 AS `hsk_source_id`, 15 AS `radical_id`, '决' AS `hanzi_char` UNION ALL
  SELECT 724 AS `hsk_source_id`, 37 AS `radical_id`, '决' AS `hanzi_char` UNION ALL
  SELECT 724 AS `hsk_source_id`, 40 AS `radical_id`, '定' AS `hanzi_char` UNION ALL
  SELECT 724 AS `hsk_source_id`, 103 AS `radical_id`, '定' AS `hanzi_char` UNION ALL
  SELECT 725 AS `hsk_source_id`, 1 AS `radical_id`, '卡' AS `hanzi_char` UNION ALL
  SELECT 725 AS `hsk_source_id`, 2 AS `radical_id`, '卡' AS `hanzi_char` UNION ALL
  SELECT 725 AS `hsk_source_id`, 25 AS `radical_id`, '卡' AS `hanzi_char` UNION ALL
  SELECT 726 AS `hsk_source_id`, 55 AS `radical_id`, '开' AS `hanzi_char` UNION ALL
  SELECT 726 AS `hsk_source_id`, 1 AS `radical_id`, '开' AS `hanzi_char` UNION ALL
  SELECT 726 AS `hsk_source_id`, 140 AS `radical_id`, '花' AS `hanzi_char` UNION ALL
  SELECT 726 AS `hsk_source_id`, 21 AS `radical_id`, '花' AS `hanzi_char` UNION ALL
  SELECT 726 AS `hsk_source_id`, 9 AS `radical_id`, '花' AS `hanzi_char` UNION ALL
  SELECT 728 AS `hsk_source_id`, 55 AS `radical_id`, '开' AS `hanzi_char` UNION ALL
  SELECT 728 AS `hsk_source_id`, 1 AS `radical_id`, '开' AS `hanzi_char` UNION ALL
  SELECT 728 AS `hsk_source_id`, 75 AS `radical_id`, '机' AS `hanzi_char` UNION ALL
  SELECT 728 AS `hsk_source_id`, 16 AS `radical_id`, '机' AS `hanzi_char` UNION ALL
  SELECT 729 AS `hsk_source_id`, 55 AS `radical_id`, '开' AS `hanzi_char` UNION ALL
  SELECT 729 AS `hsk_source_id`, 1 AS `radical_id`, '开' AS `hanzi_char` UNION ALL
  SELECT 729 AS `hsk_source_id`, 61 AS `radical_id`, '心' AS `hanzi_char` UNION ALL
  SELECT 730 AS `hsk_source_id`, 109 AS `radical_id`, '看' AS `hanzi_char` UNION ALL
  SELECT 730 AS `hsk_source_id`, 64 AS `radical_id`, '看' AS `hanzi_char` UNION ALL
  SELECT 730 AS `hsk_source_id`, 75 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 730 AS `hsk_source_id`, 1 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 730 AS `hsk_source_id`, 12 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 731 AS `hsk_source_id`, 1 AS `radical_id`, '可' AS `hanzi_char` UNION ALL
  SELECT 731 AS `hsk_source_id`, 30 AS `radical_id`, '可' AS `hanzi_char` UNION ALL
  SELECT 733 AS `hsk_source_id`, 1 AS `radical_id`, '可' AS `hanzi_char` UNION ALL
  SELECT 733 AS `hsk_source_id`, 30 AS `radical_id`, '可' AS `hanzi_char` UNION ALL
  SELECT 733 AS `hsk_source_id`, 87 AS `radical_id`, '爱' AS `hanzi_char` UNION ALL
  SELECT 733 AS `hsk_source_id`, 14 AS `radical_id`, '爱' AS `hanzi_char` UNION ALL
  SELECT 733 AS `hsk_source_id`, 29 AS `radical_id`, '爱' AS `hanzi_char` UNION ALL
  SELECT 734 AS `hsk_source_id`, 1 AS `radical_id`, '可' AS `hanzi_char` UNION ALL
  SELECT 734 AS `hsk_source_id`, 30 AS `radical_id`, '可' AS `hanzi_char` UNION ALL
  SELECT 734 AS `hsk_source_id`, 72 AS `radical_id`, '是' AS `hanzi_char` UNION ALL
  SELECT 734 AS `hsk_source_id`, 103 AS `radical_id`, '是' AS `hanzi_char` UNION ALL
  SELECT 735 AS `hsk_source_id`, 8 AS `radical_id`, '刻' AS `hanzi_char` UNION ALL
  SELECT 735 AS `hsk_source_id`, 18 AS `radical_id`, '刻' AS `hanzi_char` UNION ALL
  SELECT 737 AS `hsk_source_id`, 40 AS `radical_id`, '客' AS `hanzi_char` UNION ALL
  SELECT 737 AS `hsk_source_id`, 30 AS `radical_id`, '客' AS `hanzi_char` UNION ALL
  SELECT 737 AS `hsk_source_id`, 34 AS `radical_id`, '客' AS `hanzi_char` UNION ALL
  SELECT 737 AS `hsk_source_id`, 9 AS `radical_id`, '人' AS `hanzi_char` UNION ALL
  SELECT 739 AS `hsk_source_id`, 48 AS `radical_id`, '空' AS `hanzi_char` UNION ALL
  SELECT 739 AS `hsk_source_id`, 116 AS `radical_id`, '空' AS `hanzi_char` UNION ALL
  SELECT 739 AS `hsk_source_id`, 13 AS `radical_id`, '调' AS `hanzi_char` UNION ALL
  SELECT 739 AS `hsk_source_id`, 30 AS `radical_id`, '调' AS `hanzi_char` UNION ALL
  SELECT 739 AS `hsk_source_id`, 32 AS `radical_id`, '调' AS `hanzi_char` UNION ALL
  SELECT 739 AS `hsk_source_id`, 149 AS `radical_id`, '调' AS `hanzi_char` UNION ALL
  SELECT 740 AS `hsk_source_id`, 30 AS `radical_id`, '哭' AS `hanzi_char` UNION ALL
  SELECT 740 AS `hsk_source_id`, 94 AS `radical_id`, '哭' AS `hanzi_char` UNION ALL
  SELECT 741 AS `hsk_source_id`, 37 AS `radical_id`, '筷' AS `hanzi_char` UNION ALL
  SELECT 741 AS `hsk_source_id`, 61 AS `radical_id`, '筷' AS `hanzi_char` UNION ALL
  SELECT 741 AS `hsk_source_id`, 118 AS `radical_id`, '筷' AS `hanzi_char` UNION ALL
  SELECT 741 AS `hsk_source_id`, 39 AS `radical_id`, '子' AS `hanzi_char` UNION ALL
  SELECT 742 AS `hsk_source_id`, 53 AS `radical_id`, '矿' AS `hanzi_char` UNION ALL
  SELECT 742 AS `hsk_source_id`, 112 AS `radical_id`, '矿' AS `hanzi_char` UNION ALL
  SELECT 742 AS `hsk_source_id`, 85 AS `radical_id`, '泉' AS `hanzi_char` UNION ALL
  SELECT 742 AS `hsk_source_id`, 106 AS `radical_id`, '泉' AS `hanzi_char` UNION ALL
  SELECT 743 AS `hsk_source_id`, 75 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 743 AS `hsk_source_id`, 1 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 743 AS `hsk_source_id`, 12 AS `radical_id`, '来' AS `hanzi_char` UNION ALL
  SELECT 743 AS `hsk_source_id`, 132 AS `radical_id`, '自' AS `hanzi_char` UNION ALL
  SELECT 744 AS `hsk_source_id`, 108 AS `radical_id`, '蓝' AS `hanzi_char` UNION ALL
  SELECT 744 AS `hsk_source_id`, 140 AS `radical_id`, '蓝' AS `hanzi_char` UNION ALL
  SELECT 747 AS `hsk_source_id`, 4 AS `radical_id`, '离' AS `hanzi_char` UNION ALL
  SELECT 747 AS `hsk_source_id`, 8 AS `radical_id`, '离' AS `hanzi_char` UNION ALL
  SELECT 747 AS `hsk_source_id`, 17 AS `radical_id`, '离' AS `hanzi_char` UNION ALL
  SELECT 747 AS `hsk_source_id`, 114 AS `radical_id`, '离' AS `hanzi_char` UNION ALL
  SELECT 747 AS `hsk_source_id`, 55 AS `radical_id`, '开' AS `hanzi_char` UNION ALL
  SELECT 747 AS `hsk_source_id`, 1 AS `radical_id`, '开' AS `hanzi_char` UNION ALL
  SELECT 748 AS `hsk_source_id`, 113 AS `radical_id`, '礼' AS `hanzi_char` UNION ALL
  SELECT 748 AS `hsk_source_id`, 4 AS `radical_id`, '物' AS `hanzi_char` UNION ALL
  SELECT 748 AS `hsk_source_id`, 20 AS `radical_id`, '物' AS `hanzi_char` UNION ALL
  SELECT 748 AS `hsk_source_id`, 93 AS `radical_id`, '物' AS `hanzi_char` UNION ALL
  SELECT 749 AS `hsk_source_id`, 19 AS `radical_id`, '历' AS `hanzi_char` UNION ALL
  SELECT 749 AS `hsk_source_id`, 27 AS `radical_id`, '历' AS `hanzi_char` UNION ALL
  SELECT 749 AS `hsk_source_id`, 4 AS `radical_id`, '史' AS `hanzi_char` UNION ALL
  SELECT 749 AS `hsk_source_id`, 30 AS `radical_id`, '史' AS `hanzi_char` UNION ALL
  SELECT 750 AS `hsk_source_id`, 1 AS `radical_id`, '脸' AS `hanzi_char` UNION ALL
  SELECT 750 AS `hsk_source_id`, 9 AS `radical_id`, '脸' AS `hanzi_char` UNION ALL
  SELECT 750 AS `hsk_source_id`, 42 AS `radical_id`, '脸' AS `hanzi_char` UNION ALL
  SELECT 750 AS `hsk_source_id`, 130 AS `radical_id`, '脸' AS `hanzi_char` UNION ALL
  SELECT 751 AS `hsk_source_id`, 12 AS `radical_id`, '练' AS `hanzi_char` UNION ALL
  SELECT 751 AS `hsk_source_id`, 30 AS `radical_id`, '练' AS `hanzi_char` UNION ALL
  SELECT 751 AS `hsk_source_id`, 75 AS `radical_id`, '练' AS `hanzi_char` UNION ALL
  SELECT 751 AS `hsk_source_id`, 120 AS `radical_id`, '练' AS `hanzi_char` UNION ALL
  SELECT 752 AS `hsk_source_id`, 12 AS `radical_id`, '练' AS `hanzi_char` UNION ALL
  SELECT 752 AS `hsk_source_id`, 30 AS `radical_id`, '练' AS `hanzi_char` UNION ALL
  SELECT 752 AS `hsk_source_id`, 75 AS `radical_id`, '练' AS `hanzi_char` UNION ALL
  SELECT 752 AS `hsk_source_id`, 120 AS `radical_id`, '练' AS `hanzi_char` UNION ALL
  SELECT 752 AS `hsk_source_id`, 15 AS `radical_id`, '习' AS `hanzi_char` UNION ALL
  SELECT 753 AS `hsk_source_id`, 8 AS `radical_id`, '凉' AS `hanzi_char` UNION ALL
  SELECT 753 AS `hsk_source_id`, 15 AS `radical_id`, '凉' AS `hanzi_char` UNION ALL
  SELECT 753 AS `hsk_source_id`, 30 AS `radical_id`, '凉' AS `hanzi_char` UNION ALL
  SELECT 753 AS `hsk_source_id`, 42 AS `radical_id`, '凉' AS `hanzi_char` UNION ALL
  SELECT 753 AS `hsk_source_id`, 61 AS `radical_id`, '快' AS `hanzi_char` UNION ALL
  SELECT 753 AS `hsk_source_id`, 37 AS `radical_id`, '快' AS `hanzi_char` UNION ALL
  SELECT 754 AS `hsk_source_id`, 1 AS `radical_id`, '辆' AS `hanzi_char` UNION ALL
  SELECT 754 AS `hsk_source_id`, 9 AS `radical_id`, '辆' AS `hanzi_char` UNION ALL
  SELECT 754 AS `hsk_source_id`, 13 AS `radical_id`, '辆' AS `hanzi_char` UNION ALL
  SELECT 754 AS `hsk_source_id`, 159 AS `radical_id`, '辆' AS `hanzi_char` UNION ALL
  SELECT 755 AS `hsk_source_id`, 26 AS `radical_id`, '聊' AS `hanzi_char` UNION ALL
  SELECT 755 AS `hsk_source_id`, 128 AS `radical_id`, '聊' AS `hanzi_char` UNION ALL
  SELECT 756 AS `hsk_source_id`, 26 AS `radical_id`, '聊' AS `hanzi_char` UNION ALL
  SELECT 756 AS `hsk_source_id`, 128 AS `radical_id`, '聊' AS `hanzi_char` UNION ALL
  SELECT 756 AS `hsk_source_id`, 37 AS `radical_id`, '天' AS `hanzi_char` UNION ALL
  SELECT 756 AS `hsk_source_id`, 1 AS `radical_id`, '天' AS `hanzi_char` UNION ALL
  SELECT 756 AS `hsk_source_id`, 10 AS `radical_id`, '儿' AS `hanzi_char` UNION ALL
  SELECT 757 AS `hsk_source_id`, 6 AS `radical_id`, '了' AS `hanzi_char` UNION ALL
  SELECT 757 AS `hsk_source_id`, 5 AS `radical_id`, '了' AS `hanzi_char` UNION ALL
  SELECT 757 AS `hsk_source_id`, 18 AS `radical_id`, '解' AS `hanzi_char` UNION ALL
  SELECT 757 AS `hsk_source_id`, 93 AS `radical_id`, '解' AS `hanzi_char` UNION ALL
  SELECT 757 AS `hsk_source_id`, 148 AS `radical_id`, '解' AS `hanzi_char` UNION ALL
  SELECT 758 AS `hsk_source_id`, 9 AS `radical_id`, '邻' AS `hanzi_char` UNION ALL
  SELECT 758 AS `hsk_source_id`, 163 AS `radical_id`, '邻' AS `hanzi_char` UNION ALL
  SELECT 758 AS `hsk_source_id`, 24 AS `radical_id`, '居' AS `hanzi_char` UNION ALL
  SELECT 758 AS `hsk_source_id`, 30 AS `radical_id`, '居' AS `hanzi_char` UNION ALL
  SELECT 758 AS `hsk_source_id`, 63 AS `radical_id`, '居' AS `hanzi_char` UNION ALL
  SELECT 759 AS `hsk_source_id`, 26 AS `radical_id`, '留' AS `hanzi_char` UNION ALL
  SELECT 759 AS `hsk_source_id`, 102 AS `radical_id`, '留' AS `hanzi_char` UNION ALL
  SELECT 759 AS `hsk_source_id`, 39 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 759 AS `hsk_source_id`, 42 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 759 AS `hsk_source_id`, 14 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 760 AS `hsk_source_id`, 26 AS `radical_id`, '留' AS `hanzi_char` UNION ALL
  SELECT 760 AS `hsk_source_id`, 102 AS `radical_id`, '留' AS `hanzi_char` UNION ALL
  SELECT 760 AS `hsk_source_id`, 39 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 760 AS `hsk_source_id`, 42 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 760 AS `hsk_source_id`, 14 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 760 AS `hsk_source_id`, 100 AS `radical_id`, '生' AS `hanzi_char` UNION ALL
  SELECT 761 AS `hsk_source_id`, 75 AS `radical_id`, '楼' AS `hanzi_char` UNION ALL
  SELECT 761 AS `hsk_source_id`, 38 AS `radical_id`, '楼' AS `hanzi_char` UNION ALL
  SELECT 761 AS `hsk_source_id`, 119 AS `radical_id`, '楼' AS `hanzi_char` UNION ALL
  SELECT 761 AS `hsk_source_id`, 3 AS `radical_id`, '梯' AS `hanzi_char` UNION ALL
  SELECT 761 AS `hsk_source_id`, 57 AS `radical_id`, '梯' AS `hanzi_char` UNION ALL
  SELECT 762 AS `hsk_source_id`, 157 AS `radical_id`, '路' AS `hanzi_char` UNION ALL
  SELECT 762 AS `hsk_source_id`, 30 AS `radical_id`, '路' AS `hanzi_char` UNION ALL
  SELECT 762 AS `hsk_source_id`, 34 AS `radical_id`, '路' AS `hanzi_char` UNION ALL
  SELECT 762 AS `hsk_source_id`, 162 AS `radical_id`, '边' AS `hanzi_char` UNION ALL
  SELECT 762 AS `hsk_source_id`, 19 AS `radical_id`, '边' AS `hanzi_char` UNION ALL
  SELECT 764 AS `hsk_source_id`, 187 AS `radical_id`, '马' AS `hanzi_char` UNION ALL
  SELECT 764 AS `hsk_source_id`, 1 AS `radical_id`, '马' AS `hanzi_char` UNION ALL
  SELECT 767 AS `hsk_source_id`, 1 AS `radical_id`, '满' AS `hanzi_char` UNION ALL
  SELECT 767 AS `hsk_source_id`, 9 AS `radical_id`, '满' AS `hanzi_char` UNION ALL
  SELECT 767 AS `hsk_source_id`, 13 AS `radical_id`, '满' AS `hanzi_char` UNION ALL
  SELECT 767 AS `hsk_source_id`, 85 AS `radical_id`, '满' AS `hanzi_char` UNION ALL
  SELECT 767 AS `hsk_source_id`, 140 AS `radical_id`, '满' AS `hanzi_char` UNION ALL
  SELECT 767 AS `hsk_source_id`, 61 AS `radical_id`, '意' AS `hanzi_char` UNION ALL
  SELECT 767 AS `hsk_source_id`, 180 AS `radical_id`, '意' AS `hanzi_char` UNION ALL
  SELECT 769 AS `hsk_source_id`, 119 AS `radical_id`, '米' AS `hanzi_char` UNION ALL
  SELECT 770 AS `hsk_source_id`, 176 AS `radical_id`, '面' AS `hanzi_char` UNION ALL
  SELECT 770 AS `hsk_source_id`, 18 AS `radical_id`, '前' AS `hanzi_char` UNION ALL
  SELECT 770 AS `hsk_source_id`, 12 AS `radical_id`, '前' AS `hanzi_char` UNION ALL
  SELECT 770 AS `hsk_source_id`, 1 AS `radical_id`, '前' AS `hanzi_char` UNION ALL
  SELECT 770 AS `hsk_source_id`, 74 AS `radical_id`, '前' AS `hanzi_char` UNION ALL
  SELECT 772 AS `hsk_source_id`, 30 AS `radical_id`, '名' AS `hanzi_char` UNION ALL
  SELECT 772 AS `hsk_source_id`, 36 AS `radical_id`, '名' AS `hanzi_char` UNION ALL
  SELECT 772 AS `hsk_source_id`, 3 AS `radical_id`, '单' AS `hanzi_char` UNION ALL
  SELECT 773 AS `hsk_source_id`, 30 AS `radical_id`, '名' AS `hanzi_char` UNION ALL
  SELECT 773 AS `hsk_source_id`, 36 AS `radical_id`, '名' AS `hanzi_char` UNION ALL
  SELECT 773 AS `hsk_source_id`, 9 AS `radical_id`, '人' AS `hanzi_char` UNION ALL
  SELECT 776 AS `hsk_source_id`, 24 AS `radical_id`, '南' AS `hanzi_char` UNION ALL
  SELECT 776 AS `hsk_source_id`, 13 AS `radical_id`, '南' AS `hanzi_char` UNION ALL
  SELECT 776 AS `hsk_source_id`, 12 AS `radical_id`, '南' AS `hanzi_char` UNION ALL
  SELECT 776 AS `hsk_source_id`, 51 AS `radical_id`, '南' AS `hanzi_char` UNION ALL
  SELECT 776 AS `hsk_source_id`, 70 AS `radical_id`, '方' AS `hanzi_char` UNION ALL
  SELECT 777 AS `hsk_source_id`, 29 AS `radical_id`, '难' AS `hanzi_char` UNION ALL
  SELECT 777 AS `hsk_source_id`, 172 AS `radical_id`, '难' AS `hanzi_char` UNION ALL
  SELECT 777 AS `hsk_source_id`, 162 AS `radical_id`, '过' AS `hanzi_char` UNION ALL
  SELECT 777 AS `hsk_source_id`, 41 AS `radical_id`, '过' AS `hanzi_char` UNION ALL
  SELECT 778 AS `hsk_source_id`, 29 AS `radical_id`, '难' AS `hanzi_char` UNION ALL
  SELECT 778 AS `hsk_source_id`, 172 AS `radical_id`, '难' AS `hanzi_char` UNION ALL
  SELECT 778 AS `hsk_source_id`, 109 AS `radical_id`, '看' AS `hanzi_char` UNION ALL
  SELECT 778 AS `hsk_source_id`, 64 AS `radical_id`, '看' AS `hanzi_char` UNION ALL
  SELECT 781 AS `hsk_source_id`, 29 AS `radical_id`, '难' AS `hanzi_char` UNION ALL
  SELECT 781 AS `hsk_source_id`, 172 AS `radical_id`, '难' AS `hanzi_char` UNION ALL
  SELECT 781 AS `hsk_source_id`, 72 AS `radical_id`, '题' AS `hanzi_char` UNION ALL
  SELECT 781 AS `hsk_source_id`, 103 AS `radical_id`, '题' AS `hanzi_char` UNION ALL
  SELECT 781 AS `hsk_source_id`, 181 AS `radical_id`, '题' AS `hanzi_char` UNION ALL
  SELECT 782 AS `hsk_source_id`, 29 AS `radical_id`, '难' AS `hanzi_char` UNION ALL
  SELECT 782 AS `hsk_source_id`, 172 AS `radical_id`, '难' AS `hanzi_char` UNION ALL
  SELECT 782 AS `hsk_source_id`, 30 AS `radical_id`, '听' AS `hanzi_char` UNION ALL
  SELECT 782 AS `hsk_source_id`, 69 AS `radical_id`, '听' AS `hanzi_char` UNION ALL
  SELECT 783 AS `hsk_source_id`, 51 AS `radical_id`, '年' AS `hanzi_char` UNION ALL
  SELECT 783 AS `hsk_source_id`, 29 AS `radical_id`, '级' AS `hanzi_char` UNION ALL
  SELECT 783 AS `hsk_source_id`, 120 AS `radical_id`, '级' AS `hanzi_char` UNION ALL
  SELECT 784 AS `hsk_source_id`, 51 AS `radical_id`, '年' AS `hanzi_char` UNION ALL
  SELECT 784 AS `hsk_source_id`, 29 AS `radical_id`, '轻' AS `hanzi_char` UNION ALL
  SELECT 784 AS `hsk_source_id`, 48 AS `radical_id`, '轻' AS `hanzi_char` UNION ALL
  SELECT 784 AS `hsk_source_id`, 159 AS `radical_id`, '轻' AS `hanzi_char` UNION ALL
  SELECT 785 AS `hsk_source_id`, 93 AS `radical_id`, '牛' AS `hanzi_char` UNION ALL
  SELECT 786 AS `hsk_source_id`, 19 AS `radical_id`, '努' AS `hanzi_char` UNION ALL
  SELECT 786 AS `hsk_source_id`, 29 AS `radical_id`, '努' AS `hanzi_char` UNION ALL
  SELECT 786 AS `hsk_source_id`, 38 AS `radical_id`, '努' AS `hanzi_char` UNION ALL
  SELECT 789 AS `hsk_source_id`, 87 AS `radical_id`, '爬' AS `hanzi_char` UNION ALL
  SELECT 790 AS `hsk_source_id`, 61 AS `radical_id`, '怕' AS `hanzi_char` UNION ALL
  SELECT 790 AS `hsk_source_id`, 106 AS `radical_id`, '怕' AS `hanzi_char` UNION ALL
  SELECT 791 AS `hsk_source_id`, 64 AS `radical_id`, '拍' AS `hanzi_char` UNION ALL
  SELECT 791 AS `hsk_source_id`, 106 AS `radical_id`, '拍' AS `hanzi_char` UNION ALL
  SELECT 791 AS `hsk_source_id`, 18 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 791 AS `hsk_source_id`, 30 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 791 AS `hsk_source_id`, 72 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 791 AS `hsk_source_id`, 86 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 792 AS `hsk_source_id`, 108 AS `radical_id`, '盘' AS `hanzi_char` UNION ALL
  SELECT 792 AS `hsk_source_id`, 137 AS `radical_id`, '盘' AS `hanzi_char` UNION ALL
  SELECT 792 AS `hsk_source_id`, 39 AS `radical_id`, '子' AS `hanzi_char` UNION ALL
  SELECT 793 AS `hsk_source_id`, 3 AS `radical_id`, '胖' AS `hanzi_char` UNION ALL
  SELECT 793 AS `hsk_source_id`, 24 AS `radical_id`, '胖' AS `hanzi_char` UNION ALL
  SELECT 793 AS `hsk_source_id`, 93 AS `radical_id`, '胖' AS `hanzi_char` UNION ALL
  SELECT 793 AS `hsk_source_id`, 130 AS `radical_id`, '胖' AS `hanzi_char` UNION ALL
  SELECT 794 AS `hsk_source_id`, 24 AS `radical_id`, '啤' AS `hanzi_char` UNION ALL
  SELECT 794 AS `hsk_source_id`, 30 AS `radical_id`, '啤' AS `hanzi_char` UNION ALL
  SELECT 794 AS `hsk_source_id`, 106 AS `radical_id`, '啤' AS `hanzi_char` UNION ALL
  SELECT 794 AS `hsk_source_id`, 85 AS `radical_id`, '酒' AS `hanzi_char` UNION ALL
  SELECT 794 AS `hsk_source_id`, 164 AS `radical_id`, '酒' AS `hanzi_char` UNION ALL
  SELECT 795 AS `hsk_source_id`, 3 AS `radical_id`, '平' AS `hanzi_char` UNION ALL
  SELECT 795 AS `hsk_source_id`, 51 AS `radical_id`, '平' AS `hanzi_char` UNION ALL
  SELECT 795 AS `hsk_source_id`, 53 AS `radical_id`, '平' AS `hanzi_char` UNION ALL
  SELECT 795 AS `hsk_source_id`, 72 AS `radical_id`, '时' AS `hanzi_char` UNION ALL
  SELECT 795 AS `hsk_source_id`, 41 AS `radical_id`, '时' AS `hanzi_char` UNION ALL
  SELECT 796 AS `hsk_source_id`, 1 AS `radical_id`, '瓶' AS `hanzi_char` UNION ALL
  SELECT 796 AS `hsk_source_id`, 3 AS `radical_id`, '瓶' AS `hanzi_char` UNION ALL
  SELECT 796 AS `hsk_source_id`, 51 AS `radical_id`, '瓶' AS `hanzi_char` UNION ALL
  SELECT 796 AS `hsk_source_id`, 55 AS `radical_id`, '瓶' AS `hanzi_char` UNION ALL
  SELECT 796 AS `hsk_source_id`, 98 AS `radical_id`, '瓶' AS `hanzi_char` UNION ALL
  SELECT 796 AS `hsk_source_id`, 39 AS `radical_id`, '子' AS `hanzi_char` UNION ALL
  SELECT 797 AS `hsk_source_id`, 1 AS `radical_id`, '骑' AS `hanzi_char` UNION ALL
  SELECT 797 AS `hsk_source_id`, 30 AS `radical_id`, '骑' AS `hanzi_char` UNION ALL
  SELECT 797 AS `hsk_source_id`, 37 AS `radical_id`, '骑' AS `hanzi_char` UNION ALL
  SELECT 797 AS `hsk_source_id`, 187 AS `radical_id`, '骑' AS `hanzi_char` UNION ALL
  SELECT 798 AS `hsk_source_id`, 1 AS `radical_id`, '奇' AS `hanzi_char` UNION ALL
  SELECT 798 AS `hsk_source_id`, 30 AS `radical_id`, '奇' AS `hanzi_char` UNION ALL
  SELECT 798 AS `hsk_source_id`, 37 AS `radical_id`, '奇' AS `hanzi_char` UNION ALL
  SELECT 798 AS `hsk_source_id`, 29 AS `radical_id`, '怪' AS `hanzi_char` UNION ALL
  SELECT 798 AS `hsk_source_id`, 32 AS `radical_id`, '怪' AS `hanzi_char` UNION ALL
  SELECT 798 AS `hsk_source_id`, 61 AS `radical_id`, '怪' AS `hanzi_char` UNION ALL
  SELECT 799 AS `hsk_source_id`, 1 AS `radical_id`, '其' AS `hanzi_char` UNION ALL
  SELECT 799 AS `hsk_source_id`, 12 AS `radical_id`, '其' AS `hanzi_char` UNION ALL
  SELECT 799 AS `hsk_source_id`, 99 AS `radical_id`, '其' AS `hanzi_char` UNION ALL
  SELECT 799 AS `hsk_source_id`, 37 AS `radical_id`, '实' AS `hanzi_char` UNION ALL
  SELECT 799 AS `hsk_source_id`, 40 AS `radical_id`, '实' AS `hanzi_char` UNION ALL
  SELECT 800 AS `hsk_source_id`, 1 AS `radical_id`, '其' AS `hanzi_char` UNION ALL
  SELECT 800 AS `hsk_source_id`, 12 AS `radical_id`, '其' AS `hanzi_char` UNION ALL
  SELECT 800 AS `hsk_source_id`, 99 AS `radical_id`, '其' AS `hanzi_char` UNION ALL
  SELECT 800 AS `hsk_source_id`, 9 AS `radical_id`, '他' AS `hanzi_char` UNION ALL
  SELECT 800 AS `hsk_source_id`, 5 AS `radical_id`, '他' AS `hanzi_char` UNION ALL
  SELECT 802 AS `hsk_source_id`, 156 AS `radical_id`, '起' AS `hanzi_char` UNION ALL
  SELECT 802 AS `hsk_source_id`, 49 AS `radical_id`, '起' AS `hanzi_char` UNION ALL
  SELECT 802 AS `hsk_source_id`, 183 AS `radical_id`, '飞' AS `hanzi_char` UNION ALL
  SELECT 804 AS `hsk_source_id`, 16 AS `radical_id`, '铅' AS `hanzi_char` UNION ALL
  SELECT 804 AS `hsk_source_id`, 30 AS `radical_id`, '铅' AS `hanzi_char` UNION ALL
  SELECT 804 AS `hsk_source_id`, 167 AS `radical_id`, '铅' AS `hanzi_char` UNION ALL
  SELECT 804 AS `hsk_source_id`, 82 AS `radical_id`, '笔' AS `hanzi_char` UNION ALL
  SELECT 804 AS `hsk_source_id`, 118 AS `radical_id`, '笔' AS `hanzi_char` UNION ALL
  SELECT 805 AS `hsk_source_id`, 18 AS `radical_id`, '前' AS `hanzi_char` UNION ALL
  SELECT 805 AS `hsk_source_id`, 12 AS `radical_id`, '前' AS `hanzi_char` UNION ALL
  SELECT 805 AS `hsk_source_id`, 1 AS `radical_id`, '前' AS `hanzi_char` UNION ALL
  SELECT 805 AS `hsk_source_id`, 74 AS `radical_id`, '前' AS `hanzi_char` UNION ALL
  SELECT 805 AS `hsk_source_id`, 51 AS `radical_id`, '年' AS `hanzi_char` UNION ALL
  SELECT 807 AS `hsk_source_id`, 85 AS `radical_id`, '清' AS `hanzi_char` UNION ALL
  SELECT 807 AS `hsk_source_id`, 174 AS `radical_id`, '清' AS `hanzi_char` UNION ALL
  SELECT 807 AS `hsk_source_id`, 75 AS `radical_id`, '楚' AS `hanzi_char` UNION ALL
  SELECT 807 AS `hsk_source_id`, 103 AS `radical_id`, '楚' AS `hanzi_char` UNION ALL
  SELECT 809 AS `hsk_source_id`, 149 AS `radical_id`, '请' AS `hanzi_char` UNION ALL
  SELECT 809 AS `hsk_source_id`, 174 AS `radical_id`, '请' AS `hanzi_char` UNION ALL
  SELECT 809 AS `hsk_source_id`, 40 AS `radical_id`, '客' AS `hanzi_char` UNION ALL
  SELECT 809 AS `hsk_source_id`, 30 AS `radical_id`, '客' AS `hanzi_char` UNION ALL
  SELECT 809 AS `hsk_source_id`, 34 AS `radical_id`, '客' AS `hanzi_char` UNION ALL
  SELECT 810 AS `hsk_source_id`, 86 AS `radical_id`, '秋' AS `hanzi_char` UNION ALL
  SELECT 810 AS `hsk_source_id`, 115 AS `radical_id`, '秋' AS `hanzi_char` UNION ALL
  SELECT 810 AS `hsk_source_id`, 37 AS `radical_id`, '天' AS `hanzi_char` UNION ALL
  SELECT 810 AS `hsk_source_id`, 1 AS `radical_id`, '天' AS `hanzi_char` UNION ALL
  SELECT 811 AS `hsk_source_id`, 96 AS `radical_id`, '球' AS `hanzi_char` UNION ALL
  SELECT 811 AS `hsk_source_id`, 85 AS `radical_id`, '球' AS `hanzi_char` UNION ALL
  SELECT 811 AS `hsk_source_id`, 1 AS `radical_id`, '球' AS `hanzi_char` UNION ALL
  SELECT 811 AS `hsk_source_id`, 32 AS `radical_id`, '场' AS `hanzi_char` UNION ALL
  SELECT 811 AS `hsk_source_id`, 20 AS `radical_id`, '场' AS `hanzi_char` UNION ALL
  SELECT 811 AS `hsk_source_id`, 4 AS `radical_id`, '场' AS `hanzi_char` UNION ALL
  SELECT 812 AS `hsk_source_id`, 1 AS `radical_id`, '裙' AS `hanzi_char` UNION ALL
  SELECT 812 AS `hsk_source_id`, 30 AS `radical_id`, '裙' AS `hanzi_char` UNION ALL
  SELECT 812 AS `hsk_source_id`, 44 AS `radical_id`, '裙' AS `hanzi_char` UNION ALL
  SELECT 812 AS `hsk_source_id`, 145 AS `radical_id`, '裙' AS `hanzi_char` UNION ALL
  SELECT 812 AS `hsk_source_id`, 39 AS `radical_id`, '子' AS `hanzi_char` UNION ALL
  SELECT 813 AS `hsk_source_id`, 86 AS `radical_id`, '然' AS `hanzi_char` UNION ALL
  SELECT 813 AS `hsk_source_id`, 94 AS `radical_id`, '然' AS `hanzi_char` UNION ALL
  SELECT 813 AS `hsk_source_id`, 130 AS `radical_id`, '然' AS `hanzi_char` UNION ALL
  SELECT 813 AS `hsk_source_id`, 30 AS `radical_id`, '后' AS `hanzi_char` UNION ALL
  SELECT 814 AS `hsk_source_id`, 86 AS `radical_id`, '热' AS `hanzi_char` UNION ALL
  SELECT 814 AS `hsk_source_id`, 64 AS `radical_id`, '热' AS `hanzi_char` UNION ALL
  SELECT 814 AS `hsk_source_id`, 61 AS `radical_id`, '情' AS `hanzi_char` UNION ALL
  SELECT 814 AS `hsk_source_id`, 174 AS `radical_id`, '情' AS `hanzi_char` UNION ALL
  SELECT 815 AS `hsk_source_id`, 149 AS `radical_id`, '认' AS `hanzi_char` UNION ALL
  SELECT 815 AS `hsk_source_id`, 9 AS `radical_id`, '认' AS `hanzi_char` UNION ALL
  SELECT 815 AS `hsk_source_id`, 60 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 815 AS `hsk_source_id`, 72 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 815 AS `hsk_source_id`, 1 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 815 AS `hsk_source_id`, 41 AS `radical_id`, '得' AS `hanzi_char` UNION ALL
  SELECT 816 AS `hsk_source_id`, 149 AS `radical_id`, '认' AS `hanzi_char` UNION ALL
  SELECT 816 AS `hsk_source_id`, 9 AS `radical_id`, '认' AS `hanzi_char` UNION ALL
  SELECT 816 AS `hsk_source_id`, 3 AS `radical_id`, '为' AS `hanzi_char` UNION ALL
  SELECT 816 AS `hsk_source_id`, 19 AS `radical_id`, '为' AS `hanzi_char` UNION ALL
  SELECT 818 AS `hsk_source_id`, 40 AS `radical_id`, '容' AS `hanzi_char` UNION ALL
  SELECT 818 AS `hsk_source_id`, 150 AS `radical_id`, '容' AS `hanzi_char` UNION ALL
  SELECT 818 AS `hsk_source_id`, 4 AS `radical_id`, '易' AS `hanzi_char` UNION ALL
  SELECT 818 AS `hsk_source_id`, 20 AS `radical_id`, '易' AS `hanzi_char` UNION ALL
  SELECT 818 AS `hsk_source_id`, 72 AS `radical_id`, '易' AS `hanzi_char` UNION ALL
  SELECT 819 AS `hsk_source_id`, 30 AS `radical_id`, '如' AS `hanzi_char` UNION ALL
  SELECT 819 AS `hsk_source_id`, 38 AS `radical_id`, '如' AS `hanzi_char` UNION ALL
  SELECT 819 AS `hsk_source_id`, 75 AS `radical_id`, '果' AS `hanzi_char`
) m
JOIN `VOCABULARY` v ON v.`hsk_source_id` = m.`hsk_source_id`;

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`)
SELECT v.`vocab_id`, m.`radical_id`, m.`hanzi_char`
FROM (
  SELECT 819 AS `hsk_source_id`, 102 AS `radical_id`, '果' AS `hanzi_char` UNION ALL
  SELECT 820 AS `hsk_source_id`, 9 AS `radical_id`, '伞' AS `hanzi_char` UNION ALL
  SELECT 821 AS `hsk_source_id`, 58 AS `radical_id`, '扫' AS `hanzi_char` UNION ALL
  SELECT 821 AS `hsk_source_id`, 64 AS `radical_id`, '扫' AS `hanzi_char` UNION ALL
  SELECT 822 AS `hsk_source_id`, 4 AS `radical_id`, '沙' AS `hanzi_char` UNION ALL
  SELECT 822 AS `hsk_source_id`, 42 AS `radical_id`, '沙' AS `hanzi_char` UNION ALL
  SELECT 822 AS `hsk_source_id`, 85 AS `radical_id`, '沙' AS `hanzi_char` UNION ALL
  SELECT 822 AS `hsk_source_id`, 29 AS `radical_id`, '发' AS `hanzi_char` UNION ALL
  SELECT 824 AS `hsk_source_id`, 1 AS `radical_id`, '上' AS `hanzi_char` UNION ALL
  SELECT 824 AS `hsk_source_id`, 25 AS `radical_id`, '上' AS `hanzi_char` UNION ALL
  SELECT 824 AS `hsk_source_id`, 145 AS `radical_id`, '衣' AS `hanzi_char` UNION ALL
  SELECT 825 AS `hsk_source_id`, 3 AS `radical_id`, '勺' AS `hanzi_char` UNION ALL
  SELECT 825 AS `hsk_source_id`, 20 AS `radical_id`, '勺' AS `hanzi_char` UNION ALL
  SELECT 825 AS `hsk_source_id`, 39 AS `radical_id`, '子' AS `hanzi_char` UNION ALL
  SELECT 826 AS `hsk_source_id`, 158 AS `radical_id`, '身' AS `hanzi_char` UNION ALL
  SELECT 826 AS `hsk_source_id`, 162 AS `radical_id`, '边' AS `hanzi_char` UNION ALL
  SELECT 826 AS `hsk_source_id`, 19 AS `radical_id`, '边' AS `hanzi_char` UNION ALL
  SELECT 827 AS `hsk_source_id`, 158 AS `radical_id`, '身' AS `hanzi_char` UNION ALL
  SELECT 827 AS `hsk_source_id`, 189 AS `radical_id`, '高' AS `hanzi_char` UNION ALL
  SELECT 828 AS `hsk_source_id`, 33 AS `radical_id`, '声' AS `hanzi_char` UNION ALL
  SELECT 829 AS `hsk_source_id`, 100 AS `radical_id`, '生' AS `hanzi_char` UNION ALL
  SELECT 829 AS `hsk_source_id`, 85 AS `radical_id`, '活' AS `hanzi_char` UNION ALL
  SELECT 829 AS `hsk_source_id`, 135 AS `radical_id`, '活' AS `hanzi_char` UNION ALL
  SELECT 831 AS `hsk_source_id`, 33 AS `radical_id`, '声' AS `hanzi_char` UNION ALL
  SELECT 831 AS `hsk_source_id`, 180 AS `radical_id`, '音' AS `hanzi_char` UNION ALL
  SELECT 832 AS `hsk_source_id`, 8 AS `radical_id`, '市' AS `hanzi_char` UNION ALL
  SELECT 832 AS `hsk_source_id`, 50 AS `radical_id`, '市' AS `hanzi_char` UNION ALL
  SELECT 834 AS `hsk_source_id`, 40 AS `radical_id`, '室' AS `hanzi_char` UNION ALL
  SELECT 834 AS `hsk_source_id`, 133 AS `radical_id`, '室' AS `hanzi_char` UNION ALL
  SELECT 835 AS `hsk_source_id`, 1 AS `radical_id`, '世' AS `hanzi_char` UNION ALL
  SELECT 835 AS `hsk_source_id`, 55 AS `radical_id`, '世' AS `hanzi_char` UNION ALL
  SELECT 835 AS `hsk_source_id`, 9 AS `radical_id`, '界' AS `hanzi_char` UNION ALL
  SELECT 835 AS `hsk_source_id`, 102 AS `radical_id`, '界' AS `hanzi_char` UNION ALL
  SELECT 836 AS `hsk_source_id`, 2 AS `radical_id`, '收' AS `hanzi_char` UNION ALL
  SELECT 836 AS `hsk_source_id`, 66 AS `radical_id`, '收' AS `hanzi_char` UNION ALL
  SELECT 837 AS `hsk_source_id`, 2 AS `radical_id`, '收' AS `hanzi_char` UNION ALL
  SELECT 837 AS `hsk_source_id`, 66 AS `radical_id`, '收' AS `hanzi_char` UNION ALL
  SELECT 837 AS `hsk_source_id`, 18 AS `radical_id`, '到' AS `hanzi_char` UNION ALL
  SELECT 837 AS `hsk_source_id`, 133 AS `radical_id`, '到' AS `hanzi_char` UNION ALL
  SELECT 838 AS `hsk_source_id`, 14 AS `radical_id`, '受' AS `hanzi_char` UNION ALL
  SELECT 838 AS `hsk_source_id`, 29 AS `radical_id`, '受' AS `hanzi_char` UNION ALL
  SELECT 838 AS `hsk_source_id`, 87 AS `radical_id`, '受' AS `hanzi_char` UNION ALL
  SELECT 839 AS `hsk_source_id`, 2 AS `radical_id`, '瘦' AS `hanzi_char` UNION ALL
  SELECT 839 AS `hsk_source_id`, 29 AS `radical_id`, '瘦' AS `hanzi_char` UNION ALL
  SELECT 839 AS `hsk_source_id`, 104 AS `radical_id`, '瘦' AS `hanzi_char` UNION ALL
  SELECT 839 AS `hsk_source_id`, 134 AS `radical_id`, '瘦' AS `hanzi_char` UNION ALL
  SELECT 840 AS `hsk_source_id`, 14 AS `radical_id`, '受' AS `hanzi_char` UNION ALL
  SELECT 840 AS `hsk_source_id`, 29 AS `radical_id`, '受' AS `hanzi_char` UNION ALL
  SELECT 840 AS `hsk_source_id`, 87 AS `radical_id`, '受' AS `hanzi_char` UNION ALL
  SELECT 840 AS `hsk_source_id`, 18 AS `radical_id`, '到' AS `hanzi_char` UNION ALL
  SELECT 840 AS `hsk_source_id`, 133 AS `radical_id`, '到' AS `hanzi_char` UNION ALL
  SELECT 841 AS `hsk_source_id`, 1 AS `radical_id`, '叔' AS `hanzi_char` UNION ALL
  SELECT 841 AS `hsk_source_id`, 2 AS `radical_id`, '叔' AS `hanzi_char` UNION ALL
  SELECT 841 AS `hsk_source_id`, 29 AS `radical_id`, '叔' AS `hanzi_char` UNION ALL
  SELECT 841 AS `hsk_source_id`, 42 AS `radical_id`, '叔' AS `hanzi_char` UNION ALL
  SELECT 843 AS `hsk_source_id`, 38 AS `radical_id`, '数' AS `hanzi_char` UNION ALL
  SELECT 843 AS `hsk_source_id`, 66 AS `radical_id`, '数' AS `hanzi_char` UNION ALL
  SELECT 843 AS `hsk_source_id`, 119 AS `radical_id`, '数' AS `hanzi_char` UNION ALL
  SELECT 843 AS `hsk_source_id`, 39 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 843 AS `hsk_source_id`, 42 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 843 AS `hsk_source_id`, 14 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 844 AS `hsk_source_id`, 18 AS `radical_id`, '刷' AS `hanzi_char` UNION ALL
  SELECT 844 AS `hsk_source_id`, 44 AS `radical_id`, '刷' AS `hanzi_char` UNION ALL
  SELECT 844 AS `hsk_source_id`, 50 AS `radical_id`, '刷' AS `hanzi_char` UNION ALL
  SELECT 845 AS `hsk_source_id`, 29 AS `radical_id`, '双' AS `hanzi_char` UNION ALL
  SELECT 846 AS `hsk_source_id`, 85 AS `radical_id`, '水' AS `hanzi_char` UNION ALL
  SELECT 846 AS `hsk_source_id`, 3 AS `radical_id`, '平' AS `hanzi_char` UNION ALL
  SELECT 846 AS `hsk_source_id`, 51 AS `radical_id`, '平' AS `hanzi_char` UNION ALL
  SELECT 846 AS `hsk_source_id`, 53 AS `radical_id`, '平' AS `hanzi_char` UNION ALL
  SELECT 847 AS `hsk_source_id`, 30 AS `radical_id`, '司' AS `hanzi_char` UNION ALL
  SELECT 847 AS `hsk_source_id`, 75 AS `radical_id`, '机' AS `hanzi_char` UNION ALL
  SELECT 847 AS `hsk_source_id`, 16 AS `radical_id`, '机' AS `hanzi_char` UNION ALL
  SELECT 848 AS `hsk_source_id`, 31 AS `radical_id`, '四' AS `hanzi_char` UNION ALL
  SELECT 848 AS `hsk_source_id`, 10 AS `radical_id`, '四' AS `hanzi_char` UNION ALL
  SELECT 848 AS `hsk_source_id`, 39 AS `radical_id`, '季' AS `hanzi_char` UNION ALL
  SELECT 848 AS `hsk_source_id`, 115 AS `radical_id`, '季' AS `hanzi_char` UNION ALL
  SELECT 849 AS `hsk_source_id`, 37 AS `radical_id`, '太' AS `hanzi_char` UNION ALL
  SELECT 849 AS `hsk_source_id`, 3 AS `radical_id`, '太' AS `hanzi_char` UNION ALL
  SELECT 849 AS `hsk_source_id`, 72 AS `radical_id`, '阳' AS `hanzi_char` UNION ALL
  SELECT 849 AS `hsk_source_id`, 170 AS `radical_id`, '阳' AS `hanzi_char` UNION ALL
  SELECT 850 AS `hsk_source_id`, 2 AS `radical_id`, '糖' AS `hanzi_char` UNION ALL
  SELECT 850 AS `hsk_source_id`, 30 AS `radical_id`, '糖' AS `hanzi_char` UNION ALL
  SELECT 850 AS `hsk_source_id`, 53 AS `radical_id`, '糖' AS `hanzi_char` UNION ALL
  SELECT 850 AS `hsk_source_id`, 58 AS `radical_id`, '糖' AS `hanzi_char` UNION ALL
  SELECT 850 AS `hsk_source_id`, 119 AS `radical_id`, '糖' AS `hanzi_char` UNION ALL
  SELECT 851 AS `hsk_source_id`, 32 AS `radical_id`, '特' AS `hanzi_char` UNION ALL
  SELECT 851 AS `hsk_source_id`, 41 AS `radical_id`, '特' AS `hanzi_char` UNION ALL
  SELECT 851 AS `hsk_source_id`, 93 AS `radical_id`, '特' AS `hanzi_char` UNION ALL
  SELECT 851 AS `hsk_source_id`, 18 AS `radical_id`, '别' AS `hanzi_char` UNION ALL
  SELECT 851 AS `hsk_source_id`, 30 AS `radical_id`, '别' AS `hanzi_char` UNION ALL
  SELECT 851 AS `hsk_source_id`, 19 AS `radical_id`, '别' AS `hanzi_char` UNION ALL
  SELECT 852 AS `hsk_source_id`, 64 AS `radical_id`, '提' AS `hanzi_char` UNION ALL
  SELECT 852 AS `hsk_source_id`, 72 AS `radical_id`, '提' AS `hanzi_char` UNION ALL
  SELECT 852 AS `hsk_source_id`, 103 AS `radical_id`, '提' AS `hanzi_char` UNION ALL
  SELECT 852 AS `hsk_source_id`, 189 AS `radical_id`, '高' AS `hanzi_char` UNION ALL
  SELECT 853 AS `hsk_source_id`, 9 AS `radical_id`, '体' AS `hanzi_char` UNION ALL
  SELECT 853 AS `hsk_source_id`, 75 AS `radical_id`, '体' AS `hanzi_char` UNION ALL
  SELECT 853 AS `hsk_source_id`, 1 AS `radical_id`, '体' AS `hanzi_char` UNION ALL
  SELECT 853 AS `hsk_source_id`, 8 AS `radical_id`, '育' AS `hanzi_char` UNION ALL
  SELECT 853 AS `hsk_source_id`, 28 AS `radical_id`, '育' AS `hanzi_char` UNION ALL
  SELECT 853 AS `hsk_source_id`, 130 AS `radical_id`, '育' AS `hanzi_char` UNION ALL
  SELECT 854 AS `hsk_source_id`, 9 AS `radical_id`, '体' AS `hanzi_char` UNION ALL
  SELECT 854 AS `hsk_source_id`, 75 AS `radical_id`, '体' AS `hanzi_char` UNION ALL
  SELECT 854 AS `hsk_source_id`, 1 AS `radical_id`, '体' AS `hanzi_char` UNION ALL
  SELECT 854 AS `hsk_source_id`, 8 AS `radical_id`, '育' AS `hanzi_char` UNION ALL
  SELECT 854 AS `hsk_source_id`, 28 AS `radical_id`, '育' AS `hanzi_char` UNION ALL
  SELECT 854 AS `hsk_source_id`, 130 AS `radical_id`, '育' AS `hanzi_char` UNION ALL
  SELECT 854 AS `hsk_source_id`, 184 AS `radical_id`, '馆' AS `hanzi_char` UNION ALL
  SELECT 854 AS `hsk_source_id`, 40 AS `radical_id`, '馆' AS `hanzi_char` UNION ALL
  SELECT 855 AS `hsk_source_id`, 99 AS `radical_id`, '甜' AS `hanzi_char` UNION ALL
  SELECT 855 AS `hsk_source_id`, 135 AS `radical_id`, '甜' AS `hanzi_char` UNION ALL
  SELECT 856 AS `hsk_source_id`, 10 AS `radical_id`, '跳' AS `hanzi_char` UNION ALL
  SELECT 856 AS `hsk_source_id`, 157 AS `radical_id`, '跳' AS `hanzi_char` UNION ALL
  SELECT 857 AS `hsk_source_id`, 30 AS `radical_id`, '听' AS `hanzi_char` UNION ALL
  SELECT 857 AS `hsk_source_id`, 69 AS `radical_id`, '听' AS `hanzi_char` UNION ALL
  SELECT 857 AS `hsk_source_id`, 149 AS `radical_id`, '说' AS `hanzi_char` UNION ALL
  SELECT 857 AS `hsk_source_id`, 10 AS `radical_id`, '说' AS `hanzi_char` UNION ALL
  SELECT 857 AS `hsk_source_id`, 12 AS `radical_id`, '说' AS `hanzi_char` UNION ALL
  SELECT 858 AS `hsk_source_id`, 4 AS `radical_id`, '挺' AS `hanzi_char` UNION ALL
  SELECT 858 AS `hsk_source_id`, 33 AS `radical_id`, '挺' AS `hanzi_char` UNION ALL
  SELECT 858 AS `hsk_source_id`, 54 AS `radical_id`, '挺' AS `hanzi_char` UNION ALL
  SELECT 858 AS `hsk_source_id`, 64 AS `radical_id`, '挺' AS `hanzi_char` UNION ALL
  SELECT 859 AS `hsk_source_id`, 30 AS `radical_id`, '同' AS `hanzi_char` UNION ALL
  SELECT 859 AS `hsk_source_id`, 16 AS `radical_id`, '同' AS `hanzi_char` UNION ALL
  SELECT 859 AS `hsk_source_id`, 3 AS `radical_id`, '同' AS `hanzi_char` UNION ALL
  SELECT 859 AS `hsk_source_id`, 6 AS `radical_id`, '事' AS `hanzi_char` UNION ALL
  SELECT 859 AS `hsk_source_id`, 1 AS `radical_id`, '事' AS `hanzi_char` UNION ALL
  SELECT 859 AS `hsk_source_id`, 58 AS `radical_id`, '事' AS `hanzi_char` UNION ALL
  SELECT 860 AS `hsk_source_id`, 30 AS `radical_id`, '同' AS `hanzi_char` UNION ALL
  SELECT 860 AS `hsk_source_id`, 16 AS `radical_id`, '同' AS `hanzi_char` UNION ALL
  SELECT 860 AS `hsk_source_id`, 3 AS `radical_id`, '同' AS `hanzi_char` UNION ALL
  SELECT 860 AS `hsk_source_id`, 61 AS `radical_id`, '意' AS `hanzi_char` UNION ALL
  SELECT 860 AS `hsk_source_id`, 180 AS `radical_id`, '意' AS `hanzi_char` UNION ALL
  SELECT 861 AS `hsk_source_id`, 37 AS `radical_id`, '头' AS `hanzi_char` UNION ALL
  SELECT 861 AS `hsk_source_id`, 29 AS `radical_id`, '发' AS `hanzi_char` UNION ALL
  SELECT 862 AS `hsk_source_id`, 94 AS `radical_id`, '突' AS `hanzi_char` UNION ALL
  SELECT 862 AS `hsk_source_id`, 116 AS `radical_id`, '突' AS `hanzi_char` UNION ALL
  SELECT 862 AS `hsk_source_id`, 86 AS `radical_id`, '然' AS `hanzi_char` UNION ALL
  SELECT 862 AS `hsk_source_id`, 130 AS `radical_id`, '然' AS `hanzi_char` UNION ALL
  SELECT 864 AS `hsk_source_id`, 130 AS `radical_id`, '腿' AS `hanzi_char` UNION ALL
  SELECT 864 AS `hsk_source_id`, 138 AS `radical_id`, '腿' AS `hanzi_char` UNION ALL
  SELECT 864 AS `hsk_source_id`, 162 AS `radical_id`, '腿' AS `hanzi_char` UNION ALL
  SELECT 865 AS `hsk_source_id`, 36 AS `radical_id`, '外' AS `hanzi_char` UNION ALL
  SELECT 865 AS `hsk_source_id`, 25 AS `radical_id`, '外' AS `hanzi_char` UNION ALL
  SELECT 865 AS `hsk_source_id`, 32 AS `radical_id`, '地' AS `hanzi_char` UNION ALL
  SELECT 865 AS `hsk_source_id`, 5 AS `radical_id`, '地' AS `hanzi_char` UNION ALL
  SELECT 866 AS `hsk_source_id`, 36 AS `radical_id`, '外' AS `hanzi_char` UNION ALL
  SELECT 866 AS `hsk_source_id`, 25 AS `radical_id`, '外' AS `hanzi_char` UNION ALL
  SELECT 866 AS `hsk_source_id`, 24 AS `radical_id`, '卖' AS `hanzi_char` UNION ALL
  SELECT 866 AS `hsk_source_id`, 37 AS `radical_id`, '卖' AS `hanzi_char` UNION ALL
  SELECT 868 AS `hsk_source_id`, 7 AS `radical_id`, '完' AS `hanzi_char` UNION ALL
  SELECT 868 AS `hsk_source_id`, 10 AS `radical_id`, '完' AS `hanzi_char` UNION ALL
  SELECT 868 AS `hsk_source_id`, 40 AS `radical_id`, '完' AS `hanzi_char` UNION ALL
  SELECT 868 AS `hsk_source_id`, 1 AS `radical_id`, '成' AS `hanzi_char` UNION ALL
  SELECT 868 AS `hsk_source_id`, 62 AS `radical_id`, '成' AS `hanzi_char` UNION ALL
  SELECT 869 AS `hsk_source_id`, 36 AS `radical_id`, '碗' AS `hanzi_char` UNION ALL
  SELECT 869 AS `hsk_source_id`, 40 AS `radical_id`, '碗' AS `hanzi_char` UNION ALL
  SELECT 869 AS `hsk_source_id`, 112 AS `radical_id`, '碗' AS `hanzi_char` UNION ALL
  SELECT 870 AS `hsk_source_id`, 72 AS `radical_id`, '晚' AS `hanzi_char` UNION ALL
  SELECT 870 AS `hsk_source_id`, 10 AS `radical_id`, '晚' AS `hanzi_char` UNION ALL
  SELECT 870 AS `hsk_source_id`, 18 AS `radical_id`, '晚' AS `hanzi_char` UNION ALL
  SELECT 870 AS `hsk_source_id`, 30 AS `radical_id`, '晚' AS `hanzi_char` UNION ALL
  SELECT 870 AS `hsk_source_id`, 86 AS `radical_id`, '点' AS `hanzi_char` UNION ALL
  SELECT 870 AS `hsk_source_id`, 25 AS `radical_id`, '点' AS `hanzi_char` UNION ALL
  SELECT 871 AS `hsk_source_id`, 72 AS `radical_id`, '晚' AS `hanzi_char` UNION ALL
  SELECT 871 AS `hsk_source_id`, 10 AS `radical_id`, '晚' AS `hanzi_char` UNION ALL
  SELECT 871 AS `hsk_source_id`, 18 AS `radical_id`, '晚' AS `hanzi_char` UNION ALL
  SELECT 871 AS `hsk_source_id`, 30 AS `radical_id`, '晚' AS `hanzi_char` UNION ALL
  SELECT 871 AS `hsk_source_id`, 9 AS `radical_id`, '会' AS `hanzi_char` UNION ALL
  SELECT 871 AS `hsk_source_id`, 7 AS `radical_id`, '会' AS `hanzi_char` UNION ALL
  SELECT 871 AS `hsk_source_id`, 28 AS `radical_id`, '会' AS `hanzi_char` UNION ALL
  SELECT 872 AS `hsk_source_id`, 122 AS `radical_id`, '网' AS `hanzi_char` UNION ALL
  SELECT 872 AS `hsk_source_id`, 96 AS `radical_id`, '球' AS `hanzi_char` UNION ALL
  SELECT 872 AS `hsk_source_id`, 85 AS `radical_id`, '球' AS `hanzi_char` UNION ALL
  SELECT 872 AS `hsk_source_id`, 1 AS `radical_id`, '球' AS `hanzi_char` UNION ALL
  SELECT 873 AS `hsk_source_id`, 122 AS `radical_id`, '网' AS `hanzi_char` UNION ALL
  SELECT 873 AS `hsk_source_id`, 117 AS `radical_id`, '站' AS `hanzi_char` UNION ALL
  SELECT 873 AS `hsk_source_id`, 25 AS `radical_id`, '站' AS `hanzi_char` UNION ALL
  SELECT 873 AS `hsk_source_id`, 30 AS `radical_id`, '站' AS `hanzi_char` UNION ALL
  SELECT 875 AS `hsk_source_id`, 3 AS `radical_id`, '为' AS `hanzi_char` UNION ALL
  SELECT 875 AS `hsk_source_id`, 19 AS `radical_id`, '为' AS `hanzi_char` UNION ALL
  SELECT 876 AS `hsk_source_id`, 3 AS `radical_id`, '为' AS `hanzi_char` UNION ALL
  SELECT 876 AS `hsk_source_id`, 19 AS `radical_id`, '为' AS `hanzi_char` UNION ALL
  SELECT 876 AS `hsk_source_id`, 6 AS `radical_id`, '了' AS `hanzi_char` UNION ALL
  SELECT 876 AS `hsk_source_id`, 5 AS `radical_id`, '了' AS `hanzi_char` UNION ALL
  SELECT 877 AS `hsk_source_id`, 1 AS `radical_id`, '卫' AS `hanzi_char` UNION ALL
  SELECT 877 AS `hsk_source_id`, 100 AS `radical_id`, '生' AS `hanzi_char` UNION ALL
  SELECT 877 AS `hsk_source_id`, 169 AS `radical_id`, '间' AS `hanzi_char` UNION ALL
  SELECT 877 AS `hsk_source_id`, 72 AS `radical_id`, '间' AS `hanzi_char` UNION ALL
  SELECT 878 AS `hsk_source_id`, 67 AS `radical_id`, '文' AS `hanzi_char` UNION ALL
  SELECT 878 AS `hsk_source_id`, 9 AS `radical_id`, '化' AS `hanzi_char` UNION ALL
  SELECT 878 AS `hsk_source_id`, 21 AS `radical_id`, '化' AS `hanzi_char` UNION ALL
  SELECT 879 AS `hsk_source_id`, 44 AS `radical_id`, '屋' AS `hanzi_char` UNION ALL
  SELECT 879 AS `hsk_source_id`, 133 AS `radical_id`, '屋' AS `hanzi_char` UNION ALL
  SELECT 879 AS `hsk_source_id`, 39 AS `radical_id`, '子' AS `hanzi_char` UNION ALL
  SELECT 881 AS `hsk_source_id`, 146 AS `radical_id`, '西' AS `hanzi_char` UNION ALL
  SELECT 881 AS `hsk_source_id`, 10 AS `radical_id`, '西' AS `hanzi_char` UNION ALL
  SELECT 881 AS `hsk_source_id`, 31 AS `radical_id`, '西' AS `hanzi_char` UNION ALL
  SELECT 881 AS `hsk_source_id`, 21 AS `radical_id`, '北' AS `hanzi_char` UNION ALL
  SELECT 882 AS `hsk_source_id`, 146 AS `radical_id`, '西' AS `hanzi_char` UNION ALL
  SELECT 882 AS `hsk_source_id`, 10 AS `radical_id`, '西' AS `hanzi_char` UNION ALL
  SELECT 882 AS `hsk_source_id`, 31 AS `radical_id`, '西' AS `hanzi_char` UNION ALL
  SELECT 882 AS `hsk_source_id`, 70 AS `radical_id`, '方' AS `hanzi_char` UNION ALL
  SELECT 883 AS `hsk_source_id`, 146 AS `radical_id`, '西' AS `hanzi_char` UNION ALL
  SELECT 883 AS `hsk_source_id`, 10 AS `radical_id`, '西' AS `hanzi_char` UNION ALL
  SELECT 883 AS `hsk_source_id`, 31 AS `radical_id`, '西' AS `hanzi_char` UNION ALL
  SELECT 883 AS `hsk_source_id`, 97 AS `radical_id`, '瓜' AS `hanzi_char` UNION ALL
  SELECT 884 AS `hsk_source_id`, 146 AS `radical_id`, '西' AS `hanzi_char` UNION ALL
  SELECT 884 AS `hsk_source_id`, 10 AS `radical_id`, '西' AS `hanzi_char` UNION ALL
  SELECT 884 AS `hsk_source_id`, 31 AS `radical_id`, '西' AS `hanzi_char` UNION ALL
  SELECT 884 AS `hsk_source_id`, 24 AS `radical_id`, '南' AS `hanzi_char` UNION ALL
  SELECT 884 AS `hsk_source_id`, 13 AS `radical_id`, '南' AS `hanzi_char` UNION ALL
  SELECT 884 AS `hsk_source_id`, 12 AS `radical_id`, '南' AS `hanzi_char` UNION ALL
  SELECT 884 AS `hsk_source_id`, 51 AS `radical_id`, '南' AS `hanzi_char` UNION ALL
  SELECT 885 AS `hsk_source_id`, 15 AS `radical_id`, '习' AS `hanzi_char` UNION ALL
  SELECT 885 AS `hsk_source_id`, 24 AS `radical_id`, '惯' AS `hanzi_char` UNION ALL
  SELECT 885 AS `hsk_source_id`, 61 AS `radical_id`, '惯' AS `hanzi_char` UNION ALL
  SELECT 885 AS `hsk_source_id`, 80 AS `radical_id`, '惯' AS `hanzi_char` UNION ALL
  SELECT 885 AS `hsk_source_id`, 154 AS `radical_id`, '惯' AS `hanzi_char` UNION ALL
  SELECT 886 AS `hsk_source_id`, 30 AS `radical_id`, '喜' AS `hanzi_char` UNION ALL
  SELECT 886 AS `hsk_source_id`, 33 AS `radical_id`, '喜' AS `hanzi_char` UNION ALL
  SELECT 886 AS `hsk_source_id`, 32 AS `radical_id`, '喜' AS `hanzi_char` UNION ALL
  SELECT 886 AS `hsk_source_id`, 87 AS `radical_id`, '爱' AS `hanzi_char` UNION ALL
  SELECT 886 AS `hsk_source_id`, 14 AS `radical_id`, '爱' AS `hanzi_char` UNION ALL
  SELECT 886 AS `hsk_source_id`, 29 AS `radical_id`, '爱' AS `hanzi_char` UNION ALL
  SELECT 887 AS `hsk_source_id`, 85 AS `radical_id`, '洗' AS `hanzi_char` UNION ALL
  SELECT 887 AS `hsk_source_id`, 10 AS `radical_id`, '洗' AS `hanzi_char` UNION ALL
  SELECT 887 AS `hsk_source_id`, 32 AS `radical_id`, '洗' AS `hanzi_char` UNION ALL
  SELECT 887 AS `hsk_source_id`, 145 AS `radical_id`, '衣' AS `hanzi_char` UNION ALL
  SELECT 887 AS `hsk_source_id`, 75 AS `radical_id`, '机' AS `hanzi_char` UNION ALL
  SELECT 887 AS `hsk_source_id`, 16 AS `radical_id`, '机' AS `hanzi_char` UNION ALL
  SELECT 888 AS `hsk_source_id`, 85 AS `radical_id`, '洗' AS `hanzi_char` UNION ALL
  SELECT 888 AS `hsk_source_id`, 10 AS `radical_id`, '洗' AS `hanzi_char` UNION ALL
  SELECT 888 AS `hsk_source_id`, 32 AS `radical_id`, '洗' AS `hanzi_char` UNION ALL
  SELECT 888 AS `hsk_source_id`, 30 AS `radical_id`, '澡' AS `hanzi_char` UNION ALL
  SELECT 888 AS `hsk_source_id`, 75 AS `radical_id`, '澡' AS `hanzi_char` UNION ALL
  SELECT 889 AS `hsk_source_id`, 1 AS `radical_id`, '夏' AS `hanzi_char` UNION ALL
  SELECT 889 AS `hsk_source_id`, 34 AS `radical_id`, '夏' AS `hanzi_char` UNION ALL
  SELECT 889 AS `hsk_source_id`, 35 AS `radical_id`, '夏' AS `hanzi_char` UNION ALL
  SELECT 889 AS `hsk_source_id`, 132 AS `radical_id`, '夏' AS `hanzi_char` UNION ALL
  SELECT 889 AS `hsk_source_id`, 37 AS `radical_id`, '天' AS `hanzi_char` UNION ALL
  SELECT 891 AS `hsk_source_id`, 186 AS `radical_id`, '香' AS `hanzi_char` UNION ALL
  SELECT 891 AS `hsk_source_id`, 86 AS `radical_id`, '蕉' AS `hanzi_char` UNION ALL
  SELECT 891 AS `hsk_source_id`, 140 AS `radical_id`, '蕉' AS `hanzi_char` UNION ALL
  SELECT 891 AS `hsk_source_id`, 172 AS `radical_id`, '蕉' AS `hanzi_char` UNION ALL
  SELECT 892 AS `hsk_source_id`, 75 AS `radical_id`, '相' AS `hanzi_char` UNION ALL
  SELECT 892 AS `hsk_source_id`, 109 AS `radical_id`, '相' AS `hanzi_char` UNION ALL
  SELECT 892 AS `hsk_source_id`, 9 AS `radical_id`, '信' AS `hanzi_char` UNION ALL
  SELECT 892 AS `hsk_source_id`, 149 AS `radical_id`, '信' AS `hanzi_char` UNION ALL
  SELECT 893 AS `hsk_source_id`, 75 AS `radical_id`, '箱' AS `hanzi_char` UNION ALL
  SELECT 893 AS `hsk_source_id`, 109 AS `radical_id`, '箱' AS `hanzi_char` UNION ALL
  SELECT 893 AS `hsk_source_id`, 118 AS `radical_id`, '箱' AS `hanzi_char` UNION ALL
  SELECT 893 AS `hsk_source_id`, 39 AS `radical_id`, '子' AS `hanzi_char` UNION ALL
  SELECT 894 AS `hsk_source_id`, 30 AS `radical_id`, '向' AS `hanzi_char` UNION ALL
  SELECT 895 AS `hsk_source_id`, 9 AS `radical_id`, '像' AS `hanzi_char` UNION ALL
  SELECT 895 AS `hsk_source_id`, 18 AS `radical_id`, '像' AS `hanzi_char` UNION ALL
  SELECT 895 AS `hsk_source_id`, 30 AS `radical_id`, '像' AS `hanzi_char` UNION ALL
  SELECT 895 AS `hsk_source_id`, 152 AS `radical_id`, '像' AS `hanzi_char` UNION ALL
  SELECT 896 AS `hsk_source_id`, 75 AS `radical_id`, '相' AS `hanzi_char` UNION ALL
  SELECT 896 AS `hsk_source_id`, 109 AS `radical_id`, '相' AS `hanzi_char` UNION ALL
  SELECT 896 AS `hsk_source_id`, 16 AS `radical_id`, '机' AS `hanzi_char` UNION ALL
  SELECT 897 AS `hsk_source_id`, 42 AS `radical_id`, '小' AS `hanzi_char` UNION ALL
  SELECT 897 AS `hsk_source_id`, 4 AS `radical_id`, '区' AS `hanzi_char` UNION ALL
  SELECT 897 AS `hsk_source_id`, 23 AS `radical_id`, '区' AS `hanzi_char` UNION ALL
  SELECT 898 AS `hsk_source_id`, 42 AS `radical_id`, '小' AS `hanzi_char` UNION ALL
  SELECT 898 AS `hsk_source_id`, 61 AS `radical_id`, '心' AS `hanzi_char` UNION ALL
  SELECT 899 AS `hsk_source_id`, 75 AS `radical_id`, '校' AS `hanzi_char` UNION ALL
  SELECT 899 AS `hsk_source_id`, 8 AS `radical_id`, '校' AS `hanzi_char` UNION ALL
  SELECT 899 AS `hsk_source_id`, 7 AS `radical_id`, '园' AS `hanzi_char` UNION ALL
  SELECT 899 AS `hsk_source_id`, 10 AS `radical_id`, '园' AS `hanzi_char` UNION ALL
  SELECT 899 AS `hsk_source_id`, 31 AS `radical_id`, '园' AS `hanzi_char` UNION ALL
  SELECT 900 AS `hsk_source_id`, 75 AS `radical_id`, '校' AS `hanzi_char` UNION ALL
  SELECT 900 AS `hsk_source_id`, 8 AS `radical_id`, '校' AS `hanzi_char` UNION ALL
  SELECT 900 AS `hsk_source_id`, 168 AS `radical_id`, '长' AS `hanzi_char` UNION ALL
  SELECT 901 AS `hsk_source_id`, 32 AS `radical_id`, '鞋' AS `hanzi_char` UNION ALL
  SELECT 901 AS `hsk_source_id`, 177 AS `radical_id`, '鞋' AS `hanzi_char` UNION ALL
  SELECT 902 AS `hsk_source_id`, 61 AS `radical_id`, '心' AS `hanzi_char` UNION ALL
  SELECT 902 AS `hsk_source_id`, 166 AS `radical_id`, '里' AS `hanzi_char` UNION ALL
  SELECT 904 AS `hsk_source_id`, 69 AS `radical_id`, '新' AS `hanzi_char` UNION ALL
  SELECT 904 AS `hsk_source_id`, 117 AS `radical_id`, '新' AS `hanzi_char` UNION ALL
  SELECT 904 AS `hsk_source_id`, 1 AS `radical_id`, '新' AS `hanzi_char` UNION ALL
  SELECT 904 AS `hsk_source_id`, 42 AS `radical_id`, '新' AS `hanzi_char` UNION ALL
  SELECT 904 AS `hsk_source_id`, 128 AS `radical_id`, '闻' AS `hanzi_char` UNION ALL
  SELECT 904 AS `hsk_source_id`, 169 AS `radical_id`, '闻' AS `hanzi_char` UNION ALL
  SELECT 905 AS `hsk_source_id`, 69 AS `radical_id`, '新' AS `hanzi_char` UNION ALL
  SELECT 905 AS `hsk_source_id`, 117 AS `radical_id`, '新' AS `hanzi_char` UNION ALL
  SELECT 905 AS `hsk_source_id`, 1 AS `radical_id`, '新' AS `hanzi_char` UNION ALL
  SELECT 905 AS `hsk_source_id`, 42 AS `radical_id`, '新' AS `hanzi_char` UNION ALL
  SELECT 905 AS `hsk_source_id`, 123 AS `radical_id`, '鲜' AS `hanzi_char` UNION ALL
  SELECT 905 AS `hsk_source_id`, 195 AS `radical_id`, '鲜' AS `hanzi_char` UNION ALL
  SELECT 906 AS `hsk_source_id`, 9 AS `radical_id`, '信' AS `hanzi_char` UNION ALL
  SELECT 906 AS `hsk_source_id`, 149 AS `radical_id`, '信' AS `hanzi_char` UNION ALL
  SELECT 907 AS `hsk_source_id`, 9 AS `radical_id`, '信' AS `hanzi_char` UNION ALL
  SELECT 907 AS `hsk_source_id`, 149 AS `radical_id`, '信' AS `hanzi_char` UNION ALL
  SELECT 907 AS `hsk_source_id`, 101 AS `radical_id`, '用' AS `hanzi_char` UNION ALL
  SELECT 907 AS `hsk_source_id`, 1 AS `radical_id`, '卡' AS `hanzi_char` UNION ALL
  SELECT 907 AS `hsk_source_id`, 2 AS `radical_id`, '卡' AS `hanzi_char` UNION ALL
  SELECT 907 AS `hsk_source_id`, 25 AS `radical_id`, '卡' AS `hanzi_char` UNION ALL
  SELECT 909 AS `hsk_source_id`, 144 AS `radical_id`, '行' AS `hanzi_char` UNION ALL
  SELECT 909 AS `hsk_source_id`, 39 AS `radical_id`, '李' AS `hanzi_char` UNION ALL
  SELECT 909 AS `hsk_source_id`, 75 AS `radical_id`, '李' AS `hanzi_char` UNION ALL
  SELECT 910 AS `hsk_source_id`, 12 AS `radical_id`, '兴' AS `hanzi_char` UNION ALL
  SELECT 910 AS `hsk_source_id`, 42 AS `radical_id`, '兴' AS `hanzi_char` UNION ALL
  SELECT 910 AS `hsk_source_id`, 1 AS `radical_id`, '兴' AS `hanzi_char` UNION ALL
  SELECT 910 AS `hsk_source_id`, 29 AS `radical_id`, '趣' AS `hanzi_char` UNION ALL
  SELECT 910 AS `hsk_source_id`, 128 AS `radical_id`, '趣' AS `hanzi_char` UNION ALL
  SELECT 910 AS `hsk_source_id`, 156 AS `radical_id`, '趣' AS `hanzi_char` UNION ALL
  SELECT 911 AS `hsk_source_id`, 9 AS `radical_id`, '休' AS `hanzi_char` UNION ALL
  SELECT 911 AS `hsk_source_id`, 75 AS `radical_id`, '休' AS `hanzi_char` UNION ALL
  SELECT 911 AS `hsk_source_id`, 29 AS `radical_id`, '假' AS `hanzi_char` UNION ALL
  SELECT 912 AS `hsk_source_id`, 126 AS `radical_id`, '需' AS `hanzi_char` UNION ALL
  SELECT 912 AS `hsk_source_id`, 173 AS `radical_id`, '需' AS `hanzi_char` UNION ALL
  SELECT 912 AS `hsk_source_id`, 146 AS `radical_id`, '要' AS `hanzi_char` UNION ALL
  SELECT 912 AS `hsk_source_id`, 38 AS `radical_id`, '要' AS `hanzi_char` UNION ALL
  SELECT 913 AS `hsk_source_id`, 10 AS `radical_id`, '选' AS `hanzi_char` UNION ALL
  SELECT 913 AS `hsk_source_id`, 32 AS `radical_id`, '选' AS `hanzi_char` UNION ALL
  SELECT 913 AS `hsk_source_id`, 162 AS `radical_id`, '选' AS `hanzi_char` UNION ALL
  SELECT 914 AS `hsk_source_id`, 10 AS `radical_id`, '选' AS `hanzi_char` UNION ALL
  SELECT 914 AS `hsk_source_id`, 32 AS `radical_id`, '选' AS `hanzi_char` UNION ALL
  SELECT 914 AS `hsk_source_id`, 162 AS `radical_id`, '选' AS `hanzi_char` UNION ALL
  SELECT 914 AS `hsk_source_id`, 64 AS `radical_id`, '择' AS `hanzi_char` UNION ALL
  SELECT 915 AS `hsk_source_id`, 39 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 915 AS `hsk_source_id`, 42 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 915 AS `hsk_source_id`, 14 AS `radical_id`, '学' AS `hanzi_char` UNION ALL
  SELECT 915 AS `hsk_source_id`, 74 AS `radical_id`, '期' AS `hanzi_char` UNION ALL
  SELECT 915 AS `hsk_source_id`, 12 AS `radical_id`, '期' AS `hanzi_char` UNION ALL
  SELECT 915 AS `hsk_source_id`, 99 AS `radical_id`, '期' AS `hanzi_char` UNION ALL
  SELECT 915 AS `hsk_source_id`, 1 AS `radical_id`, '期' AS `hanzi_char` UNION ALL
  SELECT 916 AS `hsk_source_id`, 92 AS `radical_id`, '牙' AS `hanzi_char` UNION ALL
  SELECT 917 AS `hsk_source_id`, 92 AS `radical_id`, '牙' AS `hanzi_char` UNION ALL
  SELECT 917 AS `hsk_source_id`, 18 AS `radical_id`, '刷' AS `hanzi_char` UNION ALL
  SELECT 917 AS `hsk_source_id`, 44 AS `radical_id`, '刷' AS `hanzi_char` UNION ALL
  SELECT 917 AS `hsk_source_id`, 50 AS `radical_id`, '刷' AS `hanzi_char` UNION ALL
  SELECT 918 AS `hsk_source_id`, 123 AS `radical_id`, '羊' AS `hanzi_char` UNION ALL
  SELECT 919 AS `hsk_source_id`, 10 AS `radical_id`, '养' AS `hanzi_char` UNION ALL
  SELECT 919 AS `hsk_source_id`, 123 AS `radical_id`, '养' AS `hanzi_char` UNION ALL
  SELECT 920 AS `hsk_source_id`, 146 AS `radical_id`, '要' AS `hanzi_char` UNION ALL
  SELECT 920 AS `hsk_source_id`, 38 AS `radical_id`, '要' AS `hanzi_char` UNION ALL
  SELECT 920 AS `hsk_source_id`, 1 AS `radical_id`, '求' AS `hanzi_char` UNION ALL
  SELECT 920 AS `hsk_source_id`, 85 AS `radical_id`, '求' AS `hanzi_char` UNION ALL
  SELECT 922 AS `hsk_source_id`, 1 AS `radical_id`, '一' AS `hanzi_char` UNION ALL
  SELECT 922 AS `hsk_source_id`, 40 AS `radical_id`, '定' AS `hanzi_char` UNION ALL
  SELECT 922 AS `hsk_source_id`, 103 AS `radical_id`, '定' AS `hanzi_char` UNION ALL
  SELECT 923 AS `hsk_source_id`, 1 AS `radical_id`, '一' AS `hanzi_char` UNION ALL
  SELECT 923 AS `hsk_source_id`, 12 AS `radical_id`, '共' AS `hanzi_char` UNION ALL
  SELECT 923 AS `hsk_source_id`, 55 AS `radical_id`, '共' AS `hanzi_char` UNION ALL
  SELECT 926 AS `hsk_source_id`, 9 AS `radical_id`, '以' AS `hanzi_char` UNION ALL
  SELECT 926 AS `hsk_source_id`, 30 AS `radical_id`, '后' AS `hanzi_char` UNION ALL
  SELECT 927 AS `hsk_source_id`, 9 AS `radical_id`, '以' AS `hanzi_char` UNION ALL
  SELECT 927 AS `hsk_source_id`, 18 AS `radical_id`, '前' AS `hanzi_char` UNION ALL
  SELECT 927 AS `hsk_source_id`, 12 AS `radical_id`, '前' AS `hanzi_char` UNION ALL
  SELECT 927 AS `hsk_source_id`, 1 AS `radical_id`, '前' AS `hanzi_char` UNION ALL
  SELECT 927 AS `hsk_source_id`, 74 AS `radical_id`, '前' AS `hanzi_char` UNION ALL
  SELECT 928 AS `hsk_source_id`, 9 AS `radical_id`, '以' AS `hanzi_char` UNION ALL
  SELECT 928 AS `hsk_source_id`, 1 AS `radical_id`, '上' AS `hanzi_char` UNION ALL
  SELECT 928 AS `hsk_source_id`, 25 AS `radical_id`, '上' AS `hanzi_char` UNION ALL
  SELECT 929 AS `hsk_source_id`, 9 AS `radical_id`, '以' AS `hanzi_char` UNION ALL
  SELECT 929 AS `hsk_source_id`, 36 AS `radical_id`, '外' AS `hanzi_char` UNION ALL
  SELECT 929 AS `hsk_source_id`, 25 AS `radical_id`, '外' AS `hanzi_char` UNION ALL
  SELECT 930 AS `hsk_source_id`, 9 AS `radical_id`, '以' AS `hanzi_char` UNION ALL
  SELECT 930 AS `hsk_source_id`, 3 AS `radical_id`, '为' AS `hanzi_char` UNION ALL
  SELECT 930 AS `hsk_source_id`, 19 AS `radical_id`, '为' AS `hanzi_char` UNION ALL
  SELECT 931 AS `hsk_source_id`, 9 AS `radical_id`, '以' AS `hanzi_char` UNION ALL
  SELECT 931 AS `hsk_source_id`, 1 AS `radical_id`, '下' AS `hanzi_char` UNION ALL
  SELECT 931 AS `hsk_source_id`, 25 AS `radical_id`, '下' AS `hanzi_char` UNION ALL
  SELECT 932 AS `hsk_source_id`, 1 AS `radical_id`, '一' AS `hanzi_char` UNION ALL
  SELECT 932 AS `hsk_source_id`, 79 AS `radical_id`, '般' AS `hanzi_char` UNION ALL
  SELECT 932 AS `hsk_source_id`, 137 AS `radical_id`, '般' AS `hanzi_char` UNION ALL
  SELECT 934 AS `hsk_source_id`, 1 AS `radical_id`, '一' AS `hanzi_char` UNION ALL
  SELECT 934 AS `hsk_source_id`, 24 AS `radical_id`, '直' AS `hanzi_char` UNION ALL
  SELECT 934 AS `hsk_source_id`, 109 AS `radical_id`, '直' AS `hanzi_char` UNION ALL
  SELECT 935 AS `hsk_source_id`, 180 AS `radical_id`, '音' AS `hanzi_char` UNION ALL
  SELECT 935 AS `hsk_source_id`, 4 AS `radical_id`, '乐' AS `hanzi_char` UNION ALL
  SELECT 935 AS `hsk_source_id`, 42 AS `radical_id`, '乐' AS `hanzi_char` UNION ALL
  SELECT 936 AS `hsk_source_id`, 138 AS `radical_id`, '银' AS `hanzi_char` UNION ALL
  SELECT 936 AS `hsk_source_id`, 167 AS `radical_id`, '银' AS `hanzi_char` UNION ALL
  SELECT 936 AS `hsk_source_id`, 144 AS `radical_id`, '行' AS `hanzi_char` UNION ALL
  SELECT 937 AS `hsk_source_id`, 138 AS `radical_id`, '银' AS `hanzi_char` UNION ALL
  SELECT 937 AS `hsk_source_id`, 167 AS `radical_id`, '银' AS `hanzi_char` UNION ALL
  SELECT 937 AS `hsk_source_id`, 144 AS `radical_id`, '行' AS `hanzi_char` UNION ALL
  SELECT 937 AS `hsk_source_id`, 1 AS `radical_id`, '卡' AS `hanzi_char` UNION ALL
  SELECT 937 AS `hsk_source_id`, 2 AS `radical_id`, '卡' AS `hanzi_char` UNION ALL
  SELECT 937 AS `hsk_source_id`, 25 AS `radical_id`, '卡' AS `hanzi_char` UNION ALL
  SELECT 938 AS `hsk_source_id`, 76 AS `radical_id`, '饮' AS `hanzi_char` UNION ALL
  SELECT 938 AS `hsk_source_id`, 184 AS `radical_id`, '饮' AS `hanzi_char` UNION ALL
  SELECT 938 AS `hsk_source_id`, 68 AS `radical_id`, '料' AS `hanzi_char` UNION ALL
  SELECT 938 AS `hsk_source_id`, 119 AS `radical_id`, '料' AS `hanzi_char` UNION ALL
  SELECT 939 AS `hsk_source_id`, 1 AS `radical_id`, '应' AS `hanzi_char` UNION ALL
  SELECT 939 AS `hsk_source_id`, 42 AS `radical_id`, '应' AS `hanzi_char` UNION ALL
  SELECT 939 AS `hsk_source_id`, 53 AS `radical_id`, '应' AS `hanzi_char` UNION ALL
  SELECT 939 AS `hsk_source_id`, 8 AS `radical_id`, '该' AS `hanzi_char` UNION ALL
  SELECT 939 AS `hsk_source_id`, 149 AS `radical_id`, '该' AS `hanzi_char` UNION ALL
  SELECT 940 AS `hsk_source_id`, 59 AS `radical_id`, '影' AS `hanzi_char` UNION ALL
  SELECT 940 AS `hsk_source_id`, 72 AS `radical_id`, '影' AS `hanzi_char` UNION ALL
  SELECT 940 AS `hsk_source_id`, 30 AS `radical_id`, '响' AS `hanzi_char` UNION ALL
  SELECT 942 AS `hsk_source_id`, 102 AS `radical_id`, '邮' AS `hanzi_char` UNION ALL
  SELECT 942 AS `hsk_source_id`, 163 AS `radical_id`, '邮' AS `hanzi_char` UNION ALL
  SELECT 942 AS `hsk_source_id`, 9 AS `radical_id`, '件' AS `hanzi_char` UNION ALL
  SELECT 942 AS `hsk_source_id`, 93 AS `radical_id`, '件' AS `hanzi_char` UNION ALL
  SELECT 943 AS `hsk_source_id`, 39 AS `radical_id`, '游' AS `hanzi_char`
) m
JOIN `VOCABULARY` v ON v.`hsk_source_id` = m.`hsk_source_id`;

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`)
SELECT v.`vocab_id`, m.`radical_id`, m.`hanzi_char`
FROM (
  SELECT 943 AS `hsk_source_id`, 70 AS `radical_id`, '游' AS `hanzi_char` UNION ALL
  SELECT 943 AS `hsk_source_id`, 85 AS `radical_id`, '游' AS `hanzi_char` UNION ALL
  SELECT 943 AS `hsk_source_id`, 40 AS `radical_id`, '客' AS `hanzi_char` UNION ALL
  SELECT 943 AS `hsk_source_id`, 30 AS `radical_id`, '客' AS `hanzi_char` UNION ALL
  SELECT 943 AS `hsk_source_id`, 34 AS `radical_id`, '客' AS `hanzi_char` UNION ALL
  SELECT 944 AS `hsk_source_id`, 39 AS `radical_id`, '游' AS `hanzi_char` UNION ALL
  SELECT 944 AS `hsk_source_id`, 70 AS `radical_id`, '游' AS `hanzi_char` UNION ALL
  SELECT 944 AS `hsk_source_id`, 85 AS `radical_id`, '游' AS `hanzi_char` UNION ALL
  SELECT 944 AS `hsk_source_id`, 29 AS `radical_id`, '戏' AS `hanzi_char` UNION ALL
  SELECT 944 AS `hsk_source_id`, 62 AS `radical_id`, '戏' AS `hanzi_char` UNION ALL
  SELECT 945 AS `hsk_source_id`, 102 AS `radical_id`, '邮' AS `hanzi_char` UNION ALL
  SELECT 945 AS `hsk_source_id`, 163 AS `radical_id`, '邮' AS `hanzi_char` UNION ALL
  SELECT 945 AS `hsk_source_id`, 75 AS `radical_id`, '箱' AS `hanzi_char` UNION ALL
  SELECT 945 AS `hsk_source_id`, 109 AS `radical_id`, '箱' AS `hanzi_char` UNION ALL
  SELECT 945 AS `hsk_source_id`, 118 AS `radical_id`, '箱' AS `hanzi_char` UNION ALL
  SELECT 946 AS `hsk_source_id`, 74 AS `radical_id`, '有' AS `hanzi_char` UNION ALL
  SELECT 946 AS `hsk_source_id`, 12 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 946 AS `hsk_source_id`, 37 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 946 AS `hsk_source_id`, 1 AS `radical_id`, '关' AS `hanzi_char` UNION ALL
  SELECT 949 AS `hsk_source_id`, 29 AS `radical_id`, '又' AS `hanzi_char` UNION ALL
  SELECT 950 AS `hsk_source_id`, 124 AS `radical_id`, '羽' AS `hanzi_char` UNION ALL
  SELECT 950 AS `hsk_source_id`, 82 AS `radical_id`, '毛' AS `hanzi_char` UNION ALL
  SELECT 950 AS `hsk_source_id`, 96 AS `radical_id`, '球' AS `hanzi_char` UNION ALL
  SELECT 950 AS `hsk_source_id`, 85 AS `radical_id`, '球' AS `hanzi_char` UNION ALL
  SELECT 950 AS `hsk_source_id`, 1 AS `radical_id`, '球' AS `hanzi_char` UNION ALL
  SELECT 951 AS `hsk_source_id`, 149 AS `radical_id`, '语' AS `hanzi_char` UNION ALL
  SELECT 951 AS `hsk_source_id`, 30 AS `radical_id`, '语' AS `hanzi_char` UNION ALL
  SELECT 952 AS `hsk_source_id`, 173 AS `radical_id`, '雨' AS `hanzi_char` UNION ALL
  SELECT 952 AS `hsk_source_id`, 145 AS `radical_id`, '衣' AS `hanzi_char` UNION ALL
  SELECT 953 AS `hsk_source_id`, 72 AS `radical_id`, '遇' AS `hanzi_char` UNION ALL
  SELECT 953 AS `hsk_source_id`, 114 AS `radical_id`, '遇' AS `hanzi_char` UNION ALL
  SELECT 953 AS `hsk_source_id`, 162 AS `radical_id`, '遇' AS `hanzi_char` UNION ALL
  SELECT 953 AS `hsk_source_id`, 18 AS `radical_id`, '到' AS `hanzi_char` UNION ALL
  SELECT 953 AS `hsk_source_id`, 133 AS `radical_id`, '到' AS `hanzi_char` UNION ALL
  SELECT 954 AS `hsk_source_id`, 72 AS `radical_id`, '遇' AS `hanzi_char` UNION ALL
  SELECT 954 AS `hsk_source_id`, 114 AS `radical_id`, '遇' AS `hanzi_char` UNION ALL
  SELECT 954 AS `hsk_source_id`, 162 AS `radical_id`, '遇' AS `hanzi_char` UNION ALL
  SELECT 954 AS `hsk_source_id`, 147 AS `radical_id`, '见' AS `hanzi_char` UNION ALL
  SELECT 954 AS `hsk_source_id`, 13 AS `radical_id`, '见' AS `hanzi_char` UNION ALL
  SELECT 954 AS `hsk_source_id`, 10 AS `radical_id`, '见' AS `hanzi_char` UNION ALL
  SELECT 955 AS `hsk_source_id`, 7 AS `radical_id`, '园' AS `hanzi_char` UNION ALL
  SELECT 955 AS `hsk_source_id`, 10 AS `radical_id`, '园' AS `hanzi_char` UNION ALL
  SELECT 955 AS `hsk_source_id`, 31 AS `radical_id`, '园' AS `hanzi_char` UNION ALL
  SELECT 956 AS `hsk_source_id`, 30 AS `radical_id`, '员' AS `hanzi_char` UNION ALL
  SELECT 956 AS `hsk_source_id`, 154 AS `radical_id`, '员' AS `hanzi_char` UNION ALL
  SELECT 957 AS `hsk_source_id`, 27 AS `radical_id`, '愿' AS `hanzi_char` UNION ALL
  SELECT 957 AS `hsk_source_id`, 61 AS `radical_id`, '愿' AS `hanzi_char` UNION ALL
  SELECT 957 AS `hsk_source_id`, 85 AS `radical_id`, '愿' AS `hanzi_char` UNION ALL
  SELECT 957 AS `hsk_source_id`, 106 AS `radical_id`, '愿' AS `hanzi_char` UNION ALL
  SELECT 957 AS `hsk_source_id`, 180 AS `radical_id`, '意' AS `hanzi_char` UNION ALL
  SELECT 958 AS `hsk_source_id`, 62 AS `radical_id`, '越' AS `hanzi_char` UNION ALL
  SELECT 958 AS `hsk_source_id`, 156 AS `radical_id`, '越' AS `hanzi_char` UNION ALL
  SELECT 959 AS `hsk_source_id`, 74 AS `radical_id`, '月' AS `hanzi_char` UNION ALL
  SELECT 959 AS `hsk_source_id`, 8 AS `radical_id`, '亮' AS `hanzi_char` UNION ALL
  SELECT 959 AS `hsk_source_id`, 14 AS `radical_id`, '亮' AS `hanzi_char` UNION ALL
  SELECT 959 AS `hsk_source_id`, 16 AS `radical_id`, '亮' AS `hanzi_char` UNION ALL
  SELECT 959 AS `hsk_source_id`, 30 AS `radical_id`, '亮' AS `hanzi_char` UNION ALL
  SELECT 960 AS `hsk_source_id`, 7 AS `radical_id`, '运' AS `hanzi_char` UNION ALL
  SELECT 960 AS `hsk_source_id`, 28 AS `radical_id`, '运' AS `hanzi_char` UNION ALL
  SELECT 960 AS `hsk_source_id`, 162 AS `radical_id`, '运' AS `hanzi_char` UNION ALL
  SELECT 960 AS `hsk_source_id`, 19 AS `radical_id`, '动' AS `hanzi_char` UNION ALL
  SELECT 960 AS `hsk_source_id`, 9 AS `radical_id`, '会' AS `hanzi_char` UNION ALL
  SELECT 961 AS `hsk_source_id`, 7 AS `radical_id`, '运' AS `hanzi_char` UNION ALL
  SELECT 961 AS `hsk_source_id`, 28 AS `radical_id`, '运' AS `hanzi_char` UNION ALL
  SELECT 961 AS `hsk_source_id`, 162 AS `radical_id`, '运' AS `hanzi_char` UNION ALL
  SELECT 961 AS `hsk_source_id`, 19 AS `radical_id`, '动' AS `hanzi_char` UNION ALL
  SELECT 961 AS `hsk_source_id`, 30 AS `radical_id`, '员' AS `hanzi_char` UNION ALL
  SELECT 961 AS `hsk_source_id`, 154 AS `radical_id`, '员' AS `hanzi_char` UNION ALL
  SELECT 962 AS `hsk_source_id`, 30 AS `radical_id`, '咱' AS `hanzi_char` UNION ALL
  SELECT 962 AS `hsk_source_id`, 132 AS `radical_id`, '咱' AS `hanzi_char` UNION ALL
  SELECT 962 AS `hsk_source_id`, 9 AS `radical_id`, '们' AS `hanzi_char` UNION ALL
  SELECT 962 AS `hsk_source_id`, 169 AS `radical_id`, '们' AS `hanzi_char` UNION ALL
  SELECT 963 AS `hsk_source_id`, 32 AS `radical_id`, '脏' AS `hanzi_char` UNION ALL
  SELECT 963 AS `hsk_source_id`, 53 AS `radical_id`, '脏' AS `hanzi_char` UNION ALL
  SELECT 963 AS `hsk_source_id`, 130 AS `radical_id`, '脏' AS `hanzi_char` UNION ALL
  SELECT 964 AS `hsk_source_id`, 61 AS `radical_id`, '怎' AS `hanzi_char` UNION ALL
  SELECT 964 AS `hsk_source_id`, 4 AS `radical_id`, '怎' AS `hanzi_char` UNION ALL
  SELECT 964 AS `hsk_source_id`, 1 AS `radical_id`, '怎' AS `hanzi_char` UNION ALL
  SELECT 964 AS `hsk_source_id`, 28 AS `radical_id`, '么' AS `hanzi_char` UNION ALL
  SELECT 964 AS `hsk_source_id`, 12 AS `radical_id`, '办' AS `hanzi_char` UNION ALL
  SELECT 964 AS `hsk_source_id`, 19 AS `radical_id`, '办' AS `hanzi_char` UNION ALL
  SELECT 965 AS `hsk_source_id`, 61 AS `radical_id`, '怎' AS `hanzi_char` UNION ALL
  SELECT 965 AS `hsk_source_id`, 4 AS `radical_id`, '怎' AS `hanzi_char` UNION ALL
  SELECT 965 AS `hsk_source_id`, 1 AS `radical_id`, '怎' AS `hanzi_char` UNION ALL
  SELECT 965 AS `hsk_source_id`, 75 AS `radical_id`, '样' AS `hanzi_char` UNION ALL
  SELECT 965 AS `hsk_source_id`, 123 AS `radical_id`, '样' AS `hanzi_char` UNION ALL
  SELECT 966 AS `hsk_source_id`, 117 AS `radical_id`, '站' AS `hanzi_char` UNION ALL
  SELECT 966 AS `hsk_source_id`, 25 AS `radical_id`, '站' AS `hanzi_char` UNION ALL
  SELECT 966 AS `hsk_source_id`, 30 AS `radical_id`, '站' AS `hanzi_char` UNION ALL
  SELECT 967 AS `hsk_source_id`, 57 AS `radical_id`, '张' AS `hanzi_char` UNION ALL
  SELECT 967 AS `hsk_source_id`, 168 AS `radical_id`, '张' AS `hanzi_char` UNION ALL
  SELECT 968 AS `hsk_source_id`, 168 AS `radical_id`, '长' AS `hanzi_char` UNION ALL
  SELECT 969 AS `hsk_source_id`, 109 AS `radical_id`, '着' AS `hanzi_char` UNION ALL
  SELECT 969 AS `hsk_source_id`, 123 AS `radical_id`, '着' AS `hanzi_char` UNION ALL
  SELECT 969 AS `hsk_source_id`, 18 AS `radical_id`, '急' AS `hanzi_char` UNION ALL
  SELECT 969 AS `hsk_source_id`, 58 AS `radical_id`, '急' AS `hanzi_char` UNION ALL
  SELECT 969 AS `hsk_source_id`, 61 AS `radical_id`, '急' AS `hanzi_char` UNION ALL
  SELECT 970 AS `hsk_source_id`, 18 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 970 AS `hsk_source_id`, 30 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 970 AS `hsk_source_id`, 72 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 970 AS `hsk_source_id`, 86 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 971 AS `hsk_source_id`, 18 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 971 AS `hsk_source_id`, 30 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 971 AS `hsk_source_id`, 72 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 971 AS `hsk_source_id`, 86 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 971 AS `hsk_source_id`, 27 AS `radical_id`, '顾' AS `hanzi_char` UNION ALL
  SELECT 971 AS `hsk_source_id`, 181 AS `radical_id`, '顾' AS `hanzi_char` UNION ALL
  SELECT 972 AS `hsk_source_id`, 18 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 972 AS `hsk_source_id`, 30 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 972 AS `hsk_source_id`, 72 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 972 AS `hsk_source_id`, 86 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 972 AS `hsk_source_id`, 91 AS `radical_id`, '片' AS `hanzi_char` UNION ALL
  SELECT 973 AS `hsk_source_id`, 18 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 973 AS `hsk_source_id`, 30 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 973 AS `hsk_source_id`, 72 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 973 AS `hsk_source_id`, 86 AS `radical_id`, '照' AS `hanzi_char` UNION ALL
  SELECT 973 AS `hsk_source_id`, 75 AS `radical_id`, '相' AS `hanzi_char` UNION ALL
  SELECT 973 AS `hsk_source_id`, 109 AS `radical_id`, '相' AS `hanzi_char` UNION ALL
  SELECT 974 AS `hsk_source_id`, 1 AS `radical_id`, '直' AS `hanzi_char` UNION ALL
  SELECT 974 AS `hsk_source_id`, 24 AS `radical_id`, '直' AS `hanzi_char` UNION ALL
  SELECT 974 AS `hsk_source_id`, 109 AS `radical_id`, '直' AS `hanzi_char` UNION ALL
  SELECT 974 AS `hsk_source_id`, 18 AS `radical_id`, '到' AS `hanzi_char` UNION ALL
  SELECT 974 AS `hsk_source_id`, 133 AS `radical_id`, '到' AS `hanzi_char` UNION ALL
  SELECT 975 AS `hsk_source_id`, 12 AS `radical_id`, '只' AS `hanzi_char` UNION ALL
  SELECT 975 AS `hsk_source_id`, 30 AS `radical_id`, '只' AS `hanzi_char` UNION ALL
  SELECT 976 AS `hsk_source_id`, 83 AS `radical_id`, '纸' AS `hanzi_char` UNION ALL
  SELECT 976 AS `hsk_source_id`, 120 AS `radical_id`, '纸' AS `hanzi_char` UNION ALL
  SELECT 977 AS `hsk_source_id`, 12 AS `radical_id`, '只' AS `hanzi_char` UNION ALL
  SELECT 977 AS `hsk_source_id`, 30 AS `radical_id`, '只' AS `hanzi_char` UNION ALL
  SELECT 977 AS `hsk_source_id`, 130 AS `radical_id`, '能' AS `hanzi_char` UNION ALL
  SELECT 977 AS `hsk_source_id`, 28 AS `radical_id`, '能' AS `hanzi_char` UNION ALL
  SELECT 977 AS `hsk_source_id`, 21 AS `radical_id`, '能' AS `hanzi_char` UNION ALL
  SELECT 978 AS `hsk_source_id`, 12 AS `radical_id`, '只' AS `hanzi_char` UNION ALL
  SELECT 978 AS `hsk_source_id`, 30 AS `radical_id`, '只' AS `hanzi_char` UNION ALL
  SELECT 978 AS `hsk_source_id`, 72 AS `radical_id`, '是' AS `hanzi_char` UNION ALL
  SELECT 978 AS `hsk_source_id`, 103 AS `radical_id`, '是' AS `hanzi_char` UNION ALL
  SELECT 979 AS `hsk_source_id`, 12 AS `radical_id`, '只' AS `hanzi_char` UNION ALL
  SELECT 979 AS `hsk_source_id`, 30 AS `radical_id`, '只' AS `hanzi_char` UNION ALL
  SELECT 979 AS `hsk_source_id`, 146 AS `radical_id`, '要' AS `hanzi_char` UNION ALL
  SELECT 979 AS `hsk_source_id`, 38 AS `radical_id`, '要' AS `hanzi_char` UNION ALL
  SELECT 980 AS `hsk_source_id`, 12 AS `radical_id`, '只' AS `hanzi_char` UNION ALL
  SELECT 980 AS `hsk_source_id`, 30 AS `radical_id`, '只' AS `hanzi_char` UNION ALL
  SELECT 980 AS `hsk_source_id`, 74 AS `radical_id`, '有' AS `hanzi_char` UNION ALL
  SELECT 983 AS `hsk_source_id`, 34 AS `radical_id`, '终' AS `hanzi_char` UNION ALL
  SELECT 983 AS `hsk_source_id`, 120 AS `radical_id`, '终' AS `hanzi_char` UNION ALL
  SELECT 983 AS `hsk_source_id`, 6 AS `radical_id`, '于' AS `hanzi_char` UNION ALL
  SELECT 983 AS `hsk_source_id`, 7 AS `radical_id`, '于' AS `hanzi_char` UNION ALL
  SELECT 984 AS `hsk_source_id`, 2 AS `radical_id`, '种' AS `hanzi_char` UNION ALL
  SELECT 984 AS `hsk_source_id`, 30 AS `radical_id`, '种' AS `hanzi_char` UNION ALL
  SELECT 984 AS `hsk_source_id`, 115 AS `radical_id`, '种' AS `hanzi_char` UNION ALL
  SELECT 986 AS `hsk_source_id`, 13 AS `radical_id`, '周' AS `hanzi_char` UNION ALL
  SELECT 986 AS `hsk_source_id`, 30 AS `radical_id`, '周' AS `hanzi_char` UNION ALL
  SELECT 986 AS `hsk_source_id`, 32 AS `radical_id`, '周' AS `hanzi_char` UNION ALL
  SELECT 986 AS `hsk_source_id`, 1 AS `radical_id`, '末' AS `hanzi_char` UNION ALL
  SELECT 986 AS `hsk_source_id`, 75 AS `radical_id`, '末' AS `hanzi_char` UNION ALL
  SELECT 987 AS `hsk_source_id`, 3 AS `radical_id`, '主' AS `hanzi_char` UNION ALL
  SELECT 987 AS `hsk_source_id`, 96 AS `radical_id`, '主' AS `hanzi_char` UNION ALL
  SELECT 987 AS `hsk_source_id`, 146 AS `radical_id`, '要' AS `hanzi_char` UNION ALL
  SELECT 987 AS `hsk_source_id`, 38 AS `radical_id`, '要' AS `hanzi_char` UNION ALL
  SELECT 988 AS `hsk_source_id`, 3 AS `radical_id`, '注' AS `hanzi_char` UNION ALL
  SELECT 988 AS `hsk_source_id`, 85 AS `radical_id`, '注' AS `hanzi_char` UNION ALL
  SELECT 988 AS `hsk_source_id`, 96 AS `radical_id`, '注' AS `hanzi_char` UNION ALL
  SELECT 988 AS `hsk_source_id`, 61 AS `radical_id`, '意' AS `hanzi_char` UNION ALL
  SELECT 988 AS `hsk_source_id`, 180 AS `radical_id`, '意' AS `hanzi_char` UNION ALL
  SELECT 989 AS `hsk_source_id`, 9 AS `radical_id`, '住' AS `hanzi_char` UNION ALL
  SELECT 989 AS `hsk_source_id`, 3 AS `radical_id`, '住' AS `hanzi_char` UNION ALL
  SELECT 989 AS `hsk_source_id`, 96 AS `radical_id`, '住' AS `hanzi_char` UNION ALL
  SELECT 989 AS `hsk_source_id`, 170 AS `radical_id`, '院' AS `hanzi_char` UNION ALL
  SELECT 989 AS `hsk_source_id`, 40 AS `radical_id`, '院' AS `hanzi_char` UNION ALL
  SELECT 990 AS `hsk_source_id`, 39 AS `radical_id`, '字' AS `hanzi_char` UNION ALL
  SELECT 990 AS `hsk_source_id`, 40 AS `radical_id`, '字' AS `hanzi_char` UNION ALL
  SELECT 990 AS `hsk_source_id`, 2 AS `radical_id`, '典' AS `hanzi_char` UNION ALL
  SELECT 990 AS `hsk_source_id`, 12 AS `radical_id`, '典' AS `hanzi_char` UNION ALL
  SELECT 990 AS `hsk_source_id`, 73 AS `radical_id`, '典' AS `hanzi_char` UNION ALL
  SELECT 991 AS `hsk_source_id`, 132 AS `radical_id`, '自' AS `hanzi_char` UNION ALL
  SELECT 991 AS `hsk_source_id`, 144 AS `radical_id`, '行' AS `hanzi_char` UNION ALL
  SELECT 991 AS `hsk_source_id`, 159 AS `radical_id`, '车' AS `hanzi_char` UNION ALL
  SELECT 991 AS `hsk_source_id`, 1 AS `radical_id`, '车' AS `hanzi_char` UNION ALL
  SELECT 991 AS `hsk_source_id`, 5 AS `radical_id`, '车' AS `hanzi_char` UNION ALL
  SELECT 991 AS `hsk_source_id`, 24 AS `radical_id`, '车' AS `hanzi_char` UNION ALL
  SELECT 993 AS `hsk_source_id`, 3 AS `radical_id`, '总' AS `hanzi_char` UNION ALL
  SELECT 993 AS `hsk_source_id`, 30 AS `radical_id`, '总' AS `hanzi_char` UNION ALL
  SELECT 993 AS `hsk_source_id`, 61 AS `radical_id`, '总' AS `hanzi_char` UNION ALL
  SELECT 994 AS `hsk_source_id`, 3 AS `radical_id`, '总' AS `hanzi_char` UNION ALL
  SELECT 994 AS `hsk_source_id`, 30 AS `radical_id`, '总' AS `hanzi_char` UNION ALL
  SELECT 994 AS `hsk_source_id`, 61 AS `radical_id`, '总' AS `hanzi_char` UNION ALL
  SELECT 994 AS `hsk_source_id`, 72 AS `radical_id`, '是' AS `hanzi_char` UNION ALL
  SELECT 994 AS `hsk_source_id`, 103 AS `radical_id`, '是' AS `hanzi_char` UNION ALL
  SELECT 995 AS `hsk_source_id`, 21 AS `radical_id`, '嘴' AS `hanzi_char` UNION ALL
  SELECT 995 AS `hsk_source_id`, 30 AS `radical_id`, '嘴' AS `hanzi_char` UNION ALL
  SELECT 995 AS `hsk_source_id`, 77 AS `radical_id`, '嘴' AS `hanzi_char` UNION ALL
  SELECT 995 AS `hsk_source_id`, 148 AS `radical_id`, '嘴' AS `hanzi_char` UNION ALL
  SELECT 998 AS `hsk_source_id`, 73 AS `radical_id`, '最' AS `hanzi_char` UNION ALL
  SELECT 998 AS `hsk_source_id`, 72 AS `radical_id`, '最' AS `hanzi_char` UNION ALL
  SELECT 998 AS `hsk_source_id`, 29 AS `radical_id`, '最' AS `hanzi_char` UNION ALL
  SELECT 998 AS `hsk_source_id`, 128 AS `radical_id`, '最' AS `hanzi_char` UNION ALL
  SELECT 998 AS `hsk_source_id`, 69 AS `radical_id`, '近' AS `hanzi_char` UNION ALL
  SELECT 998 AS `hsk_source_id`, 162 AS `radical_id`, '近' AS `hanzi_char` UNION ALL
  SELECT 999 AS `hsk_source_id`, 9 AS `radical_id`, '做' AS `hanzi_char` UNION ALL
  SELECT 999 AS `hsk_source_id`, 66 AS `radical_id`, '做' AS `hanzi_char` UNION ALL
  SELECT 999 AS `hsk_source_id`, 40 AS `radical_id`, '客' AS `hanzi_char` UNION ALL
  SELECT 999 AS `hsk_source_id`, 30 AS `radical_id`, '客' AS `hanzi_char` UNION ALL
  SELECT 999 AS `hsk_source_id`, 34 AS `radical_id`, '客' AS `hanzi_char` UNION ALL
  SELECT 1000 AS `hsk_source_id`, 9 AS `radical_id`, '作' AS `hanzi_char` UNION ALL
  SELECT 1000 AS `hsk_source_id`, 4 AS `radical_id`, '作' AS `hanzi_char` UNION ALL
  SELECT 1000 AS `hsk_source_id`, 1 AS `radical_id`, '作' AS `hanzi_char`
) m
JOIN `VOCABULARY` v ON v.`hsk_source_id` = m.`hsk_source_id`;

