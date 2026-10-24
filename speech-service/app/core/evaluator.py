import numpy as np
from typing import List, Dict, Any, Optional

# Canonical Chao templates on 20-point grid (1.0 .. 5.0)
CANONICAL_TONE_TEMPLATES = {
    1: np.full(20, 4.6, dtype=np.float32), # 55 high flat
    2: np.linspace(2.5, 4.7, 20, dtype=np.float32), # 35 rising
    3: np.array([2.5, 2.2, 1.9, 1.6, 1.4, 1.3, 1.3, 1.4, 1.5, 1.7, 
                 2.0, 2.3, 2.6, 2.9, 3.2, 3.4, 3.5, 3.6, 3.6, 3.5], dtype=np.float32), # 214 dip-rise
    "3_half": np.linspace(2.2, 1.4, 20, dtype=np.float32), # 21 half 3rd tone
    4: np.linspace(4.8, 1.5, 20, dtype=np.float32), # 51 falling
    5: np.full(20, 2.5, dtype=np.float32) # neutral
}

def classify_detected_tone(contour: np.ndarray, target_tone: Optional[int] = None) -> int:
    """
    Classifies a 20-point normalized Chao contour into detected tone (1..5).
    Evaluates contour shape, slope, valley minima, and register boundaries.
    """
    mean_val = float(np.mean(contour))
    # Linear slope
    x = np.arange(len(contour))
    slope, _ = np.polyfit(x, contour, 1)
    # Total change from first quarter to last quarter
    start_level = float(np.mean(contour[:5]))
    end_level = float(np.mean(contour[-5:]))
    delta = end_level - start_level
    min_val = float(np.min(contour))
    min_idx = int(np.argmin(contour))
    std_val = float(np.std(contour))
    
    # 1. Tone 4: Steep fall (51) - starts high and must plunge into the lower register
    if (delta < -1.8 and end_level <= 2.8) or (delta < -1.2 and slope < -0.05 and start_level >= 3.2 and end_level <= 2.5):
        return 4
        
    # 2. Tone 3: Valley in the middle (dipping contour 214)
    # Must be evaluated before Tone 2 so that rising tail of 214 dip-rise does not hijack into Tone 2
    if (2 <= min_idx <= 16 and min_val < 2.6 and (contour[0] - min_val >= 0.35) and (contour[-1] - min_val >= 0.35)):
        return 3

    # 3. Tone 2: Strong monotonic rise (35)
    if delta > 0.8 and slope > 0.03:
        return 2
        
    # 4. Tone 1: High and relatively level (55)
    if (mean_val >= 3.5 and abs(delta) < 1.4 and end_level >= 3.0) or (std_val < 0.35 and abs(delta) < 0.7 and mean_val >= 3.0):
        return 1

    # 5. Tone 5: Neutral tone when target is 5 and contour is relatively flat/unstressed
    if target_tone == 5 and abs(delta) < 1.0 and std_val < 0.6:
        return 5

    # 6. Tone 3: Low pitch register (half-third 21) when target is 3
    if target_tone == 3 and mean_val < 2.6 and abs(delta) < 0.9:
        return 3
        
    # 7. Fallback to closest Euclidean distance among canonicals
    best_tone = 1
    best_dist = 999.0
    for t in (1, 2, 3, 4, 5):
        templ = CANONICAL_TONE_TEMPLATES[t]
        dist = np.sqrt(np.mean((contour - templ) ** 2))
        if dist < best_dist:
            best_dist = dist
            best_tone = t
            
    return best_tone

def score_syllable(contour: np.ndarray, target_tone: int, is_half_third: bool = False, prev_tone: Optional[int] = None) -> Dict[str, Any]:
    """
    Scores a single syllable contour against its target tone with calibrated scoring.
    """
    detected_tone = classify_detected_tone(contour, target_tone=target_tone)
    
    if target_tone == 5:
        # Context-dependent neutral tone pitch level:
        # After Tone 1: mid (~2.6)
        # After Tone 2: mid (~3.0)
        # After Tone 3: mid-high (~3.6)
        # After Tone 4: low (~1.8)
        neutral_levels = {1: 2.6, 2: 3.0, 3: 3.6, 4: 1.8}
        target_level = neutral_levels.get(prev_tone, 2.5)
        template = np.full(len(contour), target_level, dtype=np.float32)
        rmse = float(np.sqrt(np.mean((contour - template) ** 2)))
    elif target_tone == 3 and is_half_third:
        template = CANONICAL_TONE_TEMPLATES[target_tone]
        rmse_full = float(np.sqrt(np.mean((contour - template) ** 2)))
        rmse_half = float(np.sqrt(np.mean((contour - CANONICAL_TONE_TEMPLATES["3_half"]) ** 2)))
        rmse = min(rmse_full, rmse_half)
    else:
        template = CANONICAL_TONE_TEMPLATES[target_tone]
        rmse = float(np.sqrt(np.mean((contour - template) ** 2)))

    # Base shape score from RMSE (lower RMSE -> higher score)
    shape_score = max(0.0, min(100.0, 100.0 * (1.0 - (rmse / 2.2))))
    
    tone_correct = (detected_tone == target_tone)
    if tone_correct:
        # Calibrated score: smoothly reflects actual shape accuracy rather than flat 75 floor
        score = int(round(np.clip(45.0 + shape_score * 0.52, 45, 98)))
    else:
        # Penalty for wrong tone category (capped at 55)
        score = int(round(np.clip(shape_score * 0.45, 15, 55)))
        
    tone_names = {1: "Thanh 1 (Âm bình)", 2: "Thanh 2 (Dương bình)", 3: "Thanh 3 (Thượng thanh)", 4: "Thanh 4 (Khứ thanh)", 5: "Thanh nhẹ"}
    
    if tone_correct:
        feedback = f"Thanh điệu chính xác: Nhận diện chuẩn {tone_names.get(target_tone)}."
    else:
        feedback = f"Cần điều chỉnh: Mục tiêu là {tone_names.get(target_tone)}, nhưng bạn đang đọc giống {tone_names.get(detected_tone)}."
        
    return {
        "detected_tone": detected_tone,
        "target_tone": target_tone,
        "tone_correct": tone_correct,
        "score": score,
        "feedback": feedback,
        "contour": [round(float(v), 2) for v in contour]
    }

