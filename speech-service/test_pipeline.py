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

    # 2. Silence / Faint Mic Hiss
    silence_pcm = np.random.normal(0, 0.001, int(1.0 * sr)).astype(np.float32)
    q = inspect_audio_quality(silence_pcm, sr)
    assert not q["scorable"] and q["status"] == "not_scorable"
    print("  [PASS] Silence rejected (RMS < 0.012, Peak < 0.04)")

    # 3. Ambient Fan Noise / Continuous Mic Hum (Low dynamic range)
    fan_noise_pcm = (np.random.normal(0, 0.015, int(1.0 * sr)) + 0.01 * np.sin(2 * np.pi * 60 * np.linspace(0, 1.0, int(1.0 * sr)))).astype(np.float32)
    q = inspect_audio_quality(fan_noise_pcm, sr)
    assert not q["scorable"] and q["status"] == "not_scorable"
    print("  [PASS] Ambient fan / hum noise rejected (Low dynamic range contrast)")

    # 4. Clipping
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
    # Truthful reporting contract check
    assert report.get("recognizedText") is None, "Should not fake recognizedText when non-ASR"
    assert "initialsFeedback" not in report.get("components", {}), "Should not fake initialsFeedback"
    assert "finalsFeedback" not in report.get("components", {}), "Should not fake finalsFeedback"
    assert "tonesFeedback" in report.get("components", {})
    print("  [PASS] End-to-End Evaluation of '茶' (Tone 2 correctly recognized, truthful non-ASR contract)")

def test_flat_tone_1_probe():
    print("Testing Tone 1 Flat Pitch Probes across vocal registers (Male 130Hz, Female 220Hz, Child 330Hz)...")
    sr = 16000
    dur = 0.8
    t = np.linspace(0, dur, int(sr * dur), endpoint=False)
    
    # Test pitches representing male (130Hz), female (220Hz), and child (330Hz)
    test_freqs = [(130.0, "Male 130Hz"), (220.0, "Female 220Hz"), (330.0, "Child 330Hz")]
    
    for freq, label in test_freqs:
        phase = 2 * np.pi * freq * t
        audio_pcm = 0.5 * np.sin(phase) + 0.25 * np.sin(2 * phase)
        env = np.hanning(len(audio_pcm))
        audio_pcm = (audio_pcm * env).astype(np.float32)
        
        buf = io.BytesIO()
        sf.write(buf, audio_pcm, sr, format='WAV')
        pcm, decoded_sr = decode_audio_to_mono_16k(buf.getvalue())
        
        q = inspect_audio_quality(pcm, decoded_sr)
        assert q["scorable"], f"Audio gate rejected flat signal {label}: {q}"
        
        times, f0, voiced = extract_f0_contour(pcm, decoded_sr)
        assert np.sum(voiced) >= 10, f"Should have plenty of voiced frames for {label}"
        
        chao = normalize_to_chao_scale(f0, voiced)
        contours = segment_and_interpolate_syllables(chao, voiced, 1)
        
        # Must detect Tone 1 and NOT Tone 3!
        res = score_syllable(contours[0], 1)
        assert res["detected_tone"] == 1, f"Expected Tone 1 for {label}, but got Tone {res['detected_tone']}"
        assert res["tone_correct"] is True, f"Tone 1 should be scored correct for {label}"
        assert res["score"] >= 80, f"Expected high score for Tone 1 {label}, got {res['score']}"
        print(f"  [PASS] {label} correctly classified as Tone 1 (score={res['score']}, detected_tone={res['detected_tone']})")

