import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = "data/hsk30"

# Load official HSK 1-3 items
hsk_official = []
for lvl in [1, 2, 3]:
    with open(os.path.join(DATA_DIR, f"hsk-{lvl}.json"), "r", encoding="utf-8") as f:
        hsk_official.extend(json.load(f))

# Load current DB items from parse_current_seed
from audit_meanings import current_db

# Load Sino-Viet character map
with open(os.path.join(DATA_DIR, "sino-viet-characters.json"), "r", encoding="utf-8") as f:
    sino_viet_chars = json.load(f)
char_sv_map = {c['hanzi']: c['sinoViet'] for c in sino_viet_chars}

# Check missing words
existing_hanzi = set(k[0] for k in current_db.keys())
missing_items = [it for it in hsk_official if it['hanzi'] not in existing_hanzi]
print(f"Total official items: {len(hsk_official)}")
print(f"Items already in DB: {len(hsk_official) - len(missing_items)}")
print(f"Items missing from DB: {len(missing_items)}")

# Check character coverage for Sino-Viet
missing_chars = set()
for it in missing_items:
    for char in it['hanzi']:
        if char not in char_sv_map:
            missing_chars.add(char)

print(f"Unique characters in missing items: {len(set(c for it in missing_items for c in it['hanzi']))}")
print(f"Characters missing from char_sv_map: {len(missing_chars)} -> {sorted(list(missing_chars))}")
