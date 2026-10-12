// src/runner/execution/role-ledger.mjs — which executors played which role in one unit run
// Architecture guard: pure bookkeeping, no I/O.

/**
 * Executors bound to each role in a unit run. `independentOf` names roles ('producer');
 * bind() compares provider families, so a role name has to be turned into the executor(s)
 * that played it before it can exclude anything. A role not bound yet stays a role name and
 * excludes nothing.
 *
 * `seats` is the same lookup for a soft preference: it keeps the role next to each executor
 * ({ role, executor }) so bind() can say which seats ended up sharing a provider family.
 *
 * Seats are bound in the order the pattern lists them, and every bind() and its `note` run in
 * one synchronous stretch before the first await, so a seat only ever sees the seats listed
 * before it (plus any a resumed run already recorded): the listed order is the pick priority.
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
    seats(names) {
      return (names || []).flatMap((name) => [...(executorsByRole.get(name) ?? [])].map((executor) => ({ role: name, executor })));
    },
    resolve(names) {
      return (names || []).flatMap((name) => (executorsByRole.has(name) ? [...executorsByRole.get(name)] : [name]));
    },
  };
}
