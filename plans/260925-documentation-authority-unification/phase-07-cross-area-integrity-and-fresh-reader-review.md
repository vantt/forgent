---
phase: 7
title: "Cross-area integrity and fresh-reader review"
status: pending
priority: P1
effort: ""
dependencies: [6]
---

# Phase 7: Cross-area integrity and fresh-reader review

> Legacy numbering: this was **Phase 06** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

## Overview

**Status:** `not-started`, `not-authorized`, blocked by Phase 6.
**Mode:** plan branch, review only except fixes
**Purpose:** Catch errors that per-area migration cannot see.

## Requirements

**Review dimensions:**

- one owner per cross-area claim;
- contract producer/consumer agreement;
- platform-wide vocabulary consistency;
- vision/spec/architecture/contract/decision separation;
- component-boundary correctness;
- preserved intent and deferred capabilities;
- generated projection/source agreement;
- newcomer navigation without legacy paths;
- implementation alignment and evidence quality.

## Architecture

Program-level data model and execution boundary: `plan.md` §5 (Execution Boundary) and §6 (Minimum Migration Data Model).

## Related Code Files

Determined when this phase is authorized; deliverable paths are listed under Requirements.

## Implementation Steps

To be detailed when this phase is explicitly authorized (plan.md §5). Deliverables and rules under Requirements are the contract.

## Success Criteria

- [ ] no unresolved authority conflict;
- [ ] a stranger can answer the platform's read-first, owner, contract, risk,
  verification, and learning questions without legacy authority.

## Risk Assessment

Program-level risks and countermeasures: `plan.md` §11.
