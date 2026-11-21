# Phase 8: Scheduling records read port and command port

Status: blocked on owner question `q-e2bpqz65c2` (depends on phase 5). Decision: OS-D20 ports 2 and 3 (portfolio read of
scheduling records through CLI `--json` and gateway REST; the command port uses existing verbs).

## Inputs

- `packages/supervision/rust/src/sources.rs`, `keeper.rs` (phases 4, 5).
- `apps/fgos/src/wiring/mod.rs`, `apps/fgos/src/routing.rs`, `apps/fgos/src/cli_projector.rs`.
- `packages/host-runtime/contracts/command-manifest.json`, `command-routes.json`, `command-route-annotations.json`.
- `apps/fgos-gateway/src/gateway.rs` (existing REST routes and the MCP `execute` surface).

## Footprint

`apps/fgos/src/wiring/scheduling.rs` (new), `apps/fgos/src/wiring/mod.rs`, `apps/fgos/src/routing.rs`,
`apps/fgos/src/cli_projector.rs`, `apps/fgos/tests/scheduling_records.rs` (new),
`packages/host-runtime/contracts/command-manifest.json`, `packages/host-runtime/contracts/command-routes.json`,
`packages/host-runtime/contracts/command-route-annotations.json`, `apps/fgos-gateway/src/gateway.rs`.

## Steps

1. `fgos supervisor records [--json] [--item <id>]`: all records from all sources with the keeper's latest decision
   per record (reason code, time); read-only. Register the route in the three host contracts.
2. Gateway `GET /v1/scheduling-records`: the same JSON, read through the host verb, not a second reader.
3. Command port: no new verbs. Document in the route annotations which existing verbs an outside UI may call
   (`questions answer`, `supervisor wake --trigger --ref`, `workflow start`), each through the existing gateway
   execute surface.

## Verify

`cargo test -p fgos --test scheduling_records`. Pass: the CLI JSON lists records from both sources with decisions;
the gateway route returns the same document; `fgos supervisor records --help` is served by the host.

## Rollback

Revert the phase commit; the verb and route are read-only additions.
