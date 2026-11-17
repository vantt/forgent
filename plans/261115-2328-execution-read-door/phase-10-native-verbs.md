# Phase 10: `dispatch decide`, `dispatch explain`, `hook dispatch-decide` and `agents` run natively

Start after: 09 and 08 landed. Wave 5, parallel with 11. Rules: [phase-lead-rules.md](phase-lead-rules.md).
Facts: F2. Worktree `erd-p10`, report slug `erd-p10-native-verbs`. Effort: 4d. Port recipe: S4 `plan.md` "Port recipe"
(re-read item 4).

## Context

The decisions are in Rust (06-08) and the host serves them (09). This phase flips the four verb surfaces to native and
deletes their Node arms and use cases (L10). `dispatch` stays a `legacy-cli` route for its other sub-commands
(`inspect`, `reconcile`, `probe-account`, `probe-session`, `recover`; S6a), so `decide` and `explain` become
`native_subcommands`; `hook` gains `dispatch-decide` beside `mailbox`/`mailbox-sync`; `agents` becomes native.

## Requirements

1. Host wiring per the S4 recipe: operation descriptors in `packages/host-runtime/rust/src/catalog.rs` (`CATALOG` and
   its count assertion), providers in `apps/fgos/src/main.rs`, projector arms in `apps/fgos/src/cli_projector.rs`,
   `NATIVE_SUBCOMMANDS` for `dispatch` in `routing.rs`, `HookKind::DispatchDecide` in `routing.rs:115-121` (flip the
   assertion at `routing.rs:591`), annotations in `packages/host-runtime/contracts/command-route-annotations.json`,
   `native: true` in `src/cli/command-registry.mjs`, regenerate `command-routes.json` and `command-manifest.json`.
   Refusals keep Node's category and exact text; unknown flags get Node's exact text from the annotation.
2. Adapters (`apps/fgos/src/wiring/{dispatch_decide.rs,agents.rs}` and the hook arm) call `fgos-execution` in process
   with 09's `Machine`/`ToolProbe` implementations; `decide`, `explain` and the hook run 07's `runner_check` first:
   - `decide`: `--cwd`/`--repo-root` guard (`decide.mjs:251-265`); the project root through the invocation-root door and
     the config root by 07's `configRootFor` rule (a worktree's own config wins); config through `fgos-config`; `--assignment <id>` must be one plain path segment (else refused by name), then
     `.fgos/assignments/<id>/assignment.json` is read with `open_beneath` under a byte cap; absent or unreadable = no
     record, as today; `--work` asks the S4 Node
     bridge for the Work hint (D6): one new bridge operation `work-dispatch-hint` (`src/setup/doctor-bridge.mjs`, its
     contract `packages/distribution/contracts/doctor-bridge.v1.json`, request `{workId, stage, dir}`, answer the
     `workDispatchHint` fields, `src/runner/work-dispatch.mjs:279-306`), shaped like S4's `work-store-init` (re-read
     item 2) and called through the bridge function in `apps/fgos/src/wiring/doctor/bridge.rs` (S4's "Node rows
     bridge" door row lets only that file start Node; this adapter spawns nothing itself and names no bridge module path, which that row's `doctor-bridge` pattern would
     catch); deleted with the bridge at S7. Node missing: `--work` fails with the bridge's named cause, other
     selectors are unaffected.
   - `explain`: config through `fgos-config` without defaults (as the arm today, `bin/fgos.mjs:2447-2452`), session
     headless with herdr presence from the 09 adapter.
   - `hook dispatch-decide`: its own lane outcome, not the mailbox lane's (that one is unix-only, exits 0 on every path
     and resolves the root differently, F10): reads stdin and env, calls 07's `hook.rs` normalizer and verdict, prints
     the protocol answer (`--format standard|agy`) and exits per the contract (block = 2 in standard; a panic is caught
     and allows, as a non-config failure does today); builds and runs on Windows and macOS too. Every CLI whose hook
     render registers `dispatch-decide` is covered (`src/setup/agent-hooks.mjs:210,225,233` today; S4 moved the table to
     `packages/distribution/contracts/agent-hooks.v1.json`, re-read).
   - Files a project or a pull can write (the assignment record, persona files) are read with `fgos-durable-file`
     `open_beneath` under a byte cap, as 09 does; an unreadable file is "no record" / a listing problem, as today.
   - `agents list`: project root (`--worktree` or the worktree root through Git Inspect), tiers from the payload root
     (`components.legacyNode.root` of the activated release, resolved by `apps/fgos/src/legacy_exec.rs:69
     resolve_payload_path`, never PATH or cwd: `core/agents`, `domains/*/agents`) and the project
     (`fgos/agents`); 08's `list`.
3. Parity: on 09's restored runner, tables
   `test/rust-host/parity-cases/{dispatch-decide,dispatch-explain,hook-dispatch-decide,agents}.cases.mjs` (every refusal
   of each arm), run green against the base release before deleting Node code. Transitional: phase 12 deletes them.
