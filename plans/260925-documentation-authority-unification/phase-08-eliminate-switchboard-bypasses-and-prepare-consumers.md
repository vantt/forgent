---
phase: 8
title: "Eliminate switchboard bypasses and prepare consumers"
status: pending
priority: P1
effort: ""
dependencies: [7]
---

# Phase 8: Eliminate switchboard bypasses and prepare consumers

> Legacy numbering: this was **Phase 07** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

## Overview

**Status:** `not-started`, `not-authorized`, blocked by Phase 7. Harness per `plan.md` §7.2. Consumer list includes the 22 skill/task-spec files that still point plans at `docs/history/<feature>/plan.md` (`plan.md` §7.6).
**Mode:** plan branch
**Purpose:** Ensure cutover changes behavior, not only files. Generic consumers
should already use the Phase 2 switchboard; this phase rewrites remaining direct
path dependencies and prepares the one-row/table authority flip rather than
holding hundreds of edits on a long-lived branch.

## Requirements

**Consumers include:**

- AGENTS/CLAUDE and instruction sources;
- reading maps and portals;
- skills and prompt templates;
- CLI help/examples;
- setup/doctor registrations;
- generators and projections;
- tests and fixtures;
- comments that name authority paths;
- external-facing links where maintained in-repo.

## Architecture

Program-level data model and execution boundary: `plan.md` §5 (Execution Boundary) and §6 (Minimum Migration Data Model).

## Related Code Files

Determined when this phase is authorized; deliverable paths are listed under Requirements.

## Implementation Steps

To be detailed when this phase is explicitly authorized (plan.md §5). Deliverables and rules under Requirements are the contract.

## Success Criteria

- [ ] repository-wide search finds no reader or writer treating a legacy path as
  current authority;
- [ ] aliases are lookup-only and never writing instructions.

## Risk Assessment

Program-level risks and countermeasures: `plan.md` §11.
