# Phase 10 report: Git crate and addon read process facts through fgos-process

Branch `one-door-debt/p10`, base `67b2ab3d6` (origin/main, phase 08 landed).

## Changes

- `packages/git/rust/src/worktree.rs`: the `/proc/<pid>/comm` read after `observe` is `fgos_process::facts::command_name_of`;
  when the platform has no answer it falls back to the first cmdline word, then `unknown` (same fallback as the old non-Linux arm).
- `packages/git/node-addon/src/single_load.rs`: the three per-platform start-time reads (`/proc/self/stat`, `GetProcessTimes`,
  `proc_pidinfo`) are gone. One pure `marker_id(pid, StartTime)` builds the name part from the typed parts:
  Linux `{pid}-{ticks}`, Windows `{pid}-{high}-{low}`, macOS `{pid}-{sec}-{usec}` (unpadded). `own_marker_id` reads
  `self_start_time()`. Two addon copies in one process still compute the same name, so they collide as before.
- `docs/architecture-manifest.json`: removed the `single_load.rs` debt from the start-time row and the `worktree.rs` and
  `single_load.rs` debt from the `/proc` row. The `single_load.rs` entry in the kernel-lock row stays (out of scope).
- Net: `single_load.rs` about -45 non-test lines, `worktree.rs` -9.

## Proofs

- Golden marker-name tests per platform in `single_load.rs` (they run on every host because `StartTime` is not cfg-gated):
  why new: the start-time source changes underneath the name. A fourth test proves this process names the same marker twice.
- Existing owners unchanged: `cargo test -p fgos-git`, `test/git/native-load.test.mjs` (single load).

## Gates (all green)

fmt check; clippy `-p fgos-git -p fgos-node-addon --all-targets -D warnings`; `cargo test -p fgos-git` (89 + others pass);
`cargo test -p fgos-node-addon single_load` (4 pass); `cargo check --all-targets` for x86_64-pc-windows-msvc and aarch64-apple-darwin;
run-tests on native-load, one-door, architecture, doc-health, git-mutation-census (91 pass, 1 skipped, 0 fail);
`check-decision-citation-drift` no new findings; `git-one-door-scan` 0 undeclared sites, census file unchanged.

## doors rows after the phase

- start time of a process: debt = `helper.rs`, `route/hold.rs`, `borrow_vectors.rs` (phase 09); `allowed` unchanged.
- `/proc` row: debt for the git files gone; remaining debt is holder-lock, terminal-control `herdr.rs`, scripts.

## Notes

- Windows `command_name_of` returns `None`, so the warning text uses the cmdline fallback there, as it did before.
- CHANGELOG: no user-visible line.

## Lessons

- A pure function over the typed value (`marker_id`) makes the per-platform name form testable on every host, which cfg-gated
  readers never were.
- Check that a manifest edit that drops the last array entry also fixes the trailing comma before running the check.

## Authority

None.
