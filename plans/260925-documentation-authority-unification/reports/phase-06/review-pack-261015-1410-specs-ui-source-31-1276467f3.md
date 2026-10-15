# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/screens/S02-taskboard.md
Part 1/1; entries: **20**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 5/5 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_a7fe7d3eb849b053ed9e0649f9ccfa87",
      "claim_605e72f3a6df29f642a1f45962d051ff",
      "claim_6a5a28e29d2e65708f5f17fef23e8ef0",
      "claim_6c49dcd927215fbd7baede5222cf1ab5",
      "claim_8f3f773ca083b9fa8272988d07965164",
      "claim_369a407225765e238efb7a418e0a44a5",
      "claim_d30db7db84e70167a04fe1c5fb39a4e5",
      "claim_38f435fc7cb64228e37d157820f6222c",
      "claim_2cc8f26dc0394eb2b7b92cc169beb784",
      "claim_66dc01994689c5fb630f56fdb1180788",
      "claim_16ece324dc00b79759255e4acb8435ae",
      "claim_6cd22f67c65c9cc4aa70c160cababb24",
      "claim_9fe8558f49b4210f3268eaa0a158d8ee",
      "claim_6c75a8d85b8232cfedf1ae86a7eda90a",
      "claim_47dd03576e4ae838330cee0a1a15e4bd"
    ],
    "Weak-exact": [
      "claim_e9363bc06e8f7f4b941bf74ea143ff6e",
      "claim_a3568914bacae6331716fa11beabe655",
      "claim_1ed9286862955b20a1067b2ba1f9de9e",
      "claim_695d51475befe3701ccb1b7d9570db36"
    ],
    "Judgment": [
      "claim_1526b583a680ad5f2b907a7b5da02ad1"
    ]
  },
  "unequalDigestPairs": [
    "claim_1526b583a680ad5f2b907a7b5da02ad1"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_1526b583a680ad5f2b907a7b5da02ad1"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_a7fe7d3eb849b053ed9e0649f9ccfa87

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#unheaded-block-1; lines 1–11; ancestry [].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-1; ancestry [].
Source digest: e8291716ea7a09bddc4a88d8afb788b8eabc0c6a4fdea6b026f41b0f6936ab32
Target digest: e8291716ea7a09bddc4a88d8afb788b8eabc0c6a4fdea6b026f41b0f6936ab32
Shown source SHA256: e8291716ea7a09bddc4a88d8afb788b8eabc0c6a4fdea6b026f41b0f6936ab32
Shown target SHA256: e8291716ea7a09bddc4a88d8afb788b8eabc0c6a4fdea6b026f41b0f6936ab32

### Complete proposed decision

```json
{
  "claimId": "claim_a7fe7d3eb849b053ed9e0649f9ccfa87",
  "sourceUnitDigest": "e8291716ea7a09bddc4a88d8afb788b8eabc0c6a4fdea6b026f41b0f6936ab32",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/ui-spec/screens/S02-taskboard.md#unheaded-block-1 (source lines 1-11) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-1 (candidate lines 1-11). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "e8291716ea7a09bddc4a88d8afb788b8eabc0c6a4fdea6b026f41b0f6936ab32",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
id: S02
type: screen
name: "Taskboard"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R1, R5, R11]
regions: [topbar, controls, board, needs_answer_rail]
---
```

### Full target shown text

```text
---
id: S02
type: screen
name: "Taskboard"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R1, R5, R11]
regions: [topbar, controls, board, needs_answer_rail]
---
```

## claim_1526b583a680ad5f2b907a7b5da02ad1

Class: Judgment; mandatory deep: true.
Source: docs/ui-spec/screens/S02-taskboard.md#s02-taskboard; lines 13–13; ancestry [].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#s02-taskboard; ancestry [].
Source digest: b03e9d3fd049f6c76ae6d22d6aca9593f1bb2aeb6f8380bf63f6e8486ff139eb
Target digest: 61e519c98077e79b1747ee49f4e236db58a523d35f2d053499b7f05898a3ca8a
Shown source SHA256: 7256edb5c4deb8e7ae0c3a39c34cae2d8afe9e1e0548dfd18eca2e42c2fa33ac
Shown target SHA256: 4774b6a1cfbd8c3aaff0b9f8589477a0a504b50c795bf95a09740b1a41132275

### Complete proposed decision

```json
{
  "claimId": "claim_1526b583a680ad5f2b907a7b5da02ad1",
  "sourceUnitDigest": "b03e9d3fd049f6c76ae6d22d6aca9593f1bb2aeb6f8380bf63f6e8486ff139eb",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "s02-taskboard",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/ui-spec/screens/S02-taskboard.md#s02-taskboard (source lines 13-13) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#s02-taskboard (candidate lines 13-13). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "61e519c98077e79b1747ee49f4e236db58a523d35f2d053499b7f05898a3ca8a",
  "targetAncestry": []
}
```

### Full source shown text

```text
# S02 — Taskboard
```

### Full target shown text

````text
# S02 — Taskboard

```txt
Document type: Architecture
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/screens/S02-taskboard.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/ui-spec/screens/S02-taskboard.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.
````

## claim_e9363bc06e8f7f4b941bf74ea143ff6e

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#purpose; lines 15–15; ancestry ["S02 — Taskboard"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#purpose; ancestry ["S02 — Taskboard"].
Source digest: a6348ae6ccac163f26dc71670713e17a2fd89825093716c6cbbd9c3b9683828d
Target digest: a6348ae6ccac163f26dc71670713e17a2fd89825093716c6cbbd9c3b9683828d
Shown source SHA256: 7c1bcb01f73e9f36bd8956b9633cdfe3bc88302e26d8d50478a6b416622246d8
Shown target SHA256: 7c1bcb01f73e9f36bd8956b9633cdfe3bc88302e26d8d50478a6b416622246d8

### Complete proposed decision

```json
{
  "claimId": "claim_e9363bc06e8f7f4b941bf74ea143ff6e",
  "sourceUnitDigest": "a6348ae6ccac163f26dc71670713e17a2fd89825093716c6cbbd9c3b9683828d",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "purpose",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S02-taskboard.md#purpose (source lines 15-15) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#purpose (candidate lines 37-37). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "a6348ae6ccac163f26dc71670713e17a2fd89825093716c6cbbd9c3b9683828d",
  "targetAncestry": [
    "S02 — Taskboard"
  ]
}
```

### Full source shown text

```text
## Purpose

The landing surface after sign-in, and the way to reach everything else.
The area spec is explicit that this is **a board, not a flat table**, with
Monday.com/ClickUp as the reference: items grouped by status, state
legible at a glance, quick actions in place, and controls to filter and
regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard).

That reference is not decoration. The thing this whole cluster is for is a
person opening their phone and finding out, in one look, whether anything
needs them. A flat table makes that a reading exercise; a grouped board
with coloured status makes it a glance.
```

### Full target shown text

```text
## Purpose

The landing surface after sign-in, and the way to reach everything else.
The area spec is explicit that this is **a board, not a flat table**, with
Monday.com/ClickUp as the reference: items grouped by status, state
legible at a glance, quick actions in place, and controls to filter and
regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard).

