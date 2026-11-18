# Phase 11 — Watcher tick and mailbox notifier

The watcher is a no-LLM Rust function run by the third OS timer (phase 15). One tick runs the detection definitions,
records each raised event once, and runs the configured action per row kind. It decides, starts and stops nothing.

## Inputs
- Waits: ops-metrics phase 4 (Observe write door, for the tick span) and phase 7 (`fgos metrics query --def <dir>
  --since`). Do not start before both are on `main`. Step 0 re-reads their landed names.
- Phase 3 (crate, `observe-kinds.json`), phase 4 (config keys: `watcher.enabled`, `watcher.activeIntervalSec`,
  `watcher.idleIntervalSec`, the per-kind action table, the notify recipient; use the landed key names), phase 8
  (`Queue`), phase 13 (definition files; row shape `{kind, reason, nextCommand, subject, ts}`).
- Repo lock `watcher` (PS-8): check `packages/holder-lock/contracts/lock-registry.v1.json` for the row. No phase of
  this plan owns that file for it.
  If it is missing, stop with `NEEDS_CONTEXT` (do not add a row from here).
- Atomic file write leaf: `rg -n "fn .*atomic|replace_durably" packages/*/rust/src` (reuse the lowest-layer one).
- Mailbox verb grammar: `src/cli/command-registry.mjs:1188-1200` (`fgos mailbox send --to <x> [--wake] <body>`).
- Timer template: `packages/distribution/rust/src/timer.rs:33-40` (`Schedule`); the interval semantics `:117-139`.

## Footprint
`packages/supervision/rust/src/watcher.rs`, `packages/supervision/rust/src/notify.rs`,
`packages/supervision/rust/tests/watcher.rs`.

## Steps
0. Re-grep inputs; run `fgos metrics query --help` on the landed tree and copy the real flags into the adapter.
1. Ports as traits in `watcher.rs` (the host wires real ones in phase 16): `Definitions` (`run(dir, since) ->
   Result<Vec<Row>>`; the adapter runs the host's `metrics query --def`), `Wake` (`wake(kind, ref) -> WakeOutcome`; the
   adapter runs `fgos supervisor wake`), `Notifier`, `Clock`, `TickState`, `Telemetry` (span emit), `TickLock`.
2. `tick(ports, settings) -> TickReport`, in this order:
   1. take the `watcher` lock; busy -> report `skipped: busy`, no action (a second tick is not an error);
   2. read state `{lastTick, lastFullTick}` (`.fgos/runtime/watcher/state.json`); no state = first tick: write
      `lastTick = now` and raise nothing (history before the watcher existed is not news);
   3. pace (PS-13): when the `watcher-active` rows are empty and `now - lastFullTick < idleIntervalSec`, finish early;
   4. run all definitions since `lastTick`. A runner failure leaves state unchanged (events are retried next tick) and
      reports `error`; a row `unmeasured` is counted and not raised;
   5. per row: id = first 16 hex of sha256 of `kind|subject|ts`; `queue.raise`; only `New` runs the action for its
      kind (`wake-supervisor` default, `notify`, `none`); a `Duplicate` does nothing;
   6. if unhandled events remain and no wake ran this tick, call `wake` once with the oldest (PS-9); the wake door
      never fronts a live pane (phase 12);
   7. only after steps 4 to 6, write state (`lastTick = now`; `lastFullTick = now` when it was a full tick), emit span
      `fgos.watcher.tick` with `raised`, `duplicate`, `wakes`, `notifies`, `errors`, `unmeasured`, `interval_sec`.
3. `notify.rs`: `Notifier::notify(&Event) -> NotifyOutcome` (`Sent`, `Refused(text)`, `Unavailable`); the mailbox
   adapter runs `<host> mailbox send --to <recipient> -- "<kind> <ref>: <reason>; next: <nextCommand>"`. A refusal or a
   missing host never aborts the tick; it is counted in `errors`.
4. Tests in `tests/watcher.rs` with fake ports, one behaviour each:
   - a row raises once; the same row on the next tick runs no second action;
   - the action table routes `wake-supervisor`, `notify` and `none` by kind;
   - an idle tick inside `idleIntervalSec` runs no definition; an active one does;
   - a runner failure leaves `lastTick` unchanged, and the next tick raises the event;
   - a busy lock skips; the first tick raises nothing;
   - a notifier refusal is counted and the other rows still run.

## Verify
- `cargo test -p fgos-supervision --test watcher` passes; clippy `-D warnings` clean.
- `rg -n "std::process::Command" packages/supervision/rust/src/watcher.rs` finds nothing (only adapters spawn).

## Rollback
Revert the phase commit. Nothing runs the tick until phases 15 and 16, so reverting leaves no timer behind.
