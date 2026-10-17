# -*- coding: utf-8 -*-
import json
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open("frontend/js/api/demo-seed-data.js", "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find("export const SEED_RADICALS = [")
end_idx = content.find("];\n\nexport const SEED_VOCABULARY = [")
raw = content[start_idx + len("export const SEED_RADICALS = ["):end_idx].strip()
radicals = json.loads("[" + raw + "]")

for r in radicals:
    rid = r["radicalId"]
    char = r["character"]
    pinyin = r["pinyin"]
    hanviet = r["meaningHanViet"]
    meaning_vi = r["meaningVi"]
    expl = r["explanationVi"]
    
    m = re.search(r"Ví dụ:\s*(.*?)\.\s*Mẹo nhớ:", expl)
    ex_str = m.group(1) if m else "NONE"
    
    print(f"[{rid:03d}] {char:8s} ({pinyin:8s} | {hanviet:20s} | {meaning_vi:30s}): {ex_str}")