That reference is not decoration. The thing this whole cluster is for is a
person opening their phone and finding out, in one look, whether anything
needs them. A flat table makes that a reading exercise; a grouped board
with coloured status makes it a glance.
```

## claim_605e72f3a6df29f642a1f45962d051ff

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#unheaded-block-2; lines 17–21; ancestry ["S02 — Taskboard","Purpose"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-4; ancestry ["S02 — Taskboard","Purpose"].
Source digest: de8dfe32ef6f9e54cbc969902056ccde6751597aa532a45ef0fa6c510d3fa925
Target digest: de8dfe32ef6f9e54cbc969902056ccde6751597aa532a45ef0fa6c510d3fa925
Shown source SHA256: de8dfe32ef6f9e54cbc969902056ccde6751597aa532a45ef0fa6c510d3fa925
Shown target SHA256: de8dfe32ef6f9e54cbc969902056ccde6751597aa532a45ef0fa6c510d3fa925

### Complete proposed decision

```json
{
  "claimId": "claim_605e72f3a6df29f642a1f45962d051ff",
  "sourceUnitDigest": "de8dfe32ef6f9e54cbc969902056ccde6751597aa532a45ef0fa6c510d3fa925",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S02-taskboard.md#unheaded-block-2 (source lines 17-21) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-4 (candidate lines 39-43). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "de8dfe32ef6f9e54cbc969902056ccde6751597aa532a45ef0fa6c510d3fa925",
  "targetAncestry": [
    "S02 — Taskboard",
    "Purpose"
  ]
}
```

### Full source shown text

```text
The landing surface after sign-in, and the way to reach everything else.
The area spec is explicit that this is **a board, not a flat table**, with
Monday.com/ClickUp as the reference: items grouped by status, state
legible at a glance, quick actions in place, and controls to filter and
regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard).
```

### Full target shown text

```text
The landing surface after sign-in, and the way to reach everything else.
The area spec is explicit that this is **a board, not a flat table**, with
Monday.com/ClickUp as the reference: items grouped by status, state
legible at a glance, quick actions in place, and controls to filter and
regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard).
```

## claim_6a5a28e29d2e65708f5f17fef23e8ef0

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#unheaded-block-3; lines 23–26; ancestry ["S02 — Taskboard","Purpose"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-5; ancestry ["S02 — Taskboard","Purpose"].
Source digest: 29fbb9af60bb2b881536741d9039a846bd2489688d77201bafd9167c567e2665
Target digest: 29fbb9af60bb2b881536741d9039a846bd2489688d77201bafd9167c567e2665
Shown source SHA256: 29fbb9af60bb2b881536741d9039a846bd2489688d77201bafd9167c567e2665
Shown target SHA256: 29fbb9af60bb2b881536741d9039a846bd2489688d77201bafd9167c567e2665

### Complete proposed decision

```json
{
  "claimId": "claim_6a5a28e29d2e65708f5f17fef23e8ef0",
  "sourceUnitDigest": "29fbb9af60bb2b881536741d9039a846bd2489688d77201bafd9167c567e2665",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S02-taskboard.md#unheaded-block-3 (source lines 23-26) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-5 (candidate lines 45-48). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "29fbb9af60bb2b881536741d9039a846bd2489688d77201bafd9167c567e2665",
  "targetAncestry": [
    "S02 — Taskboard",
    "Purpose"
  ]
}
```

### Full source shown text

```text
That reference is not decoration. The thing this whole cluster is for is a
person opening their phone and finding out, in one look, whether anything
needs them. A flat table makes that a reading exercise; a grouped board
with coloured status makes it a glance.
```

### Full target shown text

```text
That reference is not decoration. The thing this whole cluster is for is a
person opening their phone and finding out, in one look, whether anything
needs them. A flat table makes that a reading exercise; a grouped board
with coloured status makes it a glance.
```

## claim_a3568914bacae6331716fa11beabe655

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#layout; lines 28–28; ancestry ["S02 — Taskboard"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#layout; ancestry ["S02 — Taskboard"].
Source digest: 4d0bf2c9e7d751d20034f938f244eb1ca5730b7473398737c9d3d150780e908e
Target digest: 4d0bf2c9e7d751d20034f938f244eb1ca5730b7473398737c9d3d150780e908e
Shown source SHA256: 558915161e4fedb0ddd80da8b8ea611c7ff0079a9ecc8d7012b3adc4d5751d82
Shown target SHA256: 558915161e4fedb0ddd80da8b8ea611c7ff0079a9ecc8d7012b3adc4d5751d82

### Complete proposed decision

```json
{
  "claimId": "claim_a3568914bacae6331716fa11beabe655",
  "sourceUnitDigest": "4d0bf2c9e7d751d20034f938f244eb1ca5730b7473398737c9d3d150780e908e",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "layout",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S02-taskboard.md#layout (source lines 28-28) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#layout (candidate lines 50-50). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "4d0bf2c9e7d751d20034f938f244eb1ca5730b7473398737c9d3d150780e908e",
  "targetAncestry": [
    "S02 — Taskboard"
  ]
}
```

### Full source shown text

````text
## Layout

Desktop offers **two board views of the same underlying grouped data** —
a person picks whichever reading suits the moment, and the choice is
remembered (D16, `docs/history/herdr-web-dashboard/CONTEXT.md`). Neither
view is a separate screen; both read the same `GET /work` grouped-by-status
data, they only differ in how that grouping renders.

**Group view** (default) — status groups stacked vertically, each
collapsible, with the "needs answer" rail pinned right so the one urgent
category is never scrolled past. Best for triage: scan every group's count
without horizontal scanning.

```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ herdr   [project ▾]  [gateway: dev-box ▾]      ⚠ reachable on network  │
├ CONTROLS ──────────────────────────────────────────────────────────────┤
│ [search…]  Group by: [Status ▾]  Filter: [Stage ▾][Risk ▾]  View:[▤ ▥]  [+ Add] │
├ BOARD ──────────────────────────────────┬ NEEDS ANSWER ────────────────┤
│                                         │                              │
│ ▾ NEEDS ANSWER · 2          ● amber     │  tsk-4id                     │
│  ┌────────────────────────────────────┐ │  "Which pairing key…"        │
│  │ tsk-4id  Task detail pairing    ⋯ │ │  parked 2h ago               │
│  │ ● awaiting-human · executing      │ │  [ Answer ]                  │
│  └────────────────────────────────────┘ │                              │
│  ┌────────────────────────────────────┐ │  tsk-k4v                     │
│  │ tsk-k4v  Webserver core         ⋯ │ │  gate: validateApprove       │
│  │ ● awaiting-approval · executing   │ │  [ Review ]                  │
│  └────────────────────────────────────┘ │                              │
│                                         │                              │
│ ▾ IN PROGRESS · 3           ● blue      │                              │
│  ┌────────────────────────────────────┐ │                              │
│  │ tsk-5jr  Taskboard              ⋯ │ │                              │
│  │ ● doing · executing               │ │                              │
│  └────────────────────────────────────┘ │                              │
│                                         │                              │
│ ▸ TODO · 11                 ● slate     │                              │
│ ▸ DONE · 48                 ● green     │                              │
└─────────────────────────────────────────┴──────────────────────────────┘
```

**Kanban view** — the same groups as side-by-side columns, each with its
own colored header bar; cards move by drag or by the same `⋯` quick-action
menu group view uses. Best for working a single group's queue left-to-right
without collapsing everything else. The "needs answer" rail still pins
right, unchanged, because A-S02-006's target (S04) does not depend on
which board view is active.

```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ herdr   [project ▾]  [gateway: dev-box ▾]      ⚠ reachable on network  │
├ CONTROLS ──────────────────────────────────────────────────────────────┤
│ [search…]  Group by: [Status ▾]  Filter: [Stage ▾][Risk ▾]  View:[▤ ▥]  [+ Add] │
├ BOARD (kanban) ─────────────────────────────────────────┬ NEEDS ANSWER ┤
│ ●AMBER        │ ●BLUE          │ ●SLATE      │ ●GREEN   │              │
│ NEEDS ANSWER·2│ IN PROGRESS·3  │ TODO·11     │ DONE·48  │  tsk-4id     │
│ ┌───────────┐ │ ┌────────────┐ │ ┌─────────┐ │          │  "Which…"    │
│ │ tsk-4id ⋯ │ │ │ tsk-5jr  ⋯ │ │ │ ...   ⋯ │ │          │  [ Answer ]  │
│ │ awaiting- │ │ │ doing ·    │ │ └─────────┘ │          │              │
│ │ human     │ │ │ executing  │ │ ┌─────────┐ │          │  tsk-k4v     │
│ └───────────┘ │ └────────────┘ │ │ ...   ⋯ │ │          │  gate: ...   │
│ ┌───────────┐ │                │ └─────────┘ │          │  [ Review ]  │
│ │ tsk-k4v ⋯ │ │                │             │          │              │
│ └───────────┘ │                │             │          │              │
└────────────────┴────────────────┴─────────────┴──────────┴──────────────┘
```

Mobile always uses group view (kanban's side-by-side columns do not fit a
phone width) — the rail becomes the first group, because on a phone the
whole point is "does anything need me":

```
┌────────────────────────────┐
│ herdr  [dev-box ▾]   ⚠     │
│ [search…]      [Filter ▾]  │
├────────────────────────────┤
│ ▾ NEEDS ANSWER · 2   ●     │
│ ┌────────────────────────┐ │
│ │ tsk-4id             ⋯ │ │
│ │ Task detail pairing    │ │
│ │ ● awaiting-human       │ │
│ │ [ Answer ]             │ │
│ └────────────────────────┘ │
│ ▸ IN PROGRESS · 3    ●     │
│ ▸ TODO · 11          ●     │
└────────────────────────────┘
```

Four layout decisions worth stating, because each one is load-bearing:

- **Groups are collapsible and remember their state.** `DONE · 48` is
  noise on a phone; it collapses and stays collapsed.
- **The exposure indicator lives in the topbar, always.** R5 says the
  surface is on by default and reachable beyond loopback. That is a
  standing fact about this deployment, so it gets a standing indicator,
  never a dismissable toast.
- **The gateway picker is in the topbar too**, because R1 forbids
  assuming one fixed origin, and a person aggregating several machines
  needs to know which one they are looking at before they read a number.
- **Group view and kanban view are the same data, two renderings** (D16).
  The toggle lives in CONTROLS next to Group by, not in the topbar — it is
  a reading preference, not deployment state like the exposure indicator.
  Desktop only; a phone always gets group view (side-by-side columns do
  not fit).
````

### Full target shown text

````text
## Layout

Desktop offers **two board views of the same underlying grouped data** —
a person picks whichever reading suits the moment, and the choice is
remembered (D16, `docs/history/herdr-web-dashboard/CONTEXT.md`). Neither
view is a separate screen; both read the same `GET /work` grouped-by-status
data, they only differ in how that grouping renders.

**Group view** (default) — status groups stacked vertically, each
collapsible, with the "needs answer" rail pinned right so the one urgent
category is never scrolled past. Best for triage: scan every group's count
without horizontal scanning.

```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ herdr   [project ▾]  [gateway: dev-box ▾]      ⚠ reachable on network  │
├ CONTROLS ──────────────────────────────────────────────────────────────┤
│ [search…]  Group by: [Status ▾]  Filter: [Stage ▾][Risk ▾]  View:[▤ ▥]  [+ Add] │
├ BOARD ──────────────────────────────────┬ NEEDS ANSWER ────────────────┤
│                                         │                              │
│ ▾ NEEDS ANSWER · 2          ● amber     │  tsk-4id                     │
│  ┌────────────────────────────────────┐ │  "Which pairing key…"        │
│  │ tsk-4id  Task detail pairing    ⋯ │ │  parked 2h ago               │
│  │ ● awaiting-human · executing      │ │  [ Answer ]                  │
│  └────────────────────────────────────┘ │                              │
│  ┌────────────────────────────────────┐ │  tsk-k4v                     │
│  │ tsk-k4v  Webserver core         ⋯ │ │  gate: validateApprove       │
│  │ ● awaiting-approval · executing   │ │  [ Review ]                  │
│  └────────────────────────────────────┘ │                              │
│                                         │                              │
│ ▾ IN PROGRESS · 3           ● blue      │                              │
│  ┌────────────────────────────────────┐ │                              │
│  │ tsk-5jr  Taskboard              ⋯ │ │                              │
│  │ ● doing · executing               │ │                              │
│  └────────────────────────────────────┘ │                              │
│                                         │                              │
│ ▸ TODO · 11                 ● slate     │                              │
│ ▸ DONE · 48                 ● green     │                              │
└─────────────────────────────────────────┴──────────────────────────────┘
```

**Kanban view** — the same groups as side-by-side columns, each with its
own colored header bar; cards move by drag or by the same `⋯` quick-action
menu group view uses. Best for working a single group's queue left-to-right
without collapsing everything else. The "needs answer" rail still pins
right, unchanged, because A-S02-006's target (S04) does not depend on
which board view is active.

```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ herdr   [project ▾]  [gateway: dev-box ▾]      ⚠ reachable on network  │
├ CONTROLS ──────────────────────────────────────────────────────────────┤
│ [search…]  Group by: [Status ▾]  Filter: [Stage ▾][Risk ▾]  View:[▤ ▥]  [+ Add] │
├ BOARD (kanban) ─────────────────────────────────────────┬ NEEDS ANSWER ┤
│ ●AMBER        │ ●BLUE          │ ●SLATE      │ ●GREEN   │              │
│ NEEDS ANSWER·2│ IN PROGRESS·3  │ TODO·11     │ DONE·48  │  tsk-4id     │
│ ┌───────────┐ │ ┌────────────┐ │ ┌─────────┐ │          │  "Which…"    │
│ │ tsk-4id ⋯ │ │ │ tsk-5jr  ⋯ │ │ │ ...   ⋯ │ │          │  [ Answer ]  │
│ │ awaiting- │ │ │ doing ·    │ │ └─────────┘ │          │              │
│ │ human     │ │ │ executing  │ │ ┌─────────┐ │          │  tsk-k4v     │
│ └───────────┘ │ └────────────┘ │ │ ...   ⋯ │ │          │  gate: ...   │
│ ┌───────────┐ │                │ └─────────┘ │          │  [ Review ]  │
│ │ tsk-k4v ⋯ │ │                │             │          │              │
│ └───────────┘ │                │             │          │              │
└────────────────┴────────────────┴─────────────┴──────────┴──────────────┘
```

Mobile always uses group view (kanban's side-by-side columns do not fit a
phone width) — the rail becomes the first group, because on a phone the
whole point is "does anything need me":

```
┌────────────────────────────┐
│ herdr  [dev-box ▾]   ⚠     │
│ [search…]      [Filter ▾]  │
├────────────────────────────┤
│ ▾ NEEDS ANSWER · 2   ●     │
│ ┌────────────────────────┐ │
│ │ tsk-4id             ⋯ │ │
│ │ Task detail pairing    │ │
│ │ ● awaiting-human       │ │
│ │ [ Answer ]             │ │
│ └────────────────────────┘ │
│ ▸ IN PROGRESS · 3    ●     │
│ ▸ TODO · 11          ●     │
└────────────────────────────┘
```

Four layout decisions worth stating, because each one is load-bearing:

- **Groups are collapsible and remember their state.** `DONE · 48` is
  noise on a phone; it collapses and stays collapsed.
- **The exposure indicator lives in the topbar, always.** R5 says the
  surface is on by default and reachable beyond loopback. That is a
  standing fact about this deployment, so it gets a standing indicator,
  never a dismissable toast.
- **The gateway picker is in the topbar too**, because R1 forbids
  assuming one fixed origin, and a person aggregating several machines
  needs to know which one they are looking at before they read a number.
- **Group view and kanban view are the same data, two renderings** (D16).
  The toggle lives in CONTROLS next to Group by, not in the topbar — it is
  a reading preference, not deployment state like the exposure indicator.
  Desktop only; a phone always gets group view (side-by-side columns do
  not fit).
````

## claim_6c49dcd927215fbd7baede5222cf1ab5

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#unheaded-block-4; lines 30–34; ancestry ["S02 — Taskboard","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-6; ancestry ["S02 — Taskboard","Layout"].
Source digest: 92d5bb85b24a6afb40d5a3307f5ec307c29432af7ae1e8d96917e851e4f42559
Target digest: 92d5bb85b24a6afb40d5a3307f5ec307c29432af7ae1e8d96917e851e4f42559
Shown source SHA256: 92d5bb85b24a6afb40d5a3307f5ec307c29432af7ae1e8d96917e851e4f42559
Shown target SHA256: 92d5bb85b24a6afb40d5a3307f5ec307c29432af7ae1e8d96917e851e4f42559

### Complete proposed decision

```json
{
  "claimId": "claim_6c49dcd927215fbd7baede5222cf1ab5",
  "sourceUnitDigest": "92d5bb85b24a6afb40d5a3307f5ec307c29432af7ae1e8d96917e851e4f42559",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S02-taskboard.md#unheaded-block-4 (source lines 30-34) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-6 (candidate lines 52-56). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "92d5bb85b24a6afb40d5a3307f5ec307c29432af7ae1e8d96917e851e4f42559",
  "targetAncestry": [
    "S02 — Taskboard",
    "Layout"
  ]
}
```

### Full source shown text

```text
Desktop offers **two board views of the same underlying grouped data** —
a person picks whichever reading suits the moment, and the choice is
remembered (D16, `docs/history/herdr-web-dashboard/CONTEXT.md`). Neither
view is a separate screen; both read the same `GET /work` grouped-by-status
data, they only differ in how that grouping renders.
```

### Full target shown text

```text
Desktop offers **two board views of the same underlying grouped data** —
a person picks whichever reading suits the moment, and the choice is
remembered (D16, `docs/history/herdr-web-dashboard/CONTEXT.md`). Neither
view is a separate screen; both read the same `GET /work` grouped-by-status
data, they only differ in how that grouping renders.
```

## claim_8f3f773ca083b9fa8272988d07965164

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#unheaded-block-5; lines 36–39; ancestry ["S02 — Taskboard","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-7; ancestry ["S02 — Taskboard","Layout"].
Source digest: 9d5272a9af071d018bebc204e6a0e664b384eeec29da148b705025af29ee6f65
Target digest: 9d5272a9af071d018bebc204e6a0e664b384eeec29da148b705025af29ee6f65
Shown source SHA256: 9d5272a9af071d018bebc204e6a0e664b384eeec29da148b705025af29ee6f65
Shown target SHA256: 9d5272a9af071d018bebc204e6a0e664b384eeec29da148b705025af29ee6f65

### Complete proposed decision

```json
{
  "claimId": "claim_8f3f773ca083b9fa8272988d07965164",
  "sourceUnitDigest": "9d5272a9af071d018bebc204e6a0e664b384eeec29da148b705025af29ee6f65",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S02-taskboard.md#unheaded-block-5 (source lines 36-39) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-7 (candidate lines 58-61). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "9d5272a9af071d018bebc204e6a0e664b384eeec29da148b705025af29ee6f65",
  "targetAncestry": [
    "S02 — Taskboard",
    "Layout"
  ]
}
```

### Full source shown text

```text
**Group view** (default) — status groups stacked vertically, each
collapsible, with the "needs answer" rail pinned right so the one urgent
category is never scrolled past. Best for triage: scan every group's count
without horizontal scanning.
```

### Full target shown text

```text
**Group view** (default) — status groups stacked vertically, each
collapsible, with the "needs answer" rail pinned right so the one urgent
category is never scrolled past. Best for triage: scan every group's count
without horizontal scanning.
```

## claim_369a407225765e238efb7a418e0a44a5

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#unheaded-block-6; lines 41–67; ancestry ["S02 — Taskboard","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-8; ancestry ["S02 — Taskboard","Layout"].
Source digest: 2b6f1fe0ac2043898c36fa322709dbd8d1b00cc292b35b1d3e2fdf60ecc7d49c
Target digest: 2b6f1fe0ac2043898c36fa322709dbd8d1b00cc292b35b1d3e2fdf60ecc7d49c
Shown source SHA256: 2b6f1fe0ac2043898c36fa322709dbd8d1b00cc292b35b1d3e2fdf60ecc7d49c
Shown target SHA256: 2b6f1fe0ac2043898c36fa322709dbd8d1b00cc292b35b1d3e2fdf60ecc7d49c

### Complete proposed decision

```json
{
  "claimId": "claim_369a407225765e238efb7a418e0a44a5",
  "sourceUnitDigest": "2b6f1fe0ac2043898c36fa322709dbd8d1b00cc292b35b1d3e2fdf60ecc7d49c",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S02-taskboard.md#unheaded-block-6 (source lines 41-67) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-8 (candidate lines 63-89). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "2b6f1fe0ac2043898c36fa322709dbd8d1b00cc292b35b1d3e2fdf60ecc7d49c",
  "targetAncestry": [
    "S02 — Taskboard",
    "Layout"
  ]
}
```

### Full source shown text

````text
```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ herdr   [project ▾]  [gateway: dev-box ▾]      ⚠ reachable on network  │
├ CONTROLS ──────────────────────────────────────────────────────────────┤
│ [search…]  Group by: [Status ▾]  Filter: [Stage ▾][Risk ▾]  View:[▤ ▥]  [+ Add] │
├ BOARD ──────────────────────────────────┬ NEEDS ANSWER ────────────────┤
│                                         │                              │
│ ▾ NEEDS ANSWER · 2          ● amber     │  tsk-4id                     │
│  ┌────────────────────────────────────┐ │  "Which pairing key…"        │
│  │ tsk-4id  Task detail pairing    ⋯ │ │  parked 2h ago               │
│  │ ● awaiting-human · executing      │ │  [ Answer ]                  │
│  └────────────────────────────────────┘ │                              │
│  ┌────────────────────────────────────┐ │  tsk-k4v                     │
│  │ tsk-k4v  Webserver core         ⋯ │ │  gate: validateApprove       │
│  │ ● awaiting-approval · executing   │ │  [ Review ]                  │
│  └────────────────────────────────────┘ │                              │
│                                         │                              │
│ ▾ IN PROGRESS · 3           ● blue      │                              │
│  ┌────────────────────────────────────┐ │                              │
│  │ tsk-5jr  Taskboard              ⋯ │ │                              │
│  │ ● doing · executing               │ │                              │
│  └────────────────────────────────────┘ │                              │
│                                         │                              │
│ ▸ TODO · 11                 ● slate     │                              │
│ ▸ DONE · 48                 ● green     │                              │
└─────────────────────────────────────────┴──────────────────────────────┘
```
````

### Full target shown text

````text
```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ herdr   [project ▾]  [gateway: dev-box ▾]      ⚠ reachable on network  │
├ CONTROLS ──────────────────────────────────────────────────────────────┤
│ [search…]  Group by: [Status ▾]  Filter: [Stage ▾][Risk ▾]  View:[▤ ▥]  [+ Add] │
├ BOARD ──────────────────────────────────┬ NEEDS ANSWER ────────────────┤
│                                         │                              │
│ ▾ NEEDS ANSWER · 2          ● amber     │  tsk-4id                     │
│  ┌────────────────────────────────────┐ │  "Which pairing key…"        │
│  │ tsk-4id  Task detail pairing    ⋯ │ │  parked 2h ago               │
│  │ ● awaiting-human · executing      │ │  [ Answer ]                  │
│  └────────────────────────────────────┘ │                              │
│  ┌────────────────────────────────────┐ │  tsk-k4v                     │
│  │ tsk-k4v  Webserver core         ⋯ │ │  gate: validateApprove       │
│  │ ● awaiting-approval · executing   │ │  [ Review ]                  │
│  └────────────────────────────────────┘ │                              │
│                                         │                              │
│ ▾ IN PROGRESS · 3           ● blue      │                              │
│  ┌────────────────────────────────────┐ │                              │
│  │ tsk-5jr  Taskboard              ⋯ │ │                              │
│  │ ● doing · executing               │ │                              │
│  └────────────────────────────────────┘ │                              │
│                                         │                              │
│ ▸ TODO · 11                 ● slate     │                              │
│ ▸ DONE · 48                 ● green     │                              │
└─────────────────────────────────────────┴──────────────────────────────┘
```
````

## claim_d30db7db84e70167a04fe1c5fb39a4e5

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#unheaded-block-7; lines 69–74; ancestry ["S02 — Taskboard","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-9; ancestry ["S02 — Taskboard","Layout"].
Source digest: 44e5096326dec39d14a8a592692f8a35506500aa313895e4f25751193f0be1a2
Target digest: 44e5096326dec39d14a8a592692f8a35506500aa313895e4f25751193f0be1a2
Shown source SHA256: 44e5096326dec39d14a8a592692f8a35506500aa313895e4f25751193f0be1a2
Shown target SHA256: 44e5096326dec39d14a8a592692f8a35506500aa313895e4f25751193f0be1a2

### Complete proposed decision

```json
{
  "claimId": "claim_d30db7db84e70167a04fe1c5fb39a4e5",
  "sourceUnitDigest": "44e5096326dec39d14a8a592692f8a35506500aa313895e4f25751193f0be1a2",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S02-taskboard.md#unheaded-block-7 (source lines 69-74) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-9 (candidate lines 91-96). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "44e5096326dec39d14a8a592692f8a35506500aa313895e4f25751193f0be1a2",
  "targetAncestry": [
    "S02 — Taskboard",
    "Layout"
  ]
}
```

### Full source shown text

```text
**Kanban view** — the same groups as side-by-side columns, each with its
own colored header bar; cards move by drag or by the same `⋯` quick-action
menu group view uses. Best for working a single group's queue left-to-right
without collapsing everything else. The "needs answer" rail still pins
right, unchanged, because A-S02-006's target (S04) does not depend on
which board view is active.
```

### Full target shown text

```text
**Kanban view** — the same groups as side-by-side columns, each with its
own colored header bar; cards move by drag or by the same `⋯` quick-action
menu group view uses. Best for working a single group's queue left-to-right
without collapsing everything else. The "needs answer" rail still pins
right, unchanged, because A-S02-006's target (S04) does not depend on
which board view is active.
```

## claim_38f435fc7cb64228e37d157820f6222c

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#unheaded-block-8; lines 76–93; ancestry ["S02 — Taskboard","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-10; ancestry ["S02 — Taskboard","Layout"].
Source digest: b536b23ef7b47aec1235043d572a048bdfbcdf4339af68ecfccdd7977336c6a2
Target digest: b536b23ef7b47aec1235043d572a048bdfbcdf4339af68ecfccdd7977336c6a2
Shown source SHA256: b536b23ef7b47aec1235043d572a048bdfbcdf4339af68ecfccdd7977336c6a2
Shown target SHA256: b536b23ef7b47aec1235043d572a048bdfbcdf4339af68ecfccdd7977336c6a2

### Complete proposed decision

```json
{
  "claimId": "claim_38f435fc7cb64228e37d157820f6222c",
  "sourceUnitDigest": "b536b23ef7b47aec1235043d572a048bdfbcdf4339af68ecfccdd7977336c6a2",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "unheaded-block-10",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S02-taskboard.md#unheaded-block-8 (source lines 76-93) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-10 (candidate lines 98-115). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b536b23ef7b47aec1235043d572a048bdfbcdf4339af68ecfccdd7977336c6a2",
  "targetAncestry": [
    "S02 — Taskboard",
    "Layout"
  ]
}
```

### Full source shown text

````text
```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ herdr   [project ▾]  [gateway: dev-box ▾]      ⚠ reachable on network  │
├ CONTROLS ──────────────────────────────────────────────────────────────┤
│ [search…]  Group by: [Status ▾]  Filter: [Stage ▾][Risk ▾]  View:[▤ ▥]  [+ Add] │
├ BOARD (kanban) ─────────────────────────────────────────┬ NEEDS ANSWER ┤
│ ●AMBER        │ ●BLUE          │ ●SLATE      │ ●GREEN   │              │
│ NEEDS ANSWER·2│ IN PROGRESS·3  │ TODO·11     │ DONE·48  │  tsk-4id     │
│ ┌───────────┐ │ ┌────────────┐ │ ┌─────────┐ │          │  "Which…"    │
│ │ tsk-4id ⋯ │ │ │ tsk-5jr  ⋯ │ │ │ ...   ⋯ │ │          │  [ Answer ]  │
│ │ awaiting- │ │ │ doing ·    │ │ └─────────┘ │          │              │
│ │ human     │ │ │ executing  │ │ ┌─────────┐ │          │  tsk-k4v     │
│ └───────────┘ │ └────────────┘ │ │ ...   ⋯ │ │          │  gate: ...   │
│ ┌───────────┐ │                │ └─────────┘ │          │  [ Review ]  │
│ │ tsk-k4v ⋯ │ │                │             │          │              │
│ └───────────┘ │                │             │          │              │
└────────────────┴────────────────┴─────────────┴──────────┴──────────────┘
```
````

### Full target shown text

````text
```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ herdr   [project ▾]  [gateway: dev-box ▾]      ⚠ reachable on network  │
├ CONTROLS ──────────────────────────────────────────────────────────────┤
│ [search…]  Group by: [Status ▾]  Filter: [Stage ▾][Risk ▾]  View:[▤ ▥]  [+ Add] │
├ BOARD (kanban) ─────────────────────────────────────────┬ NEEDS ANSWER ┤
│ ●AMBER        │ ●BLUE          │ ●SLATE      │ ●GREEN   │              │
│ NEEDS ANSWER·2│ IN PROGRESS·3  │ TODO·11     │ DONE·48  │  tsk-4id     │
│ ┌───────────┐ │ ┌────────────┐ │ ┌─────────┐ │          │  "Which…"    │
│ │ tsk-4id ⋯ │ │ │ tsk-5jr  ⋯ │ │ │ ...   ⋯ │ │          │  [ Answer ]  │
│ │ awaiting- │ │ │ doing ·    │ │ └─────────┘ │          │              │
│ │ human     │ │ │ executing  │ │ ┌─────────┐ │          │  tsk-k4v     │
│ └───────────┘ │ └────────────┘ │ │ ...   ⋯ │ │          │  gate: ...   │
│ ┌───────────┐ │                │ └─────────┘ │          │  [ Review ]  │
│ │ tsk-k4v ⋯ │ │                │             │          │              │
│ └───────────┘ │                │             │          │              │
└────────────────┴────────────────┴─────────────┴──────────┴──────────────┘
```
````

## claim_2cc8f26dc0394eb2b7b92cc169beb784

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#unheaded-block-9; lines 95–97; ancestry ["S02 — Taskboard","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-11; ancestry ["S02 — Taskboard","Layout"].
Source digest: 5871d326ddf941670b46430bef5aeb8943e96bb7633632d0024e62ed91227d91
Target digest: 5871d326ddf941670b46430bef5aeb8943e96bb7633632d0024e62ed91227d91
Shown source SHA256: 5871d326ddf941670b46430bef5aeb8943e96bb7633632d0024e62ed91227d91
Shown target SHA256: 5871d326ddf941670b46430bef5aeb8943e96bb7633632d0024e62ed91227d91

### Complete proposed decision

```json
{
  "claimId": "claim_2cc8f26dc0394eb2b7b92cc169beb784",
  "sourceUnitDigest": "5871d326ddf941670b46430bef5aeb8943e96bb7633632d0024e62ed91227d91",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "unheaded-block-11",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S02-taskboard.md#unheaded-block-9 (source lines 95-97) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-11 (candidate lines 117-119). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "5871d326ddf941670b46430bef5aeb8943e96bb7633632d0024e62ed91227d91",
  "targetAncestry": [
    "S02 — Taskboard",
    "Layout"
  ]
}
```

### Full source shown text

```text
Mobile always uses group view (kanban's side-by-side columns do not fit a
phone width) — the rail becomes the first group, because on a phone the
whole point is "does anything need me":
```

### Full target shown text

```text
Mobile always uses group view (kanban's side-by-side columns do not fit a
phone width) — the rail becomes the first group, because on a phone the
whole point is "does anything need me":
```

## claim_66dc01994689c5fb630f56fdb1180788

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#unheaded-block-10; lines 99–114; ancestry ["S02 — Taskboard","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-12; ancestry ["S02 — Taskboard","Layout"].
Source digest: a768cd0192df2071b079184f5b8405d4264a777258de3c2cbcb2001773328c9d
Target digest: a768cd0192df2071b079184f5b8405d4264a777258de3c2cbcb2001773328c9d
Shown source SHA256: a768cd0192df2071b079184f5b8405d4264a777258de3c2cbcb2001773328c9d
Shown target SHA256: a768cd0192df2071b079184f5b8405d4264a777258de3c2cbcb2001773328c9d

### Complete proposed decision

```json
{
  "claimId": "claim_66dc01994689c5fb630f56fdb1180788",
  "sourceUnitDigest": "a768cd0192df2071b079184f5b8405d4264a777258de3c2cbcb2001773328c9d",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "unheaded-block-12",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S02-taskboard.md#unheaded-block-10 (source lines 99-114) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-12 (candidate lines 121-136). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "a768cd0192df2071b079184f5b8405d4264a777258de3c2cbcb2001773328c9d",
  "targetAncestry": [
    "S02 — Taskboard",
    "Layout"
  ]
}
```

### Full source shown text

````text
```
┌────────────────────────────┐
│ herdr  [dev-box ▾]   ⚠     │
│ [search…]      [Filter ▾]  │
├────────────────────────────┤
│ ▾ NEEDS ANSWER · 2   ●     │
│ ┌────────────────────────┐ │
│ │ tsk-4id             ⋯ │ │
│ │ Task detail pairing    │ │
│ │ ● awaiting-human       │ │
│ │ [ Answer ]             │ │
│ └────────────────────────┘ │
│ ▸ IN PROGRESS · 3    ●     │
│ ▸ TODO · 11          ●     │
└────────────────────────────┘
```
````

### Full target shown text

````text
```
┌────────────────────────────┐
│ herdr  [dev-box ▾]   ⚠     │
│ [search…]      [Filter ▾]  │
├────────────────────────────┤
│ ▾ NEEDS ANSWER · 2   ●     │
│ ┌────────────────────────┐ │
│ │ tsk-4id             ⋯ │ │
│ │ Task detail pairing    │ │
│ │ ● awaiting-human       │ │
│ │ [ Answer ]             │ │
│ └────────────────────────┘ │
│ ▸ IN PROGRESS · 3    ●     │
│ ▸ TODO · 11          ●     │
└────────────────────────────┘
```
````

## claim_16ece324dc00b79759255e4acb8435ae

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#unheaded-block-11; lines 116–116; ancestry ["S02 — Taskboard","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-13; ancestry ["S02 — Taskboard","Layout"].
Source digest: 0ca03f8d5a4fc7686ab220d8c37c4cb7550adbb659ba634f15b572532c529b6d
Target digest: 0ca03f8d5a4fc7686ab220d8c37c4cb7550adbb659ba634f15b572532c529b6d
Shown source SHA256: 0ca03f8d5a4fc7686ab220d8c37c4cb7550adbb659ba634f15b572532c529b6d
Shown target SHA256: 0ca03f8d5a4fc7686ab220d8c37c4cb7550adbb659ba634f15b572532c529b6d

### Complete proposed decision

```json
{
  "claimId": "claim_16ece324dc00b79759255e4acb8435ae",
  "sourceUnitDigest": "0ca03f8d5a4fc7686ab220d8c37c4cb7550adbb659ba634f15b572532c529b6d",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "unheaded-block-13",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S02-taskboard.md#unheaded-block-11 (source lines 116-116) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-13 (candidate lines 138-138). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0ca03f8d5a4fc7686ab220d8c37c4cb7550adbb659ba634f15b572532c529b6d",
  "targetAncestry": [
    "S02 — Taskboard",
    "Layout"
  ]
}
```

### Full source shown text

```text
Four layout decisions worth stating, because each one is load-bearing:
```

### Full target shown text

```text
Four layout decisions worth stating, because each one is load-bearing:
```

## claim_6cd22f67c65c9cc4aa70c160cababb24

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#unheaded-block-12; lines 118–131; ancestry ["S02 — Taskboard","Layout"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-14; ancestry ["S02 — Taskboard","Layout"].
Source digest: c6219ddf92aa1f458b5ff3801173d8bf355b5e4c27b4c1411258f4ac60bb49f7
Target digest: c6219ddf92aa1f458b5ff3801173d8bf355b5e4c27b4c1411258f4ac60bb49f7
Shown source SHA256: c6219ddf92aa1f458b5ff3801173d8bf355b5e4c27b4c1411258f4ac60bb49f7
Shown target SHA256: c6219ddf92aa1f458b5ff3801173d8bf355b5e4c27b4c1411258f4ac60bb49f7

### Complete proposed decision

```json
{
  "claimId": "claim_6cd22f67c65c9cc4aa70c160cababb24",
  "sourceUnitDigest": "c6219ddf92aa1f458b5ff3801173d8bf355b5e4c27b4c1411258f4ac60bb49f7",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "unheaded-block-14",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S02-taskboard.md#unheaded-block-12 (source lines 118-131) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-14 (candidate lines 140-153). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c6219ddf92aa1f458b5ff3801173d8bf355b5e4c27b4c1411258f4ac60bb49f7",
  "targetAncestry": [
    "S02 — Taskboard",
    "Layout"
  ]
}
```

### Full source shown text

```text
- **Groups are collapsible and remember their state.** `DONE · 48` is
  noise on a phone; it collapses and stays collapsed.
