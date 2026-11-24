import base64
import io
import json
import logging
import math
import os
import re
import urllib.error
import urllib.request
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pypinyin
from pypinyin import Style
import soundfile as sf

logger = logging.getLogger("speech_service.azure")

# Mandarin Pinyin Initials (21 standard initials + y, w orthographic initials)
_DIGRAPH_INITIALS = ("zh", "ch", "sh")
_MONOGRAPH_INITIALS = (
    "b", "p", "m", "f",
    "d", "t", "n", "l",
    "g", "k", "h",
    "j", "q", "x",
    "r", "z", "c", "s",
    "y", "w"
)

# High-similarity initial pairs (very common beginner L2 confusions: aspiration, retroflex/alveolar/palatal)
_HIGH_SIM_INITIAL_GROUPS = [
    {"b", "p"},
    {"d", "t"},
    {"g", "k", "h"},
    {"j", "q", "x"},
    {"z", "zh", "j"},
    {"c", "ch", "q"},
    {"s", "sh", "x"},
    {"z", "c", "s"},
    {"zh", "ch", "sh", "r"},
    {"d", "n", "l", "r"},
    {"m", "n", "b", "f"},
    {"f", "h", "w"},
    {"y", "j", "q", "x"},
]

# Medium-similarity initial groups (broad manner/place of articulation families)
_MED_SIM_INITIAL_GROUPS = [
    {"b", "p", "d", "t", "g", "k"},  # Plosives
    {"f", "h", "s", "sh", "x", "r", "z", "zh", "c", "ch", "j", "q"},  # Fricatives & Affricates
    {"m", "n", "l", "r", "y", "w", ""},  # Sonorants, glides & zero-initial
]

# High-similarity final groups (front/back nasal pairs & close vowel rounding)
_HIGH_SIM_FINAL_GROUPS = [
    {"an", "ang", "ian", "iang", "uan", "uang", "van"},
    {"en", "eng", "in", "ing", "uen", "un", "vn", "ong", "iong"},
    {"a", "ia", "ua"},
    {"o", "uo", "e", "er", "ao", "ou"},
    {"e", "ie", "ue", "ve", "ei", "uei", "ui"},
    {"i", "v", "ü", "yi", "yu", "ei", "ui", "uei"},
    {"u", "wu", "ou", "iou", "iu"},
    {"ai", "ei", "uai", "uei", "ui"},
    {"ao", "iao", "ou", "iou", "iu"},
]

# Common Whisper noise/gibberish hallucination phrases when fed non-Chinese audio
_WHISPER_HALLUCINATION_PHRASES = (
    "字幕",
    "谢谢观看",
    "感谢观看",
    "请订阅",
    "点赞",
    "索兰娅",
    "明镜",
    "优优独播",
    "amara.org",
    "subtitles",
)


def _read_dotenv_fallback() -> Dict[str, str]:
    """
    Lightweight, zero-dependency .env reader for local convenience.
    Checks speech-service/.env and repository root .env if environment variables are not set.
    """
    env_map: Dict[str, str] = {}
    try:
        current_dir = Path(__file__).resolve().parent
        speech_service_dir = current_dir.parent.parent
        repo_root_dir = speech_service_dir.parent
        candidates = [speech_service_dir / ".env", repo_root_dir / ".env"]

        for dotenv_path in candidates:
            if dotenv_path.is_file():
                for raw_line in dotenv_path.read_text(encoding="utf-8", errors="ignore").splitlines():
                    line = raw_line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key and key not in env_map:
                        env_map[key] = val
    except Exception as exc:
        logger.debug(f"Could not read .env fallback: {exc}")
    return env_map


def get_azure_config() -> Tuple[str, str, bool]:
    """
    Resolves (api_key, region_or_provider, is_enabled) from environment variables or .env file.
    Supports both:
    - Microsoft Azure Speech Key (AZURE_SPEECH_KEY + AZURE_SPEECH_REGION)
    - Groq Cloud Whisper Large-v3 Key (GROQ_API_KEY or gsk_... key in AZURE_SPEECH_KEY)
    """
    enabled_raw = os.getenv("AZURE_SPEECH_ENABLED")
    if enabled_raw is not None and enabled_raw.strip().lower() in ("false", "0", "no", "off"):
        return "", "", False

    api_key = (os.getenv("AZURE_SPEECH_KEY") or "").strip()
    region = (os.getenv("AZURE_SPEECH_REGION") or "").strip()
    groq_key = (os.getenv("GROQ_API_KEY") or "").strip()

    dotenv_vals = _read_dotenv_fallback()
    if enabled_raw is None:
        dotenv_enabled = dotenv_vals.get("AZURE_SPEECH_ENABLED", "true").strip().lower()
        if dotenv_enabled in ("false", "0", "no", "off"):
            return "", "", False

    if not api_key:
        api_key = dotenv_vals.get("AZURE_SPEECH_KEY", "").strip()
    if not region:
        region = dotenv_vals.get("AZURE_SPEECH_REGION", "southeastasia").strip()
    if not groq_key:
        groq_key = dotenv_vals.get("GROQ_API_KEY", "").strip()

    placeholders = {
        "your_azure_speech_key_here",
        "your_groq_api_key_here",
        "your-key-here",
        "changeme",
        "none",
        "null",
        ""
    }

    if api_key.lower() in placeholders:
        api_key = ""
    if groq_key.lower() in placeholders:
        groq_key = ""

    if api_key.startswith("gsk_"):
        return api_key, "groq-cloud", True
    if not api_key and groq_key:
        return groq_key, "groq-cloud", True

    if api_key and region and region.lower() not in placeholders:
        return api_key, region, True

    return "", "", False


