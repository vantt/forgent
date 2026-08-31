# Agent Coordination Vocabulary

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
