# ScopedCommit: empty loose objects (source, healing, E1 fixture)

Date: 2026-10-21. Branch `git/followups`. Evidence: owner root E1 run on main 6048ab647 (ext4 on dm-log-writes): scoped 24/435 fail (`empty` objects, `missing blob`, branch not moved), publication 2/1036 fail (`packed-refs line 1 not terminated`, acked 12).

## 1. Empty objects prevented at the source

`git add` and `write-tree` in ScopedCommit now run with `-c core.fsync=loose-object` (`scoped_commit.rs`, one `stage_selected` step).

strace, Git 2.53.0, fresh blobs/trees, unprivileged:

| command | result |
|---|---|
| `add`, `core.fsync=loose-object` | per object: `fsync(tmp_obj)` then `link(tmp_obj -> final)` |
| `write-tree`, same | same, one fsync+link per new tree; index rename is not fsynced (index is outside the receipt contract) |
| `add`/`write-tree` default | no fsync |
| `mktree`, even `core.fsync=all` | `link` only, no fsync (confirmed: ignores core.fsync) |
| `add` of content whose object already exists loose | no write, no fsync (Git freshens) |
| `add`, `core.fsyncMethod=batch` | first object: `sync_file_range` writeout then `link` to final name BEFORE the bulk fsync; the rest go to a temp objdir |
| `pack-refs --all`, `core.fsync=all` | `fsync(packed-refs.new)` then `rename` |

Decisions:
- Default fsync method, not `batch`. Batch links the first object of a run to its final name after only a writeout hint, which is the object a cut can leave empty; it would keep a (small) window, so the stated goal ("only a temp file, never an empty final object") needs the per-object fsync.
- `sync_staged_objects` stays unchanged (files + fan-out + `objects/`). Git's fsync covers only objects Git wrote in this run; an object that already existed loose (plain Git, a hook, an earlier release; core.fsync default excludes loose objects) is freshened and never fsynced, and Git fsyncs no directory. So the file fsync is not provably redundant and I removed nothing. It is cheap on files Git just synced.
- Trace rule R8 added to `e1-power-cut.mjs`: each staged object's temp file is fsynced before its link. Fails on the previous binary (48 violations over 12 ops), passes on the new one.

## 2. Corrupt objects already on disk: heal, else refuse

- `objects.rs`: `corrupt_loose_objects(common, oids)` (loose file empty or not starting with a valid zlib header; two-byte read, no inflate); `sync_loose_objects` now refuses any such file with `object-file-corrupt` instead of fsyncing it (all callers).
- `scoped_commit.rs` `stage_healed`: stage, check the staged blobs/trees, and on a corrupt one remove the file, drop the selected paths from the index (`update-index --force-remove`, which also invalidates cached trees) and stage again; max 8 rounds, then refuse `object-file-corrupt`. Empirical finding: with an empty tree object `git diff-tree` itself fails (`checkout-command-failed`, `bad object <oid>`), so the check cannot rely on the listing. On that failure the oids Git printed are extracted and each is validated by file state (not by message text), so a genuine other failure is returned unchanged. Refusal happens before `git commit`; the existing rollback leaves HEAD and index as they were.
- Owning proofs (`packages/git/rust/tests/scoped_commit_sync.rs`): `staged_objects_a_cut_left_empty_are_healed_so_the_commit_names_readable_objects` (all four objects emptied, then blob only; commit readable, `fsck --full --strict` clean, files non-empty; before the change this failed with `checkout-command-failed`) and `a_corrupt_staged_object_that_cannot_be_healed_refuses_before_git_commit` (read-only fan-out dir; skipped for euid 0 because permission bits do not bind root; HEAD, index, worktree unchanged). Unit proof in `objects.rs`: `an_empty_or_non_zlib_loose_file_is_reported_and_never_synced`.
- Known limit: a truncated zlib stream behind a valid header is not detected (needs inflate); it is not what a cut of this window produces (empty).

## 3. E1 fixture

`pack-refs --all` in `scripts/git/e1-power-cut.mjs` runs with `-c core.fsync=all`; the `sync --file-system` after it stays for the rename and removed loose refs. Unprivileged trace shows `fsync(packed-refs.new)` then `rename`. Trace rule R9 (packed-refs installed by rename needs its new file fsynced first) fails with the old fixture command and passes now. The scoped check is untouched (strict, nothing excused).

## 4. Unprivileged trace, 12 ops

| kind | binary | fsyncs | violations |
|---|---|---|---|
| scoped | previous (main) | 406 | 48 (all R8) |
| scoped | this change | 454 | 0 |
| publication | this change + fixed fixture | 387 | 0 |

## 5. Cost: warm preflight+commit, p50 / p95 ms

`bench-copy.mjs probe --which port --warm 1 --n 40` (method of the previous report), interleaved prev/new, both orders, release binaries, repos on ext4. Other sessions load this host; rounds disturbed by external I/O hit both variants (prev 197/216/227, new 222/233/243/245 p95) and are excluded below.

| | p50 | p95 |
|---|---|---|
| previous, calm rounds (n=8) | 153.0 to 155.7 | 157.3 to 164.0 |
| this change, calm rounds (n=6) | 158.3 to 160.1 | 163.1 to 166.7 |
| change | about +5 | about +4 |

Four serial fsyncs per commit. Budget p95 <= 250 ms met with ~85 ms headroom in calm conditions; under heavy external I/O the tail reached 243-245 ms (the previous binary reached 227), so the margin there is thin.

## Gates

- `cargo test -p fgos-git`: 260 passed, 0 failed. `cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings`: clean.
- Focused node (scoped-commit, one-door, e3-census, commit-parent-death, recovery, sync): 50/50.
- Full `npm test` (tracked config in place, stub restored after): 8778 tests, 8679 pass, 2 fail, 32 skipped. The 2 failures are wall-clock tests unrelated to Git (hot-lock 10% speed ratio, runner loop overlap in wall time) at host load 17-23; both pass on rerun at lower load (hot-lock file, then `test/runner/loop.test.mjs` 104/104).
- `node scripts/git-one-door-scan.mjs --write-census`: 0 undeclared; census line numbers regenerated.
- Docs: `docs/platform/git/spec.md` §10 ScopedCommit objects paragraph, `CHANGELOG.md` `[Unreleased]`.

## Not done / owner

- Root E1 replay (dm-log-writes) needs the owner's machine: rerun scoped and publication; expected 0 and 0.
- Install: plain `fgos` runs the activated release; this takes effect after the release is rebuilt and activated.

## Unresolved questions

None.
