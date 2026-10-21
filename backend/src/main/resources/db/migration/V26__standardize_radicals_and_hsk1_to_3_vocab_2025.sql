-- =============================================================================
-- Migration: V26__standardize_radicals_and_hsk1_to_3_vocab_2025.sql
-- Description:
--   1. Standardize 214 Kangxi Radicals:
--      - Sửa âm Hán-Việt Bộ #69 斤 thành 'Cân'
--      - Cập nhật biến thể cột character cho #96 玉(王/玊), #187 馬(马), #197 鹵(卤), #205 黽(黾)
--      - Cập nhật explanation_vi cho Bộ #71 无 (thay thế ví dụ 抚)
--   2. Standardize 17+ Han-Viet Reading Groups and 18+ Contextual Meanings/Examples
--   3. Align HSK 2025 levels (3.0 syllabus) & Preserve all 1068 vocab_ids
--   4. Fix 4 systematic radical composition error groups in VOCAB_RADICAL
-- Database: MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Part 1: Standardize 214 Kangxi Radicals
-- -----------------------------------------------------------------------------
UPDATE `RADICAL` SET `meaning_han_viet` = 'Cân', `updated_at` = NOW() WHERE `radical_id` = 69;
UPDATE `RADICAL` SET `character` = '玉(王/玊)', `updated_at` = NOW() WHERE `radical_id` = 96;
UPDATE `RADICAL` SET `character` = '馬(马)', `updated_at` = NOW() WHERE `radical_id` = 187;
UPDATE `RADICAL` SET `character` = '鹵(卤)', `updated_at` = NOW() WHERE `radical_id` = 197;
UPDATE `RADICAL` SET `character` = '黽(黾)', `updated_at` = NOW() WHERE `radical_id` = 205;
UPDATE `RADICAL` SET `explanation_vi` = 'Người xòe tay múa trong lễ cầu mưa hoặc cử động không cầm nắm gì trong tay. Biểu thị tính phủ định, sự hư không, vắng bóng hoặc thiếu hụt (tùy chữ). Ví dụ: 既 (jì: đã xong, vừa mới - thuộc bộ 旡), 炁 (qì: nguyên khí, hơi thở - thuộc bộ 无); chữ 抚 (vỗ về, an ủi) mượn 无 làm thành phần biểu âm nhưng thuộc bộ Thủ 扌. Mẹo nhớ: Xòe hai tay buông xuôi không còn giữ lại vật gì.', `updated_at` = NOW() WHERE `radical_id` = 71;

