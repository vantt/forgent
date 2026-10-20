# Git phase 07, unit 13: catchup store rule, refusal test, fixture fence, cleanup and merge reads

Steps 1 to 5 are done. Each step was verified before the next one started. The suites listed under Verification are green. The only failures left are environmental and listed there: bwrap namespaces are refused in this sandbox, and so are nested writing dispatches from a confined worker.

## 1. Catchup and the fgOS store

**Cause.** Sync restores every `.fgos` path the merge touches to the source's HEAD (spec §8, "source-side `.fgos` stays source-side"). That broke catchup in three ways:

- **tsk-tr9.** For a modify/delete (the branch deleted a shard that the target grew), HEAD has no copy of the path, so the restore failed and catchup returned `merge-refused`.
- **Clean target-side store change.** The restore made the catch-up merge commit read as the branch reverting the target's store. Land then rejected that as a branch write. This is the CLI leaf approve whose root was never created: `fgos-write-rejected`.
- **Conflict abort.** On a conflict, Sync's abort keeps the conflict path's bytes, as spec'd, so Worktree refused to remove the catch-up checkout (`worktree-dirty-preserved`).

**One rule.** `declareLandFiles`' `.fgos` half now lives in `declareStoreFiles` (`src/runner/merge.mjs`), alongside `readMergeTree`, `changedStorePaths` and `isUnionAt`. Land and catchup both call it; there is no copy.
- `merge=union` `.fgos` conflicts keep the target's bytes.
- So do stale `.fgos` paths: paths unchanged since the take point, or `merge=union` paths.
- Everything else is returned to the caller as unresolved or as branch-written.
- Land maps that result to `conflict` / `fgos-write-rejected` exactly as before.

**`performCatchUp`**, in order:
1. Reads the `merge-tree` of the pinned target and the branch.
2. Returns `conflict` for any conflict outside `.fgos`, before any checkout or Sync exists. Nothing is left behind, so nothing has to be removed. A conflict still parks the item exactly as before: the old Sync conflict path aborted at once and never opened a resolver.
3. Declares the store rule.
4. Declares the merge result's bytes for every other `.fgos` path whose merge result differs from the source's.
5. Passes all of these to Sync as `files`.

A branch's own store write is not declared. It stays on the branch for Land to refuse.

**Sync (Rust).** `prepare` takes `files: [LandFile]`. The validation and the byte writer are Land's own, extracted in `land.rs` as `validate_declared_files` and `write_declared_file`:
- Declared paths are skipped by the HEAD restore.
- They are part of `SyncIntent` and its digest. The field is serde-defaulted, so older WAL records are unchanged. A same-id request with different files is refused with `operation-id-reused`.
- A skip-worktree path (Worktree creation leaves `.fgos` that way) changes in the index only. It keeps its bit, and is made absent again if it was absent before the merge.
- Other paths are written and staged.
- A declared absence is removed from the index. Git refuses `add -A` on a path the merge has already deleted from the index (probed).
- `start` (Unit sync) declares nothing, so its behaviour is unchanged.

**Refusal reason.** The reason is now Git's own refusal text. Before, it was the raw native-error JSON with stderr as a byte array. The parser `nativeError` moved from `commit-unit-work.mjs` to `src/git/native.mjs`, and both callers use it.

**Spec:** a dated §8 paragraph.

## 2. PATH-shim refusal test

The driver resolves `git` from PATH once per process and runs with its own empty hooks directory (§7, and the §8 floor record). So neither a PATH shim nor a hook in the fixture repository reaches native Sync.

The test is retargeted to a refusal native Git honours: an untracked file in the branch's own checkout, at a path the merge would create. **Spec G-067:** a non-zero exit with no `MERGE_HEAD` is `merge-refused` and leaves nothing behind. The old fixture also had a real conflict on `f.txt`; it now gets `conflict` up front, so the fixture uses a new file instead.

`test/runner/merge.test.mjs`, "performCatchUp pre-merge-refusal fixture …":

