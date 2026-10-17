# Review: holder-lock P10, dispatch cwd + reconcile cutover (uncommitted, base 13f0933e3)

Verdict: no High findings. The cutover is correct and the lock is released on every path. Open items are one error-quality regression, docs/CHANGELOG not yet updated, and a few stale comments.

## Verified (evidence)
- Narrow tests run, all green: registry-contract (12), fences-v1-tombstone (6), reconcile import-graph (25), main-checkout-lock (87), assignment-cwd-mutex-concurrency (2), dispatch-reconciliation (18), dispatch-reconcile-operation (6). Name-filtered cwd/SIGKILL/in-flight cases in dispatch.test, run.test, run-herdr.test, cli/dispatch-reconcile and reconciliation-concurrency also pass.
- Probe script (own temp dir): symlinked cwd, trailing slash and relative cwd all map to one `dispatch-cwd--<dev>-<ino>.lock`. The second acquire throws `dispatch-in-flight` naming the holder pid. After release, `dispatchCwdHolder` returns null.
- Release paths:
  - `cli.mjs`: acquire is the statement immediately before `try { ... } finally { cwdLock?.release() }`, so nothing can throw in between.
  - `assignment-runner.mjs`: acquire is the first statement inside the `try`, and the `finally` releases it.
  - Facade fd is opened by Node, so it is CLOEXEC and not inherited by workers.
- herdr-spawn no self-conflict: `executeAssignment` takes the lock only under `useSupervisorRecovery` (cli-spawn). The non-supervisor branch calls `executeExecutorCli`, which takes it once. Same gating as before.
- `sharedCwd` takes no lock (`cli.mjs`). The updated test proves a sharedCwd dispatch runs while the lock is held.
- Reconcile import-graph rule holds (test green). The EXPECTED_CLOSURE edit adds only `cwd-lock.mjs` and `dispatch-error.mjs`; the holder-lock facade files were already in the closure.
- Tests are real: they use a child process holding the kernel lock, SIGKILL, and a symlink; no mocks. Removed tests covered only v1 semantics (TTL composite, dead-pid composite reclaim, `dispatchLockFile` injectivity, corrupt lock, heartbeat). The "corrupt record is ambiguous" case has no v3 analogue because the kernel has no record to corrupt.
- Remaining v1 path in src: only `src/holder-lock/fences.mjs:134`, which is the intended tombstone-fence enumeration of old files. `scripts/` is clean. `dispatchLockFile`, `parseCompositePidIdentity` and `cwdLockHolder` have no references left.
- Main-checkout part of `main-checkout-lock.mjs` is untouched. The only changes are the dispatch removals plus comment trims, and `recordTtlMs`/`judgeRecord` now drop the composite branch.

## Medium

M1. Nonexistent cwd now fails with an opaque non-Dispatch error.
- Where: `src/runner/dispatch/cwd-lock.mjs:28-33`, `src/holder-lock/registry.mjs:43-48`.
- `cwdDevIno` returns undefined for ENOENT/ENOTDIR, so `acquireSync` throws `HolderLockError lock-path-param-missing: lock dispatch-cwd needs cwdDevIno ...`. I reproduced this.
- Before, a missing cwd was locked by name and failed later at spawn with a dispatch error.
- Scenario: a resume or dispatch against a worktree that was deleted. The operator sees an internal registry message. It is not a `DispatchError`, so `recovery.mjs` does not classify it (`dispatch-in-flight` maps to retry; this maps to nothing).
- Fix: in `acquireDispatchCwdLock`, check `fs.existsSync(cwd)` first and throw a `DispatchError` (e.g. `cwd-not-found`) with a clear message, or let the later spawn error surface. Add a test.

