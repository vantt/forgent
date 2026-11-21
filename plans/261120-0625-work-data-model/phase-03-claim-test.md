# Phase 3: Concurrent claim is refused at landing

## Inputs
- Section 7 anchor `#task-claim-test` of `docs/discussions/work-data-model/DISCUSSION.md`, decision D-ADR0082.
- Backlog row `p-lsjboo4xzg`.
- `apps/fgos/src/wiring/land.rs` and the landing door.

## Files it may write
- `apps/fgos/tests/concurrent_plan_claim.rs`

## Steps
1. Create integration test in `apps/fgos/tests/concurrent_plan_claim.rs`:
   - Set up a test repository with a plan at `status: ready`.
   - Lead A claims the plan by writing `status: running` and `lead: lead:LEAD_A`, then lands via `fgos land`.
   - Lead B, operating on the previous base commit, also attempts to land `status: running` and `lead: lead:LEAD_B`.
   - Assert that Lead B's landing is refused cleanly with a conflict refusal (`land-conflict` or merge rejection).
   - Assert that Lead A's claim remains intact on main.
2. Verify that existing Identity role exclusion (`role-held`) together with the landing merge slot provides safe claim concurrency control without requiring a cross-machine daemon lock.

## Verify
`cargo test -p fgos --test concurrent_plan_claim`

## Rollback
Revert the commit; test file is removed.

## Outcome
Closed 2026-11-21 by owner decision `q-fvulgjz2iz`: the behaviour is already proven by its owning tests (see plan acceptance criterion 3); no new test file lands.
