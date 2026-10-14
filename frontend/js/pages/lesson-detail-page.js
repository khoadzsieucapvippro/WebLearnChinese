/**
 * =============================================================================
 * PUBLIC LESSON DETAIL PAGE CONTROLLER (TASK 9C.1)
 * Module: frontend/js/pages/lesson-detail-page.js
 * 
 * Responsibilities:
 * - Reads and validates lessonId from URL query parameter (?id=...).
 * - Fetches approved public lesson detail from GET /api/v1/lessons/{id}.
 * - Enforces zero-leak public contract: non-approved/missing lessons render
 *   neutral 404 error without disclosing internal moderation state.
 * - Renders constituent vocabulary items strictly in orderIndex ascending sequence.
 * - Integrates Web Speech API pronunciation with graceful fallback.
 * - Pure helpers exported for unit testing (ID validation, parsing, ordering).
 * - Safe DOM construction (zero unsafe innerHTML) defending against XSS.
 * - Accessible landmarks, breadcrumb navigation, and keyboard interaction.
 * =============================================================================
 */

import { apiClient } from '../api/api.js';
import { showLoading, showError, showToast, createSpeakerIcon, createSpeechButton, playPronunciation, speakHanzi } from '../ui/ui.js';
import { createSafeElement, clearContainer } from '../ui/security.js';
import { initNavbarAuth } from '../ui/nav.js';
import { formatLessonDate, sanitizeLessonTitle } from './lessons-page.js';
import { openNotesModal } from '../ui/notes-modal.js';
import { openVocabWritingModal } from '../ui/character-writing/vocab-writing-modal.js';
import { authManager } from '../auth/auth-state.js';

export { createSpeakerIcon, openVocabWritingModal };

/**
 * Validates the raw lesson ID string from URL parameter.
 * 
 * @param {string|number|null|undefined} idParam 
 * @returns {number|null} Valid numeric ID, or null if invalid/missing
 */
export function validateLessonId(idParam) {
  if (idParam === null || idParam === undefined) {
    return null;
  }
  const str = String(idParam).trim();
  if (!/^\d+$/.test(str)) {
    return null;
  }
  const num = parseInt(str, 10);
  return num > 0 && Number.isSafeInteger(num) ? num : null;
}

/**
 * Formats the direct SRS review URL with lessonId for lesson-new-cards mode.
 * 
 * @param {number|string|null|undefined} lessonId 
 * @returns {string} Formatted URL (e.g. "srs-review.html?lessonId=10")
 */
export function formatSrsReviewUrl(lessonId) {
  const validId = validateLessonId(lessonId);
  return validId ? `srs-review.html?lessonId=${validId}` : 'srs-review.html';
}

/**
 * Formats the direct SRS review URL with lessonId for lesson-new-cards mode.
 * 
 * @param {number|string|null|undefined} lessonId 
 * @returns {string} Formatted URL (e.g. "srs-review.html?lessonId=10&mode=new")
 */
export function formatSrsNewCardsUrl(lessonId) {
  const validId = validateLessonId(lessonId);
  return validId ? `srs-review.html?lessonId=${validId}&mode=new` : 'srs-review.html';
}

/**
 * Formats the free practice URL with lessonId for lesson-practice-cards mode (zero SRS mutation).
 * 
 * @param {number|string|null|undefined} lessonId 
 * @returns {string} Formatted URL (e.g. "srs-review.html?lessonId=10&mode=practice")
 */
export function formatSrsPracticeUrl(lessonId) {
  const validId = validateLessonId(lessonId);
  return validId ? `srs-review.html?lessonId=${validId}&mode=practice` : 'srs-review.html';
}

/**
 * Calculates real lesson metrics from vocabularies and practice cards.
 * 
 * @param {Array<any>} vocabularies 
 * @param {Array<any>|null} practiceCards 
 * @param {Date} [now=new Date()]
 * @returns {{
 *   totalWords: number,
 *   learnedWords: number|null,
 *   dueWords: number|null,
 *   newWords: number,
 *   progressPercentage: number,
 *   hasDueCards: boolean
 * }}
 */