| | Old | New |
|---|---|---|
| Fixture | PATH shim answering `merge --no-commit` with a refusal | untracked `incoming.txt` in a linked checkout of `fgw/tsk-5et`; main adds `incoming.txt` |
| Reason | `assert.equal(result.reason, "error: Entry 'f.txt' not uptodate. Cannot merge.")` | `assert.equal(result.reason.split('\n')[0], 'error: The following untracked working tree files would be overwritten by merge:')` |
| Kept | `outcome === 'merge-refused'`, no `conflictedFiles` | unchanged |
| Added (G-067 "leaves nothing") | — | branch tip unchanged; no `MERGE_HEAD` in the checkout; the untracked bytes are intact |
| Skip | `win32` skip | removed: no shim is needed now |

No other assertion was changed. The tsk-tr9 test and the CLI leaf-approve tests pass unchanged.

**New Rust tests**, in `packages/git/rust/tests/scoped_commit_sync.rs`:
- **Deleted-shard case:** declared bytes staged, then `operation-id-reused`, then the commit with exact parents; the abort path restores the absent shape.
- **Skip-worktree case:** index-only update, bit kept, file absent, status clean, declared deletion removed.

## 3. CLI fixtures: activation fence and `.fgos/locks/` ignore

There is now one helper, `test/helpers/git-fixture.mjs`:
- `activateGitFixture`, the single fence writer. It is re-exported by `test/runner/worktree-native-fixture.helper.mjs`, and `prepareActivatedGitFixture` delegates to it.
- `initFixtureRepo(dir, {branch, message, ignore})`, which creates the seed commit, ignores `.fgos/cache/ runtime/ locks/` and writes the fence.

Callers now on the helper:
- Harness `initGitCwd`, `initGitCwdFast`, `initGitCwdInSubdir`, `initGitCwdMain`, `initGitCwdMainFast`, `initSessionSafeCwd` (`ignore: '.fgos/\n'`).
- The pr-gate repo.
- `take-pick-claim-eligibility`'s own `initGitCwd`.

Fenced after their `git add -A` seed commit, so the fence is never committed:
- `tmpLinkedWorktree`.
- The disconnected-guard fixture, which now also ignores `.fgos/locks/`.

Rerun: no `git-fence-missing` remains in these batches.

## 4. Cleanup branch delete and `merge.mjs` reads

**Cleanup.** `cleanupMergedBranch` reads the tip first. It then reclaims the checkout and deletes the branch through Refs `deleteBranchRef` with that tip as the expected value. A branch that moves meanwhile stays, with a warning. `git branch -D` is gone.

**Reads moved to Inspect:**
- `checkedOutRef`: `listWorktrees`, the row of the main checkout.
- `mergeHeadExists`: `resolveCommit('MERGE_HEAD')`. Its stale comment about aborts is replaced.
- `branchContentMismatch`'s merge-base: `resolveCommit('<merge>^1')` + `compareCommits`.
- Its merge-commit diff: paged `diff`. Inspect diff has no rename folding, so a rename names both of its ends. That can only remove a false "discarded" report, never add one.

**Still raw, no Inspect operation exists** (listed in the §13 row):
- `merge-tree`;
- `check-attr`;
- 3 × `ls-tree` on `docs/decisions/`;
- tree-to-tree `diff-tree` on `.fgos`. Inspect `diff` takes commits only, and the merge result is a tree;
- the `--ancestry-path` merge walk;
- the introduced-path diff, which deliberately keeps rename detection.

**Also fixed:** `scripts/git/e3-bench.mjs` timed the async `GitLand.prepare/publish` synchronously. It got a Promise back ("Land preparation returned no candidate"), which broke the ScopedCommit census test since unit 10. It now awaits them (`timeAsync`).

## 5. Census

`python3 scripts/git-p07-census.py --report plans/reports/scout-261020-1616-git-p07-u13-census.md` gives 5464 candidates, digest `5dbfce31…b137`. The digest was stable over three runs. One earlier run got a truncated `rg --files` listing (281 of 1965 paths) and was discarded.

