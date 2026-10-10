# Workflow Step Operation Contract

```txt
Document type: Contract
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

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/contracts/workflow-stage-operation.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Contract

A Workflow step may define multiple semantic operations. Each declared
operation has an identity and may reference:

- TaskSpec;
- one or more Skills;
- Role;
- selection reason/doctrine;
- dispatch policy hints;
- mutation/evidence expectations supplied by TaskSpec or policy.

This surviving contract concerns Workflow step operations, not a revived coordination session. A standalone Unit-run request does not need to fabricate a Work-owned Workflow step. Assignment creation and governed execution remain separate from this compatibility helper.

## Primary Compatibility Path

The current projections are:

```txt
skillForStep(wf, stepOrStatus)
taskSpecForStep(wf, stepOrStatus)
```

These fields represent the primary operation compatibility projection. Adding
secondary operations must not change the primary operation unless configuration
explicitly changes it.

## Lookup

`operationsForStep(wf, stepId, { defaultRole = 'implementer' })` reads one step (`src/workflow/steps.mjs:70-85`):

- an unknown step returns the shared empty array;
- an explicit nonempty operations array is returned unchanged;
- otherwise a step with a skill produces one frozen primary operation with id/taskSpec equal to the step id, the supplied defaultRole and that skill;
- otherwise it returns the empty array.

`taskSpecForStep` selects a primary operation (or the first) and returns its taskSpec; a status skill is its fallback (`steps.mjs:57-64`). The older raw stage.taskSpec projection is preserved in history, not asserted as the current step shape.

## Validation

The following are retained validation requirements for configuration/setup/doctor consumers, not checks implemented by operationsForStep itself. Consumers should reject or report:

- duplicate operation IDs within a Workflow step;
- missing TaskSpec reference;
- missing Skill reference;
- missing/unknown Role where required;
- invalid policy hints;
- ambiguous or missing primary compatibility mapping;
- operation references incompatible with the workflow/domain.

Validation must not silently drop an invalid secondary operation and leave the
Workflow step appearing healthy.

## Driver Boundary

The driver may select only an operation returned as legal for the active Workflow step.
Operation selection does not dispatch directly; it produces inputs for an
Assignment builder and governed execution path.

## Compatibility Proof Obligations

- legacy Workflow step with only `skill`/`taskSpec` normalizes to one primary operation;
- Workflow step with `operations` preserves the primary compatibility fields;
- multiple operations remain addressable by stable ID;
- invalid references fail setup/doctor validation;
- normalization is deterministic and idempotent;
- driver cannot select an operation from another Workflow step.

Implementation-era detail and task history remain in
[Step 02](../history/retired-engine/files/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#literal-snapshot).