def test_all_tones_synthetic():
    print("Testing Synthetic Shapes for all Mandarin Tones (1, 2, 3, 4, 5)...")
    sr = 16000
    dur = 0.8
    t = np.linspace(0, dur, int(sr * dur), endpoint=False)

    # Tone 1: Natural human Tone 1 with gentle pitch declination (238 Hz -> 208 Hz, ~2.3 st drift)
    # Must NOT be misclassified as Tone 4!
    f1_drift = np.linspace(238, 208, len(t))
    p1 = (0.5 * np.sin(2 * np.pi * np.cumsum(f1_drift) / sr) * np.hanning(len(t))).astype(np.float32)
    _, f0_1, v_1 = extract_f0_contour(p1, sr)
    chao_1 = normalize_to_chao_scale(f0_1, v_1)
    c1 = segment_and_interpolate_syllables(chao_1, v_1, 1)[0]
    res1 = score_syllable(c1, 1)
    assert res1["detected_tone"] == 1, f"Expected Tone 1 for natural declination, got Tone {res1['detected_tone']}"
    assert res1["tone_correct"] is True
    assert res1["score"] >= 80
    print(f"  [PASS] Natural Tone 1 with 2.3st declination classified correctly (score={res1['score']})")

    # Tone 4: Falling pitch (320 Hz -> 150 Hz)
    f4 = np.linspace(320, 150, len(t))
    p4 = (0.5 * np.sin(2 * np.pi * np.cumsum(f4) / sr) * np.hanning(len(t))).astype(np.float32)
    times, f0, voiced = extract_f0_contour(p4, sr)
    chao = normalize_to_chao_scale(f0, voiced)
    c4 = segment_and_interpolate_syllables(chao, voiced, 1)[0]
    res4 = score_syllable(c4, 4)
    assert res4["detected_tone"] == 4, f"Expected Tone 4, got {res4['detected_tone']}"
    assert res4["tone_correct"] is True
    print(f"  [PASS] Tone 4 correctly classified (score={res4['score']})")

    # Tone 2: Rising pitch (180 Hz -> 280 Hz)
    f2 = np.linspace(180, 280, len(t))
    p2 = (0.5 * np.sin(2 * np.pi * np.cumsum(f2) / sr) * np.hanning(len(t))).astype(np.float32)
    _, f0_2, v_2 = extract_f0_contour(p2, sr)
    chao_2 = normalize_to_chao_scale(f0_2, v_2)
    c2 = segment_and_interpolate_syllables(chao_2, v_2, 1)[0]
    res2 = score_syllable(c2, 2)
    assert res2["detected_tone"] == 2, f"Expected Tone 2, got {res2['detected_tone']}"
    assert res2["tone_correct"] is True
    print(f"  [PASS] Tone 2 correctly classified (score={res2['score']})")

    # Tone 3: Canonical 214 dip-rise (starts mid-low 200 Hz, dips to 140 Hz, rises to 240 Hz)
    # Must NOT be misclassified as Tone 2!
    t_half = dur / 2.0
    f3_dip = np.where(t < t_half,
                      200.0 - 60.0 * (t / t_half),
                      140.0 + 100.0 * ((t - t_half) / t_half))
    p3 = (0.5 * np.sin(2 * np.pi * np.cumsum(f3_dip) / sr) * np.hanning(len(t))).astype(np.float32)
    times, f0, voiced = extract_f0_contour(p3, sr)
    chao = normalize_to_chao_scale(f0, voiced)
    c3 = segment_and_interpolate_syllables(chao, voiced, 1)[0]
    res3 = score_syllable(c3, 3)
    assert res3["detected_tone"] == 3, f"Expected Tone 3 (214 dip-rise), got Tone {res3['detected_tone']}"
    assert res3["tone_correct"] is True
    print(f"  [PASS] Tone 3 canonical 214 dip-rise correctly classified (score={res3['score']})")

    # Tone 5: Neutral tone after Tone 4 (bàba 2nd syl at low pitch ~1.8)
    c_neutral_after_4 = np.full(20, 1.8, dtype=np.float32)
    res_n4 = score_syllable(c_neutral_after_4, 5, prev_tone=4)
    assert res_n4["detected_tone"] == 5, f"Expected Tone 5 after Tone 4, got Tone {res_n4['detected_tone']}"
    assert res_n4["tone_correct"] is True
    assert res_n4["score"] >= 80, f"Expected high score for neutral tone after 4, got {res_n4['score']}"
    print(f"  [PASS] Tone 5 neutral tone after Tone 4 correctly classified (score={res_n4['score']})")

    # Tone 5: Neutral tone after Tone 1 (māma 2nd syl at mid-low pitch ~2.6)
    c_neutral_after_1 = np.full(20, 2.6, dtype=np.float32)
    res_n1 = score_syllable(c_neutral_after_1, 5, prev_tone=1)
    assert res_n1["detected_tone"] == 5, f"Expected Tone 5 after Tone 1, got Tone {res_n1['detected_tone']}"
    assert res_n1["tone_correct"] is True
    assert res_n1["score"] >= 80
    print(f"  [PASS] Tone 5 neutral tone after Tone 1 correctly classified (score={res_n1['score']})")

