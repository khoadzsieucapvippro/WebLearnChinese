import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

DEMO_PATH = "frontend/js/api/demo-seed-data.js"
with open(DEMO_PATH, "r", encoding="utf-8") as f:
    text = f.read()

# Parse SEED_VOCABULARY
m_vocab = re.search(r'export const SEED_VOCABULARY = (\[.*?\]);\n', text, re.DOTALL)
if not m_vocab:
    print("Could not find SEED_VOCABULARY")
    sys.exit(1)

vocab_list = json.loads(m_vocab.group(1))
vocab_by_id = {v['vocabId']: v for v in vocab_list}
vocab_by_hanzi = {}
for v in vocab_list:
    vocab_by_hanzi.setdefault(v['hanzi'], []).append(v)

print(f"Loaded {len(vocab_list)} items from SEED_VOCABULARY")

# Parse SEED_LESSONS
m_lessons = re.search(r'export const SEED_LESSONS = (\[.*?\]);\n\nexport const SEED_ACCOUNTS', text, re.DOTALL)
if not m_lessons:
    print("Could not find SEED_LESSONS")
    sys.exit(1)

lessons = json.loads(m_lessons.group(1))
print(f"Loaded {len(lessons)} lessons from SEED_LESSONS")

# Update each vocabulary item in each lesson from SEED_VOCABULARY
updated_vocab_count = 0
for l in lessons:
    for item in l.get('vocabularies', []):
        v_id = item.get('vocabId')
        v_auth = vocab_by_id.get(v_id)
        if v_auth and v_auth['hanzi'] == item.get('hanzi'):
            # Update fields
            item['pinyin'] = v_auth['pinyin']
            item['pinyinRaw'] = v_auth['pinyinRaw']
            item['meaningHanViet'] = v_auth['meaningHanViet']
            item['meaningVi'] = v_auth['meaningVi'].replace(';', ',')
            item['hskLevel'] = v_auth['hskLevel']
            item['hskStandard'] = v_auth['hskStandard']
            updated_vocab_count += 1
        elif item.get('hanzi') in vocab_by_hanzi:
            candidates = vocab_by_hanzi[item['hanzi']]
            v_auth = candidates[0]
            item['vocabId'] = v_auth['vocabId']
            item['pinyin'] = v_auth['pinyin']
            item['pinyinRaw'] = v_auth['pinyinRaw']
            item['meaningHanViet'] = v_auth['meaningHanViet']
            item['meaningVi'] = v_auth['meaningVi'].replace(';', ',')
            item['hskLevel'] = v_auth['hskLevel']
            item['hskStandard'] = v_auth['hskStandard']
            updated_vocab_count += 1

print(f"Synchronized {updated_vocab_count} embedded vocabularies in SEED_LESSONS")

# Also sync SEED_SRS_CARDS
m_cards = re.search(r'export const SEED_SRS_CARDS = (\[.*?\]);\n\nexport const CHAR_TO_RADICAL_MAP', text, re.DOTALL)
if m_cards:
    cards = json.loads(m_cards.group(1))
    updated_cards = 0
    for card in cards:
        if card.get('itemType') == 'VOCABULARY':
            v_id = card.get('itemId')
            v_auth = vocab_by_id.get(v_id)
            if v_auth and v_auth['hanzi'] == card.get('hanzi'):
                card['pinyin'] = v_auth['pinyin']
                card['meaningVi'] = v_auth['meaningVi'].replace(';', ',')
                card['meaningHanViet'] = v_auth['meaningHanViet']
                updated_cards += 1
    print(f"Synchronized {updated_cards} SRS cards in SEED_SRS_CARDS")

    new_cards_json = json.dumps(cards, ensure_ascii=False, indent=2)
    new_cards_export = f"export const SEED_SRS_CARDS = {new_cards_json};\n\nexport const CHAR_TO_RADICAL_MAP"
    text = re.sub(r'export const SEED_SRS_CARDS = \[.*?\];\n\nexport const CHAR_TO_RADICAL_MAP', new_cards_export, text, flags=re.DOTALL)

# Write updated SEED_LESSONS back
new_lessons_json = json.dumps(lessons, ensure_ascii=False, indent=2)
new_lessons_export = f"export const SEED_LESSONS = {new_lessons_json};\n\nexport const SEED_ACCOUNTS"
text = re.sub(r'export const SEED_LESSONS = \[.*?\];\n\nexport const SEED_ACCOUNTS', new_lessons_export, text, flags=re.DOTALL)

with open(DEMO_PATH, "w", encoding="utf-8") as f:
    f.write(text)

print(f"Successfully synchronized {DEMO_PATH}")
