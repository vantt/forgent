// outcome-exit.mjs -- the one table from an execution outcome to the process exit code. Execution owns the
// outcome vocabulary (run, foreground workflow and gate settles speak it), so the codes live beside it; the
// CLI reads this table and keeps no copy.

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
