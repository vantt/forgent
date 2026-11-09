// store-error.mjs -- the CLI's error and exit-code vocabulary, with no imports. It sits at the
// bottom so the shell, the command registry and the store all take it from one place; store.mjs
// re-exports it, so every existing importer keeps working.

/** Error raised by this module. `category` is the CLI exit-code contract (R4). */
export class StoreError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'StoreError';
    this.category = category;
  }
}

/**
 * The one category -> exit-code map (R4). Values 2-5 unchanged from the
 * prior duplicate in bin/fgos.mjs. 'lock-timeout' (event-log.mjs), 'session-fail'
 * (session.mjs) and 'merge-fail' (merge.mjs) are distinct-on-purpose
 * categories that were previously unmapped here, so any error carrying them
 * fell through categoryOf's undefined-exitCode path and was treated as an
 * uncategorized bug: the whole runOnce drain-run aborted (throw, not a
 * graceful per-item halt) instead of returning its structured
 * dispatched/parked result with an accurate exit code (review-unreviewed-260717,
 * corroborated by two independent reviewers). 6 is reserved for loop.mjs's
 * EXIT_BUSY — skip it here.
 */
export const EXIT_CODES = Object.freeze({
  precondition: 2,
  conflict: 3,
  validation: 4,
  'corrupt-log': 5,
  'lock-timeout': 7,
  'session-fail': 8,
  'merge-fail': 9,
  // A genuine integrity failure (session manifest or protocol definition really missing),
  // never an ordinary caller-correctable validation mistake. Mapped to the SAME
  // exit code as 'validation' so no existing CLI exit-code contract changes
  // -- only `err.category` becomes distinguishable, so a StoreError/
  // CoordinationError carrying it is never mistaken for an ordinary
  // 'refused' (category:'validation') outcome by a future DAG scheduler
  // classifier (dag-request-scheduler.md §4).
  'not-found': 4,
});

/**
 * Execution outcome codes of `fgos run` and foreground workflow runs (RUL99).
 * Separate from EXIT_CODES to prevent error categories from colliding with outcome names.
 */
export const OUTCOME_EXIT_CODES = Object.freeze({
  'policy-refusal': 4,
  'provider-limit': 10,
  'execution-failure': 11,
  'partial-writes': 12,
  blocked: 13,
  findings: 14,
});

/**
 * Map an execution outcome (e.g. from runUnit or workflowRun) onto a canonical exit code.
 * Non-pass outcomes map to OUTCOME_EXIT_CODES[outcome] or 1 when unrecognized. 'pass' maps to 0.
 *
 * @param {string} outcome
 * @returns {number}
 */
export function exitCodeForOutcome(outcome) {
  if (outcome === 'pass') return 0;
  if (typeof outcome !== 'string') return 1;
  return OUTCOME_EXIT_CODES[outcome] ?? 1;
}

/**
 * Classify any error raised by this module's domain (StoreError, FsmError,
 * WorkValidationError, EventLogError all set `.category`) by reading the
 * property directly rather than an instanceof-chain — a new error class only
 * needs to set `.category` to participate, nothing here has to change.
 * Anything without a recognized `.category` falls back to 'unexpected'
 * (callers map that to exit 1).
 */
export function categoryOf(err) {
  return err && typeof err.category === 'string' ? err.category : 'unexpected';
}
