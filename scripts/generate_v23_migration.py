# -*- coding: utf-8 -*-
"""
Generate V23__standardize_hsk_1_to_3_vocabulary_2025.sql
Implements official HSK 3.0 (November 2025 Examination Syllabus) standardization for HSK 1-3.
Exact numbers:
- HSK 1: exactly 300 entries (IDs 1-300)
- HSK 2: exactly 200 entries (IDs 301-500)
- HSK 3: exactly 500 entries (IDs 501-1000)
- Total official: 1,000 entries.
- Preserved supplementary: 68 entries (hsk_level = 0, hsk_standard = 'Curriculum Supplementary')
- Total in DB: 1,068 entries.
"""

import json
import csv
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT_DIR, "data", "hsk30")
MIGRATION_OUT = os.path.join(ROOT_DIR, "backend", "src", "main", "resources", "db", "migration", "V23__standardize_hsk_1_to_3_vocabulary_2025.sql")

# Load official items
hsk_official = {}
for lvl in [1, 2, 3]:
    p = os.path.join(DATA_DIR, f"hsk-{lvl}.json")
    with open(p, "r", encoding="utf-8") as f:
        items = json.load(f)
        for it in items:
            hsk_official[it['id']] = it

print(f"Loaded {len(hsk_official)} official HSK 1-3 entries.")

# Helper to normalize pinyin to toneless
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

# Load current DB items
sys.path.append(os.path.join(ROOT_DIR, "scripts"))
from audit_meanings import current_db

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

for (hanzi, pinyin_raw), rec in current_db.items():
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

print(f"Matched existing: {len(matched_records)}")
print(f"Supplementary: {len(unmatched_records)}")
missing_official_ids = sorted([it_id for it_id in hsk_official.keys() if it_id not in assigned_official_ids])
print(f"Missing official items to insert: {len(missing_official_ids)}")

print("Setup completed successfully.")
