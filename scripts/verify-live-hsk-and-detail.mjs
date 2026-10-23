import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const candidatePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];
const executablePath = candidatePaths.find(p => fs.existsSync(p));

const FRONTEND_URL = 'https://khoadzsieucapvippro.github.io/WebLearnChinese';
const SCREENSHOTS_DIR = path.resolve('tests/screenshots/hsk-detail-verification');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  console.log('--- STARTING LIVE HSK & LESSON DETAIL VERIFICATION ---');
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    // 1. Log in with a real learner account
    console.log('1. Logging in with learner account...');
    await page.goto(`${FRONTEND_URL}/login.html`, { waitUntil: 'networkidle' });
    await page.fill('#loginEmail', 'learner@test.com');
    await page.fill('#loginPassword', 'TestPass123!');
    await page.click('#loginSubmitBtn');
    await page.waitForTimeout(4000);

    // 2. Test HSK 1 tab
    console.log('2. Checking HSK 1 tab on SRS review...');
    await page.goto(`${FRONTEND_URL}/srs-review.html?mode=flashcard&group=hsk1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-hsk1-shelf.png') });
    console.log('Saved 01-hsk1-shelf.png');

    // 3. Test HSK 2 tab (Was showing "Chưa có bài học trên hệ thống")
    console.log('3. Checking HSK 2 tab on SRS review...');
    await page.goto(`${FRONTEND_URL}/srs-review.html?mode=flashcard&group=hsk2`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-hsk2-shelf.png') });
    console.log('Saved 02-hsk2-shelf.png');

    // 4. Test HSK 3 tab (Was showing "Chưa có bài học trên hệ thống")
    console.log('4. Checking HSK 3 tab on SRS review...');
    await page.goto(`${FRONTEND_URL}/srs-review.html?mode=flashcard&group=hsk3`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-hsk3-shelf.png') });
    console.log('Saved 03-hsk3-shelf.png');

    // 5. Test 50 Radicals tab (Should have "Chi tiết chặng" button)
    console.log('5. Checking 50 Radicals tab on SRS review...');
    await page.goto(`${FRONTEND_URL}/srs-review.html?mode=flashcard&group=radicals50`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-radicals50-shelf.png') });
    console.log('Saved 04-radicals50-shelf.png');

    // 6. Test 214 Radicals tab (Should have "Chi tiết chặng" button)
    console.log('6. Checking 214 Radicals tab on SRS review...');
    await page.goto(`${FRONTEND_URL}/srs-review.html?mode=flashcard&group=radicals214`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-radicals214-shelf.png') });
    console.log('Saved 05-radicals214-shelf.png');

    // 7. Test Lesson Detail for HSK 2
    console.log('7. Checking Lesson Detail for HSK 2...');
    await page.goto(`${FRONTEND_URL}/lesson-detail.html?group=hsk2&chapter=0&mode=flashcard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-lesson-detail-hsk2.png'), fullPage: true });
    console.log('Saved 06-lesson-detail-hsk2.png');

    // 8. Test Lesson Detail for 50 Radicals (Chặng 1)
    console.log('8. Checking Lesson Detail for 50 Radicals (Chặng 1)...');
    await page.goto(`${FRONTEND_URL}/lesson-detail.html?group=radicals50&chapter=0&mode=flashcard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-lesson-detail-radicals50.png'), fullPage: true });
    console.log('Saved 07-lesson-detail-radicals50.png');

    console.log('--- ALL LIVE VERIFICATIONS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Live verification error:', err);
  } finally {
    await browser.close();
  }
}

run();
