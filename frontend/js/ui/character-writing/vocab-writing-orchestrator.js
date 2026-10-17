/**
 * =============================================================================
 * VOCABULARY WRITING ORCHESTRATOR
 * Module: frontend/js/ui/character-writing/vocab-writing-orchestrator.js
 *
 * Responsibilities:
 * - Multi-character orchestration over CharacterWritingEngine instances.
 * - Decomposes multi-glyph Chinese words into constituent Hanzi characters:
 *   e.g. '学生' -> ['学', '生'], '对不起' -> ['对', '不', '起'].
 * - Responsive layout adaptation:
 *   * 1 character: single large calligraphy canvas (170x170px).
 *   * 2 characters on wide screens: side-by-side dual rice-grid boxes.
 *   * 3+ characters or narrow mobile screens (<480px): Character Stepper with single large canvas.
 * - Tracks stroke accuracy and mistakes across all characters in the word.
 * - 3 Interactive Modes: 'demo' (Cách viết), 'practice' (Luyện nét), 'quiz' (Luyện viết).
 * - Full lifecycle management and zero DOM leaks.
 * - 100% Safe DOM manipulation (zero innerHTML sinks).
 * =============================================================================
 */

import { CharacterWritingEngine, WRITING_MODES } from './character-writing-engine.js';
import { splitHanziCharacters, loadStrokeData } from './stroke-data-loader.js';
import { sanitizeNavigationUrl } from '../security.js';

export { WRITING_MODES };

/**
 * Creates an SVG rice grid (米字格) element with standard guidelines.
 *
 * @param {number} size
 * @returns {SVGSVGElement}
 */
export function createRiceGridSvg(size = 170) {
  const half = Math.round(size / 2);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('class', 'position-absolute top-0 start-0 w-100 h-100 pointer-events-none');
  svg.setAttribute('aria-hidden', 'true');

  const createLine = (x1, y1, x2, y2, color, dash) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', color);
    if (dash) line.setAttribute('stroke-dasharray', dash);
    return line;
  };

  // Horizontal and vertical center lines
  svg.appendChild(createLine(0, half, size, half, '#E5E7EB', '4,4'));
  svg.appendChild(createLine(half, 0, half, size, '#E5E7EB', '4,4'));

  // Diagonals
  svg.appendChild(createLine(0, 0, size, size, '#F3F4F6', '4,4'));
  svg.appendChild(createLine(size, 0, 0, size, '#F3F4F6', '4,4'));

  return svg;
}

export class VocabWritingOrchestrator {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.mountElement - Container DOM element
   * @param {string} [options.initialMode='demo']
   * @param {Function} [options.onWordComplete] - Called when all characters in the word are written
   * @param {Function} [options.onCharacterComplete] - Called when one character in word is completed
   * @param {Function} [options.onStatusChange] - Status text updates
   */
  constructor(options = {}) {
    if (!options.mountElement) {
      throw new Error('VocabWritingOrchestrator requires a mountElement DOM container.');
    }

    this.mountElement = options.mountElement;
    this.initialMode = options.initialMode || WRITING_MODES.DEMO;
    this.currentMode = this.initialMode;
    this.demoOnly = Boolean(options.demoOnly);
    this.practiceUrl = options.practiceUrl || null;
    this.onWordComplete = typeof options.onWordComplete === 'function' ? options.onWordComplete : null;
    this.onCharacterComplete = typeof options.onCharacterComplete === 'function' ? options.onCharacterComplete : null;
    this.onStatusChange = typeof options.onStatusChange === 'function' ? options.onStatusChange : null;

    this.wordData = null;
    this.characters = [];
    this.activeCharIndex = 0;
    this.engines = new Map(); // charIndex -> CharacterWritingEngine
    this.charStats = new Map(); // charIndex -> { completed: boolean, mistakes: number }
    this.missingStrokesSet = new Set(); // characters lacking stroke data
    this.isDestroyed = false;
    this.dom = {};
  }

