import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open("frontend/js/api/demo-seed-data.js", "r", encoding="utf-8") as f:
    text = f.read()

pos_lessons = text.find("export const SEED_LESSONS")
pos_accounts = text.find("export const SEED_ACCOUNTS")
lessons_text = text[pos_lessons:pos_accounts]

items = re.findall(r'"hanzi":\s*"([^"]+)",\s*"pinyin":\s*"([^"]+)",\s*"pinyinRaw":\s*"([^"]+)",\s*"meaningHanViet":\s*"([^"]+)",\s*"meaningVi":\s*"([^"]+)",\s*"hskLevel":\s*(\d+)', lessons_text)
print(f"Total vocabulary items in SEED_LESSONS: {len(items)}")

level_counts = {}
for hz, py, raw, hv, vi, lvl in items:
    level_counts[lvl] = level_counts.get(lvl, 0) + 1

print("Level distribution in SEED_LESSONS:", level_counts)

# Check known words
for hz, py, raw, hv, vi, lvl in items:
    if hz in ['爱好', '班', '本子', '白', '别的', '别人', '病人', '东西', '大学', '从']:
        print(f"  {hz} ({py}): level={lvl}, vi='{vi}', hv='{hv}'")
