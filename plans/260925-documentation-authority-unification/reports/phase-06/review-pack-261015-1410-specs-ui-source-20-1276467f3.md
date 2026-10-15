# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/flows/F02-approve-a-merge.md
Part 1/1; entries: **9**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 4/4 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_5f420ddb02566c9c8a56fbafd6b983e2",
      "claim_60dac881eaa2cdcd199178d215ffbb36",
      "claim_1d369d57f0c92d6946fd444b3c185ee9",
      "claim_c4e3bc74cc2ced13097609eb24abd538",
      "claim_0bdecaf6bb7f4c5d03d4dd32edd6e372"
    ],
    "Weak-exact": [
      "claim_f842d35b41d8dffa74f3046ff8849c84",
      "claim_f7005f7ebad9ae0ce51496641db22437",
      "claim_20574a3ed563c18bcb4429ef021da422"
    ],
    "Judgment": [
      "claim_c3403dd5ad03f954dc9df76b0cdfd920"
    ]
  },
  "unequalDigestPairs": [
    "claim_c3403dd5ad03f954dc9df76b0cdfd920"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_c3403dd5ad03f954dc9df76b0cdfd920"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_5f420ddb02566c9c8a56fbafd6b983e2

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F02-approve-a-merge.md#unheaded-block-1; lines 1–11; ancestry [].
Target: docs/platform/ui-spec/operations/F02-approve-a-merge.md#unheaded-block-1; ancestry [].
Source digest: 7d74b74c5b051465a4b4e23eab5a5457e44425ba878bdede39e6035f831ef106
Target digest: 7d74b74c5b051465a4b4e23eab5a5457e44425ba878bdede39e6035f831ef106
Shown source SHA256: 7d74b74c5b051465a4b4e23eab5a5457e44425ba878bdede39e6035f831ef106
Shown target SHA256: 7d74b74c5b051465a4b4e23eab5a5457e44425ba878bdede39e6035f831ef106

### Complete proposed decision

```json
{
  "claimId": "claim_5f420ddb02566c9c8a56fbafd6b983e2",
  "sourceUnitDigest": "7d74b74c5b051465a4b4e23eab5a5457e44425ba878bdede39e6035f831ef106",
  "targetOwner": "docs/platform/ui-spec/operations/F02-approve-a-merge.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/ui-spec/flows/F02-approve-a-merge.md#unheaded-block-1 (source lines 1-11) is carried at docs/platform/ui-spec/operations/F02-approve-a-merge.md#unheaded-block-1 (candidate lines 1-11). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F02-approve-a-merge.md verbatim in docs/platform/ui-spec/operations/F02-approve-a-merge.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7d74b74c5b051465a4b4e23eab5a5457e44425ba878bdede39e6035f831ef106",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
id: F02
type: flow
name: "Approve a merge, end to end"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: []
regions: []
---
```

### Full target shown text

```text
---
id: F02
type: flow
name: "Approve a merge, end to end"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: []
regions: []
---
```

## claim_c3403dd5ad03f954dc9df76b0cdfd920

Class: Judgment; mandatory deep: true.
Source: docs/ui-spec/flows/F02-approve-a-merge.md#f02-approve-a-merge-end-to-end; lines 13–13; ancestry [].
Target: docs/platform/ui-spec/operations/F02-approve-a-merge.md#f02-approve-a-merge-end-to-end; ancestry [].
Source digest: dbc61e203133d70aa3e54b3c37c3d40baee3297fea3e5877a9e17be8189dbdbf
Target digest: 9f0af999ce086d659b25211989bf844d88cedf2430226d3716cb22ecdadcfc50
Shown source SHA256: 73cae96a21e004725960d8b59077c937f00ddac40c201add902e2e14e3d44fd3
Shown target SHA256: c37d84e52cd2ac10250989a04c3b495a5c65434a4fc6d03425582a67b50ff899

### Complete proposed decision

```json
{
  "claimId": "claim_c3403dd5ad03f954dc9df76b0cdfd920",
  "sourceUnitDigest": "dbc61e203133d70aa3e54b3c37c3d40baee3297fea3e5877a9e17be8189dbdbf",
  "targetOwner": "docs/platform/ui-spec/operations/F02-approve-a-merge.md",
  "targetAnchor": "f02-approve-a-merge-end-to-end",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/ui-spec/flows/F02-approve-a-merge.md#f02-approve-a-merge-end-to-end (source lines 13-13) is carried at docs/platform/ui-spec/operations/F02-approve-a-merge.md#f02-approve-a-merge-end-to-end (candidate lines 13-13). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F02-approve-a-merge.md verbatim in docs/platform/ui-spec/operations/F02-approve-a-merge.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "9f0af999ce086d659b25211989bf844d88cedf2430226d3716cb22ecdadcfc50",
  "targetAncestry": []
}
```

### Full source shown text

```text
# F02 — Approve a merge, end to end
```

### Full target shown text

````text
# F02 — Approve a merge, end to end

```txt
Document type: Guide / Runbook
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/flows/F02-approve-a-merge.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/ui-spec/flows/F02-approve-a-merge.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.
````

## claim_f842d35b41d8dffa74f3046ff8849c84

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F02-approve-a-merge.md#purpose; lines 15–15; ancestry ["F02 — Approve a merge, end to end"].
Target: docs/platform/ui-spec/operations/F02-approve-a-merge.md#purpose; ancestry ["F02 — Approve a merge, end to end"].
Source digest: 964b1729bc45333c4be1e9e22133009a3ea41d19b56884481e8a1f3201d0d448
Target digest: 964b1729bc45333c4be1e9e22133009a3ea41d19b56884481e8a1f3201d0d448
Shown source SHA256: 6cbd116baa0bccdefaab53b64d0257379da97866d7de1bbabf0d826a40ba51e8
Shown target SHA256: 6cbd116baa0bccdefaab53b64d0257379da97866d7de1bbabf0d826a40ba51e8

### Complete proposed decision

```json
{
  "claimId": "claim_f842d35b41d8dffa74f3046ff8849c84",
  "sourceUnitDigest": "964b1729bc45333c4be1e9e22133009a3ea41d19b56884481e8a1f3201d0d448",
  "targetOwner": "docs/platform/ui-spec/operations/F02-approve-a-merge.md",
  "targetAnchor": "purpose",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/flows/F02-approve-a-merge.md#purpose (source lines 15-15) is carried at docs/platform/ui-spec/operations/F02-approve-a-merge.md#purpose (candidate lines 37-37). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F02-approve-a-merge.md verbatim in docs/platform/ui-spec/operations/F02-approve-a-merge.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "964b1729bc45333c4be1e9e22133009a3ea41d19b56884481e8a1f3201d0d448",
  "targetAncestry": [
    "F02 — Approve a merge, end to end"
  ]
}
```

### Full source shown text

```text
## Purpose

The only flow on this client that changes trunk. Everything about its
shape is downstream of that one fact.
```

### Full target shown text

```text
## Purpose

The only flow on this client that changes trunk. Everything about its
shape is downstream of that one fact.
```

## claim_60dac881eaa2cdcd199178d215ffbb36

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F02-approve-a-merge.md#unheaded-block-2; lines 17–18; ancestry ["F02 — Approve a merge, end to end","Purpose"].
Target: docs/platform/ui-spec/operations/F02-approve-a-merge.md#unheaded-block-4; ancestry ["F02 — Approve a merge, end to end","Purpose"].
Source digest: b89920d32de2e95a424ca8027ac2ae5084becee16016525d4f12d2c9127b5aef
Target digest: b89920d32de2e95a424ca8027ac2ae5084becee16016525d4f12d2c9127b5aef
Shown source SHA256: b89920d32de2e95a424ca8027ac2ae5084becee16016525d4f12d2c9127b5aef
Shown target SHA256: b89920d32de2e95a424ca8027ac2ae5084becee16016525d4f12d2c9127b5aef

### Complete proposed decision

```json
{
  "claimId": "claim_60dac881eaa2cdcd199178d215ffbb36",
  "sourceUnitDigest": "b89920d32de2e95a424ca8027ac2ae5084becee16016525d4f12d2c9127b5aef",
  "targetOwner": "docs/platform/ui-spec/operations/F02-approve-a-merge.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/flows/F02-approve-a-merge.md#unheaded-block-2 (source lines 17-18) is carried at docs/platform/ui-spec/operations/F02-approve-a-merge.md#unheaded-block-4 (candidate lines 39-40). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F02-approve-a-merge.md verbatim in docs/platform/ui-spec/operations/F02-approve-a-merge.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b89920d32de2e95a424ca8027ac2ae5084becee16016525d4f12d2c9127b5aef",
  "targetAncestry": [
    "F02 — Approve a merge, end to end",
    "Purpose"
  ]
}
```

### Full source shown text

```text
The only flow on this client that changes trunk. Everything about its
shape is downstream of that one fact.
```

### Full target shown text

```text
The only flow on this client that changes trunk. Everything about its
shape is downstream of that one fact.
```

## claim_f7005f7ebad9ae0ce51496641db22437

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F02-approve-a-merge.md#steps; lines 20–20; ancestry ["F02 — Approve a merge, end to end"].
Target: docs/platform/ui-spec/operations/F02-approve-a-merge.md#steps; ancestry ["F02 — Approve a merge, end to end"].
Source digest: 6c706c276db8d7ba2f3445aa4cddb2384a72168f10e8ec1ed0a5a096fe19bd39
Target digest: 6c706c276db8d7ba2f3445aa4cddb2384a72168f10e8ec1ed0a5a096fe19bd39
Shown source SHA256: ac8d2289f9b4967fc7a200a39c4dafeaeb49e59b4372543c9c1a4e902abab5c7
Shown target SHA256: ac8d2289f9b4967fc7a200a39c4dafeaeb49e59b4372543c9c1a4e902abab5c7

### Complete proposed decision

```json
{
  "claimId": "claim_f7005f7ebad9ae0ce51496641db22437",
  "sourceUnitDigest": "6c706c276db8d7ba2f3445aa4cddb2384a72168f10e8ec1ed0a5a096fe19bd39",
  "targetOwner": "docs/platform/ui-spec/operations/F02-approve-a-merge.md",
  "targetAnchor": "steps",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/flows/F02-approve-a-merge.md#steps (source lines 20-20) is carried at docs/platform/ui-spec/operations/F02-approve-a-merge.md#steps (candidate lines 42-42). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F02-approve-a-merge.md verbatim in docs/platform/ui-spec/operations/F02-approve-a-merge.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6c706c276db8d7ba2f3445aa4cddb2384a72168f10e8ec1ed0a5a096fe19bd39",
  "targetAncestry": [
    "F02 — Approve a merge, end to end"
  ]
}
```

### Full source shown text

```text
## Steps

1. **Land on the taskboard** (S02) — the item sits in the `NEEDS ANSWER`
   group tagged as a gate, because D4 makes a gate-approve question the
   same category to a person as an `ask`.
2. **Open the item** (S03) — the person reads what the agent did, the
   narrative first, machine log collapsed.
3. **Trigger approve** — `Approve merge` in the ACTIONS region, visually
   distinct from `Edit`/`Retire` (R8). If the gateway is not at the
   repository's main working tree, this control is **disabled with the
   reason attached** (ERR-APPROVE-UNAVAILABLE) and the flow stops here,
   honestly, before the person invests any attention.
4. **Confirm** (M02) — what lands, into which branch, which verb runs on
   which machine, and what happens if the re-run verify fails.
5. **Wait** — approve is not instant; the verify re-runs before anything
   merges. ST-SUBMITTING keeps the modal alive rather than looking frozen.
6. **Outcome** — `merge.settled` arrives. Delivered, or parked blocked
   with the engine's own reason. Both are shown; neither is summarized
   into "something went wrong".
```

### Full target shown text

```text
## Steps

1. **Land on the taskboard** (S02) — the item sits in the `NEEDS ANSWER`
   group tagged as a gate, because D4 makes a gate-approve question the
   same category to a person as an `ask`.
2. **Open the item** (S03) — the person reads what the agent did, the
   narrative first, machine log collapsed.
3. **Trigger approve** — `Approve merge` in the ACTIONS region, visually
   distinct from `Edit`/`Retire` (R8). If the gateway is not at the
   repository's main working tree, this control is **disabled with the
   reason attached** (ERR-APPROVE-UNAVAILABLE) and the flow stops here,
   honestly, before the person invests any attention.
4. **Confirm** (M02) — what lands, into which branch, which verb runs on
   which machine, and what happens if the re-run verify fails.
5. **Wait** — approve is not instant; the verify re-runs before anything
   merges. ST-SUBMITTING keeps the modal alive rather than looking frozen.
6. **Outcome** — `merge.settled` arrives. Delivered, or parked blocked
   with the engine's own reason. Both are shown; neither is summarized
   into "something went wrong".
```

## claim_1d369d57f0c92d6946fd444b3c185ee9

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F02-approve-a-merge.md#unheaded-block-3; lines 22–38; ancestry ["F02 — Approve a merge, end to end","Steps"].
Target: docs/platform/ui-spec/operations/F02-approve-a-merge.md#unheaded-block-5; ancestry ["F02 — Approve a merge, end to end","Steps"].
Source digest: c66607647f3353fc31e1b288c83d8edbac45954da8e277c6615a9f03a4c4550c
Target digest: c66607647f3353fc31e1b288c83d8edbac45954da8e277c6615a9f03a4c4550c
Shown source SHA256: c66607647f3353fc31e1b288c83d8edbac45954da8e277c6615a9f03a4c4550c
Shown target SHA256: c66607647f3353fc31e1b288c83d8edbac45954da8e277c6615a9f03a4c4550c

### Complete proposed decision

```json
{
  "claimId": "claim_1d369d57f0c92d6946fd444b3c185ee9",
  "sourceUnitDigest": "c66607647f3353fc31e1b288c83d8edbac45954da8e277c6615a9f03a4c4550c",
  "targetOwner": "docs/platform/ui-spec/operations/F02-approve-a-merge.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/flows/F02-approve-a-merge.md#unheaded-block-3 (source lines 22-38) is carried at docs/platform/ui-spec/operations/F02-approve-a-merge.md#unheaded-block-5 (candidate lines 44-60). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F02-approve-a-merge.md verbatim in docs/platform/ui-spec/operations/F02-approve-a-merge.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c66607647f3353fc31e1b288c83d8edbac45954da8e277c6615a9f03a4c4550c",
  "targetAncestry": [
    "F02 — Approve a merge, end to end",
    "Steps"
  ]
}
```

### Full source shown text

```text
1. **Land on the taskboard** (S02) — the item sits in the `NEEDS ANSWER`
   group tagged as a gate, because D4 makes a gate-approve question the
   same category to a person as an `ask`.
2. **Open the item** (S03) — the person reads what the agent did, the
   narrative first, machine log collapsed.
3. **Trigger approve** — `Approve merge` in the ACTIONS region, visually
   distinct from `Edit`/`Retire` (R8). If the gateway is not at the
   repository's main working tree, this control is **disabled with the
   reason attached** (ERR-APPROVE-UNAVAILABLE) and the flow stops here,
   honestly, before the person invests any attention.
4. **Confirm** (M02) — what lands, into which branch, which verb runs on
   which machine, and what happens if the re-run verify fails.
5. **Wait** — approve is not instant; the verify re-runs before anything
   merges. ST-SUBMITTING keeps the modal alive rather than looking frozen.
6. **Outcome** — `merge.settled` arrives. Delivered, or parked blocked
   with the engine's own reason. Both are shown; neither is summarized
   into "something went wrong".
```

### Full target shown text

```text
1. **Land on the taskboard** (S02) — the item sits in the `NEEDS ANSWER`
   group tagged as a gate, because D4 makes a gate-approve question the
   same category to a person as an `ask`.
2. **Open the item** (S03) — the person reads what the agent did, the
   narrative first, machine log collapsed.
3. **Trigger approve** — `Approve merge` in the ACTIONS region, visually
   distinct from `Edit`/`Retire` (R8). If the gateway is not at the
   repository's main working tree, this control is **disabled with the
   reason attached** (ERR-APPROVE-UNAVAILABLE) and the flow stops here,
   honestly, before the person invests any attention.
4. **Confirm** (M02) — what lands, into which branch, which verb runs on
   which machine, and what happens if the re-run verify fails.
5. **Wait** — approve is not instant; the verify re-runs before anything
   merges. ST-SUBMITTING keeps the modal alive rather than looking frozen.
6. **Outcome** — `merge.settled` arrives. Delivered, or parked blocked
   with the engine's own reason. Both are shown; neither is summarized
   into "something went wrong".
```

## claim_20574a3ed563c18bcb4429ef021da422

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F02-approve-a-merge.md#branches; lines 40–40; ancestry ["F02 — Approve a merge, end to end"].
Target: docs/platform/ui-spec/operations/F02-approve-a-merge.md#branches; ancestry ["F02 — Approve a merge, end to end"].
Source digest: 0da42a6e808a2622f28dd6d96a2bd6685792bbccf20dae4cc3cee329ca8287f6
Target digest: 0da42a6e808a2622f28dd6d96a2bd6685792bbccf20dae4cc3cee329ca8287f6
Shown source SHA256: 2d9d39c77f6e191282e2df2276af6ade94e1049a6a27c45cc85158e08a65de34
Shown target SHA256: 2d9d39c77f6e191282e2df2276af6ade94e1049a6a27c45cc85158e08a65de34

### Complete proposed decision

```json
{
  "claimId": "claim_20574a3ed563c18bcb4429ef021da422",
  "sourceUnitDigest": "0da42a6e808a2622f28dd6d96a2bd6685792bbccf20dae4cc3cee329ca8287f6",
  "targetOwner": "docs/platform/ui-spec/operations/F02-approve-a-merge.md",
  "targetAnchor": "branches",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/flows/F02-approve-a-merge.md#branches (source lines 40-40) is carried at docs/platform/ui-spec/operations/F02-approve-a-merge.md#branches (candidate lines 62-62). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F02-approve-a-merge.md verbatim in docs/platform/ui-spec/operations/F02-approve-a-merge.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0da42a6e808a2622f28dd6d96a2bd6685792bbccf20dae4cc3cee329ca8287f6",
  "targetAncestry": [
    "F02 — Approve a merge, end to end"
  ]
}
```

### Full source shown text

````text
## Branches

- **Approve cannot run here** — step 3 stops the flow with the reason
  visible. This is the R7 branch, and it is a designed outcome rather
  than a failure.
- **Post-merge verify fails** — the item parks blocked; M02 stays open
  showing the park reason verbatim, so the person is not returned to a
  screen that appears to have done nothing.

```yaml herdrweb-contract
flow:
  goal: "Review and approve a merge from the dashboard, with the trunk consequence stated before confirming"
  preconditions:
    - "an item is awaiting approval"
    - "the gateway runs at the repository's main working tree"
  steps:
    - A-S02-001
    - A-S03-002
    - A-M02-001
  branches:
    - when: "approve cannot run where this gateway sits"
      action: A-S03-009
    - when: "decide not to approve after reading what lands"
      action: A-M02-002
```
````

### Full target shown text

````text
## Branches

- **Approve cannot run here** — step 3 stops the flow with the reason
  visible. This is the R7 branch, and it is a designed outcome rather
  than a failure.
- **Post-merge verify fails** — the item parks blocked; M02 stays open
  showing the park reason verbatim, so the person is not returned to a
  screen that appears to have done nothing.

```yaml herdrweb-contract
flow:
  goal: "Review and approve a merge from the dashboard, with the trunk consequence stated before confirming"
  preconditions:
    - "an item is awaiting approval"
    - "the gateway runs at the repository's main working tree"
  steps:
    - A-S02-001
    - A-S03-002
    - A-M02-001
  branches:
    - when: "approve cannot run where this gateway sits"
      action: A-S03-009
    - when: "decide not to approve after reading what lands"
      action: A-M02-002
```
````

## claim_c4e3bc74cc2ced13097609eb24abd538

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F02-approve-a-merge.md#unheaded-block-4; lines 42–47; ancestry ["F02 — Approve a merge, end to end","Branches"].
Target: docs/platform/ui-spec/operations/F02-approve-a-merge.md#unheaded-block-6; ancestry ["F02 — Approve a merge, end to end","Branches"].
Source digest: bf3e48fb9720dee593a4bdf4ce216773a980635dc50b3a82abfbf94e65c60e04
Target digest: bf3e48fb9720dee593a4bdf4ce216773a980635dc50b3a82abfbf94e65c60e04
Shown source SHA256: bf3e48fb9720dee593a4bdf4ce216773a980635dc50b3a82abfbf94e65c60e04
Shown target SHA256: bf3e48fb9720dee593a4bdf4ce216773a980635dc50b3a82abfbf94e65c60e04

### Complete proposed decision

```json
{
  "claimId": "claim_c4e3bc74cc2ced13097609eb24abd538",
  "sourceUnitDigest": "bf3e48fb9720dee593a4bdf4ce216773a980635dc50b3a82abfbf94e65c60e04",
  "targetOwner": "docs/platform/ui-spec/operations/F02-approve-a-merge.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/flows/F02-approve-a-merge.md#unheaded-block-4 (source lines 42-47) is carried at docs/platform/ui-spec/operations/F02-approve-a-merge.md#unheaded-block-6 (candidate lines 64-69). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F02-approve-a-merge.md verbatim in docs/platform/ui-spec/operations/F02-approve-a-merge.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "bf3e48fb9720dee593a4bdf4ce216773a980635dc50b3a82abfbf94e65c60e04",
  "targetAncestry": [
    "F02 — Approve a merge, end to end",
    "Branches"
  ]
}
```

### Full source shown text

```text
- **Approve cannot run here** — step 3 stops the flow with the reason
  visible. This is the R7 branch, and it is a designed outcome rather
  than a failure.
- **Post-merge verify fails** — the item parks blocked; M02 stays open
  showing the park reason verbatim, so the person is not returned to a
  screen that appears to have done nothing.
```

### Full target shown text

```text
- **Approve cannot run here** — step 3 stops the flow with the reason
  visible. This is the R7 branch, and it is a designed outcome rather
  than a failure.
- **Post-merge verify fails** — the item parks blocked; M02 stays open
  showing the park reason verbatim, so the person is not returned to a
  screen that appears to have done nothing.
```

## claim_0bdecaf6bb7f4c5d03d4dd32edd6e372

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F02-approve-a-merge.md#unheaded-block-5; lines 49–64; ancestry ["F02 — Approve a merge, end to end","Branches"].
Target: docs/platform/ui-spec/operations/F02-approve-a-merge.md#unheaded-block-7; ancestry ["F02 — Approve a merge, end to end","Branches"].
Source digest: f9712966a2963770e4d52613d18e2d66e61d803e2f24661f7b860ef640e35224
Target digest: f9712966a2963770e4d52613d18e2d66e61d803e2f24661f7b860ef640e35224
Shown source SHA256: f9712966a2963770e4d52613d18e2d66e61d803e2f24661f7b860ef640e35224
Shown target SHA256: f9712966a2963770e4d52613d18e2d66e61d803e2f24661f7b860ef640e35224

### Complete proposed decision

```json
{
  "claimId": "claim_0bdecaf6bb7f4c5d03d4dd32edd6e372",
  "sourceUnitDigest": "f9712966a2963770e4d52613d18e2d66e61d803e2f24661f7b860ef640e35224",
  "targetOwner": "docs/platform/ui-spec/operations/F02-approve-a-merge.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/flows/F02-approve-a-merge.md#unheaded-block-5 (source lines 49-64) is carried at docs/platform/ui-spec/operations/F02-approve-a-merge.md#unheaded-block-7 (candidate lines 71-86). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F02-approve-a-merge.md verbatim in docs/platform/ui-spec/operations/F02-approve-a-merge.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f9712966a2963770e4d52613d18e2d66e61d803e2f24661f7b860ef640e35224",
  "targetAncestry": [
    "F02 — Approve a merge, end to end",
    "Branches"
  ]
}
```

### Full source shown text

````text
```yaml herdrweb-contract
flow:
  goal: "Review and approve a merge from the dashboard, with the trunk consequence stated before confirming"
  preconditions:
    - "an item is awaiting approval"
    - "the gateway runs at the repository's main working tree"
  steps:
    - A-S02-001
    - A-S03-002
    - A-M02-001
  branches:
    - when: "approve cannot run where this gateway sits"
      action: A-S03-009
    - when: "decide not to approve after reading what lands"
      action: A-M02-002
```
````

### Full target shown text

````text
```yaml herdrweb-contract
flow:
  goal: "Review and approve a merge from the dashboard, with the trunk consequence stated before confirming"
  preconditions:
    - "an item is awaiting approval"
    - "the gateway runs at the repository's main working tree"
  steps:
    - A-S02-001
    - A-S03-002
    - A-M02-001
  branches:
    - when: "approve cannot run where this gateway sits"
      action: A-S03-009
    - when: "decide not to approve after reading what lands"
      action: A-M02-002
```
````
