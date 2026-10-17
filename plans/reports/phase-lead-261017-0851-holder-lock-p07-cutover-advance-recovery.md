# Phase lead report: holder-lock P07 — cutover advance, recovery

- Plan: `plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md`, phase file `phase-07-cutover-advance-recovery.md`
- Branch `holder-lock/p07-cutover-advance-recovery` (worktree `.claude/worktrees/hl-p07`, from integration `1ae02d846`), merged into `holder-lock/integration` as `117e1cb60` (`--no-ff`).
- Impact analysis (GitNexus, index stale at `b334695`, cross-checked with grep): `withAdvanceLock` LOW (3 callers: `startWorkflow`, `answerWorkflow`, `resumeWorkflow`); `liveAdvanceHolder` LOW (`assertNoLiveAdvance` → both `*Detached` doors, `advanceReport` → `statusWorkflow`); `withRunLock` LOW (1 caller, flow `recoverApplyUseCase`). No HIGH/CRITICAL.

## Commits

| Commit | Change |
|---|---|
| `50ef72bb8` | **Registry fix.** `advance` v3Path was `<workflowRunDir>/advance.lock`, the exact path where the cutover places its `TOMBSTONE` directory (`fences.mjs:132`). Every run fenced at cutover would then fail its v3 acquire with `EISDIR`. Moved to `<workflowRunDir>/locks/advance.lock`, and `recovery` to `<runDir>/locks/recovery.lock`, as the phase file states. New registry test: a tombstoned lock's v3 path never ends on its v1 path. **Negative control:** with the old row, the test fails with `advance: v3 … lands on the tombstone`. |
| `0fc12de77` | advance: `acquireAdvanceLock` → `acquireSync(createLockScope('advance'),'advance',{fgosDir,workflowRunDir})`, one try. Deleted `ADVANCE_LOCK_FILE`, `ADVANCE_LOCK_WRITE_GRACE_MS`, the `wx`/pid write, the holder read and unlink, and the local `isProcessAlive`. |
| `c81805c92` | recovery: `withRunLock(repoRoot, runDir, fn)` → `acquireSync(…,'recovery',{runDir,fgosDir})`. Deleted `readLockHolderPid`, the `wx` path, dead-pid reclaim, and the `isProcessAlive` import. |
| `6216307dd` | review fixes H1, M1, M2 (below), plus tests. |

Behaviour kept for callers:
- Same exports and the same refusal text (`Workflow run "<id>" is already being advanced by process <pid>…`, `RecoveryError lock-busy`).
- Still a single try with no wait.
- Refusal still happens before anything is recorded.
- `status.advance.{running,pid,logPath,lastLines,hint}` keeps its shape.
- The pid now comes from `lockHolders()` (a `/proc` scan of the descriptions that own the flock).

## Review (code-reviewer, Sonnet)

| # | Finding | Action |
|---|---|---|
| H1 | `statusWorkflow`/`assertNoLiveAdvance` used `probe` (a shared flock), so a status read overlapping an advance made the advance see `held` and refuse falsely | Fixed: liveness comes from `lockHolders` (takes no lock), and `probe` is only a fallback where holders cannot be listed (non-Linux). New multi-process test: a child loops `statusWorkflow` for 1.5 s while the parent acquires and releases the advance lock; every acquire succeeds. **Negative control:** with the probe-first version, the test fails with `a status read must never hold the advance lock`. |
| M1 | status throws `lock-driver-unavailable` without a host binary | Fixed by H1 on Linux (the `/proc` scan needs no host). Off Linux the probe still needs the host, the same as every other facade lock. |
| M2 | facade `mkdir -p` can recreate a deleted run dir | Fixed: acquire refuses when the run dir is gone (`RunnerConfigError … not found` / `RecoveryError run-not-found`). The remaining TOCTOU window is microseconds wide. |
| M3 | `docs/specs/runner.md:1488` still describes the pid file | Left for P11 (docs owner). Text is listed below. |
| L1 | refusal pid can be any listed holder | Kept: `lockHolders` lists only descriptions that own the flock, so a status reader or contender is never listed. |
| L3 | no test that status on a never-advanced run creates nothing | Added (no `locks/` dir after status). |
| L4 | child holders use `stdio:'ignore'` | Kept (same pattern as the P06 session test; a 10 s ready deadline names the failure). |

