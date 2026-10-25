/**
 * Panel collaboration pattern.
 * Runs the unit's member seats in parallel, followed by its synthesizer seat. Provider-family spread
 * between seats is declared as a soft preference (`preferIndependentOf`); bind() owns the choice.
 */

import { roleUnit } from './role-tasks.mjs';
import { resolveSeats } from '../seat-resolver.mjs';
import { createBindBarrier } from '../seat-ledger.mjs';

export const VALID_OUTCOMES = Object.freeze([
  'pass',
  'findings',
  'execution-failure',
  'policy-refusal',
  'provider-limit',
  'blocked',
]);

const ERROR_OUTCOMES = Object.freeze([
  'execution-failure',
  'policy-refusal',
  'provider-limit',
  'blocked',
]);

/**
 * Run panel pattern for a unit.
 *
 * @param {object} unit - The unit data contract; it declares the panel's seats.
 * @param {object} cfg - Runner configuration snapshot.
 * @param {object} hooks - Injected execution hooks.
 * @param {Function} hooks.runRole - Function that binds and dispatches one seat.
 * @param {Function|Array} [hooks.history] - Prior attempts/results.
 * @param {object} [params] - Pattern parameters (`roleTasks`, keyed by seat id).
 * @returns {Promise<{ outcome: string, results: Array<object> }>}
 */
export async function runPanel(unit, cfg, { runRole, verify, history } = {}, params = {}) {
  const seats = resolveSeats({ pattern: { pattern: 'panel', params }, unit, runnerConfig: cfg });
  const members = seats.filter((s) => s.posture.stance);
  const synthesizer = seats.find((s) => s.role === 'synthesizer');
  const prior = typeof history === 'function' ? history() : (Array.isArray(history) ? history : []);

  const memberIds = members.map((m) => m.seat);
  const pendingMembers = members.filter((m) => !prior?.some((h) => h.seat === m.seat && h.outcome === 'pass'));
  const barrier = createBindBarrier(pendingMembers.length);
  // Dispatch all panel members in PARALLEL. Members bind in the listed order and none launches
  // before every member is bound.
  const memberPromises = members.map(async (member) => {
    const existing = prior?.find((h) => h.seat === member.seat && h.outcome === 'pass');
    if (existing) {
      return existing;
    }

    // A different provider family per seat is a preference, not a rule: a panel may have more
    // seats than the pool has families. Seats are listed in priority order (the first listed
    // is bound first); bind() alone decides which family each seat gets and never refuses a
    // seat for sharing one.
    return await runRole({
      seat: member,
      unit: roleUnit(unit, { seat: member.seat, kind: 'panelist', stance: true, params }),
      preferIndependentOf: memberIds.filter((id) => id !== member.seat),
      batch: barrier,
    });
  });

  // Wait for every seat before propagating a throw, so the owner can summarize all settled attempts.
  const settledMembers = await Promise.allSettled(memberPromises);
  const thrown = settledMembers.find((result) => result.status === 'rejected');
  if (thrown) throw thrown.reason;
  const memberResults = settledMembers.map((result) => result.value);

  // If any member had execution failure / policy refusal / provider limit / blocked -> propagate
  const errorResult = memberResults.find((r) => ERROR_OUTCOMES.includes(r.outcome));
  if (errorResult) {
    return {
      outcome: errorResult.outcome,
      results: memberResults,
    };
  }

  // Once all members complete, run synthesizer
  const existingSynth = prior?.find((h) => h.seat === synthesizer.seat && h.outcome === 'pass');
  const synthResult = existingSynth || await runRole({
    seat: synthesizer,
    // The members answer the unit's objective; the synthesizer is told to synthesize their answers.
    unit: roleUnit(unit, { seat: synthesizer.seat, kind: 'synthesizer', params }),
    // The synthesizer judges every member, so it prefers a provider family none of them used;
    // the runner turns these seat ids into the executors that filled them and bind() ranks
    // provider families, falling back to the least used one instead of refusing.
    preferIndependentOf: memberIds,
    inputs: memberResults,
  });

  return {
    outcome: synthResult.outcome,
    results: [...memberResults, synthResult],
  };
}
