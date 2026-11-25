---
id: ds-6z4rfn6kv5
title: "The backlog index is generated from the row files"
status: settled
source:
  - p-o4iniqvitl
created: 2026-11-25
---

discussion: settled

The owner confirmed on 2026-11-25 (answer to the secretary at about 15:55) that this plan is wanted; the request came through the manual supervisor and is seeded here for a planner.

## Hand-off to the planner

- **Outcome:** plans/backlog.md is rendered by a script from plans/backlog/*.md frontmatter plus the plans that cite each row; no hand edits; adding a row lands exactly one new file.
- **Constraints:** Footprint expected: the generator script, its test, the grants that wrote the index, plans/backlog.md. Reuse or retire in the same plan (one door, delete the old path): the session-write grants on plans/backlog.md (q-nudu6zlusf, p-dw3h5wscns), q-3rhc6lroqc (secretary repairs index files), scripts/check-backlog-reconciliation.mjs, src/session-host/head-start.mjs, src/runner/merge.mjs. Do not change the row file format. Do not move backlog into the event store.
- **Priority:** P1.
- **Non-goals:** anything outside the row's own "Done when".
- **Acceptance criteria:** the "Done when" of each source row, proven by one owning test at the lowest layer that can observe it.
- **Order:** first of the five plans; it lowers writes to main for all the others.
- **After planning:** mark the plan ready so the supervisor admits it when a lead slot frees (4 max).
- **Open points:** none that block.
