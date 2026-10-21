/**
 * =============================================================================
 * CHINESE TONE SANDHI ENGINE & REFERENCE ORACLE
 * File: tests/e2e/utils/tone-sandhi.mjs
 *
 * Implements authoritative Chinese tone sandhi transformation rules:
 * - Rule 1: 3 + 3 -> 2 + 3 (e.g. 你好 nǐ hǎo -> ní hǎo)
 * - Rule 2: 不 (bù, tone 4) -> 2nd tone before tone 4 (不对 bú duì), else 4
 * - Rule 3: 一 (yī, tone 1) -> 2nd tone before tone 4 (一个 yí gè),
 *                               4th tone before tones 1, 2, 3 (一天 yì tiān),
 *                               1st tone when ordinal / counting (第一 dì yī)
 * - Rule 4: Half 3rd Tone (tone 3 before tone 1, 2, 4 falls to low pitch 211)
 * - Rule 5: 3 + 3 + 3 (e.g. 我很好 -> 2 + 2 + 3 or 3 + 2 + 3)
 * =============================================================================
 */

const PINYIN_TONE_MARKS = {
  // 1st tone
  'ā': { char: 'a', tone: 1 }, 'ē': { char: 'e', tone: 1 }, 'ī': { char: 'i', tone: 1 },
  'ō': { char: 'o', tone: 1 }, 'ū': { char: 'u', tone: 1 }, 'ǖ': { char: 'ü', tone: 1 },
  // 2nd tone
  'á': { char: 'a', tone: 2 }, 'é': { char: 'e', tone: 2 }, 'í': { char: 'i', tone: 2 },
  'ó': { char: 'o', tone: 2 }, 'ú': { char: 'u', tone: 2 }, 'ǘ': { char: 'ü', tone: 2 },
  // 3rd tone
  'ǎ': { char: 'a', tone: 3 }, 'ě': { char: 'e', tone: 3 }, 'ǐ': { char: 'i', tone: 3 },
  'ǒ': { char: 'o', tone: 3 }, 'ǔ': { char: 'u', tone: 3 }, 'ǚ': { char: 'ü', tone: 3 },
  // 4th tone
  'à': { char: 'a', tone: 4 }, 'è': { char: 'e', tone: 4 }, 'ì': { char: 'i', tone: 4 },
  'ò': { char: 'o', tone: 4 }, 'ù': { char: 'u', tone: 4 }, 'ǜ': { char: 'ü', tone: 4 }
};

/**
 * Extracts tone number (1..5) from a pinyin syllable.
 * Neutral tone is represented as 5.
 * @param {string} pinyinSyllable 
 * @returns {number} 1, 2, 3, 4, or 5
 */
export function extractTone(pinyinSyllable) {
  if (!pinyinSyllable) return 5;
  // Check for trailing number: e.g. "ni3" -> 3
  const lastChar = pinyinSyllable.slice(-1);
  if (['1', '2', '3', '4', '5'].includes(lastChar)) {
    return parseInt(lastChar, 10);
  }

  // Check diacritics
  for (const ch of pinyinSyllable) {
    if (PINYIN_TONE_MARKS[ch]) {
      return PINYIN_TONE_MARKS[ch].tone;
    }
  }

  return 5; // Neutral tone (轻声)
}

/**
 * Applies authoritative tone sandhi transformations to a sequence of syllables.
 *
 * @param {string} hanziText - characters (e.g. "你好", "不对", "一个", "我很好")
 * @param {string|string[]} pinyin - pinyin string ("nǐ hǎo") or array (['nǐ', 'hǎo'])
 * @returns {Array<{
 *   character: string,
 *   expectedPinyin: string,
 *   originalTone: number,
 *   sandhiTone: number,
 *   ruleApplied: string|null,
 *   feedback: string
 * }>}
 */
