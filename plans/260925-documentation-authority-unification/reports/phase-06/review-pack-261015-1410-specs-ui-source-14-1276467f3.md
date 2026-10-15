# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/00-overview.md
Part 1/1; entries: **16**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 5/5 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_4fa792519d532d3ad333e0c2566bc935",
      "claim_a6ab93a6bd86cc14f83e5022a2323387",
      "claim_88fd76453441113b17cd784177a9081c",
      "claim_91330f2248982f1d6df5071f335b1064",
      "claim_af10734d11a45127f86e662a27b20bff",
      "claim_902e852cbdd48042261059044bba9304",
      "claim_23152a13579b15a727ac20354b0c0889",
      "claim_f5414fdf7b56dcc5ecfee0dbbe5b9cd2",
      "claim_dd3ad839ba07d233d4389822d192e7a1",
      "claim_7adfa144991fe6de9a316f7ea81553d0",
      "claim_271679d81259c0ae4190964de3d736f2"
    ],
    "Weak-exact": [
      "claim_93f7e5f60f6407a6ff0969b5e85302fd",
      "claim_1745b0635297cf66ced230f28ef40703",
      "claim_a3fe6a352c2538925b3831551da1762d",
      "claim_2361b06eda9a97678fdb502cb5949d3e"
    ],
    "Judgment": [
      "claim_4e48bd602a0ab47752c147905e76c3e2"
    ]
  },
  "unequalDigestPairs": [
    "claim_4e48bd602a0ab47752c147905e76c3e2"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_4e48bd602a0ab47752c147905e76c3e2"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_4fa792519d532d3ad333e0c2566bc935

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/00-overview.md#unheaded-block-1; lines 1–7; ancestry [].
Target: docs/platform/ui-spec/spec.md#unheaded-block-1; ancestry [].
Source digest: b61e74726631cc9e12744d93383ce64b2afff77ec3d0a58e3fac7631be969ecd
Target digest: b61e74726631cc9e12744d93383ce64b2afff77ec3d0a58e3fac7631be969ecd
Shown source SHA256: b61e74726631cc9e12744d93383ce64b2afff77ec3d0a58e3fac7631be969ecd
Shown target SHA256: b61e74726631cc9e12744d93383ce64b2afff77ec3d0a58e3fac7631be969ecd

### Complete proposed decision

```json
{
  "claimId": "claim_4fa792519d532d3ad333e0c2566bc935",
  "sourceUnitDigest": "b61e74726631cc9e12744d93383ce64b2afff77ec3d0a58e3fac7631be969ecd",
  "targetOwner": "docs/platform/ui-spec/spec.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/ui-spec/00-overview.md#unheaded-block-1 (source lines 1-7) is carried at docs/platform/ui-spec/spec.md#unheaded-block-1 (candidate lines 1-7). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/00-overview.md verbatim in docs/platform/ui-spec/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b61e74726631cc9e12744d93383ce64b2afff77ec3d0a58e3fac7631be969ecd",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
id: overview
type: meta
name: "herdr web dashboard UI Spec — Overview"
status: active
version: "0.1.0"
---
```

### Full target shown text

```text
---
id: overview
type: meta
name: "herdr web dashboard UI Spec — Overview"
status: active
version: "0.1.0"
---
```

## claim_4e48bd602a0ab47752c147905e76c3e2

Class: Judgment; mandatory deep: true.
Source: docs/ui-spec/00-overview.md#herdr-web-dashboard-ui-spec-overview; lines 9–9; ancestry [].
Target: docs/platform/ui-spec/spec.md#herdr-web-dashboard-ui-spec-overview; ancestry [].
Source digest: 87f229e8d1ca3a6c606726b5462eb73225eb295df6c23ad54eacb323825e0a63
Target digest: d099070fdd330d25219555158140d87b108242e10e119bba5ce4d82ac40d2aa7
Shown source SHA256: 1bff368e9a66b86e46f30c6835aaf9cbe8320d7d6ac7117416c53830f3d1dbc6
Shown target SHA256: b95c7386ff2e62def22ed1952e160fcfc061b9c73071e371414778036fb5edf8

### Complete proposed decision

```json
{
  "claimId": "claim_4e48bd602a0ab47752c147905e76c3e2",
  "sourceUnitDigest": "87f229e8d1ca3a6c606726b5462eb73225eb295df6c23ad54eacb323825e0a63",
  "targetOwner": "docs/platform/ui-spec/spec.md",
  "targetAnchor": "herdr-web-dashboard-ui-spec-overview",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/ui-spec/00-overview.md#herdr-web-dashboard-ui-spec-overview (source lines 9-9) is carried at docs/platform/ui-spec/spec.md#herdr-web-dashboard-ui-spec-overview (candidate lines 9-9). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/ui-spec/00-overview.md verbatim in docs/platform/ui-spec/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "d099070fdd330d25219555158140d87b108242e10e119bba5ce4d82ac40d2aa7",
  "targetAncestry": []
}
```

### Full source shown text

```text
# herdr web dashboard — UI spec overview

Interaction and layout layer for the herdr web dashboard.

**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area
spec, `tsk-54j`). Every surface, rule and behaviour here traces back to a
section of that document. This layer never settles a product question —
where the area spec has an Open Gap, so does this spec.

**Human-readable companion:** `docs/reference/herdr-web-dashboard-layout.md`
— the read-in-one-pass layout document that `tsk-5jr` (taskboard) and
`tsk-4id` (task detail) open while building.
```

### Full target shown text

````text
# herdr web dashboard — UI spec overview

```txt
Document type: Specification
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/00-overview.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/ui-spec/00-overview.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.


Interaction and layout layer for the herdr web dashboard.

**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area
spec, `tsk-54j`). Every surface, rule and behaviour here traces back to a
section of that document. This layer never settles a product question —
where the area spec has an Open Gap, so does this spec.

**Human-readable companion:** `docs/reference/herdr-web-dashboard-layout.md`
— the read-in-one-pass layout document that `tsk-5jr` (taskboard) and
`tsk-4id` (task detail) open while building.
````

## claim_a6ab93a6bd86cc14f83e5022a2323387

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/00-overview.md#unheaded-block-2; lines 11–11; ancestry ["herdr web dashboard — UI spec overview"].
Target: docs/platform/ui-spec/spec.md#unheaded-block-4; ancestry ["herdr web dashboard — UI spec overview"].
Source digest: 1e1a662c6e15fe8e83c97b729c44872d5cc75aa94cf4f8e1b1789d7e3ba2775d
Target digest: 1e1a662c6e15fe8e83c97b729c44872d5cc75aa94cf4f8e1b1789d7e3ba2775d
Shown source SHA256: 1e1a662c6e15fe8e83c97b729c44872d5cc75aa94cf4f8e1b1789d7e3ba2775d
Shown target SHA256: 1e1a662c6e15fe8e83c97b729c44872d5cc75aa94cf4f8e1b1789d7e3ba2775d

### Complete proposed decision

```json
{
  "claimId": "claim_a6ab93a6bd86cc14f83e5022a2323387",
  "sourceUnitDigest": "1e1a662c6e15fe8e83c97b729c44872d5cc75aa94cf4f8e1b1789d7e3ba2775d",
  "targetOwner": "docs/platform/ui-spec/spec.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/00-overview.md#unheaded-block-2 (source lines 11-11) is carried at docs/platform/ui-spec/spec.md#unheaded-block-4 (candidate lines 33-33). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/00-overview.md verbatim in docs/platform/ui-spec/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "1e1a662c6e15fe8e83c97b729c44872d5cc75aa94cf4f8e1b1789d7e3ba2775d",
  "targetAncestry": [
    "herdr web dashboard — UI spec overview"
  ]
}
```

### Full source shown text

```text
Interaction and layout layer for the herdr web dashboard.
```

### Full target shown text

```text
Interaction and layout layer for the herdr web dashboard.
```

## claim_88fd76453441113b17cd784177a9081c

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/00-overview.md#unheaded-block-3; lines 13–16; ancestry ["herdr web dashboard — UI spec overview"].
Target: docs/platform/ui-spec/spec.md#unheaded-block-5; ancestry ["herdr web dashboard — UI spec overview"].
Source digest: 5d2b18d22620d6ad6bb42432f5f38fa6660f15e7e6c604225f67d96faa40ac55
Target digest: 5d2b18d22620d6ad6bb42432f5f38fa6660f15e7e6c604225f67d96faa40ac55
Shown source SHA256: 5d2b18d22620d6ad6bb42432f5f38fa6660f15e7e6c604225f67d96faa40ac55
Shown target SHA256: 5d2b18d22620d6ad6bb42432f5f38fa6660f15e7e6c604225f67d96faa40ac55

### Complete proposed decision

```json
{
  "claimId": "claim_88fd76453441113b17cd784177a9081c",
  "sourceUnitDigest": "5d2b18d22620d6ad6bb42432f5f38fa6660f15e7e6c604225f67d96faa40ac55",
  "targetOwner": "docs/platform/ui-spec/spec.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/00-overview.md#unheaded-block-3 (source lines 13-16) is carried at docs/platform/ui-spec/spec.md#unheaded-block-5 (candidate lines 35-38). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/00-overview.md verbatim in docs/platform/ui-spec/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "5d2b18d22620d6ad6bb42432f5f38fa6660f15e7e6c604225f67d96faa40ac55",
  "targetAncestry": [
    "herdr web dashboard — UI spec overview"
  ]
}
```

### Full source shown text

```text
**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area
spec, `tsk-54j`). Every surface, rule and behaviour here traces back to a
section of that document. This layer never settles a product question —
where the area spec has an Open Gap, so does this spec.
```

### Full target shown text

```text
**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area
spec, `tsk-54j`). Every surface, rule and behaviour here traces back to a
section of that document. This layer never settles a product question —
where the area spec has an Open Gap, so does this spec.
```

## claim_91330f2248982f1d6df5071f335b1064

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/00-overview.md#unheaded-block-4; lines 18–20; ancestry ["herdr web dashboard — UI spec overview"].
Target: docs/platform/ui-spec/spec.md#unheaded-block-6; ancestry ["herdr web dashboard — UI spec overview"].
Source digest: ea8915b9b44ba81d2f47d5949641f3daf7f112d295f68b4e35e1d0e59576ee26
Target digest: ea8915b9b44ba81d2f47d5949641f3daf7f112d295f68b4e35e1d0e59576ee26
Shown source SHA256: ea8915b9b44ba81d2f47d5949641f3daf7f112d295f68b4e35e1d0e59576ee26
Shown target SHA256: ea8915b9b44ba81d2f47d5949641f3daf7f112d295f68b4e35e1d0e59576ee26

### Complete proposed decision

```json
{
  "claimId": "claim_91330f2248982f1d6df5071f335b1064",
  "sourceUnitDigest": "ea8915b9b44ba81d2f47d5949641f3daf7f112d295f68b4e35e1d0e59576ee26",
  "targetOwner": "docs/platform/ui-spec/spec.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/00-overview.md#unheaded-block-4 (source lines 18-20) is carried at docs/platform/ui-spec/spec.md#unheaded-block-6 (candidate lines 40-42). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/00-overview.md verbatim in docs/platform/ui-spec/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ea8915b9b44ba81d2f47d5949641f3daf7f112d295f68b4e35e1d0e59576ee26",
  "targetAncestry": [
    "herdr web dashboard — UI spec overview"
  ]
}
```

### Full source shown text

```text
**Human-readable companion:** `docs/reference/herdr-web-dashboard-layout.md`
— the read-in-one-pass layout document that `tsk-5jr` (taskboard) and
`tsk-4id` (task detail) open while building.
```

### Full target shown text

```text
**Human-readable companion:** `docs/reference/herdr-web-dashboard-layout.md`
— the read-in-one-pass layout document that `tsk-5jr` (taskboard) and
`tsk-4id` (task detail) open while building.
```

## claim_93f7e5f60f6407a6ff0969b5e85302fd

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/00-overview.md#surface-index; lines 22–22; ancestry ["herdr web dashboard — UI spec overview"].
Target: docs/platform/ui-spec/spec.md#surface-index; ancestry ["herdr web dashboard — UI spec overview"].
Source digest: c54dfe553e1f9d27c69b590fea4d02964f262edc90e49d59771e2fc45e7b7b2d
Target digest: c54dfe553e1f9d27c69b590fea4d02964f262edc90e49d59771e2fc45e7b7b2d
Shown source SHA256: 82189172c1d209ce9847772dfbe5b3b7d6da33d9e8f967f1cda8023be0123112
Shown target SHA256: 82189172c1d209ce9847772dfbe5b3b7d6da33d9e8f967f1cda8023be0123112

### Complete proposed decision

```json
{
  "claimId": "claim_93f7e5f60f6407a6ff0969b5e85302fd",
  "sourceUnitDigest": "c54dfe553e1f9d27c69b590fea4d02964f262edc90e49d59771e2fc45e7b7b2d",
  "targetOwner": "docs/platform/ui-spec/spec.md",
  "targetAnchor": "surface-index",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/00-overview.md#surface-index (source lines 22-22) is carried at docs/platform/ui-spec/spec.md#surface-index (candidate lines 44-44). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/00-overview.md verbatim in docs/platform/ui-spec/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c54dfe553e1f9d27c69b590fea4d02964f262edc90e49d59771e2fc45e7b7b2d",
  "targetAncestry": [
    "herdr web dashboard — UI spec overview"
  ]
}
```

### Full source shown text

```text
## Surface index

