# -*- coding: utf-8 -*-
"""
Helper script to export all 423 HSK 3 missing items into a clean JSON structure
for rapid enrichment and review.
"""

import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('data/hsk30/missing_568_raw.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

l3_items = [it for it in items if int(it['level']) == 3]
print(f"L3 count: {len(l3_items)}")

with open('data/hsk30/drkameleon-hsk3.json', 'r', encoding='utf-8') as f:
    drk = {it['simplified']: it for it in json.load(f)}

export_list = []
for it in l3_items:
    d = drk.get(it['hanzi'])
    meanings = []
    if d:
        for form in d.get('forms', []):
            meanings.extend(form.get('meanings', []))
    export_list.append({
        'id': it['id'],
        'hanzi': it['hanzi'],
        'pinyin': it['pinyin'],
        'pos': it['part_of_speech'],
        'en_meanings': meanings[:3]
    })

with open('data/hsk30/l3_to_enrich.json', 'w', encoding='utf-8') as f:
    json.dump(export_list, f, ensure_ascii=False, indent=2)

print("Exported to data/hsk30/l3_to_enrich.json")