- **The exposure indicator lives in the topbar, always.** R5 says the
  surface is on by default and reachable beyond loopback. That is a
  standing fact about this deployment, so it gets a standing indicator,
  never a dismissable toast.
- **The gateway picker is in the topbar too**, because R1 forbids
  assuming one fixed origin, and a person aggregating several machines
  needs to know which one they are looking at before they read a number.
- **Group view and kanban view are the same data, two renderings** (D16).
  The toggle lives in CONTROLS next to Group by, not in the topbar — it is
  a reading preference, not deployment state like the exposure indicator.
  Desktop only; a phone always gets group view (side-by-side columns do
  not fit).
```

### Full target shown text

```text
- **Groups are collapsible and remember their state.** `DONE · 48` is
  noise on a phone; it collapses and stays collapsed.
- **The exposure indicator lives in the topbar, always.** R5 says the
  surface is on by default and reachable beyond loopback. That is a
  standing fact about this deployment, so it gets a standing indicator,
  never a dismissable toast.
- **The gateway picker is in the topbar too**, because R1 forbids
  assuming one fixed origin, and a person aggregating several machines
  needs to know which one they are looking at before they read a number.
- **Group view and kanban view are the same data, two renderings** (D16).
  The toggle lives in CONTROLS next to Group by, not in the topbar — it is
  a reading preference, not deployment state like the exposure indicator.
  Desktop only; a phone always gets group view (side-by-side columns do
  not fit).
