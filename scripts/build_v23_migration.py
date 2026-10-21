# -*- coding: utf-8 -*-
"""
V23 Migration Generator for HSK 1-3 Standardization (November 2025 Syllabus)
"""

import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT_DIR, "data", "hsk30")
MIGRATION_PATH = os.path.join(ROOT_DIR, "backend", "src", "main", "resources", "db", "migration", "V23__standardize_hsk_1_to_3_vocabulary_2025.sql")

# 1. Load official items
hsk_official = {}
for lvl in [1, 2, 3]:
    p = os.path.join(DATA_DIR, f"hsk-{lvl}.json")
    with open(p, "r", encoding="utf-8") as f:
        for it in json.load(f):
            hsk_official[it['id']] = it

print(f"Loaded {len(hsk_official)} official HSK 1-3 items.")

# 2. Helper to normalize pinyin to toneless
def to_raw(p):
    p = p.lower()
    mapping = {
        'ā':'a','á':'a','ǎ':'a','à':'a',
        'ē':'e','é':'e','ě':'e','è':'e',
        'ī':'i','í':'i','ǐ':'i','ì':'i',
        'ō':'o','ó':'o','ǒ':'o','ò':'o',
        'ū':'u','ú':'u','ǔ':'u','ù':'u',
        'ǖ':'u','ǘ':'u','ǚ':'u','ǜ':'u','ü':'u',
        '’':'', "'": '', ' ': '', '-': ''
    }
    for k, v in mapping.items():
        p = p.replace(k, v)
    return p

# 3. Load current DB items
sys.path.append(os.path.join(ROOT_DIR, "scripts"))
from audit_meanings import current_db

# Load 568 missing definitions
with open(os.path.join(DATA_DIR, "hsk_missing_definitions.json"), "r", encoding="utf-8") as f:
    missing_568_defs = {int(k): v for k, v in json.load(f).items()}

# Load radical mappings
from test_radical_resolver import full_char_map

# Meanings correction dictionary for existing items (natural Vietnamese, grounded terminology)
MEANING_FIXES = {
    '车': 'Xe, xe cộ',
    '东': 'Phía đông, phương đông',
    '国': 'Quốc gia, đất nước',
    '楼': 'Tòa nhà, tầng gác',
    '路': 'Đường, con đường',
    '毛': 'Lông, sợi; hào (tiền)',
    '那': 'Kia, đó',
    '南': 'Phía nam, phương nam',
    '能': 'Có thể, khả năng',
    '年': 'Năm (thời gian)',
    '钱': 'Tiền, tiền bạc',
    '三': 'Số ba, 3',
    '山': 'Núi, ngọn núi',
    '水': 'Nước',
    '也': 'Cũng, cũng vậy',
    '元': 'Đồng tệ, nguyên (đơn vị tiền tệ)',
    '请进': 'Mời vào',
    '请坐': 'Mời ngồi',
    '东西': 'Đồ vật, đồ đạc, cái',
    '从': 'Từ, theo, đi từ',
    '大学': 'Trường đại học, đại học',
    '书': 'Sách, cuốn sách',
    '家': 'Nhà, gia đình; nhà (chuyên gia)',
    '好玩儿': 'Thú vị, vui, vui nhộn',
    '面条儿': 'Mì, sợi mì',
    '男孩儿': 'Bé trai, cậu bé, con trai',
    '女孩儿': 'Bé gái, cô bé, con gái',
    '小孩儿': 'Trẻ con, đứa trẻ, em bé',
    '一块儿': 'Cùng nhau, cùng một nơi',
    '一下儿': 'Một chút, một lát, một hồi',
    '一点儿': 'Một chút, một ít',
    '这里': 'Ở đây, chỗ này, nơi này',
    '笑': 'Cười, mỉm cười',
    '工人': 'Công nhân, người lao động',
    '外语': 'Ngoại ngữ, tiếng nước ngoài',
    '小时': 'Giờ, tiếng đồng hồ',
    '新年': 'Năm mới, tết',
    '学校': 'Trường học, trường',
    '雨': 'Mưa, cơn mưa',
    '次': 'Lần, lượt, thứ tự',
    '差': 'Kém, tồi; thiếu; chênh lệch',
    '半': 'Một nửa, nửa',
    '起来': 'Đứng lên, dậy; bắt đầu',
    '谁': 'Ai, người nào',
    '知道': 'Biết, hiểu rõ',
    '楼上': 'Tầng trên, trên lầu',
    '奶': 'Sữa; bà nội',
    '第': 'Thứ, đệ (tiền tố đặt trước số thứ tự)',
    '本子': 'Vở, quyển vở, sổ tay',
    '地方': 'Nơi chốn, chỗ, địa phương',
    '地': 'Trợ từ kết cấu (nối trạng ngữ với động từ)',
    '得': 'Trợ từ kết cấu (nối động từ/tính từ với bổ ngữ)',
    '过': 'Trợ từ động thái (từng trải qua)',
    '花': 'Hoa, bông hoa',
    '会': 'Biết, sẽ, có thể',
    '站': 'Ga, bến, trạm xe',
    '过去': 'Quá khứ, trước đây',
    '怎么': 'Như thế nào, làm sao, thế nào',
    '请问': 'Xin hỏi, cho hỏi',
    '哪里': 'Ở đâu, chỗ nào; đâu có (khiêm tốn)',
    '哪儿': 'Ở đâu, đâu',
    '哪些': 'Những cái nào, những ai',
    '哪': 'Nào, cái nào',
    '什么': 'Gì, cái gì',
}

