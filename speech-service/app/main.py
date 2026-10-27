import hmac
import logging
import os
from typing import Optional
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.audio_gate import decode_audio_to_mono_16k, inspect_audio_quality
from app.core.tone_sandhi import parse_target_syllables
from app.core.pitch_tracker import extract_f0_contour, normalize_to_chao_scale, segment_and_interpolate_syllables
from app.core.evaluator import score_syllable, generate_assessment_report

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("speech_service")

app = FastAPI(
    title="Local Chinese Speech & Tone Assessment Service",
    description="100% Offline Mandarin Tone Assessment & Pitch Contour Engine with Tone Sandhi Rules (Acoustic F0 Analysis, non-ASR)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_expected_internal_token() -> str:
    token = os.getenv("INTERNAL_SPEECH_TOKEN")
    if token is None or not token.strip():
        token = os.getenv("SPEECH_SERVICE_TOKEN", "")
    return token.strip() if token else ""

def verify_internal_token(x_internal_token: Optional[str] = Header(None, alias="X-Internal-Token")):
    expected_token = get_expected_internal_token()
    if expected_token:
        if not x_internal_token or not hmac.compare_digest(x_internal_token.strip(), expected_token):
            raise HTTPException(
                status_code=401,
                detail="Unauthorized: Missing or invalid X-Internal-Token"
            )

@app.get("/health")
def health_check():
    return {
        "status": "READY",
        "engine": "local-acoustic-f0-tone",
        "offline": True,
        "model": "Chao-5-Scale Tone Sandhi Engine",
        "asr": False,
        "version": "1.0.0"
    }

@app.post("/evaluate-reading", dependencies=[Depends(verify_internal_token)])
@app.post("/v1/assess", dependencies=[Depends(verify_internal_token)])
async def evaluate_reading(
    audio: UploadFile = File(...),
    targetText: Optional[str] = Form(None),
    target_hanzi: Optional[str] = Form(None),
    expectedPinyin: Optional[str] = Form(None),
    target_pinyin: Optional[str] = Form(None),
    targetMeaning: Optional[str] = Form(None),
    target_meaning: Optional[str] = Form(None),
):
    text = (targetText or target_hanzi or "").strip()
    pinyin_str = (expectedPinyin or target_pinyin or "").strip()
    
    if not text:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "overallScore": None,
                "summaryVi": "Mục tiêu chữ Hán không được để trống.",
                "retryAdvice": "Vui lòng chọn từ vựng hợp lệ."
            }
        )

    try:
        audio_bytes = await audio.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded audio bytes: {e}")
        return JSONResponse(
            status_code=200,
            content={
                "status": "error",
                "targetText": text,
                "targetPinyin": pinyin_str,
                "overallScore": None,
                "summaryVi": "Không thể đọc dữ liệu âm thanh tải lên.",
                "retryAdvice": "Vui lòng thử ghi âm lại."
            }
        )

    if not audio_bytes or len(audio_bytes) < 100:
        return JSONResponse(
            status_code=200,
            content={
                "status": "not_scorable",
                "targetText": text,
                "targetPinyin": pinyin_str,
                "overallScore": None,
                "confidence": "LOW",
                "summaryVi": "Bản ghi âm quá ngắn hoặc không có dữ liệu âm thanh.",
                "retryAdvice": "Vui lòng bấm micro và đọc to rõ ràng.",
                "limitations": "Bản ghi âm dưới 100 bytes."
            }
        )

    # 1. Decode audio
    try:
        pcm, sr = decode_audio_to_mono_16k(audio_bytes)
    except Exception as e:
        logger.warning(f"Audio decode failed for '{text}': {e}")
        return JSONResponse(
            status_code=200,
            content={
                "status": "not_scorable",
                "targetText": text,
                "targetPinyin": pinyin_str,
                "overallScore": None,
                "confidence": "LOW",
                "summaryVi": "Định dạng âm thanh không hợp lệ hoặc bị lỗi mã hóa.",
                "retryAdvice": "Vui lòng sử dụng trình duyệt hỗ trợ ghi âm WebM/WAV tiêu chuẩn.",
                "limitations": f"Lỗi giải mã: {str(e)}"
            }
        )

    # 2. Quality screening
    quality = inspect_audio_quality(pcm, sr)
    if not quality["scorable"]:
        return JSONResponse(
            status_code=200,
            content={
                "status": "not_scorable",
                "targetText": text,
                "targetPinyin": pinyin_str,
                "overallScore": None,
                "confidence": "LOW",
                "summaryVi": quality.get("reason", "Bản ghi âm không đủ điều kiện chấm."),
                "retryAdvice": quality.get("retry_advice", "Vui lòng đọc to rõ ràng và thử lại."),
                "limitations": "Bộ lọc chất lượng âm thanh từ chối do không đủ tiêu chuẩn âm học."
            }
        )

    # 3. Tone Sandhi resolution
    syllables = parse_target_syllables(text, pinyin_str)
    num_syllables = max(1, len(syllables))

    # 4. F0 pitch extraction and Chao normalization
    times, f0, voiced = extract_f0_contour(pcm, sr)
    if int(np.sum(voiced)) < 8:
        return JSONResponse(
            status_code=200,
            content={
                "status": "not_scorable",
                "targetText": text,
                "targetPinyin": pinyin_str,
                "overallScore": None,
                "confidence": "LOW",
                "summaryVi": "Không phát hiện thấy tiếng nói của bạn (chỉ ghi nhận khoảng lặng hoặc tạp âm môi trường).",
                "retryAdvice": "Vui lòng giữ micro và đọc to, rõ ràng từ mục tiêu.",
                "limitations": "Số khung hữu thanh dưới ngưỡng tối thiểu (80ms) để đánh giá phát âm."
            }
        )

    chao = normalize_to_chao_scale(f0, voiced)
    syllable_contours = segment_and_interpolate_syllables(chao, voiced, num_syllables)

    # 5. Syllable scoring
    evaluated_syllables = []
    for i, syl in enumerate(syllables):
        contour = syllable_contours[i] if i < len(syllable_contours) else syllable_contours[0]
        is_half_third = (syl.get("sandhi_note", "").find("bàn shàng") != -1)
        prev_tone = syllables[i - 1]["target_tone"] if i > 0 else None
        res = score_syllable(contour, syl["target_tone"], is_half_third, prev_tone=prev_tone)
        
        syl_data = {
            **syl,
            "detected_tone": res["detected_tone"],
            "tone_correct": res["tone_correct"],
            "score": res["score"],
            "feedback": res["feedback"],
            "contour": res["contour"]
        }
        evaluated_syllables.append(syl_data)

    # 6. Assemble assessment report
    report = generate_assessment_report(text, pinyin_str, evaluated_syllables, quality)
    return JSONResponse(status_code=200, content=report)
