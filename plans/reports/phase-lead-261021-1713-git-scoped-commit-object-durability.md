# ScopedCommit object durability: implementation report

Worktree `git-fu`, branch `git/followups` (from `origin/main` 39c6362db), 2026-10-21 Asia/Saigon, ext4 on NVMe, real host. Follows `plans/reports/debug-261021-1639-scoped-commit-object-dir-durability.md`.

## What changed

1. **One shared durability function.** New `packages/git/rust/src/objects.rs`: `sync_loose_objects(common_dir, oids, sync_files) -> io::Result<Vec<PathBuf>>`. For every oid that has a loose file and is not in the `durable_objects` memo (moved here from `publication.rs`, unchanged logic, keyed by common dir instead of `RepoHandle`) it fsyncs the file (when `sync_files`), the fan-out directory and `objects/` in one `fgos_durable_file::sync_directories` batch, then remembers the oids. Packed objects are skipped. Symlinked directories and non-regular loose files are refused. `Publication::sync_object` now calls it with `sync_files = false` (Git already fsynced those files under `core.fsync=all`), so its fsync set and its `publication-directory-fsync` / `object-durable` checkpoints are unchanged; the old `object_dirs` / `sync_dirs` / memo code was deleted from `publication.rs`.
2. **ScopedCommit.**
   - The fused post-commit `show` now uses `--raw -t -r --no-abbrev` instead of `--name-only` (same single child; the foreign-parent fallback `diff` got the same flags). `split_observation` returns the header plus the raw tail; `raw_entries` parses `:old new oid oid status NUL path NUL` records. The committed file set is the entries whose old or new mode is not a tree or zero (identical to what `--name-only` listed, including file/directory replacement); the new objects are the commit, the root tree (`%T`) and every entry with a non-zero, non-gitlink new mode (changed trees and blobs).
   - `sync_commit_effects` runs `refs::sync_refs` and `sync_loose_objects(.., true)` concurrently (scoped thread) and returns only when both finished. It is the `alongside` closure of `append_ordered`, so the `Commit` outcome record is installed only after the objects, the ref chain and the record's own bytes are durable.
   - `recover_scoped_commit` calls the same function before it records `Outcome::Commit`; the oid set there comes from `rev-list --objects <observed> ^<baseline>` (recovery only, not on the budget).
3. **Test seam (why).** ScopedCommit had no filesystem seam, and no fsync is observable from the outside without strace. Following Land's `*_with_filesystem` precedent I added `scoped_commit_with_filesystem` / `recover_scoped_commit_with_filesystem` taking `&dyn wal::FileSystem`; the plain methods pass `OsFileSystem`. The only checkpoint it carries is `object-durable` (Publication's existing name), fired once per new object after the batch, before the receipt. No env switch or test-only branch.
4. **Docs/records.** `docs/platform/git/spec.md` section 10 gets a "ScopedCommit objects" paragraph (receipt binding, not pre-ref order; the unacknowledged window). `CHANGELOG.md` `[Unreleased]` line. `packages/git/contracts/mutation-census.v1.json` regenerated (hashes plus one `rust-test` git spawn in the new `objects.rs` unit tests; the e3 census test passes, Git child count unchanged).

## Owning proofs

| Behaviour | Proof |
|---|---|
| A loose object gets file + fan-out + `objects/` in one batch, only once; a recreated file is synced again; `sync_files=false` skips the file; several objects share one `objects/`; packed or absent objects need nothing; a symlinked fan-out is refused | `objects.rs` unit tests (4) |
| Parsing of raw records: files vs trees, deletions, gitlinks, file replaced by directory, path with a newline, malformed shapes | `scoped_commit.rs::observation_tests` (replaces the name-only cases) |
| A scoped commit of `deep/er/file` reaches the durability step once for each of its 5 new objects (commit, root tree, two subtrees, blob; compared with `git rev-list --objects`) and no receipt exists at any of those steps | `tests/scoped_commit_sync.rs::scoped_commit_makes_each_new_object_durable_before_the_receipt` |
| A refusal at the durability step leaves the commit without a receipt; recovery then reaches the same step for all 5 objects before it reports `Commit` | `tests/scoped_commit_sync.rs::recovery_makes_the_new_objects_durable_before_it_reports_the_commit` |
| Publication unchanged | existing `tests/publication.rs` (incl. `recreated_loose_object_gets_directory_durability_again`) green, unmodified; its strace fsync count is identical before and after (386 on the 12-op trace) |
| Real syscall order on ext4 | E1 `trace` + `order` rules R5/R6 below |

## E1 coverage (`scripts/git/e1-power-cut.mjs`, `.sh`)