export function calculateLessonMetrics(vocabularies, practiceCards = null, now = new Date()) {
  const totalWords = Array.isArray(vocabularies) ? vocabularies.length : 0;

  if (!Array.isArray(practiceCards)) {
    return {
      totalWords,
      learnedWords: null,
      dueWords: null,
      newWords: totalWords,
      progressPercentage: 0,
      hasDueCards: false
    };
  }

  const nowDate = now instanceof Date ? now : new Date(now);

  const learnedCount = practiceCards.filter(c => {
    if (!c) return false;
    return c.isNew === false || (typeof c.repetitions === 'number' && c.repetitions > 0) || Boolean(c.nextReviewAt);
  }).length;

  const dueCount = practiceCards.filter(c => {
    if (!c || !c.nextReviewAt) return false;
    const dueTime = new Date(c.nextReviewAt);
    return !isNaN(dueTime.getTime()) && dueTime <= nowDate;
  }).length;

  const newCount = Math.max(0, totalWords - learnedCount);
  const progressPercentage = totalWords > 0 ? Math.round((learnedCount / totalWords) * 100) : 0;

  return {
    totalWords,
    learnedWords: learnedCount,
    dueWords: dueCount,
    newWords: newCount,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
    hasDueCards: dueCount > 0
  };
}

/**
 * Parses standard Spring Boot ApiResponse<LessonDetailResponse>.
 * 
 * @param {any} envelope 
 * @returns {{
 *   lessonId: number,
 *   title: string,
 *   status: string,
 *   vocabularyCount: number,
 *   vocabularies: Array<{
 *     vocabId: number,
 *     hanzi: string,
 *     pinyin: string,
 *     pinyinRaw: string,
 *     meaningHanViet: string,
 *     meaningVi: string,
 *     audioUrl?: string,
 *     videoWritingUrl?: string,
 *     exampleSentence?: string,
 *     exampleTranslation?: string,
 *     orderIndex: number
 *   }>,
 *   createdAt: string,
 *   updatedAt: string
 * }|null}
 */
export function parseLessonDetailResponse(envelopeOrData) {
  if (!envelopeOrData) {
    return null;
  }

  const data = (envelopeOrData.data !== undefined && envelopeOrData.data !== null) 
    ? envelopeOrData.data 
    : envelopeOrData;

  if (!data || typeof data !== 'object') {
    return null;
  }

  const rawVocabs = Array.isArray(data.vocabularies) ? data.vocabularies : [];
  const vocabularies = sortVocabulariesByOrderIndex(rawVocabs);

  return {
    lessonId: data.lessonId ?? null,
    title: sanitizeLessonTitle(data.title),
    status: data.status || 'Approved',
    vocabularyCount: typeof data.vocabularyCount === 'number' ? data.vocabularyCount : vocabularies.length,
    vocabularies,
    createdAt: data.createdAt || '',
    updatedAt: data.updatedAt || ''
  };
}

/**
 * Deterministically sorts vocabulary items by orderIndex ascending (1, 2, 3...).
 * 
 * @param {Array<any>} vocabularies 
 * @returns {Array<any>}
 */
export function sortVocabulariesByOrderIndex(vocabularies) {
  if (!Array.isArray(vocabularies)) {
    return [];
  }
  return [...vocabularies].sort((a, b) => {
    const orderA = typeof a?.orderIndex === 'number' ? a.orderIndex : 0;
    const orderB = typeof b?.orderIndex === 'number' ? b.orderIndex : 0;
    return orderA - orderB;
  });
}

// Centralized Speech Abstraction re-exports
export { isSpeechSynthesisAvailable, speakHanzi, playPronunciation, speechController } from '../ui/ui.js';

/**
 * Controller managing the public lesson detail page.
 */
