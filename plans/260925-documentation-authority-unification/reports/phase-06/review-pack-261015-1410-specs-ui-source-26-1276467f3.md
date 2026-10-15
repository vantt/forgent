# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/modals/M01-answer-question.md
Part 1/1; entries: **11**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 5/5 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_95276218caefe2d0e64ea8a6587912de",
      "claim_8d83aa2a13a65753ed3087531808f771",
      "claim_81e60ba98c086609376e50fcde631003",
      "claim_46d2aa894a82bd4231e161abc1de795a",
      "claim_5ff80d2788c64645819e4747c97586f3",
      "claim_89e1dad5a298dcd9a584cf7e436b07c8"
    ],
    "Weak-exact": [
      "claim_7f3fff01ea50761fe1f33e54e1009dd5",
      "claim_57b00d818bf1ae24871c4bf3d2d75b79",
      "claim_2fca593fd29799a98ecb961e2bc31189",
      "claim_42511baf61c8603df6dfa984707d7c02"
    ],
    "Judgment": [
      "claim_2904d9efd9dfa41ef624c3cde4680773"
    ]
  },
  "unequalDigestPairs": [
    "claim_2904d9efd9dfa41ef624c3cde4680773"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_2904d9efd9dfa41ef624c3cde4680773"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_95276218caefe2d0e64ea8a6587912de

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M01-answer-question.md#unheaded-block-1; lines 1–11; ancestry [].
Target: docs/platform/ui-spec/architecture/modals/M01-answer-question.md#unheaded-block-1; ancestry [].
Source digest: 95fdfa2f1dfd4e34740fa261aaff32166299e3d447945559ef8b9a7743d75ecc
Target digest: 95fdfa2f1dfd4e34740fa261aaff32166299e3d447945559ef8b9a7743d75ecc
Shown source SHA256: 95fdfa2f1dfd4e34740fa261aaff32166299e3d447945559ef8b9a7743d75ecc
Shown target SHA256: 95fdfa2f1dfd4e34740fa261aaff32166299e3d447945559ef8b9a7743d75ecc

### Complete proposed decision

```json
{
  "claimId": "claim_95276218caefe2d0e64ea8a6587912de",
  "sourceUnitDigest": "95fdfa2f1dfd4e34740fa261aaff32166299e3d447945559ef8b9a7743d75ecc",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M01-answer-question.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/ui-spec/modals/M01-answer-question.md#unheaded-block-1 (source lines 1-11) is carried at docs/platform/ui-spec/architecture/modals/M01-answer-question.md#unheaded-block-1 (candidate lines 1-11). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M01-answer-question.md verbatim in docs/platform/ui-spec/architecture/modals/M01-answer-question.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "95fdfa2f1dfd4e34740fa261aaff32166299e3d447945559ef8b9a7743d75ecc",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
id: M01
type: modal
name: "Answer a parked question"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R2]
regions: [header, question_recap, answer_form, footer]
---
```

### Full target shown text

```text
---
id: M01
type: modal
name: "Answer a parked question"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R2]
regions: [header, question_recap, answer_form, footer]
---
```

## claim_2904d9efd9dfa41ef624c3cde4680773

Class: Judgment; mandatory deep: true.
Source: docs/ui-spec/modals/M01-answer-question.md#m01-answer-a-parked-question; lines 13–13; ancestry [].
Target: docs/platform/ui-spec/architecture/modals/M01-answer-question.md#m01-answer-a-parked-question; ancestry [].
Source digest: b0be3ec5e702722306f7db73f1405c08748705d4c3771b01583f2f0c0daa4ba7
Target digest: 84bef4adbd1d83ced73c9bd250861843f6d12d4fe70e65d87761cff233686498
Shown source SHA256: 774b742113a0de2bdd2d79b252da8094c56af9cac427b2f2aab1c3884da9995c
Shown target SHA256: fda9d49c8468b6c115490292a5bbb2011b0622bcc1d8ff345a68a43a0fb058aa

### Complete proposed decision

```json
{
  "claimId": "claim_2904d9efd9dfa41ef624c3cde4680773",
  "sourceUnitDigest": "b0be3ec5e702722306f7db73f1405c08748705d4c3771b01583f2f0c0daa4ba7",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M01-answer-question.md",
  "targetAnchor": "m01-answer-a-parked-question",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/ui-spec/modals/M01-answer-question.md#m01-answer-a-parked-question (source lines 13-13) is carried at docs/platform/ui-spec/architecture/modals/M01-answer-question.md#m01-answer-a-parked-question (candidate lines 13-13). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M01-answer-question.md verbatim in docs/platform/ui-spec/architecture/modals/M01-answer-question.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "84bef4adbd1d83ced73c9bd250861843f6d12d4fe70e65d87761cff233686498",
  "targetAncestry": []
}
```

### Full source shown text

```text
# M01 — Answer a parked question
```

### Full target shown text

````text
# M01 — Answer a parked question

```txt
Document type: Architecture
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/modals/M01-answer-question.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/ui-spec/modals/M01-answer-question.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.
````

## claim_7f3fff01ea50761fe1f33e54e1009dd5

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M01-answer-question.md#purpose; lines 15–15; ancestry ["M01 — Answer a parked question"].
Target: docs/platform/ui-spec/architecture/modals/M01-answer-question.md#purpose; ancestry ["M01 — Answer a parked question"].
Source digest: 59a831ae0edbf02969fdc01ec8a458ad4bf2f082b585938edca18fc6641e9df6
Target digest: 59a831ae0edbf02969fdc01ec8a458ad4bf2f082b585938edca18fc6641e9df6
Shown source SHA256: c2240a1e5a1a97807dff0f420b73c7e5c4c0c87423f8896a72b64c289a86d91d
Shown target SHA256: c2240a1e5a1a97807dff0f420b73c7e5c4c0c87423f8896a72b64c289a86d91d

### Complete proposed decision

```json
{
  "claimId": "claim_7f3fff01ea50761fe1f33e54e1009dd5",
  "sourceUnitDigest": "59a831ae0edbf02969fdc01ec8a458ad4bf2f082b585938edca18fc6641e9df6",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M01-answer-question.md",
  "targetAnchor": "purpose",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/modals/M01-answer-question.md#purpose (source lines 15-15) is carried at docs/platform/ui-spec/architecture/modals/M01-answer-question.md#purpose (candidate lines 37-37). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M01-answer-question.md verbatim in docs/platform/ui-spec/architecture/modals/M01-answer-question.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "59a831ae0edbf02969fdc01ec8a458ad4bf2f082b585938edca18fc6641e9df6",
  "targetAncestry": [
    "M01 — Answer a parked question"
  ]
}
```

### Full source shown text

```text
## Purpose

Submit an answer **in place**, without sending the person to a terminal.
The area spec settles this explicitly: the gateway already runs fgOS write
verbs on a client's behalf and `answer` is named among them, so linking
out to the CLI would contradict the contract this client is written
against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question).
```

### Full target shown text

```text
## Purpose

