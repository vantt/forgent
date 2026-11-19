# Phase 16 — Host wiring of the new verbs

Binds the Supervision crate and the lane view to the `fgos` host: `watcher tick`, `supervisor wake|plans|queue|handled|done`,
`land`, `request result`, `session stop`, the `--for-question` flag of `session start`, and the lane form of `slots`.
It adds the one confined routing rule (PS-20), injects the new Observe kinds, adds the supervision doctor rows, and
regenerates the command contracts. Sole writer of the command registry, `bin/fgos.mjs`, the generated contracts and
`Cargo.lock` in its wave.


**Known cost (ops-metrics, 2026-11-18).** Queries over `fgos.plan.*` take 30-80 s until the Git lane adds a
`walk_changes` door call, longer than the 60 s active interval. The wired tick holds the `watcher` lock, so an
overrunning tick makes the next one `skipped-busy`, not concurrent; the live check in phase 19 records the real tick
duration.

## Inputs
Step 0: re-grep every line below after the session-verb, ops-metrics, read-door and owner-question-store plans land
(they write `main.rs`, `routing.rs`, `observe_declarations.rs`, the registry and the routes). Verb names follow the
session-verb plan (PS-16). A finding that changes a decision stops the phase with `NEEDS_CONTEXT`.
- Template for a native verb with sub-commands: `apps/fgos/src/wiring/events.rs` and `session.rs` (`AVAILABLE_SUBCOMMANDS`, `*_OPERATION_ID`, `*_DESCRIPTOR`, `*Provider::for_descriptor`); registration sites `apps/fgos/src/main.rs:112-129` (`COMPOSITION_PROVIDERS`) and `:300-347` (`register_provider` loops); route table `apps/fgos/src/routing.rs:79-93` (`NATIVE_SUBCOMMANDS`) and the route decision (`rg -n "fn route|native" apps/fgos/src/routing.rs apps/fgos/src/main.rs`).
- Confined door (PS-20): the Rust client `packages/run-supervisor/rust/src/head_client.rs` (`request_head`, `REPLY_TIMEOUT`), precedent `apps/fgos/src/wiring/questions.rs:831-837` (`through_socket`); the verb list in `packages/run-supervisor/contracts/head-request.v1.json` (phase 10); the marker `FGOS_CONFINED=1` (`CONFINED_MARKER` in `fgos-config`, `src/config/facade.mjs` `CONFINED_MARKER_ENV`). Today's Node per-verb confined branches: `bin/fgos.mjs` `case 'session'` (`session write`, `startHead`/`rotateHead`); they keep their door.
- Registry entries: `src/cli/command-registry.mjs` (`native: true`, e.g. `mailbox` :1188; `slots` :1319; `worktree` :124-130). Generation: `scripts/export-command-selectors.mjs` writes `command-routes.json` and `command-manifest.json`; proof `test/rust-host/command-routes.test.mjs`.
- Old `slots` body: `bin/fgos.mjs:2189` (`case 'slots'`); imports `:93` (`claimWork, ClaimError, readWorkerSlotCeiling` from claim-port) and `:108` (`countWorkerSlots, hasWorkerSlotRoom`). Lane view: `packages/run-supervisor/rust/src/lanes.rs` `snapshot` (phase 6).
- Observe wiring: `apps/fgos/src/wiring/metrics_sources.rs`; `observe_declarations.rs` (created by ops-metrics phase 1, extended by its phase 11 and by the owner-question store). The crate's kinds file `packages/supervision/rust/observe-kinds.json` is `include_str!`-ed and injected there.
- Doctor group template: `apps/fgos/src/wiring/doctor/mailbox.rs` (`GROUP`), listed at `doctor/mod.rs:212-222` (`GROUPS`); registry `packages/distribution/contracts/doctor-registry.v1.json` (`inRust`, `rows`).
- Crate APIs from phases 7, 8, 11, 12, 14: `land`, `queue`, `watcher`, `wake`/`supervisor`, `discussion_source`. Config keys from phase 4 are read here (composition root), never inside Observe or the crate.
- Phase 10's `stopHeadSession` (`src/session-host/head-stop.mjs`) and ticket reader.

**Covered by the footprint:** route annotations (`command-route-annotations.json`, one entry per new native verb, e.g. `events` :16, `session` :67), flag parsing in `apps/fgos/src/cli_projector.rs` (:285-301), and the gateway pass-through of `fgos slots --json` (`apps/fgos-gateway/src/gateway.rs:1134`, `apps/fgos-gateway/web/src/api/types.ts:143`, `fgos-gateway-api-v1.yaml:561`), which move to the `{lanes}` shape in this phase (L10).

## Footprint
`apps/fgos/Cargo.toml`, `Cargo.lock`, `apps/fgos/src/main.rs`, `apps/fgos/src/routing.rs`, `apps/fgos/src/wiring/mod.rs`, `apps/fgos/src/wiring/supervision.rs`, `apps/fgos/src/wiring/observe_declarations.rs`, `apps/fgos/src/wiring/metrics_sources.rs`, `apps/fgos/src/wiring/doctor/supervision.rs`, `apps/fgos/src/wiring/doctor/mod.rs`, `apps/fgos/tests/supervision_verbs.rs`, `packages/distribution/contracts/doctor-registry.v1.json`, `src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-manifest.json`, `packages/host-runtime/contracts/command-routes.json`, `packages/host-runtime/contracts/command-route-annotations.json`, `apps/fgos/src/cli_projector.rs`, `apps/fgos-gateway/src/gateway.rs`, `apps/fgos-gateway/web/src/api/types.ts`, `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml`, `bin/fgos.mjs`, `test/cli/**`.

