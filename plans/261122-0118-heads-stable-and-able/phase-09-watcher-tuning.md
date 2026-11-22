# Phase 9: One watcher tuning change, measured after

Capability: `code:test` (measure) and one config change through `fgos watcher tune`.

Closes `p-vquz26ibnn` item (7).

## Inputs

- `plans/261122-0118-heads-stable-and-able/reports/baseline-wake-and-idle.md` (phase 1): its counts, its false or true
  rule and its commands.
- `core/config-standard/watcher.yaml`: `sessionIdleLimit` (consecutive idle periods before a `session-idle` row; default
  0), `activeIntervalSec`, `actions` (wake-supervisor, notify or none per row kind), `stuckWakeLimit`.
- Phase 7's idle-lead rule: one row now leads to a typed check, not a restart.
- `fgos watcher tune --help` (changes thresholds within the schema bounds and records the change as a coordination act).

## Footprint

`.fgos/config.yaml` (only through `fgos watcher tune`),
`plans/261122-0118-heads-stable-and-able/reports/after-wake-and-idle.md`.

## Steps

1. From the baseline, choose the one change that removes the most false rows without hiding a true one. The expected
   candidate is raising `sessionIdleLimit` so that a single idle period no longer raises a row. Name the value and its
   reason from the baseline numbers, for example the longest idle gap of a session that was progressing.
2. Apply it with `fgos watcher tune`, one change only, so the after-measure is attributable.
3. After at least 24 hours of live work, rerun phase 1's commands over the new window and apply the same false or true
   rule.
4. Write `reports/after-wake-and-idle.md`: the before and after per-hour wakes, the false and true idle rows, the change
   made, and whether any true idle was missed, meaning a session idle with unfinished work for longer than the new
   threshold with no row. If a true idle was missed, revert the change and say so.
5. Backlog p-4uqiyjwrtd (owner decision A, 2026-11-22): both reports count missed idle alarms (a live lead idle with
   unfinished phases and no row) next to the false ones, and the before report names the 2026-11-22 case.

## Verify

Both reports exist and use the same commands and rule, and the after report states the measured difference.

## Rollback

`fgos watcher tune` back to the baseline value recorded in the baseline report.

## Chosen change (lead, 2026-11-22 13:35)

`watcher.actions.session-idle: none`, the one change. The expected candidate, a higher `sessionIdleLimit`, does not
fit the evidence. The query (`core/watcher/definitions/session-idle.query.json`) fires when a session's
activity-record **count** over `lookbackSec` exceeds the limit. That makes it an activity edge, not a silence
detector: silence leaves `max:ts` unchanged, so it raises nothing new (`docs/platform/supervision/spec.md` 6.1). A
higher limit would only change how much activity it takes to fire. The baseline shows 688 of 688 rows false and 0
true, with 211 supervisor generations started over 49 hours. With the action at `none` the rows are still raised and
read by the supervisor on every wake (phase 7 rule), but they no longer start a supervisor. No true idle is hidden,
because the query never reported one. A missed idle lead is caught by the supervisor's per-wake check of running
plans and by `plan-no-progress`. Applied by lead:SUPERVISOR from block `phase9` of `config-patch-items.yaml`; the
24-hour after-window starts at its commit.