The table counts the lines that are Git-shaped (`'git'`, `git(`-style wrappers, `Command::new("git")`, shell `git <verb>`), excluding test and driver families. The unit 1 census is the baseline.

| Family | Unit 1 | Now | Remaining files (count) |
|---|---|---|---|
| skills | 194 | 194 | `_shared/private-cell-worktree.md` 17 ×3 renders, `distill/scripts/distill.mjs` 13 ×3, `_shared/coding-cell-policy.md` 11 ×2, plugin `approve` 7, `pick` 6, `catchup-self-recovery.md` 3 ×3, `verify-commit-and-iron-law.md` 3 ×3, `deliver` 3, `instruction-audit` 3+2+1, about 30 single-line skill mentions |
| outer scripts | 69 | 70 | `git/e3-bench.mjs` 31, `ci-external-consumer.sh` 5, `fgos-shell-integration.sh` 5, `test-select.mjs` 5, `test-select-mutate.mjs` 4, `event-store/v-spawn-bench.mjs` 3, `measure-coordination-baseline.mjs` 3, `build-rust-distribution`/`knowledge-canary`/`knowledge-migration`/`regenerate-observe-fixtures`/`test-timing` 2 each, `prepare-release`/`run-tests`/`test-proof-inventory`/`test-select-promote-report` 1 each |
| Node readers | 52 | 52 | `state/drift-status` 9, `state/cleanup-harness` 7, `state/postland-drift` 6, `runner/claim-liveness` 5, `runner/promote-preflight` 5, `runner/attestation-guard` 4, `runner/paths` 4, `dispatch/settlement` 3, `state/store` 2, and 1 each in `cli/version`, `dispatch/assignment-runner`, `dispatch/transport`, `dispatch/trust-store`, `work-dispatch`, `state/tool-registry`, `verbs/state/move` |
| setup/hooks | 47 | 47 | `.githooks/pre-commit` 38, `setup/git-hooks` 5, `setup/registrations` 4 |
| verbs/merge and CLI | 20 | 20 | `bin/fgos.mjs` 17; `verbs/merge/approve.mjs` 1 and `sync-root.mjs` 1 (`merge-base --is-ancestor` before catchup, Inspect `ancestry` fits); `verbs/merge/merge.mjs` 1 |
| Workflow | 17 | 17 | `workflow/integrate` 12, `dir-guard` 3, `unit-handoff` 2 |
| Rust/outer readers | 15 | 15 | `observe/sources/claude_transcripts.rs` 7, `observe/sources/repo.rs` 3, and 1 each in `distribution/lib.rs`, `distribution/workspace.rs`, `herdr-fgos-common/fgos.rs`, `observe/case_journal.rs`, `observe/metrics_cli/harness.rs` |
| Land/merge/promote | 59 | 11 | `runner/merge.mjs` 10 (the wrapper definition is 2 lines; the other 8 are the raw reads above), `github-adapter.mjs` 1 |
| holder listings | 3 | 3 | `holder-lock/fences.mjs` 2, `rust/route.rs` 1 |
| production sandbox probe | 1 | 1 | `borrow_vectors.rs` (named exemption) |
| worktree/session/loop/claim | 84 | 0 | — |
| Unit commit/sync | 35 | 0 | — |
| temporary Work events | 6 | 0 | — |

## Verification

All Node commands ran as `node <wrapper> <files>`. The wrapper sets umask 077, calls `ensureGitAddon(env)` and runs `node --test`, with `FGOS_STATE_ROOT=/tmp/fgos-work/u13/state` and `FGOS_TEST_FIXTURE_ROOT=/tmp/fgos-work/u13/fixtures`, both mode 0700.

**Rust:**
- `cargo clippy --locked -p fgos-node-addon -p fgos-git -p fgos-event-store --all-targets -- -D warnings`: clean.
- `cargo test --locked -p fgos-node-addon -p fgos-git -p fgos-event-store`: every suite ok.

