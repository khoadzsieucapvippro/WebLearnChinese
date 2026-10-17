# -*- coding: utf-8 -*-
import json
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open("frontend/js/api/demo-seed-data.js", "r", encoding="utf-8") as f:
    content = f.read()

raw = content.split("export const SEED_RADICALS = ")[1].split(";\n\nexport const SEED_VOCABULARY")[0]
radicals = json.loads(raw)

pinyin_tone_chars = set("āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü")

for r in radicals:
    rid = r["radicalId"]
    char = r["character"]
    m = re.search(r"Ví dụ:\s*(.*?)\.\s*Mẹo nhớ:", r["explanationVi"])
    if not m:
        continue
    ex_str = m.group(1)
    examples = re.findall(r"([\u4e00-\u9fff])\s*\(([^:]+):\s*([^)]+)\)", ex_str)
    
    for ex_char, pinyin, meaning in examples:
        pinyin_clean = pinyin.strip()
        # check if pinyin has any slash (multi-reading e.g. gān/qián)
        parts = pinyin_clean.split("/")
        for part in parts:
            part = part.strip()
            # check if part consists of latin letters or tone marks
            # allow standard pinyin characters
            invalid_chars = [c for c in part if not (c.isalpha() or c in pinyin_tone_chars)]
            if invalid_chars:
                print(f"[{rid:03d}] {ex_char} in {char}: weird pinyin '{pinyin_clean}' (invalid chars: {invalid_chars})")
                
print("Pinyin check finished.")
