import { launchBrowser, createMonitoredPage } from '../tests/frontend/utils/browser-runner.mjs';
import fs from 'node:fs';
import path from 'node:path';

const outDir = 'c:/Users/LENOVO/.gemini/antigravity/brain/6f2b3339-e82b-456e-a6d9-50514493eca4/scratch';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runFullBrowserAudit() {
  console.log('>>> STARTING FULL BROWSER AUDIT & SCREEN-BY-SCREEN VERIFICATION');
  const browser = await launchBrowser({ headless: true });
  const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
    viewportWidth: 1280,
    viewportHeight: 800
  });

  const capturedNetworkCalls = [];
  page.on('response', resp => {
    capturedNetworkCalls.push({ url: resp.url(), status: resp.status() });
  });

  try {
    // 0. Setup Authenticated Session
    console.log('--- Step 0: Authenticating session via backend token ---');
    await page.goto('http://localhost:3000/login.html', { waitUntil: 'domcontentloaded' });
    
    // Inject auth session for learner@elearning.local directly into localStorage
    await page.evaluate(() => {
      const mockSession = {
        token: 'test_token',
        type: 'Bearer',
        accountId: 2,
        emailOrPhone: 'learner@elearning.local',
        fullName: 'Học Viên Mẫu',
        roles: ['Learner']
      };
      localStorage.setItem('AUTH_USER', JSON.stringify(mockSession));
      localStorage.setItem('auth_token', 'test_token');
    });

    // -------------------------------------------------------------
    // SCENARIO 1: Flashcard Radical Chặng 01 (Verify FIX for Image 2)
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 1: Flashcard Radicals50 Chặng 01 (Image 2 Fix Verification) ---');
    const flashcardUrl = 'http://localhost:3000/srs-review.html?mode=flashcard&group=radicals50&action=start';
    await page.goto(flashcardUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Verify Active session container is visible
    const activeSession = page.locator('#srsActiveSession');
    console.log('  Active session visible:', await activeSession.isVisible());

    // Check front Hanzi
    const frontHanzi = page.locator('#cardFrontHanzi');
    const hanziText = await frontHanzi.textContent();
    console.log('  Initial Card Hanzi:', hanziText);

    // Flip card (click flashcard)
    console.log('  Flipping card...');
    await page.locator('#flashcard').click();
    await page.waitForTimeout(400);

    // Click rating button [3] (Good)
    console.log('  Clicking Rating button [3] Tốt...');
    const btnGood = page.locator('#btnRatingGood');
    await btnGood.click();
    await page.waitForTimeout(800);

    // Verify: No sync error message visible
    const errorFeedback = page.locator('.srs-error-feedback');
    const hasErrorFeedback = await errorFeedback.isVisible().catch(() => false);
    console.log('  Has "Lỗi đồng bộ" banner:', hasErrorFeedback);

    // Verify: No giant column of toasts
    const toasts = page.locator('.toast-custom');
    const toastCount = await toasts.count();
    console.log('  Total toasts currently in DOM:', toastCount);

    // Take screenshot 1
    const ss1Path = path.join(outDir, 'screenshot_1_flashcard_smooth.png');
    await page.screenshot({ path: ss1Path, fullPage: true });
    console.log('  Saved screenshot 1:', ss1Path);

    // -------------------------------------------------------------
    // SCENARIO 2: Reading Room Radical (Verify FIX for Image 1)
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 2: Reading Room Radicals50 (Image 1 Fix Verification) ---');
    const readingUrl = 'http://localhost:3000/srs-review.html?mode=reading&group=radicals50&action=start';
    await page.goto(readingUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Check Badge: Must be '📖 Luyện đọc' (NO 'AI')
    const badgeEl = page.locator('.srs-reading-card .badge.bg-danger-subtle');
    const badgeText = (await badgeEl.textContent()).trim();
    console.log('  Reading Badge text:', JSON.stringify(badgeText));

    // Check Gemini text: Must NOT contain 'Gemini'
    const pageContent = await page.content();
    const hasGeminiText = pageContent.includes('Gemini');
    console.log('  HTML contains "Gemini":', hasGeminiText);

    // Check Confidence badge: Must be hidden (d-none)
    const confBadge = page.locator('#readingConfidenceBadge');
    const isConfVisible = await confBadge.isVisible();
    console.log('  Reading Confidence badge is visible:', isConfVisible);

    // Check Gemini quote: Must NOT exist
    const hasGeminiQuote = pageContent.includes('Điểm ước lượng tham khảo');
    console.log('  HTML contains "Điểm ước lượng tham khảo":', hasGeminiQuote);

    // Test button: 👁️ Xem trước phiên âm & nghĩa
    console.log('  Clicking "Xem trước phiên âm & nghĩa"...');
    const btnTogglePinyin = page.locator('#btnReadingTogglePinyin');
    await btnTogglePinyin.click();
    await page.waitForTimeout(300);
    const pinyinBox = page.locator('#readingPinyinMeaningBox');
    console.log('  Pinyin box revealed:', await pinyinBox.isVisible());

    // Test button: Phát âm mẫu chuẩn
    console.log('  Clicking "Phát âm mẫu chuẩn"...');
    const btnAudioSample = page.locator('#btnReadingSampleAudio');
    await btnAudioSample.click();
    await page.waitForTimeout(500);

    // Take screenshot 2
    const ss2Path = path.join(outDir, 'screenshot_2_reading_cleaned.png');
    await page.screenshot({ path: ss2Path, fullPage: true });
    console.log('  Saved screenshot 2:', ss2Path);

    // -------------------------------------------------------------
    // SCENARIO 3: Dedicated Listening Room (Luyện nghe)
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 3: Listening Room ---');
    const listeningUrl = 'http://localhost:3000/srs-review.html?mode=listening&group=radicals50&action=start';
    await page.goto(listeningUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const listeningRoom = page.locator('#srsListeningRoom');
    console.log('  Listening room visible:', await listeningRoom.isVisible());

    // Click play audio in listening room
    const btnPlayListen = page.locator('#btnListeningPlayAudio');
    console.log('  Clicking Listening play audio button...');
    await btnPlayListen.click();
    await page.waitForTimeout(400);

    // Type answer
    const answerInput = page.locator('#listeningAnswerInput');
    await answerInput.fill('mu');
    console.log('  Filled answer input');

    // Click check button
    const btnCheck = page.locator('#btnListeningCheck');
    await btnCheck.click();
    await page.waitForTimeout(400);

    // Take screenshot 3
    const ss3Path = path.join(outDir, 'screenshot_3_listening_active.png');
    await page.screenshot({ path: ss3Path, fullPage: true });
    console.log('  Saved screenshot 3:', ss3Path);

    // -------------------------------------------------------------
    // SCENARIO 4: Dedicated Writing Room (Luyện viết)
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 4: Writing Room ---');
    const writingUrl = 'http://localhost:3000/srs-review.html?mode=writing&group=radicals50&action=start';
    await page.goto(writingUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const writingRoom = page.locator('#srsWritingRoom');
    console.log('  Writing room visible:', await writingRoom.isVisible());

    // Check Outline button
    const btnOutline = page.locator('#btnWritingOutline');
    console.log('  Outline button visible:', await btnOutline.isVisible());
    await btnOutline.click();
    await page.waitForTimeout(300);

    // Take screenshot 4
    const ss4Path = path.join(outDir, 'screenshot_4_writing_active.png');
    await page.screenshot({ path: ss4Path, fullPage: true });
    console.log('  Saved screenshot 4:', ss4Path);

    // Runtime errors check
    const runtimeErrors = getRuntimeErrors();
    console.log('\n>>> TOTAL RUNTIME CONSOLE ERRORS:', runtimeErrors.length);
    if (runtimeErrors.length > 0) {
      console.error('Errors:', runtimeErrors);
    } else {
      console.log('>>> ZERO CONSOLE ERRORS ACROSS ALL 4 SCENARIOS! ✓');
    }

  } finally {
    await context.close();
    await browser.close();
    console.log('>>> BROWSER AUDIT COMPLETED.');
  }
}

runFullBrowserAudit().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});
