---
phase: 2
title: "Contain further divergence"
status: completed
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Contain further divergence

> Legacy numbering: this was **Phase 01** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

## Overview

**Status:** `completed` — review findings R1–R5 remediated on branch
`documentation-authority-unification--phase-01-review-fix`; independent re-review range
`38a337ecb31dc97b78aca012eba0da89c003a927..f0c76c5e590339d9c815038539ff1f4a072c64e4` returned verdict
**APPROVE**. Tagged `documentation-authority-phase-01-20260926` (annotated tag object
`135957aec6e9939b7a1626d2942014c045620a40`, target commit `f0c76c5e590339d9c815038539ff1f4a072c64e4`,
tested/final tree `7f9e3f0907b1751f73e4ca1e4cdb7a75e2135a1a`). This tag is the immutable base for Phase 3.
Phase 3 is authorized as of 2026-09-26 (see Phase 3 section below); Phases 4–10 remain unauthorized.
**Mode:** plan branch
**Purpose:** Stop the two systems drifting farther apart while migration runs.

## Requirements

**Deliverables:**

- one switchboard route, backed by the Phase 1 authority table, through which
  repository-local readers resolve current owners without guessing (`docs/transitional-switchboard.md`, `transitional-switchboard.json`);
- a preliminary claim-kind and source-disposition vocabulary (`claim-and-disposition-vocabulary.json`, `claim-and-disposition-vocabulary.md`);
- a baseline list of files and source digests under legacy roots (`scripts/check-legacy-docs-ratchet.baseline.json`);
- a ratchet refusing unreviewed new maintained files **and unaccounted edits**
  under legacy roots (`scripts/check-legacy-docs-ratchet.mjs`, `scripts/check-legacy-docs-ratchet.exceptions.json`, `test/scripts/check-legacy-docs-ratchet.test.mjs`);
- authoring guidance for changes during migration: update the current owner once,
  then record candidate-target impact in the ledger; never dual-author prose (`docs/platform/migration-authoring-rules.md`);
- immediate correction of stale standing routes that point to known-invalid
  skill/path facts (updated `docs/specs/reading-map.md` and `docs/reading-map.md`);
- a separate inventory of path conventions shipped through `core/skills`,
  `domains/**`, generated instructions, and plugins so repository migration does
  not silently redefine consumer-project contracts (`shipped-path-conventions-inventory.json`, `shipped-path-conventions-inventory.md`).

This phase does not declare `docs/platform/**` fully canonical.

## Architecture

Program-level data model and execution boundary: `plan.md` §5 (Execution Boundary) and §6 (Minimum Migration Data Model).

## Related Code Files

**Evidence:**

- execution record: `reports/phase-01-execution-record.md`;
- reproducible verification: `reports/phase-01-verification.md`.

## Implementation Steps

Executed. See the execution and verification records under `reports/` (legacy numbering) listed in Related Code Files.

## Success Criteria

- [x] no writer has to guess between legacy and target;
- [x] no new legacy maintained file can appear without a recorded exception.

## Risk Assessment

Program-level risks and countermeasures: `plan.md` §11.
