import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("backend/src/main/resources/db/migration/V23__standardize_hsk_1_to_3_vocabulary_2025.sql", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if l.startswith("-- Step"):
        print(f"Line {i+1}: {l.strip()}")
