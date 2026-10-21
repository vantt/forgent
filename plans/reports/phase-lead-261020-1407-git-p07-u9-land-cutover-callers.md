Unit 9 (second continuation) is incomplete. Step 1 is partly done: the root-into-main publication path (`mergeRootIntoMainCas`) and source catchup (`performCatchUp`) run on Land/Sync. The leaf-into-root path, sync-root, promote, the ephemeral/kept-checkout wrappers and the event sweep are still on the old mechanism. The tree is not green for the root-merge families (one merge-gate test and five land-vs-manual-commit tests fail, listed below). Round budget: about 35 minutes.

## WIP commit 623c1b3a2: review

Kept:
- Sync `prepare`: Rust, addon, Node and port inventory.
- `repoIdentity` in Recovery `inspectOperation`.
- `performCatchUp` on Sync prepare → verify → continue/abort under `dispatch-cwd` source custody. No destination slot is held.
- `mergeRootIntoMainCas` on Land `prepare` → verify in the candidate → `publish`, with no caller-held slot and no stale retry.
- approve's root path: it retains the operation id (decision row `landOperation`), refuses an unresolved attempted id, and settles by `landSettlement`.
- Store: M4 settlement dedup on `(repoIdentity, operationId, settlementKind)`.

All of this matches §9 and the coordinator sequence.

Fixed in this run:
1. **Verify-skip regression.** The WIP only skipped re-verification when the candidate tree equalled the source tree. That dropped the tsk-2lq disjoint-advance rule. `mergedTreeAlreadyVerified` now takes the pinned target, and the root path calls it with Land's `candidate.source`/`candidate.target`. Eligibility is still decided by Work, against the exact pinned OIDs.
2. **Lock mapping.** Land's cause is `lock-acquire-unavailable: Timeout {..}`, so the exact-match check fell through to `merge-failed-unclassified`. It now maps by prefix and by phase:
   - prepare → `merge slot of "refs/heads/<trunk>" is held by another process.`
   - publish → `main checkout (land) is held by another process.`

   `holders` are the real PIDs from `lockHolders` (Linux list; empty when unlistable). `lock` names the actual resource.
3. **No-wait precheck restored** (`lockWaitMs: 0`). It is a take-and-release of main 50 before Land starts, so nothing is held during verification (§9). Behaviour and message are unchanged.
4. **Land publish candidate check (Rust, judgment call).** Publish refused untracked files (`--untracked-files=all`). That made every non-ignored worktreeSetup/dependency output fail approve as `land-candidate-dirty`, which broke the existing setup contract. Publication commits the frozen candidate, never worktree bytes, so the check now covers HEAD/index/tracked files (`--untracked-files=no`). Tracked edits and staged additions still refuse (existing Rust and Node assertions unchanged). This is recorded in §9, and a Node test pins both sides.

## Work-store changes (M4 identity only)

- `moveWork(..., landSettlement)` validates `{repoIdentity, operationId, settlementKind:'delivered'}`. Under the same state transaction, it returns the prior event for the same identity and refuses a different delivery bound to that identity.
- `replay` folds `landSettlement` onto a delivered item.
- approve records one `kind:'engine'` decision carrying `landOperation {operationId, source, destination}` before Land, so the publication identity outlives a lost acknowledgement.

No other Work behaviour changed.

## Census rows

| Family | State |
|---|---|
| merge.mjs root CAS publication (`mergeRootIntoMainCas`, `landCasMergeUnderLock`, CAS_LAND wait, post-CAS restage) | Closed: old body deleted, Land only. |
| merge.mjs source catchup (`performCatchUp`) | Closed: Sync prepare/continue/abort. The temporary checkout comes from Worktree create/remove. |
| merge.mjs `mergeRunnerItem`/`mergeRunnerItemLocked` (leaf→root, promote): merge/abort/commit, event sweep, `.fgos` restore/rejection, decision-index self-resolve | **Open.** Next step 1 item. |
| approve leaf→root (`withMergeSlot` + `withMergeEphemeralWorktree` + `mergeRunnerItem`) | **Open.** |
| sync-root (`withMergeSlot` short key + ephemeral + `mergeRunnerItem`) | **Open.** Its test still uses the short key, deliberately. |
| bin/fgos.mjs merge call sites (≈3725/3805) | **Open.** |
| worktree.mjs `withMergeEphemeralWorktree` / kept-checkout wrapper | **Open** (step 3). It cannot be deleted until approve leaf, sync-root and promote stop calling it. |
| Event sweep via Work adapter (step 2) | **Open.** The root path no longer sweeps or re-stages, because Land preserves non-overlapping staged/dirty state. The leaf path still `git add`s events. |
| Land candidate cleanup with consumer acknowledgement (M4, step 3) | **Open.** Red/conflict/published candidates stay under `.fgos/runtime/git-candidates`. `Land.recover({operationId, consumerAcknowledgement})` after `moveWork` succeeds is not wired yet. |
| promote-engine, decision helpers, content-integrity history reads | Next unit, not started. promote still needs `withMergeSlot`/the ephemeral wrapper, so the step-3 deletion must move its landing call in the same change. |