## Steps
1. `apps/fgos/Cargo.toml`: depend on `fgos-supervision`; `cargo update -p fgos-supervision` is the only `Cargo.lock` change (no hand merge).
2. `wiring/supervision.rs`: one provider per verb family. It resolves the project root, reads config values (`watcher.*`, `supervisor.maxLeads`, `land.*`, `workerSlots.ceiling`) through the config door, builds the crate's ports (Event Store queue, Git Land/Remote/inspect, Identity resolve and project read, the head-start door for session start, the mailbox notifier, the definitions runner with each `watcher.definitions` entry and the pace file resolved like the attention view) and calls the crate. No logic of its own. `land` takes `--footprint` only from the request route (a lead's plan, phase 10) and `--test <path>...`; `slots` calls the lane view and answers `{lanes:{ceiling,live,free,seats}}`.
3. `routing.rs` `NATIVE_SUBCOMMANDS` and `main.rs` provider table and registration: add `watcher` (`tick`), `supervisor` (`wake`, `plans`, `queue`, `handled`, `done`); `land` and `slots` are plain native verbs.
3b. Footprint at commit time: `fgos land --paths` from a lead (the route passes `--footprint`) re-reads its plan's
   `footprint` from the bytes it is about to commit and refuses `footprint-change-refused` when they differ from the
   trunk tip's; the route's earlier check (phase 10) cannot see a sandbox edit made after the request (review of
   phase 10, 2026-11-19).
4. Confined routing rule (PS-20): in the host's route decision, before the native/Node split, a call whose environment has `FGOS_CONFINED=1` and whose verb (selector) is a contract verb added by phase 10 (`land`, `run`, `worktree create`, `request result`, `session stop`, `supervisor handled|done`) builds the contract args from its flags, sends them through `head_client::request_head`, and prints the reply as the verb's JSON (a refusal keeps the socket's code). This is the only new rule; `session start|rotate|write` and `questions` keep their existing doors (note in the report: `questions.rs` keys on the socket variable, not the marker; folding both onto this arm is a follow-up row, not this phase).
5. Node verbs (registry + `bin/fgos.mjs` arms): `request result [<id>] [--wait <s>]` (phase 10's reader; unconfined it reads the caller's own tickets by role env); `session stop <persona> --name <n> [--reason <t>]` (calls `stopHeadSession`; unconfined callers allowed); `session start` gains `--for-question <id>` (passed to `startHead`).
6. `command-registry.mjs`: add `watcher`, `supervisor`, `land` entries with `native: true`; mark `slots` native and replace its text with the lane form. Delete `case 'slots'` from `bin/fgos.mjs`, remove `readWorkerSlotCeiling` from the claim-port import at `:93` (keep `claimWork, ClaimError`) and delete the `:108` import. Then run `node scripts/export-command-selectors.mjs`; commit the regenerated manifest and routes.
7. Observe: add the crate's kinds file to `observe_declarations.rs`; register the discussion source in `metrics_sources.rs`.
8. Doctor: `doctor/supervision.rs`, group `supervision`, three read-only rows, no fix, add to `GROUPS`, `inRust.rows` and `rows`:
   - `supervisor-events-unhandled`: pointer, "N unhandled, run `fgos supervisor queue`"; warns, never fails;
   - `supervision-pace`: runs `core/watcher/pace/watcher-overdue` and `supervisor-idle-burn` read-only; warns with the rows (a stopped watcher cannot report itself, PS-22);
   - `land-gates-configured`: warns when `watcher.enabled` is true and `land.gates` is empty ("every `fgos land` refuses `land-gate-missing`; set `land.gates`").
9. `tests/supervision_verbs.rs`: one wiring proof per verb through the real host on a temp project (`watcher tick` raises one row and sends one notify through a fake mailbox host for a `notify` kind, `supervisor wake` with no live supervisor reports the start, `plans`, `queue`, `handled`, `done` refuses while an event is unhandled, `land` on a fixture remote, `slots --json` shape) and one proof per doctor row (warns on its fixture, passes otherwise). Case logic stays in the crate tests.
10. `test/cli/**`: the registry test and the existing `slots` test move to the lane shape (the old occupancy test is retired in phase 17 with its module); one test (`apps/fgos/tests/supervision_verbs.rs`) proves a confined call of `land` goes through the socket (fake socket server) and `session stop` reaches `stopHeadSession`.

## Verify
- `cargo test -p fgos --test supervision_verbs` and `cargo test -p fgos` pass.
- `node scripts/run-tests.mjs test/cli test/rust-host/command-routes.test.mjs` passes.
- `node scripts/export-command-selectors.mjs --check` reports no drift.
- `npm run fgos:dev -- slots --json` prints `lanes`; `npm run fgos:dev -- doctor --json` has `watcher-timer`, `supervisor-events-unhandled`, `supervision-pace`, `land-gates-configured`.
- `cargo clippy -p fgos -- -D warnings` clean.

## Rollback
Set `watcher.enabled` false first (the timer of phase 15 would run a verb that is gone), then revert the merge commit and
rerun the export script. The crate stays inert.
