// classify.mjs — pure intake logic for `fgos submit` (P14, D1/D3/D4/D5).
// No store.mjs import, no filesystem, no model/LLM call: every function here
// is a deterministic, synchronous transform over the free-text blob a caller
// submits. Side-effecting work (persisting the resulting work item) is the
// CLI verb's job, not this module's.

import { HEAVY_KEYWORDS, matchesKeyword } from './risk-keywords.mjs';
// work.mjs is a pure, dependency-free module (it imports only the equally pure
// domain-registry.mjs), so taking the shared title bound from it keeps
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
 * store doors bound titles too, but this call still has to: its result is the
 * title a submit stores.
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
 * Classify a free-text submission into {size, kind, risk} (Phase 3). Purely
 * mechanical keyword counting, no LLM call, and never throws — an
 * unrecognized or empty/non-string input falls back to size: 'standard',
 * kind: 'task', with risk mirroring the size signal. Does NOT guess rigor.
 *
 * D12 (tsk-2yo): this result is only ever a TEMP placeholder at item
 * creation time now -- the real judgment happens once, later, at stage
 * `discovery`, on real research evidence (`fgos-coding-discovering`).
 */
export function classify(text) {
  const safeText = typeof text === 'string' ? text : '';

  let size = 'standard';
  if (countMatches(safeText, HEAVY_KEYWORDS) > 0) {
    size = 'heavy';
  } else if (countMatches(safeText, LIGHT_KEYWORDS) > 0) {
    size = 'light';
  }

  let kind = 'task';
  for (const [candidateKind, keywords] of Object.entries(KIND_KEYWORDS)) {
    if (countMatches(safeText, keywords) > 0) {
      kind = candidateKind;
      break;
    }
  }

  // D5: risk is derived from the same keyword signal as size (mirrors the
  // size name) — always overridable by the caller, never blocks submit.
  const risk = size;

  return { size, kind, risk };
}
