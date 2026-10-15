# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-distillery-01.json
Shard SHA256: 92fc6f13591526b163d1b0e446cdb1627c148b554d0b20163154ce2da5db8d40
Source: docs/specs/distillery.md
Part 1/1; entries: **21**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 10/10 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_8d4400399f1a8eb72474e15691577d1f",
      "claim_030914214315e12e5ee492361b959fa8",
      "claim_40196224e217e77d89e57d0ffaf2abb2",
      "claim_a299172986d37bd5b62d22f36bbb8779",
      "claim_f9628d49e013fa3d4269ec432b7ba443",
      "claim_5c674a057e92715ff96b88a32ae0f3f4",
      "claim_00affff32942b999e43d36d74d1d9917",
      "claim_637b69327d2486602ee428a8b90936c8",
      "claim_4e14a24a1ef22e30a058748641d53ec4",
      "claim_4e61f8ab46c7791e563a905c6dcc2ba4",
      "claim_f94cf2b9ad1454f4fb3811c1cce319e6"
    ],
    "Weak-exact": [
      "claim_1152a6c3ef3f0678dca8b5c4b28e7816",
      "claim_38c50f26b5eddc17470cbce12d130184",
      "claim_f237c7dc974c7146bd3cd48a0a77d05d",
      "claim_1672eea7b12dcca590a6976253d8f4c9",
      "claim_7af861c8f84a4a69a8e1bf2c05073f03",
      "claim_edc3a60c5df1d6a3d5180c628f8f97ba",
      "claim_9d1d7d136b9a9ff869d6af4a12e042cc",
      "claim_10b6865dee162e3401febaf6d905128f",
      "claim_a81c4bc7792d5b2b576357b9543176fa"
    ],
    "Judgment": [
      "claim_6ff089f694102599d1fc8273ea6bbae9"
    ]
  },
  "unequalDigestPairs": [
    "claim_6ff089f694102599d1fc8273ea6bbae9"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_6ff089f694102599d1fc8273ea6bbae9"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_8d4400399f1a8eb72474e15691577d1f

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/distillery.md#unheaded-block-1; lines 1–7; ancestry [].
Target: docs/platform/distillery/spec.md#unheaded-block-1; ancestry [].
Source digest: 38b03ba75f9d6fd9e7f83f5ef5f909d79006e20e49a119a53a8a9a2c229e2e95
Target digest: 38b03ba75f9d6fd9e7f83f5ef5f909d79006e20e49a119a53a8a9a2c229e2e95
Shown source SHA256: 38b03ba75f9d6fd9e7f83f5ef5f909d79006e20e49a119a53a8a9a2c229e2e95
Shown target SHA256: 38b03ba75f9d6fd9e7f83f5ef5f909d79006e20e49a119a53a8a9a2c229e2e95

### Complete proposed decision

```json
{
  "claimId": "claim_8d4400399f1a8eb72474e15691577d1f",
  "sourceUnitDigest": "38b03ba75f9d6fd9e7f83f5ef5f909d79006e20e49a119a53a8a9a2c229e2e95",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/specs/distillery.md#unheaded-block-1 (source lines 1-7) is carried at docs/platform/distillery/spec.md#unheaded-block-1 (candidate lines 1-7). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "38b03ba75f9d6fd9e7f83f5ef5f909d79006e20e49a119a53a8a9a2c229e2e95",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
area: distillery
updated: 2026-07-17
sources: [distillery-state-consumer]
decisions: []
coverage: partial
---
```

### Full target shown text

```text
---
area: distillery
updated: 2026-07-17
sources: [distillery-state-consumer]
decisions: []
coverage: partial
---
```

## claim_6ff089f694102599d1fc8273ea6bbae9

Class: Judgment; mandatory deep: true.
Source: docs/specs/distillery.md#distillery-porting-lifecycle; lines 9–9; ancestry [].
Target: docs/platform/distillery/spec.md#distillery-porting-lifecycle; ancestry [].
Source digest: 42384c377bf6a357000397ce4b6204783d0a8b2ca90462159600bdb48b109a2a
Target digest: 23c12fdbccf665c6fc46ba5262d8cd57c2782e69f6938ea2509ffd336dcd0e61
Shown source SHA256: be9126817c6689f680dec8ce8d72e20b0fa3199573a9181ff4be5f04c5749cb0
Shown target SHA256: e277a9d01959074d93ed6bbde1ed11fb0bdb1f92232f4a37afd28e7fb73b111a

### Complete proposed decision

```json
{
  "claimId": "claim_6ff089f694102599d1fc8273ea6bbae9",
  "sourceUnitDigest": "42384c377bf6a357000397ce4b6204783d0a8b2ca90462159600bdb48b109a2a",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "distillery-porting-lifecycle",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/specs/distillery.md#distillery-porting-lifecycle (source lines 9-9) is carried at docs/platform/distillery/spec.md#distillery-porting-lifecycle (candidate lines 9-9). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "23c12fdbccf665c6fc46ba5262d8cd57c2782e69f6938ea2509ffd336dcd0e61",
  "targetAncestry": []
}
```

### Full source shown text

```text
# Distillery — Porting Lifecycle
```

### Full target shown text

````text
# Distillery — Porting Lifecycle

```txt
Document type: Specification
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/specs/distillery.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/specs/distillery.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.
````

## claim_1152a6c3ef3f0678dca8b5c4b28e7816

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/distillery.md#purpose; lines 11–11; ancestry ["Distillery — Porting Lifecycle"].
Target: docs/platform/distillery/spec.md#purpose; ancestry ["Distillery — Porting Lifecycle"].
Source digest: 7d67a471d1c385ca8cc0546874593e824df4cf0d1f9c1c6db9741ee0a8bd3acc
Target digest: 7d67a471d1c385ca8cc0546874593e824df4cf0d1f9c1c6db9741ee0a8bd3acc
Shown source SHA256: b35487fab86bac0b979bc09e32e7a9df83ee2888dc4785e58f6d7733e6b5d36a
Shown target SHA256: b35487fab86bac0b979bc09e32e7a9df83ee2888dc4785e58f6d7733e6b5d36a

### Complete proposed decision

```json
{
  "claimId": "claim_1152a6c3ef3f0678dca8b5c4b28e7816",
  "sourceUnitDigest": "7d67a471d1c385ca8cc0546874593e824df4cf0d1f9c1c6db9741ee0a8bd3acc",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "purpose",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/distillery.md#purpose (source lines 11-11) is carried at docs/platform/distillery/spec.md#purpose (candidate lines 33-33). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7d67a471d1c385ca8cc0546874593e824df4cf0d1f9c1c6db9741ee0a8bd3acc",
  "targetAncestry": [
    "Distillery — Porting Lifecycle"
  ]
}
```

### Full source shown text

```text
## Purpose

Distillery is forgent's reference-learning system: it studies external sibling
projects to find ideas and patterns worth reusing. This spec covers one part
of it — the **porting lifecycle**: how the adoption status of each considered
idea ("candidate") is tracked from first identification through to its final
outcome, and durably remembered so a rejected idea is never re-litigated by
accident. Other distillery capabilities (finding new source material, cross-
source comparison, candidate ranking) are out of scope here — see Open Gaps.
```

### Full target shown text

```text
## Purpose

Distillery is forgent's reference-learning system: it studies external sibling
projects to find ideas and patterns worth reusing. This spec covers one part
of it — the **porting lifecycle**: how the adoption status of each considered
idea ("candidate") is tracked from first identification through to its final
outcome, and durably remembered so a rejected idea is never re-litigated by
accident. Other distillery capabilities (finding new source material, cross-
source comparison, candidate ranking) are out of scope here — see Open Gaps.
```

## claim_030914214315e12e5ee492361b959fa8

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/distillery.md#unheaded-block-2; lines 13–19; ancestry ["Distillery — Porting Lifecycle","Purpose"].
Target: docs/platform/distillery/spec.md#unheaded-block-4; ancestry ["Distillery — Porting Lifecycle","Purpose"].
Source digest: 0601f676d24bb748feb8d5ef2ef95533e43b12671f4ded9087e77e0607038e9c
Target digest: 0601f676d24bb748feb8d5ef2ef95533e43b12671f4ded9087e77e0607038e9c
Shown source SHA256: 0601f676d24bb748feb8d5ef2ef95533e43b12671f4ded9087e77e0607038e9c
Shown target SHA256: 0601f676d24bb748feb8d5ef2ef95533e43b12671f4ded9087e77e0607038e9c

### Complete proposed decision

```json
{
  "claimId": "claim_030914214315e12e5ee492361b959fa8",
  "sourceUnitDigest": "0601f676d24bb748feb8d5ef2ef95533e43b12671f4ded9087e77e0607038e9c",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/distillery.md#unheaded-block-2 (source lines 13-19) is carried at docs/platform/distillery/spec.md#unheaded-block-4 (candidate lines 35-41). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0601f676d24bb748feb8d5ef2ef95533e43b12671f4ded9087e77e0607038e9c",
  "targetAncestry": [
    "Distillery — Porting Lifecycle",
    "Purpose"
  ]
}
```

### Full source shown text

```text
Distillery is forgent's reference-learning system: it studies external sibling
projects to find ideas and patterns worth reusing. This spec covers one part
of it — the **porting lifecycle**: how the adoption status of each considered
idea ("candidate") is tracked from first identification through to its final
outcome, and durably remembered so a rejected idea is never re-litigated by
accident. Other distillery capabilities (finding new source material, cross-
source comparison, candidate ranking) are out of scope here — see Open Gaps.
```

### Full target shown text

```text
Distillery is forgent's reference-learning system: it studies external sibling
projects to find ideas and patterns worth reusing. This spec covers one part
of it — the **porting lifecycle**: how the adoption status of each considered
idea ("candidate") is tracked from first identification through to its final
outcome, and durably remembered so a rejected idea is never re-litigated by
accident. Other distillery capabilities (finding new source material, cross-
source comparison, candidate ranking) are out of scope here — see Open Gaps.
```

## claim_38c50f26b5eddc17470cbce12d130184

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/distillery.md#entry-points-triggers; lines 21–21; ancestry ["Distillery — Porting Lifecycle"].
Target: docs/platform/distillery/spec.md#entry-points-triggers; ancestry ["Distillery — Porting Lifecycle"].
Source digest: 870113cef74cbf14b1466445a335f784131f0db0065053e0f31e0b7f016f0ff6
Target digest: 870113cef74cbf14b1466445a335f784131f0db0065053e0f31e0b7f016f0ff6
Shown source SHA256: a664d8c57bf4578464d7bdb85cac074626803898b596782bf9b5103d260eb83d
Shown target SHA256: a664d8c57bf4578464d7bdb85cac074626803898b596782bf9b5103d260eb83d

### Complete proposed decision

```json
{
  "claimId": "claim_38c50f26b5eddc17470cbce12d130184",
  "sourceUnitDigest": "870113cef74cbf14b1466445a335f784131f0db0065053e0f31e0b7f016f0ff6",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "entry-points-triggers",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/distillery.md#entry-points-triggers (source lines 21-21) is carried at docs/platform/distillery/spec.md#entry-points-triggers (candidate lines 43-43). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "870113cef74cbf14b1466445a335f784131f0db0065053e0f31e0b7f016f0ff6",
  "targetAncestry": [
    "Distillery — Porting Lifecycle"
  ]
}
```

### Full source shown text

```text
## Entry Points & Triggers

- A person or agent decides a porting candidate should move to its next
  lifecycle stage and runs the status-change command for it.
- Once, at cutover: a seeding operation establishes the correct current status
  for every candidate already on record, before the live status-change command
  is used for the first time.
```

### Full target shown text

```text
## Entry Points & Triggers

- A person or agent decides a porting candidate should move to its next
  lifecycle stage and runs the status-change command for it.
- Once, at cutover: a seeding operation establishes the correct current status
  for every candidate already on record, before the live status-change command
  is used for the first time.
```

## claim_40196224e217e77d89e57d0ffaf2abb2

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/distillery.md#unheaded-block-3; lines 23–27; ancestry ["Distillery — Porting Lifecycle","Entry Points & Triggers"].
Target: docs/platform/distillery/spec.md#unheaded-block-5; ancestry ["Distillery — Porting Lifecycle","Entry Points & Triggers"].
Source digest: 334c0e187773d73024ba617a9bed97656d0bbbcfdd3dcc49b1a6c8fd90b13275
Target digest: 334c0e187773d73024ba617a9bed97656d0bbbcfdd3dcc49b1a6c8fd90b13275
Shown source SHA256: 334c0e187773d73024ba617a9bed97656d0bbbcfdd3dcc49b1a6c8fd90b13275
Shown target SHA256: 334c0e187773d73024ba617a9bed97656d0bbbcfdd3dcc49b1a6c8fd90b13275

### Complete proposed decision

```json
{
  "claimId": "claim_40196224e217e77d89e57d0ffaf2abb2",
  "sourceUnitDigest": "334c0e187773d73024ba617a9bed97656d0bbbcfdd3dcc49b1a6c8fd90b13275",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/distillery.md#unheaded-block-3 (source lines 23-27) is carried at docs/platform/distillery/spec.md#unheaded-block-5 (candidate lines 45-49). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "334c0e187773d73024ba617a9bed97656d0bbbcfdd3dcc49b1a6c8fd90b13275",
  "targetAncestry": [
    "Distillery — Porting Lifecycle",
    "Entry Points & Triggers"
  ]
}
```

### Full source shown text

```text
- A person or agent decides a porting candidate should move to its next
  lifecycle stage and runs the status-change command for it.
- Once, at cutover: a seeding operation establishes the correct current status
  for every candidate already on record, before the live status-change command
  is used for the first time.
```

### Full target shown text

```text
- A person or agent decides a porting candidate should move to its next
  lifecycle stage and runs the status-change command for it.
- Once, at cutover: a seeding operation establishes the correct current status
  for every candidate already on record, before the live status-change command
  is used for the first time.
```

## claim_f237c7dc974c7146bd3cd48a0a77d05d

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/distillery.md#data-dictionary; lines 29–29; ancestry ["Distillery — Porting Lifecycle"].
Target: docs/platform/distillery/spec.md#data-dictionary; ancestry ["Distillery — Porting Lifecycle"].
Source digest: b0061eedc26338d900dcd637e1fecd0b447d89f7be32b6665942b2a39bcffd0c
Target digest: b0061eedc26338d900dcd637e1fecd0b447d89f7be32b6665942b2a39bcffd0c
Shown source SHA256: 90dac6ad64485b0e140c8b793ab86c997ff890df8c5fe3465c2f84b2175bf248
Shown target SHA256: 90dac6ad64485b0e140c8b793ab86c997ff890df8c5fe3465c2f84b2175bf248

### Complete proposed decision

```json
{
  "claimId": "claim_f237c7dc974c7146bd3cd48a0a77d05d",
  "sourceUnitDigest": "b0061eedc26338d900dcd637e1fecd0b447d89f7be32b6665942b2a39bcffd0c",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "data-dictionary",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/distillery.md#data-dictionary (source lines 29-29) is carried at docs/platform/distillery/spec.md#data-dictionary (candidate lines 51-51). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b0061eedc26338d900dcd637e1fecd0b447d89f7be32b6665942b2a39bcffd0c",
  "targetAncestry": [
    "Distillery — Porting Lifecycle"
  ]
}
```

### Full source shown text

```text
## Data Dictionary

| Field | Meaning |
|---|---|
| Feature (id) | The name of the extracted idea/pattern under consideration. Unique. |
| Status | The candidate's current lifecycle stage — see enum below. This is the ONLY field this spec's lifecycle governs (R1). |
| `candidate` | Identified as reusable, not yet committed to. |
| `planned` | Decided to pursue; work has not started. |
| `in-progress` | Actively being built/integrated. |
| `ported` | Adopted as-is and shipped. |
| `adapted` | Adopted with modification and shipped. |
| `rejected` | Considered and declined — recorded permanently so it is never re-litigated. |
| Score, Local, Đích (destination), Commit, Notes | Free-form metadata about the candidate. NOT governed by this lifecycle (R1) — still edited directly, unaffected by a status change. |
```

### Full target shown text

```text
## Data Dictionary

| Field | Meaning |
|---|---|
| Feature (id) | The name of the extracted idea/pattern under consideration. Unique. |
| Status | The candidate's current lifecycle stage — see enum below. This is the ONLY field this spec's lifecycle governs (R1). |
| `candidate` | Identified as reusable, not yet committed to. |
| `planned` | Decided to pursue; work has not started. |
| `in-progress` | Actively being built/integrated. |
| `ported` | Adopted as-is and shipped. |
| `adapted` | Adopted with modification and shipped. |
| `rejected` | Considered and declined — recorded permanently so it is never re-litigated. |
| Score, Local, Đích (destination), Commit, Notes | Free-form metadata about the candidate. NOT governed by this lifecycle (R1) — still edited directly, unaffected by a status change. |
```

## claim_a299172986d37bd5b62d22f36bbb8779

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/distillery.md#unheaded-block-4; lines 31–41; ancestry ["Distillery — Porting Lifecycle","Data Dictionary"].
Target: docs/platform/distillery/spec.md#unheaded-block-6; ancestry ["Distillery — Porting Lifecycle","Data Dictionary"].
Source digest: 3f0f6269d0ff09f0df3c6666b873653c8d001b1771a137fa043bec48268e6834
Target digest: 3f0f6269d0ff09f0df3c6666b873653c8d001b1771a137fa043bec48268e6834
Shown source SHA256: 3f0f6269d0ff09f0df3c6666b873653c8d001b1771a137fa043bec48268e6834
Shown target SHA256: 3f0f6269d0ff09f0df3c6666b873653c8d001b1771a137fa043bec48268e6834

### Complete proposed decision

```json
{
  "claimId": "claim_a299172986d37bd5b62d22f36bbb8779",
  "sourceUnitDigest": "3f0f6269d0ff09f0df3c6666b873653c8d001b1771a137fa043bec48268e6834",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/distillery.md#unheaded-block-4 (source lines 31-41) is carried at docs/platform/distillery/spec.md#unheaded-block-6 (candidate lines 53-63). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3f0f6269d0ff09f0df3c6666b873653c8d001b1771a137fa043bec48268e6834",
  "targetAncestry": [
    "Distillery — Porting Lifecycle",
    "Data Dictionary"
  ]
}
```

### Full source shown text

```text
| Field | Meaning |
|---|---|
| Feature (id) | The name of the extracted idea/pattern under consideration. Unique. |
| Status | The candidate's current lifecycle stage — see enum below. This is the ONLY field this spec's lifecycle governs (R1). |
| `candidate` | Identified as reusable, not yet committed to. |
| `planned` | Decided to pursue; work has not started. |
| `in-progress` | Actively being built/integrated. |
| `ported` | Adopted as-is and shipped. |
| `adapted` | Adopted with modification and shipped. |
| `rejected` | Considered and declined — recorded permanently so it is never re-litigated. |
| Score, Local, Đích (destination), Commit, Notes | Free-form metadata about the candidate. NOT governed by this lifecycle (R1) — still edited directly, unaffected by a status change. |
```

### Full target shown text

```text
| Field | Meaning |
|---|---|
| Feature (id) | The name of the extracted idea/pattern under consideration. Unique. |
| Status | The candidate's current lifecycle stage — see enum below. This is the ONLY field this spec's lifecycle governs (R1). |
| `candidate` | Identified as reusable, not yet committed to. |
| `planned` | Decided to pursue; work has not started. |
| `in-progress` | Actively being built/integrated. |
| `ported` | Adopted as-is and shipped. |
| `adapted` | Adopted with modification and shipped. |
| `rejected` | Considered and declined — recorded permanently so it is never re-litigated. |
| Score, Local, Đích (destination), Commit, Notes | Free-form metadata about the candidate. NOT governed by this lifecycle (R1) — still edited directly, unaffected by a status change. |
```

## claim_1672eea7b12dcca590a6976253d8f4c9

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/distillery.md#behaviors-operations; lines 43–43; ancestry ["Distillery — Porting Lifecycle"].
Target: docs/platform/distillery/spec.md#behaviors-operations; ancestry ["Distillery — Porting Lifecycle"].
Source digest: 8944ba7233c55864d1d718a2e6a33aae31d0e4623adeb8eb6f911026282ed1f1
Target digest: 8944ba7233c55864d1d718a2e6a33aae31d0e4623adeb8eb6f911026282ed1f1
Shown source SHA256: 75dde3a43bead69ad3d7ac5c90ed1e4ae1ac8c07ca314f534ba632e5d387574a
Shown target SHA256: 75dde3a43bead69ad3d7ac5c90ed1e4ae1ac8c07ca314f534ba632e5d387574a

### Complete proposed decision

```json
{
  "claimId": "claim_1672eea7b12dcca590a6976253d8f4c9",
  "sourceUnitDigest": "8944ba7233c55864d1d718a2e6a33aae31d0e4623adeb8eb6f911026282ed1f1",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "behaviors-operations",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/distillery.md#behaviors-operations (source lines 43-43) is carried at docs/platform/distillery/spec.md#behaviors-operations (candidate lines 65-65). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "8944ba7233c55864d1d718a2e6a33aae31d0e4623adeb8eb6f911026282ed1f1",
  "targetAncestry": [
    "Distillery — Porting Lifecycle"
  ]
}
```

### Full source shown text

```text
## Behaviors & Operations

**Advance a candidate's status.**
- Triggers when: an operator or agent decides a candidate is ready for its
  next lifecycle stage and issues the move.
- Blocked when: the requested move is not one of the legal next stages for
  the candidate's current status (see the enum's legal order above — each
  status has a fixed, small set of stages it may move to next; most illegal
  moves are attempts to skip stages or to move a candidate that has already
  reached a final stage).
