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

sorted_keys = sorted(all_l3_raw.keys())
matched_order = 0
for i in range(len(items)):
    it = items[i]
    d = all_l3_raw[sorted_keys[i]]
    if it['hanzi'] in d['example_sentence']:
        matched_order += 1
    else:
        print(f"Mismatch at index {i}: target={it['hanzi']} (id={it['id']}), def key={sorted_keys[i]}, sentence={d['example_sentence']}")
        if i >= 10:
            break

print(f"Matched in exact same index order: {matched_order} / {len(items)}")
