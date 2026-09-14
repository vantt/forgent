# Component Boundary

```txt
Document type: Platform architecture anchor
Audience: Human reviewer, architect, maintainer, design-shaping agent
Purpose: Track the whole-system component and authority boundary map
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted anchor for docs/architect/component-boundary/**
Last reviewed: 2026-09-13
Related:
- docs/architect/component-boundary/README.md
- docs/architect/component-boundary/component-boundary-advisory.md
- docs/architect/proposals/component-authority-boundary-map.md
- docs/platform/README.md
```

## 1. Purpose

This document is the platform-wide anchor for component boundaries.

It answers:

- which major components exist;
- which parent/child responsibilities belong together;
- which component owns a decision or state write;
- which areas depend on each other through explicit contracts;
- when a design changes the whole-system boundary map.

## 2. Current Source During Migration

The current detailed source remains:

| Source | Role |
| --- | --- |
| [../architect/component-boundary/README.md](../architect/component-boundary/README.md) | Reading portal for the existing component-boundary architecture package. |
| [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) | Advisory map of components, bounded contexts, and authority boundaries. |
| [../architect/proposals/component-authority-boundary-map.md](../architect/proposals/component-authority-boundary-map.md) | Draft authority map with parent/child and dependency vocabulary. |

Until this anchor is fully promoted, use those sources for detail and update this file as the stable entry point.

## 3. Update Rule

Any design discussion or documentation rewrite must check this boundary map when it changes:

- a platform component;
- a parent/child component relationship;
- ownership of a state write, decision, runtime authority, or contract;
- a cross-area dependency;
- the boundary between platform core, platform support, domain layer, host surface, or extension/plugin layer.

If the boundary changes, update this document or the current detailed source listed above. If it does not change, record `No component-boundary change` in the implementation alignment, verification note, discussion summary, or PR note.

## 4. Current High-Level Components

This table is a compact navigation surface, not a full replacement for the advisory docs.

| Component | Current role | Current source |
| --- | --- | --- |
| Work Lifecycle Engine | Domain-agnostic work-unit lifecycle, status/stage, claim/return, human gates. | [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) |
| Agent Coordination Engine | Domain-neutral collaboration runtime and coordination session lifecycle. | [../architect/agent-coordination/](../architect/agent-coordination/) |
| Dispatch And Execution Engine | Governed execution of approved assignments. | [../architect/agent-coordination/architecture/dispatch-control-plane.md](../architect/agent-coordination/architecture/dispatch-control-plane.md) |
| Run Result Evaluator | Evidence/confidence boundary for assignment run results. | [../architect/agent-coordination/architecture/evidence-and-results.md](../architect/agent-coordination/architecture/evidence-and-results.md) |
| Domain Components And Extension Layer | Domain-specific behavior, workflows, skills, task specs, doctrine. | [../../domains/](../../domains/), [../architect/domainization/](../architect/domainization/) |
| Host And Surface Layer | CLI/API/plugin/dashboard/Herdr surfaces into platform engines. | Host invocation and gateway docs |
| Packaging-Distribution | Runtime packaging, install, activation, setup/doctor readiness. | [packaging-distribution/README.md](packaging-distribution/README.md) |
| Knowledge, Learning, And Documentation Registry | Retrospective learning, doc registry, end-user docs index, trace/evolve signals. | Knowledge and docs registry docs |

## 5. How To Change

1. Read this anchor and the current detailed component-boundary source.
2. Identify whether the change is component packaging, bounded context, authority boundary, or physical layout.
3. Update the owning area docs.
4. Update this anchor or the detailed source when the whole-system map changes.
5. Link evidence or record `No component-boundary change`.

## 6. Related Files

| Relationship | File |
| --- | --- |
| platform portal | [README.md](README.md) |
| detailed component-boundary source | [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) |
| draft authority map | [../architect/proposals/component-authority-boundary-map.md](../architect/proposals/component-authority-boundary-map.md) |
| packaging-distribution area | [packaging-distribution/README.md](packaging-distribution/README.md) |
