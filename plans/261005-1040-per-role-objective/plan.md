---
title: "Each role of a Unit run gets its own task"
status: in-progress
priority: P1
created: 2026-10-05
---

# Each role of a Unit run gets its own task

## Problem (seen live, 2026-10-04 dogfood, and in the opus design review finding 5)

`dispatchBound` (`src/runner/execution/run.mjs`) builds every assignment from the outer unit, so all roles of one
Unit run get the same objective: the producer's task. The xai reviewer in the mdview run tried to perform the edit,
hit a read-only error and reported `blocked`; the Claude red-team only worked because it guessed its job from the
`Role:` label. Same for the panel synthesizer ("silently generate independent ideas"). Also: `reviewed` passes the
previous round's `findings` to the producer, `runRole` ignores them, so round 2 never says what to fix.

## Design (one generic runner change, role meaning stays in the pattern)

1. Runner: `runRole` hands its `unit` argument (already used by bind and commit) to `dispatchBound`, which uses that
   unit's `objective`. A pattern that passes the same unit changes nothing.
2. Pattern layer: `src/runner/execution/patterns/role-tasks.mjs` holds the role task statements as DATA
   (`DEFAULT_ROLE_TASKS`: synthesizer, reviewer, red-team) and `roleUnit(unit, {role, kind, params, findings})`,
   which returns the unit with its objective wrapped by the role's task, `{objective}` standing for the original.
   Overridable per call through `params.roleTasks` (so a preset or a Workflow can replace the text). No role names
   or prose in the runner.
3. `panel`: synthesizer gets its task. `reviewed`: reviewer and red-team get theirs and the producer's report as an
   input (the contextRefs mechanism); the producer's round 2 objective lists the previous findings.

## Not in this plan
Workflow YAML passing `params` through to the pattern (opus finding 3), anonymized inputs, loops.

## Acceptance
- Unit tests for `roleUnit`; pattern tests; an integration test reading the assignments of a panel run.
- A live reviewed run in mdview whose reviewer reviews instead of redoing the work.
- Full `npm test` green.