  /**
   * Mounts and initializes the orchestrator for a given vocabulary word.
   *
   * @param {Object|string} vocabItem - Vocabulary object ({ hanzi, pinyin, meaningVi, ... }) or string
   * @returns {Promise<boolean>}
   */
  async mount(vocabItem) {
    this.destroy();
    this.isDestroyed = false;

    if (!vocabItem) return false;

    if (typeof vocabItem === 'string') {
      this.wordData = {
        vocabId: null,
        hanzi: vocabItem,
        pinyin: '',
        meaningVi: '',
        hskLevel: 1
      };
    } else {
      this.wordData = {
        vocabId: vocabItem.vocabId || vocabItem.id || null,
        hanzi: vocabItem.hanzi || vocabItem.character || '',
        pinyin: vocabItem.pinyin || '',
        meaningVi: vocabItem.meaningVi || vocabItem.meaning || '',
        hskLevel: vocabItem.hskLevel || 1
      };
    }

    this.characters = splitHanziCharacters(this.wordData.hanzi);
    if (this.characters.length === 0) {
      this.renderEmptyFallback();
      return false;
    }

    this.activeCharIndex = 0;
    this.charStats.clear();
    this.missingStrokesSet.clear();
    this.characters.forEach((char, idx) => {
      this.charStats.set(idx, { character: char, completed: false, mistakes: 0 });
    });

    this.buildDomStructure();
    return this.initializeEnginesForActiveView();
  }

  /**
   * Determines if side-by-side mode is appropriate.
   * Unified to return false so that 2-character words synchronize with 3+-character words
   * to use tab/stepper switching.
   *
   * @returns {boolean}
   */
  isDualSideBySideMode() {
    return false;
  }

  /**
   * Builds the outer DOM card and layout structure.
   *
   * @private
   */
  buildDomStructure() {
    this.mountElement.replaceChildren();

    const card = document.createElement('div');
    card.className = 'writing-engine-card vocab-writing-orchestrator p-3 rounded-3 border bg-surface mb-3 shadow-sm';

    // 1. Header: Word info & Tab list (Omitted in demoOnly / compact view)
    if (!this.demoOnly) {
      const headerRow = document.createElement('div');
      headerRow.className = 'd-flex align-items-center justify-content-between mb-3 flex-wrap gap-2 border-bottom pb-2';

      // Word Metadata Pill
      const wordInfo = document.createElement('div');
      wordInfo.className = 'd-flex align-items-baseline gap-2 flex-wrap';

      const wordGlyph = document.createElement('span');
      wordGlyph.className = 'fs-5 fw-bold text-dark';
      wordGlyph.lang = 'zh-Hans';
      wordGlyph.textContent = this.wordData.hanzi;
      wordInfo.appendChild(wordGlyph);

      if (this.wordData.pinyin) {
        const pinyinEl = document.createElement('span');
        pinyinEl.className = 'small text-primary fw-medium';
        pinyinEl.textContent = `[${this.wordData.pinyin}]`;
        wordInfo.appendChild(pinyinEl);
      }

      if (this.wordData.meaningVi) {
        const meaningEl = document.createElement('span');
        meaningEl.className = 'small text-muted';
        meaningEl.textContent = `— ${this.wordData.meaningVi}`;
        wordInfo.appendChild(meaningEl);
      }

      headerRow.appendChild(wordInfo);

      // 3 Tabs: Cách viết | Luyện nét | Luyện viết
      const tabList = document.createElement('div');
      tabList.className = 'writing-tabs-toolbar d-flex rounded-2 p-1 bg-light border';
      tabList.setAttribute('role', 'tablist');
      tabList.setAttribute('aria-label', 'Chế độ luyện viết chữ Hán');

      const tabsConfig = [
        { mode: WRITING_MODES.DEMO, label: 'Cách viết' },
        { mode: WRITING_MODES.PRACTICE, label: 'Luyện nét' },
        { mode: WRITING_MODES.QUIZ, label: 'Luyện viết' }
      ];

      this.dom.tabs = {};
      tabsConfig.forEach(cfg => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'writing-tab-btn btn btn-sm py-1 px-2 border-0 fw-medium';
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', cfg.mode === this.currentMode ? 'true' : 'false');
        btn.textContent = cfg.label;

        btn.addEventListener('click', () => {
          this.switchMode(cfg.mode);
        });

        tabList.appendChild(btn);
        this.dom.tabs[cfg.mode] = btn;
      });

      headerRow.appendChild(tabList);
      card.appendChild(headerRow);
    }

    // 2. Character Stepper Controls (for 3+ characters or mobile)
    const isDual = this.isDualSideBySideMode();
    const stepperContainer = document.createElement('div');
    stepperContainer.className = `vocab-char-stepper d-flex align-items-center justify-content-center gap-2 mb-3 ${isDual || this.characters.length <= 1 ? 'd-none' : ''}`;
    this.dom.stepperContainer = stepperContainer;

