---
id: p-w7ycay7zhm
title: "Mount the default `runner.executor` as an invocation so the runner has one in-memory executor shape (runner, priority medium; source: `plans/261115-2328-execution-read-door/reports/phase-261117-1356-erd-p15-legacy-invocation.md`)"
status: proposed
priority: P2
area: runner-execution
created: 2026-11-21
---

# Why

After S5 phase 15 the loaded config refuses flat `command`, `args`, `adapter` and `env` on `executors.<id>`, but the mounted `runner.executor` still carries entry-level `command`/`args`/`adapter`/`env`, read by resolve, bind, assignment-runner, mechanism, plan, policies and executor-governance.

# Done when

The mounted default executor is an invocation like every other; the six readers take invocation fields only; no entry-level `command`, `args`, `adapter` or `env` remains in the in-memory shape, and the old path is deleted in the same change.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
