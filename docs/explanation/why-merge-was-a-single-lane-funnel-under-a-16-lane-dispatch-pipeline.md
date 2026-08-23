---
type: explanation
title: Why merge was a single-lane funnel under a 16-lane dispatch pipeline
tags: [merge, throughput, iron-law, main-checkout-lock, clean-tree]
source_capture_ids: [tsk-51m]
authoritative_for: why fgOS merge throughput bottlenecked despite parallel dispatch, and the merge target-ref queue design that replaced a hard concurrency cap
---
# Why merge was a single-lane funnel under a 16-lane dispatch pipeline

`tsk-51m` is the root shaping item for "gỡ nghẽn throughput và giải phóng
người khỏi việc ngồi canh merge" — closing the gap where dispatch could
run 16 items in parallel, but every one of them still had to squeeze
through one serialized merge lane behind them. Four independent report
scans plus three live incidents submitted the same day converged on the
same finding.

## Four real, independently-confirmed causes

1. **The lock's critical section was too wide.** `mergeRunnerItem` held
   `.fgos/main-checkout.lock` across the entire merge *and* verify —
   measured at ~185s against a 180s TTL — forcing a heartbeat patch
   (`docs/explanation/why-the-main-checkout-lock-needs-a-heartbeat-during-merge-verify.md`)
   that treated the symptom rather than shrinking the genuinely-exclusive
   region (git-merge-stage + commit only). The lock also wasn't scoped
   per root, so an unrelated root→main merge queued behind a leaf→root
   merge on a completely different branch.
2. **`merge-next` only ever consumed `ready[0]`.** `mergeReadiness`/
   `mergeSets` (`graph-harness.mjs`, a pure function untouched by fs/git)
   already computed the full non-conflicting ready set and grouped it by
   shared-root/footprint for safe serialization — nobody was using it.
   `merge-loop` just wrapped the single-pick verb in a sequential `/loop`.
3. **The clean-tree gate was even blunter than the lock.**
   `docs/explanation/why-a-leaf-to-root-approve-no-longer-gates-on-the-shared-checkout-being-clean.md`
   covers this in full — `tsk-51m`'s own submission session reproduced
   the exact same live incident it was independently reporting.
4. **A measured queue-head-blocking bug (`tsk-1zd`).** `merge-next` ran
   13 consecutive times, returning the identical item `tsk-2ej` every
   time with `to: null, exit 0`, while 7 other items sat fully ready to
   merge and never got a turn — the picker had no way to route around an
   item stuck on the Iron Law. Compounding it: `exit 0` plus `to: null`
   gave no mechanical way to distinguish "nothing left to merge" from
   "stuck forever on one item," which broke `merge-loop`'s own
   pool-empty stop rule.

## Only the Iron Law should ever require a person

`merge-blocked-other-item` and `verify-fail-post-merge` already had
machine playbooks by this point. `merge-conflict` was the odd one out:
`fgos catchup` already existed and already accepted `merge-conflict` in
`CATCHUP_REASONS`, and `tsk-3mv` had already proven the self-resolve
shape works — what was missing was skill *behavior*, not machine
capability (`docs/how-to/recover-from-a-merge-loop-merge-conflict-block-by-running-fgos-catchup.md`
covers the fix, `tsk-60h`). `verify-fail` and `integration-drift` were in
the same unwritten-playbook state at the time this item was scoped.

## The trap: fixing topology before the ancestry contract

The largest cluster of causes traced to nested leaf→root→main topology
(an 11-item case `tsk-3bn` itself called a systemic gap) combined with
`checkMergeStillResolves` already showing five distinct recorded failure
shapes, each prior fix narrowing the blind spot without closing it — a
real signal that the single-sha ancestry contract itself, not any one
call site, was the actual wrong assumption. Parallelizing merge *before*
fixing that foundation would have multiplied wrong judgments by N instead
of fixing them once.

## Locked scope, in order: B, then C, then A

The person confirmed all three directions, explicitly ordered — never
parallelized against each other:

- **B — write the remaining playbooks**, collapsing every block reason
  back down to exactly the Iron Law as the only person-shaped stop.
- **C — re-derive the `checkMergeStillResolves` contract** and close the
  nested-branch-tree gap, before anything below touches concurrency.
- **A — narrow the lock's critical section**, run verify outside it, and
  open N-way parallel merge for non-conflicting candidates using the same
  shape `dispatch.mjs` already uses — plus narrow the clean-tree check
  down to the merging item's own footprint.

## D7: lock merge by target ref, not a global concurrency cap

Direction A's own real design decision, once reached: rather than
capping "how many merges may run at once" with one global number, the
lock is keyed by **target ref** (`mergeSlotLockFile(targetRef)`,
`src/runner/main-checkout-lock.mjs` — `encodeURIComponent`-based, so
distinct refs always produce distinct, collision-free lock filenames).
Two merges landing on different target branches can run concurrently
with no shared lock at all; two merges racing the *same* target branch
still serialize, because that's the only pair that can actually collide.
This is the direct answer to cause 1 above: the lock stopped being
"one lock, one repo" and became "one lock per thing that can actually
conflict."

A companion decision (D5/D6) sequenced the work itself: the target-ref
queue (§E) goes first, with three small fixes running in parallel
alongside it; a separate item (`tsk-280`) was confirmed *not* to block
§E, and `tsk-1zd`'s queue-head-blocking bug was folded directly into §E's
own scope rather than fixed as a separate parallel item — the queue
redesign was the natural place to also fix "stuck behind one blocked
item," since both are about how work moves through the same merge queue.

## Constraints this design had to respect

Named explicitly, unmoved by anything above: `L10` (`moveWork` is the
one and only write door), `L9` (the three completion milestones — merge,
retrospective synthesis, cleanup — never collapse into one), `0005`
(the runner is the sole writer during dispatch), `0020` (a worktree never
carries its own `.fgos/`).

## Related

- `docs/explanation/why-the-main-checkout-lock-needs-a-heartbeat-during-merge-verify.md`
  — cause 1's earlier symptom-level patch
- `docs/explanation/why-a-leaf-to-root-approve-no-longer-gates-on-the-shared-checkout-being-clean.md`
  — cause 3, fixed
- `docs/how-to/recover-from-a-merge-loop-merge-conflict-block-by-running-fgos-catchup.md`
  — the merge-conflict playbook (part of direction B)
- `docs/history/merge-conductor-throughput-and-human-release/DISCUSSION.md`
  — the full shaping discussion this diagnosis was distilled from
