/**
 * =============================================================================
 * INTERACTIVE SRS FLASHCARD REVIEW SESSION CONTROLLER (TASK 9C.3)
 * Module: frontend/js/pages/srs-review-page.js
 * 
 * Responsibilities:
 * - Interactive Spaced Repetition (SRS) review room for vocabulary and radicals.
 * - Authenticated learner enforcement via authManager (blocks anonymous network calls).
 * - Mode A: Due cards retrieval (GET /api/v1/srs/due).
 * - Mode B: Approved-lesson new-card candidates (GET /api/v1/srs/new-cards?lessonId=X).
 * - 3D CSS Card Flip (Space/Enter/Click), with vestibular reduced-motion adaptation.
 * - Reaction timer measuring actual integer seconds (reviewTimeSeconds >= 0).
 * - Authoritative rating submission (POST /api/v1/srs/review, ratings 1..4).
 * - Client-side session queue with Again (rating 1) requeue policy (max 3 cycles).
 * - Optional audio pronunciation (detail endpoint + Web Speech API fallback).
 * - Contextual personal notes integration via NotesModalController (VOCABULARY only).
 * - Comprehensive 4-state lifecycle (Loading, Auth, Empty, Error, Active, Completed).
 * - 100% Safe DOM rendering (textContent / createElement; zero innerHTML sinks).
 * - Full WCAG 2.2 AA accessibility (accessible names, visible focus, aria-hidden coordination).
 * =============================================================================
 */

import { apiClient, ApiError } from '../api/api.js';
import { authManager } from '../auth/auth-state.js';
import { openNotesModal } from '../ui/notes-modal.js';
import { showToast, createSpeakerIcon, createSpeechButton } from '../ui/ui.js';
import { initNavbarAuth } from '../ui/nav.js';
import { sanitizeResourceUrl } from '../ui/security.js';
import { speechController, speakHanzi, playPronunciation, isSpeechSynthesisAvailable, SpeechState } from '../ui/speech.js';
import { VocabWritingOrchestrator } from '../ui/character-writing/vocab-writing-orchestrator.js';

export { createSpeakerIcon, createSpeechButton, speechController, speakHanzi, playPronunciation, isSpeechSynthesisAvailable, SpeechState, VocabWritingOrchestrator };

export const MAX_AGAIN_REVIEWS_PER_CARD = 3;

/**
 * Maps rating numeric keys or integers to descriptive metadata.
 * Rating contract: 1 = Again, 2 = Hard, 3 = Good, 4 = Easy.
 * 
 * @param {number|string} val 
 * @returns {{ rating: number, label: string, nameVi: string } | null}
 */
export function mapRatingValue(val) {
  const num = Number(val);
  switch (num) {
    case 1:
      return { rating: 1, label: 'Again', nameVi: 'Học lại' };
    case 2:
      return { rating: 2, label: 'Hard', nameVi: 'Khó' };
    case 3:
      return { rating: 3, label: 'Good', nameVi: 'Tốt' };
    case 4:
      return { rating: 4, label: 'Easy', nameVi: 'Dễ' };
    default:
      return null;
  }
}

/**
 * Maps a KeyboardEvent (key or code) to a rating number 1..4.
 * Supports:
 * - Digit1..Digit4
 * - Numpad1..Numpad4
 * - e.key '1'..'4'
 * 
 * @param {{ key?: string, code?: string } | null | undefined} event
 * @returns {number|null} 1..4 or null
 */
export function mapKeyToRating(event) {
  if (!event || typeof event !== 'object') return null;
  const key = event.key;
  const code = event.code;

  if (key === '1' || code === 'Digit1' || code === 'Numpad1') return 1;
  if (key === '2' || code === 'Digit2' || code === 'Numpad2') return 2;
  if (key === '3' || code === 'Digit3' || code === 'Numpad3') return 3;
  if (key === '4' || code === 'Digit4' || code === 'Numpad4') return 4;
  return null;
}

/**
 * Checks whether an element is an editable form control or contenteditable.
 * Keystrokes 1..4 should be ignored when user is interacting with these elements.
 * 
 * @param {any} target
 * @param {any} [activeElement=null]
 * @returns {boolean}
 */
export function isEditableOrFormControl(target, activeElement = null) {
  const check = (el) => {
    if (!el || typeof el !== 'object') return false;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (el.isContentEditable || el.contentEditable === 'true' || el.getAttribute?.('contenteditable') === 'true') return true;
    if (typeof el.closest === 'function' && el.closest('input, textarea, select, [contenteditable="true"]')) return true;
    return false;
  };
  return check(target) || check(activeElement);
}

/**
 * Formats session progress string: current card / total remaining cards.
 * 
 * @param {number} currentIndex 0-based
 * @param {number} totalCount
 * @returns {{ currentNum: number, totalCount: number, remainingCount: number, text: string }}
 */
export function formatSessionProgress(currentIndex, totalCount) {
  const total = Math.max(0, Number(totalCount) || 0);
  const currentNum = total > 0 ? Math.max(1, Math.min(Number(currentIndex || 0) + 1, total)) : 0;
  const remainingCount = Math.max(0, total - currentNum);
  return {
    currentNum,
    totalCount: total,
    remainingCount,
    text: `Thẻ ${currentNum} / ${total} (Còn lại: ${remainingCount})`
  };
}

/**
 * Calculates non-negative elapsed reaction time in seconds.
 * 
 * @param {number} startTimeMs 
 * @param {number} nowMs 
 * @returns {number} integer seconds >= 0
 */
export function calculateReviewTime(startTimeMs, nowMs) {
  const start = Number(startTimeMs) || 0;
  const now = Number(nowMs) || 0;
  return Math.max(0, Math.round((now - start) / 1000));
}

/**
 * Formats elapsed seconds into human-readable representation (e.g. "12s" or "2p 15s").
 * 
 * @param {number} seconds 
 * @returns {string}
 */
