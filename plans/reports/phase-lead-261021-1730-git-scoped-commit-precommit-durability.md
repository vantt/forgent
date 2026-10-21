# ScopedCommit pre-commit object durability: implementation report

Worktree `git-fu`, branch `git/followups` (from `origin/main` b4df2116d), 2026-10-21 Asia/Saigon, ext4 on NVMe, real host. Closes the "unacknowledged window" of `plans/reports/phase-lead-261021-1713-git-scoped-commit-object-durability.md`.

## What changed

1. **Staged blobs and trees are durable before `git commit`** (`scoped_commit.rs`). After `git add -A` the code now runs `write-tree`, then one `diff-tree --raw -t -r --no-abbrev --no-renames -z <baseline> <tree>`. That call **replaces** the old `diff --cached --name-only` staged-set read, so the Git child count is unchanged. Why not the index diff: `diff --cached -t` never lists trees (checked: only blobs, null old oids), so subtree oids would need an extra child; `diff-tree` lists changed trees and blobs with their new oids. The set check is the same (files of the diff equal `selected`, via the same `RawEntry::is_file` the post-commit step uses). `sync_loose_objects(.., true)` then runs on root tree + every non-gitlink new entry (one concurrent batch: files, fan-outs, `objects/`), before the WAL intent. A refusal there is a pre-attempt failure: HEAD unchanged, index reset, bytes restored. New checkpoint `staged-object-durable` (once per staged object) on the existing `_with_filesystem` seam.
2. **Post-commit batch unchanged in shape**: still `sync_commit_effects` (objects batch concurrent with the ref chain, before the receipt). It still receives every object of the observed commit, so a hook that changed the tree is covered; the shared memo skips blobs/trees already made durable, leaving the commit object, its fan-out and `objects/` (plus anything new). No fsync removed.
3. **Recovery robustness**: the reflog walk (`log -g`) in `observe_checkout_commit`, and the `diff --name-only` and `rev-list --objects` in `recover_scoped_commit`, map a generic Git failure to `RecoveryRequired` with cause `commit-objects-unreadable` (stderr kept). The branch is never reset and the chain keeps no outcome (evidence preserved, spec section 9).
4. **E1** (`scripts/git/e1-power-cut.mjs`): scoped `check` no longer excuses any fsck error; it now requires the last acknowledged commit and (when the branch is ahead) the branch tip to list (`rev-list --objects`) and read fully (`archive`), and `fsck --full` clean. A missing tip commit with the branch still at the previous readable commit passes trivially (no ref names the absent object). New trace rule **R7**: every blob/tree of a scoped op (all objects but the observed commit) has its file, fan-out and `objects/` fsynced before the ref rename that moves the branch.
5. Spec section 10 "ScopedCommit objects" paragraph rewritten (pre-commit batch, post-commit batch, unreadable-tip recovery, E1 rules); `CHANGELOG.md` `[Unreleased]` line updated; census regenerated (0 undeclared sites, 6 hash lines).

## Owning proofs

| Behaviour | Proof |
|---|---|
| Staged objects (4 for `deep/er/file`: root tree, 2 subtrees, blob) are durable while HEAD is still the baseline; the commit's 5 objects at `object-durable` after the branch moved and with no receipt | `tests/scoped_commit_sync.rs::scoped_commit_makes_staged_objects_durable_before_the_branch_moves_and_the_commit_before_the_receipt` |
| A refusal at the staged step never reaches `git commit`: HEAD, index and producer bytes unchanged, no `object-durable` step | `a_refused_staged_object_sync_never_reaches_git_commit` |
| Recovery makes all 5 objects durable before reporting `Commit` | `recovery_makes_the_new_objects_durable_before_it_reports_the_commit` |
| Unreadable blob or absent commit object of an unacknowledged tip: `RecoveryRequired` / `commit-objects-unreadable`, branch unchanged, chain open | `recovery_of_a_tip_with_an_unreadable_object_names_the_cause_and_keeps_the_evidence` |
| Real syscall order on ext4 | E1 trace rules R5/R6/R7 |

Unchanged owners: `objects.rs` unit tests, `publication.rs` tests, `observation_tests` (raw parsing).

## Rule fails before, passes after (unprivileged trace + order, 12 scoped ops, `--addon/--host`)

| Binary | fsyncs | violations |
|---|---|---|
| original (39c6362db, no object sync) | 262 | 204 = R5 60, R6 48, R7 96 |
| previous unit (b4df2116d) | 394 | **96 = R7 only** (12 ops x 4 staged objects x file, directories) |
| this change | 406 | **0** |

Publication trace: 386 fsyncs, 0 violations. Scoped `check` smoke on a real run: clean at acked 0/2/4; after emptying a blob of the unacknowledged tip, `check --acked 2` now reports `branch tip: tree not fully readable` plus fsck (it was excused before). Root replay not run (needs dm-log-writes; owner's).

## Measurement (warm p50 / p95 of preflight + commit, ms)

`bench-copy.mjs probe --which port --warm 1 --n 40`, interleaved, 3 rounds, 1-min load < 3 (max 1.9), JSON/logs on tmpfs, repos on ext4.

| | p50 | p95 |
|---|---|---|
| previous unit | 147.5 / 148.1 / 148.1 | 152.0 / 151.4 / 151.3 |
| this change | 152.3 / 152.5 / 153.1 | 156.3 / 155.3 / 156.1 |
| change | +4.4 | +4.5 |

Commit step 128-129 to 133-134 ms; preflight unchanged (~19). Budget p95 250 ms: met, ~94 ms headroom.

## Gates

- `cargo test -p fgos-git`: all green; `cargo clippy -p fgos-git --all-targets -- -D warnings`: clean.
- Node focused (scoped-commit, one-door, sync, recovery, e3-census, commit-parent-death, cutover-grant): 54 pass.
- Full `npm test` (tracked config swapped in, stub restored, never committed): 8774 tests, 8677 pass, 0 fail, 32 skipped, 65 todo.

## Notes

- Index files are still not fsynced (not part of the receipt contract).
- `commit-objects-unreadable` is applied to any Git failure of those three reads, not only a missing object; all are recovery-required with stderr kept, so nothing is reset either way.
- The `.sh` multi-kind E1 loop and root replay are unchanged and not run here.

## Unresolved questions

None.

Status: DONE
Summary: Staged blobs and trees are now fsynced (one concurrent batch, listed by one `diff-tree` that replaces the staged-set read, no new child) before `git commit`; recovery names `commit-objects-unreadable` for an unreadable unacknowledged tip; E1 scoped check is strict and R7 fails on the previous binary (96) and passes after (0). Warm p95 ~156 ms (+4.5 ms), all gates green.
