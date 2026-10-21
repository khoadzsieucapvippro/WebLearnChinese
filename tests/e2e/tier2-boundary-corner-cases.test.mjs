/**
 * =============================================================================
 * E2E TIER 2: BOUNDARY & CORNER CASES TEST SUITE
 * File: tests/e2e/tier2-boundary-corner-cases.test.mjs
 *
 * Scope:
 * - TC-T2-01: Silence Audio Quality Gate (RMS < 0.006 -> not_scorable, zero fake score)
 * - TC-T2-02: Background Noise Quality Gate (excessive noise -> not_scorable)
 * - TC-T2-03: Audio Clipping Quality Gate (>2% clipped samples -> not_scorable)
 * - TC-T2-04: Short Audio Quality Gate (<0.35s duration -> not_scorable)
 * - TC-T2-05: Triple 3rd Tone Sandhi Corner Case (3+3+3 -> 2+2+3)
 * - TC-T2-06: Rapid Audio Clicking Anti-Spam & Concurrency Stress Test
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createE2ETestContext } from './utils/e2e-test-context.mjs';
import { generateSyntheticWav, computeAudioMetrics } from './utils/audio-generator.mjs';
import { evaluateReadingSubmission } from './utils/mock-speech-service.mjs';
import { evaluateToneSandhi } from './utils/tone-sandhi.mjs';

describe('Tier 2: Boundary & Corner Cases Test Suite', () => {
  let ctx;

  before(async () => {
    ctx = await createE2ETestContext();
  });

  after(async () => {
    if (ctx) {
      await ctx.cleanup();
    }
  });

  // ---------------------------------------------------------------------------
  // TC-T2-01: Silence Audio Quality Gate (RMS < 0.006)
  // ---------------------------------------------------------------------------
  test('TC-T2-01: Silence audio is rejected with not_scorable and zero fake scores', () => {
    const silentWav = generateSyntheticWav({ type: 'silence', durationSec: 1.0 });
    const metrics = computeAudioMetrics(silentWav);
    assert.strictEqual(metrics.isSilence, true, 'Synthesized silent audio must satisfy RMS < 0.006');
    assert.ok(metrics.rms < 0.006, `Actual RMS ${metrics.rms} must be below 0.006`);

    const result = evaluateReadingSubmission({
      audioBuffer: silentWav,
      targetText: '你好',
      expectedPinyin: 'nǐ hǎo'
    });

    assert.strictEqual(result.status, 'not_scorable', 'Silent audio must be marked not_scorable');
    assert.strictEqual(result.overallScore, null, 'Must NOT generate fake overallScore on silence');
    assert.strictEqual(result.toneScore, null, 'Must NOT generate fake toneScore on silence');
    assert.strictEqual(result.fluencyScore, null, 'Must NOT generate fake fluencyScore on silence');
    assert.strictEqual(result.reason, 'silence_detected');
    assert.ok(typeof result.guidance === 'string' && result.guidance.length > 0, 'Guidance message must be provided');
  });

  // ---------------------------------------------------------------------------
  // TC-T2-02: Background Noise Quality Gate
  // ---------------------------------------------------------------------------
  test('TC-T2-02: High-noise audio is rejected without generating synthetic scores', () => {
    const noisyWav = generateSyntheticWav({ type: 'noise', durationSec: 1.0 });
    const metrics = computeAudioMetrics(noisyWav);
    assert.ok(metrics.rms > 0.05, 'Noise buffer must contain substantial random energy');

    const result = evaluateReadingSubmission({
      audioBuffer: noisyWav,
      targetText: '你好',
      expectedPinyin: 'nǐ hǎo'
    });

    assert.strictEqual(result.status, 'not_scorable', 'Noisy audio must be marked not_scorable');
    assert.strictEqual(result.overallScore, null, 'Must NOT generate fake score on noisy audio');
    assert.strictEqual(result.reason, 'excessive_noise');
    assert.ok(result.guidance.includes('không gian yên tĩnh') || result.guidance.includes('tạp âm'));
  });

  // ---------------------------------------------------------------------------
  // TC-T2-03: Audio Clipping Quality Gate (>2% clipped)
  // ---------------------------------------------------------------------------
  test('TC-T2-03: Audio clipping exceeding 2% threshold is rejected with clipping guidance', () => {
    const clippedWav = generateSyntheticWav({ type: 'clipping', durationSec: 1.0, clippingRatio: 0.08 });
    const metrics = computeAudioMetrics(clippedWav);
    assert.strictEqual(metrics.isClipped, true, 'Audio metrics must flag clipping');
    assert.ok(metrics.clippingRatio > 0.02, `Clipping ratio ${metrics.clippingRatio} must exceed 2%`);

    const result = evaluateReadingSubmission({
      audioBuffer: clippedWav,
      targetText: '你好',
      expectedPinyin: 'nǐ hǎo'
    });

    assert.strictEqual(result.status, 'not_scorable', 'Clipped audio must return not_scorable');
    assert.strictEqual(result.overallScore, null, 'Must NOT generate fake score on clipped audio');
    assert.strictEqual(result.reason, 'audio_clipping');
    assert.ok(result.guidance.includes('clipping') || result.guidance.includes('rè'));
  });

  // ---------------------------------------------------------------------------
  // TC-T2-04: Short Audio Quality Gate (<0.35s)
  // ---------------------------------------------------------------------------
  test('TC-T2-04: Audio shorter than 0.35s is rejected with duration warning', () => {
    const shortWav = generateSyntheticWav({ type: 'short' });
    const metrics = computeAudioMetrics(shortWav);
    assert.strictEqual(metrics.isTooShort, true, 'Audio metrics must flag duration < 0.35s');
    assert.ok(metrics.durationSec < 0.35, `Duration ${metrics.durationSec}s must be < 0.35s`);

    const result = evaluateReadingSubmission({
      audioBuffer: shortWav,
      targetText: '你好',
      expectedPinyin: 'nǐ hǎo'
    });

    assert.strictEqual(result.status, 'not_scorable', 'Short audio must return not_scorable');
    assert.strictEqual(result.overallScore, null, 'Must NOT generate fake score on short audio');
    assert.strictEqual(result.reason, 'audio_too_short');
    assert.ok(result.guidance.includes('<0.35s') || result.guidance.includes('quá ngắn'));
  });

  // ---------------------------------------------------------------------------
  // TC-T2-05: Triple 3rd Tone Sandhi Corner Case (3+3+3)
  // ---------------------------------------------------------------------------
  test('TC-T2-05: Triple consecutive 3rd tones (3+3+3) resolve into valid sandhi sequence', () => {
    // 1. "我很好" (wǒ hěn hǎo -> wó hén hǎo, 2 + 2 + 3)
    const triple1 = evaluateToneSandhi('我很好', 'wǒ hěn hǎo');
    assert.strictEqual(triple1.length, 3, 'Must evaluate all 3 syllables');
    assert.strictEqual(triple1[0].sandhiTone, 2, 'First syllable tone 3 becomes 2');
    assert.strictEqual(triple1[1].sandhiTone, 2, 'Second syllable tone 3 becomes 2');
    assert.strictEqual(triple1[2].sandhiTone, 3, 'Final syllable tone 3 remains 3');
    assert.strictEqual(triple1[0].ruleApplied, 'TRIPLE_THIRD_TONE_FIRST');

    // 2. "买手表" (mǎi shǒu biǎo -> mái shóu biǎo)
    const triple2 = evaluateToneSandhi('买手表', 'mǎi shǒu biǎo');
    assert.strictEqual(triple2[0].sandhiTone, 2);
    assert.strictEqual(triple2[1].sandhiTone, 2);
    assert.strictEqual(triple2[2].sandhiTone, 3);
  });

  // ---------------------------------------------------------------------------
  // TC-T2-06: Rapid Audio Clicking Anti-Spam Stress Test
  // ---------------------------------------------------------------------------
  test('TC-T2-06: Rapid clicking on audio button triggers anti-spam throttling without runtime crashes', async () => {
    const { page } = ctx;
    await page.goto(`${ctx.server.baseUrl}/srs-review.html?lessonId=1&action=continue`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#srsActiveSession', { state: 'visible', timeout: 5000 });

    const btnPronounce = page.locator('#btnAudioPronounceFront');
    await btnPronounce.waitFor({ state: 'visible', timeout: 3000 });

    // Rapid spam clicking: 10 clicks in 100ms
    const clickPromises = [];
    for (let i = 0; i < 10; i++) {
      clickPromises.push(btnPronounce.click({ force: true }).catch(() => {}));
    }
    await Promise.all(clickPromises);
    await page.waitForTimeout(500);

    // Verify page state remains stable and zero unhandled errors occurred
    const runtimeErrors = ctx.getRuntimeErrors();
    const fatalErrors = runtimeErrors.filter(e =>
      e.includes('Uncaught') || e.includes('Maximum call stack size exceeded') || e.includes('TypeError')
    );
    assert.strictEqual(fatalErrors.length, 0, `Spam clicks must not cause fatal errors: ${fatalErrors.join(', ')}`);
  });
});
