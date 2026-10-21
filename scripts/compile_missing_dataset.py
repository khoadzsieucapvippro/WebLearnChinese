# -*- coding: utf-8 -*-
import sys, json, os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.append('scripts')

from missing_hsk1 import HSK1_DATA
from missing_hsk2 import HSK2_DATA
from hsk3_dict_p1 import HSK3_DICT_P1
from hsk3_dict_p2 import HSK3_DICT_P2
from hsk3_dict_p3 import HSK3_DICT_P3

all_l3_defs = list(HSK3_DICT_P1.values()) + list(HSK3_DICT_P2.values()) + list(HSK3_DICT_P3.values())

with open('data/hsk30/l3_to_enrich.json', 'r', encoding='utf-8') as f:
    l3_items = json.load(f)

assert len(all_l3_defs) == 423
assert len(l3_items) == 423

# Polished sentences for the 11 items
POLISH = {
    694: {  # 季节
        "meaning_vi": "Mùa, mùa màng, thời tiết",
        "example_sentence": "一年之中你最喜欢哪个季节？",
        "example_translation": "Trong một năm bạn thích nhất mùa nào?"
    },
    758: {  # 邻居
        "meaning_vi": "Hàng xóm, láng giềng",
        "example_sentence": "我和隔壁邻居的关系非常融洽。",
        "example_translation": "Tôi và người hàng xóm bên cạnh quan hệ rất hòa thuận."
    },
    784: {  # 年轻
        "meaning_vi": "Trẻ tuổi, thanh niên",
        "example_sentence": "他虽然年轻，但是工作经验非常丰富。",
        "example_translation": "Anh ấy tuy trẻ tuổi nhưng kinh nghiệm làm việc rất phong phú."
    },
    812: {  # 裙子
        "meaning_vi": "Váy, chân váy",
        "example_sentence": "这条红色的裙子非常适合你。",
        "example_translation": "Chiếc váy màu đỏ này rất hợp với bạn."
    },
    888: {  # 洗澡
        "meaning_vi": "Tắm, tắm rửa",
        "example_sentence": "每天晚上睡前洗澡是个好习惯。",
        "example_translation": "Mỗi tối tắm trước khi đi ngủ là một thói quen tốt."
    },
    892: {  # 相信
        "meaning_vi": "Tin tưởng, tin tưởng vào",
        "example_sentence": "我相信只要坚持努力，就一定能成功。",
        "example_translation": "Tôi tin rằng chỉ cần kiên trì nỗ lực thì nhất định sẽ thành công."
    },
    906: {  # 信
        "meaning_vi": "Bức thư, tin tưởng, thư từ",
        "example_sentence": "今天下午我收到了朋友寄来的一封信。",
        "example_translation": "Chiều nay tôi đã nhận được một bức thư bạn gửi đến."
    },
    935: {  # 音乐
        "meaning_vi": "Âm nhạc",
        "example_sentence": "闲暇时听听古典音乐能让人心情放松。",
        "example_translation": "Lúc rảnh rỗi nghe chút âm nhạc cổ điển có thể giúp tâm trạng thư giãn."
    },
    966: {  # 站
        "meaning_vi": "Đứng, dựng đứng (động từ)",
        "example_sentence": "公交车上大家都站着，没有空座位。",
        "example_translation": "Trên xe buýt mọi người đều đứng, không có chỗ ngồi trống."
    },
    969: {  # 着急
        "meaning_vi": "Sốt ruột, lo lắng, gấp gáp",
        "example_sentence": "快迟到了，他心里感到非常着急。",
        "example_translation": "Sắp muộn rồi, trong lòng anh ấy cảm thấy rất sốt ruột."
    },
    970: {  # 照
        "meaning_vi": "Chiếu, soi, chụp, hướng theo",
        "example_sentence": "温暖的阳光照在湖面上，风景十分美丽。",
        "example_translation": "Ánh nắng ấm áp chiếu lên mặt hồ, phong cảnh vô cùng đẹp đẽ."
    }
}

# Load raw 568 missing items
with open('data/hsk30/missing_568_raw.json', 'r', encoding='utf-8') as f:
    raw_missing = json.load(f)

print(f"Total raw missing items: {len(raw_missing)}")

# Load Sino-Viet character dictionary
with open('data/hsk30/sino-viet-characters.json', 'r', encoding='utf-8') as f:
    sv_char_map = {it['hanzi']: it['sinoViet'] for it in json.load(f)}

EXTRA_SV = {
    '丢': 'Đâu', '交': 'Giao', '凉': 'Lương', '凌': 'Lăng', '勺': 'Chước',
    '区': 'Khu', '卖': 'Mại', '卫': 'Vệ', '受': 'Thụ', '士': 'Sĩ',
    '封': 'Phong', '展': 'Triển', '拍': 'Phách', '挺': 'Đĩnh', '毛': 'Mao',
    '沙': 'Sa', '泉': 'Tuyền', '海': 'Hải', '激': 'Kích', '矿': 'Khoáng',
    '码': 'Mã', '糖': 'Đường', '羽': 'Vũ', '脏': 'Tạng', '角': 'Giác',
    '言': 'Ngôn', '适': 'Thích', '遍': 'Biến', '饺': 'Giảo',
    '辆': 'Lượng', '辆': 'Lượng', '酸': 'Toan', '俩': 'Lưỡng', '划': 'Họa',
    '占': 'Chiêm', '卷': 'Quyển', '圈': 'Quyển', '处': 'Xứ', '差': 'Sai',
    '弹': 'Đàn', '强': 'Cường', '折': 'Chiết', '扒': 'Bát', '提': 'Đề',
    '数': 'Số', '更': 'Canh', '校': 'Hiệu', '模': 'Mô', '横': 'Hoành',
    '漂': 'Phiêu', '省': 'Tỉnh', '盛': 'Thịnh', '看': 'Khán', '种': 'Chủng',
    '空': 'Không', '系': 'Hệ', '结': 'Kết', '给': 'Cấp', '背': 'Bối',
    '落': 'Lạc', '行': 'Hành', '角': 'Giác', '调': 'Điệu', '重': 'Trọng',
    '量': 'Lượng', '长': 'Trường', '难': 'Nan'
}
sv_char_map.update(EXTRA_SV)

