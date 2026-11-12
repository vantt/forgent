// src/runner/execution/case-admission-port.mjs — the interface the Execution Core asks before it runs a Unit for a case
// Architecture guard: MUST NOT import src/state/**, src/workflow/** or src/runner/coordination/** (A4 boundary)
//
// The Execution Core owns this contract and never the decision. The Workflow implements it
// (src/workflow/case-admission-port.mjs) and the entry point injects it into `runUnit`, so the core
// never imports the Workflow. The port is asked at three moments and nowhere else:
//
//   resolveBinding  before anything exists: is the worktree free (`unbound`), or whose is it?
//   admit           a Unit that names a case: may this activity run now? Holds the reservation.
//   recheckEffect   before a writing round's commit: does the consent the admission stood on still hold?
//   settle          once, after the pattern settled (or the run failed): the Unit shape of the unit-run-result
//                   contract (final outcome, infrastructure, scope, evaluations, start, launches).
//
// The core never writes the ledger itself and never between admit and settle.

import { RunnerConfigError } from '../dispatch/runner-config-error.mjs';

// How many seat launches a Unit plans is the seat resolver's answer, so admission counts the same seats
// the run will bind.
export { seatLaunchesOf } from './seat-resolver.mjs';

export const PORT_MISSING = 'case-admission-port-missing';
export const SEAT_LAUNCH_CEILING = 'seat-launch-ceiling';

/** The version shape every settle carries (docs/platform/runner/contracts/unit-run-result.md, section 2). */
export const UNIT_RUN_RESULT_CONTRACT = Object.freeze({ id: 'unit-run-result', version: 1 });

const OPERATIONS = Object.freeze(['resolveBinding', 'admit', 'settle', 'recheckEffect']);

/**
 * @typedef {object} CaseRef
 * @property {string} caseId
 * @property {string} activity
 * @property {string} [unitId]
 * @property {string} [route] should | may-instead | unlisted
 * @property {string} [reason]
 *
 * @typedef {object} CaseAdmissionPort
 * @property {(ask: { worktree: string, caseId?: string }) => { answer: string, record?: object }} resolveBinding
 * @property {(proposal: object) => { admitted: true, reservationId: string, caseId: string, seatLaunchCeiling: number | null } | { refused: { code: string, condition: string, violations?: object[] } }} admit
 * @property {(reservationId: string, result: UnitRunSettle) => void} settle
 *
 * @typedef {object} UnitRunSettle the Unit shape of the contract, plus what the ledger counts
 * @property {{ id: string, version: number }} contract UNIT_RUN_RESULT_CONTRACT
 * @property {string} caseId
 * @property {string} outcome final: the scope rule, the verify round and the refund are applied; `not-started` when no seat was given its brief
 * @property {string|null} unitRunId null when the run never started
 * @property {boolean} infrastructure
 * @property {string[]} outOfScope
 * @property {string[]} outOfScopeOnBranch
 * @property {Array<{ kind: 'verify'|'verdict', seat: string, round: number, passed: boolean }>} evaluations
 * @property {{ value: boolean, reason: string|null }} started
 * @property {{ ceiling: number|null, used: number, ceilingHit: boolean }} launches
 * @property {object[]} results one item per attempt, in order
 * @property {number} seatLaunchesUsed
 * @property {boolean} frameExhausted
 * @property {(reservationId: string, ask: { caseId: string, paths: string[] }) => { ok: true } | { refused: { code: string, condition: string } }} recheckEffect
 */

/** Throws when `port` is not a complete port; a half-made one would fail open at the first missing call. */
export function assertCaseAdmissionPort(port) {
  const missing = OPERATIONS.filter((name) => typeof port?.[name] !== 'function');
  if (missing.length > 0) {
    throw new RunnerConfigError(`runUnit: caseAdmission is not an admission port (missing ${missing.join(', ')})`, { code: PORT_MISSING });
  }
  return port;
}

/** The refusal `runUnit` throws when the port refuses; the port's own answer rides along as `refusal`. */
export class CaseAdmissionRefusedError extends RunnerConfigError {
  constructor(refusal) {
    super(`case admission refused ${refusal.code}: ${refusal.condition}`, { code: refusal.code });
    this.name = 'CaseAdmissionRefusedError';
    this.refusal = refusal;
  }
}

/** The case a Unit names: `{ caseId, activity }` plus the optional unit id and the route the proposer says it takes. */
export function normalizeCaseRef(value) {
  if (value === undefined || value === null) return null;
  const text = (key) => (typeof value?.[key] === 'string' && value[key].trim() ? value[key].trim() : null);
  if (typeof value !== 'object' || Array.isArray(value) || !text('caseId') || !text('activity')) {
    throw new RunnerConfigError('runUnit: caseRef requires non-empty caseId and activity');
  }
  return Object.freeze(Object.fromEntries(['caseId', 'activity', 'unitId', 'route', 'reason'].filter((k) => text(k)).map((k) => [k, text(k)])));
}

/** Whether an attempt's receipt says its agent was never given the brief (nothing was typed, or the launch was abandoned first). */
export function briefNeverReached(receipt) {
  return String(receipt?.outcome ?? '').startsWith('abandoned') || receipt?.reason === 'terminal:foreground-not-agent';
}

/**
 * Whether the run launched seats and none of them was given its brief. Such a run did nothing a case
 * should pay for, so its reservation is handed back instead of spending the frame's dispatch.
 */
export function noBriefDelivered(unitRecord) {
  const launched = Object.values(unitRecord.bindings ?? {}).flat().filter((a) => a.dispatchRetryId !== undefined && a.leaseConflict !== true);
  return launched.length > 0 && launched.every((a) => a.briefNotDelivered === true);
}

/** Every attempt a Unit run has launched so far, from its record: the one count the ceiling is held against. */
export function seatLaunchesUsed(unitRecord) {
  return Object.values(unitRecord.bindings ?? {})
    // An attempt whose account could not be leased never started a worker: it is not a launch.
    .reduce((sum, attempts) => sum + attempts.filter((a) => a.dispatchRetryId !== undefined && a.leaseConflict !== true).length, 0);
}
