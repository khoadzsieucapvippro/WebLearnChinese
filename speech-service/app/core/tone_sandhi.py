import re
from typing import List, Dict, Any, Tuple
import pypinyin
from pypinyin import pinyin, Style

PINYIN_TONE_MARKS = {
    'ā': ('a', 1), 'á': ('a', 2), 'ǎ': ('a', 3), 'à': ('a', 4),
    'ē': ('e', 1), 'é': ('e', 2), 'ě': ('e', 3), 'è': ('e', 4),
    'ī': ('i', 1), 'í': ('i', 2), 'ǐ': ('i', 3), 'ì': ('i', 4),
    'ō': ('o', 1), 'ó': ('o', 2), 'ǒ': ('o', 3), 'ò': ('o', 4),
    'ū': ('u', 1), 'ú': ('u', 2), 'ǔ': ('u', 3), 'ù': ('u', 4),
    'ǖ': ('v', 1), 'ǘ': ('v', 2), 'ǚ': ('v', 3), 'ǜ': ('v', 4),
    'ń': ('n', 2), 'ň': ('n', 3), 'ǹ': ('n', 4),
    'ḿ': ('m', 2),
}

def extract_tone_from_pinyin_syllable(syl: str) -> Tuple[str, int]:
    """
    Extracts base pinyin without tone mark and tone number (1..5).
    5 or 0 is neutral tone.
    """
    syl = syl.strip().lower()
    tone = 5
    clean_chars = []
    for char in syl:
        if char in PINYIN_TONE_MARKS:
            clean, t = PINYIN_TONE_MARKS[char]
            clean_chars.append(clean)
            tone = t
        elif char.isdigit():
            tone = int(char)
        else:
            clean_chars.append(char)
    clean_syl = "".join(clean_chars)
    if tone == 0:
        tone = 5
    return clean_syl, tone

def parse_target_syllables(hanzi: str, expected_pinyin: str = "") -> List[Dict[str, Any]]:
    """
    Parses Hanzi characters and matching Pinyin into structured syllable definitions.
    """
    clean_hanzi = [c for c in hanzi.strip() if '\u4e00' <= c <= '\u9fff']
    if not clean_hanzi:
        clean_hanzi = list(hanzi.strip())
        
    pinyin_parts = expected_pinyin.strip().split() if expected_pinyin else []
    
    # If pinyin is not provided or mismatched length, generate authoritative from pypinyin
    if len(pinyin_parts) != len(clean_hanzi):
        generated = pinyin(clean_hanzi, style=Style.TONE)
        pinyin_parts = [g[0] for g in generated]
        
    syllables = []
    for i, char in enumerate(clean_hanzi):
        p_str = pinyin_parts[i] if i < len(pinyin_parts) else ""
        clean_syl, base_tone = extract_tone_from_pinyin_syllable(p_str)
        syllables.append({
            "index": i,
            "hanzi": char,
            "raw_pinyin": p_str,
            "clean_pinyin": clean_syl,
            "base_tone": base_tone,
            "target_tone": base_tone,
            "sandhi_applied": False,
            "sandhi_note": "Giữ nguyên thanh điệu chuẩn"
        })
        
    return apply_tone_sandhi(syllables)

