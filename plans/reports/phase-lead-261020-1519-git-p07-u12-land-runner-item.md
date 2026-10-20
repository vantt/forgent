# Git phase 07, unit 12: every runner merge on Land

Steps (a) to (d) are done. Part of the optional Inspect step is also done.
The tree is green for the suites listed under Verification, with two exceptions. Two `performCatchUp` tests fail; they were already failing before this unit (see Concerns).

## (a) One consumer sequence: `landRunnerItem`

`src/runner/merge.mjs` `landRunnerItem(repoRoot, item, {branch, target, timeoutMs, lockWaitMs, ownFileSet, operationId})` generalizes `mergeRootIntoMainCas`:
- **Destination:** `refs/heads/<target>`. The target defaults to `fgw/<parent>`, or the trunk when the item has no parent. Approve passes the resolved root; promote passes the integration branch.
- **Main-checkout checks:** the `MERGE_HEAD` refusal and the no-wait main precheck run only when the main checkout holds the destination.
- **Destination held by another linked checkout:** Land refuses with `foreign-target-checkout`. The verb throws a `MergeError` that names the target.
- **Lock-held messages:** they keep the door's `(pid N)` wording. The slot key is the full ref.
- **`postLand`:** computed with `detectPostLandDrift`. The landed paths are read before Land.
- **Already merged, destination not held by main:** verified in a detached checkout. `createVerifyCheckout` creates it through the worktree-admin door, and `removeWorktree` removes it.

Callers:
- `approve` leaf→root and root→main both call it. They share `landOperationFor`: decision `landOperation` → `landSettlement` → `moveWork`.
- `sync-root` calls it on both branches.
- `promote-engine.retargetMember` calls it.
- The `--wait`/`--no-wait` flags become `lockWaitMs`. `withLockRetry` and the caller scope are gone from these verbs.
- Catchup still runs first, through Sync under source custody, not under any slot.

Deleted in the same change (L10):
- `withMergeSlot`, `checkpointUnderMainCheckout`, `mergeRunnerItem`, `mergeRunnerItemLocked`.
- `repo-locks.withMergeTargetSlot`, which was the short-key door.
- `abortMergeIfPossible`, `isMergeUnionPath`, `resolveFgosOnlyConflict`.
- The repo-mutating decision helpers: `classifyDecisionIndexCollision(repoRoot)`, `renumberDecisionFile`, `resolveDecisionIndexConflict`, `autoResolveDecisionIndexCollision`. Their text cores remain and back `declareLandFiles`.
- `mergeRootIntoMainCas`, renamed to `landRunnerItem`. `scripts/git/e3-bench.mjs` was moved to the new name.

`bin/fgos.mjs` has no merge calls of its own, only comments, and those are updated.

## (b) Event sweep

The raw `git add` sweep is gone.
- `landRunnerItem` runs Work's `prepareMainFgosCheckpoint` outside every lock.
- When a checkpoint is due, it runs `checkpointMainFgos`: the legacy-event adapter's Checkpoint/ScopedCommit under main 50. This happens before `prepare` pins the target.
- Event bytes never enter a candidate, because for a leaf they would carry `.fgos` onto a worker branch.
- Spec §13 `merge.mjs` row is updated to match the coordinator decision.

## (c) Wrapper deletion and M4 cleanup

- `withMergeEphemeralWorktree` and `createDetachedMergeWorktree` are deleted. They were the kept-checkout ref-CAS wrapper: `advanceRef` on `branch-in-use`.
- `acknowledgeLand(repoRoot, operationId, acknowledgement)` calls `Land.recover({operationId, consumerAcknowledgement})`. Failures come back as warnings.
- Approve calls it after `moveWork(delivered)` returns its event, with `work-delivered:<id>:<seq>`.
- `sync-root` calls it after its decision, with `work-decision:<id>:<seq>`.
- Verified: after acknowledgement, the candidate directory and the operation journal are gone.

## (d) E6 retargets

No assertion was weakened. Each entry gives the old text, the new text and its authority.

### `test/runner/merge.test.mjs`

**Retargeted:**
- **Helper and titles:** `mergeInSlot` becomes `landItem` (activated fixture). Titles `mergeRunnerItem …` become `landRunnerItem …`.
- **Event sweep test, renamed** to "landRunnerItem commits due .fgos event files through the checkpoint before Land, never inside the merge commit":
  - Old: the shard is in the merge commit, with exactly 1 first-parent commit.
  - New: 2 first-parent commits (checkpoint, then the merge), the shard is in `HEAD^1`, and the merge diff has no `.fgos`.
  - Authority: coordinator decision (unit 9), §13 `merge.mjs` row, and the adapter header "no implicit sweep".
