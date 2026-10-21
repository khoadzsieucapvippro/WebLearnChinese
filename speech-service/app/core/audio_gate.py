import io
import math
import numpy as np
import av
import soundfile as sf
from typing import Tuple, Optional, Dict, Any

TARGET_SAMPLE_RATE = 16000
MIN_DURATION_SEC = 0.35
MIN_RMS_THRESHOLD = 0.006  # roughly -44 dBFS
MAX_CLIPPING_RATIO = 0.02   # 2% clipping
MIN_SNR_DB = 8.0

def decode_audio_to_mono_16k(audio_bytes: bytes) -> Tuple[np.ndarray, int]:
    """
    Decodes audio bytes (WebM, OGG, WAV, etc.) into a 16kHz mono float32 numpy array.
    Uses PyAV (ffmpeg bundled) first, with soundfile as fallback.
    """
    try:
        container = av.open(io.BytesIO(audio_bytes))
        stream = next((s for s in container.streams if s.type == 'audio'), None)
        if stream is None:
            raise ValueError("No audio stream found in container")
        
        # Resample to 16kHz, mono, fltp
        resampler = av.AudioResampler(format='flt', layout='mono', rate=TARGET_SAMPLE_RATE)
        frames = []
        for packet in container.demux(stream):
            for frame in packet.decode():
                resampled = resampler.resample(frame)
                if resampled:
                    # Each resampled frame can be converted to ndarray
                    for r_frame in resampled:
                        arr = r_frame.to_ndarray()
                        frames.append(arr.flatten())
        
        if frames:
            pcm = np.concatenate(frames)
            return pcm.astype(np.float32), TARGET_SAMPLE_RATE
    except Exception as e:
        # Fallback to soundfile for standard WAV
        try:
            data, sr = sf.read(io.BytesIO(audio_bytes), dtype='float32')
            if len(data.shape) > 1:
                data = np.mean(data, axis=1)
            if sr != TARGET_SAMPLE_RATE:
                from scipy import signal
                num_samples = int(len(data) * float(TARGET_SAMPLE_RATE) / sr)
                data = signal.resample(data, num_samples)
            return data.astype(np.float32), TARGET_SAMPLE_RATE
        except Exception as e2:
            raise ValueError(f"Failed to decode audio: av error ({e}), soundfile error ({e2})")

    raise ValueError("Empty audio stream decoded")

def inspect_audio_quality(pcm: np.ndarray, sr: int = TARGET_SAMPLE_RATE) -> Dict[str, Any]:
    """
    Inspects acoustic properties of the PCM audio and returns metrics and screening decision.
    """
    duration = float(len(pcm)) / float(sr)
    
    if len(pcm) == 0:
        return {
            "scorable": False,
            "status": "not_scorable",
            "duration": 0.0,
            "reason": "Bản ghi âm rỗng, không chứa dữ liệu âm thanh.",
            "retry_advice": "Vui lòng bấm micro và đọc to rõ ràng."
        }
        
    # Duration Gate
    if duration < MIN_DURATION_SEC:
        return {
            "scorable": False,
            "status": "not_scorable",
            "duration": duration,
            "reason": f"Bản ghi âm quá ngắn ({duration:.2f}s < 0.35s).",
            "retry_advice": "Vui lòng giữ micro và phát âm trọn vẹn từ mục tiêu."
        }
        
    # Clipping Gate (|x| >= 0.99)
    clipping_samples = np.sum(np.abs(pcm) >= 0.99)
    clipping_ratio = float(clipping_samples) / float(len(pcm))
    if clipping_ratio > MAX_CLIPPING_RATIO:
        return {
            "scorable": False,
            "status": "not_scorable",
            "duration": duration,
            "clipping_ratio": clipping_ratio,
            "reason": f"Âm thanh bị rè hoặc vỡ tiếng (tỷ lệ vỡ {clipping_ratio*100:.1f}% > 2%).",
            "retry_advice": "Vui lòng đặt micro xa miệng một chút và thử lại."
        }

    # RMS Energy Gate
    rms = float(np.sqrt(np.mean(pcm ** 2)))
    if rms < MIN_RMS_THRESHOLD:
        return {
            "scorable": False,
            "status": "not_scorable",
            "duration": duration,
            "rms": rms,
            "reason": f"Không phát hiện thấy tiếng nói hoặc âm lượng quá nhỏ (RMS: {rms:.4f} < {MIN_RMS_THRESHOLD}).",
            "retry_advice": "Vui lòng kiểm tra quyền micro và đọc to, rõ ràng hơn."
        }

    # Frame-level energy and SNR estimation
    frame_len = int(0.025 * sr) # 25ms
    hop_len = int(0.010 * sr)   # 10ms
    frames = []
    for i in range(0, len(pcm) - frame_len, hop_len):
        frame = pcm[i:i + frame_len]
        f_rms = np.sqrt(np.mean(frame ** 2))
        frames.append(f_rms)
    
    if len(frames) > 0:
        frames = np.array(frames)
        # 10th percentile as noise floor, 90th percentile as signal
        noise_floor = float(np.percentile(frames, 10)) + 1e-6
        signal_peak = float(np.percentile(frames, 90)) + 1e-6
        snr_db = 20.0 * math.log10(signal_peak / noise_floor)
        
        # Check voiced ratio (frames with energy > 2.5x noise floor)
        voiced_frames = np.sum(frames > (noise_floor * 2.5))
        voiced_ratio = float(voiced_frames) / float(len(frames))
        
        if snr_db < MIN_SNR_DB:
            return {
                "scorable": False,
                "status": "not_scorable",
                "duration": duration,
                "snr_db": snr_db,
                "reason": f"Tạp âm môi trường quá lớn (SNR {snr_db:.1f} dB < {MIN_SNR_DB} dB).",
                "retry_advice": "Vui lòng di chuyển đến không gian yên tĩnh hơn để luyện đọc."
            }
            
        if voiced_ratio < 0.15:
            return {
                "scorable": False,
                "status": "not_scorable",
                "duration": duration,
                "voiced_ratio": voiced_ratio,
                "reason": "Thời lượng phát âm hữu thanh quá ít so với khoảng lặng.",
                "retry_advice": "Vui lòng phát âm rõ ràng, liền mạch."
            }
    else:
        snr_db = 20.0
        voiced_ratio = 1.0

    return {
        "scorable": True,
        "status": "assessed",
        "duration": duration,
        "rms": rms,
        "clipping_ratio": clipping_ratio,
        "snr_db": snr_db,
        "voiced_ratio": voiced_ratio
    }