# Han-Viet readings correction dictionary
HAN_VIET_FIXES = {
    '女儿': 'Nữ Nhi',
    '读': 'Độc',
    '读书': 'Độc Thư',
    '好玩儿': 'Hảo Ngoạn Nhi',
    '面条儿': 'Diện Điều Nhi',
    '男孩儿': 'Nam Hài Nhi',
    '女孩儿': 'Nữ Hài Nhi',
    '小孩儿': 'Tiểu Hài Nhi',
    '一块儿': 'Nhất Khối Nhi',
    '一下儿': 'Nhất Hạ Nhi',
    '一点儿': 'Nhất Điểm Nhi',
    '玩儿': 'Ngoạn Nhi',
    '没事儿': 'Một Sự Nhi',
    '哪儿': 'Na Nhi',
    '这儿': 'Giá Nhi',
    '那儿': 'Na Nhi',
    '一会儿': 'Nhất Hội Nhi',
}

official_by_hanzi_raw = {}
official_by_hanzi = {}
for off_id, it in hsk_official.items():
    raw = to_raw(it['pinyin'])
    it['computed_raw'] = raw
    official_by_hanzi_raw.setdefault((it['hanzi'], raw), []).append(it)
    official_by_hanzi.setdefault(it['hanzi'], []).append(it)

HOMOGRAPH_PREFERENCE = {
    '过': 351,
    '花': 358,
    '得': 332,
    '点': 33,
    '会': 82,
    '站': 486,
    '过去': 660,
}

matched_records = []
unmatched_records = []
assigned_official_ids = set()

# Map existing DB items to official
# Assign explicit vocab_id 1..500 based on their order in current_db
db_items_list = list(current_db.values())
for idx, rec in enumerate(db_items_list, 1):
    rec['vocab_id'] = idx
    hanzi = rec['hanzi']
    db_raw = to_raw(rec['pinyin'])
    candidates = official_by_hanzi_raw.get((hanzi, db_raw), [])
    
    if hanzi == '干':
        if rec['pinyin_raw'] == 'gan' or rec['pinyin'] == 'gān':
            candidates = []
        else:
            candidates = [hsk_official[640]]
    elif not candidates:
        candidates = official_by_hanzi.get(hanzi, [])
    
    if len(candidates) == 1:
        chosen = candidates[0]
        assigned_official_ids.add(chosen['id'])
        matched_records.append((rec, chosen))
    elif len(candidates) > 1:
        pref = HOMOGRAPH_PREFERENCE.get(hanzi)
        chosen = next((c for c in candidates if c['id'] == pref), candidates[0])
        assigned_official_ids.add(chosen['id'])
        matched_records.append((rec, chosen))
    else:
        unmatched_records.append(rec)

print(f"Matched existing records: {len(matched_records)}")
print(f"Supplementary records: {len(unmatched_records)}")
assert len(matched_records) == 432
assert len(unmatched_records) == 68

# Missing official IDs to insert
missing_official_ids = sorted([it_id for it_id in hsk_official.keys() if it_id not in assigned_official_ids])
print(f"Missing official items to insert: {len(missing_official_ids)}")
assert len(missing_official_ids) == 568

