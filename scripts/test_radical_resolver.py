# -*- coding: utf-8 -*-
import json, re, sys, os
sys.stdout.reconfigure(encoding='utf-8')

# 1. Load Kangxi Radicals 1..214
with open('backend/src/main/resources/db/migration/V1__init_schema.sql', 'r', encoding='utf-8') as f:
    v1_sql = f.read()

# Load demo-seed-data.js for CHAR_TO_RADICALS_MAP and SEED_RADICALS
with open('frontend/js/api/demo-seed-data.js', 'r', encoding='utf-8') as f:
    demo_js = f.read()

m_rads = re.search(r'export const CHAR_TO_RADICALS_MAP = Object\.freeze\((\{.*?\})\);', demo_js, re.DOTALL)
existing_char_to_rads = json.loads(m_rads.group(1)) if m_rads else {}

# Load makemeahanzi
mmh = {}
with open('data/hsk30/makemeahanzi_dict.txt', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            d = json.loads(line)
            mmh[d['character']] = d
        except Exception:
            pass

print(f"Loaded {len(mmh)} entries from makemeahanzi_dict.txt")
print(f"Existing CHAR_TO_RADICALS_MAP has {len(existing_char_to_rads)} entries")

# Build Kangxi single-char to ID mapping
# Kangxi standard 214 radicals:
KANGXI_STANDARD = {
    1: '一', 2: '丨', 3: '丶', 4: '丿', 5: '乙', 6: '亅',
    7: '二', 8: '亠', 9: '人', 10: '儿', 11: '入', 12: '八', 13: '冂', 14: '冖', 15: '冫', 16: '几', 17: '凵', 18: '刀', 19: '力', 20: '勹', 21: '匕', 22: '匚', 23: '匸', 24: '十', 25: '卜', 26: '卩', 27: '厂', 28: '厶', 29: '又',
    30: '口', 31: '囗', 32: '土', 33: '士', 34: '夂', 35: '夊', 36: '夕', 37: '大', 38: '女', 39: '子', 40: '宀', 41: '寸', 42: '小', 43: '尢', 44: '尸', 45: '屮', 46: '山', 47: '巛', 48: '工', 49: '己', 50: '巾', 51: '干', 52: '幺', 53: '广', 54: '廴', 55: '廾', 56: '弋', 57: '弓', 58: '彐', 59: '彡', 60: '彳',
    61: '心', 62: '戈', 63: '戶', 64: '手', 65: '支', 66: '攴', 67: '文', 68: '斗', 69: '斤', 70: '方', 71: '无', 72: '日', 73: '曰', 74: '月', 75: '木', 76: '欠', 77: '止', 78: '歹', 79: '殳', 80: '毋', 81: '比', 82: '毛', 83: '氏', 84: '气', 85: '水', 86: '火', 87: '爪', 88: '父', 89: '爻', 90: '爿', 91: '片', 92: '牙', 93: '牛', 94: '犬',
    95: '玄', 96: '玉', 97: '瓜', 98: '瓦', 99: '甘', 100: '生', 101: '用', 102: '田', 103: '疋', 104: '疒', 105: '癶', 106: '白', 107: '皮', 108: '皿', 109: '目', 110: '矛', 111: '矢', 112: '石', 113: '示', 114: '禸', 115: '禾', 116: '穴', 117: '立',
    118: '竹', 119: '米', 120: '糸', 121: '缶', 122: '网', 123: '羊', 124: '羽', 125: '老', 126: '而', 127: '耒', 128: '耳', 129: '聿', 130: '肉', 131: '臣', 132: '自', 133: '至', 134: '臼', 135: '舌', 136: '舛', 137: '舟', 138: '艮', 139: '色', 140: '艸', 141: '虍', 142: '虫', 143: '血', 144: '行', 145: '衣', 146: '襾',
    147: '見', 148: '角', 149: '言', 150: '谷', 151: '豆', 152: '豕', 153: '豸', 154: '貝', 155: '赤', 156: '走', 157: '足', 158: '身', 159: '車', 160: '辛', 161: '辰', 162: '辵', 163: '邑', 164: '酉', 165: '釆', 166: '里',
    167: '金', 168: '長', 169: '門', 170: '阜', 171: '隶', 172: '隹', 173: '雨', 174: '靑', 175: '非',
    176: '面', 177: '革', 178: '韋', 179: '韭', 180: '音', 181: '頁', 182: '風', 183: '飛', 184: '食', 185: '首', 186: '香',
    187: '馬', 188: '骨', 189: '高', 190: '髟', 191: '鬥', 192: '鬯', 193: '鬲', 194: '鬼',
    195: '魚', 196: '鳥', 197: '鹵', 198: '鹿', 199: '麥', 200: '麻',
    201: '黃', 202: '黍', 203: '黑', 204: '黹', 205: '黽', 206: '鼎', 207: '鼓', 208: '鼠', 209: '鼻', 210: '齊',
    211: '齒', 212: '龍', 213: '龜', 214: '龠'
}

# Variants and simplified forms to radical ID
RAD_VARIANTS = {
    '亻': 9, '𠆢': 9, '⺈': 18, '刂': 18, '刂': 18, '冫': 15, '几': 16,
    '十': 24, '卜': 25, '卩': 26, '厂': 27, '厶': 28, '又': 29,
    '口': 30, '囗': 31, '土': 32, '士': 33, '夂': 34, '夕': 36, '大': 37,
    '女': 38, '子': 39, '宀': 40, '寸': 41, '小': 42, '⺌': 42, '⺍': 42,
    '尸': 44, '山': 46, '巾': 50, '干': 51, '幺': 52, '广': 53, '廴': 54,
    '廾': 55, '弋': 56, '弓': 57, '彐': 58, '彡': 59, '彳': 60,
    '心': 61, '忄': 61, '⺗': 61, '戈': 62, '户': 63, '戶': 63,
    '手': 64, '扌': 64, '支': 65, '攵': 66, '攴': 66, '斤': 69, '方': 70,
    '日': 72, '曰': 73, '月': 74, '木': 75, '欠': 76, '止': 77, '歹': 78,
    '殳': 79, '毋': 80, '母': 80, '比': 81, '毛': 82, '氏': 83, '气': 84, '水': 85, '氵': 85, '氺': 85,
    '火': 86, '灬': 86, '爪': 87, '爫': 87, '父': 88, '片': 91, '牙': 92,
    '牛': 93, '牜': 93, '犬': 94, '犭': 94, '玉': 96, '王': 96, '瓜': 97,
    '瓦': 98, '甘': 99, '生': 100, '用': 101, '田': 102, '疋': 103,
    '疒': 104, '白': 106, '皮': 107, '皿': 108, '目': 109, '矛': 110,
    '矢': 111, '石': 112, '示': 113, '礻': 113, '禾': 115, '穴': 116, '立': 117,
    '竹': 118, '⺮': 118, '米': 119, '糸': 120, '纟': 120, '缶': 121,
    '网': 122, '罒': 122, '⺳': 122, '羊': 123, '⺶': 123, '羽': 124, '老': 125, '耂': 125,
    '而': 126, '耒': 127, '耳': 128, '肉': 130, '⺼': 130, '臣': 131, '自': 132,
    '至': 133, '臼': 134, '舌': 135, '舟': 137, '艮': 138, '色': 139,
    '艸': 140, '艹': 140, '虍': 141, '虫': 142, '血': 143, '行': 144,
    '衣': 145, '衤': 145, '西': 146, '覀': 146, '见': 147, '見': 147,
    '角': 148, '言': 149, '讠': 149, '谷': 150, '豆': 151, '豕': 152,
    '贝': 154, '貝': 154, '赤': 155, '走': 156, '足': 157, '⻊': 157, '身': 158,
    '车': 159, '車': 159, '辛': 160, '辰': 161, '辵': 162, '辶': 162,
    '邑': 163, '阝': 170, # right side is 163, left is 170
    '酉': 164, '里': 166, '金': 167, '钅': 167, '长': 168, '長': 168,
    '门': 169, '門': 169, '阜': 170, '隹': 172, '雨': 173, '⻗': 173,
    '青': 174, '靑': 174, '非': 175, '面': 176, '革': 177, '韦': 178, '韋': 178,
    '音': 180, '页': 181, '頁': 181, '风': 182, '風': 182, '飞': 183, '飛': 183,
    '食': 184, '饣': 184, '飠': 184, '首': 185, '香': 186, '马': 187, '馬': 187,
    '骨': 188, '高': 189, '鬼': 194, '鱼': 195, '魚': 195, '鸟': 196, '鳥': 196,
    '麦': 199, '麥': 199, '麻': 200, '黄': 201, '黃': 201, '黑': 203,
    '齿': 211, '齒': 211, '龙': 212, '龍': 212, '龟': 213, '龜': 213
}

# Merge KANGXI_STANDARD into RAD_VARIANTS
for rid, ch in KANGXI_STANDARD.items():
    if ch not in RAD_VARIANTS:
        RAD_VARIANTS[ch] = rid

# Load all 1000 HSK 1-3 characters
all_hsk_chars = set()
for lvl in [1, 2, 3]:
    with open(f'data/hsk30/hsk-{lvl}.json', 'r', encoding='utf-8') as f:
        for it in json.load(f):
            for c in it['hanzi']:
                all_hsk_chars.add(c)

print(f"Total unique characters across HSK 1-3: {len(all_hsk_chars)}")

# Right-side 阝 (Ấp - #163 邑) character set
RIGHT_B_CHARS = {'邮', '邻', '都', '那', '哪', '帮', '郊', '部', '邓', '郑', '郭', '郸', '鄙', '邢', '邦', '邪'}

# Recursively decompose character to Kangxi radicals
def decompose_char(c, depth=0, parent_char=None):
    if depth > 5:
        return []
    if c == '阝':
        if parent_char in RIGHT_B_CHARS:
            return [163]
        return [170]
    if c in RAD_VARIANTS:
        return [RAD_VARIANTS[c]]
    entry = mmh.get(c)
    if not entry:
        return []
    # If radical field in entry and it's a known radical
    rad = entry.get('radical')
    res = []
    if rad:
        if rad == '阝':
            res.append(163 if c in RIGHT_B_CHARS else 170)
        elif rad in RAD_VARIANTS:
            res.append(RAD_VARIANTS[rad])
    
    decomp = entry.get('decomposition', '')
    # Remove IDS characters
    ids_chars = set('⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺⿻？')
    components = [ch for ch in decomp if ch not in ids_chars]
    for comp in components:
        if comp == c:
            continue
        sub_rads = decompose_char(comp, depth + 1, parent_char=c)
        res.extend(sub_rads)
    return sorted(list(set(res)))

full_char_map = dict(existing_char_to_rads)

unresolved = []
for c in sorted(all_hsk_chars):
    if c not in full_char_map:
        rads = decompose_char(c)
        if rads:
            full_char_map[c] = rads
        else:
            unresolved.append(c)

print(f"Characters resolved: {len(all_hsk_chars) - len(unresolved)} / {len(all_hsk_chars)}")
print(f"Unresolved count: {len(unresolved)}: {unresolved}")
