# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-observe-01.json
Shard SHA256: d83649662848ccf3bfdb9d3786d8602c809839502dd6dfe2e0d89816607ce0fc
Source: docs/specs/observe.md
Part 1/1; entries: **25**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 10/15 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_398a2a6235ab1ae2d5264325daf42a5c",
      "claim_a2b2774f89a89257732a551b52addc22",
      "claim_a7278e1567e5432cfb079506cf2f5050",
      "claim_50d0f11082f8a7c2a9460b3a970586af",
      "claim_7910591f62e9bc90ce6c1a90b8aa31bc",
      "claim_7ff19d6895d1d1e5ea2d56e881259e4d",
      "claim_af8421bdba71901b8706678586ae03cb",
      "claim_9e9c3f9e870fed7d23af811ce2178b47",
      "claim_46877d1e9417370e4b6f2c36cd2a84cb",
      "claim_d8df03b03865a0d0968739d00129f0a3"
    ],
    "Weak-exact": [
      "claim_a1ef5e3f7d16b7ab938e8ac6eb2209c3",
      "claim_b2a51d5d39832d330879947bdbbcb227",
      "claim_fde5bf697a74032ae96b87746d5f5f25",
      "claim_0494c6c790b6a6cb8aaaa6822467772e",
      "claim_33ce1e718f0906ee1a5f76fb4907b417",
      "claim_908fe7d610c47ed8348c6b10768539c9",
      "claim_7e870015f558a75e65adab6d1b3230d2",
      "claim_b0e62ed94ed2770d0225ff91b34cbadf",
      "claim_3c03309b66efa4925f1255511ed80e22",
      "claim_2958b880278b18a7c00bb32287ef35d5",
      "claim_2d3869be7e1c9fa2195930f46d9d6f3f",
      "claim_212faf152b045009bd39be195155b339"
    ],
    "Judgment": [
      "claim_c9cc1ff2abdd7adf91641d4c8b240523",
      "claim_12da781dbd66869bbf765410d887c7f0",
      "claim_41988cae1fdd914bf7a8a4d1df2aeb82"
    ]
  },
  "unequalDigestPairs": [
    "claim_c9cc1ff2abdd7adf91641d4c8b240523",
    "claim_12da781dbd66869bbf765410d887c7f0",
    "claim_41988cae1fdd914bf7a8a4d1df2aeb82"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_c9cc1ff2abdd7adf91641d4c8b240523",
    "claim_12da781dbd66869bbf765410d887c7f0",
    "claim_41988cae1fdd914bf7a8a4d1df2aeb82"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_c9cc1ff2abdd7adf91641d4c8b240523

Class: Judgment; mandatory deep: true.
Source: docs/specs/observe.md#observe-component-specification; lines 1–1; ancestry [].
Target: docs/platform/observe/spec.md#observe-component-specification; ancestry [].
Source digest: 53e7d20d4f0fc326b73efbd72dcbb66009bc65ec37e130c0e2178c948161adf8
Target digest: a24fdb9ba9dc5da2ef380c707571435a37850ee1a527cfccdfdb0dc6ea39251b
Shown source SHA256: 9dab796d838ebbf4a881f09da1e031c37f743dc17e1c886ebb39e8c6b8396bbe
Shown target SHA256: cbf1311312d2eb05d60dc84f8dc16bd13edd5e15a7d3f4ee0c0868026f523d1f

### Complete proposed decision

```json
{
  "claimId": "claim_c9cc1ff2abdd7adf91641d4c8b240523",
  "sourceUnitDigest": "53e7d20d4f0fc326b73efbd72dcbb66009bc65ec37e130c0e2178c948161adf8",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "observe-component-specification",
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: labelled candidate note and/or explicit relative-link destination rebases; labels, repository referents and source wording otherwise preserved. Source digest is unchanged; target digest is unequal and requires independent deep review. Judgment: no target digest match. The whole heading unit docs/specs/observe.md#observe-component-specification (source lines 1-1) is carried at docs/platform/observe/spec.md#observe-component-specification (candidate lines 1-1). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "a24fdb9ba9dc5da2ef380c707571435a37850ee1a527cfccdfdb0dc6ea39251b",
  "targetAncestry": []
}
```

### Full source shown text

```text
# Observe Component Specification

Document type: BA-grade area specification
Ownership: `packages/observe/rust` (`fgos-observe`)
Substrate stores: `.fgos/observe/<store>/<writerId>.jsonl`
```

### Full target shown text

````text
# Observe Component Specification

```txt
Document type: Specification
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/specs/observe.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/specs/observe.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding. Relative link destinations rebased from ../reference/discussion-quality-rubric.md and ../how-to/compare-discussion-setups-with-metrics-eval.md to ../../reference/discussion-quality-rubric.md and ../../how-to/compare-discussion-setups-with-metrics-eval.md; labels and repository referents unchanged. Split companions are listed in the area portal; original section numbers are retained. Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.


Document type: BA-grade area specification
Ownership: `packages/observe/rust` (`fgos-observe`)
Substrate stores: `.fgos/observe/<store>/<writerId>.jsonl`
````

## claim_398a2a6235ab1ae2d5264325daf42a5c

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/observe.md#unheaded-block-1; lines 3–5; ancestry ["Observe Component Specification"].
Target: docs/platform/observe/spec.md#unheaded-block-3; ancestry ["Observe Component Specification"].
Source digest: b268929538ae29dad4d30bcab03673684209ffaad00be9cf4e111374c1827513
Target digest: b268929538ae29dad4d30bcab03673684209ffaad00be9cf4e111374c1827513
Shown source SHA256: b268929538ae29dad4d30bcab03673684209ffaad00be9cf4e111374c1827513
Shown target SHA256: b268929538ae29dad4d30bcab03673684209ffaad00be9cf4e111374c1827513

### Complete proposed decision

```json
{
  "claimId": "claim_398a2a6235ab1ae2d5264325daf42a5c",
  "sourceUnitDigest": "b268929538ae29dad4d30bcab03673684209ffaad00be9cf4e111374c1827513",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "unheaded-block-3",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/observe.md#unheaded-block-1 (source lines 3-5) is carried at docs/platform/observe/spec.md#unheaded-block-3 (candidate lines 25-27). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b268929538ae29dad4d30bcab03673684209ffaad00be9cf4e111374c1827513",
  "targetAncestry": [
    "Observe Component Specification"
  ]
}
```

### Full source shown text

```text
Document type: BA-grade area specification
Ownership: `packages/observe/rust` (`fgos-observe`)
Substrate stores: `.fgos/observe/<store>/<writerId>.jsonl`
```

### Full target shown text

```text
Document type: BA-grade area specification
Ownership: `packages/observe/rust` (`fgos-observe`)
Substrate stores: `.fgos/observe/<store>/<writerId>.jsonl`
```

## claim_a1ef5e3f7d16b7ab938e8ac6eb2209c3

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/observe.md#1-overview-boundaries; lines 7–7; ancestry ["Observe Component Specification"].
Target: docs/platform/observe/spec.md#1-overview-boundaries; ancestry ["Observe Component Specification"].
Source digest: f3f902093f4846a4bad6229589c0ab856ff959871b4fe3a99cac6f176ec35e48
Target digest: f3f902093f4846a4bad6229589c0ab856ff959871b4fe3a99cac6f176ec35e48
Shown source SHA256: a203fd2774bbaf43a93147818a1bb331c9b6c6a38a7bf8562beff71ed9d0031e
Shown target SHA256: a203fd2774bbaf43a93147818a1bb331c9b6c6a38a7bf8562beff71ed9d0031e

### Complete proposed decision

```json
{
  "claimId": "claim_a1ef5e3f7d16b7ab938e8ac6eb2209c3",
  "sourceUnitDigest": "f3f902093f4846a4bad6229589c0ab856ff959871b4fe3a99cac6f176ec35e48",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "1-overview-boundaries",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/observe.md#1-overview-boundaries (source lines 7-7) is carried at docs/platform/observe/spec.md#1-overview-boundaries (candidate lines 29-29). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f3f902093f4846a4bad6229589c0ab856ff959871b4fe3a99cac6f176ec35e48",
  "targetAncestry": [
    "Observe Component Specification"
  ]
}
```

### Full source shown text

```text
## 1. Overview & Boundaries

Observe là platform layer chuyên trách việc đo lường (`fgos metrics`) và theo dõi trở ngại (`fgos friction`) xuyên suốt mọi tầng của hệ thống fgOS.
Observe được chuyển trọn gói sang Rust trong kế hoạch `plans/260929-1501-metrics-friction-rust-native`.
```

### Full target shown text

```text
## 1. Overview & Boundaries

Observe là platform layer chuyên trách việc đo lường (`fgos metrics`) và theo dõi trở ngại (`fgos friction`) xuyên suốt mọi tầng của hệ thống fgOS.
Observe được chuyển trọn gói sang Rust trong kế hoạch `plans/260929-1501-metrics-friction-rust-native`.
```

## claim_a2b2774f89a89257732a551b52addc22

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/observe.md#unheaded-block-2; lines 9–10; ancestry ["Observe Component Specification","1. Overview & Boundaries"].
Target: docs/platform/observe/spec.md#unheaded-block-4; ancestry ["Observe Component Specification","1. Overview & Boundaries"].
Source digest: 4b789fc020f2595baff813b25b8f25e819353196670c3d4d838d46c72d70012d
Target digest: 4b789fc020f2595baff813b25b8f25e819353196670c3d4d838d46c72d70012d
Shown source SHA256: 4b789fc020f2595baff813b25b8f25e819353196670c3d4d838d46c72d70012d
Shown target SHA256: 4b789fc020f2595baff813b25b8f25e819353196670c3d4d838d46c72d70012d

### Complete proposed decision

```json
{
  "claimId": "claim_a2b2774f89a89257732a551b52addc22",
  "sourceUnitDigest": "4b789fc020f2595baff813b25b8f25e819353196670c3d4d838d46c72d70012d",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/observe.md#unheaded-block-2 (source lines 9-10) is carried at docs/platform/observe/spec.md#unheaded-block-4 (candidate lines 31-32). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "4b789fc020f2595baff813b25b8f25e819353196670c3d4d838d46c72d70012d",
  "targetAncestry": [
    "Observe Component Specification",
    "1. Overview & Boundaries"
  ]
}
```

### Full source shown text

```text
Observe là platform layer chuyên trách việc đo lường (`fgos metrics`) và theo dõi trở ngại (`fgos friction`) xuyên suốt mọi tầng của hệ thống fgOS.
Observe được chuyển trọn gói sang Rust trong kế hoạch `plans/260929-1501-metrics-friction-rust-native`.
```

### Full target shown text

```text
Observe là platform layer chuyên trách việc đo lường (`fgos metrics`) và theo dõi trở ngại (`fgos friction`) xuyên suốt mọi tầng của hệ thống fgOS.
Observe được chuyển trọn gói sang Rust trong kế hoạch `plans/260929-1501-metrics-friction-rust-native`.
```

## claim_b2a51d5d39832d330879947bdbbcb227

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/observe.md#owns; lines 12–12; ancestry ["Observe Component Specification","1. Overview & Boundaries"].
Target: docs/platform/observe/spec.md#owns; ancestry ["Observe Component Specification","1. Overview & Boundaries"].
Source digest: 867c3b15546d97e9565b557a2dbff37cfde054ad310e8a19be48d316ef159476
Target digest: 867c3b15546d97e9565b557a2dbff37cfde054ad310e8a19be48d316ef159476
Shown source SHA256: fa2b0d459b6e7639fe092a06fbb76c99d1f1739944060ec0cc012cd203c3ac11
Shown target SHA256: fa2b0d459b6e7639fe092a06fbb76c99d1f1739944060ec0cc012cd203c3ac11

### Complete proposed decision

```json
{
  "claimId": "claim_b2a51d5d39832d330879947bdbbcb227",
  "sourceUnitDigest": "867c3b15546d97e9565b557a2dbff37cfde054ad310e8a19be48d316ef159476",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "owns",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/observe.md#owns (source lines 12-12) is carried at docs/platform/observe/spec.md#owns (candidate lines 34-34). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "867c3b15546d97e9565b557a2dbff37cfde054ad310e8a19be48d316ef159476",
  "targetAncestry": [
    "Observe Component Specification",
    "1. Overview & Boundaries"
  ]
}
```

### Full source shown text

```text
### Owns
- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).
- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).
- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).
- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`).
- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai.
```

### Full target shown text

```text
### Owns
- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).
- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).
- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).
- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`).
- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai.
```

## claim_a7278e1567e5432cfb079506cf2f5050

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/observe.md#unheaded-block-3; lines 13–17; ancestry ["Observe Component Specification","1. Overview & Boundaries","Owns"].
Target: docs/platform/observe/spec.md#unheaded-block-5; ancestry ["Observe Component Specification","1. Overview & Boundaries","Owns"].
Source digest: 1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623
Target digest: 1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623
Shown source SHA256: 1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623
Shown target SHA256: 1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623

### Complete proposed decision

```json
{
  "claimId": "claim_a7278e1567e5432cfb079506cf2f5050",
  "sourceUnitDigest": "1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/observe.md#unheaded-block-3 (source lines 13-17) is carried at docs/platform/observe/spec.md#unheaded-block-5 (candidate lines 35-39). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623",
  "targetAncestry": [
    "Observe Component Specification",
    "1. Overview & Boundaries",
    "Owns"
  ]
}
```

### Full source shown text

```text
- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).
- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).
- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).
- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`).
- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai.
```

### Full target shown text

