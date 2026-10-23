// src/runner/execution/seat-ledger.mjs — which executors filled which seat in one unit run, and the order
// seats are bound in.
// Architecture guard: pure bookkeeping, no I/O.

/**
 * Executors bound to each seat in a unit run. `independentOf` names seats ('producer'); bind() compares
 * provider families, so a seat id has to be turned into the executor(s) that filled it before it can
 * exclude anything. A seat not bound yet stays an id and excludes nothing.
 *
 * `seats` is the same lookup for a soft preference: it keeps the id next to each executor
 * ({ seat, executor }) so bind() can say which seats ended up sharing a provider family.
 *
 * Seats bind in the order the pattern lists them. `serialize` queues the ledger read, the bind and the
 * publish of one seat behind those of the seats listed before it, so a seat only ever sees the seats
 * before it (plus any a resumed run already recorded) however long a bind takes; the listed order is the
 * pick priority. `batch` holds the launch of a group of seats until every seat of the group is bound.
 *
 * Shared by the real runner and the read-only binding simulation, so both resolve a seat id to its
 * executors the same way.
 */
export function createSeatLedger() {
  const executorsBySeat = new Map();
  // Which seats must differ from a seat (those that listed it in `independentOf`): independence is symmetric,
  // so a seat that binds again (a rebind after a lease conflict, a later round) is held to the seats that
  // depend on it as well.
  const dependentsBySeat = new Map();
  let tail = Promise.resolve();
  return {
    noteDependence(seat, independentOfIds) {
      for (const id of independentOfIds ?? []) {
        if (!dependentsBySeat.has(id)) dependentsBySeat.set(id, new Set());
        dependentsBySeat.get(id).add(seat);
      }
    },
    /** The executors of every seat bound earlier that must differ from `seat`. */
    dependentExecutors(seat) {
      return [...(dependentsBySeat.get(seat) ?? [])].flatMap((dependent) => [...(executorsBySeat.get(dependent) ?? [])]);
    },
    note(seat, executorId) {
      if (!executorId) return;
      if (!executorsBySeat.has(seat)) executorsBySeat.set(seat, new Set());
      executorsBySeat.get(seat).add(executorId);
    },
    seats(ids) {
      return (ids || []).flatMap((id) => [...(executorsBySeat.get(id) ?? [])].map((executor) => ({ seat: id, executor })));
    },
    resolve(ids) {
      return (ids || []).flatMap((id) => (executorsBySeat.has(id) ? [...executorsBySeat.get(id)] : [id]));
    },
    /** Run `step` after every step queued before it has settled; its result (or throw) is returned. */
    serialize(step) {
      const run = tail.then(step);
      tail = run.then(() => undefined, () => undefined);
      return run;
    },
  };
}

/**
 * A barrier for `size` seats started together: each seat calls `arrive()` once it is bound (or has
 * ended without binding) and `await barrier.bound` resolves when all have. A pattern creates one per
 * group it launches in parallel and hands it to every seat of the group. `size` is how many seats
 * the group has; the seats' panes are laid out as that many equal parts.
 *
 * @param {number} size
 */
export function createBindBarrier(size) {
  let pending = size;
  let release;
  const bound = size <= 0 ? Promise.resolve() : new Promise((resolve) => { release = resolve; });
  return {
    size,
    bound,
    arrive() {
      pending -= 1;
      if (pending === 0) release?.();
    },
  };
}
