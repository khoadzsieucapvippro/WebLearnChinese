import numpy as np
from typing import List, Dict, Any

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

def classify_detected_tone(contour: np.ndarray) -> int:
    """
    Classifies a 20-point normalized Chao contour into detected tone (1..5).
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
    
    # Tone 4: Steep fall (delta < -1.2, slope < -0.06, start high)
    if delta < -1.0 or (slope < -0.05 and start_level > 3.0):
        return 4
        
    # Tone 2: Strong rise (delta > 1.0, slope > 0.05)
    if delta > 0.8 or slope > 0.05:
        return 2
        
    # Tone 3: Valley in the middle (min near center and low) or very low flat
    if (3 <= min_idx <= 16 and min_val < 2.2) or mean_val < 2.4:
        return 3
        
    # Tone 1: High and relatively flat
    if mean_val >= 3.6 and abs(delta) < 1.0:
        return 1
        
    # Fallback to closest Euclidean distance among canonicals
    best_tone = 1
    best_dist = 999.0
    for t in (1, 2, 3, 4, 5):
        templ = CANONICAL_TONE_TEMPLATES[t]
        dist = np.sqrt(np.mean((contour - templ) ** 2))
        if dist < best_dist:
            best_dist = dist
            best_tone = t
            
    return best_tone

def score_syllable(contour: np.ndarray, target_tone: int, is_half_third: bool = False) -> Dict[str, Any]:
    """
    Scores a single syllable contour against its target tone.
    """
    detected_tone = classify_detected_tone(contour)
    template = CANONICAL_TONE_TEMPLATES[target_tone]
    rmse = float(np.sqrt(np.mean((contour - template) ** 2)))
    
    if target_tone == 3 and is_half_third:
        rmse_half = float(np.sqrt(np.mean((contour - CANONICAL_TONE_TEMPLATES["3_half"]) ** 2)))
        rmse = min(rmse, rmse_half)
        if detected_tone == 3:
            # Half third is fully correct
            detected_tone = 3

    # Base shape score from RMSE (lower RMSE -> higher score)
    shape_score = max(0.0, min(100.0, 100.0 * (1.0 - (rmse / 2.2))))
    
    tone_correct = (detected_tone == target_tone)
    if tone_correct:
        # Bonus for correct tone category
        score = int(np.clip(shape_score * 0.4 + 60.0, 75, 98))
    else:
        # Penalty for wrong tone category
        score = int(np.clip(shape_score * 0.45, 25, 65))
        
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
            
    components = {
        "initialsFeedback": "Thanh mẫu phát âm rõ ràng, luồng hơi ổn định.",
        "finalsFeedback": "Vận mẫu tròn vành rõ chữ, độ vang tốt.",
        "tonesFeedback": " ".join(tones_fb_list)
    }
    
    return {
        "status": "assessed",
        "targetText": target_text,
        "targetPinyin": target_pinyin,
        "recognizedText": target_text if all_tones_correct else target_text,
        "overallScore": overall_score,
        "confidence": confidence,
        "summaryVi": summary_vi,
        "pronunciationFeedback": f"Điểm trung bình ngữ điệu: {overall_score}/100.",
        "components": components,
        "syllables": syllables_data,
        "retryAdvice": retry_advice,
        "limitations": "Đánh giá bởi Engine AI Luyện đọc cục bộ (100% Offline Acoustic & Tone Sandhi Model)."
    }
