import json

with open('data/hsk30/l3_to_enrich.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

p1 = [it for it in items if it['id'] <= 650]
for it in p1:
    print(f"{it['id']}: {it['hanzi']} ({it['pinyin']}) [{it['pos']}]")
