// risk-keywords.mjs — kernel-layer shared risk vocabulary (D13/D14).
// The single source of the heavy-risk keyword list, importable by every
// shallower layer. classify.mjs (use-case) reads it for submission tiering;
// iron-law.mjs (domain) reads it for the Iron Law flag test. Kernel is the
// deepest layer, so a domain module may import it without violating the
// one-way-down rule (architecture.test.mjs) — the reason this list lives here
// rather than in classify.mjs, which domain cannot import. matchesKeyword
// below lives here for the exact same reason: both consumers need it and
// kernel is the one layer both can safely import from (tsk-2as D1).

// EN+VI heavy-risk keywords. Order is not significant. Matching is
// word-boundary-aware (see matchesKeyword below) as of tsk-2as -- a keyword
// only counts when it is not itself part of a longer word (e.g. 'auth' does
// not match inside 'authoring'). The first 21 entries are the original
// classify.mjs list, moved verbatim; the trailing block is D14's 13
// additions covering the previously-missing hard-gate flags (external
// systems, validation removal, audit).
export const HEAVY_KEYWORDS = [
  'security', 'bảo mật', 'auth', 'authentication', 'payment', 'thanh toán',
  'migration', 'schema', 'data loss', 'mất dữ liệu', 'breaking change',
  'production incident', 'sự cố', 'irreversible', 'không thể hoàn tác',
  'credentials', 'secret', 'encryption', 'mã hóa', 'delete', 'xóa dữ liệu',
  'external system', 'external api', 'third-party', 'webhook', 'hệ thống ngoài',
  'bên thứ ba', 'remove validation', 'skip validation', 'bypass validation',
  'bỏ kiểm tra', 'bỏ qua kiểm tra', 'audit', 'kiểm toán',
];

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Case-insensitive, word-boundary-aware check for whether `keyword` appears
 * as a standalone word (or phrase) in `text` (tsk-2as D1) -- never merely as
 * a substring inside a longer word ('auth' must not match inside
 * 'authoring'/'author'/'authentic'). Uses Unicode letter/number property
 * escapes (`\p{L}`/`\p{N}` with the `u` flag), not JS's ASCII-only `\b`,
 * because several keywords carry Vietnamese diacritics ('bảo mật',
 * 'mất dữ liệu', ...) that `\b` would bound incorrectly -- it treats a
 * diacritic letter as a non-word character. Never throws: a non-string
 * `text`/empty `keyword` returns false.
 */
export function matchesKeyword(text, keyword) {
  if (typeof text !== 'string' || typeof keyword !== 'string' || keyword.length === 0) {
    return false;
  }
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}_])${escapeRegExp(keyword)}(?![\\p{L}\\p{N}_])`,
    'iu',
  );
  return pattern.test(text);
}