| ID | Name | Type | Source in the area spec |
|---|---|---|---|
| S01 | Sign in | screen | §Sign in |
| S02 | Taskboard | screen | §View the taskboard |
| S03 | Task detail | screen | §View a task's detail |
| S04 | Questions needing answer | screen | §Entry Points, Data Dictionary #4 |
| M01 | Answer a parked question | modal | §Answer a parked question |
| M02 | Approve a merge | modal | §Approve a merge |
| M03 | Add or edit a work item | modal | §Add a work item, §Edit a work item |
| C01 | Item card with status pill and quick actions | component | §View the taskboard |
| F01 | Answer a parked question, end to end | flow | commissioning item's required userflow |
| F02 | Approve a merge, end to end | flow | commissioning item's required userflow |

All eight `###` behaviour subsections of the area spec are covered.
"Retire a work item" has no surface of its own by design — it is a quick
action on C01 plus a confirmation, matching the area spec's own framing of
retirement rather than deletion.
```

### Full target shown text

```text
## Surface index

| ID | Name | Type | Source in the area spec |
|---|---|---|---|
| S01 | Sign in | screen | §Sign in |
| S02 | Taskboard | screen | §View the taskboard |
| S03 | Task detail | screen | §View a task's detail |
| S04 | Questions needing answer | screen | §Entry Points, Data Dictionary #4 |
| M01 | Answer a parked question | modal | §Answer a parked question |
| M02 | Approve a merge | modal | §Approve a merge |
| M03 | Add or edit a work item | modal | §Add a work item, §Edit a work item |
| C01 | Item card with status pill and quick actions | component | §View the taskboard |
| F01 | Answer a parked question, end to end | flow | commissioning item's required userflow |
| F02 | Approve a merge, end to end | flow | commissioning item's required userflow |

