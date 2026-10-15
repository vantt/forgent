# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/screens/S04-questions-needing-answer.md
Part 1/1; entries: **15**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 5/5 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_879a93675dea691099f52d778198f61a",
      "claim_99de7a5a1f002e16db2bbcf68045d707",
      "claim_6998a7b8301334cca30507533c23e493",
      "claim_228b96188da500e85ae818b66fe09233",
      "claim_d922400df0f2e4df9838ec9c5670c0df",
      "claim_6765123fbb5f11ffe97a098154c0795e",
      "claim_8c5e3f2968eb2cc04ee63b53168afadd",
      "claim_4543fb352c50cbb81ce2c271062f7d25",
      "claim_41441a240174152e1705db9f6a528bc3",
      "claim_3c3858b298aac0087ecce77ed003fd63"
    ],
    "Weak-exact": [
      "claim_7a4d99e16fcdb83d87454e1b6ab06862",
      "claim_70b933b970a27de52840bcda846835b0",
      "claim_a4f0b8d3ca1318b89d0c71aa9e4c801c",
      "claim_541edcbd2cfd7c2ea658c7f397fe9438"
    ],
    "Judgment": [
      "claim_bbfba2a05bf22181fa09c1776b039725"
    ]
  },
  "unequalDigestPairs": [
    "claim_bbfba2a05bf22181fa09c1776b039725"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_bbfba2a05bf22181fa09c1776b039725"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_879a93675dea691099f52d778198f61a

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-1; lines 1–11; ancestry [].
Target: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-1; ancestry [].
Source digest: d6f3328dcbd970ce632f7c70c6eb9f9dd81e7a20eef758dfc5892d2851a00228
Target digest: d6f3328dcbd970ce632f7c70c6eb9f9dd81e7a20eef758dfc5892d2851a00228
Shown source SHA256: d6f3328dcbd970ce632f7c70c6eb9f9dd81e7a20eef758dfc5892d2851a00228
Shown target SHA256: d6f3328dcbd970ce632f7c70c6eb9f9dd81e7a20eef758dfc5892d2851a00228

### Complete proposed decision

```json
{
  "claimId": "claim_879a93675dea691099f52d778198f61a",
  "sourceUnitDigest": "d6f3328dcbd970ce632f7c70c6eb9f9dd81e7a20eef758dfc5892d2851a00228",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-1 (source lines 1-11) is carried at docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-1 (candidate lines 1-11). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S04-questions-needing-answer.md verbatim in docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "d6f3328dcbd970ce632f7c70c6eb9f9dd81e7a20eef758dfc5892d2851a00228",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
id: S04
type: screen
name: "Questions needing answer"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R1, R5, R9, R11]
regions: [topbar, list]
---
```

### Full target shown text

```text
---
id: S04
type: screen
name: "Questions needing answer"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R1, R5, R9, R11]
regions: [topbar, list]
---
```

## claim_bbfba2a05bf22181fa09c1776b039725

Class: Judgment; mandatory deep: true.
Source: docs/ui-spec/screens/S04-questions-needing-answer.md#s04-questions-needing-answer; lines 13–13; ancestry [].
Target: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#s04-questions-needing-answer; ancestry [].
Source digest: d9308db549a0fdf87ab04137e1d2d44c091af2c900cb4c11e5e5576b73dc39ae
Target digest: 27d2ba3ccb69c49ffbd953797ad3c68fdcc2deef0abc70f8a75d1cc376b82789
Shown source SHA256: 12689e6fc12a11a11e0e5b1602b0b000aa76bf36a37f9c853669a75cc926b5f7
Shown target SHA256: cb4475bc4402881835c6dc9f7d4cc9316de61c61ebb59edd28ec9a248ce12cd3

### Complete proposed decision

```json
{
  "claimId": "claim_bbfba2a05bf22181fa09c1776b039725",
  "sourceUnitDigest": "d9308db549a0fdf87ab04137e1d2d44c091af2c900cb4c11e5e5576b73dc39ae",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md",
  "targetAnchor": "s04-questions-needing-answer",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/ui-spec/screens/S04-questions-needing-answer.md#s04-questions-needing-answer (source lines 13-13) is carried at docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#s04-questions-needing-answer (candidate lines 13-13). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S04-questions-needing-answer.md verbatim in docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "27d2ba3ccb69c49ffbd953797ad3c68fdcc2deef0abc70f8a75d1cc376b82789",
  "targetAncestry": []
}
```

### Full source shown text

```text
# S04 — Questions needing answer
```

### Full target shown text

````text
# S04 — Questions needing answer

```txt
Document type: Architecture
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/screens/S04-questions-needing-answer.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/ui-spec/screens/S04-questions-needing-answer.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.
````

## claim_7a4d99e16fcdb83d87454e1b6ab06862

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S04-questions-needing-answer.md#purpose; lines 15–15; ancestry ["S04 — Questions needing answer"].
Target: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#purpose; ancestry ["S04 — Questions needing answer"].
Source digest: 2ca84cac4e8d5b92cc126869e79508f40238182795f81ff98a7d18c2ed18d39b
Target digest: 2ca84cac4e8d5b92cc126869e79508f40238182795f81ff98a7d18c2ed18d39b
Shown source SHA256: b442651f2de9790c04e02d1c6f5b9cc87773d59fb41da3b106fcd1c6e793fc92
Shown target SHA256: b442651f2de9790c04e02d1c6f5b9cc87773d59fb41da3b106fcd1c6e793fc92

### Complete proposed decision

```json
{
  "claimId": "claim_7a4d99e16fcdb83d87454e1b6ab06862",
  "sourceUnitDigest": "2ca84cac4e8d5b92cc126869e79508f40238182795f81ff98a7d18c2ed18d39b",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md",
  "targetAnchor": "purpose",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S04-questions-needing-answer.md#purpose (source lines 15-15) is carried at docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#purpose (candidate lines 37-37). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S04-questions-needing-answer.md verbatim in docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "2ca84cac4e8d5b92cc126869e79508f40238182795f81ff98a7d18c2ed18d39b",
  "targetAncestry": [
    "S04 — Questions needing answer"
  ]
}
```

### Full source shown text

```text
## Purpose

One list of everything currently waiting on a person, across **both**
channels — `ask` questions and `gate-approve` questions (D4, and
`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point
is that these are one category to a person even though they are two
mechanisms to the engine, so this screen never splits them into two tabs.

It is the "is there anything for me" surface. On a phone it is often the
only screen a person opens.
```

### Full target shown text

```text
## Purpose

One list of everything currently waiting on a person, across **both**
channels — `ask` questions and `gate-approve` questions (D4, and
`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point
is that these are one category to a person even though they are two
mechanisms to the engine, so this screen never splits them into two tabs.

It is the "is there anything for me" surface. On a phone it is often the
only screen a person opens.
```

## claim_99de7a5a1f002e16db2bbcf68045d707

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-2; lines 17–21; ancestry ["S04 — Questions needing answer","Purpose"].
Target: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-4; ancestry ["S04 — Questions needing answer","Purpose"].
Source digest: eda037d21266247be1f0691c0af1f92f5682eb6431ca5a1d3db13f82bab8b2b6
Target digest: eda037d21266247be1f0691c0af1f92f5682eb6431ca5a1d3db13f82bab8b2b6
Shown source SHA256: eda037d21266247be1f0691c0af1f92f5682eb6431ca5a1d3db13f82bab8b2b6
Shown target SHA256: eda037d21266247be1f0691c0af1f92f5682eb6431ca5a1d3db13f82bab8b2b6

### Complete proposed decision

```json
{
  "claimId": "claim_99de7a5a1f002e16db2bbcf68045d707",
  "sourceUnitDigest": "eda037d21266247be1f0691c0af1f92f5682eb6431ca5a1d3db13f82bab8b2b6",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-2 (source lines 17-21) is carried at docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-4 (candidate lines 39-43). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S04-questions-needing-answer.md verbatim in docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "eda037d21266247be1f0691c0af1f92f5682eb6431ca5a1d3db13f82bab8b2b6",
  "targetAncestry": [
    "S04 — Questions needing answer",
    "Purpose"
  ]
}
```

### Full source shown text

```text
One list of everything currently waiting on a person, across **both**
channels — `ask` questions and `gate-approve` questions (D4, and
`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point
is that these are one category to a person even though they are two
mechanisms to the engine, so this screen never splits them into two tabs.
```

### Full target shown text

```text
One list of everything currently waiting on a person, across **both**
channels — `ask` questions and `gate-approve` questions (D4, and
`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point
is that these are one category to a person even though they are two
mechanisms to the engine, so this screen never splits them into two tabs.
```

## claim_6998a7b8301334cca30507533c23e493

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-3; lines 23–24; ancestry ["S04 — Questions needing answer","Purpose"].
Target: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-5; ancestry ["S04 — Questions needing answer","Purpose"].
Source digest: 7557c6339e87b867a3d0e076b1de35ca0b8e66e60c94a6bacd3a23a4ba5447a0
Target digest: 7557c6339e87b867a3d0e076b1de35ca0b8e66e60c94a6bacd3a23a4ba5447a0
Shown source SHA256: 7557c6339e87b867a3d0e076b1de35ca0b8e66e60c94a6bacd3a23a4ba5447a0
Shown target SHA256: 7557c6339e87b867a3d0e076b1de35ca0b8e66e60c94a6bacd3a23a4ba5447a0

### Complete proposed decision

```json
{
  "claimId": "claim_6998a7b8301334cca30507533c23e493",
  "sourceUnitDigest": "7557c6339e87b867a3d0e076b1de35ca0b8e66e60c94a6bacd3a23a4ba5447a0",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-3 (source lines 23-24) is carried at docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-5 (candidate lines 45-46). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S04-questions-needing-answer.md verbatim in docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7557c6339e87b867a3d0e076b1de35ca0b8e66e60c94a6bacd3a23a4ba5447a0",
  "targetAncestry": [
    "S04 — Questions needing answer",
    "Purpose"
  ]
}
```

### Full source shown text

```text
It is the "is there anything for me" surface. On a phone it is often the
only screen a person opens.
```

### Full target shown text

```text
It is the "is there anything for me" surface. On a phone it is often the
only screen a person opens.
```

## claim_70b933b970a27de52840bcda846835b0

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S04-questions-needing-answer.md#layout; lines 26–26; ancestry ["S04 — Questions needing answer"].
Target: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#layout; ancestry ["S04 — Questions needing answer"].
Source digest: d834276fd982b25e5f5f3f7a8b542a5ca475854dccd957af0d878cd02c84a624
Target digest: d834276fd982b25e5f5f3f7a8b542a5ca475854dccd957af0d878cd02c84a624
Shown source SHA256: c271ff809c89d6b7346f5fc325d26b6cc5b7aa24999e375863689a17e5812577
Shown target SHA256: c271ff809c89d6b7346f5fc325d26b6cc5b7aa24999e375863689a17e5812577

### Complete proposed decision

```json
{
  "claimId": "claim_70b933b970a27de52840bcda846835b0",
  "sourceUnitDigest": "d834276fd982b25e5f5f3f7a8b542a5ca475854dccd957af0d878cd02c84a624",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md",
  "targetAnchor": "layout",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S04-questions-needing-answer.md#layout (source lines 26-26) is carried at docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#layout (candidate lines 48-48). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S04-questions-needing-answer.md verbatim in docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "d834276fd982b25e5f5f3f7a8b542a5ca475854dccd957af0d878cd02c84a624",
  "targetAncestry": [
    "S04 — Questions needing answer"
  ]
}
```

### Full source shown text

````text
## Layout

```
┌ TOPBAR ────────────────────────────────────────────────────┐
│ ← Board   Needs answer · 2      ⚠ reachable on network     │
├ LIST ──────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐ │
│ │ tsk-4id · Task detail pairing            parked 2h ago │ │
│ │ ASK                                                    │ │
│ │ Which pairing key should the timeline use when         │ │
│ │ askHistory and settlements have drifted by one?        │ │
│ │                                    [ Answer ] [ Open ] │ │
│ └────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ tsk-k4v · Webserver core                 parked 6h ago │ │
│ │ GATE · validateApprove                                 │ │
│ │ Plan is ready and the reality gate passed. Two CSS     │ │
│ │ options are still standing — which one?                │ │
│ │                                    [ Answer ] [ Open ] │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

The channel shows as a small tag (`ASK` / `GATE · <gate name>`) rather
than as a section split. A person answering does not care which mechanism
parked the item; they care what is being asked. But the tag stays visible
because a gate question and an ask question have different weight, and
hiding that would be flattening real information.

**Each row carries the question text itself, not just the item title.**
That is the readability criterion applied at list level: a person should
be able to triage — "this one I can answer now, that one needs a laptop" —
without opening anything.

Rows are ordered oldest-first: the thing that has been waiting longest is
the thing most likely to be blocking something else.
````

### Full target shown text

````text
## Layout

```
┌ TOPBAR ────────────────────────────────────────────────────┐
│ ← Board   Needs answer · 2      ⚠ reachable on network     │
├ LIST ──────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐ │
│ │ tsk-4id · Task detail pairing            parked 2h ago │ │
│ │ ASK                                                    │ │
│ │ Which pairing key should the timeline use when         │ │
│ │ askHistory and settlements have drifted by one?        │ │
│ │                                    [ Answer ] [ Open ] │ │
│ └────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ tsk-k4v · Webserver core                 parked 6h ago │ │
│ │ GATE · validateApprove                                 │ │
│ │ Plan is ready and the reality gate passed. Two CSS     │ │
│ │ options are still standing — which one?                │ │
│ │                                    [ Answer ] [ Open ] │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

The channel shows as a small tag (`ASK` / `GATE · <gate name>`) rather
than as a section split. A person answering does not care which mechanism
parked the item; they care what is being asked. But the tag stays visible
because a gate question and an ask question have different weight, and
hiding that would be flattening real information.

**Each row carries the question text itself, not just the item title.**
That is the readability criterion applied at list level: a person should
be able to triage — "this one I can answer now, that one needs a laptop" —
without opening anything.

Rows are ordered oldest-first: the thing that has been waiting longest is
the thing most likely to be blocking something else.
````

## claim_228b96188da500e85ae818b66fe09233

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-4; lines 28–47; ancestry ["S04 — Questions needing answer","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-6; ancestry ["S04 — Questions needing answer","Layout"].
Source digest: 3c9936789761d321fdd43ad8661693f53d5243481db6bcce718ccae8616fbb3d
Target digest: 3c9936789761d321fdd43ad8661693f53d5243481db6bcce718ccae8616fbb3d
Shown source SHA256: 3c9936789761d321fdd43ad8661693f53d5243481db6bcce718ccae8616fbb3d
Shown target SHA256: 3c9936789761d321fdd43ad8661693f53d5243481db6bcce718ccae8616fbb3d

### Complete proposed decision

```json
{
  "claimId": "claim_228b96188da500e85ae818b66fe09233",
  "sourceUnitDigest": "3c9936789761d321fdd43ad8661693f53d5243481db6bcce718ccae8616fbb3d",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-4 (source lines 28-47) is carried at docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-6 (candidate lines 50-69). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S04-questions-needing-answer.md verbatim in docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3c9936789761d321fdd43ad8661693f53d5243481db6bcce718ccae8616fbb3d",
  "targetAncestry": [
    "S04 — Questions needing answer",
    "Layout"
  ]
}
```

### Full source shown text

````text
```
┌ TOPBAR ────────────────────────────────────────────────────┐
│ ← Board   Needs answer · 2      ⚠ reachable on network     │
├ LIST ──────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐ │
│ │ tsk-4id · Task detail pairing            parked 2h ago │ │
│ │ ASK                                                    │ │
│ │ Which pairing key should the timeline use when         │ │
│ │ askHistory and settlements have drifted by one?        │ │
│ │                                    [ Answer ] [ Open ] │ │
│ └────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ tsk-k4v · Webserver core                 parked 6h ago │ │
│ │ GATE · validateApprove                                 │ │
│ │ Plan is ready and the reality gate passed. Two CSS     │ │
│ │ options are still standing — which one?                │ │
│ │                                    [ Answer ] [ Open ] │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```
````

### Full target shown text

````text
```
┌ TOPBAR ────────────────────────────────────────────────────┐
│ ← Board   Needs answer · 2      ⚠ reachable on network     │
├ LIST ──────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐ │
│ │ tsk-4id · Task detail pairing            parked 2h ago │ │
│ │ ASK                                                    │ │
│ │ Which pairing key should the timeline use when         │ │
│ │ askHistory and settlements have drifted by one?        │ │
│ │                                    [ Answer ] [ Open ] │ │
│ └────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ tsk-k4v · Webserver core                 parked 6h ago │ │
│ │ GATE · validateApprove                                 │ │
│ │ Plan is ready and the reality gate passed. Two CSS     │ │
│ │ options are still standing — which one?                │ │
│ │                                    [ Answer ] [ Open ] │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```
````

## claim_d922400df0f2e4df9838ec9c5670c0df

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-5; lines 49–53; ancestry ["S04 — Questions needing answer","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-7; ancestry ["S04 — Questions needing answer","Layout"].
Source digest: cc6bae0c18965be51df7067ebc3df52dc68cb5b472f3569313b1a1c0fcb72b17
Target digest: cc6bae0c18965be51df7067ebc3df52dc68cb5b472f3569313b1a1c0fcb72b17
Shown source SHA256: cc6bae0c18965be51df7067ebc3df52dc68cb5b472f3569313b1a1c0fcb72b17
Shown target SHA256: cc6bae0c18965be51df7067ebc3df52dc68cb5b472f3569313b1a1c0fcb72b17

### Complete proposed decision

```json
{
  "claimId": "claim_d922400df0f2e4df9838ec9c5670c0df",
  "sourceUnitDigest": "cc6bae0c18965be51df7067ebc3df52dc68cb5b472f3569313b1a1c0fcb72b17",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-5 (source lines 49-53) is carried at docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-7 (candidate lines 71-75). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S04-questions-needing-answer.md verbatim in docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "cc6bae0c18965be51df7067ebc3df52dc68cb5b472f3569313b1a1c0fcb72b17",
  "targetAncestry": [
    "S04 — Questions needing answer",
    "Layout"
  ]
}
```

### Full source shown text

```text
The channel shows as a small tag (`ASK` / `GATE · <gate name>`) rather
than as a section split. A person answering does not care which mechanism
parked the item; they care what is being asked. But the tag stays visible
because a gate question and an ask question have different weight, and
hiding that would be flattening real information.
```

### Full target shown text

```text
The channel shows as a small tag (`ASK` / `GATE · <gate name>`) rather
than as a section split. A person answering does not care which mechanism
parked the item; they care what is being asked. But the tag stays visible
because a gate question and an ask question have different weight, and
hiding that would be flattening real information.
```

## claim_6765123fbb5f11ffe97a098154c0795e

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-6; lines 55–58; ancestry ["S04 — Questions needing answer","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-8; ancestry ["S04 — Questions needing answer","Layout"].
Source digest: c6d3f9804798de60b16fbf791ff2bd3ec040dbea5c62b73f278ffaf2a4fffba3
Target digest: c6d3f9804798de60b16fbf791ff2bd3ec040dbea5c62b73f278ffaf2a4fffba3
Shown source SHA256: c6d3f9804798de60b16fbf791ff2bd3ec040dbea5c62b73f278ffaf2a4fffba3
Shown target SHA256: c6d3f9804798de60b16fbf791ff2bd3ec040dbea5c62b73f278ffaf2a4fffba3

### Complete proposed decision

```json
{
  "claimId": "claim_6765123fbb5f11ffe97a098154c0795e",
  "sourceUnitDigest": "c6d3f9804798de60b16fbf791ff2bd3ec040dbea5c62b73f278ffaf2a4fffba3",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-6 (source lines 55-58) is carried at docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-8 (candidate lines 77-80). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S04-questions-needing-answer.md verbatim in docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c6d3f9804798de60b16fbf791ff2bd3ec040dbea5c62b73f278ffaf2a4fffba3",
  "targetAncestry": [
    "S04 — Questions needing answer",
    "Layout"
  ]
}
```

### Full source shown text

```text
**Each row carries the question text itself, not just the item title.**
That is the readability criterion applied at list level: a person should
be able to triage — "this one I can answer now, that one needs a laptop" —
without opening anything.
```

### Full target shown text

```text
**Each row carries the question text itself, not just the item title.**
That is the readability criterion applied at list level: a person should
be able to triage — "this one I can answer now, that one needs a laptop" —
without opening anything.
```

## claim_8c5e3f2968eb2cc04ee63b53168afadd

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-7; lines 60–61; ancestry ["S04 — Questions needing answer","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-9; ancestry ["S04 — Questions needing answer","Layout"].
Source digest: 286a6ef07e9dccf18b6dbfc9862944028af76b5663812f047c214da01a4b5db8
Target digest: 286a6ef07e9dccf18b6dbfc9862944028af76b5663812f047c214da01a4b5db8
Shown source SHA256: 286a6ef07e9dccf18b6dbfc9862944028af76b5663812f047c214da01a4b5db8
Shown target SHA256: 286a6ef07e9dccf18b6dbfc9862944028af76b5663812f047c214da01a4b5db8

### Complete proposed decision

```json
{
  "claimId": "claim_8c5e3f2968eb2cc04ee63b53168afadd",
  "sourceUnitDigest": "286a6ef07e9dccf18b6dbfc9862944028af76b5663812f047c214da01a4b5db8",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-7 (source lines 60-61) is carried at docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-9 (candidate lines 82-83). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S04-questions-needing-answer.md verbatim in docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "286a6ef07e9dccf18b6dbfc9862944028af76b5663812f047c214da01a4b5db8",
  "targetAncestry": [
    "S04 — Questions needing answer",
    "Layout"
  ]
}
```

### Full source shown text

```text
Rows are ordered oldest-first: the thing that has been waiting longest is
the thing most likely to be blocking something else.
```

### Full target shown text

```text
Rows are ordered oldest-first: the thing that has been waiting longest is
the thing most likely to be blocking something else.
```

## claim_a4f0b8d3ca1318b89d0c71aa9e4c801c

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S04-questions-needing-answer.md#states; lines 63–63; ancestry ["S04 — Questions needing answer"].
Target: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#states; ancestry ["S04 — Questions needing answer"].
Source digest: 7af70fa5a51d976c04b8b474782abea76cb3f6aca70f936111b8133caa058f79
Target digest: 7af70fa5a51d976c04b8b474782abea76cb3f6aca70f936111b8133caa058f79
Shown source SHA256: ee34fa1a335e597b08e3f0ec39252a3f340b734534dfa4bb8066b3efd8943b40
Shown target SHA256: ee34fa1a335e597b08e3f0ec39252a3f340b734534dfa4bb8066b3efd8943b40

### Complete proposed decision

```json
{
  "claimId": "claim_a4f0b8d3ca1318b89d0c71aa9e4c801c",
  "sourceUnitDigest": "7af70fa5a51d976c04b8b474782abea76cb3f6aca70f936111b8133caa058f79",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md",
  "targetAnchor": "states",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S04-questions-needing-answer.md#states (source lines 63-63) is carried at docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#states (candidate lines 85-85). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S04-questions-needing-answer.md verbatim in docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7af70fa5a51d976c04b8b474782abea76cb3f6aca70f936111b8133caa058f79",
  "targetAncestry": [
    "S04 — Questions needing answer"
  ]
}
```

### Full source shown text

```text
## States

- **ST-EMPTY-QUESTIONS** — "Nothing is waiting on you." Reads as the good
  outcome, with no error styling and no call to action.
- **ST-DISCONNECTED** — list marked stale, answer controls disabled.

Per R11 there is no bell and no badge that implies push. The count in the
topbar is true at the moment of looking, and the screen does not pretend
otherwise.
```

### Full target shown text

```text
## States

- **ST-EMPTY-QUESTIONS** — "Nothing is waiting on you." Reads as the good
  outcome, with no error styling and no call to action.
- **ST-DISCONNECTED** — list marked stale, answer controls disabled.

Per R11 there is no bell and no badge that implies push. The count in the
topbar is true at the moment of looking, and the screen does not pretend
otherwise.
```

## claim_4543fb352c50cbb81ce2c271062f7d25

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-8; lines 65–67; ancestry ["S04 — Questions needing answer","States"].
Target: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-10; ancestry ["S04 — Questions needing answer","States"].
Source digest: 18a084a1df6021dc90c5677b274a75f41401d3d50d2c9d373c5a039002c71531
Target digest: 18a084a1df6021dc90c5677b274a75f41401d3d50d2c9d373c5a039002c71531
Shown source SHA256: 18a084a1df6021dc90c5677b274a75f41401d3d50d2c9d373c5a039002c71531
Shown target SHA256: 18a084a1df6021dc90c5677b274a75f41401d3d50d2c9d373c5a039002c71531

### Complete proposed decision

```json
{
  "claimId": "claim_4543fb352c50cbb81ce2c271062f7d25",
  "sourceUnitDigest": "18a084a1df6021dc90c5677b274a75f41401d3d50d2c9d373c5a039002c71531",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md",
  "targetAnchor": "unheaded-block-10",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-8 (source lines 65-67) is carried at docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-10 (candidate lines 87-89). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S04-questions-needing-answer.md verbatim in docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "18a084a1df6021dc90c5677b274a75f41401d3d50d2c9d373c5a039002c71531",
  "targetAncestry": [
    "S04 — Questions needing answer",
    "States"
  ]
}
```

### Full source shown text

```text
- **ST-EMPTY-QUESTIONS** — "Nothing is waiting on you." Reads as the good
  outcome, with no error styling and no call to action.
- **ST-DISCONNECTED** — list marked stale, answer controls disabled.
```

### Full target shown text

```text
- **ST-EMPTY-QUESTIONS** — "Nothing is waiting on you." Reads as the good
  outcome, with no error styling and no call to action.
- **ST-DISCONNECTED** — list marked stale, answer controls disabled.
```

## claim_41441a240174152e1705db9f6a528bc3

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-9; lines 69–71; ancestry ["S04 — Questions needing answer","States"].
Target: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-11; ancestry ["S04 — Questions needing answer","States"].
Source digest: f211ef10b17e1b4dd9f4188b7fa36304aa092c6c66b555cb9c0f3055882979f5
Target digest: f211ef10b17e1b4dd9f4188b7fa36304aa092c6c66b555cb9c0f3055882979f5
Shown source SHA256: f211ef10b17e1b4dd9f4188b7fa36304aa092c6c66b555cb9c0f3055882979f5
Shown target SHA256: f211ef10b17e1b4dd9f4188b7fa36304aa092c6c66b555cb9c0f3055882979f5

### Complete proposed decision

```json
{
  "claimId": "claim_41441a240174152e1705db9f6a528bc3",
  "sourceUnitDigest": "f211ef10b17e1b4dd9f4188b7fa36304aa092c6c66b555cb9c0f3055882979f5",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md",
  "targetAnchor": "unheaded-block-11",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-9 (source lines 69-71) is carried at docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-11 (candidate lines 91-93). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S04-questions-needing-answer.md verbatim in docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f211ef10b17e1b4dd9f4188b7fa36304aa092c6c66b555cb9c0f3055882979f5",
  "targetAncestry": [
    "S04 — Questions needing answer",
    "States"
  ]
}
```

### Full source shown text

```text
Per R11 there is no bell and no badge that implies push. The count in the
topbar is true at the moment of looking, and the screen does not pretend
otherwise.
```

### Full target shown text

```text
Per R11 there is no bell and no badge that implies push. The count in the
topbar is true at the moment of looking, and the screen does not pretend
otherwise.
```

## claim_541edcbd2cfd7c2ea658c7f397fe9438

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S04-questions-needing-answer.md#interactions; lines 73–73; ancestry ["S04 — Questions needing answer"].
Target: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#interactions; ancestry ["S04 — Questions needing answer"].
Source digest: 89f373ee4271ea752919c224b60d2fa835a8c2bbf52584b998beed6fd313e374
Target digest: 89f373ee4271ea752919c224b60d2fa835a8c2bbf52584b998beed6fd313e374
Shown source SHA256: 72403db019b7ae6f7ec98c7e01941c8c082456a06ba92227f0c62128099d14e2
Shown target SHA256: 72403db019b7ae6f7ec98c7e01941c8c082456a06ba92227f0c62128099d14e2

### Complete proposed decision

```json
{
  "claimId": "claim_541edcbd2cfd7c2ea658c7f397fe9438",
  "sourceUnitDigest": "89f373ee4271ea752919c224b60d2fa835a8c2bbf52584b998beed6fd313e374",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md",
  "targetAnchor": "interactions",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S04-questions-needing-answer.md#interactions (source lines 73-73) is carried at docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#interactions (candidate lines 95-95). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S04-questions-needing-answer.md verbatim in docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "89f373ee4271ea752919c224b60d2fa835a8c2bbf52584b998beed6fd313e374",
  "targetAncestry": [
    "S04 — Questions needing answer"
  ]
}
```

### Full source shown text

````text
## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-S04-001
    element: answer_button
    region: list
    trigger: click
    action: open_overlay
    target: M01
    payload: { item_id: "$row.item_id" }
  - id: A-S04-002
    element: open_item_button
    region: list
    trigger: click
    action: navigate
    target: S03
    payload: { item_id: "$row.item_id" }
  - id: A-S04-003
    element: back_to_board
    region: topbar
    trigger: click
    action: navigate
    target: S02
  - id: A-S04-004
    element: list
    listens_to: question.opened
    action: mutate
    effects: [insert_row_oldest_first]
  - id: A-S04-005
    element: list
    listens_to: question.answered
    action: mutate
    effects: [remove_row]
  - id: A-S04-006
    element: list
    listens_to: gateway.unreachable
    action: mutate
    effects: [mark_stale, disable_writes]
```
````

### Full target shown text

````text
## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-S04-001
    element: answer_button
    region: list
    trigger: click
    action: open_overlay
    target: M01
    payload: { item_id: "$row.item_id" }
  - id: A-S04-002
    element: open_item_button
    region: list
    trigger: click
    action: navigate
    target: S03
    payload: { item_id: "$row.item_id" }
  - id: A-S04-003
    element: back_to_board
    region: topbar
    trigger: click
    action: navigate
    target: S02
  - id: A-S04-004
    element: list
    listens_to: question.opened
    action: mutate
    effects: [insert_row_oldest_first]
  - id: A-S04-005
    element: list
    listens_to: question.answered
    action: mutate
    effects: [remove_row]
  - id: A-S04-006
    element: list
    listens_to: gateway.unreachable
    action: mutate
    effects: [mark_stale, disable_writes]
```
````

## claim_3c3858b298aac0087ecce77ed003fd63

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-10; lines 75–112; ancestry ["S04 — Questions needing answer","Interactions"].
Target: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-12; ancestry ["S04 — Questions needing answer","Interactions"].
Source digest: 6779b6023c27123800d5f097b22f29fb334bc406514dab199240e9710996a477
Target digest: 6779b6023c27123800d5f097b22f29fb334bc406514dab199240e9710996a477
Shown source SHA256: 6779b6023c27123800d5f097b22f29fb334bc406514dab199240e9710996a477
Shown target SHA256: 6779b6023c27123800d5f097b22f29fb334bc406514dab199240e9710996a477

### Complete proposed decision

```json
{
  "claimId": "claim_3c3858b298aac0087ecce77ed003fd63",
  "sourceUnitDigest": "6779b6023c27123800d5f097b22f29fb334bc406514dab199240e9710996a477",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md",
  "targetAnchor": "unheaded-block-12",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S04-questions-needing-answer.md#unheaded-block-10 (source lines 75-112) is carried at docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#unheaded-block-12 (candidate lines 97-134). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S04-questions-needing-answer.md verbatim in docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6779b6023c27123800d5f097b22f29fb334bc406514dab199240e9710996a477",
  "targetAncestry": [
    "S04 — Questions needing answer",
    "Interactions"
  ]
}
```

### Full source shown text

````text
```yaml herdrweb-contract
interactions:
  - id: A-S04-001
    element: answer_button
    region: list
    trigger: click
    action: open_overlay
    target: M01
    payload: { item_id: "$row.item_id" }
  - id: A-S04-002
    element: open_item_button
    region: list
    trigger: click
    action: navigate
    target: S03
    payload: { item_id: "$row.item_id" }
  - id: A-S04-003
    element: back_to_board
    region: topbar
    trigger: click
    action: navigate
    target: S02
  - id: A-S04-004
    element: list
    listens_to: question.opened
    action: mutate
    effects: [insert_row_oldest_first]
  - id: A-S04-005
    element: list
    listens_to: question.answered
    action: mutate
    effects: [remove_row]
  - id: A-S04-006
    element: list
    listens_to: gateway.unreachable
    action: mutate
    effects: [mark_stale, disable_writes]
```
````

### Full target shown text

````text
```yaml herdrweb-contract
interactions:
  - id: A-S04-001
    element: answer_button
    region: list
    trigger: click
    action: open_overlay
    target: M01
    payload: { item_id: "$row.item_id" }
  - id: A-S04-002
    element: open_item_button
    region: list
    trigger: click
    action: navigate
    target: S03
    payload: { item_id: "$row.item_id" }
  - id: A-S04-003
    element: back_to_board
    region: topbar
    trigger: click
    action: navigate
    target: S02
  - id: A-S04-004
    element: list
    listens_to: question.opened
    action: mutate
    effects: [insert_row_oldest_first]
  - id: A-S04-005
    element: list
    listens_to: question.answered
    action: mutate
    effects: [remove_row]
  - id: A-S04-006
    element: list
    listens_to: gateway.unreachable
    action: mutate
    effects: [mark_stale, disable_writes]
```
````