export class LessonDetailPageController {
  constructor() {
    this.lessonId = null;
    this.lessonData = null;

    this.dom = {
      stateContainer: null,
      contentWrapper: null,
      breadcrumbTitle: null,
      heading: null,
      vocabCountBadge: null,
      lessonDate: null,
      vocabList: null,

      // Metrics & Progress
      statTotalWords: null,
      statLearnedWords: null,
      statDueWords: null,
      statNewWords: null,
      lessonProgressBar: null,
      lessonProgressBarFill: null,
      lessonProgressPercent: null,
      lessonProgressBadge: null,
      lessonAuthPrompt: null,

      // 4 Main Action Cards
      btnActionNewCards: null,
      btnActionLessonSrs: null,
      btnActionPractice: null,
      btnActionSystemSrs: null,
      badgeActionNew: null,
      badgeActionLessonSrs: null,
      badgeActionPractice: null,
      badgeActionSystemSrs: null,
      cardActionNew: null,
      cardActionLessonSrs: null,

      // Header Actions
      btnHeaderPractice: null,
      btnHeaderNewCards: null,
      btnHeaderLessonSrs: null,

      // Post-Study Actions
      btnGoToSrsReview: null,
      btnStartPracticeCards: null,
      btnStartNewCards: null,
      btnStartLessonSrs: null
    };
  }

  /**
   * Initializes DOM bindings and triggers lesson detail loading.
   */
  init() {
    this.dom.stateContainer = document.getElementById('lessonDetailStateContainer');
    this.dom.contentWrapper = document.getElementById('lessonDetailContent');
    this.dom.breadcrumbTitle = document.getElementById('breadcrumbLessonTitle');
    this.dom.heading = document.getElementById('lessonDetailHeading');
    this.dom.vocabCountBadge = document.getElementById('detailVocabCount');
    this.dom.lessonDate = document.getElementById('detailLessonDate');
    this.dom.vocabList = document.getElementById('lessonVocabList');

    // Metrics & Progress Elements
    this.dom.statTotalWords = document.getElementById('statTotalWords');
    this.dom.statLearnedWords = document.getElementById('statLearnedWords');
    this.dom.statDueWords = document.getElementById('statDueWords');
    this.dom.statNewWords = document.getElementById('statNewWords');
    this.dom.lessonProgressBar = document.getElementById('lessonProgressBar');
    this.dom.lessonProgressBarFill = document.getElementById('lessonProgressBarFill');
    this.dom.lessonProgressPercent = document.getElementById('lessonProgressPercent');
    this.dom.lessonProgressBadge = document.getElementById('lessonProgressBadge');
    this.dom.lessonAuthPrompt = document.getElementById('lessonAuthPrompt');

    // 4 Main Action Cards Elements
    this.dom.btnActionNewCards = document.getElementById('btnActionNewCards');
    this.dom.btnActionLessonSrs = document.getElementById('btnActionLessonSrs');
    this.dom.btnActionPractice = document.getElementById('btnActionPractice');
    this.dom.btnActionSystemSrs = document.getElementById('btnActionSystemSrs');
    this.dom.badgeActionNew = document.getElementById('badgeActionNew');
    this.dom.badgeActionLessonSrs = document.getElementById('badgeActionLessonSrs');
    this.dom.badgeActionPractice = document.getElementById('badgeActionPractice');
    this.dom.badgeActionSystemSrs = document.getElementById('badgeActionSystemSrs');
    this.dom.cardActionNew = document.getElementById('cardActionNew');
    this.dom.cardActionLessonSrs = document.getElementById('cardActionLessonSrs');

    // Header Actions
    this.dom.btnHeaderPractice = document.getElementById('btnHeaderPractice');
    this.dom.btnHeaderNewCards = document.getElementById('btnHeaderNewCards');
    this.dom.btnHeaderLessonSrs = document.getElementById('btnHeaderLessonSrs');

    // Post-Study Actions
    this.dom.btnGoToSrsReview = document.getElementById('btnGoToSrsReview');
    this.dom.btnStartPracticeCards = document.getElementById('btnStartPracticeCards');
    this.dom.btnStartNewCards = document.getElementById('btnStartNewCards');
    this.dom.btnStartLessonSrs = document.getElementById('btnStartLessonSrs');

    if (!this.dom.stateContainer || !this.dom.contentWrapper) {
      return;
    }

    // Extract ID from URL
    const params = new URLSearchParams(window.location.search);
    const rawId = params.get('id');
    this.lessonId = validateLessonId(rawId);

    if (this.lessonId) {
      const reviewUrl = formatSrsReviewUrl(this.lessonId);
      const practiceUrl = formatSrsPracticeUrl(this.lessonId);
      const newCardsUrl = formatSrsNewCardsUrl(this.lessonId);

      if (this.dom.btnGoToSrsReview) this.dom.btnGoToSrsReview.href = 'srs-review.html';
      if (this.dom.btnActionSystemSrs) this.dom.btnActionSystemSrs.href = 'srs-review.html';

      if (this.dom.btnStartPracticeCards) this.dom.btnStartPracticeCards.href = practiceUrl;
      if (this.dom.btnHeaderPractice) this.dom.btnHeaderPractice.href = practiceUrl;
      if (this.dom.btnActionPractice) this.dom.btnActionPractice.href = practiceUrl;

      if (this.dom.btnStartNewCards) this.dom.btnStartNewCards.href = newCardsUrl;
      if (this.dom.btnHeaderNewCards) this.dom.btnHeaderNewCards.href = newCardsUrl;
      if (this.dom.btnActionNewCards) this.dom.btnActionNewCards.href = newCardsUrl;

      if (this.dom.btnStartLessonSrs) this.dom.btnStartLessonSrs.href = reviewUrl;
      if (this.dom.btnHeaderLessonSrs) this.dom.btnHeaderLessonSrs.href = reviewUrl;
      if (this.dom.btnActionLessonSrs) this.dom.btnActionLessonSrs.href = reviewUrl;
    }

    if (!this.lessonId) {
      this.renderInvalidIdState();
      return;
    }

    this.loadLessonDetail();
  }

