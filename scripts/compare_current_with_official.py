import json
import csv
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

V13_PATH = "backend/src/main/resources/db/migration/V13__seed_hsk1_vocabulary_and_radicals.sql"
V15_PATH = "backend/src/main/resources/db/migration/V15__repair_hsk1_vocabulary_unicode.sql"
V17_PATH = "backend/src/main/resources/db/migration/V17__reorganize_curriculum_10_lessons_200_words.sql"
DATA_DIR = "data/hsk30"

def parse_sql_inserts(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
    records = []
    for line_idx, line in enumerate(lines, 1):
        s = line.strip()
        if not s.startswith("(") or "HSK 3.0" not in s:
            continue
        s_inner = s[1:]
        for trail in [";", ","]:
            if s_inner.endswith(trail):
                s_inner = s_inner[:-1].strip()
        if s_inner.endswith(")"):
            s_inner = s_inner[:-1].strip()
        
        parts, cur, in_quote, escape = [], [], False, False
        for c in s_inner:
            if escape:
                cur.append(c)
                escape = False
            elif c == '\\':
                escape = True
            elif c == "'":
                in_quote = not in_quote
            elif c == ',' and not in_quote:
                parts.append("".join(cur).strip())
                cur = []
            else:
                cur.append(c)
        if cur:
            parts.append("".join(cur).strip())
        
        clean_parts = []
        for p in parts:
            if p.startswith("'") and p.endswith("'"):
                clean_parts.append(p[1:-1].replace("''", "'"))
            elif p == 'NULL':
                clean_parts.append(None)
            else:
                clean_parts.append(p)
        
        records.append({
            'hanzi': clean_parts[0],
            'pinyin': clean_parts[1],
            'pinyin_raw': clean_parts[2],
            'meaning_han_viet': clean_parts[3],
            'meaning_vi': clean_parts[4],
            'hsk_level': int(clean_parts[5]) if clean_parts[5] is not None and clean_parts[5].isdigit() else None,
            'hsk_standard': clean_parts[6],
            'example_sentence': clean_parts[7] if len(clean_parts) > 7 else None,
            'example_translation': clean_parts[8] if len(clean_parts) > 8 else None,
            'line_idx': line_idx
        })
    return records

current_db = {}
for r in parse_sql_inserts(V13_PATH):
    current_db[(r['hanzi'], r['pinyin_raw'])] = r
for r in parse_sql_inserts(V15_PATH):
    current_db[(r['hanzi'], r['pinyin_raw'])] = r

print(f"Current DB distinct items: {len(current_db)}")

# Parse V17 curriculum items
with open(V17_PATH, "r", encoding="utf-8") as f:
    v17_sql = f.read()

curriculum_items = re.findall(
    r"WHERE\s+`hanzi`\s*=\s*'([^']+)'\s+AND\s+`pinyin_raw`\s*=\s*'([^']+)'",
    v17_sql
)
print(f"Curriculum V17 references: {len(curriculum_items)} (unique: {len(set(curriculum_items))})")

# Load official HSK 1-3 items
hsk_official = {} # id -> item
hsk_by_hanzi = {} # hanzi -> list of items
for lvl in [1, 2, 3]:
    with open(os.path.join(DATA_DIR, f"hsk-{lvl}.json"), "r", encoding="utf-8") as f:
        items = json.load(f)
        for it in items:
            hsk_official[it['id']] = it
            hsk_by_hanzi.setdefault(it['hanzi'], []).append(it)

print(f"Official HSK 1-3 items: {len(hsk_official)} (unique Hanzi: {len(hsk_by_hanzi)})")

# Cross-reference current_db against official HSK 1-3
matched_current = {} # (hanzi, pinyin_raw) -> list of matching official entries
unmatched_current = {} # (hanzi, pinyin_raw) -> current record

for key, curr in current_db.items():
    hanzi, pinyin_raw = key
    if hanzi in hsk_by_hanzi:
        matched_current[key] = hsk_by_hanzi[hanzi]
    else:
        unmatched_current[key] = curr

print(f"\nCurrent DB items matching HSK 1-3 by Hanzi: {len(matched_current)}")
print(f"Current DB items NOT in HSK 1-3: {len(unmatched_current)}")

# Breakdown of matched_current by official Level
level_breakdown = {1: [], 2: [], 3: [], 'multi': []}
for key, official_list in matched_current.items():
    levels = set(int(it['level']) for it in official_list)
    if len(levels) == 1:
        level_breakdown[list(levels)[0]].append((key, official_list))
    else:
        level_breakdown['multi'].append((key, official_list))

print(f"\nBreakdown of current DB (seeded as HSK 1):")
print(f"  Actually HSK 1: {len(level_breakdown[1])} items")
print(f"  Actually HSK 2: {len(level_breakdown[2])} items")
print(f"  Actually HSK 3: {len(level_breakdown[3])} items")
print(f"  Spanning multiple levels (polysemy/homograph): {len(level_breakdown['multi'])} items")

# Check curriculum items against official HSK 1-3
curriculum_in_hsk = []
curriculum_outside_hsk = []
for c in curriculum_items:
    if c[0] in hsk_by_hanzi:
        curriculum_in_hsk.append((c, hsk_by_hanzi[c[0]]))
    else:
        curriculum_outside_hsk.append(c)

print(f"\nCurriculum (200 words) breakdown:")
print(f"  In official HSK 1-3: {len(curriculum_in_hsk)}")
print(f"  Outside official HSK 1-3: {len(curriculum_outside_hsk)}")
print(f"  Items outside HSK 1-3:")
for c in curriculum_outside_hsk:
    rec = current_db.get(c)
    print(f"    {c[0]} ({c[1]}): {rec['meaning_vi'] if rec else 'N/A'}")

# Official HSK 1-3 items missing from current DB
missing_official = []
for off_id, off_item in hsk_official.items():
    if off_item['hanzi'] not in hsk_by_hanzi or not any(k[0] == off_item['hanzi'] for k in current_db.keys()):
        missing_official.append(off_item)

print(f"\nOfficial HSK 1-3 items completely missing from current DB: {len(missing_official)}")
missing_by_lvl = {1: 0, 2: 0, 3: 0}
for m in missing_official:
    missing_by_lvl[int(m['level'])] += 1
print(f"  Missing Level 1: {missing_by_lvl[1]}")
print(f"  Missing Level 2: {missing_by_lvl[2]}")
print(f"  Missing Level 3: {missing_by_lvl[3]}")

