// classify.mjs — pure intake logic for `fgos submit` (P14, D1/D3/D4/D5).
// No store.mjs import, no filesystem, no model/LLM call: every function here
// is a deterministic, synchronous transform over the free-text blob a caller
// submits. Side-effecting work (persisting the resulting work item) is the
// CLI verb's job, not this module's.

import { createHash } from 'node:crypto';
import { HEAVY_KEYWORDS, matchesKeyword } from './risk-keywords.mjs';
// work.mjs is a pure, dependency-free module (it imports only the equally pure
// workflow-stage-graphs.mjs), so taking the shared title bound from it keeps
// this file's own "deterministic, synchronous transform" promise intact. The
// same import direction decompose.mjs and discovery.mjs already use.
import { truncateTitle } from '../state/work.mjs';

/**
 * Derive a title from a free-text submission blob (D4): cut at the first
 * sentence/line boundary, and bound whatever comes out. Never throws: any
 * non-string or blank input falls back to a fixed placeholder title so the
 * caller always gets a non-empty string (work.mjs requires non-empty title).
 *
 * Both exits are bounded, per work-item-title-contract D2. Only the no-boundary
 * exit used to be — a first sentence that ran on for a whole paragraph came
 * back whole, which is how 32 of 54 stored titles ended up past the bound. The
 * store doors bound titles too, but this call still has to: its result feeds
 * generateId before addWork ever sees it.
 */
export function deriveTitle(text) {
  const safeText = typeof text === 'string' ? text.trim() : '';
  if (!safeText) return 'Untitled submission';

  const boundary = safeText.match(/[.!?](?:\s|$)|\n/);
  if (boundary && boundary.index > 0) {
    const candidate = safeText.slice(0, boundary.index).trim();
    if (candidate) return truncateTitle(candidate);
  }

  return truncateTitle(safeText);
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

// Word-boundary-aware (tsk-2as D1) -- text is passed through unmodified;
// matchesKeyword does its own case-insensitive, Unicode-aware boundary
// check, so this no longer needs a pre-lowercased string.
function countMatches(text, keywords) {
  let count = 0;
  for (const keyword of keywords) {
    if (matchesKeyword(text, keyword)) count += 1;
  }
  return count;
}

/**
 * Classify a free-text submission into {tier, kind, risk} (D1, D5). Purely
 * mechanical keyword counting, no LLM call, and never throws — an
 * unrecognized or empty/non-string input falls back to tier: 'standard',
 * kind: 'task', with risk mirroring the tier signal.
 *
 * D12 (tsk-2yo): this result is only ever a TEMP placeholder at item
 * creation time now -- the real judgment happens once, later, at stage
 * `discovery`, on real research evidence (`fgos-coding-discovering`).
 */
export function classify(text) {
  const safeText = typeof text === 'string' ? text : '';

  let tier = 'standard';
  if (countMatches(safeText, HEAVY_KEYWORDS) > 0) {
    tier = 'heavy';
  } else if (countMatches(safeText, LIGHT_KEYWORDS) > 0) {
    tier = 'light';
  }

  let kind = 'task';
  for (const [candidateKind, keywords] of Object.entries(KIND_KEYWORDS)) {
    if (countMatches(safeText, keywords) > 0) {
      kind = candidateKind;
      break;
    }
  }

  // D5: risk is derived from the same keyword signal as tier (mirrors the
  // tier name) — always overridable by the caller, never blocks submit.
  const risk = tier;

  return { tier, kind, risk };
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
 * Generate a stable, kebab-case id (id-systems-audit.md #1: `TSK<hash>`,
 * stored lowercase as `tsk-<hash>` to satisfy work.mjs's ID_PATTERN — the
 * title is never part of the id; it's already stored as its own field).
 * The fixed `tsk-` prefix guarantees letter-start regardless of hash
 * content (a bare hash digest starts with a digit ~89% of the time).
 * Retries with a longer suffix when it collides with `existingIds`,
 * bounded to MAX_SUFFIX_LENGTH attempts.
 */
export function generateId(title, existingIds = []) {
  const known = existingIds instanceof Set ? existingIds : new Set(existingIds ?? []);
  const suffixSource = hashSuffixSource(typeof title === 'string' ? title : '');

  for (let length = MIN_SUFFIX_LENGTH; length <= MAX_SUFFIX_LENGTH; length += 1) {
    const candidate = `tsk-${suffixSource.slice(0, length)}`;
    if (!known.has(candidate)) return candidate;
  }

  throw new Error(
    `generateId: exhausted hash suffix range (${MIN_SUFFIX_LENGTH}-${MAX_SUFFIX_LENGTH} chars) ` +
      `for title ${JSON.stringify(title)} without a unique id`,
  );
}
