# HARDEN ci main-last-reds: lead report

Date: 2026-11-13. Lane: `harden/ci-last-reds`, worktree `forgent-worktrees/harden-ci-last-reds`. Goal: CI and
Release assets check green on main so tag v0.2.0-rc.7 can be cut.

## Reds and causes

| # | Run (main) | Job / test | Cause | Fix |
|---|------------|------------|-------|-----|
| 1 | CI 43294269081 (321b32c3b) | `cargo (workspace)`, `mailbox_routes.rs:3000` `a_body_push_the_remote_refuses_..._until_it_is_retried`, left 0 right 1 | Test race. A recorded cross-machine send spawns a detached `hook mailbox-sync` child (`apps/fgos/src/wiring/mailbox_remote.rs:679`) that pushes the event. The test's foreground `sync_child(alpha)` finds the seal held and skips; `sync_child(beta)` fetches before the push lands. Intermittent: passed on 3b9f60a04 and 2dac30687 with no apps/crates change. | `16724463a`: `sync_child_said` first waits (60 s bound, loud failure) until no detached sync child of that scene runs, found through `fgos_process::facts::scan`. The wake proof's 40x retry loop that hid the same race became one pass. No assertion changed; no production change. OPC MERGE. |
| 2 | Release assets check 43294269074 (321b32c3b) | `focused tests (windows-latest)`, `fgctl-upgrade.test.mjs` "P7: Repair local tail failure ...", `ENOTEMPTY rmdir ...\releases\sha256-...\bin` in `finally` | Windows delete-pending files in a release `bin` whose executables just ran (closing image handle or on-access scan). No process outlives fgctl: every spawn on the path is synchronous (`packages/distribution/rust/src/init.rs:761`, `git_gate.rs:95`). Intermittent: same test green on branch run 43288404196 and on main f9bf62e30. | `40c3df9f6`: one `removeTree` in `test/rust-host/fgctl-init-fixture.mjs` (retries 10 x 100 ms, still throws) used for every fixture tree removal in the Windows-run fgctl files and the init tail-failure file; the one-off inline retry from 7980b494e goes through it. |
| 3 | CI 43347445885 (f9bf62e30, docs-only) | `cargo (workspace)`, both `internal_lock_routes` `quiesce_scan_*` tests: scan exited 0, `clean`, `unreadable 0`, while the child was live | Production fail-open. Rust `spawn` returns once exec closes the close-on-exec pipe; the new image publishes its argv later, and in that window `/proc/<pid>/cmdline` reads empty. `could_be_fgos(Some([]))` is false, so the gate reported the workspace clean. 1 of the last 13 main runs. | `0edd2dca6`: `read_cmdline` in `packages/process/rust/src/platform/linux.rs` re-reads an empty argv for up to 250 ms when the exe is readable (kernel threads, zombies and foreign processes are read once). Unit proof `an_argv_still_empty_inside_exec_is_read_again_until_it_appears`. OPC MERGE. |

Only the CI cargo job failed for cargo test; cargo stops at the first failing test binary, so red 3 was
masked by red 1 on 321b32c3b (internal_lock_routes runs before mailbox_routes; it passed there).

## Proof

- Red 1: did not reproduce naturally in 188 local runs (empty HOME/XDG, git identity and git-lfs filter
  keys only in HOME, no machine id, CPU load, 2-CPU pinning). Forced repro (SIGSTOP the detached child
  while it holds the lock) failed 6/6 with exactly left 0 right 1 before the fix. With the fix, the same
  SIGSTOP repro: the filter found the child right after the send (pids `[460537]`, main
  `/tmp/fgos-mailbox-routes-xsend-alpha-.../main`), and `sync_child(alpha)` panicked after 60.02 s with
  "a detached sync child is still running after 60s", not 0 != 1; after SIGCONT beta had 1 message
  (log `/dev/shm/cilr-sigstop-proof-keep.log`). Whole `mailbox_routes` file green 3/3 in the clean env
  (10.6 s each).
- Red 2: cannot run Windows locally; fgctl focused set (6 files, 52 tests) green on Linux; branch runs
  of Release assets check below.
- Red 3: did not reproduce naturally in 400 runs. A child that blanks its own argv for 100 ms is missed
  20/20 by the real `fgos internal quiesce-scan` before the fix, 0/20 after. Measured window up to 14 ms
  with the child preempted (0.08 ms idle).
