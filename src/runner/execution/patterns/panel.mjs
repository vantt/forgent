/**
 * Panel collaboration pattern.
 * Runs N panel members in parallel, followed by a synthesizer. Provider-family spread between
 * seats is declared as a soft preference (`preferIndependentOf`); bind() owns the choice.
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

/** Canonical semantic roles, shared by execution and its derived read model. */
export function resolvePanelRoles(cfg = {}, { members = 3 } = {}, params = {}) {
  const memberCount = params?.members ?? members ?? cfg?.patterns?.panel?.members ?? 3;
  const baseRole = params?.role || 'panelist';
  return {
    panelists: (Array.isArray(params?.role)
      ? params.role
      : Array.from({ length: memberCount }, (_, idx) => `${baseRole}-${idx + 1}`))
      .map((role) => ({ role, kind: 'panelist' })),
    synthesizer: { role: params?.synthesizeRole || 'synthesizer', kind: 'synthesizer' },
  };
}

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
  const { panelists, synthesizer } = resolvePanelRoles(cfg, { members }, params);
  const synthesizeRole = synthesizer.role;
  const prior = typeof history === 'function' ? history() : (Array.isArray(history) ? history : []);

  const allPanelistRoles = panelists.map(({ role }) => role);
  // Dispatch all panel members in PARALLEL
  const memberPromises = panelists.map(async ({ role, kind }) => {
    const existing = prior?.find((h) => h.role === role && h.outcome === 'pass');
    if (existing) {
      return existing;
    }

    // A different provider family per seat is a preference, not a rule: a panel may have more
    // seats than the pool has families. Seats are listed in priority order (the first listed
    // is bound first); bind() alone decides which family each seat gets and never refuses a
    // seat for sharing one.
    return await runRole({
      role,
      unit: roleUnit(unit, { role, kind, params }),
      readOnly: true,
      preferIndependentOf: allPanelistRoles.filter((r) => r !== role),
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
  const existingSynth = prior?.find((h) => h.role === synthesizeRole && h.outcome === 'pass');
  const synthResult = existingSynth || await runRole({
    role: synthesizeRole,
    // The panelists answer the unit's objective; the synthesizer is told to synthesize their answers.
    unit: roleUnit(unit, { ...synthesizer, params }),
    readOnly: (unit?.writes || []).length === 0,
    // The synthesizer judges every panelist, so it prefers a provider family none of them used;
    // the runner turns these role names into the executors that played them and bind() ranks
    // provider families, falling back to the least used one instead of refusing.
    preferIndependentOf: allPanelistRoles,
    inputs: memberResults,
  });

  return {
    outcome: synthResult.outcome,
    results: [...memberResults, synthResult],
  };
}
