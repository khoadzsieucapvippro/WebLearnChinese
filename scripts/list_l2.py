# -*- coding: utf-8 -*-
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('data/hsk30/missing_568_raw.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

l2_items = [it for it in items if int(it['level']) == 2]
print(f"L2 items count: {len(l2_items)}")
for it in l2_items:
    print(f"{it['id']}, {it['hanzi']}, {it['pinyin']}, {it['part_of_speech']}")
