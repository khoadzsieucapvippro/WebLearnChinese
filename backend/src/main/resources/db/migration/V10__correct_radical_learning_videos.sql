-- =============================================================================
-- Migration: V10__correct_radical_learning_videos.sql
-- Description: Correct radical learning video URLs with verified educational lessons
-- Scope:
--   1. Reset unverified / broken / duplicated legacy video URLs to NULL
--   2. Seed authentic, verified, embeddable YouTube video lessons for verified radicals:
--      - Radical 75 (木, Rank 1): Chinese Characters 3000 (RpBPqAM3GDg)
--      - Radical 85 (水, Rank 2): Dinara Min School (gDQwd4lpe6g)
--      - Radical 9  (人, Rank 3): Queen Mandarin (-x3OgoFffeY)
--      - Radical 30 (口, Rank 4): Easy Chinese (8azgvtJXqw0)
--      - Radical 61 (心, Rank 5): Learn Chinese with Leo (agtDkyK739E)
--      - Radical 64 (手, Rank 6): I Heart Mandarin (bYbXddAEpgE)
--      - Radical 38 (女, Rank 7): Dinara Min School (DYWgJQs5bvc)
--      - Radical 86 (火, Rank 8): Dinara Min School (ypNH_POJGNs)
--      - Radical 32 (土, Rank 9): Dinara Min School (L7orZW6etC0)
--      - Radical 72 (日, Rank 10): Easy Chinese (zs6Fh_BFpv4)
--      - Radical 74 (月, Rank 11): Dinara Min School (ooc0Av3-yXI)
--      - Radical 18 (刀, Rank 12): Dinara Min School (1XmwznQ7dBg)
--      - Radical 167 (金, Rank 17): Dinara Min School (Tismw6PCK2I)
--      - Radical 46 (山, Rank 18): Dinara Min School (YEKQgngPZ2A)
--   3. All other radicals (36 common + 164 remaining = 200) strictly remain NULL.
-- Invariant: Quality > Fake Coverage. Zero generic or fabricated URLs.
-- Database: MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- Step 1: Cleanse legacy unverified/duplicated video URLs while keeping explanation_vi & common_rank intact
UPDATE `radical` SET `video_lesson_url` = NULL WHERE `video_lesson_url` IS NOT NULL;

-- Step 2: Seed verified, embeddable YouTube lessons for verified radicals

-- Radical 75 (木 - Wood, Rank 1)
-- Title: 汉字部首“木”和相关汉语词汇 Chinese Radical “木” and Connected Vocabulary | Creator: Chinese Characters 3000
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=RpBPqAM3GDg' WHERE `radical_id` = 75;

-- Radical 85 (水 - Water, Rank 2)
-- Title: Chinese Radical #1: 水 (water) 💧 Dinara Min School ✌ | Creator: Dinara Min School
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=gDQwd4lpe6g' WHERE `radical_id` = 85;

-- Radical 9 (人 - Person, Rank 3)
-- Title: Radical 亻: One Human, Endless Meanings: Characters Built Around 亻 | Creator: Queen Mandarin
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=-x3OgoFffeY' WHERE `radical_id` = 9;

-- Radical 30 (口 - Mouth, Rank 4)
-- Title: 口 The Chinese Mouth Character and Radical | Creator: 易安中文 Easy Chinese
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=8azgvtJXqw0' WHERE `radical_id` = 30;

-- Radical 61 (心 - Heart, Rank 5)
-- Title: How to write heart 心 in Chinese | Creator: Learn Chinese with Leo
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=agtDkyK739E' WHERE `radical_id` = 61;

-- Radical 64 (手 - Hand, Rank 6)
-- Title: [🧩扌手 ] 10 Essential Chinese Characters with 手👋 (hand radical) | Creator: I Heart Mandarin
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=bYbXddAEpgE' WHERE `radical_id` = 64;

-- Radical 38 (女 - Woman, Rank 7)
-- Title: Chinese Radical #16: 女 (woman)💃 Dinara Min School ✌ | Creator: Dinara Min School
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=DYWgJQs5bvc' WHERE `radical_id` = 38;

-- Radical 86 (火 - Fire, Rank 8)
-- Title: Chinese Radical #18: 火 (fire) 🔥 Dinara Min School ✌ | Creator: Dinara Min School
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=ypNH_POJGNs' WHERE `radical_id` = 86;

-- Radical 32 (土 - Earth, Rank 9)
-- Title: Chinese Radical #10: 土 (soil) 🏝 Dinara Min School ✌ | Creator: Dinara Min School
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=L7orZW6etC0' WHERE `radical_id` = 32;

-- Radical 72 (日 - Sun, Rank 10)
-- Title: 日 Chinese Sun Character and Radical | Creator: 易安中文 Easy Chinese
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=zs6Fh_BFpv4' WHERE `radical_id` = 72;

-- Radical 74 (月 - Moon, Rank 11)
-- Title: Chinese Radical #12: 月 (moon)🌛 Dinara Min School ✌ | Creator: Dinara Min School
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=ooc0Av3-yXI' WHERE `radical_id` = 74;

-- Radical 18 (刀 - Knife, Rank 12)
-- Title: Chinese Radical #32: 刀 (knife) 🔪 Dinara Min School ✌ | Creator: Dinara Min School
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=1XmwznQ7dBg' WHERE `radical_id` = 18;

-- Radical 167 (金 - Metal/Gold, Rank 17)
-- Title: Chinese Radical #8: 金 (gold, metal) 🥇 Dinara Min School ✌ | Creator: Dinara Min School
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Tismw6PCK2I' WHERE `radical_id` = 167;

-- Radical 46 (山 - Mountain, Rank 18)
-- Title: Chinese Radical #24: 山 (mountain) ⛰️ Dinara Min School ✌ | Creator: Dinara Min School
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=YEKQgngPZ2A' WHERE `radical_id` = 46;
