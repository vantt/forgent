# Phase 1: Diagnose why an ended lead raised no event

Read-only. Names the cause recorded as unknown in `p-iatzcg2gee` before phase 2 changes anything.

## Inputs

- `plans/backlog/p-iatzcg2gee-*.md`: two leads finished at 19:29 on 2026-11-23; `fgos supervisor queue` stayed
  empty; Miu raised a `coordination-chore` by hand at about 20:10.
- `apps/fgos/src/wiring/observe_sources/head_state.rs`: `retired` only from `retiredAt`; a `gone` record is stamped
  with `startedAt`.
- `core/watcher/definitions/lead-ended.query.json`, `session-gone.query.json`,
  `core/attention/definitions/head-gone.query.json`.
- `packages/supervision/rust/src/watcher.rs` (the `since = last_full_tick - lookback_sec` window) and
  `packages/supervision/rust/src/wake.rs` (`CAPACITY_KINDS` closed when nothing is admissible).
- Live state: `.fgos/runtime/session-rotation/lead-*/placement.json` and each `runDir`'s `closed.json`;
  `.fgos/runtime/supervision/`; the Event Store supervision stream (`fgos supervisor queue --all` or the
  observe query of `fgos.supervisor.wake` spans for 2026-11-23 19:00-20:30); `git log` for the plans done that
  evening (`261121-2110-component-authority-doors`, `261122-0118-heads-stable-and-able` and the others whose
  `status: done` landed near 19:29).

## Footprint

- `plans/261124-2143-head-lifecycle-events/reports/diagnosis.md`

## Steps

1. Identify the two leads that ended at 19:29 (plan dirs, roles, head names) from git history and the placements.
2. For each, record: role form (`head:lead-*` or `lead:<LANE>`), whether a placement exists, whether `retiredAt`
   was set and when, whether `closed.json` exists and its `at`, and what `fgos.head.state` would have answered at
   19:30 (`live`, `gone`, `retired`).
3. Run the `lead-ended`, `session-gone` and `head-gone` definitions against that state with
   `fgos observe query --definition <file>` (or reproduce it in a scratch project under `.fgos/runtime/tmp/`) and
   record whether a row would be raised, and whether the watcher's window would have kept it.
4. Check the watcher's ticks that evening (`fgos.watcher.*` records or `.fgos/runtime/supervision/` state) and the
   wake outcomes: was a row raised and dropped, raised and closed as a capacity kind, or never raised.
5. Write `reports/diagnosis.md`: the cause (one of the candidates in `plan.md` "Prior art", or another with
   evidence), the evidence for each lead, and what phase 2 must change. If the cause differs from all candidates,
   say which part of phase 2 changes and stop for the supervisor before phase 2 starts.

## Verify

`test -s plans/261124-2143-head-lifecycle-events/reports/diagnosis.md` and the report names one cause with at
least one evidence line (path, record or commit) per lead.

## Rollback

Delete the report. Nothing else is written.
