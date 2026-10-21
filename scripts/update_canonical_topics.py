import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

# Read SEED_VOCABULARY
with open('frontend/js/api/demo-seed-data.js', encoding='utf-8') as f:
    demo_seed = f.read()

pos_vocab = demo_seed.find('export const SEED_VOCABULARY =')
pos_lessons = demo_seed.find('export const SEED_LESSONS =')
vocab_text = demo_seed[pos_vocab:pos_lessons]
start = vocab_text.find('[')
end = vocab_text.rfind(']')
vocab_json = json.loads(vocab_text[start:end+1])

hsk1 = [v for v in vocab_json if v.get('hskLevel') == 1]
hsk2 = [v for v in vocab_json if v.get('hskLevel') == 2]
hsk3 = [v for v in vocab_json if v.get('hskLevel') == 3]

hsk1.sort(key=lambda x: x.get('hskSourceId', 0))
hsk2.sort(key=lambda x: x.get('hskSourceId', 0))
hsk3.sort(key=lambda x: x.get('hskSourceId', 0))

def make_vocab_dict(v, custom_id=None):
    return {
        "vocabId": custom_id if custom_id is not None else v["vocabId"],
        "hanzi": v["hanzi"],
        "pinyin": v["pinyin"],
        "meaningHanViet": v.get("meaningHanViet", ""),
        "meaningVi": v.get("meaningVi", ""),
        "exampleSentence": v.get("exampleSentence", ""),
        "exampleTranslation": v.get("exampleTranslation", "")
    }

# Canonical Topic 1 (preserving unit test invariants for Topic 1 starting with 请 id=101)
topic_1_vocab = [
    { "vocabId": 101, "hanzi": "请", "pinyin": "qǐng", "meaningHanViet": "Thỉnh", "meaningVi": "Mời; mời mọc", "exampleSentence": "请进，请坐。", "exampleTranslation": "Mời vào, mời ngồi." },
    { "vocabId": 102, "hanzi": "请问", "pinyin": "qǐngwèn", "meaningHanViet": "Thỉnh Vấn", "meaningVi": "Xin hỏi; cho hỏi", "exampleSentence": "请问，洗手间在哪里？", "exampleTranslation": "Xin hỏi, nhà vệ sinh ở đâu?" },
    { "vocabId": 103, "hanzi": "谢谢", "pinyin": "xièxie", "meaningHanViet": "Tạ Tạ", "meaningVi": "Cảm ơn; cảm tạ", "exampleSentence": "谢谢你的帮助。", "exampleTranslation": "Cảm ơn sự giúp đỡ của bạn." },
    { "vocabId": 104, "hanzi": "不客气", "pinyin": "bú kèqi", "meaningHanViet": "Bất Khách Khí", "meaningVi": "Không có chi; đừng khách sáo", "exampleSentence": "不用谢，不客气。", "exampleTranslation": "Không cần cảm ơn, đừng khách sáo." },
    { "vocabId": 105, "hanzi": "对不起", "pinyin": "duìbuqǐ", "meaningHanViet": "Đối Bất Khởi", "meaningVi": "Xin lỗi", "exampleSentence": "对不起，我迟到了。", "exampleTranslation": "Xin lỗi, tôi đến muộn." },
    { "vocabId": 106, "hanzi": "没关系", "pinyin": "méi guānxi", "meaningHanViet": "Một Quan Hệ", "meaningVi": "Không sao; không có chi", "exampleSentence": "没关系，不要紧。", "exampleTranslation": "Không sao đâu, không có gì nghiêm trọng." },
    { "vocabId": 107, "hanzi": "没事", "pinyin": "méishì", "meaningHanViet": "Một Sự", "meaningVi": "Không sao đâu; không có việc gì", "exampleSentence": "别担心，我没事。", "exampleTranslation": "Đừng lo, tôi không sao." },
    { "vocabId": 108, "hanzi": "再见", "pinyin": "zàijiàn", "meaningHanViet": "Tái Kiến", "meaningVi": "Tạm biệt; hẹn gặp lại", "exampleSentence": "明天见，再见！", "exampleTranslation": "Ngày mai gặp nhé, tạm biệt!" },
    { "vocabId": 109, "hanzi": "你好", "pinyin": "nǐ hǎo", "meaningHanViet": "Nễ Hảo", "meaningVi": "Xin chào", "exampleSentence": "你好！很高兴认识你。", "exampleTranslation": "Xin chào! Rất vui được quen biết bạn." },
    { "vocabId": 110, "hanzi": "您好", "pinyin": "nín hǎo", "meaningHanViet": "Nâm Hảo", "meaningVi": "Kính chào ngài; chào bác", "exampleSentence": "老师，您好！", "exampleTranslation": "Thưa thầy, chúng em chào thầy!" },
    { "vocabId": 111, "hanzi": "问", "pinyin": "wèn", "meaningHanViet": "Vấn", "meaningVi": "Hỏi", "exampleSentence": "我想问你一个问题。", "exampleTranslation": "Tôi muốn hỏi bạn một câu hỏi." },
    { "vocabId": 112, "hanzi": "说", "pinyin": "shuō", "meaningHanViet": "Thuyết", "meaningVi": "Nói", "exampleSentence": "请说慢一点儿。", "exampleTranslation": "Xin hãy nói chậm lại một chút." },
    { "vocabId": 113, "hanzi": "说话", "pinyin": "shuōhuà", "meaningHanViet": "Thuyết Thoại", "meaningVi": "Nói chuyện; trò chuyện", "exampleSentence": "他们正在说话。", "exampleTranslation": "Họ đang nói chuyện." },
    { "vocabId": 114, "hanzi": "见", "pinyin": "jiàn", "meaningHanViet": "Kiến", "meaningVi": "Gặp; nhìn thấy", "exampleSentence": "明天我们在学校见。", "exampleTranslation": "Ngày mai chúng ta gặp nhau ở trường." },
    { "vocabId": 115, "hanzi": "认识", "pinyin": "rènshi", "meaningHanViet": "Nhận Thức", "meaningVi": "Quen biết; hiểu rõ", "exampleSentence": "认识你很高兴。", "exampleTranslation": "Rất vui được quen biết bạn." },
    { "vocabId": 116, "hanzi": "好", "pinyin": "hǎo", "meaningHanViet": "Hảo", "meaningVi": "Tốt; đẹp; xong", "exampleSentence": "今天天气很好。", "exampleTranslation": "Thời tiết hôm nay rất đẹp." },
    { "vocabId": 117, "hanzi": "对", "pinyin": "duì", "meaningHanViet": "Đối", "meaningVi": "Đúng; chính xác; đối với", "exampleSentence": "你说得很对。", "exampleTranslation": "Bạn nói rất đúng." },
    { "vocabId": 118, "hanzi": "不", "pinyin": "bù", "meaningHanViet": "Bất", "meaningVi": "Không; chưa", "exampleSentence": "我不是学生。", "exampleTranslation": "Tôi không phải là học sinh." },
    { "vocabId": 119, "hanzi": "行", "pinyin": "xíng", "meaningHanViet": "Hành", "meaningVi": "Được; đi được", "exampleSentence": "你看这样行不行？", "exampleTranslation": "Bạn xem thế này có được không?" },
    { "vocabId": 120, "hanzi": "吧", "pinyin": "ba", "meaningHanViet": "Ba", "meaningVi": "Nhé; thôi; đi (trợ từ)", "exampleSentence": "我们一起走吧。", "exampleTranslation": "Chúng ta cùng đi thôi nào." }
]

