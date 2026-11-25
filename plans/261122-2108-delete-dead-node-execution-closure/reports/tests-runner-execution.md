# Phase 3 Report: Retire or Rewire Execution Tests

**Plan:** `plans/261122-2108-delete-dead-node-execution-closure`  
**Phase:** 3  
**Base commit:** `a43e451bb2a080d60e3bdea27584be0b172a19d7`  
**Date:** 2026-11-25  

---

## 1. Executive Summary

Phase 3 processed all test files in the execution footprint: `test/runner/execution-contract.test.mjs` and `test/runner/execution/**`.
The closure report (`plans/261122-2108-delete-dead-node-execution-closure/reports/closure.md`) assigned 22 rows (rows 63–84) to Phase 3. Together with the loop architecture guard file present in `test/runner/execution/loops/`, a total of 23 test files were evaluated.

- **Retired test files (22 files):** 21 files testing dead Node execution modules were retired, along with `architecture-guard.test.mjs` (behaviour removed). All retired behaviours are owned by existing Rust tests in `packages/execution/engine`, `packages/execution/rust`, and `apps/fgos/tests`.
- **Rewired test files (1 file):** `test/runner/execution/legacy-seat-read.test.mjs` proves the live-kept pure functions in `src/runner/execution/legacy-seat-read.mjs`. Dead imports (`shipped-catalog.mjs`, `unit-summary-twin.mjs`, `unit-run-history.mjs`) were removed, and an inline fixture was introduced. 10 test cases run and pass 100% green; 1 integration test case exercising dead unit-summary twins was retired to Rust replay tests.
- **Untouched live test files (5 files):** `account-pin.test.mjs`, `bind-committed-config.test.mjs`, `run-brief-not-delivered.test.mjs`, `tier-fallback.test.mjs`, and `unit-run-result-fixtures.test.mjs` import only live modules and remain untouched.
- **Dead imports check:** Zero references to any of the 63 dead modules remain in `test/runner/execution/**`.

---

## 2. Test Disposition Table

