---
id: coding-footprint-tracing
kind: procedure
owner: coding
scope: domain
mode: append
specificity: 30
title: Coding Footprint Tracing
description: A coding plan's footprint is traced, not guessed — wiring set of a new entry point, references of a changed symbol, generated files regenerated
lifecycle: live
valid_from: 2026-11-27
when:
  domain:
    - coding
---

# Coding footprint tracing

The planner builds the footprint by tracing, not by reading. This unit lists no files; the data is already in the repo.

- A new verb, route, flag or record kind brings its whole wiring set: copy the file set of the nearest earlier commit that added the same kind of entry point (find it with `git log -S`), then add what the drift checks name.
- A changed, moved or deleted symbol or file brings every reference that `rg` and the impact tool return (callers, tests, doc links).
- A generated file is named as a hot file and regenerated with the repo's build command, never hand-edited.
- At run time, widening by a file that serves the plan's own acceptance goes through the widen door (`fgos supervisor widen`); it is a direction, not an owner question.

Why: `plans/discussions/ds-que32ftgg6-ready-plan-runs-unattended/DISCUSSION.md` §6 (U1). The validator judges trace completeness.