- What changes: the candidate's status is durably recorded as changed. The
  human-readable porting log is updated to show the new status for that one
  candidate — nothing else on the log changes.
- Side effects: the change is appended to a permanent record of every status
  change ever made, so the complete history is always reconstructable from
  scratch (R2).
- What the operator observes: on success, confirmation that the move
  happened. On an illegal move, a clear explanation of why (the candidate's
  current status and what moves are actually legal from there) — and nothing
  changes, neither the record nor the human-readable log.

**Seed historical status (one-time, at cutover only).**
- Triggers when: the porting lifecycle is switched on for the first time,
  before any live status-change command has been used.
- What changes: every candidate already on record gets its current status
  established in the durable record, matching exactly what the human-readable
  log already showed for it — no candidate starts over at the beginning.
- What each status is "reached" through: the seeding operation only ever uses
  the SAME legal stage-to-stage moves the live command would use — it never
  takes a shortcut straight to a candidate's final status. This is itself a
  proof that every candidate's recorded status is one the lifecycle can
  actually produce.
- Side effect / self-check: if a candidate's current status could NOT be
  reached through any legal sequence of moves, seeding for that candidate
  would fail loudly rather than silently accepting it — this has not
  happened with real data yet (Edge Cases Settled).
- Running the seeding operation again after it already ran changes nothing —
  it recognizes work already done and skips it.
