---
type: explanation
title: Why herdr cockpit stacked worker launches into one pane
tags: [herdr, pane, launch-guard, boot-window]
source_capture_ids: [tsk-40g]
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

## The common root: guards trusting a label's presence over its freshness

Both fixed defects share one shape: a launch guard treated "a label is
present" as sufficient evidence of "this launch has already settled,"
when the real question is always "does this specific label refer to
*this* launch." Cross-checking against the live `doing_item_ids()` set
(defect 1) and tracking pending state explicitly instead of inferring it
from a liveness flag that lags reality (defect 2) are the same fix
pattern applied to two different guards.
