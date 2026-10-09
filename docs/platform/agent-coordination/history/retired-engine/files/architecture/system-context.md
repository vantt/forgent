# Historical File: Agent Coordination System Context

```txt
Document type: History
Audience: Human reviewer, maintainer and documentation agent
Purpose: Preserve the complete classified input as non-authority historical evidence
Design status: Candidate
Implementation: Historical snapshot; not current implementation or authority
Provenance: docs/platform/agent-coordination/architecture/system-context.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 3328892b0f4f35ab5ac2ccf184290693c6531ce25ab964a2f81a26388060e90a
Writer type: Documentation maintainer
Canonical for: Historical evidence only; no current authority
Use this when: Auditing original claims or section-level retirement
Do not use this for: Current runtime behaviour, accepted proposals or executable routing
Last reviewed: Pending independent whole-area review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: None; this is an exact historical carrier
Superseded by: Current execution ownership in docs/specs/runner.md
Added in candidate: Historical framing only; literal file bytes are unchanged
```

The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims.

## Literal Snapshot

~~~~text
# Agent Coordination System Context

```txt
Document type: Architecture
Audience: Human reviewer, maintainer and implementation agent
Purpose: Navigate preserved design and historical material without asserting a retired runtime
Design status: Candidate
Implementation: Retired engine material is non-authority history; verified retained units remain unchanged
Provenance: Reframed under owner A15; complete previous document preserved in history/retired-engine
Writer type: Human + agent coauthor
Canonical for: Retained-document navigation only; no current engine authority
Use this when: Locating current execution owners or auditing historical claims
Do not use this for: Reinstating CoordinationSession, CoordinationProtocol or FlowDefinition as current implementation
Last reviewed: Pending independent reframe review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
- docs/platform/agent-coordination/history/retired-engine/architecture/system-context.md
Supersedes: Stale current-state framing only; all old claims are preserved verbatim
Superseded by: Runtime ownership in docs/specs/runner.md
Added in candidate: Retirement framing and current-owner navigation
```

## Purpose

fgOS coordinates semantic work across agents, providers, models, tiers, roles,
and execution mechanisms while preserving one authoritative Work lifecycle and
independently verifiable runtime evidence.

Per the [Agent Coordination Foundation Vision](../vision.md), this is a
domain-neutral foundation. Work, a predeclared Workflow, and a predeclared
Coordination Protocol are optional integration or augmentation layers, not
prerequisites for coordination.

## Component And Runtime Flow

Historical content moved verbatim to the [retired-engine snapshot](../history/retired-engine/architecture/system-context.md#literal-snapshot). The engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; this retained section is not a current runtime description.

The diagram separates execution from delivery lifecycle: a result can inform a
Work driver, but cannot move Work lifecycle state by itself. Dashed paths are
optional structure, augmentation, integration context, or visibility; they do
not create execution authority or terminal truth.

## Context

```txt
Human/operator
  -> objective / Mission / Work intake
  -> lifecycle decisions where Work exists
  -> optional workflow/protocol/domain configuration

fgOS control plane
  -> coordinator / launcher / router / driver
  -> agent-led, declared, or domain-assisted planning
  -> validated semantic execution-contract construction
  -> dispatch governance
  -> Run and RunResult storage

Optional augmentation
  -> declared Workflow or Coordination Protocol
  -> domain knowledge / doctrine / Skills
  -> planning, resource, isolation, and evidence harnesses
  -> organization-specific policy / roles / souls

Execution environment
  -> provider/model/executor/CLI
  -> structured result and artifacts

Visibility
  -> Herdr panes/process observation
```

## Accepted Boundaries

- Agent Coordination is usable without Work and without a predeclared graph.
- Work is the only delivery lifecycle authority.
- Workflow and protocol definitions constrain legal operations when selected.
- Agent-led execution still requires a validated semantic contract and cannot
  bypass authority, budget, dispatch, mutation, or evidence policy.
- Planning may be agent-led, declared, domain-assisted, or composed.
- Assignment expresses semantic intent.
- Dispatch selects governed execution infrastructure.
- Run records one attempt.
- RunResult normalizes claims, evidence, artifacts, and failure.
- Herdr is visibility, not truth or evidence.
- Job is reserved for a future queue/scheduler and is absent from V1.
- Domain-specific problem-solving rules augment the foundation rather than
  becoming universal core policy.

## Runtime Profiles

The implemented baseline is Work-attached Team Dispatch plus a read-only
mission-lite prototype. The accepted target direction supports:

```txt
Standalone, agent-led
  objective -> dynamic semantic tasks/Assignments -> dispatch/runtime

Standalone, declared
  objective -> optional Coordination Protocol -> tasks/Assignments

Work-attached
  Work Stage Operation -> optional CoordinationSession -> tasks/Assignments

Domain-assisted
  any profile -> domain context/plan/resource/evidence augmentation
```

CoordinationSession's identity, persistence, one-way Assignment-membership
boundary, and the shared `FlowDefinition` graph/operation/policy IR are
accepted per [ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md)
and [ADR-009](../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md);
their schemas are in the [CoordinationSession](../contracts/coordination-session.md)
and [FlowDefinition](../contracts/flow-definition.md) contracts. The
CoordinationSession runtime itself, the AdhocTask graph, and the exact dynamic
execution-contract shape remain under implementation in the Step 08 roadmap
and, for AdhocTask specifically, under discussion in
[Step 07](../proposals/step-07-coordination-session-adhoc-task.md). Optional
standalone protocol packages beyond the accepted FlowDefinition/profile shape,
and full agent-led adoption, remain under discussion in
[Step 08](../proposals/step-08-standalone-coordination-protocols.md).

## Trust Boundaries

- Agent prose is untrusted until normalized and checked against TaskSpec and
  evidence policy, or against the equivalent validated inline execution
  contract when no TaskSpec is selected.
- Executor output cannot grant Work lifecycle authority.
- Provider/model selection must pass dispatch governance.
- Coordinator prose cannot grant itself mutation, budget, privacy, or dispatch
  authority.
- Terminal/process visibility cannot establish semantic completion.
- Synthesis cannot strengthen weak evidence by repetition or consensus.
~~~~
