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
hsk2 = [v for v in vocab_json if v.get('hskLevel') == 2]
hsk3 = [v for v in vocab_json if v.get('hskLevel') == 3]

hsk1.sort(key=lambda x: x.get('hskSourceId', 0))
hsk2.sort(key=lambda x: x.get('hskSourceId', 0))
hsk3.sort(key=lambda x: x.get('hskSourceId', 0))

# Import titles from scripts/generate_full_curriculum.py
from generate_full_curriculum import hsk1_meta, hsk2_meta, hsk3_meta

def make_lesson_vocab(v, idx):
    return {
        "vocabId": v["vocabId"],
        "hanzi": v["hanzi"],
        "pinyin": v["pinyin"],
        "pinyinRaw": v.get("pinyinRaw", ""),
        "meaningHanViet": v.get("meaningHanViet", ""),
        "meaningVi": v.get("meaningVi", ""),
        "hskLevel": v.get("hskLevel", 1),
        "hskStandard": v.get("hskStandard", "HSK 3.0"),
        "exampleSentence": v.get("exampleSentence", ""),
        "exampleTranslation": v.get("exampleTranslation", ""),
        "audioUrl": v.get("audioUrl", None),
        "videoWritingUrl": v.get("videoWritingUrl", None),
        "orderIndex": idx + 1
    }

lessons = []
lesson_id = 1

# HSK 1 (15 lessons)
for i in range(15):
    chunk = hsk1[i*20:(i+1)*20]
    title, desc = hsk1_meta[i]
    lessons.append({
        "lessonId": lesson_id,
        "title": title,
        "description": desc,
        "level": 1,
        "status": "Approved",
        "orderIndex": i + 1,
        "vocabularyCount": len(chunk),
        "creatorName": "Tác Giả Khóa Học",
        "creatorEmail": "creator@gmail.com",
        "createdAt": "2026-08-01T08:00:00Z",
        "updatedAt": "2026-08-02T10:30:00Z",
        "vocabularies": [make_lesson_vocab(v, idx) for idx, v in enumerate(chunk)]
    })
    lesson_id += 1

# HSK 2 (10 lessons)
for i in range(10):
    chunk = hsk2[i*20:(i+1)*20]
    title, desc = hsk2_meta[i]
    lessons.append({
        "lessonId": lesson_id,
        "title": title,
        "description": desc,
        "level": 2,
        "status": "Approved",
        "orderIndex": i + 1,
        "vocabularyCount": len(chunk),
        "creatorName": "Tác Giả Khóa Học",
        "creatorEmail": "creator@gmail.com",
        "createdAt": "2026-08-01T08:00:00Z",
        "updatedAt": "2026-08-02T10:30:00Z",
        "vocabularies": [make_lesson_vocab(v, idx) for idx, v in enumerate(chunk)]
    })
    lesson_id += 1

# HSK 3 (25 lessons)
for i in range(25):
    chunk = hsk3[i*20:(i+1)*20]
    title, desc = hsk3_meta[i]
    lessons.append({
        "lessonId": lesson_id,
        "title": title,
        "description": desc,
        "level": 3,
        "status": "Approved",
        "orderIndex": i + 1,
        "vocabularyCount": len(chunk),
        "creatorName": "Tác Giả Khóa Học",
        "creatorEmail": "creator@gmail.com",
        "createdAt": "2026-08-01T08:00:00Z",
        "updatedAt": "2026-08-02T10:30:00Z",
        "vocabularies": [make_lesson_vocab(v, idx) for idx, v in enumerate(chunk)]
    })
    lesson_id += 1

print(f"Generated {len(lessons)} lessons total.")

pos_accounts = text.find('export const SEED_ACCOUNTS =')
lessons_json_str = json.dumps(lessons, ensure_ascii=False, indent=2)

new_text = text[:pos_lessons] + f"export const SEED_LESSONS = {lessons_json_str};\n\n" + text[pos_accounts:]

with open('frontend/js/api/demo-seed-data.js', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Updated SEED_LESSONS in frontend/js/api/demo-seed-data.js successfully!")