def is_azure_configured() -> bool:
    """Returns True if Cloud Speech AI (Azure or Groq) is configured and enabled."""
    _, _, configured = get_azure_config()
    return configured


def split_pinyin_initial_final(clean_pinyin: str) -> Tuple[str, str]:
    """
    Splits a base Pinyin syllable (without tone marks/digits, e.g. 'qing', 'zhuang', 'ai')
    into (initial, final). Returns ('', clean_pinyin) for zero-initial syllables.
    """
    s = (clean_pinyin or "").strip().lower()
    if not s:
        return "", ""

    for dg in _DIGRAPH_INITIALS:
        if s.startswith(dg):
            return dg, s[len(dg):]

    for mg in _MONOGRAPH_INITIALS:
        if s.startswith(mg):
            return mg, s[len(mg):]

    return "", s


def _normalize_final(initial: str, final: str) -> str:
    """
    Normalizes Pinyin orthographic abbreviations to canonical phonological finals
    so e.g. 'ui' == 'uei', 'iu' == 'iou', 'un' == 'uen', and 'j/q/x/y + u' == 'v'.
    """
    f = (final or "").strip().lower().replace("ü", "v")
    ini = (initial or "").strip().lower()

    if ini == "y":
        if f == "i":
            return "i"
        if f in ("u", "v"):
            return "v"
        if f in ("e", "ue", "ve"):
            return "ie" if f == "e" else "ve"
        if f == "an":
            return "ian"
        if f == "in":
            return "in"
        if f == "ing":
            return "ing"
        if f == "ao":
            return "iao"
        if f == "ou":
            return "iou"
        if f == "ong":
            return "iong"
        if f and not f.startswith("i") and not f.startswith("v"):
            return "i" + f

    if ini == "w":
        if f == "u":
            return "u"
        if f == "o":
            return "uo"
        if f == "ai":
            return "uai"
        if f == "ei":
            return "uei"
        if f == "an":
            return "uan"
        if f == "en":
            return "uen"
        if f == "ang":
            return "uang"
        if f == "eng":
            return "ueng"

    if ini in ("j", "q", "x") and f.startswith("u"):
        f = "v" + f[1:]

    if f == "ui":
        f = "uei"
    elif f == "iu":
        f = "iou"
    elif f == "un":
        f = "uen"
    elif ini in ("b", "p", "m", "f") and f == "o":
        f = "uo"

    return f


def score_initial_similarity(t_ini: str, r_ini: str, acoustic_conf: float = 0.88) -> float:
    """
    Computes smooth articulatory similarity score (0..100) between target initial and recognized initial.
    """
    t = (t_ini or "").strip().lower()
    r = (r_ini or "").strip().lower()

    if t == r:
        return float(np.clip(84.0 + 14.0 * acoustic_conf, 84.0, 98.0))

    # Orthographic glide equivalence (e.g. zero-initial vs y/w)
    if {t, r} <= {"", "y", "w", "h", "r"}:
        return float(np.clip(74.0 + 12.0 * acoustic_conf, 74.0, 86.0))

    for grp in _HIGH_SIM_INITIAL_GROUPS:
        if t in grp and r in grp:
            return float(np.clip(72.0 + 12.0 * acoustic_conf, 72.0, 84.0))

    for grp in _MED_SIM_INITIAL_GROUPS:
        if t in grp and r in grp:
            return float(np.clip(54.0 + 10.0 * acoustic_conf, 52.0, 65.0))

    return float(np.clip(12.0 + 8.0 * acoustic_conf, 10.0, 22.0))


