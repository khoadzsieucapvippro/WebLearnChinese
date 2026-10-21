import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open("backend/src/main/resources/db/migration/V23__standardize_hsk_1_to_3_vocabulary_2025.sql", "r", encoding="utf-8") as f:
    sql = f.read()

# Collect all meanings from updates and inserts in V23
records = []
for line in sql.splitlines():
    if "UPDATE `VOCABULARY` SET" in line:
        m_hz = re.search(r"WHERE `hanzi` = '([^']+)'", line)
        m_vi = re.search(r"`meaning_vi` = '([^']+)'", line)
        m_hv = re.search(r"`meaning_han_viet` = '([^']+)'", line)
        m_py = re.search(r"`pinyin` = '([^']+)'", line)
        m_lvl = re.search(r"`hsk_level` = (\d+)", line)
        m_id = re.search(r"`hsk_source_id` = (\d+|NULL)", line)
        if m_hz and m_vi:
            records.append({
                'type': 'UPDATE',
                'hanzi': m_hz.group(1),
                'pinyin': m_py.group(1) if m_py else None,
                'meaning_vi': m_vi.group(1),
                'meaning_han_viet': m_hv.group(1) if m_hv else None,
                'level': m_lvl.group(1) if m_lvl else None,
                'source_id': m_id.group(1) if m_id else None
            })
    elif line.startswith("('") and "', '" in line:
        # INSERT row
        parts = [p.strip().strip("'") for p in line.rstrip(",;").lstrip("(").rstrip(")").split("', '")]
        if len(parts) >= 6:
            hz = parts[0]
            py = parts[1]
            hv = parts[3]
            vi = parts[4]
            lvl = parts[5]
            records.append({
                'type': 'INSERT',
                'hanzi': hz,
                'pinyin': py,
                'meaning_vi': vi,
                'meaning_han_viet': hv,
                'level': lvl,
                'source_id': None
            })

print(f"Total records parsed from V23: {len(records)}")

# Check for quality issues in meaning_vi
issues = []
bad_keywords = [
    'biến thể', 'tứ thư', 'khoa cử', 'đông và tây', 'variant', 'thể cổ', 
    'bán-', 'dạng viết', 'xem thêm', 'lượng từ: ', 'viết tắt của', 'dùng trong',
    'sự khác biệt; không nhất quán', 'tiếp theo; thứ hai', 'vú; sữa',
    'người đăng trước', 'cũng đọc là'
]

for r in records:
    vi = r['meaning_vi'].lower()
    found = []
    for bk in bad_keywords:
        if bk in vi:
            found.append(bk)
    if r['meaning_han_viet'] and 'nhân' in r['meaning_han_viet'].lower() and r['hanzi'].endswith('儿') and not r['hanzi'].endswith('人'):
        found.append('er_as_nhan')
    if found:
        issues.append((r, found))

print(f"Total records with identified quality issues: {len(issues)}")
for r, f in issues:
    print(f"[{r['type']}] {r['hanzi']} ({r['pinyin']}): '{r['meaning_vi']}' | HV='{r['meaning_han_viet']}' | Issues={f}")
