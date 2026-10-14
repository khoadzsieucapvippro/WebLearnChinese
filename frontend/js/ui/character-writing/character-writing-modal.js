/**
 * =============================================================================
 * CHARACTER WRITING MODAL COMPONENT
 * UI adapter providing 3-tab interactive Chinese calligraphy practice:
 * - [Cách viết]   - Trình chiếu thứ tự từng nét
 * - [Luyện nét]   - Tập tô theo khung nét chỉ dẫn
 * - [Luyện viết]  - Tự nhớ và viết trong ô kẻ chữ Mễ (米)
 *
 * Implements W3C WCAG 2.2 Level AA accessibility & zero dangerous sinks.
 * =============================================================================
 */

import { CharacterWritingEngine, WRITING_MODES } from './character-writing-engine.js';
import { extractCleanChar } from './stroke-data-loader.js';

export class CharacterWritingModal {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.mountElement - Container inside the modal
   */
  constructor(options = {}) {
    if (!options.mountElement) {
      throw new Error('CharacterWritingModal requires a mountElement DOM container.');
    }

    this.mountElement = options.mountElement;
    this.engine = null;
    this.currentCharacter = '';
    this.currentMode = WRITING_MODES.DEMO;
    this.elements = {};
  }

  /**
   * Builds the DOM structure and mounts the writing interface for a given character.
   *
   * @param {string} character - The Chinese character or radical string (e.g. '水' or '水(氵)')
   * @returns {Promise<boolean>}
   */
  async mount(character) {
    this.destroy();

    const cleanChar = extractCleanChar(character);
    if (!cleanChar) return false;
    this.currentCharacter = cleanChar;

    // 1. Build Shell using DOM APIs (Zero innerHTML sinks)
    this.buildDomStructure();

    // 2. Initialize Engine
    this.engine = new CharacterWritingEngine({
      targetElement: this.elements.canvasArea,
      width: 170,
      height: 170,
      strokeColor: '#1976D2',
      radicalColor: '#C83C23',
      outlineColor: '#D1D5DB',
      onStatusChange: state => {
        if (this.elements.statusText) {
          this.elements.statusText.textContent = state.message;
        }
      },
      onComplete: () => {
        if (this.elements.statusText) {
          this.elements.statusText.classList.add('text-success');
        }
      }
    });

    // 3. Load Character
    const loaded = await this.engine.load(this.currentCharacter, WRITING_MODES.DEMO);
    if (!loaded) {
      this.renderFallback();
      return false;
    }

    this.updateActiveTab(WRITING_MODES.DEMO);
    return true;
  }

  /**
   * Builds the component DOM elements cleanly using standard DOM nodes.
   *
   * @private
   */
  buildDomStructure() {
    this.mountElement.replaceChildren();

    const card = document.createElement('div');
    card.className = 'writing-engine-card p-3 rounded-3 border bg-surface mb-3';

    // Header with title
    const headerRow = document.createElement('div');
    headerRow.className = 'd-flex align-items-center justify-content-between mb-2 flex-wrap gap-2';

    const titleEl = document.createElement('div');
    titleEl.className = 'fw-bold text-dark d-flex align-items-center gap-2 small';
    titleEl.textContent = '✍️ Luyện viết chữ & Thứ tự nét';

    headerRow.appendChild(titleEl);

    // 3 Tabs Toolbar (W3C Tablist)
    const tabList = document.createElement('div');
    tabList.className = 'writing-tabs-toolbar d-flex rounded-2 p-1 bg-light border';
    tabList.setAttribute('role', 'tablist');
    tabList.setAttribute('aria-label', 'Chế độ luyện viết chữ');

    const tabsConfig = [
      { mode: WRITING_MODES.DEMO, label: 'Cách viết', id: 'tabWritingDemo' },
      { mode: WRITING_MODES.PRACTICE, label: 'Luyện nét', id: 'tabWritingPractice' },
      { mode: WRITING_MODES.QUIZ, label: 'Luyện viết', id: 'tabWritingQuiz' }
    ];

    this.elements.tabs = {};

    tabsConfig.forEach(cfg => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = cfg.id;
      btn.className = 'writing-tab-btn btn btn-sm py-1 px-2 border-0 fw-medium';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', cfg.mode === WRITING_MODES.DEMO ? 'true' : 'false');
      btn.textContent = cfg.label;

      btn.addEventListener('click', () => {
        this.switchMode(cfg.mode);
      });

      tabList.appendChild(btn);
      this.elements.tabs[cfg.mode] = btn;
    });

    headerRow.appendChild(tabList);
    card.appendChild(headerRow);

    // Main Interactive Stage (Rice Grid Canvas + Actions)
    const stageContainer = document.createElement('div');
    stageContainer.className = 'writing-stage-container d-flex flex-column align-items-center py-2';

    // Calligraphy Canvas Box with Rice Grid (Mễ tự cách)
    const canvasBox = document.createElement('div');
    canvasBox.className = 'writing-rice-grid-box position-relative rounded-2 border shadow-sm';
    canvasBox.style.width = '170px';
    canvasBox.style.height = '170px';
    canvasBox.style.touchAction = 'none';

