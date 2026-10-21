import math
import numpy as np
from scipy import signal
from typing import List, Tuple, Dict, Any

FRAME_SIZE_SEC = 0.030   # 30ms window
HOP_SIZE_SEC = 0.010     # 10ms hop
MIN_F0_HZ = 75.0        # Human male low limit
MAX_F0_HZ = 500.0       # Human female high limit

def extract_f0_contour(pcm: np.ndarray, sr: int = 16000) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Extracts fundamental frequency (F0 in Hz) using short-time autocorrelation.
    Returns:
        times: timestamps of each frame
        f0: estimated F0 in Hz (0.0 for unvoiced)
        voiced: boolean array indicating voiced frames
    """
    frame_len = int(FRAME_SIZE_SEC * sr)
    hop_len = int(HOP_SIZE_SEC * sr)
    min_lag = int(sr / MAX_F0_HZ)
    max_lag = int(sr / MIN_F0_HZ)
    
    num_frames = max(1, (len(pcm) - frame_len) // hop_len)
    times = np.zeros(num_frames, dtype=np.float32)
    f0 = np.zeros(num_frames, dtype=np.float32)
    voiced = np.zeros(num_frames, dtype=bool)
    
    # Pre-emphasis
    emphasized = np.append(pcm[0], pcm[1:] - 0.95 * pcm[:-1])
    window = np.hanning(frame_len)
    
    # Threshold for voicing based on energy
    frame_energies = []
    for i in range(num_frames):
        start = i * hop_len
        f_raw = pcm[start:start + frame_len]
        frame_energies.append(np.sum(f_raw ** 2))
    energy_threshold = np.percentile(frame_energies, 20) * 1.5 + 1e-6
    
    for i in range(num_frames):
        start = i * hop_len
        frame = emphasized[start:start + frame_len] * window
        times[i] = float(start + frame_len / 2) / sr
        
        energy = frame_energies[i]
        if energy < energy_threshold:
            continue
            
        # Autocorrelation
        autocorr = signal.correlate(frame, frame, mode='full')
        autocorr = autocorr[len(autocorr)//2:] # non-negative lags
        
        if len(autocorr) <= max_lag:
            continue
            
        # Search peak within [min_lag, max_lag]
        search_window = autocorr[min_lag:max_lag]
        if len(search_window) == 0:
            continue
            
        peak_idx = np.argmax(search_window) + min_lag
        peak_val = autocorr[peak_idx]
        zero_lag_val = autocorr[0] + 1e-9
        norm_peak = peak_val / zero_lag_val
        
        # Voicing decision threshold (normalized correlation > 0.35)
        if norm_peak > 0.35:
            # Parabolic interpolation for fine-pitch frequency
            if 0 < peak_idx < len(autocorr) - 1:
                alpha = autocorr[peak_idx - 1]
                beta = autocorr[peak_idx]
                gamma = autocorr[peak_idx + 1]
                denom = 2 * (alpha - 2 * beta + gamma) + 1e-9
                delta = (alpha - gamma) / denom
                true_lag = peak_idx + delta
            else:
                true_lag = peak_idx
                
            pitch_hz = float(sr) / true_lag
            if MIN_F0_HZ <= pitch_hz <= MAX_F0_HZ:
                f0[i] = pitch_hz
                voiced[i] = True

    return times, f0, voiced

def normalize_to_chao_scale(f0: np.ndarray, voiced: np.ndarray) -> np.ndarray:
    """
    Normalizes voiced F0 contour into speaker-adaptive Chao 5-level scale (1.0 .. 5.0).
    Using Semitone logarithmic transformation.
    """
    chao = np.zeros_like(f0, dtype=np.float32)
    voiced_f0 = f0[voiced]
    
    if len(voiced_f0) < 3:
        return chao
        
    # Semitones relative to 50 Hz base
    semitones = 12.0 * np.log2(voiced_f0 / 50.0)
    
    # 5th and 95th percentiles to avoid outliers
    p5 = np.percentile(semitones, 5)
    p95 = np.percentile(semitones, 95)
    span = max(p95 - p5, 3.0) # at least 3 semitones span
    
    # Map to [1.0, 5.0]
    norm_st = 1.0 + 4.0 * ((semitones - p5) / span)
    norm_st = np.clip(norm_st, 1.0, 5.0)
    
    chao[voiced] = norm_st
    return chao

def segment_and_interpolate_syllables(chao: np.ndarray, voiced: np.ndarray, num_syllables: int, points_per_syl: int = 20) -> List[np.ndarray]:
    """
    Divides the voiced speech contour evenly among syllables and interpolates each to N points.
    """
    voiced_indices = np.where(voiced)[0]
    if len(voiced_indices) == 0:
        return [np.full(points_per_syl, 3.0) for _ in range(num_syllables)]
        
    start_idx = voiced_indices[0]
    end_idx = voiced_indices[-1]
    total_voiced_len = max(1, end_idx - start_idx + 1)
    
    syllable_contours = []
    chunk_len = total_voiced_len / float(num_syllables)
    
    for i in range(num_syllables):
        s_start = int(start_idx + i * chunk_len)
        s_end = int(start_idx + (i + 1) * chunk_len)
        s_end = max(s_start + 1, min(s_end, len(chao)))
        
        segment_chao = chao[s_start:s_end]
        segment_voiced = voiced[s_start:s_end]
        
        valid_vals = segment_chao[segment_voiced]
        if len(valid_vals) == 0:
            # Fallback to mean of entire contour or 3.0
            overall_valid = chao[voiced]
            fallback_val = float(np.mean(overall_valid)) if len(overall_valid) > 0 else 3.0
            syllable_contours.append(np.full(points_per_syl, fallback_val))
        else:
            # Linear interpolation to exact points_per_syl
            x_old = np.linspace(0, 1, len(valid_vals))
            x_new = np.linspace(0, 1, points_per_syl)
            interpolated = np.interp(x_new, x_old, valid_vals)
            syllable_contours.append(interpolated.astype(np.float32))
            
    return syllable_contours
