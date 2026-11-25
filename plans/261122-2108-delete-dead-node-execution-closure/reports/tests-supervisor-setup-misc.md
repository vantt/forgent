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
| `test/run-supervisor/pane-host.test.mjs` | 1 | **retired** | Dead `herdr-round.mjs` (`retirePane`/`closeLivePane`). Own: `packages/execution/engine/tests/transport_round.rs` (`a_live_pane_is_closed_once_and_a_gone_pane_is_not_closed_again`); src `retire_pane`/`close_live_pane` in `packages/execution/engine/src/transport_round/round.rs`. |
| `test/run-supervisor/prepare-seat.test.mjs` | 2 | **retired** | Dead `herdr-round.mjs` (`prepareSeat`). Own: `packages/execution/engine/tests/transport_round.rs` (`a_prepared_attempt_writes_the_brief_opens_one_pane_for_the_attempts_key_and_records_the_allocation`, `a_prepared_attempt_is_handed_over_with_its_lock_and_a_stub_agent_settles_on_the_brief`); src `prepare_seat` in `round.rs`. |
| `test/run-supervisor/sweep.test.mjs` | 8 | **retired** | Dead `client.mjs` (`sweepAttempts`). Own: `packages/run-supervisor/rust/src/controller/sweep.rs` (`sweep_attempts`); `packages/run-supervisor/rust/tests/controller_sweep.rs` (`sweep_never_throws_and_always_cleans_sockets`, `adopt_scan_judges_each_open_dir_in_process_and_a_dir_without_lock_is_a_legacy_run`); adopt home finalization in `adopt_matrix.rs`. Live Node integration of the same path remains in `crash-matrix-adopt-resume.test.mjs` / `direct-crash-matrix.test.mjs` via `fgos run`. |
| `test/run-supervisor/terminal-groups.test.mjs` | 17 | **retired** | Dead `herdr-round.mjs` (`prepareTerminalAttempt`), `cleanup-trust.mjs`, `trust-store.mjs`. Own: `packages/execution/engine/tests/transport_round.rs` (`a_prepared_attempt_writes_the_brief_opens_one_pane_for_the_attempts_key_and_records_the_allocation`, `the_trust_decision_is_read_from_the_accounts_store_and_written_where_the_agent_reads_it`); `packages/run-supervisor/rust/tests/controller_trust_store.rs` (`every_recorded_trust_store_call_answers_and_writes_as_node_did`); `packages/execution/engine/tests/settlement.rs` (`cleanup_trust_takes_back_only_what_the_controller_wrote`). |
| `test/run-supervisor/windows-custody.test.mjs` | 1 | **retired** | Dead `cwd-lock.mjs` (`admitSuccessor`) + `direct-launch.mjs`. Own: `packages/run-supervisor/rust/tests/controller_cwd_lock.rs` (`a_custody_successor_takes_a_free_lease_and_a_held_one_is_in_flight`); `controller_launch.rs` (`under_custody_the_callers_lease_is_lent_to_the_supervisor_which_survives_a_borrow_and_the_callers_drop`). |

## Collateral

- `test/run-supervisor/support/terminal-harness.mjs` — `startController` now spawns `fgos run --unit` (live door) instead of the deleted `fixtures/terminal-controller.mjs`.
- `test/suite-baseline.json` — removed `fileCpu` rows for deleted test files only.

## Verify notes

- Dead-import grep over part-A footprint: empty for dead table paths.
- `node --test` on remaining touched files (one at a time; skip cargo-needed): see worker evidence.

## Part A scope boundary

Rows outside 2–4 and 9–17 (convention/setup/session-host/etc.) are not in this part. Other golden recorders that still import dead modules (`assignment-runner.recorder.mjs`, `run-result.recorder.mjs`, `confinement-request.recorder.mjs`) are owned by other phase footprints.

# Phase 6 part B — setup/session/convention tests & remaining golden recorders

**Phase:** 6 (part B — rows 1 and 106–114 of the closure test-importer table, remaining golden recorders, helpers)  
**Commit subject:** `test: retire or rewire the remaining tests, recorders and helpers that borrow the dead execution modules`

## Disposition table (part B)

