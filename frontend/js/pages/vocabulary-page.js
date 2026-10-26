/**
 * =============================================================================
 * CHINESE VOCABULARY CATALOG & SEARCH CONTROLLER (TASK 9B.3)
 * Module: frontend/js/pages/vocabulary-page.js
 * 
 * Responsibilities:
 * - Direct integration with Spring Boot backend via apiClient('/vocabulary').
 * - Multi-criteria search (Hanzi, Pinyin with tone, toneless Pinyin).
 * - Debounced input handling (300ms) with instant Enter/submit flush.
 * - Transport-level AbortController cancellation & request ID sequencing (stale response protection).
 * - Server-side pagination matching PageResponse<VocabularyResponse> contract.
 * - Progressive disclosure of constituent Kangxi radicals via detail endpoint (GET /vocabulary/{id}).
 * - Pronunciation synthesis via Web Speech API with Mandarin voice matching and graceful degradation.
 * - Accessible Native <dialog> modal with focus containment, Escape key, and focus restoration.
 * - Contextual media sanitization (audio) via sanitizeResourceUrl().
 * - 3-State UI lifecycle (Loading -> Ready / Empty / Error + Retry).
 * - Session-aware navigation bar integration via initNavbarAuth().
 * =============================================================================
 */

import { apiClient, ApiError } from '../api/api.js';
import { initNavbarAuth } from '../ui/nav.js';
import { createSafeElement, clearContainer, sanitizeResourceUrl, sanitizeNavigationUrl } from '../ui/security.js';
import { setComponentState, createSpeakerIcon, createSpeechButton } from '../ui/ui.js';
import { speechController, speakHanzi, playPronunciation, isSpeechSynthesisAvailable, SpeechState, resolveSubpathAudioUrl } from '../ui/speech.js';
import { authManager } from '../auth/auth-state.js';
import { VocabWritingOrchestrator } from '../ui/character-writing/vocab-writing-orchestrator.js';
import { splitHanziCharacters } from '../ui/character-writing/stroke-data-loader.js';
import { CHAR_TO_RADICAL_MAP, CHAR_TO_RADICALS_MAP } from '../api/demo-seed-data.js';

export { createSpeakerIcon, createSpeechButton, speechController, speakHanzi, playPronunciation, isSpeechSynthesisAvailable, SpeechState, VocabWritingOrchestrator };

/* -----------------------------------------------------------------------------
 * 1. PURE LOGIC & UTILITY HELPERS (Exported for Testability)
 * ----------------------------------------------------------------------------- */

/**
 * Normalizes user search input string by trimming whitespace and lowercasing.
 * 
 * @param {*} query 
 * @returns {string}
 */
export function normalizeSearchQuery(query) {
  if (typeof query !== 'string') return '';
  return query.trim();
}

/**
 * Formats vocabulary meaning text by converting semicolons into commas.
 * Example: "Yêu; thích; tình cảm" -> "Yêu, thích, tình cảm"
 * 
 * @param {string} meaning 
 * @returns {string}
 */
export function formatVocabMeaning(meaning) {
  if (!meaning || typeof meaning !== 'string') return '';
  return meaning
    .replace(/;\s*/g, ', ')
    .replace(/,\s*$/, '')
    .trim();
}

/**
 * Validates and safely parses backend PageResponse payload.
 * 
 * @param {Object} pageResponse 
 * @returns {{ page: number, size: number, totalElements: number, totalPages: number, items: Array<Object> }}
 */
export function parsePageResponse(pageResponse) {
  if (!pageResponse || typeof pageResponse !== 'object') {
    return { page: 0, size: 20, totalElements: 0, totalPages: 0, items: [] };
  }

  const items = Array.isArray(pageResponse.items) ? pageResponse.items : [];
  const page = Math.max(0, Number(pageResponse.page) || 0);
  const size = Math.max(1, Number(pageResponse.size) || 20);
  const totalElements = Math.max(0, Number(pageResponse.totalElements) || items.length);
  const totalPages = Math.max(0, Number(pageResponse.totalPages) || (totalElements > 0 ? Math.ceil(totalElements / size) : 0));

  return { page, size, totalElements, totalPages, items };
}

/**
 * Calculates accessible pagination boundaries and windowing.
 * 
 * @param {number} totalElements 
 * @param {number} pageIndex - 0-indexed
 * @param {number} pageSize 
 * @param {number} [maxButtons=5] 
 * @returns {{ pageIndex: number, pageSize: number, totalPages: number, startIndex: number, endIndex: number, startPage: number, endPage: number }}
 */
