# loop.test.mjs A/B after T2 (Work on Event Store vs main-after-T2)

Date 2026-10-23, Asia/Saigon. Not committed.

## SHAs
- A = `origin/harden/t2-git-terminal-control` = `0565fff4f1f952d44fc2a19979b948dc6445c178` (detached worktree, removed after).
- B = `work/es-ab-t2` = `945ddc6add9cba2191ab1db7c748a898153f07ef` (pushed to origin, kept in `/home/vantt/projects/forgent-worktrees/work-es-u4`).
  - base `origin/work/es-dedupe` `7fc821347`; merge T2 -> `f7c11f3a2`; merge `origin/work/es-cutover` `2474700b1` -> `945ddc6ad`.
- Confound: cutover had already merged main, so B also carries main commits that A lacks (for example main's removal of seat-binding-conversion and its doctor row).

## Conflicts
| File | Resolution |
|---|---|
| packages/git/contracts/mutation-census.v1.json (T2 merge) | took es-dedupe side; regenerated with `git-one-door-scan.mjs --write-census` after the cutover merge |
| packages/git/rust/src/driver.rs (14 hunks, batched path read) | T2/es-dedupe side (`failure(`, GroupMiss). Git auto-merged a second `read_paths_at_many` from cutover: removed the duplicate |
| packages/git/rust/src/scoped_commit.rs | T2's `is_store_path(p)`; dropped the `legacy_events` clause (cutover removes the field) |
| packages/git/rust/tests/publication.rs | T2 side (keeps T2's two new tests) |
| src/setup/git-checks.mjs | T2's restructured `retainedLandWarning`; cutover's new wording carried over (2 strings) |
| bin/fgos.mjs | both intents: `check(repoRoot, run)` and the `detail` field |
| CHANGELOG.md | both sides kept |
| docs/platform/packaging-distribution/contracts/setup-doctor-registry.md | merged check and fix lists: T2 list + cutover's event-store-* rows, work-recorded-conflicts, 3 event-store fixes - removed rows; `seat-binding-drain` dropped (main deleted it) |

Compile adaptations (only these):
- packages/identity/rust/src/mint.rs: T2's give-back `Refusal {` needs `candidates: Vec::new()` (main added the field).
- packages/git/rust/tests/scoped_commit_sync.rs:651: cutover's new test lacked T2's 5th arg `&wal::OsFileSystem`.

`git diff --cached --stat` for the cutover merge: 346 files, about -12k lines. The deletions are main's removals (seat-binding conversion, legacy event files and their tests) and cutover's Work removals (events.mjs, compaction, truncation guard, legacy adapter, and so on). Nothing unexpected.

## Checks on B
- `cargo test --locked -p fgos-git -p fgos-event-store`: pass.
- clippy `-D warnings` (all targets) on the same crates: clean.
- Node `test/event-store` + `test/state`: 1380 tests, 1379 pass, 0 fail, 1 skipped.
- Extra, `test/git` + `test/setup`: 2 fails at first.
  - Registry doc listed `seat-binding-drain`: fixed (merge artefact); `registrations.test.mjs` 55/55.
  - `active-release-drift-check` "real builder selection": no release build in the scratch target dir. Environmental.
- Census scan still prints 5 `unresolved-binary` sites (goal-check, merge, worktree). They are main's code; not diffed against main's census.

## Four runs (`FGOS_TEST_FILE_TIMEOUT_MS=900000`, runner `fr.mjs <worktree> test/runner/loop.test.mjs`)
Warm-up: `test/cli/fgos-read.test.mjs` on both sides first (6/6). Load before start 1.99 (HARDEN suite ended 15:56; coordinator hold released).

| # | side | start | end | load start/end | wall | result |
|---|---|---|---|---|---|---|
| 1 | A | 15:56:20 | 16:01:12 | 1.99 / 1.82 | 292 s | pass (98) |
| 2 | B | 16:01:12 | 16:10:14 | 1.82 / 2.01 | 542 s | pass (99) |
| 3 | A | 16:10:14 | 16:15:14 | 2.01 / 1.79 | 300 s | pass (98) |
| 4 | B | 16:15:14 | 16:24:16 | 1.79 / 1.85 | 542 s | pass (99) |

B/A: pair 1-2 = 1.86; pair 3-4 = 1.81 (B mean 542 / A mean 296 = 1.83). B has one more test (99 vs 98) than A.

## strace, single case "announce line" (through the runner with `--test-name-pattern`, execve + fsync/fdatasync, successful execs)
| side | git execs | bwrap execs | fsync+fdatasync |
|---|---|---|---|
| A | 187 | 156 | 158 |
| B | 360 | 275 | 345 |

B/A: git 1.93x, fsync 2.18x. The first strace attempt ran plain `node --test`, which lacks the runner's host env, so the case failed (`host-missing`); it was redone through the runner.

## Conclusion
- B is about 1.83x A, above the 1.2x bar, in both pairs. Fail against the review bar.
- Absolute wall of B is 542 s, under the 600 s per-file limit (58 s margin, about 10%). Passes the limit, but only just.
- Machine load was low (<2.1) for all four runs, so the gap is not noise. It is consistent with roughly twice the git processes and fsyncs per Work operation on B.
- Not isolated here: how much of the gap is Event Store versus main's other commits in B. The 1.2x bar is not met either way.

## Unresolved
- Whether the 1.2x bar is measured against A with or without main's commits that B carries (they come in through cutover's earlier main merge).
