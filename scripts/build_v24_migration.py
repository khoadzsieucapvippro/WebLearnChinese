import os
import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load demo-seed-data.js to get SEED_VOCABULARY and CHAR_TO_RADICALS_MAP
with open(os.path.join(ROOT_DIR, "frontend", "js", "api", "demo-seed-data.js"), "r", encoding="utf-8") as f:
    text = f.read()

m = re.search(r'export const CHAR_TO_RADICALS_MAP = Object\.freeze\((\{.*?\})\);', text, re.DOTALL)
char_to_rads = json.loads(m.group(1))

m2 = re.search(r'export const SEED_VOCABULARY = (\[.*?\]);\s*export', text, re.DOTALL)
seed_vocab = json.loads(m2.group(1))
print(f"Loaded {len(seed_vocab)} seed vocabulary items.")

# Load V22 and V23 to find what has already been inserted
mig_dir = os.path.join(ROOT_DIR, "backend", "src", "main", "resources", "db", "migration")

# In V22: SELECT 'word' AS `hanzi`, 'raw' AS `pinyin_raw`, rad_id AS `radical_id`, 'char' AS `hanzi_char`
with open(os.path.join(mig_dir, "V22__audit_and_update_vocabulary_radicals.sql"), "r", encoding="utf-8") as f:
    v22_text = f.read()

v22_pattern = re.compile(r"SELECT\s+'([^']+)'\s+AS\s+`hanzi`,\s+'([^']*)'\s+AS\s+`pinyin_raw`,\s+(\d+)\s+AS\s+`radical_id`,\s+'([^']*)'\s+AS\s+`hanzi_char`")
v22_matches = v22_pattern.findall(v22_text)

# In V23: SELECT source_id AS `hsk_source_id`, rad_id AS `radical_id`, 'char' AS `hanzi_char`
with open(os.path.join(mig_dir, "V23__standardize_hsk_1_to_3_vocabulary_2025.sql"), "r", encoding="utf-8") as f:
    v23_text = f.read()

v23_pattern = re.compile(r"SELECT\s+(\d+)\s+AS\s+`hsk_source_id`,\s+(\d+)\s+AS\s+`radical_id`,\s+'([^']*)'\s+AS\s+`hanzi_char`")
v23_matches = v23_pattern.findall(v23_text)

print(f"V22 inserted mappings: {len(v22_matches)}")
print(f"V23 inserted mappings: {len(v23_matches)}")

# Map from (hsk_source_id, hanzi)
vocab_by_source_id = {v.get('hskSourceId'): v for v in seed_vocab if v.get('hskSourceId') is not None}
vocab_by_hanzi = {}
for v in seed_vocab:
    vocab_by_hanzi.setdefault(v['hanzi'], []).append(v)

# Check all expected mappings for every vocabulary word:
# For each word, for each char in word: each radical in char_to_rads[char]
missing_mappings = []
total_expected = 0

# Set of already inserted tuples: (hanzi, pinyin_raw, radical_id, hanzi_char)
inserted_set = set()
for word, raw, rad_id, char in v22_matches:
    inserted_set.add((word, int(rad_id), char))

for sid, rad_id, char in v23_matches:
    v = vocab_by_source_id.get(int(sid))
    if v:
        inserted_set.add((v['hanzi'], int(rad_id), char))

print(f"Unique inserted (hanzi, radical_id, hanzi_char): {len(inserted_set)}")

for v in seed_vocab:
    word = v['hanzi']
    vid = v['vocabId']
    sid = v.get('hskSourceId')
    for char in word:
        if '\u4e00' <= char <= '\u9fff' and char in char_to_rads:
            for rid in char_to_rads[char]:
                total_expected += 1
                if (word, rid, char) not in inserted_set:
                    missing_mappings.append((v, char, rid))

print(f"Total expected character-radical associations: {total_expected}")
print(f"Total missing character-radical associations: {len(missing_mappings)}")
if missing_mappings:
    print("\nSample missing mappings:")
    for m in missing_mappings[:20]:
        print(f"  Vocab #{m[0]['vocabId']} '{m[0]['hanzi']}' (HSK {m[0].get('hskLevel')}, source {m[0].get('hskSourceId')}): char '{m[1]}' -> Radical #{m[2]}")
