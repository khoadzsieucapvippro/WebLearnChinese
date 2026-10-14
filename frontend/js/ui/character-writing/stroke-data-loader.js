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

  // 1. Node.js environment resolution (unit tests / server-side verification)
  if (typeof window === 'undefined') {
    try {
      const fs = await import('node:fs/promises');
      const { fileURLToPath } = await import('node:url');
      const filePath = fileURLToPath(new URL(`../../../assets/data/strokes/${encodeURIComponent(cleanChar)}.json`, import.meta.url));
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      if (isValidStrokeData(data)) {
        strokeCache.set(cleanChar, data);
        return data;
      }
    } catch (err) {
      // Fall through
    }
  }

  // 2. Browser static asset path (resolved relative to module root)
  try {
    const localUrl = new URL(`../../../assets/data/strokes/${encodeURIComponent(cleanChar)}.json`, import.meta.url).href;
    const localRes = await fetch(localUrl);
    if (localRes.ok) {
      const data = await localRes.json();
      if (isValidStrokeData(data)) {
        strokeCache.set(cleanChar, data);
        return data;
      }
    }
  } catch (err) {
    // Local fetch failed (or running in environment without local server)
  }

  // 3. Fallback to approved CDN (jsdelivr)
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
    data.medians.length > 0
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