**Node, final batch A** (test/git/*, runner merge, merge-land, worktree, worktree-callsite-wrapper, promote-engine, merge-target-slot-multiprocess, repo-locks-multiprocess, land-vs-manual-commit, merge-quoted-paths, execution commit-unit-work and unit-sync, direct merge-gate, architecture): 452 tests, 447 pass, 4 fail.
- `legacy-event-adapter`: fails on baseline (see below).
- `refs` × 2: fail on baseline.
- `merge-target-slot-multiprocess` "no wait fails at once": a timing assertion that fails only while the CLI batch loads the machine (unit 12 saw the same). Rerun alone: 4/4, three times.

**Node, final batch B** (every CLI file using `initGitCwd*`, approve 1–7, merge*, post-merge 1–4, iron-law-gate, decision-kind, lock-fence, return*, dispatch-*, claim, disconnected-worktree-guard, e2e pr-gate): 744 tests, 676 pass, 3 fail. All three are environmental:
- `fgos-stage` "plan … READY validation" runs a confined Unit (bwrap refused).
- pr-gate (a) and (b): the runner is refused with `nested-write-from-confined-worker`, because this session is a confined worker. They now get past the fence; before, they stopped at `git-fence-missing`.

pr-gate (e) and (f), the session-guard approve tests, catchup (post-merge-3), never-created root and tsk-tr9 all pass.

**Baseline comparison.** An untouched copy of HEAD was built and run in scratch (`git archive` into its own repository, its own cargo target). Three of the four non-environmental failures in batch A fail there too, so they predate this unit:
- `test/git/legacy-event-adapter`: the hook refuses a `.fgos` deletion.
- `test/git/refs` × 2: a lock-order expectation.
- `runner/execution/run` "sibling result".

The fourth, the ScopedCommit census, failed because of the e3-bench Promise bug above; it is fixed here. Its baseline run proves nothing either way: it needs the real history, which the scratch copy lacks.

**Not run:** full `npm test`, E3, lifecycle verbs. Impact analysis was inactive (0 providers). `git diff --check` is clean.

## Next units (input)

1. `src/verbs/merge/approve.mjs:482` and `sync-root.mjs:219`: raw `merge-base --is-ancestor` → Inspect `ancestry` (two lines).
2. `merge.mjs`' 8 remaining raw reads need new Inspect operations first: tree-level merge, attribute and tree-listing reads, a tree-to-tree diff, an ancestry-path walk, and a rename-detecting diff. That is an owner/Git-component decision under RUL104, so it is not done here.
3. The families listed in the census, by owner: setup/hooks, Node readers, scripts (e3-bench 31), Rust readers, skills (source first, then render), Workflow `integrate.mjs`, `bin/fgos.mjs`.
4. Hand-rolled fixture repositories outside the named scope still bypass `initFixtureRepo`: `test/e2e/` runner-loop, compound-learn, self-improve, synthetic/marketing domain, the main-checkout hook tests, `fgos-stage`, `invocation-fault-log`, `dispatch-retired-doors`, and three in `fgos-return`.
5. Red, conflicted and promote Land candidates still have no Work acknowledgement (carried over from unit 12).

## Concerns

- In Sync, a skip-worktree declared path that Git's merge materialized is removed again only when it was absent before the merge. A pre-existing worker file there is left alone, and Worktree removal then preserves it as worker state.
- The census generator trusts `rg --files`. One run in this sandbox returned a truncated listing with exit 0.

Status: DONE_WITH_CONCERNS
Summary: Catchup now applies Land's `.fgos` store rule through Sync declarations (new `Sync.prepare` `files`, sparse-aware), reports conflicts before any checkout exists, and returns Git's own refusal text. The shim test is retargeted to a native refusal; every CLI/pr-gate fixture gets the fence through one helper; cleanup deletes through Refs; four `merge.mjs` reads moved to Inspect; the census is regenerated.
Concerns/Blockers: Remaining failures are environmental (bwrap; nested write from a confined worker) or fail on the baseline (legacy-event-adapter, refs ×2). Eight raw reads in `merge.mjs` need new Inspect operations.
Context refs:
- plans/reports/scout-261020-1616-git-p07-u13-census.md