```

### Full target shown text

```text
## Behaviors & Operations

**Advance a candidate's status.**
- Triggers when: an operator or agent decides a candidate is ready for its
  next lifecycle stage and issues the move.
- Blocked when: the requested move is not one of the legal next stages for
  the candidate's current status (see the enum's legal order above — each
  status has a fixed, small set of stages it may move to next; most illegal
  moves are attempts to skip stages or to move a candidate that has already
  reached a final stage).
- What changes: the candidate's status is durably recorded as changed. The
  human-readable porting log is updated to show the new status for that one
  candidate — nothing else on the log changes.
- Side effects: the change is appended to a permanent record of every status
  change ever made, so the complete history is always reconstructable from
  scratch (R2).
- What the operator observes: on success, confirmation that the move
  happened. On an illegal move, a clear explanation of why (the candidate's
  current status and what moves are actually legal from there) — and nothing
  changes, neither the record nor the human-readable log.

**Seed historical status (one-time, at cutover only).**
- Triggers when: the porting lifecycle is switched on for the first time,
  before any live status-change command has been used.
- What changes: every candidate already on record gets its current status
  established in the durable record, matching exactly what the human-readable
  log already showed for it — no candidate starts over at the beginning.
- What each status is "reached" through: the seeding operation only ever uses
  the SAME legal stage-to-stage moves the live command would use — it never
  takes a shortcut straight to a candidate's final status. This is itself a
  proof that every candidate's recorded status is one the lifecycle can
  actually produce.
