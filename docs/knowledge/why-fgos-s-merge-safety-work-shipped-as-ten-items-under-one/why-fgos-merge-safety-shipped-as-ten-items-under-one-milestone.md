---
type: explanation
title: Why fgOS's merge safety work shipped as ten items under one milestone
tags: [merge, approve, main-checkout-lock, multi-session, milestone]
source_capture_ids: [tsk-5t3a]
framework: diataxis
mode: explanation
---
# Why fgOS's merge safety work shipped as ten items under one milestone

`tsk-5t3a` is a milestone: "safe merge/approve mechanism under
multi-session (drift, lock coverage, gate-ordering)". It carried no
implementation of its own — its `verify` is a single check that its 10
named targets (`tsk-3bn`, `tsk-4voj`, `tsk-396`, `tsk-480`, `tsk-19j`,
`tsk-18a`, `tsk-2eq`, `tsk-2j9`, `tsk-15k`, `tsk-66x`) are all `status:
done`. As of this synthesis, all 10 are.

## Why one milestone instead of ten unrelated bugs

A research report
(`plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md`)
found that fgOS's merge/approve code was "individually well-engineered —
every function reviewed behaved exactly per its own documented
contract." The problem was the *absence* of a coordinating layer above
them: `src/runner/loop.mjs`, the one autonomous background process fgOS
runs, never called `approve`/`merge` at all, so every merge was triggered
by an independent operator with no shared view of what any other
operator was doing. The 10 targets were not random bugs — they mapped to
five named failure families the report identified by grepping and
reading the merge code directly:

1. **Drift** — an integration branch advances after being synced to
   `main` once; nothing re-syncs or warns (`tsk-3bn`).
2. **Scope-too-broad safety checks** — the Iron Law diff inherited a
   not-yet-merged ancestor's files as if they were the current commit's
   own change (`tsk-4voj`).
3. **Ordering/atomicity gaps** — a real `git merge` landing before the
   gate meant to guard it (`tsk-396`), or landing and then the
   status-write silently failing (`tsk-480`), or the code assuming a
   conflict happened when it did not (`tsk-18a`, `tsk-2j9`).
4. **Lock-scope bugs** — the leaf-merge path resolved its lock against a
   directory guaranteed fresh every time, so it never actually contended
   (`tsk-2eq`).
5. **Worst-case realizations** — a session's destructive git command on
   the shared main checkout destroyed another session's uncommitted work
   (the incident behind this repo's own main-checkout-reset safety net).

## The architecture the milestone locked in

A follow-up design report
(`plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`)
confirmed the coordinating layer is **not a daemon** — it is a
harness/skill with full visibility over merge-relevant work items,
called by a coding process to self-merge one step, with a loop or future
background daemon as just another caller of the same functions. It
locked a 3-layer shape already present in embryo:

```
Layer 1 — HARNESS (pure computation + read-only git inspection, never mutates)
  src/state/graph-harness.mjs :: mergeReadiness(view)
Layer 2 — ACTION (mutating; the only place a real git merge happens)
  bin/fgos.mjs case 'merge' -> 'next', src/runner/merge.mjs
Layer 3 — DRIVER (anything that calls Layer 2, one step or repeatedly)
  /fgOS:merge-next, /fgOS:merge-loop, a future daemon
```

No new layer needed inventing — Layer 3 already called Layer 2 through a
stable contract, and the milestone's 10 items fixed Layer 2's bugs and
built out Layer 1's real design, rather than replacing the shape.

## Related

- `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md` —
  the full problem inventory (16 items, 5 failure families) and external
  best-practice survey (merge queues, stacked-diff restacking, drift
  bots, DAG-based build ordering).
- `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md` —
  the locked layering and design decisions.
