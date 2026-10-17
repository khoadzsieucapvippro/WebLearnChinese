-- =============================================================================
-- Migration: V22__audit_and_update_vocabulary_radicals.sql
-- Description:
--   1. Correct Pinyin for Kangxi Radicals 49 (己 -> jǐ) and 172 (隹 -> zhuī)
--   2. Update VOCAB_RADICAL associations for all 500 HSK 1 vocabulary words
--      with audited constituent radicals and accurate hanzi_char attribution
-- Database: MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Correct missing Pinyin values for Kangxi radicals 49 and 172
-- -----------------------------------------------------------------------------
UPDATE `RADICAL` SET `pinyin` = 'jǐ' WHERE `radical_id` = 49 AND (`pinyin` IS NULL OR `pinyin` = '');
UPDATE `RADICAL` SET `pinyin` = 'zhuī' WHERE `radical_id` = 172 AND (`pinyin` IS NULL OR `pinyin` = '');

-- -----------------------------------------------------------------------------
-- Step 2: Clear outdated/incomplete VOCAB_RADICAL associations for HSK 1 vocabulary
-- -----------------------------------------------------------------------------
DELETE vr FROM `VOCAB_RADICAL` vr
JOIN `VOCABULARY` v ON vr.`vocab_id` = v.`vocab_id`
WHERE v.`hsk_level` = 1;