M2. Docs and CHANGELOG not updated; the repo rule (AGENTS.md "Install/setup/doctor gate") requires a CHANGELOG line, and the phase file lists one.
- `CHANGELOG.md` is unchanged. The phase's Changed/Fixed line is missing.
- `docs/specs/runner.md:21` still says clear-cwd-lock "removes a cwd dispatch lock after proving its holder's PID/start-time incarnation is dead".
- `docs/specs/runner.md:1113` (RUL86) still describes `.fgos/dispatch--<cwd>.lock`, composite holder and EPERM.
- `docs/specs/runner.md:1123` (RUL96) still describes the ttl, renewal and 4h ceiling of the dispatch lock.
- `docs/specs/runner.md:3350` still lists `dispatch--*` with ttlMs and composite 4h.
- Scenario: a future agent following the spec looks for a pid:ts:rand lock file, or expects `fgos dispatch reconcile` to clear a lock.
- This may be deferred to a later docs phase (not in this phase's file list). Please confirm; otherwise add the CHANGELOG line at least.

M3. Behaviour change worth recording: a wedged but alive dispatcher now blocks its cwd with no time bound.
- The old lock had a ttl capped at 4h (RUL96) and `fgos dispatch reconcile` could clear it. A kernel lock has no cap, and `clear-cwd-lock` now only reports `refused` when held (`reconciliation-planner.mjs:83-86`).
- The only way out is killing the pid, which the error message names. That matches the design and is acceptable for a single-user tool. Record it in the spec change and the report so the removal of the 4h bound is explicit.

## Low

L1. Stale comments and descriptions:
- `src/cli/command-registry.mjs:1220`: `--cwd` description says "the per-cwd dispatch lock clear-cwd-lock targets". It now only reports held/free.
- `src/runner/dispatch/config.mjs:1624-1625`: "a contender honours a dispatch lock's ttl only up to it". This is no longer true; the confinement reaper part remains true.
- `src/runner/dispatch/run-timeout.mjs:6-7`: "how long a hung worker can hold its worktree's dispatch lock". The lock now follows the process, not a ttl; the ceiling only bounds the private home and the kill.
- `bin/fgos.mjs:2660`: wording about "dispatch lock clear-cwd-lock targets".
- Reconcile `apply` of a `clear-cwd-lock` plan returns `plan-stale` with reason "cwd lock is held..." when a holder exists (`reconciliation-planner.mjs:346-347`). `plan-stale` is imprecise for held, but harmless since planning never returns `planned` for this action.

L2. Lock files accumulate: `<fgosDir>/locks/dispatch-cwd--<dev>-<ino>.lock` is never removed (0 bytes), one per cwd ever dispatched, including temp worktrees. An inode reused by a new directory shares the file, which is harmless. This is the same model as the other cutover locks, so I flag it only for the report.

L3. `src/runner/dispatch/cwd-lock.mjs:48`: `dispatchCwdHolder` may throw on realpath EACCES (only ENOENT/ENOTDIR are swallowed). A resume guard or reconcile plan on an unreadable path throws instead of reporting. Edge case.

L4. `test/helpers/hold-lock-in-child.mjs`: if the child exits or times out, the `assert.fail` paths skip `fs.rmSync` of the ready temp dir (a leak in /tmp, which the repo already hit once with inode exhaustion). Wrap in try/finally.

L5. Observation, not a defect: `createLockScope(LOCK_NAME)` is fresh per acquire, so the facade's rank check never sees other held locks. This matches the other cutovers in this wave (`recover.mjs`, `workflow/runner.mjs`) and the phase says the order stays as today.

## Callers checked
- `executeExecutorCli`, `executeAssignment`: the error type and code (`dispatch-in-flight`) are kept. Metadata changed: `lockAgeMs`/`remainingTtlMs` are removed, `holderPid` is now a number instead of a composite string, and `lockPath` is added. Grep over `src` shows no consumer of those fields for this error (`recovery.mjs` keys only on the code; `lock-wait.mjs`/`merge.mjs` use them for main-checkout locks).
- `runUnit` resume: the guard is now fail-closed via the kernel list. The `unlistable` fallback uses `probe`, and the missing-file short-circuit avoids creating lock files on a read.
- Reconcile verb and CLI: unchanged files. Behaviour is `blocked` ("no cwd lock is held") or `refused` for clear-cwd-lock, and unchanged for collect-result and repair-projection (still under `withLocalLock`, now a kernel mutex, one try, loser reports `blocked`).

## Unresolved questions
- Is the docs/specs/runner.md and CHANGELOG update intentionally deferred to a later phase?
- Should M1 throw a `DispatchError`, or is a missing cwd guaranteed to be caught earlier by every production caller?
