/**
 * =============================================================================
 * PUBLIC LESSON & CHAPTER DETAIL PAGE CONTROLLER
 * Module: frontend/js/pages/lesson-detail-page.js
 * 
 * Responsibilities:
 * - Reads and validates lessonId from URL query parameter (?id=...).
 * - Also supports 5-tab curriculum routing:
 *   ?group=radicals50&chapter=0..4
 *   ?group=radicals214&chapter=0..10
 *   ?group=hsk1|hsk2|hsk3&chapter=0..24
 * - Fetches approved public lesson detail from GET /api/v1/lessons/{id} or /api/v1/radicals.
 * - Graceful fallback to standardized HSK 3.0 curriculum catalog when offline.
 * - Neutral 404 defense: non-approved/missing lessons render neutral 404 error
 *   without disclosing internal moderation state.
 * - Unified 4-Room Quick Launch Bar (Flashcard, Writing, Listening, Reading).
 * - Interactive pronunciation with Web Speech API and character stroke writing modal.
 * - Safe DOM construction (zero unsafe innerHTML) defending against XSS.
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
import { partitionRadicals } from './radicals-page.js';
import { HSK1_TOPICS, HSK2_TOPICS, HSK3_TOPICS } from './srs-review-page.js';
import { SEED_RADICALS, CHAR_TO_RADICAL_MAP, CHAR_TO_RADICALS_MAP } from '../api/demo-seed-data.js';

export { createSpeakerIcon, openVocabWritingModal };

const RADICAL_BY_ID = new Map(
  Array.isArray(SEED_RADICALS) ? SEED_RADICALS.map(r => [Number(r.radicalId), r]) : []
);

/**
 * Resolves constituent Kangxi radicals for a given vocabulary item or Chinese string.
 * Decomposes characters and resolves their authoritative Kangxi radicals.
 *
 * @param {Object|string} vocabOrHanzi
 * @returns {Array<{ radicalId: number, character: string, pinyin: string, meaningHanViet: string, meaningVi: string, charInWord: string }>}
 */
export function getConstituentRadicals(vocabOrHanzi) {
  if (!vocabOrHanzi) return [];

  // If object with pre-populated radicals from backend/item
  if (typeof vocabOrHanzi === 'object') {
    if (Array.isArray(vocabOrHanzi.radicals) && vocabOrHanzi.radicals.length > 0) {
      return vocabOrHanzi.radicals.map(r => ({
        radicalId: Number(r.radicalId),
        character: r.character || '',
        pinyin: r.pinyin || '',
        meaningHanViet: r.meaningHanViet || '',
        meaningVi: r.meaningVi || '',
        charInWord: r.hanziChar || ''
      }));
    }
  }

  const hanzi = typeof vocabOrHanzi === 'string' ? vocabOrHanzi : vocabOrHanzi.hanzi;
  if (!hanzi || typeof hanzi !== 'string') return [];

  const radicals = [];
  const seenIds = new Set();

  for (const char of hanzi) {
    if (!/[\u4e00-\u9fa5]/.test(char)) continue;

    const radIds = (typeof CHAR_TO_RADICALS_MAP !== 'undefined' && CHAR_TO_RADICALS_MAP[char])
      || (typeof CHAR_TO_RADICAL_MAP !== 'undefined' && CHAR_TO_RADICAL_MAP[char] ? [CHAR_TO_RADICAL_MAP[char]] : []);

    for (const rid of radIds) {
      const numId = Number(rid);
      if (numId > 0 && !seenIds.has(numId)) {
        seenIds.add(numId);
        const rad = RADICAL_BY_ID.get(numId);
        if (rad) {
          radicals.push({
            radicalId: rad.radicalId,
            character: rad.character,
            pinyin: rad.pinyin,
            meaningHanViet: rad.meaningHanViet,
            meaningVi: rad.meaningVi,
            charInWord: char
          });
        }
      }
    }
  }

  return radicals;
}

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
 * Friendly display labels for groups
 */
const GROUP_LABELS = {
  radicals50: '50 Bộ thủ thông dụng',
  radicals214: '214 Bộ thủ Khang Hy',
  hsk1: 'HSK 1 (300 từ vựng)',
  hsk2: 'HSK 2 (200 từ vựng)',
  hsk3: 'HSK 3 (500 từ vựng)'
};

