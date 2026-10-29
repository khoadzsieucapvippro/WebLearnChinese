import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

describe('Browser E2E: File Picker Cancel Isolation in Admin Modals', () => {
  let serverHandle;
  let browser;
  let baseUrl;

  before(async () => {
    serverHandle = await ensureServer({ port: 3000 });
    baseUrl = serverHandle.baseUrl;
    browser = await launchBrowser();
  });

  after(async () => {
    if (browser) await browser.close();
    if (serverHandle) await serverHandle.close();
  });

  test('Radicals: Cancelling file picker does NOT close #radicalFormModal or reset inputs', async () => {
    const { context, page } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await page.addInitScript(`
        localStorage.setItem('access_token', 'test_jwt_admin_token_cancel_test');
        localStorage.setItem('user_info', JSON.stringify({
          accountId: 1,
          emailOrPhone: 'admin@example.com',
          fullName: 'Quản Trị Viên',
          roles: ['Admin']
        }));
      `);

      await page.route(/\/api\/v1\/radicals(\?.*)?$/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'Thành công',
            data: {
              items: [
                {
                  radicalId: 75,
                  character: '木',
                  pinyin: 'mù',
                  meaningHanViet: 'Mộc',
                  meaningVi: 'Cây, gỗ',
                  audioUrl: null
                }
              ],
              totalElements: 1,
              page: 0,
              size: 250,
              totalPages: 1
            }
          })
        });
      });

      await page.goto(`${baseUrl}/admin-radicals.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#radicalTableBody tr', { timeout: 5000 });
      await page.waitForSelector('#btnOpenCreateModal', { timeout: 5000, state: 'visible' });

      // Open create modal
      await page.locator('#btnOpenCreateModal').click();
      await page.waitForSelector('#radicalFormModal[open]', { timeout: 5000 });

      // Enter data
      await page.locator('#inputCharacter').fill('木');
      await page.locator('#inputPinyin').fill('mù');
      await page.locator('#inputMeaningHanViet').fill('Mộc');
      await page.locator('#inputMeaningVi').fill('Cây, gỗ');

      // Dispatch cancel event on #inputAudioFile (simulating user clicking Cancel on the native file chooser)
      await page.evaluate(() => {
        const fileInput = document.getElementById('inputAudioFile');
        const cancelEvent = new Event('cancel', { bubbles: true, cancelable: true });
        fileInput.dispatchEvent(cancelEvent);
      });

      // Modal must still be open!
      const isModalOpen = await page.evaluate(() => {
        const modal = document.getElementById('radicalFormModal');
        return modal && modal.open;
      });
      assert.strictEqual(isModalOpen, true, 'Radical form modal must remain open after file picker cancellation');

      // Input values must still be intact!
      const charVal = await page.locator('#inputCharacter').inputValue();
      const pinyinVal = await page.locator('#inputPinyin').inputValue();
      assert.strictEqual(charVal, '木', 'Character input value must be preserved');
      assert.strictEqual(pinyinVal, 'mù', 'Pinyin input value must be preserved');

      // Admin can continue typing and other actions
      await page.locator('#inputExplanationVi').fill('Giải thích tiếp tục');
      const explanationVal = await page.locator('#inputExplanationVi').inputValue();
      assert.strictEqual(explanationVal, 'Giải thích tiếp tục');

      // Now verify clicking close button closes the modal as expected
      await page.locator('#modalFormCloseBtn').click();
      const isModalClosed = await page.evaluate(() => {
        const modal = document.getElementById('radicalFormModal');
        return !modal || !modal.open;
      });
      assert.strictEqual(isModalClosed, true, 'Modal should close when explicitly clicking close button');

    } finally {
      await context.close();
    }
  });

  test('Vocabulary: Cancelling file picker does NOT close #vocabFormModal or reset inputs', async () => {
    const { context, page } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await page.addInitScript(`
        localStorage.setItem('access_token', 'test_jwt_admin_token_cancel_test');
        localStorage.setItem('user_info', JSON.stringify({
          accountId: 1,
          emailOrPhone: 'admin@example.com',
          fullName: 'Quản Trị Viên',
          roles: ['Admin']
        }));
      `);

      await page.route(/\/api\/v1\/vocabulary(\?.*)?$/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'Thành công',
            data: {
              items: [
                {
                  vocabId: 1,
                  hanzi: '你好',
                  pinyin: 'nǐ hǎo',
                  pinyinRaw: 'ni3 hao3',
                  meaningVi: 'Xin chào',
                  hskLevel: 1,
                  audioUrl: null,
                  radicals: []
                }
              ],
              totalElements: 1,
              page: 0,
              size: 20,
              totalPages: 1
            }
          })
        });
      });

      await page.route(/\/api\/v1\/radicals(\?.*)?$/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            message: 'Thành công',
            data: {
              items: [],
              totalElements: 0,
              page: 0,
              size: 214,
              totalPages: 1
            }
          })
        });
      });

      await page.goto(`${baseUrl}/admin-vocabulary.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#vocabTableBody tr', { timeout: 5000 });
      await page.waitForSelector('#btnOpenCreateModal', { timeout: 5000, state: 'visible' });

      // Open create modal
      await page.locator('#btnOpenCreateModal').click();
      await page.waitForSelector('#vocabFormModal[open]', { timeout: 5000 });

      // Enter data
      await page.locator('#inputHanzi').fill('你好');
      await page.locator('#inputPinyin').fill('nǐ hǎo');
      await page.locator('#inputMeaningVi').fill('Xin chào');

      // Dispatch cancel event on #inputAudioFile (simulating user clicking Cancel on the native file chooser)
      await page.evaluate(() => {
        const fileInput = document.getElementById('inputAudioFile');
        const cancelEvent = new Event('cancel', { bubbles: true, cancelable: true });
        fileInput.dispatchEvent(cancelEvent);
      });

      // Modal must still be open!
      const isModalOpen = await page.evaluate(() => {
        const modal = document.getElementById('vocabFormModal');
        return modal && modal.open;
      });
      assert.strictEqual(isModalOpen, true, 'Vocab form modal must remain open after file picker cancellation');

      // Input values must still be intact!
      const hanziVal = await page.locator('#inputHanzi').inputValue();
      const pinyinVal = await page.locator('#inputPinyin').inputValue();
      assert.strictEqual(hanziVal, '你好', 'Hanzi input value must be preserved');
      assert.strictEqual(pinyinVal, 'nǐ hǎo', 'Pinyin input value must be preserved');

      // Admin can continue typing and other actions
      await page.locator('#inputExampleSentence').fill('你好吗？');
      const exampleVal = await page.locator('#inputExampleSentence').inputValue();
      assert.strictEqual(exampleVal, '你好吗？');

      // Modal close button still works
      await page.locator('#modalFormCloseBtn').click();
      const isModalClosed = await page.evaluate(() => {
        const modal = document.getElementById('vocabFormModal');
        return !modal || !modal.open;
      });
      assert.strictEqual(isModalClosed, true, 'Vocab modal should close when clicking close button');

    } finally {
      await context.close();
    }
  });
});