```

## claim_1ed9286862955b20a1067b2ba1f9de9e

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#states; lines 133–133; ancestry ["S02 — Taskboard"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#states; ancestry ["S02 — Taskboard"].
Source digest: 1293e7519f82a1ce0df25de2cde9a5f7a52fd645b74fae0d8b56a633a3035a43
Target digest: 1293e7519f82a1ce0df25de2cde9a5f7a52fd645b74fae0d8b56a633a3035a43
Shown source SHA256: a3a2621c9b2292b82ff8bcbdec0d820866ee502bc8f83dea91503f203a867fe0
Shown target SHA256: a3a2621c9b2292b82ff8bcbdec0d820866ee502bc8f83dea91503f203a867fe0

### Complete proposed decision

```json
{
  "claimId": "claim_1ed9286862955b20a1067b2ba1f9de9e",
  "sourceUnitDigest": "1293e7519f82a1ce0df25de2cde9a5f7a52fd645b74fae0d8b56a633a3035a43",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "states",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S02-taskboard.md#states (source lines 133-133) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#states (candidate lines 155-155). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "1293e7519f82a1ce0df25de2cde9a5f7a52fd645b74fae0d8b56a633a3035a43",
  "targetAncestry": [
    "S02 — Taskboard"
  ]
}
```

### Full source shown text

```text
## States

