# Main door P04 repo-lock part: claimWork on the main door (lock-only)

Status: DONE_WITH_CONCERNS. Fence F10 honored: ceiling stays outside `state`, claim not narrowed, no `stateTx`, no state-part contract; `merge=union`, `.gitattributes`, `.fgos` strip untouched. Lock core imports nothing about the event log.

## Result
- `claimWork` (src/runner/claim-port.mjs) is now async and takes optional `waitMs`. One `LockScope('claim')`; `withMainCheckout(scope,'claim',...)` covers checkpoint (`checkpointMainFgos(handle, dir, repoRoot)`), read-only checks, worker-slot ceiling check, stale reclaim, `acquireClaim`, `addOutcome` — same region as before.
- Deleted: `forceReclaimAmbiguousLock`, AMBIGUOUS/HELD branches, `heldMainCheckoutWriter`, TTL options, `lock-ambiguous` category. `HolderLockError lock-held` -> `ClaimError('lock-held')` (category `lock-timeout`), fields `holders`, `lock`, `timedOut` (replace `remainingTtlMs/holderPid/lockAgeMs`; no consumers in src/bin).
- `--isolate`: worktree created AFTER main is released (chosen: rank 40 must not nest under rank 50 in one scope). Failure -> `releaseClaim`. `scope` is passed to `createClaimWorktree`; worktree.mjs ignores it until P06 makes it take worktree-admin. `beforeProvision` no longer passed.
- Callers: `loop.mjs claimItem` awaits (one line). Tests with sync callers updated: worker-slots, identity-before-lock, concurrent-claim-eventlog-loss.
- Tests: claim-port.test.mjs drops the 4 v1 lock tests; adds lock-held (names lock + holder pid, claims nothing), waitMs waits then claims, checkpoint under real hook (one commit with `.fgos/events/`, main free after), main free after isolate success and after worktree failure. fgos-claim-2 take/pick wait tests rewritten on a kernel-held lock (unrun, see below).

## Evidence
`FGOS_HOST_BIN` = host copied from the P03 build (rust sources unchanged), `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID`.
- On integration after merge (e2a3c85a9): claim-port, worker-slots, identity-before-lock, concurrent-claim-eventlog-loss, loop tests: 167 tests, 158 pass, 9 fail. All 9 spawn `bin/fgos.mjs` (5 `fgos unclaim`, 2 `fgos slots`, 2 `fgos report`) and die on its import of deleted `main-checkout-lock.mjs`: waiting for P07. Every `claimWork` module test passes.
- Broad run on phase branch: `test/runner/**`, `test/state/**`, `test/direct/**`, `test/holder-lock/**`, main-checkout-borrow-hook: 4510 tests, 4445 pass, 50 fail, 5 skipped. Name diff of the failing files against the integration tip before this phase: the only new names are those 9 bin-spawning tests (they were unloadable before); the rest fail identically on the old tip (bin import).
- Independent review (Sonnet code-reviewer): no late/early main release, lock order OK (rank 50 only), no v1 symbols left.
- `check-decision-codes.mjs` reports 378 vs 368 findings on the tip: line-keyed baseline noise from shifted lines in files that already embed codes; no new code embedded by this phase.

## Impact
GitNexus `claimWork`: LOW in index (only `claimItem` -> `claimAndDispatch` -> `runOnce`); index misses `bin/fgos.mjs` `doTake`/`doPick` (grep-confirmed).

## Concerns / for later phases
- **P07 must** `await` claimWork in `bin/fgos.mjs` doTake/doPick (`noWait ? doTake() : await ...` returns the Promise inside try, so ClaimError would skip StoreError translation), pass `waitMs` from `withLockRetry` (`doTake({waitMs})` -> `claimWork(..., {waitMs})`), fix the cli harness import of `DEFAULT_TTL_MS`/`writeLiveLock`, and remove `fgos-claim-2` unlock/lock-status tests.
- `test/cli/fgos-claim-2.test.mjs` cannot load (harness imports deleted module); rewritten wait tests unverified until P07.
- `git worktree add` in claim is still unserialized by worktree-admin until P06.
- Pre-existing: if `addOutcome` throws after `acquireClaim`, the runtime claim leaks (isolate path too); same as before, not narrowed here.

## Decisions (mine)
- Worktree after release rather than under main.
- `waitMs` added to claimWork's options (default one try) so P07 can plumb the CLI wait.
