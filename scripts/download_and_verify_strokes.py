import os
import sys
import json
import urllib.request
import urllib.parse
import time

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT_DIR, "data", "hsk30")
STROKES_DIR = os.path.join(ROOT_DIR, "frontend", "assets", "data", "strokes")

os.makedirs(STROKES_DIR, exist_ok=True)

# 1. Collect all unique Hanzi from HSK 1-3
hsk_items = []
for lvl in [1, 2, 3]:
    p = os.path.join(DATA_DIR, f"hsk-{lvl}.json")
    with open(p, "r", encoding="utf-8") as f:
        hsk_items.extend(json.load(f))

# Also include supplementary chars if any
supp_chars = set()
seed_path = os.path.join(ROOT_DIR, "frontend", "js", "api", "demo-seed-data.js")
if os.path.exists(seed_path):
    with open(seed_path, "r", encoding="utf-8") as f:
        content = f.read()
    import re
    m = re.search(r'export const SEED_VOCABULARY = (\[.*?\]);\s*export', content, re.DOTALL)
    if m:
        seed_vocab = json.loads(m.group(1))
        for v in seed_vocab:
            for c in v.get('hanzi', ''):
                if '\u4e00' <= c <= '\u9fff':
                    supp_chars.add(c)

hsk_chars = set()
char_levels = {}
for it in hsk_items:
    lvl = it.get('level', 1)
    for c in it.get('hanzi', ''):
        if '\u4e00' <= c <= '\u9fff':
            hsk_chars.add(c)
            if c not in char_levels or lvl < char_levels[c]:
                char_levels[c] = lvl

all_required_chars = sorted(hsk_chars | supp_chars)
print(f"Total required unique Hanzi characters: {len(all_required_chars)}")
print(f"HSK 1-3 unique Hanzi characters: {len(hsk_chars)}")

existing_files = set(os.listdir(STROKES_DIR))

missing = []
present = []
for c in all_required_chars:
    fname = f"{c}.json"
    hex_name = f"#U{ord(c):04X}.json"
    hex_lower = f"#u{ord(c):04x}.json"
    if fname in existing_files or hex_name in existing_files or hex_lower in existing_files:
        present.append(c)
    else:
        missing.append(c)

print(f"Initial coverage: {len(present)} present, {len(missing)} missing.")

# Download missing stroke files
success = 0
failed = []

for idx, c in enumerate(missing, 1):
    encoded = urllib.parse.quote(c)
    url = f"https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/{encoded}.json"
    dest = os.path.join(STROKES_DIR, f"{c}.json")

    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) eLearning-Stroke-Auditor/1.0'}
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            raw_data = response.read().decode('utf-8')
            data = json.loads(raw_data)

            # Strict validation
            if not isinstance(data, dict):
                raise ValueError("Payload is not a JSON object")
            strokes = data.get("strokes")
            medians = data.get("medians")

            if not isinstance(strokes, list) or len(strokes) == 0:
                raise ValueError(f"Invalid strokes array: {strokes}")
            if not isinstance(medians, list) or len(medians) == 0:
                raise ValueError(f"Invalid medians array: {medians}")
            if len(strokes) != len(medians):
                raise ValueError(f"Mismatch: strokes={len(strokes)}, medians={len(medians)}")

            for s_idx, s in enumerate(strokes):
                if not isinstance(s, str) or not s.strip().startswith('M'):
                    raise ValueError(f"Stroke {s_idx} is not valid SVG path: {s[:30] if isinstance(s, str) else type(s)}")

            for m_idx, med in enumerate(medians):
                if not isinstance(med, list) or len(med) < 1:
                    raise ValueError(f"Median {m_idx} is empty or not a list")

            # Write formatted valid JSON
            with open(dest, "w", encoding="utf-8") as out_f:
                json.dump(data, out_f, ensure_ascii=False)

            success += 1
            if success % 25 == 0 or idx == len(missing):
                print(f"Downloaded and validated {success}/{len(missing)} ({c} - U+{ord(c):04X}, {len(strokes)} strokes)")

    except Exception as e:
        failed.append((c, ord(c), str(e)))
        print(f"FAILED for '{c}' (U+{ord(c):04X}): {e}")

    time.sleep(0.02)  # courteous delay

print(f"\nDownload finished: {success} succeeded, {len(failed)} failed.")
if failed:
    print(f"Failed characters: {failed}")

# Write Attribution & License file
license_content = """# Character Stroke Order Data License & Attribution

The stroke order data in `frontend/assets/data/strokes/` is sourced from:
1. **Hanzi Writer Data** (https://github.com/chanind/hanzi-writer-data)
2. **Make Me a Hanzi Project** (https://github.com/skishore/makemeahanzi)

## Licenses
- The character stroke SVG curves, medians, and radical stroke indices are derived from fonts produced by **Arphic Technology** under the **Arphic Public License** (1999).
- The Hanzi Writer extraction and format tooling is licensed under the **MIT License** (Copyright (c) 2016-2024 Chanind Kwak).
- Make Me a Hanzi dictionary decomposition data is licensed under the **GNU LGPL v3** and graphics data under the **Arphic Public License**.

## Compliance
- All stroke order JSON files (`<character>.json`) are stored and served locally offline for privacy and offline resilience.
- No dynamic runtime downloading from external CDNs occurs during user study sessions.
"""

license_file = os.path.join(STROKES_DIR, "LICENSE.md")
with open(license_file, "w", encoding="utf-8") as lf:
    lf.write(license_content)

print(f"License written to {license_file}")