SPECIAL_SV = {
    '出租车': 'Xuất Tô Xa',
    '冰激凌': 'Băng Kích Lăng',
    '阿姨': 'A Di',
    '巧克力': 'Xảo Khắc Lực',
    '咖啡': 'Ca Phê',
    '沙发': 'Sa Phát',
    '羽毛球': 'Vũ Mao Cầu',
    '乒乓球': 'Binh Bàng Cầu',
    '方便面': 'Phương Tiện Diện',
    '西红柿': 'Tây Hồng Thị',
    '普通话': 'Phổ Thông Thoại',
    '自行车': 'Tự Hành Xa',
    '公共汽车': 'Công Cộng Khí Xa',
    '研究生': 'Nghiên Cứu Sinh',
    '图书馆': 'Đồ Thư Quán',
    '大使馆': 'Đại Sứ Quán',
    '洗手间': 'Tẩy Thủ Gian',
    '卫生间': 'Vệ Sinh Gian',
    '护照': 'Hộ Chiếu',
    '信用卡': 'Tín Dụng Tạp',
}

def get_han_viet(hanzi):
    if hanzi in SPECIAL_SV:
        return SPECIAL_SV[hanzi]
    parts = []
    for c in hanzi:
        parts.append(sv_char_map.get(c, c))
    return ' '.join(parts)

# Build full dictionary of 568 items
final_missing_dict = {}

# 1. Level 1 (37 items)
l1_raw = [it for it in raw_missing if int(it['level']) == 1]
for it in l1_raw:
    hz = it['hanzi']
    d = HSK1_DATA[hz]
    final_missing_dict[it['id']] = {
        'id': it['id'],
        'level': int(it['level']),
        'hanzi': it['hanzi'],
        'pinyin': it['pinyin'],
        'pinyin_raw': it['computed_raw'],
        'part_of_speech': it['part_of_speech'],
        'homograph': it['homograph'],
        'source_pdf_page': it['source_pdf_page'],
        'han_viet': get_han_viet(it['hanzi']),
        'meaning_vi': d['meaning_vi'],
        'example_sentence': d['example_sentence'],
        'example_translation': d['example_translation']
    }

# 2. Level 2 (108 items)
l2_raw = [it for it in raw_missing if int(it['level']) == 2]
for it in l2_raw:
    d = HSK2_DATA[it['id']]
    final_missing_dict[it['id']] = {
        'id': it['id'],
        'level': int(it['level']),
        'hanzi': it['hanzi'],
        'pinyin': it['pinyin'],
        'pinyin_raw': it['computed_raw'],
        'part_of_speech': it['part_of_speech'],
        'homograph': it['homograph'],
        'source_pdf_page': it['source_pdf_page'],
        'han_viet': get_han_viet(it['hanzi']),
        'meaning_vi': d['meaning_vi'],
        'example_sentence': d['example_sentence'],
        'example_translation': d['example_translation']
    }

# 3. Level 3 (423 items)
for i in range(len(l3_items)):
    it_target = l3_items[i]
    it_id = it_target['id']
    if it_id in POLISH:
        d = POLISH[it_id]
    else:
        d = all_l3_defs[i]
    
    # find corresponding in raw_missing
    it_raw = next(r for r in raw_missing if r['id'] == it_id)
    final_missing_dict[it_id] = {
        'id': it_id,
        'level': int(it_raw['level']),
        'hanzi': it_raw['hanzi'],
        'pinyin': it_raw['pinyin'],
        'pinyin_raw': it_raw['computed_raw'],
        'part_of_speech': it_raw['part_of_speech'],
        'homograph': it_raw['homograph'],
        'source_pdf_page': it_raw['source_pdf_page'],
        'han_viet': get_han_viet(it_raw['hanzi']),
        'meaning_vi': d['meaning_vi'],
        'example_sentence': d['example_sentence'],
        'example_translation': d['example_translation']
    }

print(f"Total entries built: {len(final_missing_dict)}")
assert len(final_missing_dict) == 568

# Save to data/hsk30/hsk_missing_definitions.json
out_path = 'data/hsk30/hsk_missing_definitions.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(final_missing_dict, f, ensure_ascii=False, indent=2)

print(f"Successfully saved 568 enriched items to {out_path}")

# Verify 100% sentence coverage (hanzi in example_sentence)
missing_char_in_ex = []
for it_id, d in final_missing_dict.items():
    if d['hanzi'] not in d['example_sentence']:
        missing_char_in_ex.append((it_id, d['hanzi'], d['example_sentence']))

print(f"Items where hanzi is NOT in example_sentence: {len(missing_char_in_ex)}")
for m in missing_char_in_ex:
    print("  ", m)
