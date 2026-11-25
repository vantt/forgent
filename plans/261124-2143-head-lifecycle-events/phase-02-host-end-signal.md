# Phase 2: Host-side end signal for a head

Closes `p-iatzcg2gee` in code and acceptance criterion 4 of the discussion (a head that dies after its last action
still produces an end event).

## Inputs

- `reports/diagnosis.md` (phase 1): the cause. If it names a cause this phase does not cover, change only the step
  it names and record why in the report.
- `apps/fgos/src/wiring/observe_sources/head_state.rs` and its tests in
  `apps/fgos/src/wiring/observe_sources/tests/mod.rs`.
- `core/watcher/definitions/lead-ended.query.json`, `session-gone.query.json`,
  `core/attention/definitions/head-gone.query.json`.
- `packages/supervision/rust/tests/definitions.rs`, `packages/supervision/rust/tests/watcher.rs`.
- The run supervisor's `closed.json` (`{v, attemptId, closedBy, steps, at}`), written into the head's `runDir`
  when its attempt closes (`packages/run-supervisor/rust/src/supervise.rs`); read it, never write it here.

## Footprint

- `apps/fgos/src/wiring/observe_sources/head_state.rs`
- `apps/fgos/src/wiring/observe_sources/tests/mod.rs`
- `apps/fgos/observe-kinds.json`
- `core/watcher/definitions/lead-ended.query.json`
- `core/watcher/definitions/session-gone.query.json`
- `core/attention/definitions/head-gone.query.json`
- `packages/supervision/rust/tests/definitions.rs`
- `packages/supervision/rust/tests/watcher.rs`
- `packages/supervision/rust/tests/fixtures/definitions/**`

## Steps

1. In the head-state projection, a placement with no valid `retiredAt` whose `runDir` holds a readable
   `closed.json` with a valid `at` answers `ended`, with record `ts` = that `at`; Session Host is not asked. A
   `retiredAt` still wins (`retired`). Add `ended` to the `fgos.head.state` values in `apps/fgos/observe-kinds.json`.
   Decide from the file on disk at each tick, never from a cached copy.
2. `lead-ended` reads `retired` or `ended` for a lead role (both role forms, as today).
3. If the diagnosis names the window drop: give a `gone` record an instant that stays the same while the head stays
   gone and lies inside the watcher's window (for example the run directory's `closed.json` `at` when present, else
   the first tick that saw it gone, held where the projection can read it again). Keep one event id per incident.
4. If the diagnosis names a lead with no placement (short role started by hand): record it in the report as out of
   reach of this projection and leave it to phase 3's close door and the supervisor's `plans` view; do not invent a
   placement writer.
5. Owning proofs, one per behaviour:
   - projection: `closed.json` present gives `ended` at its instant; `retiredAt` beats it; a rotated head (new
     `runDir`, no `closed.json`) is not `ended`; an unreadable `closed.json` is no signal (`tests/mod.rs`);
   - definition: `lead-ended` raises on an `ended` lead and not on an `ended` non-lead head (`definitions.rs`,
     extend the existing lead-role case and its fixture);
   - wiring: one watcher tick over an ended lead with an empty queue records one `lead-ended` row, and a second tick
     raises nothing new (`watcher.rs`).

## Verify

```bash
cargo test -p fgos observe_sources
cargo test -p fgos-supervision --test definitions --test watcher
```

All pass; the new cases fail on the tree before this phase.

## Rollback

Revert the phase commit. The projection returns to `retired` from `retiredAt` only.
