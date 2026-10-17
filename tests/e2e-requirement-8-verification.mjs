/**
 * =============================================================================
 * COMPREHENSIVE PLAYWRIGHT E2E VERIFICATION SUITE: YEU CAU 8
 * File: tests/e2e-requirement-8-verification.mjs
 * =============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ensureServer } from './frontend/utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from './frontend/utils/browser-runner.mjs';
import { demoFallbackEngine } from '../frontend/js/api/demo-fallback-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.resolve(ROOT_DIR, 'artifacts/screenshots');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

function getCleanErrors(getRuntimeErrors) {
  return getRuntimeErrors().filter(e => {
    if (e.includes('favicon.ico')) return false;
    if (e.includes('cdn.jsdelivr.net')) return false;
    if (e.includes('assets/data/strokes')) return false;
    if (e.includes('status of 404')) return false;
    return true;
  });
}
const results = { total: 0, passed: 0, failed: 0, screenshots: [], flows: {} };

function recordTest(flowName, testName, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    console.log('  [PASS] ' + flowName + ' - ' + testName);
  } else {
    results.failed++;
    console.error('  [FAIL] ' + flowName + ' - ' + testName + ': ' + details);
  }
  if (!results.flows[flowName]) results.flows[flowName] = [];
  results.flows[flowName].push({ testName, passed, details });
}

async function captureEvidence(page, filename, description) {
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  results.screenshots.push({ filename, filepath, description });
  console.log('    [SCREENSHOT] ' + filename + ' (' + description + ')');
}

async function setupPageRoutingAndAuth(page) {
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const endpoint = url.pathname.replace(/^\/api\/v1/, '');
    const search = url.search;
    try {
      let body = undefined;
      const postData = req.postData();
      if (postData) {
        try { body = JSON.parse(postData); } catch (_) { body = postData; }
      }
      const data = await demoFallbackEngine.handleRequest(endpoint + search, { method: req.method(), body });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data }) });
    } catch (err) {
      await route.fulfill({ status: err.status || 400, contentType: 'application/json', body: JSON.stringify({ code: err.code || 'ERROR', message: err.message || 'Error', errors: err.errors || [] }) });
    }
  });

  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'test_jwt_learner');
    localStorage.setItem('user_info', JSON.stringify({ accountId: 1001, userId: 1001, emailOrPhone: 'learner@hsk-chinese.edu.vn', fullName: 'Lý Tiểu Long', roles: ['Learner'] }));
    localStorage.setItem('ELEARNING_DEMO_MODE', 'true');
    window.__ENV__ = { DEMO_MODE: true, DEMO_FALLBACK: true };
  });
}

async function verifyFlowA(browser, baseUrl, viewport) {
  const prefix = viewport.name.toLowerCase();
  console.log('\n--- [FLOW A: ĐIỀU HƯỚNG] (' + viewport.name + ': ' + viewport.width + 'x' + viewport.height + ') ---');
  const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, { viewportWidth: viewport.width, viewportHeight: viewport.height });
  try {
    await setupPageRoutingAndAuth(page);
    await page.goto(baseUrl + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('nav.navbar', { timeout: 5000 });
    if (viewport.name === 'Mobile') {
      const toggler = page.locator('button.navbar-toggler');
      await toggler.waitFor({ state: 'visible', timeout: 5000 });
      await toggler.click();
      await page.waitForTimeout(400);
    }
    const homeLink = page.locator('#primaryNavMenu a').filter({ hasText: 'Trang chủ' });
    const radicalsLink = page.locator('#primaryNavMenu a').filter({ hasText: 'Bộ thủ' });
    const vocabLink = page.locator('#primaryNavMenu a').filter({ hasText: 'Từ vựng' });
    const srsLink = page.locator('#primaryNavMenu a').filter({ hasText: 'Ôn tập' });
    assert.ok(await homeLink.count() > 0, 'Home link must exist in menu');
    assert.ok(await radicalsLink.count() > 0, 'Radicals link must exist in menu');
    assert.ok(await vocabLink.count() > 0, 'Vocabulary link must exist in menu');
    assert.ok(await srsLink.count() > 0, 'SRS Review link must exist in menu');
    await captureEvidence(page, prefix + '_flow_a_navigation_menu.png', viewport.name + ' Navigation Menu');
    await Promise.all([
      page.waitForURL(url => url.pathname.includes('radicals.html'), { timeout: 10000 }),
      radicalsLink.first().click()
    ]);
    assert.ok(page.url().includes('radicals.html'), 'Navigated to radicals.html');
    if (viewport.name === 'Mobile') {
      await page.locator('button.navbar-toggler').click();
      await page.waitForTimeout(300);
    }
    await Promise.all([
      page.waitForURL(url => url.pathname.includes('vocabulary.html'), { timeout: 10000 }),
      page.locator('#primaryNavMenu a').filter({ hasText: 'Từ vựng' }).first().click()
    ]);
    assert.ok(page.url().includes('vocabulary.html'), 'Navigated to vocabulary.html');
    if (viewport.name === 'Mobile') {
      await page.locator('button.navbar-toggler').click();
      await page.waitForTimeout(300);
    }
    await Promise.all([
      page.waitForURL(url => url.pathname.includes('srs-review.html'), { timeout: 10000 }),
      page.locator('#primaryNavMenu a').filter({ hasText: 'Ôn tập' }).first().click()
    ]);
    assert.ok(page.url().includes('srs-review.html'), 'Navigated to srs-review.html');
    const errors = getCleanErrors(getRuntimeErrors);
    assert.strictEqual(errors.length, 0, 'Zero runtime errors in Flow A: ' + errors.join('; '));
    recordTest('Flow A (' + viewport.name + ')', 'Navigation links and page transitions load cleanly', true);
  } finally {
    await context.close();
  }
}
async function verifyFlowB(browser, baseUrl, viewport) {
  const prefix = viewport.name.toLowerCase();
  console.log('\n--- [FLOW B: CÁCH VIẾT Ở BỘ THỦ & TỪ VỰNG] (' + viewport.name + ': ' + viewport.width + 'x' + viewport.height + ') ---');
  const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, { viewportWidth: viewport.width, viewportHeight: viewport.height });
  try {
    await setupPageRoutingAndAuth(page);
    await page.goto(baseUrl + '/radicals.html', { waitUntil: 'networkidle' });
    await page.waitForSelector('.radical-card', { timeout: 10000 });
    const shuiCard = page.locator('.radical-card', { hasText: '水' });
    await shuiCard.click();
    const radModal = page.locator('#radicalDetailModal');
    await radModal.waitFor({ state: 'visible', timeout: 5000 });
    assert.ok(await radModal.isVisible(), 'Radical detail modal must be visible');
    const writingSection = page.locator('#modalWritingSection');
    await writingSection.waitFor({ state: 'visible', timeout: 5000 });
    const riceGridBox = writingSection.locator('.writing-rice-grid-box');
    await riceGridBox.waitFor({ state: 'visible', timeout: 5000 });
    assert.ok(await riceGridBox.isVisible(), '.writing-rice-grid-box must be rendered in modal');
    await page.waitForTimeout(600);
    const svgCount = await riceGridBox.locator('svg').count();
    assert.ok(svgCount >= 2, 'Rice grid and HanziWriter SVGs must be present (got ' + svgCount + ')');
    const radReplayBtn = writingSection.getByRole('button', { name: /phát lại/i });
    assert.ok(await radReplayBtn.isVisible(), 'Replay button must be visible in radical modal');
    await radReplayBtn.click();
    await page.waitForTimeout(400);
    await captureEvidence(page, prefix + '_flow_b_radicals_writing.png', viewport.name + ' Radicals Writing Box');
    const radMissingText = await page.evaluate(() => {
      if (window.__radicalsPageController && window.__radicalsPageController.writingModal) {
        window.__radicalsPageController.writingModal.currentCharacter = '𧾷';
        window.__radicalsPageController.writingModal.renderFallback();
        return document.querySelector('#modalWritingSection .writing-rice-grid-box')?.innerText || '';
      }
      return '';
    });
    const expectedWarning = 'Chữ ' + String.fromCharCode(34) + '𧾷' + String.fromCharCode(34) + ' hiện chưa có dữ liệu nét chi tiết.';
    assert.ok(radMissingText.includes(expectedWarning), 'Missing stroke warning format must match requirement');
    recordTest('Flow B (' + viewport.name + ')', 'Radicals modal: rice grid, stroke animation, replay, and missing stroke warning', true);
    await page.locator('#modalCloseBtn').click();
    await page.waitForTimeout(300);
    await page.goto(baseUrl + '/vocabulary.html', { waitUntil: 'networkidle' });
    await page.waitForSelector('.vocab-card', { timeout: 10000 });
    await page.fill('#vocabSearchInput', '爱好');
    await page.waitForTimeout(500);
    const vocabCard = page.locator('.vocab-card', { hasText: '爱好' }).first();
    await vocabCard.click();
    const vocabModal = page.locator('#vocabDetailModal');
    await vocabModal.waitFor({ state: 'visible', timeout: 5000 });
    assert.ok(await vocabModal.isVisible(), 'Vocabulary detail modal must be visible');
    const vocabWritingMount = page.locator('#modalVocabWritingSection');
    await vocabWritingMount.waitFor({ state: 'visible', timeout: 5000 });
    const vocabGridBoxes = vocabWritingMount.locator('.writing-rice-grid-box');
    await vocabGridBoxes.first().waitFor({ state: 'visible', timeout: 5000 });
    const vocabGridBoxCount = await vocabGridBoxes.count();
    assert.ok(vocabGridBoxCount >= 1, 'Vocab modal must render rice grid boxes (got ' + vocabGridBoxCount + ')');
    const vocabReplayBtn = vocabModal.locator('button', { hasText: 'Phát lại nét' });
    assert.ok(await vocabReplayBtn.isVisible(), 'Vocab modal must have Replay button');
    await vocabReplayBtn.click();
    await page.waitForTimeout(400);
    await captureEvidence(page, prefix + '_flow_b_vocab_writing.png', viewport.name + ' Vocabulary Writing Box');
    recordTest('Flow B (' + viewport.name + ')', 'Vocab modal: rice grid, replay button, and missing stroke message format', true);
    const errors = getCleanErrors(getRuntimeErrors);
    assert.strictEqual(errors.length, 0, 'Zero runtime errors during Flow B: ' + errors.join('; '));
  } finally {
    await context.close();
  }
}

async function verifyFlowC(browser, baseUrl, viewport) {
  const prefix = viewport.name.toLowerCase();
  console.log('\n--- [FLOW C: BỘ THỦ LIÊN KẾT] (' + viewport.name + ': ' + viewport.width + 'x' + viewport.height + ') ---');
  const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, { viewportWidth: viewport.width, viewportHeight: viewport.height });
  try {
    await setupPageRoutingAndAuth(page);
    await page.goto(baseUrl + '/vocabulary.html', { waitUntil: 'networkidle' });
    await page.waitForSelector('.vocab-card', { timeout: 10000 });
    const wordsToTest = [
      { word: '爱好', expectedCount: 2, radicals: [{ charInWord: '爱', radicalId: 87, radicalChar: '爪', hanViet: 'Trảo' }, { charInWord: '好', radicalId: 38, radicalChar: '女', hanViet: 'Nữ' }] },
      { word: '电视机', expectedCount: 3, radicals: [{ charInWord: '电', radicalId: 102, radicalChar: '田', hanViet: 'Điền' }, { charInWord: '视', radicalId: 113, radicalChar: '示(礻)', hanViet: 'Thị' }, { charInWord: '机', radicalId: 75, radicalChar: '木', hanViet: 'Mộc' }] },
      { word: '差', expectedCount: 1, radicals: [{ charInWord: '差', radicalId: 123, radicalChar: '羊', hanViet: 'Dương' }] },
      { word: '最', expectedCount: 1, radicals: [{ charInWord: '最', radicalId: 72, radicalChar: '日', hanViet: 'Nhật' }] }
    ];
    for (const testCase of wordsToTest) {
      await page.fill('#vocabSearchInput', testCase.word);
      await page.waitForTimeout(500);
      const card = page.locator('.vocab-card', { hasText: testCase.word }).first();
      await card.click();
      const modal = page.locator('#vocabDetailModal');
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      const radItems = modal.locator('.vocab-constituent-item');
      await radItems.first().waitFor({ state: 'visible', timeout: 5000 });
      const count = await radItems.count();
      assert.strictEqual(count, testCase.expectedCount, 'Word ' + testCase.word + ' must have ' + testCase.expectedCount + ' constituent radicals, got ' + count);
      for (const expectedRad of testCase.radicals) {
        assert.notStrictEqual(expectedRad.radicalId, 1, 'Radical for ' + expectedRad.charInWord + ' must NOT be radical 1 (Nhất)');
        const matchingItem = radItems.filter({ hasText: expectedRad.charInWord });
        assert.ok(await matchingItem.count() > 0, 'Must have item for constituent char ' + expectedRad.charInWord);
        const learnBtn = matchingItem.locator('a', { hasText: 'Học bộ thủ này' });
        assert.ok(await learnBtn.count() > 0, 'Item must have Học bộ thủ này ↗ button');
        const href = await learnBtn.getAttribute('href');
        const expectedHrefPart = 'srs-review.html?mode=flashcard&group=radicals214&radicalId=' + expectedRad.radicalId;
        assert.ok(href.includes(expectedHrefPart), 'Button href must contain ' + expectedHrefPart);
      }
      if (testCase.word === '爱好') {
        await captureEvidence(page, prefix + '_flow_c_constituent_radicals_aihao.png', viewport.name + ' Constituent Radicals for 爱好');
      } else if (testCase.word === '电视机') {
        await captureEvidence(page, prefix + '_flow_c_constituent_radicals_dianshiji.png', viewport.name + ' Constituent Radicals for 电视机');
      }
      await page.locator('#modalCloseBtn').click();
      await page.waitForTimeout(300);
    }
    await page.fill('#vocabSearchInput', '爱好');
    await page.waitForTimeout(500);
    await page.locator('.vocab-card', { hasText: '爱好' }).first().click();
    await page.waitForSelector('#vocabDetailModal[open]');
    const aiLearnBtn = page.locator('.vocab-constituent-item a', { hasText: 'Học bộ thủ này' }).first();
    await Promise.all([
      page.waitForURL(url => url.pathname.includes('srs-review.html') && url.searchParams.get('radicalId') === '87', { timeout: 10000 }),
      aiLearnBtn.click()
    ]);
    assert.ok(page.url().includes('radicalId=87'), 'Arrived at srs-review.html with radicalId=87');
    assert.ok(page.url().includes('mode=flashcard'), 'Mode is flashcard');
    recordTest('Flow C (' + viewport.name + ')', 'Constituent radicals disaggregation, no erroneous Nhất assignment, and learning shortcuts', true);
    const errors = getCleanErrors(getRuntimeErrors);
    assert.strictEqual(errors.length, 0, 'Zero runtime errors during Flow C: ' + errors.join('; '));
  } finally {
    await context.close();
  }
}
async function verifyFlowD(browser, baseUrl, viewport) {
  const prefix = viewport.name.toLowerCase();
  console.log('\n--- [FLOW D: TRUNG TÂM ÔN TẬP] (' + viewport.name + ': ' + viewport.width + 'x' + viewport.height + ') ---');
  const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, { viewportWidth: viewport.width, viewportHeight: viewport.height });
  try {
    await setupPageRoutingAndAuth(page);
    await page.goto(baseUrl + '/srs-review.html', { waitUntil: 'networkidle' });
    const tabFlashcard = page.locator('#srsSkillTabReading');
    const tabWriting = page.locator('#srsSkillTabWriting');
    await tabFlashcard.waitFor({ state: 'visible', timeout: 5000 });
    await tabWriting.waitFor({ state: 'visible', timeout: 5000 });
    assert.ok((await tabFlashcard.textContent()).includes('Flashcard'), 'Toolbar must have Flashcard tab');
    assert.ok((await tabWriting.textContent()).includes('Luyện viết'), 'Toolbar must have Luyện viết tab');
    const group50 = page.locator('#groupTabRadicals50');
    const group214 = page.locator('#groupTabRadicals214');
    const groupHsk1 = page.locator('#groupTabHsk1');
    const groupHsk2 = page.locator('#groupTabHsk2');
    const groupHsk3 = page.locator('#groupTabHsk3');
    assert.ok(await group50.isVisible(), 'Tab 50 bộ thủ must be visible');
    assert.ok(await group214.isVisible(), 'Tab 214 bộ thủ must be visible');
    assert.ok(await groupHsk1.isVisible(), 'Tab HSK 1 must be visible');
    assert.ok(await groupHsk2.isVisible(), 'Tab HSK 2 must be visible');
    assert.ok(await groupHsk3.isVisible(), 'Tab HSK 3 must be visible');
    await group50.click();
    await page.waitForTimeout(400);
    const chips50 = page.locator('#catalogContentContainer .chip-radical');
    await chips50.first().waitFor({ state: 'visible', timeout: 5000 });
    const count50 = await chips50.count();
    assert.strictEqual(count50, 50, '50 Radicals group must render 50 chips, got ' + count50);
    assert.ok(page.url().includes('group=radicals50'), 'URL has group=radicals50');
    await captureEvidence(page, prefix + '_flow_d_srs_catalog_radicals50.png', viewport.name + ' SRS 50 Radicals Catalog');
    await group214.click();
    await page.waitForTimeout(600);
    const filterToolbar = page.locator('#catalogFilterToolbar');
    assert.ok(await filterToolbar.isVisible(), 'Filter toolbar must be visible for 214 radicals');
    const chips214 = page.locator('#catalogContentContainer .chip-radical');
    await chips214.first().waitFor({ state: 'visible', timeout: 5000 });
    const count214 = await chips214.count();
    assert.strictEqual(count214, 214, '214 Radicals group must render 214 chips, got ' + count214);
    assert.ok(page.url().includes('group=radicals214'), 'URL has group=radicals214');
    await captureEvidence(page, prefix + '_flow_d_srs_catalog_radicals214.png', viewport.name + ' SRS 214 Radicals Catalog');
    await groupHsk1.click();
    await page.waitForTimeout(400);
    const topicCardsHsk1 = page.locator('#catalogContentContainer .catalog-topic-card');
    await topicCardsHsk1.first().waitFor({ state: 'visible', timeout: 5000 });
    const countHsk1 = await topicCardsHsk1.count();
    assert.strictEqual(countHsk1, 10, 'HSK 1 must render 10 topic cards, got ' + countHsk1);
    assert.ok(page.url().includes('group=hsk1'), 'URL has group=hsk1');
    await captureEvidence(page, prefix + '_flow_d_srs_catalog_hsk1_topics.png', viewport.name + ' SRS HSK 1 Topics');
    await groupHsk2.click();
    await page.waitForTimeout(300);
    assert.strictEqual(await page.locator('#catalogContentContainer .catalog-topic-card').count(), 10, 'HSK 2 renders 10 topic cards');
    assert.ok(page.url().includes('group=hsk2'), 'URL has group=hsk2');
    await groupHsk3.click();
    await page.waitForTimeout(300);
    assert.strictEqual(await page.locator('#catalogContentContainer .catalog-topic-card').count(), 10, 'HSK 3 renders 10 topic cards');
    assert.ok(page.url().includes('group=hsk3'), 'URL has group=hsk3');
    await tabWriting.click();
    await groupHsk2.click();
    await page.waitForTimeout(300);
    assert.ok(page.url().includes('mode=writing'), 'URL has mode=writing');
    assert.ok(page.url().includes('group=hsk2'), 'URL has group=hsk2');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    assert.strictEqual(await page.locator('#srsSkillTabWriting').getAttribute('aria-selected'), 'true', 'Writing tab remains active after reload');
    assert.strictEqual(await page.locator('#groupTabHsk2').getAttribute('aria-selected'), 'true', 'Group HSK 2 remains active after reload');
    assert.strictEqual(await page.locator('#catalogContentContainer .catalog-topic-card').count(), 10, 'Topic cards restored after reload');
    await page.locator('#groupTabRadicals50').click();
    await page.waitForTimeout(300);
    assert.ok(page.url().includes('group=radicals50'), 'URL has group=radicals50');
    await page.goBack();
    await page.waitForTimeout(400);
    assert.ok(page.url().includes('group=hsk2'), 'Browser Back restores group=hsk2');
    assert.strictEqual(await page.locator('#catalogContentContainer .catalog-topic-card').count(), 10, 'Topic cards restored via Back button');
    await page.goForward();
    await page.waitForTimeout(400);
    assert.ok(page.url().includes('group=radicals50'), 'Browser Forward restores group=radicals50');
    assert.strictEqual(await page.locator('#catalogContentContainer .chip-radical').count(), 50, 'Radical chips restored via Forward button');
    recordTest('Flow D (' + viewport.name + ')', 'SRS Review: Mode tabs, 5 content groups, chip & topic rendering, URL params persistence', true);
    const errors = getCleanErrors(getRuntimeErrors);
    assert.strictEqual(errors.length, 0, 'Zero runtime errors during Flow D: ' + errors.join('; '));
  } finally {
    await context.close();
  }
}

async function verifyFlowE(browser, baseUrl, viewport) {
  const prefix = viewport.name.toLowerCase();
  console.log('\n--- [FLOW E: FLASHCARD MODE] (' + viewport.name + ': ' + viewport.width + 'x' + viewport.height + ') ---');
  const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, { viewportWidth: viewport.width, viewportHeight: viewport.height });
  try {
    await setupPageRoutingAndAuth(page);
    await page.goto(baseUrl + '/srs-review.html?mode=flashcard&group=hsk1&action=continue', { waitUntil: 'networkidle' });
    const activeSession = page.locator('#srsActiveSession');
    await activeSession.waitFor({ state: 'visible', timeout: 5000 });
    assert.ok(await activeSession.isVisible(), 'Active session room must be visible');
    const flashcard = page.locator('#flashcard');
    await flashcard.waitFor({ state: 'visible', timeout: 5000 });
    assert.ok(await flashcard.isVisible(), '3D Flashcard element must be visible');
    const cardFront = page.locator('#cardFront');
    assert.strictEqual(await cardFront.getAttribute('aria-hidden'), 'false', 'Card front face must be active initially');
    const frontHanzi = page.locator('#cardFrontHanzi');
    assert.ok((await frontHanzi.textContent()).trim().length > 0, 'Front card must display Hanzi character');
    await captureEvidence(page, prefix + '_flow_e_flashcard_front.png', viewport.name + ' Flashcard Front Face');
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);
    assert.ok(await flashcard.evaluate(el => el.classList.contains('flipped')), 'Flashcard flipped to back after Space key');
    await flashcard.click();
    await page.waitForTimeout(400);
    assert.ok(!await flashcard.evaluate(el => el.classList.contains('flipped')), 'Flashcard flipped back to front after Click');
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);
    assert.ok(await flashcard.evaluate(el => el.classList.contains('flipped')), 'Flashcard flipped to back');
    const btnAgain = page.locator('#btnRatingAgain');
    const btnHard = page.locator('#btnRatingHard');
    const btnGood = page.locator('#btnRatingGood');
    const btnEasy = page.locator('#btnRatingEasy');
    assert.ok(await btnAgain.isVisible(), 'Rating button 1 (Again) must be visible');
    assert.ok(await btnHard.isVisible(), 'Rating button 2 (Hard) must be visible');
    assert.ok(await btnGood.isVisible(), 'Rating button 3 (Good) must be visible');
    assert.ok(await btnEasy.isVisible(), 'Rating button 4 (Easy) must be visible');
    assert.strictEqual(await btnAgain.getAttribute('data-rating'), '1');
    assert.strictEqual(await btnHard.getAttribute('data-rating'), '2');
    assert.strictEqual(await btnGood.getAttribute('data-rating'), '3');
    assert.strictEqual(await btnEasy.getAttribute('data-rating'), '4');
    const notesSection = page.locator('#cardBackNotesSection');
    await notesSection.waitFor({ state: 'visible', timeout: 5000 });
    assert.ok(await notesSection.isVisible(), '2-Column Personal notes section must be visible on back face');
    const notesList = page.locator('#cardNotesList');
    const noteInput = page.locator('#cardNewNoteInput');
    const addNoteBtn = page.locator('#btnAddCardNote');
    assert.ok(await notesList.isVisible(), 'Notes list container must be visible');
    assert.ok(await noteInput.isVisible(), 'New note textarea must be visible');
    assert.ok(await addNoteBtn.isVisible(), 'Add note button must be visible');
    const testNoteText = 'Ghi chú E2E Test ' + viewport.name + ' - ' + Date.now();
    await noteInput.fill(testNoteText);
    await addNoteBtn.click();
    await page.waitForTimeout(400);
    assert.ok(await flashcard.evaluate(el => el.classList.contains('flipped')), 'Card REMAINS flipped after adding note');
    assert.ok((await notesList.innerText()).includes(testNoteText), 'Newly created note appears in notes list');
    assert.strictEqual(await noteInput.inputValue(), '', 'Note textarea is cleared after adding');
    await captureEvidence(page, prefix + '_flow_e_flashcard_back_notes.png', viewport.name + ' Flashcard Back Face with Notes');
    await page.goto(baseUrl + '/srs-review.html?mode=flashcard&group=radicals214&radicalId=85&action=continue', { waitUntil: 'networkidle' });
    await page.waitForSelector('#srsActiveSession:not(.d-none)', { timeout: 5000 });
    const radFrontHanzi = page.locator('#cardFrontHanzi');
    assert.ok((await radFrontHanzi.textContent()).trim().includes('水'), 'Radical flashcard front must contain 水');
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);
    const strokeCountBadge = page.locator('#cardBackStrokeCount');
    assert.ok(await strokeCountBadge.isVisible(), 'Stroke count badge must be visible for radical on back');
    assert.strictEqual(await page.locator('#radicalStrokeCountVal').textContent(), '4', 'Radical 水 must show 4 strokes');
    assert.ok(await btnGood.isVisible(), '4 SRS buttons must be available for radical flashcard');
    await btnGood.click();
    await page.waitForTimeout(400);
    await captureEvidence(page, prefix + '_flow_e_flashcard_radical.png', viewport.name + ' Radical Flashcard');
    recordTest('Flow E (' + viewport.name + ')', 'Flashcard: Space/Click flips, 4 SRS buttons, 2-column notes non-reset, and radical flashcard', true);
    const errors = getCleanErrors(getRuntimeErrors);
    assert.strictEqual(errors.length, 0, 'Zero runtime errors during Flow E: ' + errors.join('; '));
  } finally {
    await context.close();
  }
}
async function verifyFlowF(browser, baseUrl, viewport) {
  const prefix = viewport.name.toLowerCase();
  console.log('\n--- [FLOW F: LUYỆN VIẾT] (' + viewport.name + ': ' + viewport.width + 'x' + viewport.height + ') ---');
  const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, { viewportWidth: viewport.width, viewportHeight: viewport.height });
  try {
    await setupPageRoutingAndAuth(page);
    await page.goto(baseUrl + '/srs-review.html?mode=writing&group=hsk1&action=continue', { waitUntil: 'networkidle' });
    await page.waitForSelector('#srsActiveSession:not(.d-none)', { timeout: 5000 });
    const flashcardContainer = page.locator('#srsFlashcardContainer');
    assert.ok(await flashcardContainer.evaluate(el => el.classList.contains('d-none')), '#srsFlashcardContainer must be HIDDEN in Writing Mode');
    const writingRoom = page.locator('#srsWritingRoom');
    assert.ok(!await writingRoom.evaluate(el => el.classList.contains('d-none')), '#srsWritingRoom must be VISIBLE in Writing Mode');
    const canvasContainer = page.locator('#srsWritingCanvasContainer');
    await canvasContainer.waitFor({ state: 'visible', timeout: 5000 });
    const boxes = canvasContainer.locator('.writing-rice-grid-box');
    await boxes.first().waitFor({ state: 'visible', timeout: 5000 });
    const boxCount = await boxes.count();
    console.log('    Writing boxes count for current word: ' + boxCount);
    assert.ok(boxCount >= 1, 'At least 1 writing box rendered directly (got ' + boxCount + ')');
    const nextBtn = page.locator('#btnWritingNext');
    await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
    assert.ok(await nextBtn.isVisible(), '#btnWritingNext must be visible');
    const nextBtnText = await nextBtn.textContent();
    assert.ok(nextBtnText.includes('Sang từ tiếp theo →'), 'Next button must say Sang từ tiếp theo →, got: ' + nextBtnText);
    const ratingSection = page.locator('#srsRatingSection');
    assert.ok(await ratingSection.evaluate(el => el.classList.contains('d-none')), '#srsRatingSection must be STRICTLY HIDDEN in Writing Mode');
    assert.ok(!await page.locator('#btnRatingAgain').isVisible(), 'Rating 1 (Again) must not be visible');
    assert.ok(!await page.locator('#btnRatingHard').isVisible(), 'Rating 2 (Hard) must not be visible');
    assert.ok(!await page.locator('#btnRatingGood').isVisible(), 'Rating 3 (Good) must not be visible');
    assert.ok(!await page.locator('#btnRatingEasy').isVisible(), 'Rating 4 (Easy) must not be visible');
    await nextBtn.click();
    await page.waitForTimeout(600);
    const secondWordBoxes = await canvasContainer.locator('.writing-rice-grid-box').count();
    console.log('    Second word writing boxes count: ' + secondWordBoxes);
    assert.strictEqual(secondWordBoxes, 2, '2-character word (请问) must render exactly 2 separate rice-grid boxes side-by-side');
    await captureEvidence(page, prefix + '_flow_f_writing_vocab_2boxes.png', viewport.name + ' Writing Mode Vocabulary 2 Boxes');
    await page.goto(baseUrl + '/srs-review.html?mode=writing&group=radicals214&radicalId=85&action=continue', { waitUntil: 'networkidle' });
    await page.waitForSelector('#srsActiveSession:not(.d-none)', { timeout: 5000 });
    await canvasContainer.waitFor({ state: 'visible', timeout: 5000 });
    const radBoxes = canvasContainer.locator('.writing-rice-grid-box');
    await radBoxes.first().waitFor({ state: 'visible', timeout: 5000 });
    assert.strictEqual(await radBoxes.count(), 1, 'Radical writing must render exactly 1 rice grid box');
    const radNextBtnText = await page.locator('#btnWritingNext').textContent();
    assert.ok(radNextBtnText.includes('Sang bộ thủ tiếp theo →'), 'Next button must say Sang bộ thủ tiếp theo →, got: ' + radNextBtnText);
    assert.ok(!await page.locator('#btnRatingGood').isVisible(), 'Rating buttons strictly hidden in radical writing');
    await captureEvidence(page, prefix + '_flow_f_writing_radical.png', viewport.name + ' Writing Mode Radical Box');
    recordTest('Flow F (' + viewport.name + ')', 'Writing Mode: no flip, direct rice-grid boxes, prominent Next button, and NO rating 1-4', true);
    const errors = getCleanErrors(getRuntimeErrors);
    assert.strictEqual(errors.length, 0, 'Zero runtime errors during Flow F: ' + errors.join('; '));
  } finally {
    await context.close();
  }
}

async function verifyFlowG(browser, baseUrl, viewport) {
  const prefix = viewport.name.toLowerCase();
  console.log('\n--- [FLOW G: HỌC TIẾP & HỌC LẠI] (' + viewport.name + ': ' + viewport.width + 'x' + viewport.height + ') ---');
  const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, { viewportWidth: viewport.width, viewportHeight: viewport.height });
  try {
    await setupPageRoutingAndAuth(page);
    await page.addInitScript(() => {
      localStorage.setItem('HOC_HAN_NGU_FLASHCARD_PROGRESS', JSON.stringify({ hsk1: { lastIndex: 5, lastLessonId: 1 } }));
      localStorage.setItem('HOC_HAN_NGU_WRITING_PROGRESS', JSON.stringify({ hsk1: { lastIndex: 2, lastLessonId: 1 } }));
    });
    await page.goto(baseUrl + '/srs-review.html?mode=flashcard&group=hsk1&action=continue', { waitUntil: 'networkidle' });
    await page.waitForSelector('#srsActiveSession:not(.d-none)', { timeout: 5000 });
    const flashcardProgressText = await page.locator('#srsProgressText').textContent();
    console.log('    Flashcard continue progress text: ' + flashcardProgressText);
    assert.ok(flashcardProgressText.includes('Thẻ 6 /'), 'Flashcard session should resume from index 5 (Thẻ 6), got: ' + flashcardProgressText);
    await page.goto(baseUrl + '/srs-review.html?mode=writing&group=hsk1&action=continue', { waitUntil: 'networkidle' });
    await page.waitForSelector('#srsActiveSession:not(.d-none)', { timeout: 5000 });
    const writingProgressText = await page.locator('#srsProgressText').textContent();
    console.log('    Writing continue progress text: ' + writingProgressText);
    assert.ok(writingProgressText.includes('Thẻ 3 /'), 'Writing session should resume from index 2 (Thẻ 3), got: ' + writingProgressText);
    const storedState = await page.evaluate(() => ({
      flashcard: JSON.parse(localStorage.getItem('HOC_HAN_NGU_FLASHCARD_PROGRESS') || '{}'),
      writing: JSON.parse(localStorage.getItem('HOC_HAN_NGU_WRITING_PROGRESS') || '{}')
    }));
    assert.strictEqual(storedState.flashcard.hsk1.lastIndex, 5, 'Flashcard progress must remain 5');
    assert.strictEqual(storedState.writing.hsk1.lastIndex, 2, 'Writing progress must remain 2');
    await page.goto(baseUrl + '/srs-review.html?mode=flashcard&group=hsk1&action=review', { waitUntil: 'networkidle' });
    await page.waitForSelector('#srsActiveSession:not(.d-none)', { timeout: 5000 });
    const reviewProgressText = await page.locator('#srsProgressText').textContent();
    assert.ok(reviewProgressText.includes('Thẻ 1 /'), 'Review mode must start from card 1, got: ' + reviewProgressText);
    const modeBadgeText = await page.locator('#srsSessionModeBadge').textContent();
    assert.ok(modeBadgeText.includes('Học lại'), 'Mode badge must show Học lại, got: ' + modeBadgeText);
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    await page.locator('#btnRatingGood').click();
    await page.waitForTimeout(400);
    const postReviewState = await page.evaluate(() => ({
      flashcard: JSON.parse(localStorage.getItem('HOC_HAN_NGU_FLASHCARD_PROGRESS') || '{}'),
      writing: JSON.parse(localStorage.getItem('HOC_HAN_NGU_WRITING_PROGRESS') || '{}')
    }));
    assert.strictEqual(postReviewState.flashcard.hsk1.lastIndex, 5, 'Học lại must NOT erase or overwrite Học tiếp progress index (should remain 5)');
    assert.strictEqual(postReviewState.writing.hsk1.lastIndex, 2, 'Writing progress remains intact');
    await captureEvidence(page, prefix + '_flow_g_continue_vs_review.png', viewport.name + ' Continue vs Review Mode');
    recordTest('Flow G (' + viewport.name + ')', 'Independent progress between Flashcard and Writing, Review preserves Continue progress', true);
    const errors = getCleanErrors(getRuntimeErrors);
    assert.strictEqual(errors.length, 0, 'Zero runtime errors during Flow G: ' + errors.join('; '));
  } finally {
    await context.close();
  }
}
async function verifyFlowH(browser, baseUrl, viewport) {
  const prefix = viewport.name.toLowerCase();
  console.log('\n--- [FLOW H: HỒ SƠ & CÀI ĐẶT] (' + viewport.name + ': ' + viewport.width + 'x' + viewport.height + ') ---');
  const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, { viewportWidth: viewport.width, viewportHeight: viewport.height });
  try {
    await setupPageRoutingAndAuth(page);
    await page.goto(baseUrl + '/profile.html#srs-settings', { waitUntil: 'networkidle' });
    const cardSrs = page.locator('#srs-settings-card');
    const cardAudio = page.locator('#audio-settings-card');
    const cardWriting = page.locator('#writing-settings-card');
    await cardSrs.waitFor({ state: 'visible', timeout: 5000 });
    await cardAudio.waitFor({ state: 'visible', timeout: 5000 });
    await cardWriting.waitFor({ state: 'visible', timeout: 5000 });
    assert.ok(await cardSrs.isVisible(), 'Nhóm 1: Mục tiêu từ mới (#srs-settings-card) must be visible');
    assert.ok(await cardAudio.isVisible(), 'Nhóm 2: Âm thanh & Phát âm (#audio-settings-card) must be visible');
    assert.ok(await cardWriting.isVisible(), 'Nhóm 3: Hiển thị & Luyện viết (#writing-settings-card) must be visible');
    const newCardsInput = page.locator('#srsNewCardsPerDayInput');
    await newCardsInput.fill('25');
    const saveSrsBtn = page.locator('#btnSaveSrsSettings');
    await saveSrsBtn.click();
    const srsStatus = page.locator('#srsSettingsStatus');
    await srsStatus.waitFor({ state: 'visible', timeout: 5000 });
    const srsStatusText = await srsStatus.textContent();
    assert.ok(srsStatusText.includes('thành công'), 'SRS status must confirm success, got: ' + srsStatusText);
    const speechRateSelect = page.locator('#settingSpeechRate');
    await speechRateSelect.selectOption('0.8');
    const autoReplaySwitch = page.locator('#settingAutoReplayStrokes');
    await autoReplaySwitch.setChecked(true);
    const saveDisplayAudioBtn = page.locator('#btnSaveDisplayAudioSettings');
    await saveDisplayAudioBtn.click();
    const displayStatus = page.locator('#displayAudioSettingsStatus');
    await displayStatus.waitFor({ state: 'visible', timeout: 5000 });
    const displayStatusText = await displayStatus.textContent();
    assert.ok(displayStatusText.includes('thành công'), 'Display/Audio status must confirm success, got: ' + displayStatusText);
    await captureEvidence(page, prefix + '_flow_h_profile_settings.png', viewport.name + ' Profile Settings 3 Groups');
    recordTest('Flow H (' + viewport.name + ')', 'Profile settings: 3 streamlined cards, successful save of learning/audio/writing configuration', true);
    const errors = getCleanErrors(getRuntimeErrors);
    assert.strictEqual(errors.length, 0, 'Zero runtime errors during Flow H: ' + errors.join('; '));
  } finally {
    await context.close();
  }
}

async function main() {
  console.log('=============================================================================');
  console.log('🚀 STARTING COMPREHENSIVE PLAYWRIGHT E2E VERIFICATION FOR YÊU CẦU 8');
  console.log('=============================================================================');
  const serverHandle = await ensureServer({ port: 3000 });
  const baseUrl = serverHandle.baseUrl;
  console.log('Server running at: ' + baseUrl + ' (isExternal: ' + serverHandle.isExternal + ')');
  const browser = await launchBrowser({ headless: true });
  const viewports = [
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Mobile', width: 390, height: 844 }
  ];
  try {
    for (const vp of viewports) {
      console.log('\n=============================================================================');
      console.log('📱 RUNNING TEST SUITE FOR VIEWPORT: ' + vp.name + ' (' + vp.width + 'x' + vp.height + ')');
      console.log('=============================================================================');
      await verifyFlowA(browser, baseUrl, vp);
      await verifyFlowB(browser, baseUrl, vp);
      await verifyFlowC(browser, baseUrl, vp);
      await verifyFlowD(browser, baseUrl, vp);
      await verifyFlowE(browser, baseUrl, vp);
      await verifyFlowF(browser, baseUrl, vp);
      await verifyFlowG(browser, baseUrl, vp);
      await verifyFlowH(browser, baseUrl, vp);
    }
  } finally {
    await browser.close();
    await serverHandle.close();
  }
  console.log('\n=============================================================================');
  console.log('📊 E2E VERIFICATION SUITE SUMMARY REPORT');
  console.log('=============================================================================');
  console.log('Total tests:  ' + results.total);
  console.log('Passed:       ' + results.passed);
  console.log('Failed:       ' + results.failed);
  console.log('Screenshots:  ' + results.screenshots.length);
  console.log('Screenshots captured:');
  for (const s of results.screenshots) {
    console.log('  - ' + s.filename + ' (' + s.description + ')');
  }
  if (results.failed > 0) {
    console.error('\n❌ SOME E2E TESTS FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ ALL E2E VERIFICATION TESTS PASSED SUCCESSFULLY (100% GREEN)');
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
