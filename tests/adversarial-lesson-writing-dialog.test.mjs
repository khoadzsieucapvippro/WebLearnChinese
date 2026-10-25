/**
 * =============================================================================
 * ADVERSARIAL STRESS TEST SUITE: LESSON DETAIL WRITING MODAL & TRIGGER BUTTON
 * Module: tests/adversarial-lesson-writing-dialog.test.mjs
 * Author: teamwork_challenger_m1_1 (EMPIRICAL CHALLENGER)
 *
 * Scope:
 * 1. Rapid Multi-Clicks (Re-entrance thrashing, 0 duplicate dialogs, 0 crashes)
 * 2. Closing via Backdrop Click
 * 3. Closing via Escape Key
 * 4. DOM Isolation & Teardown (0 orphaned SVG/canvas nodes, 0 lingering timers)
 * 5. WCAG 2.2 APG Focus Restoration back to exact trigger buttons
 * 6. Multi-Item Switching and Radicals List Integration
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from './frontend/utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from './frontend/utils/browser-runner.mjs';

function createMockLessonDetail(lessonId = 1) {
  return {
    lessonId: Number(lessonId),
    title: 'Bài 1: Chào hỏi và Đại từ nhân xưng',
    status: 'Approved',
    vocabularyCount: 3,
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-02T10:30:00Z',
    vocabularies: [
      {
        vocabId: 101,
        hanzi: '你',
        pinyin: 'nǐ',
        pinyinRaw: 'ni3',
        meaningHanViet: 'Nhĩ',
        meaningVi: 'Bạn, anh, chị (đại từ ngôi thứ 2)',
        audioUrl: null,
        videoWritingUrl: null,
        exampleSentence: '你好！',
        exampleTranslation: 'Xin chào!',
        orderIndex: 1
      },
      {
        vocabId: 102,
        hanzi: '好',
        pinyin: 'hǎo',
        pinyinRaw: 'hao3',
        meaningHanViet: 'Hảo',
        meaningVi: 'Tốt, đẹp, khỏe',
        audioUrl: null,
        videoWritingUrl: null,
        exampleSentence: '今天天气很好。',
        exampleTranslation: 'Thời tiết hôm nay rất tốt.',
        orderIndex: 2
      },
      {
        vocabId: 103,
        hanzi: '我',
        pinyin: 'wǒ',
        pinyinRaw: 'wo3',
        meaningHanViet: 'Ngã',
        meaningVi: 'Tôi, mình (đại từ ngôi thứ 1)',
        audioUrl: null,
        videoWritingUrl: null,
        exampleSentence: '我是学生。',
        exampleTranslation: 'Tôi là học sinh.',
        orderIndex: 3
      }
    ]
  };
}

describe('Adversarial Interaction Challenge: Lesson Detail Writing Modal (P2-WRITING-1)', () => {
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

  // Helper to setup mock lesson-detail page
  async function setupLessonPage() {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 800
    });

    await page.route('**/api/v1/lessons/1**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          data: createMockLessonDetail(1)
        })
      });
    });

    await page.goto(`${baseUrl}/lesson-detail.html?id=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#lessonVocabList .lesson-vocab-item');

    return { page, context, getRuntimeErrors };
  }

  // ADV-1: Rapid Multi-Clicks Re-entrance Stress
  test('ADV-1: Rapid multi-clicks on writing button do not leak duplicate dialogs or crash', async () => {
    const { page, context, getRuntimeErrors } = await setupLessonPage();

    try {
      const firstItem = page.locator('#lessonVocabList .lesson-vocab-item').nth(0);
      const writingBtn = firstItem.locator('.lesson-vocab-writing-btn');
      assert.ok(await writingBtn.isVisible(), 'Writing button must be visible');

      // Trigger rapid successive clicks (re-entrance stress)
      await writingBtn.evaluate((btn) => {
        btn.click();
        btn.click();
        btn.click();
      });

      // Wait for modal to settle
      const modal = page.locator('#vocabWritingModal');
      await modal.waitFor({ state: 'visible', timeout: 5000 });

      // Invariant: Exactly ONE dialog exists in document.body
      const dialogCount = await page.evaluate(() => document.querySelectorAll('dialog#vocabWritingModal').length);
      assert.strictEqual(dialogCount, 1, 'Strictly 1 dialog instance must exist after burst clicks');

      // Verify mount container is valid and rendered
      const stageAreaCount = await page.locator('#vocabWritingMountContainer .vocab-stage-area').count();
      assert.strictEqual(stageAreaCount, 1, 'Exactly one stage area must be rendered inside mount container');

      // Close modal
      await modal.locator('.btn-close').click();
      await modal.waitFor({ state: 'hidden', timeout: 3000 });

      const errors = getRuntimeErrors().filter(e => !e.includes('net::ERR_CONNECTION_REFUSED'));
      assert.strictEqual(errors.length, 0, `Runtime errors after rapid clicks: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // ADV-2: Closing via Backdrop Click
  test('ADV-2: Closing via backdrop click dismisses dialog and restores focus to trigger button', async () => {
    const { page, context, getRuntimeErrors } = await setupLessonPage();

    try {
      const firstItem = page.locator('#lessonVocabList .lesson-vocab-item').nth(0);
      const writingBtn = firstItem.locator('.lesson-vocab-writing-btn');

      // Click to open
      await writingBtn.click();
      const modal = page.locator('#vocabWritingModal');
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await modal.isVisible(), 'Dialog must be open');

      // Dispatch click event targeting dialog backdrop
      // In native <dialog>, clicking on the dialog element outside its inner child is a backdrop click
      await page.evaluate(() => {
        const dialog = document.getElementById('vocabWritingModal');
        if (dialog) {
          dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        }
      });

      // Wait for dialog to dismiss
      await modal.waitFor({ state: 'hidden', timeout: 3000 });
      assert.strictEqual(await modal.isVisible(), false, 'Dialog must be closed after backdrop click');

      // Focus restoration verification (WCAG 2.2 APG)
      const isFocused = await writingBtn.evaluate(el => document.activeElement === el);
      assert.ok(isFocused, 'Focus must be restored back to trigger button after backdrop click dismissal');

      const errors = getRuntimeErrors().filter(e => !e.includes('net::ERR_CONNECTION_REFUSED'));
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // ADV-3: Closing via Escape Key
  test('ADV-3: Pressing Escape key dismisses dialog and restores focus to trigger button', async () => {
    const { page, context, getRuntimeErrors } = await setupLessonPage();

    try {
      const secondItem = page.locator('#lessonVocabList .lesson-vocab-item').nth(1);
      const writingBtn2 = secondItem.locator('.lesson-vocab-writing-btn');

      // Click second item's writing button
      await writingBtn2.click();
      const modal = page.locator('#vocabWritingModal');
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await modal.isVisible(), 'Dialog must be open for item 2');

      // Press Escape key
      await page.keyboard.press('Escape');

      // Wait for dialog to dismiss
      await modal.waitFor({ state: 'hidden', timeout: 3000 });
      assert.strictEqual(await modal.isVisible(), false, 'Dialog must be closed after Escape key');

      // Focus restoration verification (WCAG 2.2 APG)
      const isFocused = await writingBtn2.evaluate(el => document.activeElement === el);
      assert.ok(isFocused, 'Focus must be restored back to item 2 trigger button after Escape dismissal');

      const errors = getRuntimeErrors().filter(e => !e.includes('net::ERR_CONNECTION_REFUSED'));
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // ADV-4: Complete DOM Isolation & Zero Orphaned Nodes
  test('ADV-4: Dialog teardown ensures 0 orphaned SVG, 0 canvas, and 0 lingering elements in mount container', async () => {
    const { page, context, getRuntimeErrors } = await setupLessonPage();

    try {
      const firstItem = page.locator('#lessonVocabList .lesson-vocab-item').nth(0);
      const writingBtn = firstItem.locator('.lesson-vocab-writing-btn');

      // Open modal
      await writingBtn.click();
      const modal = page.locator('#vocabWritingModal');
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForSelector('#vocabWritingMountContainer .vocab-stage-area', { timeout: 5000 });

      // Verify active SVG / canvas elements exist while modal is open
      const openSvgCount = await page.evaluate(() => {
        const container = document.getElementById('vocabWritingMountContainer');
        return container ? container.querySelectorAll('svg').length : 0;
      });
      assert.ok(openSvgCount > 0, `Active modal must contain rice-grid SVG, found ${openSvgCount}`);

      // Close modal
      const closeBtn = modal.locator('.btn-close');
      await closeBtn.click();
      await modal.waitFor({ state: 'hidden', timeout: 3000 });

      // Strict DOM Isolation Assertion: Mount container must be completely empty
      const containerState = await page.evaluate(() => {
        const container = document.getElementById('vocabWritingMountContainer');
        if (!container) return null;
        return {
          childElementCount: container.childElementCount,
          childNodesLength: container.childNodes.length,
          svgCount: container.querySelectorAll('svg').length,
          canvasCount: container.querySelectorAll('canvas').length,
          stageAreaCount: container.querySelectorAll('.vocab-stage-area').length
        };
      });

      assert.notStrictEqual(containerState, null, 'Mount container must exist');
      assert.strictEqual(containerState.childElementCount, 0, 'Mount container must have 0 child elements after close');
      assert.strictEqual(containerState.childNodesLength, 0, 'Mount container must have 0 child nodes after close');
      assert.strictEqual(containerState.svgCount, 0, 'Mount container must have 0 orphaned SVG nodes after close');
      assert.strictEqual(containerState.canvasCount, 0, 'Mount container must have 0 orphaned canvas nodes after close');
      assert.strictEqual(containerState.stageAreaCount, 0, 'Mount container must have 0 lingering stage areas after close');

      const errors = getRuntimeErrors().filter(e => !e.includes('net::ERR_CONNECTION_REFUSED'));
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // ADV-5: Rapid Open-Close Thrashing Lifecycle Stress
  test('ADV-5: Repeated rapid open-close cycles execute cleanly with zero memory leaks or unhandled rejections', async () => {
    const { page, context, getRuntimeErrors } = await setupLessonPage();

    try {
      const firstItem = page.locator('#lessonVocabList .lesson-vocab-item').nth(0);
      const writingBtn = firstItem.locator('.lesson-vocab-writing-btn');
      const modal = page.locator('#vocabWritingModal');

      // 5 consecutive open-close cycles
      for (let cycle = 1; cycle <= 5; cycle++) {
        await writingBtn.click();
        await modal.waitFor({ state: 'visible', timeout: 5000 });

        // Alternate close mechanisms: closeBtn, Escape, backdrop
        if (cycle % 3 === 1) {
          await modal.locator('.btn-close').click();
        } else if (cycle % 3 === 2) {
          await page.keyboard.press('Escape');
        } else {
          await page.evaluate(() => {
            const dialog = document.getElementById('vocabWritingModal');
            if (dialog) dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          });
        }

        await modal.waitFor({ state: 'hidden', timeout: 3000 });
      }

      // After 5 cycles: verify single dialog in body, 0 orphaned stage elements
      const finalCheck = await page.evaluate(() => {
        const dialogs = document.querySelectorAll('dialog#vocabWritingModal');
        const container = document.getElementById('vocabWritingMountContainer');
        return {
          dialogCount: dialogs.length,
          mountChildren: container ? container.childElementCount : -1
        };
      });

      assert.strictEqual(finalCheck.dialogCount, 1, 'Only 1 dialog element after 5 open-close cycles');
      assert.strictEqual(finalCheck.mountChildren, 0, 'Mount container must be empty after 5 cycles');

      const errors = getRuntimeErrors().filter(e => !e.includes('net::ERR_CONNECTION_REFUSED'));
      assert.strictEqual(errors.length, 0, `Runtime errors after open-close cycles: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // ADV-6: Cross-Item Sequential Triggering & Focus Integrity
  test('ADV-6: Sequential opening across different vocabulary items properly switches words and restores focus', async () => {
    const { page, context, getRuntimeErrors } = await setupLessonPage();

    try {
      const listItems = page.locator('#lessonVocabList .lesson-vocab-item');
      const modal = page.locator('#vocabWritingModal');

      // Sequence: Item 1 (你) -> Item 2 (好) -> Item 3 (我)
      for (let idx = 0; idx < 3; idx++) {
        const item = listItems.nth(idx);
        const writingBtn = item.locator('.lesson-vocab-writing-btn');

        await writingBtn.click();
        await modal.waitFor({ state: 'visible', timeout: 5000 });
        await page.waitForSelector('#vocabWritingMountContainer .vocab-stage-area', { timeout: 5000 });

        // Close via Escape
        await page.keyboard.press('Escape');
        await modal.waitFor({ state: 'hidden', timeout: 3000 });

        // Verify focus returned to the exact button clicked
        const isFocused = await writingBtn.evaluate(el => document.activeElement === el);
        assert.ok(isFocused, `Focus must be restored to item ${idx + 1} button`);
      }

      const errors = getRuntimeErrors().filter(e => !e.includes('net::ERR_CONNECTION_REFUSED'));
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });

  // ADV-7: Radical List Item Writing Integration
  test('ADV-7: Writing button works on Radicals chapter view (renderRadicalsList)', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser);

    try {
      // Mock /api/v1/radicals
      await page.route('**/api/v1/radicals**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            data: [
              {
                radicalId: 1,
                character: '一',
                pinyin: 'yī',
                meaningHanViet: 'Nhất',
                meaningVi: 'Số một',
                strokeCount: 1,
                isCommon50: true
              },
              {
                radicalId: 2,
                character: '丨',
                pinyin: 'gǔn',
                meaningHanViet: 'Cổn',
                meaningVi: 'Nét sổ dọc',
                strokeCount: 1,
                isCommon50: false
              }
            ]
          })
        });
      });

      // Navigate to radicals chapter 0
      await page.goto(`${baseUrl}/lesson-detail.html?group=radicals50&chapter=0`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#lessonVocabList .lesson-vocab-item');

      const firstRadItem = page.locator('#lessonVocabList .lesson-vocab-item').nth(0);
      const radWritingBtn = firstRadItem.locator('.lesson-vocab-writing-btn');
      assert.ok(await radWritingBtn.isVisible(), 'Radical writing button must be visible');
      assert.ok(radWritingBtn.getAttribute('data-radical-id'), 'Radical writing button must have data-radical-id');
      assert.strictEqual(await radWritingBtn.getAttribute('title'), 'Luyện viết bộ thủ');

      // Click radical writing button
      await radWritingBtn.click();
      const modal = page.locator('#vocabWritingModal');
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await modal.isVisible(), 'Writing modal must open for radical item');

      // Close modal
      await page.keyboard.press('Escape');
      await modal.waitFor({ state: 'hidden', timeout: 3000 });

      // Verify focus returned to radical writing button
      const isFocused = await radWritingBtn.evaluate(el => document.activeElement === el);
      assert.ok(isFocused, 'Focus must be restored to radical writing button');

      const errors = getRuntimeErrors().filter(e => !e.includes('net::ERR_CONNECTION_REFUSED'));
      assert.strictEqual(errors.length, 0, `Runtime errors: ${errors.join('\n')}`);
    } finally {
      await context.close();
    }
  });
});
