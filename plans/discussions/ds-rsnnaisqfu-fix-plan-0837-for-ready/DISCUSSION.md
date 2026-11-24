---
id: ds-rsnnaisqfu
title: "Make plan 261124-0837 pass the plan contract so it can be approved as ready"
status: settled
source:
  - p-jz2d2oid2m
created: 2026-11-24
---

discussion: settled

The owner asked on 2026-11-24, through the manual supervisor, to fix plan `261124-0837-docos-documentation-in-component-authority`. The request is complete as written and is seeded here unchanged so a planner can bind to it.

## Hand-off to the planner

- **Outcome:** plan `261124-0837-docos-documentation-in-component-authority` passes `plan-contract-check` and no longer collides with another plan, so the supervisor can approve it as `ready`.
- **Constraints:** the check now says "no phase table with a footprint column": add a phase table with a footprint column in the `plan-v1` shape. Its footprint overlaps plan `261124-0004-heads-operate-without-owner` (now `ready`): drop the overlapping files from 0837, or, if both plans truly must edit the same file, record `blockedBy` 0004. The model plan's wait on the authority update is over: remove the sentence that says phase 2 waits until `p-2lpsdtxnrd` lands, because it has landed and plan `261124-1433-authority-declare-update` is done.
- **Non-goals:** changing the scope of the DOCOS work; changing plan 0004.
- **Acceptance criteria:** (1) `plan-contract-check` passes on 0837; (2) its footprint shares no file with 0004, or `blockedBy` names 0004; (3) no sentence waits for the declare update.
- **After planning:** do not set the plan to `ready`; tell the supervisor, who approves it.
- **Open points:** none that block.
