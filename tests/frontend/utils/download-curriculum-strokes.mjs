import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');

const sqlPath = path.join(ROOT_DIR, 'backend/src/main/resources/db/migration/V17__reorganize_curriculum_10_lessons_200_words.sql');
const strokesDir = path.join(ROOT_DIR, 'frontend/assets/data/strokes');

if (!fs.existsSync(strokesDir)) {
  fs.mkdirSync(strokesDir, { recursive: true });
}

const sql = fs.readFileSync(sqlPath, 'utf8');
const lines = sql.split('\n');
const words = new Set();

for (const line of lines) {
  const m = line.match(/`hanzi`\s*=\s*'([^']+)'/);
  if (m) {
    words.add(m[1].trim());
  }
}

console.log(`Found ${words.size} distinct curriculum words in V17.`);

const cjkChars = new Set();
for (const word of words) {
  const matches = word.match(/[\u4E00-\u9FFF]/g);
  if (matches) {
    for (const c of matches) {
      cjkChars.add(c);
    }
  }
}

console.log(`Found ${cjkChars.size} unique CJK Hanzi characters across the ${words.size} words.`);

const missing = [];
const existing = [];

for (const c of Array.from(cjkChars).sort()) {
  const filePath = path.join(strokesDir, `${c}.json`);
  if (fs.existsSync(filePath)) {
    existing.push(c);
  } else {
    missing.push(c);
  }
}

console.log(`Already locally present: ${existing.length} / ${cjkChars.size}`);
console.log(`Missing locally (to download): ${missing.length}`);

async function run() {
  let successCount = 0;
  let failCount = 0;
  const failedList = [];

  for (let i = 0; i < missing.length; i++) {
    const c = missing[i];
    const encoded = encodeURIComponent(c);
    const url = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encoded}.json`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      if (!Array.isArray(data.strokes) || !Array.isArray(data.medians)) {
        throw new Error('Invalid stroke data payload');
      }

      const dest = path.join(strokesDir, `${c}.json`);
      fs.writeFileSync(dest, JSON.stringify(data), 'utf8');
      successCount++;
      if (successCount % 20 === 0 || successCount === missing.length) {
        console.log(`Progress: downloaded ${successCount}/${missing.length} characters...`);
      }
    } catch (err) {
      failCount++;
      failedList.push({ char: c, error: err.message });
      console.error(`Error downloading '${c}':`, err.message);
    }
  }

  console.log(`\nDownload summary: ${successCount} succeeded, ${failCount} failed.`);
  if (failedList.length > 0) {
    console.error('Failed items:', failedList);
    process.exit(1);
  }

  // Final validation
  let unverified = 0;
  for (const c of cjkChars) {
    const p = path.join(strokesDir, `${c}.json`);
    if (!fs.existsSync(p)) {
      unverified++;
    } else {
      const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (!Array.isArray(raw.strokes) || !Array.isArray(raw.medians)) {
        unverified++;
      }
    }
  }

  console.log(`Final 100% verification: all ${cjkChars.size} characters have valid local stroke JSON: ${unverified === 0 ? 'PASSED (0 missing)' : `FAILED (${unverified} invalid)`}`);
}

run().catch(err => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
