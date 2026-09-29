---
phase: 4
title: "Freeze the minimum constitution and migration method"
status: pending
priority: P1
effort: ""
dependencies: [3]
---

# Phase 4: Freeze the minimum constitution and migration method

> Legacy numbering: this was **Phase 03** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

## Overview

**Status:** `not-started`, `not-authorized`, blocked by Phase 3.
**Mode:** plan branch
**Purpose:** Turn inventory evidence into a small, testable migration contract.

## Requirements

**Deliverables:**

- minimum machine-readable constitution or equivalent validated schema;
- claim/disposition ledger schema;
- target path rules;
- conflict-resolution procedure;
- conservation checker;
- legacy-path ratchet;
- retirement-check dry-run;
- a minimal platform alias table/resolver contract that covers immutable
  historical paths and is importable into the future multi-profile registry;
- evidence-payload relocation policy and consumer proof;
- migration-specific documentation-cutover lease design; if it introduces a
  persistent file/config/tool dependency, register setup/doctor discovery and a
  changelog entry rather than leaving hidden infrastructure;
- candidate-status metadata/check;
- explicit list of richer fields deferred to the future engine.

## Architecture

Program-level data model and execution boundary: `plan.md` §5 (Execution Boundary) and §6 (Minimum Migration Data Model).

## Related Code Files

Determined when this phase is authorized; deliverable paths are listed under Requirements.

## Implementation Steps

To be detailed when this phase is explicitly authorized (plan.md §5). Deliverables and rules under Requirements are the contract.

## Success Criteria

- [ ] the method can reject duplicate owners, missing dispositions, missing targets,
  and unauthorized legacy growth mechanically.

## Risk Assessment

Program-level risks and countermeasures: `plan.md` §11.
