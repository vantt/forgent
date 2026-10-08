# Agent Coordination Documentation Migration - 2026-08-31

```txt
Document type: History
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Agent Coordination Documentation Migration - 2026-08-31
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/history/implementation-records/documentation-migration-2026-08-31.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved history material for Agent Coordination Documentation Migration - 2026-08-31; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- None
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: History
Design status: Accepted
Implementation: Verified
Last reviewed: 2026-08-31
Canonical for: nothing

## Purpose

Record how the original flat documentation set was classified. This protects
provenance while canonical authority moves to subject-based documents.

## Mapping

| Original document | New classification | Canonical output |
|---|---|---|
| `README.md` | Documentation portal | Subject indexes below it |
| `orchestration-vocabulary-map.md` | Historical source | `vocabulary/` |
| `dispatch-control-plane-redesign.md` | Proposal | `architecture/dispatch-control-plane.md` |
| `team-communication-protocol-v1.md` | Proposal | None until accepted |
| `agent-team-dispatch-and-herdr-stability.md` | Historical brainstorm | `architecture/visibility-and-herdr.md` |
| `step-00` through `step-06` | Team Dispatch V1 roadmap/history | `architecture/` and `contracts/` |
| `step-07` | Discussion proposal | None until accepted |
| `step-08` | Discussion proposal | None until accepted |
| `coordination-operating-harness.md` | Playbook | Operational only |
| `trace/` | Verification evidence | `verification/team-dispatch-v1/` |

## Migration Rules Applied

- Original long-form sources were retained rather than deleted.
- Accepted definitions were rewritten into concise canonical documents.
- Discussion-stage content was not promoted to accepted architecture.
- Numbered Steps remain only where implementation sequencing matters.
- New links target canonical documents first and historical sources second.
