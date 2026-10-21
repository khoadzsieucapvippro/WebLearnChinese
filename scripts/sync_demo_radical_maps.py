import sys
import os
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
demo_file = os.path.join(ROOT_DIR, 'frontend', 'js', 'api', 'demo-seed-data.js')

with open(demo_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Load SEED_RADICALS
m_rads = re.search(r'export const SEED_RADICALS = (\[.*?\]);\s*export', content, re.DOTALL)
seed_rads = json.loads(m_rads.group(1))

supplements = {
    '⺀': 15, '⺈': 18, '⺊': 25, '⺌': 42, '⺍': 42, '⺗': 61, '⺮': 118, '⺳': 122, '⺼': 130, '⺾': 140,
    '⻏': 163, '⻖': 170, '⻡': 162, '⻢': 187, '⻦': 196, '⻪': 195, '⻱': 212, '⻲': 213, '⻳': 213,
    '乚': 5, '丷': 12, '乛': 5, '户': 63, '母': 80, '氺': 85, '爫': 87, '王': 96, '耂': 125, '西': 146, '覀': 146, '马': 187
}
rad_char_to_id = {}
for r in seed_rads:
    rid = r['radicalId']
    chars = re.findall(r'[\u4e00-\u9fff\u2e80-\u2eff\u3400-\u4dbf]', r['character'])
    for ch in chars:
        rad_char_to_id[ch] = rid
rad_char_to_id.update(supplements)

dict_chars = {}
with open(os.path.join(ROOT_DIR, 'data', 'hsk30', 'makemeahanzi_dict.txt'), 'r', encoding='utf-8') as f:
    for line in f:
        item = json.loads(line)
        c = item.get('character')
        if c: dict_chars[c] = item

def get_canonical_kangxi_radical_id(char):
    if char in dict_chars:
        rad_char = dict_chars[char].get('radical')
        if rad_char in rad_char_to_id:
            return rad_char_to_id[rad_char]
    return rad_char_to_id.get(char)

# Existing CHAR_TO_RADICAL_MAP
m1 = re.search(r'export const CHAR_TO_RADICAL_MAP = Object\.freeze\(([^\;]+)\);', content)
existing_primary = json.loads(m1.group(1))

# Extract all characters from CHAR_TO_RADICALS_MAP as well
m2 = re.search(r'export const CHAR_TO_RADICALS_MAP = Object\.freeze\(([^\;]+)\);', content)
existing_rads = json.loads(m2.group(1))

all_chars = set(existing_primary.keys()) | set(existing_rads.keys())
for lvl in [1, 2, 3]:
    with open(os.path.join(ROOT_DIR, 'data', 'hsk30', f'hsk-{lvl}.json'), 'r', encoding='utf-8') as f:
        for it in json.load(f):
            for c in it.get('hanzi', ''):
                if '\u4e00' <= c <= '\u9fff':
                    all_chars.add(c)

full_primary_map = {}
for c in sorted(all_chars):
    canon = get_canonical_kangxi_radical_id(c)
    if canon is not None:
        full_primary_map[c] = canon
    elif c in existing_primary:
        full_primary_map[c] = existing_primary[c]

print(f"Total keys in enriched CHAR_TO_RADICAL_MAP: {len(full_primary_map)}")

# Format JSON nicely
formatted_json = json.dumps(full_primary_map, ensure_ascii=False, indent=2)

# Replace in content
target_pattern = r'export const CHAR_TO_RADICAL_MAP = Object\.freeze\([^\;]+\);'
replacement = f'export const CHAR_TO_RADICAL_MAP = Object.freeze({formatted_json});'

new_content = re.sub(target_pattern, replacement, content)

with open(demo_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Successfully updated CHAR_TO_RADICAL_MAP in {demo_file}!")
