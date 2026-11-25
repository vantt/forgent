---
id: ds-xb6hplcn2m
title: "A shaper runs in its own worktree and branch"
status: settled
source:
  - p-rjzck3f7mg
created: 2026-11-25
---

discussion: settled

The owner confirmed on 2026-11-25 (answer to the secretary at about 15:55) that this plan is wanted; the request came through the manual supervisor and is seeded here for a planner.

## Hand-off to the planner

- **Outcome:** fgos session start shaper creates a worktree and a branch for the discussion and starts the shaper inside it, so its rounds never dirty the main checkout; a round is persisted by a door (scoped commit on the branch) and the discussion lands on main once, when settled or paused.
- **Constraints:** Constraints found: the shaper grant writes only plans/discussions and has no worktree verb; its sandbox cannot run git writes (.git read-only). Reuse the worktree-per-plan door the leads use; say in the plan what existed. Owner words 2026-11-25 14:0x: whoever starts a shaper creates a worktree for it.
- **Priority:** P1.
- **Non-goals:** anything outside the row's own "Done when".
- **Acceptance criteria:** the "Done when" of each source row, proven by one owning test at the lowest layer that can observe it.
- **Order:** second; ranks with the backlog index plan.
- **After planning:** mark the plan ready so the supervisor admits it when a lead slot frees (4 max).
- **Open points:** none that block.
