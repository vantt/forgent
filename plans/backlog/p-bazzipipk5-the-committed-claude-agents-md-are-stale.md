---
id: p-bazzipipk5
title: The committed `.claude/agents/*.md` are stale against `scripts/project-agents.mjs` (agent projection, priority medium; owner question Q1 of the YAML write door plan)
status: proposed
priority: P2
area: platform-foundations
created: 2026-11-17
---

# Why

The four committed files (`council-assumptions.md`, `council-feedback-loops.md`, `council-ship-maintain.md`, `fgos-placeholder.md`) still carry `model: sonnet` / `model: haiku` while the generator names no model (the seat's model is Seat Binding's answer), and the three council files hold invalid YAML frontmatter (`description: Council task posture: ...` unquoted). No test compares the files with the generator, so they keep drifting. **2026-11-17:** owner said regenerate; the four files are regenerated from the generator (frontmatter parses, `model:` lines dropped, so those agents now run on the session's model). Still open: whether the generator should write a model for direct Claude Code use (a cost and seat-binding question), and a check that fails when a committed agent file differs from the generator's output. The generator also refuses the whole run on `.claude/agents/*.md` files it did not generate (for example `code-reviewer.md`), so the four were projected by calling `projectAll` with only their definitions.

# Done when

The generator's model field is decided, and a check fails when a committed agent file differs from the generator's output (the four files are already regenerated with frontmatter that parses).

# Notes

Migrated from the legacy backlog table. Original status: proposed.
