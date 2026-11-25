# Phase 5 Report: Retire or rewire the remaining runner tests

**Plan:** `plans/261122-2108-delete-dead-node-execution-closure`  
**Phase:** 5 (`phase-05-tests-runner-rest.md`)  
**Date:** 2026-11-25  

---

## 1. Executive Summary

Phase 5 processed the 23 `test/runner/` files assigned in `closure.md` (rows whose owning phase is 5).

- **Retired & deleted:** **10** files (only dead Node modules; behaviours owned by existing Rust proofs).
- **Rewired:** **13** files (live product behaviour kept; dead imports removed or replaced).
- **Dead imports remaining in footprint:** **0**.
- **Source under `src/`:** untouched (deletion is phase 8).

---

## 2. Test Disposition Table

| Test File | Cases | Disposition | Owning Proof or Reason |
|---|---:|---|---|
| `test/runner/agent-definitions.test.mjs` | 24 rewired (1 case retired) | **rewired** | Live `src/runner/agent-definitions.mjs`. Dropped dead `renderAssignmentPrompt` import and the brief/persona parity case; that behaviour is owned by `packages/execution/engine/tests/assignment.rs` (`the_worker_prompt_is_the_text_node_rendered`). |
| `test/runner/agent-result-claim-contract.test.mjs` | 4 | **retired** | Dead `agent-result-claim-contract.mjs`. `packages/execution/rust/tests/run_result.rs` (`claim_validation_refuses_and_accepts_exactly_the_claims_node_did`, `claim_instructions_read_the_same_to_the_worker`, `a_checker_seat_and_a_recheck_operation_require_an_assessment`). |
| `test/runner/cli-spawn-reconciliation.test.mjs` | 4 | **retired** | Dead `confinement/request.mjs` and `authority-twin.mjs` (live `cleanup.mjs` only supplied a marker helper). `packages/execution/engine/tests/confinement_request.rs` (`a_launch_is_refused_or_prepared_and_its_records_published_as_the_original_did`). |
| `test/runner/config-seat-binding-layers.test.mjs` | 2 | **rewired** | `loadRunnerConfigForDir` → live `src/native/execution-door.mjs`. Assertions unchanged. |
| `test/runner/credential-store.test.mjs` | 3 kept (5 retired) | **rewired** | Kept live `provider-capacity.mjs`, `provider-credential-renewal.mjs`, `confinement/resources.mjs`, `config/facade.mjs`. Retired dead `config-twin` / `transport` / `request` cases; config shape owned by `packages/execution/rust/tests/core_runner_config.rs` (`the_loader_gives_the_checked_config_or_the_refusal_node_gave_for_every_recorded_document`); command/request by `packages/execution/engine/tests/planning.rs` (`executor_resolution_gates_egress_and_picks_the_invocation`) and confinement request tests. |
| `test/runner/custody-successor-admission.test.mjs` | 11 | **retired** | Dead `cwd-lock.mjs` / `direct-launch.mjs`. `packages/run-supervisor/rust/tests/controller_cwd_lock.rs` (`a_custody_successor_takes_a_free_lease_and_a_held_one_is_in_flight`, `the_in_flight_refusal_reads_as_the_node_one`). |
| `test/runner/dead-vocabulary-guard.test.mjs` | 8 kept (2 retired) | **rewired** | Static grep guards kept. Removed dead `config-twin` / `plan.mjs` sections; retired-key refusal owned by `packages/execution/rust/tests/core_runner_config.rs` (`a_refused_door_gives_the_door_message_or_the_retired_key_sentence_with_its_position`); dispatch policy by `packages/execution/engine/tests/planning.rs` (`dispatch_policy_resolves_each_field_with_where_it_came_from`). |
| `test/runner/default-executor-merge.test.mjs` | 1 | **retired** | Dead `withDefaultExecutor` on `config-twin.mjs`. `packages/execution/rust/tests/golden_executor_model.rs` (`every_executor_model_vector_has_the_answer_the_contract_records`). |
| `test/runner/driver-rununit.test.mjs` | 15 rewired (3 retired) | **rewired** | Live Work driver via `operation-choice.mjs` + `runUnitInHost`. Removed dead `digestPinnedInputs` cases; owned by `packages/execution/engine/tests/assignment_runner.rs` (`a_pinned_input_is_hashed_only_inside_an_allowed_root`). `RunnerConfigError` from execution door. |
| `test/runner/effective-execution-contract.test.mjs` | 14 | **retired** | Dead effective-contract / assignment / brief / runner stack. `packages/execution/engine/tests/contract.rs` (`the_effective_contract_constants_are_the_ones_node_exports`, `the_effective_contract_is_built_from_its_parts_as_node_did`, `an_effective_contract_is_validated_field_by_field_as_node_did`, `the_summary_a_worker_reads_matches_node_for_every_built_contract`, `the_digests_cover_canonical_json_and_secrets_are_stripped_as_node_did`, `a_contract_file_is_read_back_and_validated_as_node_did`). |
| `test/runner/egress-governance.test.mjs` | 6 | **retired** | Dead `resolve.mjs` / `transport.mjs`. `packages/execution/engine/tests/planning.rs` (`executor_resolution_gates_egress_and_picks_the_invocation`). |
| `test/runner/evidence-attribution.test.mjs` | 16 | **retired** | Dead `evidence-attribution.mjs`. `packages/execution/rust/tests/run_result.rs` (`workspace_changes_are_attributed_with_the_levels_node_gave`, `worker_claim_evidence_refs_are_correlated_and_never_proven`, `the_policy_refuses_only_proven_writes_and_reports_correlated_ones_as_warnings`). |
| `test/runner/herdr-private-home-trust.test.mjs` | 26 | **retired** | Dead `trust-store.mjs` / `herdr-round.mjs` / `cli.mjs`. `packages/run-supervisor/rust/tests/controller_trust_store.rs` (`every_recorded_trust_store_call_answers_and_writes_as_node_did`). |
| `test/runner/herdr-spawn-adapter.test.mjs` | 1 | **retired** | Dead `transport.mjs` adapter table. `packages/execution/engine/tests/transport.rs` (`adapter_registry_names_and_metadata_match_the_recorded_registry`). |
| `test/runner/loop.test.mjs` | 94 | **rewired** | Live `src/runner/loop.mjs`. `resolveRunWorkerArtifactPath` → `resolveWorkerArtifactPath` from `src/native/execution-door.mjs` (prefix/suffix form). |
| `test/runner/merge-quoted-paths.test.mjs` | 10 | **rewired** | Live `src/runner/merge.mjs`. Inlined `safeGitStatusFiles` via live `src/git/inspect.mjs` + `src/util/git-paths.mjs` (same status walk settlement used). Dirt listing also covered by `packages/execution/engine/tests/settlement.rs` (`changed_files_are_the_new_dirt_sorted`, `the_git_door_reads_head_dirt_and_the_committed_diff_of_a_real_checkout`). |
| `test/runner/operation-choice.test.mjs` | 148 rewired (6 retired) | **rewired** | Live `src/runner/operation-choice.mjs`. `listAssignmentRuns` → execution door. Removed dead `executeAssignment` cases; owned by `packages/execution/engine/tests/assignment_runner.rs` (`every_legality_refusal_reads_as_node_stated_it`) and settlement/assignment engine tests. Dropped unused settlement import. |
| `test/runner/operation-prompt-templates.test.mjs` | 34 | **retired** | Dead operation-prompt / assignment / effective-contract stack. `packages/execution/engine/tests/contract.rs` (`an_assignment_resolves_its_template_from_disk_or_from_a_pinned_snapshot_as_node_did`, `a_template_names_only_bounded_variables_and_renders_with_them_as_node_did`) and `packages/execution/engine/tests/assignment.rs` (`the_worker_prompt_is_the_text_node_rendered`, `a_prompt_names_a_template_it_cannot_render_instead_of_dropping_it`). |
| `test/runner/runner-schema-vocabulary.test.mjs` | 2 kept (1 retired) | **rewired** | Live `src/runner/rigor.mjs` (`RIGOR_VALUES`) and `src/runner/dispatch/run-timeout.mjs` (`RUN_TIMEOUT_MAX_MS`) vs `core/config-schema/runner.schema.yaml`. Dropped dead `adapters.mjs` / `seat-resolver.mjs` / `loops/index.mjs` / `config-twin.mjs` assertions. No Rust test reads `runner.schema.yaml`. |
| `test/runner/spawn-worker.test.mjs` | 18 | **rewired** | Live `work-dispatch.mjs`. `DispatchError` / `RunnerConfigError` from execution door; `MAX_DISPATCH_DEPTH = 3` matches `packages/execution/rust/src/dispatch_env.rs` and `packages/execution/engine/tests/transport.rs` (`dispatch_depth_reads_a_finite_non_negative_number_and_nothing_else`). |
| `test/runner/tier-cell.test.mjs` | 16 | **rewired** | Live `tier-cell.mjs` (`parseTierCell`). `loadRunnerConfigForDir` / `RunnerConfigError` from execution door. Local `supportsPolicyTier` helper mirrors the few lines that used dead `config-twin` (parseTierCell length check). Parse behaviour also owned by `packages/execution/engine/tests/assignment.rs` (`a_tier_cell_parses_to_its_ordered_entries_or_names_what_is_wrong`). |
| `test/runner/tier-fallback-config.test.mjs` | 11 | **rewired** | `loadRunnerConfigForDir` → execution door; live `RunnerConfigError` module kept. |
| `test/runner/work-unit-for.test.mjs` | 26 | **rewired** | Live `work-dispatch.mjs`. `validateUnit` / `RunnerConfigError` → execution door. Unit validation also owned by `packages/execution/rust/tests/core_unit.rs` (`validate_unit_answers_as_node_does_for_every_recorded_input`). |

