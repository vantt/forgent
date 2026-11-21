---
id: p-ficygecgfb
title: "`fgos session start shaper` fails as `verb-failed (internal)` with no reason (session host, priority medium)"
status: proposed
priority: P2
area: session-host
created: 2026-11-19
---

# Why

Seen twice on 2026-11-19 from the secretary head (06:2x and 13:4x): there is no persona `shaper` (core/agents has secretary, planner, supervisor, lead), so the start cannot place it, yet the refusal is an internal error naming nothing. The supervisor opened both shapers by hand as plain tabs.

# Done when

A start for an unknown persona is refused by name (`persona-not-found`, listing the known personas); and either a `shaper` persona exists so the secretary can open shapers itself, or the secretary skill names the supported path.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
