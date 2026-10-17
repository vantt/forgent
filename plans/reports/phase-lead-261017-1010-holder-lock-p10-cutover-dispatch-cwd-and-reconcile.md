# Phase lead report: holder-lock P10 — cutover dispatch cwd, reconcile.lock, resume guard

- Plan: `plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md`, phase file `phase-10-cutover-dispatch-cwd-and-reconcile.md`
- Branch `holder-lock/p10-cutover-dispatch-cwd-and-reconcile` (worktree `.claude/worktrees/hl-p10`, from integration `13f0933e3`), merged into `holder-lock/integration` as `888c253c1` (`--no-ff`).
- Impact analysis (GitNexus, index stale at `b334695`, cross-checked with grep): **`executeExecutorCli` CRITICAL** and **`executeAssignment` CRITICAL**. Every dispatch goes through them (flows `dispatchBound`, `runRole`, `dispatchClaimedItem`, `planUseCase`, `runDispatchCli`, `runOnce`). `planReconciliation` and `withLocalLock` are LOW (flow `applyReconciliation`). Mitigation: callers see the same behaviour. The error class is still `dispatch-in-flight`, acquire is still one try, and `sharedCwd`/`forceSharedCwd` still take no lock. Run `detect_changes` before the commit: the changed symbols were exactly the expected set.

## Commit

| Commit | Change |
|---|---|
| `42da56e68` | Both locks in one commit. The phase file puts `reconcile.lock` here because it lives in the same file as the cwd part, and both share the planner's deleted `/proc` proof code. |

What changed:
- **Dispatch cwd lock:** now a kernel lease at `<fgosDir>/locks/dispatch-cwd--<dev>-<ino>.lock`, using dev:ino after `realpath` (r6 §6.9). The scope is still `fgosDir`.
  - New module `src/runner/dispatch/cwd-lock.mjs` holds the shared door. `acquireDispatchCwdLock` throws `dispatch-in-flight` and names the holder pid from `lockHolders`. `dispatchCwdHolder` checks the holder list first and falls back to `probe` only where holders cannot be listed. This follows the P07 decision: a probe takes LOCK_SH, so it could make a concurrent one-try acquire see `held`.
  - `cli.mjs` and `assignment-runner.mjs` use it.
  - There is no TTL and no heartbeat any more.
- **Resume guard (`run.mjs`):** `dispatchCwdHolder` reports a holder → the resume is refused. The record read and its fail-open `catch` are gone.
- **Reconcile `clear-cwd-lock`:** no longer judges whether the holder is alive or dead. Plan → `refused` when the lock is held, `blocked` ("no cwd lock is held") when it is free. It never plans a mutation. Apply only re-reports the facts. A plan that names a `path` is `plan-stale`.
- **`withLocalLock`:** now a mutex at `<fgosDir>/locks/reconcile.lock`, one try. `blocked` text is kept.
- **Deleted in the same commit:**
  - in `main-checkout-lock.mjs`: `dispatchLockFile`, `COMPOSITE_PID_IDENTITY_RE`/`parseCompositePidIdentity`, the composite branches of `recordTtlMs`/`judgeRecord`, and the `process-identity` import;
  - both cwd heartbeats;
  - in the planner: `startTime`, `USER_HZ`/`verifyUserHz`/`readBtimeMs`, `cwdLockHolder`, `holder`, `lockFile`, `localLock`, and the unlink apply path.
- `rg "dispatch--|dispatchLockFile|parseCompositePidIdentity" src scripts` finds only the v1 fence path in `src/holder-lock/fences.mjs`, which is intended.

## Decisions (lead)

