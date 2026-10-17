import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

function createMockResponse(items) {
  return {
    code: 'SUCCESS',
    message: 'OK',
    data: {
      page: 0,
      size: 20,
      totalElements: items.length,
      totalPages: 1,
      first: true,
      last: true,
      items
    }
  };
}

describe('Browser E2E: Vocabulary Detail Modal Refactor & Verification', () => {
  let serverHandle;
  let browser;
  let baseUrl;

  before(async () => {
    serverHandle = await ensureServer({ port: 3000 });
    baseUrl = serverHandle.baseUrl;
    browser = await launchBrowser({ headless: true });
  });

  after(async () => {
    if (browser) await browser.close();
    if (serverHandle) await serverHandle.close();
  });

  test('VMR-01: Modal Hero, Metadata Grid & Footer Removal (Desktop)', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 800
    });

    const item = {
      vocabId: 101,
      hanzi: '爱好',
      pinyin: 'àihào',
      meaningHanViet: 'Ái hảo',
      meaningVi: 'Sở thích'
    };

    const detail = {
      vocabId: 101,
      hanzi: '爱好',
      pinyin: 'àihào',
      meaningHanViet: 'Ái hảo',
      meaningVi: 'Sở thích',
      exampleSentence: '我的爱好是看书。',
      exampleTranslation: 'Sở thích của tôi là đọc sách.',
      audioUrl: null,
      radicals: [
        { radicalId: 87, character: '爪', pinyin: 'zhǎo', meaningHanViet: 'Trảo', meaningVi: 'Móng vuốt' },
        { radicalId: 38, character: '女', pinyin: 'nǚ', meaningHanViet: 'Nữ', meaningVi: 'Phụ nữ' }
      ]
    };

    try {
      await page.route('**/api/v1/vocabulary**', async (route) => {
        const url = route.request().url();
        if (url.includes('/api/v1/vocabulary/101')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 'SUCCESS', message: 'OK', data: detail })
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockResponse([item]))
        });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      const card = page.locator('.vocab-card').first();
      await card.click();

      const modal = page.locator('#vocabDetailModal');
      await modal.waitFor({ state: 'visible' });

      // 1. Hero Section verification
      const hero = modal.locator('.radical-modal-hero');
      assert.ok(await hero.isVisible(), 'Hero section must be visible');

      // Top-right close button
      const closeBtn = hero.locator('#modalCloseBtn');
      assert.ok(await closeBtn.isVisible(), 'Top-right close button must be visible');

      // Centered Hanzi
      const hanziEl = hero.locator('#modalVocabHanzi');
      assert.strictEqual(await hanziEl.innerText(), '爱好');

      // Tone-marked Pinyin directly below with speaker button next to it
      const pinyinEl = hero.locator('#modalVocabPinyin');
      assert.strictEqual(await pinyinEl.innerText(), 'àihào');
      const speechBtn = hero.locator('#modalSpeechBtn');
      assert.ok(await speechBtn.isVisible(), 'Speaker button next to Pinyin must be visible');

      // Verify NO untoned pinyin / #modalVocabPinyinRaw
      const rawPinyin = page.locator('#modalVocabPinyinRaw');
      assert.strictEqual(await rawPinyin.count(), 0, '#modalVocabPinyinRaw must be completely removed');

      // Verify visible "Từ vựng:" title line is removed from modal body
      const titleEl = modal.locator('#modalVocabTitle');
      assert.strictEqual(await titleEl.isVisible(), false, 'modalVocabTitle must be visually hidden to avoid duplicate title');

      // 2. Metadata Grid verification: exactly 2 items (Âm Hán-Việt & Nghĩa tiếng Việt)
      const metaGrid = modal.locator('.radical-modal-meta-grid');
      assert.ok(await metaGrid.isVisible(), 'Meta grid must be visible');
      const metaItems = metaGrid.locator('.radical-meta-item');
      assert.strictEqual(await metaItems.count(), 2, 'Metadata grid must contain exactly 2 items');

      const meaningLabel = metaItems.nth(1).locator('.radical-meta-label');
      assert.strictEqual((await meaningLabel.innerText()).trim().toUpperCase(), 'NGHĨA TIẾNG VIỆT');

      const hanVietVal = metaGrid.locator('#modalVocabHanViet');
      assert.strictEqual(await hanVietVal.innerText(), 'Ái hảo');
      const meaningVal = metaGrid.locator('#modalVocabMeaning');
      assert.strictEqual(await meaningVal.innerText(), 'Sở thích');

      // 3. Modal footer removal: #modalVocabNoteBtn and #modalDismissBtn must not exist
      const noteBtn = page.locator('#modalVocabNoteBtn');
      assert.strictEqual(await noteBtn.count(), 0, '#modalVocabNoteBtn must be removed');
      const dismissBtn = page.locator('#modalDismissBtn');
      assert.strictEqual(await dismissBtn.count(), 0, '#modalDismissBtn must be removed');

      // 4. Modal dismiss & focus return
      await closeBtn.click();
      await page.waitForFunction(() => {
        const m = document.getElementById('vocabDetailModal');
        return !m || !m.open;
      });

      // Verify focus returned to activating card
      const focusedTagName = await page.evaluate(() => document.activeElement ? document.activeElement.tagName.toLowerCase() : null);
      assert.strictEqual(focusedTagName, 'div', 'Focus must return to triggering card after modal close');

      const errors = getRuntimeErrors().filter(e => !e.includes('favicon'));
      assert.strictEqual(errors.length, 0, `Runtime errors:\n${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  test('VMR-02: 2-Character Word Writing Simulation (Unified Stepper Tabs on Desktop & Mobile)', async () => {
    const item = { vocabId: 102, hanzi: '爱好', pinyin: 'àihào', meaningHanViet: 'Ái hảo', meaningVi: 'Sở thích' };
    const detail = {
      vocabId: 102,
      hanzi: '爱好',
      pinyin: 'àihào',
      meaningHanViet: 'Ái hảo',
      meaningVi: 'Sở thích',
      radicals: []
    };

    // A. Desktop Viewport (Unified Stepper Tabs)
    {
      const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
        viewportWidth: 1024,
        viewportHeight: 768
      });

      try {
        await page.route('**/api/v1/vocabulary**', async (route) => {
          const url = route.request().url();
          if (url.includes('/api/v1/vocabulary/102')) {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'SUCCESS', data: detail }) });
            return;
          }
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createMockResponse([item])) });
        });

        await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.vocab-card');
        await page.locator('.vocab-card').first().click();

        const writingSection = page.locator('#modalVocabWritingSection');
        await writingSection.waitFor({ state: 'visible' });

        // Unified 2-character word renders 1 active rice grid box at a time with stepper tabs
        await page.waitForSelector('.writing-rice-grid-box');
        const gridBoxes = writingSection.locator('.writing-rice-grid-box');
        assert.strictEqual(await gridBoxes.count(), 1, 'Must render 1 active rice grid box at a time for 2-character word');

        // Check active box has floating replay button
        const replayButtons = writingSection.locator('.writing-rice-grid-box button[title="Phát lại"]');
        assert.strictEqual(await replayButtons.count(), 1, 'Active rice-grid box must have a floating replay button');

        // Check stepper is visible for 2-character word (synchronizing with 3+ character words)
        const stepper = writingSection.locator('.vocab-char-stepper');
        const isStepperVisible = await stepper.evaluate(el => !el.classList.contains('d-none'));
        assert.ok(isStepperVisible, 'Stepper tabs must be visible for 2-character word on desktop');

        const stepperBtns = stepper.locator('button');
        assert.strictEqual(await stepperBtns.count(), 2, 'Stepper must contain exactly 2 character buttons');

        // Verify button labels
        assert.ok((await stepperBtns.nth(0).innerText()).includes('Chữ 1: 爱'));
        assert.ok((await stepperBtns.nth(1).innerText()).includes('Chữ 2: 好'));

        // Switch to character 2: 好
        await stepperBtns.nth(1).click();
        await page.waitForTimeout(300);

        // Verify 1 active box is rendered for character 2
        assert.strictEqual(await gridBoxes.count(), 1, 'Still 1 active box after switching to character 2');

        // Check obsolete headers/footers are absent
        const tabList = writingSection.locator('.writing-tabs-toolbar');
        assert.strictEqual(await tabList.count(), 0, 'Tabs toolbar must be omitted in demoOnly mode');

        // Replay click test
        await replayButtons.first().click();
        await page.waitForTimeout(300);

        const errors = getRuntimeErrors().filter(e => !e.includes('favicon'));
        assert.strictEqual(errors.length, 0, 'Zero runtime errors on desktop writing');
      } finally {
        await context.close();
      }
    }

    // B. Mobile Narrow Viewport (<480px)
    {
      const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
        viewportWidth: 375,
        viewportHeight: 667
      });

      try {
        await page.route('**/api/v1/vocabulary**', async (route) => {
          const url = route.request().url();
          if (url.includes('/api/v1/vocabulary/102')) {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'SUCCESS', data: detail }) });
            return;
          }
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createMockResponse([item])) });
        });

        await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.vocab-card');
        await page.locator('.vocab-card').first().click();

        const writingSection = page.locator('#modalVocabWritingSection');
        await writingSection.waitFor({ state: 'visible' });

        // Narrow mobile renders 1 active rice grid box at a time
        await page.waitForSelector('.writing-rice-grid-box');
        const gridBoxes = writingSection.locator('.writing-rice-grid-box');
        assert.strictEqual(await gridBoxes.count(), 1, 'Narrow mobile renders 1 active rice grid box at a time');

        // Stepper buttons should be visible
        const stepper = writingSection.locator('.vocab-char-stepper');
        const isStepperVisible = await stepper.evaluate(el => !el.classList.contains('d-none'));
        assert.ok(isStepperVisible, 'Stepper must be visible on narrow mobile');

        const stepperBtns = stepper.locator('button');
        assert.strictEqual(await stepperBtns.count(), 2, 'Stepper must have buttons for both characters');

        // Switch to character 2
        await stepperBtns.nth(1).click();
        await page.waitForTimeout(300);

        // Grid box still has floating replay button
        const replayBtn = gridBoxes.locator('button[title="Phát lại"]');
        assert.ok(await replayBtn.isVisible(), 'Floating replay button must be visible');

        const errors = getRuntimeErrors().filter(e => !e.includes('favicon'));
        assert.strictEqual(errors.length, 0, 'Zero runtime errors on mobile writing');
      } finally {
        await context.close();
      }
    }
  });

  test('VMR-03: 3+ Character Words (Stepper UI) & 1-Character Words', async () => {
    // 3-character word: 对不起
    {
      const item3 = { vocabId: 104, hanzi: '对不起', pinyin: 'duìbuqǐ', meaningHanViet: 'Đối bất khởi', meaningVi: 'Xin lỗi' };
      const detail3 = {
        vocabId: 104,
        hanzi: '对不起',
        pinyin: 'duìbuqǐ',
        meaningHanViet: 'Đối bất khởi',
        meaningVi: 'Xin lỗi',
        radicals: []
      };

      const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
        viewportWidth: 1024,
        viewportHeight: 768
      });

      try {
        await page.route('**/api/v1/vocabulary**', async (route) => {
          const url = route.request().url();
          if (url.includes('/api/v1/vocabulary/104')) {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'SUCCESS', data: detail3 }) });
            return;
          }
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createMockResponse([item3])) });
        });

        await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.vocab-card');
        await page.locator('.vocab-card').first().click();

        const writingSection = page.locator('#modalVocabWritingSection');
        await writingSection.waitFor({ state: 'visible' });

        // 3+ characters: stepper is visible, 1 box rendered
        const stepper = writingSection.locator('.vocab-char-stepper');
        const isStepperVisible = await stepper.evaluate(el => !el.classList.contains('d-none'));
        assert.ok(isStepperVisible, 'Stepper must be visible for 3-character word');

        const stepperBtns = stepper.locator('button');
        assert.strictEqual(await stepperBtns.count(), 3, 'Must have 3 stepper buttons for 对不起');

        await page.waitForSelector('.writing-rice-grid-box');
        const box = writingSection.locator('.writing-rice-grid-box');
        assert.strictEqual(await box.count(), 1, 'Only 1 rice grid box rendered at a time');

        // Click 2nd character "不"
        await stepperBtns.nth(1).click();
        await page.waitForTimeout(300);

        // Click 3rd character "起"
        await stepperBtns.nth(2).click();
        await page.waitForTimeout(300);

        const errors = getRuntimeErrors().filter(e => !e.includes('favicon'));
        assert.strictEqual(errors.length, 0, 'Zero runtime errors for 3-character word');
      } finally {
        await context.close();
      }
    }

    // 1-character word: 书 (No stepper needed)
    {
      const item1 = { vocabId: 105, hanzi: '书', pinyin: 'shū', meaningHanViet: 'Thư', meaningVi: 'Sách' };
      const detail1 = { vocabId: 105, hanzi: '书', pinyin: 'shū', meaningHanViet: 'Thư', meaningVi: 'Sách', radicals: [] };

      const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
        viewportWidth: 1024,
        viewportHeight: 768
      });

      try {
        await page.route('**/api/v1/vocabulary**', async (route) => {
          const url = route.request().url();
          if (url.includes('/api/v1/vocabulary/105')) {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'SUCCESS', data: detail1 }) });
            return;
          }
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createMockResponse([item1])) });
        });

        await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.vocab-card');
        await page.locator('.vocab-card').first().click();

        const writingSection = page.locator('#modalVocabWritingSection');
        await writingSection.waitFor({ state: 'visible' });

        await page.waitForSelector('.writing-rice-grid-box');
        const gridBoxes = writingSection.locator('.writing-rice-grid-box');
        assert.strictEqual(await gridBoxes.count(), 1, '1-character word renders exactly 1 box');

        const stepper = writingSection.locator('.vocab-char-stepper');
        const isStepperHidden = await stepper.evaluate(el => el.classList.contains('d-none'));
        assert.ok(isStepperHidden, 'Stepper must be hidden for 1-character word');

        const errors = getRuntimeErrors().filter(e => !e.includes('favicon'));
        assert.strictEqual(errors.length, 0, 'Zero runtime errors for 1-character word');
      } finally {
        await context.close();
      }
    }
  });

  test('VMR-04: Constituent Radicals Presentation & Preview Dialog Contract', async () => {
    const item = { vocabId: 106, hanzi: '休', pinyin: 'xiū', meaningHanViet: 'Hưu', meaningVi: 'Nghỉ ngơi' };
    const detail = {
      vocabId: 106,
      hanzi: '休',
      pinyin: 'xiū',
      meaningHanViet: 'Hưu',
      meaningVi: 'Nghỉ ngơi',
      radicals: [
        { radicalId: 9, character: '亻', pinyin: 'rén', meaningHanViet: 'Nhân', meaningVi: 'Người' },
        { radicalId: 75, character: '木', pinyin: 'mù', meaningHanViet: 'Mộc', meaningVi: 'Cây cối' }
      ]
    };

    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1024,
      viewportHeight: 768
    });

    try {
      await page.route('**/api/v1/vocabulary**', async (route) => {
        const url = route.request().url();
        const detailMatch = url.match(/\/api\/v1\/vocabulary\/(\d+)/);
        if (detailMatch) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'SUCCESS', data: detail }) });
          return;
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createMockResponse([item])) });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');
      const card = page.locator('.vocab-card').first();
      await card.click();

      // Wait for radicals rendered via progressive disclosure
      await page.waitForSelector('.vocab-radical-badge');
      const radicalsContainer = page.locator('#modalRadicalsList');

      // Check inline presentation with separator |
      const badges = radicalsContainer.locator('.vocab-radical-badge');
      assert.strictEqual(await badges.count(), 2, 'Must display 2 radical badges');

      const textFirst = await badges.nth(0).innerText();
      assert.ok(textFirst.includes('亻') && textFirst.includes('Bộ Nhân'), `Text should format as (character · Bộ name), got: ${textFirst}`);

      const textSecond = await badges.nth(1).innerText();
      assert.ok(textSecond.includes('木') && textSecond.includes('Bộ Mộc'), `Text should format as (character · Bộ name), got: ${textSecond}`);

      const separator = radicalsContainer.locator('.vocab-radical-separator');
      assert.strictEqual(await separator.count(), 1, 'Must have exactly 1 separator between 2 radicals');
      assert.strictEqual(await separator.innerText(), '|');

      // Check that NO "Học bộ thủ này ↗" buttons exist
      const learnBtns = radicalsContainer.locator('a:has-text("Học bộ thủ này")');
      assert.strictEqual(await learnBtns.count(), 0, 'No "Học bộ thủ này" links in radical section');

      // Click first radical to open preview
      await badges.nth(0).click();

      const preview = page.locator('#modalRadicalPreview');
      await preview.waitFor({ state: 'visible' });

      // Verify preview content
      const previewHanzi = preview.locator('.font-hanzi');
      assert.strictEqual(await previewHanzi.innerText(), '亻');

      // Check preview does NOT have circled text "• Bộ #" or "• Cho chữ"
      const previewText = await preview.innerText();
      assert.strictEqual(previewText.includes('• Bộ #'), false, 'Preview must NOT contain "• Bộ #" text');
      assert.strictEqual(previewText.includes('• Cho chữ'), false, 'Preview must NOT contain "• Cho chữ" text');

      // Check preview does NOT have "Học bộ thủ này ↗"
      const previewLearn = preview.locator('a:has-text("Học bộ thủ này")');
      assert.strictEqual(await previewLearn.count(), 0, 'Radical preview must NOT contain "Học bộ thủ này" link');

      // Check preview DOES have catalog link "Xem trong 214 Bộ Thủ ↗"
      const catalogLink = preview.locator('a:has-text("Xem trong 214 Bộ Thủ")');
      assert.ok(await catalogLink.isVisible(), 'Radical preview must retain catalog link');
      const href = await catalogLink.getAttribute('href');
      assert.ok(href.includes('radicals.html?id=9'), `Catalog link must link to radicals.html?id=9, got: ${href}`);

      const errors = getRuntimeErrors().filter(e => !e.includes('favicon'));
      assert.strictEqual(errors.length, 0, 'Zero runtime errors for radicals preview');
    } finally {
      await context.close();
    }
  });

  test('VMR-05: Escape Key Dismissal & Backdrop Click', async () => {
    const item = { vocabId: 107, hanzi: '字', pinyin: 'zì', meaningHanViet: 'Tự', meaningVi: 'Chữ' };
    const detail = { vocabId: 107, hanzi: '字', pinyin: 'zì', meaningHanViet: 'Tự', meaningVi: 'Chữ', radicals: [] };

    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1024,
      viewportHeight: 768
    });

    try {
      await page.route('**/api/v1/vocabulary**', async (route) => {
        const url = route.request().url();
        if (url.includes('/api/v1/vocabulary/107')) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'SUCCESS', data: detail }) });
          return;
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createMockResponse([item])) });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      // 1. Dismiss via backdrop click
      const card = page.locator('.vocab-card').first();
      await card.click();
      const modal = page.locator('#vocabDetailModal');
      await modal.waitFor({ state: 'visible' });

      // Click top-left viewport outside dialog container
      await page.mouse.click(10, 10);
      await page.waitForFunction(() => !document.getElementById('vocabDetailModal').hasAttribute('open'));
      assert.strictEqual(await modal.evaluate(el => el.hasAttribute('open')), false, 'Modal must close on backdrop click');

      // 2. Dismiss via Escape key
      await card.click();
      await modal.waitFor({ state: 'visible' });

      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.getElementById('vocabDetailModal').hasAttribute('open'));
      assert.strictEqual(await modal.evaluate(el => el.hasAttribute('open')), false, 'Modal must close on Escape key');

      // Focus restored to activating card
      const isFocused = await card.evaluate(el => el === document.activeElement);
      assert.ok(isFocused, 'Focus must return to triggering card on Escape dismiss');

      const errors = getRuntimeErrors().filter(e => !e.includes('favicon'));
      assert.strictEqual(errors.length, 0, 'Zero runtime errors on modal dismiss tests');
    } finally {
      await context.close();
    }
  });

  test('VMR-08: Semicolons in vocabulary meaning are formatted as commas and label is Nghĩa tiếng Việt', async () => {
    const item = {
      vocabId: 1,
      hanzi: '爱',
      pinyin: 'ài',
      meaningHanViet: 'Ái',
      meaningVi: 'Yêu; thích; tình cảm'
    };
    const detail = {
      vocabId: 1,
      hanzi: '爱',
      pinyin: 'ài',
      meaningHanViet: 'Ái',
      meaningVi: 'Yêu; thích; tình cảm',
      exampleSentence: '我爱我的家人。',
      exampleTranslation: 'Tôi yêu gia đình của tôi.',
      radicals: []
    };

    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1024,
      viewportHeight: 768
    });

    try {
      await page.route('**/api/v1/vocabulary**', async (route) => {
        const url = route.request().url();
        if (url.includes('/api/v1/vocabulary/1')) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'SUCCESS', data: detail }) });
          return;
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createMockResponse([item])) });
      });

      await page.goto(`${baseUrl}/vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.vocab-card');

      // Verify card displays commas instead of semicolons
      const cardMeaning = page.locator('.vocab-card-meaning').first();
      assert.strictEqual(await cardMeaning.innerText(), 'Yêu, thích, tình cảm');

      // Click card to open modal
      const card = page.locator('.vocab-card').first();
      await card.click();
      const modal = page.locator('#vocabDetailModal');
      await modal.waitFor({ state: 'visible' });

      // Verify label is Nghĩa tiếng Việt
      const metaItems = modal.locator('.radical-meta-item');
      const label = metaItems.nth(1).locator('.radical-meta-label');
      assert.strictEqual((await label.innerText()).trim().toUpperCase(), 'NGHĨA TIẾNG VIỆT');

      // Verify modal displays commas instead of semicolons
      const modalMeaning = modal.locator('#modalVocabMeaning');
      assert.strictEqual(await modalMeaning.innerText(), 'Yêu, thích, tình cảm');

      const errors = getRuntimeErrors().filter(e => !e.includes('favicon'));
      assert.strictEqual(errors.length, 0, 'Zero runtime errors on meaning formatting test');
    } finally {
      await context.close();
    }
  });
});
