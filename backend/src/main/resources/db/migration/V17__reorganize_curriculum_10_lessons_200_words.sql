-- =============================================================================
-- Migration: V17__reorganize_curriculum_10_lessons_200_words.sql
-- Description: Reorganize elementary Chinese curriculum into exactly 10 official
--              thematic lessons, each with exactly 20 authentic HSK 1 vocabulary items
--              (200 distinct words total, zero duplicate words across lessons, zero fake items).
--              Cleans up legacy seed test lessons from V14 & V16 from the public catalog.
-- Database: MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- Ensure creator account exists for valid foreign key reference
INSERT INTO `account` (`email_or_phone`, `password_hash`, `status`, `created_at`, `updated_at`, `authorization_version`)
SELECT 'creator@test.com', '$2a$10$UPN3ubt5uNRTKHbXcMsEgOjsd70AqQ.EMiekc6.7ngAuynlOFuFCm', 'Active', NOW(), NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM `account` WHERE `email_or_phone` = 'creator@test.com');

SET @creator_id = (SELECT `account_id` FROM `account` WHERE `email_or_phone` = 'creator@test.com' LIMIT 1);
SET @creator_id = IFNULL(@creator_id, (SELECT `account_id` FROM `account` LIMIT 1));

-- -----------------------------------------------------------------------------
-- Step 1: Clean up legacy seed test lessons from V14 & V16 from the public catalog
-- -----------------------------------------------------------------------------
DELETE lv FROM `lesson_vocabulary` lv
JOIN `lesson` l ON lv.`lesson_id` = l.`lesson_id`
WHERE l.`title` IN (
    'SRS Test - Basic Recall',
    'SRS Test - Failure Recovery',
    'SRS Test - Due Review',
    'Bài học 5 từ - Giao tiếp cơ bản'
);

DELETE FROM `lesson`
WHERE `title` IN (
    'SRS Test - Basic Recall',
    'SRS Test - Failure Recovery',
    'SRS Test - Due Review',
    'Bài học 5 từ - Giao tiếp cơ bản'
);

-- -----------------------------------------------------------------------------
-- Step 2: Seed Exactly 10 Thematic Official Lessons with 20 Vocabularies Each
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Bài 01 — Chào hỏi và giao tiếp cơ bản
-- =============================================================================
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'Bài 01 — Chào hỏi và giao tiếp cơ bản', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'Bài 01 — Chào hỏi và giao tiếp cơ bản');

SET @lesson_id_01 = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'Bài 01 — Chào hỏi và giao tiếp cơ bản' LIMIT 1);

-- 01.01: 请 (qǐng) - Mời; mời mọc
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '请' AND `pinyin_raw` = 'qing' LIMIT 1;

-- 01.02: 请问 (qǐngwèn) - Xin lỗi, cho tôi hỏi...?
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '请问' AND `pinyin_raw` = 'qingwen' LIMIT 1;

-- 01.03: 请进 (qǐng jìn) - "mời vào"
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '请进' AND `pinyin_raw` = 'qing jin' LIMIT 1;

-- 01.04: 请坐 (qǐng zuò) - Xin mời ngồi
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '请坐' AND `pinyin_raw` = 'qing zuo' LIMIT 1;

-- 01.05: 谢谢 (xièxie) - Cảm ơn; cảm ơn bạn
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '谢谢' AND `pinyin_raw` = 'xiexie' LIMIT 1;

-- 01.06: 不客气 (bù kèqì) - Không có chi; đừng nhắc đến
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '不客气' AND `pinyin_raw` = 'bu keqi' LIMIT 1;

-- 01.07: 对不起 (duìbuqǐ) - Tôi xin lỗi; xin thứ lỗi; tôi xin tha thứ; làm  thất vọng; không đạt kỳ vọng
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '对不起' AND `pinyin_raw` = 'duibuqi' LIMIT 1;

-- 01.08: 没关系 (méi guānxi) - Không sao đâu
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '没关系' AND `pinyin_raw` = 'mei guanxi' LIMIT 1;

-- 01.09: 没什么 (méi shénme) - Không sao; không có gì; đừng bận tâm; nghĩ không có gì; rất hân hạnh; không có chi; không có gì
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '没什么' AND `pinyin_raw` = 'mei shenme' LIMIT 1;

-- 01.10: 再见 (zàijiàn) - Tạm biệt; gặp lại sau
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '再见' AND `pinyin_raw` = 'zaijian' LIMIT 1;

-- 01.11: 问 (wèn) - Hỏi
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '问' AND `pinyin_raw` = 'wen' LIMIT 1;

-- 01.12: 说 (shuō) - Nói
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '说' AND `pinyin_raw` = 'shuo' LIMIT 1;

-- 01.13: 说话 (shuōhuà) - Nói; trò chuyện
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '说话' AND `pinyin_raw` = 'shuohua' LIMIT 1;

