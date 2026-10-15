# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-decision-citation-drift-01.json
Shard SHA256: 9ba87334f0b01126e1b68c868bd10a69e83435c18b675f572086f8c5ccea0577
Source: docs/specs/decision-citation-drift.md
Part 1/1; entries: **20**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 10/10 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_e20f7ff7ebbd47f4699edd6198797231",
      "claim_799091fae7d0b1a35a7053b22b43d065",
      "claim_3556818f023663dfcad72a90b7782e02",
      "claim_7e425277fb658644e211d3a6ba18f5c5",
      "claim_98824ede2fb41b178a6a92aed5591b28",
      "claim_5176afd2c7a6b5cf980c6ea133419f9e",
      "claim_e26e9f5cc87f216bf7a4144f6a2fd62a",
      "claim_2cba8bb652aeb76ce0ab3c0317c39a6b",
      "claim_231e775c29956a4a2a776810cc12a935",
      "claim_4966e71788ccddf622cb3c79fa20b4ec"
    ],
    "Weak-exact": [
      "claim_4302bf09de5db8e70b5486c8bf75207b",
      "claim_aef792d407cb3aa4c3eba1a859948b92",
      "claim_293d81b12e6ce78ccc407ec7ac03faff",
      "claim_8ab66349995ddbb61028b6220f2e1efa",
      "claim_69cda08aab2b0c3dadce7df3298cbe89",
      "claim_8b1b71aab191aac54f12d37fccebc856",
      "claim_1564e054266b55377f35a78418057318",
      "claim_10e84e63af173981738360d779c8039b",
      "claim_fefb1bf47fc375b9e83089dc6059326c"
    ],
    "Judgment": [
      "claim_f8a80ce657505415a0cf4bdcbb8b1a82"
    ]
  },
  "unequalDigestPairs": [
    "claim_f8a80ce657505415a0cf4bdcbb8b1a82"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_f8a80ce657505415a0cf4bdcbb8b1a82"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_e20f7ff7ebbd47f4699edd6198797231

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#unheaded-block-1; lines 1–7; ancestry [].
Target: docs/platform/decision-citation-drift/spec.md#unheaded-block-1; ancestry [].
Source digest: 3893aff63d9705062d55c666da7760e16657cf2d144d1f702329a14948f64630
Target digest: 3893aff63d9705062d55c666da7760e16657cf2d144d1f702329a14948f64630
Shown source SHA256: 3893aff63d9705062d55c666da7760e16657cf2d144d1f702329a14948f64630
Shown target SHA256: 3893aff63d9705062d55c666da7760e16657cf2d144d1f702329a14948f64630

### Complete proposed decision

```json
{
  "claimId": "claim_e20f7ff7ebbd47f4699edd6198797231",
  "sourceUnitDigest": "3893aff63d9705062d55c666da7760e16657cf2d144d1f702329a14948f64630",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/specs/decision-citation-drift.md#unheaded-block-1 (source lines 1-7) is carried at docs/platform/decision-citation-drift/spec.md#unheaded-block-1 (candidate lines 1-7). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3893aff63d9705062d55c666da7760e16657cf2d144d1f702329a14948f64630",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
area: decision-citation-drift
updated: 2026-07-27
sources: [str72-supersede-drift-check]
decisions: [28f8d8f8]
coverage: partial
---
```

### Full target shown text

```text
---
area: decision-citation-drift
updated: 2026-07-27
sources: [str72-supersede-drift-check]
decisions: [28f8d8f8]
coverage: partial
---
```

## claim_f8a80ce657505415a0cf4bdcbb8b1a82

Class: Judgment; mandatory deep: true.
Source: docs/specs/decision-citation-drift.md#spec-decision-citation-drift-check; lines 9–9; ancestry [].
Target: docs/platform/decision-citation-drift/spec.md#spec-decision-citation-drift-check; ancestry [].
Source digest: e8b9eb660b5d8258804095e0c6b41a1fee95ab12030b93890f7deaba3ec9bf12
Target digest: 220c53cff76e8336290a335d8577e7bae5cc8394d137253ed17eb5956477d5ae
Shown source SHA256: 02b8d47d8d14c4e0c320f5f80227ba0c2876e05eb10c85368d76e6586e4ed274
Shown target SHA256: aa0ea3676a547a571abea5dd037c1d612cf3a6e5e59e882874b7bfc36138e3fa

### Complete proposed decision

```json
{
  "claimId": "claim_f8a80ce657505415a0cf4bdcbb8b1a82",
  "sourceUnitDigest": "e8b9eb660b5d8258804095e0c6b41a1fee95ab12030b93890f7deaba3ec9bf12",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "spec-decision-citation-drift-check",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/specs/decision-citation-drift.md#spec-decision-citation-drift-check (source lines 9-9) is carried at docs/platform/decision-citation-drift/spec.md#spec-decision-citation-drift-check (candidate lines 9-9). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "220c53cff76e8336290a335d8577e7bae5cc8394d137253ed17eb5956477d5ae",
  "targetAncestry": []
}
```

### Full source shown text

```text
# Spec: Decision Citation Drift Check

A read-only detection check that scans the product backlog and area specs for
lines that still cite a decision by its old id after that decision has been
superseded, without also naming the decision that replaced it. Its purpose is
to catch "dead framing" — a backlog row or spec line whose reasoning was
overturned, but whose wording still reads as if the old decision were current,
so a reader (human or agent) re-derives the outdated conclusion. Used by
whoever maintains `docs/backlog.md` and `docs/specs/*.md` (a human operator or
an agent doing grooming/scribing).
```

### Full target shown text

````text
# Spec: Decision Citation Drift Check

```txt
Document type: Specification
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/specs/decision-citation-drift.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/specs/decision-citation-drift.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.


A read-only detection check that scans the product backlog and area specs for
lines that still cite a decision by its old id after that decision has been
superseded, without also naming the decision that replaced it. Its purpose is
to catch "dead framing" — a backlog row or spec line whose reasoning was
overturned, but whose wording still reads as if the old decision were current,
so a reader (human or agent) re-derives the outdated conclusion. Used by
whoever maintains `docs/backlog.md` and `docs/specs/*.md` (a human operator or
an agent doing grooming/scribing).
````

## claim_799091fae7d0b1a35a7053b22b43d065

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#unheaded-block-2; lines 11–18; ancestry ["Spec: Decision Citation Drift Check"].
Target: docs/platform/decision-citation-drift/spec.md#unheaded-block-4; ancestry ["Spec: Decision Citation Drift Check"].
Source digest: 408313efba87b25d55682f602abb76cc4728e6be0c0866bb434e7c027c0ce19e
Target digest: 408313efba87b25d55682f602abb76cc4728e6be0c0866bb434e7c027c0ce19e
Shown source SHA256: 408313efba87b25d55682f602abb76cc4728e6be0c0866bb434e7c027c0ce19e
Shown target SHA256: 408313efba87b25d55682f602abb76cc4728e6be0c0866bb434e7c027c0ce19e

### Complete proposed decision

```json
{
  "claimId": "claim_799091fae7d0b1a35a7053b22b43d065",
  "sourceUnitDigest": "408313efba87b25d55682f602abb76cc4728e6be0c0866bb434e7c027c0ce19e",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/decision-citation-drift.md#unheaded-block-2 (source lines 11-18) is carried at docs/platform/decision-citation-drift/spec.md#unheaded-block-4 (candidate lines 33-40). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "408313efba87b25d55682f602abb76cc4728e6be0c0866bb434e7c027c0ce19e",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check"
  ]
}
```

### Full source shown text

```text
A read-only detection check that scans the product backlog and area specs for
lines that still cite a decision by its old id after that decision has been
superseded, without also naming the decision that replaced it. Its purpose is
to catch "dead framing" — a backlog row or spec line whose reasoning was
overturned, but whose wording still reads as if the old decision were current,
so a reader (human or agent) re-derives the outdated conclusion. Used by
whoever maintains `docs/backlog.md` and `docs/specs/*.md` (a human operator or
an agent doing grooming/scribing).
```

### Full target shown text

```text
A read-only detection check that scans the product backlog and area specs for
lines that still cite a decision by its old id after that decision has been
superseded, without also naming the decision that replaced it. Its purpose is
to catch "dead framing" — a backlog row or spec line whose reasoning was
overturned, but whose wording still reads as if the old decision were current,
so a reader (human or agent) re-derives the outdated conclusion. Used by
whoever maintains `docs/backlog.md` and `docs/specs/*.md` (a human operator or
an agent doing grooming/scribing).
```

## claim_4302bf09de5db8e70b5486c8bf75207b

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#entry-points-triggers; lines 20–20; ancestry ["Spec: Decision Citation Drift Check"].
Target: docs/platform/decision-citation-drift/spec.md#entry-points-triggers; ancestry ["Spec: Decision Citation Drift Check"].
Source digest: c9fa0bb4f0fef1f62d90ca25359f7fc35f704628fe89c456c5f8517f8f84c2f0
Target digest: c9fa0bb4f0fef1f62d90ca25359f7fc35f704628fe89c456c5f8517f8f84c2f0
Shown source SHA256: a236cea94a955b05a14df38158cc48bcff74dc267897ee9325c1ceaab6df20f4
Shown target SHA256: a236cea94a955b05a14df38158cc48bcff74dc267897ee9325c1ceaab6df20f4

### Complete proposed decision

```json
{
  "claimId": "claim_4302bf09de5db8e70b5486c8bf75207b",
  "sourceUnitDigest": "c9fa0bb4f0fef1f62d90ca25359f7fc35f704628fe89c456c5f8517f8f84c2f0",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "entry-points-triggers",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/decision-citation-drift.md#entry-points-triggers (source lines 20-20) is carried at docs/platform/decision-citation-drift/spec.md#entry-points-triggers (candidate lines 42-42). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c9fa0bb4f0fef1f62d90ca25359f7fc35f704628fe89c456c5f8517f8f84c2f0",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check"
  ]
}
```

### Full source shown text

```text
## Entry Points & Triggers

- `node scripts/check-decision-citation-drift.mjs` (from the product repo
  root) — the only way to run the check today. Manual invocation only; there
  is no scheduled or CI trigger yet (see Open Gaps).
- Optional flags override the default locations: `--decisions-dir <path>`
  (default `docs/decisions`), `--backlog <path>` (default `docs/backlog.md`),
  `--specs-dir <path>` (default `docs/specs`).
```

### Full target shown text

```text
## Entry Points & Triggers

- `node scripts/check-decision-citation-drift.mjs` (from the product repo
  root) — the only way to run the check today. Manual invocation only; there
  is no scheduled or CI trigger yet (see Open Gaps).
- Optional flags override the default locations: `--decisions-dir <path>`
  (default `docs/decisions`), `--backlog <path>` (default `docs/backlog.md`),
  `--specs-dir <path>` (default `docs/specs`).
```

## claim_3556818f023663dfcad72a90b7782e02

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#unheaded-block-3; lines 22–27; ancestry ["Spec: Decision Citation Drift Check","Entry Points & Triggers"].
Target: docs/platform/decision-citation-drift/spec.md#unheaded-block-5; ancestry ["Spec: Decision Citation Drift Check","Entry Points & Triggers"].
Source digest: 8914cbc1229686fc16ddda1dbde86708ac60615b0b313050b59e740ef45f8e9c
Target digest: 8914cbc1229686fc16ddda1dbde86708ac60615b0b313050b59e740ef45f8e9c
Shown source SHA256: 8914cbc1229686fc16ddda1dbde86708ac60615b0b313050b59e740ef45f8e9c
Shown target SHA256: 8914cbc1229686fc16ddda1dbde86708ac60615b0b313050b59e740ef45f8e9c

### Complete proposed decision

```json
{
  "claimId": "claim_3556818f023663dfcad72a90b7782e02",
  "sourceUnitDigest": "8914cbc1229686fc16ddda1dbde86708ac60615b0b313050b59e740ef45f8e9c",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/decision-citation-drift.md#unheaded-block-3 (source lines 22-27) is carried at docs/platform/decision-citation-drift/spec.md#unheaded-block-5 (candidate lines 44-49). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "8914cbc1229686fc16ddda1dbde86708ac60615b0b313050b59e740ef45f8e9c",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check",
    "Entry Points & Triggers"
  ]
}
```

### Full source shown text

```text
- `node scripts/check-decision-citation-drift.mjs` (from the product repo
  root) — the only way to run the check today. Manual invocation only; there
  is no scheduled or CI trigger yet (see Open Gaps).
- Optional flags override the default locations: `--decisions-dir <path>`
  (default `docs/decisions`), `--backlog <path>` (default `docs/backlog.md`),
  `--specs-dir <path>` (default `docs/specs`).
```

### Full target shown text

```text
- `node scripts/check-decision-citation-drift.mjs` (from the product repo
  root) — the only way to run the check today. Manual invocation only; there
  is no scheduled or CI trigger yet (see Open Gaps).
- Optional flags override the default locations: `--decisions-dir <path>`
  (default `docs/decisions`), `--backlog <path>` (default `docs/backlog.md`),
  `--specs-dir <path>` (default `docs/specs`).
```

## claim_aef792d407cb3aa4c3eba1a859948b92

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#data-dictionary; lines 29–29; ancestry ["Spec: Decision Citation Drift Check"].
Target: docs/platform/decision-citation-drift/spec.md#data-dictionary; ancestry ["Spec: Decision Citation Drift Check"].
Source digest: f327b12e6765878263e7c6ff7a5d9c1cf5171fa017c71b3a0e24b2e59044eea7
Target digest: f327b12e6765878263e7c6ff7a5d9c1cf5171fa017c71b3a0e24b2e59044eea7
Shown source SHA256: df2c0cdc31ad912817f0d1518588a6375850bde266d5875986560940ce8795f6
Shown target SHA256: df2c0cdc31ad912817f0d1518588a6375850bde266d5875986560940ce8795f6

### Complete proposed decision

```json
{
  "claimId": "claim_aef792d407cb3aa4c3eba1a859948b92",
  "sourceUnitDigest": "f327b12e6765878263e7c6ff7a5d9c1cf5171fa017c71b3a0e24b2e59044eea7",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "data-dictionary",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/decision-citation-drift.md#data-dictionary (source lines 29-29) is carried at docs/platform/decision-citation-drift/spec.md#data-dictionary (candidate lines 51-51). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f327b12e6765878263e7c6ff7a5d9c1cf5171fa017c71b3a0e24b2e59044eea7",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check"
  ]
}
```

### Full source shown text

```text
## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|---------|---------|--------|----------|---------|
| 1 | Decision id | The 4-digit id of a decision record under the decisions directory | 4 digits, e.g. `0002` | yes | — |
| 2 | Superseded-by id | The id of the decision that replaced a given decision, read from that decision's own front matter | 4 digits | no (absent when a decision was never superseded) | — |
| 3 | Cited id (in a scanned line) | A decision id referenced in a backlog row or spec line | written either as `ADR<4-digit>` or as a bare 4-digit number that matches a known decision id | — | — |
| 4 | Finding | One flagged line | `{kind: "dead-framing", file, line, id, supersededBy, message}` | — | — |
| 5 | Scan scope | Which files are scanned | the backlog file + every file in the specs directory | — | fixed: `docs/backlog.md` + `docs/specs/*.md` |
```

### Full target shown text

```text
## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|---------|---------|--------|----------|---------|
| 1 | Decision id | The 4-digit id of a decision record under the decisions directory | 4 digits, e.g. `0002` | yes | — |
| 2 | Superseded-by id | The id of the decision that replaced a given decision, read from that decision's own front matter | 4 digits | no (absent when a decision was never superseded) | — |
| 3 | Cited id (in a scanned line) | A decision id referenced in a backlog row or spec line | written either as `ADR<4-digit>` or as a bare 4-digit number that matches a known decision id | — | — |
| 4 | Finding | One flagged line | `{kind: "dead-framing", file, line, id, supersededBy, message}` | — | — |
| 5 | Scan scope | Which files are scanned | the backlog file + every file in the specs directory | — | fixed: `docs/backlog.md` + `docs/specs/*.md` |
```

## claim_7e425277fb658644e211d3a6ba18f5c5

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#unheaded-block-4; lines 31–37; ancestry ["Spec: Decision Citation Drift Check","Data Dictionary"].
Target: docs/platform/decision-citation-drift/spec.md#unheaded-block-6; ancestry ["Spec: Decision Citation Drift Check","Data Dictionary"].
Source digest: ddc10a212e811df7dfee1b3c902aa0417b08473aad551911cc5e52a0a2dc2ff8
Target digest: ddc10a212e811df7dfee1b3c902aa0417b08473aad551911cc5e52a0a2dc2ff8
Shown source SHA256: ddc10a212e811df7dfee1b3c902aa0417b08473aad551911cc5e52a0a2dc2ff8
Shown target SHA256: ddc10a212e811df7dfee1b3c902aa0417b08473aad551911cc5e52a0a2dc2ff8

### Complete proposed decision

```json
{
  "claimId": "claim_7e425277fb658644e211d3a6ba18f5c5",
  "sourceUnitDigest": "ddc10a212e811df7dfee1b3c902aa0417b08473aad551911cc5e52a0a2dc2ff8",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/decision-citation-drift.md#unheaded-block-4 (source lines 31-37) is carried at docs/platform/decision-citation-drift/spec.md#unheaded-block-6 (candidate lines 53-59). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ddc10a212e811df7dfee1b3c902aa0417b08473aad551911cc5e52a0a2dc2ff8",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check",
    "Data Dictionary"
  ]
}
```

### Full source shown text

```text
| # | Element | Meaning | Values | Required | Default |
|---|---------|---------|--------|----------|---------|
| 1 | Decision id | The 4-digit id of a decision record under the decisions directory | 4 digits, e.g. `0002` | yes | — |
| 2 | Superseded-by id | The id of the decision that replaced a given decision, read from that decision's own front matter | 4 digits | no (absent when a decision was never superseded) | — |
| 3 | Cited id (in a scanned line) | A decision id referenced in a backlog row or spec line | written either as `ADR<4-digit>` or as a bare 4-digit number that matches a known decision id | — | — |
| 4 | Finding | One flagged line | `{kind: "dead-framing", file, line, id, supersededBy, message}` | — | — |
| 5 | Scan scope | Which files are scanned | the backlog file + every file in the specs directory | — | fixed: `docs/backlog.md` + `docs/specs/*.md` |
```

### Full target shown text

```text
| # | Element | Meaning | Values | Required | Default |
|---|---------|---------|--------|----------|---------|
| 1 | Decision id | The 4-digit id of a decision record under the decisions directory | 4 digits, e.g. `0002` | yes | — |
| 2 | Superseded-by id | The id of the decision that replaced a given decision, read from that decision's own front matter | 4 digits | no (absent when a decision was never superseded) | — |
| 3 | Cited id (in a scanned line) | A decision id referenced in a backlog row or spec line | written either as `ADR<4-digit>` or as a bare 4-digit number that matches a known decision id | — | — |
| 4 | Finding | One flagged line | `{kind: "dead-framing", file, line, id, supersededBy, message}` | — | — |
| 5 | Scan scope | Which files are scanned | the backlog file + every file in the specs directory | — | fixed: `docs/backlog.md` + `docs/specs/*.md` |
```

## claim_293d81b12e6ce78ccc407ec7ac03faff

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#behaviors-operations; lines 39–39; ancestry ["Spec: Decision Citation Drift Check"].
Target: docs/platform/decision-citation-drift/spec.md#behaviors-operations; ancestry ["Spec: Decision Citation Drift Check"].
Source digest: 39a803b85af853156a7029460b132103eac8017b2b1b7eb0b82d181f699b86f3
Target digest: 39a803b85af853156a7029460b132103eac8017b2b1b7eb0b82d181f699b86f3
Shown source SHA256: 50b4fcaf705faf1ee934799e872bdd14db861c09b614510e47d8889f49dcbd45
Shown target SHA256: 50b4fcaf705faf1ee934799e872bdd14db861c09b614510e47d8889f49dcbd45

### Complete proposed decision

```json
{
  "claimId": "claim_293d81b12e6ce78ccc407ec7ac03faff",
  "sourceUnitDigest": "39a803b85af853156a7029460b132103eac8017b2b1b7eb0b82d181f699b86f3",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "behaviors-operations",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/decision-citation-drift.md#behaviors-operations (source lines 39-39) is carried at docs/platform/decision-citation-drift/spec.md#behaviors-operations (candidate lines 61-61). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "39a803b85af853156a7029460b132103eac8017b2b1b7eb0b82d181f699b86f3",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check"
  ]
}
```

### Full source shown text

```text
## Behaviors & Operations
```

### Full target shown text

```text
## Behaviors & Operations
```

## claim_8ab66349995ddbb61028b6220f2e1efa

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#run-citation-drift-scan; lines 41–41; ancestry ["Spec: Decision Citation Drift Check","Behaviors & Operations"].
Target: docs/platform/decision-citation-drift/spec.md#run-citation-drift-scan; ancestry ["Spec: Decision Citation Drift Check","Behaviors & Operations"].
Source digest: eaa622ae3f4ba7bcc253b063673b258f543583b8132c6458b4beaf2e4e2c25f5
Target digest: eaa622ae3f4ba7bcc253b063673b258f543583b8132c6458b4beaf2e4e2c25f5
Shown source SHA256: 2f0ff926907a0fb8cda552cba34a29341a64f3039989a77f9e4d2bccdcc574dc
Shown target SHA256: 2f0ff926907a0fb8cda552cba34a29341a64f3039989a77f9e4d2bccdcc574dc

### Complete proposed decision

```json
{
  "claimId": "claim_8ab66349995ddbb61028b6220f2e1efa",
  "sourceUnitDigest": "eaa622ae3f4ba7bcc253b063673b258f543583b8132c6458b4beaf2e4e2c25f5",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "run-citation-drift-scan",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/decision-citation-drift.md#run-citation-drift-scan (source lines 41-41) is carried at docs/platform/decision-citation-drift/spec.md#run-citation-drift-scan (candidate lines 63-63). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "eaa622ae3f4ba7bcc253b063673b258f543583b8132c6458b4beaf2e4e2c25f5",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check",
    "Behaviors & Operations"
  ]
}
```

### Full source shown text

```text
### Run citation-drift scan

- **Runs when:** an operator or agent invokes the check manually.
- **What changes:** nothing — the check only reads files, never writes.
- **Side effects:** none. Findings are printed to the console; nothing is
  persisted.
- **Afterwards:** the operator sees either "no findings" (and the process
  exits 0), or a numbered list of dead-framing findings, each naming the
  file, line number, the stale cited id, and the id that superseded it (and
  the process exits 1). No line is edited automatically — a human or agent
  must add the superseding id to the flagged line by hand.
```

### Full target shown text

```text
### Run citation-drift scan

- **Runs when:** an operator or agent invokes the check manually.
- **What changes:** nothing — the check only reads files, never writes.
- **Side effects:** none. Findings are printed to the console; nothing is
  persisted.
- **Afterwards:** the operator sees either "no findings" (and the process
  exits 0), or a numbered list of dead-framing findings, each naming the
  file, line number, the stale cited id, and the id that superseded it (and
  the process exits 1). No line is edited automatically — a human or agent
  must add the superseding id to the flagged line by hand.
```

## claim_98824ede2fb41b178a6a92aed5591b28

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#unheaded-block-5; lines 43–51; ancestry ["Spec: Decision Citation Drift Check","Behaviors & Operations","Run citation-drift scan"].
Target: docs/platform/decision-citation-drift/spec.md#unheaded-block-7; ancestry ["Spec: Decision Citation Drift Check","Behaviors & Operations","Run citation-drift scan"].
Source digest: 587dc1ed801795c039c0cf635242d774809fdd15591993e049f779d4cd523121
Target digest: 587dc1ed801795c039c0cf635242d774809fdd15591993e049f779d4cd523121
Shown source SHA256: 587dc1ed801795c039c0cf635242d774809fdd15591993e049f779d4cd523121
Shown target SHA256: 587dc1ed801795c039c0cf635242d774809fdd15591993e049f779d4cd523121

### Complete proposed decision

```json
{
  "claimId": "claim_98824ede2fb41b178a6a92aed5591b28",
  "sourceUnitDigest": "587dc1ed801795c039c0cf635242d774809fdd15591993e049f779d4cd523121",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/decision-citation-drift.md#unheaded-block-5 (source lines 43-51) is carried at docs/platform/decision-citation-drift/spec.md#unheaded-block-7 (candidate lines 65-73). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "587dc1ed801795c039c0cf635242d774809fdd15591993e049f779d4cd523121",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check",
    "Behaviors & Operations",
    "Run citation-drift scan"
  ]
}
```

### Full source shown text

```text
- **Runs when:** an operator or agent invokes the check manually.
- **What changes:** nothing — the check only reads files, never writes.
- **Side effects:** none. Findings are printed to the console; nothing is
  persisted.
- **Afterwards:** the operator sees either "no findings" (and the process
  exits 0), or a numbered list of dead-framing findings, each naming the
  file, line number, the stale cited id, and the id that superseded it (and
  the process exits 1). No line is edited automatically — a human or agent
  must add the superseding id to the flagged line by hand.
```

### Full target shown text

```text
- **Runs when:** an operator or agent invokes the check manually.
- **What changes:** nothing — the check only reads files, never writes.
- **Side effects:** none. Findings are printed to the console; nothing is
  persisted.
- **Afterwards:** the operator sees either "no findings" (and the process
  exits 0), or a numbered list of dead-framing findings, each naming the
  file, line number, the stale cited id, and the id that superseded it (and
  the process exits 1). No line is edited automatically — a human or agent
  must add the superseding id to the flagged line by hand.
```

## claim_69cda08aab2b0c3dadce7df3298cbe89

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#actors-access; lines 53–53; ancestry ["Spec: Decision Citation Drift Check"].
Target: docs/platform/decision-citation-drift/spec.md#actors-access; ancestry ["Spec: Decision Citation Drift Check"].
Source digest: 7759adf4c9dcd9a1639bf350678d4d485ee698e66811a75de699bbcfe31bd396
Target digest: 7759adf4c9dcd9a1639bf350678d4d485ee698e66811a75de699bbcfe31bd396
Shown source SHA256: 2364ae7b1ab6cf308a9eafe785d16b1522c6c02860e6e5af695fea24e960955f
Shown target SHA256: 2364ae7b1ab6cf308a9eafe785d16b1522c6c02860e6e5af695fea24e960955f

### Complete proposed decision

```json
{
  "claimId": "claim_69cda08aab2b0c3dadce7df3298cbe89",
  "sourceUnitDigest": "7759adf4c9dcd9a1639bf350678d4d485ee698e66811a75de699bbcfe31bd396",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "actors-access",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/decision-citation-drift.md#actors-access (source lines 53-53) is carried at docs/platform/decision-citation-drift/spec.md#actors-access (candidate lines 75-75). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7759adf4c9dcd9a1639bf350678d4d485ee698e66811a75de699bbcfe31bd396",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check"
  ]
}
```

### Full source shown text

```text
## Actors & Access

| Capability | Operator (manual run) | CI |
|---|---|---|
| Run the scan | yes | not wired yet (Open Gap) |
| See findings | yes (console output) | — |
| Auto-fix a finding | never — detection only | — |
```

### Full target shown text

```text
## Actors & Access

| Capability | Operator (manual run) | CI |
|---|---|---|
| Run the scan | yes | not wired yet (Open Gap) |
| See findings | yes (console output) | — |
| Auto-fix a finding | never — detection only | — |
```

## claim_5176afd2c7a6b5cf980c6ea133419f9e

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#unheaded-block-6; lines 55–59; ancestry ["Spec: Decision Citation Drift Check","Actors & Access"].
Target: docs/platform/decision-citation-drift/spec.md#unheaded-block-8; ancestry ["Spec: Decision Citation Drift Check","Actors & Access"].
Source digest: fa66523b9149930dae2c9cbeb4d5dbfb5559e8ec842310f86505af1c0ae0ea54
Target digest: fa66523b9149930dae2c9cbeb4d5dbfb5559e8ec842310f86505af1c0ae0ea54
Shown source SHA256: fa66523b9149930dae2c9cbeb4d5dbfb5559e8ec842310f86505af1c0ae0ea54
Shown target SHA256: fa66523b9149930dae2c9cbeb4d5dbfb5559e8ec842310f86505af1c0ae0ea54

### Complete proposed decision

```json
{
  "claimId": "claim_5176afd2c7a6b5cf980c6ea133419f9e",
  "sourceUnitDigest": "fa66523b9149930dae2c9cbeb4d5dbfb5559e8ec842310f86505af1c0ae0ea54",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/decision-citation-drift.md#unheaded-block-6 (source lines 55-59) is carried at docs/platform/decision-citation-drift/spec.md#unheaded-block-8 (candidate lines 77-81). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "fa66523b9149930dae2c9cbeb4d5dbfb5559e8ec842310f86505af1c0ae0ea54",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check",
    "Actors & Access"
  ]
}
```

### Full source shown text

```text
| Capability | Operator (manual run) | CI |
|---|---|---|
| Run the scan | yes | not wired yet (Open Gap) |
| See findings | yes (console output) | — |
| Auto-fix a finding | never — detection only | — |
```

### Full target shown text

```text
| Capability | Operator (manual run) | CI |
|---|---|---|
| Run the scan | yes | not wired yet (Open Gap) |
| See findings | yes (console output) | — |
| Auto-fix a finding | never — detection only | — |
```

## claim_8b1b71aab191aac54f12d37fccebc856

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#business-rules; lines 61–61; ancestry ["Spec: Decision Citation Drift Check"].
Target: docs/platform/decision-citation-drift/spec.md#business-rules; ancestry ["Spec: Decision Citation Drift Check"].
Source digest: bd420c8f19c3d9aea688e4987228171062ce0af9bd385d9d85fd25e424f81c63
Target digest: bd420c8f19c3d9aea688e4987228171062ce0af9bd385d9d85fd25e424f81c63
Shown source SHA256: 200e47296e99d69f65775bbb2bf644e981e19d4b11aada93091a0a806371a5d6
Shown target SHA256: 200e47296e99d69f65775bbb2bf644e981e19d4b11aada93091a0a806371a5d6

### Complete proposed decision

```json
{
  "claimId": "claim_8b1b71aab191aac54f12d37fccebc856",
  "sourceUnitDigest": "bd420c8f19c3d9aea688e4987228171062ce0af9bd385d9d85fd25e424f81c63",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "business-rules",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/decision-citation-drift.md#business-rules (source lines 61-61) is carried at docs/platform/decision-citation-drift/spec.md#business-rules (candidate lines 83-83). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "bd420c8f19c3d9aea688e4987228171062ce0af9bd385d9d85fd25e424f81c63",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check"
  ]
}
```

### Full source shown text

```text
## Business Rules

- **R1.** A line in `docs/backlog.md` or any `docs/specs/*.md` file that cites
  a decision id whose decision record carries a superseded-by value is a
  finding unless the same line also cites the superseding id (per `28f8d8f8`).
- **R2.** A bare 4-digit number in a scanned line counts as a citation only
  when it matches a real, known decision id — an unrelated 4-digit number
  (a year, a count, an unrelated code) is never treated as a citation
  (per `28f8d8f8`).
- **R3.** The scan scope is exactly `docs/backlog.md` plus `docs/specs/*.md`.
  `docs/decisions/*.md` itself is out of scope for this check — a decision
  record's own internal backward-pointer consistency (does the superseding
  record point back to what it superseded) is a different check, not this one.
```

### Full target shown text

```text
## Business Rules

- **R1.** A line in `docs/backlog.md` or any `docs/specs/*.md` file that cites
  a decision id whose decision record carries a superseded-by value is a
  finding unless the same line also cites the superseding id (per `28f8d8f8`).
- **R2.** A bare 4-digit number in a scanned line counts as a citation only
  when it matches a real, known decision id — an unrelated 4-digit number
  (a year, a count, an unrelated code) is never treated as a citation
  (per `28f8d8f8`).
- **R3.** The scan scope is exactly `docs/backlog.md` plus `docs/specs/*.md`.
  `docs/decisions/*.md` itself is out of scope for this check — a decision
  record's own internal backward-pointer consistency (does the superseding
  record point back to what it superseded) is a different check, not this one.
```

## claim_e26e9f5cc87f216bf7a4144f6a2fd62a

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#unheaded-block-7; lines 63–73; ancestry ["Spec: Decision Citation Drift Check","Business Rules"].
Target: docs/platform/decision-citation-drift/spec.md#unheaded-block-9; ancestry ["Spec: Decision Citation Drift Check","Business Rules"].
Source digest: 99281802ea8714ea8170f59bd553f0b307f603a746c6596110379cea0b5b1adc
Target digest: 99281802ea8714ea8170f59bd553f0b307f603a746c6596110379cea0b5b1adc
Shown source SHA256: 99281802ea8714ea8170f59bd553f0b307f603a746c6596110379cea0b5b1adc
Shown target SHA256: 99281802ea8714ea8170f59bd553f0b307f603a746c6596110379cea0b5b1adc

### Complete proposed decision

```json
{
  "claimId": "claim_e26e9f5cc87f216bf7a4144f6a2fd62a",
  "sourceUnitDigest": "99281802ea8714ea8170f59bd553f0b307f603a746c6596110379cea0b5b1adc",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/decision-citation-drift.md#unheaded-block-7 (source lines 63-73) is carried at docs/platform/decision-citation-drift/spec.md#unheaded-block-9 (candidate lines 85-95). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "99281802ea8714ea8170f59bd553f0b307f603a746c6596110379cea0b5b1adc",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check",
    "Business Rules"
  ]
}
```

### Full source shown text

```text
- **R1.** A line in `docs/backlog.md` or any `docs/specs/*.md` file that cites
  a decision id whose decision record carries a superseded-by value is a
  finding unless the same line also cites the superseding id (per `28f8d8f8`).
- **R2.** A bare 4-digit number in a scanned line counts as a citation only
  when it matches a real, known decision id — an unrelated 4-digit number
  (a year, a count, an unrelated code) is never treated as a citation
  (per `28f8d8f8`).
- **R3.** The scan scope is exactly `docs/backlog.md` plus `docs/specs/*.md`.
  `docs/decisions/*.md` itself is out of scope for this check — a decision
  record's own internal backward-pointer consistency (does the superseding
  record point back to what it superseded) is a different check, not this one.
```

### Full target shown text

```text
- **R1.** A line in `docs/backlog.md` or any `docs/specs/*.md` file that cites
  a decision id whose decision record carries a superseded-by value is a
  finding unless the same line also cites the superseding id (per `28f8d8f8`).
- **R2.** A bare 4-digit number in a scanned line counts as a citation only
  when it matches a real, known decision id — an unrelated 4-digit number
  (a year, a count, an unrelated code) is never treated as a citation
  (per `28f8d8f8`).
- **R3.** The scan scope is exactly `docs/backlog.md` plus `docs/specs/*.md`.
  `docs/decisions/*.md` itself is out of scope for this check — a decision
  record's own internal backward-pointer consistency (does the superseding
  record point back to what it superseded) is a different check, not this one.
```

## claim_1564e054266b55377f35a78418057318

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#edge-cases-settled; lines 75–75; ancestry ["Spec: Decision Citation Drift Check"].
Target: docs/platform/decision-citation-drift/spec.md#edge-cases-settled; ancestry ["Spec: Decision Citation Drift Check"].
Source digest: 01746da465cdcc5164e7031e314f9845dff72913f6118b480a75078f2c173ccb
Target digest: 01746da465cdcc5164e7031e314f9845dff72913f6118b480a75078f2c173ccb
Shown source SHA256: 69c8445018600b41676af927139d0fff8cdc93071e8931c51f41a401f8b8c4e5
Shown target SHA256: 69c8445018600b41676af927139d0fff8cdc93071e8931c51f41a401f8b8c4e5

### Complete proposed decision

```json
{
  "claimId": "claim_1564e054266b55377f35a78418057318",
  "sourceUnitDigest": "01746da465cdcc5164e7031e314f9845dff72913f6118b480a75078f2c173ccb",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "edge-cases-settled",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/decision-citation-drift.md#edge-cases-settled (source lines 75-75) is carried at docs/platform/decision-citation-drift/spec.md#edge-cases-settled (candidate lines 97-97). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "01746da465cdcc5164e7031e314f9845dff72913f6118b480a75078f2c173ccb",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check"
  ]
}
```

### Full source shown text

```text
## Edge Cases Settled

- A line citing a superseded decision that also cites the superseding id on
  the same line produces no finding — the citation already carries a live
  pointer forward.
- A line citing a decision that has never been superseded never produces a
  finding, regardless of citation form.
- A bare digit sequence that does not match any known decision id is ignored,
  never counted as a citation.
- Real dogfood run against this repo (2026-07-26) found exactly one finding:
  `docs/backlog.md:88` (the STR53 row) cited ADR0002 (flat work-item model, one item kind, one FSM, "epic" is a plain item) without mentioning
  `0012`, its superseder — confirming the check catches a real, not
  hypothetical, instance of dead framing.
```

### Full target shown text

```text
## Edge Cases Settled

- A line citing a superseded decision that also cites the superseding id on
  the same line produces no finding — the citation already carries a live
  pointer forward.
- A line citing a decision that has never been superseded never produces a
  finding, regardless of citation form.
- A bare digit sequence that does not match any known decision id is ignored,
  never counted as a citation.
- Real dogfood run against this repo (2026-07-26) found exactly one finding:
  `docs/backlog.md:88` (the STR53 row) cited ADR0002 (flat work-item model, one item kind, one FSM, "epic" is a plain item) without mentioning
  `0012`, its superseder — confirming the check catches a real, not
  hypothetical, instance of dead framing.
```

## claim_2cba8bb652aeb76ce0ab3c0317c39a6b

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#unheaded-block-8; lines 77–87; ancestry ["Spec: Decision Citation Drift Check","Edge Cases Settled"].
Target: docs/platform/decision-citation-drift/spec.md#unheaded-block-10; ancestry ["Spec: Decision Citation Drift Check","Edge Cases Settled"].
Source digest: 590a6241c63ec4da994d248188f60056371d9051dcbd657d8ff59335dd382b60
Target digest: 590a6241c63ec4da994d248188f60056371d9051dcbd657d8ff59335dd382b60
Shown source SHA256: 590a6241c63ec4da994d248188f60056371d9051dcbd657d8ff59335dd382b60
Shown target SHA256: 590a6241c63ec4da994d248188f60056371d9051dcbd657d8ff59335dd382b60

### Complete proposed decision

```json
{
  "claimId": "claim_2cba8bb652aeb76ce0ab3c0317c39a6b",
  "sourceUnitDigest": "590a6241c63ec4da994d248188f60056371d9051dcbd657d8ff59335dd382b60",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "unheaded-block-10",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/decision-citation-drift.md#unheaded-block-8 (source lines 77-87) is carried at docs/platform/decision-citation-drift/spec.md#unheaded-block-10 (candidate lines 99-109). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "590a6241c63ec4da994d248188f60056371d9051dcbd657d8ff59335dd382b60",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check",
    "Edge Cases Settled"
  ]
}
```

### Full source shown text

```text
- A line citing a superseded decision that also cites the superseding id on
  the same line produces no finding — the citation already carries a live
  pointer forward.
- A line citing a decision that has never been superseded never produces a
  finding, regardless of citation form.
- A bare digit sequence that does not match any known decision id is ignored,
  never counted as a citation.
- Real dogfood run against this repo (2026-07-26) found exactly one finding:
  `docs/backlog.md:88` (the STR53 row) cited ADR0002 (flat work-item model, one item kind, one FSM, "epic" is a plain item) without mentioning
  `0012`, its superseder — confirming the check catches a real, not
  hypothetical, instance of dead framing.
```

### Full target shown text

```text
- A line citing a superseded decision that also cites the superseding id on
  the same line produces no finding — the citation already carries a live
  pointer forward.
- A line citing a decision that has never been superseded never produces a
  finding, regardless of citation form.
- A bare digit sequence that does not match any known decision id is ignored,
  never counted as a citation.
- Real dogfood run against this repo (2026-07-26) found exactly one finding:
  `docs/backlog.md:88` (the STR53 row) cited ADR0002 (flat work-item model, one item kind, one FSM, "epic" is a plain item) without mentioning
  `0012`, its superseder — confirming the check catches a real, not
  hypothetical, instance of dead framing.
```

## claim_10e84e63af173981738360d779c8039b

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#open-gaps; lines 89–89; ancestry ["Spec: Decision Citation Drift Check"].
Target: docs/platform/decision-citation-drift/spec.md#open-gaps; ancestry ["Spec: Decision Citation Drift Check"].
Source digest: 2feb5276d5dc970b753498733b260a49392fe2200c9d02aaa915e5ed51cdd86d
Target digest: 2feb5276d5dc970b753498733b260a49392fe2200c9d02aaa915e5ed51cdd86d
Shown source SHA256: e8dcf0733b5f82e8fef5ec7643cacfc57870763bcf4bdf0822c788be03b190f9
Shown target SHA256: e8dcf0733b5f82e8fef5ec7643cacfc57870763bcf4bdf0822c788be03b190f9

### Complete proposed decision

```json
{
  "claimId": "claim_10e84e63af173981738360d779c8039b",
  "sourceUnitDigest": "2feb5276d5dc970b753498733b260a49392fe2200c9d02aaa915e5ed51cdd86d",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "open-gaps",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/decision-citation-drift.md#open-gaps (source lines 89-89) is carried at docs/platform/decision-citation-drift/spec.md#open-gaps (candidate lines 111-111). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "2feb5276d5dc970b753498733b260a49392fe2200c9d02aaa915e5ed51cdd86d",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check"
  ]
}
```

### Full source shown text

```text
## Open Gaps

- Not wired into any automated gate: neither an npm script, `.bee/config.json`
  `commands.verify`, nor a CI workflow runs this check today. It must be
  invoked manually, so citation drift can persist undetected between manual
  runs. Answerable by whoever next wires a backlog/spec consistency gate.
- No auto-fix: a flagged line's acknowledgement of the superseding id must be
  added by hand; the check only ever reports.
```

### Full target shown text

```text
## Open Gaps

- Not wired into any automated gate: neither an npm script, `.bee/config.json`
  `commands.verify`, nor a CI workflow runs this check today. It must be
  invoked manually, so citation drift can persist undetected between manual
  runs. Answerable by whoever next wires a backlog/spec consistency gate.
- No auto-fix: a flagged line's acknowledgement of the superseding id must be
  added by hand; the check only ever reports.
```

## claim_231e775c29956a4a2a776810cc12a935

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#unheaded-block-9; lines 91–96; ancestry ["Spec: Decision Citation Drift Check","Open Gaps"].
Target: docs/platform/decision-citation-drift/spec.md#unheaded-block-11; ancestry ["Spec: Decision Citation Drift Check","Open Gaps"].
Source digest: 7a22bf47723aee067c9ee720b0fc8d75121b13f4aeb9aa8ed233d20da9c93500
Target digest: 7a22bf47723aee067c9ee720b0fc8d75121b13f4aeb9aa8ed233d20da9c93500
Shown source SHA256: 7a22bf47723aee067c9ee720b0fc8d75121b13f4aeb9aa8ed233d20da9c93500
Shown target SHA256: 7a22bf47723aee067c9ee720b0fc8d75121b13f4aeb9aa8ed233d20da9c93500

### Complete proposed decision

```json
{
  "claimId": "claim_231e775c29956a4a2a776810cc12a935",
  "sourceUnitDigest": "7a22bf47723aee067c9ee720b0fc8d75121b13f4aeb9aa8ed233d20da9c93500",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "unheaded-block-11",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/decision-citation-drift.md#unheaded-block-9 (source lines 91-96) is carried at docs/platform/decision-citation-drift/spec.md#unheaded-block-11 (candidate lines 113-118). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7a22bf47723aee067c9ee720b0fc8d75121b13f4aeb9aa8ed233d20da9c93500",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check",
    "Open Gaps"
  ]
}
```

### Full source shown text

```text
- Not wired into any automated gate: neither an npm script, `.bee/config.json`
  `commands.verify`, nor a CI workflow runs this check today. It must be
  invoked manually, so citation drift can persist undetected between manual
  runs. Answerable by whoever next wires a backlog/spec consistency gate.
- No auto-fix: a flagged line's acknowledgement of the superseding id must be
  added by hand; the check only ever reports.
```

### Full target shown text

```text
- Not wired into any automated gate: neither an npm script, `.bee/config.json`
  `commands.verify`, nor a CI workflow runs this check today. It must be
  invoked manually, so citation drift can persist undetected between manual
  runs. Answerable by whoever next wires a backlog/spec consistency gate.
- No auto-fix: a flagged line's acknowledgement of the superseding id must be
  added by hand; the check only ever reports.
```

## claim_fefb1bf47fc375b9e83089dc6059326c

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#pointers-implementation; lines 98–98; ancestry ["Spec: Decision Citation Drift Check"].
Target: docs/platform/decision-citation-drift/spec.md#pointers-implementation; ancestry ["Spec: Decision Citation Drift Check"].
Source digest: 95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f
Target digest: 95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f
Shown source SHA256: 5b36d87b9f7cde1dd15fe829ef664b5f5c08e63f9ffea3376432d77809570892
Shown target SHA256: 5b36d87b9f7cde1dd15fe829ef664b5f5c08e63f9ffea3376432d77809570892

### Complete proposed decision

```json
{
  "claimId": "claim_fefb1bf47fc375b9e83089dc6059326c",
  "sourceUnitDigest": "95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "pointers-implementation",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/decision-citation-drift.md#pointers-implementation (source lines 98-98) is carried at docs/platform/decision-citation-drift/spec.md#pointers-implementation (candidate lines 120-120). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check"
  ]
}
```

### Full source shown text

```text
## Pointers (implementation)

- `scripts/check-decision-citation-drift.mjs` — pure functions
  (`extractCitedIds`, `findCitationDriftFindings`) plus a thin CLI
  (`loadSupersededById`, `loadSourceFiles`, `runCli`).
- `test/scripts/check-decision-citation-drift.test.mjs` — 9 tests covering
  the rules and edge cases above.
- `src/report/frontmatter.mjs` — reused to read a decision record's
  `superseded_by` front-matter field.
- `scripts/check-decision-supersession.mjs` — the sibling check this one
  mirrors in structure; it checks a decision record's own internal
  backward-pointer instead of backlog/spec citations (a different area).
  **Retired against the real repo (tsk-1lv-4/review-fix F9):** the
  `docs/decisions/NNNN-*.md` + `0000-index.md` pointer-pair format it
  validates was retired for good along with the hand-authored ADR corpus
  -- no longer wired into `npm run check:*` (removed from `package.json`).
  Its pure functions stay real and unit-tested against synthetic
  fixtures; only the real-repo CLI mode has nothing left to run against.
```

### Full target shown text

```text
## Pointers (implementation)

- `scripts/check-decision-citation-drift.mjs` — pure functions
  (`extractCitedIds`, `findCitationDriftFindings`) plus a thin CLI
  (`loadSupersededById`, `loadSourceFiles`, `runCli`).
- `test/scripts/check-decision-citation-drift.test.mjs` — 9 tests covering
  the rules and edge cases above.
- `src/report/frontmatter.mjs` — reused to read a decision record's
  `superseded_by` front-matter field.
- `scripts/check-decision-supersession.mjs` — the sibling check this one
  mirrors in structure; it checks a decision record's own internal
  backward-pointer instead of backlog/spec citations (a different area).
  **Retired against the real repo (tsk-1lv-4/review-fix F9):** the
  `docs/decisions/NNNN-*.md` + `0000-index.md` pointer-pair format it
  validates was retired for good along with the hand-authored ADR corpus
  -- no longer wired into `npm run check:*` (removed from `package.json`).
  Its pure functions stay real and unit-tested against synthetic
  fixtures; only the real-repo CLI mode has nothing left to run against.
```

## claim_4966e71788ccddf622cb3c79fa20b4ec

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/decision-citation-drift.md#unheaded-block-10; lines 100–115; ancestry ["Spec: Decision Citation Drift Check","Pointers (implementation)"].
Target: docs/platform/decision-citation-drift/spec.md#unheaded-block-12; ancestry ["Spec: Decision Citation Drift Check","Pointers (implementation)"].
Source digest: b2c59c202dc6de42a01a6cec95a4aeca692960350aee8e0f37198a01c736dacd
Target digest: b2c59c202dc6de42a01a6cec95a4aeca692960350aee8e0f37198a01c736dacd
Shown source SHA256: b2c59c202dc6de42a01a6cec95a4aeca692960350aee8e0f37198a01c736dacd
Shown target SHA256: b2c59c202dc6de42a01a6cec95a4aeca692960350aee8e0f37198a01c736dacd

### Complete proposed decision

```json
{
  "claimId": "claim_4966e71788ccddf622cb3c79fa20b4ec",
  "sourceUnitDigest": "b2c59c202dc6de42a01a6cec95a4aeca692960350aee8e0f37198a01c736dacd",
  "targetOwner": "docs/platform/decision-citation-drift/spec.md",
  "targetAnchor": "unheaded-block-12",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/decision-citation-drift.md#unheaded-block-10 (source lines 100-115) is carried at docs/platform/decision-citation-drift/spec.md#unheaded-block-12 (candidate lines 122-137). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/decision-citation-drift.md verbatim in docs/platform/decision-citation-drift/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b2c59c202dc6de42a01a6cec95a4aeca692960350aee8e0f37198a01c736dacd",
  "targetAncestry": [
    "Spec: Decision Citation Drift Check",
    "Pointers (implementation)"
  ]
}
```

### Full source shown text

```text
- `scripts/check-decision-citation-drift.mjs` — pure functions
  (`extractCitedIds`, `findCitationDriftFindings`) plus a thin CLI
  (`loadSupersededById`, `loadSourceFiles`, `runCli`).
- `test/scripts/check-decision-citation-drift.test.mjs` — 9 tests covering
  the rules and edge cases above.
- `src/report/frontmatter.mjs` — reused to read a decision record's
  `superseded_by` front-matter field.
- `scripts/check-decision-supersession.mjs` — the sibling check this one
  mirrors in structure; it checks a decision record's own internal
  backward-pointer instead of backlog/spec citations (a different area).
  **Retired against the real repo (tsk-1lv-4/review-fix F9):** the
  `docs/decisions/NNNN-*.md` + `0000-index.md` pointer-pair format it
  validates was retired for good along with the hand-authored ADR corpus
  -- no longer wired into `npm run check:*` (removed from `package.json`).
  Its pure functions stay real and unit-tested against synthetic
  fixtures; only the real-repo CLI mode has nothing left to run against.
```

### Full target shown text

```text
- `scripts/check-decision-citation-drift.mjs` — pure functions
  (`extractCitedIds`, `findCitationDriftFindings`) plus a thin CLI
  (`loadSupersededById`, `loadSourceFiles`, `runCli`).
- `test/scripts/check-decision-citation-drift.test.mjs` — 9 tests covering
  the rules and edge cases above.
- `src/report/frontmatter.mjs` — reused to read a decision record's
  `superseded_by` front-matter field.
- `scripts/check-decision-supersession.mjs` — the sibling check this one
  mirrors in structure; it checks a decision record's own internal
  backward-pointer instead of backlog/spec citations (a different area).
  **Retired against the real repo (tsk-1lv-4/review-fix F9):** the
  `docs/decisions/NNNN-*.md` + `0000-index.md` pointer-pair format it
  validates was retired for good along with the hand-authored ADR corpus
  -- no longer wired into `npm run check:*` (removed from `package.json`).
  Its pure functions stay real and unit-tested against synthetic
  fixtures; only the real-repo CLI mode has nothing left to run against.
```