def score_final_similarity(
    t_ini: str,
    t_fin: str,
    r_ini: str,
    r_fin: str,
    acoustic_conf: float = 0.88
) -> float:
    """
    Computes smooth articulatory similarity score (0..100) between target final and recognized final.
    """
    tf = _normalize_final(t_ini, t_fin)
    rf = _normalize_final(r_ini, r_fin)

    if not tf or not rf:
        return 10.0

    if tf == rf or t_fin == r_fin:
        return float(np.clip(84.0 + 14.0 * acoustic_conf, 84.0, 98.0))

    # Check high-similarity final groups (nasal pairs an/ang, en/eng, in/ing, etc.)
    for grp in _HIGH_SIM_FINAL_GROUPS:
        if (tf in grp or t_fin in grp) and (rf in grp or r_fin in grp):
            return float(np.clip(74.0 + 12.0 * acoustic_conf, 74.0, 85.0))

    # Check shared main nuclear vowel ('a', 'e', 'i', 'o', 'u', 'v')
    main_vowels = ("a", "o", "e", "i", "u", "v")
    shared_main = any(v in tf and v in rf for v in main_vowels)

    # Check shared nasal coda (-n / -ng)
    both_nasal = (tf.endswith("n") or tf.endswith("ng")) and (rf.endswith("n") or rf.endswith("ng"))

    if shared_main and both_nasal:
        return float(np.clip(70.0 + 10.0 * acoustic_conf, 68.0, 80.0))
    if shared_main:
        return float(np.clip(62.0 + 10.0 * acoustic_conf, 60.0, 74.0))
    if both_nasal:
        return float(np.clip(48.0 + 10.0 * acoustic_conf, 45.0, 58.0))

    return float(np.clip(10.0 + 8.0 * acoustic_conf, 8.0, 20.0))


def pcm_to_wav_16k_bytes(pcm: np.ndarray, sr: int = 16000, pad_silence_sec: float = 0.22) -> bytes:
    """
    Converts a 16kHz mono float32 numpy array into standard 16-bit PCM WAV bytes in memory.
    Adds 220ms of leading/trailing silence padding so short 1-syllable recordings never get
    their initial consonant clipped by Whisper's Mel-spectrogram window.
    Strictly adheres to Zero-Storage policy (100% RAM buffer).
    """
    buf = io.BytesIO()
    clipped = np.clip(pcm, -1.0, 1.0)
    if pad_silence_sec > 0 and sr > 0:
        pad_samples = int(pad_silence_sec * sr)
        pad = np.zeros(pad_samples, dtype=np.float32)
        clipped = np.concatenate([pad, clipped, pad])
    sf.write(buf, clipped, sr, format="WAV", subtype="PCM_16")
    return buf.getvalue()


def build_pronunciation_assessment_header(reference_text: str) -> str:
    """
    Builds the Base64-encoded JSON header required by Azure Pronunciation Assessment REST API.
    """
    config = {
        "ReferenceText": reference_text,
        "GradingSystem": "HundredMark",
        "Granularity": "Phoneme",
        "Dimension": "Comprehensive",
        "EnableMiscue": "True"
    }
    raw_json = json.dumps(config, ensure_ascii=False).encode("utf-8")
    return base64.b64encode(raw_json).decode("ascii")