All eight `###` behaviour subsections of the area spec are covered.
"Retire a work item" has no surface of its own by design — it is a quick
action on C01 plus a confirmation, matching the area spec's own framing of
retirement rather than deletion.
```

## claim_af10734d11a45127f86e662a27b20bff

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/00-overview.md#unheaded-block-5; lines 24–35; ancestry ["herdr web dashboard — UI spec overview","Surface index"].
Target: docs/platform/ui-spec/spec.md#unheaded-block-7; ancestry ["herdr web dashboard — UI spec overview","Surface index"].
Source digest: 3a16ef11f4728b4ec8127ff4000b0c62f5f7c886f54be0e13e2a866539db5c69
Target digest: 3a16ef11f4728b4ec8127ff4000b0c62f5f7c886f54be0e13e2a866539db5c69
Shown source SHA256: 3a16ef11f4728b4ec8127ff4000b0c62f5f7c886f54be0e13e2a866539db5c69
Shown target SHA256: 3a16ef11f4728b4ec8127ff4000b0c62f5f7c886f54be0e13e2a866539db5c69

### Complete proposed decision

```json
{
  "claimId": "claim_af10734d11a45127f86e662a27b20bff",
  "sourceUnitDigest": "3a16ef11f4728b4ec8127ff4000b0c62f5f7c886f54be0e13e2a866539db5c69",
  "targetOwner": "docs/platform/ui-spec/spec.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/00-overview.md#unheaded-block-5 (source lines 24-35) is carried at docs/platform/ui-spec/spec.md#unheaded-block-7 (candidate lines 46-57). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/00-overview.md verbatim in docs/platform/ui-spec/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3a16ef11f4728b4ec8127ff4000b0c62f5f7c886f54be0e13e2a866539db5c69",
  "targetAncestry": [
    "herdr web dashboard — UI spec overview",
    "Surface index"
  ]
}
```

### Full source shown text

```text
| ID | Name | Type | Source in the area spec |
|---|---|---|---|
| S01 | Sign in | screen | §Sign in |
| S02 | Taskboard | screen | §View the taskboard |
| S03 | Task detail | screen | §View a task's detail |
| S04 | Questions needing answer | screen | §Entry Points, Data Dictionary #4 |
| M01 | Answer a parked question | modal | §Answer a parked question |
| M02 | Approve a merge | modal | §Approve a merge |
| M03 | Add or edit a work item | modal | §Add a work item, §Edit a work item |
| C01 | Item card with status pill and quick actions | component | §View the taskboard |
| F01 | Answer a parked question, end to end | flow | commissioning item's required userflow |
| F02 | Approve a merge, end to end | flow | commissioning item's required userflow |
```

### Full target shown text

```text
| ID | Name | Type | Source in the area spec |
|---|---|---|---|
| S01 | Sign in | screen | §Sign in |
| S02 | Taskboard | screen | §View the taskboard |
| S03 | Task detail | screen | §View a task's detail |
| S04 | Questions needing answer | screen | §Entry Points, Data Dictionary #4 |
| M01 | Answer a parked question | modal | §Answer a parked question |
| M02 | Approve a merge | modal | §Approve a merge |
| M03 | Add or edit a work item | modal | §Add a work item, §Edit a work item |
| C01 | Item card with status pill and quick actions | component | §View the taskboard |
| F01 | Answer a parked question, end to end | flow | commissioning item's required userflow |
| F02 | Approve a merge, end to end | flow | commissioning item's required userflow |
```

## claim_902e852cbdd48042261059044bba9304

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/00-overview.md#unheaded-block-6; lines 37–40; ancestry ["herdr web dashboard — UI spec overview","Surface index"].
Target: docs/platform/ui-spec/spec.md#unheaded-block-8; ancestry ["herdr web dashboard — UI spec overview","Surface index"].
Source digest: 3624843473276cc436449e523d8d392d2c97b9e91ba36ceb685f8b1fd295aea8
Target digest: 3624843473276cc436449e523d8d392d2c97b9e91ba36ceb685f8b1fd295aea8
Shown source SHA256: 3624843473276cc436449e523d8d392d2c97b9e91ba36ceb685f8b1fd295aea8
Shown target SHA256: 3624843473276cc436449e523d8d392d2c97b9e91ba36ceb685f8b1fd295aea8

### Complete proposed decision

```json
{
  "claimId": "claim_902e852cbdd48042261059044bba9304",
  "sourceUnitDigest": "3624843473276cc436449e523d8d392d2c97b9e91ba36ceb685f8b1fd295aea8",
  "targetOwner": "docs/platform/ui-spec/spec.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/00-overview.md#unheaded-block-6 (source lines 37-40) is carried at docs/platform/ui-spec/spec.md#unheaded-block-8 (candidate lines 59-62). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/00-overview.md verbatim in docs/platform/ui-spec/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3624843473276cc436449e523d8d392d2c97b9e91ba36ceb685f8b1fd295aea8",
  "targetAncestry": [
    "herdr web dashboard — UI spec overview",
    "Surface index"
  ]
}
```

### Full source shown text

```text
All eight `###` behaviour subsections of the area spec are covered.
"Retire a work item" has no surface of its own by design — it is a quick
action on C01 plus a confirmation, matching the area spec's own framing of
retirement rather than deletion.
```

### Full target shown text

```text
All eight `###` behaviour subsections of the area spec are covered.
"Retire a work item" has no surface of its own by design — it is a quick
action on C01 plus a confirmation, matching the area spec's own framing of
retirement rather than deletion.
```

## claim_1745b0635297cf66ced230f28ef40703

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/00-overview.md#directory-tree; lines 42–42; ancestry ["herdr web dashboard — UI spec overview"].
Target: docs/platform/ui-spec/spec.md#directory-tree; ancestry ["herdr web dashboard — UI spec overview"].
Source digest: 2f2c656184619923093adc71d350ee383d96041799fff6813a967db841c5d032
Target digest: 2f2c656184619923093adc71d350ee383d96041799fff6813a967db841c5d032
Shown source SHA256: 9d21bdd8b1691059a6d7a62109c887b37ee345579a8aa5434a1eb1e6cc1a0d82
Shown target SHA256: 9d21bdd8b1691059a6d7a62109c887b37ee345579a8aa5434a1eb1e6cc1a0d82

### Complete proposed decision

```json
{
  "claimId": "claim_1745b0635297cf66ced230f28ef40703",
  "sourceUnitDigest": "2f2c656184619923093adc71d350ee383d96041799fff6813a967db841c5d032",
  "targetOwner": "docs/platform/ui-spec/spec.md",
  "targetAnchor": "directory-tree",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/00-overview.md#directory-tree (source lines 42-42) is carried at docs/platform/ui-spec/spec.md#directory-tree (candidate lines 64-64). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/00-overview.md verbatim in docs/platform/ui-spec/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "2f2c656184619923093adc71d350ee383d96041799fff6813a967db841c5d032",
  "targetAncestry": [
    "herdr web dashboard — UI spec overview"
  ]
}
```

### Full source shown text

````text
## Directory tree

```
docs/ui-spec/
├── spec.config.yaml
├── 00-overview.md                  ← this file
├── 15-system-events.md
├── 20-domain-rules.md              ← R1–R11, taken from the area spec
├── 30-states-and-errors.md
├── schema/
│   └── surface-contract.schema.json
├── screens/
│   ├── S01-sign-in.md
│   ├── S02-taskboard.md
│   ├── S03-task-detail.md
│   └── S04-questions-needing-answer.md
├── modals/
│   ├── M01-answer-question.md
│   ├── M02-approve-merge.md
│   └── M03-add-edit-item.md
├── components/
│   └── C01-item-card.md
└── flows/
    ├── F01-answer-a-parked-question.md
    └── F02-approve-a-merge.md