- Side effect / self-check: if a candidate's current status could NOT be
  reached through any legal sequence of moves, seeding for that candidate
  would fail loudly rather than silently accepting it — this has not
  happened with real data yet (Edge Cases Settled).
- Running the seeding operation again after it already ran changes nothing —
  it recognizes work already done and skips it.
```

## claim_f9628d49e013fa3d4269ec432b7ba443

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/distillery.md#unheaded-block-5; lines 45–62; ancestry ["Distillery — Porting Lifecycle","Behaviors & Operations"].
Target: docs/platform/distillery/spec.md#unheaded-block-7; ancestry ["Distillery — Porting Lifecycle","Behaviors & Operations"].
Source digest: 51355c05a9fd75683883f82bc4d1d691274ca95e8d83722abe0933860c4bef99
Target digest: 51355c05a9fd75683883f82bc4d1d691274ca95e8d83722abe0933860c4bef99
Shown source SHA256: 51355c05a9fd75683883f82bc4d1d691274ca95e8d83722abe0933860c4bef99
Shown target SHA256: 51355c05a9fd75683883f82bc4d1d691274ca95e8d83722abe0933860c4bef99

### Complete proposed decision

```json
{
  "claimId": "claim_f9628d49e013fa3d4269ec432b7ba443",
  "sourceUnitDigest": "51355c05a9fd75683883f82bc4d1d691274ca95e8d83722abe0933860c4bef99",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/distillery.md#unheaded-block-5 (source lines 45-62) is carried at docs/platform/distillery/spec.md#unheaded-block-7 (candidate lines 67-84). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "51355c05a9fd75683883f82bc4d1d691274ca95e8d83722abe0933860c4bef99",
  "targetAncestry": [
    "Distillery — Porting Lifecycle",
    "Behaviors & Operations"
  ]
}
```

### Full source shown text

```text
**Advance a candidate's status.**
- Triggers when: an operator or agent decides a candidate is ready for its
  next lifecycle stage and issues the move.
- Blocked when: the requested move is not one of the legal next stages for
  the candidate's current status (see the enum's legal order above — each
  status has a fixed, small set of stages it may move to next; most illegal
  moves are attempts to skip stages or to move a candidate that has already
  reached a final stage).
- What changes: the candidate's status is durably recorded as changed. The
  human-readable porting log is updated to show the new status for that one
  candidate — nothing else on the log changes.
- Side effects: the change is appended to a permanent record of every status
  change ever made, so the complete history is always reconstructable from
  scratch (R2).
- What the operator observes: on success, confirmation that the move
  happened. On an illegal move, a clear explanation of why (the candidate's
  current status and what moves are actually legal from there) — and nothing
  changes, neither the record nor the human-readable log.
```

### Full target shown text

```text
**Advance a candidate's status.**
- Triggers when: an operator or agent decides a candidate is ready for its
  next lifecycle stage and issues the move.
- Blocked when: the requested move is not one of the legal next stages for
  the candidate's current status (see the enum's legal order above — each
  status has a fixed, small set of stages it may move to next; most illegal
  moves are attempts to skip stages or to move a candidate that has already
  reached a final stage).
- What changes: the candidate's status is durably recorded as changed. The
  human-readable porting log is updated to show the new status for that one
  candidate — nothing else on the log changes.
- Side effects: the change is appended to a permanent record of every status
  change ever made, so the complete history is always reconstructable from
  scratch (R2).
- What the operator observes: on success, confirmation that the move
  happened. On an illegal move, a clear explanation of why (the candidate's
  current status and what moves are actually legal from there) — and nothing
  changes, neither the record nor the human-readable log.
