# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/modals/M02-approve-merge.md
Part 1/1; entries: **12**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 5/5 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_4c9a110f623532bc7d83fdf6f547093e",
      "claim_6c1cdb570e57b0c547e768903d487ca1",
      "claim_b0824e0cd564f4705e50da13b6780123",
      "claim_3048b1128d4d98dc6ee07aba2324c3b8",
      "claim_af451e04d9d67d144a3557b2403a3842",
      "claim_8078baf6ee718f1be4d482c2f303e62d",
      "claim_c6659cd7ed74e445fe099f5236551cb7"
    ],
    "Weak-exact": [
      "claim_d940a673245e4f5b3145c8b545ce299c",
      "claim_00353fead06bdc3f8468690a63df4aa7",
      "claim_4734588af7752f05c0f3fd9b0ce531da",
      "claim_64fd7dcc92d75c4ea35fc85e3b0bf0e4"
    ],
    "Judgment": [
      "claim_ae961815f238b5b8335b08e8b21662ee"
    ]
  },
  "unequalDigestPairs": [
    "claim_ae961815f238b5b8335b08e8b21662ee"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_ae961815f238b5b8335b08e8b21662ee"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_4c9a110f623532bc7d83fdf6f547093e

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M02-approve-merge.md#unheaded-block-1; lines 1–11; ancestry [].
Target: docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#unheaded-block-1; ancestry [].
Source digest: 633382525da36aece4691ddcee98749217ae3c1281c0e6f6792ead72327c67ab
Target digest: 633382525da36aece4691ddcee98749217ae3c1281c0e6f6792ead72327c67ab
Shown source SHA256: 633382525da36aece4691ddcee98749217ae3c1281c0e6f6792ead72327c67ab
Shown target SHA256: 633382525da36aece4691ddcee98749217ae3c1281c0e6f6792ead72327c67ab

### Complete proposed decision

```json
{
  "claimId": "claim_4c9a110f623532bc7d83fdf6f547093e",
  "sourceUnitDigest": "633382525da36aece4691ddcee98749217ae3c1281c0e6f6792ead72327c67ab",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M02-approve-merge.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/ui-spec/modals/M02-approve-merge.md#unheaded-block-1 (source lines 1-11) is carried at docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#unheaded-block-1 (candidate lines 1-11). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M02-approve-merge.md verbatim in docs/platform/ui-spec/architecture/modals/M02-approve-merge.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "633382525da36aece4691ddcee98749217ae3c1281c0e6f6792ead72327c67ab",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
id: M02
type: modal
name: "Approve a merge"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R2, R7, R8]
regions: [header, what_lands, consequence, footer]
---
```

### Full target shown text

```text
---
id: M02
type: modal
name: "Approve a merge"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R2, R7, R8]
regions: [header, what_lands, consequence, footer]
---
```

## claim_ae961815f238b5b8335b08e8b21662ee

Class: Judgment; mandatory deep: true.
Source: docs/ui-spec/modals/M02-approve-merge.md#m02-approve-a-merge; lines 13–13; ancestry [].
Target: docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#m02-approve-a-merge; ancestry [].
Source digest: 8b0400b48431739d1b32132719d5521bb15195b481e9dd99c3a7c7055c83d2e7
Target digest: 4ec2fd0d0b267020695e0142a23f26aae54497ae1e92e0390750d3c50e23ec32
Shown source SHA256: 06ec5c6ce8936ba449a364ebe33a138afa339b9e701153ac2acd550ac03988bf
Shown target SHA256: 1b8c2f7dc1b4fa173a74eed5111b8e5df8fe76916cd3bd587dbd5496a5d4583e

### Complete proposed decision

```json
{
  "claimId": "claim_ae961815f238b5b8335b08e8b21662ee",
  "sourceUnitDigest": "8b0400b48431739d1b32132719d5521bb15195b481e9dd99c3a7c7055c83d2e7",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M02-approve-merge.md",
  "targetAnchor": "m02-approve-a-merge",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/ui-spec/modals/M02-approve-merge.md#m02-approve-a-merge (source lines 13-13) is carried at docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#m02-approve-a-merge (candidate lines 13-13). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M02-approve-merge.md verbatim in docs/platform/ui-spec/architecture/modals/M02-approve-merge.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "4ec2fd0d0b267020695e0142a23f26aae54497ae1e92e0390750d3c50e23ec32",
  "targetAncestry": []
}
```

### Full source shown text

```text
# M02 — Approve a merge
```

### Full target shown text

````text
# M02 — Approve a merge

```txt
Document type: Architecture
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/modals/M02-approve-merge.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/ui-spec/modals/M02-approve-merge.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.
````

## claim_d940a673245e4f5b3145c8b545ce299c

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M02-approve-merge.md#purpose; lines 15–15; ancestry ["M02 — Approve a merge"].
Target: docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#purpose; ancestry ["M02 — Approve a merge"].
Source digest: a900f08ce9335e018bcac1c24e3a3e5a244891ac9bd2a537680d6a60825f92d3
Target digest: a900f08ce9335e018bcac1c24e3a3e5a244891ac9bd2a537680d6a60825f92d3
Shown source SHA256: 0a8b51ed03609ef236e9f59e876a4bfe992e2ac1ad0000e9ed06eff8bdca4c91
Shown target SHA256: 0a8b51ed03609ef236e9f59e876a4bfe992e2ac1ad0000e9ed06eff8bdca4c91

### Complete proposed decision

```json
{
  "claimId": "claim_d940a673245e4f5b3145c8b545ce299c",
  "sourceUnitDigest": "a900f08ce9335e018bcac1c24e3a3e5a244891ac9bd2a537680d6a60825f92d3",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M02-approve-merge.md",
  "targetAnchor": "purpose",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/modals/M02-approve-merge.md#purpose (source lines 15-15) is carried at docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#purpose (candidate lines 37-37). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M02-approve-merge.md verbatim in docs/platform/ui-spec/architecture/modals/M02-approve-merge.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "a900f08ce9335e018bcac1c24e3a3e5a244891ac9bd2a537680d6a60825f92d3",
  "targetAncestry": [
    "M02 — Approve a merge"
  ]
}
```

### Full source shown text

```text
## Purpose

Confirm and run the one operation on this client that changes trunk
(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its
own modal, rather than an inline button, precisely because of R8: a person
must never change trunk by muscle memory.
```

### Full target shown text

```text
## Purpose

Confirm and run the one operation on this client that changes trunk
(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its
own modal, rather than an inline button, precisely because of R8: a person
must never change trunk by muscle memory.
```

## claim_6c1cdb570e57b0c547e768903d487ca1

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M02-approve-merge.md#unheaded-block-2; lines 17–20; ancestry ["M02 — Approve a merge","Purpose"].
Target: docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#unheaded-block-4; ancestry ["M02 — Approve a merge","Purpose"].
Source digest: 16d1f15d8e32929635905282f55e305e296b5b158c7e85eb03afe669b45ef526
Target digest: 16d1f15d8e32929635905282f55e305e296b5b158c7e85eb03afe669b45ef526
Shown source SHA256: 16d1f15d8e32929635905282f55e305e296b5b158c7e85eb03afe669b45ef526
Shown target SHA256: 16d1f15d8e32929635905282f55e305e296b5b158c7e85eb03afe669b45ef526

### Complete proposed decision

```json
{
  "claimId": "claim_6c1cdb570e57b0c547e768903d487ca1",
  "sourceUnitDigest": "16d1f15d8e32929635905282f55e305e296b5b158c7e85eb03afe669b45ef526",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M02-approve-merge.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M02-approve-merge.md#unheaded-block-2 (source lines 17-20) is carried at docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#unheaded-block-4 (candidate lines 39-42). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M02-approve-merge.md verbatim in docs/platform/ui-spec/architecture/modals/M02-approve-merge.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "16d1f15d8e32929635905282f55e305e296b5b158c7e85eb03afe669b45ef526",
  "targetAncestry": [
    "M02 — Approve a merge",
    "Purpose"
  ]
}
```

### Full source shown text

```text
Confirm and run the one operation on this client that changes trunk
(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its
own modal, rather than an inline button, precisely because of R8: a person
must never change trunk by muscle memory.
```

### Full target shown text

```text
Confirm and run the one operation on this client that changes trunk
(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its
own modal, rather than an inline button, precisely because of R8: a person
must never change trunk by muscle memory.
```

## claim_00353fead06bdc3f8468690a63df4aa7

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M02-approve-merge.md#layout; lines 22–22; ancestry ["M02 — Approve a merge"].
Target: docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#layout; ancestry ["M02 — Approve a merge"].
Source digest: 1f9bd3f97bba3865c620ce5b309166ef121aedb0a8432e2d141a53cae2821370
Target digest: 1f9bd3f97bba3865c620ce5b309166ef121aedb0a8432e2d141a53cae2821370
Shown source SHA256: 93502818d3633061ec762407ac7f7162c3905fbbf2c690a416d75c2a019532c1
Shown target SHA256: 93502818d3633061ec762407ac7f7162c3905fbbf2c690a416d75c2a019532c1

### Complete proposed decision

```json
{
  "claimId": "claim_00353fead06bdc3f8468690a63df4aa7",
  "sourceUnitDigest": "1f9bd3f97bba3865c620ce5b309166ef121aedb0a8432e2d141a53cae2821370",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M02-approve-merge.md",
  "targetAnchor": "layout",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/modals/M02-approve-merge.md#layout (source lines 22-22) is carried at docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#layout (candidate lines 44-44). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M02-approve-merge.md verbatim in docs/platform/ui-spec/architecture/modals/M02-approve-merge.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "1f9bd3f97bba3865c620ce5b309166ef121aedb0a8432e2d141a53cae2821370",
  "targetAncestry": [
    "M02 — Approve a merge"
  ]
}
```

### Full source shown text

````text
## Layout

```
┌────────────────────────────────────────────────────┐
│ Approve merge · tsk-k4v                       [✕]  │  header
├────────────────────────────────────────────────────┤
│ What lands                                         │  what_lands
│ 6 files, +412 / −18                                │
│ into  fgw/tsk-ldb                                  │
│                                                    │
│ herdr-plugin/src/web/mod.rs                        │
│ herdr-plugin/src/web/auth.rs                       │
│ … 4 more                                           │
├────────────────────────────────────────────────────┤
│ This changes trunk.                                │  consequence
│ Runs `fgos approve` on dev-box. The item's own     │
│ verify runs again first; if it fails the item      │
│ parks blocked instead of merging.                  │
├────────────────────────────────────────────────────┤
│                        [ Cancel ]  [ Approve merge ]│ footer
└────────────────────────────────────────────────────┘
```

The consequence panel is not a warning banner to be skimmed — it states
three specific facts (what verb, on which machine, and what happens if
verify fails) so that confirming is an informed act rather than a reflex.

**Where approve cannot run, this modal never opens.** R7 puts the
constraint on the invoking control instead: `Approve merge` on S03 renders
disabled with the reason attached (ERR-APPROVE-UNAVAILABLE). Offering the
modal and failing at submit would be exactly the offered-then-failed
pattern the area spec rules out.
````

### Full target shown text

````text
## Layout

```
┌────────────────────────────────────────────────────┐
│ Approve merge · tsk-k4v                       [✕]  │  header
├────────────────────────────────────────────────────┤
│ What lands                                         │  what_lands
│ 6 files, +412 / −18                                │
│ into  fgw/tsk-ldb                                  │
│                                                    │
│ herdr-plugin/src/web/mod.rs                        │
│ herdr-plugin/src/web/auth.rs                       │
│ … 4 more                                           │
├────────────────────────────────────────────────────┤
│ This changes trunk.                                │  consequence
│ Runs `fgos approve` on dev-box. The item's own     │
│ verify runs again first; if it fails the item      │
│ parks blocked instead of merging.                  │
├────────────────────────────────────────────────────┤
│                        [ Cancel ]  [ Approve merge ]│ footer
└────────────────────────────────────────────────────┘
```

The consequence panel is not a warning banner to be skimmed — it states
three specific facts (what verb, on which machine, and what happens if
verify fails) so that confirming is an informed act rather than a reflex.

**Where approve cannot run, this modal never opens.** R7 puts the
constraint on the invoking control instead: `Approve merge` on S03 renders
disabled with the reason attached (ERR-APPROVE-UNAVAILABLE). Offering the
modal and failing at submit would be exactly the offered-then-failed
pattern the area spec rules out.
````

## claim_b0824e0cd564f4705e50da13b6780123

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M02-approve-merge.md#unheaded-block-3; lines 24–43; ancestry ["M02 — Approve a merge","Layout"].
Target: docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#unheaded-block-5; ancestry ["M02 — Approve a merge","Layout"].
Source digest: 3ac787a95b4671add2b27b1d4cc92720e884bef5507314bd6e2b1ac5610397d2
Target digest: 3ac787a95b4671add2b27b1d4cc92720e884bef5507314bd6e2b1ac5610397d2
Shown source SHA256: 3ac787a95b4671add2b27b1d4cc92720e884bef5507314bd6e2b1ac5610397d2
Shown target SHA256: 3ac787a95b4671add2b27b1d4cc92720e884bef5507314bd6e2b1ac5610397d2

### Complete proposed decision

```json
{
  "claimId": "claim_b0824e0cd564f4705e50da13b6780123",
  "sourceUnitDigest": "3ac787a95b4671add2b27b1d4cc92720e884bef5507314bd6e2b1ac5610397d2",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M02-approve-merge.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M02-approve-merge.md#unheaded-block-3 (source lines 24-43) is carried at docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#unheaded-block-5 (candidate lines 46-65). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M02-approve-merge.md verbatim in docs/platform/ui-spec/architecture/modals/M02-approve-merge.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3ac787a95b4671add2b27b1d4cc92720e884bef5507314bd6e2b1ac5610397d2",
  "targetAncestry": [
    "M02 — Approve a merge",
    "Layout"
  ]
}
```

### Full source shown text

````text
```
┌────────────────────────────────────────────────────┐
│ Approve merge · tsk-k4v                       [✕]  │  header
├────────────────────────────────────────────────────┤
│ What lands                                         │  what_lands
│ 6 files, +412 / −18                                │
│ into  fgw/tsk-ldb                                  │
│                                                    │
│ herdr-plugin/src/web/mod.rs                        │
│ herdr-plugin/src/web/auth.rs                       │
│ … 4 more                                           │
├────────────────────────────────────────────────────┤
│ This changes trunk.                                │  consequence
│ Runs `fgos approve` on dev-box. The item's own     │
│ verify runs again first; if it fails the item      │
│ parks blocked instead of merging.                  │
├────────────────────────────────────────────────────┤
│                        [ Cancel ]  [ Approve merge ]│ footer
└────────────────────────────────────────────────────┘
```
````

### Full target shown text

````text
```
┌────────────────────────────────────────────────────┐
│ Approve merge · tsk-k4v                       [✕]  │  header
├────────────────────────────────────────────────────┤
│ What lands                                         │  what_lands
│ 6 files, +412 / −18                                │
│ into  fgw/tsk-ldb                                  │
│                                                    │
│ herdr-plugin/src/web/mod.rs                        │
│ herdr-plugin/src/web/auth.rs                       │
│ … 4 more                                           │
├────────────────────────────────────────────────────┤
│ This changes trunk.                                │  consequence
│ Runs `fgos approve` on dev-box. The item's own     │
│ verify runs again first; if it fails the item      │
│ parks blocked instead of merging.                  │
├────────────────────────────────────────────────────┤
│                        [ Cancel ]  [ Approve merge ]│ footer
└────────────────────────────────────────────────────┘
```
````

## claim_3048b1128d4d98dc6ee07aba2324c3b8

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M02-approve-merge.md#unheaded-block-4; lines 45–47; ancestry ["M02 — Approve a merge","Layout"].
Target: docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#unheaded-block-6; ancestry ["M02 — Approve a merge","Layout"].
Source digest: a94a6123d5be3a892e593e2a46c81eff3b372cecd11436fa4316fa9b220d0e11
Target digest: a94a6123d5be3a892e593e2a46c81eff3b372cecd11436fa4316fa9b220d0e11
Shown source SHA256: a94a6123d5be3a892e593e2a46c81eff3b372cecd11436fa4316fa9b220d0e11
Shown target SHA256: a94a6123d5be3a892e593e2a46c81eff3b372cecd11436fa4316fa9b220d0e11

### Complete proposed decision

```json
{
  "claimId": "claim_3048b1128d4d98dc6ee07aba2324c3b8",
  "sourceUnitDigest": "a94a6123d5be3a892e593e2a46c81eff3b372cecd11436fa4316fa9b220d0e11",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M02-approve-merge.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M02-approve-merge.md#unheaded-block-4 (source lines 45-47) is carried at docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#unheaded-block-6 (candidate lines 67-69). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M02-approve-merge.md verbatim in docs/platform/ui-spec/architecture/modals/M02-approve-merge.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "a94a6123d5be3a892e593e2a46c81eff3b372cecd11436fa4316fa9b220d0e11",
  "targetAncestry": [
    "M02 — Approve a merge",
    "Layout"
  ]
}
```

### Full source shown text

```text
The consequence panel is not a warning banner to be skimmed — it states
three specific facts (what verb, on which machine, and what happens if
verify fails) so that confirming is an informed act rather than a reflex.
```

### Full target shown text

```text
The consequence panel is not a warning banner to be skimmed — it states
three specific facts (what verb, on which machine, and what happens if
verify fails) so that confirming is an informed act rather than a reflex.
```

## claim_af451e04d9d67d144a3557b2403a3842

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M02-approve-merge.md#unheaded-block-5; lines 49–53; ancestry ["M02 — Approve a merge","Layout"].
Target: docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#unheaded-block-7; ancestry ["M02 — Approve a merge","Layout"].
Source digest: dea3561c21d91935bd45492ef13274f2fcb98ce353514227b12dc4c81a4077e4
Target digest: dea3561c21d91935bd45492ef13274f2fcb98ce353514227b12dc4c81a4077e4
Shown source SHA256: dea3561c21d91935bd45492ef13274f2fcb98ce353514227b12dc4c81a4077e4
Shown target SHA256: dea3561c21d91935bd45492ef13274f2fcb98ce353514227b12dc4c81a4077e4

### Complete proposed decision

```json
{
  "claimId": "claim_af451e04d9d67d144a3557b2403a3842",
  "sourceUnitDigest": "dea3561c21d91935bd45492ef13274f2fcb98ce353514227b12dc4c81a4077e4",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M02-approve-merge.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M02-approve-merge.md#unheaded-block-5 (source lines 49-53) is carried at docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#unheaded-block-7 (candidate lines 71-75). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M02-approve-merge.md verbatim in docs/platform/ui-spec/architecture/modals/M02-approve-merge.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "dea3561c21d91935bd45492ef13274f2fcb98ce353514227b12dc4c81a4077e4",
  "targetAncestry": [
    "M02 — Approve a merge",
    "Layout"
  ]
}
```

### Full source shown text

```text
**Where approve cannot run, this modal never opens.** R7 puts the
constraint on the invoking control instead: `Approve merge` on S03 renders
disabled with the reason attached (ERR-APPROVE-UNAVAILABLE). Offering the
modal and failing at submit would be exactly the offered-then-failed
pattern the area spec rules out.
```

### Full target shown text

```text
**Where approve cannot run, this modal never opens.** R7 puts the
constraint on the invoking control instead: `Approve merge` on S03 renders
disabled with the reason attached (ERR-APPROVE-UNAVAILABLE). Offering the
modal and failing at submit would be exactly the offered-then-failed
pattern the area spec rules out.
```

## claim_4734588af7752f05c0f3fd9b0ce531da

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M02-approve-merge.md#states; lines 55–55; ancestry ["M02 — Approve a merge"].
Target: docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#states; ancestry ["M02 — Approve a merge"].
Source digest: 3fa89c4bcc1fa4ce08b6dda0fb96488d20612826c14e719d4db536cb6766140d
Target digest: 3fa89c4bcc1fa4ce08b6dda0fb96488d20612826c14e719d4db536cb6766140d
Shown source SHA256: 0be602cff85dc19a6f1bd9d010bdc288201c5a1ddc9ecd9e1ac3e1e4c5dc34fc
Shown target SHA256: 0be602cff85dc19a6f1bd9d010bdc288201c5a1ddc9ecd9e1ac3e1e4c5dc34fc

### Complete proposed decision

```json
{
  "claimId": "claim_4734588af7752f05c0f3fd9b0ce531da",
  "sourceUnitDigest": "3fa89c4bcc1fa4ce08b6dda0fb96488d20612826c14e719d4db536cb6766140d",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M02-approve-merge.md",
  "targetAnchor": "states",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/modals/M02-approve-merge.md#states (source lines 55-55) is carried at docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#states (candidate lines 77-77). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M02-approve-merge.md verbatim in docs/platform/ui-spec/architecture/modals/M02-approve-merge.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3fa89c4bcc1fa4ce08b6dda0fb96488d20612826c14e719d4db536cb6766140d",
  "targetAncestry": [
    "M02 — Approve a merge"
  ]
}
```

### Full source shown text

```text
## States

- **ST-READY** — the diff summary and target branch are loaded.
- **ST-SUBMITTING** — approve in flight; both buttons disabled, progress
  on the approve button. This one is not instant, and the modal must not
  look frozen while the verify re-runs.
- **ERR-WRITE-REFUSED** — fgOS refused or the post-merge verify failed and
  the item parked blocked. The engine's own outcome is shown verbatim,
  including the park reason, and the modal stays open so the person reads
  it rather than being dropped back to a screen that silently did nothing.
```

### Full target shown text

```text
## States

- **ST-READY** — the diff summary and target branch are loaded.
- **ST-SUBMITTING** — approve in flight; both buttons disabled, progress
  on the approve button. This one is not instant, and the modal must not
  look frozen while the verify re-runs.
- **ERR-WRITE-REFUSED** — fgOS refused or the post-merge verify failed and
  the item parked blocked. The engine's own outcome is shown verbatim,
  including the park reason, and the modal stays open so the person reads
  it rather than being dropped back to a screen that silently did nothing.
```

## claim_8078baf6ee718f1be4d482c2f303e62d

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M02-approve-merge.md#unheaded-block-6; lines 57–64; ancestry ["M02 — Approve a merge","States"].
Target: docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#unheaded-block-8; ancestry ["M02 — Approve a merge","States"].
Source digest: adfe80ad864fe0a34219ab5c5201ed1e2423f5ab7ebd0e8b2ec9fdf7c0dab091
Target digest: adfe80ad864fe0a34219ab5c5201ed1e2423f5ab7ebd0e8b2ec9fdf7c0dab091
Shown source SHA256: adfe80ad864fe0a34219ab5c5201ed1e2423f5ab7ebd0e8b2ec9fdf7c0dab091
Shown target SHA256: adfe80ad864fe0a34219ab5c5201ed1e2423f5ab7ebd0e8b2ec9fdf7c0dab091

### Complete proposed decision

```json
{
  "claimId": "claim_8078baf6ee718f1be4d482c2f303e62d",
  "sourceUnitDigest": "adfe80ad864fe0a34219ab5c5201ed1e2423f5ab7ebd0e8b2ec9fdf7c0dab091",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M02-approve-merge.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M02-approve-merge.md#unheaded-block-6 (source lines 57-64) is carried at docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#unheaded-block-8 (candidate lines 79-86). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M02-approve-merge.md verbatim in docs/platform/ui-spec/architecture/modals/M02-approve-merge.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "adfe80ad864fe0a34219ab5c5201ed1e2423f5ab7ebd0e8b2ec9fdf7c0dab091",
  "targetAncestry": [
    "M02 — Approve a merge",
    "States"
  ]
}
```

### Full source shown text

```text
- **ST-READY** — the diff summary and target branch are loaded.
- **ST-SUBMITTING** — approve in flight; both buttons disabled, progress
  on the approve button. This one is not instant, and the modal must not
  look frozen while the verify re-runs.
- **ERR-WRITE-REFUSED** — fgOS refused or the post-merge verify failed and
  the item parked blocked. The engine's own outcome is shown verbatim,
  including the park reason, and the modal stays open so the person reads
  it rather than being dropped back to a screen that silently did nothing.
```

### Full target shown text

```text
- **ST-READY** — the diff summary and target branch are loaded.
- **ST-SUBMITTING** — approve in flight; both buttons disabled, progress
  on the approve button. This one is not instant, and the modal must not
  look frozen while the verify re-runs.
- **ERR-WRITE-REFUSED** — fgOS refused or the post-merge verify failed and
  the item parked blocked. The engine's own outcome is shown verbatim,
  including the park reason, and the modal stays open so the person reads
  it rather than being dropped back to a screen that silently did nothing.
```

## claim_64fd7dcc92d75c4ea35fc85e3b0bf0e4

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M02-approve-merge.md#interactions; lines 66–66; ancestry ["M02 — Approve a merge"].
Target: docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#interactions; ancestry ["M02 — Approve a merge"].
Source digest: 02c34309f74a28101722d3bf5d0e6c0f2fb7f3f6965cb299eb1e75435ebe0e29
Target digest: 02c34309f74a28101722d3bf5d0e6c0f2fb7f3f6965cb299eb1e75435ebe0e29
Shown source SHA256: 370d0318283806c7226294856571a3ad407734174ec0a473ec4c1310143bf461
Shown target SHA256: 370d0318283806c7226294856571a3ad407734174ec0a473ec4c1310143bf461

### Complete proposed decision

```json
{
  "claimId": "claim_64fd7dcc92d75c4ea35fc85e3b0bf0e4",
  "sourceUnitDigest": "02c34309f74a28101722d3bf5d0e6c0f2fb7f3f6965cb299eb1e75435ebe0e29",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M02-approve-merge.md",
  "targetAnchor": "interactions",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/modals/M02-approve-merge.md#interactions (source lines 66-66) is carried at docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#interactions (candidate lines 88-88). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M02-approve-merge.md verbatim in docs/platform/ui-spec/architecture/modals/M02-approve-merge.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "02c34309f74a28101722d3bf5d0e6c0f2fb7f3f6965cb299eb1e75435ebe0e29",
  "targetAncestry": [
    "M02 — Approve a merge"
  ]
}
```

### Full source shown text

````text
## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-M02-001
    element: approve_merge_button
    region: footer
    trigger: submit
    guard: "gateway.atMainWorkingTree"
    action: close_overlay
    target: return_to_invoker
    effects: [run_fgos_approve_verb]
  - id: A-M02-002
    element: cancel_button
    region: footer
    trigger: click
    action: close_overlay
    target: return_to_invoker
  - id: A-M02-003
    element: close_icon
    region: header
    trigger: click
    action: close_overlay
    target: return_to_invoker
```
````

### Full target shown text

````text
## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-M02-001
    element: approve_merge_button
    region: footer
    trigger: submit
    guard: "gateway.atMainWorkingTree"
    action: close_overlay
    target: return_to_invoker
    effects: [run_fgos_approve_verb]
  - id: A-M02-002
    element: cancel_button
    region: footer
    trigger: click
    action: close_overlay
    target: return_to_invoker
  - id: A-M02-003
    element: close_icon
    region: header
    trigger: click
    action: close_overlay
    target: return_to_invoker
```
````

## claim_c6659cd7ed74e445fe099f5236551cb7

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M02-approve-merge.md#unheaded-block-7; lines 68–90; ancestry ["M02 — Approve a merge","Interactions"].
Target: docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#unheaded-block-9; ancestry ["M02 — Approve a merge","Interactions"].
Source digest: 5cc68620a8b0811fa889b25ab1c46d45a394835254085bd439000aaff59b0fa6
Target digest: 5cc68620a8b0811fa889b25ab1c46d45a394835254085bd439000aaff59b0fa6
Shown source SHA256: 5cc68620a8b0811fa889b25ab1c46d45a394835254085bd439000aaff59b0fa6
Shown target SHA256: 5cc68620a8b0811fa889b25ab1c46d45a394835254085bd439000aaff59b0fa6

### Complete proposed decision

```json
{
  "claimId": "claim_c6659cd7ed74e445fe099f5236551cb7",
  "sourceUnitDigest": "5cc68620a8b0811fa889b25ab1c46d45a394835254085bd439000aaff59b0fa6",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M02-approve-merge.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M02-approve-merge.md#unheaded-block-7 (source lines 68-90) is carried at docs/platform/ui-spec/architecture/modals/M02-approve-merge.md#unheaded-block-9 (candidate lines 90-112). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M02-approve-merge.md verbatim in docs/platform/ui-spec/architecture/modals/M02-approve-merge.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "5cc68620a8b0811fa889b25ab1c46d45a394835254085bd439000aaff59b0fa6",
  "targetAncestry": [
    "M02 — Approve a merge",
    "Interactions"
  ]
}
```

### Full source shown text

````text
```yaml herdrweb-contract
interactions:
  - id: A-M02-001
    element: approve_merge_button
    region: footer
    trigger: submit
    guard: "gateway.atMainWorkingTree"
    action: close_overlay
    target: return_to_invoker
    effects: [run_fgos_approve_verb]
  - id: A-M02-002
    element: cancel_button
    region: footer
    trigger: click
    action: close_overlay
    target: return_to_invoker
  - id: A-M02-003
    element: close_icon
    region: header
    trigger: click
    action: close_overlay
    target: return_to_invoker
```
````

### Full target shown text

````text
```yaml herdrweb-contract
interactions:
  - id: A-M02-001
    element: approve_merge_button
    region: footer
    trigger: submit
    guard: "gateway.atMainWorkingTree"
    action: close_overlay
    target: return_to_invoker
    effects: [run_fgos_approve_verb]
  - id: A-M02-002
    element: cancel_button
    region: footer
    trigger: click
    action: close_overlay
    target: return_to_invoker
  - id: A-M02-003
    element: close_icon
    region: header
    trigger: click
    action: close_overlay
    target: return_to_invoker
```
````