```
````

### Full target shown text

````text
## Directory tree

```
docs/ui-spec/
├── spec.config.yaml
├── 00-overview.md                  ← this file
├── 15-system-events.md
├── 20-domain-rules.md              ← R1–R11, taken from the area spec
├── 30-states-and-errors.md
├── schema/
│   └── surface-contract.schema.json
├── screens/
│   ├── S01-sign-in.md
│   ├── S02-taskboard.md
│   ├── S03-task-detail.md
│   └── S04-questions-needing-answer.md
├── modals/
│   ├── M01-answer-question.md
│   ├── M02-approve-merge.md
│   └── M03-add-edit-item.md
├── components/
│   └── C01-item-card.md
└── flows/
    ├── F01-answer-a-parked-question.md
    └── F02-approve-a-merge.md
```
````

## claim_23152a13579b15a727ac20354b0c0889

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/00-overview.md#unheaded-block-7; lines 44–67; ancestry ["herdr web dashboard — UI spec overview","Directory tree"].
Target: docs/platform/ui-spec/spec.md#unheaded-block-9; ancestry ["herdr web dashboard — UI spec overview","Directory tree"].
Source digest: 6ebc8583aa59e28c3ce8bea6ad719ca3947b2625c56d1666dcc2cdb90f642277
Target digest: 6ebc8583aa59e28c3ce8bea6ad719ca3947b2625c56d1666dcc2cdb90f642277
Shown source SHA256: 6ebc8583aa59e28c3ce8bea6ad719ca3947b2625c56d1666dcc2cdb90f642277
Shown target SHA256: 6ebc8583aa59e28c3ce8bea6ad719ca3947b2625c56d1666dcc2cdb90f642277

### Complete proposed decision

```json
{
  "claimId": "claim_23152a13579b15a727ac20354b0c0889",
  "sourceUnitDigest": "6ebc8583aa59e28c3ce8bea6ad719ca3947b2625c56d1666dcc2cdb90f642277",
  "targetOwner": "docs/platform/ui-spec/spec.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/00-overview.md#unheaded-block-7 (source lines 44-67) is carried at docs/platform/ui-spec/spec.md#unheaded-block-9 (candidate lines 66-89). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/00-overview.md verbatim in docs/platform/ui-spec/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6ebc8583aa59e28c3ce8bea6ad719ca3947b2625c56d1666dcc2cdb90f642277",
  "targetAncestry": [
    "herdr web dashboard — UI spec overview",
    "Directory tree"
  ]
}
```

### Full source shown text

````text
```
docs/ui-spec/
├── spec.config.yaml
├── 00-overview.md                  ← this file
├── 15-system-events.md
├── 20-domain-rules.md              ← R1–R11, taken from the area spec
├── 30-states-and-errors.md
├── schema/
│   └── surface-contract.schema.json
├── screens/
│   ├── S01-sign-in.md
│   ├── S02-taskboard.md
│   ├── S03-task-detail.md
│   └── S04-questions-needing-answer.md
├── modals/
│   ├── M01-answer-question.md
│   ├── M02-approve-merge.md
│   └── M03-add-edit-item.md
├── components/
│   └── C01-item-card.md
└── flows/
    ├── F01-answer-a-parked-question.md
    └── F02-approve-a-merge.md
