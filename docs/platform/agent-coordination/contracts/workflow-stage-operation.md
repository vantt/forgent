# Workflow Stage Operation Contract

```txt
Document type: Contract
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Workflow Stage Operation Contract
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/contracts/workflow-stage-operation.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved contract material for Workflow Stage Operation Contract; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/platform/agent-coordination/vision.md
- docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Contract
Design status: Accepted
Implementation: Implemented
Last reviewed: 2026-08-31
Canonical for: normalized Stage Operation behavior and compatibility

## Contract

A workflow Stage may define multiple semantic operations. Each normalized
operation has an identity and may reference:

- TaskSpec;
- one or more Skills;
- Role;
- selection reason/doctrine;
- dispatch policy hints;
- mutation/evidence expectations supplied by TaskSpec or policy.

This contract governs declared Workflow operations. Per the
[Agent Coordination Foundation Vision](../vision.md), a standalone agent-led
session need not fabricate a Workflow Stage to access coordination. Its future
inline execution-contract path is governed by the Assignment contract and must
not alter this compatibility contract.

## Primary Compatibility Path

Existing consumers may continue to read:

```txt
stage.skill
stage.taskSpec
```

These fields represent the primary operation compatibility projection. Adding
secondary operations must not change the primary operation unless configuration
explicitly changes it.

## Lookup

`operationsForStage()` returns the normalized legal operations for one Stage.
Consumers must not reconstruct operations independently from raw YAML.

Expected behavior:

- preserve declaration order unless configuration defines another priority;
- include the primary operation exactly once;
- normalize singular/plural Skill references consistently;
- return no operations only when the Stage contract permits it;
- reject unknown Stage or malformed operation according to caller contract.

## Validation

Setup/doctor validation must reject or report:

- duplicate operation IDs within a Stage;
- missing TaskSpec reference;
- missing Skill reference;
- missing/unknown Role where required;
- invalid policy hints;
- ambiguous or missing primary compatibility mapping;
- operation references incompatible with the workflow/domain.

Validation must not silently drop an invalid secondary operation and leave the
Stage appearing healthy.

## Driver Boundary

The driver may select only an operation returned as legal for the active Stage.
Operation selection does not dispatch directly; it produces inputs for an
Assignment builder and governed execution path.

## Compatibility Tests

- legacy Stage with only `skill`/`taskSpec` normalizes to one primary operation;
- Stage with `operations` preserves the primary compatibility fields;
- multiple operations remain addressable by stable ID;
- invalid references fail setup/doctor validation;
- normalization is deterministic and idempotent;
- driver cannot select an operation from another Stage.

Implementation-era detail and task history remain in
[Step 02](../roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md).
