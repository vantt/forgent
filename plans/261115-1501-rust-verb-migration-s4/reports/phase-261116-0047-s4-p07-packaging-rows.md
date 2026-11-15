# S4 phase 07: packaging doctor rows in Rust

Branch `rust-verb-migration-program/s4-p07`, rebased on the integration head `4444d2c54` (phases 01, 02, 03, 05, 06, 08, 09, 11
in; 04 and 10 not yet). Status: DONE_WITH_CONCERNS.

## What moved

17 rows and 7 fixes of owner `rust:packaging` are judged in process by the host (`apps/fgos/src/wiring/doctor/packaging.rs`, one
`Rows` group; the two timer rows stay in `mailbox.rs`, phase 06).

| Group | Rows | Fixes | Judged by |
|---|---|---|---|
| install | `cli-version-visible`, `curl-available`, `bwrap-available`, `project-fgos-launcher` | `project-fgos-launcher`, `bin-discovery-cache` | `resolve_package_version`/`git_commit_at`, the process door, `launcher.rs`, new `bin_cache.rs` |
| hook wiring | `dispatch-decide-hook-wired`, `codex-`, `agy-`, `omp-`, `pi-hook-wired` | the same five | `agent_hooks.rs` (`check_hook`, `install_hook`, `install_message`; the shim probe runs inside it) |
| agent-config reports | `claude-plugin-marketplace`, `agy-permissions-configured`, `mailbox-claude-accept` | - | `agent_config.rs` (report only) |
| release | `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `active-release-matches-checkout`, `activation-matches-pin` | - | new `release_rows.rs` over `source_payload.rs`, `init.rs` `pin_note_of` (built by a fork in `rvm-s4-p07-rr`, cherry-picked, same branch) |

F18, first branch: the source-payload rule moved whole into `fgos-distribution::source_payload`; the release builder asks the host
(`fgos internal source-payload <root> --protocol 1`, a host route like `seat-binding`, not a verb or route-table entry); the Node walker
is gone and every caller moved in the same change. `bin-discovery-cache`: written only by `bin_cache.rs`, read by the Node bin discovery
and the shell script, one golden (`tests/goldens/bin-cache-file.json`) both readers pin.

Not moved: `omp-natives-present` and `agy-sub-homes-configured` (read runner config, `bridge:S5`), `node-version-and-git` (phase 04).

## Deleted (D14, against this head)

`src/setup/{agent-wiring,mailbox-claude-accept,project-launcher,version-info,claude-code-hooks}.mjs`, the row bodies and registrations of
all of the above, `refreshGlobalBinCache`, `checkAgyPermissionsConfigured` and the agy default settings (the sub-HOME reader stays),
the Node source-payload walker. Kept on purpose: `agent-hooks.mjs`, `mailbox-limits.mjs` (MAIL's answer, the frozen sets),
`omp-natives-checks.mjs` (S5 row), `agy-permissions.mjs` (S5/S6a readers), `checkBwrapAvailable` (called by two S6a confinement rows;
a Rust twin until they move: noted in the new `packaging doctor judgments` row). Re-run `rg` of each deleted name once 04 and 10 land;
at this head nothing imports any of them.

## Doors (each with a seeded negative case in `test/architecture.test.mjs`)

New: `packaging doctor judgments` (door, debt none; Node and Rust names of the rows), `global fgos path cache` (door, `retiredBy` S7),
`release source payload selection` (fork). Edited: `no Node from the native packaging verbs` (the named allowance is `agent_hooks.rs`, the
hook rows' shim probe; a pattern keeps any other file from spelling the probe), `agent hook table` (the `registrations.mjs` debt entry
leaves; `agent-hooks.mjs` stays, retired by the mailbox lane), `person's agent config writes` (debt reason and `retiredBy` now S5/S6a),
`installation shim and activation record location` (`project-launcher.mjs` leaves), `run a bounded child and find a program` (the
`firstOnPath` entry leaves). Tiers and `files` entries of the deleted modules removed.

