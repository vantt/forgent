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
//   settle          once, after the pattern settled (or the run failed): receipts, launches used.
//
// The core never writes the ledger itself and never between admit and settle.

import { RunnerConfigError } from '../dispatch/config.mjs';
import { resolvePattern } from './patterns/presets.mjs';
import { resolvePanelRoles } from './patterns/panel.mjs';
import { resolveCheckers } from './patterns/reviewed.mjs';

export const PORT_MISSING = 'case-admission-port-missing';
export const SEAT_LAUNCH_CEILING = 'seat-launch-ceiling';
export const CONSENT_STALE = 'consent-stale';

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
 * @property {(reservationId: string, result: object) => void} settle
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

/**
 * Seat launches a Unit plans, before any fallback: seats per round times the rounds the pattern may
 * run. Read from the pattern the run will use, never from what a seat did.
 *
 * @returns {number | null} null for a pattern this core does not know
 */
export function seatLaunchesOf({ pattern, unit, runnerConfig }) {
  const { patternName, params } = resolvePattern(pattern);
  switch (patternName) {
    case 'solo':
      return 1;
    case 'reviewed': {
      const maxRounds = params?.maxRounds ?? runnerConfig?.patterns?.reviewed?.maxRounds ?? 2;
      return (1 + resolveCheckers(unit, runnerConfig, params).length) * maxRounds;
    }
    case 'panel': {
      const { panelists } = resolvePanelRoles(runnerConfig, {}, params);
      return panelists.length + 1;
    }
    default:
      return null;
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

/** Every attempt a Unit run has launched so far, from its record: the one count the ceiling is held against. */
export function seatLaunchesUsed(unitRecord) {
  return Object.values(unitRecord.bindings ?? {})
    .reduce((sum, attempts) => sum + attempts.filter((a) => a.dispatchRetryId !== undefined).length, 0);
}
