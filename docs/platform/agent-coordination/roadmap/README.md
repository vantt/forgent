# Agent Coordination Roadmap

```txt
Document type: Collection index
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Agent Coordination Roadmap
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/roadmap/README.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved collection-index material for Agent Coordination Roadmap; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/platform/agent-coordination/roadmap/team-dispatch-v1/README.md
- docs/platform/agent-coordination/architecture/coordination-foundation-baseline.md
- docs/architect/proposals/step-09-group-thinking-substrate.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Index
Design status: N/A
Implementation: Partial
Last reviewed: 2026-09-01
Canonical for: implementation sequence only

## Migration Status

This target directory preserves rollout and implementation sequencing from
`docs/architect/agent-coordination/roadmap/`. It remains non-normative: a
roadmap cannot establish current architecture, contracts, or decisions.

## Tracks

- [Team Dispatch V1](team-dispatch-v1/README.md) records Steps 00-06 from baseline
  design through Work-attached adoption as rollout history.
- Steps 00-08 have been promoted into canonical architecture/contracts/ADRs
  where accepted. Their combined baseline is summarized in
  [Coordination Foundation Baseline](../architecture/coordination-foundation-baseline.md),
  with exact schemas in `contracts/`, rollout history in this roadmap, and
  evidence in `verification/`.
- [Step 09](../../../architect/proposals/step-09-group-thinking-substrate.md)
  (group-thinking substrate) and
  [Step 10](../../../architect/proposals/step-10-coding-domain-adoption.md)
  (coding-domain adoption) are discussion drafts. Step 10's mutating half
  remains gated on coding-domain adoption proof and ADR-010 §5's
  work-isolation boundary.

Roadmap documents reference canonical vocabulary, architecture, and contracts.
They are not a source of new system definitions.

Implementation sequencing begins from the
[Agent Coordination Foundation Vision](../vision.md), then the
[Intent Preservation Ledger](../intent-preservation-ledger.md), then accepted
architecture/contracts/ADRs. A roadmap may not make optional Work or protocol
structure mandatory by implementation convenience.

Every new implementation phase must include an intent traceability section and
close with a deferral audit. The audit must state which preserved intentions
were implemented, remain `deferred-preserved`, were superseded by an explicit
decision, or were rejected by an explicit human decision.
