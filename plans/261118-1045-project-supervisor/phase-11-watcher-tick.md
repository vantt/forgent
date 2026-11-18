# Phase 11 — Watcher tick and mailbox notifier

The watcher is a no-LLM Rust function run by the third OS timer (phase 15). One tick fetches the trunk, runs the
detection definitions, records each raised event once, and runs the configured action per row kind. It decides, starts
and stops nothing.

## Inputs
- Waits: ops-metrics phase 4 (Observe write door, for the tick span), phase 7 (`fgos metrics query --def <file|dir>`,
  repeatable, `--since`) and phase 14 (`core/attention/definitions/`, row shape of the attention view v2). Do not start
  before they are on `main`. Step 0 re-reads their landed names.
- Phase 3 (crate, `observe-kinds.json`: the exact tick attr and measure names), phase 4 (keys `watcher.enabled`,
  `activeIntervalSec`, `idleIntervalSec`, `lookbackSec`, `definitions`, `defaultAction`, `actions`, `notifyTo`), phase 6
  (the `watcher` repo lock row in `packages/holder-lock/contracts/lock-registry.v1.json`), phase 8 (`Queue`), phase 13
  (definition files and the pace file `core/watcher/pace/watcher-active.query.json`; row shape
  `{kind, reason, nextCommand, subject, ts}`, `ts` = the state-change instant).
- Remote port: `packages/git/rust/src/remote.rs:157` (`fetch_refs`), `inspect.rs:237` (`resolve_trunk`).
- Atomic file write leaf: `rg -n "fn .*atomic|replace_durably" packages/*/rust/src` (reuse the lowest-layer one).
- Mailbox verb grammar: `src/cli/command-registry.mjs:1188-1200` (`fgos mailbox send --to <x> [--wake] <body>`).
- Path resolution of `core/...` definitions: how the ops-metrics attention view resolves `core/attention/definitions/`
  (release payload vs project); use the same rule.

## Footprint
`packages/supervision/rust/src/watcher.rs`, `packages/supervision/rust/src/notify.rs`,
`packages/supervision/rust/tests/watcher.rs`.

## Steps
0. Re-grep inputs; run `fgos metrics query --help` on the landed tree and copy the real flags into the adapter; read
   one attention-view row and map its fields to `{kind, reason, nextCommand, subject, ts}` if they differ (the mapping
   lives in the adapter, nowhere else).
1. Ports as traits in `watcher.rs` (the host wires real ones in phase 16): `Fetch` (fetch the trunk's remote-tracking
   ref), `Definitions` (`run(defs: &[path], since: Option<instant>) -> Result<Vec<Row>>`; the adapter runs the host's
   `metrics query` with one `--def` per entry), `Wake` (`wake(kind, ref) -> WakeOutcome`; the adapter runs
   `fgos supervisor wake`), `Notifier`, `Portfolio` (plan rows, phase 3 reader), `QuestionsView` (`refresh()`; the adapter runs `fgos questions --json`
   once), `Clock`, `TickState`, `Telemetry` (span emit), `TickLock`.
2. `tick(ports, settings) -> TickReport`, in this order:
   1. take the `watcher` lock; busy -> outcome `skipped-busy`, no action (a second tick is not an error);
   2. read state `{lastTick, lastFullTick}` (`.fgos/runtime/watcher/state.json`); a missing or unreadable state is a
      first tick, handled by step 5's window, never "raise nothing" (PS-21);
   3. `QuestionsView.refresh()` once, on every tick that holds the lock (idle ones too): it refreshes the per-machine
      view `.fgos/cache/questions.json` that the owner-question receipt hook reads (that plan's QP-11, QP-23); a
      failure is counted in `errors` and never stops the tick;
   4. pace (PS-13, PS-22): run the pace file `watcher-active` (never raised); no row and
      `now - lastFullTick < idleIntervalSec` -> finish early with outcome `noop`, mode `idle`;
   5. full tick: `Fetch` (a failure is counted in `errors` and the tick goes on with local refs); run every
      `watcher.definitions` entry with `since = (lastTick or now) - lookbackSec`. A runner failure leaves state
      unchanged (events are retried next tick) and reports `error`; a row `unmeasured` is counted, not raised; a
      listed path that does not exist is counted in `unmeasured` (the watcher still runs);
   6. per row: a row missing `subject` or `ts` is counted in `errors` and not raised; id = first 16 hex of sha256 of
      `kind|subject|ts`; `queue.raise`; only `New` runs the action for its kind (`actions[kind]` else `defaultAction`:
      `wake-supervisor`, `notify`, `none`); a `Duplicate` does nothing;
   7. if unhandled events remain and no wake ran this tick, call `wake` once with the oldest (PS-9);
   8. only after steps 5 to 7, write state (`lastTick = now`; `lastFullTick = now` on a full tick); emit span
      `fgos.watcher.tick` with exactly phase 3's names: attrs `fgos.watcher.mode`, `fgos.watcher.outcome`; measures
      `fgos.watcher.interval` (the interval in force), `fgos.plans.ready`, `fgos.plans.running` (counted by a `Portfolio`
      port over phase 3's reader), `fgos.watcher.raised`, `.duplicate`, `.wakes`, `.notifies`, `.errors`, `.unmeasured`.
3. `notify.rs`: `Notifier::notify(&Event) -> NotifyOutcome` (`Sent`, `Refused(text)`, `Unavailable`); the mailbox
   adapter runs `<host> mailbox send --to <watcher.notifyTo> -- "<kind> <ref>: <reason>; next: <nextCommand>"`; a null
   `notifyTo` is `Unavailable`. A refusal or a missing host never aborts the tick; it is counted in `errors`.
4. Tests in `tests/watcher.rs` with fake ports, one behaviour each:
   - a row raises once; the same row on the next tick runs no second action;
   - the same projection row (stable `ts`) seen on three ticks raises one event and one action;
   - a row whose commit time is older than `lastTick` but inside `lookbackSec` is raised (late commit);
   - a missing state raises the rows inside `lookbackSec` once, and a second tick raises nothing new;
   - the action table routes `wake-supervisor`, `notify` and `none` by kind; a null `notifyTo` counts an error;
   - an idle tick inside `idleIntervalSec` runs no definition; an active one fetches and runs them;
   - every tick that takes the lock refreshes the questions view once, idle or full; a refresh failure is counted and
     the tick goes on; a `skipped-busy` tick does not refresh;
   - a runner failure leaves `lastTick` unchanged, and the next tick raises the event;
   - a busy lock skips;
   - a notifier refusal is counted and the other rows still run;
   - the span carries exactly the declared attr and measure names (read from `observe-kinds.json`).

## Verify
- `cargo test -p fgos-supervision --test watcher` passes; clippy `-D warnings` clean.
- `rg -n "std::process::Command" packages/supervision/rust/src/watcher.rs` finds nothing (only adapters spawn).

## Rollback
Revert the phase commit. Nothing runs the tick until phases 15 and 16, so reverting leaves no timer behind.
