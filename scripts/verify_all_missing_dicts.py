# -*- coding: utf-8 -*-
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.path.append('scripts')

from missing_hsk1 import HSK1_DATA
from missing_hsk2 import HSK2_DATA
from hsk3_dict_p1 import HSK3_DICT_P1
from hsk3_dict_p2 import HSK3_DICT_P2
from hsk3_dict_p3 import HSK3_DICT_P3

all_l3 = {}
all_l3.update(HSK3_DICT_P1)
all_l3.update(HSK3_DICT_P2)
all_l3.update(HSK3_DICT_P3)

with open('data/hsk30/missing_568_raw.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

l1_items = [it for it in items if int(it['level']) == 1]
l2_items = [it for it in items if int(it['level']) == 2]
l3_items = [it for it in items if int(it['level']) == 3]

print(f"Total missing: {len(items)}")
print(f"L1 raw: {len(l1_items)}, HSK1_DATA: {len(HSK1_DATA)}")
print(f"L2 raw: {len(l2_items)}, HSK2_DATA: {len(HSK2_DATA)}")
print(f"L3 raw: {len(l3_items)}, HSK3_DATA: {len(all_l3)}")

l1_missing = [it for it in l1_items if it['hanzi'] not in HSK1_DATA]
l2_missing = [it for it in l2_items if it['id'] not in HSK2_DATA]
l3_missing = [it for it in l3_items if it['id'] not in all_l3]

print(f"L1 unmapped: {len(l1_missing)}")
print(f"L2 unmapped: {len(l2_missing)}")
print(f"L3 unmapped: {len(l3_missing)}")

if l1_missing:
    print("L1 unmapped items:", [it['hanzi'] for it in l1_missing])
if l2_missing:
    print("L2 unmapped items:", [(it['id'], it['hanzi']) for it in l2_missing])
if l3_missing:
    print("L3 unmapped items:", [(it['id'], it['hanzi']) for it in l3_missing])
