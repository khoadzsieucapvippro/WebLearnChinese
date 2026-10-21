import json
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Read CHAR_TO_RADICALS_MAP from demo-seed-data.js
with open("frontend/js/api/demo-seed-data.js", "r", encoding="utf-8") as f:
    text = f.read()

# Extract CHAR_TO_RADICALS_MAP
match = re.search(r'export const CHAR_TO_RADICALS_MAP = Object\.freeze\((\{.*?\})\);', text, re.DOTALL)
if match:
    char_to_radicals = json.loads(match.group(1))
    print(f"Loaded CHAR_TO_RADICALS_MAP: {len(char_to_radicals)} characters")
else:
    print("Could not parse CHAR_TO_RADICALS_MAP")
    sys.exit(1)

# Check coverage for all 1000 HSK items
DATA_DIR = "data/hsk30"
hsk_items = []
for lvl in [1, 2, 3]:
    with open(os.path.join(DATA_DIR, f"hsk-{lvl}.json"), "r", encoding="utf-8") as f:
        hsk_items.extend(json.load(f))

all_chars = set(c for item in hsk_items for c in item['hanzi'])
missing_chars = [c for c in all_chars if c not in char_to_radicals]

print(f"Total unique characters across 1000 HSK items: {len(all_chars)}")
print(f"Characters covered in CHAR_TO_RADICALS_MAP: {len(all_chars) - len(missing_chars)}")
print(f"Characters missing from CHAR_TO_RADICALS_MAP: {len(missing_chars)} -> {sorted(missing_chars)}")
