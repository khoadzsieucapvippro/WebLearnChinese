import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open("backend/src/main/resources/db/migration/V17__reorganize_curriculum_10_lessons_200_words.sql", "r", encoding="utf-8") as f:
    sql = f.read()

v17_items = re.findall(r"SELECT @lesson_id_(\d+),\s*`vocab_id`,\s*(\d+)\s+FROM\s+`vocabulary`\s+WHERE\s+`hanzi`\s*=\s*'([^']+)'\s+AND\s+`pinyin_raw`\s*=\s*'([^']+)'", sql)

with open("backend/src/main/resources/db/migration/V23__standardize_hsk_1_to_3_vocabulary_2025.sql", "r", encoding="utf-8") as f:
    v23_sql = f.read()

v23_lines = v23_sql.splitlines()

stats = {1: 0, 2: 0, 3: 0, 0: 0}
supp_words = []
hsk2_words = []
hsk3_words = []

for lesson_num, ord_idx, hz, raw in v17_items:
    matching_updates = [l for l in v23_lines if f"`hanzi` = '{hz}'" in l and ("UPDATE `VOCABULARY` SET" in l)]
    # filter matching WHERE clause for this word
    matched = None
    for l in matching_updates:
        if f"`hanzi` = '{hz}'" in l:
            # check if raw in where part
            where_part = l.split("WHERE", 1)[1] if "WHERE" in l else ""
            if raw in where_part or raw.replace("'", "") in where_part:
                matched = l
                break
    if not matched and matching_updates:
        matched = matching_updates[0]
    
    m_lvl = re.search(r"`hsk_level` = (\d+)", matched)
    m_src = re.search(r"`hsk_source_id` = (\d+|NULL)", matched)
    lvl = int(m_lvl.group(1)) if m_lvl else 0
    src = m_src.group(1) if m_src else "NULL"
    stats[lvl] = stats.get(lvl, 0) + 1
    if lvl == 0:
        supp_words.append((lesson_num, ord_idx, hz, raw))
    elif lvl == 2:
        hsk2_words.append((lesson_num, ord_idx, hz, raw, src))
    elif lvl == 3:
        hsk3_words.append((lesson_num, ord_idx, hz, raw, src))

print(f"Total 200 items breakdown: {stats}")
print(f"Supplementary words ({len(supp_words)}):")
for item in supp_words:
    print(f"  Lesson {item[0]} #{item[1]}: {item[2]} ({item[3]})")
