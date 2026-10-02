/**
 * Reviewed collaboration pattern.
 * Producer-checker loop with optional deterministic verify and max rounds.
 */

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

export const DEFAULT_CHECKERS_BY_RIGOR = Object.freeze({
  low: Object.freeze(['reviewer']),
  standard: Object.freeze(['reviewer']),
  high: Object.freeze(['reviewer', 'red-team']),
  critical: Object.freeze(['reviewer', 'red-team']),
});

/**
 * Resolve the set of checker roles for a unit.
 *
 * @param {object} unit
 * @param {object} cfg
 * @param {object} [params]
 * @returns {Array<string>}
 */
export function resolveCheckers(unit, cfg, params = {}) {
  const rigor = unit?.rigor || 'standard';
  const checkersByRigor = cfg?.patterns?.reviewed?.checkersByRigor || DEFAULT_CHECKERS_BY_RIGOR;
  const fromRigor = checkersByRigor[rigor] || DEFAULT_CHECKERS_BY_RIGOR[rigor] || ['reviewer'];

  const capConfig = cfg?.capabilities?.[unit?.capability];
  const minFromCap = capConfig?.minCheckers || [];
  const minFromParams = Array.isArray(params?.minCheckers)
    ? params.minCheckers
    : (params?.minCheckers ? [params.minCheckers] : []);

  const checkers = new Set([...fromRigor, ...minFromCap, ...minFromParams]);

  if (unit?.capability?.startsWith('code:') || unit?.capability === 'code') {
    checkers.add('red-team');
  }

  return Array.from(checkers);
}

/**
 * Check if a verify command exists on unit, config, or preset params.
 *
 * @param {object} unit
 * @param {object} cfg
 * @param {object} [params]
 * @returns {boolean}
 */
export function hasVerifyCommand(unit, cfg, params = {}) {
  return Boolean(
    unit?.verify ||
    cfg?.capabilities?.[unit?.capability]?.verify ||
    params?.verify
  );
}

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
    return [`Role ${res.role || 'checker'} reported findings`];
  }
  return [];
}

/**
 * Check whether a round has fully settled in history.
 *
 * @param {number} r
 * @param {Array<object>} priorResults
 * @param {Array<string>} checkerList
 * @param {boolean} hasVerify
 * @returns {boolean}
 */
