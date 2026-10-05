/**
 * Panel collaboration pattern.
 * Runs N independent panel members in parallel, followed by a synthesizer.
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
 * Run panel pattern for a unit.
 *
 * @param {object} unit - The unit data contract.
 * @param {object} cfg - Runner configuration snapshot.
 * @param {object} hooks - Injected execution hooks.
 * @param {Function} hooks.runRole - Function to dispatch a role out-of-process.
 * @param {Function} [hooks.verify] - Deterministic verify hook.
 * @param {Function|Array} [hooks.history] - Prior attempts/results.
 * @param {number} [hooks.members=3] - Number of panel members.
 * @param {object} [params] - Pattern parameters.
 * @returns {Promise<{ outcome: string, results: Array<object> }>}
 */
export async function runPanel(unit, cfg, { runRole, verify, history, members = 3 } = {}, params = {}) {
  const memberCount = params?.members ?? members ?? cfg?.patterns?.panel?.members ?? 3;
  const baseRole = params?.role || 'panelist';
  const synthesizeRole = params?.synthesizeRole || 'synthesizer';
  const prior = typeof history === 'function' ? history() : (Array.isArray(history) ? history : []);

  const allPanelistRoles = Array.isArray(params?.role)
    ? params.role
    : Array.from({ length: memberCount }, (_, idx) => `${baseRole}-${idx + 1}`);
  // Dispatch all panel members in PARALLEL
  const memberPromises = allPanelistRoles.map(async (role) => {
    const existing = prior?.find((h) => h.role === role && h.outcome === 'pass');
    if (existing) {
      return existing;
    }

    const independentOf = allPanelistRoles.filter((r) => r !== role);
    return await runRole({
      role,
      unit,
      readOnly: true,
      independentOf,
    });
  });

  const memberResults = await Promise.all(memberPromises);

  // If any member had execution failure / policy refusal / provider limit / blocked -> propagate
  const errorResult = memberResults.find((r) => ERROR_OUTCOMES.includes(r.outcome));
  if (errorResult) {
    return {
      outcome: errorResult.outcome,
      results: memberResults,
    };
  }

  // Once all members complete, run synthesizer
  const existingSynth = prior?.find((h) => h.role === synthesizeRole && h.outcome === 'pass');
  const synthResult = existingSynth || await runRole({
    role: synthesizeRole,
    // The panelists answer the unit's objective; the synthesizer is told to synthesize their answers.
    unit: roleUnit(unit, { role: synthesizeRole, kind: 'synthesizer', params }),
    readOnly: (unit?.writes || []).length === 0,
    // The synthesizer judges every panelist, so it must not share a provider family with any of
    // them; the runner turns these role names into the executors that played them and bind()
    // compares provider families.
    independentOf: allPanelistRoles,
    inputs: memberResults,
  });

  return {
    outcome: synthResult.outcome,
    results: [...memberResults, synthResult],
  };
}