/**
 * Controller managing the public lesson and chapter detail page.
 */
export class LessonDetailPageController {
  constructor() {
    this.lessonId = null;
    this.group = null;
    this.chapter = null;
    this.mode = 'flashcard';
    this.lessonData = null;

    this.dom = {
      stateContainer: null,
      contentWrapper: null,
      breadcrumbReviewHub: null,
      breadcrumbGroupItem: null,
      breadcrumbGroupLink: null,
      breadcrumbLessonTitle: null,
      heading: null,
      detailStatusBadge: null,
      vocabCountBadge: null,
      detailLessonDate: null,
      lessonDetailDescription: null,
      vocabList: null,
      subHeading: null,

      // Navigation & Launch
      btnBackToReview: null,
      btnBottomBackToShelf: null,
      btnStartPrimaryStudy: null,
      btnLaunchFlashcard: null,
      btnLaunchWriting: null,
      btnLaunchListening: null,
      btnLaunchReading: null
    };
  }

  /**
   * Initializes DOM bindings and triggers lesson detail loading.
   */
  init() {
    this.dom.stateContainer = document.getElementById('lessonDetailStateContainer');
    this.dom.contentWrapper = document.getElementById('lessonDetailContent');
    this.dom.breadcrumbReviewHub = document.getElementById('breadcrumbReviewHub');
    this.dom.breadcrumbGroupItem = document.getElementById('breadcrumbGroupItem');
    this.dom.breadcrumbGroupLink = document.getElementById('breadcrumbGroupLink');
    this.dom.breadcrumbLessonTitle = document.getElementById('breadcrumbLessonTitle');
    this.dom.heading = document.getElementById('lessonDetailHeading');
    this.dom.detailStatusBadge = document.getElementById('detailStatusBadge');
    this.dom.vocabCountBadge = document.getElementById('detailVocabCount');
    this.dom.detailLessonDate = document.getElementById('detailLessonDate');
    this.dom.lessonDetailDescription = document.getElementById('lessonDetailDescription');
    this.dom.vocabList = document.getElementById('lessonVocabList');
    this.dom.subHeading = document.getElementById('lessonSubHeading');

    this.dom.btnBackToReview = document.getElementById('btnBackToReview');
    this.dom.btnBottomBackToShelf = document.getElementById('btnBottomBackToShelf');
    this.dom.btnStartPrimaryStudy = document.getElementById('btnStartPrimaryStudy');
    this.dom.btnLaunchFlashcard = document.getElementById('btnLaunchFlashcard');
    this.dom.btnLaunchWriting = document.getElementById('btnLaunchWriting');
    this.dom.btnLaunchListening = document.getElementById('btnLaunchListening');
    this.dom.btnLaunchReading = document.getElementById('btnLaunchReading');

    if (!this.dom.stateContainer || !this.dom.contentWrapper) {
      return;
    }

    // Extract query parameters
    const params = new URLSearchParams(window.location.search);
    const rawId = params.get('id');
    this.lessonId = validateLessonId(rawId);
    this.group = params.get('group') || null;
    const chapterParam = params.get('chapter');
    this.chapter = chapterParam !== null && !isNaN(parseInt(chapterParam, 10)) ? parseInt(chapterParam, 10) : null;
    this.mode = params.get('mode') || 'flashcard';

    // Update Breadcrumb & Return links
    this.setupNavigationLinks();

    // Route depending on parameters
    if (this.group === 'radicals50' || this.group === 'radicals214') {
      this.loadRadicalChapterDetail();
    } else if (this.lessonId) {
      this.loadBackendLessonDetail();
    } else if (this.group && this.chapter !== null) {
      this.loadCatalogHskDetail();
    } else {
      this.renderInvalidIdState();
    }
  }

