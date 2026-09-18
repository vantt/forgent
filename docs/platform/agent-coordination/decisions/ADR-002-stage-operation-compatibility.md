# ADR-002: Preserve Stage Primary Operation Compatibility

Document type: ADR
Design status: Accepted
Implementation: Implemented
Last reviewed: 2026-08-31
Canonical for: migration from one Stage action to multiple operations

## Context

Existing workflow consumers understand `stage.skill` and `stage.taskSpec`.
Team Dispatch needs multiple legal operations per Stage without breaking that
path.

## Decision

Stages may define multiple Stage Operations. `stage.skill` and
`stage.taskSpec` remain the primary operation compatibility projection.
Normalization and `operationsForStage()` provide the canonical operation list.

## Consequences

- Existing primary-operation behavior remains stable.
- Secondary operations require explicit IDs and validated references.
- New drivers use normalized operations instead of parsing raw config.
- Setup/doctor must expose invalid references rather than dropping them.