    this.dom.stepperButtons = [];
    this.characters.forEach((char, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn btn-sm ${idx === this.activeCharIndex ? 'btn-chinese-primary' : 'btn-outline-secondary'} py-1 px-3 rounded-pill fw-semibold`;
      btn.textContent = `Chữ ${idx + 1}: ${char}`;
      btn.setAttribute('aria-label', `Chọn chữ thứ ${idx + 1} (${char}) để luyện`);

      btn.addEventListener('click', () => {
        this.selectCharacter(idx);
      });

      stepperContainer.appendChild(btn);
      this.dom.stepperButtons.push(btn);
    });

    card.appendChild(stepperContainer);

    // 3. Stage Canvas Area
    const stageArea = document.createElement('div');
    stageArea.className = 'vocab-stage-area d-flex justify-content-center align-items-center gap-3 flex-wrap py-2';
    this.dom.stageArea = stageArea;
    card.appendChild(stageArea);

    // 4. Live Feedback & Action Toolbar (Omitted in demoOnly / compact view)
    if (this.demoOnly) {
      const statusText = document.createElement('div');
      statusText.className = 'visually-hidden';
      statusText.setAttribute('role', 'status');
      statusText.setAttribute('aria-live', 'polite');
      statusText.textContent = 'Đang nạp dữ liệu nét chữ...';
      card.appendChild(statusText);
      this.dom.statusText = statusText;
    } else {
      const footerRow = document.createElement('div');
      footerRow.className = 'd-flex align-items-center justify-content-between mt-3 pt-2 border-top flex-wrap gap-2';

      const statusText = document.createElement('div');
      statusText.className = 'small text-muted flex-grow-1 text-center text-sm-start';
      statusText.setAttribute('role', 'status');
      statusText.setAttribute('aria-live', 'polite');
      statusText.textContent = 'Đang nạp dữ liệu nét chữ...';
      footerRow.appendChild(statusText);
      this.dom.statusText = statusText;

      // Action buttons: Replay, Next Character & SRS Practice Shortcut
      const actionsGroup = document.createElement('div');
      actionsGroup.className = 'd-flex align-items-center gap-2 ms-auto flex-wrap';

      const replayBtn = document.createElement('button');
      replayBtn.type = 'button';
      replayBtn.className = 'btn btn-sm btn-outline-secondary py-1 px-2 d-flex align-items-center gap-1';
      replayBtn.title = 'Phát lại nét (Thứ tự các nét)';
      replayBtn.setAttribute('aria-label', 'Phát lại nét');
      replayBtn.textContent = '🔄 Phát lại nét';
      replayBtn.addEventListener('click', () => {
        this.replayActive();
      });
      actionsGroup.appendChild(replayBtn);
      this.dom.replayBtn = replayBtn;

      if (this.characters.length > 1) {
        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'btn btn-sm btn-chinese-secondary py-1 px-2';
        nextBtn.textContent = 'Chữ kế &rarr;';
        nextBtn.addEventListener('click', () => {
          const nextIdx = (this.activeCharIndex + 1) % this.characters.length;
          this.selectCharacter(nextIdx);
        });
        actionsGroup.appendChild(nextBtn);
        this.dom.nextBtn = nextBtn;
      }

      // Shortcut: "Luyện viết từ này" -> srs-review.html?mode=writing&group=hsk1&vocabId=...
      if (this.practiceUrl || (this.wordData && this.wordData.vocabId)) {
        const group = this.wordData.hskLevel ? `hsk${this.wordData.hskLevel}` : 'hsk1';
        const url = this.practiceUrl || `srs-review.html?mode=writing&group=${group}&vocabId=${encodeURIComponent(this.wordData.vocabId)}`;
        const practiceLink = document.createElement('a');
        practiceLink.className = 'btn btn-sm btn-chinese-primary py-1 px-2 d-inline-flex align-items-center gap-1 text-decoration-none';
        practiceLink.href = sanitizeNavigationUrl(url);
        practiceLink.textContent = '✍️ Luyện viết từ này';
        practiceLink.title = 'Chuyển sang phòng Ôn tập SRS để luyện viết';
        practiceLink.setAttribute('aria-label', `Luyện viết từ ${this.wordData.hanzi || ''} trong phòng Ôn tập SRS`);
        actionsGroup.appendChild(practiceLink);
        this.dom.practiceLink = practiceLink;
      }

      footerRow.appendChild(actionsGroup);
      card.appendChild(footerRow);
    }

    this.mountElement.appendChild(card);
  }

  /**
   * Initializes HanziWriter engines according to layout mode (Dual vs Stepper).
   *
   * @private
   * @returns {Promise<boolean>}
   */
  async initializeEnginesForActiveView() {
    if (this.isDestroyed) return false;

    this.destroyEngines();
    this.dom.stageArea.replaceChildren();

    const isDual = this.isDualSideBySideMode();
    let allSucceeded = false;

    if (isDual) {
      // Dual side-by-side layout: mount box 0 and box 1
      const p0 = this.mountCanvasBox(0, this.characters[0]);
      const p1 = this.mountCanvasBox(1, this.characters[1]);
      const results = await Promise.all([p0, p1]);
      this.updateActiveTabStyling(this.currentMode);
      allSucceeded = results.every(Boolean);
    } else {
      // Stepper mode: mount single active character
      const success = await this.mountCanvasBox(this.activeCharIndex, this.characters[this.activeCharIndex]);
      this.updateActiveTabStyling(this.currentMode);
      this.updateStepperButtons();
      allSucceeded = success;
    }

    if (this.missingStrokesSet.size > 0) {
      const missingList = Array.from(this.missingStrokesSet);
      const msg = missingList.length === 1
        ? `Chữ "${missingList[0]}" hiện chưa có dữ liệu nét chi tiết.`
        : `Các chữ [${missingList.join(', ')}] hiện chưa có dữ liệu nét chi tiết.`;
      if (this.dom.statusText) {
        this.dom.statusText.textContent = msg;
        this.dom.statusText.classList.remove('text-success');
        this.dom.statusText.classList.add('text-warning');
      }
      if (this.dom.practiceLink) {
        this.dom.practiceLink.classList.add('disabled', 'opacity-50');
        this.dom.practiceLink.removeAttribute('href');
        this.dom.practiceLink.setAttribute('aria-disabled', 'true');
        this.dom.practiceLink.textContent = 'Chưa có dữ liệu nét';
        this.dom.practiceLink.title = msg;
      }
      if (this.dom.tabs) {
        if (this.dom.tabs[WRITING_MODES.PRACTICE]) {
          this.dom.tabs[WRITING_MODES.PRACTICE].disabled = true;
          this.dom.tabs[WRITING_MODES.PRACTICE].classList.add('disabled');
        }
        if (this.dom.tabs[WRITING_MODES.QUIZ]) {
          this.dom.tabs[WRITING_MODES.QUIZ].disabled = true;
          this.dom.tabs[WRITING_MODES.QUIZ].classList.add('disabled');
        }
      }
    }

    return allSucceeded;
  }

  /**
   * Mounts a single rice-grid canvas box for a specific character index.
   *
   * @private
   * @param {number} charIndex
   * @param {string} character
   * @returns {Promise<boolean>}
   */
  async mountCanvasBox(charIndex, character) {
    if (this.isDestroyed) return false;

    const boxWrapper = document.createElement('div');
    boxWrapper.className = 'd-flex flex-column align-items-center';

    // Character label above canvas (Omitted in demoOnly / compact view)
    if (!this.demoOnly && this.characters.length > 1) {
      const label = document.createElement('span');
      label.className = 'small fw-bold text-secondary mb-1';
      label.textContent = `#${charIndex + 1}: ${character}`;
      boxWrapper.appendChild(label);
    }

    // Calligraphy Canvas Box with Rice Grid
    const canvasBox = document.createElement('div');
    canvasBox.className = 'writing-rice-grid-box position-relative rounded-2 border shadow-sm';
    canvasBox.style.width = '170px';
    canvasBox.style.height = '170px';
    canvasBox.style.touchAction = 'none';

    // Rice grid SVG background
    const gridSvg = createRiceGridSvg(170);
    canvasBox.appendChild(gridSvg);

    // Target mount div for HanziWriter
    const targetMount = document.createElement('div');
    targetMount.className = 'position-absolute top-0 start-0 w-100 h-100';
    canvasBox.appendChild(targetMount);

    // Individual Floating Replay Button for each character (matching radical modal style)
    let replayBtn = null;
    if (this.demoOnly) {
      replayBtn = document.createElement('button');
      replayBtn.type = 'button';
      replayBtn.className = 'btn btn-sm btn-light position-absolute bottom-0 end-0 m-1 rounded-circle p-1 border shadow-sm';
      replayBtn.setAttribute('aria-label', `Phát lại nét chữ ${character}`);
      replayBtn.title = 'Phát lại';

      const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('width', '16');
      iconSvg.setAttribute('height', '16');
      iconSvg.setAttribute('viewBox', '0 0 24 24');
      iconSvg.setAttribute('fill', 'none');
      iconSvg.setAttribute('stroke', 'currentColor');
      iconSvg.setAttribute('stroke-width', '2');
      iconSvg.setAttribute('stroke-linecap', 'round');
      iconSvg.setAttribute('stroke-linejoin', 'round');
      iconSvg.setAttribute('aria-hidden', 'true');

      const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path1.setAttribute('d', 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8');
      const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('d', 'M3 3v5h5');

      iconSvg.appendChild(path1);
      iconSvg.appendChild(path2);
      replayBtn.appendChild(iconSvg);

      replayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const eng = this.engines.get(charIndex);
        if (eng) eng.replay();
      });

      canvasBox.appendChild(replayBtn);
    }

