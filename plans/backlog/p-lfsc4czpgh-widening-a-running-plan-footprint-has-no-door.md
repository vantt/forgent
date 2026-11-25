---
id: p-lfsc4czpgh
title: Widening a running plan's footprint has no door; a planner cannot start for a plan without a discussion, and the footprint lives in two places
status: proposed
priority: P1
area: supervision
created: 2026-11-25
---

# Why

On 2026-11-25 the owner approved widening plan 261124-0004 by five files (q-xcuwpxa4kn). The lead may not change its own footprint, so it asked for a planner. `fgos session start planner` refused with `discussion-not-found` because the plan has no source discussion. The supervisor then edited the plan by hand. It first widened only the phase table row, and the run door refused the unit with `write-outside-footprint` because the frontmatter `footprint:` list is a second copy. Phase 7, the owner's bottleneck, sat parked about 40 minutes over this.

# Done when

One verb widens a running plan's footprint from an owner answer, writing the frontmatter list and the phase row together (or the footprint has one source that the other is derived from). The supervisor can call it without a planner, and one test covers that a widened file is accepted by the run door.

# Notes

Related: p-dgsxugpdgd (the watcher tick failure that also hid the answered-question events that evening).