-- -----------------------------------------------------------------------------
-- Part 2: Standardize Han-Viet Pronunciations, Vietnamese Meanings & Examples
-- -----------------------------------------------------------------------------
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Bá Bá', `updated_at` = NOW() WHERE `vocab_id` = 4;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Vé xe', `updated_at` = NOW() WHERE `vocab_id` = 43;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Xa Thượng', `updated_at` = NOW() WHERE `vocab_id` = 44;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Đả', `updated_at` = NOW() WHERE `vocab_id` = 56;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Đả Xa', `updated_at` = NOW() WHERE `vocab_id` = 57;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Đả Điện Thoại', `updated_at` = NOW() WHERE `vocab_id` = 58;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Đả Khai', `updated_at` = NOW() WHERE `vocab_id` = 59;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Đả Cầu', `updated_at` = NOW() WHERE `vocab_id` = 60;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Trợ từ kết cấu (đứng sau phó từ/tính từ làm trạng ngữ bổ nghĩa cho động từ)', `example_sentence` = '他高兴地笑了。', `example_translation` = 'Anh ấy đã cười một cách vui vẻ.', `updated_at` = NOW() WHERE `vocab_id` = 66;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Đất, mặt đất, vùng đất, nơi chốn', `example_sentence` = '地上有一本书。', `example_translation` = 'Trên mặt đất có một quyển sách.', `updated_at` = NOW() WHERE `vocab_id` = 69;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Địa Thượng', `updated_at` = NOW() WHERE `vocab_id` = 72;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Nhi Tử', `updated_at` = NOW() WHERE `vocab_id` = 97;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Khô, khô ráo, cạn', `example_sentence` = '衣服已经晾干了。', `example_translation` = 'Quần áo đã phơi khô rồi.', `updated_at` = NOW() WHERE `vocab_id` = 111;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Làm, làm việc, đảm đương', `example_sentence` = '你在干什么呢？', `example_translation` = 'Bạn đang làm gì thế?', `updated_at` = NOW() WHERE `vocab_id` = 113;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Can Thập Ma', `updated_at` = NOW() WHERE `vocab_id` = 114;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Nói cho biết, bảo, thông báo', `updated_at` = NOW() WHERE `vocab_id` = 117;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Quan Thượng', `updated_at` = NOW() WHERE `vocab_id` = 126;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Vẫn, còn, hơn nữa', `example_sentence` = '我吃饱了，还想喝点水。', `example_translation` = 'Tôi ăn no rồi, vẫn muốn uống chút nước.', `updated_at` = NOW() WHERE `vocab_id` = 132;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Hảo Thính', `updated_at` = NOW() WHERE `vocab_id` = 141;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Hát', `updated_at` = NOW() WHERE `vocab_id` = 144;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Ngày kia, ngày mốt', `updated_at` = NOW() WHERE `vocab_id` = 149;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Trả lại, hoàn lại, quay về', `example_sentence` = '这本书我明天还给你。', `example_translation` = 'Quyển sách này ngày mai tôi sẽ trả lại cho bạn.', `updated_at` = NOW() WHERE `vocab_id` = 153;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Cơ Trường', `meaning_vi` = 'Sân bay, phi trường', `updated_at` = NOW() WHERE `vocab_id` = 162;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Kỷ', `updated_at` = NOW() WHERE `vocab_id` = 165;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Giác Đắc', `updated_at` = NOW() WHERE `vocab_id` = 187;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Thi, kiểm tra, khảo sát', `updated_at` = NOW() WHERE `vocab_id` = 196;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Mệt, mệt mỏi', `updated_at` = NOW() WHERE `vocab_id` = 211;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Lãnh', `updated_at` = NOW() WHERE `vocab_id` = 212;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Lâu Thượng', `updated_at` = NOW() WHERE `vocab_id` = 219;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Lộ Thượng', `updated_at` = NOW() WHERE `vocab_id` = 223;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Ma Ma', `updated_at` = NOW() WHERE `vocab_id` = 224;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Mã Thượng', `updated_at` = NOW() WHERE `vocab_id` = 226;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Một Thập Ma', `updated_at` = NOW() WHERE `vocab_id` = 234;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Không sao, không có gì; rảnh rỗi', `updated_at` = NOW() WHERE `vocab_id` = 235;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Vé vào cửa, vé tham quan', `updated_at` = NOW() WHERE `vocab_id` = 240;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Cơm trắng, cơm', `updated_at` = NOW() WHERE `vocab_id` = 242;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Na', `updated_at` = NOW() WHERE `vocab_id` = 250;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Na Lý', `updated_at` = NOW() WHERE `vocab_id` = 251;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Na Ta', `updated_at` = NOW() WHERE `vocab_id` = 253;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Bà nội, bà', `updated_at` = NOW() WHERE `vocab_id` = 260;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Nam, phái nam, đàn ông, con trai', `updated_at` = NOW() WHERE `vocab_id` = 261;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Ngài, ông, bà (đại từ nhân xưng kính trọng)', `updated_at` = NOW() WHERE `vocab_id` = 274;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thương Trường', `updated_at` = NOW() WHERE `vocab_id` = 313;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thượng', `updated_at` = NOW() WHERE `vocab_id` = 315;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thượng Ban', `updated_at` = NOW() WHERE `vocab_id` = 316;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thượng Biên', `updated_at` = NOW() WHERE `vocab_id` = 317;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thượng Xa', `meaning_vi` = 'Lên xe', `updated_at` = NOW() WHERE `vocab_id` = 318;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thượng Thứ', `updated_at` = NOW() WHERE `vocab_id` = 319;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thượng Khóa', `updated_at` = NOW() WHERE `vocab_id` = 320;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thượng Võng', `updated_at` = NOW() WHERE `vocab_id` = 321;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thượng Ngọ', `updated_at` = NOW() WHERE `vocab_id` = 322;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thượng Học', `updated_at` = NOW() WHERE `vocab_id` = 323;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thân Thượng', `updated_at` = NOW() WHERE `vocab_id` = 326;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thập Ma', `updated_at` = NOW() WHERE `vocab_id` = 328;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thuỵ Giác', `updated_at` = NOW() WHERE `vocab_id` = 348;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thính', `updated_at` = NOW() WHERE `vocab_id` = 361;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thính Đáo', `updated_at` = NOW() WHERE `vocab_id` = 362;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thính Kiến', `updated_at` = NOW() WHERE `vocab_id` = 363;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Thính Tả', `updated_at` = NOW() WHERE `vocab_id` = 364;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Vãn Thượng', `updated_at` = NOW() WHERE `vocab_id` = 374;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Võng Thượng', `updated_at` = NOW() WHERE `vocab_id` = 375;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Phía tây, phương tây, hướng tây', `updated_at` = NOW() WHERE `vocab_id` = 384;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Xuống xe', `updated_at` = NOW() WHERE `vocab_id` = 392;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Trang sách, trang, tờ', `updated_at` = NOW() WHERE `vocab_id` = 426;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Tảo Thượng', `updated_at` = NOW() WHERE `vocab_id` = 459;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Chẩm Ma', `updated_at` = NOW() WHERE `vocab_id` = 460;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Chính', `updated_at` = NOW() WHERE `vocab_id` = 472;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Chính Tại', `updated_at` = NOW() WHERE `vocab_id` = 473;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Trọng', `meaning_vi` = 'Nặng, quan trọng', `updated_at` = NOW() WHERE `vocab_id` = 483;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Trọng Yếu', `updated_at` = NOW() WHERE `vocab_id` = 484;
UPDATE `VOCABULARY` SET `meaning_vi` = 'Hậu tố danh từ; con, đứa trẻ', `updated_at` = NOW() WHERE `vocab_id` = 489;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Đưu', `updated_at` = NOW() WHERE `vocab_id` = 726;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Bà', `updated_at` = NOW() WHERE `vocab_id` = 886;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Bàng', `updated_at` = NOW() WHERE `vocab_id` = 890;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Tỳ Tửu', `updated_at` = NOW() WHERE `vocab_id` = 891;
UPDATE `VOCABULARY` SET `meaning_han_viet` = 'Trưởng', `meaning_vi` = 'Trưởng, lớn lên, sinh ra, đứng đầu', `example_sentence` = '他长得很高。', `example_translation` = 'Anh ấy lớn lên rất cao.', `updated_at` = NOW() WHERE `vocab_id` = 1042;

