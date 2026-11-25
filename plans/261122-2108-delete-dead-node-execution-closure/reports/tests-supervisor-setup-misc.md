# Phase 6 part A — run-supervisor tests & golden recorders

**Plan:** `plans/261122-2108-delete-dead-node-execution-closure`  
**Phase:** 6 (part A — rows 2–4 and 9–17 of the closure test-importer table)  
**Commit subject:** `test(run-supervisor): retire or rewire the tests and recorders that borrow the dead execution modules`

## Disposition table

| test file | cases | disposition | owning proof or reason |
|---|---|---|---|
| `test/golden-recorders/confinement-cleanup.recorder.mjs` | cleanup vectors (live) + fingerprint section removed | **rewired** | Keeps live `src/runner/dispatch/confinement/cleanup.mjs`. Dropped dead `probes/harness.mjs` fingerprint half. Fixtures stay: `packages/execution/contracts/confinement-cleanup/cleanup.v1.json` → `packages/execution/engine/tests/confinement_cleanup.rs` (`every_recorded_cleanup_vector_gives_the_same_answer_and_leaves_the_same_tree`); `fingerprint.v1.json` → same file (`the_probe_fingerprint_names_what_a_stored_proof_is_valid_for`, `the_machine_private_falsifiers_name_the_stand_ins_each_mask_hides`). |
| `test/golden-recorders/confinement-driver.recorder.mjs` | attestation + bwrap kept; registry section removed | **rewired** | Keeps live `drivers/bwrap.mjs` + `attestation-store.mjs`. Dropped dead `backend-registry.mjs`. Fixture `registry.v1.json` stays → `packages/execution/engine/tests/confinement_driver.rs` (`registry_validates_every_instance_and_document_shape_as_the_node_registry_did`, `a_snapshot_resolves_only_enabled_named_instances`, `the_machine_registry_loads_from_disk_and_refuses_what_it_cannot_read`). |
| `test/golden-recorders/run-supervisor-controller.recorder.mjs` | runtime-dir, config layering, cancel kept; lease/launch/trust-store/cwd-lock/sweep recording dropped | **rewired** | Live: `runtime-dir.mjs`, `cancel-registry.mjs`, contract layering over `core/config-standard/dispatch.yaml`. Dead-source fixtures stay: `lease.v1.json` → `controller_lease.rs` (`the_ledger_answers_every_recorded_step_as_the_node_ledger_did`); `launch.v1.json` → `controller_launch.rs` (`every_recorded_envelope_and_refusal_is_built_as_the_node_launcher_built_it`); `trust-store.v1.json` → `controller_trust_store.rs` (`every_recorded_trust_store_call_answers_and_writes_as_node_did`); `cwd-lock.v1.json` → `controller_cwd_lock.rs` (`the_lock_file_name_is_the_directory_identity`, `the_in_flight_refusal_reads_as_the_node_one`); `sweep.v1.json` → `controller_sweep.rs` (`open_attempt_dirs_match_the_recorded_listing`). |
| `test/run-supervisor/adopt-client.test.mjs` | 4 | **retired** | Dead `src/run-supervisor/client.mjs`. Own: `packages/run-supervisor/rust/tests/adopt_matrix.rs` (`adopt_*`), `controller_sweep.rs` (`adopt_scan_judges_each_open_dir_in_process_and_a_dir_without_lock_is_a_legacy_run`, `open_attempt_dirs_match_the_recorded_listing`), `packages/run-supervisor/rust/src/controller/adopt_scan.rs` (`list_open_attempt_dirs`, `adopt_scan`). |
| `test/run-supervisor/direct-crash-matrix.test.mjs` | 5 | **rewired** | Live crash matrix via `fgos run` / direct-harness. Replaced dead `client.mjs`/`cwd-lock.mjs` helpers with `lockHolders`/`probe` from `src/holder-lock` (`dispatch-cwd`). Assertions unchanged. |
| `test/run-supervisor/direct-cutover.test.mjs` | 15 | **retired** | Dead `direct-launch.mjs` + `run-result.mjs`. Own: `packages/run-supervisor/rust/tests/controller_launch.rs` (`every_recorded_envelope_and_refusal_is_built_as_the_node_launcher_built_it`, `paths_gate_commands_lane_transport_and_waits_match_the_recorded_answers`, `the_step_environment_passes_the_allow_list_and_fgos_variables_but_never_a_lock_descriptor`, `an_attempts_writer_id_replaces_what_the_controller_carried`, `the_envelope_and_the_side_file_are_each_written_once_and_the_digest_verifies`, `a_supervisor_that_binds_is_seen_bound_one_that_exits_is_seen_exited_and_a_failed_start_removes_the_secrets`, `a_result_that_never_comes_is_judged_by_the_adopt_door_and_read_once_more`). |
| `test/run-supervisor/fixtures/terminal-controller.mjs` | (fixture) | **retired** | Dead `assignment-runner.mjs`. Harness `startController` rewired to live `fgos run` door (`test/run-supervisor/support/terminal-harness.mjs`). |
| `test/run-supervisor/pane-host.test.mjs` | 1 | **retired** | Dead `herdr-round.mjs` (`retirePane`/`closeLivePane`). Own: `packages/execution/engine/src/transport_round/round.rs` (`retire_pane`, `close_live_pane`); exercised in `packages/execution/engine/tests/transport_round.rs`. |
| `test/run-supervisor/prepare-seat.test.mjs` | 2 | **retired** | Dead `herdr-round.mjs` (`prepareSeat`). Own: `packages/execution/engine/src/transport_round/round.rs` (`prepare_seat`); `packages/execution/engine/tests/transport_round.rs`. |
| `test/run-supervisor/sweep.test.mjs` | 8 | **retired** | Dead `client.mjs` (`sweepAttempts`). Own: `packages/run-supervisor/rust/src/controller/sweep.rs` (`sweep_attempts`); `packages/run-supervisor/rust/tests/controller_sweep.rs` (`sweep_never_throws_and_always_cleans_sockets`, `adopt_scan_judges_each_open_dir_in_process_and_a_dir_without_lock_is_a_legacy_run`); adopt home finalization in `adopt_matrix.rs`. Live Node integration of the same path remains in `crash-matrix-adopt-resume.test.mjs` / `direct-crash-matrix.test.mjs` via `fgos run`. |
| `test/run-supervisor/terminal-groups.test.mjs` | 17 | **retired** | Dead `herdr-round.mjs` (`prepareTerminalAttempt`), `cleanup-trust.mjs`, `trust-store.mjs`. Own: `packages/execution/engine/src/transport_round/round.rs` (`prepare_terminal_attempt`, `cleanup_trust` via steps); `packages/execution/engine/tests/transport_round.rs`; `packages/run-supervisor/rust/tests/controller_trust_store.rs` (`every_recorded_trust_store_call_answers_and_writes_as_node_did`); `packages/execution/engine/tests/settlement.rs` (`cleanup_trust_takes_back_only_what_the_controller_wrote`). |
| `test/run-supervisor/windows-custody.test.mjs` | 1 | **retired** | Dead `cwd-lock.mjs` (`admitSuccessor`) + `direct-launch.mjs`. Own: `packages/run-supervisor/rust/tests/controller_cwd_lock.rs` (`a_custody_successor_takes_a_free_lease_and_a_held_one_is_in_flight`); `controller_launch.rs` (`under_custody_the_callers_lease_is_lent_to_the_supervisor_which_survives_a_borrow_and_the_callers_drop`). |

## Collateral

- `test/run-supervisor/support/terminal-harness.mjs` — `startController` now spawns `fgos run --unit` (live door) instead of the deleted `fixtures/terminal-controller.mjs`.
- `test/suite-baseline.json` — removed `fileCpu` rows for deleted test files only.

## Verify notes

- Dead-import grep over part-A footprint: empty for dead table paths.
- `node --test` on remaining touched files (one at a time; skip cargo-needed): see worker evidence.

## Part A scope boundary

Rows outside 2–4 and 9–17 (convention/setup/session-host/etc.) are not in this part. Other golden recorders that still import dead modules (`assignment-runner.recorder.mjs`, `run-result.recorder.mjs`, `confinement-request.recorder.mjs`) are owned by other phase footprints.