    boxWrapper.appendChild(canvasBox);

    this.dom.stageArea.appendChild(boxWrapper);

    // Instantiate CharacterWritingEngine
    const engine = new CharacterWritingEngine({
      targetElement: targetMount,
      width: 170,
      height: 170,
      strokeColor: '#1976D2',
      radicalColor: '#C83C23',
      outlineColor: '#D1D5DB',
      onStatusChange: state => {
        if (this.dom.statusText && charIndex === this.activeCharIndex) {
          this.dom.statusText.textContent = `[${character}] ${state.message}`;
        }
      },
      onComplete: result => {
        this.handleCharacterComplete(charIndex, character, result);
      }
    });

    this.engines.set(charIndex, engine);

    const loaded = await engine.load(character, this.currentMode);
    if (!loaded) {
      this.missingStrokesSet.add(character);
      if (replayBtn) replayBtn.classList.add('d-none');
      targetMount.replaceChildren();
      const fallbackMsg = document.createElement('div');
      fallbackMsg.className = 'd-flex flex-column align-items-center justify-content-center h-100 text-center p-2';
      const charSpan = document.createElement('span');
      charSpan.className = 'fs-2 fw-bold text-dark font-hanzi';
      charSpan.lang = 'zh-Hans';
      charSpan.textContent = character;
      const noteSpan = document.createElement('span');
      noteSpan.className = 'small text-muted mt-1';
      noteSpan.textContent = `Chữ "${character}" hiện chưa có dữ liệu nét chi tiết.`;
      fallbackMsg.appendChild(charSpan);
      fallbackMsg.appendChild(noteSpan);
      targetMount.appendChild(fallbackMsg);
      return false;
    }

