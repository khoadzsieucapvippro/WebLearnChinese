# -*- coding: utf-8 -*-
import json
import re
import sys

with open("frontend/js/api/demo-seed-data.js", "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find("export const SEED_RADICALS = [")
end_idx = content.find("];\n\nexport const SEED_VOCABULARY = [")

raw = content[start_idx + len("export const SEED_RADICALS = ["):end_idx].strip()
radicals = json.loads("[" + raw + "]")

print(f"Total radicals in demo-seed-data: {len(radicals)}")

with open("backend/src/main/resources/db/migration/V21__seed_all_214_radical_explanations.sql", "r", encoding="utf-8") as f:
    sql_content = f.read()

sql_lines = [l for l in sql_content.splitlines() if l.startswith("UPDATE `radical` SET `explanation_vi` = ")]
print(f"Total UPDATE statements in V21: {len(sql_lines)}")

sql_map = {}
for line in sql_lines:
    m = re.match(r"UPDATE `radical` SET `explanation_vi` = '(.*)' WHERE `radical_id` = (\d+);", line)
    if m:
        text, rid = m.group(1), int(m.group(2))
        text = text.replace("''", "'")
        sql_map[rid] = text

print(f"Total parsed V21 radicals: {len(sql_map)}")

# Compare V21 vs SEED_RADICALS
diff_count = 0
for r in radicals:
    rid = r["radicalId"]
    demo_text = r["explanationVi"]
    v21_text = sql_map.get(rid)
    if demo_text != v21_text:
        print(f"Diff for ID {rid}:")
        print(f"  Demo: {demo_text}")
        print(f"  V21 : {v21_text}")
        diff_count += 1

print(f"Total diffs between Demo and V21: {diff_count}")

# Check each radical explanation details
for r in radicals:
    rid = r["radicalId"]
    char = r["character"]
    text = r["explanationVi"]
    
    # Extract examples
    # Pattern e.g. Ví dụ: 三 (sān: số ba), 上 (shàng: bên trên)... Mẹo nhớ:
    m = re.search(r"Ví dụ:\s*(.*?)\.\s*Mẹo nhớ:", text)
    if not m:
        print(f"ID {rid} ({char}): COULD NOT PARSE EXAMPLES -> {text}")
        continue
    examples_str = m.group(1)
    
    # Parse individual examples
    ex_list = re.findall(r"([\u4e00-\u9fff])\s*\(([^:]+):\s*([^)]+)\)", examples_str)
    if not ex_list:
        print(f"ID {rid} ({char}): NO EXAMPLES FOUND IN '{examples_str}'")
    else:
        # Check count of examples (requirement: khoảng 2-3 chữ Hán thực tế)
        if len(ex_list) < 2:
            print(f"ID {rid} ({char}): LESS THAN 2 EXAMPLES ({len(ex_list)}): {ex_list}")
        elif len(ex_list) > 4:
            print(f"ID {rid} ({char}): MORE THAN 4 EXAMPLES ({len(ex_list)}): {ex_list}")

print("Inspection script completed.")
