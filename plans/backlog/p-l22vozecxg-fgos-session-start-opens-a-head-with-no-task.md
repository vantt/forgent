---
id: p-l22vozecxg
title: "`fgos session start` opens a head with no task: the name is the only binding (session-host, priority high; source: owner via Miu, 2026-11-20, planner work-data-model started with only the start ritual)"
status: done
priority: P1
area: session-host
created: 2026-11-20
---

# Why

Hand starts and supervisor starts already use the same verb (`fgos session start <persona> --name <name>`, the supervisor skill's discussion-settled and plan-ready steps call it), but the verb puts only the start ritual into the brief (`openingText` in `src/session-host/head-start.mjs`). A planner started for a settled discussion, or a lead for a plan, does not learn which discussion or plan it serves, so the owner had to paste the task into the pane.

# Done when

`session start` resolves the name to what it is bound to (a planner or shaper to its discussion, a lead to its plan dir) and writes that path and the persona's first step into the opening; a hand start and a supervisor start of the same name give the same brief; an owning test in head-start.test.mjs starts a planner by a discussion's head name and finds the discussion path in the opening; a name bound to nothing is refused by name rather than started empty.

# Notes

Migrated from the legacy backlog table. Original status: done (plan 261120-1547-session-start-task-binding, commit 4d724e2db).
