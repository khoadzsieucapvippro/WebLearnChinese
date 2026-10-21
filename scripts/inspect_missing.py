import json
import sys
sys.path.append('scripts')
from compute_tally import missing_official_ids, hsk_official

missing = [hsk_official[i] for i in missing_official_ids]
for lvl in [1, 2, 3]:
    lvl_items = [m for m in missing if int(m['level']) == lvl]
    print(f"=== Level {lvl} Missing ({len(lvl_items)} items) ===")
    words = [f"{m['hanzi']}({m['pinyin']})" for m in lvl_items]
    print(', '.join(words[:25]))
    if len(words) > 25:
        print(', '.join(words[25:50]))
