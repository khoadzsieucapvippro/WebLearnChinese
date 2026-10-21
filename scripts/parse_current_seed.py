import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

V13_PATH = "backend/src/main/resources/db/migration/V13__seed_hsk1_vocabulary_and_radicals.sql"
V15_PATH = "backend/src/main/resources/db/migration/V15__repair_hsk1_vocabulary_unicode.sql"
V17_PATH = "backend/src/main/resources/db/migration/V17__reorganize_curriculum_10_lessons_200_words.sql"

def parse_sql_inserts(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    records = []
    for line_idx, line in enumerate(lines, 1):
        s = line.strip()
        if not s.startswith("(") or "HSK 3.0" not in s:
            continue
        # Extract fields inside ('...', '...', ...)
        # We can strip leading '(' and trailing '),?'
        s_inner = s[1:]
        if s_inner.endswith(","):
            s_inner = s_inner[:-1].strip()
        if s_inner.endswith(";"):
            s_inner = s_inner[:-1].strip()
        if s_inner.endswith(")"):
            s_inner = s_inner[:-1].strip()
        
        # Tokenize by comma respecting quotes
        parts = []
        cur = []
        in_quote = False
        escape = False
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

v13_records = parse_sql_inserts(V13_PATH)
v15_records = parse_sql_inserts(V15_PATH)
print(f"V13 parsed records: {len(v13_records)}")
print(f"V15 parsed records: {len(v15_records)}")


# V15 overwrote/updated V13 using ON DUPLICATE KEY UPDATE.
# Let's map (hanzi, pinyin_raw) -> record
current_db_vocab = {}
for r in v13_records:
    current_db_vocab[(r['hanzi'], r['pinyin_raw'])] = r
for r in v15_records:
    current_db_vocab[(r['hanzi'], r['pinyin_raw'])] = r

print(f"Total current distinct (hanzi, pinyin_raw) in seed: {len(current_db_vocab)}")
