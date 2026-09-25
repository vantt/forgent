# Phase 01 Execution Record

```txt
Phase: 01 — Contain further divergence
Assignment: asgn_pi_lead_phase01_review_fix_op_001
Role: doer
Persona: scope-disciplined-review-finding-implementer
Authorization: Direct human request, 2026-09-25
Branch: documentation-authority-unification--phase-01-review-fix
Base: 38a337ecb31dc97b78aca012eba0da89c003a927 (tag peel: documentation-authority-phase-00-20260925; annotated tag object cdbae3b9ebcf2b54c9ed726576fe0374e8cdcc77)
Review unit: BASE..FIXED_END (caller-supplied immutable commit parameter; tagging forbidden until review passes; recorded in handoff result)
Status: Phase 01 implementation complete, review changes requested/pending re-review
Initial branch state: clean at Phase 00 tag
Main checkout: reference/read-only; untouched
```

## Scope And Dependencies

In scope:
- Operative transitional authority switchboard (`docs/transitional-switchboard.md`, `plans/260925-documentation-authority-unification/transitional-switchboard.json`) backed by the Phase 00 authority map.
- Preliminary machine-readable claim-kind vocabulary and complete plan-§6 source-disposition vocabulary (`plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.{json,md}`).
- Deterministic machine-readable legacy-root file/digest baseline (`scripts/check-legacy-docs-ratchet.baseline.json`) with precise inclusion/symlink/digest/order semantics.
- Legacy-growth and unaccounted-edit ratchet (`scripts/check-legacy-docs-ratchet.mjs`) and comprehensive test suite (`test/scripts/check-legacy-docs-ratchet.test.mjs`).
- Migration-time one-owner authoring rules (`docs/platform/migration-authoring-rules.md`) and explicit minimal reviewed exceptions (`scripts/check-legacy-docs-ratchet.exceptions.json`).
- Verified stale standing route corrections (updated `docs/specs/reading-map.md` replacing defunct `fgos-coding-compounding` with `fgos-coding-knowledge` and routing via switchboard).
- Deterministic machine-readable inventory of path conventions shipped through `core/skills`, `domains/**`, generated instructions, and plugins, separating repository-local from consumer-project contracts (`scripts/generate-shipped-path-inventory.mjs`, `plans/260925-documentation-authority-unification/shipped-path-conventions-inventory.{json,md}`, `test/scripts/generate-shipped-path-inventory.test.mjs`).
- Truthful plan and routing status (Phase 01 authorized and completed; Phases 02–09 remain unauthorized).
- CHANGELOG Unreleased entry.

Out of scope:
- Phase 02–09 deliverables.
- No migration, promotion, relocation, deletion, or archiving of legacy documentation.
- No moving evidence payloads or changing runtime dependencies.
- No building platform alias tables or claim ledger.
- No mutating main, pushing, or tagging.
- Historical knowledge-registry plan and all 12 phase files remain byte-identical.

## Declared Mutation Footprint

- `CHANGELOG.md`
- `docs/doc-governance.md`
- `docs/reading-map.md`
- `docs/specs/reading-map.md`
- `docs/transitional-switchboard.md`
- `docs/platform/README.md`
- `docs/platform/migration-authoring-rules.md`
- `plans/260925-documentation-authority-unification/plan.md`
- `plans/260925-documentation-authority-unification/transitional-switchboard.json`
- `plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json`
- `plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.md`
- `plans/260925-documentation-authority-unification/shipped-path-conventions-inventory.json`
- `plans/260925-documentation-authority-unification/shipped-path-conventions-inventory.md`
- `plans/260925-documentation-authority-unification/phase-01-execution-record.md`
- `plans/260925-documentation-authority-unification/phase-01-verification.md`
- `scripts/check-legacy-docs-ratchet.mjs`
- `scripts/check-legacy-docs-ratchet.baseline.json`
- `scripts/check-legacy-docs-ratchet.exceptions.json`
- `scripts/generate-shipped-path-inventory.mjs`
- `test/scripts/check-legacy-docs-ratchet.test.mjs`
- `test/scripts/generate-shipped-path-inventory.test.mjs`

## Component Boundary Statement

No component-boundary change. All changes are documentation governance, authority switchboards,
containment ratchets, and developer tooling; no runtime system component boundaries or
cross-component contracts were modified.

## Review Findings Implementation (2026-09-25)

The independent review (asgn_pi_lead_phase01_review_fix_op_003) accepted five targeted findings for Phase 01:
1. **Finding F1 — Root-Aware and Case-Safe Ratchet Classification**:
   - `scripts/check-legacy-docs-ratchet.mjs` classification is made root-aware and case-safe:
     - Under `docs/specs/`: Every file is maintained authority by default regardless of extension or case (`.txt`, `.yml`, `.MD`), except explicitly enumerated generated projections (`docs/specs/platform-foundations.md`). Non-authority is never inferred merely from arbitrary extensions.
     - Under `docs/architect/`: Markdown case-insensitively (`.md`, `.MD`) is maintained or retained prose, while non-Markdown proof payloads (such as `proof.json`, `.png`) can be `history-evidence`.
   - Baseline class spoofing protection fails closed: modifying a baselined file whose baseline class OR live classification is maintained prose triggers `unaccounted-edit` alongside `file-class-mismatch`.
   - Added tests proving `docs/specs/*.txt`, `*.yml`, `*.MD` are blocked, `docs/architect/**/proof.json` new/edit are permitted, generated new/edit permitted, and baseline class spoof remains fail-closed.
