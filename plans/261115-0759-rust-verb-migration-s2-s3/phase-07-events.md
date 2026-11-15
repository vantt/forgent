---
phase: 7
title: "`events sync|status|seal|export` native"
status: pending
effort: 2.5d
wave: B
step: S3
blockedBy: [0]
flipAfter: [1]
---

# Phase 07: `events` native

The Event Store already lives in Rust (`packages/event-store/rust`); `src/verbs/events/*` is a thin layer over the
addon. The verb moves to the host. The hard part is the children: today Node and the host both start detached
`fgos events seal|sync` children, and Node starts them as `node bin/fgos.mjs events ...` (`OWN_CLI`), which the Node
CLI will refuse once `events` is native (`bin/fgos.mjs:4066-4071`). This phase moves Node's spawn to the host binary
in the same change, so no seal or publish child is lost.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s3-p07`. Report slug `s3-p07-events`.

## Context

- Registry `src/cli/command-registry.mjs:1732-1750`: `sync [--remote] [--no-push] [--opportunistic]`,
  `status [--remote]`, `seal --stream <s> [--history <p>]`, `export --out <f> [--stream] [--since <json>]`;
  `store: 'open'`, `mutatesStore: ['sync']`, `eventStoreChild: ['seal', 'sync --opportunistic=true']`.
- Arm `bin/fgos.mjs:2632-2652`; `eventStoreContext` 143-158 (also used by `rebuild` 2654-2657, not ported).
  Use cases `src/verbs/events/{context,sync,status,seal,export,rebuild}.mjs` (29, 24, 6, 34, 11, 42 lines).
- Rust: `seal.rs` (`seal` 50, `seal_all` 554, `seal_if_due` 596), `sync.rs` (`sync` 252, `sync_status` 107),
  `diagnostics.rs` `status` 68, `export.rs` `export_jsonl` 103, `resolve.rs` `resolve` 79; addon `event_store.rs`.
- Children: Node `handSyncToChild` (`src/event-store/maintenance.mjs:10-13`) and `handSealsToChild` (48-56, a seal per
  coalesced stream with `--history`), through `spawnDetachedCli` (`src/util/spawn-detached-fgos.mjs:19`, runs
  `process.execPath OWN_CLI ...`); host `spawn_sync_child` (`apps/fgos/src/invocation_doors.rs:116-123`, its own
  executable, recursion guard removed). Other `spawnDetachedCli` user: `src/workflow/case-start.mjs:26, 148` (not an
  `events` child: unchanged).
- Doors already handle `event_store_child` (no triggers for a child); after 01 they record a failed child as
  `event-store-child` with its message (01 requirement 4), and a root read never creates the state root (01 requirement 5).
- Node's own classification of a child (`eventStoreChild`, `bin/fgos.mjs:4054, 4088, 4095, 4134`) serves only `events`
  (no other verb declares children): dead once `events` is native.
- Tests that spawn the Node CLI directly for a child: `test/event-store/background-seal.test.mjs:144-153`,
  `test/event-store/triggers.test.mjs:235` (and its message check at 238-239).
- Doctor pointer rows say "run `fgos events status`" (`src/setup/event-store-checks.mjs:79, 95-96`,
  `src/setup/registrations.mjs:3797`): text only, unchanged.

## Requirements

1. Host operations `event-store.sync` (write), `event-store.status`, `event-store.export` (read; export writes only
   `--out`), `event-store.seal` (write) in `catalog.rs`, provider in `apps/fgos/src/wiring/events.rs` calling the crate
   (store construction through `resolve.rs`, as `lifecycle` does), `detached` taken from `declared(event_store_child)`;
   projector from `cli_args` only (`--opportunistic` bare is the child shape, `--opportunistic=true` the declaration's
   spelling of it); `NATIVE_SUBCOMMANDS` `("events", ["sync", "status", "seal", "export"])`; annotation; `native: true`.
   Outputs as Node's (00 F9): opportunistic sync returns `{ error }` or `{ skipped: "state root gone" }` the way
   `src/verbs/events/context.mjs` does; `seal` busy is `{ busy: true }` exit 0; validation refusals exit 4.
   A child shape reads its repository facts in detached mode and never recreates a gone state root (Git spec §20;
   Node `eventStoreContext(dir, { detached })`, `bin/fgos.mjs:143-154`, `readRepoFacts(cwd, { detached })`): a gone
   state root answers `{ skipped: "state root gone" }`, as Node. A parity case removes the state root before the child runs.
2. Node children through the host: `spawnDetachedCli` takes the executable to run (default unchanged for its other
   caller); `maintenance.mjs` starts `events sync` and `events seal` children with the host binary
   (`resolveHostBin`, `src/util/host-bin.mjs:17`), same argv, same cwd, recursion guard removed from the child env as the
   host does (the child is a native verb, it never forwards to Node). No host found: the spawn is the trigger's error,
   recorded as today (`event-store-sync-child: ...`), never a silent loss. `OWN_CLI` stays for `case-start.mjs`.
3. `rebuild` keeps working: whatever of `context.mjs` it needs stays (00 F9); the four use-case files go.
4. Parity `events.cases.mjs` (fresh store per entry): `status` (with and without `--remote`), `sync --no-push`,
   `sync --opportunistic` (child shape; no trigger), `seal --stream work` (child shape), bad `--stream`, `--history`
   outside the cache, `export --out` with `--stream` and `--since`, `export` without `--out`, missing/unknown sub,
   flag-before-sub (`--remote status`).
5. `test/event-store/triggers.test.mjs` and `background-seal.test.mjs` prove the children: a Node-run store verb's end
   trigger starts a host `events sync` child and a seal child; a child that fails is recorded `event-store-child` with
   its message (the host's record now, `triggers.test.mjs:238-239` unchanged); their direct `node bin/fgos.mjs events ...`
   spawns become spawns of `FGOS_HOST_BIN`.
6. Delete: `src/verbs/events/{sync,status,seal,export}.mjs` and their `manifest.files` entries, the arm,
   `eventStoreContext`'s events-only part, Node's `eventStoreChild` detection and its `event-store-child` branch
   (`bin/fgos.mjs:4054-4134`; the debt entry 01 put on the "classify a failed Event Store child" row goes); the
   `syncUseCase` import of `test/setup/event-store-checks.test.mjs:47, 61` (those cases call the host verb or the
   addon); `test/event-store/verbs.test.mjs` cases now owned by the crate or the host (names in the report).
7. `doors` row "start a detached Event Store child": patterns `['"]events['"],\s*['"](?:sync|seal)['"]` and
   `"events"\.into\(\)`; allowed `src/event-store/maintenance.mjs` (reason: the Node lifecycle wrapper of Node verbs),
   `apps/fgos/src/invocation_doors.rs` (host lifecycle); `retiredBy: "S7: the Node lifecycle wrapper retires with the
   last Node verb"`. Row "run an events verb" folds into the step's retired-code row (`syncUseCase`, `statusUseCase`,
   `sealUseCase`, `exportUseCase`, allowed none).

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| status fields, sync / no-push, JSONL export, config merge (verbs.test.mjs, 11) | `test/event-store/verbs.test.mjs` | crate tests (`packages/event-store/rust/tests/`) for store behaviour; `wiring/events.rs` unit tests for the outcome shapes; `rebuild` cases stay in the Node file |
| child shapes run no trigger; child failure recorded | `triggers.test.mjs:171-239` | `invocation_doors.rs` unit tests (01) + `triggers.test.mjs` (Node-started children, one wiring case each) |
| seal child lifecycle | `background-seal.test.mjs` (7), `background-seal-confined.test.mjs` (1) | same files; direct child spawns now start the host |
| doctor rows | `test/setup/event-store-checks.test.mjs` (12) | unchanged except the two `syncUseCase` calls |

