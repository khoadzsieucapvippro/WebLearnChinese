import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open("backend/src/main/resources/db/migration/V13__seed_hsk1_vocabulary_and_radicals.sql", "r", encoding="utf-8") as f:
    v13 = f.read()

for m in re.finditer(r"\('([^']+)',\s*'([^']+)',\s*'([^']+)'", v13):
    hz, py, py_raw = m.group(1), m.group(2), m.group(3)
    if "'" in py or "'" in py_raw:
        print(f"V13 with apostrophe: {hz} -> py='{py}', raw='{py_raw}'")