- Gates: `cargo fmt --all --check`; `cargo clippy -p fgos -p fgos-process --all-targets -- -D warnings`;
  `cargo check -p fgos-process` for x86_64-pc-windows-msvc and aarch64-apple-darwin; one-door census
  regenerated with `--write-census` (0 undeclared sites); architecture, doc-health, citation-drift tests
  90/90; full `npm test` 8860 tests, 0 fail, 31 skipped, no run-tests ERROR lines.
- CI on the branch: CI 43354315374, Release assets check 43354315390 (PR) and 43354372432 (dispatch), all green. Main runs: see the board.

## Second landing: reds on the first landed commit

Main e95f4171b: Release assets check green (run 43361559343); CI red (run 43361559236), job
`test (ubuntu-latest)`, two failures, neither from the first landing:

| # | Test | Cause | Fix |
|---|------|-------|-----|
| 4 | `check-decision-citation-drift` "CLI run against the real repo root" | `document-identity/spec.md` lines 142 and 684 cited "pkm D14", a D-local id, added by the documentation lane (f9bf62e30, 292f45f17) | `5acc28f8e`: the spec names "pkm's structure spec" instead of the id |
| 5 | `case-close` "concurrent prunes remove each directory once" listed one case twice | Production race: the advance lock file lives inside the case directory, so prune A's in-place `rmSync` unlinked the lock A still held; prune B took a fresh lock on the half-deleted case, still read its ledger, removed and reported it again. Forced repro (hold the case, unlink its lock file, run prune B): B removed and reported the held case. | `bbd08a59b`: `removeCaseDir` renames the case directory under the hold to `.<caseId>.removing-<pid>-<rand>` (no case id), then deletes it; an applied prune sweeps such leftovers (new proof "what a stopped prune left off the case path ..."). Same repro after the fix: B removes and reports nothing. |

Stub check (asked by the big lead): with B made to pass its existence check and A renaming the case away
right before B locks, B's lock recreates the case path as a stub holding only `locks/advance.lock`; B
finds no fresh ledger there and removes it. Runs root after B: only A's `.removing-` directory; after
both prunes finish: empty. B reports `cases: []`, `kept: []` (log `/dev/shm/cilr-stub-proof.log`).

Proof: case-close 5/5, workflow and CLI focused set 173/173, full `npm test` 8861 tests 0 fail, no
run-tests ERROR lines.

## Backlog rows opened

- `p-5zazr53vd2`: the exec-window retry is per process and the scan is serial (N x 250 ms); bound it
  with one per-scan deadline or a second pass.
- `p-xqkchdr6iy`: a live same-user process whose argv cannot be read counts as not fgOS in the quiesce
  gate; gate-contract change (packages/process spec plus the quiesce route reading it as unreadable).

## Authority

- The "is a process still inside exec" judgement now lives in the Linux process-facts layer
  (`packages/process`), the lowest layer that reads `/proc`; the quiesce route keeps reading views
  through its contract. Policy for a permanently empty argv belongs to the same layer's spec and the
  route's reading of `unreadable` (`p-xqkchdr6iy`).
- Test-side: one fixture-tree removal door for fgctl tests (`removeTree`), one detached-sync wait for
  the cross-machine mailbox proofs (`sync_child_said`).

## Lessons

- `cargo test --workspace` stops at the first failing test binary: one red on main can mask another.
  Before calling a cargo job "one flake", rerun or read the next main run; consider `--no-fail-fast` in
  the CI cargo step.
- Three intermittent reds in one day were all races between "spawn returned" and "the child is in the
  state the caller assumes" (detached sync still pushing, Windows image handle still closing, argv not
  yet published). A forced repro (SIGSTOP, argv blanking) proved each in minutes where natural loops
  never failed; reach for it first.
- A green PR CI is only as fresh as its base: the first landing passed on a base without the
  documentation lane's next commit, which brought a citation-drift red to main. Rebase-and-rerun the
  CI test job when main moved by more than docs you have read.
- An earlier fix (7980b494e) patched one cleanup site with an inline retry; the same failure then hit a
  sibling file. Fix the class through one helper on the first occurrence.
