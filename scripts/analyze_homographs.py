import json, sys
sys.stdout.reconfigure(encoding='utf-8')

mapping = {
    'ā':'a','á':'a','ǎ':'a','à':'a',
    'ē':'e','é':'e','ě':'e','è':'e',
    'ī':'i','í':'i','ǐ':'i','ì':'i',
    'ō':'o','ó':'o','ǒ':'o','ò':'o',
    'ū':'u','ú':'u','ǔ':'u','ù':'u',
    'ǖ':'u','ǘ':'u','ǚ':'u','ǜ':'u','ü':'u',
    '’':'', "'": '', ' ': '', '-': ''
}
def to_raw(p):
    p = p.lower()
    for k, v in mapping.items():
        p = p.replace(k, v)
    return p

all_items = []
for lvl in [1, 2, 3]:
    with open(f"data/hsk30/hsk-{lvl}.json", "r", encoding="utf-8") as f:
        all_items.extend(json.load(f))

by_hanzi = {}
by_hanzi_raw = {}
for it in all_items:
    hz = it['hanzi']
    raw = to_raw(it['pinyin'])
    it['raw'] = raw
    by_hanzi.setdefault(hz, []).append(it)
    by_hanzi_raw.setdefault((hz, raw), []).append(it)

print("=== Homographs with SAME hanzi and SAME pinyin_raw ===")
for (hz, raw), items in by_hanzi_raw.items():
    if len(items) > 1:
        print(f"Hanzi: {hz}, raw: {raw}")
        for it in items:
            print(f"  id: {it['id']}, level: {it['level']}, pinyin: {it['pinyin']}, pos: {it.get('part_of_speech')}, homograph: {it.get('homograph')}, label: {it.get('level_label')}")

print("\n=== Items with SAME hanzi but DIFFERENT pinyin (Polyphones) ===")
for hz, items in by_hanzi.items():
    if len(items) > 1 and len(set(it['pinyin'] for it in items)) > 1:
        print(f"Hanzi: {hz}")
        for it in items:
            print(f"  id: {it['id']}, level: {it['level']}, pinyin: {it['pinyin']}, pos: {it.get('part_of_speech')}, homograph: {it.get('homograph')}")
