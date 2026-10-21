import json, sys
sys.stdout.reconfigure(encoding='utf-8')

for lvl in [1, 2, 3]:
    with open(f"data/hsk30/hsk-{lvl}.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        print(f"HSK {lvl}: {len(data)} items, IDs {data[0]['id']}..{data[-1]['id']}")