```text
- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).
- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).
- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).
- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`).
- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai.
```

## claim_fde5bf697a74032ae96b87746d5f5f25

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/observe.md#must-not-own; lines 19–19; ancestry ["Observe Component Specification","1. Overview & Boundaries"].
Target: docs/platform/observe/spec.md#must-not-own; ancestry ["Observe Component Specification","1. Overview & Boundaries"].
Source digest: 24eb30e7b62ea4e840780b81f404e924c679dbc4002866fca5077bccb2b92b6e
Target digest: 24eb30e7b62ea4e840780b81f404e924c679dbc4002866fca5077bccb2b92b6e
Shown source SHA256: d705518f3046ec65655d4bcf80e067225d2292092b5798d644b19f0aba6106f7
Shown target SHA256: d705518f3046ec65655d4bcf80e067225d2292092b5798d644b19f0aba6106f7

### Complete proposed decision

```json
{
  "claimId": "claim_fde5bf697a74032ae96b87746d5f5f25",
  "sourceUnitDigest": "24eb30e7b62ea4e840780b81f404e924c679dbc4002866fca5077bccb2b92b6e",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "must-not-own",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/observe.md#must-not-own (source lines 19-19) is carried at docs/platform/observe/spec.md#must-not-own (candidate lines 41-41). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "24eb30e7b62ea4e840780b81f404e924c679dbc4002866fca5077bccb2b92b6e",
  "targetAncestry": [
    "Observe Component Specification",
    "1. Overview & Boundaries"
  ]
}
```

### Full source shown text

```text
### Must Not Own
- Không sở hữu trạng thái hoặc vòng đời của Work Items (do `packages/work-state` sở hữu).
- Không tự ý phân loại hoặc đánh giá lại kết quả RunResult (do `packages/run-result` sở hữu).
- Không can thiệp vào logic điều phối hoặc trạng thái của Agent Coordination (do `packages/coordination-state` sở hữu).
- Không ép buộc các component khác phụ thuộc ngược vào Observe: Observe độc lập, composition root (`apps/fgos`) nối các nguồn dữ liệu vào.
```

### Full target shown text

```text
### Must Not Own
- Không sở hữu trạng thái hoặc vòng đời của Work Items (do `packages/work-state` sở hữu).
- Không tự ý phân loại hoặc đánh giá lại kết quả RunResult (do `packages/run-result` sở hữu).
- Không can thiệp vào logic điều phối hoặc trạng thái của Agent Coordination (do `packages/coordination-state` sở hữu).
- Không ép buộc các component khác phụ thuộc ngược vào Observe: Observe độc lập, composition root (`apps/fgos`) nối các nguồn dữ liệu vào.
```

## claim_50d0f11082f8a7c2a9460b3a970586af

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/observe.md#unheaded-block-4; lines 20–23; ancestry ["Observe Component Specification","1. Overview & Boundaries","Must Not Own"].
Target: docs/platform/observe/spec.md#unheaded-block-6; ancestry ["Observe Component Specification","1. Overview & Boundaries","Must Not Own"].
Source digest: cda71f698f80c3f641fc0c525f08d2e8ae35083e5e6b3619f97f815b5ec99f93
Target digest: cda71f698f80c3f641fc0c525f08d2e8ae35083e5e6b3619f97f815b5ec99f93
Shown source SHA256: cda71f698f80c3f641fc0c525f08d2e8ae35083e5e6b3619f97f815b5ec99f93
Shown target SHA256: cda71f698f80c3f641fc0c525f08d2e8ae35083e5e6b3619f97f815b5ec99f93

### Complete proposed decision

```json
{
  "claimId": "claim_50d0f11082f8a7c2a9460b3a970586af",
  "sourceUnitDigest": "cda71f698f80c3f641fc0c525f08d2e8ae35083e5e6b3619f97f815b5ec99f93",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/observe.md#unheaded-block-4 (source lines 20-23) is carried at docs/platform/observe/spec.md#unheaded-block-6 (candidate lines 42-45). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "cda71f698f80c3f641fc0c525f08d2e8ae35083e5e6b3619f97f815b5ec99f93",
  "targetAncestry": [
    "Observe Component Specification",
    "1. Overview & Boundaries",
    "Must Not Own"
  ]
}
```

### Full source shown text

```text
- Không sở hữu trạng thái hoặc vòng đời của Work Items (do `packages/work-state` sở hữu).
- Không tự ý phân loại hoặc đánh giá lại kết quả RunResult (do `packages/run-result` sở hữu).
- Không can thiệp vào logic điều phối hoặc trạng thái của Agent Coordination (do `packages/coordination-state` sở hữu).
- Không ép buộc các component khác phụ thuộc ngược vào Observe: Observe độc lập, composition root (`apps/fgos`) nối các nguồn dữ liệu vào.
```

### Full target shown text

```text
- Không sở hữu trạng thái hoặc vòng đời của Work Items (do `packages/work-state` sở hữu).
- Không tự ý phân loại hoặc đánh giá lại kết quả RunResult (do `packages/run-result` sở hữu).
- Không can thiệp vào logic điều phối hoặc trạng thái của Agent Coordination (do `packages/coordination-state` sở hữu).
- Không ép buộc các component khác phụ thuộc ngược vào Observe: Observe độc lập, composition root (`apps/fgos`) nối các nguồn dữ liệu vào.
```

## claim_0494c6c790b6a6cb8aaaa6822467772e

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/observe.md#2-shared-entities-subjects; lines 25–25; ancestry ["Observe Component Specification"].
Target: docs/platform/observe/spec.md#2-shared-entities-subjects; ancestry ["Observe Component Specification"].
Source digest: f3c03447025b806dfd933bff337de6626a77b8838d4fff1036b24bcab85a93ff
Target digest: f3c03447025b806dfd933bff337de6626a77b8838d4fff1036b24bcab85a93ff
Shown source SHA256: 8f5ee1ccb6351458a92836105e55622e7dedae7cf007b5e9259fc0bf1659b523
Shown target SHA256: 8f5ee1ccb6351458a92836105e55622e7dedae7cf007b5e9259fc0bf1659b523

### Complete proposed decision

```json
{
  "claimId": "claim_0494c6c790b6a6cb8aaaa6822467772e",
  "sourceUnitDigest": "f3c03447025b806dfd933bff337de6626a77b8838d4fff1036b24bcab85a93ff",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "2-shared-entities-subjects",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/observe.md#2-shared-entities-subjects (source lines 25-25) is carried at docs/platform/observe/spec.md#2-shared-entities-subjects (candidate lines 47-47). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f3c03447025b806dfd933bff337de6626a77b8838d4fff1036b24bcab85a93ff",
  "targetAncestry": [
    "Observe Component Specification"
  ]
}
```

### Full source shown text

```text
## 2. Shared Entities & Subjects

| Subject Kind | Định dạng ID | Ví dụ | Owner dữ liệu |
|---|---|---|---|
| `run` | `run:<runId>` | `run:run_1a2b3c` | `packages/run-result/rust` |
| `run` (unit observation) | `unit-run:<unitRunId>` | `unit-run:unit-run-example` | Node execution writer; Rust run-result read contract |
| `session` | `session:<id>` | `session:coord_4d5e6f` | `packages/coordination-state/rust` |
| `executor` | `executor:<id>` | `executor:judge-discovery` | `.fgos/config.json` |
| `case` | `case:<name>` | `case:observe-f2` | `packages/observe/rust` |
| `work` | `work:<id>` | `work:tsk-abc` | `packages/work-state/rust` |
```

### Full target shown text

```text
## 2. Shared Entities & Subjects

| Subject Kind | Định dạng ID | Ví dụ | Owner dữ liệu |
|---|---|---|---|
| `run` | `run:<runId>` | `run:run_1a2b3c` | `packages/run-result/rust` |
| `run` (unit observation) | `unit-run:<unitRunId>` | `unit-run:unit-run-example` | Node execution writer; Rust run-result read contract |
| `session` | `session:<id>` | `session:coord_4d5e6f` | `packages/coordination-state/rust` |
| `executor` | `executor:<id>` | `executor:judge-discovery` | `.fgos/config.json` |
| `case` | `case:<name>` | `case:observe-f2` | `packages/observe/rust` |
| `work` | `work:<id>` | `work:tsk-abc` | `packages/work-state/rust` |
```

## claim_7910591f62e9bc90ce6c1a90b8aa31bc

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/observe.md#unheaded-block-5; lines 27–34; ancestry ["Observe Component Specification","2. Shared Entities & Subjects"].
Target: docs/platform/observe/spec.md#unheaded-block-7; ancestry ["Observe Component Specification","2. Shared Entities & Subjects"].
Source digest: f8410587c25fa1a5be9615ca6551e2347ce424eb682e8fe3867fd7775e96fadc
Target digest: f8410587c25fa1a5be9615ca6551e2347ce424eb682e8fe3867fd7775e96fadc
Shown source SHA256: f8410587c25fa1a5be9615ca6551e2347ce424eb682e8fe3867fd7775e96fadc
Shown target SHA256: f8410587c25fa1a5be9615ca6551e2347ce424eb682e8fe3867fd7775e96fadc

### Complete proposed decision

```json
{
  "claimId": "claim_7910591f62e9bc90ce6c1a90b8aa31bc",
  "sourceUnitDigest": "f8410587c25fa1a5be9615ca6551e2347ce424eb682e8fe3867fd7775e96fadc",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/observe.md#unheaded-block-5 (source lines 27-34) is carried at docs/platform/observe/spec.md#unheaded-block-7 (candidate lines 49-56). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f8410587c25fa1a5be9615ca6551e2347ce424eb682e8fe3867fd7775e96fadc",
  "targetAncestry": [
    "Observe Component Specification",
    "2. Shared Entities & Subjects"
  ]
}
```

### Full source shown text

```text
| Subject Kind | Định dạng ID | Ví dụ | Owner dữ liệu |
|---|---|---|---|
| `run` | `run:<runId>` | `run:run_1a2b3c` | `packages/run-result/rust` |
| `run` (unit observation) | `unit-run:<unitRunId>` | `unit-run:unit-run-example` | Node execution writer; Rust run-result read contract |
| `session` | `session:<id>` | `session:coord_4d5e6f` | `packages/coordination-state/rust` |
| `executor` | `executor:<id>` | `executor:judge-discovery` | `.fgos/config.json` |
| `case` | `case:<name>` | `case:observe-f2` | `packages/observe/rust` |
| `work` | `work:<id>` | `work:tsk-abc` | `packages/work-state/rust` |
```

### Full target shown text

```text
| Subject Kind | Định dạng ID | Ví dụ | Owner dữ liệu |
|---|---|---|---|
| `run` | `run:<runId>` | `run:run_1a2b3c` | `packages/run-result/rust` |
| `run` (unit observation) | `unit-run:<unitRunId>` | `unit-run:unit-run-example` | Node execution writer; Rust run-result read contract |
| `session` | `session:<id>` | `session:coord_4d5e6f` | `packages/coordination-state/rust` |
| `executor` | `executor:<id>` | `executor:judge-discovery` | `.fgos/config.json` |
| `case` | `case:<name>` | `case:observe-f2` | `packages/observe/rust` |
| `work` | `work:<id>` | `work:tsk-abc` | `packages/work-state/rust` |
```

## claim_33ce1e718f0906ee1a5f76fb4907b417

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/observe.md#3-storage-model; lines 36–36; ancestry ["Observe Component Specification"].
Target: docs/platform/observe/spec.md#3-storage-model; ancestry ["Observe Component Specification"].
Source digest: da423b363032cc2e45d09d600c48d1da56a5ec68e1f2a8257529b8a1220cd2cb
Target digest: da423b363032cc2e45d09d600c48d1da56a5ec68e1f2a8257529b8a1220cd2cb
Shown source SHA256: 39652ca00c1d0adb6107a37b54cf301b3e7603d559b29b122c2757657d9963a0
Shown target SHA256: 39652ca00c1d0adb6107a37b54cf301b3e7603d559b29b122c2757657d9963a0

### Complete proposed decision

```json
{
  "claimId": "claim_33ce1e718f0906ee1a5f76fb4907b417",
  "sourceUnitDigest": "da423b363032cc2e45d09d600c48d1da56a5ec68e1f2a8257529b8a1220cd2cb",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "3-storage-model",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/observe.md#3-storage-model (source lines 36-36) is carried at docs/platform/observe/spec.md#3-storage-model (candidate lines 58-58). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "da423b363032cc2e45d09d600c48d1da56a5ec68e1f2a8257529b8a1220cd2cb",
  "targetAncestry": [
    "Observe Component Specification"
  ]
}
```

### Full source shown text

```text
## 3. Storage Model

- **Tracked Shard theo Writer**: mọi thao tác ghi đều ghi vào `.fgos/observe/<store>/<writerId>.jsonl`.
- **Store Lock**: `.fgos/observe/.lock` sử dụng cờ `O_CREAT | O_EXCL`, lưu `{ "pid": u32, "startTime": Option<String>, "ts": String }`. Tự động thu hồi khi holder đã chết hoặc quá TTL 30 giây.
- **Envelope chuẩn**: CLI native luôn trả về envelope `fgos.v1`.
```

### Full target shown text

```text
## 3. Storage Model

- **Tracked Shard theo Writer**: mọi thao tác ghi đều ghi vào `.fgos/observe/<store>/<writerId>.jsonl`.
- **Store Lock**: `.fgos/observe/.lock` sử dụng cờ `O_CREAT | O_EXCL`, lưu `{ "pid": u32, "startTime": Option<String>, "ts": String }`. Tự động thu hồi khi holder đã chết hoặc quá TTL 30 giây.
- **Envelope chuẩn**: CLI native luôn trả về envelope `fgos.v1`.
```

## claim_7ff19d6895d1d1e5ea2d56e881259e4d

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/observe.md#unheaded-block-6; lines 38–40; ancestry ["Observe Component Specification","3. Storage Model"].
Target: docs/platform/observe/spec.md#unheaded-block-8; ancestry ["Observe Component Specification","3. Storage Model"].
Source digest: 91ec155bfcec407b060d39ed9ca7458c928f51cc4ff4a69be8942daa0e8c943d
Target digest: 91ec155bfcec407b060d39ed9ca7458c928f51cc4ff4a69be8942daa0e8c943d
Shown source SHA256: 91ec155bfcec407b060d39ed9ca7458c928f51cc4ff4a69be8942daa0e8c943d
Shown target SHA256: 91ec155bfcec407b060d39ed9ca7458c928f51cc4ff4a69be8942daa0e8c943d

### Complete proposed decision

```json
{
  "claimId": "claim_7ff19d6895d1d1e5ea2d56e881259e4d",
  "sourceUnitDigest": "91ec155bfcec407b060d39ed9ca7458c928f51cc4ff4a69be8942daa0e8c943d",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/observe.md#unheaded-block-6 (source lines 38-40) is carried at docs/platform/observe/spec.md#unheaded-block-8 (candidate lines 60-62). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "91ec155bfcec407b060d39ed9ca7458c928f51cc4ff4a69be8942daa0e8c943d",
  "targetAncestry": [
    "Observe Component Specification",
    "3. Storage Model"
  ]
}
```

### Full source shown text

```text
- **Tracked Shard theo Writer**: mọi thao tác ghi đều ghi vào `.fgos/observe/<store>/<writerId>.jsonl`.
- **Store Lock**: `.fgos/observe/.lock` sử dụng cờ `O_CREAT | O_EXCL`, lưu `{ "pid": u32, "startTime": Option<String>, "ts": String }`. Tự động thu hồi khi holder đã chết hoặc quá TTL 30 giây.
- **Envelope chuẩn**: CLI native luôn trả về envelope `fgos.v1`.
```

### Full target shown text

```text
- **Tracked Shard theo Writer**: mọi thao tác ghi đều ghi vào `.fgos/observe/<store>/<writerId>.jsonl`.
- **Store Lock**: `.fgos/observe/.lock` sử dụng cờ `O_CREAT | O_EXCL`, lưu `{ "pid": u32, "startTime": Option<String>, "ts": String }`. Tự động thu hồi khi holder đã chết hoặc quá TTL 30 giây.
- **Envelope chuẩn**: CLI native luôn trả về envelope `fgos.v1`.
```

## claim_908fe7d610c47ed8348c6b10768539c9

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/observe.md#4-commands-routing; lines 42–42; ancestry ["Observe Component Specification"].
Target: docs/platform/observe/spec.md#4-commands-routing; ancestry ["Observe Component Specification"].
Source digest: b0b1d84706367b794a79b08b31f2e5bcba0e4656af65400e602890505457198d
Target digest: b0b1d84706367b794a79b08b31f2e5bcba0e4656af65400e602890505457198d
Shown source SHA256: 73c35828519149dbcab5b1d70f649da7640dd39d04f87abdd66a460c24d7f9fe
Shown target SHA256: 73c35828519149dbcab5b1d70f649da7640dd39d04f87abdd66a460c24d7f9fe

### Complete proposed decision

```json
{
  "claimId": "claim_908fe7d610c47ed8348c6b10768539c9",
  "sourceUnitDigest": "b0b1d84706367b794a79b08b31f2e5bcba0e4656af65400e602890505457198d",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "4-commands-routing",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/observe.md#4-commands-routing (source lines 42-42) is carried at docs/platform/observe/spec.md#4-commands-routing (candidate lines 64-64). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b0b1d84706367b794a79b08b31f2e5bcba0e4656af65400e602890505457198d",
  "targetAncestry": [
    "Observe Component Specification"
  ]
}
```

### Full source shown text

```text
## 4. Commands & Routing

