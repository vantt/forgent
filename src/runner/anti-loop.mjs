// anti-loop.mjs — the runner's anti-loop guard (per D2, agent's-discretion
// note in CONTEXT.md on counter placement): a visit counter derived from the
// event log, plus an in-memory circuit breaker for consecutive goal-check
// misses.
//
// PURE: no fs import, no child_process import. `visitCount` takes an already
// -read array of events (as returned by `readEvents`/`foldEvents` upstream)
// — it never opens `.fgos/events.jsonl` itself. `createMissBreaker`'s state
// lives only in the closure returned to the caller; nothing here touches
// disk or a process.

/** Default max times a single item may be re-dispatched (re-enter `doing`)
 * before the runner refuses to pick it up again. Provisional — tuning is
 * deferred to real operation, per the cell's own note. */
export const MAX_VISITS = 3;

/** Default number of consecutive goal-check misses (across any items, in
 * one runner run) before the circuit breaker trips. Provisional, same
 * caveat as MAX_VISITS. */
export const BREAKER_MISSES = 3;

/**
 * Count how many times work item `id` has entered `doing` across `events`.
 *
 * Derived from the log's existing `work.move` shape (per key_links: no new
 * event type) — a visit is any event with `type === 'work.move'` and
 * `payload.to === 'doing'` for this id. This is deliberately agent-agnostic:
 * the current event shape carries no "who wrote this" field, and the
 * semantic is explicit (per the cell's action text) that a human's manual
 * re-dispatch counts as a visit exactly the same as the runner's — there is
 * no privileged writer whose visits don't count.
 */
export function visitCount(events, id) {
  if (!Array.isArray(events) || typeof id !== 'string' || !id) return 0;
  let count = 0;
  for (const event of events) {
    if (event && event.type === 'work.move' && event.payload && event.payload.to === 'doing' && event.payload.id === id) {
      count += 1;
    }
  }
  return count;
}

/**
 * Has `count` (as returned by `visitCount`) reached or passed the max-visits
 * threshold? At-threshold and past-threshold both block re-dispatch — only
 * strictly-below is still allowed to run again.
 */
export function hasExceededMaxVisits(count, max = MAX_VISITS) {
  return count >= max;
}

/**
 * Create a fresh consecutive-miss circuit breaker.
 *
 * Per the reliability-panel revision (D2 note "d"): this counter is
 * deliberately NOT event-derived. It is in-memory state scoped to one
 * runner run (matches A1's sequential-once-per-run shape, e.g. a `--once`
 * invocation) — cross-run persistence of consecutive-miss state is out of
 * scope for Phase 2. The runner calls `recordMiss()` after a goal-check miss
 * and `recordHit()` after a goal-check pass (which resets the streak);
 * `isTripped()` reports whether the breaker has crossed `threshold`.
 *
 * Because this state exists only in the closure below, replaying or reading
 * the event log never affects it — an unrelated event (e.g. a human writing
 * a `decision`, or another item's `work.move`) that the caller does not
 * report through `recordMiss()`/`recordHit()` leaves the streak untouched.
 */
export function createMissBreaker(threshold = BREAKER_MISSES) {
  let consecutive = 0;
  return {
    recordMiss() {
      consecutive += 1;
      return consecutive;
    },
    recordHit() {
      consecutive = 0;
      return consecutive;
    },
    isTripped() {
      return consecutive >= threshold;
    },
    get consecutiveMisses() {
      return consecutive;
    },
  };
}
