import json
import csv
import re
import os
import sys
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = "data/hsk30"

# Load official items
hsk_official = {}
for lvl in [1, 2, 3]:
    with open(os.path.join(DATA_DIR, f"hsk-{lvl}.json"), "r", encoding="utf-8") as f:
        items = json.load(f)
        for it in items:
            hsk_official[it['id']] = it

from audit_meanings import current_db

# Helper to normalize pinyin to toneless
def to_raw(p):
    # simple toneless
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

# Index official items by (hanzi, pinyin_raw)
official_by_hanzi_raw = {}
official_by_hanzi = {}
for off_id, it in hsk_official.items():
    raw = to_raw(it['pinyin'])
    it['computed_raw'] = raw
    official_by_hanzi_raw.setdefault((it['hanzi'], raw), []).append(it)
    official_by_hanzi.setdefault(it['hanzi'], []).append(it)

# Map each DB record to official
matched_records = []
unmatched_records = []
assigned_official_ids = set()

# Explicit disambiguation for identical (hanzi, raw) in official dataset:
# In official dataset, only these have identical (hanzi, raw):
# - '过': ID 347 (guò, 动) vs ID 351 (guo, 助). DB record '过' has example '你去过中国吗' -> ID 351 (助)
# - '花': ID 357 (huā, 动) vs ID 358 (huā, 名). DB record '花' has example '公园里有很多美丽的花' -> ID 358 (名)
# - '得': ID 332 (de, 助) vs ID 583 (dé, 动). DB record '得' (de) has example '跑得很快' -> ID 332 (助)
# - '点': ID 33 (diǎn, 量) vs ID 336 (diǎn, 动). DB record '点' has example '八点整' -> ID 33 (量)
# - '会': ID 82 (huì, 动) vs ID 683 (huì, 名). DB record '会' has example '我会说' -> ID 82 (动)
# - '站': ID 486 (zhàn, 名) vs ID 966 (zhàn, 动). DB record '站' has example '下一站' -> ID 486 (名)
# - '过去': ID 350 (guòqù, 动) vs ID 660 (guòqù, 名). DB record '过去' has example '过去的事情' -> ID 660 (名)

HOMOGRAPH_PREFERENCE = {
    '过': 351,
    '花': 358,
    '得': 332,
    '点': 33,
    '会': 82,
    '站': 486,
    '过去': 660,
}

for (hanzi, pinyin_raw), rec in current_db.items():
    db_raw = to_raw(rec['pinyin'])
    
    # Try exact match on (hanzi, db_raw)
    candidates = official_by_hanzi_raw.get((hanzi, db_raw), [])
    
    # Special check: e.g. 干 (gān vs gàn) -> in official HSK 1-3 only gàn (ID 640) is present.
    # If DB is ('干', 'gan') [pinyin='gān'], it is HSK 4 (supplementary)!
    if hanzi == '干':
        if rec['pinyin_raw'] == 'gan' or rec['pinyin'] == 'gān':
            candidates = [] # supplementary (HSK 4)
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

print(f"Matched DB records: {len(matched_records)}")
print(f"Unmatched DB records (supplementary): {len(unmatched_records)}")
print(f"Assigned official IDs: {len(assigned_official_ids)}")

c = Counter(o['id'] for _, o in matched_records)
dups = {k: v for k, v in c.items() if v > 1}
print(f"Duplicate official IDs assigned: {dups}")

missing_official_ids = [it_id for it_id in hsk_official.keys() if it_id not in assigned_official_ids]
print(f"Missing official IDs to insert: {len(missing_official_ids)}")

missing_by_lvl = {1: 0, 2: 0, 3: 0}
for it_id in missing_official_ids:
    missing_by_lvl[int(hsk_official[it_id]['level'])] += 1

matched_l1 = sum(1 for _, o in matched_records if int(o['level']) == 1)
matched_l2 = sum(1 for _, o in matched_records if int(o['level']) == 2)
matched_l3 = sum(1 for _, o in matched_records if int(o['level']) == 3)

print(f"\nFinal Tally Verification:")
print(f"  Level 1: {matched_l1} existing + {missing_by_lvl[1]} new = {matched_l1 + missing_by_lvl[1]} (Target: 300)")
print(f"  Level 2: {matched_l2} existing + {missing_by_lvl[2]} new = {matched_l2 + missing_by_lvl[2]} (Target: 200)")
print(f"  Level 3: {matched_l3} existing + {missing_by_lvl[3]} new = {matched_l3 + missing_by_lvl[3]} (Target: 500)")
print(f"  Total official HSK 1-3: {matched_l1 + missing_by_lvl[1] + matched_l2 + missing_by_lvl[2] + matched_l3 + missing_by_lvl[3]} (Target: 1000)")
print(f"  Supplementary (non-HSK 1-3 preserved): {len(unmatched_records)}")
print(f"  Total records in database: {1000 + len(unmatched_records)}")
