# Phase 1: Measure one live tick before the change

Honors D1: measure before changing code; if the raise loop is not the dominant cost, stop and return to shaping.
Criterion 1.

## Inputs

- `plans/discussions/ds-r42bvbzode-watcher-tick-cpu/DISCUSSION.md` §3 (C1-C3) and §5: tick wall times from the
  watcher journal per window, detection at about 11 s, 328 rows per tick on 2026-11-28 19:30.
- `packages/supervision/rust/src/watcher.rs:274` (`tick`): the steps of a full tick, in order.
- `packages/supervision/rust/src/queue.rs:216` (`raise`), `:327` (`fold`): one raise is at least one full fold.
- `plan.md` § Unattended run, host steps marked phase 1.

## Files it may write

- `plans/261128-2236-watcher-tick-reads-queue-once/reports/measure-before.md`

## Steps

1. The lead asks the supervisor for the phase 1 host steps with `fgos supervisor raise --kind coordination-help`,
   naming each argv from the plan's Host steps table. Run on fg-server2 (`host`), against its live store.
2. Supervisor: run `fgos supervisor queue --json` three times and record each wall time. Each run is one fold of the
   whole `project` stream (`Queue::unhandled` -> `fold`), the same read one raise makes. Call the median F.
3. Supervisor: run `fgos metrics query --kind fgos.watcher.tick --since <now-3h> --json` (answers `ask`: one owner
   question carrying the argv). From it take, for the latest full tick: `fgos.watcher.raised` +
   `fgos.watcher.duplicate` = R (raise calls, so at least R folds), the outcome, and the span times of the ticks
   around it (the spacing between consecutive full ticks and the `skipped-busy` ticks between them bound the tick's
   wall time). If the ask is still unanswered when step 2 is done, use R = 328 and the journal wall times already in
   DISCUSSION §5, say so in the report, and add the span figures when the answer comes; this step does not hold
   phase 2.
4. Supervisor: run `fgos metrics query --def core/watcher/definitions --since <now-1d> --json` once and record its
   wall time: the detection step, as the tick runs it (one call over all definitions). Same `ask` handling as step 3;
   C1's 11 s stands in until answered.
5. Lead: write `reports/measure-before.md`: a table step | wall time | how measured (detection; raise loop = R x F
   with R and F; wake and the rest = tick wall - the two), the queue-read count of the raise step (R, plus one fold
   for the wake's `unhandled`), and the verdict line `raise loop dominant: yes|no` with the share of the tick.
6. Decide: dominant means the raise loop is at least half of the tick's wall time. If yes, mark phase 1 `done` and
   start phase 2. If no, mark phases 2-4 `withdrawn`, set the plan `withdrawn` with a one-line reason, and raise
   `fgos supervisor raise --kind coordination-handoff` to return the numbers to shaping (`ds-r42bvbzode`). The
   fallback is pre-approved by D1; it asks nobody.

## Verify

`reports/measure-before.md` exists, names the dominant step with its share of the tick, gives R and F with the
commands that produced them, and ends with the verdict line. Pass: every figure names its source command; a figure
taken from DISCUSSION §5 says so.

## Rollback

Nothing outside the report is changed. Delete the report to redo the measurement.
