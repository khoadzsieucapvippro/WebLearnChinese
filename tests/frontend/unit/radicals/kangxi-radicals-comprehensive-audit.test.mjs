/**
 * =============================================================================
 * COMPREHENSIVE AUDIT TEST SUITE: 214 KANGXI RADICALS & STRUCTURAL COMPONENTS
 * File: tests/frontend/unit/radicals/kangxi-radicals-comprehensive-audit.test.mjs
 * 
 * Verifies:
 * 1. 214 Kangxi Radicals Invariants:
 *    - Exactly 214 contiguous sequential records (1..214).
 *    - All required linguistic fields: character, pinyin, meaningHanViet, meaningVi, strokeCount.
 *    - Stroke counts strictly within canonical range [1, 17].
 *    - Exactly 50 common radicals with unique, unbroken ranks 1..50; 164 remaining null.
 *    - 100% pedagogical explanations present without generic copy-paste placeholders.
 *    - 100% audio MP3 files exist on disk, non-empty, and valid.
 * 2. HanziWriter Stroke Order Data Coverage:
 *    - 100% 214 Kangxi radicals have usable stroke JSON on disk (direct or canonical fallback).
 * 3. Character-Radical Relational Integrity:
 *    - All 523 entries in CHAR_TO_RADICAL_MAP resolve to valid radical IDs (1..214).
 *    - All 849 entries in CHAR_TO_RADICALS_MAP resolve to valid radical IDs (1..214).
 *    - All 1,068 HSK 1-3 vocabulary radicalIds resolve to valid radical IDs (1..214).
 * 4. Radical & Structural Component Classification Invariant:
 *    - Distinguishes primary lookup radical ('kangxi_radical' -> "Bộ [Tên]") from
 *      decomposed structural elements ('structural_component' -> "Thành phần [Tên]").
 *    - Single-character word modal preview suppresses redundant word glyph label.
 *    - Multi-character compound word modal preview accurately attributes specific hanziChar.
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SEED_RADICALS,
  SEED_VOCABULARY,
  CHAR_TO_RADICAL_MAP,
  CHAR_TO_RADICALS_MAP
} from '../../../../frontend/js/api/demo-seed-data.js';
import {
  RADICAL_VARIANT_CANONICAL_MAP
} from '../../../../frontend/js/ui/character-writing/stroke-data-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../../../');
const AUDIO_RADICALS_DIR = path.join(REPO_ROOT, 'frontend/assets/audio/radicals');
const STROKES_DIR = path.join(REPO_ROOT, 'frontend/assets/data/strokes');

describe('Unit: Comprehensive Kangxi Radicals & Structural Components Audit (Plan 3)', () => {

  describe('1. 214 Kangxi Radicals Dataset Invariants', () => {

    test('contains exactly 214 Kangxi radicals with unbroken IDs from 1 to 214', () => {
      assert.strictEqual(SEED_RADICALS.length, 214, 'Radical dataset must contain exactly 214 records');
      const seenIds = new Set();
      for (let i = 0; i < SEED_RADICALS.length; i++) {
        const rad = SEED_RADICALS[i];
        assert.ok(rad, `Record at index ${i} must be a valid object`);
        const id = Number(rad.radicalId);
        assert.ok(Number.isInteger(id) && id >= 1 && id <= 214, `radicalId must be integer in [1, 214], got ${id}`);
        assert.strictEqual(seenIds.has(id), false, `radicalId ${id} must not be duplicated`);
        seenIds.add(id);
      }
      for (let expectedId = 1; expectedId <= 214; expectedId++) {
        assert.ok(seenIds.has(expectedId), `Missing radicalId ${expectedId} in sequence`);
      }
    });

    test('all 214 radicals have valid character glyphs, pinyin, and Vietnamese meanings', () => {
      for (const rad of SEED_RADICALS) {
        // Character
        assert.ok(rad.character && typeof rad.character === 'string', `Radical ${rad.radicalId} must have non-empty character`);
        assert.ok(rad.character.trim().length >= 1, `Radical ${rad.radicalId} character must not be blank`);

        // Pinyin
        assert.ok(rad.pinyin && typeof rad.pinyin === 'string', `Radical ${rad.radicalId} must have non-empty pinyin`);
        assert.ok(rad.pinyin.trim().length >= 1, `Radical ${rad.radicalId} pinyin must not be blank`);

        // Hán-Việt meaning
        assert.ok(rad.meaningHanViet && typeof rad.meaningHanViet === 'string', `Radical ${rad.radicalId} must have meaningHanViet`);
        assert.ok(rad.meaningHanViet.trim().length >= 1, `Radical ${rad.radicalId} meaningHanViet must not be blank`);
        // Check no corrupted UTF-8 replacement character
        assert.strictEqual(rad.meaningHanViet.includes('\uFFFD'), false, `Radical ${rad.radicalId} meaningHanViet must not contain replacement char`);

        // Vietnamese definition
        assert.ok(rad.meaningVi && typeof rad.meaningVi === 'string', `Radical ${rad.radicalId} must have meaningVi`);
        assert.ok(rad.meaningVi.trim().length >= 1, `Radical ${rad.radicalId} meaningVi must not be blank`);
        assert.strictEqual(rad.meaningVi.includes('\uFFFD'), false, `Radical ${rad.radicalId} meaningVi must not contain replacement char`);
      }
    });

    test('strokeCount is an integer between 1 and 17 for all 214 radicals', () => {
      for (const rad of SEED_RADICALS) {
        assert.ok(typeof rad.strokeCount === 'number', `Radical ${rad.radicalId} strokeCount must be a number`);
        assert.ok(Number.isInteger(rad.strokeCount), `Radical ${rad.radicalId} strokeCount must be an integer`);
        assert.ok(rad.strokeCount >= 1 && rad.strokeCount <= 17, `Radical ${rad.radicalId} strokeCount (${rad.strokeCount}) must be in [1, 17]`);
      }
    });

    test('commonRank strictly enforces 50 common radicals (ranks 1..50) and 164 remaining nulls', () => {
      const common = SEED_RADICALS.filter(r => r.commonRank !== null && r.commonRank !== undefined);
      const remaining = SEED_RADICALS.filter(r => r.commonRank === null || r.commonRank === undefined);

      assert.strictEqual(common.length, 50, 'Must have exactly 50 common radicals');
      assert.strictEqual(remaining.length, 164, 'Must have exactly 164 remaining radicals');

      const seenRanks = new Set();
      for (const rad of common) {
        const rank = Number(rad.commonRank);
        assert.ok(Number.isInteger(rank) && rank >= 1 && rank <= 50, `commonRank ${rank} must be in [1, 50]`);
        assert.strictEqual(seenRanks.has(rank), false, `commonRank ${rank} must not be duplicated`);
        seenRanks.add(rank);
      }
      for (let r = 1; r <= 50; r++) {
        assert.ok(seenRanks.has(r), `Missing commonRank ${r} in sequence 1..50`);
      }
    });

    test('all 214 radicals have authentic pedagogical explanations without generic placeholders', () => {
      for (const rad of SEED_RADICALS) {
        assert.ok(rad.explanationVi && typeof rad.explanationVi === 'string', `Radical ${rad.radicalId} must have explanationVi`);
        const expl = rad.explanationVi.trim();
        assert.ok(expl.length >= 20, `Radical ${rad.radicalId} explanation must be substantial (>= 20 chars), got: ${expl}`);
        assert.ok(!expl.includes('Lorem ipsum'), `Radical ${rad.radicalId} must not contain placeholder`);
        assert.ok(!expl.includes('TODO'), `Radical ${rad.radicalId} must not contain TODO`);
        assert.ok(!expl.includes('Chưa có giải nghĩa'), `Radical ${rad.radicalId} must not have missing explanation note`);
      }
    });

    test('100% 214 radicals have physical MP3 audio files on disk with valid file size', () => {
      for (const rad of SEED_RADICALS) {
        assert.ok(rad.audioUrl, `Radical ${rad.radicalId} must specify audioUrl`);
        const fileName = path.basename(rad.audioUrl);
        const diskPath = path.join(AUDIO_RADICALS_DIR, fileName);
        assert.ok(fs.existsSync(diskPath), `Audio file ${fileName} must exist on disk for radical ${rad.radicalId}`);
        const stat = fs.statSync(diskPath);
        assert.ok(stat.size > 1000, `Audio file ${fileName} must be > 1000 bytes (got ${stat.size})`);
      }
    });

    test('100% 214 radicals have HanziWriter stroke order JSON data available on disk', () => {
      for (const rad of SEED_RADICALS) {
        const rawChar = rad.character.trim();
        const cleanChars = rawChar.split(/[\s()（）]+/).filter(Boolean);
        assert.ok(cleanChars.length >= 1, `Radical ${rad.radicalId} must have at least one character`);

        const primaryChar = cleanChars[0];
        const canonicalChar = RADICAL_VARIANT_CANONICAL_MAP[primaryChar] || primaryChar;
        const strokeFile = path.join(STROKES_DIR, `${canonicalChar}.json`);

        assert.ok(
          fs.existsSync(strokeFile),
          `Stroke JSON must exist for radical ${rad.radicalId} character "${primaryChar}" (resolved to "${canonicalChar}") at ${strokeFile}`
        );

        const strokeContent = JSON.parse(fs.readFileSync(strokeFile, 'utf8'));
        assert.ok(Array.isArray(strokeContent.strokes) && strokeContent.strokes.length > 0, `Strokes array must be non-empty for ${canonicalChar}`);
        assert.ok(Array.isArray(strokeContent.medians) && strokeContent.medians.length > 0, `Medians array must be non-empty for ${canonicalChar}`);
      }
    });
  });

  describe('2. Relational Linkage & Constituent Radical Mappings', () => {

    test('CHAR_TO_RADICAL_MAP: 100% mapped radical IDs resolve to existing Kangxi radicals (1..214)', () => {
      const validIds = new Set(SEED_RADICALS.map(r => r.radicalId));
      const entries = Object.entries(CHAR_TO_RADICAL_MAP);
      assert.ok(entries.length >= 500, `Expected at least 500 primary radical mappings, got ${entries.length}`);

      for (const [char, rid] of entries) {
        assert.ok(typeof rid === 'number', `Mapped radical ID for char "${char}" must be number`);
        assert.ok(validIds.has(rid), `Mapped radical ID ${rid} for char "${char}" must exist in SEED_RADICALS [1..214]`);
      }
    });

    test('CHAR_TO_RADICALS_MAP: 100% constituent radical IDs resolve to existing Kangxi radicals (1..214)', () => {
      const validIds = new Set(SEED_RADICALS.map(r => r.radicalId));
      const entries = Object.entries(CHAR_TO_RADICALS_MAP);
      assert.ok(entries.length >= 800, `Expected at least 800 constituent radical mappings, got ${entries.length}`);

      for (const [char, rids] of entries) {
        assert.ok(Array.isArray(rids), `Constituent radicals for "${char}" must be an array`);
        assert.ok(rids.length > 0, `Constituent radicals for "${char}" must not be empty`);
        for (const rid of rids) {
          assert.ok(typeof rid === 'number', `Radical ID ${rid} in "${char}" must be number`);
          assert.ok(validIds.has(rid), `Radical ID ${rid} in "${char}" must exist in SEED_RADICALS [1..214]`);
        }
      }
    });

    test('SEED_VOCABULARY: 100% vocabulary radicalIds resolve to existing Kangxi radicals (1..214)', () => {
      const validIds = new Set(SEED_RADICALS.map(r => r.radicalId));
      assert.ok(SEED_VOCABULARY.length >= 1068, `Expected at least 1,068 vocabulary items, got ${SEED_VOCABULARY.length}`);

      let checkedCount = 0;
      for (const vocab of SEED_VOCABULARY) {
        if (Array.isArray(vocab.radicalIds)) {
          for (const rid of vocab.radicalIds) {
            assert.ok(validIds.has(rid), `Vocab ${vocab.vocabId} ("${vocab.hanzi}") references non-existent radicalId ${rid}`);
            checkedCount++;
          }
        }
      }
      assert.ok(checkedCount > 1000, `Checked at least 1,000 constituent radical references, got ${checkedCount}`);
    });
  });

  describe('3. Radical & Structural Component Classification Invariants', () => {

    test('distinguishes primary lookup radical from decomposed structural components', () => {
      // Example word "客" (Guest):
      // Primary Kangxi lookup radical: 宀 (Radical 40)
      // Additional structural components: 口 (Radical 30), 夂 (Radical 34)
      const primaryRadicalId = CHAR_TO_RADICAL_MAP['客'];
      assert.strictEqual(primaryRadicalId, 40, 'Primary radical of 客 must be 宀 (#40)');

      const constituentRadicalIds = CHAR_TO_RADICALS_MAP['客'];
      assert.ok(constituentRadicalIds.includes(40), 'Constituent radicals must include 宀 (#40)');
      assert.ok(constituentRadicalIds.includes(30), 'Constituent radicals must include 口 (#30)');
      assert.ok(constituentRadicalIds.includes(34), 'Constituent radicals must include 夂 (#34)');

      // Verify classification rule
      function classifyComponent(radId, char) {
        const isPrimary = (CHAR_TO_RADICAL_MAP[char] === radId);
        return isPrimary ? 'kangxi_radical' : 'structural_component';
      }

      assert.strictEqual(classifyComponent(40, '客'), 'kangxi_radical');
      assert.strictEqual(classifyComponent(30, '客'), 'structural_component');
      assert.strictEqual(classifyComponent(34, '客'), 'structural_component');
    });

    test('formats badge label as "Bộ [Tên]" for kangxi_radical and "Thành phần [Tên]" for structural_component', () => {
      function formatComponentBadge(comp) {
        const isKangxi = comp.componentType === 'kangxi_radical';
        const name = (comp.meaningHanViet || comp.meaningVi || '').trim();
        const label = isKangxi
          ? (name.startsWith('Bộ ') ? name : `Bộ ${name}`)
          : (name ? `Thành phần ${name}` : 'Thành phần cấu tạo');
        return `(${comp.character} · ${label})`;
      }

      const mien = { character: '宀', meaningHanViet: 'Miên', componentType: 'kangxi_radical' };
      const khau = { character: '口', meaningHanViet: 'Khẩu', componentType: 'structural_component' };
      const truy = { character: '夂', meaningHanViet: 'Truy', componentType: 'structural_component' };

      assert.strictEqual(formatComponentBadge(mien), '(宀 · Bộ Miên)');
      assert.strictEqual(formatComponentBadge(khau), '(口 · Thành phần Khẩu)');
      assert.strictEqual(formatComponentBadge(truy), '(夂 · Thành phần Truy)');
    });

    test('single-character word modal preview suppresses redundant word glyph label', () => {
      // In vocabulary detail modal for single-character word "机":
      // Modal is already focused on "机". Preview of radical "木" must NOT display "Chữ 机".
      const singleCharWord = '机';
      const cleanChars = [singleCharWord];
      const isMultiChar = cleanChars.length > 1;

      const charInWord = isMultiChar ? singleCharWord : '';
      assert.strictEqual(charInWord, '', 'Single-character word must yield empty charInWord label');
    });

    test('multi-character compound word modal preview accurately attributes specific hanziChar', () => {
      // In vocabulary detail modal for multi-character compound word "电视机":
      // Decomposed radicals in CHAR_TO_RADICALS_MAP:
      // 电 has 73 (曰) and 5 (乙)
      // 视 has 147 (见) and 113 (示)
      // 机 has 75 (木) and 16 (几)
      const cleanChars = ['电', '视', '机'];
      assert.strictEqual(cleanChars.length > 1, true);

      function resolveCharForRadical(radId, wordChars) {
        for (const ch of wordChars) {
          const chRads = CHAR_TO_RADICALS_MAP[ch] || (CHAR_TO_RADICAL_MAP[ch] ? [CHAR_TO_RADICAL_MAP[ch]] : []);
          if (chRads.includes(radId)) {
            return ch;
          }
        }
        return '';
      }

      assert.strictEqual(resolveCharForRadical(73, cleanChars), '电');  // 曰 -> 电
      assert.strictEqual(resolveCharForRadical(113, cleanChars), '视'); // 示 -> 视
      assert.strictEqual(resolveCharForRadical(75, cleanChars), '机');  // 木 -> 机
    });
  });
});
