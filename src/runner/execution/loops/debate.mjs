/**
 * Debate collaboration pattern.
 * Two sides argue from opposite assumptions and an independent judge rules.
 *
 * Round 1 runs both sides blind and in parallel. Round 2 (on unless `params.rebuttal` is false) hands
 * each side only the other side's round-1 argument to answer. The judge then reads every argument
 * and rules. A different provider family per side is a soft preference (`preferIndependentOf`); the
 * judge's family differing from both sides is a hard rule (`independentOf`), so a pool that cannot
 * seat such a judge ends the run with bind()'s named independence refusal instead of a same-family
 * ruling. Seats are read-only: arguments and a ruling, never writes.
 *
 * The unit declares the seats: two producer sides, the first arguing the position and the second the
 * opposite, and one judge.
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

export const DEFAULT_REBUTTAL = true;

export const PARAMS = Object.freeze({
  seats: Object.freeze({
    type: 'seats',
    scalar: false,
    requestable: true,
  }),
  roleTasks: Object.freeze({
    type: 'role-tasks',
    domain: 'map seat-or-kind to text',
    scalar: false,
    requestable: false,
  }),
  rebuttal: Object.freeze({
    type: 'boolean',
    scalar: true,
    requestable: true,
  }),
});

// The task each side is given, by its position in the declared order.
const SIDE_KINDS = Object.freeze(['thesis', 'antithesis']);

const priorOf = (history) => (typeof history === 'function' ? history() : (Array.isArray(history) ? history : []));

/**
 * Run debate pattern for a unit.
 *
 * @param {object} unit - The unit data contract; it declares the debate's seats.
 * @param {object} cfg - Runner configuration snapshot.
 * @param {object} hooks - Injected execution hooks.
 * @param {Function} hooks.runRole - Function that binds and dispatches one seat.
 * @param {Function|Array} [hooks.history] - Prior attempts/results.
 * @param {object} [params] - Pattern parameters: `rebuttal` (default true), `roleTasks` (keyed by seat id).
 * @returns {Promise<{ outcome: string, rounds: number, results: Array<object> }>}
 */
export async function runDebate(unit, cfg, { runRole, history } = {}, params = {}) {
  const seats = resolveSeats({ loop: 'debate', params, unit, runnerConfig: cfg });
  const sides = seats.filter((s) => s.role === 'producer');
  const judge = seats.find((s) => s.role === 'judge');
  const rebuttal = params?.rebuttal ?? DEFAULT_REBUTTAL;
  const prior = priorOf(history);
  const sideIds = sides.map((s) => s.seat);
  const results = [];

  // One round of both sides in parallel. Every seat of a settled-and-passed earlier attempt is
  // reused; the first listed side is bound first, so the other prefers a family it did not get.
  const runSides = async (round) => {
    const reuse = (side) => prior.find((h) => h.seat === side.seat && (h.round ?? 1) === round && h.outcome === 'pass');
    const barrier = createBindBarrier(sides.filter((side) => !reuse(side)).length);
    const settled = await Promise.allSettled(sides.map(async (side, index) => {
      const existing = reuse(side);
      if (existing) return existing;
      const other = sides.find((s) => s.seat !== side.seat);
      const kind = SIDE_KINDS[index];
      return await runRole({
        seat: side,
        // Round 1: the argument from the side's own assumptions, blind to the other side. Round 2:
        // only the other side's round-1 argument is handed over, to be answered.
        unit: roleUnit(unit, { seat: round === 1 ? side.seat : `${side.seat}-rebuttal`, kind: round === 1 ? kind : `${kind}-rebuttal`, params }),
        round,
        preferIndependentOf: sideIds.filter((id) => id !== side.seat),
        batch: barrier,
        ...(round === 1 ? {} : { inputs: [results.find((r) => r.seat === other.seat && (r.round ?? 1) === 1)] }),
      });
    }));
    // Wait for every seat before propagating a throw, so the owner can summarize all settled attempts.
    const thrown = settled.find((result) => result.status === 'rejected');
    if (thrown) throw thrown.reason;
    const roundResults = settled.map((result) => result.value);
    results.push(...roundResults);
    return roundResults;
  };

  const rounds = rebuttal ? [1, 2] : [1];
  for (const round of rounds) {
    const roundResults = await runSides(round);
    const errorResult = roundResults.find((r) => ERROR_OUTCOMES.includes(r.outcome));
    if (errorResult) return { outcome: errorResult.outcome, rounds: round, results };
  }

  // The judge reads both sides and their rebuttals and must differ in provider family from both,
  // so a pool that cannot seat one is refused by name, never ruled by a same-family judge.
  const existingJudge = prior.find((h) => h.seat === judge.seat && h.outcome === 'pass');
  const judgeResult = existingJudge || await runRole({
    seat: judge,
    unit: roleUnit(unit, { seat: judge.seat, kind: 'judge', params }),
    independentOf: sideIds,
    inputs: [...results],
  });
  results.push(judgeResult);

  return { outcome: judgeResult.outcome, rounds: rounds.length, results };
}
