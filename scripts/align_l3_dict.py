# -*- coding: utf-8 -*-
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.path.append('scripts')

from hsk3_dict_p1 import HSK3_DICT_P1
from hsk3_dict_p2 import HSK3_DICT_P2
from hsk3_dict_p3 import HSK3_DICT_P3

all_l3_raw = {}
all_l3_raw.update(HSK3_DICT_P1)
all_l3_raw.update(HSK3_DICT_P2)
all_l3_raw.update(HSK3_DICT_P3)

with open('data/hsk30/l3_to_enrich.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

# Build a list of definitions in order
defs_list = []
for k in sorted(all_l3_raw.keys()):
    defs_list.append(all_l3_raw[k])

print(f"Total defs: {len(defs_list)}, Total target L3 items: {len(items)}")

# Check: Can we map by searching hanzi in example_sentence or matching meaning?
aligned_dict = {}
unmatched_items = []

# Map by hanzi matching: for each def, find which hanzi in items it contains
def_by_hanzi = {}
for d in defs_list:
    ex = d['example_sentence']
    # Check which target item hanzi is in ex
    matches = [it for it in items if it['hanzi'] in ex]
    if len(matches) == 1:
        def_by_hanzi[matches[0]['id']] = d
    elif len(matches) > 1:
        # Sort by length of hanzi descending
        matches.sort(key=lambda x: len(x['hanzi']), reverse=True)
        # We can also check if pinyin matches
        def_by_hanzi[matches[0]['id']] = d

print(f"Directly matched: {len(def_by_hanzi)} / {len(items)}")

unmatched = [it for it in items if it['id'] not in def_by_hanzi]
print(f"Unmatched items count: {len(unmatched)}")
for u in unmatched:
    print(f"  Unmatched: {u['id']} {u['hanzi']} ({u['pinyin']})")