-- -----------------------------------------------------------------------------
-- Step 3: Insert audited constituent radicals with character attribution (hanzi_char)
-- -----------------------------------------------------------------------------
INSERT INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`)
SELECT v.`vocab_id`, m.`radical_id`, m.`hanzi_char`
FROM (
    SELECT '爱' AS `hanzi`, 'ai' AS `pinyin_raw`, 87 AS `radical_id`, '爱' AS `hanzi_char`
    UNION ALL
    SELECT '爱' AS `hanzi`, 'ai' AS `pinyin_raw`, 14 AS `radical_id`, '爱' AS `hanzi_char`
    UNION ALL
    SELECT '爱' AS `hanzi`, 'ai' AS `pinyin_raw`, 29 AS `radical_id`, '爱' AS `hanzi_char`
    UNION ALL
    SELECT '爱好' AS `hanzi`, 'aihao' AS `pinyin_raw`, 87 AS `radical_id`, '爱' AS `hanzi_char`
    UNION ALL
    SELECT '爱好' AS `hanzi`, 'aihao' AS `pinyin_raw`, 14 AS `radical_id`, '爱' AS `hanzi_char`
    UNION ALL
    SELECT '爱好' AS `hanzi`, 'aihao' AS `pinyin_raw`, 29 AS `radical_id`, '爱' AS `hanzi_char`
    UNION ALL
    SELECT '爱好' AS `hanzi`, 'aihao' AS `pinyin_raw`, 38 AS `radical_id`, '好' AS `hanzi_char`
    UNION ALL
    SELECT '爱好' AS `hanzi`, 'aihao' AS `pinyin_raw`, 39 AS `radical_id`, '好' AS `hanzi_char`
    UNION ALL
    SELECT '八' AS `hanzi`, 'ba' AS `pinyin_raw`, 12 AS `radical_id`, '八' AS `hanzi_char`
    UNION ALL
    SELECT '爸爸' AS `hanzi`, 'baba' AS `pinyin_raw`, 88 AS `radical_id`, '爸' AS `hanzi_char`
    UNION ALL
    SELECT '爸爸' AS `hanzi`, 'baba' AS `pinyin_raw`, 49 AS `radical_id`, '爸' AS `hanzi_char`
    UNION ALL
    SELECT '吧' AS `hanzi`, 'ba' AS `pinyin_raw`, 30 AS `radical_id`, '吧' AS `hanzi_char`
    UNION ALL
    SELECT '吧' AS `hanzi`, 'ba' AS `pinyin_raw`, 49 AS `radical_id`, '吧' AS `hanzi_char`
    UNION ALL
    SELECT '白' AS `hanzi`, 'bai' AS `pinyin_raw`, 106 AS `radical_id`, '白' AS `hanzi_char`
    UNION ALL
    SELECT '白天' AS `hanzi`, 'baitian' AS `pinyin_raw`, 106 AS `radical_id`, '白' AS `hanzi_char`
    UNION ALL
    SELECT '白天' AS `hanzi`, 'baitian' AS `pinyin_raw`, 37 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '白天' AS `hanzi`, 'baitian' AS `pinyin_raw`, 1 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '百' AS `hanzi`, 'bai' AS `pinyin_raw`, 106 AS `radical_id`, '百' AS `hanzi_char`
    UNION ALL
    SELECT '百' AS `hanzi`, 'bai' AS `pinyin_raw`, 1 AS `radical_id`, '百' AS `hanzi_char`
    UNION ALL
    SELECT '班' AS `hanzi`, 'ban' AS `pinyin_raw`, 96 AS `radical_id`, '班' AS `hanzi_char`
    UNION ALL
    SELECT '班' AS `hanzi`, 'ban' AS `pinyin_raw`, 18 AS `radical_id`, '班' AS `hanzi_char`
    UNION ALL
    SELECT '半' AS `hanzi`, 'ban' AS `pinyin_raw`, 24 AS `radical_id`, '半' AS `hanzi_char`
    UNION ALL
    SELECT '半' AS `hanzi`, 'ban' AS `pinyin_raw`, 12 AS `radical_id`, '半' AS `hanzi_char`
    UNION ALL
    SELECT '半' AS `hanzi`, 'ban' AS `pinyin_raw`, 93 AS `radical_id`, '半' AS `hanzi_char`
    UNION ALL
    SELECT '半年' AS `hanzi`, 'ban nian' AS `pinyin_raw`, 24 AS `radical_id`, '半' AS `hanzi_char`
    UNION ALL
    SELECT '半年' AS `hanzi`, 'ban nian' AS `pinyin_raw`, 12 AS `radical_id`, '半' AS `hanzi_char`
    UNION ALL
    SELECT '半年' AS `hanzi`, 'ban nian' AS `pinyin_raw`, 93 AS `radical_id`, '半' AS `hanzi_char`
    UNION ALL
    SELECT '半年' AS `hanzi`, 'ban nian' AS `pinyin_raw`, 51 AS `radical_id`, '年' AS `hanzi_char`
    UNION ALL
    SELECT '半天' AS `hanzi`, 'bantian' AS `pinyin_raw`, 24 AS `radical_id`, '半' AS `hanzi_char`
    UNION ALL
    SELECT '半天' AS `hanzi`, 'bantian' AS `pinyin_raw`, 12 AS `radical_id`, '半' AS `hanzi_char`
    UNION ALL
    SELECT '半天' AS `hanzi`, 'bantian' AS `pinyin_raw`, 93 AS `radical_id`, '半' AS `hanzi_char`
    UNION ALL
    SELECT '半天' AS `hanzi`, 'bantian' AS `pinyin_raw`, 37 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '半天' AS `hanzi`, 'bantian' AS `pinyin_raw`, 1 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '帮' AS `hanzi`, 'bang' AS `pinyin_raw`, 50 AS `radical_id`, '帮' AS `hanzi_char`
    UNION ALL
    SELECT '帮' AS `hanzi`, 'bang' AS `pinyin_raw`, 163 AS `radical_id`, '帮' AS `hanzi_char`
    UNION ALL
    SELECT '帮忙' AS `hanzi`, 'bangmang' AS `pinyin_raw`, 50 AS `radical_id`, '帮' AS `hanzi_char`
    UNION ALL
    SELECT '帮忙' AS `hanzi`, 'bangmang' AS `pinyin_raw`, 163 AS `radical_id`, '帮' AS `hanzi_char`
    UNION ALL
    SELECT '帮忙' AS `hanzi`, 'bangmang' AS `pinyin_raw`, 61 AS `radical_id`, '忙' AS `hanzi_char`
    UNION ALL
    SELECT '帮忙' AS `hanzi`, 'bangmang' AS `pinyin_raw`, 8 AS `radical_id`, '忙' AS `hanzi_char`
    UNION ALL
    SELECT '包' AS `hanzi`, 'bao' AS `pinyin_raw`, 20 AS `radical_id`, '包' AS `hanzi_char`
    UNION ALL
    SELECT '包' AS `hanzi`, 'bao' AS `pinyin_raw`, 49 AS `radical_id`, '包' AS `hanzi_char`
    UNION ALL
    SELECT '包子' AS `hanzi`, 'baozi' AS `pinyin_raw`, 20 AS `radical_id`, '包' AS `hanzi_char`
    UNION ALL
    SELECT '包子' AS `hanzi`, 'baozi' AS `pinyin_raw`, 49 AS `radical_id`, '包' AS `hanzi_char`
    UNION ALL
    SELECT '包子' AS `hanzi`, 'baozi' AS `pinyin_raw`, 39 AS `radical_id`, '子' AS `hanzi_char`
    UNION ALL
    SELECT '杯' AS `hanzi`, 'bei' AS `pinyin_raw`, 75 AS `radical_id`, '杯' AS `hanzi_char`
    UNION ALL
    SELECT '杯' AS `hanzi`, 'bei' AS `pinyin_raw`, 1 AS `radical_id`, '杯' AS `hanzi_char`
    UNION ALL
    SELECT '杯子' AS `hanzi`, 'beizi' AS `pinyin_raw`, 75 AS `radical_id`, '杯' AS `hanzi_char`
    UNION ALL
    SELECT '杯子' AS `hanzi`, 'beizi' AS `pinyin_raw`, 1 AS `radical_id`, '杯' AS `hanzi_char`
    UNION ALL
    SELECT '杯子' AS `hanzi`, 'beizi' AS `pinyin_raw`, 39 AS `radical_id`, '子' AS `hanzi_char`
    UNION ALL
    SELECT '北' AS `hanzi`, 'bei' AS `pinyin_raw`, 21 AS `radical_id`, '北' AS `hanzi_char`
    UNION ALL
    SELECT '北边' AS `hanzi`, 'beibian' AS `pinyin_raw`, 21 AS `radical_id`, '北' AS `hanzi_char`
    UNION ALL
    SELECT '北边' AS `hanzi`, 'beibian' AS `pinyin_raw`, 162 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '北边' AS `hanzi`, 'beibian' AS `pinyin_raw`, 19 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '北京' AS `hanzi`, 'beijing' AS `pinyin_raw`, 21 AS `radical_id`, '北' AS `hanzi_char`
    UNION ALL
    SELECT '北京' AS `hanzi`, 'beijing' AS `pinyin_raw`, 8 AS `radical_id`, '京' AS `hanzi_char`
    UNION ALL
    SELECT '北京' AS `hanzi`, 'beijing' AS `pinyin_raw`, 30 AS `radical_id`, '京' AS `hanzi_char`
    UNION ALL
    SELECT '北京' AS `hanzi`, 'beijing' AS `pinyin_raw`, 42 AS `radical_id`, '京' AS `hanzi_char`
    UNION ALL
    SELECT '本' AS `hanzi`, 'ben' AS `pinyin_raw`, 75 AS `radical_id`, '本' AS `hanzi_char`
    UNION ALL
    SELECT '本' AS `hanzi`, 'ben' AS `pinyin_raw`, 1 AS `radical_id`, '本' AS `hanzi_char`
    UNION ALL
    SELECT '本子' AS `hanzi`, 'benzi' AS `pinyin_raw`, 75 AS `radical_id`, '本' AS `hanzi_char`
    UNION ALL
    SELECT '本子' AS `hanzi`, 'benzi' AS `pinyin_raw`, 1 AS `radical_id`, '本' AS `hanzi_char`
    UNION ALL
    SELECT '本子' AS `hanzi`, 'benzi' AS `pinyin_raw`, 39 AS `radical_id`, '子' AS `hanzi_char`
    UNION ALL
    SELECT '比' AS `hanzi`, 'bi' AS `pinyin_raw`, 81 AS `radical_id`, '比' AS `hanzi_char`
    UNION ALL
    SELECT '别' AS `hanzi`, 'bie' AS `pinyin_raw`, 18 AS `radical_id`, '别' AS `hanzi_char`
    UNION ALL
    SELECT '别' AS `hanzi`, 'bie' AS `pinyin_raw`, 30 AS `radical_id`, '别' AS `hanzi_char`
    UNION ALL
    SELECT '别' AS `hanzi`, 'bie' AS `pinyin_raw`, 19 AS `radical_id`, '别' AS `hanzi_char`
    UNION ALL
    SELECT '别的' AS `hanzi`, 'biede' AS `pinyin_raw`, 18 AS `radical_id`, '别' AS `hanzi_char`
    UNION ALL
    SELECT '别的' AS `hanzi`, 'biede' AS `pinyin_raw`, 30 AS `radical_id`, '别' AS `hanzi_char`
    UNION ALL
    SELECT '别的' AS `hanzi`, 'biede' AS `pinyin_raw`, 19 AS `radical_id`, '别' AS `hanzi_char`
    UNION ALL
    SELECT '别的' AS `hanzi`, 'biede' AS `pinyin_raw`, 106 AS `radical_id`, '的' AS `hanzi_char`
    UNION ALL
    SELECT '别的' AS `hanzi`, 'biede' AS `pinyin_raw`, 20 AS `radical_id`, '的' AS `hanzi_char`
    UNION ALL
    SELECT '别的' AS `hanzi`, 'biede' AS `pinyin_raw`, 3 AS `radical_id`, '的' AS `hanzi_char`
    UNION ALL
    SELECT '别人' AS `hanzi`, 'bieren' AS `pinyin_raw`, 18 AS `radical_id`, '别' AS `hanzi_char`
    UNION ALL
    SELECT '别人' AS `hanzi`, 'bieren' AS `pinyin_raw`, 30 AS `radical_id`, '别' AS `hanzi_char`
    UNION ALL
    SELECT '别人' AS `hanzi`, 'bieren' AS `pinyin_raw`, 19 AS `radical_id`, '别' AS `hanzi_char`
    UNION ALL
    SELECT '别人' AS `hanzi`, 'bieren' AS `pinyin_raw`, 9 AS `radical_id`, '人' AS `hanzi_char`
    UNION ALL
    SELECT '病' AS `hanzi`, 'bing' AS `pinyin_raw`, 104 AS `radical_id`, '病' AS `hanzi_char`
    UNION ALL
    SELECT '病' AS `hanzi`, 'bing' AS `pinyin_raw`, 1 AS `radical_id`, '病' AS `hanzi_char`
    UNION ALL
    SELECT '病人' AS `hanzi`, 'bingren' AS `pinyin_raw`, 104 AS `radical_id`, '病' AS `hanzi_char`
    UNION ALL
    SELECT '病人' AS `hanzi`, 'bingren' AS `pinyin_raw`, 1 AS `radical_id`, '病' AS `hanzi_char`
    UNION ALL
    SELECT '病人' AS `hanzi`, 'bingren' AS `pinyin_raw`, 9 AS `radical_id`, '人' AS `hanzi_char`
    UNION ALL
    SELECT '不大' AS `hanzi`, 'bu da' AS `pinyin_raw`, 1 AS `radical_id`, '不' AS `hanzi_char`
    UNION ALL
    SELECT '不大' AS `hanzi`, 'bu da' AS `pinyin_raw`, 37 AS `radical_id`, '大' AS `hanzi_char`
    UNION ALL
    SELECT '不对' AS `hanzi`, 'budui' AS `pinyin_raw`, 1 AS `radical_id`, '不' AS `hanzi_char`
    UNION ALL
    SELECT '不对' AS `hanzi`, 'budui' AS `pinyin_raw`, 41 AS `radical_id`, '对' AS `hanzi_char`
    UNION ALL
    SELECT '不对' AS `hanzi`, 'budui' AS `pinyin_raw`, 29 AS `radical_id`, '对' AS `hanzi_char`
    UNION ALL
    SELECT '不客气' AS `hanzi`, 'bu keqi' AS `pinyin_raw`, 1 AS `radical_id`, '不' AS `hanzi_char`
    UNION ALL
    SELECT '不客气' AS `hanzi`, 'bu keqi' AS `pinyin_raw`, 40 AS `radical_id`, '客' AS `hanzi_char`
    UNION ALL
    SELECT '不客气' AS `hanzi`, 'bu keqi' AS `pinyin_raw`, 30 AS `radical_id`, '客' AS `hanzi_char`
    UNION ALL
    SELECT '不客气' AS `hanzi`, 'bu keqi' AS `pinyin_raw`, 34 AS `radical_id`, '客' AS `hanzi_char`
    UNION ALL
    SELECT '不客气' AS `hanzi`, 'bu keqi' AS `pinyin_raw`, 84 AS `radical_id`, '气' AS `hanzi_char`
    UNION ALL
    SELECT '不用' AS `hanzi`, 'buyong' AS `pinyin_raw`, 1 AS `radical_id`, '不' AS `hanzi_char`
    UNION ALL
    SELECT '不用' AS `hanzi`, 'buyong' AS `pinyin_raw`, 101 AS `radical_id`, '用' AS `hanzi_char`
    UNION ALL
    SELECT '不' AS `hanzi`, 'bu' AS `pinyin_raw`, 1 AS `radical_id`, '不' AS `hanzi_char`
    UNION ALL
    SELECT '菜' AS `hanzi`, 'cai' AS `pinyin_raw`, 140 AS `radical_id`, '菜' AS `hanzi_char`
    UNION ALL
    SELECT '菜' AS `hanzi`, 'cai' AS `pinyin_raw`, 165 AS `radical_id`, '菜' AS `hanzi_char`
    UNION ALL
    SELECT '菜' AS `hanzi`, 'cai' AS `pinyin_raw`, 87 AS `radical_id`, '菜' AS `hanzi_char`
    UNION ALL
    SELECT '菜' AS `hanzi`, 'cai' AS `pinyin_raw`, 75 AS `radical_id`, '菜' AS `hanzi_char`
    UNION ALL
    SELECT '茶' AS `hanzi`, 'cha' AS `pinyin_raw`, 140 AS `radical_id`, '茶' AS `hanzi_char`
    UNION ALL
    SELECT '茶' AS `hanzi`, 'cha' AS `pinyin_raw`, 9 AS `radical_id`, '茶' AS `hanzi_char`
    UNION ALL
    SELECT '茶' AS `hanzi`, 'cha' AS `pinyin_raw`, 75 AS `radical_id`, '茶' AS `hanzi_char`
    UNION ALL
    SELECT '差' AS `hanzi`, 'cha' AS `pinyin_raw`, 48 AS `radical_id`, '差' AS `hanzi_char`
    UNION ALL
    SELECT '差' AS `hanzi`, 'cha' AS `pinyin_raw`, 123 AS `radical_id`, '差' AS `hanzi_char`
    UNION ALL
    SELECT '常' AS `hanzi`, 'chang' AS `pinyin_raw`, 50 AS `radical_id`, '常' AS `hanzi_char`
    UNION ALL
    SELECT '常' AS `hanzi`, 'chang' AS `pinyin_raw`, 42 AS `radical_id`, '常' AS `hanzi_char`
    UNION ALL
    SELECT '常' AS `hanzi`, 'chang' AS `pinyin_raw`, 13 AS `radical_id`, '常' AS `hanzi_char`
    UNION ALL
    SELECT '常' AS `hanzi`, 'chang' AS `pinyin_raw`, 30 AS `radical_id`, '常' AS `hanzi_char`
    UNION ALL
    SELECT '常常' AS `hanzi`, 'changchang' AS `pinyin_raw`, 50 AS `radical_id`, '常' AS `hanzi_char`
    UNION ALL
    SELECT '常常' AS `hanzi`, 'changchang' AS `pinyin_raw`, 42 AS `radical_id`, '常' AS `hanzi_char`
    UNION ALL
    SELECT '常常' AS `hanzi`, 'changchang' AS `pinyin_raw`, 13 AS `radical_id`, '常' AS `hanzi_char`
    UNION ALL
    SELECT '常常' AS `hanzi`, 'changchang' AS `pinyin_raw`, 30 AS `radical_id`, '常' AS `hanzi_char`
    UNION ALL
    SELECT '唱' AS `hanzi`, 'chang' AS `pinyin_raw`, 30 AS `radical_id`, '唱' AS `hanzi_char`
    UNION ALL
    SELECT '唱' AS `hanzi`, 'chang' AS `pinyin_raw`, 72 AS `radical_id`, '唱' AS `hanzi_char`
    UNION ALL
    SELECT '唱' AS `hanzi`, 'chang' AS `pinyin_raw`, 73 AS `radical_id`, '唱' AS `hanzi_char`
    UNION ALL
    SELECT '唱歌' AS `hanzi`, 'changge' AS `pinyin_raw`, 30 AS `radical_id`, '唱' AS `hanzi_char`
    UNION ALL
    SELECT '唱歌' AS `hanzi`, 'changge' AS `pinyin_raw`, 72 AS `radical_id`, '唱' AS `hanzi_char`
    UNION ALL
    SELECT '唱歌' AS `hanzi`, 'changge' AS `pinyin_raw`, 73 AS `radical_id`, '唱' AS `hanzi_char`
    UNION ALL
    SELECT '唱歌' AS `hanzi`, 'changge' AS `pinyin_raw`, 76 AS `radical_id`, '歌' AS `hanzi_char`
    UNION ALL
    SELECT '车' AS `hanzi`, 'che' AS `pinyin_raw`, 159 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '车' AS `hanzi`, 'che' AS `pinyin_raw`, 1 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '车' AS `hanzi`, 'che' AS `pinyin_raw`, 5 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '车' AS `hanzi`, 'che' AS `pinyin_raw`, 24 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '车票' AS `hanzi`, 'chepiao' AS `pinyin_raw`, 159 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '车票' AS `hanzi`, 'chepiao' AS `pinyin_raw`, 1 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '车票' AS `hanzi`, 'chepiao' AS `pinyin_raw`, 5 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '车票' AS `hanzi`, 'chepiao' AS `pinyin_raw`, 24 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '车票' AS `hanzi`, 'chepiao' AS `pinyin_raw`, 113 AS `radical_id`, '票' AS `hanzi_char`
    UNION ALL
    SELECT '车票' AS `hanzi`, 'chepiao' AS `pinyin_raw`, 146 AS `radical_id`, '票' AS `hanzi_char`
    UNION ALL
    SELECT '车上' AS `hanzi`, 'che shang' AS `pinyin_raw`, 159 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '车上' AS `hanzi`, 'che shang' AS `pinyin_raw`, 1 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '车上' AS `hanzi`, 'che shang' AS `pinyin_raw`, 5 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '车上' AS `hanzi`, 'che shang' AS `pinyin_raw`, 24 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '车上' AS `hanzi`, 'che shang' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '车站' AS `hanzi`, 'chezhan' AS `pinyin_raw`, 159 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '车站' AS `hanzi`, 'chezhan' AS `pinyin_raw`, 1 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '车站' AS `hanzi`, 'chezhan' AS `pinyin_raw`, 5 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '车站' AS `hanzi`, 'chezhan' AS `pinyin_raw`, 24 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '车站' AS `hanzi`, 'chezhan' AS `pinyin_raw`, 117 AS `radical_id`, '站' AS `hanzi_char`
    UNION ALL
    SELECT '车站' AS `hanzi`, 'chezhan' AS `pinyin_raw`, 25 AS `radical_id`, '站' AS `hanzi_char`
    UNION ALL
    SELECT '车站' AS `hanzi`, 'chezhan' AS `pinyin_raw`, 30 AS `radical_id`, '站' AS `hanzi_char`
    UNION ALL
    SELECT '吃' AS `hanzi`, 'chi' AS `pinyin_raw`, 30 AS `radical_id`, '吃' AS `hanzi_char`
    UNION ALL
    SELECT '吃' AS `hanzi`, 'chi' AS `pinyin_raw`, 5 AS `radical_id`, '吃' AS `hanzi_char`
    UNION ALL
    SELECT '吃饭' AS `hanzi`, 'chifan' AS `pinyin_raw`, 30 AS `radical_id`, '吃' AS `hanzi_char`
    UNION ALL
    SELECT '吃饭' AS `hanzi`, 'chifan' AS `pinyin_raw`, 5 AS `radical_id`, '吃' AS `hanzi_char`
    UNION ALL
    SELECT '吃饭' AS `hanzi`, 'chifan' AS `pinyin_raw`, 184 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '吃饭' AS `hanzi`, 'chifan' AS `pinyin_raw`, 29 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '吃饭' AS `hanzi`, 'chifan' AS `pinyin_raw`, 27 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '出' AS `hanzi`, 'chu' AS `pinyin_raw`, 17 AS `radical_id`, '出' AS `hanzi_char`
    UNION ALL
    SELECT '出' AS `hanzi`, 'chu' AS `pinyin_raw`, 45 AS `radical_id`, '出' AS `hanzi_char`
    UNION ALL
    SELECT '出来' AS `hanzi`, 'chulai' AS `pinyin_raw`, 17 AS `radical_id`, '出' AS `hanzi_char`
    UNION ALL
    SELECT '出来' AS `hanzi`, 'chulai' AS `pinyin_raw`, 45 AS `radical_id`, '出' AS `hanzi_char`
    UNION ALL
    SELECT '出来' AS `hanzi`, 'chulai' AS `pinyin_raw`, 75 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '出来' AS `hanzi`, 'chulai' AS `pinyin_raw`, 1 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '出来' AS `hanzi`, 'chulai' AS `pinyin_raw`, 12 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '出去' AS `hanzi`, 'chuqu' AS `pinyin_raw`, 17 AS `radical_id`, '出' AS `hanzi_char`
    UNION ALL
    SELECT '出去' AS `hanzi`, 'chuqu' AS `pinyin_raw`, 45 AS `radical_id`, '出' AS `hanzi_char`
    UNION ALL
    SELECT '出去' AS `hanzi`, 'chuqu' AS `pinyin_raw`, 28 AS `radical_id`, '去' AS `hanzi_char`
    UNION ALL
    SELECT '出去' AS `hanzi`, 'chuqu' AS `pinyin_raw`, 32 AS `radical_id`, '去' AS `hanzi_char`
    UNION ALL
    SELECT '穿' AS `hanzi`, 'chuan' AS `pinyin_raw`, 116 AS `radical_id`, '穿' AS `hanzi_char`
    UNION ALL
    SELECT '穿' AS `hanzi`, 'chuan' AS `pinyin_raw`, 92 AS `radical_id`, '穿' AS `hanzi_char`
    UNION ALL
    SELECT '床' AS `hanzi`, 'chuang' AS `pinyin_raw`, 53 AS `radical_id`, '床' AS `hanzi_char`
    UNION ALL
    SELECT '床' AS `hanzi`, 'chuang' AS `pinyin_raw`, 75 AS `radical_id`, '床' AS `hanzi_char`
    UNION ALL
    SELECT '次' AS `hanzi`, 'ci' AS `pinyin_raw`, 76 AS `radical_id`, '次' AS `hanzi_char`
    UNION ALL
    SELECT '次' AS `hanzi`, 'ci' AS `pinyin_raw`, 15 AS `radical_id`, '次' AS `hanzi_char`
    UNION ALL
    SELECT '从' AS `hanzi`, 'cong' AS `pinyin_raw`, 9 AS `radical_id`, '从' AS `hanzi_char`
    UNION ALL
    SELECT '错' AS `hanzi`, 'cuo' AS `pinyin_raw`, 167 AS `radical_id`, '错' AS `hanzi_char`
    UNION ALL
    SELECT '错' AS `hanzi`, 'cuo' AS `pinyin_raw`, 72 AS `radical_id`, '错' AS `hanzi_char`
    UNION ALL
    SELECT '打' AS `hanzi`, 'da' AS `pinyin_raw`, 64 AS `radical_id`, '打' AS `hanzi_char`
    UNION ALL
    SELECT '打' AS `hanzi`, 'da' AS `pinyin_raw`, 1 AS `radical_id`, '打' AS `hanzi_char`
    UNION ALL
    SELECT '打车' AS `hanzi`, 'dache' AS `pinyin_raw`, 64 AS `radical_id`, '打' AS `hanzi_char`
    UNION ALL
    SELECT '打车' AS `hanzi`, 'dache' AS `pinyin_raw`, 1 AS `radical_id`, '打' AS `hanzi_char`
    UNION ALL
    SELECT '打车' AS `hanzi`, 'dache' AS `pinyin_raw`, 159 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '打车' AS `hanzi`, 'dache' AS `pinyin_raw`, 5 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '打车' AS `hanzi`, 'dache' AS `pinyin_raw`, 24 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '打电话' AS `hanzi`, 'da dianhua' AS `pinyin_raw`, 64 AS `radical_id`, '打' AS `hanzi_char`
    UNION ALL
    SELECT '打电话' AS `hanzi`, 'da dianhua' AS `pinyin_raw`, 1 AS `radical_id`, '打' AS `hanzi_char`
    UNION ALL
    SELECT '打电话' AS `hanzi`, 'da dianhua' AS `pinyin_raw`, 73 AS `radical_id`, '电' AS `hanzi_char`
    UNION ALL
    SELECT '打电话' AS `hanzi`, 'da dianhua' AS `pinyin_raw`, 5 AS `radical_id`, '电' AS `hanzi_char`
    UNION ALL
    SELECT '打电话' AS `hanzi`, 'da dianhua' AS `pinyin_raw`, 149 AS `radical_id`, '话' AS `hanzi_char`
    UNION ALL
    SELECT '打电话' AS `hanzi`, 'da dianhua' AS `pinyin_raw`, 135 AS `radical_id`, '话' AS `hanzi_char`
    UNION ALL
    SELECT '打开' AS `hanzi`, 'dakai' AS `pinyin_raw`, 64 AS `radical_id`, '打' AS `hanzi_char`
    UNION ALL
    SELECT '打开' AS `hanzi`, 'dakai' AS `pinyin_raw`, 1 AS `radical_id`, '打' AS `hanzi_char`
    UNION ALL
    SELECT '打开' AS `hanzi`, 'dakai' AS `pinyin_raw`, 55 AS `radical_id`, '开' AS `hanzi_char`
    UNION ALL
    SELECT '打球' AS `hanzi`, 'da qiu' AS `pinyin_raw`, 64 AS `radical_id`, '打' AS `hanzi_char`
    UNION ALL
    SELECT '打球' AS `hanzi`, 'da qiu' AS `pinyin_raw`, 1 AS `radical_id`, '打' AS `hanzi_char`
    UNION ALL
    SELECT '打球' AS `hanzi`, 'da qiu' AS `pinyin_raw`, 96 AS `radical_id`, '球' AS `hanzi_char`
    UNION ALL
    SELECT '打球' AS `hanzi`, 'da qiu' AS `pinyin_raw`, 85 AS `radical_id`, '球' AS `hanzi_char`
    UNION ALL
    SELECT '大' AS `hanzi`, 'da' AS `pinyin_raw`, 37 AS `radical_id`, '大' AS `hanzi_char`
    UNION ALL
    SELECT '大学' AS `hanzi`, 'daxue' AS `pinyin_raw`, 37 AS `radical_id`, '大' AS `hanzi_char`
    UNION ALL
    SELECT '大学' AS `hanzi`, 'daxue' AS `pinyin_raw`, 39 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '大学' AS `hanzi`, 'daxue' AS `pinyin_raw`, 42 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '大学' AS `hanzi`, 'daxue' AS `pinyin_raw`, 14 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '大学生' AS `hanzi`, 'daxuesheng' AS `pinyin_raw`, 37 AS `radical_id`, '大' AS `hanzi_char`
    UNION ALL
    SELECT '大学生' AS `hanzi`, 'daxuesheng' AS `pinyin_raw`, 39 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '大学生' AS `hanzi`, 'daxuesheng' AS `pinyin_raw`, 42 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '大学生' AS `hanzi`, 'daxuesheng' AS `pinyin_raw`, 14 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '大学生' AS `hanzi`, 'daxuesheng' AS `pinyin_raw`, 100 AS `radical_id`, '生' AS `hanzi_char`
    UNION ALL
    SELECT '到' AS `hanzi`, 'dao' AS `pinyin_raw`, 18 AS `radical_id`, '到' AS `hanzi_char`
    UNION ALL
    SELECT '到' AS `hanzi`, 'dao' AS `pinyin_raw`, 133 AS `radical_id`, '到' AS `hanzi_char`
    UNION ALL
    SELECT '得到' AS `hanzi`, 'dedao' AS `pinyin_raw`, 60 AS `radical_id`, '得' AS `hanzi_char`
    UNION ALL
    SELECT '得到' AS `hanzi`, 'dedao' AS `pinyin_raw`, 72 AS `radical_id`, '得' AS `hanzi_char`
    UNION ALL
    SELECT '得到' AS `hanzi`, 'dedao' AS `pinyin_raw`, 1 AS `radical_id`, '得' AS `hanzi_char`
    UNION ALL
    SELECT '得到' AS `hanzi`, 'dedao' AS `pinyin_raw`, 41 AS `radical_id`, '得' AS `hanzi_char`
    UNION ALL
    SELECT '得到' AS `hanzi`, 'dedao' AS `pinyin_raw`, 18 AS `radical_id`, '到' AS `hanzi_char`
    UNION ALL
    SELECT '得到' AS `hanzi`, 'dedao' AS `pinyin_raw`, 133 AS `radical_id`, '到' AS `hanzi_char`
    UNION ALL
    SELECT '地' AS `hanzi`, 'de' AS `pinyin_raw`, 32 AS `radical_id`, '地' AS `hanzi_char`
    UNION ALL
    SELECT '地' AS `hanzi`, 'de' AS `pinyin_raw`, 5 AS `radical_id`, '地' AS `hanzi_char`
    UNION ALL
    SELECT '的' AS `hanzi`, 'de' AS `pinyin_raw`, 106 AS `radical_id`, '的' AS `hanzi_char`
    UNION ALL
    SELECT '的' AS `hanzi`, 'de' AS `pinyin_raw`, 20 AS `radical_id`, '的' AS `hanzi_char`
    UNION ALL
    SELECT '的' AS `hanzi`, 'de' AS `pinyin_raw`, 3 AS `radical_id`, '的' AS `hanzi_char`
    UNION ALL
    SELECT '等' AS `hanzi`, 'deng' AS `pinyin_raw`, 118 AS `radical_id`, '等' AS `hanzi_char`
    UNION ALL
    SELECT '等' AS `hanzi`, 'deng' AS `pinyin_raw`, 41 AS `radical_id`, '等' AS `hanzi_char`
    UNION ALL
    SELECT '等' AS `hanzi`, 'deng' AS `pinyin_raw`, 32 AS `radical_id`, '等' AS `hanzi_char`
    UNION ALL
    SELECT '地' AS `hanzi`, 'di' AS `pinyin_raw`, 32 AS `radical_id`, '地' AS `hanzi_char`
    UNION ALL
    SELECT '地' AS `hanzi`, 'di' AS `pinyin_raw`, 5 AS `radical_id`, '地' AS `hanzi_char`
    UNION ALL
    SELECT '地点' AS `hanzi`, 'didian' AS `pinyin_raw`, 32 AS `radical_id`, '地' AS `hanzi_char`
    UNION ALL
    SELECT '地点' AS `hanzi`, 'didian' AS `pinyin_raw`, 5 AS `radical_id`, '地' AS `hanzi_char`
    UNION ALL
    SELECT '地点' AS `hanzi`, 'didian' AS `pinyin_raw`, 86 AS `radical_id`, '点' AS `hanzi_char`
    UNION ALL
    SELECT '地点' AS `hanzi`, 'didian' AS `pinyin_raw`, 25 AS `radical_id`, '点' AS `hanzi_char`
    UNION ALL
    SELECT '地点' AS `hanzi`, 'didian' AS `pinyin_raw`, 30 AS `radical_id`, '点' AS `hanzi_char`
    UNION ALL
    SELECT '地方' AS `hanzi`, 'difang' AS `pinyin_raw`, 32 AS `radical_id`, '地' AS `hanzi_char`
    UNION ALL
    SELECT '地方' AS `hanzi`, 'difang' AS `pinyin_raw`, 5 AS `radical_id`, '地' AS `hanzi_char`
    UNION ALL
    SELECT '地方' AS `hanzi`, 'difang' AS `pinyin_raw`, 70 AS `radical_id`, '方' AS `hanzi_char`
    UNION ALL
    SELECT '地上' AS `hanzi`, 'dishang' AS `pinyin_raw`, 32 AS `radical_id`, '地' AS `hanzi_char`
    UNION ALL
    SELECT '地上' AS `hanzi`, 'dishang' AS `pinyin_raw`, 5 AS `radical_id`, '地' AS `hanzi_char`
    UNION ALL
    SELECT '地上' AS `hanzi`, 'dishang' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '地上' AS `hanzi`, 'dishang' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '地图' AS `hanzi`, 'ditu' AS `pinyin_raw`, 32 AS `radical_id`, '地' AS `hanzi_char`
    UNION ALL
    SELECT '地图' AS `hanzi`, 'ditu' AS `pinyin_raw`, 5 AS `radical_id`, '地' AS `hanzi_char`
    UNION ALL
    SELECT '地图' AS `hanzi`, 'ditu' AS `pinyin_raw`, 31 AS `radical_id`, '图' AS `hanzi_char`
    UNION ALL
    SELECT '地图' AS `hanzi`, 'ditu' AS `pinyin_raw`, 15 AS `radical_id`, '图' AS `hanzi_char`
    UNION ALL
    SELECT '地图' AS `hanzi`, 'ditu' AS `pinyin_raw`, 34 AS `radical_id`, '图' AS `hanzi_char`
    UNION ALL
    SELECT '弟弟' AS `hanzi`, 'didi' AS `pinyin_raw`, 57 AS `radical_id`, '弟' AS `hanzi_char`
    UNION ALL
    SELECT '弟弟' AS `hanzi`, 'didi' AS `pinyin_raw`, 12 AS `radical_id`, '弟' AS `hanzi_char`
    UNION ALL
    SELECT '第' AS `hanzi`, 'di (di-er)' AS `pinyin_raw`, 118 AS `radical_id`, '第' AS `hanzi_char`
    UNION ALL
    SELECT '第' AS `hanzi`, 'di (di-er)' AS `pinyin_raw`, 57 AS `radical_id`, '第' AS `hanzi_char`
    UNION ALL
    SELECT '第' AS `hanzi`, 'di (di-er)' AS `pinyin_raw`, 12 AS `radical_id`, '第' AS `hanzi_char`
    UNION ALL
    SELECT '点' AS `hanzi`, 'dian' AS `pinyin_raw`, 86 AS `radical_id`, '点' AS `hanzi_char`
    UNION ALL
    SELECT '点' AS `hanzi`, 'dian' AS `pinyin_raw`, 25 AS `radical_id`, '点' AS `hanzi_char`
    UNION ALL
    SELECT '点' AS `hanzi`, 'dian' AS `pinyin_raw`, 30 AS `radical_id`, '点' AS `hanzi_char`
    UNION ALL
    SELECT '电' AS `hanzi`, 'dian' AS `pinyin_raw`, 73 AS `radical_id`, '电' AS `hanzi_char`
    UNION ALL
    SELECT '电' AS `hanzi`, 'dian' AS `pinyin_raw`, 5 AS `radical_id`, '电' AS `hanzi_char`
    UNION ALL
    SELECT '电话' AS `hanzi`, 'dianhua' AS `pinyin_raw`, 73 AS `radical_id`, '电' AS `hanzi_char`
    UNION ALL
    SELECT '电话' AS `hanzi`, 'dianhua' AS `pinyin_raw`, 5 AS `radical_id`, '电' AS `hanzi_char`
    UNION ALL
    SELECT '电话' AS `hanzi`, 'dianhua' AS `pinyin_raw`, 149 AS `radical_id`, '话' AS `hanzi_char`
    UNION ALL
    SELECT '电话' AS `hanzi`, 'dianhua' AS `pinyin_raw`, 135 AS `radical_id`, '话' AS `hanzi_char`
    UNION ALL
    SELECT '电脑' AS `hanzi`, 'diannao' AS `pinyin_raw`, 73 AS `radical_id`, '电' AS `hanzi_char`
    UNION ALL
    SELECT '电脑' AS `hanzi`, 'diannao' AS `pinyin_raw`, 5 AS `radical_id`, '电' AS `hanzi_char`
    UNION ALL
    SELECT '电脑' AS `hanzi`, 'diannao' AS `pinyin_raw`, 130 AS `radical_id`, '脑' AS `hanzi_char`
    UNION ALL
    SELECT '电脑' AS `hanzi`, 'diannao' AS `pinyin_raw`, 8 AS `radical_id`, '脑' AS `hanzi_char`
    UNION ALL
    SELECT '电脑' AS `hanzi`, 'diannao' AS `pinyin_raw`, 17 AS `radical_id`, '脑' AS `hanzi_char`
    UNION ALL
    SELECT '电视' AS `hanzi`, 'dianshi' AS `pinyin_raw`, 73 AS `radical_id`, '电' AS `hanzi_char`
    UNION ALL
    SELECT '电视' AS `hanzi`, 'dianshi' AS `pinyin_raw`, 5 AS `radical_id`, '电' AS `hanzi_char`
    UNION ALL
    SELECT '电视' AS `hanzi`, 'dianshi' AS `pinyin_raw`, 147 AS `radical_id`, '视' AS `hanzi_char`
    UNION ALL
    SELECT '电视' AS `hanzi`, 'dianshi' AS `pinyin_raw`, 113 AS `radical_id`, '视' AS `hanzi_char`
    UNION ALL
    SELECT '电视机' AS `hanzi`, 'dianshiji' AS `pinyin_raw`, 73 AS `radical_id`, '电' AS `hanzi_char`
    UNION ALL
    SELECT '电视机' AS `hanzi`, 'dianshiji' AS `pinyin_raw`, 5 AS `radical_id`, '电' AS `hanzi_char`
    UNION ALL
    SELECT '电视机' AS `hanzi`, 'dianshiji' AS `pinyin_raw`, 147 AS `radical_id`, '视' AS `hanzi_char`
    UNION ALL
    SELECT '电视机' AS `hanzi`, 'dianshiji' AS `pinyin_raw`, 113 AS `radical_id`, '视' AS `hanzi_char`
    UNION ALL
    SELECT '电视机' AS `hanzi`, 'dianshiji' AS `pinyin_raw`, 75 AS `radical_id`, '机' AS `hanzi_char`
    UNION ALL
    SELECT '电视机' AS `hanzi`, 'dianshiji' AS `pinyin_raw`, 16 AS `radical_id`, '机' AS `hanzi_char`
    UNION ALL
    SELECT '电影' AS `hanzi`, 'dianying' AS `pinyin_raw`, 73 AS `radical_id`, '电' AS `hanzi_char`
    UNION ALL
    SELECT '电影' AS `hanzi`, 'dianying' AS `pinyin_raw`, 5 AS `radical_id`, '电' AS `hanzi_char`
    UNION ALL
    SELECT '电影' AS `hanzi`, 'dianying' AS `pinyin_raw`, 59 AS `radical_id`, '影' AS `hanzi_char`
    UNION ALL
    SELECT '电影' AS `hanzi`, 'dianying' AS `pinyin_raw`, 72 AS `radical_id`, '影' AS `hanzi_char`
    UNION ALL
    SELECT '电影院' AS `hanzi`, 'dianyingyuan' AS `pinyin_raw`, 73 AS `radical_id`, '电' AS `hanzi_char`
    UNION ALL
    SELECT '电影院' AS `hanzi`, 'dianyingyuan' AS `pinyin_raw`, 5 AS `radical_id`, '电' AS `hanzi_char`
    UNION ALL
    SELECT '电影院' AS `hanzi`, 'dianyingyuan' AS `pinyin_raw`, 59 AS `radical_id`, '影' AS `hanzi_char`
    UNION ALL
    SELECT '电影院' AS `hanzi`, 'dianyingyuan' AS `pinyin_raw`, 72 AS `radical_id`, '影' AS `hanzi_char`
    UNION ALL
    SELECT '电影院' AS `hanzi`, 'dianyingyuan' AS `pinyin_raw`, 170 AS `radical_id`, '院' AS `hanzi_char`
    UNION ALL
    SELECT '电影院' AS `hanzi`, 'dianyingyuan' AS `pinyin_raw`, 40 AS `radical_id`, '院' AS `hanzi_char`
    UNION ALL
    SELECT '东' AS `hanzi`, 'dong' AS `pinyin_raw`, 1 AS `radical_id`, '东' AS `hanzi_char`
    UNION ALL
    SELECT '东' AS `hanzi`, 'dong' AS `pinyin_raw`, 5 AS `radical_id`, '东' AS `hanzi_char`
    UNION ALL
    SELECT '东' AS `hanzi`, 'dong' AS `pinyin_raw`, 42 AS `radical_id`, '东' AS `hanzi_char`
    UNION ALL
    SELECT '东边' AS `hanzi`, 'dongbian' AS `pinyin_raw`, 1 AS `radical_id`, '东' AS `hanzi_char`
    UNION ALL
    SELECT '东边' AS `hanzi`, 'dongbian' AS `pinyin_raw`, 5 AS `radical_id`, '东' AS `hanzi_char`
    UNION ALL
    SELECT '东边' AS `hanzi`, 'dongbian' AS `pinyin_raw`, 42 AS `radical_id`, '东' AS `hanzi_char`
    UNION ALL
    SELECT '东边' AS `hanzi`, 'dongbian' AS `pinyin_raw`, 162 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '东边' AS `hanzi`, 'dongbian' AS `pinyin_raw`, 19 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '东西' AS `hanzi`, 'dongxi' AS `pinyin_raw`, 1 AS `radical_id`, '东' AS `hanzi_char`
    UNION ALL
    SELECT '东西' AS `hanzi`, 'dongxi' AS `pinyin_raw`, 5 AS `radical_id`, '东' AS `hanzi_char`
    UNION ALL
    SELECT '东西' AS `hanzi`, 'dongxi' AS `pinyin_raw`, 42 AS `radical_id`, '东' AS `hanzi_char`
    UNION ALL
    SELECT '东西' AS `hanzi`, 'dongxi' AS `pinyin_raw`, 146 AS `radical_id`, '西' AS `hanzi_char`
    UNION ALL
    SELECT '东西' AS `hanzi`, 'dongxi' AS `pinyin_raw`, 10 AS `radical_id`, '西' AS `hanzi_char`
    UNION ALL
    SELECT '东西' AS `hanzi`, 'dongxi' AS `pinyin_raw`, 31 AS `radical_id`, '西' AS `hanzi_char`
    UNION ALL
    SELECT '动' AS `hanzi`, 'dong' AS `pinyin_raw`, 19 AS `radical_id`, '动' AS `hanzi_char`
    UNION ALL
    SELECT '动' AS `hanzi`, 'dong' AS `pinyin_raw`, 7 AS `radical_id`, '动' AS `hanzi_char`
    UNION ALL
    SELECT '动' AS `hanzi`, 'dong' AS `pinyin_raw`, 28 AS `radical_id`, '动' AS `hanzi_char`
    UNION ALL
    SELECT '动作' AS `hanzi`, 'dongzuo' AS `pinyin_raw`, 19 AS `radical_id`, '动' AS `hanzi_char`
    UNION ALL
    SELECT '动作' AS `hanzi`, 'dongzuo' AS `pinyin_raw`, 7 AS `radical_id`, '动' AS `hanzi_char`
    UNION ALL
    SELECT '动作' AS `hanzi`, 'dongzuo' AS `pinyin_raw`, 28 AS `radical_id`, '动' AS `hanzi_char`
    UNION ALL
    SELECT '动作' AS `hanzi`, 'dongzuo' AS `pinyin_raw`, 9 AS `radical_id`, '作' AS `hanzi_char`
    UNION ALL
    SELECT '动作' AS `hanzi`, 'dongzuo' AS `pinyin_raw`, 4 AS `radical_id`, '作' AS `hanzi_char`
    UNION ALL
    SELECT '动作' AS `hanzi`, 'dongzuo' AS `pinyin_raw`, 1 AS `radical_id`, '作' AS `hanzi_char`
    UNION ALL
    SELECT '都' AS `hanzi`, 'dou' AS `pinyin_raw`, 163 AS `radical_id`, '都' AS `hanzi_char`
    UNION ALL
    SELECT '都' AS `hanzi`, 'dou' AS `pinyin_raw`, 125 AS `radical_id`, '都' AS `hanzi_char`
    UNION ALL
    SELECT '都' AS `hanzi`, 'dou' AS `pinyin_raw`, 72 AS `radical_id`, '都' AS `hanzi_char`
    UNION ALL
    SELECT '读' AS `hanzi`, 'du' AS `pinyin_raw`, 149 AS `radical_id`, '读' AS `hanzi_char`
    UNION ALL
    SELECT '读' AS `hanzi`, 'du' AS `pinyin_raw`, 24 AS `radical_id`, '读' AS `hanzi_char`
    UNION ALL
    SELECT '读书' AS `hanzi`, 'dushu' AS `pinyin_raw`, 149 AS `radical_id`, '读' AS `hanzi_char`
    UNION ALL
    SELECT '读书' AS `hanzi`, 'dushu' AS `pinyin_raw`, 24 AS `radical_id`, '读' AS `hanzi_char`
    UNION ALL
    SELECT '读书' AS `hanzi`, 'dushu' AS `pinyin_raw`, 2 AS `radical_id`, '书' AS `hanzi_char`
    UNION ALL
    SELECT '对' AS `hanzi`, 'dui' AS `pinyin_raw`, 41 AS `radical_id`, '对' AS `hanzi_char`
    UNION ALL
    SELECT '对' AS `hanzi`, 'dui' AS `pinyin_raw`, 29 AS `radical_id`, '对' AS `hanzi_char`
    UNION ALL
    SELECT '对不起' AS `hanzi`, 'duibuqi' AS `pinyin_raw`, 41 AS `radical_id`, '对' AS `hanzi_char`
    UNION ALL
    SELECT '对不起' AS `hanzi`, 'duibuqi' AS `pinyin_raw`, 29 AS `radical_id`, '对' AS `hanzi_char`
    UNION ALL
    SELECT '对不起' AS `hanzi`, 'duibuqi' AS `pinyin_raw`, 1 AS `radical_id`, '不' AS `hanzi_char`
    UNION ALL
    SELECT '对不起' AS `hanzi`, 'duibuqi' AS `pinyin_raw`, 156 AS `radical_id`, '起' AS `hanzi_char`
    UNION ALL
    SELECT '对不起' AS `hanzi`, 'duibuqi' AS `pinyin_raw`, 49 AS `radical_id`, '起' AS `hanzi_char`
    UNION ALL
    SELECT '多' AS `hanzi`, 'duo' AS `pinyin_raw`, 36 AS `radical_id`, '多' AS `hanzi_char`
    UNION ALL
    SELECT '多少' AS `hanzi`, 'duoshao' AS `pinyin_raw`, 36 AS `radical_id`, '多' AS `hanzi_char`
    UNION ALL
    SELECT '多少' AS `hanzi`, 'duoshao' AS `pinyin_raw`, 42 AS `radical_id`, '少' AS `hanzi_char`
    UNION ALL
    SELECT '多少' AS `hanzi`, 'duoshao' AS `pinyin_raw`, 4 AS `radical_id`, '少' AS `hanzi_char`
    UNION ALL
    SELECT '饿' AS `hanzi`, 'e' AS `pinyin_raw`, 184 AS `radical_id`, '饿' AS `hanzi_char`
    UNION ALL
    SELECT '饿' AS `hanzi`, 'e' AS `pinyin_raw`, 62 AS `radical_id`, '饿' AS `hanzi_char`
    UNION ALL
    SELECT '饿' AS `hanzi`, 'e' AS `pinyin_raw`, 64 AS `radical_id`, '饿' AS `hanzi_char`
    UNION ALL
    SELECT '儿子' AS `hanzi`, 'erzi' AS `pinyin_raw`, 10 AS `radical_id`, '儿' AS `hanzi_char`
    UNION ALL
    SELECT '儿子' AS `hanzi`, 'erzi' AS `pinyin_raw`, 39 AS `radical_id`, '子' AS `hanzi_char`
    UNION ALL
    SELECT '二' AS `hanzi`, 'er' AS `pinyin_raw`, 7 AS `radical_id`, '二' AS `hanzi_char`
    UNION ALL
    SELECT '饭' AS `hanzi`, 'fan' AS `pinyin_raw`, 184 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '饭' AS `hanzi`, 'fan' AS `pinyin_raw`, 29 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '饭' AS `hanzi`, 'fan' AS `pinyin_raw`, 27 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '饭店' AS `hanzi`, 'fandian' AS `pinyin_raw`, 184 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '饭店' AS `hanzi`, 'fandian' AS `pinyin_raw`, 29 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '饭店' AS `hanzi`, 'fandian' AS `pinyin_raw`, 27 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '饭店' AS `hanzi`, 'fandian' AS `pinyin_raw`, 53 AS `radical_id`, '店' AS `hanzi_char`
    UNION ALL
    SELECT '饭店' AS `hanzi`, 'fandian' AS `pinyin_raw`, 25 AS `radical_id`, '店' AS `hanzi_char`
    UNION ALL
    SELECT '饭店' AS `hanzi`, 'fandian' AS `pinyin_raw`, 30 AS `radical_id`, '店' AS `hanzi_char`
    UNION ALL
    SELECT '房间' AS `hanzi`, 'fangjian' AS `pinyin_raw`, 63 AS `radical_id`, '房' AS `hanzi_char`
    UNION ALL
    SELECT '房间' AS `hanzi`, 'fangjian' AS `pinyin_raw`, 70 AS `radical_id`, '房' AS `hanzi_char`
    UNION ALL
    SELECT '房间' AS `hanzi`, 'fangjian' AS `pinyin_raw`, 169 AS `radical_id`, '间' AS `hanzi_char`
    UNION ALL
    SELECT '房间' AS `hanzi`, 'fangjian' AS `pinyin_raw`, 72 AS `radical_id`, '间' AS `hanzi_char`
    UNION ALL
    SELECT '房子' AS `hanzi`, 'fangzi' AS `pinyin_raw`, 63 AS `radical_id`, '房' AS `hanzi_char`
    UNION ALL
    SELECT '房子' AS `hanzi`, 'fangzi' AS `pinyin_raw`, 70 AS `radical_id`, '房' AS `hanzi_char`
    UNION ALL
    SELECT '房子' AS `hanzi`, 'fangzi' AS `pinyin_raw`, 39 AS `radical_id`, '子' AS `hanzi_char`
    UNION ALL
    SELECT '放' AS `hanzi`, 'fang' AS `pinyin_raw`, 66 AS `radical_id`, '放' AS `hanzi_char`
    UNION ALL
    SELECT '放' AS `hanzi`, 'fang' AS `pinyin_raw`, 70 AS `radical_id`, '放' AS `hanzi_char`
    UNION ALL
    SELECT '放假' AS `hanzi`, 'fangjia' AS `pinyin_raw`, 66 AS `radical_id`, '放' AS `hanzi_char`
    UNION ALL
    SELECT '放假' AS `hanzi`, 'fangjia' AS `pinyin_raw`, 70 AS `radical_id`, '放' AS `hanzi_char`
    UNION ALL
    SELECT '放假' AS `hanzi`, 'fangjia' AS `pinyin_raw`, 9 AS `radical_id`, '假' AS `hanzi_char`
    UNION ALL
    SELECT '放假' AS `hanzi`, 'fangjia' AS `pinyin_raw`, 29 AS `radical_id`, '假' AS `hanzi_char`
    UNION ALL
    SELECT '放学' AS `hanzi`, 'fangxue' AS `pinyin_raw`, 66 AS `radical_id`, '放' AS `hanzi_char`
    UNION ALL
    SELECT '放学' AS `hanzi`, 'fangxue' AS `pinyin_raw`, 70 AS `radical_id`, '放' AS `hanzi_char`
    UNION ALL
    SELECT '放学' AS `hanzi`, 'fangxue' AS `pinyin_raw`, 39 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '放学' AS `hanzi`, 'fangxue' AS `pinyin_raw`, 42 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '放学' AS `hanzi`, 'fangxue' AS `pinyin_raw`, 14 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '飞' AS `hanzi`, 'fei' AS `pinyin_raw`, 183 AS `radical_id`, '飞' AS `hanzi_char`
    UNION ALL
    SELECT '飞机' AS `hanzi`, 'feiji' AS `pinyin_raw`, 183 AS `radical_id`, '飞' AS `hanzi_char`
    UNION ALL
    SELECT '飞机' AS `hanzi`, 'feiji' AS `pinyin_raw`, 75 AS `radical_id`, '机' AS `hanzi_char`
    UNION ALL
    SELECT '飞机' AS `hanzi`, 'feiji' AS `pinyin_raw`, 16 AS `radical_id`, '机' AS `hanzi_char`
    UNION ALL
    SELECT '非常' AS `hanzi`, 'feichang' AS `pinyin_raw`, 175 AS `radical_id`, '非' AS `hanzi_char`
    UNION ALL
    SELECT '非常' AS `hanzi`, 'feichang' AS `pinyin_raw`, 50 AS `radical_id`, '常' AS `hanzi_char`
    UNION ALL
    SELECT '非常' AS `hanzi`, 'feichang' AS `pinyin_raw`, 42 AS `radical_id`, '常' AS `hanzi_char`
    UNION ALL
    SELECT '非常' AS `hanzi`, 'feichang' AS `pinyin_raw`, 13 AS `radical_id`, '常' AS `hanzi_char`
    UNION ALL
    SELECT '非常' AS `hanzi`, 'feichang' AS `pinyin_raw`, 30 AS `radical_id`, '常' AS `hanzi_char`
    UNION ALL
    SELECT '分' AS `hanzi`, 'fen' AS `pinyin_raw`, 18 AS `radical_id`, '分' AS `hanzi_char`
    UNION ALL
    SELECT '分' AS `hanzi`, 'fen' AS `pinyin_raw`, 12 AS `radical_id`, '分' AS `hanzi_char`
    UNION ALL
    SELECT '风' AS `hanzi`, 'feng' AS `pinyin_raw`, 182 AS `radical_id`, '风' AS `hanzi_char`
    UNION ALL
    SELECT '风' AS `hanzi`, 'feng' AS `pinyin_raw`, 16 AS `radical_id`, '风' AS `hanzi_char`
    UNION ALL
    SELECT '风' AS `hanzi`, 'feng' AS `pinyin_raw`, 4 AS `radical_id`, '风' AS `hanzi_char`
    UNION ALL
    SELECT '干' AS `hanzi`, 'gan' AS `pinyin_raw`, 24 AS `radical_id`, '干' AS `hanzi_char`
    UNION ALL
    SELECT '干净' AS `hanzi`, 'ganjing' AS `pinyin_raw`, 24 AS `radical_id`, '干' AS `hanzi_char`
    UNION ALL
    SELECT '干净' AS `hanzi`, 'ganjing' AS `pinyin_raw`, 15 AS `radical_id`, '净' AS `hanzi_char`
    UNION ALL
    SELECT '干净' AS `hanzi`, 'ganjing' AS `pinyin_raw`, 6 AS `radical_id`, '净' AS `hanzi_char`
    UNION ALL
    SELECT '干净' AS `hanzi`, 'ganjing' AS `pinyin_raw`, 18 AS `radical_id`, '净' AS `hanzi_char`
    UNION ALL
    SELECT '干净' AS `hanzi`, 'ganjing' AS `pinyin_raw`, 58 AS `radical_id`, '净' AS `hanzi_char`
    UNION ALL
    SELECT '干' AS `hanzi`, 'gan4' AS `pinyin_raw`, 24 AS `radical_id`, '干' AS `hanzi_char`
    UNION ALL
    SELECT '干什么' AS `hanzi`, 'gan shenme' AS `pinyin_raw`, 24 AS `radical_id`, '干' AS `hanzi_char`
    UNION ALL
    SELECT '干什么' AS `hanzi`, 'gan shenme' AS `pinyin_raw`, 9 AS `radical_id`, '什' AS `hanzi_char`
    UNION ALL
    SELECT '干什么' AS `hanzi`, 'gan shenme' AS `pinyin_raw`, 4 AS `radical_id`, '么' AS `hanzi_char`
    UNION ALL
    SELECT '干什么' AS `hanzi`, 'gan shenme' AS `pinyin_raw`, 28 AS `radical_id`, '么' AS `hanzi_char`
    UNION ALL
    SELECT '高' AS `hanzi`, 'gao' AS `pinyin_raw`, 189 AS `radical_id`, '高' AS `hanzi_char`
    UNION ALL
    SELECT '高兴' AS `hanzi`, 'gaoxing' AS `pinyin_raw`, 189 AS `radical_id`, '高' AS `hanzi_char`
    UNION ALL
    SELECT '高兴' AS `hanzi`, 'gaoxing' AS `pinyin_raw`, 12 AS `radical_id`, '兴' AS `hanzi_char`
    UNION ALL
    SELECT '高兴' AS `hanzi`, 'gaoxing' AS `pinyin_raw`, 42 AS `radical_id`, '兴' AS `hanzi_char`
    UNION ALL
    SELECT '高兴' AS `hanzi`, 'gaoxing' AS `pinyin_raw`, 1 AS `radical_id`, '兴' AS `hanzi_char`
    UNION ALL
    SELECT '告诉' AS `hanzi`, 'gaosu' AS `pinyin_raw`, 30 AS `radical_id`, '告' AS `hanzi_char`
    UNION ALL
    SELECT '告诉' AS `hanzi`, 'gaosu' AS `pinyin_raw`, 93 AS `radical_id`, '告' AS `hanzi_char`
    UNION ALL
    SELECT '告诉' AS `hanzi`, 'gaosu' AS `pinyin_raw`, 149 AS `radical_id`, '诉' AS `hanzi_char`
    UNION ALL
    SELECT '告诉' AS `hanzi`, 'gaosu' AS `pinyin_raw`, 69 AS `radical_id`, '诉' AS `hanzi_char`
    UNION ALL
    SELECT '告诉' AS `hanzi`, 'gaosu' AS `pinyin_raw`, 3 AS `radical_id`, '诉' AS `hanzi_char`
    UNION ALL
    SELECT '哥哥' AS `hanzi`, 'gege' AS `pinyin_raw`, 30 AS `radical_id`, '哥' AS `hanzi_char`
    UNION ALL
    SELECT '歌' AS `hanzi`, 'ge' AS `pinyin_raw`, 76 AS `radical_id`, '歌' AS `hanzi_char`
    UNION ALL
    SELECT '歌' AS `hanzi`, 'ge' AS `pinyin_raw`, 30 AS `radical_id`, '歌' AS `hanzi_char`
    UNION ALL
    SELECT '个' AS `hanzi`, 'ge' AS `pinyin_raw`, 2 AS `radical_id`, '个' AS `hanzi_char`
    UNION ALL
    SELECT '个' AS `hanzi`, 'ge' AS `pinyin_raw`, 9 AS `radical_id`, '个' AS `hanzi_char`
    UNION ALL
    SELECT '给' AS `hanzi`, 'gei' AS `pinyin_raw`, 120 AS `radical_id`, '给' AS `hanzi_char`
    UNION ALL
    SELECT '给' AS `hanzi`, 'gei' AS `pinyin_raw`, 30 AS `radical_id`, '给' AS `hanzi_char`
    UNION ALL
    SELECT '跟' AS `hanzi`, 'gen' AS `pinyin_raw`, 157 AS `radical_id`, '跟' AS `hanzi_char`
    UNION ALL
    SELECT '跟' AS `hanzi`, 'gen' AS `pinyin_raw`, 138 AS `radical_id`, '跟' AS `hanzi_char`
    UNION ALL
    SELECT '工人' AS `hanzi`, 'gongren' AS `pinyin_raw`, 48 AS `radical_id`, '工' AS `hanzi_char`
    UNION ALL
    SELECT '工人' AS `hanzi`, 'gongren' AS `pinyin_raw`, 9 AS `radical_id`, '人' AS `hanzi_char`
    UNION ALL
    SELECT '工作' AS `hanzi`, 'gongzuo' AS `pinyin_raw`, 48 AS `radical_id`, '工' AS `hanzi_char`
    UNION ALL
    SELECT '工作' AS `hanzi`, 'gongzuo' AS `pinyin_raw`, 9 AS `radical_id`, '作' AS `hanzi_char`
    UNION ALL
    SELECT '工作' AS `hanzi`, 'gongzuo' AS `pinyin_raw`, 4 AS `radical_id`, '作' AS `hanzi_char`
    UNION ALL
    SELECT '工作' AS `hanzi`, 'gongzuo' AS `pinyin_raw`, 1 AS `radical_id`, '作' AS `hanzi_char`
    UNION ALL
    SELECT '关' AS `hanzi`, 'guan' AS `pinyin_raw`, 12 AS `radical_id`, '关' AS `hanzi_char`
    UNION ALL
    SELECT '关' AS `hanzi`, 'guan' AS `pinyin_raw`, 37 AS `radical_id`, '关' AS `hanzi_char`
    UNION ALL
    SELECT '关' AS `hanzi`, 'guan' AS `pinyin_raw`, 1 AS `radical_id`, '关' AS `hanzi_char`
    UNION ALL
    SELECT '关上' AS `hanzi`, 'guanshang' AS `pinyin_raw`, 12 AS `radical_id`, '关' AS `hanzi_char`
    UNION ALL
    SELECT '关上' AS `hanzi`, 'guanshang' AS `pinyin_raw`, 37 AS `radical_id`, '关' AS `hanzi_char`
    UNION ALL
    SELECT '关上' AS `hanzi`, 'guanshang' AS `pinyin_raw`, 1 AS `radical_id`, '关' AS `hanzi_char`
    UNION ALL
    SELECT '关上' AS `hanzi`, 'guanshang' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '贵' AS `hanzi`, 'gui' AS `pinyin_raw`, 154 AS `radical_id`, '贵' AS `hanzi_char`
    UNION ALL
    SELECT '贵' AS `hanzi`, 'gui' AS `pinyin_raw`, 2 AS `radical_id`, '贵' AS `hanzi_char`
    UNION ALL
    SELECT '贵' AS `hanzi`, 'gui' AS `pinyin_raw`, 30 AS `radical_id`, '贵' AS `hanzi_char`
    UNION ALL
    SELECT '贵' AS `hanzi`, 'gui' AS `pinyin_raw`, 1 AS `radical_id`, '贵' AS `hanzi_char`
    UNION ALL
    SELECT '国' AS `hanzi`, 'guo' AS `pinyin_raw`, 31 AS `radical_id`, '国' AS `hanzi_char`
    UNION ALL
    SELECT '国' AS `hanzi`, 'guo' AS `pinyin_raw`, 96 AS `radical_id`, '国' AS `hanzi_char`
    UNION ALL
    SELECT '国家' AS `hanzi`, 'guojia' AS `pinyin_raw`, 31 AS `radical_id`, '国' AS `hanzi_char`
    UNION ALL
    SELECT '国家' AS `hanzi`, 'guojia' AS `pinyin_raw`, 96 AS `radical_id`, '国' AS `hanzi_char`
    UNION ALL
    SELECT '国家' AS `hanzi`, 'guojia' AS `pinyin_raw`, 40 AS `radical_id`, '家' AS `hanzi_char`
    UNION ALL
    SELECT '国家' AS `hanzi`, 'guojia' AS `pinyin_raw`, 152 AS `radical_id`, '家' AS `hanzi_char`
    UNION ALL
    SELECT '国外' AS `hanzi`, 'guo wai' AS `pinyin_raw`, 31 AS `radical_id`, '国' AS `hanzi_char`
    UNION ALL
    SELECT '国外' AS `hanzi`, 'guo wai' AS `pinyin_raw`, 96 AS `radical_id`, '国' AS `hanzi_char`
    UNION ALL
    SELECT '国外' AS `hanzi`, 'guo wai' AS `pinyin_raw`, 36 AS `radical_id`, '外' AS `hanzi_char`
    UNION ALL
    SELECT '国外' AS `hanzi`, 'guo wai' AS `pinyin_raw`, 25 AS `radical_id`, '外' AS `hanzi_char`
    UNION ALL
    SELECT '过' AS `hanzi`, 'guo' AS `pinyin_raw`, 162 AS `radical_id`, '过' AS `hanzi_char`
    UNION ALL
    SELECT '过' AS `hanzi`, 'guo' AS `pinyin_raw`, 41 AS `radical_id`, '过' AS `hanzi_char`
    UNION ALL
    SELECT '还' AS `hanzi`, 'hai' AS `pinyin_raw`, 162 AS `radical_id`, '还' AS `hanzi_char`
    UNION ALL
    SELECT '还' AS `hanzi`, 'hai' AS `pinyin_raw`, 1 AS `radical_id`, '还' AS `hanzi_char`
    UNION ALL
    SELECT '还是' AS `hanzi`, 'haishi' AS `pinyin_raw`, 162 AS `radical_id`, '还' AS `hanzi_char`
    UNION ALL
    SELECT '还是' AS `hanzi`, 'haishi' AS `pinyin_raw`, 1 AS `radical_id`, '还' AS `hanzi_char`
    UNION ALL
    SELECT '还是' AS `hanzi`, 'haishi' AS `pinyin_raw`, 72 AS `radical_id`, '是' AS `hanzi_char`
    UNION ALL
    SELECT '还是' AS `hanzi`, 'haishi' AS `pinyin_raw`, 103 AS `radical_id`, '是' AS `hanzi_char`
    UNION ALL
    SELECT '还有' AS `hanzi`, 'hai you' AS `pinyin_raw`, 162 AS `radical_id`, '还' AS `hanzi_char`
    UNION ALL
    SELECT '还有' AS `hanzi`, 'hai you' AS `pinyin_raw`, 1 AS `radical_id`, '还' AS `hanzi_char`
    UNION ALL
    SELECT '还有' AS `hanzi`, 'hai you' AS `pinyin_raw`, 74 AS `radical_id`, '有' AS `hanzi_char`
    UNION ALL
    SELECT '孩子' AS `hanzi`, 'haizi' AS `pinyin_raw`, 39 AS `radical_id`, '孩' AS `hanzi_char`
    UNION ALL
    SELECT '孩子' AS `hanzi`, 'haizi' AS `pinyin_raw`, 8 AS `radical_id`, '孩' AS `hanzi_char`
    UNION ALL
    SELECT '汉语' AS `hanzi`, 'hanyu' AS `pinyin_raw`, 85 AS `radical_id`, '汉' AS `hanzi_char`
    UNION ALL
    SELECT '汉语' AS `hanzi`, 'hanyu' AS `pinyin_raw`, 29 AS `radical_id`, '汉' AS `hanzi_char`
    UNION ALL
    SELECT '汉语' AS `hanzi`, 'hanyu' AS `pinyin_raw`, 149 AS `radical_id`, '语' AS `hanzi_char`
    UNION ALL
    SELECT '汉语' AS `hanzi`, 'hanyu' AS `pinyin_raw`, 30 AS `radical_id`, '语' AS `hanzi_char`
    UNION ALL
    SELECT '汉字' AS `hanzi`, 'hanzi' AS `pinyin_raw`, 85 AS `radical_id`, '汉' AS `hanzi_char`
    UNION ALL
    SELECT '汉字' AS `hanzi`, 'hanzi' AS `pinyin_raw`, 29 AS `radical_id`, '汉' AS `hanzi_char`
    UNION ALL
    SELECT '汉字' AS `hanzi`, 'hanzi' AS `pinyin_raw`, 39 AS `radical_id`, '字' AS `hanzi_char`
    UNION ALL
    SELECT '汉字' AS `hanzi`, 'hanzi' AS `pinyin_raw`, 40 AS `radical_id`, '字' AS `hanzi_char`
    UNION ALL
    SELECT '好' AS `hanzi`, 'hao' AS `pinyin_raw`, 38 AS `radical_id`, '好' AS `hanzi_char`
    UNION ALL
    SELECT '好' AS `hanzi`, 'hao' AS `pinyin_raw`, 39 AS `radical_id`, '好' AS `hanzi_char`
    UNION ALL
    SELECT '好吃' AS `hanzi`, 'haochi' AS `pinyin_raw`, 38 AS `radical_id`, '好' AS `hanzi_char`
    UNION ALL
    SELECT '好吃' AS `hanzi`, 'haochi' AS `pinyin_raw`, 39 AS `radical_id`, '好' AS `hanzi_char`
    UNION ALL
    SELECT '好吃' AS `hanzi`, 'haochi' AS `pinyin_raw`, 30 AS `radical_id`, '吃' AS `hanzi_char`
    UNION ALL
    SELECT '好吃' AS `hanzi`, 'haochi' AS `pinyin_raw`, 5 AS `radical_id`, '吃' AS `hanzi_char`
    UNION ALL
    SELECT '好看' AS `hanzi`, 'haokan' AS `pinyin_raw`, 38 AS `radical_id`, '好' AS `hanzi_char`
    UNION ALL
    SELECT '好看' AS `hanzi`, 'haokan' AS `pinyin_raw`, 39 AS `radical_id`, '好' AS `hanzi_char`
    UNION ALL
    SELECT '好看' AS `hanzi`, 'haokan' AS `pinyin_raw`, 109 AS `radical_id`, '看' AS `hanzi_char`
    UNION ALL
    SELECT '好看' AS `hanzi`, 'haokan' AS `pinyin_raw`, 64 AS `radical_id`, '看' AS `hanzi_char`
    UNION ALL
    SELECT '好听' AS `hanzi`, 'haoting' AS `pinyin_raw`, 38 AS `radical_id`, '好' AS `hanzi_char`
    UNION ALL
    SELECT '好听' AS `hanzi`, 'haoting' AS `pinyin_raw`, 39 AS `radical_id`, '好' AS `hanzi_char`
    UNION ALL
    SELECT '好听' AS `hanzi`, 'haoting' AS `pinyin_raw`, 30 AS `radical_id`, '听' AS `hanzi_char`
    UNION ALL
    SELECT '好听' AS `hanzi`, 'haoting' AS `pinyin_raw`, 69 AS `radical_id`, '听' AS `hanzi_char`
    UNION ALL
    SELECT '好玩儿' AS `hanzi`, 'haowanr' AS `pinyin_raw`, 38 AS `radical_id`, '好' AS `hanzi_char`
    UNION ALL
    SELECT '好玩儿' AS `hanzi`, 'haowanr' AS `pinyin_raw`, 39 AS `radical_id`, '好' AS `hanzi_char`
    UNION ALL
    SELECT '好玩儿' AS `hanzi`, 'haowanr' AS `pinyin_raw`, 96 AS `radical_id`, '玩' AS `hanzi_char`
    UNION ALL
    SELECT '好玩儿' AS `hanzi`, 'haowanr' AS `pinyin_raw`, 10 AS `radical_id`, '玩' AS `hanzi_char`
    UNION ALL
    SELECT '好玩儿' AS `hanzi`, 'haowanr' AS `pinyin_raw`, 7 AS `radical_id`, '玩' AS `hanzi_char`
    UNION ALL
    SELECT '号' AS `hanzi`, 'hao' AS `pinyin_raw`, 30 AS `radical_id`, '号' AS `hanzi_char`
    UNION ALL
    SELECT '号' AS `hanzi`, 'hao' AS `pinyin_raw`, 1 AS `radical_id`, '号' AS `hanzi_char`
    UNION ALL
    SELECT '喝' AS `hanzi`, 'he' AS `pinyin_raw`, 30 AS `radical_id`, '喝' AS `hanzi_char`
    UNION ALL
    SELECT '喝' AS `hanzi`, 'he' AS `pinyin_raw`, 73 AS `radical_id`, '喝' AS `hanzi_char`
    UNION ALL
    SELECT '喝' AS `hanzi`, 'he' AS `pinyin_raw`, 72 AS `radical_id`, '喝' AS `hanzi_char`
    UNION ALL
    SELECT '和' AS `hanzi`, 'he' AS `pinyin_raw`, 30 AS `radical_id`, '和' AS `hanzi_char`
    UNION ALL
    SELECT '和' AS `hanzi`, 'he' AS `pinyin_raw`, 115 AS `radical_id`, '和' AS `hanzi_char`
    UNION ALL
    SELECT '很' AS `hanzi`, 'hen' AS `pinyin_raw`, 60 AS `radical_id`, '很' AS `hanzi_char`
    UNION ALL
    SELECT '很' AS `hanzi`, 'hen' AS `pinyin_raw`, 138 AS `radical_id`, '很' AS `hanzi_char`
    UNION ALL
    SELECT '后' AS `hanzi`, 'hou' AS `pinyin_raw`, 30 AS `radical_id`, '后' AS `hanzi_char`
    UNION ALL
    SELECT '后边' AS `hanzi`, 'houbian' AS `pinyin_raw`, 30 AS `radical_id`, '后' AS `hanzi_char`
    UNION ALL
    SELECT '后边' AS `hanzi`, 'houbian' AS `pinyin_raw`, 162 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '后边' AS `hanzi`, 'houbian' AS `pinyin_raw`, 19 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '后天' AS `hanzi`, 'houtian' AS `pinyin_raw`, 30 AS `radical_id`, '后' AS `hanzi_char`
    UNION ALL
    SELECT '后天' AS `hanzi`, 'houtian' AS `pinyin_raw`, 37 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '后天' AS `hanzi`, 'houtian' AS `pinyin_raw`, 1 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '花' AS `hanzi`, 'hua' AS `pinyin_raw`, 140 AS `radical_id`, '花' AS `hanzi_char`
    UNION ALL
    SELECT '花' AS `hanzi`, 'hua' AS `pinyin_raw`, 21 AS `radical_id`, '花' AS `hanzi_char`
    UNION ALL
    SELECT '花' AS `hanzi`, 'hua' AS `pinyin_raw`, 9 AS `radical_id`, '花' AS `hanzi_char`
    UNION ALL
    SELECT '话' AS `hanzi`, 'hua' AS `pinyin_raw`, 149 AS `radical_id`, '话' AS `hanzi_char`
    UNION ALL
    SELECT '话' AS `hanzi`, 'hua' AS `pinyin_raw`, 135 AS `radical_id`, '话' AS `hanzi_char`
    UNION ALL
    SELECT '坏' AS `hanzi`, 'huai' AS `pinyin_raw`, 32 AS `radical_id`, '坏' AS `hanzi_char`
    UNION ALL
    SELECT '坏' AS `hanzi`, 'huai' AS `pinyin_raw`, 1 AS `radical_id`, '坏' AS `hanzi_char`
    UNION ALL
    SELECT '还' AS `hanzi`, 'huan' AS `pinyin_raw`, 162 AS `radical_id`, '还' AS `hanzi_char`
    UNION ALL
    SELECT '还' AS `hanzi`, 'huan' AS `pinyin_raw`, 1 AS `radical_id`, '还' AS `hanzi_char`
    UNION ALL
    SELECT '回' AS `hanzi`, 'hui' AS `pinyin_raw`, 31 AS `radical_id`, '回' AS `hanzi_char`
    UNION ALL
    SELECT '回' AS `hanzi`, 'hui' AS `pinyin_raw`, 30 AS `radical_id`, '回' AS `hanzi_char`
    UNION ALL
    SELECT '回答' AS `hanzi`, 'huida' AS `pinyin_raw`, 31 AS `radical_id`, '回' AS `hanzi_char`
    UNION ALL
    SELECT '回答' AS `hanzi`, 'huida' AS `pinyin_raw`, 30 AS `radical_id`, '回' AS `hanzi_char`
    UNION ALL
    SELECT '回答' AS `hanzi`, 'huida' AS `pinyin_raw`, 118 AS `radical_id`, '答' AS `hanzi_char`
    UNION ALL
    SELECT '回到' AS `hanzi`, 'huidao' AS `pinyin_raw`, 31 AS `radical_id`, '回' AS `hanzi_char`
    UNION ALL
    SELECT '回到' AS `hanzi`, 'huidao' AS `pinyin_raw`, 30 AS `radical_id`, '回' AS `hanzi_char`
    UNION ALL
    SELECT '回到' AS `hanzi`, 'huidao' AS `pinyin_raw`, 18 AS `radical_id`, '到' AS `hanzi_char`
    UNION ALL
    SELECT '回到' AS `hanzi`, 'huidao' AS `pinyin_raw`, 133 AS `radical_id`, '到' AS `hanzi_char`
    UNION ALL
    SELECT '回家' AS `hanzi`, 'hui jia' AS `pinyin_raw`, 31 AS `radical_id`, '回' AS `hanzi_char`
    UNION ALL
    SELECT '回家' AS `hanzi`, 'hui jia' AS `pinyin_raw`, 30 AS `radical_id`, '回' AS `hanzi_char`
    UNION ALL
    SELECT '回家' AS `hanzi`, 'hui jia' AS `pinyin_raw`, 40 AS `radical_id`, '家' AS `hanzi_char`
    UNION ALL
    SELECT '回家' AS `hanzi`, 'hui jia' AS `pinyin_raw`, 152 AS `radical_id`, '家' AS `hanzi_char`
    UNION ALL
    SELECT '回来' AS `hanzi`, 'huilai' AS `pinyin_raw`, 31 AS `radical_id`, '回' AS `hanzi_char`
    UNION ALL
    SELECT '回来' AS `hanzi`, 'huilai' AS `pinyin_raw`, 30 AS `radical_id`, '回' AS `hanzi_char`
    UNION ALL
    SELECT '回来' AS `hanzi`, 'huilai' AS `pinyin_raw`, 75 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '回来' AS `hanzi`, 'huilai' AS `pinyin_raw`, 1 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '回来' AS `hanzi`, 'huilai' AS `pinyin_raw`, 12 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '回去' AS `hanzi`, 'huiqu' AS `pinyin_raw`, 31 AS `radical_id`, '回' AS `hanzi_char`
    UNION ALL
    SELECT '回去' AS `hanzi`, 'huiqu' AS `pinyin_raw`, 30 AS `radical_id`, '回' AS `hanzi_char`
    UNION ALL
    SELECT '回去' AS `hanzi`, 'huiqu' AS `pinyin_raw`, 28 AS `radical_id`, '去' AS `hanzi_char`
    UNION ALL
    SELECT '回去' AS `hanzi`, 'huiqu' AS `pinyin_raw`, 32 AS `radical_id`, '去' AS `hanzi_char`
    UNION ALL
    SELECT '会' AS `hanzi`, 'hui' AS `pinyin_raw`, 9 AS `radical_id`, '会' AS `hanzi_char`
    UNION ALL
    SELECT '会' AS `hanzi`, 'hui' AS `pinyin_raw`, 7 AS `radical_id`, '会' AS `hanzi_char`
    UNION ALL
    SELECT '会' AS `hanzi`, 'hui' AS `pinyin_raw`, 28 AS `radical_id`, '会' AS `hanzi_char`
    UNION ALL
    SELECT '火车' AS `hanzi`, 'huoche' AS `pinyin_raw`, 86 AS `radical_id`, '火' AS `hanzi_char`
    UNION ALL
    SELECT '火车' AS `hanzi`, 'huoche' AS `pinyin_raw`, 159 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '火车' AS `hanzi`, 'huoche' AS `pinyin_raw`, 1 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '火车' AS `hanzi`, 'huoche' AS `pinyin_raw`, 5 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '火车' AS `hanzi`, 'huoche' AS `pinyin_raw`, 24 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '机场' AS `hanzi`, 'jichang' AS `pinyin_raw`, 75 AS `radical_id`, '机' AS `hanzi_char`
    UNION ALL
    SELECT '机场' AS `hanzi`, 'jichang' AS `pinyin_raw`, 16 AS `radical_id`, '机' AS `hanzi_char`
    UNION ALL
    SELECT '机场' AS `hanzi`, 'jichang' AS `pinyin_raw`, 32 AS `radical_id`, '场' AS `hanzi_char`
    UNION ALL
    SELECT '机场' AS `hanzi`, 'jichang' AS `pinyin_raw`, 20 AS `radical_id`, '场' AS `hanzi_char`
    UNION ALL
    SELECT '机场' AS `hanzi`, 'jichang' AS `pinyin_raw`, 4 AS `radical_id`, '场' AS `hanzi_char`
    UNION ALL
    SELECT '机票' AS `hanzi`, 'jipiao' AS `pinyin_raw`, 75 AS `radical_id`, '机' AS `hanzi_char`
    UNION ALL
    SELECT '机票' AS `hanzi`, 'jipiao' AS `pinyin_raw`, 16 AS `radical_id`, '机' AS `hanzi_char`
    UNION ALL
    SELECT '机票' AS `hanzi`, 'jipiao' AS `pinyin_raw`, 113 AS `radical_id`, '票' AS `hanzi_char`
    UNION ALL
    SELECT '机票' AS `hanzi`, 'jipiao' AS `pinyin_raw`, 146 AS `radical_id`, '票' AS `hanzi_char`
    UNION ALL
    SELECT '鸡蛋' AS `hanzi`, 'jidan' AS `pinyin_raw`, 196 AS `radical_id`, '鸡' AS `hanzi_char`
    UNION ALL
    SELECT '鸡蛋' AS `hanzi`, 'jidan' AS `pinyin_raw`, 29 AS `radical_id`, '鸡' AS `hanzi_char`
    UNION ALL
    SELECT '鸡蛋' AS `hanzi`, 'jidan' AS `pinyin_raw`, 142 AS `radical_id`, '蛋' AS `hanzi_char`
    UNION ALL
    SELECT '鸡蛋' AS `hanzi`, 'jidan' AS `pinyin_raw`, 103 AS `radical_id`, '蛋' AS `hanzi_char`
    UNION ALL
    SELECT '几' AS `hanzi`, 'ji' AS `pinyin_raw`, 16 AS `radical_id`, '几' AS `hanzi_char`
    UNION ALL
    SELECT '记' AS `hanzi`, 'ji' AS `pinyin_raw`, 149 AS `radical_id`, '记' AS `hanzi_char`
    UNION ALL
    SELECT '记' AS `hanzi`, 'ji' AS `pinyin_raw`, 49 AS `radical_id`, '记' AS `hanzi_char`
    UNION ALL
    SELECT '记得' AS `hanzi`, 'jide' AS `pinyin_raw`, 149 AS `radical_id`, '记' AS `hanzi_char`
    UNION ALL
    SELECT '记得' AS `hanzi`, 'jide' AS `pinyin_raw`, 49 AS `radical_id`, '记' AS `hanzi_char`
    UNION ALL
    SELECT '记得' AS `hanzi`, 'jide' AS `pinyin_raw`, 60 AS `radical_id`, '得' AS `hanzi_char`
    UNION ALL
    SELECT '记得' AS `hanzi`, 'jide' AS `pinyin_raw`, 72 AS `radical_id`, '得' AS `hanzi_char`
    UNION ALL
    SELECT '记得' AS `hanzi`, 'jide' AS `pinyin_raw`, 1 AS `radical_id`, '得' AS `hanzi_char`
    UNION ALL
    SELECT '记得' AS `hanzi`, 'jide' AS `pinyin_raw`, 41 AS `radical_id`, '得' AS `hanzi_char`
    UNION ALL
    SELECT '记住' AS `hanzi`, 'jizhu' AS `pinyin_raw`, 149 AS `radical_id`, '记' AS `hanzi_char`
    UNION ALL
    SELECT '记住' AS `hanzi`, 'jizhu' AS `pinyin_raw`, 49 AS `radical_id`, '记' AS `hanzi_char`
    UNION ALL
    SELECT '记住' AS `hanzi`, 'jizhu' AS `pinyin_raw`, 9 AS `radical_id`, '住' AS `hanzi_char`
    UNION ALL
    SELECT '记住' AS `hanzi`, 'jizhu' AS `pinyin_raw`, 3 AS `radical_id`, '住' AS `hanzi_char`
    UNION ALL
    SELECT '记住' AS `hanzi`, 'jizhu' AS `pinyin_raw`, 96 AS `radical_id`, '住' AS `hanzi_char`
    UNION ALL
    SELECT '家' AS `hanzi`, 'jia' AS `pinyin_raw`, 40 AS `radical_id`, '家' AS `hanzi_char`
    UNION ALL
    SELECT '家' AS `hanzi`, 'jia' AS `pinyin_raw`, 152 AS `radical_id`, '家' AS `hanzi_char`
    UNION ALL
    SELECT '家里' AS `hanzi`, 'jia li' AS `pinyin_raw`, 40 AS `radical_id`, '家' AS `hanzi_char`
    UNION ALL
    SELECT '家里' AS `hanzi`, 'jia li' AS `pinyin_raw`, 152 AS `radical_id`, '家' AS `hanzi_char`
    UNION ALL
    SELECT '家里' AS `hanzi`, 'jia li' AS `pinyin_raw`, 166 AS `radical_id`, '里' AS `hanzi_char`
    UNION ALL
    SELECT '家人' AS `hanzi`, 'jiaren' AS `pinyin_raw`, 40 AS `radical_id`, '家' AS `hanzi_char`
    UNION ALL
    SELECT '家人' AS `hanzi`, 'jiaren' AS `pinyin_raw`, 152 AS `radical_id`, '家' AS `hanzi_char`
    UNION ALL
    SELECT '家人' AS `hanzi`, 'jiaren' AS `pinyin_raw`, 9 AS `radical_id`, '人' AS `hanzi_char`
    UNION ALL
    SELECT '间' AS `hanzi`, 'jian' AS `pinyin_raw`, 169 AS `radical_id`, '间' AS `hanzi_char`
    UNION ALL
    SELECT '间' AS `hanzi`, 'jian' AS `pinyin_raw`, 72 AS `radical_id`, '间' AS `hanzi_char`
    UNION ALL
    SELECT '见' AS `hanzi`, 'jian' AS `pinyin_raw`, 147 AS `radical_id`, '见' AS `hanzi_char`
    UNION ALL
    SELECT '见' AS `hanzi`, 'jian' AS `pinyin_raw`, 13 AS `radical_id`, '见' AS `hanzi_char`
    UNION ALL
    SELECT '见' AS `hanzi`, 'jian' AS `pinyin_raw`, 10 AS `radical_id`, '见' AS `hanzi_char`
    UNION ALL
    SELECT '见面' AS `hanzi`, 'jianmian' AS `pinyin_raw`, 147 AS `radical_id`, '见' AS `hanzi_char`
    UNION ALL
    SELECT '见面' AS `hanzi`, 'jianmian' AS `pinyin_raw`, 13 AS `radical_id`, '见' AS `hanzi_char`
    UNION ALL
    SELECT '见面' AS `hanzi`, 'jianmian' AS `pinyin_raw`, 10 AS `radical_id`, '见' AS `hanzi_char`
    UNION ALL
    SELECT '见面' AS `hanzi`, 'jianmian' AS `pinyin_raw`, 176 AS `radical_id`, '面' AS `hanzi_char`
    UNION ALL
    SELECT '教' AS `hanzi`, 'jiao' AS `pinyin_raw`, 66 AS `radical_id`, '教' AS `hanzi_char`
    UNION ALL
    SELECT '教' AS `hanzi`, 'jiao' AS `pinyin_raw`, 39 AS `radical_id`, '教' AS `hanzi_char`
    UNION ALL
    SELECT '教' AS `hanzi`, 'jiao' AS `pinyin_raw`, 125 AS `radical_id`, '教' AS `hanzi_char`
    UNION ALL
    SELECT '叫' AS `hanzi`, 'jiao' AS `pinyin_raw`, 30 AS `radical_id`, '叫' AS `hanzi_char`
    UNION ALL
    SELECT '叫' AS `hanzi`, 'jiao' AS `pinyin_raw`, 2 AS `radical_id`, '叫' AS `hanzi_char`
    UNION ALL
    SELECT '教学楼' AS `hanzi`, 'jiaoxuelou' AS `pinyin_raw`, 66 AS `radical_id`, '教' AS `hanzi_char`
    UNION ALL
    SELECT '教学楼' AS `hanzi`, 'jiaoxuelou' AS `pinyin_raw`, 39 AS `radical_id`, '教' AS `hanzi_char`
    UNION ALL
    SELECT '教学楼' AS `hanzi`, 'jiaoxuelou' AS `pinyin_raw`, 125 AS `radical_id`, '教' AS `hanzi_char`
    UNION ALL
    SELECT '教学楼' AS `hanzi`, 'jiaoxuelou' AS `pinyin_raw`, 42 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '教学楼' AS `hanzi`, 'jiaoxuelou' AS `pinyin_raw`, 14 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '教学楼' AS `hanzi`, 'jiaoxuelou' AS `pinyin_raw`, 75 AS `radical_id`, '楼' AS `hanzi_char`
    UNION ALL
    SELECT '教学楼' AS `hanzi`, 'jiaoxuelou' AS `pinyin_raw`, 38 AS `radical_id`, '楼' AS `hanzi_char`
    UNION ALL
    SELECT '教学楼' AS `hanzi`, 'jiaoxuelou' AS `pinyin_raw`, 119 AS `radical_id`, '楼' AS `hanzi_char`
    UNION ALL
    SELECT '姐姐' AS `hanzi`, 'jiejie' AS `pinyin_raw`, 38 AS `radical_id`, '姐' AS `hanzi_char`
    UNION ALL
    SELECT '姐姐' AS `hanzi`, 'jiejie' AS `pinyin_raw`, 1 AS `radical_id`, '姐' AS `hanzi_char`
    UNION ALL
    SELECT '姐姐' AS `hanzi`, 'jiejie' AS `pinyin_raw`, 74 AS `radical_id`, '姐' AS `hanzi_char`
    UNION ALL
    SELECT '介绍' AS `hanzi`, 'jieshao' AS `pinyin_raw`, 9 AS `radical_id`, '介' AS `hanzi_char`
    UNION ALL
    SELECT '介绍' AS `hanzi`, 'jieshao' AS `pinyin_raw`, 120 AS `radical_id`, '绍' AS `hanzi_char`
    UNION ALL
    SELECT '介绍' AS `hanzi`, 'jieshao' AS `pinyin_raw`, 30 AS `radical_id`, '绍' AS `hanzi_char`
    UNION ALL
    SELECT '介绍' AS `hanzi`, 'jieshao' AS `pinyin_raw`, 18 AS `radical_id`, '绍' AS `hanzi_char`
    UNION ALL
    SELECT '今年' AS `hanzi`, 'jinnian' AS `pinyin_raw`, 9 AS `radical_id`, '今' AS `hanzi_char`
    UNION ALL
    SELECT '今年' AS `hanzi`, 'jinnian' AS `pinyin_raw`, 51 AS `radical_id`, '年' AS `hanzi_char`
    UNION ALL
    SELECT '今天' AS `hanzi`, 'jintian' AS `pinyin_raw`, 9 AS `radical_id`, '今' AS `hanzi_char`
    UNION ALL
    SELECT '今天' AS `hanzi`, 'jintian' AS `pinyin_raw`, 37 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '今天' AS `hanzi`, 'jintian' AS `pinyin_raw`, 1 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '进' AS `hanzi`, 'jin' AS `pinyin_raw`, 162 AS `radical_id`, '进' AS `hanzi_char`
    UNION ALL
    SELECT '进' AS `hanzi`, 'jin' AS `pinyin_raw`, 7 AS `radical_id`, '进' AS `hanzi_char`
    UNION ALL
    SELECT '进来' AS `hanzi`, 'jinlai' AS `pinyin_raw`, 162 AS `radical_id`, '进' AS `hanzi_char`
    UNION ALL
    SELECT '进来' AS `hanzi`, 'jinlai' AS `pinyin_raw`, 7 AS `radical_id`, '进' AS `hanzi_char`
    UNION ALL
    SELECT '进来' AS `hanzi`, 'jinlai' AS `pinyin_raw`, 75 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '进来' AS `hanzi`, 'jinlai' AS `pinyin_raw`, 1 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '进来' AS `hanzi`, 'jinlai' AS `pinyin_raw`, 12 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '进去' AS `hanzi`, 'jinqu' AS `pinyin_raw`, 162 AS `radical_id`, '进' AS `hanzi_char`
    UNION ALL
    SELECT '进去' AS `hanzi`, 'jinqu' AS `pinyin_raw`, 7 AS `radical_id`, '进' AS `hanzi_char`
    UNION ALL
    SELECT '进去' AS `hanzi`, 'jinqu' AS `pinyin_raw`, 28 AS `radical_id`, '去' AS `hanzi_char`
    UNION ALL
    SELECT '进去' AS `hanzi`, 'jinqu' AS `pinyin_raw`, 32 AS `radical_id`, '去' AS `hanzi_char`
    UNION ALL
    SELECT '九' AS `hanzi`, 'jiu' AS `pinyin_raw`, 5 AS `radical_id`, '九' AS `hanzi_char`
    UNION ALL
    SELECT '九' AS `hanzi`, 'jiu' AS `pinyin_raw`, 4 AS `radical_id`, '九' AS `hanzi_char`
    UNION ALL
    SELECT '就' AS `hanzi`, 'jiu' AS `pinyin_raw`, 43 AS `radical_id`, '就' AS `hanzi_char`
    UNION ALL
    SELECT '就' AS `hanzi`, 'jiu' AS `pinyin_raw`, 8 AS `radical_id`, '就' AS `hanzi_char`
    UNION ALL
    SELECT '就' AS `hanzi`, 'jiu' AS `pinyin_raw`, 30 AS `radical_id`, '就' AS `hanzi_char`
    UNION ALL
    SELECT '就' AS `hanzi`, 'jiu' AS `pinyin_raw`, 42 AS `radical_id`, '就' AS `hanzi_char`
    UNION ALL
    SELECT '就' AS `hanzi`, 'jiu' AS `pinyin_raw`, 3 AS `radical_id`, '就' AS `hanzi_char`
    UNION ALL
    SELECT '觉得' AS `hanzi`, 'juede' AS `pinyin_raw`, 147 AS `radical_id`, '觉' AS `hanzi_char`
    UNION ALL
    SELECT '觉得' AS `hanzi`, 'juede' AS `pinyin_raw`, 42 AS `radical_id`, '觉' AS `hanzi_char`
    UNION ALL
    SELECT '觉得' AS `hanzi`, 'juede' AS `pinyin_raw`, 14 AS `radical_id`, '觉' AS `hanzi_char`
    UNION ALL
    SELECT '觉得' AS `hanzi`, 'juede' AS `pinyin_raw`, 60 AS `radical_id`, '得' AS `hanzi_char`
    UNION ALL
    SELECT '觉得' AS `hanzi`, 'juede' AS `pinyin_raw`, 72 AS `radical_id`, '得' AS `hanzi_char`
    UNION ALL
    SELECT '觉得' AS `hanzi`, 'juede' AS `pinyin_raw`, 1 AS `radical_id`, '得' AS `hanzi_char`
    UNION ALL
    SELECT '觉得' AS `hanzi`, 'juede' AS `pinyin_raw`, 41 AS `radical_id`, '得' AS `hanzi_char`
    UNION ALL
    SELECT '开' AS `hanzi`, 'kai' AS `pinyin_raw`, 55 AS `radical_id`, '开' AS `hanzi_char`
    UNION ALL
    SELECT '开' AS `hanzi`, 'kai' AS `pinyin_raw`, 1 AS `radical_id`, '开' AS `hanzi_char`
    UNION ALL
    SELECT '开车' AS `hanzi`, 'kaiche' AS `pinyin_raw`, 55 AS `radical_id`, '开' AS `hanzi_char`
    UNION ALL
    SELECT '开车' AS `hanzi`, 'kaiche' AS `pinyin_raw`, 1 AS `radical_id`, '开' AS `hanzi_char`
    UNION ALL
    SELECT '开车' AS `hanzi`, 'kaiche' AS `pinyin_raw`, 159 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '开车' AS `hanzi`, 'kaiche' AS `pinyin_raw`, 5 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '开车' AS `hanzi`, 'kaiche' AS `pinyin_raw`, 24 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '开会' AS `hanzi`, 'kaihui' AS `pinyin_raw`, 55 AS `radical_id`, '开' AS `hanzi_char`
    UNION ALL
    SELECT '开会' AS `hanzi`, 'kaihui' AS `pinyin_raw`, 1 AS `radical_id`, '开' AS `hanzi_char`
    UNION ALL
    SELECT '开会' AS `hanzi`, 'kaihui' AS `pinyin_raw`, 9 AS `radical_id`, '会' AS `hanzi_char`
    UNION ALL
    SELECT '开会' AS `hanzi`, 'kaihui' AS `pinyin_raw`, 7 AS `radical_id`, '会' AS `hanzi_char`
    UNION ALL
    SELECT '开会' AS `hanzi`, 'kaihui' AS `pinyin_raw`, 28 AS `radical_id`, '会' AS `hanzi_char`
    UNION ALL
    SELECT '开玩笑' AS `hanzi`, 'kai wanxiao' AS `pinyin_raw`, 55 AS `radical_id`, '开' AS `hanzi_char`
    UNION ALL
    SELECT '开玩笑' AS `hanzi`, 'kai wanxiao' AS `pinyin_raw`, 1 AS `radical_id`, '开' AS `hanzi_char`
    UNION ALL
    SELECT '开玩笑' AS `hanzi`, 'kai wanxiao' AS `pinyin_raw`, 96 AS `radical_id`, '玩' AS `hanzi_char`
    UNION ALL
    SELECT '开玩笑' AS `hanzi`, 'kai wanxiao' AS `pinyin_raw`, 10 AS `radical_id`, '玩' AS `hanzi_char`
    UNION ALL
    SELECT '开玩笑' AS `hanzi`, 'kai wanxiao' AS `pinyin_raw`, 7 AS `radical_id`, '玩' AS `hanzi_char`
    UNION ALL
    SELECT '开玩笑' AS `hanzi`, 'kai wanxiao' AS `pinyin_raw`, 118 AS `radical_id`, '笑' AS `hanzi_char`
    UNION ALL
    SELECT '开玩笑' AS `hanzi`, 'kai wanxiao' AS `pinyin_raw`, 37 AS `radical_id`, '笑' AS `hanzi_char`
    UNION ALL
    SELECT '开玩笑' AS `hanzi`, 'kai wanxiao' AS `pinyin_raw`, 4 AS `radical_id`, '笑' AS `hanzi_char`
    UNION ALL
    SELECT '看' AS `hanzi`, 'kan' AS `pinyin_raw`, 109 AS `radical_id`, '看' AS `hanzi_char`
    UNION ALL
    SELECT '看' AS `hanzi`, 'kan' AS `pinyin_raw`, 64 AS `radical_id`, '看' AS `hanzi_char`
    UNION ALL
    SELECT '看病' AS `hanzi`, 'kanbing' AS `pinyin_raw`, 109 AS `radical_id`, '看' AS `hanzi_char`
    UNION ALL
    SELECT '看病' AS `hanzi`, 'kanbing' AS `pinyin_raw`, 64 AS `radical_id`, '看' AS `hanzi_char`
    UNION ALL
    SELECT '看病' AS `hanzi`, 'kanbing' AS `pinyin_raw`, 104 AS `radical_id`, '病' AS `hanzi_char`
    UNION ALL
    SELECT '看病' AS `hanzi`, 'kanbing' AS `pinyin_raw`, 1 AS `radical_id`, '病' AS `hanzi_char`
    UNION ALL
    SELECT '看到' AS `hanzi`, 'kandao' AS `pinyin_raw`, 109 AS `radical_id`, '看' AS `hanzi_char`
    UNION ALL
    SELECT '看到' AS `hanzi`, 'kandao' AS `pinyin_raw`, 64 AS `radical_id`, '看' AS `hanzi_char`
    UNION ALL
    SELECT '看到' AS `hanzi`, 'kandao' AS `pinyin_raw`, 18 AS `radical_id`, '到' AS `hanzi_char`
    UNION ALL
    SELECT '看到' AS `hanzi`, 'kandao' AS `pinyin_raw`, 133 AS `radical_id`, '到' AS `hanzi_char`
    UNION ALL
    SELECT '看见' AS `hanzi`, 'kanjian' AS `pinyin_raw`, 109 AS `radical_id`, '看' AS `hanzi_char`
    UNION ALL
    SELECT '看见' AS `hanzi`, 'kanjian' AS `pinyin_raw`, 64 AS `radical_id`, '看' AS `hanzi_char`
    UNION ALL
    SELECT '看见' AS `hanzi`, 'kanjian' AS `pinyin_raw`, 147 AS `radical_id`, '见' AS `hanzi_char`
    UNION ALL
    SELECT '看见' AS `hanzi`, 'kanjian' AS `pinyin_raw`, 13 AS `radical_id`, '见' AS `hanzi_char`
    UNION ALL
    SELECT '看见' AS `hanzi`, 'kanjian' AS `pinyin_raw`, 10 AS `radical_id`, '见' AS `hanzi_char`
    UNION ALL
    SELECT '考' AS `hanzi`, 'kao' AS `pinyin_raw`, 125 AS `radical_id`, '考' AS `hanzi_char`
    UNION ALL
    SELECT '考' AS `hanzi`, 'kao' AS `pinyin_raw`, 1 AS `radical_id`, '考' AS `hanzi_char`
    UNION ALL
    SELECT '考试' AS `hanzi`, 'kaoshi' AS `pinyin_raw`, 125 AS `radical_id`, '考' AS `hanzi_char`
    UNION ALL
    SELECT '考试' AS `hanzi`, 'kaoshi' AS `pinyin_raw`, 1 AS `radical_id`, '考' AS `hanzi_char`
    UNION ALL
    SELECT '考试' AS `hanzi`, 'kaoshi' AS `pinyin_raw`, 149 AS `radical_id`, '试' AS `hanzi_char`
    UNION ALL
    SELECT '考试' AS `hanzi`, 'kaoshi' AS `pinyin_raw`, 56 AS `radical_id`, '试' AS `hanzi_char`
    UNION ALL
    SELECT '考试' AS `hanzi`, 'kaoshi' AS `pinyin_raw`, 48 AS `radical_id`, '试' AS `hanzi_char`
    UNION ALL
    SELECT '渴' AS `hanzi`, 'ke' AS `pinyin_raw`, 85 AS `radical_id`, '渴' AS `hanzi_char`
    UNION ALL
    SELECT '渴' AS `hanzi`, 'ke' AS `pinyin_raw`, 73 AS `radical_id`, '渴' AS `hanzi_char`
    UNION ALL
    SELECT '渴' AS `hanzi`, 'ke' AS `pinyin_raw`, 72 AS `radical_id`, '渴' AS `hanzi_char`
    UNION ALL
    SELECT '课' AS `hanzi`, 'ke' AS `pinyin_raw`, 149 AS `radical_id`, '课' AS `hanzi_char`
    UNION ALL
    SELECT '课' AS `hanzi`, 'ke' AS `pinyin_raw`, 75 AS `radical_id`, '课' AS `hanzi_char`
    UNION ALL
    SELECT '课' AS `hanzi`, 'ke' AS `pinyin_raw`, 102 AS `radical_id`, '课' AS `hanzi_char`
    UNION ALL
    SELECT '课本' AS `hanzi`, 'keben' AS `pinyin_raw`, 149 AS `radical_id`, '课' AS `hanzi_char`
    UNION ALL
    SELECT '课本' AS `hanzi`, 'keben' AS `pinyin_raw`, 75 AS `radical_id`, '课' AS `hanzi_char`
    UNION ALL
    SELECT '课本' AS `hanzi`, 'keben' AS `pinyin_raw`, 102 AS `radical_id`, '课' AS `hanzi_char`
    UNION ALL
    SELECT '课本' AS `hanzi`, 'keben' AS `pinyin_raw`, 1 AS `radical_id`, '本' AS `hanzi_char`
    UNION ALL
    SELECT '课文' AS `hanzi`, 'kewen' AS `pinyin_raw`, 149 AS `radical_id`, '课' AS `hanzi_char`
    UNION ALL
    SELECT '课文' AS `hanzi`, 'kewen' AS `pinyin_raw`, 75 AS `radical_id`, '课' AS `hanzi_char`
    UNION ALL
    SELECT '课文' AS `hanzi`, 'kewen' AS `pinyin_raw`, 102 AS `radical_id`, '课' AS `hanzi_char`
    UNION ALL
    SELECT '课文' AS `hanzi`, 'kewen' AS `pinyin_raw`, 67 AS `radical_id`, '文' AS `hanzi_char`
    UNION ALL
    SELECT '口' AS `hanzi`, 'kou' AS `pinyin_raw`, 30 AS `radical_id`, '口' AS `hanzi_char`
    UNION ALL
    SELECT '块' AS `hanzi`, 'kuai' AS `pinyin_raw`, 32 AS `radical_id`, '块' AS `hanzi_char`
    UNION ALL
    SELECT '块' AS `hanzi`, 'kuai' AS `pinyin_raw`, 37 AS `radical_id`, '块' AS `hanzi_char`
    UNION ALL
    SELECT '快' AS `hanzi`, 'kuai' AS `pinyin_raw`, 61 AS `radical_id`, '快' AS `hanzi_char`
    UNION ALL
    SELECT '快' AS `hanzi`, 'kuai' AS `pinyin_raw`, 37 AS `radical_id`, '快' AS `hanzi_char`
    UNION ALL
    SELECT '来' AS `hanzi`, 'lai' AS `pinyin_raw`, 75 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '来' AS `hanzi`, 'lai' AS `pinyin_raw`, 1 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '来' AS `hanzi`, 'lai' AS `pinyin_raw`, 12 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '来到' AS `hanzi`, 'laidao' AS `pinyin_raw`, 75 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '来到' AS `hanzi`, 'laidao' AS `pinyin_raw`, 1 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '来到' AS `hanzi`, 'laidao' AS `pinyin_raw`, 12 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '来到' AS `hanzi`, 'laidao' AS `pinyin_raw`, 18 AS `radical_id`, '到' AS `hanzi_char`
    UNION ALL
    SELECT '来到' AS `hanzi`, 'laidao' AS `pinyin_raw`, 133 AS `radical_id`, '到' AS `hanzi_char`
    UNION ALL
    SELECT '老' AS `hanzi`, 'lao' AS `pinyin_raw`, 125 AS `radical_id`, '老' AS `hanzi_char`
    UNION ALL
    SELECT '老人' AS `hanzi`, 'laoren' AS `pinyin_raw`, 125 AS `radical_id`, '老' AS `hanzi_char`
    UNION ALL
    SELECT '老人' AS `hanzi`, 'laoren' AS `pinyin_raw`, 9 AS `radical_id`, '人' AS `hanzi_char`
    UNION ALL
    SELECT '老师' AS `hanzi`, 'laoshi' AS `pinyin_raw`, 125 AS `radical_id`, '老' AS `hanzi_char`
    UNION ALL
    SELECT '老师' AS `hanzi`, 'laoshi' AS `pinyin_raw`, 50 AS `radical_id`, '师' AS `hanzi_char`
    UNION ALL
    SELECT '老师' AS `hanzi`, 'laoshi' AS `pinyin_raw`, 18 AS `radical_id`, '师' AS `hanzi_char`
    UNION ALL
    SELECT '老师' AS `hanzi`, 'laoshi' AS `pinyin_raw`, 1 AS `radical_id`, '师' AS `hanzi_char`
    UNION ALL
    SELECT '了' AS `hanzi`, 'le' AS `pinyin_raw`, 6 AS `radical_id`, '了' AS `hanzi_char`
    UNION ALL
    SELECT '了' AS `hanzi`, 'le' AS `pinyin_raw`, 5 AS `radical_id`, '了' AS `hanzi_char`
    UNION ALL
    SELECT '累' AS `hanzi`, 'lei' AS `pinyin_raw`, 120 AS `radical_id`, '累' AS `hanzi_char`
    UNION ALL
    SELECT '累' AS `hanzi`, 'lei' AS `pinyin_raw`, 102 AS `radical_id`, '累' AS `hanzi_char`
    UNION ALL
    SELECT '冷' AS `hanzi`, 'leng' AS `pinyin_raw`, 15 AS `radical_id`, '冷' AS `hanzi_char`
    UNION ALL
    SELECT '冷' AS `hanzi`, 'leng' AS `pinyin_raw`, 9 AS `radical_id`, '冷' AS `hanzi_char`
    UNION ALL
    SELECT '里' AS `hanzi`, 'li' AS `pinyin_raw`, 166 AS `radical_id`, '里' AS `hanzi_char`
    UNION ALL
    SELECT '里边' AS `hanzi`, 'libian' AS `pinyin_raw`, 166 AS `radical_id`, '里' AS `hanzi_char`
    UNION ALL
    SELECT '里边' AS `hanzi`, 'libian' AS `pinyin_raw`, 162 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '里边' AS `hanzi`, 'libian' AS `pinyin_raw`, 19 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '两' AS `hanzi`, 'liang' AS `pinyin_raw`, 1 AS `radical_id`, '两' AS `hanzi_char`
    UNION ALL
    SELECT '两' AS `hanzi`, 'liang' AS `pinyin_raw`, 13 AS `radical_id`, '两' AS `hanzi_char`
    UNION ALL
    SELECT '两' AS `hanzi`, 'liang' AS `pinyin_raw`, 9 AS `radical_id`, '两' AS `hanzi_char`
    UNION ALL
    SELECT '零' AS `hanzi`, 'ling' AS `pinyin_raw`, 173 AS `radical_id`, '零' AS `hanzi_char`
    UNION ALL
    SELECT '零' AS `hanzi`, 'ling' AS `pinyin_raw`, 9 AS `radical_id`, '零' AS `hanzi_char`
    UNION ALL
    SELECT '六' AS `hanzi`, 'liu' AS `pinyin_raw`, 12 AS `radical_id`, '六' AS `hanzi_char`
    UNION ALL
    SELECT '六' AS `hanzi`, 'liu' AS `pinyin_raw`, 8 AS `radical_id`, '六' AS `hanzi_char`
    UNION ALL
    SELECT '楼' AS `hanzi`, 'lou' AS `pinyin_raw`, 75 AS `radical_id`, '楼' AS `hanzi_char`
    UNION ALL
    SELECT '楼' AS `hanzi`, 'lou' AS `pinyin_raw`, 38 AS `radical_id`, '楼' AS `hanzi_char`
    UNION ALL
    SELECT '楼' AS `hanzi`, 'lou' AS `pinyin_raw`, 119 AS `radical_id`, '楼' AS `hanzi_char`
    UNION ALL
    SELECT '楼上' AS `hanzi`, 'lou shang' AS `pinyin_raw`, 75 AS `radical_id`, '楼' AS `hanzi_char`
    UNION ALL
    SELECT '楼上' AS `hanzi`, 'lou shang' AS `pinyin_raw`, 38 AS `radical_id`, '楼' AS `hanzi_char`
    UNION ALL
    SELECT '楼上' AS `hanzi`, 'lou shang' AS `pinyin_raw`, 119 AS `radical_id`, '楼' AS `hanzi_char`
    UNION ALL
    SELECT '楼上' AS `hanzi`, 'lou shang' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '楼上' AS `hanzi`, 'lou shang' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '楼下' AS `hanzi`, 'lou xia' AS `pinyin_raw`, 75 AS `radical_id`, '楼' AS `hanzi_char`
    UNION ALL
    SELECT '楼下' AS `hanzi`, 'lou xia' AS `pinyin_raw`, 38 AS `radical_id`, '楼' AS `hanzi_char`
    UNION ALL
    SELECT '楼下' AS `hanzi`, 'lou xia' AS `pinyin_raw`, 119 AS `radical_id`, '楼' AS `hanzi_char`
    UNION ALL
    SELECT '楼下' AS `hanzi`, 'lou xia' AS `pinyin_raw`, 1 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '楼下' AS `hanzi`, 'lou xia' AS `pinyin_raw`, 25 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '路' AS `hanzi`, 'lu' AS `pinyin_raw`, 157 AS `radical_id`, '路' AS `hanzi_char`
    UNION ALL
    SELECT '路' AS `hanzi`, 'lu' AS `pinyin_raw`, 30 AS `radical_id`, '路' AS `hanzi_char`
    UNION ALL
    SELECT '路' AS `hanzi`, 'lu' AS `pinyin_raw`, 34 AS `radical_id`, '路' AS `hanzi_char`
    UNION ALL
    SELECT '路口' AS `hanzi`, 'lukou' AS `pinyin_raw`, 157 AS `radical_id`, '路' AS `hanzi_char`
    UNION ALL
    SELECT '路口' AS `hanzi`, 'lukou' AS `pinyin_raw`, 30 AS `radical_id`, '路' AS `hanzi_char`
    UNION ALL
    SELECT '路口' AS `hanzi`, 'lukou' AS `pinyin_raw`, 34 AS `radical_id`, '路' AS `hanzi_char`
    UNION ALL
    SELECT '路上' AS `hanzi`, 'lushang' AS `pinyin_raw`, 157 AS `radical_id`, '路' AS `hanzi_char`
    UNION ALL
    SELECT '路上' AS `hanzi`, 'lushang' AS `pinyin_raw`, 30 AS `radical_id`, '路' AS `hanzi_char`
    UNION ALL
    SELECT '路上' AS `hanzi`, 'lushang' AS `pinyin_raw`, 34 AS `radical_id`, '路' AS `hanzi_char`
    UNION ALL
    SELECT '路上' AS `hanzi`, 'lushang' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '路上' AS `hanzi`, 'lushang' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '妈妈' AS `hanzi`, 'mama' AS `pinyin_raw`, 38 AS `radical_id`, '妈' AS `hanzi_char`
    UNION ALL
    SELECT '妈妈' AS `hanzi`, 'mama' AS `pinyin_raw`, 187 AS `radical_id`, '妈' AS `hanzi_char`
    UNION ALL
    SELECT '马路' AS `hanzi`, 'malu' AS `pinyin_raw`, 187 AS `radical_id`, '马' AS `hanzi_char`
    UNION ALL
    SELECT '马路' AS `hanzi`, 'malu' AS `pinyin_raw`, 1 AS `radical_id`, '马' AS `hanzi_char`
    UNION ALL
    SELECT '马路' AS `hanzi`, 'malu' AS `pinyin_raw`, 157 AS `radical_id`, '路' AS `hanzi_char`
    UNION ALL
    SELECT '马路' AS `hanzi`, 'malu' AS `pinyin_raw`, 30 AS `radical_id`, '路' AS `hanzi_char`
    UNION ALL
    SELECT '马路' AS `hanzi`, 'malu' AS `pinyin_raw`, 34 AS `radical_id`, '路' AS `hanzi_char`
    UNION ALL
    SELECT '马上' AS `hanzi`, 'mashang' AS `pinyin_raw`, 187 AS `radical_id`, '马' AS `hanzi_char`
    UNION ALL
    SELECT '马上' AS `hanzi`, 'mashang' AS `pinyin_raw`, 1 AS `radical_id`, '马' AS `hanzi_char`
    UNION ALL
    SELECT '马上' AS `hanzi`, 'mashang' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '吗' AS `hanzi`, 'ma' AS `pinyin_raw`, 30 AS `radical_id`, '吗' AS `hanzi_char`
    UNION ALL
    SELECT '吗' AS `hanzi`, 'ma' AS `pinyin_raw`, 187 AS `radical_id`, '吗' AS `hanzi_char`
    UNION ALL
    SELECT '买' AS `hanzi`, 'mai' AS `pinyin_raw`, 37 AS `radical_id`, '买' AS `hanzi_char`
    UNION ALL
    SELECT '买' AS `hanzi`, 'mai' AS `pinyin_raw`, 5 AS `radical_id`, '买' AS `hanzi_char`
    UNION ALL
    SELECT '买' AS `hanzi`, 'mai' AS `pinyin_raw`, 15 AS `radical_id`, '买' AS `hanzi_char`
    UNION ALL
    SELECT '慢' AS `hanzi`, 'man' AS `pinyin_raw`, 61 AS `radical_id`, '慢' AS `hanzi_char`
    UNION ALL
    SELECT '慢' AS `hanzi`, 'man' AS `pinyin_raw`, 72 AS `radical_id`, '慢' AS `hanzi_char`
    UNION ALL
    SELECT '慢' AS `hanzi`, 'man' AS `pinyin_raw`, 122 AS `radical_id`, '慢' AS `hanzi_char`
    UNION ALL
    SELECT '慢' AS `hanzi`, 'man' AS `pinyin_raw`, 29 AS `radical_id`, '慢' AS `hanzi_char`
    UNION ALL
    SELECT '忙' AS `hanzi`, 'mang' AS `pinyin_raw`, 61 AS `radical_id`, '忙' AS `hanzi_char`
    UNION ALL
    SELECT '忙' AS `hanzi`, 'mang' AS `pinyin_raw`, 8 AS `radical_id`, '忙' AS `hanzi_char`
    UNION ALL
    SELECT '毛' AS `hanzi`, 'mao' AS `pinyin_raw`, 82 AS `radical_id`, '毛' AS `hanzi_char`
    UNION ALL
    SELECT '没' AS `hanzi`, 'mei' AS `pinyin_raw`, 85 AS `radical_id`, '没' AS `hanzi_char`
    UNION ALL
    SELECT '没' AS `hanzi`, 'mei' AS `pinyin_raw`, 79 AS `radical_id`, '没' AS `hanzi_char`
    UNION ALL
    SELECT '没关系' AS `hanzi`, 'mei guanxi' AS `pinyin_raw`, 85 AS `radical_id`, '没' AS `hanzi_char`
    UNION ALL
    SELECT '没关系' AS `hanzi`, 'mei guanxi' AS `pinyin_raw`, 79 AS `radical_id`, '没' AS `hanzi_char`
    UNION ALL
    SELECT '没关系' AS `hanzi`, 'mei guanxi' AS `pinyin_raw`, 12 AS `radical_id`, '关' AS `hanzi_char`
    UNION ALL
    SELECT '没关系' AS `hanzi`, 'mei guanxi' AS `pinyin_raw`, 37 AS `radical_id`, '关' AS `hanzi_char`
    UNION ALL
    SELECT '没关系' AS `hanzi`, 'mei guanxi' AS `pinyin_raw`, 1 AS `radical_id`, '关' AS `hanzi_char`
    UNION ALL
    SELECT '没关系' AS `hanzi`, 'mei guanxi' AS `pinyin_raw`, 120 AS `radical_id`, '系' AS `hanzi_char`
    UNION ALL
    SELECT '没关系' AS `hanzi`, 'mei guanxi' AS `pinyin_raw`, 4 AS `radical_id`, '系' AS `hanzi_char`
    UNION ALL
    SELECT '没什么' AS `hanzi`, 'mei shenme' AS `pinyin_raw`, 85 AS `radical_id`, '没' AS `hanzi_char`
    UNION ALL
    SELECT '没什么' AS `hanzi`, 'mei shenme' AS `pinyin_raw`, 79 AS `radical_id`, '没' AS `hanzi_char`
    UNION ALL
    SELECT '没什么' AS `hanzi`, 'mei shenme' AS `pinyin_raw`, 9 AS `radical_id`, '什' AS `hanzi_char`
    UNION ALL
    SELECT '没什么' AS `hanzi`, 'mei shenme' AS `pinyin_raw`, 24 AS `radical_id`, '什' AS `hanzi_char`
    UNION ALL
    SELECT '没什么' AS `hanzi`, 'mei shenme' AS `pinyin_raw`, 4 AS `radical_id`, '么' AS `hanzi_char`
    UNION ALL
    SELECT '没什么' AS `hanzi`, 'mei shenme' AS `pinyin_raw`, 28 AS `radical_id`, '么' AS `hanzi_char`
    UNION ALL
    SELECT '没事儿' AS `hanzi`, 'meishir' AS `pinyin_raw`, 85 AS `radical_id`, '没' AS `hanzi_char`
    UNION ALL
    SELECT '没事儿' AS `hanzi`, 'meishir' AS `pinyin_raw`, 79 AS `radical_id`, '没' AS `hanzi_char`
    UNION ALL
    SELECT '没事儿' AS `hanzi`, 'meishir' AS `pinyin_raw`, 6 AS `radical_id`, '事' AS `hanzi_char`
    UNION ALL
    SELECT '没事儿' AS `hanzi`, 'meishir' AS `pinyin_raw`, 1 AS `radical_id`, '事' AS `hanzi_char`
    UNION ALL
    SELECT '没事儿' AS `hanzi`, 'meishir' AS `pinyin_raw`, 30 AS `radical_id`, '事' AS `hanzi_char`
    UNION ALL
    SELECT '没事儿' AS `hanzi`, 'meishir' AS `pinyin_raw`, 58 AS `radical_id`, '事' AS `hanzi_char`
    UNION ALL
    SELECT '没事儿' AS `hanzi`, 'meishir' AS `pinyin_raw`, 10 AS `radical_id`, '儿' AS `hanzi_char`
    UNION ALL
    SELECT '没有' AS `hanzi`, 'meiyou' AS `pinyin_raw`, 85 AS `radical_id`, '没' AS `hanzi_char`
    UNION ALL
    SELECT '没有' AS `hanzi`, 'meiyou' AS `pinyin_raw`, 79 AS `radical_id`, '没' AS `hanzi_char`
    UNION ALL
    SELECT '没有' AS `hanzi`, 'meiyou' AS `pinyin_raw`, 74 AS `radical_id`, '有' AS `hanzi_char`
    UNION ALL
    SELECT '妹妹' AS `hanzi`, 'meimei' AS `pinyin_raw`, 38 AS `radical_id`, '妹' AS `hanzi_char`
    UNION ALL
    SELECT '妹妹' AS `hanzi`, 'meimei' AS `pinyin_raw`, 75 AS `radical_id`, '妹' AS `hanzi_char`
    UNION ALL
    SELECT '妹妹' AS `hanzi`, 'meimei' AS `pinyin_raw`, 1 AS `radical_id`, '妹' AS `hanzi_char`
    UNION ALL
    SELECT '门' AS `hanzi`, 'men' AS `pinyin_raw`, 169 AS `radical_id`, '门' AS `hanzi_char`
    UNION ALL
    SELECT '门' AS `hanzi`, 'men' AS `pinyin_raw`, 3 AS `radical_id`, '门' AS `hanzi_char`
    UNION ALL
    SELECT '门' AS `hanzi`, 'men' AS `pinyin_raw`, 2 AS `radical_id`, '门' AS `hanzi_char`
    UNION ALL
    SELECT '门口' AS `hanzi`, 'menkou' AS `pinyin_raw`, 169 AS `radical_id`, '门' AS `hanzi_char`
    UNION ALL
    SELECT '门口' AS `hanzi`, 'menkou' AS `pinyin_raw`, 3 AS `radical_id`, '门' AS `hanzi_char`
    UNION ALL
    SELECT '门口' AS `hanzi`, 'menkou' AS `pinyin_raw`, 2 AS `radical_id`, '门' AS `hanzi_char`
    UNION ALL
    SELECT '门口' AS `hanzi`, 'menkou' AS `pinyin_raw`, 30 AS `radical_id`, '口' AS `hanzi_char`
    UNION ALL
    SELECT '门票' AS `hanzi`, 'menpiao' AS `pinyin_raw`, 169 AS `radical_id`, '门' AS `hanzi_char`
    UNION ALL
    SELECT '门票' AS `hanzi`, 'menpiao' AS `pinyin_raw`, 3 AS `radical_id`, '门' AS `hanzi_char`
    UNION ALL
    SELECT '门票' AS `hanzi`, 'menpiao' AS `pinyin_raw`, 2 AS `radical_id`, '门' AS `hanzi_char`
    UNION ALL
    SELECT '门票' AS `hanzi`, 'menpiao' AS `pinyin_raw`, 113 AS `radical_id`, '票' AS `hanzi_char`
    UNION ALL
    SELECT '门票' AS `hanzi`, 'menpiao' AS `pinyin_raw`, 146 AS `radical_id`, '票' AS `hanzi_char`
    UNION ALL
    SELECT '们' AS `hanzi`, 'men (pengyoumen)' AS `pinyin_raw`, 9 AS `radical_id`, '们' AS `hanzi_char`
    UNION ALL
    SELECT '们' AS `hanzi`, 'men (pengyoumen)' AS `pinyin_raw`, 169 AS `radical_id`, '们' AS `hanzi_char`
    UNION ALL
    SELECT '米饭' AS `hanzi`, 'mifan' AS `pinyin_raw`, 119 AS `radical_id`, '米' AS `hanzi_char`
    UNION ALL
    SELECT '米饭' AS `hanzi`, 'mifan' AS `pinyin_raw`, 184 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '米饭' AS `hanzi`, 'mifan' AS `pinyin_raw`, 29 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '米饭' AS `hanzi`, 'mifan' AS `pinyin_raw`, 27 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '面包' AS `hanzi`, 'mianbao' AS `pinyin_raw`, 176 AS `radical_id`, '面' AS `hanzi_char`
    UNION ALL
    SELECT '面包' AS `hanzi`, 'mianbao' AS `pinyin_raw`, 20 AS `radical_id`, '包' AS `hanzi_char`
    UNION ALL
    SELECT '面包' AS `hanzi`, 'mianbao' AS `pinyin_raw`, 49 AS `radical_id`, '包' AS `hanzi_char`
    UNION ALL
    SELECT '面条儿' AS `hanzi`, 'miantiaor' AS `pinyin_raw`, 176 AS `radical_id`, '面' AS `hanzi_char`
    UNION ALL
    SELECT '面条儿' AS `hanzi`, 'miantiaor' AS `pinyin_raw`, 75 AS `radical_id`, '条' AS `hanzi_char`
    UNION ALL
    SELECT '面条儿' AS `hanzi`, 'miantiaor' AS `pinyin_raw`, 34 AS `radical_id`, '条' AS `hanzi_char`
    UNION ALL
    SELECT '面条儿' AS `hanzi`, 'miantiaor' AS `pinyin_raw`, 10 AS `radical_id`, '儿' AS `hanzi_char`
    UNION ALL
    SELECT '名字' AS `hanzi`, 'mingzi' AS `pinyin_raw`, 30 AS `radical_id`, '名' AS `hanzi_char`
    UNION ALL
    SELECT '名字' AS `hanzi`, 'mingzi' AS `pinyin_raw`, 36 AS `radical_id`, '名' AS `hanzi_char`
    UNION ALL
    SELECT '名字' AS `hanzi`, 'mingzi' AS `pinyin_raw`, 39 AS `radical_id`, '字' AS `hanzi_char`
    UNION ALL
    SELECT '名字' AS `hanzi`, 'mingzi' AS `pinyin_raw`, 40 AS `radical_id`, '字' AS `hanzi_char`
    UNION ALL
    SELECT '明白' AS `hanzi`, 'mingbai' AS `pinyin_raw`, 72 AS `radical_id`, '明' AS `hanzi_char`
    UNION ALL
    SELECT '明白' AS `hanzi`, 'mingbai' AS `pinyin_raw`, 74 AS `radical_id`, '明' AS `hanzi_char`
    UNION ALL
    SELECT '明白' AS `hanzi`, 'mingbai' AS `pinyin_raw`, 106 AS `radical_id`, '白' AS `hanzi_char`
    UNION ALL
    SELECT '明年' AS `hanzi`, 'mingnian' AS `pinyin_raw`, 72 AS `radical_id`, '明' AS `hanzi_char`
    UNION ALL
    SELECT '明年' AS `hanzi`, 'mingnian' AS `pinyin_raw`, 74 AS `radical_id`, '明' AS `hanzi_char`
    UNION ALL
    SELECT '明年' AS `hanzi`, 'mingnian' AS `pinyin_raw`, 51 AS `radical_id`, '年' AS `hanzi_char`
    UNION ALL
    SELECT '明天' AS `hanzi`, 'mingtian' AS `pinyin_raw`, 72 AS `radical_id`, '明' AS `hanzi_char`
    UNION ALL
    SELECT '明天' AS `hanzi`, 'mingtian' AS `pinyin_raw`, 74 AS `radical_id`, '明' AS `hanzi_char`
    UNION ALL
    SELECT '明天' AS `hanzi`, 'mingtian' AS `pinyin_raw`, 37 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '明天' AS `hanzi`, 'mingtian' AS `pinyin_raw`, 1 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '拿' AS `hanzi`, 'na' AS `pinyin_raw`, 64 AS `radical_id`, '拿' AS `hanzi_char`
    UNION ALL
    SELECT '拿' AS `hanzi`, 'na' AS `pinyin_raw`, 30 AS `radical_id`, '拿' AS `hanzi_char`
    UNION ALL
    SELECT '哪' AS `hanzi`, 'na' AS `pinyin_raw`, 30 AS `radical_id`, '哪' AS `hanzi_char`
    UNION ALL
    SELECT '哪' AS `hanzi`, 'na' AS `pinyin_raw`, 163 AS `radical_id`, '哪' AS `hanzi_char`
    UNION ALL
    SELECT '哪里' AS `hanzi`, 'nali' AS `pinyin_raw`, 30 AS `radical_id`, '哪' AS `hanzi_char`
    UNION ALL
    SELECT '哪里' AS `hanzi`, 'nali' AS `pinyin_raw`, 163 AS `radical_id`, '哪' AS `hanzi_char`
    UNION ALL
    SELECT '哪里' AS `hanzi`, 'nali' AS `pinyin_raw`, 166 AS `radical_id`, '里' AS `hanzi_char`
    UNION ALL
    SELECT '哪儿' AS `hanzi`, 'nar' AS `pinyin_raw`, 30 AS `radical_id`, '哪' AS `hanzi_char`
    UNION ALL
    SELECT '哪儿' AS `hanzi`, 'nar' AS `pinyin_raw`, 163 AS `radical_id`, '哪' AS `hanzi_char`
    UNION ALL
    SELECT '哪儿' AS `hanzi`, 'nar' AS `pinyin_raw`, 10 AS `radical_id`, '儿' AS `hanzi_char`
    UNION ALL
    SELECT '哪些' AS `hanzi`, 'naxie' AS `pinyin_raw`, 30 AS `radical_id`, '哪' AS `hanzi_char`
    UNION ALL
    SELECT '哪些' AS `hanzi`, 'naxie' AS `pinyin_raw`, 163 AS `radical_id`, '哪' AS `hanzi_char`
    UNION ALL
    SELECT '哪些' AS `hanzi`, 'naxie' AS `pinyin_raw`, 7 AS `radical_id`, '些' AS `hanzi_char`
    UNION ALL
    SELECT '哪些' AS `hanzi`, 'naxie' AS `pinyin_raw`, 77 AS `radical_id`, '些' AS `hanzi_char`
    UNION ALL
    SELECT '哪些' AS `hanzi`, 'naxie' AS `pinyin_raw`, 21 AS `radical_id`, '些' AS `hanzi_char`
    UNION ALL
    SELECT '那' AS `hanzi`, 'na' AS `pinyin_raw`, 163 AS `radical_id`, '那' AS `hanzi_char`
    UNION ALL
    SELECT '那边' AS `hanzi`, 'nabian' AS `pinyin_raw`, 163 AS `radical_id`, '那' AS `hanzi_char`
    UNION ALL
    SELECT '那边' AS `hanzi`, 'nabian' AS `pinyin_raw`, 162 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '那边' AS `hanzi`, 'nabian' AS `pinyin_raw`, 19 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '那里' AS `hanzi`, 'nali' AS `pinyin_raw`, 163 AS `radical_id`, '那' AS `hanzi_char`
    UNION ALL
    SELECT '那里' AS `hanzi`, 'nali' AS `pinyin_raw`, 166 AS `radical_id`, '里' AS `hanzi_char`
    UNION ALL
    SELECT '那儿' AS `hanzi`, 'nar' AS `pinyin_raw`, 163 AS `radical_id`, '那' AS `hanzi_char`
    UNION ALL
    SELECT '那儿' AS `hanzi`, 'nar' AS `pinyin_raw`, 10 AS `radical_id`, '儿' AS `hanzi_char`
    UNION ALL
    SELECT '那些' AS `hanzi`, 'naxie' AS `pinyin_raw`, 163 AS `radical_id`, '那' AS `hanzi_char`
    UNION ALL
    SELECT '那些' AS `hanzi`, 'naxie' AS `pinyin_raw`, 7 AS `radical_id`, '些' AS `hanzi_char`
    UNION ALL
    SELECT '那些' AS `hanzi`, 'naxie' AS `pinyin_raw`, 77 AS `radical_id`, '些' AS `hanzi_char`
    UNION ALL
    SELECT '那些' AS `hanzi`, 'naxie' AS `pinyin_raw`, 21 AS `radical_id`, '些' AS `hanzi_char`
    UNION ALL
    SELECT '奶' AS `hanzi`, 'nai' AS `pinyin_raw`, 38 AS `radical_id`, '奶' AS `hanzi_char`
    UNION ALL
    SELECT '奶' AS `hanzi`, 'nai' AS `pinyin_raw`, 4 AS `radical_id`, '奶' AS `hanzi_char`
    UNION ALL
    SELECT '奶奶' AS `hanzi`, 'nainai' AS `pinyin_raw`, 38 AS `radical_id`, '奶' AS `hanzi_char`
    UNION ALL
    SELECT '奶奶' AS `hanzi`, 'nainai' AS `pinyin_raw`, 4 AS `radical_id`, '奶' AS `hanzi_char`
    UNION ALL
    SELECT '男' AS `hanzi`, 'nan' AS `pinyin_raw`, 102 AS `radical_id`, '男' AS `hanzi_char`
    UNION ALL
    SELECT '男' AS `hanzi`, 'nan' AS `pinyin_raw`, 19 AS `radical_id`, '男' AS `hanzi_char`
    UNION ALL
    SELECT '男孩儿' AS `hanzi`, 'nanhair' AS `pinyin_raw`, 102 AS `radical_id`, '男' AS `hanzi_char`
    UNION ALL
    SELECT '男孩儿' AS `hanzi`, 'nanhair' AS `pinyin_raw`, 19 AS `radical_id`, '男' AS `hanzi_char`
    UNION ALL
    SELECT '男孩儿' AS `hanzi`, 'nanhair' AS `pinyin_raw`, 39 AS `radical_id`, '孩' AS `hanzi_char`
    UNION ALL
    SELECT '男孩儿' AS `hanzi`, 'nanhair' AS `pinyin_raw`, 8 AS `radical_id`, '孩' AS `hanzi_char`
    UNION ALL
    SELECT '男孩儿' AS `hanzi`, 'nanhair' AS `pinyin_raw`, 10 AS `radical_id`, '儿' AS `hanzi_char`
    UNION ALL
    SELECT '男朋友' AS `hanzi`, 'nanpengyou' AS `pinyin_raw`, 102 AS `radical_id`, '男' AS `hanzi_char`
    UNION ALL
    SELECT '男朋友' AS `hanzi`, 'nanpengyou' AS `pinyin_raw`, 19 AS `radical_id`, '男' AS `hanzi_char`
    UNION ALL
    SELECT '男朋友' AS `hanzi`, 'nanpengyou' AS `pinyin_raw`, 74 AS `radical_id`, '朋' AS `hanzi_char`
    UNION ALL
    SELECT '男朋友' AS `hanzi`, 'nanpengyou' AS `pinyin_raw`, 29 AS `radical_id`, '友' AS `hanzi_char`
    UNION ALL
    SELECT '男人' AS `hanzi`, 'nanren' AS `pinyin_raw`, 102 AS `radical_id`, '男' AS `hanzi_char`
    UNION ALL
    SELECT '男人' AS `hanzi`, 'nanren' AS `pinyin_raw`, 19 AS `radical_id`, '男' AS `hanzi_char`
    UNION ALL
    SELECT '男人' AS `hanzi`, 'nanren' AS `pinyin_raw`, 9 AS `radical_id`, '人' AS `hanzi_char`
    UNION ALL
    SELECT '男生' AS `hanzi`, 'nansheng' AS `pinyin_raw`, 102 AS `radical_id`, '男' AS `hanzi_char`
    UNION ALL
    SELECT '男生' AS `hanzi`, 'nansheng' AS `pinyin_raw`, 19 AS `radical_id`, '男' AS `hanzi_char`
    UNION ALL
    SELECT '男生' AS `hanzi`, 'nansheng' AS `pinyin_raw`, 100 AS `radical_id`, '生' AS `hanzi_char`
    UNION ALL
    SELECT '南' AS `hanzi`, 'nan' AS `pinyin_raw`, 24 AS `radical_id`, '南' AS `hanzi_char`
    UNION ALL
    SELECT '南' AS `hanzi`, 'nan' AS `pinyin_raw`, 13 AS `radical_id`, '南' AS `hanzi_char`
    UNION ALL
    SELECT '南' AS `hanzi`, 'nan' AS `pinyin_raw`, 12 AS `radical_id`, '南' AS `hanzi_char`
    UNION ALL
    SELECT '南' AS `hanzi`, 'nan' AS `pinyin_raw`, 51 AS `radical_id`, '南' AS `hanzi_char`
    UNION ALL
    SELECT '南边' AS `hanzi`, 'nanbian' AS `pinyin_raw`, 24 AS `radical_id`, '南' AS `hanzi_char`
    UNION ALL
    SELECT '南边' AS `hanzi`, 'nanbian' AS `pinyin_raw`, 13 AS `radical_id`, '南' AS `hanzi_char`
    UNION ALL
    SELECT '南边' AS `hanzi`, 'nanbian' AS `pinyin_raw`, 12 AS `radical_id`, '南' AS `hanzi_char`
    UNION ALL
    SELECT '南边' AS `hanzi`, 'nanbian' AS `pinyin_raw`, 51 AS `radical_id`, '南' AS `hanzi_char`
    UNION ALL
    SELECT '南边' AS `hanzi`, 'nanbian' AS `pinyin_raw`, 162 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '南边' AS `hanzi`, 'nanbian' AS `pinyin_raw`, 19 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '难' AS `hanzi`, 'nan' AS `pinyin_raw`, 29 AS `radical_id`, '难' AS `hanzi_char`
    UNION ALL
    SELECT '难' AS `hanzi`, 'nan' AS `pinyin_raw`, 172 AS `radical_id`, '难' AS `hanzi_char`
    UNION ALL
    SELECT '呢' AS `hanzi`, 'ne' AS `pinyin_raw`, 30 AS `radical_id`, '呢' AS `hanzi_char`
    UNION ALL
    SELECT '呢' AS `hanzi`, 'ne' AS `pinyin_raw`, 44 AS `radical_id`, '呢' AS `hanzi_char`
    UNION ALL
    SELECT '呢' AS `hanzi`, 'ne' AS `pinyin_raw`, 21 AS `radical_id`, '呢' AS `hanzi_char`
    UNION ALL
    SELECT '能' AS `hanzi`, 'neng' AS `pinyin_raw`, 130 AS `radical_id`, '能' AS `hanzi_char`
    UNION ALL
    SELECT '能' AS `hanzi`, 'neng' AS `pinyin_raw`, 28 AS `radical_id`, '能' AS `hanzi_char`
    UNION ALL
    SELECT '能' AS `hanzi`, 'neng' AS `pinyin_raw`, 21 AS `radical_id`, '能' AS `hanzi_char`
    UNION ALL
    SELECT '你' AS `hanzi`, 'ni' AS `pinyin_raw`, 9 AS `radical_id`, '你' AS `hanzi_char`
    UNION ALL
    SELECT '你' AS `hanzi`, 'ni' AS `pinyin_raw`, 42 AS `radical_id`, '你' AS `hanzi_char`
    UNION ALL
    SELECT '你' AS `hanzi`, 'ni' AS `pinyin_raw`, 18 AS `radical_id`, '你' AS `hanzi_char`
    UNION ALL
    SELECT '你们' AS `hanzi`, 'nimen' AS `pinyin_raw`, 9 AS `radical_id`, '你' AS `hanzi_char`
    UNION ALL
    SELECT '你们' AS `hanzi`, 'nimen' AS `pinyin_raw`, 42 AS `radical_id`, '你' AS `hanzi_char`
    UNION ALL
    SELECT '你们' AS `hanzi`, 'nimen' AS `pinyin_raw`, 18 AS `radical_id`, '你' AS `hanzi_char`
    UNION ALL
    SELECT '你们' AS `hanzi`, 'nimen' AS `pinyin_raw`, 169 AS `radical_id`, '们' AS `hanzi_char`
    UNION ALL
    SELECT '年' AS `hanzi`, 'nian' AS `pinyin_raw`, 51 AS `radical_id`, '年' AS `hanzi_char`
    UNION ALL
    SELECT '您' AS `hanzi`, 'nin' AS `pinyin_raw`, 61 AS `radical_id`, '您' AS `hanzi_char`
    UNION ALL
    SELECT '您' AS `hanzi`, 'nin' AS `pinyin_raw`, 9 AS `radical_id`, '您' AS `hanzi_char`
    UNION ALL
    SELECT '牛奶' AS `hanzi`, 'niunai' AS `pinyin_raw`, 93 AS `radical_id`, '牛' AS `hanzi_char`
    UNION ALL
    SELECT '牛奶' AS `hanzi`, 'niunai' AS `pinyin_raw`, 38 AS `radical_id`, '奶' AS `hanzi_char`
    UNION ALL
    SELECT '牛奶' AS `hanzi`, 'niunai' AS `pinyin_raw`, 4 AS `radical_id`, '奶' AS `hanzi_char`
    UNION ALL
    SELECT '女' AS `hanzi`, 'nu' AS `pinyin_raw`, 38 AS `radical_id`, '女' AS `hanzi_char`
    UNION ALL
    SELECT '女儿' AS `hanzi`, 'nu''er' AS `pinyin_raw`, 38 AS `radical_id`, '女' AS `hanzi_char`
    UNION ALL
    SELECT '女儿' AS `hanzi`, 'nu''er' AS `pinyin_raw`, 10 AS `radical_id`, '儿' AS `hanzi_char`
    UNION ALL
    SELECT '女孩儿' AS `hanzi`, 'nuhair' AS `pinyin_raw`, 38 AS `radical_id`, '女' AS `hanzi_char`
    UNION ALL
    SELECT '女孩儿' AS `hanzi`, 'nuhair' AS `pinyin_raw`, 39 AS `radical_id`, '孩' AS `hanzi_char`
    UNION ALL
    SELECT '女孩儿' AS `hanzi`, 'nuhair' AS `pinyin_raw`, 8 AS `radical_id`, '孩' AS `hanzi_char`
    UNION ALL
    SELECT '女孩儿' AS `hanzi`, 'nuhair' AS `pinyin_raw`, 10 AS `radical_id`, '儿' AS `hanzi_char`
    UNION ALL
    SELECT '女朋友' AS `hanzi`, 'nupengyou' AS `pinyin_raw`, 38 AS `radical_id`, '女' AS `hanzi_char`
    UNION ALL
    SELECT '女朋友' AS `hanzi`, 'nupengyou' AS `pinyin_raw`, 74 AS `radical_id`, '朋' AS `hanzi_char`
    UNION ALL
    SELECT '女朋友' AS `hanzi`, 'nupengyou' AS `pinyin_raw`, 29 AS `radical_id`, '友' AS `hanzi_char`
    UNION ALL
    SELECT '女人' AS `hanzi`, 'nuren' AS `pinyin_raw`, 38 AS `radical_id`, '女' AS `hanzi_char`
    UNION ALL
    SELECT '女人' AS `hanzi`, 'nuren' AS `pinyin_raw`, 9 AS `radical_id`, '人' AS `hanzi_char`
    UNION ALL
    SELECT '女生' AS `hanzi`, 'nusheng' AS `pinyin_raw`, 38 AS `radical_id`, '女' AS `hanzi_char`
    UNION ALL
    SELECT '女生' AS `hanzi`, 'nusheng' AS `pinyin_raw`, 100 AS `radical_id`, '生' AS `hanzi_char`
    UNION ALL
    SELECT '旁边' AS `hanzi`, 'pangbian' AS `pinyin_raw`, 70 AS `radical_id`, '旁' AS `hanzi_char`
    UNION ALL
    SELECT '旁边' AS `hanzi`, 'pangbian' AS `pinyin_raw`, 117 AS `radical_id`, '旁' AS `hanzi_char`
    UNION ALL
    SELECT '旁边' AS `hanzi`, 'pangbian' AS `pinyin_raw`, 162 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '旁边' AS `hanzi`, 'pangbian' AS `pinyin_raw`, 19 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '跑' AS `hanzi`, 'pao' AS `pinyin_raw`, 157 AS `radical_id`, '跑' AS `hanzi_char`
    UNION ALL
    SELECT '跑' AS `hanzi`, 'pao' AS `pinyin_raw`, 20 AS `radical_id`, '跑' AS `hanzi_char`
    UNION ALL
    SELECT '跑' AS `hanzi`, 'pao' AS `pinyin_raw`, 49 AS `radical_id`, '跑' AS `hanzi_char`
    UNION ALL
    SELECT '朋友' AS `hanzi`, 'pengyou' AS `pinyin_raw`, 74 AS `radical_id`, '朋' AS `hanzi_char`
    UNION ALL
    SELECT '朋友' AS `hanzi`, 'pengyou' AS `pinyin_raw`, 29 AS `radical_id`, '友' AS `hanzi_char`
    UNION ALL
    SELECT '票' AS `hanzi`, 'piao' AS `pinyin_raw`, 113 AS `radical_id`, '票' AS `hanzi_char`
    UNION ALL
    SELECT '票' AS `hanzi`, 'piao' AS `pinyin_raw`, 146 AS `radical_id`, '票' AS `hanzi_char`
    UNION ALL
    SELECT '七' AS `hanzi`, 'qi' AS `pinyin_raw`, 1 AS `radical_id`, '七' AS `hanzi_char`
    UNION ALL
    SELECT '七' AS `hanzi`, 'qi' AS `pinyin_raw`, 5 AS `radical_id`, '七' AS `hanzi_char`
    UNION ALL
    SELECT '起' AS `hanzi`, 'qi' AS `pinyin_raw`, 156 AS `radical_id`, '起' AS `hanzi_char`
    UNION ALL
    SELECT '起' AS `hanzi`, 'qi' AS `pinyin_raw`, 49 AS `radical_id`, '起' AS `hanzi_char`
    UNION ALL
    SELECT '起床' AS `hanzi`, 'qichuang' AS `pinyin_raw`, 156 AS `radical_id`, '起' AS `hanzi_char`
    UNION ALL
    SELECT '起床' AS `hanzi`, 'qichuang' AS `pinyin_raw`, 49 AS `radical_id`, '起' AS `hanzi_char`
    UNION ALL
    SELECT '起床' AS `hanzi`, 'qichuang' AS `pinyin_raw`, 53 AS `radical_id`, '床' AS `hanzi_char`
    UNION ALL
    SELECT '起床' AS `hanzi`, 'qichuang' AS `pinyin_raw`, 75 AS `radical_id`, '床' AS `hanzi_char`
    UNION ALL
    SELECT '起来' AS `hanzi`, 'qilai' AS `pinyin_raw`, 156 AS `radical_id`, '起' AS `hanzi_char`
    UNION ALL
    SELECT '起来' AS `hanzi`, 'qilai' AS `pinyin_raw`, 49 AS `radical_id`, '起' AS `hanzi_char`
    UNION ALL
    SELECT '起来' AS `hanzi`, 'qilai' AS `pinyin_raw`, 75 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '起来' AS `hanzi`, 'qilai' AS `pinyin_raw`, 1 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '起来' AS `hanzi`, 'qilai' AS `pinyin_raw`, 12 AS `radical_id`, '来' AS `hanzi_char`
    UNION ALL
    SELECT '汽车' AS `hanzi`, 'qiche' AS `pinyin_raw`, 85 AS `radical_id`, '汽' AS `hanzi_char`
    UNION ALL
    SELECT '汽车' AS `hanzi`, 'qiche' AS `pinyin_raw`, 84 AS `radical_id`, '汽' AS `hanzi_char`
    UNION ALL
    SELECT '汽车' AS `hanzi`, 'qiche' AS `pinyin_raw`, 159 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '汽车' AS `hanzi`, 'qiche' AS `pinyin_raw`, 1 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '汽车' AS `hanzi`, 'qiche' AS `pinyin_raw`, 5 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '汽车' AS `hanzi`, 'qiche' AS `pinyin_raw`, 24 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '前' AS `hanzi`, 'qian' AS `pinyin_raw`, 18 AS `radical_id`, '前' AS `hanzi_char`
    UNION ALL
    SELECT '前' AS `hanzi`, 'qian' AS `pinyin_raw`, 12 AS `radical_id`, '前' AS `hanzi_char`
    UNION ALL
    SELECT '前' AS `hanzi`, 'qian' AS `pinyin_raw`, 1 AS `radical_id`, '前' AS `hanzi_char`
    UNION ALL
    SELECT '前' AS `hanzi`, 'qian' AS `pinyin_raw`, 74 AS `radical_id`, '前' AS `hanzi_char`
    UNION ALL
    SELECT '前边' AS `hanzi`, 'qianbian' AS `pinyin_raw`, 18 AS `radical_id`, '前' AS `hanzi_char`
    UNION ALL
    SELECT '前边' AS `hanzi`, 'qianbian' AS `pinyin_raw`, 12 AS `radical_id`, '前' AS `hanzi_char`
    UNION ALL
    SELECT '前边' AS `hanzi`, 'qianbian' AS `pinyin_raw`, 1 AS `radical_id`, '前' AS `hanzi_char`
    UNION ALL
    SELECT '前边' AS `hanzi`, 'qianbian' AS `pinyin_raw`, 74 AS `radical_id`, '前' AS `hanzi_char`
    UNION ALL
    SELECT '前边' AS `hanzi`, 'qianbian' AS `pinyin_raw`, 162 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '前边' AS `hanzi`, 'qianbian' AS `pinyin_raw`, 19 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '前天' AS `hanzi`, 'qiantian' AS `pinyin_raw`, 18 AS `radical_id`, '前' AS `hanzi_char`
    UNION ALL
    SELECT '前天' AS `hanzi`, 'qiantian' AS `pinyin_raw`, 12 AS `radical_id`, '前' AS `hanzi_char`
    UNION ALL
    SELECT '前天' AS `hanzi`, 'qiantian' AS `pinyin_raw`, 1 AS `radical_id`, '前' AS `hanzi_char`
    UNION ALL
    SELECT '前天' AS `hanzi`, 'qiantian' AS `pinyin_raw`, 74 AS `radical_id`, '前' AS `hanzi_char`
    UNION ALL
    SELECT '前天' AS `hanzi`, 'qiantian' AS `pinyin_raw`, 37 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '钱' AS `hanzi`, 'qian' AS `pinyin_raw`, 167 AS `radical_id`, '钱' AS `hanzi_char`
    UNION ALL
    SELECT '钱' AS `hanzi`, 'qian' AS `pinyin_raw`, 62 AS `radical_id`, '钱' AS `hanzi_char`
    UNION ALL
    SELECT '钱' AS `hanzi`, 'qian' AS `pinyin_raw`, 1 AS `radical_id`, '钱' AS `hanzi_char`
    UNION ALL
    SELECT '钱包' AS `hanzi`, 'qianbao' AS `pinyin_raw`, 167 AS `radical_id`, '钱' AS `hanzi_char`
    UNION ALL
    SELECT '钱包' AS `hanzi`, 'qianbao' AS `pinyin_raw`, 62 AS `radical_id`, '钱' AS `hanzi_char`
    UNION ALL
    SELECT '钱包' AS `hanzi`, 'qianbao' AS `pinyin_raw`, 1 AS `radical_id`, '钱' AS `hanzi_char`
    UNION ALL
    SELECT '钱包' AS `hanzi`, 'qianbao' AS `pinyin_raw`, 20 AS `radical_id`, '包' AS `hanzi_char`
    UNION ALL
    SELECT '钱包' AS `hanzi`, 'qianbao' AS `pinyin_raw`, 49 AS `radical_id`, '包' AS `hanzi_char`
    UNION ALL
    SELECT '请' AS `hanzi`, 'qing' AS `pinyin_raw`, 149 AS `radical_id`, '请' AS `hanzi_char`
    UNION ALL
    SELECT '请' AS `hanzi`, 'qing' AS `pinyin_raw`, 174 AS `radical_id`, '请' AS `hanzi_char`
    UNION ALL
    SELECT '请假' AS `hanzi`, 'qingjia' AS `pinyin_raw`, 149 AS `radical_id`, '请' AS `hanzi_char`
    UNION ALL
    SELECT '请假' AS `hanzi`, 'qingjia' AS `pinyin_raw`, 174 AS `radical_id`, '请' AS `hanzi_char`
    UNION ALL
    SELECT '请假' AS `hanzi`, 'qingjia' AS `pinyin_raw`, 9 AS `radical_id`, '假' AS `hanzi_char`
    UNION ALL
    SELECT '请假' AS `hanzi`, 'qingjia' AS `pinyin_raw`, 29 AS `radical_id`, '假' AS `hanzi_char`
    UNION ALL
    SELECT '请进' AS `hanzi`, 'qing jin' AS `pinyin_raw`, 149 AS `radical_id`, '请' AS `hanzi_char`
    UNION ALL
    SELECT '请进' AS `hanzi`, 'qing jin' AS `pinyin_raw`, 174 AS `radical_id`, '请' AS `hanzi_char`
    UNION ALL
    SELECT '请进' AS `hanzi`, 'qing jin' AS `pinyin_raw`, 162 AS `radical_id`, '进' AS `hanzi_char`
    UNION ALL
    SELECT '请进' AS `hanzi`, 'qing jin' AS `pinyin_raw`, 7 AS `radical_id`, '进' AS `hanzi_char`
    UNION ALL
    SELECT '请问' AS `hanzi`, 'qingwen' AS `pinyin_raw`, 149 AS `radical_id`, '请' AS `hanzi_char`
    UNION ALL
    SELECT '请问' AS `hanzi`, 'qingwen' AS `pinyin_raw`, 174 AS `radical_id`, '请' AS `hanzi_char`
    UNION ALL
    SELECT '请问' AS `hanzi`, 'qingwen' AS `pinyin_raw`, 169 AS `radical_id`, '问' AS `hanzi_char`
    UNION ALL
    SELECT '请问' AS `hanzi`, 'qingwen' AS `pinyin_raw`, 30 AS `radical_id`, '问' AS `hanzi_char`
    UNION ALL
    SELECT '请坐' AS `hanzi`, 'qing zuo' AS `pinyin_raw`, 149 AS `radical_id`, '请' AS `hanzi_char`
    UNION ALL
    SELECT '请坐' AS `hanzi`, 'qing zuo' AS `pinyin_raw`, 174 AS `radical_id`, '请' AS `hanzi_char`
    UNION ALL
    SELECT '请坐' AS `hanzi`, 'qing zuo' AS `pinyin_raw`, 32 AS `radical_id`, '坐' AS `hanzi_char`
    UNION ALL
    SELECT '请坐' AS `hanzi`, 'qing zuo' AS `pinyin_raw`, 9 AS `radical_id`, '坐' AS `hanzi_char`
    UNION ALL
    SELECT '球' AS `hanzi`, 'qiu' AS `pinyin_raw`, 96 AS `radical_id`, '球' AS `hanzi_char`
    UNION ALL
    SELECT '球' AS `hanzi`, 'qiu' AS `pinyin_raw`, 85 AS `radical_id`, '球' AS `hanzi_char`
    UNION ALL
    SELECT '球' AS `hanzi`, 'qiu' AS `pinyin_raw`, 1 AS `radical_id`, '球' AS `hanzi_char`
    UNION ALL
    SELECT '去' AS `hanzi`, 'qu' AS `pinyin_raw`, 28 AS `radical_id`, '去' AS `hanzi_char`
    UNION ALL
    SELECT '去' AS `hanzi`, 'qu' AS `pinyin_raw`, 32 AS `radical_id`, '去' AS `hanzi_char`
    UNION ALL
    SELECT '去年' AS `hanzi`, 'qunian' AS `pinyin_raw`, 28 AS `radical_id`, '去' AS `hanzi_char`
    UNION ALL
    SELECT '去年' AS `hanzi`, 'qunian' AS `pinyin_raw`, 32 AS `radical_id`, '去' AS `hanzi_char`
    UNION ALL
    SELECT '去年' AS `hanzi`, 'qunian' AS `pinyin_raw`, 51 AS `radical_id`, '年' AS `hanzi_char`
    UNION ALL
    SELECT '热' AS `hanzi`, 're' AS `pinyin_raw`, 86 AS `radical_id`, '热' AS `hanzi_char`
    UNION ALL
    SELECT '热' AS `hanzi`, 're' AS `pinyin_raw`, 64 AS `radical_id`, '热' AS `hanzi_char`
    UNION ALL
    SELECT '人' AS `hanzi`, 'ren' AS `pinyin_raw`, 9 AS `radical_id`, '人' AS `hanzi_char`
    UNION ALL
    SELECT '认识' AS `hanzi`, 'renshi' AS `pinyin_raw`, 149 AS `radical_id`, '认' AS `hanzi_char`
    UNION ALL
    SELECT '认识' AS `hanzi`, 'renshi' AS `pinyin_raw`, 9 AS `radical_id`, '认' AS `hanzi_char`
    UNION ALL
    SELECT '认识' AS `hanzi`, 'renshi' AS `pinyin_raw`, 30 AS `radical_id`, '识' AS `hanzi_char`
    UNION ALL
    SELECT '认识' AS `hanzi`, 'renshi' AS `pinyin_raw`, 12 AS `radical_id`, '识' AS `hanzi_char`
    UNION ALL
    SELECT '认真' AS `hanzi`, 'renzhen' AS `pinyin_raw`, 149 AS `radical_id`, '认' AS `hanzi_char`
    UNION ALL
    SELECT '认真' AS `hanzi`, 'renzhen' AS `pinyin_raw`, 9 AS `radical_id`, '认' AS `hanzi_char`
    UNION ALL
    SELECT '认真' AS `hanzi`, 'renzhen' AS `pinyin_raw`, 109 AS `radical_id`, '真' AS `hanzi_char`
    UNION ALL
    SELECT '认真' AS `hanzi`, 'renzhen' AS `pinyin_raw`, 24 AS `radical_id`, '真' AS `hanzi_char`
    UNION ALL
    SELECT '认真' AS `hanzi`, 'renzhen' AS `pinyin_raw`, 1 AS `radical_id`, '真' AS `hanzi_char`
    UNION ALL
    SELECT '认真' AS `hanzi`, 'renzhen' AS `pinyin_raw`, 16 AS `radical_id`, '真' AS `hanzi_char`
    UNION ALL
    SELECT '日' AS `hanzi`, 'ri' AS `pinyin_raw`, 72 AS `radical_id`, '日' AS `hanzi_char`
    UNION ALL
    SELECT '日期' AS `hanzi`, 'riqi' AS `pinyin_raw`, 72 AS `radical_id`, '日' AS `hanzi_char`
    UNION ALL
    SELECT '日期' AS `hanzi`, 'riqi' AS `pinyin_raw`, 74 AS `radical_id`, '期' AS `hanzi_char`
    UNION ALL
    SELECT '日期' AS `hanzi`, 'riqi' AS `pinyin_raw`, 12 AS `radical_id`, '期' AS `hanzi_char`
    UNION ALL
    SELECT '日期' AS `hanzi`, 'riqi' AS `pinyin_raw`, 99 AS `radical_id`, '期' AS `hanzi_char`
    UNION ALL
    SELECT '日期' AS `hanzi`, 'riqi' AS `pinyin_raw`, 1 AS `radical_id`, '期' AS `hanzi_char`
    UNION ALL
    SELECT '肉' AS `hanzi`, 'rou' AS `pinyin_raw`, 130 AS `radical_id`, '肉' AS `hanzi_char`
    UNION ALL
    SELECT '三' AS `hanzi`, 'san' AS `pinyin_raw`, 1 AS `radical_id`, '三' AS `hanzi_char`
    UNION ALL
    SELECT '三' AS `hanzi`, 'san' AS `pinyin_raw`, 7 AS `radical_id`, '三' AS `hanzi_char`
    UNION ALL
    SELECT '山' AS `hanzi`, 'shan' AS `pinyin_raw`, 46 AS `radical_id`, '山' AS `hanzi_char`
    UNION ALL
    SELECT '商场' AS `hanzi`, 'shangchang' AS `pinyin_raw`, 30 AS `radical_id`, '商' AS `hanzi_char`
    UNION ALL
    SELECT '商场' AS `hanzi`, 'shangchang' AS `pinyin_raw`, 8 AS `radical_id`, '商' AS `hanzi_char`
    UNION ALL
    SELECT '商场' AS `hanzi`, 'shangchang' AS `pinyin_raw`, 12 AS `radical_id`, '商' AS `hanzi_char`
    UNION ALL
    SELECT '商场' AS `hanzi`, 'shangchang' AS `pinyin_raw`, 13 AS `radical_id`, '商' AS `hanzi_char`
    UNION ALL
    SELECT '商场' AS `hanzi`, 'shangchang' AS `pinyin_raw`, 32 AS `radical_id`, '场' AS `hanzi_char`
    UNION ALL
    SELECT '商场' AS `hanzi`, 'shangchang' AS `pinyin_raw`, 20 AS `radical_id`, '场' AS `hanzi_char`
    UNION ALL
    SELECT '商场' AS `hanzi`, 'shangchang' AS `pinyin_raw`, 4 AS `radical_id`, '场' AS `hanzi_char`
    UNION ALL
    SELECT '商店' AS `hanzi`, 'shangdian' AS `pinyin_raw`, 30 AS `radical_id`, '商' AS `hanzi_char`
    UNION ALL
    SELECT '商店' AS `hanzi`, 'shangdian' AS `pinyin_raw`, 8 AS `radical_id`, '商' AS `hanzi_char`
    UNION ALL
    SELECT '商店' AS `hanzi`, 'shangdian' AS `pinyin_raw`, 12 AS `radical_id`, '商' AS `hanzi_char`
    UNION ALL
    SELECT '商店' AS `hanzi`, 'shangdian' AS `pinyin_raw`, 13 AS `radical_id`, '商' AS `hanzi_char`
    UNION ALL
    SELECT '商店' AS `hanzi`, 'shangdian' AS `pinyin_raw`, 53 AS `radical_id`, '店' AS `hanzi_char`
    UNION ALL
    SELECT '商店' AS `hanzi`, 'shangdian' AS `pinyin_raw`, 25 AS `radical_id`, '店' AS `hanzi_char`
    UNION ALL
    SELECT '上' AS `hanzi`, 'shang' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上' AS `hanzi`, 'shang' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上班' AS `hanzi`, 'shangban' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上班' AS `hanzi`, 'shangban' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上班' AS `hanzi`, 'shangban' AS `pinyin_raw`, 96 AS `radical_id`, '班' AS `hanzi_char`
    UNION ALL
    SELECT '上班' AS `hanzi`, 'shangban' AS `pinyin_raw`, 18 AS `radical_id`, '班' AS `hanzi_char`
    UNION ALL
    SELECT '上边' AS `hanzi`, 'shangbian' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上边' AS `hanzi`, 'shangbian' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上边' AS `hanzi`, 'shangbian' AS `pinyin_raw`, 162 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '上边' AS `hanzi`, 'shangbian' AS `pinyin_raw`, 19 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '上车' AS `hanzi`, 'shang che' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上车' AS `hanzi`, 'shang che' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上车' AS `hanzi`, 'shang che' AS `pinyin_raw`, 159 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '上车' AS `hanzi`, 'shang che' AS `pinyin_raw`, 5 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '上车' AS `hanzi`, 'shang che' AS `pinyin_raw`, 24 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '上次' AS `hanzi`, 'shang ci' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上次' AS `hanzi`, 'shang ci' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上次' AS `hanzi`, 'shang ci' AS `pinyin_raw`, 76 AS `radical_id`, '次' AS `hanzi_char`
    UNION ALL
    SELECT '上次' AS `hanzi`, 'shang ci' AS `pinyin_raw`, 15 AS `radical_id`, '次' AS `hanzi_char`
    UNION ALL
    SELECT '上课' AS `hanzi`, 'shangke' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上课' AS `hanzi`, 'shangke' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上课' AS `hanzi`, 'shangke' AS `pinyin_raw`, 149 AS `radical_id`, '课' AS `hanzi_char`
    UNION ALL
    SELECT '上课' AS `hanzi`, 'shangke' AS `pinyin_raw`, 75 AS `radical_id`, '课' AS `hanzi_char`
    UNION ALL
    SELECT '上课' AS `hanzi`, 'shangke' AS `pinyin_raw`, 102 AS `radical_id`, '课' AS `hanzi_char`
    UNION ALL
    SELECT '上网' AS `hanzi`, 'shangwang' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上网' AS `hanzi`, 'shangwang' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上网' AS `hanzi`, 'shangwang' AS `pinyin_raw`, 122 AS `radical_id`, '网' AS `hanzi_char`
    UNION ALL
    SELECT '上午' AS `hanzi`, 'shangwu' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上午' AS `hanzi`, 'shangwu' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上午' AS `hanzi`, 'shangwu' AS `pinyin_raw`, 24 AS `radical_id`, '午' AS `hanzi_char`
    UNION ALL
    SELECT '上午' AS `hanzi`, 'shangwu' AS `pinyin_raw`, 4 AS `radical_id`, '午' AS `hanzi_char`
    UNION ALL
    SELECT '上午' AS `hanzi`, 'shangwu' AS `pinyin_raw`, 51 AS `radical_id`, '午' AS `hanzi_char`
    UNION ALL
    SELECT '上学' AS `hanzi`, 'shangxue' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上学' AS `hanzi`, 'shangxue' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '上学' AS `hanzi`, 'shangxue' AS `pinyin_raw`, 39 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '上学' AS `hanzi`, 'shangxue' AS `pinyin_raw`, 42 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '上学' AS `hanzi`, 'shangxue' AS `pinyin_raw`, 14 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '少' AS `hanzi`, 'shao' AS `pinyin_raw`, 42 AS `radical_id`, '少' AS `hanzi_char`
    UNION ALL
    SELECT '少' AS `hanzi`, 'shao' AS `pinyin_raw`, 4 AS `radical_id`, '少' AS `hanzi_char`
    UNION ALL
    SELECT '谁' AS `hanzi`, 'shei/shui' AS `pinyin_raw`, 149 AS `radical_id`, '谁' AS `hanzi_char`
    UNION ALL
    SELECT '谁' AS `hanzi`, 'shei/shui' AS `pinyin_raw`, 172 AS `radical_id`, '谁' AS `hanzi_char`
    UNION ALL
    SELECT '身上' AS `hanzi`, 'shenshang' AS `pinyin_raw`, 158 AS `radical_id`, '身' AS `hanzi_char`
    UNION ALL
    SELECT '身上' AS `hanzi`, 'shenshang' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '身上' AS `hanzi`, 'shenshang' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '身体' AS `hanzi`, 'shenti' AS `pinyin_raw`, 158 AS `radical_id`, '身' AS `hanzi_char`
    UNION ALL
    SELECT '身体' AS `hanzi`, 'shenti' AS `pinyin_raw`, 9 AS `radical_id`, '体' AS `hanzi_char`
    UNION ALL
    SELECT '身体' AS `hanzi`, 'shenti' AS `pinyin_raw`, 75 AS `radical_id`, '体' AS `hanzi_char`
    UNION ALL
    SELECT '身体' AS `hanzi`, 'shenti' AS `pinyin_raw`, 1 AS `radical_id`, '体' AS `hanzi_char`
    UNION ALL
    SELECT '什么' AS `hanzi`, 'shenme' AS `pinyin_raw`, 9 AS `radical_id`, '什' AS `hanzi_char`
    UNION ALL
    SELECT '什么' AS `hanzi`, 'shenme' AS `pinyin_raw`, 24 AS `radical_id`, '什' AS `hanzi_char`
    UNION ALL
    SELECT '什么' AS `hanzi`, 'shenme' AS `pinyin_raw`, 4 AS `radical_id`, '么' AS `hanzi_char`
    UNION ALL
    SELECT '什么' AS `hanzi`, 'shenme' AS `pinyin_raw`, 28 AS `radical_id`, '么' AS `hanzi_char`
    UNION ALL
    SELECT '生病' AS `hanzi`, 'shengbing' AS `pinyin_raw`, 100 AS `radical_id`, '生' AS `hanzi_char`
    UNION ALL
    SELECT '生病' AS `hanzi`, 'shengbing' AS `pinyin_raw`, 104 AS `radical_id`, '病' AS `hanzi_char`
    UNION ALL
    SELECT '生病' AS `hanzi`, 'shengbing' AS `pinyin_raw`, 1 AS `radical_id`, '病' AS `hanzi_char`
    UNION ALL
    SELECT '生气' AS `hanzi`, 'shengqi' AS `pinyin_raw`, 100 AS `radical_id`, '生' AS `hanzi_char`
    UNION ALL
    SELECT '生气' AS `hanzi`, 'shengqi' AS `pinyin_raw`, 84 AS `radical_id`, '气' AS `hanzi_char`
    UNION ALL
    SELECT '生日' AS `hanzi`, 'shengri' AS `pinyin_raw`, 100 AS `radical_id`, '生' AS `hanzi_char`
    UNION ALL
    SELECT '生日' AS `hanzi`, 'shengri' AS `pinyin_raw`, 72 AS `radical_id`, '日' AS `hanzi_char`
    UNION ALL
    SELECT '十' AS `hanzi`, 'shi' AS `pinyin_raw`, 24 AS `radical_id`, '十' AS `hanzi_char`
    UNION ALL
    SELECT '时候' AS `hanzi`, 'shihou' AS `pinyin_raw`, 72 AS `radical_id`, '时' AS `hanzi_char`
    UNION ALL
    SELECT '时候' AS `hanzi`, 'shihou' AS `pinyin_raw`, 41 AS `radical_id`, '时' AS `hanzi_char`
    UNION ALL
    SELECT '时候' AS `hanzi`, 'shihou' AS `pinyin_raw`, 9 AS `radical_id`, '候' AS `hanzi_char`
    UNION ALL
    SELECT '时候' AS `hanzi`, 'shihou' AS `pinyin_raw`, 111 AS `radical_id`, '候' AS `hanzi_char`
    UNION ALL
    SELECT '时间' AS `hanzi`, 'shijian' AS `pinyin_raw`, 72 AS `radical_id`, '时' AS `hanzi_char`
    UNION ALL
    SELECT '时间' AS `hanzi`, 'shijian' AS `pinyin_raw`, 41 AS `radical_id`, '时' AS `hanzi_char`
    UNION ALL
    SELECT '时间' AS `hanzi`, 'shijian' AS `pinyin_raw`, 169 AS `radical_id`, '间' AS `hanzi_char`
    UNION ALL
    SELECT '事' AS `hanzi`, 'shi' AS `pinyin_raw`, 6 AS `radical_id`, '事' AS `hanzi_char`
    UNION ALL
    SELECT '事' AS `hanzi`, 'shi' AS `pinyin_raw`, 1 AS `radical_id`, '事' AS `hanzi_char`
    UNION ALL
    SELECT '事' AS `hanzi`, 'shi' AS `pinyin_raw`, 30 AS `radical_id`, '事' AS `hanzi_char`
    UNION ALL
    SELECT '事' AS `hanzi`, 'shi' AS `pinyin_raw`, 58 AS `radical_id`, '事' AS `hanzi_char`
    UNION ALL
    SELECT '试' AS `hanzi`, 'shi' AS `pinyin_raw`, 149 AS `radical_id`, '试' AS `hanzi_char`
    UNION ALL
    SELECT '试' AS `hanzi`, 'shi' AS `pinyin_raw`, 56 AS `radical_id`, '试' AS `hanzi_char`
    UNION ALL
    SELECT '试' AS `hanzi`, 'shi' AS `pinyin_raw`, 48 AS `radical_id`, '试' AS `hanzi_char`
    UNION ALL
    SELECT '是' AS `hanzi`, 'shi' AS `pinyin_raw`, 72 AS `radical_id`, '是' AS `hanzi_char`
    UNION ALL
    SELECT '是' AS `hanzi`, 'shi' AS `pinyin_raw`, 103 AS `radical_id`, '是' AS `hanzi_char`
    UNION ALL
    SELECT '是不是' AS `hanzi`, 'shi bu shi' AS `pinyin_raw`, 72 AS `radical_id`, '是' AS `hanzi_char`
    UNION ALL
    SELECT '是不是' AS `hanzi`, 'shi bu shi' AS `pinyin_raw`, 103 AS `radical_id`, '是' AS `hanzi_char`
    UNION ALL
    SELECT '是不是' AS `hanzi`, 'shi bu shi' AS `pinyin_raw`, 1 AS `radical_id`, '不' AS `hanzi_char`
    UNION ALL
    SELECT '手' AS `hanzi`, 'shou' AS `pinyin_raw`, 64 AS `radical_id`, '手' AS `hanzi_char`
    UNION ALL
    SELECT '手机' AS `hanzi`, 'shouji' AS `pinyin_raw`, 64 AS `radical_id`, '手' AS `hanzi_char`
    UNION ALL
    SELECT '手机' AS `hanzi`, 'shouji' AS `pinyin_raw`, 75 AS `radical_id`, '机' AS `hanzi_char`
    UNION ALL
    SELECT '手机' AS `hanzi`, 'shouji' AS `pinyin_raw`, 16 AS `radical_id`, '机' AS `hanzi_char`
    UNION ALL
    SELECT '书' AS `hanzi`, 'shu' AS `pinyin_raw`, 2 AS `radical_id`, '书' AS `hanzi_char`
    UNION ALL
    SELECT '书包' AS `hanzi`, 'shubao' AS `pinyin_raw`, 2 AS `radical_id`, '书' AS `hanzi_char`
    UNION ALL
    SELECT '书包' AS `hanzi`, 'shubao' AS `pinyin_raw`, 20 AS `radical_id`, '包' AS `hanzi_char`
    UNION ALL
    SELECT '书包' AS `hanzi`, 'shubao' AS `pinyin_raw`, 49 AS `radical_id`, '包' AS `hanzi_char`
    UNION ALL
    SELECT '书店' AS `hanzi`, 'shudian' AS `pinyin_raw`, 2 AS `radical_id`, '书' AS `hanzi_char`
    UNION ALL
    SELECT '书店' AS `hanzi`, 'shudian' AS `pinyin_raw`, 53 AS `radical_id`, '店' AS `hanzi_char`
    UNION ALL
    SELECT '书店' AS `hanzi`, 'shudian' AS `pinyin_raw`, 25 AS `radical_id`, '店' AS `hanzi_char`
    UNION ALL
    SELECT '书店' AS `hanzi`, 'shudian' AS `pinyin_raw`, 30 AS `radical_id`, '店' AS `hanzi_char`
    UNION ALL
    SELECT '树' AS `hanzi`, 'shu' AS `pinyin_raw`, 75 AS `radical_id`, '树' AS `hanzi_char`
    UNION ALL
    SELECT '树' AS `hanzi`, 'shu' AS `pinyin_raw`, 41 AS `radical_id`, '树' AS `hanzi_char`
    UNION ALL
    SELECT '树' AS `hanzi`, 'shu' AS `pinyin_raw`, 29 AS `radical_id`, '树' AS `hanzi_char`
    UNION ALL
    SELECT '水' AS `hanzi`, 'shui' AS `pinyin_raw`, 85 AS `radical_id`, '水' AS `hanzi_char`
    UNION ALL
    SELECT '水果' AS `hanzi`, 'shuiguo' AS `pinyin_raw`, 85 AS `radical_id`, '水' AS `hanzi_char`
    UNION ALL
    SELECT '水果' AS `hanzi`, 'shuiguo' AS `pinyin_raw`, 75 AS `radical_id`, '果' AS `hanzi_char`
    UNION ALL
    SELECT '水果' AS `hanzi`, 'shuiguo' AS `pinyin_raw`, 102 AS `radical_id`, '果' AS `hanzi_char`
    UNION ALL
    SELECT '睡' AS `hanzi`, 'shui' AS `pinyin_raw`, 109 AS `radical_id`, '睡' AS `hanzi_char`
    UNION ALL
    SELECT '睡' AS `hanzi`, 'shui' AS `pinyin_raw`, 32 AS `radical_id`, '睡' AS `hanzi_char`
    UNION ALL
    SELECT '睡' AS `hanzi`, 'shui' AS `pinyin_raw`, 33 AS `radical_id`, '睡' AS `hanzi_char`
    UNION ALL
    SELECT '睡觉' AS `hanzi`, 'shuijiao' AS `pinyin_raw`, 109 AS `radical_id`, '睡' AS `hanzi_char`
    UNION ALL
    SELECT '睡觉' AS `hanzi`, 'shuijiao' AS `pinyin_raw`, 32 AS `radical_id`, '睡' AS `hanzi_char`
    UNION ALL
    SELECT '睡觉' AS `hanzi`, 'shuijiao' AS `pinyin_raw`, 33 AS `radical_id`, '睡' AS `hanzi_char`
    UNION ALL
    SELECT '睡觉' AS `hanzi`, 'shuijiao' AS `pinyin_raw`, 147 AS `radical_id`, '觉' AS `hanzi_char`
    UNION ALL
    SELECT '睡觉' AS `hanzi`, 'shuijiao' AS `pinyin_raw`, 42 AS `radical_id`, '觉' AS `hanzi_char`
    UNION ALL
    SELECT '睡觉' AS `hanzi`, 'shuijiao' AS `pinyin_raw`, 14 AS `radical_id`, '觉' AS `hanzi_char`
    UNION ALL
    SELECT '说' AS `hanzi`, 'shuo' AS `pinyin_raw`, 149 AS `radical_id`, '说' AS `hanzi_char`
    UNION ALL
    SELECT '说' AS `hanzi`, 'shuo' AS `pinyin_raw`, 10 AS `radical_id`, '说' AS `hanzi_char`
    UNION ALL
    SELECT '说' AS `hanzi`, 'shuo' AS `pinyin_raw`, 12 AS `radical_id`, '说' AS `hanzi_char`
    UNION ALL
    SELECT '说话' AS `hanzi`, 'shuohua' AS `pinyin_raw`, 149 AS `radical_id`, '说' AS `hanzi_char`
    UNION ALL
    SELECT '说话' AS `hanzi`, 'shuohua' AS `pinyin_raw`, 10 AS `radical_id`, '说' AS `hanzi_char`
    UNION ALL
    SELECT '说话' AS `hanzi`, 'shuohua' AS `pinyin_raw`, 12 AS `radical_id`, '说' AS `hanzi_char`
    UNION ALL
    SELECT '说话' AS `hanzi`, 'shuohua' AS `pinyin_raw`, 135 AS `radical_id`, '话' AS `hanzi_char`
    UNION ALL
    SELECT '四' AS `hanzi`, 'si' AS `pinyin_raw`, 31 AS `radical_id`, '四' AS `hanzi_char`
    UNION ALL
    SELECT '四' AS `hanzi`, 'si' AS `pinyin_raw`, 10 AS `radical_id`, '四' AS `hanzi_char`
    UNION ALL
    SELECT '送' AS `hanzi`, 'song' AS `pinyin_raw`, 162 AS `radical_id`, '送' AS `hanzi_char`
    UNION ALL
    SELECT '送' AS `hanzi`, 'song' AS `pinyin_raw`, 12 AS `radical_id`, '送' AS `hanzi_char`
    UNION ALL
    SELECT '岁' AS `hanzi`, 'sui' AS `pinyin_raw`, 46 AS `radical_id`, '岁' AS `hanzi_char`
    UNION ALL
    SELECT '岁' AS `hanzi`, 'sui' AS `pinyin_raw`, 36 AS `radical_id`, '岁' AS `hanzi_char`
    UNION ALL
    SELECT '他' AS `hanzi`, 'ta' AS `pinyin_raw`, 9 AS `radical_id`, '他' AS `hanzi_char`
    UNION ALL
    SELECT '他' AS `hanzi`, 'ta' AS `pinyin_raw`, 5 AS `radical_id`, '他' AS `hanzi_char`
    UNION ALL
    SELECT '他们' AS `hanzi`, 'tamen' AS `pinyin_raw`, 9 AS `radical_id`, '他' AS `hanzi_char`
    UNION ALL
    SELECT '他们' AS `hanzi`, 'tamen' AS `pinyin_raw`, 5 AS `radical_id`, '他' AS `hanzi_char`
    UNION ALL
    SELECT '他们' AS `hanzi`, 'tamen' AS `pinyin_raw`, 169 AS `radical_id`, '们' AS `hanzi_char`
    UNION ALL
    SELECT '她' AS `hanzi`, 'ta' AS `pinyin_raw`, 38 AS `radical_id`, '她' AS `hanzi_char`
    UNION ALL
    SELECT '她' AS `hanzi`, 'ta' AS `pinyin_raw`, 5 AS `radical_id`, '她' AS `hanzi_char`
    UNION ALL
    SELECT '她们' AS `hanzi`, 'tamen' AS `pinyin_raw`, 38 AS `radical_id`, '她' AS `hanzi_char`
    UNION ALL
    SELECT '她们' AS `hanzi`, 'tamen' AS `pinyin_raw`, 5 AS `radical_id`, '她' AS `hanzi_char`
    UNION ALL
    SELECT '她们' AS `hanzi`, 'tamen' AS `pinyin_raw`, 9 AS `radical_id`, '们' AS `hanzi_char`
    UNION ALL
    SELECT '她们' AS `hanzi`, 'tamen' AS `pinyin_raw`, 169 AS `radical_id`, '们' AS `hanzi_char`
    UNION ALL
    SELECT '太' AS `hanzi`, 'tai' AS `pinyin_raw`, 37 AS `radical_id`, '太' AS `hanzi_char`
    UNION ALL
    SELECT '太' AS `hanzi`, 'tai' AS `pinyin_raw`, 3 AS `radical_id`, '太' AS `hanzi_char`
    UNION ALL
    SELECT '天' AS `hanzi`, 'tian' AS `pinyin_raw`, 37 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '天' AS `hanzi`, 'tian' AS `pinyin_raw`, 1 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '天气' AS `hanzi`, 'tianqi' AS `pinyin_raw`, 37 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '天气' AS `hanzi`, 'tianqi' AS `pinyin_raw`, 1 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '天气' AS `hanzi`, 'tianqi' AS `pinyin_raw`, 84 AS `radical_id`, '气' AS `hanzi_char`
    UNION ALL
    SELECT '听' AS `hanzi`, 'ting' AS `pinyin_raw`, 30 AS `radical_id`, '听' AS `hanzi_char`
    UNION ALL
    SELECT '听' AS `hanzi`, 'ting' AS `pinyin_raw`, 69 AS `radical_id`, '听' AS `hanzi_char`
    UNION ALL
    SELECT '听到' AS `hanzi`, 'tingdao' AS `pinyin_raw`, 30 AS `radical_id`, '听' AS `hanzi_char`
    UNION ALL
    SELECT '听到' AS `hanzi`, 'tingdao' AS `pinyin_raw`, 69 AS `radical_id`, '听' AS `hanzi_char`
    UNION ALL
    SELECT '听到' AS `hanzi`, 'tingdao' AS `pinyin_raw`, 18 AS `radical_id`, '到' AS `hanzi_char`
    UNION ALL
    SELECT '听到' AS `hanzi`, 'tingdao' AS `pinyin_raw`, 133 AS `radical_id`, '到' AS `hanzi_char`
    UNION ALL
    SELECT '听见' AS `hanzi`, 'tingjian' AS `pinyin_raw`, 30 AS `radical_id`, '听' AS `hanzi_char`
    UNION ALL
    SELECT '听见' AS `hanzi`, 'tingjian' AS `pinyin_raw`, 69 AS `radical_id`, '听' AS `hanzi_char`
    UNION ALL
    SELECT '听见' AS `hanzi`, 'tingjian' AS `pinyin_raw`, 147 AS `radical_id`, '见' AS `hanzi_char`
    UNION ALL
    SELECT '听见' AS `hanzi`, 'tingjian' AS `pinyin_raw`, 13 AS `radical_id`, '见' AS `hanzi_char`
    UNION ALL
    SELECT '听见' AS `hanzi`, 'tingjian' AS `pinyin_raw`, 10 AS `radical_id`, '见' AS `hanzi_char`
    UNION ALL
    SELECT '听写' AS `hanzi`, 'tingxie' AS `pinyin_raw`, 30 AS `radical_id`, '听' AS `hanzi_char`
    UNION ALL
    SELECT '听写' AS `hanzi`, 'tingxie' AS `pinyin_raw`, 69 AS `radical_id`, '听' AS `hanzi_char`
    UNION ALL
    SELECT '听写' AS `hanzi`, 'tingxie' AS `pinyin_raw`, 14 AS `radical_id`, '写' AS `hanzi_char`
    UNION ALL
    SELECT '听写' AS `hanzi`, 'tingxie' AS `pinyin_raw`, 1 AS `radical_id`, '写' AS `hanzi_char`
    UNION ALL
    SELECT '同学' AS `hanzi`, 'tongxue' AS `pinyin_raw`, 30 AS `radical_id`, '同' AS `hanzi_char`
    UNION ALL
    SELECT '同学' AS `hanzi`, 'tongxue' AS `pinyin_raw`, 16 AS `radical_id`, '同' AS `hanzi_char`
    UNION ALL
    SELECT '同学' AS `hanzi`, 'tongxue' AS `pinyin_raw`, 3 AS `radical_id`, '同' AS `hanzi_char`
    UNION ALL
    SELECT '同学' AS `hanzi`, 'tongxue' AS `pinyin_raw`, 39 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '同学' AS `hanzi`, 'tongxue' AS `pinyin_raw`, 42 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '同学' AS `hanzi`, 'tongxue' AS `pinyin_raw`, 14 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '图书馆' AS `hanzi`, 'tushuguan' AS `pinyin_raw`, 31 AS `radical_id`, '图' AS `hanzi_char`
    UNION ALL
    SELECT '图书馆' AS `hanzi`, 'tushuguan' AS `pinyin_raw`, 15 AS `radical_id`, '图' AS `hanzi_char`
    UNION ALL
    SELECT '图书馆' AS `hanzi`, 'tushuguan' AS `pinyin_raw`, 34 AS `radical_id`, '图' AS `hanzi_char`
    UNION ALL
    SELECT '图书馆' AS `hanzi`, 'tushuguan' AS `pinyin_raw`, 2 AS `radical_id`, '书' AS `hanzi_char`
    UNION ALL
    SELECT '图书馆' AS `hanzi`, 'tushuguan' AS `pinyin_raw`, 184 AS `radical_id`, '馆' AS `hanzi_char`
    UNION ALL
    SELECT '图书馆' AS `hanzi`, 'tushuguan' AS `pinyin_raw`, 40 AS `radical_id`, '馆' AS `hanzi_char`
    UNION ALL
    SELECT '外' AS `hanzi`, 'wai' AS `pinyin_raw`, 36 AS `radical_id`, '外' AS `hanzi_char`
    UNION ALL
    SELECT '外' AS `hanzi`, 'wai' AS `pinyin_raw`, 25 AS `radical_id`, '外' AS `hanzi_char`
    UNION ALL
    SELECT '外边' AS `hanzi`, 'waibian' AS `pinyin_raw`, 36 AS `radical_id`, '外' AS `hanzi_char`
    UNION ALL
    SELECT '外边' AS `hanzi`, 'waibian' AS `pinyin_raw`, 25 AS `radical_id`, '外' AS `hanzi_char`
    UNION ALL
    SELECT '外边' AS `hanzi`, 'waibian' AS `pinyin_raw`, 162 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '外边' AS `hanzi`, 'waibian' AS `pinyin_raw`, 19 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '外国' AS `hanzi`, 'waiguo' AS `pinyin_raw`, 36 AS `radical_id`, '外' AS `hanzi_char`
    UNION ALL
    SELECT '外国' AS `hanzi`, 'waiguo' AS `pinyin_raw`, 25 AS `radical_id`, '外' AS `hanzi_char`
    UNION ALL
    SELECT '外国' AS `hanzi`, 'waiguo' AS `pinyin_raw`, 31 AS `radical_id`, '国' AS `hanzi_char`
    UNION ALL
    SELECT '外国' AS `hanzi`, 'waiguo' AS `pinyin_raw`, 96 AS `radical_id`, '国' AS `hanzi_char`
    UNION ALL
    SELECT '外语' AS `hanzi`, 'waiyu' AS `pinyin_raw`, 36 AS `radical_id`, '外' AS `hanzi_char`
    UNION ALL
    SELECT '外语' AS `hanzi`, 'waiyu' AS `pinyin_raw`, 25 AS `radical_id`, '外' AS `hanzi_char`
    UNION ALL
    SELECT '外语' AS `hanzi`, 'waiyu' AS `pinyin_raw`, 149 AS `radical_id`, '语' AS `hanzi_char`
    UNION ALL
    SELECT '外语' AS `hanzi`, 'waiyu' AS `pinyin_raw`, 30 AS `radical_id`, '语' AS `hanzi_char`
    UNION ALL
    SELECT '玩儿' AS `hanzi`, 'wanr' AS `pinyin_raw`, 96 AS `radical_id`, '玩' AS `hanzi_char`
    UNION ALL
    SELECT '玩儿' AS `hanzi`, 'wanr' AS `pinyin_raw`, 10 AS `radical_id`, '玩' AS `hanzi_char`
    UNION ALL
    SELECT '玩儿' AS `hanzi`, 'wanr' AS `pinyin_raw`, 7 AS `radical_id`, '玩' AS `hanzi_char`
    UNION ALL
    SELECT '晚' AS `hanzi`, 'wan' AS `pinyin_raw`, 72 AS `radical_id`, '晚' AS `hanzi_char`
    UNION ALL
    SELECT '晚' AS `hanzi`, 'wan' AS `pinyin_raw`, 10 AS `radical_id`, '晚' AS `hanzi_char`
    UNION ALL
    SELECT '晚' AS `hanzi`, 'wan' AS `pinyin_raw`, 18 AS `radical_id`, '晚' AS `hanzi_char`
    UNION ALL
    SELECT '晚' AS `hanzi`, 'wan' AS `pinyin_raw`, 30 AS `radical_id`, '晚' AS `hanzi_char`
    UNION ALL
    SELECT '晚饭' AS `hanzi`, 'wanfan' AS `pinyin_raw`, 72 AS `radical_id`, '晚' AS `hanzi_char`
    UNION ALL
    SELECT '晚饭' AS `hanzi`, 'wanfan' AS `pinyin_raw`, 10 AS `radical_id`, '晚' AS `hanzi_char`
    UNION ALL
    SELECT '晚饭' AS `hanzi`, 'wanfan' AS `pinyin_raw`, 18 AS `radical_id`, '晚' AS `hanzi_char`
    UNION ALL
    SELECT '晚饭' AS `hanzi`, 'wanfan' AS `pinyin_raw`, 30 AS `radical_id`, '晚' AS `hanzi_char`
    UNION ALL
    SELECT '晚饭' AS `hanzi`, 'wanfan' AS `pinyin_raw`, 184 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '晚饭' AS `hanzi`, 'wanfan' AS `pinyin_raw`, 29 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '晚饭' AS `hanzi`, 'wanfan' AS `pinyin_raw`, 27 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '晚上' AS `hanzi`, 'wanshang' AS `pinyin_raw`, 72 AS `radical_id`, '晚' AS `hanzi_char`
    UNION ALL
    SELECT '晚上' AS `hanzi`, 'wanshang' AS `pinyin_raw`, 10 AS `radical_id`, '晚' AS `hanzi_char`
    UNION ALL
    SELECT '晚上' AS `hanzi`, 'wanshang' AS `pinyin_raw`, 18 AS `radical_id`, '晚' AS `hanzi_char`
    UNION ALL
    SELECT '晚上' AS `hanzi`, 'wanshang' AS `pinyin_raw`, 30 AS `radical_id`, '晚' AS `hanzi_char`
    UNION ALL
    SELECT '晚上' AS `hanzi`, 'wanshang' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '晚上' AS `hanzi`, 'wanshang' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '网上' AS `hanzi`, 'wang shang' AS `pinyin_raw`, 122 AS `radical_id`, '网' AS `hanzi_char`
    UNION ALL
    SELECT '网上' AS `hanzi`, 'wang shang' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '网上' AS `hanzi`, 'wang shang' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '网友' AS `hanzi`, 'wangyou' AS `pinyin_raw`, 122 AS `radical_id`, '网' AS `hanzi_char`
    UNION ALL
    SELECT '网友' AS `hanzi`, 'wangyou' AS `pinyin_raw`, 29 AS `radical_id`, '友' AS `hanzi_char`
    UNION ALL
    SELECT '忘' AS `hanzi`, 'wang' AS `pinyin_raw`, 61 AS `radical_id`, '忘' AS `hanzi_char`
    UNION ALL
    SELECT '忘' AS `hanzi`, 'wang' AS `pinyin_raw`, 8 AS `radical_id`, '忘' AS `hanzi_char`
    UNION ALL
    SELECT '忘记' AS `hanzi`, 'wangji' AS `pinyin_raw`, 61 AS `radical_id`, '忘' AS `hanzi_char`
    UNION ALL
    SELECT '忘记' AS `hanzi`, 'wangji' AS `pinyin_raw`, 8 AS `radical_id`, '忘' AS `hanzi_char`
    UNION ALL
    SELECT '忘记' AS `hanzi`, 'wangji' AS `pinyin_raw`, 149 AS `radical_id`, '记' AS `hanzi_char`
    UNION ALL
    SELECT '忘记' AS `hanzi`, 'wangji' AS `pinyin_raw`, 49 AS `radical_id`, '记' AS `hanzi_char`
    UNION ALL
    SELECT '问' AS `hanzi`, 'wen' AS `pinyin_raw`, 169 AS `radical_id`, '问' AS `hanzi_char`
    UNION ALL
    SELECT '问' AS `hanzi`, 'wen' AS `pinyin_raw`, 30 AS `radical_id`, '问' AS `hanzi_char`
    UNION ALL
    SELECT '我' AS `hanzi`, 'wo' AS `pinyin_raw`, 62 AS `radical_id`, '我' AS `hanzi_char`
    UNION ALL
    SELECT '我' AS `hanzi`, 'wo' AS `pinyin_raw`, 64 AS `radical_id`, '我' AS `hanzi_char`
    UNION ALL
    SELECT '我们' AS `hanzi`, 'women' AS `pinyin_raw`, 62 AS `radical_id`, '我' AS `hanzi_char`
    UNION ALL
    SELECT '我们' AS `hanzi`, 'women' AS `pinyin_raw`, 64 AS `radical_id`, '我' AS `hanzi_char`
    UNION ALL
    SELECT '我们' AS `hanzi`, 'women' AS `pinyin_raw`, 9 AS `radical_id`, '们' AS `hanzi_char`
    UNION ALL
    SELECT '我们' AS `hanzi`, 'women' AS `pinyin_raw`, 169 AS `radical_id`, '们' AS `hanzi_char`
    UNION ALL
    SELECT '五' AS `hanzi`, 'wu' AS `pinyin_raw`, 7 AS `radical_id`, '五' AS `hanzi_char`
    UNION ALL
    SELECT '午饭' AS `hanzi`, 'wufan' AS `pinyin_raw`, 24 AS `radical_id`, '午' AS `hanzi_char`
    UNION ALL
    SELECT '午饭' AS `hanzi`, 'wufan' AS `pinyin_raw`, 4 AS `radical_id`, '午' AS `hanzi_char`
    UNION ALL
    SELECT '午饭' AS `hanzi`, 'wufan' AS `pinyin_raw`, 51 AS `radical_id`, '午' AS `hanzi_char`
    UNION ALL
    SELECT '午饭' AS `hanzi`, 'wufan' AS `pinyin_raw`, 184 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '午饭' AS `hanzi`, 'wufan' AS `pinyin_raw`, 29 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '午饭' AS `hanzi`, 'wufan' AS `pinyin_raw`, 27 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '西' AS `hanzi`, 'xi' AS `pinyin_raw`, 146 AS `radical_id`, '西' AS `hanzi_char`
    UNION ALL
    SELECT '西' AS `hanzi`, 'xi' AS `pinyin_raw`, 10 AS `radical_id`, '西' AS `hanzi_char`
    UNION ALL
    SELECT '西' AS `hanzi`, 'xi' AS `pinyin_raw`, 31 AS `radical_id`, '西' AS `hanzi_char`
    UNION ALL
    SELECT '西边' AS `hanzi`, 'xibian' AS `pinyin_raw`, 146 AS `radical_id`, '西' AS `hanzi_char`
    UNION ALL
    SELECT '西边' AS `hanzi`, 'xibian' AS `pinyin_raw`, 10 AS `radical_id`, '西' AS `hanzi_char`
    UNION ALL
    SELECT '西边' AS `hanzi`, 'xibian' AS `pinyin_raw`, 31 AS `radical_id`, '西' AS `hanzi_char`
    UNION ALL
    SELECT '西边' AS `hanzi`, 'xibian' AS `pinyin_raw`, 162 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '西边' AS `hanzi`, 'xibian' AS `pinyin_raw`, 19 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '洗' AS `hanzi`, 'xi' AS `pinyin_raw`, 85 AS `radical_id`, '洗' AS `hanzi_char`
    UNION ALL
    SELECT '洗' AS `hanzi`, 'xi' AS `pinyin_raw`, 10 AS `radical_id`, '洗' AS `hanzi_char`
    UNION ALL
    SELECT '洗' AS `hanzi`, 'xi' AS `pinyin_raw`, 32 AS `radical_id`, '洗' AS `hanzi_char`
    UNION ALL
    SELECT '洗手间' AS `hanzi`, 'xishoujian' AS `pinyin_raw`, 85 AS `radical_id`, '洗' AS `hanzi_char`
    UNION ALL
    SELECT '洗手间' AS `hanzi`, 'xishoujian' AS `pinyin_raw`, 10 AS `radical_id`, '洗' AS `hanzi_char`
    UNION ALL
    SELECT '洗手间' AS `hanzi`, 'xishoujian' AS `pinyin_raw`, 32 AS `radical_id`, '洗' AS `hanzi_char`
    UNION ALL
    SELECT '洗手间' AS `hanzi`, 'xishoujian' AS `pinyin_raw`, 64 AS `radical_id`, '手' AS `hanzi_char`
    UNION ALL
    SELECT '洗手间' AS `hanzi`, 'xishoujian' AS `pinyin_raw`, 169 AS `radical_id`, '间' AS `hanzi_char`
    UNION ALL
    SELECT '洗手间' AS `hanzi`, 'xishoujian' AS `pinyin_raw`, 72 AS `radical_id`, '间' AS `hanzi_char`
    UNION ALL
    SELECT '喜欢' AS `hanzi`, 'xihuan' AS `pinyin_raw`, 30 AS `radical_id`, '喜' AS `hanzi_char`
    UNION ALL
    SELECT '喜欢' AS `hanzi`, 'xihuan' AS `pinyin_raw`, 33 AS `radical_id`, '喜' AS `hanzi_char`
    UNION ALL
    SELECT '喜欢' AS `hanzi`, 'xihuan' AS `pinyin_raw`, 32 AS `radical_id`, '喜' AS `hanzi_char`
    UNION ALL
    SELECT '喜欢' AS `hanzi`, 'xihuan' AS `pinyin_raw`, 76 AS `radical_id`, '欢' AS `hanzi_char`
    UNION ALL
    SELECT '喜欢' AS `hanzi`, 'xihuan' AS `pinyin_raw`, 29 AS `radical_id`, '欢' AS `hanzi_char`
    UNION ALL
    SELECT '下' AS `hanzi`, 'xia' AS `pinyin_raw`, 1 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '下' AS `hanzi`, 'xia' AS `pinyin_raw`, 25 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '下班' AS `hanzi`, 'xiaban' AS `pinyin_raw`, 1 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '下班' AS `hanzi`, 'xiaban' AS `pinyin_raw`, 25 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '下班' AS `hanzi`, 'xiaban' AS `pinyin_raw`, 96 AS `radical_id`, '班' AS `hanzi_char`
    UNION ALL
    SELECT '下班' AS `hanzi`, 'xiaban' AS `pinyin_raw`, 18 AS `radical_id`, '班' AS `hanzi_char`
    UNION ALL
    SELECT '下边' AS `hanzi`, 'xiabian' AS `pinyin_raw`, 1 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '下边' AS `hanzi`, 'xiabian' AS `pinyin_raw`, 25 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '下边' AS `hanzi`, 'xiabian' AS `pinyin_raw`, 162 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '下边' AS `hanzi`, 'xiabian' AS `pinyin_raw`, 19 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '下车' AS `hanzi`, 'xia che' AS `pinyin_raw`, 1 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '下车' AS `hanzi`, 'xia che' AS `pinyin_raw`, 25 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '下车' AS `hanzi`, 'xia che' AS `pinyin_raw`, 159 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '下车' AS `hanzi`, 'xia che' AS `pinyin_raw`, 5 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '下车' AS `hanzi`, 'xia che' AS `pinyin_raw`, 24 AS `radical_id`, '车' AS `hanzi_char`
    UNION ALL
    SELECT '下次' AS `hanzi`, 'xia ci' AS `pinyin_raw`, 1 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '下次' AS `hanzi`, 'xia ci' AS `pinyin_raw`, 25 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '下次' AS `hanzi`, 'xia ci' AS `pinyin_raw`, 76 AS `radical_id`, '次' AS `hanzi_char`
    UNION ALL
    SELECT '下次' AS `hanzi`, 'xia ci' AS `pinyin_raw`, 15 AS `radical_id`, '次' AS `hanzi_char`
    UNION ALL
    SELECT '下课' AS `hanzi`, 'xiake' AS `pinyin_raw`, 1 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '下课' AS `hanzi`, 'xiake' AS `pinyin_raw`, 25 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '下课' AS `hanzi`, 'xiake' AS `pinyin_raw`, 149 AS `radical_id`, '课' AS `hanzi_char`
    UNION ALL
    SELECT '下课' AS `hanzi`, 'xiake' AS `pinyin_raw`, 75 AS `radical_id`, '课' AS `hanzi_char`
    UNION ALL
    SELECT '下课' AS `hanzi`, 'xiake' AS `pinyin_raw`, 102 AS `radical_id`, '课' AS `hanzi_char`
    UNION ALL
    SELECT '下午' AS `hanzi`, 'xiawu' AS `pinyin_raw`, 1 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '下午' AS `hanzi`, 'xiawu' AS `pinyin_raw`, 25 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '下午' AS `hanzi`, 'xiawu' AS `pinyin_raw`, 24 AS `radical_id`, '午' AS `hanzi_char`
    UNION ALL
    SELECT '下午' AS `hanzi`, 'xiawu' AS `pinyin_raw`, 4 AS `radical_id`, '午' AS `hanzi_char`
    UNION ALL
    SELECT '下午' AS `hanzi`, 'xiawu' AS `pinyin_raw`, 51 AS `radical_id`, '午' AS `hanzi_char`
    UNION ALL
    SELECT '下雨' AS `hanzi`, 'xia yu' AS `pinyin_raw`, 1 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '下雨' AS `hanzi`, 'xia yu' AS `pinyin_raw`, 25 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '下雨' AS `hanzi`, 'xia yu' AS `pinyin_raw`, 173 AS `radical_id`, '雨' AS `hanzi_char`
    UNION ALL
    SELECT '先' AS `hanzi`, 'xian' AS `pinyin_raw`, 10 AS `radical_id`, '先' AS `hanzi_char`
    UNION ALL
    SELECT '先' AS `hanzi`, 'xian' AS `pinyin_raw`, 32 AS `radical_id`, '先' AS `hanzi_char`
    UNION ALL
    SELECT '先生' AS `hanzi`, 'xiansheng' AS `pinyin_raw`, 10 AS `radical_id`, '先' AS `hanzi_char`
    UNION ALL
    SELECT '先生' AS `hanzi`, 'xiansheng' AS `pinyin_raw`, 32 AS `radical_id`, '先' AS `hanzi_char`
    UNION ALL
    SELECT '先生' AS `hanzi`, 'xiansheng' AS `pinyin_raw`, 100 AS `radical_id`, '生' AS `hanzi_char`
    UNION ALL
    SELECT '现在' AS `hanzi`, 'xianzai' AS `pinyin_raw`, 96 AS `radical_id`, '现' AS `hanzi_char`
    UNION ALL
    SELECT '现在' AS `hanzi`, 'xianzai' AS `pinyin_raw`, 147 AS `radical_id`, '现' AS `hanzi_char`
    UNION ALL
    SELECT '现在' AS `hanzi`, 'xianzai' AS `pinyin_raw`, 32 AS `radical_id`, '在' AS `hanzi_char`
    UNION ALL
    SELECT '现在' AS `hanzi`, 'xianzai' AS `pinyin_raw`, 64 AS `radical_id`, '在' AS `hanzi_char`
    UNION ALL
    SELECT '想' AS `hanzi`, 'xiang' AS `pinyin_raw`, 61 AS `radical_id`, '想' AS `hanzi_char`
    UNION ALL
    SELECT '想' AS `hanzi`, 'xiang' AS `pinyin_raw`, 109 AS `radical_id`, '想' AS `hanzi_char`
    UNION ALL
    SELECT '想' AS `hanzi`, 'xiang' AS `pinyin_raw`, 75 AS `radical_id`, '想' AS `hanzi_char`
    UNION ALL
    SELECT '小' AS `hanzi`, 'xiao' AS `pinyin_raw`, 42 AS `radical_id`, '小' AS `hanzi_char`
    UNION ALL
    SELECT '小孩儿' AS `hanzi`, 'xiaohair' AS `pinyin_raw`, 42 AS `radical_id`, '小' AS `hanzi_char`
    UNION ALL
    SELECT '小孩儿' AS `hanzi`, 'xiaohair' AS `pinyin_raw`, 39 AS `radical_id`, '孩' AS `hanzi_char`
    UNION ALL
    SELECT '小孩儿' AS `hanzi`, 'xiaohair' AS `pinyin_raw`, 8 AS `radical_id`, '孩' AS `hanzi_char`
    UNION ALL
    SELECT '小孩儿' AS `hanzi`, 'xiaohair' AS `pinyin_raw`, 10 AS `radical_id`, '儿' AS `hanzi_char`
    UNION ALL
    SELECT '小姐' AS `hanzi`, 'xiaojie' AS `pinyin_raw`, 42 AS `radical_id`, '小' AS `hanzi_char`
    UNION ALL
    SELECT '小姐' AS `hanzi`, 'xiaojie' AS `pinyin_raw`, 38 AS `radical_id`, '姐' AS `hanzi_char`
    UNION ALL
    SELECT '小姐' AS `hanzi`, 'xiaojie' AS `pinyin_raw`, 1 AS `radical_id`, '姐' AS `hanzi_char`
    UNION ALL
    SELECT '小姐' AS `hanzi`, 'xiaojie' AS `pinyin_raw`, 74 AS `radical_id`, '姐' AS `hanzi_char`
    UNION ALL
    SELECT '小朋友' AS `hanzi`, 'xiaopengyou' AS `pinyin_raw`, 42 AS `radical_id`, '小' AS `hanzi_char`
    UNION ALL
    SELECT '小朋友' AS `hanzi`, 'xiaopengyou' AS `pinyin_raw`, 74 AS `radical_id`, '朋' AS `hanzi_char`
    UNION ALL
    SELECT '小朋友' AS `hanzi`, 'xiaopengyou' AS `pinyin_raw`, 29 AS `radical_id`, '友' AS `hanzi_char`
    UNION ALL
    SELECT '小时' AS `hanzi`, 'xiaoshi' AS `pinyin_raw`, 42 AS `radical_id`, '小' AS `hanzi_char`
    UNION ALL
    SELECT '小时' AS `hanzi`, 'xiaoshi' AS `pinyin_raw`, 72 AS `radical_id`, '时' AS `hanzi_char`
    UNION ALL
    SELECT '小时' AS `hanzi`, 'xiaoshi' AS `pinyin_raw`, 41 AS `radical_id`, '时' AS `hanzi_char`
    UNION ALL
    SELECT '小学' AS `hanzi`, 'xiaoxue' AS `pinyin_raw`, 42 AS `radical_id`, '小' AS `hanzi_char`
    UNION ALL
    SELECT '小学' AS `hanzi`, 'xiaoxue' AS `pinyin_raw`, 39 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '小学' AS `hanzi`, 'xiaoxue' AS `pinyin_raw`, 14 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '小学生' AS `hanzi`, 'xiaoxuesheng' AS `pinyin_raw`, 42 AS `radical_id`, '小' AS `hanzi_char`
    UNION ALL
    SELECT '小学生' AS `hanzi`, 'xiaoxuesheng' AS `pinyin_raw`, 39 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '小学生' AS `hanzi`, 'xiaoxuesheng' AS `pinyin_raw`, 14 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '小学生' AS `hanzi`, 'xiaoxuesheng' AS `pinyin_raw`, 100 AS `radical_id`, '生' AS `hanzi_char`
    UNION ALL
    SELECT '笑' AS `hanzi`, 'xiao' AS `pinyin_raw`, 118 AS `radical_id`, '笑' AS `hanzi_char`
    UNION ALL
    SELECT '笑' AS `hanzi`, 'xiao' AS `pinyin_raw`, 37 AS `radical_id`, '笑' AS `hanzi_char`
    UNION ALL
    SELECT '笑' AS `hanzi`, 'xiao' AS `pinyin_raw`, 4 AS `radical_id`, '笑' AS `hanzi_char`
    UNION ALL
    SELECT '写' AS `hanzi`, 'xie' AS `pinyin_raw`, 14 AS `radical_id`, '写' AS `hanzi_char`
    UNION ALL
    SELECT '写' AS `hanzi`, 'xie' AS `pinyin_raw`, 1 AS `radical_id`, '写' AS `hanzi_char`
    UNION ALL
    SELECT '谢谢' AS `hanzi`, 'xiexie' AS `pinyin_raw`, 149 AS `radical_id`, '谢' AS `hanzi_char`
    UNION ALL
    SELECT '谢谢' AS `hanzi`, 'xiexie' AS `pinyin_raw`, 41 AS `radical_id`, '谢' AS `hanzi_char`
    UNION ALL
    SELECT '谢谢' AS `hanzi`, 'xiexie' AS `pinyin_raw`, 158 AS `radical_id`, '谢' AS `hanzi_char`
    UNION ALL
    SELECT '新' AS `hanzi`, 'xin' AS `pinyin_raw`, 69 AS `radical_id`, '新' AS `hanzi_char`
    UNION ALL
    SELECT '新' AS `hanzi`, 'xin' AS `pinyin_raw`, 117 AS `radical_id`, '新' AS `hanzi_char`
    UNION ALL
    SELECT '新' AS `hanzi`, 'xin' AS `pinyin_raw`, 1 AS `radical_id`, '新' AS `hanzi_char`
    UNION ALL
    SELECT '新' AS `hanzi`, 'xin' AS `pinyin_raw`, 42 AS `radical_id`, '新' AS `hanzi_char`
    UNION ALL
    SELECT '新年' AS `hanzi`, 'xinnian' AS `pinyin_raw`, 69 AS `radical_id`, '新' AS `hanzi_char`
    UNION ALL
    SELECT '新年' AS `hanzi`, 'xinnian' AS `pinyin_raw`, 117 AS `radical_id`, '新' AS `hanzi_char`
    UNION ALL
    SELECT '新年' AS `hanzi`, 'xinnian' AS `pinyin_raw`, 1 AS `radical_id`, '新' AS `hanzi_char`
    UNION ALL
    SELECT '新年' AS `hanzi`, 'xinnian' AS `pinyin_raw`, 42 AS `radical_id`, '新' AS `hanzi_char`
    UNION ALL
    SELECT '新年' AS `hanzi`, 'xinnian' AS `pinyin_raw`, 51 AS `radical_id`, '年' AS `hanzi_char`
    UNION ALL
    SELECT '星期' AS `hanzi`, 'xingqi' AS `pinyin_raw`, 72 AS `radical_id`, '星' AS `hanzi_char`
    UNION ALL
    SELECT '星期' AS `hanzi`, 'xingqi' AS `pinyin_raw`, 100 AS `radical_id`, '星' AS `hanzi_char`
    UNION ALL
    SELECT '星期' AS `hanzi`, 'xingqi' AS `pinyin_raw`, 74 AS `radical_id`, '期' AS `hanzi_char`
    UNION ALL
    SELECT '星期' AS `hanzi`, 'xingqi' AS `pinyin_raw`, 12 AS `radical_id`, '期' AS `hanzi_char`
    UNION ALL
    SELECT '星期' AS `hanzi`, 'xingqi' AS `pinyin_raw`, 99 AS `radical_id`, '期' AS `hanzi_char`
    UNION ALL
    SELECT '星期' AS `hanzi`, 'xingqi' AS `pinyin_raw`, 1 AS `radical_id`, '期' AS `hanzi_char`
    UNION ALL
    SELECT '星期日' AS `hanzi`, 'xingqiri' AS `pinyin_raw`, 72 AS `radical_id`, '星' AS `hanzi_char`
    UNION ALL
    SELECT '星期日' AS `hanzi`, 'xingqiri' AS `pinyin_raw`, 100 AS `radical_id`, '星' AS `hanzi_char`
    UNION ALL
    SELECT '星期日' AS `hanzi`, 'xingqiri' AS `pinyin_raw`, 74 AS `radical_id`, '期' AS `hanzi_char`
    UNION ALL
    SELECT '星期日' AS `hanzi`, 'xingqiri' AS `pinyin_raw`, 12 AS `radical_id`, '期' AS `hanzi_char`
    UNION ALL
    SELECT '星期日' AS `hanzi`, 'xingqiri' AS `pinyin_raw`, 99 AS `radical_id`, '期' AS `hanzi_char`
    UNION ALL
    SELECT '星期日' AS `hanzi`, 'xingqiri' AS `pinyin_raw`, 1 AS `radical_id`, '期' AS `hanzi_char`
    UNION ALL
    SELECT '星期天' AS `hanzi`, 'xingqitian' AS `pinyin_raw`, 72 AS `radical_id`, '星' AS `hanzi_char`
    UNION ALL
    SELECT '星期天' AS `hanzi`, 'xingqitian' AS `pinyin_raw`, 100 AS `radical_id`, '星' AS `hanzi_char`
    UNION ALL
    SELECT '星期天' AS `hanzi`, 'xingqitian' AS `pinyin_raw`, 74 AS `radical_id`, '期' AS `hanzi_char`
    UNION ALL
    SELECT '星期天' AS `hanzi`, 'xingqitian' AS `pinyin_raw`, 12 AS `radical_id`, '期' AS `hanzi_char`
    UNION ALL
    SELECT '星期天' AS `hanzi`, 'xingqitian' AS `pinyin_raw`, 99 AS `radical_id`, '期' AS `hanzi_char`
    UNION ALL
    SELECT '星期天' AS `hanzi`, 'xingqitian' AS `pinyin_raw`, 1 AS `radical_id`, '期' AS `hanzi_char`
    UNION ALL
    SELECT '星期天' AS `hanzi`, 'xingqitian' AS `pinyin_raw`, 37 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '行' AS `hanzi`, 'xing' AS `pinyin_raw`, 144 AS `radical_id`, '行' AS `hanzi_char`
    UNION ALL
    SELECT '休息' AS `hanzi`, 'xiuxi' AS `pinyin_raw`, 9 AS `radical_id`, '休' AS `hanzi_char`
    UNION ALL
    SELECT '休息' AS `hanzi`, 'xiuxi' AS `pinyin_raw`, 75 AS `radical_id`, '休' AS `hanzi_char`
    UNION ALL
    SELECT '休息' AS `hanzi`, 'xiuxi' AS `pinyin_raw`, 61 AS `radical_id`, '息' AS `hanzi_char`
    UNION ALL
    SELECT '休息' AS `hanzi`, 'xiuxi' AS `pinyin_raw`, 132 AS `radical_id`, '息' AS `hanzi_char`
    UNION ALL
    SELECT '学' AS `hanzi`, 'xue' AS `pinyin_raw`, 39 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '学' AS `hanzi`, 'xue' AS `pinyin_raw`, 42 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '学' AS `hanzi`, 'xue' AS `pinyin_raw`, 14 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '学生' AS `hanzi`, 'xuesheng' AS `pinyin_raw`, 39 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '学生' AS `hanzi`, 'xuesheng' AS `pinyin_raw`, 42 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '学生' AS `hanzi`, 'xuesheng' AS `pinyin_raw`, 14 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '学生' AS `hanzi`, 'xuesheng' AS `pinyin_raw`, 100 AS `radical_id`, '生' AS `hanzi_char`
    UNION ALL
    SELECT '学习' AS `hanzi`, 'xuexi' AS `pinyin_raw`, 39 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '学习' AS `hanzi`, 'xuexi' AS `pinyin_raw`, 42 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '学习' AS `hanzi`, 'xuexi' AS `pinyin_raw`, 14 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '学习' AS `hanzi`, 'xuexi' AS `pinyin_raw`, 15 AS `radical_id`, '习' AS `hanzi_char`
    UNION ALL
    SELECT '学校' AS `hanzi`, 'xuexiao' AS `pinyin_raw`, 39 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '学校' AS `hanzi`, 'xuexiao' AS `pinyin_raw`, 42 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '学校' AS `hanzi`, 'xuexiao' AS `pinyin_raw`, 14 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '学校' AS `hanzi`, 'xuexiao' AS `pinyin_raw`, 75 AS `radical_id`, '校' AS `hanzi_char`
    UNION ALL
    SELECT '学校' AS `hanzi`, 'xuexiao' AS `pinyin_raw`, 8 AS `radical_id`, '校' AS `hanzi_char`
    UNION ALL
    SELECT '学院' AS `hanzi`, 'xueyuan' AS `pinyin_raw`, 39 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '学院' AS `hanzi`, 'xueyuan' AS `pinyin_raw`, 42 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '学院' AS `hanzi`, 'xueyuan' AS `pinyin_raw`, 14 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '学院' AS `hanzi`, 'xueyuan' AS `pinyin_raw`, 170 AS `radical_id`, '院' AS `hanzi_char`
    UNION ALL
    SELECT '学院' AS `hanzi`, 'xueyuan' AS `pinyin_raw`, 40 AS `radical_id`, '院' AS `hanzi_char`
    UNION ALL
    SELECT '要' AS `hanzi`, 'yao' AS `pinyin_raw`, 146 AS `radical_id`, '要' AS `hanzi_char`
    UNION ALL
    SELECT '要' AS `hanzi`, 'yao' AS `pinyin_raw`, 38 AS `radical_id`, '要' AS `hanzi_char`
    UNION ALL
    SELECT '爷爷' AS `hanzi`, 'yeye' AS `pinyin_raw`, 88 AS `radical_id`, '爷' AS `hanzi_char`
    UNION ALL
    SELECT '爷爷' AS `hanzi`, 'yeye' AS `pinyin_raw`, 26 AS `radical_id`, '爷' AS `hanzi_char`
    UNION ALL
    SELECT '也' AS `hanzi`, 'ye' AS `pinyin_raw`, 5 AS `radical_id`, '也' AS `hanzi_char`
    UNION ALL
    SELECT '页' AS `hanzi`, 'ye' AS `pinyin_raw`, 181 AS `radical_id`, '页' AS `hanzi_char`
    UNION ALL
    SELECT '页' AS `hanzi`, 'ye' AS `pinyin_raw`, 154 AS `radical_id`, '页' AS `hanzi_char`
    UNION ALL
    SELECT '一' AS `hanzi`, 'yi' AS `pinyin_raw`, 1 AS `radical_id`, '一' AS `hanzi_char`
    UNION ALL
    SELECT '衣服' AS `hanzi`, 'yifu' AS `pinyin_raw`, 145 AS `radical_id`, '衣' AS `hanzi_char`
    UNION ALL
    SELECT '衣服' AS `hanzi`, 'yifu' AS `pinyin_raw`, 74 AS `radical_id`, '服' AS `hanzi_char`
    UNION ALL
    SELECT '衣服' AS `hanzi`, 'yifu' AS `pinyin_raw`, 26 AS `radical_id`, '服' AS `hanzi_char`
    UNION ALL
    SELECT '衣服' AS `hanzi`, 'yifu' AS `pinyin_raw`, 29 AS `radical_id`, '服' AS `hanzi_char`
    UNION ALL
    SELECT '医生' AS `hanzi`, 'yisheng' AS `pinyin_raw`, 23 AS `radical_id`, '医' AS `hanzi_char`
    UNION ALL
    SELECT '医生' AS `hanzi`, 'yisheng' AS `pinyin_raw`, 111 AS `radical_id`, '医' AS `hanzi_char`
    UNION ALL
    SELECT '医生' AS `hanzi`, 'yisheng' AS `pinyin_raw`, 100 AS `radical_id`, '生' AS `hanzi_char`
    UNION ALL
    SELECT '医院' AS `hanzi`, 'yiyuan' AS `pinyin_raw`, 23 AS `radical_id`, '医' AS `hanzi_char`
    UNION ALL
    SELECT '医院' AS `hanzi`, 'yiyuan' AS `pinyin_raw`, 111 AS `radical_id`, '医' AS `hanzi_char`
    UNION ALL
    SELECT '医院' AS `hanzi`, 'yiyuan' AS `pinyin_raw`, 170 AS `radical_id`, '院' AS `hanzi_char`
    UNION ALL
    SELECT '医院' AS `hanzi`, 'yiyuan' AS `pinyin_raw`, 40 AS `radical_id`, '院' AS `hanzi_char`
    UNION ALL
    SELECT '一半' AS `hanzi`, 'yiban' AS `pinyin_raw`, 1 AS `radical_id`, '一' AS `hanzi_char`
    UNION ALL
    SELECT '一半' AS `hanzi`, 'yiban' AS `pinyin_raw`, 24 AS `radical_id`, '半' AS `hanzi_char`
    UNION ALL
    SELECT '一半' AS `hanzi`, 'yiban' AS `pinyin_raw`, 12 AS `radical_id`, '半' AS `hanzi_char`
    UNION ALL
    SELECT '一半' AS `hanzi`, 'yiban' AS `pinyin_raw`, 93 AS `radical_id`, '半' AS `hanzi_char`
    UNION ALL
    SELECT '一会儿' AS `hanzi`, 'yihuir' AS `pinyin_raw`, 1 AS `radical_id`, '一' AS `hanzi_char`
    UNION ALL
    SELECT '一会儿' AS `hanzi`, 'yihuir' AS `pinyin_raw`, 9 AS `radical_id`, '会' AS `hanzi_char`
    UNION ALL
    SELECT '一会儿' AS `hanzi`, 'yihuir' AS `pinyin_raw`, 7 AS `radical_id`, '会' AS `hanzi_char`
    UNION ALL
    SELECT '一会儿' AS `hanzi`, 'yihuir' AS `pinyin_raw`, 28 AS `radical_id`, '会' AS `hanzi_char`
    UNION ALL
    SELECT '一会儿' AS `hanzi`, 'yihuir' AS `pinyin_raw`, 10 AS `radical_id`, '儿' AS `hanzi_char`
    UNION ALL
    SELECT '一块儿' AS `hanzi`, 'yikuair' AS `pinyin_raw`, 1 AS `radical_id`, '一' AS `hanzi_char`
    UNION ALL
    SELECT '一块儿' AS `hanzi`, 'yikuair' AS `pinyin_raw`, 32 AS `radical_id`, '块' AS `hanzi_char`
    UNION ALL
    SELECT '一块儿' AS `hanzi`, 'yikuair' AS `pinyin_raw`, 37 AS `radical_id`, '块' AS `hanzi_char`
    UNION ALL
    SELECT '一块儿' AS `hanzi`, 'yikuair' AS `pinyin_raw`, 10 AS `radical_id`, '儿' AS `hanzi_char`
    UNION ALL
    SELECT '一下儿' AS `hanzi`, 'yixiar' AS `pinyin_raw`, 1 AS `radical_id`, '一' AS `hanzi_char`
    UNION ALL
    SELECT '一下儿' AS `hanzi`, 'yixiar' AS `pinyin_raw`, 25 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '一下儿' AS `hanzi`, 'yixiar' AS `pinyin_raw`, 10 AS `radical_id`, '儿' AS `hanzi_char`
    UNION ALL
    SELECT '一样' AS `hanzi`, 'yiyang' AS `pinyin_raw`, 1 AS `radical_id`, '一' AS `hanzi_char`
    UNION ALL
    SELECT '一样' AS `hanzi`, 'yiyang' AS `pinyin_raw`, 75 AS `radical_id`, '样' AS `hanzi_char`
    UNION ALL
    SELECT '一样' AS `hanzi`, 'yiyang' AS `pinyin_raw`, 123 AS `radical_id`, '样' AS `hanzi_char`
    UNION ALL
    SELECT '一边' AS `hanzi`, 'yibian' AS `pinyin_raw`, 1 AS `radical_id`, '一' AS `hanzi_char`
    UNION ALL
    SELECT '一边' AS `hanzi`, 'yibian' AS `pinyin_raw`, 162 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '一边' AS `hanzi`, 'yibian' AS `pinyin_raw`, 19 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '一点儿' AS `hanzi`, 'yidianr' AS `pinyin_raw`, 1 AS `radical_id`, '一' AS `hanzi_char`
    UNION ALL
    SELECT '一点儿' AS `hanzi`, 'yidianr' AS `pinyin_raw`, 86 AS `radical_id`, '点' AS `hanzi_char`
    UNION ALL
    SELECT '一点儿' AS `hanzi`, 'yidianr' AS `pinyin_raw`, 25 AS `radical_id`, '点' AS `hanzi_char`
    UNION ALL
    SELECT '一点儿' AS `hanzi`, 'yidianr' AS `pinyin_raw`, 30 AS `radical_id`, '点' AS `hanzi_char`
    UNION ALL
    SELECT '一点儿' AS `hanzi`, 'yidianr' AS `pinyin_raw`, 10 AS `radical_id`, '儿' AS `hanzi_char`
    UNION ALL
    SELECT '一起' AS `hanzi`, 'yiqi' AS `pinyin_raw`, 1 AS `radical_id`, '一' AS `hanzi_char`
    UNION ALL
    SELECT '一起' AS `hanzi`, 'yiqi' AS `pinyin_raw`, 156 AS `radical_id`, '起' AS `hanzi_char`
    UNION ALL
    SELECT '一起' AS `hanzi`, 'yiqi' AS `pinyin_raw`, 49 AS `radical_id`, '起' AS `hanzi_char`
    UNION ALL
    SELECT '一些' AS `hanzi`, 'yixie' AS `pinyin_raw`, 1 AS `radical_id`, '一' AS `hanzi_char`
    UNION ALL
    SELECT '一些' AS `hanzi`, 'yixie' AS `pinyin_raw`, 7 AS `radical_id`, '些' AS `hanzi_char`
    UNION ALL
    SELECT '一些' AS `hanzi`, 'yixie' AS `pinyin_raw`, 77 AS `radical_id`, '些' AS `hanzi_char`
    UNION ALL
    SELECT '一些' AS `hanzi`, 'yixie' AS `pinyin_raw`, 21 AS `radical_id`, '些' AS `hanzi_char`
    UNION ALL
    SELECT '用' AS `hanzi`, 'yong' AS `pinyin_raw`, 101 AS `radical_id`, '用' AS `hanzi_char`
    UNION ALL
    SELECT '有' AS `hanzi`, 'you' AS `pinyin_raw`, 74 AS `radical_id`, '有' AS `hanzi_char`
    UNION ALL
    SELECT '有的' AS `hanzi`, 'youde' AS `pinyin_raw`, 74 AS `radical_id`, '有' AS `hanzi_char`
    UNION ALL
    SELECT '有的' AS `hanzi`, 'youde' AS `pinyin_raw`, 106 AS `radical_id`, '的' AS `hanzi_char`
    UNION ALL
    SELECT '有的' AS `hanzi`, 'youde' AS `pinyin_raw`, 20 AS `radical_id`, '的' AS `hanzi_char`
    UNION ALL
    SELECT '有的' AS `hanzi`, 'youde' AS `pinyin_raw`, 3 AS `radical_id`, '的' AS `hanzi_char`
    UNION ALL
    SELECT '有名' AS `hanzi`, 'youming' AS `pinyin_raw`, 74 AS `radical_id`, '有' AS `hanzi_char`
    UNION ALL
    SELECT '有名' AS `hanzi`, 'youming' AS `pinyin_raw`, 30 AS `radical_id`, '名' AS `hanzi_char`
    UNION ALL
    SELECT '有名' AS `hanzi`, 'youming' AS `pinyin_raw`, 36 AS `radical_id`, '名' AS `hanzi_char`
    UNION ALL
    SELECT '有时候' AS `hanzi`, 'youshihou' AS `pinyin_raw`, 74 AS `radical_id`, '有' AS `hanzi_char`
    UNION ALL
    SELECT '有时候' AS `hanzi`, 'youshihou' AS `pinyin_raw`, 72 AS `radical_id`, '时' AS `hanzi_char`
    UNION ALL
    SELECT '有时候' AS `hanzi`, 'youshihou' AS `pinyin_raw`, 41 AS `radical_id`, '时' AS `hanzi_char`
    UNION ALL
    SELECT '有时候' AS `hanzi`, 'youshihou' AS `pinyin_raw`, 9 AS `radical_id`, '候' AS `hanzi_char`
    UNION ALL
    SELECT '有时候' AS `hanzi`, 'youshihou' AS `pinyin_raw`, 111 AS `radical_id`, '候' AS `hanzi_char`
    UNION ALL
    SELECT '有些' AS `hanzi`, 'you(yi)xie' AS `pinyin_raw`, 74 AS `radical_id`, '有' AS `hanzi_char`
    UNION ALL
    SELECT '有些' AS `hanzi`, 'you(yi)xie' AS `pinyin_raw`, 7 AS `radical_id`, '些' AS `hanzi_char`
    UNION ALL
    SELECT '有些' AS `hanzi`, 'you(yi)xie' AS `pinyin_raw`, 77 AS `radical_id`, '些' AS `hanzi_char`
    UNION ALL
    SELECT '有些' AS `hanzi`, 'you(yi)xie' AS `pinyin_raw`, 21 AS `radical_id`, '些' AS `hanzi_char`
    UNION ALL
    SELECT '有用' AS `hanzi`, 'youyong' AS `pinyin_raw`, 74 AS `radical_id`, '有' AS `hanzi_char`
    UNION ALL
    SELECT '有用' AS `hanzi`, 'youyong' AS `pinyin_raw`, 101 AS `radical_id`, '用' AS `hanzi_char`
    UNION ALL
    SELECT '右' AS `hanzi`, 'you' AS `pinyin_raw`, 30 AS `radical_id`, '右' AS `hanzi_char`
    UNION ALL
    SELECT '右边' AS `hanzi`, 'youbian' AS `pinyin_raw`, 30 AS `radical_id`, '右' AS `hanzi_char`
    UNION ALL
    SELECT '右边' AS `hanzi`, 'youbian' AS `pinyin_raw`, 162 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '右边' AS `hanzi`, 'youbian' AS `pinyin_raw`, 19 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '雨' AS `hanzi`, 'yu' AS `pinyin_raw`, 173 AS `radical_id`, '雨' AS `hanzi_char`
    UNION ALL
    SELECT '元' AS `hanzi`, 'yuan' AS `pinyin_raw`, 10 AS `radical_id`, '元' AS `hanzi_char`
    UNION ALL
    SELECT '元' AS `hanzi`, 'yuan' AS `pinyin_raw`, 7 AS `radical_id`, '元' AS `hanzi_char`
    UNION ALL
    SELECT '远' AS `hanzi`, 'yuan' AS `pinyin_raw`, 162 AS `radical_id`, '远' AS `hanzi_char`
    UNION ALL
    SELECT '远' AS `hanzi`, 'yuan' AS `pinyin_raw`, 10 AS `radical_id`, '远' AS `hanzi_char`
    UNION ALL
    SELECT '远' AS `hanzi`, 'yuan' AS `pinyin_raw`, 7 AS `radical_id`, '远' AS `hanzi_char`
    UNION ALL
    SELECT '月' AS `hanzi`, 'yue' AS `pinyin_raw`, 74 AS `radical_id`, '月' AS `hanzi_char`
    UNION ALL
    SELECT '再' AS `hanzi`, 'zai' AS `pinyin_raw`, 13 AS `radical_id`, '再' AS `hanzi_char`
    UNION ALL
    SELECT '再' AS `hanzi`, 'zai' AS `pinyin_raw`, 1 AS `radical_id`, '再' AS `hanzi_char`
    UNION ALL
    SELECT '再' AS `hanzi`, 'zai' AS `pinyin_raw`, 32 AS `radical_id`, '再' AS `hanzi_char`
    UNION ALL
    SELECT '再见' AS `hanzi`, 'zaijian' AS `pinyin_raw`, 13 AS `radical_id`, '再' AS `hanzi_char`
    UNION ALL
    SELECT '再见' AS `hanzi`, 'zaijian' AS `pinyin_raw`, 1 AS `radical_id`, '再' AS `hanzi_char`
    UNION ALL
    SELECT '再见' AS `hanzi`, 'zaijian' AS `pinyin_raw`, 32 AS `radical_id`, '再' AS `hanzi_char`
    UNION ALL
    SELECT '再见' AS `hanzi`, 'zaijian' AS `pinyin_raw`, 147 AS `radical_id`, '见' AS `hanzi_char`
    UNION ALL
    SELECT '再见' AS `hanzi`, 'zaijian' AS `pinyin_raw`, 10 AS `radical_id`, '见' AS `hanzi_char`
    UNION ALL
    SELECT '在' AS `hanzi`, 'zai' AS `pinyin_raw`, 32 AS `radical_id`, '在' AS `hanzi_char`
    UNION ALL
    SELECT '在' AS `hanzi`, 'zai' AS `pinyin_raw`, 64 AS `radical_id`, '在' AS `hanzi_char`
    UNION ALL
    SELECT '在家' AS `hanzi`, 'zaijia' AS `pinyin_raw`, 32 AS `radical_id`, '在' AS `hanzi_char`
    UNION ALL
    SELECT '在家' AS `hanzi`, 'zaijia' AS `pinyin_raw`, 64 AS `radical_id`, '在' AS `hanzi_char`
    UNION ALL
    SELECT '在家' AS `hanzi`, 'zaijia' AS `pinyin_raw`, 40 AS `radical_id`, '家' AS `hanzi_char`
    UNION ALL
    SELECT '在家' AS `hanzi`, 'zaijia' AS `pinyin_raw`, 152 AS `radical_id`, '家' AS `hanzi_char`
    UNION ALL
    SELECT '早' AS `hanzi`, 'zao' AS `pinyin_raw`, 72 AS `radical_id`, '早' AS `hanzi_char`
    UNION ALL
    SELECT '早' AS `hanzi`, 'zao' AS `pinyin_raw`, 24 AS `radical_id`, '早' AS `hanzi_char`
    UNION ALL
    SELECT '早饭' AS `hanzi`, 'zaofan' AS `pinyin_raw`, 72 AS `radical_id`, '早' AS `hanzi_char`
    UNION ALL
    SELECT '早饭' AS `hanzi`, 'zaofan' AS `pinyin_raw`, 24 AS `radical_id`, '早' AS `hanzi_char`
    UNION ALL
    SELECT '早饭' AS `hanzi`, 'zaofan' AS `pinyin_raw`, 184 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '早饭' AS `hanzi`, 'zaofan' AS `pinyin_raw`, 29 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '早饭' AS `hanzi`, 'zaofan' AS `pinyin_raw`, 27 AS `radical_id`, '饭' AS `hanzi_char`
    UNION ALL
    SELECT '早上' AS `hanzi`, 'zaoshang' AS `pinyin_raw`, 72 AS `radical_id`, '早' AS `hanzi_char`
    UNION ALL
    SELECT '早上' AS `hanzi`, 'zaoshang' AS `pinyin_raw`, 24 AS `radical_id`, '早' AS `hanzi_char`
    UNION ALL
    SELECT '早上' AS `hanzi`, 'zaoshang' AS `pinyin_raw`, 1 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '早上' AS `hanzi`, 'zaoshang' AS `pinyin_raw`, 25 AS `radical_id`, '上' AS `hanzi_char`
    UNION ALL
    SELECT '怎么' AS `hanzi`, 'zenme' AS `pinyin_raw`, 61 AS `radical_id`, '怎' AS `hanzi_char`
    UNION ALL
    SELECT '怎么' AS `hanzi`, 'zenme' AS `pinyin_raw`, 4 AS `radical_id`, '怎' AS `hanzi_char`
    UNION ALL
    SELECT '怎么' AS `hanzi`, 'zenme' AS `pinyin_raw`, 1 AS `radical_id`, '怎' AS `hanzi_char`
    UNION ALL
    SELECT '怎么' AS `hanzi`, 'zenme' AS `pinyin_raw`, 28 AS `radical_id`, '么' AS `hanzi_char`
    UNION ALL
    SELECT '站' AS `hanzi`, 'zhan' AS `pinyin_raw`, 117 AS `radical_id`, '站' AS `hanzi_char`
    UNION ALL
    SELECT '站' AS `hanzi`, 'zhan' AS `pinyin_raw`, 25 AS `radical_id`, '站' AS `hanzi_char`
    UNION ALL
    SELECT '站' AS `hanzi`, 'zhan' AS `pinyin_raw`, 30 AS `radical_id`, '站' AS `hanzi_char`
    UNION ALL
    SELECT '找' AS `hanzi`, 'zhao' AS `pinyin_raw`, 64 AS `radical_id`, '找' AS `hanzi_char`
    UNION ALL
    SELECT '找' AS `hanzi`, 'zhao' AS `pinyin_raw`, 62 AS `radical_id`, '找' AS `hanzi_char`
    UNION ALL
    SELECT '找到' AS `hanzi`, 'zhaodao' AS `pinyin_raw`, 64 AS `radical_id`, '找' AS `hanzi_char`
    UNION ALL
    SELECT '找到' AS `hanzi`, 'zhaodao' AS `pinyin_raw`, 62 AS `radical_id`, '找' AS `hanzi_char`
    UNION ALL
    SELECT '找到' AS `hanzi`, 'zhaodao' AS `pinyin_raw`, 18 AS `radical_id`, '到' AS `hanzi_char`
    UNION ALL
    SELECT '找到' AS `hanzi`, 'zhaodao' AS `pinyin_raw`, 133 AS `radical_id`, '到' AS `hanzi_char`
    UNION ALL
    SELECT '这' AS `hanzi`, 'zhe' AS `pinyin_raw`, 162 AS `radical_id`, '这' AS `hanzi_char`
    UNION ALL
    SELECT '这' AS `hanzi`, 'zhe' AS `pinyin_raw`, 67 AS `radical_id`, '这' AS `hanzi_char`
    UNION ALL
    SELECT '这边' AS `hanzi`, 'zhebian' AS `pinyin_raw`, 162 AS `radical_id`, '这' AS `hanzi_char`
    UNION ALL
    SELECT '这边' AS `hanzi`, 'zhebian' AS `pinyin_raw`, 67 AS `radical_id`, '这' AS `hanzi_char`
    UNION ALL
    SELECT '这边' AS `hanzi`, 'zhebian' AS `pinyin_raw`, 19 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '这里' AS `hanzi`, 'zheli' AS `pinyin_raw`, 162 AS `radical_id`, '这' AS `hanzi_char`
    UNION ALL
    SELECT '这里' AS `hanzi`, 'zheli' AS `pinyin_raw`, 67 AS `radical_id`, '这' AS `hanzi_char`
    UNION ALL
    SELECT '这里' AS `hanzi`, 'zheli' AS `pinyin_raw`, 166 AS `radical_id`, '里' AS `hanzi_char`
    UNION ALL
    SELECT '这儿' AS `hanzi`, 'zher' AS `pinyin_raw`, 162 AS `radical_id`, '这' AS `hanzi_char`
    UNION ALL
    SELECT '这儿' AS `hanzi`, 'zher' AS `pinyin_raw`, 67 AS `radical_id`, '这' AS `hanzi_char`
    UNION ALL
    SELECT '这儿' AS `hanzi`, 'zher' AS `pinyin_raw`, 10 AS `radical_id`, '儿' AS `hanzi_char`
    UNION ALL
    SELECT '这些' AS `hanzi`, 'zhexie' AS `pinyin_raw`, 162 AS `radical_id`, '这' AS `hanzi_char`
    UNION ALL
    SELECT '这些' AS `hanzi`, 'zhexie' AS `pinyin_raw`, 67 AS `radical_id`, '这' AS `hanzi_char`
    UNION ALL
    SELECT '这些' AS `hanzi`, 'zhexie' AS `pinyin_raw`, 7 AS `radical_id`, '些' AS `hanzi_char`
    UNION ALL
    SELECT '这些' AS `hanzi`, 'zhexie' AS `pinyin_raw`, 77 AS `radical_id`, '些' AS `hanzi_char`
    UNION ALL
    SELECT '这些' AS `hanzi`, 'zhexie' AS `pinyin_raw`, 21 AS `radical_id`, '些' AS `hanzi_char`
    UNION ALL
    SELECT '着' AS `hanzi`, 'zhe' AS `pinyin_raw`, 109 AS `radical_id`, '着' AS `hanzi_char`
    UNION ALL
    SELECT '着' AS `hanzi`, 'zhe' AS `pinyin_raw`, 123 AS `radical_id`, '着' AS `hanzi_char`
    UNION ALL
    SELECT '真' AS `hanzi`, 'zhen' AS `pinyin_raw`, 109 AS `radical_id`, '真' AS `hanzi_char`
    UNION ALL
    SELECT '真' AS `hanzi`, 'zhen' AS `pinyin_raw`, 24 AS `radical_id`, '真' AS `hanzi_char`
    UNION ALL
    SELECT '真' AS `hanzi`, 'zhen' AS `pinyin_raw`, 1 AS `radical_id`, '真' AS `hanzi_char`
    UNION ALL
    SELECT '真' AS `hanzi`, 'zhen' AS `pinyin_raw`, 16 AS `radical_id`, '真' AS `hanzi_char`
    UNION ALL
    SELECT '真的' AS `hanzi`, 'zhen de' AS `pinyin_raw`, 109 AS `radical_id`, '真' AS `hanzi_char`
    UNION ALL
    SELECT '真的' AS `hanzi`, 'zhen de' AS `pinyin_raw`, 24 AS `radical_id`, '真' AS `hanzi_char`
    UNION ALL
    SELECT '真的' AS `hanzi`, 'zhen de' AS `pinyin_raw`, 1 AS `radical_id`, '真' AS `hanzi_char`
    UNION ALL
    SELECT '真的' AS `hanzi`, 'zhen de' AS `pinyin_raw`, 16 AS `radical_id`, '真' AS `hanzi_char`
    UNION ALL
    SELECT '真的' AS `hanzi`, 'zhen de' AS `pinyin_raw`, 106 AS `radical_id`, '的' AS `hanzi_char`
    UNION ALL
    SELECT '真的' AS `hanzi`, 'zhen de' AS `pinyin_raw`, 20 AS `radical_id`, '的' AS `hanzi_char`
    UNION ALL
    SELECT '真的' AS `hanzi`, 'zhen de' AS `pinyin_raw`, 3 AS `radical_id`, '的' AS `hanzi_char`
    UNION ALL
    SELECT '正' AS `hanzi`, 'zheng' AS `pinyin_raw`, 77 AS `radical_id`, '正' AS `hanzi_char`
    UNION ALL
    SELECT '正' AS `hanzi`, 'zheng' AS `pinyin_raw`, 1 AS `radical_id`, '正' AS `hanzi_char`
    UNION ALL
    SELECT '正在' AS `hanzi`, 'zhengzai' AS `pinyin_raw`, 77 AS `radical_id`, '正' AS `hanzi_char`
    UNION ALL
    SELECT '正在' AS `hanzi`, 'zhengzai' AS `pinyin_raw`, 1 AS `radical_id`, '正' AS `hanzi_char`
    UNION ALL
    SELECT '正在' AS `hanzi`, 'zhengzai' AS `pinyin_raw`, 32 AS `radical_id`, '在' AS `hanzi_char`
    UNION ALL
    SELECT '正在' AS `hanzi`, 'zhengzai' AS `pinyin_raw`, 64 AS `radical_id`, '在' AS `hanzi_char`
    UNION ALL
    SELECT '知道' AS `hanzi`, 'zhidao' AS `pinyin_raw`, 111 AS `radical_id`, '知' AS `hanzi_char`
    UNION ALL
    SELECT '知道' AS `hanzi`, 'zhidao' AS `pinyin_raw`, 30 AS `radical_id`, '知' AS `hanzi_char`
    UNION ALL
    SELECT '知道' AS `hanzi`, 'zhidao' AS `pinyin_raw`, 162 AS `radical_id`, '道' AS `hanzi_char`
    UNION ALL
    SELECT '知道' AS `hanzi`, 'zhidao' AS `pinyin_raw`, 185 AS `radical_id`, '道' AS `hanzi_char`
    UNION ALL
    SELECT '知识' AS `hanzi`, 'zhishi' AS `pinyin_raw`, 111 AS `radical_id`, '知' AS `hanzi_char`
    UNION ALL
    SELECT '知识' AS `hanzi`, 'zhishi' AS `pinyin_raw`, 30 AS `radical_id`, '知' AS `hanzi_char`
    UNION ALL
    SELECT '知识' AS `hanzi`, 'zhishi' AS `pinyin_raw`, 149 AS `radical_id`, '识' AS `hanzi_char`
    UNION ALL
    SELECT '知识' AS `hanzi`, 'zhishi' AS `pinyin_raw`, 12 AS `radical_id`, '识' AS `hanzi_char`
    UNION ALL
    SELECT '中' AS `hanzi`, 'zhong' AS `pinyin_raw`, 2 AS `radical_id`, '中' AS `hanzi_char`
    UNION ALL
    SELECT '中' AS `hanzi`, 'zhong' AS `pinyin_raw`, 30 AS `radical_id`, '中' AS `hanzi_char`
    UNION ALL
    SELECT '中国' AS `hanzi`, 'zhongguo' AS `pinyin_raw`, 2 AS `radical_id`, '中' AS `hanzi_char`
    UNION ALL
    SELECT '中国' AS `hanzi`, 'zhongguo' AS `pinyin_raw`, 30 AS `radical_id`, '中' AS `hanzi_char`
    UNION ALL
    SELECT '中国' AS `hanzi`, 'zhongguo' AS `pinyin_raw`, 31 AS `radical_id`, '国' AS `hanzi_char`
    UNION ALL
    SELECT '中国' AS `hanzi`, 'zhongguo' AS `pinyin_raw`, 96 AS `radical_id`, '国' AS `hanzi_char`
    UNION ALL
    SELECT '中间' AS `hanzi`, 'zhongjian' AS `pinyin_raw`, 2 AS `radical_id`, '中' AS `hanzi_char`
    UNION ALL
    SELECT '中间' AS `hanzi`, 'zhongjian' AS `pinyin_raw`, 30 AS `radical_id`, '中' AS `hanzi_char`
    UNION ALL
    SELECT '中间' AS `hanzi`, 'zhongjian' AS `pinyin_raw`, 169 AS `radical_id`, '间' AS `hanzi_char`
    UNION ALL
    SELECT '中间' AS `hanzi`, 'zhongjian' AS `pinyin_raw`, 72 AS `radical_id`, '间' AS `hanzi_char`
    UNION ALL
    SELECT '中文' AS `hanzi`, 'zhongwen' AS `pinyin_raw`, 2 AS `radical_id`, '中' AS `hanzi_char`
    UNION ALL
    SELECT '中文' AS `hanzi`, 'zhongwen' AS `pinyin_raw`, 30 AS `radical_id`, '中' AS `hanzi_char`
    UNION ALL
    SELECT '中文' AS `hanzi`, 'zhongwen' AS `pinyin_raw`, 67 AS `radical_id`, '文' AS `hanzi_char`
    UNION ALL
    SELECT '中午' AS `hanzi`, 'zhongwu' AS `pinyin_raw`, 2 AS `radical_id`, '中' AS `hanzi_char`
    UNION ALL
    SELECT '中午' AS `hanzi`, 'zhongwu' AS `pinyin_raw`, 30 AS `radical_id`, '中' AS `hanzi_char`
    UNION ALL
    SELECT '中午' AS `hanzi`, 'zhongwu' AS `pinyin_raw`, 24 AS `radical_id`, '午' AS `hanzi_char`
    UNION ALL
    SELECT '中午' AS `hanzi`, 'zhongwu' AS `pinyin_raw`, 4 AS `radical_id`, '午' AS `hanzi_char`
    UNION ALL
    SELECT '中午' AS `hanzi`, 'zhongwu' AS `pinyin_raw`, 51 AS `radical_id`, '午' AS `hanzi_char`
    UNION ALL
    SELECT '中学' AS `hanzi`, 'zhongxue' AS `pinyin_raw`, 2 AS `radical_id`, '中' AS `hanzi_char`
    UNION ALL
    SELECT '中学' AS `hanzi`, 'zhongxue' AS `pinyin_raw`, 30 AS `radical_id`, '中' AS `hanzi_char`
    UNION ALL
    SELECT '中学' AS `hanzi`, 'zhongxue' AS `pinyin_raw`, 39 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '中学' AS `hanzi`, 'zhongxue' AS `pinyin_raw`, 42 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '中学' AS `hanzi`, 'zhongxue' AS `pinyin_raw`, 14 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '中学生' AS `hanzi`, 'zhongxuesheng' AS `pinyin_raw`, 2 AS `radical_id`, '中' AS `hanzi_char`
    UNION ALL
    SELECT '中学生' AS `hanzi`, 'zhongxuesheng' AS `pinyin_raw`, 30 AS `radical_id`, '中' AS `hanzi_char`
    UNION ALL
    SELECT '中学生' AS `hanzi`, 'zhongxuesheng' AS `pinyin_raw`, 39 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '中学生' AS `hanzi`, 'zhongxuesheng' AS `pinyin_raw`, 42 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '中学生' AS `hanzi`, 'zhongxuesheng' AS `pinyin_raw`, 14 AS `radical_id`, '学' AS `hanzi_char`
    UNION ALL
    SELECT '中学生' AS `hanzi`, 'zhongxuesheng' AS `pinyin_raw`, 100 AS `radical_id`, '生' AS `hanzi_char`
    UNION ALL
    SELECT '重' AS `hanzi`, 'zhong' AS `pinyin_raw`, 166 AS `radical_id`, '重' AS `hanzi_char`
    UNION ALL
    SELECT '重' AS `hanzi`, 'zhong' AS `pinyin_raw`, 24 AS `radical_id`, '重' AS `hanzi_char`
    UNION ALL
    SELECT '重' AS `hanzi`, 'zhong' AS `pinyin_raw`, 4 AS `radical_id`, '重' AS `hanzi_char`
    UNION ALL
    SELECT '重要' AS `hanzi`, 'zhongyao' AS `pinyin_raw`, 166 AS `radical_id`, '重' AS `hanzi_char`
    UNION ALL
    SELECT '重要' AS `hanzi`, 'zhongyao' AS `pinyin_raw`, 24 AS `radical_id`, '重' AS `hanzi_char`
    UNION ALL
    SELECT '重要' AS `hanzi`, 'zhongyao' AS `pinyin_raw`, 4 AS `radical_id`, '重' AS `hanzi_char`
    UNION ALL
    SELECT '重要' AS `hanzi`, 'zhongyao' AS `pinyin_raw`, 146 AS `radical_id`, '要' AS `hanzi_char`
    UNION ALL
    SELECT '重要' AS `hanzi`, 'zhongyao' AS `pinyin_raw`, 38 AS `radical_id`, '要' AS `hanzi_char`
    UNION ALL
    SELECT '住' AS `hanzi`, 'zhu' AS `pinyin_raw`, 9 AS `radical_id`, '住' AS `hanzi_char`
    UNION ALL
    SELECT '住' AS `hanzi`, 'zhu' AS `pinyin_raw`, 3 AS `radical_id`, '住' AS `hanzi_char`
    UNION ALL
    SELECT '住' AS `hanzi`, 'zhu' AS `pinyin_raw`, 96 AS `radical_id`, '住' AS `hanzi_char`
    UNION ALL
    SELECT '准备' AS `hanzi`, 'zhunbei' AS `pinyin_raw`, 15 AS `radical_id`, '准' AS `hanzi_char`
    UNION ALL
    SELECT '准备' AS `hanzi`, 'zhunbei' AS `pinyin_raw`, 172 AS `radical_id`, '准' AS `hanzi_char`
    UNION ALL
    SELECT '准备' AS `hanzi`, 'zhunbei' AS `pinyin_raw`, 34 AS `radical_id`, '备' AS `hanzi_char`
    UNION ALL
    SELECT '准备' AS `hanzi`, 'zhunbei' AS `pinyin_raw`, 102 AS `radical_id`, '备' AS `hanzi_char`
    UNION ALL
    SELECT '桌子' AS `hanzi`, 'zhuozi' AS `pinyin_raw`, 75 AS `radical_id`, '桌' AS `hanzi_char`
    UNION ALL
    SELECT '桌子' AS `hanzi`, 'zhuozi' AS `pinyin_raw`, 24 AS `radical_id`, '桌' AS `hanzi_char`
    UNION ALL
    SELECT '桌子' AS `hanzi`, 'zhuozi' AS `pinyin_raw`, 25 AS `radical_id`, '桌' AS `hanzi_char`
    UNION ALL
    SELECT '桌子' AS `hanzi`, 'zhuozi' AS `pinyin_raw`, 39 AS `radical_id`, '子' AS `hanzi_char`
    UNION ALL
    SELECT '字' AS `hanzi`, 'zi' AS `pinyin_raw`, 39 AS `radical_id`, '字' AS `hanzi_char`
    UNION ALL
    SELECT '字' AS `hanzi`, 'zi' AS `pinyin_raw`, 40 AS `radical_id`, '字' AS `hanzi_char`
    UNION ALL
    SELECT '子' AS `hanzi`, 'zi (zhuozi)' AS `pinyin_raw`, 39 AS `radical_id`, '子' AS `hanzi_char`
    UNION ALL
    SELECT '走' AS `hanzi`, 'zou' AS `pinyin_raw`, 156 AS `radical_id`, '走' AS `hanzi_char`
    UNION ALL
    SELECT '走路' AS `hanzi`, 'zoulu' AS `pinyin_raw`, 156 AS `radical_id`, '走' AS `hanzi_char`
    UNION ALL
    SELECT '走路' AS `hanzi`, 'zoulu' AS `pinyin_raw`, 157 AS `radical_id`, '路' AS `hanzi_char`
    UNION ALL
    SELECT '走路' AS `hanzi`, 'zoulu' AS `pinyin_raw`, 30 AS `radical_id`, '路' AS `hanzi_char`
    UNION ALL
    SELECT '走路' AS `hanzi`, 'zoulu' AS `pinyin_raw`, 34 AS `radical_id`, '路' AS `hanzi_char`
    UNION ALL
    SELECT '最' AS `hanzi`, 'zui' AS `pinyin_raw`, 73 AS `radical_id`, '最' AS `hanzi_char`
    UNION ALL
    SELECT '最' AS `hanzi`, 'zui' AS `pinyin_raw`, 72 AS `radical_id`, '最' AS `hanzi_char`
    UNION ALL
    SELECT '最' AS `hanzi`, 'zui' AS `pinyin_raw`, 29 AS `radical_id`, '最' AS `hanzi_char`
    UNION ALL
    SELECT '最' AS `hanzi`, 'zui' AS `pinyin_raw`, 128 AS `radical_id`, '最' AS `hanzi_char`
    UNION ALL
    SELECT '最好' AS `hanzi`, 'zuihao' AS `pinyin_raw`, 73 AS `radical_id`, '最' AS `hanzi_char`
    UNION ALL
    SELECT '最好' AS `hanzi`, 'zuihao' AS `pinyin_raw`, 72 AS `radical_id`, '最' AS `hanzi_char`
    UNION ALL
    SELECT '最好' AS `hanzi`, 'zuihao' AS `pinyin_raw`, 29 AS `radical_id`, '最' AS `hanzi_char`
    UNION ALL
    SELECT '最好' AS `hanzi`, 'zuihao' AS `pinyin_raw`, 128 AS `radical_id`, '最' AS `hanzi_char`
    UNION ALL
    SELECT '最好' AS `hanzi`, 'zuihao' AS `pinyin_raw`, 38 AS `radical_id`, '好' AS `hanzi_char`
    UNION ALL
    SELECT '最好' AS `hanzi`, 'zuihao' AS `pinyin_raw`, 39 AS `radical_id`, '好' AS `hanzi_char`
    UNION ALL
    SELECT '最后' AS `hanzi`, 'zuihou' AS `pinyin_raw`, 73 AS `radical_id`, '最' AS `hanzi_char`
    UNION ALL
    SELECT '最后' AS `hanzi`, 'zuihou' AS `pinyin_raw`, 72 AS `radical_id`, '最' AS `hanzi_char`
    UNION ALL
    SELECT '最后' AS `hanzi`, 'zuihou' AS `pinyin_raw`, 29 AS `radical_id`, '最' AS `hanzi_char`
    UNION ALL
    SELECT '最后' AS `hanzi`, 'zuihou' AS `pinyin_raw`, 128 AS `radical_id`, '最' AS `hanzi_char`
    UNION ALL
    SELECT '最后' AS `hanzi`, 'zuihou' AS `pinyin_raw`, 30 AS `radical_id`, '后' AS `hanzi_char`
    UNION ALL
    SELECT '昨天' AS `hanzi`, 'zuotian' AS `pinyin_raw`, 72 AS `radical_id`, '昨' AS `hanzi_char`
    UNION ALL
    SELECT '昨天' AS `hanzi`, 'zuotian' AS `pinyin_raw`, 4 AS `radical_id`, '昨' AS `hanzi_char`
    UNION ALL
    SELECT '昨天' AS `hanzi`, 'zuotian' AS `pinyin_raw`, 1 AS `radical_id`, '昨' AS `hanzi_char`
    UNION ALL
    SELECT '昨天' AS `hanzi`, 'zuotian' AS `pinyin_raw`, 37 AS `radical_id`, '天' AS `hanzi_char`
    UNION ALL
    SELECT '左' AS `hanzi`, 'zuo' AS `pinyin_raw`, 48 AS `radical_id`, '左' AS `hanzi_char`
    UNION ALL
    SELECT '左边' AS `hanzi`, 'zuobian' AS `pinyin_raw`, 48 AS `radical_id`, '左' AS `hanzi_char`
    UNION ALL
    SELECT '左边' AS `hanzi`, 'zuobian' AS `pinyin_raw`, 162 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '左边' AS `hanzi`, 'zuobian' AS `pinyin_raw`, 19 AS `radical_id`, '边' AS `hanzi_char`
    UNION ALL
    SELECT '坐' AS `hanzi`, 'zuo' AS `pinyin_raw`, 32 AS `radical_id`, '坐' AS `hanzi_char`
    UNION ALL
    SELECT '坐' AS `hanzi`, 'zuo' AS `pinyin_raw`, 9 AS `radical_id`, '坐' AS `hanzi_char`
    UNION ALL
    SELECT '坐下' AS `hanzi`, 'zuo xia' AS `pinyin_raw`, 32 AS `radical_id`, '坐' AS `hanzi_char`
    UNION ALL
    SELECT '坐下' AS `hanzi`, 'zuo xia' AS `pinyin_raw`, 9 AS `radical_id`, '坐' AS `hanzi_char`
    UNION ALL
    SELECT '坐下' AS `hanzi`, 'zuo xia' AS `pinyin_raw`, 1 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '坐下' AS `hanzi`, 'zuo xia' AS `pinyin_raw`, 25 AS `radical_id`, '下' AS `hanzi_char`
    UNION ALL
    SELECT '做' AS `hanzi`, 'zuo' AS `pinyin_raw`, 9 AS `radical_id`, '做' AS `hanzi_char`
    UNION ALL
    SELECT '做' AS `hanzi`, 'zuo' AS `pinyin_raw`, 66 AS `radical_id`, '做' AS `hanzi_char`
) m
JOIN `VOCABULARY` v ON v.`hanzi` = m.`hanzi` AND v.`pinyin_raw` = m.`pinyin_raw`
ON DUPLICATE KEY UPDATE `hanzi_char` = VALUES(`hanzi_char`);

-- -----------------------------------------------------------------------------
-- Step 4: Standardize meaning_vi semicolons to commas for all vocabulary
-- -----------------------------------------------------------------------------
UPDATE `VOCABULARY`
SET `meaning_vi` = REPLACE(REPLACE(`meaning_vi`, '; ', ', '), ';', ', ')
WHERE `meaning_vi` LIKE '%;%';

