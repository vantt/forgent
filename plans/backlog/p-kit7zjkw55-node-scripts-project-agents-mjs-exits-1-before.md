---
id: p-kit7zjkw55
title: "`node scripts/project-agents.mjs` exits 1 before writing (tooling, priority low)"
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

It refuses to overwrite AgentKit's unstamped `.claude/agents/code-reviewer.md`, on main as well, so the generator never refreshes `.claude/agents` in this repo. Found during the agent-definitions door fix.

# Done when

The generator skips or reports files it does not own without failing, and regenerating on this repo leaves an empty diff.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
