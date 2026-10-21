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

print(f"HSK 1: {len(hsk1)}, HSK 2: {len(hsk2)}, HSK 3: {len(hsk3)}")

def make_vocab_dict(v):
    return {
        "vocabId": v["vocabId"],
        "hanzi": v["hanzi"],
        "pinyin": v["pinyin"],
        "meaningHanViet": v.get("meaningHanViet", ""),
        "meaningVi": v.get("meaningVi", ""),
        "exampleSentence": v.get("exampleSentence", ""),
        "exampleTranslation": v.get("exampleTranslation", "")
    }

# 15 HSK 1 titles
hsk1_meta = [
    ("Bài 01 — Gia đình, Chào hỏi & Đời sống (001–020)", "Từ vựng mở đầu: xưng hô gia đình, chào hỏi, đồ dùng và sinh hoạt thường nhật."),
    ("Bài 02 — Phương tiện, Trường học & Thiết bị (021–040)", "Phương tiện đi lại, trường học, liên lạc điện thoại và giải trí phim ảnh."),
    ("Bài 03 — Thời gian, Ăn uống & Cảm xúc (041–060)", "Bữa ăn, nhà hàng, đơn vị thời gian và các biểu đạt cảm xúc vui tươi."),
    ("Bài 04 — Công việc, Ngôn ngữ & Tính từ cơ bản (061–080)", "Môi trường công sở, ngôn ngữ tiếng Trung và các tính từ mô tả thường gặp."),
    ("Bài 05 — Thời gian, Gia đình & Hoạt động thường nhật (081–100)", "Các mốc thời gian trong năm, thành viên gia đình và hoạt động hàng ngày."),
    ("Bài 06 — Mua bán, Thầy cô & Số đếm (101–120)", "Hoạt động mua bán, trao đổi, thầy cô trường lớp và các số đếm căn bản."),
    ("Bài 07 — Ẩm thực, Đại từ chỉ định & Nơi chốn (121–140)", "Món ăn truyền thống, đại từ chỉ định và các biểu đạt vị trí nơi chốn."),
    ("Bài 08 — Đại từ xưng hô, Mối quan hệ & Đời sống (141–160)", "Đại từ nhân xưng, đối tác giao tiếp, bạn bè và sinh hoạt gia đình."),
    ("Bài 09 — Lễ nghi, Thời gian & Công việc hàng ngày (161–180)", "Lễ nghi chào hỏi, kính ngữ, các buổi trong ngày và công việc thường nhật."),
    ("Bài 10 — Giờ giấc, Nhu cầu sinh hoạt & Trò chuyện (181–200)", "Thời gian giờ giấc, sức khỏe, nhu cầu ngủ nghỉ và trò chuyện giao tiếp."),
    ("Bài 11 — Thời tiết, Đại từ & Lịch trình tuần (201–220)", "Thời tiết khí hậu, ngày trong tuần, câu hỏi giao tiếp và hoạt động giải trí."),
    ("Bài 12 — Trang phục, Y tế & Sinh hoạt gia đình (221–240)", "Quần áo trang phục, bác sĩ bệnh viện, thời tiết mưa gió và sở thích cá nhân."),
    ("Bài 13 — Bữa sáng, Chỉ dẫn vị trí & Không gian (241–260)", "Bữa sáng, định hướng vị trí không gian, học tập và chúc mừng năm mới."),
    ("Bài 14 — Hành động, Địa điểm & Cuộc sống học đường (261–280)", "Trường học, bạn bè, rèn luyện thể thao và các trạng thái sinh hoạt."),
    ("Bài 15 — Đồ vật, Động từ & Biểu đạt giao tiếp (281–300)", "Đồ dùng sinh hoạt, phương hướng, cách thức hành động và câu hỏi thăm dò.")
]

