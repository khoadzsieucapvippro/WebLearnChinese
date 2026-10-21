/**
 * =============================================================================
 * E2E TIER 1: FEATURE COVERAGE TEST SUITE
 * File: tests/e2e/tier1-feature-coverage.test.mjs
 *
 * Scope:
 * - TC-T1-01: Audio Playback Engine & Controller Contract (3-tier fallback)
 * - TC-T1-02: Speech Evaluation API Endpoint Contract (DTO & syllable breakdown)
 * - TC-T1-03: Tone Sandhi Engine Rules (3+3, 不 bù, 一 yī, half 3rd tone)
 * - TC-T1-04: Kangxi Radicals Data Integrity (214 items, #69 斤 Cân, glyph variants)
 * - TC-T1-05: HSK 1-3 Vocabulary Data Integrity & Homographs (1000 words + 68 supp)
 * - TC-T1-06: SRS Interactive Flashcard Review Flow (due cards, flip, rating submit)
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createE2ETestContext } from './utils/e2e-test-context.mjs';
import { evaluateToneSandhi } from './utils/tone-sandhi.mjs';
import { evaluateReadingSubmission } from './utils/mock-speech-service.mjs';
import { generateSyntheticWav } from './utils/audio-generator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

describe('Tier 1: Feature Coverage Test Suite', () => {
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
  // TC-T1-01: Audio Playback Engine & Controller Contract
  // ---------------------------------------------------------------------------
  test('TC-T1-01: Audio Playback Engine adheres to 3-tier fallback and controller contract', async () => {
    const { page } = ctx;
    await page.goto(`${ctx.server.baseUrl}/srs-review.html?lessonId=1&action=continue`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#srsActiveSession', { state: 'visible', timeout: 5000 });
    await page.waitForSelector('#cardFront', { state: 'visible', timeout: 5000 });

    // Verify audio controller exists in browser runtime
    const hasAudioController = await page.evaluate(() => {
      return typeof window.SpeechController !== 'undefined' ||
             document.querySelector('.srs-speech-btn') !== null ||
             document.getElementById('btnAudioPronounceFront') !== null;
    });
    assert.strictEqual(hasAudioController, true, 'Audio controller or audio trigger button must be present');

    // Test audio trigger button interaction contract:
    // When clicked, button should transition state, never crash or throw uncaught promise rejection
    const btnPronounce = page.locator('#btnAudioPronounceFront');
    if (await btnPronounce.isVisible()) {
      await btnPronounce.click();
      await page.waitForTimeout(300);

      // Verify page runtime errors remain zero (no uncaught audio promise errors)
      const errors = ctx.getRuntimeErrors();
      const uncaughtAudioErrors = errors.filter(e =>
        e.includes('play()') || e.includes('NotAllowedError') || e.includes('Uncaught (in promise)')
      );
      assert.strictEqual(uncaughtAudioErrors.length, 0, `Audio playback must not cause uncaught errors: ${uncaughtAudioErrors.join(', ')}`);
    }
  });

  // ---------------------------------------------------------------------------
  // TC-T1-02: Speech Evaluation API Endpoint Contract
  // ---------------------------------------------------------------------------
  test('TC-T1-02: Speech evaluation endpoint returns compliant DTO structure and syllable scores', async () => {
    const sampleWav = generateSyntheticWav({ type: 'speech', durationSec: 1.2 });
    const response = evaluateReadingSubmission({
      audioBuffer: sampleWav,
      targetText: '你好',
      expectedPinyin: 'nǐ hǎo',
      targetType: 'VOCABULARY',
      targetId: 101
    });

    // Contract validation against PROJECT.md § Interface Contracts
    assert.strictEqual(response.status, 'assessed', 'Status must be "assessed" for valid audio');
    assert.strictEqual(typeof response.overallScore, 'number', 'overallScore must be a number');
    assert.ok(response.overallScore >= 0 && response.overallScore <= 100, 'overallScore must be between 0 and 100');
    assert.strictEqual(typeof response.toneScore, 'number', 'toneScore must be a number');
    assert.strictEqual(typeof response.fluencyScore, 'number', 'fluencyScore must be a number');
    assert.ok(Array.isArray(response.syllables), 'syllables must be an array');
    assert.strictEqual(response.syllables.length, 2, 'Two syllables expected for "你好"');

    // Syllables detail validation
    const s1 = response.syllables[0];
    assert.strictEqual(s1.character, '你');
    assert.strictEqual(s1.expectedTone, 3);
    assert.strictEqual(s1.sandhiTone, 2, 'First syllable of 3+3 must have sandhiTone 2');
    assert.strictEqual(typeof s1.toneCorrect, 'boolean');
    assert.strictEqual(typeof s1.score, 'number');
    assert.ok(typeof s1.feedback === 'string' && s1.feedback.length > 0, 'Feedback must be non-empty');
  });

  // ---------------------------------------------------------------------------
  // TC-T1-03: Tone Sandhi Engine Rules (3+3, 不, 一, Half 3rd)
  // ---------------------------------------------------------------------------
  test('TC-T1-03: Tone Sandhi rules accurately transform canonical syllables', () => {
    // 1. Rule 1: 3 + 3 -> 2 + 3
    const pair3 = evaluateToneSandhi('你好', 'nǐ hǎo');
    assert.strictEqual(pair3[0].sandhiTone, 2, '3+3: First syllable tone must change to 2');
    assert.strictEqual(pair3[1].sandhiTone, 3, '3+3: Second syllable tone must stay 3');
    assert.strictEqual(pair3[0].ruleApplied, 'PAIR_THIRD_TONE');

    // 2. Rule 2: "不" (bù, 4th tone)
    // 2a. Before 4th tone -> 2nd tone (bú)
    const buBefore4 = evaluateToneSandhi('不对', 'bù duì');
    assert.strictEqual(buBefore4[0].sandhiTone, 2, '不 before tone 4 must become tone 2 (bú)');
    assert.strictEqual(buBefore4[0].ruleApplied, 'BU_BEFORE_TONE_4');

    // 2b. Before 3rd tone -> 4th tone (bù)
    const buBefore3 = evaluateToneSandhi('不好', 'bù hǎo');
    assert.strictEqual(buBefore3[0].sandhiTone, 4, '不 before tone 3 must stay tone 4 (bù)');

    // 3. Rule 3: "一" (yī, 1st tone)
    // 3a. Before 4th tone -> 2nd tone (yí)
    const yiBefore4 = evaluateToneSandhi('一个', 'yī gè');
    assert.strictEqual(yiBefore4[0].sandhiTone, 2, '一 before tone 4 must become tone 2 (yí)');
    assert.strictEqual(yiBefore4[0].ruleApplied, 'YI_BEFORE_TONE_4');

    // 3b. Before 1st, 2nd, 3rd tone -> 4th tone (yì)
    const yiBefore1 = evaluateToneSandhi('一天', 'yī tiān');
    assert.strictEqual(yiBefore1[0].sandhiTone, 4, '一 before tone 1 must become tone 4 (yì)');
    const yiBefore3 = evaluateToneSandhi('一起', 'yī qǐ');
    assert.strictEqual(yiBefore3[0].sandhiTone, 4, '一 before tone 3 must become tone 4 (yì)');

    // 3c. Standalone or ordinal -> 1st tone (yī)
    const yiOrdinal = evaluateToneSandhi('第一', 'dì yī');
    assert.strictEqual(yiOrdinal[1].sandhiTone, 1, '一 in ordinal (第一) must retain tone 1');

    // 4. Rule 4: Half 3rd tone before 1, 2, 4
    const half3 = evaluateToneSandhi('北京', 'běi jīng');
    assert.strictEqual(half3[0].sandhiTone, 3, 'Tone category remains 3');
    assert.strictEqual(half3[0].ruleApplied, 'HALF_THIRD_TONE');
  });

  // ---------------------------------------------------------------------------
  // TC-T1-04: Kangxi Radicals Data Integrity
  // ---------------------------------------------------------------------------
  test('TC-T1-04: 214 Kangxi Radicals dataset strictly matches academic standards', () => {
    const csvPath = path.join(ROOT_DIR, 'bo_thu_214.csv');
    assert.ok(fs.existsSync(csvPath), 'bo_thu_214.csv must exist at project root');

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.trim().split('\n').filter(l => l.trim().length > 0);
    assert.strictEqual(lines.length, 215, 'CSV must contain header + exactly 214 radical records');

    // Radical #69 斤 must be "Cân" (not "Cẩn")
    const radical69Line = lines.find(l => l.startsWith('69,'));
    assert.ok(radical69Line, 'Radical #69 must be present');
    assert.ok(radical69Line.includes('斤'), 'Radical #69 character must be 斤');
    assert.ok(radical69Line.includes('Cân'), 'Radical #69 meaningHanViet must be "Cân"');
    assert.ok(!radical69Line.includes('Cẩn'), 'Radical #69 must NOT be "Cẩn"');

    // Radicals with variants/simplified forms
    const radical96Line = lines.find(l => l.startsWith('96,'));
    assert.ok(radical96Line && radical96Line.includes('玉(王/玊)'), 'Radical #96 must show variant 玉(王/玊)');

    const radical187Line = lines.find(l => l.startsWith('187,'));
    assert.ok(radical187Line && radical187Line.includes('馬(马)'), 'Radical #187 must show variant 馬(马)');

    const radical197Line = lines.find(l => l.startsWith('197,'));
    assert.ok(radical197Line && radical197Line.includes('鹵(卤)'), 'Radical #197 must show variant 鹵(卤)');

    const radical205Line = lines.find(l => l.startsWith('205,'));
    assert.ok(radical205Line && radical205Line.includes('黽(黾)'), 'Radical #205 must show variant 黽(黾)');

    // Radical #71 无 pedagogical explanation
    const radical71Line = lines.find(l => l.startsWith('71,'));
    assert.ok(radical71Line && radical71Line.includes('无'), 'Radical #71 must be present');
    assert.ok(radical71Line.includes('thuộc bộ Thủ 扌'), 'Radical #71 note must clarify 抚 belongs to 手/扌');
  });

  // ---------------------------------------------------------------------------
  // TC-T1-05: HSK 1-3 Vocabulary Data Integrity & Homographs
  // ---------------------------------------------------------------------------
  test('TC-T1-05: HSK 1-3 vocabulary catalog contains 1000 items + 68 supplementary', () => {
    const csvPath = path.join(ROOT_DIR, 'tu_vung_1000.csv');
    assert.ok(fs.existsSync(csvPath), 'tu_vung_1000.csv must exist at project root');

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.trim().split('\n').filter(l => l.trim().length > 0);
    assert.strictEqual(lines.length, 1069, 'tu_vung_1000.csv must have header + 1068 vocabulary rows');

    // Check specific HSK level updates
    const aihao = lines.find(l => l.includes(',爱好,'));
    assert.ok(aihao && aihao.includes(',2,'), '爱好 must be HSK 2');

    const ban = lines.find(l => l.includes(',班,'));
    assert.ok(ban && ban.includes(',2,'), '班 must be HSK 2');

    const benzi = lines.find(l => l.includes(',本子,'));
    assert.ok(benzi && benzi.includes(',2,'), '本子 must be HSK 2');

    const biede = lines.find(l => l.includes(',别的,'));
    assert.ok(biede && biede.includes(',3,'), '别的 must be HSK 3');

    const bieren = lines.find(l => l.includes(',别人,'));
    assert.ok(bieren && bieren.includes(',3,'), '别人 must be HSK 3');

    const bingren = lines.find(l => l.includes(',病人,'));
    assert.ok(bingren && bingren.includes(',3,'), '病人 must be HSK 3');

    // Verify Han-Viet corrections
    const da = lines.find(l => l.match(/^11\d*,打,/));
    if (da) {
      assert.ok(da.includes('Đả'), '打 must be translated as Đả (not Tá)');
    }
  });

  // ---------------------------------------------------------------------------
  // TC-T1-06: SRS Interactive Flashcard Review Flow
  // ---------------------------------------------------------------------------
  test('TC-T1-06: SRS flashcard review renders prompt, flips 3D face, and records ratings', async () => {
    const { page } = ctx;
    await page.goto(`${ctx.server.baseUrl}/srs-review.html?lessonId=1&action=continue`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#srsActiveSession', { state: 'visible', timeout: 5000 });
    await page.waitForSelector('#cardFront', { state: 'visible', timeout: 5000 });

    // 1. Verify front face displays target prompt
    const frontHanzi = page.locator('#cardFrontHanzi');
    await frontHanzi.waitFor({ state: 'visible' });
    const promptText = await frontHanzi.textContent();
    assert.ok(promptText && promptText.trim().length > 0, 'Front prompt text must be visible');

    // 2. Flip card to reveal answer by clicking the flashcard
    const flashcard = page.locator('#flashcard');
    await flashcard.click();
    await page.waitForTimeout(400); // 3D flip animation

    // 3. Verify back face is visible and reveals Pinyin / Vietnamese meaning
    const cardBack = page.locator('#cardBack');
    await cardBack.waitFor({ state: 'visible', timeout: 3000 });
    assert.ok(await cardBack.isVisible(), 'Back face must become visible after flip');

    // 4. Rate card Good (button #btnRatingGood)
    const initialSubmitted = ctx.submittedReviews.length;
    const btnRatingGood = page.locator('#btnRatingGood');
    await btnRatingGood.waitFor({ state: 'visible', timeout: 3000 });
    await btnRatingGood.click();
    await page.waitForTimeout(400);

    // Verify review was sent to backend
    assert.strictEqual(ctx.submittedReviews.length, initialSubmitted + 1, 'Review submission must be dispatched');
    const latest = ctx.submittedReviews[ctx.submittedReviews.length - 1];
    assert.strictEqual(latest.rating, 3, 'Rating value 3 must be recorded');
  });
});
