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

export {
  createSpeakerIcon,
  createSpeechButton,
  speechController,
  speakHanzi,
  playPronunciation,
  isSpeechSynthesisAvailable,
  SpeechState,
  VocabWritingOrchestrator
};

export const MAX_AGAIN_REVIEWS_PER_CARD = 3;

export const STORAGE_KEY_FLASHCARD = 'HOC_HAN_NGU_FLASHCARD_PROGRESS';
export const STORAGE_KEY_WRITING = 'HOC_HAN_NGU_WRITING_PROGRESS';

/**
 * Reads progress from localStorage for the given mode ('flashcard' or 'writing').
 * @param {'flashcard'|'writing'} mode
 * @returns {Object}
 */
export function getProgress(mode) {
  const key = mode === 'writing' ? STORAGE_KEY_WRITING : STORAGE_KEY_FLASHCARD;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Saves progress updates to localStorage for the given mode.
 * @param {'flashcard'|'writing'} mode
 * @param {Object} updates
 */
export function saveProgress(mode, updates) {
  const key = mode === 'writing' ? STORAGE_KEY_WRITING : STORAGE_KEY_FLASHCARD;
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
 * 10 Official Curriculum Topics for HSK 1 (From curriculum-manifest.md, 20 words each, 200 total)
 */
export const HSK1_TOPICS = [
  {
    topicId: 1,
    title: 'Bài 01 — Chào hỏi và giao tiếp cơ bản',
    description: 'Chào hỏi, tạm biệt, cảm ơn, xin lỗi, đáp lời lịch sự và những biểu đạt giao tiếp cơ bản.',
    vocabularies: [
      { vocabId: 101, hanzi: '请', pinyin: 'qǐng', meaningHanViet: 'Thỉnh', meaningVi: 'Mời; mời mọc' },
      { vocabId: 102, hanzi: '请问', pinyin: 'qǐngwèn', meaningHanViet: 'Thỉnh Vấn', meaningVi: 'Xin lỗi, cho tôi hỏi...?' },
      { vocabId: 103, hanzi: '请进', pinyin: 'qǐng jìn', meaningHanViet: 'Thỉnh Tiến', meaningVi: 'Mời vào' },
      { vocabId: 104, hanzi: '请坐', pinyin: 'qǐng zuò', meaningHanViet: 'Thỉnh Toạ', meaningVi: 'Xin mời ngồi' },
      { vocabId: 105, hanzi: '谢谢', pinyin: 'xièxie', meaningHanViet: 'Tạ Tạ', meaningVi: 'Cảm ơn; cảm ơn bạn' },
      { vocabId: 106, hanzi: '不客气', pinyin: 'bù kèqì', meaningHanViet: 'Bất Khách Khí', meaningVi: 'Không có chi; đừng khách sáo' },
      { vocabId: 107, hanzi: '对不起', pinyin: 'duìbuqǐ', meaningHanViet: 'Đối Bất Khởi', meaningVi: 'Xin lỗi' },
      { vocabId: 108, hanzi: '没关系', pinyin: 'méi guānxi', meaningHanViet: 'Một Quan Hệ', meaningVi: 'Không sao đâu' },
      { vocabId: 109, hanzi: '没什么', pinyin: 'méi shénme', meaningHanViet: 'Một Thậm Yêu', meaningVi: 'Không có gì' },
      { vocabId: 110, hanzi: '再见', pinyin: 'zàijiàn', meaningHanViet: 'Tái Kiến', meaningVi: 'Tạm biệt; hẹn gặp lại' },
      { vocabId: 111, hanzi: '问', pinyin: 'wèn', meaningHanViet: 'Vấn', meaningVi: 'Hỏi' },
      { vocabId: 112, hanzi: '说', pinyin: 'shuō', meaningHanViet: 'Thuyết', meaningVi: 'Nói' },
      { vocabId: 113, hanzi: '说话', pinyin: 'shuōhuà', meaningHanViet: 'Thuyết Thoại', meaningVi: 'Trò chuyện, nói chuyện' },
      { vocabId: 114, hanzi: '见', pinyin: 'jiàn', meaningHanViet: 'Kiến', meaningVi: 'Gặp; thấy' },
      { vocabId: 115, hanzi: '见面', pinyin: 'jiànmiàn', meaningHanViet: 'Kiến Diện', meaningVi: 'Gặp mặt; gặp nhau' },
      { vocabId: 116, hanzi: '好', pinyin: 'hǎo', meaningHanViet: 'Hảo', meaningVi: 'Tốt; đẹp; khỏe' },
      { vocabId: 117, hanzi: '对', pinyin: 'duì', meaningHanViet: 'Đối', meaningVi: 'Đúng; chính xác' },
      { vocabId: 118, hanzi: '不对', pinyin: 'bùduì', meaningHanViet: 'Bất Đối', meaningVi: 'Không đúng; sai' },
      { vocabId: 119, hanzi: '行', pinyin: 'xíng', meaningHanViet: 'Hàng', meaningVi: 'Được; đi được' },
      { vocabId: 120, hanzi: '吧', pinyin: 'ba', meaningHanViet: 'Ba', meaningVi: 'Nhé, thôi, đi, chứ' }
    ]
  },
  {
    topicId: 2,
    title: 'Bài 02 — Bản thân và giới thiệu cá nhân',
    description: 'Đại từ, tên gọi, thông tin cá nhân, ngôn ngữ, quốc tịch và cách giới thiệu bản thân.',
    vocabularies: [
      { vocabId: 201, hanzi: '我', pinyin: 'wǒ', meaningHanViet: 'Ngã', meaningVi: 'Tôi, mình' },
      { vocabId: 202, hanzi: '你', pinyin: 'nǐ', meaningHanViet: 'Nễ', meaningVi: 'Bạn, anh, chị' },
      { vocabId: 203, hanzi: '您', pinyin: 'nín', meaningHanViet: 'Nâm', meaningVi: 'Ngài, ông, bà (kính trọng)' },
      { vocabId: 204, hanzi: '他', pinyin: 'tā', meaningHanViet: 'Tha', meaningVi: 'Anh ấy, ông ấy' },
      { vocabId: 205, hanzi: '她', pinyin: 'tā', meaningHanViet: 'Tha', meaningVi: 'Cô ấy, bà ấy' },
      { vocabId: 206, hanzi: '我们', pinyin: 'wǒmen', meaningHanViet: 'Ngã Môn', meaningVi: 'Chúng tôi, chúng ta' },
      { vocabId: 207, hanzi: '你们', pinyin: 'nǐmen', meaningHanViet: 'Nễ Môn', meaningVi: 'Các bạn' },
      { vocabId: 208, hanzi: '他们', pinyin: 'tāmen', meaningHanViet: 'Tha Môn', meaningVi: 'Họ, bọn họ' },
      { vocabId: 209, hanzi: '她们', pinyin: 'tāmen', meaningHanViet: 'Tha Môn', meaningVi: 'Các cô ấy' },
      { vocabId: 210, hanzi: '人', pinyin: 'rén', meaningHanViet: 'Nhân', meaningVi: 'Người, nhân loại' },
      { vocabId: 211, hanzi: '名字', pinyin: 'míngzi', meaningHanViet: 'Danh Tự', meaningVi: 'Tên' },
      { vocabId: 212, hanzi: '叫', pinyin: 'jiào', meaningHanViet: 'Khiếu', meaningVi: 'Gọi là; tên là' },
      { vocabId: 213, hanzi: '谁', pinyin: 'shéi', meaningHanViet: 'Thuỳ', meaningVi: 'Ai' },
      { vocabId: 214, hanzi: '什么', pinyin: 'shénme', meaningHanViet: 'Thậm Yêu', meaningVi: 'Cái gì, gì' },
      { vocabId: 215, hanzi: '岁', pinyin: 'suì', meaningHanViet: 'Tuế', meaningVi: 'Tuổi' },
      { vocabId: 216, hanzi: '介绍', pinyin: 'jièshào', meaningHanViet: 'Giới Thiệu', meaningVi: 'Giới thiệu' },
      { vocabId: 217, hanzi: '国家', pinyin: 'guójiā', meaningHanViet: 'Quốc Gia', meaningVi: 'Đất nước, quốc gia' },
      { vocabId: 218, hanzi: '中国', pinyin: 'Zhōngguó', meaningHanViet: 'Trung Quốc', meaningVi: 'Nước Trung Quốc' },
      { vocabId: 219, hanzi: '中文', pinyin: 'Zhōngwén', meaningHanViet: 'Trung Văn', meaningVi: 'Tiếng Trung (văn viết)' },
      { vocabId: 220, hanzi: '汉语', pinyin: 'Hànyǔ', meaningHanViet: 'Hán Ngữ', meaningVi: 'Tiếng Hán, tiếng Trung' }
    ]
  },
  {
    topicId: 3,
    title: 'Bài 03 — Gia đình và các mối quan hệ',
    description: 'Thành viên gia đình, quan hệ giữa người với người và những từ liên quan trực tiếp.',
    vocabularies: [
      { vocabId: 301, hanzi: '爸爸', pinyin: 'bàba', meaningHanViet: 'Ba Ba', meaningVi: 'Bố, cha' },
      { vocabId: 302, hanzi: '妈妈', pinyin: 'māma', meaningHanViet: 'Má Má', meaningVi: 'Mẹ, má' },
      { vocabId: 303, hanzi: '爷爷', pinyin: 'yéye', meaningHanViet: 'Gia Gia', meaningVi: 'Ông nội' },
      { vocabId: 304, hanzi: '奶奶', pinyin: 'nǎinai', meaningHanViet: 'Nãi Nãi', meaningVi: 'Bà nội' },
      { vocabId: 305, hanzi: '哥哥', pinyin: 'gēge', meaningHanViet: 'Ca Ca', meaningVi: 'Anh trai' },
      { vocabId: 306, hanzi: '姐姐', pinyin: 'jiějie', meaningHanViet: 'Tỷ Tỷ', meaningVi: 'Chị gái' },
      { vocabId: 307, hanzi: '弟弟', pinyin: 'dìdi', meaningHanViet: 'Đệ Đệ', meaningVi: 'Em trai' },
      { vocabId: 308, hanzi: '妹妹', pinyin: 'mèimei', meaningHanViet: 'Muội Muội', meaningVi: 'Em gái' },
      { vocabId: 309, hanzi: '儿子', pinyin: 'érzi', meaningHanViet: 'Nhân Tử', meaningVi: 'Con trai' },
      { vocabId: 310, hanzi: '女儿', pinyin: 'nǚ\'ér', meaningHanViet: 'Nữ Nhân', meaningVi: 'Con gái' },
      { vocabId: 311, hanzi: '孩子', pinyin: 'háizi', meaningHanViet: 'Hài Tử', meaningVi: 'Đứa trẻ, con cái' },
      { vocabId: 312, hanzi: '家人', pinyin: 'jiārén', meaningHanViet: 'Gia Nhân', meaningVi: 'Người trong nhà' },
      { vocabId: 313, hanzi: '朋友', pinyin: 'péngyou', meaningHanViet: 'Bằng Hữu', meaningVi: 'Bạn bè' },
      { vocabId: 314, hanzi: '男朋友', pinyin: 'nánpéngyou', meaningHanViet: 'Nam Bằng Hữu', meaningVi: 'Bạn trai' },
      { vocabId: 315, hanzi: '女朋友', pinyin: 'nǚpéngyou', meaningHanViet: 'Nữ Bằng Hữu', meaningVi: 'Bạn gái' },
      { vocabId: 316, hanzi: '男', pinyin: 'nán', meaningHanViet: 'Nam', meaningVi: 'Nam giới, đàn ông' },
      { vocabId: 317, hanzi: '女', pinyin: 'nǚ', meaningHanViet: 'Nữ', meaningVi: 'Nữ giới, phụ nữ' },
      { vocabId: 318, hanzi: '男人', pinyin: 'nánrén', meaningHanViet: 'Nam Nhân', meaningVi: 'Người đàn ông' },
      { vocabId: 319, hanzi: '女人', pinyin: 'nǚrén', meaningHanViet: 'Nữ Nhân', meaningVi: 'Người phụ nữ' },
      { vocabId: 320, hanzi: '老人', pinyin: 'lǎorén', meaningHanViet: 'Lão Nhân', meaningVi: 'Người già, người cao tuổi' }
    ]
  },
  {
    topicId: 4,
    title: 'Bài 04 — Số đếm, ngày tháng và thời gian',
    description: 'Số lượng, tuổi, ngày tháng, thứ, giờ và cách biểu đạt thời gian.',
    vocabularies: [
      { vocabId: 401, hanzi: '一', pinyin: 'yī', meaningHanViet: 'Nhất', meaningVi: 'Số một' },
      { vocabId: 402, hanzi: '二', pinyin: 'èr', meaningHanViet: 'Nhị', meaningVi: 'Số hai' },
      { vocabId: 403, hanzi: '三', pinyin: 'sān', meaningHanViet: 'Tam', meaningVi: 'Số ba' },
      { vocabId: 404, hanzi: '四', pinyin: 'sì', meaningHanViet: 'Tứ', meaningVi: 'Số bốn' },
      { vocabId: 405, hanzi: '五', pinyin: 'wǔ', meaningHanViet: 'Ngũ', meaningVi: 'Số năm' },
      { vocabId: 406, hanzi: '六', pinyin: 'liù', meaningHanViet: 'Lục', meaningVi: 'Số sáu' },
      { vocabId: 407, hanzi: '七', pinyin: 'qī', meaningHanViet: 'Thất', meaningVi: 'Số bảy' },
      { vocabId: 408, hanzi: '八', pinyin: 'bā', meaningHanViet: 'Bát', meaningVi: 'Số tám' },
      { vocabId: 409, hanzi: '九', pinyin: 'jiǔ', meaningHanViet: 'Cửu', meaningVi: 'Số chín' },
      { vocabId: 410, hanzi: '十', pinyin: 'shí', meaningHanViet: 'Thập', meaningVi: 'Số mười' },
      { vocabId: 411, hanzi: '百', pinyin: 'bǎi', meaningHanViet: 'Bách', meaningVi: 'Trăm' },
      { vocabId: 412, hanzi: '零', pinyin: 'líng', meaningHanViet: 'Linh', meaningVi: 'Số không' },
      { vocabId: 413, hanzi: '年', pinyin: 'nián', meaningHanViet: 'Niên', meaningVi: 'Năm' },
      { vocabId: 414, hanzi: '月', pinyin: 'yuè', meaningHanViet: 'Nguyệt', meaningVi: 'Tháng; mặt trăng' },
      { vocabId: 415, hanzi: '日', pinyin: 'rì', meaningHanViet: 'Nhật', meaningVi: 'Ngày; mặt trời' },
      { vocabId: 416, hanzi: '号', pinyin: 'hào', meaningHanViet: 'Hiệu', meaningVi: 'Ngày (trong tháng); số' },
      { vocabId: 417, hanzi: '星期', pinyin: 'xīngqī', meaningHanViet: 'Tinh Kỳ', meaningVi: 'Tuần lễ, thứ' },
      { vocabId: 418, hanzi: '点', pinyin: 'diǎn', meaningHanViet: 'Điểm', meaningVi: 'Giờ; điểm' },
      { vocabId: 419, hanzi: '分', pinyin: 'fēn', meaningHanViet: 'Phân', meaningVi: 'Phút' },
      { vocabId: 420, hanzi: '半', pinyin: 'bàn', meaningHanViet: 'Bán', meaningVi: 'Rưỡi; một nửa' }
    ]
  },
  {
    topicId: 5,
    title: 'Bài 05 — Trường học, học tập và công việc',
    description: 'Trường học, lớp học, giáo viên, học sinh, sách vở, hoạt động học tập và nghề nghiệp.',
    vocabularies: [
      { vocabId: 501, hanzi: '学校', pinyin: 'xuéxiào', meaningHanViet: 'Học Hiệu', meaningVi: 'Trường học' },
      { vocabId: 502, hanzi: '老师', pinyin: 'lǎoshī', meaningHanViet: 'Lão Sư', meaningVi: 'Thầy cô giáo' },
      { vocabId: 503, hanzi: '学生', pinyin: 'xuéshēng', meaningHanViet: 'Học Sinh', meaningVi: 'Học sinh, sinh viên' },
      { vocabId: 504, hanzi: '同学', pinyin: 'tóngxué', meaningHanViet: 'Đồng Học', meaningVi: 'Bạn học cùng lớp' },
      { vocabId: 505, hanzi: '班', pinyin: 'bān', meaningHanViet: 'Ban', meaningVi: 'Lớp học' },
      { vocabId: 506, hanzi: '学', pinyin: 'xué', meaningHanViet: 'Học', meaningVi: 'Học tập' },
      { vocabId: 507, hanzi: '学习', pinyin: 'xuéxí', meaningHanViet: 'Học Tập', meaningVi: 'Học tập, nghiên cứu' },
      { vocabId: 508, hanzi: '上课', pinyin: 'shàngkè', meaningHanViet: 'Thướng Khoá', meaningVi: 'Vào học, đi học' },
      { vocabId: 509, hanzi: '下课', pinyin: 'xiàkè', meaningHanViet: 'Hạ Khoá', meaningVi: 'Tan học' },
      { vocabId: 510, hanzi: '上学', pinyin: 'shàngxué', meaningHanViet: 'Thướng Học', meaningVi: 'Đi học' },
      { vocabId: 511, hanzi: '放学', pinyin: 'fàngxué', meaningHanViet: 'Phóng Học', meaningVi: 'Tan trường' },
      { vocabId: 512, hanzi: '书', pinyin: 'shū', meaningHanViet: 'Thư', meaningVi: 'Sách' },
      { vocabId: 513, hanzi: '本子', pinyin: 'běnzi', meaningHanViet: 'Bản Tử', meaningVi: 'Vở, cuốn tập' },
      { vocabId: 514, hanzi: '课本', pinyin: 'kèběn', meaningHanViet: 'Khoá Bản', meaningVi: 'Sách giáo khoa' },
      { vocabId: 515, hanzi: '课文', pinyin: 'kèwén', meaningHanViet: 'Khoá Văn', meaningVi: 'Bài đọc, bài khóa' },
      { vocabId: 516, hanzi: '写', pinyin: 'xiě', meaningHanViet: 'Tả', meaningVi: 'Viết' },
      { vocabId: 517, hanzi: '汉字', pinyin: 'Hànzì', meaningHanViet: 'Hán Tự', meaningVi: 'Chữ Hán' },
      { vocabId: 518, hanzi: '考试', pinyin: 'kǎoshì', meaningHanViet: 'Khảo Thí', meaningVi: 'Thi cử, kiểm tra' },
      { vocabId: 519, hanzi: '工作', pinyin: 'gōngzuò', meaningHanViet: 'Công Tác', meaningVi: 'Công việc, làm việc' },
      { vocabId: 520, hanzi: '医生', pinyin: 'yīshēng', meaningHanViet: 'Y Sinh', meaningVi: 'Bác sĩ' }
    ]
  },
  {
    topicId: 6,
    title: 'Bài 06 — Đồ ăn, thức uống và nhà hàng',
    description: 'Thực phẩm, món ăn, đồ uống, hoạt động ăn uống và các biểu đạt bữa ăn.',
    vocabularies: [
      { vocabId: 601, hanzi: '吃', pinyin: 'chī', meaningHanViet: 'Cật', meaningVi: 'Ăn' },
      { vocabId: 602, hanzi: '喝', pinyin: 'hē', meaningHanViet: 'Húp', meaningVi: 'Uống' },
      { vocabId: 603, hanzi: '饭', pinyin: 'fàn', meaningHanViet: 'Phạn', meaningVi: 'Cơm, bữa ăn' },
      { vocabId: 604, hanzi: '吃饭', pinyin: 'chīfàn', meaningHanViet: 'Cật Phạn', meaningVi: 'Ăn cơm' },
      { vocabId: 605, hanzi: '米饭', pinyin: 'mǐfàn', meaningHanViet: 'Mễ Phạn', meaningVi: 'Cơm trắng' },
      { vocabId: 606, hanzi: '菜', pinyin: 'cài', meaningHanViet: 'Thái', meaningVi: 'Món ăn, rau' },
      { vocabId: 607, hanzi: '肉', pinyin: 'ròu', meaningHanViet: 'Nhục', meaningVi: 'Thịt' },
      { vocabId: 608, hanzi: '鸡蛋', pinyin: 'jīdàn', meaningHanViet: 'Kê Đản', meaningVi: 'Trứng gà' },
      { vocabId: 609, hanzi: '面包', pinyin: 'miànbāo', meaningHanViet: 'Diện Bao', meaningVi: 'Bánh mì' },
      { vocabId: 610, hanzi: '包子', pinyin: 'bāozi', meaningHanViet: 'Bao Tử', meaningVi: 'Bánh bao' },
      { vocabId: 611, hanzi: '水', pinyin: 'shuǐ', meaningHanViet: 'Thuỷ', meaningVi: 'Nước' },
      { vocabId: 612, hanzi: '茶', pinyin: 'chá', meaningHanViet: 'Trà', meaningVi: 'Trà, chè' },
      { vocabId: 613, hanzi: '牛奶', pinyin: 'niúnǎi', meaningHanViet: 'Ngưu Nãi', meaningVi: 'Sữa bò' },
      { vocabId: 614, hanzi: '水果', pinyin: 'shuǐguǒ', meaningHanViet: 'Thuỷ Quả', meaningVi: 'Hoa quả, trái cây' },
      { vocabId: 615, hanzi: '好吃', pinyin: 'hǎochī', meaningHanViet: 'Hảo Cật', meaningVi: 'Ngon miệng' },
      { vocabId: 616, hanzi: '饿', pinyin: 'è', meaningHanViet: 'Ngạ', meaningVi: 'Đói bụng' },
      { vocabId: 617, hanzi: '渴', pinyin: 'kě', meaningHanViet: 'Khát', meaningVi: 'Khát nước' },
      { vocabId: 618, hanzi: '杯', pinyin: 'bēi', meaningHanViet: 'Bôi', meaningVi: 'Cốc, ly (lượng từ)' },
      { vocabId: 619, hanzi: '杯子', pinyin: 'bēizi', meaningHanViet: 'Bôi Tử', meaningVi: 'Cái cốc, cái ly' },
      { vocabId: 620, hanzi: '饭店', pinyin: 'fàndiàn', meaningHanViet: 'Phạn Điếm', meaningVi: 'Nhà hàng, quán ăn' }
    ]
  },
  {
    topicId: 7,
    title: 'Bài 07 — Nhà cửa và sinh hoạt hằng ngày',
    description: 'Nhà ở, phòng, đồ vật trong nhà, sinh hoạt và các hoạt động thường nhật.',
    vocabularies: [
      { vocabId: 701, hanzi: '家', pinyin: 'jiā', meaningHanViet: 'Gia', meaningVi: 'Nhà, gia đình' },
      { vocabId: 702, hanzi: '家里', pinyin: 'jiā li', meaningHanViet: 'Gia Lý', meaningVi: 'Trong nhà' },
      { vocabId: 703, hanzi: '回家', pinyin: 'huí jiā', meaningHanViet: 'Hồi Gia', meaningVi: 'Về nhà' },
      { vocabId: 704, hanzi: '在家', pinyin: 'zàijiā', meaningHanViet: 'Tại Gia', meaningVi: 'Ở nhà' },
      { vocabId: 705, hanzi: '房子', pinyin: 'fángzi', meaningHanViet: 'Phòng Tử', meaningVi: 'Ngôi nhà' },
      { vocabId: 706, hanzi: '房间', pinyin: 'fángjiān', meaningHanViet: 'Phòng Gian', meaningVi: 'Căn phòng' },
      { vocabId: 707, hanzi: '门', pinyin: 'mén', meaningHanViet: 'Môn', meaningVi: 'Cửa ra vào' },
      { vocabId: 708, hanzi: '门口', pinyin: 'ménkǒu', meaningHanViet: 'Môn Khẩu', meaningVi: 'Cổng, lối vào' },
      { vocabId: 709, hanzi: '床', pinyin: 'chuáng', meaningHanViet: 'Sàng', meaningVi: 'Cái giường' },
      { vocabId: 710, hanzi: '桌子', pinyin: 'zhuōzi', meaningHanViet: 'Trác Tử', meaningVi: 'Cái bàn' },
      { vocabId: 711, hanzi: '地上', pinyin: 'dìshang', meaningHanViet: 'Địa Thướng', meaningVi: 'Trên mặt đất' },
      { vocabId: 712, hanzi: '电话', pinyin: 'diànhuà', meaningHanViet: 'Điện Thoại', meaningVi: 'Điện thoại' },
      { vocabId: 713, hanzi: '手机', pinyin: 'shǒujī', meaningHanViet: 'Thủ Cơ', meaningVi: 'Điện thoại di động' },
      { vocabId: 714, hanzi: '电脑', pinyin: 'diànnǎo', meaningHanViet: 'Điện Não', meaningVi: 'Máy vi tính' },
      { vocabId: 715, hanzi: '电视', pinyin: 'diànshì', meaningHanViet: 'Điện Thị', meaningVi: 'Truyền hình, TV' },
      { vocabId: 716, hanzi: '电视机', pinyin: 'diànshìjī', meaningHanViet: 'Điện Thị Cơ', meaningVi: 'Máy thu hình TV' },
      { vocabId: 717, hanzi: '洗手间', pinyin: 'xǐshǒujiān', meaningHanViet: 'Tẩy Thủ Gian', meaningVi: 'Nhà vệ sinh' },
      { vocabId: 718, hanzi: '洗', pinyin: 'xǐ', meaningHanViet: 'Tẩy', meaningVi: 'Rửa, giặt, tắm' },
      { vocabId: 719, hanzi: '睡觉', pinyin: 'shuìjiào', meaningHanViet: 'Thuỵ Giáo', meaningVi: 'Đi ngủ' },
      { vocabId: 720, hanzi: '起床', pinyin: 'qǐchuáng', meaningHanViet: 'Khởi Sàng', meaningVi: 'Thức dậy' }
    ]
  },
  {
    topicId: 8,
    title: 'Bài 08 — Địa điểm, phương hướng và giao thông',
    description: 'Địa điểm, vị trí, phương hướng, đi lại và các phương tiện giao thông.',
    vocabularies: [
      { vocabId: 801, hanzi: '去', pinyin: 'qù', meaningHanViet: 'Khứ', meaningVi: 'Đi' },
      { vocabId: 802, hanzi: '来', pinyin: 'lái', meaningHanViet: 'Lai', meaningVi: 'Đến, tới' },
      { vocabId: 803, hanzi: '回', pinyin: 'huí', meaningHanViet: 'Hồi', meaningVi: 'Trở về, quay lại' },
      { vocabId: 804, hanzi: '走', pinyin: 'zǒu', meaningHanViet: 'Tẩu', meaningVi: 'Đi bộ, rời đi' },
      { vocabId: 805, hanzi: '路', pinyin: 'lù', meaningHanViet: 'Lộ', meaningVi: 'Con đường' },
      { vocabId: 806, hanzi: '马路', pinyin: 'mǎlù', meaningHanViet: 'Mã Lộ', meaningVi: 'Đường phố lớn' },
      { vocabId: 807, hanzi: '车', pinyin: 'chē', meaningHanViet: 'Xa', meaningVi: 'Xe cộ' },
      { vocabId: 808, hanzi: '车站', pinyin: 'chēzhàn', meaningHanViet: 'Xa Trạm', meaningVi: 'Bến xe, nhà ga' },
      { vocabId: 809, hanzi: '汽车', pinyin: 'qìchē', meaningHanViet: 'Khí Xa', meaningVi: 'Xe ô tô' },
      { vocabId: 810, hanzi: '飞机', pinyin: 'fēijī', meaningHanViet: 'Phi Cơ', meaningVi: 'Máy bay' },
      { vocabId: 811, hanzi: '坐', pinyin: 'zuò', meaningHanViet: 'Toạ', meaningVi: 'Ngồi; đi (xe/tàu/máy bay)' },
      { vocabId: 812, hanzi: '上车', pinyin: 'shàng chē', meaningHanViet: 'Thướng Xa', meaningVi: 'Lên xe' },
      { vocabId: 813, hanzi: '下车', pinyin: 'xià chē', meaningHanViet: 'Hạ Xa', meaningVi: 'Xuống xe' },
      { vocabId: 814, hanzi: '东', pinyin: 'dōng', meaningHanViet: 'Đông', meaningVi: 'Phía đông' },
      { vocabId: 815, hanzi: '南', pinyin: 'nán', meaningHanViet: 'Nam', meaningVi: 'Phía nam' },
      { vocabId: 816, hanzi: '西', pinyin: 'xī', meaningHanViet: 'Tây', meaningVi: 'Phía tây' },
      { vocabId: 817, hanzi: '北', pinyin: 'běi', meaningHanViet: 'Bắc', meaningVi: 'Phía bắc' },
      { vocabId: 818, hanzi: '左', pinyin: 'zuǒ', meaningHanViet: 'Tả', meaningVi: 'Bên trái' },
      { vocabId: 819, hanzi: '右', pinyin: 'yòu', meaningHanViet: 'Hữu', meaningVi: 'Bên phải' },
      { vocabId: 820, hanzi: '中间', pinyin: 'zhōngjiān', meaningHanViet: 'Trung Gian', meaningVi: 'Ở giữa' }
    ]
  },
  {
    topicId: 9,
    title: 'Bài 09 — Mua sắm, tiền bạc và quần áo',
    description: 'Giá cả, mua bán, tiền tệ, số lượng khi mua hàng, quần áo và màu sắc.',
    vocabularies: [
      { vocabId: 901, hanzi: '买', pinyin: 'mǎi', meaningHanViet: 'Mãi', meaningVi: 'Mua' },
      { vocabId: 902, hanzi: '商店', pinyin: 'shāngdiàn', meaningHanViet: 'Thương Điếm', meaningVi: 'Cửa hàng, tiệm' },
      { vocabId: 903, hanzi: '商场', pinyin: 'shāngchǎng', meaningHanViet: 'Thương Tràng', meaningVi: 'Trung tâm mua sắm' },
      { vocabId: 904, hanzi: '东西', pinyin: 'dōngxi', meaningHanViet: 'Đông Tây', meaningVi: 'Đồ đạc, vật dụng' },
      { vocabId: 905, hanzi: '钱', pinyin: 'qián', meaningHanViet: 'Tiền', meaningVi: 'Tiền bạc' },
      { vocabId: 906, hanzi: '钱包', pinyin: 'qiánbāo', meaningHanViet: 'Tiền Bao', meaningVi: 'Ví tiền' },
      { vocabId: 907, hanzi: '包', pinyin: 'bāo', meaningHanViet: 'Bao', meaningVi: 'Túi, bọc' },
      { vocabId: 908, hanzi: '花', pinyin: 'huā', meaningHanViet: 'Hoa', meaningVi: 'Hoa; tiêu (tiền/thời gian)' },
      { vocabId: 909, hanzi: '贵', pinyin: 'guì', meaningHanViet: 'Quý', meaningVi: 'Đắt tiền' },
      { vocabId: 910, hanzi: '衣服', pinyin: 'yīfu', meaningHanViet: 'Y Phục', meaningVi: 'Quần áo' },
      { vocabId: 911, hanzi: '穿', pinyin: 'chuān', meaningHanViet: 'Xuyên', meaningVi: 'Mặc áo, đi giày' },
      { vocabId: 912, hanzi: '新', pinyin: 'xīn', meaningHanViet: 'Tân', meaningVi: 'Mới' },
      { vocabId: 913, hanzi: '大', pinyin: 'dà', meaningHanViet: 'Đại', meaningVi: 'To lớn' },
      { vocabId: 914, hanzi: '小', pinyin: 'xiǎo', meaningHanViet: 'Tiểu', meaningVi: 'Nhỏ bé' },
      { vocabId: 915, hanzi: '白', pinyin: 'bái', meaningHanViet: 'Bạch', meaningVi: 'Màu trắng' },
      { vocabId: 916, hanzi: '多少', pinyin: 'duōshao', meaningHanViet: 'Đa Thiểu', meaningVi: 'Bao nhiêu' },
      { vocabId: 917, hanzi: '几', pinyin: 'jǐ', meaningHanViet: 'Cơ', meaningVi: 'Mấy, vài' },
      { vocabId: 918, hanzi: '块', pinyin: 'kuài', meaningHanViet: 'Khối', meaningVi: 'Đồng (tiền tệ); cục' },
      { vocabId: 919, hanzi: '元', pinyin: 'yuán', meaningHanViet: 'Nguyên', meaningVi: 'Tệ (đơn vị tiền)' },
      { vocabId: 920, hanzi: '找', pinyin: 'zhǎo', meaningHanViet: 'Trảo', meaningVi: 'Tìm kiếm; trả lại tiền thừa' }
    ]
  },
  {
    topicId: 10,
    title: 'Bài 10 — Sở thích, thể thao và giải trí',
    description: 'Sở thích, hoạt động trong thời gian rảnh, thể thao, âm nhạc và giải trí.',
    vocabularies: [
      { vocabId: 1001, hanzi: '爱好', pinyin: 'àihào', meaningHanViet: 'Ái Hảo', meaningVi: 'Sở thích, đam mê' },
      { vocabId: 1002, hanzi: '喜欢', pinyin: 'xǐhuan', meaningHanViet: 'Hỷ Hoan', meaningVi: 'Thích' },
      { vocabId: 1003, hanzi: '爱', pinyin: 'ài', meaningHanViet: 'Ái', meaningVi: 'Yêu thương' },
      { vocabId: 1004, hanzi: '玩儿', pinyin: 'wánr', meaningHanViet: 'Ngoạn Nhân', meaningVi: 'Chơi đùa' },
      { vocabId: 1005, hanzi: '好玩儿', pinyin: 'hǎowánr', meaningHanViet: 'Hảo Ngoạn Nhân', meaningVi: 'Vui vẻ, thú vị' },
      { vocabId: 1006, hanzi: '球', pinyin: 'qiú', meaningHanViet: 'Cầu', meaningVi: 'Quả bóng' },
      { vocabId: 1007, hanzi: '打球', pinyin: 'dǎ qiú', meaningHanViet: 'Tá Cầu', meaningVi: 'Chơi bóng' },
      { vocabId: 1008, hanzi: '跑', pinyin: 'pǎo', meaningHanViet: 'Bào', meaningVi: 'Chạy' },
      { vocabId: 1009, hanzi: '唱', pinyin: 'chàng', meaningHanViet: 'Xướng', meaningVi: 'Hát' },
      { vocabId: 1010, hanzi: '歌', pinyin: 'gē', meaningHanViet: 'Ca', meaningVi: 'Bài hát' },
      { vocabId: 1011, hanzi: '唱歌', pinyin: 'chànggē', meaningHanViet: 'Xướng Ca', meaningVi: 'Hát ca' },
      { vocabId: 1012, hanzi: '听', pinyin: 'tīng', meaningHanViet: 'Dẫn', meaningVi: 'Nghe' },
      { vocabId: 1013, hanzi: '好听', pinyin: 'hǎotīng', meaningHanViet: 'Hảo Dẫn', meaningVi: 'Nghe hay' },
      { vocabId: 1014, hanzi: '看', pinyin: 'kàn', meaningHanViet: 'Khán', meaningVi: 'Xem, nhìn, đọc' },
      { vocabId: 1015, hanzi: '好看', pinyin: 'hǎokàn', meaningHanViet: 'Hảo Khán', meaningVi: 'Đẹp mắt, xem hay' },
      { vocabId: 1016, hanzi: '电影', pinyin: 'diànyǐng', meaningHanViet: 'Điện Ảnh', meaningVi: 'Phim ảnh' },
      { vocabId: 1017, hanzi: '电影院', pinyin: 'diànyǐngyuàn', meaningHanViet: 'Điện Ảnh Viện', meaningVi: 'Rạp chiếu phim' },
      { vocabId: 1018, hanzi: '上网', pinyin: 'shàngwǎng', meaningHanViet: 'Thướng Võng', meaningVi: 'Lướt mạng Internet' },
      { vocabId: 1019, hanzi: '高兴', pinyin: 'gāoxìng', meaningHanViet: 'Cao Hưng', meaningVi: 'Vui vẻ, hân hoan' },
      { vocabId: 1020, hanzi: '放假', pinyin: 'fàngjià', meaningHanViet: 'Phóng Giả', meaningVi: 'Nghỉ lễ, nghỉ phép' }
    ]
  }
];

/**
 * 10 Curated Topics for HSK 2
 */
export const HSK2_TOPICS = [
  { topicId: 201, title: 'Bài 01 — Chào hỏi nâng cao & Xã giao', description: 'Giao tiếp xã giao thường ngày, lịch sự và giới thiệu công việc.', vocabularies: [
    { vocabId: 2101, hanzi: '您好', pinyin: 'nínhǎo', meaningHanViet: 'Nâm Hảo', meaningVi: 'Chào ngài' },
    { vocabId: 2102, hanzi: '欢迎', pinyin: 'huānyíng', meaningHanViet: 'Hoan Nghênh', meaningVi: 'Hoan nghênh' },
    { vocabId: 2103, hanzi: '客气', pinyin: 'kèqi', meaningHanViet: 'Khách Khí', meaningVi: 'Khách sáo' },
    { vocabId: 2104, hanzi: '帮助', pinyin: 'bāngzhù', meaningHanViet: 'Bang Trợ', meaningVi: 'Giúp đỡ' },
    { vocabId: 2105, hanzi: '希望', pinyin: 'xīwàng', meaningHanViet: 'Hi Vọng', meaningVi: 'Hi vọng' },
    { vocabId: 2106, hanzi: '事情', pinyin: 'shìqing', meaningHanViet: 'Sự Tình', meaningVi: 'Sự việc, việc' }
  ]},
  { topicId: 202, title: 'Bài 02 — Thời tiết & Bốn mùa', description: 'Các từ vựng về khí hậu, nắng, mưa, mùa màng và cảm nhận nhiệt độ.', vocabularies: [
    { vocabId: 2201, hanzi: '天气', pinyin: 'tiānqì', meaningHanViet: 'Thiên Khí', meaningVi: 'Thời tiết' },
    { vocabId: 2202, hanzi: '晴', pinyin: 'qíng', meaningHanViet: 'Tình', meaningVi: 'Trời nắng' },
    { vocabId: 2203, hanzi: '阴', pinyin: 'yīn', meaningHanViet: 'Âm', meaningVi: 'Trời râm' },
    { vocabId: 2204, hanzi: '下雪', pinyin: 'xiàxuě', meaningHanViet: 'Hạ Tuyết', meaningVi: 'Tuyết rơi' },
    { vocabId: 2205, hanzi: '冷', pinyin: 'lěng', meaningHanViet: 'Lãnh', meaningVi: 'Lạnh' },
    { vocabId: 2206, hanzi: '热', pinyin: 'rè', meaningHanViet: 'Nhiệt', meaningVi: 'Nóng' }
  ]},
  { topicId: 203, title: 'Bài 03 — Sức khỏe & Thể chất', description: 'Các biểu đạt về trạng thái cơ thể, cảm mạo và khám chữa bệnh.', vocabularies: [
    { vocabId: 2301, hanzi: '身体', pinyin: 'shēntǐ', meaningHanViet: 'Thân Thể', meaningVi: 'Cơ thể, sức khỏe' },
    { vocabId: 2302, hanzi: '生病', pinyin: 'shēngbìng', meaningHanViet: 'Sinh Bệnh', meaningVi: 'Bị ốm, ngã bệnh' },
    { vocabId: 2303, hanzi: '感冒', pinyin: 'gǎnmào', meaningHanViet: 'Cảm Mạo', meaningVi: 'Cảm lạnh' },
    { vocabId: 2304, hanzi: '发烧', pinyin: 'fāshāo', meaningHanViet: 'Phát Thiêu', meaningVi: 'Sốt' },
    { vocabId: 2305, hanzi: '吃药', pinyin: 'chīyào', meaningHanViet: 'Cật Dược', meaningVi: 'Uống thuốc' },
    { vocabId: 2306, hanzi: '休息', pinyin: 'xiūxi', meaningHanViet: 'Hưu Tức', meaningVi: 'Nghỉ ngơi' }
  ]},
  { topicId: 204, title: 'Bài 04 — Mua sắm & Thanh toán', description: 'Từ vựng siêu thị, giảm giá, đổi trả và lựa chọn sản phẩm.', vocabularies: [
    { vocabId: 2401, hanzi: '便宜', pinyin: 'piányi', meaningHanViet: 'Tiện Nghi', meaningVi: 'Rẻ' },
    { vocabId: 2402, hanzi: '贵', pinyin: 'guì', meaningHanViet: 'Quý', meaningVi: 'Đắt' },
    { vocabId: 2403, hanzi: '颜色', pinyin: 'yánsè', meaningHanViet: 'Nhan Sắc', meaningVi: 'Màu sắc' },
    { vocabId: 2404, hanzi: '红', pinyin: 'hóng', meaningHanViet: 'Hồng', meaningVi: 'Màu đỏ' },
    { vocabId: 2405, hanzi: '黑', pinyin: 'hēi', meaningHanViet: 'Hắc', meaningVi: 'Màu đen' }
  ]},
  { topicId: 205, title: 'Bài 05 — Đi lại & Du lịch', description: 'Hỏi đường, phương tiện giao thông và vé máy bay.', vocabularies: [
    { vocabId: 2501, hanzi: '旅游', pinyin: 'lǚyóu', meaningHanViet: 'Lữ Du', meaningVi: 'Du lịch' },
    { vocabId: 2502, hanzi: '出差', pinyin: 'chūchāi', meaningHanViet: 'Xuất Sai', meaningVi: 'Đi công tác' },
    { vocabId: 2503, hanzi: '火车站', pinyin: 'huǒchēzhàn', meaningHanViet: 'Hỏa Xa Trạm', meaningVi: 'Ga tàu hỏa' },
    { vocabId: 2504, hanzi: '机场', pinyin: 'jīchǎng', meaningHanViet: 'Cơ Tràng', meaningVi: 'Sân bay' },
    { vocabId: 2505, hanzi: '远', pinyin: 'yuǎn', meaningHanViet: 'Viễn', meaningVi: 'Xa' },
    { vocabId: 2506, hanzi: '近', pinyin: 'jìn', meaningHanViet: 'Cận', meaningVi: 'Gần' }
  ]},
  { topicId: 206, title: 'Bài 06 — Nhà hàng & Ẩm thực', description: 'Gọi món, đồ uống, hương vị ngọt bùi mặn cay.', vocabularies: [
    { vocabId: 2601, hanzi: '羊肉', pinyin: 'yángròu', meaningHanViet: 'Dương Nhục', meaningVi: 'Thịt cừu' },
    { vocabId: 2602, hanzi: '鱼', pinyin: 'yú', meaningHanViet: 'Ngư', meaningVi: 'Cá' },
    { vocabId: 2603, hanzi: '咖啡', pinyin: 'kāfēi', meaningHanViet: 'Cà Phê', meaningVi: 'Cà phê' },
    { vocabId: 2604, hanzi: '西瓜', pinyin: 'xīguā', meaningHanViet: 'Tây Qua', meaningVi: 'Dưa hấu' }
  ]},
  { topicId: 207, title: 'Bài 07 — Công sở & Nghề nghiệp', description: 'Văn phòng, họp hành, báo cáo và nhiệm vụ.', vocabularies: [
    { vocabId: 2701, hanzi: '公司', pinyin: 'gōngsī', meaningHanViet: 'Công Ty', meaningVi: 'Công ty' },
    { vocabId: 2702, hanzi: '经理', pinyin: 'jīnglǐ', meaningHanViet: 'Kinh Lý', meaningVi: 'Giám đốc, quản lý' },
    { vocabId: 2703, hanzi: '同事', pinyin: 'tóngshì', meaningHanViet: 'Đồng Sự', meaningVi: 'Đồng nghiệp' },
    { vocabId: 2704, hanzi: '开会', pinyin: 'kāihuì', meaningHanViet: 'Khai Hội', meaningVi: 'Họp hành' }
  ]},
  { topicId: 208, title: 'Bài 08 — Học tập & Kỹ năng', description: 'Trau dồi ngoại ngữ, luyện đọc và thi chứng chỉ.', vocabularies: [
    { vocabId: 2801, hanzi: '懂', pinyin: 'dǒng', meaningHanViet: 'Đổng', meaningVi: 'Hiểu' },
    { vocabId: 2802, hanzi: '题', pinyin: 'tí', meaningHanViet: 'Đề', meaningVi: 'Đề bài, câu hỏi' },
    { vocabId: 2803, hanzi: '容易', pinyin: 'róngyì', meaningHanViet: 'Dung Dịch', meaningVi: 'Dễ dàng' },
    { vocabId: 2804, hanzi: '难', pinyin: 'nán', meaningHanViet: 'Nan', meaningVi: 'Khó khăn' }
  ]},
  { topicId: 209, title: 'Bài 09 — Sở thích & Giải trí', description: 'Ca nhạc, xem kịch, tập thể dục và dã ngoại.', vocabularies: [
    { vocabId: 2901, hanzi: '运动', pinyin: 'yùndòng', meaningHanViet: 'Vận Động', meaningVi: 'Vận động, thể thao' },
    { vocabId: 2902, hanzi: '跑步', pinyin: 'pǎobù', meaningHanViet: 'Bào Bộ', meaningVi: 'Chạy bộ' },
    { vocabId: 2903, hanzi: '游泳', pinyin: 'yóuyǒng', meaningHanViet: 'Du Vịnh', meaningVi: 'Bơi lội' },
    { vocabId: 2904, hanzi: '踢足球', pinyin: 'tī zúqiú', meaningHanViet: 'Thích Túc Cầu', meaningVi: 'Đá bóng' }
  ]},
  { topicId: 210, title: 'Bài 10 — Cảm xúc & Tính cách', description: 'Vui vẻ, mệt mỏi, nhiệt tình và kiên nhẫn.', vocabularies: [
    { vocabId: 2951, hanzi: '高兴', pinyin: 'gāoxìng', meaningHanViet: 'Cao Hưng', meaningVi: 'Vui vẻ' },
    { vocabId: 2952, hanzi: '累', pinyin: 'lèi', meaningHanViet: 'Luy', meaningVi: 'Mệt mỏi' },
    { vocabId: 2953, hanzi: '忙', pinyin: 'máng', meaningHanViet: 'Mang', meaningVi: 'Bận rộn' },
    { vocabId: 2954, hanzi: '快乐', pinyin: 'kuàilè', meaningHanViet: 'Khoái Lạc', meaningVi: 'Vui sướng, hạnh phúc' }
  ]}
];

/**
 * 10 Curated Topics for HSK 3
 */
export const HSK3_TOPICS = [
  { topicId: 301, title: 'Bài 01 — Quan hệ bạn bè & Xã hội', description: 'Giao tiếp cộng đồng, kết bạn và duy trì mối quan hệ bền chặt.', vocabularies: [
    { vocabId: 3101, hanzi: '邻居', pinyin: 'línjū', meaningHanViet: 'Lân Cư', meaningVi: 'Hàng xóm' },
    { vocabId: 3102, hanzi: '热情', pinyin: 'rèqíng', meaningHanViet: 'Nhiệt Tình', meaningVi: 'Nhiệt tình' },
    { vocabId: 3103, hanzi: '礼貌', pinyin: 'lǐmào', meaningHanViet: 'Lễ Mạo', meaningVi: 'Lễ phép' },
    { vocabId: 3104, hanzi: '相信', pinyin: 'xiāngxìn', meaningHanViet: 'Tương Tín', meaningVi: 'Tin tưởng' }
  ]},
  { topicId: 302, title: 'Bài 02 — Môi trường & Khí hậu', description: 'Bảo vệ thiên nhiên, rừng cây và khí hậu toàn cầu.', vocabularies: [
    { vocabId: 3201, hanzi: '环境', pinyin: 'huánjìng', meaningHanViet: 'Hoàn Cảnh', meaningVi: 'Môi trường' },
    { vocabId: 3202, hanzi: '保护', pinyin: 'bǎohù', meaningHanViet: 'Bảo Hộ', meaningVi: 'Bảo vệ' },
    { vocabId: 3203, hanzi: '空气', pinyin: 'kōngqì', meaningHanViet: 'Không Khí', meaningVi: 'Không khí' },
    { vocabId: 3204, hanzi: '树木', pinyin: 'shùmù', meaningHanViet: 'Thụ Mộc', meaningVi: 'Cây cối' }
  ]},
  { topicId: 303, title: 'Bài 03 — Du lịch & Khám phá văn hóa', description: 'Danh lam thắng cảnh, bảo tàng và di tích lịch sử.', vocabularies: [
    { vocabId: 3301, hanzi: '世界', pinyin: 'shìjiè', meaningHanViet: 'Thế Giới', meaningVi: 'Thế giới' },
    { vocabId: 3302, hanzi: '文化', pinyin: 'wénhuà', meaningHanViet: 'Văn Hóa', meaningVi: 'Văn hóa' },
    { vocabId: 3303, hanzi: '历史', pinyin: 'lìshǐ', meaningHanViet: 'Lịch Sử', meaningVi: 'Lịch sử' },
    { vocabId: 3304, hanzi: '有名', pinyin: 'yǒumíng', meaningHanViet: 'Hữu Danh', meaningVi: 'Nổi tiếng' }
  ]},
  { topicId: 304, title: 'Bài 04 — Kinh tế & Tiêu dùng thông minh', description: 'Tài chính cá nhân, mua sắm trực tuyến và thanh toán số.', vocabularies: [
    { vocabId: 3401, hanzi: '信用卡', pinyin: 'xìnyòngkǎ', meaningHanViet: 'Tín Dụng Tạp', meaningVi: 'Thẻ tín dụng' },
    { vocabId: 3402, hanzi: '打折', pinyin: 'dǎzhé', meaningHanViet: 'Đả Chiết', meaningVi: 'Giảm giá' },
    { vocabId: 3403, hanzi: '价格', pinyin: 'jiàgé', meaningHanViet: 'Giá Cách', meaningVi: 'Giá cả' },
    { vocabId: 3404, hanzi: '质量', pinyin: 'zhìliàng', meaningHanViet: 'Chất Lượng', meaningVi: 'Chất lượng' }
  ]},
  { topicId: 305, title: 'Bài 05 — Công nghệ & Cuộc sống số', description: 'Internet, truyền thông xã hội và thiết bị thông minh.', vocabularies: [
    { vocabId: 3501, hanzi: '网络', pinyin: 'wǎngluò', meaningHanViet: 'Võng Lạc', meaningVi: 'Mạng Internet' },
    { vocabId: 3502, hanzi: '电子邮件', pinyin: 'diànzǐ yóujiàn', meaningHanViet: 'Điện Tử Bưu Kiện', meaningVi: 'Email' },
    { vocabId: 3503, hanzi: '新闻', pinyin: 'xīnwén', meaningHanViet: 'Tân Văn', meaningVi: 'Tin tức' }
  ]},
  { topicId: 306, title: 'Bài 06 — Thể thao & Rèn luyện sức khỏe', description: 'Phòng gym, thi đấu thể thao và lối sống lành mạnh.', vocabularies: [
    { vocabId: 3601, hanzi: '比赛', pinyin: 'bǐsài', meaningHanViet: 'Tỉ Tái', meaningVi: 'Thi đấu' },
    { vocabId: 3602, hanzi: '健康', pinyin: 'jiànkāng', meaningHanViet: 'Kiện Khang', meaningVi: 'Sức khỏe' },
    { vocabId: 3603, hanzi: '锻炼', pinyin: 'duànliàn', meaningHanViet: 'Đoán Luyện', meaningVi: 'Rèn luyện' }
  ]},
  { topicId: 307, title: 'Bài 07 — Học đường & Kế hoạch tương lai', description: 'Chuyên ngành, thi đại học và ước mơ sự nghiệp.', vocabularies: [
    { vocabId: 3701, hanzi: '专业', pinyin: 'zhuānyè', meaningHanViet: 'Chuyên Nghiệp', meaningVi: 'Chuyên ngành' },
    { vocabId: 3702, hanzi: '计划', pinyin: 'jìhuà', meaningHanViet: 'Kế Hoạch', meaningVi: 'Kế hoạch' },
    { vocabId: 3703, hanzi: '留学', pinyin: 'liúxué', meaningHanViet: 'Lưu Học', meaningVi: 'Du học' }
  ]},
  { topicId: 308, title: 'Bài 08 — Nghề nghiệp & Phỏng vấn', description: 'Tìm việc, hồ sơ cá nhân và kinh nghiệm công tác.', vocabularies: [
    { vocabId: 3801, hanzi: '面试', pinyin: 'miànshì', meaningHanViet: 'Diện Thí', meaningVi: 'Phỏng vấn' },
    { vocabId: 3802, hanzi: '机会', pinyin: 'jīhuì', meaningHanViet: 'Cơ Hội', meaningVi: 'Cơ hội' },
    { vocabId: 3803, hanzi: '经验', pinyin: 'jīngyàn', meaningHanViet: 'Kinh Nghiệm', meaningVi: 'Kinh nghiệm' }
  ]},
  { topicId: 309, title: 'Bài 09 — Đời sống đô thị & Sinh hoạt', description: 'Chung cư, giao thông công cộng và dịch vụ tiện ích.', vocabularies: [
    { vocabId: 3901, hanzi: '城市', pinyin: 'chéngshì', meaningHanViet: 'Thành Thị', meaningVi: 'Thành phố' },
    { vocabId: 3902, hanzi: '方便', pinyin: 'fāngbiàn', meaningHanViet: 'Phương Tiện', meaningVi: 'Thuận tiện' },
    { vocabId: 3903, hanzi: '地铁', pinyin: 'dìtiě', meaningHanViet: 'Địa Thiết', meaningVi: 'Tàu điện ngầm' }
  ]},
  { topicId: 310, title: 'Bài 10 — Thử thách & Vượt qua khó khăn', description: 'Nỗ lực, kiên trì, thành công và tự hào bản thân.', vocabularies: [
    { vocabId: 3951, hanzi: '成功', pinyin: 'chénggōng', meaningHanViet: 'Thành Công', meaningVi: 'Thành công' },
    { vocabId: 3952, hanzi: '坚持', pinyin: 'jiānchí', meaningHanViet: 'Kiên Trì', meaningVi: 'Kiên trì' },
    { vocabId: 3953, hanzi: '努力', pinyin: 'nǔlì', meaningHanViet: 'Nỗ Lực', meaningVi: 'Nỗ lực' }
  ]}
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

      // Top Toolbar: 2 Modes
      tabReading: document.getElementById('srsSkillTabReading'),
      tabWriting: document.getElementById('srsSkillTabWriting'),

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
      btnBackToSelection: document.getElementById('btnBackToSelection'),
      modeBadge: document.getElementById('srsSessionModeBadge'),
      progressText: document.getElementById('srsProgressText'),
      progressBarContainer: document.getElementById('srsProgressBarContainer'),
      progressBarFill: document.getElementById('srsProgressBarFill'),
      timerBadge: document.getElementById('reactionTimerBadge'),

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
      cardBackExampleBox: document.getElementById('cardBackExampleBox'),
      cardBackExampleSentence: document.getElementById('cardBackExampleSentence'),
      cardBackExampleTranslation: document.getElementById('cardBackExampleTranslation'),

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
      btnWritingReplay: document.getElementById('btnWritingReplay'),
      btnWritingOutline: document.getElementById('btnWritingOutline'),
      btnWritingClear: document.getElementById('btnWritingClear'),
      btnWritingNext: document.getElementById('btnWritingNext'),

      // Completion Stats
      statTotalReviewed: document.getElementById('statTotalReviewed'),
      statAgainCount: document.getElementById('statAgainCount'),
      statGoodEasyCount: document.getElementById('statGoodEasyCount'),
      statTotalTime: document.getElementById('statTotalTime')
    };

    this.bindEvents();
    this.parseQueryParams();

    // Preload radicals data in background
    this.fetchRadicalsData().catch(() => {});

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
        if (e.target.closest('input, textarea, select, label, .card-back-notes-layout')) return;
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
    if (this.dom.btnWritingAudio) {
      this.dom.btnWritingAudio.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playPronunciation(this.dom.btnWritingAudio);
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
      this.dom.btnWritingNext.addEventListener('click', () => this.nextWritingItem());
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
    this.activeAction = (rawAction === 'continue' || rawAction === 'review') ? rawAction : null;

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

    // Mode tabs
    if (this.dom.tabReading && this.dom.tabWriting) {
      const isFlashcard = this.activeMode === 'flashcard';
      this.dom.tabReading.className = `btn btn-sm rounded-pill py-2 px-3 px-sm-4 fw-bold srs-skill-tab srs-mode-tab ${isFlashcard ? 'btn-chinese-primary' : 'btn-outline-secondary border-0'}`;
      this.dom.tabReading.setAttribute('aria-selected', isFlashcard ? 'true' : 'false');

      this.dom.tabWriting.className = `btn btn-sm rounded-pill py-2 px-3 px-sm-4 fw-bold srs-skill-tab srs-mode-tab ${!isFlashcard ? 'btn-chinese-primary' : 'btn-outline-secondary border-0'}`;
      this.dom.tabWriting.setAttribute('aria-selected', !isFlashcard ? 'true' : 'false');
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
        el.className = `btn btn-sm py-2 px-3 fw-semibold rounded-pill group-tab ${isSel ? 'btn-chinese-primary' : 'btn-outline-secondary'}`;
        el.setAttribute('aria-selected', isSel ? 'true' : 'false');
      }
    }
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
          const dueCards = await apiClient('/srs/due', { params: { itemType: 'VOCABULARY' } });
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
    this.showCatalogSelection();
  }

  /**
   * Shows the catalog selection view and renders its items.
   */
  showCatalogSelection() {
    this.cleanupTimer();
    this.destroyWritingEngines();
    this.sessionQueue = [];
    this.currentIndex = 0;
    this.setViewState('catalog');
    this.renderCatalog();
  }

  /**
   * Returns from active session to catalog selection.
   */
  backToSelection() {
    this.activeAction = null;
    this.lessonId = null;
    this.radicalId = null;
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
    const container = this.dom.catalogContentContainer;
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
   * Renders 50 Common Radicals as chips.
   */
  renderRadicals50() {
    const container = this.dom.catalogContentContainer;
    if (!container) return;

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
    grid.className = 'd-flex flex-wrap gap-2 justify-content-center';

    list.forEach(rad => {
      const chip = this.createRadicalChip(rad, 'radicals50');
      grid.appendChild(chip);
    });

    container.appendChild(grid);
  }

  /**
   * Renders 214 Radicals filtered by stroke count and search.
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
    strokes.textContent = `${rad.strokeCount || 1} nét`;

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
   * Renders 10 Topics for HSK 1, 2, or 3.
   * @param {number} level
   */
  renderHskTopics(level) {
    const container = this.dom.catalogContentContainer;
    if (!container) return;

    const topics = level === 2 ? HSK2_TOPICS : level === 3 ? HSK3_TOPICS : HSK1_TOPICS;
    const progress = getProgress(this.activeMode);
    const groupKey = `hsk${level}`;
    const groupProgress = progress[groupKey] || {};

    const list = document.createElement('div');
    list.className = 'd-flex flex-column gap-3';

    topics.forEach((topic, idx) => {
      const topicCard = document.createElement('div');
      topicCard.className = 'catalog-topic-card p-3';

      const row = document.createElement('div');
      row.className = 'd-flex justify-content-between align-items-center flex-wrap gap-2';

      const left = document.createElement('div');
      left.style.maxWidth = '70%';

      const title = document.createElement('h3');
      title.className = 'h6 fw-bold text-dark mb-1';
      title.textContent = topic.title;

      const desc = document.createElement('p');
      desc.className = 'text-secondary small mb-1';
      desc.textContent = topic.description;

      const badge = document.createElement('span');
      badge.className = 'badge bg-primary-subtle text-primary border';
      badge.textContent = `${topic.vocabularies.length} từ vựng`;

      left.appendChild(title);
      left.appendChild(desc);
      left.appendChild(badge);

      const right = document.createElement('div');
      right.className = 'd-flex gap-2 align-items-center flex-wrap';

      const btnContinue = document.createElement('button');
      btnContinue.type = 'button';
      btnContinue.className = 'btn btn-sm btn-chinese-primary py-1 px-3 fw-semibold';
      btnContinue.textContent = '▶ Học tiếp';
      btnContinue.addEventListener('click', () => {
        this.startTopicSession(topic.topicId, 'continue');
      });

      const btnReview = document.createElement('button');
      btnReview.type = 'button';
      btnReview.className = 'btn btn-sm btn-chinese-secondary py-1 px-3 fw-semibold';
      btnReview.textContent = '🔄 Học lại';
      btnReview.addEventListener('click', () => {
        this.startTopicSession(topic.topicId, 'review');
      });

      const btnToggleWords = document.createElement('button');
      btnToggleWords.type = 'button';
      btnToggleWords.className = 'btn btn-sm btn-outline-secondary py-1 px-2';
      btnToggleWords.textContent = '👁️ Từ vựng';

      right.appendChild(btnContinue);
      right.appendChild(btnReview);
      right.appendChild(btnToggleWords);

      row.appendChild(left);
      row.appendChild(right);
      topicCard.appendChild(row);

      // Expandable word list
      const wordsBox = document.createElement('div');
      wordsBox.className = 'd-none mt-3 pt-2 border-top';

      const wordsGrid = document.createElement('div');
      wordsGrid.className = 'd-flex flex-wrap gap-2';

      topic.vocabularies.forEach(v => {
        const wordBadge = document.createElement('span');
        wordBadge.className = 'badge bg-light text-dark border py-1 px-2';
        wordBadge.textContent = `${v.hanzi} (${v.pinyin}): ${v.meaningVi}`;
        wordsGrid.appendChild(wordBadge);
      });

      wordsBox.appendChild(wordsGrid);
      topicCard.appendChild(wordsBox);

      btnToggleWords.addEventListener('click', () => {
        wordsBox.classList.toggle('d-none');
        btnToggleWords.textContent = wordsBox.classList.contains('d-none') ? '👁️ Từ vựng' : 'Ẩn từ vựng';
      });

      list.appendChild(topicCard);
    });

    container.appendChild(list);
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

    let items = null;
    let backendFetched = false;

    if (authManager.isAuthenticated()) {
      try {
        let remoteCards = [];
        const requestParams = { lessonId: topicId };
        if (this.activeMode === 'writing') {
          requestParams.cardType = 'WRITING';
        }

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
          const dueParams = { itemType: 'VOCABULARY', lessonId: topicId };
          if (this.activeMode === 'writing') {
            dueParams.cardType = 'WRITING';
          }
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
            cardType: this.activeMode === 'writing' ? 'WRITING' : 'READING',
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
        const match = topic.vocabularies?.find(v => Number(v.vocabId) === Number(vocabId));
        if (match) {
          foundVocab = match;
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
      strokeCount: Number(r.strokeCount) || 1,
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
    const defaultCardType = this.activeMode === 'writing' ? 'WRITING' : 'READING';
    return {
      itemType: v.itemType || 'VOCABULARY',
      itemId: Number(rawId),
      cardType: v.cardType || defaultCardType,
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
  }

  /**
   * Renders the current active card in the session.
   */
  renderCurrentCard() {
    speechController.cancel();
    this.cleanupTimer();
    this.destroyWritingEngines();
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
      // Writing mode: hide flashcard & rating bar, show dedicated writing room
      if (this.dom.flashcardContainer) this.dom.flashcardContainer.classList.add('d-none');
      if (this.dom.ratingSection) this.dom.ratingSection.classList.add('d-none');
      if (this.dom.writingRoom) this.dom.writingRoom.classList.remove('d-none');

      this.renderWritingRoomCard(card);
    } else {
      // Flashcard mode: show flashcard & rating bar, hide writing room
      if (this.dom.writingRoom) this.dom.writingRoom.classList.add('d-none');
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
      this.dom.progressText.textContent = `Thẻ ${currentNum} / ${totalCount} (Còn lại: ${remainingCount})`;
    }

    if (this.dom.modeBadge) {
      if (this.mode === 'LESSON_PRACTICE') {
        this.dom.modeBadge.textContent = `Luyện tự do #${this.lessonId || ''} (Không đổi SRS)`;
      } else if (this.mode === 'LESSON_NEW_CARDS') {
        this.dom.modeBadge.textContent = `Bài học #${this.lessonId || ''}`;
      } else if (this.mode === 'DUE_CARDS' && this.lessonId) {
        this.dom.modeBadge.textContent = `Thẻ đến hạn #${this.lessonId}`;
      } else {
        const modeName = this.activeMode === 'writing' ? 'Luyện viết' : 'Flashcard';
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
    if (this.dom.cardTypeBack) {
      this.dom.cardTypeBack.textContent = isVocab ? 'Từ vựng' : 'Bộ thủ';
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
      if (!isVocab && card.strokeCount) {
        if (this.dom.radicalStrokeCountVal) {
          this.dom.radicalStrokeCountVal.textContent = String(card.strokeCount);
        }
        this.dom.cardBackStrokeCount.classList.remove('d-none');
      } else {
        this.dom.cardBackStrokeCount.classList.add('d-none');
      }
    }

    // Example Box (for vocabulary only)
    if (this.dom.cardBackExampleBox) {
      if (isVocab && card.exampleSentence) {
        if (this.dom.cardBackExampleSentence) this.dom.cardBackExampleSentence.textContent = card.exampleSentence;
        if (this.dom.cardBackExampleTranslation) this.dom.cardBackExampleTranslation.textContent = card.exampleTranslation || '';
        this.dom.cardBackExampleBox.classList.remove('d-none');
      } else {
        this.dom.cardBackExampleBox.classList.add('d-none');
      }
    }

    // Note Button (for legacy modal & SR-08 compliance)
    if (this.dom.btnCardNote) {
      if (isVocab) {
        this.dom.btnCardNote.classList.remove('d-none');
      } else {
        this.dom.btnCardNote.classList.add('d-none');
      }
    }

    // 2-Column Notes section (Vocabulary only)
    if (this.dom.cardBackNotesSection) {
      if (isVocab) {
        this.dom.cardBackNotesSection.classList.remove('d-none');
        this.loadNotesForCard(card.itemId);
      } else {
        this.dom.cardBackNotesSection.classList.add('d-none');
      }
    }
  }

  /**
   * Loads and renders existing personal notes for a vocabulary item.
   * @param {number} vocabId
   */
  async loadNotesForCard(vocabId) {
    if (!this.dom.cardNotesList) return;
    this.dom.cardNotesList.replaceChildren();

    const loadingEl = document.createElement('div');
    loadingEl.className = 'text-muted small fst-italic';
    loadingEl.textContent = 'Đang tải ghi chú...';
    this.dom.cardNotesList.appendChild(loadingEl);

    try {
      let notes = [];
      if (this.notesCache.has(vocabId)) {
        notes = this.notesCache.get(vocabId);
      } else {
        const resp = await apiClient(`/vocabularies/${vocabId}/notes`, {
          params: { page: 0, size: 20 }
        }).catch(() => null);

        notes = Array.isArray(resp?.items) ? resp.items : Array.isArray(resp) ? resp : [];
        this.notesCache.set(vocabId, notes);
      }

      this.renderNotesList(notes);
    } catch (e) {
      this.dom.cardNotesList.replaceChildren();
      const emptyEl = document.createElement('div');
      emptyEl.className = 'text-muted fst-italic';
      emptyEl.textContent = 'Chưa có ghi chú nào.';
      this.dom.cardNotesList.appendChild(emptyEl);
    }
  }

  /**
   * Renders note items into the left column of notes.
   * @param {Array} notes
   */
  renderNotesList(notes) {
    if (!this.dom.cardNotesList) return;
    this.dom.cardNotesList.replaceChildren();

    if (!Array.isArray(notes) || notes.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'text-muted fst-italic';
      emptyEl.textContent = 'Chưa có ghi chú nào.';
      this.dom.cardNotesList.appendChild(emptyEl);
      return;
    }

    notes.forEach(note => {
      const itemEl = document.createElement('div');
      itemEl.className = 'card-note-item';

      const textEl = document.createElement('div');
      textEl.className = 'text-dark fw-medium';
      textEl.textContent = note.content || '';

      const timeEl = document.createElement('div');
      timeEl.className = 'text-muted';
      timeEl.style.fontSize = '0.72rem';
      timeEl.textContent = note.createdAt ? new Date(note.createdAt).toLocaleDateString('vi-VN') : 'Ghi chú';

      itemEl.appendChild(textEl);
      itemEl.appendChild(timeEl);
      this.dom.cardNotesList.appendChild(itemEl);
    });
  }

  /**
   * Saves a new note from the back of the card without flipping or resetting.
   */
  async saveCardNote() {
    if (!this.dom.cardNewNoteInput) return;
    const content = (this.dom.cardNewNoteInput.value || '').trim();
    if (!content) {
      showToast({ type: 'warning', title: 'Ghi chú', message: 'Vui lòng nhập nội dung ghi chú.' });
      return;
    }

    const queueItem = this.sessionQueue[this.currentIndex];
    if (!queueItem || !queueItem.card) return;
    const card = queueItem.card;
    if ((card.itemType || '').toUpperCase() !== 'VOCABULARY') return;

    try {
      const created = await apiClient(`/vocabularies/${card.itemId}/notes`, {
        method: 'POST',
        body: { content }
      });

      // Update cached notes
      const existing = this.notesCache.get(card.itemId) || [];
      const newNoteObj = created?.data || created || { content, createdAt: new Date().toISOString() };
      existing.unshift(newNoteObj);
      this.notesCache.set(card.itemId, existing);

      // Re-render notes column immediately
      this.renderNotesList(existing);
      this.dom.cardNewNoteInput.value = '';

      showToast({ type: 'success', title: 'Thành công', message: 'Đã lưu ghi chú mới.' });
    } catch (e) {
      console.warn('[Card Note] API error:', e);
      // Local optimistic fallback
      const existing = this.notesCache.get(card.itemId) || [];
      existing.unshift({ content, createdAt: new Date().toISOString() });
      this.notesCache.set(card.itemId, existing);
      this.renderNotesList(existing);
      this.dom.cardNewNoteInput.value = '';
      showToast({ type: 'info', title: 'Ghi chú', message: 'Đã lưu ghi chú vào phiên học.' });
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
    if (this.dom.btnWritingOutline) {
      this.dom.btnWritingOutline.textContent = '👁️ Xem gợi ý';
      this.dom.btnWritingOutline.setAttribute('aria-pressed', 'false');
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
      if (!isVocab && card.strokeCount) {
        this.dom.writingPromptStrokeCount.textContent = `Số nét chuẩn: ${card.strokeCount} nét`;
        this.dom.writingPromptStrokeCount.classList.remove('d-none');
      } else {
        this.dom.writingPromptStrokeCount.classList.add('d-none');
      }
    }

    // Configure Next button label
    if (this.dom.btnWritingNext) {
      this.dom.btnWritingNext.textContent = isVocab ? 'Sang từ tiếp theo →' : 'Sang bộ thủ tiếp theo →';
    }

    // Extract characters for canvas
    const chars = splitHanziCharacters(card.hanzi || card.character || '');
    const container = this.dom.writingCanvasContainer;
    if (!container) return;
    container.replaceChildren();

    if (chars.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'text-muted py-3';
      emptyMsg.textContent = 'Không có ký tự Hán hợp lệ để luyện viết.';
      container.appendChild(emptyMsg);
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
        this.dom.writingMissingWarning.textContent = msg;
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
          outlineColor: '#D1D5DB'
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
                if (typeof eng.startQuizSession === 'function') {
                  eng.startQuizSession();
                } else if (eng.writer && typeof eng.writer.quiz === 'function') {
                  eng.writer.quiz();
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

    if (this.dom.btnWritingOutline) {
      this.dom.btnWritingOutline.textContent = willShow ? '👁️ Ẩn gợi ý' : '👁️ Xem gợi ý';
      this.dom.btnWritingOutline.setAttribute('aria-pressed', willShow ? 'true' : 'false');
    }
  }

  /**
   * Clears writing canvas and resets quiz for active character(s).
   */
  clearWriting() {
    this.writingEngines.forEach(eng => {
      try {
        if (typeof eng.startQuizSession === 'function') {
          eng.startQuizSession();
        } else if (eng.writer && typeof eng.writer.quiz === 'function') {
          eng.writer.quiz();
        }
      } catch (e) {}
    });
  }

  /**
   * Advances to next item in Writing mode.
   * Saves progress independently under HOC_HAN_NGU_WRITING_PROGRESS.
   */
  async nextWritingItem() {
    this.cleanupTimer();
    const elapsedSeconds = calculateReviewTime(this.cardStartTime, Date.now());

    // Record progress and SRS review if in normal mode
    if (!this.isReviewMode) {
      const nextIndex = this.currentIndex + 1;
      this.persistProgress('writing', nextIndex);

      if (authManager.isAuthenticated() && this.sessionQueue[this.currentIndex]?.card) {
        const card = this.sessionQueue[this.currentIndex].card;
        const payload = buildReviewPayload({
          itemType: card.itemType || 'VOCABULARY',
          itemId: card.itemId,
          cardType: 'WRITING',
          rating: 3,
          reviewTimeSeconds: elapsedSeconds
        });

        await apiClient('/srs/review', {
          method: 'POST',
          body: payload
        }).catch(err => {
          console.warn('[SRS Writing Review] Non-fatal API submission warning:', err);
        });
      }
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
          cardType: card.cardType || (this.activeMode === 'writing' ? 'WRITING' : 'READING'),
          rating: numRating,
          reviewTimeSeconds: elapsedSeconds
        });

        await apiClient('/srs/review', {
          method: 'POST',
          body: payload
        }).catch(err => {
          console.warn('[SRS Review] Non-fatal API submission warning:', err);
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
      console.error('[SRS Review] Review submission error:', err);
      this.isSubmitting = false;
      this.setRatingButtonsEnabled(true);

      const msg = err.message || 'Không thể gửi đánh giá thẻ.';
      if (this.dom.ratingFeedback) this.dom.ratingFeedback.textContent = msg;
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
   * @param {HTMLElement|null} triggerButton
   */
  async playPronunciation(triggerButton = null) {
    const queueItem = this.sessionQueue[this.currentIndex];
    if (!queueItem || !queueItem.card) return;
    const card = queueItem.card;

    const cacheKey = `${card.itemType}_${card.itemId}`;
    if (this.audioCache.has(cacheKey)) {
      const cached = this.audioCache.get(cacheKey);
      if (cached) {
        return playPronunciation({ text: card.hanzi, audioUrl: cached, button: triggerButton });
      }
      return speakHanzi(card.hanzi, { button: triggerButton });
    }

    try {
      let audioUrl = null;
      if ((card.itemType || '').toUpperCase() === 'VOCABULARY') {
        const detail = await apiClient(`/vocabulary/${card.itemId}`).catch(() => null);
        audioUrl = detail?.audioUrl || null;
      } else {
        const detail = await apiClient(`/radicals/${card.itemId}`).catch(() => null);
        audioUrl = detail?.audioUrl || null;
      }
      this.audioCache.set(cacheKey, audioUrl);
      if (audioUrl) {
        return playPronunciation({ text: card.hanzi, audioUrl, button: triggerButton });
      }
      return speakHanzi(card.hanzi, { button: triggerButton });
    } catch (e) {
      speakHanzi(card.hanzi, { button: triggerButton });
    }
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

    if (isEditableOrFormControl(e.target, activeEl)) {
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
      } else if (this.activeMode === 'writing' && e.key === 'Enter') {
        e.preventDefault();
        this.nextWritingItem();
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
    srsControllerInstance.init();
  });
}