  /**
   * Displays friendly error state when ID is missing or non-numeric.
   */
  renderInvalidIdState() {
    this.dom.contentWrapper.classList.add('d-none');
    showError(this.dom.stateContainer, {
      title: 'Mã bài học không hợp lệ',
      message: 'Mã bài học không hợp lệ hoặc thiếu thông tin định danh. Vui lòng chọn bài học từ danh mục bài học công khai.',
      retryText: 'Về danh mục bài học',
      onRetry: () => {
        window.location.href = 'lessons.html';
      }
    });

    if (this.dom.breadcrumbTitle) {
      this.dom.breadcrumbTitle.textContent = 'Mã bài học không hợp lệ';
    }
  }

  /**
   * Fetches lesson detail from GET /api/v1/lessons/{id}.
   */
  async loadLessonDetail() {
    this.dom.contentWrapper.classList.add('d-none');
    showLoading(this.dom.stateContainer, { message: 'Đang nạp nội dung bài học...' });

    try {
      const envelope = await apiClient(`/lessons/${this.lessonId}`);
      clearContainer(this.dom.stateContainer);

      const parsed = parseLessonDetailResponse(envelope);
      if (!parsed) {
        throw new Error('Dữ liệu bài học không đúng định dạng');
      }

      this.lessonData = parsed;
      this.renderLessonContent();

    } catch (err) {
      this.dom.contentWrapper.classList.add('d-none');

      // Neutral 404 defense: Do NOT expose internal workflow state (Draft/Pending/Rejected)
      const is404 = err.status === 404 || (err.message && err.message.includes('404'));
      const friendlyMessage = is404
        ? 'Không tìm thấy bài học hoặc bài học chưa được công khai.'
        : (err.message || 'Không thể tải chi tiết bài học. Vui lòng thử lại.');

      showError(this.dom.stateContainer, {
        title: is404 ? 'Không tìm thấy bài học' : 'Lỗi nạp bài học',
        message: friendlyMessage,
        onRetry: () => this.loadLessonDetail()
      });

      if (this.dom.breadcrumbTitle) {
        this.dom.breadcrumbTitle.textContent = is404 ? 'Bài học không tìm thấy' : 'Lỗi nạp bài học';
      }
    }
  }

