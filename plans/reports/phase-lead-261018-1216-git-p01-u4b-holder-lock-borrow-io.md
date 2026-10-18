# Holder-lock synchronous borrow I/O prerequisite

Implemented `run_borrowed_io(&Handle, &BorrowSpec, &BorrowIo)` and adapted Git's crate-private `BorrowedSpawn` seam to return captured bytes after the synchronous borrow completes. `BorrowIo` supplies binary stdin, independent stdout/stderr ceilings and an absolute monotonic deadline. Git retains its hardened argv/environment, disabled hooks and byte parsing. Publication no longer requests or receives a bare `Spawned`.

Both Unix borrow forms share command construction and the release implementation: the existing process fd-mapping door lends private slot 3, driver preparation is unchanged, the root stays unreaped through leftover cleanup, then is reaped. Linux still cleans description holders without declaring a new predecessor domain; macOS still uses the child's process group. Overflow (`borrow-output-limit: stdout|stderr`), deadline (`borrow-deadline`) and I/O errors kill the root and run the same cleanup before returning. Existing cleanup failure remains `borrow-leftover-not-killed`. No process-package change, admission barrier, helper launcher, environment bypass or stronger containment claim was introduced. Windows rejects this new form before spawn as `borrow-io-unsupported`; its existing borrow behavior is unchanged.

Holder-lock spec §5 and the port JSON record the requested 2026-10-18 extension. The two predecessor reports now mark their barrier conclusion historical under the coordinator's narrowed decision. Prior art reused: `1afc7973f` (borrow lifecycle), `f6f86b8c8` (Windows borrow), `dc6c91249` (Git seam). Impact-analysis: inactive (zero registered providers).

Validation, with `CARGO_TARGET_DIR=.fgos/runtime/phase-target`:

- `cargo test --locked -p fgos-holder-lock -p fgos-git`: green, 63 runtime tests plus one descriptor-privacy compile-fail doctest. New real-process acceptance covers competing acquisition during the borrow and after return/release, binary Git hash-object round trips, full-duplex capture, both output ceilings, ignored-stdin deadline, and normal-exit leftover cleanup/tail capture. Git also proves hooks disabled with a rejecting reference-transaction hook and a failing control with hooks enabled.
- `cargo clippy --locked -p fgos-holder-lock -p fgos-git --all-targets -- -D warnings`: green.
- `node --test test/holder-lock/*.test.mjs`: no differences from the predecessor's 11 baseline failures; no new failure. No Node fixture or production bypass was changed.
- `git diff --check`: clean. No git add/commit.

An intermediate overlapping rebuild removed a running test binary before its self-reexec; the final full run on the final source passed all tests.

Windows refusal has a platform-gated test, but Windows/macOS execution was not available here. MDView fallback could not preview the spec: its database is read-only. Changelog and program-board edits remain outside this assignment's write scope and need coordinator follow-up. Broader Git Publication operations remain separate work; this prerequisite and its driver seam are ready.

Status: DONE_WITH_CONCERNS
Summary: Added synchronous bounded binary I/O borrowing with the existing holder-lock lifecycle and wired Git's borrowed driver path to it. Required Rust tests and clippy pass; Node has no regression against the supplied baseline.
Concerns/Blockers: Existing Node failures remain; non-Linux execution and out-of-scope changelog/program-board follow-up are not claimed complete.
Context refs:
- docs/platform/holder-lock/spec.md §5, §8
- docs/platform/git/spec.md §10 rule 4a
- packages/holder-lock/contracts/holder-lock.port.v1.json
- packages/holder-lock/rust/src/port.rs
- packages/holder-lock/rust/tests/borrow_io.rs
- packages/git/rust/src/driver.rs
