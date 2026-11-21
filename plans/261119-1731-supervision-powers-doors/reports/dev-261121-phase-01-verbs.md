# Phase 1 report: verbs and socket entries

Branch `doors/p01` in the linked worktree. NOT committed or pushed (release window; coordinator said hold).

## Done
- `supervisor raise`, `watcher tune`, `session read|type`, `metrics prune [--apply] [--settled]`, socket `metrics record` (only `fgos.coordination.*`), `stop-target-not-head`, secretary `run` ceilings, config keys `secretary.run.maxMinutes` (15, max 240) and `secretary.run.tier` (standard).
- Reused cores: `RaisedEvent::coordination`, `Core::read_recent|type_text`, `RecordDoor::prune`, config door `Verb::Set` (schema bounds). Coordination acts (raise, tune, type) recorded as `fgos.coordination.act`.
- Registry once (`command-registry.mjs`), manifest/routes regenerated; socket verbs in `head-request.v1.json` + client constants + `head-request.mjs`.
- One wiring test per verb in `apps/fgos/tests/supervision_verbs.rs` and `test/session-host/head-request.test.mjs`. CHANGELOG line added. `head-grants.mjs` untouched.

## Files outside the plan footprint (needed; add to footprint or accept at land)
- `apps/fgos/src/routing.rs`: native `session` sub-verbs, confined socket mapping.
- `apps/fgos/src/cli_projector.rs`: operation fan-out for `watcher tune` and `session read|type`.
- `packages/observe/rust/src/metrics_cli/mod.rs`, `prune.rs` (new): `metrics prune` lives in the observe crate.
- `packages/host-runtime/contracts/command-route-annotations.json`, `command-routes.json`: `session` annotation, regenerated routes.
- `packages/run-supervisor/rust/tests/head_request.rs`: pinned verb list.
- `test/cli/subcommand-flag-drift.test.mjs`, `test/rust-host/command-routes.test.mjs`, `test/rust-host/fixtures/store-declaration-vectors.json`: pinned lists and a `raise` vector row.
- `packages/git/contracts/mutation-census.v1.json`: regenerated digest (`git-one-door-scan --write-census`; 0 undeclared sites).

## Behavior notes
- Stop door: secretary and supervisor may stop any head; non-head persona -> `stop-target-not-head`. This widens the supervisor's current stop scope (was plan heads, asker, own role). Test `session stop ...` stopCase caller changed to a planner to keep the old rule proven.
- Confined `metrics record|prune` goes to the socket only when `FGOS_HEAD_REQUEST_SOCKET` is set, so confined workers keep the local route.
- `session type --text` text must not start with `-` (parser has no `--name=value`).
- `session read` answer capped at 48 KiB of screen text; a control-heavy screen can still hit `reply-too-large` (60 KB host bound).

## Verification
- `cargo test -p fgos --test supervision_verbs` 23 pass; `cargo test -p fgos --bin fgos` 536 pass; `cargo test -p fgos-observe --lib` 75 pass; `cargo test -p fgos-run-supervisor --test head_request` 43 pass.
- `node scripts/run-tests.mjs` on head-request, command-routes, help-routes, internal-routes, fgos-manifest, subcommand-flag-drift: 157 pass.
- `cargo fmt --all`, `cargo clippy -p fgos -p fgos-observe -- -D warnings` clean.
- config door tests (`test/config`) not re-run after final change (config files only add a new section).

## Open for the audit phase
- Secretary run passes `--override '{"tier":"..."}'` and `--timeout Nm`; not proven live that `--override` accepts a `tier` key (an override tier above the resolved one is refused). If rejected, drop tier enforcement or change the mechanism.
- `watcher tune` runs the config write in the route child; it assumes the child does not inherit `FGOS_CONFINED` (config writes refuse confined sessions). Prove live.
- Schema has minimum only for the session thresholds (no maximum), so "bounded by min and max" is min-only.
- Terminal reads/types proven only to the point of the terminal port refusal (no herdr in tests).