def test_vad_syllable_segmentation():
    print("Testing VAD-aware Syllable Segmentation with silence gap and noise click...")
    sr = 16000
    # Two syllables of 0.35s each, separated by 0.15s of silence
    f1 = np.full(int(0.35 * sr), 240.0)
    p1 = 2 * np.pi * np.cumsum(f1) / sr
    syl1 = (0.5 * np.sin(p1) * np.hanning(len(f1))).astype(np.float32)
    silence = np.zeros(int(0.15 * sr), dtype=np.float32)
    f2 = np.linspace(160, 240, int(0.35 * sr))
    p2 = 2 * np.pi * np.cumsum(f2) / sr
    syl2 = (0.5 * np.sin(p2) * np.hanning(len(f2))).astype(np.float32)
    
    # Prepend a 40ms noise click (extraneous blip)
    noise_click = (0.1 * np.sin(2 * np.pi * 300.0 * np.linspace(0, 0.04, int(0.04 * sr))) * np.hanning(int(0.04 * sr))).astype(np.float32)
    leading_gap = np.zeros(int(0.08 * sr), dtype=np.float32)
    multi_syl_audio = np.concatenate([noise_click, leading_gap, syl1, silence, syl2])
    
    times, f0, voiced = extract_f0_contour(multi_syl_audio, sr)
    chao = normalize_to_chao_scale(f0, voiced)
    contours = segment_and_interpolate_syllables(chao, voiced, 2)
    assert len(contours) == 2, f"Expected 2 syllable contours, got {len(contours)}"
    # Syllable 1 should be flat (Tone 1)
    res1 = score_syllable(contours[0], 1)
    assert res1["detected_tone"] == 1, f"Expected Tone 1 for first syllable, got {res1['detected_tone']}"
    # Syllable 2 should be rising (Tone 2)
    res2 = score_syllable(contours[1], 2)
    assert res2["detected_tone"] == 2, f"Expected Tone 2 for second syllable, got {res2['detected_tone']}"
    print("  [PASS] VAD segmented two syllables accurately across silence gap and rejected leading click")

