import sys
import re

sys.stdout.reconfigure(encoding='utf-8')
v25 = open('backend/src/main/resources/db/migration/V25__classify_vocab_radicals_and_structural_components.sql', encoding='utf-8').read()
for char in ['车', '茶', '学']:
    pattern = r"SELECT '" + char + r"' AS `hanzi_char`,\s*(\d+) AS `radical_id`"
    matches = re.findall(pattern, v25)
    print(f"V25 primary kangxi classification for '{char}': {matches}")
