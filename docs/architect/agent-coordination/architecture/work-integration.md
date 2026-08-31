# Work Integration Boundaries

Document type: Architecture
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: Work authority and coordination integration boundaries

## Core Invariant

```txt
Work lifecycle is owned only by Work engine verbs.
Coordination returns evidence and recommendations to the Work driver.
```

## Coordination May

- read Work requirements, decisions, artifacts, stage, and allowed repository
  scope;
- execute a legal Work Stage Operation through Assignment;
- return RunResults, evidence, review findings, or synthesis;
- inform the driver's choice of an existing Work verb;
- reference child Work and session-local supporting activity.

## Coordination May Not

- directly move Work stage or status;
- infer acceptance or approval from agent consensus;
- claim/return Work outside existing lifecycle verbs;
- merge a branch outside Work merge policy;
- mark Work complete because a Run or session completed;
- duplicate Work stage/status/approval/merge state in another runtime.

## Child Work

Child Work is appropriate when a unit needs independently durable backlog,
claim, acceptance, approval, dependency, branch, merge, or resume behavior.

Current planning tends to materialize every decomposed child as Work. The
candidate AdhocTask distinction and hybrid materialization rules remain under
discussion in [Step 07](../proposals/step-07-coordination-session-adhoc-task.md).

## Isolation

Lifecycle and Git/process isolation are separate. A temporary isolated task does
not automatically become Work. Parallel mutating operations must not share one
physical checkout merely because declared source footprints differ.

Nested immediate-parent branch integration is a candidate invariant, not yet an
accepted cross-path contract.