  /**
   * Renders lesson header metadata and ordered vocabulary list.
   */
  renderLessonContent() {
    const lesson = this.lessonData;
    if (!lesson) {
      return;
    }

    // 1. Update Title & Breadcrumbs
    document.title = `${lesson.title} | Chi Tiết Bài Học`;
    if (this.dom.heading) {
      this.dom.heading.textContent = lesson.title;
    }
    if (this.dom.breadcrumbTitle) {
      this.dom.breadcrumbTitle.textContent = lesson.title;
    }

    // 2. Update Metadata
    if (this.dom.vocabCountBadge) {
      this.dom.vocabCountBadge.textContent = `${lesson.vocabularyCount} từ vựng`;
    }

    if (this.dom.lessonDate) {
      const dateStr = formatLessonDate(lesson.updatedAt || lesson.createdAt);
      this.dom.lessonDate.textContent = dateStr || 'Chưa xác định';
      if (lesson.updatedAt || lesson.createdAt) {
        this.dom.lessonDate.setAttribute('datetime', lesson.updatedAt || lesson.createdAt);
      }
    }

    // Update SRS Review and Practice Links with authoritative lessonId
    if (lesson.lessonId) {
      if (this.dom.btnGoToSrsReview) {
        this.dom.btnGoToSrsReview.href = 'srs-review.html';
      }
      if (this.dom.btnStartPracticeCards) {
        this.dom.btnStartPracticeCards.href = formatSrsPracticeUrl(lesson.lessonId);
      }
      if (this.dom.btnStartNewCards) {
        this.dom.btnStartNewCards.href = formatSrsNewCardsUrl(lesson.lessonId);
      }
      if (this.dom.btnHeaderPractice) {
        this.dom.btnHeaderPractice.href = formatSrsPracticeUrl(lesson.lessonId);
      }
      if (this.dom.btnHeaderNewCards) {
        this.dom.btnHeaderNewCards.href = formatSrsNewCardsUrl(lesson.lessonId);
      }
      if (this.dom.btnActionNewCards) {
        this.dom.btnActionNewCards.href = formatSrsNewCardsUrl(lesson.lessonId);
      }
    }

    // 3. Render Ordered Vocabulary List
    clearContainer(this.dom.vocabList);

    if (lesson.vocabularies.length === 0) {
      const emptyLi = createSafeElement('li', {
        className: 'p-4 text-center text-muted bg-surface rounded-3 border',
        text: 'Bài học này hiện chưa có từ vựng nào.'
      });
      this.dom.vocabList.appendChild(emptyLi);
    } else {
      for (const item of lesson.vocabularies) {
        const li = this.createVocabularyItemElement(item);
        this.dom.vocabList.appendChild(li);
      }
    }

    // 4. Reveal Content
    this.dom.contentWrapper.classList.remove('d-none');

    // 5. Load Real Learner Metrics & Dynamic Action States
    this.loadLessonProgress();
  }

  /**
   * Loads user study stats & card progress to populate lesson metrics and configure 4 actions.
   */
  async loadLessonProgress() {
    let practiceCards = null;
    let systemDueCount = null;

    if (authManager.isAuthenticated()) {
      try {
        const [practiceRes, statsRes] = await Promise.allSettled([
          apiClient('/srs/practice-cards', { params: { lessonId: this.lessonId } }),
          apiClient('/srs/stats')
        ]);

        if (practiceRes.status === 'fulfilled') {
          practiceCards = (practiceRes.value && practiceRes.value.data) ? practiceRes.value.data : practiceRes.value;
        }
        if (statsRes.status === 'fulfilled') {
          const stats = (statsRes.value && statsRes.value.data) ? statsRes.value.data : statsRes.value;
          if (stats && typeof stats.cardsDue === 'number') {
            systemDueCount = stats.cardsDue;
          }
        }
      } catch {
        practiceCards = null;
      }
    }

    const metrics = calculateLessonMetrics(this.lessonData?.vocabularies, practiceCards);
    this.renderMetricsAndActions(metrics, systemDueCount);
  }

