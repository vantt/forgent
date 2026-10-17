# Phase report: containment drivers for Windows and macOS

Branch `run-supervisor/p02-containment-win-mac`, merged into integration at `6c1d86749` (`--no-ff`).

## Delivered
- `windows-job` driver (`containment/windows.rs`): `create` (named job `Local\fgos-attempt-<id≤64>-<128-bit token>`, kill on close, no breakaway), `spawn_in` (gate `CREATE_SUSPENDED` → assign → resume), `is_empty`/`kill_all` call `windows_job.rs` (`domain_watch`, `assign_and_resume`, `create_kill_job`); `guarantee` = kernel. Domain record: holder = gate, keeper = null (supervisor creates the job).
- `macos-tree` driver (`containment/macos.rs`): gate in own session + group; empty = no process in pgid and none in the scanned tree, `seen` set kept and pruned; `kill_all` = `killpg` + tree scan + kill by identity; adopt rescan after 500 ms (constant); `guarantee` = best-effort with setsid + double fork escape.
- `select` picks the driver per OS; `lib.rs` routes `Domain::MacosTree` record-only judging/kill.
- Workflow `.github/workflows/process-containment.yml` (push on `run-supervisor/**` + `workflow_dispatch`; dispatch alone returned 404 because the file is not on main).
- Tests: `containment_windows.rs` (1)-(3), `containment_macos.rs` (7)-(8) plus a record-only test. Spec `docs/platform/process/spec.md` updated.

## Evidence
- CI run 39056603982, head `0f045b059`: ubuntu, windows, macos all success. Windows: 4 passed (job close ends child/grandchild/detached child; breakaway denied, limit flags read; supervisor death with gate handle keeps agent, both gone ends it). macOS: 3 passed (tree of 40, record-only, double-fork escape named).
- Earlier run 39055740997: windows failed one assert (test polled one-shot instead of one watch); fixed in the test.
- Integration worktree after merge: `cargo test -p fgos-process -p fgos-run-supervisor` exit 0, all suites ok (26 lib, 7 bwrap, 3 pgroup, 4 holders, 2 judge, 7 signal, 6 spawn fds, 2 digest; windows/macos files 0 tests on Linux).
- `cargo check --tests` for x86_64-pc-windows-msvc and aarch64-apple-darwin clean.
- Review (Sonnet): fixed job-name length, stale watch on second spawn, `seen` growth, weak breakaway test, helper cleanup.
- GitNexus impact not run (index stale, MCP not loaded); changes add new types and arms, only `ContainmentDomain::new`, `select_platform` and `DomainWatch` match arms edited. Risk judged low by grep.

## Decisions
- Windows spawns through `std::process::Command` (`Spawned.child` must be a `Child`); `fd_map` is refused on Windows.
- macOS lists with `proc_listpids` PPID/PGRP selectors, not `proc_listchildpids` (return unit uncertain).
- No `containment.predecessorKillWaitMs` plumbed: Windows kill waits a fixed 5 s.
- Gate-opens-job-handle is the caller's job: the driver exposes `WindowsJobDriver::job_name(domain)`.

## Unresolved
- Dead-leader pgid scan can signal an unrelated group if the leader's pid was reused after the whole group exited (same pattern as Linux pgroup).
- Is the gate always a job member (4.4b question for 6.2's owner)? Driver sets keeper = null.
- `ORPHAN_SETTLE` unused-import warning in `windows_job.rs` is pre-existing.
