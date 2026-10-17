# -*- coding: utf-8 -*-
import json
import re
import sys

with open("frontend/js/api/demo-seed-data.js", "r", encoding="utf-8") as f:
    content = f.read()

raw = content.split("export const SEED_RADICALS = ")[1].split(";\n\nexport const SEED_VOCABULARY")[0]
radicals = json.loads(raw)

# Known radical variants
VARIANTS = {
    "人": ["亻"],
    "刀": ["刂"],
    "水": ["氵", "氺"],
    "手": ["扌"],
    "心": ["忄"],
    "艸": ["艹"],
    "犬": ["犭"],
    "牛": ["牜"],
    "示": ["礻"],
    "衣": ["衤"],
    "竹": ["⺮"],
    "网": ["罒", "罓"],
    "辵": ["辶"],
    "邑": ["阝"],
    "阜": ["阝"],
    "金": ["釒", "钅"],
    "食": ["飠", "饣"],
    "言": ["訁", "讠"],
    "門": ["门"],
    "長": ["镸", "长"],
    "車": ["车"],
    "韋": ["韦"],
    "頁": ["页"],
    "風": ["风", "凬"],
    "飛": ["飞"],
    "馬": ["马"],
    "魚": ["鱼"],
    "鳥": ["鸟"],
    "麥": ["麦"],
    "齊": ["齐", "斉"],
    "齒": ["齿", "歯"],
    "龍": ["龙", "竜"],
    "龜": ["龟", "亀"],
    "糸": ["糹", "纟"],
    "貝": ["贝"],
    "見": ["见"],
    "火": ["灬"],
    "玉": ["王"],
    "肉": ["月"],
    "足": ["𧾷"],
    "老": ["耂"],
    "攴": ["攵"],
    "爿": ["丬"],
    "毋": ["母", "毌"],
    "无": ["旡"],
    "疋": ["匹"],
    "白": ["百"], # wait, 百 is 一+白
}

for r in radicals:
    rid = r["radicalId"]
    char = r["character"].split("(")[0].strip() # base char
    m = re.search(r"Ví dụ:\s*(.*?)\.\s*Mẹo nhớ:", r["explanationVi"])
    if not m:
        print(f"[{rid}] MISSING EXAMPLES PATTERN")
        continue
    ex_str = m.group(1)
    examples = re.findall(r"([\u4e00-\u9fff])\s*\(([^:]+):\s*([^)]+)\)", ex_str)
    
    # Collect all acceptable forms for this radical
    acceptable = [char]
    # Check if radical char in seed data has brackets like 人(亻)
    if "(" in r["character"]:
        inner = r["character"].split("(")[1].replace(")", "")
        for v in inner.split("/"):
            acceptable.append(v.strip())
    if char in VARIANTS:
        acceptable.extend(VARIANTS[char])
        
    for ex_char, pinyin, meaning in examples:
        # Check if any acceptable radical form is a substring of ex_char
        # Wait, in Chinese characters, substring in python string only works if it's the exact same unicode character!
        # Because Chinese characters are single unicode codepoints, a subcomponent is NOT a substring in unicode!
        pass

print("Script template ready.")
