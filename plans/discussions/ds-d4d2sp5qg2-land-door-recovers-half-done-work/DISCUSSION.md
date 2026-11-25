---
id: ds-d4d2sp5qg2
title: "The land door finishes or recovers its own half-done work"
status: settled
source:
  - p-q2dn2cnzlq
  - p-o4juyw2ntg
created: 2026-11-25
---

discussion: settled

The owner confirmed on 2026-11-25 (answer to the secretary at about 15:55) that this plan is wanted; the request came through the manual supervisor and is seeded here for a planner.

## Hand-off to the planner

- **Outcome:** A dead or interrupted land no longer leaves a local main commit never pushed (every later land refused land-target-ahead, seen 3 times on 2026-11-25), and a git chain whose pid writer died has a recovery door (9 dead-writer candidates held 46 GB and filled the disk).
- **Constraints:** One plan for both rows. The prior plan 261121-0747-land-door-hygiene is done: the plan must say what it reused and what was missing. Footprints may overlap running plans: check with the plan contract.
- **Priority:** P1.
- **Non-goals:** anything outside the row's own "Done when".
- **Acceptance criteria:** the "Done when" of each source row, proven by one owning test at the lowest layer that can observe it.
- **Order:** after the backlog index and shaper worktree plans; needs a free lead slot.
- **After planning:** mark the plan ready so the supervisor admits it when a lead slot frees (4 max).
- **Open points:** none that block.
