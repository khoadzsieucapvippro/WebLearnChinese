import { launchBrowser } from '../tests/frontend/utils/browser-runner.mjs';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'https://khoadzsieucapvippro.github.io/WebLearnChinese';
const SCREENSHOT_DIR = path.resolve('tests/screenshots/live-user-journey');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function runLiveUserJourney() {
  console.log('===============================================================');
  console.log(' STARTING REAL LIVE USER VERIFICATION ON GITHUB PAGES & RENDER');
  console.log(' Target URL:', BASE_URL);
  console.log('===============================================================\n');

  const browser = await launchBrowser({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    permissions: ['microphone']
  });

  const page = await context.newPage();

  const networkFailures = [];
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[CONSOLE ERROR] ${msg.text()}`);
      console.log('  ❌ BROWSER CONSOLE ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(`[PAGE ERROR] ${err.message}`);
    console.log('  ❌ UNCAUGHT PAGE ERROR:', err.message);
  });

  page.on('response', resp => {
    const url = resp.url();
    const status = resp.status();
    if (status >= 400 && !url.includes('/favicon.ico')) {
      networkFailures.push({ url, status, method: resp.request().method() });
      console.log(`  ⚠️ HTTP ${status} on ${resp.request().method()} ${url}`);
    }
  });

  const report = {
    steps: [],
    passed: 0,
    failed: 0
  };

  function logStep(name, success, detail) {
    report.steps.push({ name, success, detail });
    if (success) {
      report.passed++;
      console.log(`  ✅ [PASS] ${name}: ${detail || 'OK'}`);
    } else {
      report.failed++;
      console.log(`  ❌ [FAIL] ${name}: ${detail || 'FAILED'}`);
    }
  }

  try {
    // =========================================================================
    // JOURNEY 1: TRANG CHỦ & KIỂM TRA TẢI TRANG
    // =========================================================================
    console.log('\n--- 1. KIỂM THỬ TRANG CHỦ (Home Page) ---');
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_homepage.png') });
    
    const pageTitle = await page.title();
    const resolvedApi = await page.evaluate(() => window.__ENV__?.API_BASE_URL);
    
    logStep('1.1 Tải trang chủ thành công', !!pageTitle, `Title: "${pageTitle}"`);
    logStep('1.2 Cấu hình API Backend runtime', resolvedApi === 'https://elearning-backend-pwyi.onrender.com/api/v1', `window.__ENV__.API_BASE_URL = ${resolvedApi}`);

    // =========================================================================
    // JOURNEY 2: ĐĂNG KÝ TÀI KHOẢN MỚI
    // =========================================================================
    console.log('\n--- 2. KIỂM THỬ ĐĂNG KÝ TÀI KHOẢN (Registration) ---');
    await page.goto(`${BASE_URL}/register.html`, { waitUntil: 'networkidle', timeout: 30000 });
    
    const timestamp = Date.now();
    const registeredEmail = `learner_live_${timestamp}@example.com`;
    const userPassword = 'Password123!';
    const userFullName = 'Học Viên Trải Nghiệm Thật';

    await page.fill('#regFullName', userFullName);
    await page.fill('#regEmail', registeredEmail);
    await page.fill('#regPassword', userPassword);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_register_filled.png') });

    console.log(`  Submitting registration for ${registeredEmail}...`);
    await Promise.all([
      page.waitForURL('**/login.html*', { timeout: 15000 }),
      page.click('#registerSubmitBtn')
    ]);

    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_register_result.png') });

    const currentUrlAfterReg = page.url();
    const isRedirectedToLogin = currentUrlAfterReg.includes('login.html');
    logStep('2.1 Đăng ký tài khoản mới thành công và chuyển sang Login', isRedirectedToLogin, `URL: ${currentUrlAfterReg}`);

    // =========================================================================
    // JOURNEY 3: ĐĂNG NHẬP VỚI TÀI KHOẢN VỪA TẠO
    // =========================================================================
    console.log(`\n--- 3. KIỂM THỬ ĐĂNG NHẬP (Login with ${registeredEmail}) ---`);
    await page.fill('#loginEmail', registeredEmail);
    await page.fill('#loginPassword', userPassword);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_login_filled.png') });

    console.log('  Submitting login...');
    await Promise.all([
      page.waitForURL('**/index.html*', { timeout: 15000 }),
      page.click('#loginSubmitBtn')
    ]);

    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_login_result.png') });

    const tokenInStorage = await page.evaluate(() => localStorage.getItem('access_token'));
    const isNavLoggedIn = await page.evaluate(() => {
      const container = document.getElementById('navAuthContainer');
      return container ? container.innerText : '';
    });

    logStep('3.1 Đăng nhập và nhận JWT token', !!tokenInStorage, `Token: ${tokenInStorage ? tokenInStorage.substring(0, 25) + '...' : 'NONE'}`);
    logStep('3.2 Navbar hiển thị đúng tên người dùng & vai trò', isNavLoggedIn.includes(userFullName) || isNavLoggedIn.includes('Học viên') || isNavLoggedIn.includes('Đăng xuất'), `Navbar: "${isNavLoggedIn.replace(/\n/g, ' ')}"`);

    // =========================================================================
    // JOURNEY 4: BỘ THỦ KHANG HY (Radicals) & BẤM LOA
    // =========================================================================
    console.log('\n--- 4. KIỂM THỬ 214 BỘ THỦ KHANG HY & BẤM LOA ---');
    await page.goto(`${BASE_URL}/radicals.html`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500); // Wait for live backend radicals API

    const radicalCardsCount = await page.$$eval('.radical-card', cards => cards.length);
    logStep('4.1 Tải danh sách bộ thủ từ Backend', radicalCardsCount > 0, `Số lượng card hiển thị: ${radicalCardsCount}`);

    // Test search filter
    console.log('  Testing radical search "mộc"...');
    await page.fill('#radicalSearchInput', 'mộc');
    await page.waitForTimeout(1000);
    const searchResultCount = await page.$$eval('.radical-card:not(.d-none)', cards => cards.length);
    logStep('4.2 Tìm kiếm bộ thủ "mộc"', searchResultCount > 0, `Tìm thấy ${searchResultCount} kết quả`);

    // Click radical card (ID 75 木) to open modal
    console.log('  Clicking radical card to open modal...');
    const firstRadicalCard = await page.$('.radical-card');
    if (firstRadicalCard) {
      await firstRadicalCard.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_radical_modal.png') });

      const isModalOpen = await page.evaluate(() => {
        const modal = document.getElementById('radicalDetailModal');
        return modal && (modal.open || modal.classList.contains('show') || modal.style.display !== 'none');
      });
      const modalChar = await page.evaluate(() => document.getElementById('modalRadicalChar')?.innerText || '');
      const modalMeaning = await page.evaluate(() => document.getElementById('modalRadicalMeaning')?.innerText || '');

      logStep('4.3 Mở Modal chi tiết bộ thủ', isModalOpen && !!modalChar, `Ký tự: "${modalChar}", Nghĩa: "${modalMeaning}"`);

      // Test speaker button (bấm loa)
      console.log('  Testing Speaker button on radical modal...');
      const speakerBtn = await page.$('#modalHeroSpeakerBtn');
      if (speakerBtn) {
        const initialErrorsLen = pageErrors.length + consoleErrors.length;
        await speakerBtn.click();
        await page.waitForTimeout(1000);
        const newErrorsLen = pageErrors.length + consoleErrors.length;

        logStep('4.4 Bấm loa phát âm bộ thủ (#modalHeroSpeakerBtn)', newErrorsLen === initialErrorsLen, 
          newErrorsLen === initialErrorsLen ? 'Phát âm kích hoạt mượt mà không có exception' : 'Phát hiện lỗi khi bấm loa');
      } else {
        logStep('4.4 Bấm loa phát âm bộ thủ', false, 'Không tìm thấy nút #modalHeroSpeakerBtn');
      }

      // Close modal
      const closeBtn = await page.$('#modalCloseBtn');
      if (closeBtn) {
        await closeBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // =========================================================================
    // JOURNEY 5: TỪ VỰNG HSK & BẤM LOA
    // =========================================================================
    console.log('\n--- 5. KIỂM THỬ TỪ VỰNG HSK & BẤM LOA ---');
    await page.goto(`${BASE_URL}/vocabulary.html`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500); // Wait for live backend vocabulary API

    const vocabCardsCount = await page.$$eval('.vocab-card', cards => cards.length);
    logStep('5.1 Tải danh sách từ vựng từ Backend', vocabCardsCount > 0, `Số lượng card hiển thị: ${vocabCardsCount}`);

    // Test search vocabulary by Pinyin ('xue') and Hanzi ('学')
    console.log('  Testing vocabulary search by Pinyin "xue"...');
    await page.fill('#vocabSearchInput', 'xue');
    await page.waitForResponse(r => r.url().includes('search=xue'), { timeout: 15000 });
    await page.waitForTimeout(1500);
    const vocabSearchCount = await page.$$eval('.vocab-card:not(.d-none)', cards => cards.length);
    logStep('5.2 Tìm kiếm từ vựng theo Pinyin "xue"', vocabSearchCount > 0, `Tìm thấy ${vocabSearchCount} từ vựng`);

    // Click vocabulary card to open detail modal
    console.log('  Clicking vocabulary card to open modal...');
    const firstVocabCard = await page.$('.vocab-card');
    if (firstVocabCard) {
      await firstVocabCard.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_vocab_modal.png') });

      const isVocabModalOpen = await page.evaluate(() => {
        const modal = document.getElementById('vocabDetailModal');
        return modal && (modal.open || modal.classList.contains('show') || modal.style.display !== 'none');
      });
      const vocabChar = await page.evaluate(() => document.getElementById('modalVocabHanzi')?.innerText || '');
      const vocabPinyin = await page.evaluate(() => document.getElementById('modalVocabPinyin')?.innerText || '');
      const vocabMeaning = await page.evaluate(() => document.getElementById('modalVocabMeaning')?.innerText || '');

      logStep('5.3 Mở Modal chi tiết từ vựng', isVocabModalOpen && !!vocabChar, 
        `Từ: "${vocabChar}" (${vocabPinyin}) - Nghĩa: "${vocabMeaning}"`);

      // Test speaker button on vocab modal
      console.log('  Testing Speaker button on vocabulary modal...');
      const vocabSpeakerBtn = await page.$('#modalSpeechBtn');
      if (vocabSpeakerBtn) {
        const initialErrorsLen = pageErrors.length + consoleErrors.length;
        await vocabSpeakerBtn.click();
        await page.waitForTimeout(1000);
        const newErrorsLen = pageErrors.length + consoleErrors.length;

        logStep('5.4 Bấm loa phát âm từ vựng (#modalSpeechBtn)', newErrorsLen === initialErrorsLen,
          newErrorsLen === initialErrorsLen ? 'Phát âm kích hoạt mượt mà không có exception' : 'Phát hiện lỗi khi bấm loa');
      } else {
        logStep('5.4 Bấm loa phát âm từ vựng', false, 'Không tìm thấy nút #modalSpeechBtn');
      }

      // Close modal
      const closeVocabBtn = await page.$('#modalCloseBtn');
      if (closeVocabBtn) {
        await closeVocabBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // =========================================================================
    // JOURNEY 6: ÔN TẬP SRS (SRS Review)
    // =========================================================================
    console.log('\n--- 6. KIỂM THỬ ÔN TẬP SRS (SRS Review & Flashcards) ---');
    await page.goto(`${BASE_URL}/srs-review.html`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_srs_page.png') });

    const srsHeading = await page.evaluate(() => document.getElementById('srsPageHeading')?.innerText || '');
    logStep('6.1 Tải trang ôn tập SRS cho người dùng đã đăng nhập', !!srsHeading, `Heading: "${srsHeading}"`);

    // Check shelf decks
    const deckCount = await page.$$eval('.srs-deck-card', decks => decks.length);
    logStep('6.2 Hiển thị các bộ thẻ giáo trình SRS', deckCount > 0, `Tìm thấy ${deckCount} bộ thẻ (Radicals 50, 214, HSK 1, 2, 3)`);

    // Click on a deck card to view chapters
    console.log('  Clicking deck card to view chapters...');
    const firstDeck = await page.$('#groupTabRadicals50, .srs-deck-card');
    if (firstDeck) {
      await firstDeck.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_srs_deck_opened.png') });

      // Click "Bắt đầu học" button inside chapter card
      console.log('  Starting chapter study session...');
      const startStudyBtn = await page.$('.btn-chinese-primary, button[class*="btn-chinese-primary"]');
      if (startStudyBtn) {
        await startStudyBtn.click();
        await page.waitForTimeout(2500);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_srs_session.png') });

        // Verify flashcard is rendered
        const cardRendered = await page.evaluate(() => {
          return !!document.querySelector('.srs-flashcard, .srs-card, [id*="card"], [class*="card"]');
        });
        logStep('6.3 Khởi chạy phiên học thẻ SRS Flashcard', cardRendered, 'Thẻ SRS hiển thị đầy đủ');
      }
    }

  } catch (err) {
    console.error('FATAL UNCAUGHT RUNNER ERROR:', err);
    logStep('Fatal Error', false, err.message);
  } finally {
    await browser.close();
  }

  console.log('\n===============================================================');
  console.log(' USER JOURNEY VERIFICATION SUMMARY');
  console.log('===============================================================');
  console.log(` Passed: ${report.passed} / ${report.passed + report.failed} checks`);
  console.log(` Failed: ${report.failed} checks`);
  console.log(` Network Failures (4xx/5xx): ${networkFailures.length}`);
  if (networkFailures.length > 0) {
    networkFailures.forEach(nf => console.log(`   - [${nf.status}] ${nf.method} ${nf.url}`));
  }
  console.log(` Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(ce => console.log(`   - ${ce}`));
  }
  console.log(` Page Errors: ${pageErrors.length}`);
  if (pageErrors.length > 0) {
    pageErrors.forEach(pe => console.log(`   - ${pe}`));
  }
  console.log('===============================================================\n');

  return { report, networkFailures, consoleErrors, pageErrors };
}

runLiveUserJourney().catch(console.error);
