# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/flows/F01-answer-a-parked-question.md
Part 1/1; entries: **10**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 4/4 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_1d6b3967b477d9ada8de5c5b69a68ece",
      "claim_4fca4420a5f2baea4c37309fdc4f7555",
      "claim_d17fc43b1d58c9992a60d5605b155e37",
      "claim_028c68be7bd8559c92b54d6a11eca48a",
      "claim_91a51cee06251cc0d253768eb037c821",
      "claim_fc71787af183cc17ea2100bcecb32b58"
    ],
    "Weak-exact": [
      "claim_80ff4624d518db7befbdccfcd92a2ed3",
      "claim_4ddde2c3d97535b424143c3847753bab",
      "claim_2e79d3dd87585da273910fa943bdccf7"
    ],
    "Judgment": [
      "claim_9a46c9f995367d176ac61cf2d59647a4"
    ]
  },
  "unequalDigestPairs": [
    "claim_9a46c9f995367d176ac61cf2d59647a4"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_9a46c9f995367d176ac61cf2d59647a4"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_1d6b3967b477d9ada8de5c5b69a68ece

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F01-answer-a-parked-question.md#unheaded-block-1; lines 1–11; ancestry [].
Target: docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#unheaded-block-1; ancestry [].
Source digest: 4b9fa3e77cd364e748d9e3e8b15c51ac292b76768c2acab6f609d94b85646480
Target digest: 4b9fa3e77cd364e748d9e3e8b15c51ac292b76768c2acab6f609d94b85646480
Shown source SHA256: 4b9fa3e77cd364e748d9e3e8b15c51ac292b76768c2acab6f609d94b85646480
Shown target SHA256: 4b9fa3e77cd364e748d9e3e8b15c51ac292b76768c2acab6f609d94b85646480

### Complete proposed decision

```json
{
  "claimId": "claim_1d6b3967b477d9ada8de5c5b69a68ece",
  "sourceUnitDigest": "4b9fa3e77cd364e748d9e3e8b15c51ac292b76768c2acab6f609d94b85646480",
  "targetOwner": "docs/platform/ui-spec/operations/F01-answer-a-parked-question.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/ui-spec/flows/F01-answer-a-parked-question.md#unheaded-block-1 (source lines 1-11) is carried at docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#unheaded-block-1 (candidate lines 1-11). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F01-answer-a-parked-question.md verbatim in docs/platform/ui-spec/operations/F01-answer-a-parked-question.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "4b9fa3e77cd364e748d9e3e8b15c51ac292b76768c2acab6f609d94b85646480",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
id: F01
type: flow
name: "Answer a parked question, end to end"
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
id: F01
type: flow
name: "Answer a parked question, end to end"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: []
regions: []
---
```

## claim_9a46c9f995367d176ac61cf2d59647a4

Class: Judgment; mandatory deep: true.
Source: docs/ui-spec/flows/F01-answer-a-parked-question.md#f01-answer-a-parked-question-end-to-end; lines 13–13; ancestry [].
Target: docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#f01-answer-a-parked-question-end-to-end; ancestry [].
Source digest: ebdf554cc21344a0ae7e2b7d3c15494c3df19bdea61f05b208bd970f7fd23bdc
Target digest: cc39f42f0483ed065fac41079ddfd01c8555123c26412021290c758fd09b2576
Shown source SHA256: 7f98cba4f5894b94c63431cf89dc2f8a2dc0c49d07601d4749c32fa62b280706
Shown target SHA256: d59ed665f2ccde66ef459b47948bda32082a14dab62f05ab61f37a5623ecc81b

### Complete proposed decision

```json
{
  "claimId": "claim_9a46c9f995367d176ac61cf2d59647a4",
  "sourceUnitDigest": "ebdf554cc21344a0ae7e2b7d3c15494c3df19bdea61f05b208bd970f7fd23bdc",
  "targetOwner": "docs/platform/ui-spec/operations/F01-answer-a-parked-question.md",
  "targetAnchor": "f01-answer-a-parked-question-end-to-end",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/ui-spec/flows/F01-answer-a-parked-question.md#f01-answer-a-parked-question-end-to-end (source lines 13-13) is carried at docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#f01-answer-a-parked-question-end-to-end (candidate lines 13-13). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F01-answer-a-parked-question.md verbatim in docs/platform/ui-spec/operations/F01-answer-a-parked-question.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "cc39f42f0483ed065fac41079ddfd01c8555123c26412021290c758fd09b2576",
  "targetAncestry": []
}
```

### Full source shown text

```text
# F01 — Answer a parked question, end to end
```

### Full target shown text

````text
# F01 — Answer a parked question, end to end

```txt
Document type: Guide / Runbook
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/flows/F01-answer-a-parked-question.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/ui-spec/flows/F01-answer-a-parked-question.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.
````

## claim_80ff4624d518db7befbdccfcd92a2ed3

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F01-answer-a-parked-question.md#purpose; lines 15–15; ancestry ["F01 — Answer a parked question, end to end"].
Target: docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#purpose; ancestry ["F01 — Answer a parked question, end to end"].
Source digest: 223a81e591cd70cf4ff13dbbab0f2c60c71f512fbc35c8bbcd4564853d089024
Target digest: 223a81e591cd70cf4ff13dbbab0f2c60c71f512fbc35c8bbcd4564853d089024
Shown source SHA256: 53914885674d009b7f3c87c15e7d172c007db1a559f4c14cffcd7237c86ccc78
Shown target SHA256: 53914885674d009b7f3c87c15e7d172c007db1a559f4c14cffcd7237c86ccc78

### Complete proposed decision

```json
{
  "claimId": "claim_80ff4624d518db7befbdccfcd92a2ed3",
  "sourceUnitDigest": "223a81e591cd70cf4ff13dbbab0f2c60c71f512fbc35c8bbcd4564853d089024",
  "targetOwner": "docs/platform/ui-spec/operations/F01-answer-a-parked-question.md",
  "targetAnchor": "purpose",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/flows/F01-answer-a-parked-question.md#purpose (source lines 15-15) is carried at docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#purpose (candidate lines 37-37). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F01-answer-a-parked-question.md verbatim in docs/platform/ui-spec/operations/F01-answer-a-parked-question.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "223a81e591cd70cf4ff13dbbab0f2c60c71f512fbc35c8bbcd4564853d089024",
  "targetAncestry": [
    "F01 — Answer a parked question, end to end"
  ]
}
```

### Full source shown text

```text
## Purpose

The flow the whole cluster exists for: a person picks up their phone, finds
out something needs them, and answers it — without opening a terminal.

Measured against the real acceptance criterion (*a person with no context
in their head can answer quickly*), this flow is where that is either true
or false. It is five taps from cold to answered, and only one of them
requires reading.
```

### Full target shown text

```text
## Purpose

The flow the whole cluster exists for: a person picks up their phone, finds
out something needs them, and answers it — without opening a terminal.

Measured against the real acceptance criterion (*a person with no context
in their head can answer quickly*), this flow is where that is either true
or false. It is five taps from cold to answered, and only one of them
requires reading.
```

## claim_4fca4420a5f2baea4c37309fdc4f7555

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F01-answer-a-parked-question.md#unheaded-block-2; lines 17–18; ancestry ["F01 — Answer a parked question, end to end","Purpose"].
Target: docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#unheaded-block-4; ancestry ["F01 — Answer a parked question, end to end","Purpose"].
Source digest: 09c8331014a8c087f0aea468f1aa00a8b993f995ab1d62de18323e208792328d
Target digest: 09c8331014a8c087f0aea468f1aa00a8b993f995ab1d62de18323e208792328d
Shown source SHA256: 09c8331014a8c087f0aea468f1aa00a8b993f995ab1d62de18323e208792328d
Shown target SHA256: 09c8331014a8c087f0aea468f1aa00a8b993f995ab1d62de18323e208792328d

### Complete proposed decision

```json
{
  "claimId": "claim_4fca4420a5f2baea4c37309fdc4f7555",
  "sourceUnitDigest": "09c8331014a8c087f0aea468f1aa00a8b993f995ab1d62de18323e208792328d",
  "targetOwner": "docs/platform/ui-spec/operations/F01-answer-a-parked-question.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/flows/F01-answer-a-parked-question.md#unheaded-block-2 (source lines 17-18) is carried at docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#unheaded-block-4 (candidate lines 39-40). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F01-answer-a-parked-question.md verbatim in docs/platform/ui-spec/operations/F01-answer-a-parked-question.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "09c8331014a8c087f0aea468f1aa00a8b993f995ab1d62de18323e208792328d",
  "targetAncestry": [
    "F01 — Answer a parked question, end to end",
    "Purpose"
  ]
}
```

### Full source shown text

```text
The flow the whole cluster exists for: a person picks up their phone, finds
out something needs them, and answers it — without opening a terminal.
```

### Full target shown text

```text
The flow the whole cluster exists for: a person picks up their phone, finds
out something needs them, and answers it — without opening a terminal.
```

## claim_d17fc43b1d58c9992a60d5605b155e37

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F01-answer-a-parked-question.md#unheaded-block-3; lines 20–23; ancestry ["F01 — Answer a parked question, end to end","Purpose"].
Target: docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#unheaded-block-5; ancestry ["F01 — Answer a parked question, end to end","Purpose"].
Source digest: 09fa989ef2e7c36e36a09ac4b51d4066dbc9ed6069a3b04246606aad55053491
Target digest: 09fa989ef2e7c36e36a09ac4b51d4066dbc9ed6069a3b04246606aad55053491
Shown source SHA256: 09fa989ef2e7c36e36a09ac4b51d4066dbc9ed6069a3b04246606aad55053491
Shown target SHA256: 09fa989ef2e7c36e36a09ac4b51d4066dbc9ed6069a3b04246606aad55053491

### Complete proposed decision

```json
{
  "claimId": "claim_d17fc43b1d58c9992a60d5605b155e37",
  "sourceUnitDigest": "09fa989ef2e7c36e36a09ac4b51d4066dbc9ed6069a3b04246606aad55053491",
  "targetOwner": "docs/platform/ui-spec/operations/F01-answer-a-parked-question.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/flows/F01-answer-a-parked-question.md#unheaded-block-3 (source lines 20-23) is carried at docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#unheaded-block-5 (candidate lines 42-45). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F01-answer-a-parked-question.md verbatim in docs/platform/ui-spec/operations/F01-answer-a-parked-question.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "09fa989ef2e7c36e36a09ac4b51d4066dbc9ed6069a3b04246606aad55053491",
  "targetAncestry": [
    "F01 — Answer a parked question, end to end",
    "Purpose"
  ]
}
```

### Full source shown text

```text
Measured against the real acceptance criterion (*a person with no context
in their head can answer quickly*), this flow is where that is either true
or false. It is five taps from cold to answered, and only one of them
requires reading.
```

### Full target shown text

```text
Measured against the real acceptance criterion (*a person with no context
in their head can answer quickly*), this flow is where that is either true
or false. It is five taps from cold to answered, and only one of them
requires reading.
```

## claim_4ddde2c3d97535b424143c3847753bab

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F01-answer-a-parked-question.md#steps; lines 25–25; ancestry ["F01 — Answer a parked question, end to end"].
Target: docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#steps; ancestry ["F01 — Answer a parked question, end to end"].
Source digest: 5852d441d24adcc3831e02a5b4d4a2e463fcd1e593aba8dc9b7c184140386e7a
Target digest: 5852d441d24adcc3831e02a5b4d4a2e463fcd1e593aba8dc9b7c184140386e7a
Shown source SHA256: 7b977b27c23e066f4930335a8211cbf50df1310dae9a00f33b80f104db24d536
Shown target SHA256: 7b977b27c23e066f4930335a8211cbf50df1310dae9a00f33b80f104db24d536

### Complete proposed decision

```json
{
  "claimId": "claim_4ddde2c3d97535b424143c3847753bab",
  "sourceUnitDigest": "5852d441d24adcc3831e02a5b4d4a2e463fcd1e593aba8dc9b7c184140386e7a",
  "targetOwner": "docs/platform/ui-spec/operations/F01-answer-a-parked-question.md",
  "targetAnchor": "steps",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/flows/F01-answer-a-parked-question.md#steps (source lines 25-25) is carried at docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#steps (candidate lines 47-47). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F01-answer-a-parked-question.md verbatim in docs/platform/ui-spec/operations/F01-answer-a-parked-question.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "5852d441d24adcc3831e02a5b4d4a2e463fcd1e593aba8dc9b7c184140386e7a",
  "targetAncestry": [
    "F01 — Answer a parked question, end to end"
  ]
}
```

### Full source shown text

```text
## Steps

1. **Sign in** (S01) — one field. On a phone, usually already a live
   session, so this step is skipped in practice.
2. **Land on the taskboard** (S02) — `NEEDS ANSWER` is the first group on
   mobile and the pinned rail on desktop. The count answers "is there
   anything for me" before anything is read.
3. **Open the question** — either straight from the rail, or via the
   questions list (S04) when there is more than one to triage. S04's rows
   carry the question text itself, so triage happens without opening.
4. **Read** (S03) — question, then why it is being asked (including what
   was already tried), then the item. This is the only step that takes
   real attention, and the region order is what makes it short.
5. **Answer** (M01) — the question and its "why" are repeated inside the
   modal, so nothing has to be dismissed to re-read. Submit runs
   `fgos answer` through the gateway.
6. **Confirmation** — the item resumes, `question.answered` arrives, the
   row leaves S04 and the open round on S03's timeline closes.
```

### Full target shown text

```text
## Steps

1. **Sign in** (S01) — one field. On a phone, usually already a live
   session, so this step is skipped in practice.
2. **Land on the taskboard** (S02) — `NEEDS ANSWER` is the first group on
   mobile and the pinned rail on desktop. The count answers "is there
   anything for me" before anything is read.
3. **Open the question** — either straight from the rail, or via the
   questions list (S04) when there is more than one to triage. S04's rows
   carry the question text itself, so triage happens without opening.
4. **Read** (S03) — question, then why it is being asked (including what
   was already tried), then the item. This is the only step that takes
   real attention, and the region order is what makes it short.
5. **Answer** (M01) — the question and its "why" are repeated inside the
   modal, so nothing has to be dismissed to re-read. Submit runs
   `fgos answer` through the gateway.
6. **Confirmation** — the item resumes, `question.answered` arrives, the
   row leaves S04 and the open round on S03's timeline closes.
```

## claim_028c68be7bd8559c92b54d6a11eca48a

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F01-answer-a-parked-question.md#unheaded-block-4; lines 27–42; ancestry ["F01 — Answer a parked question, end to end","Steps"].
Target: docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#unheaded-block-6; ancestry ["F01 — Answer a parked question, end to end","Steps"].
Source digest: 999b24a2dff4d2d168348cafbfd961f1c3c9bfec878507ad95ec2e8493e45775
Target digest: 999b24a2dff4d2d168348cafbfd961f1c3c9bfec878507ad95ec2e8493e45775
Shown source SHA256: 999b24a2dff4d2d168348cafbfd961f1c3c9bfec878507ad95ec2e8493e45775
Shown target SHA256: 999b24a2dff4d2d168348cafbfd961f1c3c9bfec878507ad95ec2e8493e45775

### Complete proposed decision

```json
{
  "claimId": "claim_028c68be7bd8559c92b54d6a11eca48a",
  "sourceUnitDigest": "999b24a2dff4d2d168348cafbfd961f1c3c9bfec878507ad95ec2e8493e45775",
  "targetOwner": "docs/platform/ui-spec/operations/F01-answer-a-parked-question.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/flows/F01-answer-a-parked-question.md#unheaded-block-4 (source lines 27-42) is carried at docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#unheaded-block-6 (candidate lines 49-64). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F01-answer-a-parked-question.md verbatim in docs/platform/ui-spec/operations/F01-answer-a-parked-question.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "999b24a2dff4d2d168348cafbfd961f1c3c9bfec878507ad95ec2e8493e45775",
  "targetAncestry": [
    "F01 — Answer a parked question, end to end",
    "Steps"
  ]
}
```

### Full source shown text

```text
1. **Sign in** (S01) — one field. On a phone, usually already a live
   session, so this step is skipped in practice.
2. **Land on the taskboard** (S02) — `NEEDS ANSWER` is the first group on
   mobile and the pinned rail on desktop. The count answers "is there
   anything for me" before anything is read.
3. **Open the question** — either straight from the rail, or via the
   questions list (S04) when there is more than one to triage. S04's rows
   carry the question text itself, so triage happens without opening.
4. **Read** (S03) — question, then why it is being asked (including what
   was already tried), then the item. This is the only step that takes
   real attention, and the region order is what makes it short.
5. **Answer** (M01) — the question and its "why" are repeated inside the
   modal, so nothing has to be dismissed to re-read. Submit runs
   `fgos answer` through the gateway.
6. **Confirmation** — the item resumes, `question.answered` arrives, the
   row leaves S04 and the open round on S03's timeline closes.
```

### Full target shown text

```text
1. **Sign in** (S01) — one field. On a phone, usually already a live
   session, so this step is skipped in practice.
2. **Land on the taskboard** (S02) — `NEEDS ANSWER` is the first group on
   mobile and the pinned rail on desktop. The count answers "is there
   anything for me" before anything is read.
3. **Open the question** — either straight from the rail, or via the
   questions list (S04) when there is more than one to triage. S04's rows
   carry the question text itself, so triage happens without opening.
4. **Read** (S03) — question, then why it is being asked (including what
   was already tried), then the item. This is the only step that takes
   real attention, and the region order is what makes it short.
5. **Answer** (M01) — the question and its "why" are repeated inside the
   modal, so nothing has to be dismissed to re-read. Submit runs
   `fgos answer` through the gateway.
6. **Confirmation** — the item resumes, `question.answered` arrives, the
   row leaves S04 and the open round on S03's timeline closes.
```

## claim_2e79d3dd87585da273910fa943bdccf7

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F01-answer-a-parked-question.md#branches; lines 44–44; ancestry ["F01 — Answer a parked question, end to end"].
Target: docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#branches; ancestry ["F01 — Answer a parked question, end to end"].
Source digest: a9b491ffd9b9d866fb204799d5571f20b5818f322f6422d4ab4231b0b6608fbf
Target digest: a9b491ffd9b9d866fb204799d5571f20b5818f322f6422d4ab4231b0b6608fbf
Shown source SHA256: 873c4b7e030fa02fae74bdbec1bf5c4d51dfb50d745828204cd50c0eaaa2ee65
Shown target SHA256: 873c4b7e030fa02fae74bdbec1bf5c4d51dfb50d745828204cd50c0eaaa2ee65

### Complete proposed decision

```json
{
  "claimId": "claim_2e79d3dd87585da273910fa943bdccf7",
  "sourceUnitDigest": "a9b491ffd9b9d866fb204799d5571f20b5818f322f6422d4ab4231b0b6608fbf",
  "targetOwner": "docs/platform/ui-spec/operations/F01-answer-a-parked-question.md",
  "targetAnchor": "branches",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/flows/F01-answer-a-parked-question.md#branches (source lines 44-44) is carried at docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#branches (candidate lines 66-66). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F01-answer-a-parked-question.md verbatim in docs/platform/ui-spec/operations/F01-answer-a-parked-question.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "a9b491ffd9b9d866fb204799d5571f20b5818f322f6422d4ab4231b0b6608fbf",
  "targetAncestry": [
    "F01 — Answer a parked question, end to end"
  ]
}
```

### Full source shown text

````text
## Branches

- **The item is no longer parked** when the answer is submitted (someone
  answered from a terminal first): fgOS refuses the write, and
  ERR-WRITE-REFUSED shows the engine's own words with the typed answer
  preserved.
- **The gateway is unreachable** mid-flow: ST-DISCONNECTED marks content
  stale and disables the write controls, rather than accepting an answer
  it cannot deliver.

```yaml herdrweb-contract
flow:
  goal: "Answer a question that is blocking a work item, from a phone, without a terminal"
  preconditions:
    - "at least one item is parked awaiting a person"
    - "the client has a reachable gateway"
  steps:
    - A-S01-002
    - A-S02-006
    - A-S04-001
    - A-M01-001
    - A-M01-002
  branches:
    - when: "triage several questions before answering"
      action: A-S04-002
    - when: "answer directly from the item's own detail screen"
      action: A-S03-001
    - when: "gateway drops mid-flow"
      action: A-S04-006
```
````

### Full target shown text

````text
## Branches

- **The item is no longer parked** when the answer is submitted (someone
  answered from a terminal first): fgOS refuses the write, and
  ERR-WRITE-REFUSED shows the engine's own words with the typed answer
  preserved.
- **The gateway is unreachable** mid-flow: ST-DISCONNECTED marks content
  stale and disables the write controls, rather than accepting an answer
  it cannot deliver.

```yaml herdrweb-contract
flow:
  goal: "Answer a question that is blocking a work item, from a phone, without a terminal"
  preconditions:
    - "at least one item is parked awaiting a person"
    - "the client has a reachable gateway"
  steps:
    - A-S01-002
    - A-S02-006
    - A-S04-001
    - A-M01-001
    - A-M01-002
  branches:
    - when: "triage several questions before answering"
      action: A-S04-002
    - when: "answer directly from the item's own detail screen"
      action: A-S03-001
    - when: "gateway drops mid-flow"
      action: A-S04-006
```
````

## claim_91a51cee06251cc0d253768eb037c821

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F01-answer-a-parked-question.md#unheaded-block-5; lines 46–52; ancestry ["F01 — Answer a parked question, end to end","Branches"].
Target: docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#unheaded-block-7; ancestry ["F01 — Answer a parked question, end to end","Branches"].
Source digest: ac90701211328c0b7c9f37b1e2371c4e8ff39077d29e411b2b03155c0f6c613d
Target digest: ac90701211328c0b7c9f37b1e2371c4e8ff39077d29e411b2b03155c0f6c613d
Shown source SHA256: ac90701211328c0b7c9f37b1e2371c4e8ff39077d29e411b2b03155c0f6c613d
Shown target SHA256: ac90701211328c0b7c9f37b1e2371c4e8ff39077d29e411b2b03155c0f6c613d

### Complete proposed decision

```json
{
  "claimId": "claim_91a51cee06251cc0d253768eb037c821",
  "sourceUnitDigest": "ac90701211328c0b7c9f37b1e2371c4e8ff39077d29e411b2b03155c0f6c613d",
  "targetOwner": "docs/platform/ui-spec/operations/F01-answer-a-parked-question.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/flows/F01-answer-a-parked-question.md#unheaded-block-5 (source lines 46-52) is carried at docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#unheaded-block-7 (candidate lines 68-74). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F01-answer-a-parked-question.md verbatim in docs/platform/ui-spec/operations/F01-answer-a-parked-question.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ac90701211328c0b7c9f37b1e2371c4e8ff39077d29e411b2b03155c0f6c613d",
  "targetAncestry": [
    "F01 — Answer a parked question, end to end",
    "Branches"
  ]
}
```

### Full source shown text

```text
- **The item is no longer parked** when the answer is submitted (someone
  answered from a terminal first): fgOS refuses the write, and
  ERR-WRITE-REFUSED shows the engine's own words with the typed answer
  preserved.
- **The gateway is unreachable** mid-flow: ST-DISCONNECTED marks content
  stale and disables the write controls, rather than accepting an answer
  it cannot deliver.
```

### Full target shown text

```text
- **The item is no longer parked** when the answer is submitted (someone
  answered from a terminal first): fgOS refuses the write, and
  ERR-WRITE-REFUSED shows the engine's own words with the typed answer
  preserved.
- **The gateway is unreachable** mid-flow: ST-DISCONNECTED marks content
  stale and disables the write controls, rather than accepting an answer
  it cannot deliver.
```

## claim_fc71787af183cc17ea2100bcecb32b58

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/flows/F01-answer-a-parked-question.md#unheaded-block-6; lines 54–73; ancestry ["F01 — Answer a parked question, end to end","Branches"].
Target: docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#unheaded-block-8; ancestry ["F01 — Answer a parked question, end to end","Branches"].
Source digest: b7b08196e6a7323347802d2b1dcaee20799136977e5601548532afff12321643
Target digest: b7b08196e6a7323347802d2b1dcaee20799136977e5601548532afff12321643
Shown source SHA256: b7b08196e6a7323347802d2b1dcaee20799136977e5601548532afff12321643
Shown target SHA256: b7b08196e6a7323347802d2b1dcaee20799136977e5601548532afff12321643

### Complete proposed decision

```json
{
  "claimId": "claim_fc71787af183cc17ea2100bcecb32b58",
  "sourceUnitDigest": "b7b08196e6a7323347802d2b1dcaee20799136977e5601548532afff12321643",
  "targetOwner": "docs/platform/ui-spec/operations/F01-answer-a-parked-question.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/flows/F01-answer-a-parked-question.md#unheaded-block-6 (source lines 54-73) is carried at docs/platform/ui-spec/operations/F01-answer-a-parked-question.md#unheaded-block-8 (candidate lines 76-95). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/flows/F01-answer-a-parked-question.md verbatim in docs/platform/ui-spec/operations/F01-answer-a-parked-question.md. Map kind guide-runbook is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b7b08196e6a7323347802d2b1dcaee20799136977e5601548532afff12321643",
  "targetAncestry": [
    "F01 — Answer a parked question, end to end",
    "Branches"
  ]
}
```

### Full source shown text

````text
```yaml herdrweb-contract
flow:
  goal: "Answer a question that is blocking a work item, from a phone, without a terminal"
  preconditions:
    - "at least one item is parked awaiting a person"
    - "the client has a reachable gateway"
  steps:
    - A-S01-002
    - A-S02-006
    - A-S04-001
    - A-M01-001
    - A-M01-002
  branches:
    - when: "triage several questions before answering"
      action: A-S04-002
    - when: "answer directly from the item's own detail screen"
      action: A-S03-001
    - when: "gateway drops mid-flow"
      action: A-S04-006
```
````

### Full target shown text

````text
```yaml herdrweb-contract
flow:
  goal: "Answer a question that is blocking a work item, from a phone, without a terminal"
  preconditions:
    - "at least one item is parked awaiting a person"
    - "the client has a reachable gateway"
  steps:
    - A-S01-002
    - A-S02-006
    - A-S04-001
    - A-M01-001
    - A-M01-002
  branches:
    - when: "triage several questions before answering"
      action: A-S04-002
    - when: "answer directly from the item's own detail screen"
      action: A-S03-001
    - when: "gateway drops mid-flow"
      action: A-S04-006
```
````
