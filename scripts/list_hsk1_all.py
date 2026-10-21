import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/js/api/demo-seed-data.js', encoding='utf-8') as f:
    text = f.read()

pos_vocab = text.find('export const SEED_VOCABULARY =')
pos_lessons = text.find('export const SEED_LESSONS =')
vocab_text = text[pos_vocab:pos_lessons]
start = vocab_text.find('[')
end = vocab_text.rfind(']')
vocab_json = json.loads(vocab_text[start:end+1])

hsk1 = [v for v in vocab_json if v.get('hskLevel') == 1]
print(f"Total HSK 1 words: {len(hsk1)}")

# List all 300 words with their meanings
for i, v in enumerate(hsk1, 1):
    print(f"{i:3d}. {v['hanzi']:8s} ({v['pinyin']:10s}): {v['meaningVi']}")