def call_azure_pronunciation_api(
    wav_bytes: bytes,
    target_text: str,
    api_key: str,
    region: str,
    timeout_sec: float = 4.5
) -> Optional[Dict[str, Any]]:
    """
    Calls Microsoft Azure Cognitive Services Speech Pronunciation Assessment REST API (zh-CN).
    Returns parsed JSON dictionary on HTTP 200, or None on network/auth/quota failure to trigger fallback.
    """
    url = (
        f"https://{region}.stt.speech.microsoft.com/speech/recognition/"
        f"conversation/cognitiveservices/v1?language=zh-CN&format=detailed"
    )
    pron_header = build_pronunciation_assessment_header(target_text)

    headers = {
        "Ocp-Apim-Subscription-Key": api_key,
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
        "Accept": "application/json;text/xml",
        "Pronunciation-Assessment": pron_header,
        "User-Agent": "WebLearnChinese-SpeechEngine/1.0"
    }

    req = urllib.request.Request(url, data=wav_bytes, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as response:
            status_code = response.getcode()
            raw_body = response.read().decode("utf-8", errors="replace")
            if status_code == 200 and raw_body:
                return json.loads(raw_body)
            logger.warning(f"Azure Speech API returned non-200 status {status_code}: {raw_body[:200]}")
            return None
    except urllib.error.HTTPError as http_err:
        err_body = ""
        try:
            err_body = http_err.read().decode("utf-8", errors="replace")[:200]
        except Exception:
            pass
        logger.warning(f"Azure Speech API HTTPError {http_err.code} ({http_err.reason}): {err_body}")
        return None
    except Exception as exc:
        logger.warning(f"Azure Speech API call failed or timed out ({exc}); falling back to local DSP engine.")
        return None


def _build_gibberish_nbest_payload(
    evaluated_syllables: List[Dict[str, Any]],
    recognized_display: str = "(Không nhận diện được từ hợp lệ)"
) -> Dict[str, Any]:
    """
    Builds a strict low-score NBest response when the speaker utters gibberish, non-Chinese speech,
    or completely unrecognizable sounds so it is never rewarded with artificial points.
    """
    words_out: List[Dict[str, Any]] = []
    for syl in evaluated_syllables:
        t_hanzi = syl.get("hanzi", "")
        t_clean = syl.get("clean_pinyin", "")
        t_ini, t_fin = split_pinyin_initial_final(t_clean)
        phonemes_list = []
        if t_ini:
            phonemes_list.append({"Phoneme": t_ini, "AccuracyScore": 8.0})
        phonemes_list.append({"Phoneme": t_fin or t_clean, "AccuracyScore": 8.0})
        words_out.append({
            "Word": t_hanzi,
            "AccuracyScore": 8.0,
            "ErrorType": "Mispronunciation",
            "Phonemes": phonemes_list
        })

    return {
        "RecognitionStatus": "Success",
        "Provider": "groq-whisper-large-v3",
        "NBest": [
            {
                "Confidence": 0.25,
                "Display": recognized_display,
                "AccuracyScore": 8.0,
                "FluencyScore": 10.0,
                "CompletenessScore": 0.0,
                "PronScore": 8.0,
                "Words": words_out
            }
        ]
    }


def call_groq_whisper_pronunciation_api(
    wav_bytes: bytes,
    target_text: str,
    evaluated_syllables: List[Dict[str, Any]],
    api_key: str,
    timeout_sec: float = 4.5
) -> Optional[Dict[str, Any]]:
    """
    Calls Groq Cloud Whisper Large-v3 Turbo API and performs Mandarin Articulatory Phoneme Alignment
    (Initials & Finals GOP estimation), returning an Azure-compatible NBest assessment structure.
    """
    url = "https://api.groq.com/openai/v1/audio/transcriptions"
    boundary = f"----WebLearnBoundary{uuid.uuid4().hex}"

    parts: List[bytes] = []

    def _add_field(name: str, value: str):
        parts.append(f"--{boundary}\r\n".encode("utf-8"))
        parts.append(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"))
        parts.append(f"{value}\r\n".encode("utf-8"))

    # Add audio file part
    parts.append(f"--{boundary}\r\n".encode("utf-8"))
    parts.append(
        b'Content-Disposition: form-data; name="file"; filename="reading.wav"\r\n'
        b"Content-Type: audio/wav\r\n\r\n"
    )
    parts.append(wav_bytes)
    parts.append(b"\r\n")

    _add_field("model", "whisper-large-v3-turbo")
    _add_field("language", "zh")
    _add_field("prompt", "简体中文普通话词汇朗读：")
    _add_field("response_format", "verbose_json")
    _add_field("temperature", "0")

    parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    body_bytes = b"".join(parts)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Accept": "application/json",
        "User-Agent": "WebLearnChinese-SpeechEngine/1.0"
    }

    req = urllib.request.Request(url, data=body_bytes, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as response:
            status_code = response.getcode()
            raw_body = response.read().decode("utf-8", errors="replace")
            if status_code != 200 or not raw_body:
                return None
            groq_json = json.loads(raw_body)
    except Exception as exc:
        logger.warning(f"Groq Whisper API call failed ({exc}); falling back to local DSP engine.")
        return None

    raw_text = str(groq_json.get("text") or "").strip()
    # Strip prompt prefix if echoed by Whisper
    for prefix in ("简体中文普通话词汇朗读：", "简体中文普通话词汇朗读:", "普通话词汇朗读："):
        if raw_text.startswith(prefix):
            raw_text = raw_text[len(prefix):].strip()

    clean_rec = "".join(c for c in raw_text if "\u4e00" <= c <= "\u9fff" or "\u3400" <= c <= "\u4dbf")

    segments = groq_json.get("segments") or []
    if segments:
        avg_logprob = float(np.mean([float(s.get("avg_logprob", -0.30)) for s in segments]))
        no_speech = float(np.mean([float(s.get("no_speech_prob", 0.08)) for s in segments]))
        # Smooth acoustic confidence so slight beginner hesitation isn't over-penalized
        acoustic_conf = float(np.clip(math.exp(max(avg_logprob, -0.80)) * (1.0 - 0.35 * no_speech), 0.45, 0.98))
    else:
        avg_logprob = -0.30
        no_speech = 0.08
        acoustic_conf = 0.85

    # 1. Reject gibberish / non-Chinese speech / Whisper background hallucinations
    if not clean_rec or no_speech > 0.72 or avg_logprob < -1.35:
        display_str = raw_text.strip(" 。，！？、.!?,;；：:") or "(Không nhận diện được tiếng Trung)"
        return _build_gibberish_nbest_payload(evaluated_syllables, display_str)

    if any(h in raw_text.lower() for h in _WHISPER_HALLUCINATION_PHRASES) and target_text not in clean_rec:
        return _build_gibberish_nbest_payload(evaluated_syllables, "(Âm thanh không rõ chữ)")

    if len(clean_rec) > max(5, len(evaluated_syllables) * 3) and target_text not in clean_rec:
        return _build_gibberish_nbest_payload(evaluated_syllables, clean_rec[:12] + "...")

    rec_chars = list(clean_rec)
    rec_pinyins_raw = pypinyin.pinyin(rec_chars, style=Style.TONE3) if rec_chars else []
    rec_clean_pinyins = [
        re.sub(r"[0-5]", "", p[0].lower()) if p and p[0] else ""
        for p in rec_pinyins_raw
    ]

    words_out: List[Dict[str, Any]] = []
    word_scores: List[float] = []
    matched_count = 0

    for idx, syl in enumerate(evaluated_syllables):
        t_hanzi = syl.get("hanzi", "")
        t_clean = syl.get("clean_pinyin", "")
        t_ini, t_fin = split_pinyin_initial_final(t_clean)

        # Find best matching syllable in the recognized candidates (within window)
        best_init_s = 10.0
        best_fin_s = 10.0
        best_w_acc = 10.0

        search_indices = list(range(max(0, idx - 1), min(len(rec_clean_pinyins), idx + 2)))
        if not search_indices and rec_clean_pinyins:
            search_indices = [len(rec_clean_pinyins) - 1]

        for r_idx in search_indices:
            cand_clean = rec_clean_pinyins[r_idx]
            r_ini, r_fin = split_pinyin_initial_final(cand_clean)
            cand_init_s = score_initial_similarity(t_ini, r_ini, acoustic_conf) if t_ini else score_final_similarity(t_ini, t_fin, r_ini, r_fin, acoustic_conf)
            cand_fin_s = score_final_similarity(t_ini, t_fin, r_ini, r_fin, acoustic_conf)
            cand_w_acc = (0.45 * cand_init_s + 0.55 * cand_fin_s) if t_ini else cand_fin_s

            if cand_w_acc > best_w_acc:
                best_w_acc = cand_w_acc
                best_init_s = cand_init_s
                best_fin_s = cand_fin_s

        # If neither initial nor final has any phonetic similarity (both < 40 -> completely unrelated sound)
        if best_init_s < 40.0 and best_fin_s < 40.0:
            best_init_s = 10.0
            best_fin_s = 10.0
            best_w_acc = 10.0

        if best_w_acc >= 55.0:
            matched_count += 1
            err_type = "None"
        else:
            err_type = "Mispronunciation"

        phonemes_list = []
        if t_ini:
            phonemes_list.append({"Phoneme": t_ini, "AccuracyScore": round(best_init_s, 1)})
        phonemes_list.append({"Phoneme": t_fin or t_clean, "AccuracyScore": round(best_fin_s, 1)})

        words_out.append({
            "Word": t_hanzi,
            "AccuracyScore": round(best_w_acc, 1),
            "ErrorType": err_type,
            "Phonemes": phonemes_list
        })
        word_scores.append(best_w_acc)

    overall_acc = float(np.mean(word_scores)) if word_scores else 0.0
    completeness = 100.0 * float(matched_count) / float(max(1, len(evaluated_syllables)))

    # Smooth fluency & pron_score calculation:
    # - Strictly penalize when overall_acc < 35 (unrelated word / gibberish)
    # - Gently reward partial / near-accurate beginner pronunciation (overall_acc >= 55)
    if overall_acc < 35.0:
        fluency = overall_acc
        pron_score = overall_acc
    else:
        fluency = float(np.clip(78.0 + 18.0 * acoustic_conf, 72.0, 96.0))
        pron_score = 0.75 * overall_acc + 0.15 * fluency + 0.10 * max(completeness, overall_acc)

    # Display canonical targetHanzi if every syllable is a homophone (exact pinyin match)
    rec_exact_homophone = (
        len(rec_clean_pinyins) == len(evaluated_syllables)
        and all(rec_clean_pinyins[i] == evaluated_syllables[i].get("clean_pinyin") for i in range(len(evaluated_syllables)))
    )
    display_text = target_text if rec_exact_homophone else clean_rec

    return {
        "RecognitionStatus": "Success",
        "Provider": "groq-whisper-large-v3",
        "NBest": [
            {
                "Confidence": round(acoustic_conf, 2),
                "Display": display_text,
                "AccuracyScore": round(overall_acc, 1),
                "FluencyScore": round(fluency, 1),
                "CompletenessScore": round(completeness, 1),
                "PronScore": round(pron_score, 1),
                "Words": words_out
            }
        ]
    }


def merge_azure_and_local_assessment(
    target_text: str,
    target_pinyin: str,
    evaluated_syllables: List[Dict[str, Any]],
    audio_meta: Dict[str, Any],
    azure_data: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    Fuses Cloud Neural Pronunciation Assessment (Phoneme Initials, Finals, Fluency, Completeness, ASR)
    with Local Chao 5-Scale Tone Sandhi contours into the canonical PronunciationAssessmentResponse schema.
    Uses balanced 3-dimension weighting (30% Initial + 35% Final + 35% Tone) with zero cliff-edge drops
    for beginners, while strictly rejecting unrelated gibberish (< 35 phonetic accuracy).
    """
    if not azure_data or not isinstance(azure_data, dict):
        return None

    rec_status = azure_data.get("RecognitionStatus", "")
    nbest_list = azure_data.get("NBest")
    if rec_status != "Success" or not isinstance(nbest_list, list) or len(nbest_list) == 0:
        logger.info(f"Cloud AI RecognitionStatus='{rec_status}' with empty NBest; falling back to local DSP report.")
        return None

    nbest = nbest_list[0]
    raw_display = str(nbest.get("Display") or nbest.get("Lexical") or "").strip()
    recognized_text = raw_display.strip(" 。，！？、.!?,;；：:")
    if not recognized_text:
        recognized_text = target_text

    accuracy_score = float(nbest.get("AccuracyScore", 0.0))
    fluency_score = float(nbest.get("FluencyScore", accuracy_score))
    completeness_score = float(nbest.get("CompletenessScore", 100.0))
    azure_conf = float(nbest.get("Confidence", 0.85))

    words = nbest.get("Words") or []

    enriched_syllables: List[Dict[str, Any]] = []
    init_scores: List[Tuple[str, str, int]] = []   # (hanzi, initial_str, score)
    final_scores: List[Tuple[str, str, int]] = []  # (hanzi, final_str, score)

    for idx, syl in enumerate(evaluated_syllables):
        syl_copy = dict(syl)
        hanzi_char = syl_copy.get("hanzi", "")
        clean_py = syl_copy.get("clean_pinyin", "")
        initial_py, final_py = split_pinyin_initial_final(clean_py)

        # Match word from Words list
        matched_word = None
        if idx < len(words) and words[idx].get("Word") == hanzi_char:
            matched_word = words[idx]
        else:
            for w in words:
                if w.get("Word") == hanzi_char:
                    matched_word = w
                    break
            if matched_word is None and idx < len(words):
                matched_word = words[idx]

        local_tone_score = float(syl_copy.get("score", 70))

        if matched_word is not None:
            w_acc = float(matched_word.get("AccuracyScore", accuracy_score))
            err_type = str(matched_word.get("ErrorType", "None"))
            phonemes = matched_word.get("Phonemes") or []

            if initial_py:
                if len(phonemes) >= 2:
                    init_s = float(phonemes[0].get("AccuracyScore", w_acc))
                    fin_s = float(np.mean([float(p.get("AccuracyScore", w_acc)) for p in phonemes[1:]]))
                elif len(phonemes) == 1:
                    init_s = float(phonemes[0].get("AccuracyScore", w_acc))
                    fin_s = init_s
                else:
                    init_s = w_acc
                    fin_s = w_acc
            else:
                init_s = None
                if len(phonemes) >= 1:
                    fin_s = float(np.mean([float(p.get("AccuracyScore", w_acc)) for p in phonemes]))
                else:
                    fin_s = w_acc
        else:
            w_acc = accuracy_score
            err_type = "None"
            init_s = accuracy_score if initial_py else None
            fin_s = accuracy_score

        # 1. Gibberish / Unrelated Syllable Gate:
        # Only suppress tone score when phonetic accuracy is < 35 (neither initial nor final is even close)
        if w_acc < 35.0:
            syl_copy["tone_correct"] = False
            local_tone_score = min(local_tone_score, w_acc)
        else:
            # 2. Beginner-Friendly Tone Reconciliation:
            # In Mandarin, beginners often pronounce the right syllable (w_acc >= 68) with a slightly
            # shallow pitch contour. Give smooth partial credit for tone (>= 62) so one slight pitch
            # wobble doesn't tank a recognizable word!
            if w_acc >= 80.0 and err_type == "None" and not syl_copy.get("tone_correct", False):
                syl_copy["tone_correct"] = True
                syl_copy["detected_tone"] = syl_copy.get("target_tone", syl_copy.get("detected_tone"))
                local_tone_score = max(local_tone_score, 78.0)
            elif w_acc >= 62.0 and local_tone_score < 60.0:
                local_tone_score = max(local_tone_score, 60.0)

        # 3. Balanced 3-Dimension Syllable Score:
        # 30% Initial (Thanh mẫu) + 35% Final (Vận mẫu) + 35% Tone (Thanh điệu)
        if init_s is not None:
            hybrid_syl_score = int(round(0.30 * init_s + 0.35 * fin_s + 0.35 * local_tone_score))
        else:
            hybrid_syl_score = int(round(0.65 * fin_s + 0.35 * local_tone_score))

        if w_acc < 35.0:
            hybrid_syl_score = min(hybrid_syl_score, int(round(w_acc)))

        syl_copy["initial"] = initial_py
        syl_copy["final"] = final_py
        syl_copy["initial_score"] = int(round(init_s)) if init_s is not None else None
        syl_copy["final_score"] = int(round(fin_s))
        syl_copy["azure_accuracy"] = round(w_acc, 1)
        syl_copy["error_type"] = err_type
        syl_copy["tone_score"] = int(round(local_tone_score))
        syl_copy["score"] = int(np.clip(hybrid_syl_score, 0, 100))

        if initial_py and syl_copy["initial_score"] is not None:
            init_scores.append((hanzi_char, initial_py, syl_copy["initial_score"]))
        if final_py:
            final_scores.append((hanzi_char, final_py, syl_copy["final_score"]))

        enriched_syllables.append(syl_copy)

    # Overall score is the mean of the 3-dimension syllable scores (smooth, zero cliff-edge drops!)
    overall_score = int(round(np.mean([s["score"] for s in enriched_syllables]))) if enriched_syllables else int(round(accuracy_score))
    local_tone_avg = float(np.mean([s["tone_score"] for s in enriched_syllables])) if enriched_syllables else accuracy_score

    # Only cap when the entire word is completely unrelated gibberish (accuracy_score < 35)
    if accuracy_score < 35.0 and completeness_score == 0.0:
        overall_score = min(overall_score, int(round(accuracy_score)))

    # Determine Confidence
    if azure_conf >= 0.80 and audio_meta.get("snr_db", 15.0) >= 10.0:
        confidence = "HIGH"
    elif azure_conf >= 0.50:
        confidence = "MEDIUM"
    else:
        confidence = "LOW"

    # 1. Build Initials Feedback (Thanh mẫu)
    if init_scores:
        avg_init = int(round(np.mean([x[2] for x in init_scores])))
        details = [f"'{ini}-' ({hz}: {sc}đ)" for hz, ini, sc in init_scores]
        weak_inits = [f"'{ini}-' ({hz})" for hz, ini, sc in init_scores if sc < 70]
        if avg_init >= 85:
            initials_feedback = f"Chuẩn xác ({avg_init}/100): Phát âm rõ phụ âm đầu {', '.join(details)}."
        elif avg_init >= 65:
            initials_feedback = f"Khá tốt ({avg_init}/100): {', '.join(details)}. Chú ý vị trí đầu lưỡi và độ bật hơi rõ hơn một chút."
        elif avg_init >= 40:
            weak_str = ", ".join(weak_inits) if weak_inits else ", ".join(details)
            initials_feedback = f"Cần cải thiện ({avg_init}/100): Phụ âm đầu {weak_str} hơi lệch, chú ý phân biệt âm bật hơi/quặt lưỡi."
        else:
            weak_str = ", ".join(weak_inits) if weak_inits else ", ".join(details)
            initials_feedback = f"Chưa đạt ({avg_init}/100): Phụ âm đầu {weak_str} không khớp với từ mục tiêu."
    else:
        initials_feedback = "Âm tiết mở đầu bằng nguyên âm (không có phụ âm thanh mẫu), khởi âm rõ ràng."

    # 2. Build Finals Feedback (Vận mẫu)
    if final_scores:
        avg_fin = int(round(np.mean([x[2] for x in final_scores])))
        details = [f"'-{fin}' ({hz}: {sc}đ)" for hz, fin, sc in final_scores]
        weak_fins = [f"'-{fin}' ({hz})" for hz, fin, sc in final_scores if sc < 70]
        if avg_fin >= 85:
            finals_feedback = f"Tròn vành rõ chữ ({avg_fin}/100): Nguyên âm vần {', '.join(details)}."
        elif avg_fin >= 65:
            finals_feedback = f"Khá tốt ({avg_fin}/100): {', '.join(details)}. Mở khẩu hình rộng và giữ hơi đều hơn một chút."
        elif avg_fin >= 40:
            weak_str = ", ".join(weak_fins) if weak_fins else ", ".join(details)
            finals_feedback = f"Cần điều chỉnh khẩu hình ({avg_fin}/100): Phần vần {weak_str} phát âm chưa tròn âm."
        else:
            weak_str = ", ".join(weak_fins) if weak_fins else ", ".join(details)
            finals_feedback = f"Chưa đạt ({avg_fin}/100): Phần vần {weak_str} không khớp với từ mục tiêu."
    else:
        finals_feedback = f"Độ chính xác nguyên âm đạt {int(round(accuracy_score))}/100."

    # 3. Build Tones Feedback (Thanh điệu & Biến điệu)
    tones_fb_list: List[str] = []
    for s in enriched_syllables:
        hz = s["hanzi"]
        t_target = s["target_tone"]
        t_det = s["detected_tone"]
        if s["azure_accuracy"] < 35.0:
            tones_fb_list.append(f"Chữ '{hz}': Chưa phát âm đúng âm tiết nên không tính điểm thanh điệu ({s['score']}đ).")
        elif s["tone_correct"]:
            if s.get("sandhi_applied"):
                tones_fb_list.append(f"Chữ '{hz}': Biến điệu chuẩn sang thanh {t_target} ({s['score']}đ).")
            else:
                tones_fb_list.append(f"Chữ '{hz}': Thanh {t_target} phát âm chuẩn ({s['score']}đ).")
        else:
            tones_fb_list.append(f"Chữ '{hz}': Thanh điệu gần đúng (đang nghiêng về thanh {t_det} so với thanh {t_target} chuẩn — {s['score']}đ).")

    tones_feedback = " ".join(tones_fb_list)

    # 4. Build Summary & Retry Advice in Vietnamese
    all_tones_correct = all(s["tone_correct"] for s in enriched_syllables)
    fluency_int = int(round(fluency_score))
    acc_int = int(round(accuracy_score))

    if overall_score >= 85 and all_tones_correct:
        summary_vi = f"Phát âm rất chuẩn từ '{target_text}' ({target_pinyin})!"
        retry_advice = "Duy trì khẩu hình, độ bật hơi và ngữ điệu tự nhiên này ở các từ tiếp theo."
    elif overall_score >= 70:
        summary_vi = f"Phát âm từ '{target_text}' ({target_pinyin}) khá rõ ràng!"
        retry_advice = "Bạn đọc rất sát mẫu rồi, chú ý giữ nguyên âm và cao độ thanh điệu ổn định hơn để đạt trên 90 điểm."
    elif overall_score >= 45:
        summary_vi = f"Đã phát âm gần đúng từ '{target_text}' ({target_pinyin}), cần chỉnh nhẹ khẩu hình hoặc thanh điệu."
        retry_advice = "Hãy xem gợi ý Thanh mẫu / Vận mẫu bên dưới để chỉnh nhẹ âm bị lệch ở lần ôn tiếp theo."
    else:
        summary_vi = f"Phát âm chưa khớp với từ mục tiêu '{target_text}' ({target_pinyin})."
        retry_advice = "Vui lòng nghe kỹ lại âm mẫu, đọc đúng từ mục tiêu và thử lại (thẻ sẽ được ôn lại trong phiên)."

    return {
        "status": "assessed",
        "targetText": target_text,
        "targetPinyin": target_pinyin,
        "recognizedText": recognized_text,
        "overallScore": overall_score,
        "confidence": confidence,
        "summaryVi": summary_vi,
        "pronunciationFeedback": f"Đánh giá AI Đa tầng (Âm vị: {acc_int}/100, Lưu loát: {fluency_int}/100, Thanh điệu: {int(round(local_tone_avg))}/100).",
        "components": {
            "initialsFeedback": initials_feedback,
            "finalsFeedback": finals_feedback,
            "tonesFeedback": tones_feedback
        },
        "syllables": enriched_syllables,
        "retryAdvice": retry_advice,
        "limitations": "Đánh giá bởi Mạng Nơ-ron Âm học AI kết hợp Chao 5-Scale Tone Sandhi."
    }


def assess_with_azure_hybrid(
    pcm: np.ndarray,
    sr: int,
    target_text: str,
    target_pinyin: str,
    evaluated_syllables: List[Dict[str, Any]],
    audio_meta: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    Entry point for Hybrid Cloud AI (Azure Speech or Groq Whisper Large-v3) + Local DSP assessment.
    If configured and reachable, returns the enriched hybrid assessment report.
    Otherwise returns None so the caller seamlessly falls back to the local Chao 5-Scale report.
    """
    api_key, region_or_provider, configured = get_azure_config()
    if not configured:
        return None

    try:
        wav_bytes = pcm_to_wav_16k_bytes(pcm, sr)
        if region_or_provider == "groq-cloud" or api_key.startswith("gsk_"):
            cloud_json = call_groq_whisper_pronunciation_api(
                wav_bytes=wav_bytes,
                target_text=target_text,
                evaluated_syllables=evaluated_syllables,
                api_key=api_key
            )
        else:
            cloud_json = call_azure_pronunciation_api(
                wav_bytes=wav_bytes,
                target_text=target_text,
                api_key=api_key,
                region=region_or_provider
            )
        if cloud_json is None:
            return None
        return merge_azure_and_local_assessment(
            target_text=target_text,
            target_pinyin=target_pinyin,
            evaluated_syllables=evaluated_syllables,
            audio_meta=audio_meta,
            azure_data=cloud_json
        )
    except Exception as exc:
        logger.warning(f"Unexpected error in assess_with_azure_hybrid: {exc}")
        return None