-- 01.14: 见 (jiàn) - Gặp; thấy
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '见' AND `pinyin_raw` = 'jian' LIMIT 1;

-- 01.15: 见面 (jiànmiàn) - Gặp mặt; gặp nhau
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '见面' AND `pinyin_raw` = 'jianmian' LIMIT 1;

-- 01.16: 好 (hǎo) - Tốt; đẹp; xong
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '好' AND `pinyin_raw` = 'hao' LIMIT 1;

-- 01.17: 对 (duì) - Đúng; chính xác; đối với
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '对' AND `pinyin_raw` = 'dui' LIMIT 1;

-- 01.18: 不对 (bùduì) - Không chính xác; sai
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '不对' AND `pinyin_raw` = 'budui' LIMIT 1;

-- 01.19: 行 (xíng) - Được; đi; thực hiện
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '行' AND `pinyin_raw` = 'xing' LIMIT 1;

-- 01.20: 吧 (ba) - Trợ từ ngữ khí: nhé, thôi, đi, chứ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_01, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '吧' AND `pinyin_raw` = 'ba' LIMIT 1;


-- =============================================================================
-- Bài 02 — Bản thân và giới thiệu cá nhân
-- =============================================================================
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'Bài 02 — Bản thân và giới thiệu cá nhân', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'Bài 02 — Bản thân và giới thiệu cá nhân');

SET @lesson_id_02 = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'Bài 02 — Bản thân và giới thiệu cá nhân' LIMIT 1);

-- 02.01: 我 (wǒ) - Tôi; mình; của tôi
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '我' AND `pinyin_raw` = 'wo' LIMIT 1;

-- 02.02: 你 (nǐ) - Bạn
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '你' AND `pinyin_raw` = 'ni' LIMIT 1;

-- 02.03: 您 (nín) - Bạn
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '您' AND `pinyin_raw` = 'nin' LIMIT 1;

-- 02.04: 他 (tā) - Anh ấy; ông ấy; khác
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '他' AND `pinyin_raw` = 'ta' LIMIT 1;

-- 02.05: 她 (tā) - Cô ấy
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '她' AND `pinyin_raw` = 'ta' LIMIT 1;

-- 02.06: 我们 (wǒmen) - Chúng tôi; chúng ta; bản thân chúng ta; của chúng tôi
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '我们' AND `pinyin_raw` = 'women' LIMIT 1;

-- 02.07: 你们 (nǐmen) - Các bạn
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '你们' AND `pinyin_raw` = 'nimen' LIMIT 1;

-- 02.08: 他们 (tāmen) - Họ; bọn họ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '他们' AND `pinyin_raw` = 'tamen' LIMIT 1;

-- 02.09: 她们 (tāmen) - Họ; các cô ấy
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '她们' AND `pinyin_raw` = 'tamen' LIMIT 1;

-- 02.10: 人 (rén) - Người; mọi người
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '人' AND `pinyin_raw` = 'ren' LIMIT 1;

-- 02.11: 名字 (míngzi) - Tên
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '名字' AND `pinyin_raw` = 'mingzi' LIMIT 1;

-- 02.12: 叫 (jiào) - Kêu; gọi; tên là
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '叫' AND `pinyin_raw` = 'jiao' LIMIT 1;

-- 02.13: 谁 (shéi/shuí) - Ai; cũng đọc là
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '谁' AND `pinyin_raw` = 'shei/shui' LIMIT 1;

-- 02.14: 什么 (shénme) - Gì?; điều gì đó; bất kỳ điều gì
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '什么' AND `pinyin_raw` = 'shenme' LIMIT 1;

-- 02.15: 岁 (suì) - Tuổi
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '岁' AND `pinyin_raw` = 'sui' LIMIT 1;

-- 02.16: 介绍 (jièshào) - Giới thiệu; thuyết trình
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '介绍' AND `pinyin_raw` = 'jieshao' LIMIT 1;

-- 02.17: 国家 (guójiā) - Quốc gia; dân tộc; nhà nước
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '国家' AND `pinyin_raw` = 'guojia' LIMIT 1;

-- 02.18: 中国 (Zhōngguó) - Trung Quốc
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '中国' AND `pinyin_raw` = 'zhongguo' LIMIT 1;

-- 02.19: 中文 (Zhōngwén) - Ngôn ngữ Trung Quốc
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '中文' AND `pinyin_raw` = 'zhongwen' LIMIT 1;

-- 02.20: 汉语 (Hànyǔ) - Ngôn ngữ tiếng Trung
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_02, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '汉语' AND `pinyin_raw` = 'hanyu' LIMIT 1;


-- =============================================================================
-- Bài 03 — Gia đình và các mối quan hệ
-- =============================================================================
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'Bài 03 — Gia đình và các mối quan hệ', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'Bài 03 — Gia đình và các mối quan hệ');

