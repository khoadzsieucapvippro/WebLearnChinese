import os
import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mig_dir = os.path.join(ROOT_DIR, "backend", "src", "main", "resources", "db", "migration")

with open(os.path.join(ROOT_DIR, "frontend", "js", "api", "demo-seed-data.js"), "r", encoding="utf-8") as f:
    text = f.read()

m = re.search(r'export const CHAR_TO_RADICALS_MAP = Object\.freeze\((\{.*?\})\);', text, re.DOTALL)
char_to_rads = json.loads(m.group(1))

m2 = re.search(r'export const SEED_VOCABULARY = (\[.*?\]);\s*export', text, re.DOTALL)
seed_vocab = json.loads(m2.group(1))

# Load V22 and V23 inserted mappings
with open(os.path.join(mig_dir, "V22__audit_and_update_vocabulary_radicals.sql"), "r", encoding="utf-8") as f:
    v22_text = f.read()

v22_pattern = re.compile(r"SELECT\s+'([^']+)'\s+AS\s+`hanzi`,\s+'([^']*)'\s+AS\s+`pinyin_raw`,\s+(\d+)\s+AS\s+`radical_id`,\s+'([^']*)'\s+AS\s+`hanzi_char`")
v22_matches = v22_pattern.findall(v22_text)

with open(os.path.join(mig_dir, "V23__standardize_hsk_1_to_3_vocabulary_2025.sql"), "r", encoding="utf-8") as f:
    v23_text = f.read()

v23_pattern = re.compile(r"SELECT\s+(\d+)\s+AS\s+`hsk_source_id`,\s+(\d+)\s+AS\s+`radical_id`,\s+'([^']*)'\s+AS\s+`hanzi_char`")
v23_matches = v23_pattern.findall(v23_text)

vocab_by_source_id = {v.get('hskSourceId'): v for v in seed_vocab if v.get('hskSourceId') is not None}

inserted_set = set()
for word, raw, rad_id, char in v22_matches:
    inserted_set.add((word, raw, int(rad_id), char))

for sid, rad_id, char in v23_matches:
    v = vocab_by_source_id.get(int(sid))
    if v:
        inserted_set.add((v['hanzi'], v['pinyinRaw'], int(rad_id), char))

print(f"Total inserted mappings recognized: {len(inserted_set)}")

missing_official = []
missing_supplementary = []

for v in seed_vocab:
    word = v['hanzi']
    raw = v['pinyinRaw']
    sid = v.get('hskSourceId')
    for char in word:
        if '\u4e00' <= char <= '\u9fff' and char in char_to_rads:
            for rid in char_to_rads[char]:
                if (word, raw, rid, char) not in inserted_set:
                    if sid is not None:
                        missing_official.append((sid, rid, char, word, raw))
                    else:
                        missing_supplementary.append((word, raw, rid, char))

print(f"Missing official mappings (hsk_source_id): {len(missing_official)}")
print(f"Missing supplementary mappings (hanzi, pinyin_raw): {len(missing_supplementary)}")

