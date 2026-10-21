import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Check in demo-seed-data.js
f = open('frontend/js/api/demo-seed-data.js', encoding='utf-8').read()

m_chars = re.search(r'export const CHAR_TO_RADICALS_MAP = (\{.*?\});', f, re.DOTALL)
if m_chars:
    char_map = json.loads(m_chars.group(1))
    for target in ['车', '茶', '学']:
        print(f"CHAR_TO_RADICALS_MAP['{target}'] = {char_map.get(target)}")

m_single = re.search(r'export const CHAR_TO_RADICAL_MAP = (\{.*?\});', f, re.DOTALL)
if m_single:
    single_map = json.loads(m_single.group(1))
    for target in ['车', '茶', '学']:
        print(f"CHAR_TO_RADICAL_MAP['{target}'] (Primary Kangxi) = {single_map.get(target)}")

# 2. Check Make Me a Hanzi dictionary.txt
dict_chars = {}
with open('data/hsk30/makemeahanzi_dict.txt', 'r', encoding='utf-8') as f:
    for line in f:
        item = json.loads(line)
        c = item.get('character')
        if c in ['车', '茶', '学']:
            print(f"\nMake Me a Hanzi for '{c}':")
            print(f"  radical: {item.get('radical')}")
            print(f"  decomposition: {item.get('decomposition')}")
            print(f"  etymology: {item.get('etymology')}")
            print(f"  pinyin: {item.get('pinyin')}")
            print(f"  definition: {item.get('definition')}")