| test file | cases | disposition | owning proof or reason |
|---|---|---|---|
| `test/convention/seat-id.test.mjs` | 4 | **rewired** | Dropped dead `checkDeclaredSeats` (`seat-resolver.mjs`); workflow seat case uses live convention `assertSeatId` (same seat-id rule). `handoffRef` already on live `execution-door.mjs`. Assertions unchanged. |
| `test/seat-binding/client.test.mjs` | (file) | **rewired** | `MODEL_POLICY_TIERS` from dead `config-twin.mjs` → `executionVocabulary().MODEL_POLICY_TIERS` on `src/native/execution-door.mjs`. |
| `test/session-host/head-start.test.mjs` | (file) | **rewired** | `headOf` from dead `session-attempt.mjs` → live `src/native/execution-door.mjs` (same addon the dead facade re-exported). |
| `test/session-identity/attempt-writer-id.test.mjs` | 1 case rewired | **rewired** | Dropped dead `workerBaseEnv` (`adapters.mjs`); env digest uses literal allowlisted `{ PATH, FGOS_SESSION_ID }` fixture (allowlist contract `packages/run-supervisor/contracts/worker-env-allowlist.v1.json`). Assertions of sameness unchanged. |
| `test/setup/capability-catalog-doctrine.test.mjs` | 3 decide cases retired; catalog/docs cases kept | **retired** (decide half) | Dead `compileDispatchPlan` (`plan.mjs`) + `bindable` helper. Own: `packages/execution/rust/tests/golden_decide.rs` (`every_decide_and_hook_vector_has_the_answer_the_contract_records`) over `packages/execution/contracts/decide.v1.json` (purpose/tool/mcp vectors). Shared catalog/doctrine file cases stay. |
| `test/setup/gate-kill-grace.test.mjs` | 2 | **retired** (file deleted) | Dead `gate-kill-grace.mjs`. Own: `packages/run-supervisor/rust/tests/controller_config.rs` (`dispatch_settings_resolve_project_over_global_over_standard`, `a_config_file_the_door_refuses_is_an_error_not_a_default`) over `packages/run-supervisor/contracts/controller/config.v1.json`. |
| `test/setup/packaged-definitions.test.mjs` | 1 case retired | **retired** (templates case) | Dead `discoverOperationPromptTemplates`. Own: `packages/execution/engine/tests/contract.rs` (`template_discovery_and_lookup_answer_as_node_did_over_every_tier_and_refusal`) over `packages/execution/contracts/execution-contract/templates.json`. Other packaged definition cases stay. |
| `test/setup/seat-binding-dry-bind.test.mjs` | (file) | **rewired** | `loadRunnerConfigForDir` + `shippedCatalog` from dead `config-twin`/`shipped-catalog` → live `src/native/execution-door.mjs` (same surface `src/setup/seat-binding-checks.mjs` uses). |
| `test/state/work-size-rigor.test.mjs` | 2 dispatch cases retired; fold/rebuild cases kept | **retired** (dispatch half) | Dead `effectiveDispatchPolicy` (`plan.mjs`) + `bindable`. Own: `packages/execution/engine/tests/planning.rs` (`dispatch_policy_resolves_each_field_with_where_it_came_from`) over `packages/execution/contracts/planning/policy.json`. |
| `test/util/session-identity.test.mjs` | 1 case rewired | **rewired** | Dropped dead dynamic import of `execution-contract.mjs` `WRITER_ID_RE`/`MAX_WRITER_ID_LENGTH`; literals match `packages/identity/contracts/identity.writer.v1.json`. Rust owns constants: `packages/execution/engine/tests/contract.rs` (`the_contract_constants_are_the_ones_node_exports`). |
| `test/helpers/declared-assignment.mjs` | helper | **deleted** | No importers left after part A + part B (`git grep helpers/declared-assignment` empty outside the file). |
| `test/helpers/work-seat-config.mjs` | helper | **deleted** | No importers left after capability-catalog and work-size-rigor rewires. |
| `test/golden-recorders/run-result.recorder.mjs` | all | **deleted** | All sources dead (`run-result`, `evidence-attribution`, `agent-result-claim-contract`). Fixtures stay under `packages/execution/contracts/run-result/` → `packages/execution/rust/tests/run_result.rs`. |
| `test/golden-recorders/execution-contract.recorder.mjs` | all | **deleted** | All primary sources dead (`operation-prompt-templates`, `execution-contract`, `effective-execution-contract`, `config-twin`). Fixtures stay → `packages/execution/engine/tests/contract.rs` (`template_discovery_*`, `the_contract_constants_*`, `the_effective_contract_*`, …). |
| `test/golden-recorders/confinement-request.recorder.mjs` | all | **deleted** | Primary sources dead (`request`, `authority-twin`, `backend-registry`, `policies`); cleanup only used as fixture setup for dead `finalizeAttemptHome`. Fixtures stay → `packages/execution/engine/tests/confinement_request.rs` (`a_request_is_built_from_the_seams_arguments`, `a_launch_is_refused_or_prepared_and_its_records_published_as_the_original_did`, …). |
| `test/golden-recorders/assignment.recorder.mjs` | tier-cell kept; rest dropped | **rewired** | Live `tier-cell.mjs` only. Dead fixtures stay → `packages/execution/engine/tests/assignment.rs` (`the_normalizer_stamps_*`, `the_brief_and_its_pointer_*`, `a_work_item_input_*`, `the_assignment_tree_*`, `the_node_era_corpus_*`). Live: `a_tier_cell_parses_to_its_ordered_entries_or_names_what_is_wrong`. |
| `test/golden-recorders/assignment-runner.recorder.mjs` | replay-digest kept; rest dropped | **rewired** | Live `src/seat-binding/client.mjs` digest only. Dead fixtures stay → `packages/execution/engine/tests/assignment_runner.rs` (`every_legality_refusal_*`, `the_envelope_lanes_field_*`, `the_argv_an_agent_starts_with_*`, `a_pinned_input_*`, …). Live: `the_replay_digest_is_the_bytes_node_recorded`. |
| `test/golden-recorders/transport.recorder.mjs` | live sections kept | **rewired** | Keeps live `provider-adapter`, `terminal-slot`, `worker-session`, `worker-session-boot`. Dropped dead `mechanism`, `adapters`, `visibility-session`, `worker-home`. Fixtures stay → `packages/execution/engine/tests/transport.rs` (matching `fn` names for each fixture). |
| `test/golden-recorders/confinement-policy.recorder.mjs` | resources kept; policy dropped | **rewired** | Keeps live `resources.mjs` + `workspace-paths.mjs`. Dropped dead `policies.mjs` + `bypass-pairing.mjs`. `policy.v1.json` stays → `packages/execution/engine/tests/confinement_policy.rs` (`policy_document_shape_is_closed_and_judged_like_node_judged_it`, …). |
| `test/golden-recorders/core-runner-config.recorder.mjs` | mixed | **NEEDS_CONTEXT** | Loads dead `config-twin` plus swaps of dead `unit-control`/`custody-door`/`unit-state`, and live `unit-run-record` (door re-export). Config half's facade-swap recording does not map cleanly onto the live Rust `loadRunnerConfig` door; run-facts half's `__reads` fakes no longer reach the addon. Fixtures stay → `packages/execution/rust/tests/core_runner_config.rs` (`the_loader_gives_the_checked_config_or_the_refusal_node_gave_for_every_recorded_document`, `the_unit_run_facts_read_the_record_and_the_two_reads_the_caller_made`, `a_unit_run_is_judged_by_the_first_keep_reason_that_fires_else_it_may_go`). Left untouched. |
| `test/golden-recorders/credentials.recorder.mjs` | — | **unchanged** | Only live `provider-credential-renewal.mjs`. |
| `test/golden-recorders/seam-scan.mjs` | — | **unchanged** | Path scanner, does not load dead modules as SUT. |

## Collateral (part B)

- Helpers `test/helpers/declared-assignment.mjs` and `test/helpers/work-seat-config.mjs` deleted (zero importers).
- No package.json/docs/scripts references to deleted recorders found outside write scope (self-comments only).
- Baselines: no `fileCpu`/decision-code rows existed for the deleted `gate-kill-grace` file or removed test titles.

## Verify notes (part B)

- Dead-import grep over part-B touched files (excluding `core-runner-config.recorder.mjs` NEEDS_CONTEXT): empty.
- `node --test` on remaining touched test files one at a time (skip host/cargo-needed as noted).

