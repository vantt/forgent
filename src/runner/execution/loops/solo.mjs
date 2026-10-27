/**
 * Solo collaboration pattern.
 * One producer seat.
 */

import { resolveSeats, VERIFY_SEAT } from '../seat-resolver.mjs';
import { verifyCommandOf } from './verify.mjs';

export const VALID_OUTCOMES = Object.freeze([
  'pass',
  'findings',
  'execution-failure',
  'policy-refusal',
  'provider-limit',
  'blocked',
]);

export const PARAMS = Object.freeze({
  seats: Object.freeze({
    type: 'seats',
    scalar: false,
    requestable: true,
  }),
});
export const VERIFY = true;

/**
 * Run solo pattern for a unit.
 *
 * @param {object} unit - The unit data contract.
 * @param {object} cfg - Runner configuration snapshot.
 * @param {object} hooks - Injected execution hooks.
 * @param {Function} hooks.runRole - Function that binds and dispatches one seat.
 * @param {Function} [hooks.verify] - Deterministic verify hook.
 * @param {Function|Array} [hooks.history] - Prior attempts/results.
 * @param {object} [params] - Pattern parameters.
 * @returns {Promise<{ outcome: string, rounds: number, results: Array<object> }>}
 */
export async function runSolo(unit, cfg, { runRole, verify, history } = {}, params = {}) {
  const [seat] = resolveSeats({ loop: 'solo', params, unit, runnerConfig: cfg });
  const prior = typeof history === 'function' ? history() : (Array.isArray(history) ? history : []);
  const existing = prior?.find((r) => r.seat === seat.seat && r.outcome === 'pass');

  const result = existing || await runRole({ seat, unit });

  const results = [result];
  if (result.outcome !== 'pass' || !verifyCommandOf(unit, cfg)) {
    return {
      outcome: result.outcome,
      rounds: 1,
      results,
    };
  }

  const existingVer = prior?.find((h) => h.seat === VERIFY_SEAT && (h.round ?? 1) === 1 && h.outcome === 'pass');
  let verifyResult;
  if (existingVer) {
    verifyResult = existingVer;
  } else if (typeof verify === 'function') {
    const vRes = await verify(unit);
    verifyResult = {
      seat: VERIFY_SEAT,
      round: 1,
      outcome: vRes?.pass ? 'pass' : 'findings',
      findings: vRes?.findings || (vRes?.pass ? [] : ['Verification failed']),
    };
  }

  if (verifyResult) {
    results.push(verifyResult);
    return {
      outcome: verifyResult.outcome,
      rounds: 1,
      results,
      ...(verifyResult.outcome === 'findings' ? { findings: verifyResult.findings || [] } : {}),
    };
  }

  return {
    outcome: result.outcome,
    rounds: 1,
    results,
  };
}
