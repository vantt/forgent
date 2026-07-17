// risk-keywords.mjs — kernel-layer shared risk vocabulary (D13/D14).
// The single source of the heavy-risk keyword list, importable by every
// shallower layer. classify.mjs (use-case) reads it for submission tiering;
// iron-law.mjs (domain) reads it for the Iron Law flag test. Kernel is the
// deepest layer, so a domain module may import it without violating the
// one-way-down rule (architecture.test.mjs) — the reason this list lives here
// rather than in classify.mjs, which domain cannot import.

// EN+VI heavy-risk keywords. Order is not significant (matching is a
// case-insensitive substring scan). The first 21 entries are the original
// classify.mjs list, moved verbatim; the trailing block is D14's 13 additions
// covering the previously-missing hard-gate flags (external systems, validation
// removal, audit).
export const HEAVY_KEYWORDS = [
  'security', 'bảo mật', 'auth', 'authentication', 'payment', 'thanh toán',
  'migration', 'schema', 'data loss', 'mất dữ liệu', 'breaking change',
  'production incident', 'sự cố', 'irreversible', 'không thể hoàn tác',
  'credentials', 'secret', 'encryption', 'mã hóa', 'delete', 'xóa dữ liệu',
  'external system', 'external api', 'third-party', 'webhook', 'hệ thống ngoài',
  'bên thứ ba', 'remove validation', 'skip validation', 'bypass validation',
  'bỏ kiểm tra', 'bỏ qua kiểm tra', 'audit', 'kiểm toán',
];
