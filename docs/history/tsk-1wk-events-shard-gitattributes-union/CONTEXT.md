# tsk-1wk — .fgos/events/*.jsonl merge=union gap

## Problem

tsk-3ve's event-log sharding migration introduced per-writer shard files
under `.fgos/events/<writer-id>-<openTs>.jsonl`. These are append-only
exactly like the old single-file `.fgos/events.jsonl`, but `.gitattributes`
only had `merge=union` for the old file (tsk-3wq) and 3 diagnostic logs
(tsk-2xg) — not the new sharded pattern. Every session's own live shard
hit the same git append-conflict problem those earlier fixes already
solved for the old layout, surfacing as real `fgos catchup` conflicts
during ordinary approve cycles (discovered live while approving tsk-3tp).

## Fix

Added `.fgos/events/*.jsonl merge=union` to `.gitattributes`, matching the
existing precedent exactly.

## Evidence

`test/state/events-shard-gitattributes-union-merge.test.mjs`: a real
two-branch git scenario (concurrent appends to the same shard file)
confirmed to fail with a real merge conflict against the pre-fix
`.gitattributes`, and pass after the fix.
