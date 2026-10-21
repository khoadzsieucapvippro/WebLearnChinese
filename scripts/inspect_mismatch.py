# -*- coding: utf-8 -*-
import sys, json
sys.stdout.reconfigure(encoding='utf-8')
sys.path.append('scripts')
from hsk3_dict_p1 import HSK3_DICT_P1
from hsk3_dict_p2 import HSK3_DICT_P2
from hsk3_dict_p3 import HSK3_DICT_P3

all_defs = list(HSK3_DICT_P1.values()) + list(HSK3_DICT_P2.values()) + list(HSK3_DICT_P3.values())

with open('data/hsk30/l3_to_enrich.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

print(f"len all_defs: {len(all_defs)}, len items: {len(items)}")

exact_matches = 0
for i in range(len(items)):
    it = items[i]
    d = all_defs[i]
    if it['hanzi'] in d['example_sentence']:
        exact_matches += 1
    else:
        print(f"Index {i}: target={it['id']} {it['hanzi']} ({it['pinyin']}) vs def_mean={d['meaning_vi']} | def_ex={d['example_sentence']}")

print(f"Sequential 1:1 match: {exact_matches} / {len(items)}")