1. **Registry row changed** (P00-owned file; P07 set the precedent). `dispatch-cwd` `v3Path` was `dispatch--<encodeURIComponent(cwd)>.lock`, which is `path.resolve` only. The phase file and r6 §6.9 require dev:ino after realpath. A symlinked worktree would otherwise be a second lock. New placeholder `<cwdDevIno>` in `src/holder-lock/registry.mjs`. The registry schema is closed, so the explanation went into `note`. Rust does not read the registry.
2. **Kept `clear-cwd-lock` as an action** (CLI contract, `command-registry.mjs`, spec) instead of retiring it. It now only reports.
3. **A missing cwd** throws `DispatchError('worker-spawn-fail', 'dispatch cwd "…" does not exist.')` before any lock. The lock key needs the directory, and the review found an opaque `lock-path-param-missing` otherwise.
4. Each acquire gets a fresh `createLockScope` (as in P06/P07/P09).
5. **Reconcile import closure:** gains `src/runner/dispatch/cwd-lock.mjs` and `src/runner/dispatch/dispatch-error.mjs`, a leaf. Both are in `EXPECTED_CLOSURE`, and the closure has no new process control. This reuses P09's lock-door exemption; no new exemption.
6. `withLocalLock` creates `.fgos/dispatch/` for the action log. The v1 lock created it as a side effect, and the CLI repair-projection test caught the ENOENT.
7. Host binary: hardlinked from P09's phase build into `.fgos/runtime/tmp/cargo-p10` (Rust has been unchanged since P06; RAM rule). The worktree `target` symlink points there for the staged-release tests.
8. Added a test helper `test/helpers/hold-lock-in-child.mjs` (real child holder, SIGKILL-able), used by four test files.

## Review (code-reviewer, Sonnet) — `plans/reports/code-reviewer-261017-0946-holder-lock-p10-dispatch-cwd-review.md`

No High findings. Confirmed: the lock is released on every path, workers do not inherit the descriptor, herdr-spawn does not conflict with itself, and the import graph holds.

| # | Finding | Action |
|---|---|---|
| M1 | A missing cwd gave `HolderLockError lock-path-param-missing` | Fixed (decision 3), with a test |
| M2 | No CHANGELOG line; `docs/specs/runner.md` is stale | Left for P11: the cutover rules forbid editing CHANGELOG, and docs belong to P11. Text is listed below |
| M3 | A wedged but live dispatcher now blocks its cwd with no limit (v1 had a 4 h ttl and a reconcile clear) | By design: a live holder holds. The worker itself is still killed at its run timeout. P11 should state this in the spec |
| Low | Stale comments in `command-registry.mjs`, `config.mjs`, `run-timeout.mjs` | Fixed. A `bin/fgos.mjs:2660` comment cannot be edited (rule) |
| Low | The test helper skipped temp-dir cleanup on failure | Fixed (`try/finally`, and it kills the child on timeout) |
| Low | `dispatchCwdHolder` throws on a realpath EACCES; lock files accumulate per directory | Kept. EACCES on one's own worktree is not a real case; one empty file per worktree ever dispatched is the same footprint as v1 |

## Tests (`env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<phase build>`)

| Phase test | File | Result |
|---|---|---|
| Two dispatches to the same cwd → one `dispatch-in-flight` (existing) | `dispatch.test.mjs` | pass |
| A holder in another process is SIGKILLed → the next `executeExecutorCli` goes in at once (the refusal names `child.pid`) | `dispatch.test.mjs` | pass |
| The same cwd through a symlink is refused; a `sharedCwd` dispatch running during the hold is not refused; the lock is free after the run | `dispatch.test.mjs` | pass. **Negative control:** with the old `encodeURIComponent(cwd)` key, this test and the reconcile symlink test fail ("one directory reached through a symlink is the same lock") |
| A missing cwd → `worker-spawn-fail` | `dispatch.test.mjs` | pass |
| A second mutating `executeAssignment` is refused naming `process.pid`; `forceSharedCwd` proceeds; read-only runs side by side | `assignment-cwd-mutex-concurrency.test.mjs` | pass |
| Resume guard: a live child holder → refused naming its PID; after SIGKILL → resume `pass` | `execution/run.test.mjs` | pass |
| Reconcile: free → `blocked`, a forged clear plan applies nothing; a live child holder → `refused`, also through a symlink; after SIGKILL → `blocked` | `dispatch-reconciliation.test.mjs` | pass |
| `reconcile.lock` held by a child → apply `blocked`; after SIGKILL → `applied`; the lock is free after an apply; two real processes racing one apply → exactly one `applied` | `dispatch-reconciliation*.test.mjs` | pass |
| Reconcile import graph (closure + runtime load) | `dispatch-reconciliation-import-graph.test.mjs` | pass |