Submit an answer **in place**, without sending the person to a terminal.
The area spec settles this explicitly: the gateway already runs fgOS write
verbs on a client's behalf and `answer` is named among them, so linking
out to the CLI would contradict the contract this client is written
against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question).
```

## claim_8d83aa2a13a65753ed3087531808f771

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M01-answer-question.md#unheaded-block-2; lines 17–21; ancestry ["M01 — Answer a parked question","Purpose"].
Target: docs/platform/ui-spec/architecture/modals/M01-answer-question.md#unheaded-block-4; ancestry ["M01 — Answer a parked question","Purpose"].
Source digest: 0e19234fb7746212577c283341625672fb296ec9f7459dd55d7c65196a872ac4
Target digest: 0e19234fb7746212577c283341625672fb296ec9f7459dd55d7c65196a872ac4
Shown source SHA256: 0e19234fb7746212577c283341625672fb296ec9f7459dd55d7c65196a872ac4
Shown target SHA256: 0e19234fb7746212577c283341625672fb296ec9f7459dd55d7c65196a872ac4

### Complete proposed decision

```json
{
  "claimId": "claim_8d83aa2a13a65753ed3087531808f771",
  "sourceUnitDigest": "0e19234fb7746212577c283341625672fb296ec9f7459dd55d7c65196a872ac4",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M01-answer-question.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M01-answer-question.md#unheaded-block-2 (source lines 17-21) is carried at docs/platform/ui-spec/architecture/modals/M01-answer-question.md#unheaded-block-4 (candidate lines 39-43). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M01-answer-question.md verbatim in docs/platform/ui-spec/architecture/modals/M01-answer-question.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0e19234fb7746212577c283341625672fb296ec9f7459dd55d7c65196a872ac4",
  "targetAncestry": [
    "M01 — Answer a parked question",
    "Purpose"
  ]
}
```

### Full source shown text

```text
Submit an answer **in place**, without sending the person to a terminal.
The area spec settles this explicitly: the gateway already runs fgOS write
verbs on a client's behalf and `answer` is named among them, so linking
out to the CLI would contradict the contract this client is written
against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question).
```

### Full target shown text

```text
Submit an answer **in place**, without sending the person to a terminal.
The area spec settles this explicitly: the gateway already runs fgOS write
verbs on a client's behalf and `answer` is named among them, so linking
out to the CLI would contradict the contract this client is written
against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question).
```

## claim_57b00d818bf1ae24871c4bf3d2d75b79

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M01-answer-question.md#layout; lines 23–23; ancestry ["M01 — Answer a parked question"].
Target: docs/platform/ui-spec/architecture/modals/M01-answer-question.md#layout; ancestry ["M01 — Answer a parked question"].
Source digest: c2120985caf351f1ff6195e63d8723699bf5b23f2ea05a0d929501dbca458ff8
Target digest: c2120985caf351f1ff6195e63d8723699bf5b23f2ea05a0d929501dbca458ff8
Shown source SHA256: b4d266c16dd62015b3cb063370bf9874a811d570b5eb01411c3b65f2ca3b5a44
Shown target SHA256: b4d266c16dd62015b3cb063370bf9874a811d570b5eb01411c3b65f2ca3b5a44

### Complete proposed decision

```json
{
  "claimId": "claim_57b00d818bf1ae24871c4bf3d2d75b79",
  "sourceUnitDigest": "c2120985caf351f1ff6195e63d8723699bf5b23f2ea05a0d929501dbca458ff8",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M01-answer-question.md",
  "targetAnchor": "layout",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/modals/M01-answer-question.md#layout (source lines 23-23) is carried at docs/platform/ui-spec/architecture/modals/M01-answer-question.md#layout (candidate lines 45-45). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M01-answer-question.md verbatim in docs/platform/ui-spec/architecture/modals/M01-answer-question.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c2120985caf351f1ff6195e63d8723699bf5b23f2ea05a0d929501dbca458ff8",
  "targetAncestry": [
    "M01 — Answer a parked question"
  ]
}
```

### Full source shown text

````text
## Layout

```
┌────────────────────────────────────────────────────┐
│ Answer · tsk-4id                              [✕]  │  header
├────────────────────────────────────────────────────┤
│ Which pairing key should the timeline use when     │  question_recap
│ askHistory and settlements have drifted by one?    │
│                                                    │
│ Why you're being asked                             │
│ Two options still standing; D2 added no linking    │
│ key. Tried: read D2, ran pairing on tsk-48i.       │
├────────────────────────────────────────────────────┤
│ Your answer                                        │  answer_form
│ ┌────────────────────────────────────────────────┐ │
│ │                                                │ │
│ │                                                │ │
│ └────────────────────────────────────────────────┘ │
│ Goes through `fgos answer`.                        │
├────────────────────────────────────────────────────┤
│                          [ Cancel ]  [ Send answer ]│ footer
└────────────────────────────────────────────────────┘
```

The question is repeated inside the modal, with its "why", so a person
answering on a phone never has to dismiss the modal to re-read what they
are answering. The footnote naming the verb is not decoration — R2 says
every write maps to one one-door-write verb, and showing which one is how
a person knows what they are actually about to do.
````

### Full target shown text

````text
## Layout

```
┌────────────────────────────────────────────────────┐
│ Answer · tsk-4id                              [✕]  │  header
├────────────────────────────────────────────────────┤
│ Which pairing key should the timeline use when     │  question_recap
│ askHistory and settlements have drifted by one?    │
│                                                    │
│ Why you're being asked                             │
│ Two options still standing; D2 added no linking    │
│ key. Tried: read D2, ran pairing on tsk-48i.       │
├────────────────────────────────────────────────────┤
│ Your answer                                        │  answer_form
│ ┌────────────────────────────────────────────────┐ │
│ │                                                │ │
│ │                                                │ │
│ └────────────────────────────────────────────────┘ │
│ Goes through `fgos answer`.                        │
├────────────────────────────────────────────────────┤
│                          [ Cancel ]  [ Send answer ]│ footer
└────────────────────────────────────────────────────┘
```

The question is repeated inside the modal, with its "why", so a person
answering on a phone never has to dismiss the modal to re-read what they
are answering. The footnote naming the verb is not decoration — R2 says
every write maps to one one-door-write verb, and showing which one is how
a person knows what they are actually about to do.
````

## claim_81e60ba98c086609376e50fcde631003

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M01-answer-question.md#unheaded-block-3; lines 25–45; ancestry ["M01 — Answer a parked question","Layout"].
Target: docs/platform/ui-spec/architecture/modals/M01-answer-question.md#unheaded-block-5; ancestry ["M01 — Answer a parked question","Layout"].
Source digest: 243f37484ada7bbcf9a52d14082146a53a20d58cb9e6cf073444d668a3d1e70a
Target digest: 243f37484ada7bbcf9a52d14082146a53a20d58cb9e6cf073444d668a3d1e70a
Shown source SHA256: 243f37484ada7bbcf9a52d14082146a53a20d58cb9e6cf073444d668a3d1e70a
Shown target SHA256: 243f37484ada7bbcf9a52d14082146a53a20d58cb9e6cf073444d668a3d1e70a

### Complete proposed decision

```json
{
  "claimId": "claim_81e60ba98c086609376e50fcde631003",
  "sourceUnitDigest": "243f37484ada7bbcf9a52d14082146a53a20d58cb9e6cf073444d668a3d1e70a",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M01-answer-question.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M01-answer-question.md#unheaded-block-3 (source lines 25-45) is carried at docs/platform/ui-spec/architecture/modals/M01-answer-question.md#unheaded-block-5 (candidate lines 47-67). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M01-answer-question.md verbatim in docs/platform/ui-spec/architecture/modals/M01-answer-question.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "243f37484ada7bbcf9a52d14082146a53a20d58cb9e6cf073444d668a3d1e70a",
  "targetAncestry": [
    "M01 — Answer a parked question",
    "Layout"
  ]
}
```

### Full source shown text

````text
```
┌────────────────────────────────────────────────────┐
│ Answer · tsk-4id                              [✕]  │  header
├────────────────────────────────────────────────────┤
│ Which pairing key should the timeline use when     │  question_recap
│ askHistory and settlements have drifted by one?    │
│                                                    │
│ Why you're being asked                             │
│ Two options still standing; D2 added no linking    │
│ key. Tried: read D2, ran pairing on tsk-48i.       │
├────────────────────────────────────────────────────┤
│ Your answer                                        │  answer_form
│ ┌────────────────────────────────────────────────┐ │
│ │                                                │ │
│ │                                                │ │
│ └────────────────────────────────────────────────┘ │
│ Goes through `fgos answer`.                        │
├────────────────────────────────────────────────────┤
│                          [ Cancel ]  [ Send answer ]│ footer
└────────────────────────────────────────────────────┘
```
````

### Full target shown text

````text
```
┌────────────────────────────────────────────────────┐
│ Answer · tsk-4id                              [✕]  │  header
├────────────────────────────────────────────────────┤
│ Which pairing key should the timeline use when     │  question_recap
│ askHistory and settlements have drifted by one?    │
│                                                    │
│ Why you're being asked                             │
│ Two options still standing; D2 added no linking    │
│ key. Tried: read D2, ran pairing on tsk-48i.       │
├────────────────────────────────────────────────────┤
│ Your answer                                        │  answer_form
│ ┌────────────────────────────────────────────────┐ │
│ │                                                │ │
│ │                                                │ │
│ └────────────────────────────────────────────────┘ │
│ Goes through `fgos answer`.                        │
├────────────────────────────────────────────────────┤
│                          [ Cancel ]  [ Send answer ]│ footer
└────────────────────────────────────────────────────┘
```
````

## claim_46d2aa894a82bd4231e161abc1de795a

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M01-answer-question.md#unheaded-block-4; lines 47–51; ancestry ["M01 — Answer a parked question","Layout"].
Target: docs/platform/ui-spec/architecture/modals/M01-answer-question.md#unheaded-block-6; ancestry ["M01 — Answer a parked question","Layout"].
Source digest: 00da42d1fca43f605f8dfd40f68babb3a77c8d178aa33e60614543a7a7a3a759
Target digest: 00da42d1fca43f605f8dfd40f68babb3a77c8d178aa33e60614543a7a7a3a759
Shown source SHA256: 00da42d1fca43f605f8dfd40f68babb3a77c8d178aa33e60614543a7a7a3a759
Shown target SHA256: 00da42d1fca43f605f8dfd40f68babb3a77c8d178aa33e60614543a7a7a3a759

### Complete proposed decision

```json
{
  "claimId": "claim_46d2aa894a82bd4231e161abc1de795a",
  "sourceUnitDigest": "00da42d1fca43f605f8dfd40f68babb3a77c8d178aa33e60614543a7a7a3a759",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M01-answer-question.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M01-answer-question.md#unheaded-block-4 (source lines 47-51) is carried at docs/platform/ui-spec/architecture/modals/M01-answer-question.md#unheaded-block-6 (candidate lines 69-73). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M01-answer-question.md verbatim in docs/platform/ui-spec/architecture/modals/M01-answer-question.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "00da42d1fca43f605f8dfd40f68babb3a77c8d178aa33e60614543a7a7a3a759",
  "targetAncestry": [
    "M01 — Answer a parked question",
    "Layout"
  ]
}
```

### Full source shown text

```text
The question is repeated inside the modal, with its "why", so a person
answering on a phone never has to dismiss the modal to re-read what they
are answering. The footnote naming the verb is not decoration — R2 says
every write maps to one one-door-write verb, and showing which one is how
a person knows what they are actually about to do.
```

### Full target shown text

```text
The question is repeated inside the modal, with its "why", so a person
answering on a phone never has to dismiss the modal to re-read what they
are answering. The footnote naming the verb is not decoration — R2 says
every write maps to one one-door-write verb, and showing which one is how
a person knows what they are actually about to do.
```

## claim_2fca593fd29799a98ecb961e2bc31189

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M01-answer-question.md#states; lines 53–53; ancestry ["M01 — Answer a parked question"].
Target: docs/platform/ui-spec/architecture/modals/M01-answer-question.md#states; ancestry ["M01 — Answer a parked question"].
Source digest: fed79adbb21c77cf08962e43f59af9709f516446087eed5db76b20d234ff76a2
Target digest: fed79adbb21c77cf08962e43f59af9709f516446087eed5db76b20d234ff76a2
Shown source SHA256: 3713643c3110553856fd190b7a9e820a37ddb37a20fa945ab0917461ab50c41b
Shown target SHA256: 3713643c3110553856fd190b7a9e820a37ddb37a20fa945ab0917461ab50c41b

### Complete proposed decision

```json
{
  "claimId": "claim_2fca593fd29799a98ecb961e2bc31189",
  "sourceUnitDigest": "fed79adbb21c77cf08962e43f59af9709f516446087eed5db76b20d234ff76a2",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M01-answer-question.md",
  "targetAnchor": "states",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/modals/M01-answer-question.md#states (source lines 53-53) is carried at docs/platform/ui-spec/architecture/modals/M01-answer-question.md#states (candidate lines 75-75). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M01-answer-question.md verbatim in docs/platform/ui-spec/architecture/modals/M01-answer-question.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "fed79adbb21c77cf08962e43f59af9709f516446087eed5db76b20d234ff76a2",
  "targetAncestry": [
    "M01 — Answer a parked question"
  ]
}
```

### Full source shown text

```text
## States

