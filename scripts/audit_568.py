import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open("data/hsk30/hsk_missing_definitions.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"Total entries in missing definitions: {len(data)}")

suspicious = []
for k, v in data.items():
    hz = v['hanzi']
    m_vi = v.get('meaning_vi', '')
    m_hv = v.get('han_viet', '')
    ex_s = v.get('example_sentence', '')
    ex_t = v.get('example_translation', '')
    
    issues = []
    if not m_vi or len(m_vi.strip()) < 2:
        issues.append('empty_or_short_vi')
    if not m_hv:
        issues.append('empty_hv')
    if not ex_s or not ex_t:
        issues.append('missing_example')
    if any(c in m_vi for c in ['[', ']', '{', '}', '|', '<', '>', '"']):
        issues.append('markup_in_vi')
    for bad in ['biến thể', 'tứ thư', 'khoa cử', 'variant', 'surname', 'nhân']:
        if bad in m_vi.lower():
            issues.append(f'bad_word:{bad}')
    if hz.endswith('儿') and not hz.endswith('人') and 'nhân' in m_hv.lower():
        issues.append('er_as_nhan_in_hv')
    
    if issues:
        suspicious.append((k, hz, v.get('pinyin'), m_hv, m_vi, issues))

print(f"Found {len(suspicious)} suspicious items in 568 definitions:")
for s in suspicious:
    print(f"  ID {s[0]} ({s[1]} {s[2]}): HV='{s[3]}' | VI='{s[4]}' | Issues={s[5]}")
