# Phase 3: Borrowed handle and borrow I/O on Windows

## Inputs
- plan.md (Facts, Risks); docs/platform/holder-lock/spec.md sections 5, 8 and 8.1.
- packages/holder-lock/rust/src/port.rs (`BorrowedHandle::new` ~392, its Drop ~482, `validate` ~997,
  `validate_quiescent` ~1034, `run_borrowed` ~1114, `run_borrowed_io(_watched)` ~1240-1271, `IoUnsupported`),
  packages/holder-lock/rust/src/borrow_windows.rs (named job, job keeper, `BorrowControl`), driver/windows.rs.
- packages/holder-lock/rust/tests/borrow_io.rs, scope_rank.rs, borrow_git.rs, windows_lockfileex.rs.

## Files it may write
packages/holder-lock/rust/src/port.rs, packages/holder-lock/rust/src/borrow_windows.rs,
packages/holder-lock/rust/src/driver/windows.rs, packages/holder-lock/rust/tests/**,
.github/workflows/release-assets-check.yml

## Steps
1. Read the measured answer from phase 1's windows_lockfileex.rs tests and their CI run. If closing a duplicate keeps
   the owner's lock, `BorrowedHandle::new` on Windows duplicates as on Unix; if not, the Windows
   copy keeps a non-owning reference to the owner's file and never closes it. Either way its Drop never unlocks.
2. Remove the Windows refusal in `BorrowedHandle::new`; `validate` stays the admission check (same_file identity,
   exclusive, lent child known).
3. `validate_quiescent` on Windows: nothing outside the lock's own process and its borrow jobs can hold a
   `LockFileEx` lock, so after `validate` it is proven alone; write that reason in the doc comment.
4. `run_borrowed_io(_watched)` on Windows on top of `borrow_windows::run`: stdin bytes, bounded captured stdout and
   stderr with the same ceilings and `borrow-output-limit`, the absolute deadline with terminate-grace and the same
   `borrow-deadline` outcomes (job terminate = kill), the watched variant for user code, same outcome types. No new
   public type.
5. Un-gate borrow_io.rs and scope_rank.rs cases on Windows (a case that asserts Unix-only facts stays gated with a
   reason). Add step `cargo test --release -p fgos-holder-lock` to the `windows git custody` job.

## Verify
- Linux: `cargo test -p fgos-holder-lock`, clippy -D warnings, fmt, msvc check of fgos-holder-lock and its dependents
  (`-p fgos-git -p fgos-run-supervisor -p fgos-execution-engine`).
- Windows: `windows git custody` runs fgos-holder-lock tests green, including the probe.

## Rollback
Revert the phase's land commit.
