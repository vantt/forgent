# Phase 2: Drone definitions for the four session signals

## Inputs
`core/watcher/definitions/supervisor-stuck.query.json` (shape and params); `packages/supervision/rust/tests/definitions.rs`
and `tests/fixtures/definitions/`; `core/config-standard/watcher.yaml`, `core/config-schema/watcher.schema.yaml`;
records `fgos.head.state`, `fgos.session.activity`, `fgos.run.settled`, `fgos.run.reason` (grep their declarations);
decisions SP-D5, SP-D8 row 20 (thresholds and pace tunable within config bounds).

## Files it may write
Its footprint in the plan table only.

## Steps
1. Write a short fact list into `reports/signal-sources.md` (this plan's directory): for each signal (session gone; idle
   too long while holding unfinished work; no commit or result for N minutes; repeated refused commands over every
   Identity session of the project) the existing record and attribute that carries it. A signal with no source is marked
   a gap; its definition is not written and the lead is told in the status block.
2. For each signal with a source, add `core/watcher/definitions/<name>.query.json` in the existing shape, with one `params`
   entry per threshold pointing at a `configKey`.
3. Register each threshold under `watcher.` in `core/config-standard/watcher.yaml` with default, and min and max in
   `core/config-schema/watcher.schema.yaml`. A new definition kind stays a code change; arming and thresholds are what row
   20 lets the supervisor change.
4. Extend `RAISED` in `tests/definitions.rs` and add one `match` and one `no-match` fixture per definition.

## Verify
`cargo test -p fgos-supervision --test definitions` passes with every new definition listed; `npm test` config tests pass
(`node --test test/config`).

## Rollback
Delete the new definition files and keys in one revert; the watcher reads only listed definitions.
