# Phase 01 part B: host verbs, Node deletion, docs

## What moved

- `fgos worktree create|remove` and `fgos resync-worktree` are native routes. New `apps/fgos/src/wiring/worktree.rs` (projector, three operations `worktree.create|remove|resync`, one provider) carries a call to `fgos-checkout`; no change to the crate (no re-export was missing).
- Wired in `wiring/mod.rs`, `main.rs` (descriptor table and provider registration), `cli_projector.rs` (request mapping and the multi-operation fan-out of the `worktree` route), `routing.rs` (sub-command table; `worktree` keeps the Node wording for a missing/unknown sub-verb, so such a call is exit 4 and not recorded, as `test/observe/invocation-fault-log.test.mjs` requires), `catalog.rs` (three operation rows, count 38 -> 41), `apps/fgos/Cargo.toml` (`fgos-checkout`), `Cargo.lock`.
- Registry: `--bare` added with the requested help text, create description/examples updated, `native: true` on both entries. Annotations gained `worktree` and `resync-worktree`; `command-routes.json` and `command-manifest.json` regenerated with `node scripts/export-command-selectors.mjs` (routes `worktree`, `resync-worktree` are `native`).
- Exit codes (all `cli_tests.rs` cases): 4 for arity, missing/unknown sub, bare `--branch`/`--base`/`--delivered-to`, missing `--delivered-to`, and `remove --discard-ignored ../w --delivered-to HEAD` (the path is the flag's value, no path left: same as Node); 1 for `--branch` with `--detach`, an unregistered path, an undeliverable ref. Hold timeout maps to `lock-timeout` (7), every other engine failure to the uncategorised 1.
- Deleted: `src/verbs/worktree/**` (82 lines), the two arms and the `resyncWorktree` import name in `bin/fgos.mjs` (34 lines), `test/verbs/worktree-create.test.mjs`, `test/verbs/worktree-remove.test.mjs`, `test/e2e/resync-worktree-bare-invocation.test.mjs`, three layer entries in `docs/architecture-manifest.json` (no `doors` entry named them). `src/runner/worktree.mjs` untouched.
- Docs: `docs/platform/git/spec.md` paragraph at `:177`, CHANGELOG `[Unreleased]` line.

## Retired test -> owner now

| Retired Node test | Owner now |
|---|---|
| `worktree-create`: public use case returns path and branch through the native port | `packages/execution/checkout/tests/checkout.rs` `a_branch_a_detached_head_and_a_literal_base_each_make_a_checkout`; envelope fields by `cli_tests.rs` `a_detached_checkout_without_provisioning_is_created_and_removed_through_the_worktree_verb` |
| `worktree-create`: CLI adapter creates the checkout and emits the JSON envelope | same `cli_tests.rs` case (argv, envelope, no node started) |
| `worktree-create`: runs the setup commands after the port returns with the main checkout in `FGOS_REPO_ROOT` | `checkout.rs` `provisioning_installs_copies_skills_runs_setup_with_the_main_root_and_records_it`, `no_git_lock_is_held_while_a_setup_command_runs`, `a_failing_setup_command_fails_the_create_and_leaves_the_checkout_and_its_record` |
| `worktree-remove`: deletes a clean delivered worktree and binds the delivery statement | `checkout.rs` `remove_sets_provisioned_bytes_aside_and_deletes_them_with_the_record`; the digest and fields by `cli_tests.rs` removal case |
| `worktree-remove`: refuses a dirty worktree, leaves it untouched | the Git port's own remove tests (`packages/git/rust`, `test/git/worktree.test.mjs`); the engine only forwards the refusal (`a_refused_remove_puts_the_set_aside_bytes_back_and_keeps_the_record`) |
| `worktree-remove`: refuses when the tip is not contained in the delivery target | same Git port proof (`worktree-delivery-unproven`) |
| `worktree-remove`: unknown ref, unregistered path, missing `--delivered-to` | `checkout.rs` `remove_refuses_an_unregistered_path_and_an_undeliverable_ref`; exit codes by `cli_tests.rs` `worktree_calls_answer_the_exit_codes_of_their_argv_shape` and `a_removal_of_an_undeliverable_ref_is_refused_and_leaves_the_checkout` |
| `worktree-remove`: takes back exactly what create provisioned | `checkout.rs` `remove_sets_provisioned_bytes_aside_and_deletes_them_with_the_record`, `a_node_provisioned_checkouts_record_set_aside_exactly_what_it_names` |
| `worktree-remove`: refuses on a worker-edited copy, puts bytes back, discards only when asked | `checkout.rs` `a_refused_remove_puts_the_set_aside_bytes_back_and_keeps_the_record`, `discard_ignored_deletes_ignored_bytes_after_the_other_checks_and_counts_them` |
| `worktree-remove`: registered with a required `--delivered-to` | the route table (`test/rust-host/command-routes.test.mjs`) and the exit-4 cases of `cli_tests.rs` |
| `worktree-remove`: CLI adapter removes a provisioned worktree, `--discard-ignored`, usage error | `cli_tests.rs` exit-code table (incl. the `--discard-ignored ../w` mis-parse); outcomes by the two `checkout.rs` cases above |
| `resync-worktree-bare-invocation`: bare resync inside a stale worktree resolves the main checkout and repairs it | `cli_tests.rs` `a_bare_resync_worktree_inside_a_linked_worktree_resolves_the_main_checkout_and_repairs_it` (also `--dir` form); outcomes by `checkout.rs` `resync_moves_a_branch_checkout_to_the_new_tip_and_carries_staged_work` |
| `resync-worktree-bare-invocation`: `--dir <mainRoot>` still works | same `cli_tests.rs` case (second call) |

## Gates run

- `cargo test -p fgos --test cli_tests worktree` 5 passed; `cargo test -p fgos --bins` 379 passed (one earlier run showed 63 git-fixture failures that did not repeat on rerun: flaky, not reproduced); `cargo test -p fgos-host-runtime` 47 passed; `cargo clippy -p fgos --all-targets -- -D warnings` clean; `cargo fmt --all --check` clean; `cargo check -p fgos` for x86_64-pc-windows-msvc and aarch64-apple-darwin finished.
- `node scripts/run-tests.mjs test/rust-host/command-routes.test.mjs test/architecture.test.mjs test/observe/invocation-fault-log.test.mjs test/scripts/doc-health.test.mjs test/cli/fgos-disconnected-worktree-guard.test.mjs` green.
- `test/setup/git-mutation-census.test.mjs` fails by design: the census still names the deleted `src/verbs/worktree/*`, `bin/fgos.mjs` and `command-registry.mjs` digests changed. Not regenerated (lead).
- Not run: `test/rust-host/help-routes.test.mjs` and `internal-routes.test.mjs` (need `target/release/libfgos_node_addon.so`, a release workspace build), `node scripts/git-one-door-scan.mjs` (its Git door fails on the read-only `.git` of this sandbox), full `npm test`/`cargo test --workspace`.
- Two `cli_tests.rs` cases fail, both in the init verb and untouched by this change: `init_moves_an_older_releases_json_config_...` (`config-key-in-wrong-file ... gateway.token`) and `init_makes_the_machine_and_project_files_in_process_...` (`config.project.created` null). Not compared against the base; likely pre-existing config/registry drift.

## For the lead

- Parity run (Step 3) skipped as instructed; the deleted Node arms are in git history.
- Outside my scope, needed: regenerate `packages/git/contracts/mutation-census.v1.json`, `test/suite-baseline.json` (three deleted test files at lines 102, 577, 578), and edit `docs/reading-map.md:174` (still lists `src/verbs/worktree`).
- Behaviour kept as it was: `--delivered-to HEAD` is refused (`HEAD` is not a ref name the literal resolver takes), so the bare-checkout case removes with the commit's object id. The brief named `HEAD`; if `HEAD` should be accepted that is a new behaviour, left for a backlog row.
- `fgos-checkout` `resync` message for `--branch` without a value and `--path` without a value are new host-side refusals (Node threw a type error); exit 4 and 1.
- Windows `remove` stays unproven (CI only `cargo check` for msvc), as the phase risk says.

Status: DONE_WITH_CONCERNS
