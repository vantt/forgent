# Integration report: heads rotate on their own (phase 4)

Phases 1, 2, and 3 are merged on this combined tree (`main`).

Combined tree commit: `5a41f0d5740a83a74a9c40e0574948e371945e55`

## Gate

Commit: `30132e6f6e08c6ec7a4d402cbe771229e25a3e2e`

### 1. `CARGO_TARGET_DIR=$PWD/.fgos/runtime/tmp/heads-rotate-gate/cargo-build cargo test --workspace`
- **Exit code**: `101`
- **Pass/Fail counts**: 563 passed, 7 failed across 6 test suites
  - `test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s`
  - `test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s`
  - `test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.16s`
  - `test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s`
  - `test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s`
  - `test result: FAILED. 542 passed; 7 failed; 0 ignored; 0 measured; 0 filtered out; finished in 5.41s`
- **Failing tests**:
  - `wiring::doctor::confinement::tests::a_home_owned_by_a_dead_process_is_named_by_the_row_and_removed_only_by_the_fix`: panicked at apps/fgos/src/wiring/doctor/confinement.rs:1874:9 (no orphaned confinement resources found under /tmp/fgos-doctor-confinement-orphans-dead-42718-dd1269bf)
  - `wiring::doctor::confinement::tests::copies::a_staging_in_a_stranded_store_is_reported_once_for_hand_recovery_and_the_fix_leaves_it`: panicked at apps/fgos/src/wiring/doctor/confinement.rs:2499:13 (no login copy is being retained past its dispatch)
  - `wiring::doctor::confinement::tests::copies::an_interrupted_staging_is_reported_and_the_fix_removes_only_one_provably_not_needed`: panicked at apps/fgos/src/wiring/doctor/confinement.rs:2476:13 (no login copy is being retained past its dispatch)
  - `wiring::doctor::confinement::tests::copies::an_interrupted_staging_row_offers_no_source_judgement_without_an_inventory`: panicked at apps/fgos/src/wiring/doctor/confinement.rs:2578:13 (no login copy is being retained past its dispatch)
  - `wiring::doctor::confinement::tests::copies::the_fix_never_sweeps_a_stores_constructor_staging_the_row_calls_stranded`: panicked at apps/fgos/src/wiring/doctor/confinement.rs:2566:13 (assertion failed: run_inv(&w, &inv, now_ms()).1.contains("that no dispatch applies"))
  - `wiring::doctor::confinement::tests::copies::the_orphan_count_skips_a_held_home_of_a_dead_process_but_counts_one_only_being_retried`: panicked at apps/fgos/src/wiring/doctor/confinement.rs:2222:13 (no orphaned confinement resources found under /tmp/fgos-doctor-confinement-orphan-held-42718-c4013637/fgos-confinement)
  - `wiring::doctor::confinement::tests::copies::the_fix_judges_a_staging_against_the_source_login_of_its_store_through_the_inventory`: panicked at apps/fgos/src/wiring/doctor/confinement.rs:2546:13 (no held private home to settle)

### 2. `npm test`
- **Exit code**: `1`
- **Pass/Fail counts**: 0 passed, 0 failed (0 tests run; suite aborted before test execution)
- **Failing tests**:
  - `full-suite-queue`: failed in `scripts/lib/full-suite-queue.mjs` with `Error: EROFS: read-only file system, open '/home/vantt/.local/state/fgos/locks/full-suite.lock'` during pre-test lock acquisition under confinement sandbox

### 3. `node scripts/plan-contract-check.mjs --plan plans/261122-2307-heads-rotate-on-their-own`
- **Exit code**: `1`
- **Pass/Fail counts**: 3 errors, 2 warnings
- **Failing checks**:
  - Phase 1: status `"done (landed b8482a127)"` is not one of draft, ready, running, done, withdrawn
  - Phase 2: status `"done (landed db1319f9b)"` is not one of draft, ready, running, done, withdrawn
  - Phase 3: status `"done (landed 1cd8386c5; sidecar beside the session transcript, not under the lineage, because the confinement policy never grants .fgos writable; payload reconstructed from the cli bundle, a real recording is still owed)"` is not one of draft, ready, running, done, withdrawn

## Follow-ups outside the footprint

- `packages/run-supervisor/contracts/head-request.v1.json`: 'session rotate' `stopFacts` prose omits `sessionCrons`, `backgroundTasks` and `quota` (`checkStopFacts` in `src/session-rotation/rotate.mjs` is the enforced check).
- A real status-line payload recording is owed (the proof point report `plans/261122-2307-heads-rotate-on-their-own/reports/status-line-payload.md` was reconstructed from the installed CLI bundle).
