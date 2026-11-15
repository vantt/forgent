# Phase report: `wire-agents` native (S4)

Branch `rust-verb-migration-program/s4-p08`, rebased on the integration head `8043a263f`. Entry A for parity: the base
release at `rvm-s4-base` (main `118df7065`), used read-only; entry B the host staged from this tree.

## What changed

- `apps/fgos/src/wiring/wire_agents.rs` (new): operation `wire-agents.run`; plan from `agent_config::plan_agent_wiring`;
  apply = backup of each existing file to `<file>.pre-wire-agents-<time>` through Durable File (`install_once`, mode copied,
  never over an existing copy, Node's `EACCES: ..., copyfile 'a' -> 'b'` wording), then the change's `claude` steps through
  the process door; text render; `VerbAnswer` carries exit 1 when `failed[]` is not empty (no per-verb arm).
- `packages/distribution/rust/src/agent_config.rs`: one new `pub fn run_claude_step` (runs a step with the same program
  resolution and env as the plan, reports stderr or Node's `Command failed:` line) and its test.
- Host wiring: `wiring/mod.rs`, `main.rs` (provider table and registration), `cli_projector.rs` arm, `catalog.rs`
  (`wire-agents.run`, count 33), annotation `wire-agents`, registry `native: true`, `command-routes.json` regenerated.
  `wiring::doctor::truthy` made `pub(crate)` and reused (one reading of "falsy flag").
- Deleted (same change): `bin/fgos.mjs` arm and text-render branch, `EXIT_OF['wire-agents']`, in `src/setup/agent-wiring.mjs`
  the plan, apply, render, use case and every helper only they used (the file stays with `checkClaudePluginMarketplace`,
  `WIRE_AGENTS_COMMAND` and two constants for the doctor row and uninstall until phase 07), 5 Node tests.
- Doors: row "person's agent config writes" allows `wire_agents.rs`; the `agent-wiring.mjs` debt entry was stale after the
  trim (it no longer matches a pattern), so it is removed instead of kept; the 07 note is in the file header.
- Docs made false by the move fixed in place: packaging `spec.md` (RUL111 source line, files list), `setup-doctor-registry.md:183`.

## Behaviour notes (accepted)

- `--dir` is accepted and ignored (an empty value is still refused by the door, class `dir-invalid`); the project (mailbox opt-in
  read) is the main checkout of the caller's directory, resolved once by the invocation doors (`root_policy` gives `wire-agents`
  the main-checkout policy, `ignores_dir` keeps `--dir` from moving the root) and handed to the projector, as for doctor.
- Apply steps run under a 600 s bound (Node had none; a marketplace fetch can be slow). A step that times out is a `failed[]` item.
- A home that is unset (or blank) is refused as a `precondition` (exit 2, `HOME is not set; ...`); Node fell back to the passwd entry.
- Known difference: the process environment handed to `claude` leaves out a variable whose name or value is not UTF-8; Node
  passed such variables through lossily.

## Gates

- `cargo fmt --all`; clippy `-D warnings` on `fgos`, `fgos-distribution`, `fgos-host-runtime` (all targets): clean.
- msvc and darwin `cargo check -p fgos -p fgos-distribution`: pass (existing warnings only, none in touched files).
- `cargo test -p fgos` (204 unit + 64 cli_tests incl. the new no-Node case), `cargo test -p fgos-distribution -p fgos-host-runtime`: green.
- Parity `wire-agents` table (39 cases: plan text/json, claude/agy present/absent, mailbox opt-in, plugin installed, `--yes`
  text/json/twice, failing add, failing install, unwritable backup, subdir/linked worktree/outside repo, `--dir` forms, unknown
  flag, `--yes=1`, `--json=1`, `--dir=`): all equal host vs base on answers, `claude` argv log and HOME/project/state tree;
  zero `node` children. Run: `FGOS_TEST_PARITY_BASE=<desc> node scripts/run-tests.mjs --test-name-pattern=wire-agents test/rust-host/verb-parity.test.mjs`.
- `node scripts/run-tests.mjs` on: `test/architecture.test.mjs`, `test/setup/agent-wiring.test.mjs`, `test/cli/verb-exit.test.mjs`,
  `test/rust-host/{command-routes,help-routes,envelope-contract}.test.mjs`, `test/cli/{subcommand-flag-drift,unknown-flag-rejection,fgos-manifest}.test.mjs`,
  `test/setup/{plugin-marketplace-doctor-check,uninstall-project,agy-permissions,mailbox-claude-accept,registrations,doctor-bridge}.test.mjs`: 368 pass, 0 fail.
- `export-command-selectors.mjs --check` clean; one-door scan 0 undeclared; census regenerated.
- Could be affected beyond this set (series gate should cover): every test that reads `command-routes.json` or the registry,
  `test/e2e` CLI harness tests that drive `wire-agents` (none found by rg), docs-health.

## Retired test -> owner now

| Retired | Owner now |
|---|---|
| `agent-wiring.test.mjs` plan without --yes (text, json, nothing changed) | `wire_agents.rs`: `the_plan_holds_only_agents_present_and_writes_nothing_without_yes`; parity plan cases |
| `agent-wiring.test.mjs` --yes backs up before claude, mode kept, no permission written | `wire_agents.rs`: `yes_backs_up_each_existing_file_with_its_mode_before_claude_changes_anything_and_never_writes_a_permission` |
| `agent-wiring.test.mjs` plan holds only present agents; apply of an empty plan | `wire_agents.rs` plan test (absent agents, `Nothing to change`), `agent_config.rs` plan test |
| `agent-wiring.test.mjs` nothing to change once installed; existing marketplace never re-added | `agent_config.rs`: `the_plan_holds_only_present_agents_lists_the_steps_and_files_and_shows_permissions_it_never_writes`; parity `plan-plugin-already-installed` |
| `agent-wiring.test.mjs` failing claude step reported | `wire_agents.rs`: `a_failing_claude_step_stops_its_change_is_reported_and_ends_with_exit_1`; `agent_config.rs` `run_claude_step` test |
| `agent-wiring.test.mjs` use case without apply only plans | `wire_agents.rs` the-plan test (`applied: false`, no `backups` key) |
| `verb-exit.test.mjs` wire-agents exit 1 on failed | `wire_agents.rs` failing-step test through `VerbAnswer` (exit 1) and the apply test (exit 0); `cli_tests.rs` no-Node case |
| kept: HOME untouched by init and doctor --fix (setup half stays until phase 11) | `agent-wiring.test.mjs` (same case) |

## Proposed `## [Unreleased]` line

`fgos wire-agents` runs in the native host with no Node process; same plan, same backups, same output. A `claude` step now stops after 10 minutes, and a missing HOME is refused with exit 2 instead of falling back to the passwd entry.

## Flags for review

- New `pub` item in fgos-distribution: `agent_config::run_claude_step` (not an OPC-reviewed crate; no new `pub` in fgos-git or fgos-process).
- `agent_config.rs` (phase 01's file) and `wiring/doctor/mod.rs` (phase 03's) each got one small additive edit, named above.
- `invocation_doors.rs`: `wire-agents` joins `root_policy` (main checkout) and `acts_on_resolved_root`, plus `ignores_dir`; one test.
- Shared hot lines (catalog count 33, `main.rs`, projector, annotations, census) are additive; phases 09, 10, 11 will bump the catalog count again.

Status: DONE
