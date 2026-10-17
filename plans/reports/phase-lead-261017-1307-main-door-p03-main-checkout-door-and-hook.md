# Main door P03, repo-lock part: main checkout door and hook

Status: DONE_WITH_CONCERNS. Scope fence F10 honored: no state-part contract touched; `merge=union`, `.gitattributes`, the `.fgos` strip rule untouched.

## Result

- `src/runner/repo-locks.mjs` (new): `withMainCheckout(scope, purpose, fn, {fgosDir, waitMs})` (rank 50), `withMergeTargetSlot(scope, lockRoot, targetRef, fn, {waitMs})` (20, ref encoded with `encodeURIComponent`), `withWorktreeAdmin(scope, fgosDir, fn, {waitMs})` (40), `addWorktree(scope, repoRoot, args)`. Release in `finally`; `held`/`timeout` become `HolderLockError('lock-held')` with the kernel holder pids. No TTL, heartbeat, self-recognition. Imports nothing about the event log.
- `src/runner/main-fgos-checkpoint.mjs` (new): `checkpointMainFgos(mainHandle, dir, repoRoot)`. Throws without a live `main-checkout` handle; every git step goes through `runBorrowed`. Kept in its own file, not in `repo-locks.mjs`, so the lock core stays detachable (F10 rule 1). Later phases import the checkpoint from this file.
- `events-jsonl-truncation-guard.mjs`: `mainCheckoutWriter` replaced by `commit(args)`; add, commit, reset-on-error all through it; no `commit` means no commit.
- `.githooks/pre-commit`: v1 inspect/grant-pid/protocol parts gone. At home only: `FGOS_LOCK_FD` + `--borrowed-check` => borrower, exit 0 before the beacon; else one `probe`; `held` refuses "fgOS is writing the main checkout"; W1' beacon as before. A stale `FGOS_LOCK_FD` falls through to the probe. No host binary: refuse if `/proc` lists a holder of the lock file, else warn and continue; other errors refuse.
- Deleted `src/runner/main-checkout-lock.mjs` and its 74 KB test. `formatLockDurationMs` moved to `src/util/format-lock-duration.mjs`; the beacon window default (20 s) is `DEFAULT_BEACON_WINDOW_MS` in `main-checkout-activity.mjs`.
- `.gitignore`: `.fgos/locks/` (kernel lock files are process state).

## Evidence

- Phase command set + `test/holder-lock/*` on the phase branch and again on the integration branch: 167 tests, 165 pass, 0 fail, 2 skipped (pre-existing), with `FGOS_HOST_BIN` = phase-private build (`.fgos/runtime/phase-target`), `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID`.
- Plan test list: 1 two-process exclusion + SIGKILL holder (`repo-locks-multiprocess`); 2 checkpoint via borrow then `probe == free`; 3 same-env sibling refused; 4 owner SIGKILLed after spawning git, contender held off >= 500 ms then enters; 5 manual commit refused while held / passes with beacon when free; 6 other worktree untouched; 7 reset runs while still holding main; 8 no handle throws. All in `test/e2e/main-checkout-borrow-hook.test.mjs` and `test/runner/repo-locks-multiprocess.test.mjs`. Every lock test runs without the checkpoint adapter (null adapter).
- Independent Opus review: no blocking defect. Fixed from it: hook fail-open without host now checks `/proc` holders; stale `FGOS_LOCK_FD`; `withRepoLock` keeps `fn`'s error when a borrowed child blocks release; test helper hands the resolved host to git children. Tests added for the first two.

## Impact

`runOpportunisticMainCheckoutChecks`: GitNexus HIGH (3 direct callers: `claim-port.mjs`, `merge.mjs` x2; flows claimWork, approve, sync-root, promote). Contract change is intended; callers move in P04/P05.

## Broken imports left for later phases (import `main-checkout-lock.mjs`, now gone)

- P04: `src/runner/claim-port.mjs:18` (also `heldMainCheckoutWriter`, the `:165` checkpoint call), `test/runner/claim-port.test.mjs:9`, `test/cli/fgos-claim-2.test.mjs`.
- P05: `src/runner/merge.mjs:53, 1772, 1893` (+ `HOLDER_PID_ENV_VAR` `:1593`, checkpoint calls `:807, :936`), `src/runner/lock-wait.mjs:8` (`formatLockDurationMs` now in `src/util/format-lock-duration.mjs`), `test/runner/merge.test.mjs:30`, `test/runner/merge-target-slot-multiprocess.test.mjs:55`, `test/direct/merge-gate.test.mjs:120`.
- P07: `bin/fgos.mjs:110-117` (`inspectMainCheckoutLock`, `formatLockDurationMs`, `acquireMainCheckoutLock`, verb `unlock`), `test/cli/helpers/fgos-cli-harness.mjs:23`.
- P08: `test/rust-host/fgctl-init.test.mjs:8`, `fgctl-init-activation.test.mjs:7` (`DEFAULT_TTL_MS`), `packages/distribution/rust/src/{lock,init}.rs` mentions.
- P09/P10: `test/holder-lock/fences-v1-tombstone.test.mjs` drives the v1 module through `v1('src/runner/main-checkout-lock.mjs')`; it needs a v1 stand-in or removal.
- Remaining `FGOS_MAIN_LOCK_HOLDER_PID` text: `src/runner/dispatch/adapters.mjs:102,115` (env scrub; kept, inspected only), merge.mjs (P05).
- Claim-port/merge tests dropped from the beacon test (claim checkpoint, merge-slot checkpoint) must be re-created by P04/P05 on `withMainCheckout` + `checkpointMainFgos`.

## Decisions

- `fgosDir`/`repoRoot` are explicit params (registry paths need them): `withMainCheckout` takes `{fgosDir}`, `withWorktreeAdmin` takes `fgosDir` second.
- Checkpoint in a separate file (F10), not exported from `repo-locks.mjs`.
- Hook and every later caller must resolve the same `<repoRoot>/.fgos/locks/main-checkout.lock`; P04/P05 tests should pin it (review point).

## Unresolved

- Merge-slot tombstones for existing `refs/heads/*` are not produced by `fences.mjs` yet (cutover, P09/P10).
- Checkpoint failures stay swallowed by the guard's outer `catch` (pre-existing); new borrow errors are invisible there. Candidate for `recordMainCheckoutGuardWarning` later.
