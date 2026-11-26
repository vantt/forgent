---
id: p-5iq6tnsjdl
title: "When a running plan's footprint widens onto another active plan's paths, the system orders the two itself: the widened phase waits until the other plan lands that part, then rebases (supervision; source: owner order via the footprint shaper, 2026-11-26 12:41)"
status: proposed
priority: P2
area: supervision
created: 2026-11-26
---

# Why

Today the plan contract only warns on footprint overlap for running plans (`core/skills/_shared/plan-contract.md` section 5). Two widenings already landed on shared hot files: q-myvzcbz3sx widened plan 261124-2143 onto `bin/fgos.mjs`, and q-vqyxe5oi6j widened plan 261125-2313 onto `apps/fgos/src/routing.rs`, which plan 261125-1631 also holds. The owner wants the system to order such plans by itself, as pure machine coordination with no owner question.

# Done when

When a running plan's footprint changes mid-run and a new path overlaps another active plan's footprint, the system orders the two without asking anyone: the widened phase waits until the other plan lands that part, then rebases; the order and the wait are recorded and reported in one line. A test at the lowest layer proves the wait and the rebase for two plans sharing one path.

# Notes

Explicitly out of scope of discussion ds-mzyircswox, whose settled design only reports the overlap; that discussion is closed without a planner (paused, owner 2026-11-26 ~12:50) and is not reopened by this row. Source: `plans/discussions/ds-mzyircswox-widen-a-running-plan-footprint/DISCUSSION.md` section 4. Related: p-lfsc4czpgh. Relayed by the shaper; the secretary has not read the owner's words directly.

Owner 2026-11-26 16:12: the rule should tell the kinds of file apart. A file that only gains lines (CHANGELOG.md) or is generated from a source (command-manifest.json) does not block the ready flip or a widen; the plan that lands second rebases and regenerates. Only a hot file with logic is ordered or refused. Seen on plan 261122-0056-orchestration-skeleton refused against 261125-1631 on those two paths.
