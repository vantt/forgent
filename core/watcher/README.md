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
| `ts` | `aggs["max:ts"]`, except: with `count` and `span` (a run of point records: `supervisor-wake-failed`, `supervisor-stuck`) the run's first record, `max:ts` minus `span`; with `span` and no `count` (one span: `lane-freed`) its end, `max:ts` plus `span` |

The id is derived from `kind|subject|ts`, so a re-run over an overlapping window gives the same id.

`lane-freed` answers one row per ended attempt (newest attempt per run, grouped by `origin.host` and run), not one
per host: an end instant per host needs a `max:end` aggregate, and per attempt each end is its own event.

## Pending Observe grammar

What the phase asks for and the landed grammar cannot say. Each definition keeps the closest honest form until the
named feature lands in Observe (`packages/observe/rust/src/{query,definition,metrics_cli}`).

- `lead-ended` — pending Observe grammar: a `prefix` condition operator (`{"field": "<role attr>", "op": "prefix",
  "value": "head:lead-"}`), and the role attr on `fgos.head.state` (ops-metrics phase 11, not landed). Today any
  retired head raises it.
- `supervisor-wake-failed`, `supervisor-stuck` — pending Observe grammar: an anti-join anchor `after` (the window
  runs from the record's `ts` to now), so `without` a later `started` wake drops the failures before it. Today a
  `started` wake does not reset the count.
- `supervisor-wake-failed`, `supervisor-stuck` (instant) — pending Observe grammar: a definition that the caller's
  `since` does not cut (`"window": "own"`), bounded by the anti-join above. Today the run's first record is read from
  the window, so the row's `ts` moves once the watcher's window passes it; the fixtures hold that first record inside
  both windows and the test says so.
- `watcher-active` — pending Observe grammar: the same `prefix` operator and an `any` (or) group in `where_latest`,
  to add "or a `head:lead-*` head is `live`" over the two kinds. Today it reads only plans whose latest status is
  `running`; counting every live head would keep the watcher active for the supervisor and secretary heads.
- `watcher-overdue` — pending Observe grammar: an operand factor `k` that takes a parameter
  (`"k": {"param": "k"}`), so `params.k <- watcher.overdueFactor` reaches it. Today the factor 3 is written in the file.
- `supervisor-idle-burn` — pending Observe grammar: `without.latest: true` (test only the newest record of the
  anti-join kind at or before the primary record), so the wake is dropped when the tick in force at the wake had a
  ready or running plan. Today any tick with a ready or running plan in the 10 minutes before the wake drops it.
- every raised definition — pending Observe grammar: `--since`/`--until` accepted with `--def`, applied as each
  definition's window (`metrics_cli/query.rs` refuses them today). The watcher's `since = lastTick - lookbackSec`
  cannot reach a definition until then; the test writes the window into a copy of the file.
