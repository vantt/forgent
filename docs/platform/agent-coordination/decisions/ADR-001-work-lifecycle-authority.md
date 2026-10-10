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
| Decision | Current contract/invariant | src/runner/dispatch/assignment-runner.mjs:10; test/runner/dispatch-reconciliation-import-graph.test.mjs (no pick/return/claim/appendEvent in dispatch core); AGENTS.md one-door-write verbs |
| Consequences | Mixed implementation and proposal; no blanket implementation claim | src/runner/dispatch/assignment-runner.mjs:10; src/runner/fanout-batch.mjs / loop.mjs return results to Work driver |

## Context

Coordination introduces Assignments, Runs, results, possible sessions, and
temporary tasks. Letting those objects mutate lifecycle independently would
create conflicting status, approval, and merge truth.

## Decision

Work and existing Work engine verbs are the sole authority for Work status,
stage, claim/return, acceptance, approval, durable branch, and merge lifecycle.

Coordination objects may provide evidence or recommendations to a Work driver,
but cannot perform lifecycle transitions except through authorized Work verbs.

## Consequences

- Session/task status must remain collaboration-local.
- Agent consensus cannot approve or complete Work.
- Work-attached dispatch must return results to the driver.
- Standalone coordination can exist without gaining delivery authority.
- Lifecycle leakage is a high-severity review finding.