- **ST-READY** — send disabled until the answer is non-empty.
- **ST-SUBMITTING** — send shows progress; the textarea goes read-only but
  stays visible, so nothing typed is ever hidden mid-flight.
- **ERR-WRITE-REFUSED** — fgOS refused the write (the item was no longer
  parked, say). The engine's own message is shown verbatim, and the typed
  answer is kept, never cleared.
```

### Full target shown text

```text
## States

- **ST-READY** — send disabled until the answer is non-empty.
- **ST-SUBMITTING** — send shows progress; the textarea goes read-only but
  stays visible, so nothing typed is ever hidden mid-flight.
- **ERR-WRITE-REFUSED** — fgOS refused the write (the item was no longer
  parked, say). The engine's own message is shown verbatim, and the typed
  answer is kept, never cleared.
```

## claim_5ff80d2788c64645819e4747c97586f3

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M01-answer-question.md#unheaded-block-5; lines 55–60; ancestry ["M01 — Answer a parked question","States"].
Target: docs/platform/ui-spec/architecture/modals/M01-answer-question.md#unheaded-block-7; ancestry ["M01 — Answer a parked question","States"].
Source digest: bd8db0fe9a91124526c6ea88ff30ddd6173dbc2b4eb00938d01ded7000ee3c74
Target digest: bd8db0fe9a91124526c6ea88ff30ddd6173dbc2b4eb00938d01ded7000ee3c74
Shown source SHA256: bd8db0fe9a91124526c6ea88ff30ddd6173dbc2b4eb00938d01ded7000ee3c74
Shown target SHA256: bd8db0fe9a91124526c6ea88ff30ddd6173dbc2b4eb00938d01ded7000ee3c74

### Complete proposed decision

```json
{
  "claimId": "claim_5ff80d2788c64645819e4747c97586f3",
  "sourceUnitDigest": "bd8db0fe9a91124526c6ea88ff30ddd6173dbc2b4eb00938d01ded7000ee3c74",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M01-answer-question.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M01-answer-question.md#unheaded-block-5 (source lines 55-60) is carried at docs/platform/ui-spec/architecture/modals/M01-answer-question.md#unheaded-block-7 (candidate lines 77-82). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M01-answer-question.md verbatim in docs/platform/ui-spec/architecture/modals/M01-answer-question.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "bd8db0fe9a91124526c6ea88ff30ddd6173dbc2b4eb00938d01ded7000ee3c74",
  "targetAncestry": [
    "M01 — Answer a parked question",
    "States"
  ]
}
```

### Full source shown text

```text
- **ST-READY** — send disabled until the answer is non-empty.
- **ST-SUBMITTING** — send shows progress; the textarea goes read-only but
  stays visible, so nothing typed is ever hidden mid-flight.
