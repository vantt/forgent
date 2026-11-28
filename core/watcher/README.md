# Watcher definitions

Named Observe queries the watcher runs (`fgos metrics query --def <dir>`). Detection is these files; no code names a trigger.

- `definitions/` — raised: each answer row becomes one event. Listed in `watcher.definitions`.
- `pace/` — never raised and never listed there: `watcher-active` (a row per running plan; no row means idle),
  `watcher-overdue` and `supervisor-idle-burn` (read by the doctor row `supervision-pace`).

`since` is never written in a file; the watcher passes it.

## Row to event

| Event field | Read from the answer row |
|---|---|
| `kind`, `nextCommand` | the answer's `row` template |
| `reason` | the template's `reason`, with each `{<agg>}` placeholder (`{count}`, `{sum:<measure>}`) filled from the row's aggregate values; a placeholder whose aggregate the definition does not list stays as written, and a reason with no `{` is unchanged |
| `subject` | the group's `origin.host` when it has one (`lane-freed`), else its `subject.id` |
| `ts` | the row's bucket start when the definition buckets (`main-notes-outrun-code`), else its `min:ts` when it has one (a run of point records: `supervisor-wake-failed`, `supervisor-stuck`, the run's first record), else `max:end` (a span's end: `lane-freed`), else `max:ts` |

The id is derived from `kind|subject|ts`, so a re-run over an overlapping window gives the same id.

`main-notes-outrun-code` counts the commits the trunk took, per UTC clock hour (`bucket: hour`), from the `fgos.main.commit` records (one per first-parent commit, read from git). Its instant is the hour's start, which never moves as the window slides, so one breached hour raises one event; the definition still lists `min:ts` because every raised row must carry an aggregate instant. Its window is its own (`"window": "own"`, `since` `-2h`), so the hour before the current one is wholly inside it and is judged once it has closed. A commit counts once, under the first match of: `code` (any path outside `plans/`), `plan-status` (a plan's `status` changed), `backlog`, `discussion`, `report`, `plan-note`. The share's numerator is notes, reports and discussion rounds (`fgos.main.commit.note`); backlog rows are counted and named in the reason but are not in it. An hour raises when it has at least `watcher.mainCommits.minForShare` commits and that numerator is over `watcher.mainCommits.noteShareMax` of the count, or when its count is over `watcher.mainCommits.perHourMax`. It takes the default action; set `watcher.actions.main-notes-outrun-code` to change it.

`lane-freed` answers one row per host (`origin.host`, newest attempt per run) with `max:end`: the end of the host's newest ended attempt.

`supervisor-wake-failed` and `supervisor-stuck` count the failures since the last `started` wake: an anti-join `after` drops a failure that a later `started` follows. Their window is their own (`"window": "own"`, `since` `-30d`), so the watcher's `--since` never moves the run's first record and the event id holds.
The own window slides: its `since` is `-30d` from now, so an incident older than 30 days with no later `started` wake leaves the window and re-raises once with a new `ts` (a new event id). Wider history is not read.

`plan-ready-waiting` is also `"window": "own"` with `since` `-30d`: Observe cuts by window before `latest_per`, so with the caller's window a plan that became ready before the lookback would never be reported after a missed edge or lost state. A plan ready for longer than 30 days leaves the window the same way.

`head-gone` is also `"window": "own"` with `since` `-30d`: the head-state source stamps a `gone` head with the `startedAt` of its placement, not with the tick, so the row's `max:ts` and the event id stay the same while the head stays gone and a handled incident is not raised again. A placement older than 30 days leaves the window.

Plan subject ids and plan refs are `plans/<name>`, never the bare name.

A lead is a head whose `fgos.head.role` starts `head:lead-` or `lead:` (`lead-ended`, `watcher-active`). `watcher-active` raises one row per running plan or live lead; no row means idle. `watcher-overdue` takes its factor from `watcher.overdueFactor`; `supervisor-idle-burn` tests only the newest tick at or before the wake.

Plan changes read `fgos.plan.status` records: `fgos.plan.change` is `status` or `priority` and `fgos.plan.to` is the new value. A plan-history query walks git (30-80 s until the Git lane adds a walk door), so these definitions stay on the watcher's short window.
