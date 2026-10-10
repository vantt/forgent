# ADR-001: Work Owns Delivery Lifecycle

```txt
Document type: Decision
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

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/decisions/ADR-001-work-lifecycle-authority.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Implementation And Design Status

The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.

| Section | Status | Evidence / limit |
|---|---|---|
| Context | Mixed implementation and proposal; no blanket implementation claim | src/runner/dispatch/assignment-runner.mjs:10 'Never mutates Work lifecycle state'; src/state/work.mjs:455-472 |
| Decision | Current lifecycle invariant | assignment-runner.mjs:10 states the boundary; Work field validation is src/state/work.mjs:455-467. Import-graph tests enforce specific lifecycle boundaries, not a blanket ban on every word `claim`. |
| Consequences | Mixed implementation and proposal; no blanket implementation claim | src/runner/dispatch/assignment-runner.mjs:10; src/runner/fanout-batch.mjs / loop.mjs return results to Work driver |

## Context

Execution introduces Assignments, Runs, results, Unit runs and Workflow runs.
Letting execution records independently approve or merge Work would create
conflicting delivery authority. Retired sessions/tasks are historical context,
not current lifecycle actors.

## Decision

Work and its existing verbs own status, claim/return, acceptance, approval and
branch/merge lifecycle. Work records Workflow position as `workflowStep`;
`stage` is rejected (`src/state/work.mjs:455-467`).

Execution returns evidence and recommendations to its consuming driver.
Lifecycle changes still go through authorized Work verbs, never consensus or
a second execution-state lifecycle.

## Consequences

- Unit/Workflow execution state does not duplicate Work approval/status authority.
- Agent consensus cannot approve or complete Work.
- Work-attached execution returns results to the driver.
- Execution without Work does not acquire delivery authority.
- Lifecycle leakage is a high-severity review finding.