  /**
   * Sets up all back, breadcrumb, and 4-room action links.
   */
  setupNavigationLinks() {
    const activeGroup = this.group || 'hsk1';
    const activeChapter = this.chapter !== null ? this.chapter : 0;
    const shelfUrl = `srs-review.html?mode=${encodeURIComponent(this.mode)}&group=${encodeURIComponent(activeGroup)}`;

    if (this.group) {
      if (this.dom.btnBackToReview) {
        this.dom.btnBackToReview.href = shelfUrl;
        this.dom.btnBackToReview.textContent = '← Quay lại Ôn tập';
      }
      if (this.dom.btnBottomBackToShelf) {
        this.dom.btnBottomBackToShelf.href = shelfUrl;
        this.dom.btnBottomBackToShelf.textContent = '← Về phòng ôn tập';
      }
      if (this.dom.breadcrumbReviewHub) {
        this.dom.breadcrumbReviewHub.href = shelfUrl;
        this.dom.breadcrumbReviewHub.textContent = 'Ôn tập';
      }
      if (this.dom.breadcrumbGroupItem && this.dom.breadcrumbGroupLink) {
        this.dom.breadcrumbGroupItem.classList.remove('d-none');
        this.dom.breadcrumbGroupLink.href = shelfUrl;
        this.dom.breadcrumbGroupLink.textContent = GROUP_LABELS[this.group] || this.group.toUpperCase();
      }
    } else {
      if (this.dom.btnBackToReview) {
        this.dom.btnBackToReview.href = 'lessons.html';
        this.dom.btnBackToReview.textContent = '← Danh mục Bài học';
      }
      if (this.dom.btnBottomBackToShelf) {
        this.dom.btnBottomBackToShelf.href = 'lessons.html';
        this.dom.btnBottomBackToShelf.textContent = '← Về danh mục bài học';
      }
      if (this.dom.breadcrumbReviewHub) {
        this.dom.breadcrumbReviewHub.href = 'lessons.html';
        this.dom.breadcrumbReviewHub.textContent = 'Bài học';
      }
      if (this.dom.breadcrumbGroupItem) {
        this.dom.breadcrumbGroupItem.classList.add('d-none');
      }
    }

    // 4 Modern Rooms Quick Launch Links
    const makeRoomUrl = (roomMode) => {
      let url = `srs-review.html?mode=${encodeURIComponent(roomMode)}&group=${encodeURIComponent(activeGroup)}`;
      if (this.lessonId) url += `&lessonId=${this.lessonId}`;
      if (this.chapter !== null) url += `&chapter=${activeChapter}`;
      return url;
    };

    if (this.dom.btnLaunchFlashcard) this.dom.btnLaunchFlashcard.href = makeRoomUrl('flashcard');
    if (this.dom.btnLaunchWriting) this.dom.btnLaunchWriting.href = makeRoomUrl('writing');
    if (this.dom.btnLaunchListening) this.dom.btnLaunchListening.href = makeRoomUrl('listening');
    if (this.dom.btnLaunchReading) this.dom.btnLaunchReading.href = makeRoomUrl('reading');

    if (this.dom.btnStartPrimaryStudy) {
      this.dom.btnStartPrimaryStudy.href = makeRoomUrl(this.mode);
    }
  }