  /**
   * Updates metric displays, progress bar, and 4 primary action buttons.
   * 
   * @param {Object} metrics 
   * @param {number|null} [systemDueCount=null] 
   */
  renderMetricsAndActions(metrics, systemDueCount = null) {
    if (this.dom.statTotalWords) {
      this.dom.statTotalWords.textContent = `${metrics.totalWords} từ`;
    }
    if (this.dom.statLearnedWords) {
      this.dom.statLearnedWords.textContent = metrics.learnedWords !== null ? `${metrics.learnedWords} từ` : '—';
    }
    if (this.dom.statDueWords) {
      this.dom.statDueWords.textContent = metrics.dueWords !== null ? `${metrics.dueWords} thẻ` : '—';
    }
    if (this.dom.statNewWords) {
      this.dom.statNewWords.textContent = `${metrics.newWords} từ`;
    }
    if (this.dom.lessonProgressPercent) {
      this.dom.lessonProgressPercent.textContent = `${metrics.progressPercentage}%`;
    }
    if (this.dom.lessonProgressBarFill) {
      this.dom.lessonProgressBarFill.style.width = `${metrics.progressPercentage}%`;
    }
    if (this.dom.lessonProgressBar) {
      this.dom.lessonProgressBar.setAttribute('aria-valuenow', String(metrics.progressPercentage));
    }

    const isAuthed = authManager.isAuthenticated();
    if (this.dom.lessonProgressBadge) {
      if (!isAuthed) {
        this.dom.lessonProgressBadge.textContent = 'Chưa đăng nhập';
        this.dom.lessonProgressBadge.className = 'badge-status badge-status-draft';
      } else if (metrics.progressPercentage === 100) {
        this.dom.lessonProgressBadge.textContent = 'Đã thuộc 100%';
        this.dom.lessonProgressBadge.className = 'badge-status badge-status-approved';
      } else if (metrics.learnedWords > 0) {
        this.dom.lessonProgressBadge.textContent = `Đang học (${metrics.progressPercentage}%)`;
        this.dom.lessonProgressBadge.className = 'badge-status badge-status-active';
      } else {
        this.dom.lessonProgressBadge.textContent = 'Sẵn sàng học';
        this.dom.lessonProgressBadge.className = 'badge-status badge-status-draft';
      }
    }

    if (this.dom.lessonAuthPrompt && !isAuthed) {
      this.dom.lessonAuthPrompt.textContent = 'Đăng nhập để theo dõi số từ đã học và lịch ôn SuperMemo-2 cá nhân.';
    }

    const lessonId = this.lessonId;
    const reviewUrl = formatSrsReviewUrl(lessonId);
    const practiceUrl = formatSrsPracticeUrl(lessonId);
    const newCardsUrl = formatSrsNewCardsUrl(lessonId);

    // 1. Action A: Học từ mới (chuyển đến /new-cards mode)
    const newBtnText = (metrics.learnedWords !== null && metrics.newWords === 0)
      ? 'Đã học hết từ mới'
      : (metrics.newWords > 0 && isAuthed ? `Học từ mới (${metrics.newWords})` : 'Học từ mới');

    [this.dom.btnActionNewCards, this.dom.btnHeaderNewCards, this.dom.btnStartNewCards].forEach(el => {
      if (el) {
        el.href = newCardsUrl;
        el.textContent = newBtnText;
      }
    });
    if (this.dom.badgeActionNew) {
      this.dom.badgeActionNew.textContent = (metrics.learnedWords !== null && metrics.newWords === 0)
        ? 'Đã xong từ mới'
        : `${metrics.newWords} từ mới`;
      this.dom.badgeActionNew.className = (metrics.learnedWords !== null && metrics.newWords === 0)
        ? 'badge-status badge-status-approved small'
        : 'badge-status badge-status-draft small';
    }

    // 2. Action B: Ôn SRS bài này (khi có thẻ đến hạn trong bài)
    const srsBtnText = (metrics.dueWords !== null && metrics.dueWords > 0)
      ? `Ôn SRS bài này (${metrics.dueWords})`
      : 'Ôn SRS bài này';

    [this.dom.btnActionLessonSrs, this.dom.btnHeaderLessonSrs, this.dom.btnStartLessonSrs].forEach(el => {
      if (el) {
        el.href = reviewUrl;
        el.textContent = srsBtnText;
      }
    });
    if (this.dom.badgeActionLessonSrs) {
      if (metrics.dueWords !== null && metrics.dueWords > 0) {
        this.dom.badgeActionLessonSrs.textContent = `${metrics.dueWords} thẻ đến hạn`;
        this.dom.badgeActionLessonSrs.className = 'badge-status badge-status-rejected small';
        if (this.dom.cardActionLessonSrs) {
          this.dom.cardActionLessonSrs.classList.add('action-card-primary');
        }
      } else if (metrics.dueWords === 0 && isAuthed) {
        this.dom.badgeActionLessonSrs.textContent = 'Chưa đến hạn';
        this.dom.badgeActionLessonSrs.className = 'badge-status badge-status-approved small';
        if (this.dom.cardActionLessonSrs) {
          this.dom.cardActionLessonSrs.classList.remove('action-card-primary');
        }
      } else {
        this.dom.badgeActionLessonSrs.textContent = 'SRS bài';
        this.dom.badgeActionLessonSrs.className = 'badge-status badge-status-pending small';
      }
    }

    // 3. Action C: Luyện tự do (free practice, zero SRS mutation)
    [this.dom.btnActionPractice, this.dom.btnHeaderPractice, this.dom.btnStartPracticeCards].forEach(el => {
      if (el) {
        el.href = practiceUrl;
        el.textContent = 'Luyện tự do';
      }
    });

    // 4. Action D: Ôn SRS toàn hệ thống (phòng ôn chung)
    [this.dom.btnActionSystemSrs, this.dom.btnGoToSrsReview].forEach(el => {
      if (el) {
        el.href = 'srs-review.html';
        el.textContent = 'Ôn toàn hệ thống';
      }
    });
    if (this.dom.badgeActionSystemSrs && systemDueCount !== null) {
      this.dom.badgeActionSystemSrs.textContent = `${systemDueCount} thẻ hệ thống`;
    }
  }

