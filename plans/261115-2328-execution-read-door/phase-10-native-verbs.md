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
2. Adapters (`apps/fgos/src/wiring/{dispatch_decide.rs,agents.rs}` and the hook arm):
   - `decide`: `--cwd`/`--repo-root` guard (`decide.mjs:251-265`) and root resolution through the invocation-root door;
     config through `fgos-config`; `--assignment` reads `.fgos/assignments/<id>/assignment.json` through the run-dirs
     door (`apps/fgos/src/wiring/run_dirs.rs`), absent or unreadable = no record, as today; `--work` asks the S4 Node
     bridge for the Work hint (D6): one new bridge operation `work-dispatch-hint` (`src/setup/doctor-bridge.mjs`, its
     contract `packages/distribution/contracts/doctor-bridge.v1.json`, request `{workId, stage, dir}`, answer the
     `workDispatchHint` fields, `src/runner/work-dispatch.mjs:279-306`), shaped like S4's `work-store-init` (re-read
     item 2) and called through the bridge function in `apps/fgos/src/wiring/doctor/bridge.rs` (S4's "Node rows
     bridge" door row lets only that file start Node; this adapter spawns nothing itself and names no bridge module path, which that row's `doctor-bridge` pattern would
     catch); deleted with the bridge at S7. Node missing: `--work` fails with the bridge's named cause, other
     selectors are unaffected.
   - `explain`: config through `fgos-config` without defaults (as the arm today, `bin/fgos.mjs:2447-2452`), session
     headless with herdr presence from the 09 adapter.
   - `hook dispatch-decide`: stdin payload normalization and the answer protocols (`--format standard|agy`, exit codes)
     exactly as `src/runner/hook.mjs`; reuse the host's existing hook payload reader (`apps/fgos/src/wiring/mailbox_hook.rs`
     and the mailbox crate's Claude/Codex payload parsing) instead of a second parser; verdict from 07's `hook.rs`.
   - Files a project or a pull can write (the assignment record, persona files) are read with `fgos-durable-file`
     `open_beneath` under a byte cap, as 09 does; an unreadable file is "no record" / a listing problem, as today.
   - `agents list`: project root (`--worktree` or the worktree root through Git Inspect), tiers from the payload root
     (`components.legacyNode.root` of the activated release, resolved by `apps/fgos/src/legacy_exec.rs:69
     resolve_payload_path`, never PATH or cwd: `core/agents`, `domains/*/agents`) and the project
     (`fgos/agents`); 08's `list`.
3. Parity: restore the parity runner from history as S4 did (re-read item 5), tables
   `test/rust-host/parity-cases/{dispatch-decide,dispatch-explain,hook-dispatch-decide,agents}.cases.mjs` (every refusal
   of each arm), run green against the base release before deleting Node code. Transitional: phase 12 deletes them.
4. Delete (same phase): the `decide`, `explain` and `agents` arms of `bin/fgos.mjs` and imports no other arm uses
   (`ARM_STATIC_IMPORTS` lines in `test/architecture.test.mjs`), `EXIT_OF` entries, `src/runner/dispatch/hook.mjs`, the
   `dispatch-decide` kind in `src/runner/hook.mjs:17,66`, `src/runner/execution/explain.mjs`, the decide use case in
   `src/runner/dispatch/decide.mjs` (`retiredDispatchDoorMessage`, still used by the legacy `dispatch` arm for retired
   sub-commands, moves next to that arm's other helpers in `src/runner/dispatch/cli.mjs`; `runDoorHint` goes with the
   hook), the `decide` path of the compatibility alias (`src/runner/dispatch/cli.mjs:21,166`, `src/runner/dispatch.mjs`)
   and its sentence in `AGENTS.md` "Dispatch" (D13); `scripts/dispatch-decide-hook.mjs` (an old registration's entry that
   calls `serveHook('dispatch-decide')`, which no longer exists after this phase): delete it, after checking on the post-S4
   tree that the packaging row `dispatch-decide-hook-wired` reports a settings file naming that script as not wired and
   its fix rewrites it to the shim; if it does not, report to the plan lead before deleting (an old registration would
   start failing). `src/runner/agent-listing.mjs` stays (doctor row
   `agent-type-names-unique`, S6a).
5. One `apps/fgos/tests/cli_tests.rs` case per verb (wiring proof), including `hook dispatch-decide` blocking an
   out-of-process `Task` call and allowing an in-process one, and a `PATH` without `node` showing `decide --for`,
   `explain`, `hook dispatch-decide`, `agents list` succeed (no Node child) while `decide --work` names the bridge cause.

## Files

- Create: `apps/fgos/src/wiring/{dispatch_decide.rs,agents.rs}`, the transitional parity runner and four tables.
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