function isRoundSettledInHistory(r, priorResults, checkerList, hasVerify) {
  const prod = priorResults.find((h) => h.role === 'producer' && (h.round ?? 1) === r);
  if (!prod) return false;
  if (ERROR_OUTCOMES.includes(prod.outcome)) return true;

  for (const checkerRole of checkerList) {
    const chk = priorResults.find((h) => h.role === checkerRole && (h.round ?? 1) === r);
    if (!chk) return false;
    if (ERROR_OUTCOMES.includes(chk.outcome)) return true;
  }

  if (hasVerify) {
    const ver = priorResults.find((h) => (h.role === 'verify' || h.role === 'verifier') && (h.round ?? 1) === r);
    if (!ver) return false;
  }

  return true;
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
 * @param {object} [params] - Pattern parameters (from preset or caller).
 * @returns {Promise<{ outcome: string, rounds: number, results: Array<object>, findings: Array<string> }>}
 */
export async function runReviewed(unit, cfg, { runRole, verify, history } = {}, params = {}) {
  const maxRounds = params?.maxRounds ?? cfg?.patterns?.reviewed?.maxRounds ?? 2;
  const priorResults = typeof history === 'function' ? history() : (Array.isArray(history) ? history : []);

  const checkerList = resolveCheckers(unit, cfg, params);
  const hasVerify = hasVerifyCommand(unit, cfg, params);

  const allResults = [];
  const allFindings = [];
  let priorFindings = [];

  for (let r = 1; r <= maxRounds; r++) {
    // Check if this round settled entirely in history
    if (isRoundSettledInHistory(r, priorResults, checkerList, hasVerify)) {
      const histProducer = priorResults.find((h) => h.role === 'producer' && (h.round ?? 1) === r);
      allResults.push(histProducer);

      if (ERROR_OUTCOMES.includes(histProducer.outcome)) {
        return {
          outcome: histProducer.outcome,
          rounds: r,
          results: allResults,
          findings: allFindings,
        };
      }

      const roundHistoryResults = [histProducer];
      for (const checkerRole of checkerList) {
        const histChk = priorResults.find((h) => h.role === checkerRole && (h.round ?? 1) === r);
        allResults.push(histChk);
        roundHistoryResults.push(histChk);
      }

      if (hasVerify) {
        const histVer = priorResults.find((h) => (h.role === 'verify' || h.role === 'verifier') && (h.round ?? 1) === r);
        allResults.push(histVer);
        roundHistoryResults.push(histVer);
      }

      // Check for errors in history
      const errorInHist = roundHistoryResults.find((res) => ERROR_OUTCOMES.includes(res.outcome));
      if (errorInHist) {
        return {
          outcome: errorInHist.outcome,
          rounds: r,
          results: allResults,
          findings: allFindings,
        };
      }

      // Check for findings in history
      const roundFindings = [];
      for (const res of roundHistoryResults) {
        if (res.outcome === 'findings' || (res.role === 'verify' && res.outcome !== 'pass')) {
          roundFindings.push(...extractFindings(res));
        }
      }

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

    // Round is live (partially or not in history)
    const currentRoundResults = [];

    // Step A: Run producer role
    const existingProducer = priorResults.find((h) => h.role === 'producer' && (h.round ?? 1) === r && h.outcome === 'pass');
    let producerResult;
    if (existingProducer) {
      producerResult = existingProducer;
    } else {
      const payload = {
        role: 'producer',
        unit,
        readOnly: (unit?.writes || []).length === 0,
        round: r,
        ...(r > 1 && priorFindings.length > 0 ? { findings: priorFindings } : {}),
      };
      producerResult = await runRole(payload);
    }

    currentRoundResults.push(producerResult);
    allResults.push(producerResult);

    if (ERROR_OUTCOMES.includes(producerResult.outcome)) {
      return {
        outcome: producerResult.outcome,
        rounds: r,
        results: allResults,
        findings: allFindings,
      };
    }

    // Step B: Run checkers in PARALLEL (Promise.all)
    const pendingCheckerRoles = [];
    const reusedCheckerResults = [];

    for (const checkerRole of checkerList) {
      const existingChecker = priorResults.find((h) => h.role === checkerRole && (h.round ?? 1) === r && h.outcome === 'pass');
      if (existingChecker) {
        reusedCheckerResults.push(existingChecker);
      } else {
        pendingCheckerRoles.push(checkerRole);
      }
    }

    let reusedVerify = null;
    let runPendingVerify = false;
    if (hasVerify) {
      const existingVer = priorResults.find((h) => (h.role === 'verify' || h.role === 'verifier') && (h.round ?? 1) === r && h.outcome === 'pass');
      if (existingVer) {
        reusedVerify = existingVer;
      } else if (typeof verify === 'function') {
        runPendingVerify = true;
      }
    }

    const checkerPromises = pendingCheckerRoles.map((checkerRole) =>
      runRole({
        role: checkerRole,
        unit,
        readOnly: true,
        independentOf: ['producer'],
        round: r,
      }),
    );

    const verifyPromise = runPendingVerify
      ? Promise.resolve().then(async () => {
          const vRes = await verify(unit);
          return {
            role: 'verify',
            round: r,
            outcome: vRes?.pass ? 'pass' : 'findings',
            findings: vRes?.findings || (vRes?.pass ? [] : ['Verification failed']),
          };
        })
      : null;

    const [dispatchedCheckers, dispatchedVerify] = await Promise.all([
      Promise.all(checkerPromises),
      verifyPromise,
    ]);

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
    const errorResult = currentRoundResults.find((res) => ERROR_OUTCOMES.includes(res.outcome));
    if (errorResult) {
      return {
        outcome: errorResult.outcome,
        rounds: r,
        results: allResults,
        findings: allFindings,
      };
    }

    // Check for findings or verify failure
    const roundFindings = [];
    for (const res of currentRoundResults) {
      if (res.outcome === 'findings' || (res.role === 'verify' && res.outcome !== 'pass')) {
        roundFindings.push(...extractFindings(res));
      }
    }

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
