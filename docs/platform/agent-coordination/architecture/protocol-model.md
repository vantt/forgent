# Coordination Protocol Model

```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/protocol-model.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Planning Sources

Planning need not begin with a predeclared Workflow. Current execution accepts
Unit requests and Workflow execution; the retired CoordinationProtocol is not
another current declared-planning source.

```txt
Agent-led
  objective -> bounded Unit or validated inline Assignment

Declared
  Workflow -> dependent steps and operations -> Unit execution

Domain-assisted
  either source -> registered domain TaskSpecs, skills and validation
```

All sources lower executable intent into the same governed
Assignment/dispatch/Run/RunResult runtime. No planning source is allowed to
create a private execution path.

## Declared Model

```txt
Workflow
  -> step graph
    -> step operations
      -> TaskSpec
      -> Skill(s)
      -> Role
      -> policy hints
```

Current Workflow definitions normalize operations directly
(`src/workflow/definition.mjs:81-109`). No separately shipped Stage Protocol,
CoordinationProtocol or FlowDefinition engine sits between steps and operations.

## Responsibility Split

| Element | Responsibility |
|---|---|
| Workflow/graph | Step dependencies, gates and sequencing boundaries. |
| Step | A declared node in the Workflow graph. |
| Step operation | Semantic action declared by the definition. |
| TaskSpec | Machine-readable inputs, outputs, gates, mutation, and evidence contract. |
| Skill | Adaptive judgment and procedural guidance. |
| Role | Semantic responsibility and capability expectation. |
| Policy hints | Inputs to governed provider/model/tier/mechanism resolution. |

Agent-led callers supply a bounded Unit or validated inline contract. Current
inline fields and normalization are implemented by
`src/runner/dispatch/execution-contract.mjs:180-200,295-340`, rather than left
as an open schema question. Domain-specific validators must be checked against
their registered implementation; this extension model does not imply research
and marketing harnesses already ship.

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

`taskSpecForStep` selects the primary normalized `step.operations` entry (or the
first); `skillForStep` reads `step.skill` separately and falls back to a declared
status skill (`src/workflow/steps.mjs:52-64`). Neither projects both values from
an operation. Compatibility remains a projection, not permission to weaken the
mandatory declared-operation, transition or evidence constraints. The existing
`operationsForStep`/`isLegalStepMove` projections preserve declared legality
(`steps.mjs:44-45,67-85`); they do not restore the retired Work-stage or engine.

This compatibility path remains mandatory for Work-attached declared workflows.
Adding an agent-led path must not weaken or reinterpret it. The current Work
driver resolves the legal normalized operations, preserves their primary default
and refuses an undeclared request (`src/runner/operation-choice.mjs:733-761`);
declared Assignment creation independently requires a legal operation and its
TaskSpec (`src/runner/dispatch/assignment.mjs:328-345`). These are primary
compatibility and legality obligations, not a revival of the retired engine.

The exact normalized contract is defined in
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).

## Standalone Coordination

The former session/FlowDefinition profile is historical, not the Workflow operation contract. See the complete historical snapshot linked above.

## Domain Augmentation

Domains and organizations may add knowledge, doctrine, Skills, declared
Workflow definitions/operations and domain harnesses, planning validators,
resource/isolation analysis, evidence policy, roles, souls and quality criteria.
The foundation introduces a shared extension seam only after at least two unlike
consumers prove the common responsibility.