```

## claim_5c674a057e92715ff96b88a32ae0f3f4

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/distillery.md#unheaded-block-6; lines 64–80; ancestry ["Distillery — Porting Lifecycle","Behaviors & Operations"].
Target: docs/platform/distillery/spec.md#unheaded-block-8; ancestry ["Distillery — Porting Lifecycle","Behaviors & Operations"].
Source digest: 02543d603ca0b1be88bae787b73b2603664554883fc89896ab0f0e916e3287c4
Target digest: 02543d603ca0b1be88bae787b73b2603664554883fc89896ab0f0e916e3287c4
Shown source SHA256: 02543d603ca0b1be88bae787b73b2603664554883fc89896ab0f0e916e3287c4
Shown target SHA256: 02543d603ca0b1be88bae787b73b2603664554883fc89896ab0f0e916e3287c4

### Complete proposed decision

```json
{
  "claimId": "claim_5c674a057e92715ff96b88a32ae0f3f4",
  "sourceUnitDigest": "02543d603ca0b1be88bae787b73b2603664554883fc89896ab0f0e916e3287c4",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/distillery.md#unheaded-block-6 (source lines 64-80) is carried at docs/platform/distillery/spec.md#unheaded-block-8 (candidate lines 86-102). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "02543d603ca0b1be88bae787b73b2603664554883fc89896ab0f0e916e3287c4",
  "targetAncestry": [
    "Distillery — Porting Lifecycle",
    "Behaviors & Operations"
  ]
}
```

### Full source shown text

```text
**Seed historical status (one-time, at cutover only).**
- Triggers when: the porting lifecycle is switched on for the first time,
  before any live status-change command has been used.
- What changes: every candidate already on record gets its current status
  established in the durable record, matching exactly what the human-readable
  log already showed for it — no candidate starts over at the beginning.
- What each status is "reached" through: the seeding operation only ever uses
  the SAME legal stage-to-stage moves the live command would use — it never
  takes a shortcut straight to a candidate's final status. This is itself a
  proof that every candidate's recorded status is one the lifecycle can
  actually produce.
- Side effect / self-check: if a candidate's current status could NOT be
  reached through any legal sequence of moves, seeding for that candidate
  would fail loudly rather than silently accepting it — this has not
  happened with real data yet (Edge Cases Settled).
- Running the seeding operation again after it already ran changes nothing —
  it recognizes work already done and skips it.
```

### Full target shown text

```text
**Seed historical status (one-time, at cutover only).**
- Triggers when: the porting lifecycle is switched on for the first time,
  before any live status-change command has been used.
- What changes: every candidate already on record gets its current status
  established in the durable record, matching exactly what the human-readable
  log already showed for it — no candidate starts over at the beginning.
- What each status is "reached" through: the seeding operation only ever uses
  the SAME legal stage-to-stage moves the live command would use — it never
  takes a shortcut straight to a candidate's final status. This is itself a
  proof that every candidate's recorded status is one the lifecycle can
  actually produce.
- Side effect / self-check: if a candidate's current status could NOT be
  reached through any legal sequence of moves, seeding for that candidate
  would fail loudly rather than silently accepting it — this has not
  happened with real data yet (Edge Cases Settled).
- Running the seeding operation again after it already ran changes nothing —
  it recognizes work already done and skips it.
```

## claim_7af861c8f84a4a69a8e1bf2c05073f03

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/distillery.md#actors-access; lines 82–82; ancestry ["Distillery — Porting Lifecycle"].
Target: docs/platform/distillery/spec.md#actors-access; ancestry ["Distillery — Porting Lifecycle"].
Source digest: af0dc11faf7105cb162d9ac1088a5b1c0cd5f5eeec2774b7004540fe897fd326
Target digest: af0dc11faf7105cb162d9ac1088a5b1c0cd5f5eeec2774b7004540fe897fd326
Shown source SHA256: 9ea140bdff27ffced97d1989b1fc473f7df31ea8da39a9f7cfdf32e387bcc903
Shown target SHA256: 9ea140bdff27ffced97d1989b1fc473f7df31ea8da39a9f7cfdf32e387bcc903

### Complete proposed decision

```json
{
  "claimId": "claim_7af861c8f84a4a69a8e1bf2c05073f03",
  "sourceUnitDigest": "af0dc11faf7105cb162d9ac1088a5b1c0cd5f5eeec2774b7004540fe897fd326",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "actors-access",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/distillery.md#actors-access (source lines 82-82) is carried at docs/platform/distillery/spec.md#actors-access (candidate lines 104-104). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "af0dc11faf7105cb162d9ac1088a5b1c0cd5f5eeec2774b7004540fe897fd326",
  "targetAncestry": [
    "Distillery — Porting Lifecycle"
  ]
}
```

### Full source shown text

```text
## Actors & Access

- **Operator/agent** — anyone with access to the distillery tooling. No
  additional access control beyond ordinary tool access; this is internal
  workshop tooling, not a user-facing product surface.
```

### Full target shown text

```text
## Actors & Access

- **Operator/agent** — anyone with access to the distillery tooling. No
  additional access control beyond ordinary tool access; this is internal
  workshop tooling, not a user-facing product surface.
```

## claim_00affff32942b999e43d36d74d1d9917

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/distillery.md#unheaded-block-7; lines 84–86; ancestry ["Distillery — Porting Lifecycle","Actors & Access"].
Target: docs/platform/distillery/spec.md#unheaded-block-9; ancestry ["Distillery — Porting Lifecycle","Actors & Access"].
Source digest: ecbc1e3549a472da566e42516264977768db33d26faedc079f50e6d641b9dc01
Target digest: ecbc1e3549a472da566e42516264977768db33d26faedc079f50e6d641b9dc01
Shown source SHA256: ecbc1e3549a472da566e42516264977768db33d26faedc079f50e6d641b9dc01
Shown target SHA256: ecbc1e3549a472da566e42516264977768db33d26faedc079f50e6d641b9dc01

### Complete proposed decision

```json
{
  "claimId": "claim_00affff32942b999e43d36d74d1d9917",
  "sourceUnitDigest": "ecbc1e3549a472da566e42516264977768db33d26faedc079f50e6d641b9dc01",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/distillery.md#unheaded-block-7 (source lines 84-86) is carried at docs/platform/distillery/spec.md#unheaded-block-9 (candidate lines 106-108). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ecbc1e3549a472da566e42516264977768db33d26faedc079f50e6d641b9dc01",
  "targetAncestry": [
    "Distillery — Porting Lifecycle",
    "Actors & Access"
  ]
}
```

### Full source shown text

```text
- **Operator/agent** — anyone with access to the distillery tooling. No
  additional access control beyond ordinary tool access; this is internal
  workshop tooling, not a user-facing product surface.
```

### Full target shown text

```text
- **Operator/agent** — anyone with access to the distillery tooling. No
  additional access control beyond ordinary tool access; this is internal
  workshop tooling, not a user-facing product surface.
