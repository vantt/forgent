// classify.mjs — pure intake logic for `fgos submit` (P14, D1/D3/D4/D5).
// No store.mjs import, no filesystem, no model/LLM call: every function here
// is a deterministic, synchronous transform over the free-text blob a caller
// submits. Side-effecting work (persisting the resulting work item) is the
// CLI verb's job, not this module's.

import { createHash } from 'node:crypto';
import { HEAVY_KEYWORDS } from './risk-keywords.mjs';

// D4: cut the title at the first sentence/line boundary; fall back to a
// truncated prefix when the text has no natural boundary within reach. Both
// the cut rule and this length are this cell's discretion (CONTEXT.md).
const TITLE_MAX_LENGTH = 60;

/**
 * Derive a title from a free-text submission blob (D4). Never throws: any
 * non-string or blank input falls back to a fixed placeholder title so the
 * caller always gets a non-empty string (work.mjs requires non-empty title).
 */
export function deriveTitle(text) {
  const safeText = typeof text === 'string' ? text.trim() : '';
  if (!safeText) return 'Untitled submission';

  const boundary = safeText.match(/[.!?\n]/);
  if (boundary && boundary.index > 0) {
    const candidate = safeText.slice(0, boundary.index).trim();
    if (candidate) return candidate;
  }

  if (safeText.length <= TITLE_MAX_LENGTH) return safeText;

  const truncated = safeText.slice(0, TITLE_MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(' ');
  const cut = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  return cut.trim();
}

// D1/D5 keyword tables — mechanical, deterministic, always overridable by the
// caller. No match in any table is not an error: tier falls back to
// 'standard' (work.mjs TIERS default) and kind falls back to 'task'.
// HEAVY_KEYWORDS lives in the kernel-layer risk-keywords.mjs (D13) so the
// domain-layer iron-law.mjs can share the same list without an upward import.
const LIGHT_KEYWORDS = [
  'typo', 'docs', 'documentation', 'tài liệu', 'readme', 'comment',
  'chú thích', 'rename', 'đổi tên', 'formatting', 'định dạng', 'log message',
];

const KIND_KEYWORDS = {
  bug: ['bug', 'lỗi', 'fix', 'sửa', 'error', 'crash', 'broken', 'regression', 'hỏng'],
  feature: ['feature', 'tính năng', 'implement', 'add', 'thêm', 'new', 'mới'],
  chore: ['chore', 'cleanup', 'dọn dẹp', 'refactor', 'upgrade', 'nâng cấp', 'dependency'],
  docs: ['docs', 'documentation', 'tài liệu', 'readme'],
};

function countMatches(lowerText, keywords) {
  let count = 0;
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) count += 1;
  }
  return count;
}

/**
 * Classify a free-text submission into {tier, kind, risk} (D1, D5). Purely
 * mechanical keyword counting, no LLM call, and never throws — an
 * unrecognized or empty/non-string input falls back to tier: 'standard',
 * kind: 'task', with risk mirroring the tier signal.
 */
export function classify(text) {
  const lowerText = (typeof text === 'string' ? text : '').toLowerCase();

  let tier = 'standard';
  if (countMatches(lowerText, HEAVY_KEYWORDS) > 0) {
    tier = 'heavy';
  } else if (countMatches(lowerText, LIGHT_KEYWORDS) > 0) {
    tier = 'light';
  }

  let kind = 'task';
  for (const [candidateKind, keywords] of Object.entries(KIND_KEYWORDS)) {
    if (countMatches(lowerText, keywords) > 0) {
      kind = candidateKind;
      break;
    }
  }

  // D5: risk is derived from the same keyword signal as tier (mirrors the
  // tier name) — always overridable by the caller, never blocks submit.
  const risk = tier;

  return { tier, kind, risk };
}

function slugify(title) {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

// D3: SHA256 -> base36, per porting-log `hash-id-adaptive-length` (3-8 chars
// adaptive to a 25% collision threshold). The suffix grows by taking a
// longer prefix of the same digest on each retry, so a longer suffix is
// always a superset of the shorter one that just collided.
function hashSuffixSource(seed) {
  const hex = createHash('sha256').update(seed).digest('hex');
  return BigInt(`0x${hex}`).toString(36);
}

const MIN_SUFFIX_LENGTH = 3;
const MAX_SUFFIX_LENGTH = 8;

/**
 * Generate a stable, kebab-case id from a title (D3): slug + adaptive hash
 * suffix, retrying with a longer suffix when it collides with `existingIds`,
 * bounded to MAX_SUFFIX_LENGTH attempts. Always satisfies work.mjs's
 * ID_PATTERN (letter-start) — a slug that would start with a digit, or an
 * empty slug, is prefixed with a letter.
 */
export function generateId(title, existingIds = []) {
  const known = existingIds instanceof Set ? existingIds : new Set(existingIds ?? []);
  const rawSlug = slugify(typeof title === 'string' ? title : '') || 'work';
  const baseSlug = /^[a-z]/.test(rawSlug) ? rawSlug : `w-${rawSlug}`;
  const suffixSource = hashSuffixSource(typeof title === 'string' ? title : '');

  for (let length = MIN_SUFFIX_LENGTH; length <= MAX_SUFFIX_LENGTH; length += 1) {
    const candidate = `${baseSlug}-${suffixSource.slice(0, length)}`;
    if (!known.has(candidate)) return candidate;
  }

  throw new Error(
    `generateId: exhausted hash suffix range (${MIN_SUFFIX_LENGTH}-${MAX_SUFFIX_LENGTH} chars) ` +
      `for title ${JSON.stringify(title)} without a unique id`,
  );
}
