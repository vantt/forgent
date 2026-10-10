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

A durable, human-manageable delivery item. Work owns its status, claim/return,
acceptance, approval and branch/merge lifecycle through the existing Work verbs.
Its recorded Workflow position is `workflowStep`, not the retired `stage`
field (`src/state/work.mjs:455-467`). Execution evidence may inform a Work
decision; a Run, Unit or Workflow completion does not itself confer approval.

## Protocol Definition Layer

### Workflow

A definition of dependent steps, operations, gates and execution templates.
The definition is not a concrete attempt; Workflow runs are separate runtime
records. The Workflow runner sequences these steps rather than a coordination
protocol or a second Stage Protocol engine.

### Stage

Legacy name for a Workflow step in earlier documents. Current Work records
`workflowStep`; the definition and operation APIs use steps. No current
`work.stage` field or separate Stage runtime is implied.

### Stage Protocol

Historical name for the old stage-level coordination doctrine. Current
operations, handoffs and gates belong to the Workflow definition and its
domain doctrine; there is no additional shipped Stage Protocol layer.

### Stage Operation

Compatibility term for a Workflow step operation. Current normalized operations
carry `id`, `taskSpec`, optional `role`, `skills`, `policy` and dispatch metadata
(`src/workflow/definition.mjs:81-109`). TaskSpec projections are derived from
operations; `step.taskSpec` is not the current primary-operation field.

### TaskSpec

A reusable machine-readable execution contract defining required inputs,
expected outputs, gates, mutation/evidence expectations, and completion
criteria for an operation.

A registered TaskSpec is optional when the request supplies a validated inline
contract. Inline field validation and normalization are implemented in
`src/runner/dispatch/execution-contract.mjs:180-200,295-340`; the representation
is not merely an unresolved design. Both paths retain execution governance.

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

An Assignment may originate from a Workflow operation/TaskSpec, a validated
inline contract, or the current Unit-run door. These are provenance kinds,
not three private dispatch engines.

## Dispatch And Execution Layer

### Capability

An abstract behavior promise. The legacy dispatch capability catalog supports
`prefer` and `rigor`, with executor `for[]` declarations; capability `overrides`
is rejected (`src/runner/dispatch/config.mjs:1007-1017,1223-1235`).
Capability and executor-id are the conceptual target identities described in
[Dispatch Control Plane](../architecture/dispatch-control-plane.md).
`purpose` and `--for` are its compatibility terminology. Execution Core Unit
requests instead bind through `src/runner/execution/bind.mjs`; catalog details
must not be inferred to be identical across those two entry paths.

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

Reserved vocabulary for a possible future scheduler, not a third dispatch
target or an already implemented queue entity. A Run is one concrete attempt;
it is not a Job. See the retained
[dispatch-job reservation](../decisions/ADR-004-reserve-job.md).

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