    // SVG Background Guidelines (Cross & Diagonals)
    const gridSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    gridSvg.setAttribute('width', '170');
    gridSvg.setAttribute('height', '170');
    gridSvg.setAttribute('class', 'position-absolute top-0 start-0 w-100 h-100 pointer-events-none');
    gridSvg.setAttribute('aria-hidden', 'true');

    // Horizontal center line
    const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hLine.setAttribute('x1', '0'); hLine.setAttribute('y1', '85');
    hLine.setAttribute('x2', '170'); hLine.setAttribute('y2', '85');
    hLine.setAttribute('stroke', '#E5E7EB'); hLine.setAttribute('stroke-dasharray', '4,4');
    gridSvg.appendChild(hLine);

    // Vertical center line
    const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    vLine.setAttribute('x1', '85'); vLine.setAttribute('y1', '0');
    vLine.setAttribute('x2', '85'); vLine.setAttribute('y2', '170');
    vLine.setAttribute('stroke', '#E5E7EB'); vLine.setAttribute('stroke-dasharray', '4,4');
    gridSvg.appendChild(vLine);

    // Diagonals for Rice Grid
    const d1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    d1.setAttribute('x1', '0'); d1.setAttribute('y1', '0');
    d1.setAttribute('x2', '170'); d1.setAttribute('y2', '170');
    d1.setAttribute('stroke', '#F3F4F6'); d1.setAttribute('stroke-dasharray', '4,4');
    gridSvg.appendChild(d1);

    const d2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    d2.setAttribute('x1', '170'); d2.setAttribute('y1', '0');
    d2.setAttribute('x2', '0'); d2.setAttribute('y2', '170');
    d2.setAttribute('stroke', '#F3F4F6'); d2.setAttribute('stroke-dasharray', '4,4');
    gridSvg.appendChild(d2);

    canvasBox.appendChild(gridSvg);

    // Inner Canvas Target Mount
    const canvasArea = document.createElement('div');
    canvasArea.className = 'position-absolute top-0 start-0 w-100 h-100';
    canvasBox.appendChild(canvasArea);
    this.elements.canvasArea = canvasArea;

    // Replay / Restart Floating Button
    const replayBtn = document.createElement('button');
    replayBtn.type = 'button';
    replayBtn.className = 'btn btn-sm btn-light position-absolute bottom-0 end-0 m-1 rounded-circle p-1 border shadow-sm';
    replayBtn.setAttribute('aria-label', 'Phát lại / Thử lại');
    replayBtn.title = 'Phát lại / Bắt đầu lại';

    // Rotate CCW icon
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

    replayBtn.addEventListener('click', () => {
      if (this.engine) this.engine.replay();
    });

    canvasBox.appendChild(replayBtn);
    stageContainer.appendChild(canvasBox);

    // Live Status Text Notification (WCAG live region)
    const statusText = document.createElement('div');
    statusText.className = 'small text-muted mt-2 text-center writing-status-feedback';
    statusText.setAttribute('role', 'status');
    statusText.setAttribute('aria-live', 'polite');
    statusText.textContent = 'Đang tải dữ liệu nét viết...';
    stageContainer.appendChild(statusText);
    this.elements.statusText = statusText;

    card.appendChild(stageContainer);
    this.mountElement.appendChild(card);
  }

  /**
   * Switches the active mode in both UI and engine.
   *
   * @param {string} mode
   */
  async switchMode(mode) {
    if (this.currentMode === mode) {
      if (this.engine) this.engine.replay();
      return;
    }

    this.currentMode = mode;
    this.updateActiveTab(mode);
    if (this.engine) {
      await this.engine.setMode(mode);
    }
  }

  /**
   * Updates active styling and ARIA attributes of tab buttons.
   *
   * @private
   * @param {string} mode
   */
  updateActiveTab(mode) {
    Object.entries(this.elements.tabs || {}).forEach(([m, btn]) => {
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

    if (this.elements.statusText) {
      this.elements.statusText.classList.remove('text-success');
    }
  }

  /**
   * Renders a pedagogical fallback if stroke data is not available.
   *
   * @private
   */
  renderFallback() {
    if (!this.elements.canvasArea) return;

    this.elements.canvasArea.replaceChildren();
    const fallbackBox = document.createElement('div');
    fallbackBox.className = 'd-flex flex-column align-items-center justify-content-center h-100 text-center p-2';

    const charEl = document.createElement('span');
    charEl.className = 'fs-1 fw-bold text-dark';
    charEl.textContent = this.currentCharacter;

    const notice = document.createElement('span');
    notice.className = 'small text-muted mt-1';
    notice.textContent = 'Dữ liệu nét đang cập nhật';

    fallbackBox.appendChild(charEl);
    fallbackBox.appendChild(notice);
    this.elements.canvasArea.appendChild(fallbackBox);

    if (this.elements.statusText) {
      this.elements.statusText.textContent = `Chữ "${this.currentCharacter}" hiện chưa có dữ liệu nét chi tiết.`;
    }
  }

  /**
   * Destroys active session, cleans up engine, timers, and DOM nodes.
   */
  destroy() {
    if (this.engine) {
      this.engine.destroy();
      this.engine = null;
    }
    this.mountElement.replaceChildren();
    this.elements = {};
  }
}
