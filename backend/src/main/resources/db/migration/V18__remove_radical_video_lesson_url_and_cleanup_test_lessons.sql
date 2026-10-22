-- =============================================================================
-- Migration: V18__remove_radical_video_lesson_url_and_cleanup_test_lessons.sql
-- Description: 
--   1. Completely drop the video_lesson_url column from radical table (ADR-03)
--      as video lecture functionality has been removed in favor of interactive
--      character writing and in-app pedagogical explanations.
--   2. Safely clean up remaining test lessons (TZ Lesson *, Book1_5_tu_them, etc.)
--      from the public catalog while strictly preserving vocabulary and user progress.
-- Database: MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Drop video_lesson_url column from radical table
-- -----------------------------------------------------------------------------
ALTER TABLE `RADICAL` DROP COLUMN `video_lesson_url`;

-- -----------------------------------------------------------------------------
-- Step 2: Clean up test lessons from lesson_vocabulary and lesson tables
-- -----------------------------------------------------------------------------
DELETE lv FROM `LESSON_VOCABULARY` lv
JOIN `LESSON` l ON lv.`lesson_id` = l.`lesson_id`
WHERE l.`title` LIKE 'TZ Lesson %'
   OR l.`title` LIKE '%Book1_5_tu_them%'
   OR l.`title` = 'Book1_5_tu_them'
   OR l.`title` = 'Bài học 5 từ - Giao tiếp cơ bản'
   OR l.`title` LIKE 'SRS Test%';

DELETE FROM `LESSON`
WHERE `title` LIKE 'TZ Lesson %'
   OR `title` LIKE '%Book1_5_tu_them%'
   OR `title` = 'Book1_5_tu_them'
   OR `title` = 'Bài học 5 từ - Giao tiếp cơ bản'
   OR `title` LIKE 'SRS Test%';