| Test File | Cases | Disposition | Owning Proof or Reason |
|---|---|---|---|
| `test/runner/execution-contract.test.mjs` | 58 | retired | Dead Node `src/runner/dispatch/execution-contract.mjs`. Owned by Rust `fgos-execution-engine` in `packages/execution/engine/tests/contract.rs` (`the_contract_constants_are_the_ones_node_exports`, `an_inline_contract_is_validated_field_by_field_as_node_did`, `the_retired_saved_policy_tier_is_normalised_at_the_load_boundary_as_node_did`). |
| `test/runner/execution/account-rotation.test.mjs` | 9 | retired | Dead Node `src/runner/execution/account-rotation.mjs` & `provider-capacity.mjs`. Owned by Rust in `packages/execution/engine/tests/accounts.rs` (`rotation_and_the_walk_state_follow_the_attempt_chain_as_node_read_it`) and `packages/execution/rust/tests/golden_bind.rs`. |
| `test/runner/execution/bind-tier-composition.test.mjs` | 2 | retired | Dead Node `src/runner/execution/seat-resolver.mjs`. Owned by Rust in `packages/execution/rust/tests/core_loops.rs` (`seat_rules_replay`) and `golden_bind.rs`. |
| `test/runner/execution/bind.test.mjs` | 4 | retired | Tests interaction with dead `src/runner/execution/seat-resolver.mjs`, `seat-ledger.mjs`, `provider-capacity.mjs`. Owned by Rust in `packages/execution/engine/tests/planning.rs` (`bind_facade_builds_the_ask_of_a_seat_from_the_ledger`) and `packages/execution/rust/tests/golden_bind.rs`. |
| `test/runner/execution/custody-door.test.mjs` | 8 | retired | Dead Node `src/runner/execution/custody-door.mjs`. Owned by Rust in `packages/execution/engine/tests/unit_run.rs` and `apps/fgos/tests/windows_git_custody.rs`. |
| `test/runner/execution/legacy-seat-read.test.mjs` | 10 rewired, 1 retired | rewired | Proves live `src/runner/execution/legacy-seat-read.mjs` pure functions (`legacySeatsOf`, `seatsOfRecord`, `seatKeyOf`, `isVerdictResult`, `isVerifyResult`, `isSeatRecord`, `collaborationOfRecord`). Rewired to remove dead imports (`shipped-catalog.mjs`, `unit-summary-twin.mjs`, `unit-run-history.mjs`) and use inline fixture. Retired unit-summary test case is owned by Rust in `packages/execution/rust/tests/core_loops.rs` (`node_era_unit_records_read_through_the_rust_readers`). |
| `test/runner/execution/loops/architecture-guard.test.mjs` | 2 | retired | Behaviour removed: dead Node loop structure guard; all loop modules in `src/runner/execution/loops/` are dead and scheduled for deletion in phase 8 (noted in S6a facts `plans/261118-1341-s6a-execution-tier-rust/reports/facts-part-a.md:706`). |
| `test/runner/execution/loops/debate.test.mjs` | 13 | retired | Dead Node `src/runner/execution/loops/debate.mjs`, `history-outcome.mjs`, `seat-resolver.mjs`. Owned by Rust in `packages/execution/rust/src/loops/debate.rs` and `packages/execution/rust/tests/core_loops.rs`. |
| `test/runner/execution/loops/index.test.mjs` | 8 | retired | Dead Node `src/runner/execution/loops/index.mjs` and loop modules. Owned by Rust in `packages/execution/rust/src/loops/mod.rs` and `packages/execution/rust/tests/core_loops.rs`. |
| `test/runner/execution/loops/panel.test.mjs` | 10 | retired | Dead Node `src/runner/execution/loops/panel.mjs`. Owned by Rust in `packages/execution/rust/src/loops/panel.rs` and `packages/execution/rust/tests/core_loops.rs`. |
| `test/runner/execution/loops/reviewed.test.mjs` | 24 | retired | Dead Node `src/runner/execution/loops/reviewed.mjs`, `verify.mjs`, `seat-resolver.mjs`. Owned by Rust in `packages/execution/rust/src/loops/reviewed.rs` and `packages/execution/rust/tests/core_loops.rs`. |
| `test/runner/execution/loops/role-tasks.test.mjs` | 12 | retired | Dead Node `src/runner/execution/loops/role-tasks.mjs`. Owned by Rust in `packages/execution/rust/src/loops/role_tasks.rs` and `packages/execution/rust/tests/core_loops.rs` (`loop_helpers_replay`). |
| `test/runner/execution/loops/solo.test.mjs` | 13 | retired | Dead Node `src/runner/execution/loops/solo.mjs`, `history-outcome.mjs`. Owned by Rust in `packages/execution/rust/src/loops/solo.rs` and `packages/execution/rust/tests/core_loops.rs`. |
| `test/runner/execution/patterns/retired-keys.test.mjs` | 1 | retired | Dead Node `src/runner/execution/patterns/retired-keys.mjs`. Owned by Rust in `packages/execution/rust/tests/core_unit.rs` (`retired_pattern_keys_are_found_and_worded_as_node_does`). |
| `test/runner/execution/run-gate.test.mjs` | 15 | retired | Dead Node `src/runner/dispatch/assignment-runner.mjs`, `assignment.mjs`. Owned by Rust in `packages/execution/engine/tests/assignment_runner.rs` and `packages/execution/engine/tests/contract.rs`. |
| `test/runner/execution/run-herdr.test.mjs` | 3 | retired | Tested `withRunDirAccess` on dead Node `src/runner/dispatch/cli.mjs`. Owned by Rust in `packages/execution/engine/tests/assignment_runner.rs` and `terminal_args.rs`. |
| `test/runner/execution/run-posture.test.mjs` | 4 | retired | Dead Node `src/runner/dispatch/confinement/policies.mjs`. Owned by Rust in `packages/execution/engine/tests/confinement_policy.rs`. |
| `test/runner/execution/seat-ledger.test.mjs` | 5 | retired | Dead Node `src/runner/execution/seat-ledger.mjs`. Owned by Rust in `packages/execution/engine/tests/planning.rs` (`bind_facade_builds_the_ask_of_a_seat_from_the_ledger`). |
| `test/runner/execution/seat-resolver.test.mjs` | 33 | retired | Dead Node `src/runner/execution/seat-resolver.mjs`. Owned by Rust in `packages/execution/rust/tests/core_loops.rs` (`seat_rules_replay`). |
| `test/runner/execution/unit-run-outcome.test.mjs` | 6 | retired | Dead Node `src/runner/execution/unit-run-history.mjs`. Owned by Rust in `packages/execution/rust/tests/core_loops.rs` (`record_rules_replay`). |
| `test/runner/execution/unit-run-record.test.mjs` | 4 | retired | Dead Node `src/run-supervisor/cwd-lock.mjs`, `src/runner/execution/unit-control.mjs`. Native door unit record functionality owned by Rust in `packages/execution/rust/tests/core_runner_config.rs`. |
| `test/runner/execution/unit-summary.test.mjs` | 24 | retired | Dead Node `src/runner/execution/unit-summary-twin.mjs`, `unit-run-history.mjs`, `loops/index.mjs`. Owned by Rust in `packages/execution/rust/tests/core_loops.rs` (`unit_summaries_replay`). |
| `test/runner/execution/unit.test.mjs` | 34 | retired | Dead Node `src/runner/execution/unit.mjs`. Owned by Rust in `packages/execution/rust/tests/core_unit.rs` (`validate_unit_answers_as_node_does_for_every_recorded_input`). |

---

## 3. Verification

1. **Step 5 dead import check:**
   Automated check verified zero dead module paths from Section 5 of `closure.md` (63 dead files) are imported by any remaining file in `test/runner/execution/**`.
2. **Test execution:**
   Ran `node --test test/runner/execution/legacy-seat-read.test.mjs`:
   `10 pass, 0 fail (duration: ~45ms)`.