# Generate SQL migration V24
v24_lines = [
    "-- =============================================================================",
    "-- Migration: V24__add_radical_stroke_count_and_expand_vocab_radical_pk.sql",
    "-- Description:",
    "--   1. Add stroke_count TINYINT UNSIGNED NOT NULL to RADICAL table",
    "--   2. Backfill authoritative Kangxi stroke counts (1..17) for all 214 radicals",
    "--   3. Expand VOCAB_RADICAL schema:",
    "--      - Convert hanzi_char to VARCHAR(10) NOT NULL DEFAULT ''",
    "--      - Add component_type VARCHAR(50) NOT NULL DEFAULT 'kangxi_radical'",
    "--      - Add verification_status VARCHAR(50) NOT NULL DEFAULT 'verified'",
    "--      - Expand composite primary key to (vocab_id, radical_id, hanzi_char) to preserve",
    "--        per-character constituent radical attributions in multi-character words",
    "--   4. Insert missing constituent radical associations previously dropped due to old PK",
    "-- Database: MySQL 8.4+",
    "-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci",
    "-- =============================================================================",
    "",
    "-- -----------------------------------------------------------------------------",
    "-- Step 1: Add stroke_count to RADICAL table and backfill all 214 radicals",
    "-- -----------------------------------------------------------------------------",
    "ALTER TABLE `RADICAL`",
    "    ADD COLUMN `stroke_count` TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER `meaning_vi`;",
    "",
    "UPDATE `RADICAL` SET `stroke_count` = 1 WHERE `radical_id` BETWEEN 1 AND 6;",
    "UPDATE `RADICAL` SET `stroke_count` = 2 WHERE `radical_id` BETWEEN 7 AND 29;",
    "UPDATE `RADICAL` SET `stroke_count` = 3 WHERE `radical_id` BETWEEN 30 AND 60;",
    "UPDATE `RADICAL` SET `stroke_count` = 4 WHERE `radical_id` BETWEEN 61 AND 94;",
    "UPDATE `RADICAL` SET `stroke_count` = 5 WHERE `radical_id` BETWEEN 95 AND 117;",
    "UPDATE `RADICAL` SET `stroke_count` = 6 WHERE `radical_id` BETWEEN 118 AND 146;",
    "UPDATE `RADICAL` SET `stroke_count` = 7 WHERE `radical_id` BETWEEN 147 AND 166;",
    "UPDATE `RADICAL` SET `stroke_count` = 8 WHERE `radical_id` BETWEEN 167 AND 175;",
    "UPDATE `RADICAL` SET `stroke_count` = 9 WHERE `radical_id` BETWEEN 176 AND 186;",
    "UPDATE `RADICAL` SET `stroke_count` = 10 WHERE `radical_id` BETWEEN 187 AND 194;",
    "UPDATE `RADICAL` SET `stroke_count` = 11 WHERE `radical_id` BETWEEN 195 AND 200;",
    "UPDATE `RADICAL` SET `stroke_count` = 12 WHERE `radical_id` BETWEEN 201 AND 204;",
    "UPDATE `RADICAL` SET `stroke_count` = 13 WHERE `radical_id` BETWEEN 205 AND 208;",
    "UPDATE `RADICAL` SET `stroke_count` = 14 WHERE `radical_id` BETWEEN 209 AND 210;",
    "UPDATE `RADICAL` SET `stroke_count` = 15 WHERE `radical_id` = 211;",
    "UPDATE `RADICAL` SET `stroke_count` = 16 WHERE `radical_id` IN (212, 213);",
    "UPDATE `RADICAL` SET `stroke_count` = 17 WHERE `radical_id` = 214;",
    "",
    "-- -----------------------------------------------------------------------------",
    "-- Step 2: Expand VOCAB_RADICAL schema to composite key (vocab_id, radical_id, hanzi_char)",
    "-- -----------------------------------------------------------------------------",
    "UPDATE `VOCAB_RADICAL` SET `hanzi_char` = '' WHERE `hanzi_char` IS NULL;",
    "",
    "ALTER TABLE `VOCAB_RADICAL`",
    "    MODIFY COLUMN `hanzi_char` VARCHAR(10) NOT NULL DEFAULT '',",
    "    ADD COLUMN `component_type` VARCHAR(50) NOT NULL DEFAULT 'kangxi_radical' AFTER `hanzi_char`,",
    "    ADD COLUMN `verification_status` VARCHAR(50) NOT NULL DEFAULT 'verified' AFTER `component_type`;",
    "",
    "ALTER TABLE `VOCAB_RADICAL`",
    "    DROP PRIMARY KEY,",
    "    ADD PRIMARY KEY (`vocab_id`, `radical_id`, `hanzi_char`);",
    ""
]

if missing_official:
    v24_lines.extend([
        "-- -----------------------------------------------------------------------------",
        "-- Step 3: Insert missing constituent radicals for official HSK 1-3 vocabulary",
        "-- -----------------------------------------------------------------------------",
        "INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)",
        "SELECT v.`vocab_id`, m.`radical_id`, m.`hanzi_char`, 'kangxi_radical', 'verified'",
        "FROM ("
    ])
    for idx, (sid, rid, char, word, raw) in enumerate(missing_official):
        comma_union = " UNION ALL" if idx < len(missing_official) - 1 else ""
        v24_lines.append(f"  SELECT {sid} AS `hsk_source_id`, {rid} AS `radical_id`, '{char}' AS `hanzi_char`{comma_union}")
    v24_lines.extend([
        ") m",
        "JOIN `VOCABULARY` v ON v.`hsk_source_id` = m.`hsk_source_id`;",
        ""
    ])

if missing_supplementary:
    v24_lines.extend([
        "-- -----------------------------------------------------------------------------",
        "-- Step 4: Insert missing constituent radicals for supplementary curriculum vocabulary",
        "-- -----------------------------------------------------------------------------",
        "INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`, `component_type`, `verification_status`)",
        "SELECT v.`vocab_id`, m.`radical_id`, m.`hanzi_char`, 'kangxi_radical', 'verified'",
        "FROM ("
    ])
    for idx, (word, raw, rid, char) in enumerate(missing_supplementary):
        comma_union = " UNION ALL" if idx < len(missing_supplementary) - 1 else ""
        v24_lines.append(f"  SELECT '{word}' AS `hanzi`, '{raw}' AS `pinyin_raw`, {rid} AS `radical_id`, '{char}' AS `hanzi_char`{comma_union}")
    v24_lines.extend([
        ") m",
        "JOIN `VOCABULARY` v ON v.`hanzi` = m.`hanzi` AND v.`pinyin_raw` = m.`pinyin_raw`;",
        ""
    ])

v24_content = "\n".join(v24_lines)

v24_path = os.path.join(mig_dir, "V24__add_radical_stroke_count_and_expand_vocab_radical_pk.sql")
with open(v24_path, "w", encoding="utf-8") as f:
    f.write(v24_content)

print(f"Generated migration {v24_path} ({len(v24_content)} bytes)")
