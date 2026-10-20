# Git phase 07, unit 10: Land waits and root-merge retargets

The coordinator's six decisions on unit 9's open items are done. The root-merge families are green.
Step (a), the leaf→root / sync-root / promote cutover, was not started. Steps (b) to (d) depend on it.

## 1. Native Land prepare wait vs a killed holder: root cause and fix

**The holder-lock wait path is not at fault.** `lock_until`/`acquire_traced` (port.rs ~655/713) poll correctly, and a SIGKILLed holder's predecessor domain is admitted as empty.

The real cause is in the Node Land port. `GitLand.prepare` was a synchronous napi call that waited natively for up to `waitMs` on the Node main thread. While it waited, nothing else in that process could run:
- merge-gate: the test's `setTimeout(() => holder.kill(), 600)` never fired.
- land-vs-manual-commit: in `Promise.all` of two lands, the first land's verify child exit could not be observed. Its slot was never released, so the second land deadlocked until its 30 s budget ran out.

Fix at the owner, `src/git/land.mjs`:
- `prepare` and `publish` are now `async`.
- They space single native attempts (`waitMs: 0`) on the event loop until the caller's budget is spent. Only `lock-acquire-unavailable` is retried.
- Rust acquires slot 20 / main 50 before any WAL or candidate effect, so a failed attempt has changed nothing.

The contract change moved every caller in the same change (L10): `merge.mjs`, plus `test/git/land*.test.mjs` (mechanical `await` / `assert.rejects`; no assertion changed).

New owner test (`test/git/land.test.mjs`): "a Land waiting for admission keeps its process running…". A session closed in the same process admits the waiter, and a ticker proves the event loop ran during the wait.

Both caller tests (approve `--wait`; two lands exclude each other) pass unchanged.

## 2. Publish main wait

- Rust: `publish_land_wait(repo, session, evidence, wait_ms)` added. `publish_land`/`publish_land_with_filesystem` now default to 0 instead of the fixed 5000 ms. Recovery's own 5000 ms is untouched.
- Addon: `publish(evidence, waitMs?)`.
- Node: `publish(evidence, {waitMs})`.
- `mergeRootIntoMainCas` passes its existing `lockWaitMs`. No new config key.
- Spec §9 (prepare/publish wait sentence) and CHANGELOG are updated.

**Concern: the "checkpoint holds main while land waits" test could not stay unchanged.** The wait now works: the land waits for the checkpointer and does not time out. But the checkpoint commit moves the trunk, so Land returns stale `land-target-changed`. Decision 3 says to return that unchanged; the old assertions expected `merge-failed-unclassified` with `/update-ref failed/`. Keeping those assertions would mean fabricating git text, so I retargeted the test exactly like item 3. The remaining assertions are unchanged: the checkpoint commit is on main, the index is consistent, and there is no `index.lock`.

## 3–5. Retargets (E6)

All are in `test/runner/land-vs-manual-commit.test.mjs`.

| Test | Old | New | Authority |
|---|---|---|---|
| raw git manual commit detected by CAS | `outcome === 'merge-failed-unclassified'`, `/update-ref failed/` | rejects with `cause === 'land-target-changed'`; "commit survives" assertions unchanged | spec §9 step 5; coordinator decision 3 |
| checkpoint holds main while land waits | same two lines as above | same as above | spec §9 step 5 (see the concern under item 2) |
| file staged in main outside own set (title changed) | `main-checkout-dirty-mid-merge`, `stagedPaths`, trunk unmoved | `merged`, `receipt.checkout === 'pending'`, trunk moved and contains `a.txt`; staged-and-kept assertions unchanged | owner decision Q7 / D-ADR0042 (checkout-lagging), spec §9 "Successful dirty non-overlapping publication reports `checkout: pending`" |
| hook: manual commit inside the ref update (title changed) | the reference-transaction hook attempts a commit during `update-ref`; the attempt is refused | (1) the test passes `ownFileSet: new Set(['a.txt'])`, as approve always does; (2) asserts the reference-transaction hook never ran; (3) the refusal assertions (`/exit=0/` absent, `/fgOS is writing the main checkout/`) are unchanged, but the manual commit is now attempted under `withMainCheckout`, the same main 50 lock Land holds at publish | see diagnosis below |