## Retired test -> owner now

| Retired | Owner now |
|---|---|
| `test/setup/claude-code-hooks.test.mjs` (fill-only, idempotent, malformed, wired) | `agent_hooks.rs` `every_recorded_case_installs_checks_and_uninstalls_byte_for_byte_as_the_earlier_module_did` over `agent-hooks-vectors.json` (claude cases); `install_message` test; parity `agent-directories-hooks-fixed-then-judged` |
| `agent-hooks.test.mjs` | not retired: the module stays (MAIL); it keeps its twin pin of the vectors |
| `test/setup/mailbox-claude-accept.test.mjs` | `agent_config.rs` `the_accept_row_says_what_the_settings_file_holds_and_when_nothing_is_needed`, `claude_user_settings_follow_the_config_dir_variable_then_the_home`; parity `claude-accepts-cross-session-input-or-holds-it-or-cannot-be-read` |
| `test/setup/plugin-marketplace-doctor-check.test.mjs` | `agent_config.rs` `the_marketplace_row_reports_each_state_of_the_claude_plugin_surface_and_never_writes`; parity `claude-on-the-path-*` |
| `agy-permissions.test.mjs` (permissions row, 2 cases) | `agent_config.rs` `the_agy_permission_row_warns_without_always_proceed_and_a_deny_list_and_passes_with_both`; parity `agy-on-the-path-without-then-with-its-settings`; sub-HOME cases stay |
| `test/setup/project-launcher.test.mjs` | `launcher.rs` tests (bodies pinned by digest, release install, foreign fgos, stale launcher, source checkout, cmd launcher, each project runs its own release, committed shim refused, state root inputs, outside a project) |
| `test/setup/curl-check.test.mjs`, `bwrap-check.test.mjs` registration case | `packaging.rs` `a_missing_tool_is_the_os_error_name_and_a_failing_one_the_command_line`, `a_tool_that_runs_passes_...`; every parity case compares both rows (`bwrap` function itself keeps its Node test: S6a rows use it) |
| `test/cli/fgos-version.test.mjs`, `version-no-git-noise.test.mjs`, the `registrations.test.mjs` version case | `packaging.rs` `the_version_row_names_the_version_and_the_commit_of_a_checkout_or_says_there_is_none`; `lib.rs` `the_commit_is_the_first_twelve_digits_of_the_checkouts_own_head_and_none_outside_a_checkout` |
| `bin-discovery.test.mjs` `refreshGlobalBinCache` x3 | `bin_cache.rs` (4 tests: first populate with the pinned bytes and modes, idempotent, stale and cleared, garbage cache); the Node reader reads the golden (one case kept) |
| `active-release-drift-check`: equal payload, writes nothing | `release_rows.rs` `an_equal_payload_passes_against_the_doctor_dir_not_the_process_dir_and_the_row_writes_nothing` |
| same: changed, missing, extra, guidance, five examples | `a_working_tree_edit_is_changed_...`, `at_most_five_examples_...` |
| same: outside a checkout, no activation, development manifest | `a_directory_that_is_not_the_fgos_source_checkout_...`, `a_checkout_with_no_activation_of_its_own_...`, `a_development_manifest_that_names_this_checkout_...` |
| same: linked worktree, foreign release in the environment | `a_linked_worktree_is_judged_by_the_activation_of_its_own_directory_only`, `a_foreign_release_in_the_environment_cannot_override_...` |
| same: shim, dependency and prefix exclusions, ignored `.agents` files | `dependencies_generated_shims_and_a_neighbouring_payload_prefix_...`, `a_declared_dependency_namespace_...`, `files_the_repository_ignores_...` |
| same: the 20 fault cases (JSON, links, escapes, missing) | `every_unreadable_unsafe_or_malformed_input_fails_this_row_...`, `a_link_anywhere_on_the_way_...`, `an_entry_the_comparison_ignores_still_has_to_obey_the_confined_manifest_tree` |
| same: builder selection agrees with doctor | `a_payload_staged_by_the_release_builder_layout_with_production_dependencies_compares_equal`; `release-tree.test.mjs` and `native-addon.test.mjs` through the host |
| same: unsafe source fails only its row and doctor continues | not ported: the engine isolates a failing row (phase 03 tests), this was a CLI wiring proof |
| `pin-drift-check.test.mjs` | `tests/pin_drift.rs` is the one reader of the golden; row semantics in `release_rows.rs` `the_pin_row_says_what_the_shared_cases_say_...`, `...skips_with_no_pin_or_no_activation_...`, `an_equal_pin_is_named_...` |
| `release-targets.test.mjs` target case | `release_rows.rs` `the_target_row_approves_the_published_targets_...` |
| `release-tree.test.mjs` R4 (host binary and payload rows) | `release_rows.rs` `the_host_binary_row_follows_...`, `a_binary_staged_as_a_link_...`, `with_no_release_and_no_checkout_...`, `the_environment_names_the_release_...`, `a_payload_root_or_entry_that_escapes_...` |
| `source-payload.test.mjs` walker case | `source_payload.rs` tests (walk, refusals, Git filter, nested root); the Node file keeps one wiring case through the host |
| `doctor-bridge.test.mjs` ids `curl-available`/`bwrap-available` | same cases over two rows that stay bridged (`agent-type-names-unique`, `operation-prompt-templates-valid`) |

