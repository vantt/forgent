// src/runner/execution/dry-bind.mjs — read-only simulation of how a unit's pattern would bind its roles
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/**. Calls no model,
// starts no process and writes nothing: it drives the SAME pattern code the runner drives, with a
// role runner that only calls bind().

import { bind } from './bind.mjs';
import { runPattern } from './patterns/index.mjs';
import { createRoleExecutorLedger } from './role-ledger.mjs';

/**
 * Bind every role a unit's pattern would dispatch, in the order the pattern dispatches them,
 * without running any of them. A role that binds is recorded in the ledger so a later role's
 * `independentOf` excludes its provider family, exactly as in a real run.
 *
 * @param {object} unit Unit contract subset: { id, capability, rigor?, writes?, pattern? }.
 * @param {object} runnerConfig Runner config (capabilities, executors, patterns, ...).
 * @param {object} [options]
 * @param {object} [options.session] bind() session context. Defaults to a headless session.
 * @returns {Promise<{ outcome: string, roles: Array<{ role: string, executor?: string, invocation?: string|null, refused?: { reason: string, detail: string } }> }>}
 */
export async function simulateUnitBindings(unit, runnerConfig, { session = {} } = {}) {
  const ledger = createRoleExecutorLedger();
  const roles = [];
  const runRole = async ({ role, unit: roleUnit, readOnly = false, independentOf = [] }) => {
    const bound = bind(
      { unit: roleUnit || unit, role, readOnly, independentOf: ledger.resolve(independentOf), overrides: [] },
      { runnerConfig, session: { headless: true, ...session } },
    );
    if (bound.refused) {
      roles.push({ role, refused: bound.refused });
      return { outcome: 'policy-refusal', role, refused: bound.refused };
    }
    ledger.note(role, bound.executor);
    roles.push({ role, executor: bound.executor, invocation: bound.invocation });
    return { outcome: 'pass', role };
  };
  const result = await runPattern(unit.pattern || 'solo', unit, runnerConfig, { runRole });
  return { outcome: result.outcome, roles };
}
