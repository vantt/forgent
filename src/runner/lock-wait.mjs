// lock-wait.mjs — CLI-layer wait for repo-lock contention. The kernel locks
// behind repo-locks.mjs wait for real (`acquire({ waitMs })` polls until the
// holder releases or the budget is spent), so there is no retry loop, no
// backoff and no guess at when a holder will be done: this module only
// decides how long the acquire may wait and hands that to the call.

/** Wait budget when the caller gave no `--wait <ms>`: waiting is the default,
 * `--no-wait` is the opt-out. Other holders keep these locks for short git
 * operations or one verify run, so a minute covers the usual contention
 * without hanging a CLI call against a holder that never lets go. */
export const DEFAULT_LOCK_WAIT_MS = 60 * 1000;

/**
 * withLockRetry(fn, { waitMs }) — calls `fn({ waitMs })`. `fn` passes that
 * `waitMs` to the lock door it takes (`withMergeTargetSlot`, `withMainCheckout`,
 * ...), whose acquire waits up to that long and then throws `lock-held`
 * naming the lock and the pids the kernel shows holding it. An explicit
 * `waitMs` is the true wall-clock ceiling; omitted, it is
 * `DEFAULT_LOCK_WAIT_MS`. A `--no-wait` caller does not come through here: it
 * calls `fn()` itself, and the single try fails at once with the same name.
 */
export async function withLockRetry(fn, { waitMs } = {}) {
  return fn({ waitMs: waitMs ?? DEFAULT_LOCK_WAIT_MS });
}
