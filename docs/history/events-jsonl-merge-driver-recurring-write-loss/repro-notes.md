# events-jsonl-merge-driver-recurring-write-loss — repro notes

tsk-3wq D2 (this item's own decompose-stage plan.md): "proof of done
requires an actual live/simulated concurrent-race reproduction attempt,
not a code-fix-only unit test" — same bar `tsk-18a` D2 already set for a
sibling merge-race bug. Run 2026-08-10, immediately before this item's
own `fgos return`.

## Setup (both repros)

Two throwaway git repos in a scratch directory, each seeded identically:

1. `git init`, one commit carrying `.fgos/events.jsonl` with 2 ancestor
   events (seq 1, 2).
2. `branch-a`, branched from that ancestor, appends 2 real events (seq 3,
   4) and commits.
3. `branch-b`, branched from the SAME ancestor (never sees branch-a's
   commit), independently appends 2 DIFFERENT real events, ALSO numbered
   seq 3, 4 — the exact collision shape a shared, git-tracked append-only
   log produces when two sessions each number their own new lines
   starting from the same last-known seq.
4. `main` merges `branch-a` first (clean fast merge, main hadn't
   diverged yet).
5. `main` then merges `branch-b` — THIS is the real test: main has now
   diverged from the ancestor (via branch-a's merge) and branch-b has
   independently diverged too, both touching `.fgos/events.jsonl`.

The only difference between the two repros: repro A carries a committed
`.gitattributes` with `.fgos/events.jsonl merge=union` (this item's D1
fix); repro B carries no `.gitattributes` at all (git's plain default
merge behavior, i.e. the situation every checkout was in before this
item).

## Repro B — WITHOUT the fix (counterfactual, proves the bug is real)

```
$ git merge --no-ff branch-b -m "merge branch-b"
Auto-merging .fgos/events.jsonl
CONFLICT (content): Merge conflict in .fgos/events.jsonl
Automatic merge failed; fix conflicts and then commit the result.
```

The conflicted file:

```
{"seq":1,...,"payload":{"id":"anc-1"}}
{"seq":2,...,"payload":{"id":"anc-2"}}
<<<<<<< HEAD
{"seq":3,...,"payload":{"id":"branch-a-event-1"}}
{"seq":4,...,"payload":{"id":"branch-a-event-2"}}
=======
{"seq":3,...,"payload":{"id":"branch-b-event-1"}}
{"seq":4,...,"payload":{"id":"branch-b-event-2"}}
>>>>>>> branch-b
```

This is the EXACT shape tsk-n4i's own D1 finding described: "ad hoc
git-merge-conflict hand-resolution on the tracked `.fgos/events.jsonl`."
Whoever (human or agent) resolves this conflict can trivially pick "keep
HEAD" or "keep branch-b" — silently discarding 2 real events from
whichever side loses, no error, no warning. This confirms the bug is
real and reproducible on demand, not merely theorized from git's own
documentation. Merge aborted cleanly afterward (`git merge --abort`),
never landed.

## Repro A — WITH the fix (D1's actual mechanism)

```
$ git merge --no-ff branch-b -m "merge branch-b into main"
Auto-merging .fgos/events.jsonl
Merge made by the 'ort' strategy.
 .fgos/events.jsonl | 2 ++
 1 file changed, 2 insertions(+)
```

Exit 0. No conflict, no hand-resolution needed at all. The merged file:

```json
{"seq":1,"ts":"2026-01-01T00:00:00.000Z","type":"work.add","payload":{"id":"anc-1"}}
{"seq":2,"ts":"2026-01-01T00:00:01.000Z","type":"work.add","payload":{"id":"anc-2"}}
{"seq":3,"ts":"2026-01-01T00:01:00.000Z","type":"work.take","payload":{"id":"branch-a-event-1"}}
{"seq":4,"ts":"2026-01-01T00:01:01.000Z","type":"work.return","payload":{"id":"branch-a-event-2"}}
{"seq":3,"ts":"2026-01-01T00:02:00.000Z","type":"work.take","payload":{"id":"branch-b-event-1"}}
{"seq":4,"ts":"2026-01-01T00:02:01.000Z","type":"work.return","payload":{"id":"branch-b-event-2"}}
```

All 6 real events present (2 ancestor + 2 branch-a + 2 branch-b) — **zero
events lost**, confirming `union` is the right primitive for D1's core
fix. The residue is exactly as documented (git's own docs: "tends to
leave the added lines... in random order" and, here, duplicate `seq`
values from each side's independent numbering) — exactly what component
3 exists to close:

```
$ node scripts/events-jsonl-contiguity.mjs --check .fgos/events.jsonl
{"ok": false, "totalLines": 6, "duplicates": [{"seq":3,...},{"seq":4,...}], "gaps": [...]}

$ node scripts/events-jsonl-contiguity.mjs --fix .fgos/events.jsonl
{"fixed": true, "totalLines": 6, "dedupedCount": 0, "resequencedCount": 2, "backupPath": "..."}

$ node scripts/events-jsonl-contiguity.mjs --check .fgos/events.jsonl
{"ok": true, "totalLines": 6, "duplicates": [], "gaps": []}
```

Post-fix content — fully contiguous, all 6 real events intact, sorted by
`ts`:

```json
{"seq":1,...,"id":"anc-1"}
{"seq":2,...,"id":"anc-2"}
{"seq":3,...,"id":"branch-a-event-1"}
{"seq":4,...,"id":"branch-a-event-2"}
{"seq":5,...,"id":"branch-b-event-1"}
{"seq":6,...,"id":"branch-b-event-2"}
```

## Conclusion

The full pipeline (git-level `union` merge, then `events-jsonl-
contiguity.mjs --fix`) takes the exact divergent-branch scenario that
provably conflicts and gets hand-resolved today (Repro B) through to a
clean merge with zero data loss and a fully contiguous result (Repro A).
This closes the loop the feasibility matrix's one deferred row named
before `fgos return`.