  /**
   * Displays friendly error state when ID is missing or non-numeric and no group is provided.
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

    if (this.dom.breadcrumbLessonTitle) {
      this.dom.breadcrumbLessonTitle.textContent = 'Mã bài học không hợp lệ';
    }
  }

  /**
   * Loads radical chapter detail for 50 Radicals or 214 Radicals.
   */
  async loadRadicalChapterDetail() {
    this.dom.contentWrapper.classList.add('d-none');
    showLoading(this.dom.stateContainer, { message: 'Đang nạp danh sách bộ thủ...' });

    let items = [];
    try {
      const resp = await apiClient('/radicals', { params: { page: 0, size: 214 } });
      items = Array.isArray(resp?.items) ? resp.items : [];
    } catch (err) {
      console.warn('[LessonDetail] Error loading radicals from API, using offline SEED_RADICALS:', err);
    }

    if (items.length === 0 && Array.isArray(SEED_RADICALS) && SEED_RADICALS.length > 0) {
      items = SEED_RADICALS;
    }

    clearContainer(this.dom.stateContainer);

    let chapterRadicals = [];
    let chapterTitle = '';
    let chapterDesc = '';
    const chapIdx = this.chapter !== null ? this.chapter : 0;

    if (this.group === 'radicals50') {
      const partitioned = partitionRadicals(items);
      const list = partitioned.commonRadicals.length > 0 ? partitioned.commonRadicals : items.slice(0, 50);
      const start = chapIdx * 10;
      const end = Math.min(list.length, start + 10);
      chapterRadicals = list.slice(start, end);
      chapterTitle = `50 Bộ Thủ Thông Dụng — Chặng ${String(chapIdx + 1).padStart(2, '0')}: Bộ thủ ${start + 1} đến ${end}`;
      chapterDesc = `Tập trung ghi nhớ nhận diện mặt chữ, pinyin, âm Hán-Việt và nghĩa tiếng Việt của ${chapterRadicals.length} bộ thủ cốt lõi.`;
    } else {
      const list = items;
      const start = chapIdx * 20;
      const end = Math.min(list.length, start + 20);
      chapterRadicals = list.slice(start, end);
      chapterTitle = `214 Bộ Thủ Khang Hy — Chặng ${String(chapIdx + 1).padStart(2, '0')}: Bộ thủ ${start + 1} đến ${end}`;
      chapterDesc = `Toàn bộ ${chapterRadicals.length} bộ thủ Khang Hy theo số nét chuẩn hóa giúp tra cứu và giải nghĩa cấu tạo chữ Hán.`;
    }

    this.renderRadicalsContent(chapterTitle, chapterDesc, chapterRadicals);
  }

  /**
   * Renders radicals content into the list and header.
   */
  renderRadicalsContent(title, description, radicals) {
    document.title = `${title} | Chi Tiết Bài Học`;
    if (this.dom.heading) this.dom.heading.textContent = title;
    if (this.dom.breadcrumbLessonTitle) this.dom.breadcrumbLessonTitle.textContent = title;
    if (this.dom.lessonDetailDescription) this.dom.lessonDetailDescription.textContent = description;
    if (this.dom.vocabCountBadge) this.dom.vocabCountBadge.textContent = `${radicals.length} bộ thủ`;
    if (this.dom.subHeading) this.dom.subHeading.textContent = `${radicals.length} bộ thủ chuẩn hóa`;

    if (this.dom.detailStatusBadge) {
      this.dom.detailStatusBadge.textContent = this.group === 'radicals50' ? '50 Bộ thủ' : '214 Bộ thủ';
      this.dom.detailStatusBadge.className = 'badge-status badge-status-approved';
    }

    if (this.dom.detailLessonDate) {
      this.dom.detailLessonDate.textContent = 'Chuẩn hóa Khang Hy';
    }

    this.renderRadicalsList(radicals);
    this.dom.contentWrapper.classList.remove('d-none');
  }

