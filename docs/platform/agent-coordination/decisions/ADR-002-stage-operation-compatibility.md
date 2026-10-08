# ADR-002: Preserve Stage Primary Operation Compatibility

```txt
Document type: Decision
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for ADR-002: Preserve Stage Primary Operation Compatibility
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/decisions/ADR-002-stage-operation-compatibility.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved decision material for ADR-002: Preserve Stage Primary Operation Compatibility; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- None
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
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
