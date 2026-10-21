import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

# Read CHAR_TO_RADICAL_MAP from demo-seed-data.js
f_demo = open('frontend/js/api/demo-seed-data.js', encoding='utf-8').read()
m1 = re.search(r'export const CHAR_TO_RADICAL_MAP = Object\.freeze\(([^\;]+)\);', f_demo)
primary_map = json.loads(m1.group(1))

# Read V22
f22 = open('backend/src/main/resources/db/migration/V22__audit_and_update_vocabulary_radicals.sql', encoding='utf-8').read()
pattern = re.compile(r"SELECT\s+'([^']+)'\s+AS\s+`hanzi`,\s+'([^']+)'\s+AS\s+`pinyin_raw`,\s+(\d+)\s+AS\s+`radical_id`,\s+'([^']+)'\s+AS\s+`hanzi_char`")
v22_rows = pattern.findall(f22)
print(f"Total V22 rows: {len(v22_rows)}")

kangxi_count = 0
struct_count = 0
unmatched_chars = set()

for h, p, r_id, c in v22_rows:
    rid = int(r_id)
    prim = primary_map.get(c)
    if prim is None:
        unmatched_chars.add(c)
    elif prim == rid:
        kangxi_count += 1
    else:
        struct_count += 1

print(f"V22 breakdown: {kangxi_count} kangxi_radical, {struct_count} structural_component, {len(unmatched_chars)} unmatched")
if unmatched_chars:
    print(f"Unmatched chars in V22: {unmatched_chars}")

# Read V24 additions
f24 = open('backend/src/main/resources/db/migration/V24__add_radical_stroke_count_and_expand_vocab_radical_pk.sql', encoding='utf-8').read()
pattern24 = re.compile(r"SELECT\s+(\d+)\s+AS\s+`hsk_source_id`,\s+(\d+)\s+AS\s+`radical_id`,\s+'([^']+)'\s+AS\s+`hanzi_char`")
v24_rows = pattern24.findall(f24)
print(f"\nTotal V24 inserted rows: {len(v24_rows)}")

v24_kangxi = 0
v24_struct = 0
v24_unmatched = set()

for src_id, r_id, c in v24_rows:
    rid = int(r_id)
    prim = primary_map.get(c)
    if prim is None:
        v24_unmatched.add(c)
    elif prim == rid:
        v24_kangxi += 1
    else:
        v24_struct += 1

print(f"V24 breakdown: {v24_kangxi} kangxi_radical, {v24_struct} structural_component, {len(v24_unmatched)} unmatched")
if v24_unmatched:
    print(f"Unmatched chars in V24: {v24_unmatched}")