-- -----------------------------------------------------------------------------
-- Part 3: Reaffirm and Lock HSK 2025 Levels
-- -----------------------------------------------------------------------------
UPDATE `VOCABULARY` SET `hsk_level` = 2, `updated_at` = NOW() WHERE `hsk_source_id` IN (302, 304, 308);
UPDATE `VOCABULARY` SET `hsk_level` = 3, `updated_at` = NOW() WHERE `hsk_source_id` IN (531, 532, 537);
UPDATE `VOCABULARY` SET `hsk_level` = 0, `hsk_standard` = 'Curriculum Supplementary', `hsk_source_id` = NULL, `updated_at` = NOW() WHERE `vocab_id` = 6;

-- -----------------------------------------------------------------------------
-- Part 4: Clean up and Standardize VOCAB_RADICAL Decompositions
-- -----------------------------------------------------------------------------
-- Group 1 & 4 Deletions: Remove incorrect/spurious component radicals
DELETE FROM `VOCAB_RADICAL` WHERE `hanzi_char` = '干' AND `radical_id` = 24;
DELETE FROM `VOCAB_RADICAL` WHERE `hanzi_char` = '习' AND `radical_id` = 15;
DELETE FROM `VOCAB_RADICAL` WHERE `hanzi_char` = '买' AND `radical_id` = 15;
DELETE FROM `VOCAB_RADICAL` WHERE `hanzi_char` = '丢' AND `radical_id` IN (1, 96);
DELETE FROM `VOCAB_RADICAL` WHERE `hanzi_char` = '喝' AND `radical_id` = 73;
DELETE FROM `VOCAB_RADICAL` WHERE `hanzi_char` = '渴' AND `radical_id` = 73;

