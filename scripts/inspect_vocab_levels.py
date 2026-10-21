import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/js/api/demo-seed-data.js', encoding='utf-8') as f:
    text = f.read()

pos_vocab = text.find('export const SEED_VOCABULARY =')
pos_lessons = text.find('export const SEED_LESSONS =')
vocab_text = text[pos_vocab:pos_lessons]

# Parse json array from export const SEED_VOCABULARY = [ ... ];
# Since it's valid JS/JSON inside brackets:
start = vocab_text.find('[')
end = vocab_text.rfind(']')
vocab_json = json.loads(vocab_text[start:end+1])

print(f"Total vocabulary items: {len(vocab_json)}")
hsk1 = [v for v in vocab_json if v.get('hskLevel') == 1]
hsk2 = [v for v in vocab_json if v.get('hskLevel') == 2]
hsk3 = [v for v in vocab_json if v.get('hskLevel') == 3]
hsk0 = [v for v in vocab_json if v.get('hskLevel') == 0]

print(f"HSK 1: {len(hsk1)}, HSK 2: {len(hsk2)}, HSK 3: {len(hsk3)}, Supplementary: {len(hsk0)}")
