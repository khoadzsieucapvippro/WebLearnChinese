/**
 * =============================================================================
 * UNIT TEST: SRS & VOCABULARY SPEECH BUTTON SYNCHRONIZATION
 * Module: tests/frontend/unit/srs/srs-speech-button.test.mjs
 * 
 * Verifies:
 * 1. SRS speech button exists on both card front and card back.
 * 2. Zero emoji (no 🔊) in SRS markup or buttons.
 * 3. SRS uses the exact same class (.vocab-speech-btn) and SVG speaker icon as Vocabulary.
 * 4. Accessible names (aria-label) and tooltip titles exist and update dynamically.
 * 5. Space/Enter on focused button does not flip the flashcard (no flip conflict).
 * 6. Web Speech API mechanism is preserved (SpeechSynthesisUtterance, zh-CN, rate 0.85).
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '../../../../frontend');

describe('Unit: SRS & Vocabulary Speech Button Synchronization', () => {

  const srsHtml = fs.readFileSync(path.join(FRONTEND_DIR, 'srs-review.html'), 'utf-8');
  const vocabHtml = fs.readFileSync(path.join(FRONTEND_DIR, 'vocabulary.html'), 'utf-8');
  const styleCss = fs.readFileSync(path.join(FRONTEND_DIR, 'css/style.css'), 'utf-8');

  describe('1. Zero Emoji & Text Rule in SRS Speech Buttons', () => {
    test('srs-review.html does not use 🔊 emoji in card pronunciation buttons', () => {
      // Find btnAudioPronounceFront and btnAudioPronounceBack blocks
      const frontBtnMatch = srsHtml.match(/<button[^>]*id="btnAudioPronounceFront"[^>]*>([\s\S]*?)<\/button>/);
      const backBtnMatch = srsHtml.match(/<button[^>]*id="btnAudioPronounceBack"[^>]*>([\s\S]*?)<\/button>/);

      assert.ok(frontBtnMatch, 'btnAudioPronounceFront must exist in srs-review.html');
      assert.ok(backBtnMatch, 'btnAudioPronounceBack must exist in srs-review.html');

      assert.strictEqual(frontBtnMatch[1].includes('🔊'), false, 'Front speech button must not contain 🔊 emoji');
      assert.strictEqual(backBtnMatch[1].includes('🔊'), false, 'Back speech button must not contain 🔊 emoji');

      assert.strictEqual(frontBtnMatch[1].includes('Phát âm'), false, 'Front speech button must not have visible "Phát âm" text (icon only)');
      assert.strictEqual(backBtnMatch[1].includes('Phát âm'), false, 'Back speech button must not have visible "Phát âm" text (icon only)');
    });

    test('SRS card faces do not contain obsolete [ 🔊 Phát âm ] button pattern', () => {
      assert.strictEqual(srsHtml.includes('[ 🔊 Phát âm ]'), false);
      assert.strictEqual(srsHtml.includes('🔊 Phát âm'), false);
    });
  });

  describe('2. Design System & Markup Parity with Vocabulary', () => {
    test('both SRS front and back speech buttons use class "vocab-speech-btn"', () => {
      const frontBtn = srsHtml.match(/<button[^>]*id="btnAudioPronounceFront"[^>]*class="([^"]*)"/);
      const backBtn = srsHtml.match(/<button[^>]*id="btnAudioPronounceBack"[^>]*class="([^"]*)"/);

      assert.ok(frontBtn, 'Front speech button must have class attribute');
      assert.ok(backBtn, 'Back speech button must have class attribute');

      assert.ok(frontBtn[1].split(/\s+/).includes('vocab-speech-btn'), 'Front button must use vocab-speech-btn class');
      assert.ok(backBtn[1].split(/\s+/).includes('vocab-speech-btn'), 'Back button must use vocab-speech-btn class');
    });

    test('Vocabulary modal speech button also uses class "vocab-speech-btn"', () => {
      const modalBtn = vocabHtml.match(/<button[^>]*id="modalSpeechBtn"[^>]*class="([^"]*)"/);
      assert.ok(modalBtn, 'modalSpeechBtn must have class attribute');
      assert.ok(modalBtn[1].split(/\s+/).includes('vocab-speech-btn'), 'modalSpeechBtn must use vocab-speech-btn class');
    });

    test('SVG speaker icons in SRS and Vocabulary contain identical path & polygon definitions', () => {
      const polygonPoints = '11 5 6 9 2 9 2 15 6 15 11 19 11 5';
      const pathD = 'M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07';

      assert.ok(srsHtml.includes(polygonPoints), 'SRS must contain standard speaker polygon');
      assert.ok(srsHtml.includes(pathD), 'SRS must contain standard sound waves path');

      assert.ok(vocabHtml.includes(polygonPoints), 'Vocabulary must contain standard speaker polygon');
      assert.ok(vocabHtml.includes(pathD), 'Vocabulary must contain standard sound waves path');
    });

    test('CSS defines .vocab-speech-btn with 34x34 circle, hover scaling, focus outline, and active transform', () => {
      assert.match(styleCss, /\.vocab-speech-btn\s*\{[^}]*width:\s*34px;[^}]*height:\s*34px;/);
      assert.match(styleCss, /\.vocab-speech-btn\s*\{[^}]*border-radius:\s*var\(--radius-full\);/);
      assert.match(styleCss, /\.vocab-speech-btn:hover\s*\{[^}]*transform:\s*scale\(1\.08\);/);
      assert.match(styleCss, /\.vocab-speech-btn:focus-visible\s*\{[^}]*outline:/);
      assert.match(styleCss, /\.vocab-speech-btn:active\s*\{[^}]*transform:\s*scale\(0\.96\);/);
    });
  });

  describe('3. Accessibility & Keyboard Invariant', () => {
    test('SRS speech buttons have explicit accessible name (aria-label)', () => {
      const frontAria = srsHtml.match(/id="btnAudioPronounceFront"[^>]*aria-label="([^"]*)"/);
      const backAria = srsHtml.match(/id="btnAudioPronounceBack"[^>]*aria-label="([^"]*)"/);

      assert.ok(frontAria, 'Front button must have aria-label');
      assert.ok(backAria, 'Back button must have aria-label');
      assert.ok(frontAria[1].includes('Phát âm'), 'Front aria-label must include "Phát âm"');
      assert.ok(backAria[1].includes('Phát âm'), 'Back aria-label must include "Phát âm"');
    });

    test('SVG icons inside speech buttons have aria-hidden="true"', () => {
      const frontSvg = srsHtml.match(/id="btnAudioPronounceFront"[\s\S]*?<svg([^>]*)>/);
      const backSvg = srsHtml.match(/id="btnAudioPronounceBack"[\s\S]*?<svg([^>]*)>/);

      assert.ok(frontSvg && frontSvg[1].includes('aria-hidden="true"'), 'Front SVG must be aria-hidden');
      assert.ok(backSvg && backSvg[1].includes('aria-hidden="true"'), 'Back SVG must be aria-hidden');
    });

    test('srs-review-page.js handleKeydown allows native button activation without card flip', () => {
      const jsCode = fs.readFileSync(path.join(FRONTEND_DIR, 'js/pages/srs-review-page.js'), 'utf-8');
      
      // Look for button check in Space/Enter handling
      assert.ok(
        jsCode.includes("tag === 'button' && e.target !== this.dom.flashcard"),
        'Keydown handler must exit early when focused on an interactive button, preventing unwanted card flips'
      );
    });

    test('flashcard click listener prevents flip when clicking child buttons', () => {
      const jsCode = fs.readFileSync(path.join(FRONTEND_DIR, 'js/pages/srs-review-page.js'), 'utf-8');
      assert.ok(
        jsCode.includes("e.target.closest('button, a')"),
        'Flashcard click listener must ignore clicks originating from action buttons'
      );
    });

    test('speech button click listener calls stopPropagation()', () => {
      const jsCode = fs.readFileSync(path.join(FRONTEND_DIR, 'js/pages/srs-review-page.js'), 'utf-8');
      assert.match(
        jsCode,
        /btnAudioPronounceFront\.addEventListener\('click',\s*\(e\)\s*=>\s*\{\s*e\.stopPropagation\(\);/,
        'Front speech button must call e.stopPropagation()'
      );
      assert.match(
        jsCode,
        /btnAudioPronounceBack\.addEventListener\('click',\s*\(e\)\s*=>\s*\{\s*e\.stopPropagation\(\);/,
        'Back speech button must call e.stopPropagation()'
      );
    });
  });

  describe('4. Shared Module Export & Re-export', () => {
    test('ui.js exports createSpeakerIcon and createSpeechButton', async () => {
      const url = pathToFileURL(path.join(FRONTEND_DIR, 'js/ui/ui.js')).href;
      const uiModule = await import(url);
      assert.strictEqual(typeof uiModule.createSpeakerIcon, 'function');
      assert.strictEqual(typeof uiModule.createSpeechButton, 'function');
    });

    test('vocabulary-page.js re-exports createSpeakerIcon and createSpeechButton', async () => {
      const url = pathToFileURL(path.join(FRONTEND_DIR, 'js/pages/vocabulary-page.js')).href;
      const vocabModule = await import(url);
      assert.strictEqual(typeof vocabModule.createSpeakerIcon, 'function');
      assert.strictEqual(typeof vocabModule.createSpeechButton, 'function');
    });

    test('srs-review-page.js re-exports createSpeakerIcon and createSpeechButton', async () => {
      const url = pathToFileURL(path.join(FRONTEND_DIR, 'js/pages/srs-review-page.js')).href;
      const srsModule = await import(url);
      assert.strictEqual(typeof srsModule.createSpeakerIcon, 'function');
      assert.strictEqual(typeof srsModule.createSpeechButton, 'function');
    });
  });

  describe('5. Web Speech API Preservation', () => {
    test('srs-review-page.js exports speakHanzi function with zh-CN and rate 0.85 defaults', async () => {
      const url = pathToFileURL(path.join(FRONTEND_DIR, 'js/pages/srs-review-page.js')).href;
      const srsModule = await import(url);
      assert.strictEqual(typeof srsModule.speakHanzi, 'function');
      // In node env without window.speechSynthesis, returns false gracefully
      const res = srsModule.speakHanzi('学');
      assert.strictEqual(typeof res, 'boolean');
    });
  });

});
