---
phase: 6
title: "Transform all platform areas as candidate material"
status: pending
priority: P1
effort: ""
dependencies: [5]
---

# Phase 6: Transform all platform areas as candidate material

> Legacy numbering: this was **Phase 05** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

## Overview

**Status:** `not-started`, `not-authorized`, blocked by Phase 5.
**Mode:** isolated worktrees per non-overlapping target, merged to plan branch
**Purpose:** Build the complete target corpus without creating a second live
system.

## Requirements

**Rules:**

- schedule by target ownership and dependency, not arbitrary source files;
- preserve all retained details before improving prose;
- separate current state, intended direction, obligation, rationale, decision,
  and proof into their correct owners;
- update area portals and related links as part of each target unit;
- keep target docs explicitly candidate until repository-wide promotion;
- record every deletion/archive reason in the ledger;
- run conservation after every target commit.

## Architecture

Program-level data model and execution boundary: `plan.md` §5 (Execution Boundary) and §6 (Minimum Migration Data Model).

## Related Code Files

Determined when this phase is authorized; deliverable paths are listed under Requirements.

## Implementation Steps

To be detailed when this phase is explicitly authorized (plan.md §5). Deliverables and rules under Requirements are the contract.

## Success Criteria

- [ ] all platform areas have complete candidate owners;
- [ ] no retained claim remains only in a legacy source;
- [ ] the final ledger destination is prepared at
  `docs/platform/history/documentation-authority-unification/`, where a sealed
  immutable claim-conservation snapshot plus digest/proof will survive cutover
  as D2 evidence and an H2 import source.

## Risk Assessment

Program-level risks and countermeasures: `plan.md` §11.
