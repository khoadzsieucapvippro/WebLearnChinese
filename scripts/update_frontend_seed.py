# -*- coding: utf-8 -*-
"""
Update demo-seed-data.js with complete 1,068 SEED_VOCABULARY and full CHAR_TO_RADICALS_MAP (655 characters).
"""

import json
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT_DIR, "data", "hsk30")
DEMO_PATH = os.path.join(ROOT_DIR, "frontend", "js", "api", "demo-seed-data.js")

# Load full_char_map
sys.path.append(os.path.join(ROOT_DIR, "scripts"))
from test_radical_resolver import full_char_map

# Load build_v23_migration elements
from build_v23_migration import (
    matched_records, unmatched_records, missing_official_ids,
    missing_568_defs, MEANING_FIXES, HAN_VIET_FIXES, hsk_official
)

# Build full 1068 vocabulary list for frontend
all_frontend_vocab = []

# 1. Matched existing records (432)
for rec, off in matched_records:
    vocab_id = rec['vocab_id']
    hz = rec['hanzi']
    meaning = MEANING_FIXES.get(hz, rec['meaning_vi'])
    han_viet = HAN_VIET_FIXES.get(hz, rec['meaning_han_viet'])
    
    # Radicals
    rad_ids = []
    for c in hz:
        rad_ids.extend(full_char_map.get(c, []))
    # Deduplicate preserving order
    unique_rad_ids = []
    for r in rad_ids:
        if r not in unique_rad_ids:
            unique_rad_ids.append(r)
            
    all_frontend_vocab.append({
        "vocabId": vocab_id,
        "hanzi": hz,
        "pinyin": off['pinyin'],
        "pinyinRaw": off['computed_raw'],
        "meaningHanViet": han_viet,
        "meaningVi": meaning,
        "radicalIds": unique_rad_ids,
        "hskLevel": int(off['level']),
        "hskStandard": "HSK 3.0",
        "hskSourceId": off['id'],
        "hskSourceLabel": off.get('level_label') or str(off['level']),
        "hskEdition": "2025",
        "partOfSpeech": off.get('part_of_speech'),
        "homographIndex": int(off['homograph']) if off.get('homograph') else None,
        "sourcePdfPage": int(off['source_pdf_page']) if off.get('source_pdf_page') else None,
        "exampleSentence": rec.get('example_sentence'),
        "exampleTranslation": rec.get('example_translation'),
        "audioUrl": None,
        "videoWritingUrl": None
    })

# 2. Supplementary records (68)
for rec in unmatched_records:
    vocab_id = rec['vocab_id']
    hz = rec['hanzi']
    meaning = MEANING_FIXES.get(hz, rec['meaning_vi'])
    han_viet = HAN_VIET_FIXES.get(hz, rec['meaning_han_viet'])
    
    rad_ids = []
    for c in hz:
        rad_ids.extend(full_char_map.get(c, []))
    unique_rad_ids = []
    for r in rad_ids:
        if r not in unique_rad_ids:
            unique_rad_ids.append(r)
            
    all_frontend_vocab.append({
        "vocabId": vocab_id,
        "hanzi": hz,
        "pinyin": rec['pinyin'],
        "pinyinRaw": rec['pinyin_raw'],
        "meaningHanViet": han_viet,
        "meaningVi": meaning,
        "radicalIds": unique_rad_ids,
        "hskLevel": 0,
        "hskStandard": "Curriculum Supplementary",
        "hskSourceId": None,
        "hskSourceLabel": "Supplementary",
        "hskEdition": "2025",
        "partOfSpeech": None,
        "homographIndex": None,
        "sourcePdfPage": None,
        "exampleSentence": rec.get('example_sentence'),
        "exampleTranslation": rec.get('example_translation'),
        "audioUrl": None,
        "videoWritingUrl": None
    })

# Sort existing 500 by vocabId
all_frontend_vocab.sort(key=lambda x: x['vocabId'])
assert len(all_frontend_vocab) == 500

# 3. New official items (568)
assigned_vocab_id = 501
for off_id in missing_official_ids:
    d = missing_568_defs[off_id]
    v_id = assigned_vocab_id
    assigned_vocab_id += 1
    
    hz = d['hanzi']
    rad_ids = []
    for c in hz:
        rad_ids.extend(full_char_map.get(c, []))
    unique_rad_ids = []
    for r in rad_ids:
        if r not in unique_rad_ids:
            unique_rad_ids.append(r)
            
    all_frontend_vocab.append({
        "vocabId": v_id,
        "hanzi": hz,
        "pinyin": d['pinyin'],
        "pinyinRaw": d['pinyin_raw'],
        "meaningHanViet": d['han_viet'],
        "meaningVi": d['meaning_vi'],
        "radicalIds": unique_rad_ids,
        "hskLevel": d['level'],
        "hskStandard": "HSK 3.0",
        "hskSourceId": d['id'],
        "hskSourceLabel": str(d['level']),
        "hskEdition": "2025",
        "partOfSpeech": d['part_of_speech'],
        "homographIndex": int(d['homograph']) if d.get('homograph') else None,
        "sourcePdfPage": int(d['source_pdf_page']) if d.get('source_pdf_page') else None,
        "exampleSentence": d['example_sentence'],
        "exampleTranslation": d['example_translation'],
        "audioUrl": None,
        "videoWritingUrl": None
    })

print(f"Total frontend vocabulary items built: {len(all_frontend_vocab)}")
assert len(all_frontend_vocab) == 1068

# Read demo-seed-data.js
with open(DEMO_PATH, "r", encoding="utf-8") as f:
    demo_content = f.read()

# Replace SEED_VOCABULARY = [...];
vocab_json_str = json.dumps(all_frontend_vocab, ensure_ascii=False, indent=2)
new_vocab_export = f"export const SEED_VOCABULARY = {vocab_json_str};\n"

pattern_vocab = r"export const SEED_VOCABULARY = \[.*?\];\n"
demo_content = re.sub(pattern_vocab, new_vocab_export, demo_content, flags=re.DOTALL)

# Replace CHAR_TO_RADICALS_MAP = Object.freeze({...});
rads_map_json = json.dumps(full_char_map, ensure_ascii=False, indent=2)
new_rads_export = f"export const CHAR_TO_RADICALS_MAP = Object.freeze({rads_map_json});\n"

pattern_rads = r"export const CHAR_TO_RADICALS_MAP = Object\.freeze\(\{.*?\}\);\n"
demo_content = re.sub(pattern_rads, new_rads_export, demo_content, flags=re.DOTALL)

with open(DEMO_PATH, "w", encoding="utf-8") as f:
    f.write(demo_content)

print(f"Successfully updated {DEMO_PATH}")
