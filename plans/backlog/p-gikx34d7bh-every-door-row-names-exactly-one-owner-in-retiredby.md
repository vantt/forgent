---
id: p-gikx34d7bh
title: "The `retiredBy` of 12 door rows must name exactly one owner: a plan, a phase or a backlog row (component-authority, priority high; source: owner via the manual supervisor, 2026-11-24, decisions D21 and D22)"
status: proposed
priority: P1
area: component-authority
created: 2026-11-24
---

# Why

Door rows are debt. A row whose `retiredBy` points to a closed plan, to a report, or to a sentence with no owner cannot be paid. The owner asked that every door row say who pays the debt (D22) and that the owning plan put closing the row into its acceptance (D21).

# Done when

`grep -h '^retiredBy' packages/component-authority/model/doors/*.yaml` shows no line that lacks an owner at its start (a plan, a phase or a `p-...` id); no row points to a closed plan or to a report; the `NAMED_DOOR_DEBT` guard in `test/architecture.test.mjs` is green; the next release carries the change. Each owning plan lists closing its rows in its acceptance criteria.

# Work and proposed owners

The planner of plan `261124-1026-harden-next-round` takes this into its phase 0 (the supervisor asked for it) and confirms each owner; the proposals below come from the supervisor's reading and are not verified.

- `kernel-lock-primitive`: points to phase 12 of the closed doors plan; assign to a living owner.
- `run-bounded-child` and the two rows of its group: point to a report; owner is p-tvwy24txpj.
- `no-node-from-native-packaging`: assign T9.
- `process-control-signal`: list the phases that move each child-spawning code.
- `main-checkout-activity-beacon`: assign T2-T3.
- `read-and-clear-a-hot-mutex-record`: assign T7.
- `agent-hook-table` and `delete-guard-keyword-list`: assign the phase that deletes `src/setup/agent-hooks.mjs`.
- `canonical-json-bytes` and `retired-node-s5-hook-script`: assign T9, or a backlog row.
- `skill-generated-stamp`: owner is p-6ectcp6jyg. `footprint-write-scope-overlap-rule`: owner is p-taifrvti2x. Both are severity high and go first, ahead of phase 0 (fast path, D25 and D26).

# Notes

The planner of the skeleton plan is already off, so this goes through the normal route.
