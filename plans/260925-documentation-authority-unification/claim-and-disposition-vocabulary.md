# Documentation Migration Claim and Disposition Vocabulary

```txt
Document type: Specification
Audience: Human reviewer, architect, implementer, agent
Purpose: Define the frozen claim-kind, source-disposition and ledger-value vocabulary for the documentation migration
Design status: Accepted (frozen 2026-10-06 by the owner)
Implementation: Implemented (validated by scripts/check-doc-constitution.mjs)
Provenance: plans/260925-documentation-authority-unification/plan.md §6
Writer type: Human + agent coauthor
Canonical for: Migration data model vocabulary
Use this when: Classifying sources and claims for inventory, conservation, and transformation
Do not use this for: Multi-profile Knowledge and Documentation Engine schema
Last reviewed: 2026-10-06
Related:
- `plans/260925-documentation-authority-unification/plan.md`
- `plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json`
- `plans/260925-documentation-authority-unification/minimum-constitution.md`
- `plans/260925-documentation-authority-unification/claim-ledger.schema.json`
- `docs/doc-governance.md`
```

This specification defines the claim-kind vocabulary, the source-disposition
vocabulary, and the allowed values of every claim-ledger field. Version 1 was
the preliminary vocabulary published before inventory. Version 2 is the frozen,
evidence-corrected version: it keeps every version 1 meaning and adds the values
the inventory actually emits.

The machine-readable definition is
[claim-and-disposition-vocabulary.json](claim-and-disposition-vocabulary.json).
The rules that use it are in [minimum-constitution.md](minimum-constitution.md),
and the row shape is [claim-ledger.schema.json](claim-ledger.schema.json).

## 1. Source Disposition Vocabulary (Complete Plan-§6)

Every legacy source file receives exactly one file-level disposition from this
closed set. The `Usage` column records whether the inventory uses the value yet.
`reserved` values are assigned by the transformation phases; their meaning is
unchanged.

| Disposition | Definition | Target owner required? | Rationale required? | Retains authority? | Usage |
|---|---|:---:|:---:|:---:|---|
| `promote` | Source content moves into the target `docs/platform/**` structure as canonical authority. | Yes | No | Yes | in-use |
| `move` | Source file moves directly to target structure with minimal rewriting. | Yes | No | Yes | reserved |
| `merge` | Content from multiple sources is combined into a single canonical target document. | Yes | No | Yes | in-use |
| `split` | Source is partitioned into multiple target documents with claim-level ledger tracking. | Yes | No | Yes | in-use |
| `extract` | Specific claims or contracts are extracted into a dedicated target document. | Yes | No | Yes | reserved |
| `redirect` | Source is replaced with an explicit read-only pointer to the canonical target. | Yes | No | No | reserved |
| `retain-as-evidence` | Source is preserved as immutable historical evidence, test fixture, or audit receipt. | No | Yes | No | in-use |
| `regenerate-from-source` | File is a derived machine projection generated from code, events, or state. | No | No | No | in-use |
| `reclassify-out-of-platform-scope` | File belongs to a non-platform corpus (user knowledge, domain doctrine, etc.). | No | Yes | No | in-use |
| `supersede` | The target carries the WHOLE unit (possibly reworded or restructured) in a form that replaces it, and the source claim is retired. A target that carries only part of the unit is a `partial-carry`, never a `supersede`. | Yes | Yes | No | in-use |
| `partial-carry` | The target carries part of the unit; the rest is named in the row's remainder and is not carried anywhere. Blocks cutover like `unknown-blocking` and never satisfies a promotion gate. | Yes | Yes | No | in-use |
| `archive-with-reason` | Source is retired and relocated to history/archive with a recorded rationale. | No | Yes | No | in-use |
| `delete-as-duplicate` | Source is an unneeded exact or semantic duplicate of another document. | Yes | Yes | No | reserved |
| `delete-as-obsolete` | Source is obsolete with zero evidentiary or historical value. | No | Yes | No | in-use |
| `defer-with-owner` | Source claim is deferred to a named future phase or engine with a named owner. | Yes | Yes | No | reserved |
| `reject-with-rationale` | Proposed candidate design or source was evaluated and rejected with rationale. | No | Yes | No | reserved |
| `unknown-blocking` | Source status is unresolved; blocks cutover until audited and assigned a disposition. | No | Yes | No | in-use |

### 1.1. Invariant rules on dispositions

1. `copied` is strictly forbidden. Copying prose into a new target while leaving legacy text active creates two competing owners.
2. Permanent `keep legacy` is forbidden for maintained platform authority. Legacy platform files must be transformed, redirected, archived, or retired.
3. Every in-scope source file must receive exactly one file-level disposition.

## 2. Claim-Kind Vocabulary

A claim is the smallest independently ownable normative, descriptive,
decisional, contractual, or evidentiary statement. Every kind requires the same
15 ledger fields (`minimumLedgerFields` in the JSON file; version 1 said 14,
which was a counting error).