Diagnosis for item 5:
- The first failure was `main-checkout-dirty-mid-merge`. The test passed no `ownFileSet`, and the untracked `.githooks/` files plus the `src` symlink are dirty. Spec §9 step 4 says the gate is "fail-safe to every non-`.fgos` path when the set is absent".
- After that fix, the hook never fired. Spec §4 C1 says publication "cannot execute repository hooks, including the reference-transaction hook".
- No assertion was weakened; the refusal is now proven under the same lock Land holds.

## 6. Unit 9's judgment call

Accepted. The test pinning both sides is unchanged and passes.

## Verification

Node runs used a wrapper that calls `ensureGitAddon(env)` and then `node --test`, with `FGOS_STATE_ROOT=/tmp/fgos-work/u10-state` (mode 700) and `FGOS_TEST_FIXTURE_ROOT=/tmp/fgos-work/u10-fixtures`.

| Suite | Result |
|---|---|
| test/direct/merge-gate, test/runner/land-vs-manual-commit, test/runner/merge-land, test/git/land, test/git/land-recovery, test/architecture, test/git/sync, test/state/store | 168/168 |
| new owner test (run separately, after that batch) | pass |
| `cargo test --locked -p fgos-git --test land --test land_crash_matrix --test scoped_commit_sync --test contracts --test recovery_matrix` | all pass (2 intentionally ignored) |
| `cargo clippy --locked -p fgos-git -p fgos-node-addon --all-targets -- -D warnings` | clean |
| `git diff --check` | clean |

Not run: full npm test, E3, lifecycle verbs. The outer session should run unit 8's mutating-suite recipe (`/var/tmp` roots). Impact-analysis was not queried this round.

## Next step (exact): step (a)

`mergeRunnerItemLocked` (merge.mjs ~1097–1440) holds the behaviour that must become Land input. Findings for whoever does it:

- **Already-merged:** Land's `land-already-merged` maps to the existing integrity check, goal check and invariant check. The root path already does the first two; add `runInvariantChecks`.
- **Decision-index self-resolve (`classifyDecisionIndexCollision`/`autoResolveDecisionIndexCollision`) and `.fgos`-only union conflicts (`resolveFgosOnlyConflict`):** compute the resolution before `Land.prepare` from a read-only `git merge-tree --write-tree` of the source and the pinned target. Pass the bytes as `request.files`, which Land freezes into the candidate ("declared-resolution" test). Not computable this way means the existing `conflict` outcome.
- **`.fgos` restore (merge=union, or unchanged since `lastAttempt.branchHeadAtTake`):** becomes declared `files` with the target's blob. The `git rm` branch needs Land to accept a declared deletion; check the `LandFile` shape first and, if it is missing, raise it as the one decision question. Anything still under `.fgos` in the candidate diff returns `fgos-write-rejected`.
- **Event sweep (step b):** for leaf→root, the old sweep only staged main-checkout events in main's index, never into the ephemeral commit. Route it through the Work adapter's declared ScopedCommit/Checkpoint before Land, and remove the `git add`.
- **Callers:** approve leaf, sync-root and promote-engine each call `Land.prepare` with destination `refs/heads/fgw/<root>`. Then delete `withMergeSlot`, `mergeRunnerItem(Locked)`, `checkpointUnderMainCheckout` and the short slot key, and move promote-engine's landing call in the same change.
- **Tests:** the merge-gate sync-root test still uses the short key `ref: 'main'`. Retarget it to `encodeURIComponent('refs/heads/main')` at that point.
- **Then:** (b) event sweep through the Work adapter; (c) delete `withMergeEphemeralWorktree` and the kept-checkout wrapper, with `Land.recover({operationId, consumerAcknowledgement})` after `moveWork` settles; (d) E6.

Status: DONE_WITH_CONCERNS
Summary: Fixed native Land waits blocking the Node event loop (the real cause of both lock-wait failures, not holder-lock), added the caller's wait budget to Land publish, and retargeted the root-merge tests per spec §9/§4. The root-merge families are green. Step (a), the leaf→root/sync-root/promote cutover, was not started.
Concerns/Blockers: The "checkpoint holds main" test needed the same stale retarget as item 3; it could not stay unchanged without fabricating git error text. Steps (a) to (d) remain; exact next step and design notes are above.
