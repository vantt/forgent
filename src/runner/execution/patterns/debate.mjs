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
 */

import { roleUnit } from './role-tasks.mjs';

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
 * Canonical semantic roles, shared by execution, admission and the derived read model. A side's
 * `kind` is `producer` (it argues the task); the judge's is `judge`.
 */
export function resolveDebateRoles(params = {}) {
  return {
    sides: [
      { role: 'thesis', kind: 'producer' },
      { role: 'antithesis', kind: 'producer' },
    ],
    judge: { role: 'judge', kind: 'judge' },
    rebuttal: params?.rebuttal !== false,
  };
}

/** Seat launches a debate plans: each side per round, then the judge. */
export function debateSeatLaunches(params = {}) {
  const { sides, rebuttal } = resolveDebateRoles(params);
  return sides.length * (rebuttal ? 2 : 1) + 1;
}

const priorOf = (history) => (typeof history === 'function' ? history() : (Array.isArray(history) ? history : []));
const seatOf = (prior, role, round) => prior.find((h) => h.role === role && (h.round ?? 1) === round);

/**
 * Read a terminal outcome from history without dispatching anything. A debate whose seats have not
 * all reported cannot be established as complete, so it stays unknown (null).
 */
export function debateHistoryOutcome(params, history) {
  const { sides, judge, rebuttal } = resolveDebateRoles(params);
  const rounds = rebuttal ? [1, 2] : [1];
  const sideSeats = rounds.flatMap((round) => sides.map(({ role }) => seatOf(history, role, round)));
  if (sideSeats.some((seat) => !seat)) {
    // A side that ended in error ends the debate at that round.
    return sideSeats.find((seat) => seat && ERROR_OUTCOMES.includes(seat.outcome))?.outcome ?? null;
  }
  const error = sideSeats.find((seat) => ERROR_OUTCOMES.includes(seat.outcome));
  if (error) return error.outcome;
  return seatOf(history, judge.role, 1)?.outcome ?? null;
}

/**
 * Run debate pattern for a unit.
 *
 * @param {object} unit - The unit data contract.
 * @param {object} cfg - Runner configuration snapshot.
 * @param {object} hooks - Injected execution hooks.
 * @param {Function} hooks.runRole - Function to dispatch a role out-of-process.
 * @param {Function|Array} [hooks.history] - Prior attempts/results.
 * @param {object} [params] - Pattern parameters: `rebuttal` (default true), `roleTasks`.
 * @returns {Promise<{ outcome: string, rounds: number, results: Array<object> }>}
 */
export async function runDebate(unit, cfg, { runRole, history } = {}, params = {}) {
  const { sides, judge, rebuttal } = resolveDebateRoles(params);
  const prior = priorOf(history);
  const allRoles = sides.map(({ role }) => role);
  const results = [];

  // One round of both sides in parallel. Every seat of a settled-and-passed earlier attempt is
  // reused; the first listed side is bound first, so the other prefers a family it did not get.
  const runSides = async (round) => {
    const settled = await Promise.allSettled(sides.map(async ({ role }) => {
      const existing = prior.find((h) => h.role === role && (h.round ?? 1) === round && h.outcome === 'pass');
      if (existing) return existing;
      const other = sides.find((side) => side.role !== role).role;
      return await runRole({
        role,
        // Round 1: the argument from the side's own assumptions, blind to the other side. Round 2:
        // only the other side's round-1 argument is handed over, to be answered.
        unit: roleUnit(unit, { role: round === 1 ? role : `${role}-rebuttal`, params }),
        readOnly: true,
        round,
        preferIndependentOf: allRoles.filter((r) => r !== role),
        ...(round === 1 ? {} : { inputs: [results.find((r) => r.role === other && (r.round ?? 1) === 1)] }),
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
  const existingJudge = prior.find((h) => h.role === judge.role && h.outcome === 'pass');
  const judgeResult = existingJudge || await runRole({
    role: judge.role,
    unit: roleUnit(unit, { role: judge.role, params }),
    readOnly: true,
    independentOf: allRoles,
    inputs: [...results],
  });
  results.push(judgeResult);

  return { outcome: judgeResult.outcome, rounds: rounds.length, results };
}
