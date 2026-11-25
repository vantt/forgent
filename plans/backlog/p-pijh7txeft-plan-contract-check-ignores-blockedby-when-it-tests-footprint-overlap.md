---
id: p-pijh7txeft
title: "plan-contract-check ignores blockedBy when it tests footprint overlap between plans (tooling; source: planner of plan 0837, 2026-11-24)"
status: proposed
priority: P3
area: tooling
created: 2026-11-24
---

# Why

The plan contract says `blockedBy` resolves a footprint overlap between two plans, but `activeOverlaps` in `scripts/plan-contract-check.mjs` never reads it. A plan that shares files with a running plan and names it in `blockedBy` still fails the check when its status is `ready`. Found by the planner of plan 261124-0837, which had to stay draft because of it.

# Done when

`activeOverlaps` skips a pair where one plan lists the other in `blockedBy`, with one test that owns this behaviour, and the contract text and the check agree.

# Notes

Not blocking today: 0837 stays draft until plan 2110 is done, and the admission path already holds a plan with an open blocker.
