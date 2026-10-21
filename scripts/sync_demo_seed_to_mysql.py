# -*- coding: utf-8 -*-
"""
Synchronizes SEED_VOCABULARY in frontend/js/api/demo-seed-data.js
directly from authoritative MySQL elearning_db.
Ensures 100% parity of vocabId, hanzi, pinyin, meaningHanViet, meaningVi, radicalIds.
"""

import subprocess
import json
import re
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEMO_PATH = os.path.join(ROOT_DIR, "frontend", "js", "api", "demo-seed-data.js")

def run_query(sql):
    cmd = ['mysql', '-u', 'root', '-D', 'elearning_db', '--default-character-set=utf8mb4']
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate(sql.encode('utf-8'))
    if p.returncode != 0:
        raise RuntimeError(f"MySQL error: {err.decode('utf-8', errors='ignore')}")
    lines = [l.strip() for l in out.decode('utf-8').splitlines() if l.strip()]
    if not lines or len(lines) < 2:
        return []
    header = [h.strip() for h in lines[0].split('\t')]
    rows = []
    for line in lines[1:]:
        parts = [p.strip() for p in line.split('\t')]
        row = dict(zip(header, parts))
        rows.append(row)
    return rows

def sync_vocabulary():
    print("1. Fetching authoritative vocabulary from MySQL elearning_db...")
    vocabs = run_query("""
        SELECT vocab_id, hanzi, pinyin, pinyin_raw, meaning_han_viet, meaning_vi,
               hsk_level, hsk_standard, hsk_source_id, part_of_speech, homograph_index,
               example_sentence, example_translation, audio_url, video_writing_url
        FROM vocabulary
        ORDER BY vocab_id ASC;
    """)
    print(f"   -> Fetched {len(vocabs)} vocabulary records.")

    print("2. Fetching verified radical relationships from vocab_radical...")
    rad_rows = run_query("""
        SELECT vocab_id, radical_id
        FROM vocab_radical
        ORDER BY vocab_id ASC, radical_id ASC;
    """)
    vocab_to_rads = {}
    for r in rad_rows:
        vid = int(r['vocab_id'])
        rid = int(r['radical_id'])
        if vid not in vocab_to_rads:
            vocab_to_rads[vid] = []
        if rid not in vocab_to_rads[vid]:
            vocab_to_rads[vid].append(rid)

    seed_vocab_list = []
    for v in vocabs:
        vid = int(v['vocab_id'])
        rad_ids = vocab_to_rads.get(vid, [])
        hsk_level = int(v['hsk_level']) if v['hsk_level'] and v['hsk_level'] != 'NULL' else 1
        hsk_source_id = int(v['hsk_source_id']) if v['hsk_source_id'] and v['hsk_source_id'] != 'NULL' else None
        homograph = int(v['homograph_index']) if v['homograph_index'] and v['homograph_index'] != 'NULL' else None

        item = {
            "vocabId": vid,
            "hanzi": v['hanzi'],
            "pinyin": v['pinyin'],
            "pinyinRaw": v['pinyin_raw'],
            "meaningHanViet": v['meaning_han_viet'],
            "meaningVi": v['meaning_vi'],
            "radicalIds": rad_ids,
            "hskLevel": hsk_level,
            "hskStandard": v['hsk_standard'],
            "hskSourceId": hsk_source_id,
            "hskSourceLabel": str(hsk_level) if hsk_source_id else "0",
            "hskEdition": "2025",
            "partOfSpeech": v['part_of_speech'] if v['part_of_speech'] != 'NULL' else None,
            "homographIndex": homograph,
            "sourcePdfPage": None,
            "exampleSentence": v['example_sentence'] if v['example_sentence'] != 'NULL' else None,
            "exampleTranslation": v['example_translation'] if v['example_translation'] != 'NULL' else None,
            "audioUrl": v['audio_url'] if v['audio_url'] != 'NULL' else None,
            "videoWritingUrl": v['video_writing_url'] if v['video_writing_url'] != 'NULL' else None
        }
        seed_vocab_list.append(item)

    print(f"3. Updating {DEMO_PATH}...")
    with open(DEMO_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    formatted_json = json.dumps(seed_vocab_list, ensure_ascii=False, indent=2)
    # Replace SEED_VOCABULARY
    pattern = r'export const SEED_VOCABULARY = \[.*?\];\n\nexport const SEED_LESSONS'
    replacement = f'export const SEED_VOCABULARY = {formatted_json};\n\nexport const SEED_LESSONS'

    new_content, count = re.subn(pattern, replacement, content, flags=re.DOTALL)
    if count == 0:
        # Try alternate pattern with \r\n
        pattern_crlf = r'export const SEED_VOCABULARY = \[.*?\];\r?\n\r?\nexport const SEED_LESSONS'
        replacement_crlf = f'export const SEED_VOCABULARY = {formatted_json};\n\nexport const SEED_LESSONS'
        new_content, count = re.subn(pattern_crlf, replacement_crlf, content, flags=re.DOTALL)

    if count == 0:
        raise RuntimeError("Failed to match SEED_VOCABULARY pattern in demo-seed-data.js")

    with open(DEMO_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print("   -> Successfully updated SEED_VOCABULARY in demo-seed-data.js with exact MySQL IDs!")

if __name__ == '__main__':
    sync_vocabulary()
