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
    Using Semitone logarithmic transformation with tone-shape aware adaptive scaling.
    Guarantees flat Tone 1 across all vocal registers (male, female, child) maps to high level (4.5-5.0),
    without blowing up natural micro-drift into artificial contour extremes.
    """
    chao = np.zeros_like(f0, dtype=np.float32)
    voiced_f0 = f0[voiced]
    
    if len(voiced_f0) < 3:
        return chao
        
    # Semitones relative to 50 Hz base
    semitones = 12.0 * np.log2(voiced_f0 / 50.0)
    
    # 5th and 95th percentiles to avoid pitch tracking outliers
    p5 = float(np.percentile(semitones, 5))
    p95 = float(np.percentile(semitones, 95))
    span = p95 - p5
    median_st = float(np.median(semitones))
    
    # In Mandarin Chinese, dynamic tones (Tone 2, 3, 4) exhibit large pitch excursion (>= 4.0 semitones).
    # Narrow dynamic range (< 3.5 semitones) indicates sustained flat pitch (Tone 1) or neutral tone,
    # preventing natural micro-drift from being blown up into artificial dynamic contours.
    FLAT_SPAN_THRESHOLD = 3.5
    
    if span < FLAT_SPAN_THRESHOLD:
        center_level = 4.6
        norm_st = center_level + (semitones - median_st) * (4.0 / 6.0)
    else:
        # Dynamic contour (rising, falling, dipping across broad range)
        norm_st = 1.0 + 4.0 * ((semitones - p5) / span)
        
    norm_st = np.clip(norm_st, 1.0, 5.0)
    chao[voiced] = norm_st
    return chao

def segment_and_interpolate_syllables(chao: np.ndarray, voiced: np.ndarray, num_syllables: int, points_per_syl: int = 20) -> List[np.ndarray]:
    """
    Divides the voiced speech contour among syllables respecting pauses/unvoiced boundaries
    and energy transitions, then interpolates each syllable to points_per_syl.
    """
    voiced_indices = np.where(voiced)[0]
    if len(voiced_indices) == 0:
        return [np.full(points_per_syl, 3.0, dtype=np.float32) for _ in range(num_syllables)]
        
    start_idx = voiced_indices[0]
    end_idx = voiced_indices[-1]
    
    if num_syllables <= 1:
        valid_vals = chao[voiced_indices]
        if len(valid_vals) < 2:
            val = float(valid_vals[0]) if len(valid_vals) > 0 else 3.0
            return [np.full(points_per_syl, val, dtype=np.float32)]
        x_old = np.linspace(0, 1, len(valid_vals))
        x_new = np.linspace(0, 1, points_per_syl)
        return [np.interp(x_new, x_old, valid_vals).astype(np.float32)]
        
    # Multi-syllable segmentation with VAD / unvoiced gap detection
    # Step 1: Detect voiced islands separated by silence or unvoiced gaps
    islands = []
    current_island = []
    for idx in voiced_indices:
        if not current_island:
            current_island.append(idx)
        else:
            # If gap between voiced frames is small (<= 3 frames, ~30ms micro-dropout), group together
            if idx - current_island[-1] <= 3:
                current_island.append(idx)
            else:
                islands.append((current_island[0], current_island[-1]))
                current_island = [idx]
    if current_island:
        islands.append((current_island[0], current_island[-1]))
        
    # Filter out very short noise blips (< 3 frames)
    significant_islands = [isl for isl in islands if (isl[1] - isl[0] + 1) >= 3]
    if not significant_islands:
        significant_islands = islands

    # If we have at least num_syllables significant voiced islands, pick the top longest ones:
    if len(significant_islands) >= num_syllables:
        # Pick top num_syllables largest islands by duration to filter out extraneous mic clicks
        top_islands = sorted(significant_islands, key=lambda isl: isl[1] - isl[0] + 1, reverse=True)[:num_syllables]
        # Sort chronologically by start frame
        top_islands = sorted(top_islands, key=lambda isl: isl[0])
        syllable_contours = []
        for isl_start, isl_end in top_islands:
            valid_vals = chao[isl_start:isl_end + 1][voiced[isl_start:isl_end + 1]]
            if len(valid_vals) < 2:
                v = float(valid_vals[0]) if len(valid_vals) > 0 else 3.0
                syllable_contours.append(np.full(points_per_syl, v, dtype=np.float32))
            else:
                x_old = np.linspace(0, 1, len(valid_vals))
                x_new = np.linspace(0, 1, points_per_syl)
                syllable_contours.append(np.interp(x_new, x_old, valid_vals).astype(np.float32))
        return syllable_contours

    # Otherwise (e.g. continuous legato voicing with fewer islands than syllables),
    # split based on unvoiced gaps or pitch valleys nearest nominal boundaries
    total_len = end_idx - start_idx + 1
    split_indices = []
    
    for b in range(1, num_syllables):
        nominal = int(start_idx + b * (total_len / float(num_syllables)))
        search_radius = max(3, int(total_len * 0.25 / float(num_syllables)))
        w_start = max(start_idx, nominal - search_radius)
        w_end = min(end_idx, nominal + search_radius)
        
        # Look for unvoiced gap in the window
        unvoiced_in_window = [idx for idx in range(w_start, w_end + 1) if not voiced[idx]]
        if unvoiced_in_window:
            best_split = unvoiced_in_window[len(unvoiced_in_window) // 2]
        else:
            # Fallback to local pitch minimum / dip in the window
            sub_window = chao[w_start:w_end + 1]
            if len(sub_window) > 0:
                best_split = w_start + int(np.argmin(sub_window))
            else:
                best_split = nominal
        split_indices.append(best_split)
        
    boundaries = [start_idx] + split_indices + [end_idx + 1]
    syllable_contours = []
    
    for i in range(num_syllables):
        s_start = boundaries[i]
        s_end = boundaries[i + 1]
        
        segment_mask = voiced[s_start:s_end]
        valid_vals = chao[s_start:s_end][segment_mask]
        
        if len(valid_vals) == 0:
            all_valid = chao[voiced]
            fallback_val = float(np.mean(all_valid)) if len(all_valid) > 0 else 3.0
            syllable_contours.append(np.full(points_per_syl, fallback_val, dtype=np.float32))
        elif len(valid_vals) == 1:
            syllable_contours.append(np.full(points_per_syl, float(valid_vals[0]), dtype=np.float32))
        else:
            x_old = np.linspace(0, 1, len(valid_vals))
            x_new = np.linspace(0, 1, points_per_syl)
            interpolated = np.interp(x_new, x_old, valid_vals).astype(np.float32)
            syllable_contours.append(interpolated)
            
    return syllable_contours
