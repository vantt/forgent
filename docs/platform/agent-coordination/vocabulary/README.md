# Agent Coordination Vocabulary

```txt
Document type: Collection index
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Accepted at atomic cutover
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Source material from `docs/architect/agent-coordination/vocabulary/README.md` at `947dc310396071a4d530216d5c06d05993d63bf5`; live routes and the explicitly stated implementation corrections are adapted here.
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/agent-coordination/README.md
- docs/platform/runner/spec.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Carriage note: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/vocabulary/README.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

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
