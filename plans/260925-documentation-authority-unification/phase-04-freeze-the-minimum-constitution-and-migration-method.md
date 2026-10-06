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

**Status:** `not-started`, `not-authorized`. Phase 3 is complete and the former Observe blockers are completed; this phase waits only for the owner's explicit authorization (re-checked 2026-10-06).
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

### Execution harness

Type **Decision + Code slice**. See `plan.md` §7.2 (rewritten 2026-10-06; the coordination-session harness of `reports/harness-readiness-2026-09-29.md` is obsolete).
- The Lead authors the constitution, the method and the gate scripts.
- Review is read-only through the door that `node bin/fgos.mjs dispatch decide --for review --needs-soul --has-live-task-access` returns at phase start (`in-process` on 2026-10-06): one review for the documents, one for the gate scripts, at most one re-review each.
- Decision record: Doc review plus the `rfc` preset or the `architecture-advisory` workflow.
- Observe is optional: `fgos metrics case open doc-authority-p4 ...` if the owner wants numbers; never a start condition.
- Start only on explicit authorization of this phase.

### Resume inputs (2026-10-06)

Must be handled before the method is frozen (see `plan.md` §7.3-§7.4):
- rerun conservation on the synced tree with identity carry-forward, then disposition the 43 removed and 248 edited claim units listed in `reports/resync-261006/inventory-comparison.json` and the new routing gap `docs/specs/observe.md`;
- make the plan tooling run on the branch head: the generator must not ingest its own committed inventory artifacts; `scripts/verify-phase-02.mjs` artifact paths must follow the `reports/` move; the content-coupled shipped-path inventory tests used by `scripts/verify-phase-01.mjs` need a decision;
- decide a standing policy for main-side legacy-root edits until cutover instead of one exception batch per sync;
- carry `dropped-claims-register.json` into the conservation checker so a dropped claim fails the gate;
- decide how the Phase 1 "historical path" requirement treats main's move of the knowledge-registry plan to `archive/plans/`.

## Related Code Files

Determined when this phase is authorized; deliverable paths are listed under Requirements.

## Implementation Steps

To be detailed when this phase is explicitly authorized (plan.md §5). Deliverables and rules under Requirements are the contract.

## Success Criteria

- [ ] the method can reject duplicate owners, missing dispositions, missing targets,
  and unauthorized legacy growth mechanically.

## Risk Assessment

Program-level risks and countermeasures: `plan.md` §11.
