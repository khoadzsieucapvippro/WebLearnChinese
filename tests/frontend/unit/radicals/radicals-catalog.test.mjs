/**
 * =============================================================================
 * UNIT TEST SUITE: KANGXI RADICALS CATALOG & LOGIC ENGINE
 * File: tests/frontend/unit/radicals/radicals-catalog.test.mjs
 * 
 * Verifies:
 * - Dataset validation & integrity invariants:
 *   * 214 total radicals.
 *   * Exactly 50 common radicals with unique, unbroken ranks 1..50.
 *   * Exactly 164 remaining radicals with commonRank IS NULL.
 *   * No duplicate radical IDs.
 *   * Out-of-bounds common ranks (e.g. 0, 51, 214) detected.
 * - Catalog partitioning (partitionRadicals):
 *   * 50 common radicals sorted by commonRank ASC.
 *   * 164 remaining radicals sorted by radicalId ASC.
 * - Full-catalog client-side search filtering (filterRadicals):
 *   * Chinese character glyph.
 *   * Pinyin accented & toneless (e.g. "shui" matches "shuǐ").
 *   * Hán-Việt accented & toneless (e.g. "thuy" matches "Thủy").
 *   * Vietnamese meaning accented & toneless (e.g. "nuoc" matches "Nước").
 *   * Strict exclusion of explanationVi from search to preserve predictable UX.
 * - Privacy-enhanced YouTube URL sanitization (sanitizeYouTubeEmbedUrl):
 *   * Standard watch?v=, youtu.be, embed formats.
 *   * Sanitized output to youtube-nocookie.com/embed/{id}?autoplay=1.
 *   * Rejection of javascript:, non-YouTube domains, and malformed IDs.
 * - Media URL sanitization (sanitizeResourceUrl) & XSS resilience.
 * =============================================================================
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRadicalDataset,
  partitionRadicals,
  filterRadicals,
  calculatePagination,
  removeVietnameseDiacritics,
  normalizeSearchQuery,
  sanitizeYouTubeEmbedUrl,
  playRadicalAudio,
  speakHanzi,
  RadicalsPageController
} from '../../../../frontend/js/pages/radicals-page.js';
import { sanitizeResourceUrl } from '../../../../frontend/js/ui/security.js';

// Generator helper for synthetic radical fixture with common ranks
function generateMockRadicals(count = 214, commonCount = 50) {
  const radicals = [];
  for (let i = 1; i <= count; i++) {
    const isCommon = i <= commonCount;
    radicals.push({
      radicalId: i,
      character: String.fromCodePoint(0x4E00 + i - 1),
      pinyin: `pinyin_${i}`,
      meaningHanViet: `HanViet_${i}`,
      meaningVi: `Nghĩa tiếng Việt số ${i}`,
      explanationVi: isCommon ? `Giải thích ghi nhớ cho bộ thủ ${i}` : null,
      commonRank: isCommon ? i : null,
      videoLessonUrl: isCommon ? `https://www.youtube.com/watch?v=kYv9b6-8D${String(i).padStart(2, '0')}` : null,
      audioUrl: i % 2 === 0 ? `https://cdn.example.com/audio/rad_${i}.mp3` : null,
      videoWritingUrl: i % 3 === 0 ? `https://cdn.example.com/video/rad_${i}.mp4` : null
    });
  }
  return radicals;
}

describe('Unit: Kangxi Radicals Catalog & Presentation Logic', () => {

  describe('1. Dataset Invariant & Integrity Validation (validateRadicalDataset)', () => {
    test('passes valid full 214-radical catalog with 50 common and 164 remaining', () => {
      const mock214 = generateMockRadicals(214, 50);
      const result = validateRadicalDataset(mock214, 214);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test('detects count mismatch when dataset has fewer than 214 items', () => {
      const partial = generateMockRadicals(200, 50);
      const result = validateRadicalDataset(partial, 214);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('Số lượng bộ thủ (200) không khớp')));
    });

    test('detects duplicate radical IDs in dataset', () => {
      const mock = generateMockRadicals(214, 50);
      mock[10].radicalId = 1;
      const result = validateRadicalDataset(mock, 214);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('bị trùng lặp')));
    });

    test('detects missing radical ID in sequence', () => {
      const mock = generateMockRadicals(214, 50);
      mock[49].radicalId = 999;
      const result = validateRadicalDataset(mock, 214);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('nằm ngoài phạm vi') || e.includes('Thiếu')));
    });

    test('rejects non-array or null input gracefully', () => {
      assert.strictEqual(validateRadicalDataset(null, 214).valid, false);
      assert.strictEqual(validateRadicalDataset(undefined, 214).valid, false);
      assert.strictEqual(validateRadicalDataset({}, 214).valid, false);
      assert.strictEqual(validateRadicalDataset('invalid', 214).valid, false);
    });

    test('detects out-of-range commonRank (e.g. 0 or 51 or 214)', () => {
      const mock = generateMockRadicals(214, 50);
      mock[0].commonRank = 214; // Must NOT be 1..214, only 1..50
      const result = validateRadicalDataset(mock, 214);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('thứ hạng thông dụng ngoài phạm vi 1..50')));
    });

    test('detects duplicate commonRank values', () => {
      const mock = generateMockRadicals(214, 50);
      mock[1].commonRank = 1; // Both radical 1 and 2 have rank 1
      const result = validateRadicalDataset(mock, 214);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('thứ hạng thông dụng bị trùng lặp')));
    });

    test('detects if common radicals count is not exactly 50 in complete dataset', () => {
      const mock = generateMockRadicals(214, 45); // Only 45 common
      const result = validateRadicalDataset(mock, 214);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('50 bộ thủ quy định')));
    });
  });

  describe('2. Catalog Partitioning (partitionRadicals)', () => {
    test('partitions full 214 catalog into exactly 50 common and 164 remaining', () => {
      const mock214 = generateMockRadicals(214, 50);
      const { commonRadicals, remainingRadicals } = partitionRadicals(mock214);

      assert.strictEqual(commonRadicals.length, 50);
      assert.strictEqual(remainingRadicals.length, 164);
    });

    test('sorts common radicals ascending by commonRank (1..50)', () => {
      const mock214 = generateMockRadicals(214, 50);
      // Reverse common radicals in input array
      mock214.reverse();

      const { commonRadicals } = partitionRadicals(mock214);
      assert.strictEqual(commonRadicals[0].commonRank, 1);
      assert.strictEqual(commonRadicals[49].commonRank, 50);

      for (let i = 0; i < 49; i++) {
        assert.ok(commonRadicals[i].commonRank < commonRadicals[i + 1].commonRank);
      }
    });

    test('sorts remaining radicals ascending by radicalId', () => {
      const mock214 = generateMockRadicals(214, 50);
      mock214.reverse();

      const { remainingRadicals } = partitionRadicals(mock214);
      assert.strictEqual(remainingRadicals[0].radicalId, 51);
      assert.strictEqual(remainingRadicals[163].radicalId, 214);
    });

    test('handles empty or malformed array gracefully', () => {
      assert.deepStrictEqual(partitionRadicals(null), { commonRadicals: [], remainingRadicals: [] });
      assert.deepStrictEqual(partitionRadicals([]), { commonRadicals: [], remainingRadicals: [] });
    });
  });

  describe('3. Client-Side Search Engine (filterRadicals & Toneless Matching)', () => {
    const sampleRadicals = [
      {
        radicalId: 1,
        character: '一',
        pinyin: 'yī',
        meaningHanViet: 'Nhất',
        meaningVi: 'Số một',
        explanationVi: 'Nét ngang đầu tiên'
      },
      {
        radicalId: 30,
        character: '口',
        pinyin: 'kǒu',
        meaningHanViet: 'Khẩu',
        meaningVi: 'Cái miệng',
        explanationVi: 'Hình cái miệng mở ra'
      },
      {
        radicalId: 75,
        character: '木',
        pinyin: 'mù',
        meaningHanViet: 'Mộc',
        meaningVi: 'Cây cối, gỗ',
        explanationVi: 'Hình thân cây có cành và rễ'
      },
      {
        radicalId: 85,
        character: '水',
        pinyin: 'shuǐ',
        meaningHanViet: 'Thủy',
        meaningVi: 'Nước, dòng nước',
        explanationVi: 'Dòng nước uốn lượn'
      },
      {
        radicalId: 86,
        character: '火',
        pinyin: 'huǒ',
        meaningHanViet: 'Hỏa',
        meaningVi: 'Lửa, ngọn lửa',
        explanationVi: 'Ngọn lửa bốc lên'
      }
    ];

    test('returns full dataset on empty or whitespace query', () => {
      assert.strictEqual(filterRadicals('', sampleRadicals).length, 5);
      assert.strictEqual(filterRadicals('   ', sampleRadicals).length, 5);
      assert.strictEqual(filterRadicals(null, sampleRadicals).length, 5);
      assert.strictEqual(filterRadicals(undefined, sampleRadicals).length, 5);
    });

    test('filters accurately by Chinese character glyph', () => {
      const result = filterRadicals('木', sampleRadicals);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].radicalId, 75);
      assert.strictEqual(result[0].character, '木');
    });

    test('Pinyin search matches both accented and toneless queries', () => {
      // "shui" matches "shuǐ" (Radical 85)
      const resultShui = filterRadicals('shui', sampleRadicals);
      assert.strictEqual(resultShui.length, 1);
      assert.strictEqual(resultShui[0].radicalId, 85);

      // "shuǐ" matches "shuǐ"
      const resultAccented = filterRadicals('shuǐ', sampleRadicals);
      assert.strictEqual(resultAccented.length, 1);
      assert.strictEqual(resultAccented[0].radicalId, 85);

      // "mu" matches "mù" (Radical 75)
      const resultMu = filterRadicals('mu', sampleRadicals);
      assert.strictEqual(resultMu.length, 1);
      assert.strictEqual(resultMu[0].radicalId, 75);

      // "kou" matches "kǒu" (Radical 30)
      const resultKou = filterRadicals('kou', sampleRadicals);
      assert.strictEqual(resultKou.length, 1);
      assert.strictEqual(resultKou[0].radicalId, 30);
    });

    test('Hán-Việt search matches both accented and toneless queries', () => {
      // "thuy" matches "Thủy"
      const resultThuy = filterRadicals('thuy', sampleRadicals);
      assert.strictEqual(resultThuy.length, 1);
      assert.strictEqual(resultThuy[0].radicalId, 85);

      // "Thủy" matches "Thủy"
      const resultAccented = filterRadicals('Thủy', sampleRadicals);
      assert.strictEqual(resultAccented.length, 1);
      assert.strictEqual(resultAccented[0].radicalId, 85);

      // "nhat" matches "Nhất"
      const resultNhat = filterRadicals('nhat', sampleRadicals);
      assert.strictEqual(resultNhat.length, 1);
      assert.strictEqual(resultNhat[0].radicalId, 1);
    });

    test('search strictly does NOT match meaningVi or explanationVi', () => {
      // "nuoc" is in meaningVi of Radical 85 ("Nước, dòng nước") -> should NOT match
      const resultNuoc = filterRadicals('nuoc', sampleRadicals);
      assert.strictEqual(resultNuoc.length, 0);

      // "dòng nước" is in meaningVi of Radical 85 -> should NOT match
      const resultAccented = filterRadicals('dòng nước', sampleRadicals);
      assert.strictEqual(resultAccented.length, 0);

      // "mieng" is in meaningVi of Radical 30 ("Cái miệng") -> should NOT match
      const resultMieng = filterRadicals('mieng', sampleRadicals);
      assert.strictEqual(resultMieng.length, 0);

      // "uốn lượn" is in explanationVi of Radical 85 -> should NOT match
      const resultExplanation = filterRadicals('uốn lượn', sampleRadicals);
      assert.strictEqual(resultExplanation.length, 0);

      // "ngọn lửa" is in meaningVi of Radical 86 -> should NOT match
      const resultFire = filterRadicals('ngọn lửa', sampleRadicals);
      assert.strictEqual(resultFire.length, 0);
    });

    test('search still matches character, accented pinyin, toneless pinyin, and Hán-Việt', () => {
      // 1. Character exact match
      const matchChar = filterRadicals('水', sampleRadicals);
      assert.strictEqual(matchChar.length, 1);
      assert.strictEqual(matchChar[0].radicalId, 85);

      // 2. Accented pinyin
      const matchAccentedPinyin = filterRadicals('shuǐ', sampleRadicals);
      assert.strictEqual(matchAccentedPinyin.length, 1);
      assert.strictEqual(matchAccentedPinyin[0].radicalId, 85);

      // 3. Toneless pinyin
      const matchTonelessPinyin = filterRadicals('shui', sampleRadicals);
      assert.strictEqual(matchTonelessPinyin.length, 1);
      assert.strictEqual(matchTonelessPinyin[0].radicalId, 85);

      // 4. Hán-Việt with diacritics
      const matchHanViet = filterRadicals('Thủy', sampleRadicals);
      assert.strictEqual(matchHanViet.length, 1);
      assert.strictEqual(matchHanViet[0].radicalId, 85);

      // 5. Hán-Việt without diacritics
      const matchHanVietToneless = filterRadicals('thuy', sampleRadicals);
      assert.strictEqual(matchHanVietToneless.length, 1);
      assert.strictEqual(matchHanVietToneless[0].radicalId, 85);
    });

    test('removeVietnameseDiacritics helper preserves Chinese and Latin while stripping accents & tones', () => {
      assert.strictEqual(removeVietnameseDiacritics('Mộc'), 'Moc');
      assert.strictEqual(removeVietnameseDiacritics('Nước'), 'Nuoc');
      assert.strictEqual(removeVietnameseDiacritics('Đại'), 'Dai');
      assert.strictEqual(removeVietnameseDiacritics('shuǐ'), 'shui');
      assert.strictEqual(removeVietnameseDiacritics('mù'), 'mu');
      assert.strictEqual(removeVietnameseDiacritics('kǒu'), 'kou');
      assert.strictEqual(removeVietnameseDiacritics('yī'), 'yi');
      assert.strictEqual(removeVietnameseDiacritics('木'), '木');
      assert.strictEqual(removeVietnameseDiacritics(''), '');
      assert.strictEqual(removeVietnameseDiacritics(null), '');
    });

    test('normalizeSearchQuery trims and lowercases reliably', () => {
      assert.strictEqual(normalizeSearchQuery('  ThỦy  '), 'thủy');
      assert.strictEqual(normalizeSearchQuery(null), '');
      assert.strictEqual(normalizeSearchQuery(undefined), '');
      assert.strictEqual(normalizeSearchQuery(123), '123');
    });
  });

  describe('4. Privacy-Enhanced YouTube Embed Sanitizer (sanitizeYouTubeEmbedUrl)', () => {
    test('accepts valid watch?v= YouTube URLs and returns privacy-enhanced embed URL with autoplay=1', () => {
      const url = 'https://www.youtube.com/watch?v=kYv9b6-8D-w';
      const embed = sanitizeYouTubeEmbedUrl(url);
      assert.strictEqual(embed, 'https://www.youtube-nocookie.com/embed/kYv9b6-8D-w?autoplay=1');
    });

    test('accepts youtu.be short URLs', () => {
      const url = 'https://youtu.be/kYv9b6-8D-w';
      const embed = sanitizeYouTubeEmbedUrl(url);
      assert.strictEqual(embed, 'https://www.youtube-nocookie.com/embed/kYv9b6-8D-w?autoplay=1');
    });

    test('accepts standard /embed/ URLs', () => {
      const url = 'https://www.youtube.com/embed/kYv9b6-8D-w';
      const embed = sanitizeYouTubeEmbedUrl(url);
      assert.strictEqual(embed, 'https://www.youtube-nocookie.com/embed/kYv9b6-8D-w?autoplay=1');
    });

    test('accepts youtube-nocookie.com embed URLs', () => {
      const url = 'https://www.youtube-nocookie.com/embed/kYv9b6-8D-w';
      const embed = sanitizeYouTubeEmbedUrl(url);
      assert.strictEqual(embed, 'https://www.youtube-nocookie.com/embed/kYv9b6-8D-w?autoplay=1');
    });

    test('preserves start timestamp when t=Xs parameter is present', () => {
      const url = 'https://www.youtube.com/watch?v=A2M77mRe4KU&t=12s';
      const embed = sanitizeYouTubeEmbedUrl(url);
      assert.strictEqual(embed, 'https://www.youtube-nocookie.com/embed/A2M77mRe4KU?autoplay=1&start=12');
    });

    test('preserves start timestamp when t is pure number or start parameter', () => {
      const url1 = 'https://www.youtube.com/watch?v=A2M77mRe4KU&t=25';
      assert.strictEqual(sanitizeYouTubeEmbedUrl(url1), 'https://www.youtube-nocookie.com/embed/A2M77mRe4KU?autoplay=1&start=25');

      const url2 = 'https://www.youtube-nocookie.com/embed/A2M77mRe4KU?start=39';
      assert.strictEqual(sanitizeYouTubeEmbedUrl(url2), 'https://www.youtube-nocookie.com/embed/A2M77mRe4KU?autoplay=1&start=39');
    });

    test('preserves both start and end timestamps when both are present', () => {
      const url = 'https://www.youtube.com/watch?v=A2M77mRe4KU&t=12s&end=25';
      const embed = sanitizeYouTubeEmbedUrl(url);
      assert.strictEqual(embed, 'https://www.youtube-nocookie.com/embed/A2M77mRe4KU?autoplay=1&start=12&end=25');
    });

    test('supports complex time formats like 1m15s', () => {
      const url = 'https://www.youtube.com/watch?v=A2M77mRe4KU&t=1m15s';
      const embed = sanitizeYouTubeEmbedUrl(url);
      assert.strictEqual(embed, 'https://www.youtube-nocookie.com/embed/A2M77mRe4KU?autoplay=1&start=75');
    });

    test('rejects malicious javascript: scheme', () => {
      assert.strictEqual(sanitizeYouTubeEmbedUrl('javascript:alert(1)'), null);
      assert.strictEqual(sanitizeYouTubeEmbedUrl('javascript://www.youtube.com/watch?v=kYv9b6-8D-w'), null);
    });

    test('rejects non-YouTube domains (even if path looks like YouTube)', () => {
      assert.strictEqual(sanitizeYouTubeEmbedUrl('https://vimeo.com/kYv9b6-8D-w'), null);
      assert.strictEqual(sanitizeYouTubeEmbedUrl('https://evil-youtube.com/watch?v=kYv9b6-8D-w'), null);
      assert.strictEqual(sanitizeYouTubeEmbedUrl('https://youtube.attacker.com/watch?v=kYv9b6-8D-w'), null);
    });

    test('rejects malformed video IDs (not 11 chars or containing invalid characters)', () => {
      assert.strictEqual(sanitizeYouTubeEmbedUrl('https://www.youtube.com/watch?v=short'), null);
      assert.strictEqual(sanitizeYouTubeEmbedUrl('https://www.youtube.com/watch?v=tooLongVideoId12345'), null);
      assert.strictEqual(sanitizeYouTubeEmbedUrl('https://www.youtube.com/watch?v=bad<script>!'), null);
    });

    test('handles empty, null, or non-string inputs safely', () => {
      assert.strictEqual(sanitizeYouTubeEmbedUrl(null), null);
      assert.strictEqual(sanitizeYouTubeEmbedUrl(undefined), null);
      assert.strictEqual(sanitizeYouTubeEmbedUrl(''), null);
      assert.strictEqual(sanitizeYouTubeEmbedUrl('   '), null);
    });
  });

  describe('5. Media Resource Sanitization for Radicals (sanitizeResourceUrl)', () => {
    test('accepts valid HTTPS audio and video URLs', () => {
      assert.strictEqual(
        sanitizeResourceUrl('https://cdn.example.com/audio/rad_1.mp3'),
        'https://cdn.example.com/audio/rad_1.mp3'
      );
      assert.strictEqual(
        sanitizeResourceUrl('https://cdn.example.com/video/rad_1.mp4'),
        'https://cdn.example.com/video/rad_1.mp4'
      );
    });

    test('accepts valid safe relative paths', () => {
      assert.strictEqual(sanitizeResourceUrl('/media/rad_1.mp3'), '/media/rad_1.mp3');
      assert.strictEqual(sanitizeResourceUrl('./assets/video.mp4'), './assets/video.mp4');
    });

    test('rejects malicious javascript: scheme in media URLs', () => {
      assert.strictEqual(sanitizeResourceUrl('javascript:alert(1)'), 'about:blank');
    });

    test('rejects data: schemes for resource audio/video sinks', () => {
      assert.strictEqual(sanitizeResourceUrl('data:text/html,<script>alert(1)</script>'), 'about:blank');
      assert.strictEqual(sanitizeResourceUrl('data:audio/mp3;base64,AAAA'), 'about:blank');
    });

    test('rejects protocol-relative URLs (//open-redirect)', () => {
      assert.strictEqual(sanitizeResourceUrl('//malicious.com/audio.mp3'), 'about:blank');
    });

    test('handles null, undefined, and empty string safely', () => {
      assert.strictEqual(sanitizeResourceUrl(null), 'about:blank');
      assert.strictEqual(sanitizeResourceUrl(undefined), 'about:blank');
      assert.strictEqual(sanitizeResourceUrl(''), 'about:blank');
      assert.strictEqual(sanitizeResourceUrl('   '), 'about:blank');
    });
  });

  describe('6. Audio Fallback Execution (speakHanzi & playRadicalAudio)', () => {
    test('speakHanzi returns false in Node environment (no window.speechSynthesis)', () => {
      assert.strictEqual(speakHanzi('木'), false);
    });

    test('playRadicalAudio handles null radical without throwing', () => {
      assert.doesNotThrow(() => {
        playRadicalAudio(null, null);
      });
    });

    test('playRadicalAudio falls back to speech when audioEl is null', () => {
      assert.doesNotThrow(() => {
        playRadicalAudio({ character: '木', audioUrl: null }, null);
      });
    });
  });

  describe('7. Adversarial Input Resiliency (XSS & Corrupt Structures)', () => {
    test('safely filters when radical records contain script tags in character or meanings', () => {
      const adversarialItems = [
        {
          radicalId: 1,
          character: '<script>alert("xss")</script>',
          pinyin: 'yī',
          meaningHanViet: '<img src=x onerror=alert(1)>',
          meaningVi: 'javascript:alert(1)'
        },
        {
          radicalId: 2,
          character: '丨',
          pinyin: 'gǔn',
          meaningHanViet: 'Cổn',
          meaningVi: 'Nét sổ'
        }
      ];

      const results = filterRadicals('alert', adversarialItems);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].radicalId, 1);
    });

    test('handles null/undefined fields inside individual radical records', () => {
      const malformedItems = [
        { radicalId: 1, character: null, pinyin: null, meaningHanViet: null, meaningVi: null },
        { radicalId: 2, character: undefined, pinyin: undefined, meaningHanViet: undefined, meaningVi: undefined },
        null,
        undefined
      ];

      const results = filterRadicals('木', malformedItems);
      assert.strictEqual(results.length, 0);
    });
  });

  describe('8. Two Learning Tabs Architecture & State Transition Contract (50 vs 164)', () => {
    test('default tab is initialized to "common" in RadicalsPageController', () => {
      const controller = new RadicalsPageController();
      assert.strictEqual(controller.selectedTab, 'common');
      assert.strictEqual(controller.activeSearchQuery, '');
    });

    test('partitioning yields exactly 50 common radicals and 164 remaining with zero overlap', () => {
      const mock214 = generateMockRadicals(214, 50);
      const { commonRadicals, remainingRadicals } = partitionRadicals(mock214);

      assert.strictEqual(commonRadicals.length, 50, 'Must have exactly 50 common radicals');
      assert.strictEqual(remainingRadicals.length, 164, 'Must have exactly 164 remaining radicals');
      assert.strictEqual(commonRadicals.length + remainingRadicals.length, 214, '50 + 164 = 214');

      // Verify zero overlap
      const commonIdSet = new Set(commonRadicals.map(r => r.radicalId));
      for (const rem of remainingRadicals) {
        assert.strictEqual(commonIdSet.has(rem.radicalId), false, `Radical ID ${rem.radicalId} must not be in common set`);
      }
    });

    test('common radicals are sorted strictly by commonRank ASC 1..50', () => {
      const mock214 = generateMockRadicals(214, 50);
      // Shuffle mock before partitioning
      const shuffled = [...mock214].sort(() => Math.random() - 0.5);
      const { commonRadicals } = partitionRadicals(shuffled);

      for (let i = 0; i < commonRadicals.length; i++) {
        assert.strictEqual(commonRadicals[i].commonRank, i + 1, `Item at index ${i} must have commonRank ${i + 1}`);
      }
    });

    test('remaining radicals are sorted strictly by radicalId ASC', () => {
      const mock214 = generateMockRadicals(214, 50);
      const shuffled = [...mock214].sort(() => Math.random() - 0.5);
      const { remainingRadicals } = partitionRadicals(shuffled);

      for (let i = 1; i < remainingRadicals.length; i++) {
        assert.ok(
          remainingRadicals[i].radicalId > remainingRadicals[i - 1].radicalId,
          `Radical ID at ${i} (${remainingRadicals[i].radicalId}) must be greater than previous (${remainingRadicals[i - 1].radicalId})`
        );
      }
    });

    test('global search filters across all 214 radicals regardless of tab', () => {
      const mock214 = generateMockRadicals(214, 50);
      // Put a search target in common group (ID 10) and one in remaining group (ID 100)
      mock214[9].meaningHanViet = 'Nguyệt Quang';
      mock214[99].meaningHanViet = 'Nguyệt Sắc';

      const results = filterRadicals('nguyet', mock214);
      assert.strictEqual(results.length, 2, 'Global search must find matches across both groups');
      assert.ok(results.some(r => r.radicalId === 10), 'Finds common radical');
      assert.ok(results.some(r => r.radicalId === 100), 'Finds remaining radical');
    });

    test('switchTab transitions state between "common" and "all"', () => {
      const controller = new RadicalsPageController();
      assert.strictEqual(controller.selectedTab, 'common');

      // Mock DOM element references for switchTab
      controller.elements = {
        tabCommonRadicals: {
          setAttribute: () => {},
          classList: { toggle: () => {} },
          focus: () => {}
        },
        tabAllRadicals: {
          setAttribute: () => {},
          classList: { toggle: () => {} },
          focus: () => {}
        },
        renderCatalogView: () => {}
      };
      controller.renderCatalogView = () => {};

      controller.switchTab('all');
      assert.strictEqual(controller.selectedTab, 'all');

      // Backward compatibility: switchTab('remaining') aliases to 'all'
      controller.switchTab('remaining');
      assert.strictEqual(controller.selectedTab, 'all');

      controller.switchTab('common');
      assert.strictEqual(controller.selectedTab, 'common');

      // Invalid tab ID should be ignored
      controller.switchTab('invalid');
      assert.strictEqual(controller.selectedTab, 'common');
    });

    test('scoped search: search is scoped to selected tab and query is preserved on tab switch', () => {
      const controller = new RadicalsPageController();
      controller.selectedTab = 'common';
      const mock214 = generateMockRadicals(214, 50);
      const partitioned = partitionRadicals(mock214);
      controller.fullCatalog = mock214;
      controller.commonRadicals = partitioned.commonRadicals;
      controller.remainingRadicals = partitioned.remainingRadicals;

      // Target in common group (ID 10) and one in remaining group (ID 100)
      controller.fullCatalog[9].meaningHanViet = 'Nguyệt Quang';
      controller.fullCatalog[99].meaningHanViet = 'Nguyệt Sắc';
      // Re-partition so references have updated values
      const updatedPartition = partitionRadicals(controller.fullCatalog);
      controller.commonRadicals = updatedPartition.commonRadicals;
      controller.remainingRadicals = updatedPartition.remainingRadicals;

      let commonHidden = false;
      let allHidden = false;
      let searchHidden = true;
      let renderedItems = [];

      controller.elements = {
        stateContainer: {
          removeAttribute: () => {},
          setAttribute: () => {},
          classList: { add: () => {}, remove: () => {} },
          replaceChildren: () => {},
          querySelector: () => null
        },
        resultCount: { textContent: '', className: '' },
        searchResultsSection: {
          classList: {
            add: (cls) => { if (cls === 'd-none') searchHidden = true; },
            remove: (cls) => { if (cls === 'd-none') searchHidden = false; }
          },
          setAttribute: () => {},
          removeAttribute: () => {}
        },
        commonRadicalsSection: {
          classList: {
            add: (cls) => { if (cls === 'd-none') commonHidden = true; },
            remove: (cls) => { if (cls === 'd-none') commonHidden = false; }
          },
          setAttribute: () => {},
          removeAttribute: () => {}
        },
        allRadicalsSection: {
          classList: {
            add: (cls) => { if (cls === 'd-none') allHidden = true; },
            remove: (cls) => { if (cls === 'd-none') allHidden = false; }
          },
          setAttribute: () => {},
          removeAttribute: () => {}
        },
        tabCommonRadicals: {
          setAttribute: () => {},
          classList: { toggle: () => {} },
          focus: () => {}
        },
        tabAllRadicals: {
          setAttribute: () => {},
          classList: { toggle: () => {} },
          focus: () => {}
        },
        searchInput: {
          placeholder: '',
          setAttribute: () => {}
        },
        commonRadicalsGrid: { innerHTML: '' },
        allRadicalsGrid: { innerHTML: '' },
        searchResultsGrid: { innerHTML: '' },
        searchResultBadge: { textContent: '' },
        searchClearBtn: { classList: { add: () => {}, remove: () => {} } }
      };
      controller.renderGrid = (_container, items) => {
        renderedItems = items;
      };

      // 1. Search in 'common' tab (scope = 50 common radicals)
      controller.handleSearchInput('nguyet');
      assert.strictEqual(controller.activeSearchQuery, 'nguyet');
      assert.strictEqual(controller.selectedTab, 'common');
      // Should find only 1 match (ID 10 in common 50), NOT ID 100
      assert.strictEqual(renderedItems.length, 1, 'In common tab, search must only find items in common 50');
      assert.strictEqual(renderedItems[0].radicalId, 10);
      assert.strictEqual(commonHidden, false, 'Common section remains visible');
      assert.strictEqual(allHidden, true, 'All section remains hidden');
      assert.strictEqual(searchHidden, true, 'Dedicated search section remains hidden');

      // 2. Switch tab to 'all' while search query 'nguyet' is active
      controller.switchTab('all');
      assert.strictEqual(controller.selectedTab, 'all');
      assert.strictEqual(controller.activeSearchQuery, 'nguyet', 'Query must be preserved on tab switch');
      // Now in 'all' tab (scope = 214), should find 2 matches (ID 10 and ID 100)
      assert.strictEqual(renderedItems.length, 2, 'In all tab, search must find all matches in 214');
      assert.strictEqual(commonHidden, true, 'Common section is now hidden');
      assert.strictEqual(allHidden, false, 'All section is now visible');
      assert.strictEqual(searchHidden, true, 'Dedicated search section remains hidden');

      // 3. Clear search input
      controller.handleSearchInput('');
      assert.strictEqual(controller.activeSearchQuery, '');
      assert.strictEqual(controller.selectedTab, 'all');
      assert.strictEqual(renderedItems.length, 214, 'Full catalog is restored in all tab');
      assert.strictEqual(allHidden, false);
      assert.strictEqual(commonHidden, true);
    });
  });

});
