/**
 * Reviewed collaboration pattern.
 * Producer-checker loop with optional deterministic verify and max rounds.
 */

import { roleUnit } from './role-tasks.mjs';
import { ERROR_OUTCOMES } from '../outcome.mjs';
import { resolveSeats, requiresDistinctFamilies, VERIFY_SEAT } from '../seat-resolver.mjs';
import { createBindBarrier } from '../seat-ledger.mjs';
import { verifyCommandOf, hasVerifyCommand, verifySeatResult } from './verify.mjs';

/**
 * The round limit the caller resolved from `runner.loops.reviewed.maxRounds` (the standard holds its value, a
 * project or the machine may change it). The loop keeps no number of its own: a missing or unusable limit is a
 * refusal by name, not a silent default.
 */
function maxRoundsOf(params) {
  const maxRounds = params?.maxRounds;
  if (Number.isInteger(maxRounds) && maxRounds >= 1) return maxRounds;
  throw Object.assign(new Error(`the reviewed loop needs params.maxRounds, an integer >= 1 from runner.loops.reviewed.maxRounds in the effective config, got ${JSON.stringify(maxRounds)}`), { code: 'reviewed-max-rounds-missing' });
}

export const PARAMS = Object.freeze({
  maxRounds: Object.freeze({
    type: 'integer',
    domain: 'integer >= 1',
    scalar: true,
    requestable: true,
  }),
  minCheckers: Object.freeze({
    type: 'checker-list',
    domain: 'list of CHECKER_SEATS names',
    scalar: false,
    requestable: true,
  }),
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
});
export const VERIFY = true;

/**
 * A producer, the writing seat, that claimed done but changed no files settles no-evidence and
 * inconclusive, which the history reads as an execution failure. Its work may already be committed, so
 * the round goes on to its checks; a crash, timeout or provider limit carries a failure and still stops
 * it. History records carry no posture, so only the seat id tells the producer from a checker.
 *
 * @param {object} res
 * @param {string} producerSeat
 * @returns {boolean}
 */
function changedNothing(res, producerSeat) {
  const classification = res?.runResult?.classification;
  return res?.seat === producerSeat
    && res.outcome === 'execution-failure'
    && classification?.confidence?.level === 'no-evidence'
    && classification?.assessment?.verdict === 'inconclusive'
    && !classification?.failure;
}

/** An outcome that ends the round: an error outcome, except a producer that changed nothing. */
const endsRound = (res, producerSeat) => ERROR_OUTCOMES.includes(res?.outcome) && !changedNothing(res, producerSeat);


/**
 * Extract findings array from a result object.
 *
 * @param {object} res
 * @returns {Array<string>}
 */
export function extractFindings(res) {
  if (!res) return [];
  if (Array.isArray(res.findings) && res.findings.length > 0) return res.findings;
  if (typeof res.findings === 'string') return [res.findings];
  if (res.finding) return [res.finding];
  if (res.outcome === 'findings') {
    return [`Seat ${res.seat || 'checker'} reported findings`];
  }
  return [];
}

/** The history entry a seat recorded in round `r`. */
const roundEntry = (priorResults, seat, r) => priorResults.find((h) => h.seat === seat && (h.round ?? 1) === r);

/**
 * Check whether a round has fully settled in history.
 *
 * A round is final only once every seat it dispatches has a result (or its producer failed, so no
 * checker was dispatched). Until then, resume reuses the seats that passed and retries every other
 * one, including a checker that failed while a sibling never reported.
 */
function isRoundSettledInHistory(r, priorResults, producerSeat, checkerList, hasVerify) {
  const prod = roundEntry(priorResults, producerSeat, r);
  if (!prod) return false;
  if (endsRound(prod, producerSeat)) return true;
  const seats = hasVerify ? [...checkerList, VERIFY_SEAT] : checkerList;
  return seats.every((seat) => roundEntry(priorResults, seat, r));
}

/** Shared by live/history execution and the legacy summary projection. */
function assessRound(results, producerSeat) {
  const error = results.find((res) => endsRound(res, producerSeat));
  if (error) return { outcome: error.outcome, findings: [] };
  const findings = results.flatMap((res) =>
    res.outcome === 'findings' || (res.seat === VERIFY_SEAT && res.outcome !== 'pass')
      ? extractFindings(res) : []);
  return { outcome: findings.length > 0 ? 'findings' : 'pass', findings };
}