```

## claim_edc3a60c5df1d6a3d5180c628f8f97ba

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/distillery.md#business-rules; lines 88–88; ancestry ["Distillery — Porting Lifecycle"].
Target: docs/platform/distillery/spec.md#business-rules; ancestry ["Distillery — Porting Lifecycle"].
Source digest: bf43300daaca9c3415aecfd3aa504ea3ef398b02ba4d9a78406d930e813fbc1e
Target digest: bf43300daaca9c3415aecfd3aa504ea3ef398b02ba4d9a78406d930e813fbc1e
Shown source SHA256: 4fd7dade6b15ebd5d7927a1ebe9837553f279c61adceeaf955b4c4e165fbabd8
Shown target SHA256: 4fd7dade6b15ebd5d7927a1ebe9837553f279c61adceeaf955b4c4e165fbabd8

### Complete proposed decision

```json
{
  "claimId": "claim_edc3a60c5df1d6a3d5180c628f8f97ba",
  "sourceUnitDigest": "bf43300daaca9c3415aecfd3aa504ea3ef398b02ba4d9a78406d930e813fbc1e",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "business-rules",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/distillery.md#business-rules (source lines 88-88) is carried at docs/platform/distillery/spec.md#business-rules (candidate lines 110-110). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "bf43300daaca9c3415aecfd3aa504ea3ef398b02ba4d9a78406d930e813fbc1e",
  "targetAncestry": [
    "Distillery — Porting Lifecycle"
  ]
}
```

### Full source shown text

```text
## Business Rules

- **R1.** The lifecycle governs the Status field only. Score, Local,
  destination, commit, and notes stay freely editable and are never touched
  by a status change.
- **R2.** The durable record of status changes is the source of truth. The
  human-readable porting log is always a reflection of it — after cutover,
  it is never hand-edited for Status again.
- **R3.** Status changes for distillery candidates go through the same kind
  of durable, rule-checked mechanism forgent uses for tracking its own
  work — not a separate, informal mechanism built just for this.
```

### Full target shown text

```text
## Business Rules

- **R1.** The lifecycle governs the Status field only. Score, Local,
  destination, commit, and notes stay freely editable and are never touched
  by a status change.
- **R2.** The durable record of status changes is the source of truth. The
  human-readable porting log is always a reflection of it — after cutover,
  it is never hand-edited for Status again.
- **R3.** Status changes for distillery candidates go through the same kind
  of durable, rule-checked mechanism forgent uses for tracking its own
  work — not a separate, informal mechanism built just for this.
```

## claim_637b69327d2486602ee428a8b90936c8

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/distillery.md#unheaded-block-8; lines 90–98; ancestry ["Distillery — Porting Lifecycle","Business Rules"].
Target: docs/platform/distillery/spec.md#unheaded-block-10; ancestry ["Distillery — Porting Lifecycle","Business Rules"].
Source digest: f770390c5ca45f6660f36a2c5dff4a537e9b0ac7a021d4a00c09643851c1d49b
Target digest: f770390c5ca45f6660f36a2c5dff4a537e9b0ac7a021d4a00c09643851c1d49b
Shown source SHA256: f770390c5ca45f6660f36a2c5dff4a537e9b0ac7a021d4a00c09643851c1d49b
Shown target SHA256: f770390c5ca45f6660f36a2c5dff4a537e9b0ac7a021d4a00c09643851c1d49b

### Complete proposed decision

```json
{
  "claimId": "claim_637b69327d2486602ee428a8b90936c8",
  "sourceUnitDigest": "f770390c5ca45f6660f36a2c5dff4a537e9b0ac7a021d4a00c09643851c1d49b",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "unheaded-block-10",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/distillery.md#unheaded-block-8 (source lines 90-98) is carried at docs/platform/distillery/spec.md#unheaded-block-10 (candidate lines 112-120). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f770390c5ca45f6660f36a2c5dff4a537e9b0ac7a021d4a00c09643851c1d49b",
  "targetAncestry": [
    "Distillery — Porting Lifecycle",
    "Business Rules"
  ]
}
```

### Full source shown text

```text
- **R1.** The lifecycle governs the Status field only. Score, Local,
  destination, commit, and notes stay freely editable and are never touched
  by a status change.
- **R2.** The durable record of status changes is the source of truth. The
  human-readable porting log is always a reflection of it — after cutover,
  it is never hand-edited for Status again.
- **R3.** Status changes for distillery candidates go through the same kind
  of durable, rule-checked mechanism forgent uses for tracking its own
  work — not a separate, informal mechanism built just for this.
```

### Full target shown text

```text
- **R1.** The lifecycle governs the Status field only. Score, Local,
  destination, commit, and notes stay freely editable and are never touched
  by a status change.
- **R2.** The durable record of status changes is the source of truth. The
  human-readable porting log is always a reflection of it — after cutover,
  it is never hand-edited for Status again.
- **R3.** Status changes for distillery candidates go through the same kind
  of durable, rule-checked mechanism forgent uses for tracking its own
  work — not a separate, informal mechanism built just for this.
```

## claim_9d1d7d136b9a9ff869d6af4a12e042cc

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/distillery.md#edge-cases-settled; lines 100–100; ancestry ["Distillery — Porting Lifecycle"].
Target: docs/platform/distillery/spec.md#edge-cases-settled; ancestry ["Distillery — Porting Lifecycle"].
Source digest: 1bb6dbe7fdbfd4c9a7f067777e5cbeaa6b0af5a21bcd9633f5c2de56e164293b
Target digest: 1bb6dbe7fdbfd4c9a7f067777e5cbeaa6b0af5a21bcd9633f5c2de56e164293b
Shown source SHA256: 17519de401d2d0b5a1722fab137447463c8996a3e7dd4c3256bc2103e8a035db
Shown target SHA256: 17519de401d2d0b5a1722fab137447463c8996a3e7dd4c3256bc2103e8a035db

### Complete proposed decision

```json
{
  "claimId": "claim_9d1d7d136b9a9ff869d6af4a12e042cc",
  "sourceUnitDigest": "1bb6dbe7fdbfd4c9a7f067777e5cbeaa6b0af5a21bcd9633f5c2de56e164293b",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "edge-cases-settled",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/distillery.md#edge-cases-settled (source lines 100-100) is carried at docs/platform/distillery/spec.md#edge-cases-settled (candidate lines 122-122). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "1bb6dbe7fdbfd4c9a7f067777e5cbeaa6b0af5a21bcd9633f5c2de56e164293b",
  "targetAncestry": [
    "Distillery — Porting Lifecycle"
  ]
}
```

### Full source shown text

```text
## Edge Cases Settled

- A candidate may end its life either by being rejected outright (never
  built) or by being rejected after active work started — both are legal,
  final outcomes.
- An illegal move (skipping a stage, or trying to move a candidate that has
  already reached a final stage) is refused in full: neither the durable
  record nor the human-readable log changes.
- As of this writing, every candidate on record reached its current status
  through a sequence the lifecycle actually allows — none needed an
  exception.
```

### Full target shown text

```text
## Edge Cases Settled

- A candidate may end its life either by being rejected outright (never
  built) or by being rejected after active work started — both are legal,
  final outcomes.
- An illegal move (skipping a stage, or trying to move a candidate that has
  already reached a final stage) is refused in full: neither the durable
  record nor the human-readable log changes.
- As of this writing, every candidate on record reached its current status
  through a sequence the lifecycle actually allows — none needed an
  exception.