def escape_sql(val):
    if val is None:
        return "NULL"
    return "'" + str(val).replace("\\", "\\\\").replace("'", "''") + "'"

lines = []
lines.append("-- =============================================================================")
lines.append("-- Migration: V23__standardize_hsk_1_to_3_vocabulary_2025.sql")
lines.append("-- Description:")
lines.append("--   Standardize all vocabulary for HSK 1-3 according to the official")
lines.append("--   HSK 3.0 November 2025 Examination Syllabus (新版HSK考试大纲, chinesetest.cn).")
lines.append("--   Exact metrics:")
lines.append("--     - HSK 1: exactly 300 entries (official IDs 1..300)")
lines.append("--     - HSK 2: exactly 200 entries (official IDs 301..500)")
lines.append("--     - HSK 3: exactly 500 entries (official IDs 501..1000)")
lines.append("--     - Total official entries: exactly 1,000 entries")
lines.append("--     - Preserved supplementary entries: exactly 68 entries (hsk_level = 0, hsk_standard = 'Curriculum Supplementary')")
lines.append("--     - Total vocabulary entries in DB: exactly 1,068 entries")
lines.append("-- Database: MySQL 8.4+")
lines.append("-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci")
lines.append("-- =============================================================================")
lines.append("")

# Step 1: DDL changes
lines.append("-- -----------------------------------------------------------------------------")
lines.append("-- Step 1: Schema updates (DDL)")
lines.append("-- -----------------------------------------------------------------------------")
lines.append("ALTER TABLE `VOCABULARY` MODIFY COLUMN `hsk_standard` VARCHAR(50) NOT NULL DEFAULT 'HSK 3.0';")
lines.append("")
lines.append("-- Drop physical unique index to allow homographs with same pinyin_raw (e.g. 会, 过, 花, 得, 点)")
lines.append("-- Reorder indexes so composite uk_vocab_hanzi_pinyin_raw precedes single-column indexes for optimizer selection")
lines.append("ALTER TABLE `VOCABULARY`")
lines.append("  DROP INDEX `uk_vocab_hanzi_pinyin_raw`,")
lines.append("  DROP INDEX `idx_vocab_pinyin_raw`,")
lines.append("  DROP INDEX `idx_vocab_hanzi`,")
lines.append("  ADD INDEX `uk_vocab_hanzi_pinyin_raw` (`hanzi`, `pinyin_raw`),")
lines.append("  ADD INDEX `idx_vocab_pinyin_raw` (`pinyin_raw`),")
lines.append("  ADD INDEX `idx_vocab_hanzi` (`hanzi`);")
lines.append("")
lines.append("-- Add HSK 2025 syllabus metadata columns")
lines.append("ALTER TABLE `VOCABULARY`")
lines.append("  ADD COLUMN `hsk_source_id` INT NULL AFTER `hsk_standard`,")
lines.append("  ADD COLUMN `hsk_source_label` VARCHAR(50) NULL AFTER `hsk_source_id`,")
lines.append("  ADD COLUMN `hsk_edition` VARCHAR(50) NOT NULL DEFAULT '2025' AFTER `hsk_source_label`,")
lines.append("  ADD COLUMN `part_of_speech` VARCHAR(50) NULL AFTER `hsk_edition`,")
lines.append("  ADD COLUMN `homograph_index` INT NULL AFTER `part_of_speech`,")
lines.append("  ADD COLUMN `source_pdf_page` INT NULL AFTER `homograph_index`;")
lines.append("")
lines.append("ALTER TABLE `VOCABULARY` ADD CONSTRAINT `uk_vocab_hsk_source` UNIQUE (`hsk_source_id`);")
lines.append("")