    return true;
  }

  /**
   * Handles character completion from child engine.
   *
   * @private
   * @param {number} charIndex
   * @param {string} character
   * @param {Object} result
   */
  handleCharacterComplete(charIndex, character, result) {
    if (this.isDestroyed) return;

    const stats = this.charStats.get(charIndex) || { completed: false, mistakes: 0 };
    stats.completed = true;
    stats.mistakes = result?.totalMistakes || 0;
    this.charStats.set(charIndex, stats);

    if (this.dom.statusText) {
      this.dom.statusText.textContent = `✓ Đã hoàn thành chữ "${character}"! (Lỗi: ${stats.mistakes})`;
      this.dom.statusText.classList.add('text-success');
    }

    if (this.onCharacterComplete) {
      this.onCharacterComplete({
        character,
        charIndex,
        mistakes: stats.mistakes
      });
    }

    // Check if entire word is completed
    const allCompleted = Array.from(this.charStats.values()).every(s => s.completed);
    if (allCompleted) {
      const totalMistakes = Array.from(this.charStats.values()).reduce((sum, s) => sum + s.mistakes, 0);
      if (this.dom.statusText) {
        this.dom.statusText.textContent = `🎉 Xuất sắc! Đã hoàn thành toàn bộ từ "${this.wordData.hanzi}" (Tổng lỗi: ${totalMistakes}).`;
      }
      if (this.onWordComplete) {
        this.onWordComplete({
          word: this.wordData.hanzi,
          totalMistakes,
          charStats: Array.from(this.charStats.values())
        });
      }
    } else if (!this.isDualSideBySideMode() && charIndex < this.characters.length - 1) {
      // In Stepper mode, gently prompt next character
      setTimeout(() => {
        if (!this.isDestroyed && !allCompleted) {
          this.selectCharacter(charIndex + 1);
        }
      }, 700);
    }
  }

  /**
   * Switches interactive writing mode ('demo', 'practice', 'quiz').
   *
   * @param {string} newMode
   */
  async switchMode(newMode) {
    if (this.isDestroyed) return;
    if (!Object.values(WRITING_MODES).includes(newMode)) return;

    this.currentMode = newMode;
    this.updateActiveTabStyling(newMode);

    // Reset completion states for fresh attempt in new mode
    this.characters.forEach((char, idx) => {
      const s = this.charStats.get(idx);
      if (s) {
        s.completed = false;
        s.mistakes = 0;
      }
    });

    if (this.dom.statusText) {
      this.dom.statusText.classList.remove('text-success');
      this.dom.statusText.textContent = newMode === WRITING_MODES.DEMO
        ? 'Trình chiếu thứ tự nét...'
        : newMode === WRITING_MODES.PRACTICE
          ? 'Tô theo nét hướng dẫn mờ...'
          : 'Tự nhớ và viết vào ô trống...';
    }

    // Update child engines
    const promises = Array.from(this.engines.values()).map(eng => eng.setMode(newMode));
    await Promise.all(promises);
  }

  /**
   * Selects an active character in Stepper mode.
   *
   * @param {number} index
   */
  async selectCharacter(index) {
    if (this.isDestroyed || index < 0 || index >= this.characters.length) return;
    if (this.activeCharIndex === index && this.engines.has(index)) return;

    this.activeCharIndex = index;
    this.updateStepperButtons();
    return this.initializeEnginesForActiveView();
  }

  /**
   * Replays active engine(s).
   */
  replayActive() {
    if (this.isDestroyed) return;
    if (this.isDualSideBySideMode()) {
      this.engines.forEach(eng => eng.replay());
    } else {
      const eng = this.engines.get(this.activeCharIndex);
      if (eng) eng.replay();
    }
  }

  /**
   * Updates tab styling and ARIA states.
   *
   * @private
   * @param {string} mode
   */
  updateActiveTabStyling(mode) {
    Object.entries(this.dom.tabs || {}).forEach(([m, btn]) => {
      const isActive = m === mode;
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      if (isActive) {
        btn.classList.add('bg-white', 'text-primary', 'shadow-sm');
        btn.classList.remove('text-secondary');
      } else {
        btn.classList.remove('bg-white', 'text-primary', 'shadow-sm');
        btn.classList.add('text-secondary');
      }
    });
  }

  /**
   * Updates stepper button active states and checkmark icons.
   *
   * @private
   */
  updateStepperButtons() {
    (this.dom.stepperButtons || []).forEach((btn, idx) => {
      const isActive = idx === this.activeCharIndex;
      const stat = this.charStats.get(idx);
      const isCompleted = stat && stat.completed;

      btn.className = `btn btn-sm ${isActive ? 'btn-chinese-primary' : isCompleted ? 'btn-outline-success' : 'btn-outline-secondary'} py-1 px-3 rounded-pill fw-semibold`;
      btn.textContent = `${isCompleted ? '✓ ' : ''}Chữ ${idx + 1}: ${this.characters[idx]}`;
    });
  }

  /**
   * Fallback rendering when no valid Hanzi glyphs were found.
   *
   * @private
   */
  renderEmptyFallback() {
    this.mountElement.replaceChildren();
    const box = document.createElement('div');
    box.className = 'p-4 text-center text-muted bg-surface rounded-3 border';
    box.textContent = 'Từ vựng này không chứa ký tự Hán hợp lệ để luyện viết.';
    this.mountElement.appendChild(box);
  }

  /**
   * Destroys child engines and clears state.
   *
   * @private
   */
  destroyEngines() {
    this.engines.forEach(eng => {
      try {
        eng.destroy();
      } catch (e) {
        // Safe dismissal
      }
    });
    this.engines.clear();
  }

  /**
   * Completely destroys the orchestrator session, releasing DOM nodes and references.
   */
  destroy() {
    this.isDestroyed = true;
    this.destroyEngines();
    if (this.mountElement) {
      this.mountElement.replaceChildren();
    }
    if (this.missingStrokesSet) {
      this.missingStrokesSet.clear();
    }
    if (this.charStats) {
      this.charStats.clear();
    }
    this.dom = {};
  }
}
