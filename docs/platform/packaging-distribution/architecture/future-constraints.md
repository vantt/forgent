# Future Constraints

```txt
Document type: Architecture
Audience: Architect, maintainer, implementation agent
Purpose: Preserve future constraints that packaging-distribution must not block
Design status: Draft
Implementation status: Planned
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/architect/packaging-distribution/future-constraints.md
Last reviewed: 2026-09-13
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
```

## 1. Purpose

This document records future constraints. It is not current delivery scope.

## 2. Shared Gateway Constraint

A future shared gateway or dashboard may serve many projects from one process. Packaging-distribution must not require a single global active fgOS runtime for all projects.

The gateway should select a project/workspace, then invoke the appropriate project-local runtime boundary.

## 3. Project Runtime Adapter Constraint

The future adapter should treat packaging-distribution records as authority for runtime identity:

- workspace activation binding;
- release manifest;
- stable shim/entry path;
- project/work-state topology binding.

It should not infer runtime identity from `PATH` alone.

## 4. MCP/Substrate Constraint

Global substrate services may exist later, but they should not own project workflow semantics or mutate project-visible projections directly.

## 5. Current Scope Boundary

Current packaging-distribution work focuses on:

- native `fgctl`;
- release artifacts;
- project-local activation;
- legacy Node compatibility;
- doctor/fix readiness.

Shared web/gateway delivery belongs to a later architecture slice.
