---
phase: 3
title: "Build repository-wide inventory and conservation ledger"
status: completed
priority: P1
effort: ""
dependencies: [2]
---

# Phase 3: Build repository-wide inventory and conservation ledger

> Legacy numbering: this was **Phase 02** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

## Overview

**Status:** `completed` — authorized by direct human request on 2026-09-26; independent closure-review verdict **APPROVE**; tagged `documentation-authority-phase-02-20260926`.
(Phase 3 doer assignment, isolated worktree
`/home/vantt/projects/forgentX-phase00-documentation-authority-unification`, branch
`plan/260925-documentation-authority-unification`, immutable base tag
`documentation-authority-phase-01-20260926` at `f0c76c5e590339d9c815038539ff1f4a072c64e4`). Phase 2 gate
passed (see Phase 2 section above). Phase 3 now generates the deterministic repository-wide inventory
and claim-level conservation ledger at `reports/phase-02-doc-inventory.{json,md}`; the generator accounts for file
classification, headings, unheaded prose blocks, mixed/non-Markdown file blocks, inbound/outbound links,
consumer kinds (literal/dynamic/glob/fixture/executable-proof/shipped-contract), source/evidence links,
immutable event/decision refs, local-vs-shipped contract scope, exact duplicates, semantic conflicts, and
exactly one proposed owner for each retained claim row. The gate checker independently recomputes the
in-scope file set and validates structure/vocabulary/claim-owner constraints. Local Phase 3 verification
passed; unresolved gaps/conflicts are explicit findings and still block promotion. Phase 3 remediation E pins identity-registry input explicitly (`--identity-registry`), records registry path/bytes/SHA-256/count binding in inventory metadata, treats unresolved dynamic consumer patterns such as `docs/**/README.md` as standalone unresolved consumer edges, and requires reviewed carry-forward writer use for path moves or unit-map changes. Phase 4–09 remain
unauthorized and untouched, and no migration/promotion/deletion/cutover has occurred.
**Mode:** read-only inventory, followed by reviewed ledger writes
**Purpose:** Account for the real corpus before deciding migration mechanics.

## Requirements

**Inventory dimensions:**

- file class: maintained authority / generated projection / evidence-history;
- area and subcomponent;
- document type;
- claim kinds present;
- current authority status;
- inbound and outbound links;
- code/test/skill/instruction consumers;
- duplicates and conflicts;
- source/evidence relationships and non-Markdown payloads;
- immutable event/decision references to source paths;
- repository-local versus shipped consumer contract;
- target candidate;
- proposed disposition.

**Special rules:**

- mixed files are split at claim level;
- generated and raw evidence payloads are not linted as canonical prose;
- a read-only text scan found no production code opening non-Markdown
  `docs/architect/**` proof payloads directly, but found many source/test/skill
  path references and 566 such payloads; inventory must still detect dynamic,
  glob-based, test-fixture, and executable-proof consumers before relocation;
- current implementation is evidence, not automatic authority;
- missing current behavior documentation is recorded as a gap, not invented;
- unit coverage independently verifies source blobs/counts/digests but intentionally shares the Phase 3 frozen extraction algorithm; it must not be overclaimed as an independent semantic parser;
- `targetOwner` on an area portal is a proposed area-level destination only; final claim anchors and complete partitioning are deferred to a later authorized phase;
- file moves require the reviewed carry-forward writer so persisted opaque IDs are moved deliberately instead of reminted or inferred.

## Architecture

Program-level data model and execution boundary: `plan.md` §5 (Execution Boundary) and §6 (Minimum Migration Data Model).

## Related Code Files

See Requirements.

## Implementation Steps

Executed. See the execution and verification records under `reports/` (legacy numbering) listed in Related Code Files.

## Success Criteria

- [x] every in-scope source is accounted for exactly once at file level;
- [x] every heading/unheaded content block passes the source-coverage floor;
- [x] every retained claim has exactly one proposed target owner;
- [x] all root authorities, area directories, evidence payloads, and shipped path
  conventions are enumerated;
- [x] unresolved conflicts are explicit and block promotion.

## Risk Assessment

Program-level risks and countermeasures: `plan.md` §11.
