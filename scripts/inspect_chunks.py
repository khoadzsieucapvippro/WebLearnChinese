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
hsk2 = [v for v in vocab_json if v.get('hskLevel') == 2]
hsk3 = [v for v in vocab_json if v.get('hskLevel') == 3]

print(f"HSK 1: {len(hsk1)}")
for i in range(0, len(hsk1), 20):
    chunk = hsk1[i:i+20]
    words = ", ".join([v['hanzi'] for v in chunk])
    print(f"HSK1 Bài {i//20 + 1:02d} ({len(chunk)} từ): {words}")
