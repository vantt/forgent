# Work Integration Boundaries

Document type: Architecture
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-09-09
Canonical for: Work authority and coordination integration boundaries
Related: [Dispatch Control Plane](dispatch-control-plane.md) for the
DispatchRequest/PolicyPatch/DispatchPlan contracts the Work Driver hands off
to once it has derived a target

## Core Invariant

```txt
Work lifecycle is owned only by Work engine verbs.
Coordination returns evidence and recommendations to the Work driver.
```

Work attachment is optional per the
[Agent Coordination Foundation Vision](../vision.md). These boundaries apply
whenever a session references Work; standalone coordination uses the same
dispatch/runtime/evidence core without gaining a delivery lifecycle.

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

## Work Driver Handoff To Dispatch

The Work Driver (the component-outer caller that selects a legal declared
Stage Operation for a Work item) derives a capability or an explicit
executor-id, plus PolicyPatch and provenance, from
`Work → domain/workflow/stage → legal operation → taskSpec/skill metadata`.
It hands that off as a DispatchRequest to the [Dispatch Control
Plane](dispatch-control-plane.md); it must not call `resolveExecutorConfig`
or launch an executor directly. This mirrors the accepted rule above that
Coordination "may not" own dispatch mechanism choice — the same boundary
applies to the Work Driver whether or not a CoordinationSession is involved.

## Isolation

Lifecycle and Git/process isolation are separate. A temporary isolated task does
not automatically become Work. Parallel mutating operations must not share one
physical checkout merely because declared source footprints differ.

Nested immediate-parent branch integration is a candidate invariant, not yet an
accepted cross-path contract.

A CoordinationSession's local runtime state (`.fgos/coordination/`) may
reference domain-provisioned workspace/isolation context for auditability, but
that reference is not itself an isolation mechanism and grants no merge or
Work-transition authority: those stay with the domain harness and Work engine
verbs. Standalone coordination proofs stay read-only until a coding-domain
live proof demonstrates resource-conflict detection, worktree isolation,
merge ownership, recovery, and Work-transition authority under real
concurrent load. See
[ADR-010](../decisions/ADR-010-interactive-headless-parity-and-work-isolation.md).
