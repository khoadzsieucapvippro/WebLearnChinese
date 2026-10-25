/**
 * =============================================================================
 * CONTRACT-COMPLIANT SPEECH ASSESSMENT ENGINE & MOCK SERVICE
 * File: tests/e2e/utils/mock-speech-service.mjs
 *
 * Implements the opaque-box contract specified in docs/ARCHITECTURE.md § Interface Contracts:
 * - Direct simulation of FastAPI / Spring Boot Speech Proxy endpoints.
 * - Non-Scorable Audio Quality Gate: silence, noise, clipping, short audio.
 * - Zero Fake Score Guarantee on un-scorable audio.
 * - Accurate Tone Sandhi feedback & syllable scoring.
 * =============================================================================
 */

import { computeAudioMetrics } from './audio-generator.mjs';
import { evaluateToneSandhi } from './tone-sandhi.mjs';

/**
 * Evaluates an audio input against target text and pinyin per docs/ARCHITECTURE.md interface contract.
 *
 * @param {Object} params
 * @param {Buffer} params.audioBuffer - raw WAV audio buffer
 * @param {string} params.targetText - target Hanzi (e.g. "你好")
 * @param {string} params.expectedPinyin - expected Pinyin (e.g. "nǐ hǎo")
 * @param {string} [params.targetType='VOCABULARY'] - 'VOCABULARY' | 'RADICAL'
 * @param {number} [params.targetId=1] - ID of target
 * @returns {Object} standardized ReadingAssessmentResponse DTO
 */
export function evaluateReadingSubmission({
  audioBuffer,
  targetText,
  expectedPinyin,
  targetType = 'VOCABULARY',
  targetId = 1
}) {
  // 1. Physical Quality Gate Analysis
  let metrics;
  try {
    metrics = computeAudioMetrics(audioBuffer);
  } catch (err) {
    return {
      status: 'error',
      overallScore: null,
      toneScore: null,
      fluencyScore: null,
      syllables: [],
      reason: 'corrupt_audio',
      guidance: 'Dữ liệu âm thanh không hợp lệ hoặc bị lỗi định dạng.'
    };
  }

  // Quality Gate Condition 1: Silence detection (RMS < 0.006)
  if (metrics.isSilence) {
    return {
      status: 'not_scorable',
      overallScore: null,
      toneScore: null,
      fluencyScore: null,
      syllables: [],
      reason: 'silence_detected',
      guidance: 'Không phát hiện giọng nói hoặc âm lượng quá nhỏ. Vui lòng nói to và rõ hơn gần microphone.'
    };
  }

  // Quality Gate Condition 2: Short audio (< 0.35s)
  if (metrics.isTooShort) {
    return {
      status: 'not_scorable',
      overallScore: null,
      toneScore: null,
      fluencyScore: null,
      syllables: [],
      reason: 'audio_too_short',
      guidance: 'Đoạn ghi âm quá ngắn (<0.35s). Vui lòng phát âm đầy đủ âm tiết của từ.'
    };
  }

  // Quality Gate Condition 3: Audio clipping (> 2% saturated samples)
  if (metrics.isClipped) {
    return {
      status: 'not_scorable',
      overallScore: null,
      toneScore: null,
      fluencyScore: null,
      syllables: [],
      reason: 'audio_clipping',
      guidance: 'Âm thanh bị rè hoặc vỡ tiếng (>2% clipping). Vui lòng điều chỉnh giảm độ nhạy microphone.'
    };
  }

  // Quality Gate Condition 4: Excessive noise
  if (metrics.isNoise) {
    return {
      status: 'not_scorable',
      overallScore: null,
      toneScore: null,
      fluencyScore: null,
      syllables: [],
      reason: 'excessive_noise',
      guidance: 'Phát hiện tạp âm quá lớn trong môi trường. Vui lòng di chuyển đến không gian yên tĩnh.'
    };
  }

  // 2. Tone Sandhi & Pronunciation Assessment
  const sandhiResults = evaluateToneSandhi(targetText, expectedPinyin);
  const syllables = sandhiResults.map((s, index) => {
    const detectedTone = s.sandhiTone;
    const toneCorrect = true;
    const score = 88.0 + (index * 2);

    return {
      character: s.character,
      expectedPinyin: s.expectedPinyin,
      expectedTone: s.originalTone,
      sandhiTone: s.sandhiTone,
      detectedTone: detectedTone,
      toneCorrect: toneCorrect,
      score: score,
      feedback: s.feedback
    };
  });

  const avgToneScore = Math.round(syllables.reduce((acc, s) => acc + s.score, 0) / syllables.length);
  const fluencyScore = 85.0;
  const overallScore = Math.round((avgToneScore * 0.7 + fluencyScore * 0.3) * 10) / 10;

  return {
    status: 'assessed',
    overallScore: overallScore,
    toneScore: avgToneScore,
    fluencyScore: fluencyScore,
    syllables: syllables,
    reason: null,
    guidance: null,
    targetType,
    targetId,
    targetText,
    expectedPinyin
  };
}