- Narrow, phase branch (16 files: phase-owned plus fences, i08b, operability door, recovery): **655/655**.
- Integration `888c253c1` (13 files): **614/614**.
- Full `npm test`, run 1 (before the review fixes): **7924 tests, 7834 pass, 2 fail, 13 skipped**.
  - `release-tree` R1&R2: pre-existing. A misnamed `plans/reports/*-261008.md` already on the base; P07 and P09 confirmed it.
  - `retrospective-doors` freshness CLI: passes 19/19 when run alone (load flake; P06 saw the same).
- Full `npm test`, run 2 (final code): **7925 tests, 7834 pass, 3 fail, 13 skipped**.
  - R1&R2 again (pre-existing).
  - `herdr-spawn-adapter` "idle whose screen keeps changing" and `spawn-worker` idleTimeoutMs: both timing tests. Their two files pass when run alone (70 tests, 69 pass, 0 fail). P09 saw the `spawn-worker` one too.
- "S1 live probe": passed in run 2, not hit.
- `scripts/test-ownership-lint.mjs`: run by the pre-commit hook on the phase commit, no block.

## Concerns / hand-offs

- **4.3 rebase (`main-checkout-lock.mjs`):** only the dispatch parts were removed:
  - `dispatchLockFile`;
  - `COMPOSITE_PID_IDENTITY_RE`/`parseCompositePidIdentity`;
  - the composite branch of `recordTtlMs` (a string identity now always gets `HOOK_TTL_MS`) and of `judgeRecord`;
  - the `resolveHolderLiveness` import.

  `RUN_TIMEOUT_MAX_MS` is still used. The main-checkout and merge-slot code is untouched. Tests that used `dispatchLockFile('/some/worktree')` as a generic string-identity lock now use `'ttl-judged.lock'`. The composite-only tests were deleted.
- **P11 docs:**
  - `docs/specs/runner.md:21-22`: `clear-cwd-lock` "removes a cwd dispatch lock after proving … dead" → it only reports held/free; a kernel lock never leaves a dead holder's file.
  - `:1113` (RUL86): the resume guard text with `.fgos/dispatch--<cwd>.lock` and the composite holder → the kernel holder of `<fgosDir>/locks/dispatch-cwd--<dev>-<ino>.lock`.
  - `:1123` (RUL96): the paragraph on recorded ttl, renewals and "reconcile clears such a lock by hand" → no TTL; a dead holder releases at once; a live but wedged dispatcher holds until it exits (M3).
  - `:3350`: drop `dispatch--*` from the ttl writers.
  - `:1445` is still correct.
- **P11 CHANGELOG** (phase file line): "Changed: lock dispatch theo cwd là kernel lock (vẫn theo `fgosDir`); holder chết nhả ngay, không còn file `dispatch--*.lock` mồ côi chặn resume. Fixed: guard resume không còn coi lock đọc lỗi là trống." Add: the key is the directory's identity after realpath (a symlinked worktree is the same lock); `reconcile.lock` is a kernel mutex at `.fgos/locks/reconcile.lock`; `dispatch reconcile` `clear-cwd-lock` now only reports.
- **P12 fences:** the fence still targets the v1 paths `.fgos/dispatch--*.lock` and `.fgos/dispatch/reconcile.lock`. The v3 paths are under `.fgos/locks/` and do not collide. `fences-v1-tombstone` is green.
- `bin/fgos.mjs:2660` has a stale comment about the old lock (file not editable per plan).
- Full-suite timing flakes as listed above; not chased.
- No plan or journal sync: the controller owns `plan.md`.

## Unresolved questions

None.