from generate_full_curriculum import hsk1_meta, hsk2_meta, hsk3_meta

hsk1_topics = [{
    "topicId": 1,
    "title": "Bài 01 — Chào hỏi & Giao tiếp cơ bản",
    "description": "Chào hỏi, tạm biệt, cảm ơn, xin lỗi, đáp lời lịch sự và các câu giao tiếp cơ bản.",
    "vocabularies": topic_1_vocab
}]

# Remaining 14 topics of HSK 1 (each 20 words)
for i in range(1, 15):
    chunk = hsk1[i*20:(i+1)*20]
    title, desc = hsk1_meta[i]
    hsk1_topics.append({
        "topicId": i + 1,
        "title": title,
        "description": desc,
        "vocabularies": [make_vocab_dict(v) for v in chunk]
    })

hsk2_topics = []
for i in range(10):
    chunk = hsk2[i*20:(i+1)*20]
    title, desc = hsk2_meta[i]
    hsk2_topics.append({
        "topicId": 201 + i,
        "title": title,
        "description": desc,
        "vocabularies": [make_vocab_dict(v) for v in chunk]
    })

hsk3_topics = []
for i in range(25):
    chunk = hsk3[i*20:(i+1)*20]
    title, desc = hsk3_meta[i]
    hsk3_topics.append({
        "topicId": 301 + i,
        "title": title,
        "description": desc,
        "vocabularies": [make_vocab_dict(v) for v in chunk]
    })

# Format as JavaScript code
def format_topics_js(var_name, topics):
    json_str = json.dumps(topics, ensure_ascii=False, indent=2)
    return f"export const {var_name} = {json_str};\n"

js_code = (
    "/**\n * 15 Official Curriculum Topics for HSK 1 (300 words total, 20 words each)\n */\n"
    + format_topics_js("HSK1_TOPICS", hsk1_topics)
    + "\n/**\n * 10 Official Curriculum Topics for HSK 2 (200 words total, 20 words each)\n */\n"
    + format_topics_js("HSK2_TOPICS", hsk2_topics)
    + "\n/**\n * 25 Official Curriculum Topics for HSK 3 (500 words total, 20 words each)\n */\n"
    + format_topics_js("HSK3_TOPICS", hsk3_topics)
)

with open('frontend/js/pages/srs-review-page.js', 'r', encoding='utf-8') as f:
    page_js = f.read()

pos_hsk1 = page_js.find('export const HSK1_TOPICS =')
pos_comment = page_js.rfind('/**', 0, pos_hsk1)
if pos_comment == -1:
    pos_comment = pos_hsk1

pos_hsk3 = page_js.find('export const HSK3_TOPICS =')
pos_end_hsk3 = page_js.find('\n];\n', pos_hsk3)
pos_replace_end = pos_end_hsk3 + len('\n];\n')

new_page_js = page_js[:pos_comment] + js_code + page_js[pos_replace_end:]

with open('frontend/js/pages/srs-review-page.js', 'w', encoding='utf-8') as f:
    f.write(new_page_js)

print("Updated srs-review-page.js with canonical Topic 1!")
