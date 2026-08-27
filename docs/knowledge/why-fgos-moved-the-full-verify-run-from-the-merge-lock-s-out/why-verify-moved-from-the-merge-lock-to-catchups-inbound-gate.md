---
type: explanation
title: Why verify moved from the merge lock to catchup's inbound gate
tags: [merge, verify, main-checkout-lock, catchup, fast-forward]
source_capture_ids: [tsk-4ax]
authoritative_for: why fgOS moved the full verify run from the merge lock's outbound (land) side to catchup's inbound gate, so a landed merge's own critical section only needs a fast-forward
framework: diataxis
mode: explanation
---
# Why verify moved from the merge lock to catchup's inbound gate

Part of the Merge Conductor design (`tsk-51m`, direction A — see
`docs/explanation/why-merge-was-a-single-lane-funnel-under-a-16-lane-dispatch-pipeline.md`
for the throughput diagnosis this decision answers). D3 in
`docs/history/merge-conductor-throughput-and-human-release/CONTEXT.md`.

## The self-tightening loop this closes

`mergeRunnerItem` used to run the full `npm test` verify pass *while
holding* `.fgos/main-checkout.lock` — measured at ~185s against the
lock's own 180s `DEFAULT_TTL_MS` (`main-checkout-lock.mjs`), which had
already forced a heartbeat patch (`merge.mjs:745`, `tsk-4l8`) just to
keep the lock from expiring mid-verify. That created a real vicious
cycle: a slow merge lets `main` advance further before the next merge
lands, a more-advanced `main` makes that next merge's own verify run
inside the lock (see below for why), and verify running inside the lock
makes the *next* merge slower still.

## The mechanism that was already there but could never turn on

Two functions already existed to skip a redundant verify at the landing
gate, but their preconditions were never actually satisfiable in
practice:

- `mergedTreeAlreadyVerified` (`merge.mjs:803`) requires **both**: the
  target ref is already an ancestor of the item's branch, **and** the
  branch tip still equals `branchHeadAtReturn` (the sha verify last ran
  against).
- `skipRedundantChecks` (`merge.mjs:1046`) then lets the landing gate
  skip verify entirely when that holds.

The second condition is the one that kept breaking: any ordinary
`catchup` (merging the target ref into the item's branch to resolve a
block) creates a new commit, so the branch tip no longer equals
`branchHeadAtReturn` — the exact evidence `mergedTreeAlreadyVerified`
needed. Every catchup silently invalidated the fast-path it was
supposed to make possible, so verify fell back to running at the landing
gate, inside the lock, every time.

## The fix: catchup becomes the standard step, and it re-establishes the evidence

D3's fix is two halves:

1. **Catchup runs as the standard pre-land step**, not only once an item
   is already blocked — whenever the target ref isn't yet an ancestor of
   the item's branch at land time, catchup runs first.
2. **Catchup's own verify becomes the evidence `mergedTreeAlreadyVerified`
   consumes.** Since catchup is what advances the branch tip past
   `branchHeadAtReturn` in the first place, catchup's own verify pass —
   run outside the lock, in the item's own worktree — re-establishes
   exactly the two conditions the landing gate checks. The landing gate
   then only needs a fast-forward, no verify, because the evidence
   backing "this tree already passed verify against this target" is
   fresh.

Nothing about `mergedTreeAlreadyVerified`'s own two conditions loosened
to make this work — they stayed exactly as strict. The fix only made
them satisfiable more often, by making catchup the thing that keeps
re-supplying valid evidence instead of invalidating it.

## Fail-closed guarantees this had to preserve

The item's own acceptance criteria pin what must NOT change:

- An item that goes through catchup and lands: the landing gate does
  **not** run verify — provable by assertion, not by timing it.
- An item that *skips* catchup while the target ref has moved: the
  landing gate still runs the full verify, unchanged — no loosening.
- An item that never went through `return` at all (no
  `branchHeadAtReturn` recorded) always gets full verify at landing —
  this is the specific backstop that keeps a separate, unrelated item
  (`tsk-280`, a `fgos move` guard) from becoming a hole: without a
  recorded `branchHeadAtReturn`, `mergedTreeAlreadyVerified` fails closed
  by construction.
- The time the lock is actually held during one land should drop from
  ~185s to single-digit seconds, measured and recorded for real — not
  assumed from the design alone.

## Why this could not stand alone

D3 depends on the target-ref lock (D7,
`docs/explanation/why-merge-was-a-single-lane-funnel-under-a-16-lane-dispatch-pipeline.md#d7-lock-merge-by-target-ref-not-a-global-concurrency-cap`)
landing first: D3's own invariant — the target ref must not move between
catchup's verify and the actual land — only holds once merges racing the
same target ref are serialized by that lock. Without the queue, a second
item could land against the same target between catchup and land,
invalidating the very evidence D3 relies on.