- `workload`/`check`/`trace` take `--kind publication|scoped` (default publication). Scoped workload: one repository, one linked worktree with custody and the activation fence; each operation preflights, writes `d<i>/n/f<i>` (new blob, two new trees, new commit), logs `intent` then, after the receipt, `ack` with the oid and files, with the same `--handshake` marks.
- Scoped `check`: `fsck --full --no-dangling`; the last acknowledged commit must be an ancestor of `refs/heads/producer`, its objects listable and `git archive` of it must read every tree and blob; every acknowledged WAL chain terminal. Git moves the branch before the receipt, so a commit after the last acknowledgement may sit on the branch with non-durable objects; `fsck` lines naming only oids outside the last acknowledged commit are excused (only while the branch is ahead of the last ack). Smoke-checked on a real run: an emptied blob of an acknowledged commit is reported, an emptied blob of the unacknowledged tip is excused.
- `checkOrder` (R5/R6, scoped operations only, window = plan `intent` line to outcome record): R5 fan-out directory and `objects/` fsynced after the object's `link` and before the outcome; R6 the object file fsynced (tmp name before the link, or own name) before the outcome. R2 is no longer evaluated for ScopedCommit (its `next` is its baseline, so R2 only ever checked an unrelated fixture object).
- `trace --addon <.so> --host <fgos>` stages prebuilt binaries inside the checkout (`.fgos/runtime/tmp`, removed on exit) so two binaries run the same workload. `.sh` runs both kinds back to back (`--kind publication|scoped|both`, default both; `--ops` default 24 / 12), the verdict has a `kinds` array. The root replay was not run (owner does it); `bash -n` clean.

### Pre-fix vs post-fix (unprivileged trace + order, 12 scoped ops, ext4)

| Binary | records | fsyncs | violations |
|---|---|---|---|
| pre-fix (`sc-durable-fix/pre`, built from 39c6362db) | 48 | 262 | **108** = 12 ops x (5 R5 + 4 R6); the commit object passes R6 (Git fsyncs it), every blob/tree fails R6, every object fails R5 |
| post-fix | 48 | 394 | **0** |

Publication trace: 0 violations pre and post, 386 fsyncs both.

## Measurement (warm p50 / p95 of preflight + commit, ms)

`e3-breakdown/bench-copy.mjs probe --which port --warm 1 --n 40`, interleaved pre/post, 3 rounds, started only with 1-min load < 3 (max 0.4 to 1.7 during runs), JSON and logs on tmpfs (`/dev/shm`), repositories on ext4. The probe commits a change to one existing file (3 new objects: blob, root tree, commit).

| | p50 | p95 |
|---|---|---|
| pre-fix, 3 rounds | 139.2 / 139.5 / 140.0 | 144.2 / 143.9 / 142.9 |
| post-fix, 3 rounds | 146.3 / 148.1 / 147.8 | 150.6 / 152.2 / 150.5 |
| change | about +7.8 ms | about +7.3 ms |

Commit step p50 121.4 to 128.3 ms; preflight about 18 to 19 ms both. Budget p95 <= 250 ms: met with about 98 ms headroom. The cost is above the diagnosis estimate (+0 to +6 ms) because the object files themselves are now fsynced for the first time (about one extra journal commit round).

## Gates

- `cargo test -p fgos-git`: 254 passed, 0 failed. `cargo clippy -p fgos-git --all-targets -- -D warnings`: clean.
- Node: `test/git/scoped-commit.test.mjs` + `one-door.test.mjs` (32 pass); `sync`, `recovery`, `e3-census`, `commit-parent-death`, `cutover-grant` (22 pass).
- Full `npm test` (tracked `.fgos/config.json` swapped in, stub restored and never committed): 8774 tests, 8677 pass, 0 fail, 32 skipped, 65 todo.
- Census regenerated with `node scripts/git-one-door-scan.mjs --write-census` (0 undeclared sites).

## Residual risks and notes

- **Unacknowledged window (by design of the chosen order).** Git moves the branch inside `git commit`; blobs and trees are made durable only before the receipt. A cut between the ref move and the receipt can leave the branch naming a commit with an empty tree or blob. It carries no receipt; recovery observes it and makes its objects durable, but if an object is already unreadable on disk `rev-list` in recovery may fail and recovery would report an error instead of `Commit`. Closing it needs the blobs and trees synced before `git commit` (one extra serial round, roughly 5 to 10 ms by the diagnosis); not done, owner's call. The zero-length consequence is still inferred from ext4 delalloc rules and the trace, not reproduced; the owner's scoped E1 replay settles it.
- The index files are not made durable (optional hardening in the diagnosis; not part of the receipt contract).
- Windows: the file fsync half is `#[cfg(unix)]`, as the rest of the durability code.
- The E1 `.sh` multi-kind loop was not executed (needs root and dm-log-writes); syntax checked and the unprivileged `trace`/`check` halves exercised.

## Unresolved questions

- Does the owner want blobs and trees synced before `git commit` (spec section 10 literal order) at about +5 to 10 ms more?

Status: DONE_WITH_CONCERNS
Summary: ScopedCommit now fsyncs each new loose object (file, fan-out, `objects/`) in one concurrent batch with the ref chain before the receipt, live and in recovery, through one function shared with Publication; E1 gained a scoped kind with R5/R6 order rules (108 violations pre-fix, 0 post-fix). Warm p95 150 ms (+7 ms), all gates green.
Concerns/Blockers: root E1 replay not run (owner); the window between Git's ref move and the receipt still exposes non-durable blobs/trees on an unacknowledged commit unless pre-ref sync is added.
