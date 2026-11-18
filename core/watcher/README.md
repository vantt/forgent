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
| `subject` | the row's one `group` value (`subject.id`, or `origin.host` for `lane-freed`) |
| `ts` | `aggs["max:ts"]`; for `supervisor-wake-failed` and `supervisor-stuck` (which also carry `span`) the first record of the run: `max:ts` minus `span` |

The id is derived from `kind|subject|ts`, so a re-run over an overlapping window gives the same id.

## Known limits of the grammar

- `lane-freed`: `ts` is the newest ended attempt's start (no `max:end` aggregate), unique per attempt.
- `supervisor-wake-failed`, `supervisor-stuck`: a `started` wake does not reset the count (no forward anti-join).
- `lead-ended`: matches any retired head; the grammar has no prefix test on the role.
- `watcher-overdue`: the factor 3 is written in the file; an operand factor cannot take a parameter, so
  `watcher.overdueFactor` does not reach it.
