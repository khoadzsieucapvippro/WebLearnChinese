# -*- coding: utf-8 -*-
import json
import re

with open("frontend/js/api/demo-seed-data.js", "r", encoding="utf-8") as f:
    content = f.read()

raw = content.split("export const SEED_RADICALS = ")[1].split(";\n\nexport const SEED_VOCABULARY")[0]
radicals = json.loads(raw)

with open("scripts/radicals_1_to_150.txt", "w", encoding="utf-8") as out:
    for r in radicals[:150]:
        rid = r["radicalId"]
        char = r["character"]
        m = re.search(r"Ví dụ:\s*(.*?)\.\s*Mẹo nhớ:", r["explanationVi"])
        ex = m.group(1) if m else "ERROR"
        out.write(f"[{rid:03d}] {char:6s}: {ex}\n")

with open("scripts/radicals_151_to_214.txt", "w", encoding="utf-8") as out:
    for r in radicals[150:]:
        rid = r["radicalId"]
        char = r["character"]
        m = re.search(r"Ví dụ:\s*(.*?)\.\s*Mẹo nhớ:", r["explanationVi"])
        ex = m.group(1) if m else "ERROR"
        out.write(f"[{rid:03d}] {char:6s}: {ex}\n")

print("Dumped 1..150 and 151..214 successfully.")