## Files

- Create: `apps/fgos/src/wiring/events.rs`, `events.cases.mjs` (deleted by 12).
- Modify: `apps/fgos/src/wiring/mod.rs`, host files per the recipe, `src/event-store/maintenance.mjs`,
  `src/util/spawn-detached-fgos.mjs`, `src/verbs/events/context.mjs` (only what `rebuild` keeps), `bin/fgos.mjs`,
  `apps/fgos/tests/cli_tests.rs` (one case: `events status` through the binary, no Node),
  `test/event-store/triggers.test.mjs`, `test/event-store/background-seal.test.mjs`, `test/event-store/verbs.test.mjs`,
  `test/setup/event-store-checks.test.mjs`,
  `test/distribution/source-payload.test.mjs` (only if it pins `OWN_CLI`'s use), `docs/architecture-manifest.json`, census.
- Delete: `src/verbs/events/{sync,status,seal,export}.mjs`.

Acceptance addition: a positive case where the state root is removed gives `skipped` and the root stays absent.

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos -p fgos-event-store --all-targets -- -D warnings`;
  `cargo test -p fgos -p fgos-event-store`; msvc and darwin `cargo check -p fgos` (the Event Store runs on Linux only:
  the operations answer the crate's unsupported-platform refusal elsewhere, as Node's addon does; 00 confirms the text)
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/event-store/verbs.test.mjs test/event-store/triggers.test.mjs test/event-store/background-seal.test.mjs test/event-store/background-seal-confined.test.mjs test/event-store/lifecycle.test.mjs test/event-store/work-gate.test.mjs test/setup/event-store-checks.test.mjs test/distribution/source-payload.test.mjs test/rust-host/command-routes.test.mjs test/cli/subcommand-flag-drift.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
- `cargo test -p fgos --test mailbox_sync_child` (the host child still starts)

## Risk and rollback

- Seal or publish children lost after the flip (H x H): requirement 2 in the same commit as the flip; triggers test.
- A host child inheriting the recursion guard from a Node payload dies silently (M x H): guard removed, as `spawn_sync_child` does; test asserts the child ran.
- Rollback: revert the phase; Node children return to `bin/fgos.mjs` with the Node arm.

## Settle at this port (from the review of the shared seam, 2026-11-15)

- Node keeps a verb's own fault class (`err.faultClass ?? 'event-store-child'`), prints "invocation fault recorded to <path>" and records the bare message. The host records `event-store-child` always, prints nothing, and its text carries the "provider failed: " prefix. Decide which behaviour stays and pin it in the parity cases.
- Node's `DispatchError` exit-1 special case is not ported in the seam yet; port it or record why it is not needed.
- Optional: the parity harness `parseReleaseEntry` could check that `hostBin` exists.
