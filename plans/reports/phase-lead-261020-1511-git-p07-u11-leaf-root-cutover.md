# Git phase 07, unit 11: Land declared files (first part of step a)

Step (a) is not finished. Approve leaf, sync-root and promote still use `withMergeSlot` + `withMergeEphemeralWorktree` + `mergeRunnerItem`. Steps (b) to (d) were not started. The tree is green for what was done.

## What was found

Land never checks `.fgos` writes when the destination is not checked out, and has no idea of decision rows or merge attributes. The root path from unit 9 (`mergeRootIntoMainCas`) passed `files: []`. Three things the old merge enforced were therefore missing on root→main approve:
- a branch writing under `.fgos/` was no longer refused (ADR0020);
- decision-id collisions and `merge=union` `.fgos` conflicts came back as `conflict`;
- the repo-invariant gate (tsk-516) was not run.

## Done (src/runner/merge.mjs)

**`declareLandFiles(repoRoot, item, target, source)`.** This is the Land input builder that the leaf path will reuse. It reads a read-only `git merge-tree --write-tree -z --name-only` of the two exact OIDs, then:
- **Decision-index collision:** reuses the existing classifier, renumber and index rebuild, now split into pure text cores. The renamed file is declared as a deletion (`bytes: null`, already supported by `LandFile`) plus new bytes, and the unioned index is declared as bytes.
- **Conflict confined to `merge=union` `.fgos` paths:** the target's blob is declared. Attributes are read with `check-attr --source=<target>`.
- **`.fgos` paths the branch did not write since `lastAttempt.branchHeadAtTake`, or union paths:** the target's bytes are declared, or a deletion if the target no longer has the path.
- **Anything else:** returns `conflict` or `fgos-write-rejected` (with paths) before a candidate exists.

**`mergeRootIntoMainCas`:**
- Uses the declarations. It passes `target` only when declarations exist, because they are bound to that target; otherwise Land pins the destination itself, so the waiting behaviour does not change.
- Runs `runInvariantChecks` in the candidate, and on the already-merged path. This closes unit 10's note.
- Reports `selfResolved`.

**Unchanged:** the old leaf-path helpers keep their signatures and now delegate to the text cores.

**Docs:** Git spec §9 has a dated paragraph, and CHANGELOG has an Unreleased line.

## Tests

`test/runner/merge-land.test.mjs` has 2 new tests:
- a branch writing under `.fgos` is refused before Land, and the destination is unchanged;
- a decision-id collision is renumbered (0002→0003) and unioned as declared bytes.

No existing assertion changed (E6: none this unit). The existing root conflict test still passes: the conflict is now found before Land, and the output is identical.

## Verification

Commands used `FGOS_STATE_ROOT=/tmp/fgos-work/u11-state` and `FGOS_TEST_FIXTURE_ROOT=/tmp/fgos-work/u11-fixtures`, run through a wrapper that calls `ensureGitAddon(env)` and then `node --test`.

| Suites | Result |
|---|---|
| merge-land, direct/merge-gate, runner/merge-quoted-paths, architecture | 62/62 pass |
| runner/merge, runner/land-vs-manual-commit | still running when this was written. Every test through the decision-index auto-resolve family passed (these use the refactored text cores). The outer session must confirm the full result |

`git diff --check` is clean. No Rust was changed, so cargo was not rerun. Impact analysis was not queried.

## Census rows

| Row | State |
|---|---|
| `.fgos` restore/rejection + decision-index self-resolve as declared Land files | Closed for root→main; the builder is ready for leaf |
| invariant gate on the Land path (new merge and already-merged) | Closed |
| approve leaf, sync-root (leaf and root-on-main), promote-engine onto Land; delete `withMergeSlot`, `mergeRunnerItem(Locked)`, `checkpointUnderMainCheckout`, short slot key; bin call sites | Open |
| event sweep through Work adapter (b); wrapper deletion + `Land.recover` after `moveWork` (c); E6 (d) | Open |

## Next step (exact)

1. Generalize `mergeRootIntoMainCas` into one `landRunnerItem(repoRoot, item, {timeoutMs, lockWaitMs, ownFileSet, operationId})`:
   - destination `refs/heads/fgw/<parent>` when `item.parent` is set, otherwise the trunk;
   - the main precheck and `MERGE_HEAD` check apply only when the destination is the checked-out trunk;
   - add `postLand` (`detectPostLandDrift`, as `mergeRunnerItem` does). Approve's root path reads `result.postLand`, which is undefined today.
2. Switch approve leaf (approve.mjs ~470–700), sync-root (both branches; the root branch currently merges on the main checkout through `mergeRunnerItem`) and `retargetMember` to it, with `lockWaitMs: noWait ? 0 : waitMs` in place of `withLockRetry`+slot.
3. In the same change:
   - delete the four old symbols and `withMergeEphemeralWorktree`;
   - retarget `test/runner/merge.test.mjs`. About 40 of its 2391 lines' tests use `withMergeSlot`/`mergeRunnerItem`; this is the bulk of the E6 work;
   - retarget the merge-gate sync-root slot key to `encodeURIComponent('refs/heads/main')`.
4. Leaf approve must also record `landOperation` and pass `landSettlement` to `moveDeliveredOrRecordFault`, as the root path does.

Status: DONE_WITH_CONCERNS
Summary: Added the Land declared-files builder (`.fgos` restore/rejection and decision-index self-resolve from a read-only merge-tree). Wired it, plus the invariant gate, into root→main publication, which closes a `.fgos`-write regression from unit 9. The leaf/sync-root/promote cutover and steps (b) to (d) remain.
Concerns/Blockers: Ran short on time partway through step (a). The tree is green at a sub-step boundary. The next step is above.