- **ERR-WRITE-REFUSED** — fgOS refused the write (the item was no longer
  parked, say). The engine's own message is shown verbatim, and the typed
  answer is kept, never cleared.
```

### Full target shown text

```text
- **ST-READY** — send disabled until the answer is non-empty.
- **ST-SUBMITTING** — send shows progress; the textarea goes read-only but
  stays visible, so nothing typed is ever hidden mid-flight.
- **ERR-WRITE-REFUSED** — fgOS refused the write (the item was no longer
  parked, say). The engine's own message is shown verbatim, and the typed
  answer is kept, never cleared.
```

## claim_42511baf61c8603df6dfa984707d7c02

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M01-answer-question.md#interactions; lines 62–62; ancestry ["M01 — Answer a parked question"].
Target: docs/platform/ui-spec/architecture/modals/M01-answer-question.md#interactions; ancestry ["M01 — Answer a parked question"].
Source digest: 0310499305b9425d55f76b3343b1886213c1d5dec72ba2a0951c583544352ecb
Target digest: 0310499305b9425d55f76b3343b1886213c1d5dec72ba2a0951c583544352ecb
Shown source SHA256: 3c049a8f95ec04ebbe2c3ba328e112934aa74e34fcc1c8650b2b5b7dddd0d5c8
Shown target SHA256: 3c049a8f95ec04ebbe2c3ba328e112934aa74e34fcc1c8650b2b5b7dddd0d5c8

### Complete proposed decision

```json
{
  "claimId": "claim_42511baf61c8603df6dfa984707d7c02",
  "sourceUnitDigest": "0310499305b9425d55f76b3343b1886213c1d5dec72ba2a0951c583544352ecb",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M01-answer-question.md",
  "targetAnchor": "interactions",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/modals/M01-answer-question.md#interactions (source lines 62-62) is carried at docs/platform/ui-spec/architecture/modals/M01-answer-question.md#interactions (candidate lines 84-84). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M01-answer-question.md verbatim in docs/platform/ui-spec/architecture/modals/M01-answer-question.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0310499305b9425d55f76b3343b1886213c1d5dec72ba2a0951c583544352ecb",
  "targetAncestry": [
    "M01 — Answer a parked question"
  ]
}
```

### Full source shown text

````text
## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-M01-001
    element: answer_textarea
    region: answer_form
    trigger: input
    action: mutate
    effects: [enable_send_when_non_empty]
  - id: A-M01-002
    element: send_answer_button
    region: footer
    trigger: submit
    guard: "answer.nonEmpty"
    action: close_overlay
    target: return_to_invoker
    effects: [run_fgos_answer_verb]
  - id: A-M01-003
    element: cancel_button
    region: footer
    trigger: click
    action: close_overlay
    target: return_to_invoker
  - id: A-M01-004
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
  - id: A-M01-001
    element: answer_textarea
    region: answer_form
    trigger: input
    action: mutate
    effects: [enable_send_when_non_empty]
  - id: A-M01-002
    element: send_answer_button
    region: footer
    trigger: submit
    guard: "answer.nonEmpty"
    action: close_overlay
    target: return_to_invoker
    effects: [run_fgos_answer_verb]
  - id: A-M01-003
    element: cancel_button
    region: footer
    trigger: click
    action: close_overlay
    target: return_to_invoker
  - id: A-M01-004
    element: close_icon
    region: header
    trigger: click
    action: close_overlay
    target: return_to_invoker
```
````

