---
phase: 8
title: "Host routing, doors and F0 guard rows"
status: pending
effort: 3d
wave: C
blockedBy: [2, 3, 4, 5, 6, 10]
---

# Phase 08: Host routing, doors and F0 guard rows

The host reads the new route data (one native declaration, store declarations), decides the lane in one
pure module, and runs the cross-cutting doors around a native invocation through their owners: argument
parse (phase 10), invocation root and store admission (phase 04), fault record (phase 05), Event Store
maintain and config (phase 06). The help selectors leave the route table; the transitional `native_kinds`
field goes; the host's own root walk and raw Event Store config read go. The `doors` rows for every F0
job are added here, so a second path for any of them fails `test/architecture.test.mjs`.

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p08 /home/vantt/projects/forgent-worktrees/rvm-f0-p08 origin/rust-verb-migration-program/f0`. Assert it is in `git worktree list`.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p08-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`. Also run every test that imports or reads a file you change (`rg -l "main.rs|cli_projector|command-routes.json|HELP_SELECTORS|native_kinds" test`).
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock` (a new dependency edge means stop and ask).
- Report: `fgos convention path --kind report --type phase --slug f0-p08-routing-doors --plan 261114-2051-rust-verb-migration-program --json`. End with `Status / Summary / Concerns`.

## Context (after phases 02-06 and 10 landed on the integration branch)

- `apps/fgos/src/main.rs`: `CommandRouteDescriptor` (41-65, still has `native_kinds`), `native_kind` (73-80),
  `unknown_native_flag` (87-122), native hook dispatch (282-287), native lane (362-485: sub table, flag check,
  projection, root via `cli_projector::resolve_target_root`, invoke, present). `fgos internal` block (205-240). Help: `help.rs`.
- **Node's order** in `bin/fgos.mjs` `main()`: `parseArgs` (4225), help (4229), unknown flag (4235), root
  `resolveInvocationRoot` with `dir-invalid` (4239), native-only refusal (4241), admission (4247), lifecycle wrapper
  (start trigger if dispatched, verb, end trigger, Land release), and on any pre-handler error the fault record with the
  `dir` known so far (`undefined` before 4239, so an unknown-flag record goes to `cwd`'s main checkout, not to `--dir`).
- Owners: `fgos_host_runtime::cli_args::parse_args`; `fgos_git::invocation_root`, `fgos_git::store_admission`;
  `fgos_observe::invocation_fault::record`; `fgos_event_store::lifecycle::{maintain, platform_supported}`; the
  `fgos-config` `eventStore` reader (phase 06 names the module).
- Dispatched signal: env `FGOS_DISPATCH_DEPTH` > 0 (`src/runner/dispatch/adapters.mjs:81, 95-99`; phase 00 U3 confirms).
- Detached spawn: `fgos_process::mapped::spawn_detached` (`packages/process/rust/src/mapped.rs:194`) is `#[cfg(unix)]`
  (`lib.rs:15-16`) and keeps the caller's env. `legacy_exec.rs:249` sets `FGOS_RUST_HOST_RECURSION_GUARD` for its Node
  child; a host started from that Node process inherits it, and a host child spawned with it dies at `main.rs:355`.
- The host's raw Event Store read: `apps/fgos/src/wiring/mailbox_config.rs:104-118`; mailbox sync child rule:
  `mailbox_hook.rs:186-224` (phase 06 recorded whether it shares the sync-due owner). `mailbox_hook.rs:3` comment cites `native_kinds`.

## Requirements

1. `apps/fgos/src/routing.rs` (pure): `decide(route, parsed) -> Lane` with `HookProtocol(kind)` (pre-composition:
   `mailbox`, `mailbox-sync`), `Native { operation_id }`, `Legacy`; the declaration matcher over the shape lists using
   `parse_args` output (its tests read `store-declaration-vectors.json`); the unknown-flag message (moved from `main.rs`).
   A native sub-verb of a `legacy-cli` selector uses the annotated `operation_id` through `cli_projector::native_operation_id`.
   A test asserts every `native_subcommands` entry of the embedded table has a server (hook handler or operation).
