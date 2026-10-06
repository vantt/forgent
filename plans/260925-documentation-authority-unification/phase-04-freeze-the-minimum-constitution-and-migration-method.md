---
phase: 4
title: "Freeze the minimum constitution and migration method"
status: in-progress
priority: P1
effort: ""
dependencies: [3]
---

# Phase 4: Freeze the minimum constitution and migration method

> Legacy numbering: this was **Phase 03** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

## Overview

**Status:** `in-progress`. Authorized by the owner on 2026-10-06; the pre-step ran first and is done.
**Mode:** plan branch
**Purpose:** Turn inventory evidence into a small, testable migration contract.

## Pre-step: gate tooling (owner-authorized 2026-10-06; done)

**Why:** the inventory generator cannot run on the branch head. It reads every text file in the tree, including its own ~250 MB of saved output, and runs out of memory; the 2026-10-06 resume worked around it by generating on a temporary commit without those files (17 s).

**0a (done, commit `6397a9970`):** make `scripts/generate-doc-inventory.mjs` skip its own saved output artifacts. Take the artifact paths from the existing artifact definition (`scripts/doc-inventory-artifact.mjs`) instead of repeating a second list. Add a test first (red) in `test/scripts/generate-doc-inventory.test.mjs`: a tree containing a large artifact at the output location must be ignored, and ordinary inputs must still be counted. Acceptance (measured with scripts, method stated): the generator completes on the branch head without removing any file; peak memory and runtime recorded; the claim count on a tree without artifacts is unchanged by the fix (86,085 at the 2026-10-06 sync, `reports/resync-261006/inventory-comparison.json`); the inventory gate checker `scripts/check-doc-inventory-gates.mjs` still exits 0 on the regenerated inventory. This changes which files the generator reads, not what it counts or how it judges.

**0a result (measured on `50639672a`, `/usr/bin/time -v`):** exit 0, 22.7 s, max RSS 1.92 GB; claim rows 86,085 unchanged; files 4,311; gates clean, 1,361 gaps; consumer edges 105,923 against 101,286 at the resync (plan files changed since then, mostly `reports/resync-261006/`, 4,496 edges). Independent read-only review: no findings of medium or higher. Known limit: artifacts that sat at the plan root before the 2026-09-29 move into `reports/` (commit `4d80eaf29`) are not skipped; this matters only on a commit between 2026-09-26 and 2026-09-29.

**0b (done, commit `3809d692c`):** record the cause of the `verify-phase-02` failure and of the two shipped-path inventory tests that were already failing before 2026-10-06 (on `551687021`), each with the command and output; propose a fix as a decision for the owner. The report is `reports/gate-failures-investigation-261006.md`. Owner decisions on 2026-10-06: (1) `verify-phase-02` is frozen, valid only for its approved range, and is not run on later heads; (2) the two shipped-path tests run on a fixture repository (`639456a8d`); (3) `verify-phase-01` is frozen the same way (it passes unmodified on its approved range); the pointer note at the old knowledge-registry plan path is `39e14c5e7`. See `plan.md` §7.4 and §7.5b.

**Rollback:** `git revert` the generator commit; nothing else depends on it.

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
- Owner decision 2026-10-06: doers may be Sonnet subagents dispatched in-process (`node bin/fgos.mjs dispatch decide`, answer `in-process`). The Lead plans, reviews, verifies independently and commits, and reviews every change before each commit. This supersedes "the Lead authors" for script, test and document edits.
- Review is read-only through the door that `node bin/fgos.mjs dispatch decide --for review --needs-soul --has-live-task-access` returns at phase start (`in-process` on 2026-10-06): one review for the documents, one for the gate scripts, at most one re-review each.
- Decision record: Doc review plus `ak:plan red-team` (owner, 2026-10-06; `rfc` and `architecture-advisory` are not finished and are not used).
- Observe is optional: `fgos metrics case open doc-authority-p4 ...` if the owner wants numbers; never a start condition.
- Authorized 2026-10-06.

### Resume inputs (2026-10-06)

Must be handled before the method is frozen (see `plan.md` §7.3-§7.4):
- rerun conservation on the synced tree with identity carry-forward, then disposition the 43 removed and 248 edited claim units listed in `reports/resync-261006/inventory-comparison.json` and the new routing gap `docs/specs/observe.md`;
- carry `dropped-claims-register.json` into the conservation checker so a dropped claim fails the gate;
- `scripts/verify-phase-02.mjs` is frozen (owner decision 2026-10-06): do not repair its paths; build this phase's own gates instead;
- the early move of the legacy-docs ratchet to main is deferred (`plan.md` §7.5b, decision F); keep re-accounting main-side legacy edits at each sync;
- known generator limit: artifacts that sat at the plan root before the 2026-09-29 move into `reports/` are not skipped; matters only when generating on a commit between 2026-09-26 and 2026-09-29.

Already decided (see `plan.md` §7.5b): the standing policy for main-side legacy-root edits and the knowledge-registry plan move.

## Related Code Files

Step 2 files: `minimum-constitution.{json,md}`, `claim-and-disposition-vocabulary.{json,md}`, `claim-ledger.schema.json` (this plan directory), `scripts/check-doc-constitution.mjs`, `test/scripts/check-doc-constitution.test.mjs`. Existing gate scripts: `scripts/check-doc-inventory-gates.mjs`, `scripts/check-legacy-docs-ratchet.mjs`. Later steps add their own paths under Requirements.

## Implementation Steps

Done:

1. Pre-steps 0a and 0b (generator memory fix, gate-failure investigation).
2. Step 1: identity carry-forward, dispositions of the removed and edited units, dropped-claims register in the inventory gates.
3. Step 2: minimum constitution (`minimum-constitution.{json,md}`), vocabulary version 2, `claim-ledger.schema.json`, `scripts/check-doc-constitution.mjs` with tests. Freeze is pending owner decisions (metadata level; see `reports/minimum-constitution-261006.md`).

Pending:

3. Conservation checker: row-set conservation against the previous registry, one owner per `semanticClaimId`, dropped-claims register per entry.
4. Alias table and resolver contract; retirement-check dry-run including a validator cutover mode; evidence relocation policy and consumer proof.
5. Documentation-cutover lease design; candidate-status metadata check (candidate status read from the switchboard, not from `Design status`).

## Success Criteria

- [x] constitution, vocabulary, row schema and validator exist and pass on the full ledger (step 2)
- [ ] the method can reject duplicate owners, missing dispositions, missing targets,
  and unauthorized legacy growth mechanically.

## Risk Assessment

Program-level risks and countermeasures: `plan.md` §11.
