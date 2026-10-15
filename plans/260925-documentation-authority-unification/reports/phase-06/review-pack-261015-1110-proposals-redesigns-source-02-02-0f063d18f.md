# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-02-documentation-system-design.json
Original shard SHA256: ea7cb09e88b4de9c1c0f671e8890fe748b7fb0a6e34be752c4cab6a50f8c6307
Source file: docs/architect/documentation-system-design.md
Part 2/2; entries: **49**. Source-file group 2/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (0): none.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (0): none.

Weak-exact/Judgment population: 17; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_6f983d3e13b68c8d9a556c3d085c7993

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#8-metadata, lines 445–445.
Target: docs/platform/documentation/architecture/documentation-system-design.md#8-metadata.
Source digest: ad6112060ff1753b7a058e14d67688182466d87342f6c3afdc9e7428df6c9acf
Target digest: ad6112060ff1753b7a058e14d67688182466d87342f6c3afdc9e7428df6c9acf
Shown source SHA256: 7086d39bb4af99bea1fc63f174de7198fce444278c42a95bfc3b3fd3e8ce7731
Shown target SHA256: 7086d39bb4af99bea1fc63f174de7198fce444278c42a95bfc3b3fd3e8ce7731

### Proposed decision

```json
{
  "claimId": "claim_6f983d3e13b68c8d9a556c3d085c7993",
  "sourceUnitDigest": "ad6112060ff1753b7a058e14d67688182466d87342f6c3afdc9e7428df6c9acf",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "8-metadata",
  "targetUnitDigest": "ad6112060ff1753b7a058e14d67688182466d87342f6c3afdc9e7428df6c9acf",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#8-metadata (lines 445–445) is carried at docs/platform/documentation/architecture/documentation-system-design.md#8-metadata (lines 469–469); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 8. Metadata

Use compact metadata, either as front matter or as an equivalent registry entry.

Baseline fields:

```txt
title
doc_type
canonicality: canonical | discussion | generated
authority_scope
status: draft | proposed | approved | superseded | archived
owner
writers
approvers
approved_at
effective_at
last_reviewed_at
review_due
supersedes
superseded_by
depends_on
related_docs
evidence
change_trigger
```

Generated docs additionally declare:

```txt
source_of_truth
generator
generator_version
generated_at
freshness_check
do_not_edit: true
```

Metadata should not become ceremony. Each field must answer a practical
question: who owns this, what is it authoritative for, who approved it, what
evidence supports it, and when should it be reviewed?
````

### Full target shown text

````text
## 8. Metadata

Use compact metadata, either as front matter or as an equivalent registry entry.

Baseline fields:

```txt
title
doc_type
canonicality: canonical | discussion | generated
authority_scope
status: draft | proposed | approved | superseded | archived
owner
writers
approvers
approved_at
effective_at
last_reviewed_at
review_due
supersedes
superseded_by
depends_on
related_docs
evidence
change_trigger
```

Generated docs additionally declare:

```txt
source_of_truth
generator
generator_version
generated_at
freshness_check
do_not_edit: true
```

Metadata should not become ceremony. Each field must answer a practical
question: who owns this, what is it authoritative for, who approved it, what
evidence supports it, and when should it be reviewed?
````

## claim_2471a1c48b8034f5c73de12ef2bd3589

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-59, lines 447–447.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-62.
Source digest: 21b0209688429a924d3bebf20af230b4d5ebce6231dd926b878454585ecb5b0a
Target digest: 21b0209688429a924d3bebf20af230b4d5ebce6231dd926b878454585ecb5b0a
Shown source SHA256: 21b0209688429a924d3bebf20af230b4d5ebce6231dd926b878454585ecb5b0a
Shown target SHA256: 21b0209688429a924d3bebf20af230b4d5ebce6231dd926b878454585ecb5b0a

### Proposed decision

```json
{
  "claimId": "claim_2471a1c48b8034f5c73de12ef2bd3589",
  "sourceUnitDigest": "21b0209688429a924d3bebf20af230b4d5ebce6231dd926b878454585ecb5b0a",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-62",
  "targetUnitDigest": "21b0209688429a924d3bebf20af230b4d5ebce6231dd926b878454585ecb5b0a",
  "targetAncestry": [
    "Documentation System Design",
    "8. Metadata"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-59 (lines 447–447) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-62 (lines 471–471); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Use compact metadata, either as front matter or as an equivalent registry entry.
```

### Full target shown text

```text
Use compact metadata, either as front matter or as an equivalent registry entry.
```

## claim_8551e78627e10e3dad7c1929c9a09bf4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-60, lines 449–470.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-63.
Source digest: bc189288bfdce9dee51b72ba2e5fb0fc39324dd1e9205c905be6328dc4bdc95b
Target digest: bc189288bfdce9dee51b72ba2e5fb0fc39324dd1e9205c905be6328dc4bdc95b
Shown source SHA256: bc189288bfdce9dee51b72ba2e5fb0fc39324dd1e9205c905be6328dc4bdc95b
Shown target SHA256: bc189288bfdce9dee51b72ba2e5fb0fc39324dd1e9205c905be6328dc4bdc95b

### Proposed decision

```json
{
  "claimId": "claim_8551e78627e10e3dad7c1929c9a09bf4",
  "sourceUnitDigest": "bc189288bfdce9dee51b72ba2e5fb0fc39324dd1e9205c905be6328dc4bdc95b",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-63",
  "targetUnitDigest": "bc189288bfdce9dee51b72ba2e5fb0fc39324dd1e9205c905be6328dc4bdc95b",
  "targetAncestry": [
    "Documentation System Design",
    "8. Metadata"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-60 (lines 449–470) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-63 (lines 473–494); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
Baseline fields:

```txt
title
doc_type
canonicality: canonical | discussion | generated
authority_scope
status: draft | proposed | approved | superseded | archived
owner
writers
approvers
approved_at
effective_at
last_reviewed_at
review_due
supersedes
superseded_by
depends_on
related_docs
evidence
change_trigger
```
````

### Full target shown text

````text
Baseline fields:

```txt
title
doc_type
canonicality: canonical | discussion | generated
authority_scope
status: draft | proposed | approved | superseded | archived
owner
writers
approvers
approved_at
effective_at
last_reviewed_at
review_due
supersedes
superseded_by
depends_on
related_docs
evidence
change_trigger
```
````

## claim_b672ea78b4694a80609a491fcae61b82

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-61, lines 472–472.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-64.
Source digest: aa363dc9381146743f854ff9ce3429a15cc15f1c6a56364b34b542e06a9c7add
Target digest: aa363dc9381146743f854ff9ce3429a15cc15f1c6a56364b34b542e06a9c7add
Shown source SHA256: aa363dc9381146743f854ff9ce3429a15cc15f1c6a56364b34b542e06a9c7add
Shown target SHA256: aa363dc9381146743f854ff9ce3429a15cc15f1c6a56364b34b542e06a9c7add

### Proposed decision

```json
{
  "claimId": "claim_b672ea78b4694a80609a491fcae61b82",
  "sourceUnitDigest": "aa363dc9381146743f854ff9ce3429a15cc15f1c6a56364b34b542e06a9c7add",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-64",
  "targetUnitDigest": "aa363dc9381146743f854ff9ce3429a15cc15f1c6a56364b34b542e06a9c7add",
  "targetAncestry": [
    "Documentation System Design",
    "8. Metadata"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-61 (lines 472–472) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-64 (lines 496–496); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Generated docs additionally declare:
```

### Full target shown text

```text
Generated docs additionally declare:
```

## claim_aa0c35e9c2db3061764c324ad5e3fe6d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-62, lines 474–481.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-65.
Source digest: 024fc3239ffcd85813170a3fe2b8f39d633a70001ff9e187d55de23a2371d818
Target digest: 024fc3239ffcd85813170a3fe2b8f39d633a70001ff9e187d55de23a2371d818
Shown source SHA256: 024fc3239ffcd85813170a3fe2b8f39d633a70001ff9e187d55de23a2371d818
Shown target SHA256: 024fc3239ffcd85813170a3fe2b8f39d633a70001ff9e187d55de23a2371d818

### Proposed decision

```json
{
  "claimId": "claim_aa0c35e9c2db3061764c324ad5e3fe6d",
  "sourceUnitDigest": "024fc3239ffcd85813170a3fe2b8f39d633a70001ff9e187d55de23a2371d818",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-65",
  "targetUnitDigest": "024fc3239ffcd85813170a3fe2b8f39d633a70001ff9e187d55de23a2371d818",
  "targetAncestry": [
    "Documentation System Design",
    "8. Metadata"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-62 (lines 474–481) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-65 (lines 498–505); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
source_of_truth
generator
generator_version
generated_at
freshness_check
do_not_edit: true
```
````

### Full target shown text

````text
```txt
source_of_truth
generator
generator_version
generated_at
freshness_check
do_not_edit: true
```
````

## claim_589b42aac01a66433ed6f852e708f40c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-63, lines 483–485.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-66.
Source digest: db658be3f781bfae975dabdd21c7f13e0a918db402a7c6136e622fc2cf539749
Target digest: db658be3f781bfae975dabdd21c7f13e0a918db402a7c6136e622fc2cf539749
Shown source SHA256: db658be3f781bfae975dabdd21c7f13e0a918db402a7c6136e622fc2cf539749
Shown target SHA256: db658be3f781bfae975dabdd21c7f13e0a918db402a7c6136e622fc2cf539749

### Proposed decision

```json
{
  "claimId": "claim_589b42aac01a66433ed6f852e708f40c",
  "sourceUnitDigest": "db658be3f781bfae975dabdd21c7f13e0a918db402a7c6136e622fc2cf539749",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-66",
  "targetUnitDigest": "db658be3f781bfae975dabdd21c7f13e0a918db402a7c6136e622fc2cf539749",
  "targetAncestry": [
    "Documentation System Design",
    "8. Metadata"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-63 (lines 483–485) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-66 (lines 507–509); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Metadata should not become ceremony. Each field must answer a practical
question: who owns this, what is it authoritative for, who approved it, what
evidence supports it, and when should it be reviewed?
```

### Full target shown text

```text
Metadata should not become ceremony. Each field must answer a practical
question: who owns this, what is it authoritative for, who approved it, what
evidence supports it, and when should it be reviewed?
```

## claim_0ca0383a220ee7805ee17a19ce1ef9a7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#9-writing-method, lines 487–487.
Target: docs/platform/documentation/architecture/documentation-system-design.md#9-writing-method.
Source digest: 2eaf7e7684cc8a8bc8b55987959d34db92229b7a8e18db6722ba76e5261dbf25
Target digest: 2eaf7e7684cc8a8bc8b55987959d34db92229b7a8e18db6722ba76e5261dbf25
Shown source SHA256: b6efad4ae9cf13372a5a218c857da095e3173bfd2171a830ec11fe26adb2504c
Shown target SHA256: b6efad4ae9cf13372a5a218c857da095e3173bfd2171a830ec11fe26adb2504c

### Proposed decision

```json
{
  "claimId": "claim_0ca0383a220ee7805ee17a19ce1ef9a7",
  "sourceUnitDigest": "2eaf7e7684cc8a8bc8b55987959d34db92229b7a8e18db6722ba76e5261dbf25",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "9-writing-method",
  "targetUnitDigest": "2eaf7e7684cc8a8bc8b55987959d34db92229b7a8e18db6722ba76e5261dbf25",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#9-writing-method (lines 487–487) is carried at docs/platform/documentation/architecture/documentation-system-design.md#9-writing-method (lines 511–511); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 9. Writing Method

Use these rules across canonical docs:

- Put the conclusion before the mechanism.
- Separate facts, decisions, requirements, proposals, and evidence visibly.
- Define stable terms once and link to their canonical definition.
- Make normative statements testable.
- Preserve meaningful dissent and rejected alternatives.
- Use diagrams only when they clarify boundaries, ownership, flow, or decision
  shape.
- Use numbered section headings in maintained docs so sections are easy to cite
  during review, discussion, decisions, and migration.
- Prefer progressive disclosure: portal -> overview -> spec -> architecture /
  contract / decision -> proof.
- Link to authority instead of copying authority.
- Treat agent authorship as provenance, not authority.
```

### Full target shown text

```text
## 9. Writing Method

Use these rules across canonical docs:

- Put the conclusion before the mechanism.
- Separate facts, decisions, requirements, proposals, and evidence visibly.
- Define stable terms once and link to their canonical definition.
- Make normative statements testable.
- Preserve meaningful dissent and rejected alternatives.
- Use diagrams only when they clarify boundaries, ownership, flow, or decision
  shape.
- Use numbered section headings in maintained docs so sections are easy to cite
  during review, discussion, decisions, and migration.
- Prefer progressive disclosure: portal -> overview -> spec -> architecture /
  contract / decision -> proof.
- Link to authority instead of copying authority.
- Treat agent authorship as provenance, not authority.
```

## claim_52ef85d159608a064186b60a6f5405aa

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-64, lines 489–489.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-67.
Source digest: 8968e335d3309a5fd8ff77b90d2ef7fded4e89389d749f88eadafb89bfd814f7
Target digest: 8968e335d3309a5fd8ff77b90d2ef7fded4e89389d749f88eadafb89bfd814f7
Shown source SHA256: 8968e335d3309a5fd8ff77b90d2ef7fded4e89389d749f88eadafb89bfd814f7
Shown target SHA256: 8968e335d3309a5fd8ff77b90d2ef7fded4e89389d749f88eadafb89bfd814f7

### Proposed decision

```json
{
  "claimId": "claim_52ef85d159608a064186b60a6f5405aa",
  "sourceUnitDigest": "8968e335d3309a5fd8ff77b90d2ef7fded4e89389d749f88eadafb89bfd814f7",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-67",
  "targetUnitDigest": "8968e335d3309a5fd8ff77b90d2ef7fded4e89389d749f88eadafb89bfd814f7",
  "targetAncestry": [
    "Documentation System Design",
    "9. Writing Method"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-64 (lines 489–489) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-67 (lines 513–513); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Use these rules across canonical docs:
```

### Full target shown text

```text
Use these rules across canonical docs:
```

## claim_f7df64e38ac8a92071c076fc8a880354

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-65, lines 491–503.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-68.
Source digest: 7440fb0d24c0114b51f96fb63b3487fad88b7e50b2f9d5775fc89993381165ba
Target digest: 7440fb0d24c0114b51f96fb63b3487fad88b7e50b2f9d5775fc89993381165ba
Shown source SHA256: 7440fb0d24c0114b51f96fb63b3487fad88b7e50b2f9d5775fc89993381165ba
Shown target SHA256: 7440fb0d24c0114b51f96fb63b3487fad88b7e50b2f9d5775fc89993381165ba

### Proposed decision

```json
{
  "claimId": "claim_f7df64e38ac8a92071c076fc8a880354",
  "sourceUnitDigest": "7440fb0d24c0114b51f96fb63b3487fad88b7e50b2f9d5775fc89993381165ba",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-68",
  "targetUnitDigest": "7440fb0d24c0114b51f96fb63b3487fad88b7e50b2f9d5775fc89993381165ba",
  "targetAncestry": [
    "Documentation System Design",
    "9. Writing Method"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-65 (lines 491–503) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-68 (lines 515–527); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- Put the conclusion before the mechanism.
- Separate facts, decisions, requirements, proposals, and evidence visibly.
- Define stable terms once and link to their canonical definition.
- Make normative statements testable.
- Preserve meaningful dissent and rejected alternatives.
- Use diagrams only when they clarify boundaries, ownership, flow, or decision
  shape.
- Use numbered section headings in maintained docs so sections are easy to cite
  during review, discussion, decisions, and migration.
- Prefer progressive disclosure: portal -> overview -> spec -> architecture /
  contract / decision -> proof.
- Link to authority instead of copying authority.
- Treat agent authorship as provenance, not authority.
```

### Full target shown text

```text
- Put the conclusion before the mechanism.
- Separate facts, decisions, requirements, proposals, and evidence visibly.
- Define stable terms once and link to their canonical definition.
- Make normative statements testable.
- Preserve meaningful dissent and rejected alternatives.
- Use diagrams only when they clarify boundaries, ownership, flow, or decision
  shape.
- Use numbered section headings in maintained docs so sections are easy to cite
  during review, discussion, decisions, and migration.
- Prefer progressive disclosure: portal -> overview -> spec -> architecture /
  contract / decision -> proof.
- Link to authority instead of copying authority.
- Treat agent authorship as provenance, not authority.
```

## claim_a00e7c8510fa853044b6849ad2399dfb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#10-linking-discipline, lines 505–505.
Target: docs/platform/documentation/architecture/documentation-system-design.md#10-linking-discipline.
Source digest: ab9a430fb66d33497c8dd3609f81b7cfdf6354a6da19aa3ac1094e59eb927d85
Target digest: ab9a430fb66d33497c8dd3609f81b7cfdf6354a6da19aa3ac1094e59eb927d85
Shown source SHA256: dd67fe2a52b1e8c71e5af6ec5dfe7646a72d92e6e8a5c45da7edcdf6321fcfd9
Shown target SHA256: dd67fe2a52b1e8c71e5af6ec5dfe7646a72d92e6e8a5c45da7edcdf6321fcfd9

### Proposed decision

```json
{
  "claimId": "claim_a00e7c8510fa853044b6849ad2399dfb",
  "sourceUnitDigest": "ab9a430fb66d33497c8dd3609f81b7cfdf6354a6da19aa3ac1094e59eb927d85",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "10-linking-discipline",
  "targetUnitDigest": "ab9a430fb66d33497c8dd3609f81b7cfdf6354a6da19aa3ac1094e59eb927d85",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#10-linking-discipline (lines 505–505) is carried at docs/platform/documentation/architecture/documentation-system-design.md#10-linking-discipline (lines 529–529); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 10. Linking Discipline

Every maintained document participates in the reading graph.

Area README links to:

- `spec.md`;
- main architecture docs;
- owned contracts;
- verification/proof docs;
- active proposals or discussions;
- related areas.

Spec links to:

- area README;
- contracts owned and consumed;
- architecture docs that explain non-obvious boundaries;
- verification docs/tests;
- relevant platform-level laws or component-boundary entries.

Architecture docs link to:

- affected spec;
- contracts created or changed by the design;
- decisions or proposals that justify it;
- verification expectations;
- `architecture-map.md` and `component-boundary.md` when cross-area.

Contracts link to:

- owner;
- consumers;
- source/implementation entry points when applicable;
- tests/proof;
- compatibility/version notes.

Decisions link to:

- affected specs;
- affected architecture docs;
- affected contracts;
- evidence/proposal/discussion source;
- superseded/superseding decisions.

Verification docs link to:

- the claim, spec, contract, or decision they prove;
- commands, test output, or evidence;
- known limitations.

Links should be typed where useful. Examples:

```txt
defines
constrains
implements
explains
evidenced_by
supersedes
consumes
```
````

### Full target shown text

````text
## 10. Linking Discipline

Every maintained document participates in the reading graph.

Area README links to:

- `spec.md`;
- main architecture docs;
- owned contracts;
- verification/proof docs;
- active proposals or discussions;
- related areas.

Spec links to:

- area README;
- contracts owned and consumed;
- architecture docs that explain non-obvious boundaries;
- verification docs/tests;
- relevant platform-level laws or component-boundary entries.

Architecture docs link to:

- affected spec;
- contracts created or changed by the design;
- decisions or proposals that justify it;
- verification expectations;
- `architecture-map.md` and `component-boundary.md` when cross-area.

Contracts link to:

- owner;
- consumers;
- source/implementation entry points when applicable;
- tests/proof;
- compatibility/version notes.

Decisions link to:

- affected specs;
- affected architecture docs;
- affected contracts;
- evidence/proposal/discussion source;
- superseded/superseding decisions.

Verification docs link to:

- the claim, spec, contract, or decision they prove;
- commands, test output, or evidence;
- known limitations.

Links should be typed where useful. Examples:

```txt
defines
constrains
implements
explains
evidenced_by
supersedes
consumes
```
````

## claim_6a740210fcc6a52536599154069002cb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-66, lines 507–507.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-69.
Source digest: 45ad81efb3da2ce92d17df5d0f5026305b1c69524ea378f91ba5c1e0f8b1b5d0
Target digest: 45ad81efb3da2ce92d17df5d0f5026305b1c69524ea378f91ba5c1e0f8b1b5d0
Shown source SHA256: 45ad81efb3da2ce92d17df5d0f5026305b1c69524ea378f91ba5c1e0f8b1b5d0
Shown target SHA256: 45ad81efb3da2ce92d17df5d0f5026305b1c69524ea378f91ba5c1e0f8b1b5d0

### Proposed decision

```json
{
  "claimId": "claim_6a740210fcc6a52536599154069002cb",
  "sourceUnitDigest": "45ad81efb3da2ce92d17df5d0f5026305b1c69524ea378f91ba5c1e0f8b1b5d0",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-69",
  "targetUnitDigest": "45ad81efb3da2ce92d17df5d0f5026305b1c69524ea378f91ba5c1e0f8b1b5d0",
  "targetAncestry": [
    "Documentation System Design",
    "10. Linking Discipline"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-66 (lines 507–507) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-69 (lines 531–531); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Every maintained document participates in the reading graph.
```

### Full target shown text

```text
Every maintained document participates in the reading graph.
```

## claim_a4c717e433a17f0a8ab558b3c11cfe61

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-67, lines 509–516.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-70.
Source digest: 58238f2a73dc9a6194a4ecb6fc22874dacc4f3d23657c21d747ab180e868ca65
Target digest: 58238f2a73dc9a6194a4ecb6fc22874dacc4f3d23657c21d747ab180e868ca65
Shown source SHA256: 58238f2a73dc9a6194a4ecb6fc22874dacc4f3d23657c21d747ab180e868ca65
Shown target SHA256: 58238f2a73dc9a6194a4ecb6fc22874dacc4f3d23657c21d747ab180e868ca65

### Proposed decision

```json
{
  "claimId": "claim_a4c717e433a17f0a8ab558b3c11cfe61",
  "sourceUnitDigest": "58238f2a73dc9a6194a4ecb6fc22874dacc4f3d23657c21d747ab180e868ca65",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-70",
  "targetUnitDigest": "58238f2a73dc9a6194a4ecb6fc22874dacc4f3d23657c21d747ab180e868ca65",
  "targetAncestry": [
    "Documentation System Design",
    "10. Linking Discipline"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-67 (lines 509–516) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-70 (lines 533–540); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Area README links to:

- `spec.md`;
- main architecture docs;
- owned contracts;
- verification/proof docs;
- active proposals or discussions;
- related areas.
```

### Full target shown text

```text
Area README links to:

- `spec.md`;
- main architecture docs;
- owned contracts;
- verification/proof docs;
- active proposals or discussions;
- related areas.
```

## claim_92ea2b970a4d1019e68228afbd206fad

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-68, lines 518–524.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-71.
Source digest: 791f6e4fc26d49e0c8b77c26648701fcf827b3780e2fc28fede07e424dd3b84e
Target digest: 791f6e4fc26d49e0c8b77c26648701fcf827b3780e2fc28fede07e424dd3b84e
Shown source SHA256: 791f6e4fc26d49e0c8b77c26648701fcf827b3780e2fc28fede07e424dd3b84e
Shown target SHA256: 791f6e4fc26d49e0c8b77c26648701fcf827b3780e2fc28fede07e424dd3b84e

### Proposed decision

```json
{
  "claimId": "claim_92ea2b970a4d1019e68228afbd206fad",
  "sourceUnitDigest": "791f6e4fc26d49e0c8b77c26648701fcf827b3780e2fc28fede07e424dd3b84e",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-71",
  "targetUnitDigest": "791f6e4fc26d49e0c8b77c26648701fcf827b3780e2fc28fede07e424dd3b84e",
  "targetAncestry": [
    "Documentation System Design",
    "10. Linking Discipline"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-68 (lines 518–524) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-71 (lines 542–548); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Spec links to:

- area README;
- contracts owned and consumed;
- architecture docs that explain non-obvious boundaries;
- verification docs/tests;
- relevant platform-level laws or component-boundary entries.
```

### Full target shown text

```text
Spec links to:

- area README;
- contracts owned and consumed;
- architecture docs that explain non-obvious boundaries;
- verification docs/tests;
- relevant platform-level laws or component-boundary entries.
```

## claim_3652b0d2b36028aa3011c8389f17111d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-69, lines 526–526.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-72.
Source digest: a7c76a629e6ab15c9792c60bcfa5676864f84b769d7ee33df7e302b422cff2fb
Target digest: a7c76a629e6ab15c9792c60bcfa5676864f84b769d7ee33df7e302b422cff2fb
Shown source SHA256: a7c76a629e6ab15c9792c60bcfa5676864f84b769d7ee33df7e302b422cff2fb
Shown target SHA256: a7c76a629e6ab15c9792c60bcfa5676864f84b769d7ee33df7e302b422cff2fb

### Proposed decision

```json
{
  "claimId": "claim_3652b0d2b36028aa3011c8389f17111d",
  "sourceUnitDigest": "a7c76a629e6ab15c9792c60bcfa5676864f84b769d7ee33df7e302b422cff2fb",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-72",
  "targetUnitDigest": "a7c76a629e6ab15c9792c60bcfa5676864f84b769d7ee33df7e302b422cff2fb",
  "targetAncestry": [
    "Documentation System Design",
    "10. Linking Discipline"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-69 (lines 526–526) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-72 (lines 550–550); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Architecture docs link to:
```

### Full target shown text

```text
Architecture docs link to:
```

## claim_a75abba1d1d1f3d35c12b8be3714f6c1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-70, lines 528–532.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-73.
Source digest: c7266f03a3f59891105806a5771ad683ce543770d04cdc41814ec2a823956763
Target digest: c7266f03a3f59891105806a5771ad683ce543770d04cdc41814ec2a823956763
Shown source SHA256: c7266f03a3f59891105806a5771ad683ce543770d04cdc41814ec2a823956763
Shown target SHA256: c7266f03a3f59891105806a5771ad683ce543770d04cdc41814ec2a823956763

### Proposed decision

```json
{
  "claimId": "claim_a75abba1d1d1f3d35c12b8be3714f6c1",
  "sourceUnitDigest": "c7266f03a3f59891105806a5771ad683ce543770d04cdc41814ec2a823956763",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-73",
  "targetUnitDigest": "c7266f03a3f59891105806a5771ad683ce543770d04cdc41814ec2a823956763",
  "targetAncestry": [
    "Documentation System Design",
    "10. Linking Discipline"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-70 (lines 528–532) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-73 (lines 552–556); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- affected spec;
- contracts created or changed by the design;
- decisions or proposals that justify it;
- verification expectations;
- `architecture-map.md` and `component-boundary.md` when cross-area.
```

### Full target shown text

```text
- affected spec;
- contracts created or changed by the design;
- decisions or proposals that justify it;
- verification expectations;
- `architecture-map.md` and `component-boundary.md` when cross-area.
```

## claim_6a70ae84ac3021a82ea4093ead3f4be8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-71, lines 534–540.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-74.
Source digest: 25be7a395edaae0f1d8b131beb496956761850eace100b74bf13131a77ffec70
Target digest: 25be7a395edaae0f1d8b131beb496956761850eace100b74bf13131a77ffec70
Shown source SHA256: 25be7a395edaae0f1d8b131beb496956761850eace100b74bf13131a77ffec70
Shown target SHA256: 25be7a395edaae0f1d8b131beb496956761850eace100b74bf13131a77ffec70

### Proposed decision

```json
{
  "claimId": "claim_6a70ae84ac3021a82ea4093ead3f4be8",
  "sourceUnitDigest": "25be7a395edaae0f1d8b131beb496956761850eace100b74bf13131a77ffec70",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-74",
  "targetUnitDigest": "25be7a395edaae0f1d8b131beb496956761850eace100b74bf13131a77ffec70",
  "targetAncestry": [
    "Documentation System Design",
    "10. Linking Discipline"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-71 (lines 534–540) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-74 (lines 558–564); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Contracts link to:

- owner;
- consumers;
- source/implementation entry points when applicable;
- tests/proof;
- compatibility/version notes.
```

### Full target shown text

```text
Contracts link to:

- owner;
- consumers;
- source/implementation entry points when applicable;
- tests/proof;
- compatibility/version notes.
```

## claim_4ce9da6193b1b45cd94ba9faf96d4563

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-72, lines 542–548.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-75.
Source digest: ee9435e61dccbbf5cba710116f658baa32708f8bfca97fafbcf78a7b489ba5a4
Target digest: ee9435e61dccbbf5cba710116f658baa32708f8bfca97fafbcf78a7b489ba5a4
Shown source SHA256: ee9435e61dccbbf5cba710116f658baa32708f8bfca97fafbcf78a7b489ba5a4
Shown target SHA256: ee9435e61dccbbf5cba710116f658baa32708f8bfca97fafbcf78a7b489ba5a4

### Proposed decision

```json
{
  "claimId": "claim_4ce9da6193b1b45cd94ba9faf96d4563",
  "sourceUnitDigest": "ee9435e61dccbbf5cba710116f658baa32708f8bfca97fafbcf78a7b489ba5a4",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-75",
  "targetUnitDigest": "ee9435e61dccbbf5cba710116f658baa32708f8bfca97fafbcf78a7b489ba5a4",
  "targetAncestry": [
    "Documentation System Design",
    "10. Linking Discipline"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-72 (lines 542–548) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-75 (lines 566–572); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Decisions link to:

- affected specs;
- affected architecture docs;
- affected contracts;
- evidence/proposal/discussion source;
- superseded/superseding decisions.
```

### Full target shown text

```text
Decisions link to:

- affected specs;
- affected architecture docs;
- affected contracts;
- evidence/proposal/discussion source;
- superseded/superseding decisions.
```

## claim_f91e9c0fa3639856095e04f222400d64

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-73, lines 550–550.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-76.
Source digest: eac57da0533496e7b1144cb824476aa66be4c331fcae93dd30da11012755d98c
Target digest: eac57da0533496e7b1144cb824476aa66be4c331fcae93dd30da11012755d98c
Shown source SHA256: eac57da0533496e7b1144cb824476aa66be4c331fcae93dd30da11012755d98c
Shown target SHA256: eac57da0533496e7b1144cb824476aa66be4c331fcae93dd30da11012755d98c

### Proposed decision

```json
{
  "claimId": "claim_f91e9c0fa3639856095e04f222400d64",
  "sourceUnitDigest": "eac57da0533496e7b1144cb824476aa66be4c331fcae93dd30da11012755d98c",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-76",
  "targetUnitDigest": "eac57da0533496e7b1144cb824476aa66be4c331fcae93dd30da11012755d98c",
  "targetAncestry": [
    "Documentation System Design",
    "10. Linking Discipline"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-73 (lines 550–550) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-76 (lines 574–574); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Verification docs link to:
```

### Full target shown text

```text
Verification docs link to:
```

## claim_67c745399dc2885105c9871534d214ab

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-74, lines 552–554.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-77.
Source digest: ec1b2364198738d33ccf2e3080f60036f937946a0ccc00d7276576888612d79d
Target digest: ec1b2364198738d33ccf2e3080f60036f937946a0ccc00d7276576888612d79d
Shown source SHA256: ec1b2364198738d33ccf2e3080f60036f937946a0ccc00d7276576888612d79d
Shown target SHA256: ec1b2364198738d33ccf2e3080f60036f937946a0ccc00d7276576888612d79d

### Proposed decision

```json
{
  "claimId": "claim_67c745399dc2885105c9871534d214ab",
  "sourceUnitDigest": "ec1b2364198738d33ccf2e3080f60036f937946a0ccc00d7276576888612d79d",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-77",
  "targetUnitDigest": "ec1b2364198738d33ccf2e3080f60036f937946a0ccc00d7276576888612d79d",
  "targetAncestry": [
    "Documentation System Design",
    "10. Linking Discipline"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-74 (lines 552–554) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-77 (lines 576–578); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- the claim, spec, contract, or decision they prove;
- commands, test output, or evidence;
- known limitations.
```

### Full target shown text

```text
- the claim, spec, contract, or decision they prove;
- commands, test output, or evidence;
- known limitations.
```

## claim_8962a085b01c3e15d23a423012ad290e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-75, lines 556–556.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-78.
Source digest: 09450724d2d8a016fc4b58eb735e150b0588255c54bd03c531f56d062da0f6d1
Target digest: 09450724d2d8a016fc4b58eb735e150b0588255c54bd03c531f56d062da0f6d1
Shown source SHA256: 09450724d2d8a016fc4b58eb735e150b0588255c54bd03c531f56d062da0f6d1
Shown target SHA256: 09450724d2d8a016fc4b58eb735e150b0588255c54bd03c531f56d062da0f6d1

### Proposed decision

```json
{
  "claimId": "claim_8962a085b01c3e15d23a423012ad290e",
  "sourceUnitDigest": "09450724d2d8a016fc4b58eb735e150b0588255c54bd03c531f56d062da0f6d1",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-78",
  "targetUnitDigest": "09450724d2d8a016fc4b58eb735e150b0588255c54bd03c531f56d062da0f6d1",
  "targetAncestry": [
    "Documentation System Design",
    "10. Linking Discipline"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-75 (lines 556–556) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-78 (lines 580–580); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Links should be typed where useful. Examples:
```

### Full target shown text

```text
Links should be typed where useful. Examples:
```

## claim_0ea3afaf4956a34de3695a838a8c78e2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-76, lines 558–566.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-79.
Source digest: 8763ac2ff0db101fb4b502912c8ba6e49e1974ec45d8595b72a4169f5b517080
Target digest: 8763ac2ff0db101fb4b502912c8ba6e49e1974ec45d8595b72a4169f5b517080
Shown source SHA256: 8763ac2ff0db101fb4b502912c8ba6e49e1974ec45d8595b72a4169f5b517080
Shown target SHA256: 8763ac2ff0db101fb4b502912c8ba6e49e1974ec45d8595b72a4169f5b517080

### Proposed decision

```json
{
  "claimId": "claim_0ea3afaf4956a34de3695a838a8c78e2",
  "sourceUnitDigest": "8763ac2ff0db101fb4b502912c8ba6e49e1974ec45d8595b72a4169f5b517080",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-79",
  "targetUnitDigest": "8763ac2ff0db101fb4b502912c8ba6e49e1974ec45d8595b72a4169f5b517080",
  "targetAncestry": [
    "Documentation System Design",
    "10. Linking Discipline"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-76 (lines 558–566) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-79 (lines 582–590); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
defines
constrains
implements
explains
evidenced_by
supersedes
consumes
```
````

### Full target shown text

````text
```txt
defines
constrains
implements
explains
evidenced_by
supersedes
consumes
```
````

## claim_efc0d7e7bded9d6619a36683d4cd3f0c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#11-promotion-workflow, lines 568–568.
Target: docs/platform/documentation/architecture/documentation-system-design.md#11-promotion-workflow.
Source digest: 23f7eb4d2ceaad2a70060c083553dbc518d8b8c7f1848457ed2604a2c47dd936
Target digest: 23f7eb4d2ceaad2a70060c083553dbc518d8b8c7f1848457ed2604a2c47dd936
Shown source SHA256: b76b98e8ba65b87fcc26b49fdeb085b4fc7bcefa92e591cb4a80818b2cf66ee6
Shown target SHA256: b76b98e8ba65b87fcc26b49fdeb085b4fc7bcefa92e591cb4a80818b2cf66ee6

### Proposed decision

```json
{
  "claimId": "claim_efc0d7e7bded9d6619a36683d4cd3f0c",
  "sourceUnitDigest": "23f7eb4d2ceaad2a70060c083553dbc518d8b8c7f1848457ed2604a2c47dd936",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "11-promotion-workflow",
  "targetUnitDigest": "23f7eb4d2ceaad2a70060c083553dbc518d8b8c7f1848457ed2604a2c47dd936",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#11-promotion-workflow (lines 568–568) is carried at docs/platform/documentation/architecture/documentation-system-design.md#11-promotion-workflow (lines 592–592); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 11. Promotion Workflow

Architecture shaping follows this flow:

```txt
discussion -> proposal/decision -> canonical promotion -> verification -> archive/delete
```

Promotion rules:

1. Label discussion assertions as question, hypothesis, evidence, proposal, or
   settled candidate.
2. Identify the target canonical artifact before promotion:
   - current truth -> spec;
   - design rationale/boundary -> architecture;
   - mandatory precision -> contract;
   - choice/history -> decision;
   - proof -> verification.
3. Promotion carries evidence, owner, and review status.
4. Update affected documents enough that the reading graph remains truthful.
5. Replace promoted discussion content with a pointer to the canonical location.
6. Unresolved items stay unresolved with owner or next review trigger.
7. Agents may draft, cross-link, check consistency, and flag conflicts, but they
   must not silently elevate drafts to binding authority.
````

### Full target shown text

````text
## 11. Promotion Workflow

Architecture shaping follows this flow:

```txt
discussion -> proposal/decision -> canonical promotion -> verification -> archive/delete
```

Promotion rules:

1. Label discussion assertions as question, hypothesis, evidence, proposal, or
   settled candidate.
2. Identify the target canonical artifact before promotion:
   - current truth -> spec;
   - design rationale/boundary -> architecture;
   - mandatory precision -> contract;
   - choice/history -> decision;
   - proof -> verification.
3. Promotion carries evidence, owner, and review status.
4. Update affected documents enough that the reading graph remains truthful.
5. Replace promoted discussion content with a pointer to the canonical location.
6. Unresolved items stay unresolved with owner or next review trigger.
7. Agents may draft, cross-link, check consistency, and flag conflicts, but they
   must not silently elevate drafts to binding authority.
````

## claim_588a0789221fa3a5dd4ac0336c3ea7fc

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-77, lines 570–570.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-80.
Source digest: 2f34d0343f57bf2228f34c78223cb19e255de7b2344237f3abc5c9c9f26207cc
Target digest: 2f34d0343f57bf2228f34c78223cb19e255de7b2344237f3abc5c9c9f26207cc
Shown source SHA256: 2f34d0343f57bf2228f34c78223cb19e255de7b2344237f3abc5c9c9f26207cc
Shown target SHA256: 2f34d0343f57bf2228f34c78223cb19e255de7b2344237f3abc5c9c9f26207cc

### Proposed decision

```json
{
  "claimId": "claim_588a0789221fa3a5dd4ac0336c3ea7fc",
  "sourceUnitDigest": "2f34d0343f57bf2228f34c78223cb19e255de7b2344237f3abc5c9c9f26207cc",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-80",
  "targetUnitDigest": "2f34d0343f57bf2228f34c78223cb19e255de7b2344237f3abc5c9c9f26207cc",
  "targetAncestry": [
    "Documentation System Design",
    "11. Promotion Workflow"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-77 (lines 570–570) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-80 (lines 594–594); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Architecture shaping follows this flow:
```

### Full target shown text

```text
Architecture shaping follows this flow:
```

## claim_a995d2222f4f15c9eabb5054e802f7a1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-78, lines 572–574.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-81.
Source digest: 7cef8fee2db23b35213d5c80ab80073c559fb0d1c918c5dccc8dcc80e81ab731
Target digest: 7cef8fee2db23b35213d5c80ab80073c559fb0d1c918c5dccc8dcc80e81ab731
Shown source SHA256: 7cef8fee2db23b35213d5c80ab80073c559fb0d1c918c5dccc8dcc80e81ab731
Shown target SHA256: 7cef8fee2db23b35213d5c80ab80073c559fb0d1c918c5dccc8dcc80e81ab731

### Proposed decision

```json
{
  "claimId": "claim_a995d2222f4f15c9eabb5054e802f7a1",
  "sourceUnitDigest": "7cef8fee2db23b35213d5c80ab80073c559fb0d1c918c5dccc8dcc80e81ab731",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-81",
  "targetUnitDigest": "7cef8fee2db23b35213d5c80ab80073c559fb0d1c918c5dccc8dcc80e81ab731",
  "targetAncestry": [
    "Documentation System Design",
    "11. Promotion Workflow"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-78 (lines 572–574) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-81 (lines 596–598); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
discussion -> proposal/decision -> canonical promotion -> verification -> archive/delete
```
````

### Full target shown text

````text
```txt
discussion -> proposal/decision -> canonical promotion -> verification -> archive/delete
```
````

## claim_42a2310f387081f7a06819bfd085cc86

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-79, lines 576–591.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-82.
Source digest: 02fbfca967926b69fc3a7bd133649eb7e9d455d1de81091e1140837cde9bc44b
Target digest: 02fbfca967926b69fc3a7bd133649eb7e9d455d1de81091e1140837cde9bc44b
Shown source SHA256: 02fbfca967926b69fc3a7bd133649eb7e9d455d1de81091e1140837cde9bc44b
Shown target SHA256: 02fbfca967926b69fc3a7bd133649eb7e9d455d1de81091e1140837cde9bc44b

### Proposed decision

```json
{
  "claimId": "claim_42a2310f387081f7a06819bfd085cc86",
  "sourceUnitDigest": "02fbfca967926b69fc3a7bd133649eb7e9d455d1de81091e1140837cde9bc44b",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-82",
  "targetUnitDigest": "02fbfca967926b69fc3a7bd133649eb7e9d455d1de81091e1140837cde9bc44b",
  "targetAncestry": [
    "Documentation System Design",
    "11. Promotion Workflow"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-79 (lines 576–591) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-82 (lines 600–615); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Promotion rules:

1. Label discussion assertions as question, hypothesis, evidence, proposal, or
   settled candidate.
2. Identify the target canonical artifact before promotion:
   - current truth -> spec;
   - design rationale/boundary -> architecture;
   - mandatory precision -> contract;
   - choice/history -> decision;
   - proof -> verification.
3. Promotion carries evidence, owner, and review status.
4. Update affected documents enough that the reading graph remains truthful.
5. Replace promoted discussion content with a pointer to the canonical location.
6. Unresolved items stay unresolved with owner or next review trigger.
7. Agents may draft, cross-link, check consistency, and flag conflicts, but they
   must not silently elevate drafts to binding authority.
```

### Full target shown text

```text
Promotion rules:

1. Label discussion assertions as question, hypothesis, evidence, proposal, or
   settled candidate.
2. Identify the target canonical artifact before promotion:
   - current truth -> spec;
   - design rationale/boundary -> architecture;
   - mandatory precision -> contract;
   - choice/history -> decision;
   - proof -> verification.
3. Promotion carries evidence, owner, and review status.
4. Update affected documents enough that the reading graph remains truthful.
5. Replace promoted discussion content with a pointer to the canonical location.
6. Unresolved items stay unresolved with owner or next review trigger.
7. Agents may draft, cross-link, check consistency, and flag conflicts, but they
   must not silently elevate drafts to binding authority.
```

## claim_d61252f6729064eedf8b0de8391034b6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#12-framework-use, lines 593–593.
Target: docs/platform/documentation/architecture/documentation-system-design.md#12-framework-use.
Source digest: 07475a4861c9b4658779438de5fce9f436d4779a17dd5935cccdc61c0a5b7b36
Target digest: 07475a4861c9b4658779438de5fce9f436d4779a17dd5935cccdc61c0a5b7b36
Shown source SHA256: b4d166ff2e727f5ef67a97fc4fff5eea4144338d2c018df9ae1a6cd5819cd0b4
Shown target SHA256: b4d166ff2e727f5ef67a97fc4fff5eea4144338d2c018df9ae1a6cd5819cd0b4

### Proposed decision

```json
{
  "claimId": "claim_d61252f6729064eedf8b0de8391034b6",
  "sourceUnitDigest": "07475a4861c9b4658779438de5fce9f436d4779a17dd5935cccdc61c0a5b7b36",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "12-framework-use",
  "targetUnitDigest": "07475a4861c9b4658779438de5fce9f436d4779a17dd5935cccdc61c0a5b7b36",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#12-framework-use (lines 593–593) is carried at docs/platform/documentation/architecture/documentation-system-design.md#12-framework-use (lines 617–617); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 12. Framework Use

fgOS uses a native documentation model because system docs need authority,
provenance, lifecycle, human review, and agent collaboration rules.

External frameworks are influences:

- Diataxis is used for `docs/user/**`: tutorials, how-to, reference,
  explanation.
- Google developer documentation style informs clarity, directness, and
  scannable structure.
- OKF-like ideas inform typed metadata, indexes, git-readable knowledge, and
  human/agent portability.

These frameworks do not replace fgOS document taxonomy or authority rules.
```

### Full target shown text

```text
## 12. Framework Use

fgOS uses a native documentation model because system docs need authority,
provenance, lifecycle, human review, and agent collaboration rules.

External frameworks are influences:

- Diataxis is used for `docs/user/**`: tutorials, how-to, reference,
  explanation.
- Google developer documentation style informs clarity, directness, and
  scannable structure.
- OKF-like ideas inform typed metadata, indexes, git-readable knowledge, and
  human/agent portability.

These frameworks do not replace fgOS document taxonomy or authority rules.
```

## claim_fbbe8dc221c206bb5fffd571ba32dc9d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-80, lines 595–596.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-83.
Source digest: e184ece05608bed95834efb4ff7ea9778df5ab68e101fbc488a075e09a29d9eb
Target digest: e184ece05608bed95834efb4ff7ea9778df5ab68e101fbc488a075e09a29d9eb
Shown source SHA256: e184ece05608bed95834efb4ff7ea9778df5ab68e101fbc488a075e09a29d9eb
Shown target SHA256: e184ece05608bed95834efb4ff7ea9778df5ab68e101fbc488a075e09a29d9eb

### Proposed decision

```json
{
  "claimId": "claim_fbbe8dc221c206bb5fffd571ba32dc9d",
  "sourceUnitDigest": "e184ece05608bed95834efb4ff7ea9778df5ab68e101fbc488a075e09a29d9eb",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-83",
  "targetUnitDigest": "e184ece05608bed95834efb4ff7ea9778df5ab68e101fbc488a075e09a29d9eb",
  "targetAncestry": [
    "Documentation System Design",
    "12. Framework Use"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-80 (lines 595–596) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-83 (lines 619–620); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
fgOS uses a native documentation model because system docs need authority,
provenance, lifecycle, human review, and agent collaboration rules.
```

### Full target shown text

```text
fgOS uses a native documentation model because system docs need authority,
provenance, lifecycle, human review, and agent collaboration rules.
```

## claim_ce3f82d39f412573689aeb66c2eac32b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-81, lines 598–598.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-84.
Source digest: 6ade2c03c2451630d74ce815d4d4c375f0fb429c51b29e71c860000ec7efe27a
Target digest: 6ade2c03c2451630d74ce815d4d4c375f0fb429c51b29e71c860000ec7efe27a
Shown source SHA256: 6ade2c03c2451630d74ce815d4d4c375f0fb429c51b29e71c860000ec7efe27a
Shown target SHA256: 6ade2c03c2451630d74ce815d4d4c375f0fb429c51b29e71c860000ec7efe27a

### Proposed decision

```json
{
  "claimId": "claim_ce3f82d39f412573689aeb66c2eac32b",
  "sourceUnitDigest": "6ade2c03c2451630d74ce815d4d4c375f0fb429c51b29e71c860000ec7efe27a",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-84",
  "targetUnitDigest": "6ade2c03c2451630d74ce815d4d4c375f0fb429c51b29e71c860000ec7efe27a",
  "targetAncestry": [
    "Documentation System Design",
    "12. Framework Use"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-81 (lines 598–598) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-84 (lines 622–622); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
External frameworks are influences:
```

### Full target shown text

```text
External frameworks are influences:
```

## claim_dac5ad2ae7abc0e6ff921f2f3f78cef7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-82, lines 600–605.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-85.
Source digest: 33b984b65ad747db1a28b01a1559e1703803ec7552e50e5fb27be70b9f6431f2
Target digest: 33b984b65ad747db1a28b01a1559e1703803ec7552e50e5fb27be70b9f6431f2
Shown source SHA256: 33b984b65ad747db1a28b01a1559e1703803ec7552e50e5fb27be70b9f6431f2
Shown target SHA256: 33b984b65ad747db1a28b01a1559e1703803ec7552e50e5fb27be70b9f6431f2

### Proposed decision

```json
{
  "claimId": "claim_dac5ad2ae7abc0e6ff921f2f3f78cef7",
  "sourceUnitDigest": "33b984b65ad747db1a28b01a1559e1703803ec7552e50e5fb27be70b9f6431f2",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-85",
  "targetUnitDigest": "33b984b65ad747db1a28b01a1559e1703803ec7552e50e5fb27be70b9f6431f2",
  "targetAncestry": [
    "Documentation System Design",
    "12. Framework Use"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-82 (lines 600–605) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-85 (lines 624–629); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- Diataxis is used for `docs/user/**`: tutorials, how-to, reference,
  explanation.
- Google developer documentation style informs clarity, directness, and
  scannable structure.
- OKF-like ideas inform typed metadata, indexes, git-readable knowledge, and
  human/agent portability.
```

### Full target shown text

```text
- Diataxis is used for `docs/user/**`: tutorials, how-to, reference,
  explanation.
- Google developer documentation style informs clarity, directness, and
  scannable structure.
- OKF-like ideas inform typed metadata, indexes, git-readable knowledge, and
  human/agent portability.
```

## claim_14469bbe0d8226641e1f3df3ef898f26

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-83, lines 607–607.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-86.
Source digest: ddf7061d557d909beb7530dc0880c714a3118c38790bae65370446602b9036f1
Target digest: ddf7061d557d909beb7530dc0880c714a3118c38790bae65370446602b9036f1
Shown source SHA256: ddf7061d557d909beb7530dc0880c714a3118c38790bae65370446602b9036f1
Shown target SHA256: ddf7061d557d909beb7530dc0880c714a3118c38790bae65370446602b9036f1

### Proposed decision

```json
{
  "claimId": "claim_14469bbe0d8226641e1f3df3ef898f26",
  "sourceUnitDigest": "ddf7061d557d909beb7530dc0880c714a3118c38790bae65370446602b9036f1",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-86",
  "targetUnitDigest": "ddf7061d557d909beb7530dc0880c714a3118c38790bae65370446602b9036f1",
  "targetAncestry": [
    "Documentation System Design",
    "12. Framework Use"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-83 (lines 607–607) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-86 (lines 631–631); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
These frameworks do not replace fgOS document taxonomy or authority rules.
```

### Full target shown text

```text
These frameworks do not replace fgOS document taxonomy or authority rules.
```

## claim_176849d06c5380aeea454c67ccaa4ec2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#13-generated-docs, lines 609–609.
Target: docs/platform/documentation/architecture/documentation-system-design.md#13-generated-docs.
Source digest: 606a44e0b6aa307391b3d378dcdfc0d4b31995bab583f037f899ecb29e8224cd
Target digest: 606a44e0b6aa307391b3d378dcdfc0d4b31995bab583f037f899ecb29e8224cd
Shown source SHA256: 617b08c464da43b4d1e3766025b026355dac1efba36bd7856d87d8a7985aab9a
Shown target SHA256: 617b08c464da43b4d1e3766025b026355dac1efba36bd7856d87d8a7985aab9a

### Proposed decision

```json
{
  "claimId": "claim_176849d06c5380aeea454c67ccaa4ec2",
  "sourceUnitDigest": "606a44e0b6aa307391b3d378dcdfc0d4b31995bab583f037f899ecb29e8224cd",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "13-generated-docs",
  "targetUnitDigest": "606a44e0b6aa307391b3d378dcdfc0d4b31995bab583f037f899ecb29e8224cd",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#13-generated-docs (lines 609–609) is carried at docs/platform/documentation/architecture/documentation-system-design.md#13-generated-docs (lines 633–633); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 13. Generated Docs

Generated docs must declare:

- source of truth;
- generator command/tool;
- generator version when available;
- generated timestamp;
- freshness check;
- do-not-edit status.

Generated files are projections. To change them, change their source or
generator.

Known generated/projection classes include:

- doc registry projections;
- decision indexes;
- end-user docs indexes;
- UI spec generated outputs;
- skill/agent wrapper mirrors.

`docs/specs/**` in the current repo should be treated as hand/agent-curated
living spec-state, not as generated output, unless a specific file proves
otherwise.
```

### Full target shown text

```text
## 13. Generated Docs

Generated docs must declare:

- source of truth;
- generator command/tool;
- generator version when available;
- generated timestamp;
- freshness check;
- do-not-edit status.

Generated files are projections. To change them, change their source or
generator.

Known generated/projection classes include:

- doc registry projections;
- decision indexes;
- end-user docs indexes;
- UI spec generated outputs;
- skill/agent wrapper mirrors.

`docs/specs/**` in the current repo should be treated as hand/agent-curated
living spec-state, not as generated output, unless a specific file proves
otherwise.
```

## claim_5012c00a4aa94f771765c7ca1a45ed43

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-84, lines 611–611.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-87.
Source digest: 00b2cf6007b13bfe910038f7a8e88b2694a4cfe8005909b093160bcb5aebdae4
Target digest: 00b2cf6007b13bfe910038f7a8e88b2694a4cfe8005909b093160bcb5aebdae4
Shown source SHA256: 00b2cf6007b13bfe910038f7a8e88b2694a4cfe8005909b093160bcb5aebdae4
Shown target SHA256: 00b2cf6007b13bfe910038f7a8e88b2694a4cfe8005909b093160bcb5aebdae4

### Proposed decision

```json
{
  "claimId": "claim_5012c00a4aa94f771765c7ca1a45ed43",
  "sourceUnitDigest": "00b2cf6007b13bfe910038f7a8e88b2694a4cfe8005909b093160bcb5aebdae4",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-87",
  "targetUnitDigest": "00b2cf6007b13bfe910038f7a8e88b2694a4cfe8005909b093160bcb5aebdae4",
  "targetAncestry": [
    "Documentation System Design",
    "13. Generated Docs"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-84 (lines 611–611) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-87 (lines 635–635); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Generated docs must declare:
```

### Full target shown text

```text
Generated docs must declare:
```

## claim_b1999ef7b8113f64c91dd1518254abc6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-85, lines 613–618.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-88.
Source digest: c711ca9207f6e926573fd284b5273e0f5d84131b6218d6f782435a50a7410240
Target digest: c711ca9207f6e926573fd284b5273e0f5d84131b6218d6f782435a50a7410240
Shown source SHA256: c711ca9207f6e926573fd284b5273e0f5d84131b6218d6f782435a50a7410240
Shown target SHA256: c711ca9207f6e926573fd284b5273e0f5d84131b6218d6f782435a50a7410240

### Proposed decision

```json
{
  "claimId": "claim_b1999ef7b8113f64c91dd1518254abc6",
  "sourceUnitDigest": "c711ca9207f6e926573fd284b5273e0f5d84131b6218d6f782435a50a7410240",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-88",
  "targetUnitDigest": "c711ca9207f6e926573fd284b5273e0f5d84131b6218d6f782435a50a7410240",
  "targetAncestry": [
    "Documentation System Design",
    "13. Generated Docs"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-85 (lines 613–618) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-88 (lines 637–642); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- source of truth;
- generator command/tool;
- generator version when available;
- generated timestamp;
- freshness check;
- do-not-edit status.
```

### Full target shown text

```text
- source of truth;
- generator command/tool;
- generator version when available;
- generated timestamp;
- freshness check;
- do-not-edit status.
```

## claim_dc95e49a112a0c6d84a963ab613aa7cc

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-86, lines 620–621.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-89.
Source digest: 1bf70b132c41d1ef9489d66121191dc00ebd70edf1e5b0656d73b22e92416d83
Target digest: 1bf70b132c41d1ef9489d66121191dc00ebd70edf1e5b0656d73b22e92416d83
Shown source SHA256: 1bf70b132c41d1ef9489d66121191dc00ebd70edf1e5b0656d73b22e92416d83
Shown target SHA256: 1bf70b132c41d1ef9489d66121191dc00ebd70edf1e5b0656d73b22e92416d83

### Proposed decision

```json
{
  "claimId": "claim_dc95e49a112a0c6d84a963ab613aa7cc",
  "sourceUnitDigest": "1bf70b132c41d1ef9489d66121191dc00ebd70edf1e5b0656d73b22e92416d83",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-89",
  "targetUnitDigest": "1bf70b132c41d1ef9489d66121191dc00ebd70edf1e5b0656d73b22e92416d83",
  "targetAncestry": [
    "Documentation System Design",
    "13. Generated Docs"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-86 (lines 620–621) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-89 (lines 644–645); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Generated files are projections. To change them, change their source or
generator.
```

### Full target shown text

```text
Generated files are projections. To change them, change their source or
generator.
```

## claim_43583dcb881270d63a184c98b79ad610

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-87, lines 623–623.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-90.
Source digest: 4ee61f8d57b8568ce4bd8ba803fcf458310019a8fdf0833d031a73614aa4a9dc
Target digest: 4ee61f8d57b8568ce4bd8ba803fcf458310019a8fdf0833d031a73614aa4a9dc
Shown source SHA256: 4ee61f8d57b8568ce4bd8ba803fcf458310019a8fdf0833d031a73614aa4a9dc
Shown target SHA256: 4ee61f8d57b8568ce4bd8ba803fcf458310019a8fdf0833d031a73614aa4a9dc

### Proposed decision

```json
{
  "claimId": "claim_43583dcb881270d63a184c98b79ad610",
  "sourceUnitDigest": "4ee61f8d57b8568ce4bd8ba803fcf458310019a8fdf0833d031a73614aa4a9dc",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-90",
  "targetUnitDigest": "4ee61f8d57b8568ce4bd8ba803fcf458310019a8fdf0833d031a73614aa4a9dc",
  "targetAncestry": [
    "Documentation System Design",
    "13. Generated Docs"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-87 (lines 623–623) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-90 (lines 647–647); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Known generated/projection classes include:
```

### Full target shown text

```text
Known generated/projection classes include:
```

## claim_53bece928193efecc7c900cf64c63306

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-88, lines 625–629.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-91.
Source digest: bf89cef8e734b2e6db20ecc7a6549e31f8fa2d725e89af44908b62cfd3529f98
Target digest: bf89cef8e734b2e6db20ecc7a6549e31f8fa2d725e89af44908b62cfd3529f98
Shown source SHA256: bf89cef8e734b2e6db20ecc7a6549e31f8fa2d725e89af44908b62cfd3529f98
Shown target SHA256: bf89cef8e734b2e6db20ecc7a6549e31f8fa2d725e89af44908b62cfd3529f98

### Proposed decision

```json
{
  "claimId": "claim_53bece928193efecc7c900cf64c63306",
  "sourceUnitDigest": "bf89cef8e734b2e6db20ecc7a6549e31f8fa2d725e89af44908b62cfd3529f98",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-91",
  "targetUnitDigest": "bf89cef8e734b2e6db20ecc7a6549e31f8fa2d725e89af44908b62cfd3529f98",
  "targetAncestry": [
    "Documentation System Design",
    "13. Generated Docs"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-88 (lines 625–629) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-91 (lines 649–653); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- doc registry projections;
- decision indexes;
- end-user docs indexes;
- UI spec generated outputs;
- skill/agent wrapper mirrors.
```

### Full target shown text

```text
- doc registry projections;
- decision indexes;
- end-user docs indexes;
- UI spec generated outputs;
- skill/agent wrapper mirrors.
```

## claim_785477116f8c08cb8ed18cafa46ad9b2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-89, lines 631–633.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-92.
Source digest: 628997d8acfe94336bc7842e99c2c66405abf552196474d4ec771678b76846eb
Target digest: 628997d8acfe94336bc7842e99c2c66405abf552196474d4ec771678b76846eb
Shown source SHA256: 628997d8acfe94336bc7842e99c2c66405abf552196474d4ec771678b76846eb
Shown target SHA256: 628997d8acfe94336bc7842e99c2c66405abf552196474d4ec771678b76846eb

### Proposed decision

```json
{
  "claimId": "claim_785477116f8c08cb8ed18cafa46ad9b2",
  "sourceUnitDigest": "628997d8acfe94336bc7842e99c2c66405abf552196474d4ec771678b76846eb",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-92",
  "targetUnitDigest": "628997d8acfe94336bc7842e99c2c66405abf552196474d4ec771678b76846eb",
  "targetAncestry": [
    "Documentation System Design",
    "13. Generated Docs"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-89 (lines 631–633) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-92 (lines 655–657); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`docs/specs/**` in the current repo should be treated as hand/agent-curated
living spec-state, not as generated output, unless a specific file proves
otherwise.
```

### Full target shown text

```text
`docs/specs/**` in the current repo should be treated as hand/agent-curated
living spec-state, not as generated output, unless a specific file proves
otherwise.
```

## claim_43dc597848057405bc4ed00f615113e8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#14-failure-modes, lines 635–635.
Target: docs/platform/documentation/architecture/documentation-system-design.md#14-failure-modes.
Source digest: 14a399cf1855bca3335cc25349d844514691049172b6aeb2c0501154ff588ff7
Target digest: 14a399cf1855bca3335cc25349d844514691049172b6aeb2c0501154ff588ff7
Shown source SHA256: fe8f5e87fab94d802cae621a2e32ee4210eaa1c25103f23c6fc0d5266e468957
Shown target SHA256: fe8f5e87fab94d802cae621a2e32ee4210eaa1c25103f23c6fc0d5266e468957

### Proposed decision

```json
{
  "claimId": "claim_43dc597848057405bc4ed00f615113e8",
  "sourceUnitDigest": "14a399cf1855bca3335cc25349d844514691049172b6aeb2c0501154ff588ff7",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "14-failure-modes",
  "targetUnitDigest": "14a399cf1855bca3335cc25349d844514691049172b6aeb2c0501154ff588ff7",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#14-failure-modes (lines 635–635) is carried at docs/platform/documentation/architecture/documentation-system-design.md#14-failure-modes (lines 659–659); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 14. Failure Modes

The design must guard against these failures:

- Polished agent prose is mistaken for an approved decision.
- `DISCUSSION.md` becomes a fresher and easier-to-edit shadow spec.
- The same rule appears in spec, architecture, and contract without one owner.
- Agents silently reconcile contradictions instead of surfacing competing
  authorities.
- Generated files appear canonical because provenance or freshness is missing.
- Historical decisions are edited to match today instead of superseded.
- Links become a raw list rather than typed reading relationships.
- Agent authorship is captured, but human accountability and approval are not.
- Review dates lapse until "current behavior" becomes unverified.
- Operational convenience is promoted into normative contract without
  compatibility analysis and approval.
```

### Full target shown text

```text
## 14. Failure Modes

The design must guard against these failures:

- Polished agent prose is mistaken for an approved decision.
- `DISCUSSION.md` becomes a fresher and easier-to-edit shadow spec.
- The same rule appears in spec, architecture, and contract without one owner.
- Agents silently reconcile contradictions instead of surfacing competing
  authorities.
- Generated files appear canonical because provenance or freshness is missing.
- Historical decisions are edited to match today instead of superseded.
- Links become a raw list rather than typed reading relationships.
- Agent authorship is captured, but human accountability and approval are not.
- Review dates lapse until "current behavior" becomes unverified.
- Operational convenience is promoted into normative contract without
  compatibility analysis and approval.
```

## claim_4e50b00f1e92a79cb73a879ec3d1fc2c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-90, lines 637–637.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-93.
Source digest: ebc8b023eb46d7918382f573c721ea6ee6b7da42d01e43aece88baf4e817a620
Target digest: ebc8b023eb46d7918382f573c721ea6ee6b7da42d01e43aece88baf4e817a620
Shown source SHA256: ebc8b023eb46d7918382f573c721ea6ee6b7da42d01e43aece88baf4e817a620
Shown target SHA256: ebc8b023eb46d7918382f573c721ea6ee6b7da42d01e43aece88baf4e817a620

### Proposed decision

```json
{
  "claimId": "claim_4e50b00f1e92a79cb73a879ec3d1fc2c",
  "sourceUnitDigest": "ebc8b023eb46d7918382f573c721ea6ee6b7da42d01e43aece88baf4e817a620",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-93",
  "targetUnitDigest": "ebc8b023eb46d7918382f573c721ea6ee6b7da42d01e43aece88baf4e817a620",
  "targetAncestry": [
    "Documentation System Design",
    "14. Failure Modes"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-90 (lines 637–637) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-93 (lines 661–661); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The design must guard against these failures:
```

### Full target shown text

```text
The design must guard against these failures:
```

## claim_301a9930d9c5628abb130bbfbadf038b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-91, lines 639–650.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-94.
Source digest: 853f3e697e0d4065873e8dc54dca1a64849747f818ae148fc65e440c1cae7b4f
Target digest: 853f3e697e0d4065873e8dc54dca1a64849747f818ae148fc65e440c1cae7b4f
Shown source SHA256: 853f3e697e0d4065873e8dc54dca1a64849747f818ae148fc65e440c1cae7b4f
Shown target SHA256: 853f3e697e0d4065873e8dc54dca1a64849747f818ae148fc65e440c1cae7b4f

### Proposed decision

```json
{
  "claimId": "claim_301a9930d9c5628abb130bbfbadf038b",
  "sourceUnitDigest": "853f3e697e0d4065873e8dc54dca1a64849747f818ae148fc65e440c1cae7b4f",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-94",
  "targetUnitDigest": "853f3e697e0d4065873e8dc54dca1a64849747f818ae148fc65e440c1cae7b4f",
  "targetAncestry": [
    "Documentation System Design",
    "14. Failure Modes"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-91 (lines 639–650) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-94 (lines 663–674); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- Polished agent prose is mistaken for an approved decision.
- `DISCUSSION.md` becomes a fresher and easier-to-edit shadow spec.
- The same rule appears in spec, architecture, and contract without one owner.
- Agents silently reconcile contradictions instead of surfacing competing
  authorities.
- Generated files appear canonical because provenance or freshness is missing.
- Historical decisions are edited to match today instead of superseded.
- Links become a raw list rather than typed reading relationships.
- Agent authorship is captured, but human accountability and approval are not.
- Review dates lapse until "current behavior" becomes unverified.
- Operational convenience is promoted into normative contract without
  compatibility analysis and approval.
```

### Full target shown text

```text
- Polished agent prose is mistaken for an approved decision.
- `DISCUSSION.md` becomes a fresher and easier-to-edit shadow spec.
- The same rule appears in spec, architecture, and contract without one owner.
- Agents silently reconcile contradictions instead of surfacing competing
  authorities.
- Generated files appear canonical because provenance or freshness is missing.
- Historical decisions are edited to match today instead of superseded.
- Links become a raw list rather than typed reading relationships.
- Agent authorship is captured, but human accountability and approval are not.
- Review dates lapse until "current behavior" becomes unverified.
- Operational convenience is promoted into normative contract without
  compatibility analysis and approval.
```

## claim_57d5ed6e0f8784dc3c63485eb9d76337

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#15-migration-strategy, lines 652–652.
Target: docs/platform/documentation/architecture/documentation-system-design.md#15-migration-strategy.
Source digest: 24518d7ba90c039caf6346a23d892a8021e68cbb394c5a69e8a7d4d96f07ccc0
Target digest: 24518d7ba90c039caf6346a23d892a8021e68cbb394c5a69e8a7d4d96f07ccc0
Shown source SHA256: 7a80792a98425d7abc01039e32cd5429721fe7a89e67200a4ab2d84edb3b62aa
Shown target SHA256: 7a80792a98425d7abc01039e32cd5429721fe7a89e67200a4ab2d84edb3b62aa

### Proposed decision

```json
{
  "claimId": "claim_57d5ed6e0f8784dc3c63485eb9d76337",
  "sourceUnitDigest": "24518d7ba90c039caf6346a23d892a8021e68cbb394c5a69e8a7d4d96f07ccc0",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "15-migration-strategy",
  "targetUnitDigest": "24518d7ba90c039caf6346a23d892a8021e68cbb394c5a69e8a7d4d96f07ccc0",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#15-migration-strategy (lines 652–652) is carried at docs/platform/documentation/architecture/documentation-system-design.md#15-migration-strategy (lines 676–676); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 15. Migration Strategy

Migration should be staged.

1. Approve this design document.
2. Promote settled governance into `docs/doc-governance.md`.
3. Create or update `docs/README.md`, `docs/reading-map.md`, and
   `docs/platform/README.md`.
4. Create templates under `docs/templates/`.
5. Classify existing docs by type, authority, lifecycle, and provenance.
6. Move only one area at a time.
7. Add redirect/stub pointers when moving important existing paths.
8. Preserve provenance for migrated documents.
9. Delete temporary discussion files only after promotion or explicit discard.

No bulk migration should happen before governance and templates are reviewed.
```

### Full target shown text

```text
## 15. Migration Strategy

Migration should be staged.

1. Approve this design document.
2. Promote settled governance into `docs/doc-governance.md`.
3. Create or update `docs/README.md`, `docs/reading-map.md`, and
   `docs/platform/README.md`.
4. Create templates under `docs/templates/`.
5. Classify existing docs by type, authority, lifecycle, and provenance.
6. Move only one area at a time.
7. Add redirect/stub pointers when moving important existing paths.
8. Preserve provenance for migrated documents.
9. Delete temporary discussion files only after promotion or explicit discard.

No bulk migration should happen before governance and templates are reviewed.
```

## claim_5379fda011bdeceefe420638f023e513

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-92, lines 654–654.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-95.
Source digest: 15aa25f118b0c94fc287715329514aba9d54472dc25bc490270097c6927e8b43
Target digest: 15aa25f118b0c94fc287715329514aba9d54472dc25bc490270097c6927e8b43
Shown source SHA256: 15aa25f118b0c94fc287715329514aba9d54472dc25bc490270097c6927e8b43
Shown target SHA256: 15aa25f118b0c94fc287715329514aba9d54472dc25bc490270097c6927e8b43

### Proposed decision

```json
{
  "claimId": "claim_5379fda011bdeceefe420638f023e513",
  "sourceUnitDigest": "15aa25f118b0c94fc287715329514aba9d54472dc25bc490270097c6927e8b43",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-95",
  "targetUnitDigest": "15aa25f118b0c94fc287715329514aba9d54472dc25bc490270097c6927e8b43",
  "targetAncestry": [
    "Documentation System Design",
    "15. Migration Strategy"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-92 (lines 654–654) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-95 (lines 678–678); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Migration should be staged.
```

### Full target shown text

```text
Migration should be staged.
```

## claim_b2deee1af0b3b7a155bbef588c16f58d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-93, lines 656–665.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-96.
Source digest: 8444ba8382a2ae22681eba98e636f9cc60ca50b66779e29e8f4e1459d65acfc3
Target digest: 8444ba8382a2ae22681eba98e636f9cc60ca50b66779e29e8f4e1459d65acfc3
Shown source SHA256: 8444ba8382a2ae22681eba98e636f9cc60ca50b66779e29e8f4e1459d65acfc3
Shown target SHA256: 8444ba8382a2ae22681eba98e636f9cc60ca50b66779e29e8f4e1459d65acfc3

### Proposed decision

```json
{
  "claimId": "claim_b2deee1af0b3b7a155bbef588c16f58d",
  "sourceUnitDigest": "8444ba8382a2ae22681eba98e636f9cc60ca50b66779e29e8f4e1459d65acfc3",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-96",
  "targetUnitDigest": "8444ba8382a2ae22681eba98e636f9cc60ca50b66779e29e8f4e1459d65acfc3",
  "targetAncestry": [
    "Documentation System Design",
    "15. Migration Strategy"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-93 (lines 656–665) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-96 (lines 680–689); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. Approve this design document.
2. Promote settled governance into `docs/doc-governance.md`.
3. Create or update `docs/README.md`, `docs/reading-map.md`, and
   `docs/platform/README.md`.
4. Create templates under `docs/templates/`.
5. Classify existing docs by type, authority, lifecycle, and provenance.
6. Move only one area at a time.
7. Add redirect/stub pointers when moving important existing paths.
8. Preserve provenance for migrated documents.
9. Delete temporary discussion files only after promotion or explicit discard.
```

### Full target shown text

```text
1. Approve this design document.
2. Promote settled governance into `docs/doc-governance.md`.
3. Create or update `docs/README.md`, `docs/reading-map.md`, and
   `docs/platform/README.md`.
4. Create templates under `docs/templates/`.
5. Classify existing docs by type, authority, lifecycle, and provenance.
6. Move only one area at a time.
7. Add redirect/stub pointers when moving important existing paths.
8. Preserve provenance for migrated documents.
9. Delete temporary discussion files only after promotion or explicit discard.
```

## claim_1d6f41c49e574b971c3dc8ed79b6ced3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-94, lines 667–667.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-97.
Source digest: eef66c3a445f8250229c5746af1d3a31bf03ac3b814eeb008581b63639787408
Target digest: eef66c3a445f8250229c5746af1d3a31bf03ac3b814eeb008581b63639787408
Shown source SHA256: eef66c3a445f8250229c5746af1d3a31bf03ac3b814eeb008581b63639787408
Shown target SHA256: eef66c3a445f8250229c5746af1d3a31bf03ac3b814eeb008581b63639787408

### Proposed decision

```json
{
  "claimId": "claim_1d6f41c49e574b971c3dc8ed79b6ced3",
  "sourceUnitDigest": "eef66c3a445f8250229c5746af1d3a31bf03ac3b814eeb008581b63639787408",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-97",
  "targetUnitDigest": "eef66c3a445f8250229c5746af1d3a31bf03ac3b814eeb008581b63639787408",
  "targetAncestry": [
    "Documentation System Design",
    "15. Migration Strategy"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-94 (lines 667–667) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-97 (lines 691–691); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
No bulk migration should happen before governance and templates are reviewed.
```

### Full target shown text

```text
No bulk migration should happen before governance and templates are reviewed.
```

## claim_8bca8b33deb39653a11a8acacd4224f8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/documentation-system-design.md#16-design-test, lines 669–669.
Target: docs/platform/documentation/architecture/documentation-system-design.md#16-design-test.
Source digest: e6bb34210242071a0f083d28b47598e76d2bf0367fc360d18ea2cd63aef46f7b
Target digest: e6bb34210242071a0f083d28b47598e76d2bf0367fc360d18ea2cd63aef46f7b
Shown source SHA256: c3a5a0c0b88410776ac2f8c5adb5e6cfde3931adb323fbe18b2e67af67eab904
Shown target SHA256: c3a5a0c0b88410776ac2f8c5adb5e6cfde3931adb323fbe18b2e67af67eab904

### Proposed decision

```json
{
  "claimId": "claim_8bca8b33deb39653a11a8acacd4224f8",
  "sourceUnitDigest": "e6bb34210242071a0f083d28b47598e76d2bf0367fc360d18ea2cd63aef46f7b",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "16-design-test",
  "targetUnitDigest": "e6bb34210242071a0f083d28b47598e76d2bf0367fc360d18ea2cd63aef46f7b",
  "targetAncestry": [
    "Documentation System Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source heading docs/architect/documentation-system-design.md#16-design-test (lines 669–669) is carried at docs/platform/documentation/architecture/documentation-system-design.md#16-design-test (lines 693–693); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 16. Design Test

This documentation system succeeds when a human unfamiliar with an area can:

1. Find the area.
2. Understand what it owns.
3. Read the current behavior.
4. Understand the architecture rationale.
5. Find exact contracts.
6. See what is settled and what is open.
7. Review or challenge the right decision surface.
8. Find proof.
9. Understand how to make a change.

It also succeeds when an agent with no chat history can:

1. Read the right entry points.
2. Distinguish canonical truth from discussion/proposal/history.
3. Identify authority and provenance.
4. Avoid silently reconciling conflicts.
5. Leave behind evidence and promoted learning in the right place.
```

### Full target shown text

```text
## 16. Design Test

This documentation system succeeds when a human unfamiliar with an area can:

1. Find the area.
2. Understand what it owns.
3. Read the current behavior.
4. Understand the architecture rationale.
5. Find exact contracts.
6. See what is settled and what is open.
7. Review or challenge the right decision surface.
8. Find proof.
9. Understand how to make a change.

It also succeeds when an agent with no chat history can:

1. Read the right entry points.
2. Distinguish canonical truth from discussion/proposal/history.
3. Identify authority and provenance.
4. Avoid silently reconciling conflicts.
5. Leave behind evidence and promoted learning in the right place.
```

## claim_b6e515b73c69ce75f0eaacf7a1edc524

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-95, lines 671–671.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-98.
Source digest: bc09d594fe57969ccdf42af1a87450de110ae15c05267b2c7e8dab63a1638c35
Target digest: bc09d594fe57969ccdf42af1a87450de110ae15c05267b2c7e8dab63a1638c35
Shown source SHA256: bc09d594fe57969ccdf42af1a87450de110ae15c05267b2c7e8dab63a1638c35
Shown target SHA256: bc09d594fe57969ccdf42af1a87450de110ae15c05267b2c7e8dab63a1638c35

### Proposed decision

```json
{
  "claimId": "claim_b6e515b73c69ce75f0eaacf7a1edc524",
  "sourceUnitDigest": "bc09d594fe57969ccdf42af1a87450de110ae15c05267b2c7e8dab63a1638c35",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-98",
  "targetUnitDigest": "bc09d594fe57969ccdf42af1a87450de110ae15c05267b2c7e8dab63a1638c35",
  "targetAncestry": [
    "Documentation System Design",
    "16. Design Test"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-95 (lines 671–671) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-98 (lines 695–695); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This documentation system succeeds when a human unfamiliar with an area can:
```

### Full target shown text

```text
This documentation system succeeds when a human unfamiliar with an area can:
```

## claim_44be1f0ad1795985b28c96fa13f1d1aa

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-96, lines 673–681.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-99.
Source digest: 6dc74b3bee8e34af889ab7972549381d37a8ecf6dc613e86774ef56d62ed091f
Target digest: 6dc74b3bee8e34af889ab7972549381d37a8ecf6dc613e86774ef56d62ed091f
Shown source SHA256: 6dc74b3bee8e34af889ab7972549381d37a8ecf6dc613e86774ef56d62ed091f
Shown target SHA256: 6dc74b3bee8e34af889ab7972549381d37a8ecf6dc613e86774ef56d62ed091f

### Proposed decision

```json
{
  "claimId": "claim_44be1f0ad1795985b28c96fa13f1d1aa",
  "sourceUnitDigest": "6dc74b3bee8e34af889ab7972549381d37a8ecf6dc613e86774ef56d62ed091f",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-99",
  "targetUnitDigest": "6dc74b3bee8e34af889ab7972549381d37a8ecf6dc613e86774ef56d62ed091f",
  "targetAncestry": [
    "Documentation System Design",
    "16. Design Test"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-96 (lines 673–681) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-99 (lines 697–705); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. Find the area.
2. Understand what it owns.
3. Read the current behavior.
4. Understand the architecture rationale.
5. Find exact contracts.
6. See what is settled and what is open.
7. Review or challenge the right decision surface.
8. Find proof.
9. Understand how to make a change.
```

### Full target shown text

```text
1. Find the area.
2. Understand what it owns.
3. Read the current behavior.
4. Understand the architecture rationale.
5. Find exact contracts.
6. See what is settled and what is open.
7. Review or challenge the right decision surface.
8. Find proof.
9. Understand how to make a change.
```

## claim_0797b70bddffdae81bf59d16a8115d91

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-97, lines 683–683.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-100.
Source digest: 9303b3f94f491d518eebd7d3a55ffe049173619ef4f63667d231e61657b83a46
Target digest: 9303b3f94f491d518eebd7d3a55ffe049173619ef4f63667d231e61657b83a46
Shown source SHA256: 9303b3f94f491d518eebd7d3a55ffe049173619ef4f63667d231e61657b83a46
Shown target SHA256: 9303b3f94f491d518eebd7d3a55ffe049173619ef4f63667d231e61657b83a46

### Proposed decision

```json
{
  "claimId": "claim_0797b70bddffdae81bf59d16a8115d91",
  "sourceUnitDigest": "9303b3f94f491d518eebd7d3a55ffe049173619ef4f63667d231e61657b83a46",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-100",
  "targetUnitDigest": "9303b3f94f491d518eebd7d3a55ffe049173619ef4f63667d231e61657b83a46",
  "targetAncestry": [
    "Documentation System Design",
    "16. Design Test"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-97 (lines 683–683) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-100 (lines 707–707); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
It also succeeds when an agent with no chat history can:
```

### Full target shown text

```text
It also succeeds when an agent with no chat history can:
```

## claim_63c77e4faa614734b185374230632af2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/documentation-system-design.md#unheaded-block-98, lines 685–689.
Target: docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-101.
Source digest: 9a03142f1f3f2979f82084d4a91f70b7da012e671d238d5c9005e7b85c681fdc
Target digest: 9a03142f1f3f2979f82084d4a91f70b7da012e671d238d5c9005e7b85c681fdc
Shown source SHA256: 9a03142f1f3f2979f82084d4a91f70b7da012e671d238d5c9005e7b85c681fdc
Shown target SHA256: 9a03142f1f3f2979f82084d4a91f70b7da012e671d238d5c9005e7b85c681fdc

### Proposed decision

```json
{
  "claimId": "claim_63c77e4faa614734b185374230632af2",
  "sourceUnitDigest": "9a03142f1f3f2979f82084d4a91f70b7da012e671d238d5c9005e7b85c681fdc",
  "targetOwner": "docs/platform/documentation/architecture/documentation-system-design.md",
  "targetAnchor": "unheaded-block-101",
  "targetUnitDigest": "9a03142f1f3f2979f82084d4a91f70b7da012e671d238d5c9005e7b85c681fdc",
  "targetAncestry": [
    "Documentation System Design",
    "16. Design Test"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep the mapped architecture rationale, not a new governance authority. Evidence: docs/doc-governance.md:9,475 names this source; source lines 19–23 explicitly distinguish promoted governance from design rationale. docs/platform/proposals/documentation-system-unification.md preserves the later unification proposal. Complete source unheaded-block docs/architect/documentation-system-design.md#unheaded-block-98 (lines 685–689) is carried at docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-101 (lines 709–713); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. Read the right entry points.
2. Distinguish canonical truth from discussion/proposal/history.
3. Identify authority and provenance.
4. Avoid silently reconciling conflicts.
5. Leave behind evidence and promoted learning in the right place.
```

### Full target shown text

```text
1. Read the right entry points.
2. Distinguish canonical truth from discussion/proposal/history.
3. Identify authority and provenance.
4. Avoid silently reconciling conflicts.
5. Leave behind evidence and promoted learning in the right place.
```