  /**
   * Builds the DOM list of radicals.
   */
  renderRadicalsList(radicals) {
    if (!this.dom.vocabList) return;
    clearContainer(this.dom.vocabList);

    if (radicals.length === 0) {
      const emptyLi = createSafeElement('li', {
        className: 'text-center py-4 text-muted',
        text: 'Không có dữ liệu bộ thủ cho chặng này.'
      });
      this.dom.vocabList.appendChild(emptyLi);
      return;
    }

    radicals.forEach((rad, index) => {
      const li = createSafeElement('li', {
        className: 'lesson-vocab-item',
        id: `radical-item-${rad.radicalId || index + 1}`
      });

      // 1. Order Badge
      const orderBadge = createSafeElement('span', {
        className: 'lesson-vocab-order-badge',
        text: `#${index + 1}`
      });

      // 2. Main Character & Readings (Trỏ thẳng đến 214 Bộ Thủ)
      const radicalUrl = rad.radicalId
        ? `radicals.html?id=${encodeURIComponent(rad.radicalId)}`
        : `radicals.html?search=${encodeURIComponent(rad.character || rad.hanzi || '')}`;

      const mainDiv = createSafeElement('div', { className: 'lesson-vocab-main' });
      const hanziLink = createSafeElement('a', {
        className: 'lesson-vocab-hanzi text-decoration-none',
        attrs: {
          href: radicalUrl,
          lang: 'zh-Hans',
          title: `Tra cứu bộ thủ ${rad.character || rad.hanzi || ''} trong 214 Bộ Thủ`
        },
        text: rad.character || rad.hanzi || '?'
      });

      const readingsDiv = createSafeElement('div', { className: 'lesson-vocab-readings' });
      const pinyinSpan = createSafeElement('span', {
        className: 'lesson-vocab-pinyin',
        text: rad.pinyin || ''
      });
      const hanvietSpan = createSafeElement('span', {
        className: 'lesson-vocab-hanviet',
        text: rad.meaningHanViet ? `Hán-Việt: ${rad.meaningHanViet}` : ''
      });
      readingsDiv.appendChild(pinyinSpan);
      readingsDiv.appendChild(hanvietSpan);

      mainDiv.appendChild(orderBadge);
      mainDiv.appendChild(hanziLink);
      mainDiv.appendChild(readingsDiv);

      // 3. Details (Meaning, Stroke Count, Direct Link)
      const detailsDiv = createSafeElement('div', { className: 'lesson-vocab-details' });
      const meaningDiv = createSafeElement('div', {
        className: 'lesson-vocab-meaning',
        text: rad.meaningVi || 'Đang cập nhật ý nghĩa'
      });

      const linkBadge = createSafeElement('a', {
        className: 'badge bg-light text-dark border text-decoration-none ms-2 align-middle',
        attrs: {
          href: radicalUrl,
          title: `Tra cứu chi tiết bộ thủ ${rad.character || rad.hanzi || ''} trong 214 Bộ Thủ`
        },
        text: 'Tra bộ thủ ↗'
      });
      meaningDiv.appendChild(linkBadge);

      const strokeInfo = createSafeElement('div', {
        className: 'lesson-vocab-example text-muted small mt-1',
        text: `Số nét: ${rad.strokeCount || '--'} nét ${rad.isCommon50 ? '• Thuộc 50 bộ thủ thông dụng' : ''}`
      });
      detailsDiv.appendChild(meaningDiv);
      detailsDiv.appendChild(strokeInfo);

      // 4. Action Controls: Pronunciation Speaker and Character Writing
      const actionsDiv = createSafeElement('div', { className: 'lesson-vocab-actions' });
      
      const speechBtn = createSpeechButton({
        hanzi: rad.character || rad.hanzi || '',
        pinyin: rad.pinyin,
        className: 'btn-vocab-speech btn-chinese-secondary py-1 px-2 small',
        label: 'Nghe phát âm',
        iconOnly: true
      });

      // Character Writing Practice Button (.lesson-vocab-writing-btn)
      const writingBtn = createSafeElement('button', {
        className: 'lesson-vocab-writing-btn btn-chinese-secondary py-1 px-2 small',
        attrs: {
          type: 'button',
          'data-radical-id': String(rad.radicalId || ''),
          title: 'Luyện viết bộ thủ',
          'aria-label': `Luyện viết cho bộ thủ ${rad.character || rad.hanzi || ''}`
        },
        children: [
          createSafeElement('span', {
            attrs: { 'aria-hidden': 'true' },
            text: '✍️'
          })
        ]
      });

      writingBtn.addEventListener('click', () => {
        openVocabWritingModal({
          vocabItem: {
            hanzi: rad.character || rad.hanzi || '',
            pinyin: rad.pinyin || '',
            meaningVi: rad.meaningVi || rad.meaningHanViet || ''
          },
          triggerElement: writingBtn,
          initialMode: 'demo'
        });
      });

      actionsDiv.appendChild(speechBtn);
      actionsDiv.appendChild(writingBtn);

      li.appendChild(mainDiv);
      li.appendChild(detailsDiv);
      li.appendChild(actionsDiv);

      this.dom.vocabList.appendChild(li);
    });
  }

