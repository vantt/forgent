# Dispatch Control Plane

Document type: Architecture
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: dispatch responsibility and governance boundaries

## Responsibility

The dispatch control plane converts one semantic Assignment into one governed
execution attempt. It resolves target, provider/model/tier, mechanism, adapter,
policy checks, result channel, and runtime metadata.

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
- CLI spawn is an execution mechanism, not a governance bypass.
- Read-only/mutating policy must be checked before launch.
- Result and artifact locations must be bounded and attributable to the Run.
- Direct executor calls from protocol prose are invalid.

## Separation Of Concerns

```txt
driver      chooses legal semantic operation
builder     creates Assignment
resolver    produces governed DispatchPlan
dispatcher  launches and observes Run
normalizer  creates RunResult
driver      consumes evidence and invokes legal lifecycle behavior
```

The detailed redesign source remains a
[proposal](../proposals/dispatch-control-plane-redesign.md) until its unresolved
target-state sections are reconciled with implementation.
