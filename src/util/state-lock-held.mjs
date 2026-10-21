// src/util/state-lock-held.mjs -- whether this process holds a state lock right now.
//
// A host exec (session identity, Seat Binding) waits while a state lock is held, so a lock holder is never
// stalled behind a child process. Every state lock calls `noteLockHeld` when it takes the lock and
// `noteLockReleased` exactly once when it really releases it; the execs ask `stateLockHeld`. A leaf on
// purpose: modules that may not spawn processes can import it.

let heldLocks = 0;

/** Called right after a state lock is taken. */
export function noteLockHeld() {
  heldLocks += 1;
}

/** True while this process holds a state lock: a host exec must wait. */
export function stateLockHeld() {
  return heldLocks > 0;
}

/** Called exactly once when that lock is really released. */
export function noteLockReleased() {
  heldLocks = Math.max(0, heldLocks - 1);
}
