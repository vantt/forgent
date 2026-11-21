# Phase 2: WAL opens on Windows

## Inputs
- plan.md (Facts); packages/git/rust/src/wal.rs (`Directory`, `open_trusted` ~1275-1306, the `cfg(unix)` pairs at
  ~1377-1388 and ~2039-2045, `WalError::Unsupported`), docs/platform/git/spec.md (WAL sections).
- packages/holder-lock/rust/src/driver/windows.rs (`same_file_id`, `GetFileInformationByHandleEx` use) for the
  existing Win32 handle idioms; `windows-sys` is already a dependency of the workspace.

## Files it may write
packages/git/rust/src/wal.rs, packages/git/rust/src/wal/** (only if wal.rs is split by an existing boundary)

## Steps
1. Windows arm of `Directory::open_trusted`: open the directory with `FILE_FLAG_BACKUP_SEMANTICS` and
   `FILE_FLAG_OPEN_REPARSE_POINT`, refuse a reparse point, and apply the same trust rule as Linux in Windows terms: the
   owner is the current user (for the common dir also BUILTIN\Administrators or SYSTEM), and no ACE grants write to
   Everyone / Users / Authenticated Users (common dir: the same, as Linux's 0o002). Refusal is the existing
   `unsafe_path` error.
2. Windows arm of `Directory::path` and `child` (path held beside the handle; child opens by joined path and re-checks
   identity), and of the durability calls (`FlushFileBuffers` on files; a directory flush is a no-op on NTFS, say so in
   a comment), using the existing `FileSystem` port.
3. Un-gate the `wal::` lib tests on Windows; a test that is Linux-semantics only (e.g. `/proc/self/fd`) stays gated
   with a one-line reason.
4. Add one step to the `windows git custody` job only after phase 1 has landed: `cargo test --release -p fgos-git --lib wal::`
   (the lead adds it on rebase if phase 1 lands later; the CI file is phase 1's in wave 1).

## Verify
- Linux: `cargo test -p fgos-git --lib wal::`, clippy -D warnings, fmt, msvc check of fgos-git.
- Windows: `windows git custody` runs the wal lib tests green.

## Rollback
Revert the phase's land commit.