def test_unspaced_database_pinyin():
    print("Testing Database Concatenated & Numbered Pinyin Parsing...")
    import unicodedata

    # 1. àihào (爱好) -> 2 syllables, tones 4 & 4
    aihao = parse_target_syllables("爱好", "àihào")
    assert len(aihao) == 2, f"Expected 2 syllables, got {len(aihao)}"
    assert aihao[0]["clean_pinyin"] == "ai" and aihao[0]["target_tone"] == 4
    assert aihao[1]["clean_pinyin"] == "hao" and aihao[1]["target_tone"] == 4
    print("  [PASS] '爱好' with unspaced 'àihào' parsed correctly (4 + 4)")

    # 2. NFD Unicode decomposed pinyin
    nfd_pinyin = unicodedata.normalize('NFD', 'àihào')
    aihao_nfd = parse_target_syllables("爱好", nfd_pinyin)
    assert len(aihao_nfd) == 2
    assert aihao_nfd[0]["target_tone"] == 4 and aihao_nfd[1]["target_tone"] == 4
    print("  [PASS] '爱好' with NFD Unicode decomposed 'àihào' normalized and parsed correctly")

    # 3. bàba (爸爸) -> 2 syllables, tone 4 & neutral tone 5 preserved!
    baba = parse_target_syllables("爸爸", "bàba")
    assert len(baba) == 2, f"Expected 2 syllables, got {len(baba)}"
    assert baba[0]["clean_pinyin"] == "ba" and baba[0]["target_tone"] == 4
    assert baba[1]["clean_pinyin"] == "ba" and baba[1]["target_tone"] == 5, f"Expected neutral tone 5 for 2nd ba, got {baba[1]['target_tone']}"
    print("  [PASS] '爸爸' with unspaced 'bàba' preserved neutral tone 5 on second syllable")

    # 4. Numbered pinyin: xie4xie (谢谢) -> tone 4 & neutral tone 5
    xiexie_num = parse_target_syllables("谢谢", "xie4xie")
    assert len(xiexie_num) == 2
    assert xiexie_num[0]["target_tone"] == 4 and xiexie_num[1]["target_tone"] == 5
    print("  [PASS] '谢谢' with numbered 'xie4xie' parsed without tone reversal")

    # 5. Tone sandhi before neutral tone: 一个 (yīge) -> 2 + 5
    yige = parse_target_syllables("一个", "yīge")
    assert len(yige) == 2
    assert yige[0]["target_tone"] == 2, f"Expected Tone 2 for 一 before neutral 个 (ge4), got {yige[0]['target_tone']}"
    print("  [PASS] '一个' with neutral 'yīge' applied Tone 2 sandhi for '一'")

    # 6. Tone sandhi before neutral tone: 不是 (bùshi) -> 2 + 5
    bushi = parse_target_syllables("不是", "bùshi")
    assert len(bushi) == 2
    assert bushi[0]["target_tone"] == 2, f"Expected Tone 2 for 不 before neutral 是 (shi4), got {bushi[0]['target_tone']}"
    print("  [PASS] '不是' with neutral 'bùshi' applied Tone 2 sandhi for '不'")

    # 7. diànshìjī (电视机) -> 3 syllables, tones 4, 4, 1
    dianshiji = parse_target_syllables("电视机", "diànshìjī")
    assert len(dianshiji) == 3, f"Expected 3 syllables, got {len(dianshiji)}"
    assert dianshiji[0]["target_tone"] == 4
    assert dianshiji[1]["target_tone"] == 4
    assert dianshiji[2]["target_tone"] == 1
    print("  [PASS] '电视机' with unspaced 'diànshìjī' parsed correctly (4 + 4 + 1)")

def test_f0_voiced_gate():
    print("Testing F0 Voiced Frames Gate (< 3 frames rejected)...")
    f0 = np.zeros(20, dtype=np.float32)
    voiced = np.zeros(20, dtype=bool)
    # Only 2 voiced frames
    voiced[5:7] = True
    f0[5:7] = 200.0
    chao = normalize_to_chao_scale(f0, voiced)
    assert np.all(chao == 0.0), "Should return zeros when voiced frames < 3"
    print("  [PASS] normalize_to_chao_scale returns zeros on insufficient voiced frames (< 3)")

def test_async_endpoint():
    print("Testing FastAPI evaluate_reading handler directly...")
    import asyncio
    import json
    from fastapi import UploadFile
    from app.main import evaluate_reading

    async def _run():
        sr, dur = 16000, 0.8
        t = np.linspace(0, dur, int(sr * dur), endpoint=False)
        audio_pcm = (0.5 * np.sin(2 * np.pi * 220.0 * t) * np.hanning(int(sr * dur))).astype(np.float32)
        buf = io.BytesIO()
        sf.write(buf, audio_pcm, sr, format='WAV')
        
        upload = UploadFile(filename='test.wav', file=io.BytesIO(buf.getvalue()))
        resp = await evaluate_reading(audio=upload, targetText='妈', expectedPinyin='mā')
        data = json.loads(resp.body.decode('utf-8'))
        assert data['status'] == 'assessed'
        assert data['overallScore'] >= 80
        assert data['syllables'][0]['detected_tone'] == 1
        assert data.get('recognizedText') is None
        assert 'initialsFeedback' not in data.get('components', {})

    asyncio.run(_run())
    print("  [PASS] FastAPI evaluate_reading handler passed end-to-end")

if __name__ == "__main__":
    test_sandhi_rules()
    test_audio_gates()
    test_audio_pipeline()
    test_flat_tone_1_probe()
    test_all_tones_synthetic()
    test_vad_syllable_segmentation()
    test_unspaced_database_pinyin()
    test_f0_voiced_gate()
    test_async_endpoint()
    print("\nALL SPEECH ENGINE TESTS PASSED SUCCESSFULLY! ✓")
