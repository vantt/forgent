# Agent Coordination Concept Relationships

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

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/vocabulary/concept-relationships.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Layer Map

Current execution chain: Workflow step or inline request -> Assignment -> DispatchPlan -> Run -> RunResult -> evidence -> driver decision. Unit/CollaborationPattern and Workflow runtime ownership is described by docs/specs/runner.md. The former session layer map is preserved only in the historical snapshot.

## Runtime Profiles

The retired CoordinationSession profiles are historical. Workflow nodes call the Unit runner; Unit runs use CollaborationPattern. Neither revives FlowDefinition or a CoordinationSession store. Evidence: src/workflow/runner.mjs:419-428; src/runner/execution/run.mjs:532-540.

## Ownership Rules

| Concern | Owner |
|---|---|
| Work status/workflowStep/claim/approval/merge | Work engine verbs |
| Workflow dependency progression | Workflow runner and definition |
| Legal step operation | Workflow definition's operations and selected domain doctrine |
| Legal inline execution | Validated inline contract and execution admission |
| Input/output/evidence contract | TaskSpec or validated inline Assignment contract |
| Adaptive execution judgment | Skill, within hard constraints |
| Role responsibility | Workflow operation, Unit or validated inline contract |
| Dynamic planning proposal | Caller/Skill; no private execution authority |
| Domain-specific task/evidence validation | Registered domain harness; do not imply all proposed domains ship |
| Executor/provider/model/mechanism | Dispatch control plane |
| Runtime attempt | Run |
| Normalized claim and provenance | RunResult |
| Interactive visibility | Herdr |

## Creation Rules

- Intake creates durable Work through the existing Work write door.
- A Workflow operation, Unit or validated inline request creates the applicable
  Assignment; creating an execution request does not create a second Work item.
- Dispatch admits a Run under the Assignment's effective policy and governance.
- Retry/replacement creates another Run, retaining the Assignment and prior
  attempt records; it does not overwrite a failed attempt with a new identity.
- Result normalization belongs to the RunResult owner. Evidence informs the
  consuming driver, not a second lifecycle engine.

These are authority boundaries; the actual current door is Unit/Workflow
execution, not the removed Mission/session planner.

## Critical Non-Equivalences

```txt
Work lifecycle != Unit/Workflow execution completion
Assignment != Run
Run != RunResult
Role != Executor
Skill != TaskSpec
Workflow step operation != Assignment
Herdr state != Evidence
Synthesis != Approval
Job != Assignment/Run/Work
Purpose/--for = compatibility terminology for Capability, not a third route identity
Job != Capability/Executor-id (reserved for a future scheduler, never a dispatch target)
```

## Lifecycle And Isolation

Lifecycle ownership and execution isolation are independent design axes:

```txt
lifecycle design: inherited | independent
isolation design: shared | isolated
```

This two-axis schema is conceptual, not persisted fields accepted by the current
Unit/Assignment validator. A temporary worktree does not alone create Work.
Durable child Work still needs its own Work lifecycle and integration policy;
parallel writes require the owning execution path's isolation checks.

## Coordination Rings

The earlier strategic/activation/flow/execution ring names are a responsibility
model, not verified current entities named Orchestrator, Launcher, Router and
Driver. Current concrete owners are the Workflow runner for sequencing,
Execution Core binding and patterns for Unit execution, dispatch adapters for
attempts, and Work verbs for delivery lifecycle.

Whether to retain a future typed ring architecture remains open; this document
does not assert it is implemented or revive the retired session engine.