SET @lesson_id_03 = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'Bài 03 — Gia đình và các mối quan hệ' LIMIT 1);

-- 03.01: 爸爸 (bàba) - Cha; ba
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '爸爸' AND `pinyin_raw` = 'baba' LIMIT 1;

-- 03.02: 妈妈 (māma) - Mẹ; má
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '妈妈' AND `pinyin_raw` = 'mama' LIMIT 1;

-- 03.03: 爷爷 (yéye) - Ông nội; ông bên nội
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '爷爷' AND `pinyin_raw` = 'yeye' LIMIT 1;

-- 03.04: 奶奶 (nǎinai) - Bà; bà chủ nhà
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '奶奶' AND `pinyin_raw` = 'nainai' LIMIT 1;

-- 03.05: 哥哥 (gēge) - Anh trai
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '哥哥' AND `pinyin_raw` = 'gege' LIMIT 1;

-- 03.06: 姐姐 (jiějie) - Chị gái
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '姐姐' AND `pinyin_raw` = 'jiejie' LIMIT 1;

-- 03.07: 弟弟 (dìdi) - Em trai
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '弟弟' AND `pinyin_raw` = 'didi' LIMIT 1;

-- 03.08: 妹妹 (mèimei) - Em gái; phụ nữ trẻ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '妹妹' AND `pinyin_raw` = 'meimei' LIMIT 1;

-- 03.09: 儿子 (érzi) - Con trai
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '儿子' AND `pinyin_raw` = 'erzi' LIMIT 1;

-- 03.10: 女儿 (nǚ'ér) - Con gái
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '女儿' AND `pinyin_raw` = 'nu''er' LIMIT 1;

-- 03.11: 孩子 (háizi) - Trẻ em
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '孩子' AND `pinyin_raw` = 'haizi' LIMIT 1;

-- 03.12: 家人 (jiārén) - Thành viên gia đình; người hầu
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '家人' AND `pinyin_raw` = 'jiaren' LIMIT 1;

-- 03.13: 朋友 (péngyou) - Bạn
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '朋友' AND `pinyin_raw` = 'pengyou' LIMIT 1;

-- 03.14: 男朋友 (nánpéngyou) - Bạn trai
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '男朋友' AND `pinyin_raw` = 'nanpengyou' LIMIT 1;

-- 03.15: 女朋友 (nǚpéngyou) - Bạn gái
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '女朋友' AND `pinyin_raw` = 'nupengyou' LIMIT 1;

-- 03.16: 男 (nán) - Nam; Nam tước, cấp thấp nhất trong năm cấp bậc quý tộc 五等爵位
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '男' AND `pinyin_raw` = 'nan' LIMIT 1;

-- 03.17: 女 (nǚ) - Nữ; phụ nữ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '女' AND `pinyin_raw` = 'nu' LIMIT 1;

-- 03.18: 男人 (nánrén) - Một người đàn ông; một nam giới
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '男人' AND `pinyin_raw` = 'nanren' LIMIT 1;

-- 03.19: 女人 (nǚrén) - Phụ nữ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '女人' AND `pinyin_raw` = 'nuren' LIMIT 1;

-- 03.20: 老人 (lǎorén) - Ông già hoặc bà già; người cao tuổi
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_03, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '老人' AND `pinyin_raw` = 'laoren' LIMIT 1;


-- =============================================================================
-- Bài 04 — Số đếm, ngày tháng và thời gian
-- =============================================================================
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'Bài 04 — Số đếm, ngày tháng và thời gian', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'Bài 04 — Số đếm, ngày tháng và thời gian');

SET @lesson_id_04 = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'Bài 04 — Số đếm, ngày tháng và thời gian' LIMIT 1);

-- 04.01: 一 (yī) - Một; đơn
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '一' AND `pinyin_raw` = 'yi' LIMIT 1;

-- 04.02: 二 (èr) - Hai; 2
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '二' AND `pinyin_raw` = 'er' LIMIT 1;

-- 04.03: 三 (sān) - Họ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '三' AND `pinyin_raw` = 'san' LIMIT 1;

-- 04.04: 四 (sì) - Bốn; 4
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '四' AND `pinyin_raw` = 'si' LIMIT 1;

-- 04.05: 五 (wǔ) - Năm; 5
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '五' AND `pinyin_raw` = 'wu' LIMIT 1;

-- 04.06: 六 (liù) - Sáu; 6
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '六' AND `pinyin_raw` = 'liu' LIMIT 1;

-- 04.07: 七 (qī) - Bảy; 7
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '七' AND `pinyin_raw` = 'qi' LIMIT 1;

-- 04.08: 八 (bā) - Tám; 8
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '八' AND `pinyin_raw` = 'ba' LIMIT 1;

-- 04.09: 九 (jiǔ) - Chín; 9
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '九' AND `pinyin_raw` = 'jiu' LIMIT 1;

