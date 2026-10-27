import { demoFallbackEngine } from '../frontend/js/api/demo-fallback-engine.js';
import { SEED_LESSONS, SEED_VOCABULARY } from '../frontend/js/api/demo-seed-data.js';
import { HSK1_TOPICS, HSK2_TOPICS, HSK3_TOPICS } from '../frontend/js/pages/srs-review-page.js';

const allTopics = [...HSK1_TOPICS, ...HSK2_TOPICS, ...HSK3_TOPICS];

// Mock localStorage for Node environment
const store = {};
globalThis.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

const engine = demoFallbackEngine;

async function simulateLessonReview(lessonId, ratingPlan) {
  // 1. Fetch practice cards for the lesson with cardType = READING
  const cards = await engine.handleRequest(`/srs/practice-cards?lessonId=${lessonId}&cardType=READING`, { method: 'GET' });

  // 2. Submit reviews according to ratingPlan: array of numbers [r1, r2, ..., r20]
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const rating = ratingPlan[i] || 3;
    await engine.handleRequest('/srs/review', {
      method: 'POST',
      body: {
        itemId: card.itemId || card.vocabId,
        itemType: 'VOCABULARY',
        cardType: 'READING',
        rating,
        lessonId,
        reviewTimeSeconds: 3
      }
    });
  }

  // 3. Query due cards for this lesson
  const due = await engine.handleRequest(`/srs/due?lessonId=${lessonId}&itemType=VOCABULARY&cardType=READING`, { method: 'GET' });
  return due;
}

async function run() {
  engine.resetInMemoryData();
  console.log("=== SIMULATING LESSON 2 MULTI-ROUND REPETITIONS ===");

  // Pass 1: Rate 2 words as 1 (Again), 18 words as 3 (Good)
  const plan1 = [1, 1, ...Array(18).fill(3)];
  let due = await simulateLessonReview(2, plan1);
  console.log(`Round 1 (2 Again): Due cards = ${due.length} (expected 2)`);
  if (due.length !== 2) throw new Error(`Round 1 failed: expected 2, got ${due.length}`);

  // Pass 2: Re-learn lesson (Round 2). This time, rate 5 words as 1 (Again), 15 as 3
  const plan2 = [1, 1, 1, 1, 1, ...Array(15).fill(3)];
  due = await simulateLessonReview(2, plan2);
  console.log(`Round 2 (5 Again): Due cards = ${due.length} (expected 5)`);
  if (due.length !== 5) throw new Error(`Round 2 failed: expected 5, got ${due.length}`);

  // Pass 3: Re-learn lesson (Round 3). Words 0..1 rated 2 (Hard), words 2..19 rated 3 (Good)
  // Both Rating 2 (Hard) and Rating 3 (Good) must clear due cards
  const plan3 = [2, 2, ...Array(18).fill(3)];
  due = await simulateLessonReview(2, plan3);
  console.log(`Round 3 (Hard & Good): Due cards = ${due.length} (expected 0)`);
  if (due.length !== 0) throw new Error(`Round 3 failed: expected 0, got ${due.length}`);

  // Pass 4: Re-learn lesson (Round 4). Rate 1 word as 1 (Again), 19 as 4 (Easy)
  const plan4 = [3, 3, 1, ...Array(17).fill(4)];
  due = await simulateLessonReview(2, plan4);
  console.log(`Round 4 (1 Again): Due cards = ${due.length} (expected 1)`);
  if (due.length !== 1) throw new Error(`Round 4 failed: expected 1, got ${due.length}`);

  console.log("\nALL 4 ROUNDS PASSED ON LESSON 2!\n");

  console.log("=== TESTING HOMOGRAPH CROSS-LESSON ISOLATION ===");
  // Lapsing '还' in Lesson 4 must NOT make Lesson 34 due
  engine.resetInMemoryData();
  const planL4 = [3, 3, 3, 3, 3, 3, 1, ...Array(13).fill(3)]; // Word 7 is 还 (132)
  await simulateLessonReview(4, planL4);
  const dueL4 = await engine.handleRequest('/srs/due?lessonId=4&itemType=VOCABULARY&cardType=READING', { method: 'GET' });
  const dueL34 = await engine.handleRequest('/srs/due?lessonId=34&itemType=VOCABULARY&cardType=READING', { method: 'GET' });
  console.log(`Homograph Test: Lesson 4 due = ${dueL4.length} (expected 1), Lesson 34 due = ${dueL34.length} (expected 0)`);
  if (dueL4.length !== 1 || dueL34.length !== 0) {
    throw new Error(`Homograph cross-lesson isolation failed: L4=${dueL4.length}, L34=${dueL34.length}`);
  }
  console.log("HOMOGRAPH CROSS-LESSON ISOLATION PASSED!\n");

  console.log("=== TESTING ALL LESSONS 1 TO 50 FOR MULTI-REPETITIONS ===");
  for (let lid = 1; lid <= 50; lid++) {
    // Round A: 3 words again
    const planA = [1, 1, 1, ...Array(17).fill(3)];
    const dueA = await simulateLessonReview(lid, planA);
    if (dueA.length !== 3) {
      console.error(`Lesson ${lid} failed Round A: got ${dueA.length}, expected 3`);
      process.exit(1);
    }

    // Round B: 5 words again (relearning)
    const planB = [1, 1, 1, 1, 1, ...Array(15).fill(3)];
    const dueB = await simulateLessonReview(lid, planB);
    if (dueB.length !== 5) {
      console.error(`Lesson ${lid} failed Round B: got ${dueB.length}, expected 5`);
      process.exit(1);
    }

    // Round C: 0 words again (all 3)
    const planC = Array(20).fill(3);
    const dueC = await simulateLessonReview(lid, planC);
    if (dueC.length !== 0) {
      console.error(`Lesson ${lid} failed Round C: got ${dueC.length}, expected 0`);
      process.exit(1);
    }
  }
  console.log("ALL 50 LESSONS PASSED ROUNDS A, B, AND C SIMULATIONS!");
}

run().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
