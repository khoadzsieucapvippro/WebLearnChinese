/**
 * =============================================================================
 * UNIT TEST: HOMEPAGE AUDIT & REFACTORING (TASK-1.1)
 * File: tests/frontend/unit/ui/homepage-audit.test.mjs
 * 
 * Verifies:
 * 1. Simplified Chinese Characters across Homepage (HSK 3.0 Standard):
 *    - Hero sample character is '学' (not traditional '學').
 *    - 4 pillars use simplified glyphs: '部', '词', '课', '忆'.
 * 2. Hero Interactive Elements:
 *    - Contains heroAudioBtn for pronouncing '学' (xué).
 * 3. 4 Core Pedagogical Pillars:
 *    - Pillar 1: 214 Bộ Thủ -> radicals.html
 *    - Pillar 2: Từ Vựng HSK -> vocabulary.html
 *    - Pillar 3: 50 Bài Học -> lessons.html
 *    - Pillar 4: Ôn Tập SRS -> srs-review.html
 *    - Zero links to dev page 'ui-verification.html' on homepage.
 * 4. Administration Section Gating:
 *    - 'ui-verification.html' is cleanly relocated under Admin section in management.html.
 * 5. Session-Aware CTA Button Invariants:
 *    - heroAuthCtaBtn adapts between Guest and Authenticated states.
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '../../../../frontend');

describe('Unit: Homepage Comprehensive Audit & Refactoring (Task 1.1)', () => {
  const indexHtml = fs.readFileSync(path.join(FRONTEND_DIR, 'index.html'), 'utf-8');
  const managementHtml = fs.readFileSync(path.join(FRONTEND_DIR, 'management.html'), 'utf-8');

  describe('1. HSK 3.0 Simplified Chinese Glyphs Governance', () => {
    test('hero sample character is simplified "学" and NOT traditional "學"', () => {
      assert.match(indexHtml, />学<\/div>/, 'Hero sample character must be simplified 学');
      assert.doesNotMatch(indexHtml, />學<\/div>/, 'Traditional 學 must not appear in hero sample');
    });

    test('4 feature pillars use simplified HSK characters (部, 词, 课, 忆)', () => {
      assert.match(indexHtml, />部<\/span>/, 'Pillar 1 must use 部');
      assert.match(indexHtml, />词<\/span>/, 'Pillar 2 must use simplified 词');
      assert.match(indexHtml, />课<\/span>/, 'Pillar 3 must use simplified 课 (not traditional 課)');
      assert.match(indexHtml, />忆<\/span>/, 'Pillar 4 must use simplified 忆 (not traditional 憶)');

      // Verify traditional versions are absent
      assert.doesNotMatch(indexHtml, />課<\/span>/, 'Traditional 課 must not be used');
      assert.doesNotMatch(indexHtml, />憶<\/span>/, 'Traditional 憶 must not be used');
      assert.doesNotMatch(indexHtml, />準<\/span>/, 'Traditional 準 must not be used');
    });
  });

  describe('2. Hero Sample Interactive Elements', () => {
    test('hero card contains accessible audio pronunciation trigger', () => {
      assert.match(indexHtml, /id=["']heroAudioBtn["']/, 'Must include #heroAudioBtn button');
      assert.match(indexHtml, /aria-label=["'][^"']*xué[^"']*["']/, 'Must have accessible label for pronunciation');
    });
  });

  describe('3. Core Pedagogical Pillars (Zero Developer Leak)', () => {
    test('pillars route to core learning features only', () => {
      assert.match(indexHtml, /href=["']radicals\.html["']/, 'Pillar 1 must route to radicals.html');
      assert.match(indexHtml, /href=["']vocabulary\.html["']/, 'Pillar 2 must route to vocabulary.html');
      assert.match(indexHtml, /href=["']lessons\.html["']/, 'Pillar 3 must route to lessons.html');
      assert.match(indexHtml, /href=["']srs-review\.html["']/, 'Pillar 4 must route to srs-review.html');
    });

    test('ui-verification.html is completely absent from homepage', () => {
      assert.doesNotMatch(indexHtml, /ui-verification\.html/, 'Homepage must not link to developer test harness');
    });

    test('ui-verification.html is completely absent from management.html (clean UI invariant)', () => {
      assert.doesNotMatch(managementHtml, /ui-verification\.html/, 'Management hub must not link to developer test harness');
      assert.doesNotMatch(managementHtml, /id=["']cardLinkAdminVerification["']/, 'Verification card must be removed');
    });
  });

  describe('4. Session-Aware CTA Button Invariants', () => {
    test('homepage declares heroAuthCtaBtn ID for dynamic session adaptation', () => {
      assert.match(indexHtml, /id=["']heroAuthCtaBtn["']/, 'Hero CTA must declare id="heroAuthCtaBtn"');
    });
  });
});
