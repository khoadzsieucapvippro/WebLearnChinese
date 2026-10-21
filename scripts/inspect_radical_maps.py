import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

f = open('frontend/js/api/demo-seed-data.js', encoding='utf-8').read()

m1 = re.search(r'export const CHAR_TO_RADICAL_MAP = Object\.freeze\((\{.*?\})\);', f, re.DOTALL)
if m1:
    m1_obj = json.loads(m1.group(1))
    print(f'CHAR_TO_RADICAL_MAP has {len(m1_obj)} entries')
    for c in ['车', '茶', '学']:
        print(f'  {c}: {m1_obj.get(c)}')
else:
    print('CHAR_TO_RADICAL_MAP not matched')

m2 = re.search(r'export const CHAR_TO_RADICALS_MAP = Object\.freeze\((\{.*?\})\);', f, re.DOTALL)
if m2:
    m2_obj = json.loads(m2.group(1))
    print(f'CHAR_TO_RADICALS_MAP has {len(m2_obj)} entries')
    for c in ['车', '茶', '学']:
        print(f'  {c}: {m2_obj.get(c)}')
else:
    print('CHAR_TO_RADICALS_MAP not matched')
