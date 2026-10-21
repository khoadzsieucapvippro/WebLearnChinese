import sys, re

# Check V22: SELECT 'word' AS `hanzi`, 'raw' AS `pinyin_raw`, rad_id AS `radical_id`, 'char' AS `hanzi_char`
with open('backend/src/main/resources/db/migration/V22__audit_and_update_vocabulary_radicals.sql', 'r', encoding='utf-8') as f:
    v22_text = f.read()

v22_pattern = re.compile(r"SELECT\s+'([^']+)'\s+AS\s+`hanzi`,\s+'([^']*)'\s+AS\s+`pinyin_raw`,\s+(\d+)\s+AS\s+`radical_id`,\s+'([^']*)'\s+AS\s+`hanzi_char`")
v22_matches = v22_pattern.findall(v22_text)
print(f'Total V22 mappings: {len(v22_matches)}')

v22_seen = {}
v22_collisions = []
for word, raw, rad_id, char in v22_matches:
    key = (word, raw, rad_id)
    if key in v22_seen:
        v22_collisions.append((word, raw, rad_id, v22_seen[key], char))
    else:
        v22_seen[key] = char

print(f'V22 Collisions on (word, raw, rad_id): {len(v22_collisions)}')
for c in v22_collisions[:10]:
    print(f"  V22 Collision: Word '{c[0]}' - Radical {c[2]} in '{c[3]}' vs '{c[4]}'")

# Check V23: SELECT source_id AS `hsk_source_id`, rad_id AS `radical_id`, 'char' AS `hanzi_char`
with open('backend/src/main/resources/db/migration/V23__standardize_hsk_1_to_3_vocabulary_2025.sql', 'r', encoding='utf-8') as f:
    v23_text = f.read()

v23_pattern = re.compile(r"SELECT\s+(\d+)\s+AS\s+`hsk_source_id`,\s+(\d+)\s+AS\s+`radical_id`,\s+'([^']*)'\s+AS\s+`hanzi_char`")
v23_matches = v23_pattern.findall(v23_text)
print(f'\nTotal V23 mappings: {len(v23_matches)}')

v23_seen = {}
v23_collisions = []
for sid, rad_id, char in v23_matches:
    key = (sid, rad_id)
    if key in v23_seen:
        v23_collisions.append((sid, rad_id, v23_seen[key], char))
    else:
        v23_seen[key] = char

print(f'V23 Collisions on (hsk_source_id, rad_id): {len(v23_collisions)}')
for c in v23_collisions[:10]:
    print(f"  V23 Collision: SourceID {c[0]} - Radical {c[1]} in '{c[2]}' vs '{c[3]}'")
