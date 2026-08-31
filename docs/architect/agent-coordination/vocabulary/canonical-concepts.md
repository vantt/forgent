# Canonical Agent Coordination Concepts

Document type: Vocabulary
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: agent-coordination terminology

## Lifecycle And Objective Layer

### Work

A durable, human-manageable delivery item. Work is the sole authority for its
status, workflow stage, claim/return ownership, acceptance, approval, durable
branch, and merge lifecycle.

Work may reference coordination sessions and their evidence. Session, Task,
Assignment, Run, RunResult, Mission, or Herdr state cannot mutate Work lifecycle
except by invoking authorized Work engine verbs.

Do not confuse Work with AdhocTask, Assignment, or Mission.

### Mission

An optional lightweight objective envelope for related standalone coordination
sessions. Mission does not replace Work and owns no delivery lifecycle.

Design status: Proposed. A one-off session must not require a Mission.

## Protocol Definition Layer

### Workflow

A graph describing the legal lifecycle stages and transitions for a Work type.
Workflow is definition/configuration, not a runtime attempt.

### Stage

A named node in a Workflow. A Stage identifies the current Work lifecycle
position and exposes a Stage Protocol and legal Stage Operations.

### Stage Protocol

The coordination doctrine active in one Stage: owner role, legal operations,
handoff expectations, gates, and evidence expectations.

### Stage Operation

A legal semantic action available in a Stage. An operation references TaskSpec,
Skill(s), Role, and policy hints. It is a choice in protocol definition, not an
Assignment or Run.

The current compatibility path keeps `stage.skill` and `stage.taskSpec` as the
primary operation projection.

### Coordination Protocol

An optional reusable graph and doctrine for one class of collaboration, such as
consult, research, leader-worker, review, brainstorm, or debate. When selected,
it declares legal phases, operations, communication edges, budgets, and
synthesis requirements.

A CoordinationSession does not require a Coordination Protocol. Agent-led
planning may create runtime tasks and execution contracts dynamically under
foundation policy.

Design status: Proposed for the generalized standalone runtime.

### TaskSpec

A reusable machine-readable execution contract defining required inputs,
expected outputs, gates, mutation/evidence expectations, and completion
criteria for an operation.

A registered TaskSpec is optional for agent-led coordination. Every executable
request still requires equivalent validated semantic fields in its Assignment
contract. The exact inline representation remains under design.

### Skill

Adaptive prose and procedural guidance used by an agent to perform an operation
with domain judgment. Skill prose may guide choices inside hard contracts; it
cannot override graph, TaskSpec, governance, or lifecycle rules.

### Role

A semantic responsibility in a protocol, such as implementer, researcher,
reviewer, advisor, helper, coordinator, or synthesizer. Role is not an executor,
provider, model, terminal, or process.

## Coordination Runtime Layer

### CoordinationSession

One bounded coordination invocation, with context, participants, budgets,
events, runtime tasks/Assignments when needed, and aggregate outcome. It may be
Work-attached or standalone, agent-led or protocol-led. A task graph may be
trivial, dynamic, or declared.

It owns collaboration progress only, never Work lifecycle.

Design status: Proposed.

### TaskCandidate

A planner-proposed node before graph validation and materialization. Candidate
properties may independently describe inherited/independent lifecycle and
shared/isolated execution.

TaskCandidate is an optional intermediate representation, not a required input
for one-shot or incrementally planned coordination.

Design status: Proposed.

### AdhocTask

A session-local unit of intent, dependency, ownership, progress, and evidence
roll-up. It is suitable for research fan-out, consultation, debate branches,
review passes, synthesis, or bounded implementation returning to one parent.

AdhocTask is not Assignment. One AdhocTask may issue multiple Assignments, and
one Assignment may have multiple Runs.

Design status: Proposed.

### Assignment

An immutable semantic request to perform one operation for a caller/context. It
contains objective, inputs, constraints, expected outputs, role, operation, and
policy context. It does not own retries or lifecycle progress.

An Assignment may originate from a declared Stage Operation/TaskSpec or from an
agent-proposed inline execution contract that passes foundation and selected
domain validation. Both paths use the same dispatch and runtime governance.

### AgentMessage

A structured semantic communication between roles, such as task, clarification,
result, blocker, escalation, critique, or synthesis input. A message that
triggers execution must route through Assignment and dispatch governance.

Design status: Proposed beyond the current V1 result exchange.

### Synthesis

An evidence-linked aggregate conclusion from accepted task/results. Synthesis
must preserve disagreement, unsupported claims, failures, and unknowns. It is
not consensus, approval, or a Work transition.

Design status: Proposed.

## Dispatch And Execution Layer

### DispatchPlan

The resolved execution decision for a selected Assignment: executor target,
provider/model/tier, mechanism, policy/governance decisions, adapter, and result
handling.

### Dispatcher

The component that resolves and launches execution infrastructure for an
Assignment. It must not choose Work lifecycle transitions or treat terminal
visibility as completion evidence.

### Executor

A configured target capable of performing an Assignment, such as a provider,
agent CLI, model profile, or governed adapter target. Executor is not Role.

### Run

One concrete runtime attempt to execute an Assignment through an approved
DispatchPlan and mechanism. Retries create additional Runs; they do not replace
the Assignment or erase prior evidence.

### RunResult

The normalized result for one Run: status/claim, confidence, evidence refs,
artifacts, verification details, failure information, and provenance.

RunResult is not Work completion and cannot authorize lifecycle mutation.

## Evidence And Visibility Layer

### Evidence

Independently inspectable support for a result claim, such as structured worker
output, post-run file state, git delta, command output, test result, or artifact
hash. Evidence strength is operation-specific.

### Artifact

A persisted output referenced by Assignment, RunResult, task, or synthesis.
Artifact existence alone does not establish correctness or freshness.

### Herdr

Interactive execution visibility over panes/processes. Herdr may show activity,
but pane text, quietness, or process appearance is not truth or evidence.

### Job

A future-reserved queue/scheduler concept. Job is not used in Team Dispatch V1
and must not be introduced as an alias for Assignment, Run, or AdhocTask.
