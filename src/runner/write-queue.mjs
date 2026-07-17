// write-queue.mjs — a sequential async write-queue primitive (D16).
//
// Trap this exists to close: Node's single-threaded execution model does NOT
// serialize concurrent async work for free. Every `await` yields the event
// loop mid-transaction, so two concurrent callers each running a
// read -> append -> rebuild style transaction can interleave their steps
// (caller A's "mid" step running between caller B's "enter" and "exit").
// That interleaving is exactly what breaks a single-writer guarantee once
// the writer is invoked from concurrent async call sites (fan-out's N
// parallel workers, D12's "one write-door"). A queue makes the ordering
// explicit instead of assuming "same thread" implies "one at a time".
//
// PURE: no fs import, no child_process import, no store/event-log import of
// any kind. This module knows nothing about `.fgos/`, events, or work
// items — it is a generic FIFO serialization primitive over async
// functions. Any caller (the event-log writer, a future service transport
// per D12/P27) supplies its own transaction bodies; this module only
// guarantees submission order and non-interleaving of the bodies it is
// given. Wiring this into `loop.mjs`/`merge.mjs`/`goal-check.mjs`/
// `dispatch.mjs` is out of scope for this module (Epic 3).
//
// Shape: a tail-chained promise queue. Each `enqueue(fn)` call appends `fn`
// to a running promise chain (`tail`) and returns a promise that settles
// with `fn`'s own outcome. Because each link in the chain awaits the
// previous link before invoking the next `fn`, a later-queued transaction's
// body never starts until the earlier one has fully settled (resolved OR
// rejected) — a throwing/rejecting transaction is caught internally so it
// can never break the chain for transactions queued after it.

/**
 * Create a fresh sequential write-queue.
 *
 * @returns {{enqueue: (fn: () => Promise<any>) => Promise<any>, size: () => number}}
 *   `enqueue(fn)` submits an async transaction `fn` (a zero-arg function
 *   returning a promise, or any value) and returns a promise that resolves
 *   or rejects with exactly `fn`'s own outcome, once `fn` has run to
 *   completion in FIFO submission order relative to every other transaction
 *   submitted to this same queue. `size()` reports the number of
 *   transactions currently queued or running (not yet settled) — a
 *   diagnostic accessor, not part of the ordering guarantee.
 */
export function createWriteQueue() {
  let tail = Promise.resolve();
  let pending = 0;

  function enqueue(fn) {
    pending += 1;
    // Chain onto `tail` regardless of whether the previous link resolved or
    // rejected (`tail.then(runNext, runNext)`) so one caller's failure can
    // never stall or corrupt the queue for callers queued after it — each
    // transaction still gets its own fully-awaited turn.
    const runNext = () => fn();
    const settled = tail.then(runNext, runNext);
    // `tail` itself must never reject (a rejection on `tail` would abort
    // every subsequent `.then` in the chain) — swallow the outcome here and
    // let `settled` (returned to this caller) carry the real result.
    tail = settled.then(
      () => {},
      () => {},
    );
    // Track completion with a `.then(onFulfilled, onRejected)` pair rather
    // than `.finally()`: `.finally()`'s returned promise re-throws the
    // original rejection, and leaving that returned promise unattached
    // would surface as a spurious `unhandledRejection` even though the
    // caller already has (and can reject) `settled` itself.
    settled.then(
      () => {
        pending -= 1;
      },
      () => {
        pending -= 1;
      },
    );
    return settled;
  }

  function size() {
    return pending;
  }

  return { enqueue, size };
}
