# Phase 4 Report: Retire or rewire assignment, run-result and provider tests

## Summary

- Retired 12 test files whose owning modules are deleted from the Node layer and whose behaviors are fully owned by Rust execution crates (`packages/execution/engine`, `packages/execution/rust`, `packages/run-supervisor`, `packages/run-result`).
- Rewired 4 test files to eliminate imports of dead Node modules while keeping tests for live platform behavior.
- Kept 5 test files in the footprint that did not import any dead modules.
- Zero dead module imports remain across all files in this phase's footprint.

## Test Disposition Table

| Test File | Cases | Disposition | Owning Proof or Reason |
|:---|:---:|:---:|:---|
| `test/runner/assignment-cwd-mutex-concurrency.test.mjs` | 13 | retired | `packages/execution/engine/tests/assignment_runner.rs` (`writes_cannot_share_a_cwd`, `an_assignment_that_writes_lends_the_supervisor_its_attempt_lock_and_cwd_lease_as_descriptors_3_and_4`) |
| `test/runner/assignment-dispatch.test.mjs` | 64 | retired | `packages/execution/engine/tests/assignment_runner.rs` (`every_legality_refusal_reads_as_node_stated_it`, `the_replay_digest_is_the_bytes_node_recorded`, `a_resumed_run_returns_the_answer_it_already_settled_and_launches_no_second_worker`, `a_direct_assignment_is_admitted_launched_under_a_supervisor_and_settles`); `packages/execution/engine/tests/settlement.rs` (`the_worker_claim_and_report_are_found_by_round_number_and_directory_order`, `settle_attempt_settles_once_and_finds_its_receipt_on_a_second_run`, `a_dead_login_quarantines_the_account_that_ran_the_attempt_and_the_evidence_says_so`); `test/state/runtime-coordination.test.mjs` (`settleClaim`) |
| `test/runner/assignment-enumerator-guard.test.mjs` | 6 | kept | Static analysis guard for assignment directory listings; does not import dead modules |
| `test/runner/assignment-layout.test.mjs` | 11 | retired | `packages/execution/engine/tests/assignment.rs` (`the_assignment_tree_lists_run_directories_and_stops_at_every_barrier`, `the_node_era_corpus_is_listed_and_found_by_run_id_as_node_did`) |
| `test/runner/assignment-normalizer.test.mjs` | 18 | retired | `packages/execution/engine/tests/assignment.rs` (`the_normalizer_stamps_declared_and_inline_assignments_as_node_did`) |
| `test/runner/assignment-provenance.test.mjs` | 23 | rewired | 6 live tests retained for `domainHarnessFor` and `loadHarnessModule` from `src/runner/work-dispatch.mjs`; 17 tests testing dead `assignment.mjs` (`buildAssignment`/`createAssignmentId`) retired (owned by `packages/execution/engine/tests/assignment.rs`) |
| `test/runner/assignment-runresult.test.mjs` | 16 | retired | `packages/execution/engine/tests/settlement.rs` (`changed_files_are_the_new_dirt_sorted`, `a_pre_launch_dirty_file_that_changed_or_went_missing_is_mutated`, `the_git_door_reads_head_dirt_and_the_committed_diff_of_a_real_checkout`); `packages/execution/rust/tests/run_result.rs` (`workspace_changes_are_attributed_with_the_levels_node_gave`, `worker_claim_evidence_refs_are_correlated_and_never_proven`, `claim_validation_refuses_and_accepts_exactly_the_claims_node_did`); `test/runner/operation-choice.test.mjs` (`interpretAssignmentRunResult`) |
| `test/runner/assignment.test.mjs` | 61 | retired | `packages/execution/engine/tests/assignment.rs` (`assignment_ids_count_up_past_the_directories_and_ids_already_present`, `declared_assignments_are_built_stamped_and_refused_as_node_did`, `the_worker_prompt_is_the_text_node_rendered`, `read_only_is_what_the_stamped_mutation_says`, `inline_assignments_freeze_the_contract_and_caller_as_node_did`); `packages/execution/rust/tests/run_result.rs` (`claim_validation_refuses_and_accepts_exactly_the_claims_node_did`) |
| `test/runner/provider-capacity.test.mjs` | 33 | kept | Tests live `provider-capacity.mjs`; does not import dead modules |
| `test/runner/provider-credential-probe.test.mjs` | 27 | kept | Tests live `provider-credential-probe.mjs`; does not import dead modules |
| `test/runner/provider-credential-renewal.test.mjs` | 47 | rewired | Removed dead imports of `assignment-runner.mjs` and `confinement/authority-twin.mjs`; retired 3 tests calling dead helpers (held home settlement owned by `packages/execution/engine/tests/settlement.rs`; seat lease renewal owned by `packages/execution/engine/tests/assignment_runner.rs`); kept 44 live renewal tests |
| `test/runner/provider-per-cli-credential-sources.test.mjs` | 8 | rewired | Removed import of dead `confinement/request.mjs`; replaced `buildConfinementRequest` with inlined plain request fixture; 8 tests retained |
| `test/runner/provider-pool-lease.test.mjs` | 13 | rewired | Rewired `loadRunnerConfigForDir` import from dead `config-twin.mjs` to live `src/native/execution-door.mjs`; 13 tests retained |
| `test/runner/provider-quarantine-probe.test.mjs` | 6 | kept | Tests live `provider-capacity.mjs`; does not import dead modules |
| `test/runner/run-lock-identity.test.mjs` | 8 | retired | `packages/run-supervisor/rust/tests/controller_lease.rs` (`a_holder_judged_dead_is_reclaimed_and_a_live_one_never_is`, `two_contenders_for_one_epoch_publish_exactly_one_record`) |
| `test/runner/run-outcome.test.mjs` | 18 | retired | `packages/run-result/rust/src/lib.rs` (`test_legacy_derivation_fixture`, `test_run_result_source`) |
| `test/runner/run-result-confinement-label.test.mjs` | 7 | retired | `packages/execution/engine/tests/settlement.rs` (`every_settlement_scenario_writes_the_files_node_wrote`); `packages/execution/engine/tests/assignment_runner.rs` (`a_direct_assignment_is_admitted_launched_under_a_supervisor_and_settles`) |
| `test/runner/run-result-report-complete.test.mjs` | 7 | retired | `packages/execution/engine/tests/settlement.rs` (`a_report_is_declared_complete_only_when_the_seat_finished_on_its_own`) |
| `test/runner/run-result-source-scan.test.mjs` | 2 | kept | Static analysis scan for RunResult usage; does not import dead modules |
| `test/runner/run-result-v2.test.mjs` | 6 | retired | `packages/execution/rust/tests/run_result.rs` (`vocabularies_and_contract_names_match_the_node_release`, `the_writer_writes_the_bytes_node_wrote_for_every_outcome_class`, `readers_give_v1_v2_v3_and_corrupt_records_the_reading_node_gave`, `validators_name_the_same_reasons_for_v2_and_v3`, `deriving_an_outcome_from_a_classification_matches_the_recorded_rows`) |
| `test/runner/run-result-v3-reader.test.mjs` | 10 | retired | `packages/execution/rust/tests/run_result.rs` (`readers_give_v1_v2_v3_and_corrupt_records_the_reading_node_gave`, `validators_name_the_same_reasons_for_v2_and_v3`) |