**ST-LOADING** shows skeleton cards inside real group headers (both
views), so counts appear before content and the layout never jumps.
**ST-EMPTY-BOARD** and **ST-EMPTY-FILTER** are deliberately different
screens — see `30-states-and-errors.md`. **ST-DISCONNECTED** marks the
board stale in place rather than blanking it.

No bell, no notification badge that implies push: **R11** — the count in
a group header is current only because the person is looking at it.
```

### Full target shown text

```text
## States

**ST-LOADING** shows skeleton cards inside real group headers (both
views), so counts appear before content and the layout never jumps.
**ST-EMPTY-BOARD** and **ST-EMPTY-FILTER** are deliberately different
screens — see `30-states-and-errors.md`. **ST-DISCONNECTED** marks the
board stale in place rather than blanking it.

No bell, no notification badge that implies push: **R11** — the count in
a group header is current only because the person is looking at it.
```

## claim_9fe8558f49b4210f3268eaa0a158d8ee

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#unheaded-block-13; lines 135–139; ancestry ["S02 — Taskboard","States"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-15; ancestry ["S02 — Taskboard","States"].
Source digest: 11e667e7a1a777b3438dc5cb09e5b06a99d03669ed81e932ae4039ab5830c1b2
Target digest: 11e667e7a1a777b3438dc5cb09e5b06a99d03669ed81e932ae4039ab5830c1b2
Shown source SHA256: 11e667e7a1a777b3438dc5cb09e5b06a99d03669ed81e932ae4039ab5830c1b2
Shown target SHA256: 11e667e7a1a777b3438dc5cb09e5b06a99d03669ed81e932ae4039ab5830c1b2

### Complete proposed decision

```json
{
  "claimId": "claim_9fe8558f49b4210f3268eaa0a158d8ee",
  "sourceUnitDigest": "11e667e7a1a777b3438dc5cb09e5b06a99d03669ed81e932ae4039ab5830c1b2",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "unheaded-block-15",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S02-taskboard.md#unheaded-block-13 (source lines 135-139) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-15 (candidate lines 157-161). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "11e667e7a1a777b3438dc5cb09e5b06a99d03669ed81e932ae4039ab5830c1b2",
  "targetAncestry": [
    "S02 — Taskboard",
    "States"
  ]
}
```

### Full source shown text

```text
**ST-LOADING** shows skeleton cards inside real group headers (both
views), so counts appear before content and the layout never jumps.
**ST-EMPTY-BOARD** and **ST-EMPTY-FILTER** are deliberately different
screens — see `30-states-and-errors.md`. **ST-DISCONNECTED** marks the
board stale in place rather than blanking it.
```

### Full target shown text

```text
**ST-LOADING** shows skeleton cards inside real group headers (both
views), so counts appear before content and the layout never jumps.
**ST-EMPTY-BOARD** and **ST-EMPTY-FILTER** are deliberately different
screens — see `30-states-and-errors.md`. **ST-DISCONNECTED** marks the
board stale in place rather than blanking it.
```

## claim_6c75a8d85b8232cfedf1ae86a7eda90a

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#unheaded-block-14; lines 141–142; ancestry ["S02 — Taskboard","States"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-16; ancestry ["S02 — Taskboard","States"].
Source digest: 6dde20c3978ee0c0934fe097a36e8d402767de43ff2d906b1f1f619356552e51
Target digest: 6dde20c3978ee0c0934fe097a36e8d402767de43ff2d906b1f1f619356552e51
Shown source SHA256: 6dde20c3978ee0c0934fe097a36e8d402767de43ff2d906b1f1f619356552e51
Shown target SHA256: 6dde20c3978ee0c0934fe097a36e8d402767de43ff2d906b1f1f619356552e51

### Complete proposed decision

```json
{
  "claimId": "claim_6c75a8d85b8232cfedf1ae86a7eda90a",
  "sourceUnitDigest": "6dde20c3978ee0c0934fe097a36e8d402767de43ff2d906b1f1f619356552e51",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "unheaded-block-16",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S02-taskboard.md#unheaded-block-14 (source lines 141-142) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-16 (candidate lines 163-164). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6dde20c3978ee0c0934fe097a36e8d402767de43ff2d906b1f1f619356552e51",
  "targetAncestry": [
    "S02 — Taskboard",
    "States"
  ]
}
```

### Full source shown text

```text
No bell, no notification badge that implies push: **R11** — the count in
a group header is current only because the person is looking at it.
```

### Full target shown text

```text
No bell, no notification badge that implies push: **R11** — the count in
a group header is current only because the person is looking at it.
```

## claim_695d51475befe3701ccb1b7d9570db36

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#interactions; lines 144–144; ancestry ["S02 — Taskboard"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#interactions; ancestry ["S02 — Taskboard"].
Source digest: 2ff4e1779675c3cd12fc22aa14a5a68e794b4b7d58cd001ad9e2eb945a8452d2
Target digest: 2ff4e1779675c3cd12fc22aa14a5a68e794b4b7d58cd001ad9e2eb945a8452d2
Shown source SHA256: 1b4e1ac8eecc2d575bf13a884de55d98c3d3ad4dd4a9b6237348161b621fc39c
Shown target SHA256: 1b4e1ac8eecc2d575bf13a884de55d98c3d3ad4dd4a9b6237348161b621fc39c

### Complete proposed decision

```json
{
  "claimId": "claim_695d51475befe3701ccb1b7d9570db36",
  "sourceUnitDigest": "2ff4e1779675c3cd12fc22aa14a5a68e794b4b7d58cd001ad9e2eb945a8452d2",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "interactions",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/screens/S02-taskboard.md#interactions (source lines 144-144) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#interactions (candidate lines 166-166). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "2ff4e1779675c3cd12fc22aa14a5a68e794b4b7d58cd001ad9e2eb945a8452d2",
  "targetAncestry": [
    "S02 — Taskboard"
  ]
}
```

### Full source shown text

````text
## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-S02-001
    element: item_card
    region: board
    trigger: click
    action: navigate
    target: S03
    payload: { item_id: "$item.id" }
  - id: A-S02-002
    element: add_item_button
    region: controls
    trigger: click
    action: open_overlay
    target: M03
  - id: A-S02-003
    element: group_header
    region: board
    trigger: click
    action: mutate
    effects: [toggle_group_collapsed, persist_collapse_state]
  - id: A-S02-004
    element: filter_control
    region: controls
    trigger: change
    action: mutate
    effects: [apply_filter, show_active_filter_summary]
  - id: A-S02-005
    element: group_by_control
    region: controls
    trigger: change
    action: mutate
    effects: [regroup_board]
  - id: A-S02-006
    element: needs_answer_entry
    region: needs_answer_rail
    trigger: click
    action: navigate
    target: S04
  - id: A-S02-007
    element: gateway_picker
    region: topbar
    trigger: change
    action: mutate
    effects: [switch_gateway_endpoint, reload_board]
  - id: A-S02-008
    element: board
    listens_to: work.changed
    action: mutate
    effects: [refresh_affected_card]
  - id: A-S02-009
    element: needs_answer_rail
    listens_to: question.opened
    action: mutate
    effects: [add_to_rail]
  - id: A-S02-010
    element: board
    listens_to: gateway.unreachable
    action: mutate
    effects: [mark_stale, offer_retry]
  - id: A-S02-011
    element: card_quick_action
    listens_to: item.quick_action
    action: mutate
    effects: [run_one_door_write_verb]
  - id: A-S02-012
    element: view_toggle_control
    region: controls
    trigger: click
    action: mutate
    effects: [switch_board_view, persist_view_state]
  - id: A-S02-013
    element: kanban_card
    region: board
    trigger: drag_drop
    guard: "board.view === 'kanban'"
    action: mutate
    effects: [run_one_door_write_verb, regroup_board]
```
````

