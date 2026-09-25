# Documentation Migration Claim and Disposition Vocabulary

```txt
Document type: Specification
Audience: Human reviewer, architect, implementer, agent
Purpose: Define the preliminary claim-kind vocabulary and complete plan-§6 source-disposition vocabulary
Design status: Accepted (Phase 01)
Implementation: Implemented (Phase 01)
Provenance: plans/260925-documentation-authority-unification/plan.md §6
Writer type: Human + agent coauthor
Canonical for: Phase 01 migration data model vocabulary
Use this when: Classifying sources and claims for inventory, conservation, and transformation
Do not use this for: Multi-profile Knowledge and Documentation Engine schema
Last reviewed: 2026-09-25
Related:
- `plans/260925-documentation-authority-unification/plan.md`
- `plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json`
- `docs/doc-governance.md`
```

This specification defines the preliminary machine-readable claim-kind vocabulary and
the complete source-disposition vocabulary required by Phase 01 before full repository-wide
inventory (Phase 02) and minimum constitution freeze (Phase 03).

The machine-readable definition is stored alongside this document in
[claim-and-disposition-vocabulary.json](claim-and-disposition-vocabulary.json).

## 1. Source Disposition Vocabulary (Complete Plan-§6)

Every legacy source file considered during migration receives exactly one file-level
disposition from this closed set:

| Disposition | Definition | Target Owner Required? | Rationale Required? | Retains Authority? |
|---|---|:---:|:---:|:---:|
| `promote` | Source content moves into the target `docs/platform/**` structure as canonical authority. | Yes | No | Yes |
| `move` | Source file moves directly to target structure with minimal rewriting. | Yes | No | Yes |
| `merge` | Content from multiple sources is combined into a single canonical target document. | Yes | No | Yes |
| `split` | Source is partitioned into multiple target documents with claim-level ledger tracking. | Yes | No | Yes |
| `extract` | Specific claims or contracts are extracted into a dedicated target document. | Yes | No | Yes |
| `redirect` | Source is replaced with an explicit read-only pointer to the canonical target. | Yes | No | No |
| `retain-as-evidence` | Source is preserved as immutable historical evidence, test fixture, or audit receipt. | No | Yes | No |
| `regenerate-from-source` | File is a derived machine projection generated from code, events, or state. | No | No | No |
| `reclassify-out-of-platform-scope` | File belongs to a non-platform corpus (user knowledge, domain doctrine, etc.). | No | Yes | No |
| `supersede` | Source or claim has been explicitly superseded by newer approved decisions and retired. | Yes | Yes | No |
| `archive-with-reason` | Source is retired and relocated to history/archive with a recorded rationale. | No | Yes | No |
| `delete-as-duplicate` | Source is an unneeded exact or semantic duplicate of another document. | Yes | Yes | No |
| `delete-as-obsolete` | Source is obsolete with zero evidentiary or historical value. | No | Yes | No |
| `defer-with-owner` | Source claim is deferred to a named future phase or engine with a named owner. | Yes | Yes | No |
| `reject-with-rationale` | Proposed candidate design or source was evaluated and rejected with rationale. | No | Yes | No |
| `unknown-blocking` | Source status is unresolved; blocks cutover until audited and assigned a disposition. | No | Yes | No |

### Invariant Rules on Dispositions

1. `copied` is strictly forbidden. Copying prose into a new target while leaving legacy text active creates two competing owners.
2. Permanent `keep legacy` is forbidden for maintained platform authority. Legacy platform files must be transformed, redirected, archived, or retired.
3. Every in-scope source file must receive exactly one file-level disposition.

## 2. Preliminary Claim-Kind Vocabulary

A claim is the smallest independently ownable normative, descriptive, decisional,
contractual, or evidentiary statement. This preliminary vocabulary covers all
platform documentation claims:

| Claim Kind | Description | Document Types | Minimum Ledger Fields |
|---|---|---|---|
| `normative-law` | Immutable platform axioms and operating laws (L1–L8). | Vision, Platform Foundations | 14 ledger fields |
| `contract` | Normative schema, protocol, interface invariant, boundary obligation, or handoff rule. | Contract | 14 ledger fields |
| `specification` | Observable runtime behavior, state model, operations, shared entities, and transitions. | Spec | 14 ledger fields |
| `architecture` | System or component topology, design rationale, boundary definition, and trade-offs. | Architecture | 14 ledger fields |
| `decision` | Architectural or product choice, problem statement, options evaluated, rationale, and supersession links. | Decision | 14 ledger fields |
| `vision` | High-level mission, long-horizon intended direction, scope, and explicit non-scope. | Vision | 14 ledger fields |
| `intent` | Preserved design intent across simplified implementation slices, must-not-preclude constraints, and revisit triggers. | Intent preservation ledger | 14 ledger fields |
| `procedure` | Supported operator procedure, runbook, or maintenance instructions. | Guide / runbook | 14 ledger fields |
| `verification` | Empirical proof, test suite receipt, benchmark output, or verification record supporting a claim. | Verification | 14 ledger fields |
| `historical-context` | Provenance, historical milestone, retrospective observation, or retired context. | History, Knowledge | 14 ledger fields |
| `navigation` | Area portal, subcomponent map, reading map, or index routing readers to canonical documents. | Area portal, Subcomponent portal, Reading map | 14 ledger fields |

## 3. Related Files

| Relationship | File |
|---|---|
| machine-readable vocabulary | [claim-and-disposition-vocabulary.json](claim-and-disposition-vocabulary.json) |
| migration plan | [plan.md](plan.md) |
| documentation governance | [docs/doc-governance.md](../../docs/doc-governance.md) |
