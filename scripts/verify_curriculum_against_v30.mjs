import fs from 'fs';
import { SEED_LESSONS, SEED_VOCABULARY } from '../frontend/js/api/demo-seed-data.js';
import { HSK1_TOPICS, HSK2_TOPICS, HSK3_TOPICS } from '../frontend/js/pages/srs-review-page.js';

const allTopics = [...HSK1_TOPICS, ...HSK2_TOPICS, ...HSK3_TOPICS];

console.log('--- Verifying 50 Lessons and 1,000 Words ---');
console.log(`SEED_LESSONS: ${SEED_LESSONS.length} lessons`);
console.log(`HSK_TOPICS: ${allTopics.length} topics`);

let mismatches = 0;

// 1. Check SEED_LESSONS vs HSK_TOPICS
for (let i = 0; i < 50; i++) {
  const l = SEED_LESSONS[i];
  const t = allTopics[i];
  if (!l || !t) {
    console.error(`Lesson/Topic missing at index ${i}`);
    mismatches++;
    continue;
  }
  if (l.vocabularies.length !== 20 || t.vocabularies.length !== 20) {
    console.error(`Lesson ${i + 1} has ${l.vocabularies.length} words, Topic ${i + 1} has ${t.vocabularies.length} words`);
    mismatches++;
  }
  for (let j = 0; j < 20; j++) {
    const lv = l.vocabularies[j];
    const tv = t.vocabularies[j];
    if (lv.vocabId !== tv.vocabId || lv.hanzi !== tv.hanzi) {
      console.error(`Mismatch L${i + 1} W${j + 1}: Lesson has id=${lv.vocabId}, hanzi=${lv.hanzi}; Topic has id=${tv.vocabId}, hanzi=${tv.hanzi}`);
      mismatches++;
    }
  }
}

// 2. Check SEED_LESSONS vs SEED_VOCABULARY
const vocabMap = new Map(SEED_VOCABULARY.map(v => [v.vocabId, v]));
const usedIds = new Set();
for (let i = 0; i < 50; i++) {
  const l = SEED_LESSONS[i];
  for (let j = 0; j < 20; j++) {
    const lv = l.vocabularies[j];
    const sv = vocabMap.get(lv.vocabId);
    if (!sv) {
      console.error(`Word in Lesson ${i + 1} (id=${lv.vocabId}, hanzi=${lv.hanzi}) not found in SEED_VOCABULARY!`);
      mismatches++;
    } else if (sv.hanzi !== lv.hanzi) {
      console.error(`Word in Lesson ${i + 1} has hanzi="${lv.hanzi}" but SEED_VOCABULARY[${lv.vocabId}] has hanzi="${sv.hanzi}"!`);
      mismatches++;
    }
    usedIds.add(lv.vocabId);
  }
}

// 3. Check V30 Migration
const v30Path = 'backend/src/main/resources/db/migration/V30__seed_standardized_curriculum_50_lessons_1000_words.sql';
const v30Content = fs.readFileSync(v30Path, 'utf8');
const blocks = v30Content.split(/Lesson \d+\/50:/).slice(1);
console.log(`V30 Migration has ${blocks.length} lesson blocks`);

if (blocks.length !== 50) {
  console.error(`Expected 50 blocks in V30, found ${blocks.length}`);
  mismatches++;
}

for (let i = 0; i < blocks.length; i++) {
  const block = blocks[i];
  const hanziMatches = [...block.matchAll(/WHERE `hanzi` = '([^']+)'/g)].map(m => m[1]);
  if (hanziMatches.length !== 20) {
    console.error(`V30 block ${i + 1} has ${hanziMatches.length} words (expected 20)`);
    mismatches++;
  }
  const l = SEED_LESSONS[i];
  for (let j = 0; j < Math.min(20, hanziMatches.length); j++) {
    if (l.vocabularies[j].hanzi !== hanziMatches[j]) {
      console.error(`V30 Mismatch Lesson ${i + 1} Word ${j + 1}: SEED has "${l.vocabularies[j].hanzi}", V30 has "${hanziMatches[j]}"`);
      mismatches++;
    }
  }
}

// 4. Check for duplicate IDs across lessons
console.log(`Total unique vocabulary IDs used across 50 lessons: ${usedIds.size}`);
if (usedIds.size !== 1000) {
  console.warn(`Note: ${usedIds.size} unique vocabularies across 50 lessons (1,000 words total). Checking for overlaps...`);
  // Let's check which words appear multiple times if any
  const counts = new Map();
  for (const l of SEED_LESSONS) {
    for (const v of l.vocabularies) {
      counts.set(v.vocabId, (counts.get(v.vocabId) || 0) + 1);
    }
  }
  let duplicates = 0;
  for (const [id, count] of counts.entries()) {
    if (count > 1) {
      duplicates++;
      const v = vocabMap.get(id);
      console.log(`Duplicate word: id=${id}, hanzi="${v?.hanzi}", occurrences=${count}`);
    }
  }
  console.log(`Total duplicated words across lessons: ${duplicates}`);
}

console.log(`--- Verification Complete: ${mismatches} mismatches found ---`);
process.exit(mismatches === 0 ? 0 : 1);
