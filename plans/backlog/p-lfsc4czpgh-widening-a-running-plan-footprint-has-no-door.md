---
id: p-lfsc4czpgh
title: Widening a running plan's footprint has no door; a planner cannot start for a plan without a discussion, and the footprint lives in two places
status: done
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

Discussion ds-mzyircswox shaped this to a settled design (four decisions: a running plan widens its own footprint mid-run inside the approved frame through one verb naming the acceptance criterion it serves; both footprint copies are written and checked; a planner can start for a plan without a discussion), but the owner closed it on 2026-11-26 without a planner (too much work and resource for now; marker `discussion: paused`, commit 95afcc9e6). Status stays proposed. Never start a planner for it unless the owner reopens it.
