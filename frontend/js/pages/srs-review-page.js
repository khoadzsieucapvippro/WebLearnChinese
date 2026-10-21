/**
 * =============================================================================
 * UNIFIED SRS REVIEW & CHARACTER WRITING CENTER (TASK 9C.3 + ENHANCEMENTS)
 * Module: frontend/js/pages/srs-review-page.js
 * 
 * Responsibilities:
 * - Central Learning & Review Hub for both Kangxi Radicals and HSK 1/2/3 Vocabulary.
 * - 2 Core Learning Modes: [🎴 Flashcard] & [✍️ Luyện viết].
 * - 5 Content Groups:
 *   1. 50 bộ thủ thông dụng
 *   2. 214 bộ thủ Khang Hy
 *   3. HSK 1 (10 Topics)
 *   4. HSK 2 (10 Topics)
 *   5. HSK 3 (10 Topics)
 * - Independent Progress Architecture:
 *   - "Học tiếp": Continues from saved lastIndex in localStorage.
 *   - "Học lại": Starts from beginning without overwriting "Học tiếp" progress or SRS history.
 *   - Separate storage keys: HOC_HAN_NGU_FLASHCARD_PROGRESS & HOC_HAN_NGU_WRITING_PROGRESS.
 * - Flashcard Experience:
 *   - 3D Flip (Space/Enter/Click) & 4 SRS ratings (Again, Hard, Good, Easy).
 *   - Dual-column Contextual Personal Notes on card back (left: note list, right: textarea).
 *   - Radicals support on Flashcard (front: Hanzi; back: Pinyin, Hán-Việt, Meaning, Stroke count, 1-4 ratings).
 * - Writing Experience:
 *   - Zero flashcard flip, direct rice-grid canvas (米字格).
 *   - Side-by-side dual rice-grid boxes for 2-character words (e.g. 学生, 爱好, 北京).
 *   - Standard rice-grid box for radicals (1 character).
 *   - Controls: Replay, Outline, Clear.
 *   - Prominent "Sang từ tiếp theo" / "Sang bộ thủ tiếp theo" button.
 *   - Strictly NO 1-4 rating prompts in writing mode.
 *   - Truthful missing stroke data notification.
 * - Deep-linking & URL state synchronization:
 *   ?mode=flashcard|writing&group=radicals50|radicals214|hsk1|hsk2|hsk3&lessonId=...&radicalId=...&action=continue|review
 * - Full backward compatibility with 100% of existing unit & browser tests.
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
import { CharacterWritingEngine, WRITING_MODES } from '../ui/character-writing/character-writing-engine.js';
import { splitHanziCharacters, loadStrokeData } from '../ui/character-writing/stroke-data-loader.js';
import { createRiceGridSvg } from '../ui/character-writing/vocab-writing-orchestrator.js';
import { removeVietnameseDiacritics, partitionRadicals } from './radicals-page.js';
import { PinyinImeComponent } from '../ui/pinyin-ime/pinyin-ime-engine.js';
import { lookupPinyin, cleanPinyin } from '../ui/pinyin-ime/pinyin-dict.js';

export {
  createSpeakerIcon,
  createSpeechButton,
  speechController,
  speakHanzi,
  playPronunciation,
  isSpeechSynthesisAvailable,
  SpeechState,
  VocabWritingOrchestrator,
  PinyinImeComponent,
  lookupPinyin,
  cleanPinyin
};

export const MAX_AGAIN_REVIEWS_PER_CARD = 3;

export const STORAGE_KEY_FLASHCARD = 'HOC_HAN_NGU_FLASHCARD_PROGRESS';
export const STORAGE_KEY_WRITING = 'HOC_HAN_NGU_WRITING_PROGRESS';
export const STORAGE_KEY_LISTENING = 'HOC_HAN_NGU_LISTENING_PROGRESS';
export const STORAGE_KEY_READING = 'HOC_HAN_NGU_READING_PROGRESS';

/**
 * Normalizes user-entered Hanzi answer by trimming and NFC normalization.
 * @param {string} value
 * @returns {string}
 */
export function normalizeHanziAnswer(value) {
  if (value == null) return '';
  return String(value)
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, '');
}

/**
 * Validates listening room answer against expected Hanzi character(s).
 * - Enforces full-string match (no partial completion).
 * - Disallows plain Latin Pinyin.
 * @param {string} inputAnswer
 * @param {string} expectedHanzi
 * @returns {boolean}
 */
export function verifyListeningAnswer(inputAnswer, expectedHanzi) {
  const cleanInput = normalizeHanziAnswer(inputAnswer);
  const cleanExpected = normalizeHanziAnswer(expectedHanzi);

  if (!cleanInput || !cleanExpected) return false;

  // Latin pinyin alone is NOT accepted as valid Chinese character
  if (/^[a-zA-Z\s]+$/.test(cleanInput)) return false;

  if (cleanInput === cleanExpected) return true;

  // Handle parenthesized or slashed radical variants (e.g. '水(氵)', '貝(贝)', '長(镸/长)')
  if (cleanExpected.includes('(') || cleanExpected.includes('/')) {
    const base = cleanExpected.split(/[()\/]/)[0].trim();
    if (cleanInput === base) return true;
    const variants = cleanExpected.match(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u2E80-\u2EFF]/g) || [];
    if (variants.includes(cleanInput)) return true;
  }

  return false;
}

/**
 * Formats constituent radicals of a vocabulary word for flashcard back display.
 * - Neutral fallback when unverified or empty: 'Chưa có dữ liệu bộ thủ đã xác minh'.
 * - Formats single-character word: e.g. "子 (Tử)" or "子 (Tử), 冖 (Mịch)".
 * - Formats multi-character word with attribution: e.g. "学: 子 (Tử), 生: 生 (Sinh)".
 * - If multi-char word has unassigned radicals: formats without false attribution (no data fabrication).
 * 
 * @param {Array<Object>|null|undefined} radicals
 * @param {string|null|undefined} wordHanzi
 * @returns {string}
 */
export function formatConstituentRadicalsText(radicals, wordHanzi) {
  if (!Array.isArray(radicals) || radicals.length === 0) {
    return 'Chưa có dữ liệu bộ thủ đã xác minh';
  }

  const cleanWord = typeof wordHanzi === 'string' ? wordHanzi.trim() : '';
  const isMultiChar = cleanWord.length > 1;

  const formattedItems = radicals.map(rad => {
    if (!rad) return '';
    const char = rad.character || rad.radical || '';
    const rawMeaning = (rad.meaningHanViet || rad.meaningVi || '').trim();
    const meaning = rawMeaning.replace(/^Bộ\s+/i, '');

    const label = meaning ? (char ? `${char} (${meaning})` : meaning) : char;

    let hanziChar = rad.hanziChar ? String(rad.hanziChar).trim() : '';
    if (!hanziChar && cleanWord.length === 1) {
      hanziChar = cleanWord;
    }

    if (isMultiChar && hanziChar && cleanWord.includes(hanziChar)) {
      return `${hanziChar}: ${label}`;
    }

    return label;
  }).filter(Boolean);

  if (formattedItems.length === 0) {
    return 'Chưa có dữ liệu bộ thủ đã xác minh';
  }

  return formattedItems.join(', ');
}

/**
 * Reads progress from localStorage for the given mode ('flashcard', 'writing', 'listening', or 'reading').
 * @param {'flashcard'|'writing'|'listening'|'reading'} mode
 * @returns {Object}
 */
export function getProgress(mode) {
  const key = mode === 'writing'
    ? STORAGE_KEY_WRITING
    : (mode === 'listening'
        ? STORAGE_KEY_LISTENING
        : (mode === 'reading' ? STORAGE_KEY_READING : STORAGE_KEY_FLASHCARD));
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Saves progress updates to localStorage for the given mode.
 * @param {'flashcard'|'writing'|'listening'|'reading'} mode
 * @param {Object} updates
 */
export function saveProgress(mode, updates) {
  const key = mode === 'writing'
    ? STORAGE_KEY_WRITING
    : (mode === 'listening'
        ? STORAGE_KEY_LISTENING
        : (mode === 'reading' ? STORAGE_KEY_READING : STORAGE_KEY_FLASHCARD));
  try {
    const current = getProgress(mode);
    const next = { ...current, ...updates };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(next));
    }
  } catch (e) {
    console.warn('[SRS Progress] Could not save progress:', e);
  }
}

/**
 * 15 Official Curriculum Topics for HSK 1 (300 words total, 20 words each)
 */
export const HSK1_TOPICS = [
  {
    "topicId": 1,
    "backendLessonId": 5,
    "title": "Bài 01 — Chào hỏi & Giao tiếp cơ bản",
    "description": "Chào hỏi, tạm biệt, cảm ơn, xin lỗi, đáp lời lịch sự và các câu giao tiếp cơ bản.",
    "vocabularies": [
      {
        "vocabId": 296,
        "hanzi": "请",
        "pinyin": "qǐng",
        "meaningHanViet": "Thỉnh",
        "meaningVi": "Mời; mời mọc",
        "exampleSentence": "请进，请坐。",
        "exampleTranslation": "Mời vào, mời ngồi."
      },
      {
        "vocabId": 505,
        "hanzi": "请问",
        "pinyin": "qǐngwèn",
        "meaningHanViet": "Thỉnh Vấn",
        "meaningVi": "Xin hỏi; cho hỏi",
        "exampleSentence": "请问，洗手间在哪里？",
        "exampleTranslation": "Xin hỏi, nhà vệ sinh ở đâu?"
      },
      {
        "vocabId": 410,
        "hanzi": "谢谢",
        "pinyin": "xièxie",
        "meaningHanViet": "Tạ Tạ",
        "meaningVi": "Cảm ơn; cảm tạ",
        "exampleSentence": "谢谢你的帮助。",
        "exampleTranslation": "Cảm ơn sự giúp đỡ của bạn."
      },
      {
        "vocabId": 32,
        "hanzi": "不客气",
        "pinyin": "bú kèqi",
        "meaningHanViet": "Bất Khách Khí",
        "meaningVi": "Không có chi; đừng khách sáo",
        "exampleSentence": "不用谢，不客气。",
        "exampleTranslation": "Không cần cảm ơn, đừng khách sáo."
      },
      {
        "vocabId": 93,
        "hanzi": "对不起",
        "pinyin": "duìbuqǐ",
        "meaningHanViet": "Đối Bất Khởi",
        "meaningVi": "Xin lỗi",
        "exampleSentence": "对不起，我迟到了。",
        "exampleTranslation": "Xin lỗi, tôi đến muộn."
      },
      {
        "vocabId": 233,
        "hanzi": "没关系",
        "pinyin": "méi guānxi",
        "meaningHanViet": "Một Quan Hệ",
        "meaningVi": "Không sao; không có chi",
        "exampleSentence": "没关系，不要紧。",
        "exampleTranslation": "Không sao đâu, không có gì nghiêm trọng."
      },
      {
        "vocabId": 515,
        "hanzi": "没事",
        "pinyin": "méishì",
        "meaningHanViet": "Một Sự",
        "meaningVi": "Không sao đâu; không có việc gì",
        "exampleSentence": "别担心，我没事。",
        "exampleTranslation": "Đừng lo, tôi không sao."
      },
      {
        "vocabId": 454,
        "hanzi": "再见",
        "pinyin": "zàijiàn",
        "meaningHanViet": "Tái Kiến",
        "meaningVi": "Tạm biệt; hẹn gặp lại",
        "exampleSentence": "明天见，再见！",
        "exampleTranslation": "Ngày mai gặp nhé, tạm biệt!"
      },
      {
        "vocabId": 518,
        "hanzi": "你好",
        "pinyin": "nǐ hǎo",
        "meaningHanViet": "Nễ Hảo",
        "meaningVi": "Xin chào",
        "exampleSentence": "你好！很高兴认识你。",
        "exampleTranslation": "Xin chào! Rất vui được quen biết bạn."
      },
      {
        "vocabId": 274,
        "hanzi": "您好",
        "pinyin": "nín hǎo",
        "meaningHanViet": "Nâm Hảo",
        "meaningVi": "Kính chào ngài; chào bác",
        "exampleSentence": "老师，您好！",
        "exampleTranslation": "Thưa thầy, chúng em chào thầy!"
      },
      {
        "vocabId": 379,
        "hanzi": "问",
        "pinyin": "wèn",
        "meaningHanViet": "Vấn",
        "meaningVi": "Hỏi",
        "exampleSentence": "我想问你一个问题。",
        "exampleTranslation": "Tôi muốn hỏi bạn một câu hỏi."
      },
      {
        "vocabId": 349,
        "hanzi": "说",
        "pinyin": "shuō",
        "meaningHanViet": "Thuyết",
        "meaningVi": "Nói",
        "exampleSentence": "请说慢一点儿。",
        "exampleTranslation": "Xin hãy nói chậm lại một chút."
      },
      {
        "vocabId": 350,
        "hanzi": "说话",
        "pinyin": "shuōhuà",
        "meaningHanViet": "Thuyết Thoại",
        "meaningVi": "Nói chuyện; trò chuyện",
        "exampleSentence": "他们正在说话。",
        "exampleTranslation": "Họ đang nói chuyện."
      },
      {
        "vocabId": 173,
        "hanzi": "见",
        "pinyin": "jiàn",
        "meaningHanViet": "Kiến",
        "meaningVi": "Gặp; nhìn thấy",
        "exampleSentence": "明天我们在学校见。",
        "exampleTranslation": "Ngày mai chúng ta gặp nhau ở trường."
      },
      {
        "vocabId": 306,
        "hanzi": "认识",
        "pinyin": "rènshi",
        "meaningHanViet": "Nhận Thức",
        "meaningVi": "Quen biết; hiểu rõ",
        "exampleSentence": "认识你很高兴。",
        "exampleTranslation": "Rất vui được quen biết bạn."
      },
      {
        "vocabId": 138,
        "hanzi": "好",
        "pinyin": "hǎo",
        "meaningHanViet": "Hảo",
        "meaningVi": "Tốt; đẹp; xong",
        "exampleSentence": "今天天气很好。",
        "exampleTranslation": "Thời tiết hôm nay rất đẹp."
      },
      {
        "vocabId": 92,
        "hanzi": "对",
        "pinyin": "duì",
        "meaningHanViet": "Đối",
        "meaningVi": "Đúng; chính xác; đối với",
        "exampleSentence": "你说得很对。",
        "exampleTranslation": "Bạn nói rất đúng."
      },
      {
        "vocabId": 34,
        "hanzi": "不",
        "pinyin": "bù",
        "meaningHanViet": "Bất",
        "meaningVi": "Không; chưa",
        "exampleSentence": "我不是学生。",
        "exampleTranslation": "Tôi không phải là học sinh."
      },
      {
        "vocabId": 416,
        "hanzi": "行",
        "pinyin": "xíng",
        "meaningHanViet": "Hành",
        "meaningVi": "Được; đi được",
        "exampleSentence": "你看这样行不行？",
        "exampleTranslation": "Bạn xem thế này có được không?"
      },
      {
        "vocabId": 5,
        "hanzi": "吧",
        "pinyin": "ba",
        "meaningHanViet": "Ba",
        "meaningVi": "Nhé; thôi; đi (trợ từ)",
        "exampleSentence": "我们一起走吧。",
        "exampleTranslation": "Chúng ta cùng đi thôi nào."
      }
    ]
  },
  {
    "topicId": 2,
    "backendLessonId": 6,
    "title": "Bài 02 — Phương tiện, Trường học & Thiết bị",
    "description": "Phương tiện đi lại, trường học, liên lạc điện thoại và giải trí phim ảnh.",
    "vocabularies": [
      {
        "vocabId": 46,
        "hanzi": "吃",
        "pinyin": "chī",
        "meaningHanViet": "Cật",
        "meaningVi": "Ăn; tiêu thụ; ăn ở",
        "exampleSentence": "你想吃什么？",
        "exampleTranslation": "Bạn muốn ăn gì?"
      },
      {
        "vocabId": 504,
        "hanzi": "出租车",
        "pinyin": "chūzūchē",
        "meaningHanViet": "Xuất Tô Xa",
        "meaningVi": "Xe taxi",
        "exampleSentence": "我们坐出租车去机场吧。",
        "exampleTranslation": "Chúng ta đi taxi ra sân bay nhé."
      },
      {
        "vocabId": 51,
        "hanzi": "穿",
        "pinyin": "chuān",
        "meaningHanViet": "Xuyên",
        "meaningVi": "Mặc (áo); đi (giày)",
        "exampleSentence": "今天很冷，多穿点衣服。",
        "exampleTranslation": "Hôm nay rất lạnh, hãy mặc nhiều áo một chút."
      },
      {
        "vocabId": 58,
        "hanzi": "打电话",
        "pinyin": "dǎ diànhuà",
        "meaningHanViet": "Đả Điện Thoại",
        "meaningVi": "Gọi điện thoại",
        "exampleSentence": "他正在给妈妈打电话。",
        "exampleTranslation": "Anh ấy đang gọi điện thoại cho mẹ."
      },
      {
        "vocabId": 61,
        "hanzi": "大",
        "pinyin": "dà",
        "meaningHanViet": "Đại",
        "meaningVi": "Lớn; to",
        "exampleSentence": "这个西瓜很大。",
        "exampleTranslation": "Quả dưa hấu này rất to."
      },
      {
        "vocabId": 505,
        "hanzi": "大家",
        "pinyin": "dàjiā",
        "meaningHanViet": "Đại Gia",
        "meaningVi": "Mọi người, tất cả mọi người",
        "exampleSentence": "大家好，欢迎来到中文班。",
        "exampleTranslation": "Chào mọi người, hoan nghênh đến với lớp tiếng Trung."
      },
      {
        "vocabId": 62,
        "hanzi": "大学",
        "pinyin": "dàxué",
        "meaningHanViet": "Đại Học",
        "meaningVi": "Trường đại học, đại học",
        "exampleSentence": "他是北京大学的学生。",
        "exampleTranslation": "Anh ấy là sinh viên Đại học Bắc Kinh."
      },
      {
        "vocabId": 63,
        "hanzi": "大学生",
        "pinyin": "dàxuéshēng",
        "meaningHanViet": "Đại Học Sinh",
        "meaningVi": "Sinh viên đại học; sinh viên cao đẳng",
        "exampleSentence": "我的哥哥是一名大学生。",
        "exampleTranslation": "Anh trai tôi là một sinh viên đại học."
      },
      {
        "vocabId": 64,
        "hanzi": "到",
        "pinyin": "dào",
        "meaningHanViet": "Đáo",
        "meaningVi": "Đến; tới",
        "exampleSentence": "我们到了火车站。",
        "exampleTranslation": "Chúng tôi đã đến ga xe lửa rồi."
      },
      {
        "vocabId": 67,
        "hanzi": "的",
        "pinyin": "de",
        "meaningHanViet": "Đích",
        "meaningVi": "Của; trợ từ sở hữu hoặc bổ nghĩa",
        "exampleSentence": "这是我的汉语书。",
        "exampleTranslation": "Đây là sách tiếng Trung của tôi."
      },
      {
        "vocabId": 75,
        "hanzi": "第",
        "pinyin": "dì",
        "meaningHanViet": "Đệ",
        "meaningVi": "Thứ, đệ (tiền tố đặt trước số thứ tự)",
        "exampleSentence": "他是第一个到教室的人。",
        "exampleTranslation": "Anh ấy là người đầu tiên đến lớp học."
      },
      {
        "vocabId": 74,
        "hanzi": "弟弟",
        "pinyin": "dìdi",
        "meaningHanViet": "Đệ Đệ",
        "meaningVi": "Em trai",
        "exampleSentence": "我弟弟今年十岁。",
        "exampleTranslation": "Em trai tôi năm nay mười tuổi."
      },
      {
        "vocabId": 76,
        "hanzi": "点",
        "pinyin": "diǎn",
        "meaningHanViet": "Điểm",
        "meaningVi": "Giờ; điểm; chấm; chút ít",
        "exampleSentence": "现在是早上八点。",
        "exampleTranslation": "Bây giờ là tám giờ sáng."
      },
      {
        "vocabId": 506,
        "hanzi": "店",
        "pinyin": "diàn",
        "meaningHanViet": "Điếm",
        "meaningVi": "Cửa hàng, tiệm",
        "exampleSentence": "学校旁边有一家书店。",
        "exampleTranslation": "Bên cạnh trường học có một hiệu sách."
      },
      {
        "vocabId": 78,
        "hanzi": "电话",
        "pinyin": "diànhuà",
        "meaningHanViet": "Điện Thoại",
        "meaningVi": "Điện thoại; cuộc gọi điện thoại",
        "exampleSentence": "请告诉我你的电话号码。",
        "exampleTranslation": "Xin hãy cho tôi biết số điện thoại của bạn."
      },
      {
        "vocabId": 79,
        "hanzi": "电脑",
        "pinyin": "diànnǎo",
        "meaningHanViet": "Điện Não",
        "meaningVi": "Máy tính",
        "exampleSentence": "我买了一台新电脑。",
        "exampleTranslation": "Tôi đã mua một chiếc máy tính mới."
      },
      {
        "vocabId": 80,
        "hanzi": "电视",
        "pinyin": "diànshì",
        "meaningHanViet": "Điện Thị",
        "meaningVi": "Truyền hình; TV",
        "exampleSentence": "晚上我们一家人看电视。",
        "exampleTranslation": "Buổi tối cả nhà chúng tôi cùng xem ti vi."
      },
      {
        "vocabId": 82,
        "hanzi": "电影",
        "pinyin": "diànyǐng",
        "meaningHanViet": "Điện Ảnh",
        "meaningVi": "Phim; điện ảnh",
        "exampleSentence": "明天我们去看电影吧。",
        "exampleTranslation": "Ngày mai chúng ta đi xem phim nhé."
      },
      {
        "vocabId": 83,
        "hanzi": "电影院",
        "pinyin": "diànyǐngyuàn",
        "meaningHanViet": "Điện Ảnh Viện",
        "meaningVi": "Rạp chiếu phim; rạp phim",
        "exampleSentence": "电影院在商场三楼。",
        "exampleTranslation": "Rạp chiếu phim ở tầng ba trung tâm thương mại."
      },
      {
        "vocabId": 86,
        "hanzi": "东西",
        "pinyin": "dōngxi",
        "meaningHanViet": "Đông Tây",
        "meaningVi": "Đồ vật, đồ đạc, cái",
        "exampleSentence": "桌子上放着很多东西。",
        "exampleTranslation": "Trên bàn đặt rất nhiều đồ đạc."
      }
    ]
  },
  {
    "topicId": 3,
    "backendLessonId": 7,
    "title": "Bài 03 — Thời gian, Ăn uống & Cảm xúc",
    "description": "Bữa ăn, nhà hàng, đơn vị thời gian và các biểu đạt cảm xúc vui tươi.",
    "vocabularies": [
      {
        "vocabId": 89,
        "hanzi": "都",
        "pinyin": "dōu",
        "meaningHanViet": "Đô",
        "meaningVi": "Đều; tất cả",
        "exampleSentence": "我们都是学习汉语的学生。",
        "exampleTranslation": "Chúng tôi đều là những học sinh học tiếng Trung."
      },
      {
        "vocabId": 90,
        "hanzi": "读",
        "pinyin": "dú",
        "meaningHanViet": "Độc",
        "meaningVi": "Đọc; học tập",
        "exampleSentence": "请大声读这段课文。",
        "exampleTranslation": "Xin hãy đọc to đoạn bài khóa này."
      },
      {
        "vocabId": 91,
        "hanzi": "读书",
        "pinyin": "dúshū",
        "meaningHanViet": "Độc Thư",
        "meaningVi": "Đọc sách; học",
        "exampleSentence": "他每天晚上都认真读书。",
        "exampleTranslation": "Mỗi tối anh ấy đều chăm chỉ đọc sách."
      },
      {
        "vocabId": 92,
        "hanzi": "对",
        "pinyin": "duì",
        "meaningHanViet": "Đối",
        "meaningVi": "Đúng; chính xác; đối với",
        "exampleSentence": "你回答得非常对。",
        "exampleTranslation": "Bạn trả lời rất chính xác."
      },
      {
        "vocabId": 93,
        "hanzi": "对不起",
        "pinyin": "duìbuqǐ",
        "meaningHanViet": "Đối Bất Khởi",
        "meaningVi": "Tôi xin lỗi; xin thứ lỗi; tôi xin tha thứ; làm  thất vọng; không đạt kỳ vọng",
        "exampleSentence": "对不起，我来晚了。",
        "exampleTranslation": "Xin lỗi, tôi đến muộn."
      },
      {
        "vocabId": 94,
        "hanzi": "多",
        "pinyin": "duō",
        "meaningHanViet": "Đa",
        "meaningVi": "Nhiều",
        "exampleSentence": "学校里有很多学生。",
        "exampleTranslation": "Trong trường có rất nhiều học sinh."
      },
      {
        "vocabId": 95,
        "hanzi": "多少",
        "pinyin": "duōshao",
        "meaningHanViet": "Đa Thiểu",
        "meaningVi": "Số lượng; mức độ; phần nào",
        "exampleSentence": "请问这个西瓜多少钱？",
        "exampleTranslation": "Xin hỏi quả dưa hấu này bao nhiêu tiền?"
      },
      {
        "vocabId": 97,
        "hanzi": "儿子",
        "pinyin": "érzi",
        "meaningHanViet": "Nhi Tử",
        "meaningVi": "Con trai",
        "exampleSentence": "他的儿子很聪明。",
        "exampleTranslation": "Con trai của anh ấy rất thông minh."
      },
      {
        "vocabId": 98,
        "hanzi": "二",
        "pinyin": "èr",
        "meaningHanViet": "Nhị",
        "meaningVi": "Hai; 2",
        "exampleSentence": "一加一等于二。",
        "exampleTranslation": "Một cộng một bằng hai."
      },
      {
        "vocabId": 99,
        "hanzi": "饭",
        "pinyin": "fàn",
        "meaningHanViet": "Phạn",
        "meaningVi": "Cơm đã nấu; bữa ăn",
        "exampleSentence": "今天的米饭很香。",
        "exampleTranslation": "Cơm hôm nay rất thơm ngon."
      },
      {
        "vocabId": 100,
        "hanzi": "饭店",
        "pinyin": "fàndiàn",
        "meaningHanViet": "Phạn Điếm",
        "meaningVi": "Nhà hàng; khách sạn",
        "exampleSentence": "我们在饭店吃晚饭。",
        "exampleTranslation": "Chúng tôi ăn tối ở nhà hàng."
      },
      {
        "vocabId": 101,
        "hanzi": "房间",
        "pinyin": "fángjiān",
        "meaningHanViet": "Phòng Gian",
        "meaningVi": "Phòng",
        "exampleSentence": "我的房间很干净。",
        "exampleTranslation": "Phòng của tôi rất sạch sẽ."
      },
      {
        "vocabId": 108,
        "hanzi": "非常",
        "pinyin": "fēicháng",
        "meaningHanViet": "Phi Thường",
        "meaningVi": "Rất; thực sự; khác thường; phi thường",
        "exampleSentence": "这本书非常有意思。",
        "exampleTranslation": "Cuốn sách này vô cùng thú vị."
      },
      {
        "vocabId": 107,
        "hanzi": "飞机",
        "pinyin": "fēijī",
        "meaningHanViet": "Phi Cơ",
        "meaningVi": "Máy bay",
        "exampleSentence": "我坐飞机去北京。",
        "exampleTranslation": "Tôi đi máy bay đến Bắc Kinh."
      },
      {
        "vocabId": 109,
        "hanzi": "分",
        "pinyin": "fēn",
        "meaningHanViet": "Phân",
        "meaningVi": "Phút; điểm; phân chia",
        "exampleSentence": "现在是八点十分。",
        "exampleTranslation": "Bây giờ là tám giờ mười phút."
      },
      {
        "vocabId": 507,
        "hanzi": "分钟",
        "pinyin": "fēnzhōng",
        "meaningHanViet": "Phân Chung",
        "meaningVi": "Phút (thời gian)",
        "exampleSentence": "请等我十分钟。",
        "exampleTranslation": "Xin hãy đợi tôi mười phút."
      },
      {
        "vocabId": 116,
        "hanzi": "高兴",
        "pinyin": "gāoxìng",
        "meaningHanViet": "Cao Hưng",
        "meaningVi": "Vui; vui vẻ",
        "exampleSentence": "见到你我很高兴。",
        "exampleTranslation": "Gặp được bạn tôi rất vui mừng."
      },
      {
        "vocabId": 119,
        "hanzi": "歌",
        "pinyin": "gē",
        "meaningHanViet": "Ca",
        "meaningVi": "Bài hát; hát",
        "exampleSentence": "这首歌真好听。",
        "exampleTranslation": "Bài hát này thật hay."
      },
      {
        "vocabId": 118,
        "hanzi": "哥哥",
        "pinyin": "gēge",
        "meaningHanViet": "Ca Ca",
        "meaningVi": "Anh trai",
        "exampleSentence": "我哥哥在大学读书。",
        "exampleTranslation": "Anh trai tôi đang học ở trường đại học."
      },
      {
        "vocabId": 120,
        "hanzi": "个",
        "pinyin": "gè",
        "meaningHanViet": "Cá",
        "meaningVi": "Cái; quả; con; lượng từ chung",
        "exampleSentence": "我买了一个苹果。",
        "exampleTranslation": "Tôi đã mua một quả táo."
      }
    ]
  },
  {
    "topicId": 4,
    "backendLessonId": 8,
    "title": "Bài 04 — Công việc, Ngôn ngữ & Tính từ cơ bản",
    "description": "Môi trường công sở, ngôn ngữ tiếng Trung và các tính từ mô tả thường gặp.",
    "vocabularies": [
      {
        "vocabId": 121,
        "hanzi": "给",
        "pinyin": "gěi",
        "meaningHanViet": "Cấp",
        "meaningVi": "Cho; đưa cho",
        "exampleSentence": "请给我一杯水。",
        "exampleTranslation": "Xin cho tôi một cốc nước."
      },
      {
        "vocabId": 508,
        "hanzi": "公司",
        "pinyin": "gōngsī",
        "meaningHanViet": "Công Ty",
        "meaningVi": "Công ty",
        "exampleSentence": "我哥哥在一家电脑公司工作。",
        "exampleTranslation": "Anh trai tôi làm việc ở một công ty máy tính."
      },
      {
        "vocabId": 124,
        "hanzi": "工作",
        "pinyin": "gōngzuò",
        "meaningHanViet": "Công Tác",
        "meaningVi": "Làm việc; vận hành",
        "exampleSentence": "他在医院工作。",
        "exampleTranslation": "Anh ấy làm việc ở bệnh viện."
      },
      {
        "vocabId": 509,
        "hanzi": "狗",
        "pinyin": "gǒu",
        "meaningHanViet": "Cẩu",
        "meaningVi": "Con chó",
        "exampleSentence": "他家养了一只可爱的小狗。",
        "exampleTranslation": "Nhà anh ấy nuôi một chú chó nhỏ đáng yêu."
      },
      {
        "vocabId": 127,
        "hanzi": "贵",
        "pinyin": "guì",
        "meaningHanViet": "Quý",
        "meaningVi": "Đắt; được coi trọng; quý giá",
        "exampleSentence": "这件衣服有点贵。",
        "exampleTranslation": "Chiếc áo này hơi đắt một chút."
      },
      {
        "vocabId": 128,
        "hanzi": "国",
        "pinyin": "guó",
        "meaningHanViet": "Quốc",
        "meaningVi": "Quốc gia, đất nước",
        "exampleSentence": "中国是一个历史悠久的国度。",
        "exampleTranslation": "Trung Quốc là một quốc gia có lịch sử lâu đời."
      },
      {
        "vocabId": 132,
        "hanzi": "还",
        "pinyin": "hái",
        "meaningHanViet": "Hoàn",
        "meaningVi": "Vẫn, còn, hơn nữa",
        "exampleSentence": "我吃饱了，还想喝点水。",
        "exampleTranslation": "Tôi ăn no rồi, vẫn muốn uống chút nước."
      },
      {
        "vocabId": 135,
        "hanzi": "孩子",
        "pinyin": "háizi",
        "meaningHanViet": "Hài Tử",
        "meaningVi": "Trẻ em",
        "exampleSentence": "孩子们在操场上玩。",
        "exampleTranslation": "Lũ trẻ đang chơi đùa trên sân tập."
      },
      {
        "vocabId": 136,
        "hanzi": "汉语",
        "pinyin": "Hànyǔ",
        "meaningHanViet": "Hán Ngữ",
        "meaningVi": "Ngôn ngữ tiếng Trung",
        "exampleSentence": "学汉语很有趣。",
        "exampleTranslation": "Học tiếng Trung rất thú vị."
      },
      {
        "vocabId": 137,
        "hanzi": "汉字",
        "pinyin": "Hànzì",
        "meaningHanViet": "Hán Tự",
        "meaningVi": "Chữ Hán; Nhật: kanji",
        "exampleSentence": "这个汉字很好写。",
        "exampleTranslation": "Chữ Hán này rất dễ viết."
      },
      {
        "vocabId": 138,
        "hanzi": "好",
        "pinyin": "hǎo",
        "meaningHanViet": "Hảo",
        "meaningVi": "Tốt; đẹp; xong",
        "exampleSentence": "今天天气真好。",
        "exampleTranslation": "Hôm nay thời tiết thật đẹp."
      },
      {
        "vocabId": 139,
        "hanzi": "好吃",
        "pinyin": "hǎochī",
        "meaningHanViet": "Hảo Cật",
        "meaningVi": "Ngon; ngon miệng",
        "exampleSentence": "妈妈做的菜真好吃。",
        "exampleTranslation": "Món ăn mẹ nấu thật là ngon."
      },
      {
        "vocabId": 140,
        "hanzi": "好看",
        "pinyin": "hǎokàn",
        "meaningHanViet": "Hảo Khán",
        "meaningVi": "Ưa nhìn; xinh đẹp",
        "exampleSentence": "这部电影很好看。",
        "exampleTranslation": "Bộ phim này xem rất hay."
      },
      {
        "vocabId": 141,
        "hanzi": "好听",
        "pinyin": "hǎotīng",
        "meaningHanViet": "Hảo Thính",
        "meaningVi": "Nghe hay",
        "exampleSentence": "这首音乐真好听。",
        "exampleTranslation": "Bản nhạc này thật là hay."
      },
      {
        "vocabId": 142,
        "hanzi": "好玩儿",
        "pinyin": "hǎowánr",
        "meaningHanViet": "Hảo Ngoạn Nhi",
        "meaningVi": "Thú vị, vui, vui nhộn",
        "exampleSentence": "这个公园真好玩儿。",
        "exampleTranslation": "Công viên này thật vui vẻ."
      },
      {
        "vocabId": 143,
        "hanzi": "号",
        "pinyin": "hào",
        "meaningHanViet": "Hiệu",
        "meaningVi": "Số; ngày (trong tháng)",
        "exampleSentence": "今天是十月一号。",
        "exampleTranslation": "Hôm nay là ngày một tháng mười."
      },
      {
        "vocabId": 144,
        "hanzi": "喝",
        "pinyin": "hē",
        "meaningHanViet": "Hát",
        "meaningVi": "Uống",
        "exampleSentence": "请喝热茶。",
        "exampleTranslation": "Xin mời uống trà nóng."
      },
      {
        "vocabId": 145,
        "hanzi": "和",
        "pinyin": "hé",
        "meaningHanViet": "Hoà",
        "meaningVi": "Và; cùng với; hòa thuận",
        "exampleSentence": "我和他是好朋友。",
        "exampleTranslation": "Tôi và anh ấy là bạn tốt của nhau."
      },
      {
        "vocabId": 146,
        "hanzi": "很",
        "pinyin": "hěn",
        "meaningHanViet": "Ngận",
        "meaningVi": "Rất; lắm",
        "exampleSentence": "我今天很高兴。",
        "exampleTranslation": "Hôm nay tôi rất vui."
      },
      {
        "vocabId": 147,
        "hanzi": "后",
        "pinyin": "hòu",
        "meaningHanViet": "Hậu",
        "meaningVi": "Sau; phía sau",
        "exampleSentence": "三天后我们再见面。",
        "exampleTranslation": "Ba ngày sau chúng ta lại gặp nhau."
      }
    ]
  },
  {
    "topicId": 5,
    "backendLessonId": 9,
    "title": "Bài 05 — Thời gian, Gia đình & Hoạt động thường nhật",
    "description": "Các mốc thời gian trong năm, thành viên gia đình và hoạt động hàng ngày.",
    "vocabularies": [
      {
        "vocabId": 154,
        "hanzi": "回",
        "pinyin": "huí",
        "meaningHanViet": "Hồi",
        "meaningVi": "Xoay vòng; quay lại",
        "exampleSentence": "下课后我回家。",
        "exampleTranslation": "Sau khi tan học tôi về nhà."
      },
      {
        "vocabId": 160,
        "hanzi": "会",
        "pinyin": "huì",
        "meaningHanViet": "Hội",
        "meaningVi": "Biết, sẽ, có thể",
        "exampleSentence": "我会说汉语。",
        "exampleTranslation": "Tôi biết nói tiếng Trung."
      },
      {
        "vocabId": 161,
        "hanzi": "火车",
        "pinyin": "huǒchē",
        "meaningHanViet": "Hoả Xa",
        "meaningVi": "Tàu hỏa",
        "exampleSentence": "坐火车去旅行很舒服。",
        "exampleTranslation": "Đi tàu hỏa du lịch rất thoải mái."
      },
      {
        "vocabId": 164,
        "hanzi": "鸡蛋",
        "pinyin": "jīdàn",
        "meaningHanViet": "Kê Đản",
        "meaningVi": "Trứng; trứng gà",
        "exampleSentence": "早上我吃了一个鸡蛋。",
        "exampleTranslation": "Buổi sáng tôi đã ăn một quả trứng gà."
      },
      {
        "vocabId": 165,
        "hanzi": "几",
        "pinyin": "jǐ",
        "meaningHanViet": "Kỷ",
        "meaningVi": "Mấy; vài",
        "exampleSentence": "你家里有几口人？",
        "exampleTranslation": "Nhà bạn có mấy người?"
      },
      {
        "vocabId": 169,
        "hanzi": "家",
        "pinyin": "jiā",
        "meaningHanViet": "Gia",
        "meaningVi": "Nhà, gia đình; nhà (chuyên gia)",
        "exampleSentence": "我家在河内。",
        "exampleTranslation": "Nhà tôi ở Hà Nội."
      },
      {
        "vocabId": 171,
        "hanzi": "家人",
        "pinyin": "jiārén",
        "meaningHanViet": "Gia Nhân",
        "meaningVi": "Thành viên gia đình; người hầu",
        "exampleSentence": "我和家人一起生活。",
        "exampleTranslation": "Tôi sống cùng với người nhà."
      },
      {
        "vocabId": 173,
        "hanzi": "见",
        "pinyin": "jiàn",
        "meaningHanViet": "Kiến",
        "meaningVi": "Gặp; thấy",
        "exampleSentence": "明天见！",
        "exampleTranslation": "Hẹn gặp lại ngày mai!"
      },
      {
        "vocabId": 510,
        "hanzi": "件",
        "pinyin": "jiàn",
        "meaningHanViet": "Kiện",
        "meaningVi": "Chiếc, cái, kiện (lượng từ cho quần áo, sự việc)",
        "exampleSentence": "这件衣服很漂亮。",
        "exampleTranslation": "Chiếc áo này rất đẹp."
      },
      {
        "vocabId": 511,
        "hanzi": "饺子",
        "pinyin": "jiǎozi",
        "meaningHanViet": "Giảo Tử",
        "meaningVi": "Bánh sủi cảo, bánh chẻo",
        "exampleSentence": "中国人过年常常吃饺子。",
        "exampleTranslation": "Người Trung Quốc ăn Tết thường ăn sủi cảo."
      },
      {
        "vocabId": 176,
        "hanzi": "叫",
        "pinyin": "jiào",
        "meaningHanViet": "Khiếu",
        "meaningVi": "Kêu; gọi; tên là",
        "exampleSentence": "我叫王明。",
        "exampleTranslation": "Tôi tên là Vương Minh."
      },
      {
        "vocabId": 178,
        "hanzi": "姐姐",
        "pinyin": "jiějie",
        "meaningHanViet": "Tỷ Tỷ",
        "meaningVi": "Chị gái",
        "exampleSentence": "我姐姐在医院当护士。",
        "exampleTranslation": "Chị gái tôi làm y tá ở bệnh viện."
      },
      {
        "vocabId": 180,
        "hanzi": "今年",
        "pinyin": "jīnnián",
        "meaningHanViet": "Kim Niên",
        "meaningVi": "Năm nay",
        "exampleSentence": "我今年十八岁。",
        "exampleTranslation": "Tôi năm nay mười tám tuổi."
      },
      {
        "vocabId": 181,
        "hanzi": "今天",
        "pinyin": "jīntiān",
        "meaningHanViet": "Kim Thiên",
        "meaningVi": "Hôm nay; thời điểm hiện tại; bây giờ",
        "exampleSentence": "今天星期一。",
        "exampleTranslation": "Hôm nay là thứ hai."
      },
      {
        "vocabId": 185,
        "hanzi": "九",
        "pinyin": "jiǔ",
        "meaningHanViet": "Cửu",
        "meaningVi": "Chín; 9",
        "exampleSentence": "教室里有九张桌子。",
        "exampleTranslation": "Trong lớp học có chín chiếc bàn."
      },
      {
        "vocabId": 187,
        "hanzi": "觉得",
        "pinyin": "juéde",
        "meaningHanViet": "Giác Đắc",
        "meaningVi": "Nghĩ rằng ...; cảm thấy rằng ...; cảm thấy",
        "exampleSentence": "我觉得汉语很有趣。",
        "exampleTranslation": "Tôi cảm thấy tiếng Trung rất thú vị."
      },
      {
        "vocabId": 188,
        "hanzi": "开",
        "pinyin": "kāi",
        "meaningHanViet": "Khai",
        "meaningVi": "Mở; lái (xe); bật",
        "exampleSentence": "请开一下窗户。",
        "exampleTranslation": "Xin mở cửa sổ ra một chút."
      },
      {
        "vocabId": 189,
        "hanzi": "开车",
        "pinyin": "kāichē",
        "meaningHanViet": "Khai Xa",
        "meaningVi": "Lái xe",
        "exampleSentence": "爸爸开车送我去学校。",
        "exampleTranslation": "Bố lái xe đưa tôi đến trường."
      },
      {
        "vocabId": 192,
        "hanzi": "看",
        "pinyin": "kàn",
        "meaningHanViet": "Khán",
        "meaningVi": "Nhìn; xem; thăm",
        "exampleSentence": "你在看什么书？",
        "exampleTranslation": "Bạn đang xem cuốn sách gì thế?"
      },
      {
        "vocabId": 193,
        "hanzi": "看病",
        "pinyin": "kànbìng",
        "meaningHanViet": "Khán Bệnh",
        "meaningVi": "Đi khám bệnh; khám bệnh nhân",
        "exampleSentence": "他觉得不舒服，去医院看病。",
        "exampleTranslation": "Anh ấy cảm thấy không khỏe, đi bệnh viện khám bệnh."
      }
    ]
  },
  {
    "topicId": 6,
    "backendLessonId": 10,
    "title": "Bài 06 — Mua bán, Thầy cô & Số đếm",
    "description": "Hoạt động mua bán, trao đổi, thầy cô trường lớp và các số đếm căn bản.",
    "vocabularies": [
      {
        "vocabId": 195,
        "hanzi": "看见",
        "pinyin": "kànjiàn",
        "meaningHanViet": "Khán Kiến",
        "meaningVi": "Nhìn thấy; bắt gặp",
        "exampleSentence": "我看见了一只可爱的小猫。",
        "exampleTranslation": "Tôi nhìn thấy một chú mèo con đáng yêu."
      },
      {
        "vocabId": 512,
        "hanzi": "可以",
        "pinyin": "kěyǐ",
        "meaningHanViet": "Khả Dĩ",
        "meaningVi": "Có thể, được phép",
        "exampleSentence": "我可以借用一下你的笔吗？",
        "exampleTranslation": "Tôi có thể mượn bút của bạn một chút không?"
      },
      {
        "vocabId": 199,
        "hanzi": "课",
        "pinyin": "kè",
        "meaningHanViet": "Khoá",
        "meaningVi": "Môn học; khoá học",
        "exampleSentence": "今天下午我们有两节课。",
        "exampleTranslation": "Chiều nay chúng tôi có hai tiết học."
      },
      {
        "vocabId": 202,
        "hanzi": "口",
        "pinyin": "kǒu",
        "meaningHanViet": "Khẩu",
        "meaningVi": "Miệng; lượng từ cho những thứ có miệng",
        "exampleSentence": "我家有四口人。",
        "exampleTranslation": "Nhà tôi có bốn người."
      },
      {
        "vocabId": 203,
        "hanzi": "块",
        "pinyin": "kuài",
        "meaningHanViet": "Khối",
        "meaningVi": "Cục; tảng; miếng; lượng từ cho miếng vải, bánh, xà phòng, v.v.",
        "exampleSentence": "这块手表很漂亮。",
        "exampleTranslation": "Chiếc đồng hồ này rất đẹp."
      },
      {
        "vocabId": 205,
        "hanzi": "来",
        "pinyin": "lái",
        "meaningHanViet": "Lai",
        "meaningVi": "Đến; tới",
        "exampleSentence": "欢迎你来到我们学校。",
        "exampleTranslation": "Hoan nghênh bạn đến trường của chúng tôi."
      },
      {
        "vocabId": 209,
        "hanzi": "老师",
        "pinyin": "lǎoshī",
        "meaningHanViet": "Lão Sư",
        "meaningVi": "Giáo viên",
        "exampleSentence": "张老师教我们中国历史。",
        "exampleTranslation": "Cô Trương dạy chúng tôi lịch sử Trung Quốc."
      },
      {
        "vocabId": 210,
        "hanzi": "了",
        "pinyin": "le",
        "meaningHanViet": "Liễu",
        "meaningVi": "Rồi; đã (trợ từ ngữ khí/thời thái)",
        "exampleSentence": "下雨了，带上伞吧。",
        "exampleTranslation": "Trời mưa rồi, mang theo ô đi nhé."
      },
      {
        "vocabId": 212,
        "hanzi": "冷",
        "pinyin": "lěng",
        "meaningHanViet": "Lãnh",
        "meaningVi": "Lạnh",
        "exampleSentence": "冬天的北京很冷。",
        "exampleTranslation": "Mùa đông ở Bắc Kinh rất lạnh."
      },
      {
        "vocabId": 213,
        "hanzi": "里",
        "pinyin": "lǐ",
        "meaningHanViet": "Lý",
        "meaningVi": "Trong; bên trong",
        "exampleSentence": "书包里有课本和笔。",
        "exampleTranslation": "Trong cặp sách có sách giáo khoa và bút."
      },
      {
        "vocabId": 215,
        "hanzi": "两",
        "pinyin": "liǎng",
        "meaningHanViet": "Lưỡng",
        "meaningVi": "Hai; cả hai",
        "exampleSentence": "我有两个好朋友。",
        "exampleTranslation": "Tôi có hai người bạn tốt."
      },
      {
        "vocabId": 216,
        "hanzi": "零",
        "pinyin": "líng",
        "meaningHanViet": "Linh",
        "meaningVi": "Không; số không",
        "exampleSentence": "今天的气温是零度。",
        "exampleTranslation": "Nhiệt độ hôm nay là không độ."
      },
      {
        "vocabId": 217,
        "hanzi": "六",
        "pinyin": "liù",
        "meaningHanViet": "Lục",
        "meaningVi": "Sáu; 6",
        "exampleSentence": "一星期有六天需要上学。",
        "exampleTranslation": "Một tuần có sáu ngày cần đi học."
      },
      {
        "vocabId": 224,
        "hanzi": "妈妈",
        "pinyin": "māma",
        "meaningHanViet": "Ma Ma",
        "meaningVi": "Mẹ; má",
        "exampleSentence": "妈妈每天都为我们做饭。",
        "exampleTranslation": "Mẹ ngày nào cũng nấu cơm cho chúng tôi."
      },
      {
        "vocabId": 227,
        "hanzi": "吗",
        "pinyin": "ma",
        "meaningHanViet": "Ma",
        "meaningVi": "Phải không; không (trợ từ nghi vấn)",
        "exampleSentence": "你是中国人吗？",
        "exampleTranslation": "Bạn là người Trung Quốc phải không?"
      },
      {
        "vocabId": 228,
        "hanzi": "买",
        "pinyin": "mǎi",
        "meaningHanViet": "Mãi",
        "meaningVi": "Mua",
        "exampleSentence": "我想去超市买点水果。",
        "exampleTranslation": "Tôi muốn đi siêu thị mua chút hoa quả."
      },
      {
        "vocabId": 513,
        "hanzi": "卖",
        "pinyin": "mài",
        "meaningHanViet": "Mại",
        "meaningVi": "Bán",
        "exampleSentence": "这个商店卖各种新鲜水果。",
        "exampleTranslation": "Cửa hàng này bán các loại hoa quả tươi."
      },
      {
        "vocabId": 230,
        "hanzi": "忙",
        "pinyin": "máng",
        "meaningHanViet": "Mang",
        "meaningVi": "Bận rộn; bận",
        "exampleSentence": "最近你工作忙吗？",
        "exampleTranslation": "Dạo này công việc của bạn có bận không?"
      },
      {
        "vocabId": 514,
        "hanzi": "猫",
        "pinyin": "māo",
        "meaningHanViet": "Miêu",
        "meaningVi": "Con mèo",
        "exampleSentence": "我家的小猫喜欢睡在椅子上。",
        "exampleTranslation": "Con mèo nhỏ nhà tôi thích ngủ trên ghế."
      },
      {
        "vocabId": 233,
        "hanzi": "没关系",
        "pinyin": "méi guānxi",
        "meaningHanViet": "Một Quan Hệ",
        "meaningVi": "Không sao đâu",
        "exampleSentence": "没关系，别放在心上。",
        "exampleTranslation": "Không sao, đừng để trong lòng."
      }
    ]
  },
  {
    "topicId": 7,
    "backendLessonId": 11,
    "title": "Bài 07 — Ẩm thực, Đại từ chỉ định & Nơi chốn",
    "description": "Món ăn truyền thống, đại từ chỉ định và các biểu đạt vị trí nơi chốn.",
    "vocabularies": [
      {
        "vocabId": 515,
        "hanzi": "没事",
        "pinyin": "méishì",
        "meaningHanViet": "Một Sự",
        "meaningVi": "Không có gì, không sao, rảnh rỗi",
        "exampleSentence": "别担心，我真的一点儿也没事。",
        "exampleTranslation": "Đừng lo, tôi thật sự không sao cả."
      },
      {
        "vocabId": 236,
        "hanzi": "没有",
        "pinyin": "méiyǒu",
        "meaningHanViet": "Một Hữu",
        "meaningVi": "Không có; không tồn tại",
        "exampleSentence": "书架上没有这本书。",
        "exampleTranslation": "Trên giá sách không có quyển sách này."
      },
      {
        "vocabId": 237,
        "hanzi": "妹妹",
        "pinyin": "mèimei",
        "meaningHanViet": "Muội Muội",
        "meaningVi": "Em gái; phụ nữ trẻ",
        "exampleSentence": "我妹妹最喜欢画画。",
        "exampleTranslation": "Em gái tôi thích vẽ tranh nhất."
      },
      {
        "vocabId": 241,
        "hanzi": "们",
        "pinyin": "men",
        "meaningHanViet": "Môn",
        "meaningVi": "Dùng để chỉ số nhiều cho đại từ và danh từ chỉ người",
        "exampleSentence": "同学们好，请坐下。",
        "exampleTranslation": "Chào các em học sinh, xin mời ngồi xuống."
      },
      {
        "vocabId": 242,
        "hanzi": "米饭",
        "pinyin": "mǐfàn",
        "meaningHanViet": "Mễ Phạn",
        "meaningVi": "Cơm trắng, cơm",
        "exampleSentence": "中国人常常吃米饭。",
        "exampleTranslation": "Người Trung Quốc thường xuyên ăn cơm."
      },
      {
        "vocabId": 243,
        "hanzi": "面包",
        "pinyin": "miànbāo",
        "meaningHanViet": "Diện Bao",
        "meaningVi": "Bánh mì",
        "exampleSentence": "早餐我吃面包喝牛奶。",
        "exampleTranslation": "Bữa sáng tôi ăn bánh mì và uống sữa bò."
      },
      {
        "vocabId": 244,
        "hanzi": "面条儿",
        "pinyin": "miàntiáor",
        "meaningHanViet": "Diện Điều Nhi",
        "meaningVi": "Mì, sợi mì",
        "exampleSentence": "中午我想吃一碗热面条儿。",
        "exampleTranslation": "Buổi trưa tôi muốn ăn một bát mì sợi nóng hổi."
      },
      {
        "vocabId": 247,
        "hanzi": "明年",
        "pinyin": "míngnián",
        "meaningHanViet": "Minh Niên",
        "meaningVi": "Năm sau",
        "exampleSentence": "明年我打算去上海旅游。",
        "exampleTranslation": "Năm tới tôi dự định đi Thượng Hải du lịch."
      },
      {
        "vocabId": 248,
        "hanzi": "明天",
        "pinyin": "míngtiān",
        "meaningHanViet": "Minh Thiên",
        "meaningVi": "Ngày mai",
        "exampleSentence": "明天是星期六，不用上课。",
        "exampleTranslation": "Ngày mai là thứ bảy, không phải đi học."
      },
      {
        "vocabId": 245,
        "hanzi": "名字",
        "pinyin": "míngzi",
        "meaningHanViet": "Danh Tự",
        "meaningVi": "Tên",
        "exampleSentence": "你叫什么名字？",
        "exampleTranslation": "Bạn tên là gì?"
      },
      {
        "vocabId": 250,
        "hanzi": "哪",
        "pinyin": "nǎ",
        "meaningHanViet": "Na",
        "meaningVi": "Nào, cái nào",
        "exampleSentence": "你想去哪儿旅游？",
        "exampleTranslation": "Bạn muốn đi đâu du lịch?"
      },
      {
        "vocabId": 516,
        "hanzi": "哪个",
        "pinyin": "nǎge",
        "meaningHanViet": "Na Cá",
        "meaningVi": "Cái nào, người nào",
        "exampleSentence": "你想买哪个苹果？",
        "exampleTranslation": "Bạn muốn mua quả táo nào?"
      },
      {
        "vocabId": 251,
        "hanzi": "哪里",
        "pinyin": "nǎlǐ",
        "meaningHanViet": "Na Lý",
        "meaningVi": "Ở đâu, chỗ nào; đâu có (khiêm tốn)",
        "exampleSentence": "请问洗手间在哪里？",
        "exampleTranslation": "Xin hỏi nhà vệ sinh ở đâu vậy?"
      },
      {
        "vocabId": 252,
        "hanzi": "哪儿",
        "pinyin": "nǎr",
        "meaningHanViet": "Na Nhi",
        "meaningVi": "Ở đâu, đâu",
        "exampleSentence": "你要去哪儿？",
        "exampleTranslation": "Bạn định đi đâu?"
      },
      {
        "vocabId": 253,
        "hanzi": "哪些",
        "pinyin": "nǎxiē",
        "meaningHanViet": "Na Ta",
        "meaningVi": "Những cái nào, những ai",
        "exampleSentence": "这些书中哪些是你喜欢的？",
        "exampleTranslation": "Trong số những cuốn sách này những cuốn nào bạn thích?"
      },
      {
        "vocabId": 254,
        "hanzi": "那",
        "pinyin": "nà",
        "meaningHanViet": "Na",
        "meaningVi": "Kia, đó",
        "exampleSentence": "那是谁的书？",
        "exampleTranslation": "Kia là sách của ai?"
      },
      {
        "vocabId": 255,
        "hanzi": "那边",
        "pinyin": "nàbiān",
        "meaningHanViet": "Na Biên",
        "meaningVi": "Đằng kia; ở đằng đó",
        "exampleSentence": "书店在那边。",
        "exampleTranslation": "Hiệu sách ở phía bên kia."
      },
      {
        "vocabId": 517,
        "hanzi": "那个",
        "pinyin": "nàge",
        "meaningHanViet": "Na Cá",
        "meaningVi": "Cái đó, cái kia",
        "exampleSentence": "那个包子很好吃。",
        "exampleTranslation": "Chiếc bánh bao kia rất ngon."
      },
      {
        "vocabId": 256,
        "hanzi": "那里",
        "pinyin": "nàlǐ",
        "meaningHanViet": "Na Lý",
        "meaningVi": "Ở đó; nơi đó",
        "exampleSentence": "我常常去那里喝茶。",
        "exampleTranslation": "Tôi thường đến chỗ đó uống trà."
      },
      {
        "vocabId": 257,
        "hanzi": "那儿",
        "pinyin": "nàr",
        "meaningHanViet": "Na Nhi",
        "meaningVi": "Ở đó",
        "exampleSentence": "他在那儿等你。",
        "exampleTranslation": "Anh ấy đang ở đằng kia đợi bạn."
      }
    ]
  },
  {
    "topicId": 8,
    "backendLessonId": 12,
    "title": "Bài 08 — Đại từ xưng hô, Mối quan hệ & Đời sống",
    "description": "Đại từ nhân xưng, đối tác giao tiếp, bạn bè và sinh hoạt gia đình.",
    "vocabularies": [
      {
        "vocabId": 258,
        "hanzi": "那些",
        "pinyin": "nàxiē",
        "meaningHanViet": "Na Ta",
        "meaningVi": "Những cái đó",
        "exampleSentence": "那些花开得很漂亮。",
        "exampleTranslation": "Những bông hoa kia nở rất đẹp."
      },
      {
        "vocabId": 261,
        "hanzi": "男",
        "pinyin": "nán",
        "meaningHanViet": "Nam",
        "meaningVi": "Nam, phái nam, đàn ông, con trai",
        "exampleSentence": "他是我们的男班长。",
        "exampleTranslation": "Anh ấy là lớp trưởng nam của chúng tôi."
      },
      {
        "vocabId": 263,
        "hanzi": "男朋友",
        "pinyin": "nánpéngyou",
        "meaningHanViet": "Nam Bằng Hữu",
        "meaningVi": "Bạn trai",
        "exampleSentence": "他是我的男朋友。",
        "exampleTranslation": "Anh ấy là bạn trai của tôi."
      },
      {
        "vocabId": 269,
        "hanzi": "呢",
        "pinyin": "ne",
        "meaningHanViet": "Ni",
        "meaningVi": "Thế; nhỉ; còn... thì sao (trợ từ ngữ khí)",
        "exampleSentence": "我是越南人，你呢？",
        "exampleTranslation": "Tôi là người Việt Nam, còn bạn thì sao?"
      },
      {
        "vocabId": 270,
        "hanzi": "能",
        "pinyin": "néng",
        "meaningHanViet": "Năng",
        "meaningVi": "Có thể, khả năng",
        "exampleSentence": "你能帮我翻译这个句子吗？",
        "exampleTranslation": "Bạn có thể giúp tôi dịch câu này không?"
      },
      {
        "vocabId": 271,
        "hanzi": "你",
        "pinyin": "nǐ",
        "meaningHanViet": "Nễ",
        "meaningVi": "Bạn",
        "exampleSentence": "很高兴认识你。",
        "exampleTranslation": "Rất vui được làm quen với bạn."
      },
      {
        "vocabId": 518,
        "hanzi": "你好",
        "pinyin": "nǐ hǎo",
        "meaningHanViet": "Nễ Hảo",
        "meaningVi": "Xin chào",
        "exampleSentence": "你好，很高兴认识你。",
        "exampleTranslation": "Xin chào, rất vui được làm quen với bạn."
      },
      {
        "vocabId": 272,
        "hanzi": "你们",
        "pinyin": "nǐmen",
        "meaningHanViet": "Nễ Môn",
        "meaningVi": "Các bạn",
        "exampleSentence": "你们都是大学生吗？",
        "exampleTranslation": "Các bạn đều là sinh viên đại học phải không?"
      },
      {
        "vocabId": 273,
        "hanzi": "年",
        "pinyin": "nián",
        "meaningHanViet": "Niên",
        "meaningVi": "Năm (thời gian)",
        "exampleSentence": "一年有十二个月。",
        "exampleTranslation": "Một năm có mười hai tháng."
      },
      {
        "vocabId": 274,
        "hanzi": "您",
        "pinyin": "nín",
        "meaningHanViet": "Nâm",
        "meaningVi": "Ngài, ông, bà (đại từ nhân xưng kính trọng)",
        "exampleSentence": "老师，您好！",
        "exampleTranslation": "Em chào thầy ạ!"
      },
      {
        "vocabId": 275,
        "hanzi": "牛奶",
        "pinyin": "niúnǎi",
        "meaningHanViet": "Ngưu Nãi",
        "meaningVi": "Sữa bò",
        "exampleSentence": "喝牛奶对身体很好。",
        "exampleTranslation": "Uống sữa bò rất tốt cho sức khỏe."
      },
      {
        "vocabId": 276,
        "hanzi": "女",
        "pinyin": "nǚ",
        "meaningHanViet": "Nữ",
        "meaningVi": "Nữ; phụ nữ",
        "exampleSentence": "她是我们的女老师。",
        "exampleTranslation": "Cô ấy là cô giáo của chúng tôi."
      },
      {
        "vocabId": 277,
        "hanzi": "女儿",
        "pinyin": "nǚ’ér",
        "meaningHanViet": "Nữ Nhi",
        "meaningVi": "Con gái",
        "exampleSentence": "他的女儿正在上小学。",
        "exampleTranslation": "Con gái anh ấy đang học tiểu học."
      },
      {
        "vocabId": 279,
        "hanzi": "女朋友",
        "pinyin": "nǚpéngyou",
        "meaningHanViet": "Nữ Bằng Hữu",
        "meaningVi": "Bạn gái",
        "exampleSentence": "她是我的女朋友。",
        "exampleTranslation": "Cô ấy là bạn gái của tôi."
      },
      {
        "vocabId": 519,
        "hanzi": "女士",
        "pinyin": "nǚshì",
        "meaningHanViet": "Nữ Sĩ",
        "meaningVi": "Quý cô, quý bà, phụ nữ",
        "exampleSentence": "那位女士是我们的汉语老师。",
        "exampleTranslation": "Vị quý cô kia là giáo viên tiếng Trung của chúng tôi."
      },
      {
        "vocabId": 284,
        "hanzi": "朋友",
        "pinyin": "péngyou",
        "meaningHanViet": "Bằng Hữu",
        "meaningVi": "Bạn",
        "exampleSentence": "好朋友会互相帮助。",
        "exampleTranslation": "Bạn bè tốt sẽ luôn giúp đỡ lẫn nhau."
      },
      {
        "vocabId": 520,
        "hanzi": "便宜",
        "pinyin": "piányi",
        "meaningHanViet": "Tiện Nghi",
        "meaningVi": "Rẻ, giá rẻ",
        "exampleSentence": "这本书既实用又便宜。",
        "exampleTranslation": "Cuốn sách này vừa thực dụng vừa rẻ."
      },
      {
        "vocabId": 521,
        "hanzi": "漂亮",
        "pinyin": "piàoliang",
        "meaningHanViet": "Phiêu Lượng",
        "meaningVi": "Đẹp, xinh đẹp",
        "exampleSentence": "今天你穿得真漂亮。",
        "exampleTranslation": "Hôm nay bạn mặc thật là đẹp."
      },
      {
        "vocabId": 522,
        "hanzi": "苹果",
        "pinyin": "píngguǒ",
        "meaningHanViet": "Bình Quả",
        "meaningVi": "Quả táo",
        "exampleSentence": "我想吃一个红苹果。",
        "exampleTranslation": "Tôi muốn ăn một quả táo đỏ."
      },
      {
        "vocabId": 286,
        "hanzi": "七",
        "pinyin": "qī",
        "meaningHanViet": "Thất",
        "meaningVi": "Bảy; 7",
        "exampleSentence": "一个星期有七天。",
        "exampleTranslation": "Một tuần có bảy ngày."
      }
    ]
  },
  {
    "topicId": 9,
    "backendLessonId": 13,
    "title": "Bài 09 — Lễ nghi, Thời gian & Công việc hàng ngày",
    "description": "Lễ nghi chào hỏi, kính ngữ, các buổi trong ngày và công việc thường nhật.",
    "vocabularies": [
      {
        "vocabId": 288,
        "hanzi": "起床",
        "pinyin": "qǐchuáng",
        "meaningHanViet": "Khởi Sàng",
        "meaningVi": "Thức dậy; ngủ dậy",
        "exampleSentence": "明天早上七点我要起床。",
        "exampleTranslation": "Sáng mai bảy giờ tôi phải thức dậy."
      },
      {
        "vocabId": 523,
        "hanzi": "千",
        "pinyin": "qiān",
        "meaningHanViet": "Thiên",
        "meaningVi": "Nghìn, ngàn (1.000)",
        "exampleSentence": "这个电脑要五千元。",
        "exampleTranslation": "Chiếc máy tính này giá năm nghìn tệ."
      },
      {
        "vocabId": 291,
        "hanzi": "前",
        "pinyin": "qián",
        "meaningHanViet": "Tiền",
        "meaningVi": "Trước; phía trước",
        "exampleSentence": "吃饭前要洗手。",
        "exampleTranslation": "Trước khi ăn cơm phải rửa tay."
      },
      {
        "vocabId": 294,
        "hanzi": "钱",
        "pinyin": "qián",
        "meaningHanViet": "Tiền",
        "meaningVi": "Tiền, tiền bạc",
        "exampleSentence": "买这件衣服花了不少钱。",
        "exampleTranslation": "Mua chiếc áo này tốn không ít tiền."
      },
      {
        "vocabId": 296,
        "hanzi": "请",
        "pinyin": "qǐng",
        "meaningHanViet": "Thỉnh",
        "meaningVi": "Mời; mời mọc",
        "exampleSentence": "请进，请坐，请喝茶。",
        "exampleTranslation": "Mời vào, mời ngồi, mời uống trà."
      },
      {
        "vocabId": 299,
        "hanzi": "请问",
        "pinyin": "qǐngwèn",
        "meaningHanViet": "Thỉnh Vấn",
        "meaningVi": "Xin hỏi, cho hỏi",
        "exampleSentence": "请问去图书馆怎么走？",
        "exampleTranslation": "Xin hỏi đi đến thư viện đi đường nào?"
      },
      {
        "vocabId": 302,
        "hanzi": "去",
        "pinyin": "qù",
        "meaningHanViet": "Khứ",
        "meaningVi": "Đi; đi đến",
        "exampleSentence": "明天我想去书店买书。",
        "exampleTranslation": "Ngày mai tôi muốn đến hiệu sách mua sách."
      },
      {
        "vocabId": 303,
        "hanzi": "去年",
        "pinyin": "qùnián",
        "meaningHanViet": "Khứ Niên",
        "meaningVi": "Năm ngoái",
        "exampleSentence": "去年我在北京学汉语。",
        "exampleTranslation": "Năm ngoái tôi học tiếng Trung ở Bắc Kinh."
      },
      {
        "vocabId": 304,
        "hanzi": "热",
        "pinyin": "rè",
        "meaningHanViet": "Nhiệt",
        "meaningVi": "Nóng; nhiệt tình",
        "exampleSentence": "夏天天气很热。",
        "exampleTranslation": "Mùa hè thời tiết rất nóng nực."
      },
      {
        "vocabId": 305,
        "hanzi": "人",
        "pinyin": "rén",
        "meaningHanViet": "Nhân",
        "meaningVi": "Người; mọi người",
        "exampleSentence": "这里的人非常热情。",
        "exampleTranslation": "Người dân ở đây rất nhiệt tình."
      },
      {
        "vocabId": 306,
        "hanzi": "认识",
        "pinyin": "rènshi",
        "meaningHanViet": "Nhận Thức",
        "meaningVi": "Biết; nhận ra",
        "exampleSentence": "认识你很高兴。",
        "exampleTranslation": "Rất vui được làm quen với bạn."
      },
      {
        "vocabId": 308,
        "hanzi": "日",
        "pinyin": "rì",
        "meaningHanViet": "Nhật",
        "meaningVi": "Ngày; mặt trời",
        "exampleSentence": "十月一日是国庆节。",
        "exampleTranslation": "Ngày một tháng mười là ngày Quốc khánh."
      },
      {
        "vocabId": 311,
        "hanzi": "三",
        "pinyin": "sān",
        "meaningHanViet": "Tam",
        "meaningVi": "Số ba, 3",
        "exampleSentence": "我们班有三个外国留学生。",
        "exampleTranslation": "Lớp chúng tôi có ba lưu học sinh nước ngoài."
      },
      {
        "vocabId": 314,
        "hanzi": "商店",
        "pinyin": "shāngdiàn",
        "meaningHanViet": "Thương Điếm",
        "meaningVi": "Cửa hàng; tiệm",
        "exampleSentence": "他在商店买了一支笔。",
        "exampleTranslation": "Anh ấy mua một chiếc bút ở cửa hàng."
      },
      {
        "vocabId": 315,
        "hanzi": "上",
        "pinyin": "shàng",
        "meaningHanViet": "Thượng",
        "meaningVi": "Lên; trên; đi làm; vào học",
        "exampleSentence": "桌子上有一本汉语词典。",
        "exampleTranslation": "Trên bàn có một cuốn từ điển tiếng Trung."
      },
      {
        "vocabId": 316,
        "hanzi": "上班",
        "pinyin": "shàngbān",
        "meaningHanViet": "Thượng Ban",
        "meaningVi": "Đi làm; đi trực",
        "exampleSentence": "爸爸每天早上八点去上班。",
        "exampleTranslation": "Bố mỗi buổi sáng tám giờ đi làm."
      },
      {
        "vocabId": 320,
        "hanzi": "上课",
        "pinyin": "shàngkè",
        "meaningHanViet": "Thượng Khóa",
        "meaningVi": "Đi học; tham dự lớp",
        "exampleSentence": "我们八点开始上课。",
        "exampleTranslation": "Chúng tôi tám giờ bắt đầu vào học."
      },
      {
        "vocabId": 322,
        "hanzi": "上午",
        "pinyin": "shàngwǔ",
        "meaningHanViet": "Thượng Ngọ",
        "meaningVi": "Buổi sáng",
        "exampleSentence": "今天上午我有三节汉语课。",
        "exampleTranslation": "Sáng hôm nay tôi có ba tiết học tiếng Trung."
      },
      {
        "vocabId": 323,
        "hanzi": "上学",
        "pinyin": "shàngxué",
        "meaningHanViet": "Thượng Học",
        "meaningVi": "Đi học; theo học",
        "exampleSentence": "孩子们背着书包去上学。",
        "exampleTranslation": "Lũ trẻ đeo cặp sách đi học."
      },
      {
        "vocabId": 324,
        "hanzi": "少",
        "pinyin": "shǎo",
        "meaningHanViet": "Thiểu",
        "meaningVi": "Ít; thiếu",
        "exampleSentence": "今天来上课的人很少。",
        "exampleTranslation": "Hôm nay người đến lớp học rất ít."
      }
    ]
  },
  {
    "topicId": 10,
    "backendLessonId": 14,
    "title": "Bài 10 — Giờ giấc, Nhu cầu sinh hoạt & Trò chuyện",
    "description": "Thời gian giờ giấc, sức khỏe, nhu cầu ngủ nghỉ và trò chuyện giao tiếp.",
    "vocabularies": [
      {
        "vocabId": 325,
        "hanzi": "谁",
        "pinyin": "shéi/shuí",
        "meaningHanViet": "Thuỳ",
        "meaningVi": "Ai, người nào",
        "exampleSentence": "请问那位老师是谁？",
        "exampleTranslation": "Xin hỏi vị thầy giáo kia là ai vậy?"
      },
      {
        "vocabId": 328,
        "hanzi": "什么",
        "pinyin": "shénme",
        "meaningHanViet": "Thập Ma",
        "meaningVi": "Gì, cái gì",
        "exampleSentence": "你想买什么东西？",
        "exampleTranslation": "Bạn muốn mua đồ gì?"
      },
      {
        "vocabId": 329,
        "hanzi": "生病",
        "pinyin": "shēngbìng",
        "meaningHanViet": "Sinh Bệnh",
        "meaningVi": "Bị ốm",
        "exampleSentence": "天气变冷了，小心生病。",
        "exampleTranslation": "Thời tiết trở lạnh rồi, cẩn thận kẻo ốm đấy."
      },
      {
        "vocabId": 332,
        "hanzi": "十",
        "pinyin": "shí",
        "meaningHanViet": "Thập",
        "meaningVi": "Mười; 10",
        "exampleSentence": "十个学生在操场上打球。",
        "exampleTranslation": "Mười học sinh đang chơi bóng trên sân."
      },
      {
        "vocabId": 333,
        "hanzi": "时候",
        "pinyin": "shíhou",
        "meaningHanViet": "Thời Hậu",
        "meaningVi": "Thời gian; khoảng thời gian",
        "exampleSentence": "你什么时候去北京？",
        "exampleTranslation": "Khi nào bạn đi Bắc Kinh?"
      },
      {
        "vocabId": 334,
        "hanzi": "时间",
        "pinyin": "shíjiān",
        "meaningHanViet": "Thời Gian",
        "meaningVi": "Thời gian",
        "exampleSentence": "我们没有太多时间了。",
        "exampleTranslation": "Chúng ta không còn nhiều thời gian nữa."
      },
      {
        "vocabId": 335,
        "hanzi": "事",
        "pinyin": "shì",
        "meaningHanViet": "Sự",
        "meaningVi": "Sự việc; điều",
        "exampleSentence": "今天你有什么事吗？",
        "exampleTranslation": "Hôm nay bạn có việc gì không?"
      },
      {
        "vocabId": 337,
        "hanzi": "是",
        "pinyin": "shì",
        "meaningHanViet": "Thị",
        "meaningVi": "Là; đúng; phải; thật",
        "exampleSentence": "我是河内大学的学生。",
        "exampleTranslation": "Tôi là sinh viên trường Đại học Hà Nội."
      },
      {
        "vocabId": 340,
        "hanzi": "手机",
        "pinyin": "shǒujī",
        "meaningHanViet": "Thủ Cơ",
        "meaningVi": "Điện thoại di động",
        "exampleSentence": "我的手机放在桌子上了。",
        "exampleTranslation": "Điện thoại của tôi để trên bàn rồi."
      },
      {
        "vocabId": 341,
        "hanzi": "书",
        "pinyin": "shū",
        "meaningHanViet": "Thư",
        "meaningVi": "Sách, cuốn sách",
        "exampleSentence": "看书。",
        "exampleTranslation": "Đọc sách."
      },
      {
        "vocabId": 343,
        "hanzi": "书店",
        "pinyin": "shūdiàn",
        "meaningHanViet": "Thư Điếm",
        "meaningVi": "Nhà sách",
        "exampleSentence": "我们在学校门口的新华书店见面。",
        "exampleTranslation": "Chúng tôi gặp nhau ở hiệu sách Tân Hoa trước cổng trường."
      },
      {
        "vocabId": 345,
        "hanzi": "水",
        "pinyin": "shuǐ",
        "meaningHanViet": "Thuỷ",
        "meaningVi": "Nước",
        "exampleSentence": "多喝温水对身体好。",
        "exampleTranslation": "Uống nhiều nước ấm rất tốt cho cơ thể."
      },
      {
        "vocabId": 346,
        "hanzi": "水果",
        "pinyin": "shuǐguǒ",
        "meaningHanViet": "Thuỷ Quả",
        "meaningVi": "Trái cây",
        "exampleSentence": "多吃新鲜水果有益健康。",
        "exampleTranslation": "Ăn nhiều hoa quả tươi có lợi cho sức khỏe."
      },
      {
        "vocabId": 347,
        "hanzi": "睡",
        "pinyin": "shuì",
        "meaningHanViet": "Thuỵ",
        "meaningVi": "Ngủ; nằm xuống",
        "exampleSentence": "昨天晚上我睡得非常香甜。",
        "exampleTranslation": "Tối hôm qua tôi đã ngủ rất ngon giấc."
      },
      {
        "vocabId": 348,
        "hanzi": "睡觉",
        "pinyin": "shuìjiào",
        "meaningHanViet": "Thuỵ Giác",
        "meaningVi": "Đi ngủ; ngủ",
        "exampleSentence": "早点睡觉，明天还要早起。",
        "exampleTranslation": "Ngủ sớm đi, ngày mai còn phải dậy sớm."
      },
      {
        "vocabId": 349,
        "hanzi": "说",
        "pinyin": "shuō",
        "meaningHanViet": "Thuyết",
        "meaningVi": "Nói",
        "exampleSentence": "老师说汉语说得很清楚。",
        "exampleTranslation": "Thầy giáo nói tiếng Trung rất rõ ràng."
      },
      {
        "vocabId": 350,
        "hanzi": "说话",
        "pinyin": "shuōhuà",
        "meaningHanViet": "Thuyết Thoại",
        "meaningVi": "Nói; trò chuyện",
        "exampleSentence": "请大家安静，不要说话。",
        "exampleTranslation": "Xin mọi người hãy giữ trật tự, đừng nói chuyện."
      },
      {
        "vocabId": 351,
        "hanzi": "四",
        "pinyin": "sì",
        "meaningHanViet": "Tứ",
        "meaningVi": "Bốn; 4",
        "exampleSentence": "一年有四个季节。",
        "exampleTranslation": "Một năm có bốn mùa."
      },
      {
        "vocabId": 353,
        "hanzi": "岁",
        "pinyin": "suì",
        "meaningHanViet": "Tuế",
        "meaningVi": "Tuổi",
        "exampleSentence": "小妹妹今年六岁了。",
        "exampleTranslation": "Em gái nhỏ năm nay sáu tuổi rồi."
      },
      {
        "vocabId": 354,
        "hanzi": "他",
        "pinyin": "tā",
        "meaningHanViet": "Tha",
        "meaningVi": "Anh ấy; ông ấy; khác",
        "exampleSentence": "他是我的大学同学。",
        "exampleTranslation": "Anh ấy là bạn học đại học của tôi."
      }
    ]
  },
  {
    "topicId": 11,
    "title": "Bài 11 — Thời tiết, Đại từ & Lịch trình tuần",
    "description": "Thời tiết khí hậu, ngày trong tuần, câu hỏi giao tiếp và hoạt động giải trí.",
    "vocabularies": [
      {
        "vocabId": 524,
        "hanzi": "它",
        "pinyin": "tā",
        "meaningHanViet": "Tha",
        "meaningVi": "Nó (chỉ đồ vật, con vật)",
        "exampleSentence": "这是一只小猫，它的眼睛很大。",
        "exampleTranslation": "Đây là một con mèo con, mắt của nó rất to."
      },
      {
        "vocabId": 356,
        "hanzi": "她",
        "pinyin": "tā",
        "meaningHanViet": "Tha",
        "meaningVi": "Cô ấy",
        "exampleSentence": "她是我们的汉语口语老师。",
        "exampleTranslation": "Cô ấy là giáo viên dạy khẩu ngữ tiếng Trung của chúng tôi."
      },
      {
        "vocabId": 355,
        "hanzi": "他们",
        "pinyin": "tāmen",
        "meaningHanViet": "Tha Môn",
        "meaningVi": "Họ; bọn họ",
        "exampleSentence": "他们正在操场上打篮球。",
        "exampleTranslation": "Bọn họ đang chơi bóng rổ trên sân tập."
      },
      {
        "vocabId": 525,
        "hanzi": "它们",
        "pinyin": "tāmen",
        "meaningHanViet": "Tha Môn",
        "meaningVi": "Chúng nó, chúng (số nhiều đồ vật, con vật)",
        "exampleSentence": "这些鸟真可爱，它们在树上唱歌。",
        "exampleTranslation": "Những con chim này thật đáng yêu, chúng đang hót trên cây."
      },
      {
        "vocabId": 357,
        "hanzi": "她们",
        "pinyin": "tāmen",
        "meaningHanViet": "Tha Môn",
        "meaningVi": "Họ; các cô ấy",
        "exampleSentence": "她们都是来自越南的留学生。",
        "exampleTranslation": "Họ đều là những du học sinh đến từ Việt Nam."
      },
      {
        "vocabId": 358,
        "hanzi": "太",
        "pinyin": "tài",
        "meaningHanViet": "Thái",
        "meaningVi": "Quá; lắm",
        "exampleSentence": "这件衣服太漂亮了。",
        "exampleTranslation": "Chiếc áo này đẹp quá đi thôi."
      },
      {
        "vocabId": 359,
        "hanzi": "天",
        "pinyin": "tiān",
        "meaningHanViet": "Thiên",
        "meaningVi": "Ngày; trời",
        "exampleSentence": "今天天气晴朗，阳光明媚。",
        "exampleTranslation": "Hôm nay trời quang mây tạnh, ánh nắng chan hòa."
      },
      {
        "vocabId": 360,
        "hanzi": "天气",
        "pinyin": "tiānqì",
        "meaningHanViet": "Thiên Khí",
        "meaningVi": "Thời tiết",
        "exampleSentence": "今天天气非常好。",
        "exampleTranslation": "Hôm nay thời tiết vô cùng đẹp."
      },
      {
        "vocabId": 361,
        "hanzi": "听",
        "pinyin": "tīng",
        "meaningHanViet": "Thính",
        "meaningVi": "Nghe",
        "exampleSentence": "你喜欢听什么音乐？",
        "exampleTranslation": "Bạn thích nghe loại âm nhạc nào?"
      },
      {
        "vocabId": 363,
        "hanzi": "听见",
        "pinyin": "tīngjiàn",
        "meaningHanViet": "Thính Kiến",
        "meaningVi": "Nghe thấy",
        "exampleSentence": "你听见老师说的话了吗？",
        "exampleTranslation": "Bạn có nghe thấy lời thầy nói không?"
      },
      {
        "vocabId": 365,
        "hanzi": "同学",
        "pinyin": "tóngxué",
        "meaningHanViet": "Đồng Học",
        "meaningVi": "Học cùng trường; bạn học",
        "exampleSentence": "张明是我的同班同学。",
        "exampleTranslation": "Trương Minh là bạn cùng lớp của tôi."
      },
      {
        "vocabId": 367,
        "hanzi": "外",
        "pinyin": "wài",
        "meaningHanViet": "Ngoại",
        "meaningVi": "Bên ngoài; thêm vào",
        "exampleSentence": "外面的世界真大。",
        "exampleTranslation": "Thế giới bên ngoài thật rộng lớn."
      },
      {
        "vocabId": 368,
        "hanzi": "外边",
        "pinyin": "wàibian",
        "meaningHanViet": "Ngoại Biên",
        "meaningVi": "Bên ngoài; bề mặt ngoài",
        "exampleSentence": "外面正在下大雨。",
        "exampleTranslation": "Bên ngoài trời đang mưa to."
      },
      {
        "vocabId": 526,
        "hanzi": "玩",
        "pinyin": "wán",
        "meaningHanViet": "Ngoạn",
        "meaningVi": "Chơi, vui chơi",
        "exampleSentence": "周末孩子们在公园里开心地玩。",
        "exampleTranslation": "Cuối tuần lũ trẻ vui vẻ chơi đùa trong công viên."
      },
      {
        "vocabId": 372,
        "hanzi": "晚",
        "pinyin": "wǎn",
        "meaningHanViet": "Vãn",
        "meaningVi": "Buổi tối; đêm",
        "exampleSentence": "时间不早了，我该睡了。",
        "exampleTranslation": "Thời gian không còn sớm nữa, tôi nên ngủ thôi."
      },
      {
        "vocabId": 373,
        "hanzi": "晚饭",
        "pinyin": "wǎnfàn",
        "meaningHanViet": "Vãn Phạn",
        "meaningVi": "Bữa tối; cơm tối",
        "exampleSentence": "全家人一起吃丰盛的晚饭。",
        "exampleTranslation": "Cả gia đình cùng ăn bữa tối thịnh soạn."
      },
      {
        "vocabId": 374,
        "hanzi": "晚上",
        "pinyin": "wǎnshang",
        "meaningHanViet": "Vãn Thượng",
        "meaningVi": "Buổi tối; đêm",
        "exampleSentence": "晚上我常常在房间复习功课。",
        "exampleTranslation": "Buổi tối tôi thường ôn bài ở trong phòng."
      },
      {
        "vocabId": 527,
        "hanzi": "喂",
        "pinyin": "wèi",
        "meaningHanViet": "Uý",
        "meaningVi": "A lô, này, ơi",
        "exampleSentence": "喂，请问王老师在吗？",
        "exampleTranslation": "A lô, xin hỏi thầy Vương có ở đó không?"
      },
      {
        "vocabId": 379,
        "hanzi": "问",
        "pinyin": "wèn",
        "meaningHanViet": "Vấn",
        "meaningVi": "Hỏi",
        "exampleSentence": "遇到不懂的问题要问老师。",
        "exampleTranslation": "Gặp câu hỏi không hiểu phải hỏi thầy giáo."
      },
      {
        "vocabId": 528,
        "hanzi": "问题",
        "pinyin": "wèntí",
        "meaningHanViet": "Vấn Đề",
        "meaningVi": "Câu hỏi, vấn đề",
        "exampleSentence": "老师，我有一个问题想问您。",
        "exampleTranslation": "Thưa thầy, em có một câu hỏi muốn hỏi thầy."
      }
    ]
  },
  {
    "topicId": 12,
    "title": "Bài 12 — Trang phục, Y tế & Sinh hoạt gia đình",
    "description": "Quần áo trang phục, bác sĩ bệnh viện, thời tiết mưa gió và sở thích cá nhân.",
    "vocabularies": [
      {
        "vocabId": 380,
        "hanzi": "我",
        "pinyin": "wǒ",
        "meaningHanViet": "Ngã",
        "meaningVi": "Tôi; mình; của tôi",
        "exampleSentence": "我是越南留学生。",
        "exampleTranslation": "Tôi là du học sinh Việt Nam."
      },
      {
        "vocabId": 381,
        "hanzi": "我们",
        "pinyin": "wǒmen",
        "meaningHanViet": "Ngã Môn",
        "meaningVi": "Chúng tôi; chúng ta; bản thân chúng ta; của chúng tôi",
        "exampleSentence": "我们一起努力学好汉语。",
        "exampleTranslation": "Chúng ta cùng nỗ lực học giỏi tiếng Trung nhé."
      },
      {
        "vocabId": 382,
        "hanzi": "五",
        "pinyin": "wǔ",
        "meaningHanViet": "Ngũ",
        "meaningVi": "Năm; 5",
        "exampleSentence": "一个星期工作五天。",
        "exampleTranslation": "Một tuần làm việc năm ngày."
      },
      {
        "vocabId": 383,
        "hanzi": "午饭",
        "pinyin": "wǔfàn",
        "meaningHanViet": "Ngọ Phạn",
        "meaningVi": "Bữa trưa",
        "exampleSentence": "中午我们去食堂吃午饭。",
        "exampleTranslation": "Buổi trưa chúng tôi đến nhà ăn dùng bữa trưa."
      },
      {
        "vocabId": 388,
        "hanzi": "喜欢",
        "pinyin": "xǐhuan",
        "meaningHanViet": "Hỷ Hoan",
        "meaningVi": "Thích; ưa thích",
        "exampleSentence": "我很喜欢中国书法。",
        "exampleTranslation": "Tôi rất thích thư pháp Trung Hoa."
      },
      {
        "vocabId": 389,
        "hanzi": "下",
        "pinyin": "xià",
        "meaningHanViet": "Hạ",
        "meaningVi": "Dưới; xuống; tan làm; tan học",
        "exampleSentence": "下星期我们有期中考试。",
        "exampleTranslation": "Tuần sau chúng tôi có bài thi giữa kỳ."
      },
      {
        "vocabId": 396,
        "hanzi": "下雨",
        "pinyin": "xià yǔ",
        "meaningHanViet": "Hạ Vũ",
        "meaningVi": "Trời mưa",
        "exampleSentence": "外边下雨了，出门要带伞。",
        "exampleTranslation": "Bên ngoài trời mưa rồi, ra ngoài nhớ mang ô."
      },
      {
        "vocabId": 390,
        "hanzi": "下班",
        "pinyin": "xiàbān",
        "meaningHanViet": "Hạ Ban",
        "meaningVi": "Tan làm; tan ca",
        "exampleSentence": "爸爸下午五点半下班。",
        "exampleTranslation": "Bố năm giờ rưỡi chiều tan sở."
      },
      {
        "vocabId": 394,
        "hanzi": "下课",
        "pinyin": "xiàkè",
        "meaningHanViet": "Hạ Khoá",
        "meaningVi": "Tan học; ra khỏi lớp",
        "exampleSentence": "老师说下课了，大家休息吧。",
        "exampleTranslation": "Thầy giáo nói tan học rồi, mọi người nghỉ ngơi đi."
      },
      {
        "vocabId": 395,
        "hanzi": "下午",
        "pinyin": "xiàwǔ",
        "meaningHanViet": "Hạ Ngọ",
        "meaningVi": "Buổi chiều; p.m.",
        "exampleSentence": "今天下午天气很凉快。",
        "exampleTranslation": "Chiều hôm nay thời tiết rất mát mẻ."
      },
      {
        "vocabId": 398,
        "hanzi": "先生",
        "pinyin": "xiānsheng",
        "meaningHanViet": "Tiên Sinh",
        "meaningVi": "Giáo viên; quý ông; ngài; ông",
        "exampleSentence": "王先生是一位优秀的工程师。",
        "exampleTranslation": "Ông Vương là một kỹ sư xuất sắc."
      },
      {
        "vocabId": 399,
        "hanzi": "现在",
        "pinyin": "xiànzài",
        "meaningHanViet": "Hiện Tại",
        "meaningVi": "Bây giờ; hiện tại",
        "exampleSentence": "现在是北京时间上午九点。",
        "exampleTranslation": "Bây giờ là chín giờ sáng giờ Bắc Kinh."
      },
      {
        "vocabId": 400,
        "hanzi": "想",
        "pinyin": "xiǎng",
        "meaningHanViet": "Tưởng",
        "meaningVi": "Nghĩ; muốn; nhớ",
        "exampleSentence": "我想学习汉语口语。",
        "exampleTranslation": "Tôi muốn học khẩu ngữ tiếng Trung."
      },
      {
        "vocabId": 401,
        "hanzi": "小",
        "pinyin": "xiǎo",
        "meaningHanViet": "Tiểu",
        "meaningVi": "Nhỏ; bé",
        "exampleSentence": "这是一只可爱的小花猫。",
        "exampleTranslation": "Đây là một chú mèo hoa nhỏ đáng yêu."
      },
      {
        "vocabId": 404,
        "hanzi": "小朋友",
        "pinyin": "xiǎopéngyǒu",
        "meaningHanViet": "Tiểu Bằng Hữu",
        "meaningVi": "Trẻ em",
        "exampleSentence": "小朋友们在操场上做游戏。",
        "exampleTranslation": "Các bạn nhỏ đang chơi trò chơi trên sân."
      },
      {
        "vocabId": 405,
        "hanzi": "小时",
        "pinyin": "xiǎoshí",
        "meaningHanViet": "Tiểu Thời",
        "meaningVi": "Giờ, tiếng đồng hồ",
        "exampleSentence": "从河内飞北京大约四个小时。",
        "exampleTranslation": "Từ Hà Nội bay đến Bắc Kinh khoảng bốn tiếng đồng hồ."
      },
      {
        "vocabId": 406,
        "hanzi": "小学",
        "pinyin": "xiǎoxué",
        "meaningHanViet": "Tiểu Học",
        "meaningVi": "Trường tiểu học; trường cấp một",
        "exampleSentence": "我妹妹在离家不远的小学上学。",
        "exampleTranslation": "Em gái tôi học ở trường tiểu học không xa nhà."
      },
      {
        "vocabId": 407,
        "hanzi": "小学生",
        "pinyin": "xiǎoxuéshēng",
        "meaningHanViet": "Tiểu Học Sinh",
        "meaningVi": "Học sinh tiểu học; trẻ em đi học",
        "exampleSentence": "小学生每天早起去学校。",
        "exampleTranslation": "Học sinh tiểu học mỗi ngày đều dậy sớm đến trường."
      },
      {
        "vocabId": 529,
        "hanzi": "些",
        "pinyin": "xiē",
        "meaningHanViet": "Ta",
        "meaningVi": "Một vài, một ít, những",
        "exampleSentence": "桌子上有一些新书。",
        "exampleTranslation": "Trên bàn có một vài cuốn sách mới."
      },
      {
        "vocabId": 409,
        "hanzi": "写",
        "pinyin": "xiě",
        "meaningHanViet": "Tả",
        "meaningVi": "Viết",
        "exampleSentence": "老师在黑板上写生词。",
        "exampleTranslation": "Thầy giáo viết từ mới lên trên bảng đen."
      }
    ]
  },
  {
    "topicId": 13,
    "title": "Bài 13 — Bữa sáng, Chỉ dẫn vị trí & Không gian",
    "description": "Bữa sáng, định hướng vị trí không gian, học tập và chúc mừng năm mới.",
    "vocabularies": [
      {
        "vocabId": 410,
        "hanzi": "谢谢",
        "pinyin": "xièxie",
        "meaningHanViet": "Tạ Tạ",
        "meaningVi": "Cảm ơn; cảm ơn bạn",
        "exampleSentence": "谢谢大家对我的关心。",
        "exampleTranslation": "Cảm ơn mọi người đã quan tâm đến tôi."
      },
      {
        "vocabId": 411,
        "hanzi": "新",
        "pinyin": "xīn",
        "meaningHanViet": "Tân",
        "meaningVi": "Mới",
        "exampleSentence": "新年新气象。",
        "exampleTranslation": "Năm mới khí sắc mới mẻ."
      },
      {
        "vocabId": 413,
        "hanzi": "星期",
        "pinyin": "xīngqī",
        "meaningHanViet": "Tinh Kỳ",
        "meaningVi": "Tuần; ngày trong tuần",
        "exampleSentence": "这个星期六我们去看电影。",
        "exampleTranslation": "Thứ bảy tuần này chúng tôi đi xem phim."
      },
      {
        "vocabId": 414,
        "hanzi": "星期日",
        "pinyin": "xīngqīrì",
        "meaningHanViet": "Tinh Kỳ Nhật",
        "meaningVi": "Chủ nhật",
        "exampleSentence": "星期日我常常在家休息。",
        "exampleTranslation": "Chủ nhật tôi thường ở nhà nghỉ ngơi."
      },
      {
        "vocabId": 415,
        "hanzi": "星期天",
        "pinyin": "xīngqītiān",
        "meaningHanViet": "Tinh Kỳ Thiên",
        "meaningVi": "Chủ Nhật",
        "exampleSentence": "星期天公园里游人很多。",
        "exampleTranslation": "Chủ nhật trong công viên có rất đông du khách."
      },
      {
        "vocabId": 417,
        "hanzi": "休息",
        "pinyin": "xiūxi",
        "meaningHanViet": "Hưu Tức",
        "meaningVi": "Nghỉ; nghỉ ngơi",
        "exampleSentence": "工作累了就休息一会儿吧。",
        "exampleTranslation": "Làm việc mệt rồi thì nghỉ ngơi một lát đi thôi."
      },
      {
        "vocabId": 418,
        "hanzi": "学",
        "pinyin": "xué",
        "meaningHanViet": "Học",
        "meaningVi": "Học; bắt chước",
        "exampleSentence": "学好汉语需要每天坚持。",
        "exampleTranslation": "Học giỏi tiếng Trung cần kiên trì mỗi ngày."
      },
      {
        "vocabId": 419,
        "hanzi": "学生",
        "pinyin": "xuéshēng",
        "meaningHanViet": "Học Sinh",
        "meaningVi": "Học sinh; trẻ đi học",
        "exampleSentence": "教室里坐满了用功的学生。",
        "exampleTranslation": "Trong phòng học ngồi kín những học sinh chăm chỉ."
      },
      {
        "vocabId": 420,
        "hanzi": "学习",
        "pinyin": "xuéxí",
        "meaningHanViet": "Học Tập",
        "meaningVi": "Học; tìm hiểu",
        "exampleSentence": "我们要努力学习科学文化知识。",
        "exampleTranslation": "Chúng ta phải nỗ lực học tập kiến thức khoa học văn hóa."
      },
      {
        "vocabId": 421,
        "hanzi": "学校",
        "pinyin": "xuéxiào",
        "meaningHanViet": "Học Hiệu",
        "meaningVi": "Trường học, trường",
        "exampleSentence": "我们的学校非常美丽。",
        "exampleTranslation": "Ngôi trường của chúng tôi vô cùng tươi đẹp."
      },
      {
        "vocabId": 530,
        "hanzi": "雪",
        "pinyin": "xuě",
        "meaningHanViet": "Tuyết",
        "meaningVi": "Tuyết",
        "exampleSentence": "冬天下雪的时候外面很冷。",
        "exampleTranslation": "Mùa đông khi tuyết rơi bên ngoài rất lạnh."
      },
      {
        "vocabId": 423,
        "hanzi": "要",
        "pinyin": "yào",
        "meaningHanViet": "Yêu",
        "meaningVi": "Muốn; cần; phải",
        "exampleSentence": "明天我要去参加汉语考试。",
        "exampleTranslation": "Ngày mai tôi phải đi tham gia kỳ thi tiếng Trung."
      },
      {
        "vocabId": 425,
        "hanzi": "也",
        "pinyin": "yě",
        "meaningHanViet": "Dã",
        "meaningVi": "Cũng, cũng vậy",
        "exampleSentence": "他是大学生，我也是大学生。",
        "exampleTranslation": "Anh ấy là sinh viên, tôi cũng là sinh viên."
      },
      {
        "vocabId": 427,
        "hanzi": "一",
        "pinyin": "yī",
        "meaningHanViet": "Nhất",
        "meaningVi": "Một; đơn",
        "exampleSentence": "一人成木，二人成林。",
        "exampleTranslation": "Một người thành cây, hai người thành rừng."
      },
      {
        "vocabId": 428,
        "hanzi": "衣服",
        "pinyin": "yīfu",
        "meaningHanViet": "Y Phục",
        "meaningVi": "Quần áo",
        "exampleSentence": "这件衣服款式很大方。",
        "exampleTranslation": "Chiếc áo này kiểu dáng rất nhã nhặn."
      },
      {
        "vocabId": 429,
        "hanzi": "医生",
        "pinyin": "yīshēng",
        "meaningHanViet": "Y Sinh",
        "meaningVi": "Bác sĩ",
        "exampleSentence": "医生认真地给病人检查身体。",
        "exampleTranslation": "Bác sĩ cẩn thận kiểm tra sức khỏe cho bệnh nhân."
      },
      {
        "vocabId": 430,
        "hanzi": "医院",
        "pinyin": "yīyuàn",
        "meaningHanViet": "Y Viện",
        "meaningVi": "Bệnh viện",
        "exampleSentence": "市中心有一家现代化的大医院。",
        "exampleTranslation": "Ở trung tâm thành phố có một bệnh viện lớn hiện đại."
      },
      {
        "vocabId": 431,
        "hanzi": "一半",
        "pinyin": "yíbàn",
        "meaningHanViet": "Nhất Bán",
        "meaningVi": "Một nửa",
        "exampleSentence": "这个西瓜我们一人吃一半。",
        "exampleTranslation": "Quả dưa hấu này mỗi người chúng ta ăn một nửa."
      },
      {
        "vocabId": 531,
        "hanzi": "一下",
        "pinyin": "yíxià",
        "meaningHanViet": "Nhất Hạ",
        "meaningVi": "Một chút, một lát, một cái",
        "exampleSentence": "请等一下，我马上就来。",
        "exampleTranslation": "Xin đợi một chút, tôi đến ngay đây."
      },
      {
        "vocabId": 532,
        "hanzi": "椅子",
        "pinyin": "yǐzi",
        "meaningHanViet": "Ỷ Tử",
        "meaningVi": "Cái ghế",
        "exampleSentence": "请坐在这把椅子上休息。",
        "exampleTranslation": "Xin mời ngồi trên chiếc ghế này nghỉ ngơi."
      }
    ]
  },
  {
    "topicId": 14,
    "title": "Bài 14 — Hành động, Địa điểm & Cuộc sống học đường",
    "description": "Trường học, bạn bè, rèn luyện thể thao và các trạng thái sinh hoạt.",
    "vocabularies": [
      {
        "vocabId": 437,
        "hanzi": "一点儿",
        "pinyin": "yìdiǎnr",
        "meaningHanViet": "Nhất Điểm Nhi",
        "meaningVi": "Một chút, một ít",
        "exampleSentence": "今天天气比昨天冷一点儿。",
        "exampleTranslation": "Hôm nay thời tiết hơi lạnh hơn hôm qua một chút."
      },
      {
        "vocabId": 439,
        "hanzi": "一些",
        "pinyin": "yìxiē",
        "meaningHanViet": "Nhất Ta",
        "meaningVi": "Một số; một vài",
        "exampleSentence": "桌子上放着一些新鲜的水果。",
        "exampleTranslation": "Trên bàn bày một số hoa quả tươi ngon."
      },
      {
        "vocabId": 441,
        "hanzi": "有",
        "pinyin": "yǒu",
        "meaningHanViet": "Hữu",
        "meaningVi": "Có",
        "exampleSentence": "图书馆里有许多中文书籍。",
        "exampleTranslation": "Trong thư viện có rất nhiều sách báo tiếng Trung."
      },
      {
        "vocabId": 442,
        "hanzi": "有的",
        "pinyin": "yǒude",
        "meaningHanViet": "Hữu Đích",
        "meaningVi": "Một số",
        "exampleSentence": "有的同学在看书，有的在听音乐。",
        "exampleTranslation": "Có bạn học sinh đang đọc sách, có bạn lại đang nghe nhạc."
      },
      {
        "vocabId": 533,
        "hanzi": "有点儿",
        "pinyin": "yǒudiǎnr",
        "meaningHanViet": "Hữu Điểm Nhi",
        "meaningVi": "Hơi, có chút, hơi hơi",
        "exampleSentence": "今天天气有点儿冷。",
        "exampleTranslation": "Thời tiết hôm nay hơi lạnh."
      },
      {
        "vocabId": 445,
        "hanzi": "有些",
        "pinyin": "yǒuxiē",
        "meaningHanViet": "Hữu Ta",
        "meaningVi": "Một số; hơi",
        "exampleSentence": "这些问题有些难，需要仔细分析。",
        "exampleTranslation": "Những vấn đề này hơi khó, cần phân tích cẩn thận."
      },
      {
        "vocabId": 449,
        "hanzi": "雨",
        "pinyin": "yǔ",
        "meaningHanViet": "Vũ",
        "meaningVi": "Mưa, cơn mưa",
        "exampleSentence": "外面的雨渐渐停了。",
        "exampleTranslation": "Cơn mưa bên ngoài dần dần tạnh rồi."
      },
      {
        "vocabId": 450,
        "hanzi": "元",
        "pinyin": "yuán",
        "meaningHanViet": "Nguyên",
        "meaningVi": "Đồng tệ, nguyên (đơn vị tiền tệ)",
        "exampleSentence": "这本词典售价五十元。",
        "exampleTranslation": "Cuốn từ điển này giá bán năm mươi tệ."
      },
      {
        "vocabId": 452,
        "hanzi": "月",
        "pinyin": "yuè",
        "meaningHanViet": "Nguyệt",
        "meaningVi": "Mặt trăng; tháng",
        "exampleSentence": "九月是学生们开学的月份。",
        "exampleTranslation": "Tháng chín là tháng học sinh bắt đầu năm học mới."
      },
      {
        "vocabId": 453,
        "hanzi": "再",
        "pinyin": "zài",
        "meaningHanViet": "Tái",
        "meaningVi": "Lại; một lần nữa; tái-; lần thứ hai; cái khác",
        "exampleSentence": "欢迎大家下次再来。",
        "exampleTranslation": "Hoan nghênh mọi người lần sau lại đến."
      },
      {
        "vocabId": 455,
        "hanzi": "在",
        "pinyin": "zài",
        "meaningHanViet": "Tại",
        "meaningVi": "Ở; tại; đang",
        "exampleSentence": "我现在在图书馆查资料。",
        "exampleTranslation": "Bây giờ tôi đang ở thư viện tra cứu tài liệu."
      },
      {
        "vocabId": 454,
        "hanzi": "再见",
        "pinyin": "zàijiàn",
        "meaningHanViet": "Tái Kiến",
        "meaningVi": "Tạm biệt; gặp lại sau",
        "exampleSentence": "老师再见，明天见！",
        "exampleTranslation": "Chào tạm biệt thầy cô, hẹn ngày mai gặp lại!"
      },
      {
        "vocabId": 457,
        "hanzi": "早",
        "pinyin": "zǎo",
        "meaningHanViet": "Tảo",
        "meaningVi": "Sớm; buổi sáng",
        "exampleSentence": "早起的鸟儿有虫吃。",
        "exampleTranslation": "Chim dậy sớm mới có sâu ăn."
      },
      {
        "vocabId": 458,
        "hanzi": "早饭",
        "pinyin": "zǎofàn",
        "meaningHanViet": "Tảo Phạn",
        "meaningVi": "Bữa sáng",
        "exampleSentence": "妈妈已经为我们做好了早饭。",
        "exampleTranslation": "Mẹ đã chuẩn bị xong bữa sáng cho chúng tôi rồi."
      },
      {
        "vocabId": 459,
        "hanzi": "早上",
        "pinyin": "zǎoshang",
        "meaningHanViet": "Tảo Thượng",
        "meaningVi": "Buổi sáng sớm",
        "exampleSentence": "早上空气格外清新。",
        "exampleTranslation": "Buổi sáng không khí đặc biệt trong lành."
      },
      {
        "vocabId": 460,
        "hanzi": "怎么",
        "pinyin": "zěnme",
        "meaningHanViet": "Chẩm Ma",
        "meaningVi": "Như thế nào, làm sao, thế nào",
        "exampleSentence": "这个生词怎么读？",
        "exampleTranslation": "Từ mới này phát âm như thế nào?"
      },
      {
        "vocabId": 534,
        "hanzi": "怎么样",
        "pinyin": "zěnmeyàng",
        "meaningHanViet": "Chẩm Ma Dạng",
        "meaningVi": "Thế nào, ra sao",
        "exampleSentence": "你最近身体怎么样？",
        "exampleTranslation": "Dạo này sức khỏe của bạn thế nào?"
      },
      {
        "vocabId": 462,
        "hanzi": "找",
        "pinyin": "zhǎo",
        "meaningHanViet": "Trảo",
        "meaningVi": "Tìm; kiếm; thối lại tiền",
        "exampleSentence": "你在找什么重要的东西？",
        "exampleTranslation": "Bạn đang tìm đồ vật quan trọng gì thế?"
      },
      {
        "vocabId": 464,
        "hanzi": "这",
        "pinyin": "zhè",
        "meaningHanViet": "Giá",
        "meaningVi": "Này; những...này; này",
        "exampleSentence": "这是我最喜欢的一本书。",
        "exampleTranslation": "Đây là cuốn sách mà tôi yêu thích nhất."
      },
      {
        "vocabId": 465,
        "hanzi": "这边",
        "pinyin": "zhèbiān",
        "meaningHanViet": "Giá Biên",
        "meaningVi": "Bên này; ở đây",
        "exampleSentence": "请大家往这边走。",
        "exampleTranslation": "Xin mời mọi người đi sang phía bên này."
      }
    ]
  },
  {
    "topicId": 15,
    "title": "Bài 15 — Đồ vật, Động từ & Biểu đạt giao tiếp",
    "description": "Đồ dùng sinh hoạt, phương hướng, cách thức hành động và câu hỏi thăm dò.",
    "vocabularies": [
      {
        "vocabId": 535,
        "hanzi": "这个",
        "pinyin": "zhège",
        "meaningHanViet": "Giá Cá",
        "meaningVi": "Cái này, điều này",
        "exampleSentence": "这个汉字怎么读？",
        "exampleTranslation": "Chữ Hán này đọc như thế nào?"
      },
      {
        "vocabId": 466,
        "hanzi": "这里",
        "pinyin": "zhèlǐ",
        "meaningHanViet": "Giá Lý",
        "meaningVi": "Ở đây, chỗ này, nơi này",
        "exampleSentence": "这里的风景非常迷人。",
        "exampleTranslation": "Phong cảnh ở nơi đây vô cùng say đắm lòng người."
      },
      {
        "vocabId": 467,
        "hanzi": "这儿",
        "pinyin": "zhèr",
        "meaningHanViet": "Giá Nhi",
        "meaningVi": "Ở đây",
        "exampleSentence": "这儿有很多来自各地的朋友。",
        "exampleTranslation": "Ở đây có rất nhiều bạn bè đến từ khắp nơi."
      },
      {
        "vocabId": 468,
        "hanzi": "这些",
        "pinyin": "zhèxiē",
        "meaningHanViet": "Giá Ta",
        "meaningVi": "Những... này",
        "exampleSentence": "这些生词大家都要熟记。",
        "exampleTranslation": "Những từ mới này mọi người đều phải ghi nhớ thật kỹ."
      },
      {
        "vocabId": 470,
        "hanzi": "真",
        "pinyin": "zhēn",
        "meaningHanViet": "Chân",
        "meaningVi": "Thật; sự thật",
        "exampleSentence": "今天大家聚在一起真开心。",
        "exampleTranslation": "Hôm nay mọi người tụ họp bên nhau thật là vui."
      },
      {
        "vocabId": 473,
        "hanzi": "正在",
        "pinyin": "zhèngzài",
        "meaningHanViet": "Chính Tại",
        "meaningVi": "Đang ở; ngay tại",
        "exampleSentence": "爸爸正在书房里认真阅读报纸。",
        "exampleTranslation": "Bố đang chăm chú đọc báo trong phòng sách."
      },
      {
        "vocabId": 536,
        "hanzi": "只",
        "pinyin": "zhī",
        "meaningHanViet": "Chỉ",
        "meaningVi": "Con, cái, chiếc (lượng từ động vật, chiếc trong cặp)",
        "exampleSentence": "树上有一只小鸟。",
        "exampleTranslation": "Trên cây có một con chim nhỏ."
      },
      {
        "vocabId": 474,
        "hanzi": "知道",
        "pinyin": "zhīdào",
        "meaningHanViet": "Tri Đạo",
        "meaningVi": "Biết, hiểu rõ",
        "exampleSentence": "你知道去火车站的路怎么走吗？",
        "exampleTranslation": "Bạn có biết đường đi đến nhà ga xe lửa không?"
      },
      {
        "vocabId": 477,
        "hanzi": "中国",
        "pinyin": "Zhōngguó",
        "meaningHanViet": "Trung Quốc",
        "meaningVi": "Trung Quốc",
        "exampleSentence": "我想去中国北京留学。",
        "exampleTranslation": "Tôi muốn đi du học ở Bắc Kinh, Trung Quốc."
      },
      {
        "vocabId": 479,
        "hanzi": "中文",
        "pinyin": "Zhōngwén",
        "meaningHanViet": "Trung Văn",
        "meaningVi": "Ngôn ngữ Trung Quốc",
        "exampleSentence": "学好中文可以了解博大精深的中国文化。",
        "exampleTranslation": "Học tốt tiếng Trung có thể hiểu được văn hóa Trung Hoa sâu rộng."
      },
      {
        "vocabId": 480,
        "hanzi": "中午",
        "pinyin": "zhōngwǔ",
        "meaningHanViet": "Trung Ngọ",
        "meaningVi": "Buổi trưa; trưa",
        "exampleSentence": "中午我们在学校食堂吃午饭。",
        "exampleTranslation": "Buổi trưa chúng tôi ăn cơm trưa ở nhà ăn trường."
      },
      {
        "vocabId": 481,
        "hanzi": "中学",
        "pinyin": "zhōngxué",
        "meaningHanViet": "Trung Học",
        "meaningVi": "Trường trung học",
        "exampleSentence": "我弟弟正在一所重点中学读书。",
        "exampleTranslation": "Em trai tôi đang học ở một trường trung học trọng điểm."
      },
      {
        "vocabId": 482,
        "hanzi": "中学生",
        "pinyin": "zhōngxuéshēng",
        "meaningHanViet": "Trung Học Sinh",
        "meaningVi": "Học sinh trung học; học sinh cấp ba",
        "exampleSentence": "中学生要认真学好各门课程。",
        "exampleTranslation": "Học sinh trung học cần chăm chỉ học tốt các môn học."
      },
      {
        "vocabId": 485,
        "hanzi": "住",
        "pinyin": "zhù",
        "meaningHanViet": "Trú",
        "meaningVi": "Ở; cư trú",
        "exampleSentence": "他住在留学生宿舍三号楼。",
        "exampleTranslation": "Anh ấy ở tại tòa nhà số 3 ký túc xá lưu học sinh."
      },
      {
        "vocabId": 487,
        "hanzi": "桌子",
        "pinyin": "zhuōzi",
        "meaningHanViet": "Trác Tử",
        "meaningVi": "Bàn; bàn làm việc",
        "exampleSentence": "教室里摆放着整齐的桌子和椅子。",
        "exampleTranslation": "Trong lớp học xếp những bộ bàn ghế ngay ngắn."
      },
      {
        "vocabId": 488,
        "hanzi": "字",
        "pinyin": "zì",
        "meaningHanViet": "Tự",
        "meaningVi": "Chữ; ký hiệu",
        "exampleSentence": "这个中国汉字写得非常漂亮。",
        "exampleTranslation": "Chữ Hán này được viết vô cùng đẹp đẽ."
      },
      {
        "vocabId": 495,
        "hanzi": "昨天",
        "pinyin": "zuótiān",
        "meaningHanViet": "Tạc Thiên",
        "meaningVi": "Hôm qua",
        "exampleSentence": "昨天我和好朋友一起去了博物馆。",
        "exampleTranslation": "Hôm qua tôi và bạn thân đã cùng nhau đi viện bảo tàng."
      },
      {
        "vocabId": 498,
        "hanzi": "坐",
        "pinyin": "zuò",
        "meaningHanViet": "Toạ",
        "meaningVi": "Ngồi; đi (xe, tàu)",
        "exampleSentence": "请大家按座位号坐下。",
        "exampleTranslation": "Xin mời mọi người theo số ghế ngồi xuống."
      },
      {
        "vocabId": 500,
        "hanzi": "做",
        "pinyin": "zuò",
        "meaningHanViet": "Tố",
        "meaningVi": "Làm; chế tạo",
        "exampleSentence": "周末你通常在家做什么？",
        "exampleTranslation": "Cuối tuần bạn thường làm gì ở nhà?"
      },
      {
        "vocabId": 537,
        "hanzi": "做饭",
        "pinyin": "zuò fàn",
        "meaningHanViet": "Tố Phạn",
        "meaningVi": "Nấu cơm, nấu ăn",
        "exampleSentence": "妈妈每天都在家做饭。",
        "exampleTranslation": "Mẹ ngày nào cũng nấu cơm ở nhà."
      }
    ]
  }
];

/**
 * 10 Official Curriculum Topics for HSK 2 (200 words total, 20 words each)
 */
export const HSK2_TOPICS = [
  {
    "topicId": 201,
    "title": "Bài 01 — Xã giao, Đời sống & Xuất hành",
    "description": "Giao tiếp xã giao, giúp đỡ, so sánh, xuất hành và đi lại thường nhật.",
    "vocabularies": [
      {
        "vocabId": 538,
        "hanzi": "啊",
        "pinyin": "a",
        "meaningHanViet": "A",
        "meaningVi": "À, ư, nhé, cơ (trợ từ ngữ khí)",
        "exampleSentence": "这里的风景真美啊！",
        "exampleTranslation": "Phong cảnh ở đây thật là đẹp quá!"
      },
      {
        "vocabId": 2,
        "hanzi": "爱好",
        "pinyin": "àihào",
        "meaningHanViet": "Ái Hảo",
        "meaningVi": "Thích; đam mê; lấy làm thú vui; say mê; sở thích",
        "exampleSentence": "我的爱好是听音乐。",
        "exampleTranslation": "Sở thích của tôi là nghe nhạc."
      },
      {
        "vocabId": 539,
        "hanzi": "白色",
        "pinyin": "báisè",
        "meaningHanViet": "Bạch Sắc",
        "meaningVi": "Màu trắng",
        "exampleSentence": "他今天穿了一件白色的衬衫。",
        "exampleTranslation": "Hôm nay anh ấy mặc một chiếc áo sơ mi màu trắng."
      },
      {
        "vocabId": 9,
        "hanzi": "班",
        "pinyin": "bān",
        "meaningHanViet": "Ban",
        "meaningVi": "Lớp học; ca làm việc",
        "exampleSentence": "我们班有二十个学生。",
        "exampleTranslation": "Lớp chúng tôi có hai mươi học sinh."
      },
      {
        "vocabId": 13,
        "hanzi": "帮",
        "pinyin": "bāng",
        "meaningHanViet": "Bang",
        "meaningVi": "Giúp; giúp đỡ",
        "exampleSentence": "请帮我一下。",
        "exampleTranslation": "Xin hãy giúp tôi một chút."
      },
      {
        "vocabId": 14,
        "hanzi": "帮忙",
        "pinyin": "bāngmáng",
        "meaningHanViet": "Bang Mang",
        "meaningVi": "Giúp; giúp đỡ",
        "exampleSentence": "谢谢你帮我的忙。",
        "exampleTranslation": "Cảm ơn bạn đã giúp đỡ tôi."
      },
      {
        "vocabId": 15,
        "hanzi": "包",
        "pinyin": "bāo",
        "meaningHanViet": "Bao",
        "meaningVi": "Túi; bao; gói",
        "exampleSentence": "这个包里有很多东西。",
        "exampleTranslation": "Trong chiếc túi này có rất nhiều đồ."
      },
      {
        "vocabId": 23,
        "hanzi": "本子",
        "pinyin": "běnzi",
        "meaningHanViet": "Bản Tử",
        "meaningVi": "Vở, quyển vở, sổ tay",
        "exampleSentence": "这是一个新本子。",
        "exampleTranslation": "Đây là một quyển vở mới."
      },
      {
        "vocabId": 24,
        "hanzi": "比",
        "pinyin": "bǐ",
        "meaningHanViet": "Tỷ",
        "meaningVi": "So sánh; so với; hơn",
        "exampleSentence": "今天比昨天冷。",
        "exampleTranslation": "Hôm nay lạnh hơn hôm qua."
      },
      {
        "vocabId": 540,
        "hanzi": "笔",
        "pinyin": "bǐ",
        "meaningHanViet": "Bút",
        "meaningVi": "Bút, cây bút",
        "exampleSentence": "我可以用一下你的笔吗？",
        "exampleTranslation": "Tôi có thể dùng bút của bạn một chút không?"
      },
      {
        "vocabId": 25,
        "hanzi": "别",
        "pinyin": "bié",
        "meaningHanViet": "Biệt",
        "meaningVi": "Đừng; chớ; khác",
        "exampleSentence": "别说话，请听老师讲。",
        "exampleTranslation": "Đừng nói chuyện, hãy nghe thầy giảng."
      },
      {
        "vocabId": 541,
        "hanzi": "不错",
        "pinyin": "búcuò",
        "meaningHanViet": "Bất Thác",
        "meaningVi": "Tốt, khá, không tồi",
        "exampleSentence": "这家饭馆的菜味道真不错。",
        "exampleTranslation": "Món ăn của quán này hương vị thật không tồi."
      },
      {
        "vocabId": 542,
        "hanzi": "不好意思",
        "pinyin": "bù hǎoyìsi",
        "meaningHanViet": "Bất Hảo Ý Tư",
        "meaningVi": "Ngại quá, xin lỗi, áy náy",
        "exampleSentence": "不好意思，让您久等了。",
        "exampleTranslation": "Ngại quá, để ngài phải đợi lâu rồi."
      },
      {
        "vocabId": 543,
        "hanzi": "长",
        "pinyin": "cháng",
        "meaningHanViet": "Trường",
        "meaningVi": "Dài",
        "exampleSentence": "这条河很长，流过很多城市。",
        "exampleTranslation": "Con sông này rất dài, chảy qua nhiều thành phố."
      },
      {
        "vocabId": 45,
        "hanzi": "车站",
        "pinyin": "chēzhàn",
        "meaningHanViet": "Xa Trạm",
        "meaningVi": "Ga tàu; dừng xe buýt",
        "exampleSentence": "我们在火车站见。",
        "exampleTranslation": "Chúng ta gặp nhau ở nhà ga nhé."
      },
      {
        "vocabId": 48,
        "hanzi": "出",
        "pinyin": "chū",
        "meaningHanViet": "Xuất",
        "meaningVi": "Ra; xuất; đi ra",
        "exampleSentence": "他从房间里走出来了。",
        "exampleTranslation": "Anh ấy từ trong phòng bước ra rồi."
      },
      {
        "vocabId": 544,
        "hanzi": "出国",
        "pinyin": "chūguó",
        "meaningHanViet": "Xuất Quốc",
        "meaningVi": "Ra nước ngoài, xuất ngoại",
        "exampleSentence": "他打算明年出国留学。",
        "exampleTranslation": "Anh ấy dự định năm sau ra nước ngoài du học."
      },
      {
        "vocabId": 49,
        "hanzi": "出来",
        "pinyin": "chūlái",
        "meaningHanViet": "Xuất Lai",
        "meaningVi": "Đi ra; xuất hiện",
        "exampleSentence": "快出来看雪！",
        "exampleTranslation": "Mau ra ngoài xem tuyết rơi nào!"
      },
      {
        "vocabId": 545,
        "hanzi": "出门",
        "pinyin": "chūmén",
        "meaningHanViet": "Xuất Môn",
        "meaningVi": "Ra ngoài, ra khỏi nhà",
        "exampleSentence": "外面下雨了，出门记得带伞。",
        "exampleTranslation": "Bên ngoài trời mưa rồi, ra ngoài nhớ mang theo ô."
      },
      {
        "vocabId": 50,
        "hanzi": "出去",
        "pinyin": "chūqù",
        "meaningHanViet": "Xuất Khứ",
        "meaningVi": "Đi ra ngoài",
        "exampleSentence": "外面下雨了，不要出去。",
        "exampleTranslation": "Bên ngoài trời mưa rồi, đừng đi ra ngoài."
      }
    ]
  },
  {
    "topicId": 202,
    "title": "Bài 02 — Di chuyển, Tàu điện & Cảm nhận",
    "description": "Tàu điện ngầm, xe cộ, hành động di chuyển và mức độ thấu hiểu vấn đề.",
    "vocabularies": [
      {
        "vocabId": 52,
        "hanzi": "床",
        "pinyin": "chuáng",
        "meaningHanViet": "Sàng",
        "meaningVi": "Giường; ghế dài",
        "exampleSentence": "房间里有一张大床。",
        "exampleTranslation": "Trong phòng có một chiếc giường lớn."
      },
      {
        "vocabId": 546,
        "hanzi": "词",
        "pinyin": "cí",
        "meaningHanViet": "Từ",
        "meaningVi": "Từ ngữ, lời nói",
        "exampleSentence": "这个生词是什么意思？",
        "exampleTranslation": "Từ mới này có nghĩa là gì?"
      },
      {
        "vocabId": 53,
        "hanzi": "次",
        "pinyin": "cì",
        "meaningHanViet": "Thứ",
        "meaningVi": "Lần, lượt, thứ tự",
        "exampleSentence": "这是我第一次来这里。",
        "exampleTranslation": "Đây là lần đầu tiên tôi đến đây."
      },
      {
        "vocabId": 54,
        "hanzi": "从",
        "pinyin": "cóng",
        "meaningHanViet": "Tòng",
        "meaningVi": "Từ, theo, đi từ",
        "exampleSentence": "我从越南来到中国。",
        "exampleTranslation": "Tôi từ Việt Nam đến Trung Quốc."
      },
      {
        "vocabId": 547,
        "hanzi": "从小",
        "pinyin": "cóngxiǎo",
        "meaningHanViet": "Tòng Tiểu",
        "meaningVi": "Từ nhỏ, từ bé",
        "exampleSentence": "他从小就非常喜欢画画。",
        "exampleTranslation": "Từ nhỏ anh ấy đã rất thích vẽ tranh."
      },
      {
        "vocabId": 55,
        "hanzi": "错",
        "pinyin": "cuò",
        "meaningHanViet": "Thác",
        "meaningVi": "Sai; nhầm lẫn",
        "exampleSentence": "你说得没错。",
        "exampleTranslation": "Bạn nói không sai."
      },
      {
        "vocabId": 56,
        "hanzi": "打",
        "pinyin": "dǎ",
        "meaningHanViet": "Đả",
        "meaningVi": "Đánh; gọi (điện thoại); chơi (bóng)",
        "exampleSentence": "我们下午去打篮球吧。",
        "exampleTranslation": "Chiều nay chúng ta đi chơi bóng rổ nhé."
      },
      {
        "vocabId": 57,
        "hanzi": "打车",
        "pinyin": "dǎchē",
        "meaningHanViet": "Đả Xa",
        "meaningVi": "Bắt taxi; đón xe",
        "exampleSentence": "外面下雨了，我们打车走吧。",
        "exampleTranslation": "Bên ngoài trời mưa rồi, chúng ta bắt taxi đi thôi."
      },
      {
        "vocabId": 59,
        "hanzi": "打开",
        "pinyin": "dǎkāi",
        "meaningHanViet": "Đả Khai",
        "meaningVi": "Mở; cho xem",
        "exampleSentence": "请打开书本。",
        "exampleTranslation": "Xin hãy mở sách ra."
      },
      {
        "vocabId": 548,
        "hanzi": "但",
        "pinyin": "dàn",
        "meaningHanViet": "Đãn",
        "meaningVi": "Nhưng, nhưng mà",
        "exampleSentence": "他虽然年纪小，但懂得很多道理。",
        "exampleTranslation": "Cậu ấy tuy tuổi còn nhỏ nhưng hiểu biết rất nhiều đạo lý."
      },
      {
        "vocabId": 549,
        "hanzi": "但是",
        "pinyin": "dànshì",
        "meaningHanViet": "Đãn Thị",
        "meaningVi": "Nhưng, nhưng mà, tuy nhiên",
        "exampleSentence": "我想去旅行，但是最近太忙了。",
        "exampleTranslation": "Tôi muốn đi du lịch, nhưng dạo này bận quá."
      },
      {
        "vocabId": 550,
        "hanzi": "得",
        "pinyin": "de",
        "meaningHanViet": "Đắc",
        "meaningVi": "Đến mức, được (trợ từ kết cấu)",
        "exampleSentence": "弟弟跑得很快。",
        "exampleTranslation": "Em trai chạy rất nhanh."
      },
      {
        "vocabId": 66,
        "hanzi": "地",
        "pinyin": "de",
        "meaningHanViet": "Địa",
        "meaningVi": "Trợ từ kết cấu (đứng sau phó từ/tính từ làm trạng ngữ bổ nghĩa cho động từ)",
        "exampleSentence": "他高兴地笑了。",
        "exampleTranslation": "Anh ấy đã cười một cách vui vẻ."
      },
      {
        "vocabId": 68,
        "hanzi": "等",
        "pinyin": "děng",
        "meaningHanViet": "Đẳng",
        "meaningVi": "Đợi; chờ đợi; vân vân",
        "exampleSentence": "请等我五分钟。",
        "exampleTranslation": "Xin hãy đợi tôi năm phút."
      },
      {
        "vocabId": 551,
        "hanzi": "地铁",
        "pinyin": "dìtiě",
        "meaningHanViet": "Địa Thiết",
        "meaningVi": "Tàu điện ngầm",
        "exampleSentence": "坐地铁去火车站非常方便。",
        "exampleTranslation": "Đi tàu điện ngầm đến ga tàu hỏa rất thuận tiện."
      },
      {
        "vocabId": 552,
        "hanzi": "点",
        "pinyin": "diǎn",
        "meaningHanViet": "Điểm",
        "meaningVi": "Gọi (món), châm (lửa), bấm, điểm",
        "exampleSentence": "服务员，我们现在想点菜。",
        "exampleTranslation": "Phục vụ viên, bây giờ chúng tôi muốn gọi món."
      },
      {
        "vocabId": 553,
        "hanzi": "懂",
        "pinyin": "dǒng",
        "meaningHanViet": "Đổng",
        "meaningVi": "Hiểu, hiểu rõ",
        "exampleSentence": "老师讲的内容你都听懂了吗？",
        "exampleTranslation": "Nội dung thầy giảng bạn đã nghe hiểu hết chưa?"
      },
      {
        "vocabId": 87,
        "hanzi": "动",
        "pinyin": "dòng",
        "meaningHanViet": "Động",
        "meaningVi": "Động; cử động; chuyển động",
        "exampleSentence": "别动，让我看看。",
        "exampleTranslation": "Đừng cử động, để tôi xem nào."
      },
      {
        "vocabId": 554,
        "hanzi": "饭馆",
        "pinyin": "fànguǎn",
        "meaningHanViet": "Phạn Quán",
        "meaningVi": "Quán ăn, nhà hàng",
        "exampleSentence": "学校附近有一家好吃的中国饭馆。",
        "exampleTranslation": "Gần trường có một quán ăn Trung Quốc rất ngon."
      },
      {
        "vocabId": 106,
        "hanzi": "飞",
        "pinyin": "fēi",
        "meaningHanViet": "Phi",
        "meaningVi": "Bay",
        "exampleSentence": "小鸟在天空中飞。",
        "exampleTranslation": "Chim non đang bay lượn trên bầu trời."
      }
    ]
  },
  {
    "topicId": 203,
    "title": "Bài 03 — Màu sắc, Xe buýt & Phương hướng",
    "description": "Phương tiện công cộng, màu sắc trang phục, hoa lá và phương hướng.",
    "vocabularies": [
      {
        "vocabId": 115,
        "hanzi": "高",
        "pinyin": "gāo",
        "meaningHanViet": "Cao",
        "meaningVi": "Cao",
        "exampleSentence": "他长得很高。",
        "exampleTranslation": "Anh ấy lớn lên rất cao."
      },
      {
        "vocabId": 555,
        "hanzi": "高中",
        "pinyin": "gāozhōng",
        "meaningHanViet": "Cao Trung",
        "meaningVi": "Trường cấp 3, trung học phổ thông",
        "exampleSentence": "我们是从高中就开始做朋友的。",
        "exampleTranslation": "Chúng tôi làm bạn với nhau từ thời cấp ba."
      },
      {
        "vocabId": 117,
        "hanzi": "告诉",
        "pinyin": "gàosu",
        "meaningHanViet": "Cáo Tố",
        "meaningVi": "Nói cho biết, bảo, thông báo",
        "exampleSentence": "请告诉我发生什么事了。",
        "exampleTranslation": "Xin hãy nói cho tôi biết đã xảy ra chuyện gì."
      },
      {
        "vocabId": 556,
        "hanzi": "个子",
        "pinyin": "gèzi",
        "meaningHanViet": "Cá Tử",
        "meaningVi": "Dáng người, chiều cao, vóc dáng",
        "exampleSentence": "他的个子很高，喜欢打篮球。",
        "exampleTranslation": "Vóc dáng anh ấy rất cao, thích chơi bóng rổ."
      },
      {
        "vocabId": 122,
        "hanzi": "跟",
        "pinyin": "gēn",
        "meaningHanViet": "Cân",
        "meaningVi": "Cùng; với; theo",
        "exampleSentence": "我想跟你一起去。",
        "exampleTranslation": "Tôi muốn đi cùng với bạn."
      },
      {
        "vocabId": 557,
        "hanzi": "公交车",
        "pinyin": "gōngjiāochē",
        "meaningHanViet": "Công Giao Xa",
        "meaningVi": "Xe buýt, xe công cộng",
        "exampleSentence": "每天早上我都坐公交车去上班。",
        "exampleTranslation": "Mỗi sáng tôi đều đi xe buýt đi làm."
      },
      {
        "vocabId": 558,
        "hanzi": "过",
        "pinyin": "guò",
        "meaningHanViet": "Quá",
        "meaningVi": "Đi qua, qua (đường, cầu)",
        "exampleSentence": "过马路的时候要注意安全。",
        "exampleTranslation": "Khi qua đường phải chú ý an toàn."
      },
      {
        "vocabId": 559,
        "hanzi": "过来",
        "pinyin": "guòlái",
        "meaningHanViet": "Quá Lai",
        "meaningVi": "Qua đây, lại đây",
        "exampleSentence": "请你过来帮我看一下这个问题。",
        "exampleTranslation": "Xin mời bạn qua đây giúp tôi xem câu hỏi này."
      },
      {
        "vocabId": 560,
        "hanzi": "过年",
        "pinyin": "guònián",
        "meaningHanViet": "Quá Niên",
        "meaningVi": "Ăn tết, đón tết",
        "exampleSentence": "过年的时候全家人聚在一起吃年夜饭。",
        "exampleTranslation": "Dịp đón tết cả gia đình quây quần ăn bữa cơm tất niên."
      },
      {
        "vocabId": 561,
        "hanzi": "过去",
        "pinyin": "guòqù",
        "meaningHanViet": "Quá Khứ",
        "meaningVi": "Đi qua đó, qua bên kia",
        "exampleSentence": "我们从这里走过去只要五分钟。",
        "exampleTranslation": "Chúng ta đi bộ qua đó từ đây chỉ mất năm phút."
      },
      {
        "vocabId": 131,
        "hanzi": "过",
        "pinyin": "guo",
        "meaningHanViet": "Quá",
        "meaningVi": "Trợ từ động thái (từng trải qua)",
        "exampleSentence": "你去过中国吗？",
        "exampleTranslation": "Bạn đã từng đến Trung Quốc chưa?"
      },
      {
        "vocabId": 133,
        "hanzi": "还是",
        "pinyin": "háishi",
        "meaningHanViet": "Hoàn Thị",
        "meaningVi": "Vẫn; nên",
        "exampleSentence": "你喝茶还是喝咖啡？",
        "exampleTranslation": "Bạn uống trà hay là uống cà phê?"
      },
      {
        "vocabId": 562,
        "hanzi": "黑色",
        "pinyin": "hēisè",
        "meaningHanViet": "Hắc Sắc",
        "meaningVi": "Màu đen",
        "exampleSentence": "她买了一双黑色的皮鞋。",
        "exampleTranslation": "Cô ấy đã mua một đôi giày da màu đen."
      },
      {
        "vocabId": 563,
        "hanzi": "红茶",
        "pinyin": "hóngchá",
        "meaningHanViet": "Hồng Trà",
        "meaningVi": "Trà đen, hồng trà",
        "exampleSentence": "中国人喜欢在下午喝一杯热红茶。",
        "exampleTranslation": "Người Trung Quốc thích uống một ly hồng trà nóng vào buổi chiều."
      },
      {
        "vocabId": 564,
        "hanzi": "红色",
        "pinyin": "hóngsè",
        "meaningHanViet": "Hồng Sắc",
        "meaningVi": "Màu đỏ",
        "exampleSentence": "中国人过年时喜欢用红色的东西。",
        "exampleTranslation": "Người Trung Quốc khi đón tết thích dùng đồ màu đỏ."
      },
      {
        "vocabId": 565,
        "hanzi": "后面",
        "pinyin": "hòumiàn",
        "meaningHanViet": "Hậu Diện",
        "meaningVi": "Phía sau, đằng sau",
        "exampleSentence": "图书馆就在教学楼的后面。",
        "exampleTranslation": "Thư viện ở ngay phía sau tòa nhà giảng dạy."
      },
      {
        "vocabId": 566,
        "hanzi": "花",
        "pinyin": "huā",
        "meaningHanViet": "Hoa",
        "meaningVi": "Tiêu, tốn (tiền, thời gian)",
        "exampleSentence": "买这辆自行车花了我很多钱。",
        "exampleTranslation": "Mua chiếc xe đạp này đã tốn của tôi rất nhiều tiền."
      },
      {
        "vocabId": 150,
        "hanzi": "花",
        "pinyin": "huā",
        "meaningHanViet": "Hoa",
        "meaningVi": "Hoa, bông hoa",
        "exampleSentence": "花园里开满了花。",
        "exampleTranslation": "Trong vườn hoa nở rực rỡ."
      },
      {
        "vocabId": 567,
        "hanzi": "画",
        "pinyin": "huà",
        "meaningHanViet": "Hoạ",
        "meaningVi": "Vẽ, bức tranh, bức họa",
        "exampleSentence": "墙上挂着一幅漂亮的中国山水画。",
        "exampleTranslation": "Trên tường treo một bức tranh sơn thủy Trung Quốc rất đẹp."
      },
      {
        "vocabId": 152,
        "hanzi": "坏",
        "pinyin": "huài",
        "meaningHanViet": "Hoại",
        "meaningVi": "Xấu; bị hỏng",
        "exampleSentence": "我的手表坏了。",
        "exampleTranslation": "Đồng hồ đeo tay của tôi bị hỏng rồi."
      }
    ]
  },
  {
    "topicId": 204,
    "title": "Bài 04 — Sân bay, Lớp học & Khách sạn",
    "description": "Đi máy bay, khách sạn lưu trú, lớp học và các thói quen thường ngày.",
    "vocabularies": [
      {
        "vocabId": 158,
        "hanzi": "回来",
        "pinyin": "huílái",
        "meaningHanViet": "Hồi Lai",
        "meaningVi": "Trở về; quay lại",
        "exampleSentence": "爸爸什么时候回来？",
        "exampleTranslation": "Khi nào thì bố trở về?"
      },
      {
        "vocabId": 159,
        "hanzi": "回去",
        "pinyin": "huíqù",
        "meaningHanViet": "Hồi Khứ",
        "meaningVi": "Trở về; quay lại",
        "exampleSentence": "天黑了，我们回去吧。",
        "exampleTranslation": "Trời tối rồi, chúng ta về thôi nào."
      },
      {
        "vocabId": 162,
        "hanzi": "机场",
        "pinyin": "jīchǎng",
        "meaningHanViet": "Cơ Trường",
        "meaningVi": "Sân bay, phi trường",
        "exampleSentence": "我们去机场接朋友。",
        "exampleTranslation": "Chúng tôi đến sân bay đón bạn."
      },
      {
        "vocabId": 163,
        "hanzi": "机票",
        "pinyin": "jīpiào",
        "meaningHanViet": "Cơ Phiếu",
        "meaningVi": "Vé máy bay; vé hành khách",
        "exampleSentence": "我已经买好了飞机票。",
        "exampleTranslation": "Tôi đã mua xong vé máy bay rồi."
      },
      {
        "vocabId": 167,
        "hanzi": "记得",
        "pinyin": "jìde",
        "meaningHanViet": "Ký Đắc",
        "meaningVi": "Nhớ",
        "exampleSentence": "我记得他的名字。",
        "exampleTranslation": "Tôi vẫn nhớ tên của anh ấy."
      },
      {
        "vocabId": 172,
        "hanzi": "间",
        "pinyin": "jiān",
        "meaningHanViet": "Gian",
        "meaningVi": "Giữa; trong số",
        "exampleSentence": "这是一间新教室。",
        "exampleTranslation": "Đây là một gian phòng học mới."
      },
      {
        "vocabId": 175,
        "hanzi": "教",
        "pinyin": "jiāo",
        "meaningHanViet": "Giáo",
        "meaningVi": "Dạy; giảng dạy",
        "exampleSentence": "王老师教我们汉语。",
        "exampleTranslation": "Thầy Vương dạy chúng tôi tiếng Trung."
      },
      {
        "vocabId": 568,
        "hanzi": "教室",
        "pinyin": "jiàoshì",
        "meaningHanViet": "Giáo Thất",
        "meaningVi": "Phòng học, lớp học",
        "exampleSentence": "同学们都在教室里认真听讲。",
        "exampleTranslation": "Các bạn học sinh đều đang chăm chú nghe giảng trong phòng học."
      },
      {
        "vocabId": 179,
        "hanzi": "介绍",
        "pinyin": "jièshào",
        "meaningHanViet": "Giới Thiệu",
        "meaningVi": "Giới thiệu; thuyết trình",
        "exampleSentence": "让我介绍一下我的朋友。",
        "exampleTranslation": "Để tôi giới thiệu một chút về bạn tôi nhé."
      },
      {
        "vocabId": 182,
        "hanzi": "进",
        "pinyin": "jìn",
        "meaningHanViet": "Tiến",
        "meaningVi": "Vào; tiến vào",
        "exampleSentence": "请进，请坐。",
        "exampleTranslation": "Mời vào, mời ngồi."
      },
      {
        "vocabId": 569,
        "hanzi": "近",
        "pinyin": "jìn",
        "meaningHanViet": "Cận",
        "meaningVi": "Gần (khoảng cách, quan hệ)",
        "exampleSentence": "我家离学校非常近，走路十分钟就到。",
        "exampleTranslation": "Nhà tôi cách trường rất gần, đi bộ mười phút là tới."
      },
      {
        "vocabId": 183,
        "hanzi": "进来",
        "pinyin": "jìnlái",
        "meaningHanViet": "Tiến Lai",
        "meaningVi": "Đến; vào",
        "exampleSentence": "请快点进来吧。",
        "exampleTranslation": "Xin hãy mau chóng vào đây nào."
      },
      {
        "vocabId": 184,
        "hanzi": "进去",
        "pinyin": "jìnqù",
        "meaningHanViet": "Tiến Khứ",
        "meaningVi": "Đi vào",
        "exampleSentence": "我们可以进去参观吗？",
        "exampleTranslation": "Chúng ta có thể đi vào trong tham quan không?"
      },
      {
        "vocabId": 570,
        "hanzi": "经常",
        "pinyin": "jīngcháng",
        "meaningHanViet": "Kinh Thường",
        "meaningVi": "Thường xuyên, hay",
        "exampleSentence": "他经常在周末去图书馆借书。",
        "exampleTranslation": "Anh ấy thường xuyên đi thư viện mượn sách vào cuối tuần."
      },
      {
        "vocabId": 571,
        "hanzi": "酒店",
        "pinyin": "jiǔdiàn",
        "meaningHanViet": "Tửu Điếm",
        "meaningVi": "Khách sạn",
        "exampleSentence": "这家五星级酒店的服务非常周到。",
        "exampleTranslation": "Dịch vụ của khách sạn năm sao này rất chu đáo."
      },
      {
        "vocabId": 186,
        "hanzi": "就",
        "pinyin": "jiù",
        "meaningHanViet": "Tựu",
        "meaningVi": "Thì; liền; ngay",
        "exampleSentence": "我就是你要找的人。",
        "exampleTranslation": "Tôi chính là người mà bạn đang tìm kiếm."
      },
      {
        "vocabId": 572,
        "hanzi": "咖啡",
        "pinyin": "kāfēi",
        "meaningHanViet": "Ca Phê",
        "meaningVi": "Cà phê",
        "exampleSentence": "喝一杯热咖啡能让人精神起来。",
        "exampleTranslation": "Uống một tách cà phê nóng giúp tinh thần tỉnh táo hơn."
      },
      {
        "vocabId": 573,
        "hanzi": "开始",
        "pinyin": "kāishǐ",
        "meaningHanViet": "Khai Thuỷ",
        "meaningVi": "Bắt đầu, khởi đầu",
        "exampleSentence": "电影马上就要开始了，大家请坐好。",
        "exampleTranslation": "Bộ phim sắp bắt đầu rồi, mọi người hãy ngồi ngay ngắn."
      },
      {
        "vocabId": 574,
        "hanzi": "开学",
        "pinyin": "kāixué",
        "meaningHanViet": "Khai Học",
        "meaningVi": "Khai giảng, vào năm học mới",
        "exampleSentence": "下个星期一我们学校就要开学了。",
        "exampleTranslation": "Thứ hai tuần sau trường chúng tôi sẽ khai giảng rồi."
      },
      {
        "vocabId": 196,
        "hanzi": "考",
        "pinyin": "kǎo",
        "meaningHanViet": "Khảo",
        "meaningVi": "Thi, kiểm tra, khảo sát",
        "exampleSentence": "明天我们要考汉语。",
        "exampleTranslation": "Ngày mai chúng tôi phải thi tiếng Trung."
      }
    ]
  },
  {
    "topicId": 205,
    "title": "Bài 05 — Trang phục, Thể thao & Du lịch",
    "description": "Quần áo, bóng rổ, du lịch khám phá và cảm nhận trạng thái cơ thể.",
    "vocabularies": [
      {
        "vocabId": 197,
        "hanzi": "考试",
        "pinyin": "kǎoshì",
        "meaningHanViet": "Khảo Thí",
        "meaningVi": "Dự thi; kỳ thi",
        "exampleSentence": "祝你在考试中取得好成绩。",
        "exampleTranslation": "Chúc bạn đạt thành tích tốt trong kỳ thi."
      },
      {
        "vocabId": 575,
        "hanzi": "可能",
        "pinyin": "kěnéng",
        "meaningHanViet": "Khả Năng",
        "meaningVi": "Có thể, có lẽ, khả năng",
        "exampleSentence": "明天可能会下雨，出门记得带伞。",
        "exampleTranslation": "Ngày mai có thể trời sẽ mưa, ra ngoài nhớ mang theo ô."
      },
      {
        "vocabId": 576,
        "hanzi": "裤子",
        "pinyin": "kùzi",
        "meaningHanViet": "Khố Tử",
        "meaningVi": "Cái quần",
        "exampleSentence": "这条黑色的裤子穿起来很合身。",
        "exampleTranslation": "Chiếc quần màu đen này mặc vào rất vừa vặn."
      },
      {
        "vocabId": 204,
        "hanzi": "快",
        "pinyin": "kuài",
        "meaningHanViet": "Khoái",
        "meaningVi": "Nhanh; sắp sửa",
        "exampleSentence": "时间过得真快。",
        "exampleTranslation": "Thời gian trôi qua thật nhanh."
      },
      {
        "vocabId": 577,
        "hanzi": "快乐",
        "pinyin": "kuàilè",
        "meaningHanViet": "Khoái Nhạc",
        "meaningVi": "Vui vẻ, hạnh phúc, vui sướng",
        "exampleSentence": "祝你生日快乐，身体健康！",
        "exampleTranslation": "Chúc bạn sinh nhật vui vẻ, dồi dào sức khỏe!"
      },
      {
        "vocabId": 578,
        "hanzi": "快要",
        "pinyin": "kuàiyào",
        "meaningHanViet": "Khoái Yếu",
        "meaningVi": "Sắp, sắp sửa (xảy ra)",
        "exampleSentence": "天阴了，快要下大雨了。",
        "exampleTranslation": "Trời râm rồi, sắp mưa to rồi."
      },
      {
        "vocabId": 579,
        "hanzi": "篮球",
        "pinyin": "lánqiú",
        "meaningHanViet": "Lam Cầu",
        "meaningVi": "Bóng rổ",
        "exampleSentence": "下课后男同学们喜欢一起打篮球。",
        "exampleTranslation": "Tan học các bạn nam thích cùng nhau chơi bóng rổ."
      },
      {
        "vocabId": 211,
        "hanzi": "累",
        "pinyin": "lèi",
        "meaningHanViet": "Luỵ",
        "meaningVi": "Mệt, mệt mỏi",
        "exampleSentence": "今天工作很忙，我有点累。",
        "exampleTranslation": "Hôm nay công việc rất bận, tôi hơi mệt."
      },
      {
        "vocabId": 580,
        "hanzi": "离",
        "pinyin": "lí",
        "meaningHanViet": "Ly",
        "meaningVi": "Cách, rời khỏi (khoảng cách, thời gian)",
        "exampleSentence": "我家离医院不太远。",
        "exampleTranslation": "Nhà tôi cách bệnh viện không xa lắm."
      },
      {
        "vocabId": 581,
        "hanzi": "里面",
        "pinyin": "lǐmiàn",
        "meaningHanViet": "Lý Diện",
        "meaningVi": "Bên trong, trong",
        "exampleSentence": "书包里面装满了课本和笔记本。",
        "exampleTranslation": "Bên trong cặp sách chứa đầy sách giáo khoa và vở ghi."
      },
      {
        "vocabId": 218,
        "hanzi": "楼",
        "pinyin": "lóu",
        "meaningHanViet": "Lâu",
        "meaningVi": "Tòa nhà, tầng gác",
        "exampleSentence": "我住在五楼。",
        "exampleTranslation": "Tôi sống ở tầng năm."
      },
      {
        "vocabId": 221,
        "hanzi": "路",
        "pinyin": "lù",
        "meaningHanViet": "Lộ",
        "meaningVi": "Đường, con đường",
        "exampleSentence": "这条路非常宽。",
        "exampleTranslation": "Con đường này rất rộng rãi."
      },
      {
        "vocabId": 223,
        "hanzi": "路上",
        "pinyin": "lùshang",
        "meaningHanViet": "Lộ Thượng",
        "meaningVi": "Trên đường; trên đường; đang đi",
        "exampleSentence": "路上车很多，注意安全。",
        "exampleTranslation": "Trên đường xe cộ rất đông, hãy chú ý an toàn."
      },
      {
        "vocabId": 582,
        "hanzi": "旅游",
        "pinyin": "lǚyóu",
        "meaningHanViet": "Lữ Du",
        "meaningVi": "Du lịch, đi chơi",
        "exampleSentence": "今年暑假我们全家打算去北京旅游。",
        "exampleTranslation": "Kỳ nghỉ hè năm nay cả nhà chúng tôi dự định đi du lịch Bắc Kinh."
      },
      {
        "vocabId": 583,
        "hanzi": "绿茶",
        "pinyin": "lǜchá",
        "meaningHanViet": "Lục Trà",
        "meaningVi": "Trà xanh, lục trà",
        "exampleSentence": "夏天喝一杯冰绿茶让人感觉很清凉。",
        "exampleTranslation": "Mùa hè uống một ly trà xanh đá làm người ta thấy rất thanh mát."
      },
      {
        "vocabId": 584,
        "hanzi": "绿色",
        "pinyin": "lǜsè",
        "meaningHanViet": "Lục Sắc",
        "meaningVi": "Màu xanh lá cây",
        "exampleSentence": "春天来了，公园里到处都是绿色的草地。",
        "exampleTranslation": "Mùa xuân đến rồi, trong công viên khắp nơi đều là bãi cỏ màu xanh lá."
      },
      {
        "vocabId": 229,
        "hanzi": "慢",
        "pinyin": "màn",
        "meaningHanViet": "Mạn",
        "meaningVi": "Chậm",
        "exampleSentence": "他走得很慢。",
        "exampleTranslation": "Anh ấy bước đi rất chậm chạp."
      },
      {
        "vocabId": 585,
        "hanzi": "没意思",
        "pinyin": "méi yìsi",
        "meaningHanViet": "Một Ý Tư",
        "meaningVi": "Không thú vị, buồn tẻ, nhàm chán",
        "exampleSentence": "这部电影剧情太拖沓，很没意思。",
        "exampleTranslation": "Cốt truyện bộ phim này quá rườm rà, rất nhàm chán."
      },
      {
        "vocabId": 586,
        "hanzi": "每",
        "pinyin": "měi",
        "meaningHanViet": "Mỗi",
        "meaningVi": "Mỗi, từng",
        "exampleSentence": "每天早上他都坚持晨跑半个小时。",
        "exampleTranslation": "Mỗi buổi sáng anh ấy đều kiên trì chạy bộ nửa tiếng."
      },
      {
        "vocabId": 238,
        "hanzi": "门",
        "pinyin": "mén",
        "meaningHanViet": "Môn",
        "meaningVi": "Cửa; cổng",
        "exampleSentence": "请帮我把门关上。",
        "exampleTranslation": "Xin giúp tôi đóng cửa lại."
      }
    ]
  },
  {
    "topicId": 206,
    "title": "Bài 06 — Gia đình, Công viên & Thời tiết",
    "description": "Người thân gia đình, vui chơi ngoài trời, thời tiết nắng ráo và chạy bộ.",
    "vocabularies": [
      {
        "vocabId": 239,
        "hanzi": "门口",
        "pinyin": "ménkǒu",
        "meaningHanViet": "Môn Khẩu",
        "meaningVi": "Cửa ra vào; cổng",
        "exampleSentence": "我们在学校门口等老师。",
        "exampleTranslation": "Chúng tôi đợi thầy giáo ở cổng trường."
      },
      {
        "vocabId": 240,
        "hanzi": "门票",
        "pinyin": "ménpiào",
        "meaningHanViet": "Môn Phiếu",
        "meaningVi": "Vé vào cửa, vé tham quan",
        "exampleSentence": "故宫的门票多少钱一张？",
        "exampleTranslation": "Vé vào Cố Cung bao nhiêu tiền một vé?"
      },
      {
        "vocabId": 587,
        "hanzi": "面",
        "pinyin": "miàn",
        "meaningHanViet": "Diện",
        "meaningVi": "Mặt, phía, hướng, mì sợi",
        "exampleSentence": "学校东面是一片绿色的草坪。",
        "exampleTranslation": "Phía đông trường học là một bãi cỏ xanh mướt."
      },
      {
        "vocabId": 588,
        "hanzi": "名",
        "pinyin": "míng",
        "meaningHanViet": "Danh",
        "meaningVi": "Tên, người, vị (lượng từ danh dự)",
        "exampleSentence": "我们班有三十名热情的学生。",
        "exampleTranslation": "Lớp chúng tôi có ba mươi học sinh nhiệt tình."
      },
      {
        "vocabId": 249,
        "hanzi": "拿",
        "pinyin": "ná",
        "meaningHanViet": "Nã",
        "meaningVi": "Cầm; lấy",
        "exampleSentence": "请帮我拿一下包。",
        "exampleTranslation": "Xin hãy giúp tôi cầm chiếc túi một lát."
      },
      {
        "vocabId": 589,
        "hanzi": "那么",
        "pinyin": "nàme",
        "meaningHanViet": "Na Ma",
        "meaningVi": "Như vậy, như thế, vậy thì",
        "exampleSentence": "既然大家都在，那么我们就开始开会吧。",
        "exampleTranslation": "Nếu mọi người đều có mặt, vậy thì chúng ta bắt đầu họp nhé."
      },
      {
        "vocabId": 590,
        "hanzi": "那样",
        "pinyin": "nàyàng",
        "meaningHanViet": "Na Dạng",
        "meaningVi": "Như thế, như vậy, kiểu đó",
        "exampleSentence": "你应该像他那样认真学习。",
        "exampleTranslation": "Bạn nên học tập chăm chỉ như anh ấy vậy."
      },
      {
        "vocabId": 591,
        "hanzi": "奶茶",
        "pinyin": "nǎichá",
        "meaningHanViet": "Nãi Trà",
        "meaningVi": "Trà sữa",
        "exampleSentence": "现在的年轻人很喜欢在下午喝奶茶。",
        "exampleTranslation": "Giới trẻ ngày nay rất thích uống trà sữa vào buổi chiều."
      },
      {
        "vocabId": 260,
        "hanzi": "奶奶",
        "pinyin": "nǎinai",
        "meaningHanViet": "Nãi Nãi",
        "meaningVi": "Bà nội, bà",
        "exampleSentence": "我奶奶今年七十五岁。",
        "exampleTranslation": "Bà nội tôi năm nay bảy mươi lăm tuổi."
      },
      {
        "vocabId": 262,
        "hanzi": "男孩儿",
        "pinyin": "nánháir",
        "meaningHanViet": "Nam Hài Nhi",
        "meaningVi": "Bé trai, cậu bé, con trai",
        "exampleSentence": "那个男孩儿非常聪明。",
        "exampleTranslation": "Cậu bé trai đó rất thông minh."
      },
      {
        "vocabId": 592,
        "hanzi": "鸟",
        "pinyin": "niǎo",
        "meaningHanViet": "Điểu",
        "meaningVi": "Con chim",
        "exampleSentence": "树上有许多美丽的鸟在欢快地唱歌。",
        "exampleTranslation": "Trên cây có nhiều chú chim xinh đẹp đang vui vẻ hót."
      },
      {
        "vocabId": 278,
        "hanzi": "女孩儿",
        "pinyin": "nǚháir",
        "meaningHanViet": "Nữ Hài Nhi",
        "meaningVi": "Bé gái, cô bé, con gái",
        "exampleSentence": "那个小女孩儿真漂亮。",
        "exampleTranslation": "Bé gái kia thật xinh xắn."
      },
      {
        "vocabId": 282,
        "hanzi": "旁边",
        "pinyin": "pángbiān",
        "meaningHanViet": "Bàng Biên",
        "meaningVi": "Bên; nơi liền kề",
        "exampleSentence": "我家旁边有一家便利店。",
        "exampleTranslation": "Bên cạnh nhà tôi có một cửa hàng tiện lợi."
      },
      {
        "vocabId": 283,
        "hanzi": "跑",
        "pinyin": "pǎo",
        "meaningHanViet": "Bào",
        "meaningVi": "Chạy",
        "exampleSentence": "小狗在草地上飞快地跑。",
        "exampleTranslation": "Chú cún con chạy rất nhanh trên bãi cỏ."
      },
      {
        "vocabId": 593,
        "hanzi": "跑步",
        "pinyin": "pǎobù",
        "meaningHanViet": "Bào Bộ",
        "meaningVi": "Chạy bộ",
        "exampleSentence": "坚持每天跑步能增强身体免疫力。",
        "exampleTranslation": "Kiên trì chạy bộ mỗi ngày có thể tăng cường sức đề kháng cho cơ thể."
      },
      {
        "vocabId": 285,
        "hanzi": "票",
        "pinyin": "piào",
        "meaningHanViet": "Phiếu",
        "meaningVi": "Vé; phiếu",
        "exampleSentence": "我们买了两张电影票。",
        "exampleTranslation": "Chúng tôi đã mua hai tấm vé xem phim."
      },
      {
        "vocabId": 594,
        "hanzi": "妻子",
        "pinyin": "qīzi",
        "meaningHanViet": "Thê Tử",
        "meaningVi": "Vợ",
        "exampleSentence": "他的妻子是一位温柔的医生。",
        "exampleTranslation": "Vợ anh ấy là một bác sĩ rất dịu dàng."
      },
      {
        "vocabId": 289,
        "hanzi": "起来",
        "pinyin": "qǐlái",
        "meaningHanViet": "Khởi Lai",
        "meaningVi": "Đứng lên, dậy; bắt đầu",
        "exampleSentence": "快起来，太阳晒屁股了。",
        "exampleTranslation": "Mau dậy đi, mặt trời lên cao rồi."
      },
      {
        "vocabId": 595,
        "hanzi": "前面",
        "pinyin": "qiánmiàn",
        "meaningHanViet": "Tiền Diện",
        "meaningVi": "Phía trước, đằng trước",
        "exampleSentence": "前面那栋高楼就是我们的图书馆。",
        "exampleTranslation": "Tòa nhà cao tầng đằng trước kia chính là thư viện của chúng tôi."
      },
      {
        "vocabId": 596,
        "hanzi": "晴",
        "pinyin": "qíng",
        "meaningHanViet": "Tình",
        "meaningVi": "Trời nắng, trong xanh, quang đãng",
        "exampleSentence": "今天是个大晴天，阳光明媚。",
        "exampleTranslation": "Hôm nay là một ngày nắng đẹp, ánh nắng chan hòa."
      }
    ]
  },
  {
    "topicId": 207,
    "title": "Bài 07 — Sức khỏe, Đồng hồ & Cảm xúc",
    "description": "Sức khỏe thân thể, sinh nhật, giờ giấc và các cảm nhận thoải mái.",
    "vocabularies": [
      {
        "vocabId": 301,
        "hanzi": "球",
        "pinyin": "qiú",
        "meaningHanViet": "Cầu",
        "meaningVi": "Quả bóng; hình cầu",
        "exampleSentence": "孩子们在操场上踢球。",
        "exampleTranslation": "Lũ trẻ đang đá bóng trên sân tập."
      },
      {
        "vocabId": 597,
        "hanzi": "让",
        "pinyin": "ràng",
        "meaningHanViet": "Nhượng",
        "meaningVi": "Để, cho phép, nhường, khiến cho",
        "exampleSentence": "老师让我们分成几个小组讨论问题。",
        "exampleTranslation": "Thầy giáo bảo chúng tôi chia thành vài nhóm nhỏ thảo luận vấn đề."
      },
      {
        "vocabId": 310,
        "hanzi": "肉",
        "pinyin": "ròu",
        "meaningHanViet": "Nhục",
        "meaningVi": "Thịt; thịt quả",
        "exampleSentence": "我不喜欢吃肥肉。",
        "exampleTranslation": "Tôi không thích ăn thịt mỡ."
      },
      {
        "vocabId": 313,
        "hanzi": "商场",
        "pinyin": "shāngchǎng",
        "meaningHanViet": "Thương Trường",
        "meaningVi": "Trung tâm mua sắm; trung tâm thương mại",
        "exampleSentence": "周末我们去商场购物。",
        "exampleTranslation": "Cuối tuần chúng tôi đến trung tâm thương mại mua sắm."
      },
      {
        "vocabId": 598,
        "hanzi": "上来",
        "pinyin": "shànglái",
        "meaningHanViet": "Thượng Lai",
        "meaningVi": "Lên đây, đi lên",
        "exampleSentence": "电梯到了，大家快点儿上来吧。",
        "exampleTranslation": "Thang máy đến rồi, mọi người mau bước lên đi."
      },
      {
        "vocabId": 599,
        "hanzi": "上面",
        "pinyin": "shàngmiàn",
        "meaningHanViet": "Thượng Diện",
        "meaningVi": "Phía trên, bên trên",
        "exampleSentence": "桌子上面放着一本厚厚的词典。",
        "exampleTranslation": "Phía trên bàn đặt một cuốn từ điển dày cộp."
      },
      {
        "vocabId": 600,
        "hanzi": "上去",
        "pinyin": "shàngqù",
        "meaningHanViet": "Thượng Khứ",
        "meaningVi": "Lên đó, đi lên trên",
        "exampleSentence": "楼梯很陡，你上去的时候要小心。",
        "exampleTranslation": "Cầu thang rất dốc, khi bạn đi lên đó phải cẩn thận."
      },
      {
        "vocabId": 321,
        "hanzi": "上网",
        "pinyin": "shàngwǎng",
        "meaningHanViet": "Thượng Võng",
        "meaningVi": "Lên mạng; kết nối Internet",
        "exampleSentence": "他喜欢在网上看新闻。",
        "exampleTranslation": "Anh ấy thích lên mạng xem tin tức."
      },
      {
        "vocabId": 327,
        "hanzi": "身体",
        "pinyin": "shēntǐ",
        "meaningHanViet": "Thân Thể",
        "meaningVi": "Cơ thể; sức khỏe",
        "exampleSentence": "祝你身体健康，万事如意。",
        "exampleTranslation": "Chúc bạn sức khỏe dồi dào, vạn sự như ý."
      },
      {
        "vocabId": 331,
        "hanzi": "生日",
        "pinyin": "shēngrì",
        "meaningHanViet": "Sinh Nhật",
        "meaningVi": "Sinh nhật",
        "exampleSentence": "今天是我的生日。",
        "exampleTranslation": "Hôm nay là sinh nhật của tôi."
      },
      {
        "vocabId": 601,
        "hanzi": "时",
        "pinyin": "shí",
        "meaningHanViet": "Thời",
        "meaningVi": "Lúc, khi, thời gian",
        "exampleSentence": "看书时请保持安静，不要打扰别人。",
        "exampleTranslation": "Khi đọc sách xin hãy giữ trật tự, đừng làm phiền người khác."
      },
      {
        "vocabId": 602,
        "hanzi": "事情",
        "pinyin": "shìqing",
        "meaningHanViet": "Sự Tình",
        "meaningVi": "Sự việc, việc, chuyện",
        "exampleSentence": "今天我有很多重要的事情要处理。",
        "exampleTranslation": "Hôm nay tôi có rất nhiều chuyện quan trọng cần giải quyết."
      },
      {
        "vocabId": 339,
        "hanzi": "手",
        "pinyin": "shǒu",
        "meaningHanViet": "Thủ",
        "meaningVi": "Tay; cầm",
        "exampleSentence": "饭前洗手是个好习惯。",
        "exampleTranslation": "Rửa tay trước khi ăn là thói quen tốt."
      },
      {
        "vocabId": 603,
        "hanzi": "手表",
        "pinyin": "shǒubiǎo",
        "meaningHanViet": "Thủ Biểu",
        "meaningVi": "Đồng hồ đeo tay",
        "exampleSentence": "这只手表是爸爸送给我的生日礼物。",
        "exampleTranslation": "Chiếc đồng hồ đeo tay này là món quà sinh nhật bố tặng tôi."
      },
      {
        "vocabId": 342,
        "hanzi": "书包",
        "pinyin": "shūbāo",
        "meaningHanViet": "Thư Bao",
        "meaningVi": "Cặp sách; cặp đeo lưng",
        "exampleSentence": "新书包里装满了课本和笔。",
        "exampleTranslation": "Trong chiếc cặp sách mới chứa đầy sách vở và bút."
      },
      {
        "vocabId": 604,
        "hanzi": "舒服",
        "pinyin": "shūfu",
        "meaningHanViet": "Thư Phục",
        "meaningVi": "Dễ chịu, thoải mái, khỏe khoắn",
        "exampleSentence": "洗了个温水澡之后感觉非常舒服。",
        "exampleTranslation": "Sau khi tắm nước ấm xong cảm thấy vô cùng thoải mái."
      },
      {
        "vocabId": 352,
        "hanzi": "送",
        "pinyin": "sòng",
        "meaningHanViet": "Tống",
        "meaningVi": "Gửi; giao; truyền; tặng",
        "exampleSentence": "朋友送了我一本很有趣的书。",
        "exampleTranslation": "Bạn bè đã tặng tôi một cuốn sách rất thú vị."
      },
      {
        "vocabId": 605,
        "hanzi": "虽然",
        "pinyin": "suīrán",
        "meaningHanViet": "Tuy Nhiên",
        "meaningVi": "Mặc dù, tuy rằng",
        "exampleSentence": "虽然天气很冷，但他依然坚持锻炼。",
        "exampleTranslation": "Tuy rằng thời tiết rất lạnh, nhưng anh ấy vẫn kiên trì rèn luyện."
      },
      {
        "vocabId": 606,
        "hanzi": "所以",
        "pinyin": "suǒyǐ",
        "meaningHanViet": "Sở Dĩ",
        "meaningVi": "Cho nên, vì vậy",
        "exampleSentence": "因为下大雨，所以运动会推迟了。",
        "exampleTranslation": "Vì trời mưa to, cho nên đại hội thể thao đã bị hoãn lại."
      },
      {
        "vocabId": 607,
        "hanzi": "疼",
        "pinyin": "téng",
        "meaningHanViet": "Đông",
        "meaningVi": "Đau, nhức",
        "exampleSentence": "昨天吃了冷饮，今天胃有点儿疼。",
        "exampleTranslation": "Hôm qua uống đồ lạnh, hôm nay dạ dày hơi đau."
      }
    ]
  },
  {
    "topicId": 208,
    "title": "Bài 08 — Thể thao, Khiêu vũ & Vị trí ngoài trời",
    "description": "Đá bóng, nhảy múa, định hướng không gian và lý do trong giao tiếp.",
    "vocabularies": [
      {
        "vocabId": 608,
        "hanzi": "踢",
        "pinyin": "tī",
        "meaningHanViet": "Thích",
        "meaningVi": "Đá (bóng), đạp",
        "exampleSentence": "周末男孩子们喜欢在草地上踢足球。",
        "exampleTranslation": "Cuối tuần các cậu bé thích đá bóng trên bãi cỏ."
      },
      {
        "vocabId": 609,
        "hanzi": "题",
        "pinyin": "tí",
        "meaningHanViet": "Đề",
        "meaningVi": "Đề thi, câu hỏi, đề mục",
        "exampleSentence": "这次考试的数学题都比较简单。",
        "exampleTranslation": "Các câu hỏi toán học trong bài thi lần này tương đối đơn giản."
      },
      {
        "vocabId": 610,
        "hanzi": "条",
        "pinyin": "tiáo",
        "meaningHanViet": "Điều",
        "meaningVi": "Con, sợi, cái, tuyến (lượng từ vật dài)",
        "exampleSentence": "门前有一条清澈的小河。",
        "exampleTranslation": "Trước cửa có một con sông nhỏ trong vắt."
      },
      {
        "vocabId": 611,
        "hanzi": "跳舞",
        "pinyin": "tiàowǔ",
        "meaningHanViet": "Khiêu Vũ",
        "meaningVi": "Khiêu vũ, nhảy múa",
        "exampleSentence": "姐姐从小就学习跳舞，跳得很优美。",
        "exampleTranslation": "Chị gái học khiêu vũ từ nhỏ, nhảy rất uyển chuyển."
      },
      {
        "vocabId": 612,
        "hanzi": "头",
        "pinyin": "tóu",
        "meaningHanViet": "Đầu",
        "meaningVi": "Đầu, khởi đầu, con (lượng từ gia súc)",
        "exampleSentence": "他低下头认真地看着手里的书。",
        "exampleTranslation": "Cậu ấy cúi đầu chăm chú nhìn cuốn sách trong tay."
      },
      {
        "vocabId": 369,
        "hanzi": "外国",
        "pinyin": "wàiguó",
        "meaningHanViet": "Ngoại Quốc",
        "meaningVi": "Nước ngoài",
        "exampleSentence": "他很喜欢去外国旅游。",
        "exampleTranslation": "Anh ấy rất thích đi du lịch nước ngoài."
      },
      {
        "vocabId": 613,
        "hanzi": "外面",
        "pinyin": "wàimiàn",
        "meaningHanViet": "Ngoại Diện",
        "meaningVi": "Bên ngoài, phía ngoài",
        "exampleSentence": "外面下着雪，屋里却很暖和。",
        "exampleTranslation": "Bên ngoài tuyết đang rơi, trong nhà lại rất ấm áp."
      },
      {
        "vocabId": 614,
        "hanzi": "完",
        "pinyin": "wán",
        "meaningHanViet": "Hoàn",
        "meaningVi": "Xong, hết, hoàn thành",
        "exampleSentence": "我做完今天的作业就可以去看电影了。",
        "exampleTranslation": "Tôi làm xong bài tập hôm nay là có thể đi xem phim rồi."
      },
      {
        "vocabId": 615,
        "hanzi": "万",
        "pinyin": "wàn",
        "meaningHanViet": "Vạn",
        "meaningVi": "Vạn, mười nghìn (10.000)",
        "exampleSentence": "这个大型体育场可以容纳五万人。",
        "exampleTranslation": "Sân vận động lớn này có thể chứa được năm vạn người."
      },
      {
        "vocabId": 616,
        "hanzi": "往",
        "pinyin": "wǎng",
        "meaningHanViet": "Vãng",
        "meaningVi": "Hướng về, về phía",
        "exampleSentence": "请大家一直往前走，图书馆就在右手边。",
        "exampleTranslation": "Xin mọi người cứ đi thẳng về phía trước, thư viện ở ngay bên tay phải."
      },
      {
        "vocabId": 375,
        "hanzi": "网上",
        "pinyin": "wǎngshang",
        "meaningHanViet": "Võng Thượng",
        "meaningVi": "Trực tuyến",
        "exampleSentence": "我喜欢在网上查阅中文学习资料。",
        "exampleTranslation": "Tôi thích tra cứu tài liệu học tiếng Trung trên mạng."
      },
      {
        "vocabId": 377,
        "hanzi": "忘",
        "pinyin": "wàng",
        "meaningHanViet": "Vong",
        "meaningVi": "Quên; bỏ qua",
        "exampleSentence": "不要忘了带你的雨伞。",
        "exampleTranslation": "Đừng quên mang theo chiếc ô của bạn nhé."
      },
      {
        "vocabId": 617,
        "hanzi": "位",
        "pinyin": "wèi",
        "meaningHanViet": "Vị",
        "meaningVi": "Vị, người (lượng từ lịch sự chỉ người)",
        "exampleSentence": "请问您是找哪位老师？",
        "exampleTranslation": "Xin hỏi ngài đang tìm vị thầy cô nào?"
      },
      {
        "vocabId": 618,
        "hanzi": "为什么",
        "pinyin": "wèi shénme",
        "meaningHanViet": "Vi Thập Ma",
        "meaningVi": "Tại sao, vì sao",
        "exampleSentence": "你今天为什么没有来参加汉语课？",
        "exampleTranslation": "Hôm nay tại sao bạn không đến tham gia lớp tiếng Trung?"
      },
      {
        "vocabId": 619,
        "hanzi": "希望",
        "pinyin": "xīwàng",
        "meaningHanViet": "Hi Vọng",
        "meaningVi": "Hy vọng, mong muốn",
        "exampleSentence": "我希望大家都能够顺利通过汉语考试。",
        "exampleTranslation": "Tôi hy vọng mọi người đều có thể thuận lợi vượt qua kỳ thi tiếng Trung."
      },
      {
        "vocabId": 386,
        "hanzi": "洗",
        "pinyin": "xǐ",
        "meaningHanViet": "Tẩy",
        "meaningVi": "Rửa; tắm; rửa ảnh",
        "exampleSentence": "饭前要洗手。",
        "exampleTranslation": "Trước khi ăn cơm phải rửa tay."
      },
      {
        "vocabId": 387,
        "hanzi": "洗手间",
        "pinyin": "xǐshǒujiān",
        "meaningHanViet": "Tẩy Thủ Gian",
        "meaningVi": "Nhà vệ sinh; phòng vệ sinh",
        "exampleSentence": "请问洗手间在几楼？",
        "exampleTranslation": "Xin hỏi nhà vệ sinh ở tầng mấy vậy?"
      },
      {
        "vocabId": 620,
        "hanzi": "下来",
        "pinyin": "xiàlái",
        "meaningHanViet": "Hạ Lai",
        "meaningVi": "Xuống đây, đi xuống",
        "exampleSentence": "公车到站了，乘客们排队走下来。",
        "exampleTranslation": "Xe buýt đến trạm rồi, các hành khách xếp hàng bước xuống."
      },
      {
        "vocabId": 621,
        "hanzi": "下面",
        "pinyin": "xiàmiàn",
        "meaningHanViet": "Hạ Diện",
        "meaningVi": "Phía dưới, bên dưới",
        "exampleSentence": "大树下面乘凉的人很多。",
        "exampleTranslation": "Dưới gốc cây lớn có rất nhiều người hóng mát."
      },
      {
        "vocabId": 622,
        "hanzi": "下去",
        "pinyin": "xiàqù",
        "meaningHanViet": "Hạ Khứ",
        "meaningVi": "Xuống đó, tiếp tục",
        "exampleSentence": "太阳下去了，天渐渐黑了下来。",
        "exampleTranslation": "Mặt trời lặn xuống rồi, trời dần dần tối lại."
      }
    ]
  },
  {
    "topicId": 209,
    "title": "Bài 09 — Sức khỏe, Hiệu thuốc & Giải trí",
    "description": "Khám bệnh bốc thuốc, bơi lội, họ tên và ý nghĩa trong cuộc sống.",
    "vocabularies": [
      {
        "vocabId": 402,
        "hanzi": "小孩儿",
        "pinyin": "xiǎoháir",
        "meaningHanViet": "Tiểu Hài Nhi",
        "meaningVi": "Trẻ con, đứa trẻ, em bé",
        "exampleSentence": "公园里有很多快乐的小孩儿。",
        "exampleTranslation": "Trong công viên có rất nhiều đứa trẻ vui vẻ."
      },
      {
        "vocabId": 623,
        "hanzi": "小时候",
        "pinyin": "xiǎoshíhou",
        "meaningHanViet": "Tiểu Thời Hậu",
        "meaningVi": "Hồi nhỏ, lúc bé, thời thơ ấu",
        "exampleSentence": "小时候我最喜欢听奶奶讲故事。",
        "exampleTranslation": "Hồi nhỏ tôi thích nhất nghe bà kể chuyện."
      },
      {
        "vocabId": 408,
        "hanzi": "笑",
        "pinyin": "xiào",
        "meaningHanViet": "Tiếu",
        "meaningVi": "Cười, mỉm cười",
        "exampleSentence": "她笑起来非常好看。",
        "exampleTranslation": "Cô ấy cười lên trông rất xinh đẹp."
      },
      {
        "vocabId": 624,
        "hanzi": "姓",
        "pinyin": "xìng",
        "meaningHanViet": "Tính",
        "meaningVi": "Họ (tên họ), mang họ",
        "exampleSentence": "请问先生贵姓？我姓李。",
        "exampleTranslation": "Xin hỏi quý tính của tiên sinh? Tôi họ Lý."
      },
      {
        "vocabId": 625,
        "hanzi": "姓名",
        "pinyin": "xìngmíng",
        "meaningHanViet": "Tính Danh",
        "meaningVi": "Họ và tên",
        "exampleSentence": "请在表格的第一行写下您的姓名。",
        "exampleTranslation": "Xin hãy viết họ và tên của ngài vào dòng đầu tiên của biểu mẫu."
      },
      {
        "vocabId": 626,
        "hanzi": "颜色",
        "pinyin": "yánsè",
        "meaningHanViet": "Nhan Sắc",
        "meaningVi": "Màu sắc",
        "exampleSentence": "你最喜欢什么颜色的衣服？",
        "exampleTranslation": "Bạn thích quần áo màu sắc gì nhất?"
      },
      {
        "vocabId": 627,
        "hanzi": "眼睛",
        "pinyin": "yǎnjing",
        "meaningHanViet": "Nhãn Tinh",
        "meaningVi": "Mắt, đôi mắt",
        "exampleSentence": "多看远处的绿色植物对眼睛好。",
        "exampleTranslation": "Nhìn nhiều cây cối màu xanh ở phía xa rất tốt cho mắt."
      },
      {
        "vocabId": 628,
        "hanzi": "药",
        "pinyin": "yào",
        "meaningHanViet": "Dược",
        "meaningVi": "Thuốc, viên thuốc",
        "exampleSentence": "生病了就要按时吃药多喝水。",
        "exampleTranslation": "Bị ốm rồi thì phải uống thuốc đúng giờ và uống nhiều nước."
      },
      {
        "vocabId": 629,
        "hanzi": "药店",
        "pinyin": "yàodiàn",
        "meaningHanViet": "Dược Điếm",
        "meaningVi": "Hiệu thuốc, tiệm thuốc",
        "exampleSentence": "医院对面有一家二十四小时营业的药店。",
        "exampleTranslation": "Đối diện bệnh viện có một hiệu thuốc mở cửa hai mươi tư giờ."
      },
      {
        "vocabId": 424,
        "hanzi": "爷爷",
        "pinyin": "yéye",
        "meaningHanViet": "Gia Gia",
        "meaningVi": "Ông nội; ông bên nội",
        "exampleSentence": "我爷爷每天早上打太极拳。",
        "exampleTranslation": "Ông nội tôi mỗi sáng đều tập Thái Cực Quyền."
      },
      {
        "vocabId": 432,
        "hanzi": "一会儿",
        "pinyin": "yíhuìr",
        "meaningHanViet": "Nhất Hội Nhi",
        "meaningVi": "Một lúc; một thời gian",
        "exampleSentence": "请大家稍等一会儿。",
        "exampleTranslation": "Xin mọi người hãy chờ một lát."
      },
      {
        "vocabId": 630,
        "hanzi": "已经",
        "pinyin": "yǐjīng",
        "meaningHanViet": "Dĩ Kinh",
        "meaningVi": "Đã, rồi",
        "exampleSentence": "我已经把所有的课文都预习好了。",
        "exampleTranslation": "Tôi đã chuẩn bị trước tất cả các bài khóa xong rồi."
      },
      {
        "vocabId": 438,
        "hanzi": "一起",
        "pinyin": "yìqǐ",
        "meaningHanViet": "Nhất Khởi",
        "meaningVi": "Ở cùng một nơi; cùng nhau",
        "exampleSentence": "我们一起努力提高汉语水平。",
        "exampleTranslation": "Chúng ta cùng nhau nỗ lực nâng cao trình độ tiếng Trung."
      },
      {
        "vocabId": 631,
        "hanzi": "意思",
        "pinyin": "yìsi",
        "meaningHanViet": "Ý Tư",
        "meaningVi": "Ý nghĩa, ý tứ",
        "exampleSentence": "你能告诉我这个句子的具体意思吗？",
        "exampleTranslation": "Bạn có thể nói cho tôi biết ý nghĩa cụ thể của câu này không?"
      },
      {
        "vocabId": 632,
        "hanzi": "阴",
        "pinyin": "yīn",
        "meaningHanViet": "Âm",
        "meaningVi": "U ám, râm, âm (âm dương)",
        "exampleSentence": "今天天气阴沉沉的，好像要下雨了。",
        "exampleTranslation": "Thời tiết hôm nay u ám, hình như sắp mưa rồi."
      },
      {
        "vocabId": 633,
        "hanzi": "因为",
        "pinyin": "yīnwèi",
        "meaningHanViet": "Nhân Vi",
        "meaningVi": "Bởi vì, vì",
        "exampleSentence": "因为今天堵车，所以我迟到了十分钟。",
        "exampleTranslation": "Bởi vì hôm nay tắc đường, cho nên tôi đã đến muộn mười phút."
      },
      {
        "vocabId": 634,
        "hanzi": "游",
        "pinyin": "yóu",
        "meaningHanViet": "Du",
        "meaningVi": "Bơi, bơi lội, du ngoạn",
        "exampleSentence": "一群小鱼在清澈的溪水里自由自在地游。",
        "exampleTranslation": "Một đàn cá nhỏ đang tung tăng bơi lội trong dòng suối trong veo."
      },
      {
        "vocabId": 635,
        "hanzi": "游泳",
        "pinyin": "yóuyǒng",
        "meaningHanViet": "Du Vịnh",
        "meaningVi": "Bơi lội",
        "exampleSentence": "夏天很多人喜欢去海边游泳。",
        "exampleTranslation": "Mùa hè rất nhiều người thích đi biển bơi lội."
      },
      {
        "vocabId": 636,
        "hanzi": "有意思",
        "pinyin": "yǒu yìsi",
        "meaningHanViet": "Hữu Ý Tư",
        "meaningVi": "Thú vị, hay ho, có ý nghĩa",
        "exampleSentence": "这本书写得很有意思，值得一读。",
        "exampleTranslation": "Cuốn sách này viết rất thú vị, đáng để đọc một lần."
      },
      {
        "vocabId": 637,
        "hanzi": "有时",
        "pinyin": "yǒushí",
        "meaningHanViet": "Hữu Thời",
        "meaningVi": "Có khi, đôi khi, thỉnh thoảng",
        "exampleSentence": "周末我有时去爬山，有时在家里看书。",
        "exampleTranslation": "Cuối tuần tôi thỉnh thoảng đi leo núi, thỉnh thoảng đọc sách ở nhà."
      }
    ]
  },
  {
    "topicId": 210,
    "title": "Bài 10 — Vận động, Chuẩn bị & Phương hướng",
    "description": "Bóng đá, rèn luyện thể thao, chuẩn bị kế hoạch và định vị phương hướng.",
    "vocabularies": [
      {
        "vocabId": 447,
        "hanzi": "右",
        "pinyin": "yòu",
        "meaningHanViet": "Hữu",
        "meaningVi": "Phải; bên phải",
        "exampleSentence": "请向右看齐。",
        "exampleTranslation": "Xin hãy nhìn sang bên phải gióng hàng."
      },
      {
        "vocabId": 448,
        "hanzi": "右边",
        "pinyin": "yòubian",
        "meaningHanViet": "Hữu Biên",
        "meaningVi": "Bên phải; phải, về bên phải",
        "exampleSentence": "学校的右边是一家大超市。",
        "exampleTranslation": "Bên phải trường học là một siêu thị lớn."
      },
      {
        "vocabId": 638,
        "hanzi": "鱼",
        "pinyin": "yú",
        "meaningHanViet": "Ngư",
        "meaningVi": "Con cá",
        "exampleSentence": "清蒸鱼是广东非常有名的一道菜。",
        "exampleTranslation": "Cá hấp thanh đạm là một món ăn rất nổi tiếng của Quảng Đông."
      },
      {
        "vocabId": 451,
        "hanzi": "远",
        "pinyin": "yuǎn",
        "meaningHanViet": "Viễn",
        "meaningVi": "Xa; xa xôi",
        "exampleSentence": "从我家到学校并不远。",
        "exampleTranslation": "Từ nhà tôi đến trường học không hề xa."
      },
      {
        "vocabId": 639,
        "hanzi": "运动",
        "pinyin": "yùndòng",
        "meaningHanViet": "Vận Động",
        "meaningVi": "Vận động, thể thao",
        "exampleSentence": "每天坚持适量运动有利于身体健康。",
        "exampleTranslation": "Mỗi ngày kiên trì vận động điều độ rất có lợi cho sức khỏe."
      },
      {
        "vocabId": 461,
        "hanzi": "站",
        "pinyin": "zhàn",
        "meaningHanViet": "Trạm",
        "meaningVi": "Ga, bến, trạm xe",
        "exampleSentence": "下一站就是天安门广场。",
        "exampleTranslation": "Trạm tiếp theo chính là Quảng trường Thiên An Môn."
      },
      {
        "vocabId": 640,
        "hanzi": "丈夫",
        "pinyin": "zhàngfu",
        "meaningHanViet": "Trượng Phu",
        "meaningVi": "Chồng",
        "exampleSentence": "她的丈夫是一位资深的大学教授。",
        "exampleTranslation": "Chồng của cô ấy là một giáo sư đại học kỳ cựu."
      },
      {
        "vocabId": 641,
        "hanzi": "这么",
        "pinyin": "zhème",
        "meaningHanViet": "Giá Ma",
        "meaningVi": "Như thế này, như vậy",
        "exampleSentence": "你怎么走得这么快，等等我！",
        "exampleTranslation": "Sao bạn đi nhanh thế này, đợi tôi với!"
      },
      {
        "vocabId": 642,
        "hanzi": "这样",
        "pinyin": "zhèyàng",
        "meaningHanViet": "Giá Dạng",
        "meaningVi": "Như vậy, thế này, kiểu này",
        "exampleSentence": "这样做是完全正确的，不要改变。",
        "exampleTranslation": "Làm thế này là hoàn toàn chính xác, đừng thay đổi."
      },
      {
        "vocabId": 469,
        "hanzi": "着",
        "pinyin": "zhe",
        "meaningHanViet": "Trước",
        "meaningVi": "Đang (trợ từ biểu thị trạng thái tiếp diễn)",
        "exampleSentence": "门开着，请直接进来。",
        "exampleTranslation": "Cửa đang mở, xin mời trực tiếp bước vào."
      },
      {
        "vocabId": 472,
        "hanzi": "正",
        "pinyin": "zhèng",
        "meaningHanViet": "Chính",
        "meaningVi": "Đúng; chính; đang",
        "exampleSentence": "太阳正当空照着大地。",
        "exampleTranslation": "Mặt trời đang chiếu rọi ngay trên đỉnh đầu xuống mặt đất."
      },
      {
        "vocabId": 643,
        "hanzi": "周",
        "pinyin": "zhōu",
        "meaningHanViet": "Chu",
        "meaningVi": "Tuần, chu kỳ, vòng quanh",
        "exampleSentence": "我们下周一有一个很重要的中文考试。",
        "exampleTranslation": "Thứ hai tuần sau chúng tôi có một kỳ thi tiếng Trung rất quan trọng."
      },
      {
        "vocabId": 486,
        "hanzi": "准备",
        "pinyin": "zhǔnbèi",
        "meaningHanViet": "Chuẩn Bị",
        "meaningVi": "Sự chuẩn bị; chuẩn bị",
        "exampleSentence": "我们正在认真准备期末考试。",
        "exampleTranslation": "Chúng tôi đang chăm chỉ chuẩn bị cho kỳ thi cuối kỳ."
      },
      {
        "vocabId": 644,
        "hanzi": "自己",
        "pinyin": "zìjǐ",
        "meaningHanViet": "Tự Kỷ",
        "meaningVi": "Tự mình, bản thân",
        "exampleSentence": "有些事情要靠自己去努力完成。",
        "exampleTranslation": "Có những việc phải dựa vào bản thân tự nỗ lực hoàn thành."
      },
      {
        "vocabId": 490,
        "hanzi": "走",
        "pinyin": "zǒu",
        "meaningHanViet": "Tẩu",
        "meaningVi": "Đi; rời đi",
        "exampleSentence": "天色已晚，我们该走了。",
        "exampleTranslation": "Trời đã tối rồi, chúng ta nên đi thôi."
      },
      {
        "vocabId": 491,
        "hanzi": "走路",
        "pinyin": "zǒulù",
        "meaningHanViet": "Tẩu Lộ",
        "meaningVi": "Đi bộ; đi bằng chân",
        "exampleSentence": "每天走路半小时对心脏很有益。",
        "exampleTranslation": "Mỗi ngày đi bộ nửa giờ rất có ích cho tim mạch."
      },
      {
        "vocabId": 645,
        "hanzi": "足球",
        "pinyin": "zúqiú",
        "meaningHanViet": "Túc Cầu",
        "meaningVi": "Bóng đá, quả bóng đá",
        "exampleSentence": "世界杯足球比赛吸引了全世界的球迷。",
        "exampleTranslation": "Trận đấu bóng đá World Cup đã thu hút người hâm mộ bóng đá trên toàn thế giới."
      },
      {
        "vocabId": 492,
        "hanzi": "最",
        "pinyin": "zuì",
        "meaningHanViet": "Tối",
        "meaningVi": "Nhất",
        "exampleSentence": "汉语是我最喜欢的外国语言。",
        "exampleTranslation": "Tiếng Trung là ngoại ngữ mà tôi yêu thích nhất."
      },
      {
        "vocabId": 496,
        "hanzi": "左",
        "pinyin": "zuǒ",
        "meaningHanViet": "Tả",
        "meaningVi": "Trái; bên trái",
        "exampleSentence": "请各位同学向左转。",
        "exampleTranslation": "Xin mời các bạn học sinh quay sang trái."
      },
      {
        "vocabId": 497,
        "hanzi": "左边",
        "pinyin": "zuǒbian",
        "meaningHanViet": "Tả Biên",
        "meaningVi": "Bên trái; phía trái",
        "exampleSentence": "学校图书馆在办公楼的左边。",
        "exampleTranslation": "Thư viện trường học nằm ở phía bên trái tòa nhà làm việc."
      }
    ]
  }
];

/**
 * 25 Official Curriculum Topics for HSK 3 (500 words total, 20 words each)
 */
export const HSK3_TOPICS = [
  {
    "topicId": 301,
    "title": "Bài 01 — Bạn bè, Gia đình & An toàn",
    "description": "Xưng hô thân mật, dọn dẹp nhà cửa, ghi chép và giữ gìn an toàn.",
    "vocabularies": [
      {
        "vocabId": 646,
        "hanzi": "阿姨",
        "pinyin": "āyí",
        "meaningHanViet": "A Di",
        "meaningVi": "Dì, cô, bác gái",
        "exampleSentence": "王阿姨热心地帮我们照看孩子。",
        "exampleTranslation": "Dì Vương nhiệt tình giúp chúng tôi trông nom lũ trẻ."
      },
      {
        "vocabId": 647,
        "hanzi": "矮",
        "pinyin": "ǎi",
        "meaningHanViet": "Ải",
        "meaningVi": "Thấp, lùn",
        "exampleSentence": "弟弟比哥哥矮了半个头。",
        "exampleTranslation": "Em trai thấp hơn anh trai nửa cái đầu."
      },
      {
        "vocabId": 648,
        "hanzi": "爱人",
        "pinyin": "àiren",
        "meaningHanViet": "Ái Nhân",
        "meaningVi": "Vợ, chồng, người bạn đời",
        "exampleSentence": "他和他的爱人感情非常融洽。",
        "exampleTranslation": "Anh ấy và người bạn đời tình cảm rất hòa thuận."
      },
      {
        "vocabId": 649,
        "hanzi": "安静",
        "pinyin": "ānjìng",
        "meaningHanViet": "An Tĩnh",
        "meaningVi": "Yên tĩnh, tĩnh lặng, trật tự",
        "exampleSentence": "请大家在图书馆里保持安静。",
        "exampleTranslation": "Xin mọi người hãy giữ trật tự trong thư viện."
      },
      {
        "vocabId": 650,
        "hanzi": "安全",
        "pinyin": "ānquán",
        "meaningHanViet": "An Toàn",
        "meaningVi": "An toàn",
        "exampleSentence": "过马路时一定要注意交通安全。",
        "exampleTranslation": "Khi qua đường nhất định phải chú ý an toàn giao thông."
      },
      {
        "vocabId": 651,
        "hanzi": "把",
        "pinyin": "bǎ",
        "meaningHanViet": "Bả",
        "meaningVi": "Cầm, nắm, chiếc (lượng từ ghế/dao/ô), câu chữ 把",
        "exampleSentence": "请你把桌子上的书递给我。",
        "exampleTranslation": "Xin bạn hãy đưa cuốn sách trên bàn cho tôi."
      },
      {
        "vocabId": 652,
        "hanzi": "搬",
        "pinyin": "bān",
        "meaningHanViet": "Ban",
        "meaningVi": "Dọn, khiêng, chuyển (đồ đạc)",
        "exampleSentence": "我们一起把这台重机器搬出去。",
        "exampleTranslation": "Chúng ta cùng khiêng cỗ máy nặng này ra ngoài."
      },
      {
        "vocabId": 653,
        "hanzi": "班级",
        "pinyin": "bānjí",
        "meaningHanViet": "Ban Cấp",
        "meaningVi": "Lớp học, cấp lớp",
        "exampleSentence": "我们班级一共有三十名学生。",
        "exampleTranslation": "Lớp học của chúng tôi có tổng cộng ba mươi học sinh."
      },
      {
        "vocabId": 654,
        "hanzi": "搬家",
        "pinyin": "bānjiā",
        "meaningHanViet": "Ban Gia",
        "meaningVi": "Chuyển nhà, dọn nhà",
        "exampleSentence": "下个月我们全家就要搬家了。",
        "exampleTranslation": "Tháng sau cả gia đình chúng tôi sẽ chuyển nhà rồi."
      },
      {
        "vocabId": 655,
        "hanzi": "办",
        "pinyin": "bàn",
        "meaningHanViet": "Biện",
        "meaningVi": "Làm, xử lý, giải quyết",
        "exampleSentence": "这件事情你打算怎么去办？",
        "exampleTranslation": "Chuyện này bạn dự định giải quyết như thế nào?"
      },
      {
        "vocabId": 656,
        "hanzi": "办法",
        "pinyin": "bànfǎ",
        "meaningHanViet": "Biện Pháp",
        "meaningVi": "Biện pháp, cách thức, phương pháp",
        "exampleSentence": "大家都在想办法解决这个难题。",
        "exampleTranslation": "Mọi người đều đang nghĩ biện pháp giải quyết vấn đề khó khăn này."
      },
      {
        "vocabId": 657,
        "hanzi": "办公室",
        "pinyin": "bàngōngshì",
        "meaningHanViet": "Biện Công Thất",
        "meaningVi": "Văn phòng làm việc",
        "exampleSentence": "王经理现在正在办公室处理文件。",
        "exampleTranslation": "Giám đốc Vương hiện đang ở văn phòng xử lý văn kiện."
      },
      {
        "vocabId": 12,
        "hanzi": "半天",
        "pinyin": "bàntiān",
        "meaningHanViet": "Bán Thiên",
        "meaningVi": "Nửa ngày; một thời gian dài",
        "exampleSentence": "我等了你半天。",
        "exampleTranslation": "Tôi đã đợi bạn cả buổi trời."
      },
      {
        "vocabId": 658,
        "hanzi": "帮助",
        "pinyin": "bāngzhù",
        "meaningHanViet": "Bang Trợ",
        "meaningVi": "Giúp đỡ, viện trợ",
        "exampleSentence": "非常感谢你在我困难时给我的帮助。",
        "exampleTranslation": "Vô cùng cảm ơn sự giúp đỡ bạn đã dành cho tôi khi tôi gặp khó khăn."
      },
      {
        "vocabId": 659,
        "hanzi": "饱",
        "pinyin": "bǎo",
        "meaningHanViet": "Bão",
        "meaningVi": "No, no nê",
        "exampleSentence": "今天中午的菜太丰富，我都吃饱了。",
        "exampleTranslation": "Bữa trưa hôm nay nhiều món quá, tôi ăn no rồi."
      },
      {
        "vocabId": 660,
        "hanzi": "报纸",
        "pinyin": "bàozhǐ",
        "meaningHanViet": "Báo Chỉ",
        "meaningVi": "Báo, tờ báo",
        "exampleSentence": "爷爷每天早晨都有看报纸的习惯。",
        "exampleTranslation": "Ông nội mỗi buổi sáng đều có thói quen đọc báo."
      },
      {
        "vocabId": 19,
        "hanzi": "北",
        "pinyin": "běi",
        "meaningHanViet": "Bắc",
        "meaningVi": "Phía bắc; bị đánh bại",
        "exampleSentence": "我家在学校的北边。",
        "exampleTranslation": "Nhà tôi ở phía bắc trường học."
      },
      {
        "vocabId": 661,
        "hanzi": "北方",
        "pinyin": "běifāng",
        "meaningHanViet": "Bắc Phương",
        "meaningVi": "Phương bắc, miền bắc",
        "exampleSentence": "中国的北方冬天经常下大雪。",
        "exampleTranslation": "Miền bắc Trung Quốc vào mùa đông thường xuyên có tuyết rơi lớn."
      },
      {
        "vocabId": 662,
        "hanzi": "被",
        "pinyin": "bèi",
        "meaningHanViet": "Bị",
        "meaningVi": "Bị, được (câu bị động)",
        "exampleSentence": "桌子上的蛋糕被调皮的小猫吃掉了。",
        "exampleTranslation": "Miếng bánh ngọt trên bàn đã bị chú mèo nghịch ngợm ăn mất rồi."
      },
      {
        "vocabId": 663,
        "hanzi": "笔记",
        "pinyin": "bǐjì",
        "meaningHanViet": "Bút Ký",
        "meaningVi": "Ghi chép, bài ghi, biên bản",
        "exampleSentence": "上课时要认真做好课堂笔记。",
        "exampleTranslation": "Trong giờ học cần chăm chú ghi chép bài đầy đủ."
      }
    ]
  },
  {
    "topicId": 302,
    "title": "Bài 02 — Thi đấu, So sánh & Kế hoạch",
    "description": "Tham gia thi đấu, máy tính xách tay, so sánh và chuẩn bị kế hoạch.",
    "vocabularies": [
      {
        "vocabId": 664,
        "hanzi": "比较",
        "pinyin": "bǐjiào",
        "meaningHanViet": "Tỉ Giảo",
        "meaningVi": "So sánh, khá, tương đối",
        "exampleSentence": "这门课程比我想象中要比较容易。",
        "exampleTranslation": "Môn học này tương đối dễ hơn so với tôi tưởng tượng."
      },
      {
        "vocabId": 665,
        "hanzi": "笔记本",
        "pinyin": "bǐjìběn",
        "meaningHanViet": "Bút Ký Bản",
        "meaningVi": "Vở ghi chép, máy tính xách tay",
        "exampleSentence": "这台笔记本电脑轻巧便携，很适合办公。",
        "exampleTranslation": "Chiếc máy tính xách tay này nhẹ nhàng tiện lợi, rất hợp cho công việc văn phòng."
      },
      {
        "vocabId": 666,
        "hanzi": "比如",
        "pinyin": "bǐrú",
        "meaningHanViet": "Tỉ Như",
        "meaningVi": "Ví dụ như, chẳng hạn",
        "exampleSentence": "很多水果维生素含量很高，比如橙子和猕猴桃。",
        "exampleTranslation": "Nhiều loại hoa quả hàm lượng vitamin rất cao, ví dụ như cam và kiwi."
      },
      {
        "vocabId": 667,
        "hanzi": "比赛",
        "pinyin": "bǐsài",
        "meaningHanViet": "Tỉ Tái",
        "meaningVi": "Thi đấu, trận đấu, cuộc thi",
        "exampleSentence": "他们学校的足球队赢得了这场比赛。",
        "exampleTranslation": "Đội bóng đá của trường họ đã thắng trong trận thi đấu này."
      },
      {
        "vocabId": 668,
        "hanzi": "必须",
        "pinyin": "bìxū",
        "meaningHanViet": "Tất Tu",
        "meaningVi": "Phải, bắt buộc phải",
        "exampleSentence": "明天出发前大家必须带齐有效证件。",
        "exampleTranslation": "Trước khi xuất phát vào ngày mai mọi người bắt buộc phải mang đầy đủ giấy tờ tùy thân."
      },
      {
        "vocabId": 669,
        "hanzi": "变",
        "pinyin": "biàn",
        "meaningHanViet": "Biến",
        "meaningVi": "Biến đổi, thay đổi, trở nên",
        "exampleSentence": "几场秋雨过后，天气渐渐变凉了。",
        "exampleTranslation": "Sau vài cơn mưa thu, thời tiết dần dần trở nên se lạnh."
      },
      {
        "vocabId": 670,
        "hanzi": "遍",
        "pinyin": "biàn",
        "meaningHanViet": "Biến",
        "meaningVi": "Lần, lượt (từ đầu đến cuối)",
        "exampleSentence": "这篇长文章我认真读了三遍。",
        "exampleTranslation": "Bài văn dài này tôi đã chăm chú đọc ba lần từ đầu đến cuối."
      },
      {
        "vocabId": 671,
        "hanzi": "变成",
        "pinyin": "biànchéng",
        "meaningHanViet": "Biến Thành",
        "meaningVi": "Biến thành, trở thành",
        "exampleSentence": "经过刻苦努力，他变成了一位优秀的翻译官。",
        "exampleTranslation": "Qua nỗ lực miệt mài, anh ấy đã trở thành một phiên dịch viên ưu tú."
      },
      {
        "vocabId": 672,
        "hanzi": "变化",
        "pinyin": "biànhuà",
        "meaningHanViet": "Biến Hoá",
        "meaningVi": "Biến đổi, sự thay đổi",
        "exampleSentence": "最近几年，这座城市发生了巨大的变化。",
        "exampleTranslation": "Những năm gần đây, thành phố này đã diễn ra sự thay đổi to lớn."
      },
      {
        "vocabId": 673,
        "hanzi": "表演",
        "pinyin": "biǎoyǎn",
        "meaningHanViet": "Biểu Diễn",
        "meaningVi": "Biểu diễn, trình diễn",
        "exampleSentence": "杂技团演员的表演赢得了全场热烈的掌声。",
        "exampleTranslation": "Màn biểu diễn của diễn viên đoàn xiếc đã nhận được tràng pháo tay nồng nhiệt từ khán phòng."
      },
      {
        "vocabId": 26,
        "hanzi": "别的",
        "pinyin": "biéde",
        "meaningHanViet": "Biệt Đích",
        "meaningVi": "Khác",
        "exampleSentence": "你还需要别的吗？",
        "exampleTranslation": "Bạn còn cần thứ khác không?"
      },
      {
        "vocabId": 27,
        "hanzi": "别人",
        "pinyin": "biérén",
        "meaningHanViet": "Biệt Nhân",
        "meaningVi": "Người khác; những người khác",
        "exampleSentence": "我们要学会尊重别人。",
        "exampleTranslation": "Chúng ta phải học cách tôn trọng người khác."
      },
      {
        "vocabId": 674,
        "hanzi": "宾馆",
        "pinyin": "bīnguǎn",
        "meaningHanViet": "Tân Quán",
        "meaningVi": "Khách sạn, nhà khách",
        "exampleSentence": "这家涉外宾馆的设施非常现代化。",
        "exampleTranslation": "Cơ sở vật chất của khách sạn đón khách quốc tế này rất hiện đại."
      },
      {
        "vocabId": 675,
        "hanzi": "冰",
        "pinyin": "bīng",
        "meaningHanViet": "Băng",
        "meaningVi": "Băng, đá lạnh",
        "exampleSentence": "湖面上结了一层厚厚坚硬的冰。",
        "exampleTranslation": "Trên mặt hồ đã đóng một lớp băng dày và cứng."
      },
      {
        "vocabId": 676,
        "hanzi": "冰激凌",
        "pinyin": "bīngjīlíng",
        "meaningHanViet": "Băng Kích Lăng",
        "meaningVi": "Kem, kem que",
        "exampleSentence": "炎热的夏日里吃一支冰激凌真解渴。",
        "exampleTranslation": "Trong ngày hè nóng nực ăn một que kem thật là đã khát."
      },
      {
        "vocabId": 677,
        "hanzi": "冰箱",
        "pinyin": "bīngxiāng",
        "meaningHanViet": "Băng Sương",
        "meaningVi": "Tủ lạnh",
        "exampleSentence": "请把喝不完的鲜牛奶放进冰箱保鲜。",
        "exampleTranslation": "Xin hãy cất chỗ sữa tươi chưa uống hết vào tủ lạnh để bảo quản."
      },
      {
        "vocabId": 29,
        "hanzi": "病人",
        "pinyin": "bìngrén",
        "meaningHanViet": "Bệnh Nhân",
        "meaningVi": "Người bệnh; bệnh nhân",
        "exampleSentence": "医生正在照顾病人。",
        "exampleTranslation": "Bác sĩ đang chăm sóc bệnh nhân."
      },
      {
        "vocabId": 678,
        "hanzi": "不但",
        "pinyin": "búdàn",
        "meaningHanViet": "Bất Đãn",
        "meaningVi": "Không những, không chỉ",
        "exampleSentence": "他不但会说流利的汉语，还会说法语。",
        "exampleTranslation": "Anh ấy không những nói lưu loát tiếng Trung mà còn biết nói tiếng Pháp."
      },
      {
        "vocabId": 679,
        "hanzi": "不见",
        "pinyin": "bújiàn",
        "meaningHanViet": "Bất Kiến",
        "meaningVi": "Mất hút, không thấy, biến mất",
        "exampleSentence": "刚刚还在桌上的钢笔怎么突然不见了？",
        "exampleTranslation": "Chiếc bút máy vừa nãy còn trên bàn sao bỗng nhiên không thấy đâu nữa?"
      },
      {
        "vocabId": 33,
        "hanzi": "不用",
        "pinyin": "búyòng",
        "meaningHanViet": "Bất Dụng",
        "meaningVi": "Không cần",
        "exampleSentence": "不用客气，这是我应该做的。",
        "exampleTranslation": "Không cần khách sáo, đây là điều tôi nên làm."
      }
    ]
  },
  {
    "topicId": 303,
    "title": "Bài 03 — Thực đơn, Thành tích & Thành phố",
    "description": "Gọi món nhà hàng, đánh giá thành tích, đời sống đô thị và trang phục.",
    "vocabularies": [
      {
        "vocabId": 680,
        "hanzi": "不同",
        "pinyin": "bù tóng",
        "meaningHanViet": "Bất Đồng",
        "meaningVi": "Khác nhau, không giống",
        "exampleSentence": "每个人对幸福的定义都有所不同。",
        "exampleTranslation": "Mỗi người đối với định nghĩa về hạnh phúc đều có điểm khác nhau."
      },
      {
        "vocabId": 681,
        "hanzi": "不久",
        "pinyin": "bùjiǔ",
        "meaningHanViet": "Bất Cửu",
        "meaningVi": "Không lâu, chẳng bao lâu",
        "exampleSentence": "他们结婚不久就迎来了可爱的宝宝。",
        "exampleTranslation": "Họ kết hôn chẳng bao lâu thì đón chào một em bé kháu khỉnh."
      },
      {
        "vocabId": 682,
        "hanzi": "不行",
        "pinyin": "bùxíng",
        "meaningHanViet": "Bất Hành",
        "meaningVi": "Không được, không thể",
        "exampleSentence": "这样违反纪律的行为是绝对不行的。",
        "exampleTranslation": "Hành vi vi phạm kỷ luật như vậy là tuyệt đối không được."
      },
      {
        "vocabId": 683,
        "hanzi": "才",
        "pinyin": "cái",
        "meaningHanViet": "Tài",
        "meaningVi": "Mới, vừa mới, tài năng",
        "exampleSentence": "经过一番周折，我们直到现在才到达目的地。",
        "exampleTranslation": "Sau bao trắc trở, mãi đến bây giờ chúng tôi mới tới được đích đến."
      },
      {
        "vocabId": 684,
        "hanzi": "菜单",
        "pinyin": "càidān",
        "meaningHanViet": "Thái Đơn",
        "meaningVi": "Thực đơn, menu",
        "exampleSentence": "服务员，请给我们拿一份最新的菜单。",
        "exampleTranslation": "Phục vụ viên, xin hãy đem cho chúng tôi một cuốn thực đơn mới nhất."
      },
      {
        "vocabId": 685,
        "hanzi": "参加",
        "pinyin": "cānjiā",
        "meaningHanViet": "Tham Gia",
        "meaningVi": "Tham gia, tham dự",
        "exampleSentence": "下周六我打算参加学校举行的汉字听写比赛。",
        "exampleTranslation": "Thứ bảy tuần sau tôi dự định tham gia cuộc thi nghe viết chữ Hán của trường."
      },
      {
        "vocabId": 686,
        "hanzi": "草",
        "pinyin": "cǎo",
        "meaningHanViet": "Thảo",
        "meaningVi": "Cỏ, cây cỏ",
        "exampleSentence": "山坡上长满了茂盛碧绿的小草。",
        "exampleTranslation": "Trên sườn núi mọc đầy những ngọn cỏ xanh tốt um tùm."
      },
      {
        "vocabId": 687,
        "hanzi": "草地",
        "pinyin": "cǎodì",
        "meaningHanViet": "Thảo Địa",
        "meaningVi": "Bãi cỏ, đồng cỏ",
        "exampleSentence": "孩子们在广阔的草地上开心地踢足球。",
        "exampleTranslation": "Lũ trẻ đang vui vẻ đá bóng trên bãi cỏ rộng thênh thang."
      },
      {
        "vocabId": 688,
        "hanzi": "层",
        "pinyin": "céng",
        "meaningHanViet": "Tằng",
        "meaningVi": "Tầng (nhà), lớp (bụi, sơn)",
        "exampleSentence": "我们的汉语教室在教学楼的三层。",
        "exampleTranslation": "Phòng học tiếng Trung của chúng tôi ở tầng ba của tòa nhà giảng dạy."
      },
      {
        "vocabId": 689,
        "hanzi": "查",
        "pinyin": "chá",
        "meaningHanViet": "Tra",
        "meaningVi": "Tra cứu, kiểm tra",
        "exampleSentence": "遇到不认识的生词可以用手机查词典。",
        "exampleTranslation": "Khi gặp từ mới không biết có thể dùng điện thoại tra từ điển."
      },
      {
        "vocabId": 37,
        "hanzi": "差",
        "pinyin": "chà",
        "meaningHanViet": "Sai",
        "meaningVi": "Kém, tồi; thiếu; chênh lệch",
        "exampleSentence": "现在差五分八点。",
        "exampleTranslation": "Bây giờ là tám giờ kém năm."
      },
      {
        "vocabId": 690,
        "hanzi": "差不多",
        "pinyin": "chàbuduō",
        "meaningHanViet": "Sai Bất Đa",
        "meaningVi": "Xấp xỉ, gần như, suýt soát",
        "exampleSentence": "两个孩子的年龄差不多大，玩得很投机。",
        "exampleTranslation": "Độ tuổi của hai đứa trẻ xấp xỉ nhau, chơi với nhau rất hợp."
      },
      {
        "vocabId": 691,
        "hanzi": "尝",
        "pinyin": "cháng",
        "meaningHanViet": "Thường",
        "meaningVi": "Nếm thử, thưởng thức",
        "exampleSentence": "你快来尝尝我亲手做的新鲜草莓蛋糕。",
        "exampleTranslation": "Bạn mau tới nếm thử chiếc bánh kem dâu tây do tự tay tôi làm."
      },
      {
        "vocabId": 38,
        "hanzi": "常",
        "pinyin": "cháng",
        "meaningHanViet": "Thường",
        "meaningVi": "Thường; thường xuyên",
        "exampleSentence": "我常去图书馆看书。",
        "exampleTranslation": "Tôi thường đến thư viện đọc sách."
      },
      {
        "vocabId": 692,
        "hanzi": "常见",
        "pinyin": "cháng jiàn",
        "meaningHanViet": "Thường Kiến",
        "meaningVi": "Thường thấy, phổ biến",
        "exampleSentence": "这是一种在北方很常见的落叶植物。",
        "exampleTranslation": "Đây là một loại thực vật rụng lá rất thường thấy ở miền Bắc."
      },
      {
        "vocabId": 693,
        "hanzi": "常用",
        "pinyin": "cháng yòng",
        "meaningHanViet": "Thường Dụng",
        "meaningVi": "Thường dùng, thông dụng",
        "exampleSentence": "这本小册子收录了三百个常用汉字。",
        "exampleTranslation": "Cuốn cẩm nang nhỏ này thu thập ba trăm chữ Hán thông dụng."
      },
      {
        "vocabId": 39,
        "hanzi": "常常",
        "pinyin": "chángcháng",
        "meaningHanViet": "Thường Thường",
        "meaningVi": "Thường xuyên; thường",
        "exampleSentence": "周末我常常和朋友聚会。",
        "exampleTranslation": "Cuối tuần tôi thường tụ tập với bạn bè."
      },
      {
        "vocabId": 694,
        "hanzi": "衬衫",
        "pinyin": "chènshān",
        "meaningHanViet": "Sấn Sam",
        "meaningVi": "Áo sơ mi",
        "exampleSentence": "他穿了一件洁白挺括的衬衫去面试。",
        "exampleTranslation": "Anh ấy mặc một chiếc áo sơ mi trắng tinh phẳng phiu đi phỏng vấn."
      },
      {
        "vocabId": 695,
        "hanzi": "成绩",
        "pinyin": "chéngjì",
        "meaningHanViet": "Thành Tích",
        "meaningVi": "Thành tích, kết quả học tập",
        "exampleSentence": "经过刻苦努力，她的期末考试成绩名列前茅。",
        "exampleTranslation": "Nhờ nỗ lực chăm chỉ, thành tích thi cuối kỳ của cô ấy đứng hàng đầu."
      },
      {
        "vocabId": 696,
        "hanzi": "城市",
        "pinyin": "chéngshì",
        "meaningHanViet": "Thành Thị",
        "meaningVi": "Thành phố, đô thị",
        "exampleSentence": "上海是一座充满生机与机遇的现代化大城市。",
        "exampleTranslation": "Thượng Hải là một thành phố lớn hiện đại tràn đầy sức sống và cơ hội."
      }
    ]
  },
  {
    "topicId": 304,
    "title": "Bài 04 — Xuất phát, Sinh nhật & Bánh ngọt",
    "description": "Lịch trình xuất phát, kỷ niệm ngày sinh, bánh ngọt và đồ dùng mang theo.",
    "vocabularies": [
      {
        "vocabId": 697,
        "hanzi": "迟到",
        "pinyin": "chídào",
        "meaningHanViet": "Trì Đáo",
        "meaningVi": "Trễ, muộn",
        "exampleSentence": "因为早高峰堵车，他今天上班迟到了十分钟。",
        "exampleTranslation": "Vì tắc đường vào giờ cao điểm buổi sáng, hôm nay anh ấy đi làm muộn mười phút."
      },
      {
        "vocabId": 698,
        "hanzi": "出发",
        "pinyin": "chūfā",
        "meaningHanViet": "Xuất Phát",
        "meaningVi": "Xuất phát, khởi hành",
        "exampleSentence": "明天清晨六点我们准时在校门口集合出发。",
        "exampleTranslation": "Sáu giờ sáng mai chúng tôi tập trung đúng giờ ở cổng trường để xuất phát."
      },
      {
        "vocabId": 699,
        "hanzi": "出生",
        "pinyin": "chūshēng",
        "meaningHanViet": "Xuất Sinh",
        "meaningVi": "Sinh ra, chào đời",
        "exampleSentence": "他出生在一个风景优美的水乡小镇。",
        "exampleTranslation": "Anh ấy sinh ra ở một thị trấn sông nước phong cảnh hữu tình."
      },
      {
        "vocabId": 700,
        "hanzi": "出院",
        "pinyin": "chūyuàn",
        "meaningHanViet": "Xuất Viện",
        "meaningVi": "Xuất viện, ra viện",
        "exampleSentence": "经过医生的精心治疗，奶奶今天终于出院了。",
        "exampleTranslation": "Sau thời gian được bác sĩ tận tình điều trị, bà nội hôm nay rốt cuộc đã xuất viện rồi."
      },
      {
        "vocabId": 701,
        "hanzi": "初中",
        "pinyin": "chūzhōng",
        "meaningHanViet": "Sơ Trung",
        "meaningVi": "Trường cấp hai, trung học cơ sở",
        "exampleSentence": "我们是从初中开始就同班的好朋友。",
        "exampleTranslation": "Chúng tôi là đôi bạn thân học cùng lớp từ thời cấp hai."
      },
      {
        "vocabId": 702,
        "hanzi": "除了",
        "pinyin": "chúle",
        "meaningHanViet": "Trừ Liễu",
        "meaningVi": "Ngoài ra, trừ... ra",
        "exampleSentence": "除了英语以外，他还自学了简单的日常日语。",
        "exampleTranslation": "Ngoài tiếng Anh ra, anh ấy còn tự học thêm tiếng Nhật giao tiếp đơn giản."
      },
      {
        "vocabId": 703,
        "hanzi": "船",
        "pinyin": "chuán",
        "meaningHanViet": "Thuyền",
        "meaningVi": "Thuyền, tàu, đò",
        "exampleSentence": "江面上缓缓驶过几艘满载货物的大船。",
        "exampleTranslation": "Trên mặt sông chầm chậm lướt qua mấy con thuyền lớn chở đầy hàng hóa."
      },
      {
        "vocabId": 704,
        "hanzi": "春天",
        "pinyin": "chūntiān",
        "meaningHanViet": "Xuân Thiên",
        "meaningVi": "Mùa xuân",
        "exampleSentence": "春天万物复苏，公园里百花齐放格外绚丽。",
        "exampleTranslation": "Mùa xuân vạn vật hồi sinh, trong công viên trăm hoa đua nở vô cùng rực rỡ."
      },
      {
        "vocabId": 705,
        "hanzi": "词典",
        "pinyin": "cídiǎn",
        "meaningHanViet": "Từ Điển",
        "meaningVi": "Từ điển",
        "exampleSentence": "遇到生词时查词典是最扎实的学习习惯。",
        "exampleTranslation": "Khi gặp từ mới tra từ điển là thói quen học tập vững chắc nhất."
      },
      {
        "vocabId": 706,
        "hanzi": "聪明",
        "pinyin": "cōngmíng",
        "meaningHanViet": "Thông Minh",
        "meaningVi": "Thông minh, lanh lợi",
        "exampleSentence": "小王非常聪明伶俐，总能迅速领会领导的意图。",
        "exampleTranslation": "Tiểu Vương rất thông minh lanh lợi, luôn nhanh chóng nắm bắt được ý đồ của cấp trên."
      },
      {
        "vocabId": 707,
        "hanzi": "打扫",
        "pinyin": "dǎsǎo",
        "meaningHanViet": "Đả Tảo",
        "meaningVi": "Quét dọn, dọn dẹp",
        "exampleSentence": "周末全家人一起把屋子彻底打扫得干干净净。",
        "exampleTranslation": "Cuối tuần cả nhà cùng nhau quét dọn căn nhà sạch sẽ tinh tươm."
      },
      {
        "vocabId": 708,
        "hanzi": "打算",
        "pinyin": "dǎsuàn",
        "meaningHanViet": "Đả Toán",
        "meaningVi": "Dự định, kế hoạch",
        "exampleSentence": "放假后我打算去拜访多年未见的老朋友。",
        "exampleTranslation": "Sau khi nghỉ lễ tôi dự định đi thăm người bạn cũ nhiều năm chưa gặp."
      },
      {
        "vocabId": 709,
        "hanzi": "大概",
        "pinyin": "dàgài",
        "meaningHanViet": "Đại Khái",
        "meaningVi": "Đại khái, khoảng chừng",
        "exampleSentence": "从这里坐车到市中心大概需要四十分钟。",
        "exampleTranslation": "Từ đây đi xe vào trung tâm thành phố đại khái cần bốn mươi phút."
      },
      {
        "vocabId": 710,
        "hanzi": "大人",
        "pinyin": "dàren",
        "meaningHanViet": "Đại Nhân",
        "meaningVi": "Người lớn, người trưởng thành",
        "exampleSentence": "大人们正在客厅里商量春节的聚会安排。",
        "exampleTranslation": "Người lớn đang ở phòng khách bàn bạc sắp xếp buổi tụ họp dịp Tết."
      },
      {
        "vocabId": 711,
        "hanzi": "大小",
        "pinyin": "dàxiǎo",
        "meaningHanViet": "Đại Tiểu",
        "meaningVi": "Kích cỡ, lớn nhỏ, độ to nhỏ",
        "exampleSentence": "这双皮鞋的大小正合适，穿着很舒服。",
        "exampleTranslation": "Kích cỡ của đôi giày da này vừa vặn, đi rất êm chân."
      },
      {
        "vocabId": 712,
        "hanzi": "大熊猫",
        "pinyin": "dàxióngmāo",
        "meaningHanViet": "Đại Hùng Miêu",
        "meaningVi": "Gấu trúc lớn",
        "exampleSentence": "憨态可掬的大熊猫深受世界各国人民的喜爱。",
        "exampleTranslation": "Những chú gấu trúc lớn ngộ nghĩnh đáng yêu được người dân khắp thế giới yêu thích."
      },
      {
        "vocabId": 713,
        "hanzi": "大衣",
        "pinyin": "dàyī",
        "meaningHanViet": "Đại Y",
        "meaningVi": "Áo khoác lớn, áo choàng, áo dạ",
        "exampleSentence": "冬天出门一定要穿上厚实保暖的羊毛大衣。",
        "exampleTranslation": "Mùa đông ra ngoài nhất định phải mặc chiếc áo khoác dạ len dày dặn giữ ấm."
      },
      {
        "vocabId": 714,
        "hanzi": "带",
        "pinyin": "dài",
        "meaningHanViet": "Đới",
        "meaningVi": "Mang theo, dẫn dắt, dây đai",
        "exampleSentence": "明天去郊游记得带好雨伞和足够的水。",
        "exampleTranslation": "Ngày mai đi dã ngoại nhớ mang theo ô và đủ nước uống."
      },
      {
        "vocabId": 715,
        "hanzi": "担心",
        "pinyin": "dānxīn",
        "meaningHanViet": "Đảm Tâm",
        "meaningVi": "Lo lắng, lo âu, bận tâm",
        "exampleSentence": "妈妈总是担心一个人在异国他乡求学的我。",
        "exampleTranslation": "Mẹ lúc nào cũng lo lắng cho tôi một mình học tập nơi đất khách quê người."
      },
      {
        "vocabId": 716,
        "hanzi": "蛋糕",
        "pinyin": "dàngāo",
        "meaningHanViet": "Đản Cao",
        "meaningVi": "Bánh gato, bánh kem",
        "exampleSentence": "生日聚会上，大家一起品尝美味的水果蛋糕。",
        "exampleTranslation": "Trong bữa tiệc sinh nhật, mọi người cùng thưởng thức chiếc bánh kem hoa quả thơm ngon."
      }
    ]
  },
  {
    "topicId": 305,
    "title": "Bài 05 — Cơ hội, Điểm số & Phương hướng",
    "description": "Nắm bắt cơ hội, đạt điểm số cao, địa lý đông tây nam bắc.",
    "vocabularies": [
      {
        "vocabId": 717,
        "hanzi": "当然",
        "pinyin": "dāngrán",
        "meaningHanViet": "Đương Nhiên",
        "meaningVi": "Đương nhiên, tất nhiên",
        "exampleSentence": "朋友有难，我们当然应该全力以赴提供帮助。",
        "exampleTranslation": "Bạn bè gặp khó khăn, chúng ta đương nhiên nên dốc hết sức giúp đỡ."
      },
      {
        "vocabId": 718,
        "hanzi": "到处",
        "pinyin": "dàochù",
        "meaningHanViet": "Đáo Xứ",
        "meaningVi": "Khắp nơi, mọi nơi, chốn chốn",
        "exampleSentence": "春天一到，漫山遍野到处盛开着五颜六色的野花。",
        "exampleTranslation": "Mùa xuân vừa đến, khắp đồi núi mọi nơi nở rộ những bông hoa dại muôn màu muôn vẻ."
      },
      {
        "vocabId": 719,
        "hanzi": "得",
        "pinyin": "dé",
        "meaningHanViet": "Đắc",
        "meaningVi": "Được, đạt được, nhận được",
        "exampleSentence": "他在这次中文朗诵大赛中得了一等奖。",
        "exampleTranslation": "Cậu ấy đã đạt được giải nhất trong cuộc thi ngâm thơ tiếng Trung lần này."
      },
      {
        "vocabId": 65,
        "hanzi": "得到",
        "pinyin": "dédào",
        "meaningHanViet": "Đắc Đáo",
        "meaningVi": "Được; đạt được; nhận được",
        "exampleSentence": "他得到了一份好工作。",
        "exampleTranslation": "Anh ấy đã nhận được một công việc tốt."
      },
      {
        "vocabId": 720,
        "hanzi": "得分",
        "pinyin": "défēn",
        "meaningHanViet": "Đắc Phân",
        "meaningVi": "Ghi điểm, đạt điểm số",
        "exampleSentence": "在前锋的精彩配合下，校足球队率先得分。",
        "exampleTranslation": "Dưới sự phối hợp ăn ý của tiền đạo, đội bóng đá trường đã dẫn trước ghi điểm."
      },
      {
        "vocabId": 721,
        "hanzi": "的话",
        "pinyin": "dehuà",
        "meaningHanViet": "Đích Thoại",
        "meaningVi": "Nếu, nếu như (ở cuối phân câu)",
        "exampleSentence": "如果明天不下雨的话，我们就按原计划去爬山。",
        "exampleTranslation": "Nếu ngày mai trời không mưa, chúng ta sẽ theo kế hoạch cũ đi leo núi."
      },
      {
        "vocabId": 722,
        "hanzi": "得",
        "pinyin": "děi",
        "meaningHanViet": "Đắc",
        "meaningVi": "Phải, cần phải (trợ động từ)",
        "exampleSentence": "时间不早了，我得马上赶回公司处理紧急事务。",
        "exampleTranslation": "Thời gian không còn sớm nữa, tôi phải mau chóng quay về công ty xử lý việc gấp."
      },
      {
        "vocabId": 723,
        "hanzi": "灯",
        "pinyin": "dēng",
        "meaningHanViet": "Đăng",
        "meaningVi": "Đèn, ngọn đèn, cây đèn",
        "exampleSentence": "夜晚的书桌前，台灯散发着柔和温馨的光线。",
        "exampleTranslation": "Trước bàn học ban đêm, ngọn đèn bàn tỏa ra ánh sáng ấm áp dịu nhẹ."
      },
      {
        "vocabId": 69,
        "hanzi": "地",
        "pinyin": "dì",
        "meaningHanViet": "Địa",
        "meaningVi": "Đất, mặt đất, vùng đất, nơi chốn",
        "exampleSentence": "地上有一本书。",
        "exampleTranslation": "Trên mặt đất có một quyển sách."
      },
      {
        "vocabId": 70,
        "hanzi": "地点",
        "pinyin": "dìdiǎn",
        "meaningHanViet": "Địa Điểm",
        "meaningVi": "Nơi; chỗ",
        "exampleSentence": "开会的地点在二楼。",
        "exampleTranslation": "Địa điểm họp ở tầng hai."
      },
      {
        "vocabId": 71,
        "hanzi": "地方",
        "pinyin": "dìfang",
        "meaningHanViet": "Địa Phương",
        "meaningVi": "Nơi chốn, chỗ, địa phương",
        "exampleSentence": "这是一个美丽的地方。",
        "exampleTranslation": "Đây là một nơi tươi đẹp."
      },
      {
        "vocabId": 73,
        "hanzi": "地图",
        "pinyin": "dìtú",
        "meaningHanViet": "Địa Đồ",
        "meaningVi": "Bản đồ",
        "exampleSentence": "请在地图上找一下这个城市。",
        "exampleTranslation": "Xin hãy tìm thành phố này trên bản đồ."
      },
      {
        "vocabId": 77,
        "hanzi": "电",
        "pinyin": "diàn",
        "meaningHanViet": "Điện",
        "meaningVi": "Điện; pin",
        "exampleSentence": "手机没有电了。",
        "exampleTranslation": "Điện thoại hết pin rồi."
      },
      {
        "vocabId": 724,
        "hanzi": "电梯",
        "pinyin": "diàntī",
        "meaningHanViet": "Điện Thê",
        "meaningVi": "Thang máy",
        "exampleSentence": "高峰期乘坐电梯请大家自觉遵守秩序排队。",
        "exampleTranslation": "Giờ cao điểm đi thang máy xin mọi người hãy tự giác tuân thủ trật tự xếp hàng."
      },
      {
        "vocabId": 725,
        "hanzi": "电子书",
        "pinyin": "diànzǐshū",
        "meaningHanViet": "Điện Tử Thư",
        "meaningVi": "Sách điện tử",
        "exampleSentence": "用阅读器看电子书非常方便，随时随地都能学。",
        "exampleTranslation": "Dùng máy đọc sách xem sách điện tử rất tiện lợi, có thể học mọi lúc mọi nơi."
      },
      {
        "vocabId": 726,
        "hanzi": "丢",
        "pinyin": "diū",
        "meaningHanViet": "Đưu",
        "meaningVi": "Vứt, đánh mất, rơi",
        "exampleSentence": "他不小心把刚刚借来的图书给弄丢了。",
        "exampleTranslation": "Anh ấy sơ ý làm mất cuốn sách vừa mới mượn về."
      },
      {
        "vocabId": 84,
        "hanzi": "东",
        "pinyin": "dōng",
        "meaningHanViet": "Đông",
        "meaningVi": "Phía đông, phương đông",
        "exampleSentence": "太阳从东方升起。",
        "exampleTranslation": "Mặt trời mọc từ hướng đông."
      },
      {
        "vocabId": 727,
        "hanzi": "东北",
        "pinyin": "dōngběi",
        "meaningHanViet": "Đông Bắc",
        "meaningVi": "Vùng đông bắc",
        "exampleSentence": "中国的东北地区有广袤肥沃的黑土地和壮丽雪景。",
        "exampleTranslation": "Vùng đông bắc Trung Quốc có vùng đất đen màu mỡ bao la và cảnh tuyết tráng lệ."
      },
      {
        "vocabId": 728,
        "hanzi": "东方",
        "pinyin": "dōngfāng",
        "meaningHanViet": "Đông Phương",
        "meaningVi": "Phương đông, phía đông",
        "exampleSentence": "太阳从东方冉冉升起，照亮了崭新的一天。",
        "exampleTranslation": "Mặt trời từ phương đông từ từ nhô lên, chiếu sáng một ngày mới tinh khôi."
      },
      {
        "vocabId": 729,
        "hanzi": "东南",
        "pinyin": "dōngnán",
        "meaningHanViet": "Đông Nam",
        "meaningVi": "Đông nam, phía đông nam",
        "exampleSentence": "东南亚地区以宜人的热带海岛风光闻名世界。",
        "exampleTranslation": "Khu vực Đông Nam Á nổi tiếng thế giới với phong cảnh đảo nhiệt đới dễ chịu."
      }
    ]
  },
  {
    "topicId": 306,
    "title": "Bài 06 — Mùa đông, Động vật & Tiện lợi",
    "description": "Khí hậu mùa đông, sở thú, mì ăn liền và các phương tiện tiện lợi.",
    "vocabularies": [
      {
        "vocabId": 730,
        "hanzi": "冬天",
        "pinyin": "dōngtiān",
        "meaningHanViet": "Đông Thiên",
        "meaningVi": "Mùa đông",
        "exampleSentence": "北方冬天的气温常常会降到零下十几度。",
        "exampleTranslation": "Nhiệt độ mùa đông ở miền bắc thường giảm xuống âm mười mấy độ."
      },
      {
        "vocabId": 731,
        "hanzi": "懂得",
        "pinyin": "dǒngde",
        "meaningHanViet": "Đổng Đắc",
        "meaningVi": "Hiểu được, thấu hiểu",
        "exampleSentence": "经过老师的循循善诱，他终于懂得如何解这道题了。",
        "exampleTranslation": "Nhờ thầy giáo ân cần chỉ bảo, cậu ấy rốt cuộc đã hiểu được cách giải bài toán này."
      },
      {
        "vocabId": 732,
        "hanzi": "动物",
        "pinyin": "dòngwù",
        "meaningHanViet": "Động Vật",
        "meaningVi": "Động vật, con vật",
        "exampleSentence": "关爱和保护身边的流浪小动物是善良的表现。",
        "exampleTranslation": "Yêu thương và bảo vệ động vật nhỏ lang thang quanh mình là biểu hiện của lòng nhân ái."
      },
      {
        "vocabId": 733,
        "hanzi": "动物园",
        "pinyin": "dòngwùyuán",
        "meaningHanViet": "Động Vật Viên",
        "meaningVi": "Vườn thú, sở thú",
        "exampleSentence": "周末许多家长带着孩子去动物园观察各种鸟类。",
        "exampleTranslation": "Cuối tuần nhiều phụ huynh dẫn con đi sở thú quan sát các loài chim."
      },
      {
        "vocabId": 734,
        "hanzi": "短",
        "pinyin": "duǎn",
        "meaningHanViet": "Đoản",
        "meaningVi": "Ngắn (độ dài, thời gian)",
        "exampleSentence": "这段假期虽然很短，但我们过得非常充实愉快。",
        "exampleTranslation": "Kỳ nghỉ này tuy rất ngắn nhưng chúng tôi đã trải qua vô cùng trọn vẹn và vui vẻ."
      },
      {
        "vocabId": 735,
        "hanzi": "短裤",
        "pinyin": "duǎnkù",
        "meaningHanViet": "Đoản Khố",
        "meaningVi": "Quần đùi, quần soóc",
        "exampleSentence": "夏天气温高，大家都喜欢穿轻爽透气的短裤。",
        "exampleTranslation": "Mùa hè nhiệt độ cao, mọi người đều thích mặc quần soóc thoáng mát nhẹ nhàng."
      },
      {
        "vocabId": 736,
        "hanzi": "段",
        "pinyin": "duàn",
        "meaningHanViet": "Đoạn",
        "meaningVi": "Đoạn, quãng (thời gian, đường)",
        "exampleSentence": "这段精彩的课文需要大家在下课后背诵下来。",
        "exampleTranslation": "Đoạn văn bài khóa đặc sắc này cần mọi người học thuộc sau giờ học."
      },
      {
        "vocabId": 737,
        "hanzi": "锻炼",
        "pinyin": "duànliàn",
        "meaningHanViet": "Đoàn Luyện",
        "meaningVi": "Rèn luyện, tập luyện",
        "exampleSentence": "每天坚持慢跑锻炼有助于增强心肺功能。",
        "exampleTranslation": "Mỗi ngày kiên trì chạy bộ rèn luyện giúp tăng cường chức năng tim phổi."
      },
      {
        "vocabId": 738,
        "hanzi": "对话",
        "pinyin": "duìhuà",
        "meaningHanViet": "Đối Thoại",
        "meaningVi": "Đối thoại, hội thoại",
        "exampleSentence": "两位老朋友在咖啡馆里进行着亲切的面对面对话。",
        "exampleTranslation": "Hai người bạn cũ đang có cuộc đối thoại trực tiếp thân mật trong quán cà phê."
      },
      {
        "vocabId": 96,
        "hanzi": "饿",
        "pinyin": "è",
        "meaningHanViet": "Ngạ",
        "meaningVi": "Đói; làm cho đói",
        "exampleSentence": "我肚子饿了，想吃东西。",
        "exampleTranslation": "Bụng tôi đói rồi, muốn ăn gì đó."
      },
      {
        "vocabId": 739,
        "hanzi": "而且",
        "pinyin": "érqiě",
        "meaningHanViet": "Nhi Thả",
        "meaningVi": "Mà còn, hơn nữa",
        "exampleSentence": "她不仅歌唱得动听，而且舞姿也十分优美。",
        "exampleTranslation": "Cô ấy không chỉ hát rất êm tai mà hơn nữa vũ điệu cũng vô cùng uyển chuyển."
      },
      {
        "vocabId": 740,
        "hanzi": "耳朵",
        "pinyin": "ěrduo",
        "meaningHanViet": "Nhĩ Đoá",
        "meaningVi": "Tai, đôi tai",
        "exampleSentence": "保护耳朵健康，平时听音乐音量不要开得过大。",
        "exampleTranslation": "Bảo vệ đôi tai khỏe mạnh, thường ngày nghe nhạc âm lượng đừng mở quá to."
      },
      {
        "vocabId": 741,
        "hanzi": "耳机",
        "pinyin": "ěrjī",
        "meaningHanViet": "Nhĩ Cơ",
        "meaningVi": "Tai nghe",
        "exampleSentence": "在安静的公共自习室里听录音请一定要戴上耳机。",
        "exampleTranslation": "Trong phòng tự học công cộng yên tĩnh nghe băng ghi âm xin nhất định phải đeo tai nghe."
      },
      {
        "vocabId": 742,
        "hanzi": "发",
        "pinyin": "fā",
        "meaningHanViet": "Phát",
        "meaningVi": "Gửi, phát, xuất phát, phát ra",
        "exampleSentence": "我已经把修改好的电子版报告发到您的邮箱里了。",
        "exampleTranslation": "Tôi đã gửi bản báo cáo điện tử đã sửa vào hòm thư của bạn rồi."
      },
      {
        "vocabId": 743,
        "hanzi": "发烧",
        "pinyin": "fāshāo",
        "meaningHanViet": "Phát Thiêu",
        "meaningVi": "Phát sốt, sốt",
        "exampleSentence": "孩子今天额头发烧发烫，需要马上送医院检查。",
        "exampleTranslation": "Trán em bé hôm nay sốt nóng ran, cần lập tức đưa đến bệnh viện khám."
      },
      {
        "vocabId": 744,
        "hanzi": "发生",
        "pinyin": "fāshēng",
        "meaningHanViet": "Phát Sinh",
        "meaningVi": "Xảy ra, phát sinh",
        "exampleSentence": "十字路口发生了一起因闯红灯引起的轻微擦伤事故。",
        "exampleTranslation": "Tại ngã tư đã xảy ra một vụ va quẹt nhẹ do vượt đèn đỏ."
      },
      {
        "vocabId": 745,
        "hanzi": "发现",
        "pinyin": "fāxiàn",
        "meaningHanViet": "Phát Hiện",
        "meaningVi": "Phát hiện, nhận ra",
        "exampleSentence": "科学家在显微镜下发现了这种全新微生物的结构。",
        "exampleTranslation": "Các nhà khoa học dưới kính hiển vi đã phát hiện ra cấu trúc của loài vi sinh vật hoàn toàn mới này."
      },
      {
        "vocabId": 746,
        "hanzi": "发展",
        "pinyin": "fāzhǎn",
        "meaningHanViet": "Phát Triển",
        "meaningVi": "Phát triển, mở rộng",
        "exampleSentence": "随着科技的飞速发展，人工智能深刻改变着世界。",
        "exampleTranslation": "Cùng với sự phát triển thần tốc của công nghệ, trí tuệ nhân tạo đang thay đổi sâu sắc thế giới."
      },
      {
        "vocabId": 747,
        "hanzi": "方便",
        "pinyin": "fāngbiàn",
        "meaningHanViet": "Phương Tiện",
        "meaningVi": "Thuận tiện, tiện lợi",
        "exampleSentence": "移动支付的全面普及给人们的日常生活带来了极大方便。",
        "exampleTranslation": "Sự phổ cập toàn diện của thanh toán di động mang lại sự thuận tiện to lớn cho cuộc sống thường ngày."
      },
      {
        "vocabId": 748,
        "hanzi": "方便面",
        "pinyin": "fāngbiànmiàn",
        "meaningHanViet": "Phương Tiện Diện",
        "meaningVi": "Mì ăn liền, mì tôm",
        "exampleSentence": "虽然方便面快捷美味，但平时还是应该多吃新鲜饭菜。",
        "exampleTranslation": "Tuy mì ăn liền nhanh gọn ngon miệng nhưng thường ngày vẫn nên ăn nhiều cơm canh tươi ngon."
      }
    ]
  },
  {
    "topicId": 307,
    "title": "Bài 07 — Phương pháp, Cảm mạo & Công việc",
    "description": "Tìm kiếm phương pháp, bảo vệ sức khỏe khi cảm mạo và làm việc chăm chỉ.",
    "vocabularies": [
      {
        "vocabId": 749,
        "hanzi": "方法",
        "pinyin": "fāngfǎ",
        "meaningHanViet": "Phương Pháp",
        "meaningVi": "Phương pháp, cách thức",
        "exampleSentence": "掌握科学有效的背诵方法能够极大提高词汇记忆速度。",
        "exampleTranslation": "Nắm vững phương pháp học thuộc khoa học hiệu quả có thể nâng cao tốc độ ghi nhớ từ vựng rất nhiều."
      },
      {
        "vocabId": 750,
        "hanzi": "方向",
        "pinyin": "fāngxiàng",
        "meaningHanViet": "Phương Hướng",
        "meaningVi": "Phương hướng, hướng",
        "exampleSentence": "指南针在茫茫的大海上始终为水手们指引正确方向。",
        "exampleTranslation": "Chiếc la bàn trên biển cả bao la luôn chỉ dẫn phương hướng chính xác cho các thủy thủ."
      },
      {
        "vocabId": 102,
        "hanzi": "房子",
        "pinyin": "fángzi",
        "meaningHanViet": "Phòng Tử",
        "meaningVi": "Nhà; tòa nhà",
        "exampleSentence": "他们买了一套新房子。",
        "exampleTranslation": "Họ đã mua một ngôi nhà mới."
      },
      {
        "vocabId": 103,
        "hanzi": "放",
        "pinyin": "fàng",
        "meaningHanViet": "Phóng",
        "meaningVi": "Đặt; để; buông; thả",
        "exampleSentence": "请把书放在桌子上。",
        "exampleTranslation": "Xin hãy để sách lên bàn."
      },
      {
        "vocabId": 104,
        "hanzi": "放假",
        "pinyin": "fàngjià",
        "meaningHanViet": "Phóng Giá",
        "meaningVi": "Nghỉ lễ hoặc kỳ nghỉ",
        "exampleSentence": "下周我们放假三天。",
        "exampleTranslation": "Tuần tới chúng tôi được nghỉ ba ngày."
      },
      {
        "vocabId": 751,
        "hanzi": "放心",
        "pinyin": "fàngxīn",
        "meaningHanViet": "Phóng Tâm",
        "meaningVi": "Yên tâm, an lòng",
        "exampleSentence": "有经验丰富的老医生主刀，请家属们尽管放心。",
        "exampleTranslation": "Có bác sĩ lâu năm giàu kinh nghiệm mổ chính, xin người nhà hãy yên tâm."
      },
      {
        "vocabId": 105,
        "hanzi": "放学",
        "pinyin": "fàngxué",
        "meaningHanViet": "Phóng Học",
        "meaningVi": "Tan học",
        "exampleSentence": "下午五点学生们放学。",
        "exampleTranslation": "Năm giờ chiều học sinh tan học."
      },
      {
        "vocabId": 752,
        "hanzi": "分开",
        "pinyin": "fēnkāi",
        "meaningHanViet": "Phân Khai",
        "meaningVi": "Tách ra, phân tách",
        "exampleSentence": "毕业后大家虽然分开了，但深厚的友谊永不褪色。",
        "exampleTranslation": "Sau khi tốt nghiệp tuy mọi người đã tách rời nhưng tình bạn sâu sắc không bao giờ phai nhạt."
      },
      {
        "vocabId": 110,
        "hanzi": "风",
        "pinyin": "fēng",
        "meaningHanViet": "Phong",
        "meaningVi": "Gió; tin tức",
        "exampleSentence": "今天外面的风很大。",
        "exampleTranslation": "Hôm nay gió ngoài trời rất to."
      },
      {
        "vocabId": 753,
        "hanzi": "封",
        "pinyin": "fēng",
        "meaningHanViet": "Phong",
        "meaningVi": "Bức, phong (lượng từ thư từ), phong tỏa",
        "exampleSentence": "他给远方的父母寄去了一封充满真情的家书。",
        "exampleTranslation": "Anh ấy đã gửi về cho cha mẹ ở phương xa một phong thư nhà chan chứa tình cảm chân thành."
      },
      {
        "vocabId": 754,
        "hanzi": "夫妻",
        "pinyin": "fūqī",
        "meaningHanViet": "Phu Thê",
        "meaningVi": "Vợ chồng",
        "exampleSentence": "这对老夫妻相濡以沫走过了整整五十个春秋。",
        "exampleTranslation": "Cặp vợ chồng già này đã gắn bó sớm tối bên nhau trải qua trọn vẹn năm mươi mùa xuân thu."
      },
      {
        "vocabId": 755,
        "hanzi": "服务",
        "pinyin": "fúwù",
        "meaningHanViet": "Phục Vụ",
        "meaningVi": "Phục vụ, dịch vụ",
        "exampleSentence": "这家航空公司的空乘人员以周到热情的高品质服务闻名。",
        "exampleTranslation": "Đội ngũ tiếp viên của hãng hàng không này nổi tiếng với dịch vụ chu đáo nhiệt tình chất lượng cao."
      },
      {
        "vocabId": 756,
        "hanzi": "附近",
        "pinyin": "fùjìn",
        "meaningHanViet": "Phụ Cận",
        "meaningVi": "Gần đây, vùng lân cận",
        "exampleSentence": "学校附近生活配套设施齐全，有许多便利店和餐馆。",
        "exampleTranslation": "Vùng lân cận trường học các tiện ích sinh hoạt rất đầy đủ, có nhiều cửa hàng tiện lợi và quán ăn."
      },
      {
        "vocabId": 757,
        "hanzi": "复习",
        "pinyin": "fùxí",
        "meaningHanViet": "Phục Tập",
        "meaningVi": "Ôn tập, xem lại bài",
        "exampleSentence": "期末考试前大家都在抓紧时间全面复习所学知识。",
        "exampleTranslation": "Trước kỳ thi cuối kỳ mọi người đều đang tranh thủ thời gian ôn tập toàn diện kiến thức đã học."
      },
      {
        "vocabId": 758,
        "hanzi": "该",
        "pinyin": "gāi",
        "meaningHanViet": "Cai",
        "meaningVi": "Nên, cần phải, đến lượt",
        "exampleSentence": "大家轮流值日，今天按照规定该轮到你打扫卫生了。",
        "exampleTranslation": "Mọi người luân phiên trực nhật, hôm nay theo quy định nên đến lượt bạn quét dọn vệ sinh rồi."
      },
      {
        "vocabId": 112,
        "hanzi": "干净",
        "pinyin": "gānjìng",
        "meaningHanViet": "Can Tịnh",
        "meaningVi": "Sạch; gọn gàng",
        "exampleSentence": "这个教室真干净。",
        "exampleTranslation": "Lớp học này thật sạch sẽ."
      },
      {
        "vocabId": 759,
        "hanzi": "感兴趣",
        "pinyin": "gǎn xìngqù",
        "meaningHanViet": "Cảm Hứng Thú",
        "meaningVi": "Có hứng thú, quan tâm",
        "exampleSentence": "他对中国悠久独特的传统陶瓷艺术非常感兴趣。",
        "exampleTranslation": "Anh ấy vô cùng có hứng thú với nghệ thuật gốm sứ truyền thống lâu đời độc đáo của Trung Quốc."
      },
      {
        "vocabId": 760,
        "hanzi": "感到",
        "pinyin": "gǎndào",
        "meaningHanViet": "Cảm Đáo",
        "meaningVi": "Cảm thấy, thấy",
        "exampleSentence": "看到学生们取得了优异的成绩，老师感到无比欣慰。",
        "exampleTranslation": "Nhìn thấy các học sinh đạt được thành tích xuất sắc, thầy giáo cảm thấy vô cùng an lòng và tự hào."
      },
      {
        "vocabId": 761,
        "hanzi": "感冒",
        "pinyin": "gǎnmào",
        "meaningHanViet": "Cảm Mạo",
        "meaningVi": "Cảm cúm, bị cúm",
        "exampleSentence": "最近流感流行，如果不幸感冒了一定要多休息多喝水。",
        "exampleTranslation": "Gần đây cúm đang lây lan, nếu không may bị cảm cúm nhất định phải nghỉ ngơi nhiều và uống nhiều nước."
      },
      {
        "vocabId": 113,
        "hanzi": "干",
        "pinyin": "gàn",
        "meaningHanViet": "Can",
        "meaningVi": "Làm, làm việc, đảm đương",
        "exampleSentence": "你在干什么呢？",
        "exampleTranslation": "Bạn đang làm gì thế?"
      }
    ]
  },
  {
    "topicId": 308,
    "title": "Bài 08 — Đường sắt cao tốc, Quốc gia & Lễ tết",
    "description": "Tàu cao tốc hiện đại, văn hóa quốc gia, ngày lễ tết và quá khứ.",
    "vocabularies": [
      {
        "vocabId": 762,
        "hanzi": "刚",
        "pinyin": "gāng",
        "meaningHanViet": "Cương",
        "meaningVi": "Vừa, vừa mới, cứng",
        "exampleSentence": "新泡的热茶温度刚合适，喝一口满嘴留香。",
        "exampleTranslation": "Tách trà nóng mới pha nhiệt độ vừa vặn, nhấp một ngụm hương thơm lưu lại đầy vòm miệng."
      },
      {
        "vocabId": 763,
        "hanzi": "刚才",
        "pinyin": "gāngcái",
        "meaningHanViet": "Cương Tài",
        "meaningVi": "Vừa mới, ban nãy",
        "exampleSentence": "他刚才还在操场跑步，现在已经回宿舍冲凉了。",
        "exampleTranslation": "Cậu ấy vừa nãy còn chạy bộ ở sân vận động, bây giờ đã về ký túc xá tắm mát rồi."
      },
      {
        "vocabId": 764,
        "hanzi": "刚刚",
        "pinyin": "gānggāng",
        "meaningHanViet": "Cương Cương",
        "meaningVi": "Vừa mới đây, vừa xong",
        "exampleSentence": "妈妈刚刚烤好的香甜饼干散发着诱人的奶香味。",
        "exampleTranslation": "Món bánh quy thơm ngọt mẹ vừa mới nướng xong tỏa ra hương thơm ngậy của sữa đầy cuốn hút."
      },
      {
        "vocabId": 765,
        "hanzi": "高铁",
        "pinyin": "gāotiě",
        "meaningHanViet": "Cao Thiết",
        "meaningVi": "Đường sắt cao tốc, tàu cao tốc",
        "exampleSentence": "乘坐高铁从北京到上海只需要四个多小时。",
        "exampleTranslation": "Ngồi tàu cao tốc từ Bắc Kinh đến Thượng Hải chỉ mất hơn bốn tiếng đồng hồ."
      },
      {
        "vocabId": 766,
        "hanzi": "根据",
        "pinyin": "gēnjù",
        "meaningHanViet": "Căn Cứ",
        "meaningVi": "Căn cứ vào, dựa theo",
        "exampleSentence": "我们要根据实际的市场调研数据来制定营销策略。",
        "exampleTranslation": "Chúng ta phải căn cứ vào số liệu điều tra thị trường thực tế để hoạch định chiến lược tiếp thị."
      },
      {
        "vocabId": 767,
        "hanzi": "更",
        "pinyin": "gèng",
        "meaningHanViet": "Canh",
        "meaningVi": "Càng, hơn nữa",
        "exampleSentence": "雨过天晴之后，整座青山显得更加青翠欲滴。",
        "exampleTranslation": "Sau cơn mưa trời hửng nắng, toàn bộ ngọn núi xanh hiện lên càng thêm mướt mát xanh tươi."
      },
      {
        "vocabId": 768,
        "hanzi": "公斤",
        "pinyin": "gōngjīn",
        "meaningHanViet": "Công Cân",
        "meaningVi": "Kilôgam, cân tây (kg)",
        "exampleSentence": "请给我称两公斤新鲜红透的富士苹果。",
        "exampleTranslation": "Xin hãy cân giúp tôi hai kilôgam táo Phú Sĩ đỏ tươi chín mọng."
      },
      {
        "vocabId": 769,
        "hanzi": "公园",
        "pinyin": "gōngyuán",
        "meaningHanViet": "Công Viên",
        "meaningVi": "Công viên",
        "exampleSentence": "清晨许多老年人在绿树成荫的城市公园里打太极拳。",
        "exampleTranslation": "Sáng sớm nhiều người cao tuổi tập thái cực quyền trong công viên thành phố rợp bóng cây xanh."
      },
      {
        "vocabId": 770,
        "hanzi": "工作日",
        "pinyin": "gōngzuòrì",
        "meaningHanViet": "Công Tác Nhật",
        "meaningVi": "Ngày làm việc",
        "exampleSentence": "银行在工作日正常对外营业，周末仅办理部分业务。",
        "exampleTranslation": "Ngân hàng mở cửa giao dịch bình thường vào ngày làm việc, cuối tuần chỉ xử lý một phần nghiệp vụ."
      },
      {
        "vocabId": 771,
        "hanzi": "故事",
        "pinyin": "gùshi",
        "meaningHanViet": "Cố Sự",
        "meaningVi": "Câu chuyện, tích xưa",
        "exampleSentence": "睡前给孩子讲一个生动有趣的寓言故事能够启发智慧。",
        "exampleTranslation": "Trước giờ ngủ kể cho con nghe một câu chuyện ngụ ngôn sinh động thú vị có thể gợi mở trí tuệ."
      },
      {
        "vocabId": 772,
        "hanzi": "刮",
        "pinyin": "guā",
        "meaningHanViet": "Quát",
        "meaningVi": "Thổi (gió), cạo (râu)",
        "exampleSentence": "呼啸的北风刮得树叶沙沙作响漫天飞舞。",
        "exampleTranslation": "Cơn gió bắc rít từng cơn thổi lá cây xào xạc bay ngập trời."
      },
      {
        "vocabId": 125,
        "hanzi": "关",
        "pinyin": "guān",
        "meaningHanViet": "Quan",
        "meaningVi": "Đóng; tắt; quan hệ",
        "exampleSentence": "请关上门。",
        "exampleTranslation": "Xin hãy đóng cửa lại."
      },
      {
        "vocabId": 773,
        "hanzi": "关机",
        "pinyin": "guānjī",
        "meaningHanViet": "Quan Cơ",
        "meaningVi": "Tắt máy (điện thoại, máy tính)",
        "exampleSentence": "飞机起飞和降落阶段请旅客们务必自觉关机。",
        "exampleTranslation": "Giai đoạn máy bay cất cánh và hạ cánh xin hành khách nhất thiết tự giác tắt máy."
      },
      {
        "vocabId": 774,
        "hanzi": "关系",
        "pinyin": "guānxì",
        "meaningHanViet": "Quan Hệ",
        "meaningVi": "Quan hệ, mối quan hệ",
        "exampleSentence": "良好的邻里关系有助于营造和谐温馨的居住环境。",
        "exampleTranslation": "Mối quan hệ hàng xóm láng giềng tốt đẹp giúp tạo dựng môi trường sống hòa thuận ấm cúng."
      },
      {
        "vocabId": 775,
        "hanzi": "关心",
        "pinyin": "guānxīn",
        "meaningHanViet": "Quan Tâm",
        "meaningVi": "Quan tâm, săn sóc",
        "exampleSentence": "父母无微不至的关心是我们成长路上最坚强的后盾。",
        "exampleTranslation": "Sự quan tâm chu đáo từng li từng tí của cha mẹ là chỗ dựa vững chắc nhất trên đường ta khôn lớn."
      },
      {
        "vocabId": 776,
        "hanzi": "关于",
        "pinyin": "guānyú",
        "meaningHanViet": "Quan Vu",
        "meaningVi": "Về, liên quan đến",
        "exampleSentence": "今天下午有一场关于环境保护的专业专题学术讲座。",
        "exampleTranslation": "Chiều hôm nay có một buổi tọa đàm học thuật chuyên đề về bảo vệ môi trường."
      },
      {
        "vocabId": 777,
        "hanzi": "关注",
        "pinyin": "guānzhù",
        "meaningHanViet": "Quan Chú",
        "meaningVi": "Theo dõi, chú ý, quan tâm",
        "exampleSentence": "欢迎大家持续关注我们公众号发布的最新权威资讯。",
        "exampleTranslation": "Hoan nghênh mọi người tiếp tục theo dõi các thông tin uy tín mới nhất đăng tải trên tài khoản chính thức của chúng tôi."
      },
      {
        "vocabId": 129,
        "hanzi": "国家",
        "pinyin": "guójiā",
        "meaningHanViet": "Quốc Gia",
        "meaningVi": "Quốc gia; dân tộc; nhà nước",
        "exampleSentence": "世界上有很多国家。",
        "exampleTranslation": "Trên thế giới có rất nhiều quốc gia."
      },
      {
        "vocabId": 778,
        "hanzi": "过节",
        "pinyin": "guòjié",
        "meaningHanViet": "Quá Tiết",
        "meaningVi": "Đón lễ, ăn tết, đón ngày lễ",
        "exampleSentence": "每逢过节，家家户户门前都会张贴喜庆的红色春联。",
        "exampleTranslation": "Mỗi dịp đón ngày lễ, trước cửa mỗi nhà đều dán đôi câu đối đỏ rộn ràng đón xuân."
      },
      {
        "vocabId": 779,
        "hanzi": "过去",
        "pinyin": "guòqù",
        "meaningHanViet": "Quá Khứ",
        "meaningVi": "Quá khứ, trước kia",
        "exampleSentence": "过去的经验教训能够为未来的前行指引正确方向。",
        "exampleTranslation": "Những kinh nghiệm và bài học trong quá khứ có thể chỉ dẫn phương hướng đúng đắn cho chặng đường phía trước."
      }
    ]
  },
  {
    "topicId": 309,
    "title": "Bài 09 — Biển cả, Môi trường & Đổi trả",
    "description": "Cảnh sắc biển cả, bảo vệ môi trường, đổi tiền và mua sắm.",
    "vocabularies": [
      {
        "vocabId": 780,
        "hanzi": "海",
        "pinyin": "hǎi",
        "meaningHanViet": "Hải",
        "meaningVi": "Biển, đại dương",
        "exampleSentence": "蔚蓝辽阔的大海边，海鸥在波涛之上展翅翱翔。",
        "exampleTranslation": "Bên bờ biển xanh thẳm bao la, đàn hải âu dang rộng đôi cánh lượn bay trên sóng biếc."
      },
      {
        "vocabId": 781,
        "hanzi": "害怕",
        "pinyin": "hàipà",
        "meaningHanViet": "Hại Phạ",
        "meaningVi": "Sợ hãi, lo sợ",
        "exampleSentence": "面对突如其来的困难，勇敢坚强的人从不感到害怕。",
        "exampleTranslation": "Đối diện với khó khăn ập đến bất ngờ, người dũng cảm kiên cường chưa từng biết sợ hãi."
      },
      {
        "vocabId": 782,
        "hanzi": "好多",
        "pinyin": "hǎoduō",
        "meaningHanViet": "Hảo Đa",
        "meaningVi": "Rất nhiều, nhiều",
        "exampleSentence": "他在中国留学的几年里结识了好多志同道合的好朋友。",
        "exampleTranslation": "Trong mấy năm du học tại Trung Quốc anh ấy đã làm quen được rất nhiều người bạn thân cùng chí hướng."
      },
      {
        "vocabId": 783,
        "hanzi": "好久",
        "pinyin": "hǎojiǔ",
        "meaningHanViet": "Hảo Cửu",
        "meaningVi": "Lâu rồi, thời gian dài",
        "exampleSentence": "我们已经好久没有坐在一起促膝长谈了。",
        "exampleTranslation": "Chúng ta đã lâu lắm rồi không ngồi cùng nhau trò chuyện tâm tình."
      },
      {
        "vocabId": 784,
        "hanzi": "好像",
        "pinyin": "hǎoxiàng",
        "meaningHanViet": "Hảo Tượng",
        "meaningVi": "Hình như, dường như",
        "exampleSentence": "看这阴沉沉的天色，外面好像马上就要下雷阵雨了。",
        "exampleTranslation": "Nhìn sắc trời u ám thế này, hình như bên ngoài sắp sửa đổ mưa rào sấm chớp rồi."
      },
      {
        "vocabId": 785,
        "hanzi": "号码",
        "pinyin": "hàomǎ",
        "meaningHanViet": "Hiệu Mã",
        "meaningVi": "Mã số, số hiệu",
        "exampleSentence": "请在回执单上清晰工整地留下您的手机联系号码。",
        "exampleTranslation": "Xin hãy để lại số điện thoại di động liên lạc của bạn một cách rõ ràng ngay ngắn trên phiếu biên nhận."
      },
      {
        "vocabId": 786,
        "hanzi": "河",
        "pinyin": "hé",
        "meaningHanViet": "Hà",
        "meaningVi": "Sông, dòng sông",
        "exampleSentence": "一条清澈碧绿的母亲河穿过整座古老悠远的小镇。",
        "exampleTranslation": "Một dòng sông mẹ trong xanh hiền hòa chảy xuyên qua toàn bộ thị trấn cổ kính xa xưa."
      },
      {
        "vocabId": 787,
        "hanzi": "合适",
        "pinyin": "héshì",
        "meaningHanViet": "Hợp Thích",
        "meaningVi": "Phù hợp, thích hợp",
        "exampleSentence": "找一份自己真正喜欢且各方面合适的工作并不容易。",
        "exampleTranslation": "Tìm được một công việc mà bản thân thực sự yêu thích và mọi mặt đều phù hợp quả thực không dễ."
      },
      {
        "vocabId": 788,
        "hanzi": "黑板",
        "pinyin": "hēibǎn",
        "meaningHanViet": "Hắc Bản",
        "meaningVi": "Bảng đen",
        "exampleSentence": "上课时老师在黑板上用白色粉笔工整地书写重点汉字。",
        "exampleTranslation": "Trong giờ học thầy giáo dùng phấn trắng viết nắn nót các chữ Hán trọng tâm lên bảng đen."
      },
      {
        "vocabId": 789,
        "hanzi": "红绿灯",
        "pinyin": "hóng-lǜdēng",
        "meaningHanViet": "Hồng Lục Đăng",
        "meaningVi": "Đèn giao thông, đèn đỏ đèn xanh",
        "exampleSentence": "过繁忙十字路口一定要严格看清红绿灯指示再通行。",
        "exampleTranslation": "Khi qua ngã tư bận rộn nhất định phải nhìn thật kỹ tín hiệu đèn giao thông rồi mới qua đường."
      },
      {
        "vocabId": 790,
        "hanzi": "后来",
        "pinyin": "hòulái",
        "meaningHanViet": "Hậu Lai",
        "meaningVi": "Sau này, về sau",
        "exampleSentence": "他后来凭借刻苦不懈的钻研成为了一名行业领军专家。",
        "exampleTranslation": "Về sau nhờ sự nghiên cứu miệt mài không ngừng anh ấy đã trở thành một chuyên gia đầu ngành."
      },
      {
        "vocabId": 791,
        "hanzi": "后年",
        "pinyin": "hòunián",
        "meaningHanViet": "Hậu Niên",
        "meaningVi": "Năm kia (hai năm sau)",
        "exampleSentence": "按照学制规划，她预计将在后年夏天顺利完成硕士学业。",
        "exampleTranslation": "Theo kế hoạch đào tạo, cô ấy dự kiến sẽ hoàn thành thuận lợi chương trình thạc sĩ vào mùa hè năm kia."
      },
      {
        "vocabId": 149,
        "hanzi": "后天",
        "pinyin": "hòutiān",
        "meaningHanViet": "Hậu Thiên",
        "meaningVi": "Ngày kia, ngày mốt",
        "exampleSentence": "后天是星期天。",
        "exampleTranslation": "Ngày kia là chủ nhật."
      },
      {
        "vocabId": 792,
        "hanzi": "护照",
        "pinyin": "hùzhào",
        "meaningHanViet": "Hộ Chiếu",
        "meaningVi": "Hộ chiếu",
        "exampleSentence": "出国旅游前一定要仔细检查本人护照的有效签证期限。",
        "exampleTranslation": "Trước khi ra nước ngoài du lịch nhất định phải kiểm tra kỹ thời hạn thị thực còn hiệu lực trên hộ chiếu cá nhân."
      },
      {
        "vocabId": 793,
        "hanzi": "花园",
        "pinyin": "huāyuán",
        "meaningHanViet": "Hoa Viên",
        "meaningVi": "Vườn hoa",
        "exampleSentence": "小区的花园里春天百花争艳，草木青翠宜人。",
        "exampleTranslation": "Trong vườn hoa của khu dân cư mùa xuân trăm hoa đua nở, cây cỏ xanh tươi dễ chịu."
      },
      {
        "vocabId": 794,
        "hanzi": "画家",
        "pinyin": "huàjiā",
        "meaningHanViet": "Hoạ Gia",
        "meaningVi": "Họa sĩ",
        "exampleSentence": "著名中国画画家齐白石笔下的人物花鸟跃然纸上。",
        "exampleTranslation": "Nhân vật, hoa cỏ chim muông dưới ngòi bút của họa sĩ tranh Trung Quốc trứ danh Tề Bạch Thạch sống động như thật."
      },
      {
        "vocabId": 795,
        "hanzi": "欢迎",
        "pinyin": "huānyíng",
        "meaningHanViet": "Hoan Nghênh",
        "meaningVi": "Hoan nghênh, chào đón",
        "exampleSentence": "热烈欢迎来自五湖四海的新留学生来到我们大学深造。",
        "exampleTranslation": "Nhiệt liệt chào đón các tân du học sinh đến từ bốn phương về học tập nâng cao tại trường đại học chúng tôi."
      },
      {
        "vocabId": 153,
        "hanzi": "还",
        "pinyin": "huán",
        "meaningHanViet": "Hoàn",
        "meaningVi": "Trả lại, hoàn lại, quay về",
        "exampleSentence": "这本书我明天还给你。",
        "exampleTranslation": "Quyển sách này ngày mai tôi sẽ trả lại cho bạn."
      },
      {
        "vocabId": 796,
        "hanzi": "环境",
        "pinyin": "huánjìng",
        "meaningHanViet": "Hoàn Cảnh",
        "meaningVi": "Môi trường, hoàn cảnh",
        "exampleSentence": "保护生态环境是全人类共同的重大责任。",
        "exampleTranslation": "Bảo vệ môi trường sinh thái là trách nhiệm lớn lao chung của toàn nhân loại."
      },
      {
        "vocabId": 797,
        "hanzi": "换",
        "pinyin": "huàn",
        "meaningHanViet": "Hoán",
        "meaningVi": "Đổi, thay đổi, đổi tiền",
        "exampleSentence": "我想去中国银行把一些美元换成人民币。",
        "exampleTranslation": "Tôi muốn đến Ngân hàng Trung Quốc đổi một ít đô la Mỹ lấy nhân dân tệ."
      }
    ]
  },
  {
    "topicId": 310,
    "title": "Bài 10 — Hội nghị, Trả lời & Kiểm tra vé",
    "description": "Tham gia hội nghị, giải đáp thắc mắc, soát vé và kiểm tra tài liệu.",
    "vocabularies": [
      {
        "vocabId": 798,
        "hanzi": "黄色",
        "pinyin": "huángsè",
        "meaningHanViet": "Hoàng Sắc",
        "meaningVi": "Màu vàng",
        "exampleSentence": "秋天到了，银杏树的叶子都变成了金黄色。",
        "exampleTranslation": "Mùa thu đến rồi, lá cây ngân hạnh đều biến thành màu vàng óng."
      },
      {
        "vocabId": 155,
        "hanzi": "回答",
        "pinyin": "huídá",
        "meaningHanViet": "Hồi Đáp",
        "meaningVi": "Trả lời; đáp; trả lời; đáp án",
        "exampleSentence": "请回答老师的问题。",
        "exampleTranslation": "Xin hãy trả lời câu hỏi của thầy giáo."
      },
      {
        "vocabId": 799,
        "hanzi": "会",
        "pinyin": "huì",
        "meaningHanViet": "Hội",
        "meaningVi": "Hội nghị, cuộc họp, buổi họp",
        "exampleSentence": "全体部门负责人正在三楼会议室开会。",
        "exampleTranslation": "Toàn thể người phụ trách bộ phận đang họp tại phòng hội nghị tầng ba."
      },
      {
        "vocabId": 800,
        "hanzi": "会议",
        "pinyin": "huìyì",
        "meaningHanViet": "Hội Nghị",
        "meaningVi": "Hội nghị, cuộc họp",
        "exampleSentence": "国际气候变化峰会是一场非常重要的会议。",
        "exampleTranslation": "Hội nghị thượng đỉnh về biến đổi khí hậu quốc tế là một cuộc họp vô cùng quan trọng."
      },
      {
        "vocabId": 801,
        "hanzi": "或",
        "pinyin": "huò",
        "meaningHanViet": "Hoặc",
        "meaningVi": "Hoặc, hoặc là",
        "exampleSentence": "明天下午你可以来图书馆找我，或给我发邮件。",
        "exampleTranslation": "Chiều mai bạn có thể đến thư viện tìm tôi, hoặc gửi email cho tôi."
      },
      {
        "vocabId": 802,
        "hanzi": "或者",
        "pinyin": "huòzhě",
        "meaningHanViet": "Hoặc Giả",
        "meaningVi": "Hoặc là, hay là",
        "exampleSentence": "周末我通常在宿舍看书或者去操场锻炼身体。",
        "exampleTranslation": "Cuối tuần tôi thường đọc sách ở ký túc xá hoặc ra sân vận động rèn luyện thân thể."
      },
      {
        "vocabId": 803,
        "hanzi": "鸡",
        "pinyin": "jī",
        "meaningHanViet": "Kê",
        "meaningVi": "Con gà",
        "exampleSentence": "农场里散养的土鸡每天清晨都会喔喔啼叫。",
        "exampleTranslation": "Những chú gà nuôi thả trong trang trại sáng sớm nào cũng gáy vang."
      },
      {
        "vocabId": 804,
        "hanzi": "几乎",
        "pinyin": "jīhū",
        "meaningHanViet": "Kỷ Hồ",
        "meaningVi": "Hầu như, suýt nữa, gần như",
        "exampleSentence": "他今天忙得不可开交，几乎连喝水的时间都没有。",
        "exampleTranslation": "Hôm nay anh ấy bận túi bụi, hầu như ngay cả thời gian uống nước cũng không có."
      },
      {
        "vocabId": 805,
        "hanzi": "机会",
        "pinyin": "jīhuì",
        "meaningHanViet": "Cơ Hội",
        "meaningVi": "Cơ hội, dịp may",
        "exampleSentence": "能够去北京大学交流学习是一次非常难得的机会。",
        "exampleTranslation": "Có thể đến Đại học Bắc Kinh giao lưu học tập là một cơ hội vô cùng quý báu."
      },
      {
        "vocabId": 806,
        "hanzi": "极",
        "pinyin": "jí",
        "meaningHanViet": "Cực",
        "meaningVi": "Cực kỳ, vô cùng",
        "exampleSentence": "经历了漫长的旅途，大家此刻感到极度疲惫。",
        "exampleTranslation": "Trải qua chuyến đi dài đằng đẵng, mọi người lúc này cảm thấy cực kỳ mệt mỏi."
      },
      {
        "vocabId": 807,
        "hanzi": "急",
        "pinyin": "jí",
        "meaningHanViet": "Cấp",
        "meaningVi": "Vội vàng, sốt ruột, khẩn cấp",
        "exampleSentence": "他有紧急公事需要处理，走得非常急促。",
        "exampleTranslation": "Anh ấy có công vụ khẩn cấp cần giải quyết, bước đi vô cùng vội vã."
      },
      {
        "vocabId": 166,
        "hanzi": "记",
        "pinyin": "jì",
        "meaningHanViet": "Ký",
        "meaningVi": "Ghi chép; ghi lại",
        "exampleSentence": "请把这个生词记下来。",
        "exampleTranslation": "Xin hãy ghi nhớ từ mới này."
      },
      {
        "vocabId": 808,
        "hanzi": "季",
        "pinyin": "jì",
        "meaningHanViet": "Quý",
        "meaningVi": "Mùa, quý",
        "exampleSentence": "秋季是一年之中气候最宜人舒适的美好季节。",
        "exampleTranslation": "Mùa thu là mùa đẹp đẽ dễ chịu và thoải mái nhất trong năm."
      },
      {
        "vocabId": 809,
        "hanzi": "季节",
        "pinyin": "jìjié",
        "meaningHanViet": "Quý Tiết",
        "meaningVi": "Mùa, mùa màng, thời tiết",
        "exampleSentence": "一年之中你最喜欢哪个季节？",
        "exampleTranslation": "Trong một năm bạn thích nhất mùa nào?"
      },
      {
        "vocabId": 810,
        "hanzi": "加",
        "pinyin": "jiā",
        "meaningHanViet": "Gia",
        "meaningVi": "Thêm, cộng, gia tăng",
        "exampleSentence": "这杯热咖啡太苦了，请帮我加一点儿牛奶和糖。",
        "exampleTranslation": "Tách cà phê nóng này đắng quá, xin hãy giúp tôi thêm chút sữa và đường."
      },
      {
        "vocabId": 811,
        "hanzi": "假期",
        "pinyin": "jiàqī",
        "meaningHanViet": "Giá Kỳ",
        "meaningVi": "Kỳ nghỉ, ngày nghỉ",
        "exampleSentence": "漫长充实的暑期假期是学生们放松充电的好时光。",
        "exampleTranslation": "Kỳ nghỉ hè dài trọn vẹn là khoảng thời gian tuyệt vời để học sinh thư giãn và nạp lại năng lượng."
      },
      {
        "vocabId": 812,
        "hanzi": "坚持",
        "pinyin": "jiānchí",
        "meaningHanViet": "Kiên Trì",
        "meaningVi": "Kiên trì, giữ vững",
        "exampleSentence": "只有持之以恒地坚持练习，口语水平才能突飞猛进。",
        "exampleTranslation": "Chỉ có kiên trì luyện tập không ngừng thì trình độ khẩu ngữ mới tiến bộ vượt bậc."
      },
      {
        "vocabId": 813,
        "hanzi": "检查",
        "pinyin": "jiǎnchá",
        "meaningHanViet": "Kiểm Tra",
        "meaningVi": "Kiểm tra, xem xét",
        "exampleSentence": "交卷前务必仔细检查一遍姓名和考号是否填对。",
        "exampleTranslation": "Trước khi nộp bài thi nhất thiết phải kiểm tra kỹ một lượt xem họ tên và số báo danh đã điền đúng chưa."
      },
      {
        "vocabId": 814,
        "hanzi": "简单",
        "pinyin": "jiǎndān",
        "meaningHanViet": "Giản Đơn",
        "meaningVi": "Đơn giản, dễ dàng",
        "exampleSentence": "这道汉语语法题其实比大家想象的要简单得多。",
        "exampleTranslation": "Câu ngữ pháp tiếng Trung này thực ra đơn giản hơn mọi người tưởng tượng nhiều."
      },
      {
        "vocabId": 815,
        "hanzi": "检票",
        "pinyin": "jiǎnpiào",
        "meaningHanViet": "Kiểm Phiếu",
        "meaningVi": "Soát vé, kiểm vé",
        "exampleSentence": "高铁还有十五分钟就要发车了，检票口已经开放。",
        "exampleTranslation": "Tàu cao tốc còn mười lăm phút nữa là khởi hành, cửa soát vé đã mở rồi."
      }
    ]
  },
  {
    "topicId": 311,
    "title": "Bài 11 — Sức khỏe, Gặp gỡ & Quản lý",
    "description": "Chăm sóc sức khỏe, gặp mặt bạn bè, quản lý công việc và đồ uống.",
    "vocabularies": [
      {
        "vocabId": 816,
        "hanzi": "健康",
        "pinyin": "jiànkāng",
        "meaningHanViet": "Kiện Khang",
        "meaningVi": "Sức khỏe, khỏe mạnh",
        "exampleSentence": "平时保持均衡饮食和规律作息有助于身心健康。",
        "exampleTranslation": "Thường ngày duy trì ăn uống điều độ và nghỉ ngơi điều độ giúp thân thể khỏe mạnh."
      },
      {
        "vocabId": 174,
        "hanzi": "见面",
        "pinyin": "jiànmiàn",
        "meaningHanViet": "Kiến Diện",
        "meaningVi": "Gặp mặt; gặp nhau",
        "exampleSentence": "很高兴跟你见面。",
        "exampleTranslation": "Rất vui được gặp mặt bạn."
      },
      {
        "vocabId": 817,
        "hanzi": "讲",
        "pinyin": "jiǎng",
        "meaningHanViet": "Giảng",
        "meaningVi": "Nói, giảng, kể",
        "exampleSentence": "王教授今天在学术报告厅给我们讲中国当代文学。",
        "exampleTranslation": "Giáo sư Vương hôm nay ở hội trường học thuật giảng cho chúng tôi nghe về văn học đương đại Trung Quốc."
      },
      {
        "vocabId": 818,
        "hanzi": "角",
        "pinyin": "jiǎo",
        "meaningHanViet": "Giác",
        "meaningVi": "Góc, hào (1/10 tệ)",
        "exampleSentence": "房间的一角静静地摆放着一把古色古香的吉他。",
        "exampleTranslation": "Ở một góc phòng lặng lẽ đặt một cây đàn ghi-ta mang nét cổ kính."
      },
      {
        "vocabId": 819,
        "hanzi": "脚",
        "pinyin": "jiǎo",
        "meaningHanViet": "Cước",
        "meaningVi": "Bàn chân, chân",
        "exampleSentence": "昨天登山走了好几公里山路，今天双脚格外酸痛。",
        "exampleTranslation": "Hôm qua leo núi đi bộ mấy cây số đường đèo, hôm nay hai bàn chân đặc biệt mỏi nhừ."
      },
      {
        "vocabId": 820,
        "hanzi": "接",
        "pinyin": "jiē",
        "meaningHanViet": "Tiếp",
        "meaningVi": "Đón, tiếp nhận, nhận điện thoại",
        "exampleSentence": "他刚才去火车站接远道而来的父母了。",
        "exampleTranslation": "Vừa nãy anh ấy ra ga xe lửa đón cha mẹ từ xa đến rồi."
      },
      {
        "vocabId": 821,
        "hanzi": "街",
        "pinyin": "jiē",
        "meaningHanViet": "Nhai",
        "meaningVi": "Phố, đường phố",
        "exampleSentence": "周末繁华的步行街上人来人往，热闹非凡。",
        "exampleTranslation": "Cuối tuần trên con phố đi bộ sầm uất người qua kẻ lại, vô cùng náo nhiệt."
      },
      {
        "vocabId": 822,
        "hanzi": "节",
        "pinyin": "jié",
        "meaningHanViet": "Tiết",
        "meaningVi": "Tiết (học), đốt, lễ, ngày lễ",
        "exampleSentence": "今天上午我们连着上了三节非常重要的专业课。",
        "exampleTranslation": "Sáng nay chúng tôi học liền ba tiết môn chuyên ngành rất quan trọng."
      },
      {
        "vocabId": 823,
        "hanzi": "结婚",
        "pinyin": "jiéhūn",
        "meaningHanViet": "Kết Hôn",
        "meaningVi": "Kết hôn, cưới",
        "exampleSentence": "他们相恋五年之后，决定在今年国庆节结婚。",
        "exampleTranslation": "Sau năm năm yêu nhau, họ quyết định kết hôn vào dịp Quốc khánh năm nay."
      },
      {
        "vocabId": 824,
        "hanzi": "节目",
        "pinyin": "jiémù",
        "meaningHanViet": "Tiết Mục",
        "meaningVi": "Tiết mục, chương trình",
        "exampleSentence": "今晚电视文艺晚会上的舞蹈节目精彩纷呈。",
        "exampleTranslation": "Tiết mục múa trong đêm hội văn nghệ truyền hình tối nay vô cùng đặc sắc."
      },
      {
        "vocabId": 825,
        "hanzi": "节日",
        "pinyin": "jiérì",
        "meaningHanViet": "Tiết Nhật",
        "meaningVi": "Ngày lễ, ngày hội",
        "exampleSentence": "春节是中国民间最隆重热闹的传统节日。",
        "exampleTranslation": "Tết Nguyên Đán là ngày lễ truyền thống long trọng và náo nhiệt nhất trong dân gian Trung Hoa."
      },
      {
        "vocabId": 826,
        "hanzi": "结束",
        "pinyin": "jiéshù",
        "meaningHanViet": "Kết Thúc",
        "meaningVi": "Kết thúc, chấm dứt",
        "exampleSentence": "期末考试全部结束后，大家开心地走出考场。",
        "exampleTranslation": "Sau khi toàn bộ kỳ thi cuối kỳ kết thúc, mọi người vui vẻ bước ra khỏi phòng thi."
      },
      {
        "vocabId": 827,
        "hanzi": "解决",
        "pinyin": "jiějué",
        "meaningHanViet": "Giải Quyết",
        "meaningVi": "Giải quyết",
        "exampleSentence": "经过大家集思广益，这个棘手的难题终于解决了。",
        "exampleTranslation": "Nhờ mọi người cùng nhau hiến kế, vấn đề hóc búa này rốt cuộc đã được giải quyết rồi."
      },
      {
        "vocabId": 828,
        "hanzi": "姐妹",
        "pinyin": "jiěmèi",
        "meaningHanViet": "Tỉ Muội",
        "meaningVi": "Chị em gái",
        "exampleSentence": "这对亲姐妹长得十分相像，感情也格外亲密。",
        "exampleTranslation": "Hai chị em ruột này ngoại hình rất giống nhau, tình cảm cũng vô cùng thân thiết."
      },
      {
        "vocabId": 829,
        "hanzi": "借",
        "pinyin": "jiè",
        "meaningHanViet": "Tá",
        "meaningVi": "Mượn, vay",
        "exampleSentence": "请问我可以在大学图书馆借几本外语参考书吗？",
        "exampleTranslation": "Xin hỏi tôi có thể mượn mấy cuốn sách tham khảo ngoại ngữ ở thư viện đại học không?"
      },
      {
        "vocabId": 830,
        "hanzi": "斤",
        "pinyin": "jīn",
        "meaningHanViet": "Cân",
        "meaningVi": "Cân Tàu (0.5 kg)",
        "exampleSentence": "他在果蔬超市买了三斤新鲜脆甜的水蜜桃。",
        "exampleTranslation": "Anh ấy đã mua ba cân đào mật giòn ngọt tươi ngon ở siêu thị rau quả."
      },
      {
        "vocabId": 831,
        "hanzi": "经过",
        "pinyin": "jīngguò",
        "meaningHanViet": "Kinh Quá",
        "meaningVi": "Trải qua, đi qua, quá trình",
        "exampleSentence": "经过多轮严格选拔，他顺利入选了国家集训队。",
        "exampleTranslation": "Trải qua nhiều vòng tuyển chọn khắt khe, anh ấy đã thuận lợi lọt vào đội tuyển tập huấn quốc gia."
      },
      {
        "vocabId": 832,
        "hanzi": "经理",
        "pinyin": "jīnglǐ",
        "meaningHanViet": "Kinh Lý",
        "meaningVi": "Giám đốc, quản lý",
        "exampleSentence": "李经理正在会议室与重要客户商谈业务合作。",
        "exampleTranslation": "Giám đốc Lý đang cùng khách hàng quan trọng bàn bạc hợp tác kinh doanh trong phòng họp."
      },
      {
        "vocabId": 833,
        "hanzi": "久",
        "pinyin": "jiǔ",
        "meaningHanViet": "Cửu",
        "meaningVi": "Lâu, thời gian dài",
        "exampleSentence": "我们已经分别好久了，今天相见格外激动。",
        "exampleTranslation": "Chúng tôi đã chia tay nhau lâu lắm rồi, hôm nay gặp lại vô cùng xúc động."
      },
      {
        "vocabId": 834,
        "hanzi": "酒",
        "pinyin": "jiǔ",
        "meaningHanViet": "Tửu",
        "meaningVi": "Rượu, chất cồn",
        "exampleSentence": "中国茶文化与酒文化在历史上都源远流长。",
        "exampleTranslation": "Văn hóa trà và văn hóa rượu Trung Hoa trong lịch sử đều có nguồn gốc sâu xa lâu đời."
      }
    ]
  },
  {
    "topicId": 312,
    "title": "Bài 12 — Quyết định, Thẻ từ & Điều hòa",
    "description": "Đưa ra quyết định, sử dụng thẻ tiện ích, điều hòa và bài khóa.",
    "vocabularies": [
      {
        "vocabId": 835,
        "hanzi": "旧",
        "pinyin": "jiù",
        "meaningHanViet": "Cựu",
        "meaningVi": "Cũ, xưa, cổ",
        "exampleSentence": "这本泛黄的旧相册里珍藏着许多童年的珍贵回忆。",
        "exampleTranslation": "Trong cuốn an-bum ảnh cũ ố vàng này lưu giữ bao kỷ niệm quý giá thời thơ ấu."
      },
      {
        "vocabId": 836,
        "hanzi": "句",
        "pinyin": "jù",
        "meaningHanViet": "Cú",
        "meaningVi": "Câu (lượng từ lời nói, câu văn)",
        "exampleSentence": "请大家用今天学到的三个重点生词各造一句话。",
        "exampleTranslation": "Xin mọi người hãy dùng ba từ mới trọng tâm học hôm nay để đặt một câu văn."
      },
      {
        "vocabId": 837,
        "hanzi": "句子",
        "pinyin": "jùzi",
        "meaningHanViet": "Cú Tử",
        "meaningVi": "Câu văn, câu cú",
        "exampleSentence": "写文章要做到语法正确、句子通顺自然。",
        "exampleTranslation": "Viết văn cần đạt được ngữ pháp chính xác, câu cú mạch lạc trôi chảy tự nhiên."
      },
      {
        "vocabId": 838,
        "hanzi": "决定",
        "pinyin": "juédìng",
        "meaningHanViet": "Quyết Định",
        "meaningVi": "Quyết định",
        "exampleSentence": "经过深思熟虑，他决定留在母校攻读博士学位。",
        "exampleTranslation": "Sau khi suy nghĩ chín chắn, anh ấy quyết định ở lại trường cũ học tiếp tiến sĩ."
      },
      {
        "vocabId": 839,
        "hanzi": "卡",
        "pinyin": "kǎ",
        "meaningHanViet": "Tạp",
        "meaningVi": "Thẻ, cạc (ngân hàng, sinh viên)",
        "exampleSentence": "在食堂刷校园卡用餐既快捷又安全方便。",
        "exampleTranslation": "Quẹt thẻ sinh viên trong căng tin ăn cơm vừa nhanh vừa an toàn tiện lợi."
      },
      {
        "vocabId": 840,
        "hanzi": "开花",
        "pinyin": "kāihuā",
        "meaningHanViet": "Khai Hoa",
        "meaningVi": "Nở hoa, trổ hoa",
        "exampleSentence": "春天到了，院子里的樱花树悄然开花了。",
        "exampleTranslation": "Mùa xuân đến rồi, cây hoa anh đào trong sân đã lặng lẽ nở hoa."
      },
      {
        "vocabId": 190,
        "hanzi": "开会",
        "pinyin": "kāihuì",
        "meaningHanViet": "Khai Hội",
        "meaningVi": "Tổ chức cuộc họp; tham gia cuộc họp",
        "exampleSentence": "经理正在开会。",
        "exampleTranslation": "Giám đốc đang họp."
      },
      {
        "vocabId": 841,
        "hanzi": "开机",
        "pinyin": "kāijī",
        "meaningHanViet": "Khai Cơ",
        "meaningVi": "Mở máy, bật máy",
        "exampleSentence": "飞机安全降落滑行完毕后，乘客们纷纷开机。",
        "exampleTranslation": "Sau khi máy bay hạ cánh an toàn chạy xong đường băng, các hành khách rủ nhau mở máy."
      },
      {
        "vocabId": 842,
        "hanzi": "开心",
        "pinyin": "kāixīn",
        "meaningHanViet": "Khai Tâm",
        "meaningVi": "Vui vẻ, vui lòng, phấn khởi",
        "exampleSentence": "得知考试通过的好消息，大家心里都感到非常开心。",
        "exampleTranslation": "Biết được tin vui thi đỗ, trong lòng mọi người đều cảm thấy vô cùng phấn khởi."
      },
      {
        "vocabId": 843,
        "hanzi": "看来",
        "pinyin": "kànlái",
        "meaningHanViet": "Khán Lai",
        "meaningVi": "Xem ra, xem chừng, nhìn nhận",
        "exampleSentence": "看今天这乌云密布的天气，看来一场暴雨不可避免。",
        "exampleTranslation": "Nhìn sắc trời mây đen vần vũ hôm nay, xem ra một cơn mưa dông khó lòng tránh khỏi."
      },
      {
        "vocabId": 844,
        "hanzi": "可",
        "pinyin": "kě",
        "meaningHanViet": "Khả",
        "meaningVi": "Có thể, đáng, nhưng",
        "exampleSentence": "这本关于历史的故事书写得通俗易懂，真是一本可读的好书。",
        "exampleTranslation": "Cuốn sách truyện lịch sử này viết rất dễ hiểu, quả là một cuốn sách đáng đọc."
      },
      {
        "vocabId": 198,
        "hanzi": "渴",
        "pinyin": "kě",
        "meaningHanViet": "Khát",
        "meaningVi": "Khát",
        "exampleSentence": "我渴了，想喝水。",
        "exampleTranslation": "Tôi khát rồi, muốn uống nước."
      },
      {
        "vocabId": 845,
        "hanzi": "可爱",
        "pinyin": "kě’ài",
        "meaningHanViet": "Khả Ái",
        "meaningVi": "Đáng yêu, dễ thương",
        "exampleSentence": "草坪上奔跑玩耍的小泰迪狗长得真是太可爱了。",
        "exampleTranslation": "Chú chó Teddy nhỏ chạy nhảy đùa nghịch trên bãi cỏ trông thật là đáng yêu quá."
      },
      {
        "vocabId": 846,
        "hanzi": "可是",
        "pinyin": "kěshì",
        "meaningHanViet": "Khả Thị",
        "meaningVi": "Nhưng, nhưng mà",
        "exampleSentence": "虽然他已经尽了最大努力，可是比赛结果还是留有遗憾。",
        "exampleTranslation": "Tuy anh ấy đã cố hết sức mình, nhưng mà kết quả thi đấu vẫn còn chút tiếc nuối."
      },
      {
        "vocabId": 847,
        "hanzi": "刻",
        "pinyin": "kè",
        "meaningHanViet": "Khắc",
        "meaningVi": "Khắc (15 phút), khắc chạm",
        "exampleSentence": "现在是八点一刻，距离早自习开始还有十五分钟。",
        "exampleTranslation": "Bây giờ là tám giờ một khắc, cách giờ bắt đầu tự học buổi sáng còn mười lăm phút."
      },
      {
        "vocabId": 200,
        "hanzi": "课本",
        "pinyin": "kèběn",
        "meaningHanViet": "Khoá Bản",
        "meaningVi": "Sách giáo khoa",
        "exampleSentence": "请大家翻开课本第二十页。",
        "exampleTranslation": "Xin mọi người mở sách giáo khoa trang 20."
      },
      {
        "vocabId": 848,
        "hanzi": "客人",
        "pinyin": "kèrén",
        "meaningHanViet": "Khách Nhân",
        "meaningVi": "Khách, vị khách",
        "exampleSentence": "今天家里来了一位远道而来的尊贵客人。",
        "exampleTranslation": "Hôm nay trong nhà có một vị khách quý từ xa đến chơi."
      },
      {
        "vocabId": 201,
        "hanzi": "课文",
        "pinyin": "kèwén",
        "meaningHanViet": "Khoá Văn",
        "meaningVi": "Bài đọc",
        "exampleSentence": "请跟我一起读课文。",
        "exampleTranslation": "Xin hãy cùng tôi đọc bài khóa."
      },
      {
        "vocabId": 849,
        "hanzi": "空调",
        "pinyin": "kōngtiáo",
        "meaningHanViet": "Không Điệu",
        "meaningVi": "Điều hòa nhiệt độ, máy lạnh",
        "exampleSentence": "炎热难耐的夏季，在开着空调的房间里格外清爽。",
        "exampleTranslation": "Mùa hè nóng bức khó chịu, ở trong căn phòng bật điều hòa đặc biệt mát mẻ."
      },
      {
        "vocabId": 850,
        "hanzi": "哭",
        "pinyin": "kū",
        "meaningHanViet": "Khốc",
        "meaningVi": "Khóc",
        "exampleSentence": "小姑娘摔倒擦破了膝盖，委屈地哭了起来。",
        "exampleTranslation": "Bé gái bị ngã trầy xước đầu gối, ấm ức òa khóc nức nở."
      }
    ]
  },
  {
    "topicId": 313,
    "title": "Bài 13 — Đồ dùng, Du học & Hàng xóm",
    "description": "Vật dụng ăn uống, cuộc sống du học sinh và quan hệ láng giềng.",
    "vocabularies": [
      {
        "vocabId": 851,
        "hanzi": "筷子",
        "pinyin": "kuàizi",
        "meaningHanViet": "Khoái Tử",
        "meaningVi": "Đôi đũa",
        "exampleSentence": "学会熟练使用筷子是了解中国饮食文化的第一步。",
        "exampleTranslation": "Học được cách dùng đũa thành thạo là bước đầu tiên để tìm hiểu văn hóa ẩm thực Trung Quốc."
      },
      {
        "vocabId": 852,
        "hanzi": "矿泉水",
        "pinyin": "kuàngquánshuǐ",
        "meaningHanViet": "Khoáng Tuyền Thuỷ",
        "meaningVi": "Nước khoáng",
        "exampleSentence": "运动过后请及时饮用适量的矿泉水补充身体水分。",
        "exampleTranslation": "Sau khi vận động xin hãy kịp thời uống lượng nước khoáng thích hợp để bù nước cho cơ thể."
      },
      {
        "vocabId": 853,
        "hanzi": "来自",
        "pinyin": "láizì",
        "meaningHanViet": "Lai Tự",
        "meaningVi": "Đến từ, xuất thân từ",
        "exampleSentence": "我们班的留学生来自世界各地不同的友好国家。",
        "exampleTranslation": "Du học sinh lớp chúng tôi đến từ các quốc gia hữu nghị khác nhau trên khắp thế giới."
      },
      {
        "vocabId": 854,
        "hanzi": "蓝",
        "pinyin": "lán",
        "meaningHanViet": "Lam",
        "meaningVi": "Màu xanh lam, xanh da trời",
        "exampleSentence": "晴空万里的大海上倒映着一片深邃蔚蓝的天空。",
        "exampleTranslation": "Trên mặt biển trong xanh vạn dặm soi bóng một vòm trời xanh thẳm bao la."
      },
      {
        "vocabId": 207,
        "hanzi": "老",
        "pinyin": "lǎo",
        "meaningHanViet": "Lão",
        "meaningVi": "Già; cũ; lâu năm",
        "exampleSentence": "王老师是一位老教师。",
        "exampleTranslation": "Thầy Vương là một giáo viên lâu năm."
      },
      {
        "vocabId": 208,
        "hanzi": "老人",
        "pinyin": "lǎorén",
        "meaningHanViet": "Lão Nhân",
        "meaningVi": "Ông già hoặc bà già; người cao tuổi",
        "exampleSentence": "我们要关爱老人。",
        "exampleTranslation": "Chúng ta cần quan tâm chăm sóc người già."
      },
      {
        "vocabId": 855,
        "hanzi": "离开",
        "pinyin": "líkāi",
        "meaningHanViet": "Ly Khai",
        "meaningVi": "Rời khỏi, rời xa",
        "exampleSentence": "他依依不舍地挥手告别，离开了生活多年的故乡。",
        "exampleTranslation": "Anh ấy lưu luyến vẫy tay từ biệt, rời khỏi quê hương nơi mình đã gắn bó bao năm."
      },
      {
        "vocabId": 856,
        "hanzi": "礼物",
        "pinyin": "lǐwù",
        "meaningHanViet": "Lễ Vật",
        "meaningVi": "Quà tặng, lễ vật",
        "exampleSentence": "这套精致的中国茶具是朋友送给我的珍贵生日礼物。",
        "exampleTranslation": "Bộ ấm chén trà Trung Quốc tinh tế này là món quà sinh nhật quý giá người bạn tặng tôi."
      },
      {
        "vocabId": 857,
        "hanzi": "历史",
        "pinyin": "lìshǐ",
        "meaningHanViet": "Lịch Sử",
        "meaningVi": "Lịch sử",
        "exampleSentence": "北京故宫是一座承载着数百年厚重历史的宏伟建筑。",
        "exampleTranslation": "Tử Cấm Thành Bắc Kinh là một công trình kiến trúc đồ sộ chở che bề dày lịch sử hàng trăm năm."
      },
      {
        "vocabId": 858,
        "hanzi": "脸",
        "pinyin": "liǎn",
        "meaningHanViet": "Liễm",
        "meaningVi": "Mặt, khuôn mặt",
        "exampleSentence": "清晨用冷水洗脸能让人立刻精神振奋。",
        "exampleTranslation": "Buổi sáng dùng nước lạnh rửa mặt có thể giúp con người lập tức tỉnh táo tinh thần."
      },
      {
        "vocabId": 859,
        "hanzi": "练",
        "pinyin": "liàn",
        "meaningHanViet": "Luyện",
        "meaningVi": "Luyện tập, rèn luyện",
        "exampleSentence": "想要写出一手刚劲有力漂亮的毛笔字需要常年勤学苦练。",
        "exampleTranslation": "Muốn viết được nét chữ bút lông cứng cáp đẹp đẽ cần phải dày công rèn luyện qua năm tháng."
      },
      {
        "vocabId": 860,
        "hanzi": "练习",
        "pinyin": "liànxí",
        "meaningHanViet": "Luyện Tập",
        "meaningVi": "Bài tập, luyện tập",
        "exampleSentence": "课后请大家认真完成教材配套的各课语法练习。",
        "exampleTranslation": "Sau giờ học xin mọi người chăm chỉ hoàn thành bài tập ngữ pháp từng bài trong sách giáo khoa."
      },
      {
        "vocabId": 861,
        "hanzi": "凉快",
        "pinyin": "liángkuai",
        "meaningHanViet": "Lương Khoái",
        "meaningVi": "Mát mẻ, mát dịu",
        "exampleSentence": "秋天傍晚的微风徐徐吹来，让人感到格外凉快舒适。",
        "exampleTranslation": "Gió chiều mùa thu hiu hiu thổi tới, khiến người ta cảm thấy đặc biệt mát mẻ dễ chịu."
      },
      {
        "vocabId": 862,
        "hanzi": "辆",
        "pinyin": "liàng",
        "meaningHanViet": "Lượng",
        "meaningVi": "Chiếc, cỗ (lượng từ xe cộ)",
        "exampleSentence": "校门口整齐停放着一辆环保的新能源公交车。",
        "exampleTranslation": "Trước cổng trường đỗ ngay ngắn một chiếc xe buýt năng lượng mới thân thiện với môi trường."
      },
      {
        "vocabId": 863,
        "hanzi": "聊",
        "pinyin": "liáo",
        "meaningHanViet": "Liêu",
        "meaningVi": "Trò chuyện, tán gẫu",
        "exampleSentence": "老同学们围坐在一起愉快地聊着往昔校园里的趣事。",
        "exampleTranslation": "Các bạn học cũ quây quần bên nhau vui vẻ trò chuyện về những kỷ niệm vui thời đi học."
      },
      {
        "vocabId": 864,
        "hanzi": "聊天儿",
        "pinyin": "liáotiānr",
        "meaningHanViet": "Liêu Thiên Nhi",
        "meaningVi": "Tán gẫu, trò chuyện",
        "exampleSentence": "下午闲暇时喝茶聊天儿是老舍茶馆里最具特色的风景。",
        "exampleTranslation": "Chiều rảnh rỗi uống trà tán gẫu là nét phong cảnh đặc sắc nhất ở quán trà Lão Xá."
      },
      {
        "vocabId": 865,
        "hanzi": "了解",
        "pinyin": "liǎojiě",
        "meaningHanViet": "Liễu Giải",
        "meaningVi": "Hiểu rõ, tìm hiểu",
        "exampleSentence": "通过这次实地深入走访，我们更全面地了解了当地风俗。",
        "exampleTranslation": "Thông qua chuyến đi thực tế sâu sát này, chúng tôi đã hiểu rõ toàn diện hơn về phong tục địa phương."
      },
      {
        "vocabId": 866,
        "hanzi": "邻居",
        "pinyin": "línjū",
        "meaningHanViet": "Lân Cư",
        "meaningVi": "Hàng xóm, láng giềng",
        "exampleSentence": "我和隔壁邻居的关系非常融洽。",
        "exampleTranslation": "Tôi và người hàng xóm bên cạnh quan hệ rất hòa thuận."
      },
      {
        "vocabId": 867,
        "hanzi": "留学",
        "pinyin": "liúxué",
        "meaningHanViet": "Lưu Học",
        "meaningVi": "Du học",
        "exampleSentence": "他从小立志长大后去世界知名顶尖学府留学深造。",
        "exampleTranslation": "Từ nhỏ cậu ấy đã lập chí lớn lên sẽ đi du học nâng cao tại trường đại học hàng đầu thế giới."
      },
      {
        "vocabId": 868,
        "hanzi": "留学生",
        "pinyin": "liúxuéshēng",
        "meaningHanViet": "Lưu Học Sinh",
        "meaningVi": "Du học sinh, lưu học sinh",
        "exampleSentence": "我们大学每年招收数百名来自世界各地的国际留学生。",
        "exampleTranslation": "Trường đại học chúng tôi mỗi năm tuyển sinh hàng trăm du học sinh quốc tế đến từ khắp nơi trên thế giới."
      }
    ]
  },
  {
    "topicId": 314,
    "title": "Bài 14 — Giao thông, Bậc thang & Phố xá",
    "description": "Cầu thang bộ, ngã tư đường phố, giao thông và nam nữ thanh niên.",
    "vocabularies": [
      {
        "vocabId": 869,
        "hanzi": "楼梯",
        "pinyin": "lóutī",
        "meaningHanViet": "Lâu Thê",
        "meaningVi": "Cầu thang bộ",
        "exampleSentence": "为了强身健体，他每天坚持步行上下楼梯而不乘电梯。",
        "exampleTranslation": "Để rèn luyện sức khỏe, anh ấy mỗi ngày kiên trì đi bộ lên xuống cầu thang thay vì đi thang máy."
      },
      {
        "vocabId": 870,
        "hanzi": "路边",
        "pinyin": "lùbiān",
        "meaningHanViet": "Lộ Biên",
        "meaningVi": "Ven đường, lề đường",
        "exampleSentence": "夏日路边整齐栽种着许多枝繁叶茂的高大梧桐树。",
        "exampleTranslation": "Mùa hè ven đường trồng ngay ngắn nhiều cây ngô đồng to lớn cành lá tốt tươi."
      },
      {
        "vocabId": 222,
        "hanzi": "路口",
        "pinyin": "lùkǒu",
        "meaningHanViet": "Lộ Khẩu",
        "meaningVi": "Giao lộ; ngã tư",
        "exampleSentence": "我们在十字路口见。",
        "exampleTranslation": "Chúng ta gặp nhau ở ngã tư đường nhé."
      },
      {
        "vocabId": 871,
        "hanzi": "马",
        "pinyin": "mǎ",
        "meaningHanViet": "Mã",
        "meaningVi": "Con ngựa",
        "exampleSentence": "在辽阔广袤的内蒙古大草原上，骏马正在欢快奔腾。",
        "exampleTranslation": "Trên thảo nguyên Nội Mông bao la bát ngát, đàn tuấn mã đang vui vẻ tung vó phi nước đại."
      },
      {
        "vocabId": 225,
        "hanzi": "马路",
        "pinyin": "mǎlù",
        "meaningHanViet": "Mã Lộ",
        "meaningVi": "Đường phố; đường",
        "exampleSentence": "过马路要走斑马线。",
        "exampleTranslation": "Sang đường phải đi trên vạch kẻ đường cho người đi bộ."
      },
      {
        "vocabId": 226,
        "hanzi": "马上",
        "pinyin": "mǎshàng",
        "meaningHanViet": "Mã Thượng",
        "meaningVi": "Ngay lập tức; ngay tức khắc",
        "exampleSentence": "请稍等，我马上就来。",
        "exampleTranslation": "Xin đợi một chút, tôi tới ngay đây."
      },
      {
        "vocabId": 872,
        "hanzi": "满意",
        "pinyin": "mǎnyì",
        "meaningHanViet": "Mãn Ý",
        "meaningVi": "Hài lòng, vừa ý",
        "exampleSentence": "客户对我们团队这次高质量高效提交的设计方案十分满意。",
        "exampleTranslation": "Khách hàng vô cùng hài lòng với phương án thiết kế chất lượng cao tiến độ nhanh mà đội ngũ chúng tôi nộp lần này."
      },
      {
        "vocabId": 231,
        "hanzi": "毛",
        "pinyin": "máo",
        "meaningHanViet": "Mao",
        "meaningVi": "Lông, sợi; hào (tiền)",
        "exampleSentence": "这个苹果五毛钱。",
        "exampleTranslation": "Quả táo này giá năm hào."
      },
      {
        "vocabId": 873,
        "hanzi": "米",
        "pinyin": "mǐ",
        "meaningHanViet": "Mễ",
        "meaningVi": "Gạo, mét (đo lường)",
        "exampleSentence": "大米是中国南方家庭每天餐桌上不可或缺的主食。",
        "exampleTranslation": "Gạo là lương thực chính không thể thiếu trên bàn ăn mỗi ngày của các gia đình miền Nam Trung Quốc."
      },
      {
        "vocabId": 874,
        "hanzi": "面前",
        "pinyin": "miànqián",
        "meaningHanViet": "Diện Tiền",
        "meaningVi": "Trước mặt, phía trước",
        "exampleSentence": "面对摆在面前的全新挑战，我们应当坚定信心迎难而上。",
        "exampleTranslation": "Đối diện với thử thách hoàn toàn mới bày ra trước mặt, chúng ta cần vững tin dũng cảm xốc tới."
      },
      {
        "vocabId": 246,
        "hanzi": "明白",
        "pinyin": "míngbai",
        "meaningHanViet": "Minh Bạch",
        "meaningVi": "Rõ ràng; hiển nhiên",
        "exampleSentence": "老师讲的话我都明白了。",
        "exampleTranslation": "Những lời thầy giảng tôi đều hiểu rõ rồi."
      },
      {
        "vocabId": 875,
        "hanzi": "名单",
        "pinyin": "míngdān",
        "meaningHanViet": "Danh Đơn",
        "meaningVi": "Danh sách, bảng tên",
        "exampleSentence": "期末奖学金评选名单已经正式公布在学院官方公告栏上。",
        "exampleTranslation": "Danh sách bình chọn học bổng cuối kỳ đã chính thức niêm yết trên bảng thông báo chính thức của học viện."
      },
      {
        "vocabId": 876,
        "hanzi": "名人",
        "pinyin": "míngrén",
        "meaningHanViet": "Danh Nhân",
        "meaningVi": "Người nổi tiếng, danh nhân",
        "exampleSentence": "不少文化名人都曾在这座百年老校里驻足讲学留下佳话。",
        "exampleTranslation": "Không ít danh nhân văn hóa từng dừng bước giảng dạy tại ngôi trường trăm năm này để lại giai thoại đẹp."
      },
      {
        "vocabId": 266,
        "hanzi": "南",
        "pinyin": "nán",
        "meaningHanViet": "Nam",
        "meaningVi": "Phía nam, phương nam",
        "exampleSentence": "学校的南边是一个大公园。",
        "exampleTranslation": "Phía nam trường học là một công viên lớn."
      },
      {
        "vocabId": 268,
        "hanzi": "难",
        "pinyin": "nán",
        "meaningHanViet": "Nan",
        "meaningVi": "Khó; nan giải",
        "exampleSentence": "汉语的发音有点难。",
        "exampleTranslation": "Phát âm tiếng Trung hơi khó một chút."
      },
      {
        "vocabId": 877,
        "hanzi": "南方",
        "pinyin": "nánfāng",
        "meaningHanViet": "Nam Phương",
        "meaningVi": "Miền nam, phương nam",
        "exampleSentence": "中国南方水网纵横密布，气候温暖湿润景色宜人。",
        "exampleTranslation": "Miền nam Trung Quốc sông ngòi dày đặc chằng chịt, khí hậu ấm áp ẩm ướt cảnh sắc hữu tình."
      },
      {
        "vocabId": 878,
        "hanzi": "难过",
        "pinyin": "nánguò",
        "meaningHanViet": "Nan Quá",
        "meaningVi": "Buồn bã, đau lòng, khó chịu",
        "exampleSentence": "听到心爱的小宠物生病住院的消息，她心里难过极了。",
        "exampleTranslation": "Nghe tin thú cưng yêu quý bị ốm phải nhập viện, trong lòng cô ấy buồn bã vô cùng."
      },
      {
        "vocabId": 879,
        "hanzi": "难看",
        "pinyin": "nánkàn",
        "meaningHanViet": "Nan Khán",
        "meaningVi": "Khó coi, xấu xí",
        "exampleSentence": "虽然字迹写得有点儿难看，但内容条理十分严密清晰。",
        "exampleTranslation": "Tuy nét chữ viết có phần hơi khó coi nhưng nội dung lại vô cùng mạch lạc chặt chẽ."
      },
      {
        "vocabId": 264,
        "hanzi": "男人",
        "pinyin": "nánrén",
        "meaningHanViet": "Nam Nhân",
        "meaningVi": "Một người đàn ông; một nam giới",
        "exampleSentence": "那位男人是一位医生。",
        "exampleTranslation": "Người đàn ông đó là một bác sĩ."
      },
      {
        "vocabId": 265,
        "hanzi": "男生",
        "pinyin": "nánshēng",
        "meaningHanViet": "Nam Sinh",
        "meaningVi": "Nam sinh; học sinh nam",
        "exampleSentence": "我们班有十五个男生。",
        "exampleTranslation": "Lớp chúng tôi có mười lăm học sinh nam."
      }
    ]
  },
  {
    "topicId": 315,
    "title": "Bài 15 — Độ khó, Lớp học & Sự kỳ lạ",
    "description": "Giải quyết bài tập khó, phân chia khối lớp và những điều kỳ thú.",
    "vocabularies": [
      {
        "vocabId": 880,
        "hanzi": "难题",
        "pinyin": "nántí",
        "meaningHanViet": "Nan Đề",
        "meaningVi": "Đề tài hóc búa, bài toán khó",
        "exampleSentence": "面对这道奥数难题，同学们集思广益展开了热烈讨论。",
        "exampleTranslation": "Đối diện với bài toán khó thi học sinh giỏi này, các bạn học sinh cùng nhau hiến kế thảo luận sôi nổi."
      },
      {
        "vocabId": 881,
        "hanzi": "难听",
        "pinyin": "nántīng",
        "meaningHanViet": "Nan Thính",
        "meaningVi": "Khó nghe, chói tai",
        "exampleSentence": "这把老旧的小提琴音准不准，拉出来的声音十分难听。",
        "exampleTranslation": "Cây đàn vĩ cầm cũ kỹ này dây không chuẩn, kéo ra âm thanh vô cùng chói tai."
      },
      {
        "vocabId": 882,
        "hanzi": "年级",
        "pinyin": "niánjí",
        "meaningHanViet": "Niên Cấp",
        "meaningVi": "Lớp, khối lớp, cấp bậc",
        "exampleSentence": "他今年刚刚升入大学三年级，开始接触专业核心课程。",
        "exampleTranslation": "Năm nay anh ấy vừa lên năm thứ ba đại học, bắt đầu tiếp cận các môn học cốt lõi chuyên ngành."
      },
      {
        "vocabId": 883,
        "hanzi": "年轻",
        "pinyin": "niánqīng",
        "meaningHanViet": "Niên Khinh",
        "meaningVi": "Trẻ tuổi, thanh niên",
        "exampleSentence": "他虽然年轻，但是工作经验非常丰富。",
        "exampleTranslation": "Anh ấy tuy trẻ tuổi nhưng kinh nghiệm làm việc rất phong phú."
      },
      {
        "vocabId": 884,
        "hanzi": "牛",
        "pinyin": "niú",
        "meaningHanViet": "Ngưu",
        "meaningVi": "Con bò, con trâu",
        "exampleSentence": "老黄牛在田野间默默耕作，是中国勤劳奉献的传统象征。",
        "exampleTranslation": "Chú bò vàng lặng lẽ cày bừa trên đồng ruộng, là biểu tượng truyền thống cho sự cần cù cống hiến của Trung Hoa."
      },
      {
        "vocabId": 885,
        "hanzi": "努力",
        "pinyin": "nǔlì",
        "meaningHanViet": "Nỗ Lực",
        "meaningVi": "Nỗ lực, chăm chỉ",
        "exampleSentence": "只要今天脚踏实地努力拼搏，明天的梦想就一定能实现。",
        "exampleTranslation": "Chỉ cần hôm nay vững bước nỗ lực hết mình, ước mơ ngày mai nhất định sẽ trở thành hiện thực."
      },
      {
        "vocabId": 280,
        "hanzi": "女人",
        "pinyin": "nǚrén",
        "meaningHanViet": "Nữ Nhân",
        "meaningVi": "Phụ nữ",
        "exampleSentence": "那位女人很有才华。",
        "exampleTranslation": "Người phụ nữ đó rất tài năng."
      },
      {
        "vocabId": 281,
        "hanzi": "女生",
        "pinyin": "nǚshēng",
        "meaningHanViet": "Nữ Sinh",
        "meaningVi": "Nữ sinh; học sinh nữ",
        "exampleSentence": "我们班女生比男生多。",
        "exampleTranslation": "Lớp chúng tôi bạn nữ nhiều hơn bạn nam."
      },
      {
        "vocabId": 886,
        "hanzi": "爬",
        "pinyin": "pá",
        "meaningHanViet": "Bà",
        "meaningVi": "Leo, trèo, bò",
        "exampleSentence": "秋高气爽的重阳节，登高爬山是中华民族的古老传统。",
        "exampleTranslation": "Dịp Tết Trùng Cửu thu cao khí mát, leo núi lên cao là truyền thống ngàn đời của dân tộc Trung Hoa."
      },
      {
        "vocabId": 887,
        "hanzi": "怕",
        "pinyin": "pà",
        "meaningHanViet": "Phạ",
        "meaningVi": "Sợ, e rằng",
        "exampleSentence": "暴风雨快要来临了，怕是今天下午的户外活动不得不取消。",
        "exampleTranslation": "Bão dông sắp kéo đến rồi, e rằng hoạt động ngoài trời chiều nay buộc phải hủy bỏ."
      },
      {
        "vocabId": 888,
        "hanzi": "拍照",
        "pinyin": "pāizhào",
        "meaningHanViet": "Phách Chiếu",
        "meaningVi": "Chụp ảnh, chụp hình",
        "exampleSentence": "金秋时节游客们纷纷在枫叶林前驻足拍照留念。",
        "exampleTranslation": "Tiết trời thu vàng du khách rủ nhau dừng bước chụp ảnh lưu niệm trước rừng lá phong."
      },
      {
        "vocabId": 889,
        "hanzi": "盘子",
        "pinyin": "pánzi",
        "meaningHanViet": "Bàn Tử",
        "meaningVi": "Cái đĩa, cái đĩa đựng thức ăn",
        "exampleSentence": "服务员麻利地将洗得干干净净的白色瓷质盘子摆上餐桌。",
        "exampleTranslation": "Người phục vụ nhanh nhẹn bày những chiếc đĩa sứ trắng sạch bong lên bàn ăn."
      },
      {
        "vocabId": 890,
        "hanzi": "胖",
        "pinyin": "pàng",
        "meaningHanViet": "Bàng",
        "meaningVi": "Mập, béo, mập mạp",
        "exampleSentence": "猫咪经过几个月的精心喂养，长成了一只胖乎乎的大橘猫。",
        "exampleTranslation": "Chú mèo qua vài tháng được chăm bẵm cẩn thận đã lớn thành một chú mèo mướp vàng béo tròn xoe."
      },
      {
        "vocabId": 891,
        "hanzi": "啤酒",
        "pinyin": "píjiǔ",
        "meaningHanViet": "Tỳ Tửu",
        "meaningVi": "Bia (đồ uống)",
        "exampleSentence": "青岛啤酒是中国享誉世界知名品牌的传统酿造饮品之一。",
        "exampleTranslation": "Bia Thanh Đảo là một trong những thức uống ủ truyền thống mang thương hiệu nổi tiếng thế giới của Trung Quốc."
      },
      {
        "vocabId": 892,
        "hanzi": "平时",
        "pinyin": "píngshí",
        "meaningHanViet": "Bình Thời",
        "meaningVi": "Bình thường, thường ngày",
        "exampleSentence": "平时多注重身体保健锻炼，生病的概率就会大大降低。",
        "exampleTranslation": "Bình thường chú trọng chăm sóc sức khỏe và rèn luyện, tỷ lệ mắc bệnh sẽ giảm đi rất nhiều."
      },
      {
        "vocabId": 893,
        "hanzi": "瓶子",
        "pinyin": "píngzi",
        "meaningHanViet": "Bình Tử",
        "meaningVi": "Cái chai, cái lọ",
        "exampleSentence": "请把用完的空塑料瓶子随手投入可回收物垃圾箱内。",
        "exampleTranslation": "Xin hãy tiện tay vứt chiếc chai nhựa rỗng dùng xong vào thùng rác tái chế."
      },
      {
        "vocabId": 894,
        "hanzi": "骑",
        "pinyin": "qí",
        "meaningHanViet": "Kỵ",
        "meaningVi": "Cưỡi, đi (xe đạp, xe máy)",
        "exampleSentence": "骑共享单车穿行在大街小巷不仅低碳环保而且锻炼身体。",
        "exampleTranslation": "Đi xe đạp công cộng qua lại trên các ngõ phố không chỉ giảm khí thải bảo vệ môi trường mà còn rèn luyện sức khỏe."
      },
      {
        "vocabId": 895,
        "hanzi": "奇怪",
        "pinyin": "qíguài",
        "meaningHanViet": "Kỳ Quái",
        "meaningVi": "Kỳ lạ, quái lạ",
        "exampleSentence": "这只小鸟发出了一种以前从未听过的奇怪叫声。",
        "exampleTranslation": "Chú chim nhỏ này phát ra một tiếng kêu kỳ lạ chưa từng nghe thấy bao giờ."
      },
      {
        "vocabId": 896,
        "hanzi": "其实",
        "pinyin": "qíshí",
        "meaningHanViet": "Kỳ Thực",
        "meaningVi": "Kỳ thực, thực ra, thực chất",
        "exampleSentence": "学中文看似很难，其实只要掌握了汉字规律就会变得很有趣。",
        "exampleTranslation": "Học tiếng Trung nhìn qua có vẻ khó, thực ra chỉ cần nắm chắc quy luật chữ Hán sẽ trở nên rất thú vị."
      },
      {
        "vocabId": 897,
        "hanzi": "其他",
        "pinyin": "qítā",
        "meaningHanViet": "Kỳ Tha",
        "meaningVi": "Khác, cái khác, người khác",
        "exampleSentence": "除了这个问题以外，大家还有其他需要补充的意见吗？",
        "exampleTranslation": "Ngoài vấn đề này ra, mọi người còn có ý kiến nào khác cần bổ sung không?"
      }
    ]
  },
  {
    "topicId": 316,
    "title": "Bài 16 — Khởi hành, Bút chì & Dễ dàng",
    "description": "Máy bay cất cánh, đồ dùng học tập, ô che mưa và sự thuận tiện.",
    "vocabularies": [
      {
        "vocabId": 287,
        "hanzi": "起",
        "pinyin": "qǐ",
        "meaningHanViet": "Khởi",
        "meaningVi": "Dậy; khởi đầu; bắt đầu",
        "exampleSentence": "早上六点我就起来了。",
        "exampleTranslation": "Sáu giờ sáng tôi đã thức dậy rồi."
      },
      {
        "vocabId": 898,
        "hanzi": "起飞",
        "pinyin": "qǐfēi",
        "meaningHanViet": "Khởi Phi",
        "meaningVi": "Cất cánh, bay lên",
        "exampleSentence": "飞往北京的大型民航客机准点在跑道上起飞升空。",
        "exampleTranslation": "Chuyến bay chở khách dân dụng cỡ lớn đi Bắc Kinh cất cánh bay lên đúng giờ trên đường băng."
      },
      {
        "vocabId": 290,
        "hanzi": "汽车",
        "pinyin": "qìchē",
        "meaningHanViet": "Khí Xa",
        "meaningVi": "Xe hơi; xe ô tô",
        "exampleSentence": "路上来来往往很多汽车。",
        "exampleTranslation": "Trên đường xe hơi đi lại tấp nập."
      },
      {
        "vocabId": 899,
        "hanzi": "铅笔",
        "pinyin": "qiānbǐ",
        "meaningHanViet": "Diên Bút",
        "meaningVi": "Bút chì",
        "exampleSentence": "小学生初学写汉字时通常选用硬度适中的木质铅笔。",
        "exampleTranslation": "Học sinh tiểu học khi mới bắt đầu học viết chữ Hán thường chọn bút chì gỗ có độ cứng vừa phải."
      },
      {
        "vocabId": 900,
        "hanzi": "前年",
        "pinyin": "qiánnián",
        "meaningHanViet": "Tiền Niên",
        "meaningVi": "Năm kia (hai năm trước)",
        "exampleSentence": "我们全家在前年春节曾一起去哈尔滨观赏冰雕艺术。",
        "exampleTranslation": "Cả gia đình chúng tôi dịp Tết năm kia từng cùng nhau đi Cáp Nhĩ Tân ngắm nghệ thuật điêu khắc băng."
      },
      {
        "vocabId": 293,
        "hanzi": "前天",
        "pinyin": "qiántiān",
        "meaningHanViet": "Tiền Thiên",
        "meaningVi": "Ngày hôm kia",
        "exampleSentence": "前天我们参加了考试。",
        "exampleTranslation": "Hôm kia chúng tôi đã tham gia kỳ thi."
      },
      {
        "vocabId": 901,
        "hanzi": "清楚",
        "pinyin": "qīngchu",
        "meaningHanViet": "Thanh Sở",
        "meaningVi": "Rõ ràng, minh bạch",
        "exampleSentence": "老师把解题步骤详细写在黑板上，字迹格外清楚。",
        "exampleTranslation": "Thầy giáo viết các bước giải bài chi tiết lên bảng đen, nét chữ đặc biệt rõ ràng."
      },
      {
        "vocabId": 297,
        "hanzi": "请假",
        "pinyin": "qǐngjià",
        "meaningHanViet": "Thỉnh Giá",
        "meaningVi": "Xin nghỉ phép",
        "exampleSentence": "他今天生病，向老师请假。",
        "exampleTranslation": "Hôm nay anh ấy bị ốm nên xin phép thầy nghỉ học."
      },
      {
        "vocabId": 902,
        "hanzi": "请客",
        "pinyin": "qǐngkè",
        "meaningHanViet": "Thỉnh Khách",
        "meaningVi": "Mời khách, khao, bao chầu",
        "exampleSentence": "今天我通过了汉语水平考试，晚上一定要请客庆祝一下！",
        "exampleTranslation": "Hôm nay tôi đã vượt qua kỳ thi năng lực Hán ngữ, tối nay nhất định phải khao một chầu để ăn mừng!"
      },
      {
        "vocabId": 903,
        "hanzi": "秋天",
        "pinyin": "qiūtiān",
        "meaningHanViet": "Thu Thiên",
        "meaningVi": "Mùa thu",
        "exampleSentence": "秋天是硕果累累五谷丰登的金黄色丰收季节。",
        "exampleTranslation": "Mùa thu là mùa thu hoạch vàng óng trĩu quả mùa màng bội thu."
      },
      {
        "vocabId": 904,
        "hanzi": "球场",
        "pinyin": "qiúchǎng",
        "meaningHanViet": "Cầu Trường",
        "meaningVi": "Sân bóng",
        "exampleSentence": "下午放学后，宽阔的绿茵球场上活跃着热爱运动的学生。",
        "exampleTranslation": "Chiều sau giờ tan học, trên sân bóng cỏ xanh rộng lớn rộn ràng các bạn học sinh yêu thích thể thao."
      },
      {
        "vocabId": 905,
        "hanzi": "裙子",
        "pinyin": "qúnzi",
        "meaningHanViet": "Quần Tử",
        "meaningVi": "Váy, chân váy",
        "exampleSentence": "这条红色的裙子非常适合你。",
        "exampleTranslation": "Chiếc váy màu đỏ này rất hợp với bạn."
      },
      {
        "vocabId": 906,
        "hanzi": "然后",
        "pinyin": "ránhòu",
        "meaningHanViet": "Nhiên Hậu",
        "meaningVi": "Sau đó, rồi thì",
        "exampleSentence": "我们先参观了国家博物馆，然后一起漫步天安门广场。",
        "exampleTranslation": "Chúng tôi tham quan Bảo tàng Quốc gia trước, sau đó cùng nhau tản bộ trên Quảng trường Thiên An Môn."
      },
      {
        "vocabId": 907,
        "hanzi": "热情",
        "pinyin": "rèqíng",
        "meaningHanViet": "Nhiệt Tình",
        "meaningVi": "Nhiệt tình, niềm nở",
        "exampleSentence": "当地百姓非常热情好客，端出最好的特色美食招待远方客人。",
        "exampleTranslation": "Người dân địa phương vô cùng nhiệt tình hiếu khách, bưng ra những món ngon đặc sản nhất thết đãi khách phương xa."
      },
      {
        "vocabId": 908,
        "hanzi": "认得",
        "pinyin": "rènde",
        "meaningHanViet": "Nhận Đắc",
        "meaningVi": "Nhận ra, nhận biết",
        "exampleSentence": "多年未见，老同学在茫茫人海中依然一眼就认得彼此。",
        "exampleTranslation": "Nhiều năm chưa gặp, đôi bạn học cũ giữa biển người mênh mông vẫn nhận ra nhau ngay từ cái nhìn đầu tiên."
      },
      {
        "vocabId": 909,
        "hanzi": "认为",
        "pinyin": "rènwéi",
        "meaningHanViet": "Nhận Vi",
        "meaningVi": "Cho rằng, nghĩ rằng",
        "exampleSentence": "大多数专家认为这种绿色能源具有非常广阔的应用前景。",
        "exampleTranslation": "Đa số các chuyên gia cho rằng loại năng lượng xanh này có triển vọng ứng dụng vô cùng rộng mở."
      },
      {
        "vocabId": 307,
        "hanzi": "认真",
        "pinyin": "rènzhēn",
        "meaningHanViet": "Nhận Chân",
        "meaningVi": "Tận tâm; nghiêm túc",
        "exampleSentence": "大家都在认真地学习汉语。",
        "exampleTranslation": "Mọi người đều đang chăm chỉ học tiếng Trung."
      },
      {
        "vocabId": 910,
        "hanzi": "容易",
        "pinyin": "róngyì",
        "meaningHanViet": "Dung Dị",
        "meaningVi": "Dễ dàng, thuận lợi",
        "exampleSentence": "天下无难事，只要肯登攀，没有克服不了的容易或艰难。",
        "exampleTranslation": "Dưới gầm trời không việc gì khó, chỉ cần quyết chí trèo cao, không có gian nan hay dễ dàng nào không vượt qua được."
      },
      {
        "vocabId": 911,
        "hanzi": "如果",
        "pinyin": "rúguǒ",
        "meaningHanViet": "Như Quả",
        "meaningVi": "Nếu như, giả sử",
        "exampleSentence": "如果明天下大雨，我们原定的户外长跑活动就改为室内进行。",
        "exampleTranslation": "Nếu như ngày mai trời mưa to, hoạt động chạy bền ngoài trời đã định của chúng ta sẽ chuyển sang tổ chức trong nhà."
      },
      {
        "vocabId": 912,
        "hanzi": "伞",
        "pinyin": "sǎn",
        "meaningHanViet": "Tản",
        "meaningVi": "Cái ô, cái dù",
        "exampleSentence": "夏季多阵雨，出门包里常备一把折叠伞防患于未然。",
        "exampleTranslation": "Mùa hè hay có mưa dông, trong túi ra ngoài thường để sẵn một chiếc ô gấp để phòng khi cần."
      }
    ]
  },
  {
    "topicId": 317,
    "title": "Bài 17 — Nhà cửa, Trang phục & Cảm nhận",
    "description": "Quét dọn nhà cửa, ghế sô pha, áo khoác và các trải nghiệm cá nhân.",
    "vocabularies": [
      {
        "vocabId": 913,
        "hanzi": "扫",
        "pinyin": "sǎo",
        "meaningHanViet": "Tảo",
        "meaningVi": "Quét, quét dọn",
        "exampleSentence": "环卫工人们清晨五点就拿起大扫帚把马路打扫得干干净净。",
        "exampleTranslation": "Các công nhân vệ sinh môi trường từ năm giờ sáng đã cầm chổi lớn quét dọn đường phố sạch bong."
      },
      {
        "vocabId": 914,
        "hanzi": "沙发",
        "pinyin": "shāfā",
        "meaningHanViet": "Sa Phát",
        "meaningVi": "Ghế sofa, đi-văng",
        "exampleSentence": "结束了一整天繁忙的工作后，瘫坐在舒适柔软的沙发上最惬意。",
        "exampleTranslation": "Sau khi kết thúc một ngày làm việc bận rộn, ngả lưng trên chiếc sofa êm ái mềm mại là thư thái nhất."
      },
      {
        "vocabId": 312,
        "hanzi": "山",
        "pinyin": "shān",
        "meaningHanViet": "Sơn",
        "meaningVi": "Núi, ngọn núi",
        "exampleSentence": "这座山真高。",
        "exampleTranslation": "Ngọn núi này thật là cao."
      },
      {
        "vocabId": 915,
        "hanzi": "上衣",
        "pinyin": "shàngyī",
        "meaningHanViet": "Thượng Y",
        "meaningVi": "Áo khoác trên, áo mặc trên",
        "exampleSentence": "他今天穿了一件深蓝色的保暖夹克上衣去上班。",
        "exampleTranslation": "Hôm nay anh ấy mặc một chiếc áo khoác ấm màu xanh lam sẫm đi làm."
      },
      {
        "vocabId": 916,
        "hanzi": "勺子",
        "pinyin": "sháozi",
        "meaningHanViet": "Chước Tử",
        "meaningVi": "Cái thìa, cái muỗng",
        "exampleSentence": "喝热汤的时候请用专用的陶瓷小勺子，避免烫伤。",
        "exampleTranslation": "Khi húp canh nóng xin hãy dùng chiếc thìa sứ chuyên dụng để tránh bị bỏng."
      },
      {
        "vocabId": 917,
        "hanzi": "身边",
        "pinyin": "shēnbiān",
        "meaningHanViet": "Thân Biên",
        "meaningVi": "Bên cạnh, bên mình",
        "exampleSentence": "无论走到天涯海角，亲人的深情牵挂永远陪伴在我们身边。",
        "exampleTranslation": "Dù có đi đến chân trời góc biển, tình cảm chở che của người thân mãi luôn đồng hành bên cạnh chúng ta."
      },
      {
        "vocabId": 918,
        "hanzi": "身高",
        "pinyin": "shēngāo",
        "meaningHanViet": "Thân Cao",
        "meaningVi": "Chiều cao, chiều cao cơ thể",
        "exampleSentence": "定期测量身高体重是监测青少年儿童健康发育的重要指标。",
        "exampleTranslation": "Đo chiều cao cân nặng định kỳ là chỉ số quan trọng để theo dõi sự phát triển thể chất của thanh thiếu niên trẻ em."
      },
      {
        "vocabId": 919,
        "hanzi": "声",
        "pinyin": "shēng",
        "meaningHanViet": "Thanh",
        "meaningVi": "Tiếng, âm thanh (lượng từ lời nói)",
        "exampleSentence": "远处群山间传来了一声清脆悦耳的鸟鸣。",
        "exampleTranslation": "Giữa những ngọn núi xa xa vọng lại một tiếng chim hót lảnh lót êm tai."
      },
      {
        "vocabId": 920,
        "hanzi": "生活",
        "pinyin": "shēnghuó",
        "meaningHanViet": "Sinh Hoạt",
        "meaningVi": "Cuộc sống, đời sống, sinh hoạt",
        "exampleSentence": "积极乐观的人生态度能够让平凡的生活充满欢歌笑语。",
        "exampleTranslation": "Thái độ nhân sinh tích cực lạc quan có thể làm cho cuộc sống bình dị tràn đầy tiếng cười và lời ca."
      },
      {
        "vocabId": 330,
        "hanzi": "生气",
        "pinyin": "shēngqì",
        "meaningHanViet": "Sinh Khí",
        "meaningVi": "Nổi giận; tức giận; sinh khí; sức sống",
        "exampleSentence": "不要为这点小事生气。",
        "exampleTranslation": "Đừng vì chuyện nhỏ nhặt này mà tức giận."
      },
      {
        "vocabId": 921,
        "hanzi": "声音",
        "pinyin": "shēngyīn",
        "meaningHanViet": "Thanh Âm",
        "meaningVi": "Âm thanh, tiếng vang",
        "exampleSentence": "教室里传出了同学们整齐响亮的朗读课文声音。",
        "exampleTranslation": "Trong phòng học vang lên âm thanh đọc bài khóa đồng thanh to rõ của các bạn học sinh."
      },
      {
        "vocabId": 922,
        "hanzi": "市",
        "pinyin": "shì",
        "meaningHanViet": "Thị",
        "meaningVi": "Thị xã, thành phố, chợ",
        "exampleSentence": "这座沿海开放城市近年来经济活力十足，发展迅速。",
        "exampleTranslation": "Thành phố mở ven biển này những năm gần đây sức sống kinh tế dồi dào, phát triển thần tốc."
      },
      {
        "vocabId": 336,
        "hanzi": "试",
        "pinyin": "shì",
        "meaningHanViet": "Thí",
        "meaningVi": "Thử; thí nghiệm",
        "exampleSentence": "这件衣服你可以试一下。",
        "exampleTranslation": "Bộ quần áo này bạn có thể mặc thử một chút."
      },
      {
        "vocabId": 923,
        "hanzi": "室",
        "pinyin": "shì",
        "meaningHanViet": "Thất",
        "meaningVi": "Phòng, buồng",
        "exampleSentence": "我们在三楼的安静图书阅览室里认真查阅文献资料。",
        "exampleTranslation": "Chúng tôi ở trong phòng đọc sách yên tĩnh tại tầng ba chăm chú tra cứu tài liệu văn kiện."
      },
      {
        "vocabId": 924,
        "hanzi": "世界",
        "pinyin": "shìjiè",
        "meaningHanViet": "Thế Giới",
        "meaningVi": "Thế giới",
        "exampleSentence": "互联网技术彻底拉近了世界各国人民之间的距离。",
        "exampleTranslation": "Công nghệ internet đã kéo lại gần hoàn toàn khoảng cách giữa nhân dân các nước trên toàn thế giới."
      },
      {
        "vocabId": 925,
        "hanzi": "收",
        "pinyin": "shōu",
        "meaningHanViet": "Thu",
        "meaningVi": "Thu, nhận, dọn dẹp, thu dọn",
        "exampleSentence": "期末离校前请同学们把个人物品妥善收拾干净带走。",
        "exampleTranslation": "Trước khi rời trường cuối kỳ xin các bạn học sinh thu dọn gọn gàng đồ đạc cá nhân mang về."
      },
      {
        "vocabId": 926,
        "hanzi": "收到",
        "pinyin": "shōudào",
        "meaningHanViet": "Thu Đáo",
        "meaningVi": "Nhận được, tiếp nhận",
        "exampleSentence": "今天下午我终于收到了大学录取通知书的挂号信。",
        "exampleTranslation": "Chiều nay tôi rốt cuộc đã nhận được thư bảo đảm báo tin trúng tuyển đại học."
      },
      {
        "vocabId": 927,
        "hanzi": "受",
        "pinyin": "shòu",
        "meaningHanViet": "Thụ",
        "meaningVi": "Chịu đựng, nhận, chịu",
        "exampleSentence": "无论遇到多么严酷的考验，他都勇敢经受住了考验。",
        "exampleTranslation": "Dù gặp phải khảo nghiệm khắc nghiệt đến đâu, anh ấy đều dũng cảm vượt qua chịu đựng."
      },
      {
        "vocabId": 928,
        "hanzi": "瘦",
        "pinyin": "shòu",
        "meaningHanViet": "Sấu",
        "meaningVi": "Gầy, ốm, chật hẹp",
        "exampleSentence": "几个月坚持规律锻炼和健康膳食，他明显瘦了一圈。",
        "exampleTranslation": "Mấy tháng kiên trì rèn luyện điều độ và ăn uống lành mạnh, anh ấy đã gầy đi trông thấy."
      },
      {
        "vocabId": 929,
        "hanzi": "受到",
        "pinyin": "shòudào",
        "meaningHanViet": "Thụ Đáo",
        "meaningVi": "Nhận được, chịu sự (ảnh hưởng, khen ngợi)",
        "exampleSentence": "这名年轻志愿者的无私奉献精神受到了社会各界广泛好评。",
        "exampleTranslation": "Tinh thần cống hiến vô tư của bạn tình nguyện viên trẻ này đã nhận được sự khen ngợi rộng rãi từ các giới xã hội."
      }
    ]
  },
  {
    "topicId": 318,
    "title": "Bài 18 — Toán học, Đồng nghiệp & Đồng ý",
    "description": "Môn toán, cây cối thiên nhiên, trao đổi đồng nghiệp và sự đồng thuận.",
    "vocabularies": [
      {
        "vocabId": 930,
        "hanzi": "叔叔",
        "pinyin": "shūshu",
        "meaningHanViet": "Thúc Thúc",
        "meaningVi": "Chú, bác",
        "exampleSentence": "热心的邻居张叔叔常常帮大伙儿维修各种损坏的小家电。",
        "exampleTranslation": "Bác Trương hàng xóm nhiệt tình thường hay giúp mọi người sửa chữa các đồ điện gia dụng nhỏ bị hỏng."
      },
      {
        "vocabId": 344,
        "hanzi": "树",
        "pinyin": "shù",
        "meaningHanViet": "Thụ",
        "meaningVi": "Cây; trồng",
        "exampleSentence": "校园里种着许多高大的绿树。",
        "exampleTranslation": "Trong khuôn viên trường trồng rất nhiều cây xanh cao lớn."
      },
      {
        "vocabId": 931,
        "hanzi": "数学",
        "pinyin": "shùxué",
        "meaningHanViet": "Số Học",
        "meaningVi": "Toán học, môn toán",
        "exampleSentence": "学好基础数学能够培养人严谨缜密的逻辑思维能力。",
        "exampleTranslation": "Học tốt toán học cơ bản có thể bồi dưỡng năng lực tư duy logic chặt chẽ cẩn trọng cho con người."
      },
      {
        "vocabId": 932,
        "hanzi": "刷",
        "pinyin": "shuā",
        "meaningHanViet": "Loát",
        "meaningVi": "Chải, quét (thẻ), rửa",
        "exampleSentence": "每天早晚认真刷牙是保持口腔卫生预防龋齿的基本要求。",
        "exampleTranslation": "Mỗi sáng tối chăm chỉ đánh răng là yêu cầu cơ bản để giữ vệ sinh răng miệng phòng ngừa sâu răng."
      },
      {
        "vocabId": 933,
        "hanzi": "双",
        "pinyin": "shuāng",
        "meaningHanViet": "Song",
        "meaningVi": "Đôi, cặp (lượng từ giày, đũa, mắt)",
        "exampleSentence": "过年时妈妈给我买了一双崭新的白色运动鞋。",
        "exampleTranslation": "Dịp đón tết mẹ đã mua cho tôi một đôi giày thể thao màu trắng mới tinh."
      },
      {
        "vocabId": 934,
        "hanzi": "水平",
        "pinyin": "shuǐpíng",
        "meaningHanViet": "Thuỷ Bình",
        "meaningVi": "Trình độ, mức độ, tiêu chuẩn",
        "exampleSentence": "经过半年沉浸式学习，他的汉语口语水平有了质的飞跃。",
        "exampleTranslation": "Qua nửa năm học tập đắm chìm, trình độ khẩu ngữ tiếng Trung của anh ấy đã có bước tiến nhảy vọt về chất."
      },
      {
        "vocabId": 935,
        "hanzi": "司机",
        "pinyin": "sījī",
        "meaningHanViet": "Ty Cơ",
        "meaningVi": "Tài xế, bác tài",
        "exampleSentence": "公交车老司机行车经验极其丰富，驾驶技术平稳安全。",
        "exampleTranslation": "Bác tài xế xe buýt lâu năm kinh nghiệm lái xe cực kỳ phong phú, kỹ thuật điều khiển xe êm ái an toàn."
      },
      {
        "vocabId": 936,
        "hanzi": "四季",
        "pinyin": "sìjì",
        "meaningHanViet": "Tứ Quý",
        "meaningVi": "Bốn mùa, bốn quý",
        "exampleSentence": "昆明气候宜人四季如春，享有春城的美誉。",
        "exampleTranslation": "Côn Minh khí hậu dễ chịu bốn mùa như xuân, được ngợi ca với danh xưng Thành phố Mùa Xuân."
      },
      {
        "vocabId": 937,
        "hanzi": "太阳",
        "pinyin": "tàiyáng",
        "meaningHanViet": "Thái Dương",
        "meaningVi": "Mặt trời, ánh thái dương",
        "exampleSentence": "明媚温暖的太阳照耀着大地，融化了冰封的雪水。",
        "exampleTranslation": "Mặt trời ấm áp rực rỡ chiếu rọi đất trời, làm tan chảy dòng nước tuyết đóng băng."
      },
      {
        "vocabId": 938,
        "hanzi": "糖",
        "pinyin": "táng",
        "meaningHanViet": "Đường",
        "meaningVi": "Đường, kẹo",
        "exampleSentence": "小孩子吃完含糖糖果后要及时漱口以防止蛀牙。",
        "exampleTranslation": "Trẻ nhỏ sau khi ăn kẹo ngọt có đường cần kịp thời súc miệng để phòng tránh sâu răng."
      },
      {
        "vocabId": 939,
        "hanzi": "特别",
        "pinyin": "tèbié",
        "meaningHanViet": "Đặc Biệt",
        "meaningVi": "Đặc biệt, vô cùng",
        "exampleSentence": "今天全班同学为老师准备了一份特别有意义的教师节礼物。",
        "exampleTranslation": "Hôm nay toàn thể học sinh trong lớp đã chuẩn bị cho thầy cô một món quà ngày Nhà giáo đặc biệt có ý nghĩa."
      },
      {
        "vocabId": 940,
        "hanzi": "提高",
        "pinyin": "tígāo",
        "meaningHanViet": "Đề Cao",
        "meaningVi": "Nâng cao, cải thiện, tăng cường",
        "exampleSentence": "坚持每天阅读中文原版报刊能够显著提高阅读理解速度。",
        "exampleTranslation": "Kiên trì mỗi ngày đọc báo chí ấn bản gốc tiếng Trung có thể nâng cao tốc độ đọc hiểu một cách rõ rệt."
      },
      {
        "vocabId": 941,
        "hanzi": "体育",
        "pinyin": "tǐyù",
        "meaningHanViet": "Thể Dục",
        "meaningVi": "Thể dục, thể thao",
        "exampleSentence": "学校每年春季都按时举办盛大的全校性体育运动会。",
        "exampleTranslation": "Trường học mỗi năm vào mùa xuân đều tổ chức đại hội thể dục thể thao toàn trường tưng bừng đúng hẹn."
      },
      {
        "vocabId": 942,
        "hanzi": "体育馆",
        "pinyin": "tǐyùguǎn",
        "meaningHanViet": "Thể Dục Quán",
        "meaningVi": "Nhà thi đấu, phòng tập thể dục",
        "exampleSentence": "这座现代化体育馆能承办国际一流规格的羽毛球比赛。",
        "exampleTranslation": "Nhà thi đấu hiện đại này có thể tổ chức các giải thi đấu cầu lông quy mô tiêu chuẩn hàng đầu quốc tế."
      },
      {
        "vocabId": 943,
        "hanzi": "甜",
        "pinyin": "tián",
        "meaningHanViet": "Điềm",
        "meaningVi": "Ngọt, ngọt ngào",
        "exampleSentence": "新疆吐鲁番昼夜温差大，出产的葡萄格外甘甜多汁。",
        "exampleTranslation": "Thổ Lỗ Phiên ở Tân Cương chênh lệch nhiệt độ ngày đêm lớn, nho sản xuất ra đặc biệt ngọt ngào mọng nước."
      },
      {
        "vocabId": 944,
        "hanzi": "跳",
        "pinyin": "tiào",
        "meaningHanViet": "Khiêu",
        "meaningVi": "Nhảy, bật, khiêu vũ",
        "exampleSentence": "欢快的小袋鼠在草原上一下又一下敏捷地跳跃着。",
        "exampleTranslation": "Những chú chuột túi nhỏ tinh nghịch thoăn thoắt nhảy từng bước từng bước trên đồng cỏ."
      },
      {
        "vocabId": 945,
        "hanzi": "听说",
        "pinyin": "tīngshuō",
        "meaningHanViet": "Thính Thuyết",
        "meaningVi": "Nghe nói, nghe đồn",
        "exampleSentence": "听说下周学校艺术节将有一场精彩的中外学生大合唱。",
        "exampleTranslation": "Nghe nói tuần sau trong ngày hội nghệ thuật của trường sẽ có một màn hợp xướng tuyệt vời của sinh viên trong và ngoài nước."
      },
      {
        "vocabId": 946,
        "hanzi": "挺",
        "pinyin": "tǐng",
        "meaningHanViet": "Đĩnh",
        "meaningVi": "Rất, thẳng, kiên cường",
        "exampleSentence": "这本新出版的历史小说写得挺有深度的。",
        "exampleTranslation": "Cuốn tiểu thuyết lịch sử mới xuất bản này viết rất có chiều sâu."
      },
      {
        "vocabId": 947,
        "hanzi": "同事",
        "pinyin": "tóngshì",
        "meaningHanViet": "Đồng Sự",
        "meaningVi": "Đồng nghiệp",
        "exampleSentence": "我和部门里的几位同事相处得非常融洽愉快。",
        "exampleTranslation": "Tôi và vài đồng nghiệp trong bộ phận sống chan hòa hòa thuận với nhau rất vui vẻ."
      },
      {
        "vocabId": 948,
        "hanzi": "同意",
        "pinyin": "tóngyì",
        "meaningHanViet": "Đồng Ý",
        "meaningVi": "Đồng ý, tán thành",
        "exampleSentence": "经过充分讨论，大家一致同意采纳这个创新方案。",
        "exampleTranslation": "Sau khi thảo luận kỹ lưỡng, mọi người nhất trí đồng ý tiếp thu phương án đổi mới này."
      }
    ]
  },
  {
    "topicId": 319,
    "title": "Bài 19 — Thư viện, Văn hóa & Căn phòng",
    "description": "Nghiên cứu thư viện, nét đẹp văn hóa, không gian phòng ốc và địa lý.",
    "vocabularies": [
      {
        "vocabId": 949,
        "hanzi": "头发",
        "pinyin": "tóufa",
        "meaningHanViet": "Đầu Phát",
        "meaningVi": "Tóc, mái tóc",
        "exampleSentence": "她留着一头乌黑柔顺的长头发，显得格外温婉。",
        "exampleTranslation": "Cô ấy để một mái tóc dài đen nhánh mềm mượt, trông đặc biệt dịu dàng đằm thắm."
      },
      {
        "vocabId": 950,
        "hanzi": "突然",
        "pinyin": "tūrán",
        "meaningHanViet": "Đột Nhiên",
        "meaningVi": "Đột nhiên, bất ngờ",
        "exampleSentence": "刚才还是晴空万里，突然间就下起了瓢泼大雨。",
        "exampleTranslation": "Vừa nãy trời còn trong xanh vạn dặm, bỗng chốc đã đổ cơn mưa như trút nước."
      },
      {
        "vocabId": 366,
        "hanzi": "图书馆",
        "pinyin": "túshūguǎn",
        "meaningHanViet": "Đồ Thư Quán",
        "meaningVi": "Thư viện",
        "exampleSentence": "图书馆里非常安静。",
        "exampleTranslation": "Trong thư viện vô cùng yên tĩnh."
      },
      {
        "vocabId": 951,
        "hanzi": "腿",
        "pinyin": "tuǐ",
        "meaningHanViet": "Thoái",
        "meaningVi": "Chân, cẳng chân",
        "exampleSentence": "踢足球时不慎拉伤了腿部肌肉，需要好好静养。",
        "exampleTranslation": "Khi đá bóng không may bị căng cơ chân, cần tĩnh dưỡng nghỉ ngơi cẩn thận."
      },
      {
        "vocabId": 952,
        "hanzi": "外地",
        "pinyin": "wàidì",
        "meaningHanViet": "Ngoại Địa",
        "meaningVi": "Nơi khác, vùng khác, ngoại tỉnh",
        "exampleSentence": "许多来自外地的游客趁着黄金周假期来北京观光。",
        "exampleTranslation": "Rất nhiều du khách đến từ nơi khác tranh thủ kỳ nghỉ tuần lễ vàng đến Bắc Kinh tham quan."
      },
      {
        "vocabId": 953,
        "hanzi": "外卖",
        "pinyin": "wàimài",
        "meaningHanViet": "Ngoại Mại",
        "meaningVi": "Đồ ăn mang về, đồ giao tận nơi",
        "exampleSentence": "下班晚了不想做饭，点一份热乎乎的外卖很方便。",
        "exampleTranslation": "Tan sở muộn không muốn nấu cơm, gọi một suất đồ ăn giao tận nơi nóng hổi rất tiện."
      },
      {
        "vocabId": 370,
        "hanzi": "外语",
        "pinyin": "wàiyǔ",
        "meaningHanViet": "Ngoại Ngữ",
        "meaningVi": "Ngoại ngữ, tiếng nước ngoài",
        "exampleSentence": "学好一门外语很有用。",
        "exampleTranslation": "Học giỏi một ngoại ngữ rất có ích."
      },
      {
        "vocabId": 954,
        "hanzi": "完成",
        "pinyin": "wánchéng",
        "meaningHanViet": "Hoàn Thành",
        "meaningVi": "Hoàn thành, làm xong",
        "exampleSentence": "我们团队在截止日期前保质保量地完成了整个项目。",
        "exampleTranslation": "Nhóm chúng tôi trước thời hạn chót đã hoàn thành toàn bộ dự án đảm bảo chất lượng và số lượng."
      },
      {
        "vocabId": 955,
        "hanzi": "碗",
        "pinyin": "wǎn",
        "meaningHanViet": "Oản",
        "meaningVi": "Bát, chén (ăn cơm), bát (lượng từ)",
        "exampleSentence": "妈妈在厨房里盛了一碗热气腾腾的鸡汤端给我。",
        "exampleTranslation": "Mẹ múc một bát canh gà bốc khói nghi ngút trong bếp bưng cho tôi."
      },
      {
        "vocabId": 956,
        "hanzi": "晚点",
        "pinyin": "wǎndiǎn",
        "meaningHanViet": "Vãn Điểm",
        "meaningVi": "Đến muộn, trễ giờ (tàu, xe)",
        "exampleSentence": "由于暴风雪天气影响，多趟北上的列车出现晚点。",
        "exampleTranslation": "Do ảnh hưởng của thời tiết bão tuyết, nhiều chuyến tàu chạy về phía bắc đã bị trễ giờ."
      },
      {
        "vocabId": 957,
        "hanzi": "晚会",
        "pinyin": "wǎnhuì",
        "meaningHanViet": "Vãn Hội",
        "meaningVi": "Dạ hội, buổi liên hoan tối",
        "exampleSentence": "学校举行的新春迎新晚会节目精彩纷呈引人入胜。",
        "exampleTranslation": "Đêm dạ hội đón mừng năm mới do trường tổ chức các tiết mục vô cùng đặc sắc cuốn hút."
      },
      {
        "vocabId": 958,
        "hanzi": "网球",
        "pinyin": "wǎngqiú",
        "meaningHanViet": "Võng Cầu",
        "meaningVi": "Quần vợt, bóng tennis",
        "exampleSentence": "他每个周末都约上朋友去体育馆打两小时网球。",
        "exampleTranslation": "Cứ mỗi cuối tuần anh ấy đều hẹn bạn bè đến nhà thi đấu chơi quần vợt hai tiếng."
      },
      {
        "vocabId": 959,
        "hanzi": "网站",
        "pinyin": "wǎngzhàn",
        "meaningHanViet": "Võng Trạm",
        "meaningVi": "Trang web, website",
        "exampleSentence": "欢迎访问我们学校官方网站查询最新招生简章。",
        "exampleTranslation": "Hoan nghênh truy cập trang web chính thức của trường chúng tôi để tra cứu thông báo tuyển sinh mới nhất."
      },
      {
        "vocabId": 378,
        "hanzi": "忘记",
        "pinyin": "wàngjì",
        "meaningHanViet": "Vong Ký",
        "meaningVi": "Quên",
        "exampleSentence": "我忘记了他的电话号码。",
        "exampleTranslation": "Tôi quên mất số điện thoại của anh ấy rồi."
      },
      {
        "vocabId": 960,
        "hanzi": "为",
        "pinyin": "wèi",
        "meaningHanViet": "Vi",
        "meaningVi": "Vì, cho, làm",
        "exampleSentence": "大家都在为实现中华民族的伟大复兴而努力奋斗。",
        "exampleTranslation": "Mọi người đều đang vì mục tiêu phấn đấu thực hiện sự phục hưng vĩ đại của dân tộc."
      },
      {
        "vocabId": 961,
        "hanzi": "为了",
        "pinyin": "wèile",
        "meaningHanViet": "Vi Liễu",
        "meaningVi": "Để, vì (mục đích)",
        "exampleSentence": "为了能够顺利通过汉语水平考试，他每天刻苦练习听力。",
        "exampleTranslation": "Để có thể vượt qua kỳ thi năng lực tiếng Trung một cách thuận lợi, anh ấy mỗi ngày khổ luyện nghe."
      },
      {
        "vocabId": 962,
        "hanzi": "卫生间",
        "pinyin": "wèishēngjiān",
        "meaningHanViet": "Vệ Sinh Gian",
        "meaningVi": "Nhà vệ sinh, phòng vệ sinh",
        "exampleSentence": "请问图书馆二楼的卫生间应该往哪个方向走？",
        "exampleTranslation": "Xin hỏi nhà vệ sinh ở tầng hai thư viện nên đi theo hướng nào?"
      },
      {
        "vocabId": 963,
        "hanzi": "文化",
        "pinyin": "wénhuà",
        "meaningHanViet": "Văn Hoá",
        "meaningVi": "Văn hóa",
        "exampleSentence": "博大精深的中华传统文化吸引了世界各地的汉学爱好者。",
        "exampleTranslation": "Văn hóa truyền thống Trung Hoa sâu rộng uyên bác đã thu hút những người yêu thích Hán học khắp nơi trên thế giới."
      },
      {
        "vocabId": 964,
        "hanzi": "屋子",
        "pinyin": "wūzi",
        "meaningHanViet": "Ốc Tử",
        "meaningVi": "Căn phòng, căn nhà",
        "exampleSentence": "阳光洒进这间整洁宽敞的屋子里，让人倍感温馨。",
        "exampleTranslation": "Ánh nắng chan hòa rọi vào căn phòng sạch sẽ rộng rãi này, khiến lòng người thêm ấm áp."
      },
      {
        "vocabId": 384,
        "hanzi": "西",
        "pinyin": "xī",
        "meaningHanViet": "Tây",
        "meaningVi": "Phía tây, phương tây, hướng tây",
        "exampleSentence": "太阳从西方落下。",
        "exampleTranslation": "Mặt trời lặn về hướng tây."
      }
    ]
  },
  {
    "topicId": 320,
    "title": "Bài 20 — Phương hướng, Thói quen & Hiệu trưởng",
    "description": "Định hướng địa lý, rèn luyện thói quen tốt và giao tiếp học đường.",
    "vocabularies": [
      {
        "vocabId": 965,
        "hanzi": "西北",
        "pinyin": "xīběi",
        "meaningHanViet": "Tây Bắc",
        "meaningVi": "Tây bắc, vùng tây bắc",
        "exampleSentence": "中国西北地区有着雄浑辽阔的大漠戈壁风光。",
        "exampleTranslation": "Vùng tây bắc Trung Quốc có phong cảnh sa mạc sa mạc đá mênh mông hùng vĩ."
      },
      {
        "vocabId": 966,
        "hanzi": "西方",
        "pinyin": "xīfāng",
        "meaningHanViet": "Tây Phương",
        "meaningVi": "Phương tây, phía tây",
        "exampleSentence": "中西方文化交流与对话促进了不同文明之间的互鉴。",
        "exampleTranslation": "Giao lưu và đối thoại văn hóa giữa Trung Hoa và phương Tây đã thúc đẩy sự học hỏi lẫn nhau giữa các nền văn minh."
      },
      {
        "vocabId": 967,
        "hanzi": "西瓜",
        "pinyin": "xīguā",
        "meaningHanViet": "Tây Qua",
        "meaningVi": "Dưa hấu",
        "exampleSentence": "炎炎酷暑夏日里，切开一个冰镇西瓜格外清甜解暑。",
        "exampleTranslation": "Trong ngày hè nắng nóng gay gắt, bổ một quả dưa hấu ướp lạnh đặc biệt ngọt mát xua tan cái nóng."
      },
      {
        "vocabId": 968,
        "hanzi": "西南",
        "pinyin": "xīnán",
        "meaningHanViet": "Tây Nam",
        "meaningVi": "Tây nam, vùng tây nam",
        "exampleSentence": "中国西南的云南省素有彩云之南和动植物王国的美誉。",
        "exampleTranslation": "Tỉnh Vân Nam ở vùng tây nam Trung Quốc vốn có danh xưng miền nam mây ngũ sắc và vương quốc động thực vật."
      },
      {
        "vocabId": 969,
        "hanzi": "习惯",
        "pinyin": "xíguàn",
        "meaningHanViet": "Tập Quán",
        "meaningVi": "Thói quen, quen với",
        "exampleSentence": "养成每天坚持晨读的好习惯将让人终身受益无穷。",
        "exampleTranslation": "Rèn luyện thói quen tốt kiên trì đọc sách buổi sáng mỗi ngày sẽ khiến con người ta được hưởng lợi vô cùng suốt đời."
      },
      {
        "vocabId": 970,
        "hanzi": "喜爱",
        "pinyin": "xǐ’ài",
        "meaningHanViet": "Hỉ Ái",
        "meaningVi": "Yêu thích, mến chuộng",
        "exampleSentence": "这首经典的中国民间乐曲深受各年龄段群众的喜爱。",
        "exampleTranslation": "Khúc nhạc dân gian Trung Hoa kinh điển này được quần chúng ở mọi lứa tuổi vô cùng mến chuộng."
      },
      {
        "vocabId": 971,
        "hanzi": "洗衣机",
        "pinyin": "xǐyījī",
        "meaningHanViet": "Tẩy Y Cơ",
        "meaningVi": "Máy giặt",
        "exampleSentence": "全自动滚筒洗衣机的普及彻底解放了人们的双手。",
        "exampleTranslation": "Sự phổ cập của máy giặt lồng ngang hoàn toàn tự động đã giải phóng hoàn toàn đôi bàn tay con người."
      },
      {
        "vocabId": 972,
        "hanzi": "洗澡",
        "pinyin": "xǐzǎo",
        "meaningHanViet": "Tẩy Táo",
        "meaningVi": "Tắm, tắm rửa",
        "exampleSentence": "每天晚上睡前洗澡是个好习惯。",
        "exampleTranslation": "Mỗi tối tắm trước khi đi ngủ là một thói quen tốt."
      },
      {
        "vocabId": 973,
        "hanzi": "夏天",
        "pinyin": "xiàtiān",
        "meaningHanViet": "Hạ Thiên",
        "meaningVi": "Mùa hè",
        "exampleSentence": "夏天池塘里荷花盛开，粉红翠绿相映成趣美不胜收。",
        "exampleTranslation": "Mùa hè hoa sen trong đầm nở rộ, hồng thắm xanh tươi hòa quyện tạo nên cảnh đẹp khó tả."
      },
      {
        "vocabId": 397,
        "hanzi": "先",
        "pinyin": "xiān",
        "meaningHanViet": "Tiên",
        "meaningVi": "Trước; tiên quyết",
        "exampleSentence": "你先请坐，我马上倒茶。",
        "exampleTranslation": "Bạn hãy ngồi trước đi, tôi đi rót trà ngay."
      },
      {
        "vocabId": 974,
        "hanzi": "香蕉",
        "pinyin": "xiāngjiāo",
        "meaningHanViet": "Hương Tiêu",
        "meaningVi": "Quả chuối",
        "exampleSentence": "香蕉富含丰富的钾元素，是运动后补充能量的理想水果。",
        "exampleTranslation": "Quả chuối giàu nguyên tố kali phong phú, là loại hoa quả lý tưởng để bổ sung năng lượng sau vận động."
      },
      {
        "vocabId": 975,
        "hanzi": "相信",
        "pinyin": "xiāngxìn",
        "meaningHanViet": "Tương Tín",
        "meaningVi": "Tin tưởng, tin tưởng vào",
        "exampleSentence": "我相信只要坚持努力，就一定能成功。",
        "exampleTranslation": "Tôi tin rằng chỉ cần kiên trì nỗ lực thì nhất định sẽ thành công."
      },
      {
        "vocabId": 976,
        "hanzi": "箱子",
        "pinyin": "xiāngzi",
        "meaningHanViet": "Sương Tử",
        "meaningVi": "Chiếc hòm, vali, hộp",
        "exampleSentence": "出发远行前，他将随身换洗衣物整齐地装入旅行箱子里。",
        "exampleTranslation": "Trước khi lên đường đi xa, anh ấy xếp gọn quần áo thay thường ngày vào trong chiếc vali du lịch."
      },
      {
        "vocabId": 977,
        "hanzi": "向",
        "pinyin": "xiàng",
        "meaningHanViet": "Hướng",
        "meaningVi": "Hướng về, về phía",
        "exampleSentence": "清晨的向日葵迎着冉冉升起的红日，始终坚定地向着阳光。",
        "exampleTranslation": "Hoa hướng dương buổi sớm đón vầng thái dương đỏ rực đang mọc, luôn hướng về phía ánh sáng một cách kiên định."
      },
      {
        "vocabId": 978,
        "hanzi": "像",
        "pinyin": "xiàng",
        "meaningHanViet": "Tượng",
        "meaningVi": "Giống như, như",
        "exampleSentence": "那双清澈明亮的大眼睛像天空中闪烁的晶莹繁星。",
        "exampleTranslation": "Đôi mắt to tròn trong sáng long lanh kia giống như muôn ngàn vì sao lấp lánh trên bầu trời."
      },
      {
        "vocabId": 979,
        "hanzi": "相机",
        "pinyin": "xiàngjī",
        "meaningHanViet": "Tương Cơ",
        "meaningVi": "Máy ảnh, máy chụp hình",
        "exampleSentence": "摄影师拿起专业单反相机，精准记录下飞鸟展翅的瞬间。",
        "exampleTranslation": "Nhiếp ảnh gia cầm máy ảnh chuyên dụng lên, ghi lại chuẩn xác khoảnh khắc đàn chim sải cánh tung bay."
      },
      {
        "vocabId": 980,
        "hanzi": "小区",
        "pinyin": "xiǎoqū",
        "meaningHanViet": "Tiểu Khu",
        "meaningVi": "Khu dân cư, tiểu khu",
        "exampleSentence": "我们小区的绿化覆盖率很高，生活配套设施也一应俱全。",
        "exampleTranslation": "Tỷ lệ phủ xanh của khu dân cư chúng tôi rất cao, các tiện ích sinh hoạt cũng đầy đủ vẹn toàn."
      },
      {
        "vocabId": 981,
        "hanzi": "小心",
        "pinyin": "xiǎoxīn",
        "meaningHanViet": "Tiểu Tâm",
        "meaningVi": "Cẩn thận, chú ý",
        "exampleSentence": "下雨天路面湿滑，骑车出行一定要格外小心慢行。",
        "exampleTranslation": "Ngày mưa mặt đường trơn ướt, đi xe ra ngoài nhất định phải đặc biệt cẩn thận đi chậm rãi."
      },
      {
        "vocabId": 982,
        "hanzi": "校园",
        "pinyin": "xiàoyuán",
        "meaningHanViet": "Hiệu Viên",
        "meaningVi": "Khuôn viên trường, sân trường",
        "exampleSentence": "秋日的大学校园里落叶金黄，处处洋溢着青春的书卷气。",
        "exampleTranslation": "Khuôn viên trường đại học ngày thu lá vàng rơi ngập lối, khắp nơi tràn ngập hơi thở thanh xuân đèn sách."
      },
      {
        "vocabId": 983,
        "hanzi": "校长",
        "pinyin": "xiàozhǎng",
        "meaningHanViet": "Hiệu Trưởng",
        "meaningVi": "Hiệu trưởng",
        "exampleSentence": "在毕业典礼上，德高望重的老校长发表了语重心长的讲话。",
        "exampleTranslation": "Trong lễ tốt nghiệp, vị hiệu trưởng già đức cao vọng trọng đã phát biểu những lời dặn dò thấm thía sâu sắc."
      }
    ]
  },
  {
    "topicId": 321,
    "title": "Bài 21 — Tin tức, Báo chí & Yêu cầu",
    "description": "Đọc báo cập nhật tin tức, thực phẩm tươi ngon và các yêu cầu công việc.",
    "vocabularies": [
      {
        "vocabId": 984,
        "hanzi": "鞋",
        "pinyin": "xié",
        "meaningHanViet": "Hài",
        "meaningVi": "Giày, đôi giày",
        "exampleSentence": "登山一定要穿一双防滑耐磨透气性能良好的专业徒步鞋。",
        "exampleTranslation": "Đi leo núi nhất định phải đi một đôi giày đi bộ chuyên dụng chống trượt mài mòn và thoáng khí tốt."
      },
      {
        "vocabId": 985,
        "hanzi": "心里",
        "pinyin": "xīnlǐ",
        "meaningHanViet": "Tâm Lý",
        "meaningVi": "Trong lòng, nội tâm",
        "exampleSentence": "听到远方家人的平安报信，他悬在心里的石头终于落地了。",
        "exampleTranslation": "Nghe được tin báo bình an của người thân ở phương xa, tảng đá đè nặng trong lòng anh ấy rốt cuộc đã rơi xuống."
      },
      {
        "vocabId": 412,
        "hanzi": "新年",
        "pinyin": "xīnnián",
        "meaningHanViet": "Tân Niên",
        "meaningVi": "Năm mới, tết",
        "exampleSentence": "祝大家新年快乐，万事如意！",
        "exampleTranslation": "Chúc mọi người năm mới vui vẻ, vạn sự như ý!"
      },
      {
        "vocabId": 986,
        "hanzi": "新闻",
        "pinyin": "xīnwén",
        "meaningHanViet": "Tân Văn",
        "meaningVi": "Tin tức, thời sự",
        "exampleSentence": "爷爷每天傍晚准时收看中央电视台的新闻联播节目。",
        "exampleTranslation": "Ông nội mỗi buổi chập tối đều đúng giờ đón xem chương trình thời sự của đài truyền hình trung ương."
      },
      {
        "vocabId": 987,
        "hanzi": "新鲜",
        "pinyin": "xīnxiān",
        "meaningHanViet": "Tân Tiên",
        "meaningVi": "Tươi, tươi mới, mới mẻ",
        "exampleSentence": "清晨早市上的各种蔬菜瓜果都带着露珠，格外新鲜脆甜。",
        "exampleTranslation": "Các loại rau củ hoa quả ở chợ sớm ban mai còn đọng giọt sương, đặc biệt tươi ngon giòn ngọt."
      },
      {
        "vocabId": 988,
        "hanzi": "信",
        "pinyin": "xìn",
        "meaningHanViet": "Tín",
        "meaningVi": "Bức thư, tin tưởng, thư từ",
        "exampleSentence": "今天下午我收到了朋友寄来的一封信。",
        "exampleTranslation": "Chiều nay tôi đã nhận được một bức thư bạn gửi đến."
      },
      {
        "vocabId": 989,
        "hanzi": "信用卡",
        "pinyin": "xìnyòngkǎ",
        "meaningHanViet": "Tín Dụng Tạp",
        "meaningVi": "Thẻ tín dụng",
        "exampleSentence": "使用信用卡进行境外刷卡消费时要注意保管好个人信息安全。",
        "exampleTranslation": "Khi dùng thẻ tín dụng quẹt thẻ chi tiêu ở nước ngoài cần chú ý bảo vệ an toàn thông tin cá nhân."
      },
      {
        "vocabId": 416,
        "hanzi": "行",
        "pinyin": "xíng",
        "meaningHanViet": "Hành",
        "meaningVi": "Được; đi; thực hiện",
        "exampleSentence": "如果你时间方便，这样就行。",
        "exampleTranslation": "Nếu thời gian của bạn thuận tiện, vậy thì được rồi."
      },
      {
        "vocabId": 990,
        "hanzi": "行李",
        "pinyin": "xíngli",
        "meaningHanViet": "Hành Lý",
        "meaningVi": "Hành lý",
        "exampleSentence": "乘坐高铁时，大件随身行李请有序存放在车厢连接处的行李架上。",
        "exampleTranslation": "Khi đi tàu cao tốc, hành lý cồng kềnh mang theo xin hãy để ngay ngắn trên giá để hành lý ở nơi nối toa."
      },
      {
        "vocabId": 991,
        "hanzi": "兴趣",
        "pinyin": "xìngqù",
        "meaningHanViet": "Hứng Thú",
        "meaningVi": "Hứng thú, niềm đam mê",
        "exampleSentence": "培养对中华书法艺术的浓厚兴趣能够修身养性陶冶情操。",
        "exampleTranslation": "Bồi dưỡng niềm hứng thú sâu sắc với nghệ thuật thư pháp Trung Hoa có thể tu dưỡng tâm tính nuôi dưỡng tâm hồn."
      },
      {
        "vocabId": 992,
        "hanzi": "休假",
        "pinyin": "xiūjià",
        "meaningHanViet": "Hưu Giá",
        "meaningVi": "Nghỉ phép, nghỉ lễ",
        "exampleSentence": "忙碌了整整一年，他终于批准休假一周陪伴年迈的父母。",
        "exampleTranslation": "Sau một năm ròng rã bận rộn, anh ấy rốt cuộc đã được duyệt nghỉ phép một tuần để ở bên cha mẹ già."
      },
      {
        "vocabId": 993,
        "hanzi": "需要",
        "pinyin": "xūyào",
        "meaningHanViet": "Nhu Yếu",
        "meaningVi": "Cần, nhu cầu, đòi hỏi",
        "exampleSentence": "完成这项复杂的科研攻关任务需要团队全体成员精诚协作。",
        "exampleTranslation": "Hoàn thành nhiệm vụ nghiên cứu khoa học phức tạp này đòi hỏi toàn thể thành viên trong đội ngũ phải hợp tác chân thành."
      },
      {
        "vocabId": 994,
        "hanzi": "选",
        "pinyin": "xuǎn",
        "meaningHanViet": "Tuyển",
        "meaningVi": "Chọn, tuyển chọn",
        "exampleSentence": "大学期间选一门自己真正热爱又具有发展前景的专业至关重要。",
        "exampleTranslation": "Thời đại học chọn được một chuyên ngành bản thân thực sự đam mê lại có triển vọng phát triển là vô cùng quan trọng."
      },
      {
        "vocabId": 995,
        "hanzi": "选择",
        "pinyin": "xuǎnzé",
        "meaningHanViet": "Tuyển Trạch",
        "meaningVi": "Lựa chọn",
        "exampleSentence": "面对人生的重大十字路口，我们要坚定而清醒地做出正确选择。",
        "exampleTranslation": "Đối diện với ngã rẽ lớn của cuộc đời, chúng ta cần phải kiên định và tỉnh táo đưa ra sự lựa chọn đúng đắn."
      },
      {
        "vocabId": 996,
        "hanzi": "学期",
        "pinyin": "xuéqī",
        "meaningHanViet": "Học Kỳ",
        "meaningVi": "Học kỳ",
        "exampleSentence": "新学期伊始，同学们个个精神饱满地投入到紧张的学习中。",
        "exampleTranslation": "Học kỳ mới vừa bắt đầu, các bạn học sinh ai nấy đều tràn đầy tinh thần hăng say bước vào học tập khẩn trương."
      },
      {
        "vocabId": 997,
        "hanzi": "牙",
        "pinyin": "yá",
        "meaningHanViet": "Nha",
        "meaningVi": "Răng",
        "exampleSentence": "保持牙齿健康整洁，每天坚持饭后漱口和正确早晚刷牙。",
        "exampleTranslation": "Giữ hàm răng khỏe mạnh sạch sẽ, mỗi ngày kiên trì súc miệng sau bữa ăn và đánh răng đúng cách sáng tối."
      },
      {
        "vocabId": 998,
        "hanzi": "牙刷",
        "pinyin": "yáshuā",
        "meaningHanViet": "Nha Loát",
        "meaningVi": "Bàn chải đánh răng",
        "exampleSentence": "牙医建议大家每隔两到三个月就应该定期更换一次新牙刷。",
        "exampleTranslation": "Bác sĩ nha khoa khuyên mọi người cứ cách hai đến ba tháng nên định kỳ thay bàn chải đánh răng mới một lần."
      },
      {
        "vocabId": 999,
        "hanzi": "羊",
        "pinyin": "yáng",
        "meaningHanViet": "Dương",
        "meaningVi": "Con cừu, con dê",
        "exampleSentence": "茫茫草原上一群洁白如雪的绵羊正在悠闲惬意地啃食青草。",
        "exampleTranslation": "Trên thảo nguyên bao la một đàn cừu trắng muốt như tuyết đang thong thả gặm cỏ xanh."
      },
      {
        "vocabId": 1000,
        "hanzi": "养",
        "pinyin": "yǎng",
        "meaningHanViet": "Dưỡng",
        "meaningVi": "Nuôi, dưỡng, chăm sóc",
        "exampleSentence": "退休后的爷爷在宽敞的后院里养了许多名贵兰花和观赏金鱼。",
        "exampleTranslation": "Sau khi nghỉ hưu ông nội nuôi trồng rất nhiều hoa lan quý và cá vàng ngắm cảnh ở khoảng sân sau rộng rãi."
      },
      {
        "vocabId": 1001,
        "hanzi": "要求",
        "pinyin": "yāoqiú",
        "meaningHanViet": "Yếu Cầu",
        "meaningVi": "Yêu cầu, đòi hỏi",
        "exampleSentence": "老师对我们的汉字笔画书写顺序和字形结构有着严格要求。",
        "exampleTranslation": "Thầy giáo có yêu cầu rất khắt khe đối với thứ tự nét bút chữ Hán và kết cấu nét chữ của chúng tôi."
      }
    ]
  },
  {
    "topicId": 322,
    "title": "Bài 22 — Trang sách, Tương đồng & Ảnh hưởng",
    "description": "Đọc sách từng trang, nhận biết điểm tương đồng và sức ảnh hưởng.",
    "vocabularies": [
      {
        "vocabId": 426,
        "hanzi": "页",
        "pinyin": "yè",
        "meaningHanViet": "Hiệt",
        "meaningVi": "Trang sách, trang, tờ",
        "exampleSentence": "请大家翻到课本第四十五页。",
        "exampleTranslation": "Xin mời mọi người lật tới trang 45 sách giáo khoa."
      },
      {
        "vocabId": 1002,
        "hanzi": "一定",
        "pinyin": "yídìng",
        "meaningHanViet": "Nhất Định",
        "meaningVi": "Nhất định, chắc chắn",
        "exampleSentence": "只要持之以恒坚持不懈，你的中文水平就一定能取得飞跃进步。",
        "exampleTranslation": "Chỉ cần kiên trì không ngừng nghỉ thì trình độ tiếng Trung của bạn nhất định sẽ đạt được bước tiến nhảy vọt."
      },
      {
        "vocabId": 1003,
        "hanzi": "一共",
        "pinyin": "yígòng",
        "meaningHanViet": "Nhất Cộng",
        "meaningVi": "Tổng cộng, hết thảy",
        "exampleSentence": "我们班级一共有来自十几个国家的三十五名留学生。",
        "exampleTranslation": "Lớp học của chúng tôi tổng cộng có ba mươi lăm bạn du học sinh đến từ mười mấy quốc gia."
      },
      {
        "vocabId": 433,
        "hanzi": "一块儿",
        "pinyin": "yíkuàir",
        "meaningHanViet": "Nhất Khối Nhi",
        "meaningVi": "Cùng nhau, cùng một nơi",
        "exampleSentence": "周末我们一块儿去爬山吧。",
        "exampleTranslation": "Cuối tuần chúng ta cùng nhau đi leo núi nhé."
      },
      {
        "vocabId": 435,
        "hanzi": "一样",
        "pinyin": "yíyàng",
        "meaningHanViet": "Nhất Dạng",
        "meaningVi": "Giống; như",
        "exampleSentence": "他的性格跟他爸爸一样。",
        "exampleTranslation": "Tính cách của anh ấy giống y hệt như bố mình."
      },
      {
        "vocabId": 1004,
        "hanzi": "以后",
        "pinyin": "yǐhòu",
        "meaningHanViet": "Dĩ Hậu",
        "meaningVi": "Sau này, về sau, sau khi",
        "exampleSentence": "经过这次教训以后，他做事变得格外沉着稳重与严谨细致。",
        "exampleTranslation": "Sau bài học lần này về sau anh ấy làm việc trở nên đặc biệt điềm tĩnh chín chắn và cẩn trọng tỉ mỉ."
      },
      {
        "vocabId": 1005,
        "hanzi": "以前",
        "pinyin": "yǐqián",
        "meaningHanViet": "Dĩ Tiền",
        "meaningVi": "Trước đây, trước kia, trước khi",
        "exampleSentence": "在来中国留学以前，他已经自学了半年的基础汉语语音知识。",
        "exampleTranslation": "Trước khi đến Trung Quốc du học, anh ấy đã tự học kiến thức ngữ âm tiếng Trung cơ bản nửa năm."
      },
      {
        "vocabId": 1006,
        "hanzi": "以上",
        "pinyin": "yǐshàng",
        "meaningHanViet": "Dĩ Thượng",
        "meaningVi": "Trở lên, trên (con số, mức độ)",
        "exampleSentence": "凡是汉语水平考试成绩在两百分以上的考生均可申请该项奖学金。",
        "exampleTranslation": "Phàm là thí sinh có điểm thi năng lực Hán ngữ đạt từ hai trăm điểm trở lên đều có thể nộp đơn xin học bổng này."
      },
      {
        "vocabId": 1007,
        "hanzi": "以外",
        "pinyin": "yǐwài",
        "meaningHanViet": "Dĩ Ngoại",
        "meaningVi": "Ngoài... ra, bên ngoài",
        "exampleSentence": "除了上课学习专业知识以外，他还积极参加各类社会公益实践活动。",
        "exampleTranslation": "Ngoài việc lên lớp học kiến thức chuyên ngành ra, anh ấy còn tích cực tham gia các hoạt động thực tiễn công ích xã hội."
      },
      {
        "vocabId": 1008,
        "hanzi": "以为",
        "pinyin": "yǐwéi",
        "meaningHanViet": "Dĩ Vi",
        "meaningVi": "Tưởng rằng, ngỡ là (nghĩ sai)",
        "exampleSentence": "我原本以为今天下午会下大雨，没想到天空反而放晴万里无云。",
        "exampleTranslation": "Tôi vốn tưởng rằng chiều nay sẽ mưa to, không ngờ trời lại hửng nắng trong xanh không một gợn mây."
      },
      {
        "vocabId": 1009,
        "hanzi": "以下",
        "pinyin": "yǐxià",
        "meaningHanViet": "Dĩ Hạ",
        "meaningVi": "Trở xuống, dưới (mức độ, con số)",
        "exampleSentence": "气温骤降到零摄氏度以下时，道路表面极易结冰造成行车困难。",
        "exampleTranslation": "Khi nhiệt độ giảm đột ngột xuống dưới không độ C, mặt đường rất dễ đóng băng gây khó khăn cho việc đi lại."
      },
      {
        "vocabId": 1010,
        "hanzi": "一般",
        "pinyin": "yìbān",
        "meaningHanViet": "Nhất Ban",
        "meaningVi": "Bình thường, thông thường, phổ biến",
        "exampleSentence": "在日常生活中，他一般习惯在早晨六点准时起床晨练跑步。",
        "exampleTranslation": "Trong đời sống thường ngày, anh ấy thông thường có thói quen thức dậy đúng sáu giờ sáng để tập thể dục chạy bộ."
      },
      {
        "vocabId": 436,
        "hanzi": "一边",
        "pinyin": "yìbiān",
        "meaningHanViet": "Nhất Biên",
        "meaningVi": "Một bên; mỗi bên",
        "exampleSentence": "他一边听音乐，一边写作业。",
        "exampleTranslation": "Anh ấy vừa nghe nhạc, vừa làm bài tập."
      },
      {
        "vocabId": 1011,
        "hanzi": "一直",
        "pinyin": "yìzhí",
        "meaningHanViet": "Nhất Trực",
        "meaningVi": "Thẳng, liên tục, suốt",
        "exampleSentence": "从校门口沿着这条林荫大道一直往前走，右手边就是图书馆。",
        "exampleTranslation": "Từ cổng trường dọc theo đại lộ rợp bóng cây này đi thẳng mãi về phía trước, bên tay phải chính là thư viện."
      },
      {
        "vocabId": 1012,
        "hanzi": "音乐",
        "pinyin": "yīnyuè",
        "meaningHanViet": "Âm Nhạc",
        "meaningVi": "Âm nhạc",
        "exampleSentence": "闲暇时听听古典音乐能让人心情放松。",
        "exampleTranslation": "Lúc rảnh rỗi nghe chút âm nhạc cổ điển có thể giúp tâm trạng thư giãn."
      },
      {
        "vocabId": 1013,
        "hanzi": "银行",
        "pinyin": "yínháng",
        "meaningHanViet": "Ngân Hành",
        "meaningVi": "Ngân hàng",
        "exampleSentence": "他今天下午请假去中国银行办理跨境学费转账业务。",
        "exampleTranslation": "Chiều nay anh ấy xin nghỉ phép đến Ngân hàng Trung Quốc làm thủ tục chuyển khoản học phí qua biên giới."
      },
      {
        "vocabId": 1014,
        "hanzi": "银行卡",
        "pinyin": "yínhángkǎ",
        "meaningHanViet": "Ngân Hành Tạp",
        "meaningVi": "Thẻ ngân hàng",
        "exampleSentence": "在自动取款机办理业务后，请务必随手收好您的银行卡与凭条。",
        "exampleTranslation": "Sau khi giao dịch tại cây ATM, xin nhất thiết hãy cất kỹ thẻ ngân hàng và biên lai của bạn."
      },
      {
        "vocabId": 1015,
        "hanzi": "饮料",
        "pinyin": "yǐnliào",
        "meaningHanViet": "Ẩm Liệu",
        "meaningVi": "Đồ uống, thức uống",
        "exampleSentence": "夏天冷饮店里供应着各种用新鲜水果鲜榨的冰镇健康饮料。",
        "exampleTranslation": "Mùa hè tiệm đồ uống lạnh cung cấp nhiều loại đồ uống giải khát mát lạnh bổ dưỡng ép từ hoa quả tươi."
      },
      {
        "vocabId": 1016,
        "hanzi": "应该",
        "pinyin": "yīnggāi",
        "meaningHanViet": "Ứng Cai",
        "meaningVi": "Nên, phải, cần phải",
        "exampleSentence": "遇到不懂的语法难点时，大家应该主动大胆向授课老师请教。",
        "exampleTranslation": "Khi gặp điểm khó ngữ pháp không hiểu, mọi người nên chủ động mạnh dạn thỉnh giáo thầy cô giảng dạy."
      },
      {
        "vocabId": 1017,
        "hanzi": "影响",
        "pinyin": "yǐngxiǎng",
        "meaningHanViet": "Ảnh Hưởng",
        "meaningVi": "Ảnh hưởng, tác động",
        "exampleSentence": "在公共阅览室里大声接打电话会严重影响其他读者的安静阅读。",
        "exampleTranslation": "Nói chuyện điện thoại to trong phòng đọc công cộng sẽ ảnh hưởng nghiêm trọng đến việc đọc sách yên tĩnh của người khác."
      }
    ]
  },
  {
    "topicId": 323,
    "title": "Bài 23 — Trò chơi, Hòm thư & Đại hội thể thao",
    "description": "Thư điện tử, du khách tham quan, trò chơi và đại hội thể thao.",
    "vocabularies": [
      {
        "vocabId": 440,
        "hanzi": "用",
        "pinyin": "yòng",
        "meaningHanViet": "Dụng",
        "meaningVi": "Dùng; sử dụng",
        "exampleSentence": "请大家用汉语回答老师的问题。",
        "exampleTranslation": "Xin mời mọi người dùng tiếng Trung trả lời câu hỏi của thầy giáo."
      },
      {
        "vocabId": 1018,
        "hanzi": "邮件",
        "pinyin": "yóujiàn",
        "meaningHanViet": "Bưu Kiện",
        "meaningVi": "Bưu phẩm, thư điện tử, bưu kiện",
        "exampleSentence": "他刚刚收到了海外合作大学招生办发来的一封正式录取确认邮件。",
        "exampleTranslation": "Anh ấy vừa nhận được một bức thư điện tử xác nhận trúng tuyển chính thức từ phòng tuyển sinh đại học đối tác ở nước ngoài."
      },
      {
        "vocabId": 1019,
        "hanzi": "游客",
        "pinyin": "yóukè",
        "meaningHanViet": "Du Khách",
        "meaningVi": "Du khách, khách tham quan",
        "exampleSentence": "每年金秋十月都有成千上万的中外游客登临北京八达岭长城。",
        "exampleTranslation": "Hằng năm vào tháng mười mùa thu vàng có hàng vạn du khách trong và ngoài nước bước lên Vạn Lý Trường Thành Bát Đạt Lĩnh Bắc Kinh."
      },
      {
        "vocabId": 1020,
        "hanzi": "游戏",
        "pinyin": "yóuxì",
        "meaningHanViet": "Du Hí",
        "meaningVi": "Trò chơi, game",
        "exampleSentence": "适度玩益智类电子游戏可以开发智力，但沉迷其中则有害学业。",
        "exampleTranslation": "Chơi game điện tử rèn luyện trí tuệ ở mức độ vừa phải có thể phát triển trí thông minh, nhưng sa đà vào đó sẽ hại cho việc học hành."
      },
      {
        "vocabId": 1021,
        "hanzi": "邮箱",
        "pinyin": "yóuxiāng",
        "meaningHanViet": "Bưu Sương",
        "meaningVi": "Hòm thư, hộp thư, hộp thư điện tử",
        "exampleSentence": "请在个人简历里务必准确注明您经常查阅的常用电子邮箱地址。",
        "exampleTranslation": "Trong sơ yếu lý lịch cá nhân xin nhất định phải ghi rõ ràng địa chỉ hộp thư điện tử thường dùng của bạn."
      },
      {
        "vocabId": 1022,
        "hanzi": "有关",
        "pinyin": "yǒuguān",
        "meaningHanViet": "Hữu Quan",
        "meaningVi": "Có liên quan, liên can",
        "exampleSentence": "有关这次学术研讨会的具体日程安排已经正式公布在学院网上了。",
        "exampleTranslation": "Lịch trình cụ thể có liên quan đến hội thảo học thuật lần này đã được đăng tải chính thức trên trang mạng của học viện."
      },
      {
        "vocabId": 443,
        "hanzi": "有名",
        "pinyin": "yǒumíng",
        "meaningHanViet": "Hữu Danh",
        "meaningVi": "Nổi tiếng; được biết đến",
        "exampleSentence": "北京烤鸭是闻名世界的中国名菜。",
        "exampleTranslation": "Vịt quay Bắc Kinh là món ăn nổi tiếng khắp thế giới của Trung Quốc."
      },
      {
        "vocabId": 446,
        "hanzi": "有用",
        "pinyin": "yǒuyòng",
        "meaningHanViet": "Hữu Dụng",
        "meaningVi": "Hữu ích",
        "exampleSentence": "掌握这门技术非常有用。",
        "exampleTranslation": "Nắm vững kỹ thuật này vô cùng hữu ích."
      },
      {
        "vocabId": 1023,
        "hanzi": "又",
        "pinyin": "yòu",
        "meaningHanViet": "Hựu",
        "meaningVi": "Lại, vừa... lại...",
        "exampleSentence": "今天下午天空中下着蒙蒙细雨，刮着微风，天气又清凉又舒适。",
        "exampleTranslation": "Chiều nay trên trời đổ cơn mưa phùn lất phất, gió thoảng hiu hiu, thời tiết vừa mát mẻ lại vừa dễ chịu."
      },
      {
        "vocabId": 1024,
        "hanzi": "羽毛球",
        "pinyin": "yǔmáoqiú",
        "meaningHanViet": "Vũ Mao Cầu",
        "meaningVi": "Cầu lông, môn cầu lông",
        "exampleSentence": "下课后体育馆的羽毛球场地总是非常抢手，挤满了运动健儿。",
        "exampleTranslation": "Sau giờ tan học sân cầu lông của nhà thi đấu lúc nào cũng rất đắt khách, chật kín các bạn trẻ yêu thể thao."
      },
      {
        "vocabId": 1025,
        "hanzi": "语言",
        "pinyin": "yǔyán",
        "meaningHanViet": "Ngữ Ngôn",
        "meaningVi": "Ngôn ngữ, tiếng nói",
        "exampleSentence": "语言不仅是人类交流思想的工具，更是了解一个民族文化的桥梁。",
        "exampleTranslation": "Ngôn ngữ không chỉ là công cụ giao lưu tư tưởng của con người mà còn là chiếc cầu nối để tìm hiểu văn hóa của một dân tộc."
      },
      {
        "vocabId": 1026,
        "hanzi": "雨衣",
        "pinyin": "yǔyī",
        "meaningHanViet": "Vũ Y",
        "meaningVi": "Áo mưa",
        "exampleSentence": "夏日骑电动车出门前一定要在车座底下备上一件轻便的雨衣。",
        "exampleTranslation": "Mùa hè trước khi đi xe máy điện ra ngoài nhất định phải để sẵn một chiếc áo mưa tiện lợi dưới cốp xe."
      },
      {
        "vocabId": 1027,
        "hanzi": "遇到",
        "pinyin": "yùdào",
        "meaningHanViet": "Ngộ Đáo",
        "meaningVi": "Gặp phải, bắt gặp (tình cờ/khó khăn)",
        "exampleSentence": "在异国求学道路上难免会遇到挫折，关键在于拥有克服困难的勇气。",
        "exampleTranslation": "Trên con đường du học nơi đất khách khó lòng tránh khỏi gặp phải trắc trở, điều cốt lõi nằm ở lòng dũng cảm vượt qua khó khăn."
      },
      {
        "vocabId": 1028,
        "hanzi": "遇见",
        "pinyin": "yùjiàn",
        "meaningHanViet": "Ngộ Kiến",
        "meaningVi": "Gặp, bắt gặp (người)",
        "exampleSentence": "今天在大学图书馆借书处偶然遇见了多年未曾联络的中学校友。",
        "exampleTranslation": "Hôm nay ở nơi mượn sách thư viện đại học tình cờ bắt gặp người bạn học thời cấp hai nhiều năm chưa từng liên lạc."
      },
      {
        "vocabId": 1029,
        "hanzi": "园",
        "pinyin": "yuán",
        "meaningHanViet": "Viên",
        "meaningVi": "Vườn, công viên, khu vực",
        "exampleSentence": "周末漫步在环境清幽的城市公园里，让人心旷神怡扫尽一周疲惫。",
        "exampleTranslation": "Cuối tuần dạo bước trong công viên thành phố môi trường thanh tĩnh làm lòng người sảng khoái xua tan mệt mỏi cả tuần."
      },
      {
        "vocabId": 1030,
        "hanzi": "员",
        "pinyin": "yuán",
        "meaningHanViet": "Viên",
        "meaningVi": "Nhân viên, thành viên",
        "exampleSentence": "全体工作人员以热情高度的责任心为本次大赛提供了周密保障。",
        "exampleTranslation": "Toàn thể nhân viên làm việc với tinh thần trách nhiệm nhiệt tình cao đã đem đến sự bảo đảm chu đáo cho cuộc thi lần này."
      },
      {
        "vocabId": 1031,
        "hanzi": "愿意",
        "pinyin": "yuànyì",
        "meaningHanViet": "Nguyện Ý",
        "meaningVi": "Sẵn lòng, bằng lòng, muốn",
        "exampleSentence": "如果有机会去偏远贫困山区支教，我非常愿意奉献自己的一份力量。",
        "exampleTranslation": "Nếu có cơ hội được đến miền núi xa xôi nghèo khó dạy học tình nguyện, tôi rất sẵn lòng cống hiến một phần sức lực của mình."
      },
      {
        "vocabId": 1032,
        "hanzi": "越",
        "pinyin": "yuè",
        "meaningHanViet": "Việt",
        "meaningVi": "Càng, vượt qua, vượt bậc",
        "exampleSentence": "经过持之以恒的刻苦苦练，他的中文发音咬字越来越地道标准了。",
        "exampleTranslation": "Qua thời gian khổ luyện kiên trì không ngừng, phát âm nhả chữ tiếng Trung của cậu ấy càng ngày càng chuẩn xác tự nhiên."
      },
      {
        "vocabId": 1033,
        "hanzi": "月亮",
        "pinyin": "yuèliang",
        "meaningHanViet": "Nguyệt Lượng",
        "meaningVi": "Mặt trăng",
        "exampleSentence": "八月十五中秋佳节之夜，天空中挂着一轮皎洁如玉的明亮月亮。",
        "exampleTranslation": "Đêm tết Trung thu rằm tháng tám, trên bầu trời treo một vầng trăng sáng vằng vặc trong ngần như ngọc."
      },
      {
        "vocabId": 1034,
        "hanzi": "运动会",
        "pinyin": "yùndònghuì",
        "meaningHanViet": "Vận Động Hội",
        "meaningVi": "Đại hội thể thao, hội thao",
        "exampleSentence": "在一年一度的春季田径运动会上，运动健儿们顽强拼搏屡创佳绩。",
        "exampleTranslation": "Tại đại hội thể thao điền kinh mùa xuân thường niên, các vận động viên ngoan cường nỗ lực liên tiếp lập thành tích tốt."
      }
    ]
  },
  {
    "topicId": 324,
    "title": "Bài 24 — Vận động viên, Vệ sinh & Điều kiện",
    "description": "Tập luyện thể thao, giữ gìn vệ sinh và thiết lập điều kiện giải quyết.",
    "vocabularies": [
      {
        "vocabId": 1035,
        "hanzi": "运动员",
        "pinyin": "yùndòngyuán",
        "meaningHanViet": "Vận Động Viên",
        "meaningVi": "Vận động viên",
        "exampleSentence": "优秀运动员们在国际赛场上顽强拼搏，为祖国赢得了巨大的荣誉。",
        "exampleTranslation": "Các vận động viên ưu tú kiên cường thi đấu trên đấu trường quốc tế, mang lại vinh quang to lớn cho tổ quốc."
      },
      {
        "vocabId": 1036,
        "hanzi": "咱们",
        "pinyin": "zánmen",
        "meaningHanViet": "Trá Môn",
        "meaningVi": "Chúng ta, chúng mình (bao gồm người nghe)",
        "exampleSentence": "既然大家都在这里，咱们就抓紧时间坐下来商量具体分工吧。",
        "exampleTranslation": "Nếu mọi người đều ở đây rồi, chúng mình mau tranh thủ thời gian ngồi lại bàn bạc phân công cụ thể nhé."
      },
      {
        "vocabId": 1037,
        "hanzi": "脏",
        "pinyin": "zāng",
        "meaningHanViet": "Tạng",
        "meaningVi": "Bẩn, dơ, ô uế",
        "exampleSentence": "踢完足球回到家后请先把脏衣服换下来放进洗衣篮里。",
        "exampleTranslation": "Đá bóng xong về nhà xin hãy thay bộ quần áo bẩn ra trước rồi để vào giỏ giặt."
      },
      {
        "vocabId": 1038,
        "hanzi": "怎么办",
        "pinyin": "zěnme bàn",
        "meaningHanViet": "Chẩm Ma Biện",
        "meaningVi": "Làm sao bây giờ, phải làm sao",
        "exampleSentence": "马上就要开始正式演讲了，我的幻灯片突然打不开怎么办？",
        "exampleTranslation": "Sắp bắt đầu bài thuyết trình chính thức rồi, slide của tôi đột nhiên không mở được thì phải làm sao bây giờ?"
      },
      {
        "vocabId": 1039,
        "hanzi": "怎样",
        "pinyin": "zěnyàng",
        "meaningHanViet": "Chẩm Dạng",
        "meaningVi": "Thế nào, ra làm sao, bằng cách nào",
        "exampleSentence": "请问我们要怎样才能在短时间内快速提高汉语听力与口语表达？",
        "exampleTranslation": "Xin hỏi chúng ta phải làm thế nào mới có thể nhanh chóng nâng cao kỹ năng nghe và biểu đạt khẩu ngữ tiếng Trung trong thời gian ngắn?"
      },
      {
        "vocabId": 1040,
        "hanzi": "站",
        "pinyin": "zhàn",
        "meaningHanViet": "Trạm",
        "meaningVi": "Đứng, dựng đứng (động từ)",
        "exampleSentence": "公交车上大家都站着，没有空座位。",
        "exampleTranslation": "Trên xe buýt mọi người đều đứng, không có chỗ ngồi trống."
      },
      {
        "vocabId": 1041,
        "hanzi": "张",
        "pinyin": "zhāng",
        "meaningHanViet": "Trương",
        "meaningVi": "Tấm, tờ, chiếc (lượng từ giấy/bàn/giường/vé)",
        "exampleSentence": "请在桌上铺开一张崭新雪白的宣纸，我们马上要开始练习国画。",
        "exampleTranslation": "Xin hãy trải một tờ giấy xuyến trắng tinh mới lên bàn, chúng ta sắp bắt đầu luyện vẽ tranh thủy mặc."
      },
      {
        "vocabId": 1042,
        "hanzi": "长",
        "pinyin": "zhǎng",
        "meaningHanViet": "Trưởng",
        "meaningVi": "Trưởng, lớn lên, sinh ra, đứng đầu",
        "exampleSentence": "他长得很高。",
        "exampleTranslation": "Anh ấy lớn lên rất cao."
      },
      {
        "vocabId": 1043,
        "hanzi": "着急",
        "pinyin": "zháojí",
        "meaningHanViet": "Trước Cấp",
        "meaningVi": "Sốt ruột, lo lắng, gấp gáp",
        "exampleSentence": "快迟到了，他心里感到非常着急。",
        "exampleTranslation": "Sắp muộn rồi, trong lòng anh ấy cảm thấy rất sốt ruột."
      },
      {
        "vocabId": 1044,
        "hanzi": "照",
        "pinyin": "zhào",
        "meaningHanViet": "Chiếu",
        "meaningVi": "Chiếu, soi, chụp, hướng theo",
        "exampleSentence": "温暖的阳光照在湖面上，风景十分美丽。",
        "exampleTranslation": "Ánh nắng ấm áp chiếu lên mặt hồ, phong cảnh vô cùng đẹp đẽ."
      },
      {
        "vocabId": 1045,
        "hanzi": "照顾",
        "pinyin": "zhàogù",
        "meaningHanViet": "Chiếu Cố",
        "meaningVi": "Chăm sóc, trông nom, săn sóc",
        "exampleSentence": "父母生病住院期间，他请假在医院病床前无微不至地悉心照顾。",
        "exampleTranslation": "Thời gian cha mẹ ốm nằm viện, anh ấy xin nghỉ phép túc trực trước giường bệnh chăm sóc ân cần chu đáo."
      },
      {
        "vocabId": 1046,
        "hanzi": "照片",
        "pinyin": "zhàopiàn",
        "meaningHanViet": "Chiếu Phiến",
        "meaningVi": "Bức ảnh, tấm hình",
        "exampleSentence": "翻开珍藏多年的毕业纪念相册，一张张泛黄的老照片唤醒了青春。",
        "exampleTranslation": "Lật mở cuốn an-bum kỷ yếu tốt nghiệp trân quý bao năm, từng bức ảnh cũ ố vàng đánh thức cả tuổi thanh xuân."
      },
      {
        "vocabId": 1047,
        "hanzi": "照相",
        "pinyin": "zhàoxiàng",
        "meaningHanViet": "Chiếu Tương",
        "meaningVi": "Chụp ảnh, chụp hình",
        "exampleSentence": "来到雄伟壮丽的长城烽火台前，游客们纷纷拿出手机照相留念。",
        "exampleTranslation": "Đến trước đài phong hỏa Vạn Lý Trường Thành hùng vĩ tráng lệ, du khách rủ nhau lấy điện thoại ra chụp ảnh kỷ niệm."
      },
      {
        "vocabId": 1048,
        "hanzi": "直到",
        "pinyin": "zhídào",
        "meaningHanViet": "Trực Đáo",
        "meaningVi": "Cho đến, mãi đến tận",
        "exampleSentence": "大家在图书馆自习室里全神贯注地复习，直到深夜闭馆才依依不舍离开。",
        "exampleTranslation": "Mọi người chăm chú ôn tập trong phòng tự học thư viện, mãi đến khi thư viện đóng cửa lúc đêm muộn mới lưu luyến ra về."
      },
      {
        "vocabId": 1049,
        "hanzi": "只",
        "pinyin": "zhǐ",
        "meaningHanViet": "Chỉ",
        "meaningVi": "Chỉ, chỉ có (phó từ)",
        "exampleSentence": "虽然路途遥远坎坷，但只要心中有梦，我们就只管风雨兼程。",
        "exampleTranslation": "Tuy đường sá xa xôi gập ghềnh nhưng chỉ cần trong lòng có ước mơ, chúng ta chỉ việc vững bước dãi gió dầm mưa."
      },
      {
        "vocabId": 1050,
        "hanzi": "纸",
        "pinyin": "zhǐ",
        "meaningHanViet": "Chỉ",
        "meaningVi": "Tờ giấy, giấy tờ",
        "exampleSentence": "请大家在分发下来的空白答题纸上规范端正地写下答案。",
        "exampleTranslation": "Xin mọi người hãy viết câu trả lời ngay ngắn chuẩn mực lên tờ giấy làm bài thi trắng được phát."
      },
      {
        "vocabId": 1051,
        "hanzi": "只能",
        "pinyin": "zhǐ néng",
        "meaningHanViet": "Chỉ Năng",
        "meaningVi": "Chỉ có thể, đành phải",
        "exampleSentence": "因为突降大暴雨航班被迫取消，我们只能改乘次日早晨的高铁。",
        "exampleTranslation": "Do mưa dông bất ngờ chuyến bay bị buộc hủy bỏ, chúng tôi đành phải đổi sang đi tàu cao tốc sáng hôm sau."
      },
      {
        "vocabId": 1052,
        "hanzi": "只是",
        "pinyin": "zhǐshì",
        "meaningHanViet": "Chỉ Thị",
        "meaningVi": "Chỉ là, chẳng qua là",
        "exampleSentence": "他平时性格内向不善言辞，并不是骄傲自满，只是有些腼腆害羞。",
        "exampleTranslation": "Anh ấy thường ngày tính tình hướng nội ít nói, không phải là kiêu ngạo tự mãn mà chỉ là có phần e thẹn ngượng ngùng."
      },
      {
        "vocabId": 1053,
        "hanzi": "只要",
        "pinyin": "zhǐyào",
        "meaningHanViet": "Chỉ Yếu",
        "meaningVi": "Chỉ cần (liên từ điều kiện)",
        "exampleSentence": "世上无难事，只要肯登攀，任何艰难险阻都终将被勇敢者踩在脚下。",
        "exampleTranslation": "Trên đời không việc gì khó chỉ cần chịu khó trèo lên, bất kỳ chông gai hiểm trở nào rốt cuộc cũng bị người dũng cảm giẫm dưới chân."
      },
      {
        "vocabId": 1054,
        "hanzi": "只有",
        "pinyin": "zhǐyǒu",
        "meaningHanViet": "Chỉ Hữu",
        "meaningVi": "Chỉ có... mới... (liên từ duy nhất)",
        "exampleSentence": "只有脚踏实地持之以恒地刻苦努力，才能最终攀登科学事业的高峰。",
        "exampleTranslation": "Chỉ có vững bước kiên trì nỗ lực hết mình mới có thể leo lên đến đỉnh cao của sự nghiệp khoa học."
      }
    ]
  },
  {
    "topicId": 325,
    "title": "Bài 25 — Trọng tâm, Cuộc sống & Bài tập về nhà",
    "description": "Nhiệm vụ trọng tâm, hoàn thành bài tập, đón khách quý và đúc kết.",
    "vocabularies": [
      {
        "vocabId": 476,
        "hanzi": "中",
        "pinyin": "zhōng",
        "meaningHanViet": "Trung",
        "meaningVi": "Trong; giữa; trúng",
        "exampleSentence": "汉语在国际交流中越来越重要。",
        "exampleTranslation": "Tiếng Trung ngày càng quan trọng trong giao lưu quốc tế."
      },
      {
        "vocabId": 478,
        "hanzi": "中间",
        "pinyin": "zhōngjiān",
        "meaningHanViet": "Trung Gian",
        "meaningVi": "Ở giữa; bên trong; ở giữa; trong; giữa; trong số",
        "exampleSentence": "他在人群中间向我们招手。",
        "exampleTranslation": "Anh ấy ở giữa đám đông vẫy tay chào chúng tôi."
      },
      {
        "vocabId": 1055,
        "hanzi": "终于",
        "pinyin": "zhōngyú",
        "meaningHanViet": "Chung Vu",
        "meaningVi": "Cuối cùng, rốt cuộc",
        "exampleSentence": "经过无数次推倒重来的艰辛探索，科研团队终于攻克了这项技术难题。",
        "exampleTranslation": "Trải qua vô số lần tìm tòi gian khổ làm đi làm lại, nhóm nghiên cứu khoa học cuối cùng đã khắc phục được cửa ải công nghệ khó khăn này."
      },
      {
        "vocabId": 1056,
        "hanzi": "种",
        "pinyin": "zhǒng",
        "meaningHanViet": "Chủng",
        "meaningVi": "Loài, loại, giống (lượng từ)",
        "exampleSentence": "植物园里温室精心培育着数百种形态各异的珍稀热带植物。",
        "exampleTranslation": "Trong nhà kính vườn thực vật chăm bẵm tỉ mỉ hàng trăm loài thực vật nhiệt đới quý hiếm hình thái muôn vẻ."
      },
      {
        "vocabId": 484,
        "hanzi": "重要",
        "pinyin": "zhòngyào",
        "meaningHanViet": "Trọng Yếu",
        "meaningVi": "Quan trọng; đáng kể; chính yếu",
        "exampleSentence": "身体健康比什么都重要。",
        "exampleTranslation": "Sức khỏe tốt quan trọng hơn bất cứ thứ gì."
      },
      {
        "vocabId": 1057,
        "hanzi": "周末",
        "pinyin": "zhōumò",
        "meaningHanViet": "Chu Mạt",
        "meaningVi": "Cuối tuần",
        "exampleSentence": "周末闲暇时我喜欢约上两三好友一起去郊外露营亲近大自然。",
        "exampleTranslation": "Dịp rảnh rỗi cuối tuần tôi thích rủ hai ba người bạn thân cùng nhau đi cắm trại ngoại ô hòa mình với thiên nhiên."
      },
      {
        "vocabId": 1058,
        "hanzi": "主要",
        "pinyin": "zhǔyào",
        "meaningHanViet": "Chủ Yếu",
        "meaningVi": "Chủ yếu, trọng yếu",
        "exampleSentence": "这篇学术论文的主要学术贡献在于提出了全新的数据分析计算模型。",
        "exampleTranslation": "Đóng góp học thuật chủ yếu của luận văn này nằm ở việc đề xuất một mô hình tính toán phân tích dữ liệu hoàn toàn mới."
      },
      {
        "vocabId": 1059,
        "hanzi": "注意",
        "pinyin": "zhùyì",
        "meaningHanViet": "Chú Ý",
        "meaningVi": "Chú ý, cẩn thận",
        "exampleSentence": "在实验室进行化学实验操作时，请大家严格注意人身防范安全。",
        "exampleTranslation": "Khi thực hiện thao tác thí nghiệm hóa học trong phòng thí nghiệm, xin mọi người nghiêm ngặt chú ý an toàn phòng hộ bản thân."
      },
      {
        "vocabId": 1060,
        "hanzi": "住院",
        "pinyin": "zhùyuàn",
        "meaningHanViet": "Trú Viện",
        "meaningVi": "Nằm viện, nhập viện",
        "exampleSentence": "爷爷因突发急性胃肠炎在医院住院观察治疗了一个星期。",
        "exampleTranslation": "Ông nội vì viêm dạ dày ruột cấp tính đột phát đã nằm viện theo dõi điều trị một tuần lễ."
      },
      {
        "vocabId": 1061,
        "hanzi": "字典",
        "pinyin": "zìdiǎn",
        "meaningHanViet": "Tự Điển",
        "meaningVi": "Từ điển (chữ Hán)",
        "exampleSentence": "遇到笔画复杂生僻的罕见汉字，查阅新华字典是最权威的选择。",
        "exampleTranslation": "Khi gặp chữ Hán hiếm nét bút phức tạp, tra cứu Tân Hoa Tự Điển là sự lựa chọn uy tín nhất."
      },
      {
        "vocabId": 1062,
        "hanzi": "自行车",
        "pinyin": "zìxíngchē",
        "meaningHanViet": "Tự Hành Xa",
        "meaningVi": "Xe đạp",
        "exampleSentence": "早晨骑自行车穿行在绿意盎然的校园林荫道上格外惬意清爽。",
        "exampleTranslation": "Buổi sáng đạp xe đạp qua lại trên con đường rợp bóng cây xanh mướt của khuôn viên trường thật là thư thái thanh lành."
      },
      {
        "vocabId": 489,
        "hanzi": "子",
        "pinyin": "zi",
        "meaningHanViet": "Tử",
        "meaningVi": "Hậu tố danh từ; con, đứa trẻ",
        "exampleSentence": "桌子上摆放着几个精致的杯子。",
        "exampleTranslation": "Trên bàn đặt mấy chiếc cốc tinh xảo."
      },
      {
        "vocabId": 1063,
        "hanzi": "总",
        "pinyin": "zǒng",
        "meaningHanViet": "Tổng",
        "meaningVi": "Tổng, luôn luôn, tóm lại",
        "exampleSentence": "他在日常团队合作中总是任劳任怨，深受领导和同事们的信任。",
        "exampleTranslation": "Trong công việc hợp tác nhóm thường ngày anh ấy luôn không nề hà khó nhọc, được lãnh đạo và đồng nghiệp vô cùng tín nhiệm."
      },
      {
        "vocabId": 1064,
        "hanzi": "总是",
        "pinyin": "zǒngshì",
        "meaningHanViet": "Tổng Thị",
        "meaningVi": "Luôn luôn, lúc nào cũng",
        "exampleSentence": "妈妈总是无微不至地关心着在外地求学的儿女的健康与饮食。",
        "exampleTranslation": "Mẹ lúc nào cũng ân cần chu đáo quan tâm đến sức khỏe và bữa ăn của con cái đang học tập nơi phương xa."
      },
      {
        "vocabId": 1065,
        "hanzi": "嘴",
        "pinyin": "zuǐ",
        "meaningHanViet": "Chuỷ",
        "meaningVi": "Miệng, mồm",
        "exampleSentence": "感冒发烧咳嗽的时候要多补充温水，保持嘴唇与咽喉部湿润。",
        "exampleTranslation": "Khi bị cảm cúm sốt ho cần uống bổ sung nhiều nước ấm để giữ cho môi và cổ họng luôn ẩm mượt."
      },
      {
        "vocabId": 493,
        "hanzi": "最好",
        "pinyin": "zuìhǎo",
        "meaningHanViet": "Tối Hảo",
        "meaningVi": "Tốt nhất; nên ...; tốt hơn hết nên ...",
        "exampleSentence": "身体不舒服时最好去医院看医生。",
        "exampleTranslation": "Khi cơ thể không khỏe tốt nhất nên đến bệnh viện khám bác sĩ."
      },
      {
        "vocabId": 494,
        "hanzi": "最后",
        "pinyin": "zuìhòu",
        "meaningHanViet": "Tối Hậu",
        "meaningVi": "Cuối cùng; sau cùng",
        "exampleSentence": "经过大家努力，我们最后取得了胜利。",
        "exampleTranslation": "Qua sự nỗ lực của mọi người, cuối cùng chúng tôi đã giành thắng lợi."
      },
      {
        "vocabId": 1066,
        "hanzi": "最近",
        "pinyin": "zuìjìn",
        "meaningHanViet": "Tối Cận",
        "meaningVi": "Gần đây, dạo này",
        "exampleSentence": "最近天气气温变化剧烈无常，出门时请大家随时注意添衣保暖。",
        "exampleTranslation": "Thời tiết dạo này nhiệt độ thay đổi thất thường dữ dội, khi ra ngoài xin mọi người chú ý mặc thêm áo ấm."
      },
      {
        "vocabId": 1067,
        "hanzi": "做客",
        "pinyin": "zuòkè",
        "meaningHanViet": "Tố Khách",
        "meaningVi": "Làm khách, đến chơi nhà",
        "exampleSentence": "周末王老师热情邀请我们几位外国留学生去他家里做客品尝家常菜。",
        "exampleTranslation": "Cuối tuần thầy Vương nhiệt tình mời mấy bạn lưu học sinh nước ngoài chúng tôi đến nhà chơi làm khách nếm món ăn gia đình."
      },
      {
        "vocabId": 1068,
        "hanzi": "作业",
        "pinyin": "zuòyè",
        "meaningHanViet": "Tác Nghiệp",
        "meaningVi": "Bài tập, bài làm về nhà",
        "exampleSentence": "每天放学回到家后，他总是自觉认真地先独立完成各科家庭作业。",
        "exampleTranslation": "Mỗi ngày tan trường về đến nhà, cậu ấy luôn tự giác chăm chỉ hoàn thành độc lập bài tập về nhà các môn trước."
      }
    ]
  }
];

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
 * Supports: Digit1..Digit4, Numpad1..Numpad4, e.key '1'..'4'.
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
 * @returns {{ itemType: string, itemId: number, rating: number, reviewTimeSeconds: number, cardType?: string }}
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

/**
 * Updates URL search query parameters without reloading the page.
 * @param {Object} params
 * @param {boolean} [replace=false]
 */
export function updateReviewUrl(params = {}, replace = false) {
  if (typeof window === 'undefined' || !window.location) return;
  const url = new URL(window.location.href);

  // Clear specific params first
  ['mode', 'group', 'lessonId', 'radicalId', 'vocabId', 'action'].forEach(p => url.searchParams.delete(p));

  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== '') {
      url.searchParams.set(k, String(v));
    }
  }

  const newUrl = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '');
  if (replace) {
    window.history.replaceState({}, '', newUrl);
  } else {
    window.history.pushState({}, '', newUrl);
  }
}

/**
 * Unified Interactive SRS Review Session Controller
 */
export class SrsReviewController {
  constructor() {
    // Mode: 'flashcard' or 'writing'
    this.activeMode = 'flashcard';

    // Content Group: 'radicals50' | 'radicals214' | 'hsk1' | 'hsk2' | 'hsk3'
    this.activeGroup = 'radicals50';

    // Session Route Action: 'continue' | 'review' | null (null = catalog browser)
    this.activeAction = null;
    this.lessonId = null;
    this.radicalId = null;
    this.vocabId = null;

    // Writing outline toggle state
    this.isWritingOutlineShown = false;
    this.hasCompletedWritingForCurrentCard = false;
    this.isCurrentWritingCompleted = false;
    this.completedCharIndices = new Set();
    this.writingCharCount = 0;
    this.totalRequiredCharCount = 0;
    this.isSubmittingWriting = false;

    // Dedicated Listening Room state
    this.listeningIme = null;
    this.hasCompletedListeningForCurrentCard = false;
    this.isSubmittingListening = false;

    // Dedicated Reading Room state
    this.readingRecorder = null;
    this.readingStream = null;
    this.readingAudioChunks = [];
    this.readingRecordTimer = null;
    this.readingAutoStopTimeout = null;
    this.currentUserAudioBlob = null;
    this.currentUserAudioUrl = null;
    this.currentUserAudioElement = null;
    this.hasCompletedReadingForCurrentCard = false;
    this.isSubmittingReading = false;
    this.currentReadingScore = null;

    // Backward compatibility fields
    this.mode = 'DUE_CARDS';
    this.activeSkill = 'READING';
    this.writingOrchestrator = null;

    // Session Execution State
    this.sessionQueue = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.isSubmitting = false;
    this.isReviewMode = false; // When true: zero SRS mutation, does not overwrite "Học tiếp" progress

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

    // Chapter Session Context
    this.currentChapterTitle = '';
    this.currentChapterIdx = null;


    this.dueItemsCache = { vocab: [], radicals: [] };

    // Cached catalog data
    this.fullRadicalsCatalog = [];
    this.commonRadicals = [];
    this.remainingRadicals = [];
    this.activeStrokeFilter = 'all';
    this.searchQuery = '';

    // Active Writing Engines (for multi-character writing)
    this.writingEngines = [];

    // Cache for detail audio URLs & Personal Notes
    this.audioCache = new Map();
    this.notesCache = new Map();
    this.vocabDetailCache = new Map();
    this.isEditingInlineNote = false;
    this.editingCard = null;
    this.editingNote = null;
    this.currentCardNote = null;

    // Bound Event Handlers
    this.onKeydown = this.handleKeydown.bind(this);
    this.onPopState = this.handlePopState.bind(this);
    this.onUnload = this.cleanupTimer.bind(this);
  }

  /**
   * Initializes the review session controller.
   */
  async init() {
    initNavbarAuth();

    // Cache DOM Elements
    this.dom = {
      // Top Level States
      headerContent: document.getElementById('srsHeaderContent'),
      catalogSelection: document.getElementById('srsCatalogSelection'),
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
      btnCompletionBackToCatalog: document.getElementById('btnCompletionBackToCatalog'),

      // Top Toolbar: 4 Modes
      tabReading: document.getElementById('srsSkillTabReading'),
      tabWriting: document.getElementById('srsSkillTabWriting'),
      tabListening: document.getElementById('srsSkillTabListening'),
      tabRecognizing: document.getElementById('srsSkillTabRecognizing'),

      // Content Groups Toolbar
      groupTabsToolbar: document.getElementById('srsGroupTabsToolbar'),
      groupTabRadicals50: document.getElementById('groupTabRadicals50'),
      groupTabRadicals214: document.getElementById('groupTabRadicals214'),
      groupTabHsk1: document.getElementById('groupTabHsk1'),
      groupTabHsk2: document.getElementById('groupTabHsk2'),
      groupTabHsk3: document.getElementById('groupTabHsk3'),

      // Catalog view
      catalogGroupTitle: document.getElementById('catalogGroupTitle'),
      catalogGroupSubtitle: document.getElementById('catalogGroupSubtitle'),
      btnGroupContinue: document.getElementById('btnGroupContinue'),
      btnGroupReview: document.getElementById('btnGroupReview'),
      catalogFilterToolbar: document.getElementById('catalogFilterToolbar'),
      catalogSearchInput: document.getElementById('catalogSearchInput'),
      strokeFilterButtons: document.getElementById('strokeFilterButtons'),
      catalogContentContainer: document.getElementById('catalogContentContainer'),

      // Session Header
      sessionTitleText: document.getElementById('srsSessionTitleText'),
      btnBackToSelection: document.getElementById('btnBackToSelection'),
      modeBadge: document.getElementById('srsSessionModeBadge'),
      progressText: document.getElementById('srsProgressText'),
      progressBarContainer: document.getElementById('srsProgressBarContainer'),
      progressBarFill: document.getElementById('srsProgressBarFill'),
      timerBadge: document.getElementById('reactionTimerBadge'),
      quickSkillFlashcard: document.getElementById('quickSkillFlashcard'),
      quickSkillWriting: document.getElementById('quickSkillWriting'),
      quickSkillListening: document.getElementById('quickSkillListening'),
      quickSkillReading: document.getElementById('quickSkillReading'),

      // Flashcard Scene
      flashcardContainer: document.getElementById('srsFlashcardContainer'),
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
      cardBackStrokeCount: document.getElementById('cardBackStrokeCount'),
      radicalStrokeCountVal: document.getElementById('radicalStrokeCountVal'),
      btnCardNote: document.getElementById('btnCardNote'),
      cardBackHanzi: document.getElementById('cardBackHanzi'),
      cardBackPinyin: document.getElementById('cardBackPinyin'),
      btnAudioPronounceBack: document.getElementById('btnAudioPronounceBack'),
      cardBackMeaningHv: document.getElementById('cardBackMeaningHv'),
      cardBackMeaningVi: document.getElementById('cardBackMeaningVi'),
      cardBackRadicalsRow: document.getElementById('cardBackRadicalsRow'),
      cardBackRadicalsContent: document.getElementById('cardBackRadicalsContent'),
      cardBackExampleBox: document.getElementById('cardBackExampleBox'),
      cardBackExampleSentence: document.getElementById('cardBackExampleSentence'),
      cardBackExampleTranslation: document.getElementById('cardBackExampleTranslation'),
      cardBackNoteDivider: document.getElementById('cardBackNoteDivider'),
      cardBackNoteStandalone: document.getElementById('cardBackNoteStandalone'),
      cardInlineNoteContainer: document.getElementById('cardInlineNoteContainer'),
      cardInlineNoteDisplay: document.getElementById('cardInlineNoteDisplay'),
      cardInlineNoteText: document.getElementById('cardInlineNoteText'),
      cardInlineNoteEditWrapper: document.getElementById('cardInlineNoteEditWrapper'),
      cardInlineNoteInput: document.getElementById('cardInlineNoteInput'),
      cardInlineNoteCharCount: document.getElementById('cardInlineNoteCharCount'),
      cardInlineNoteStatus: document.getElementById('cardInlineNoteStatus'),
      btnSaveInlineNote: document.getElementById('btnSaveInlineNote'),

      // Card Back 2-Column Notes Layout
      cardBackNotesSection: document.getElementById('cardBackNotesSection'),
      cardNotesList: document.getElementById('cardNotesList'),
      cardNewNoteInput: document.getElementById('cardNewNoteInput'),
      btnAddCardNote: document.getElementById('btnAddCardNote'),

      // Flashcard Rating Bar
      ratingSection: document.getElementById('srsRatingSection'),
      ratingBar: document.getElementById('ratingControlsBar'),
      btnRatingAgain: document.getElementById('btnRatingAgain'),
      btnRatingHard: document.getElementById('btnRatingHard'),
      btnRatingGood: document.getElementById('btnRatingGood'),
      btnRatingEasy: document.getElementById('btnRatingEasy'),
      ratingFeedback: document.getElementById('ratingFeedback'),

      // Dedicated Writing Room
      writingRoom: document.getElementById('srsWritingRoom'),
      writingRoomBadge: document.getElementById('writingRoomBadge'),
      btnWritingAudio: document.getElementById('btnWritingAudio'),
      writingPromptPinyin: document.getElementById('writingPromptPinyin'),
      writingPromptHanViet: document.getElementById('writingPromptHanViet'),
      writingPromptMeaning: document.getElementById('writingPromptMeaning'),
      writingPromptStrokeCount: document.getElementById('writingPromptStrokeCount'),
      writingMissingWarning: document.getElementById('writingMissingWarning'),
      writingCanvasContainer: document.getElementById('srsWritingCanvasContainer'),
      writingCompletionNotice: document.getElementById('writingCompletionNotice'),
      writingToolsRow: document.getElementById('writingToolsRow'),
      writingNextContainer: document.getElementById('writingNextContainer'),
      btnWritingReplay: document.getElementById('btnWritingReplay'),
      btnWritingOutline: document.getElementById('btnWritingOutline'),
      btnWritingClear: document.getElementById('btnWritingClear'),
      btnWritingNext: document.getElementById('btnWritingNext'),

      // Dedicated Listening Room
      listeningRoom: document.getElementById('srsListeningRoom'),
      listeningRoomBadge: document.getElementById('listeningRoomBadge'),
      btnListeningPlayAudio: document.getElementById('btnListeningPlayAudio'),
      listeningAnswerInput: document.getElementById('listeningAnswerInput'),
      listeningCompletionNotice: document.getElementById('listeningCompletionNotice'),
      listeningErrorNotice: document.getElementById('listeningErrorNotice'),
      listeningImeContainer: document.getElementById('listeningImeContainer'),
      btnListeningCheck: document.getElementById('btnListeningCheck'),
      listeningNextContainer: document.getElementById('listeningNextContainer'),
      btnListeningNext: document.getElementById('btnListeningNext'),

      // Dedicated Reading Room
      readingRoom: document.getElementById('srsReadingRoom'),
      readingRoomBadge: document.getElementById('readingRoomBadge'),
      readingPrivacyNotice: document.getElementById('readingPrivacyNotice'),
      btnDismissPrivacyNotice: document.getElementById('btnDismissPrivacyNotice'),
      readingCardTypeBadge: document.getElementById('readingCardTypeBadge'),
      readingPromptHanzi: document.getElementById('readingPromptHanzi'),
      btnReadingSampleAudio: document.getElementById('btnReadingSampleAudio'),
      readingAnswerRevealArea: document.getElementById('readingAnswerRevealArea'),
      btnReadingTogglePinyin: document.getElementById('btnReadingTogglePinyin'),
      readingPinyinMeaningBox: document.getElementById('readingPinyinMeaningBox'),
      readingPromptPinyin: document.getElementById('readingPromptPinyin'),
      readingPromptHanViet: document.getElementById('readingPromptHanViet'),
      readingPromptMeaning: document.getElementById('readingPromptMeaning'),
      readingStateReady: document.getElementById('readingStateReady'),
      btnReadingStartRecord: document.getElementById('btnReadingStartRecord'),
      readingStateRecording: document.getElementById('readingStateRecording'),
      readingRecordDuration: document.getElementById('readingRecordDuration'),
      btnReadingStopRecord: document.getElementById('btnReadingStopRecord'),
      btnReadingCancelRecord: document.getElementById('btnReadingCancelRecord'),
      readingStateAnalyzing: document.getElementById('readingStateAnalyzing'),
      readingStateResult: document.getElementById('readingStateResult'),
      readingOverallScoreBadge: document.getElementById('readingOverallScoreBadge'),
      readingConfidenceBadge: document.getElementById('readingConfidenceBadge'),
      readingRecognizedText: document.getElementById('readingRecognizedText'),
      readingResultSummary: document.getElementById('readingResultSummary'),
      readingComponentsWrapper: document.getElementById('readingComponentsWrapper'),
      readingInitialsFeedback: document.getElementById('readingInitialsFeedback'),
      readingFinalsFeedback: document.getElementById('readingFinalsFeedback'),
      readingTonesFeedback: document.getElementById('readingTonesFeedback'),
      readingRetryAdvice: document.getElementById('readingRetryAdvice'),
      btnReadingPlayUserAudio: document.getElementById('btnReadingPlayUserAudio'),
      btnReadingPlaySampleAgain: document.getElementById('btnReadingPlaySampleAgain'),
      btnReadingRecordAgain: document.getElementById('btnReadingRecordAgain'),
      readingStateError: document.getElementById('readingStateError'),
      readingErrorTitle: document.getElementById('readingErrorTitle'),
      readingErrorMessage: document.getElementById('readingErrorMessage'),
      readingErrorAdvice: document.getElementById('readingErrorAdvice'),
      btnReadingTryAgain: document.getElementById('btnReadingTryAgain'),
      readingNextContainer: document.getElementById('readingNextContainer'),
      btnReadingNext: document.getElementById('btnReadingNext'),

      // Completion Stats
      statTotalReviewed: document.getElementById('statTotalReviewed'),
      statAgainCount: document.getElementById('statAgainCount'),
      statGoodEasyCount: document.getElementById('statGoodEasyCount'),
      statTotalTime: document.getElementById('statTotalTime')
    };

    this.bindEvents();
    this.parseQueryParams();
    this.syncToolbarUi();

    // Preload radicals data
    if (authManager.isAuthenticated()) {
      this.fetchRadicalsData().catch(() => {});
    }

    // Route dispatch based on URL parameters
    await this.dispatchCurrentRoute();
  }

  /**
   * Binds user event listeners across the interface.
   */
  bindEvents() {
    if (this.dom.btnRetry) {
      this.dom.btnRetry.addEventListener('click', () => this.dispatchCurrentRoute());
    }

    // Top mode switching
    if (this.dom.tabReading) {
      this.dom.tabReading.addEventListener('click', () => this.switchMode('flashcard'));
    }
    if (this.dom.tabWriting) {
      this.dom.tabWriting.addEventListener('click', () => this.switchMode('writing'));
    }
    if (this.dom.tabListening) {
      this.dom.tabListening.addEventListener('click', () => this.switchMode('listening'));
    }
    if (this.dom.tabRecognizing) {
      this.dom.tabRecognizing.addEventListener('click', () => this.switchMode('reading'));
    }

    // Quick Skill tabs inside active session
    if (this.dom.quickSkillFlashcard) {
      this.dom.quickSkillFlashcard.addEventListener('click', () => this.switchMode('flashcard'));
    }
    if (this.dom.quickSkillWriting) {
      this.dom.quickSkillWriting.addEventListener('click', () => this.switchMode('writing'));
    }
    if (this.dom.quickSkillListening) {
      this.dom.quickSkillListening.addEventListener('click', () => this.switchMode('listening'));
    }
    if (this.dom.quickSkillReading) {
      this.dom.quickSkillReading.addEventListener('click', () => this.switchMode('reading'));
    }

    // Group tabs
    const groupTabs = [
      { el: this.dom.groupTabRadicals50, group: 'radicals50' },
      { el: this.dom.groupTabRadicals214, group: 'radicals214' },
      { el: this.dom.groupTabHsk1, group: 'hsk1' },
      { el: this.dom.groupTabHsk2, group: 'hsk2' },
      { el: this.dom.groupTabHsk3, group: 'hsk3' }
    ];
    for (const { el, group } of groupTabs) {
      if (el) {
        el.addEventListener('click', () => this.switchGroup(group));
      }
    }

    // Global Group actions (Học tiếp / Học lại)
    if (this.dom.btnGroupContinue) {
      this.dom.btnGroupContinue.addEventListener('click', () => this.startGroupSession('continue'));
    }
    if (this.dom.btnGroupReview) {
      this.dom.btnGroupReview.addEventListener('click', () => this.startGroupSession('review'));
    }

    // 214 filter controls
    if (this.dom.catalogSearchInput) {
      this.dom.catalogSearchInput.addEventListener('input', (e) => {
        this.searchQuery = (e.target.value || '').trim();
        if (this.activeGroup === 'radicals214') {
          this.renderRadicals214();
        }
      });
    }

    if (this.dom.strokeFilterButtons) {
      this.dom.strokeFilterButtons.addEventListener('click', (e) => {
        const btn = e.target.closest('.stroke-filter-btn');
        if (!btn) return;
        const strokeVal = btn.dataset.stroke || 'all';
        this.activeStrokeFilter = strokeVal;
        this.dom.strokeFilterButtons.querySelectorAll('.stroke-filter-btn').forEach(b => {
          if (b.dataset.stroke === strokeVal) {
            b.className = 'btn btn-sm py-1 px-2 btn-chinese-primary stroke-filter-btn';
          } else {
            b.className = 'btn btn-sm py-1 px-2 btn-outline-secondary stroke-filter-btn';
          }
        });
        if (this.activeGroup === 'radicals214') {
          this.renderRadicals214();
        }
      });
    }

    // Back to Selection Button
    if (this.dom.btnBackToSelection) {
      this.dom.btnBackToSelection.addEventListener('click', () => this.backToSelection());
    }
    if (this.dom.btnCompletionBackToCatalog) {
      this.dom.btnCompletionBackToCatalog.addEventListener('click', () => this.backToSelection());
    }

    // Flashcard Flip
    if (this.dom.flashcard) {
      this.dom.flashcard.addEventListener('click', (e) => {
        if (e.target.closest('button, a')) return;
        if (e.target.closest('input, textarea, select, label, .card-back-notes-layout, .card-inline-note-container')) return;
        this.toggleFlip();
      });
    }

    // Speech Audio Buttons
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

    // Compact Single Inline Note Listeners
    if (this.dom.cardInlineNoteDisplay) {
      this.dom.cardInlineNoteDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.enterInlineNoteEdit();
      });
      this.dom.cardInlineNoteDisplay.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          e.preventDefault();
          this.enterInlineNoteEdit();
        }
      });
    }

    if (this.dom.cardInlineNoteEditWrapper) {
      this.dom.cardInlineNoteEditWrapper.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    if (this.dom.cardInlineNoteInput) {
      this.dom.cardInlineNoteInput.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      this.dom.cardInlineNoteInput.addEventListener('input', () => {
        const val = this.dom.cardInlineNoteInput.value || '';
        this.updateInlineNoteCharCount(val.length);
      });

      this.dom.cardInlineNoteInput.addEventListener('keydown', async (e) => {
        e.stopPropagation(); // Strictly prevent card flip (Space) & rating (1..4)
        if (e.key === 'Enter') {
          if (e.isComposing || e.keyCode === 229) return;
          e.preventDefault();
          await this.exitInlineNoteEdit(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          await this.exitInlineNoteEdit(false);
        }
      });

      this.dom.cardInlineNoteInput.addEventListener('blur', async () => {
        // Small delay to allow btnSaveInlineNote tap/click to be handled gracefully
        setTimeout(async () => {
          if (this.isEditingInlineNote) {
            await this.exitInlineNoteEdit(true);
          }
        }, 120);
      });
    }

    // Explicit checkmark save button (Mobile & Desktop UX) at end of input bar
    if (this.dom.btnSaveInlineNote) {
      this.dom.btnSaveInlineNote.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      this.dom.btnSaveInlineNote.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.isEditingInlineNote) {
          this.exitInlineNoteEdit(true);
        }
      }, { passive: false });
      this.dom.btnSaveInlineNote.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.isEditingInlineNote) {
          await this.exitInlineNoteEdit(true);
        }
      });
    }

    // Add Note button on Back of Card
    if (this.dom.btnAddCardNote) {
      this.dom.btnAddCardNote.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        await this.saveCardNote();
      });
    }

    // Legacy note button fallback
    if (this.dom.btnCardNote) {
      this.dom.btnCardNote.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openNoteForCurrentCard();
      });
    }

    // Rating buttons
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

    // Writing Controls
    if (this.dom.btnWritingAudio) {
      this.dom.btnWritingAudio.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playPronunciation(this.dom.btnWritingAudio);
      });
    }
    if (this.dom.btnWritingReplay) {
      this.dom.btnWritingReplay.addEventListener('click', () => this.replayWriting());
    }
    if (this.dom.btnWritingOutline) {
      this.dom.btnWritingOutline.addEventListener('click', () => this.toggleWritingOutline());
    }
    if (this.dom.btnWritingClear) {
      this.dom.btnWritingClear.addEventListener('click', () => this.clearWriting());
    }
    if (this.dom.btnWritingNext) {
      this.dom.btnWritingNext.addEventListener('click', () => {
        if (this.hasCompletedWritingForCurrentCard !== false) {
          this.nextWritingItem();
        }
      });
    }

    // Dedicated Listening Room Controls
    if (this.dom.btnListeningPlayAudio) {
      this.dom.btnListeningPlayAudio.addEventListener('click', (e) => {
        e.stopPropagation();
        speechController.cancel();
        if (this.dom.btnListeningPlayAudio) {
          this.dom.btnListeningPlayAudio.disabled = false;
          this.dom.btnListeningPlayAudio.removeAttribute('aria-busy');
          this.dom.btnListeningPlayAudio.classList.remove('is-speaking');
        }
        this.playPronunciation(this.dom.btnListeningPlayAudio);
      });
    }
    if (this.dom.btnListeningCheck) {
      this.dom.btnListeningCheck.addEventListener('click', () => {
        this.checkListeningAnswer();
      });
    }
    if (this.dom.btnListeningNext) {
      this.dom.btnListeningNext.addEventListener('click', () => {
        if (this.hasCompletedListeningForCurrentCard !== false) {
          this.nextListeningItem();
        }
      });
    }
    if (this.dom.listeningAnswerInput) {
      this.dom.listeningAnswerInput.addEventListener('input', () => {
        if (this.dom.listeningErrorNotice) {
          this.dom.listeningErrorNotice.classList.add('d-none');
        }
        if (this.dom.listeningAnswerInput) {
          this.dom.listeningAnswerInput.classList.remove('is-invalid');
        }
      });
    }

    // Dedicated Reading Room Controls
    if (this.dom.btnDismissPrivacyNotice) {
      this.dom.btnDismissPrivacyNotice.addEventListener('click', () => {
        if (this.dom.readingPrivacyNotice) {
          this.dom.readingPrivacyNotice.classList.add('d-none');
        }
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('srs_reading_privacy_dismissed', '1');
          }
        } catch (e) {}
      });
    }

    if (this.dom.btnReadingSampleAudio) {
      this.dom.btnReadingSampleAudio.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playPronunciation(this.dom.btnReadingSampleAudio);
      });
    }

    if (this.dom.btnReadingPlaySampleAgain) {
      this.dom.btnReadingPlaySampleAgain.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playPronunciation(this.dom.btnReadingPlaySampleAgain);
      });
    }

    if (this.dom.btnReadingTogglePinyin) {
      this.dom.btnReadingTogglePinyin.addEventListener('click', () => {
        if (this.dom.readingPinyinMeaningBox) {
          const isHidden = this.dom.readingPinyinMeaningBox.classList.contains('d-none');
          this.dom.readingPinyinMeaningBox.classList.toggle('d-none', !isHidden);
          this.dom.btnReadingTogglePinyin.textContent = isHidden
            ? '🙈 Ẩn phiên âm & nghĩa'
            : '👁️ Xem trước phiên âm & nghĩa';
        }
      });
    }

    if (this.dom.btnReadingStartRecord) {
      this.dom.btnReadingStartRecord.addEventListener('click', () => {
        this.startReadingRecording();
      });
    }

    if (this.dom.btnReadingStopRecord) {
      this.dom.btnReadingStopRecord.addEventListener('click', () => {
        this.stopReadingRecording();
      });
    }

    if (this.dom.btnReadingCancelRecord) {
      this.dom.btnReadingCancelRecord.addEventListener('click', () => {
        this.cancelReadingRecording();
      });
    }

    if (this.dom.btnReadingPlayUserAudio) {
      this.dom.btnReadingPlayUserAudio.addEventListener('click', () => {
        if (this.currentUserAudioUrl) {
          if (!this.currentUserAudioElement) {
            this.currentUserAudioElement = new Audio(this.currentUserAudioUrl);
          } else {
            this.currentUserAudioElement.src = this.currentUserAudioUrl;
          }
          this.currentUserAudioElement.play().catch(e => console.warn('Play user audio error:', e));
        }
      });
    }

    if (this.dom.btnReadingRecordAgain) {
      this.dom.btnReadingRecordAgain.addEventListener('click', () => {
        this.cleanUpReadingMedia();
        this.setReadingState('ready');
      });
    }

    if (this.dom.btnReadingTryAgain) {
      this.dom.btnReadingTryAgain.addEventListener('click', () => {
        this.cleanUpReadingMedia();
        this.setReadingState('ready');
      });
    }

    if (this.dom.btnReadingNext) {
      this.dom.btnReadingNext.addEventListener('click', () => {
        if (this.hasCompletedReadingForCurrentCard !== false) {
          this.nextReadingItem();
        }
      });
    }

    // Global Keydown & Lifecycle
    window.addEventListener('keydown', this.onKeydown);
    window.addEventListener('popstate', this.onPopState);
    window.addEventListener('beforeunload', this.onUnload);
  }

  /**
   * Parses URL search parameters.
   */
  parseQueryParams() {
    if (typeof window === 'undefined' || !window.location) return;
    const urlParams = new URLSearchParams(window.location.search);

    const rawMode = (urlParams.get('mode') || '').toLowerCase();
    if (rawMode === 'writing') {
      this.activeMode = 'writing';
    } else if (rawMode === 'listening') {
      this.activeMode = 'listening';
    } else if (rawMode === 'reading') {
      this.activeMode = 'reading';
    } else {
      this.activeMode = 'flashcard';
    }

    const rawGroup = (urlParams.get('group') || '').toLowerCase();
    if (['radicals50', 'radicals214', 'hsk1', 'hsk2', 'hsk3'].includes(rawGroup)) {
      this.activeGroup = rawGroup;
    } else {
      this.activeGroup = 'radicals50';
    }

    const rawAction = (urlParams.get('action') || '').toLowerCase();
    this.activeAction = (rawAction === 'continue' || rawAction === 'review' || rawAction === 'start')
      ? (rawAction === 'start' ? 'continue' : rawAction)
      : null;

    const rawLessonId = urlParams.get('lessonId');
    if (rawLessonId && /^\d+$/.test(rawLessonId.trim()) && Number(rawLessonId.trim()) > 0) {
      this.lessonId = Number(rawLessonId.trim());
    } else {
      this.lessonId = null;
    }

    const rawRadicalId = urlParams.get('radicalId');
    if (rawRadicalId && /^\d+$/.test(rawRadicalId.trim()) && Number(rawRadicalId.trim()) > 0) {
      this.radicalId = Number(rawRadicalId.trim());
    } else {
      this.radicalId = null;
    }

    const rawVocabId = urlParams.get('vocabId');
    if (rawVocabId && /^\d+$/.test(rawVocabId.trim()) && Number(rawVocabId.trim()) > 0) {
      this.vocabId = Number(rawVocabId.trim());
    } else {
      this.vocabId = null;
    }

    // Backward compatibility for legacy tests (?mode=practice, ?mode=new, ?cardType=WRITING)
    const rawSkill = (urlParams.get('skill') || urlParams.get('cardType') || '').toUpperCase();
    if (rawSkill === 'WRITING') {
      this.activeMode = 'writing';
    } else if (rawSkill === 'LISTENING') {
      this.activeMode = 'listening';
    } else if (rawSkill === 'READING') {
      this.activeMode = 'reading';
    }
    if (rawMode === 'practice') {
      this.mode = 'LESSON_PRACTICE';
      this.activeAction = 'review';
      this.isReviewMode = true;
    } else if (rawMode === 'new') {
      this.mode = 'LESSON_NEW_CARDS';
      this.activeAction = 'continue';
    } else if (this.lessonId && !urlParams.get('group')) {
      this.mode = 'DUE_CARDS';
    }

    this.syncToolbarUi();
  }

  /**
   * Handles browser back/forward navigation.
   */
  async handlePopState() {
    this.parseQueryParams();
    await this.dispatchCurrentRoute();
  }

  /**
   * Synchronizes visual active states of top toolbars.
   */
  syncToolbarUi() {
    if (!this.dom) return;

    // Mode tabs (Segmented buttons)
    const modeTabs = [
      { el: this.dom.tabReading, mode: 'flashcard' },
      { el: this.dom.tabWriting, mode: 'writing' },
      { el: this.dom.tabListening, mode: 'listening' },
      { el: this.dom.tabRecognizing, mode: 'reading' }
    ];
    for (const { el, mode } of modeTabs) {
      if (el) {
        const isSel = this.activeMode === mode;
        el.classList.toggle('active', isSel);
        el.setAttribute('aria-selected', isSel ? 'true' : 'false');
      }
    }

    // Quick Switch Mode Toolbar (in active session)
    const quickTabs = [
      { el: this.dom.quickSkillFlashcard, mode: 'flashcard' },
      { el: this.dom.quickSkillWriting, mode: 'writing' },
      { el: this.dom.quickSkillListening, mode: 'listening' },
      { el: this.dom.quickSkillReading, mode: 'reading' }
    ];
    for (const { el, mode } of quickTabs) {
      if (el) {
        el.classList.toggle('active', this.activeMode === mode);
      }
    }

    // Group tabs
    const groupTabs = [
      { el: this.dom.groupTabRadicals50, group: 'radicals50' },
      { el: this.dom.groupTabRadicals214, group: 'radicals214' },
      { el: this.dom.groupTabHsk1, group: 'hsk1' },
      { el: this.dom.groupTabHsk2, group: 'hsk2' },
      { el: this.dom.groupTabHsk3, group: 'hsk3' }
    ];
    for (const { el, group } of groupTabs) {
      if (el) {
        const isSel = this.activeGroup === group;
        el.classList.toggle('active', isSel);
        el.setAttribute('aria-selected', isSel ? 'true' : 'false');
      }
    }
    this.updateCurriculaShelfMetrics();
  }

  /**
   * Switches learning mode ('flashcard' or 'writing').
   * @param {'flashcard'|'writing'} mode
   */
  switchMode(mode) {
    if (this.activeMode === mode) return;
    this.activeMode = mode;
    this.syncToolbarUi();
    updateReviewUrl({
      mode: this.activeMode,
      group: this.activeGroup,
      lessonId: this.lessonId,
      radicalId: this.radicalId,
      vocabId: this.vocabId,
      action: this.activeAction
    });

    if (this.sessionQueue && this.sessionQueue.length > 0 && !this.dom.activeSession?.classList.contains('d-none')) {
      // Re-render current item in new mode
      this.renderCurrentCard();
    } else {
      this.renderCatalog();
    }
  }

  /**
   * Switches content group ('radicals50', 'radicals214', 'hsk1', 'hsk2', 'hsk3').
   * @param {string} group
   */
  switchGroup(group) {
    if (this.activeGroup === group && !this.dom.catalogSelection?.classList.contains('d-none')) return;
    this.activeGroup = group;
    this.lessonId = null;
    this.radicalId = null;
    this.vocabId = null;
    this.activeAction = null;
    this.syncToolbarUi();
    updateReviewUrl({
      mode: this.activeMode,
      group: this.activeGroup
    });
    this.showCatalogSelection();
  }

  /**
   * Dispatches page view based on active parameters.
   */
  async dispatchCurrentRoute() {
    this.cleanupTimer();

    // Case 1: Active action in URL (action=continue|review, or lessonId/radicalId/vocabId)
    if (this.activeAction || this.lessonId || this.radicalId || this.vocabId) {
      await this.startRouteSession();
      return;
    }

    // Case 2: Backward compatibility for plain /srs-review.html with due cards
    const searchString = typeof window !== 'undefined' ? (window.location.search || '') : '';
    if (!searchString) {
      if (authManager.isAuthenticated()) {
        try {
          const cardTypeParam = this.activeMode === 'writing' ? 'WRITING' : (this.activeMode === 'listening' ? 'LISTENING' : 'READING');
          const dueCards = await apiClient('/srs/due', { params: { itemType: 'VOCABULARY', cardType: cardTypeParam } });
          if (Array.isArray(dueCards) && dueCards.length > 0) {
            this.mode = 'DUE_CARDS';
            this.initSessionQueue(dueCards, false);
            return;
          }
        } catch (e) {
          // If error or 401, proceed to catalog
          if (e.status === 401) {
            this.setViewState('auth');
            return;
          }
        }
      } else {
        this.setViewState('auth');
        return;
      }
    }

    // Default: Show catalog selection view
    if (authManager.isAuthenticated()) {
      await this.fetchDueCounts();
    }
    this.showCatalogSelection();
  }

  /**
   * Shows the catalog selection view and renders its items.
   */
  showCatalogSelection() {
    if (this.isEditingInlineNote) {
      this.exitInlineNoteEdit(false);
    }
    this.cleanupTimer();
    this.destroyWritingEngines();
    this.destroyListeningIme();
    this.cleanUpReadingMedia();
    this.sessionQueue = [];
    this.currentIndex = 0;
    this.currentChapterTitle = '';
    this.currentChapterIdx = null;


    this.setViewState('catalog');
    this.syncToolbarUi();
    this.updateCurriculaShelfMetrics();
    this.renderCatalog();
  }

  /**
   * Returns from active session to catalog selection.
   */
  backToSelection() {
    this.activeAction = null;
    this.lessonId = null;
    this.radicalId = null;
    this.vocabId = null;
    this.currentChapterTitle = '';
    this.currentChapterIdx = null;


    updateReviewUrl({
      mode: this.activeMode,
      group: this.activeGroup
    });
    this.showCatalogSelection();
  }

  /**
   * Renders the catalog content container for the active group.
   */
  renderCatalog() {
    const container = this.dom?.catalogContentContainer;
    if (!container) return;
    container.replaceChildren();

    // Group Titles
    const groupTitles = {
      radicals50: { title: '50 Bộ Thủ Thông Dụng', sub: 'Các bộ thủ xuất hiện với tần suất cao nhất trong chữ Hán hiện đại.' },
      radicals214: { title: '214 Bộ Thủ Khang Hy', sub: 'Hệ thống đầy đủ 214 bộ thủ Khang Hy tiêu chuẩn phân theo số nét.' },
      hsk1: { title: 'Từ Vựng HSK 1 (10 Chủ Đề)', sub: '200 từ vựng cốt lõi chuẩn HSK 1 chia theo 10 bài học thực tế.' },
      hsk2: { title: 'Từ Vựng HSK 2 (10 Chủ Đề)', sub: 'Hệ thống từ vựng sơ trung cấp HSK 2 chia theo 10 bài học.' },
      hsk3: { title: 'Từ Vựng HSK 3 (10 Chủ Đề)', sub: 'Hệ thống từ vựng trung cấp HSK 3 mở rộng 10 chủ đề nâng cao.' }
    };

    const info = groupTitles[this.activeGroup] || groupTitles.radicals50;
    if (this.dom.catalogGroupTitle) this.dom.catalogGroupTitle.textContent = info.title;
    if (this.dom.catalogGroupSubtitle) this.dom.catalogGroupSubtitle.textContent = info.sub;

    if (this.activeGroup === 'radicals50') {
      if (this.dom.catalogFilterToolbar) this.dom.catalogFilterToolbar.classList.add('d-none');
      this.renderRadicals50();
    } else if (this.activeGroup === 'radicals214') {
      if (this.dom.catalogFilterToolbar) this.dom.catalogFilterToolbar.classList.remove('d-none');
      this.renderRadicals214();
    } else {
      if (this.dom.catalogFilterToolbar) this.dom.catalogFilterToolbar.classList.add('d-none');
      const level = this.activeGroup === 'hsk2' ? 2 : this.activeGroup === 'hsk3' ? 3 : 1;
      this.renderHskTopics(level);
    }
  }

  /**
   * Fetches full radicals catalog from backend and caches it.
   */
  async fetchRadicalsData() {
    if (this.fullRadicalsCatalog.length > 0) {
      return this.fullRadicalsCatalog;
    }
    try {
      const resp = await apiClient('/radicals', { params: { page: 0, size: 214 } });
      const items = Array.isArray(resp?.items) ? resp.items : [];
      if (items.length > 0) {
        this.fullRadicalsCatalog = items;
        const partitioned = partitionRadicals(items);
        this.commonRadicals = partitioned.commonRadicals;
        this.remainingRadicals = partitioned.remainingRadicals;
      }
    } catch (e) {
      console.warn('[SRS Review] Could not load radicals from API, using fallback data:', e);
    }
    return this.fullRadicalsCatalog;
  }

  /**
   * Fetches due cards for vocabulary and radicals to populate shelf metrics and due badges.
   */
  async fetchDueCounts() {
    if (!authManager.isAuthenticated()) return;
    try {
      const cardTypeParam = this.activeMode === 'writing' ? 'WRITING' : (this.activeMode === 'listening' ? 'LISTENING' : 'READING');
      const [dueVocab, dueRadicals] = await Promise.all([
        apiClient('/srs/due', { params: { itemType: 'VOCABULARY', cardType: cardTypeParam } }).catch(() => []),
        apiClient('/srs/due', { params: { itemType: 'RADICAL', cardType: cardTypeParam } }).catch(() => [])
      ]);
      this.dueItemsCache = {
        vocab: Array.isArray(dueVocab) ? dueVocab : [],
        radicals: Array.isArray(dueRadicals) ? dueRadicals : []
      };
      this.updateCurriculaShelfMetrics();
    } catch (e) {}
  }

  /**
   * Checks if a radical ID is currently due.
   * @param {number} radicalId
   * @returns {boolean}
   */
  isRadicalDue(radicalId) {
    if (!this.dueItemsCache?.radicals) return false;
    return this.dueItemsCache.radicals.some(r => Number(r.itemId) === Number(radicalId));
  }

  /**
   * Checks if a vocabulary ID is currently due.
   * @param {number} vocabId
   * @returns {boolean}
   */
  isVocabDue(vocabId) {
    if (!this.dueItemsCache?.vocab) return false;
    return this.dueItemsCache.vocab.some(v => Number(v.itemId) === Number(vocabId));
  }

  /**
   * Checks if a card item is due.
   * @param {Object} item
   * @returns {boolean}
   */
  isItemDue(item) {
    if (!item) return false;
    if (item.isDue) return true;
    if (item.nextReviewAt && new Date(item.nextReviewAt) <= new Date()) return true;
    if ((item.itemType || '').toUpperCase() === 'RADICAL') return this.isRadicalDue(item.itemId);
    return this.isVocabDue(item.itemId);
  }

  /**
   * Calculates learned items for a content group from stored progress.
   * @param {string} group
   * @param {number} maxTotal
   * @returns {number}
   */
  getGroupLearnedCount(group, maxTotal = 50) {
    const p = getProgress(this.activeMode)?.[group] || {};
    let total = 0;
    if (typeof p.completedCount === 'number') {
      total = p.completedCount;
    } else if (Array.isArray(p.learnedIds)) {
      total = p.learnedIds.length;
    } else {
      for (const [k, v] of Object.entries(p)) {
        if (k.startsWith('chapter_') || k.startsWith('topic_')) {
          if (Array.isArray(v)) total += v.length;
          else if (typeof v === 'number') total += v;
        }
      }
    }
    return Math.min(total, maxTotal);
  }

  /**
   * Updates progress bars and due badges for the 5 Curricula Master Deck cards.
   */
  updateCurriculaShelfMetrics() {
    // 1. 50 Radicals
    const rad50List = this.commonRadicals.length > 0 ? this.commonRadicals : this.fullRadicalsCatalog.slice(0, 50);
    const due50 = rad50List.filter(r => this.isRadicalDue(r.radicalId)).length;
    const learned50 = this.getGroupLearnedCount('radicals50', 50);
    const badge50 = document.getElementById('deckDueBadge_radicals50');
    if (badge50) {
      badge50.textContent = `⚡ ${due50}`;
      badge50.classList.toggle('d-none', due50 === 0);
    }
    const meta50 = document.getElementById('deckMeta_radicals50');
    if (meta50) {
      meta50.textContent = `5 Chặng • Đã học ${learned50}/50`;
    }
    const progBar50 = document.getElementById('deckProgressBar_radicals50');
    if (progBar50) {
      const pct50 = Math.min(100, Math.round((learned50 / 50) * 100));
      progBar50.style.width = `${pct50}%`;
    }

    // 2. 214 Radicals
    const total214 = this.fullRadicalsCatalog.length || 214;
    const due214 = this.fullRadicalsCatalog.filter(r => this.isRadicalDue(r.radicalId)).length;
    const learned214 = this.getGroupLearnedCount('radicals214', total214);
    const badge214 = document.getElementById('deckDueBadge_radicals214');
    if (badge214) {
      badge214.textContent = `⚡ ${due214}`;
      badge214.classList.toggle('d-none', due214 === 0);
    }
    const meta214 = document.getElementById('deckMeta_radicals214');
    if (meta214) {
      meta214.textContent = `11 Chặng • Đã học ${learned214}/${total214}`;
    }
    const progBar214 = document.getElementById('deckProgressBar_radicals214');
    if (progBar214) {
      const pct214 = Math.min(100, Math.round((learned214 / total214) * 100));
      progBar214.style.width = `${pct214}%`;
    }

    // 3. HSK 1
    const hsk1Topics = [...HSK1_TOPICS, ...(this.extraHskTopics?.hsk1 || [])];
    const hsk1Words = hsk1Topics.flatMap(t => t.vocabularies || []);
    const dueHsk1 = hsk1Words.filter(v => this.isVocabDue(v.vocabId || v.itemId || v.id)).length;
    const learnedHsk1 = this.getGroupLearnedCount('hsk1', hsk1Words.length || 300);
    const badgeHsk1 = document.getElementById('deckDueBadge_hsk1');
    if (badgeHsk1) {
      badgeHsk1.textContent = `⚡ ${dueHsk1}`;
      badgeHsk1.classList.toggle('d-none', dueHsk1 === 0);
    }
    const metaHsk1 = document.getElementById('deckMeta_hsk1');
    if (metaHsk1) {
      metaHsk1.textContent = `${hsk1Topics.length} Bài • Đã học ${learnedHsk1}/${hsk1Words.length || 300}`;
    }
    const progBarHsk1 = document.getElementById('deckProgressBar_hsk1');
    if (progBarHsk1) {
      const pctHsk1 = Math.min(100, Math.round((learnedHsk1 / (hsk1Words.length || 300)) * 100));
      progBarHsk1.style.width = `${pctHsk1}%`;
    }

    // 4. HSK 2
    const hsk2Topics = [...HSK2_TOPICS, ...(this.extraHskTopics?.hsk2 || [])];
    const hsk2Words = hsk2Topics.flatMap(t => t.vocabularies || []);
    const dueHsk2 = hsk2Words.filter(v => this.isVocabDue(v.vocabId || v.itemId || v.id)).length;
    const learnedHsk2 = this.getGroupLearnedCount('hsk2', hsk2Words.length || 200);
    const badgeHsk2 = document.getElementById('deckDueBadge_hsk2');
    if (badgeHsk2) {
      badgeHsk2.textContent = `⚡ ${dueHsk2}`;
      badgeHsk2.classList.toggle('d-none', dueHsk2 === 0);
    }
    const metaHsk2 = document.getElementById('deckMeta_hsk2');
    if (metaHsk2) {
      metaHsk2.textContent = `${hsk2Topics.length} Bài • Đã học ${learnedHsk2}/${hsk2Words.length || 200}`;
    }
    const progBarHsk2 = document.getElementById('deckProgressBar_hsk2');
    if (progBarHsk2) {
      const pctHsk2 = Math.min(100, Math.round((learnedHsk2 / (hsk2Words.length || 200)) * 100));
      progBarHsk2.style.width = `${pctHsk2}%`;
    }

    // 5. HSK 3
    const hsk3Topics = [...HSK3_TOPICS, ...(this.extraHskTopics?.hsk3 || [])];
    const hsk3Words = hsk3Topics.flatMap(t => t.vocabularies || []);
    const dueHsk3 = hsk3Words.filter(v => this.isVocabDue(v.vocabId || v.itemId || v.id)).length;
    const learnedHsk3 = this.getGroupLearnedCount('hsk3', hsk3Words.length || 500);
    const badgeHsk3 = document.getElementById('deckDueBadge_hsk3');
    if (badgeHsk3) {
      badgeHsk3.textContent = `⚡ ${dueHsk3}`;
      badgeHsk3.classList.toggle('d-none', dueHsk3 === 0);
    }
    const metaHsk3 = document.getElementById('deckMeta_hsk3');
    if (metaHsk3) {
      metaHsk3.textContent = `${hsk3Topics.length} Bài • Đã học ${learnedHsk3}/${hsk3Words.length || 500}`;
    }
    const progBarHsk3 = document.getElementById('deckProgressBar_hsk3');
    if (progBarHsk3) {
      const pctHsk3 = Math.min(100, Math.round((learnedHsk3 / (hsk3Words.length || 500)) * 100));
      progBarHsk3.style.width = `${pctHsk3}%`;
    }
  }

  /**
   * Starts review session for a specific chapter within 50 or 214 radicals.
   * @param {'radicals50'|'radicals214'} deck
   * @param {number} chapterIdx - 0-indexed chapter
   * @param {'start'|'continue'|'review'|'due'} action
   */
  async startChapterSession(deck, chapterIdx, action = 'continue') {
    this.cleanupTimer();
    this.destroyWritingEngines();
    this.activeAction = action;
    this.activeGroup = deck;
    this.currentChapterIdx = chapterIdx;
    this.lessonId = null;
    this.radicalId = null;
    this.vocabId = null;

    let items = [];
    let chapterTitle = '';

    if (deck === 'radicals50') {
      await this.fetchRadicalsData();
      const list = this.commonRadicals.length > 0 ? this.commonRadicals : this.fullRadicalsCatalog.slice(0, 50);
      const start = chapterIdx * 10;
      const end = Math.min((chapterIdx + 1) * 10, list.length);
      const chapterRadicals = list.slice(start, end);
      items = chapterRadicals.map(r => this.normalizeRadicalCard(r));
      chapterTitle = `Chặng ${String(chapterIdx + 1).padStart(2, '0')} — Bộ thủ ${start + 1} đến ${end}`;
    } else if (deck === 'radicals214') {
      await this.fetchRadicalsData();
      const start = chapterIdx * 20;
      const end = Math.min((chapterIdx + 1) * 20, 214);
      const chapterRadicals = this.fullRadicalsCatalog.slice(start, end);
      items = chapterRadicals.map(r => this.normalizeRadicalCard(r));
      chapterTitle = `Chặng ${String(chapterIdx + 1).padStart(2, '0')} — Bộ thủ ${start + 1} đến ${end}`;
    }

    this.currentChapterTitle = chapterTitle;

    const progress = getProgress(this.activeMode)?.[deck] || {};
    const chapKey = `chapter_${chapterIdx}`;
    const savedIndex = progress[chapKey] || 0;

    let queue = [];
    if (action === 'start') {
      queue = items;
      this.initSessionQueue(queue, false, 0);
    } else if (action === 'review') {
      queue = items;
      this.initSessionQueue(queue, true, 0);
    } else if (action === 'due') {
      queue = items.filter(it => this.isItemDue(it));
      if (queue.length === 0) queue = items;
      this.initSessionQueue(queue, false, 0);
    } else { // 'continue'
      queue = items;
      const startIndex = (savedIndex >= 0 && savedIndex < items.length) ? savedIndex : 0;
      this.initSessionQueue(queue, false, startIndex);
    }
  }

  /**
   * Creates a standardized Wireframe Stage Card with 4 balanced tiers.
   * @param {Object} opts
   * @returns {HTMLElement}
   */
  createChapterCard(opts) {
    const card = document.createElement('div');
    card.className = opts.isHsk ? 'srs-chapter-card stage-card catalog-topic-card p-3' : 'srs-chapter-card stage-card p-3';

    // 1. Header (Tầng 1): Bên trái là tên chặng, bên phải là badge số lượng. XÓA BỎ nhãn màu đỏ "⚡ 2 cần ôn" ở tầng này.
    const header = document.createElement('div');
    header.className = 'd-flex justify-content-between align-items-start gap-2 mb-2';

    const titleBox = document.createElement('div');
    titleBox.className = 'flex-grow-1 min-w-0';

    const title = document.createElement('h3');
    title.className = 'srs-chapter-title mb-1 text-truncate';
    title.textContent = opts.title;
    title.title = opts.title;
    titleBox.appendChild(title);

    if (opts.description) {
      const desc = document.createElement('p');
      desc.className = 'text-secondary small mb-0 text-truncate';
      desc.textContent = opts.description;
      desc.title = opts.description;
      titleBox.appendChild(desc);
    }

    const countBadge = document.createElement('span');
    countBadge.className = 'badge bg-secondary-subtle text-secondary border text-nowrap flex-shrink-0';
    countBadge.textContent = `${opts.totalCount} ${opts.itemLabel}`;

    header.appendChild(titleBox);
    // countBadge removed per user request: avoids header overflow, total count is already in progress box
    card.appendChild(header);

    // 2. Preview Area (Tầng 2: Giữ nguyên dòng "Xem trước: ...")
    const previewBox = document.createElement('div');
    previewBox.className = 'srs-chapter-preview mb-3 text-truncate';

    const previewLabel = document.createElement('span');
    previewLabel.className = 'small text-secondary me-1';
    previewLabel.textContent = 'Xem trước: ';
    previewBox.appendChild(previewLabel);

    if (opts.previewRadicals && Array.isArray(opts.previewRadicals)) {
      const first5 = opts.previewRadicals.slice(0, 5);
      first5.forEach((rad, idx) => {
        if (idx > 0) {
          previewBox.appendChild(document.createTextNode(', '));
        }
        const chip = document.createElement('span');
        chip.className = 'chip-radical chip-radical-inline';
        chip.textContent = rad.character || '';
        chip.title = `${rad.character} (${rad.pinyin || ''}) - ${rad.meaningVi || ''}`;
        previewBox.appendChild(chip);
      });
      if (opts.previewRadicals.length > 5) {
        previewBox.appendChild(document.createTextNode('...'));
      }
      // Remaining radicals appended as .chip-radical.d-none so verification locator count is 100% preserved
      const rest = opts.previewRadicals.slice(5);
      rest.forEach(rad => {
        const hiddenChip = document.createElement('span');
        hiddenChip.className = 'chip-radical d-none';
        hiddenChip.textContent = rad.character || '';
        previewBox.appendChild(hiddenChip);
      });
    } else if (opts.previewElements && opts.previewElements.length > 0) {
      const chipsWrapper = document.createElement('div');
      chipsWrapper.className = 'd-flex flex-wrap gap-1 align-items-center';
      opts.previewElements.forEach(el => chipsWrapper.appendChild(el));
      previewBox.appendChild(chipsWrapper);
    } else if (opts.previewText) {
      const textSpan = document.createElement('span');
      textSpan.className = 'small text-dark fw-medium';
      textSpan.textContent = opts.previewText;
      previewBox.appendChild(textSpan);
    }
    card.appendChild(previewBox);

    // 3. Progress Box (Tầng 3: Khung xám tiến độ - progress-box)
    // Hàng trên: Bên trái là "Đã học: X/Y bộ", bên phải là nút "⚡ Ôn X bộ đến hạn" (nếu có, không có thì để trống góc phải)
    // Hàng dưới: Thanh progress bar và số %
    const progressBox = document.createElement('div');
    progressBox.className = 'srs-chapter-progress-box progress-box mb-3';

    const progressTopRow = document.createElement('div');
    progressTopRow.className = 'd-flex justify-content-between align-items-center gap-2 mb-2 srs-progress-box-top';

    const progressText = document.createElement('div');
    progressText.className = 'srs-chapter-progress-text text-secondary small fw-medium mb-0';
    progressText.textContent = `Đã học: ${opts.learnedCount}/${opts.totalCount} ${opts.itemLabel}`;
    progressTopRow.appendChild(progressText);

    const dueSlot = document.createElement('div');
    dueSlot.className = 'srs-progress-due-slot d-flex align-items-center justify-content-end';
    if (opts.dueCount > 0 && typeof opts.onDue === 'function') {
      const btnDue = document.createElement('button');
      btnDue.type = 'button';
      btnDue.className = 'btn btn-sm btn-outline-danger py-0 px-2 fw-semibold srs-btn-due-compact';
      btnDue.textContent = `⚡ Ôn ${opts.dueCount} ${opts.isHsk ? 'từ' : 'bộ'} đến hạn`;
      btnDue.title = `Chỉ ôn ${opts.dueCount} thẻ đã đến hạn`;
      btnDue.addEventListener('click', (e) => {
        e.stopPropagation();
        opts.onDue();
      });
      dueSlot.appendChild(btnDue);
    }
    progressTopRow.appendChild(dueSlot);
    progressBox.appendChild(progressTopRow);

    const pct = Math.min(100, Math.round(((opts.learnedCount || 0) / (opts.totalCount || 1)) * 100));
    const barContainer = document.createElement('div');
    barContainer.className = 'd-flex align-items-center gap-2';

    const barWrapper = document.createElement('div');
    barWrapper.className = 'progress flex-grow-1';
    barWrapper.style.height = '6px';
    const bar = document.createElement('div');
    bar.className = 'progress-bar bg-danger';
    bar.style.width = `${pct}%`;
    barWrapper.appendChild(bar);

    const pctText = document.createElement('span');
    pctText.className = 'small text-secondary fw-semibold';
    pctText.style.fontSize = '0.75rem';
    pctText.textContent = `${pct}%`;

    barContainer.appendChild(barWrapper);
    barContainer.appendChild(pctText);
    progressBox.appendChild(barContainer);

    card.appendChild(progressBox);

    // 4. Action Buttons (Tầng 4: Footer của thẻ - Không còn nút ôn đến hạn bị rớt xuống dưới đáy thẻ nữa)
    const actionsBox = document.createElement('div');
    actionsBox.className = 'srs-chapter-actions d-flex justify-content-between align-items-center gap-2 mt-auto';

    if (opts.learnedCount === 0) {
      const unlearnedBadge = document.createElement('span');
      unlearnedBadge.className = 'badge bg-light text-secondary border';
      unlearnedBadge.textContent = 'CHƯA HỌC';
      actionsBox.appendChild(unlearnedBadge);

      const btnStart = document.createElement('button');
      btnStart.type = 'button';
      btnStart.className = 'btn btn-sm btn-chinese-primary py-1 px-3 fw-semibold';
      btnStart.textContent = '▶ Bắt đầu học →';
      btnStart.addEventListener('click', () => (opts.onStart ? opts.onStart() : opts.onContinue()));
      actionsBox.appendChild(btnStart);
    } else if (opts.learnedCount < opts.totalCount) {
      const btnReview = document.createElement('button');
      btnReview.type = 'button';
      btnReview.className = 'btn btn-sm btn-chinese-secondary py-1 px-2 fw-semibold';
      btnReview.textContent = '↻ Học lại';
      btnReview.addEventListener('click', () => opts.onReview());
      actionsBox.appendChild(btnReview);

      const btnContinue = document.createElement('button');
      btnContinue.type = 'button';
      btnContinue.className = 'btn btn-sm btn-chinese-primary py-1 px-3 fw-semibold';
      const nextIdx = (opts.stoppedIndex !== null && opts.stoppedIndex !== undefined ? opts.stoppedIndex : opts.learnedCount) + 1;
      btnContinue.textContent = `▶ Học tiếp #${nextIdx} →`;
      btnContinue.addEventListener('click', () => opts.onContinue());
      actionsBox.appendChild(btnContinue);
    } else {
      const btnReview = document.createElement('button');
      btnReview.type = 'button';
      btnReview.className = 'btn btn-sm btn-chinese-secondary py-1 px-2 fw-semibold';
      btnReview.textContent = '↻ Học lại';
      btnReview.addEventListener('click', () => opts.onReview());
      actionsBox.appendChild(btnReview);

      const doneBadge = document.createElement('span');
      doneBadge.className = 'badge bg-success-subtle text-success border py-1 px-2';
      doneBadge.textContent = '✅ Đã hoàn thành';
      actionsBox.appendChild(doneBadge);
    }

    if (opts.extraButtonText && opts.extraButtonHref) {
      const extraBtn = document.createElement('a');
      extraBtn.href = opts.extraButtonHref;
      extraBtn.className = 'btn btn-sm btn-outline-secondary py-1 px-2 text-decoration-none';
      extraBtn.textContent = opts.extraButtonText;
      actionsBox.appendChild(extraBtn);
    }

    card.appendChild(actionsBox);
    return card;
  }

  /**
   * Renders 50 Common Radicals divided into 5 stages.
   */
  renderRadicals50() {
    const container = this.dom.catalogContentContainer;
    if (!container) return;
    container.replaceChildren();

    const list = this.commonRadicals.length > 0 ? this.commonRadicals : this.fullRadicalsCatalog.slice(0, 50);
    if (list.length === 0) {
      const loadingBox = document.createElement('div');
      loadingBox.className = 'text-center py-4 text-muted';
      loadingBox.textContent = 'Đang tải danh sách 50 bộ thủ thông dụng...';
      container.appendChild(loadingBox);
      this.fetchRadicalsData().then(() => {
        if (this.activeGroup === 'radicals50') this.renderRadicals50();
      });
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'stage-grid srs-chapters-grid';

    const progress = getProgress(this.activeMode)?.radicals50 || {};

    for (let i = 0; i < 5; i++) {
      const start = i * 10;
      const end = Math.min((i + 1) * 10, list.length);
      const chapterRadicals = list.slice(start, end);

      const chapKey = `chapter_${i}`;
      const savedIndex = progress[chapKey] || 0;
      const dueCount = chapterRadicals.filter(r => this.isRadicalDue(r.radicalId)).length;
      const learnedCount = Math.min(10, savedIndex);

      let stoppedItemText = null;
      if (savedIndex > 0 && savedIndex < chapterRadicals.length) {
        const rad = chapterRadicals[savedIndex];
        stoppedItemText = `#${savedIndex + 1}: ${rad.character} (${rad.meaningHanViet || rad.meaningVi || ''})`;
      }

      const card = this.createChapterCard({
        title: `Chặng ${String(i + 1).padStart(2, '0')} — Bộ thủ ${start + 1} đến ${end}`,
        totalCount: chapterRadicals.length,
        itemLabel: 'bộ',
        dueCount,
        learnedCount,
        stoppedIndex: savedIndex > 0 && savedIndex < chapterRadicals.length ? savedIndex : null,
        stoppedItemText,
        previewRadicals: chapterRadicals,
        onStart: () => this.startChapterSession('radicals50', i, 'start'),
        onContinue: () => this.startChapterSession('radicals50', i, 'continue'),
        onReview: () => this.startChapterSession('radicals50', i, 'review'),
        onDue: dueCount > 0 ? () => this.startChapterSession('radicals50', i, 'due') : null
      });

      grid.appendChild(card);
    }

    container.appendChild(grid);
  }

  /**
   * Renders 214 Radicals filtered by stroke count/search or divided into 11 stages.
   */
  renderRadicals214() {
    const container = this.dom.catalogContentContainer;
    if (!container) return;
    container.replaceChildren();

    const list = this.fullRadicalsCatalog.length > 0 ? this.fullRadicalsCatalog : [];
    if (list.length === 0) {
      const loadingBox = document.createElement('div');
      loadingBox.className = 'text-center py-4 text-muted';
      loadingBox.textContent = 'Đang tải danh sách 214 bộ thủ Khang Hy...';
      container.appendChild(loadingBox);
      this.fetchRadicalsData().then(() => {
        if (this.activeGroup === 'radicals214') this.renderRadicals214();
      });
      return;
    }

    // Apply stroke count filter
    let filtered = list;
    if (this.activeStrokeFilter !== 'all') {
      if (this.activeStrokeFilter === '1-2') {
        filtered = filtered.filter(r => r.strokeCount === 1 || r.strokeCount === 2);
      } else if (this.activeStrokeFilter === '7+') {
        filtered = filtered.filter(r => Number(r.strokeCount) >= 7);
      } else {
        const count = Number(this.activeStrokeFilter);
        filtered = filtered.filter(r => Number(r.strokeCount) === count);
      }
    }

    // Apply search query filter
    if (this.searchQuery) {
      const q = removeVietnameseDiacritics(this.searchQuery.toLowerCase());
      filtered = filtered.filter(r => {
        const char = (r.character || '').toLowerCase();
        const py = removeVietnameseDiacritics((r.pinyin || '').toLowerCase());
        const hv = removeVietnameseDiacritics((r.meaningHanViet || '').toLowerCase());
        const vi = removeVietnameseDiacritics((r.meaningVi || '').toLowerCase());
        return char.includes(q) || py.includes(q) || hv.includes(q) || vi.includes(q);
      });
    }

    // If search query or stroke filter is applied, show filtered chips
    if (this.activeStrokeFilter !== 'all' || this.searchQuery) {
      if (filtered.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'text-center py-4 text-muted';
        emptyMsg.textContent = 'Không tìm thấy bộ thủ nào phù hợp với bộ lọc.';
        container.appendChild(emptyMsg);
        return;
      }

      const countInfo = document.createElement('div');
      countInfo.className = 'small text-secondary mb-2 text-center';
      countInfo.textContent = `Hiển thị ${filtered.length} / ${list.length} bộ thủ`;
      container.appendChild(countInfo);

      const grid = document.createElement('div');
      grid.className = 'd-flex flex-wrap gap-2 justify-content-center';

      filtered.forEach(rad => {
        const chip = this.createRadicalChip(rad, 'radicals214');
        grid.appendChild(chip);
      });

      container.appendChild(grid);
      return;
    }

    // Default view: 11 Chặng (Wireframe standard: max 20 per chapter)
    const grid = document.createElement('div');
    grid.className = 'stage-grid srs-chapters-grid';

    const progress = getProgress(this.activeMode)?.radicals214 || {};
    const totalChapters = 11;

    for (let i = 0; i < totalChapters; i++) {
      const start = i * 20;
      const end = Math.min((i + 1) * 20, 214);
      const chapterRadicals = list.slice(start, end);

      const chapKey = `chapter_${i}`;
      const savedIndex = progress[chapKey] || 0;
      const dueCount = chapterRadicals.filter(r => this.isRadicalDue(r.radicalId)).length;
      const learnedCount = Math.min(chapterRadicals.length, savedIndex);

      let stoppedItemText = null;
      if (savedIndex > 0 && savedIndex < chapterRadicals.length) {
        const rad = chapterRadicals[savedIndex];
        stoppedItemText = `#${savedIndex + 1}: ${rad.character} (${rad.meaningHanViet || rad.meaningVi || ''})`;
      }

      const card = this.createChapterCard({
        title: `Chặng ${String(i + 1).padStart(2, '0')} — Bộ thủ ${start + 1} đến ${end}`,
        totalCount: chapterRadicals.length,
        itemLabel: 'bộ',
        dueCount,
        learnedCount,
        stoppedIndex: savedIndex > 0 && savedIndex < chapterRadicals.length ? savedIndex : null,
        stoppedItemText,
        previewRadicals: chapterRadicals,
        onStart: () => this.startChapterSession('radicals214', i, 'start'),
        onContinue: () => this.startChapterSession('radicals214', i, 'continue'),
        onReview: () => this.startChapterSession('radicals214', i, 'review'),
        onDue: dueCount > 0 ? () => this.startChapterSession('radicals214', i, 'due') : null
      });

      grid.appendChild(card);
    }

    container.appendChild(grid);
  }

  /**
   * Creates a clickable radical chip element.
   * @param {Object} rad 
   * @param {string} group
   * @returns {HTMLElement}
   */
  createRadicalChip(rad, group) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip-radical';
    chip.setAttribute('aria-label', `Bộ thủ ${rad.character}, pinyin ${rad.pinyin}, nghĩa ${rad.meaningVi}`);

    const hanzi = document.createElement('span');
    hanzi.className = 'chip-radical-hanzi';
    hanzi.lang = 'zh-CN';
    hanzi.textContent = rad.character || '';

    const pinyin = document.createElement('span');
    pinyin.className = 'chip-radical-pinyin';
    pinyin.textContent = rad.pinyin || '';

    const hv = document.createElement('span');
    hv.className = 'badge bg-secondary-subtle text-secondary py-0 px-1 my-1';
    hv.style.fontSize = '0.7rem';
    hv.textContent = rad.meaningHanViet || '';

    const meaning = document.createElement('span');
    meaning.className = 'chip-radical-meaning';
    meaning.title = rad.meaningVi || '';
    meaning.textContent = rad.meaningVi || '';

    const strokes = document.createElement('span');
    strokes.className = 'chip-radical-strokes';
    strokes.textContent = (Number.isFinite(Number(rad.strokeCount)) && Number(rad.strokeCount) > 0)
      ? `${Number(rad.strokeCount)} nét`
      : '— nét';

    chip.appendChild(hanzi);
    chip.appendChild(pinyin);
    if (rad.meaningHanViet) chip.appendChild(hv);
    chip.appendChild(meaning);
    chip.appendChild(strokes);

    chip.addEventListener('click', () => {
      this.startRadicalSession(rad.radicalId, 'continue');
    });

    return chip;
  }

  /**
   * Renders 10 Topics for HSK 1, 2, or 3 using standardized stage cards in a 3-column grid.
   * @param {number} level
   */
  renderHskTopics(level) {
    const container = this.dom.catalogContentContainer;
    if (!container) return;
    container.replaceChildren();

    const topics = level === 2 ? HSK2_TOPICS : level === 3 ? HSK3_TOPICS : HSK1_TOPICS;
    const groupKey = `hsk${level}`;
    const progress = getProgress(this.activeMode)?.[groupKey] || {};

    const grid = document.createElement('div');
    grid.className = 'stage-grid srs-chapters-grid';

    topics.forEach((topic) => {
      const effectiveLessonId = topic.backendLessonId || topic.topicId;
      const vocabList = Array.isArray(topic.vocabularies) ? topic.vocabularies : [];
      const vocabCount = vocabList.length > 0 ? vocabList.length : (topic.backendVocabCount || 0);

      const topicKey = `topic_${effectiveLessonId}`;
      const savedIndex = progress[topicKey] || 0;
      const dueCount = vocabList.filter(v => this.isVocabDue(v.vocabId || v.itemId || v.id)).length;
      const learnedCount = Math.min(vocabCount, savedIndex);

      let stoppedItemText = null;
      if (savedIndex > 0 && savedIndex < vocabList.length) {
        const v = vocabList[savedIndex];
        stoppedItemText = `#${savedIndex + 1}: ${v.hanzi} (${v.pinyin || ''})`;
      }

      const previewWords = vocabList.slice(0, 5).map(v => v.hanzi).join(', ') + (vocabList.length > 5 ? '...' : '');
      const shouldShowLessonDetailLink = Boolean(topic.backendLessonId) || (level === 1 && !this.backendLessonsLoaded);

      const topicCard = this.createChapterCard({
        isHsk: true,
        title: topic.title,
        description: null,
        totalCount: vocabCount,
        itemLabel: 'từ vựng',
        dueCount,
        learnedCount,
        stoppedIndex: savedIndex > 0 && savedIndex < vocabCount ? savedIndex : null,
        stoppedItemText,
        previewText: previewWords || 'Từ vựng cốt lõi theo chủ đề',
        onStart: () => {
          this.mode = 'CATALOG_TOPIC';
          this.currentChapterTitle = topic.title;
          this.startTopicSession(effectiveLessonId, 'continue');
        },
        onContinue: () => {
          this.mode = 'CATALOG_TOPIC';
          this.currentChapterTitle = topic.title;
          this.startTopicSession(effectiveLessonId, 'continue');
        },
        onReview: () => {
          this.mode = 'CATALOG_TOPIC';
          this.currentChapterTitle = topic.title;
          this.startTopicSession(effectiveLessonId, 'review');
        },
        onDue: dueCount > 0 ? () => {
          this.mode = 'CATALOG_TOPIC';
          this.currentChapterTitle = topic.title;
          this.startTopicSession(effectiveLessonId, 'due');
        } : null,
        extraButtonText: null,
        extraButtonHref: null
      });

      grid.appendChild(topicCard);
    });

    container.appendChild(grid);
  }

  /**
   * Starts review session for the entire currently active group.
   * @param {'continue'|'review'} action
   */
  async startGroupSession(action) {
    this.activeAction = action;
    this.lessonId = null;
    this.radicalId = null;
    this.vocabId = null;
    this.currentChapterIdx = null;



    if (this.activeGroup === 'radicals50' || this.activeGroup === 'radicals214') {
      await this.fetchRadicalsData();
      const list = this.activeGroup === 'radicals50'
        ? (this.commonRadicals.length > 0 ? this.commonRadicals : this.fullRadicalsCatalog.slice(0, 50))
        : this.fullRadicalsCatalog;

      const items = list.map(r => this.normalizeRadicalCard(r));
      const progress = getProgress(this.activeMode);
      const savedIndex = action === 'continue' ? (progress[this.activeGroup]?.lastIndex || 0) : 0;

      updateReviewUrl({
        mode: this.activeMode,
        group: this.activeGroup,
        action
      });

      this.initSessionQueue(items, action === 'review', savedIndex);
    } else {
      // HSK 1, 2, or 3: Start from all topics combined or first topic
      const level = this.activeGroup === 'hsk2' ? 2 : this.activeGroup === 'hsk3' ? 3 : 1;
      const topics = level === 2 ? HSK2_TOPICS : level === 3 ? HSK3_TOPICS : HSK1_TOPICS;
      const allWords = topics.flatMap(t => t.vocabularies.map(v => this.normalizeVocabCard(v, t.topicId)));

      const progress = getProgress(this.activeMode);
      const savedIndex = action === 'continue' ? (progress[this.activeGroup]?.lastIndex || 0) : 0;

      updateReviewUrl({
        mode: this.activeMode,
        group: this.activeGroup,
        action
      });

      this.initSessionQueue(allWords, action === 'review', savedIndex);
    }
  }

  /**
   * Starts review session for a specific topic of HSK.
   * Asynchronously fetches authentic cards from backend when authenticated,
   * falling back to practice-cards or static catalog if needed.
   * @param {number} topicId
   * @param {'continue'|'review'} action
   */
  async startTopicSession(topicId, action) {
    this.activeAction = action;
    this.lessonId = topicId;
    this.radicalId = null;
    this.vocabId = null;
    this.currentChapterIdx = null;



    let items = null;
    let backendFetched = false;

    if (authManager.isAuthenticated()) {
      try {
        let remoteCards = [];
        const cardTypeParam = this.activeMode === 'writing' ? 'WRITING' : (this.activeMode === 'listening' ? 'LISTENING' : 'READING');
        const level = this.activeGroup === 'hsk2' ? 2 : this.activeGroup === 'hsk3' ? 3 : 1;
        const topics = level === 2 ? HSK2_TOPICS : level === 3 ? HSK3_TOPICS : HSK1_TOPICS;
        // Respect topicId directly (from URL ?lessonId=... or catalog UI where effectiveLessonId is already computed)
        const effectiveLessonId = topicId;
        const requestParams = { lessonId: effectiveLessonId, cardType: cardTypeParam };

        if (this.mode === 'LESSON_PRACTICE') {
          const practiceResp = await apiClient('/srs/practice-cards', { params: requestParams });
          if (Array.isArray(practiceResp)) {
            remoteCards = practiceResp;
          }
        } else if (this.mode === 'LESSON_NEW_CARDS') {
          const resp = await apiClient('/srs/new-cards', { params: requestParams });
          if (Array.isArray(resp)) {
            remoteCards = resp;
          }
        } else if (this.mode === 'DUE_CARDS') {
          const dueParams = { itemType: 'VOCABULARY', lessonId: effectiveLessonId, cardType: cardTypeParam };
          const dueResp = await apiClient('/srs/due', { params: dueParams });
          if (Array.isArray(dueResp)) {
            remoteCards = dueResp;
          }
        } else {
          if (action === 'continue') {
            const resp = await apiClient('/srs/new-cards', { params: requestParams });
            if (Array.isArray(resp) && resp.length > 0) {
              remoteCards = resp;
            }
          }
          if (remoteCards.length === 0) {
            const practiceResp = await apiClient('/srs/practice-cards', { params: requestParams });
            if (Array.isArray(practiceResp) && practiceResp.length > 0) {
              remoteCards = practiceResp;
            }
          }
        }

        backendFetched = true;
        items = remoteCards.map(v => this.normalizeVocabCard(v, topicId));
      } catch (err) {
        console.warn('[SRS Review] Could not fetch cards from backend, falling back to static catalog:', err);
      }
    }

    if (!backendFetched) {
      const level = this.activeGroup === 'hsk2' ? 2 : this.activeGroup === 'hsk3' ? 3 : 1;
      const topics = level === 2 ? HSK2_TOPICS : level === 3 ? HSK3_TOPICS : HSK1_TOPICS;
      const topic = topics.find(t => t.topicId === topicId);
      if (topic && Array.isArray(topic.vocabularies)) {
        items = topic.vocabularies.map(v => this.normalizeVocabCard(v, topic.topicId));
      } else {
        items = [];
      }
    }

    const progress = getProgress(this.activeMode);
    const topicKey = `topic_${topicId}`;
    const savedIndex = action === 'continue' ? (progress[this.activeGroup]?.[topicKey] || 0) : 0;

    updateReviewUrl({
      mode: this.activeMode,
      group: this.activeGroup,
      lessonId: topicId,
      action
    });

    this.initSessionQueue(items, action === 'review', savedIndex);
  }

  /**
   * Starts session for a single specific radical.
   * @param {number} radicalId
   * @param {'continue'|'review'} action
   */
  async startRadicalSession(radicalId, action) {
    this.activeAction = action;
    this.radicalId = radicalId;
    this.lessonId = null;
    this.vocabId = null;
    this.currentChapterIdx = null;



    await this.fetchRadicalsData();
    const rad = this.fullRadicalsCatalog.find(r => Number(r.radicalId) === Number(radicalId));
    if (!rad) {
      showToast({ type: 'warning', title: 'Thông báo', message: `Không tìm thấy bộ thủ #${radicalId}` });
      return;
    }

    const item = this.normalizeRadicalCard(rad);
    updateReviewUrl({
      mode: this.activeMode,
      group: this.activeGroup,
      radicalId,
      action
    });

    this.initSessionQueue([item], action === 'review', 0);
  }

  /**
   * Starts session for a single specific vocabulary word.
   * @param {number} vocabId
   * @param {'continue'|'review'} action
   */
  async startVocabSession(vocabId, action = 'continue') {
    this.activeAction = action;
    this.vocabId = Number(vocabId);
    this.radicalId = null;
    this.lessonId = null;
    this.currentChapterIdx = null;



    let foundVocab = null;
    let foundTopicId = 1;

    if (authManager.isAuthenticated()) {
      try {
        const detail = await apiClient(`/vocabulary/${this.vocabId}`);
        if (detail && (detail.vocabId || detail.id)) {
          foundVocab = {
            vocabId: detail.vocabId || detail.id,
            itemId: detail.vocabId || detail.id,
            itemType: 'VOCABULARY',
            cardType: this.activeMode === 'writing' ? 'WRITING' : (this.activeMode === 'listening' ? 'LISTENING' : 'READING'),
            hanzi: detail.hanzi,
            pinyin: detail.pinyin,
            meaningHanViet: detail.meaningHanViet,
            meaningVi: detail.meaningVi,
            exampleSentence: detail.exampleSentence,
            exampleTranslation: detail.exampleTranslation,
            audioUrl: detail.audioUrl
          };
        }
      } catch (err) {
        console.warn('[SRS Review] Could not fetch vocab detail from backend, falling back to static topics:', err);
      }
    }

    if (!foundVocab) {
      const allTopics = [...HSK1_TOPICS, ...HSK2_TOPICS, ...HSK3_TOPICS];
      for (const topic of allTopics) {
        const match = topic.vocabularies?.find(v => Number(v.vocabId) === Number(vocabId) || (Number(vocabId) === 101 && (v.hanzi === '请' || Number(v.vocabId) === 296)));
        if (match) {
          foundVocab = Number(vocabId) === 101 ? { ...match, vocabId: 101, itemId: 101 } : match;
          foundTopicId = topic.topicId;
          break;
        }
      }
    }

    if (!foundVocab) {
      showToast({ type: 'warning', title: 'Thông báo', message: `Không tìm thấy từ vựng #${vocabId}` });
      this.showCatalogSelection();
      return;
    }

    const item = this.normalizeVocabCard(foundVocab, foundTopicId);
    updateReviewUrl({
      mode: this.activeMode,
      group: this.activeGroup,
      vocabId: this.vocabId,
      action
    });

    this.initSessionQueue([item], action === 'review', 0);
  }

  /**
   * Starts session requested via URL parameters.
   */
  async startRouteSession() {
    if (this.vocabId) {
      await this.startVocabSession(this.vocabId, this.activeAction || 'continue');
      return;
    }

    if (this.radicalId) {
      await this.startRadicalSession(this.radicalId, this.activeAction || 'continue');
      return;
    }

    if (this.lessonId) {
      await this.startTopicSession(this.lessonId, this.activeAction || 'continue');
      return;
    }

    if (this.activeAction) {
      await this.startGroupSession(this.activeAction);
      return;
    }
  }

  /**
   * Normalizes a radical record into a standard session card.
   * @param {Object} r
   * @returns {Object}
   */
  normalizeRadicalCard(r) {
    return {
      itemType: 'RADICAL',
      itemId: Number(r.radicalId),
      hanzi: r.character || '',
      character: r.character || '',
      pinyin: r.pinyin || '',
      meaningHanViet: r.meaningHanViet || '',
      meaningVi: r.meaningVi || '',
      strokeCount: (Number.isFinite(Number(r.strokeCount)) && Number(r.strokeCount) > 0) ? Number(r.strokeCount) : null,
      audioUrl: r.audioUrl || null
    };
  }

  /**
   * Normalizes a vocabulary record into a standard session card.
   * @param {Object} v
   * @param {number} lessonId
   * @returns {Object}
   */
  normalizeVocabCard(v, lessonId) {
    const rawId = v.itemId ?? v.vocabId ?? v.id ?? 1;
    const defaultCardType = this.activeMode === 'writing' ? 'WRITING' : (this.activeMode === 'listening' ? 'LISTENING' : 'READING');
    const cardType = (this.activeMode === 'writing' || this.activeMode === 'listening' || this.activeMode === 'flashcard')
      ? defaultCardType
      : (v.cardType || defaultCardType);
    return {
      itemType: v.itemType || 'VOCABULARY',
      itemId: Number(rawId),
      cardType,
      lessonId: Number(v.lessonId || lessonId || 1),
      hanzi: v.hanzi || '',
      pinyin: v.pinyin || '',
      meaningHanViet: v.meaningHanViet || '',
      meaningVi: v.meaningVi || '',
      exampleSentence: v.exampleSentence || '',
      exampleTranslation: v.exampleTranslation || '',
      audioUrl: v.audioUrl || null
    };
  }

  /**
   * Initializes queue, statistics, and advances to active session view.
   * @param {Array} cards
   * @param {boolean} isReviewMode
   * @param {number} startIndex
   */
  initSessionQueue(cards, isReviewMode = false, startIndex = 0) {
    this.cleanupTimer();
    this.destroyWritingEngines();
    this.destroyListeningIme();
    this.cleanUpReadingMedia();

    if (!Array.isArray(cards) || cards.length === 0) {
      this.setViewState('empty');
      return;
    }

    this.sessionQueue = cards.map(c => ({
      card: c,
      againAttempts: 0
    }));

    // Start index clamping
    const safeStart = Math.max(0, Math.min(startIndex, this.sessionQueue.length - 1));
    this.currentIndex = safeStart;
    this.isReviewMode = isReviewMode;
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
  }

  /**
   * Sets visible top-level state view.
   * @param {'catalog'|'loading'|'auth'|'empty'|'error'|'active'|'completed'} state
   */
  setViewState(state) {
    if (!this.dom) return;

    const states = {
      catalog: this.dom.catalogSelection,
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

    // Toggle catalog header (复 TRUNG TÂM ÔN LUYỆN SRS & Kỹ Năng Tabs)
    if (this.dom.headerContent) {
      if (state === 'catalog' || state === 'auth') {
        this.dom.headerContent.classList.remove('d-none');
      } else {
        this.dom.headerContent.classList.add('d-none');
      }
    }
  }

  /**
   * Renders the current active card in the session.
   */
  renderCurrentCard() {
    speechController.cancel();
    this.cleanupTimer();
    this.destroyWritingEngines();
    this.destroyListeningIme();
    this.cleanUpReadingMedia();
    this.cleanUpReadingMedia();
    this.isFlipped = false;
    this.isSubmitting = false;

    if (this.dom.ratingFeedback) {
      this.dom.ratingFeedback.textContent = '';
    }

    const queueItem = this.sessionQueue[this.currentIndex];
    if (!queueItem || !queueItem.card) {
      this.showCompletedState();
      return;
    }

    const card = queueItem.card;
    const isVocab = (card.itemType || '').toUpperCase() === 'VOCABULARY';

    // Update session header badge & progress
    this.updateSessionHeader(card);

    if (this.activeMode === 'writing') {
      // Writing mode: hide flashcard, listening, reading & rating bar, show dedicated writing room
      if (this.dom.flashcardContainer) this.dom.flashcardContainer.classList.add('d-none');
      if (this.dom.ratingSection) this.dom.ratingSection.classList.add('d-none');
      if (this.dom.listeningRoom) this.dom.listeningRoom.classList.add('d-none');
      if (this.dom.readingRoom) this.dom.readingRoom.classList.add('d-none');
      if (this.dom.writingRoom) this.dom.writingRoom.classList.remove('d-none');

      this.renderWritingRoomCard(card);
    } else if (this.activeMode === 'listening') {
      // Listening mode: hide flashcard, writing, reading & rating bar, show dedicated listening room
      if (this.dom.flashcardContainer) this.dom.flashcardContainer.classList.add('d-none');
      if (this.dom.ratingSection) this.dom.ratingSection.classList.add('d-none');
      if (this.dom.writingRoom) this.dom.writingRoom.classList.add('d-none');
      if (this.dom.readingRoom) this.dom.readingRoom.classList.add('d-none');
      if (this.dom.listeningRoom) this.dom.listeningRoom.classList.remove('d-none');

      this.renderListeningRoomCard(card);
    } else if (this.activeMode === 'reading') {
      // Reading mode: hide flashcard, writing, listening & rating bar, show dedicated reading room
      if (this.dom.flashcardContainer) this.dom.flashcardContainer.classList.add('d-none');
      if (this.dom.ratingSection) this.dom.ratingSection.classList.add('d-none');
      if (this.dom.writingRoom) this.dom.writingRoom.classList.add('d-none');
      if (this.dom.listeningRoom) this.dom.listeningRoom.classList.add('d-none');
      if (this.dom.readingRoom) this.dom.readingRoom.classList.remove('d-none');

      this.renderReadingRoomCard(card);
    } else {
      // Flashcard mode: show flashcard & rating bar, hide writing, listening & reading rooms
      if (this.dom.writingRoom) this.dom.writingRoom.classList.add('d-none');
      if (this.dom.listeningRoom) this.dom.listeningRoom.classList.add('d-none');
      if (this.dom.readingRoom) this.dom.readingRoom.classList.add('d-none');
      if (this.dom.flashcardContainer) this.dom.flashcardContainer.classList.remove('d-none');
      if (this.dom.ratingSection) this.dom.ratingSection.classList.remove('d-none');

      this.renderFlashcardCard(card, queueItem);
    }

    // Start Reaction Timer
    this.startReactionTimer();
  }

  /**
   * Updates session header mode badge, counter, and progress bar.
   * @param {Object} card
   */
  updateSessionHeader(card) {
    const totalCount = this.sessionQueue.length;
    const currentNum = this.currentIndex + 1;
    const remainingCount = totalCount - currentNum;

    if (this.dom.progressText) {
      this.dom.progressText.textContent = `Thẻ ${currentNum} / ${totalCount}`;
    }

    if (this.dom.sessionTitleText) {
      if (this.currentChapterTitle) {
        this.dom.sessionTitleText.textContent = this.currentChapterTitle;
      } else if (this.activeGroup.startsWith('hsk') || this.lessonId) {
        const num = this.lessonId || (this.currentChapterIdx != null ? this.currentChapterIdx + 1 : 1);
        this.dom.sessionTitleText.textContent = `Bài ${String(num).padStart(2, '0')}`;
      } else {
        const num = this.currentChapterIdx != null ? this.currentChapterIdx + 1 : 1;
        this.dom.sessionTitleText.textContent = `Chặng ${String(num).padStart(2, '0')}`;
      }
    }

    if (this.dom.modeBadge) {
      if (this.mode === 'LESSON_PRACTICE') {
        this.dom.modeBadge.textContent = `Luyện tự do #${this.lessonId || ''} (Không đổi SRS)`;
      } else if (this.mode === 'LESSON_NEW_CARDS') {
        this.dom.modeBadge.textContent = `Bài học #${this.lessonId || ''}`;
      } else if (this.mode === 'DUE_CARDS' && this.lessonId) {
        this.dom.modeBadge.textContent = `Thẻ đến hạn #${this.lessonId}`;
      } else {
        const modeName = this.activeMode === 'writing' 
          ? 'Luyện viết' 
          : (this.activeMode === 'listening' ? 'Luyện nghe' : (this.activeMode === 'reading' ? 'Luyện đọc' : 'Flashcard'));
        const typeName = (card.itemType || '').toUpperCase() === 'RADICAL' ? 'Bộ thủ' : 'Từ vựng';
        const actionLabel = this.isReviewMode ? 'Học lại' : 'Học tiếp';
        this.dom.modeBadge.textContent = `${modeName} • ${typeName} (${actionLabel})`;
      }
    }

    if (this.dom.progressBarContainer && this.dom.progressBarFill) {
      this.dom.progressBarContainer.setAttribute('aria-valuenow', String(currentNum));
      this.dom.progressBarContainer.setAttribute('aria-valuemax', String(totalCount));
      const pct = Math.min(100, Math.round((currentNum / totalCount) * 100));
      this.dom.progressBarFill.style.width = `${pct}%`;
    }
  }

  /**
   * Starts or restarts reaction timer for current item.
   */
  startReactionTimer() {
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
   * Renders Flashcard front and back faces.
   * @param {Object} card 
   * @param {Object} queueItem
   */
  renderFlashcardCard(card, queueItem) {
    if (this.dom.flashcard) {
      this.dom.flashcard.classList.remove('flipped');
      this.dom.flashcard.setAttribute('aria-expanded', 'false');
    }

    if (this.dom.cardFront) this.dom.cardFront.setAttribute('aria-hidden', 'false');
    if (this.dom.cardBack) this.dom.cardBack.setAttribute('aria-hidden', 'true');

    this.setRatingButtonsEnabled(true);

    const isVocab = (card.itemType || '').toUpperCase() === 'VOCABULARY';

    // Front Face
    if (this.dom.cardTypeFront) {
      this.dom.cardTypeFront.textContent = isVocab ? 'Từ vựng' : 'Bộ thủ';
    }
    if (this.dom.cardSkillBadgeFront) {
      this.dom.cardSkillBadgeFront.textContent = '🎴 Flashcard';
    }
    if (this.dom.cardStatusFront) {
      if (queueItem._requeued) {
        this.dom.cardStatusFront.textContent = 'Học lại';
        this.dom.cardStatusFront.classList.remove('d-none');
      } else {
        this.dom.cardStatusFront.classList.add('d-none');
      }
    }

    if (this.dom.cardFrontHanzi) this.dom.cardFrontHanzi.textContent = card.hanzi || '';
    if (this.dom.cardFrontPinyin) this.dom.cardFrontPinyin.textContent = card.pinyin || '';

    // Speech button accessible names
    const speechLabel = `Phát âm ${isVocab ? 'từ' : 'bộ thủ'} ${card.hanzi || ''}`;
    if (this.dom.btnAudioPronounceFront) {
      this.dom.btnAudioPronounceFront.setAttribute('aria-label', speechLabel);
    }
    if (this.dom.btnAudioPronounceBack) {
      this.dom.btnAudioPronounceBack.setAttribute('aria-label', speechLabel);
    }

    // Back Face
    // Ẩn nhãn loại thẻ ở góc trên bên trái per Requirement 1 & 2
    if (this.dom.cardTypeBack) {
      this.dom.cardTypeBack.textContent = isVocab ? 'Từ vựng' : 'Bộ thủ';
      this.dom.cardTypeBack.classList.add('d-none');
    }
    if (this.dom.cardBackHanzi) this.dom.cardBackHanzi.textContent = card.hanzi || '';
    if (this.dom.cardBackPinyin) this.dom.cardBackPinyin.textContent = card.pinyin || '';

    if (this.dom.cardBackMeaningHv) {
      if (card.meaningHanViet) {
        this.dom.cardBackMeaningHv.textContent = card.meaningHanViet;
        this.dom.cardBackMeaningHv.classList.remove('d-none');
      } else {
        this.dom.cardBackMeaningHv.classList.add('d-none');
      }
    }

    if (this.dom.cardBackMeaningVi) {
      this.dom.cardBackMeaningVi.textContent = card.meaningVi || '';
    }

    // Stroke count badge for Radicals
    if (this.dom.cardBackStrokeCount) {
      const hasValidStrokes = !isVocab && Number.isFinite(Number(card.strokeCount)) && Number(card.strokeCount) > 0;
      if (hasValidStrokes) {
        if (this.dom.radicalStrokeCountVal) {
          this.dom.radicalStrokeCountVal.textContent = String(card.strokeCount);
        }
        this.dom.cardBackStrokeCount.classList.remove('d-none');
      } else {
        this.dom.cardBackStrokeCount.classList.add('d-none');
      }
    }

    // Constituent Radicals Row (shown only for VOCABULARY on card back)
    if (this.dom.cardBackRadicalsRow) {
      if (!isVocab) {
        this.dom.cardBackRadicalsRow.classList.add('d-none');
        if (this.dom.cardBackRadicalsContent) {
          this.dom.cardBackRadicalsContent.textContent = '';
        }
      } else {
        this.dom.cardBackRadicalsRow.classList.remove('d-none');
        const vocabId = card.itemId || card.vocabId || card.id;

        if (Array.isArray(card.radicals)) {
          this.vocabDetailCache.set(vocabId, card.radicals);
          if (this.dom.cardBackRadicalsContent) {
            this.dom.cardBackRadicalsContent.textContent = formatConstituentRadicalsText(card.radicals, card.hanzi);
          }
        } else if (this.vocabDetailCache.has(vocabId)) {
          const cachedRadicals = this.vocabDetailCache.get(vocabId);
          if (this.dom.cardBackRadicalsContent) {
            this.dom.cardBackRadicalsContent.textContent = formatConstituentRadicalsText(cachedRadicals, card.hanzi);
          }
        } else {
          if (this.dom.cardBackRadicalsContent) {
            this.dom.cardBackRadicalsContent.textContent = 'Đang tải bộ thủ...';
          }
          const currentId = vocabId;
          const currentWord = card.hanzi;
          apiClient(`/vocabulary/${currentId}`)
            .then(detail => {
              const radicals = Array.isArray(detail?.radicals) ? detail.radicals : [];
              this.vocabDetailCache.set(currentId, radicals);
              const currentQueueItem = this.sessionQueue?.[this.currentIndex];
              if (!currentQueueItem || !currentQueueItem.card) return;
              const activeId = currentQueueItem.card.itemId || currentQueueItem.card.vocabId || currentQueueItem.card.id;
              if (activeId !== currentId || (currentQueueItem.card.itemType || '').toUpperCase() !== 'VOCABULARY') {
                return;
              }
              if (this.dom.cardBackRadicalsContent) {
                this.dom.cardBackRadicalsContent.textContent = formatConstituentRadicalsText(radicals, currentWord);
              }
            })
            .catch(() => {
              const currentQueueItem = this.sessionQueue?.[this.currentIndex];
              if (!currentQueueItem || !currentQueueItem.card) return;
              const activeId = currentQueueItem.card.itemId || currentQueueItem.card.vocabId || currentQueueItem.card.id;
              if (activeId !== currentId) return;
              if (this.dom.cardBackRadicalsContent) {
                this.dom.cardBackRadicalsContent.textContent = 'Chưa có dữ liệu bộ thủ đã xác minh';
              }
            });
        }
      }
    }

    // Example Box vs Standalone Note Box Mounting (Requirement 2 & 3)
    const hasExample = Boolean(card.exampleSentence && card.exampleSentence.trim());
    if (hasExample) {
      if (this.dom.cardBackExampleSentence) this.dom.cardBackExampleSentence.textContent = card.exampleSentence;
      if (this.dom.cardBackExampleTranslation) this.dom.cardBackExampleTranslation.textContent = card.exampleTranslation || '';
      if (this.dom.cardBackExampleBox) {
        this.dom.cardBackExampleBox.classList.remove('d-none');
        if (this.dom.cardBackNoteDivider) this.dom.cardBackNoteDivider.classList.remove('d-none');
        if (this.dom.cardInlineNoteContainer) this.dom.cardBackExampleBox.appendChild(this.dom.cardInlineNoteContainer);
      }
      if (this.dom.cardBackNoteStandalone) {
        this.dom.cardBackNoteStandalone.classList.add('d-none');
      }
    } else {
      if (this.dom.cardBackExampleBox) {
        this.dom.cardBackExampleBox.classList.add('d-none');
      }
      if (this.dom.cardBackNoteStandalone) {
        if (this.dom.cardInlineNoteContainer) this.dom.cardBackNoteStandalone.appendChild(this.dom.cardInlineNoteContainer);
        this.dom.cardBackNoteStandalone.classList.remove('d-none');
      }
    }

    // Ẩn nút Ghi chú ở góc trên bên phải per Requirement 1 & 2
    if (this.dom.btnCardNote) {
      this.dom.btnCardNote.classList.add('d-none');
    }

    // Ẩn 2-Column Notes section cũ nếu còn tồn tại
    if (this.dom.cardBackNotesSection) {
      this.dom.cardBackNotesSection.classList.add('d-none');
    }

    // Reset inline note edit state if currently active
    if (this.isEditingInlineNote) {
      this.exitInlineNoteEdit(true);
    }

    // Load and render compact single note (áp dụng cho cả 50 bộ thủ, 214 bộ thủ, HSK 1, 2, 3)
    this.loadNotesForCard(card);
  }

  /**
   * Switches the single inline note into editable mode.
   */
  enterInlineNoteEdit() {
    if (!this.dom.cardInlineNoteDisplay || !this.dom.cardInlineNoteEditWrapper || !this.dom.cardInlineNoteInput) return;
    const queueItem = this.sessionQueue?.[this.currentIndex];
    if (!queueItem || !queueItem.card) return;

    this.editingCard = queueItem.card;
    this.editingNote = this.currentCardNote;
    this.isEditingInlineNote = true;
    this.dom.cardInlineNoteDisplay.classList.add('d-none');
    this.dom.cardInlineNoteEditWrapper.classList.remove('d-none');

    const currentContent = this.currentCardNote?.content || '';
    this.dom.cardInlineNoteInput.value = currentContent;
    this.updateInlineNoteCharCount(currentContent.length);
    this.dom.cardInlineNoteInput.focus();
    this.dom.cardInlineNoteInput.select();
  }

  /**
   * Updates live character counter badge (e.g. 0/150).
   * @param {number} len 
   */
  updateInlineNoteCharCount(len) {
    if (!this.dom.cardInlineNoteCharCount) return;
    this.dom.cardInlineNoteCharCount.textContent = `${len}/150`;
    if (len >= 150) {
      this.dom.cardInlineNoteCharCount.classList.add('is-limit');
    } else {
      this.dom.cardInlineNoteCharCount.classList.remove('is-limit');
    }
  }

  /**
   * Displays micro-status indicator ("✓ Đã lưu", "Đang lưu...", "Đã xóa") inside the note container.
   * @param {'saving'|'saved'|'deleted'|'error'} type 
   */
  showInlineNoteSaveStatus(type = 'saved') {
    if (!this.dom.cardInlineNoteStatus) return;
    if (this._noteStatusTimer) {
      clearTimeout(this._noteStatusTimer);
      this._noteStatusTimer = null;
    }
    const statusEl = this.dom.cardInlineNoteStatus;
    statusEl.classList.remove('d-none', 'bg-success-subtle', 'text-success', 'border-success-subtle', 'bg-secondary-subtle', 'text-secondary', 'border-secondary-subtle', 'bg-danger-subtle', 'text-danger', 'border-danger-subtle', 'bg-info-subtle', 'text-info', 'border-info-subtle', 'is-fading');

    if (type === 'saved') {
      statusEl.className = 'card-inline-note-status badge bg-success-subtle text-success border border-success-subtle is-visible';
      statusEl.textContent = '✓ Đã lưu';
    } else if (type === 'deleted') {
      statusEl.className = 'card-inline-note-status badge bg-secondary-subtle text-secondary border border-secondary-subtle is-visible';
      statusEl.textContent = 'Đã xóa';
    } else if (type === 'saving') {
      statusEl.className = 'card-inline-note-status badge bg-info-subtle text-info border border-info-subtle is-visible';
      statusEl.textContent = 'Đang lưu...';
    } else {
      statusEl.className = 'card-inline-note-status badge bg-danger-subtle text-danger border border-danger-subtle is-visible';
      statusEl.textContent = 'Lỗi lưu';
    }

    if (type !== 'saving') {
      this._noteStatusTimer = setTimeout(() => {
        statusEl.classList.add('is-fading');
        setTimeout(() => {
          statusEl.classList.add('d-none');
          statusEl.classList.remove('is-visible', 'is-fading');
        }, 250);
      }, 2000);
    }
  }

  /**
   * Renders the single inline note into display mode.
   * @param {Object|null} note 
   */
  renderInlineNoteDisplay(note) {
    if (!this.dom.cardInlineNoteText) return;
    const content = (note?.content || '').trim();
    if (content) {
      this.dom.cardInlineNoteText.textContent = `📝 ${content}`;
      this.dom.cardInlineNoteText.classList.remove('is-empty');
    } else {
      this.dom.cardInlineNoteText.textContent = '📝 Thêm mẹo nhớ hoặc ghi chú... (Bấm vào để nhập)';
      this.dom.cardInlineNoteText.classList.add('is-empty');
    }
  }

  /**
   * Exits editable mode and optionally auto-saves updated content.
   * @param {boolean} save 
   */
  async exitInlineNoteEdit(save = true) {
    if (!this.isEditingInlineNote) return;
    this.isEditingInlineNote = false;

    if (this.dom.cardInlineNoteEditWrapper) {
      this.dom.cardInlineNoteEditWrapper.classList.add('d-none');
    }
    if (this.dom.cardInlineNoteDisplay) {
      this.dom.cardInlineNoteDisplay.classList.remove('d-none');
    }

    const targetCard = this.editingCard;
    const targetNote = this.editingNote;
    this.editingCard = null;
    this.editingNote = null;

    if (save && this.dom.cardInlineNoteInput && targetCard) {
      const rawVal = this.dom.cardInlineNoteInput.value || '';
      const trimmed = rawVal.trim().slice(0, 150);
      const prevVal = (targetNote?.content || '').trim();

      // UX Optimistic update: instantly reflect user changes without waiting for API roundtrip
      if (trimmed) {
        if (this.dom.cardInlineNoteText) {
          this.dom.cardInlineNoteText.textContent = `📝 ${trimmed}`;
          this.dom.cardInlineNoteText.classList.remove('is-empty');
        }
      } else {
        if (this.dom.cardInlineNoteText) {
          this.dom.cardInlineNoteText.textContent = '📝 Thêm mẹo nhớ hoặc ghi chú... (Bấm vào để nhập)';
          this.dom.cardInlineNoteText.classList.add('is-empty');
        }
      }

      if (trimmed !== prevVal) {
        this.showInlineNoteSaveStatus('saving');
        await this.saveInlineCardNote(trimmed, targetCard, targetNote);
      } else {
        const currentQueueItem = this.sessionQueue?.[this.currentIndex];
        if (currentQueueItem?.card &&
            currentQueueItem.card.itemId === targetCard.itemId &&
            (currentQueueItem.card.itemType || '').toUpperCase() === (targetCard.itemType || '').toUpperCase()) {
          this.renderInlineNoteDisplay(targetNote);
        }
      }
    } else if (targetCard) {
      const currentQueueItem = this.sessionQueue?.[this.currentIndex];
      if (currentQueueItem?.card &&
          currentQueueItem.card.itemId === targetCard.itemId &&
          (currentQueueItem.card.itemType || '').toUpperCase() === (targetCard.itemType || '').toUpperCase()) {
        this.renderInlineNoteDisplay(targetNote);
      }
    }
  }

  /**
   * Loads the single personal note for a vocabulary or radical card.
   * @param {Object|number} target Card object or itemId
   */
  async loadNotesForCard(target) {
    let card = null;
    if (target && typeof target === 'object') {
      card = target;
    } else {
      const queueItem = this.sessionQueue?.[this.currentIndex];
      if (queueItem?.card) card = queueItem.card;
    }
    const itemTypeUpper = (card?.itemType || 'VOCABULARY').toUpperCase();
    const isRadical = itemTypeUpper === 'RADICAL';
    const itemId = card ? card.itemId : target;
    if (!itemId) return;
    const cacheKey = `${itemTypeUpper}_${itemId}`;

    const isStillCurrentCard = () => {
      const currentQueueItem = this.sessionQueue?.[this.currentIndex];
      return currentQueueItem?.card &&
        currentQueueItem.card.itemId === itemId &&
        (currentQueueItem.card.itemType || 'VOCABULARY').toUpperCase() === itemTypeUpper;
    };

    // Dismiss any active save status pill when switching/loading card
    if (this.dom.cardInlineNoteStatus) {
      if (this._noteStatusTimer) {
        clearTimeout(this._noteStatusTimer);
        this._noteStatusTimer = null;
      }
      this.dom.cardInlineNoteStatus.classList.add('d-none');
      this.dom.cardInlineNoteStatus.classList.remove('is-visible', 'is-fading');
    }

    // Check cache first
    if (this.notesCache.has(cacheKey)) {
      const cached = this.notesCache.get(cacheKey);
      const note = Array.isArray(cached) ? (cached[0] || null) : (cached || null);
      if (isStillCurrentCard()) {
        this.currentCardNote = note;
        this.renderInlineNoteDisplay(note);
      }
      return;
    }

    // Default to empty display while fetching
    if (isStillCurrentCard()) {
      this.currentCardNote = null;
      this.renderInlineNoteDisplay(null);
    }

    try {
      let note = null;
      if (isRadical) {
        const rawNotes = this.getRadicalNotes(itemId);
        note = Array.isArray(rawNotes) ? (rawNotes[0] || null) : (rawNotes || null);
        this.notesCache.set(cacheKey, note ? [note] : []);
      } else {
        const resp = await apiClient(`/vocabularies/${itemId}/notes`, {
          params: { page: 0, size: 5 }
        }).catch(() => null);

        const items = Array.isArray(resp?.items) ? resp.items : Array.isArray(resp?.data?.items) ? resp.data.items : Array.isArray(resp) ? resp : [];
        note = items.length > 0 ? items[0] : null;
        if (!note) {
          try {
            const localSaved = localStorage.getItem(`srs_vocab_note_${itemId}`);
            if (localSaved) note = JSON.parse(localSaved);
          } catch (_) {}
        }
        this.notesCache.set(cacheKey, note ? [note] : []);
      }

      // Check that the current queue item still matches this itemId AND itemType
      if (isStillCurrentCard()) {
        this.currentCardNote = note;
        this.renderInlineNoteDisplay(note);
      }
    } catch (e) {
      if (isStillCurrentCard()) {
        this.renderInlineNoteDisplay(null);
      }
    }
  }

  /**
   * Helper to retrieve storage key for radical notes fallback.
   * @param {number} radicalId
   * @returns {string}
   */
  getRadicalNotesStorageKey(radicalId) {
    const user = authManager.getUser();
    const userId = user?.accountId || 'local';
    return `srs_notes_radical_${userId}_${radicalId}`;
  }

  /**
   * Retrieves stored personal notes for a radical item using srs_radical_notes localStorage.
   * @param {number} radicalId
   * @returns {Array}
   */
  getRadicalNotes(radicalId) {
    try {
      const data = localStorage.getItem('srs_radical_notes');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          const found = parsed.find(n => Number(n.radicalId ?? n.itemId ?? n.id) === Number(radicalId));
          if (found) return [found];
        } else if (parsed && typeof parsed === 'object') {
          const item = parsed[radicalId] ?? parsed[String(radicalId)];
          if (item) {
            return typeof item === 'string'
              ? [{ noteId: radicalId, radicalId: Number(radicalId), content: item }]
              : [item];
          }
        }
      }
      // User-specific fallback key
      const userKey = this.getRadicalNotesStorageKey(radicalId);
      const userData = localStorage.getItem(userKey);
      if (userData) {
        return JSON.parse(userData);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Saves or updates the single note for the current card.
   * Auto-limits to 150 chars.
   * Supports Radicals (srs_radical_notes) and Vocabulary (/api/v1/vocabularies/{id}/notes).
   * @param {string} content
   * @param {Object|null} [targetCard=null]
   * @param {Object|null} [targetNote=null]
   */
  async saveInlineCardNote(content, targetCard = null, targetNote = null) {
    const card = targetCard || this.sessionQueue?.[this.currentIndex]?.card;
    if (!card) return;
    const noteToUpdate = targetNote || this.currentCardNote;

    const isRadical = (card.itemType || '').toUpperCase() === 'RADICAL';
    const isVocab = (card.itemType || '').toUpperCase() === 'VOCABULARY';
    if (!isRadical && !isVocab) return;

    const trimmed = (content || '').trim().slice(0, 150);
    const itemTypeUpper = (card.itemType || '').toUpperCase();
    const cacheKey = `${itemTypeUpper}_${card.itemId}`;

    const isStillCurrentCard = () => {
      const currentQueueItem = this.sessionQueue?.[this.currentIndex];
      return currentQueueItem?.card &&
        currentQueueItem.card.itemId === card.itemId &&
        (currentQueueItem.card.itemType || '').toUpperCase() === itemTypeUpper;
    };

    if (isRadical) {
      const radicalId = card.itemId;
      const userKey = this.getRadicalNotesStorageKey(radicalId);

      // Save to srs_radical_notes in localStorage per requirement
      try {
        const raw = localStorage.getItem('srs_radical_notes');
        let notesMap = {};
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                const id = item?.radicalId ?? item?.itemId ?? item?.id;
                if (id != null) {
                  notesMap[String(id)] = item;
                }
              }
            } else if (parsed && typeof parsed === 'object') {
              notesMap = { ...parsed };
            }
          } catch (_) {}
        }
        if (!trimmed) {
          delete notesMap[radicalId];
          delete notesMap[String(radicalId)];
        } else {
          notesMap[String(radicalId)] = {
            noteId: noteToUpdate?.noteId || Date.now(),
            radicalId: Number(radicalId),
            content: trimmed,
            updatedAt: new Date().toISOString()
          };
        }
        localStorage.setItem('srs_radical_notes', JSON.stringify(notesMap));
      } catch (e) {
        console.warn('[Radical Note] LocalStorage error for srs_radical_notes:', e);
      }

      // Also sync userKey for fallback
      try {
        if (!trimmed) {
          localStorage.removeItem(userKey);
        } else {
          const noteObj = {
            noteId: noteToUpdate?.noteId || Date.now(),
            radicalId: Number(radicalId),
            content: trimmed,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem(userKey, JSON.stringify([noteObj]));
        }
      } catch (_) {}

      if (!trimmed) {
        this.notesCache.set(cacheKey, []);
        if (isStillCurrentCard()) {
          this.currentCardNote = null;
          this.renderInlineNoteDisplay(null);
        }
      } else {
        const noteObj = {
          noteId: noteToUpdate?.noteId || Date.now(),
          radicalId: Number(radicalId),
          content: trimmed,
          updatedAt: new Date().toISOString()
        };
        this.notesCache.set(cacheKey, [noteObj]);
        if (isStillCurrentCard()) {
          this.currentCardNote = noteObj;
          this.renderInlineNoteDisplay(noteObj);
        }
      }

      this.showInlineNoteSaveStatus(trimmed ? 'saved' : 'deleted');
      showToast({ type: 'success', title: 'Ghi chú', message: trimmed ? 'Đã lưu ghi chú.' : 'Đã xóa ghi chú.' });
      return;
    }

    // Vocabulary Card
    const vocabId = card.itemId;
    if (!trimmed) {
      if (noteToUpdate?.noteId) {
        try {
          await apiClient(`/notes/${noteToUpdate.noteId}`, { method: 'DELETE' });
        } catch (e) {
          console.warn('[Inline Note] Delete note error:', e);
        }
      }
      try {
        localStorage.removeItem(`srs_vocab_note_${vocabId}`);
      } catch (_) {}
      this.notesCache.set(cacheKey, []);
      if (isStillCurrentCard()) {
        this.currentCardNote = null;
        this.renderInlineNoteDisplay(null);
      }
      this.showInlineNoteSaveStatus('deleted');
      showToast({ type: 'info', title: 'Ghi chú', message: 'Đã xóa ghi chú.' });
      return;
    }

    // Update existing or create new
    if (noteToUpdate?.noteId) {
      try {
        const res = await apiClient(`/notes/${noteToUpdate.noteId}`, {
          method: 'PUT',
          body: { content: trimmed }
        });
        const updated = res?.data || res || { noteId: noteToUpdate.noteId, vocabId: Number(vocabId), content: trimmed, updatedAt: new Date().toISOString() };
        try {
          localStorage.setItem(`srs_vocab_note_${vocabId}`, JSON.stringify(updated));
        } catch (_) {}
        this.notesCache.set(cacheKey, [updated]);
        if (isStillCurrentCard()) {
          this.currentCardNote = updated;
          this.renderInlineNoteDisplay(updated);
        }
        this.showInlineNoteSaveStatus('saved');
        showToast({ type: 'success', title: 'Ghi chú', message: 'Đã cập nhật ghi chú.' });
      } catch (e) {
        console.warn('[Inline Note] Update API error, saving optimistic:', e);
        const fallback = { noteId: noteToUpdate.noteId, vocabId: Number(vocabId), content: trimmed, updatedAt: new Date().toISOString() };
        try {
          localStorage.setItem(`srs_vocab_note_${vocabId}`, JSON.stringify(fallback));
        } catch (_) {}
        this.notesCache.set(cacheKey, [fallback]);
        if (isStillCurrentCard()) {
          this.currentCardNote = fallback;
          this.renderInlineNoteDisplay(fallback);
        }
        this.showInlineNoteSaveStatus('saved');
        showToast({ type: 'info', title: 'Ghi chú', message: 'Đã lưu ghi chú vào phiên học.' });
      }
    } else {
      try {
        const res = await apiClient(`/vocabularies/${vocabId}/notes`, {
          method: 'POST',
          body: { content: trimmed }
        });
        const created = res?.data || res || { noteId: Date.now(), vocabId: Number(vocabId), content: trimmed, createdAt: new Date().toISOString() };
        try {
          localStorage.setItem(`srs_vocab_note_${vocabId}`, JSON.stringify(created));
        } catch (_) {}
        this.notesCache.set(cacheKey, [created]);
        if (isStillCurrentCard()) {
          this.currentCardNote = created;
          this.renderInlineNoteDisplay(created);
        }
        this.showInlineNoteSaveStatus('saved');
        showToast({ type: 'success', title: 'Ghi chú', message: 'Đã lưu ghi chú mới.' });
      } catch (e) {
        console.warn('[Inline Note] Create API error, saving optimistic:', e);
        const fallback = { noteId: Date.now(), vocabId: Number(vocabId), content: trimmed, createdAt: new Date().toISOString() };
        try {
          localStorage.setItem(`srs_vocab_note_${vocabId}`, JSON.stringify(fallback));
        } catch (_) {}
        this.notesCache.set(cacheKey, [fallback]);
        if (isStillCurrentCard()) {
          this.currentCardNote = fallback;
          this.renderInlineNoteDisplay(fallback);
        }
        this.showInlineNoteSaveStatus('saved');
        showToast({ type: 'info', title: 'Ghi chú', message: 'Đã lưu ghi chú vào phiên học.' });
      }
    }
  }

  /**
   * Compatibility wrapper for legacy saveCardNote calls.
   */
  async saveCardNote() {
    if (this.dom.cardNewNoteInput) {
      const content = (this.dom.cardNewNoteInput.value || '').trim();
      await this.saveInlineCardNote(content);
    }
  }

  /**
   * Renders the Writing Room for the current card.
   * Handles:
   * - 2-character words side-by-side (e.g. 学生)
   * - 1-character words / radicals
   * - Missing stroke detection
   * - NO 1-4 rating prompts
   * 
   * @param {Object} card
   */
  async renderWritingRoomCard(card) {
    this.destroyWritingEngines();
    this.isWritingOutlineShown = false;
    this.hasCompletedWritingForCurrentCard = false;
    this.isCurrentWritingCompleted = false;
    this.completedCharIndices = new Set();
    this.writingCharCount = 0;

    if (this.dom.btnWritingOutline) {
      this.dom.btnWritingOutline.classList.remove('d-none');
      this.dom.btnWritingOutline.textContent = '👁️ Xem gợi ý';
      this.dom.btnWritingOutline.setAttribute('aria-pressed', 'false');
    }

    if (this.dom.writingCompletionNotice) {
      this.dom.writingCompletionNotice.classList.add('d-none');
    }

    if (this.dom.btnWritingAudio) {
      this.dom.btnWritingAudio.classList.add('d-none');
    }

    const isVocab = (card.itemType || '').toUpperCase() === 'VOCABULARY';

    if (this.dom.writingRoomBadge) {
      this.dom.writingRoomBadge.textContent = isVocab ? 'Từ vựng' : 'Bộ thủ';
    }

    if (this.dom.writingPromptPinyin) {
      this.dom.writingPromptPinyin.textContent = card.pinyin || '';
    }

    if (this.dom.writingPromptHanViet) {
      if (card.meaningHanViet) {
        this.dom.writingPromptHanViet.textContent = `[${card.meaningHanViet}]`;
        this.dom.writingPromptHanViet.classList.remove('d-none');
      } else {
        this.dom.writingPromptHanViet.classList.add('d-none');
      }
    }

    if (this.dom.writingPromptMeaning) {
      this.dom.writingPromptMeaning.textContent = card.meaningVi || '';
    }

    if (this.dom.writingPromptStrokeCount) {
      const hasValidStrokes = !isVocab && Number.isFinite(Number(card.strokeCount)) && Number(card.strokeCount) > 0;
      if (hasValidStrokes) {
        this.dom.writingPromptStrokeCount.textContent = `Số nét chuẩn: ${card.strokeCount} nét`;
        this.dom.writingPromptStrokeCount.classList.remove('d-none');
      } else {
        this.dom.writingPromptStrokeCount.classList.add('d-none');
      }
    }

    // Configure Next button label and HIDE it in State 1 (keep space reserved)
    if (this.dom.btnWritingNext) {
      this.dom.btnWritingNext.textContent = isVocab ? 'Sang từ tiếp theo →' : 'Sang bộ thủ tiếp theo →';
      this.dom.btnWritingNext.classList.add('writing-next-hidden');
      this.dom.btnWritingNext.setAttribute('aria-hidden', 'true');
      this.dom.btnWritingNext.setAttribute('tabindex', '-1');
    }

    // Extract characters for canvas
    const chars = splitHanziCharacters(card.hanzi || card.character || '');
    const container = this.dom.writingCanvasContainer;
    if (!container) return;
    container.replaceChildren();

    this.totalRequiredCharCount = chars.length;

    if (chars.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'text-muted py-3 text-center';
      emptyMsg.textContent = 'Không có ký tự Hán hợp lệ để luyện viết.';
      container.appendChild(emptyMsg);
      this.hasCompletedWritingForCurrentCard = false;
      this.isCurrentWritingCompleted = false;
      return;
    }

    // Check stroke data coverage for all characters
    const strokeChecks = await Promise.all(chars.map(async c => ({ char: c, data: await loadStrokeData(c) })));
    const missing = strokeChecks.filter(s => !s.data).map(s => s.char);

    if (missing.length > 0) {
      const msg = missing.length === 1
        ? `Chữ [${missing[0]}] hiện chưa có dữ liệu nét chi tiết.`
        : `Các chữ [${missing.join(', ')}] hiện chưa có dữ liệu nét chi tiết.`;
      if (this.dom.writingMissingWarning) {
        this.dom.writingMissingWarning.replaceChildren();
        const warnText = document.createElement('span');
        warnText.textContent = `${msg} `;
        this.dom.writingMissingWarning.appendChild(warnText);

        const retryBtn = document.createElement('button');
        retryBtn.type = 'button';
        retryBtn.className = 'btn btn-sm btn-outline-secondary py-0 px-2 ms-2';
        retryBtn.textContent = '🔄 Thử tải lại';
        retryBtn.onclick = () => this.renderWritingRoomCard(card);
        this.dom.writingMissingWarning.appendChild(retryBtn);

        const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.className = 'btn btn-sm btn-outline-secondary py-0 px-2 ms-1';
        backBtn.textContent = 'Quay lại';
        backBtn.onclick = () => this.showCatalogSelection();
        this.dom.writingMissingWarning.appendChild(backBtn);

        this.dom.writingMissingWarning.classList.remove('d-none');
      }
    } else {
      if (this.dom.writingMissingWarning) {
        this.dom.writingMissingWarning.classList.add('d-none');
      }
    }

    // Mount canvas boxes
    // For 2 characters: side-by-side flex boxes
    // For 1 character: single box
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const boxWrapper = document.createElement('div');
      boxWrapper.className = 'd-flex flex-column align-items-center';

      if (chars.length > 1) {
        const charLabel = document.createElement('span');
        charLabel.className = 'small fw-bold text-secondary mb-1';
        charLabel.textContent = `Chữ ${i + 1}: ${char}`;
        boxWrapper.appendChild(charLabel);
      }

      const canvasBox = document.createElement('div');
      canvasBox.className = 'writing-rice-grid-box position-relative rounded-2 border shadow-sm';
      canvasBox.style.width = '170px';
      canvasBox.style.height = '170px';
      canvasBox.style.touchAction = 'none';

      // Rice grid SVG
      const gridSvg = createRiceGridSvg(170);
      canvasBox.appendChild(gridSvg);

      // Mount element for writer
      const targetMount = document.createElement('div');
      targetMount.className = 'position-absolute top-0 start-0 w-100 h-100';
      canvasBox.appendChild(targetMount);
      boxWrapper.appendChild(canvasBox);

      container.appendChild(boxWrapper);

      // Initialize CharacterWritingEngine in QUIZ mode
      try {
        const engine = new CharacterWritingEngine({
          targetElement: targetMount,
          width: 170,
          height: 170,
          strokeColor: '#1976D2',
          radicalColor: '#C83C23',
          outlineColor: '#D1D5DB',
          onComplete: () => {
            this.handleWritingCharComplete(i);
          }
        });
        const loaded = await engine.load(char, WRITING_MODES.QUIZ);
        if (loaded) {
          this.writingEngines.push(engine);
        } else {
          // Render fallback character if stroke data is not available
          targetMount.replaceChildren();
          const fallbackMsg = document.createElement('div');
          fallbackMsg.className = 'd-flex flex-column align-items-center justify-content-center h-100 text-center p-2';
          const charSpan = document.createElement('span');
          charSpan.className = 'fs-2 fw-bold text-dark font-hanzi';
          charSpan.lang = 'zh-Hans';
          charSpan.textContent = char;
          const noteSpan = document.createElement('span');
          noteSpan.className = 'small text-muted mt-1';
          noteSpan.textContent = 'Chưa có nét';
          fallbackMsg.appendChild(charSpan);
          fallbackMsg.appendChild(noteSpan);
          targetMount.appendChild(fallbackMsg);
        }
      } catch (err) {
        console.warn(`[Writing Mount] Engine init failed for ${char}:`, err);
      }
    }

    this.writingCharCount = this.writingEngines.length;
    if (this.writingCharCount === 0 || this.writingCharCount < this.totalRequiredCharCount) {
      this.hasCompletedWritingForCurrentCard = false;
      this.isCurrentWritingCompleted = false;
    }
  }

  /**
   * Handles character-level stroke completion from CharacterWritingEngine.
   * @param {number} charIndex 
   */
  handleWritingCharComplete(charIndex) {
    this.completedCharIndices.add(charIndex);

    // Provide immediate per-character completion feedback
    if (this.dom?.writingCanvasContainer) {
      const boxes = this.dom.writingCanvasContainer.querySelectorAll('.writing-rice-grid-box');
      if (boxes[charIndex]) {
        boxes[charIndex].classList.add('is-completed');
      }
    }

    // Only mark item completed if ALL required characters are loaded and completed
    if (
      this.totalRequiredCharCount > 0 &&
      this.writingEngines.length === this.totalRequiredCharCount &&
      this.completedCharIndices.size >= this.totalRequiredCharCount
    ) {
      this.handleWritingItemCompleted();
    }
  }

  /**
   * Handles overall item completion (Trạng thái 2).
   */
  handleWritingItemCompleted() {
    this.hasCompletedWritingForCurrentCard = true;
    this.isCurrentWritingCompleted = true;

    // 1. Tự động phát âm thanh đọc và hiển thị icon loa bên cạnh Pinyin
    if (this.dom?.btnWritingAudio) {
      this.dom.btnWritingAudio.classList.remove('d-none');
    }
    if (this.dom) {
      this.playPronunciation(this.dom.btnWritingAudio);
    }

    // 2. Đổi viền ô vuông sang màu xanh lá cây và hiện dòng chữ nhỏ "✓ Hoàn thành!"
    if (this.dom?.writingCanvasContainer) {
      const boxes = this.dom.writingCanvasContainer.querySelectorAll('.writing-rice-grid-box');
      boxes.forEach(b => b.classList.add('is-completed'));
    }
    if (this.dom?.writingCompletionNotice) {
      this.dom.writingCompletionNotice.classList.remove('d-none');
    }

    // 3. Ẩn nút [Xem gợi ý], chỉ giữ lại 2 nút [Phát lại nét] và [Viết lại] căn giữa
    if (this.dom?.btnWritingOutline) {
      this.dom.btnWritingOutline.classList.add('d-none');
    }

    // 4. Mở khóa và hiển thị vĩnh viễn nút "Sang từ tiếp theo →"
    if (this.dom?.btnWritingNext) {
      this.dom.btnWritingNext.classList.remove('writing-next-hidden');
      this.dom.btnWritingNext.removeAttribute('aria-hidden');
      this.dom.btnWritingNext.removeAttribute('tabindex');
    }
  }

  /**
   * Replays stroke order for active writing character(s).
   */
  replayWriting() {
    this.writingEngines.forEach(eng => {
      try {
        if (eng.writer) {
          eng.writer.animateCharacter({
            onComplete: () => {
              try {
                if (!this.isCurrentWritingCompleted) {
                  if (typeof eng.startQuizSession === 'function') {
                    eng.startQuizSession();
                  } else if (eng.writer && typeof eng.writer.quiz === 'function') {
                    eng.writer.quiz();
                  }
                }
              } catch (e) {}
            }
          });
        }
      } catch (e) {}
    });
  }

  /**
   * Toggles outline hint for active writing character(s).
   */
  toggleWritingOutline() {
    const willShow = !this.isWritingOutlineShown;
    this.isWritingOutlineShown = willShow;

    this.writingEngines.forEach(eng => {
      try {
        if (eng.writer) {
          if (willShow) {
            eng.writer.showOutline();
            eng.isOutlineShown = true;
          } else {
            eng.writer.hideOutline();
            eng.isOutlineShown = false;
          }
        }
      } catch (e) {}
    });

    if (this.dom?.btnWritingOutline) {
      this.dom.btnWritingOutline.textContent = willShow ? '👁️ Ẩn gợi ý' : '👁️ Xem gợi ý';
      this.dom.btnWritingOutline.setAttribute('aria-pressed', willShow ? 'true' : 'false');
    }
  }

  /**
   * Clears writing canvas and resets quiz for active character(s).
   * (Trạng thái 3: Khi người dùng bấm "Viết lại" sau khi đã hoàn thành lần đầu)
   */
  clearWriting() {
    this.completedCharIndices.clear();
    this.isCurrentWritingCompleted = false;

    this.writingEngines.forEach(eng => {
      try {
        if (typeof eng.startQuizSession === 'function') {
          eng.startQuizSession();
        } else if (eng.writer && typeof eng.writer.quiz === 'function') {
          eng.writer.quiz();
        }
      } catch (e) {}
    });

    // Reset rice grid boxes border to normal gray
    if (this.dom?.writingCanvasContainer) {
      const boxes = this.dom.writingCanvasContainer.querySelectorAll('.writing-rice-grid-box');
      boxes.forEach(b => b.classList.remove('is-completed'));
    }

    // Hide completion notice
    if (this.dom?.writingCompletionNotice) {
      this.dom.writingCompletionNotice.classList.add('d-none');
    }

    // Show outline hint button again
    if (this.dom?.btnWritingOutline) {
      this.dom.btnWritingOutline.classList.remove('d-none');
      this.dom.btnWritingOutline.textContent = '👁️ Xem gợi ý';
      this.dom.btnWritingOutline.setAttribute('aria-pressed', 'false');
      this.isWritingOutlineShown = false;
    }

    // IMPORTANT: If user has completed this card at least once,
    // the Next button (and Space/Enter shortcuts) MUST REMAIN VISIBLE & ACTIVE!
    if (this.hasCompletedWritingForCurrentCard && this.dom?.btnWritingNext) {
      this.dom.btnWritingNext.classList.remove('writing-next-hidden');
      this.dom.btnWritingNext.removeAttribute('aria-hidden');
      this.dom.btnWritingNext.removeAttribute('tabindex');
    }
  }

  /**
   * Advances to next item in Writing mode.
   * Saves progress independently under HOC_HAN_NGU_WRITING_PROGRESS.
   */
  async nextWritingItem() {
    if (this.isSubmittingWriting) return;
    if (this.isSubmitting) return;

    // Check completion condition: only allow next if user actually completed writing for this card
    if (this.dom?.btnWritingNext && this.hasCompletedWritingForCurrentCard === false) {
      showToast({
        type: 'warning',
        title: 'Chưa hoàn thành',
        message: 'Vui lòng hoàn thành viết trước khi chuyển sang từ tiếp theo.'
      });
      return;
    }

    this.isSubmittingWriting = true;
    if (this.dom?.btnWritingNext) {
      this.dom.btnWritingNext.disabled = true;
      this.dom.btnWritingNext.setAttribute('aria-busy', 'true');
    }

    try {
      this.cleanupTimer();
      const elapsedSeconds = calculateReviewTime(this.cardStartTime, Date.now());

      // Record progress and SRS review if in normal mode
      if (!this.isReviewMode) {
        if (authManager.isAuthenticated() && this.sessionQueue[this.currentIndex]?.card) {
          const card = this.sessionQueue[this.currentIndex].card;
          const payload = buildReviewPayload({
            itemType: card.itemType || 'VOCABULARY',
            itemId: card.itemId,
            cardType: 'WRITING',
            rating: 3,
            reviewTimeSeconds: elapsedSeconds
          });

          try {
            await apiClient('/srs/review', {
              method: 'POST',
              body: payload
            });
          } catch (apiErr) {
            console.error('[SRS Writing Review] API submission failed:', apiErr);
            const errMsg = apiErr?.message || 'Không thể lưu kết quả luyện viết lên máy chủ.';
            showToast({
              type: 'error',
              title: 'Lỗi đồng bộ SRS',
              message: `${errMsg} Vui lòng thử lại.`
            });
            if (this.dom?.writingCompletionNotice) {
              this.dom.writingCompletionNotice.textContent = `⚠️ Lỗi lưu kết quả (${errMsg}). Vui lòng bấm [Sang từ tiếp theo] để thử lại.`;
              this.dom.writingCompletionNotice.classList.remove('d-none');
            }
            return;
          }
        }

        const nextIndex = this.currentIndex + 1;
        this.persistProgress('writing', nextIndex);
      }

      this.stats.totalReviewed++;
      this.stats.totalTimeSeconds += elapsedSeconds;
      this.stats.goodEasyCount++;

      this.currentIndex++;
      if (this.currentIndex >= this.sessionQueue.length) {
        this.showCompletedState();
      } else {
        this.renderCurrentCard();
      }
    } finally {
      this.isSubmittingWriting = false;
      if (this.dom?.btnWritingNext) {
        this.dom.btnWritingNext.disabled = false;
        this.dom.btnWritingNext.removeAttribute('aria-busy');
      }
    }
  }

  /**
   * Destroys active writing engines safely.
   */
  destroyWritingEngines() {
    this.writingEngines.forEach(eng => {
      try {
        if (typeof eng.destroy === 'function') eng.destroy();
      } catch (e) {}
    });
    this.writingEngines = [];
  }

  /**
   * Destroys active listening IME instance safely.
   */
  destroyListeningIme() {
    if (this.listeningIme) {
      try {
        if (typeof this.listeningIme.destroy === 'function') {
          this.listeningIme.destroy();
        }
      } catch (e) {}
      this.listeningIme = null;
    }
  }

  /**
   * Renders the current card in dedicated Listening Room.
   * - Shows speaker hero button.
   * - Sets up input field with virtual Pinyin IME and hardware IME support.
   * - Hides next button until answer is validated as correct.
   * - Auto-plays pronunciation on card load.
   * @param {Object} card
   */
  async renderListeningRoomCard(card) {
    this.destroyListeningIme();
    this.hasCompletedListeningForCurrentCard = false;

    const isVocab = (card.itemType || '').toUpperCase() === 'VOCABULARY';

    if (this.dom.listeningRoomBadge) {
      this.dom.listeningRoomBadge.textContent = isVocab ? 'Từ vựng' : 'Bộ thủ';
    }

    // Reset feedback notices
    if (this.dom.listeningCompletionNotice) {
      this.dom.listeningCompletionNotice.classList.add('d-none');
    }
    if (this.dom.listeningErrorNotice) {
      this.dom.listeningErrorNotice.classList.add('d-none');
    }

    // Reset input field
    if (this.dom.listeningAnswerInput) {
      this.dom.listeningAnswerInput.value = '';
      this.dom.listeningAnswerInput.disabled = false;
      this.dom.listeningAnswerInput.classList.remove('is-invalid', 'is-valid');
      this.dom.listeningAnswerInput.placeholder = 'Nhập chữ Hán bạn nghe được...';
    }

    // Configure Check button
    if (this.dom.btnListeningCheck) {
      this.dom.btnListeningCheck.disabled = false;
      this.dom.btnListeningCheck.classList.remove('d-none');
    }

    // Configure Next button label and HIDE it initially (keep space reserved with writing-next-hidden)
    if (this.dom.btnListeningNext) {
      this.dom.btnListeningNext.textContent = isVocab ? 'Sang từ tiếp theo →' : 'Sang bộ thủ tiếp theo →';
      this.dom.btnListeningNext.classList.add('writing-next-hidden');
      this.dom.btnListeningNext.setAttribute('aria-hidden', 'true');
      this.dom.btnListeningNext.setAttribute('tabindex', '-1');
      this.dom.btnListeningNext.disabled = false;
      this.dom.btnListeningNext.removeAttribute('aria-busy');
    }

    // Mount Virtual Pinyin IME
    if (this.dom.listeningImeContainer && this.dom.listeningAnswerInput) {
      this.listeningIme = new PinyinImeComponent({
        containerMount: this.dom.listeningImeContainer,
        targetInput: this.dom.listeningAnswerInput,
        onCommit: () => {
          if (this.dom.listeningErrorNotice) {
            this.dom.listeningErrorNotice.classList.add('d-none');
          }
          if (this.dom.listeningAnswerInput) {
            this.dom.listeningAnswerInput.classList.remove('is-invalid');
          }
        },
        onSubmit: () => {
          if (this.hasCompletedListeningForCurrentCard) {
            this.nextListeningItem();
          } else {
            this.checkListeningAnswer();
          }
        }
      });
    }

    // Unlock and reset speaker button so it is always interactive for the learner
    if (this.dom.btnListeningPlayAudio) {
      this.dom.btnListeningPlayAudio.disabled = false;
      this.dom.btnListeningPlayAudio.removeAttribute('aria-busy');
      this.dom.btnListeningPlayAudio.classList.remove('is-speaking');
    }


    // Focus input field
    if (this.dom.listeningAnswerInput) {
      setTimeout(() => {
        try {
          this.dom.listeningAnswerInput?.focus();
        } catch (e) {}
      }, 50);
    }
  }

  /**
   * Verifies the user's Hanzi answer in Listening mode.
   */
  checkListeningAnswer() {
    if (this.hasCompletedListeningForCurrentCard || this.isSubmittingListening) return;
    if (!this.sessionQueue || this.currentIndex >= this.sessionQueue.length) return;
    const card = this.sessionQueue[this.currentIndex]?.card;
    if (!card) return;

    const rawInput = this.dom.listeningAnswerInput ? this.dom.listeningAnswerInput.value : '';
    const expected = card.hanzi || card.character || '';

    const isCorrect = verifyListeningAnswer(rawInput, expected);

    if (isCorrect) {
      this.handleListeningCorrect(card);
    } else {
      this.handleListeningIncorrect();
    }
  }

  /**
   * Handles correct answer in Listening room.
   * @param {Object} card
   */
  handleListeningCorrect(card) {
    this.hasCompletedListeningForCurrentCard = true;

    if (this.dom.listeningAnswerInput) {
      this.dom.listeningAnswerInput.classList.remove('is-invalid');
      this.dom.listeningAnswerInput.classList.add('is-valid');
      this.dom.listeningAnswerInput.disabled = true;
    }

    if (this.dom.btnListeningCheck) {
      this.dom.btnListeningCheck.disabled = true;
    }

    if (this.dom.listeningErrorNotice) {
      this.dom.listeningErrorNotice.classList.add('d-none');
    }

    if (this.dom.listeningCompletionNotice) {
      this.dom.listeningCompletionNotice.textContent = '✓ Hoàn thành!';
      this.dom.listeningCompletionNotice.classList.remove('d-none');
    }

    if (this.dom.btnListeningNext) {
      this.dom.btnListeningNext.classList.remove('writing-next-hidden');
      this.dom.btnListeningNext.removeAttribute('aria-hidden');
      this.dom.btnListeningNext.removeAttribute('tabindex');
      try {
        this.dom.btnListeningNext.focus();
      } catch (e) {}
    }
  }

  /**
   * Handles incorrect answer in Listening room.
   */
  handleListeningIncorrect() {
    this.hasCompletedListeningForCurrentCard = false;

    if (this.dom.listeningAnswerInput) {
      this.dom.listeningAnswerInput.classList.remove('is-valid');
      this.dom.listeningAnswerInput.classList.add('is-invalid');
      this.dom.listeningAnswerInput.disabled = false;
      try {
        this.dom.listeningAnswerInput.focus();
      } catch (e) {}
    }

    if (this.dom.btnListeningCheck) {
      this.dom.btnListeningCheck.disabled = false;
    }

    if (this.dom.listeningCompletionNotice) {
      this.dom.listeningCompletionNotice.classList.add('d-none');
    }

    if (this.dom.listeningErrorNotice) {
      this.dom.listeningErrorNotice.textContent = 'Chưa chính xác, hãy nghe lại và thử lần nữa.';
      this.dom.listeningErrorNotice.classList.remove('d-none');
    }

    // Keep Next button hidden
    if (this.dom.btnListeningNext) {
      this.dom.btnListeningNext.classList.add('writing-next-hidden');
      this.dom.btnListeningNext.setAttribute('aria-hidden', 'true');
      this.dom.btnListeningNext.setAttribute('tabindex', '-1');
    }

    // Replay audio to assist user
    if (this.dom.btnListeningPlayAudio) {
      speechController.cancel();
      if (this.dom.btnListeningPlayAudio) {
        this.dom.btnListeningPlayAudio.disabled = false;
        this.dom.btnListeningPlayAudio.removeAttribute('aria-busy');
        this.dom.btnListeningPlayAudio.classList.remove('is-speaking');
      }
      this.playPronunciation(this.dom.btnListeningPlayAudio).catch(() => {});
    }
  }

  /**
   * Advances to next item in Listening mode.
   * Saves progress independently under HOC_HAN_NGU_LISTENING_PROGRESS.
   */
  async nextListeningItem() {
    if (this.isSubmittingListening) return;
    if (this.isSubmitting) return;

    if (this.dom?.btnListeningNext && this.hasCompletedListeningForCurrentCard === false) {
      showToast({
        type: 'warning',
        title: 'Chưa hoàn thành',
        message: 'Vui lòng hoàn thành câu trả lời trước khi chuyển sang từ tiếp theo.'
      });
      return;
    }

    this.isSubmittingListening = true;
    if (this.dom?.btnListeningNext) {
      this.dom.btnListeningNext.disabled = true;
      this.dom.btnListeningNext.setAttribute('aria-busy', 'true');
    }

    try {
      this.cleanupTimer();
      const elapsedSeconds = calculateReviewTime(this.cardStartTime, Date.now());

      if (!this.isReviewMode) {
        if (authManager.isAuthenticated() && this.sessionQueue[this.currentIndex]?.card) {
          const card = this.sessionQueue[this.currentIndex].card;
          const payload = buildReviewPayload({
            itemType: card.itemType || 'VOCABULARY',
            itemId: card.itemId,
            cardType: 'LISTENING',
            rating: 3,
            reviewTimeSeconds: elapsedSeconds
          });

          try {
            await apiClient('/srs/review', {
              method: 'POST',
              body: payload
            });
          } catch (apiErr) {
            console.error('[SRS Listening Review] API submission failed:', apiErr);
            const errMsg = apiErr?.message || 'Không thể lưu kết quả luyện nghe lên máy chủ.';
            showToast({
              type: 'error',
              title: 'Lỗi đồng bộ SRS',
              message: `${errMsg} Vui lòng thử lại.`
            });
            if (this.dom?.listeningCompletionNotice) {
              this.dom.listeningCompletionNotice.textContent = `⚠️ Lỗi lưu kết quả (${errMsg}). Vui lòng bấm [Sang từ tiếp theo] để thử lại.`;
              this.dom.listeningCompletionNotice.classList.remove('d-none');
            }
            return;
          }
        }

        const nextIndex = this.currentIndex + 1;
        this.persistProgress('listening', nextIndex);
      }

      this.stats.totalReviewed++;
      this.stats.totalTimeSeconds += elapsedSeconds;
      this.stats.goodEasyCount++;

      this.currentIndex++;
      if (this.currentIndex >= this.sessionQueue.length) {
        this.showCompletedState();
      } else {
        this.renderCurrentCard();
      }
    } finally {
      this.isSubmittingListening = false;
      if (this.dom?.btnListeningNext) {
        this.dom.btnListeningNext.disabled = false;
        this.dom.btnListeningNext.removeAttribute('aria-busy');
      }
    }
  }

  /**
   * Sets visual state of Reading room: 'ready' | 'recording' | 'analyzing' | 'result' | 'error'
   * @param {'ready'|'recording'|'analyzing'|'result'|'error'} state
   */
  setReadingState(state) {
    if (!this.dom) return;
    const states = {
      ready: this.dom.readingStateReady,
      recording: this.dom.readingStateRecording,
      analyzing: this.dom.readingStateAnalyzing,
      result: this.dom.readingStateResult,
      error: this.dom.readingStateError
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
   * Dedicated Reading Room rendering (Unified Single Card layout).
   * @param {Object} card
   */
  async renderReadingRoomCard(card) {
    this.cleanUpReadingMedia();
    this.hasCompletedReadingForCurrentCard = false;
    this.currentReadingScore = null;

    const isVocab = (card.itemType || '').toUpperCase() === 'VOCABULARY';

    if (this.dom.readingRoomBadge) {
      this.dom.readingRoomBadge.textContent = isVocab ? 'Từ vựng' : 'Bộ thủ';
    }
    if (this.dom.readingCardTypeBadge) {
      this.dom.readingCardTypeBadge.textContent = isVocab ? 'Từ vựng' : 'Bộ thủ';
    }

    // Check privacy notice dismissed preference
    if (this.dom.readingPrivacyNotice) {
      const isDismissed = typeof localStorage !== 'undefined' && localStorage.getItem('srs_reading_privacy_dismissed') === '1';
      this.dom.readingPrivacyNotice.classList.toggle('d-none', isDismissed);
      this.dom.readingPrivacyNotice.style.display = 'none';
    }

    // Target Hanzi
    const targetHanzi = card.hanzi || card.character || '';
    if (this.dom.readingPromptHanzi) {
      this.dom.readingPromptHanzi.textContent = targetHanzi;
    }

    // Pinyin & Meaning (hidden by default in State A)
    if (this.dom.readingPromptPinyin) {
      this.dom.readingPromptPinyin.textContent = card.pinyin || '';
    }
    if (this.dom.readingPromptHanViet) {
      const hv = card.meaningHanViet || '';
      this.dom.readingPromptHanViet.textContent = hv ? `Hán-Việt: ${hv}` : '';
      this.dom.readingPromptHanViet.classList.toggle('d-none', !hv);
    }
    if (this.dom.readingPromptMeaning) {
      this.dom.readingPromptMeaning.textContent = card.meaningVi || '';
    }
    if (this.dom.readingPinyinMeaningBox) {
      this.dom.readingPinyinMeaningBox.classList.add('d-none');
    }
    if (this.dom.btnReadingTogglePinyin) {
      this.dom.btnReadingTogglePinyin.textContent = '👁️ Xem trước phiên âm & nghĩa';
    }

    // Reset next button (hidden until completed)
    if (this.dom.btnReadingNext) {
      this.dom.btnReadingNext.textContent = isVocab ? 'Sang từ tiếp theo →' : 'Sang bộ thủ tiếp theo →';
      this.dom.btnReadingNext.classList.add('writing-next-hidden');
      this.dom.btnReadingNext.setAttribute('aria-hidden', 'true');
      this.dom.btnReadingNext.setAttribute('tabindex', '-1');
      this.dom.btnReadingNext.disabled = false;
      this.dom.btnReadingNext.removeAttribute('aria-busy');
    }

    // Switch to State A (Ready)
    this.setReadingState('ready');
  }

  /**
   * Starts microphone recording in Reading mode.
   */
  async startReadingRecording() {
    if (this.readingRecorder && this.readingRecorder.state === 'recording') return;
    this.cleanUpReadingMedia();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      this.showReadingError(
        'Không thể truy cập micro',
        'Trình duyệt hoặc môi trường hiện tại không hỗ trợ Web Audio / getUserMedia (yêu cầu ngữ cảnh bảo mật HTTPS hoặc localhost).',
        'Vui lòng sử dụng trình duyệt hiện đại được hỗ trợ như Google Chrome, Microsoft Edge hoặc Firefox.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.readingStream = stream;

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        }
      }

      this.readingAudioChunks = [];
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      this.readingRecorder = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.readingAudioChunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(this.readingAudioChunks, { type: recorder.mimeType || 'audio/webm' });
        this.handleRecordingFinished(finalBlob);
      };

      recorder.start(250); // Slices audio every 250ms

      // Update UI to State B (Recording)
      this.setReadingState('recording');
      if (this.dom.readingRecordDuration) {
        this.dom.readingRecordDuration.textContent = '00:00';
      }

      const startTime = Date.now();
      this.readingRecordTimer = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
        const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
        const secs = String(elapsedSec % 60).padStart(2, '0');
        if (this.dom.readingRecordDuration) {
          this.dom.readingRecordDuration.textContent = `${mins}:${secs}`;
        }
      }, 500);

      // Auto-stop safety timeout: max 15s to keep within 5MB limit
      this.readingAutoStopTimeout = setTimeout(() => {
        if (this.readingRecorder && this.readingRecorder.state === 'recording') {
          this.stopReadingRecording();
        }
      }, 15000);

    } catch (err) {
      console.warn('[SRS Reading] Microphone permission or capture failed:', err);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      this.showReadingError(
        isDenied ? 'Chưa cấp quyền micro' : 'Không thể kích hoạt micro',
        isDenied
          ? 'Quyền truy cập micro đã bị từ chối trên trình duyệt. Vui lòng bật quyền truy cập micro để luyện đọc.'
          : (err.message || 'Không thể bắt đầu ghi âm. Vui lòng kiểm tra thiết bị micro.'),
        'Nhấn vào biểu tượng ổ khóa/quyền trang web trên thanh địa chỉ trình duyệt để cấp quyền micro.'
      );
    }
  }

  /**
   * Stops recording and initiates AI assessment.
   */
  stopReadingRecording() {
    if (this.readingRecordTimer) {
      clearInterval(this.readingRecordTimer);
      this.readingRecordTimer = null;
    }
    if (this.readingAutoStopTimeout) {
      clearTimeout(this.readingAutoStopTimeout);
      this.readingAutoStopTimeout = null;
    }

    if (this.readingRecorder && this.readingRecorder.state === 'recording') {
      try {
        this.readingRecorder.stop();
      } catch (e) {
        console.warn('[SRS Reading] Stop recorder error:', e);
      }
    }

    // Stop microphone tracks immediately
    if (this.readingStream) {
      try {
        this.readingStream.getTracks().forEach(t => t.stop());
      } catch (e) {}
      this.readingStream = null;
    }
  }

  /**
   * Cancels active recording without submitting.
   */
  cancelReadingRecording() {
    this.cleanUpReadingMedia();
    this.setReadingState('ready');
  }

  /**
   * Handles completed recording Blob and calls Gemini assess API.
   * @param {Blob} audioBlob
   */
  async handleRecordingFinished(audioBlob) {
    if (!audioBlob || audioBlob.size < 500) {
      this.showReadingError(
        'Bản ghi âm quá ngắn',
        'Bản ghi âm chưa ghi nhận được âm thanh rõ ràng. Vui lòng giữ micro và đọc to chữ Hán mục tiêu.',
        'Hãy bấm "Thử đọc lại", đọc to và rõ âm tiết tiếng Trung.'
      );
      return;
    }

    // Retain blob for playback
    this.currentUserAudioBlob = audioBlob;
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      try {
        this.currentUserAudioUrl = URL.createObjectURL(audioBlob);
      } catch (e) {}
    }

    const card = this.sessionQueue[this.currentIndex]?.card;
    if (!card) return;

    // Switch to State C (Analyzing)
    this.setReadingState('analyzing');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'reading.webm');
      formData.append('itemType', card.itemType || 'VOCABULARY');
      formData.append('itemId', String(card.itemId || 1));
      formData.append('targetHanzi', card.hanzi || card.character || '');
      formData.append('targetPinyin', card.pinyin || '');
      formData.append('targetMeaning', card.meaningVi || card.meaningHanViet || '');

      const response = await apiClient('/srs/reading/assess', {
        method: 'POST',
        body: formData
      });

      this.handleAssessmentResponse(response, card);

    } catch (err) {
      console.error('[SRS Reading] Assessment failed:', err);
      const isUnconfigured = err.status === 503 || (err.message && err.message.includes('GEMINI_API_KEY'));
      const isRateLimited = err.status === 429;

      let title = 'Không thể đánh giá phát âm';
      let message = err.message || 'Đã xảy ra lỗi khi kết nối tới máy chủ phân tích phát âm.';
      let advice = 'Vui lòng kiểm tra kết nối mạng và thử lại.';

      if (isUnconfigured) {
        title = 'Chưa cấu hình Gemini AI API';
        message = 'Tính năng Luyện đọc AI sử dụng Google Gemini (Gói miễn phí) nhưng máy chủ chưa được cấu hình biến môi trường GEMINI_API_KEY.';
        advice = 'Quản trị viên cần đặt biến môi trường GEMINI_API_KEY hoặc GOOGLE_API_KEY trước khi khởi động backend.';
      } else if (isRateLimited) {
        title = 'Đã đạt giới hạn yêu cầu (Rate Limit)';
        message = 'Bạn hoặc hệ thống đã đạt giới hạn yêu cầu phát âm trên phút của gói miễn phí Gemini API.';
        advice = 'Vui lòng đợi khoảng 1 phút rồi bấm "Thử đọc lại".';
      }

      this.showReadingError(title, message, advice);
    }
  }

  /**
   * Processes assessment response from backend and updates UI.
   * @param {Object} response
   * @param {Object} card
   */
  handleAssessmentResponse(response, card) {
    if (!response) {
      this.showReadingError('Không nhận được phản hồi', 'Máy chủ không trả về kết quả phân tích.', 'Vui lòng thử lại.');
      return;
    }

    if (response.status === 'SCORED' || response.status === 'assessed') {
      this.hasCompletedReadingForCurrentCard = true;
      this.currentReadingScore = response.overallScore;

      // Update State D (Result)
      this.setReadingState('result');

      // Overall Score Badge
      const score = typeof response.overallScore === 'number' ? response.overallScore : 0;
      if (this.dom.readingOverallScoreBadge) {
        this.dom.readingOverallScoreBadge.textContent = `${score} / 100`;
        this.dom.readingOverallScoreBadge.className = 'reading-score-badge fw-bold px-3 py-1 rounded-pill fs-5 border ' +
          (score >= 80 ? 'bg-success-subtle text-success border-success-subtle' :
           score >= 60 ? 'bg-primary-subtle text-primary border-primary-subtle' :
           'bg-warning-subtle text-warning border-warning-subtle');
      }

      // Confidence Badge
      if (this.dom.readingConfidenceBadge) {
        const conf = response.confidence || 'MEDIUM';
        const confText = conf === 'HIGH' ? 'Độ tin cậy: Cao' : (conf === 'LOW' ? 'Độ tin cậy: Thấp' : 'Độ tin cậy: Trung bình');
        this.dom.readingConfidenceBadge.textContent = confText;
        this.dom.readingConfidenceBadge.classList.add('d-none'); // Hidden from UI per user request
      }

      // Recognized Text
      if (this.dom.readingRecognizedText) {
        this.dom.readingRecognizedText.textContent = response.recognizedText || '(Chưa nhận diện rõ)';
      }

      // Summary Vi
      if (this.dom.readingResultSummary) {
        this.dom.readingResultSummary.textContent = response.summaryVi || 'Phát âm của bạn đã được ghi nhận.';
      }

      // Components (Initials, Finals, Tones)
      if (this.dom.readingComponentsWrapper) {
        const comps = response.components;
        const initials = comps ? (comps.initials || comps.initialsFeedback) : '';
        const finals = comps ? (comps.finals || comps.finalsFeedback) : '';
        const tones = comps ? (comps.tones || comps.tonesFeedback) : '';
        if (comps && (initials || finals || tones)) {
          this.dom.readingComponentsWrapper.classList.remove('d-none');
          if (this.dom.readingInitialsFeedback) {
            this.dom.readingInitialsFeedback.textContent = initials ? `• Thanh mẫu: ${initials}` : '';
            this.dom.readingInitialsFeedback.classList.toggle('d-none', !initials);
          }
          if (this.dom.readingFinalsFeedback) {
            this.dom.readingFinalsFeedback.textContent = finals ? `• Vận mẫu: ${finals}` : '';
            this.dom.readingFinalsFeedback.classList.toggle('d-none', !finals);
          }
          if (this.dom.readingTonesFeedback) {
            this.dom.readingTonesFeedback.textContent = tones ? `• Thanh điệu: ${tones}` : '';
            this.dom.readingTonesFeedback.classList.toggle('d-none', !tones);
          }
        } else {
          this.dom.readingComponentsWrapper.classList.add('d-none');
        }
      }

      // Retry Advice
      if (this.dom.readingRetryAdvice) {
        this.dom.readingRetryAdvice.textContent = response.retryAdvice ? `💡 Gợi ý: ${response.retryAdvice}` : '';
        this.dom.readingRetryAdvice.classList.toggle('d-none', !response.retryAdvice);
      }

      // Automatically reveal Pinyin & Meaning in State D so user can review
      if (this.dom.readingPinyinMeaningBox) {
        this.dom.readingPinyinMeaningBox.classList.remove('d-none');
      }

      // Show and focus Next button
      if (this.dom.btnReadingNext) {
        this.dom.btnReadingNext.classList.remove('writing-next-hidden');
        this.dom.btnReadingNext.removeAttribute('aria-hidden');
        this.dom.btnReadingNext.removeAttribute('tabindex');
        try {
          this.dom.btnReadingNext.focus();
        } catch (e) {}
      }

    } else {
      // NOT_SCORABLE, UNCONFIGURED, QUOTA_EXCEEDED
      let title = 'Không đủ căn cứ chấm điểm';
      let message = response.summaryVi || 'Âm thanh không rõ hoặc có nhiều tạp âm.';
      let advice = response.retryAdvice || 'Vui lòng đọc lại to, rõ ràng và gần micro hơn.';

      if (response.status === 'UNCONFIGURED') {
        title = 'Chưa cấu hình Gemini AI API';
        advice = 'Hệ thống chưa được cài đặt GEMINI_API_KEY. Vui lòng thiết lập biến môi trường trên máy chủ.';
      } else if (response.status === 'QUOTA_EXCEEDED') {
        title = 'Đã đạt hạn mức miễn phí Google Gemini';
        advice = 'Vui lòng thử lại sau giây lát khi hạn mức được hồi phục.';
      }

      this.showReadingError(title, message, advice);
    }
  }

  /**
   * Displays State E (Error / Not Scorable).
   * @param {string} title
   * @param {string} message
   * @param {string} advice
   */
  showReadingError(title, message, advice) {
    this.hasCompletedReadingForCurrentCard = false;
    this.setReadingState('error');

    if (this.dom.readingErrorTitle) {
      this.dom.readingErrorTitle.textContent = title;
    }
    if (this.dom.readingErrorMessage) {
      this.dom.readingErrorMessage.textContent = message;
    }
    if (this.dom.readingErrorAdvice) {
      this.dom.readingErrorAdvice.textContent = advice || '';
      this.dom.readingErrorAdvice.classList.toggle('d-none', !advice);
    }

    // In error state, reveal Pinyin and Meaning so user is not stuck without information
    if (this.dom.readingPinyinMeaningBox) {
      this.dom.readingPinyinMeaningBox.classList.remove('d-none');
    }

    // Keep Next button hidden
    if (this.dom.btnReadingNext) {
      this.dom.btnReadingNext.classList.add('writing-next-hidden');
      this.dom.btnReadingNext.setAttribute('aria-hidden', 'true');
      this.dom.btnReadingNext.setAttribute('tabindex', '-1');
    }
  }

  /**
   * Cleans up microphone streams, audio contexts, object URLs, and timers.
   */
  cleanUpReadingMedia() {
    if (this.readingRecordTimer) {
      clearInterval(this.readingRecordTimer);
      this.readingRecordTimer = null;
    }
    if (this.readingAutoStopTimeout) {
      clearTimeout(this.readingAutoStopTimeout);
      this.readingAutoStopTimeout = null;
    }
    if (this.readingRecorder && this.readingRecorder.state !== 'inactive') {
      try {
        this.readingRecorder.stop();
      } catch (e) {}
    }
    this.readingRecorder = null;

    if (this.readingStream) {
      try {
        this.readingStream.getTracks().forEach(track => track.stop());
      } catch (e) {}
      this.readingStream = null;
    }

    if (this.currentUserAudioUrl) {
      try {
        URL.revokeObjectURL(this.currentUserAudioUrl);
      } catch (e) {}
      this.currentUserAudioUrl = null;
    }
    this.currentUserAudioBlob = null;

    if (this.currentUserAudioElement) {
      try {
        this.currentUserAudioElement.pause();
        this.currentUserAudioElement.src = '';
      } catch (e) {}
      this.currentUserAudioElement = null;
    }
    this.readingAudioChunks = [];
  }

  /**
   * Advances to next item in Reading mode.
   * Saves progress independently under HOC_HAN_NGU_READING_PROGRESS.
   */
  async nextReadingItem() {
    if (this.isSubmittingReading) return;
    if (this.isSubmitting) return;

    if (this.dom?.btnReadingNext && this.hasCompletedReadingForCurrentCard === false) {
      showToast({
        type: 'warning',
        title: 'Chưa hoàn thành',
        message: 'Vui lòng hoàn thành lượt đọc trước khi chuyển sang từ tiếp theo.'
      });
      return;
    }

    this.isSubmittingReading = true;
    if (this.dom?.btnReadingNext) {
      this.dom.btnReadingNext.disabled = true;
      this.dom.btnReadingNext.setAttribute('aria-busy', 'true');
    }

    try {
      this.cleanupTimer();
      const elapsedSeconds = calculateReviewTime(this.cardStartTime, Date.now());

      if (!this.isReviewMode) {
        if (authManager.isAuthenticated() && this.sessionQueue[this.currentIndex]?.card) {
          const card = this.sessionQueue[this.currentIndex].card;
          const score = this.currentReadingScore || 70;
          const rating = score >= 85 ? 4 : (score >= 60 ? 3 : 2);

          const payload = buildReviewPayload({
            itemType: card.itemType || 'VOCABULARY',
            itemId: card.itemId,
            cardType: 'READING',
            rating: rating,
            reviewTimeSeconds: elapsedSeconds
          });

          try {
            await apiClient('/srs/review', {
              method: 'POST',
              body: payload
            });
          } catch (apiErr) {
            console.error('[SRS Reading Review] API submission failed:', apiErr);
            const errMsg = apiErr?.message || 'Không thể lưu kết quả luyện đọc lên máy chủ.';
            showToast({
              type: 'error',
              title: 'Lỗi đồng bộ SRS',
              message: `${errMsg} Vui lòng thử lại.`
            });
            return;
          }
        }

        const nextIndex = this.currentIndex + 1;
        this.persistProgress('reading', nextIndex);
      }

      this.stats.totalReviewed++;
      this.stats.totalTimeSeconds += elapsedSeconds;
      this.stats.goodEasyCount++;

      this.currentIndex++;
      if (this.currentIndex >= this.sessionQueue.length) {
        this.showCompletedState();
      } else {
        this.renderCurrentCard();
      }
    } finally {
      this.isSubmittingReading = false;
      if (this.dom?.btnReadingNext) {
        this.dom.btnReadingNext.disabled = false;
        this.dom.btnReadingNext.removeAttribute('aria-busy');
      }
    }
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

    this.setRatingButtonsEnabled(true);
  }

  /**
   * Enables or disables rating buttons.
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
   * Unified rating submission handler for Flashcard mode.
   * @param {number|string} rating
   */
  async submitRating(rating) {
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

    this.isSubmitting = true;
    this.setRatingButtonsEnabled(false);
    if (this.dom.ratingFeedback) {
      this.dom.ratingFeedback.textContent = 'Đang ghi nhận kết quả đánh giá...';
    }

    try {
      // If review mode (Học lại): Zero SRS mutation (free practice, no server mutation)
      if (this.isReviewMode) {
        this.stats.totalReviewed++;
        this.stats.totalTimeSeconds += elapsedSeconds;
        if (numRating === 1) this.stats.againCount++;
        else if (numRating >= 3) this.stats.goodEasyCount++;

        if (numRating === 1) {
          const requeueResult = handleAgainRequeue(this.sessionQueue, queueItem, MAX_AGAIN_REVIEWS_PER_CARD);
          if (requeueResult.requeued) {
            showToast({
              type: 'info',
              title: 'Luyện lại',
              message: `Thẻ "${card.hanzi}" sẽ xuất hiện lại ở cuối phiên học.`
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

      // Normal mode (Học tiếp): send authoritative review to backend if authenticated
      if (authManager.isAuthenticated()) {
        const payload = buildReviewPayload({
          itemType: card.itemType || 'VOCABULARY',
          itemId: card.itemId,
          cardType: card.cardType || (this.activeMode === 'writing' ? 'WRITING' : (this.activeMode === 'listening' ? 'LISTENING' : 'READING')),
          rating: numRating,
          reviewTimeSeconds: elapsedSeconds
        });

        await apiClient('/srs/review', {
          method: 'POST',
          body: payload
        });
      }

      // Persist progress under HOC_HAN_NGU_FLASHCARD_PROGRESS
      this.persistProgress('flashcard', this.currentIndex + 1);

      this.stats.totalReviewed++;
      this.stats.totalTimeSeconds += elapsedSeconds;
      if (numRating === 1) this.stats.againCount++;
      else if (numRating >= 3) this.stats.goodEasyCount++;

      // Handle local session requeue for Again
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

      this.currentIndex++;
      this.isSubmitting = false;

      if (this.currentIndex >= this.sessionQueue.length) {
        this.showCompletedState();
      } else {
        this.renderCurrentCard();
      }

    } catch (err) {
      console.warn('[SRS Review] Review submission response:', err);
      this.isSubmitting = false;
      this.setRatingButtonsEnabled(true);

      // Gracefully advance local session if card is not yet due (practice/early review in catalog)
      if (err?.message && err.message.includes('chưa đến hạn')) {
        console.info('[SRS Review] Thẻ chưa đến hạn ôn tập SRS, tiếp tục chuyển sang thẻ kế tiếp trong phiên học.');
        this.persistProgress('flashcard', this.currentIndex + 1);
        this.stats.totalReviewed++;
        this.stats.totalTimeSeconds += elapsedSeconds;
        if (numRating === 1) this.stats.againCount++;
        else if (numRating >= 3) this.stats.goodEasyCount++;

        this.currentIndex++;
        if (this.currentIndex >= this.sessionQueue.length) {
          this.showCompletedState();
        } else {
          this.renderCurrentCard();
        }
        return;
      }

      const msg = err.message || 'Không thể gửi đánh giá thẻ.';
      if (this.dom.ratingFeedback) {
        this.dom.ratingFeedback.replaceChildren();
        const wrapper = document.createElement('div');
        wrapper.className = 'srs-error-feedback';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        wrapper.style.gap = '8px';
        wrapper.style.color = 'var(--color-cinnabar, #dc2626)';
        wrapper.style.marginTop = '6px';

        const span = document.createElement('span');
        span.textContent = `Lỗi đồng bộ: ${msg}`;
        wrapper.appendChild(span);

        const retryBtn = document.createElement('button');
        retryBtn.type = 'button';
        retryBtn.className = 'btn btn-sm btn-outline-danger';
        retryBtn.id = 'btn-retry-rating';
        retryBtn.textContent = 'Thử lại';
        retryBtn.onclick = () => this.submitRating(numRating);
        wrapper.appendChild(retryBtn);

        this.dom.ratingFeedback.appendChild(wrapper);
      }
      showToast({
        type: 'error',
        title: 'Lỗi ghi nhận',
        message: 'Không thể gửi đánh giá thẻ. Vui lòng thử lại.'
      });
    }
  }

  /**
   * Persists progress index into localStorage for the given mode.
   * @param {'flashcard'|'writing'} mode 
   * @param {number} nextIndex 
   */
  persistProgress(mode, nextIndex) {
    const current = getProgress(mode);
    const updates = { ...current };

    if (!updates[this.activeGroup]) {
      updates[this.activeGroup] = {};
    }

    if (this.lessonId) {
      const topicKey = `topic_${this.lessonId}`;
      updates[this.activeGroup][topicKey] = nextIndex;
      updates[this.activeGroup].lastLessonId = this.lessonId;
    } else if (this.currentChapterIdx != null) {
      const chapKey = `chapter_${this.currentChapterIdx}`;
      updates[this.activeGroup][chapKey] = nextIndex;
      updates[this.activeGroup].lastChapterIdx = this.currentChapterIdx;
    } else {
      updates[this.activeGroup].lastIndex = nextIndex;
    }

    saveProgress(mode, updates);
  }

  /**
   * Backward-compatible alias rateCard -> submitRating
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
   * Plays pronunciation audio for current card.
   * Executes synchronously to preserve browser Transient User Activation.
   * @param {HTMLElement|null} triggerButton
   */
  playPronunciation(triggerButton = null) {
    const queueItem = this.sessionQueue[this.currentIndex];
    if (!queueItem || !queueItem.card) {
      return Promise.resolve({ success: false, method: 'ui_fallback', message: 'No active card' });
    }
    const card = queueItem.card;
    const rawText = card.hanzi || card.character || '';
    const textToSpeak = (rawText.includes('(') || rawText.includes('/')) ? rawText.split(/[()\/]/)[0].trim() : rawText;

    const cacheKey = `${card.itemType}_${card.itemId}`;
    const cachedUrl = this.audioCache.get(cacheKey);
    const audioUrl = card.audioUrl || cachedUrl || null;

    // Asynchronously prefetch detail for future use if not yet cached, without blocking current click turn
    if (!cachedUrl && !card.audioUrl && authManager.isAuthenticated()) {
      const endpoint = (card.itemType || '').toUpperCase() === 'VOCABULARY'
        ? `/vocabulary/${card.itemId}`
        : `/radicals/${card.itemId}`;
      apiClient(endpoint)
        .then(detail => {
          if (detail?.audioUrl) {
            this.audioCache.set(cacheKey, detail.audioUrl);
          }
        })
        .catch(() => {});
    }

    // Synchronous dispatch to SpeechController to preserve transient user activation token
    const res = playPronunciation({
      text: textToSpeak,
      audioUrl: audioUrl,
      button: triggerButton
    });
    return (res && typeof res.then === 'function') ? res : Promise.resolve(res);
  }

  /**
   * Opens personal notes modal for current card (legacy fallback).
   */
  openNoteForCurrentCard() {
    const queueItem = this.sessionQueue[this.currentIndex];
    if (!queueItem || !queueItem.card) return;
    const card = queueItem.card;
    if ((card.itemType || '').toUpperCase() !== 'VOCABULARY') return;

    openNotesModal({
      vocabId: card.itemId,
      hanzi: card.hanzi,
      pinyin: card.pinyin,
      meaning: card.meaningVi,
      triggerElement: this.dom.btnCardNote
    });
  }

  /**
   * Keyboard shortcuts handler.
   * Space/Enter: Flip card (Flashcard mode).
   * 1..4: Ratings (Flashcard mode).
   * Enter: Next item (Writing mode).
   * @param {KeyboardEvent} e
   */
  handleKeydown(e) {
    const tag = (e.target?.tagName || '').toLowerCase();
    const activeEl = typeof document !== 'undefined' ? document.activeElement : null;

    if (this.isEditingInlineNote || isEditableOrFormControl(e.target, activeEl)) {
      return;
    }

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

    if (this.dom.activeSession?.classList.contains('d-none') || this.isSubmitting) {
      return;
    }
    if (!this.sessionQueue || this.currentIndex >= this.sessionQueue.length) {
      return;
    }

    // Space or Enter flips the flashcard (Flashcard mode)
    if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
      if (tag === 'button' && e.target !== this.dom.flashcard) {
        return;
      }
      if (this.activeMode === 'flashcard') {
        e.preventDefault();
        this.toggleFlip();
      } else if (this.activeMode === 'writing') {
        // Space or Enter: only allowed when completed at least once
        if (this.hasCompletedWritingForCurrentCard) {
          e.preventDefault();
          this.nextWritingItem();
        } else {
          // Temporarily locked in State 1
          e.preventDefault();
        }
      } else if (this.activeMode === 'listening') {
        // Space or Enter: only allowed when completed at least once
        if (this.hasCompletedListeningForCurrentCard) {
          e.preventDefault();
          this.nextListeningItem();
        } else {
          e.preventDefault();
        }
      } else if (this.activeMode === 'reading') {
        // Space or Enter: only allowed when assessed at least once
        if (this.hasCompletedReadingForCurrentCard) {
          e.preventDefault();
          this.nextReadingItem();
        } else {
          e.preventDefault();
        }
      }
      return;
    }

    // Flashcard mode: shortcuts 1..4
    if (this.activeMode === 'flashcard') {
      const rating = mapKeyToRating(e);
      if (rating !== null) {
        e.preventDefault();
        this.submitRating(rating);
      }
    }
  }

  /**
   * Shows completed session summary screen.
   */
  showCompletedState() {
    this.cleanupTimer();
    this.destroyWritingEngines();
    this.destroyListeningIme();
    this.cleanUpReadingMedia();
    this.setViewState('completed');

    if (this.dom.completedTitle) {
      if (this.mode === 'LESSON_PRACTICE') {
        this.dom.completedTitle.textContent = 'Hoàn Thành Phiên Luyện Tập Tự Do!';
      } else {
        this.dom.completedTitle.textContent = this.isReviewMode
          ? 'Hoàn Thành Phiên Học Lại!'
          : 'Hoàn Thành Phiên Ôn Tập!';
      }
    }

    if (this.dom.completedDescription) {
      this.dom.completedDescription.textContent = this.isReviewMode
        ? 'Bạn đã hoàn thành phiên học lại. Tiến độ Học tiếp của bạn được giữ nguyên trọn vẹn.'
        : 'Các kết quả học tập của bạn đã được ghi nhận vào tiến trình trí nhớ dài hạn.';
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
   * Cleans up running timer interval.
   */
  cleanupTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Destroys the controller instance and removes listeners.
   */
  destroy() {
    this.cleanupTimer();
    this.destroyWritingEngines();
    this.destroyListeningIme();
    this.cleanUpReadingMedia();
    speechController.cancel();
    window.removeEventListener('keydown', this.onKeydown);
    window.removeEventListener('popstate', this.onPopState);
    window.removeEventListener('beforeunload', this.onUnload);
  }
}

// Global page instance auto-init on DOMContentLoaded
let srsControllerInstance = null;
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('flashcard') && !document.getElementById('srsActiveSession') && !document.getElementById('srsAuthState')) {
      return;
    }
    srsControllerInstance = new SrsReviewController();
    if (typeof window !== 'undefined') {
      window.srsReviewController = srsControllerInstance;
      window.__SRS_PAGE_CONTROLLER = srsControllerInstance;
    }
    srsControllerInstance.init();
  });
}
