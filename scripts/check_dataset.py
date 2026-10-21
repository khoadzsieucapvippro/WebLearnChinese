import json
import csv
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "hsk30")

test_words = ['爱好', '班', '本子', '白', '别的', '别人', '病人', '车', '东', '请进', '请坐']

hsk_dataset = {} # id -> dict
hsk_by_hanzi = {} # hanzi -> list of dict

for lvl in [1, 2, 3]:
    p = os.path.join(DATA_DIR, f"hsk-{lvl}.json")
    with open(p, "r", encoding="utf-8") as f:
        items = json.load(f)
    for it in items:
        hsk_dataset[it['id']] = it
        hsk_by_hanzi.setdefault(it['hanzi'], []).append(it)

print(f"Total HSK 1-3 items: {len(hsk_dataset)}")
print(f"Total unique Hanzi: {len(hsk_by_hanzi)}")

print("\n--- Checking Test Words in HSK 1-3 Dataset ---")
for w in test_words:
    if w in hsk_by_hanzi:
        for entry in hsk_by_hanzi[w]:
            print(f"  {w}: ID {entry['id']}, Level {entry['level']}, pinyin={entry['pinyin']}, pos={entry['part_of_speech']}, entry={entry.get('entry')}, page={entry.get('source_pdf_page')}")
    else:
        print(f"  {w}: NOT FOUND in HSK 1-3 dataset!")
