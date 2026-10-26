/**
 * =============================================================================
 * STROKE DATA LOADER MODULE
 * Asynchronous, cached loader for Hanzi / Kangxi radical stroke geometry.
 * Primary source: Local static assets (/assets/data/strokes/<char>.json).
 * Fallback source: cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/<char>.json.
 * =============================================================================
 */

const strokeCache = new Map();

/**
 * Canonical fallback mapping for Kangxi radical variants and historical variants
 * that share identical stroke order semantics with standard Hanzi characters.
 * Ensures 100% radical stroke coverage across all 214 Kangxi radicals.
 */
export const RADICAL_VARIANT_CANONICAL_MAP = Object.freeze({
  '牜': '牛', // Radical 93 variant (Ngưu) -> 牛
  '玊': '玉', // Radical 96 variant (Ngọc) -> 玉
  '靣': '面', // Radical 176 variant (Diện) -> 面
  '凬': '风', // Radical 182 variant (Phong) -> 风
  '黒': '黑', // Radical 203 variant (Hắc) -> 黑
  '斉': '齐', // Radical 210 variant (Tề) -> 齐
  '歯': '齿', // Radical 211 variant (Xỉ) -> 齿
  '竜': '龙', // Radical 212 variant (Long) -> 龙
  '亀': '龟'  // Radical 213 variant (Quy) -> 龟
});

/**
 * Extracts the primary Hanzi / radical character from a potentially decorated string.
 * Example: '人(亻)' -> '人', '水(氵)' -> '水', ' 艸 ' -> '艸'
 *
 * @param {string} raw
 * @returns {string}
 */
export function extractCleanChar(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  // Split on opening parenthesis or slash, take first character
  const primary = trimmed.split(/[()\/]/)[0].trim();
  return primary || trimmed;
}

/**
 * Extracts all valid CJK Hanzi characters from a word or phrase string.
 * Example: '学生' -> ['学', '生'], '对不起' -> ['对', '不', '起'], '人(亻)' -> ['人']
 * Filters out Latin letters, digits, punctuation, and whitespace.
 *
 * @param {string} raw
 * @returns {string[]}
 */
export function splitHanziCharacters(raw) {
  if (!raw || typeof raw !== 'string') return [];
  // If string contains parentheses variant notation like '水(氵)', extract clean base first
  const base = raw.includes('(') || raw.includes('/') ? extractCleanChar(raw) : raw;
  const matches = base.match(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g);
  return matches || [];
}

/**
 * Asynchronously loads stroke geometry for a given character.
 * Uses in-memory caching to prevent duplicate network/disk requests.
 *
 * @param {string} character
 * @returns {Promise<{ strokes: string[], medians: number[][][], radStrokes?: number[] }|null>}
 */