# 10 HSK 2 titles
hsk2_meta = [
    ("Bài 01 — Xã giao, Đời sống & Xuất hành (301–320)", "Giao tiếp xã giao, giúp đỡ, so sánh, xuất hành và đi lại thường nhật."),
    ("Bài 02 — Di chuyển, Tàu điện & Cảm nhận (321–340)", "Tàu điện ngầm, xe cộ, hành động di chuyển và mức độ thấu hiểu vấn đề."),
    ("Bài 03 — Màu sắc, Xe buýt & Phương hướng (341–360)", "Phương tiện công cộng, màu sắc trang phục, hoa lá và phương hướng."),
    ("Bài 04 — Sân bay, Lớp học & Khách sạn (361–380)", "Đi máy bay, khách sạn lưu trú, lớp học và các thói quen thường ngày."),
    ("Bài 05 — Trang phục, Thể thao & Du lịch (381–400)", "Quần áo, bóng rổ, du lịch khám phá và cảm nhận trạng thái cơ thể."),
    ("Bài 06 — Gia đình, Công viên & Thời tiết (401–420)", "Người thân gia đình, vui chơi ngoài trời, thời tiết nắng ráo và chạy bộ."),
    ("Bài 07 — Sức khỏe, Đồng hồ & Cảm xúc (421–440)", "Sức khỏe thân thể, sinh nhật, giờ giấc và các cảm nhận thoải mái."),
    ("Bài 08 — Thể thao, Khiêu vũ & Vị trí ngoài trời (441–460)", "Đá bóng, nhảy múa, định hướng không gian và lý do trong giao tiếp."),
    ("Bài 09 — Sức khỏe, Hiệu thuốc & Giải trí (461–480)", "Khám bệnh bốc thuốc, bơi lội, họ tên và ý nghĩa trong cuộc sống."),
    ("Bài 10 — Vận động, Chuẩn bị & Phương hướng (481–500)", "Bóng đá, rèn luyện thể thao, chuẩn bị kế hoạch và định vị phương hướng.")
]

# 25 HSK 3 titles
hsk3_meta = [
    ("Bài 01 — Bạn bè, Gia đình & An toàn (501–520)", "Xưng hô thân mật, dọn dẹp nhà cửa, ghi chép và giữ gìn an toàn."),
    ("Bài 02 — Thi đấu, So sánh & Kế hoạch (521–540)", "Tham gia thi đấu, máy tính xách tay, so sánh và chuẩn bị kế hoạch."),
    ("Bài 03 — Thực đơn, Thành tích & Thành phố (541–560)", "Gọi món nhà hàng, đánh giá thành tích, đời sống đô thị và trang phục."),
    ("Bài 04 — Xuất phát, Sinh nhật & Bánh ngọt (561–580)", "Lịch trình xuất phát, kỷ niệm ngày sinh, bánh ngọt và đồ dùng mang theo."),
    ("Bài 05 — Cơ hội, Điểm số & Phương hướng (581–600)", "Nắm bắt cơ hội, đạt điểm số cao, địa lý đông tây nam bắc."),
    ("Bài 06 — Mùa đông, Động vật & Tiện lợi (601–620)", "Khí hậu mùa đông, sở thú, mì ăn liền và các phương tiện tiện lợi."),
    ("Bài 07 — Phương pháp, Cảm mạo & Công việc (621–640)", "Tìm kiếm phương pháp, bảo vệ sức khỏe khi cảm mạo và làm việc chăm chỉ."),
    ("Bài 08 — Đường sắt cao tốc, Quốc gia & Lễ tết (641–660)", "Tàu cao tốc hiện đại, văn hóa quốc gia, ngày lễ tết và quá khứ."),
    ("Bài 09 — Biển cả, Môi trường & Đổi trả (661–680)", "Cảnh sắc biển cả, bảo vệ môi trường, đổi tiền và mua sắm."),
    ("Bài 10 — Hội nghị, Trả lời & Kiểm tra vé (681–700)", "Tham gia hội nghị, giải đáp thắc mắc, soát vé và kiểm tra tài liệu."),
    ("Bài 11 — Sức khỏe, Gặp gỡ & Quản lý (701–720)", "Chăm sóc sức khỏe, gặp mặt bạn bè, quản lý công việc và đồ uống."),
    ("Bài 12 — Quyết định, Thẻ từ & Điều hòa (721–740)", "Đưa ra quyết định, sử dụng thẻ tiện ích, điều hòa và bài khóa."),
    ("Bài 13 — Đồ dùng, Du học & Hàng xóm (741–760)", "Vật dụng ăn uống, cuộc sống du học sinh và quan hệ láng giềng."),
    ("Bài 14 — Giao thông, Bậc thang & Phố xá (761–780)", "Cầu thang bộ, ngã tư đường phố, giao thông và nam nữ thanh niên."),
    ("Bài 15 — Độ khó, Lớp học & Sự kỳ lạ (781–800)", "Giải quyết bài tập khó, phân chia khối lớp và những điều kỳ thú."),
    ("Bài 16 — Khởi hành, Bút chì & Dễ dàng (801–820)", "Máy bay cất cánh, đồ dùng học tập, ô che mưa và sự thuận tiện."),
    ("Bài 17 — Nhà cửa, Trang phục & Cảm nhận (821–840)", "Quét dọn nhà cửa, ghế sô pha, áo khoác và các trải nghiệm cá nhân."),
    ("Bài 18 — Toán học, Đồng nghiệp & Đồng ý (841–860)", "Môn toán, cây cối thiên nhiên, trao đổi đồng nghiệp và sự đồng thuận."),
    ("Bài 19 — Thư viện, Văn hóa & Căn phòng (861–880)", "Nghiên cứu thư viện, nét đẹp văn hóa, không gian phòng ốc và địa lý."),
    ("Bài 20 — Phương hướng, Thói quen & Hiệu trưởng (881–900)", "Định hướng địa lý, rèn luyện thói quen tốt và giao tiếp học đường."),
    ("Bài 21 — Tin tức, Báo chí & Yêu cầu (901–920)", "Đọc báo cập nhật tin tức, thực phẩm tươi ngon và các yêu cầu công việc."),
    ("Bài 22 — Trang sách, Tương đồng & Ảnh hưởng (921–940)", "Đọc sách từng trang, nhận biết điểm tương đồng và sức ảnh hưởng."),
    ("Bài 23 — Trò chơi, Hòm thư & Đại hội thể thao (941–960)", "Thư điện tử, du khách tham quan, trò chơi và đại hội thể thao."),
    ("Bài 24 — Vận động viên, Vệ sinh & Điều kiện (961–980)", "Tập luyện thể thao, giữ gìn vệ sinh và thiết lập điều kiện giải quyết."),
    ("Bài 25 — Trọng tâm, Cuộc sống & Bài tập về nhà (981–1000)", "Nhiệm vụ trọng tâm, hoàn thành bài tập, đón khách quý và đúc kết.")
]

