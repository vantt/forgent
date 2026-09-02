# Dispatch Control Plane

Document type: Architecture
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-09-01
Canonical for: dispatch responsibility and governance boundaries

## Responsibility

The dispatch control plane converts one semantic Assignment into one governed
execution attempt. It resolves target, capability, provider/model/tier,
soul/profile, mechanism, adapter, policy checks, result channel, and runtime
metadata.

It does not choose the Work lifecycle transition or invent a semantic operation.

## Flow

```txt
Assignment
  -> policy resolver
  -> executor/target resolution
  -> governance and egress checks
  -> mechanism/adapter selection
  -> Run creation and launch
  -> settlement/result collection
  -> RunResult normalization
```

## Governance

- Executor identifiers must resolve through configured/approved targets.
- Cross-provider/model/tier dispatch must remain explicit and auditable.
- Capability, role, soul/profile, privacy, and context-egress requirements must
  be resolved through policy rather than hard-wired to a Workflow.
- CLI spawn is an execution mechanism, not a governance bypass.
- Read-only/mutating policy must be checked before launch.
- Result and artifact locations must be bounded and attributable to the Run.
- Direct executor calls from protocol, Skill, coordinator, or domain-harness
  prose are invalid.

## Separation Of Concerns

```txt
planner     proposes a declared or dynamic semantic action
policy      validates legality, authority, bounds, and selected domain rules
builder     creates Assignment
resolver    produces governed DispatchPlan
dispatcher  launches and observes Run
normalizer  creates RunResult
caller      consumes evidence and invokes authorized lifecycle behavior, if any
```

Planning may be agent-led, declared, or domain-assisted. Dispatch does not care
which source proposed the validated Assignment and must not create separate
runtime paths for them. A CoordinationSession or a declared
`CoordinationProtocol` FlowDefinition (see
[ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md),
[ADR-009](../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md))
is one more caller of this same flow: a Cohort Planner may emit actor policy
inputs, but it resolves and dispatches exactly one Assignment at a time
through this control plane — it may not spawn an executor directly or read
sibling Assignment state.

The detailed redesign source remains a
[proposal](../proposals/dispatch-control-plane-redesign.md) until its unresolved
target-state sections are reconciled with implementation.
