import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/js/api/demo-seed-data.js', encoding='utf-8') as f:
    text = f.read()

# find 帮助
pos = text.find('"hanzi": "帮助"')
if pos != -1:
    print("Found 帮助 at", pos)
    print(text[pos-100:pos+300])

# check CHAR_TO_RADICALS_MAP for 帮 and 助
pos_map = text.find('CHAR_TO_RADICALS_MAP')
if pos_map != -1:
    pos_bang = text.find('"帮":', pos_map)
    print("帮 in map:", text[pos_bang:pos_bang+50])
    pos_zhu = text.find('"助":', pos_map)
    print("助 in map:", text[pos_zhu:pos_zhu+50])
