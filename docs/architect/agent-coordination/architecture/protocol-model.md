# Coordination Protocol Model

Document type: Architecture
Design status: Accepted
Implementation: Implemented
Last reviewed: 2026-09-01
Canonical for: planning sources and graph, protocol, operation, TaskSpec, Skill, and Role responsibilities

## Planning Sources

Per the [Agent Coordination Foundation Vision](../vision.md), a predeclared
Workflow or Coordination Protocol is optional. Coordination may obtain planning
and constraints from one or more composable sources:

```txt
Agent-led
  objective -> coordinator reasoning -> dynamic semantic task/Assignment

Declared
  Workflow / Coordination Protocol -> legal graph and operations

Domain-assisted
  agent or declared plan -> domain enrichment / validation / resource policy
```

All sources lower executable intent into the same governed
Assignment/dispatch/Run/RunResult runtime. No planning source is allowed to
create a private execution path.

## Declared Model

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

The same hard-and-soft shape may be used by a standalone Coordination Protocol
when repeatability, auditability, or reusable doctrine justifies a predeclared
graph. A session is not required to select this model.

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

For agent-led planning, the coordinator supplies adaptive planning and proposes
a dynamic execution contract. Foundation policy and any selected domain harness
validate its objective, bounds, mutation, evidence, capability, privacy, and
budget fields before Assignment construction. The exact inline contract schema
remains an open contract-design question.

## Hard And Soft Coordination

When a declared model is selected, its graph and TaskSpec are hard constraints.
Skill prose supplies flexibility inside those constraints. The driver chooses a
legal operation using current state and doctrine; the dispatcher chooses
execution infrastructure.

When agent-led planning is selected, the validated runtime execution contract,
foundation policy, budgets, authority, mutation rules, and evidence expectations
are the hard constraints. The task graph may be trivial or created dynamically.
Absence of a predeclared graph never means absence of hard runtime boundaries.

No layer may absorb all responsibilities:

- Skill prose cannot authorize illegal transitions or evidence-free success.
- Coordinator prose cannot bypass dispatch or grant its own authority/budget.
- TaskSpec should not encode every reasoning move.
- Dispatcher must not select business operations.
- Driver must not bypass dispatch governance.
- Domain harnesses may validate or enrich a plan but must not fork the execution
  runtime or become hidden lifecycle authorities.

## Compatibility

`stage.skill` and `stage.taskSpec` remain the primary-operation compatibility
path. Multiple `stage.operations` extend the stage without regressing consumers
that only understand the primary operation.

This compatibility path remains mandatory for Work-attached declared workflows.
Adding an agent-led path must not weaken or reinterpret it.

The exact normalized contract is defined in
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).

## Standalone Coordination

Standalone coordination may run agent-led without a protocol definition or may
select an optional reusable Coordination Protocol. When a declared standalone
protocol uses a graph, it uses the shared, versioned `FlowDefinition`
intermediate representation typed with the `CoordinationProtocol` profile,
whose graph nodes are Phases — a neutral primitive shared with, but distinct
from, Stage. `Workflow` and `CoordinationProtocol` are typed profiles of the
same `FlowDefinition` kernel (graph, roles, actors, operations, policy); they
do not share Stage/Phase identity itself. This resolves the representation
question in favor of option 2 from the discussion record: extract a common
graph/operation definition and keep Work Stage and Session Phase as distinct,
profile-typed public names. See
[ADR-009](../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md)
and the [FlowDefinition Contract](../contracts/flow-definition.md) for the
exact schema.

That representation decision applies only to declared protocols. It does not
make Stage or Phase mandatory for an agent-led session — agent-led sessions
still build validated inline execution contracts without selecting a
FlowDefinition — and it does not import Work lifecycle semantics into
standalone coordination: a `CoordinationProtocol` FlowDefinition is rejected
at validation if it declares `profile.work`, `baseStepMap`, a mandatory
`taskSpec`, or `result.kind: gate-verdict`.

## Domain Augmentation

Domains and organizations may add knowledge, doctrine, Skills, declared
protocols, planning validators, resource/isolation analysis, evidence policy,
roles, souls, and quality criteria. The foundation introduces a shared extension
seam only after at least two unlike consumers prove the common responsibility.