4. Delete (same phase): the `decide`, `explain` and `agents` arms of `bin/fgos.mjs` and imports no other arm uses
   (`ARM_STATIC_IMPORTS` lines in `test/architecture.test.mjs`), `EXIT_OF` entries, `src/runner/dispatch/hook.mjs`, the
   `dispatch-decide` kind in `src/runner/hook.mjs:17,66`, `src/runner/execution/explain.mjs`, the decide use case in
   `src/runner/dispatch/decide.mjs` (`retiredDispatchDoorMessage`, still used by the legacy `dispatch` arm for retired
   sub-commands, moves next to that arm's other helpers in `src/runner/dispatch/cli.mjs`; `runDoorHint` goes with the
   hook), the `decide` path of the compatibility alias (`src/runner/dispatch/cli.mjs:21,166`, `src/runner/dispatch.mjs`)
   and every live mention of it (D13): `AGENTS.md` "Dispatch",
   `domains/coding/skills/fgos-coding-implement/{SKILL.md:58,64,124,references/implement-and-collaboration.md}`,
   `core/skills/_shared/{capability-catalog,planning-capability-awareness}.md`, `docs/reference/dispatch-module-boundaries.md:30`,
   `docs/platform/runner/spec.md:59`, tests `test/cli/dispatch-operability.test.mjs:42,116`,
   `test/cli/dispatch-retired-doors.test.mjs:134` (then `npm run build:skills`); the five doctor-row descriptions that
   name the alias (`registrations.mjs:1133-1189`, now in `doctor-registry.v1.json`) are rewritten by 11, which owns that
   file; `scripts/dispatch-decide-hook.mjs` (an old registration's entry that
   calls `serveHook('dispatch-decide')`, which no longer exists after this phase): delete it, after checking on the post-S4
   tree that the packaging row `dispatch-decide-hook-wired` reports a settings file naming that script as not wired and
   its fix rewrites it to the shim; if it does not, report to the plan lead before deleting (an old registration would
   start failing). `src/runner/agent-listing.mjs` stays (doctor row
   `agent-type-names-unique`, S6a).
5. One `apps/fgos/tests/cli_tests.rs` case per verb (wiring proof), including `hook dispatch-decide` blocking an
   out-of-process `Task` call and allowing an in-process one, and a `PATH` without `node` showing `decide --for`,
   `explain`, `hook dispatch-decide`, `agents list` succeed (no Node child) while `decide --work` names the bridge cause.
- From phase 05: when regenerating `command-manifest.json`, also fix the stale text in `src/cli/command-registry.mjs`: the plan-lint description (~:1397, "unregistered capability shape"; now a tool ability whose tool is not present) and the `explain --for architecture:synthesize` example (~:1598; `architecture:synthesize` is a label now).

## Files

- Create: `apps/fgos/src/wiring/{dispatch_decide.rs,agents.rs}`, four transitional parity tables.
- Modify (also): the doctrine, docs and tests of Req 4's alias list; `scripts/check-decision-codes.baseline.json` when a
  retired test's title is pinned there (`:162` pins a `decideExecutorCli` title).
- Modify: `apps/fgos/src/{main.rs,routing.rs,cli_projector.rs}`, `apps/fgos/src/wiring/mod.rs`,
  `apps/fgos/tests/cli_tests.rs`, `packages/host-runtime/rust/src/catalog.rs`,
  `packages/host-runtime/contracts/{command-route-annotations.json,command-routes.json,command-manifest.json}`,
  `src/cli/command-registry.mjs`, `src/cli/verb-exit.mjs`, `bin/fgos.mjs`, `src/runner/hook.mjs`,
  `src/runner/dispatch/{cli.mjs,decide.mjs}`, `src/runner/dispatch.mjs`, `src/setup/doctor-bridge.mjs`,
  `packages/distribution/contracts/doctor-bridge.v1.json`, `AGENTS.md` (Dispatch sentence), `test/architecture.test.mjs`
  (`ARM_STATIC_IMPORTS` only), `docs/architecture-manifest.json` (entries of deleted files), `test/suite-baseline.json`,
  mutation census.
- Delete: `scripts/dispatch-decide-hook.mjs` (see Req 4), `src/runner/dispatch/hook.mjs`, `src/runner/execution/explain.mjs`, `src/runner/dispatch/decide.mjs` if
  empty after the moves, `test/scripts/dispatch-decide-hook.test.mjs`, `test/runner/execution/explain.test.mjs`.
- Tests retired (owner now): decide cases of `test/runner/dispatch.test.mjs` and `test/runner/assignment-dispatch.test.mjs`
  that drive `decideExecutorCli` -> `golden_decide.rs` (cases) and `cli_tests.rs` (one wiring); `dispatch-decide-hook.test.mjs`
  -> `golden_decide.rs` hook vectors and the `cli_tests.rs` hook case; `explain.test.mjs` -> `golden_bind.rs`;
  hook cases in `test/setup/{claude-code-hooks,agent-hooks}.test.mjs` that only reach the verdict -> same. Each named.
- Net size: about -900 Node lines, -700 Node test lines, +600 Rust host lines, parity tables (transitional).

## Acceptance

- `command-routes.json`: `dispatch` `native_subcommands` has `decide`, `explain`; `hook` has `dispatch-decide`;
  `agents` is `native`. Parity tables green against the base release (counts per verb in the report).
- With a failing `node` on `PATH`, the four surfaces answer (only `decide --work` names the bridge cause).
- `rg -n "decideExecutorCli|decideDispatchHook|explainCapability" src bin` finds nothing.

## Risks / rollback

- The PreToolUse hook is on the critical path of every agent `Task` call (H x H): the hook verdict vectors cover every
  branch; a parity case per protocol and format; a host failure path keeps today's rule (any non-config failure
  allows). Revert: the commit series (route kinds revert with the regenerated contracts).
- S1 edits the same `HookKind` and hook registry entry (collision table): whoever lands second rebases.
- The landed S4 bridge may have no operation dispatch beyond doctor phases (its `work-store-init` is S4 phase 10, open
  at planning) (M x M): re-read item 2 before starting; if the shape does not fit, adding the operation is part of this
  phase (+0.5d) and the bridge contract change goes to OPC with the phase.

- Decision for the host adapter of `agents list` (08 hands it the files): Node sorts directory entries with `localeCompare`, the replay of `golden_agents.rs` sorts bytewise; decide the one order here and add a vector with a mixed-punctuation name that proves it.