```

## claim_4e14a24a1ef22e30a058748641d53ec4

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/distillery.md#unheaded-block-9; lines 102–110; ancestry ["Distillery — Porting Lifecycle","Edge Cases Settled"].
Target: docs/platform/distillery/spec.md#unheaded-block-11; ancestry ["Distillery — Porting Lifecycle","Edge Cases Settled"].
Source digest: 60a616595e9c4ddd3d8a4514541aaf9c72c57b1bcc93d97889c5769189adc60d
Target digest: 60a616595e9c4ddd3d8a4514541aaf9c72c57b1bcc93d97889c5769189adc60d
Shown source SHA256: 60a616595e9c4ddd3d8a4514541aaf9c72c57b1bcc93d97889c5769189adc60d
Shown target SHA256: 60a616595e9c4ddd3d8a4514541aaf9c72c57b1bcc93d97889c5769189adc60d

### Complete proposed decision

```json
{
  "claimId": "claim_4e14a24a1ef22e30a058748641d53ec4",
  "sourceUnitDigest": "60a616595e9c4ddd3d8a4514541aaf9c72c57b1bcc93d97889c5769189adc60d",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "unheaded-block-11",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/distillery.md#unheaded-block-9 (source lines 102-110) is carried at docs/platform/distillery/spec.md#unheaded-block-11 (candidate lines 124-132). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "60a616595e9c4ddd3d8a4514541aaf9c72c57b1bcc93d97889c5769189adc60d",
  "targetAncestry": [
    "Distillery — Porting Lifecycle",
    "Edge Cases Settled"
  ]
}
```

### Full source shown text

```text
- A candidate may end its life either by being rejected outright (never
  built) or by being rejected after active work started — both are legal,
  final outcomes.
- An illegal move (skipping a stage, or trying to move a candidate that has
  already reached a final stage) is refused in full: neither the durable
  record nor the human-readable log changes.
- As of this writing, every candidate on record reached its current status
  through a sequence the lifecycle actually allows — none needed an
  exception.
```

### Full target shown text

```text
- A candidate may end its life either by being rejected outright (never
  built) or by being rejected after active work started — both are legal,
  final outcomes.
- An illegal move (skipping a stage, or trying to move a candidate that has
  already reached a final stage) is refused in full: neither the durable
  record nor the human-readable log changes.
- As of this writing, every candidate on record reached its current status
  through a sequence the lifecycle actually allows — none needed an
  exception.
```

## claim_10b6865dee162e3401febaf6d905128f

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/distillery.md#open-gaps; lines 112–112; ancestry ["Distillery — Porting Lifecycle"].
Target: docs/platform/distillery/spec.md#open-gaps; ancestry ["Distillery — Porting Lifecycle"].
Source digest: 3fd19bb3ad9f0ce5f6db178d1904f98fd67c78ddb7b39f1eb70cd561e52faadd
Target digest: 3fd19bb3ad9f0ce5f6db178d1904f98fd67c78ddb7b39f1eb70cd561e52faadd
Shown source SHA256: 54cacbb33e9167f3168bd141150fee02ea3596d9cd0bec14a850ca6968194def
Shown target SHA256: 54cacbb33e9167f3168bd141150fee02ea3596d9cd0bec14a850ca6968194def

### Complete proposed decision

```json
{
  "claimId": "claim_10b6865dee162e3401febaf6d905128f",
  "sourceUnitDigest": "3fd19bb3ad9f0ce5f6db178d1904f98fd67c78ddb7b39f1eb70cd561e52faadd",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "open-gaps",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/distillery.md#open-gaps (source lines 112-112) is carried at docs/platform/distillery/spec.md#open-gaps (candidate lines 134-134). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3fd19bb3ad9f0ce5f6db178d1904f98fd67c78ddb7b39f1eb70cd561e52faadd",
  "targetAncestry": [
    "Distillery — Porting Lifecycle"
  ]
}
```

### Full source shown text

```text
## Open Gaps

- The status-change command currently must be run from the project's own
  root location — running it from elsewhere is not yet supported.
- The one-time seeding operation assumes every historical candidate reached
  its current status the "normal" way (see Edge Cases Settled) — if a real
  historical case ever turns out not to fit, that nuance would only be
  recoverable from the free-form Notes column, not the durable record.
- Distillery's other capabilities — finding new source material to review,
  comparing ideas across sources, ranking candidates by score — are not yet
  described in this spec; only the porting-status lifecycle is covered here.
  `coverage: partial` reflects this.
- `docs/specs/system-overview.md` already lists a `distillery` area entry
  pointing here (and a separate `distill-skill` entry still marked
  spec-pending) — this spec was written in the forgent-workshop project and
  moved into this repo verbatim; it has not been re-harvested against this
  repo's own doc conventions.
```

### Full target shown text

```text
## Open Gaps

- The status-change command currently must be run from the project's own
  root location — running it from elsewhere is not yet supported.
- The one-time seeding operation assumes every historical candidate reached
  its current status the "normal" way (see Edge Cases Settled) — if a real
  historical case ever turns out not to fit, that nuance would only be
  recoverable from the free-form Notes column, not the durable record.
- Distillery's other capabilities — finding new source material to review,
  comparing ideas across sources, ranking candidates by score — are not yet
  described in this spec; only the porting-status lifecycle is covered here.
  `coverage: partial` reflects this.
- `docs/specs/system-overview.md` already lists a `distillery` area entry
  pointing here (and a separate `distill-skill` entry still marked
  spec-pending) — this spec was written in the forgent-workshop project and
  moved into this repo verbatim; it has not been re-harvested against this
  repo's own doc conventions.
```

## claim_4e61f8ab46c7791e563a905c6dcc2ba4

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/distillery.md#unheaded-block-10; lines 114–128; ancestry ["Distillery — Porting Lifecycle","Open Gaps"].
Target: docs/platform/distillery/spec.md#unheaded-block-12; ancestry ["Distillery — Porting Lifecycle","Open Gaps"].
Source digest: 78a40b7774cf741b2728ba02969e60ad06b066734352b3445238c6cfb4c11b00
Target digest: 78a40b7774cf741b2728ba02969e60ad06b066734352b3445238c6cfb4c11b00
Shown source SHA256: 78a40b7774cf741b2728ba02969e60ad06b066734352b3445238c6cfb4c11b00
Shown target SHA256: 78a40b7774cf741b2728ba02969e60ad06b066734352b3445238c6cfb4c11b00

### Complete proposed decision

```json
{
  "claimId": "claim_4e61f8ab46c7791e563a905c6dcc2ba4",
  "sourceUnitDigest": "78a40b7774cf741b2728ba02969e60ad06b066734352b3445238c6cfb4c11b00",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "unheaded-block-12",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/distillery.md#unheaded-block-10 (source lines 114-128) is carried at docs/platform/distillery/spec.md#unheaded-block-12 (candidate lines 136-150). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "78a40b7774cf741b2728ba02969e60ad06b066734352b3445238c6cfb4c11b00",
  "targetAncestry": [
    "Distillery — Porting Lifecycle",
    "Open Gaps"
  ]
}
```

### Full source shown text

```text
- The status-change command currently must be run from the project's own
  root location — running it from elsewhere is not yet supported.
- The one-time seeding operation assumes every historical candidate reached
  its current status the "normal" way (see Edge Cases Settled) — if a real
  historical case ever turns out not to fit, that nuance would only be
  recoverable from the free-form Notes column, not the durable record.
- Distillery's other capabilities — finding new source material to review,
  comparing ideas across sources, ranking candidates by score — are not yet
  described in this spec; only the porting-status lifecycle is covered here.
  `coverage: partial` reflects this.
