import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Load SEED_RADICALS
f = open('frontend/js/api/demo-seed-data.js', encoding='utf-8').read()
m = re.search(r'export const SEED_RADICALS = (\[.*?\]);\s*export', f, re.DOTALL)
seed_rads = json.loads(m.group(1))
rmap = {r['radicalId']: r for r in seed_rads}

# Unicode Kangxi Radicals block is U+2F00 to U+2FD5 (1 to 214)
# Let's map each radical to its canonical Kangxi Radical codepoint
check_ids = [61, 64, 85, 149, 163, 167, 170, 184]
print("--- Key Variant Radicals ---")
for cid in check_ids:
    r = rmap[cid]
    kangxi_codepoint = f"U+{0x2F00 + cid - 1:04X}"
    kangxi_char = chr(0x2F00 + cid - 1)
    print(f"Radical {r['radicalId']} | Char: {r['character']} | Kangxi: {kangxi_char} ({kangxi_codepoint}) | Pinyin: {r['pinyin']} | Hán-Việt: {r['meaningHanViet']} | Nghĩa: {r['meaningVi']} | Nét: {r.get('strokeCount')}")

# Also check all 214 radicals for any inconsistencies
print("\n--- Auditing All 214 Radicals ---")
total_count = len(seed_rads)
verified_count = 0
issues = []

for r in seed_rads:
    rid = r['radicalId']
    ch = r['character']
    py = r['pinyin']
    hv = r['meaningHanViet']
    vi = r['meaningVi']
    sc = r.get('strokeCount')
    
    # Expected stroke count by Kangxi division
    if rid <= 6: expected_sc = 1
    elif rid <= 29: expected_sc = 2
    elif rid <= 60: expected_sc = 3
    elif rid <= 94: expected_sc = 4
    elif rid <= 117: expected_sc = 5
    elif rid <= 146: expected_sc = 6
    elif rid <= 166: expected_sc = 7
    elif rid <= 175: expected_sc = 8
    elif rid <= 186: expected_sc = 9
    elif rid <= 194: expected_sc = 10
    elif rid <= 200: expected_sc = 11
    elif rid <= 204: expected_sc = 12
    elif rid <= 208: expected_sc = 13
    elif rid <= 210: expected_sc = 14
    elif rid == 211: expected_sc = 15
    elif rid <= 213: expected_sc = 16
    else: expected_sc = 17
    
    if sc != expected_sc:
        issues.append(f"ID {rid} ({ch}): strokeCount {sc} != expected {expected_sc}")
    if not py or not hv or not vi:
        issues.append(f"ID {rid} ({ch}): missing field")
    
    verified_count += 1

print(f"Total radicals checked: {total_count}")
print(f"Verified Kangxi stroke counts: {verified_count - len(issues)}/{total_count}")
print(f"Issues found: {len(issues)}")
