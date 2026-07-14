// recovery.mjs — the runner's recovery matrix (per D2/D3, reliability panel
// revision on phase-2-routing-6): a machine-readable table mapping each
// declared error class to an action, plus the resolver functions the runner
// calls at dispatch/reconciliation time.
//
// PURE: no fs import, no child_process import, no spawn of any kind. This
// module only classifies and decides — the runner (cell phase-2-routing-8)
// owns every side effect (spawning workers, inspecting worktrees/branches,
// writing through `fgos`). That split is what makes the guard-rail itself
// testable without a real dispatch loop (per D2's "đồ bảo hộ phải có máy để
// bảo vệ" — the recovery matrix earns its test coverage here, in isolation).

/**
 * The full declared error-class domain (reliability-panel revision adds
 * `stale-doing` and `state-conflict` on top of the original six):
 *   - worker-spawn-fail  — the executor process could not be started.
 *   - worker-timeout     — the executor ran past its time budget.
 *   - verify-miss        — the runner's own goal-check (item.verify) failed
 *                          after the worker returned; the worker's report is
 *                          never trusted on its own (per D3).
 *   - worktree-fail      — isolated branch/worktree setup or teardown failed.
 *   - corrupt-log        — the event log failed to parse (readEvents threw
 *                          EventLogError('corrupt-log')); never auto-repaired.
 *   - reject-returned    — the item bounced proposed -> todo with a reason
 *                          (D5 rejection edge); re-entering the frontier is
 *                          bounded by anti-loop's MAX_VISITS, not by this
 *                          module's retry count alone.
 *   - stale-doing        — the runner crashed mid-run and this item was left
 *                          sitting in `doing` with no live worker attached to
 *                          it. Resolution needs branch-state facts the
 *                          runner already knows (has a commit, did that
 *                          commit's verify pass) — see `resolveStaleDoing`.
 *   - state-conflict     — a CAS conflict on the RUNNER'S OWN write (i.e. the
 *                          runner raced someone else's write to the same
 *                          item). The runner never fights a human for a
 *                          write — always halts.
 */
export const ERROR_CLASSES = Object.freeze([
  'worker-spawn-fail',
  'worker-timeout',
  'verify-miss',
  'worktree-fail',
  'corrupt-log',
  'reject-returned',
  'stale-doing',
  'state-conflict',
]);

/**
 * The coarse action domain a caller acts on. `retry` = try the same item
 * again; `park` = stop auto-retrying this one item but keep the runner loop
 * alive (the item stays visible — e.g. `blocked`, or left for a human); halt
 * = stop the whole runner loop, never retried automatically.
 */
export const ACTIONS = Object.freeze(['retry', 'park', 'halt']);

/** Default max retries per claim before an otherwise-retryable class parks
 * instead (provisional — tuning happens after real operation, per the
 * cell's own note on MAX_VISITS/BREAKER_MISSES). */
export const DEFAULT_MAX_RETRIES = 2;

/**
 * The recovery matrix itself: errorClass -> { action, maxRetries? }.
 * `maxRetries` is present only for `action: 'retry'` entries — halt/park
 * entries are unconditional regardless of attempt count.
 *
 * `stale-doing` classifies to `park` at this coarse level: parking here
 * means "do not blindly re-dispatch a fresh attempt" — the concrete
 * transition (complete vs. reclaim-blocked) is a branch-state question
 * answered by `resolveStaleDoing`, not by attempt counting. Classifying it
 * to `park` (rather than leaving it out of the table) is exactly what keeps
 * a stuck `doing` item from ever being invisible to the recovery matrix.
 */
export const RECOVERY = Object.freeze({
  'worker-spawn-fail': Object.freeze({ action: 'retry', maxRetries: DEFAULT_MAX_RETRIES }),
  'worker-timeout': Object.freeze({ action: 'retry', maxRetries: DEFAULT_MAX_RETRIES }),
  'verify-miss': Object.freeze({ action: 'retry', maxRetries: DEFAULT_MAX_RETRIES }),
  'worktree-fail': Object.freeze({ action: 'retry', maxRetries: DEFAULT_MAX_RETRIES }),
  'corrupt-log': Object.freeze({ action: 'halt' }),
  'reject-returned': Object.freeze({ action: 'retry', maxRetries: DEFAULT_MAX_RETRIES }),
  'stale-doing': Object.freeze({ action: 'park' }),
  'state-conflict': Object.freeze({ action: 'halt' }),
});

/**
 * Decide what the runner should do about one failed attempt at `errorClass`.
 *
 * `attempt` is the number of attempts already made for this error class
 * within the current claim (1-based — call `resolveAction(cls, 1)` right
 * after the first failure to decide whether a second attempt should run).
 * For a `retry` class, `attempt < maxRetries` keeps retrying; reaching or
 * exceeding `maxRetries` parks the item instead (never halts the whole
 * runner for an ordinary retryable failure).
 *
 * An error class absent from `RECOVERY` — i.e. not one of the eight declared
 * classes — is fail-safe: it halts. It is never defaulted to `retry`, which
 * would risk looping on a failure mode this matrix does not understand.
 */
export function resolveAction(errorClass, attempt = 1) {
  const entry = RECOVERY[errorClass];
  if (!entry) {
    return { action: 'halt', errorClass, reason: 'unknown-error-class' };
  }
  if (entry.action !== 'retry') {
    return { action: entry.action, errorClass };
  }
  if (attempt < entry.maxRetries) {
    return { action: 'retry', errorClass, attempt };
  }
  return { action: 'park', errorClass, attempt, reason: 'max-retries-exceeded' };
}

/**
 * Resolve a `stale-doing` item (found sitting in `doing` at loop start with
 * no live worker attached) into the concrete FSM transition the runner
 * should make, per the reliability-panel revision: a branch with a commit
 * whose verify passed completes the work (`doing -> proposed`, same as an
 * ordinary goal-check pass); anything short of that reclaims the item
 * (`doing -> blocked`, reason `runner-crash-reclaim`) rather than silently
 * leaving it stuck or guessing that it is still safe to re-dispatch.
 *
 * Pure function of the two branch-state facts the runner already gathered
 * (has a commit, did verify pass on it) — calling it twice with the same
 * facts always returns the same transition, which is what makes the
 * reconciliation idempotent (the cell's "window-3" idempotency note): a
 * runner that re-checks the same stale item on a later pass makes the same
 * decision, not a different one.
 */
export function resolveStaleDoing({ hasCommit = false, verifyPassed = false } = {}) {
  if (hasCommit && verifyPassed) {
    return { to: 'proposed' };
  }
  return { to: 'blocked', reason: 'runner-crash-reclaim' };
}