- `fgos metrics <subcommand>` — lệnh đo lường native (Rust host). Subcommands: `ping`, `case`, `harness`, `faults`, `runs`, `coverage`, `discussions`, `eval`, `outcomes`, `entropy`, `snapshot`.
- `fgos friction <subcommand>` — lệnh friction native (Rust host). Subcommands: `ping`, `record`, `resolve`, `list`, `show`, `rank`.

Node legacy CLI cắm cờ `nativeOnly: true` cho `metrics` và `friction`, từ chối chạy trực tiếp với exit 4.
Mọi component Node hoặc ngôn ngữ ngoài gọi qua helper `src/util/host-bin.mjs` (`invokeHost`).
```

### Full target shown text

```text
## 4. Commands & Routing

- `fgos metrics <subcommand>` — lệnh đo lường native (Rust host). Subcommands: `ping`, `case`, `harness`, `faults`, `runs`, `coverage`, `discussions`, `eval`, `outcomes`, `entropy`, `snapshot`.
- `fgos friction <subcommand>` — lệnh friction native (Rust host). Subcommands: `ping`, `record`, `resolve`, `list`, `show`, `rank`.

Node legacy CLI cắm cờ `nativeOnly: true` cho `metrics` và `friction`, từ chối chạy trực tiếp với exit 4.
Mọi component Node hoặc ngôn ngữ ngoài gọi qua helper `src/util/host-bin.mjs` (`invokeHost`).
```

## claim_af8421bdba71901b8706678586ae03cb

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/observe.md#unheaded-block-7; lines 44–45; ancestry ["Observe Component Specification","4. Commands & Routing"].
Target: docs/platform/observe/spec.md#unheaded-block-9; ancestry ["Observe Component Specification","4. Commands & Routing"].
Source digest: 9c492a74b2527331a937aced7683a78cd847277317273fe52b6a41c8119931ee
Target digest: 9c492a74b2527331a937aced7683a78cd847277317273fe52b6a41c8119931ee
Shown source SHA256: 9c492a74b2527331a937aced7683a78cd847277317273fe52b6a41c8119931ee
Shown target SHA256: 9c492a74b2527331a937aced7683a78cd847277317273fe52b6a41c8119931ee

### Complete proposed decision

```json
{
  "claimId": "claim_af8421bdba71901b8706678586ae03cb",
  "sourceUnitDigest": "9c492a74b2527331a937aced7683a78cd847277317273fe52b6a41c8119931ee",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/observe.md#unheaded-block-7 (source lines 44-45) is carried at docs/platform/observe/spec.md#unheaded-block-9 (candidate lines 66-67). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "9c492a74b2527331a937aced7683a78cd847277317273fe52b6a41c8119931ee",
  "targetAncestry": [
    "Observe Component Specification",
    "4. Commands & Routing"
  ]
}
```

### Full source shown text

```text
- `fgos metrics <subcommand>` — lệnh đo lường native (Rust host). Subcommands: `ping`, `case`, `harness`, `faults`, `runs`, `coverage`, `discussions`, `eval`, `outcomes`, `entropy`, `snapshot`.
- `fgos friction <subcommand>` — lệnh friction native (Rust host). Subcommands: `ping`, `record`, `resolve`, `list`, `show`, `rank`.
```

### Full target shown text

```text
- `fgos metrics <subcommand>` — lệnh đo lường native (Rust host). Subcommands: `ping`, `case`, `harness`, `faults`, `runs`, `coverage`, `discussions`, `eval`, `outcomes`, `entropy`, `snapshot`.
- `fgos friction <subcommand>` — lệnh friction native (Rust host). Subcommands: `ping`, `record`, `resolve`, `list`, `show`, `rank`.
```

## claim_9e9c3f9e870fed7d23af811ce2178b47

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/observe.md#unheaded-block-8; lines 47–48; ancestry ["Observe Component Specification","4. Commands & Routing"].
Target: docs/platform/observe/spec.md#unheaded-block-10; ancestry ["Observe Component Specification","4. Commands & Routing"].
Source digest: ba7d2394b0857879e6448aaba7d9f085662941256e47407f0b72bd18e178a75c
Target digest: ba7d2394b0857879e6448aaba7d9f085662941256e47407f0b72bd18e178a75c
Shown source SHA256: ba7d2394b0857879e6448aaba7d9f085662941256e47407f0b72bd18e178a75c
Shown target SHA256: ba7d2394b0857879e6448aaba7d9f085662941256e47407f0b72bd18e178a75c

### Complete proposed decision

```json
{
  "claimId": "claim_9e9c3f9e870fed7d23af811ce2178b47",
  "sourceUnitDigest": "ba7d2394b0857879e6448aaba7d9f085662941256e47407f0b72bd18e178a75c",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "unheaded-block-10",
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/observe.md#unheaded-block-8 (source lines 47-48) is carried at docs/platform/observe/spec.md#unheaded-block-10 (candidate lines 69-70). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ba7d2394b0857879e6448aaba7d9f085662941256e47407f0b72bd18e178a75c",
  "targetAncestry": [
    "Observe Component Specification",
    "4. Commands & Routing"
  ]
}
```

### Full source shown text

```text
Node legacy CLI cắm cờ `nativeOnly: true` cho `metrics` và `friction`, từ chối chạy trực tiếp với exit 4.
Mọi component Node hoặc ngôn ngữ ngoài gọi qua helper `src/util/host-bin.mjs` (`invokeHost`).
```

### Full target shown text

```text
Node legacy CLI cắm cờ `nativeOnly: true` cho `metrics` và `friction`, từ chối chạy trực tiếp với exit 4.
Mọi component Node hoặc ngôn ngữ ngoài gọi qua helper `src/util/host-bin.mjs` (`invokeHost`).
```

## claim_7e870015f558a75e65adab6d1b3230d2

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/observe.md#5-mục-theo-làn-sub-spec-sections; lines 50–50; ancestry ["Observe Component Specification"].
Target: docs/platform/observe/spec.md#5-mục-theo-làn-sub-spec-sections; ancestry ["Observe Component Specification"].
Source digest: bdac824aa1ded5a576aeca01899a159abcc604b48cfa2e31ad3f660415e78cd3
Target digest: bdac824aa1ded5a576aeca01899a159abcc604b48cfa2e31ad3f660415e78cd3
Shown source SHA256: 26bb13654cfa68288aa3c3b611d736ae254c3238a6246e80a2686630471796c8
Shown target SHA256: 26bb13654cfa68288aa3c3b611d736ae254c3238a6246e80a2686630471796c8

### Complete proposed decision

```json
{
  "claimId": "claim_7e870015f558a75e65adab6d1b3230d2",
  "sourceUnitDigest": "bdac824aa1ded5a576aeca01899a159abcc604b48cfa2e31ad3f660415e78cd3",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "5-mục-theo-làn-sub-spec-sections",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/observe.md#5-mục-theo-làn-sub-spec-sections (source lines 50-50) is carried at docs/platform/observe/spec.md#5-mục-theo-làn-sub-spec-sections (candidate lines 72-72). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "bdac824aa1ded5a576aeca01899a159abcc604b48cfa2e31ad3f660415e78cd3",
  "targetAncestry": [
    "Observe Component Specification"
  ]
}
```

### Full source shown text

```text
## 5. Mục theo làn (Sub-spec sections)
```

### Full target shown text

```text
## 5. Mục theo làn (Sub-spec sections)
```

## claim_b0e62ed94ed2770d0225ff91b34cbadf

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/observe.md#metrics-làn-a; lines 52–52; ancestry ["Observe Component Specification","5. Mục theo làn (Sub-spec sections)"].
Target: docs/platform/observe/spec.md#metrics-làn-a; ancestry ["Observe Component Specification","5. Mục theo làn (Sub-spec sections)"].
Source digest: 2ded62db9d6370e17b2cc65f35e45d117ee7b94c792128d359eb1229e628986f
Target digest: 2ded62db9d6370e17b2cc65f35e45d117ee7b94c792128d359eb1229e628986f
Shown source SHA256: d3a9313d98639dfc36e9890381bb5389e7472e2627295b71e9e04bfa89e5a2fe
Shown target SHA256: d3a9313d98639dfc36e9890381bb5389e7472e2627295b71e9e04bfa89e5a2fe

### Complete proposed decision

```json
{
  "claimId": "claim_b0e62ed94ed2770d0225ff91b34cbadf",
  "sourceUnitDigest": "2ded62db9d6370e17b2cc65f35e45d117ee7b94c792128d359eb1229e628986f",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "metrics-làn-a",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/observe.md#metrics-làn-a (source lines 52-52) is carried at docs/platform/observe/spec.md#metrics-làn-a (candidate lines 74-74). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "2ded62db9d6370e17b2cc65f35e45d117ee7b94c792128d359eb1229e628986f",
  "targetAncestry": [
    "Observe Component Specification",
    "5. Mục theo làn (Sub-spec sections)"
  ]
}
```

### Full source shown text

```text
### § Metrics (Làn A)
Dành cho Phase F3 (`case`), F4 (`harness`, `faults`), F6 (`work` source), F7 (`runs`, `outcomes`, `entropy`, `snapshot`).
- **Claude Transcripts Source**: Thu thập token usage từ `~/.claude/projects/` (`CLAUDE_CONFIG_DIR`). Nhận tất cả thư mục có tên khớp với encoding của bất kỳ path nào trong `git worktree list` (project root cộng từng worktree ngoài) hoặc bắt đầu bằng `enc + "--claude-worktrees-"`. Giữ bộ lọc `cwd` cho từng record để ngăn match nhầm repo khác, và dedupe theo `message.id`.
- **Run Result Source — layout rule `v2`**: `packages/run-result/rust::scan_runs(root)` là scanner duy nhất của Rust. Walk `.fgos/assignments` theo thứ tự lexical; directory tên `runs` đánh dấu parent là assignment, id là relative path (có thể chứa `/`, gồm role/round/fallback; empty nếu `runs` nằm ngay ở assignments root). Không cần `assignment.json`; role/adapter thiếu là null. Đọc `runs/<attempt>/result.json` và chỉ đọc sibling `run.json` khi cần settlement timestamp fallback, không descend vào attempt/outbox và không follow symlink (kể cả result/run/assignment metadata). Assignment-relative depth tối đa 16; attempt không cộng depth. Child directory không đọc được hoặc biến mất bị bỏ qua, sibling vẫn được scan; root không đọc được trả lỗi, root thiếu trả nguồn rỗng.
- **Observed run**: result parseable, `runId` nonblank string, settlement timestamp là nonblank string theo precedence `result.settledAt` → `result.timestamp` → regular sibling `run.json.settledAt`. Không dùng `startedAt`, `assignment.createdAt` hay filesystem mtime để giả lập thời điểm settle. Settlement timestamp nonblank đầu tiên phải là RFC3339 instant hợp lệ (cùng ngữ pháp `parse_timestamp_millis`); nếu không thì skip `invalid-timestamp`, không rơi xuống trường sau và không chiếm `runId`; window consumer vẫn lọc observation theo thời gian. First otherwise-eligible record theo lexical path thắng khi trùng `runId`, trước khi lọc window. `ObservationSource` giữ nguyên contract; `RunResultSource::observations` lấy observations từ scanner rồi lọc window. Đây là lựa chọn implementation dưới tiêu chí chính xác/ổn định/đơn giản của owner, không phải owner đã chọn literal fallback sequence.
- **`fgos metrics coverage [--dir <root>]`**: chỉ scan run source, không scan transcripts; payload `{ layoutRule: "v2", runDirsSeen, observed, skipped: {reason: count}, recentRuns }` trong envelope `fgos.v1`. Reasons: `missing-result` (không có file), `unparseable` (file hiện hữu nhưng không đọc/parse được hoặc nonregular), `no-run-id`, `no-timestamp`, `invalid-timestamp` (thời điểm settle không phải RFC3339 instant hợp lệ), `symlink`, `duplicate-run-id`, `depth`, `inline-record` (unit result có `unitRunId` nhưng không `runId`). Chỉ reasons có count xuất hiện trong map. Symlink/depth traversal barrier tính một skipped candidate; any symlink entry có thể che directory nên là conservative barrier, không khẳng định `runDirsSeen` chỉ gồm physical directories. Result symlink là skip của candidate run, không tính thêm. Luôn `observed + sum(skipped) = runDirsSeen`. `recentRuns` vẫn đếm candidate có regular result file mtime trong 60 giây gần nhất, kể cả result hỏng/trùng/inline; future mtime chỉ là recent khi không vượt quá 60 giây (clock skew); xa hơn thì không, để dung sai của doctor không bị nới mãi. Composition root inject callback `scan_coverage` từ owner vào Observe; không reverse dependency và không đổi observation trait.
- **Hermetic consumer invariant**: Rust và Node materialize cùng fixture declarative `test/fixtures/run-layout/expected.json`; product Node eligibility projection (tách khỏi directory lister) và Rust scanner phải khớp admitted run ids/accounting, planted run trong outbox không được enumerate. Show/watch/recover dùng metadata-first identity lookup và từ chối `run-ambiguous` nếu nhiều materializations có cùng id; lexical winner chỉ là metrics dedup policy, không phải authority để xem/recover một run. Rust cargo tests không đọc live `.fgos/assignments` và không pin audit-time totals. Doctor so sánh độc lập cả eligible unique count và directory/barrier count; directory mtime trong 60 giây cho bounded race tolerance dù result chưa tồn tại. Failure examples chỉ là sample candidates, không khẳng định host đã bỏ những path đó.
- **Unit summaries — writer-owned contract**: Execution ghi `.fgos/assignments/<unitRunId>/unit-summary.json` theo `unit-summary.read.v2` khi toàn Unit settle, kể cả refusal không có seat và inline solo. Producer inline của pattern nhiều vai chỉ ghi kết quả seat, không chốt Unit trước checker/synthesizer. Chọn final seat, numeric attempt, fallback và outcome thuộc Node `unit-run-history.mjs`; mỗi seat có `kind` nonempty do owner pattern ghi, chỉ `kind: "panelist"` là voter, không suy từ tên `panelist-*`/`researcher-*`. Định nghĩa role của panel được owner dùng chung cho execution và materializer. Observe chỉ đọc summary đã settle, không join `unit.json`, Dispatch result hay workflow events để suy diễn; `UnitSummarySource` phát `unit.settled` với subject `unit-run:<id>`, không cộng vào tổng Dispatch runs. Backfill bỏ qua Unit đang chạy/pending hoặc chưa có bằng chứng hoàn tất, mặc định chỉ điền summary còn thiếu và báo summary cũ là stale; `--regenerate` mới viết lại hoặc xoá derived summary, byte-idempotently, không sửa unit/result/event gốc; linkage legacy chỉ dùng `unit.complete` có exact unitRunId. Lỗi ghi summary cảnh báo nhưng không đổi outcome authoritative hoặc che lỗi execution gốc. Record không có pattern thì `outcome: "undetermined"` và seat `kind: "unknown"`, không suy ra solo; reader chỉ nhận v2, version khác báo `unsupported-version` (version được kiểm trước timestamp, nên summary cũ thiếu thời điểm settle vẫn là `unsupported-version`). `summariesMissing` không phân biệt Unit đang chạy với Unit bị bỏ dở (tuổi của `unit.json` và hạn `timeoutMs` đều không phản ánh chính xác).
- **Unit execution state**: `unit.json.execution.status` chuyển `running` → `pending-inline` (chờ producer) → `pending` (inline producer đã ghi, pattern chưa xong) → `running` khi resume → `settled`. Backfill báo `skippedActive`/`skippedUnsettled`; trạng thái không thay thế bằng chứng settlement. Resume invalidates regular summary cũ trước khi công bố `running`; nếu không thể xóa artifact cũ thì dừng trước khi reopen, không để Observe tiếp tục đọc outcome terminal đã mất authority. Artifact nonregular không được đo và vẫn là diagnostic khi summary I/O thất bại.
- **`metrics discussions [--since <date>] [--by workflow|executor|persona]`**: đo unit runs/pass rate, final seats/failed seats, attempts/fallback và median settled duration; attempts không đồng nghĩa seats. Optional stance chỉ được hỏi ở panelist có options, lấy từ final claim: choice thuộc stanceOptions hoặc `other`, confidence nếu có phải hữu hạn trong [0,1] (null/thiếu không cân trọng số). Missing/malformed stance không làm seat thất bại. Không có options, không có voting seats, hoặc dưới hai phiếu hợp lệ hoặc không quá một nửa số ghế bỏ phiếu là `unmeasured`, agreement/genuineSplit null; vẫn giữ counts ghế/missing/invalid. Khi có ít nhất hai valid vote, agreement là largest valid-choice group / final voting seats, genuineSplit khi không nhóm nào đạt 2/3 số ghế. Missing và invalid vẫn ở mẫu số; split khi thiếu claim chỉ là incomplete-evidence signal, không chứng minh dissent. Unit `undetermined` được đếm ở `unitsUndetermined` và không vào `passRate` hay `unitsFailed`. Synthesizer không bỏ phiếu thay panelist, kể cả tên role trùng quy ước panelist. Group executor/persona giữ attempts theo executor/persona thực thi và seats theo final; một unit có thể xuất hiện nhiều group, không cộng group unit totals làm global total.
- **Summary scan diagnostics**: một scan canonical của owner reader cung cấp observations và counts; discussions không scan source hai lần. `summariesMissing` báo Unit directory không có artifact (có thể đang chạy, không tự khẳng định crash); `summariesUnusable` và `summariesSkippedByReason` báo JSON/contract/timestamp/size/read/symlink/nonregular không dùng được, kể cả summary không có settle time. `summariesOutsideWindow` tách summary hợp lệ ngoài window; `summaryDirsSeen` là số Unit directory được xét. Diagnostics có scope root-wide: summary thiếu hoặc không có thời gian không thể gán vào `--since`/`--until`. Callback được composition root inject tương tự coverage scanner; không mở rộng trait `ObservationSource` hay cho Rust tái dựng pattern.
- **Discussion time windows**: `--since`/`--until` so sánh inclusive theo UTC milliseconds, không lexical timestamp; offset spellings của cùng instant cho cùng kết quả. `YYYY-MM-DD` là UTC midnight, không end-of-day. Bound malformed hoặc since sau until trả named error trước scan; owner timestamp malformed không được đoán hay đổi payload gốc.
- **`metrics eval record|list`**: record append-only vào `.fgos/observe/evals/<writerId>.jsonl` qua Observe lock; `observe.eval.v1` giữ harness/question/setup/rubric/judge/runRefs và từng score integer 0–2. `discussion-quality.v1` bắt buộc đúng năm criterion keys của rubric, validate cả write/read; rubric khác vẫn free-form. Writer tạo timestamp/envelope; evalId unique trên toàn shard: check rồi append dưới cùng lock như case journal. Store có invalid tracked data không thể chứng minh uniqueness nên writer từ chối cho tới khi sửa dữ liệu, không bỏ lỗi hay tự sửa log; lỗi từ chối nêu đường dẫn shard, số dòng và lỗi của từng dòng invalid (tối đa 5, phần còn lại đếm gộp). Reader validate và phát hiện duplicate trước exact harness/question filters; first valid lexical record được giữ, later duplicate vào invalid, không coi store có invalid là comparison đáng tin. List sort lexical timestamp rồi evalId; writer UTC/Z chuẩn, không bảo đảm chronological ordering cho timestamp offset do hand-edit. Journal lưu đánh giá, không tự chạy judge hay tuyên bố chất lượng khách quan; A/B blind judge phải nhận neutral inputs ngoài `.fgos`, không kèm setup labels hay run metadata.
- **Eval journal safety**: writer id phải là một filename component, không path; symlinked/nonregular writer shard bị từ chối. Supported Linux/Android/Darwin/BSD dùng target-specific `libc::O_NOFOLLOW | O_NONBLOCK`, xác nhận regular descriptor; platform không có branch atomic no-follow chỉ create-new, existing shard fail closed. Reader giữ tối đa 1 MiB + một byte mỗi logical line, drain line quá lớn rồi tiếp tục, báo file/line/error kể cả partial EOF. Unsafe/nonregular `*.jsonl` entries báo invalid với line0 (shard-level), không follow để lấy scores. Parent directory và read-side entries được preflight, không tuyên bố chống mọi race thay directory/final read component. Không thêm config/env/tool prerequisite: libc là build dependency, runtime dùng Observe dir-writable doctor row, shard identity và lock hiện có; evals tạo lười như các store Observe khác.
```

### Full target shown text

```text
### § Metrics (Làn A)
Dành cho Phase F3 (`case`), F4 (`harness`, `faults`), F6 (`work` source), F7 (`runs`, `outcomes`, `entropy`, `snapshot`).
- **Claude Transcripts Source**: Thu thập token usage từ `~/.claude/projects/` (`CLAUDE_CONFIG_DIR`). Nhận tất cả thư mục có tên khớp với encoding của bất kỳ path nào trong `git worktree list` (project root cộng từng worktree ngoài) hoặc bắt đầu bằng `enc + "--claude-worktrees-"`. Giữ bộ lọc `cwd` cho từng record để ngăn match nhầm repo khác, và dedupe theo `message.id`.
- **Run Result Source — layout rule `v2`**: `packages/run-result/rust::scan_runs(root)` là scanner duy nhất của Rust. Walk `.fgos/assignments` theo thứ tự lexical; directory tên `runs` đánh dấu parent là assignment, id là relative path (có thể chứa `/`, gồm role/round/fallback; empty nếu `runs` nằm ngay ở assignments root). Không cần `assignment.json`; role/adapter thiếu là null. Đọc `runs/<attempt>/result.json` và chỉ đọc sibling `run.json` khi cần settlement timestamp fallback, không descend vào attempt/outbox và không follow symlink (kể cả result/run/assignment metadata). Assignment-relative depth tối đa 16; attempt không cộng depth. Child directory không đọc được hoặc biến mất bị bỏ qua, sibling vẫn được scan; root không đọc được trả lỗi, root thiếu trả nguồn rỗng.
- **Observed run**: result parseable, `runId` nonblank string, settlement timestamp là nonblank string theo precedence `result.settledAt` → `result.timestamp` → regular sibling `run.json.settledAt`. Không dùng `startedAt`, `assignment.createdAt` hay filesystem mtime để giả lập thời điểm settle. Settlement timestamp nonblank đầu tiên phải là RFC3339 instant hợp lệ (cùng ngữ pháp `parse_timestamp_millis`); nếu không thì skip `invalid-timestamp`, không rơi xuống trường sau và không chiếm `runId`; window consumer vẫn lọc observation theo thời gian. First otherwise-eligible record theo lexical path thắng khi trùng `runId`, trước khi lọc window. `ObservationSource` giữ nguyên contract; `RunResultSource::observations` lấy observations từ scanner rồi lọc window. Đây là lựa chọn implementation dưới tiêu chí chính xác/ổn định/đơn giản của owner, không phải owner đã chọn literal fallback sequence.
- **`fgos metrics coverage [--dir <root>]`**: chỉ scan run source, không scan transcripts; payload `{ layoutRule: "v2", runDirsSeen, observed, skipped: {reason: count}, recentRuns }` trong envelope `fgos.v1`. Reasons: `missing-result` (không có file), `unparseable` (file hiện hữu nhưng không đọc/parse được hoặc nonregular), `no-run-id`, `no-timestamp`, `invalid-timestamp` (thời điểm settle không phải RFC3339 instant hợp lệ), `symlink`, `duplicate-run-id`, `depth`, `inline-record` (unit result có `unitRunId` nhưng không `runId`). Chỉ reasons có count xuất hiện trong map. Symlink/depth traversal barrier tính một skipped candidate; any symlink entry có thể che directory nên là conservative barrier, không khẳng định `runDirsSeen` chỉ gồm physical directories. Result symlink là skip của candidate run, không tính thêm. Luôn `observed + sum(skipped) = runDirsSeen`. `recentRuns` vẫn đếm candidate có regular result file mtime trong 60 giây gần nhất, kể cả result hỏng/trùng/inline; future mtime chỉ là recent khi không vượt quá 60 giây (clock skew); xa hơn thì không, để dung sai của doctor không bị nới mãi. Composition root inject callback `scan_coverage` từ owner vào Observe; không reverse dependency và không đổi observation trait.
- **Hermetic consumer invariant**: Rust và Node materialize cùng fixture declarative `test/fixtures/run-layout/expected.json`; product Node eligibility projection (tách khỏi directory lister) và Rust scanner phải khớp admitted run ids/accounting, planted run trong outbox không được enumerate. Show/watch/recover dùng metadata-first identity lookup và từ chối `run-ambiguous` nếu nhiều materializations có cùng id; lexical winner chỉ là metrics dedup policy, không phải authority để xem/recover một run. Rust cargo tests không đọc live `.fgos/assignments` và không pin audit-time totals. Doctor so sánh độc lập cả eligible unique count và directory/barrier count; directory mtime trong 60 giây cho bounded race tolerance dù result chưa tồn tại. Failure examples chỉ là sample candidates, không khẳng định host đã bỏ những path đó.
- **Unit summaries — writer-owned contract**: Execution ghi `.fgos/assignments/<unitRunId>/unit-summary.json` theo `unit-summary.read.v2` khi toàn Unit settle, kể cả refusal không có seat và inline solo. Producer inline của pattern nhiều vai chỉ ghi kết quả seat, không chốt Unit trước checker/synthesizer. Chọn final seat, numeric attempt, fallback và outcome thuộc Node `unit-run-history.mjs`; mỗi seat có `kind` nonempty do owner pattern ghi, chỉ `kind: "panelist"` là voter, không suy từ tên `panelist-*`/`researcher-*`. Định nghĩa role của panel được owner dùng chung cho execution và materializer. Observe chỉ đọc summary đã settle, không join `unit.json`, Dispatch result hay workflow events để suy diễn; `UnitSummarySource` phát `unit.settled` với subject `unit-run:<id>`, không cộng vào tổng Dispatch runs. Backfill bỏ qua Unit đang chạy/pending hoặc chưa có bằng chứng hoàn tất, mặc định chỉ điền summary còn thiếu và báo summary cũ là stale; `--regenerate` mới viết lại hoặc xoá derived summary, byte-idempotently, không sửa unit/result/event gốc; linkage legacy chỉ dùng `unit.complete` có exact unitRunId. Lỗi ghi summary cảnh báo nhưng không đổi outcome authoritative hoặc che lỗi execution gốc. Record không có pattern thì `outcome: "undetermined"` và seat `kind: "unknown"`, không suy ra solo; reader chỉ nhận v2, version khác báo `unsupported-version` (version được kiểm trước timestamp, nên summary cũ thiếu thời điểm settle vẫn là `unsupported-version`). `summariesMissing` không phân biệt Unit đang chạy với Unit bị bỏ dở (tuổi của `unit.json` và hạn `timeoutMs` đều không phản ánh chính xác).
- **Unit execution state**: `unit.json.execution.status` chuyển `running` → `pending-inline` (chờ producer) → `pending` (inline producer đã ghi, pattern chưa xong) → `running` khi resume → `settled`. Backfill báo `skippedActive`/`skippedUnsettled`; trạng thái không thay thế bằng chứng settlement. Resume invalidates regular summary cũ trước khi công bố `running`; nếu không thể xóa artifact cũ thì dừng trước khi reopen, không để Observe tiếp tục đọc outcome terminal đã mất authority. Artifact nonregular không được đo và vẫn là diagnostic khi summary I/O thất bại.
- **`metrics discussions [--since <date>] [--by workflow|executor|persona]`**: đo unit runs/pass rate, final seats/failed seats, attempts/fallback và median settled duration; attempts không đồng nghĩa seats. Optional stance chỉ được hỏi ở panelist có options, lấy từ final claim: choice thuộc stanceOptions hoặc `other`, confidence nếu có phải hữu hạn trong [0,1] (null/thiếu không cân trọng số). Missing/malformed stance không làm seat thất bại. Không có options, không có voting seats, hoặc dưới hai phiếu hợp lệ hoặc không quá một nửa số ghế bỏ phiếu là `unmeasured`, agreement/genuineSplit null; vẫn giữ counts ghế/missing/invalid. Khi có ít nhất hai valid vote, agreement là largest valid-choice group / final voting seats, genuineSplit khi không nhóm nào đạt 2/3 số ghế. Missing và invalid vẫn ở mẫu số; split khi thiếu claim chỉ là incomplete-evidence signal, không chứng minh dissent. Unit `undetermined` được đếm ở `unitsUndetermined` và không vào `passRate` hay `unitsFailed`. Synthesizer không bỏ phiếu thay panelist, kể cả tên role trùng quy ước panelist. Group executor/persona giữ attempts theo executor/persona thực thi và seats theo final; một unit có thể xuất hiện nhiều group, không cộng group unit totals làm global total.
- **Summary scan diagnostics**: một scan canonical của owner reader cung cấp observations và counts; discussions không scan source hai lần. `summariesMissing` báo Unit directory không có artifact (có thể đang chạy, không tự khẳng định crash); `summariesUnusable` và `summariesSkippedByReason` báo JSON/contract/timestamp/size/read/symlink/nonregular không dùng được, kể cả summary không có settle time. `summariesOutsideWindow` tách summary hợp lệ ngoài window; `summaryDirsSeen` là số Unit directory được xét. Diagnostics có scope root-wide: summary thiếu hoặc không có thời gian không thể gán vào `--since`/`--until`. Callback được composition root inject tương tự coverage scanner; không mở rộng trait `ObservationSource` hay cho Rust tái dựng pattern.
- **Discussion time windows**: `--since`/`--until` so sánh inclusive theo UTC milliseconds, không lexical timestamp; offset spellings của cùng instant cho cùng kết quả. `YYYY-MM-DD` là UTC midnight, không end-of-day. Bound malformed hoặc since sau until trả named error trước scan; owner timestamp malformed không được đoán hay đổi payload gốc.
- **`metrics eval record|list`**: record append-only vào `.fgos/observe/evals/<writerId>.jsonl` qua Observe lock; `observe.eval.v1` giữ harness/question/setup/rubric/judge/runRefs và từng score integer 0–2. `discussion-quality.v1` bắt buộc đúng năm criterion keys của rubric, validate cả write/read; rubric khác vẫn free-form. Writer tạo timestamp/envelope; evalId unique trên toàn shard: check rồi append dưới cùng lock như case journal. Store có invalid tracked data không thể chứng minh uniqueness nên writer từ chối cho tới khi sửa dữ liệu, không bỏ lỗi hay tự sửa log; lỗi từ chối nêu đường dẫn shard, số dòng và lỗi của từng dòng invalid (tối đa 5, phần còn lại đếm gộp). Reader validate và phát hiện duplicate trước exact harness/question filters; first valid lexical record được giữ, later duplicate vào invalid, không coi store có invalid là comparison đáng tin. List sort lexical timestamp rồi evalId; writer UTC/Z chuẩn, không bảo đảm chronological ordering cho timestamp offset do hand-edit. Journal lưu đánh giá, không tự chạy judge hay tuyên bố chất lượng khách quan; A/B blind judge phải nhận neutral inputs ngoài `.fgos`, không kèm setup labels hay run metadata.
- **Eval journal safety**: writer id phải là một filename component, không path; symlinked/nonregular writer shard bị từ chối. Supported Linux/Android/Darwin/BSD dùng target-specific `libc::O_NOFOLLOW | O_NONBLOCK`, xác nhận regular descriptor; platform không có branch atomic no-follow chỉ create-new, existing shard fail closed. Reader giữ tối đa 1 MiB + một byte mỗi logical line, drain line quá lớn rồi tiếp tục, báo file/line/error kể cả partial EOF. Unsafe/nonregular `*.jsonl` entries báo invalid với line0 (shard-level), không follow để lấy scores. Parent directory và read-side entries được preflight, không tuyên bố chống mọi race thay directory/final read component. Không thêm config/env/tool prerequisite: libc là build dependency, runtime dùng Observe dir-writable doctor row, shard identity và lock hiện có; evals tạo lười như các store Observe khác.
```

## claim_46877d1e9417370e4b6f2c36cd2a84cb

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/observe.md#unheaded-block-9; lines 53–65; ancestry ["Observe Component Specification","5. Mục theo làn (Sub-spec sections)","§ Metrics (Làn A)"].
Target: docs/platform/observe/spec.md#unheaded-block-11; ancestry ["Observe Component Specification","5. Mục theo làn (Sub-spec sections)","§ Metrics (Làn A)"].
Source digest: 38a6ec109f43ee224a59731555260f01a4727b8b0a39937a7e15fd7af3b3d731
Target digest: 38a6ec109f43ee224a59731555260f01a4727b8b0a39937a7e15fd7af3b3d731
Shown source SHA256: 38a6ec109f43ee224a59731555260f01a4727b8b0a39937a7e15fd7af3b3d731
Shown target SHA256: 38a6ec109f43ee224a59731555260f01a4727b8b0a39937a7e15fd7af3b3d731

### Complete proposed decision

```json
{
  "claimId": "claim_46877d1e9417370e4b6f2c36cd2a84cb",
  "sourceUnitDigest": "38a6ec109f43ee224a59731555260f01a4727b8b0a39937a7e15fd7af3b3d731",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "unheaded-block-11",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/observe.md#unheaded-block-9 (source lines 53-65) is carried at docs/platform/observe/spec.md#unheaded-block-11 (candidate lines 75-87). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "38a6ec109f43ee224a59731555260f01a4727b8b0a39937a7e15fd7af3b3d731",
  "targetAncestry": [
    "Observe Component Specification",
    "5. Mục theo làn (Sub-spec sections)",
    "§ Metrics (Làn A)"
  ]
}
```

### Full source shown text

```text
Dành cho Phase F3 (`case`), F4 (`harness`, `faults`), F6 (`work` source), F7 (`runs`, `outcomes`, `entropy`, `snapshot`).
- **Claude Transcripts Source**: Thu thập token usage từ `~/.claude/projects/` (`CLAUDE_CONFIG_DIR`). Nhận tất cả thư mục có tên khớp với encoding của bất kỳ path nào trong `git worktree list` (project root cộng từng worktree ngoài) hoặc bắt đầu bằng `enc + "--claude-worktrees-"`. Giữ bộ lọc `cwd` cho từng record để ngăn match nhầm repo khác, và dedupe theo `message.id`.
- **Run Result Source — layout rule `v2`**: `packages/run-result/rust::scan_runs(root)` là scanner duy nhất của Rust. Walk `.fgos/assignments` theo thứ tự lexical; directory tên `runs` đánh dấu parent là assignment, id là relative path (có thể chứa `/`, gồm role/round/fallback; empty nếu `runs` nằm ngay ở assignments root). Không cần `assignment.json`; role/adapter thiếu là null. Đọc `runs/<attempt>/result.json` và chỉ đọc sibling `run.json` khi cần settlement timestamp fallback, không descend vào attempt/outbox và không follow symlink (kể cả result/run/assignment metadata). Assignment-relative depth tối đa 16; attempt không cộng depth. Child directory không đọc được hoặc biến mất bị bỏ qua, sibling vẫn được scan; root không đọc được trả lỗi, root thiếu trả nguồn rỗng.
- **Observed run**: result parseable, `runId` nonblank string, settlement timestamp là nonblank string theo precedence `result.settledAt` → `result.timestamp` → regular sibling `run.json.settledAt`. Không dùng `startedAt`, `assignment.createdAt` hay filesystem mtime để giả lập thời điểm settle. Settlement timestamp nonblank đầu tiên phải là RFC3339 instant hợp lệ (cùng ngữ pháp `parse_timestamp_millis`); nếu không thì skip `invalid-timestamp`, không rơi xuống trường sau và không chiếm `runId`; window consumer vẫn lọc observation theo thời gian. First otherwise-eligible record theo lexical path thắng khi trùng `runId`, trước khi lọc window. `ObservationSource` giữ nguyên contract; `RunResultSource::observations` lấy observations từ scanner rồi lọc window. Đây là lựa chọn implementation dưới tiêu chí chính xác/ổn định/đơn giản của owner, không phải owner đã chọn literal fallback sequence.
- **`fgos metrics coverage [--dir <root>]`**: chỉ scan run source, không scan transcripts; payload `{ layoutRule: "v2", runDirsSeen, observed, skipped: {reason: count}, recentRuns }` trong envelope `fgos.v1`. Reasons: `missing-result` (không có file), `unparseable` (file hiện hữu nhưng không đọc/parse được hoặc nonregular), `no-run-id`, `no-timestamp`, `invalid-timestamp` (thời điểm settle không phải RFC3339 instant hợp lệ), `symlink`, `duplicate-run-id`, `depth`, `inline-record` (unit result có `unitRunId` nhưng không `runId`). Chỉ reasons có count xuất hiện trong map. Symlink/depth traversal barrier tính một skipped candidate; any symlink entry có thể che directory nên là conservative barrier, không khẳng định `runDirsSeen` chỉ gồm physical directories. Result symlink là skip của candidate run, không tính thêm. Luôn `observed + sum(skipped) = runDirsSeen`. `recentRuns` vẫn đếm candidate có regular result file mtime trong 60 giây gần nhất, kể cả result hỏng/trùng/inline; future mtime chỉ là recent khi không vượt quá 60 giây (clock skew); xa hơn thì không, để dung sai của doctor không bị nới mãi. Composition root inject callback `scan_coverage` từ owner vào Observe; không reverse dependency và không đổi observation trait.
- **Hermetic consumer invariant**: Rust và Node materialize cùng fixture declarative `test/fixtures/run-layout/expected.json`; product Node eligibility projection (tách khỏi directory lister) và Rust scanner phải khớp admitted run ids/accounting, planted run trong outbox không được enumerate. Show/watch/recover dùng metadata-first identity lookup và từ chối `run-ambiguous` nếu nhiều materializations có cùng id; lexical winner chỉ là metrics dedup policy, không phải authority để xem/recover một run. Rust cargo tests không đọc live `.fgos/assignments` và không pin audit-time totals. Doctor so sánh độc lập cả eligible unique count và directory/barrier count; directory mtime trong 60 giây cho bounded race tolerance dù result chưa tồn tại. Failure examples chỉ là sample candidates, không khẳng định host đã bỏ những path đó.
- **Unit summaries — writer-owned contract**: Execution ghi `.fgos/assignments/<unitRunId>/unit-summary.json` theo `unit-summary.read.v2` khi toàn Unit settle, kể cả refusal không có seat và inline solo. Producer inline của pattern nhiều vai chỉ ghi kết quả seat, không chốt Unit trước checker/synthesizer. Chọn final seat, numeric attempt, fallback và outcome thuộc Node `unit-run-history.mjs`; mỗi seat có `kind` nonempty do owner pattern ghi, chỉ `kind: "panelist"` là voter, không suy từ tên `panelist-*`/`researcher-*`. Định nghĩa role của panel được owner dùng chung cho execution và materializer. Observe chỉ đọc summary đã settle, không join `unit.json`, Dispatch result hay workflow events để suy diễn; `UnitSummarySource` phát `unit.settled` với subject `unit-run:<id>`, không cộng vào tổng Dispatch runs. Backfill bỏ qua Unit đang chạy/pending hoặc chưa có bằng chứng hoàn tất, mặc định chỉ điền summary còn thiếu và báo summary cũ là stale; `--regenerate` mới viết lại hoặc xoá derived summary, byte-idempotently, không sửa unit/result/event gốc; linkage legacy chỉ dùng `unit.complete` có exact unitRunId. Lỗi ghi summary cảnh báo nhưng không đổi outcome authoritative hoặc che lỗi execution gốc. Record không có pattern thì `outcome: "undetermined"` và seat `kind: "unknown"`, không suy ra solo; reader chỉ nhận v2, version khác báo `unsupported-version` (version được kiểm trước timestamp, nên summary cũ thiếu thời điểm settle vẫn là `unsupported-version`). `summariesMissing` không phân biệt Unit đang chạy với Unit bị bỏ dở (tuổi của `unit.json` và hạn `timeoutMs` đều không phản ánh chính xác).
- **Unit execution state**: `unit.json.execution.status` chuyển `running` → `pending-inline` (chờ producer) → `pending` (inline producer đã ghi, pattern chưa xong) → `running` khi resume → `settled`. Backfill báo `skippedActive`/`skippedUnsettled`; trạng thái không thay thế bằng chứng settlement. Resume invalidates regular summary cũ trước khi công bố `running`; nếu không thể xóa artifact cũ thì dừng trước khi reopen, không để Observe tiếp tục đọc outcome terminal đã mất authority. Artifact nonregular không được đo và vẫn là diagnostic khi summary I/O thất bại.
- **`metrics discussions [--since <date>] [--by workflow|executor|persona]`**: đo unit runs/pass rate, final seats/failed seats, attempts/fallback và median settled duration; attempts không đồng nghĩa seats. Optional stance chỉ được hỏi ở panelist có options, lấy từ final claim: choice thuộc stanceOptions hoặc `other`, confidence nếu có phải hữu hạn trong [0,1] (null/thiếu không cân trọng số). Missing/malformed stance không làm seat thất bại. Không có options, không có voting seats, hoặc dưới hai phiếu hợp lệ hoặc không quá một nửa số ghế bỏ phiếu là `unmeasured`, agreement/genuineSplit null; vẫn giữ counts ghế/missing/invalid. Khi có ít nhất hai valid vote, agreement là largest valid-choice group / final voting seats, genuineSplit khi không nhóm nào đạt 2/3 số ghế. Missing và invalid vẫn ở mẫu số; split khi thiếu claim chỉ là incomplete-evidence signal, không chứng minh dissent. Unit `undetermined` được đếm ở `unitsUndetermined` và không vào `passRate` hay `unitsFailed`. Synthesizer không bỏ phiếu thay panelist, kể cả tên role trùng quy ước panelist. Group executor/persona giữ attempts theo executor/persona thực thi và seats theo final; một unit có thể xuất hiện nhiều group, không cộng group unit totals làm global total.
- **Summary scan diagnostics**: một scan canonical của owner reader cung cấp observations và counts; discussions không scan source hai lần. `summariesMissing` báo Unit directory không có artifact (có thể đang chạy, không tự khẳng định crash); `summariesUnusable` và `summariesSkippedByReason` báo JSON/contract/timestamp/size/read/symlink/nonregular không dùng được, kể cả summary không có settle time. `summariesOutsideWindow` tách summary hợp lệ ngoài window; `summaryDirsSeen` là số Unit directory được xét. Diagnostics có scope root-wide: summary thiếu hoặc không có thời gian không thể gán vào `--since`/`--until`. Callback được composition root inject tương tự coverage scanner; không mở rộng trait `ObservationSource` hay cho Rust tái dựng pattern.
- **Discussion time windows**: `--since`/`--until` so sánh inclusive theo UTC milliseconds, không lexical timestamp; offset spellings của cùng instant cho cùng kết quả. `YYYY-MM-DD` là UTC midnight, không end-of-day. Bound malformed hoặc since sau until trả named error trước scan; owner timestamp malformed không được đoán hay đổi payload gốc.
- **`metrics eval record|list`**: record append-only vào `.fgos/observe/evals/<writerId>.jsonl` qua Observe lock; `observe.eval.v1` giữ harness/question/setup/rubric/judge/runRefs và từng score integer 0–2. `discussion-quality.v1` bắt buộc đúng năm criterion keys của rubric, validate cả write/read; rubric khác vẫn free-form. Writer tạo timestamp/envelope; evalId unique trên toàn shard: check rồi append dưới cùng lock như case journal. Store có invalid tracked data không thể chứng minh uniqueness nên writer từ chối cho tới khi sửa dữ liệu, không bỏ lỗi hay tự sửa log; lỗi từ chối nêu đường dẫn shard, số dòng và lỗi của từng dòng invalid (tối đa 5, phần còn lại đếm gộp). Reader validate và phát hiện duplicate trước exact harness/question filters; first valid lexical record được giữ, later duplicate vào invalid, không coi store có invalid là comparison đáng tin. List sort lexical timestamp rồi evalId; writer UTC/Z chuẩn, không bảo đảm chronological ordering cho timestamp offset do hand-edit. Journal lưu đánh giá, không tự chạy judge hay tuyên bố chất lượng khách quan; A/B blind judge phải nhận neutral inputs ngoài `.fgos`, không kèm setup labels hay run metadata.
- **Eval journal safety**: writer id phải là một filename component, không path; symlinked/nonregular writer shard bị từ chối. Supported Linux/Android/Darwin/BSD dùng target-specific `libc::O_NOFOLLOW | O_NONBLOCK`, xác nhận regular descriptor; platform không có branch atomic no-follow chỉ create-new, existing shard fail closed. Reader giữ tối đa 1 MiB + một byte mỗi logical line, drain line quá lớn rồi tiếp tục, báo file/line/error kể cả partial EOF. Unsafe/nonregular `*.jsonl` entries báo invalid với line0 (shard-level), không follow để lấy scores. Parent directory và read-side entries được preflight, không tuyên bố chống mọi race thay directory/final read component. Không thêm config/env/tool prerequisite: libc là build dependency, runtime dùng Observe dir-writable doctor row, shard identity và lock hiện có; evals tạo lười như các store Observe khác.
```

### Full target shown text

```text
Dành cho Phase F3 (`case`), F4 (`harness`, `faults`), F6 (`work` source), F7 (`runs`, `outcomes`, `entropy`, `snapshot`).
- **Claude Transcripts Source**: Thu thập token usage từ `~/.claude/projects/` (`CLAUDE_CONFIG_DIR`). Nhận tất cả thư mục có tên khớp với encoding của bất kỳ path nào trong `git worktree list` (project root cộng từng worktree ngoài) hoặc bắt đầu bằng `enc + "--claude-worktrees-"`. Giữ bộ lọc `cwd` cho từng record để ngăn match nhầm repo khác, và dedupe theo `message.id`.
- **Run Result Source — layout rule `v2`**: `packages/run-result/rust::scan_runs(root)` là scanner duy nhất của Rust. Walk `.fgos/assignments` theo thứ tự lexical; directory tên `runs` đánh dấu parent là assignment, id là relative path (có thể chứa `/`, gồm role/round/fallback; empty nếu `runs` nằm ngay ở assignments root). Không cần `assignment.json`; role/adapter thiếu là null. Đọc `runs/<attempt>/result.json` và chỉ đọc sibling `run.json` khi cần settlement timestamp fallback, không descend vào attempt/outbox và không follow symlink (kể cả result/run/assignment metadata). Assignment-relative depth tối đa 16; attempt không cộng depth. Child directory không đọc được hoặc biến mất bị bỏ qua, sibling vẫn được scan; root không đọc được trả lỗi, root thiếu trả nguồn rỗng.
- **Observed run**: result parseable, `runId` nonblank string, settlement timestamp là nonblank string theo precedence `result.settledAt` → `result.timestamp` → regular sibling `run.json.settledAt`. Không dùng `startedAt`, `assignment.createdAt` hay filesystem mtime để giả lập thời điểm settle. Settlement timestamp nonblank đầu tiên phải là RFC3339 instant hợp lệ (cùng ngữ pháp `parse_timestamp_millis`); nếu không thì skip `invalid-timestamp`, không rơi xuống trường sau và không chiếm `runId`; window consumer vẫn lọc observation theo thời gian. First otherwise-eligible record theo lexical path thắng khi trùng `runId`, trước khi lọc window. `ObservationSource` giữ nguyên contract; `RunResultSource::observations` lấy observations từ scanner rồi lọc window. Đây là lựa chọn implementation dưới tiêu chí chính xác/ổn định/đơn giản của owner, không phải owner đã chọn literal fallback sequence.
- **`fgos metrics coverage [--dir <root>]`**: chỉ scan run source, không scan transcripts; payload `{ layoutRule: "v2", runDirsSeen, observed, skipped: {reason: count}, recentRuns }` trong envelope `fgos.v1`. Reasons: `missing-result` (không có file), `unparseable` (file hiện hữu nhưng không đọc/parse được hoặc nonregular), `no-run-id`, `no-timestamp`, `invalid-timestamp` (thời điểm settle không phải RFC3339 instant hợp lệ), `symlink`, `duplicate-run-id`, `depth`, `inline-record` (unit result có `unitRunId` nhưng không `runId`). Chỉ reasons có count xuất hiện trong map. Symlink/depth traversal barrier tính một skipped candidate; any symlink entry có thể che directory nên là conservative barrier, không khẳng định `runDirsSeen` chỉ gồm physical directories. Result symlink là skip của candidate run, không tính thêm. Luôn `observed + sum(skipped) = runDirsSeen`. `recentRuns` vẫn đếm candidate có regular result file mtime trong 60 giây gần nhất, kể cả result hỏng/trùng/inline; future mtime chỉ là recent khi không vượt quá 60 giây (clock skew); xa hơn thì không, để dung sai của doctor không bị nới mãi. Composition root inject callback `scan_coverage` từ owner vào Observe; không reverse dependency và không đổi observation trait.
- **Hermetic consumer invariant**: Rust và Node materialize cùng fixture declarative `test/fixtures/run-layout/expected.json`; product Node eligibility projection (tách khỏi directory lister) và Rust scanner phải khớp admitted run ids/accounting, planted run trong outbox không được enumerate. Show/watch/recover dùng metadata-first identity lookup và từ chối `run-ambiguous` nếu nhiều materializations có cùng id; lexical winner chỉ là metrics dedup policy, không phải authority để xem/recover một run. Rust cargo tests không đọc live `.fgos/assignments` và không pin audit-time totals. Doctor so sánh độc lập cả eligible unique count và directory/barrier count; directory mtime trong 60 giây cho bounded race tolerance dù result chưa tồn tại. Failure examples chỉ là sample candidates, không khẳng định host đã bỏ những path đó.
- **Unit summaries — writer-owned contract**: Execution ghi `.fgos/assignments/<unitRunId>/unit-summary.json` theo `unit-summary.read.v2` khi toàn Unit settle, kể cả refusal không có seat và inline solo. Producer inline của pattern nhiều vai chỉ ghi kết quả seat, không chốt Unit trước checker/synthesizer. Chọn final seat, numeric attempt, fallback và outcome thuộc Node `unit-run-history.mjs`; mỗi seat có `kind` nonempty do owner pattern ghi, chỉ `kind: "panelist"` là voter, không suy từ tên `panelist-*`/`researcher-*`. Định nghĩa role của panel được owner dùng chung cho execution và materializer. Observe chỉ đọc summary đã settle, không join `unit.json`, Dispatch result hay workflow events để suy diễn; `UnitSummarySource` phát `unit.settled` với subject `unit-run:<id>`, không cộng vào tổng Dispatch runs. Backfill bỏ qua Unit đang chạy/pending hoặc chưa có bằng chứng hoàn tất, mặc định chỉ điền summary còn thiếu và báo summary cũ là stale; `--regenerate` mới viết lại hoặc xoá derived summary, byte-idempotently, không sửa unit/result/event gốc; linkage legacy chỉ dùng `unit.complete` có exact unitRunId. Lỗi ghi summary cảnh báo nhưng không đổi outcome authoritative hoặc che lỗi execution gốc. Record không có pattern thì `outcome: "undetermined"` và seat `kind: "unknown"`, không suy ra solo; reader chỉ nhận v2, version khác báo `unsupported-version` (version được kiểm trước timestamp, nên summary cũ thiếu thời điểm settle vẫn là `unsupported-version`). `summariesMissing` không phân biệt Unit đang chạy với Unit bị bỏ dở (tuổi của `unit.json` và hạn `timeoutMs` đều không phản ánh chính xác).
- **Unit execution state**: `unit.json.execution.status` chuyển `running` → `pending-inline` (chờ producer) → `pending` (inline producer đã ghi, pattern chưa xong) → `running` khi resume → `settled`. Backfill báo `skippedActive`/`skippedUnsettled`; trạng thái không thay thế bằng chứng settlement. Resume invalidates regular summary cũ trước khi công bố `running`; nếu không thể xóa artifact cũ thì dừng trước khi reopen, không để Observe tiếp tục đọc outcome terminal đã mất authority. Artifact nonregular không được đo và vẫn là diagnostic khi summary I/O thất bại.
- **`metrics discussions [--since <date>] [--by workflow|executor|persona]`**: đo unit runs/pass rate, final seats/failed seats, attempts/fallback và median settled duration; attempts không đồng nghĩa seats. Optional stance chỉ được hỏi ở panelist có options, lấy từ final claim: choice thuộc stanceOptions hoặc `other`, confidence nếu có phải hữu hạn trong [0,1] (null/thiếu không cân trọng số). Missing/malformed stance không làm seat thất bại. Không có options, không có voting seats, hoặc dưới hai phiếu hợp lệ hoặc không quá một nửa số ghế bỏ phiếu là `unmeasured`, agreement/genuineSplit null; vẫn giữ counts ghế/missing/invalid. Khi có ít nhất hai valid vote, agreement là largest valid-choice group / final voting seats, genuineSplit khi không nhóm nào đạt 2/3 số ghế. Missing và invalid vẫn ở mẫu số; split khi thiếu claim chỉ là incomplete-evidence signal, không chứng minh dissent. Unit `undetermined` được đếm ở `unitsUndetermined` và không vào `passRate` hay `unitsFailed`. Synthesizer không bỏ phiếu thay panelist, kể cả tên role trùng quy ước panelist. Group executor/persona giữ attempts theo executor/persona thực thi và seats theo final; một unit có thể xuất hiện nhiều group, không cộng group unit totals làm global total.
- **Summary scan diagnostics**: một scan canonical của owner reader cung cấp observations và counts; discussions không scan source hai lần. `summariesMissing` báo Unit directory không có artifact (có thể đang chạy, không tự khẳng định crash); `summariesUnusable` và `summariesSkippedByReason` báo JSON/contract/timestamp/size/read/symlink/nonregular không dùng được, kể cả summary không có settle time. `summariesOutsideWindow` tách summary hợp lệ ngoài window; `summaryDirsSeen` là số Unit directory được xét. Diagnostics có scope root-wide: summary thiếu hoặc không có thời gian không thể gán vào `--since`/`--until`. Callback được composition root inject tương tự coverage scanner; không mở rộng trait `ObservationSource` hay cho Rust tái dựng pattern.
- **Discussion time windows**: `--since`/`--until` so sánh inclusive theo UTC milliseconds, không lexical timestamp; offset spellings của cùng instant cho cùng kết quả. `YYYY-MM-DD` là UTC midnight, không end-of-day. Bound malformed hoặc since sau until trả named error trước scan; owner timestamp malformed không được đoán hay đổi payload gốc.
- **`metrics eval record|list`**: record append-only vào `.fgos/observe/evals/<writerId>.jsonl` qua Observe lock; `observe.eval.v1` giữ harness/question/setup/rubric/judge/runRefs và từng score integer 0–2. `discussion-quality.v1` bắt buộc đúng năm criterion keys của rubric, validate cả write/read; rubric khác vẫn free-form. Writer tạo timestamp/envelope; evalId unique trên toàn shard: check rồi append dưới cùng lock như case journal. Store có invalid tracked data không thể chứng minh uniqueness nên writer từ chối cho tới khi sửa dữ liệu, không bỏ lỗi hay tự sửa log; lỗi từ chối nêu đường dẫn shard, số dòng và lỗi của từng dòng invalid (tối đa 5, phần còn lại đếm gộp). Reader validate và phát hiện duplicate trước exact harness/question filters; first valid lexical record được giữ, later duplicate vào invalid, không coi store có invalid là comparison đáng tin. List sort lexical timestamp rồi evalId; writer UTC/Z chuẩn, không bảo đảm chronological ordering cho timestamp offset do hand-edit. Journal lưu đánh giá, không tự chạy judge hay tuyên bố chất lượng khách quan; A/B blind judge phải nhận neutral inputs ngoài `.fgos`, không kèm setup labels hay run metadata.
- **Eval journal safety**: writer id phải là một filename component, không path; symlinked/nonregular writer shard bị từ chối. Supported Linux/Android/Darwin/BSD dùng target-specific `libc::O_NOFOLLOW | O_NONBLOCK`, xác nhận regular descriptor; platform không có branch atomic no-follow chỉ create-new, existing shard fail closed. Reader giữ tối đa 1 MiB + một byte mỗi logical line, drain line quá lớn rồi tiếp tục, báo file/line/error kể cả partial EOF. Unsafe/nonregular `*.jsonl` entries báo invalid với line0 (shard-level), không follow để lấy scores. Parent directory và read-side entries được preflight, không tuyên bố chống mọi race thay directory/final read component. Không thêm config/env/tool prerequisite: libc là build dependency, runtime dùng Observe dir-writable doctor row, shard identity và lock hiện có; evals tạo lười như các store Observe khác.
```

## claim_3c03309b66efa4925f1255511ed80e22

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/observe.md#friction-làn-b; lines 66–66; ancestry ["Observe Component Specification","5. Mục theo làn (Sub-spec sections)"].
Target: docs/platform/observe/spec.md#friction-làn-b; ancestry ["Observe Component Specification","5. Mục theo làn (Sub-spec sections)"].
Source digest: beb19f3cb48940ebb818fbbd587c431842314f1d66534d641baa04d9a48396ae
Target digest: beb19f3cb48940ebb818fbbd587c431842314f1d66534d641baa04d9a48396ae
Shown source SHA256: 1d04591246bcab7dd4544505b11e777987aa83b57d375ee589d22c7e6b4439b9
Shown target SHA256: 1d04591246bcab7dd4544505b11e777987aa83b57d375ee589d22c7e6b4439b9

### Complete proposed decision

```json
{
  "claimId": "claim_3c03309b66efa4925f1255511ed80e22",
  "sourceUnitDigest": "beb19f3cb48940ebb818fbbd587c431842314f1d66534d641baa04d9a48396ae",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "friction-làn-b",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/observe.md#friction-làn-b (source lines 66-66) is carried at docs/platform/observe/spec.md#friction-làn-b (candidate lines 88-88). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "beb19f3cb48940ebb818fbbd587c431842314f1d66534d641baa04d9a48396ae",
  "targetAncestry": [
    "Observe Component Specification",
    "5. Mục theo làn (Sub-spec sections)"
  ]
}
```

### Full source shown text

```text
### § Friction (Làn B)
Dành cho Phase F5: writer Rust duy nhất, migration lười từ `work.friction`, các lệnh `friction record/resolve/list/show/rank`.
```

### Full target shown text

```text
### § Friction (Làn B)
Dành cho Phase F5: writer Rust duy nhất, migration lười từ `work.friction`, các lệnh `friction record/resolve/list/show/rank`.
```

## claim_d8df03b03865a0d0968739d00129f0a3

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/observe.md#unheaded-block-10; lines 67–67; ancestry ["Observe Component Specification","5. Mục theo làn (Sub-spec sections)","§ Friction (Làn B)"].
Target: docs/platform/observe/spec.md#unheaded-block-12; ancestry ["Observe Component Specification","5. Mục theo làn (Sub-spec sections)","§ Friction (Làn B)"].
Source digest: 6b68a1227525c179699df85a2740ac5cddef67482e08d171e27dfac789472e8b
Target digest: 6b68a1227525c179699df85a2740ac5cddef67482e08d171e27dfac789472e8b
Shown source SHA256: 6b68a1227525c179699df85a2740ac5cddef67482e08d171e27dfac789472e8b
Shown target SHA256: 6b68a1227525c179699df85a2740ac5cddef67482e08d171e27dfac789472e8b

### Complete proposed decision

```json
{
  "claimId": "claim_d8df03b03865a0d0968739d00129f0a3",
  "sourceUnitDigest": "6b68a1227525c179699df85a2740ac5cddef67482e08d171e27dfac789472e8b",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "unheaded-block-12",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/observe.md#unheaded-block-10 (source lines 67-67) is carried at docs/platform/observe/spec.md#unheaded-block-12 (candidate lines 89-89). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6b68a1227525c179699df85a2740ac5cddef67482e08d171e27dfac789472e8b",
  "targetAncestry": [
    "Observe Component Specification",
    "5. Mục theo làn (Sub-spec sections)",
    "§ Friction (Làn B)"
  ]
}
```

### Full source shown text

```text
Dành cho Phase F5: writer Rust duy nhất, migration lười từ `work.friction`, các lệnh `friction record/resolve/list/show/rank`.
```

### Full target shown text

```text
Dành cho Phase F5: writer Rust duy nhất, migration lười từ `work.friction`, các lệnh `friction record/resolve/list/show/rank`.
```

## claim_12da781dbd66869bbf765410d887c7f0

Class: Judgment; mandatory deep: true.
Source: docs/specs/observe.md#contract-quyết-định-làn-c-f8; lines 69–69; ancestry ["Observe Component Specification","5. Mục theo làn (Sub-spec sections)"].
Target: docs/platform/observe/spec.md#contract-quyết-định-làn-c-f8; ancestry ["Observe Component Specification","5. Mục theo làn (Sub-spec sections)"].
Source digest: 1524c34dd5cd1df09f8b4a30a383264347263a484824aab9af796fd95f4c9e03
Target digest: 2e58e1822dc58b46b60193348bdfef8dcba3ca8621bbd845c2ed61c95c720917
Shown source SHA256: 3c5c7b4f3f07e7969de98f6c20a8de1d858c62688a71019b92e9d43766204f24
Shown target SHA256: 0fc1e9a1b4f9fefc1c1650e0b1d76a13bbbdbf179c6e691f2e3cecc0457a9997

### Complete proposed decision

```json
{
  "claimId": "claim_12da781dbd66869bbf765410d887c7f0",
  "sourceUnitDigest": "1524c34dd5cd1df09f8b4a30a383264347263a484824aab9af796fd95f4c9e03",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "contract-quyết-định-làn-c-f8",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: labelled candidate note and/or explicit relative-link destination rebases; labels, repository referents and source wording otherwise preserved. Source digest is unchanged; target digest is unequal and requires independent deep review. The whole heading unit docs/specs/observe.md#contract-quyết-định-làn-c-f8 (source lines 69-69) is carried at docs/platform/observe/spec.md#contract-quyết-định-làn-c-f8 (candidate lines 91-91). Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "2e58e1822dc58b46b60193348bdfef8dcba3ca8621bbd845c2ed61c95c720917",
  "targetAncestry": [
    "Observe Component Specification",
    "5. Mục theo làn (Sub-spec sections)"
  ]
}
```

### Full source shown text

```text
### § Contract & Quyết định (Làn C / F8)
Dành cho Phase F8: khoá ranh giới contracts, golden fixtures và decision records.
- Versioned contracts: `packages/observe/contracts/` (`observe.observation.v1.json`, `observe.friction.v1.json`, `observe.case.v1.json`, `observe.snapshot.v1.json`, `observe.eval.v1.json`). Eval rubric: [`discussion-quality.v1`](../reference/discussion-quality-rubric.md); [blind comparison how-to](../how-to/compare-discussion-setups-with-metrics-eval.md).
- Source owner read contracts: `packages/run-result/contracts/run-result.read.v1.json`, `packages/run-result/contracts/unit-summary.read.v2.json`, `packages/observe/contracts/coordination-session.read.v1.json` (historic sessions; the coordination engine is retired), `packages/work-state/contracts/work-events.read.v1.json`.
- Golden fixtures: `test/fixtures/observe/` sinh bằng CLI Rust và Node trong `scripts/regenerate-observe-fixtures.mjs`.
- Doctor checks: `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage` (`src/setup/registrations.mjs`). Coverage check gọi host `metrics coverage` qua helper với main-checkout dir, kiểm tra `v2` + accounting rồi so `runDirsSeen` với Node directory-only `scanAssignmentLayout` (gồm symlink/depth barriers). Tolerance là max(Node recent result files, host `recentRuns`) trong cửa sổ 60 giây. Chỉ positive unknown subcommand hoặc payload thiếu `layoutRule` được degraded/pass vì old host; malformed coverage và các lỗi khác fail.
```

### Full target shown text

```text
### § Contract & Quyết định (Làn C / F8)
Dành cho Phase F8: khoá ranh giới contracts, golden fixtures và decision records.
- Versioned contracts: `packages/observe/contracts/` (`observe.observation.v1.json`, `observe.friction.v1.json`, `observe.case.v1.json`, `observe.snapshot.v1.json`, `observe.eval.v1.json`). Eval rubric: [`discussion-quality.v1`](../../reference/discussion-quality-rubric.md); [blind comparison how-to](../../how-to/compare-discussion-setups-with-metrics-eval.md).
- Source owner read contracts: `packages/run-result/contracts/run-result.read.v1.json`, `packages/run-result/contracts/unit-summary.read.v2.json`, `packages/observe/contracts/coordination-session.read.v1.json` (historic sessions; the coordination engine is retired), `packages/work-state/contracts/work-events.read.v1.json`.
- Golden fixtures: `test/fixtures/observe/` sinh bằng CLI Rust và Node trong `scripts/regenerate-observe-fixtures.mjs`.
- Doctor checks: `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage` (`src/setup/registrations.mjs`). Coverage check gọi host `metrics coverage` qua helper với main-checkout dir, kiểm tra `v2` + accounting rồi so `runDirsSeen` với Node directory-only `scanAssignmentLayout` (gồm symlink/depth barriers). Tolerance là max(Node recent result files, host `recentRuns`) trong cửa sổ 60 giây. Chỉ positive unknown subcommand hoặc payload thiếu `layoutRule` được degraded/pass vì old host; malformed coverage và các lỗi khác fail.
```

## claim_41988cae1fdd914bf7a8a4d1df2aeb82

Class: Judgment; mandatory deep: true.
Source: docs/specs/observe.md#unheaded-block-11; lines 70–74; ancestry ["Observe Component Specification","5. Mục theo làn (Sub-spec sections)","§ Contract & Quyết định (Làn C / F8)"].
Target: docs/platform/observe/spec.md#unheaded-block-13; ancestry ["Observe Component Specification","5. Mục theo làn (Sub-spec sections)","§ Contract & Quyết định (Làn C / F8)"].
Source digest: 46e05dc484d8e352983b2835fed11fa9ff77e8a16af7387a1423a930a1f6767f
Target digest: a5d8dd83d3e9fc6729c2fd75300786b9c93aba271363a949245b25a52d760a7a
Shown source SHA256: 46e05dc484d8e352983b2835fed11fa9ff77e8a16af7387a1423a930a1f6767f
Shown target SHA256: a5d8dd83d3e9fc6729c2fd75300786b9c93aba271363a949245b25a52d760a7a

### Complete proposed decision

```json
{
  "claimId": "claim_41988cae1fdd914bf7a8a4d1df2aeb82",
  "sourceUnitDigest": "46e05dc484d8e352983b2835fed11fa9ff77e8a16af7387a1423a930a1f6767f",
  "targetOwner": "docs/platform/observe/spec.md",
  "targetAnchor": "unheaded-block-13",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: labelled candidate note and/or explicit relative-link destination rebases; labels, repository referents and source wording otherwise preserved. Source digest is unchanged; target digest is unequal and requires independent deep review. The whole unheaded-block unit docs/specs/observe.md#unheaded-block-11 (source lines 70-74) is carried at docs/platform/observe/spec.md#unheaded-block-13 (candidate lines 92-96). Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "a5d8dd83d3e9fc6729c2fd75300786b9c93aba271363a949245b25a52d760a7a",
  "targetAncestry": [
    "Observe Component Specification",
    "5. Mục theo làn (Sub-spec sections)",
    "§ Contract & Quyết định (Làn C / F8)"
  ]
}
```

### Full source shown text

```text
Dành cho Phase F8: khoá ranh giới contracts, golden fixtures và decision records.
- Versioned contracts: `packages/observe/contracts/` (`observe.observation.v1.json`, `observe.friction.v1.json`, `observe.case.v1.json`, `observe.snapshot.v1.json`, `observe.eval.v1.json`). Eval rubric: [`discussion-quality.v1`](../reference/discussion-quality-rubric.md); [blind comparison how-to](../how-to/compare-discussion-setups-with-metrics-eval.md).
- Source owner read contracts: `packages/run-result/contracts/run-result.read.v1.json`, `packages/run-result/contracts/unit-summary.read.v2.json`, `packages/observe/contracts/coordination-session.read.v1.json` (historic sessions; the coordination engine is retired), `packages/work-state/contracts/work-events.read.v1.json`.
- Golden fixtures: `test/fixtures/observe/` sinh bằng CLI Rust và Node trong `scripts/regenerate-observe-fixtures.mjs`.
- Doctor checks: `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage` (`src/setup/registrations.mjs`). Coverage check gọi host `metrics coverage` qua helper với main-checkout dir, kiểm tra `v2` + accounting rồi so `runDirsSeen` với Node directory-only `scanAssignmentLayout` (gồm symlink/depth barriers). Tolerance là max(Node recent result files, host `recentRuns`) trong cửa sổ 60 giây. Chỉ positive unknown subcommand hoặc payload thiếu `layoutRule` được degraded/pass vì old host; malformed coverage và các lỗi khác fail.
```

### Full target shown text

```text
Dành cho Phase F8: khoá ranh giới contracts, golden fixtures và decision records.
- Versioned contracts: `packages/observe/contracts/` (`observe.observation.v1.json`, `observe.friction.v1.json`, `observe.case.v1.json`, `observe.snapshot.v1.json`, `observe.eval.v1.json`). Eval rubric: [`discussion-quality.v1`](../../reference/discussion-quality-rubric.md); [blind comparison how-to](../../how-to/compare-discussion-setups-with-metrics-eval.md).
- Source owner read contracts: `packages/run-result/contracts/run-result.read.v1.json`, `packages/run-result/contracts/unit-summary.read.v2.json`, `packages/observe/contracts/coordination-session.read.v1.json` (historic sessions; the coordination engine is retired), `packages/work-state/contracts/work-events.read.v1.json`.
- Golden fixtures: `test/fixtures/observe/` sinh bằng CLI Rust và Node trong `scripts/regenerate-observe-fixtures.mjs`.
- Doctor checks: `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage` (`src/setup/registrations.mjs`). Coverage check gọi host `metrics coverage` qua helper với main-checkout dir, kiểm tra `v2` + accounting rồi so `runDirsSeen` với Node directory-only `scanAssignmentLayout` (gồm symlink/depth barriers). Tolerance là max(Node recent result files, host `recentRuns`) trong cửa sổ 60 giây. Chỉ positive unknown subcommand hoặc payload thiếu `layoutRule` được degraded/pass vì old host; malformed coverage và các lỗi khác fail.
```

## claim_2958b880278b18a7c00bb32287ef35d5

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/observe.md#6-lịch-sử-quyết-định; lines 76–76; ancestry ["Observe Component Specification"].
Target: docs/platform/observe/decisions/observe-component-architecture.md#6-lịch-sử-quyết-định; ancestry ["Added in candidate: observe component architecture"].
Source digest: 2395711f7f1021e4ef362412f26aea6abf63869205a3b89e8ccc19f5376a0227
Target digest: 2395711f7f1021e4ef362412f26aea6abf63869205a3b89e8ccc19f5376a0227
Shown source SHA256: 35fcbf4b364b6c8bf7074e63f82c7ff0f11e3851d32cf40fbee2f21fca6d9722
Shown target SHA256: 35fcbf4b364b6c8bf7074e63f82c7ff0f11e3851d32cf40fbee2f21fca6d9722

### Complete proposed decision

```json
{
  "claimId": "claim_2958b880278b18a7c00bb32287ef35d5",
  "sourceUnitDigest": "2395711f7f1021e4ef362412f26aea6abf63869205a3b89e8ccc19f5376a0227",
  "targetOwner": "docs/platform/observe/decisions/observe-component-architecture.md",
  "targetAnchor": "6-lịch-sử-quyết-định",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. The whole heading unit docs/specs/observe.md#6-lịch-sử-quyết-định (source lines 76-76) is carried at docs/platform/observe/decisions/observe-component-architecture.md#6-lịch-sử-quyết-định (candidate lines 24-24). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "2395711f7f1021e4ef362412f26aea6abf63869205a3b89e8ccc19f5376a0227",
  "targetAncestry": [
    "Added in candidate: observe component architecture"
  ]
}
```

### Full source shown text

```text
## 6. Lịch sử quyết định
```

### Full target shown text

```text
## 6. Lịch sử quyết định
```

## claim_2d3869be7e1c9fa2195930f46d9d6f3f

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/observe.md#d-adr0037-observe-component-architecture; lines 78–78; ancestry ["Observe Component Specification","6. Lịch sử quyết định"].
Target: docs/platform/observe/decisions/observe-component-architecture.md#d-adr0037-observe-component-architecture; ancestry ["Added in candidate: observe component architecture","6. Lịch sử quyết định"].
Source digest: 0041148c6d694b756eba9bb8783d2168ae4a3e8081194988a65d55612843366b
Target digest: 0041148c6d694b756eba9bb8783d2168ae4a3e8081194988a65d55612843366b
Shown source SHA256: 54152e0a17126f933d2236c2ef2f8fca151e1eb3cc7cc5c79e607fb681011c3c
Shown target SHA256: 54152e0a17126f933d2236c2ef2f8fca151e1eb3cc7cc5c79e607fb681011c3c

### Complete proposed decision

```json
{
  "claimId": "claim_2d3869be7e1c9fa2195930f46d9d6f3f",
  "sourceUnitDigest": "0041148c6d694b756eba9bb8783d2168ae4a3e8081194988a65d55612843366b",
  "targetOwner": "docs/platform/observe/decisions/observe-component-architecture.md",
  "targetAnchor": "d-adr0037-observe-component-architecture",
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole heading unit docs/specs/observe.md#d-adr0037-observe-component-architecture (source lines 78-78) is carried at docs/platform/observe/decisions/observe-component-architecture.md#d-adr0037-observe-component-architecture (candidate lines 26-26). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0041148c6d694b756eba9bb8783d2168ae4a3e8081194988a65d55612843366b",
  "targetAncestry": [
    "Added in candidate: observe component architecture",
    "6. Lịch sử quyết định"
  ]
}
```

### Full source shown text

```text
### D-ADR0037 (Observe Component Architecture)

