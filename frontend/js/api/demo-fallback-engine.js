/**
 * =============================================================================
 * SMART CLOUD FALLBACK ENGINE (ZERO-BACKEND RUNTIME FOR GITHUB PAGES DEMO)
 * Module: frontend/js/api/demo-fallback-engine.js
 * 
 * Architectural Invariants:
 * 1. Zero Broken Links: Provides client-side in-memory + localStorage persistence
 *    for all frontend REST endpoints when running on GitHub Pages (*.github.io)
 *    or when the cloud backend is unavailable/cold-starting.
 * 2. Standard RBAC Accounts: Pre-configures 4 authoritative test accounts:
 *    - Learner: learner@gmail.com / learner@elearning.local (Password: Password@123 / Password123!)
 *    - Creator: creator@gmail.com / creator@elearning.local (Password: Password@123 / Password123!)
 *    - Moderator: moderator@gmail.com / moderator@elearning.local (Password: Password@123 / Password123!)
 *    - Admin: admin@gmail.com / admin@elearning.local (Password: Password@123 / Password123!)
 * 3. Authoritative Datasets:
 *    - 214 Kangxi radicals (with 50 common radicals rank 1..50, pinyin, hanViet, meaningVi, strokeCount).
 *    - 499 HSK 1-3 vocabulary records with search and pagination.
 *    - Structured multi-status lessons (Approved, Pending, Draft).
 *    - Full SM-2 spaced repetition engine (/srs/stats, /srs/settings, /srs/due, /srs/review).
 *    - Contextual personal notes (/vocabularies/{id}/notes, /notes/{id}).
 *    - Creator studio, Moderator queue, and Admin account/role management.
 * 4. LocalStorage State Persistence: All mutations are written to 'ELEARNING_DEMO_DATA'
 *    so user actions persist reliably across multi-page navigation on GitHub Pages.
 * 5. Envelope Integrity: Emits standard Spring Boot ApiResponse format (code: 'SUCCESS', data: ...).
 * =============================================================================
 */

import {
  SEED_RADICALS,
  SEED_VOCABULARY,
  SEED_LESSONS,
  SEED_ACCOUNTS,
  SEED_SRS_SETTINGS,
  SEED_SRS_CARDS,
  CHAR_TO_RADICAL_MAP,
  CHAR_TO_RADICALS_MAP
} from './demo-seed-data.js';

import { authManager } from '../auth/auth-state.js';
import { ApiError } from './api.js';

const STORAGE_KEY = 'ELEARNING_DEMO_DATA';
const CURRENT_DATASET_VERSION = 13;

/**
 * Encodes string or object into Base64URL string compliant with JWT standards.
 * Supports both modern browser environments and Node.js runtime.
 */
