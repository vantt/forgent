# A/B with HARDEN's HEAD-in-tip-listing: loop.test, CLI move sequence, strace

Date 2026-10-23 (Asia/Saigon). Not committed.

## SHAs
- A = `origin/harden/head-in-tip-listing` = `fa8f0b88562b12ff8247db4de5b6d1e73c066829` (detached worktree, removed). Main after T2 plus the HEAD-listing change; Work still on events.jsonl.
- B = `work/es-ab-head` = `9c376bffc24881b5585a7f492268aa41acf61f7f` (pushed, kept in `/home/vantt/projects/forgent-worktrees/work-es-u4`).
  - merge chain: A -> es-dedupe `7fc821347` (`1c3c011ed`) -> es-cutover `04315bdac` (`51ee8c6a1`) -> fixup commit `9c376bffc`.

## Conflicts and resolutions
| File | Resolution |
|---|---|
| packages/git/contracts/mutation-census.v1.json | took HARDEN side, regenerated with `--write-census` (fixup commit) |
| packages/git/rust/src/driver.rs (14 hunks) | HARDEN/es-dedupe side; one duplicate `read_paths_at_many` that git auto-merged was removed |
| packages/git/rust/src/scoped_commit.rs | HARDEN `is_store_path(p)`, dropped the `legacy_events` clause |
| packages/git/rust/tests/publication.rs | HARDEN side |
| src/setup/git-checks.mjs, bin/fgos.mjs, CHANGELOG.md | same as the earlier es-ab-t2 build (T2 structure, cutover wording and `run` argument, both changelogs kept) |
| docs/platform/git/spec.md, docs/specs/distribution.md rows 7/7b, setup-doctor-registry.md | check and fix lists merged by set arithmetic (HARDEN + cutover's event-store-*, work-recorded-conflicts, event-store fixes - removed rows) |
| **packages/event-store/rust/src/read.rs (3 hunks)** | **HAND-MERGE, not a side pick.** HARDEN's HEAD-from-tip-listing (`tips()` returns the listed HEAD) collided with cutover's memoized `legacy_view`. Kept cutover's code and threaded HARDEN's listed HEAD into `legacy_view` as an `Option<HeadFact>` taken once; it replaces `resolve_head` only when the authority checkout equals the listed repo (same rule as HARDEN's `read_legacy`). Coordinator approved keeping it as is. |

Compile fixes: `scoped_commit_sync.rs:651` needs T2's 5th argument `&wal::OsFileSystem` (kept). A blind `candidates` field added to `mint.rs` was wrong this time (HARDEN's branch already has it): removed in the fixup commit.
Deletions in the cutover merge (19 files) are Work's own removals (events.mjs, compaction, truncation guard, legacy adapter, their tests and fixtures).

## Checks on B (done before the timing runs)
- `cargo test --locked -p fgos-git -p fgos-event-store`: pass. Clippy `-D warnings`, all targets: clean.
- Node `test/event-store` + `test/state`: 1390 tests, 1389 pass, 0 fail, 1 skipped.
- Extra `test/git` + `test/setup`: 1062 pass, 1 fail (`real builder selection ... agree with doctor`): no release build in the scratch target dir; environmental.
- Census scan still prints 5 `unresolved-binary` sites from main's code (goal-check, merge, worktree).

## Run 1: test/runner/loop.test.mjs (`FGOS_TEST_FILE_TIMEOUT_MS=900000`, via `fr.mjs`)
Warm-up with `test/cli/fgos-read.test.mjs` on both (6/6). Load before the first run 2.93 (gate: below 3), 1.5 to 2.0 during all runs.

| # | side | start | end | load start/end | wall | result |
|---|---|---|---|---|---|---|
| 1 | A | 20:31:49 | 20:36:41 | 2.93 / 1.99 | 292 s | pass (98) |
| 2 | B | 20:36:41 | 20:43:32 | 1.99 / 1.72 | 411 s | pass (99) |
| 3 | A | 20:43:32 | 20:48:23 | 1.72 / 1.70 | 291 s | pass (98) |
| 4 | B | 20:48:23 | 20:55:14 | 1.70 / 1.56 | 411 s | pass (99) |

B/A: pair 1-2 = 1.41, pair 3-4 = 1.41. Mean B 411 s / mean A 291.5 s = 1.41. (Previous build on T2 tip: 1.83, B 542 s.)

## Run 2: CLI sequence
Fresh `initGitCwd` Work fixture per run (each side's own harness: A on events.jsonl, B on the Event Store). One item added, then 10 status moves (`move ab-item-1 --to blocked|todo`, alternating), each a separate `node bin/fgos.mjs` process of the working tree via the CLI test harness's `run` (the way the repo's CLI tests invoke it; not `npm run fgos:dev`). Fixture creation is outside the timing. Test file: `ab3-cli-seq.test.mjs` in the scratchpad.

| # | side | total (10 moves) | median per move | per-move range |
|---|---|---|---|---|
| 1 | A | 2407 ms | 237 ms | 210-264 |
| 2 | B | 8706 ms | 875 ms | 780-929 |
| 3 | A | 2394 ms | 239 ms | 215-263 |
| 4 | B | 8686 ms | 883 ms | 753-908 |

B/A: pair 1-2 = 3.62 total (3.69 median); pair 3-4 = 3.63 total (3.69 median). Highly repeatable. Each CLI move costs about 0.64 s more on B.

## Run 3: strace of the "announce line" case (via the runner with `--test-name-pattern`)
Counting: git exec = successful `execve` whose program path ends in `/git` (a bwrap-wrapped git counts once, as its inner git exec); fsync = `fsync` + `fdatasync` calls across all processes (`strace -f`). Identical on both sides.

| side | git execs | bwrap execs | fsync + fdatasync |
|---|---|---|---|
| A | 177 | 146 | 146 |
| B | 239 | 189 | 229 |

B/A: git 1.35, fsync 1.57.

## Conclusion
- loop.test: B is 1.41x A, still above the 1.2x bar (about 120 s over a 1.2x allowance of 350 s). Wall 411 s, under the 600 s limit with 189 s margin. Improved from 1.83x (542 s) on the earlier T2-tip build; the git exec count dropped from 360 to 239 for B in the strace case while A's moved 187 to 177.
- CLI sequence: the person-typing-commands path is much worse than the loop, 3.6x (about 0.88 s per `move` against 0.24 s). It is not caused by load. This is the largest remaining gap and matches the note that each CLI command still seals once (open-log seal plus ref work per process).
- This was not isolated to the Event Store versus other main commits B carries via cutover's main merge, nor to read.rs's hand-merge; the hand-merge only touches how the HEAD fact reaches `legacy_view`.
- Cleanup done: A worktree and both target dirs removed; `work/es-ab-head` kept.

## Unresolved
- What the 1.2x bar should be for the CLI path (it is measured at 3.6x here); whether the per-process seal cost is expected or reducible.
