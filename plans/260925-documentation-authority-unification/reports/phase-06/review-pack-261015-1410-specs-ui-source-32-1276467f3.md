# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/screens/S03-task-detail.md
Part 1/1; entries: **24**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 6/6 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_b1381898ffcd6fd63e9e64586b7acd6c",
      "claim_4a7fc646586751db12885986313c0350",
      "claim_ba270fdaa4bfeec20ceb3f52d7434e6d",
      "claim_4fb38e3e862e3f8fb1353ca7f5c38c87",
      "claim_692e59d327dfdc4ac060b679ff60a8df",
      "claim_093b3e6a5b56f2219f9056058964c884",
      "claim_7c2b88b65ffc0692b8fe3d9751070b02",
      "claim_26c0a04e72c06c15be9a007f50fd312b",
      "claim_7b1759a49d26fd1dcc834b3f38bade04",
      "claim_8320314c57006644884f6d5f4edfc5bd",
      "claim_eb244fc0c4068fc1ab3c907db369a326",
      "claim_4abab9f7a787bead0ff5f1d162c2bd07",
      "claim_0295a9bbd34b084c523f0c057b5899da",
      "claim_e2969564bc033087099738ac927d2263",
      "claim_b391fc12268d78ddd19bf6a9f8f66656",
      "claim_9a2e11a231c97ddf61ceb228fed26010",
      "claim_73cab9a36191997438af84b13c76cf85",
      "claim_cb783b44a6284c43bbaac2e46c89026f"
    ],
    "Weak-exact": [
      "claim_74176d4e4289afc7fcaa8a4e6deaa014",
      "claim_2833db673d67cf600233251aac117628",
      "claim_b7bec6190021c6543edb08c12717fea6",
      "claim_a59c4971ef0276a190d1436f39614c63",
      "claim_0799ccec326a89dc36b6463e3a7d1699"
    ],
    "Judgment": [
      "claim_57fe165c28132a8679657bc25f8aad0b"
    ]
  },
  "unequalDigestPairs": [
    "claim_57fe165c28132a8679657bc25f8aad0b"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_57fe165c28132a8679657bc25f8aad0b"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_b1381898ffcd6fd63e9e64586b7acd6c

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#unheaded-block-1; lines 1–11; ancestry [].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-1; ancestry [].
Source digest: 3567e61162c801d95c3b42120f6527521b11318fccd623d43dded28f5d14645d
Target digest: 3567e61162c801d95c3b42120f6527521b11318fccd623d43dded28f5d14645d
Shown source SHA256: 3567e61162c801d95c3b42120f6527521b11318fccd623d43dded28f5d14645d
Shown target SHA256: 3567e61162c801d95c3b42120f6527521b11318fccd623d43dded28f5d14645d

### Complete proposed decision

```json
{
  "claimId": "claim_b1381898ffcd6fd63e9e64586b7acd6c",
  "sourceUnitDigest": "3567e61162c801d95c3b42120f6527521b11318fccd623d43dded28f5d14645d",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/ui-spec/screens/S03-task-detail.md#unheaded-block-1 (source lines 1-11) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-1 (candidate lines 1-11). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3567e61162c801d95c3b42120f6527521b11318fccd623d43dded28f5d14645d",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
id: S03
type: screen
name: "Task detail"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R1, R5, R7, R8, R9, R10]
regions: [topbar, question, why, context, timeline, actions]
---
```

### Full target shown text

```text
---
id: S03
type: screen
name: "Task detail"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R1, R5, R7, R8, R9, R10]
regions: [topbar, question, why, context, timeline, actions]
---
```

## claim_57fe165c28132a8679657bc25f8aad0b

Class: Judgment; mandatory deep: true.
Source: docs/ui-spec/screens/S03-task-detail.md#s03-task-detail; lines 13–13; ancestry [].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#s03-task-detail; ancestry [].
Source digest: 5ab3427e30e233452717da9a369d5e28d8c5c257b434f3d273b18e98ef9e57f5
Target digest: fc1c6f08523061fb099b0b259b952c6872be4d7cdf93376297dd191461c5f882
Shown source SHA256: a998afb84fb7b95aa5ed5ad1c9a44739b0ca677a332c0f0d05ef726b467df6bf
Shown target SHA256: 66257d0f341920a5f389752dd07466168a029a30a43b7917d6ece38b59f09680

### Complete proposed decision

```json
{
  "claimId": "claim_57fe165c28132a8679657bc25f8aad0b",
  "sourceUnitDigest": "5ab3427e30e233452717da9a369d5e28d8c5c257b434f3d273b18e98ef9e57f5",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "s03-task-detail",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/ui-spec/screens/S03-task-detail.md#s03-task-detail (source lines 13-13) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#s03-task-detail (candidate lines 13-13). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "fc1c6f08523061fb099b0b259b952c6872be4d7cdf93376297dd191461c5f882",
  "targetAncestry": []
}
```

### Full source shown text

```text
# S03 — Task detail
```

### Full target shown text

````text
# S03 — Task detail

```txt
Document type: Architecture
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/screens/S03-task-detail.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/ui-spec/screens/S03-task-detail.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.
````

## claim_74176d4e4289afc7fcaa8a4e6deaa014

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#purpose; lines 15–15; ancestry ["S03 — Task detail"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#purpose; ancestry ["S03 — Task detail"].
Source digest: 8e70f80a13bde941a81a989c9ca3ad71d671701b56f8c206c528335cd9659670
Target digest: 8e70f80a13bde941a81a989c9ca3ad71d671701b56f8c206c528335cd9659670
Shown source SHA256: e7f764dc8af59839707f8dc62df45188ffc386bafdb05d586b58a48c6225a930
Shown target SHA256: e7f764dc8af59839707f8dc62df45188ffc386bafdb05d586b58a48c6225a930

### Complete proposed decision

```json
{
  "claimId": "claim_74176d4e4289afc7fcaa8a4e6deaa014",
  "sourceUnitDigest": "8e70f80a13bde941a81a989c9ca3ad71d671701b56f8c206c528335cd9659670",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "purpose",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S03-task-detail.md#purpose (source lines 15-15) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#purpose (candidate lines 37-37). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "8e70f80a13bde941a81a989c9ca3ad71d671701b56f8c206c528335cd9659670",
  "targetAncestry": [
    "S03 — Task detail"
  ]
}
```

### Full source shown text

```text
## Purpose

**The core deliverable of the whole cluster.** The area spec says the
taskboard exists mainly to reach this screen
(`docs/specs/herdr-web-dashboard.md` §View a task's detail).

The acceptance criterion is subjective and stated plainly in the item that
commissioned this spec: *a question framed so a person with no context in
their head can answer it quickly*. That sentence is the whole design
brief. Everything below is downstream of it, and it is why the layout
leads with the question rather than with the item.
```

### Full target shown text

```text
## Purpose

**The core deliverable of the whole cluster.** The area spec says the
taskboard exists mainly to reach this screen
(`docs/specs/herdr-web-dashboard.md` §View a task's detail).

The acceptance criterion is subjective and stated plainly in the item that
commissioned this spec: *a question framed so a person with no context in
their head can answer it quickly*. That sentence is the whole design
brief. Everything below is downstream of it, and it is why the layout
leads with the question rather than with the item.
```

## claim_4a7fc646586751db12885986313c0350

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#unheaded-block-2; lines 17–19; ancestry ["S03 — Task detail","Purpose"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-4; ancestry ["S03 — Task detail","Purpose"].
Source digest: e5a061704919c09652d5d54bfeb63372e4172bf04727b1697c175ef6f895b376
Target digest: e5a061704919c09652d5d54bfeb63372e4172bf04727b1697c175ef6f895b376
Shown source SHA256: e5a061704919c09652d5d54bfeb63372e4172bf04727b1697c175ef6f895b376
Shown target SHA256: e5a061704919c09652d5d54bfeb63372e4172bf04727b1697c175ef6f895b376

### Complete proposed decision

```json
{
  "claimId": "claim_4a7fc646586751db12885986313c0350",
  "sourceUnitDigest": "e5a061704919c09652d5d54bfeb63372e4172bf04727b1697c175ef6f895b376",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S03-task-detail.md#unheaded-block-2 (source lines 17-19) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-4 (candidate lines 39-41). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "e5a061704919c09652d5d54bfeb63372e4172bf04727b1697c175ef6f895b376",
  "targetAncestry": [
    "S03 — Task detail",
    "Purpose"
  ]
}
```

### Full source shown text

```text
**The core deliverable of the whole cluster.** The area spec says the
taskboard exists mainly to reach this screen
(`docs/specs/herdr-web-dashboard.md` §View a task's detail).
```

### Full target shown text

```text
**The core deliverable of the whole cluster.** The area spec says the
taskboard exists mainly to reach this screen
(`docs/specs/herdr-web-dashboard.md` §View a task's detail).
```

## claim_ba270fdaa4bfeec20ceb3f52d7434e6d

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#unheaded-block-3; lines 21–25; ancestry ["S03 — Task detail","Purpose"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-5; ancestry ["S03 — Task detail","Purpose"].
Source digest: 1ae9f696b585e22dc8277c99e20f55fbd09dde300571f51948fb4acc8e087cce
Target digest: 1ae9f696b585e22dc8277c99e20f55fbd09dde300571f51948fb4acc8e087cce
Shown source SHA256: 1ae9f696b585e22dc8277c99e20f55fbd09dde300571f51948fb4acc8e087cce
Shown target SHA256: 1ae9f696b585e22dc8277c99e20f55fbd09dde300571f51948fb4acc8e087cce

### Complete proposed decision

```json
{
  "claimId": "claim_ba270fdaa4bfeec20ceb3f52d7434e6d",
  "sourceUnitDigest": "1ae9f696b585e22dc8277c99e20f55fbd09dde300571f51948fb4acc8e087cce",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S03-task-detail.md#unheaded-block-3 (source lines 21-25) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-5 (candidate lines 43-47). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "1ae9f696b585e22dc8277c99e20f55fbd09dde300571f51948fb4acc8e087cce",
  "targetAncestry": [
    "S03 — Task detail",
    "Purpose"
  ]
}
```

### Full source shown text

```text
The acceptance criterion is subjective and stated plainly in the item that
commissioned this spec: *a question framed so a person with no context in
their head can answer it quickly*. That sentence is the whole design
brief. Everything below is downstream of it, and it is why the layout
leads with the question rather than with the item.
```

### Full target shown text

```text
The acceptance criterion is subjective and stated plainly in the item that
commissioned this spec: *a question framed so a person with no context in
their head can answer it quickly*. That sentence is the whole design
brief. Everything below is downstream of it, and it is why the layout
leads with the question rather than with the item.
```

## claim_2833db673d67cf600233251aac117628

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#layout; lines 27–27; ancestry ["S03 — Task detail"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#layout; ancestry ["S03 — Task detail"].
Source digest: f1c2ffc9a487b9f31419cb06961dd2e25f746de2aa4db30b780c0ce5ca520daa
Target digest: f1c2ffc9a487b9f31419cb06961dd2e25f746de2aa4db30b780c0ce5ca520daa
Shown source SHA256: 05005e1a8c0c54bb9871c469cbf6bcd6afac5154fa2ac510c3730f8652442bfe
Shown target SHA256: 05005e1a8c0c54bb9871c469cbf6bcd6afac5154fa2ac510c3730f8652442bfe

### Complete proposed decision

```json
{
  "claimId": "claim_2833db673d67cf600233251aac117628",
  "sourceUnitDigest": "f1c2ffc9a487b9f31419cb06961dd2e25f746de2aa4db30b780c0ce5ca520daa",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "layout",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S03-task-detail.md#layout (source lines 27-27) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#layout (candidate lines 49-49). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f1c2ffc9a487b9f31419cb06961dd2e25f746de2aa4db30b780c0ce5ca520daa",
  "targetAncestry": [
    "S03 — Task detail"
  ]
}
```

### Full source shown text

````text
## Layout

Three regions, in a fixed reading order, because the order **is** the
design: what is being asked → why it is being asked → what it is about.

```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ ← Board    tsk-4id · Task detail pairing        ⚠ reachable on network │
├ QUESTION ──────────────────────────────────────────────────────────────┤
│                                                                        │
│  NEEDS YOUR ANSWER · parked 2h ago · round 3 of 3                      │
│                                                                        │
│  Which pairing key should the timeline use when askHistory and         │
│  settlements have drifted by one?                                      │
│                                                                        │
│  [ Answer this ]                                                       │
│                                                                        │
├ WHY ───────────────────────────────────────────────────────────────────┤
│  Why you're being asked                                                │
│  Two options are still standing after a real comparison, and the       │
│  locked decision (D2) deliberately added no linking key.               │
│  Tried already: read D2, ran the pairing on tsk-48i's 23/23 records.   │
├ CONTEXT ───────────────────────────────────┬ TIMELINE ─────────────────┤
│  What this item is                         │  round 1 · 4d ago         │
│                                            │  Q  Should the detail     │
│  tsk-4id · Task detail pairing             │     screen show the       │
│  ● awaiting-human · executing · high-risk  │     machine log at all?   │
│  coding · tier-2 · deps: tsk-yo0, tsk-5jr  │  A  No — narrative first. │
│                                            │                          │
│  A person with no context in their head    │  round 2 · 2d ago         │
│  should be able to answer the parked       │  Q  Collapse or omit?     │
│  question quickly, from this screen alone. │  A  Collapse.             │
│  (full description, not truncated)         │                          │
│                                            │  round 3 · 2h ago         │
│  verify: cd herdr-plugin && cargo test     │  Q  Which pairing key…    │
│  --lib gateway && cd web && npm run test   │  A  — waiting             │
│  footprint: gateway.rs, TaskDetail.tsx     │                          │
│  docsRef: docs/history/tsk-4id ↗           │                          │
│                                            │                          │
│  What the agent did                        │                          │
│  Read ports.rs, confirmed WorkItemSource   │                          │
│  has 5 fetch_* methods. Wrote the pairing  │                          │
│  read on top of settlements[] ordered by   │                          │
│  seq, no schema change (D2).               │                          │
│                                            │                          │
│  ▸ Machine decision log (12)               │                          │
├ ACTIONS ───────────────────────────────────┴──────────────────────────┤
│  [ Answer this ]   [ Edit ]   [ Retire ]      [ Approve merge ⓘ ]     │
└────────────────────────────────────────────────────────────────────────┘
```

Mobile stacks the same order — question, why, context, timeline — because
the order is the value, not the columns. The timeline collapses to its
most recent round with "show 2 earlier rounds".
````

### Full target shown text

````text
## Layout

Three regions, in a fixed reading order, because the order **is** the
design: what is being asked → why it is being asked → what it is about.

```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ ← Board    tsk-4id · Task detail pairing        ⚠ reachable on network │
├ QUESTION ──────────────────────────────────────────────────────────────┤
│                                                                        │
│  NEEDS YOUR ANSWER · parked 2h ago · round 3 of 3                      │
│                                                                        │
│  Which pairing key should the timeline use when askHistory and         │
│  settlements have drifted by one?                                      │
│                                                                        │
│  [ Answer this ]                                                       │
│                                                                        │
├ WHY ───────────────────────────────────────────────────────────────────┤
│  Why you're being asked                                                │
│  Two options are still standing after a real comparison, and the       │
│  locked decision (D2) deliberately added no linking key.               │
│  Tried already: read D2, ran the pairing on tsk-48i's 23/23 records.   │
├ CONTEXT ───────────────────────────────────┬ TIMELINE ─────────────────┤
│  What this item is                         │  round 1 · 4d ago         │
│                                            │  Q  Should the detail     │
│  tsk-4id · Task detail pairing             │     screen show the       │
│  ● awaiting-human · executing · high-risk  │     machine log at all?   │
│  coding · tier-2 · deps: tsk-yo0, tsk-5jr  │  A  No — narrative first. │
│                                            │                          │
│  A person with no context in their head    │  round 2 · 2d ago         │
│  should be able to answer the parked       │  Q  Collapse or omit?     │
│  question quickly, from this screen alone. │  A  Collapse.             │
│  (full description, not truncated)         │                          │
│                                            │  round 3 · 2h ago         │
│  verify: cd herdr-plugin && cargo test     │  Q  Which pairing key…    │
│  --lib gateway && cd web && npm run test   │  A  — waiting             │
│  footprint: gateway.rs, TaskDetail.tsx     │                          │
│  docsRef: docs/history/tsk-4id ↗           │                          │
│                                            │                          │
│  What the agent did                        │                          │
│  Read ports.rs, confirmed WorkItemSource   │                          │
│  has 5 fetch_* methods. Wrote the pairing  │                          │
│  read on top of settlements[] ordered by   │                          │
│  seq, no schema change (D2).               │                          │
│                                            │                          │
│  ▸ Machine decision log (12)               │                          │
├ ACTIONS ───────────────────────────────────┴──────────────────────────┤
│  [ Answer this ]   [ Edit ]   [ Retire ]      [ Approve merge ⓘ ]     │
└────────────────────────────────────────────────────────────────────────┘
```

Mobile stacks the same order — question, why, context, timeline — because
the order is the value, not the columns. The timeline collapses to its
most recent round with "show 2 earlier rounds".
````

## claim_4fb38e3e862e3f8fb1353ca7f5c38c87

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#unheaded-block-4; lines 29–30; ancestry ["S03 — Task detail","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-6; ancestry ["S03 — Task detail","Layout"].
Source digest: 606f6a0016df5a909d44d0f75366ef2bf776b57ef7b47081b1ceab0cd79d23c3
Target digest: 606f6a0016df5a909d44d0f75366ef2bf776b57ef7b47081b1ceab0cd79d23c3
Shown source SHA256: 606f6a0016df5a909d44d0f75366ef2bf776b57ef7b47081b1ceab0cd79d23c3
Shown target SHA256: 606f6a0016df5a909d44d0f75366ef2bf776b57ef7b47081b1ceab0cd79d23c3

### Complete proposed decision

```json
{
  "claimId": "claim_4fb38e3e862e3f8fb1353ca7f5c38c87",
  "sourceUnitDigest": "606f6a0016df5a909d44d0f75366ef2bf776b57ef7b47081b1ceab0cd79d23c3",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S03-task-detail.md#unheaded-block-4 (source lines 29-30) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-6 (candidate lines 51-52). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "606f6a0016df5a909d44d0f75366ef2bf776b57ef7b47081b1ceab0cd79d23c3",
  "targetAncestry": [
    "S03 — Task detail",
    "Layout"
  ]
}
```

### Full source shown text

```text
Three regions, in a fixed reading order, because the order **is** the
design: what is being asked → why it is being asked → what it is about.
```

### Full target shown text

```text
Three regions, in a fixed reading order, because the order **is** the
design: what is being asked → why it is being asked → what it is about.
```

## claim_692e59d327dfdc4ac060b679ff60a8df

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#unheaded-block-5; lines 32–76; ancestry ["S03 — Task detail","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-7; ancestry ["S03 — Task detail","Layout"].
Source digest: 2f7ba97eab08768fccbc32a6b3edcbebeb7449cc07753e516da2cd883d52f3f2
Target digest: 2f7ba97eab08768fccbc32a6b3edcbebeb7449cc07753e516da2cd883d52f3f2
Shown source SHA256: 2f7ba97eab08768fccbc32a6b3edcbebeb7449cc07753e516da2cd883d52f3f2
Shown target SHA256: 2f7ba97eab08768fccbc32a6b3edcbebeb7449cc07753e516da2cd883d52f3f2

### Complete proposed decision

```json
{
  "claimId": "claim_692e59d327dfdc4ac060b679ff60a8df",
  "sourceUnitDigest": "2f7ba97eab08768fccbc32a6b3edcbebeb7449cc07753e516da2cd883d52f3f2",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S03-task-detail.md#unheaded-block-5 (source lines 32-76) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-7 (candidate lines 54-98). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "2f7ba97eab08768fccbc32a6b3edcbebeb7449cc07753e516da2cd883d52f3f2",
  "targetAncestry": [
    "S03 — Task detail",
    "Layout"
  ]
}
```

### Full source shown text

````text
```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ ← Board    tsk-4id · Task detail pairing        ⚠ reachable on network │
├ QUESTION ──────────────────────────────────────────────────────────────┤
│                                                                        │
│  NEEDS YOUR ANSWER · parked 2h ago · round 3 of 3                      │
│                                                                        │
│  Which pairing key should the timeline use when askHistory and         │
│  settlements have drifted by one?                                      │
│                                                                        │
│  [ Answer this ]                                                       │
│                                                                        │
├ WHY ───────────────────────────────────────────────────────────────────┤
│  Why you're being asked                                                │
│  Two options are still standing after a real comparison, and the       │
│  locked decision (D2) deliberately added no linking key.               │
│  Tried already: read D2, ran the pairing on tsk-48i's 23/23 records.   │
├ CONTEXT ───────────────────────────────────┬ TIMELINE ─────────────────┤
│  What this item is                         │  round 1 · 4d ago         │
│                                            │  Q  Should the detail     │
│  tsk-4id · Task detail pairing             │     screen show the       │
│  ● awaiting-human · executing · high-risk  │     machine log at all?   │
│  coding · tier-2 · deps: tsk-yo0, tsk-5jr  │  A  No — narrative first. │
│                                            │                          │
│  A person with no context in their head    │  round 2 · 2d ago         │
│  should be able to answer the parked       │  Q  Collapse or omit?     │
│  question quickly, from this screen alone. │  A  Collapse.             │
│  (full description, not truncated)         │                          │
│                                            │  round 3 · 2h ago         │
│  verify: cd herdr-plugin && cargo test     │  Q  Which pairing key…    │
│  --lib gateway && cd web && npm run test   │  A  — waiting             │
│  footprint: gateway.rs, TaskDetail.tsx     │                          │
│  docsRef: docs/history/tsk-4id ↗           │                          │
│                                            │                          │
│  What the agent did                        │                          │
│  Read ports.rs, confirmed WorkItemSource   │                          │
│  has 5 fetch_* methods. Wrote the pairing  │                          │
│  read on top of settlements[] ordered by   │                          │
│  seq, no schema change (D2).               │                          │
│                                            │                          │
│  ▸ Machine decision log (12)               │                          │
├ ACTIONS ───────────────────────────────────┴──────────────────────────┤
│  [ Answer this ]   [ Edit ]   [ Retire ]      [ Approve merge ⓘ ]     │
└────────────────────────────────────────────────────────────────────────┘
```
````

### Full target shown text

````text
```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ ← Board    tsk-4id · Task detail pairing        ⚠ reachable on network │
├ QUESTION ──────────────────────────────────────────────────────────────┤
│                                                                        │
│  NEEDS YOUR ANSWER · parked 2h ago · round 3 of 3                      │
│                                                                        │
│  Which pairing key should the timeline use when askHistory and         │
│  settlements have drifted by one?                                      │
│                                                                        │
│  [ Answer this ]                                                       │
│                                                                        │
├ WHY ───────────────────────────────────────────────────────────────────┤
│  Why you're being asked                                                │
│  Two options are still standing after a real comparison, and the       │
│  locked decision (D2) deliberately added no linking key.               │
│  Tried already: read D2, ran the pairing on tsk-48i's 23/23 records.   │
├ CONTEXT ───────────────────────────────────┬ TIMELINE ─────────────────┤
│  What this item is                         │  round 1 · 4d ago         │
│                                            │  Q  Should the detail     │
│  tsk-4id · Task detail pairing             │     screen show the       │
│  ● awaiting-human · executing · high-risk  │     machine log at all?   │
│  coding · tier-2 · deps: tsk-yo0, tsk-5jr  │  A  No — narrative first. │
│                                            │                          │
│  A person with no context in their head    │  round 2 · 2d ago         │
│  should be able to answer the parked       │  Q  Collapse or omit?     │
│  question quickly, from this screen alone. │  A  Collapse.             │
│  (full description, not truncated)         │                          │
│                                            │  round 3 · 2h ago         │
│  verify: cd herdr-plugin && cargo test     │  Q  Which pairing key…    │
│  --lib gateway && cd web && npm run test   │  A  — waiting             │
│  footprint: gateway.rs, TaskDetail.tsx     │                          │
│  docsRef: docs/history/tsk-4id ↗           │                          │
│                                            │                          │
│  What the agent did                        │                          │
│  Read ports.rs, confirmed WorkItemSource   │                          │
│  has 5 fetch_* methods. Wrote the pairing  │                          │
│  read on top of settlements[] ordered by   │                          │
│  seq, no schema change (D2).               │                          │
│                                            │                          │
│  ▸ Machine decision log (12)               │                          │
├ ACTIONS ───────────────────────────────────┴──────────────────────────┤
│  [ Answer this ]   [ Edit ]   [ Retire ]      [ Approve merge ⓘ ]     │
└────────────────────────────────────────────────────────────────────────┘
```
````

## claim_093b3e6a5b56f2219f9056058964c884

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#unheaded-block-6; lines 78–80; ancestry ["S03 — Task detail","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-8; ancestry ["S03 — Task detail","Layout"].
Source digest: 5011f46096ff98b1d5c0ce491fe5d75a52de5db059d305c8082096da2b8b930d
Target digest: 5011f46096ff98b1d5c0ce491fe5d75a52de5db059d305c8082096da2b8b930d
Shown source SHA256: 5011f46096ff98b1d5c0ce491fe5d75a52de5db059d305c8082096da2b8b930d
Shown target SHA256: 5011f46096ff98b1d5c0ce491fe5d75a52de5db059d305c8082096da2b8b930d

### Complete proposed decision

```json
{
  "claimId": "claim_093b3e6a5b56f2219f9056058964c884",
  "sourceUnitDigest": "5011f46096ff98b1d5c0ce491fe5d75a52de5db059d305c8082096da2b8b930d",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S03-task-detail.md#unheaded-block-6 (source lines 78-80) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-8 (candidate lines 100-102). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "5011f46096ff98b1d5c0ce491fe5d75a52de5db059d305c8082096da2b8b930d",
  "targetAncestry": [
    "S03 — Task detail",
    "Layout"
  ]
}
```

### Full source shown text

```text
Mobile stacks the same order — question, why, context, timeline — because
the order is the value, not the columns. The timeline collapses to its
most recent round with "show 2 earlier rounds".
```

### Full target shown text

```text
Mobile stacks the same order — question, why, context, timeline — because
the order is the value, not the columns. The timeline collapses to its
most recent round with "show 2 earlier rounds".
```

## claim_7c2b88b65ffc0692b8fe3d9751070b02

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#why-the-three-regions-sit-in-this-order; lines 82–82; ancestry ["S03 — Task detail","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#why-the-three-regions-sit-in-this-order; ancestry ["S03 — Task detail","Layout"].
Source digest: 912c6946a895c279ae9ff495722a7afd0eb2905de2f117c5e3c6f7a98a7a27b1
Target digest: 912c6946a895c279ae9ff495722a7afd0eb2905de2f117c5e3c6f7a98a7a27b1
Shown source SHA256: 278877fd42907d851cc2b8a324f90fb28cd013c499e05bbdb72e2324fea3d4aa
Shown target SHA256: 278877fd42907d851cc2b8a324f90fb28cd013c499e05bbdb72e2324fea3d4aa

### Complete proposed decision

```json
{
  "claimId": "claim_7c2b88b65ffc0692b8fe3d9751070b02",
  "sourceUnitDigest": "912c6946a895c279ae9ff495722a7afd0eb2905de2f117c5e3c6f7a98a7a27b1",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "why-the-three-regions-sit-in-this-order",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole heading unit docs/ui-spec/screens/S03-task-detail.md#why-the-three-regions-sit-in-this-order (source lines 82-82) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#why-the-three-regions-sit-in-this-order (candidate lines 104-104). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "912c6946a895c279ae9ff495722a7afd0eb2905de2f117c5e3c6f7a98a7a27b1",
  "targetAncestry": [
    "S03 — Task detail",
    "Layout"
  ]
}
```

### Full source shown text

```text
### Why the three regions sit in this order

- **QUESTION first, alone, large.** A person arriving cold reads one
  thing. Putting item metadata above it would make them scroll past
  bookkeeping to reach the only thing that needs them.
- **WHY second, and it carries what was already tried.** This is the
  difference between a question a person can answer in ten seconds and one
  they have to go investigate. It names the options still standing and the
  work already done — so the person is editing reasoning, not starting
  from nothing.
- **CONTEXT third, narrative before machine log.** R10 exactly: the human
  narrative is the primary account, the machine decision log renders
  collapsed behind a disclosure showing its count.
```

### Full target shown text

```text
### Why the three regions sit in this order

- **QUESTION first, alone, large.** A person arriving cold reads one
  thing. Putting item metadata above it would make them scroll past
  bookkeeping to reach the only thing that needs them.
- **WHY second, and it carries what was already tried.** This is the
  difference between a question a person can answer in ten seconds and one
  they have to go investigate. It names the options still standing and the
  work already done — so the person is editing reasoning, not starting
  from nothing.
- **CONTEXT third, narrative before machine log.** R10 exactly: the human
  narrative is the primary account, the machine decision log renders
  collapsed behind a disclosure showing its count.
```

## claim_26c0a04e72c06c15be9a007f50fd312b

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#unheaded-block-7; lines 84–94; ancestry ["S03 — Task detail","Layout","Why the three regions sit in this order"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-9; ancestry ["S03 — Task detail","Layout","Why the three regions sit in this order"].
Source digest: b68da59feac0406607b0751d67e0a3d2951a328011e0070a80ebb1cabf05efc3
Target digest: b68da59feac0406607b0751d67e0a3d2951a328011e0070a80ebb1cabf05efc3
Shown source SHA256: b68da59feac0406607b0751d67e0a3d2951a328011e0070a80ebb1cabf05efc3
Shown target SHA256: b68da59feac0406607b0751d67e0a3d2951a328011e0070a80ebb1cabf05efc3

### Complete proposed decision

```json
{
  "claimId": "claim_26c0a04e72c06c15be9a007f50fd312b",
  "sourceUnitDigest": "b68da59feac0406607b0751d67e0a3d2951a328011e0070a80ebb1cabf05efc3",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S03-task-detail.md#unheaded-block-7 (source lines 84-94) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-9 (candidate lines 106-116). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b68da59feac0406607b0751d67e0a3d2951a328011e0070a80ebb1cabf05efc3",
  "targetAncestry": [
    "S03 — Task detail",
    "Layout",
    "Why the three regions sit in this order"
  ]
}
```

### Full source shown text

```text
- **QUESTION first, alone, large.** A person arriving cold reads one
  thing. Putting item metadata above it would make them scroll past
  bookkeeping to reach the only thing that needs them.
- **WHY second, and it carries what was already tried.** This is the
  difference between a question a person can answer in ten seconds and one
  they have to go investigate. It names the options still standing and the
  work already done — so the person is editing reasoning, not starting
  from nothing.
- **CONTEXT third, narrative before machine log.** R10 exactly: the human
  narrative is the primary account, the machine decision log renders
  collapsed behind a disclosure showing its count.
```

### Full target shown text

```text
- **QUESTION first, alone, large.** A person arriving cold reads one
  thing. Putting item metadata above it would make them scroll past
  bookkeeping to reach the only thing that needs them.
- **WHY second, and it carries what was already tried.** This is the
  difference between a question a person can answer in ten seconds and one
  they have to go investigate. It names the options still standing and the
  work already done — so the person is editing reasoning, not starting
  from nothing.
- **CONTEXT third, narrative before machine log.** R10 exactly: the human
  narrative is the primary account, the machine decision log renders
  collapsed behind a disclosure showing its count.
```

## claim_b7bec6190021c6543edb08c12717fea6

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#what-context-actually-shows-d17; lines 96–96; ancestry ["S03 — Task detail","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#what-context-actually-shows-d17; ancestry ["S03 — Task detail","Layout"].
Source digest: 9542d216b781deb7ab31a504a5a3fbb10c1dba64b258e360234962c51992f10a
Target digest: 9542d216b781deb7ab31a504a5a3fbb10c1dba64b258e360234962c51992f10a
Shown source SHA256: 1c30f27e0b94398471cf5cc0f8e6b1c4317943a3c169b98d83387f1312b63a16
Shown target SHA256: 1c30f27e0b94398471cf5cc0f8e6b1c4317943a3c169b98d83387f1312b63a16

### Complete proposed decision

```json
{
  "claimId": "claim_b7bec6190021c6543edb08c12717fea6",
  "sourceUnitDigest": "9542d216b781deb7ab31a504a5a3fbb10c1dba64b258e360234962c51992f10a",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "what-context-actually-shows-d17",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S03-task-detail.md#what-context-actually-shows-d17 (source lines 96-96) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#what-context-actually-shows-d17 (candidate lines 118-118). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "9542d216b781deb7ab31a504a5a3fbb10c1dba64b258e360234962c51992f10a",
  "targetAncestry": [
    "S03 — Task detail",
    "Layout"
  ]
}
```

### Full source shown text

```text
### What CONTEXT actually shows (D17)

`GET /work/{id}`'s `work` object (the `WorkItem` schema,
`docs/contracts/fgos-gateway-api-v1.yaml`) carries more than the id/title/
status this screen showed before D17 — CONTEXT surfaces the full set that
is meaningful to a person deciding whether to trust the answer they are
about to give, in this order:

- **Identity line** — `id`, `title`.
- **State pills** — `status`, `stage`, `risk` (as already shown).
- **Classification line** — `domain`, `tier`, and `deps` (as item ids; a
  person weighing an answer needs to know what else is waiting on this
  one). `parent` renders here too when non-null.
- **`description`** — the item's own full text, never truncated. This is
  new: before D17 the acceptance-criterion sentence quoted in this
  screen's own Purpose section ("a question framed so a person with no
  context in their head can answer it quickly") had no `description` field
  to draw on, which was the actual gap a person noticed live (2026-08-15).
- **`verify`** — the real command that proves this item done, shown
  verbatim (a monospace line, not summarized) so a person can judge
  whether the item's own bar for "done" matches what the question is
  asking them to approve.
- **`footprint`** — the files this item touches, as a short list.
- **`docsRef`** when non-null — a link to `GET /work/{id}/docs` (tsk-4id),
  for the rare case CONTEXT's own summary is not enough and a person wants
  the full plan/CONTEXT.md.

Then, unchanged from before D17: **"What the agent did"** (the narrative
account) and the collapsed **machine decision log** disclosure.

Fields the `WorkItem` schema carries that CONTEXT deliberately does NOT
surface here: `kind` (redundant with `domain` for a person, not a new
fact), `parent` when null. Nothing here is fabricated from a placeholder —
every field above is a real `WorkItem` property with a $ref in the
contract; a field that is absent/null on a given item simply does not
render its row, the same convention `docsRef` already used before D17.
```

### Full target shown text

```text
### What CONTEXT actually shows (D17)

`GET /work/{id}`'s `work` object (the `WorkItem` schema,
`docs/contracts/fgos-gateway-api-v1.yaml`) carries more than the id/title/
status this screen showed before D17 — CONTEXT surfaces the full set that
is meaningful to a person deciding whether to trust the answer they are
about to give, in this order:

- **Identity line** — `id`, `title`.
- **State pills** — `status`, `stage`, `risk` (as already shown).
- **Classification line** — `domain`, `tier`, and `deps` (as item ids; a
  person weighing an answer needs to know what else is waiting on this
  one). `parent` renders here too when non-null.
- **`description`** — the item's own full text, never truncated. This is
  new: before D17 the acceptance-criterion sentence quoted in this
  screen's own Purpose section ("a question framed so a person with no
  context in their head can answer it quickly") had no `description` field
  to draw on, which was the actual gap a person noticed live (2026-08-15).
- **`verify`** — the real command that proves this item done, shown
  verbatim (a monospace line, not summarized) so a person can judge
  whether the item's own bar for "done" matches what the question is
  asking them to approve.
- **`footprint`** — the files this item touches, as a short list.
- **`docsRef`** when non-null — a link to `GET /work/{id}/docs` (tsk-4id),
  for the rare case CONTEXT's own summary is not enough and a person wants
  the full plan/CONTEXT.md.

Then, unchanged from before D17: **"What the agent did"** (the narrative
account) and the collapsed **machine decision log** disclosure.

Fields the `WorkItem` schema carries that CONTEXT deliberately does NOT
surface here: `kind` (redundant with `domain` for a person, not a new
fact), `parent` when null. Nothing here is fabricated from a placeholder —
every field above is a real `WorkItem` property with a $ref in the
contract; a field that is absent/null on a given item simply does not
render its row, the same convention `docsRef` already used before D17.
```

## claim_7b1759a49d26fd1dcc834b3f38bade04

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#unheaded-block-8; lines 98–102; ancestry ["S03 — Task detail","Layout","What CONTEXT actually shows (D17)"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-10; ancestry ["S03 — Task detail","Layout","What CONTEXT actually shows (D17)"].
Source digest: df88b650b1482175d2fb5e47624cd391af36bb52cc3f31aa67f8874a7ab75404
Target digest: df88b650b1482175d2fb5e47624cd391af36bb52cc3f31aa67f8874a7ab75404
Shown source SHA256: df88b650b1482175d2fb5e47624cd391af36bb52cc3f31aa67f8874a7ab75404
Shown target SHA256: df88b650b1482175d2fb5e47624cd391af36bb52cc3f31aa67f8874a7ab75404

### Complete proposed decision

```json
{
  "claimId": "claim_7b1759a49d26fd1dcc834b3f38bade04",
  "sourceUnitDigest": "df88b650b1482175d2fb5e47624cd391af36bb52cc3f31aa67f8874a7ab75404",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "unheaded-block-10",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S03-task-detail.md#unheaded-block-8 (source lines 98-102) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-10 (candidate lines 120-124). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "df88b650b1482175d2fb5e47624cd391af36bb52cc3f31aa67f8874a7ab75404",
  "targetAncestry": [
    "S03 — Task detail",
    "Layout",
    "What CONTEXT actually shows (D17)"
  ]
}
```

### Full source shown text

```text
`GET /work/{id}`'s `work` object (the `WorkItem` schema,
`docs/contracts/fgos-gateway-api-v1.yaml`) carries more than the id/title/
status this screen showed before D17 — CONTEXT surfaces the full set that
is meaningful to a person deciding whether to trust the answer they are
about to give, in this order:
```

### Full target shown text

```text
`GET /work/{id}`'s `work` object (the `WorkItem` schema,
`docs/contracts/fgos-gateway-api-v1.yaml`) carries more than the id/title/
status this screen showed before D17 — CONTEXT surfaces the full set that
is meaningful to a person deciding whether to trust the answer they are
about to give, in this order:
```

## claim_8320314c57006644884f6d5f4edfc5bd

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#unheaded-block-9; lines 104–121; ancestry ["S03 — Task detail","Layout","What CONTEXT actually shows (D17)"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-11; ancestry ["S03 — Task detail","Layout","What CONTEXT actually shows (D17)"].
Source digest: c1bdd1e5de39d873ebc746fa92ea8a7dbffd363be076c51141e9816788d242fc
Target digest: c1bdd1e5de39d873ebc746fa92ea8a7dbffd363be076c51141e9816788d242fc
Shown source SHA256: c1bdd1e5de39d873ebc746fa92ea8a7dbffd363be076c51141e9816788d242fc
Shown target SHA256: c1bdd1e5de39d873ebc746fa92ea8a7dbffd363be076c51141e9816788d242fc

### Complete proposed decision

```json
{
  "claimId": "claim_8320314c57006644884f6d5f4edfc5bd",
  "sourceUnitDigest": "c1bdd1e5de39d873ebc746fa92ea8a7dbffd363be076c51141e9816788d242fc",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "unheaded-block-11",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S03-task-detail.md#unheaded-block-9 (source lines 104-121) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-11 (candidate lines 126-143). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c1bdd1e5de39d873ebc746fa92ea8a7dbffd363be076c51141e9816788d242fc",
  "targetAncestry": [
    "S03 — Task detail",
    "Layout",
    "What CONTEXT actually shows (D17)"
  ]
}
```

### Full source shown text

```text
- **Identity line** — `id`, `title`.
- **State pills** — `status`, `stage`, `risk` (as already shown).
- **Classification line** — `domain`, `tier`, and `deps` (as item ids; a
  person weighing an answer needs to know what else is waiting on this
  one). `parent` renders here too when non-null.
- **`description`** — the item's own full text, never truncated. This is
  new: before D17 the acceptance-criterion sentence quoted in this
  screen's own Purpose section ("a question framed so a person with no
  context in their head can answer it quickly") had no `description` field
  to draw on, which was the actual gap a person noticed live (2026-08-15).
- **`verify`** — the real command that proves this item done, shown
  verbatim (a monospace line, not summarized) so a person can judge
  whether the item's own bar for "done" matches what the question is
  asking them to approve.
- **`footprint`** — the files this item touches, as a short list.
- **`docsRef`** when non-null — a link to `GET /work/{id}/docs` (tsk-4id),
  for the rare case CONTEXT's own summary is not enough and a person wants
  the full plan/CONTEXT.md.
```

### Full target shown text

```text
- **Identity line** — `id`, `title`.
- **State pills** — `status`, `stage`, `risk` (as already shown).
- **Classification line** — `domain`, `tier`, and `deps` (as item ids; a
  person weighing an answer needs to know what else is waiting on this
  one). `parent` renders here too when non-null.
- **`description`** — the item's own full text, never truncated. This is
  new: before D17 the acceptance-criterion sentence quoted in this
  screen's own Purpose section ("a question framed so a person with no
  context in their head can answer it quickly") had no `description` field
  to draw on, which was the actual gap a person noticed live (2026-08-15).
- **`verify`** — the real command that proves this item done, shown
  verbatim (a monospace line, not summarized) so a person can judge
  whether the item's own bar for "done" matches what the question is
  asking them to approve.
- **`footprint`** — the files this item touches, as a short list.
- **`docsRef`** when non-null — a link to `GET /work/{id}/docs` (tsk-4id),
  for the rare case CONTEXT's own summary is not enough and a person wants
  the full plan/CONTEXT.md.
```

## claim_eb244fc0c4068fc1ab3c907db369a326

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#unheaded-block-10; lines 123–124; ancestry ["S03 — Task detail","Layout","What CONTEXT actually shows (D17)"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-12; ancestry ["S03 — Task detail","Layout","What CONTEXT actually shows (D17)"].
Source digest: ded2ddb7ce7a2bdc492e95e3cd32732382f8048bd0e46a60bba2622026420f24
Target digest: ded2ddb7ce7a2bdc492e95e3cd32732382f8048bd0e46a60bba2622026420f24
Shown source SHA256: ded2ddb7ce7a2bdc492e95e3cd32732382f8048bd0e46a60bba2622026420f24
Shown target SHA256: ded2ddb7ce7a2bdc492e95e3cd32732382f8048bd0e46a60bba2622026420f24

### Complete proposed decision

```json
{
  "claimId": "claim_eb244fc0c4068fc1ab3c907db369a326",
  "sourceUnitDigest": "ded2ddb7ce7a2bdc492e95e3cd32732382f8048bd0e46a60bba2622026420f24",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "unheaded-block-12",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S03-task-detail.md#unheaded-block-10 (source lines 123-124) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-12 (candidate lines 145-146). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ded2ddb7ce7a2bdc492e95e3cd32732382f8048bd0e46a60bba2622026420f24",
  "targetAncestry": [
    "S03 — Task detail",
    "Layout",
    "What CONTEXT actually shows (D17)"
  ]
}
```

### Full source shown text

```text
Then, unchanged from before D17: **"What the agent did"** (the narrative
account) and the collapsed **machine decision log** disclosure.
```

### Full target shown text

```text
Then, unchanged from before D17: **"What the agent did"** (the narrative
account) and the collapsed **machine decision log** disclosure.
```

## claim_4abab9f7a787bead0ff5f1d162c2bd07

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#unheaded-block-11; lines 126–131; ancestry ["S03 — Task detail","Layout","What CONTEXT actually shows (D17)"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-13; ancestry ["S03 — Task detail","Layout","What CONTEXT actually shows (D17)"].
Source digest: 7b636169f5f4f687e45215c4b3ebe993d604fca24992c590ebec1eb747eee029
Target digest: 7b636169f5f4f687e45215c4b3ebe993d604fca24992c590ebec1eb747eee029
Shown source SHA256: 7b636169f5f4f687e45215c4b3ebe993d604fca24992c590ebec1eb747eee029
Shown target SHA256: 7b636169f5f4f687e45215c4b3ebe993d604fca24992c590ebec1eb747eee029

### Complete proposed decision

```json
{
  "claimId": "claim_4abab9f7a787bead0ff5f1d162c2bd07",
  "sourceUnitDigest": "7b636169f5f4f687e45215c4b3ebe993d604fca24992c590ebec1eb747eee029",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "unheaded-block-13",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S03-task-detail.md#unheaded-block-11 (source lines 126-131) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-13 (candidate lines 148-153). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7b636169f5f4f687e45215c4b3ebe993d604fca24992c590ebec1eb747eee029",
  "targetAncestry": [
    "S03 — Task detail",
    "Layout",
    "What CONTEXT actually shows (D17)"
  ]
}
```

### Full source shown text

```text
Fields the `WorkItem` schema carries that CONTEXT deliberately does NOT
surface here: `kind` (redundant with `domain` for a person, not a new
fact), `parent` when null. Nothing here is fabricated from a placeholder —
every field above is a real `WorkItem` property with a $ref in the
contract; a field that is absent/null on a given item simply does not
render its row, the same convention `docsRef` already used before D17.
```

### Full target shown text

```text
Fields the `WorkItem` schema carries that CONTEXT deliberately does NOT
surface here: `kind` (redundant with `domain` for a person, not a new
fact), `parent` when null. Nothing here is fabricated from a placeholder —
every field above is a real `WorkItem` property with a $ref in the
contract; a field that is absent/null on a given item simply does not
render its row, the same convention `docsRef` already used before D17.
```

## claim_0295a9bbd34b084c523f0c057b5899da

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#the-questionanswer-timeline-across-rounds; lines 133–133; ancestry ["S03 — Task detail","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#the-questionanswer-timeline-across-rounds; ancestry ["S03 — Task detail","Layout"].
Source digest: 0a1c545c0f2469060bd1e06ebfa03c5eaf87ccfd97972784c2a969487d3ca1c7
Target digest: 0a1c545c0f2469060bd1e06ebfa03c5eaf87ccfd97972784c2a969487d3ca1c7
Shown source SHA256: 6d4be132c74dc24286f213e3974623019f25a5a5c962d88d6b8c6c37f20bf1a2
Shown target SHA256: 6d4be132c74dc24286f213e3974623019f25a5a5c962d88d6b8c6c37f20bf1a2

### Complete proposed decision

```json
{
  "claimId": "claim_0295a9bbd34b084c523f0c057b5899da",
  "sourceUnitDigest": "0a1c545c0f2469060bd1e06ebfa03c5eaf87ccfd97972784c2a969487d3ca1c7",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "the-questionanswer-timeline-across-rounds",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole heading unit docs/ui-spec/screens/S03-task-detail.md#the-questionanswer-timeline-across-rounds (source lines 133-133) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#the-questionanswer-timeline-across-rounds (candidate lines 155-155). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0a1c545c0f2469060bd1e06ebfa03c5eaf87ccfd97972784c2a969487d3ca1c7",
  "targetAncestry": [
    "S03 — Task detail",
    "Layout"
  ]
}
```

### Full source shown text

```text
### The question/answer timeline across rounds

R9 governs this and constrains it honestly: pairing is **positional** —
the i-th question with the i-th answer, in recorded order. So the timeline
renders as an ordered list of rounds and **never draws a link the data
does not carry**. No arrows implying causality between a specific answer
and a specific later question; just order, with timestamps.

The still-open round renders with its answer slot visibly empty (`—
waiting`) rather than omitted, so a person can see at a glance that
exactly one round is outstanding and which one.
```

### Full target shown text

```text
### The question/answer timeline across rounds

R9 governs this and constrains it honestly: pairing is **positional** —
the i-th question with the i-th answer, in recorded order. So the timeline
renders as an ordered list of rounds and **never draws a link the data
does not carry**. No arrows implying causality between a specific answer
and a specific later question; just order, with timestamps.

The still-open round renders with its answer slot visibly empty (`—
waiting`) rather than omitted, so a person can see at a glance that
exactly one round is outstanding and which one.
```

## claim_e2969564bc033087099738ac927d2263

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#unheaded-block-12; lines 135–139; ancestry ["S03 — Task detail","Layout","The question/answer timeline across rounds"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-14; ancestry ["S03 — Task detail","Layout","The question/answer timeline across rounds"].
Source digest: b78f2fe03bdcec998a797758f3fc19d9e09d43c81b83a6e87923a2e83e450159
Target digest: b78f2fe03bdcec998a797758f3fc19d9e09d43c81b83a6e87923a2e83e450159
Shown source SHA256: b78f2fe03bdcec998a797758f3fc19d9e09d43c81b83a6e87923a2e83e450159
Shown target SHA256: b78f2fe03bdcec998a797758f3fc19d9e09d43c81b83a6e87923a2e83e450159

### Complete proposed decision

```json
{
  "claimId": "claim_e2969564bc033087099738ac927d2263",
  "sourceUnitDigest": "b78f2fe03bdcec998a797758f3fc19d9e09d43c81b83a6e87923a2e83e450159",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "unheaded-block-14",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S03-task-detail.md#unheaded-block-12 (source lines 135-139) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-14 (candidate lines 157-161). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b78f2fe03bdcec998a797758f3fc19d9e09d43c81b83a6e87923a2e83e450159",
  "targetAncestry": [
    "S03 — Task detail",
    "Layout",
    "The question/answer timeline across rounds"
  ]
}
```

### Full source shown text

```text
R9 governs this and constrains it honestly: pairing is **positional** —
the i-th question with the i-th answer, in recorded order. So the timeline
renders as an ordered list of rounds and **never draws a link the data
does not carry**. No arrows implying causality between a specific answer
and a specific later question; just order, with timestamps.
```

### Full target shown text

```text
R9 governs this and constrains it honestly: pairing is **positional** —
the i-th question with the i-th answer, in recorded order. So the timeline
renders as an ordered list of rounds and **never draws a link the data
does not carry**. No arrows implying causality between a specific answer
and a specific later question; just order, with timestamps.
```

## claim_b391fc12268d78ddd19bf6a9f8f66656

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#unheaded-block-13; lines 141–143; ancestry ["S03 — Task detail","Layout","The question/answer timeline across rounds"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-15; ancestry ["S03 — Task detail","Layout","The question/answer timeline across rounds"].
Source digest: c5c214f47346cbc378a79c77a7bb210b510e6f2a5a7229f821f08e75fe587517
Target digest: c5c214f47346cbc378a79c77a7bb210b510e6f2a5a7229f821f08e75fe587517
Shown source SHA256: c5c214f47346cbc378a79c77a7bb210b510e6f2a5a7229f821f08e75fe587517
Shown target SHA256: c5c214f47346cbc378a79c77a7bb210b510e6f2a5a7229f821f08e75fe587517

### Complete proposed decision

```json
{
  "claimId": "claim_b391fc12268d78ddd19bf6a9f8f66656",
  "sourceUnitDigest": "c5c214f47346cbc378a79c77a7bb210b510e6f2a5a7229f821f08e75fe587517",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "unheaded-block-15",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S03-task-detail.md#unheaded-block-13 (source lines 141-143) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-15 (candidate lines 163-165). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c5c214f47346cbc378a79c77a7bb210b510e6f2a5a7229f821f08e75fe587517",
  "targetAncestry": [
    "S03 — Task detail",
    "Layout",
    "The question/answer timeline across rounds"
  ]
}
```

### Full source shown text

```text
The still-open round renders with its answer slot visibly empty (`—
waiting`) rather than omitted, so a person can see at a glance that
exactly one round is outstanding and which one.
```

### Full target shown text

```text
The still-open round renders with its answer slot visibly empty (`—
waiting`) rather than omitted, so a person can see at a glance that
exactly one round is outstanding and which one.
```

## claim_a59c4971ef0276a190d1436f39614c63

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#states; lines 145–145; ancestry ["S03 — Task detail"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#states; ancestry ["S03 — Task detail"].
Source digest: 4bdb10422d9ccb84bd67360f748986ac2f5483abcc1e32c402e7964315af8bbf
Target digest: 4bdb10422d9ccb84bd67360f748986ac2f5483abcc1e32c402e7964315af8bbf
Shown source SHA256: 09dcabd7e1f2e6e0694696ec810f6e62a8c9cc43a47c76e83360e83171b61f7a
Shown target SHA256: 09dcabd7e1f2e6e0694696ec810f6e62a8c9cc43a47c76e83360e83171b61f7a

### Complete proposed decision

```json
{
  "claimId": "claim_a59c4971ef0276a190d1436f39614c63",
  "sourceUnitDigest": "4bdb10422d9ccb84bd67360f748986ac2f5483abcc1e32c402e7964315af8bbf",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "states",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S03-task-detail.md#states (source lines 145-145) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#states (candidate lines 167-167). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "4bdb10422d9ccb84bd67360f748986ac2f5483abcc1e32c402e7964315af8bbf",
  "targetAncestry": [
    "S03 — Task detail"
  ]
}
```

### Full source shown text

```text
## States

- **ST-NEVER-PARKED** — the QUESTION region is replaced by a quiet "This
  item has never needed a person", and TIMELINE says the same. Not an
  error, and not an empty box with no explanation.
- **ST-NARRATIVE-MISSING** — CONTEXT keeps the item's own fields and says
  the narrative directory was not found, naming the path it looked for.
- **ERR-NARRATIVE-PATH** — same region, different sentence: the reference
  resolved outside the documentation tree and was refused.
- **ERR-APPROVE-UNAVAILABLE** — R7 rendered: `Approve merge` is shown
  **disabled with the reason attached** (the ⓘ in the layout above), never
  hidden and never offered-then-failed.
- **ST-DISCONNECTED** — content marked stale, actions disabled, retry
  offered.

Per R8, the three write controls in ACTIONS are visually distinct from
everything above them, and `Approve merge` is distinct again from the
other two — it is the only control on this client that changes trunk.
```

### Full target shown text

```text
## States

- **ST-NEVER-PARKED** — the QUESTION region is replaced by a quiet "This
  item has never needed a person", and TIMELINE says the same. Not an
  error, and not an empty box with no explanation.
- **ST-NARRATIVE-MISSING** — CONTEXT keeps the item's own fields and says
  the narrative directory was not found, naming the path it looked for.
- **ERR-NARRATIVE-PATH** — same region, different sentence: the reference
  resolved outside the documentation tree and was refused.
- **ERR-APPROVE-UNAVAILABLE** — R7 rendered: `Approve merge` is shown
  **disabled with the reason attached** (the ⓘ in the layout above), never
  hidden and never offered-then-failed.
- **ST-DISCONNECTED** — content marked stale, actions disabled, retry
  offered.

Per R8, the three write controls in ACTIONS are visually distinct from
everything above them, and `Approve merge` is distinct again from the
other two — it is the only control on this client that changes trunk.
```

## claim_9a2e11a231c97ddf61ceb228fed26010

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#unheaded-block-14; lines 147–158; ancestry ["S03 — Task detail","States"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-16; ancestry ["S03 — Task detail","States"].
Source digest: b2ada90792e03a4ebfe8767adbf7f9c86be70ba1f3ce4fe9d6269f8485a7fa05
Target digest: b2ada90792e03a4ebfe8767adbf7f9c86be70ba1f3ce4fe9d6269f8485a7fa05
Shown source SHA256: b2ada90792e03a4ebfe8767adbf7f9c86be70ba1f3ce4fe9d6269f8485a7fa05
Shown target SHA256: b2ada90792e03a4ebfe8767adbf7f9c86be70ba1f3ce4fe9d6269f8485a7fa05

### Complete proposed decision

```json
{
  "claimId": "claim_9a2e11a231c97ddf61ceb228fed26010",
  "sourceUnitDigest": "b2ada90792e03a4ebfe8767adbf7f9c86be70ba1f3ce4fe9d6269f8485a7fa05",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "unheaded-block-16",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S03-task-detail.md#unheaded-block-14 (source lines 147-158) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-16 (candidate lines 169-180). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b2ada90792e03a4ebfe8767adbf7f9c86be70ba1f3ce4fe9d6269f8485a7fa05",
  "targetAncestry": [
    "S03 — Task detail",
    "States"
  ]
}
```

### Full source shown text

```text
- **ST-NEVER-PARKED** — the QUESTION region is replaced by a quiet "This
  item has never needed a person", and TIMELINE says the same. Not an
  error, and not an empty box with no explanation.
- **ST-NARRATIVE-MISSING** — CONTEXT keeps the item's own fields and says
  the narrative directory was not found, naming the path it looked for.
- **ERR-NARRATIVE-PATH** — same region, different sentence: the reference
  resolved outside the documentation tree and was refused.
- **ERR-APPROVE-UNAVAILABLE** — R7 rendered: `Approve merge` is shown
  **disabled with the reason attached** (the ⓘ in the layout above), never
  hidden and never offered-then-failed.
- **ST-DISCONNECTED** — content marked stale, actions disabled, retry
  offered.
```

### Full target shown text

```text
- **ST-NEVER-PARKED** — the QUESTION region is replaced by a quiet "This
  item has never needed a person", and TIMELINE says the same. Not an
  error, and not an empty box with no explanation.
- **ST-NARRATIVE-MISSING** — CONTEXT keeps the item's own fields and says
  the narrative directory was not found, naming the path it looked for.
- **ERR-NARRATIVE-PATH** — same region, different sentence: the reference
  resolved outside the documentation tree and was refused.
- **ERR-APPROVE-UNAVAILABLE** — R7 rendered: `Approve merge` is shown
  **disabled with the reason attached** (the ⓘ in the layout above), never
  hidden and never offered-then-failed.
- **ST-DISCONNECTED** — content marked stale, actions disabled, retry
  offered.
```

## claim_73cab9a36191997438af84b13c76cf85

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#unheaded-block-15; lines 160–162; ancestry ["S03 — Task detail","States"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-17; ancestry ["S03 — Task detail","States"].
Source digest: 0e91e3c92c13cc041ce0dc29fc7b5adde5f55b7b39db0afab2c854744aaae02c
Target digest: 0e91e3c92c13cc041ce0dc29fc7b5adde5f55b7b39db0afab2c854744aaae02c
Shown source SHA256: 0e91e3c92c13cc041ce0dc29fc7b5adde5f55b7b39db0afab2c854744aaae02c
Shown target SHA256: 0e91e3c92c13cc041ce0dc29fc7b5adde5f55b7b39db0afab2c854744aaae02c

### Complete proposed decision

```json
{
  "claimId": "claim_73cab9a36191997438af84b13c76cf85",
  "sourceUnitDigest": "0e91e3c92c13cc041ce0dc29fc7b5adde5f55b7b39db0afab2c854744aaae02c",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "unheaded-block-17",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S03-task-detail.md#unheaded-block-15 (source lines 160-162) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-17 (candidate lines 182-184). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0e91e3c92c13cc041ce0dc29fc7b5adde5f55b7b39db0afab2c854744aaae02c",
  "targetAncestry": [
    "S03 — Task detail",
    "States"
  ]
}
```

### Full source shown text

```text
Per R8, the three write controls in ACTIONS are visually distinct from
everything above them, and `Approve merge` is distinct again from the
other two — it is the only control on this client that changes trunk.
```

### Full target shown text

```text
Per R8, the three write controls in ACTIONS are visually distinct from
everything above them, and `Approve merge` is distinct again from the
other two — it is the only control on this client that changes trunk.
```

## claim_0799ccec326a89dc36b6463e3a7d1699

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#interactions; lines 164–164; ancestry ["S03 — Task detail"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#interactions; ancestry ["S03 — Task detail"].
Source digest: bdf0b4839f92bed569d302ba225ffc3994a4a746184ad2b4268d9b604a6b935c
Target digest: bdf0b4839f92bed569d302ba225ffc3994a4a746184ad2b4268d9b604a6b935c
Shown source SHA256: 7babf4a40f90a8def2939425f8f4f6894124c26901b549943b4e141fa51d8ce6
Shown target SHA256: 7babf4a40f90a8def2939425f8f4f6894124c26901b549943b4e141fa51d8ce6

### Complete proposed decision

```json
{
  "claimId": "claim_0799ccec326a89dc36b6463e3a7d1699",
  "sourceUnitDigest": "bdf0b4839f92bed569d302ba225ffc3994a4a746184ad2b4268d9b604a6b935c",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "interactions",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S03-task-detail.md#interactions (source lines 164-164) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#interactions (candidate lines 186-186). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "bdf0b4839f92bed569d302ba225ffc3994a4a746184ad2b4268d9b604a6b935c",
  "targetAncestry": [
    "S03 — Task detail"
  ]
}
```

### Full source shown text

````text
## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-S03-001
    element: answer_button
    region: question
    trigger: click
    guard: "item.isParked"
    action: open_overlay
    target: M01
    payload: { item_id: "$item.id" }
  - id: A-S03-002
    element: approve_merge_button
    region: actions
    trigger: click
    guard: "item.awaitingApproval && gateway.atMainWorkingTree"
    action: open_overlay
    target: M02
    payload: { item_id: "$item.id" }
  - id: A-S03-003
    element: edit_button
    region: actions
    trigger: click
    action: open_overlay
    target: M03
    payload: { item_id: "$item.id", mode: "edit" }
  - id: A-S03-004
    element: machine_log_disclosure
    region: context
    trigger: click
    action: mutate
    effects: [toggle_machine_log]
  - id: A-S03-005
    element: back_to_board
    region: topbar
    trigger: click
    action: navigate
    target: S02
  - id: A-S03-006
    element: timeline_show_earlier
    region: timeline
    trigger: click
    action: mutate
    effects: [expand_earlier_rounds]
  - id: A-S03-007
    element: detail
    listens_to: work.changed
    action: mutate
    effects: [refresh_item]
  - id: A-S03-008
    element: timeline
    listens_to: question.answered
    action: mutate
    effects: [close_open_round]
  - id: A-S03-009
    element: actions
    listens_to: merge.settled
    action: mutate
    effects: [refresh_item, show_outcome]
  - id: A-S03-010
    element: detail
    listens_to: gateway.unreachable
    action: mutate
    effects: [mark_stale, disable_writes]
  - id: A-S03-011
    element: retire_action
    listens_to: item.quick_action
    action: mutate
    effects: [run_move_to_wontfix]
```
````

### Full target shown text

````text
## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-S03-001
    element: answer_button
    region: question
    trigger: click
    guard: "item.isParked"
    action: open_overlay
    target: M01
    payload: { item_id: "$item.id" }
  - id: A-S03-002
    element: approve_merge_button
    region: actions
    trigger: click
    guard: "item.awaitingApproval && gateway.atMainWorkingTree"
    action: open_overlay
    target: M02
    payload: { item_id: "$item.id" }
  - id: A-S03-003
    element: edit_button
    region: actions
    trigger: click
    action: open_overlay
    target: M03
    payload: { item_id: "$item.id", mode: "edit" }
  - id: A-S03-004
    element: machine_log_disclosure
    region: context
    trigger: click
    action: mutate
    effects: [toggle_machine_log]
  - id: A-S03-005
    element: back_to_board
    region: topbar
    trigger: click
    action: navigate
    target: S02
  - id: A-S03-006
    element: timeline_show_earlier
    region: timeline
    trigger: click
    action: mutate
    effects: [expand_earlier_rounds]
  - id: A-S03-007
    element: detail
    listens_to: work.changed
    action: mutate
    effects: [refresh_item]
  - id: A-S03-008
    element: timeline
    listens_to: question.answered
    action: mutate
    effects: [close_open_round]
  - id: A-S03-009
    element: actions
    listens_to: merge.settled
    action: mutate
    effects: [refresh_item, show_outcome]
  - id: A-S03-010
    element: detail
    listens_to: gateway.unreachable
    action: mutate
    effects: [mark_stale, disable_writes]
  - id: A-S03-011
    element: retire_action
    listens_to: item.quick_action
    action: mutate
    effects: [run_move_to_wontfix]
```
````

## claim_cb783b44a6284c43bbaac2e46c89026f

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S03-task-detail.md#unheaded-block-16; lines 166–234; ancestry ["S03 — Task detail","Interactions"].
Target: docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-18; ancestry ["S03 — Task detail","Interactions"].
Source digest: a51154d8995076f88b5a062b8db7af5c48e04601c63c8df48791f741b52a9d08
Target digest: a51154d8995076f88b5a062b8db7af5c48e04601c63c8df48791f741b52a9d08
Shown source SHA256: a51154d8995076f88b5a062b8db7af5c48e04601c63c8df48791f741b52a9d08
Shown target SHA256: a51154d8995076f88b5a062b8db7af5c48e04601c63c8df48791f741b52a9d08

### Complete proposed decision

```json
{
  "claimId": "claim_cb783b44a6284c43bbaac2e46c89026f",
  "sourceUnitDigest": "a51154d8995076f88b5a062b8db7af5c48e04601c63c8df48791f741b52a9d08",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S03-task-detail.md",
  "targetAnchor": "unheaded-block-18",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S03-task-detail.md#unheaded-block-16 (source lines 166-234) is carried at docs/platform/ui-spec/architecture/screens/S03-task-detail.md#unheaded-block-18 (candidate lines 188-256). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S03-task-detail.md verbatim in docs/platform/ui-spec/architecture/screens/S03-task-detail.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "a51154d8995076f88b5a062b8db7af5c48e04601c63c8df48791f741b52a9d08",
  "targetAncestry": [
    "S03 — Task detail",
    "Interactions"
  ]
}
```

### Full source shown text

````text
```yaml herdrweb-contract
interactions:
  - id: A-S03-001
    element: answer_button
    region: question
    trigger: click
    guard: "item.isParked"
    action: open_overlay
    target: M01
    payload: { item_id: "$item.id" }
  - id: A-S03-002
    element: approve_merge_button
    region: actions
    trigger: click
    guard: "item.awaitingApproval && gateway.atMainWorkingTree"
    action: open_overlay
    target: M02
    payload: { item_id: "$item.id" }
  - id: A-S03-003
    element: edit_button
    region: actions
    trigger: click
    action: open_overlay
    target: M03
    payload: { item_id: "$item.id", mode: "edit" }
  - id: A-S03-004
    element: machine_log_disclosure
    region: context
    trigger: click
    action: mutate
    effects: [toggle_machine_log]
  - id: A-S03-005
    element: back_to_board
    region: topbar
    trigger: click
    action: navigate
    target: S02
  - id: A-S03-006
    element: timeline_show_earlier
    region: timeline
    trigger: click
    action: mutate
    effects: [expand_earlier_rounds]
  - id: A-S03-007
    element: detail
    listens_to: work.changed
    action: mutate
    effects: [refresh_item]
  - id: A-S03-008
    element: timeline
    listens_to: question.answered
    action: mutate
    effects: [close_open_round]
  - id: A-S03-009
    element: actions
    listens_to: merge.settled
    action: mutate
    effects: [refresh_item, show_outcome]
  - id: A-S03-010
    element: detail
    listens_to: gateway.unreachable
    action: mutate
    effects: [mark_stale, disable_writes]
  - id: A-S03-011
    element: retire_action
    listens_to: item.quick_action
    action: mutate
    effects: [run_move_to_wontfix]
```
````

### Full target shown text

````text
```yaml herdrweb-contract
interactions:
  - id: A-S03-001
    element: answer_button
    region: question
    trigger: click
    guard: "item.isParked"
    action: open_overlay
    target: M01
    payload: { item_id: "$item.id" }
  - id: A-S03-002
    element: approve_merge_button
    region: actions
    trigger: click
    guard: "item.awaitingApproval && gateway.atMainWorkingTree"
    action: open_overlay
    target: M02
    payload: { item_id: "$item.id" }
  - id: A-S03-003
    element: edit_button
    region: actions
    trigger: click
    action: open_overlay
    target: M03
    payload: { item_id: "$item.id", mode: "edit" }
  - id: A-S03-004
    element: machine_log_disclosure
    region: context
    trigger: click
    action: mutate
    effects: [toggle_machine_log]
  - id: A-S03-005
    element: back_to_board
    region: topbar
    trigger: click
    action: navigate
    target: S02
  - id: A-S03-006
    element: timeline_show_earlier
    region: timeline
    trigger: click
    action: mutate
    effects: [expand_earlier_rounds]
  - id: A-S03-007
    element: detail
    listens_to: work.changed
    action: mutate
    effects: [refresh_item]
  - id: A-S03-008
    element: timeline
    listens_to: question.answered
    action: mutate
    effects: [close_open_round]
  - id: A-S03-009
    element: actions
    listens_to: merge.settled
    action: mutate
    effects: [refresh_item, show_outcome]
  - id: A-S03-010
    element: detail
    listens_to: gateway.unreachable
    action: mutate
    effects: [mark_stale, disable_writes]
  - id: A-S03-011
    element: retire_action
    listens_to: item.quick_action
    action: mutate
    effects: [run_move_to_wontfix]
```
````
