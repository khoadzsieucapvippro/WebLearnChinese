import sys, os, json
sys.stdout.reconfigure(encoding='utf-8')
sys.path.append('scripts')
from audit_meanings import current_db

suspicious = []
for k, rec in current_db.items():
    hz = rec['hanzi']
    m = rec['meaning_vi']
    hv = rec['meaning_han_viet']
    issues = []
    m_lower = m.lower()
    for w in ['biến thể', 'tứ thư', 'khoa cử', 'đông và tây', 'variant', 'thể cổ', 'bán-', 'dạng viết', 'xem thêm']:
        if w in m_lower:
            issues.append(f'scraping:{w}')
    if 'họ' in m_lower and hz not in ['姓', '他们', '她们', '它们']:
        issues.append('ho')
    if '"' in m or "'" in m:
        issues.append('quotes')
    if any(c in m for c in ['[', ']', '{', '}', '|', '<', '>']):
        issues.append('markup')
    if len(m.strip()) < 2:
        issues.append('too_short')
    if issues:
        suspicious.append((hz, rec['pinyin'], hv, m, issues))

print(f"Total suspicious items in current_db: {len(suspicious)}")
for s in suspicious:
    print(f"{s[0]} ({s[1]}): '{s[3]}' | HV='{s[2]}' | Issues={s[4]}")