- **Một component Observe**: Gom toàn bộ đo lường (`fgos metrics`) và friction (`fgos friction`) vào một crate Rust duy nhất (`packages/observe/rust`).
- **Subject tầng nền**: Subject đo lường là các thực thể tầng nền (`run`, `session`, `executor`, `case`); Work Item là source quan sát tuỳ chọn, không phải trung tâm đo lường.
- **Friction rời Work**: Lưu trữ friction tách rời khỏi `work.friction` trong Work event store; chuyển thành append-only shards trong `.fgos/observe/friction/<writerId>.jsonl`.
- **Writer Rust duy nhất**: Mọi component ghi friction hoặc metrics đều gọi qua native CLI của Rust host. Recursion guard chỉ còn cho `legacy-cli`.
- **`nativeOnly`**: Các verb `metrics` và `friction` được đánh dấu `nativeOnly: true` trong command registry, Node legacy CLI từ chối trực tiếp với exit 4.
- **Không backward compat**: Supersede luật "Preserve current commands" của `node-to-rust-migration.md` đối với `check/faults/dispatch-report/evolve`; chuyển hẳn sang `metrics` và `friction`.
- **Single path**: Một con đường thực thi duy nhất qua host router native.
- **Store Observe tracked, shard theo writer**: Lưu trữ dưới `.fgos/observe/<store>/<writerId>.jsonl` được git theo dõi; migration theo cursor `(src, seq)`.
- **Kênh phụ best-effort cho friction**: Ghi friction là kênh phụ không chặn luồng chính (lỗi ghi được ghi nhận thành `friction-write-failed` trong `invocation-faults`). Resolve host theo thứ tự ưu tiên: env (`FGOS_HOST_BIN`) → release manifest (`.fgos/installation`) → fault.
- **Work ngừng đọc friction**: Work không đọc friction; CLI friction của Observe không join state của Work.
- **Bỏ `learning.frictions`**: Bỏ `learning.frictions` khỏi event đóng item và bỏ mục `frictions` khỏi output của `list` / `show`.
- **Map output `check` và `evolve`**: Outcomes, settlement, learning, nag → `metrics outcomes`; entropy → `metrics entropy`; `evolve --submit` → `friction rank` + `fgos submit`.
```

### Full target shown text

```text
### D-ADR0037 (Observe Component Architecture)