Workflow lines naming `curl-check` and `project-launcher` tests (`release-assets-check.yml`) now run `cargo test -p fgos --bin fgos wiring::doctor::packaging`
beside the existing `cargo test -p fgos-distribution`.

## Parity (host vs base release 118df7065, `doctor.cases.mjs`, 77 cases)

Green except the case I added and dropped: `doctor --fix --dir <nonexistent>` differs in the identity rows (the base spawned the host
with a missing cwd: `identity machine failed (ENOENT)`; the host answers from process); that is phase 05's layer, accepted, not in the table.
New cases: agent directories judged before and after `--fix` (twice), hooks of an earlier release replaced in place (Claude, Codex),
agy on PATH without and with its settings, `claude` on PATH with and without the plugin, Claude accept states (accept, hold, default,
unreadable), the path cache following the `fgos` on PATH (cache, no-op, cleared), a pin the activation differs from, an unreadable pin,
the source-checkout marker without an activation. One real difference found and fixed: `--dir` naming a missing path (Node: Claude's
hook row and `mailbox-claude-accept` say `config-request-invalid (projectRoot)`, the other CLIs are "not required"). The launcher row's
release branch cannot be reached in parity (both entries run from a source checkout); `launcher.rs` owns it.

## Gates

- `cargo fmt --all --check`: ok. `clippy --locked -p fgos -p fgos-distribution --all-targets -D warnings`: ok (only third-party `arraydeque` lifetime warnings).
- `cargo test --locked -p fgos --no-fail-fast`: all green (266 bin, 67 cli, others). `cargo test --locked -p fgos-distribution --no-fail-fast`: 233 lib + integration green.
- msvc and darwin `cargo check --locked -p fgos -p fgos-distribution --tests`: no error, no warning in a file this phase touched.
- Census regenerated: 0 undeclared sites. `export-command-selectors --check`: clean.
- Node, one process at a time: `test/setup/*.test.mjs`, `test/rust-host/fgctl-*`, `release-tree`, `dev-host`, `harness`, `closing-block`, `internal-routes`, `command-routes`,
  `release-targets`, `test/install-packaging`, `seat-binding/route-doctor-check`, `scripts/fgos-shell-integration`, `scripts/git-one-door-declarations`,
  `test/distribution/*`, `cli/verb-exit`, `cli/fgos-manifest`, `state/domain-registry-compiled`, `git/main-checkout-delete-guard`, `architecture`, `git-mutation-census`: 830 tests, 0 failed.
  `test/rust-host/verb-parity.test.mjs`: doctor 77 of 77 (after dropping the case above), wire-agents and uninstall green.
