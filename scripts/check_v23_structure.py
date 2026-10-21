import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open("backend/src/main/resources/db/migration/V23__standardize_hsk_1_to_3_vocabulary_2025.sql", "r", encoding="utf-8") as f:
    sql = f.read()

# Check DDL
print("=== DDL statements ===")
for line in sql.splitlines()[:50]:
    if line.startswith("ALTER TABLE"):
        print(line)

# Count updates and inserts
updates_432 = re.findall(r"UPDATE `VOCABULARY` SET.*?WHERE `hanzi` = '([^']+)' AND `pinyin_raw` = '([^']+)'", sql)
updates_supp = re.findall(r"UPDATE `VOCABULARY` SET `hsk_level` = 0.*?WHERE `hanzi` = '([^']+)' AND `pinyin_raw` = '([^']+)'", sql)
inserts_568 = re.findall(r"INSERT INTO `VOCABULARY`", sql)

print(f"Total matched official updates in Step 2: {len(updates_432)}")
print(f"Total supplementary updates in Step 3: {len(updates_supp)}")
print(f"Total insert statements in Step 4: {len(inserts_568)}")

# Check values of inserted vocabularies
inserted_rows = re.findall(r"\('([^']+)', '([^']+)', '([^']+)', '([^']*)', '([^']*)', (\d+), '([^']+)', (\d+|NULL), '([^']*)', '([^']+)', '([^']*)', (\d+|NULL), (\d+|NULL),", sql)
print(f"Total inserted vocabulary rows in Step 4: {len(inserted_rows)}")
