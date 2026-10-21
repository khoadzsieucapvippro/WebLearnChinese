import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

from audit_meanings import current_db

DATA_DIR = "data/hsk30"

hsk_official = {}
hsk_by_hanzi = {}
for lvl in [1, 2, 3]:
    with open(os.path.join(DATA_DIR, f"hsk-{lvl}.json"), "r", encoding="utf-8") as f:
        items = json.load(f)
        for it in items:
            hsk_official[it['id']] = it
            hsk_by_hanzi.setdefault(it['hanzi'], []).append(it)

pinyin_diffs = []
for (hanzi, pinyin_raw), rec in current_db.items():
    if hanzi in hsk_by_hanzi:
        official_matches = hsk_by_hanzi[hanzi]
        # Check if rec['pinyin'] matches any official pinyin
        matched = False
        for off in official_matches:
            if rec['pinyin'] == off['pinyin']:
                matched = True
                break
        if not matched:
            pinyin_diffs.append((hanzi, rec, official_matches))

print(f"Total current items with Pinyin difference from official: {len(pinyin_diffs)}")
for hanzi, rec, off_list in pinyin_diffs:
    off_str = ", ".join([f"ID {o['id']} (L{o['level']}): pinyin='{o['pinyin']}' pos='{o['part_of_speech']}'" for o in off_list])
    print(f"  {hanzi}: DB='{rec['pinyin']}' ({rec['pinyin_raw']}) vs Official=[{off_str}]")
