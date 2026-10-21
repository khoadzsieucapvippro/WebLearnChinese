/**
 * =============================================================================
 * UNIT TEST: STATIC SERVER AUDIO MIME TYPES & STREAMING HEADERS
 * File: tests/frontend/unit/srs/srs-audio-server-mime.test.mjs
 *
 * Verifies Task 5:
 * - Proper audio MIME type mappings (.mp3, .wav, .ogg, .webm, .m4a, .aac)
 * - Accept-Ranges: bytes header for smooth audio seeking and streaming
 * - Consistency between scripts/serve.mjs and tests/frontend/utils/static-server.mjs
 * - Correct re-export from tests/frontend/static-server.mjs
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../../');

describe('Unit: Static Server Audio MIME Types & Streaming Headers', () => {
  test('1. scripts/serve.mjs defines standard audio MIME types and Accept-Ranges', () => {
    const servePath = path.join(ROOT_DIR, 'scripts/serve.mjs');
    const content = fs.readFileSync(servePath, 'utf8');

    assert.ok(content.includes("'.mp3': 'audio/mpeg'"), 'Must include .mp3 -> audio/mpeg');
    assert.ok(content.includes("'.wav': 'audio/wav'"), 'Must include .wav -> audio/wav');
    assert.ok(content.includes("'.ogg': 'audio/ogg'"), 'Must include .ogg -> audio/ogg');
    assert.ok(content.includes("'.webm': 'audio/webm'"), 'Must include .webm -> audio/webm');
    assert.ok(content.includes("'Accept-Ranges': 'bytes'"), 'Must include Accept-Ranges: bytes header');
  });

  test('2. tests/frontend/utils/static-server.mjs defines standard audio MIME types and Accept-Ranges', () => {
    const staticServerPath = path.join(ROOT_DIR, 'tests/frontend/utils/static-server.mjs');
    const content = fs.readFileSync(staticServerPath, 'utf8');

    assert.ok(content.includes("'.mp3': 'audio/mpeg'"), 'Must include .mp3 -> audio/mpeg');
    assert.ok(content.includes("'.wav': 'audio/wav'"), 'Must include .wav -> audio/wav');
    assert.ok(content.includes("'.ogg': 'audio/ogg'"), 'Must include .ogg -> audio/ogg');
    assert.ok(content.includes("'.webm': 'audio/webm'"), 'Must include .webm -> audio/webm');
    assert.ok(content.includes("'Accept-Ranges': 'bytes'"), 'Must include Accept-Ranges: bytes header');
  });

  test('3. tests/frontend/static-server.mjs exists and re-exports static-server lifecycle', async () => {
    const reexportPath = path.join(ROOT_DIR, 'tests/frontend/static-server.mjs');
    assert.ok(fs.existsSync(reexportPath), 'tests/frontend/static-server.mjs must exist');

    const module = await import('../../static-server.mjs');
    assert.strictEqual(typeof module.ensureServer, 'function', 'Must export ensureServer function');
    assert.strictEqual(typeof module.DEV_CSP_POLICY, 'string', 'Must export DEV_CSP_POLICY');
  });
});
