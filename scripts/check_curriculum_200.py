import re, json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open("backend/src/main/resources/db/migration/V17__reorganize_curriculum_10_lessons_200_words.sql", "r", encoding="utf-8") as f:
    sql = f.read()

# Pattern: SELECT @lesson_id_(\d+), `vocab_id`, (\d+) FROM `vocabulary` WHERE `hanzi` = '([^']+)' AND `pinyin_raw` = '([^']+)'
v17_items = re.findall(r"SELECT @lesson_id_(\d+),\s*`vocab_id`,\s*(\d+)\s+FROM\s+`vocabulary`\s+WHERE\s+`hanzi`\s*=\s*'([^']+)'\s+AND\s+`pinyin_raw`\s*=\s*'([^']+)'", sql)

print(f"Total items extracted from V17: {len(v17_items)}")

# Load official HSK 1-3
hsk_official = {}
for lvl in [1, 2, 3]:
    with open(f"data/hsk30/hsk-{lvl}.json", "r", encoding="utf-8") as f:
        for it in json.load(f):
            hsk_official[it['id']] = it

with open("backend/src/main/resources/db/migration/V23__standardize_hsk_1_to_3_vocabulary_2025.sql", "r", encoding="utf-8") as f:
    v23_sql = f.read()

# Parse Step 2 & Step 3 from V23
v23_levels = {}
for line in v23_sql.splitlines():
    if "UPDATE `VOCABULARY` SET" in line:
        # Match hanzi and pinyin_raw in WHERE clause
        m_where = re.search(r"WHERE `hanzi` = '([^']+)' AND `pinyin_raw` = '([^']+)'", line)
        if m_where:
            hz = m_where.group(1)
            raw = m_where.group(2)
            # Find level and standard
            m_lvl = re.search(r"`hsk_level` = (\d+)", line)
            m_std = re.search(r"`hsk_standard` = '([^']+)'", line)
            m_src = re.search(r"`hsk_source_id` = (\d+|NULL)", line)
            if m_lvl and m_std:
                lvl = int(m_lvl.group(1))
                std = m_std.group(1)
                src = m_src.group(1) if m_src else None
                v23_levels[(hz, raw)] = (lvl, std, src)

hsk1 = []
hsk2 = []
hsk3 = []
supp = []
unknown = []

for lesson_num, ord_idx, hz, raw in v17_items:
    if (hz, raw) in v23_levels:
        lvl, std, src = v23_levels[(hz, raw)]
        if lvl == 1:
            hsk1.append((lesson_num, ord_idx, hz, raw, src))
        elif lvl == 2:
            hsk2.append((lesson_num, ord_idx, hz, raw, src))
        elif lvl == 3:
            hsk3.append((lesson_num, ord_idx, hz, raw, src))
        else:
            supp.append((lesson_num, ord_idx, hz, raw))
    else:
        unknown.append((lesson_num, ord_idx, hz, raw))

print(f"\nCurriculum 200 words breakdown under V23:")
print(f"  HSK 1: {len(hsk1)}")
print(f"  HSK 2: {len(hsk2)}")
print(f"  HSK 3: {len(hsk3)}")
print(f"  Supplementary (HSK 0): {len(supp)}")
print(f"  Unknown: {len(unknown)}")
print(f"Total: {len(hsk1) + len(hsk2) + len(hsk3) + len(supp) + len(unknown)}")

print(f"\nWords in Curriculum that are now HSK 2 ({len(hsk2)}):")
for item in hsk2:
    print(f"  Lesson {item[0]} #{item[1]}: {item[2]} ({item[3]}) -> Source ID {item[4]}")

print(f"\nWords in Curriculum that are now HSK 3 ({len(hsk3)}):")
for item in hsk3:
    print(f"  Lesson {item[0]} #{item[1]}: {item[2]} ({item[3]}) -> Source ID {item[4]}")

print(f"\nWords in Curriculum that are Supplementary outside HSK 1-3 ({len(supp)}):")
for item in supp:
    print(f"  Lesson {item[0]} #{item[1]}: {item[2]} ({item[3]})")
