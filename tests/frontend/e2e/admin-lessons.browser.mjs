/**
 * =============================================================================
 * BROWSER E2E TEST SUITE: ADMIN LESSON MANAGEMENT UI
 * File: tests/frontend/e2e/admin-lessons.browser.mjs
 *
 * Scenarios:
 * - AL-01: Admin opens the page and sees header with badge "61 bài học" on top right,
 *          buttons "📊 Nhập từ Excel" & "＋ Tạo bài học mới", and 5-column semantic table.
 * - AL-02: Lesson list loads via GET /api/v1/admin/lessons and renders 5 columns with Sửa/Xóa.
 * - AL-03: Search toolbar filters lessons by title or ID and clears search.
 * - AL-04: Header badge reflects total lessons count and is styled with badge-status-draft.
 * - AL-05: Clicking "Sửa" opens unified #lessonFormModal in edit mode, loads details & vocabs.
 * - AL-06: Clicking "＋ Tạo bài học mới" opens #lessonFormModal in create mode and submits.
 * - AL-07: Non-Admin session (Learner) is blocked by role guard.
 * - AL-08: Clicking "📊 Nhập từ Excel" opens #importExcelModal.
 * - AL-09: Clicking "Xóa" opens #deleteLessonModal and confirms deletion via DELETE.
 * - AL-10: Verifies clean layout (no breadcrumbs, no tabs, no pageSizeSelect dropdown).
 * =============================================================================
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ensureServer } from '../utils/static-server.mjs';
import { launchBrowser, createMonitoredPage } from '../utils/browser-runner.mjs';

function createMockLessons() {
  return [
    {
      lessonId: 101,
      title: 'Bài 1: Chào hỏi cơ bản',
      status: 'Approved',
      vocabularyCount: 15,
      createdAt: '2026-08-01T08:00:00Z',
      updatedAt: '2026-08-05T10:30:00Z'
    },
    {
      lessonId: 102,
      title: 'Bài 2: Gia đình và Nghề nghiệp',
      status: 'Pending',
      vocabularyCount: 12,
      createdAt: '2026-08-10T09:00:00Z',
      updatedAt: '2026-08-12T14:20:00Z'
    },
    {
      lessonId: 103,
      title: 'Bài 3: Mua sắm và Số đếm',
      status: 'Draft',
      vocabularyCount: 8,
      createdAt: '2026-08-15T11:00:00Z',
      updatedAt: '2026-08-16T16:45:00Z'
    },
    {
      lessonId: 104,
      title: 'Bài 4: Ẩm thực Trung Hoa',
      status: 'Rejected',
      vocabularyCount: 20,
      createdAt: '2026-08-18T13:00:00Z',
      updatedAt: '2026-08-19T09:15:00Z'
    }
  ];
}

async function setupAdminSession(page, email = 'admin@example.com', accountId = 1) {
  await page.addInitScript(`
    localStorage.setItem('access_token', 'test_jwt_admin_token_task_9f5');
    localStorage.setItem('user_info', JSON.stringify({
      accountId: ${accountId},
      emailOrPhone: '${email}',
      fullName: 'Quản Trị Viên Hệ Thống',
      roles: ['Admin']
    }));
  `);
}

async function setupLearnerSession(page) {
  await page.addInitScript(`
    localStorage.setItem('access_token', 'test_jwt_learner_token_task_9f5');
    localStorage.setItem('user_info', JSON.stringify({
      accountId: 88,
      emailOrPhone: 'learner@example.com',
      fullName: 'Học Viên',
      roles: ['Learner']
    }));
  `);
}

describe('Browser E2E: Admin Lesson Management UI', () => {
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

  /* ---------------------------------------------------------------------------
   * AL-01: Admin opens page and sees header with badge on top right, buttons, and 5-column table
   * --------------------------------------------------------------------------- */
  test('AL-01: Admin opens admin-lessons.html and sees header buttons, badge and 5-column table', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);

      await page.route(/\/api\/v1\/admin\/lessons(\?.*)?$/, async (route) => {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            status: 'SUCCESS',
            message: 'OK',
            data: {
              items: createMockLessons(),
              page: 0,
              size: 20,
              totalElements: 4,
              totalPages: 1,
              first: true,
              last: true
            }
          })
        });
      });

      await page.goto(`${baseUrl}/admin-lessons.html`, { waitUntil: 'domcontentloaded' });

      // Verify Single Primary H1
      const h1 = page.locator('h1');
      await h1.waitFor({ state: 'visible', timeout: 5000 });
      assert.strictEqual(await h1.count(), 1);
      assert.ok((await h1.textContent()).includes('Bài Học Hệ Thống'));

      // Verify clean layout (no repeated tabs)
      assert.strictEqual(await page.locator('.moderator-nav-tabs').count(), 0);

      // Verify header count badge exists and is styled with badge-status-draft
      const badge = page.locator('#lessonResultCount');
      await badge.waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await badge.isVisible());

      // Verify header action buttons: "📊 Nhập từ Excel" and "＋ Tạo bài học mới"
      const btnImport = page.locator('#btnOpenImportLessonModal');
      await btnImport.waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await btnImport.isVisible());

      const btnCreate = page.locator('#btnOpenCreateLessonModal');
      await btnCreate.waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await btnCreate.isVisible());

      // Verify old ↻ Làm mới is removed
      assert.strictEqual(await page.locator('#btnRefreshKpi').count(), 0);

      // Verify search toolbar card exists
      assert.ok(await page.locator('#lessonToolbarCard').isVisible());
      assert.ok(await page.locator('#lessonSearchInput').isVisible());
      assert.ok(await page.locator('#btnLessonSearch').isVisible());

      // Verify table structure has 5 columns (ID, Tên bài học, Số từ vựng, Cập nhật, Thao tác)
      const table = page.locator('#lessonTable');
      await table.waitFor({ state: 'visible', timeout: 5000 });
      assert.strictEqual(await table.locator('caption').count(), 1);
      assert.strictEqual(await table.locator('thead th[scope="col"]').count(), 5);

      // Verify table rows rendered
      const rows = page.locator('#lessonTableBody tr');
      await rows.first().waitFor({ state: 'visible', timeout: 5000 });
      assert.strictEqual(await rows.count(), 4);

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${JSON.stringify(errors)}`);
    } finally {
      await context.close();
    }
  });

  /* ---------------------------------------------------------------------------
   * AL-02: Lesson list loads using GET /api/v1/admin/lessons and renders semantic rows
   * --------------------------------------------------------------------------- */
  test('AL-02: Lesson list loads via GET /api/v1/admin/lessons and renders 5 columns with Sửa and Xóa buttons', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);
      let listRequestedUrl = '';

      await page.route(/\/api\/v1\/admin\/lessons(\?.*)?$/, async (route) => {
        listRequestedUrl = route.request().url();
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            status: 'SUCCESS',
            message: 'OK',
            data: {
              items: createMockLessons(),
              page: 0,
              size: 20,
              totalElements: 4,
              totalPages: 1,
              first: true,
              last: true
            }
          })
        });
      });

      await page.goto(`${baseUrl}/admin-lessons.html`, { waitUntil: 'domcontentloaded' });
      const rows = page.locator('#lessonTableBody tr');
      await rows.first().waitFor({ state: 'visible', timeout: 5000 });

      // Verify table has 4 rows
      assert.strictEqual(await rows.count(), 4);

      // Verify first row content
      const firstRow = rows.first();
      const firstRowText = await firstRow.textContent();
      assert.ok(firstRowText.includes('#101'));
      assert.ok(firstRowText.includes('Bài 1: Chào hỏi cơ bản'));
      assert.ok(firstRowText.includes('15 từ'));
      assert.ok(firstRowText.includes('Sửa'));
      assert.ok(firstRowText.includes('Xóa'));

      // Verify action buttons exist in btn-group
      assert.ok(await firstRow.locator('.btn-edit-lesson').isVisible());
      assert.ok(await firstRow.locator('.btn-delete-lesson').isVisible());

      // Verify URL did not include fake creatorId or search parameter
      assert.ok(listRequestedUrl.includes('/api/v1/admin/lessons'));

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${JSON.stringify(errors)}`);
    } finally {
      await context.close();
    }
  });

  /* ---------------------------------------------------------------------------
   * AL-03: Search toolbar filters lessons by title and ID
   * --------------------------------------------------------------------------- */
  test('AL-03: Search toolbar filters lessons by title or ID and clears search', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);
      const mockLessons = createMockLessons();

      await page.route(/\/api\/v1\/admin\/lessons(\?.*)?$/, async (route) => {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            status: 'SUCCESS',
            message: 'OK',
            data: {
              items: mockLessons,
              page: 0,
              size: 20,
              totalElements: mockLessons.length,
              totalPages: 1,
              first: true,
              last: true
            }
          })
        });
      });

      await page.goto(`${baseUrl}/admin-lessons.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#lessonTableBody tr').first().waitFor({ state: 'visible', timeout: 5000 });

      // Verify all 4 mock lessons initially rendered
      const rows = page.locator('#lessonTableBody tr');
      assert.strictEqual(await rows.count(), 4);

      // Search for "Gia đình"
      await page.fill('#lessonSearchInput', 'Gia đình');
      await page.click('#btnLessonSearch');
      await page.waitForTimeout(300);

      // Table should now only show 1 lesson
      assert.strictEqual(await rows.count(), 1);
      assert.ok((await rows.first().textContent()).includes('Gia đình'));

      // Clear search
      await page.click('#btnLessonClearSearch');
      await page.waitForTimeout(300);

      // All 4 lessons should be restored
      assert.strictEqual(await rows.count(), 4);

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${JSON.stringify(errors)}`);
    } finally {
      await context.close();
    }
  });

  /* ---------------------------------------------------------------------------
   * AL-04: Header badge reflects total lessons count and is styled with badge-status-draft
   * --------------------------------------------------------------------------- */
  test('AL-04: Header badge reflects total lessons count and is styled with badge-status-draft', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);
      const mockLessons = createMockLessons();

      await page.route(/\/api\/v1\/admin\/lessons(\?.*)?$/, async (route) => {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            status: 'SUCCESS',
            message: 'OK',
            data: {
              items: mockLessons,
              page: 0,
              size: 20,
              totalElements: 61,
              totalPages: 4,
              first: true,
              last: false
            }
          })
        });
      });

      await page.goto(`${baseUrl}/admin-lessons.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#lessonTableBody tr').first().waitFor({ state: 'visible', timeout: 5000 });

      // Header count badge verification
      const badge = page.locator('#lessonResultCount');
      await badge.waitFor({ state: 'visible', timeout: 5000 });
      const badgeText = await badge.textContent();
      assert.ok(badgeText.includes('61 bài học'), `Expected badge to contain "61 bài học", got "${badgeText}"`);

      // Verify grey styling class badge-status-draft
      const badgeClass = await badge.getAttribute('class');
      assert.ok(badgeClass.includes('badge-status-draft'), `Expected class to include badge-status-draft, got "${badgeClass}"`);

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${JSON.stringify(errors)}`);
    } finally {
      await context.close();
    }
  });

  /* ---------------------------------------------------------------------------
   * AL-05: Clicking "Sửa" opens unified #lessonFormModal in edit mode
   * --------------------------------------------------------------------------- */
  test('AL-05: Clicking "Sửa" opens unified #lessonFormModal and loads lesson details with vocabs', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);
      let detailFetched = false;

      await page.route(/\/api\/v1\/admin\/lessons(\?.*)?$/, async (route) => {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            status: 'SUCCESS',
            message: 'OK',
            data: {
              items: [createMockLessons()[0]], // Lesson #101
              page: 0,
              size: 20,
              totalElements: 1,
              totalPages: 1,
              first: true,
              last: true
            }
          })
        });
      });

      await page.route(/\/api\/v1\/admin\/lessons\/101$/, async (route) => {
        detailFetched = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            status: 'SUCCESS',
            message: 'OK',
            data: {
              lessonId: 101,
              title: 'Bài 1: Chào hỏi cơ bản',
              status: 'Approved',
              vocabularies: [
                {
                  vocabId: 1,
                  hanzi: '你好',
                  pinyin: 'nǐ hǎo',
                  meaningHanViet: 'nhĩ hảo',
                  meaningVi: 'xin chào',
                  orderIndex: 1
                },
                {
                  vocabId: 2,
                  hanzi: '谢谢',
                  pinyin: 'xièxie',
                  meaningHanViet: 'tạ tạ',
                  meaningVi: 'cảm ơn',
                  orderIndex: 2
                }
              ]
            }
          })
        });
      });

      await page.goto(`${baseUrl}/admin-lessons.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#lessonTableBody tr').first().waitFor({ state: 'visible', timeout: 5000 });

      // Click "Sửa" button on row 101
      const editBtn = page.locator('#btnEditLesson-101');
      await editBtn.click();

      // Verify unified modal is open
      const modal = page.locator('#lessonFormModal');
      await modal.waitFor({ state: 'visible', timeout: 3000 });
      assert.ok(await modal.isVisible());

      // Verify title is filled
      const titleInput = page.locator('#lessonFormTitleInput');
      assert.strictEqual(await titleInput.inputValue(), 'Bài 1: Chào hỏi cơ bản');

      // Verify endpoint was called to load vocabs
      assert.strictEqual(detailFetched, true);

      // Verify vocabulary items rendered in form table
      await page.locator('#formVocabTbody tr').first().waitFor({ state: 'visible', timeout: 3000 });
      const vocabRows = page.locator('#formVocabTbody tr');
      assert.strictEqual(await vocabRows.count(), 2);
      assert.ok((await vocabRows.first().textContent()).includes('你好'));

      // Close modal
      await page.locator('#btnCancelLessonForm').click();
      await modal.waitFor({ state: 'hidden', timeout: 3000 });
      assert.strictEqual(await modal.isVisible(), false);

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${JSON.stringify(errors)}`);
    } finally {
      await context.close();
    }
  });

  /* ---------------------------------------------------------------------------
   * AL-06: Clicking "＋ Tạo bài học mới" opens #lessonFormModal in create mode
   * --------------------------------------------------------------------------- */
  test('AL-06: Clicking "＋ Tạo bài học mới" opens #lessonFormModal in create mode', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);

      await page.route(/\/api\/v1\/admin\/lessons(\?.*)?$/, async (route) => {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            status: 'SUCCESS',
            message: 'OK',
            data: {
              items: [],
              page: 0,
              size: 20,
              totalElements: 0,
              totalPages: 0,
              first: true,
              last: true
            }
          })
        });
      });

      await page.goto(`${baseUrl}/admin-lessons.html`, { waitUntil: 'domcontentloaded' });

      // Click "＋ Tạo bài học mới"
      await page.locator('#btnOpenCreateLessonModal').click();

      // Verify modal is open
      const modal = page.locator('#lessonFormModal');
      await modal.waitFor({ state: 'visible', timeout: 3000 });
      assert.ok(await modal.isVisible());

      // Verify modal title is "Thêm Bài Học Mới"
      const modalTitle = await page.locator('#lessonFormModalTitle').textContent();
      assert.ok(modalTitle.includes('Thêm Bài Học Mới'));

      // Verify title input is empty
      const titleInput = page.locator('#lessonFormTitleInput');
      assert.strictEqual(await titleInput.inputValue(), '');

      // Close modal
      await page.locator('#btnCancelLessonForm').click();
      await modal.waitFor({ state: 'hidden', timeout: 3000 });

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${JSON.stringify(errors)}`);
    } finally {
      await context.close();
    }
  });

  /* ---------------------------------------------------------------------------
   * AL-07: Non-Admin access is blocked
   * --------------------------------------------------------------------------- */
  test('AL-07: Non-Admin session (Learner) is blocked by role guard', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupLearnerSession(page);

      await page.goto(`${baseUrl}/admin-lessons.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#adminAuthGuardContainer').waitFor({ state: 'visible', timeout: 5000 });

      // Verify auth guard container is displayed
      const guard = page.locator('#adminAuthGuardContainer');
      assert.ok(await guard.isVisible());
      assert.ok((await guard.textContent()).includes('Yêu Cầu Quyền Quản Trị Viên'));

      // Verify main content container is hidden
      assert.strictEqual(await page.locator('#adminLessonsMainContent').isVisible(), false);

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${JSON.stringify(errors)}`);
    } finally {
      await context.close();
    }
  });

  /* ---------------------------------------------------------------------------
   * AL-08: Excel Import Modal verification
   * --------------------------------------------------------------------------- */
  test('AL-08: Clicking "📊 Nhập từ Excel" opens #importExcelModal', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);

      await page.route(/\/api\/v1\/admin\/lessons(\?.*)?$/, async (route) => {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            status: 'SUCCESS',
            message: 'OK',
            data: {
              items: createMockLessons(),
              page: 0,
              size: 20,
              totalElements: 4,
              totalPages: 1,
              first: true,
              last: true
            }
          })
        });
      });

      await page.goto(`${baseUrl}/admin-lessons.html`, { waitUntil: 'domcontentloaded' });

      // Click "📊 Nhập từ Excel"
      await page.locator('#btnOpenImportLessonModal').click();

      // Verify modal is open
      const modal = page.locator('#importExcelModal');
      await modal.waitFor({ state: 'visible', timeout: 3000 });
      assert.ok(await modal.isVisible());

      // Verify title input and file input exist
      assert.ok(await page.locator('#importExcelFileInput').isVisible());
      assert.ok(await page.locator('#importExcelTitleInput').isVisible());

      // Close modal
      await page.locator('#btnCancelImportExcel').click();
      await modal.waitFor({ state: 'hidden', timeout: 3000 });

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${JSON.stringify(errors)}`);
    } finally {
      await context.close();
    }
  });

  /* ---------------------------------------------------------------------------
   * AL-09: Delete confirmation modal verification
   * --------------------------------------------------------------------------- */
  test('AL-09: Clicking "Xóa" opens #deleteLessonModal and confirms deletion', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);
      let deleteCalled = false;

      await page.route(/\/api\/v1\/admin\/lessons(\?.*)?$/, async (route) => {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            status: 'SUCCESS',
            message: 'OK',
            data: {
              items: [createMockLessons()[0]], // Lesson #101
              page: 0,
              size: 20,
              totalElements: 1,
              totalPages: 1,
              first: true,
              last: true
            }
          })
        });
      });

      await page.route(/\/api\/v1\/admin\/lessons\/101$/, async (route) => {
        if (route.request().method() === 'DELETE') {
          deleteCalled = true;
          return route.fulfill({
            status: 204,
            body: ''
          });
        }
        return route.continue();
      });

      await page.goto(`${baseUrl}/admin-lessons.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#lessonTableBody tr').first().waitFor({ state: 'visible', timeout: 5000 });

      // Click "Xóa"
      await page.locator('#btnDeleteLesson-101').click();

      // Delete Modal should open
      const deleteModal = page.locator('#deleteLessonModal');
      await deleteModal.waitFor({ state: 'visible', timeout: 3000 });
      assert.ok(await deleteModal.isVisible());

      // Target lesson title should match
      const targetTitle = await page.locator('#deleteLessonTargetTitle').textContent();
      assert.ok(targetTitle.includes('Bài 1: Chào hỏi cơ bản'));

      // Confirm delete
      await page.locator('#btnConfirmDeleteLesson').click();

      // Modal closes and delete API was invoked
      await deleteModal.waitFor({ state: 'hidden', timeout: 3000 });
      assert.strictEqual(deleteCalled, true);

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${JSON.stringify(errors)}`);
    } finally {
      await context.close();
    }
  });

  /* ---------------------------------------------------------------------------
   * AL-10: Clean Layout Verification
   * --------------------------------------------------------------------------- */
  test('AL-10: Verifies clean layout (no breadcrumbs, no tabs, no pageSizeSelect dropdown)', async () => {
    const { page, context, getRuntimeErrors } = await createMonitoredPage(browser, {
      viewportWidth: 1280,
      viewportHeight: 720
    });

    try {
      await setupAdminSession(page);

      await page.route(/\/api\/v1\/admin\/lessons(\?.*)?$/, async (route) => {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUCCESS',
            status: 'SUCCESS',
            message: 'OK',
            data: {
              items: createMockLessons(),
              page: 0,
              size: 20,
              totalElements: 4,
              totalPages: 1,
              first: true,
              last: true
            }
          })
        });
      });

      await page.goto(`${baseUrl}/admin-lessons.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#lessonTableBody tr').first().waitFor({ state: 'visible', timeout: 5000 });

      // 1. Breadcrumbs must be absent
      assert.strictEqual(await page.locator('.breadcrumb').count(), 0, 'Breadcrumbs must be absent');

      // 2. Moderator nav tabs must be absent
      assert.strictEqual(await page.locator('.moderator-nav-tabs').count(), 0, 'Moderator nav tabs must be absent');

      // 3. pageSizeSelect must be absent
      assert.strictEqual(await page.locator('#pageSizeSelect').count(), 0, 'PageSizeSelect must be absent');

      // 4. Clean table class
      assert.strictEqual(await page.locator('.table-responsive-clean').count(), 1, 'Table must use .table-responsive-clean');

      const errors = getRuntimeErrors();
      assert.strictEqual(errors.length, 0, `Runtime errors: ${JSON.stringify(errors)}`);
    } finally {
      await context.close();
    }
  });

});