export function evaluateToneSandhi(hanziText, pinyin) {
  const chars = Array.from(hanziText || '');
  const syllables = Array.isArray(pinyin)
    ? pinyin
    : (pinyin || '').trim().split(/\s+/).filter(Boolean);

  const length = Math.min(chars.length, syllables.length);
  const result = [];

  for (let i = 0; i < length; i++) {
    result.push({
      character: chars[i],
      expectedPinyin: syllables[i],
      originalTone: extractTone(syllables[i]),
      sandhiTone: extractTone(syllables[i]),
      ruleApplied: null,
      feedback: 'Phát âm chuẩn'
    });
  }

  // Apply sequential rules
  for (let i = 0; i < length; i++) {
    const current = result[i];
    const next = i + 1 < length ? result[i + 1] : null;
    const prev = i > 0 ? result[i - 1] : null;

    // Rule 2: "不" (bù) tone sandhi
    if (current.character === '不' && current.originalTone === 4) {
      if (next && next.originalTone === 4) {
        current.sandhiTone = 2;
        current.ruleApplied = 'BU_BEFORE_TONE_4';
        current.feedback = 'Biến điệu "不" thành thanh 2 trước thanh 4';
      } else {
        current.sandhiTone = 4;
        current.ruleApplied = 'BU_STANDARD';
        current.feedback = 'Giữ nguyên thanh 4 cho "不"';
      }
      continue;
    }

    // Rule 3: "一" (yī) tone sandhi
    if (current.character === '一' && current.originalTone === 1) {
      const isOrdinal = prev && (prev.character === '第' || prev.character === '初');
      const isCountingOrAlone = length === 1 || isOrdinal || (i === length - 1 && !next);

      if (isCountingOrAlone) {
        current.sandhiTone = 1;
        current.ruleApplied = 'YI_STANDALONE_OR_ORDINAL';
        current.feedback = 'Giữ nguyên thanh 1 cho "一" khi đếm số hoặc thứ tự';
      } else if (next && next.originalTone === 4) {
        current.sandhiTone = 2;
        current.ruleApplied = 'YI_BEFORE_TONE_4';
        current.feedback = 'Biến điệu "一" thành thanh 2 trước thanh 4';
      } else if (next && [1, 2, 3].includes(next.originalTone)) {
        current.sandhiTone = 4;
        current.ruleApplied = 'YI_BEFORE_TONES_123';
        current.feedback = 'Biến điệu "一" thành thanh 4 trước thanh 1, 2, 3';
      }
      continue;
    }

    // Rule 1 & Rule 5: 3rd tone sandhi
    if (current.originalTone === 3) {
      if (next && next.originalTone === 3) {
        // Special case: 3 consecutive 3rd tones (3+3+3, e.g. 我很好)
        const nextNext = i + 2 < length ? result[i + 2] : null;
        if (nextNext && nextNext.originalTone === 3) {
          // In 3+3+3, first two syllables typically transform to tone 2 (2 + 2 + 3)
          // e.g. 我很好 -> wó hén hǎo
          current.sandhiTone = 2;
          current.ruleApplied = 'TRIPLE_THIRD_TONE_FIRST';
          current.feedback = 'Biến điệu thanh 3 thành thanh 2 trong cụm 3 thanh 3';
        } else {
          // Standard pair 3 + 3 -> 2 + 3 (e.g. 你好 nǐ hǎo -> ní hǎo)
          current.sandhiTone = 2;
          current.ruleApplied = 'PAIR_THIRD_TONE';
          current.feedback = 'Biến điệu thanh 3 thành thanh 2 trước thanh 3';
        }
      } else if (next && [1, 2, 4].includes(next.originalTone)) {
        // Rule 4: Half 3rd tone (半三声) before 1, 2, 4
        // Original stays category 3, but pitch contour is 211 (half 3rd)
        current.sandhiTone = 3;
        current.ruleApplied = 'HALF_THIRD_TONE';
        current.feedback = 'Phát âm nửa thanh 3 (hạ giọng trầm 211, không nâng giọng)';
      }
    }
  }

  return result;
}