---

## 3. Verification

1. **Dead import scan (step 5):**  
   `git grep` over the phase footprint for all 63 dead paths → **0 hits** on remaining files.

2. **Remaining tests run via** `node scripts/run-tests.mjs` (stages native addon):

   | File | Result |
   |---|---|
   | `agent-definitions.test.mjs` | pass (24) |
   | `runner-schema-vocabulary.test.mjs` | pass (2) |
   | `config-seat-binding-layers.test.mjs` | pass (2) |
   | `credential-store.test.mjs` | pass (3) |
   | `dead-vocabulary-guard.test.mjs` | pass (8) |
   | `tier-cell.test.mjs` | pass (16) |
   | `tier-fallback-config.test.mjs` | pass (11) |
   | `work-unit-for.test.mjs` | pass (26) |
   | `merge-quoted-paths.test.mjs` | pass (10) |
   | `operation-choice.test.mjs` (non-spawn name patterns) | pass (37 subset) |
   | `driver-rununit.test.mjs` / `spawn-worker.test.mjs` / full `loop` / spawn-heavy `operation-choice` | **blocked on this host**: kernel refuses unprivileged user namespaces (`bwrap: No permissions to create a new namespace`). Failures are confinement probe `run-output-writable`, not rewire regressions. Same class of skip other suites use via `bwrapUsable()`. |

3. **Every Rust test name cited above** was checked with `rg 'fn <name>'` and exists.

4. **No `src/` edits.** Helper APIs under `test/helpers/**` unchanged.

---

## 4. Notes

- Closure provisional `retire`/`rewire` labels were followed where the test only proved dead modules (retire) or proved live product paths (rewire), matching design principle 8 and phases 2–4 practice.
- `loop.test.mjs` and `driver-rununit.test.mjs` were rewired, not retired, as required by the phase file.
