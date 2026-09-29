---
phase: 1
title: "Correct planning and routing semantics"
status: completed
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Correct planning and routing semantics

> Legacy numbering: this was **Phase 00** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

## Overview

**Status:** `completed` — review and merge the complete range `ac19f6d1e..documentation-authority-phase-00-20260925`,
not `a725d4788` alone. The range includes the implementation commit
`a725d4788`, status commit `0c38df980`, and the Phase 1 review-follow-up at
HEAD. No later-phase authority is implied.
**Mode:** planning/documentation only
**Purpose:** Ensure every artifact tells the truth about what is historical,
active, canonical, candidate, or preserved future intent.

## Requirements

**Deliverables:**

- preserve `plans/260825-1841-knowledge-registry/` at its historical path and
  label the code landing separately from later migration/enforcement history;
- keep the full proposal as long-horizon architecture;
- establish this file as the proposed near-term plan;
- update the platform intent ledger with future engine commitments and source/
  evidence pointers;
- produce a verified current-authority table per area and root document with
  separate `authorityStatus` and `fileClass` dimensions; authority status is
  `promoted`, `candidate`, `legacy-current`, `conflicted`, or `non-authority`;
- resolve the contradiction between accepted `docs/doc-governance.md` §13,
  `docs/reading-map.md`, `docs/specs/reading-map.md`, and portal declarations;
- identify every always-loaded pointer that bypasses the transitional route;
- preserve the verified locked-law result: L5/L8 wording does not hardcode
  `docs/specs/**` or `docs/architect/**`, so path relocation alone does not
  supersede those laws; moving the root law source still requires generated
  instruction-anchor/projection rewrites and L8 anchor-suite proof;
- record known tsk-28x implementation/migration drift in a new correction note,
  never by rewriting historical evidence.

## Architecture

Program-level data model and execution boundary: `plan.md` §5 (Execution Boundary) and §6 (Minimum Migration Data Model).

## Related Code Files

**Evidence:**

- isolated-worktree execution record and input digests:
  `reports/phase-00-execution-record.md`;
- reproducible commands, exit codes, and summaries:
  `reports/phase-00-verification.md`;
- verified area/root routing map:
  `current-authority-map-2026-09-25.md`;
- historical-registry current-state correction:
  `../260825-1841-knowledge-registry/CURRENT-STATE-CORRECTION.md`;
- independent reviews: `independent-frontier-review-2026-09-25.md` and
  `independent-frontier-rereview-2026-09-25.md`.

Completion of this phase records truth and routing only. It does not activate a
switchboard, ratchet, alias resolver, claim ledger, corpus transformation, or
cutover, and it does not authorize any later phase.

## Implementation Steps

Executed. See the execution and verification records under `reports/` (legacy numbering) listed in Related Code Files.

## Success Criteria

- [x] a stranger can distinguish proposal, proposed plan, historical plan, and
  intent ledger without chat history;
- [x] every area has one explicit current route even when its physical sources are
  still mixed;
- [x] no locked-law or governance change is hidden inside wording cleanup.

## Risk Assessment

Program-level risks and countermeasures: `plan.md` §11.