-- 04.10: 十 (shí) - Mười; 10
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '十' AND `pinyin_raw` = 'shi' LIMIT 1;

-- 04.11: 百 (bǎi) - Một trăm; trăm
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '百' AND `pinyin_raw` = 'bai' LIMIT 1;

-- 04.12: 零 (líng) - Không; số không
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '零' AND `pinyin_raw` = 'ling' LIMIT 1;

-- 04.13: 年 (nián) - Họ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '年' AND `pinyin_raw` = 'nian' LIMIT 1;

-- 04.14: 月 (yuè) - Mặt trăng; tháng
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '月' AND `pinyin_raw` = 'yue' LIMIT 1;

-- 04.15: 日 (rì) - Ngày; mặt trời
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '日' AND `pinyin_raw` = 'ri' LIMIT 1;

-- 04.16: 号 (hào) - Số; ngày (trong tháng)
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '号' AND `pinyin_raw` = 'hao' LIMIT 1;

-- 04.17: 星期 (xīngqī) - Tuần; ngày trong tuần
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '星期' AND `pinyin_raw` = 'xingqi' LIMIT 1;

-- 04.18: 点 (diǎn) - Giờ; điểm; chấm; chút ít
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '点' AND `pinyin_raw` = 'dian' LIMIT 1;

-- 04.19: 分 (fēn) - Phút; điểm; phân chia
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '分' AND `pinyin_raw` = 'fen' LIMIT 1;

-- 04.20: 半 (bàn) - Một nửa; bán-
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_04, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '半' AND `pinyin_raw` = 'ban' LIMIT 1;


-- =============================================================================
-- Bài 05 — Trường học, học tập và công việc
-- =============================================================================
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'Bài 05 — Trường học, học tập và công việc', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'Bài 05 — Trường học, học tập và công việc');

SET @lesson_id_05 = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'Bài 05 — Trường học, học tập và công việc' LIMIT 1);

-- 05.01: 学校 (xuéxiào) - Trường học; Lượng từ: 所
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '学校' AND `pinyin_raw` = 'xuexiao' LIMIT 1;

-- 05.02: 老师 (lǎoshī) - Giáo viên
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '老师' AND `pinyin_raw` = 'laoshi' LIMIT 1;

-- 05.03: 学生 (xuéshēng) - Học sinh; trẻ đi học
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '学生' AND `pinyin_raw` = 'xuesheng' LIMIT 1;

-- 05.04: 同学 (tóngxué) - Học cùng trường; bạn học
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '同学' AND `pinyin_raw` = 'tongxue' LIMIT 1;

-- 05.05: 班 (bān) - Lớp học; ca làm việc
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '班' AND `pinyin_raw` = 'ban' LIMIT 1;

-- 05.06: 学 (xué) - Học; bắt chước
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '学' AND `pinyin_raw` = 'xue' LIMIT 1;

-- 05.07: 学习 (xuéxí) - Học; tìm hiểu
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '学习' AND `pinyin_raw` = 'xuexi' LIMIT 1;

-- 05.08: 上课 (shàngkè) - Đi học; tham dự lớp
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '上课' AND `pinyin_raw` = 'shangke' LIMIT 1;

-- 05.09: 下课 (xiàkè) - Tan học; ra khỏi lớp
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '下课' AND `pinyin_raw` = 'xiake' LIMIT 1;

-- 05.10: 上学 (shàngxué) - Đi học; theo học
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '上学' AND `pinyin_raw` = 'shangxue' LIMIT 1;

-- 05.11: 放学 (fàngxué) - Tan học
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '放学' AND `pinyin_raw` = 'fangxue' LIMIT 1;

-- 05.12: 书 (shū) - Viết tắt của 書經|书经
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '书' AND `pinyin_raw` = 'shu' LIMIT 1;

-- 05.13: 本子 (běnzi) - Sách; quyển tập
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '本子' AND `pinyin_raw` = 'benzi' LIMIT 1;

-- 05.14: 课本 (kèběn) - Sách giáo khoa
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '课本' AND `pinyin_raw` = 'keben' LIMIT 1;

-- 05.15: 课文 (kèwén) - Bài đọc
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '课文' AND `pinyin_raw` = 'kewen' LIMIT 1;

-- 05.16: 写 (xiě) - Viết
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '写' AND `pinyin_raw` = 'xie' LIMIT 1;

-- 05.17: 汉字 (Hànzì) - Chữ Hán; Nhật: kanji
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '汉字' AND `pinyin_raw` = 'hanzi' LIMIT 1;

-- 05.18: 考试 (kǎoshì) - Dự thi; kỳ thi
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '考试' AND `pinyin_raw` = 'kaoshi' LIMIT 1;

-- 05.19: 工作 (gōngzuò) - Làm việc; vận hành
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '工作' AND `pinyin_raw` = 'gongzuo' LIMIT 1;

