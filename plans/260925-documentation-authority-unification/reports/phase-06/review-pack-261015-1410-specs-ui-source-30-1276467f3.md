# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/screens/S01-sign-in.md
Part 1/1; entries: **14**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 5/5 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_7967889d10d6af36a4fb383045b65a96",
      "claim_3a04f4e739420cfc63f7fc90ee9d868e",
      "claim_ee445ed3633ffaf1046847c22af0fb7f",
      "claim_c114e4da6a0aa74dd6d6a4908b558893",
      "claim_c5c6c48bbd8baba4da9c0a46b757e1c6",
      "claim_cd456a28153788805cf7c6ebccf02f81",
      "claim_d233fa65d860141b65898ec00d944180",
      "claim_45d619262877e3606c6434a80eac0ea7",
      "claim_66959db8980be9e2431a5436b0acdb21"
    ],
    "Weak-exact": [
      "claim_bba819e1574e95eb1c661ad4e65b52d7",
      "claim_7eb4d4508811b2fea52a5a0b1ca60f6b",
      "claim_39f417443d65ce04f112c932f2293375",
      "claim_3bd0f8ba521d2a8972d6e44b78002bc3"
    ],
    "Judgment": [
      "claim_6cbca8eed8cc0595110b6b1bc8f0db80"
    ]
  },
  "unequalDigestPairs": [
    "claim_6cbca8eed8cc0595110b6b1bc8f0db80"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_6cbca8eed8cc0595110b6b1bc8f0db80"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_7967889d10d6af36a4fb383045b65a96

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S01-sign-in.md#unheaded-block-1; lines 1–11; ancestry [].
Target: docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-1; ancestry [].
Source digest: 77c1514fc17688374acb9a7a09ff5183257acf2a5c56401588c5c0d55052b99f
Target digest: 77c1514fc17688374acb9a7a09ff5183257acf2a5c56401588c5c0d55052b99f
Shown source SHA256: 77c1514fc17688374acb9a7a09ff5183257acf2a5c56401588c5c0d55052b99f
Shown target SHA256: 77c1514fc17688374acb9a7a09ff5183257acf2a5c56401588c5c0d55052b99f

### Complete proposed decision

```json
{
  "claimId": "claim_7967889d10d6af36a4fb383045b65a96",
  "sourceUnitDigest": "77c1514fc17688374acb9a7a09ff5183257acf2a5c56401588c5c0d55052b99f",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S01-sign-in.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/ui-spec/screens/S01-sign-in.md#unheaded-block-1 (source lines 1-11) is carried at docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-1 (candidate lines 1-11). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S01-sign-in.md verbatim in docs/platform/ui-spec/architecture/screens/S01-sign-in.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "77c1514fc17688374acb9a7a09ff5183257acf2a5c56401588c5c0d55052b99f",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
id: S01
type: screen
name: "Sign in"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R3, R4, R6]
regions: [brand, form, footnote]
---
```

### Full target shown text

```text
---
id: S01
type: screen
name: "Sign in"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R3, R4, R6]
regions: [brand, form, footnote]
---
```

## claim_6cbca8eed8cc0595110b6b1bc8f0db80

Class: Judgment; mandatory deep: true.
Source: docs/ui-spec/screens/S01-sign-in.md#s01-sign-in; lines 13–13; ancestry [].
Target: docs/platform/ui-spec/architecture/screens/S01-sign-in.md#s01-sign-in; ancestry [].
Source digest: 129d0e0a74bb924b506fd2652519a2b2d3efa83bd2818944b7c9b55236250146
Target digest: 55c57e558e6986ee134114e366b1ded489d53cf59522508214ef3244020bb46a
Shown source SHA256: 84368f728eccd6c0eccbcf8ea9fef4008e28f7fb1263d404c8a0289a8bae962c
Shown target SHA256: 596f2057e21e6de89e13b8438ec3d4574240063c51fee283b1267c68cc4aa403

### Complete proposed decision

```json
{
  "claimId": "claim_6cbca8eed8cc0595110b6b1bc8f0db80",
  "sourceUnitDigest": "129d0e0a74bb924b506fd2652519a2b2d3efa83bd2818944b7c9b55236250146",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S01-sign-in.md",
  "targetAnchor": "s01-sign-in",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/ui-spec/screens/S01-sign-in.md#s01-sign-in (source lines 13-13) is carried at docs/platform/ui-spec/architecture/screens/S01-sign-in.md#s01-sign-in (candidate lines 13-13). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S01-sign-in.md verbatim in docs/platform/ui-spec/architecture/screens/S01-sign-in.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "55c57e558e6986ee134114e366b1ded489d53cf59522508214ef3244020bb46a",
  "targetAncestry": []
}
```

### Full source shown text

```text
# S01 — Sign in
```

### Full target shown text

````text
# S01 — Sign in

```txt
Document type: Architecture
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/screens/S01-sign-in.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/ui-spec/screens/S01-sign-in.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.
````

## claim_bba819e1574e95eb1c661ad4e65b52d7

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S01-sign-in.md#purpose; lines 15–15; ancestry ["S01 — Sign in"].
Target: docs/platform/ui-spec/architecture/screens/S01-sign-in.md#purpose; ancestry ["S01 — Sign in"].
Source digest: dfb50996e4d6dd9f7668e8e6e4a51cd7f239e7d3550efc895cdfa1e34ef40679
Target digest: dfb50996e4d6dd9f7668e8e6e4a51cd7f239e7d3550efc895cdfa1e34ef40679
Shown source SHA256: b5bdf958af9112f7fb7ce997314e1dbf8544ddca36e9a64a95b08c4205ea30bf
Shown target SHA256: b5bdf958af9112f7fb7ce997314e1dbf8544ddca36e9a64a95b08c4205ea30bf

### Complete proposed decision

```json
{
  "claimId": "claim_bba819e1574e95eb1c661ad4e65b52d7",
  "sourceUnitDigest": "dfb50996e4d6dd9f7668e8e6e4a51cd7f239e7d3550efc895cdfa1e34ef40679",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S01-sign-in.md",
  "targetAnchor": "purpose",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S01-sign-in.md#purpose (source lines 15-15) is carried at docs/platform/ui-spec/architecture/screens/S01-sign-in.md#purpose (candidate lines 37-37). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S01-sign-in.md verbatim in docs/platform/ui-spec/architecture/screens/S01-sign-in.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "dfb50996e4d6dd9f7668e8e6e4a51cd7f239e7d3550efc895cdfa1e34ef40679",
  "targetAncestry": [
    "S01 — Sign in"
  ]
}
```

### Full source shown text

```text
## Purpose

The first and only door. Nothing on this client is readable before it
(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one
credential — the machine's token — and exchange it for a session.

Designed for the origin case: a phone, one-handed, at a moment when no
cockpit terminal is open. So the form is one field, the field is the
focus, and there is nothing else to read or decide.
```

### Full target shown text

```text
## Purpose

The first and only door. Nothing on this client is readable before it
(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one
credential — the machine's token — and exchange it for a session.

Designed for the origin case: a phone, one-handed, at a moment when no
cockpit terminal is open. So the form is one field, the field is the
focus, and there is nothing else to read or decide.
```

## claim_3a04f4e739420cfc63f7fc90ee9d868e

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S01-sign-in.md#unheaded-block-2; lines 17–19; ancestry ["S01 — Sign in","Purpose"].
Target: docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-4; ancestry ["S01 — Sign in","Purpose"].
Source digest: 0beef4d2245a0124917db86d62ab32535b8d692d87092579891e6263a4565f04
Target digest: 0beef4d2245a0124917db86d62ab32535b8d692d87092579891e6263a4565f04
Shown source SHA256: 0beef4d2245a0124917db86d62ab32535b8d692d87092579891e6263a4565f04
Shown target SHA256: 0beef4d2245a0124917db86d62ab32535b8d692d87092579891e6263a4565f04

### Complete proposed decision

```json
{
  "claimId": "claim_3a04f4e739420cfc63f7fc90ee9d868e",
  "sourceUnitDigest": "0beef4d2245a0124917db86d62ab32535b8d692d87092579891e6263a4565f04",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S01-sign-in.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S01-sign-in.md#unheaded-block-2 (source lines 17-19) is carried at docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-4 (candidate lines 39-41). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S01-sign-in.md verbatim in docs/platform/ui-spec/architecture/screens/S01-sign-in.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0beef4d2245a0124917db86d62ab32535b8d692d87092579891e6263a4565f04",
  "targetAncestry": [
    "S01 — Sign in",
    "Purpose"
  ]
}
```

### Full source shown text

```text
The first and only door. Nothing on this client is readable before it
(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one
credential — the machine's token — and exchange it for a session.
```

### Full target shown text

```text
The first and only door. Nothing on this client is readable before it
(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one
credential — the machine's token — and exchange it for a session.
```

## claim_ee445ed3633ffaf1046847c22af0fb7f

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S01-sign-in.md#unheaded-block-3; lines 21–23; ancestry ["S01 — Sign in","Purpose"].
Target: docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-5; ancestry ["S01 — Sign in","Purpose"].
Source digest: ea5525c5b2864c0c8bb3de1d5af8e2533672b46433909f40dd3664a49ca805ef
Target digest: ea5525c5b2864c0c8bb3de1d5af8e2533672b46433909f40dd3664a49ca805ef
Shown source SHA256: ea5525c5b2864c0c8bb3de1d5af8e2533672b46433909f40dd3664a49ca805ef
Shown target SHA256: ea5525c5b2864c0c8bb3de1d5af8e2533672b46433909f40dd3664a49ca805ef

### Complete proposed decision

```json
{
  "claimId": "claim_ee445ed3633ffaf1046847c22af0fb7f",
  "sourceUnitDigest": "ea5525c5b2864c0c8bb3de1d5af8e2533672b46433909f40dd3664a49ca805ef",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S01-sign-in.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S01-sign-in.md#unheaded-block-3 (source lines 21-23) is carried at docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-5 (candidate lines 43-45). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S01-sign-in.md verbatim in docs/platform/ui-spec/architecture/screens/S01-sign-in.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ea5525c5b2864c0c8bb3de1d5af8e2533672b46433909f40dd3664a49ca805ef",
  "targetAncestry": [
    "S01 — Sign in",
    "Purpose"
  ]
}
```

### Full source shown text

```text
Designed for the origin case: a phone, one-handed, at a moment when no
cockpit terminal is open. So the form is one field, the field is the
focus, and there is nothing else to read or decide.
```

### Full target shown text

```text
Designed for the origin case: a phone, one-handed, at a moment when no
cockpit terminal is open. So the form is one field, the field is the
focus, and there is nothing else to read or decide.
```

## claim_7eb4d4508811b2fea52a5a0b1ca60f6b

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S01-sign-in.md#layout; lines 25–25; ancestry ["S01 — Sign in"].
Target: docs/platform/ui-spec/architecture/screens/S01-sign-in.md#layout; ancestry ["S01 — Sign in"].
Source digest: 225d6cada78ff281f42012629d520aa2fd16e54a943a884653b295cde65f8bca
Target digest: 225d6cada78ff281f42012629d520aa2fd16e54a943a884653b295cde65f8bca
Shown source SHA256: 854393e65b519bc845ae96ec1bc205713e7d2f81284e6eaf070084954ae24e47
Shown target SHA256: 854393e65b519bc845ae96ec1bc205713e7d2f81284e6eaf070084954ae24e47

### Complete proposed decision

```json
{
  "claimId": "claim_7eb4d4508811b2fea52a5a0b1ca60f6b",
  "sourceUnitDigest": "225d6cada78ff281f42012629d520aa2fd16e54a943a884653b295cde65f8bca",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S01-sign-in.md",
  "targetAnchor": "layout",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S01-sign-in.md#layout (source lines 25-25) is carried at docs/platform/ui-spec/architecture/screens/S01-sign-in.md#layout (candidate lines 47-47). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S01-sign-in.md verbatim in docs/platform/ui-spec/architecture/screens/S01-sign-in.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "225d6cada78ff281f42012629d520aa2fd16e54a943a884653b295cde65f8bca",
  "targetAncestry": [
    "S01 — Sign in"
  ]
}
```

### Full source shown text

````text
## Layout

```
┌──────────────────────────────────────┐
│                                      │
│              herdr                   │  brand
│         fgOS work dashboard          │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Access token                   │  │  form
│  │ ┌────────────────────────────┐ │  │
│  │ │ ••••••••••••••••••••••••   │ │  │
│  │ └────────────────────────────┘ │  │
│  │                                │  │
│  │ [        Sign in         ]     │  │
│  │                                │  │
│  │  Sign-in failed.               │  │  (ERR-AUTH, one message only)
│  └────────────────────────────────┘  │
│                                      │
│  Reachable beyond this machine.      │  footnote
│                                      │
└──────────────────────────────────────┘
```

Mobile is the same layout at full width — there is nothing to reflow. The
token field uses a password-type input so a shoulder-surfer on a train
sees nothing, and so the browser does not offer to autofill it into
unrelated forms.
````

### Full target shown text

````text
## Layout

```
┌──────────────────────────────────────┐
│                                      │
│              herdr                   │  brand
│         fgOS work dashboard          │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Access token                   │  │  form
│  │ ┌────────────────────────────┐ │  │
│  │ │ ••••••••••••••••••••••••   │ │  │
│  │ └────────────────────────────┘ │  │
│  │                                │  │
│  │ [        Sign in         ]     │  │
│  │                                │  │
│  │  Sign-in failed.               │  │  (ERR-AUTH, one message only)
│  └────────────────────────────────┘  │
│                                      │
│  Reachable beyond this machine.      │  footnote
│                                      │
└──────────────────────────────────────┘
```

Mobile is the same layout at full width — there is nothing to reflow. The
token field uses a password-type input so a shoulder-surfer on a train
sees nothing, and so the browser does not offer to autofill it into
unrelated forms.
````

## claim_c114e4da6a0aa74dd6d6a4908b558893

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S01-sign-in.md#unheaded-block-4; lines 27–47; ancestry ["S01 — Sign in","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-6; ancestry ["S01 — Sign in","Layout"].
Source digest: 4fcd1b19835c8541752a8db0350ae5bf1912cea6549777cfbbf4020dea6146fe
Target digest: 4fcd1b19835c8541752a8db0350ae5bf1912cea6549777cfbbf4020dea6146fe
Shown source SHA256: 4fcd1b19835c8541752a8db0350ae5bf1912cea6549777cfbbf4020dea6146fe
Shown target SHA256: 4fcd1b19835c8541752a8db0350ae5bf1912cea6549777cfbbf4020dea6146fe

### Complete proposed decision

```json
{
  "claimId": "claim_c114e4da6a0aa74dd6d6a4908b558893",
  "sourceUnitDigest": "4fcd1b19835c8541752a8db0350ae5bf1912cea6549777cfbbf4020dea6146fe",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S01-sign-in.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S01-sign-in.md#unheaded-block-4 (source lines 27-47) is carried at docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-6 (candidate lines 49-69). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S01-sign-in.md verbatim in docs/platform/ui-spec/architecture/screens/S01-sign-in.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "4fcd1b19835c8541752a8db0350ae5bf1912cea6549777cfbbf4020dea6146fe",
  "targetAncestry": [
    "S01 — Sign in",
    "Layout"
  ]
}
```

### Full source shown text

````text
```
┌──────────────────────────────────────┐
│                                      │
│              herdr                   │  brand
│         fgOS work dashboard          │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Access token                   │  │  form
│  │ ┌────────────────────────────┐ │  │
│  │ │ ••••••••••••••••••••••••   │ │  │
│  │ └────────────────────────────┘ │  │
│  │                                │  │
│  │ [        Sign in         ]     │  │
│  │                                │  │
│  │  Sign-in failed.               │  │  (ERR-AUTH, one message only)
│  └────────────────────────────────┘  │
│                                      │
│  Reachable beyond this machine.      │  footnote
│                                      │
└──────────────────────────────────────┘
```
````

### Full target shown text

````text
```
┌──────────────────────────────────────┐
│                                      │
│              herdr                   │  brand
│         fgOS work dashboard          │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Access token                   │  │  form
│  │ ┌────────────────────────────┐ │  │
│  │ │ ••••••••••••••••••••••••   │ │  │
│  │ └────────────────────────────┘ │  │
│  │                                │  │
│  │ [        Sign in         ]     │  │
│  │                                │  │
│  │  Sign-in failed.               │  │  (ERR-AUTH, one message only)
│  └────────────────────────────────┘  │
│                                      │
│  Reachable beyond this machine.      │  footnote
│                                      │
└──────────────────────────────────────┘
```
````

## claim_c5c6c48bbd8baba4da9c0a46b757e1c6

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S01-sign-in.md#unheaded-block-5; lines 49–52; ancestry ["S01 — Sign in","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-7; ancestry ["S01 — Sign in","Layout"].
Source digest: 52e625daaea2d5fd48b3b9d4d436367a94d665c43b3f5902b377280ec9f265ec
Target digest: 52e625daaea2d5fd48b3b9d4d436367a94d665c43b3f5902b377280ec9f265ec
Shown source SHA256: 52e625daaea2d5fd48b3b9d4d436367a94d665c43b3f5902b377280ec9f265ec
Shown target SHA256: 52e625daaea2d5fd48b3b9d4d436367a94d665c43b3f5902b377280ec9f265ec

### Complete proposed decision

```json
{
  "claimId": "claim_c5c6c48bbd8baba4da9c0a46b757e1c6",
  "sourceUnitDigest": "52e625daaea2d5fd48b3b9d4d436367a94d665c43b3f5902b377280ec9f265ec",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S01-sign-in.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S01-sign-in.md#unheaded-block-5 (source lines 49-52) is carried at docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-7 (candidate lines 71-74). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S01-sign-in.md verbatim in docs/platform/ui-spec/architecture/screens/S01-sign-in.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "52e625daaea2d5fd48b3b9d4d436367a94d665c43b3f5902b377280ec9f265ec",
  "targetAncestry": [
    "S01 — Sign in",
    "Layout"
  ]
}
```

### Full source shown text

```text
Mobile is the same layout at full width — there is nothing to reflow. The
token field uses a password-type input so a shoulder-surfer on a train
sees nothing, and so the browser does not offer to autofill it into
unrelated forms.
```

### Full target shown text

```text
Mobile is the same layout at full width — there is nothing to reflow. The
token field uses a password-type input so a shoulder-surfer on a train
sees nothing, and so the browser does not offer to autofill it into
unrelated forms.
```

## claim_39f417443d65ce04f112c932f2293375

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S01-sign-in.md#states; lines 54–54; ancestry ["S01 — Sign in"].
Target: docs/platform/ui-spec/architecture/screens/S01-sign-in.md#states; ancestry ["S01 — Sign in"].
Source digest: 9f2473dea651d71ca83df5c9284357798640160bfa24b7b10d8c3e47547e5133
Target digest: 9f2473dea651d71ca83df5c9284357798640160bfa24b7b10d8c3e47547e5133
Shown source SHA256: e4b489206d575ab065144ebf331182901db0fce0dc58fc249d6246b9225fdb93
Shown target SHA256: e4b489206d575ab065144ebf331182901db0fce0dc58fc249d6246b9225fdb93

### Complete proposed decision

```json
{
  "claimId": "claim_39f417443d65ce04f112c932f2293375",
  "sourceUnitDigest": "9f2473dea651d71ca83df5c9284357798640160bfa24b7b10d8c3e47547e5133",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S01-sign-in.md",
  "targetAnchor": "states",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S01-sign-in.md#states (source lines 54-54) is carried at docs/platform/ui-spec/architecture/screens/S01-sign-in.md#states (candidate lines 76-76). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S01-sign-in.md verbatim in docs/platform/ui-spec/architecture/screens/S01-sign-in.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "9f2473dea651d71ca83df5c9284357798640160bfa24b7b10d8c3e47547e5133",
  "targetAncestry": [
    "S01 — Sign in"
  ]
}
```

### Full source shown text

```text
## States

- **ST-READY** — empty field, focused, submit disabled until non-empty.
- **ST-SUBMITTING** — submit shows progress; the field stays visible but
  read-only.
- **ERR-AUTH** — one message, always the same words, no matter the cause.
  This is R3 rendered: the screen must not become an oracle that tells an
  attacker which half of their guess was right.

Three things this screen never does, each one a rule:

- never shows the token back, never writes it anywhere but the request,
  never keeps it after the session cookie exists (R4);
- never says "open the cockpit first" — the dashboard's availability does
  not depend on a terminal being open (R6);
- never offers "remember me" as a way to skip the door.
```

### Full target shown text

```text
## States

- **ST-READY** — empty field, focused, submit disabled until non-empty.
- **ST-SUBMITTING** — submit shows progress; the field stays visible but
  read-only.
- **ERR-AUTH** — one message, always the same words, no matter the cause.
  This is R3 rendered: the screen must not become an oracle that tells an
  attacker which half of their guess was right.

Three things this screen never does, each one a rule:

- never shows the token back, never writes it anywhere but the request,
  never keeps it after the session cookie exists (R4);
- never says "open the cockpit first" — the dashboard's availability does
  not depend on a terminal being open (R6);
- never offers "remember me" as a way to skip the door.
```

## claim_cd456a28153788805cf7c6ebccf02f81

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S01-sign-in.md#unheaded-block-6; lines 56–61; ancestry ["S01 — Sign in","States"].
Target: docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-8; ancestry ["S01 — Sign in","States"].
Source digest: a8ec43d1ca3cd4b07dce61b718332c537db2909bfcfe32c41a4e0223f97d3f64
Target digest: a8ec43d1ca3cd4b07dce61b718332c537db2909bfcfe32c41a4e0223f97d3f64
Shown source SHA256: a8ec43d1ca3cd4b07dce61b718332c537db2909bfcfe32c41a4e0223f97d3f64
Shown target SHA256: a8ec43d1ca3cd4b07dce61b718332c537db2909bfcfe32c41a4e0223f97d3f64

### Complete proposed decision

```json
{
  "claimId": "claim_cd456a28153788805cf7c6ebccf02f81",
  "sourceUnitDigest": "a8ec43d1ca3cd4b07dce61b718332c537db2909bfcfe32c41a4e0223f97d3f64",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S01-sign-in.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S01-sign-in.md#unheaded-block-6 (source lines 56-61) is carried at docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-8 (candidate lines 78-83). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S01-sign-in.md verbatim in docs/platform/ui-spec/architecture/screens/S01-sign-in.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "a8ec43d1ca3cd4b07dce61b718332c537db2909bfcfe32c41a4e0223f97d3f64",
  "targetAncestry": [
    "S01 — Sign in",
    "States"
  ]
}
```

### Full source shown text

```text
- **ST-READY** — empty field, focused, submit disabled until non-empty.
- **ST-SUBMITTING** — submit shows progress; the field stays visible but
  read-only.
- **ERR-AUTH** — one message, always the same words, no matter the cause.
  This is R3 rendered: the screen must not become an oracle that tells an
  attacker which half of their guess was right.
```

### Full target shown text

```text
- **ST-READY** — empty field, focused, submit disabled until non-empty.
- **ST-SUBMITTING** — submit shows progress; the field stays visible but
  read-only.
- **ERR-AUTH** — one message, always the same words, no matter the cause.
  This is R3 rendered: the screen must not become an oracle that tells an
  attacker which half of their guess was right.
```

## claim_d233fa65d860141b65898ec00d944180

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S01-sign-in.md#unheaded-block-7; lines 63–63; ancestry ["S01 — Sign in","States"].
Target: docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-9; ancestry ["S01 — Sign in","States"].
Source digest: 6c01f258d2d51d91bfb53840c1568640183da8669c640df98bc0a0999c5d28b7
Target digest: 6c01f258d2d51d91bfb53840c1568640183da8669c640df98bc0a0999c5d28b7
Shown source SHA256: 6c01f258d2d51d91bfb53840c1568640183da8669c640df98bc0a0999c5d28b7
Shown target SHA256: 6c01f258d2d51d91bfb53840c1568640183da8669c640df98bc0a0999c5d28b7

### Complete proposed decision

```json
{
  "claimId": "claim_d233fa65d860141b65898ec00d944180",
  "sourceUnitDigest": "6c01f258d2d51d91bfb53840c1568640183da8669c640df98bc0a0999c5d28b7",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S01-sign-in.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S01-sign-in.md#unheaded-block-7 (source lines 63-63) is carried at docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-9 (candidate lines 85-85). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S01-sign-in.md verbatim in docs/platform/ui-spec/architecture/screens/S01-sign-in.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6c01f258d2d51d91bfb53840c1568640183da8669c640df98bc0a0999c5d28b7",
  "targetAncestry": [
    "S01 — Sign in",
    "States"
  ]
}
```

### Full source shown text

```text
Three things this screen never does, each one a rule:
```

### Full target shown text

```text
Three things this screen never does, each one a rule:
```

## claim_45d619262877e3606c6434a80eac0ea7

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S01-sign-in.md#unheaded-block-8; lines 65–69; ancestry ["S01 — Sign in","States"].
Target: docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-10; ancestry ["S01 — Sign in","States"].
Source digest: d30b7cd79d3cf89c5ab75507209b4bde9ac4646cb248f3fdd5ef19e3935895c3
Target digest: d30b7cd79d3cf89c5ab75507209b4bde9ac4646cb248f3fdd5ef19e3935895c3
Shown source SHA256: d30b7cd79d3cf89c5ab75507209b4bde9ac4646cb248f3fdd5ef19e3935895c3
Shown target SHA256: d30b7cd79d3cf89c5ab75507209b4bde9ac4646cb248f3fdd5ef19e3935895c3

### Complete proposed decision

```json
{
  "claimId": "claim_45d619262877e3606c6434a80eac0ea7",
  "sourceUnitDigest": "d30b7cd79d3cf89c5ab75507209b4bde9ac4646cb248f3fdd5ef19e3935895c3",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S01-sign-in.md",
  "targetAnchor": "unheaded-block-10",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S01-sign-in.md#unheaded-block-8 (source lines 65-69) is carried at docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-10 (candidate lines 87-91). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S01-sign-in.md verbatim in docs/platform/ui-spec/architecture/screens/S01-sign-in.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "d30b7cd79d3cf89c5ab75507209b4bde9ac4646cb248f3fdd5ef19e3935895c3",
  "targetAncestry": [
    "S01 — Sign in",
    "States"
  ]
}
```

### Full source shown text

```text
- never shows the token back, never writes it anywhere but the request,
  never keeps it after the session cookie exists (R4);
- never says "open the cockpit first" — the dashboard's availability does
  not depend on a terminal being open (R6);
- never offers "remember me" as a way to skip the door.
```

### Full target shown text

```text
- never shows the token back, never writes it anywhere but the request,
  never keeps it after the session cookie exists (R4);
- never says "open the cockpit first" — the dashboard's availability does
  not depend on a terminal being open (R6);
- never offers "remember me" as a way to skip the door.
```

## claim_3bd0f8ba521d2a8972d6e44b78002bc3

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S01-sign-in.md#interactions; lines 71–71; ancestry ["S01 — Sign in"].
Target: docs/platform/ui-spec/architecture/screens/S01-sign-in.md#interactions; ancestry ["S01 — Sign in"].
Source digest: 895f6a966aea555382214e9031cb9bd8e62d4c1782ad7bb3abe348c7deee2d07
Target digest: 895f6a966aea555382214e9031cb9bd8e62d4c1782ad7bb3abe348c7deee2d07
Shown source SHA256: 7b2b5c0494790b95e6a9c5a90adff04878280bef7a2275aad35be22c329c4400
Shown target SHA256: 7b2b5c0494790b95e6a9c5a90adff04878280bef7a2275aad35be22c329c4400

### Complete proposed decision

```json
{
  "claimId": "claim_3bd0f8ba521d2a8972d6e44b78002bc3",
  "sourceUnitDigest": "895f6a966aea555382214e9031cb9bd8e62d4c1782ad7bb3abe348c7deee2d07",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S01-sign-in.md",
  "targetAnchor": "interactions",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S01-sign-in.md#interactions (source lines 71-71) is carried at docs/platform/ui-spec/architecture/screens/S01-sign-in.md#interactions (candidate lines 93-93). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S01-sign-in.md verbatim in docs/platform/ui-spec/architecture/screens/S01-sign-in.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "895f6a966aea555382214e9031cb9bd8e62d4c1782ad7bb3abe348c7deee2d07",
  "targetAncestry": [
    "S01 — Sign in"
  ]
}
```

### Full source shown text

````text
## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-S01-001
    element: token_field
    region: form
    trigger: input
    action: mutate
    effects: [enable_submit_when_non_empty]
  - id: A-S01-002
    element: sign_in_button
    region: form
    trigger: submit
    guard: "token.nonEmpty"
    action: navigate
    target: S02
    effects: [establish_session, clear_token_from_memory]
```
````

### Full target shown text

````text
## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-S01-001
    element: token_field
    region: form
    trigger: input
    action: mutate
    effects: [enable_submit_when_non_empty]
  - id: A-S01-002
    element: sign_in_button
    region: form
    trigger: submit
    guard: "token.nonEmpty"
    action: navigate
    target: S02
    effects: [establish_session, clear_token_from_memory]
```
````

## claim_66959db8980be9e2431a5436b0acdb21

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S01-sign-in.md#unheaded-block-9; lines 73–89; ancestry ["S01 — Sign in","Interactions"].
Target: docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-11; ancestry ["S01 — Sign in","Interactions"].
Source digest: 432201863dab2e41ba63bca951a1c5906c41ce90fe0ff2c4328e371b5df345f5
Target digest: 432201863dab2e41ba63bca951a1c5906c41ce90fe0ff2c4328e371b5df345f5
Shown source SHA256: 432201863dab2e41ba63bca951a1c5906c41ce90fe0ff2c4328e371b5df345f5
Shown target SHA256: 432201863dab2e41ba63bca951a1c5906c41ce90fe0ff2c4328e371b5df345f5

### Complete proposed decision

```json
{
  "claimId": "claim_66959db8980be9e2431a5436b0acdb21",
  "sourceUnitDigest": "432201863dab2e41ba63bca951a1c5906c41ce90fe0ff2c4328e371b5df345f5",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S01-sign-in.md",
  "targetAnchor": "unheaded-block-11",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S01-sign-in.md#unheaded-block-9 (source lines 73-89) is carried at docs/platform/ui-spec/architecture/screens/S01-sign-in.md#unheaded-block-11 (candidate lines 95-111). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S01-sign-in.md verbatim in docs/platform/ui-spec/architecture/screens/S01-sign-in.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "432201863dab2e41ba63bca951a1c5906c41ce90fe0ff2c4328e371b5df345f5",
  "targetAncestry": [
    "S01 — Sign in",
    "Interactions"
  ]
}
```

### Full source shown text

````text
```yaml herdrweb-contract
interactions:
  - id: A-S01-001
    element: token_field
    region: form
    trigger: input
    action: mutate
    effects: [enable_submit_when_non_empty]
  - id: A-S01-002
    element: sign_in_button
    region: form
    trigger: submit
    guard: "token.nonEmpty"
    action: navigate
    target: S02
    effects: [establish_session, clear_token_from_memory]
```
````

### Full target shown text

````text
```yaml herdrweb-contract
interactions:
  - id: A-S01-001
    element: token_field
    region: form
    trigger: input
    action: mutate
    effects: [enable_submit_when_non_empty]
  - id: A-S01-002
    element: sign_in_button
    region: form
    trigger: submit
    guard: "token.nonEmpty"
    action: navigate
    target: S02
    effects: [establish_session, clear_token_from_memory]
```
````