- Tests my change could reach beyond that set (series gate runs the full suite): anything reading `DOCTOR_CHECKS` through the harness (about 30 files; the importers ran),
  tests that run the host doctor with a bare HOME (`test/event-store/*`, `test/git/*`, `test/runner/dispatch-confinement-*`, `operation-prompt-templates`,
  `provider-credential-renewal`, `dispatch-governance-operability`), anything that builds a release (`test/scripts/release-packaging`, `native-addon`): the builder now needs a
  working `FGOS_HOST_BIN` to list the payload. `closing-block.test.mjs` needed a set-up project (hook file from the vectors, a launcher first on PATH) because the host now judges those rows.

## Proposed `## [Unreleased]` line

`fgos doctor` judges the install, hook-wiring, agent-config and release rows itself in the host instead of through Node (the same rows, order and text; a message that carried a Node error text now carries the OS's), and `fgos doctor --fix` refreshes the global `fgos` path cache in Rust.

## Accepted changes

- Messages that embedded a JavaScript or Node OS error text (drift row failures, unreadable activation record, `EACCES`) are worded plainly with the same prefix and guidance suffix.
- The pin row reads the pin through the typed reader: a pin file missing `schemaVersion` or `policy` is "unreadable" (Node needed only `artifactDigest`).
- A hook file whose JSON root is not an object, and an install through a link that leaves the project, behave as phase 01 recorded.
- `cli-version-visible` reads the host's embedded package version and the commit of the product root, as `fgos version` does.
- The `fgos internal source-payload` host route (payload only).

## Concerns and handoffs

1. **Step lead, after 04 and 10 land:** re-run `rg` for the deleted module names and `listLegacyNodeSourceFiles(root, inspect)` callers (the signature changed to `(root, hostBin)`).
2. **Dead Rust twin:** `agent_config.rs` still carries `find_agy_sub_homes`/`check_agy_sub_homes_configured` (phase 01) that no product code calls: `agy-sub-homes-configured` stays bridged (S5) and `agent-cli-trust.mjs` (S6a) reads the Node reader. Delete them or leave until S5 decides.
3. **Twin until S6a:** Node `checkBwrapAvailable(binary)` stays for the confinement rows next to the Rust `bwrap-available` row.
4. **Small duplication left for the step lead:** `judged` (new, in `doctor/mod.rs`) and the local one in `mailbox.rs`; `process_env()` in `packaging.rs` and `wire_agents.rs`.
5. **Files outside the Modify list I touched:** `test/rust-host/closing-block.test.mjs`, `test/setup/{checks,doctor-bridge,bwrap-check,registrations,bin-discovery,agy-permissions}.test.mjs`, `test/distribution/native-addon.test.mjs` (the fixture copies the real host, since the builder runs it), `src/util/release-targets.mjs` (one comment), `src/setup/{bin-discovery,agy-permissions}.mjs`, `.github/workflows/release-assets-check.yml`, docs lines that named deleted tests (`reading-map.md`, packaging spec, checklist, alignment, proof).
6. **No new `pub` item in `fgos-git`, `fgos-process` or any other OPC-reviewed crate.** New `pub` in `fgos-distribution`: `bin_cache`, `release_rows`, `source_payload` modules, `agent_hooks::install_message`, `git_commit_at`.
7. `release_rows.rs` is long (about 1,750 lines, mostly the ported fault cases of the drift row).
8. MAIL experiment files (`mailbox-behaviour-v7{e,h,i}`, `mailbox-live-confined.mjs`) untouched, as answered.
9. No `bridge:S4` label exists; the registry's `inRust` lists now hold every `rust:packaging` row and fix.

Status: DONE_WITH_CONCERNS
