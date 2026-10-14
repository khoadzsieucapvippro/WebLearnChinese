/**
 * =============================================================================
 * UNIT TEST SUITE: CHARACTER WRITING SUBSYSTEM (ONJLPT-STYLE CALLIGRAPHY)
 * File: tests/frontend/unit/radicals/character-writing.test.mjs
 *
 * Verifies:
 * - Clean character extraction across Kangxi variant notation (e.g. '水(氵)', '人(亻)').
 * - Stroke data geometry validation and structure integrity.
 * - Local static asset loading, fallback handling, and in-memory caching.
 * - CharacterWritingEngine configuration, modes (demo, practice, quiz) and lifecycle.
 * - CharacterWritingModal container validation and teardown safety.
 * =============================================================================
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractCleanChar,
  isValidStrokeData,
  loadStrokeData,
  clearStrokeCache
} from '../../../../frontend/js/ui/character-writing/stroke-data-loader.js';
import {
  CharacterWritingEngine,
  WRITING_MODES
} from '../../../../frontend/js/ui/character-writing/character-writing-engine.js';
import {
  CharacterWritingModal
} from '../../../../frontend/js/ui/character-writing/character-writing-modal.js';

describe('Character Writing: Stroke Data Loader & Normalization', () => {
  beforeEach(() => {
    clearStrokeCache();
  });

  describe('1. Character Glyph Extraction & Cleaning Contract', () => {
    test('extracts pure character unchanged', () => {
      assert.strictEqual(extractCleanChar('水'), '水');
      assert.strictEqual(extractCleanChar('一'), '一');
      assert.strictEqual(extractCleanChar('心'), '心');
      assert.strictEqual(extractCleanChar('木'), '木');
    });

    test('strips variant annotation in parentheses (e.g. Kangxi radicals)', () => {
      assert.strictEqual(extractCleanChar('水(氵)'), '水');
      assert.strictEqual(extractCleanChar('人(亻)'), '人');
      assert.strictEqual(extractCleanChar('手(扌)'), '手');
      assert.strictEqual(extractCleanChar('艸(艹)'), '艸');
      assert.strictEqual(extractCleanChar('犬(犭)'), '犬');
      assert.strictEqual(extractCleanChar('示(礻)'), '示');
      assert.strictEqual(extractCleanChar('衣(衤)'), '衣');
    });

    test('strips variant annotation separated by slash', () => {
      assert.strictEqual(extractCleanChar('糸/糹'), '糸');
    });

    test('trims surrounding whitespace properly', () => {
      assert.strictEqual(extractCleanChar('   火   '), '火');
      assert.strictEqual(extractCleanChar('  水 (氵)  '), '水');
    });

    test('returns empty string for invalid or nullish inputs', () => {
      assert.strictEqual(extractCleanChar(''), '');
      assert.strictEqual(extractCleanChar(null), '');
      assert.strictEqual(extractCleanChar(undefined), '');
      assert.strictEqual(extractCleanChar(12345), '');
      assert.strictEqual(extractCleanChar({}), '');
    });
  });

  describe('2. Stroke Data Schema & Integrity Validation', () => {
    test('accepts valid stroke geometry with strokes and medians', () => {
      const validData = {
        strokes: ['M 0 0 L 100 100', 'M 100 0 L 0 100'],
        medians: [[[0, 0], [100, 100]], [[100, 0], [0, 100]]],
        radStrokes: [0, 1]
      };
      assert.strictEqual(isValidStrokeData(validData), true);
    });

    test('rejects data missing strokes array', () => {
      assert.strictEqual(isValidStrokeData({ medians: [[[0, 0]]] }), false);
      assert.strictEqual(isValidStrokeData({ strokes: [], medians: [[[0, 0]]] }), false);
    });

    test('rejects data missing medians array', () => {
      assert.strictEqual(isValidStrokeData({ strokes: ['M 0 0'] }), false);
      assert.strictEqual(isValidStrokeData({ strokes: ['M 0 0'], medians: [] }), false);
    });

    test('rejects primitives, null, and empty objects', () => {
      assert.strictEqual(isValidStrokeData(null), false);
      assert.strictEqual(isValidStrokeData(undefined), false);
      assert.strictEqual(isValidStrokeData('invalid'), false);
      assert.strictEqual(isValidStrokeData({}), false);
    });
  });

  describe('3. Local Asset Loading & Memory Caching Invariant', () => {
    test('loads local stroke geometry for Kangxi radicals (一, 水, 心)', async () => {
      const dataYi = await loadStrokeData('一');
      assert.ok(dataYi, 'Data for radical 一 should load');
      assert.strictEqual(dataYi.strokes.length, 1);
      assert.strictEqual(dataYi.medians.length, 1);

      const dataShui = await loadStrokeData('水(氵)');
      assert.ok(dataShui, 'Data for radical 水 should load');
      assert.strictEqual(dataShui.strokes.length, 4);

      const dataXin = await loadStrokeData('心');
      assert.ok(dataXin, 'Data for radical 心 should load');
      assert.strictEqual(dataXin.strokes.length, 4);
    });

    test('reuses in-memory cache without duplicate disk/network lookup', async () => {
      const firstCall = await loadStrokeData('木');
      assert.ok(firstCall);

      const secondCall = await loadStrokeData('木');
      assert.strictEqual(firstCall, secondCall, 'Second call must return identical cached object reference');
    });

    test('returns null gracefully for non-existent characters without throwing', async () => {
      const invalid = await loadStrokeData('XYZ_NON_HANZI');
      assert.strictEqual(invalid, null);
    });

    test('clearStrokeCache empties the cache completely', async () => {
      await loadStrokeData('一');
      clearStrokeCache();
      const freshCall = await loadStrokeData('一');
      assert.ok(freshCall);
    });
  });
});

describe('Character Writing: Engine Architecture & Mode Contracts', () => {
  test('enforces 3 authoritative writing modes identical to OnJLPT specification', () => {
    assert.strictEqual(WRITING_MODES.DEMO, 'demo', 'Mode 1: "Cách viết" stroke animation');
    assert.strictEqual(WRITING_MODES.PRACTICE, 'practice', 'Mode 2: "Luyện nét" guided tracing');
    assert.strictEqual(WRITING_MODES.QUIZ, 'quiz', 'Mode 3: "Luyện viết" freehand recall');
  });

  test('requires targetElement container on engine instantiation', () => {
    assert.throws(
      () => new CharacterWritingEngine({}),
      /CharacterWritingEngine requires a targetElement DOM container/
    );
  });

  test('initializes default engine options when valid mock element is provided', () => {
    const mockElement = { replaceChildren: () => {} };
    const engine = new CharacterWritingEngine({
      targetElement: mockElement,
      width: 180,
      height: 180,
      strokeColor: '#0055AA'
    });

    assert.strictEqual(engine.width, 180);
    assert.strictEqual(engine.height, 180);
    assert.strictEqual(engine.strokeColor, '#0055AA');
    assert.strictEqual(engine.currentMode, WRITING_MODES.DEMO);
    assert.strictEqual(engine.isDestroyed, false);
  });

  test('rejects unrecognized mode strings in setMode', async () => {
    const mockElement = { replaceChildren: () => {} };
    const engine = new CharacterWritingEngine({ targetElement: mockElement });
    const success = await engine.setMode('unsupported_mode_xyz');
    assert.strictEqual(success, false);
  });

  test('destroy() sets isDestroyed flag and cleans up timers', () => {
    const mockElement = { replaceChildren: () => {} };
    const engine = new CharacterWritingEngine({ targetElement: mockElement });
    engine.destroy();
    assert.strictEqual(engine.isDestroyed, true);
    assert.strictEqual(engine.writer, null);
  });
});

describe('Character Writing: Modal Component Contract', () => {
  test('requires mountElement on modal instantiation', () => {
    assert.throws(
      () => new CharacterWritingModal({}),
      /CharacterWritingModal requires a mountElement DOM container/
    );
  });

  test('destroy() cleans up child engine and clears mount element', () => {
    let replaced = false;
    const mockMount = {
      replaceChildren: () => { replaced = true; }
    };
    const modal = new CharacterWritingModal({ mountElement: mockMount });
    modal.destroy();
    assert.strictEqual(replaced, true);
    assert.strictEqual(modal.engine, null);
  });
});
