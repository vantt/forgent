# Review of phase 4 (Windows C5 fence and scan): one fail-open case in the scan

Written 2026-11-21 18:05 (Asia/Saigon) by the lead session `forgent-261121-1309-git-wi-2454d` after a restart.

## What happened

After the restart, this session reviewed branch `wincustody/p4` at `e710d76e1` with a code-reviewer subagent. The
review used `git diff main...HEAD` against phase-04-windows-c5.md and was static only: nothing was compiled or run.
While the review ran, another session landed phase 4 on main as `9852d8c97 land wincustody/p4`, after OPC gave MERGE
at 17:53 (program board log). That session also rebased `wincustody/p5` onto it and pushed `1bdb14fd4`. So a second
lead is driving this plan, and this session has stopped driving phases. The findings below apply to the code that
landed. The review confirmed the fence placement and the Linux path are correct.

## Blocking (fail-open, against the safety claim of `git-wal-v1`)

`packages/holder-lock/rust/src/route.rs` (`quiesce-scan --workspace-only`, around 746-776; `workspace_hit` around
658) together with `packages/process/rust/src/platform/windows.rs` `view_with`. The git gate
(`packages/distribution/rust/src/git_gate.rs` around 107) scans in workspace-only mode. In that mode a process counts
only when its cwd or a typed `--dir` places it in the workspace, and the "unreadable" count applies only when
`workspace_only` is false. On Windows, a same-user process whose cwd cannot be read is common:

- an elevated process (the integrity level refuses `PROCESS_VM_READ` to a non-elevated scanner);
- a 32-bit process, which is refused as "32-bit process on a 64-bit host".

Failure case: an old `fgos run` is still running in the workspace from a "Run as administrator" terminal, with no
`--dir`. A normal `fgctl init` scans and reports `clean`, so the fence is placed and `git-wal-v1` is admitted while an
old Git writer is alive. Linux has this gap only for root processes.

Suggested fix: in workspace-only mode, count a process as unreadable when its cwd cannot be read and its argv
`could_be_fgos`. Do the same when its user digest cannot be read, instead of treating that process as another user's.
Add a Windows case to `packages/process/rust/tests/windows_scan.rs` (or the route tests).

## Non-blocking

1. The Windows tests in `tombstone.rs` (`windows_tests`, including the lost-race refusal) and the two Windows tests in
   `route.rs` `quiesce::tests` (including the 8.3 short-name case) run in no CI job. The Windows jobs run holder-lock
   only as `--test windows_lockfileex`. Fix: add `cargo test --release -p fgos-holder-lock --lib` to the
   `windows git custody` job.
2. `platform/windows.rs` `process_ids()` is a third Toolhelp snapshot loop. `windows_job.rs` (around 703) and
   holder-lock `route/hold.rs` (around 485) keep their own (design principle 1). `route/hold.rs` is outside the plan
   footprint.
3. `tombstone.rs` `place_with_gap` leaves `.activation-fence-aside-*` and `.activation-fence-*` entries behind after a
   lost race or a crash between the two renames. They are said to be "for cleanup", but nothing removes them. This is
   not a safety problem.
4. `route.rs` `within()` calls `canonicalize()` on every scanned cwd, once per workspace dir. A cwd on an unreachable
   network share can stall the scan for the network timeout. This makes the scan slow, not unsafe.

## Not changed by this session

The only effect this session had on a branch was pushing `a09bfdefa` to `wincustody/p5` (the phase 5 unit's passing
round from 17:46) and dispatching CI run 44896567437. The other lead's rebased push `1bdb14fd4` superseded both. This
session did not write `plan.md`.