/**
 * Read a terminal outcome without dispatching/verification. Incomplete history
 * cannot establish completion and must remain unknown to the summary.
 */
export function reviewedHistoryOutcome(unit, cfg, priorResults, params = {}, seats = []) {
  const maxRounds = maxRoundsOf(params);
  const producerSeat = seats.find((seat) => seat.role === 'producer')?.seat ?? 'producer';
  const checkerList = seats.filter((seat) => seat.role !== 'producer').map((seat) => seat.seat);
  const hasVerify = hasVerifyCommand(unit, cfg);
  for (let round = 1; round <= maxRounds; round++) {
    if (!isRoundSettledInHistory(round, priorResults, producerSeat, checkerList, hasVerify)) return null;
    const producer = roundEntry(priorResults, producerSeat, round);
    if (endsRound(producer, producerSeat)) return producer.outcome;
    const peerSeats = hasVerify ? [...checkerList, VERIFY_SEAT] : checkerList;
    const results = [producer, ...peerSeats.map((seat) => roundEntry(priorResults, seat, round))];
    const assessment = assessRound(results.filter(Boolean), producerSeat);
    if (assessment.outcome !== 'findings' || round === maxRounds) return assessment.outcome;
  }
  return null;
}

/**
 * Run reviewed pattern for a unit.
 *
 * @param {object} unit - The unit data contract.
 * @param {object} cfg - Runner configuration snapshot.
 * @param {object} hooks - Injected execution hooks.
 * @param {Function} hooks.runRole - Function to dispatch a role out-of-process.
 * @param {Function} [hooks.verify] - Deterministic verify hook.
 * @param {Function|Array} [hooks.history] - Prior attempts/results.
 * @param {Function} [hooks.hasLaunchRoom] - Capacity check for further launches.
 * @param {object} [hooks.shippedCheckersByRigor] - Shipped checkers by rigor table floor.
 * @param {object} [params] - Pattern parameters (from pattern or caller).
 * @returns {Promise<{ outcome: string, rounds: number, results: Array<object>, findings: Array<string> }>}
 */
