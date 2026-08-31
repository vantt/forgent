# Coordination Protocol Model

Document type: Architecture
Design status: Accepted
Implementation: Implemented
Last reviewed: 2026-08-31
Canonical for: graph, protocol, operation, TaskSpec, Skill, and Role responsibilities

## Model

```txt
Workflow
  -> Stage graph
    -> Stage Protocol
      -> Stage Operation
        -> TaskSpec
        -> Skill(s)
        -> Role
        -> policy hints
```

## Responsibility Split

| Element | Responsibility |
|---|---|
| Workflow/graph | Legal stage transitions and structural boundaries. |
| Stage Protocol | Coordination doctrine active in one stage. |
| Stage Operation | Legal semantic action selectable by the driver. |
| TaskSpec | Machine-readable inputs, outputs, gates, mutation, and evidence contract. |
| Skill | Adaptive judgment and procedural guidance. |
| Role | Semantic responsibility and capability expectation. |
| Policy hints | Inputs to governed provider/model/tier/mechanism resolution. |

## Hard And Soft Coordination

The graph and TaskSpec are hard constraints. Skill prose supplies flexibility
inside those constraints. The driver chooses a legal operation using current
state and doctrine; the dispatcher chooses execution infrastructure.

No layer may absorb all responsibilities:

- Skill prose cannot authorize illegal transitions or evidence-free success.
- TaskSpec should not encode every reasoning move.
- Dispatcher must not select business operations.
- Driver must not bypass dispatch governance.

## Compatibility

`stage.skill` and `stage.taskSpec` remain the primary-operation compatibility
path. Multiple `stage.operations` extend the stage without regressing consumers
that only understand the primary operation.

The exact normalized contract is defined in
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).

## Standalone Protocols

Whether standalone collaboration reuses Stage directly or introduces a neutral
Phase abstraction is unresolved. The accepted Work-attached model must not be
generalized by importing Work lifecycle semantics into standalone sessions.
