import sys
import os
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load SEED_RADICALS
f_demo = open(os.path.join(ROOT_DIR, 'frontend', 'js', 'api', 'demo-seed-data.js'), encoding='utf-8').read()
m_rads = re.search(r'export const SEED_RADICALS = (\[.*?\]);\s*export', f_demo, re.DOTALL)
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

# Also load existing CHAR_TO_RADICAL_MAP from demo-seed-data.js to combine
m1 = re.search(r'export const CHAR_TO_RADICAL_MAP = Object\.freeze\(([^\;]+)\);', f_demo)
existing_primary = json.loads(m1.group(1))

# Extract all unique characters from HSK 1-3
all_chars = set(existing_primary.keys())
for lvl in [1, 2, 3]:
    with open(os.path.join(ROOT_DIR, 'data', 'hsk30', f'hsk-{lvl}.json'), 'r', encoding='utf-8') as f:
        for it in json.load(f):
            for c in it.get('hanzi', ''):
                if '\u4e00' <= c <= '\u9fff':
                    all_chars.add(c)

# Build full unified primary Kangxi map
full_primary_map = {}
for c in sorted(all_chars):
    # Prefer dictionary canonical
    canon = get_canonical_kangxi_radical_id(c)
    if canon is not None:
        full_primary_map[c] = canon
    elif c in existing_primary:
        full_primary_map[c] = existing_primary[c]

print(f"Total characters in full_primary_map: {len(full_primary_map)}")

# Generate Migration V25
v25_file = os.path.join(ROOT_DIR, 'backend', 'src', 'main', 'resources', 'db', 'migration', 'V25__classify_vocab_radicals_and_structural_components.sql')

lines = []
lines.append("-- =============================================================================")
lines.append("-- Migration: V25__classify_vocab_radicals_and_structural_components.sql")
lines.append("-- Description:")
lines.append("--   1. Backfill hanzi_char for single-character words where missing/empty")
lines.append("--   2. Classify constituent components in VOCAB_RADICAL into:")
lines.append("--      - 'kangxi_radical' (authoritative Kangxi lookup radical per Unihan/Make Me a Hanzi)")
lines.append("--      - 'structural_component' (decomposed IDS structural components)")
lines.append("--   3. Ensure verification_status = 'verified'")
lines.append("-- Database: MySQL 8.4+")
lines.append("-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci")
lines.append("-- =============================================================================")
lines.append("")
lines.append("-- -----------------------------------------------------------------------------")
lines.append("-- Step 1: Backfill hanzi_char for single-character words where empty")
lines.append("-- -----------------------------------------------------------------------------")
lines.append("UPDATE `VOCAB_RADICAL` vr")
lines.append("JOIN `VOCABULARY` v ON vr.`vocab_id` = v.`vocab_id`")
lines.append("SET vr.`hanzi_char` = v.`hanzi`")
lines.append("WHERE (vr.`hanzi_char` = '' OR vr.`hanzi_char` IS NULL) AND CHAR_LENGTH(v.`hanzi`) = 1;")
lines.append("")
lines.append("-- -----------------------------------------------------------------------------")
lines.append("-- Step 2: Set baseline: default all associations to structural_component")
lines.append("-- -----------------------------------------------------------------------------")
lines.append("UPDATE `VOCAB_RADICAL`")
lines.append("SET `component_type` = 'structural_component', `verification_status` = 'verified';")
lines.append("")
lines.append("-- -----------------------------------------------------------------------------")
lines.append("-- Step 3: Classify primary Kangxi radicals based on authoritative Unicode/Make Me a Hanzi")
lines.append("-- -----------------------------------------------------------------------------")

# Split into chunks of 100 for clean SQL readability and performance
chunk_size = 100
items = sorted(full_primary_map.items())

for i in range(0, len(items), chunk_size):
    chunk = items[i:i+chunk_size]
    lines.append("UPDATE `VOCAB_RADICAL` vr")
    lines.append("JOIN (")
    union_parts = []
    for c, rid in chunk:
        union_parts.append(f"  SELECT '{c}' AS `hanzi_char`, {rid} AS `radical_id`")
    lines.append(" UNION ALL\n".join(union_parts))
    lines.append(") km ON vr.`hanzi_char` = km.`hanzi_char` AND vr.`radical_id` = km.`radical_id`")
    lines.append("SET vr.`component_type` = 'kangxi_radical', vr.`verification_status` = 'verified';")
    lines.append("")

with open(v25_file, 'w', encoding='utf-8') as f:
    f.write("\n".join(lines) + "\n")

print(f"Successfully generated {v25_file} with {len(items)} canonical mappings.")
