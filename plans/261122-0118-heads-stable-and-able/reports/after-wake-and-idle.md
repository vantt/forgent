# After: Supervisor Wake Rate and False Idle Alarms

Phase 9 after-measure for `plans/261122-0118-heads-stable-and-able`, written 2026-11-23 14:50 (+07) by
head:lead-forgent-261122-0118-heads-b52f9. Capability `code:test`: an evidence read that changes no code.

## Result

The one tuning change (`watcher.actions.session-idle: none`) did **not** lower the wake rate. Wakes went from 13.9 per
hour in the baseline to 15.3 per hour after the change, and supervisor head starts went from 4.8 to 7.5 per hour.
`session-idle` rows were still raised at about the same rate, every one of them was false, none was true, and no true
idle was missed. The change is kept (see "Revert decision").

The cause is in the watcher code, not in the threshold. `packages/supervision/rust/src/watcher.rs` (tick, lines
352-358): when no newly raised row routes to a wake, the tick wakes the supervisor on the **oldest unhandled event of any
kind** (`ports.queue.unhandled()` → `open.first()`). It does not check that kind's `actions` entry. A `session-idle` row
with action `none` is still raised and stays unhandled until a supervisor marks it, so the next tick wakes the supervisor
on it anyway. The action only delays the wake by one tick. This fallback has been in place since the watcher was first
written (`4c0336ae8`, 2026-11-18). The fix is outside this plan's footprint, so it is raised as a separate item (below).

## Window and rule

- **After window:** `2026-11-22T07:20:00Z` to `2026-11-23T07:20:00Z` (24 hours from the tune at 14:20 +07; the config
  commit `a6608f628` followed at 14:47 +07).
- **Rule:** the phase 1 rule, unchanged. A row is false when the target session progressed within one watcher interval,
  or the supervisor marked it handled with no action. It is true when the session was idle with unfinished work and
  nothing else woke it.
- **Commands:** phase 1's commands 1 to 4 from the baseline report, with `--since`/`--until` and the Python window
  bounds set to the after window. The added breakdowns use the same `fgos metrics query` with `--by
  fgos.supervisor.trigger`, `--by fgos.supervisor.outcome` and `--where fgos.supervisor.trigger=session-idle`.

## Before and after

| Metric | Baseline (49 h, 2026-11-20 01:00Z to 2026-11-22 02:00Z) | After (24 h, 2026-11-22 07:20Z to 2026-11-23 07:20Z) |
|---|---|---|
| Supervisor wake records | 683 (13.9/h) | 366 (15.3/h) |
| Wakes with outcome `started` | 211 (4.3/h) | 177 (7.4/h) |
| Supervisor head generations started | 234 (4.8/h) | 180 (7.5/h) |
| Wakes triggered by `session-idle` | 443 (9.0/h) | 146 (6.1/h) |
| `session-idle` wakes that started a head | 153 | 78 |
| `session-idle` rows raised | 688 (14.0/h) | 319 (13.3/h) |
| False `session-idle` rows | 688 (100%) | 319 (100%) |
| True `session-idle` rows | 0 | 0 |
| Missed idle alarms | 0 named; the 2026-11-22 case is in the baseline | 0 attributable to the change |

The known bad window (9 h on 2026-11-21) ran at 31.9 wakes per hour. Both 24-hour-scale windows are far below it, but
that drop came before this change: it came from the work that ended the restart loop, which the baseline already covers.

### After window: wakes by trigger

`session-idle` 146, `session-no-result` 116, `manual` 24, `coordination-help` 24, `discussion-settled` 13,
`plan-priority-changed` 9, `question-answered` 7, `coordination-handoff` 6, `plan-no-progress` 5, `plan-became-ready` 5,
`plan-done` 4, `lead-ended` 3, `lane-freed` 3, `coordination-chore` 1.

`session-no-result` is now the second false-wake source at 4.8 per hour (123 in the 49-hour baseline, 116 in 24 hours
after). This change did not touch it.

### After window: wakes by outcome

`started` 177, `already-live` 155, `starting` 23, `nothing-unhandled` 8, `start-failed` 2, `nothing-admissible` 1.

### After window: `session-idle` rows per hour (UTC)

11-22 07h 12, 08h 17, 09h 20, 10h 32, 11h 42, 12h 19, 13h 26, 14h 28, 15h 27, 16h 12, 17h 4, 18h 2, 19h 4, 20h 4,
21h 2, 22h 5, 23h 13; 11-23 00h 17, 01h 11, 02h 1, 03h 7, 04h 5, 05h 9.

Rows by target session: `39631fb7` 91, `106fdda5` (lead:S6A) 82, `f381c6d2` (lead:SUPERVISOR) 70, `4f660b01` 35,
`99a46fb6` 33, `unknown` 8.

## False, true and missed

- **False:** all 319 rows. Each has a `supervision.event-handled` record `{"by":"supervisor"}` with no action, which is
  false under the rule's second clause.
- **True:** 0.
- **Missed (step 5, backlog p-4uqiyjwrtd):** the change could not hide a true idle, because the rows were still raised
  at the baseline rate. Separately, the supervisor's per-wake read of running plans and `plan-no-progress` (5 wakes)
  covered the leads. This read found no live lead that sat idle with unfinished phases and no row in the window.

## Revert decision

Step 4 says to revert only when a true idle was missed, and none was. The change is kept. It does no harm, and it is
half of the real fix: once the fallback honors `actions`, `session-idle: none` is exactly the setting that stops those
wakes. Rollback is still `fgos watcher tune session-idle` (re-arm).

## Follow-up outside this plan

- **The unhandled-event fallback should honor `watcher.actions`.** In `watcher.rs`, the oldest-unhandled wake should
  skip kinds whose action is not `wake-supervisor`. Expected effect, from this window: the 146 `session-idle` wakes per
  day drop to near 0. That is about 40% of all wakes, and it removes most of the 78 head starts they caused. This is a
  correction to existing code (RUL104), not a new mechanism. It is raised to the supervisor as `coordination-help` so a
  backlog row can be opened; this lead writes only its plan directory.
- **`session-no-result` false wakes** (116/day) need the same kind of measure before any change. That is a separate row.
