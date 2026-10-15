# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/20-domain-rules.md
Part 1/1; entries: **5**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 1/1 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_27a3faa641f5cfd73b3038fcbaf000e5",
      "claim_0380d86ba81fabec2f0826967ca3371e",
      "claim_15126cc42a23aadb0a85c7a1328483f0",
      "claim_c8ef81d2c23f4c1a516b889b7793de8e"
    ],
    "Weak-exact": [],
    "Judgment": [
      "claim_b7557c11c5f05a3e02439d60a904c9d1"
    ]
  },
  "unequalDigestPairs": [
    "claim_b7557c11c5f05a3e02439d60a904c9d1"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_b7557c11c5f05a3e02439d60a904c9d1"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_27a3faa641f5cfd73b3038fcbaf000e5

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/20-domain-rules.md#unheaded-block-1; lines 1–6; ancestry [].
Target: docs/platform/ui-spec/contracts/20-domain-rules.md#unheaded-block-1; ancestry [].
Source digest: c69ce9aa380c0eefd8f19f2740d37efd0ed5db921081d06953a54ade0cd3f7b1
Target digest: c69ce9aa380c0eefd8f19f2740d37efd0ed5db921081d06953a54ade0cd3f7b1
Shown source SHA256: c69ce9aa380c0eefd8f19f2740d37efd0ed5db921081d06953a54ade0cd3f7b1
Shown target SHA256: c69ce9aa380c0eefd8f19f2740d37efd0ed5db921081d06953a54ade0cd3f7b1

### Complete proposed decision

```json
{
  "claimId": "claim_27a3faa641f5cfd73b3038fcbaf000e5",
  "sourceUnitDigest": "c69ce9aa380c0eefd8f19f2740d37efd0ed5db921081d06953a54ade0cd3f7b1",
  "targetOwner": "docs/platform/ui-spec/contracts/20-domain-rules.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/ui-spec/20-domain-rules.md#unheaded-block-1 (source lines 1-6) is carried at docs/platform/ui-spec/contracts/20-domain-rules.md#unheaded-block-1 (candidate lines 1-6). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/20-domain-rules.md verbatim in docs/platform/ui-spec/contracts/20-domain-rules.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c69ce9aa380c0eefd8f19f2740d37efd0ed5db921081d06953a54ade0cd3f7b1",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
id: domain-rules
type: cross-cutting
name: "Domain Rules"
status: active
---
```

### Full target shown text

```text
---
id: domain-rules
type: cross-cutting
name: "Domain Rules"
status: active
---
```

## claim_b7557c11c5f05a3e02439d60a904c9d1

Class: Judgment; mandatory deep: true.
Source: docs/ui-spec/20-domain-rules.md#domain-rules; lines 8–8; ancestry [].
Target: docs/platform/ui-spec/contracts/20-domain-rules.md#domain-rules; ancestry [].
Source digest: 32bf7c30be97154fe592d7ea1d1e2b4525cb598eab97e4ec7de5da5f3b60ab2d
Target digest: f31806949d7daf2dde868322ed78365e87bf39be0b3a91a6f1bb797b2846d9e9
Shown source SHA256: 41e9e1676a663c13c7952b85a8fbd380bb08bad3453fa7de506ef0ad71afee55
Shown target SHA256: 370819041145f55aa8e5394597c9deeaf9ca6a146e44f5548101f596468c6595

### Complete proposed decision

```json
{
  "claimId": "claim_b7557c11c5f05a3e02439d60a904c9d1",
  "sourceUnitDigest": "32bf7c30be97154fe592d7ea1d1e2b4525cb598eab97e4ec7de5da5f3b60ab2d",
  "targetOwner": "docs/platform/ui-spec/contracts/20-domain-rules.md",
  "targetAnchor": "domain-rules",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/ui-spec/20-domain-rules.md#domain-rules (source lines 8-8) is carried at docs/platform/ui-spec/contracts/20-domain-rules.md#domain-rules (candidate lines 8-8). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/ui-spec/20-domain-rules.md verbatim in docs/platform/ui-spec/contracts/20-domain-rules.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f31806949d7daf2dde868322ed78365e87bf39be0b3a91a6f1bb797b2846d9e9",
  "targetAncestry": []
}
```

### Full source shown text

````text
# Domain rules

Every rule here is taken from `docs/specs/herdr-web-dashboard.md`
`## Business Rules` (R1-R11). **No rule is invented at this layer** — the
UI spec draws the product's rules, it does not add any. The mapping below
is bidirectional: a surface listed under a rule must carry that rule ID in
its own frontmatter `rules:` array, or `npm run check` errors with
VR-RULE-DRIFT.

| Rule | What it means for the UI |
|---|---|
| **R1** | The client addresses a gateway, and must not assume a single fixed one. Every data-bearing surface shows which endpoint it is reading, and the endpoint is switchable rather than baked in. |
| **R2** | Every write on screen maps to one fgOS one-door-write verb. A control that cannot name its verb does not belong in this spec. |
| **R3** | Nothing is readable before sign-in, and a failed sign-in reveals nothing — one indistinguishable failure state, never "wrong password" vs "no such user". |
| **R4** | The token is never displayed, never copied into the DOM, and never persisted by the client beyond its session cookie. |
| **R5** | The surface is on by default and reachable beyond loopback; the UI carries a standing, non-dismissable exposure indicator rather than a one-time notice. |
| **R6** | Dashboard availability is independent of the cockpit — the UI never tells a person to "open the cockpit first". |
| **R7** | Approve-merge is only offered where fgOS can actually run it. Where it cannot, the control is shown disabled **with the reason**, never hidden and never offered-then-failed. |
| **R8** | Because the surface is exposed by default and can change trunk, the write controls are visually distinct from the read surface — a person must never trigger a trunk change by muscle memory. |
| **R9** | Question/answer pairing is positional. The timeline renders pairs in recorded order and never implies a link the data does not carry. |
| **R10** | The human narrative is the primary account; the machine decision log renders collapsed by default. |
| **R11** | Nothing pushes. The UI must not imply it will alert anyone — no bell, no "we'll notify you". |

```yaml herdrweb-contract
rules:
  - id: R1
    name: Client of a gateway, never a fixed origin
    surfaces: [S02, S03, S04]
  - id: R2
    name: Every write goes through a one-door-write verb
    surfaces: [M01, M02, M03, C01]
  - id: R3
    name: No read before sign-in, opaque failure
    surfaces: [S01]
  - id: R4
    name: Token never surfaced or persisted by the client
    surfaces: [S01]
  - id: R5
    name: Standing exposure indicator
    surfaces: [S02, S03, S04]
  - id: R6
    name: Availability independent of the cockpit
    surfaces: [S01]
  - id: R7
    name: Approve-merge only where it can run, disabled with a reason otherwise
    surfaces: [S03, M02]
  - id: R8
    name: Write controls visually distinct from the read surface
    surfaces: [S03, M02, C01]
  - id: R9
    name: Positional question/answer pairing
    surfaces: [S03, S04]
  - id: R10
    name: Narrative primary, machine log collapsed
    surfaces: [S03]
  - id: R11
    name: Nothing pushes; being informed is a pull
    surfaces: [S02, S04]
```
````

### Full target shown text

````text
# Domain rules

```txt
Document type: Contract
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/20-domain-rules.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/ui-spec/20-domain-rules.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.


Every rule here is taken from `docs/specs/herdr-web-dashboard.md`
`## Business Rules` (R1-R11). **No rule is invented at this layer** — the
UI spec draws the product's rules, it does not add any. The mapping below
is bidirectional: a surface listed under a rule must carry that rule ID in
its own frontmatter `rules:` array, or `npm run check` errors with
VR-RULE-DRIFT.

| Rule | What it means for the UI |
|---|---|
| **R1** | The client addresses a gateway, and must not assume a single fixed one. Every data-bearing surface shows which endpoint it is reading, and the endpoint is switchable rather than baked in. |
| **R2** | Every write on screen maps to one fgOS one-door-write verb. A control that cannot name its verb does not belong in this spec. |
| **R3** | Nothing is readable before sign-in, and a failed sign-in reveals nothing — one indistinguishable failure state, never "wrong password" vs "no such user". |
| **R4** | The token is never displayed, never copied into the DOM, and never persisted by the client beyond its session cookie. |
| **R5** | The surface is on by default and reachable beyond loopback; the UI carries a standing, non-dismissable exposure indicator rather than a one-time notice. |
| **R6** | Dashboard availability is independent of the cockpit — the UI never tells a person to "open the cockpit first". |
| **R7** | Approve-merge is only offered where fgOS can actually run it. Where it cannot, the control is shown disabled **with the reason**, never hidden and never offered-then-failed. |
| **R8** | Because the surface is exposed by default and can change trunk, the write controls are visually distinct from the read surface — a person must never trigger a trunk change by muscle memory. |
| **R9** | Question/answer pairing is positional. The timeline renders pairs in recorded order and never implies a link the data does not carry. |
| **R10** | The human narrative is the primary account; the machine decision log renders collapsed by default. |
| **R11** | Nothing pushes. The UI must not imply it will alert anyone — no bell, no "we'll notify you". |

```yaml herdrweb-contract
rules:
  - id: R1
    name: Client of a gateway, never a fixed origin
    surfaces: [S02, S03, S04]
  - id: R2
    name: Every write goes through a one-door-write verb
    surfaces: [M01, M02, M03, C01]
  - id: R3
    name: No read before sign-in, opaque failure
    surfaces: [S01]
  - id: R4
    name: Token never surfaced or persisted by the client
    surfaces: [S01]
  - id: R5
    name: Standing exposure indicator
    surfaces: [S02, S03, S04]
  - id: R6
    name: Availability independent of the cockpit
    surfaces: [S01]
  - id: R7
    name: Approve-merge only where it can run, disabled with a reason otherwise
    surfaces: [S03, M02]
  - id: R8
    name: Write controls visually distinct from the read surface
    surfaces: [S03, M02, C01]
  - id: R9
    name: Positional question/answer pairing
    surfaces: [S03, S04]
  - id: R10
    name: Narrative primary, machine log collapsed
    surfaces: [S03]
  - id: R11
    name: Nothing pushes; being informed is a pull
    surfaces: [S02, S04]
```
````

## claim_0380d86ba81fabec2f0826967ca3371e

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/20-domain-rules.md#unheaded-block-2; lines 10–15; ancestry ["Domain rules"].
Target: docs/platform/ui-spec/contracts/20-domain-rules.md#unheaded-block-4; ancestry ["Domain rules"].
Source digest: ff9d4af305d3725a010e2add750c1935610012e2cede02238b41d15df2b50f09
Target digest: ff9d4af305d3725a010e2add750c1935610012e2cede02238b41d15df2b50f09
Shown source SHA256: ff9d4af305d3725a010e2add750c1935610012e2cede02238b41d15df2b50f09
Shown target SHA256: ff9d4af305d3725a010e2add750c1935610012e2cede02238b41d15df2b50f09

### Complete proposed decision

```json
{
  "claimId": "claim_0380d86ba81fabec2f0826967ca3371e",
  "sourceUnitDigest": "ff9d4af305d3725a010e2add750c1935610012e2cede02238b41d15df2b50f09",
  "targetOwner": "docs/platform/ui-spec/contracts/20-domain-rules.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/20-domain-rules.md#unheaded-block-2 (source lines 10-15) is carried at docs/platform/ui-spec/contracts/20-domain-rules.md#unheaded-block-4 (candidate lines 32-37). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/20-domain-rules.md verbatim in docs/platform/ui-spec/contracts/20-domain-rules.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ff9d4af305d3725a010e2add750c1935610012e2cede02238b41d15df2b50f09",
  "targetAncestry": [
    "Domain rules"
  ]
}
```

### Full source shown text

```text
Every rule here is taken from `docs/specs/herdr-web-dashboard.md`
`## Business Rules` (R1-R11). **No rule is invented at this layer** — the
UI spec draws the product's rules, it does not add any. The mapping below
is bidirectional: a surface listed under a rule must carry that rule ID in
its own frontmatter `rules:` array, or `npm run check` errors with
VR-RULE-DRIFT.
```

### Full target shown text

```text
Every rule here is taken from `docs/specs/herdr-web-dashboard.md`
`## Business Rules` (R1-R11). **No rule is invented at this layer** — the
UI spec draws the product's rules, it does not add any. The mapping below
is bidirectional: a surface listed under a rule must carry that rule ID in
its own frontmatter `rules:` array, or `npm run check` errors with
VR-RULE-DRIFT.
```

## claim_15126cc42a23aadb0a85c7a1328483f0

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/20-domain-rules.md#unheaded-block-3; lines 17–29; ancestry ["Domain rules"].
Target: docs/platform/ui-spec/contracts/20-domain-rules.md#unheaded-block-5; ancestry ["Domain rules"].
Source digest: eefeb7d9db1e2cd91a10a80b8e5681f856ab4390d97cd3bbb209c25fb9601882
Target digest: eefeb7d9db1e2cd91a10a80b8e5681f856ab4390d97cd3bbb209c25fb9601882
Shown source SHA256: eefeb7d9db1e2cd91a10a80b8e5681f856ab4390d97cd3bbb209c25fb9601882
Shown target SHA256: eefeb7d9db1e2cd91a10a80b8e5681f856ab4390d97cd3bbb209c25fb9601882

### Complete proposed decision

```json
{
  "claimId": "claim_15126cc42a23aadb0a85c7a1328483f0",
  "sourceUnitDigest": "eefeb7d9db1e2cd91a10a80b8e5681f856ab4390d97cd3bbb209c25fb9601882",
  "targetOwner": "docs/platform/ui-spec/contracts/20-domain-rules.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/20-domain-rules.md#unheaded-block-3 (source lines 17-29) is carried at docs/platform/ui-spec/contracts/20-domain-rules.md#unheaded-block-5 (candidate lines 39-51). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/20-domain-rules.md verbatim in docs/platform/ui-spec/contracts/20-domain-rules.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "eefeb7d9db1e2cd91a10a80b8e5681f856ab4390d97cd3bbb209c25fb9601882",
  "targetAncestry": [
    "Domain rules"
  ]
}
```

### Full source shown text

```text
| Rule | What it means for the UI |
|---|---|
| **R1** | The client addresses a gateway, and must not assume a single fixed one. Every data-bearing surface shows which endpoint it is reading, and the endpoint is switchable rather than baked in. |
| **R2** | Every write on screen maps to one fgOS one-door-write verb. A control that cannot name its verb does not belong in this spec. |
| **R3** | Nothing is readable before sign-in, and a failed sign-in reveals nothing — one indistinguishable failure state, never "wrong password" vs "no such user". |
| **R4** | The token is never displayed, never copied into the DOM, and never persisted by the client beyond its session cookie. |
| **R5** | The surface is on by default and reachable beyond loopback; the UI carries a standing, non-dismissable exposure indicator rather than a one-time notice. |
| **R6** | Dashboard availability is independent of the cockpit — the UI never tells a person to "open the cockpit first". |
| **R7** | Approve-merge is only offered where fgOS can actually run it. Where it cannot, the control is shown disabled **with the reason**, never hidden and never offered-then-failed. |
| **R8** | Because the surface is exposed by default and can change trunk, the write controls are visually distinct from the read surface — a person must never trigger a trunk change by muscle memory. |
| **R9** | Question/answer pairing is positional. The timeline renders pairs in recorded order and never implies a link the data does not carry. |
| **R10** | The human narrative is the primary account; the machine decision log renders collapsed by default. |
| **R11** | Nothing pushes. The UI must not imply it will alert anyone — no bell, no "we'll notify you". |
```

### Full target shown text

```text
| Rule | What it means for the UI |
|---|---|
| **R1** | The client addresses a gateway, and must not assume a single fixed one. Every data-bearing surface shows which endpoint it is reading, and the endpoint is switchable rather than baked in. |
| **R2** | Every write on screen maps to one fgOS one-door-write verb. A control that cannot name its verb does not belong in this spec. |
| **R3** | Nothing is readable before sign-in, and a failed sign-in reveals nothing — one indistinguishable failure state, never "wrong password" vs "no such user". |
| **R4** | The token is never displayed, never copied into the DOM, and never persisted by the client beyond its session cookie. |
| **R5** | The surface is on by default and reachable beyond loopback; the UI carries a standing, non-dismissable exposure indicator rather than a one-time notice. |
| **R6** | Dashboard availability is independent of the cockpit — the UI never tells a person to "open the cockpit first". |
| **R7** | Approve-merge is only offered where fgOS can actually run it. Where it cannot, the control is shown disabled **with the reason**, never hidden and never offered-then-failed. |
| **R8** | Because the surface is exposed by default and can change trunk, the write controls are visually distinct from the read surface — a person must never trigger a trunk change by muscle memory. |
| **R9** | Question/answer pairing is positional. The timeline renders pairs in recorded order and never implies a link the data does not carry. |
| **R10** | The human narrative is the primary account; the machine decision log renders collapsed by default. |
| **R11** | Nothing pushes. The UI must not imply it will alert anyone — no bell, no "we'll notify you". |
```

## claim_c8ef81d2c23f4c1a516b889b7793de8e

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/20-domain-rules.md#unheaded-block-4; lines 31–66; ancestry ["Domain rules"].
Target: docs/platform/ui-spec/contracts/20-domain-rules.md#unheaded-block-6; ancestry ["Domain rules"].
Source digest: 08e2b5ce8d14a2be7069be53afb328c74153781ca698650bb9c6e47326035862
Target digest: 08e2b5ce8d14a2be7069be53afb328c74153781ca698650bb9c6e47326035862
Shown source SHA256: 08e2b5ce8d14a2be7069be53afb328c74153781ca698650bb9c6e47326035862
Shown target SHA256: 08e2b5ce8d14a2be7069be53afb328c74153781ca698650bb9c6e47326035862

### Complete proposed decision

```json
{
  "claimId": "claim_c8ef81d2c23f4c1a516b889b7793de8e",
  "sourceUnitDigest": "08e2b5ce8d14a2be7069be53afb328c74153781ca698650bb9c6e47326035862",
  "targetOwner": "docs/platform/ui-spec/contracts/20-domain-rules.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/20-domain-rules.md#unheaded-block-4 (source lines 31-66) is carried at docs/platform/ui-spec/contracts/20-domain-rules.md#unheaded-block-6 (candidate lines 53-88). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/20-domain-rules.md verbatim in docs/platform/ui-spec/contracts/20-domain-rules.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "08e2b5ce8d14a2be7069be53afb328c74153781ca698650bb9c6e47326035862",
  "targetAncestry": [
    "Domain rules"
  ]
}
```

### Full source shown text

````text
```yaml herdrweb-contract
rules:
  - id: R1
    name: Client of a gateway, never a fixed origin
    surfaces: [S02, S03, S04]
  - id: R2
    name: Every write goes through a one-door-write verb
    surfaces: [M01, M02, M03, C01]
  - id: R3
    name: No read before sign-in, opaque failure
    surfaces: [S01]
  - id: R4
    name: Token never surfaced or persisted by the client
    surfaces: [S01]
  - id: R5
    name: Standing exposure indicator
    surfaces: [S02, S03, S04]
  - id: R6
    name: Availability independent of the cockpit
    surfaces: [S01]
  - id: R7
    name: Approve-merge only where it can run, disabled with a reason otherwise
    surfaces: [S03, M02]
  - id: R8
    name: Write controls visually distinct from the read surface
    surfaces: [S03, M02, C01]
  - id: R9
    name: Positional question/answer pairing
    surfaces: [S03, S04]
  - id: R10
    name: Narrative primary, machine log collapsed
    surfaces: [S03]
  - id: R11
    name: Nothing pushes; being informed is a pull
    surfaces: [S02, S04]
```
````

### Full target shown text

````text
```yaml herdrweb-contract
rules:
  - id: R1
    name: Client of a gateway, never a fixed origin
    surfaces: [S02, S03, S04]
  - id: R2
    name: Every write goes through a one-door-write verb
    surfaces: [M01, M02, M03, C01]
  - id: R3
    name: No read before sign-in, opaque failure
    surfaces: [S01]
  - id: R4
    name: Token never surfaced or persisted by the client
    surfaces: [S01]
  - id: R5
    name: Standing exposure indicator
    surfaces: [S02, S03, S04]
  - id: R6
    name: Availability independent of the cockpit
    surfaces: [S01]
  - id: R7
    name: Approve-merge only where it can run, disabled with a reason otherwise
    surfaces: [S03, M02]
  - id: R8
    name: Write controls visually distinct from the read surface
    surfaces: [S03, M02, C01]
  - id: R9
    name: Positional question/answer pairing
    surfaces: [S03, S04]
  - id: R10
    name: Narrative primary, machine log collapsed
    surfaces: [S03]
  - id: R11
    name: Nothing pushes; being informed is a pull
    surfaces: [S02, S04]
```
````
