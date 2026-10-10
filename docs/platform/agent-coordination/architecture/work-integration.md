# Work Integration Boundaries

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

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/work-integration.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Implementation And Design Status

The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.

| Section | Status | Evidence / limit |
|---|---|---|
| Core Invariant | Current lifecycle boundary | Work records `workflowStep`; `stage` is rejected by src/state/work.mjs:455-467. The Workflow runner drives Work around execution; dispatch/execution do not own its lifecycle. |
| Execution May | Current handoff and result boundary | src/workflow/runner.mjs:419-428 invokes execution and consumes its result; src/runner/dispatch/run-result.mjs:350-385 owns result normalization. |
| Execution May Not | Current authority boundary | Execution does not replace Work lifecycle/approval/merge verbs; work.stage is not a valid current field (src/state/work.mjs:455-467). |
| Child Work | Delivery-lifecycle decision, not automatic dispatch side effect | Child Work uses the Work parent edge; an execution attempt alone does not create a backlog item. |
| Work Driver Handoff To Dispatch | Current policy implementation; proposed typed request name distinguished | PolicyPatch is used by src/runner/dispatch/assignment-policy.mjs:172-181 and execution-contract.mjs:229-235. `DispatchRequest` is a design name, not a shipped normalizer/type. Executor configuration resolution belongs inside dispatch. |
| Isolation | Mixed implementation and proposal; no blanket implementation claim | src/workflow/runner.mjs:385-391 (createWorkflowWorktree per Unit), :173-176 (cleanup keeps failed worktrees); assignment-runner.mjs:497 worktree mismatch refusal |

## Core Invariant

```txt
Work lifecycle is owned only by Work engine verbs.
Execution returns evidence and recommendations to the Work driver.
```

Work attachment is optional per the
[Agent Coordination Foundation Vision](../vision.md). These boundaries apply
when a Unit or Workflow execution references Work. Supporting execution without
a Work item does not acquire a separate delivery lifecycle.

## Execution May

- read Work requirements, decisions, artifacts, `workflowStep`, and allowed
  repository scope;
- execute a Workflow step operation through the applicable Assignment/Unit door;
- return RunResults, evidence, review findings, or synthesis;
- inform the driver's choice of an existing Work verb;
- reference child Work and supporting execution without inventing session-local
  lifecycle entities.

## Execution May Not

- directly replace Work `workflowStep` or status outside its owning verbs;
- infer acceptance or approval from agent consensus;
- claim/return Work outside existing lifecycle verbs;
- merge a branch outside Work merge policy;
- mark Work complete merely because a Run or Unit completed;
- duplicate Work step/status/approval/merge state in another runtime.

## Child Work

Child Work is appropriate when a unit needs independently durable backlog,
claim, acceptance, approval, dependency, branch, merge, or resume behavior.

## Work Driver Handoff To Dispatch

The Work driver supplies the task target/capability, policy inputs and provenance
to the governed execution door. It does not call `resolveExecutorConfig` to
bypass dispatch planning, governance or confinement. Dispatch resolves execution
configuration; the Work driver retains the subsequent lifecycle decision.

The current policy resolver accepts caller `policyInputs` (with its existing
`cliOverride` alias) and records effective-policy provenance. This is distinct
from the proposed `DispatchRequest` schema: a design request name must not be
treated as an exported normalizer or an additional Work write door.

See the [area portal](../README.md) and [runner spec](../../../specs/runner.md).

## Isolation

Lifecycle and Git/process isolation are separate. A temporary isolated task does
not automatically become Work. Parallel mutating operations must not share one
physical checkout merely because declared source footprints differ.

Nested immediate-parent branch integration is a candidate invariant, not yet an
accepted cross-path contract.

