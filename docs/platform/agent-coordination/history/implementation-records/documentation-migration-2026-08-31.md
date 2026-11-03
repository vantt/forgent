# Agent Coordination Documentation Migration - 2026-08-31

```txt
Document type: History
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Agent Coordination Documentation Migration - 2026-08-31
Design status: Archived
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Source material from `docs/architect/agent-coordination/history/implementation-records/documentation-migration-2026-08-31.md` at `947dc310396071a4d530216d5c06d05993d63bf5`; live routes and the explicitly stated implementation corrections are adapted here.
Writer type: Documentation maintainer
Canonical for: Historical evidence only; no current runtime authority
Use this when: Comparing this source carriage with its pinned source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: Source review history retained; no new implementation certification
Related:
- None
Supersedes: None; the retained source records the historical design
Superseded by: None
Carriage note: Promotion metadata only; source claims and implementation are not re-decided here
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
