# Phase 05 — Long-tail sweep

## Context

`plan.md` § Dependencies: this phase starts after Phases 01–04 land (or are
explicitly deferred with a named reason). Its job is to re-categorize
whatever remains once the four named clusters are gone, and either fix or
scope-document the rest — this repo's own CI signal should end this track
in one of two states: genuinely green on all three OSes, or every remaining
red test individually named and justified (not a silent 400-test gap).

## Requirements

1. Run Phase 00's snapshot procedure again against current `main`.
2. For every remaining failure, attribute it to one test file and one
   apparent cause (even a tentative one) — the goal is a complete map, not
   necessarily complete fixes.
3. Group into new sub-clusters by shared file, shared subsystem, or shared
   error shape. Fix the ones with a clear single cause. For everything else,
   this phase's exit criterion is a decision, not silence: either commit to
   fixing it (spin off a `phase-06-...` etc. with the same evidence
   standard as 01-04), or bring the user a scoped decision the way this
   session brought "build Rust on Windows or not" — do not leave a test
   red without SOMEONE having decided that's acceptable.

## Files

Unknown until this phase runs.

## Validation

Every test in the suite is accounted for on all three OSes: green, or
explicitly skipped with a named, reviewed reason (matching this track's
existing `mockHerdr`/Windows-symlink-privilege precedents), or the user has
explicitly accepted a documented residual gap.

## Risks

If Phases 01–04's fixes shift `main` significantly, this phase's baseline
(the "~450 remaining" estimate in `plan.md`) could be stale by the time it
starts — always re-run Phase 00's snapshot fresh rather than trusting the
plan's original numbers.

## Resolution & Findings

- **Status**: COMPLETED & VERIFIED (100% GREEN on all platforms).
- **Root Causes Confirmed & Fixed**:
  1. **CRLF in Markdown Frontmatter**: `src/report/frontmatter.mjs` assumed POSIX `\n---\n`, failing frontmatter parsing on Windows git checkouts with CRLF line endings (`13315c352`).
  2. **CLI Harness & Quoting in cmd.exe**: In `test/cli/helpers/fgos-cli-harness.mjs` and related CLI tests, arguments with JSON or spaces were mishandled by Windows command prompt. Switched to direct argv array invocation (`13315c352`).
  3. **Cross-Process File Locking & JSONL Append**: In `src/state/events.mjs` and `packages/distribution/rust/src/lock.rs`, concurrent append operations on Windows hit sharing violations (`EBUSY` / `EPERM`). Added retry-with-backoff for file locking on Windows (`fbc329c04`).
  4. **PPID Detection in Session Identity**: In `src/util/session-identity.mjs`, Unix `ps -o ppid=` was replaced with a reliable Windows PowerShell / WMI fallback and environment detection (`a56bf1bf4`).
  5. **Preflight `npm.cmd` Spawn**: In `bin/fgos.mjs`, preflight checks spawned `npm` which fails with `ENOENT` on Windows without `.cmd` extension or shell wrapper (`b39898aa2`).
  6. **Staging Rename Race (`EPERM`)**: In `src/runner/dispatch/assignment-runner.mjs`, `fs.rename` failed intermittently on Windows with `EPERM` when a file handle was briefly held by another process or scanner. Added retry-with-backoff for atomic rename (`b39898aa2`).
  7. **Watch Process Signal Termination**: In `bin/fgos.mjs` and `test/e2e/runner-loop.test.mjs`, Windows processes do not exit on POSIX signals identically to Unix. Implemented Win32 process tree kill (`b39898aa2`).
  8. **Edit Command Path Normalization**: In `src/verbs/state/edit.mjs` and `src/runner/paths.mjs`, handled drive-letter case and separator normalization (`a56bf1bf4`, `b39898aa2`).
- **CI Verification**:
  - **CI Run ID**: `36074238669` (GitHub Actions).
  - **Results**: **100% GREEN** across all jobs in matrix:
    - `test (windows-latest)`: PASS
    - `test (ubuntu-latest)`: PASS
    - `test (macos-latest)`: PASS
    - `cargo test workspace`: PASS
    - `cargo test herdr-plugin`: PASS
    - `external consumer proof`: PASS
    - `selector-plan`: PASS
    - `compare`: PASS
  - **Landing**: Fast-forward merged to `origin/main` at commit `b39898aa2377c453c9f76cbe56e4ede95fdc96b0`. PR #7 marked MERGED.

