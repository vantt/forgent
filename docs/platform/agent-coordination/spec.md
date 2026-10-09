# Agent Coordination Spec

```txt
Document type: Spec
Audience: Human reviewer, maintainer and implementation agent
Purpose: Route current execution to its code and runner-spec owners, retaining verified boundaries
Design status: Candidate
Implementation: Current execution is owned by CollaborationPattern and the Workflow runner
Provenance: Reframed under owner A15; complete previous document preserved in history/retired-engine
Writer type: Human + agent coauthor
Canonical for: Current-owner navigation and verified boundaries; not a second runtime specification
Use this when: Locating current execution owners or auditing historical claims
Do not use this for: Reinstating CoordinationSession, CoordinationProtocol or FlowDefinition as current implementation
Last reviewed: Pending independent reframe review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
- docs/platform/agent-coordination/history/retired-engine/spec.md
Supersedes: Stale current-state framing only; all old claims are preserved verbatim
Superseded by: Runtime ownership in docs/specs/runner.md
Added in candidate: Retirement framing and current-owner navigation
```

The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`. This page routes current execution to [the runner spec](../../specs/runner.md) and preserves verified boundaries; the [complete former spec](history/retired-engine/spec.md#literal-snapshot) is non-authority history.

## Current Summary

Agent Coordination is the foundation layer for governed, evidence-aware agent
activity. It can run without Work and without a predeclared Workflow or
CoordinationProtocol, while still requiring runtime execution contracts for any
dispatch that triggers work by an agent.

Current execution owners are:

- CollaborationPattern for Unit runs: `src/runner/execution/patterns/index.mjs`.
- The Workflow runner: `src/workflow/runner.mjs`.
- Their current contract: [docs/specs/runner.md](../../specs/runner.md), not the retired CoordinationSession engine.

## Scope

For current execution ownership read [the runner spec](../../specs/runner.md). The complete former scope is preserved in the [retired-engine snapshot](history/retired-engine/spec.md#literal-snapshot); it is not an ownership claim for a current engine.

## Non-Scope

This area does not own:

- Work lifecycle authority, state transitions, merge, or branch lifecycle;
- host command/provider process routing, owned by
  [host-invocation-routing](../host-invocation-routing/README.md);
- installation, activation, release manifest, setup/doctor, or runtime identity,
  owned by [packaging-distribution](../packaging-distribution/README.md);
- project-local account inventory for provider capacity;
- proposal approval by path rename alone.

## Actors And Surfaces

| Surface | Current owner |
|---|---|
| Unit execution | `src/runner/execution/run.mjs` and `src/runner/execution/patterns/index.mjs` |
| Workflow execution | `src/workflow/runner.mjs` |
| Retired coordination CLI | [Historical snapshot](history/retired-engine/spec.md#literal-snapshot), not a current public door |

## Core Entities

The current data and execution owners are [Unit](../../../src/runner/execution/unit.mjs), [CollaborationPattern](../../../src/runner/execution/patterns/index.mjs) and the [Workflow runner](../../../src/workflow/runner.mjs). Retired CoordinationSession and FlowDefinition claims remain verbatim in [history](history/retired-engine/spec.md#literal-snapshot), not this current-state map.

## Operations And Flows

Current sequencing and collaboration belong to the [Workflow runner](../../../src/workflow/runner.mjs) and [CollaborationPattern](../../../src/runner/execution/patterns/index.mjs). The former engine flow/status table is [preserved history](history/retired-engine/spec.md#literal-snapshot), not evidence that those flows are shipped.

## Contracts Owned

The current execution contract is owned by [docs/specs/runner.md](../../specs/runner.md):

| Contract reading | Owner |
|---|---|
| Current execution | [Runner spec](../../specs/runner.md) and its executable owners |
| Former coordination engine | [Verbatim historical spec](history/retired-engine/spec.md#literal-snapshot); not current schema authority |

## Contracts Consumed

| Contract area | Owner | Agent Coordination use |
|---|---|---|
| Work lifecycle and state | Work-state / runner specs | Optional Work integration; Work remains lifecycle authority. |
| Host invocation and provider routing | [host-invocation-routing](../host-invocation-routing/README.md) | Dispatch/executor integration consumes host-owned process routing. |
| Packaging/distribution | [packaging-distribution](../packaging-distribution/README.md) | Runtime identity, activation, setup/doctor, and release packaging are link-only external authority. |
| Confinement Authority | [confinement-authority spec](../../specs/confinement-authority.md) | Execution confinement evidence and attestation may be consumed by dispatch paths. |

## Implementation Status

The coordination CLI/engine was removed in `2180b4e72701bb090288af8fe8021008d9d42079`. Current implementation is inspected through `src/runner/execution/` and `src/workflow/`; the dated implementation/status table is [preserved verbatim](history/retired-engine/spec.md#literal-snapshot).

The former claim-by-claim evidence table is [retained history](history/retired-engine/verification/implementation-alignment.md#literal-snapshot), not proof of current implementation.

## Known Gaps

The former gap/status list is [retained verbatim](history/retired-engine/spec.md#literal-snapshot). It is not a current implementation backlog; use [the current owner](../../specs/runner.md) when assessing present execution.

## Related Files

| Relationship | File |
|---|---|
| area portal | [README.md](README.md) |
| current owner | [runner spec](../../specs/runner.md) |
| complete former spec | [retired-engine snapshot](history/retired-engine/spec.md#literal-snapshot) |
| former implementation alignment | [historical snapshot](history/retired-engine/verification/implementation-alignment.md#literal-snapshot) |