export function calculatePagination(totalElements, pageIndex, pageSize, maxButtons = 5) {
  const safeTotal = Math.max(0, Number(totalElements) || 0);
  const safeSize = Math.max(1, Number(pageSize) || 20);
  const totalPages = safeTotal > 0 ? Math.ceil(safeTotal / safeSize) : 0;
  const clampedPage = totalPages > 0 ? Math.max(0, Math.min(Number(pageIndex) || 0, totalPages - 1)) : 0;

  const startIndex = safeTotal > 0 ? clampedPage * safeSize : 0;
  const endIndex = Math.min(safeTotal, startIndex + safeSize);

  let startPage = Math.max(0, clampedPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(Math.max(0, totalPages - 1), startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1 && totalPages > 0) {
    startPage = Math.max(0, endPage - maxButtons + 1);
  }

  return {
    pageIndex: clampedPage,
    pageSize: safeSize,
    totalPages,
    startIndex,
    endIndex,
    startPage,
    endPage
  };
}

/**
 * Calculates learning group overview metrics and status label.
 * 
 * @param {Object} options
 * @param {number} [options.totalElements=0]
 * @param {Object|null} [options.studyStats=null]
 * @param {number} [options.selectedHsk=1]
 * @returns {{ totalWords: number, learnedWords: number|null, dueWords: number|null, hskLevel: number, statusLabel: string }}
 */
export function calculateVocabGroupMetrics({ totalElements = 0, studyStats = null, selectedHsk = 1 } = {}) {
  const totalWords = Math.max(0, Number(totalElements) || 0);
  const hskLevel = [1, 2, 3].includes(Number(selectedHsk)) ? Number(selectedHsk) : 1;

  let learnedWords = null;
  let dueWords = null;
  let reviewsToday = 0;
  let newCardsToday = 0;

  if (studyStats && typeof studyStats === 'object') {
    dueWords = typeof studyStats.cardsDue === 'number' ? Math.max(0, studyStats.cardsDue) : null;
    reviewsToday = typeof studyStats.reviewsToday === 'number' ? Math.max(0, studyStats.reviewsToday) : 0;
    newCardsToday = typeof studyStats.newCardsToday === 'number' ? Math.max(0, studyStats.newCardsToday) : 0;
    learnedWords = reviewsToday + newCardsToday;
  }

  let statusLabel = `Cấp độ HSK ${hskLevel}`;
  if (dueWords !== null && dueWords > 0) {
    statusLabel = `Có ${dueWords} thẻ đến hạn ôn`;
  } else if (totalWords > 0) {
    statusLabel = `Sẵn sàng học tập (${totalWords} từ)`;
  }

  return {
    totalWords,
    learnedWords,
    dueWords,
    hskLevel,
    statusLabel
  };
}

// SpeechSynthesis functions (isSpeechSynthesisAvailable, speakHanzi) are imported and
// re-exported from ../ui/speech.js with centralized anti-spam and lifecycle locking.

/* -----------------------------------------------------------------------------
 * 2. VOCABULARY PAGE CONTROLLER CLASS
 * ----------------------------------------------------------------------------- */

export class VocabularyPageController {
  constructor() {
    // Application State
    this.currentPage = 0;
    this.pageSize = 20; // Default matching backend resolveEffectivePageable
    this.activeSearchQuery = '';
    this.activeTriggerEl = null;
    this.selectedHsk = 1; // HSK Level: 1 | 2 | 3

    // Asynchronous Request Management & Stale Response Protection
    this.latestRequestId = 0;
    this.abortController = null;
    this.debounceTimer = null;
    this.debounceDelayMs = 300;

    // Cache for vocabulary details to avoid redundant network roundtrips on repeated clicks
    this.detailCache = new Map();

    // Active current modal item
    this.currentModalVocab = null;

    // Interactive Stroke Writing Orchestrator
    this.vocabWritingOrchestrator = null;

    // DOM Element References
    this.elements = {};
  }

  /**
   * Initializes DOM references, events, session navbar, and initial data load.
   */
  init() {
    this.bindDomElements();
    this.bindEvents();

    // Deep-linking: Seed initial HSK tab if present (?hsk=1|2|3 or #hsk1|#hsk2|#hsk3)
    let initialHsk = 1;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search || '');
      const hskParam = Number(urlParams.get('hsk'));
      const hash = (window.location.hash || '').toLowerCase();
      if ([1, 2, 3].includes(hskParam)) {
        initialHsk = hskParam;
      } else if (hash === '#hsk2' || hash === '#2') {
        initialHsk = 2;
      } else if (hash === '#hsk3' || hash === '#3') {
        initialHsk = 3;
      }
    }
    this.selectedHsk = initialHsk;
    this.updateHskTabUi(this.selectedHsk);

    // Initialize session-aware navigation bar
    initNavbarAuth('navAuthContainer');

    // Deep-linking: Seed initial query if present in URL (?search=...)
    let initialQuery = '';
    if (typeof window !== 'undefined' && window.location?.search) {
      const urlParams = new URLSearchParams(window.location.search);
      initialQuery = urlParams.get('search') || '';
    }

    if (initialQuery.trim()) {
      if (this.elements.searchInput) {
        this.elements.searchInput.value = initialQuery.trim();
      }
      this.activeSearchQuery = initialQuery.trim();
      if (this.elements.searchClearBtn) {
        this.elements.searchClearBtn.classList.remove('d-none');
      }
    }

    // Load initial catalog
    this.loadCatalog();
  }

  /**
   * Resolves interactive DOM nodes.
   */
  bindDomElements() {
    this.elements = {
      stateContainer: document.getElementById('vocabStateContainer'),
      grid: document.getElementById('vocabGrid'),
      pagination: document.getElementById('vocabPagination'),
      searchInput: document.getElementById('vocabSearchInput'),
      searchClearBtn: document.getElementById('searchClearBtn'),
      pageSizeSelect: document.getElementById('pageSizeSelect'),
      resultCount: document.getElementById('vocabResultCount'),

      // HSK Level Tabs & Dynamic Category Header
      tabHsk1: document.getElementById('tabHsk1'),
      tabHsk2: document.getElementById('tabHsk2'),
      tabHsk3: document.getElementById('tabHsk3'),
      vocabCategoryBadge: document.getElementById('vocabCategoryBadge'),
      vocabPageHeading: document.getElementById('vocabPageHeading'),
      vocabPageSubheading: document.getElementById('vocabPageSubheading'),

      // Learning Group Overview Elements
      groupBanner: document.getElementById('vocabGroupBanner'),
      groupTotalCount: document.getElementById('vocabGroupTotalCount'),
      groupLearnedCount: document.getElementById('vocabGroupLearnedCount'),
      groupDueCount: document.getElementById('vocabGroupDueCount'),
      groupStatusBadge: document.getElementById('vocabGroupStatusBadge'),
      vocabBtnSrsReview: document.getElementById('vocabBtnSrsReview'),
      vocabBtnExploreLessons: document.getElementById('vocabBtnExploreLessons'),

      modal: document.getElementById('vocabDetailModal'),
      modalCloseBtn: document.getElementById('modalCloseBtn'),
      modalVocabHanzi: document.getElementById('modalVocabHanzi'),
      modalSpeechBtn: document.getElementById('modalSpeechBtn'),
      modalVocabTitle: document.getElementById('modalVocabTitle'),
      modalVocabPinyin: document.getElementById('modalVocabPinyin'),
      modalVocabHanViet: document.getElementById('modalVocabHanViet'),
      modalVocabMeaning: document.getElementById('modalVocabMeaning'),
      modalVocabWritingSection: document.getElementById('modalVocabWritingSection'),
      modalRadicalsSection: document.getElementById('modalRadicalsSection'),
      modalRadicalsList: document.getElementById('modalRadicalsList'),
      modalRadicalsCount: document.getElementById('modalRadicalsCount'),
      modalRadicalPreview: document.getElementById('modalRadicalPreview'),
      modalExampleSection: document.getElementById('modalExampleSection'),
      modalVocabExampleSentence: document.getElementById('modalVocabExampleSentence'),
      modalVocabExampleTranslation: document.getElementById('modalVocabExampleTranslation'),
      modalAudioSection: document.getElementById('modalAudioSection'),
      modalAudioPlayer: document.getElementById('modalAudioPlayer')
    };
  }

  /**
   * Binds user event handlers.
   */
  bindEvents() {
    // 1. Search input handler (debounced)
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', (e) => {
        this.handleSearchInput(e.target.value);
      });

      // Enter key flushes debounce immediately
      this.elements.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.flushDebounceAndSearch();
        }
      });
    }

    // 2. Search clear button
    if (this.elements.searchClearBtn) {
      this.elements.searchClearBtn.addEventListener('click', () => {
        this.handleClearSearch();
      });
    }

    // 3. Page size change handler
    if (this.elements.pageSizeSelect) {
      this.elements.pageSizeSelect.addEventListener('change', (e) => {
        this.pageSize = parseInt(e.target.value, 10) || 20;
        this.currentPage = 0; // Reset to first page
        this.loadCatalog();
      });
    }

    // 4. Modal close button (Top right X)
    if (this.elements.modalCloseBtn) {
      this.elements.modalCloseBtn.addEventListener('click', () => this.closeDetailModal());
    }

    // 5. Modal Escape key and native cancel event
    if (this.elements.modal) {
      this.elements.modal.addEventListener('cancel', (e) => {
        e.preventDefault();
        this.closeDetailModal();
      });

      // Close on backdrop click
      this.elements.modal.addEventListener('click', (e) => {
        const rect = this.elements.modal.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX && e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
          this.closeDetailModal();
        }
      });

      // APG Dialog Pattern: Constrain sequential keyboard Tab navigation within modal dialog
      this.elements.modal.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const focusable = Array.from(
          this.elements.modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
        ).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0);

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      });
    }

    // 6. Modal speech button
    if (this.elements.modalSpeechBtn) {
      this.elements.modalSpeechBtn.addEventListener('click', () => {
        if (this.currentModalVocab?.hanzi) {
          playPronunciation({ text: this.currentModalVocab.hanzi, audioUrl: this.currentModalVocab.audioUrl, button: this.elements.modalSpeechBtn });
        }
      });
    }

    // 8. HSK Level Tabs Binding & APG Keyboard Navigation
    const hskTabs = [
      { el: this.elements.tabHsk1, level: 1 },
      { el: this.elements.tabHsk2, level: 2 },
      { el: this.elements.tabHsk3, level: 3 }
    ].filter(item => item.el);

    hskTabs.forEach(({ el, level }, index) => {
      el.addEventListener('click', () => {
        this.switchHsk(level);
      });

      el.addEventListener('keydown', (e) => {
        let targetIndex = -1;
        if (e.key === 'ArrowRight') {
          targetIndex = (index + 1) % hskTabs.length;
        } else if (e.key === 'ArrowLeft') {
          targetIndex = (index - 1 + hskTabs.length) % hskTabs.length;
        } else if (e.key === 'Home') {
          targetIndex = 0;
        } else if (e.key === 'End') {
          targetIndex = hskTabs.length - 1;
        }

        if (targetIndex >= 0) {
          e.preventDefault();
          this.switchHsk(hskTabs[targetIndex].level, true);
        }
      });
    });
  }

  /**
   * Updates learning group overview banner and real learner metrics.
   * 
   * @param {number} totalElements
   */
  async updateGroupOverview(totalElements = 0) {
    if (!this.elements.groupBanner) return;
    let studyStats = null;
    if (authManager.isAuthenticated()) {
      try {
        const statsRes = await apiClient('/srs/stats');
        studyStats = (statsRes && statsRes.data) ? statsRes.data : statsRes;
      } catch {
        studyStats = null;
      }
    }

    const metrics = calculateVocabGroupMetrics({
      totalElements,
      studyStats,
      selectedHsk: this.selectedHsk
    });

    if (this.elements.groupTotalCount) {
      this.elements.groupTotalCount.textContent = `${metrics.totalWords} từ`;
    }
    if (this.elements.groupLearnedCount) {
      this.elements.groupLearnedCount.textContent = metrics.learnedWords !== null ? `${metrics.learnedWords} thẻ` : '—';
    }
    if (this.elements.groupDueCount) {
      this.elements.groupDueCount.textContent = metrics.dueWords !== null ? `${metrics.dueWords} thẻ` : '—';
    }
    if (this.elements.groupStatusBadge) {
      this.elements.groupStatusBadge.textContent = metrics.statusLabel;
    }
    if (this.elements.vocabBtnSrsReview) {
      if (metrics.dueWords !== null && metrics.dueWords > 0) {
        this.elements.vocabBtnSrsReview.textContent = `Ôn tập SRS (${metrics.dueWords} thẻ)`;
      } else {
        this.elements.vocabBtnSrsReview.textContent = 'Ôn tập SRS ngay';
      }
    }
  }

  /**
   * Updates HSK tab styling, aria attributes, and headings without triggering reload.
   * 
   * @param {number} level 
   * @param {boolean} [focus=false] 
   */
  updateHskTabUi(level, focus = false) {
    const tabs = [
      { el: this.elements.tabHsk1, level: 1 },
      { el: this.elements.tabHsk2, level: 2 },
      { el: this.elements.tabHsk3, level: 3 }
    ];

    tabs.forEach(({ el, level: tabLevel }) => {
      if (!el) return;
      const isActive = tabLevel === level;
      el.setAttribute('aria-selected', isActive ? 'true' : 'false');
      el.setAttribute('tabindex', isActive ? '0' : '-1');
      el.classList.toggle('active', isActive);
      if (isActive && focus) {
        el.focus();
      }
    });

    const HSK_INFO = {
      1: {
        badge: 'Từ Vựng HSK 1',
        heading: 'Từ Vựng Tiếng Trung HSK 1',
        subheading: 'Danh mục từ vựng tiếng Trung cấp độ HSK 1 căn bản với chữ Hán chuẩn mực, phiên âm Pinyin có thanh điệu, giải nghĩa Hán-Việt và câu ví dụ sinh động.'
      },
      2: {
        badge: 'Từ Vựng HSK 2',
        heading: 'Từ Vựng Tiếng Trung HSK 2',
        subheading: 'Danh mục từ vựng tiếng Trung cấp độ HSK 2 sơ cấp, mở rộng vốn từ giao tiếp thường nhật và cấu trúc ngữ pháp cơ bản.'
      },
      3: {
        badge: 'Từ Vựng HSK 3',
        heading: 'Từ Vựng Tiếng Trung HSK 3',
        subheading: 'Danh mục từ vựng tiếng Trung cấp độ HSK 3 trung cấp, củng cố kỹ năng diễn đạt học thuật và đời sống phong phú.'
      }
    };

    const info = HSK_INFO[level] || HSK_INFO[1];
    if (this.elements.vocabCategoryBadge) {
      this.elements.vocabCategoryBadge.textContent = info.badge;
    }
    if (this.elements.vocabPageHeading) {
      this.elements.vocabPageHeading.textContent = info.heading;
    }
    if (this.elements.vocabPageSubheading) {
      this.elements.vocabPageSubheading.textContent = info.subheading;
    }
  }

  /**
   * Switches the active HSK level tab, updates URL query, and reloads catalog.
   * 
   * @param {number} level 
   * @param {boolean} [focus=false] 
   */
  switchHsk(level, focus = false) {
    const validLevel = [1, 2, 3].includes(Number(level)) ? Number(level) : 1;
    if (validLevel === this.selectedHsk) {
      if (focus) {
        const tabEl = this.elements[`tabHsk${validLevel}`];
        if (tabEl) tabEl.focus();
      }
      return;
    }

    this.selectedHsk = validLevel;
    this.updateHskTabUi(validLevel, focus);

    // Deep link synchronization via history.replaceState
    if (typeof window !== 'undefined' && window.history && typeof window.history.replaceState === 'function') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('hsk', String(validLevel));
        window.history.replaceState({}, '', url.toString());
      } catch {
        // Fallback for non-standard environments
      }
    }

    // Reset pagination to first page
    this.currentPage = 0;

    // Clear search keyword when changing HSK level so user sees the catalog
    if (this.activeSearchQuery.trim().length > 0) {
      this.activeSearchQuery = '';
      if (this.elements.searchInput) {
        this.elements.searchInput.value = '';
      }
      if (this.elements.searchClearBtn) {
        this.elements.searchClearBtn.classList.add('d-none');
      }
    }

    this.loadCatalog();
  }

  /**
   * Handles user typing in search input with 300ms debounce.
   * 
   * @param {string} rawValue 
   */
  handleSearchInput(rawValue) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Toggle clear button immediately
    if (this.elements.searchClearBtn) {
      if (rawValue.trim().length > 0) {
        this.elements.searchClearBtn.classList.remove('d-none');
      } else {
        this.elements.searchClearBtn.classList.add('d-none');
      }
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.activeSearchQuery = rawValue.trim();
      this.currentPage = 0; // Invariant: search change resets to page 0
      this.loadCatalog();
    }, this.debounceDelayMs);
  }

  /**
   * Immediately clears pending debounce timer and triggers search.
   */
  flushDebounceAndSearch() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    const val = this.elements.searchInput ? this.elements.searchInput.value.trim() : '';
    this.activeSearchQuery = val;
    this.currentPage = 0;
    this.loadCatalog();
  }

  /**
   * Clears search keyword, cancels in-flight requests, and loads default catalog.
   */
  handleClearSearch() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
      this.elements.searchInput.focus();
    }
    if (this.elements.searchClearBtn) {
      this.elements.searchClearBtn.classList.add('d-none');
    }
    this.activeSearchQuery = '';
    this.currentPage = 0;
    this.loadCatalog();
  }

  /**
   * Loads vocabulary catalog from backend with cancellation and stale response protection.
   */
  async loadCatalog() {
    if (!this.elements.stateContainer) return;

    // 1. Cancel previous in-flight request
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    // 2. Increment request ID token
    const currentRequestId = ++this.latestRequestId;

    // 3. Set UI Loading state
    const isSearching = this.activeSearchQuery.length > 0;
    setComponentState(this.elements.stateContainer, 'LOADING', {
      message: isSearching
        ? `Đang tìm kiếm từ vựng "${this.activeSearchQuery}"...`
        : 'Đang tải danh mục từ vựng...'
    });

    if (this.elements.grid) clearContainer(this.elements.grid);
    if (this.elements.pagination) this.elements.pagination.classList.add('d-none');

    try {
      // 4. Build query params matching contract: search, page, size (NEVER q)
      const params = {
        page: this.currentPage,
        size: this.pageSize
      };
      if (this.selectedHsk) {
        params.hsk = this.selectedHsk;
      }
      if (isSearching) {
        params.search = this.activeSearchQuery;
      }

      const response = await apiClient('/vocabulary', {
        params,
        signal: this.abortController.signal
      });

      // 5. Stale Response Protection: Check if this response belongs to the latest request
      if (currentRequestId !== this.latestRequestId) {
        return;
      }

      // 6. Parse and validate PageResponse
      const parsed = parsePageResponse(response);

      // Invariant: sync currentPage with backend returned page
      this.currentPage = parsed.page;

      if (parsed.totalElements === 0) {
        // Empty State: distinguish between empty catalog vs no search results
        if (isSearching) {
          setComponentState(this.elements.stateContainer, 'EMPTY', {
            glyph: '查',
            title: 'Không tìm thấy từ vựng',
            description: `Không có từ vựng nào khớp với từ khóa "${this.activeSearchQuery}". Bạn có thể thử tìm bằng Pinyin không dấu hoặc chữ Hán khác.`,
            actionText: 'Xóa bộ lọc tìm kiếm',
            onAction: () => this.handleClearSearch()
          });
        } else {
          let emptyTitle = 'Danh mục trống';
          let emptyDesc = 'Hiện chưa có dữ liệu từ vựng nào trong hệ thống.';
          if (this.selectedHsk === 2) {
            emptyTitle = 'Chưa có dữ liệu từ vựng HSK 2';
            emptyDesc = 'Hiện chưa có dữ liệu từ vựng cho cấp độ HSK 2 trong hệ thống. Dữ liệu đang được biên soạn theo chuẩn HSK 3.0.';
          } else if (this.selectedHsk === 3) {
            emptyTitle = 'Chưa có dữ liệu từ vựng HSK 3';
            emptyDesc = 'Hiện chưa có dữ liệu từ vựng cho cấp độ HSK 3 trong hệ thống. Dữ liệu đang được biên soạn theo chuẩn HSK 3.0.';
          }
          setComponentState(this.elements.stateContainer, 'EMPTY', {
            glyph: '空',
            title: emptyTitle,
            description: emptyDesc
          });
        }

        this.updateResultCountBadge(0, 0);
        this.updateGroupOverview(0);
        return;
      }

      // 7. Transition to Ready state and render
      setComponentState(this.elements.stateContainer, 'READY');
      this.renderGrid(parsed.items);
      this.renderPagination(parsed);
      this.updateResultCountBadge(parsed.items.length, parsed.totalElements);
      this.updateGroupOverview(parsed.totalElements);

      // 8. URL Deep-Linking: Auto-open modal if target vocabId is specified
      if (typeof window !== 'undefined' && !this.initialDeepLinkHandled) {
        const urlParams = new URLSearchParams(window.location.search || '');
        const targetVocabId = urlParams.get('vocabId') || urlParams.get('id');
        if (targetVocabId) {
          this.initialDeepLinkHandled = true;
          const targetVocab = parsed.items.find(v => String(v.vocabId) === String(targetVocabId));
          if (targetVocab) {
            const cardEl = this.elements.grid?.querySelector(`[data-vocab-id="${targetVocab.vocabId}"]`);
            this.openDetailModal(targetVocab, cardEl || null);
          }
        }
      }

    } catch (err) {
      // Ignore intentional aborts from subsequent typing
      if (err.name === 'AbortError') {
        return;
      }

      // Only handle errors if request is still current
      if (currentRequestId === this.latestRequestId) {
        console.error('[VocabularyCatalog] Failed to load catalog:', err);
        let errorTitle = 'Lỗi tải danh mục từ vựng';
        let errorMessage = 'Không thể kết nối với máy chủ từ vựng. Vui lòng kiểm tra lại.';

        if (err instanceof ApiError) {
          if (err.status === 0 || err.code === 'NETWORK_ERROR') {
            errorTitle = 'Không thể kết nối máy chủ';
            errorMessage = 'Không thể kết nối đến máy chủ backend (http://localhost:8080). Vui lòng kiểm tra trạng thái máy chủ.';
          } else if (err.status === 408 || err.code === 'TIMEOUT') {
            errorTitle = 'Hết thời gian chờ';
            errorMessage = 'Yêu cầu tải dữ liệu từ vựng hết thời gian chờ (Timeout). Vui lòng thử lại.';
          } else if (err.status >= 500) {
            errorTitle = 'Lỗi máy chủ nội bộ';
            errorMessage = err.message || `Máy chủ gặp sự cố khi xử lý dữ liệu (${err.status}). Vui lòng thử lại sau.`;
          } else {
            errorMessage = err.message || errorMessage;
          }
        }

        setComponentState(this.elements.stateContainer, 'ERROR', {
          title: errorTitle,
          message: errorMessage,
          retryText: 'Thử lại',
          onRetry: () => this.loadCatalog()
        });

        if (this.elements.resultCount) {
          this.elements.resultCount.textContent = 'Lỗi kết nối';
          this.elements.resultCount.className = 'badge-status badge-status-rejected text-nowrap';
        }
      }
    }
  }

  /**
   * Updates screen reader live region and visual status counter.
   * 
   * @param {number} currentCount 
   * @param {number} totalElements 
   */
  updateResultCountBadge(currentCount, totalElements) {
    if (!this.elements.resultCount) return;

    if (this.activeSearchQuery.length > 0) {
      if (totalElements === 0) {
        this.elements.resultCount.textContent = 'Không có kết quả';
        this.elements.resultCount.className = 'visually-hidden';
      } else {
        this.elements.resultCount.textContent = `Tìm thấy ${totalElements} từ vựng`;
        this.elements.resultCount.className = 'visually-hidden';
      }
    } else {
      if (totalElements === 0) {
        this.elements.resultCount.textContent = '0 từ vựng';
        this.elements.resultCount.className = 'visually-hidden';
      } else {
        const start = this.currentPage * this.pageSize + 1;
        const end = Math.min(totalElements, start + currentCount - 1);
        this.elements.resultCount.textContent = `Hiển thị ${start}–${end} / ${totalElements} từ vựng`;
        this.elements.resultCount.className = 'visually-hidden';
      }
    }
  }

  /**
   * Renders vocabulary cards safely using DOM APIs (Zero-unsafe innerHTML).
   * 
   * @param {Array<Object>} items 
   */
  renderGrid(items) {
    if (!this.elements.grid) return;
    clearContainer(this.elements.grid);

    for (const vocab of items) {
      if (!vocab) continue;

      const card = createSafeElement('div', {
        className: 'vocab-card',
        attrs: {
          role: 'listitem',
          'data-vocab-id': String(vocab.vocabId || ''),
          tabindex: '0',
          'aria-label': `Xem chi tiết từ vựng ${vocab.hanzi || ''} (${vocab.pinyin || ''} - ${vocab.meaningHanViet || ''})`
        }
      });

      // Top Row: Hanzi character + Pronunciation Button
      const topRow = createSafeElement('div', { className: 'vocab-card-top' });

      const hanziEl = createSafeElement('div', {
        className: 'vocab-card-hanzi',
        attrs: { lang: 'zh-Hans' },
        text: vocab.hanzi || '—'
      });

      const speechBtn = createSafeElement('button', {
        className: 'vocab-speech-btn',
        attrs: {
          type: 'button',
          'aria-label': `Phát âm từ ${vocab.hanzi || ''}`,
          title: `Phát âm: ${vocab.hanzi || ''}`
        }
      });
      // SVG Speaker Icon using safe DOM element creation
      const svgIcon = createSpeakerIcon();
      speechBtn.appendChild(svgIcon);

      speechBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Do not trigger card detail opening
        if (vocab.hanzi) {
          playPronunciation({ text: vocab.hanzi, audioUrl: vocab.audioUrl, button: speechBtn });
        }
      });

      topRow.appendChild(hanziEl);
      topRow.appendChild(speechBtn);

      // Meta Container: Pinyin, Hán-Việt, Vietnamese definition
      const metaContainer = createSafeElement('div', { className: 'vocab-card-meta' });

      const pinyinEl = createSafeElement('div', {
        className: 'vocab-card-pinyin',
        text: vocab.pinyin || '—'
      });

      const hanvietEl = createSafeElement('div', {
        className: 'vocab-card-hanviet',
        text: vocab.meaningHanViet ? `Hán-Việt: ${vocab.meaningHanViet}` : '—'
      });

      const formattedMeaning = formatVocabMeaning(vocab.meaningVi);
      const meaningEl = createSafeElement('div', {
        className: 'vocab-card-meaning',
        attrs: { title: formattedMeaning || '' },
        text: formattedMeaning || 'Chưa có giải nghĩa.'
      });

      metaContainer.appendChild(pinyinEl);
      metaContainer.appendChild(hanvietEl);
      metaContainer.appendChild(meaningEl);

      card.appendChild(topRow);
      card.appendChild(metaContainer);

      // Activation handlers for detail modal
      card.addEventListener('click', (e) => {
        this.openDetailModal(vocab, e.currentTarget);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openDetailModal(vocab, e.currentTarget);
        }
      });

      this.elements.grid.appendChild(card);
    }
  }

  /**
   * Renders accessible pagination controls.
   * 
   * @param {Object} parsed 
   */
  renderPagination(parsed) {
    if (!this.elements.pagination) return;

    if (parsed.totalPages <= 1) {
      this.elements.pagination.classList.add('d-none');
      clearContainer(this.elements.pagination);
      return;
    }

    this.elements.pagination.classList.remove('d-none');
    clearContainer(this.elements.pagination);

    const pag = calculatePagination(parsed.totalElements, parsed.page, parsed.size);

    // Control buttons container
    const controls = createSafeElement('div', {
      className: 'pagination-controls',
      attrs: { role: 'group', 'aria-label': 'Điều khiển chuyển trang từ vựng' }
    });

    // 1. First Page Button (<<)
    const firstBtn = createSafeElement('button', {
      className: 'pagination-btn',
      attrs: {
        type: 'button',
        'aria-label': 'Trang đầu',
        id: 'vocabPaginationFirstBtn'
      },
      text: '<<'
    });
    if (pag.pageIndex === 0) {
      firstBtn.setAttribute('disabled', 'true');
      firstBtn.disabled = true;
    } else {
      firstBtn.addEventListener('click', () => {
        this.currentPage = 0;
        this.loadCatalog();
      });
    }
    controls.appendChild(firstBtn);

    // 2. Previous Button (<)
    const prevBtn = createSafeElement('button', {
      className: 'pagination-btn',
      attrs: {
        type: 'button',
        'aria-label': 'Trang trước',
        id: 'vocabPaginationPrevBtn'
      },
      text: '<'
    });
    if (pag.pageIndex === 0) {
      prevBtn.setAttribute('disabled', 'true');
      prevBtn.disabled = true;
    } else {
      prevBtn.addEventListener('click', () => {
        this.currentPage = pag.pageIndex - 1;
        this.loadCatalog();
      });
    }
    controls.appendChild(prevBtn);

    // 3. Numbered Buttons (Smart Window)
    for (let p = pag.startPage; p <= pag.endPage; p++) {
      const pageBtn = createSafeElement('button', {
        className: `pagination-btn ${p === pag.pageIndex ? 'active' : ''}`,
        attrs: {
          type: 'button',
          'aria-label': `Trang ${p + 1}`,
          'aria-current': p === pag.pageIndex ? 'page' : 'false'
        },
        text: String(p + 1)
      });

      if (p !== pag.pageIndex) {
        const targetPage = p;
        pageBtn.addEventListener('click', () => {
          this.currentPage = targetPage;
          this.loadCatalog();
        });
      }

      controls.appendChild(pageBtn);
    }

    // 4. Next Button (>)
    const nextBtn = createSafeElement('button', {
      className: 'pagination-btn',
      attrs: {
        type: 'button',
        'aria-label': 'Trang sau',
        id: 'vocabPaginationNextBtn'
      },
      text: '>'
    });
    if (pag.pageIndex >= pag.totalPages - 1) {
      nextBtn.setAttribute('disabled', 'true');
      nextBtn.disabled = true;
    } else {
      nextBtn.addEventListener('click', () => {
        this.currentPage = pag.pageIndex + 1;
        this.loadCatalog();
      });
    }
    controls.appendChild(nextBtn);

    // 5. Last Page Button (>>)
    const lastBtn = createSafeElement('button', {
      className: 'pagination-btn',
      attrs: {
        type: 'button',
        'aria-label': 'Trang cuối',
        id: 'vocabPaginationLastBtn'
      },
      text: '>>'
    });
    if (pag.pageIndex >= pag.totalPages - 1) {
      lastBtn.setAttribute('disabled', 'true');
      lastBtn.disabled = true;
    } else {
      lastBtn.addEventListener('click', () => {
        this.currentPage = pag.totalPages - 1;
        this.loadCatalog();
      });
    }
    controls.appendChild(lastBtn);

    this.elements.pagination.appendChild(controls);
  }

  /**
   * Opens the accessible Detail Modal for a vocabulary item.
   * Leverages progressive disclosure: fetches constituent radicals via GET /vocabulary/{id}.
   * 
   * @param {Object} vocabSummary 
   * @param {HTMLElement} triggerEl 
   */
  async openDetailModal(vocabSummary, triggerEl) {
    if (!this.elements.modal) return;
    this.activeTriggerEl = triggerEl;
    this.currentModalVocab = vocabSummary;

    // 1. Immediately populate summary data into modal
    if (this.elements.modalVocabHanzi) {
      this.elements.modalVocabHanzi.textContent = vocabSummary.hanzi || '—';
    }
    if (this.elements.modalVocabTitle) {
      this.elements.modalVocabTitle.textContent = `${vocabSummary.hanzi || ''} (${vocabSummary.meaningHanViet || ''})`;
    }
    if (this.elements.modalVocabPinyin) {
      this.elements.modalVocabPinyin.textContent = vocabSummary.pinyin || '—';
    }
    if (this.elements.modalVocabHanViet) {
      this.elements.modalVocabHanViet.textContent = vocabSummary.meaningHanViet || '—';
    }
    if (this.elements.modalVocabMeaning) {
      this.elements.modalVocabMeaning.textContent = formatVocabMeaning(vocabSummary.meaningVi) || 'Chưa có giải nghĩa chi tiết.';
    }

    // Reset radical preview box
    if (this.elements.modalRadicalPreview) {
      this.elements.modalRadicalPreview.classList.add('d-none');
      clearContainer(this.elements.modalRadicalPreview);
    }

    // Example sentence from summary
    this.updateExampleSection(vocabSummary.exampleSentence, vocabSummary.exampleTranslation);

    // Initial radicals loading indicator
    if (this.elements.modalRadicalsList) {
      clearContainer(this.elements.modalRadicalsList);
      this.elements.modalRadicalsList.appendChild(
        createSafeElement('span', { className: 'text-muted small', text: 'Đang tải thông tin bộ thủ...' })
      );
    }
    if (this.elements.modalRadicalsCount) {
      this.elements.modalRadicalsCount.textContent = '...';
    }

    // Audio Player setup
    this.setupAudioPlayer(vocabSummary.audioUrl);

    // Setup interactive Stroke Writing Section (Cách viết thứ tự nét)
    if (this.elements.modalVocabWritingSection) {
      if (this.vocabWritingOrchestrator) {
        this.vocabWritingOrchestrator.destroy();
        this.vocabWritingOrchestrator = null;
      }
      this.vocabWritingOrchestrator = new VocabWritingOrchestrator({
        mountElement: this.elements.modalVocabWritingSection,
        initialMode: 'demo',
        demoOnly: true
      });
      const selectedHsk = this.selectedHsk || 1;
      this.vocabWritingOrchestrator.mount({
        vocabId: vocabSummary.vocabId,
        hanzi: vocabSummary.hanzi,
        pinyin: vocabSummary.pinyin,
        meaningVi: formatVocabMeaning(vocabSummary.meaningVi),
        hskLevel: vocabSummary.hskLevel || selectedHsk
      }).catch(err => {
        console.warn('[VocabularyPage] Error mounting vocab writing orchestrator:', err);
      });
    }

    // 2. Open Modal with Native Focus Trap (WCAG 2.2 APG Pattern)
    if (typeof this.elements.modal.showModal === 'function') {
      this.elements.modal.showModal();
    } else {
      this.elements.modal.setAttribute('open', '');
      this.elements.modal.style.display = 'block';
    }

    // Move focus to modal close button
    if (this.elements.modalCloseBtn) {
      this.elements.modalCloseBtn.focus();
    }

    // 3. Progressive Disclosure: Fetch rich details including constituent radicals
    if (vocabSummary.vocabId) {
      await this.loadVocabularyDetail(vocabSummary.vocabId);
    }
  }

  /**
   * Fetches detailed vocabulary information including constituent radicals.
   * 
   * @param {number|string} vocabId 
   */
  async loadVocabularyDetail(vocabId) {
    try {
      let detail = this.detailCache.get(vocabId);
      if (!detail) {
        detail = await apiClient(`/vocabulary/${vocabId}`);
        if (detail) {
          this.detailCache.set(vocabId, detail);
        }
      }

      // Check if user hasn't closed modal or switched to another item
      if (!this.currentModalVocab || String(this.currentModalVocab.vocabId) !== String(vocabId)) {
        return;
      }

      // Update example sentences if enriched
      if (detail.exampleSentence || detail.exampleTranslation) {
        this.updateExampleSection(detail.exampleSentence, detail.exampleTranslation);
      }

      // Update audio if enriched
      if (detail.audioUrl) {
        this.currentModalVocab.audioUrl = detail.audioUrl;
        this.setupAudioPlayer(detail.audioUrl);
      }

      // Render constituent Kangxi Radicals & Structural Components
      this.renderConstituentRadicals(detail.radicals);

    } catch (err) {
      console.warn('[VocabularyDetail] Failed to load detail for vocabId:', vocabId, err);
      if (this.elements.modalRadicalsList) {
        clearContainer(this.elements.modalRadicalsList);
        this.elements.modalRadicalsList.appendChild(
          createSafeElement('span', {
            className: 'text-muted small fst-italic',
            text: 'Từ này chưa có dữ liệu bộ thủ xác minh.'
          })
        );
      }
      if (this.elements.modalRadicalsCount) {
        this.elements.modalRadicalsCount.textContent = '0 bộ thủ';
      }
    }
  }

  /**
   * Renders constituent radical badges in the detail modal.
   * Differentiates between authoritative Kangxi lookup radicals and structural components.
   * Disaggregates constituent radicals per Hanzi character with preview & SRS review link.
   * 
   * @param {Array<Object>} radicals 
   */
  renderConstituentRadicals(radicals) {
    if (!this.elements.modalRadicalsList) return;
    clearContainer(this.elements.modalRadicalsList);

    const radicalList = Array.isArray(radicals) ? radicals.filter(r => r && (r.character || r.radicalId)) : [];
    const isKangxiComponent = (r) => !r.componentType || String(r.componentType).toLowerCase() === 'kangxi_radical';
    const kangxiCount = radicalList.filter(isKangxiComponent).length;
    const structCount = radicalList.length - kangxiCount;

    if (this.elements.modalRadicalsCount) {
      if (structCount === 0) {
        this.elements.modalRadicalsCount.textContent = `${kangxiCount} bộ thủ`;
      } else if (kangxiCount === 0) {
        this.elements.modalRadicalsCount.textContent = `${structCount} thành phần`;
      } else {
        this.elements.modalRadicalsCount.textContent = `${kangxiCount} bộ thủ · ${structCount} thành phần`;
      }
    }

    if (radicalList.length === 0) {
      this.elements.modalRadicalsList.appendChild(
        createSafeElement('span', {
          className: 'text-muted small fst-italic',
          text: 'Từ này chưa có dữ liệu bộ thủ xác minh.'
        })
      );
      return;
    }

    const container = createSafeElement('div', {
      className: 'vocab-radicals-container'
    });

    radicalList.forEach((rad, idx) => {
      // Identify corresponding Hanzi character (hanziChar) for multi-character compound words
      const cleanHanzi = this.currentModalVocab?.hanzi ? splitHanziCharacters(this.currentModalVocab.hanzi) : [];
      let charInWord = cleanHanzi.length > 1 ? rad.hanziChar : '';
      if (!charInWord && cleanHanzi.length > 1) {
        // If multi-char word, find verified match in CHAR_TO_RADICALS_MAP or CHAR_TO_RADICAL_MAP
        for (const ch of cleanHanzi) {
          const chRads = (typeof CHAR_TO_RADICALS_MAP !== 'undefined' && CHAR_TO_RADICALS_MAP[ch]) || (CHAR_TO_RADICAL_MAP && CHAR_TO_RADICAL_MAP[ch] ? [CHAR_TO_RADICAL_MAP[ch]] : []);
          if (chRads.includes(rad.radicalId)) {
            charInWord = ch;
            break;
          }
        }
      }

      const isKangxi = isKangxiComponent(rad);
      const name = (rad.meaningHanViet || rad.meaningVi || '').trim();
      const compLabel = isKangxi
        ? (name ? (name.startsWith('Bộ ') ? name : `Bộ ${name}`) : '')
        : (name ? `Thành phần ${name}` : 'Thành phần cấu tạo');
      const textLabel = `(${rad.character || ''}${compLabel ? ` · ${compLabel}` : ''})`;

      const badge = createSafeElement('button', {
        className: 'vocab-radical-badge border-0 bg-transparent p-0 d-inline-flex align-items-center',
        attrs: {
          type: 'button',
          'aria-label': isKangxi
            ? `Xem thông tin bộ thủ ${rad.character || ''} (${name})`
            : `Xem thành phần cấu tạo ${rad.character || ''} (${name})`
        },
        children: [
          createSafeElement('span', {
            className: 'vocab-radical-badge-text',
            text: textLabel
          })
        ]
      });

      badge.addEventListener('click', () => {
        this.showRadicalPreview(rad, charInWord);
      });

      container.appendChild(badge);

      if (idx < radicalList.length - 1) {
        const sep = createSafeElement('span', {
          className: 'vocab-radical-separator text-muted mx-1',
          attrs: { 'aria-hidden': 'true' },
          text: '|'
        });
        container.appendChild(sep);
      }
    });

    this.elements.modalRadicalsList.appendChild(container);
  }

  /**
   * Expands constituent radical preview inside the modal and provides a safe link to 214 Radicals page.
   * 
   * @param {Object} radical 
   * @param {string} [charInWord]
   */
  showRadicalPreview(radical, charInWord) {
    if (!this.elements.modalRadicalPreview) return;

    const currentRadId = radical.radicalId || radical.character;
    if (this.activePreviewRadicalId === currentRadId && !this.elements.modalRadicalPreview.classList.contains('d-none')) {
      this.elements.modalRadicalPreview.classList.add('d-none');
      clearContainer(this.elements.modalRadicalPreview);
      this.activePreviewRadicalId = null;
      return;
    }
    this.activePreviewRadicalId = currentRadId;

    clearContainer(this.elements.modalRadicalPreview);
    this.elements.modalRadicalPreview.classList.remove('d-none');

    const isKangxi = !radical.componentType || String(radical.componentType).toLowerCase() === 'kangxi_radical';
    const radicalTargetUrl = radical.radicalId
      ? `radicals.html?id=${encodeURIComponent(radical.radicalId)}`
      : `radicals.html?search=${encodeURIComponent(radical.character || '')}`;

    const fallbackMeaning = isKangxi
      ? 'Chưa có giải nghĩa chi tiết cho bộ thủ này.'
      : 'Thành phần cấu tạo hình thể của chữ Hán.';
    const buttonText = isKangxi ? 'Xem trong 214 Bộ Thủ ↗' : 'Tra cứu trong Bộ Thủ ↗';

    const preview = createSafeElement('div', {
      className: 'd-flex align-items-center justify-content-between flex-wrap gap-3',
      children: [
        createSafeElement('div', {
          className: 'd-flex flex-column gap-1',
          children: [
            createSafeElement('div', {
              className: 'd-flex align-items-baseline gap-2',
              children: [
                createSafeElement('span', {
                  className: 'fs-4 fw-bold font-hanzi text-dark lh-1',
                  attrs: { lang: 'zh-Hans' },
                  text: radical.character || ''
                }),
                createSafeElement('span', {
                  className: 'fw-semibold text-danger',
                  text: radical.pinyin || ''
                }),
                ...(charInWord ? [
                  createSafeElement('span', {
                    className: 'badge bg-light text-secondary border small ms-1',
                    text: `Chữ ${charInWord}`
                  })
                ] : [])
              ]
            }),
            createSafeElement('div', {
              className: 'small text-secondary',
              text: formatVocabMeaning(radical.meaningVi) || fallbackMeaning
            })
          ]
        }),
        createSafeElement('a', {
          className: 'btn-chinese-outline btn-sm text-decoration-none text-nowrap',
          attrs: {
            href: sanitizeNavigationUrl(radicalTargetUrl)
          },
          text: buttonText
        })
      ]
    });

    this.elements.modalRadicalPreview.appendChild(preview);
  }

  /**
   * Updates example sentence display.
   * 
   * @param {string} sentence 
   * @param {string} translation 
   */
  updateExampleSection(sentence, translation) {
    if (!this.elements.modalExampleSection) return;

    if (sentence && sentence.trim()) {
      if (this.elements.modalVocabExampleSentence) {
        this.elements.modalVocabExampleSentence.textContent = sentence.trim();
      }
      if (this.elements.modalVocabExampleTranslation) {
        this.elements.modalVocabExampleTranslation.textContent = translation ? translation.trim() : '';
      }
      this.elements.modalExampleSection.classList.remove('d-none');
    } else {
      this.elements.modalExampleSection.classList.add('d-none');
    }
  }

  /**
   * Safely configures authentic audio player.
   * 
   * @param {string} rawAudioUrl 
   */
  setupAudioPlayer(rawAudioUrl) {
    if (!this.elements.modalAudioSection || !this.elements.modalAudioPlayer) return;

    const safeUrl = resolveSubpathAudioUrl(rawAudioUrl);
    if (rawAudioUrl && safeUrl !== 'about:blank') {
      this.elements.modalAudioPlayer.pause();
      this.elements.modalAudioPlayer.src = safeUrl;
      this.elements.modalAudioPlayer.load();
      this.elements.modalAudioSection.classList.remove('d-none');
    } else {
      this.elements.modalAudioPlayer.pause();
      this.elements.modalAudioPlayer.removeAttribute('src');
      this.elements.modalAudioSection.classList.add('d-none');
    }
  }

  /**
   * Closes the Detail Modal and restores focus to the triggering element (WCAG 2.2 APG Pattern).
   */
  closeDetailModal() {
    if (!this.elements.modal) return;

    // Pause audio if active
    if (this.elements.modalAudioPlayer) {
      this.elements.modalAudioPlayer.pause();
    }

    // Cancel any active speech and release button state
    speechController.cancel();

    // Destroy writing orchestrator session and prevent memory leaks
    if (this.vocabWritingOrchestrator) {
      this.vocabWritingOrchestrator.destroy();
      this.vocabWritingOrchestrator = null;
    }

    // Close modal
    if (typeof this.elements.modal.close === 'function') {
      this.elements.modal.close();
    } else {
      this.elements.modal.removeAttribute('open');
      this.elements.modal.style.display = 'none';
    }

    this.currentModalVocab = null;
    this.activePreviewRadicalId = null;

    // Restore focus to triggering card
    if (this.activeTriggerEl && typeof this.activeTriggerEl.focus === 'function') {
      this.activeTriggerEl.focus();
    }
    this.activeTriggerEl = null;
  }
}

/* -----------------------------------------------------------------------------
 * 3. BROWSER ENTRY POINT INITIALIZATION
 * ----------------------------------------------------------------------------- */
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('vocabGrid') && !document.getElementById('vocabDetailModal')) {
      return;
    }
    const controller = new VocabularyPageController();
    controller.init();
    window.__vocabularyPageController = controller;
  });
}
