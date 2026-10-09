# Historical File: Agent Coordination Vocabulary

```txt
Document type: History
Audience: Human reviewer, maintainer and documentation agent
Purpose: Preserve the complete classified input as non-authority historical evidence
Design status: Candidate
Implementation: Historical snapshot; not current implementation or authority
Provenance: docs/platform/agent-coordination/vocabulary/README.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 595ef132a7c493d37af7a5bf1d6a63beb80cb336eb513b177c37a5db0c02cbb2
Writer type: Documentation maintainer
Canonical for: Historical evidence only; no current authority
Use this when: Auditing original claims or section-level retirement
Do not use this for: Current runtime behaviour, accepted proposals or executable routing
Last reviewed: Pending independent whole-area review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: None; this is an exact historical carrier
Superseded by: Current execution ownership in docs/specs/runner.md
Added in candidate: Historical framing only; literal file bytes are unchanged
```

The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims.

## Literal Snapshot

~~~~text
# Agent Coordination Vocabulary

```txt
Document type: Collection index
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Agent Coordination Vocabulary
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/vocabulary/README.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved collection-index material for Agent Coordination Vocabulary; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/platform/agent-coordination/vision.md
- docs/platform/agent-coordination/vocabulary/canonical-concepts.md
- docs/platform/agent-coordination/vocabulary/concept-relationships.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Index
Design status: Accepted
Implementation: Active
Last reviewed: 2026-08-31
Canonical for: vocabulary ownership and navigation

## Purpose

This directory is the single source of truth for agent-coordination terms.
Architecture, contracts, proposals, roadmaps, tests, and Skills should link here
instead of introducing local definitions.

Term meanings refine the [Agent Coordination Foundation Vision](../vision.md)
and must not make Work or a predeclared protocol universally mandatory.

Vocabulary entries describe meaning and ownership. Detailed behavior belongs in
architecture or contracts.

## Documents

1. [Canonical Concepts](canonical-concepts.md) defines the supported terms by
   architectural layer.
2. [Concept Relationships](concept-relationships.md) shows how those concepts
   compose and which layer owns each transition.
3. [Deprecated And Reserved Terms](deprecated-and-reserved.md) records aliases,
   rejected overloads, and future-reserved vocabulary.
4. [Stage Operation Relationship Diagram](stage-operation-taskspec-skill-relationship.svg)
   visualizes the current Workflow/Stage/Operation/Assignment execution path.

The pre-migration vocabulary map is retained as a non-canonical
[historical record](../history/implementation-records/orchestration-vocabulary-map-2026-08-27.md).

## Entry Contract

Each canonical concept should identify:

- definition;
- owning layer;
- lifecycle authority, if any;
- creator and consumer;
- important relationships;
- concepts it must not be confused with;
- aliases or deprecated names;
- design and implementation status when relevant.

## Change Control

- Add an alias here before allowing it in user-facing or machine-facing prose.
- Do not reuse an existing term for a different lifecycle layer.
- Changes to accepted ownership boundaries require an ADR.
- Open naming questions belong in `proposals/`, not in this index.
~~~~