# Step 2: In-place update of 432 existing official records
lines.append("-- -----------------------------------------------------------------------------")
lines.append("-- Step 2: Update 432 existing vocabulary entries matching official HSK 1-3 items")
lines.append("-- -----------------------------------------------------------------------------")
for rec, off in matched_records:
    hz = rec['hanzi']
    meaning = MEANING_FIXES.get(hz, rec['meaning_vi'])
    han_viet = HAN_VIET_FIXES.get(hz, rec['meaning_han_viet'])
    
    # Official metadata
    hsk_lvl = int(off['level'])
    src_id = off['id']
    src_label = off.get('level_label') or str(hsk_lvl)
    pos = off.get('part_of_speech')
    homograph = off.get('homograph')
    pdf_page = off.get('source_pdf_page')
    
    # Official pinyin
    pinyin = off['pinyin']
    pinyin_raw = off['computed_raw']
    
    # Build resilient WHERE clause matching either legacy DB pinyin_raw or normalized pinyin_raw
    if hz == '干':
        where_clause = "WHERE `hanzi` = '干' AND (`pinyin_raw` = 'gan4' OR `pinyin` COLLATE utf8mb4_bin = 'gàn') AND `hsk_source_id` IS NULL;"
    elif hz == '女儿':
        where_clause = "WHERE `hanzi` = '女儿' AND (`pinyin_raw` = 'nuer' OR `pinyin_raw` = 'nu''er') AND `hsk_source_id` IS NULL;"
    else:
        db_raw = rec['pinyin_raw']
        norm_raw = to_raw(db_raw)
        candidates = set([db_raw, norm_raw, pinyin_raw])
        if len(candidates) == 1:
            where_clause = f"WHERE `hanzi` = {escape_sql(hz)} AND `pinyin_raw` = {escape_sql(list(candidates)[0])} AND `hsk_source_id` IS NULL;"
        else:
            conds = " OR ".join([f"`pinyin_raw` = {escape_sql(c)}" for c in sorted(candidates)])
            where_clause = f"WHERE `hanzi` = {escape_sql(hz)} AND ({conds}) AND `hsk_source_id` IS NULL;"
    
    stmt = (
        f"UPDATE `VOCABULARY` SET "
        f"`pinyin` = {escape_sql(pinyin)}, "
        f"`pinyin_raw` = {escape_sql(pinyin_raw)}, "
        f"`meaning_han_viet` = {escape_sql(han_viet)}, "
        f"`meaning_vi` = {escape_sql(meaning)}, "
        f"`hsk_level` = {hsk_lvl}, "
        f"`hsk_standard` = 'HSK 3.0', "
        f"`hsk_source_id` = {src_id}, "
        f"`hsk_source_label` = {escape_sql(src_label)}, "
        f"`hsk_edition` = '2025', "
        f"`part_of_speech` = {escape_sql(pos)}, "
        f"`homograph_index` = {escape_sql(homograph)}, "
        f"`source_pdf_page` = {escape_sql(pdf_page)}, "
        f"`updated_at` = NOW() "
        f"{where_clause}"
    )
    lines.append(stmt)

lines.append("")

# Step 3: In-place update of 68 supplementary records
lines.append("-- -----------------------------------------------------------------------------")
lines.append("-- Step 3: Update 68 preserved curriculum supplementary entries (hsk_level = 0)")
lines.append("-- -----------------------------------------------------------------------------")
for rec in unmatched_records:
    hz = rec['hanzi']
    meaning = MEANING_FIXES.get(hz, rec['meaning_vi'])
    han_viet = HAN_VIET_FIXES.get(hz, rec['meaning_han_viet'])
    
    if hz == '干':
        where_clause = "WHERE `hanzi` = '干' AND (`pinyin_raw` = 'gan' AND `pinyin` COLLATE utf8mb4_bin = 'gān') AND `hsk_source_id` IS NULL;"
    else:
        db_raw = rec['pinyin_raw']
        norm_raw = to_raw(db_raw)
        candidates = set([db_raw, norm_raw])
        if len(candidates) == 1:
            where_clause = f"WHERE `hanzi` = {escape_sql(hz)} AND `pinyin_raw` = {escape_sql(list(candidates)[0])} AND `hsk_source_id` IS NULL;"
        else:
            conds = " OR ".join([f"`pinyin_raw` = {escape_sql(c)}" for c in sorted(candidates)])
            where_clause = f"WHERE `hanzi` = {escape_sql(hz)} AND ({conds}) AND `hsk_source_id` IS NULL;"
    
    stmt = (
        f"UPDATE `VOCABULARY` SET "
        f"`meaning_han_viet` = {escape_sql(han_viet)}, "
        f"`meaning_vi` = {escape_sql(meaning)}, "
        f"`hsk_level` = 0, "
        f"`hsk_standard` = 'Curriculum Supplementary', "
        f"`hsk_source_id` = NULL, "
        f"`hsk_source_label` = 'Supplementary', "
        f"`hsk_edition` = '2025', "
        f"`part_of_speech` = NULL, "
        f"`homograph_index` = NULL, "
        f"`source_pdf_page` = NULL, "
        f"`updated_at` = NOW() "
        f"{where_clause}"
    )
    lines.append(stmt)