- **Một component Observe**: Gom toàn bộ đo lường (`fgos metrics`) và friction (`fgos friction`) vào một crate Rust duy nhất (`packages/observe/rust`).
- **Subject tầng nền**: Subject đo lường là các thực thể tầng nền (`run`, `session`, `executor`, `case`); Work Item là source quan sát tuỳ chọn, không phải trung tâm đo lường.
- **Friction rời Work**: Lưu trữ friction tách rời khỏi `work.friction` trong Work event store; chuyển thành append-only shards trong `.fgos/observe/friction/<writerId>.jsonl`.
- **Writer Rust duy nhất**: Mọi component ghi friction hoặc metrics đều gọi qua native CLI của Rust host. Recursion guard chỉ còn cho `legacy-cli`.
- **`nativeOnly`**: Các verb `metrics` và `friction` được đánh dấu `nativeOnly: true` trong command registry, Node legacy CLI từ chối trực tiếp với exit 4.
- **Không backward compat**: Supersede luật "Preserve current commands" của `node-to-rust-migration.md` đối với `check/faults/dispatch-report/evolve`; chuyển hẳn sang `metrics` và `friction`.
- **Single path**: Một con đường thực thi duy nhất qua host router native.
- **Store Observe tracked, shard theo writer**: Lưu trữ dưới `.fgos/observe/<store>/<writerId>.jsonl` được git theo dõi; migration theo cursor `(src, seq)`.
- **Kênh phụ best-effort cho friction**: Ghi friction là kênh phụ không chặn luồng chính (lỗi ghi được ghi nhận thành `friction-write-failed` trong `invocation-faults`). Resolve host theo thứ tự ưu tiên: env (`FGOS_HOST_BIN`) → release manifest (`.fgos/installation`) → fault.
- **Work ngừng đọc friction**: Work không đọc friction; CLI friction của Observe không join state của Work.
- **Bỏ `learning.frictions`**: Bỏ `learning.frictions` khỏi event đóng item và bỏ mục `frictions` khỏi output của `list` / `show`.
- **Map output `check` và `evolve`**: Outcomes, settlement, learning, nag → `metrics outcomes`; entropy → `metrics entropy`; `evolve --submit` → `friction rank` + `fgos submit`.
```

## claim_212faf152b045009bd39be195155b339

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/observe.md#unheaded-block-12; lines 80–91; ancestry ["Observe Component Specification","6. Lịch sử quyết định","D-ADR0037 (Observe Component Architecture)"].
Target: docs/platform/observe/decisions/observe-component-architecture.md#unheaded-block-3; ancestry ["Added in candidate: observe component architecture","6. Lịch sử quyết định","D-ADR0037 (Observe Component Architecture)"].
Source digest: 04b6bf704305aac6e7a7d28587982de8005ac5684ec8cc4d377f20308151b7cc
Target digest: 04b6bf704305aac6e7a7d28587982de8005ac5684ec8cc4d377f20308151b7cc
Shown source SHA256: 04b6bf704305aac6e7a7d28587982de8005ac5684ec8cc4d377f20308151b7cc
Shown target SHA256: 04b6bf704305aac6e7a7d28587982de8005ac5684ec8cc4d377f20308151b7cc

### Complete proposed decision

```json
{
  "claimId": "claim_212faf152b045009bd39be195155b339",
  "sourceUnitDigest": "04b6bf704305aac6e7a7d28587982de8005ac5684ec8cc4d377f20308151b7cc",
  "targetOwner": "docs/platform/observe/decisions/observe-component-architecture.md",
  "targetAnchor": "unheaded-block-3",
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/observe.md#unheaded-block-12 (source lines 80-91) is carried at docs/platform/observe/decisions/observe-component-architecture.md#unheaded-block-3 (candidate lines 28-39). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/observe.md verbatim in docs/platform/observe/spec.md, docs/platform/observe/decisions/observe-component-architecture.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "04b6bf704305aac6e7a7d28587982de8005ac5684ec8cc4d377f20308151b7cc",
  "targetAncestry": [
    "Added in candidate: observe component architecture",
    "6. Lịch sử quyết định",
    "D-ADR0037 (Observe Component Architecture)"
  ]
}
```

### Full source shown text

```text
- **Một component Observe**: Gom toàn bộ đo lường (`fgos metrics`) và friction (`fgos friction`) vào một crate Rust duy nhất (`packages/observe/rust`).
- **Subject tầng nền**: Subject đo lường là các thực thể tầng nền (`run`, `session`, `executor`, `case`); Work Item là source quan sát tuỳ chọn, không phải trung tâm đo lường.
- **Friction rời Work**: Lưu trữ friction tách rời khỏi `work.friction` trong Work event store; chuyển thành append-only shards trong `.fgos/observe/friction/<writerId>.jsonl`.
- **Writer Rust duy nhất**: Mọi component ghi friction hoặc metrics đều gọi qua native CLI của Rust host. Recursion guard chỉ còn cho `legacy-cli`.
- **`nativeOnly`**: Các verb `metrics` và `friction` được đánh dấu `nativeOnly: true` trong command registry, Node legacy CLI từ chối trực tiếp với exit 4.
- **Không backward compat**: Supersede luật "Preserve current commands" của `node-to-rust-migration.md` đối với `check/faults/dispatch-report/evolve`; chuyển hẳn sang `metrics` và `friction`.
- **Single path**: Một con đường thực thi duy nhất qua host router native.
- **Store Observe tracked, shard theo writer**: Lưu trữ dưới `.fgos/observe/<store>/<writerId>.jsonl` được git theo dõi; migration theo cursor `(src, seq)`.
- **Kênh phụ best-effort cho friction**: Ghi friction là kênh phụ không chặn luồng chính (lỗi ghi được ghi nhận thành `friction-write-failed` trong `invocation-faults`). Resolve host theo thứ tự ưu tiên: env (`FGOS_HOST_BIN`) → release manifest (`.fgos/installation`) → fault.
- **Work ngừng đọc friction**: Work không đọc friction; CLI friction của Observe không join state của Work.
- **Bỏ `learning.frictions`**: Bỏ `learning.frictions` khỏi event đóng item và bỏ mục `frictions` khỏi output của `list` / `show`.
- **Map output `check` và `evolve`**: Outcomes, settlement, learning, nag → `metrics outcomes`; entropy → `metrics entropy`; `evolve --submit` → `friction rank` + `fgos submit`.
```

### Full target shown text

```text
- **Một component Observe**: Gom toàn bộ đo lường (`fgos metrics`) và friction (`fgos friction`) vào một crate Rust duy nhất (`packages/observe/rust`).
- **Subject tầng nền**: Subject đo lường là các thực thể tầng nền (`run`, `session`, `executor`, `case`); Work Item là source quan sát tuỳ chọn, không phải trung tâm đo lường.
- **Friction rời Work**: Lưu trữ friction tách rời khỏi `work.friction` trong Work event store; chuyển thành append-only shards trong `.fgos/observe/friction/<writerId>.jsonl`.
- **Writer Rust duy nhất**: Mọi component ghi friction hoặc metrics đều gọi qua native CLI của Rust host. Recursion guard chỉ còn cho `legacy-cli`.
- **`nativeOnly`**: Các verb `metrics` và `friction` được đánh dấu `nativeOnly: true` trong command registry, Node legacy CLI từ chối trực tiếp với exit 4.
- **Không backward compat**: Supersede luật "Preserve current commands" của `node-to-rust-migration.md` đối với `check/faults/dispatch-report/evolve`; chuyển hẳn sang `metrics` và `friction`.
- **Single path**: Một con đường thực thi duy nhất qua host router native.
- **Store Observe tracked, shard theo writer**: Lưu trữ dưới `.fgos/observe/<store>/<writerId>.jsonl` được git theo dõi; migration theo cursor `(src, seq)`.
- **Kênh phụ best-effort cho friction**: Ghi friction là kênh phụ không chặn luồng chính (lỗi ghi được ghi nhận thành `friction-write-failed` trong `invocation-faults`). Resolve host theo thứ tự ưu tiên: env (`FGOS_HOST_BIN`) → release manifest (`.fgos/installation`) → fault.
- **Work ngừng đọc friction**: Work không đọc friction; CLI friction của Observe không join state của Work.
- **Bỏ `learning.frictions`**: Bỏ `learning.frictions` khỏi event đóng item và bỏ mục `frictions` khỏi output của `list` / `show`.
- **Map output `check` và `evolve`**: Outcomes, settlement, learning, nag → `metrics outcomes`; entropy → `metrics entropy`; `evolve --submit` → `friction rank` + `fgos submit`.
```
