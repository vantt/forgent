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
 * Wait budget (tsk-2rf D1/D2, reopening a scoped part of tsk-6c2's own
 * non-goal -- `docs/history/main-checkout-lock-wait-decouple-ttl-snapshot/
 * CONTEXT.md`): omitting `waitMs` keeps the original default-ON behavior
 * unchanged (`docs/history/fgos-wait-retry-main-checkout-lock/CONTEXT.md`
 * D3) -- the budget is `remainingTtlMs` off the first thrown error. An
 * *explicit* `waitMs` is now the true wall-clock ceiling instead, no
 * longer capped by `remainingTtlMs` -- against a genuinely active,
 * continuously self-refreshing holder (self-recognition,
 * `main-checkout-lock.mjs`'s D6), a fresh `remainingTtlMs` reading never
 * meaningfully decreases, so only an explicit ceiling independent of that
 * snapshot can ever outlast it. The CLI layer (`parseWaitFlags`,
 * `bin/fgos.mjs`) caps how large an explicit `waitMs` can be.
 */
export async function withLockRetry(fn, { waitMs } = {}) {
  const start = Date.now();
  let budgetMs;
  let originalRemainingTtlMs;
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (err?.code !== 'lock-held') throw err;
      if (budgetMs === undefined) {
        originalRemainingTtlMs = typeof err.remainingTtlMs === 'number' ? err.remainingTtlMs : 0;
        budgetMs = waitMs === undefined ? originalRemainingTtlMs : waitMs;
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
      // tsk-2rf D4: once elapsed passes the point today's un-decoupled
      // behavior would already have given up (the original remainingTtlMs
      // snapshot), an extended wait needs its own feedback so it never
      // looks like a silent hang. Gated on delayMs > 0 -- the exhaustion
      // check above already bounds how close to budgetMs this gets, but
      // the tail end of that window still produces near-zero delays on
      // every loop iteration; printing on each of those would spam far
      // more often than an actual backoff tick, not less.
      if (delayMs > 0 && elapsedMs >= originalRemainingTtlMs) {
        process.stderr.write(
          `still waiting on main-checkout lock (holder pid ${err.holderPid}, ${Math.round(elapsedMs / 1000)}s elapsed)\n`,
        );
      }
      await sleep(delayMs);
      attempt += 1;
    }
  }
}