| Claim kind | Description | Document types | Usage |
|---|---|---|---|
| `normative-law` | Immutable platform axioms and operating laws (L1–L8). | Vision, Platform Foundations | in-use |
| `contract` | Normative schema, protocol, interface invariant, boundary obligation, or handoff rule. | Contract | in-use |
| `specification` | Observable runtime behavior, state model, operations, shared entities, and transitions. | Spec | in-use |
| `architecture` | System or component topology, design rationale, boundary definition, and trade-offs. | Architecture | in-use |
| `decision` | Architectural or product choice, problem statement, options evaluated, rationale, and supersession links. | Decision | in-use |
| `vision` | High-level mission, long-horizon intended direction, scope, and explicit non-scope. | Vision | in-use |
| `intent` | Preserved design intent across simplified implementation slices, must-not-preclude constraints, and revisit triggers. | Intent preservation ledger | in-use |
| `procedure` | Supported operator procedure, runbook, or maintenance instructions. | Guide / runbook | in-use |
| `verification` | Empirical proof, test suite receipt, benchmark output, or verification record supporting a claim. | Verification | in-use |
| `historical-context` | Provenance, historical milestone, retrospective observation, or retired context. | History, Knowledge | in-use |
| `navigation` | Area portal, subcomponent map, reading map, or index routing readers to canonical documents. | Area portal, Subcomponent portal, Reading map | in-use |
| `unclassified` | Placeholder for a unit the inventory could not yet classify. Never final; blocks cutover. | none | in-use |

## 3. Ledger Value Vocabularies

These closed sets bound the claim-ledger fields. `generator-only` means the
generator can emit the value but the committed inventory has none yet;
`registry-only` means it lives in the identity registry, not in the ledger.

| Field | Values |
|---|---|
| `fileClass` (item) | `maintained-authority`, `retained-source`, `history-evidence`, `generated`, `unclassified` (only `unknown-blocking` is allowed for it) |
| `corpus` (item) | `platform-authority`, `user-knowledge`, `history-evidence`, `consumer-project` |
| `authorityKind` (claim) | `legacy-current`, `candidate`, `promoted`, `non-authority`, `unclassified` |
| `status` (claim) | `current`, `future`, `historical` |
| `reviewStatus` (claim) | `blocking`, `pending` in use; `reviewed` in use; `needs-review` registry-only |
| `relations[].type` | `duplicate-content-member` in use; `same-source-indistinguishable-duplicate-blocker` generator-only; `defines`, `constrains`, `implements`, `explains`, `evidenced_by`, `supersedes`, `consumes` reserved |
| `identityStatus` | `carried-forward`, `ambiguous-registry-gap` in use; four further gap values generator-only |

The item field `authorityStatus` and the claim field `authorityKind` share one
vocabulary: the inventory copies the item value into each of its claim rows.

## 4. Changes From Version 1

Each change is recorded with its evidence in `changesFromV1` in the JSON file.

| Id | Change |
|---|---|
| v2-001 | Added claim kind `unclassified`; the gates checker had been adding it by hand. |
| v2-002 | Added the `fileClasses` section with `unclassified` (14 files); `unknown-blocking` now allows that class. |
| v2-003 | Added `authorityKinds`, `claimStatuses`, `reviewStatuses`, `corpora`, `relationTypes`, `identityStatuses`. |
| v2-004 | Marked ten dispositions `reserved`; meanings unchanged. |
| v2-005 | Added `reviewed` (reserved) and `needs-review` (registry-only) review statuses. |
| v2-006 | Corrected the ledger-field count from 14 to 15 in this document. |
| v2-007 | Recorded per-value usage. |

## 5. Amendments

Version 2 is frozen for the meaning of every existing value. A new value or
section is added only as an additive amendment (2.1, 2.2, ...) listed in
`amendments` with its evidence, after the validator passes; the constitution keeps
pinning the major version. Changing or removing a value needs a new major version
and an owner decision. Three amendments exist: 2.1-001 adds the `authorityClasses` section and the class `verification-record`. The canonical verification kind's class was `evidence`, which collided with the locked rule that evidence is not authority (plan §3 item 10); `evidence` now belongs only to non-authority kinds (`evidence-payload`, `history`). Owner decision 2026-10-06. 2.2-001 moves `split`, `supersede`, `archive-with-reason`, `delete-as-obsolete` and the review status `reviewed` from `reserved` to `in-use` (no meaning changes); evidence: the dual pilot used them (see the amendment in the JSON file). 2.3-001 adds the disposition `partial-carry` and tightens the definition of `supersede` (owner ruling 2026-10-07: 134 of 195 `supersede` rows of the blind audit describe missing content). The tightened definition of `supersede` changes the meaning of an existing value; it is an owner-authorized exception to the rule above, recorded in the amendment evidence.

## 6. Related Files

| Relationship | File |
|---|---|
| machine-readable vocabulary | [claim-and-disposition-vocabulary.json](claim-and-disposition-vocabulary.json) |
| rules that use the vocabulary | [minimum-constitution.md](minimum-constitution.md) |
| ledger row schema | [claim-ledger.schema.json](claim-ledger.schema.json) |
| validator | [scripts/check-doc-constitution.mjs](../../scripts/check-doc-constitution.mjs) |
| migration plan | [plan.md](plan.md) |
| documentation governance | [docs/doc-governance.md](../../docs/doc-governance.md) |
