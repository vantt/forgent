# Phase 4: C5 fence and scan on Windows, git-wal-v1 advertised

## Inputs
- plan.md (Facts); docs/platform/git/spec.md section 12 (C5);
  docs/platform/packaging-distribution/contracts/activation-binding.md (~146) and release-manifest.md (~161).
- packages/distribution/rust/src/git_gate.rs (`has_wal` ~43, process scan ~192, platform refusal ~208, fence ~241,
  Windows non-WAL test ~348/421), init.rs (fence placement ~220, ~262), verify.rs (~225-229 capability per target).
- packages/process/rust (Windows process listing already used elsewhere by the scan; reuse, never a second copy).

## Files it may write
packages/holder-lock/rust/src/tombstone.rs, packages/holder-lock/rust/src/route.rs (quiesce-scan only),
packages/process/rust/src/facts.rs, packages/process/rust/src/platform/windows.rs, packages/process/rust/tests/**,
packages/distribution/rust/src/git_gate.rs, packages/distribution/rust/src/init.rs,
packages/distribution/rust/src/verify.rs, packages/distribution/rust/tests/**,
docs/platform/packaging-distribution/contracts/activation-binding.md,
docs/platform/packaging-distribution/contracts/release-manifest.md

## Steps
1. Windows fence placement in packages/holder-lock/rust/src/tombstone.rs `replace_held_file` (Linux keeps its
   `RENAME_EXCHANGE`; Win32 cannot replace a file with a directory atomically). Lead's decision, fail-closed two-step:
   (a) prepare the tombstone directory at a temporary sibling name, TOMBSTONE record written and flushed;
   (b) while still holding the legacy lock, rename the held file to a sibling aside name (`MoveFileExW`, write-through;
   the port opens lock files with `FILE_SHARE_DELETE`, so this works while it is open and locked; the handle keeps its
   lock);
   (c) rename the prepared directory onto the original path with `MoveFileExW` WITHOUT `MOVEFILE_REPLACE_EXISTING`
   (atomic no-replace). If it fails because an old contender created a file in the gap, refuse with a named error
   (the old contender won; nothing is published; the caller retries later) and leave the aside file and directory
   for cleanup; never delete the contender's file.
   Why safe: in the gap an old contender either creates a file and wins (we refuse, fail closed) or arrives after (c)
   and sees a directory. A contender already blocked on the held file is in the same position as on Linux after the
   exchange (it holds the moved file, and the port's relock-on-replace check finds a directory at the path). Write
   this reasoning in the doc comment and in activation-binding.md. Windows tests in tombstone/fence cases: placed,
   idempotent, lost race refuses (simulate by creating the path between (b) and (c) through a test seam that already
   exists or a `#[cfg(test)]` hook, no env switch).
2. Windows workspace process scan: the Windows arm of `fgos_process::facts::scan` (`ProcView` per process from the
   Toolhelp process snapshot already used in packages/process/rust/src/platform/windows_job.rs and holder-lock
   route/hold.rs; reuse one helper, never a third copy): argv from the process command line
   (`NtQueryInformationProcess` `ProcessCommandLineInformation` with `PROCESS_QUERY_LIMITED_INFORMATION`, split by
   `CommandLineToArgvW` rules), cwd from the process parameters (`ReadProcessMemory` of the PEB's
   `CurrentDirectory`, x64 layout, `PROCESS_VM_READ`), same user from the token SID; anything unreadable is `None`, so
   the existing `could_be_fgos` / unreadable rules apply unchanged. Then lift the Linux-only refusal of `quiesce::scan`
   in holder-lock route.rs for Windows (the PID-namespace check stays Linux). Windows tests: a child process started
   in a temp workspace dir is found by cwd and by `--dir` argv; a process elsewhere is not.
3. Allow `has_wal` on Windows in git_gate; require `git-wal-v1` for windows-x64 in verify.rs; update the two
   contracts' text. `git-wal-unsupported-platform` stays for platforms still without it (macOS).
4. Tests: Windows cases for fence placed, live predecessor refusal, missing fence refusal; they run in the existing
   `focused tests (windows-latest)` step `cargo test (distribution crate)`.

## Verify
- Linux: `cargo test -p fgos-distribution`, clippy -D warnings, fmt, msvc check of fgos-distribution.
- Windows: `focused tests (windows-latest)` green with the new cases.

## Rollback
Revert the phase's land commit.
