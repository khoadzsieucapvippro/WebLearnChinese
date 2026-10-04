import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';
import assert from 'node:assert';
import path from 'node:path';

const ARTIFACT_DIR = 'C:/Users/LENOVO/.gemini/antigravity-ide/brain/8a218c5a-b832-42da-8a15-ba2e179e2e07';

async function runLiveVerification() {
  console.log('--- STARTING LIVE BROWSER VERIFICATION ---');
  const browser = await launchBrowser({ headless: true });
  const { page, errors: monitoredErrors, consoleErrors } = await createMonitoredPage(browser, {
    viewport: { width: 1280, height: 800 }
  });

  try {
    // 1. Login as learner
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/login.html', { waitUntil: 'networkidle' });
    await page.fill('#loginEmail', 'tuathien@gmail.com');
    await page.fill('#loginPassword', 'Password123!');
    await page.click('#loginSubmitBtn');
    await page.waitForURL(url => !url.href.includes('login.html'), { timeout: 10000 });
    console.log('   Login successful, current URL:', page.url());

    // 2. Open Lessons page
    console.log('2. Navigating to lessons page...');
    await page.goto('http://localhost:3000/lessons.html', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'srs_live_1_lessons.png'), fullPage: true });

    // 3. Open Approved SRS test lesson (9396)
    console.log('3. Navigating to lesson-detail.html?id=9396...');
    await page.goto('http://localhost:3000/lesson-detail.html?id=9396', { waitUntil: 'networkidle' });
    await page.waitForSelector('#btnGoToSrsReview', { timeout: 10000 });
    const srsReviewBtn = page.locator('#btnGoToSrsReview');
    const srsHref = await srsReviewBtn.getAttribute('href');
    console.log('   #btnGoToSrsReview href:', srsHref);
    assert.ok(srsHref && srsHref.includes('srs-review.html?lessonId=9396'), `Expected srs-review.html?lessonId=9396, got ${srsHref}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'srs_live_2_lesson_detail.png'), fullPage: true });

    // 4. Click SRS Review button
    console.log('4. Clicking #btnGoToSrsReview...');
    await srsReviewBtn.click();
    await page.waitForURL(url => url.href.includes('srs-review.html?lessonId=9396'), { timeout: 10000 });
    console.log('   Arrived at review room:', page.url());

    // 5. Verify Flashcard front face
    await page.waitForSelector('#srsActiveSession:not(.d-none)', { timeout: 10000 });
    await page.waitForSelector('#cardFrontHanzi', { timeout: 10000 });
    const badgeText = await page.locator('#cardTypeBadgeFront').textContent();
    const promptText = await page.locator('#cardFrontHanzi').textContent();
    const pinyinText = await page.locator('#cardFrontPinyin').textContent();
    console.log(`   Card Front: Badge='${badgeText.trim()}', Hanzi='${promptText.trim()}', Pinyin='${pinyinText.trim()}'`);
    assert.strictEqual(badgeText.trim(), 'Từ vựng', 'Badge must be "Từ vựng"');
    assert.strictEqual(promptText.trim(), '爱', 'Hanzi must be "爱"');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'srs_live_3_card_front.png') });

    // 6. Flip Card (Click flashcard)
    console.log('6. Flipping card...');
    await page.click('#flashcard');
    await page.waitForFunction(() => {
      const card = document.getElementById('flashcard');
      return card && card.classList.contains('flipped');
    }, { timeout: 5000 });
    const meaningVi = await page.locator('#cardBackMeaningVi').textContent();
    console.log(`   Card Back: Meaning='${meaningVi.trim()}'`);
    assert.ok(meaningVi.includes('Yêu') || meaningVi.includes('thích'), 'Back meaning must contain "Yêu" or "thích"');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'srs_live_4_card_back.png') });

    // 7. Rate Good (Rating 3)
    console.log('7. Rating card with Good (3)...');
    await page.click('#btnRatingGood');

    // 8. Verify advancing to next card
    await page.waitForFunction(() => {
      const el = document.getElementById('cardFrontHanzi');
      return el && el.textContent.trim() === '爱好';
    }, { timeout: 10000 });
    const nextPromptText = await page.locator('#cardFrontHanzi').textContent();
    console.log(`   Advanced to Next Card: Hanzi='${nextPromptText.trim()}'`);
    assert.strictEqual(nextPromptText.trim(), '爱好', 'Next card must be "爱好"');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'srs_live_5_card_next.png') });

    // 9. Check SRS Dashboard
    console.log('9. Navigating to srs-dashboard.html...');
    await page.goto('http://localhost:3000/srs-dashboard.html', { waitUntil: 'networkidle' });
    await page.waitForSelector('#statNewCardsToday', { timeout: 10000 });
    const statCardsDue = await page.locator('#statCardsDue').textContent();
    const statNewCardsToday = await page.locator('#statNewCardsToday').textContent();
    const statReviewsToday = await page.locator('#statReviewsToday').textContent();
    console.log(`   Dashboard Metrics: Due=${statCardsDue.trim()}, NewToday=${statNewCardsToday.trim()}, ReviewsToday=${statReviewsToday.trim()}`);
    assert.strictEqual(statNewCardsToday.trim(), '1', 'newCardsToday must be 1');
    assert.strictEqual(statReviewsToday.trim(), '1', 'reviewsToday must be 1');
    assert.strictEqual(statCardsDue.trim(), '0', 'cardsDue must be 0 (nextReviewAt is tomorrow)');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'srs_live_6_dashboard.png'), fullPage: true });

    // 10. Check standard due mode empty state
    console.log('10. Navigating to srs-review.html (Due Mode)...');
    await page.goto('http://localhost:3000/srs-review.html', { waitUntil: 'networkidle' });
    await page.waitForSelector('#srsEmptyState:not(.d-none)', { timeout: 10000 });
    const emptyTitle = await page.locator('#srsEmptyTitle').textContent();
    const emptyDesc = await page.locator('#srsEmptyDescription').textContent();
    console.log(`   Due Mode Empty State: Title='${emptyTitle.trim()}', Desc='${emptyDesc.trim()}'`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'srs_live_7_due_empty.png'), fullPage: true });

    // 11. Verify zero console errors
    console.log('11. Checking console errors...');
    const criticalErrors = (monitoredErrors || []).filter(e => !e.includes('favicon.ico'));
    console.log(`   Critical console errors: ${criticalErrors.length}`);
    if (criticalErrors.length > 0) {
      console.error('Errors:', criticalErrors);
    }
    assert.strictEqual(criticalErrors.length, 0, 'No critical console errors');

    console.log('--- ALL LIVE BROWSER VERIFICATION CHECKS PASSED ---');
  } finally {
    await browser.close();
  }
}

runLiveVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