- `docs/specs/system-overview.md` already lists a `distillery` area entry
  pointing here (and a separate `distill-skill` entry still marked
  spec-pending) — this spec was written in the forgent-workshop project and
  moved into this repo verbatim; it has not been re-harvested against this
  repo's own doc conventions.
```

### Full target shown text

```text
- The status-change command currently must be run from the project's own
  root location — running it from elsewhere is not yet supported.
- The one-time seeding operation assumes every historical candidate reached
  its current status the "normal" way (see Edge Cases Settled) — if a real
  historical case ever turns out not to fit, that nuance would only be
  recoverable from the free-form Notes column, not the durable record.
- Distillery's other capabilities — finding new source material to review,
  comparing ideas across sources, ranking candidates by score — are not yet
  described in this spec; only the porting-status lifecycle is covered here.
  `coverage: partial` reflects this.
- `docs/specs/system-overview.md` already lists a `distillery` area entry
  pointing here (and a separate `distill-skill` entry still marked
  spec-pending) — this spec was written in the forgent-workshop project and
  moved into this repo verbatim; it has not been re-harvested against this
  repo's own doc conventions.
```

## claim_a81c4bc7792d5b2b576357b9543176fa

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/distillery.md#pointers-implementation; lines 130–130; ancestry ["Distillery — Porting Lifecycle"].
Target: docs/platform/distillery/spec.md#pointers-implementation; ancestry ["Distillery — Porting Lifecycle"].
Source digest: 321c80e2289d089428120f6fb75f0ae62f81dd71cfe860c2f74b848981effb37
Target digest: 321c80e2289d089428120f6fb75f0ae62f81dd71cfe860c2f74b848981effb37
Shown source SHA256: d79687b086de62947dee3aeedb0c3d0fed6767acf2565d37aad36d1288be83c3
Shown target SHA256: d79687b086de62947dee3aeedb0c3d0fed6767acf2565d37aad36d1288be83c3

### Complete proposed decision

```json
{
  "claimId": "claim_a81c4bc7792d5b2b576357b9543176fa",
  "sourceUnitDigest": "321c80e2289d089428120f6fb75f0ae62f81dd71cfe860c2f74b848981effb37",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "pointers-implementation",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/distillery.md#pointers-implementation (source lines 130-130) is carried at docs/platform/distillery/spec.md#pointers-implementation (candidate lines 152-152). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "321c80e2289d089428120f6fb75f0ae62f81dd71cfe860c2f74b848981effb37",
  "targetAncestry": [
    "Distillery — Porting Lifecycle"
  ]
}
```

### Full source shown text

```text
## Pointers (implementation)

- CLI command: `.agents/skills/distill/scripts/distill.mjs` (`move` verb)
- State/lifecycle rules: `src/state/porting.mjs`
- Durable record + human-readable-log sync: `src/state/porting-store.mjs`
- Human-readable log: `docs/distillery/porting-log.md`
- Durable record storage: `docs/distillery/state/porting/`
- One-time seeding script: `.agents/skills/distill/scripts/migrate-porting-state-backfill.mjs`
- Package boundary: this repo's `package.json` (`exports`) exposes `forgent/state/porting` and `forgent/state/porting-store` — the distill skill imports its own package by name (Node self-reference); external consumers (e.g. the forgent-workshop project) install this repo as the `forgent` dependency and import the same subpaths.
```

### Full target shown text

```text
## Pointers (implementation)

- CLI command: `.agents/skills/distill/scripts/distill.mjs` (`move` verb)
- State/lifecycle rules: `src/state/porting.mjs`
- Durable record + human-readable-log sync: `src/state/porting-store.mjs`
- Human-readable log: `docs/distillery/porting-log.md`
- Durable record storage: `docs/distillery/state/porting/`
- One-time seeding script: `.agents/skills/distill/scripts/migrate-porting-state-backfill.mjs`
- Package boundary: this repo's `package.json` (`exports`) exposes `forgent/state/porting` and `forgent/state/porting-store` — the distill skill imports its own package by name (Node self-reference); external consumers (e.g. the forgent-workshop project) install this repo as the `forgent` dependency and import the same subpaths.
```

## claim_f94cf2b9ad1454f4fb3811c1cce319e6

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/distillery.md#unheaded-block-11; lines 132–138; ancestry ["Distillery — Porting Lifecycle","Pointers (implementation)"].
Target: docs/platform/distillery/spec.md#unheaded-block-13; ancestry ["Distillery — Porting Lifecycle","Pointers (implementation)"].
Source digest: 9423d35eb1a6338d9bcdac92d5492002e9328db395a488a88bd848e20be94289
Target digest: 9423d35eb1a6338d9bcdac92d5492002e9328db395a488a88bd848e20be94289
Shown source SHA256: 9423d35eb1a6338d9bcdac92d5492002e9328db395a488a88bd848e20be94289
Shown target SHA256: 9423d35eb1a6338d9bcdac92d5492002e9328db395a488a88bd848e20be94289

### Complete proposed decision

```json
{
  "claimId": "claim_f94cf2b9ad1454f4fb3811c1cce319e6",
  "sourceUnitDigest": "9423d35eb1a6338d9bcdac92d5492002e9328db395a488a88bd848e20be94289",
  "targetOwner": "docs/platform/distillery/spec.md",
  "targetAnchor": "unheaded-block-13",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/distillery.md#unheaded-block-11 (source lines 132-138) is carried at docs/platform/distillery/spec.md#unheaded-block-13 (candidate lines 154-160). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/distillery.md verbatim in docs/platform/distillery/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "9423d35eb1a6338d9bcdac92d5492002e9328db395a488a88bd848e20be94289",
  "targetAncestry": [
    "Distillery — Porting Lifecycle",
    "Pointers (implementation)"
  ]
}
```

### Full source shown text

```text
- CLI command: `.agents/skills/distill/scripts/distill.mjs` (`move` verb)
- State/lifecycle rules: `src/state/porting.mjs`
- Durable record + human-readable-log sync: `src/state/porting-store.mjs`
- Human-readable log: `docs/distillery/porting-log.md`
- Durable record storage: `docs/distillery/state/porting/`
- One-time seeding script: `.agents/skills/distill/scripts/migrate-porting-state-backfill.mjs`
- Package boundary: this repo's `package.json` (`exports`) exposes `forgent/state/porting` and `forgent/state/porting-store` — the distill skill imports its own package by name (Node self-reference); external consumers (e.g. the forgent-workshop project) install this repo as the `forgent` dependency and import the same subpaths.
```

### Full target shown text

```text
- CLI command: `.agents/skills/distill/scripts/distill.mjs` (`move` verb)
- State/lifecycle rules: `src/state/porting.mjs`
- Durable record + human-readable-log sync: `src/state/porting-store.mjs`
- Human-readable log: `docs/distillery/porting-log.md`
- Durable record storage: `docs/distillery/state/porting/`
- One-time seeding script: `.agents/skills/distill/scripts/migrate-porting-state-backfill.mjs`
- Package boundary: this repo's `package.json` (`exports`) exposes `forgent/state/porting` and `forgent/state/porting-store` — the distill skill imports its own package by name (Node self-reference); external consumers (e.g. the forgent-workshop project) install this repo as the `forgent` dependency and import the same subpaths.
```
