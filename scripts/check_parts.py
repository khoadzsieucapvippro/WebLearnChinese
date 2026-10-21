import json

with open('data/hsk30/l3_to_enrich.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

p1 = [it for it in items if it['id'] <= 650]
p2 = [it for it in items if 650 < it['id'] <= 800]
p3 = [it for it in items if it['id'] > 800]

print(f"Total: {len(items)}")
print(f"Part 1 (<= 650): {len(p1)}")
print(f"Part 2 (651..800): {len(p2)}")
print(f"Part 3 (> 800): {len(p3)}")
