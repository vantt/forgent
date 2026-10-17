# Main door P05, repo-lock part: merge, land, promote, sync-root, approve under the slot

Status: DONE_WITH_CONCERNS. Fence F10 honored: no state-part contract touched; `merge=union`, `.gitattributes`, `.fgos` strip rule untouched; lock core imports nothing about the event log (checkpoint is the separate `main-fgos-checkpoint.mjs` adapter).

## Result

- Every merge into a target runs under the per-target merge slot (rank 20): leaf and root sync-root, approve leaf path, promote (`retargetMember`), and `mergeRootIntoMainCas` (now takes the trunk slot itself, then `addWorktree` rank 40 released at once, then main rank 50 only for land). `mergeRunnerItem` has one path: it needs the `scope` that holds the slot (TypeError otherwise); `targetSlot`, the main-holding branch, heartbeat, `HOLDER_PID_ENV_VAR`, `lock-lost-mid-merge` outcome all gone.
- Main mutex is taken only for: checkpoint at the start of `mergeRunnerItem`, merge commit when `repoRoot` is the main checkout (`runBorrowed git commit`; a disposable worktree commits directly), land (`update-ref` + `read-tree`).
- `lock-wait.mjs`: `withLockRetry(fn,{waitMs})` = `fn({waitMs: waitMs ?? 60 s})`; no loop, no ETA/TTL. `--no-wait` callers call `fn({})` = one try. Error text names the lock + kernel holder pids (from `repo-locks`).
- `withMergeSlot` / `toMergeLockError` in `merge.mjs`: adapter that turns the door's `lock-held` into `MergeError{code:'lock-held', holders, lock, targetRef}` so exit code 9 and every caller keep working.
- Behavior fix found by test: land's `read-tree -m -u HEAD` deleted a person's staged-new file (and reset staged edits). Land now refuses (`main-checkout-dirty-mid-merge` + `stagedPaths`) on staged non-`.fgos` changes; staged `.fgos` event files (swept into main's index on purpose) are restored content-intact and re-staged after the sync.
- Review fixes (independent Opus review): staged `.fgos` loss at land (above); promote now passes `waitMs` to the main steps; a main mutex still held at the merge commit rethrows `lock-held` instead of a generic "git commit failed".

## Evidence

All with `FGOS_HOST_BIN` = host binary of this source (rust sources byte-identical to the phase-03 build, copied), `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID`.

- Phase files on the integration branch after merge: `test/runner/land-vs-manual-commit.test.mjs`, `test/direct/merge-gate.test.mjs`, `test/runner/merge.test.mjs`, `test/runner/promote-engine.test.mjs`, `test/runner/merge-target-slot-multiprocess.test.mjs`, `test/runner/lock-wait.test.mjs`, `test/runner/repo-locks-multiprocess.test.mjs`, `test/e2e/main-checkout-borrow-hook.test.mjs`: 160 tests, 160 pass, 0 fail, 0 skipped.
- Broad run on the phase branch (before the review fixes): `test/runner/**`, `test/direct/**`, `test/holder-lock/**`, `main-checkout-borrow-hook`: 2884 tests, 2843 pass, 26 fail, 5 skipped. The same 26 fail on the untouched integration tip (identical failing-name set, diffed): `bin/fgos.mjs` and `claim-port.mjs` still import the deleted `main-checkout-lock.mjs` (P04/P07 work). None is in a P05 file. Full `npm test` was not run for that reason.
- Phase test list: 1 two lands exclude (verify runs never overlap, second merges onto first); 2 checkpoint holding main vs waiting land (land reports moved trunk via CAS, nothing lost, index consistent); 3 hook on: manual commit inside the land's `update-ref` (real `reference-transaction` hook) refused "fgOS is writing the main checkout"; hook off: manual commit before land detected by CAS, commit survives; 4 staged-but-uncommitted: refused / kept (plus staged `.fgos` kept); 5 promote and root-into-main: main mutex free during a verify that sleeps, slot held; 6 approve and sync-root `--no-wait` fails at once naming the slot and holder pid, `--wait` enters when the holder dies (use-case level, real holder process).
- `rg 'targetSlot|heartbeatIntervalMs|HOLDER_PID|acquireMainCheckoutLock' src/runner src/verbs`: only `claim-port.mjs` (P04) and the env scrub text in `dispatch/adapters.mjs` remain.

## Impact

GitNexus: `mergeRunnerItem` HIGH (3 direct callers: sync-root, approve, promote-to-component flows) and `withLockRetry` HIGH (4 direct). Contract changes are intended and all callers updated in this phase.

## Decisions (mine, plan left open)

- `withMergeSlot` lives in `merge.mjs` (adds the MergeError mapping); approve/sync-root/promote import it from there, not from `repo-locks.mjs` directly.
- Default wait when no `--wait`: 60 s (`DEFAULT_LOCK_WAIT_MS`), same as the old land wait; explicit `--wait <ms>` is the budget for the slot and again for the main steps.
- `mergeRootIntoMainCas` drops `failFastIfLocked`; `lockWaitMs: 0` does a precheck (`withMainCheckout` taken and released) so a no-wait caller is refused before the verify.
- Land staged-change handling as described; `lock-lost-mid-merge` stays in `catchup.mjs`'s reason set so items already parked with it stay recoverable.
- Deleted the obsolete lock-lost CLI test; rewrote the `--no-wait` CLI tests onto the slot.

## Concerns / for later phases

- CLI tests could not run (bin does not load until P07/P04): rewritten `test/cli/fgos-approve-6.test.mjs`, `test/cli/fgos-merge.test.mjs` are unverified; the same contracts are proven at use-case level in `merge-gate.test.mjs`. Other `fgos-approve-*.test.mjs`/`fgos-claim-2` still import v1 exports from the harness (P07).
- `fgos take`/`pick` (`bin/fgos.mjs:3123,3196`) call `withLockRetry(fn,{waitMs})` but `fn` ignores the wait budget: they fail at once on contention until P04/P07 plumb `waitMs`.
- Top-level `sync-root` (repo is the main checkout) merges, verifies and sweeps `.fgos` into main's index under the slot only; the main mutex is taken for the commit alone, as the plan specifies. A checkpoint of another target could race the index in that window (reviewer medium; small window). Not changed.
- Top-level `sync-root --no-wait` can still discard a full verify if main is busy at the commit (approve's CAS path has the precheck, sync-root does not).
- Stale comments about the old lock remain in `worktree.mjs` (P06 owns it) and `docs/` (P09).
- Docs/CHANGELOG (user-visible: lock-held wording, 60 s default wait, land refusing staged changes, no `lock-lost-mid-merge`) left to P09 which owns them.

## Unresolved

- Whether top-level sync-root should hold main from merge through commit (stronger, longer main hold) or keep the plan's narrow hold.
