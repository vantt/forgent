/**
 * Reviewed collaboration pattern.
 * Producer-checker loop with optional deterministic verify and max rounds.
 */

import { roleUnit } from './role-tasks.mjs';
import { resolveSeats, requiresDistinctFamilies, VERIFY_SEAT } from '../seat-resolver.mjs';
import { createBindBarrier } from '../seat-ledger.mjs';
import { verifyCommandOf, hasVerifyCommand } from './verify.mjs';

export const VALID_OUTCOMES = Object.freeze([
  'pass',
  'findings',
  'execution-failure',
  'policy-refusal',
  'provider-limit',
  'blocked',
]);

/** The outcomes of a seat that did not finish its job; `pass` and `findings` are completed judgments. */
export const ERROR_OUTCOMES = Object.freeze([
  'execution-failure',
  'policy-refusal',
  'provider-limit',
  'blocked',
]);

export const DEFAULT_MAX_ROUNDS = 2;

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

/**
 * Check whether a round has fully settled in history.
 *
 * A round is final only once every seat it dispatches has a result (or its producer failed, so no
 * checker was dispatched). Until then, resume reuses the seats that passed and retries every other
 * one, including a checker that failed while a sibling never reported.
 *
 * @param {number} r
 * @param {Array<object>} priorResults
 * @param {Array<string>} checkerList
 * @param {boolean} hasVerify
 * @returns {boolean}
 */