## Tests (real host binary: phase-private `.fgos/runtime/tmp/cargo-p07`, hardlinked from the P08 build; the Rust tree has not changed since P06, and Rust does not read the registry)

| Phase test | File | Result |
|---|---|---|
| A holder SIGKILLed right after acquire → the next `answerWorkflow` refuses while it lives, then completes at once after the kill | `workflow-runner.test.mjs` | pass |
| Run dir deleted and recreated while a child still holds the old inode → status says not running, next advance completes | same | pass |
| Concurrent status reads never block an advance | same | pass (negative control red) |
| In-process holder → all four advance doors refuse with the holder pid, no event recorded; after release the answer completes | same | pass |
| Recovery: a live child holder → `lock-busy`; SIGKILL → next apply `applied`; an in-process holder refuses before `run.json` is touched, then after release applies | `dispatch-recovery.test.mjs` | pass |

Commands (`env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<phase build>`):
- Narrow on the phase branch: `node --test test/workflow/workflow-runner.test.mjs test/verbs/dispatch-recovery.test.mjs`: **92/92**. `test/holder-lock/*.test.mjs` plus architecture: 94 tests, 92 pass, 2 skipped.
- Full `npm test`, run 1 (before the review fixes): **7930 tests, 7842 pass, 0 fail, 13 skipped**. Exit 1 came only from the store leak guard, which caught my own log files written under `.fgos/runtime/tmp` during the run. Run 2 logged to a scratch dir instead.
- Full `npm test`, run 2 (final code): **7931 tests, 7841 pass, 2 fail, 13 skipped**.
  - `herdr-reconciliation` #20 is a live herdr pane argv mismatch; it passes when run alone.
  - `release-tree` R1&R2 fails at `convention-conformance` because of "1 post-cutoff" violation, which comes from a misnamed report already on the base (`plans/reports/*-261008.md`). `fgos doctor` on `hl-integration` at `1ae02d846` gives the same red, so this is **pre-existing and not caused by this phase**. Run 1 passed, probably because the host call timed out under load, which makes the check skip and pass.
- Integration `117e1cb60`: workflow-runner, dispatch-recovery, registry-contract, fences-v1-tombstone, architecture: **134/134**.
- "S1 live probe" was not seen.

## Decisions (lead)

1. **Registry rows changed** (P00-owned file; the cutover rules say not to touch it). This was a correctness bug that would break every fenced run after cutover. The phase file already named `<runDir>/locks/…`, so the registry was aligned to it. No Rust or other reader depends on these two rows.
2. Each acquire takes a fresh `createLockScope`, as in P06. Advance and recovery are never held together with another 4.2 lock in one scope.
3. Status/liveness uses the kernel holder list rather than `probe` (H1). `probe` is used only where holders cannot be listed.
4. Acquire refuses for a deleted run dir instead of letting the facade recreate it.
5. Reused the P08 host build via hardlinks (RAM rule). The phase worktree's `target` symlink was repointed to it for the staged-release tests.

## Concerns

- **P11 docs:** `docs/specs/runner.md:1488` still says "process đang chạy giữ `.fgos/workflow-runs/<id>/advance.lock` (pid) … lock của process đã chết được tiếp quản". Replace it with: a kernel mutex at `.fgos/workflow-runs/<id>/locks/advance.lock`, released when the holder dies, with `advance.running/pid` read from the kernel holder list. The registry note for advance/recovery should mention the `locks/` subdir.
- **P11 CHANGELOG line** (from the phase file): "Fixed: advance và recovery lock không còn kẹt mãi khi holder chết giữa lúc tạo file." Add that both locks now live under `<run>/locks/`.
- **P12:** `release-tree` R1&R2 fails on a clean base because of a misnamed 261008 report. It can look green only when the doctor host call times out. Fix or rename that report before the final suite.
- **P04/P12 fences:** the run-scoped tombstones still target the v1 paths (`advance.lock`, `.recovery.lock`), and now no longer collide with v3. `fences-v1-tombstone` is green.
- The recovery run-dir-gone guard has no direct test: the window sits after `resolveRunDir` and cannot be reached from the public door without a race harness.
- No plan or journal sync: the controller owns `plan.md`.

## Unresolved questions

None.