## claim_89e1dad5a298dcd9a584cf7e436b07c8

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M01-answer-question.md#unheaded-block-6; lines 64–92; ancestry ["M01 — Answer a parked question","Interactions"].
Target: docs/platform/ui-spec/architecture/modals/M01-answer-question.md#unheaded-block-8; ancestry ["M01 — Answer a parked question","Interactions"].
Source digest: 3863c313178b0aea88f942dae236aeda908f0d6202da0384ce55f0fbe0b9601a
Target digest: 3863c313178b0aea88f942dae236aeda908f0d6202da0384ce55f0fbe0b9601a
Shown source SHA256: 3863c313178b0aea88f942dae236aeda908f0d6202da0384ce55f0fbe0b9601a
Shown target SHA256: 3863c313178b0aea88f942dae236aeda908f0d6202da0384ce55f0fbe0b9601a

### Complete proposed decision

```json
{
  "claimId": "claim_89e1dad5a298dcd9a584cf7e436b07c8",
  "sourceUnitDigest": "3863c313178b0aea88f942dae236aeda908f0d6202da0384ce55f0fbe0b9601a",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M01-answer-question.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M01-answer-question.md#unheaded-block-6 (source lines 64-92) is carried at docs/platform/ui-spec/architecture/modals/M01-answer-question.md#unheaded-block-8 (candidate lines 86-114). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M01-answer-question.md verbatim in docs/platform/ui-spec/architecture/modals/M01-answer-question.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3863c313178b0aea88f942dae236aeda908f0d6202da0384ce55f0fbe0b9601a",
  "targetAncestry": [
    "M01 — Answer a parked question",
    "Interactions"
  ]
}
```

### Full source shown text

````text
```yaml herdrweb-contract
interactions:
  - id: A-M01-001
    element: answer_textarea
    region: answer_form
    trigger: input
    action: mutate
    effects: [enable_send_when_non_empty]
  - id: A-M01-002
    element: send_answer_button
    region: footer
    trigger: submit
    guard: "answer.nonEmpty"
    action: close_overlay
    target: return_to_invoker
    effects: [run_fgos_answer_verb]
  - id: A-M01-003
    element: cancel_button
    region: footer
    trigger: click
    action: close_overlay
    target: return_to_invoker
  - id: A-M01-004
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
  - id: A-M01-001
    element: answer_textarea
    region: answer_form
    trigger: input
    action: mutate
    effects: [enable_send_when_non_empty]
  - id: A-M01-002
    element: send_answer_button
    region: footer
    trigger: submit
    guard: "answer.nonEmpty"
    action: close_overlay
    target: return_to_invoker
    effects: [run_fgos_answer_verb]
  - id: A-M01-003
    element: cancel_button
    region: footer
    trigger: click
    action: close_overlay
    target: return_to_invoker
  - id: A-M01-004
    element: close_icon
    region: header
    trigger: click
    action: close_overlay
    target: return_to_invoker
```
````
