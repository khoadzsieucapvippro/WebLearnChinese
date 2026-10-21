import json
import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.path.append('scripts')
from missing_hsk3_p1 import HSK3_P1

with open('data/hsk30/l3_to_enrich.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

p1 = [it for it in items if it['id'] <= 650]
missing_ids = [it['id'] for it in p1 if it['id'] not in HSK3_P1]
for i in missing_ids:
    it = next(x for x in p1 if x['id'] == i)
    print(f"{it['id']}: {it['hanzi']} ({it['pinyin']})")