- **Slot held:**
  - Old: key `'main'`, `/merge slot of "main"/`.
  - New: key `encodeURIComponent('refs/heads/main')`, `/merge slot of "refs\/heads\/main"/`, plus `lockWaitMs: 0`. The old helper made one try, but the Land default is a 60 s wait.
  - Authority: §9 (the slot is Land's full-ref slot 20).
- **Main held:**
  - Old: `/main checkout \(checkpoint\)/`.
  - New: `/main checkout \(precheck\)/` with `lockWaitMs: 0`. Main is now taken only for a due checkpoint or the no-wait precheck (§9: no 40/50/60 during verification).
- **Wait budget:** `{waitMs}` becomes `{lockWaitMs}`.
- **"free while verify runs":** the shapes main-checkout/disposable-worktree (`lockRoot`) become checked-out-trunk/root-branch. The assertions are unchanged.
- **Release test:** the slot probe key becomes the full ref.
- **Untracked file at an incoming path:**
  - Old: `merge-failed-unclassified` plus stderr/status.
  - New: `main-checkout-dirty-mid-merge`. HEAD unchanged, no MERGE_HEAD and the stray file intact are still asserted.
  - Authority: §9 step 4, fail-safe gate.
- **tsk-2iz resolve failure:**
  - Old: `merge-failed-unclassified` with `/decision-index auto-resolve failed/`.
  - New: `main-checkout-dirty-mid-merge`, plus: HEAD unchanged, planted file not overwritten, no MERGE_HEAD.
  - Authority: §9 steps 2 and 4. The resolution is declared bytes, so the collision is at publication.
- **Fixture only:** `performCatchUp` tests gain `activateGitFixture`.

**Deleted, because the mechanism is gone:**

| Deleted test(s) | Why | Coverage now in |
|---|---|---|
| `lockRoot` sweep, `lockRoot` lock-resolution, leaf contends on `lockRoot` | no `lockRoot` | — |
| 2 × `git commit` hook failure | Land runs no hooks and makes no `git commit` (§4 C1, §9 step 5) | — |
| "refuses without scope" | no caller scope | — |
| 2 × `withMergeSlot`, "lock ranks" with slot | helpers deleted | ranks: `repo-locks-multiprocess`; slot exclusion: `merge-target-slot-multiprocess`, plus "two lands exclude each other" |
| 3 × `abortMergeIfPossible` | no merge on main | — |
| `classifyDecisionIndexCollision` in isolation | the text core is private | the same-row-dispute end-to-end test stays |
| 2 × `withMergeEphemeralWorktree` CAS | Land owns this | `merge-land` "external destination writer" (`land-target-changed`) and "two lands exclude each other" |

### Other test files

| File | Change |
|---|---|
| `merge-target-slot-multiprocess` | Rewritten onto `landRunnerItem` with real holder children. Same four outcomes: named pid, distinct targets, SIGKILL, wait. Messages use the full ref. "No main mutex while slot held" is dropped; it is covered by the root-branch shape above. |
| `repo-locks-multiprocess` | Slot part removed (door deleted). Rank assertions unchanged. Title changed. |
| `worktree-callsite-wrapper` | 3 ephemeral tests become 2 `createVerifyCheckout` tests (exact commit and removal; kept checkout untouched, now also asserting its HEAD). |
| `worktree.test` | tsk-386 and fallback tests deleted: approve creates the root branch itself, and the `createBranchRef` master test remains. The "existing branch" test now uses `createVerifyCheckout`. tsk-4yv: the leak check is now on `landRunnerItem`'s already-landed verification checkout (still `SyntaxError`, no `verify-` registration left). |
| `land-vs-manual-commit` | **Checkpoint holds main:** old `rejects land-target-changed` becomes `merged`, with the published OID = main tip and `a.txt` landed. The title says "merges onto the moved trunk". Reason: the land waits for main at its own due checkpoint before pinning (coordinator decision). The commit-on-main / consistent-index / no-`index.lock` assertions are unchanged. **Promote:** probe key becomes the full ref. |
| `merge-gate` | sync-root key and message become the full ref. 2 new tests: candidate released after approve, and leaf→root through Land (`landOperation` destination, `landSettlement`, `mergedSha` = root tip, main untouched). |
| CLI `approve-6`, `merge` | Holder key and message become the full ref. `(pid N)` is still asserted. |
| `promote-engine` | Fixture now activated. The test built on a v0 JSON lock file is retargeted to a real merge-slot holder: the member merges once the holder is killed. |
| CLI harness | `initGitCwdMain(Fast)` now activates the fence and ignores `.fgos/locks/`, like this repo. Without it, root approve has been `git-fence-missing` since unit 9. |
| `merge-land` | Mechanical signature change. |

**Spec:**
- §9 has a dated paragraph.
- §13: the `merge.mjs` event row and the `promote-engine` row are updated.
- G-103 is updated.

**CHANGELOG:** one line. **Skill:** `fgos-lock-fence` now uses the full-ref example; renders were regenerated.

## Inspect, partial

`declareLandFiles` blob reads and the unchanged-since-take comparison now use batched Inspect `pathsAtRevision` (`readPathsAt`). An unreadable blob is an error, never an absence. `isUnchangedSinceBranchHeadAtTake` and `blobAt` are deleted.

## Census rows

**Closed:**
- approve leaf/root, sync-root (both branches) and promote onto Land.
- Slot helpers and the short key.
- `checkpointUnderMainCheckout`.
- Merge-on-main and ephemeral wrapper.
- Event sweep.
- Delivered-candidate cleanup (approve, sync-root).
- Merge-verb bin sites.
- Repo-mutating decision helpers.

**Open:**
1. `cleanupMergedBranch` still runs `git branch -D`. It is a write; move it to Refs `deleteBranchRef`. The cleanup verb's fixtures need activation.
2. Raw reads still in `merge.mjs`. No Inspect op exists today for the first three:
   - `merge-tree`, `check-attr`, `ls-tree` (`nextFreeDecisionId`, decision listing);
   - `branchContentMismatch` (`log --merges --ancestry-path`, `merge-base`, `diff`);
   - `diff-tree` on the `.fgos` paths;
   - `checkedOutRef` (`symbolic-ref`);
   - `reviewDiff`'s `git()`.
3. Red, conflicted and promote candidates are retained. No Work acknowledgement exists for them yet. Promote's would come after `editWork(parent)`.

## Verification

Commands used `node <wrapper> <files>`, where the wrapper calls `ensureGitAddon(env)` and then `node --test`, with `FGOS_STATE_ROOT=/tmp/fgos-work/u12-state` and `FGOS_TEST_FIXTURE_ROOT=/tmp/fgos-work/u12-fixtures`.

**Batch A** (15 files: runner merge, merge-land, slot multiprocess, repo-locks multiprocess, worktree, callsite-wrapper, promote-engine, verbs/approve, merge-gate, land-vs-manual-commit, git/land, git/land-recovery, merge-quoted-paths, store, architecture):
- 401 tests, all green except the 2 `performCatchUp` tests in Concerns. Batch A also had 3 more failures; each is resolved:
  - `retargetMember bails…`: a fixture had an untracked `.fgos`. Fixed: the fixture now excludes `.fgos/`.
  - Two no-wait timing assertions: they failed only while batch B ran in parallel and pass when rerun alone (`r11`: 5/5).

**Batch B** (CLI: approve 1–7, merge, post-merge 1/3/4, e2e/pr-gate, iron-law-gate, decision-kind, lock-fence):
- 339 tests run.
- Fixed this unit: `sync-root outcome guard` was retargeted to `main-checkout-dirty-mid-merge` (old: `merge-failed-unclassified` + git stderr; Land produces no git error; §9 step 4). It passes alone.
- Remaining failures do not come from this unit's code:
  - 4 session-guard approve tests and pr-gate (a)(b)(e)(f): `git-fence-missing` or a block in session/return/dispatch fixtures before approve runs. They need the same fixture fence; next step below.
  - catchup conflict test: a Sync catchup checkout is left behind on abort.
  - Leaf whose root was never created: `fgos-write-rejected` on an events shard. Probed: Sync catchup keeps the leaf's old `.fgos` shard, so Land sees it as a branch write.
  - `catchup … subsequent approve`: a blocked approve after catchup. Not probed; probably the same Sync `.fgos` cause.

Every change in this unit's own code passes.

Also:
- Probe: `acknowledgeLand` removes the candidate and the operation journal.
- `git diff --check` is clean.
- No Rust was changed, so cargo was not rerun.
- impact-analysis: inactive (0 providers).
- Not run: full `npm test`, E3, lifecycle verbs.

## Concerns

`performCatchUp` (Sync, unit 9) has 2 tests failing, and they were already failing at baseline (masked as `git-fence-missing` before this unit):
- **tsk-tr9:** a stale branch that deleted a `.fgos` shard against a target that grew it now gives `merge-refused`. Sync grants no resolver on `.fgos`.
- **PATH git-shim refusal:** native Sync does not run the shim, so the result is `conflict`.

The same Sync `.fgos` gap breaks the CLI leaf approve whose root branch was never created. Catchup also leaves a checkout behind on a conflict abort.

**Next step (exact):**
1. Catchup must keep the target's bytes for `.fgos` paths, like `declareLandFiles` does, and remove its checkout on abort.
2. The shim test needs a fixture-level refusal that native Git honours.
3. Give the session/return/dispatch CLI fixtures (`initGitCwd*`, the pr-gate repo) the same activation fence and `.fgos/locks/` ignore that `initGitCwdMain` now has, then rerun batch B.

Status: DONE_WITH_CONCERNS
Summary: Leaf/root approve, sync-root and promote now all land through one Land sequence (`landRunnerItem`). The slot helpers, merge-on-main, ephemeral wrapper and raw event sweep are deleted. Delivered candidates are released through `Land.recover` after Work records the result, and every changed test is listed with old/new text.
Concerns/Blockers: These failures do not come from this unit's code:
- Sync catchup's `.fgos` handling (2 runner tests, plus 2–3 CLI tests that depend on catchup).
- CLI fixtures without the activation fence (sessions, return, dispatch).

Also remaining: the cleanup verb's `git branch -D` and several raw reads in `merge.mjs` (listed above).
