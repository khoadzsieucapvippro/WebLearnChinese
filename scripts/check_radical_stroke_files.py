import os
import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STROKES_DIR = os.path.join(ROOT_DIR, "frontend", "assets", "data", "strokes")

f = open(os.path.join(ROOT_DIR, 'frontend', 'js', 'api', 'demo-seed-data.js'), encoding='utf-8').read()
m = re.search(r'export const SEED_RADICALS = (\[.*?\]);\s*export', f, re.DOTALL)
seed_rads = json.loads(m.group(1))

missing_rads = []
valid_rads = 0

for r in seed_rads:
    rid = r['radicalId']
    # Extract Hanzi characters from character string (e.g. '人(亻)' -> '人', '亻')
    chars = re.findall(r'[\u4e00-\u9fff\u2e80-\u2eff\u3400-\u4dbf]', r['character'])
    for c in chars:
        p = os.path.join(STROKES_DIR, f"{c}.json")
        if not os.path.exists(p):
            missing_rads.append((rid, c, r['character']))
        else:
            valid_rads += 1

print(f"Radical characters with stroke files: {valid_rads}")
print(f"Missing radical characters stroke files: {len(missing_rads)}")
if missing_rads:
    print("Missing sample (up to 10):", missing_rads[:10])
