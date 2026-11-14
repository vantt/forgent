---
phase: 8
title: "Host routing and doors"
status: pending
effort: 2.5d
wave: C
blockedBy: [2, 3, 4, 5, 6]
---

# Phase 08: Host routing and doors

The host reads the new route data (one native declaration, store declarations), decides the lane in
one pure module, and runs the cross-cutting doors around a native invocation through their Rust owners:
store admission (phase 04), the fault record (phase 05), the Event Store triggers (phase 06). The help
selectors leave the route table; the transitional `native_kinds` field goes.

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p08 /home/vantt/projects/forgent-worktrees/rvm-f0-p08 origin/rust-verb-migration-program/f0`. Assert it is in `git worktree list`.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p08-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`.
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock` (a new dependency edge means stop and ask).
- Report: `fgos convention path --kind report --type phase --slug f0-p08-routing-doors --plan 261114-2051-rust-verb-migration-program --json`. End with `Status / Summary / Concerns`.

## Context (after phases 02-06 landed on the integration branch)

- `apps/fgos/src/main.rs`: `CommandRouteDescriptor` (41-65, still has `native_kinds`), `native_kind` (73-80),
  `unknown_native_flag` (87-122), native hook dispatch (282-287), native lane (362-485: sub table, flag check,
  projection, root via `cli_projector::resolve_target_root`, invoke, present). Help is in `help.rs` (phase 02).
- `fgos internal ...` dispatch block (205-240).
- Route data from phase 03: `native_subcommands`, `store`, `mutates_store`, `lands_work`, `event_store_child`;
  shared vectors `test/rust-host/fixtures/store-declaration-vectors.json`.
- Rust owners: `fgos_git::store_admission`, `fgos_observe::invocation_fault` (`record`, `route_main`),
  `fgos_event_store::lifecycle::maintain`. Detached spawn: `fgos_process::mapped::spawn_detached`
  (`packages/process/rust/src/mapped.rs:194`). Dispatched signal: phase 00 U3. Config values: phase 00 U6.
- Node's order of doors (`bin/fgos.mjs:4223-4321`): root, help, unknown flag, native-only refusal,
  admission (+ warning), lifecycle wrapper (start trigger if dispatched, verb, end trigger, Land release),
  fault record on pre-handler faults with `faultClass`, stderr line `invocation fault recorded to <path>`.

## Requirements

1. `apps/fgos/src/routing.rs` (pure, no I/O): `decide(route, args) -> Lane` with lanes
   `HookProtocol(kind)` (pre-composition, today `mailbox` and `mailbox-sync`), `Native { operation_id }` and
   `Legacy`; the declaration matcher over the shape lists (reads the shared vectors in its tests); the
   unknown-flag message (moved from `main.rs`). A native sub-verb of a `legacy-cli` selector uses the
   selector's annotated `operation_id` through `cli_projector::native_operation_id`. A Rust test asserts
   every `native_subcommands` entry of the embedded table has a server (a hook handler or an operation).
2. `apps/fgos/src/invocation_doors.rs`: around a `Native` invocation:
   pre-handler refusals (missing/unknown sub, unknown flag, admission refusal) are recorded through
   `invocation_fault::record` with the fault classes Node uses (`unknown-flag`, `arg-parse`, `dir-invalid`,
   `store-missing`, `disconnected-worktree-store`, `worktree-identity-unreadable`), then reported as today
   plus the `invocation fault recorded to <path>` line when a record landed; admission runs when
   `store != none`; the start trigger runs when dispatched and the invocation opens the store and is not
   `event_store_child`; the end trigger runs after the outcome is presented and before exit, recording a
   trigger error as `event-store-start-trigger` / `event-store-end-trigger`; a due publish spawns
   `fgos events sync --opportunistic --dir <main>` detached from the host's own executable. A native
   invocation whose `lands_work` matches is impossible (phase 03 refuses it at generation); assert it.
3. `main.rs`: uses `routing.rs` and `invocation_doors.rs`; the descriptor gains the new fields and loses
   `native_kinds`; delete `native_kind`, `unknown_native_flag`; mount `fgos internal invocation-fault` →
   `fgos_observe::invocation_fault::route_main`.
4. Generator and registry: stop emitting `native_kinds`; `--help`/`-h` are no longer routes (delete
   `helpRoute`, `HELP_SELECTORS` and the count/`starts_with('-')` assumptions); regenerate the table.
   `packages/distribution/rust/src/lib.rs` (198-205, 412-418, 457) drops the help-selector filter and keeps
   its "no verb starts with `-`" assertion as a fact about the table.
5. Behaviour of today's native verbs is unchanged apart from a fault record for their malformed calls
   (they are all `store: none`, so admission and triggers do not run for them).
6. Run the full help table node-vs-host (`test/rust-host/verb-parity.test.mjs`, phase 07) green; record counts.

## Files

- Create: `apps/fgos/src/routing.rs`, `apps/fgos/src/invocation_doors.rs` (each with unit tests;
  doors tests use temp repositories: a require-store refusal is recorded, a read warning passes through,
  a dispatched opens-store invocation runs both triggers, a `store: none` invocation runs none).
- Modify: `apps/fgos/src/main.rs`, `apps/fgos/tests/cli_tests.rs` (one binary wiring case: an unknown flag on
  a native verb inside a project writes one fault record and prints the recorded line),
  `scripts/export-command-selectors.mjs`, `src/cli/command-registry.mjs` (`HELP_SELECTORS` out),
  `packages/host-runtime/contracts/command-routes.json` (regenerated), `packages/distribution/rust/src/lib.rs`,
  `test/rust-host/command-routes.test.mjs` (help selectors and `native_kinds` cases retired: behaviour removed),
  `test/rust-host/help-routes.test.mjs` ("`--help` and `-h` are legacy-node routes" at 91 retired: behaviour
  removed; owner of "help tokens are answered before the route lookup" is `routing.rs`/`help.rs` unit tests),
  `scripts/explain-command-route.mjs` only if phase 00 found it reads help selectors or `native_kinds`.
- Regenerate: census; `command-manifest.json` (bytes unchanged).
- Delete: none (functions removed inside `main.rs`, the generator and the registry).
- Tests retired: listed above, each with its reason.
- Net size: `main.rs` about -120, new modules about +450 (half tests), generator/registry about -30.

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos -p fgos-distribution --all-targets -- -D warnings`; `cargo test -p fgos -p fgos-distribution`
- `cargo check -p fgos -p fgos-distribution --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`
- `node scripts/export-command-selectors.mjs --check`
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/rust-host/command-routes.test.mjs test/rust-host/help-routes.test.mjs test/rust-host/harness.test.mjs test/rust-host/envelope-contract.test.mjs test/rust-host/internal-routes.test.mjs test/rust-host/dev-host.test.mjs test/rust-host/release-tree.test.mjs test/cli/first-run-guide.test.mjs test/cli/exit-code-table.test.mjs test/cli/unknown-flag-rejection.test.mjs test/scripts/dispatch-decide-hook.test.mjs test/observe/invocation-fault-log.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`
- One-door scan count not above baseline. `cargo test -p fgos --test mailbox_routes` (hook lane through the new field).

## Risk and rollback

- Lane decision regression for an existing native verb (M x H): Rust table-driven tests over the embedded
  table plus the existing envelope and route tests.
- End trigger delaying a native verb's exit (L x M): the trigger reads maintenance facts only (no ref walk);
  measure `fgos config show --json` before/after, record in the report.
- Host spawning itself for the sync child on Windows (M x M): reuse `spawn_detached`; msvc check.
- Rollback: revert the phase (02-06 stand on their own).