### Full target shown text

````text
## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-S02-001
    element: item_card
    region: board
    trigger: click
    action: navigate
    target: S03
    payload: { item_id: "$item.id" }
  - id: A-S02-002
    element: add_item_button
    region: controls
    trigger: click
    action: open_overlay
    target: M03
  - id: A-S02-003
    element: group_header
    region: board
    trigger: click
    action: mutate
    effects: [toggle_group_collapsed, persist_collapse_state]
  - id: A-S02-004
    element: filter_control
    region: controls
    trigger: change
    action: mutate
    effects: [apply_filter, show_active_filter_summary]
  - id: A-S02-005
    element: group_by_control
    region: controls
    trigger: change
    action: mutate
    effects: [regroup_board]
  - id: A-S02-006
    element: needs_answer_entry
    region: needs_answer_rail
    trigger: click
    action: navigate
    target: S04
  - id: A-S02-007
    element: gateway_picker
    region: topbar
    trigger: change
    action: mutate
    effects: [switch_gateway_endpoint, reload_board]
  - id: A-S02-008
    element: board
    listens_to: work.changed
    action: mutate
    effects: [refresh_affected_card]
  - id: A-S02-009
    element: needs_answer_rail
    listens_to: question.opened
    action: mutate
    effects: [add_to_rail]
  - id: A-S02-010
    element: board
    listens_to: gateway.unreachable
    action: mutate
    effects: [mark_stale, offer_retry]
  - id: A-S02-011
    element: card_quick_action
    listens_to: item.quick_action
    action: mutate
    effects: [run_one_door_write_verb]
  - id: A-S02-012
    element: view_toggle_control
    region: controls
    trigger: click
    action: mutate
    effects: [switch_board_view, persist_view_state]
  - id: A-S02-013
    element: kanban_card
    region: board
    trigger: drag_drop
    guard: "board.view === 'kanban'"
    action: mutate
    effects: [run_one_door_write_verb, regroup_board]