hsk1_topics = []
for i in range(15):
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

print(f"Total topics: HSK1={len(hsk1_topics)} (300 words), HSK2={len(hsk2_topics)} (200 words), HSK3={len(hsk3_topics)} (500 words)")

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

# Read srs-review-page.js
with open('frontend/js/pages/srs-review-page.js', 'r', encoding='utf-8') as f:
    page_js = f.read()

pos_hsk1 = page_js.find('export const HSK1_TOPICS =')
# Find where the comment before HSK1_TOPICS starts
pos_comment = page_js.rfind('/**', 0, pos_hsk1)
if pos_comment == -1:
    pos_comment = pos_hsk1

pos_hsk3 = page_js.find('export const HSK3_TOPICS =')
pos_end_hsk3 = page_js.find('\n];\n', pos_hsk3)
pos_replace_end = pos_end_hsk3 + len('\n];\n')

new_page_js = page_js[:pos_comment] + js_code + page_js[pos_replace_end:]

# Update the shelf default counts in updateProgressOverview
# hsk1Words.length || 200 -> 300
new_page_js = re.sub(r'hsk1Words\.length \|\| \d+', 'hsk1Words.length || 300', new_page_js)
new_page_js = re.sub(r'hsk2Words\.length \|\| \d+', 'hsk2Words.length || 200', new_page_js)
new_page_js = re.sub(r'hsk3Words\.length \|\| \d+', 'hsk3Words.length || 500', new_page_js)

with open('frontend/js/pages/srs-review-page.js', 'w', encoding='utf-8') as f:
    f.write(new_page_js)

print("Updated frontend/js/pages/srs-review-page.js successfully!")

# Update frontend/srs-review.html shelf text
with open('frontend/srs-review.html', 'r', encoding='utf-8') as f:
    html_text = f.read()

html_text = re.sub(r'<div class="srs-deck-meta" id="deckMeta_hsk1">[^<]+</div>',
                   '<div class="srs-deck-meta" id="deckMeta_hsk1">15 Bài • Đã học 0/300</div>', html_text)
html_text = re.sub(r'<div class="srs-deck-meta" id="deckMeta_hsk2">[^<]+</div>',
                   '<div class="srs-deck-meta" id="deckMeta_hsk2">10 Bài • Đã học 0/200</div>', html_text)
html_text = re.sub(r'<div class="srs-deck-meta" id="deckMeta_hsk3">[^<]+</div>',
                   '<div class="srs-deck-meta" id="deckMeta_hsk3">25 Bài • Đã học 0/500</div>', html_text)

with open('frontend/srs-review.html', 'w', encoding='utf-8') as f:
    f.write(html_text)

print("Updated frontend/srs-review.html successfully!")

# Bump dataset version in demo-fallback-engine.js to version 8 to force clean browser rehydration
with open('frontend/js/api/demo-fallback-engine.js', 'r', encoding='utf-8') as f:
    engine_js = f.read()

engine_js = re.sub(r'const CURRENT_DATASET_VERSION = \d+;', 'const CURRENT_DATASET_VERSION = 8;', engine_js)

with open('frontend/js/api/demo-fallback-engine.js', 'w', encoding='utf-8') as f:
    f.write(engine_js)

print("Bumped demo-fallback-engine.js to version 8 successfully!")
