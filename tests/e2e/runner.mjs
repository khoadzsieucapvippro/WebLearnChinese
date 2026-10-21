/**
 * =============================================================================
 * CENTRAL E2E TEST RUNNER (OPAQUE-BOX DUAL TRACK VERIFICATION)
 * File: tests/e2e/runner.mjs
 *
 * Supported Invocations:
 *   node tests/e2e/runner.mjs                     # Runs all Tiers 1-4
 *   node tests/e2e/runner.mjs --tier=1            # Runs Tier 1 (Feature Coverage)
 *   node tests/e2e/runner.mjs --tier=2            # Runs Tier 2 (Boundary & Corner Cases)
 *   node tests/e2e/runner.mjs --tier=3            # Runs Tier 3 (Cross-Feature Combinations)
 *   node tests/e2e/runner.mjs --tier=4            # Runs Tier 4 (Real-World Workloads)
 *   node tests/e2e/runner.mjs --tier=all          # Explicit all tiers
 * =============================================================================
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

const TIER_MAPPING = {
  1: {
    name: 'Tier 1: Feature Coverage',
    file: 'tests/e2e/tier1-feature-coverage.test.mjs',
    scope: 'Audio playback, Speech DTO contract, Tone sandhi rules, Radicals & HSK data, SRS review'
  },
  2: {
    name: 'Tier 2: Boundary & Corner Cases',
    file: 'tests/e2e/tier2-boundary-corner-cases.test.mjs',
    scope: 'Silence gate (RMS < 0.006), Noise, Audio clipping, Short audio (<0.35s), Sandhi 3+3+3, Rapid clicks'
  },
  3: {
    name: 'Tier 3: Cross-Feature Combinations',
    file: 'tests/e2e/tier3-cross-feature-combinations.test.mjs',
    scope: 'Card flip during audio play, Reading room shortcut locking, Listening room locking, Review failure resilience'
  },
  4: {
    name: 'Tier 4: Real-World Application Workloads',
    file: 'tests/e2e/tier4-application-workloads.test.mjs',
    scope: 'Full SRS learning lifecycle, Complete listening workflow, Complete reading workflow, Multi-skill switcher'
  }
};

/**
 * Parses command line arguments to determine target tier(s).
 * @returns {number[]} array of tier numbers [1..4]
 */
function parseTierArg() {
  const args = process.argv.slice(2);
  for (const arg of args) {
    if (arg.startsWith('--tier=')) {
      const val = arg.split('=')[1].trim().toLowerCase();
      if (val === 'all') return [1, 2, 3, 4];
      const tierNum = parseInt(val, 10);
      if ([1, 2, 3, 4].includes(tierNum)) {
        return [tierNum];
      }
    }
  }
  return [1, 2, 3, 4];
}

async function runSuiteFile(fileRelPath) {
  const fullPath = path.resolve(ROOT_DIR, fileRelPath);
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--test', fullPath], {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });

    child.on('error', (err) => {
      console.error(`Failed to execute test suite ${fileRelPath}:`, err);
      resolve(false);
    });
  });
}

async function main() {
  const selectedTiers = parseTierArg();
  console.log('\n=============================================================');
  console.log(' OFFICIAL E2E TEST RUNNER — DUAL TRACK (TIERS 1–4)');
  console.log(' Platform: Node.js test runner & Playwright');
  console.log(` Selected Tiers: ${selectedTiers.join(', ')}`);
  console.log('=============================================================\n');

  const startTime = performance.now();
  const results = [];

  for (const tierNum of selectedTiers) {
    const tierMeta = TIER_MAPPING[tierNum];
    console.log(`\n>>> Executing ${tierMeta.name} ...`);
    console.log(`    Scope: ${tierMeta.scope}`);
    console.log(`    File:  ${tierMeta.file}\n`);

    const tierStart = performance.now();
    const passed = await runSuiteFile(tierMeta.file);
    const duration = Math.round(performance.now() - tierStart);

    results.push({
      tier: tierNum,
      name: tierMeta.name,
      file: tierMeta.file,
      passed,
      durationMs: duration
    });
  }

  const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
  const allPassed = results.every(r => r.passed);

  console.log('\n=============================================================');
  console.log(' E2E VERIFICATION MATRIX & EXECUTION SUMMARY');
  console.log('=============================================================');
  console.log(
    'Tier'.padEnd(8) +
    'Status'.padEnd(12) +
    'Duration'.padEnd(12) +
    'Suite Name & File'
  );
  console.log(''.padEnd(65, '-'));

  for (const res of results) {
    const statusStr = res.passed ? 'PASS ✓' : 'FAIL ✗';
    console.log(
      `Tier ${res.tier}`.padEnd(8) +
      statusStr.padEnd(12) +
      `${res.durationMs}ms`.padEnd(12) +
      `${res.name} (${res.file})`
    );
  }

  console.log(''.padEnd(65, '-'));
  console.log(`Total Wall Clock Time: ${totalTime}s`);
  console.log(`Final Outcome: ${allPassed ? 'ALL TIERS PASSED ✓' : 'ONE OR MORE TIERS FAILED ✗'}`);
  console.log('=============================================================\n');

  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('[FATAL] Unhandled error in E2E test runner:', err);
  process.exit(1);
});
