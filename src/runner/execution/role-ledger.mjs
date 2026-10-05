// src/runner/execution/role-ledger.mjs — which executors played which role in one unit run
// Architecture guard: pure bookkeeping, no I/O.

/**
 * Executors bound to each role in a unit run. `independentOf` names roles ('producer');
 * bind() compares provider families, so a role name has to be turned into the executor(s)
 * that played it before it can exclude anything. A role not bound yet stays a role name and
 * excludes nothing.
 *
 * Shared by the real runner and the read-only binding simulation, so both resolve a role
 * name to its executors the same way.
 */
export function createRoleExecutorLedger() {
  const executorsByRole = new Map();
  return {
    note(role, executorId) {
      if (!executorId) return;
      if (!executorsByRole.has(role)) executorsByRole.set(role, new Set());
      executorsByRole.get(role).add(executorId);
    },
    resolve(names) {
      return (names || []).flatMap((name) => (executorsByRole.has(name) ? [...executorsByRole.get(name)] : [name]));
    },
  };
}
