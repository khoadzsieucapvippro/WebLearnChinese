-- =============================================================================
-- Migration: V31__populate_audio_urls.sql
-- Description: Populate static audio asset paths for 214 Kangxi Radicals and 1,068 HSK 1-3 Vocabularies
-- Database: TiDB Cloud Serverless / MySQL 8.0+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

UPDATE `RADICAL`
SET `audio_url` = CONCAT('/assets/audio/radicals/radical_', LPAD(`radical_id`, 3, '0'), '.mp3'),
    `updated_at` = NOW()
WHERE `radical_id` BETWEEN 1 AND 214;

UPDATE `VOCABULARY`
SET `audio_url` = CONCAT('/assets/audio/vocabulary/vocab_', LPAD(`vocab_id`, 4, '0'), '.mp3'),
    `updated_at` = NOW()
WHERE `vocab_id` BETWEEN 1 AND 1076;
