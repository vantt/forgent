# Phase 2 — Head state judges the supervisor

Capability: `code:implement`. Decision honored: D6.

## Inputs

- `apps/fgos/src/wiring/observe_sources/head_state.rs` (`HeadFacts`, `HostHeadFacts::alive`, `state_name`, `records`)
- `apps/fgos/src/wiring/observe_sources/tests/mod.rs` (existing head-state cases)
- `core/watcher/definitions/session-gone.query.json`
- `packages/run-supervisor/contracts/supervisor-binding.v1.json` and `packages/run-supervisor/rust/src/adopt.rs`
  (how adopt reads the binding and judges the supervisor's identity; reuse that liveness judgment, never a second one)
- `docs/platform/observe/spec.md` (the `fgos.head.state` values)

## Files it may write

`apps/fgos/src/wiring/observe_sources/head_state.rs`, `apps/fgos/src/wiring/observe_sources/tests/mod.rs`,
`core/watcher/definitions/session-gone.query.json`, `docs/platform/observe/spec.md`.

## Steps

1. Add a `HeadFacts` method answering whether the supervisor recorded in `<run_dir>/supervisor-binding.json` is alive,
   implemented in `HostHeadFacts` through the same process-identity check adopt uses (pid + start identity, not pid
   alone). No binding, or a run dir with `closed.json`, keeps today's behaviour.
2. In `records`: when the pane answers `live` and the supervisor is judged dead, emit `fgos.head.state` =
   `supervisor-gone` with the placement's instant as the record instant (one incident per placement, as `gone`).
3. `session-gone.query.json`: add `supervisor-gone` to the `any` list (all roles, as `gone`).
4. Owning proof in `tests/mod.rs`: pane live + supervisor dead → `supervisor-gone` with the placement instant; pane live
   + supervisor alive → `live`; pane gone → `gone` (unchanged). Fake `HeadFacts` as the existing cases do.
5. `docs/platform/observe/spec.md`: list the new state value and what it means.

The wiring proof that the definition matches the new state goes into
`packages/supervision/rust/tests/definitions.rs` in the sibling plan `261127-0018-dead-supervisor-head-stop`
(that file is in Keeper's footprint).

## Verify

`cargo test -p fgos observe_sources` green. Pass: the three cases above hold.

## Rollback

Revert the phase commit; the state value disappears and the definition goes back to `gone`/`ended`.
