---
title: P5 Terminology Sweep and Vocabulary Guard
date: 2026-10-02
summary: System-wide terminology alignment and dead vocabulary guard for Request-to-Run track
---

# P5 Terminology Sweep and Vocabulary Guard

System-wide terminology alignment and dead vocabulary guard for Request-to-Run track.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

## Problem

Following P1–P4 of the Request-to-Run track, the execution core and workflow engine were restructured, retiring the legacy coordination engine and `DemandFacts`. However, documentation, specs, doctrine, and skills across the repository still referenced deprecated symbols (`FlowDefinition`, `CoordinationProtocol`, `DemandFacts`, `readOnlyRedirects`, `coordination session`, `objector`, etc.).

## Decisions

1. **Canonical Terminology Sweep**: Aligned `docs/specs/` (`runner.md`, `distribution.md`, `work-state.md`), `core/skills/` (`capability-matching.md`, `fgos-panel`, `fgos-group-thinking`, `fgos-architecture-panel`), `domains/`, `docs/platform/`, `docs/architect/`, and `docs/how-to/` with the unified vocabulary table:
   - Unit (single task contract, replaces cell/step of plan)
   - Unit run (single execution of a Unit, replaces coordination session)
   - CollaborationPattern (collaboration loop: `solo`, `reviewed`, `panel` + presets, replaces FlowDefinition / CoordinationProtocol / Protocol Pack)
   - Workflow / Workflow run (DAG scheduling, replaces Flow / quy trình / stage on Work)
   - red-team (replaces objector)
   - bind() + 5-tier table (replaces DemandFacts / matcher / prefer)
2. **Component Boundary & Reading Map**:
   - Updated `docs/platform/component-boundary.md` to post-track component architecture (Work, Workflow, Execution Core, Collaboration Patterns, Herdr, Dispatch Confinement, Observe, Packaging), removing the legacy Agent Coordination Engine.
   - Updated `docs/specs/reading-map.md` to point directly to `src/workflow/` and `src/runner/execution/`.
3. **Dead Vocabulary Guard Extension**:
   - Appended Request-to-Run P5 guard test in `test/runner/dead-vocabulary-guard.test.mjs` checking that dead symbols do not appear in `docs/specs`, `core`, `domains`, `AGENTS.md`, or `README.md` outside decision history.
   - Asserted that deleted coordination directories (`src/runner/coordination`, `src/verbs/coordination`, `core/coordination-protocols`, `packages/coordination-state`) remain deleted.

## Verification

- `node --test test/runner/dead-vocabulary-guard.test.mjs`: 10/10 passed (196ms).
- `node --test test/architecture.test.mjs test/cli/fgos-manifest.test.mjs test/setup/checks.test.mjs`: 142/142 passed.
- `node --test test/runner/execution/run.test.mjs test/workflow/*.test.mjs`: 41/41 passed.
- Validated links across all touched markdown files.