2. `apps/fgos/src/invocation_doors.rs`, around a `Native` invocation, in Node's order: unknown flag / missing or unknown
   sub (recorded `unknown-flag` / `arg-parse` against `cwd`'s store, before the root), root through `invocation_root`
   (`caller-tree`; a refusal is `dir-invalid`), admission when `store != none` (refusals recorded with their class), then
   the invocation. Records go through `invocation_fault::record`; the `invocation fault recorded to <path>` line is
   printed only when a record landed. Event Store triggers run only when `lifecycle::platform_supported()`: start trigger
   when dispatched, the invocation opens the store and is not `event_store_child`; end trigger after the outcome is
   presented; trigger errors recorded as `event-store-start-trigger` / `event-store-end-trigger`; a due publish spawns
   `fgos events sync --opportunistic --dir <main>` from the host's own executable with `spawn_detached`, with
   `FGOS_RUST_HOST_RECURSION_GUARD` removed from the child env. No spawn exists off Linux (the Event Store does not run
   there); the `cfg` split mirrors `apps/fgos/src/wiring/mod.rs`. A native invocation whose `lands_work` matches cannot
   exist (phase 03 refuses it at generation); assert it.
3. `main.rs`: uses `routing.rs` and `invocation_doors.rs`; the descriptor gains the new fields and loses `native_kinds`;
   delete `native_kind`, `unknown_native_flag`. `cli_projector.rs`: delete `resolve_target_root` and use
   `invocation_root` (its root-table test moved to `fgos-git` in phase 04). `mailbox_config.rs` reads `eventStore` through
   the `fgos-config` reader; `mailbox_hook.rs` uses the sync-due owner if phase 06 made it shared; fix its `native_kinds` comment.
4. Generator and registry: stop emitting `native_kinds`; `--help`/`-h` are no longer routes (delete `helpRoute`,
   `HELP_SELECTORS` and the count/`starts_with('-')` assumptions); regenerate. `packages/distribution/rust/src/lib.rs`
   (198-205, 412-418, 457) drops the help-selector filter and keeps "no verb starts with `-`" as a fact about the table.
5. Today's native verbs behave as before apart from a fault record for their malformed calls (all are `store: none`).
6. **`doors` rows** in `docs/architecture-manifest.json` (phase 01's mechanism). Each must pass now and would fail on a
   second path; narrow a pattern only to cover the same job more exactly, and say so in the report:

| Job | Patterns | Allowed files |
|---|---|---|
| render CLI help from the manifest | `command-manifest\.json` | `scripts/export-command-selectors.mjs`, `apps/fgos/src/help.rs` |
| retired native declarations | `\bnativeOnly\b`, `\bnative_kinds\b`, `\bNATIVE_HOOK_KINDS\b`, `\bHELP_SELECTORS\b` | none |
| decide the lane of an invocation | `\bnative_subcommands\b` | `scripts/export-command-selectors.mjs`, `apps/fgos/src/routing.rs`, `apps/fgos/src/main.rs` |
| resolve the invocation root | `\bnearestStoreRoot\b`, `\bresolve_target_root\b`, `fn resolve_invocation_root` | `packages/git/rust/src/invocation_root.rs` |
| admit store access | `disconnected-worktree-store`, `init-in-worktree`, `worktree-identity-unreadable`, `\bisSessionWorktree\b`, `fn is_session_worktree` | `packages/git/rust/src/store_admission.rs` (after phase 04 the literals at `src/runner/worktree.mjs:540-569` are gone; any Node file that must still branch on one of these classes by name is listed with its reason) |
| record a malformed call (twin) | `invocation-faults\.jsonl`, `\bargvShape\b`, `fn argv_shape` | `packages/observe/rust/src/invocation_fault.rs`, `src/observe/invocation-fault-log.mjs`, `src/state/fgos-file-registry.mjs`; `retiredBy: S7` |
| parse CLI arguments (twin) | `export function parseArgs`, `pub fn parse_args` | `src/cli/parse-args.mjs`, `packages/host-runtime/rust/src/cli_args.rs`; `retiredBy: S7` |
| Event Store maintain policy | `\bsyncDue\b`, `fn sync_due`, `sync_interval_sec`, `sync\.intervalSec` | `packages/event-store/rust/src/lifecycle.rs`, the `fgos-config` eventStore module, and `apps/fgos/src/wiring/mailbox_hook.rs` only if phase 06 recorded a different job (with that reason) |
| read the Event Store config section | `export function (readEventStoreConfig\|eventStoreConfig)` (a second definition, not a call), the Rust literal `"eventStore"` as a config key | `src/event-store/config.mjs` (adapter), the `fgos-config` eventStore module (narrow the Rust literal to the config-key use if another crate names the component in text) |

7. Run the full help table node-vs-host (`test/rust-host/verb-parity.test.mjs`) green; record counts in the report. Add a
   parity vector: `fgos add --bogus --dir <other project>` records its fault in `cwd`'s main checkout, not in `<other project>`.

## Files

- Create: `apps/fgos/src/routing.rs`, `apps/fgos/src/invocation_doors.rs` (unit tests with temp repositories: a
  require-store refusal is recorded; a read warning passes; a dispatched opens-store invocation runs both triggers on
  Linux and none elsewhere; a `store: none` invocation runs none; the sync child starts while the parent has the recursion
  guard set; the unknown-flag record lands in `cwd`'s store).
- Modify: `apps/fgos/src/main.rs`, `apps/fgos/src/cli_projector.rs`, `apps/fgos/src/wiring/mailbox_config.rs`,
  `apps/fgos/src/wiring/mailbox_hook.rs`, `apps/fgos/tests/cli_tests.rs` (one binary wiring case: an unknown flag on a native
  verb inside a project writes one record and prints the recorded line), `scripts/export-command-selectors.mjs`,
  `src/cli/command-registry.mjs` (`HELP_SELECTORS` out), `packages/host-runtime/contracts/command-routes.json` (regenerated),
  `packages/distribution/rust/src/lib.rs`, `docs/architecture-manifest.json` (`doors` rows),
  `test/rust-host/command-routes.test.mjs` (help-selector and `native_kinds` cases retired: behaviour removed),
  `test/rust-host/help-routes.test.mjs` ("`--help` and `-h` are legacy-node routes" at 91 retired: behaviour removed; "help
  tokens are answered before the route lookup" is owned by `routing.rs`/`help.rs` unit tests),
  `scripts/explain-command-route.mjs` only if phase 00 found it reads help selectors or `native_kinds`.
- Regenerate: census; `command-manifest.json` (bytes unchanged).
- Delete: none (functions removed inside the files above).
- Net size: `main.rs` about -120, `cli_projector.rs` about -40, new modules about +500 (half tests), generator/registry about -30, manifest rows +60.

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos -p fgos-distribution --all-targets -- -D warnings`; `cargo test -p fgos -p fgos-distribution`
- `cargo check -p fgos -p fgos-distribution --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`
- `node scripts/export-command-selectors.mjs --check`
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/rust-host/command-routes.test.mjs test/rust-host/help-routes.test.mjs test/rust-host/harness.test.mjs test/rust-host/envelope-contract.test.mjs test/rust-host/internal-routes.test.mjs test/rust-host/dev-host.test.mjs test/rust-host/release-tree.test.mjs test/rust-host/invocation-root-table.test.mjs test/cli/first-run-guide.test.mjs test/cli/exit-code-table.test.mjs test/cli/unknown-flag-rejection.test.mjs test/scripts/dispatch-decide-hook.test.mjs test/observe/invocation-fault-log.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`
- `cargo test -p fgos --test mailbox_routes --test mailbox_sync_child` (hook lane through the new field, mailbox config through the reader).
- One-door scan count not above baseline.

## Risk and rollback

- Lane decision regression for an existing native verb (M x H): table-driven Rust tests over the embedded table plus the envelope and route tests.
- End trigger delaying a native verb's exit (L x M): it reads maintenance facts only; measure `fgos config show --json` before/after.
- A `doors` pattern that also matches an unrelated use (M x L): narrow the pattern, never widen `allowed` without a reason.
- Rollback: revert the phase (02-06 and 10 stand on their own).