  /**
   * Creates a semantic <li> element for a single vocabulary item in the lesson.
   * 
   * @param {any} item 
   * @returns {HTMLLIElement}
   */
  createVocabularyItemElement(item) {
    const li = createSafeElement('li', {
      className: 'lesson-vocab-item',
      attrs: typeof item.orderIndex === 'number' ? { value: String(item.orderIndex) } : {}
    });

    // Main section: Order badge, Hanzi, Pinyin, Han-Viet
    const mainSection = createSafeElement('div', { className: 'lesson-vocab-main' });

    // Order Badge
    const orderBadge = createSafeElement('span', {
      className: 'lesson-vocab-order-badge',
      text: String(item.orderIndex || 1),
      attrs: { title: `Thứ tự bài học: #${item.orderIndex || 1}` }
    });
    mainSection.appendChild(orderBadge);

    // Hanzi Glyph
    const hanziSpan = createSafeElement('span', {
      className: 'lesson-vocab-hanzi',
      text: item.hanzi || '字',
      attrs: { lang: 'zh-Hans' }
    });
    mainSection.appendChild(hanziSpan);

    // Readings: Pinyin & Han-Viet
    const readingsDiv = createSafeElement('div', { className: 'lesson-vocab-readings' });
    const pinyinSpan = createSafeElement('span', {
      className: 'lesson-vocab-pinyin',
      text: item.pinyin || ''
    });
    readingsDiv.appendChild(pinyinSpan);

    const hanvietSpan = createSafeElement('span', {
      className: 'lesson-vocab-hanviet',
      text: item.meaningHanViet ? `[${item.meaningHanViet}]` : ''
    });
    readingsDiv.appendChild(hanvietSpan);

    mainSection.appendChild(readingsDiv);
    li.appendChild(mainSection);

    // Details section: Meaning & Example sentence
    const detailsDiv = createSafeElement('div', { className: 'lesson-vocab-details' });
    const meaningDiv = createSafeElement('div', {
      className: 'lesson-vocab-meaning',
      text: item.meaningVi || 'Đang cập nhật giải nghĩa'
    });
    detailsDiv.appendChild(meaningDiv);

    if (item.exampleSentence) {
      const exampleDiv = createSafeElement('div', { className: 'lesson-vocab-example' });
      const sentenceSpan = createSafeElement('span', {
        text: `Ví dụ: ${item.exampleSentence}`,
        attrs: { lang: 'zh-Hans' }
      });
      exampleDiv.appendChild(sentenceSpan);

      if (item.exampleTranslation) {
        const transSpan = createSafeElement('span', {
          text: ` (${item.exampleTranslation})`
        });
        exampleDiv.appendChild(transSpan);
      }
      detailsDiv.appendChild(exampleDiv);
    }
    li.appendChild(detailsDiv);

    // Actions: Speech button & View in dictionary
    const actionsDiv = createSafeElement('div', { className: 'lesson-vocab-actions' });

    // Speech Button - using shared createSpeechButton with button lock and fallback support
    const speechBtn = createSpeechButton({
      className: 'btn-vocab-speech',
      ariaLabel: `Phát âm từ vựng ${item.hanzi || ''}`,
      title: 'Phát âm',
      iconSize: 14,
      onClick: (e) => {
        e.stopPropagation();
        speakHanzi(item.hanzi, { button: speechBtn });
      }
    });
    actionsDiv.appendChild(speechBtn);

    // Dictionary Navigation Link
    if (item.hanzi) {
      const dictLink = createSafeElement('a', {
        className: 'btn-chinese-secondary py-1 px-2 text-decoration-none small',
        text: 'Tra từ điển',
        attrs: {
          href: `vocabulary.html?search=${encodeURIComponent(item.hanzi)}`,
          'aria-label': `Tra cứu từ vựng ${item.hanzi} trong từ điển`
        }
      });
      actionsDiv.appendChild(dictLink);

      // Character Writing Practice Button
      const writeBtn = createSafeElement('button', {
        className: 'btn-chinese-secondary py-1 px-2 small lesson-vocab-write-btn',
        text: '✍️ Luyện viết',
        attrs: {
          type: 'button',
          'aria-label': `Luyện viết chữ Hán cho từ ${item.hanzi || ''}`,
          title: 'Luyện viết chữ Hán (Cách viết / Luyện nét / Luyện viết)'
        }
      });
      writeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openVocabWritingModal({
          vocabItem: item,
          triggerElement: writeBtn
        });
      });
      actionsDiv.appendChild(writeBtn);
    }

    // Personal Note Button
    if (item.vocabId) {
      const noteBtn = createSafeElement('button', {
        className: 'btn-chinese-secondary py-1 px-2 small lesson-vocab-note-btn',
        text: 'Ghi chú',
        attrs: {
          type: 'button',
          'aria-label': `Ghi chú cá nhân cho từ vựng ${item.hanzi || ''}`,
          title: 'Ghi chú cá nhân'
        }
      });
      noteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openNotesModal({
          vocabId: item.vocabId,
          hanzi: item.hanzi,
          pinyin: item.pinyin,
          meaning: item.meaningVi,
          triggerElement: noteBtn
        });
      });
      actionsDiv.appendChild(noteBtn);
    }

    li.appendChild(actionsDiv);
    return li;
  }
}

// Auto-instantiate if on lesson-detail.html
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initNavbarAuth('navAuthContainer');
    if (document.getElementById('lessonDetailHeading')) {
      const controller = new LessonDetailPageController();
      controller.init();
    }
  });
}