-- 05.20: 医生 (yīshēng) - Bác sĩ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_05, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '医生' AND `pinyin_raw` = 'yisheng' LIMIT 1;


-- =============================================================================
-- Bài 06 — Đồ ăn, thức uống và nhà hàng
-- =============================================================================
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'Bài 06 — Đồ ăn, thức uống và nhà hàng', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'Bài 06 — Đồ ăn, thức uống và nhà hàng');

SET @lesson_id_06 = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'Bài 06 — Đồ ăn, thức uống và nhà hàng' LIMIT 1);

-- 06.01: 吃 (chī) - Ăn; tiêu thụ; ăn ở
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '吃' AND `pinyin_raw` = 'chi' LIMIT 1;

-- 06.02: 喝 (hē) - Uống
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '喝' AND `pinyin_raw` = 'he' LIMIT 1;

-- 06.03: 饭 (fàn) - Cơm đã nấu; bữa ăn
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '饭' AND `pinyin_raw` = 'fan' LIMIT 1;

-- 06.04: 吃饭 (chīfàn) - Dùng bữa; ăn
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '吃饭' AND `pinyin_raw` = 'chifan' LIMIT 1;

-- 06.05: 米饭 (mǐfàn) - Đã nấu
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '米饭' AND `pinyin_raw` = 'mifan' LIMIT 1;

-- 06.06: 菜 (cài) - Rau; món ăn
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '菜' AND `pinyin_raw` = 'cai' LIMIT 1;

-- 06.07: 肉 (ròu) - Thịt; thịt quả
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '肉' AND `pinyin_raw` = 'rou' LIMIT 1;

-- 06.08: 鸡蛋 (jīdàn) - Trứng; trứng gà
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '鸡蛋' AND `pinyin_raw` = 'jidan' LIMIT 1;

-- 06.09: 面包 (miànbāo) - Bánh mì
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '面包' AND `pinyin_raw` = 'mianbao' LIMIT 1;

-- 06.10: 包子 (bāozi) - Bánh bao
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '包子' AND `pinyin_raw` = 'baozi' LIMIT 1;

-- 06.11: 水 (shuǐ) - Họ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '水' AND `pinyin_raw` = 'shui' LIMIT 1;

-- 06.12: 茶 (chá) - Trà; cây trà
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '茶' AND `pinyin_raw` = 'cha' LIMIT 1;

-- 06.13: 牛奶 (niúnǎi) - Sữa bò
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '牛奶' AND `pinyin_raw` = 'niunai' LIMIT 1;

-- 06.14: 水果 (shuǐguǒ) - Trái cây
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '水果' AND `pinyin_raw` = 'shuiguo' LIMIT 1;

-- 06.15: 好吃 (hǎochī) - Ngon; ngon miệng
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '好吃' AND `pinyin_raw` = 'haochi' LIMIT 1;

-- 06.16: 饿 (è) - Đói; làm cho đói
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '饿' AND `pinyin_raw` = 'e' LIMIT 1;

-- 06.17: 渴 (kě) - Khát
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '渴' AND `pinyin_raw` = 'ke' LIMIT 1;

-- 06.18: 杯 (bēi) - Cốc; ly; chén
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '杯' AND `pinyin_raw` = 'bei' LIMIT 1;

-- 06.19: 杯子 (bēizi) - Cốc; ly
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '杯子' AND `pinyin_raw` = 'beizi' LIMIT 1;

-- 06.20: 饭店 (fàndiàn) - Nhà hàng; khách sạn
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_06, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '饭店' AND `pinyin_raw` = 'fandian' LIMIT 1;


-- =============================================================================
-- Bài 07 — Nhà cửa và sinh hoạt hằng ngày
-- =============================================================================
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'Bài 07 — Nhà cửa và sinh hoạt hằng ngày', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'Bài 07 — Nhà cửa và sinh hoạt hằng ngày');

SET @lesson_id_07 = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'Bài 07 — Nhà cửa và sinh hoạt hằng ngày' LIMIT 1);

-- 07.01: 家 (jiā) - Dùng trong 傢伙|家伙 và 傢俱|家俱
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '家' AND `pinyin_raw` = 'jia' LIMIT 1;

-- 07.02: 家里 (jiā li) - Nhà
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '家里' AND `pinyin_raw` = 'jia li' LIMIT 1;

-- 07.03: 回家 (huí jiā) - Trở về nhà
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '回家' AND `pinyin_raw` = 'hui jia' LIMIT 1;

-- 07.04: 在家 (zàijiā) - Ở nhà; có mặt
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '在家' AND `pinyin_raw` = 'zaijia' LIMIT 1;

-- 07.05: 房子 (fángzi) - Nhà; tòa nhà
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '房子' AND `pinyin_raw` = 'fangzi' LIMIT 1;