-- Group 2: Standardize Right 阝 to #163 邑 (replace #170 阜)
UPDATE `VOCAB_RADICAL` SET `radical_id` = 163 WHERE `hanzi_char` = '邮' AND `radical_id` = 170;
UPDATE `VOCAB_RADICAL` SET `radical_id` = 163 WHERE `hanzi_char` = '邻' AND `radical_id` = 170;
UPDATE `VOCAB_RADICAL` SET `radical_id` = 163 WHERE `vocab_id` IN (1018, 1021, 866) AND `radical_id` = 170;

-- Group 3: Standalone Radicals - Remove fragmented stroke decompositions
DELETE FROM `VOCAB_RADICAL` WHERE `vocab_id` = 42 AND `radical_id` IN (1, 5, 24);
DELETE FROM `VOCAB_RADICAL` WHERE `vocab_id` = 110 AND `radical_id` IN (4, 16);
DELETE FROM `VOCAB_RADICAL` WHERE `vocab_id` = 173 AND `radical_id` IN (10, 13);
DELETE FROM `VOCAB_RADICAL` WHERE `vocab_id` = 238 AND `radical_id` IN (2, 3);
DELETE FROM `VOCAB_RADICAL` WHERE `vocab_id` = 426 AND `radical_id` = 154;
DELETE FROM `VOCAB_RADICAL` WHERE `vocab_id` = 871 AND `radical_id` = 1;
DELETE FROM `VOCAB_RADICAL` WHERE `hanzi_char` = '车' AND `radical_id` IN (1, 5, 24);
DELETE FROM `VOCAB_RADICAL` WHERE `hanzi_char` = '风' AND `radical_id` IN (4, 16);
DELETE FROM `VOCAB_RADICAL` WHERE `hanzi_char` = '见' AND `radical_id` IN (10, 13);
DELETE FROM `VOCAB_RADICAL` WHERE `hanzi_char` = '门' AND `radical_id` IN (2, 3);
DELETE FROM `VOCAB_RADICAL` WHERE `hanzi_char` = '页' AND `radical_id` = 154;
DELETE FROM `VOCAB_RADICAL` WHERE `hanzi_char` = '马' AND `radical_id` = 1;

-- Group 4: Remove forced secondary radicals on purely phonetic components
DELETE FROM `VOCAB_RADICAL` WHERE `vocab_id` = 4 AND `radical_id` = 49;
DELETE FROM `VOCAB_RADICAL` WHERE `vocab_id` = 5 AND `radical_id` = 49;
DELETE FROM `VOCAB_RADICAL` WHERE `vocab_id` = 17 AND `radical_id` = 1;
DELETE FROM `VOCAB_RADICAL` WHERE `vocab_id` = 18 AND `radical_id` = 1;
DELETE FROM `VOCAB_RADICAL` WHERE `vocab_id` = 152 AND `radical_id` = 1;
DELETE FROM `VOCAB_RADICAL` WHERE `vocab_id` = 28 AND `radical_id` = 1;
DELETE FROM `VOCAB_RADICAL` WHERE `vocab_id` = 29 AND `radical_id` = 1;
DELETE FROM `VOCAB_RADICAL` WHERE `vocab_id` IN (132, 153) AND `radical_id` = 1;
DELETE FROM `VOCAB_RADICAL` WHERE `hanzi_char` IN ('爸', '吧') AND `radical_id` = 49;
DELETE FROM `VOCAB_RADICAL` WHERE `hanzi_char` IN ('杯', '坏', '病', '还') AND `radical_id` = 1;

-- Group 1 Insertions: Insert authentic structural and Kangxi components
INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 51, '干', 'kangxi_radical', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%干%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 27, '后', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%后%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 4, '后', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%后%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 1, '右', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%右%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 4, '右', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%右%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 1, '左', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%左%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 4, '左', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%左%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 124, '习', 'kangxi_radical', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%习%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 26, '卫', 'kangxi_radical', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%卫%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 4, '丢', 'kangxi_radical', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%丢%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 32, '丢', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%丢%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 28, '丢', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%丢%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 26, '节', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%节%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 49, '爬', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%爬%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 44, '声', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%声%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 5, '书', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%书%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 20, '喝', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%喝%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 21, '喝', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%喝%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 20, '渴', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%渴%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 21, '渴', 'structural_component', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` LIKE '%渴%';

INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)
SELECT v.`vocab_id`, 85, '泳', 'kangxi_radical', 'verified'
FROM `VOCABULARY` v WHERE v.`hanzi` = '游泳';
