---
contract: plan-v1
title: "Session start task binding: resolve head names to discussion or plan in opening brief"
status: ready
base: 041b5f64b6fae816f231f17f4eb7fa0f71924878
priority: P1
blockedBy: []
footprint:
  - plans/261120-1547-session-start-task-binding/**
  - src/session-host/head-plan.mjs
  - src/session-host/head-start.mjs
  - test/session-host/head-plan.test.mjs
  - test/session-host/head-start.test.mjs
source:
  - p-l22vozecxg
created: 2026-11-20
---

# Session start task binding: resolve head names to discussion or plan in opening brief

## Outcome
`fgos session start <persona> --name <name>` binds a task-oriented head session (`lead`, `planner`, `shaper`) to its concrete task artifact and injects its target path and first actionable step into the composer opening brief:
1. A `lead` head name resolves to its live plan directory (`plans/<dir>/plan.md`); opening text instructs the lead to inspect the phase table, determine the next eligible wave/phase, and execute it.
2. A `planner` head name resolves to its settled discussion (`docs/discussions/<feature>/DISCUSSION.md`); opening text instructs the planner to read the settled decisions, draft `plans/<dir>/plan.md` and phase files per the plan contract, run `plan-contract-check`, and land via `fgos land --paths`.
3. A `shaper` head name resolves to its feature discussion (`docs/discussions/<feature>/DISCUSSION.md`); opening text instructs the shaper on domain doctrine and iterative shaping of `DISCUSSION.md`.
4. A hand start (`fgos session start <persona> --name <name>`) and a supervisor/secretary automated start of the same name produce identical opening briefs.
5. A task-bound head name that matches zero live tasks is refused by name (`task-not-found` / `plan-not-found` / `discussion-not-found`) rather than launching into an empty session with only generic start rituals. Non-task personas (`secretary`, `supervisor`) remain unconstrained.

## Acceptance criteria
1. `planOfHead` and companion discussion resolver resolve head names (both `<handle>-<dirPrefix>` and `<dirPrefix>`) to their active plan or discussion path:
   - `lead` resolves to `plans/<dir>/plan.md`.
   - `planner` and `shaper` resolve to `docs/discussions/<feature>/DISCUSSION.md`.
2. Starting a head session with a name bound to no existing task artifact rejects with an explicit, categorized refusal (`task-not-found`, `plan-not-found`, or `discussion-not-found`), leaving no placement record and spawning no CLI process.
3. The generated composer opening (`openingText` in `src/session-host/head-start.mjs`) includes the resolved `# Task` section with exact path and first step instructions for `lead`, `planner`, and `shaper`.
4. Hand start and supervisor start for identical persona and name produce byte-for-byte identical opening text (modulo session-specific handoff).
5. Unit and integration tests pass:
   - `node --test test/session-host/head-plan.test.mjs`
   - `node --test test/session-host/head-start.test.mjs`

## Non-goals
- Modifying session confinement, sandbox bwrap policies, or credential leasing.
- Implementing automatic worktree creation or git branching within `session start` (worktree lifecycle remains with the lead/worker skills).
- Changing non-task head personas (`secretary`, `supervisor`), which retain their existing role-specific initialization.
- Migrating discussions to `plans/discussions/` (owned by plan `261120-0625-work-data-model`).

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Task resolver for head names](phase-01-task-resolver.md) | - | src/session-host/head-plan.mjs, test/session-host/head-plan.test.mjs | 1 | ready |
| 2 | [Brief injection and session start parity](phase-02-brief-injection-and-start-parity.md) | 1 | src/session-host/head-start.mjs, test/session-host/head-start.test.mjs | 2 | ready |

## Owner questions
None. The behavior and requirements are settled in backlog row `p-l22vozecxg` and align with established supervisor start rituals.

## Risks and rollback
- Risk: Name collision when resolving partial slugs. Mitigation: Unique prefix check already implemented in `head-plan.mjs` throws `task-ambiguous` on multiple matches.
- Risk: Divergence between hand start and supervisor start. Mitigation: Both paths route through `startHeadSession` / `placeHead` in `head-start.mjs`.
- Rollback: `git revert` of the landing commit cleanly restores previous generic start ritual behavior.
