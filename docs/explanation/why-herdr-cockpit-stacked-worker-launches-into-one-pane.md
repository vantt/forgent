---
type: explanation
title: Why herdr cockpit stacked worker launches into one pane
tags: [herdr, pane, launch-guard, boot-window]
source_capture_ids: [tsk-40g, tsk-4ry]
authoritative_for: why herdr cockpit stacked worker launches into a single reused pane and relaunched its discovery worker during boot
---
# Why herdr cockpit stacked worker launches into one pane

A review after `tsk-2sj` merged (worker-slot occupancy;
`docs/explanation/worker-slot-is-the-engine-owned-occupancy-unit-across-every-launcher.md`)
found three real defects in herdr-plugin, all rooted in the same shape:
two launch guards keyed on pane labels that nothing was actually writing
at the moment the guard checked them. Full evidence trail:
`docs/history/herdr-cockpit-pane-guard-reuse-and-boot-window/`.

## Defect 1: a reused pane was retired on its previous occupant's stale label

`retire_settled_pending_panes` (`app.rs:805-819`) retired a reused pane
the instant it saw *any* label on it — including the label the
*previous* occupant had left behind, not a fresh label from the new
launch. That let herdr keep stacking new worker launches into the same
pane for the whole claim window, since the guard treated a stale label as
proof the new launch had already settled.

**Fix**: cross-check the label's task id against `doing_item_ids()` — a
label only counts as "this pane has settled" when it names a task that is
actually `doing` right now, not merely present.

## Defect 2: auto-discover had no boot-window guard

`main.rs:494-501`'s auto-discover launch condition relied on
`discovery_worker_alive`, which only turns true *after* the discovery
worker's own claim lands — leaving a real window at boot where the
condition read false and auto-discover could launch a second discovery
worker before the first one's claim had a chance to register.

**Fix**: a dedicated `pending_discover_pane` field tracks "a discover
launch is already in flight," independent of whether the claim has
landed yet — closing the boot-window gap the liveness check alone could
not cover.

## Defect 3: split out as a real product decision, not a mechanical fix

A third guard — the admin-lane merge/retro/cleanup relaunch guard
(`main.rs:623-625`) — turned out to need a genuine decision about
relaunch semantics (when an admin loop should vs. should not restart),
not a bug with one obviously-correct fix. Rather than force a mechanical
fix onto a product question, it was split into its own item
(`tsk-4ry`), left open and parked on a person's answer, while this item's
own delivered scope narrowed to the two defects above that did have
clear, evidence-backed fixes.

### Why defect 3 could not reuse defects 1/2's own fix pattern

`main.rs:623-625` gated relaunching the merge/retro/cleanup loops on
`registry.has_labeled_pane("fgos-auto-merge"/"-retro"/"-cleanup")` — but a
repo-wide grep (excluding `target`/`node_modules`) found zero writers of
those exact label strings anywhere in production code. The only real
pane-label writer (`plugins/fgOS/skills/terminal/rename.sh`) writes
task-id-shaped labels, never these fixed slot titles, so the guard was
permanently false-ish: once a toggle (`autoMerge`/`autoRetro`/
`autoCleanup`) was flipped on, its loop relaunched every poll tick.

Unlike defects 1 and 2, this could not be fixed by cross-checking against
live engine state the same way: `worker-slots.mjs`'s own D9 decision
states the admin lane deliberately has no engine-tracked occupancy at
all ("the admin lane never claims a work item... nothing here to
count"), so the `doing_item_ids()`-style check that fixed defect 1 has no
equivalent fact to check here. The worker-slot design's own Round 6-8
arc (`docs/history/orchestrator-worker-slots/DISCUSSION.md`) had already
settled "how do we know a worker is done" for the *execution* lane via
hard state transitions — but never covered a long-running *admin* loop's
relaunch-after-natural-exit question at all. This is exactly why the gap
needed a real product decision rather than a mechanical port of the
existing fix pattern.

**Locked resolution** (`tsk-4ry`, `docs/history/herdr-cockpit-pane-guard-reuse-and-boot-window/context-tsk-4ry.md`):

- **D1** — herdr's admin-lane auto-launch stops invoking the perpetual
  `/fgOS:merge-loop`/`/fgOS:retro-loop`/`/fgOS:cleanup-loop` skills
  entirely. It now invokes the single-item `/fgOS:merge-next`/
  `/fgOS:retro-next`/`/fgOS:cleanup-next` skills instead — one ready item
  per pane-launch, never a self-repeating sweep.
- **D2** — each toggle's relaunch guard becomes a two-part, per-tick
  check: (a) no `x-next` run of that kind is currently in-flight in its
  own pane, AND (b) the corresponding ready pool (merge/retro/cleanup
  candidates) still has at least one item. Both re-checked fresh on every
  poll tick — never a one-shot latch, never inferred from a stale
  loop-start snapshot.
- **D3** — the `merge-loop`/`retro-loop`/`cleanup-loop` skills themselves
  are unchanged and stay callable for manual/interactive use; this item
  only changes which skill herdr's own auto-launch path invokes.

The reframe underneath D1/D2 is the real insight: rather than trying to
detect whether a perpetual loop is "still running" from outside it (the
unsolvable version of the problem, given no engine occupancy tracking
exists for the admin lane), herdr stopped launching perpetual loops at
all — a single-shot `-next` launch is trivially checkable for "in flight
right now" the same way defect 1's own fix checked a worker's real
`doing_item_ids()` membership, because there is now a real, bounded
thing to check instead of an unbounded one.

## The common root: guards trusting a label's presence over its freshness

Both fixed defects share one shape: a launch guard treated "a label is
present" as sufficient evidence of "this launch has already settled,"
when the real question is always "does this specific label refer to
*this* launch." Cross-checking against the live `doing_item_ids()` set
(defect 1) and tracking pending state explicitly instead of inferring it
from a liveness flag that lags reality (defect 2) are the same fix
pattern applied to two different guards.
