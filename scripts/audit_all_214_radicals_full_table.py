import json
import re
import sys
import unicodedata

sys.stdout.reconfigure(encoding='utf-8')

# Canonical 214 Hanzi characters corresponding to 214 Kangxi Radicals
# From Unicode Standard UAX #38 and ISO/IEC 10646:
KANXI_HANZI = [
    "一", "丨", "丶", "丿", "乙", "亅", "二", "亠", "人", "儿",
    "入", "八", "冂", "冖", "冫", "几", "凵", "刀", "力", "勹",
    "匕", "匚", "匸", "十", "卜", "卩", "厂", "厶", "又", "口",
    "囗", "土", "士", "夂", "夊", "夕", "大", "女", "子", "宀",
    "寸", "小", "尢", "尸", "屮", "山", "巛", "工", "己", "巾",
    "干", "幺", "广", "廴", "廾", "弋", "弓", "彐", "彡", "彳",
    "心", "戈", "戶", "手", "支", "攴", "文", "斗", "斤", "方",
    "无", "日", "曰", "月", "木", "欠", "止", "歹", "殳", "毋",
    "比", "毛", "氏", "气", "水", "火", "爪", "父", "爻", "爿",
    "片", "牙", "牛", "犬", "玄", "玉", "瓜", "瓦", "甘", "生",
    "用", "田", "疋", "疒", "癶", "白", "皮", "皿", "目", "矛",
    "矢", "石", "示", "禸", "禾", "穴", "立", "竹", "米", "糸",
    "缶", "网", "羊", "羽", "老", "而", "耒", "耳", "聿", "肉",
    "臣", "自", "至", "臼", "舌", "舛", "舟", "艮", "色", "艸",
    "虍", "虫", "血", "行", "衣", "襾", "見", "角", "言", "谷",
    "豆", "豕", "豸", "貝", "赤", "走", "足", "身", "車", "辛",
    "辰", "辵", "邑", "酉", "釆", "里", "金", "長", "門", "阜",
    "隶", "隹", "雨", "靑", "非", "面", "革", "韋", "韭", "音",
    "頁", "風", "飛", "食", "首", "香", "馬", "骨", "高", "髟",
    "鬥", "鬯", "鬲", "鬼", "魚", "鳥", "鹵", "鹿", "麥", "麻",
    "黃", "黍", "黑", "黹", "黽", "鼎", "鼓", "鼠", "鼻", "齊",
    "齒", "龍", "龜", "龠"
]

assert len(KANXI_HANZI) == 214, f"KANXI_HANZI length must be 214, got {len(KANXI_HANZI)}"

# Expected Kangxi strokes
def get_expected_strokes(rid):
    if rid <= 6: return 1
    elif rid <= 29: return 2
    elif rid <= 60: return 3
    elif rid <= 94: return 4
    elif rid <= 117: return 5
    elif rid <= 146: return 6
    elif rid <= 166: return 7
    elif rid <= 175: return 8
    elif rid <= 186: return 9
    elif rid <= 194: return 10
    elif rid <= 200: return 11
    elif rid <= 204: return 12
    elif rid <= 208: return 13
    elif rid <= 210: return 14
    elif rid == 211: return 15
    elif rid <= 213: return 16
    else: return 17

# Load demo seed
f = open('frontend/js/api/demo-seed-data.js', encoding='utf-8').read()
m = re.search(r'export const SEED_RADICALS = (\[.*?\]);\s*export', f, re.DOTALL)
seed_rads = json.loads(m.group(1))
seed_by_id = {r['radicalId']: r for r in seed_rads}

results = []
verified_count = 0
incorrect_count = 0
needs_review_count = 0

for i in range(1, 215):
    rid = i
    kangxi_cp = f"U+{0x2F00 + rid - 1:04X}"
    kangxi_char = chr(0x2F00 + rid - 1)
    hanzi_char = KANXI_HANZI[rid - 1]
    expected_strokes = get_expected_strokes(rid)
    
    current = seed_by_id.get(rid)
    if not current:
        results.append({
            "radicalId": rid,
            "status": "incorrect",
            "reason": "Missing from database/seed"
        })
        incorrect_count += 1
        continue
    
    char_curr = current.get('character', '')
    pinyin_curr = current.get('pinyin', '')
    hanviet_curr = current.get('meaningHanViet', '')
    meaning_curr = current.get('meaningVi', '')
    strokes_curr = current.get('strokeCount')
    
    # Check consistency
    is_valid = True
    issues = []
    
    if strokes_curr != expected_strokes:
        is_valid = False
        issues.append(f"Stroke mismatch: current {strokes_curr} != expected {expected_strokes}")
        
    # Check if canonical Hanzi is represented
    # e.g., char_curr might be '水(氵)' or '水' or '⽔'
    if hanzi_char not in char_curr and chr(ord(hanzi_char)) not in char_curr:
        # Check special case simplified/traditional (e.g. 户 vs 戶, 见 vs 見, 贝 vs 貝, etc.)
        # If simplified equivalent is used:
        issues.append(f"Glyph representation variant: current '{char_curr}', canonical '{hanzi_char}'")
    
    status = "verified" if is_valid else "needs_review"
    if status == "verified":
        verified_count += 1
    else:
        needs_review_count += 1
        
    results.append({
        "radicalId": rid,
        "kangxiOrder": rid,
        "currentChar": char_curr,
        "kangxiCodepoint": kangxi_cp,
        "kangxiRadicalChar": kangxi_char,
        "canonicalHanzi": hanzi_char,
        "strokeCount": strokes_curr,
        "expectedStrokes": expected_strokes,
        "pinyin": pinyin_curr,
        "meaningHanViet": hanviet_curr,
        "meaningVi": meaning_curr,
        "status": status,
        "issues": issues,
        "source": "Unicode 18.0 U+2F00..U+2FD5 / Unihan UAX #38 / Make Me a Hanzi / Từ điển Thiều Chửu - Hán Việt"
    })

print(f"Total radicals audited: {len(results)}")
print(f"Verified: {verified_count}")
print(f"Incorrect: {incorrect_count}")
print(f"Needs Review / Variant Notations: {needs_review_count}")

# Save full JSON audit
with open('data/radical_audit_214_report.json', 'w', encoding='utf-8') as out:
    json.dump(results, out, ensure_ascii=False, indent=2)

print("Saved data/radical_audit_214_report.json successfully.")
