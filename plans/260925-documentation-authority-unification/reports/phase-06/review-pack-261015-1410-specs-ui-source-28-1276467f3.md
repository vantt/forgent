# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/modals/M03-add-edit-item.md
Part 1/1; entries: **13**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 5/5 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_e71250e07f6665431fa08d2d8e0b2dff",
      "claim_d7150c78cea2f7c841c76814f9dfea0f",
      "claim_d01d11ce35e918523f65bc915d2da0b9",
      "claim_4ad34124a2811bb062ec03fd65ac8dc7",
      "claim_71d00e3b90a0d091b06f0cbf5dd1d360",
      "claim_f25678161e3944edca10dce0bf2c9e83",
      "claim_f2aac5602a04a55ae1af5277932bafa2",
      "claim_3d2697461e6860c1c7b7ad98e1bb2f75"
    ],
    "Weak-exact": [
      "claim_a72c34c5936a40c3517b75b6fac112b3",
      "claim_56170cb013fb6f88d51c9f9052edf8d5",
      "claim_a3a9c673695f9ad9ae898eba35875979",
      "claim_68a4f9c55c4dd71e01dd0a511d3894c1"
    ],
    "Judgment": [
      "claim_9c63e8a354951e0f84f3a1399b6af388"
    ]
  },
  "unequalDigestPairs": [
    "claim_9c63e8a354951e0f84f3a1399b6af388"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_9c63e8a354951e0f84f3a1399b6af388"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_e71250e07f6665431fa08d2d8e0b2dff

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M03-add-edit-item.md#unheaded-block-1; lines 1–11; ancestry [].
Target: docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#unheaded-block-1; ancestry [].
Source digest: 24c8d79862a55393166a0eaaacec85b4ae046d8a96f3a12e0b44b1784fc23550
Target digest: 24c8d79862a55393166a0eaaacec85b4ae046d8a96f3a12e0b44b1784fc23550
Shown source SHA256: 24c8d79862a55393166a0eaaacec85b4ae046d8a96f3a12e0b44b1784fc23550
Shown target SHA256: 24c8d79862a55393166a0eaaacec85b4ae046d8a96f3a12e0b44b1784fc23550

### Complete proposed decision

```json
{
  "claimId": "claim_e71250e07f6665431fa08d2d8e0b2dff",
  "sourceUnitDigest": "24c8d79862a55393166a0eaaacec85b4ae046d8a96f3a12e0b44b1784fc23550",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/ui-spec/modals/M03-add-edit-item.md#unheaded-block-1 (source lines 1-11) is carried at docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#unheaded-block-1 (candidate lines 1-11). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M03-add-edit-item.md verbatim in docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "24c8d79862a55393166a0eaaacec85b4ae046d8a96f3a12e0b44b1784fc23550",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
id: M03
type: modal
name: "Add or edit a work item"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R2]
regions: [header, form, footer]
---
```

### Full target shown text

```text
---
id: M03
type: modal
name: "Add or edit a work item"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R2]
regions: [header, form, footer]
---
```

## claim_9c63e8a354951e0f84f3a1399b6af388

Class: Judgment; mandatory deep: true.
Source: docs/ui-spec/modals/M03-add-edit-item.md#m03-add-or-edit-a-work-item; lines 13–13; ancestry [].
Target: docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#m03-add-or-edit-a-work-item; ancestry [].
Source digest: d405eb32a994edf7c67d0deea40e0203e06ab47fcd449ec338db6bf70dc692b0
Target digest: 942bb5ce19e825141370aa234cc3b8950559082e388a1e249824b6fba347e968
Shown source SHA256: 26390889bd9e3a34d61671bd7e2ef9851686bcff57748fdfc0bef00e8de54a60
Shown target SHA256: 732b2487123c88289012c7f1dfc3ee4b7477573616b22056641a6fae44ff14cb

### Complete proposed decision

```json
{
  "claimId": "claim_9c63e8a354951e0f84f3a1399b6af388",
  "sourceUnitDigest": "d405eb32a994edf7c67d0deea40e0203e06ab47fcd449ec338db6bf70dc692b0",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md",
  "targetAnchor": "m03-add-or-edit-a-work-item",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/ui-spec/modals/M03-add-edit-item.md#m03-add-or-edit-a-work-item (source lines 13-13) is carried at docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#m03-add-or-edit-a-work-item (candidate lines 13-13). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M03-add-edit-item.md verbatim in docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "942bb5ce19e825141370aa234cc3b8950559082e388a1e249824b6fba347e968",
  "targetAncestry": []
}
```

### Full source shown text

```text
# M03 — Add or edit a work item
```

### Full target shown text

````text
# M03 — Add or edit a work item

```txt
Document type: Architecture
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/modals/M03-add-edit-item.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/ui-spec/modals/M03-add-edit-item.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.
````

## claim_a72c34c5936a40c3517b75b6fac112b3

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M03-add-edit-item.md#purpose; lines 15–15; ancestry ["M03 — Add or edit a work item"].
Target: docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#purpose; ancestry ["M03 — Add or edit a work item"].
Source digest: 72e7d038a93f287e6aea46d022eced3b171773e84fa24195c4aed29922a35013
Target digest: 72e7d038a93f287e6aea46d022eced3b171773e84fa24195c4aed29922a35013
Shown source SHA256: 03b4a92df29ff332025a1d5b4414c293d0f2c1b2586dd016d5b85304281ef411
Shown target SHA256: 03b4a92df29ff332025a1d5b4414c293d0f2c1b2586dd016d5b85304281ef411

### Complete proposed decision

```json
{
  "claimId": "claim_a72c34c5936a40c3517b75b6fac112b3",
  "sourceUnitDigest": "72e7d038a93f287e6aea46d022eced3b171773e84fa24195c4aed29922a35013",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md",
  "targetAnchor": "purpose",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/modals/M03-add-edit-item.md#purpose (source lines 15-15) is carried at docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#purpose (candidate lines 37-37). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M03-add-edit-item.md verbatim in docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "72e7d038a93f287e6aea46d022eced3b171773e84fa24195c4aed29922a35013",
  "targetAncestry": [
    "M03 — Add or edit a work item"
  ]
}
```

### Full source shown text

```text
## Purpose

Create a new work item, or overwrite the fields of an existing one
(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item).
One modal in two modes, because the fields and the validation are the
same; only the verb underneath differs.
```

### Full target shown text

```text
## Purpose

Create a new work item, or overwrite the fields of an existing one
(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item).
One modal in two modes, because the fields and the validation are the
same; only the verb underneath differs.
```

## claim_d7150c78cea2f7c841c76814f9dfea0f

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M03-add-edit-item.md#unheaded-block-2; lines 17–20; ancestry ["M03 — Add or edit a work item","Purpose"].
Target: docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#unheaded-block-4; ancestry ["M03 — Add or edit a work item","Purpose"].
Source digest: f23c10c096eb804d89eb694e20dfd43da56f30554d94a2927985c17698af5374
Target digest: f23c10c096eb804d89eb694e20dfd43da56f30554d94a2927985c17698af5374
Shown source SHA256: f23c10c096eb804d89eb694e20dfd43da56f30554d94a2927985c17698af5374
Shown target SHA256: f23c10c096eb804d89eb694e20dfd43da56f30554d94a2927985c17698af5374

### Complete proposed decision

```json
{
  "claimId": "claim_d7150c78cea2f7c841c76814f9dfea0f",
  "sourceUnitDigest": "f23c10c096eb804d89eb694e20dfd43da56f30554d94a2927985c17698af5374",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M03-add-edit-item.md#unheaded-block-2 (source lines 17-20) is carried at docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#unheaded-block-4 (candidate lines 39-42). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M03-add-edit-item.md verbatim in docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f23c10c096eb804d89eb694e20dfd43da56f30554d94a2927985c17698af5374",
  "targetAncestry": [
    "M03 — Add or edit a work item",
    "Purpose"
  ]
}
```

### Full source shown text

```text
Create a new work item, or overwrite the fields of an existing one
(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item).
One modal in two modes, because the fields and the validation are the
same; only the verb underneath differs.
```

### Full target shown text

```text
Create a new work item, or overwrite the fields of an existing one
(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item).
One modal in two modes, because the fields and the validation are the
same; only the verb underneath differs.
```

## claim_56170cb013fb6f88d51c9f9052edf8d5

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M03-add-edit-item.md#layout; lines 22–22; ancestry ["M03 — Add or edit a work item"].
Target: docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#layout; ancestry ["M03 — Add or edit a work item"].
Source digest: 6f21e81bc2f36a0f4491679c7d0580c0b9f002aa939fbd25ff3425c65c9c0bbd
Target digest: 6f21e81bc2f36a0f4491679c7d0580c0b9f002aa939fbd25ff3425c65c9c0bbd
Shown source SHA256: 89686d11fe2173c68db5ded62668ba89061e0aeed172a8476dccc72c498fbcd8
Shown target SHA256: 89686d11fe2173c68db5ded62668ba89061e0aeed172a8476dccc72c498fbcd8

### Complete proposed decision

```json
{
  "claimId": "claim_56170cb013fb6f88d51c9f9052edf8d5",
  "sourceUnitDigest": "6f21e81bc2f36a0f4491679c7d0580c0b9f002aa939fbd25ff3425c65c9c0bbd",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md",
  "targetAnchor": "layout",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/modals/M03-add-edit-item.md#layout (source lines 22-22) is carried at docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#layout (candidate lines 44-44). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M03-add-edit-item.md verbatim in docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6f21e81bc2f36a0f4491679c7d0580c0b9f002aa939fbd25ff3425c65c9c0bbd",
  "targetAncestry": [
    "M03 — Add or edit a work item"
  ]
}
```

### Full source shown text

````text
## Layout

```
┌────────────────────────────────────────────────────┐
│ New work item                                 [✕]  │  header
│ (edit mode: "Edit · tsk-4id")                      │
├────────────────────────────────────────────────────┤
│ Description                                        │  form
│ ┌────────────────────────────────────────────────┐ │
│ │ What needs doing, in plain language.           │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ (edit mode also shows: title, kind, risk, verify,  │
│  deps, priority — the fields `fgos edit` accepts)  │
│                                                    │
│ Goes through `fgos add` / `fgos edit`.             │
├────────────────────────────────────────────────────┤
│                             [ Cancel ]  [ Create ] │  footer
└────────────────────────────────────────────────────┘
```

**Add mode is deliberately one field.** Intake derives title, kind, risk
and id from the description — asking a person to fill those in would be
asking them to do work the engine already does, and would make capturing
a thought from a phone slow enough that they would not bother.

**Edit mode shows the real fields** `fgos edit` accepts, because editing
is a deliberate correction rather than a capture.

Validation is not reimplemented here: the same rules a terminal edit gets
apply, and the engine's refusal is what the person sees (R2).
````

### Full target shown text

````text
## Layout

```
┌────────────────────────────────────────────────────┐
│ New work item                                 [✕]  │  header
│ (edit mode: "Edit · tsk-4id")                      │
├────────────────────────────────────────────────────┤
│ Description                                        │  form
│ ┌────────────────────────────────────────────────┐ │
│ │ What needs doing, in plain language.           │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ (edit mode also shows: title, kind, risk, verify,  │
│  deps, priority — the fields `fgos edit` accepts)  │
│                                                    │
│ Goes through `fgos add` / `fgos edit`.             │
├────────────────────────────────────────────────────┤
│                             [ Cancel ]  [ Create ] │  footer
└────────────────────────────────────────────────────┘
```

**Add mode is deliberately one field.** Intake derives title, kind, risk
and id from the description — asking a person to fill those in would be
asking them to do work the engine already does, and would make capturing
a thought from a phone slow enough that they would not bother.

**Edit mode shows the real fields** `fgos edit` accepts, because editing
is a deliberate correction rather than a capture.

Validation is not reimplemented here: the same rules a terminal edit gets
apply, and the engine's refusal is what the person sees (R2).
````

## claim_d01d11ce35e918523f65bc915d2da0b9

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M03-add-edit-item.md#unheaded-block-3; lines 24–41; ancestry ["M03 — Add or edit a work item","Layout"].
Target: docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#unheaded-block-5; ancestry ["M03 — Add or edit a work item","Layout"].
Source digest: 15762277ea0230fa83aaef36a20d316da6a17d4f1ea9d3bbf12aae8d900f44de
Target digest: 15762277ea0230fa83aaef36a20d316da6a17d4f1ea9d3bbf12aae8d900f44de
Shown source SHA256: 15762277ea0230fa83aaef36a20d316da6a17d4f1ea9d3bbf12aae8d900f44de
Shown target SHA256: 15762277ea0230fa83aaef36a20d316da6a17d4f1ea9d3bbf12aae8d900f44de

### Complete proposed decision

```json
{
  "claimId": "claim_d01d11ce35e918523f65bc915d2da0b9",
  "sourceUnitDigest": "15762277ea0230fa83aaef36a20d316da6a17d4f1ea9d3bbf12aae8d900f44de",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M03-add-edit-item.md#unheaded-block-3 (source lines 24-41) is carried at docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#unheaded-block-5 (candidate lines 46-63). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M03-add-edit-item.md verbatim in docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "15762277ea0230fa83aaef36a20d316da6a17d4f1ea9d3bbf12aae8d900f44de",
  "targetAncestry": [
    "M03 — Add or edit a work item",
    "Layout"
  ]
}
```

### Full source shown text

````text
```
┌────────────────────────────────────────────────────┐
│ New work item                                 [✕]  │  header
│ (edit mode: "Edit · tsk-4id")                      │
├────────────────────────────────────────────────────┤
│ Description                                        │  form
│ ┌────────────────────────────────────────────────┐ │
│ │ What needs doing, in plain language.           │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ (edit mode also shows: title, kind, risk, verify,  │
│  deps, priority — the fields `fgos edit` accepts)  │
│                                                    │
│ Goes through `fgos add` / `fgos edit`.             │
├────────────────────────────────────────────────────┤
│                             [ Cancel ]  [ Create ] │  footer
└────────────────────────────────────────────────────┘
```
````

### Full target shown text

````text
```
┌────────────────────────────────────────────────────┐
│ New work item                                 [✕]  │  header
│ (edit mode: "Edit · tsk-4id")                      │
├────────────────────────────────────────────────────┤
│ Description                                        │  form
│ ┌────────────────────────────────────────────────┐ │
│ │ What needs doing, in plain language.           │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ (edit mode also shows: title, kind, risk, verify,  │
│  deps, priority — the fields `fgos edit` accepts)  │
│                                                    │
│ Goes through `fgos add` / `fgos edit`.             │
├────────────────────────────────────────────────────┤
│                             [ Cancel ]  [ Create ] │  footer
└────────────────────────────────────────────────────┘
```
````

## claim_4ad34124a2811bb062ec03fd65ac8dc7

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M03-add-edit-item.md#unheaded-block-4; lines 43–46; ancestry ["M03 — Add or edit a work item","Layout"].
Target: docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#unheaded-block-6; ancestry ["M03 — Add or edit a work item","Layout"].
Source digest: 54e00a531b44734aed2fe09a8aa961df3451f98796ae523524be9a1f5e54d3f6
Target digest: 54e00a531b44734aed2fe09a8aa961df3451f98796ae523524be9a1f5e54d3f6
Shown source SHA256: 54e00a531b44734aed2fe09a8aa961df3451f98796ae523524be9a1f5e54d3f6
Shown target SHA256: 54e00a531b44734aed2fe09a8aa961df3451f98796ae523524be9a1f5e54d3f6

### Complete proposed decision

```json
{
  "claimId": "claim_4ad34124a2811bb062ec03fd65ac8dc7",
  "sourceUnitDigest": "54e00a531b44734aed2fe09a8aa961df3451f98796ae523524be9a1f5e54d3f6",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M03-add-edit-item.md#unheaded-block-4 (source lines 43-46) is carried at docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#unheaded-block-6 (candidate lines 65-68). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M03-add-edit-item.md verbatim in docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "54e00a531b44734aed2fe09a8aa961df3451f98796ae523524be9a1f5e54d3f6",
  "targetAncestry": [
    "M03 — Add or edit a work item",
    "Layout"
  ]
}
```

### Full source shown text

```text
**Add mode is deliberately one field.** Intake derives title, kind, risk
and id from the description — asking a person to fill those in would be
asking them to do work the engine already does, and would make capturing
a thought from a phone slow enough that they would not bother.
```

### Full target shown text

```text
**Add mode is deliberately one field.** Intake derives title, kind, risk
and id from the description — asking a person to fill those in would be
asking them to do work the engine already does, and would make capturing
a thought from a phone slow enough that they would not bother.
```

## claim_71d00e3b90a0d091b06f0cbf5dd1d360

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M03-add-edit-item.md#unheaded-block-5; lines 48–49; ancestry ["M03 — Add or edit a work item","Layout"].
Target: docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#unheaded-block-7; ancestry ["M03 — Add or edit a work item","Layout"].
Source digest: d025e2982b7a57e0a540fa8e9ab43023ae631df0c9f1d08e07abfa5fab364ff1
Target digest: d025e2982b7a57e0a540fa8e9ab43023ae631df0c9f1d08e07abfa5fab364ff1
Shown source SHA256: d025e2982b7a57e0a540fa8e9ab43023ae631df0c9f1d08e07abfa5fab364ff1
Shown target SHA256: d025e2982b7a57e0a540fa8e9ab43023ae631df0c9f1d08e07abfa5fab364ff1

### Complete proposed decision

```json
{
  "claimId": "claim_71d00e3b90a0d091b06f0cbf5dd1d360",
  "sourceUnitDigest": "d025e2982b7a57e0a540fa8e9ab43023ae631df0c9f1d08e07abfa5fab364ff1",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M03-add-edit-item.md#unheaded-block-5 (source lines 48-49) is carried at docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#unheaded-block-7 (candidate lines 70-71). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M03-add-edit-item.md verbatim in docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "d025e2982b7a57e0a540fa8e9ab43023ae631df0c9f1d08e07abfa5fab364ff1",
  "targetAncestry": [
    "M03 — Add or edit a work item",
    "Layout"
  ]
}
```

### Full source shown text

```text
**Edit mode shows the real fields** `fgos edit` accepts, because editing
is a deliberate correction rather than a capture.
```

### Full target shown text

```text
**Edit mode shows the real fields** `fgos edit` accepts, because editing
is a deliberate correction rather than a capture.
```

## claim_f25678161e3944edca10dce0bf2c9e83

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M03-add-edit-item.md#unheaded-block-6; lines 51–52; ancestry ["M03 — Add or edit a work item","Layout"].
Target: docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#unheaded-block-8; ancestry ["M03 — Add or edit a work item","Layout"].
Source digest: bfde915b1fb47245c55e1823285df8b92841101c0a8712bcb0ffdee98cf3663c
Target digest: bfde915b1fb47245c55e1823285df8b92841101c0a8712bcb0ffdee98cf3663c
Shown source SHA256: bfde915b1fb47245c55e1823285df8b92841101c0a8712bcb0ffdee98cf3663c
Shown target SHA256: bfde915b1fb47245c55e1823285df8b92841101c0a8712bcb0ffdee98cf3663c

### Complete proposed decision

```json
{
  "claimId": "claim_f25678161e3944edca10dce0bf2c9e83",
  "sourceUnitDigest": "bfde915b1fb47245c55e1823285df8b92841101c0a8712bcb0ffdee98cf3663c",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M03-add-edit-item.md#unheaded-block-6 (source lines 51-52) is carried at docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#unheaded-block-8 (candidate lines 73-74). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M03-add-edit-item.md verbatim in docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "bfde915b1fb47245c55e1823285df8b92841101c0a8712bcb0ffdee98cf3663c",
  "targetAncestry": [
    "M03 — Add or edit a work item",
    "Layout"
  ]
}
```

### Full source shown text

```text
Validation is not reimplemented here: the same rules a terminal edit gets
apply, and the engine's refusal is what the person sees (R2).
```

### Full target shown text

```text
Validation is not reimplemented here: the same rules a terminal edit gets
apply, and the engine's refusal is what the person sees (R2).
```

## claim_a3a9c673695f9ad9ae898eba35875979

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M03-add-edit-item.md#states; lines 54–54; ancestry ["M03 — Add or edit a work item"].
Target: docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#states; ancestry ["M03 — Add or edit a work item"].
Source digest: 238d0b1db923cf498006a239dcb275ea455dd286233baebfa2536ba8c0dae7e9
Target digest: 238d0b1db923cf498006a239dcb275ea455dd286233baebfa2536ba8c0dae7e9
Shown source SHA256: 2b863bb9f2aecd8fdb716332ce73e0fcb76b32b7f0f466481dd1dcad68b67ec7
Shown target SHA256: 2b863bb9f2aecd8fdb716332ce73e0fcb76b32b7f0f466481dd1dcad68b67ec7

### Complete proposed decision

```json
{
  "claimId": "claim_a3a9c673695f9ad9ae898eba35875979",
  "sourceUnitDigest": "238d0b1db923cf498006a239dcb275ea455dd286233baebfa2536ba8c0dae7e9",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md",
  "targetAnchor": "states",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/modals/M03-add-edit-item.md#states (source lines 54-54) is carried at docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#states (candidate lines 76-76). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M03-add-edit-item.md verbatim in docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "238d0b1db923cf498006a239dcb275ea455dd286233baebfa2536ba8c0dae7e9",
  "targetAncestry": [
    "M03 — Add or edit a work item"
  ]
}
```

### Full source shown text

```text
## States

- **ST-READY** — create disabled while the description is empty.
- **ST-SUBMITTING** — button shows progress; fields read-only, still
  visible.
- **ERR-WRITE-REFUSED** — shown verbatim from the engine, with everything
  typed preserved.
```

### Full target shown text

```text
## States

- **ST-READY** — create disabled while the description is empty.
- **ST-SUBMITTING** — button shows progress; fields read-only, still
  visible.
- **ERR-WRITE-REFUSED** — shown verbatim from the engine, with everything
  typed preserved.
```

## claim_f2aac5602a04a55ae1af5277932bafa2

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M03-add-edit-item.md#unheaded-block-7; lines 56–60; ancestry ["M03 — Add or edit a work item","States"].
Target: docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#unheaded-block-9; ancestry ["M03 — Add or edit a work item","States"].
Source digest: ca36dd365ddfcc167033301303bc1d374cbaf26b13c05156626e8290f13ff5fc
Target digest: ca36dd365ddfcc167033301303bc1d374cbaf26b13c05156626e8290f13ff5fc
Shown source SHA256: ca36dd365ddfcc167033301303bc1d374cbaf26b13c05156626e8290f13ff5fc
Shown target SHA256: ca36dd365ddfcc167033301303bc1d374cbaf26b13c05156626e8290f13ff5fc

### Complete proposed decision

```json
{
  "claimId": "claim_f2aac5602a04a55ae1af5277932bafa2",
  "sourceUnitDigest": "ca36dd365ddfcc167033301303bc1d374cbaf26b13c05156626e8290f13ff5fc",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M03-add-edit-item.md#unheaded-block-7 (source lines 56-60) is carried at docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#unheaded-block-9 (candidate lines 78-82). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M03-add-edit-item.md verbatim in docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ca36dd365ddfcc167033301303bc1d374cbaf26b13c05156626e8290f13ff5fc",
  "targetAncestry": [
    "M03 — Add or edit a work item",
    "States"
  ]
}
```

### Full source shown text

```text
- **ST-READY** — create disabled while the description is empty.
- **ST-SUBMITTING** — button shows progress; fields read-only, still
  visible.
- **ERR-WRITE-REFUSED** — shown verbatim from the engine, with everything
  typed preserved.
```

### Full target shown text

```text
- **ST-READY** — create disabled while the description is empty.
- **ST-SUBMITTING** — button shows progress; fields read-only, still
  visible.
- **ERR-WRITE-REFUSED** — shown verbatim from the engine, with everything
  typed preserved.
```

## claim_68a4f9c55c4dd71e01dd0a511d3894c1

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M03-add-edit-item.md#interactions; lines 62–62; ancestry ["M03 — Add or edit a work item"].
Target: docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#interactions; ancestry ["M03 — Add or edit a work item"].
Source digest: d49d33e9d7ce24ccc04ef064bf8da74c35144b715738215b4edef6aa32ae46fe
Target digest: d49d33e9d7ce24ccc04ef064bf8da74c35144b715738215b4edef6aa32ae46fe
Shown source SHA256: 628b906555691d8f6270b541674b9583df6e2a6b728fbb5f2a1d4a0960c2ad4f
Shown target SHA256: 628b906555691d8f6270b541674b9583df6e2a6b728fbb5f2a1d4a0960c2ad4f

### Complete proposed decision

```json
{
  "claimId": "claim_68a4f9c55c4dd71e01dd0a511d3894c1",
  "sourceUnitDigest": "d49d33e9d7ce24ccc04ef064bf8da74c35144b715738215b4edef6aa32ae46fe",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md",
  "targetAnchor": "interactions",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/modals/M03-add-edit-item.md#interactions (source lines 62-62) is carried at docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#interactions (candidate lines 84-84). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M03-add-edit-item.md verbatim in docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "d49d33e9d7ce24ccc04ef064bf8da74c35144b715738215b4edef6aa32ae46fe",
  "targetAncestry": [
    "M03 — Add or edit a work item"
  ]
}
```

### Full source shown text

````text
## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-M03-001
    element: description_field
    region: form
    trigger: input
    action: mutate
    effects: [enable_submit_when_non_empty]
  - id: A-M03-002
    element: submit_button
    region: footer
    trigger: submit
    guard: "description.nonEmpty"
    action: close_overlay
    target: return_to_invoker
    effects: [run_fgos_add_or_edit_verb]
  - id: A-M03-003
    element: cancel_button
    region: footer
    trigger: click
    action: close_overlay
    target: return_to_invoker
  - id: A-M03-004
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
  - id: A-M03-001
    element: description_field
    region: form
    trigger: input
    action: mutate
    effects: [enable_submit_when_non_empty]
  - id: A-M03-002
    element: submit_button
    region: footer
    trigger: submit
    guard: "description.nonEmpty"
    action: close_overlay
    target: return_to_invoker
    effects: [run_fgos_add_or_edit_verb]
  - id: A-M03-003
    element: cancel_button
    region: footer
    trigger: click
    action: close_overlay
    target: return_to_invoker
  - id: A-M03-004
    element: close_icon
    region: header
    trigger: click
    action: close_overlay
    target: return_to_invoker
```
````

## claim_3d2697461e6860c1c7b7ad98e1bb2f75

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/modals/M03-add-edit-item.md#unheaded-block-8; lines 64–92; ancestry ["M03 — Add or edit a work item","Interactions"].
Target: docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#unheaded-block-10; ancestry ["M03 — Add or edit a work item","Interactions"].
Source digest: 19182a48049bb62a94fdee2e76c7bcdd872da2397e0f65207b3f586a6ffb250b
Target digest: 19182a48049bb62a94fdee2e76c7bcdd872da2397e0f65207b3f586a6ffb250b
Shown source SHA256: 19182a48049bb62a94fdee2e76c7bcdd872da2397e0f65207b3f586a6ffb250b
Shown target SHA256: 19182a48049bb62a94fdee2e76c7bcdd872da2397e0f65207b3f586a6ffb250b

### Complete proposed decision

```json
{
  "claimId": "claim_3d2697461e6860c1c7b7ad98e1bb2f75",
  "sourceUnitDigest": "19182a48049bb62a94fdee2e76c7bcdd872da2397e0f65207b3f586a6ffb250b",
  "targetOwner": "docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md",
  "targetAnchor": "unheaded-block-10",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/modals/M03-add-edit-item.md#unheaded-block-8 (source lines 64-92) is carried at docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md#unheaded-block-10 (candidate lines 86-114). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/modals/M03-add-edit-item.md verbatim in docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "19182a48049bb62a94fdee2e76c7bcdd872da2397e0f65207b3f586a6ffb250b",
  "targetAncestry": [
    "M03 — Add or edit a work item",
    "Interactions"
  ]
}
```

### Full source shown text

````text
```yaml herdrweb-contract
interactions:
  - id: A-M03-001
    element: description_field
    region: form
    trigger: input
    action: mutate
    effects: [enable_submit_when_non_empty]
  - id: A-M03-002
    element: submit_button
    region: footer
    trigger: submit
    guard: "description.nonEmpty"
    action: close_overlay
    target: return_to_invoker
    effects: [run_fgos_add_or_edit_verb]
  - id: A-M03-003
    element: cancel_button
    region: footer
    trigger: click
    action: close_overlay
    target: return_to_invoker
  - id: A-M03-004
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
  - id: A-M03-001
    element: description_field
    region: form
    trigger: input
    action: mutate
    effects: [enable_submit_when_non_empty]
  - id: A-M03-002
    element: submit_button
    region: footer
    trigger: submit
    guard: "description.nonEmpty"
    action: close_overlay
    target: return_to_invoker
    effects: [run_fgos_add_or_edit_verb]
  - id: A-M03-003
    element: cancel_button
    region: footer
    trigger: click
    action: close_overlay
    target: return_to_invoker
  - id: A-M03-004
    element: close_icon
    region: header
    trigger: click
    action: close_overlay
    target: return_to_invoker
```
````
