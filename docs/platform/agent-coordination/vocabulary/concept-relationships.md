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
| Work status/stage/claim/approval/merge | Work engine verbs |
| Legal lifecycle transition | Workflow graph and Work driver |
| Legal operation in a stage/phase | Active protocol graph |
| Legal dynamic execution | Foundation policy plus validated inline execution contract |
| Input/output/evidence contract | TaskSpec or validated inline Assignment contract |
| Adaptive execution judgment | Skill, within hard constraints |
| Role responsibility | Declared protocol or validated dynamic execution contract |
| Dynamic planning proposal | Coordinator agent/Skill, within policy and budget |
| Domain plan/resource/evidence validation | Selected domain/organization harness |
| Executor/provider/model/mechanism | Dispatch control plane |
| Runtime attempt | Run |
| Normalized claim and provenance | RunResult |
| Interactive visibility | Herdr |

## Creation Rules

## Critical Non-Equivalences

```txt
Work != Mission
Work != AdhocTask
AdhocTask != Assignment
Assignment != Run
Run != RunResult
Role != Executor
Skill != TaskSpec
Stage Operation != Assignment
Coordination Protocol != CoordinationSession requirement
Herdr state != Evidence
Synthesis != Approval
Job != Assignment/Run/Task
Capability != Purpose (purpose/--for is a compatibility alias for Capability, not a third routing identity)
Job != Capability/Executor-id (Job is unused, reserved for a future scheduler; it is never a dispatch target)
```

## Lifecycle And Isolation

Lifecycle ownership and execution isolation are independent:

```txt
lifecycle: inherited | independent
isolation: shared | isolated
```

An inherited isolated task may use an ephemeral branch/worktree without
becoming Work. Independent child Work uses Work-owned durable isolation and
merge behavior.

## Coordination Rings

```txt
Strategic ring  = Orchestrator
Activation ring = Launcher
Flow ring       = Router + Driver
Execution ring  = Dispatcher
```

The rings are responsibility boundaries, not necessarily one process or module
per ring.