export function formatElapsedSeconds(seconds) {
  const sec = Math.max(0, Math.floor(Number(seconds) || 0));
  if (sec < 60) {
    return `${sec}s`;
  }
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${mins}p ${rem}s`;
}

/**
 * Validates and serializes the exact payload for POST /api/v1/srs/review.
 * Enforces:
 * - itemType: strictly "VOCABULARY" or "RADICAL"
 * - itemId: positive number
 * - rating: 1..4
 * - reviewTimeSeconds: integer >= 0
 * - NO userId or accountId leakage
 * 
 * @param {Object} params 
 * @returns {{ itemType: string, itemId: number, rating: number, reviewTimeSeconds: number }}
 */
export function buildReviewPayload({ itemType, itemId, rating, reviewTimeSeconds, cardType }) {
  if (!itemType || typeof itemType !== 'string') {
    throw new TypeError('itemType must be a non-empty string ("VOCABULARY" or "RADICAL")');
  }
  const typeUpper = itemType.trim().toUpperCase();
  if (typeUpper !== 'VOCABULARY' && typeUpper !== 'RADICAL') {
    throw new TypeError(`itemType must be "VOCABULARY" or "RADICAL", received: ${itemType}`);
  }

  const id = Number(itemId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new TypeError(`itemId must be a positive integer, received: ${itemId}`);
  }

  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 4) {
    throw new TypeError(`rating must be an integer between 1 and 4, received: ${rating}`);
  }

  const timeSec = Number(reviewTimeSeconds);
  if (!Number.isInteger(timeSec) || timeSec < 0) {
    throw new TypeError(`reviewTimeSeconds must be a non-negative integer, received: ${reviewTimeSeconds}`);
  }

  const payload = {
    itemType: typeUpper,
    itemId: id,
    rating: r,
    reviewTimeSeconds: timeSec
  };

  if (cardType && typeof cardType === 'string' && cardType.trim()) {
    payload.cardType = cardType.trim().toUpperCase();
  }

  return payload;
}

/**
 * Handles the local session requeue policy for Again cards.
 * Prevents accidental infinite loops via maxAgain limit.
 * 
 * @param {Array} queue 
 * @param {Object} queueItem 
 * @param {number} [maxAgain=MAX_AGAIN_REVIEWS_PER_CARD] 
 * @returns {{ requeued: boolean, attempts?: number, reason?: string }}
 */
export function handleAgainRequeue(queue, queueItem, maxAgain = MAX_AGAIN_REVIEWS_PER_CARD) {
  if (!queue || !Array.isArray(queue) || !queueItem) {
    return { requeued: false, reason: 'INVALID_ARGUMENTS' };
  }

  const currentAttempts = (queueItem.againAttempts || 0) + 1;
  queueItem.againAttempts = currentAttempts;

  if (currentAttempts <= maxAgain) {
    const requeuedItem = {
      card: { ...queueItem.card },
      againAttempts: currentAttempts,
      _requeued: true
    };
    queue.push(requeuedItem);
    return { requeued: true, attempts: currentAttempts };
  }

  return { requeued: false, reason: 'MAX_ATTEMPTS_REACHED' };
}

// SpeechSynthesis functions (isSpeechSynthesisAvailable, speakHanzi) are imported and
// re-exported from ../ui/speech.js with centralized anti-spam and lifecycle locking.

/**
 * Interactive SRS Review Session Controller
 */
export class SrsReviewController {
  constructor() {
    // Session Configuration & Mode
    this.mode = 'DUE_CARDS'; // 'DUE_CARDS', 'LESSON_NEW_CARDS', 'LESSON_PRACTICE'
    this.lessonId = null;
    this.activeSkill = 'READING'; // 'READING', 'LISTENING', or 'WRITING'
    this.writingOrchestrator = null;

    // Queue & Execution State
    this.sessionQueue = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.isSubmitting = false;

    // Reaction Timer
    this.cardStartTime = 0;
    this.timerInterval = null;

    // Session Statistics
    this.stats = {
      totalReviewed: 0,
      againCount: 0,
      goodEasyCount: 0,
      totalTimeSeconds: 0
    };

    // Cache for detail audio URLs: itemId -> audioUrl
    this.audioCache = new Map();

    // Bound Event Handlers for Cleanup
    this.onKeydown = this.handleKeydown.bind(this);
    this.onUnload = this.cleanupTimer.bind(this);
  }

  /**
   * Initializes the review session page.
   */
  async init() {
    // Render navigation bar authentication state
    initNavbarAuth();

    // Cache DOM Elements
    this.dom = {
      loadingState: document.getElementById('srsLoadingState'),
      authState: document.getElementById('srsAuthState'),
      emptyState: document.getElementById('srsEmptyState'),
      emptyTitle: document.getElementById('srsEmptyTitle'),
      emptyDescription: document.getElementById('srsEmptyDescription'),
      btnEmptyPractice: document.getElementById('btnEmptyPracticeNow'),
      errorState: document.getElementById('srsErrorState'),
      errorMessage: document.getElementById('srsErrorMessage'),
      btnRetry: document.getElementById('btnSrsRetry'),
      activeSession: document.getElementById('srsActiveSession'),
      completedState: document.getElementById('srsCompletedState'),
      completedTitle: document.getElementById('srsCompletedTitle'),
      completedDescription: document.getElementById('srsCompletedDescription'),
      btnRestartSession: document.getElementById('btnRestartSession'),

      // Session Header
      modeBadge: document.getElementById('srsSessionModeBadge'),
      progressText: document.getElementById('srsProgressText'),
      progressBarContainer: document.getElementById('srsProgressBarContainer'),
      progressBarFill: document.getElementById('srsProgressBarFill'),
      timerBadge: document.getElementById('reactionTimerBadge'),
      tabReading: document.getElementById('srsSkillTabReading'),
      tabListening: document.getElementById('srsSkillTabListening'),
      tabWriting: document.getElementById('srsSkillTabWriting'),

      // Flashcard
      flashcard: document.getElementById('flashcard'),
      cardFront: document.getElementById('cardFront'),
      cardBack: document.getElementById('cardBack'),
      cardTypeFront: document.getElementById('cardTypeBadgeFront'),
      cardSkillBadgeFront: document.getElementById('cardSkillBadgeFront'),
      cardStatusFront: document.getElementById('cardStatusBadgeFront'),
      cardFrontListeningArea: document.getElementById('cardFrontListeningArea'),
      cardFrontWritingArea: document.getElementById('cardFrontWritingArea'),
      writingFrontMeaning: document.getElementById('writingFrontMeaning'),
      writingFrontHanViet: document.getElementById('writingFrontHanViet'),
      cardFrontWritingMount: document.getElementById('cardFrontWritingMount'),
      cardFrontHanzi: document.getElementById('cardFrontHanzi'),
      cardFrontPinyin: document.getElementById('cardFrontPinyin'),
      btnAudioPronounceFront: document.getElementById('btnAudioPronounceFront'),

      cardTypeBack: document.getElementById('cardTypeBadgeBack'),
      btnCardNote: document.getElementById('btnCardNote'),
      cardBackHanzi: document.getElementById('cardBackHanzi'),
      cardBackPinyin: document.getElementById('cardBackPinyin'),
      btnAudioPronounceBack: document.getElementById('btnAudioPronounceBack'),
      cardBackMeaningHv: document.getElementById('cardBackMeaningHv'),
      cardBackMeaningVi: document.getElementById('cardBackMeaningVi'),
      cardBackExampleBox: document.getElementById('cardBackExampleBox'),
      cardBackExampleSentence: document.getElementById('cardBackExampleSentence'),
      cardBackExampleTranslation: document.getElementById('cardBackExampleTranslation'),

      // Rating Controls
      ratingSection: document.getElementById('srsRatingSection'),
      ratingBar: document.getElementById('ratingControlsBar'),
      btnRatingAgain: document.getElementById('btnRatingAgain'),
      btnRatingHard: document.getElementById('btnRatingHard'),
      btnRatingGood: document.getElementById('btnRatingGood'),
      btnRatingEasy: document.getElementById('btnRatingEasy'),
      ratingFeedback: document.getElementById('ratingFeedback'),

      // Completion stats
      statTotalReviewed: document.getElementById('statTotalReviewed'),
      statAgainCount: document.getElementById('statAgainCount'),
      statGoodEasyCount: document.getElementById('statGoodEasyCount'),
      statTotalTime: document.getElementById('statTotalTime')
    };

    // Attach listeners
    this.bindEvents();

    // Parse Mode from Query Params
    this.parseQueryParams();

    // Start Session Loading
    await this.loadSession();
  }

  /**
   * Binds DOM and keyboard events.
   */
  bindEvents() {
    if (this.dom.btnRetry) {
      this.dom.btnRetry.addEventListener('click', () => this.loadSession());
    }

    if (this.dom.tabReading) {
      this.dom.tabReading.addEventListener('click', () => this.switchSkill('READING'));
    }

    if (this.dom.tabListening) {
      this.dom.tabListening.addEventListener('click', () => this.switchSkill('LISTENING'));
    }

    if (this.dom.tabWriting) {
      this.dom.tabWriting.addEventListener('click', () => this.switchSkill('WRITING'));
    }

    if (this.dom.flashcard) {
      this.dom.flashcard.addEventListener('click', (e) => {
        // Prevent flipping if clicked on an action button inside the card
        if (e.target.closest('button, a')) return;
        this.toggleFlip();
      });
    }

    if (this.dom.btnAudioPronounceFront) {
      this.dom.btnAudioPronounceFront.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playPronunciation(this.dom.btnAudioPronounceFront);
      });
    }

    if (this.dom.btnAudioPronounceBack) {
      this.dom.btnAudioPronounceBack.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playPronunciation(this.dom.btnAudioPronounceBack);
      });
    }

    if (this.dom.btnCardNote) {
      this.dom.btnCardNote.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openNoteForCurrentCard();
      });
    }

    // Rating buttons - unified with keyboard rating handler
    const ratingButtons = [
      { el: this.dom.btnRatingAgain, rating: 1 },
      { el: this.dom.btnRatingHard, rating: 2 },
      { el: this.dom.btnRatingGood, rating: 3 },
      { el: this.dom.btnRatingEasy, rating: 4 }
    ];

    for (const item of ratingButtons) {
      if (item.el) {
        item.el.addEventListener('click', (e) => {
          e.preventDefault();
          this.submitRating(item.rating);
        });
      }
    }

    // Global Keyboard Listener
    window.addEventListener('keydown', this.onKeydown);
    window.addEventListener('beforeunload', this.onUnload);
  }

  /**
   * Switches the active SRS skill between READING, LISTENING, and WRITING.
   *
   * @param {'READING'|'LISTENING'|'WRITING'} skill
   */
  async switchSkill(skill) {
    if (this.activeSkill === skill) return;
    this.activeSkill = skill;
    this.updateSkillTabsUi();
    await this.loadSession();
  }

  /**
   * Synchronizes visual styles of the skill toolbar buttons.
   */
  updateSkillTabsUi() {
    const tabs = [
      { el: this.dom.tabReading, skill: 'READING' },
      { el: this.dom.tabListening, skill: 'LISTENING' },
      { el: this.dom.tabWriting, skill: 'WRITING' }
    ];
    for (const { el, skill } of tabs) {
      if (el) {
        const isSelected = this.activeSkill === skill;
        el.className = `btn btn-sm rounded-pill py-2 px-3 px-sm-4 fw-bold srs-skill-tab ${isSelected ? 'btn-chinese-primary' : 'btn-outline-secondary border-0'}`;
        el.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      }
    }
  }

  /**
   * Parses lessonId and mode from URL to determine review mode.
   * - mode=practice & lessonId: LESSON_PRACTICE (Mode B: Free Practice, zero SRS mutation)
   * - mode=new & lessonId: LESSON_NEW_CARDS (Mode A: New cards in lesson)
   * - lessonId without mode=practice/new: DUE_CARDS with lessonId (loads /api/v1/srs/due?lessonId=X)
   * - no lessonId: DUE_CARDS (System-wide due cards)
   */
  parseQueryParams() {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const rawLessonId = urlParams.get('lessonId');
    const rawMode = (urlParams.get('mode') || '').toLowerCase();
    const rawSkill = (urlParams.get('skill') || urlParams.get('cardType') || '').toUpperCase();

    if (rawSkill === 'READING' || rawSkill === 'LISTENING' || rawSkill === 'WRITING') {
      this.activeSkill = rawSkill;
    }

    if (rawLessonId && /^\d+$/.test(rawLessonId.trim()) && Number(rawLessonId.trim()) > 0) {
      this.lessonId = Number(rawLessonId.trim());
      if (rawMode === 'practice') {
        this.mode = 'LESSON_PRACTICE';
      } else if (rawMode === 'new') {
        this.mode = 'LESSON_NEW_CARDS';
      } else {
        // Default with lessonId or mode=due: due cards for this lesson
        this.mode = 'DUE_CARDS';
      }
    } else {
      this.mode = 'DUE_CARDS';
      this.lessonId = null;
    }
  }

  /**
   * Sets visible top-level state view.
   * 
   * @param {'loading'|'auth'|'empty'|'error'|'active'|'completed'} state 
   */
  setViewState(state) {
    const states = {
      loading: this.dom.loadingState,
      auth: this.dom.authState,
      empty: this.dom.emptyState,
      error: this.dom.errorState,
      active: this.dom.activeSession,
      completed: this.dom.completedState
    };

    for (const [key, el] of Object.entries(states)) {
      if (el) {
        if (key === state) {
          el.classList.remove('d-none');
        } else {
          el.classList.add('d-none');
        }
      }
    }
  }

  /**
   * Loads the flashcard review session from backend.
   */
  async loadSession() {
    this.cleanupTimer();
    this.setViewState('loading');

    // Authentication Guard
    if (!authManager.isAuthenticated()) {
      this.setViewState('auth');
      return;
    }

    try {
      let cards = [];
      if (this.mode === 'LESSON_PRACTICE') {
        // Mode B: Retrieve all lesson cards for free practice (zero SRS mutation)
        cards = await apiClient('/srs/practice-cards', {
          params: { lessonId: this.lessonId, cardType: this.activeSkill }
        });
      } else if (this.mode === 'LESSON_NEW_CARDS') {
        // Mode A: Retrieve new card candidates for approved lesson
        cards = await apiClient('/srs/new-cards', {
          params: { lessonId: this.lessonId, cardType: this.activeSkill }
        });
      } else {
        // Mode C: Retrieve cards due for review (VOCABULARY-only invariant, supports optional lessonId)
        const dueParams = { itemType: 'VOCABULARY', cardType: this.activeSkill };
        if (this.lessonId) {
          dueParams.lessonId = this.lessonId;
        }
        cards = await apiClient('/srs/due', {
          params: dueParams
        });
      }

      // Filter defensively to strictly VOCABULARY items
      cards = (Array.isArray(cards) ? cards : []).filter(c => (c.itemType || '').toUpperCase() === 'VOCABULARY');

      if (cards.length === 0) {
        if (this.mode === 'LESSON_PRACTICE') {
          if (this.dom.emptyTitle) this.dom.emptyTitle.textContent = 'Bài học chưa có từ vựng';
          if (this.dom.emptyDescription) {
            this.dom.emptyDescription.textContent = 
              'Bài học này hiện chưa có từ vựng nào để luyện tập.';
          }
          if (this.dom.btnEmptyPractice) this.dom.btnEmptyPractice.classList.add('d-none');
        } else if (this.mode === 'LESSON_NEW_CARDS') {
          if (this.dom.emptyTitle) this.dom.emptyTitle.textContent = 'Không còn từ mới trong bài học này';
          if (this.dom.emptyDescription) {
            this.dom.emptyDescription.textContent = 
              'Bạn đã học hết toàn bộ từ vựng mới trong bài này. Bạn có thể chọn luyện lại bài tự do bất kỳ lúc nào mà không làm thay đổi lịch ôn tập SRS.';
          }
          if (this.dom.btnEmptyPractice) {
            this.dom.btnEmptyPractice.href = `srs-review.html?lessonId=${this.lessonId}&mode=practice`;
            this.dom.btnEmptyPractice.classList.remove('d-none');
          }
        } else if (this.lessonId) {
          if (this.dom.btnEmptyPractice) {
            this.dom.btnEmptyPractice.href = `srs-review.html?lessonId=${this.lessonId}&mode=practice`;
            this.dom.btnEmptyPractice.classList.remove('d-none');
          }
          if (this.dom.emptyTitle) this.dom.emptyTitle.textContent = `Không có thẻ đến hạn trong bài học #${this.lessonId}`;
          if (this.dom.emptyDescription) {
            this.dom.emptyDescription.textContent = 
              'Toàn bộ thẻ từ vựng trong bài học này hiện chưa đến lịch ôn tập tiếp theo. Hãy học thêm bài mới hoặc quay lại sau!';
          }
        } else {
          if (this.dom.btnEmptyPractice) this.dom.btnEmptyPractice.classList.add('d-none');
          // Authoritative differentiation for empty state in Due mode (Section XI)
          try {
            const stats = await apiClient('/srs/stats');
            if (stats && stats.cardsDue === 0 && stats.reviewsToday === 0) {
              if (this.dom.emptyTitle) this.dom.emptyTitle.textContent = 'Chưa có thẻ từ vựng trong hàng đợi ôn tập';
              if (this.dom.emptyDescription) {
                this.dom.emptyDescription.textContent = 
                  'Bạn chưa có thẻ từ vựng nào cần ôn tập. Hãy chọn một bài học đã được phê duyệt trong danh mục Bài học để bắt đầu học từ mới qua SRS!';
              }
            } else {
              if (this.dom.emptyTitle) this.dom.emptyTitle.textContent = 'Không có thẻ đến hạn hôm nay!';
              if (this.dom.emptyDescription) {
                this.dom.emptyDescription.textContent = 
                  'Tất cả các thẻ từ vựng của bạn hiện chưa đến lịch ôn tập tiếp theo. Hãy học thêm bài học mới hoặc quay lại sau!';
              }
            }
          } catch (e) {
            if (this.dom.emptyTitle) this.dom.emptyTitle.textContent = 'Không có thẻ đến hạn hôm nay!';
            if (this.dom.emptyDescription) {
              this.dom.emptyDescription.textContent = 
                'Bạn đã hoàn thành toàn bộ các thẻ ôn tập cần thiết. Hãy học thêm bài mới hoặc quay lại vào ngày mai!';
            }
          }
        }
        this.setViewState('empty');
        return;
      }

      // Initialize session queue
      this.sessionQueue = cards.map(c => ({
        card: c,
        againAttempts: 0
      }));

      this.currentIndex = 0;
      this.isFlipped = false;
      this.isSubmitting = false;
      this.stats = {
        totalReviewed: 0,
        againCount: 0,
        goodEasyCount: 0,
        totalTimeSeconds: 0
      };

      this.setViewState('active');
      this.renderCurrentCard();

    } catch (err) {
      console.error('[SRS Review] Failed to load session:', err);
      if (err.status === 401) {
        this.setViewState('auth');
        return;
      }

      if (this.dom.errorMessage) {
        this.dom.errorMessage.textContent = err.message || 'Đã xảy ra lỗi khi nạp dữ liệu thẻ ôn tập từ máy chủ.';
      }
      this.setViewState('error');
    }
  }

  /**
   * Renders the current active card in the session.
   */
  renderCurrentCard() {
    speechController.cancel();
    this.cleanupTimer();
    this.isFlipped = false;
    this.isSubmitting = false;

    if (this.dom.ratingFeedback) {
      this.dom.ratingFeedback.textContent = '';
    }

    // Reset 3D flashcard transform & state
    if (this.dom.flashcard) {
      this.dom.flashcard.classList.remove('flipped');
      this.dom.flashcard.setAttribute('aria-expanded', 'false');
    }

    if (this.dom.cardFront) this.dom.cardFront.setAttribute('aria-hidden', 'false');
    if (this.dom.cardBack) this.dom.cardBack.setAttribute('aria-hidden', 'true');

    // Rating buttons are active directly on front face (flipping is optional)
    this.setRatingButtonsEnabled(true);

    const queueItem = this.sessionQueue[this.currentIndex];
    if (!queueItem || !queueItem.card) {
      this.showCompletedState();
      return;
    }

    const card = queueItem.card;
    const isVocab = (card.itemType || '').toUpperCase() === 'VOCABULARY';

    // Front face
    if (this.dom.cardTypeFront) {
      this.dom.cardTypeFront.textContent = 'Từ vựng';
    }
    if (this.dom.cardStatusFront) {
      if (card.isNew) {
        this.dom.cardStatusFront.textContent = 'Mới';
        this.dom.cardStatusFront.classList.remove('d-none');
      } else if (queueItem._requeued) {
        this.dom.cardStatusFront.textContent = 'Học lại';
        this.dom.cardStatusFront.classList.remove('d-none');
      } else {
        this.dom.cardStatusFront.classList.add('d-none');
      }
    }
    if (this.dom.cardFrontHanzi) this.dom.cardFrontHanzi.textContent = card.hanzi || '';
    if (this.dom.cardFrontPinyin) this.dom.cardFrontPinyin.textContent = card.pinyin || '';

    // Destroy prior writing orchestrator if any
    if (this.writingOrchestrator) {
      try {
        this.writingOrchestrator.destroy();
      } catch (e) {
        // Safe dismissal
      }
      this.writingOrchestrator = null;
    }

    if (this.dom.cardSkillBadgeFront) {
      if (this.activeSkill === 'WRITING') {
        this.dom.cardSkillBadgeFront.textContent = '✍️ Luyện viết';
      } else if (this.activeSkill === 'LISTENING') {
        this.dom.cardSkillBadgeFront.textContent = '🎧 Luyện nghe';
      } else {
        this.dom.cardSkillBadgeFront.textContent = '📖 Đọc / Nhận diện';
      }
    }

    if (this.activeSkill === 'WRITING') {
      if (this.dom.cardFrontListeningArea) this.dom.cardFrontListeningArea.classList.add('d-none');
      if (this.dom.cardFrontWritingArea) this.dom.cardFrontWritingArea.classList.remove('d-none');
      if (this.dom.cardFrontHanzi) this.dom.cardFrontHanzi.classList.add('d-none');
      if (this.dom.cardFrontPinyin) this.dom.cardFrontPinyin.classList.add('d-none');

      if (this.dom.writingFrontMeaning) this.dom.writingFrontMeaning.textContent = card.meaningVi || '';
      if (this.dom.writingFrontHanViet) {
        if (card.meaningHanViet) {
          this.dom.writingFrontHanViet.textContent = `[${card.meaningHanViet}]`;
          this.dom.writingFrontHanViet.classList.remove('d-none');
        } else {
          this.dom.writingFrontHanViet.classList.add('d-none');
        }
      }

      if (this.dom.cardFrontWritingMount) {
        this.dom.cardFrontWritingMount.replaceChildren();
        this.writingOrchestrator = new VocabWritingOrchestrator({
          mountElement: this.dom.cardFrontWritingMount,
          initialMode: 'quiz'
        });
        this.writingOrchestrator.mount(card);
      }
    } else if (this.activeSkill === 'LISTENING') {
      // LISTENING Mode
      if (this.dom.cardFrontWritingArea) this.dom.cardFrontWritingArea.classList.add('d-none');
      if (this.dom.cardFrontListeningArea) this.dom.cardFrontListeningArea.classList.remove('d-none');
      if (this.dom.cardFrontHanzi) this.dom.cardFrontHanzi.classList.add('d-none');
      if (this.dom.cardFrontPinyin) this.dom.cardFrontPinyin.classList.add('d-none');

      const promptEl = document.getElementById('listeningFrontPromptText');
      if (promptEl) {
        promptEl.textContent = 'Bấm loa để nghe phát âm & tự đoán nghĩa';
      }

      // Auto-trigger speech pronunciation on card presentation
      if (this.dom.btnAudioPronounceFront) {
        this.playPronunciation(this.dom.btnAudioPronounceFront);
      }
    } else {
      // READING Mode (default)
      if (this.dom.cardFrontWritingArea) this.dom.cardFrontWritingArea.classList.add('d-none');
      if (this.dom.cardFrontListeningArea) this.dom.cardFrontListeningArea.classList.remove('d-none');
      if (this.dom.cardFrontHanzi) {
        this.dom.cardFrontHanzi.textContent = card.hanzi || '';
        this.dom.cardFrontHanzi.classList.remove('d-none');
      }
      if (this.dom.cardFrontPinyin) {
        this.dom.cardFrontPinyin.textContent = card.pinyin || '';
        this.dom.cardFrontPinyin.classList.add('d-none');
      }

      const promptEl = document.getElementById('listeningFrontPromptText');
      if (promptEl) {
        promptEl.textContent = 'Nhìn chữ đoán Pinyin & nghĩa • Đánh giá ngay hoặc nhấn Space để lật';
      }
    }

    // Update speech button accessible names and tooltips
    const speechLabel = `Phát âm từ ${card.hanzi || 'vựng'}`;
    const speechTitle = `Phát âm: ${card.hanzi || ''}`;
    if (this.dom.btnAudioPronounceFront) {
      this.dom.btnAudioPronounceFront.setAttribute('aria-label', speechLabel);
      this.dom.btnAudioPronounceFront.setAttribute('title', speechTitle);
    }
    if (this.dom.btnAudioPronounceBack) {
      this.dom.btnAudioPronounceBack.setAttribute('aria-label', speechLabel);
      this.dom.btnAudioPronounceBack.setAttribute('title', speechTitle);
    }

    // Back face
    if (this.dom.cardTypeBack) {
      this.dom.cardTypeBack.textContent = 'Từ vựng';
    }
    if (this.dom.cardBackHanzi) this.dom.cardBackHanzi.textContent = card.hanzi || '';
    if (this.dom.cardBackPinyin) this.dom.cardBackPinyin.textContent = card.pinyin || '';
    
    // Meaning Hán-Việt
    if (this.dom.cardBackMeaningHv) {
      if (card.meaningHanViet) {
        this.dom.cardBackMeaningHv.textContent = card.meaningHanViet;
        this.dom.cardBackMeaningHv.classList.remove('d-none');
      } else {
        this.dom.cardBackMeaningHv.classList.add('d-none');
      }
    }

    // Meaning Vietnamese
    if (this.dom.cardBackMeaningVi) {
      this.dom.cardBackMeaningVi.textContent = card.meaningVi || '';
    }

    // Contextual Personal Note action (VOCABULARY only)
    if (this.dom.btnCardNote) {
      this.dom.btnCardNote.classList.remove('d-none');
    }

    // Example Box (Vocabulary only, if present)
    if (this.dom.cardBackExampleBox) {
      if (card.exampleSentence) {
        if (this.dom.cardBackExampleSentence) this.dom.cardBackExampleSentence.textContent = card.exampleSentence;
        if (this.dom.cardBackExampleTranslation) this.dom.cardBackExampleTranslation.textContent = card.exampleTranslation || '';
        this.dom.cardBackExampleBox.classList.remove('d-none');
      } else {
        this.dom.cardBackExampleBox.classList.add('d-none');
      }
    }

    // Progress Bar & Counter (Display current card / total remaining cards)
    const totalCount = this.sessionQueue.length;
    const currentNum = this.currentIndex + 1;
    const remainingCount = totalCount - currentNum;
    if (this.dom.progressText) {
      this.dom.progressText.textContent = `Thẻ ${currentNum} / ${totalCount} (Còn lại: ${remainingCount})`;
    }
    if (this.dom.modeBadge) {
      if (this.mode === 'LESSON_PRACTICE') {
        this.dom.modeBadge.textContent = `Luyện tự do #${this.lessonId} (Không đổi SRS)`;
      } else if (this.mode === 'LESSON_NEW_CARDS') {
        this.dom.modeBadge.textContent = `Bài học #${this.lessonId}`;
      } else if (this.lessonId) {
        this.dom.modeBadge.textContent = `Thẻ đến hạn #${this.lessonId}`;
      } else {
        this.dom.modeBadge.textContent = 'Thẻ đến hạn';
      }
    }
    if (this.dom.progressBarContainer && this.dom.progressBarFill) {
      this.dom.progressBarContainer.setAttribute('aria-valuenow', String(currentNum));
      this.dom.progressBarContainer.setAttribute('aria-valuemax', String(totalCount));
      this.dom.progressBarContainer.setAttribute('aria-label', `Tiến độ: thẻ ${currentNum} trên ${totalCount}, còn lại ${remainingCount} thẻ`);
      const pct = Math.min(100, Math.round((currentNum / totalCount) * 100));
      this.dom.progressBarFill.style.width = `${pct}%`;
    }

    // Start Reaction Timer
    this.cardStartTime = Date.now();
    if (this.dom.timerBadge) {
      this.dom.timerBadge.textContent = '⏱️ 0s';
    }

    this.timerInterval = setInterval(() => {
      const elapsed = calculateReviewTime(this.cardStartTime, Date.now());
      if (this.dom.timerBadge) {
        this.dom.timerBadge.textContent = `⏱️ ${formatElapsedSeconds(elapsed)}`;
      }
    }, 1000);
  }

  /**
   * Toggles 3D card flip between front prompt and back answer.
   */
  toggleFlip() {
    if (this.isSubmitting) return;

    this.isFlipped = !this.isFlipped;
    if (this.dom.flashcard) {
      if (this.isFlipped) {
        this.dom.flashcard.classList.add('flipped');
        this.dom.flashcard.setAttribute('aria-expanded', 'true');
      } else {
        this.dom.flashcard.classList.remove('flipped');
        this.dom.flashcard.setAttribute('aria-expanded', 'false');
      }
    }

    if (this.dom.cardFront) this.dom.cardFront.setAttribute('aria-hidden', this.isFlipped ? 'true' : 'false');
    if (this.dom.cardBack) this.dom.cardBack.setAttribute('aria-hidden', this.isFlipped ? 'false' : 'true');

    // Rating buttons stay enabled whether card is flipped or unflipped
    this.setRatingButtonsEnabled(true);
  }

  /**
   * Enables or disables the 4 rating buttons.
   * 
   * @param {boolean} enabled 
   */
  setRatingButtonsEnabled(enabled) {
    const btns = [
      this.dom.btnRatingAgain,
      this.dom.btnRatingHard,
      this.dom.btnRatingGood,
      this.dom.btnRatingEasy
    ];
    for (const b of btns) {
      if (b) b.disabled = !enabled;
    }
  }

  /**
   * Dispatches audio playback for the active card.
   * Queries real detail endpoint (/vocabulary/{id} or /radicals/{id}) when not cached,
   * falling back cleanly to Web Speech API.
   * 
   * @param {HTMLElement|null} triggerButton
   */
  async playPronunciation(triggerButton = null) {
    const queueItem = this.sessionQueue[this.currentIndex];
    if (!queueItem || !queueItem.card) return;
    const card = queueItem.card;

    // Check memory cache
    const cacheKey = `${card.itemType}_${card.itemId}`;
    if (this.audioCache.has(cacheKey)) {
      const cachedUrl = this.audioCache.get(cacheKey);
      if (cachedUrl) {
        this.playAudioUrl(cachedUrl, card.hanzi, triggerButton);
        return;
      }
      // If cached as null, use speech synthesis fallback
      speakHanzi(card.hanzi, { button: triggerButton });
      return;
    }

    // Fetch detail data from authoritative endpoint
    try {
      let audioUrl = null;
      if ((card.itemType || '').toUpperCase() === 'VOCABULARY') {
        const detail = await apiClient(`/vocabulary/${card.itemId}`);
        audioUrl = detail?.audioUrl || null;
      } else {
        const detail = await apiClient(`/radicals/${card.itemId}`);
        audioUrl = detail?.audioUrl || null;
      }

      this.audioCache.set(cacheKey, audioUrl);

      if (audioUrl) {
        this.playAudioUrl(audioUrl, card.hanzi, triggerButton);
      } else {
        speakHanzi(card.hanzi, { button: triggerButton });
      }
    } catch (e) {
      console.warn('[SRS Audio] Could not fetch card detail audio, falling back to speech synthesis:', e);
      speakHanzi(card.hanzi, { button: triggerButton });
    }
  }

  /**
   * Plays sanitized audio URL with fallback to Web Speech via centralized speech controller.
   * 
   * @param {string} rawUrl 
   * @param {string} fallbackHanzi 
   * @param {HTMLElement|null} triggerButton
   */
  playAudioUrl(rawUrl, fallbackHanzi, triggerButton = null) {
    return playPronunciation({
      text: fallbackHanzi,
      audioUrl: rawUrl,
      button: triggerButton
    });
  }

  /**
   * Opens contextual personal notes modal for the current vocabulary card.
   */
  openNoteForCurrentCard() {
    const queueItem = this.sessionQueue[this.currentIndex];
    if (!queueItem || !queueItem.card) return;
    const card = queueItem.card;

    if ((card.itemType || '').toUpperCase() !== 'VOCABULARY') {
      return;
    }

    openNotesModal({
      vocabId: card.itemId,
      hanzi: card.hanzi,
      pinyin: card.pinyin,
      meaning: card.meaningVi,
      triggerElement: this.dom.btnCardNote
    });
  }

  /**
   * Unified rating submission handler called by both keyboard shortcuts and click.
   * Prevents double-submission by locking when a request is in-flight.
   * Rating is fully active on front face; flipping the card is optional.
   * 
   * @param {number|string} rating 1=Again, 2=Hard, 3=Good, 4=Easy
   */
  async submitRating(rating) {
    // Double-submission guard & session boundary guard
    if (this.isSubmitting) return;
    if (!this.sessionQueue || this.currentIndex >= this.sessionQueue.length) return;

    const queueItem = this.sessionQueue[this.currentIndex];
    if (!queueItem || !queueItem.card) return;

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 4) return;

    const card = queueItem.card;

    // Freeze reaction timer
    this.cleanupTimer();
    const elapsedSeconds = calculateReviewTime(this.cardStartTime, Date.now());

    // Lock submission controls immediately
    this.isSubmitting = true;
    this.setRatingButtonsEnabled(false);
    if (this.dom.ratingFeedback) {
      this.dom.ratingFeedback.textContent = 'Đang ghi nhận kết quả đánh giá...';
    }

    try {
      if (this.mode === 'LESSON_PRACTICE') {
        // Zero SRS Mutation: Do NOT call POST /api/v1/srs/review
        this.stats.totalReviewed++;
        this.stats.totalTimeSeconds += elapsedSeconds;
        if (numRating === 1) {
          this.stats.againCount++;
        } else if (numRating >= 3) {
          this.stats.goodEasyCount++;
        }

        if (numRating === 1) {
          const requeueResult = handleAgainRequeue(this.sessionQueue, queueItem, MAX_AGAIN_REVIEWS_PER_CARD);
          if (requeueResult.requeued) {
            showToast({
              type: 'info',
              title: 'Luyện lại',
              message: `Thẻ "${card.hanzi}" sẽ xuất hiện lại ở cuối phiên luyện tập.`
            });
          }
        }

        this.currentIndex++;
        this.isSubmitting = false;

        if (this.currentIndex >= this.sessionQueue.length) {
          this.showCompletedState();
        } else {
          this.renderCurrentCard();
        }
        return;
      }

      const payload = buildReviewPayload({
        itemType: card.itemType,
        itemId: card.itemId,
        cardType: this.activeSkill,
        rating: numRating,
        reviewTimeSeconds: elapsedSeconds
      });

      // Submit authoritative review to backend
      await apiClient('/srs/review', {
        method: 'POST',
        body: payload
      });

      // Update session statistics
      this.stats.totalReviewed++;
      this.stats.totalTimeSeconds += elapsedSeconds;
      if (numRating === 1) {
        this.stats.againCount++;
      } else if (numRating >= 3) {
        this.stats.goodEasyCount++;
      }

      // Handle Again local session requeue
      if (numRating === 1) {
        const requeueResult = handleAgainRequeue(this.sessionQueue, queueItem, MAX_AGAIN_REVIEWS_PER_CARD);
        if (requeueResult.requeued) {
          showToast({
            type: 'info',
            title: 'Học lại',
            message: `Thẻ "${card.hanzi}" sẽ xuất hiện lại ở cuối phiên học.`
          });
        }
      }

      // Advance to next card
      this.currentIndex++;
      this.isSubmitting = false;

      if (this.currentIndex >= this.sessionQueue.length) {
        this.showCompletedState();
      } else {
        this.renderCurrentCard();
      }

    } catch (err) {
      console.error('[SRS Review] Review submission error:', err);
      this.isSubmitting = false;
      this.setRatingButtonsEnabled(true);

      if (err.status === 401) {
        this.setViewState('auth');
        return;
      }

      const msg = err.status === 409
        ? 'Thẻ chưa đến hạn ôn tập hoặc bạn đã đạt giới hạn ôn tập trong ngày.'
        : (err.message || 'Không thể gửi đánh giá thẻ. Vui lòng thử lại.');

      if (this.dom.ratingFeedback) {
        this.dom.ratingFeedback.textContent = msg;
      }

      showToast({
        type: 'danger',
        title: 'Lỗi gửi đánh giá',
        message: msg
      });
    }
  }

  /**
   * Alias rateCard -> submitRating
   * @param {number|string} rating
   */
  rateCard(rating) {
    return this.submitRating(rating);
  }

  /**
   * Backward-compatible alias handleRating -> submitRating
   * @param {number|string} rating
   */
  handleRating(rating) {
    return this.submitRating(rating);
  }

  /**
   * Handles keyboard shortcuts: Space/Enter (flip), 1..4 (ratings).
   * Supports Digit1..Digit4 and Numpad1..Numpad4 directly on front face.
   * Ignores keystrokes when focused on input, textarea, select, contenteditable, or modals.
   * 
   * @param {KeyboardEvent} e 
   */
  handleKeydown(e) {
    // Ignore keystrokes inside form controls (inputs, textareas, select, contenteditable)
    const tag = (e.target?.tagName || '').toLowerCase();
    const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
    const activeTag = (activeEl?.tagName || '').toLowerCase();

    const isFormControl = (el, tagName) => {
      if (!el && !tagName) return false;
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return true;
      if (el?.isContentEditable || el?.getAttribute?.('contenteditable') === 'true') return true;
      if (el?.closest && el.closest('input, textarea, select, [contenteditable="true"]')) return true;
      return false;
    };

    if (isFormControl(e.target, tag) || isFormControl(activeEl, activeTag)) {
      return;
    }

    // Ignore keystrokes if a modal dialog is open (e.g. notes modal or native dialog)
    if (typeof document !== 'undefined') {
      const modal = document.getElementById('notesModal');
      if (modal && (modal.open || !modal.classList.contains('d-none'))) {
        return;
      }
      const openDialog = document.querySelector('dialog[open], .modal.show');
      if (openDialog) {
        return;
      }
    }

    // Only operate when active session is visible and not submitting and cards remain
    if (this.dom.activeSession?.classList.contains('d-none') || this.isSubmitting) {
      return;
    }
    if (!this.sessionQueue || this.currentIndex >= this.sessionQueue.length) {
      return;
    }

    // Space or Enter flips the flashcard (optional)
    if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
      // If user focused on a real button, let the native button click fire
      if (tag === 'button' && e.target !== this.dom.flashcard) {
        return;
      }
      e.preventDefault();
      this.toggleFlip();
      return;
    }

    // Rating shortcuts 1..4: Digit1-Digit4, Numpad1-Numpad4, e.key '1'-'4'
    // Work directly when card is on front face (flipping is optional)
    const rating = mapKeyToRating(e);
    if (rating !== null) {
      e.preventDefault();
      this.submitRating(rating);
    }
  }

  /**
   * Displays the session completion screen with honest statistics.
   */
  showCompletedState() {
    this.cleanupTimer();
    this.setViewState('completed');

    if (this.dom.completedTitle) {
      this.dom.completedTitle.textContent = this.mode === 'LESSON_PRACTICE'
        ? 'Hoàn Thành Phiên Luyện Tập Tự Do!'
        : 'Hoàn Thành Phiên Ôn Tập!';
    }
    if (this.dom.completedDescription) {
      this.dom.completedDescription.textContent = this.mode === 'LESSON_PRACTICE'
        ? 'Bạn đã hoàn thành phiên luyện tập tự do. Phiên học này không làm thay đổi lịch ôn tập SRS của bạn.'
        : 'Các đánh giá của bạn đã được ghi nhận vào tiến trình trí nhớ dài hạn.';
    }
    if (this.dom.btnRestartSession) {
      if (this.mode === 'LESSON_PRACTICE' || this.mode === 'LESSON_NEW_CARDS') {
        this.dom.btnRestartSession.href = `srs-review.html?lessonId=${this.lessonId}&mode=practice`;
        this.dom.btnRestartSession.textContent = 'Luyện tập lại bài này';
      } else if (this.lessonId) {
        this.dom.btnRestartSession.href = `srs-review.html?lessonId=${this.lessonId}`;
        this.dom.btnRestartSession.textContent = 'Ôn tập tiếp bài này';
      } else {
        this.dom.btnRestartSession.href = 'srs-review.html';
        this.dom.btnRestartSession.textContent = 'Ôn tập tiếp';
      }
    }

    if (this.dom.statTotalReviewed) {
      this.dom.statTotalReviewed.textContent = String(this.stats.totalReviewed);
    }
    if (this.dom.statAgainCount) {
      this.dom.statAgainCount.textContent = String(this.stats.againCount);
    }
    if (this.dom.statGoodEasyCount) {
      this.dom.statGoodEasyCount.textContent = String(this.stats.goodEasyCount);
    }
    if (this.dom.statTotalTime) {
      this.dom.statTotalTime.textContent = formatElapsedSeconds(this.stats.totalTimeSeconds);
    }
  }

  /**
   * Cleans up running timer intervals.
   */
  cleanupTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Destroys the controller instance and unbinds global listeners.
   */
  destroy() {
    this.cleanupTimer();
    if (this.writingOrchestrator) {
      try {
        this.writingOrchestrator.destroy();
      } catch (e) {
        // Safe dismissal
      }
      this.writingOrchestrator = null;
    }
    speechController.cancel();
    window.removeEventListener('keydown', this.onKeydown);
    window.removeEventListener('beforeunload', this.onUnload);
  }
}

// Global page instance auto-init on DOMContentLoaded
let srsControllerInstance = null;
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    srsControllerInstance = new SrsReviewController();
    srsControllerInstance.init();
  });
}