-- 07.06: 房间 (fángjiān) - Phòng
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '房间' AND `pinyin_raw` = 'fangjian' LIMIT 1;

-- 07.07: 门 (mén) - Cửa; cổng
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '门' AND `pinyin_raw` = 'men' LIMIT 1;

-- 07.08: 门口 (ménkǒu) - Cửa ra vào; cổng
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '门口' AND `pinyin_raw` = 'menkou' LIMIT 1;

-- 07.09: 床 (chuáng) - Giường; ghế dài
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '床' AND `pinyin_raw` = 'chuang' LIMIT 1;

-- 07.10: 桌子 (zhuōzi) - Bàn; bàn làm việc
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '桌子' AND `pinyin_raw` = 'zhuozi' LIMIT 1;

-- 07.11: 地上 (dìshang) - Trên mặt đất; trên sàn nhà
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '地上' AND `pinyin_raw` = 'dishang' LIMIT 1;

-- 07.12: 电话 (diànhuà) - Điện thoại; cuộc gọi điện thoại
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '电话' AND `pinyin_raw` = 'dianhua' LIMIT 1;

-- 07.13: 手机 (shǒujī) - Điện thoại di động
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '手机' AND `pinyin_raw` = 'shouji' LIMIT 1;

-- 07.14: 电脑 (diànnǎo) - Máy tính
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '电脑' AND `pinyin_raw` = 'diannao' LIMIT 1;

-- 07.15: 电视 (diànshì) - Truyền hình; TV
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '电视' AND `pinyin_raw` = 'dianshi' LIMIT 1;

-- 07.16: 电视机 (diànshìjī) - Máy thu hình
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '电视机' AND `pinyin_raw` = 'dianshiji' LIMIT 1;

-- 07.17: 洗手间 (xǐshǒujiān) - Nhà vệ sinh; phòng vệ sinh
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '洗手间' AND `pinyin_raw` = 'xishoujian' LIMIT 1;

-- 07.18: 洗 (xǐ) - Rửa; tắm; rửa ảnh
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '洗' AND `pinyin_raw` = 'xi' LIMIT 1;

-- 07.19: 睡觉 (shuìjiào) - Đi ngủ; ngủ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '睡觉' AND `pinyin_raw` = 'shuijiao' LIMIT 1;

-- 07.20: 起床 (qǐchuáng) - Thức dậy; ngủ dậy
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_07, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '起床' AND `pinyin_raw` = 'qichuang' LIMIT 1;


-- =============================================================================
-- Bài 08 — Địa điểm, phương hướng và giao thông
-- =============================================================================
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'Bài 08 — Địa điểm, phương hướng và giao thông', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'Bài 08 — Địa điểm, phương hướng và giao thông');

SET @lesson_id_08 = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'Bài 08 — Địa điểm, phương hướng và giao thông' LIMIT 1);

-- 08.01: 去 (qù) - Đi; đi đến
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '去' AND `pinyin_raw` = 'qu' LIMIT 1;

-- 08.02: 来 (lái) - Đến; tới
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '来' AND `pinyin_raw` = 'lai' LIMIT 1;

-- 08.03: 回 (huí) - Xoay vòng; quay lại
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '回' AND `pinyin_raw` = 'hui' LIMIT 1;

-- 08.04: 走 (zǒu) - Đi; rời đi
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '走' AND `pinyin_raw` = 'zou' LIMIT 1;

-- 08.05: 路 (lù) - Họ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '路' AND `pinyin_raw` = 'lu' LIMIT 1;

-- 08.06: 马路 (mǎlù) - Đường phố; đường
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '马路' AND `pinyin_raw` = 'malu' LIMIT 1;

-- 08.07: 车 (chē) - Họ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '车' AND `pinyin_raw` = 'che' LIMIT 1;

-- 08.08: 车站 (chēzhàn) - Ga tàu; dừng xe buýt
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '车站' AND `pinyin_raw` = 'chezhan' LIMIT 1;

-- 08.09: 汽车 (qìchē) - Xe hơi; xe ô tô
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '汽车' AND `pinyin_raw` = 'qiche' LIMIT 1;

-- 08.10: 飞机 (fēijī) - Máy bay
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '飞机' AND `pinyin_raw` = 'feiji' LIMIT 1;

-- 08.11: 坐 (zuò) - Ngồi; đi (xe, tàu)
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '坐' AND `pinyin_raw` = 'zuo' LIMIT 1;

-- 08.12: 上车 (shàng chē) - Lên
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '上车' AND `pinyin_raw` = 'shang che' LIMIT 1;

-- 08.13: 下车 (xià chē) - Xuống
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '下车' AND `pinyin_raw` = 'xia che' LIMIT 1;

-- 08.14: 东 (dōng) - Họ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '东' AND `pinyin_raw` = 'dong' LIMIT 1;

