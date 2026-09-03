---
type: explanation
title: Why pick refreshes a commitless branch's base but never touches a worked one
tags: [pick, worktree, baseRef, decompose, staleness]
source_capture_ids: [tsk-55p]
authoritative_for: why fgOS refreshes a work item's branch base at pick time when the branch has no commits of its own, and never when it does
framework: diataxis
mode: explanation
---
# Why `pick` refreshes a commitless branch's base but never touches a worked one

Part of the Merge Conductor design (`tsk-51m`; see
`docs/explanation/why-merge-was-a-single-lane-funnel-under-a-16-lane-dispatch-pipeline.md`
for the throughput diagnosis this closes one gap of). D2 in
`docs/history/merge-conductor-throughput-and-human-release/CONTEXT.md`.

## The gap: decompose-to-pick staleness

`fgw/<id>` branches are usually created right at decompose time
(`worktree.mjs:749`, `createBranchRef(..., baseRef: 'main')`), then sit
idle until someone actually picks the item. Agent dispatch is fast enough
that the target `main` can move meaningfully in that idle window, so a
branch can already be stale before anyone has written a single line
against it. Worse, `worktree.mjs:436-439` shows the *reuse* path
(picking a branch that already exists) ignores `opts.baseRef` entirely —
an existing branch is reused exactly as it stands, regardless of how far
behind it is. `docs/decisions/0022` had already named this exact spot (6
call sites independently deciding their own baseRef/cleanup behavior) but
left it as a known gap rather than a fix.

## The safety line: has this branch ever diverged from its own base?

The fix does not treat "branch already exists" as the deciding
question — a branch existing tells you nothing about whether real work
sits on it. The actual test is whether the branch's tip has moved past
its own base:

- **No commits of its own (tip == its own base)** — there is nothing to
  lose. Refreshing is a zero-risk operation, so `pick` does it
  automatically, no confirmation needed: bring the worktree up to the
  target's current tip instead of the stale base it was created against.
- **Has commits of its own (tip has diverged)** — this is real
  in-progress work. `pick` never touches it automatically; it only
  reports the ahead/behind drift and leaves the decision to the owning
  session.

Getting this test backwards in either direction loses real work — a
commitless branch mistaken for a worked one just means a slightly stale
base persists (harmless); a worked branch mistaken for commitless would
overwrite real commits, which is why the check compares the branch tip
against its own recorded base rather than any proxy like "does a worktree
exist for it."

## Why refresh is a merge-in, never a rebase

Refreshing merges the target ref into the branch — it never rebases.
fgOS keeps a live worktree checked out against each branch; rewriting
that branch's history out from under a live checkout is the exact
accident class `tsk-3au` already named. Merge-in is the same operation
`catchup` already performs for a blocked item, applied here proactively
at pick time instead of reactively at a merge block.

## What this does not change

Acceptance criteria pin the boundary: an item whose branch already has
commits is never auto-refreshed, only reported; and no code path in this
change ever rewrites branch history. This item can run independently of
the target-ref merge queue (D7) — it does not share any file footprint
with that lane and has no ordering dependency on it, unlike D3 (verify
at catchup's inbound gate), which does depend on the queue landing first.