```
````

## claim_47dd03576e4ae838330cee0a1a15e4bd

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/screens/S02-taskboard.md#unheaded-block-15; lines 146–224; ancestry ["S02 — Taskboard","Interactions"].
Target: docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-17; ancestry ["S02 — Taskboard","Interactions"].
Source digest: bad3057a791408cebe7749d16be0cac1086d0aa3a4825b16e2e96bf9494e5aa2
Target digest: bad3057a791408cebe7749d16be0cac1086d0aa3a4825b16e2e96bf9494e5aa2
Shown source SHA256: bad3057a791408cebe7749d16be0cac1086d0aa3a4825b16e2e96bf9494e5aa2
Shown target SHA256: bad3057a791408cebe7749d16be0cac1086d0aa3a4825b16e2e96bf9494e5aa2

### Complete proposed decision

```json
{
  "claimId": "claim_47dd03576e4ae838330cee0a1a15e4bd",
  "sourceUnitDigest": "bad3057a791408cebe7749d16be0cac1086d0aa3a4825b16e2e96bf9494e5aa2",
  "targetOwner": "docs/platform/ui-spec/architecture/screens/S02-taskboard.md",
  "targetAnchor": "unheaded-block-17",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/screens/S02-taskboard.md#unheaded-block-15 (source lines 146-224) is carried at docs/platform/ui-spec/architecture/screens/S02-taskboard.md#unheaded-block-17 (candidate lines 168-246). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/screens/S02-taskboard.md verbatim in docs/platform/ui-spec/architecture/screens/S02-taskboard.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "bad3057a791408cebe7749d16be0cac1086d0aa3a4825b16e2e96bf9494e5aa2",
  "targetAncestry": [
    "S02 — Taskboard",
    "Interactions"
  ]
}
```

### Full source shown text

````text
```yaml herdrweb-contract
interactions:
  - id: A-S02-001
    element: item_card
    region: board
    trigger: click
    action: navigate
    target: S03
    payload: { item_id: "$item.id" }
  - id: A-S02-002
    element: add_item_button
    region: controls
    trigger: click
    action: open_overlay
    target: M03
  - id: A-S02-003
    element: group_header
    region: board
    trigger: click
    action: mutate
    effects: [toggle_group_collapsed, persist_collapse_state]
  - id: A-S02-004
    element: filter_control
    region: controls
    trigger: change
    action: mutate
    effects: [apply_filter, show_active_filter_summary]
  - id: A-S02-005
    element: group_by_control
    region: controls
    trigger: change
    action: mutate
    effects: [regroup_board]
  - id: A-S02-006
    element: needs_answer_entry
    region: needs_answer_rail
    trigger: click
    action: navigate
    target: S04
  - id: A-S02-007
    element: gateway_picker
    region: topbar
    trigger: change
    action: mutate
    effects: [switch_gateway_endpoint, reload_board]
  - id: A-S02-008
    element: board
    listens_to: work.changed
    action: mutate
    effects: [refresh_affected_card]
  - id: A-S02-009
    element: needs_answer_rail
    listens_to: question.opened
    action: mutate
    effects: [add_to_rail]
  - id: A-S02-010
    element: board
    listens_to: gateway.unreachable
    action: mutate
    effects: [mark_stale, offer_retry]
  - id: A-S02-011
    element: card_quick_action
    listens_to: item.quick_action
    action: mutate
    effects: [run_one_door_write_verb]
  - id: A-S02-012
    element: view_toggle_control
    region: controls
    trigger: click
    action: mutate
    effects: [switch_board_view, persist_view_state]
  - id: A-S02-013
    element: kanban_card
    region: board
    trigger: drag_drop
    guard: "board.view === 'kanban'"
    action: mutate
    effects: [run_one_door_write_verb, regroup_board]
