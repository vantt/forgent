// lock-wait.mjs — CLI-layer retry-with-backoff for main-checkout-lock
// contention (tsk-6c2). Wraps a whole claimWork/mergeRunnerItem call rather
// than touching either function: both throw their lock error before any
// state mutation, so retrying the entire call is equivalent to retrying
// just the lock acquire. Never touches main-checkout-lock.mjs/tryAcquireOnce.

import { resolveWriterIdentity } from '../util/session-identity.mjs';
import { formatLockDurationMs } from './main-checkout-lock.mjs';

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
      const scheduleDelayMs = BACKOFF_SCHEDULE_MS[Math.min(attempt, BACKOFF_SCHEDULE_MS.length - 1)];
      const remainingBudgetMs = budgetMs - elapsedMs;
      // tsk-mgb: once the backoff schedule's own budget is spent but we're
      // still inside BOUNDARY_GRACE_MS (the exhaustion check above hasn't
      // fired yet), sleep out exactly what's left of that grace window
      // instead of the schedule-derived value, which goes negative here.
      // `setTimeout` clamps a negative delay to ~0-1ms (Node's own
      // TimeoutNegativeWarning), turning every subsequent loop iteration
      // into a near-instant full retry attempt -- measured at 233 calls
      // for a 3-second wait before this fix. This guarantees exactly one
      // more bounded sleep before the exhaustion check's next pass.
      const delayMs = remainingBudgetMs > 0
        ? Math.min(scheduleDelayMs, remainingBudgetMs)
        : Math.max(0, budgetMs + BOUNDARY_GRACE_MS - elapsedMs);
      // tsk-mgb: printed on every real sleep. Previously gated on ALSO
      // `elapsedMs >= originalRemainingTtlMs` (tsk-2rf D4's own "extended
      // wait past the default TTL needs its own feedback" intent) -- but
      // on the default (no explicit waitMs) path, budgetMs IS
      // originalRemainingTtlMs, so that condition and `delayMs > 0` were
      // mutually exclusive by construction: delayMs > 0 requires elapsedMs
      // < budgetMs, while the other conjunct requires elapsedMs >=
      // budgetMs. Never both true -- the progress line never printed at
      // all on the one path (no --wait) most likely to need it.
      if (delayMs > 0) {
        let qualifier = '';
        if (typeof err.holderPid === 'number') {
          qualifier = err.holderPid === process.pid
            ? ' -- likely your own session\'s other in-flight call'
            : ' -- a different pid/session';
        } else if (typeof err.holderPid === 'string') {
          const selfId = resolveWriterIdentity().id;
          qualifier = err.holderPid === selfId
            ? ' -- likely your own session\'s other in-flight call'
            : ' -- a different pid/session';
        }
        const agePart = typeof err.lockAgeMs === 'number' ? `, lock age ${formatLockDurationMs(err.lockAgeMs)}` : '';
        const ttlPart = typeof err.remainingTtlMs === 'number' && err.remainingTtlMs > 0
          ? `, remaining TTL ${formatLockDurationMs(err.remainingTtlMs)}`
          : '';
        const staleHint = err.remainingTtlMs === 0 ? ' -- TTL EXPIRED, may be stale: consider fgos-unlock' : '';
        process.stderr.write(
          `still waiting on main-checkout lock (holder pid ${err.holderPid}, ${Math.round(elapsedMs / 1000)}s elapsed${agePart}${ttlPart})${qualifier}${staleHint}\n`,
        );
      }
      await sleep(delayMs);
      attempt += 1;
    }
  }
}