```
````

### Full target shown text

````text
```
docs/ui-spec/
├── spec.config.yaml
├── 00-overview.md                  ← this file
├── 15-system-events.md
├── 20-domain-rules.md              ← R1–R11, taken from the area spec
├── 30-states-and-errors.md
├── schema/
│   └── surface-contract.schema.json
├── screens/
│   ├── S01-sign-in.md
│   ├── S02-taskboard.md
│   ├── S03-task-detail.md
│   └── S04-questions-needing-answer.md
├── modals/
│   ├── M01-answer-question.md
│   ├── M02-approve-merge.md
│   └── M03-add-edit-item.md
├── components/
│   └── C01-item-card.md
└── flows/
    ├── F01-answer-a-parked-question.md
    └── F02-approve-a-merge.md
```
````

## claim_a3fe6a352c2538925b3831551da1762d

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/00-overview.md#how-to-work-on-this-spec; lines 69–69; ancestry ["herdr web dashboard — UI spec overview"].
Target: docs/platform/ui-spec/spec.md#how-to-work-on-this-spec; ancestry ["herdr web dashboard — UI spec overview"].
Source digest: fb45e3220fd282bd5bfebfed7ffe2b753249fbe60f5bb2a66fc05f0764f44664
Target digest: fb45e3220fd282bd5bfebfed7ffe2b753249fbe60f5bb2a66fc05f0764f44664
Shown source SHA256: da11734f6e187445d59a7898b11564272ff7a387d2b8bb0afc4ecc2eb2443d25
Shown target SHA256: da11734f6e187445d59a7898b11564272ff7a387d2b8bb0afc4ecc2eb2443d25

### Complete proposed decision

```json
{
  "claimId": "claim_a3fe6a352c2538925b3831551da1762d",
  "sourceUnitDigest": "fb45e3220fd282bd5bfebfed7ffe2b753249fbe60f5bb2a66fc05f0764f44664",
  "targetOwner": "docs/platform/ui-spec/spec.md",
  "targetAnchor": "how-to-work-on-this-spec",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/00-overview.md#how-to-work-on-this-spec (source lines 69-69) is carried at docs/platform/ui-spec/spec.md#how-to-work-on-this-spec (candidate lines 91-91). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/00-overview.md verbatim in docs/platform/ui-spec/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "fb45e3220fd282bd5bfebfed7ffe2b753249fbe60f5bb2a66fc05f0764f44664",
  "targetAncestry": [
    "herdr web dashboard — UI spec overview"
  ]
}
```

### Full source shown text

````text
## How to work on this spec

The compiler lives with the `ui-spec` skill, not in this tree. Run it
against this root:

```bash
cd ~/.claude/skills/ui-spec/tools
npm ci                                   # once, if node_modules is absent
node validate.mjs --root <repo>/docs/ui-spec
node build.mjs    --root <repo>/docs/ui-spec
node interpret-wireframe.mjs --root <repo>/docs/ui-spec
```

`validate` is the trust gate — dangling navigate targets, bad component
hosts, listen-orphans and rule drift are errors, not warnings.
`interpret-wireframe` produces the clickable wireframe;
`generated/` is build output and is gitignored.
````

### Full target shown text

````text
## How to work on this spec

The compiler lives with the `ui-spec` skill, not in this tree. Run it
against this root:

```bash
cd ~/.claude/skills/ui-spec/tools
npm ci                                   # once, if node_modules is absent
node validate.mjs --root <repo>/docs/ui-spec
node build.mjs    --root <repo>/docs/ui-spec
node interpret-wireframe.mjs --root <repo>/docs/ui-spec
```

`validate` is the trust gate — dangling navigate targets, bad component
hosts, listen-orphans and rule drift are errors, not warnings.
`interpret-wireframe` produces the clickable wireframe;
`generated/` is build output and is gitignored.
````

## claim_f5414fdf7b56dcc5ecfee0dbbe5b9cd2

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/00-overview.md#unheaded-block-8; lines 71–72; ancestry ["herdr web dashboard — UI spec overview","How to work on this spec"].
Target: docs/platform/ui-spec/spec.md#unheaded-block-10; ancestry ["herdr web dashboard — UI spec overview","How to work on this spec"].
Source digest: 7e6438293b79664d86dbdd4dea092ac9cccbaa898bd646bdf0382525c97ac972
Target digest: 7e6438293b79664d86dbdd4dea092ac9cccbaa898bd646bdf0382525c97ac972
Shown source SHA256: 7e6438293b79664d86dbdd4dea092ac9cccbaa898bd646bdf0382525c97ac972
Shown target SHA256: 7e6438293b79664d86dbdd4dea092ac9cccbaa898bd646bdf0382525c97ac972

### Complete proposed decision

```json
{
  "claimId": "claim_f5414fdf7b56dcc5ecfee0dbbe5b9cd2",
  "sourceUnitDigest": "7e6438293b79664d86dbdd4dea092ac9cccbaa898bd646bdf0382525c97ac972",
  "targetOwner": "docs/platform/ui-spec/spec.md",
  "targetAnchor": "unheaded-block-10",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/00-overview.md#unheaded-block-8 (source lines 71-72) is carried at docs/platform/ui-spec/spec.md#unheaded-block-10 (candidate lines 93-94). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/00-overview.md verbatim in docs/platform/ui-spec/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7e6438293b79664d86dbdd4dea092ac9cccbaa898bd646bdf0382525c97ac972",
  "targetAncestry": [
    "herdr web dashboard — UI spec overview",
    "How to work on this spec"
  ]
}
```

### Full source shown text

```text
The compiler lives with the `ui-spec` skill, not in this tree. Run it
against this root:
```

### Full target shown text

```text
The compiler lives with the `ui-spec` skill, not in this tree. Run it
against this root:
```

## claim_dd3ad839ba07d233d4389822d192e7a1

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/00-overview.md#unheaded-block-9; lines 74–80; ancestry ["herdr web dashboard — UI spec overview","How to work on this spec"].
Target: docs/platform/ui-spec/spec.md#unheaded-block-11; ancestry ["herdr web dashboard — UI spec overview","How to work on this spec"].
Source digest: aae24ffa47c4b917567873038a8c3a499338d69d9b42de12ac65ec64aef4782d
Target digest: aae24ffa47c4b917567873038a8c3a499338d69d9b42de12ac65ec64aef4782d
Shown source SHA256: aae24ffa47c4b917567873038a8c3a499338d69d9b42de12ac65ec64aef4782d
Shown target SHA256: aae24ffa47c4b917567873038a8c3a499338d69d9b42de12ac65ec64aef4782d

### Complete proposed decision

```json
{
  "claimId": "claim_dd3ad839ba07d233d4389822d192e7a1",
  "sourceUnitDigest": "aae24ffa47c4b917567873038a8c3a499338d69d9b42de12ac65ec64aef4782d",
  "targetOwner": "docs/platform/ui-spec/spec.md",
  "targetAnchor": "unheaded-block-11",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/00-overview.md#unheaded-block-9 (source lines 74-80) is carried at docs/platform/ui-spec/spec.md#unheaded-block-11 (candidate lines 96-102). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/00-overview.md verbatim in docs/platform/ui-spec/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "aae24ffa47c4b917567873038a8c3a499338d69d9b42de12ac65ec64aef4782d",
  "targetAncestry": [
    "herdr web dashboard — UI spec overview",
    "How to work on this spec"
  ]
}
```

### Full source shown text

````text
```bash
cd ~/.claude/skills/ui-spec/tools
npm ci                                   # once, if node_modules is absent
node validate.mjs --root <repo>/docs/ui-spec
node build.mjs    --root <repo>/docs/ui-spec
node interpret-wireframe.mjs --root <repo>/docs/ui-spec
```
````

### Full target shown text

````text
```bash
cd ~/.claude/skills/ui-spec/tools
npm ci                                   # once, if node_modules is absent
node validate.mjs --root <repo>/docs/ui-spec
node build.mjs    --root <repo>/docs/ui-spec
node interpret-wireframe.mjs --root <repo>/docs/ui-spec
```
````

## claim_7adfa144991fe6de9a316f7ea81553d0

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/00-overview.md#unheaded-block-10; lines 82–85; ancestry ["herdr web dashboard — UI spec overview","How to work on this spec"].
Target: docs/platform/ui-spec/spec.md#unheaded-block-12; ancestry ["herdr web dashboard — UI spec overview","How to work on this spec"].
Source digest: 3324fde2c080f440e352d3276b5dddb25b0b74dc48201f293d0e905c6afced8e
Target digest: 3324fde2c080f440e352d3276b5dddb25b0b74dc48201f293d0e905c6afced8e
Shown source SHA256: 3324fde2c080f440e352d3276b5dddb25b0b74dc48201f293d0e905c6afced8e
Shown target SHA256: 3324fde2c080f440e352d3276b5dddb25b0b74dc48201f293d0e905c6afced8e

### Complete proposed decision

```json
{
  "claimId": "claim_7adfa144991fe6de9a316f7ea81553d0",
  "sourceUnitDigest": "3324fde2c080f440e352d3276b5dddb25b0b74dc48201f293d0e905c6afced8e",
  "targetOwner": "docs/platform/ui-spec/spec.md",
  "targetAnchor": "unheaded-block-12",
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/00-overview.md#unheaded-block-10 (source lines 82-85) is carried at docs/platform/ui-spec/spec.md#unheaded-block-12 (candidate lines 104-107). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/00-overview.md verbatim in docs/platform/ui-spec/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3324fde2c080f440e352d3276b5dddb25b0b74dc48201f293d0e905c6afced8e",
  "targetAncestry": [
    "herdr web dashboard — UI spec overview",
    "How to work on this spec"
  ]
}
```

### Full source shown text

```text
`validate` is the trust gate — dangling navigate targets, bad component
hosts, listen-orphans and rule drift are errors, not warnings.
`interpret-wireframe` produces the clickable wireframe;
`generated/` is build output and is gitignored.
```

### Full target shown text

```text
`validate` is the trust gate — dangling navigate targets, bad component
hosts, listen-orphans and rule drift are errors, not warnings.
`interpret-wireframe` produces the clickable wireframe;
`generated/` is build output and is gitignored.
```

## claim_2361b06eda9a97678fdb502cb5949d3e

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/00-overview.md#a-note-on-scale; lines 87–87; ancestry ["herdr web dashboard — UI spec overview"].
Target: docs/platform/ui-spec/spec.md#a-note-on-scale; ancestry ["herdr web dashboard — UI spec overview"].
Source digest: 4fe39a3a337800c3d7972d0517f0abb9601a73d047978fcb482a25c456da4cce
Target digest: 4fe39a3a337800c3d7972d0517f0abb9601a73d047978fcb482a25c456da4cce
Shown source SHA256: aac2bb40a7654339ee5222957ce65701e692be43bdaeaff9ec91b89911cd0958
Shown target SHA256: aac2bb40a7654339ee5222957ce65701e692be43bdaeaff9ec91b89911cd0958

### Complete proposed decision

```json
{
  "claimId": "claim_2361b06eda9a97678fdb502cb5949d3e",
  "sourceUnitDigest": "4fe39a3a337800c3d7972d0517f0abb9601a73d047978fcb482a25c456da4cce",
  "targetOwner": "docs/platform/ui-spec/spec.md",
  "targetAnchor": "a-note-on-scale",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/00-overview.md#a-note-on-scale (source lines 87-87) is carried at docs/platform/ui-spec/spec.md#a-note-on-scale (candidate lines 109-109). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/00-overview.md verbatim in docs/platform/ui-spec/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "4fe39a3a337800c3d7972d0517f0abb9601a73d047978fcb482a25c456da4cce",
  "targetAncestry": [
    "herdr web dashboard — UI spec overview"
  ]
}
```

### Full source shown text

```text
## A note on scale

