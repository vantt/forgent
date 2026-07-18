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

/** Default number of consecutive goal-check misses (for one item) before
 * the circuit breaker trips. Provisional, same caveat as MAX_VISITS. Inert
 * under shipped defaults: dispatchClaimedItem (loop.mjs) parks an item
 * after at most DEFAULT_MAX_RETRIES (2) retries, so a single item's own
 * streak never reaches this threshold on its own. The breaker only trips
 * when a caller passes an explicit lower `breakerThreshold` to
 * `createMissBreaker` (see its doc comment below) — that path already
 * exists today. */
export const BREAKER_MISSES = 3;

/**
 * Count how many times work item `id` has entered `doing` across `events`.
 *
 * Derived from the log's existing `work.move` shape (per key_links: no new
 * event type) — a visit is any event with `type === 'work.move'` and
 * `payload.to === 'doing'` for this id. Lifetime, agent-agnostic count: a
 * human's manual re-dispatch counts exactly like the runner's. This is the
 * shipped metric (loop.mjs's `visits`/`priorVisits` payload fields, fgos.mjs's
 * `priorVisits`) — untouched by human-rounds D1, which reset the runner's own
 * anti-loop GATE only (see `visitsSinceLastHumanEvent` below), never this
 * lifetime tally.
 *
 * SUPERSEDES the comment this replaced ("there is no privileged writer whose
 * visits don't count"): that was true only because `actor` did not exist yet
 * when it was written. `actor` is now stamped on every `work.move` event
 * (store.mjs), and human-rounds D1 gives a human's actor-attributed events
 * gate-resetting weight the runner's own never gets — this function still
 * treats every writer identically because it is the lifetime metric, not the
 * gate; the gate's asymmetry lives entirely in `visitsSinceLastHumanEvent`.
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
 * Count how many times work item `id` has re-entered `doing` SINCE its own
 * last human-attributed event (human-rounds D1) — the anti-loop GATE's own
 * budget, distinct from `visitCount`'s lifetime tally above.
 *
 * Per-item (D1b): only events carrying this exact `id` mark or count.
 *
 * Trigger-set is CLOSED (D1c) and keyed on `actor === 'human'` plus payload
 * shape — never on a `from` field:
 *   - `payload.answer !== undefined` — the item left `awaiting-human` via a
 *     human's answer (`answerAwaiting`, fsm.mjs's `awaiting-human -> todo`
 *     edge; the only edge `answer` appears on).
 *   - `payload.reason !== undefined` — a human's reject/park-with-reason
 *     (fsm.mjs's `proposed -> todo`/`proposed -> blocked` edges; the runner's
 *     own reason-carrying parks, e.g. `anti-loop-max-visits`/`breaker-tripped`,
 *     stamp `actor: 'runner'` and so never match here).
 * A bare resume (`blocked -> todo` with no reason) and a human `take`
 * (`blocked -> doing`, `actor: 'human'`, no answer/reason) are deliberately
 * NOT triggers — per D1c only the two closed shapes above reset the budget.
 *
 * No qualifying event found for this id → the budget is the item's whole
 * history, i.e. identical to `visitCount(events, id)` (a pure machine loop
 * still dies at the cap — no human event has ever intervened).
 */
export function visitsSinceLastHumanEvent(events, id) {
  if (!Array.isArray(events) || typeof id !== 'string' || !id) return 0;
  let lastHumanIndex = -1;
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    if (
      event &&
      event.type === 'work.move' &&
      event.payload &&
      event.payload.id === id &&
      event.payload.actor === 'human' &&
      (event.payload.answer !== undefined || event.payload.reason !== undefined)
    ) {
      lastHumanIndex = i;
    }
  }
  let count = 0;
  for (let i = lastHumanIndex + 1; i < events.length; i += 1) {
    const event = events[i];
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
 * Sentinel key `createMissBreaker`'s returned methods key on when the caller
 * passes no item id — this is what keeps the backward-compatible
 * `consecutiveMisses` getter and zero-arg `recordMiss()`/`recordHit()`/
 * `isTripped()` calls (loop.mjs's current call sites) working unchanged. A
 * `Symbol` rather than a string so it can never collide with a real item id.
 */
const DEFAULT_ITEM_KEY = Symbol('anti-loop.default-item');

/**
 * Create a fresh consecutive-miss circuit breaker.
 *
 * **Per-item (fan-out-parallel D15):** under Epic 3's batch dispatch,
 * multiple different items run concurrently, so one counter shared across
 * an entire runner run would wrongly conflate item A's goal-check miss with
 * item B's, tripping the breaker on unrelated failures across different
 * items. The breaker is keyed by item id (`Map<id, consecutiveCount>`): an
 * id never explicitly seen before starts at 0/untripped, and two different
 * ids never share or influence each other's streak. `recordMiss(itemId)`
 * increments that item's own streak, `recordHit(itemId)` resets it to 0,
 * and `isTripped(itemId)` reports that item's own trip state at `threshold`.
 *
 * The item id argument is optional and defaults to an internal sentinel key
 * (see `DEFAULT_ITEM_KEY`) — this keeps loop.mjs's existing zero-arg calls
 * (`breaker.recordMiss()`, etc., still one-item-at-a-time as of this cell)
 * behaved exactly as before per-item keying was introduced. The
 * `consecutiveMisses` property stays a plain getter (a getter cannot take
 * an argument) and reads the same sentinel key; `consecutiveMissesFor(id)`
 * is the new method for reading any specific item's streak.
 *
 * Per the reliability-panel revision (D2 note "d"): this counter is
 * deliberately NOT event-derived. It is in-memory state scoped to one
 * runner run (matches A1's sequential-once-per-run shape, e.g. a `--once`
 * invocation) — cross-run persistence of consecutive-miss state is out of
 * scope for Phase 2.
 *
 * Because this state exists only in the closure below, replaying or reading
 * the event log never affects it — an unrelated event (e.g. a human writing
 * a `decision`, or another item's `work.move`) that the caller does not
 * report through `recordMiss()`/`recordHit()` leaves the streak untouched.
 *
 * **Inert under shipped defaults (phase2-p1-breaker-inert-fix):** with
 * `threshold` at its default (`BREAKER_MISSES` = 3), the breaker can never
 * trip from a single item's own retries — `dispatchClaimedItem` (loop.mjs)
 * parks an item after at most `DEFAULT_MAX_RETRIES` (2) failed attempts,
 * one short of tripping. The breaker only becomes reachable when a caller
 * passes an explicit lower `threshold` (e.g. `breakerThreshold: 1`, already
 * exercised by an existing test) — production callers do not do this today,
 * so the halt branch this feeds (`loop.mjs`'s `if (tripped)`) is currently
 * dead under default configuration, not broken.
 */
export function createMissBreaker(threshold = BREAKER_MISSES) {
  const streaks = new Map();
  return {
    recordMiss(itemId = DEFAULT_ITEM_KEY) {
      const next = (streaks.get(itemId) || 0) + 1;
      streaks.set(itemId, next);
      return next;
    },
    recordHit(itemId = DEFAULT_ITEM_KEY) {
      streaks.set(itemId, 0);
      return 0;
    },
    isTripped(itemId = DEFAULT_ITEM_KEY) {
      return (streaks.get(itemId) || 0) >= threshold;
    },
    consecutiveMissesFor(itemId) {
      return streaks.get(itemId) || 0;
    },
    get consecutiveMisses() {
      return streaks.get(DEFAULT_ITEM_KEY) || 0;
    },
  };
}
