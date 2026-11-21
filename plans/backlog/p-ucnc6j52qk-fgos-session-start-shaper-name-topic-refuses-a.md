---
id: p-ucnc6j52qk
title: "`fgos session start shaper --name <topic>` refuses a new topic with `discussion-not-found`; the shaper start must create the discussion stub instead (session-host, priority medium; source: owner decision via Miu, 2026-11-21)"
status: proposed
priority: P2
area: session-host
created: 2026-11-21
---

# Why

The task-binding fix (plan 261120-1547) made a shaper name bind to an existing discussion directory, so a brand-new topic is refused before launch. The secretary cannot write under docs/discussions, so every new topic needs a hand-made stub (the supervisor made one for workflow-engine, 652e7793d). Owner decision: the shaper start, or the shaper on its first round, creates the stub; the secretary gets no write grant for it.

# Done when

The BIND rule for shaper names creates the stub through the existing start door when no discussion directory exists (the stub shape of 652e7793d: `discussion: open`, a neutral title, an empty §2), instead of refusing; planners and leads keep refusing an unbound name. No new mechanism and no secretary grant. An owning test in head-start.test.mjs starts a shaper for a new topic and finds the stub.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
