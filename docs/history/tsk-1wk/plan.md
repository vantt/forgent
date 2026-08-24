# tsk-1wk — plan

Mode: tiny, pass-through (single-line `.gitattributes` addition, no split).

## Approach

Extend `merge=union` to `.fgos/events/*.jsonl` (tsk-3ve's sharded
per-writer event-log files), matching the identical existing rule for
the old single-file `.fgos/events.jsonl` (tsk-3wq) and the 3 diagnostic
logs (tsk-2xg). No code path changes; git attribute config only.

## Footprint

- `.gitattributes` (the fix)
- `test/state/events-shard-gitattributes-union-merge.test.mjs` (new
  regression test)
- `CHANGELOG.md`, `docs/history/tsk-1wk-events-shard-gitattributes-union/CONTEXT.md`

## Validation

Real two-branch git scenario (concurrent appends to the same shard file):
confirmed a real merge conflict against the pre-fix `.gitattributes`
(failing-before), and clean auto-merge after the fix (passing-after). See
`docs/history/tsk-1wk-events-shard-gitattributes-union/CONTEXT.md` for
the full failing-test-first evidence.
