---
type: explanation
title: Why post-land drift detection intersects real changed paths, not declared footprint
tags: [merge, drift, footprint, catchup, changedFiles]
source_capture_ids: [tsk-2ypd]
authoritative_for: why fgOS detects post-land drift among sibling leaves by intersecting real git changed-paths instead of triggering mass catchup or comparing declared footprints
---
# Why post-land drift detection intersects real changed paths, not declared footprint

Part of the Merge Conductor design (`tsk-51m`; see
`docs/explanation/why-merge-was-a-single-lane-funnel-under-a-16-lane-dispatch-pipeline.md`
for the throughput diagnosis this closes one gap of). D4 in
`docs/history/merge-conductor-throughput-and-human-release/CONTEXT.md`.

## The wrong trigger this replaces

The naive rule — "a root branch just advanced, so re-verify every other
open leaf under it against it" — treats a topology event (a sibling
landed) as a proxy for real risk. For a root with 13 children landing
sequentially, that is roughly `12 + 11 + 10 + ... = 78` catchup+verify
cycles, each ~185s: nearly 4 hours of verify time. The overwhelming
majority of those cycles would find nothing actually touched.

## The real signal: intersecting actual changed paths

Real ground truth is available on both sides via
`changedFiles` (`merge.mjs:362`, `git diff --name-only trunk...branch`) —
what a leaf that just landed actually touched, and what each still-open
sibling leaf actually touches on its own branch. Two leaves only ever
risk colliding if those two real path sets intersect.

This deliberately does **not** use `footprintOverlapAmong`
(`graph-metrics.mjs:598`), which compares each item's own *declared*
footprint field — a value the item's own submission/planning step wrote
by hand, which can be missing or wrong. Once real `git diff` output is
available for both sides, there is no reason to trust a self-reported
proxy for the same fact.

## Detection, not remediation — the boundary this step never crosses

This step only classifies; it never acts on a leaf's branch itself.
Three outcomes, by real path intersection:

- **No path intersection** — do nothing at all. No notification, no
  marking, no catchup. This is the majority case in practice, and it is
  exactly where nearly all of the ~78 wasted cycles in the naive design
  came from.
- **Paths intersect, and the leaf's owning session is still live**
  (`claim-liveness.mjs` supplies the liveness check) — notify that
  session so it can decide whether and when to catch up. The owning
  session already holds the item's context, so acting now is the
  cheapest moment to fix it, and because the *owning session* makes the
  call, this never violates D2 (a branch with commits of its own is
  never touched by anything other than its own session).
- **Paths intersect, but no session is live** — mark the leaf stale and
  stop. Nobody is waiting on it right now, so paying the catchup cost
  immediately would be wasted work; it catches up lazily when its own
  turn in the merge queue actually arrives.

The load-bearing distinction: this is a **detection** point, not a
**catchup** point. If detection itself ever triggered a catchup call on
any branch, it would defeat the entire reason it exists — the design's
own acceptance criteria require proving, by test, that no verify runs
anywhere on this path, not just measuring that it's fast.

## Cost shape

The detection step costs `O(number of open leaves)` git diffs, with zero
verify runs attached — a fixed, cheap scan replacing an unbounded
cascade of full verify cycles that scaled with tree depth × sibling
count.

## Why this can run in parallel with the target-ref queue

This work declares `merge.mjs` in its own footprint, so `mergeReadiness`
naturally serializes it against the target-ref queue lane (D7,
`docs/explanation/why-merge-was-a-single-lane-funnel-under-a-16-lane-dispatch-pipeline.md`)
whenever both are ready at once — a deliberate consequence of sharing a
file, not a manually coordinated dependency between the two items.
