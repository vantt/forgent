# Workflow Stage Operation Contract

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
