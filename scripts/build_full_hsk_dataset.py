# -*- coding: utf-8 -*-
"""
Builder for 568 Missing HSK 1-3 Official Items
Includes accurate Sino-Vietnamese readings, clear Vietnamese meanings,
and natural Chinese example sentences with Vietnamese translations.
"""

import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT_DIR, "data", "hsk30")

# Load raw 568 missing items
with open(os.path.join(DATA_DIR, "missing_568_raw.json"), "r", encoding="utf-8") as f:
    raw_items = json.load(f)

# Load Sino-Viet character dictionary
with open(os.path.join(DATA_DIR, "sino-viet-characters.json"), "r", encoding="utf-8") as f:
    sv_char_map = {it['hanzi']: it['sinoViet'] for it in json.load(f)}

EXTRA_SV = {
    '丢': 'Đâu', '交': 'Giao', '凉': 'Lương', '凌': 'Lăng', '勺': 'Chước',
    '区': 'Khu', '卖': 'Mại', '卫': 'Vệ', '受': 'Thụ', '士': 'Sĩ',
    '封': 'Phong', '展': 'Triển', '拍': 'Phách', '挺': 'Đĩnh', '毛': 'Mao',
    '沙': 'Sa', '泉': 'Tuyền', '海': 'Hải', '激': 'Kích', '矿': 'Khoáng',
    '码': 'Mã', '糖': 'Đường', '羽': 'Vũ', '脏': 'Tạng', '角': 'Giác',
    '言': 'Ngôn', '适': 'Thích', '遍': 'Biến', '饺': 'Giảo'
}
sv_char_map.update(EXTRA_SV)

def get_han_viet(hanzi):
    # Special multi-character word readings if needed, else character by character
    SPECIAL = {
        '出租车': 'Xuất Tô Xa',
        '冰激凌': 'Băng Kích Lăng',
        '阿姨': 'A Di',
        '巧克力': 'Xảo Khắc Lực',
        '咖啡': 'Ca Phê',
        '沙发': 'Sa Phát',
    }
    if hanzi in SPECIAL:
        return SPECIAL[hanzi]
    parts = []
    for c in hanzi:
        parts.append(sv_char_map.get(c, c))
    return ' '.join(parts)

print(f"Loaded {len(raw_items)} missing items.")