The `ui-spec` skill states it is for applications of ~20 surfaces or more.
This one has ten. It is used here anyway, deliberately: the thing this
cluster actually needs is a **clickable wireframe to test readability
before any pixel exists**, and that is what this tooling produces
regardless of surface count. Recorded so a later reader does not think the
skill's own threshold was overlooked.
```

### Full target shown text

```text
## A note on scale

The `ui-spec` skill states it is for applications of ~20 surfaces or more.
This one has ten. It is used here anyway, deliberately: the thing this
cluster actually needs is a **clickable wireframe to test readability
before any pixel exists**, and that is what this tooling produces
regardless of surface count. Recorded so a later reader does not think the
skill's own threshold was overlooked.
```

## claim_271679d81259c0ae4190964de3d736f2

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/00-overview.md#unheaded-block-11; lines 89–94; ancestry ["herdr web dashboard — UI spec overview","A note on scale"].
Target: docs/platform/ui-spec/spec.md#unheaded-block-13; ancestry ["herdr web dashboard — UI spec overview","A note on scale"].
Source digest: 2f30aaa9f483a4a395a79fda930732ebc9e66af7d52852fad2ca25bf466cb218
Target digest: 2f30aaa9f483a4a395a79fda930732ebc9e66af7d52852fad2ca25bf466cb218
Shown source SHA256: 2f30aaa9f483a4a395a79fda930732ebc9e66af7d52852fad2ca25bf466cb218
Shown target SHA256: 2f30aaa9f483a4a395a79fda930732ebc9e66af7d52852fad2ca25bf466cb218

### Complete proposed decision

```json
{
  "claimId": "claim_271679d81259c0ae4190964de3d736f2",
  "sourceUnitDigest": "2f30aaa9f483a4a395a79fda930732ebc9e66af7d52852fad2ca25bf466cb218",
  "targetOwner": "docs/platform/ui-spec/spec.md",
  "targetAnchor": "unheaded-block-13",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/00-overview.md#unheaded-block-11 (source lines 89-94) is carried at docs/platform/ui-spec/spec.md#unheaded-block-13 (candidate lines 111-116). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/00-overview.md verbatim in docs/platform/ui-spec/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "2f30aaa9f483a4a395a79fda930732ebc9e66af7d52852fad2ca25bf466cb218",
  "targetAncestry": [
    "herdr web dashboard — UI spec overview",
    "A note on scale"
  ]
}
```

### Full source shown text

```text
The `ui-spec` skill states it is for applications of ~20 surfaces or more.
This one has ten. It is used here anyway, deliberately: the thing this
cluster actually needs is a **clickable wireframe to test readability
before any pixel exists**, and that is what this tooling produces
regardless of surface count. Recorded so a later reader does not think the
skill's own threshold was overlooked.
```

### Full target shown text

```text
The `ui-spec` skill states it is for applications of ~20 surfaces or more.
This one has ten. It is used here anyway, deliberately: the thing this
cluster actually needs is a **clickable wireframe to test readability
before any pixel exists**, and that is what this tooling produces
regardless of surface count. Recorded so a later reader does not think the
skill's own threshold was overlooked.
```
