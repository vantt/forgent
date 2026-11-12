// outcome.mjs -- the one module that owns Execution's outcome vocabulary (unit-run-result contract, sections 3 and 5):
// the closed table of seat outcomes, their classes, the predicates two layers used to hold with different lists,
// and the one table from an outcome to the process exit code. The loops, the unit summary, resume and the CLI
// import from here and keep no copy. The Rust `run-result::derive_outcome` stays the category authority beneath it.
//
// Not Execution outcomes, so not in the table: Workflow's `refused` (its own acceptance value, decided in
// src/workflow/runner.mjs) and `partial-writes` (a stop reason on `fallbackExhausted`/`retryStopped`, never the
// outcome of a seat; the seat that stops on it ends `provider-limit`). The same-named set in
// src/runner/dispatch/confinement/attestation-store.mjs is a different domain.

import { isVerdictResult } from './legacy-seat-read.mjs';

/** The closed table of seat outcomes, each with its class. `pass` and `findings` are completed judgments. */
const SEAT_OUTCOME_CLASS = Object.freeze({
  pass: 'verdict',
  findings: 'verdict',
  'execution-failure': 'infrastructure',
  'policy-refusal': 'policy',
  'provider-limit': 'provider',
  blocked: 'blocked',
});

export const VALID_OUTCOMES = Object.freeze(Object.keys(SEAT_OUTCOME_CLASS));

/** The outcomes of a seat that did not finish its job: the seat ended in error and a resume binds it again. */
export const ERROR_OUTCOMES = Object.freeze(VALID_OUTCOMES.filter((outcome) => SEAT_OUTCOME_CLASS[outcome] !== 'verdict'));

/** A reserved value, not a seat outcome: a case reservation settles with it when no seat was given its brief. */
export const NOT_STARTED_OUTCOME = 'not-started';

/** A read-model value, not a seat outcome: a summary that cannot derive an outcome from what was recorded. */
export const UNDETERMINED_OUTCOME = 'undetermined';

/** The class of an outcome a reader can meet, or null when the value is unknown (a reader treats that as no verdict). */
export function outcomeClass(outcome) {
  if (outcome === NOT_STARTED_OUTCOME) return 'infrastructure';
  return Object.hasOwn(SEAT_OUTCOME_CLASS, outcome) ? SEAT_OUTCOME_CLASS[outcome] : null;
}

/** Whether the outcome is a completed judgment of the work: `pass` or `findings`. */
export const isVerdict = (outcome) => outcomeClass(outcome) === 'verdict';

/** Whether the outcome says the run ended on infrastructure: `execution-failure` or `not-started`. */
export const isInfrastructure = (outcome) => outcomeClass(outcome) === 'infrastructure';

/** Whether a resume binds the seat again: its last attempt ended in error. */
export const rebindsOnResume = (seatOutcome) => ERROR_OUTCOMES.includes(seatOutcome);

/**
 * Whether a unit ended on infrastructure, so a rerun can still produce the verdict: its outcome is infrastructure,
 * it wrote no path outside its declared scope, and no verdict seat of it reached a verdict.
 *
 * @param {{ outcome?: string, outOfScope?: string[], results?: object[] }} unitResult
 */
export function infrastructure(unitResult) {
  if (!isInfrastructure(unitResult?.outcome) || unitResult.outOfScope?.length) return false;
  return !(unitResult.results ?? []).some((result) => isVerdictResult(result) && isVerdict(result.outcome));
}

/**
 * Execution outcome codes of `fgos run` and foreground workflow runs (RUL99).
 * Separate from EXIT_CODES to prevent error categories from colliding with outcome names.
 * `partial-writes` is the code reserved for that stop reason; the CLI help documents it.
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
