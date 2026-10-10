# ADR-002: Preserve Workflow step Primary Operation Compatibility

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

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/decisions/ADR-002-stage-operation-compatibility.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Context

Current consumers obtain skills and TaskSpecs through Workflow projection APIs.
The step's `skill` remains supported, while TaskSpec selection comes from the
primary operation (`src/workflow/steps.mjs:52-63`), not `step.taskSpec`.

## Decision

Workflow steps may define multiple operations. `operationsForStep()` returns
the normalized operations or synthesizes a primary operation for a skill-only
step (`src/workflow/steps.mjs:70-85`). `taskSpecForStep()` and the domain
`bundleForStep()` preserve primary-operation consumers. This compatibility
does not revive Work stages or a Stage Protocol runtime.

## Consequences

- Existing primary-operation behavior remains stable.
- Secondary operations require explicit IDs and validated references.
- New drivers use normalized operations instead of parsing raw config.
- Setup/doctor must expose invalid references rather than dropping them.
