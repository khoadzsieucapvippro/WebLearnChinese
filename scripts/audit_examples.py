# -*- coding: utf-8 -*-
import json
import re

with open("frontend/js/api/demo-seed-data.js", "r", encoding="utf-8") as f:
    content = f.read()

raw = content.split("export const SEED_RADICALS = ")[1].split(";\n\nexport const SEED_VOCABULARY")[0]
radicals = json.loads(raw)

with open("scripts/audit_results.txt", "w", encoding="utf-8") as out:
    for r in radicals:
        rid = r["radicalId"]
        char = r["character"]
        m = re.search(r"Ví dụ:\s*(.*?)\.\s*Mẹo nhớ:", r["explanationVi"])
        ex_str = m.group(1) if m else ""
        exs = re.findall(r"([\u4e00-\u9fff])\s*\(([^:]+):\s*([^)]+)\)", ex_str)
        ex_chars = "".join([x[0] for x in exs])
        out.write(f"{rid:03d} {char:6s} -> {ex_chars:5s} | {ex_str}\n")

print("Done writing audit_results.txt")
