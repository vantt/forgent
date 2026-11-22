---
id: p-25q7tz6jtt
title: "One door and one injection seam for starting an agent, so context is injected at start instead of loaded from CLAUDE.md and AGENTS.md (core, priority high; source: owner via Miu, 2026-11-22)"
status: proposed
priority: P1
area: core
created: 2026-11-22
---

# Why

Every agent loads CLAUDE.md and AGENTS.md in full and uses little of it, which costs many tokens on every start. At the moment an agent starts, the system already knows its role, domain and task, so the context that fits could be injected then. The `head start` activation prompt is already good and is the model to start from. The owner does not know how many ways there are to start an agent, or how many places own the start prompt.

# Done when

A scan lists every way an agent is started and every place that writes or owns its start prompt or start context. The result names one door for starting an agent and one fixed seam where context is injected (role, domain, task in; context out), and says what must move to reach it. The shaped discussion hands a planner a clear outcome.

# Notes

Owner 2026-11-22: shape first, scan inventory before design. Prior art and the seam shape are for the shaper to find (`git log -S` on the symbols and the area specs' decision history).
