import json, sys
sys.stdout.reconfigure(encoding='utf-8')

for lvl in [1, 2, 3]:
    with open(f"data/hsk30/hsk-{lvl}.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        for it in data:
            if "白" in it.get("hanzi", ""):
                print(f"HSK {lvl}: {it}")
