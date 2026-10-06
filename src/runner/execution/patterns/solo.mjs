/**
 * Solo collaboration pattern.
 * Single producer role execution.
 */

export const VALID_OUTCOMES = Object.freeze([
  'pass',
  'findings',
  'execution-failure',
  'policy-refusal',
  'provider-limit',
  'blocked',
]);

/**
 * Run solo pattern for a unit.
 *
 * @param {object} unit - The unit data contract.
 * @param {object} cfg - Runner configuration snapshot.
 * @param {object} hooks - Injected execution hooks.
 * @param {Function} hooks.runRole - Function to dispatch a role out-of-process.
 * @param {Function} [hooks.verify] - Deterministic verify hook.
 * @param {Function|Array} [hooks.history] - Prior attempts/results.
 * @param {object} [params] - Pattern parameters.
 * @returns {Promise<{ outcome: string, rounds: number, results: Array<object> }>}
 */
export async function runSolo(unit, cfg, { runRole, verify, history } = {}, params = {}) {
  const role = params?.role || 'producer';
  const prior = typeof history === 'function' ? history() : (Array.isArray(history) ? history : []);
  const existing = prior?.find((r) => r.role === role && r.outcome === 'pass');

  const readOnly = (unit?.writes || []).length === 0;
  const result = existing || await runRole({
    role,
    unit,
    readOnly,
  });

  return {
    outcome: result.outcome,
    rounds: 1,
    results: [result],
  };
}
