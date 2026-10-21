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

hsk1 = [v for v in vocab_json if v.get('hskLevel') == 1]

# Sort by hskSourceId
hsk1.sort(key=lambda x: x.get('hskSourceId', 0))

print("First 20 HSK 1 words by hskSourceId:")
for v in hsk1[:20]:
    print(f"  #{v.get('hskSourceId')}: {v['hanzi']} ({v['pinyin']}) - {v['meaningVi']}")
