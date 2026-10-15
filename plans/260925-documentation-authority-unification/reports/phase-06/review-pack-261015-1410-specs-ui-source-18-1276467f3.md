# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/components/C01-item-card.md
Part 1/1; entries: **12**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 4/4 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_109add81bb924e6eee91fd71970cb736",
      "claim_395f43e9fcab6a33a53287f989fc8c9f",
      "claim_148f80fabb2860c02f3ecaae066d0dd9",
      "claim_8979277c1d0e4524cae97fd341bebd94",
      "claim_8a6a231da62f2274143d262fb24b062a",
      "claim_3df1dabc3fce9334394d809c46c61e6b",
      "claim_5764f10fa89eb4c38e22ce38a4fb1d6a",
      "claim_bd5ce1469ab840023fd2640668a1ab35"
    ],
    "Weak-exact": [
      "claim_882d57e5238d9ecd469765384149aa66",
      "claim_538202d0e8e5c97c325d21ac4a0df9f0",
      "claim_63d6b36c5ef9c4bb74f84d3c4056928f"
    ],
    "Judgment": [
      "claim_8627caebb796137a1850158610034a48"
    ]
  },
  "unequalDigestPairs": [
    "claim_8627caebb796137a1850158610034a48"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_8627caebb796137a1850158610034a48"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_109add81bb924e6eee91fd71970cb736

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/components/C01-item-card.md#unheaded-block-1; lines 1–11; ancestry [].
Target: docs/platform/ui-spec/architecture/components/C01-item-card.md#unheaded-block-1; ancestry [].
Source digest: 3a145c4c61d69e30e4e21c9ec2b01c1a093c2f2cf67e3d4a755bd1e73a676d04
Target digest: 3a145c4c61d69e30e4e21c9ec2b01c1a093c2f2cf67e3d4a755bd1e73a676d04
Shown source SHA256: 3a145c4c61d69e30e4e21c9ec2b01c1a093c2f2cf67e3d4a755bd1e73a676d04
Shown target SHA256: 3a145c4c61d69e30e4e21c9ec2b01c1a093c2f2cf67e3d4a755bd1e73a676d04

### Complete proposed decision

```json
{
  "claimId": "claim_109add81bb924e6eee91fd71970cb736",
  "sourceUnitDigest": "3a145c4c61d69e30e4e21c9ec2b01c1a093c2f2cf67e3d4a755bd1e73a676d04",
  "targetOwner": "docs/platform/ui-spec/architecture/components/C01-item-card.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/ui-spec/components/C01-item-card.md#unheaded-block-1 (source lines 1-11) is carried at docs/platform/ui-spec/architecture/components/C01-item-card.md#unheaded-block-1 (candidate lines 1-11). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/components/C01-item-card.md verbatim in docs/platform/ui-spec/architecture/components/C01-item-card.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3a145c4c61d69e30e4e21c9ec2b01c1a093c2f2cf67e3d4a755bd1e73a676d04",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
id: C01
type: component
name: "Item card with status pill and quick actions"
platforms: [desktop, mobile]
hosts: [S02, S03]
status: active
design_ref: ""
rules: [R2, R8]
regions: [pill, title, quick_actions]
---
```

### Full target shown text

```text
---
id: C01
type: component
name: "Item card with status pill and quick actions"
platforms: [desktop, mobile]
hosts: [S02, S03]
status: active
design_ref: ""
rules: [R2, R8]
regions: [pill, title, quick_actions]
---
```

## claim_8627caebb796137a1850158610034a48

Class: Judgment; mandatory deep: true.
Source: docs/ui-spec/components/C01-item-card.md#c01-item-card-status-pill-quick-actions; lines 13–13; ancestry [].
Target: docs/platform/ui-spec/architecture/components/C01-item-card.md#c01-item-card-status-pill-quick-actions; ancestry [].
Source digest: 814b93ef3240891bb7518a43191b364f9a128fb4eb5c67479c91263e9080681d
Target digest: 32dc856ec2c0aa3433f0fb42e7160e3a87f4694b111a3b1336544165e3769b99
Shown source SHA256: 87ef55b958cfbc039f1c886fdd98ce6813f2e2ea4f28a2e4c44f58077a2f7e14
Shown target SHA256: 99e15cddf712f6ae5ae6e6b9a073df896a0a4b5ba2533b5bdbc752b218257deb

### Complete proposed decision

```json
{
  "claimId": "claim_8627caebb796137a1850158610034a48",
  "sourceUnitDigest": "814b93ef3240891bb7518a43191b364f9a128fb4eb5c67479c91263e9080681d",
  "targetOwner": "docs/platform/ui-spec/architecture/components/C01-item-card.md",
  "targetAnchor": "c01-item-card-status-pill-quick-actions",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/ui-spec/components/C01-item-card.md#c01-item-card-status-pill-quick-actions (source lines 13-13) is carried at docs/platform/ui-spec/architecture/components/C01-item-card.md#c01-item-card-status-pill-quick-actions (candidate lines 13-13). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/ui-spec/components/C01-item-card.md verbatim in docs/platform/ui-spec/architecture/components/C01-item-card.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "32dc856ec2c0aa3433f0fb42e7160e3a87f4694b111a3b1336544165e3769b99",
  "targetAncestry": []
}
```

### Full source shown text

```text
# C01 — Item card (status pill + quick actions)
```

### Full target shown text

````text
# C01 — Item card (status pill + quick actions)

```txt
Document type: Architecture
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/components/C01-item-card.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/ui-spec/components/C01-item-card.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.
````

## claim_882d57e5238d9ecd469765384149aa66

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/components/C01-item-card.md#purpose; lines 15–15; ancestry ["C01 — Item card (status pill + quick actions)"].
Target: docs/platform/ui-spec/architecture/components/C01-item-card.md#purpose; ancestry ["C01 — Item card (status pill + quick actions)"].
Source digest: 3e708823454641bbda3388d542273d11192509337285064feb4e9172e1642fa7
Target digest: 3e708823454641bbda3388d542273d11192509337285064feb4e9172e1642fa7
Shown source SHA256: 8fb9dad3685788247c395a7e5ffaa07288f845f2fae340ca6531d0c55c9d5146
Shown target SHA256: 8fb9dad3685788247c395a7e5ffaa07288f845f2fae340ca6531d0c55c9d5146

### Complete proposed decision

```json
{
  "claimId": "claim_882d57e5238d9ecd469765384149aa66",
  "sourceUnitDigest": "3e708823454641bbda3388d542273d11192509337285064feb4e9172e1642fa7",
  "targetOwner": "docs/platform/ui-spec/architecture/components/C01-item-card.md",
  "targetAnchor": "purpose",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/components/C01-item-card.md#purpose (source lines 15-15) is carried at docs/platform/ui-spec/architecture/components/C01-item-card.md#purpose (candidate lines 37-37). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/components/C01-item-card.md verbatim in docs/platform/ui-spec/architecture/components/C01-item-card.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3e708823454641bbda3388d542273d11192509337285064feb4e9172e1642fa7",
  "targetAncestry": [
    "C01 — Item card (status pill + quick actions)"
  ]
}
```

### Full source shown text

```text
## Purpose

The repeated unit of the taskboard, and the thing that makes it a board
rather than a table. It carries the two affordances the Monday.com/ClickUp
reference is actually about: **status legible at a glance** (a coloured
pill) and **quick actions reachable in place** without opening the item
(`docs/specs/herdr-web-dashboard.md` §View the taskboard).
```

### Full target shown text

```text
## Purpose

The repeated unit of the taskboard, and the thing that makes it a board
rather than a table. It carries the two affordances the Monday.com/ClickUp
reference is actually about: **status legible at a glance** (a coloured
pill) and **quick actions reachable in place** without opening the item
(`docs/specs/herdr-web-dashboard.md` §View the taskboard).
```

## claim_395f43e9fcab6a33a53287f989fc8c9f

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/components/C01-item-card.md#unheaded-block-2; lines 17–21; ancestry ["C01 — Item card (status pill + quick actions)","Purpose"].
Target: docs/platform/ui-spec/architecture/components/C01-item-card.md#unheaded-block-4; ancestry ["C01 — Item card (status pill + quick actions)","Purpose"].
Source digest: 15b3c360bea3a0d48a0d56ddf9f43657b6155dd1d42168d987ccbaf856477ae5
Target digest: 15b3c360bea3a0d48a0d56ddf9f43657b6155dd1d42168d987ccbaf856477ae5
Shown source SHA256: 15b3c360bea3a0d48a0d56ddf9f43657b6155dd1d42168d987ccbaf856477ae5
Shown target SHA256: 15b3c360bea3a0d48a0d56ddf9f43657b6155dd1d42168d987ccbaf856477ae5

### Complete proposed decision

```json
{
  "claimId": "claim_395f43e9fcab6a33a53287f989fc8c9f",
  "sourceUnitDigest": "15b3c360bea3a0d48a0d56ddf9f43657b6155dd1d42168d987ccbaf856477ae5",
  "targetOwner": "docs/platform/ui-spec/architecture/components/C01-item-card.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/components/C01-item-card.md#unheaded-block-2 (source lines 17-21) is carried at docs/platform/ui-spec/architecture/components/C01-item-card.md#unheaded-block-4 (candidate lines 39-43). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/components/C01-item-card.md verbatim in docs/platform/ui-spec/architecture/components/C01-item-card.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "15b3c360bea3a0d48a0d56ddf9f43657b6155dd1d42168d987ccbaf856477ae5",
  "targetAncestry": [
    "C01 — Item card (status pill + quick actions)",
    "Purpose"
  ]
}
```

### Full source shown text

```text
The repeated unit of the taskboard, and the thing that makes it a board
rather than a table. It carries the two affordances the Monday.com/ClickUp
reference is actually about: **status legible at a glance** (a coloured
pill) and **quick actions reachable in place** without opening the item
(`docs/specs/herdr-web-dashboard.md` §View the taskboard).
```

### Full target shown text

```text
The repeated unit of the taskboard, and the thing that makes it a board
rather than a table. It carries the two affordances the Monday.com/ClickUp
reference is actually about: **status legible at a glance** (a coloured
pill) and **quick actions reachable in place** without opening the item
(`docs/specs/herdr-web-dashboard.md` §View the taskboard).
```

## claim_538202d0e8e5c97c325d21ac4a0df9f0

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/components/C01-item-card.md#layout; lines 23–23; ancestry ["C01 — Item card (status pill + quick actions)"].
Target: docs/platform/ui-spec/architecture/components/C01-item-card.md#layout; ancestry ["C01 — Item card (status pill + quick actions)"].
Source digest: cdabcbb72c176864ea7a1b83c6b1edd9e361d54eeda367295f29f3cbd6023213
Target digest: cdabcbb72c176864ea7a1b83c6b1edd9e361d54eeda367295f29f3cbd6023213
Shown source SHA256: 49b00e43d274d3ce5f5e3748988d752c1d036f4a9efc7bd865fb1ba222d9bb8d
Shown target SHA256: 49b00e43d274d3ce5f5e3748988d752c1d036f4a9efc7bd865fb1ba222d9bb8d

### Complete proposed decision

```json
{
  "claimId": "claim_538202d0e8e5c97c325d21ac4a0df9f0",
  "sourceUnitDigest": "cdabcbb72c176864ea7a1b83c6b1edd9e361d54eeda367295f29f3cbd6023213",
  "targetOwner": "docs/platform/ui-spec/architecture/components/C01-item-card.md",
  "targetAnchor": "layout",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/components/C01-item-card.md#layout (source lines 23-23) is carried at docs/platform/ui-spec/architecture/components/C01-item-card.md#layout (candidate lines 45-45). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/components/C01-item-card.md verbatim in docs/platform/ui-spec/architecture/components/C01-item-card.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "cdabcbb72c176864ea7a1b83c6b1edd9e361d54eeda367295f29f3cbd6023213",
  "targetAncestry": [
    "C01 — Item card (status pill + quick actions)"
  ]
}
```

### Full source shown text

````text
## Layout

```
┌────────────────────────────────────┐
│ tsk-4id  Task detail pairing    ⋯ │  ← quick_actions menu
│ ● awaiting-human · executing       │  ← pill + stage
└────────────────────────────────────┘

⋯ menu:
  ┌──────────────────┐
  │ Answer           │  (only when parked)
  │ Edit             │
  │ Retire           │
  └──────────────────┘
```

The pill carries **status**, in colour; the stage rides alongside it as
plain text. Status is what a person triages on; stage is detail. Giving
both the same visual weight would defeat the glance.

`Retire` is worded as retire, never as delete — fgOS has no delete verb
and the history is append-only, so calling it "delete" would promise
something the system cannot do
(`docs/specs/herdr-web-dashboard.md` §Retire a work item).

Per R8 the quick-action menu is visually distinct from the card body: the
card is a read surface, the menu is where writes happen. `Approve merge`
is deliberately **not** in this menu — the one trunk-changing action does
not live behind a hover affordance on a list row.
````

### Full target shown text

````text
## Layout

```
┌────────────────────────────────────┐
│ tsk-4id  Task detail pairing    ⋯ │  ← quick_actions menu
│ ● awaiting-human · executing       │  ← pill + stage
└────────────────────────────────────┘

⋯ menu:
  ┌──────────────────┐
  │ Answer           │  (only when parked)
  │ Edit             │
  │ Retire           │
  └──────────────────┘
```

The pill carries **status**, in colour; the stage rides alongside it as
plain text. Status is what a person triages on; stage is detail. Giving
both the same visual weight would defeat the glance.

`Retire` is worded as retire, never as delete — fgOS has no delete verb
and the history is append-only, so calling it "delete" would promise
something the system cannot do
(`docs/specs/herdr-web-dashboard.md` §Retire a work item).

Per R8 the quick-action menu is visually distinct from the card body: the
card is a read surface, the menu is where writes happen. `Approve merge`
is deliberately **not** in this menu — the one trunk-changing action does
not live behind a hover affordance on a list row.
````

## claim_148f80fabb2860c02f3ecaae066d0dd9

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/components/C01-item-card.md#unheaded-block-3; lines 25–37; ancestry ["C01 — Item card (status pill + quick actions)","Layout"].
Target: docs/platform/ui-spec/architecture/components/C01-item-card.md#unheaded-block-5; ancestry ["C01 — Item card (status pill + quick actions)","Layout"].
Source digest: 3f017de8e115fe6a31a606eff031929e6bfaa0d5fa79ea6bffc26784dc11510c
Target digest: 3f017de8e115fe6a31a606eff031929e6bfaa0d5fa79ea6bffc26784dc11510c
Shown source SHA256: 3f017de8e115fe6a31a606eff031929e6bfaa0d5fa79ea6bffc26784dc11510c
Shown target SHA256: 3f017de8e115fe6a31a606eff031929e6bfaa0d5fa79ea6bffc26784dc11510c

### Complete proposed decision

```json
{
  "claimId": "claim_148f80fabb2860c02f3ecaae066d0dd9",
  "sourceUnitDigest": "3f017de8e115fe6a31a606eff031929e6bfaa0d5fa79ea6bffc26784dc11510c",
  "targetOwner": "docs/platform/ui-spec/architecture/components/C01-item-card.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/components/C01-item-card.md#unheaded-block-3 (source lines 25-37) is carried at docs/platform/ui-spec/architecture/components/C01-item-card.md#unheaded-block-5 (candidate lines 47-59). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/components/C01-item-card.md verbatim in docs/platform/ui-spec/architecture/components/C01-item-card.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3f017de8e115fe6a31a606eff031929e6bfaa0d5fa79ea6bffc26784dc11510c",
  "targetAncestry": [
    "C01 — Item card (status pill + quick actions)",
    "Layout"
  ]
}
```

### Full source shown text

````text
```
┌────────────────────────────────────┐
│ tsk-4id  Task detail pairing    ⋯ │  ← quick_actions menu
│ ● awaiting-human · executing       │  ← pill + stage
└────────────────────────────────────┘

⋯ menu:
  ┌──────────────────┐
  │ Answer           │  (only when parked)
  │ Edit             │
  │ Retire           │
  └──────────────────┘
```
````

### Full target shown text

````text
```
┌────────────────────────────────────┐
│ tsk-4id  Task detail pairing    ⋯ │  ← quick_actions menu
│ ● awaiting-human · executing       │  ← pill + stage
└────────────────────────────────────┘

⋯ menu:
  ┌──────────────────┐
  │ Answer           │  (only when parked)
  │ Edit             │
  │ Retire           │
  └──────────────────┘
```
````

## claim_8979277c1d0e4524cae97fd341bebd94

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/components/C01-item-card.md#unheaded-block-4; lines 39–41; ancestry ["C01 — Item card (status pill + quick actions)","Layout"].
Target: docs/platform/ui-spec/architecture/components/C01-item-card.md#unheaded-block-6; ancestry ["C01 — Item card (status pill + quick actions)","Layout"].
Source digest: b1f21928b96cebaf6ee1f6dd16b8590999001215f981d3dc0299995c5954b32f
Target digest: b1f21928b96cebaf6ee1f6dd16b8590999001215f981d3dc0299995c5954b32f
Shown source SHA256: b1f21928b96cebaf6ee1f6dd16b8590999001215f981d3dc0299995c5954b32f
Shown target SHA256: b1f21928b96cebaf6ee1f6dd16b8590999001215f981d3dc0299995c5954b32f

### Complete proposed decision

```json
{
  "claimId": "claim_8979277c1d0e4524cae97fd341bebd94",
  "sourceUnitDigest": "b1f21928b96cebaf6ee1f6dd16b8590999001215f981d3dc0299995c5954b32f",
  "targetOwner": "docs/platform/ui-spec/architecture/components/C01-item-card.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/components/C01-item-card.md#unheaded-block-4 (source lines 39-41) is carried at docs/platform/ui-spec/architecture/components/C01-item-card.md#unheaded-block-6 (candidate lines 61-63). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/components/C01-item-card.md verbatim in docs/platform/ui-spec/architecture/components/C01-item-card.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b1f21928b96cebaf6ee1f6dd16b8590999001215f981d3dc0299995c5954b32f",
  "targetAncestry": [
    "C01 — Item card (status pill + quick actions)",
    "Layout"
  ]
}
```

### Full source shown text

```text
The pill carries **status**, in colour; the stage rides alongside it as
plain text. Status is what a person triages on; stage is detail. Giving
both the same visual weight would defeat the glance.
```

### Full target shown text

```text
The pill carries **status**, in colour; the stage rides alongside it as
plain text. Status is what a person triages on; stage is detail. Giving
both the same visual weight would defeat the glance.
```

## claim_8a6a231da62f2274143d262fb24b062a

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/components/C01-item-card.md#unheaded-block-5; lines 43–46; ancestry ["C01 — Item card (status pill + quick actions)","Layout"].
Target: docs/platform/ui-spec/architecture/components/C01-item-card.md#unheaded-block-7; ancestry ["C01 — Item card (status pill + quick actions)","Layout"].
Source digest: 55296892dc25c55b80f4e00a9369b7ebe0869ea53df9042f33894444baef91da
Target digest: 55296892dc25c55b80f4e00a9369b7ebe0869ea53df9042f33894444baef91da
Shown source SHA256: 55296892dc25c55b80f4e00a9369b7ebe0869ea53df9042f33894444baef91da
Shown target SHA256: 55296892dc25c55b80f4e00a9369b7ebe0869ea53df9042f33894444baef91da

### Complete proposed decision

```json
{
  "claimId": "claim_8a6a231da62f2274143d262fb24b062a",
  "sourceUnitDigest": "55296892dc25c55b80f4e00a9369b7ebe0869ea53df9042f33894444baef91da",
  "targetOwner": "docs/platform/ui-spec/architecture/components/C01-item-card.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/components/C01-item-card.md#unheaded-block-5 (source lines 43-46) is carried at docs/platform/ui-spec/architecture/components/C01-item-card.md#unheaded-block-7 (candidate lines 65-68). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/components/C01-item-card.md verbatim in docs/platform/ui-spec/architecture/components/C01-item-card.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "55296892dc25c55b80f4e00a9369b7ebe0869ea53df9042f33894444baef91da",
  "targetAncestry": [
    "C01 — Item card (status pill + quick actions)",
    "Layout"
  ]
}
```

### Full source shown text

```text
`Retire` is worded as retire, never as delete — fgOS has no delete verb
and the history is append-only, so calling it "delete" would promise
something the system cannot do
(`docs/specs/herdr-web-dashboard.md` §Retire a work item).
```

### Full target shown text

```text
`Retire` is worded as retire, never as delete — fgOS has no delete verb
and the history is append-only, so calling it "delete" would promise
something the system cannot do
(`docs/specs/herdr-web-dashboard.md` §Retire a work item).
```

## claim_3df1dabc3fce9334394d809c46c61e6b

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/components/C01-item-card.md#unheaded-block-6; lines 48–51; ancestry ["C01 — Item card (status pill + quick actions)","Layout"].
Target: docs/platform/ui-spec/architecture/components/C01-item-card.md#unheaded-block-8; ancestry ["C01 — Item card (status pill + quick actions)","Layout"].
Source digest: 31cdc0799218defe77f0c879496156f54d4a0ab2aea7f5ae6463e51838695364
Target digest: 31cdc0799218defe77f0c879496156f54d4a0ab2aea7f5ae6463e51838695364
Shown source SHA256: 31cdc0799218defe77f0c879496156f54d4a0ab2aea7f5ae6463e51838695364
Shown target SHA256: 31cdc0799218defe77f0c879496156f54d4a0ab2aea7f5ae6463e51838695364

### Complete proposed decision

```json
{
  "claimId": "claim_3df1dabc3fce9334394d809c46c61e6b",
  "sourceUnitDigest": "31cdc0799218defe77f0c879496156f54d4a0ab2aea7f5ae6463e51838695364",
  "targetOwner": "docs/platform/ui-spec/architecture/components/C01-item-card.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/components/C01-item-card.md#unheaded-block-6 (source lines 48-51) is carried at docs/platform/ui-spec/architecture/components/C01-item-card.md#unheaded-block-8 (candidate lines 70-73). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/components/C01-item-card.md verbatim in docs/platform/ui-spec/architecture/components/C01-item-card.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "31cdc0799218defe77f0c879496156f54d4a0ab2aea7f5ae6463e51838695364",
  "targetAncestry": [
    "C01 — Item card (status pill + quick actions)",
    "Layout"
  ]
}
```

### Full source shown text

```text
Per R8 the quick-action menu is visually distinct from the card body: the
card is a read surface, the menu is where writes happen. `Approve merge`
is deliberately **not** in this menu — the one trunk-changing action does
not live behind a hover affordance on a list row.
```

### Full target shown text

```text
Per R8 the quick-action menu is visually distinct from the card body: the
card is a read surface, the menu is where writes happen. `Approve merge`
is deliberately **not** in this menu — the one trunk-changing action does
not live behind a hover affordance on a list row.
```

## claim_63d6b36c5ef9c4bb74f84d3c4056928f

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/components/C01-item-card.md#component-contract; lines 53–53; ancestry ["C01 — Item card (status pill + quick actions)"].
Target: docs/platform/ui-spec/architecture/components/C01-item-card.md#component-contract; ancestry ["C01 — Item card (status pill + quick actions)"].
Source digest: b47a7823db8cba7179fcdd6ccee7b52d27241007655291db2d4da246540c28a0
Target digest: b47a7823db8cba7179fcdd6ccee7b52d27241007655291db2d4da246540c28a0
Shown source SHA256: ae10315053a964432e12767e5001508e4c9f89329c911d90b465ad25e9e192ca
Shown target SHA256: ae10315053a964432e12767e5001508e4c9f89329c911d90b465ad25e9e192ca

### Complete proposed decision

```json
{
  "claimId": "claim_63d6b36c5ef9c4bb74f84d3c4056928f",
  "sourceUnitDigest": "b47a7823db8cba7179fcdd6ccee7b52d27241007655291db2d4da246540c28a0",
  "targetOwner": "docs/platform/ui-spec/architecture/components/C01-item-card.md",
  "targetAnchor": "component-contract",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/components/C01-item-card.md#component-contract (source lines 53-53) is carried at docs/platform/ui-spec/architecture/components/C01-item-card.md#component-contract (candidate lines 75-75). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/components/C01-item-card.md verbatim in docs/platform/ui-spec/architecture/components/C01-item-card.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b47a7823db8cba7179fcdd6ccee7b52d27241007655291db2d4da246540c28a0",
  "targetAncestry": [
    "C01 — Item card (status pill + quick actions)"
  ]
}
```

### Full source shown text

````text
## Component contract

Per the component model, this emits events only; hosts decide what
happens. That is what keeps the card reusable on both S02 and S03 without
either screen's navigation leaking into it.

```yaml herdrweb-contract
emits:
  - id: A-C01-001
    element: quick_action_menu_item
    region: quick_actions
    trigger: click
    event: item.quick_action
    payload: { item_id: "$item.id", verb: "$action.verb" }
```
````

### Full target shown text

````text
## Component contract

Per the component model, this emits events only; hosts decide what
happens. That is what keeps the card reusable on both S02 and S03 without
either screen's navigation leaking into it.

```yaml herdrweb-contract
emits:
  - id: A-C01-001
    element: quick_action_menu_item
    region: quick_actions
    trigger: click
    event: item.quick_action
    payload: { item_id: "$item.id", verb: "$action.verb" }
```
````

## claim_5764f10fa89eb4c38e22ce38a4fb1d6a

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/components/C01-item-card.md#unheaded-block-7; lines 55–57; ancestry ["C01 — Item card (status pill + quick actions)","Component contract"].
Target: docs/platform/ui-spec/architecture/components/C01-item-card.md#unheaded-block-9; ancestry ["C01 — Item card (status pill + quick actions)","Component contract"].
Source digest: 7ff302f6acd07aa606cb4da2969c237e465d58ffbf3fd77fe987f59fa33d808f
Target digest: 7ff302f6acd07aa606cb4da2969c237e465d58ffbf3fd77fe987f59fa33d808f
Shown source SHA256: 7ff302f6acd07aa606cb4da2969c237e465d58ffbf3fd77fe987f59fa33d808f
Shown target SHA256: 7ff302f6acd07aa606cb4da2969c237e465d58ffbf3fd77fe987f59fa33d808f

### Complete proposed decision

```json
{
  "claimId": "claim_5764f10fa89eb4c38e22ce38a4fb1d6a",
  "sourceUnitDigest": "7ff302f6acd07aa606cb4da2969c237e465d58ffbf3fd77fe987f59fa33d808f",
  "targetOwner": "docs/platform/ui-spec/architecture/components/C01-item-card.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/components/C01-item-card.md#unheaded-block-7 (source lines 55-57) is carried at docs/platform/ui-spec/architecture/components/C01-item-card.md#unheaded-block-9 (candidate lines 77-79). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/components/C01-item-card.md verbatim in docs/platform/ui-spec/architecture/components/C01-item-card.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7ff302f6acd07aa606cb4da2969c237e465d58ffbf3fd77fe987f59fa33d808f",
  "targetAncestry": [
    "C01 — Item card (status pill + quick actions)",
    "Component contract"
  ]
}
```

### Full source shown text

```text
Per the component model, this emits events only; hosts decide what
happens. That is what keeps the card reusable on both S02 and S03 without
either screen's navigation leaking into it.
```

### Full target shown text

```text
Per the component model, this emits events only; hosts decide what
happens. That is what keeps the card reusable on both S02 and S03 without
either screen's navigation leaking into it.
```

## claim_bd5ce1469ab840023fd2640668a1ab35

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/components/C01-item-card.md#unheaded-block-8; lines 59–67; ancestry ["C01 — Item card (status pill + quick actions)","Component contract"].
Target: docs/platform/ui-spec/architecture/components/C01-item-card.md#unheaded-block-10; ancestry ["C01 — Item card (status pill + quick actions)","Component contract"].
Source digest: 6f2e5a2ea6ae53322b557ee6fbb8cc479c38e36e5737d0b2c9d9e76d4ccfb016
Target digest: 6f2e5a2ea6ae53322b557ee6fbb8cc479c38e36e5737d0b2c9d9e76d4ccfb016
Shown source SHA256: 6f2e5a2ea6ae53322b557ee6fbb8cc479c38e36e5737d0b2c9d9e76d4ccfb016
Shown target SHA256: 6f2e5a2ea6ae53322b557ee6fbb8cc479c38e36e5737d0b2c9d9e76d4ccfb016

### Complete proposed decision

```json
{
  "claimId": "claim_bd5ce1469ab840023fd2640668a1ab35",
  "sourceUnitDigest": "6f2e5a2ea6ae53322b557ee6fbb8cc479c38e36e5737d0b2c9d9e76d4ccfb016",
  "targetOwner": "docs/platform/ui-spec/architecture/components/C01-item-card.md",
  "targetAnchor": "unheaded-block-10",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/components/C01-item-card.md#unheaded-block-8 (source lines 59-67) is carried at docs/platform/ui-spec/architecture/components/C01-item-card.md#unheaded-block-10 (candidate lines 81-89). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/components/C01-item-card.md verbatim in docs/platform/ui-spec/architecture/components/C01-item-card.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6f2e5a2ea6ae53322b557ee6fbb8cc479c38e36e5737d0b2c9d9e76d4ccfb016",
  "targetAncestry": [
    "C01 — Item card (status pill + quick actions)",
    "Component contract"
  ]
}
```

### Full source shown text

````text
```yaml herdrweb-contract
emits:
  - id: A-C01-001
    element: quick_action_menu_item
    region: quick_actions
    trigger: click
    event: item.quick_action
    payload: { item_id: "$item.id", verb: "$action.verb" }
```
````

### Full target shown text

````text
```yaml herdrweb-contract
emits:
  - id: A-C01-001
    element: quick_action_menu_item
    region: quick_actions
    trigger: click
    event: item.quick_action
    payload: { item_id: "$item.id", verb: "$action.verb" }
```
````
