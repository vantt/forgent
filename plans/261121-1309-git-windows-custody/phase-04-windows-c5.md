# Phase 4: C5 fence and scan on Windows, git-wal-v1 advertised

## Inputs
- plan.md (Facts); docs/platform/git/spec.md section 12 (C5);
  docs/platform/packaging-distribution/contracts/activation-binding.md (~146) and release-manifest.md (~161).
- packages/distribution/rust/src/git_gate.rs (`has_wal` ~43, process scan ~192, platform refusal ~208, fence ~241,
  Windows non-WAL test ~348/421), init.rs (fence placement ~220, ~262), verify.rs (~225-229 capability per target).
- packages/process/rust (Windows process listing already used elsewhere by the scan; reuse, never a second copy).

## Files it may write
packages/distribution/rust/src/git_gate.rs, packages/distribution/rust/src/init.rs,
packages/distribution/rust/src/verify.rs, packages/distribution/rust/tests/**,
docs/platform/packaging-distribution/contracts/activation-binding.md,
docs/platform/packaging-distribution/contracts/release-manifest.md

## Steps
1. Windows fence placement: the new controller, holding the old and new activation locks, replaces the old lock file
   with the tombstone so that no instant exists where an old controller can open the WAL. Use `MoveFileExW`
   (`MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH`) or `ReplaceFileW`, and state in the contract why it is safe
   (the old lock is held by us during the swap). If no safe Windows placement exists, stop and report to the lead.
2. Windows workspace process scan through the process crate's existing Windows listing, scoped like Linux's
   (activated workspace and its linked worktrees); unreadable candidates still fail closed.
3. Allow `has_wal` on Windows in git_gate; require `git-wal-v1` for windows-x64 in verify.rs; update the two
   contracts' text. `git-wal-unsupported-platform` stays for platforms still without it (macOS).
4. Tests: Windows cases for fence placed, live predecessor refusal, missing fence refusal; they run in the existing
   `focused tests (windows-latest)` step `cargo test (distribution crate)`.

## Verify
- Linux: `cargo test -p fgos-distribution`, clippy -D warnings, fmt, msvc check of fgos-distribution.
- Windows: `focused tests (windows-latest)` green with the new cases.

## Rollback
Revert the phase's land commit.
