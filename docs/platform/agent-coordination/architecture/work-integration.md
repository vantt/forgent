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
| Core Invariant | Mixed implementation and proposal; no blanket implementation claim | docs/specs/runner.md:3072-3081 (0049: Work has no stage, A4 import ban); git grep 'from .*state/' in src/runner/dispatch src/runner/execution -> no hits; src/state/work.mjs:455-457 |
| Coordination May | Mixed implementation and proposal; no blanket implementation claim | src/workflow/runner.mjs:419-428 (runUnit returns result to Workflow runner, which drives Work); src/runner/dispatch/run-result.mjs:350-385 |
| Coordination May Not | Mixed implementation and proposal; no blanket implementation claim | src/runner/dispatch and src/runner/execution import nothing from src/state (A4, runner.md 0049 item 3); src/state/work.mjs:455 stage retired |
| Child Work | Mixed implementation and proposal; no blanket implementation claim | docs/specs/runner.md:1224 and :2378 (child work = work.parent edge) |
| Work Driver Handoff To Dispatch | Unimplemented design proposal | git grep DispatchRequest/PolicyPatch in src packages apps core -> no hits (docs only); src/runner/dispatch/assignment-runner.mjs:62,2286 resolveExecutorConfig is used inside dispatch only |
| Isolation | Mixed implementation and proposal; no blanket implementation claim | src/workflow/runner.mjs:385-391 (createWorkflowWorktree per Unit), :173-176 (cleanup keeps failed worktrees); assignment-runner.mjs:497 worktree mismatch refusal |

## Core Invariant

```txt
Work lifecycle is owned only by Work engine verbs.
Execution returns evidence and recommendations to the Work driver.
```

Work attachment is optional per the
[Agent Coordination Foundation Vision](../vision.md). These boundaries apply
whenever a session references Work; standalone coordination uses the same
dispatch/runtime/evidence core without gaining a delivery lifecycle.

## Execution May

- read Work requirements, decisions, artifacts, stage, and allowed repository
  scope;
- execute a legal Work Stage Operation through Assignment;
- return RunResults, evidence, review findings, or synthesis;
- inform the driver's choice of an existing Work verb;
- reference child Work and session-local supporting activity.

## Execution May Not

- directly move Work stage or status;
- infer acceptance or approval from agent consensus;
- claim/return Work outside existing lifecycle verbs;
- merge a branch outside Work merge policy;
- mark Work complete because a Run or session completed;
- duplicate Work stage/status/approval/merge state in another runtime.

## Child Work

Child Work is appropriate when a unit needs independently durable backlog,
claim, acceptance, approval, dependency, branch, merge, or resume behavior.

## Work Driver Handoff To Dispatch

## Isolation

Lifecycle and Git/process isolation are separate. A temporary isolated task does
not automatically become Work. Parallel mutating operations must not share one
physical checkout merely because declared source footprints differ.

Nested immediate-parent branch integration is a candidate invariant, not yet an
accepted cross-path contract.

