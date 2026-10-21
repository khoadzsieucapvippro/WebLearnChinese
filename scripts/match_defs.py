# -*- coding: utf-8 -*-
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.path.append('scripts')

from hsk3_dict_p1 import HSK3_DICT_P1
from hsk3_dict_p2 import HSK3_DICT_P2
from hsk3_dict_p3 import HSK3_DICT_P3

all_defs = list(HSK3_DICT_P1.values()) + list(HSK3_DICT_P2.values()) + list(HSK3_DICT_P3.values())

with open('data/hsk30/l3_to_enrich.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

print(f"Total defs: {len(all_defs)}, Total target items: {len(items)}")

# Match each item to the best definition
# Strategy: find definition where item['hanzi'] is in example_sentence.
# If multiple definitions match, match the one where item['hanzi'] is most specific or meaning matches.
matched_map = {}
unmatched_items = []
used_defs = set()

# First pass: sort items by length of hanzi descending (longer words first so 出租车 matches before 车, etc.)
sorted_items = sorted(items, key=lambda x: len(x['hanzi']), reverse=True)

for it in sorted_items:
    cands = []
    for idx, d in enumerate(all_defs):
        if idx in used_defs:
            continue
        # Check if hanzi in example_sentence
        if it['hanzi'] in d['example_sentence']:
            cands.append((idx, d))
    
    if len(cands) == 1:
        chosen_idx, chosen_d = cands[0]
        used_defs.add(chosen_idx)
        matched_map[it['id']] = chosen_d
    elif len(cands) > 1:
        # If multiple, check if meaning or hanzi matches
        # Prefer where it['hanzi'] is at the start or exact match
        chosen_idx, chosen_d = cands[0]
        used_defs.add(chosen_idx)
        matched_map[it['id']] = chosen_d
    else:
        unmatched_items.append(it)

print(f"Matched: {len(matched_map)} / {len(items)}")
print(f"Unmatched items: {len(unmatched_items)}")
for u in unmatched_items:
    print(f"  Unmatched: {u['id']} {u['hanzi']} ({u['pinyin']})")

unused_defs = [d for idx, d in enumerate(all_defs) if idx not in used_defs]
print(f"Unused defs: {len(unused_defs)}")
for d in unused_defs:
    print(f"  Unused: {d['meaning_vi']} | {d['example_sentence']}")
