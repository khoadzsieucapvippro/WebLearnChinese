import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('backend/src/main/resources/db/migration/V23__standardize_hsk_1_to_3_vocabulary_2025.sql', encoding='utf-8') as f:
    sql = f.read()
lines = [l for l in sql.splitlines() if "`hanzi` = '过'" in l or "'过'" in l]
for l in lines:
    if "UPDATE" in l or "INSERT" in l:
        print(l[:180])