-- 08.15: 南 (nán) - Họ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '南' AND `pinyin_raw` = 'nan' LIMIT 1;

-- 08.16: 西 (xī) - Phương Tây; tiếng Tây Ban Nha
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '西' AND `pinyin_raw` = 'xi' LIMIT 1;

-- 08.17: 北 (běi) - Phía bắc; bị đánh bại
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '北' AND `pinyin_raw` = 'bei' LIMIT 1;

-- 08.18: 左 (zuǒ) - Trái; bên trái
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '左' AND `pinyin_raw` = 'zuo' LIMIT 1;

-- 08.19: 右 (yòu) - Phải; bên phải
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '右' AND `pinyin_raw` = 'you' LIMIT 1;

-- 08.20: 中间 (zhōngjiān) - Ở giữa; bên trong; ở giữa; trong; giữa; trong số
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_08, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '中间' AND `pinyin_raw` = 'zhongjian' LIMIT 1;


-- =============================================================================
-- Bài 09 — Mua sắm, tiền bạc và quần áo
-- =============================================================================
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'Bài 09 — Mua sắm, tiền bạc và quần áo', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'Bài 09 — Mua sắm, tiền bạc và quần áo');

SET @lesson_id_09 = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'Bài 09 — Mua sắm, tiền bạc và quần áo' LIMIT 1);

-- 09.01: 买 (mǎi) - Mua
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '买' AND `pinyin_raw` = 'mai' LIMIT 1;

-- 09.02: 商店 (shāngdiàn) - Cửa hàng; tiệm
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '商店' AND `pinyin_raw` = 'shangdian' LIMIT 1;

-- 09.03: 商场 (shāngchǎng) - Trung tâm mua sắm; trung tâm thương mại
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '商场' AND `pinyin_raw` = 'shangchang' LIMIT 1;

-- 09.04: 东西 (dōngxi) - Đông và tây
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '东西' AND `pinyin_raw` = 'dongxi' LIMIT 1;

-- 09.05: 钱 (qián) - Họ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '钱' AND `pinyin_raw` = 'qian' LIMIT 1;

-- 09.06: 钱包 (qiánbāo) - Ví; bóp tiền
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '钱包' AND `pinyin_raw` = 'qianbao' LIMIT 1;

-- 09.07: 包 (bāo) - Túi; bao; gói
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '包' AND `pinyin_raw` = 'bao' LIMIT 1;

-- 09.08: 花 (huā) - Hoa; tiêu (tiền, thời gian)
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '花' AND `pinyin_raw` = 'hua' LIMIT 1;

-- 09.09: 贵 (guì) - Đắt; được coi trọng; quý giá
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '贵' AND `pinyin_raw` = 'gui' LIMIT 1;

-- 09.10: 衣服 (yīfu) - Quần áo
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '衣服' AND `pinyin_raw` = 'yifu' LIMIT 1;

-- 09.11: 穿 (chuān) - Mặc (áo); đi (giày)
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '穿' AND `pinyin_raw` = 'chuan' LIMIT 1;

-- 09.12: 新 (xīn) - Mới
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '新' AND `pinyin_raw` = 'xin' LIMIT 1;

-- 09.13: 大 (dà) - Lớn; to
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '大' AND `pinyin_raw` = 'da' LIMIT 1;

-- 09.14: 小 (xiǎo) - Nhỏ; bé
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '小' AND `pinyin_raw` = 'xiao' LIMIT 1;

-- 09.15: 白 (bái) - Màu trắng; trắng
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '白' AND `pinyin_raw` = 'bai' LIMIT 1;

-- 09.16: 多少 (duōshao) - Số lượng; mức độ; phần nào
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '多少' AND `pinyin_raw` = 'duoshao' LIMIT 1;

-- 09.17: 几 (jǐ) - Mấy; vài
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '几' AND `pinyin_raw` = 'ji' LIMIT 1;

-- 09.18: 块 (kuài) - Cục; tảng; miếng; lượng từ cho miếng vải, bánh, xà phòng, v.v.
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '块' AND `pinyin_raw` = 'kuai' LIMIT 1;

-- 09.19: 元 (yuán) - Họ; triều Nguyên
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '元' AND `pinyin_raw` = 'yuan' LIMIT 1;

-- 09.20: 找 (zhǎo) - Tìm; kiếm; thối lại tiền
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_09, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '找' AND `pinyin_raw` = 'zhao' LIMIT 1;


-- =============================================================================
-- Bài 10 — Sở thích, thể thao và giải trí
-- =============================================================================
INSERT INTO `lesson` (`title`, `status`, `created_by`, `created_at`, `updated_at`, `version`)
SELECT 'Bài 10 — Sở thích, thể thao và giải trí', 'Approved', @creator_id, NOW(), NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM `lesson` WHERE `title` = 'Bài 10 — Sở thích, thể thao và giải trí');