function base64UrlEncode(data) {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  let base64 = '';
  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(jsonStr, 'utf8').toString('base64');
  } else if (typeof btoa === 'function') {
    base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  } else {
    base64 = String(jsonStr);
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Creates a compliant 3-part JWT string (header.payload.signature).
 * Payload contains sub, email, roles, auth_ver: 1, iat, and exp (+86400s).
 */
export function generateDemoJwt(account) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(account.accountId),
    email: account.email,
    emailOrPhone: account.email,
    fullName: account.fullName,
    roles: Array.isArray(account.roles) ? [...account.roles] : ['Learner'],
    auth_ver: 1,
    iat: now,
    exp: now + 86400,
    iss: 'elearning-backend'
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const signature = base64UrlEncode(`sig_${account.accountId}_${now}`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

class DemoFallbackEngine {
  constructor() {
    this._data = null;
  }

  /**
   * Clears the in-memory cache to force a clean re-read from storage.
   */
  resetInMemoryData() {
    this._data = null;
  }

  /**
   * Loads or initializes demo database from localStorage.
   */
  getData() {
    if (this._data) {
      return this._data;
    }

    let saved = null;
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          saved = JSON.parse(raw);
        }
      }
    } catch (_) {}

    if (saved && saved.schemaVersion === CURRENT_DATASET_VERSION && Array.isArray(saved.radicals) && saved.radicals.length === 214) {
      this._data = saved;
    } else {
      const rawCards = (saved && saved.schemaVersion >= 10 && Array.isArray(saved.srsCards)) ? saved.srsCards : JSON.parse(JSON.stringify(SEED_SRS_CARDS));
      const preservedCards = rawCards.map(c => (!c.cardType || c.cardType === 'READING') ? { ...c, cardType: 'FLASHCARD' } : c);
      const preservedReviews = (saved && Array.isArray(saved.srsReviews)) ? saved.srsReviews : [];
      const preservedNotes = (saved && Array.isArray(saved.notes)) ? saved.notes : [
        {
          noteId: 1,
          vocabId: 1,
          content: 'Bộ thủ chữ Ái (爱): móng vuốt (爫) ở trên, khăn trùm (冖), ở giữa là con tim (心) và dưới cùng là bước chân chậm (夂).',
          createdAt: '2026-08-01T10:00:00Z',
          updatedAt: '2026-08-01T10:00:00Z'
        }
      ];
      this._data = {
        schemaVersion: CURRENT_DATASET_VERSION,
        accounts: (() => {
          const defaultAccounts = JSON.parse(JSON.stringify(SEED_ACCOUNTS));
          if (saved && Array.isArray(saved.accounts) && saved.accounts.length > 0) {
            const seedEmails = new Set(defaultAccounts.map(a => (a.email || '').toLowerCase()));
            const seedIds = new Set(defaultAccounts.map(a => a.accountId));
            const updatedSeeds = defaultAccounts.map(sa => {
              const match = saved.accounts.find(a => a.accountId === sa.accountId || (a.email && a.email.toLowerCase() === sa.email.toLowerCase()));
              return match ? { ...sa, ...match } : sa;
            });
            const customAccounts = saved.accounts.filter(a => !seedIds.has(a.accountId) && !seedEmails.has((a.email || '').toLowerCase()));
            return [...updatedSeeds, ...customAccounts];
          }
          return defaultAccounts;
        })(),
        radicals: JSON.parse(JSON.stringify(SEED_RADICALS)),
        vocabulary: JSON.parse(JSON.stringify(SEED_VOCABULARY)),
        lessons: JSON.parse(JSON.stringify(SEED_LESSONS)),
        srsSettings: (saved && saved.srsSettings) ? { ...SEED_SRS_SETTINGS, ...saved.srsSettings } : { ...SEED_SRS_SETTINGS },
        srsCards: preservedCards,
        srsReviews: preservedReviews,
        notes: preservedNotes,
        moderationHistory: [
          {
            historyId: 1,
            lessonId: 1,
            lessonTitle: 'Bài 1: Chào hỏi & Làm quen',
            decision: 'Approved',
            moderatorName: 'Kiểm Duyệt Viên',
            moderatorEmail: 'moderator@gmail.com',
            reviewedAt: '2026-08-02T10:30:00Z',
            note: 'Bài học biên soạn chuẩn xác, từ vựng chuẩn HSK 3.0.'
          }
        ]
      };
      this.saveData();
    }

    return this._data;
  }

  /**
   * Persists current in-memory demo database to localStorage.
   */
  saveData() {
    if (!this._data) return;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
      }
    } catch (_) {}
  }

  /**
   * Resolves the current active account.
   */
  getCurrentAccount() {
    const data = this.getData();
    const user = authManager.getUser();
    if (user && user.accountId) {
      const match = data.accounts.find(a => a.accountId === user.accountId);
      if (match) return match;
      return {
        accountId: user.accountId,
        email: user.emailOrPhone || '',
        fullName: user.fullName || 'Học Viên',
        roles: Array.isArray(user.roles) ? [...user.roles] : ['Learner']
      };
    }
    // Fallback: return default Learner account
    return data.accounts[0];
  }

  /**
   * Single Dispatcher Gateway for client-side API requests.
   *
   * @param {string} endpoint e.g. '/lessons' or 'auth/login'
   * @param {object} [options={}] Request options
   * @returns {Promise<any>} Unpacked response payload
   */
  async handleRequest(endpoint, options = {}) {
    if (typeof window !== 'undefined' && window.__ENV__?.API_BASE_URL && !options?.forceDemo) {
      console.warn(`[DemoFallbackEngine] Warning: Real API_BASE_URL is configured (${window.__ENV__.API_BASE_URL}). Fallback request intercepted for endpoint: ${endpoint}`);
    }

    const data = this.getData();
    const method = (options.method || 'GET').toUpperCase();
    
    // Normalize endpoint path (strip query params and base path prefixes)
    let cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let pathParams = {};
    if (cleanPath.includes('?')) {
      const parts = cleanPath.split('?');
      cleanPath = parts[0];
      const searchParams = new URLSearchParams(parts[1]);
      for (const [k, v] of searchParams.entries()) {
        pathParams[k] = v;
      }
    }
    if (cleanPath.startsWith('/api/v1')) {
      cleanPath = cleanPath.substring('/api/v1'.length);
    }

    const query = { ...pathParams, ...(options.params || {}) };
    let body = options.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (_) {}
    }

    // -------------------------------------------------------------------------
    // 1. AUTHENTICATION & PROFILE
    // -------------------------------------------------------------------------
    if (cleanPath === '/auth/login' && method === 'POST') {
      const emailOrPhone = String(body?.emailOrPhone || '').trim().toLowerCase();
      const password = String(body?.password || '');

      let account = data.accounts.find(a => 
        a.email.toLowerCase() === emailOrPhone ||
        (Array.isArray(a.aliases) && a.aliases.some(alias => alias.toLowerCase() === emailOrPhone)) ||
        (emailOrPhone.includes('admin') && a.roles.includes('Admin')) ||
        (emailOrPhone.includes('creator') && a.roles.includes('Creator')) ||
        (emailOrPhone.includes('moderator') && a.roles.includes('Moderator')) ||
        (emailOrPhone.includes('learner') && a.roles.includes('Learner'))
      );

      // On Demo: if password is not 'wrong', allow creating on-the-fly demo accounts for any valid credentials
      if (!account && password !== 'wrong' && (password === 'Password@123' || password === 'Password123!' || password.length >= 6)) {
        let assignedRoles = ['Learner'];
        let roleName = 'Học Viên Demo';
        if (emailOrPhone.includes('admin')) {
          assignedRoles = ['Admin', 'Learner'];
          roleName = 'Quản Trị Viên Demo';
        } else if (emailOrPhone.includes('creator')) {
          assignedRoles = ['Creator', 'Learner'];
          roleName = 'Biên Soạn Demo';
        } else if (emailOrPhone.includes('moderator')) {
          assignedRoles = ['Moderator', 'Learner'];
          roleName = 'Kiểm Duyệt Demo';
        }

        account = {
          accountId: data.accounts.length + 1,
          email: emailOrPhone,
          aliases: [],
          fullName: roleName,
          roles: assignedRoles,
          password: password,
          status: 'Active',
          createdAt: new Date().toISOString()
        };
        data.accounts.push(account);
        this.saveData();
      }

      // Password acceptance: standard 'Password@123', 'Password123!', account match, or password length >= 6
      const isPasswordValid = password !== 'wrong' && (
        password === 'Password@123' ||
        password === 'Password123!' ||
        (account && account.password === password) ||
        (account && password.length >= 6)
      );

      if (!account || !isPasswordValid) {
        throw new ApiError(
          'Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại email/số điện thoại hoặc mật khẩu.',
          401,
          'UNAUTHORIZED'
        );
      }

      const token = generateDemoJwt(account);

      return {
        token: token,
        accessToken: token,
        type: 'Bearer',
        tokenType: 'Bearer',
        accountId: account.accountId,
        emailOrPhone: account.email,
        fullName: account.fullName,
        roles: [...account.roles]
      };
    }

    if (cleanPath === '/auth/register' && method === 'POST') {
      const email = String(body?.email || body?.emailOrPhone || '').trim();
      const fullName = String(body?.fullName || 'Học Viên Mới').trim();

      const newAccount = {
        accountId: data.accounts.length + 1,
        email: email || `user_${Date.now()}@gmail.com`,
        aliases: [],
        fullName: fullName || 'Học Viên Mới',
        roles: ['Learner'],
        password: body?.password || 'Password@123',
        status: 'Active',
        createdAt: new Date().toISOString(),
        avatarUrl: null
      };

      data.accounts.push(newAccount);
      this.saveData();

      const token = generateDemoJwt(newAccount);

      return {
        token: token,
        accessToken: token,
        type: 'Bearer',
        tokenType: 'Bearer',
        accountId: newAccount.accountId,
        emailOrPhone: newAccount.email,
        fullName: newAccount.fullName,
        roles: ['Learner']
      };
    }

    if (cleanPath === '/auth/logout' && method === 'POST') {
      return null;
    }

    if (cleanPath === '/auth/change-password' && method === 'POST') {
      const account = this.getCurrentAccount();
      const newPassword = String(body?.newPassword || '').trim();
      if (account && newPassword.length >= 6) {
        account.password = newPassword;
        this.saveData();
      }
      return null;
    }

    if ((cleanPath === '/users/profile' || cleanPath === '/auth/me') && method === 'GET') {
      const account = this.getCurrentAccount();
      return {
        userId: account.accountId,
        accountId: account.accountId,
        email: account.email,
        emailOrPhone: account.email,
        fullName: account.fullName,
        roles: [...account.roles],
        status: account.status || 'Active',
        createdAt: account.createdAt || '2026-01-01T08:00:00Z',
        avatarUrl: account.avatarUrl || null
      };
    }

    if (cleanPath === '/users/profile' && method === 'PUT') {
      const account = this.getCurrentAccount();
      if (body?.fullName) {
        account.fullName = String(body.fullName).trim();
      }
      if (body?.avatarUrl !== undefined) {
        account.avatarUrl = body.avatarUrl ? String(body.avatarUrl).trim() : null;
      }
      this.saveData();

      return {
        userId: account.accountId,
        accountId: account.accountId,
        email: account.email,
        emailOrPhone: account.email,
        fullName: account.fullName,
        roles: [...account.roles],
        status: account.status || 'Active',
        createdAt: account.createdAt || '2026-01-01T08:00:00Z',
        avatarUrl: account.avatarUrl || null
      };
    }

    // -------------------------------------------------------------------------
    // 2. KANGXI RADICALS
    // -------------------------------------------------------------------------
    if (cleanPath === '/radicals' && method === 'GET') {
      const page = parseInt(query.page || 0, 10);
      const size = parseInt(query.size || 20, 10);
      const search = (query.search || '').trim().toLowerCase();

      let items = [...data.radicals];
      if (search) {
        items = items.filter(r => 
          (r.character && r.character.includes(search)) ||
          (r.pinyin && r.pinyin.toLowerCase().includes(search)) ||
          (r.meaningHanViet && r.meaningHanViet.toLowerCase().includes(search)) ||
          (r.meaningVi && r.meaningVi.toLowerCase().includes(search))
        );
      }

      const totalElements = items.length;
      const totalPages = Math.ceil(totalElements / size) || 1;
      const start = page * size;
      const paged = items.slice(start, start + size);

      return {
        items: paged,
        page,
        size,
        totalElements,
        totalPages,
        last: page >= totalPages - 1
      };
    }

    const radicalDetailMatch = cleanPath.match(/^\/radicals\/(\d+)$/);
    if (radicalDetailMatch && method === 'GET') {
      const id = parseInt(radicalDetailMatch[1], 10);
      const rad = data.radicals.find(r => r.radicalId === id);
      if (!rad) {
        throw new ApiError(`Không tìm thấy bộ thủ với ID ${id}`, 404, 'NOT_FOUND');
      }
      return rad;
    }

    if (cleanPath === '/admin/radicals' && method === 'POST') {
      const newRad = {
        radicalId: data.radicals.length + 1,
        character: body.character || '',
        pinyin: body.pinyin || '',
        meaningHanViet: body.meaningHanViet || '',
        meaningVi: body.meaningVi || '',
        commonRank: body.commonRank ? parseInt(body.commonRank, 10) : null,
        explanationVi: body.explanationVi || null,
        videoLessonUrl: body.videoLessonUrl || null,
        strokeCount: body.strokeCount ? parseInt(body.strokeCount, 10) : null
      };
      data.radicals.push(newRad);
      this.saveData();
      return newRad;
    }

    const adminRadicalMatch = cleanPath.match(/^\/admin\/radicals\/(\d+)$/);
    if (adminRadicalMatch) {
      const id = parseInt(adminRadicalMatch[1], 10);
      const index = data.radicals.findIndex(r => r.radicalId === id);
      if (method === 'PUT') {
        if (index >= 0) {
          data.radicals[index] = { ...data.radicals[index], ...body };
          this.saveData();
          return data.radicals[index];
        }
        throw new ApiError(`Không tìm thấy bộ thủ ${id}`, 404, 'NOT_FOUND');
      }
      if (method === 'DELETE') {
        if (index >= 0) {
          data.radicals.splice(index, 1);
          this.saveData();
        }
        return null;
      }
    }

    // -------------------------------------------------------------------------
    // 3. VOCABULARY
    // -------------------------------------------------------------------------
    if ((cleanPath === '/vocabulary' || cleanPath === '/vocabularies') && method === 'GET') {
      const page = parseInt(query.page || 0, 10);
      const size = parseInt(query.size || 20, 10);
      const search = (query.search || '').trim().toLowerCase();
      const rawLevel = query.hsk !== undefined ? query.hsk : query.hskLevel;
      const level = rawLevel !== undefined && rawLevel !== null && rawLevel !== '' ? parseInt(rawLevel, 10) : null;

      let items = [...data.vocabulary];
      if (level !== null && !isNaN(level)) {
        items = items.filter(v => v.hskLevel === level);
      }
      if (search) {
        items = items.filter(v =>
          (v.hanzi && v.hanzi.includes(search)) ||
          (v.pinyin && v.pinyin.toLowerCase().includes(search)) ||
          (v.pinyinRaw && v.pinyinRaw.toLowerCase().includes(search)) ||
          (v.meaningHanViet && v.meaningHanViet.toLowerCase().includes(search)) ||
          (v.meaningVi && v.meaningVi.toLowerCase().includes(search))
        );
      }

      const totalElements = items.length;
      const totalPages = Math.ceil(totalElements / size) || 1;
      const start = page * size;
      const paged = items.slice(start, start + size);

      return {
        items: paged,
        page,
        size,
        totalElements,
        totalPages,
        last: page >= totalPages - 1
      };
    }

    const vocabDetailMatch = cleanPath.match(/^\/(?:vocabulary|vocabularies)\/(\d+)$/);
    if (vocabDetailMatch && method === 'GET') {
      const id = parseInt(vocabDetailMatch[1], 10);
      const v = data.vocabulary.find(item => item.vocabId === id);
      if (!v) {
        throw new ApiError(`Không tìm thấy từ vựng ${id}`, 404, 'NOT_FOUND');
      }

      // Automatically map constituent radicals accurately based on canonical Kangxi Radicals
      let constituentRadicals = [];
      const seenRadicalKeys = new Set();

      if (Array.isArray(v.radicalIds) && v.radicalIds.length > 0) {
        // If explicitly assigned (e.g. via Admin API or audited seed dataset)
        const charRadicalUsed = new Set();
        for (const rid of v.radicalIds) {
          const numId = Number(rid);
          if (numId > 0) {
            const rad = data.radicals.find(r => r.radicalId === numId);
            if (rad) {
              let matchedChar = '';
              if (v.hanzi) {
                for (const ch of v.hanzi) {
                  const chRads = (typeof CHAR_TO_RADICALS_MAP !== 'undefined' && CHAR_TO_RADICALS_MAP[ch]) || (CHAR_TO_RADICAL_MAP && CHAR_TO_RADICAL_MAP[ch] ? [CHAR_TO_RADICAL_MAP[ch]] : []);
                  const pairKey = `${numId}_${ch}`;
                  if (chRads.includes(numId) && !charRadicalUsed.has(pairKey)) {
                    matchedChar = ch;
                    charRadicalUsed.add(pairKey);
                    break;
                  }
                }
                if (!matchedChar && v.hanzi.length === 1) matchedChar = v.hanzi;
              }
              const dedupeKey = `${numId}_${matchedChar}`;
              if (!seenRadicalKeys.has(dedupeKey)) {
                seenRadicalKeys.add(dedupeKey);
                const isKangxi = (typeof CHAR_TO_RADICAL_MAP !== 'undefined' && CHAR_TO_RADICAL_MAP[matchedChar] === numId);
                constituentRadicals.push({
                  ...rad,
                  hanziChar: matchedChar,
                  componentType: isKangxi ? 'kangxi_radical' : 'structural_component',
                  verificationStatus: 'verified'
                });
              }
            }
          }
        }
      } else if (v.hanzi && typeof v.hanzi === 'string') {
        // Derive strictly from Chinese characters in word via authoritative CHAR_TO_RADICALS_MAP
        for (const char of v.hanzi) {
          const radIds = (typeof CHAR_TO_RADICALS_MAP !== 'undefined' && CHAR_TO_RADICALS_MAP[char]) || (CHAR_TO_RADICAL_MAP && CHAR_TO_RADICAL_MAP[char] ? [CHAR_TO_RADICAL_MAP[char]] : []);
          for (const radId of radIds) {
            const numId = Number(radId);
            const dedupeKey = `${numId}_${char}`;
            if (numId > 0 && !seenRadicalKeys.has(dedupeKey)) {
              seenRadicalKeys.add(dedupeKey);
              const rad = data.radicals.find(r => r.radicalId === numId);
              if (rad) {
                const isKangxi = (typeof CHAR_TO_RADICAL_MAP !== 'undefined' && CHAR_TO_RADICAL_MAP[char] === numId);
                constituentRadicals.push({
                  ...rad,
                  hanziChar: char,
                  componentType: isKangxi ? 'kangxi_radical' : 'structural_component',
                  verificationStatus: 'verified'
                });
              }
            }
          }
        }
      }

      return {
        ...v,
        radicals: constituentRadicals
      };
    }

    if ((cleanPath === '/admin/vocabulary' || cleanPath === '/admin/vocabularies') && method === 'POST') {
      const newVocab = {
        vocabId: data.vocabulary.length + 1,
        hanzi: body.hanzi || '',
        pinyin: body.pinyin || '',
        pinyinRaw: body.pinyinRaw || '',
        meaningHanViet: body.meaningHanViet || '',
        meaningVi: body.meaningVi || '',
        hskLevel: body.hskLevel ? parseInt(body.hskLevel, 10) : 1,
        hskStandard: body.hskStandard || 'HSK 3.0',
        exampleSentence: body.exampleSentence || '',
        exampleTranslation: body.exampleTranslation || '',
        audioUrl: body.audioUrl || null,
        videoWritingUrl: body.videoWritingUrl || null,
        radicalIds: Array.isArray(body.radicalIds) ? body.radicalIds.map(Number).filter(n => n > 0) : undefined
      };
      data.vocabulary.push(newVocab);
      this.saveData();
      return newVocab;
    }

    const adminVocabMatch = cleanPath.match(/^\/admin\/(?:vocabulary|vocabularies)\/(\d+)$/);
    if (adminVocabMatch) {
      const id = parseInt(adminVocabMatch[1], 10);
      const index = data.vocabulary.findIndex(v => v.vocabId === id);
      if (method === 'PUT') {
        if (index >= 0) {
          data.vocabulary[index] = { ...data.vocabulary[index], ...body };
          if (Array.isArray(body.radicalIds)) {
            data.vocabulary[index].radicalIds = body.radicalIds.map(Number).filter(n => n > 0);
          }
          this.saveData();
          return data.vocabulary[index];
        }
        throw new ApiError(`Không tìm thấy từ vựng ${id}`, 404, 'NOT_FOUND');
      }
      if (method === 'DELETE') {
        if (index >= 0) {
          data.vocabulary.splice(index, 1);
          this.saveData();
        }
        return null;
      }
    }

    // -------------------------------------------------------------------------
    // 4. LESSONS
    // -------------------------------------------------------------------------
    if (cleanPath === '/lessons' && method === 'GET') {
      const page = parseInt(query.page || 0, 10);
      const size = parseInt(query.size || 20, 10);

      const items = data.lessons.filter(l => l.status === 'Approved');
      const totalElements = items.length;
      const totalPages = Math.ceil(totalElements / size) || 1;
      const start = page * size;
      const paged = items.slice(start, start + size);

      return {
        items: paged,
        page,
        size,
        totalElements,
        totalPages,
        last: page >= totalPages - 1
      };
    }

    const lessonDetailMatch = cleanPath.match(/^\/lessons\/(\d+)$/);
    if (lessonDetailMatch && method === 'GET') {
      const id = parseInt(lessonDetailMatch[1], 10);
      const lesson = data.lessons.find(l => l.lessonId === id);
      if (!lesson) {
        throw new ApiError(`Không tìm thấy bài học ${id}`, 404, 'NOT_FOUND');
      }
      return lesson;
    }

    if (cleanPath === '/creator/lessons' && method === 'GET') {
      const page = parseInt(query.page || 0, 10);
      const size = parseInt(query.size || 20, 10);
      const status = query.status;

      let items = [...data.lessons];
      if (status) {
        items = items.filter(l => l.status.toLowerCase() === status.toLowerCase());
      }

      const totalElements = items.length;
      const totalPages = Math.ceil(totalElements / size) || 1;
      const start = page * size;
      const paged = items.slice(start, start + size);

      return {
        items: paged,
        page,
        size,
        totalElements,
        totalPages,
        last: page >= totalPages - 1
      };
    }

    if (cleanPath === '/creator/lessons' && method === 'POST') {
      if (Array.isArray(body?.vocabularyIds) && body.vocabularyIds.length > 20) {
        throw new ApiError('Bài học không được vượt quá 20 từ vựng theo quy chuẩn giáo trình', 400, 'BAD_REQUEST');
      }
      const newLesson = {
        lessonId: data.lessons.length + 101,
        title: body.title || 'Bài học mới',
        description: body.description || '',
        level: body.level ? parseInt(body.level, 10) : 1,
        status: 'Draft',
        orderIndex: data.lessons.length + 1,
        vocabularyCount: 0,
        creatorName: 'Tác Giả Khóa Học',
        creatorEmail: 'creator@gmail.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        vocabularies: []
      };
      data.lessons.push(newLesson);
      this.saveData();
      return newLesson;
    }

    const creatorLessonDetailMatch = cleanPath.match(/^\/creator\/lessons\/(\d+)$/);
    if (creatorLessonDetailMatch) {
      const id = parseInt(creatorLessonDetailMatch[1], 10);
      const lesson = data.lessons.find(l => l.lessonId === id);
      if (method === 'GET') {
        if (!lesson) throw new ApiError(`Không tìm thấy bài học ${id}`, 404, 'NOT_FOUND');
        return lesson;
      }
      if (method === 'PUT') {
        if (!lesson) throw new ApiError(`Không tìm thấy bài học ${id}`, 404, 'NOT_FOUND');
        if (body.title) lesson.title = body.title;
        if (body.description) lesson.description = body.description;
        if (body.level) lesson.level = parseInt(body.level, 10);
        lesson.updatedAt = new Date().toISOString();
        this.saveData();
        return lesson;
      }
      if (method === 'DELETE') {
        if (!lesson) throw new ApiError('Không tìm thấy bài học ' + id, 404, 'NOT_FOUND');
        if (lesson.status !== 'Draft' && lesson.status !== 'Rejected') {
          throw new ApiError('Chỉ có thể xóa bài học ở trạng thái bản nháp hoặc bị từ chối', 400, 'BAD_REQUEST');
        }
        const idx = data.lessons.findIndex(l => l.lessonId === id);
        if (idx >= 0) {
          data.lessons.splice(idx, 1);
          this.saveData();
        }
        return null;
      }
    }

    const creatorSubmitMatch = cleanPath.match(/^\/creator\/lessons\/(\d+)\/submit$/);
    if (creatorSubmitMatch && method === 'POST') {
      const id = parseInt(creatorSubmitMatch[1], 10);
      const lesson = data.lessons.find(l => l.lessonId === id);
      if (lesson) {
        lesson.status = 'Pending';
        lesson.updatedAt = new Date().toISOString();
        this.saveData();
        return lesson;
      }
      throw new ApiError(`Không tìm thấy bài học ${id}`, 404, 'NOT_FOUND');
    }

    const creatorVocabMatch = cleanPath.match(/^\/creator\/lessons\/(\d+)\/vocabularies\/(\d+)$/);
    if (creatorVocabMatch) {
      const lessonId = parseInt(creatorVocabMatch[1], 10);
      const vocabId = parseInt(creatorVocabMatch[2], 10);
      const lesson = data.lessons.find(l => l.lessonId === lessonId);
      if (!lesson) throw new ApiError(`Không tìm thấy bài học ${lessonId}`, 404, 'NOT_FOUND');

      if (method === 'POST') {
        if (lesson.vocabularies.length >= 20) {
          throw new ApiError('Bài học đã đạt giới hạn tối đa 20 từ vựng theo quy chuẩn giáo trình', 400, 'BAD_REQUEST');
        }
        const vocabItem = data.vocabulary.find(v => v.vocabId === vocabId);
        if (vocabItem && !lesson.vocabularies.some(v => v.vocabId === vocabId)) {
          lesson.vocabularies.push({
            ...vocabItem,
            orderIndex: lesson.vocabularies.length + 1
          });
          lesson.vocabularyCount = lesson.vocabularies.length;
          lesson.updatedAt = new Date().toISOString();
          this.saveData();
        }
        return lesson;
      }
      if (method === 'DELETE') {
        lesson.vocabularies = lesson.vocabularies.filter(v => v.vocabId !== vocabId);
        lesson.vocabularies.forEach((v, idx) => { v.orderIndex = idx + 1; });
        lesson.vocabularyCount = lesson.vocabularies.length;
        lesson.updatedAt = new Date().toISOString();
        this.saveData();
        return lesson;
      }
    }

    const creatorReorderMatch = cleanPath.match(/^\/creator\/lessons\/(\d+)\/reorder$/);
    if (creatorReorderMatch && method === 'PUT') {
      const lessonId = parseInt(creatorReorderMatch[1], 10);
      const lesson = data.lessons.find(l => l.lessonId === lessonId);
      if (lesson && Array.isArray(body?.orderedVocabIds)) {
        const idMap = new Map(lesson.vocabularies.map(v => [v.vocabId, v]));
        const reordered = [];
        body.orderedVocabIds.forEach((vid, idx) => {
          const item = idMap.get(Number(vid));
          if (item) {
            item.orderIndex = idx + 1;
            reordered.push(item);
          }
        });
        lesson.vocabularies = reordered;
        lesson.updatedAt = new Date().toISOString();
        this.saveData();
        return lesson;
      }
      return lesson;
    }

    if (cleanPath === '/creator/lessons/import' && method === 'POST') {
      const samplePreview = data.vocabulary.slice(0, 5).map((v, idx) => ({
        ...v,
        rowNumber: idx + 2,
        status: 'VALID',
        validationErrors: []
      }));
      return {
        totalRows: 5,
        validRows: 5,
        invalidRows: 0,
        items: samplePreview
      };
    }

    if (cleanPath === '/creator/lessons/import/confirm' && method === 'POST') {
      const newLesson = {
        lessonId: data.lessons.length + 101,
        title: body?.title || 'Bài học nhập từ Excel',
        description: body?.description || 'Bài học được tạo tự động từ tệp Excel.',
        level: 1,
        status: 'Draft',
        orderIndex: data.lessons.length + 1,
        vocabularyCount: 5,
        creatorName: 'Tác Giả Khóa Học',
        creatorEmail: 'creator@gmail.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        vocabularies: data.vocabulary.slice(0, 5).map((v, i) => ({ ...v, orderIndex: i + 1 }))
      };
      data.lessons.push(newLesson);
      this.saveData();
      return newLesson;
    }

    if (cleanPath === '/admin/lessons' && method === 'GET') {
      const page = parseInt(query.page || 0, 10);
      const size = parseInt(query.size || 20, 10);
      const status = query.status;

      let items = [...data.lessons];
      if (status) {
        items = items.filter(l => l.status.toLowerCase() === status.toLowerCase());
      }

      const totalElements = items.length;
      const totalPages = Math.ceil(totalElements / size) || 1;
      const start = page * size;
      const paged = items.slice(start, start + size);

      return {
        items: paged,
        page,
        size,
        totalElements,
        totalPages,
        last: page >= totalPages - 1
      };
    }

    // -------------------------------------------------------------------------
    const adminLessonDetailMatch = cleanPath.match(/^\/admin\/lessons\/(\d+)$/);
    if (adminLessonDetailMatch && method === 'GET') {
      const id = parseInt(adminLessonDetailMatch[1], 10);
      const lesson = data.lessons.find(l => l.lessonId === id);
      if (!lesson) throw new ApiError(`Không tìm thấy bài học ${id}`, 404, 'NOT_FOUND');
      return {
        lessonId: lesson.lessonId,
        title: lesson.title,
        status: lesson.status,
        rejectionReason: lesson.rejectionReason || null,
        vocabularyCount: lesson.vocabularies ? lesson.vocabularies.length : (lesson.vocabularyCount || 0),
        vocabularies: lesson.vocabularies || [],
        createdAt: lesson.createdAt || new Date().toISOString(),
        updatedAt: lesson.updatedAt || new Date().toISOString(),
        creatorId: lesson.creatorId || 2,
        creatorName: lesson.creatorName || 'Tác Giả'
      };
    }

    const adminRevokeMatch = cleanPath.match(/^\/admin\/lessons\/(\d+)\/revoke$/);
    if (adminRevokeMatch && method === 'POST') {
      const id = parseInt(adminRevokeMatch[1], 10);
      const lesson = data.lessons.find(l => l.lessonId === id);
      if (!lesson) throw new ApiError(`Không tìm thấy bài học ${id}`, 404, 'NOT_FOUND');

      const currentEmail = authManager.getUser()?.emailOrPhone || '';
      const currentId = authManager.getUser()?.accountId;
      if ((lesson.creatorId && currentId && lesson.creatorId === currentId) ||
          (lesson.creatorEmail && currentEmail && lesson.creatorEmail.toLowerCase() === currentEmail.toLowerCase())) {
        throw new ApiError('Bạn không thể tự thu hồi bài học do chính mình tạo ra', 403, 'FORBIDDEN');
      }

      if (lesson.status !== 'Approved') {
        throw new ApiError(`Chỉ có thể thu hồi bài học đang ở trạng thái Approved (hiện tại: ${lesson.status})`, 409, 'CONFLICT');
      }

      const reason = (body?.reason || '').trim();
      if (!reason) {
        throw new ApiError('Lý do thu hồi không được để trống', 400, 'VALIDATION_ERROR');
      }

      lesson.status = 'Rejected';
      lesson.rejectionReason = reason;
      lesson.updatedAt = new Date().toISOString();

      data.moderationHistory.unshift({
        historyId: Date.now(),
        lessonId: lesson.lessonId,
        lessonTitle: lesson.title,
        decision: 'Revoked',
        moderatorName: authManager.getUser()?.fullName || 'Quản Trị Viên',
        moderatorEmail: currentEmail || 'admin@weblearnchinese.com',
        reviewedAt: new Date().toISOString(),
        note: `Thu hồi khẩn cấp: ${reason}`
      });

      if (Array.isArray(data.auditLogs)) {
        data.auditLogs.unshift({
          logId: data.auditLogs.length + 1,
          actionType: 'LESSON_REVOKE',
          resourceType: 'LESSON',
          resourceId: String(id),
          actorUsername: currentEmail || 'admin@weblearnchinese.com',
          actorRoles: 'Admin',
          details: `Thu hồi bài học vi phạm khẩn cấp #${id} (${lesson.title}): ${reason}`,
          createdAt: new Date().toISOString()
        });
      }

      this.saveData();
      return {
        lessonId: lesson.lessonId,
        title: lesson.title,
        status: lesson.status,
        rejectionReason: lesson.rejectionReason,
        vocabularyCount: lesson.vocabularies ? lesson.vocabularies.length : 0,
        vocabularies: lesson.vocabularies || [],
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt
      };
    }

    const adminApproveMatch = cleanPath.match(/^\/admin\/lessons\/(\d+)\/approve$/);
    if (adminApproveMatch && method === 'POST') {
      const id = parseInt(adminApproveMatch[1], 10);
      const lesson = data.lessons.find(l => l.lessonId === id);
      if (!lesson) throw new ApiError(`Không tìm thấy bài học ${id}`, 404, 'NOT_FOUND');

      const currentEmail = authManager.getUser()?.emailOrPhone || '';
      const currentId = authManager.getUser()?.accountId;
      if ((lesson.creatorId && currentId && lesson.creatorId === currentId) ||
          (lesson.creatorEmail && currentEmail && lesson.creatorEmail.toLowerCase() === currentEmail.toLowerCase())) {
        throw new ApiError('Bạn không thể tự phê duyệt bài học do chính mình tạo ra', 403, 'FORBIDDEN');
      }

      if (lesson.status === 'Approved') {
        throw new ApiError('Bài học đã được phê duyệt trước đó', 409, 'CONFLICT');
      }

      const note = (body?.note || 'Trọng tài tối cao phê duyệt').trim();
      lesson.status = 'Approved';
      lesson.rejectionReason = null;
      lesson.updatedAt = new Date().toISOString();

      data.moderationHistory.unshift({
        historyId: Date.now(),
        lessonId: lesson.lessonId,
        lessonTitle: lesson.title,
        decision: 'Approved',
        moderatorName: authManager.getUser()?.fullName || 'Quản Trị Viên (Trọng Tài)',
        moderatorEmail: currentEmail || 'admin@weblearnchinese.com',
        reviewedAt: new Date().toISOString(),
        note: note
      });

      if (Array.isArray(data.auditLogs)) {
        data.auditLogs.unshift({
          logId: data.auditLogs.length + 1,
          actionType: 'LESSON_APPROVE',
          resourceType: 'LESSON',
          resourceId: String(id),
          actorUsername: currentEmail || 'admin@weblearnchinese.com',
          actorRoles: 'Admin',
          details: `Phê duyệt trọng tài bài học #${id} (${lesson.title}): ${note}`,
          createdAt: new Date().toISOString()
        });
      }

      this.saveData();
      return {
        lessonId: lesson.lessonId,
        title: lesson.title,
        status: lesson.status,
        vocabularyCount: lesson.vocabularies ? lesson.vocabularies.length : 0,
        vocabularies: lesson.vocabularies || [],
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt
      };
    }

    // 5. MODERATOR QUEUE & REVIEWS
    // -------------------------------------------------------------------------
    if (cleanPath === '/moderator/lessons/pending' && method === 'GET') {
      const page = parseInt(query.page || 0, 10);
      const size = parseInt(query.size || 20, 10);

      const pending = data.lessons.filter(l => l.status === 'Pending');
      const totalElements = pending.length;
      const totalPages = Math.ceil(totalElements / size) || 1;
      const start = page * size;
      const paged = pending.slice(start, start + size).map(l => ({
        lessonId: l.lessonId,
        title: l.title,
        status: l.status,
        vocabularyCount: l.vocabularyCount || l.vocabularies?.length || 0,
        creatorName: l.creatorName || 'Tác Giả Khóa Học',
        creatorEmail: l.creatorEmail || 'creator@gmail.com',
        updatedAt: l.updatedAt || l.createdAt
      }));

      return {
        items: paged,
        page,
        size,
        totalElements,
        totalPages,
        last: page >= totalPages - 1
      };
    }

    const modLessonDetailMatch = cleanPath.match(/^\/moderator\/lessons\/(\d+)$/);
    if (modLessonDetailMatch && method === 'GET') {
      const id = parseInt(modLessonDetailMatch[1], 10);
      const lesson = data.lessons.find(l => l.lessonId === id);
      if (!lesson) throw new ApiError(`Không tìm thấy bài học ${id}`, 404, 'NOT_FOUND');
      return {
        ...lesson,
        creatorId: lesson.creatorId || 2,
        creatorEmail: lesson.creatorEmail || 'creator@gmail.com'
      };
    }

    const modApproveMatch = cleanPath.match(/^\/moderator\/lessons\/(\d+)\/approve$/);
    if (modApproveMatch && method === 'POST') {
      const id = parseInt(modApproveMatch[1], 10);
      const lesson = data.lessons.find(l => l.lessonId === id);
      if (!lesson) throw new ApiError(`Không tìm thấy bài học ${id}`, 404, 'NOT_FOUND');

      // Self-Review Invariant: Moderator cannot approve their own lesson
      const currentEmail = authManager.getUser()?.emailOrPhone || '';
      const currentId = authManager.getUser()?.accountId;
      if ((lesson.creatorId && currentId && lesson.creatorId === currentId) ||
          (lesson.creatorEmail && currentEmail && lesson.creatorEmail.toLowerCase() === currentEmail.toLowerCase())) {
        throw new ApiError('Bạn không thể tự kiểm duyệt nội dung do chính mình tạo ra', 403, 'FORBIDDEN');
      }

      lesson.status = 'Approved';
      lesson.updatedAt = new Date().toISOString();
      data.moderationHistory.unshift({
        historyId: Date.now(),
        lessonId: lesson.lessonId,
        lessonTitle: lesson.title,
        decision: 'Approved',
        moderatorName: 'Kiểm Duyệt Viên',
        moderatorEmail: 'moderator@gmail.com',
        reviewedAt: new Date().toISOString(),
        note: body?.note || 'Phê duyệt xuất bản bài học.'
      });
      this.saveData();
      return lesson;
    }

    const modRejectMatch = cleanPath.match(/^\/moderator\/lessons\/(\d+)\/reject$/);
    if (modRejectMatch && method === 'POST') {
      const id = parseInt(modRejectMatch[1], 10);
      const lesson = data.lessons.find(l => l.lessonId === id);
      if (!lesson) throw new ApiError(`Không tìm thấy bài học ${id}`, 404, 'NOT_FOUND');

      // Self-Review Invariant: Moderator cannot reject their own lesson
      const currentEmail = authManager.getUser()?.emailOrPhone || '';
      const currentId = authManager.getUser()?.accountId;
      if ((lesson.creatorId && currentId && lesson.creatorId === currentId) ||
          (lesson.creatorEmail && currentEmail && lesson.creatorEmail.toLowerCase() === currentEmail.toLowerCase())) {
        throw new ApiError('Bạn không thể tự kiểm duyệt nội dung do chính mình tạo ra', 403, 'FORBIDDEN');
      }

      const resolvedReason = body?.rejectionReason || body?.reason || 'Cần bổ sung thêm ví dụ minh họa.';
      const resolvedFlags = body?.flaggedFields || null;
      lesson.status = 'Rejected';
      lesson.rejectionReason = resolvedReason;
      lesson.flaggedFields = resolvedFlags;
      lesson.updatedAt = new Date().toISOString();
      data.moderationHistory.unshift({
        historyId: Date.now(),
        lessonId: lesson.lessonId,
        lessonTitle: lesson.title,
        decision: 'Rejected',
        moderatorName: 'Kiểm Duyệt Viên',
        moderatorEmail: 'moderator@gmail.com',
        reviewedAt: new Date().toISOString(),
        reason: resolvedReason,
        rejectionReason: resolvedReason,
        flaggedFields: resolvedFlags
      });
      this.saveData();
      return lesson;
    }

    if (cleanPath === '/moderator/history' && method === 'GET') {
      const page = parseInt(query.page || 0, 10);
      const size = parseInt(query.size || 20, 10);

      const items = data.moderationHistory;
      const totalElements = items.length;
      const totalPages = Math.ceil(totalElements / size) || 1;
      const start = page * size;
      const paged = items.slice(start, start + size);

      return {
        items: paged,
        page,
        size,
        totalElements,
        totalPages,
        last: page >= totalPages - 1
      };
    }

    // -------------------------------------------------------------------------
    // 6. SPACED REPETITION SYSTEM (SRS)
    // -------------------------------------------------------------------------
    if (cleanPath === '/srs/stats' && method === 'GET') {
      const now = new Date();
      const itemType = query.itemType ? query.itemType.toUpperCase() : null;

      let allCards = data.srsCards;
      let allReviews = data.srsReviews;

      if (itemType) {
        allCards = allCards.filter(c => (c.itemType || 'VOCABULARY').toUpperCase() === itemType);
        allReviews = allReviews.filter(r => (r.itemType || 'VOCABULARY').toUpperCase() === itemType);
      }

      const dueCards = allCards.filter(c => !c.isNew && new Date(c.nextReviewAt) <= now);
      const todayReviews = allReviews.length;

      return {
        cardsDue: dueCards.length,
        cardsDueListening: dueCards.filter(c => c.cardType === 'LISTENING').length,
        cardsDueWriting: dueCards.filter(c => c.cardType === 'WRITING').length,
        cardsDueFlashcard: dueCards.filter(c => c.cardType === 'FLASHCARD' || (!c.cardType && c.cardType !== 'LISTENING' && c.cardType !== 'WRITING' && c.cardType !== 'READING')).length,
        cardsDueReading: dueCards.filter(c => c.cardType === 'READING').length,
        reviewsToday: todayReviews,
        newCardsLimit: data.srsSettings.newCardsPerDay || 20,
        maxReviewLimit: data.srsSettings.maxReviewsPerDay || 50,
        newCardsToday: allCards.filter(c => c.isNew).length
      };
    }

    if (cleanPath === '/srs/curriculum-progress' && method === 'GET') {
      const currentAccount = this.getCurrentAccount();
      const userCards = (data.srsCards || []).filter(c => 
        !c.accountId || c.accountId === currentAccount.accountId || (currentAccount.accountId === 1 && !c.accountId)
      );

      const learnedVocabCards = userCards.filter(c => (c.itemType || 'VOCABULARY').toUpperCase() === 'VOCABULARY' && (!c.isNew || c.repetitions > 0));
      const learnedVocabIds = [...new Set(learnedVocabCards.map(c => Number(c.vocabId ?? c.itemId)).filter(Boolean))];

      const learnedRadicalCards = userCards.filter(c => (c.itemType || '').toUpperCase() === 'RADICAL' && (!c.isNew || c.repetitions > 0));
      const learnedRadicalIds = [...new Set(learnedRadicalCards.map(c => Number(c.radicalId ?? c.itemId)).filter(Boolean))];

      const lessonProgress = {};
      const lessons = data.lessons || [];
      lessons.forEach(l => {
        const vocabList = Array.isArray(l.vocabularies) ? l.vocabularies : [];
        if (vocabList.length > 0) {
          const learnedCount = vocabList.filter(v => learnedVocabIds.includes(Number(v.vocabId ?? v.itemId))).length;
          lessonProgress[l.lessonId] = learnedCount;
        } else {
          lessonProgress[l.lessonId] = 0;
        }
      });

      const chapterProgress = {};
      const radSet = new Set(learnedRadicalIds);
      for (let i = 0; i < 11; i++) {
        const start = i * 20 + 1;
        const end = Math.min((i + 1) * 20, 214);
        let count = 0;
        for (let id = start; id <= end; id++) {
          if (radSet.has(id)) count++;
        }
        chapterProgress[`radicals214_chapter_${i}`] = count;
      }
      const rawRadicals = Array.isArray(data.radicals) ? data.radicals : [];
      const rankedCommon = rawRadicals
        .filter(r => r && Number(r.commonRank) >= 1 && Number(r.commonRank) <= 50)
        .sort((a, b) => Number(a.commonRank) - Number(b.commonRank));
      const effectiveCommon = rankedCommon.length > 0 ? rankedCommon : rawRadicals.slice(0, 50);
      for (let i = 0; i < 5; i++) {
        const slice = effectiveCommon.slice(i * 10, Math.min((i + 1) * 10, effectiveCommon.length));
        let count = 0;
        if (slice.length > 0) {
          count = slice.filter(r => radSet.has(Number(r.radicalId ?? r.itemId))).length;
        } else {
          const start = i * 10 + 1;
          const end = Math.min((i + 1) * 10, 50);
          for (let id = start; id <= end; id++) {
            if (radSet.has(id)) count++;
          }
        }
        chapterProgress[`radicals50_chapter_${i}`] = count;
      }

      return {
        lessonProgress,
        chapterProgress,
        totalLearnedVocabularies: learnedVocabIds.length,
        totalLearnedRadicals: learnedRadicalIds.length,
        learnedVocabIds,
        learnedRadicalIds
      };
    }

    if (cleanPath === '/srs/settings' && method === 'GET') {
      return {
        settingId: 1,
        accountId: this.getCurrentAccount().accountId,
        newCardsPerDay: data.srsSettings.newCardsPerDay || 20,
        maxReviewsPerDay: data.srsSettings.maxReviewsPerDay || 50,
        timezone: data.srsSettings.timezone || 'Asia/Ho_Chi_Minh',
        updatedAt: new Date().toISOString()
      };
    }

    if (cleanPath === '/srs/settings' && method === 'PUT') {
      if (body?.newCardsPerDay != null) {
        data.srsSettings.newCardsPerDay = parseInt(body.newCardsPerDay, 10);
      }
      if (body?.maxReviewsPerDay != null) {
        data.srsSettings.maxReviewsPerDay = parseInt(body.maxReviewsPerDay, 10);
      }
      this.saveData();

      return {
        settingId: 1,
        accountId: this.getCurrentAccount().accountId,
        newCardsPerDay: data.srsSettings.newCardsPerDay,
        maxReviewsPerDay: data.srsSettings.maxReviewsPerDay,
        timezone: data.srsSettings.timezone || 'Asia/Ho_Chi_Minh',
        updatedAt: new Date().toISOString()
      };
    }

    if (cleanPath.startsWith('/srs/due') || cleanPath === '/srs/due-cards' || cleanPath.endsWith('/due')) {
      const lessonId = query.lessonId ? parseInt(query.lessonId, 10) : null;
      const cardType = query.cardType ? query.cardType.toUpperCase() : null;
      const itemType = query.itemType ? query.itemType.toUpperCase() : null;

      const now = new Date();
      let cards = data.srsCards.filter(c => !c.isNew && new Date(c.nextReviewAt) <= now);
      if (itemType) {
        cards = cards.filter(c => (c.itemType || 'VOCABULARY').toUpperCase() === itemType);
      }
      if (lessonId) {
        const lesson = data.lessons.find(l => l.lessonId === lessonId);
        const lessonVocabIds = new Set((lesson?.vocabularies || []).map(v => v.vocabId));
        cards = cards.filter(c => c.lessonId === lessonId || (c.itemType === 'VOCABULARY' && lessonVocabIds.has(c.itemId)));
      }
      if (cardType) {
        cards = cards.filter(c => cardType === 'FLASHCARD' ? (c.cardType === 'FLASHCARD' || (!c.cardType && c.cardType !== 'LISTENING' && c.cardType !== 'WRITING' && c.cardType !== 'READING')) : c.cardType === cardType);
      }

      return cards;
    }

    if (cleanPath.startsWith('/srs/new-cards') || cleanPath.endsWith('/new-cards')) {
      const lessonId = query.lessonId ? parseInt(query.lessonId, 10) : null;
      const cardType = query.cardType ? query.cardType.toUpperCase() : null;
      const itemType = query.itemType ? query.itemType.toUpperCase() : null;

      let candidates = data.srsCards.filter(c => c.isNew);
      if (itemType) {
        candidates = candidates.filter(c => (c.itemType || 'VOCABULARY').toUpperCase() === itemType);
      }
      if (lessonId) {
        const lesson = data.lessons.find(l => l.lessonId === lessonId);
        const lessonVocabIds = new Set((lesson?.vocabularies || []).map(v => v.vocabId));
        candidates = candidates.filter(c => c.lessonId === lessonId || (c.itemType === 'VOCABULARY' && lessonVocabIds.has(c.itemId)));
      }
      if (cardType) {
        candidates = candidates.filter(c => cardType === 'FLASHCARD' ? (c.cardType === 'FLASHCARD' || (!c.cardType && c.cardType !== 'LISTENING' && c.cardType !== 'WRITING' && c.cardType !== 'READING')) : c.cardType === cardType);
      }
      return candidates;
    }

    if (cleanPath.startsWith('/srs/practice-cards') || cleanPath.endsWith('/practice-cards')) {
      const itemType = query.itemType ? query.itemType.toUpperCase() : 'VOCABULARY';
      const cardType = query.cardType ? query.cardType.toUpperCase() : null;

      if (itemType === 'RADICAL') {
        const radicalList = query.radicalId 
          ? data.radicals.filter(r => r.radicalId === parseInt(query.radicalId, 10))
          : (query.commonOnly ? data.radicals.filter(r => r.commonRank != null) : data.radicals.slice(0, 50));
        
        return radicalList.map((r, i) => {
          const cleanChar = (r.character || '').replace(/\(.*\)/, '').trim();
          return {
            cardId: 20000 + r.radicalId,
            itemType: 'RADICAL',
            itemId: r.radicalId,
            cardType: cardType || (i % 2 === 0 ? 'READING' : 'WRITING'),
            hanzi: cleanChar,
            character: r.character,
            pinyin: r.pinyin,
            meaningVi: r.meaningVi,
            meaningHanViet: r.meaningHanViet,
            strokeCount: (Number.isFinite(Number(r.strokeCount)) && Number(r.strokeCount) > 0) ? Number(r.strokeCount) : null,
            repetitions: 1,
            easeFactor: 2.5,
            intervalDays: 1,
            nextReviewAt: new Date().toISOString(),
            isNew: false
          };
        });
      }

      const lessonId = query.lessonId ? parseInt(query.lessonId, 10) : 1;
      const lesson = query.lessonId
        ? data.lessons.find(l => l.lessonId === lessonId)
        : data.lessons[0];
      const practiceCards = (lesson?.vocabularies || []).map((v, i) => ({
        cardId: v.vocabId,
        itemType: 'VOCABULARY',
        itemId: v.vocabId,
        lessonId: lesson.lessonId,
        cardType: cardType || (i % 2 === 0 ? 'READING' : (i % 3 === 0 ? 'WRITING' : 'LISTENING')),
        hanzi: v.hanzi,
        pinyin: v.pinyin,
        meaningVi: v.meaningVi,
        meaningHanViet: v.meaningHanViet,
        exampleSentence: v.exampleSentence,
        exampleTranslation: v.exampleTranslation,
        strokeCount: v.strokeCount || 4,
        repetitions: 1,
        easeFactor: 2.5,
        intervalDays: 1,
        nextReviewAt: new Date().toISOString(),
        isNew: false
      }));
      return practiceCards;
    }

    const lessonSrsStatsMatch = cleanPath.match(/^\/srs\/lessons\/(\d+)\/stats$/);
    if (lessonSrsStatsMatch && method === 'GET') {
      const id = parseInt(lessonSrsStatsMatch[1], 10);
      const lesson = data.lessons.find(l => l.lessonId === id);
      const lessonVocabIds = new Set((lesson?.vocabularies || []).map(v => v.vocabId));
      const lessonCards = data.srsCards.filter(c => c.lessonId === id || (c.itemType === 'VOCABULARY' && lessonVocabIds.has(c.itemId)));
      const now = new Date();
      const dueCards = lessonCards.filter(c => !c.isNew && new Date(c.nextReviewAt) <= now).length;
      const learnedCards = lessonCards.filter(c => !c.isNew).length;
      const newCards = lessonCards.filter(c => c.isNew).length;
      return {
        lessonId: id,
        totalCards: lessonCards.length,
        learnedCards,
        dueCards,
        newCards
      };
    }

    if ((cleanPath === '/srs/review' || cleanPath === '/srs/reviews') && method === 'POST') {
      if ((body?.isRequeue || body?.requeued) && Number(body?.rating) === 1) {
        return { isRequeue: true };
      }
      const rating = parseInt(body?.rating || 3, 10);
      const itemId = parseInt(body?.itemId || 1, 10);
      const itemType = (body?.itemType || 'VOCABULARY').toUpperCase();
      const cardType = body?.cardType ? body.cardType.toUpperCase() : 'FLASHCARD';

      let card = data.srsCards.find(c => 
        c.itemId === itemId && 
        (c.itemType || 'VOCABULARY').toUpperCase() === itemType && 
        (c.cardType || 'FLASHCARD').toUpperCase() === cardType
      );
      if (!card) {
        if (itemType === 'RADICAL') {
          const r = data.radicals.find(item => item.radicalId === itemId) || data.radicals[0];
          const cleanChar = (r?.character || '').replace(/\(.*\)/, '').trim();
          card = {
            cardId: Date.now(),
            itemType: 'RADICAL',
            itemId,
            cardType,
            hanzi: cleanChar,
            character: r?.character || cleanChar,
            pinyin: r?.pinyin || '',
            meaningVi: r?.meaningVi || '',
            meaningHanViet: r?.meaningHanViet || '',
            strokeCount: (Number.isFinite(Number(r?.strokeCount)) && Number(r?.strokeCount) > 0) ? Number(r.strokeCount) : null,
            repetitions: 0,
            easeFactor: 2.5,
            intervalDays: 0,
            nextReviewAt: new Date().toISOString(),
            isNew: false
          };
        } else {
          const v = data.vocabulary.find(item => item.vocabId === itemId) || data.vocabulary[0];
          let itemLessonId = body?.lessonId ? parseInt(body.lessonId, 10) : (v?.lessonId ?? null);
          if (!itemLessonId) {
            const foundLesson = data.lessons.find(l => (l.vocabularies || []).some(item => item.vocabId === itemId));
            if (foundLesson) itemLessonId = foundLesson.lessonId;
          }
          card = {
            cardId: Date.now(),
            itemType: 'VOCABULARY',
            itemId,
            lessonId: itemLessonId,
            cardType,
            hanzi: v?.hanzi || '',
            pinyin: v?.pinyin || '',
            meaningVi: v?.meaningVi || '',
            meaningHanViet: v?.meaningHanViet || '',
            repetitions: 0,
            easeFactor: 2.5,
            intervalDays: 0,
            nextReviewAt: new Date().toISOString(),
            isNew: false
          };
        }
        data.srsCards.push(card);
      }

      if (body?.lessonId) {
        card.lessonId = parseInt(body.lessonId, 10);
      } else if (itemType === 'VOCABULARY' && !card.lessonId) {
        const v = data.vocabulary.find(item => item.vocabId === itemId);
        let itemLessonId = v?.lessonId ?? null;
        if (!itemLessonId) {
          const foundLesson = data.lessons.find(l => (l.vocabularies || []).some(item => item.vocabId === itemId));
          if (foundLesson) itemLessonId = foundLesson.lessonId;
        }
        if (itemLessonId) {
          card.lessonId = itemLessonId;
        }
      }

      // =========================================================================
      // [CHẾ ĐỘ TEST SRS 2 PHÚT VÀ THUẬT TOÁN GỐC SM-2]
      // =========================================================================
      const SRS_TEST_MODE_2MIN = (typeof window !== 'undefined' && window.__SRS_TEST_MODE_2MIN !== undefined)
        ? Boolean(window.__SRS_TEST_MODE_2MIN)
        : (typeof globalThis !== 'undefined' && globalThis.__SRS_TEST_MODE_2MIN !== undefined)
          ? Boolean(globalThis.__SRS_TEST_MODE_2MIN)
          : true;

      card.isNew = false;
      let easeFactor = card.easeFactor || 2.5;
      let repetitions = card.repetitions || 0;
      let intervalDays = card.intervalDays || 0;

      // Map project 1..4 rating to SM-2 quality score q (1->0, 2->3, 3->4, 4->5)
      const q = rating === 4 ? 5 : (rating === 3 ? 4 : (rating === 2 ? 3 : 0));
      const diff = 5 - q;
      const deltaEf = 0.1 - (diff * (0.08 + diff * 0.02));

      if (SRS_TEST_MODE_2MIN) {
        if (rating >= 2) {
          repetitions += 1;
          intervalDays = 1;
          // Đến hạn sau đúng 2 phút (2 * 60 * 1000 ms) để xem và ôn lại được ngay
          card.nextReviewAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
        } else {
          // Again (1): Đến hạn ngay lập tức để học lại
          repetitions = 0;
          intervalDays = 0;
          card.nextReviewAt = new Date(Date.now() - 1000).toISOString();
        }
        const modeDeltaEf = (rating === 1) ? -0.20 : deltaEf;
        easeFactor = Math.max(1.3, easeFactor + modeDeltaEf);
        card.repetitions = repetitions;
        card.easeFactor = parseFloat(easeFactor.toFixed(2));
        card.intervalDays = intervalDays;
      } else {
        // [THUẬT TOÁN GỐC SM-2] ĐƯỢC LƯU GIỮ NGUYÊN VẸN 100% (Tính theo ngày)
        // Rating 2 (Hard - q=3), 3 (Good - q=4), 4 (Easy - q=5) đều là đánh giá đạt chuẩn (rating >= 2)
        const newEaseFactor = Math.max(1.3, easeFactor + deltaEf);
        if (rating >= 2) {
          if (repetitions === 0) {
            intervalDays = 1;
          } else if (repetitions === 1) {
            intervalDays = 6;
          } else {
            intervalDays = Math.ceil(intervalDays * newEaseFactor);
          }
          repetitions += 1;
          card.nextReviewAt = new Date(Date.now() + intervalDays * 86400000).toISOString();
        } else {
          // Rating 1 (Again - q=0): Đến hạn ngay lập tức để học lại (due today)
          repetitions = 0;
          intervalDays = 0;
          card.nextReviewAt = new Date(Date.now() - 1000).toISOString();
        }

        easeFactor = newEaseFactor;

        card.repetitions = repetitions;
        card.easeFactor = parseFloat(easeFactor.toFixed(2));
        card.intervalDays = intervalDays;
      }

      data.srsReviews.push({
        reviewId: Date.now(),
        itemId,
        itemType,
        cardType,
        rating,
        intervalDays,
        reviewedAt: new Date().toISOString()
      });

      this.saveData();
      return card;
    }

    // -------------------------------------------------------------------------
    // 7. PERSONAL NOTES
    // -------------------------------------------------------------------------
    const notesListMatch = cleanPath.match(/^\/(?:vocabularies|vocabulary|notes\/vocabulary|radicals)\/(\d+)(?:\/notes)?$/);
    if (notesListMatch) {
      const targetId = parseInt(notesListMatch[1], 10);
      const isRadicalPath = cleanPath.startsWith('/radicals');

      if (method === 'GET') {
        const currentAccount = this.getCurrentAccount();
        const itemNotes = data.notes.filter(n => {
          const idMatch = isRadicalPath ? n.radicalId === targetId : n.vocabId === targetId;
          return idMatch && (!n.accountId || n.accountId === currentAccount.accountId);
        });
        return {
          items: itemNotes,
          page: 0,
          size: 20,
          totalElements: itemNotes.length,
          totalPages: 1
        };
      }

      if (method === 'POST') {
const currentAccount = this.getCurrentAccount();
        const newNote = {
          noteId: Date.now(),
          accountId: currentAccount.accountId,
          ...(isRadicalPath ? { radicalId: targetId } : { vocabId: targetId }),
          content: String(body?.content || '').trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        data.notes.unshift(newNote);
        this.saveData();
        return newNote;
      }
    }

    const noteItemMatch = cleanPath.match(/^\/notes\/(\d+)$/);
    if (noteItemMatch) {
      const noteId = parseInt(noteItemMatch[1], 10);
      const note = data.notes.find(n => n.noteId === noteId);

      if (method === 'PUT') {
        if (!note) throw new ApiError(`Không tìm thấy ghi chú ${noteId}`, 404, 'NOT_FOUND');
        note.content = String(body?.content || '').trim();
        note.updatedAt = new Date().toISOString();
        this.saveData();
        return note;
      }

      if (method === 'DELETE') {
        const idx = data.notes.findIndex(n => n.noteId === noteId);
        if (idx >= 0) {
          data.notes.splice(idx, 1);
          this.saveData();
        }
        return null;
      }
    }

    // -------------------------------------------------------------------------
    // 8. ADMIN ACCOUNTS & ROLES
    // -------------------------------------------------------------------------
    if (cleanPath === '/admin/accounts' && method === 'GET') {
      const page = parseInt(query.page || 0, 10);
      const size = parseInt(query.size || 20, 10);

      return {
        items: data.accounts.map(a => ({
          ...a,
          emailOrPhone: a.emailOrPhone || a.email || ''
        })),
        page,
        size,
        totalElements: data.accounts.length,
        totalPages: 1,
        last: true
      };
    }

    const accountStatusMatch = cleanPath.match(/^\/admin\/accounts\/(\d+)\/status$/);
    if (accountStatusMatch && method === 'PUT') {
      const id = parseInt(accountStatusMatch[1], 10);
      const acc = data.accounts.find(a => a.accountId === id);
      if (acc) {
        acc.status = body?.status || (acc.status === 'Active' ? 'Suspended' : 'Active');
        this.saveData();
        return acc;
      }
      throw new ApiError(`Không tìm thấy tài khoản ${id}`, 404, 'NOT_FOUND');
    }

    const accountRolesMatch = cleanPath.match(/^\/admin\/accounts\/(\d+)\/roles$/);
    if (accountRolesMatch && method === 'PUT') {
      const id = parseInt(accountRolesMatch[1], 10);
      const acc = data.accounts.find(a => a.accountId === id);
      if (acc && Array.isArray(body?.roles)) {
        const roles = body.roles.map(r => String(r).replace(/^ROLE_/i, ''));
        const hasCreator = roles.some(r => r.toLowerCase() === 'creator');
        const hasModerator = roles.some(r => r.toLowerCase() === 'moderator');
        if (hasCreator && hasModerator) {
          throw new ApiError('Vai trò Người sáng tạo (Creator) và Kiểm duyệt viên (Moderator) loại trừ lẫn nhau tuyệt đối. Một tài khoản không thể đồng thời giữ cả hai vai trò.', 400, 'BAD_REQUEST');
        }
        acc.roles = [...body.roles];
        this.saveData();
        return acc;
      }
      throw new ApiError(`Không tìm thấy tài khoản ${id}`, 404, 'NOT_FOUND');
    }

    const accountResetPasswordMatch = cleanPath.match(/^\/admin\/accounts\/(\d+)\/reset-password$/);
    if (accountResetPasswordMatch && method === 'POST') {
      const id = parseInt(accountResetPasswordMatch[1], 10);
      const acc = data.accounts.find(a => a.accountId === id);
      if (!acc) {
        throw new ApiError(`Không tìm thấy tài khoản ${id}`, 404, 'NOT_FOUND');
      }
      const currentAccount = this.getCurrentAccount();
      if (currentAccount && (currentAccount.accountId === id || (currentAccount.email && currentAccount.email.toLowerCase() === (acc.email || acc.emailOrPhone || '').toLowerCase()))) {
        throw new ApiError('Không thể tự đặt lại mật khẩu của chính mình qua tính năng quản trị. Vui lòng đổi mật khẩu tại trang Hồ sơ cá nhân.', 400, 'BAD_REQUEST');
      }
      let finalPassword = '';
      if (body && typeof body.newPassword === 'string' && body.newPassword.trim().length >= 6) {
        finalPassword = body.newPassword.trim();
      } else {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%&*!?';
        let temporaryPassword = 'Tmp@';
        for (let i = 0; i < 8; i++) {
          temporaryPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        finalPassword = temporaryPassword;
      }
      acc.password = finalPassword;
      acc.passwordHash = finalPassword;
      acc.updatedAt = new Date().toISOString();
      this.saveData();
      return {
        accountId: id,
        emailOrPhone: acc.email || acc.emailOrPhone,
        temporaryPassword: finalPassword,
        newPassword: finalPassword
      };
    }

    if (cleanPath === '/admin/roles' && method === 'GET') {
      return [
        { roleId: 1, roleName: 'Learner' },
        { roleId: 2, roleName: 'Creator' },
        { roleId: 3, roleName: 'Moderator' },
        { roleId: 4, roleName: 'Admin' }
      ];
    }

    if (cleanPath === '/srs/reading/status' && method === 'GET') {
      return {
        audioInputSupported: true,
        configured: false,
        available: false,
        demoSimulation: true,
        provider: 'speech-service-local',
        tier: 'open-source-offline',
        model: 'Chao-5-Scale Tone Sandhi Engine',
        notice: 'Chế độ Mô phỏng (Demo): Phân tích cao độ F0 trực tiếp cần kết nối với dịch vụ speech-service.'
      };
    }

    if (cleanPath === '/srs/reading/assess' && method === 'POST') {
      return {
        status: 'unconfigured',
        confidence: 'LOW',
        overallScore: null,
        summaryVi: 'Đang ở Chế độ Mô phỏng (Demo Offline) — hệ thống không giả lập điểm phát âm khi chưa kết nối dịch vụ phân tích giọng nói thực tế.',
        retryAdvice: 'Bạn có thể nghe âm mẫu để tự đối chiếu hoặc bấm "Bỏ qua →" để tiếp tục phiên học.',
        limitations: 'Chế độ Demo không chấm điểm phát âm giả để đảm bảo tính trung thực sư phạm.'
      };
    }

    // Default: Return empty object or null for unknown GET/mutations
    return null;
  }

  /**
   * Configures whether demo SRS engine operates in 2-minute test mode or canonical SM-2 mode (by days).
   * @param {boolean} enabled
   */
  setSrsTestMode(enabled) {
    if (typeof globalThis !== 'undefined') {
      globalThis.__SRS_TEST_MODE_2MIN = Boolean(enabled);
    }
    if (typeof window !== 'undefined') {
      window.__SRS_TEST_MODE_2MIN = Boolean(enabled);
    }
  }

  /**
   * Checks whether demo SRS engine is in 2-minute test mode.
   * @returns {boolean}
   */
  isSrsTestMode() {
    if (typeof globalThis !== 'undefined' && globalThis.__SRS_TEST_MODE_2MIN !== undefined) {
      return Boolean(globalThis.__SRS_TEST_MODE_2MIN);
    }
    if (typeof window !== 'undefined' && window.__SRS_TEST_MODE_2MIN !== undefined) {
      return Boolean(window.__SRS_TEST_MODE_2MIN);
    }
    return true;
  }
}

export const demoFallbackEngine = new DemoFallbackEngine();

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('auth:logout', () => {
    demoFallbackEngine.resetInMemoryData();
  });
  window.addEventListener('auth:login', () => {
    demoFallbackEngine.resetInMemoryData();
  });
}
