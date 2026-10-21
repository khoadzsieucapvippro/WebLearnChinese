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

hsk2 = [v for v in vocab_json if v.get('hskLevel') == 2]
hsk2.sort(key=lambda x: x.get('hskSourceId', 0))

print("HSK 2 Chunks:")
for i in range(0, len(hsk2), 20):
    chunk = hsk2[i:i+20]
    words = ", ".join([v['hanzi'] for v in chunk])
    print(f"HSK2 Chặng {i//20 + 1:02d} ({len(chunk)} từ): {words}")
