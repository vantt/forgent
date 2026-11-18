# Phase 10 (host side): decide, explain, hook dispatch-decide and agents list run natively

Status: DONE_WITH_CONCERNS. Summary: the host serves the four surfaces in process over `fgos-execution` (no Node arm, use case, test or doc mention deleted; seat C does Req 4), the Work hint of `decide --work` goes through one new bridge operation `work-dispatch-hint`, parity tables and one `cli_tests.rs` case per verb are in.
Wiring: `catalog.rs` (+3, count 38), `main.rs` providers and `HookKind::DispatchDecide`, `cli_projector.rs` arms, `routing.rs` (`NATIVE_SUBCOMMANDS`, hook kind, assertion flipped), `command-registry.mjs` (`native`, stale plan-lint and `architecture:synthesize` texts fixed), annotations, `command-routes.json` and `command-manifest.json` regenerated; adapters `wiring/{dispatch_decide,agents}.rs` share `HostMachine`/`HostProbe`/`read_beneath` of `seat_binding.rs` (now `pub(crate)`), not copies.
Decisions: (1) agents order is BYTEWISE (locale independent, equals `.sort()`); vector "definitions are listed in bytewise order..." added to `agents.v1.json` (hand-recorded: the Node recorder needs the git addon, absent here); (2) the route table gives a `legacy-cli` verb no operation id, so `dispatch` names its operation in `routing.rs` `PARTIAL_VERB_OPERATIONS` (the exporter, outside my scope, could emit `operation_id` for a `native` list and delete the table); (3) `agents` keeps Node's `requireSubVerb` wording for a missing/unknown sub-verb; (4) `--assignment` must be one plain path segment (host refusal, no parity case), a definition file that is a link lists as "cannot be read"; (5) bridge line `hint` (`{hint: object|null}`) + request fields `workId`/`stage`, contract vectors and `node --test test/setup/doctor-bridge.test.mjs` (9 pass).
Gates (target `.fgos/runtime/cargo-target`: the brief's `s5-p10-target` parent is read-only here): `cargo fmt --all --check` clean, clippy `-D warnings` on fgos/fgos-execution/fgos-host-runtime clean, `cargo test -p fgos-execution -p fgos-host-runtime` green, my 8 `cli_tests.rs` cases + unit tests green, `cargo check --all-targets` windows-msvc and apple-darwin green; `cargo test -p fgos --bin fgos` has 58 failures, all "Read-only file system" from the Git state root in other modules (events, session, uninstall, doctor), none in mine.
Parity: `test/rust-host/parity-cases/{dispatch-decide (42),dispatch-explain (22),hook-dispatch-decide (35),agents (25)}.cases.mjs` + helper `execution-world.mjs`; run only host-vs-host here (the base release cannot be staged in this sandbox: no git addon), so the base comparison is the lead's: `FGOS_TEST_PARITY_BASE=<desc> node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs`. Expected, decided differences: none claimed; any diff in retired-key sentences (below) is a finding.
Lead must also run, outside my scope and now failing or needing an edit: `test/rust-host/command-routes.test.mjs` (only `hook` carries native_subcommands; list gains `dispatch-decide`, and `dispatch` carries `decide`,`explain`), `test/cli/subcommand-flag-drift.test.mjs` (agents is native: add its Rust source), `test/cli/fgos-manifest.test.mjs` (arm set; seat C), `test/runner/agent-listing.test.mjs` + `src/runner/agent-definitions.mjs` `sortedNames` (and `listDomainDirs`) to `.sort()` so the Node twin reads the new vector, `docs/architecture-manifest.json` door "agent definition tier directories" `allowed` += `apps/fgos/src/wiring/agents.rs` (phase 12 owns door rows), `test/architecture.test.mjs`, `help-routes.test.mjs` (needs the built host).
Concerns: the Node `checkDoorRefusalsForRetiredKeys` sentence (retired pattern keys, `config-key-retired`) is not ported to a config door refusal (host prints the door text); hook prints no advisory validation warnings (decide/explain print them to stderr as Node did); `agents list` needs the payload resolvable (precondition refusal otherwise).
Retired test -> owner now: none yet (seat C). Proposed `## [Unreleased]` line: "`fgos dispatch decide`, `fgos dispatch explain`, `fgos agents list` and the `dispatch-decide` PreToolUse hook run in the host without Node (`decide --work` still reads the Work store through Node)."
Files outside scope I needed: `scripts/export-command-selectors.mjs` (optional, see decision 2), the lead-owned tests and door row above.

## Lead pass: parity against the base release

Base: the Node arms of the commit this branch was cut from (`7655f4f3e`), staged in a linked worktree with its own cargo
target (recipe in `test/rust-host/harness.mjs`; the staged host copy inside the release, not the target binary, is the
description file's `hostBin`). Run: `FGOS_TEST_PARITY_BASE=<file> node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs`.

| table | cases | first run (seat A tree) | after the lead's fixes |
|---|---|---|---|
| agents | 25 | 4 green | 25 green |
| dispatch-decide | 46 (42 + 4 retired-key cases) | 40 green | 46 green |
| dispatch-explain | 22 | 22 green | 22 green |
| hook-dispatch-decide | 37 (35 + 2 retired-key cases) | 35 green | 37 green |

Rust fixes the parity run demanded:
- `agents list` JSON key order is the Node order (`shadows` right after `source`): field order of `Agent` in `fgos-execution`.
- A missing or unknown `agents` sub-verb is the verb's own refusal in Node and filed no fault record; the host's door filed one
  (`CallFault.record`, false for the verbs that keep the Node sub-verb wording).
- Retired `runner.patterns` keys (concern 1): a config-door refusal that lies on a retired key now says
  `<file>:<line>:<col>: <key> was retired; <instruction>.` with code `config-key-retired`, places taken from the config
  check's findings first and the refusals second, as Node did. Matcher: `retired_pattern_key_at` in `runner_check.rs`;
  owning proof `dispatch_decide_names_a_retired_pattern_key_with_its_place_and_what_replaced_it` in `cli_tests.rs`; the
  parity tables carry four decide and two hook cases. On non-Unix targets the config check does not exist, so the
  refusals alone name the places.
- Hook advisory warnings (concern 2): the only advisory is the provider-family warning, which the config door can no
  longer let through (a blank or missing `command` is refused by the schema), so no case can reach it; Node's hook prints
  on stderr only when it blocks, as the host does. Nothing to port.

One decided difference, normalised in the table runner: the no-selector usage of `dispatch decide` names `fgos dispatch
decide` on the host and `node src/runner/dispatch.mjs decide` in Node (`decide.v1.json` records both as `expect` and
`nativeExpect`).

Node tests that spawn `node bin/fgos.mjs dispatch decide` or `hook dispatch-decide` directly now fail because the arm is
native on the host (they are retired or moved by the step that deletes the arms): `test/cli/dispatch-operability.test.mjs`
(2), `test/cli/dispatch-retired-doors.test.mjs` (3), `test/runner/dispatch.test.mjs` (1: decide --work). The same step
owns `test/cli/fgos-manifest.test.mjs` "manifest verb-name set equals the set of verbs runVerb() dispatches" (fails only
while the `agents` arm is still in `bin/fgos.mjs`). `test/rust-host/help-routes.test.mjs` needs the release addon.

Lead-owned edits: `agent-definitions.mjs` bytewise `sortedNames` (the Node twin replays the new vector; `agent-listing`
green), `command-routes.test.mjs`, `subcommand-flag-drift.test.mjs` (agents is native, its Rust source added, dead
single-sub-verb table removed), architecture door row for `wiring/agents.rs`, census regenerated.

## Node deletions (retired test -> owner now)

Deleted: the `decide`, `explain` and `agents` arms of `bin/fgos.mjs`; `src/runner/dispatch/{decide,hook}.mjs`; `src/runner/execution/explain.mjs`; the `dispatch-decide` kind of `src/runner/hook.mjs`; the `decide` case of `runDispatchCli` (the alias `src/runner/dispatch.mjs` now answers `probe-account`, `probe-session` and `reconcile` only); `scripts/dispatch-decide-hook.mjs` (checked: the packaging row `dispatch-decide-hook-wired` reports a settings file naming it as missing a canonical hook, and `install_hook` rewrites it to the shim; golden vector `claude-legacy-scripts` in `agent-hooks-vectors.json`); the Node recorder `scripts/decide-vectors.mjs` and its evaluator `test/helpers/decide-vectors.helper.mjs` (the vectors are Rust-owned now). `runDoorHint` stayed (moved with `retiredDispatchDoorMessage` into `dispatch/cli.mjs`): the retired `dispatch execute` hint calls it. No `EXIT_OF` or `ARM_STATIC_IMPORTS` line named these arms.

| retired test | owner now |
|---|---|
| `test/runner/execution/explain.test.mjs` (file) | `golden_bind.rs` |
| `test/scripts/dispatch-decide-hook.test.mjs` (file) | `golden_decide.rs` hook vectors and the `cli_tests.rs` hook case |
| `test/runner/dispatch.test.mjs`: every `decideExecutorCli` case (executor id, --for, --needs-soul, tool purposes and mcp hand-back, --work, governance block, capability rows), the `dispatch.mjs decide` spawn cases (usage, --cwd, --repo-root guard), `fgos dispatch decide --work` spawn, the decide-contract replay and the vector-script test | `golden_decide.rs` (cases) and `cli_tests.rs` (wiring, incl. `--work` bridge) |
| `test/runner/assignment-dispatch.test.mjs`: `decideExecutorCli resolves dispatch plan for an assignment` | `golden_decide.rs` (assignment vectors) |
| `test/cli/dispatch-operability.test.mjs`: decide envelope, alias raw JSON, `--repo-root` without `--cwd` | `cli_tests.rs` and the `dispatch-decide` parity table (until it is deleted) |
| `test/cli/dispatch-retired-doors.test.mjs`: `decide --work` through the Work layer, alias `decide --work` refusal, refusal written once, agy hook deny case | `cli_tests.rs` (bridge, refusal streams, hook) and `golden_decide.rs` hook vectors |
| `test/runner/dispatch-governance-operability.test.mjs`: governance-blocked vs unregistered shape | `golden_decide.rs` governance vectors |

Kept and changed: the retired-door test now also pins that `decide` is an unknown alias sub-command and that the legacy payload refuses the native `dispatch-decide` hook kind by name; the symlinked-entry test of `dispatch.mjs` drives `reconcile`; `subcommand-flag-drift` reads the native `dispatch` flags from `project_dispatch_request`; `plan.mjs` usage names `fgos dispatch decide`. Not run here: `verb-parity` (needs `FGOS_TEST_PARITY_BASE`, a staged base release) and `fgctl-uninstall` (needs a release `fgctl`). Historical docs (history, discussions, decisions, explanation, knowledge narratives, verification logs) still say `node src/runner/dispatch.mjs decide`; they record what was true then and are left.

## Parity tables kept off main

The four parity tables and `execution-world.mjs` ran green against base `7655f4f3e` (counts above) and were removed
before landing: with tables present, `test/rust-host/verb-parity.test.mjs` needs a staged base release
(`FGOS_TEST_PARITY_BASE`) and would fail `npm test` on main. Restore them from commit `0d3ee1395` to re-run parity.