export async function runReviewed(unit, cfg, hooks = {}, params = {}) {
  const { runRole, verify, history, hasLaunchRoom } = hooks;
  const maxRounds = maxRoundsOf(params);
  const priorResults = typeof history === 'function' ? history() : (Array.isArray(history) ? history : []);
  const shippedCheckersByRigor = hooks?.shippedCheckersByRigor;

  const seats = resolveSeats({ loop: 'reviewed', params, unit, runnerConfig: cfg, shippedCheckersByRigor });
  const producerSeat = seats.find((seat) => seat.role === 'producer');
  const checkerSeats = seats.filter((seat) => seat.role !== 'producer');
  const checkerList = checkerSeats.map((seat) => seat.seat);
  const hasVerify = hasVerifyCommand(unit, cfg);
  const distinctFamilies = requiresDistinctFamilies(unit, cfg);

  const allResults = [];
  const allFindings = [];
  let priorFindings = [];
  const finish = (outcome, rounds, findings = allFindings) => ({ outcome, rounds, results: allResults, findings });
  // What a round's assessment decides: an error ends the run; findings go on to the next round, or end
  // the run at the last one; nothing found passes. Returns null to go on.
  const concludeRound = (assessment, r) => {
    if (ERROR_OUTCOMES.includes(assessment.outcome)) return finish(assessment.outcome, r);
    if (assessment.findings.length === 0) return finish('pass', r, []);
    allFindings.push(...assessment.findings);
    if (r >= maxRounds) return finish('findings', r);
    priorFindings = assessment.findings;
    return null;
  };

  for (let r = 1; r <= maxRounds; r++) {
    if (isRoundSettledInHistory(r, priorResults, producerSeat.seat, checkerList, hasVerify)) {
      const histProducer = roundEntry(priorResults, producerSeat.seat, r);
      allResults.push(histProducer);
      if (endsRound(histProducer, producerSeat.seat)) return finish(histProducer.outcome, r);
      const roundHistoryResults = [histProducer];
      for (const seat of hasVerify ? [...checkerList, VERIFY_SEAT] : checkerList) {
        const hist = roundEntry(priorResults, seat, r);
        allResults.push(hist);
        roundHistoryResults.push(hist);
      }
      const concluded = concludeRound(assessRound(roundHistoryResults, producerSeat.seat), r);
      if (concluded) return concluded;
      continue;
    }

    // A round that cannot launch its seats under the Unit's seat-launch ceiling does not start: the run
    // ends at the last evaluation it has, which found something (or the loop would not be here).
    if (r > 1 && typeof hasLaunchRoom === 'function' && !hasLaunchRoom(1 + checkerList.length)) {
      return finish('findings', r - 1);
    }

    // The round is live (partially or not in history). Producer first: a recorded pass, or a producer that
    // changed nothing, is reused.
    const existingProducer = priorResults.find((h) => h.seat === producerSeat.seat && (h.round ?? 1) === r && (h.outcome === 'pass' || changedNothing(h, producerSeat.seat)));
    const producerResult = existingProducer ?? await runRole({
      seat: producerSeat,
      // Round 1 is the unit as given; a later round also lists what the checks found, so the
      // producer knows what to fix.
      unit: roleUnit(unit, { seat: producerSeat.seat, kind: 'producer', params, findings: r > 1 ? priorFindings : [] }),
      round: r,
    });
    const currentRoundResults = [producerResult];
    allResults.push(producerResult);
    if (endsRound(producerResult, producerSeat.seat)) return finish(producerResult.outcome, r);

    // Checkers and verification run together, and every peer is drained before the round is judged.
    const reusedResults = [];
    const pendingCheckerSeats = [];
    for (const checkerSeat of checkerSeats) {
      const existingChecker = priorResults.find((h) => h.seat === checkerSeat.seat && (h.round ?? 1) === r && h.outcome === 'pass');
      if (existingChecker) reusedResults.push(existingChecker);
      else pendingCheckerSeats.push(checkerSeat);
    }
    let runPendingVerify = false;
    let reusedVerify = null;
    if (hasVerify) {
      reusedVerify = priorResults.find((h) => h.seat === VERIFY_SEAT && (h.round ?? 1) === r && h.outcome === 'pass') ?? null;
      runPendingVerify = !reusedVerify && typeof verify === 'function';
    }

    const barrier = createBindBarrier(pendingCheckerSeats.length);
    const checkerPromises = pendingCheckerSeats.map((checkerSeat) =>
      Promise.resolve().then(() => runRole({
        seat: checkerSeat,
        // Told to check rather than to do the work, and handed the producer's account of this round.
        unit: roleUnit(unit, { seat: checkerSeat.seat, params }),
        independentOf: distinctFamilies ? [producerSeat.seat, ...checkerList.filter((id) => id !== checkerSeat.seat)] : [producerSeat.seat],
        round: r,
        inputs: [producerResult],
        batch: barrier,
      })),
    );
    const verifyPromise = runPendingVerify
      ? Promise.resolve().then(async () => verifySeatResult(await verify(unit), r))
      : null;

    let firstRejection;
    let rejected = false;
    const peers = [...checkerPromises, ...(verifyPromise ? [verifyPromise] : [])];
    const settledPeers = await Promise.allSettled(peers.map((peer) => peer.catch((error) => {
      if (!rejected) {
        rejected = true;
        firstRejection = error;
      }
      throw error;
    })));
    if (rejected) throw firstRejection;
    const dispatchedCheckers = settledPeers.slice(0, checkerPromises.length).map((peer) => peer.value);
    const dispatchedVerify = verifyPromise ? settledPeers.at(-1).value : null;

    for (const res of [...reusedResults, ...dispatchedCheckers, ...[reusedVerify, dispatchedVerify].filter(Boolean)]) {
      currentRoundResults.push(res);
      allResults.push(res);
    }

    const concluded = concludeRound(assessRound(currentRoundResults, producerSeat.seat), r);
    if (concluded) return concluded;
  }

  return finish(allFindings.length > 0 ? 'findings' : 'pass', maxRounds);
}
