import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open("backend/src/main/resources/db/migration/V23__standardize_hsk_1_to_3_vocabulary_2025.sql", "r", encoding="utf-8") as f:
    sql = f.read()

# Split into lines
step2_lines = []
step3_lines = []
for line in sql.splitlines():
    if "UPDATE `VOCABULARY` SET" in line:
        if "`hsk_level` = 0" in line:
            step3_lines.append(line)
        else:
            step2_lines.append(line)

print(f"Total Step 2 update statements: {len(step2_lines)}")
print(f"Total Step 3 update statements: {len(step3_lines)}")

# Let's inspect each statement's WHERE clause
where_patterns = []
for l in step2_lines:
    m = re.search(r"WHERE `hanzi` = '([^']+)' AND `pinyin_raw` = '([^']+)'", l)
    if m:
        where_patterns.append((m.group(1), m.group(2), l))

print(f"Extracted {len(where_patterns)} WHERE clauses from Step 2")