lines.append("")

# Step 4: Insert 568 new official items
lines.append("-- -----------------------------------------------------------------------------")
lines.append("-- Step 4: Insert 568 missing official HSK 1-3 entries")
lines.append("-- -----------------------------------------------------------------------------")

new_vocab_rows = []
for off_id in missing_official_ids:
    d = missing_568_defs[off_id]
    hsk_lvl = d['level']
    hz = d['hanzi']
    pinyin = d['pinyin']
    pinyin_raw = d['pinyin_raw']
    han_viet = d['han_viet']
    meaning_vi = d['meaning_vi']
    src_id = d['id']
    src_label = str(hsk_lvl)
    pos = d['part_of_speech']
    homograph = d['homograph']
    pdf_page = d['source_pdf_page']
    ex_sent = d['example_sentence']
    ex_trans = d['example_translation']
    
    row_sql = (
        f"({escape_sql(hz)}, {escape_sql(pinyin)}, {escape_sql(pinyin_raw)}, "
        f"{escape_sql(han_viet)}, {escape_sql(meaning_vi)}, {hsk_lvl}, 'HSK 3.0', "
        f"{src_id}, {escape_sql(src_label)}, '2025', {escape_sql(pos)}, "
        f"{escape_sql(homograph)}, {escape_sql(pdf_page)}, {escape_sql(ex_sent)}, "
        f"{escape_sql(ex_trans)}, NOW(), NOW())"
    )
    new_vocab_rows.append(row_sql)

lines.append("INSERT INTO `VOCABULARY` (")
lines.append("  `hanzi`, `pinyin`, `pinyin_raw`, `meaning_han_viet`, `meaning_vi`,")
lines.append("  `hsk_level`, `hsk_standard`, `hsk_source_id`, `hsk_source_label`, `hsk_edition`,")
lines.append("  `part_of_speech`, `homograph_index`, `source_pdf_page`, `example_sentence`,")
lines.append("  `example_translation`, `created_at`, `updated_at`")
lines.append(") VALUES")
for i, r in enumerate(new_vocab_rows):
    comma = "," if i < len(new_vocab_rows) - 1 else ";"
    lines.append(f"  {r}{comma}")

lines.append("")

# Step 5: Insert VOCAB_RADICAL for the 568 new items
lines.append("-- -----------------------------------------------------------------------------")
lines.append("-- Step 5: Insert constituent Kangxi radicals for new vocabulary entries")
lines.append("-- -----------------------------------------------------------------------------")

radical_tuples = []
for off_id in missing_official_ids:
    d = missing_568_defs[off_id]
    src_id = d['id']
    hz = d['hanzi']
    seen_rads = set()
    for ch in hz:
        rad_ids = full_char_map.get(ch, [])
        for rid in rad_ids:
            if rid not in seen_rads:
                seen_rads.add(rid)
                radical_tuples.append((src_id, rid, ch))

BATCH_SIZE = 400
for b_idx in range(0, len(radical_tuples), BATCH_SIZE):
    batch = radical_tuples[b_idx:b_idx+BATCH_SIZE]
    lines.append("INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`)")
    lines.append("SELECT v.`vocab_id`, m.`radical_id`, m.`hanzi_char`")
    lines.append("FROM (")
    for i, (sid, rid, ch) in enumerate(batch):
        union = " UNION ALL" if i < len(batch) - 1 else ""
        lines.append(f"  SELECT {sid} AS `hsk_source_id`, {rid} AS `radical_id`, {escape_sql(ch)} AS `hanzi_char`{union}")
    lines.append(") m")
    lines.append("JOIN `VOCABULARY` v ON v.`hsk_source_id` = m.`hsk_source_id`;")
    lines.append("")

# Write to MIGRATION_PATH
with open(MIGRATION_PATH, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print(f"Generated {len(lines)} lines of SQL into {MIGRATION_PATH}")
print(f"Total new vocabulary rows: {len(new_vocab_rows)}")
print(f"Total new radical associations: {len(radical_tuples)}")
