---
phase: 10
title: "Post-cutover maintenance MVP"
status: pending
priority: P1
effort: ""
dependencies: [9]
---

# Phase 10: Post-cutover maintenance MVP

> Legacy numbering: this was **Phase 09** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

## Overview

**Status:** `not-started`, `not-authorized`, blocked by a verified Phase 9 cutover and follow-on authorization.
**Mode:** follow-on plan may begin only after cutover
**Purpose:** Prevent recurrence with the smallest useful maintenance system.

## Requirements

**Initial surfaces:**

```text
fgos doc classify
fgos doc new
fgos doc check
fgos doc inventory
fgos doc retirement-check
```

**Initial checks prioritize observed failures:**

- duplicate owner;
- wrong placement;
- missing required metadata;
- broken links and anchors;
- references to nonexistent code/skills/commands;
- stale generated projection;
- reintroduced legacy roots;
- unaccounted source/claim lineage.

This phase hands off to the future Knowledge and Documentation Engine plan; it
must not silently expand into Agent Context Engine.

## Architecture

Program-level data model and execution boundary: `plan.md` §5 (Execution Boundary) and §6 (Minimum Migration Data Model).

## Related Code Files

Determined when this phase is authorized; deliverable paths are listed under Requirements.

## Implementation Steps

To be detailed when this phase is explicitly authorized (plan.md §5). Deliverables and rules under Requirements are the contract.

## Success Criteria

- [ ] See Requirements.

## Risk Assessment

Program-level risks and countermeasures: `plan.md` §11.
