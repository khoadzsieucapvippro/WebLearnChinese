import io
import math
import numpy as np
import soundfile as sf
from app.core.tone_sandhi import parse_target_syllables
from app.core.audio_gate import decode_audio_to_mono_16k, inspect_audio_quality
from app.core.pitch_tracker import extract_f0_contour, normalize_to_chao_scale, segment_and_interpolate_syllables
from app.core.evaluator import score_syllable, generate_assessment_report

def test_sandhi_rules():
    print("Testing Tone Sandhi rules...")
    # 1. 3 + 3 -> 2 + 3
    nihao = parse_target_syllables("你好", "nǐ hǎo")
    assert nihao[0]["target_tone"] == 2, f"Expected 2 for 你, got {nihao[0]['target_tone']}"
    assert nihao[1]["target_tone"] == 3, f"Expected 3 for 好, got {nihao[1]['target_tone']}"
    print("  [PASS] 你好 (3+3 -> 2+3)")

    # 2. 不 + 4 -> 2
    budui = parse_target_syllables("不对", "bù duì")
    assert budui[0]["target_tone"] == 2, f"Expected 2 for 不, got {budui[0]['target_tone']}"
    print("  [PASS] 不对 (不+4 -> 2)")

    # 3. 不 + 1 -> 4
    bugao = parse_target_syllables("不高", "bù gāo")
    assert bugao[0]["target_tone"] == 4, f"Expected 4 for 不, got {bugao[0]['target_tone']}"
    print("  [PASS] 不高 (不+1 -> 4)")

    # 4. 一 + 4 -> 2
    yige = parse_target_syllables("一个", "yī gè")
    assert yige[0]["target_tone"] == 2, f"Expected 2 for 一, got {yige[0]['target_tone']}"
    print("  [PASS] 一个 (一+4 -> 2)")

    # 5. 一 + 1 -> 4
    yitian = parse_target_syllables("一天", "yī tiān")
    assert yitian[0]["target_tone"] == 4, f"Expected 4 for 一, got {yitian[0]['target_tone']}"
    print("  [PASS] 一天 (一+1 -> 4)")

    # 6. 看一看 -> neutral
    kanyikan = parse_target_syllables("看一看", "kàn yī kàn")
    assert kanyikan[1]["target_tone"] == 5, f"Expected 5 for 一, got {kanyikan[1]['target_tone']}"
    print("  [PASS] 看一看 (一 between verbs -> 5)")

def test_audio_gates():
    print("Testing Audio Quality Gates...")
    sr = 16000

    # 1. Too short
    short_pcm = np.zeros(int(0.2 * sr), dtype=np.float32)
    q = inspect_audio_quality(short_pcm, sr)
    assert not q["scorable"] and q["status"] == "not_scorable"
    print("  [PASS] Short audio rejected (< 0.35s)")

    # 2. Silence
    silence_pcm = np.random.normal(0, 0.001, int(1.0 * sr)).astype(np.float32)
    q = inspect_audio_quality(silence_pcm, sr)
    assert not q["scorable"] and q["status"] == "not_scorable"
    print("  [PASS] Silence rejected (RMS < 0.006)")

    # 3. Clipping
    clipped_pcm = np.random.normal(0, 0.3, int(1.0 * sr)).astype(np.float32)
    clipped_pcm[:int(0.05 * len(clipped_pcm))] = 1.0 # 5% clipping
    q = inspect_audio_quality(clipped_pcm, sr)
    assert not q["scorable"] and q["status"] == "not_scorable"
    print("  [PASS] Clipping rejected (> 2% clipping)")

def test_audio_pipeline():
    print("Testing End-to-End Synthetic Speech Evaluation...")
    sr = 16000
    dur = 0.8
    t = np.linspace(0, dur, int(sr * dur), endpoint=False)
    
    # Generate rising pitch (Tone 2)
    f0_curve = np.linspace(150, 250, len(t))
    phase = 2 * np.pi * np.cumsum(f0_curve) / sr
    audio_pcm = 0.5 * np.sin(phase) + 0.25 * np.sin(2 * phase)
    # Add envelope
    env = np.hanning(len(audio_pcm))
    audio_pcm = (audio_pcm * env).astype(np.float32)
    
    # Save as in-memory WAV
    buf = io.BytesIO()
    sf.write(buf, audio_pcm, sr, format='WAV')
    raw_bytes = buf.getvalue()
    
    pcm, decoded_sr = decode_audio_to_mono_16k(raw_bytes)
    assert len(pcm) > 0
    
    q = inspect_audio_quality(pcm, decoded_sr)
    assert q["scorable"]
    
    syllables = parse_target_syllables("茶", "chá") # Tone 2
    times, f0, voiced = extract_f0_contour(pcm, decoded_sr)
    chao = normalize_to_chao_scale(f0, voiced)
    contours = segment_and_interpolate_syllables(chao, voiced, len(syllables))
    
    res = score_syllable(contours[0], syllables[0]["target_tone"])
    assert res["detected_tone"] == 2, f"Expected detected tone 2 for rising chirp, got {res['detected_tone']}"
    assert res["tone_correct"] == True
    assert res["score"] >= 75
    
    report = generate_assessment_report("茶", "chá", [{**syllables[0], **res}], q)
    assert report["status"] == "assessed"
    assert report["overallScore"] >= 75
    print("  [PASS] End-to-End Evaluation of '茶' (Tone 2 correctly recognized with score >= 75)")

if __name__ == "__main__":
    test_sandhi_rules()
    test_audio_gates()
    test_audio_pipeline()
    print("\nALL SPEECH ENGINE TESTS PASSED SUCCESSFULLY! ✓")