  /**
   * Fetches lesson detail from GET /api/v1/lessons/{id}.
   */
  async loadBackendLessonDetail() {
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
      // If backend fails (e.g. offline demo or unapproved ID), check if we can fall back to HSK catalog
      if (this.group && this.chapter !== null) {
        console.warn('[LessonDetail] Backend 404, falling back to static catalog:', err);
        clearContainer(this.dom.stateContainer);
        this.loadCatalogHskDetail();
        return;
      }

      this.dom.contentWrapper.classList.add('d-none');

      // Neutral 404 defense: Do NOT expose internal workflow state (Draft/Pending/Rejected)
      const is404 = err.status === 404 || (err.message && err.message.includes('404')) || (err.code === 'NOT_FOUND');
      const friendlyMessage = is404
        ? 'Không tìm thấy bài học hoặc bài học chưa được công khai.'
        : (err.message || 'Không thể tải chi tiết bài học. Vui lòng thử lại.');

      showError(this.dom.stateContainer, {
        title: is404 ? 'Không tìm thấy bài học' : 'Lỗi nạp bài học',
        message: friendlyMessage,
        onRetry: () => this.loadBackendLessonDetail()
      });

      if (this.dom.breadcrumbLessonTitle) {
        this.dom.breadcrumbLessonTitle.textContent = is404 ? 'Bài học không tìm thấy' : 'Lỗi nạp bài học';
      }
    }
  }

  /**
   * Loads HSK topic detail from frontend static catalog (HSK1, HSK2, HSK3).
   */
  loadCatalogHskDetail() {
    clearContainer(this.dom.stateContainer);
    let topics = HSK1_TOPICS;
    if (this.group === 'hsk2') topics = HSK2_TOPICS;
    if (this.group === 'hsk3') topics = HSK3_TOPICS;

    const topic = topics[this.chapter] || topics[0];
    if (!topic) {
      this.renderInvalidIdState();
      return;
    }

    const vocabularies = (topic.vocabularies || []).map((v, i) => ({
      vocabId: v.vocabId || i + 1,
      hanzi: v.hanzi,
      pinyin: v.pinyin,
      pinyinRaw: v.pinyinRaw || v.pinyin,
      meaningHanViet: v.meaningHanViet,
      meaningVi: v.meaningVi,
      exampleSentence: v.exampleSentence,
      exampleTranslation: v.exampleTranslation,
      orderIndex: i + 1
    }));

    this.lessonData = {
      lessonId: topic.backendLessonId || topic.topicId,
      title: `${(this.group || 'HSK 1').toUpperCase()} — ${topic.title}`,
      description: topic.description,
      status: 'Approved',
      vocabularyCount: vocabularies.length,
      vocabularies,
      createdAt: '',
      updatedAt: ''
    };

    this.renderLessonContent();
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
    if (this.dom.breadcrumbLessonTitle) {
      this.dom.breadcrumbLessonTitle.textContent = lesson.title;
    }
    if (this.dom.lessonDetailDescription) {
      this.dom.lessonDetailDescription.textContent = lesson.description || 'Từ vựng cốt lõi chuẩn hóa theo chương trình HSK 3.0';
    }

    // 2. Update Metadata
    if (this.dom.vocabCountBadge) {
      this.dom.vocabCountBadge.textContent = `${lesson.vocabularyCount} từ vựng`;
    }
    if (this.dom.subHeading) {
      this.dom.subHeading.textContent = `${lesson.vocabularyCount} từ vựng chuẩn HSK 3.0`;
    }

    if (this.dom.detailLessonDate) {
      const dateStr = formatLessonDate(lesson.updatedAt || lesson.createdAt);
      this.dom.detailLessonDate.textContent = dateStr || 'Chuẩn hóa 2026';
      if (lesson.updatedAt || lesson.createdAt) {
        this.dom.detailLessonDate.setAttribute('datetime', lesson.updatedAt || lesson.createdAt);
      }
    }

    // 3. Render Constituent Vocabularies in strictly orderIndex ascending
    this.renderVocabularyList(lesson.vocabularies);

    // 4. Reveal Content
    this.dom.contentWrapper.classList.remove('d-none');
  }

  /**
   * Renders the ordered list of constituent vocabulary items.
   */
  renderVocabularyList(vocabularies) {
    if (!this.dom.vocabList) {
      return;
    }

    clearContainer(this.dom.vocabList);

    if (!Array.isArray(vocabularies) || vocabularies.length === 0) {
      const emptyItem = createSafeElement('li', {
        className: 'text-center py-4 text-muted',
        text: 'Bài học này hiện chưa có từ vựng nào.'
      });
      this.dom.vocabList.appendChild(emptyItem);
      return;
    }

    vocabularies.forEach((vocab) => {
      const li = createSafeElement('li', {
        className: 'lesson-vocab-item',
        id: `vocab-item-${vocab.vocabId}`
      });

      // 1. Order Sequence Indicator
      const orderBadge = createSafeElement('span', {
        className: 'lesson-vocab-order-badge',
        text: `#${vocab.orderIndex}`
      });

      // 2. Main Character & Phonetic Block (Trỏ thẳng đến Từ Vựng)
      const vocabUrl = `vocabulary.html?search=${encodeURIComponent(vocab.hanzi || '')}${this.lessonLevel ? `&hsk=${this.lessonLevel}` : ''}${vocab.vocabId ? `&vocabId=${vocab.vocabId}` : ''}`;

      const mainDiv = createSafeElement('div', { className: 'lesson-vocab-main' });
      const hanziLink = createSafeElement('a', {
        className: 'lesson-vocab-hanzi text-decoration-none',
        attrs: {
          href: vocabUrl,
          lang: 'zh-Hans',
          title: `Tra cứu từ '${vocab.hanzi || ''}' trong Từ Vựng`
        },
        text: vocab.hanzi || '?'
      });

      const readingsDiv = createSafeElement('div', { className: 'lesson-vocab-readings' });
      const pinyinSpan = createSafeElement('span', {
        className: 'lesson-vocab-pinyin',
        text: vocab.pinyin || ''
      });

      const hanvietText = vocab.meaningHanViet ? `Hán-Việt: ${vocab.meaningHanViet}` : '';
      const hanvietSpan = createSafeElement('span', {
        className: 'lesson-vocab-hanviet',
        text: hanvietText
      });

      readingsDiv.appendChild(pinyinSpan);
      readingsDiv.appendChild(hanvietSpan);

      mainDiv.appendChild(orderBadge);
      mainDiv.appendChild(hanziLink);
      mainDiv.appendChild(readingsDiv);

      // 3. Semantic Meaning, Contextual Example, and Constituent Radicals ("Bộ thủ cấu thành")
      const detailsDiv = createSafeElement('div', { className: 'lesson-vocab-details' });
      const meaningDiv = createSafeElement('div', {
        className: 'lesson-vocab-meaning',
        text: vocab.meaningVi || 'Chưa cập nhật nghĩa'
      });

      const vocabLinkBadge = createSafeElement('a', {
        className: 'badge bg-light text-dark border text-decoration-none ms-2 align-middle',
        attrs: {
          href: vocabUrl,
          title: `Tra cứu từ '${vocab.hanzi || ''}' trong Từ Vựng`
        },
        text: 'Tra từ vựng ↗'
      });
      meaningDiv.appendChild(vocabLinkBadge);

      detailsDiv.appendChild(meaningDiv);

      // Constituent Radicals Section ("Bộ thủ cấu thành" trỏ thẳng đến 214 bộ thủ)
      const constituentRadicals = getConstituentRadicals(vocab);
      if (constituentRadicals.length > 0) {
        const radicalsRow = createSafeElement('div', {
          className: 'lesson-vocab-radicals d-flex align-items-center flex-wrap gap-1 mt-2'
        });

        const labelSpan = createSafeElement('span', {
          className: 'lesson-vocab-radicals-label text-muted small me-1',
          text: 'Bộ thủ cấu thành:'
        });
        radicalsRow.appendChild(labelSpan);

        constituentRadicals.forEach(rad => {
          const radTargetUrl = rad.radicalId
            ? `radicals.html?id=${encodeURIComponent(rad.radicalId)}`
            : `radicals.html?search=${encodeURIComponent(rad.character || '')}`;

          const displayChar = (rad.character || '').includes('(')
            ? rad.character.split('(')[0].trim()
            : (rad.character || '');

          const displayMeaning = (rad.meaningHanViet || rad.meaningVi || '').includes('(')
            ? (rad.meaningHanViet || rad.meaningVi).split('(')[0].trim()
            : (rad.meaningHanViet || rad.meaningVi || '');

          const radBadge = createSafeElement('a', {
            className: 'badge bg-light text-dark border text-decoration-none d-inline-flex align-items-center gap-1 py-1 px-2',
            attrs: {
              href: radTargetUrl,
              title: `Xem chi tiết bộ thủ ${rad.character} (${rad.meaningHanViet || rad.meaningVi}) trong 214 Bộ Thủ`
            },
            children: [
              createSafeElement('span', {
                className: 'fw-bold text-danger font-hanzi',
                attrs: { lang: 'zh-Hans' },
                text: displayChar
              }),
              ...(displayMeaning ? [
                createSafeElement('span', {
                  className: 'text-secondary small',
                  text: `(${displayMeaning})`
                })
              ] : [])
            ]
          });
          radicalsRow.appendChild(radBadge);
        });

        detailsDiv.appendChild(radicalsRow);
      }

      if (vocab.exampleSentence) {
        const exampleDiv = createSafeElement('div', { className: 'lesson-vocab-example mt-1' });
        const exampleSentenceSpan = createSafeElement('span', {
          lang: 'zh-Hans',
          className: 'fw-semibold text-dark me-2',
          text: vocab.exampleSentence
        });
        const exampleTranslationSpan = createSafeElement('span', {
          className: 'text-secondary fst-italic',
          text: vocab.exampleTranslation ? `(${vocab.exampleTranslation})` : ''
        });

        exampleDiv.appendChild(exampleSentenceSpan);
        exampleDiv.appendChild(exampleTranslationSpan);
        detailsDiv.appendChild(exampleDiv);
      }

      // 4. Action Controls: Pronunciation Speaker, Writing Modal, and Personal Notes
      const actionsDiv = createSafeElement('div', { className: 'lesson-vocab-actions' });

      // Speech Pronunciation Button
      const speechBtn = createSpeechButton({
        hanzi: vocab.hanzi,
        pinyin: vocab.pinyin,
        className: 'btn-vocab-speech btn-chinese-secondary py-1 px-2 small',
        label: 'Nghe phát âm',
        iconOnly: true
      });

      // Character Writing Practice Button (.lesson-vocab-writing-btn)
      const writingVocabId = vocab.vocabId || vocab.id;
      const writingBtn = createSafeElement('button', {
        className: 'lesson-vocab-writing-btn btn-chinese-secondary py-1 px-2 small',
        attrs: {
          type: 'button',
          'data-vocab-id': String(writingVocabId || ''),
          title: 'Luyện viết chữ Hán',
          'aria-label': `Luyện viết chữ Hán cho từ ${vocab.hanzi || ''}`
        },
        children: [
          createSafeElement('span', {
            attrs: { 'aria-hidden': 'true' },
            text: '✍️'
          })
        ]
      });

      writingBtn.addEventListener('click', () => {
        openVocabWritingModal({
          vocabItem: vocab,
          triggerElement: writingBtn,
          initialMode: 'demo'
        });
      });

      // Personal Notes Button (.lesson-vocab-note-btn)
      const noteVocabId = vocab.vocabId || vocab.id;
      const noteBtn = createSafeElement('button', {
        className: 'lesson-vocab-note-btn btn-chinese-secondary py-1 px-2 small',
        attrs: {
          type: 'button',
          'data-vocab-id': String(noteVocabId || ''),
          title: 'Ghi chú cá nhân',
          'aria-label': `Ghi chú cá nhân cho từ ${vocab.hanzi || ''}`
        },
        children: [
          createSafeElement('span', {
            attrs: { 'aria-hidden': 'true' },
            text: '📝'
          })
        ]
      });

      noteBtn.addEventListener('click', () => {
        openNotesModal({
          vocabId: noteVocabId,
          hanzi: vocab.hanzi,
          pinyin: vocab.pinyin,
          meaning: vocab.meaningVi,
          triggerElement: noteBtn
        });
      });

      actionsDiv.appendChild(speechBtn);
      actionsDiv.appendChild(writingBtn);
      actionsDiv.appendChild(noteBtn);

      // Assemble list item
      li.appendChild(mainDiv);
      li.appendChild(detailsDiv);
      li.appendChild(actionsDiv);

      this.dom.vocabList.appendChild(li);
    });
  }
}

// Auto-instantiate and initialize on DOMContentLoaded in browser environments
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initNavbarAuth();
    const controller = new LessonDetailPageController();
    controller.init();
  });
}