## Remaining failures (outer-session decisions/retargets)

| Test | Old expectation | Land behaviour | Disposition |
|---|---|---|---|
| merge-gate: approve `--wait <ms>` lands once holder releases | Wait acquires after the holder is SIGKILLed at 600 ms. | Native `prepare` waited the full 15 s without acquiring. | **Bug to diagnose:** native `Wait::Ms` vs the killed-holder predecessor state (holder-lock port.rs ~655/713). Likely the same cause as "two lands exclude each other" (30 s timeout below). |
| land-vs-manual-commit: two lands exclude each other | Second land waits, then merges onto the first. | `lock-acquire-unavailable` after 30 s. | Same as above. |
| checkpoint holds main while land waits | Land waits up to `lockWaitMs` for main at the ref move. | Publish waits a fixed 5000 ms (land.rs ~742). | Needs a publish wait budget: Rust change to `publish(evidence, {waitMs})`. Not invented here. |
| raw git manual commit detected by CAS | `/update-ref failed/` outcome. | Land throws stale `land-target-changed` (§9 step 5, coordinator: return stale unchanged). | Retarget to the stale error plus "the commit survives". Spec §9 step 5. |
| file staged in main outside own set refuses | `main-checkout-dirty-mid-merge`. | Lands, preserving the staged file (`checkout: pending`). | Spec §9 "review fixes" mandates preservation, so retarget. **Owner-visible behaviour change; needs explicit E6 approval.** |
| hook: manual commit inside the ref update refused | `merged`. | `main-checkout-dirty-mid-merge`. | Not diagnosed. The test's hook/commit timing interacts with the own-file gate before CAS. |

## E6 (assertions changed this run)

Every other prior assertion line is verbatim.

| File | Old | New | Spec |
|---|---|---|---|
| test/direct/merge-gate.test.mjs (root CAS + approve tests; sync-root untouched) | `probe/holdLockInChild('merge-slot', {ref: 'main'})` | `{ref: encodeURIComponent('refs/heads/main')}` | §9: Land owns the destination slot keyed by full ref; coordinator: delete the short-branch key. |
| same (2 assertions) | `/merge slot of "main" is held by another process/` | `/merge slot of "refs\/heads\/main" is held by another process/` | Same. |

Fixture-only changes (not assertions):
- merge-gate and land-vs-manual-commit fixtures now install the activation fence (`prepareActivatedGitFixture` / `activateGitFixture`), which native Git mutation requires. This is the same precedent as unit 7.

New tests:
- disjoint pinned-target verify reuse (merge-land).
- untracked verification output publishes; the frozen tree excludes it (land).

No labels in titles.

## Verification

Run in the sandbox with `FGOS_STATE_ROOT=/tmp/fgos-work/u9-state` (mode 700), `FGOS_TEST_FIXTURE_ROOT=/tmp/fgos-work/u9-fixtures`, `FGOS_HOST_BIN=$PWD/target/debug/fgos`, via `ensureGitAddon()` + `node --test`:

| Suite | Result |
|---|---|
| test/git/land, test/runner/merge-land, test/direct/merge-gate | 46/47 (approve `--wait` fails, above) |
| test/architecture, test/git/sync, test/state/store | 105/105 |
| test/runner/land-vs-manual-commit | 5 failures, listed above |
| `cargo test --locked -p fgos-git --test land --test land_crash_matrix --test scoped_commit_sync --test contracts --test recovery_matrix` | all pass (2 intentionally ignored) |
| `cargo clippy --locked -p fgos-git -p fgos-node-addon --all-targets -- -D warnings` | clean |
| `git diff --check` | clean |

Not run: full npm test, E3, lifecycle verbs. The outer session should run unit 8's mutating-suite recipe (`/var/tmp` roots) after the next round.

## Next step (exact)

1. Diagnose native `prepare` wait vs a killed holder (fixes 2 tests).
2. Decide on a publish main-wait budget.
3. Owner approval for the staged-file retarget.
4. Then step 1 for leaf→root: approve's parent path and sync-root on `Land.prepare`, destination `refs/heads/fgw/<root>`. `.fgos` restore/rejection and decision-index self-resolve become declared `files` bytes. Delete `withMergeSlot`, the short key and `mergeRunnerItem`, moving promote's landing call in the same change.
5. Then steps 2–4.

Impact-analysis: not queried this round. Program board is out of scope; the coordinator updates the lane.

Status: BLOCKED
Summary: Root publication and catchup run on Land/Sync with M4 settlement. Fixed the verify-skip regression, lock mapping, no-wait precheck and untracked-output refusal in the WIP. The leaf→root/sync-root/promote cutover, wrapper deletion and event-sweep migration remain open.
Concerns/Blockers: The native Land `prepare` wait does not acquire after a killed holder. Publish's fixed 5 s main wait has no caller budget. The staged-file preservation retarget needs explicit E6 approval. Six root-merge tests still fail. The round budget ran out mid step 1.
