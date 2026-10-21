import json
import csv
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = "data/hsk30"

# Load official items
hsk_official = []
for lvl in [1, 2, 3]:
    p = os.path.join(DATA_DIR, f"hsk-{lvl}.json")
    with open(p, "r", encoding="utf-8") as f:
        items = json.load(f)
        for it in items:
            it['level_int'] = int(it['level'])
            hsk_official.append(it)

print(f"Loaded {len(hsk_official)} official HSK items (IDs {hsk_official[0]['id']}..{hsk_official[-1]['id']})")

# Let's inspect all items with homograph marker or polyphones
homograph_items = [it for it in hsk_official if it.get('homograph') is not None]
print(f"Homograph items count: {len(homograph_items)}")
for h in homograph_items:
    print(f"  ID {h['id']}: {h['hanzi']} ({h['pinyin']}) - homograph: {h['homograph']}, pos: {h['part_of_speech']}, level: {h['level_label']}")

