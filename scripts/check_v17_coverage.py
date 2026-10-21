import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/js/api/demo-seed-data.js', encoding='utf-8') as f:
    text = f.read()

pos_vocab = text.find('export const SEED_VOCABULARY =')
pos_lessons = text.find('export const SEED_LESSONS =')
vocab_text = text[pos_vocab:pos_lessons]
start = vocab_text.find('[')
end = vocab_text.rfind(']')
vocab_json = json.loads(vocab_text[start:end+1])

hsk1_words = {v['hanzi'] for v in vocab_json if v.get('hskLevel') == 1}

with open('backend/src/main/resources/db/migration/V17__reorganize_curriculum_10_lessons_200_words.sql', encoding='utf-8') as f:
    v17_text = f.read()

v17_words = re.findall(r"WHERE `hanzi` = '([^']+)'", v17_text)
print(f"Total words referenced in V17: {len(v17_words)}")
in_hsk1 = [w for w in v17_words if w in hsk1_words]
not_in_hsk1 = [w for w in v17_words if w not in hsk1_words]
print(f"V17 words in official HSK 1: {len(in_hsk1)}")
print(f"V17 words NOT in official HSK 1: {len(not_in_hsk1)} -> {not_in_hsk1}")

missing_from_v17 = [v['hanzi'] for v in vocab_json if v.get('hskLevel') == 1 and v['hanzi'] not in set(v17_words)]
print(f"Official HSK 1 words missing from V17: {len(missing_from_v17)}")
print("Sample missing from V17:", missing_from_v17[:20])
