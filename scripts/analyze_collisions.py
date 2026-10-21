import os, sys, json, re
sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/js/api/demo-seed-data.js', 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'export const CHAR_TO_RADICALS_MAP = Object\.freeze\((\{.*?\})\);', text, re.DOTALL)
char_to_rads = json.loads(m.group(1))

DATA_DIR = 'data/hsk30'
hsk_items = []
for lvl in [1, 2, 3]:
    with open(os.path.join(DATA_DIR, f'hsk-{lvl}.json'), 'r', encoding='utf-8') as f:
        hsk_items.extend(json.load(f))

m2 = re.search(r'export const SEED_RADICALS = (\[.*?\]);\s*export', text, re.DOTALL)
rads = {r['radicalId']: r for r in json.loads(m2.group(1))}

total = 0
for item in hsk_items:
    hanzi = item['hanzi']
    if len(hanzi) > 1:
        seen = {}
        for char in hanzi:
            for rid in char_to_rads.get(char, []):
                if rid in seen:
                    total += 1
                    rname = rads.get(rid, {}).get('meaningHanViet', '')
                    rchar = rads.get(rid, {}).get('character', '')
                    print(f"HSK {item['id']}: {hanzi} -> Radical #{rid} {rchar} ({rname}) in '{seen[rid]}' AND in '{char}'")
                else:
                    seen[rid] = char

print(f"Total multi-char collisions: {total}")