```
````

### Full target shown text

````text
```yaml herdrweb-contract
interactions:
  - id: A-S02-001
    element: item_card
    region: board
    trigger: click
    action: navigate
    target: S03
    payload: { item_id: "$item.id" }
  - id: A-S02-002
    element: add_item_button
    region: controls
    trigger: click
    action: open_overlay
    target: M03
  - id: A-S02-003
    element: group_header
    region: board
    trigger: click
    action: mutate
    effects: [toggle_group_collapsed, persist_collapse_state]
  - id: A-S02-004
    element: filter_control
    region: controls
    trigger: change
    action: mutate
    effects: [apply_filter, show_active_filter_summary]
  - id: A-S02-005
    element: group_by_control
    region: controls
    trigger: change
    action: mutate
    effects: [regroup_board]
  - id: A-S02-006
    element: needs_answer_entry
    region: needs_answer_rail
    trigger: click
    action: navigate
    target: S04
  - id: A-S02-007
    element: gateway_picker
    region: topbar
    trigger: change
    action: mutate
    effects: [switch_gateway_endpoint, reload_board]
  - id: A-S02-008
    element: board
    listens_to: work.changed
    action: mutate
    effects: [refresh_affected_card]
  - id: A-S02-009
    element: needs_answer_rail
    listens_to: question.opened
    action: mutate
    effects: [add_to_rail]
  - id: A-S02-010
    element: board
    listens_to: gateway.unreachable
    action: mutate
    effects: [mark_stale, offer_retry]
  - id: A-S02-011
    element: card_quick_action
    listens_to: item.quick_action
    action: mutate
    effects: [run_one_door_write_verb]
  - id: A-S02-012
    element: view_toggle_control
    region: controls
    trigger: click
    action: mutate
    effects: [switch_board_view, persist_view_state]
  - id: A-S02-013
    element: kanban_card
    region: board
    trigger: drag_drop
    guard: "board.view === 'kanban'"
    action: mutate
    effects: [run_one_door_write_verb, regroup_board]
```
````
