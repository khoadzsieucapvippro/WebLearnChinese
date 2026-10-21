import json
import csv
import re
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

V13_PATH = "backend/src/main/resources/db/migration/V13__seed_hsk1_vocabulary_and_radicals.sql"
V15_PATH = "backend/src/main/resources/db/migration/V15__repair_hsk1_vocabulary_unicode.sql"

def parse_sql_inserts(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
    records = []
    for line_idx, line in enumerate(lines, 1):
        s = line.strip()
        if not s.startswith("(") or "HSK 3.0" not in s:
            continue
        s_inner = s[1:]
        for trail in [";", ","]:
            if s_inner.endswith(trail):
                s_inner = s_inner[:-1].strip()
        if s_inner.endswith(")"):
            s_inner = s_inner[:-1].strip()
        
        parts, cur, in_quote, escape = [], [], False, False
        for c in s_inner:
            if escape:
                cur.append(c)
                escape = False
            elif c == '\\':
                escape = True
            elif c == "'":
                in_quote = not in_quote
            elif c == ',' and not in_quote:
                parts.append("".join(cur).strip())
                cur = []
            else:
                cur.append(c)
        if cur:
            parts.append("".join(cur).strip())
        
        clean_parts = []
        for p in parts:
            if p.startswith("'") and p.endswith("'"):
                clean_parts.append(p[1:-1].replace("''", "'"))
            elif p == 'NULL':
                clean_parts.append(None)
            else:
                clean_parts.append(p)
        
        records.append({
            'hanzi': clean_parts[0],
            'pinyin': clean_parts[1],
            'pinyin_raw': clean_parts[2],
            'meaning_han_viet': clean_parts[3],
            'meaning_vi': clean_parts[4],
            'hsk_level': int(clean_parts[5]) if clean_parts[5] is not None and clean_parts[5].isdigit() else None,
            'hsk_standard': clean_parts[6],
            'example_sentence': clean_parts[7] if len(clean_parts) > 7 else None,
            'example_translation': clean_parts[8] if len(clean_parts) > 8 else None,
            'line_idx': line_idx
        })
    return records

current_db = {}
for r in parse_sql_inserts(V13_PATH):
    current_db[(r['hanzi'], r['pinyin_raw'])] = r
for r in parse_sql_inserts(V15_PATH):
    current_db[(r['hanzi'], r['pinyin_raw'])] = r

print("=== Audit Vietnamese Meanings for Suspicious Patterns ===")
suspicious_meanings = []
for (hanzi, pinyin_raw), rec in current_db.items():
    m = rec['meaning_vi'].strip()
    # Check for "Họ" (surname) or very short or weird translations
    if m == 'Họ' or m.startswith('Họ ') or m.startswith('Họ;') or m.endswith('; Họ'):
        suspicious_meanings.append((hanzi, pinyin_raw, rec, "Contains 'Họ' (likely machine translated surname)"))
    elif m.startswith('"') and m.endswith('"'):
        suspicious_meanings.append((hanzi, pinyin_raw, rec, "Quoted string"))
    elif len(m) <= 1:
        suspicious_meanings.append((hanzi, pinyin_raw, rec, "Too short"))
    elif '?' in m or '?' in rec['example_translation']:
        suspicious_meanings.append((hanzi, pinyin_raw, rec, "Contains '?'"))
    elif rec['meaning_han_viet'].strip() == '' or rec['meaning_vi'].strip() == '':
        suspicious_meanings.append((hanzi, pinyin_raw, rec, "Empty field"))

print(f"Found {len(suspicious_meanings)} suspicious records:")
for hanzi, pinyin_raw, rec, reason in suspicious_meanings:
    print(f"  {hanzi} ({rec['pinyin']}): meaning_vi='{rec['meaning_vi']}', example='{rec['example_sentence']}' -> '{rec['example_translation']}' [{reason}]")

