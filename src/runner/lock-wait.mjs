// lock-wait.mjs — CLI-layer retry-with-backoff for main-checkout-lock
// contention (tsk-6c2). Wraps a whole claimWork/mergeRunnerItem call rather
// than touching either function: both throw their lock error before any
// state mutation, so retrying the entire call is equivalent to retrying
// just the lock acquire. Never touches main-checkout-lock.mjs/tryAcquireOnce.

const BACKOFF_SCHEDULE_MS = [500, 1000, 2000]; // 500ms -> 1s -> 2s, then holds at the 2s cap

// `remainingTtlMs` and this loop's own elapsed-time budget are both derived
// from the same underlying clock read (the lock's `ts`, `ttlMs`), so
// without slack the loop's give-up instant coincides almost exactly with
// the real moment the lock would naturally clear -- a razor-thin race
// against event-loop timer jitter, not something a bigger budget fixes
// (the two clocks stay in lockstep regardless of size). This grace gives
// the final retry attempt, which is what actually reclaims the lock via
// `acquireMainCheckoutLock`'s own existing staleness check, room to land
// just past that boundary instead of racing it.
const BOUNDARY_GRACE_MS = 250;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls `fn()`; on a thrown error with `code: 'lock-held'`, retries with
 * backoff until either `fn()` succeeds or the wait budget is spent, then
 * rethrows the last `lock-held` error unchanged. Any other error (including
 * `lock-ambiguous`) rethrows immediately on the first attempt -- never
 * retried.
 *
 * Wait budget: `min(remainingTtlMs off the first thrown error, waitMs)`,
 * or just `remainingTtlMs` when `waitMs` is omitted (default-ON per D3,
 * `docs/history/fgos-wait-retry-main-checkout-lock/CONTEXT.md`).
 */
export async function withLockRetry(fn, { waitMs } = {}) {
  const start = Date.now();
  let budgetMs;
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (err?.code !== 'lock-held') throw err;
      if (budgetMs === undefined) {
        const remainingTtlMs = typeof err.remainingTtlMs === 'number' ? err.remainingTtlMs : 0;
        budgetMs = waitMs === undefined ? remainingTtlMs : Math.min(remainingTtlMs, waitMs);
      }
      const elapsedMs = Date.now() - start;
      if (elapsedMs >= budgetMs + BOUNDARY_GRACE_MS) {
        // Only distinguish the message once a real wait actually happened
        // (attempt > 0) -- a budget that was already spent on the very
        // first check (e.g. remainingTtlMs ~0) never slept at all, so it
        // must read exactly like today's immediate-fail, unchanged.
        if (attempt > 0) err.message += ` -- waited ${elapsedMs}ms before giving up`;
        throw err;
      }
      const delayMs = Math.min(BACKOFF_SCHEDULE_MS[Math.min(attempt, BACKOFF_SCHEDULE_MS.length - 1)], budgetMs - elapsedMs);
      await sleep(delayMs);
      attempt += 1;
    }
  }
}
