---
id: p-ktnutm4m2f
title: "`familyOf` does not reduce a command given as a path: `/usr/bin/codex` is its own family instead of `openai` (runner, priority low; source: `plans/261115-2328-execution-read-door/reports/phase-261117-1351-erd-p01-executor-model.md`, backlog candidate 2)"
status: proposed
priority: P3
area: runner
created: 2026-11-21
---

# Why

Recorded as a `knownDefect` vector in `packages/execution/contracts/executor-model.v1.json`.

# Done when

`familyOf` reduces a path command to its basename before the lookup; the `knownDefect` vector becomes an ordinary passing vector.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
