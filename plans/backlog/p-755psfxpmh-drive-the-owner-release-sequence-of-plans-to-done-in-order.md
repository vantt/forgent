---
id: p-755psfxpmh
title: Drive the owner's release sequence of plans to done, in order, without waiting to be asked (supervision, priority high; owner order via Miu, 2026-11-25; standing until every step is done)
status: proposed
priority: P1
area: supervision
created: 2026-11-25
---

# Why

The owner ordered the secretary to coordinate until these plans are complete and released in this order, across any rotation of the secretary.

# Done when

1. Heads-operate 261124-0004 phase 7 (bottleneck) and land-door-recovers-half-done-work 261125-1558 are done, in parallel.
2. Then admitted: shaper-worktree 261125-1557 (after heads-operate), backlog-index-generated 261125-1556 (after land-door), head-lifecycle-events 261124-2143 (after heads-operate).
3. Then keeper 261122-0056 orchestration-skeleton (after head-lifecycle-events; carries p-rjzck3f7mg).
4. Fillers: watcher-counts 261125-1558, and p-oq4hnkqyai if land-door does not cover it.
5. Last, low priority, in parallel: delete-dead-node 261122-2108, then confinement-to-rust 261124-1853.
6. Never more than two full test suites at once; the land-cost items p-l54vuzupa5, p-6sd4fslxv7 and p-vyzy7isj3z are queued right after step 2.

# Notes

Each wake, the secretary compares `fgos supervisor plans` with this order and raises the next step when one finishes. Anything a head cannot run goes to lead:SUPERVISOR (unconfined); its mailbox handle and pane are found with `fgos mailbox list --long` and `fgos session read lead:SUPERVISOR`.