function isRoundSettledInHistory(r, priorResults, producerSeat, checkerList, hasVerify) {
  const prod = priorResults.find((h) => h.seat === producerSeat && (h.round ?? 1) === r);
  if (!prod) return false;
  if (endsRound(prod, producerSeat)) return true;

  for (const checkerSeat of checkerList) {
    const chk = priorResults.find((h) => h.seat === checkerSeat && (h.round ?? 1) === r);
    if (!chk) return false;
  }

  if (hasVerify) {
    const ver = priorResults.find((h) => h.seat === VERIFY_SEAT && (h.round ?? 1) === r);
    if (!ver) return false;
  }

  return true;
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
  const maxRounds = params?.maxRounds ?? DEFAULT_MAX_ROUNDS;
  const producerSeat = seats.find((seat) => seat.role === 'producer')?.seat ?? 'producer';
  const checkerList = seats.filter((seat) => seat.role !== 'producer').map((seat) => seat.seat);
  const hasVerify = hasVerifyCommand(unit, cfg);
  for (let round = 1; round <= maxRounds; round++) {
    if (!isRoundSettledInHistory(round, priorResults, producerSeat, checkerList, hasVerify)) return null;
    const producer = priorResults.find((res) => res.seat === producerSeat && (res.round ?? 1) === round);
    if (endsRound(producer, producerSeat)) return producer.outcome;
    const results = [producer, ...checkerList.map((seat) =>
      priorResults.find((res) => res.seat === seat && (res.round ?? 1) === round))];
    if (hasVerify) results.push(priorResults.find((res) =>
      res.seat === VERIFY_SEAT && (res.round ?? 1) === round));
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
  const maxRounds = params?.maxRounds ?? DEFAULT_MAX_ROUNDS;
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

  for (let r = 1; r <= maxRounds; r++) {
    // Check if this round settled entirely in history
    if (isRoundSettledInHistory(r, priorResults, producerSeat.seat, checkerList, hasVerify)) {
      const histProducer = priorResults.find((h) => h.seat === producerSeat.seat && (h.round ?? 1) === r);
      allResults.push(histProducer);

      if (endsRound(histProducer, producerSeat.seat)) {
        return {
          outcome: histProducer.outcome,
          rounds: r,
          results: allResults,
          findings: allFindings,
        };
      }

      const roundHistoryResults = [histProducer];
      for (const checkerSeat of checkerList) {
        const histChk = priorResults.find((h) => h.seat === checkerSeat && (h.round ?? 1) === r);
        allResults.push(histChk);
        roundHistoryResults.push(histChk);
      }

      if (hasVerify) {
        const histVer = priorResults.find((h) => h.seat === VERIFY_SEAT && (h.round ?? 1) === r);
        allResults.push(histVer);
        roundHistoryResults.push(histVer);
      }

      // Check for errors in history
      const assessment = assessRound(roundHistoryResults, producerSeat.seat);
      if (ERROR_OUTCOMES.includes(assessment.outcome)) {
        return {
          outcome: assessment.outcome,
          rounds: r,
          results: allResults,
          findings: allFindings,
        };
      }

      // Check for findings in history
      const roundFindings = assessment.findings;

      if (roundFindings.length > 0) {
        allFindings.push(...roundFindings);
        if (r < maxRounds) {
          priorFindings = roundFindings;
          continue; // Move to next round
        } else {
          return {
            outcome: 'findings',
            rounds: r,
            results: allResults,
            findings: allFindings,
          };
        }
      }

      // All passed in this settled round
      return {
        outcome: 'pass',
        rounds: r,
        results: allResults,
        findings: [],
      };
    }

    // A round that cannot launch its seats under the Unit's seat-launch ceiling does not start: the run
    // ends at the last evaluation it has, which found something (or the loop would not be here).
    if (r > 1 && typeof hasLaunchRoom === 'function' && !hasLaunchRoom(1 + checkerList.length)) {
      return { outcome: 'findings', rounds: r - 1, results: allResults, findings: allFindings };
    }

    // Round is live (partially or not in history)
    const currentRoundResults = [];

    // Step A: Run producer role
    const existingProducer = priorResults.find((h) => h.seat === producerSeat.seat && (h.round ?? 1) === r && (h.outcome === 'pass' || changedNothing(h, producerSeat.seat)));
    let producerResult;
    if (existingProducer) {
      producerResult = existingProducer;
    } else {
      const payload = {
        seat: producerSeat,
        // Round 1 is the unit as given; a later round also lists what the checks found, so the
        // producer knows what to fix.
        unit: roleUnit(unit, { seat: producerSeat.seat, kind: 'producer', params, findings: r > 1 ? priorFindings : [] }),
        round: r,
      };
      producerResult = await runRole(payload);
    }

    currentRoundResults.push(producerResult);
    allResults.push(producerResult);

    if (endsRound(producerResult, producerSeat.seat)) {
      return {
        outcome: producerResult.outcome,
        rounds: r,
        results: allResults,
        findings: allFindings,
      };
    }

    // Step B: Dispatch checkers and verification together, then drain every peer.
    const pendingCheckerSeats = [];
    const reusedCheckerResults = [];

    for (const checkerSeat of checkerSeats) {
      const existingChecker = priorResults.find((h) => h.seat === checkerSeat.seat && (h.round ?? 1) === r && h.outcome === 'pass');
      if (existingChecker) {
        reusedCheckerResults.push(existingChecker);
      } else {
        pendingCheckerSeats.push(checkerSeat);
      }
    }

    let reusedVerify = null;
    let runPendingVerify = false;
    if (hasVerify) {
      const existingVer = priorResults.find((h) => h.seat === VERIFY_SEAT && (h.round ?? 1) === r && h.outcome === 'pass');
      if (existingVer) {
        reusedVerify = existingVer;
      } else if (typeof verify === 'function') {
        runPendingVerify = true;
      }
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
      ? Promise.resolve().then(async () => {
          const vRes = await verify(unit);
          return {
            seat: VERIFY_SEAT,
            round: r,
            outcome: vRes?.pass ? 'pass' : 'findings',
            findings: vRes?.findings || (vRes?.pass ? [] : ['Verification failed']),
          };
        })
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

    for (const res of reusedCheckerResults) {
      currentRoundResults.push(res);
      allResults.push(res);
    }
    for (const res of dispatchedCheckers) {
      currentRoundResults.push(res);
      allResults.push(res);
    }
    if (reusedVerify) {
      currentRoundResults.push(reusedVerify);
      allResults.push(reusedVerify);
    }
    if (dispatchedVerify) {
      currentRoundResults.push(dispatchedVerify);
      allResults.push(dispatchedVerify);
    }

    // Step C: Evaluate results
    // Check for execution failure / policy refusal / provider limit / blocked
    const assessment = assessRound(currentRoundResults, producerSeat.seat);
    if (ERROR_OUTCOMES.includes(assessment.outcome)) {
      return {
        outcome: assessment.outcome,
        rounds: r,
        results: allResults,
        findings: allFindings,
      };
    }

    // Check for findings or verify failure
    const roundFindings = assessment.findings;

    if (roundFindings.length > 0) {
      allFindings.push(...roundFindings);
      if (r < maxRounds) {
        priorFindings = roundFindings;
        continue; // Loop to next round
      } else {
        return {
          outcome: 'findings',
          rounds: r,
          results: allResults,
          findings: allFindings,
        };
      }
    }

    // All checkers pass and verify passes
    return {
      outcome: 'pass',
      rounds: r,
      results: allResults,
      findings: [],
    };
  }

  // Fallback if loop finishes
  return {
    outcome: allFindings.length > 0 ? 'findings' : 'pass',
    rounds: maxRounds,
    results: allResults,
    findings: allFindings,
  };
}