SET @lesson_id_10 = (SELECT `lesson_id` FROM `lesson` WHERE `title` = 'Bài 10 — Sở thích, thể thao và giải trí' LIMIT 1);

-- 10.01: 爱好 (àihào) - Thích; đam mê; lấy làm thú vui; say mê; sở thích
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 1 FROM `vocabulary` WHERE `hanzi` = '爱好' AND `pinyin_raw` = 'aihao' LIMIT 1;

-- 10.02: 喜欢 (xǐhuan) - Thích; ưa thích
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 2 FROM `vocabulary` WHERE `hanzi` = '喜欢' AND `pinyin_raw` = 'xihuan' LIMIT 1;

-- 10.03: 爱 (ài) - Yêu; thích; tình cảm
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 3 FROM `vocabulary` WHERE `hanzi` = '爱' AND `pinyin_raw` = 'ai' LIMIT 1;

-- 10.04: 玩儿 (wánr) - Chơi; vui chơi
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 4 FROM `vocabulary` WHERE `hanzi` = '玩儿' AND `pinyin_raw` = 'wanr' LIMIT 1;

-- 10.05: 好玩儿 (hǎowánr) - Biến thể er hoá của 好玩
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 5 FROM `vocabulary` WHERE `hanzi` = '好玩儿' AND `pinyin_raw` = 'haowanr' LIMIT 1;

-- 10.06: 球 (qiú) - Quả bóng; hình cầu
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 6 FROM `vocabulary` WHERE `hanzi` = '球' AND `pinyin_raw` = 'qiu' LIMIT 1;

-- 10.07: 打球 (dǎ qiú) - Chơi bóng; chơi với bóng
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 7 FROM `vocabulary` WHERE `hanzi` = '打球' AND `pinyin_raw` = 'da qiu' LIMIT 1;

-- 10.08: 跑 (pǎo) - Chạy
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 8 FROM `vocabulary` WHERE `hanzi` = '跑' AND `pinyin_raw` = 'pao' LIMIT 1;

-- 10.09: 唱 (chàng) - Hát; gọi to
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 9 FROM `vocabulary` WHERE `hanzi` = '唱' AND `pinyin_raw` = 'chang' LIMIT 1;

-- 10.10: 歌 (gē) - Bài hát; hát
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 10 FROM `vocabulary` WHERE `hanzi` = '歌' AND `pinyin_raw` = 'ge' LIMIT 1;

-- 10.11: 唱歌 (chànggē) - Hát một bài hát
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 11 FROM `vocabulary` WHERE `hanzi` = '唱歌' AND `pinyin_raw` = 'changge' LIMIT 1;

-- 10.12: 听 (tīng) - Nghe
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 12 FROM `vocabulary` WHERE `hanzi` = '听' AND `pinyin_raw` = 'ting' LIMIT 1;

-- 10.13: 好听 (hǎotīng) - Nghe hay
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 13 FROM `vocabulary` WHERE `hanzi` = '好听' AND `pinyin_raw` = 'haoting' LIMIT 1;

-- 10.14: 看 (kàn) - Nhìn; xem; thăm
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 14 FROM `vocabulary` WHERE `hanzi` = '看' AND `pinyin_raw` = 'kan' LIMIT 1;

-- 10.15: 好看 (hǎokàn) - Ưa nhìn; xinh đẹp
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 15 FROM `vocabulary` WHERE `hanzi` = '好看' AND `pinyin_raw` = 'haokan' LIMIT 1;

-- 10.16: 电影 (diànyǐng) - Phim; điện ảnh
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 16 FROM `vocabulary` WHERE `hanzi` = '电影' AND `pinyin_raw` = 'dianying' LIMIT 1;

-- 10.17: 电影院 (diànyǐngyuàn) - Rạp chiếu phim; rạp phim
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 17 FROM `vocabulary` WHERE `hanzi` = '电影院' AND `pinyin_raw` = 'dianyingyuan' LIMIT 1;

-- 10.18: 上网 (shàngwǎng) - Lên mạng; kết nối Internet
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 18 FROM `vocabulary` WHERE `hanzi` = '上网' AND `pinyin_raw` = 'shangwang' LIMIT 1;

-- 10.19: 高兴 (gāoxìng) - Vui; vui vẻ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 19 FROM `vocabulary` WHERE `hanzi` = '高兴' AND `pinyin_raw` = 'gaoxing' LIMIT 1;

-- 10.20: 放假 (fàngjià) - Nghỉ lễ hoặc kỳ nghỉ
INSERT IGNORE INTO `lesson_vocabulary` (`lesson_id`, `vocab_id`, `order_index`)
SELECT @lesson_id_10, `vocab_id`, 20 FROM `vocabulary` WHERE `hanzi` = '放假' AND `pinyin_raw` = 'fangjia' LIMIT 1;

