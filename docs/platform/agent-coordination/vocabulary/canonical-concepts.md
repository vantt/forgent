# Canonical Agent Coordination Concepts

```txt
Document type: Vocabulary
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

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/vocabulary/canonical-concepts.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Lifecycle And Objective Layer

### Work

A durable, human-manageable delivery item. Work is the sole authority for its
status, workflow stage, claim/return ownership, acceptance, approval, durable
branch, and merge lifecycle.

Work may reference coordination sessions and their evidence. Session, Task,
Assignment, Run, RunResult, Mission, or Herdr state cannot mutate Work lifecycle
except by invoking authorized Work engine verbs.

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

The current compatibility path keeps `step.skill` and `step.taskSpec` as the
primary operation projection.

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

### Assignment

An immutable semantic request to perform one operation for a caller/context. It
contains objective, inputs, constraints, expected outputs, role, operation, and
policy context. It does not own retries or lifecycle progress.

An Assignment may originate from a declared Stage Operation/TaskSpec or from an
agent-proposed inline execution contract that passes foundation and selected
domain validation. Both paths use the same dispatch and runtime governance.

## Dispatch And Execution Layer

### Capability

An abstract behavior promise, resolved through `runner.capabilities.<capability>`
(`prefer`/`overrides`) to a registered Executor's `for[]` declaration. Together
with Executor-id, Capability is one of exactly two target identities the
Dispatch And Execution Engine resolves against — see the
[Dispatch Control Plane](../architecture/dispatch-control-plane.md)'s Routing
Identities section. `purpose` and the `--for` CLI flag are compatibility
terminology for Capability, not a separate concept.

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

## Cognitive And Proposed Vocabulary

### Persona

A behavioral viewpoint supplied to a Unit template or advisory seat, not a persisted SessionActor identity. The registered advisory framing/explanation templates use persona: advisor (core/workflows/architecture-advisory.yaml:14-17,71-74).

### Stance

A temporary argumentative viewpoint. This is cognitive vocabulary, not an implemented session-state entity or a new routing identity.

### TaskCandidate

A proposed piece of bounded work considered during planning. This remains design vocabulary; it does not create a persisted task or Work lifecycle record by itself.

### AgentMessage

A proposed structured communication envelope. This is an engine-independent design target, not proof that the runtime implements a message bus or the retired session protocol.

### Synthesis

A recommendation that preserves alternatives, evidence and attributed dissent. The registered architecture-advisory synthesis template specifies the RAW JSON packet and independent reviewer/red-team checks (core/workflows/architecture-advisory.yaml:43-64).
