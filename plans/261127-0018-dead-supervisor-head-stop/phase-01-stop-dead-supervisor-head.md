# Phase 1 — Stop a head with a dead supervisor

Capability: `code:implement`. Decision honored: D7 of
`plans/discussions/ds-rig5dsai5l-head-run-own-failure-domain/DISCUSSION.md`.

## Inputs

- `src/session-host/head-stop.mjs` (`stopHeadSession`, the `ports.end` / `ports.closed` wait around line 124-133)
- `test/session-host/head-stop.test.mjs`
- `packages/run-supervisor/rust/src/adopt.rs` (`adopt_one`; publishes `closed.json` for a dead supervisor's attempt)
  and how Node reaches it today (`executionOp('sweep-attempts')` in `src/runner/loop.mjs`, or the `fgos internal adopt` route)
- the supervisor-liveness judgment added by plan `261127-0016` phase 2
  (`apps/fgos/src/wiring/observe_sources/head_state.rs`) — reuse the same door from Node, never a second check
- `packages/supervision/rust/tests/definitions.rs` (existing `session-gone` cases)
- `changelog.d/README.md`

## Files it may write

`src/session-host/head-stop.mjs`, `test/session-host/head-stop.test.mjs`, `docs/platform/session-host/spec.md`,
`packages/supervision/rust/tests/definitions.rs`, `changelog.d/261127-0018-dead-supervisor-head-stop.md`,
`plans/261127-0018-dead-supervisor-head-stop/reports/**`.

## Steps

1. Before the request-and-wait, judge the supervisor of `record.runDir` (new port `ports.supervisorAlive`, default
   through the existing liveness door). If dead: skip the wait, retire the pane (`host.retireAsync`), settle the
   attempt through adopt, write `retiredAt`, return `{stopped: true}`.
2. Proof in `head-stop.test.mjs`: dead supervisor → stopped, adopt called, no `stop-not-ended`; alive → unchanged path.
3. `definitions.rs`: one wiring case, `supervisor-gone` → `session-gone` row.
4. `docs/platform/session-host/spec.md`: one line on stopping a head whose supervisor is gone.
5. Changelog fragment: `- Fixed: a head's run supervisor now runs in its own systemd scope, so one OOM kill no longer
   takes down other heads; a head whose supervisor died is raised as session-gone and \`fgos session stop\` ends it.`
6. Live check per acceptance 4 into `reports/live-stop.md`.

## Verify

`node --test test/session-host/head-stop.test.mjs`, `cargo test -p fgos-supervision --test definitions`, then
`npm test` and `cargo test --workspace`. Pass: all green and `reports/live-stop.md` records a passing stop.

## Rollback

Revert the phase commit.
