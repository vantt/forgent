# Phase 16 — Host wiring of the new verbs

Binds the Supervision crate and the lane view to the `fgos` host: `watcher tick`, `supervisor wake|plans|queue|handled|done`, `land`, and the lane form of `slots`. It also injects the new Observe kinds, adds the `supervisor-events-unhandled` doctor row, and regenerates the command contracts. Sole writer of the command registry, the generated contracts and `Cargo.lock` in its wave.

## Inputs
Step 0: re-grep every line below after the session-verb, ops-metrics and read-door plans land. Verb names follow the session-verb plan (PS-16). A finding that changes a decision stops the phase with `NEEDS_CONTEXT`.
- Template for a native verb with sub-commands: `apps/fgos/src/wiring/events.rs` and `session.rs` (`AVAILABLE_SUBCOMMANDS`, `*_OPERATION_ID`, `*_DESCRIPTOR`, `*Provider::for_descriptor`); registration sites `apps/fgos/src/main.rs:112-129` (`COMPOSITION_PROVIDERS`) and `:300-347` (`register_provider` loops); route table `apps/fgos/src/routing.rs:79` (`NATIVE_SUBCOMMANDS`).
- Registry entries: `src/cli/command-registry.mjs` (`native: true`, e.g. `mailbox` :1188; `slots` :1319). Generation: `scripts/export-command-selectors.mjs` writes `command-routes.json` and `command-manifest.json`; proof `test/rust-host/command-routes.test.mjs`.
- Old `slots` body: `bin/fgos.mjs:2189` (`case 'slots'`, imports at :93 and :108). Lane view: the public reader of phase 6 in `packages/run-supervisor/rust/src/lanes.rs`.
- Observe wiring: `apps/fgos/src/wiring/metrics_sources.rs`; `observe_declarations.rs` is created by ops-metrics phase 8 or 11 (must have landed). The crate's kinds file `packages/supervision/rust/observe-kinds.json` (phase 3) is `include_str!`-ed and injected there, never loaded from `packages/`.
- Doctor group template: `apps/fgos/src/wiring/doctor/mailbox.rs` (`GROUP`), listed at `doctor/mod.rs:212-222` (`GROUPS`); registry `packages/distribution/contracts/doctor-registry.v1.json` (`inRust`, `rows`).
- Crate APIs from phases 7, 8, 11, 12, 14: `land`, `queue`, `watcher`, `wake`/`supervisor`, `discussion_source`. Config keys from phase 4 are read here (composition root), never inside Observe or the crate.

**Covered by the footprint:** route annotations (`command-route-annotations.json`, one entry per new native verb, e.g. `events` :16, `session` :67), flag parsing in `apps/fgos/src/cli_projector.rs` (:285-301), and the gateway pass-through of `fgos slots --json` (`apps/fgos-gateway/src/gateway.rs:1134`, `apps/fgos-gateway/web/src/api/types.ts:143`, `fgos-gateway-api-v1.yaml:561`), which move to the `{lanes}` shape in this phase (L10). The `watcher` lock row comes from phase 6.

## Footprint
`apps/fgos/Cargo.toml`, `Cargo.lock`, `apps/fgos/src/main.rs`, `apps/fgos/src/routing.rs`, `apps/fgos/src/wiring/mod.rs`, `apps/fgos/src/wiring/supervision.rs`, `apps/fgos/src/wiring/observe_declarations.rs`, `apps/fgos/src/wiring/metrics_sources.rs`, `apps/fgos/src/wiring/doctor/supervision.rs`, `apps/fgos/src/wiring/doctor/mod.rs`, `apps/fgos/tests/supervision_verbs.rs`, `packages/distribution/contracts/doctor-registry.v1.json`, `src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-manifest.json`, `packages/host-runtime/contracts/command-routes.json`, `packages/host-runtime/contracts/command-route-annotations.json`, `apps/fgos/src/cli_projector.rs`, `apps/fgos-gateway/src/gateway.rs`, `apps/fgos-gateway/web/src/api/types.ts`, `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml`, `bin/fgos.mjs`, `test/cli/**`.

## Steps
1. `apps/fgos/Cargo.toml`: depend on `fgos-supervision`; `cargo update -p fgos-supervision` is the only `Cargo.lock` change (no hand merge).
2. `wiring/supervision.rs`: one provider per verb family. It resolves the project root, reads config values (`watcher.*`, `supervisor.maxLeads`, `land.*`, `workerSlots.ceiling`) through the config door, builds the crate's ports (Event Store queue, Git Land/Remote, session start through the head door) and calls the crate. No logic of its own. `slots` calls the lane view and answers `{lanes:{ceiling,live,free,seats}}`.
3. `routing.rs` `NATIVE_SUBCOMMANDS` and `main.rs` provider table and registration: add `watcher` (`tick`), `supervisor` (`wake`, `plans`, `queue`, `handled`, `done`); `land` and `slots` are plain native verbs.
4. `command-registry.mjs`: add `watcher`, `supervisor`, `land` entries with `native: true`; mark `slots` native and replace its text with the lane form. Delete `case 'slots'` and its two imports from `bin/fgos.mjs` (the other users of the old count are retired in phase 17). Then run `node scripts/export-command-selectors.mjs`; commit the regenerated manifest and routes.
5. Observe: add the crate's kinds file to `observe_declarations.rs`; register the discussion source in `metrics_sources.rs`.
6. Doctor: `doctor/supervision.rs` with row `supervisor-events-unhandled` (read-only pointer: "N unhandled, run `fgos supervisor queue`"; warns, never fails, no fix); add to `GROUPS`, to `inRust.rows` and `rows`. Phase 15 already added `watcher-timer`.
7. `tests/supervision_verbs.rs`: one wiring proof per verb through the real host on a temp project (`watcher tick` raises one row, `supervisor wake` with no live supervisor reports the start, `plans`, `queue`, `handled`, `done` refuses while an event is unhandled, `land` on a fixture remote, `slots --json` shape). Case logic stays in the crate tests; do not copy it.
8. `test/cli/command-registry.test.mjs` and the existing `slots` test: update to the lane shape (the old occupancy test is retired in phase 17 with its module).

## Verify
- `cargo test -p fgos --test supervision_verbs` and `cargo test -p fgos` pass.
- `node scripts/run-tests.mjs test/cli/command-registry.test.mjs test/rust-host/command-routes.test.mjs` passes.
- `node scripts/export-command-selectors.mjs --check` reports no drift.
- `npm run fgos:dev -- slots --json` prints `lanes`; `npm run fgos:dev -- doctor --json` has `watcher-timer` and `supervisor-events-unhandled`.
- `cargo clippy -p fgos -- -D warnings` clean.

## Rollback
Revert the merge commit and rerun the export script. The crate stays inert; the timer of phase 15 then runs a verb that is gone, so set `watcher.enabled` false first.
