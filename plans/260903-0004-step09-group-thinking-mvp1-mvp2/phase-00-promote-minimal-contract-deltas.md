# Phase 00 - Promote Minimal Contract Deltas

## Objective

Move only the Step 09 MVP1/MVP2 decisions that implementation needs from
discussion proposal into accepted architecture/contracts before source runtime
changes start.

## Requirements

- **R1 Accepted contract authority.** Update accepted docs to define the
  `standalone-master-coordination-loop` fixture intent, driver-authorized
  operation semantics, recheck-vs-retry, disposition event semantics, artifact
  reference stance, and bounds relationship. The Step 09 proposal remains
  discussion/history.
- **R2 Prompt boundary.** Record that the Master Coordination Prompt is a manual
  implementation coordinator and proof source only. Runtime must not load
  playbook prose or treat it as authority.
- **R3 Component authority.** Ensure the component boundary map still places
  FlowDefinition validation in definitions, session events/materialization in
  coordination, Assignment/Run/RunResult in dispatch/evidence, and
  Work/git/mutation in Coding/Work authorities.
- **R4 No invariant reopening.** Do not reopen evidence immutability,
  governance-final dispatch, budget caps, mutation exclusivity, or Step 08
  isolation proof.

## Files

Expected docs:

- `docs/architect/agent-coordination/contracts/flow-definition.md`
- `docs/architect/agent-coordination/contracts/coordination-session.md`
- `docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md`
- `docs/architect/architecture-intent.md`
- `docs/architect/proposals/step-09-group-thinking-substrate.md`
- `docs/architect/proposals/component-authority-boundary-map.md`

Do not modify source runtime, schema files, test files, or fixtures in this
phase unless a doc link/check tool requires mechanical metadata only.

## Tests First

Docs-only checks:

```bash
git diff --check -- \
  docs/architect/agent-coordination/contracts/flow-definition.md \
  docs/architect/agent-coordination/contracts/coordination-session.md \
  docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md \
  docs/architect/architecture-intent.md \
  docs/architect/proposals/step-09-group-thinking-substrate.md \
  docs/architect/proposals/component-authority-boundary-map.md
```

Run a relative-link check for touched markdown files. `npm test` is not required
for a docs-only cell unless implementation files are touched.

## Proofs And Exit

- Accepted docs contain the minimal semantics needed by Phases 01-03.
- Step 09 proposal still says Discussion and does not become accepted design by
  accident.
- No source/runtime/schema diff exists in this phase.
- Links render through MDView for long docs touched.

## Risks / Rollback

Risk: smuggling too much future group-thinking scope into accepted contracts.
Keep Phase 00 to MVP1/MVP2 only. Defer `addSessionEdge`, visibility windows,
global speech-act registry, deliberation memory, and broad aggregation rules.

