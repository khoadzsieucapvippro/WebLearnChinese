import json
import urllib.request
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "hsk30")
os.makedirs(DATA_DIR, exist_ok=True)

BASE_URL = "https://raw.githubusercontent.com/uranbekanarbaev/hsk-3.0-vocabulary-dataset/main"

files = [
    ("hsk-1.json", f"{BASE_URL}/data/by-level/hsk-1.json"),
    ("hsk-2.json", f"{BASE_URL}/data/by-level/hsk-2.json"),
    ("hsk-3.json", f"{BASE_URL}/data/by-level/hsk-3.json"),
    ("hsk-3.0-all.json", f"{BASE_URL}/data/hsk-3.0-all.json"),
    ("hsk-1.csv", f"{BASE_URL}/data/by-level/hsk-1.csv"),
    ("hsk-2.csv", f"{BASE_URL}/data/by-level/hsk-2.csv"),
    ("hsk-3.csv", f"{BASE_URL}/data/by-level/hsk-3.csv"),
]

for filename, url in files:
    dest = os.path.join(DATA_DIR, filename)
    if not os.path.exists(dest):
        print(f"Downloading {filename} from {url}...")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as resp:
                content = resp.read()
                with open(dest, "wb") as f:
                    f.write(content)
            print(f"Saved {filename} ({len(content)} bytes)")
        except Exception as e:
            print(f"Failed to download {filename}: {e}")
    else:
        print(f"Already exists: {filename}")

# Inspect the downloaded JSON files
for lvl in [1, 2, 3]:
    p = os.path.join(DATA_DIR, f"hsk-{lvl}.json")
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
        print(f"HSK {lvl}: {len(data)} items")
        if data:
            print(f"  First: {data[0]}")
            print(f"  Last:  {data[-1]}")