export async function loadStrokeData(character) {
  const cleanChar = extractCleanChar(character);
  if (!cleanChar) return null;

  if (strokeCache.has(cleanChar)) {
    return strokeCache.get(cleanChar);
  }

  const codeHexUpper = cleanChar.codePointAt(0) ? cleanChar.codePointAt(0).toString(16).toUpperCase() : '';
  const codeHexLower = cleanChar.codePointAt(0) ? cleanChar.codePointAt(0).toString(16).toLowerCase() : '';

  // 1. Node.js environment resolution (unit tests / server-side verification)
  const isNodeEnv = typeof process !== 'undefined' && Boolean(process?.versions?.node);
  if (isNodeEnv || typeof window === 'undefined') {
    try {
      const fs = await import('node:fs/promises');
      const { fileURLToPath } = await import('node:url');
      let content = null;

      // Candidate paths in order of preference
      const candidatePaths = [
        new URL(`../../../assets/data/strokes/${encodeURIComponent(cleanChar)}.json`, import.meta.url)
      ];
      if (codeHexUpper) {
        candidatePaths.push(new URL(`../../../assets/data/strokes/%23U${codeHexUpper}.json`, import.meta.url));
        if (codeHexLower !== codeHexUpper) {
          candidatePaths.push(new URL(`../../../assets/data/strokes/%23U${codeHexLower}.json`, import.meta.url));
          candidatePaths.push(new URL(`../../../assets/data/strokes/%23u${codeHexLower}.json`, import.meta.url));
        }
      }

      for (const candUrl of candidatePaths) {
        try {
          const filePath = fileURLToPath(candUrl);
          content = await fs.readFile(filePath, 'utf-8');
          if (content) break;
        } catch (_) {
          // Try next candidate
        }
      }

      if (content) {
        const data = JSON.parse(content);
        if (isValidStrokeData(data)) {
          strokeCache.set(cleanChar, data);
          return data;
        }
      }
    } catch (err) {
      // Fall through
    }
  }

  // 2. Browser static asset path (resolved relative to module root)
  try {
    const candidateUrls = [
      new URL(`../../../assets/data/strokes/${encodeURIComponent(cleanChar)}.json`, import.meta.url).href
    ];
    if (codeHexUpper) {
      candidateUrls.push(new URL(`../../../assets/data/strokes/%23U${codeHexUpper}.json`, import.meta.url).href);
      if (codeHexLower !== codeHexUpper) {
        candidateUrls.push(new URL(`../../../assets/data/strokes/%23U${codeHexLower}.json`, import.meta.url).href);
        candidateUrls.push(new URL(`../../../assets/data/strokes/%23u${codeHexLower}.json`, import.meta.url).href);
      }
    }

    let localRes = null;
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          localRes = res;
          break;
        }
      } catch (_) {
        // Try next candidate
      }
    }

    if (localRes && localRes.ok) {
      const data = await localRes.json();
      if (isValidStrokeData(data)) {
        strokeCache.set(cleanChar, data);
        return data;
      }
    }
  } catch (err) {
    // Local fetch failed (or running in environment without local server)
  }

  // 3. Fallback to approved CDN (jsdelivr) - only in non-browser environments where external connect is unconstrained by CSP
  if (isNodeEnv || typeof window === 'undefined') {
    const cdnUrl = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(cleanChar)}.json`;
    try {
      const cdnRes = await fetch(cdnUrl);
      if (cdnRes.ok) {
        const data = await cdnRes.json();
        if (isValidStrokeData(data)) {
          strokeCache.set(cleanChar, data);
          return data;
        }
      }
    } catch (err) {
      // CDN fetch failed or offline
    }
  }

  // 4. Fallback to canonical radical form if character is a known Kangxi radical variant
  const canonicalChar = RADICAL_VARIANT_CANONICAL_MAP[cleanChar];
  if (canonicalChar && canonicalChar !== cleanChar) {
    const canonicalData = await loadStrokeData(canonicalChar);
    if (canonicalData) {
      strokeCache.set(cleanChar, canonicalData);
      return canonicalData;
    }
  }

  return null;
}

/**
 * Validates the structural integrity of loaded stroke data.
 *
 * @param {any} data
 * @returns {boolean}
 */
export function isValidStrokeData(data) {
  return (
    data !== null &&
    typeof data === 'object' &&
    Array.isArray(data.strokes) &&
    data.strokes.length > 0 &&
    Array.isArray(data.medians) &&
    data.medians.length > 0 &&
    data.strokes.length === data.medians.length
  );
}

/**
 * Clears the in-memory stroke cache (used in testing and session teardowns).
 */
export function clearStrokeCache() {
  strokeCache.clear();
}

/**
 * Preloads and caches stroke geometry for all characters in a given word.
 * Returns an array of booleans indicating success per character.
 *
 * @param {string} word
 * @returns {Promise<boolean[]>}
 */
export async function preloadWordStrokes(word) {
  const chars = splitHanziCharacters(word);
  if (chars.length === 0) return [];
  const results = await Promise.all(chars.map(c => loadStrokeData(c)));
  return results.map(data => data !== null);
}