def apply_tone_sandhi(syllables: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Applies deterministic Mandarin tone sandhi rules to a sequence of syllables.
    Rules:
    1. Third tone sandhi: 3 + 3 -> 2 + 3 (and 3 + 3 + 3)
    2. '不' (bù, base 4):
       - before tone 4 -> tone 2 (bú)
       - before tones 1, 2, 3 -> tone 4 (bù)
       - in question (shì bu shì) -> tone 5 (bu)
    3. '一' (yī, base 1):
       - single word, numbers, or ordinals -> stays tone 1
       - before tone 4 -> tone 2 (yí)
       - before tones 1, 2, 3 -> tone 4 (yì)
       - between reduplicated verbs -> tone 5 (yi)
    4. Half 3rd tone (bàn shàng 21): tone 3 before non-tone 3
    """
    n = len(syllables)
    if n <= 1:
        return syllables
        
    # Check for '不' sandhi
    for i in range(n):
        syl = syllables[i]
        if syl["hanzi"] == "不":
            # Check if in A-not-A question e.g., 好不好, 是不是
            if i > 0 and i < n - 1 and syllables[i-1]["hanzi"] == syllables[i+1]["hanzi"]:
                syl["target_tone"] = 5
                syl["sandhi_applied"] = True
                syl["sandhi_note"] = "Biến điệu chữ '不' trong câu hỏi chính phản thành thanh nhẹ (bu)"
            elif i < n - 1:
                next_tone = syllables[i+1]["base_tone"]
                if next_tone == 4:
                    syl["target_tone"] = 2
                    syl["sandhi_applied"] = True
                    syl["sandhi_note"] = f"Biến điệu chữ '不' trước thanh 4 ('{syllables[i+1]['hanzi']}') thành thanh 2 (bú)"
                else:
                    syl["target_tone"] = 4
                    syl["sandhi_note"] = "Chữ '不' trước thanh 1, 2, 3 giữ nguyên thanh 4 (bù)"

    # Check for '一' sandhi
    for i in range(n):
        syl = syllables[i]
        if syl["hanzi"] == "一":
            # Check if between repeated verbs e.g., 看一看, 想一想
            if i > 0 and i < n - 1 and syllables[i-1]["hanzi"] == syllables[i+1]["hanzi"]:
                syl["target_tone"] = 5
                syl["sandhi_applied"] = True
                syl["sandhi_note"] = "Biến điệu chữ '一' kẹp giữa động từ lặp lại thành thanh nhẹ (yi)"
            elif i < n - 1:
                # If preceded by '第' (ordinal) e.g. 第一, keep tone 1
                if i > 0 and syllables[i-1]["hanzi"] in ("第", "周", "十"):
                    syl["target_tone"] = 1
                    syl["sandhi_note"] = "Chữ '一' mang nghĩa số thứ tự giữ nguyên thanh 1 (yī)"
                else:
                    next_tone = syllables[i+1]["base_tone"]
                    if next_tone == 4:
                        syl["target_tone"] = 2
                        syl["sandhi_applied"] = True
                        syl["sandhi_note"] = f"Biến điệu chữ '一' trước thanh 4 ('{syllables[i+1]['hanzi']}') thành thanh 2 (yí)"
                    elif next_tone in (1, 2, 3):
                        syl["target_tone"] = 4
                        syl["sandhi_applied"] = True
                        syl["sandhi_note"] = f"Biến điệu chữ '一' trước thanh {next_tone} ('{syllables[i+1]['hanzi']}') thành thanh 4 (yì)"

    # Check for Third Tone Sandhi (3 + 3)
    # Right-to-left scan for consecutive tone 3s
    i = 0
    while i < n - 1:
        if syllables[i]["target_tone"] == 3 and syllables[i+1]["target_tone"] == 3:
            # Check 3 consecutive 3s e.g., 3 + 3 + 3
            if i + 2 < n and syllables[i+2]["target_tone"] == 3:
                # 3 + 3 + 3 -> 2 + 2 + 3
                syllables[i]["target_tone"] = 2
                syllables[i]["sandhi_applied"] = True
                syllables[i]["sandhi_note"] = "Biến điệu 3+3+3: Âm tiết đầu biến thành thanh 2"
                syllables[i+1]["target_tone"] = 2
                syllables[i+1]["sandhi_applied"] = True
                syllables[i+1]["sandhi_note"] = "Biến điệu 3+3+3: Âm tiết giữa biến thành thanh 2"
                i += 2
            else:
                # 3 + 3 -> 2 + 3
                syllables[i]["target_tone"] = 2
                syllables[i]["sandhi_applied"] = True
                syllables[i]["sandhi_note"] = f"Biến điệu hai thanh 3: '{syllables[i]['hanzi']}' biến thành thanh 2 trước '{syllables[i+1]['hanzi']}'"
                i += 1
        elif syllables[i]["target_tone"] == 3 and syllables[i+1]["target_tone"] != 3:
            # Half 3rd tone (bàn shàng)
            syllables[i]["sandhi_note"] = "Thanh 3 đứng trước âm tiết khác đọc trầm nửa thanh (bàn shàng 21)"
            i += 1
        else:
            i += 1

    return syllables