def generate_assessment_report(target_text: str, target_pinyin: str, syllables_data: List[Dict[str, Any]], audio_meta: Dict[str, Any]) -> Dict[str, Any]:
    """
    Assembles complete pronunciation evaluation DTO conforming to PronunciationAssessmentResponse.
    Truthful reporting: does not pretend ASR recognized text or fake initials/finals feedback.
    """
    scores = [s["score"] for s in syllables_data]
    overall_score = int(round(np.mean(scores))) if scores else 0
    all_tones_correct = all(s["tone_correct"] for s in syllables_data)
    
    # Confidence determination
    duration = audio_meta.get("duration", 1.0)
    snr = audio_meta.get("snr_db", 15.0)
    if duration >= 0.5 and snr >= 12.0:
        confidence = "HIGH"
    elif duration >= 0.35 and snr >= 8.0:
        confidence = "MEDIUM"
    else:
        confidence = "LOW"
        
    # Generate structured feedback
    correct_count = sum(1 for s in syllables_data if s["tone_correct"])
    total_count = len(syllables_data)
    
    if all_tones_correct:
        if overall_score >= 85:
            summary_vi = f"Xuất sắc! Bạn phát âm từ '{target_text}' ({target_pinyin}) rất chuẩn xác và tự nhiên."
            retry_advice = "Duy trì cao độ và ngữ điệu này ở các bài học tiếp theo."
        else:
            summary_vi = f"Tốt! Thanh điệu từ '{target_text}' đúng hướng, độ mượt mà cao độ có thể cải thiện thêm."
            retry_advice = "Hãy chú ý kéo dài hơi hơn để âm sắc vang và chuẩn hơn."
    else:
        summary_vi = f"Đạt {correct_count}/{total_count} âm tiết chuẩn thanh điệu. Cần chú ý điều chỉnh thanh điệu các âm tiết chưa đúng."
        retry_advice = "Nghe lại phát âm mẫu và tập trung vào hướng cao độ của từng âm tiết."
        
    tones_fb_list = []
    for s in syllables_data:
        hanzi = s["hanzi"]
        t_target = s["target_tone"]
        t_det = s["detected_tone"]
        if s["tone_correct"]:
            if s.get("sandhi_applied"):
                tones_fb_list.append(f"Chữ '{hanzi}': Biến điệu chuẩn sang thanh {t_target}.")
            else:
                tones_fb_list.append(f"Chữ '{hanzi}': Thanh {t_target} phát âm tốt.")
        else:
            tones_fb_list.append(f"Chữ '{hanzi}': Đọc thanh {t_det} chưa khớp với thanh {t_target} mục tiêu.")
            
    # Truthful feedback: only include measured tone feedback; do not fake initials/finals
    components = {
        "tonesFeedback": " ".join(tones_fb_list)
    }
    
    return {
        "status": "assessed",
        "targetText": target_text,
        "targetPinyin": target_pinyin,
        "recognizedText": None, # Non-ASR engine: only acoustic F0 tone contour is evaluated
        "overallScore": overall_score,
        "confidence": confidence,
        "summaryVi": summary_vi,
        "pronunciationFeedback": f"Điểm trung bình ngữ điệu: {overall_score}/100.",
        "components": components,
        "syllables": syllables_data,
        "retryAdvice": retry_advice,
        "limitations": "Đánh giá bởi Hệ thống Phân tích Phát âm & Thanh điệu (Chao 5-scale Tone Sandhi Engine - Phân tích đường cao độ F0, không nhận diện chữ ASR)."
    }
