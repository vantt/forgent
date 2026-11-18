# Watcher definitions

Named Observe queries the watcher runs (`fgos metrics query --def <dir>`). Detection is these files; no code names a trigger.

- `definitions/` — raised: each answer row becomes one event. Listed in `watcher.definitions`.
- `pace/` — never raised and never listed there: `watcher-active` (a row per running plan; no row means idle),
  `watcher-overdue` and `supervisor-idle-burn` (read by the doctor row `supervision-pace`).

`since` is never written in a file; the watcher passes it.

## Row to event

| Event field | Read from the answer row |
|---|---|
| `kind`, `reason`, `nextCommand` | the answer's `row` template |
| `subject` | the group's `origin.host` when it has one (`lane-freed`), else its `subject.id` |
| `ts` | the row's `min:ts` when it has one (a run of point records: `supervisor-wake-failed`, `supervisor-stuck`, the run's first record), else `max:end` (a span's end: `lane-freed`), else `max:ts` |

The id is derived from `kind|subject|ts`, so a re-run over an overlapping window gives the same id.

`lane-freed` answers one row per host (`origin.host`, newest attempt per run) with `max:end`: the end of the host's newest ended attempt.

`supervisor-wake-failed` and `supervisor-stuck` count the failures since the last `started` wake: an anti-join `after` drops a failure that a later `started` follows. Their window is their own (`"window": "own"`, `since` `-30d`), so the watcher's `--since` never moves the run's first record and the event id holds.
The own window slides: its `since` is `-30d` from now, so an incident older than 30 days with no later `started` wake leaves the window and re-raises once with a new `ts` (a new event id). Wider history is not read.

`plan-ready-waiting` is also `"window": "own"` with `since` `-30d`: Observe cuts by window before `latest_per`, so with the caller's window a plan that became ready before the lookback would never be reported after a missed edge or lost state. A plan ready for longer than 30 days leaves the window the same way.

Plan subject ids and plan refs are `plans/<name>`, never the bare name.

A lead is a head whose `fgos.head.role` starts `head:lead-` or `lead:` (`lead-ended`, `watcher-active`). `watcher-active` raises one row per running plan or live lead; no row means idle. `watcher-overdue` takes its factor from `watcher.overdueFactor`; `supervisor-idle-burn` tests only the newest tick at or before the wake.

Plan changes read `fgos.plan.status` records: `fgos.plan.change` is `status` or `priority` and `fgos.plan.to` is the new value. A plan-history query walks git (30-80 s until the Git lane adds a walk door), so these definitions stay on the watcher's short window.