2. **Finding F2 — Committed Fixed-Range Verification and Tree-Only Inspection**:
   - Authoritative verification snippets in `phase-01-verification.md` REQUIRE explicit `BASE` and `FIXED_END` (all defaults and `HEAD` text removed), validate both resolve to commits, and inspect committed blobs only.
   - The Markdown link checker reads changed Markdown blobs directly using `git show FIXED_END:path` and tests target existence in `FIXED_END`'s git tree (`git ls-tree -r --name-only FIXED_END`), never `Path.cwd()`, working tree, or `git status`.
   - All diff checks pass explicit `BASE..FIXED_END`.
3. **Finding F3 — Curated Projection Secondary Attributes**:
   - `scripts/generate-shipped-path-inventory.mjs` classifies `docs/specs/platform-foundations.md` as `referenceKind: "generated-mirror"`, `sourceRole: "generated-projection-non-authority"`, and `isSafeRewriteTarget: false`.
   - Curated projection remains editable in ratchet without exception as required by Finding 1.
   - Locked laws and anchor tests (`test/docs/rul11-anchor-phrase.test.mjs`) remain strictly unaltered.
4. **Finding F4 — Real ISO Calendar Date Validation and Expiry Boundary**:
   - Added `isValidIsoCalendarDate` in `scripts/check-legacy-docs-ratchet.mjs` validating real calendar dates in `YYYY-MM-DD` format (rejecting impossible dates such as `2026-02-30`, `2026-13-40`, `2026-04-31`, and non-leap year `2026-02-29`).
   - Defined explicit expiry boundary: an exception expires on its expiry date (i.e. `checkDate >= expiry` is expired and flagged with `expired-exception`; active only when `checkDate < expiry`).
   - Added comprehensive tests for impossible date rejection and explicit boundary conditions.
5. **Finding F5 — Authoring Rules Alignment**:
   - Aligned `docs/platform/migration-authoring-rules.md` §2 with policy-aware generated and history-evidence exemptions while maintaining strict exception requirements for maintained prose (`maintained-authority`, `retained-source`).

## Verification Summary

All verification gates passed:
1. Focused ratchet test suite: 28/28 passed in 280ms (`test/scripts/check-legacy-docs-ratchet.test.mjs`), including root-aware case-safe classification, exact case-sensitive generated projection matching, calendar date validation, explicit expiry boundary, and anti-spoof fail-closed edit containment.
2. Focused shipped path inventory test suite: 8/8 passed in 180ms (`test/scripts/generate-shipped-path-inventory.test.mjs`), including deterministic referenceKind/existenceStatus/sourceRole/resolutionStatus classification, nonexistent example non-target detection, and platform-foundations generated-mirror classification.
   Combined focused suites: 36/36 passed in 280ms.
3. Ratchet self-check: clean on repository (994 files checked, 1 accounted edit, 0 unaccounted edits, 0 unreviewed new files).
4. Deterministic regeneration comparisons: verified identical JSON output for ratchet baseline and shipped-path inventory (byte-identical `cmp` against checked-in files).
5. Historical knowledge-registry plan and all 12 phase files verified byte-identical (all 13 passed sha256sum).
6. Documentation checks and relative link verification passed: all changed Markdown blobs in range `BASE..FIXED_END` checked against `FIXED_END` tree, all relative links exist.
7. Git diff --check clean across committed range `BASE..FIXED_END`.
8. Full suite (FULL_TEST): `npm test` passed cleanly (7746 total tests across 27 suites, 7670 passed, 0 failed, 8 skipped, 68 todo, duration ~5.5 minutes; log retained at `/tmp/phase01-final-full-suite.log`).

## Review Boundary and Commit Records

- Base: `38a337ecb31dc97b78aca012eba0da89c003a927` (tag: `documentation-authority-phase-00-20260925`; annotated tag object `cdbae3b9ebcf2b54c9ed726576fe0374e8cdcc77`)
- Review range: `BASE..FIXED_END` where `BASE` is pinned to `38a337ecb31dc97b78aca012eba0da89c003a927` and `FIXED_END` is the caller/reviewer-supplied immutable commit SHA on `documentation-authority-unification--phase-01-review-fix`.
- Reviewer invocation: The independent reviewer invokes verification with `BASE=38a337ecb31dc97b78aca012eba0da89c003a927 FIXED_END=<commit-sha>`. No self-referential fabricated SHAs are committed. The exact `FIXED_END` commit SHA is recorded in `agent-result.json` and handoff report upon completion.
- Tagging status: Tagging is strictly forbidden until independent review passes. No git tag is created.
- Phase 01 status: `Phase 01 implementation complete, review changes requested/pending re-review` (never closed).
- Residual blockers: Phases 02–09 remain unauthorized and require separate human authorization before commencement.
