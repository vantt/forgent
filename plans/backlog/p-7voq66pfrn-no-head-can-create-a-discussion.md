---
id: p-7voq66pfrn
title: "No head can create a discussion for a ready backlog row: the planner refuses discussion-not-found and the secretary's session write cannot make a new file (supervision, source: supervisor:forgent, 2026-11-22)"
status: proposed
priority: P2
area: supervision
created: 2026-11-22
---

# Why

2026-11-22 00:56, coordination event `f1dfb666f976e854`: the secretary could not start the planner for `p-vnsigyw6h7`. `discussionOfHead` (`src/session-host/head-plan.mjs:188-205`) binds a planner only to a directory under `plans/discussions` holding a DISCUSSION.md, and the secretary's `fgos session write` refuses a new file (`path-not-granted`). A topic that needs no shaping (a triaged red-test row) still has to pass through a discussion file, and only a shaper or the supervisor's direct write under `plans` can create one. The supervisor seeded `ds-sovgvawfyv` by hand this time.

# Done when

One door lets a settled backlog row reach a planner without a hand-seeded discussion: either the planner binds to a backlog row (`plans/backlog/<id>-*.md`), or a coordinator verb creates a discussion directory from a row. The owner picks which (RUL104 (better, not bigger): a new mechanism needs the owner's choice).

# Notes

Filed 2026-11-22 07:59 while seeding ds-sovgvawfyv by hand, the case this row describes.
