---
id: ds-bevhflpkmn
title: "Event-store io errors keep the path and the operation"
status: settled
source:
  - p-cg4w6nn5l6
created: 2026-11-25
---

discussion: settled

The owner confirmed on 2026-11-25 (answer to the secretary at about 15:55) that this plan is wanted; the request came through the manual supervisor and is seeded here for a planner.

## Hand-off to the planner

- **Outcome:** An event-store io error names the path and the operation, so the 2740 faults that were untraceable can be traced.
- **Constraints:** Small plan; make it first of the event-store pair. After it lands, p-duxnm52lzh (end-trigger failure and a seal) can be traced; do not plan that row here.
- **Priority:** P1.
- **Non-goals:** anything outside the row's own "Done when".
- **Acceptance criteria:** the "Done when" of each source row, proven by one owning test at the lowest layer that can observe it.
- **Order:** small, can go early.
- **After planning:** mark the plan ready so the supervisor admits it when a lead slot frees (4 max).
- **Open points:** none that block.
