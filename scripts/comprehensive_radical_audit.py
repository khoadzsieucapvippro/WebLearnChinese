import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

# 1. Load SEED_RADICALS
f_demo = open('frontend/js/api/demo-seed-data.js', encoding='utf-8').read()
m_rads = re.search(r'export const SEED_RADICALS = (\[.*?\]);\s*export', f_demo, re.DOTALL)
seed_rads = json.loads(m_rads.group(1))
rad_by_id = {r['radicalId']: r for r in seed_rads}

# 2. Build canonical map from Make Me a Hanzi dictionary
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
with open('data/hsk30/makemeahanzi_dict.txt', 'r', encoding='utf-8') as f:
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

# 3. Check all V23 rows
f23 = open('backend/src/main/resources/db/migration/V23__standardize_hsk_1_to_3_vocabulary_2025.sql', encoding='utf-8').read()
v23_matches = re.findall(r"SELECT\s+(\d+)\s+AS\s+`hsk_source_id`,\s+(\d+)\s+AS\s+`radical_id`,\s+'([^']+)'\s+AS\s+`hanzi_char`", f23)
print(f"V23 inserted rows: {len(v23_matches)}")

v23_invalid_rids = []
v23_kangxi = 0
v23_struct = 0

for src_id, r_id, c in v23_matches:
    rid = int(r_id)
    if rid not in rad_by_id:
        v23_invalid_rids.append((src_id, rid))
    canon = get_canonical_kangxi_radical_id(c)
    if canon == rid:
        v23_kangxi += 1
    else:
        v23_struct += 1

print(f"V23 Analysis:")
print(f"  Invalid radical IDs: {len(v23_invalid_rids)}")
print(f"  Canonical Kangxi radicals: {v23_kangxi}")
print(f"  Structural components: {v23_struct}")

# 4. Check all V24 rows
f24 = open('backend/src/main/resources/db/migration/V24__add_radical_stroke_count_and_expand_vocab_radical_pk.sql', encoding='utf-8').read()
v24_matches = re.findall(r"SELECT\s+(\d+)\s+AS\s+`hsk_source_id`,\s+(\d+)\s+AS\s+`radical_id`,\s+'([^']+)'\s+AS\s+`hanzi_char`", f24)
print(f"\nV24 inserted rows: {len(v24_matches)}")

v24_invalid_rids = []
v24_kangxi = 0
v24_struct = 0

for src_id, r_id, c in v24_matches:
    rid = int(r_id)
    if rid not in rad_by_id:
        v24_invalid_rids.append((src_id, rid))
    canon = get_canonical_kangxi_radical_id(c)
    if canon == rid:
        v24_kangxi += 1
    else:
        v24_struct += 1

print(f"V24 Analysis:")
print(f"  Invalid radical IDs: {len(v24_invalid_rids)}")
print(f"  Canonical Kangxi radicals: {v24_kangxi}")
print(f"  Structural components: {v24_struct}")

print(f"\nTotal across V22+V23+V24: {len(re.findall(r'SELECT', f22)) + len(v23_matches) + len(v24_matches)} rows")
print(f"Total Canonical Kangxi Radicals: {787 + v23_kangxi + v24_kangxi}")
print(f"Total Structural Components: {858 + v23_struct + v24_struct}")
