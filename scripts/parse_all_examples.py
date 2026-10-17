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
    
    # parse visual, semantic, examples, mnemonic
    m = re.search(r"^(.*?)\s*(Thường|Biểu thị|Gợi ý|Đại diện|Xuất hiện|Gặp trong|Vừa biểu thị|Nêu|Mang ý nghĩa)(.*?)\s*Ví dụ:\s*(.*?)\.\s*Mẹo nhớ:\s*(.*)$", expl)
    ex_str = ""
    if m:
        ex_str = m.group(4)
    else:
        m2 = re.search(r"Ví dụ:\s*(.*?)\.\s*Mẹo nhớ:\s*(.*)$", expl)
        if m2:
            ex_str = m2.group(1)
            
    print(f"{rid:03d}|{char}|{pinyin}|{hanviet}|{ex_str}")
