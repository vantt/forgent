# Phase 3 integration gate — event-store-io-errors-keep-path

Tree: worktree at main tip 4871e5b8 (carries phases 1 and 2). Run inside the confined producer sandbox.
Verdict: **gate NOT green in this run. It is inconclusive, not a proven regression.** Plan status was not touched.

## `npm test` — did not run

The Rust host and addon build finished. The suite then aborted before any test ran:
`EROFS: read-only file system, open '/home/vantt/.local/state/fgos/locks/full-suite.lock'`
(from `scripts/lib/full-suite-queue.mjs:66` via `src/holder-lock/index.mjs:161`).
The sandbox mounts `~/.local/state/fgos` read-only, so the full-suite queue lock cannot be taken.
Pass/fail counts: none. This has to be rerun outside the sandbox.

## `cargo test --workspace --no-fail-fast`

11 test binaries failed; the rest passed. I did not read the panic text of every failure and did not
get a total passed count. Failing tests seen:
- `-p fgos --bin fgos`: 561 passed, 7 failed — all in `wiring::doctor::confinement::tests`
  (`a_home_owned_by_a_dead_process_is_named_by_the_row_and_removed_only_by_the_fix` and 6 in `copies::`).
- `-p fgos --test cli_tests`: 114 passed, 1 failed —
  `the_execution_route_run_unit_op_refuses_an_option_outside_the_contract_and_answers_a_refused_run`
  (assertion: output should contain "that no dispatch applies").
- `-p fgos --test internal_lock_routes`: 2 failed — `quiesce_scan_lists_a_process_working_in_the_workspace`,
  `quiesce_scan_counts_a_process_by_its_own_workspace_and_its_typed_execution_root`.
- `-p fgos --test supervision_verbs`: 2 failed — `a_confined_head_sends_the_coordination_verbs_through_the_request_socket`,
  `a_confined_queue_read_and_a_multi_id_handled_go_through_the_request_socket`.
- `-p fgos-component-authority --test model_checks`: 1 failed —
  `every_top_level_package_contract_file_and_every_prose_contract_has_exactly_one_row`.
- `-p fgos-config --test authoring_equivalence`: 1 failed —
  `standard_files_plus_the_recorded_differences_read_back_as_the_tuned_config`.
- Further failing binaries (about 5 more) are listed in the full cargo output, which was not kept.

Most failures are in confinement, lock, quiesce and socket tests. That fits sandbox interference
(read-only state dir, process/socket visibility), but I did not prove that. None of the names seen touches the
event store or the decision index (the areas phases 1 and 2 changed). A rerun outside the sandbox is needed to confirm.
The event-store crate's `a_failed_event_store_child_is_recorded_with_the_failure_text...` test passed.

## Step 2 — real fault records

I could not read `/home/vantt/projects/forgent/.fgos/logs/invocation-faults.jsonl`: the sandbox denied access to
that path. No record was checked. Proof available for the new detail is the phase 1 test
`a_trigger_io_failure_names_the_operation_and_the_path`, which I did not rerun in isolation here.

## Needed from a non-sandboxed run
1. `npm test` and `cargo test --workspace` with write access to `~/.local/state/fgos`.
2. `grep event-store-end-trigger` in the main checkout's `invocation-faults.jsonl` for records after 2026-11-25T10:03Z.
