import { VERIFY_SEAT } from '../seat-resolver.mjs';

/**
 * Verification command resolution for collaboration loops.
 * Reads the unit's own `verify`, else its capability's. Nothing else supplies one,
 * so a unit without either is not verified, and says so.
 */

/**
 * The verify command of a unit: its own `verify`, else its capability's. Nothing else supplies one,
 * so a unit without either is not verified, and says so.
 *
 * @param {object} unit
 * @param {object} cfg
 * @returns {string|undefined}
 */
export function verifyCommandOf(unit, cfg) {
  const command = unit?.verify || cfg?.capabilities?.[unit?.capability]?.verify;
  return typeof command === 'string' && command.trim() ? command : undefined;
}

/**
 * Check if a verify command exists on the unit or its capability.
 *
 * @param {object} unit
 * @param {object} cfg
 * @returns {boolean}
 */
export function hasVerifyCommand(unit, cfg) {
  return verifyCommandOf(unit, cfg) !== undefined;
}

/**
 * The seat result of one verify round, from what the `verify` hook answered: `{ pass: true }`, findings, or an
 * infrastructure failure (the check did not run to an end, so it is an `execution-failure` that a resume runs again;
 * `infrastructureReason` says how it did not end: `timeout` or `not-run`).
 *
 * @param {{ pass?: boolean, findings?: string[], infrastructure?: string, error?: string }|undefined} answer
 * @param {number} round
 * @returns {object}
 */
export function verifySeatResult(answer, round) {
  if (answer?.pass) return { seat: VERIFY_SEAT, round, outcome: 'pass', findings: [] };
  if (answer?.infrastructure) {
    return { seat: VERIFY_SEAT, round, outcome: 'execution-failure', infrastructure: true, infrastructureReason: answer.infrastructure, error: answer.error };
  }
  return { seat: VERIFY_SEAT, round, outcome: 'findings', findings: answer?.findings || ['Verification failed'] };
}
