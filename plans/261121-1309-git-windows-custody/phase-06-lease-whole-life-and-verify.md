# Phase 6: Lease channel for the attempt's whole life, verify under custody

## Inputs
- plan.md (Facts); plans/261118-1341-s6a-execution-tier-rust/phase-19c-run-route-flip.md (Windows lease decision and
  precondition (b)); phase 3 landed.
- packages/execution/engine/src/assignment_runner/launch.rs `serving_lease_owner` (~107-175),
  packages/holder-lock/rust/src/route/hold.rs `serve_requests`, packages/run-supervisor/rust/src/supervise/windows.rs
  (`declare_on_lease`, `declare_via_holder`), apps/fgos/src/wiring/unit_run_host/verify.rs (~92-101 Windows stub),
  apps/fgos/tests/windows_cwd_lease_owner.rs.

## Files it may write
packages/execution/engine/src/assignment_runner/launch.rs, apps/fgos/src/wiring/unit_run_host/verify.rs,
apps/fgos/tests/windows_cwd_lease_owner.rs

## Steps
1. The controller serves `cwdLeaseOwner` for as long as it holds the custody, not only around the supervisor start and
   `wait_for_binding`: an adopted or restarted supervisor that declares again is answered. The serving thread stops
   when the custody is released. Same protocol, same files.
2. Windows `borrowed` verify in verify.rs: run the verify command under the custody through `run_borrowed_io`
   (phase 3), as the Unix arm does; delete the `windows-cwd-lease-holder-missing` stub text there. The engine's
   `mutating_launch_refusal` and the `legacyOn` route stay (S6A lifts them).
3. Extend windows_cwd_lease_owner.rs: (a) after the first supervisor exits, a second supervisor declares on the same
   held lease and is answered; (b) a verify under custody runs and its exit is reported. The existing CI job runs this
   file.

## Verify
- Linux: `cargo test -p fgos-execution-engine`, `cargo test -p fgos --test unit_run_host`, clippy -D warnings, fmt,
  msvc check of `-p fgos -p fgos-execution-engine`.
- Windows: job `windows cwd lease owner` green with the new cases.

## Rollback
Revert the phase's land commit.
