# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/30-states-and-errors.md
Part 1/1; entries: **30**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 10/17 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_1528d6ae51b240a56a0e797f2791de5f",
      "claim_e0c32c0638e0318ea1837d3ba029b40a",
      "claim_a722999eb69d1c9d24447a86e90fcfd8",
      "claim_4c11f5b519993b7e09de5246b7233dff",
      "claim_808f0e82855544f8d09f94e674e44287",
      "claim_d3d16b8feb8e452e15fe031621dd4629",
      "claim_e3719cba1ffabfc2412cded7ca37041a",
      "claim_4bcebe987cb103cc6f08c0c5c0be4943",
      "claim_caad47154bc6946185ab1956c2af2435",
      "claim_4c58ddfb5b033b778fa302b22391743f",
      "claim_c8a3f574ec2210840cc738016305180b",
      "claim_aecbc3babae704d462203a431851ec94",
      "claim_01ca3b8e35f5ed270cfdcdfdc91ff7ec"
    ],
    "Weak-exact": [
      "claim_a0260deef6a9fe15f8b1d5315f7e7b21",
      "claim_7939c36c210900dcbd2b55308799eba6",
      "claim_e98bbb1eea67b538ff31ccb71ad227f4",
      "claim_75cbd593e6d2b5d54941c39d4920196a",
      "claim_d6a08a3e71e1d6aa539deeccaf9ca18f",
      "claim_f2dbfad6908d2219d0e43956ad5ead5d",
      "claim_fd8305adf7410dcf7029089190691d12",
      "claim_dc81e768a064ae9f503bfbfbeea836f5",
      "claim_c005b55a9dc04047098ac2c361e2461f",
      "claim_d39b9def7f622ee7b7cef995f2dc1bdd",
      "claim_d460dc5b3bb56788602326b5e40e00cd",
      "claim_0c4304f431d9fd610caa555798eb2915",
      "claim_a857fae6b9965edc23907b935497cccd",
      "claim_d8d0977847458c69c1d43b18e460f0b0",
      "claim_24a94954928e6613710b635d9db3c23b",
      "claim_44161b2503defd6c748dea08cb5223f7"
    ],
    "Judgment": [
      "claim_8f1b4d60296f2d4ba2fa501e030aaeb1"
    ]
  },
  "unequalDigestPairs": [
    "claim_8f1b4d60296f2d4ba2fa501e030aaeb1"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_8f1b4d60296f2d4ba2fa501e030aaeb1"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_8f1b4d60296f2d4ba2fa501e030aaeb1

Class: Judgment; mandatory deep: true.
Source: docs/ui-spec/30-states-and-errors.md#states-and-errors; lines 1–1; ancestry [].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#states-and-errors; ancestry [].
Source digest: 5e98ae632d45da0c00e6e338986e01304433532362d19012cfb07ef6184fff84
Target digest: 0c35ba3ca89c1e5e53c07a000a90460e1b3872d22f7cbfbc0d74acbdeb96ec0a
Shown source SHA256: 200bee43de77df51b4b3a931b1cb50b6a66c536e59f4ded6cf88f98f96ff1387
Shown target SHA256: ae205747a6c9b8035d61673c4c50693d738f92faf685d78010b236809c44853d

### Complete proposed decision

```json
{
  "claimId": "claim_8f1b4d60296f2d4ba2fa501e030aaeb1",
  "sourceUnitDigest": "5e98ae632d45da0c00e6e338986e01304433532362d19012cfb07ef6184fff84",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "states-and-errors",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/ui-spec/30-states-and-errors.md#states-and-errors (source lines 1-1) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#states-and-errors (candidate lines 1-1). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0c35ba3ca89c1e5e53c07a000a90460e1b3872d22f7cbfbc0d74acbdeb96ec0a",
  "targetAncestry": []
}
```

### Full source shown text

```text
# States and errors

Shared state and error catalogue. Surfaces reference these by ID in prose.
```

### Full target shown text

````text
# States and errors

```txt
Document type: Contract
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/30-states-and-errors.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/ui-spec/30-states-and-errors.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.


Shared state and error catalogue. Surfaces reference these by ID in prose.
````

## claim_1528d6ae51b240a56a0e797f2791de5f

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#unheaded-block-1; lines 3–3; ancestry ["States and errors"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-3; ancestry ["States and errors"].
Source digest: 111c5d3203513c70223511db3fe0713d6dab6173324ea10e21e75937087341b8
Target digest: 111c5d3203513c70223511db3fe0713d6dab6173324ea10e21e75937087341b8
Shown source SHA256: 111c5d3203513c70223511db3fe0713d6dab6173324ea10e21e75937087341b8
Shown target SHA256: 111c5d3203513c70223511db3fe0713d6dab6173324ea10e21e75937087341b8

### Complete proposed decision

```json
{
  "claimId": "claim_1528d6ae51b240a56a0e797f2791de5f",
  "sourceUnitDigest": "111c5d3203513c70223511db3fe0713d6dab6173324ea10e21e75937087341b8",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "unheaded-block-3",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/30-states-and-errors.md#unheaded-block-1 (source lines 3-3) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-3 (candidate lines 25-25). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "111c5d3203513c70223511db3fe0713d6dab6173324ea10e21e75937087341b8",
  "targetAncestry": [
    "States and errors"
  ]
}
```

### Full source shown text

```text
Shared state and error catalogue. Surfaces reference these by ID in prose.
```

### Full target shown text

```text
Shared state and error catalogue. Surfaces reference these by ID in prose.
```

## claim_a0260deef6a9fe15f8b1d5315f7e7b21

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#states; lines 5–5; ancestry ["States and errors"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#states; ancestry ["States and errors"].
Source digest: ff2c6af1e1d2149fe2343d5550f9ea3e19ed5f23b6a42b30fe85b182b4d48703
Target digest: ff2c6af1e1d2149fe2343d5550f9ea3e19ed5f23b6a42b30fe85b182b4d48703
Shown source SHA256: 5b2d4990d5688b90750a0cdf27c2365bd42944ce90703e0c17e327f5ce55cd42
Shown target SHA256: 5b2d4990d5688b90750a0cdf27c2365bd42944ce90703e0c17e327f5ce55cd42

### Complete proposed decision

```json
{
  "claimId": "claim_a0260deef6a9fe15f8b1d5315f7e7b21",
  "sourceUnitDigest": "ff2c6af1e1d2149fe2343d5550f9ea3e19ed5f23b6a42b30fe85b182b4d48703",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "states",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/30-states-and-errors.md#states (source lines 5-5) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#states (candidate lines 27-27). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ff2c6af1e1d2149fe2343d5550f9ea3e19ed5f23b6a42b30fe85b182b4d48703",
  "targetAncestry": [
    "States and errors"
  ]
}
```

### Full source shown text

```text
## States
```

### Full target shown text

```text
## States
```

## claim_7939c36c210900dcbd2b55308799eba6

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#st-loading; lines 7–7; ancestry ["States and errors","States"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#st-loading; ancestry ["States and errors","States"].
Source digest: ea75f68b3235bf97831ce14092e89e9df3364fc722d97a02f88ad7e17a9cd65f
Target digest: ea75f68b3235bf97831ce14092e89e9df3364fc722d97a02f88ad7e17a9cd65f
Shown source SHA256: 3c365ad76d052bf485cd100eaa85126fe9a3be9febee64c1cb8e60a3d4f2a49a
Shown target SHA256: 3c365ad76d052bf485cd100eaa85126fe9a3be9febee64c1cb8e60a3d4f2a49a

### Complete proposed decision

```json
{
  "claimId": "claim_7939c36c210900dcbd2b55308799eba6",
  "sourceUnitDigest": "ea75f68b3235bf97831ce14092e89e9df3364fc722d97a02f88ad7e17a9cd65f",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "st-loading",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/30-states-and-errors.md#st-loading (source lines 7-7) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#st-loading (candidate lines 29-29). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ea75f68b3235bf97831ce14092e89e9df3364fc722d97a02f88ad7e17a9cd65f",
  "targetAncestry": [
    "States and errors",
    "States"
  ]
}
```

### Full source shown text

```text
### ST-LOADING
Data requested from the gateway, nothing to show yet. Skeleton rows keep
the layout stable so nothing jumps when data lands.
```

### Full target shown text

```text
### ST-LOADING
Data requested from the gateway, nothing to show yet. Skeleton rows keep
the layout stable so nothing jumps when data lands.
```

## claim_e0c32c0638e0318ea1837d3ba029b40a

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#unheaded-block-2; lines 8–9; ancestry ["States and errors","States","ST-LOADING"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-4; ancestry ["States and errors","States","ST-LOADING"].
Source digest: 5047b3cf3d85feddac09d65297fff638c47d665f45b69cc315b9df3df3ec2897
Target digest: 5047b3cf3d85feddac09d65297fff638c47d665f45b69cc315b9df3df3ec2897
Shown source SHA256: 5047b3cf3d85feddac09d65297fff638c47d665f45b69cc315b9df3df3ec2897
Shown target SHA256: 5047b3cf3d85feddac09d65297fff638c47d665f45b69cc315b9df3df3ec2897

### Complete proposed decision

```json
{
  "claimId": "claim_e0c32c0638e0318ea1837d3ba029b40a",
  "sourceUnitDigest": "5047b3cf3d85feddac09d65297fff638c47d665f45b69cc315b9df3df3ec2897",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/30-states-and-errors.md#unheaded-block-2 (source lines 8-9) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-4 (candidate lines 30-31). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "5047b3cf3d85feddac09d65297fff638c47d665f45b69cc315b9df3df3ec2897",
  "targetAncestry": [
    "States and errors",
    "States",
    "ST-LOADING"
  ]
}
```

### Full source shown text

```text
Data requested from the gateway, nothing to show yet. Skeleton rows keep
the layout stable so nothing jumps when data lands.
```

### Full target shown text

```text
Data requested from the gateway, nothing to show yet. Skeleton rows keep
the layout stable so nothing jumps when data lands.
```

## claim_e98bbb1eea67b538ff31ccb71ad227f4

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#st-ready; lines 11–11; ancestry ["States and errors","States"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#st-ready; ancestry ["States and errors","States"].
Source digest: dfe3b0914cca94ee06e5d92e2e3992a39f4cee99d7589053054dbe08d55ed3ed
Target digest: dfe3b0914cca94ee06e5d92e2e3992a39f4cee99d7589053054dbe08d55ed3ed
Shown source SHA256: 118783451f6c8eb31a40a0b296b45739b73ca6d1a62b25176503b591fb79e661
Shown target SHA256: 118783451f6c8eb31a40a0b296b45739b73ca6d1a62b25176503b591fb79e661

### Complete proposed decision

```json
{
  "claimId": "claim_e98bbb1eea67b538ff31ccb71ad227f4",
  "sourceUnitDigest": "dfe3b0914cca94ee06e5d92e2e3992a39f4cee99d7589053054dbe08d55ed3ed",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "st-ready",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/30-states-and-errors.md#st-ready (source lines 11-11) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#st-ready (candidate lines 33-33). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "dfe3b0914cca94ee06e5d92e2e3992a39f4cee99d7589053054dbe08d55ed3ed",
  "targetAncestry": [
    "States and errors",
    "States"
  ]
}
```

### Full source shown text

```text
### ST-READY
Data loaded and current.
```

### Full target shown text

```text
### ST-READY
Data loaded and current.
```

## claim_75cbd593e6d2b5d54941c39d4920196a

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#unheaded-block-3; lines 12–12; ancestry ["States and errors","States","ST-READY"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-5; ancestry ["States and errors","States","ST-READY"].
Source digest: 0a92bd1e7ea79059af94d1df75208558e095e3dd4302138891c5f267f197f2d7
Target digest: 0a92bd1e7ea79059af94d1df75208558e095e3dd4302138891c5f267f197f2d7
Shown source SHA256: 0a92bd1e7ea79059af94d1df75208558e095e3dd4302138891c5f267f197f2d7
Shown target SHA256: 0a92bd1e7ea79059af94d1df75208558e095e3dd4302138891c5f267f197f2d7

### Complete proposed decision

```json
{
  "claimId": "claim_75cbd593e6d2b5d54941c39d4920196a",
  "sourceUnitDigest": "0a92bd1e7ea79059af94d1df75208558e095e3dd4302138891c5f267f197f2d7",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole unheaded-block unit docs/ui-spec/30-states-and-errors.md#unheaded-block-3 (source lines 12-12) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-5 (candidate lines 34-34). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0a92bd1e7ea79059af94d1df75208558e095e3dd4302138891c5f267f197f2d7",
  "targetAncestry": [
    "States and errors",
    "States",
    "ST-READY"
  ]
}
```

### Full source shown text

```text
Data loaded and current.
```

### Full target shown text

```text
Data loaded and current.
```

## claim_d6a08a3e71e1d6aa539deeccaf9ca18f

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#st-empty-board; lines 14–14; ancestry ["States and errors","States"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#st-empty-board; ancestry ["States and errors","States"].
Source digest: 58968fcfb8f6047deaeb0ef49c6679e6742bbce12ef7506d7232a529783ca68b
Target digest: 58968fcfb8f6047deaeb0ef49c6679e6742bbce12ef7506d7232a529783ca68b
Shown source SHA256: 062ee8c5f5ea66c3535adca2ab453372f37fd70614f2060b1a0b73d3cd64f4f9
Shown target SHA256: 062ee8c5f5ea66c3535adca2ab453372f37fd70614f2060b1a0b73d3cd64f4f9

### Complete proposed decision

```json
{
  "claimId": "claim_d6a08a3e71e1d6aa539deeccaf9ca18f",
  "sourceUnitDigest": "58968fcfb8f6047deaeb0ef49c6679e6742bbce12ef7506d7232a529783ca68b",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "st-empty-board",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/30-states-and-errors.md#st-empty-board (source lines 14-14) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#st-empty-board (candidate lines 36-36). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "58968fcfb8f6047deaeb0ef49c6679e6742bbce12ef7506d7232a529783ca68b",
  "targetAncestry": [
    "States and errors",
    "States"
  ]
}
```

### Full source shown text

```text
### ST-EMPTY-BOARD
Signed in, gateway reachable, but the project has no work items at all.
Distinct from ST-EMPTY-FILTER: nothing exists, versus nothing matches.
```

### Full target shown text

```text
### ST-EMPTY-BOARD
Signed in, gateway reachable, but the project has no work items at all.
Distinct from ST-EMPTY-FILTER: nothing exists, versus nothing matches.
```

## claim_a722999eb69d1c9d24447a86e90fcfd8

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#unheaded-block-4; lines 15–16; ancestry ["States and errors","States","ST-EMPTY-BOARD"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-6; ancestry ["States and errors","States","ST-EMPTY-BOARD"].
Source digest: 8d86adebaee9f38520cddd95e1244a8decea21908e574610b40ded1d4e2697c0
Target digest: 8d86adebaee9f38520cddd95e1244a8decea21908e574610b40ded1d4e2697c0
Shown source SHA256: 8d86adebaee9f38520cddd95e1244a8decea21908e574610b40ded1d4e2697c0
Shown target SHA256: 8d86adebaee9f38520cddd95e1244a8decea21908e574610b40ded1d4e2697c0

### Complete proposed decision

```json
{
  "claimId": "claim_a722999eb69d1c9d24447a86e90fcfd8",
  "sourceUnitDigest": "8d86adebaee9f38520cddd95e1244a8decea21908e574610b40ded1d4e2697c0",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/30-states-and-errors.md#unheaded-block-4 (source lines 15-16) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-6 (candidate lines 37-38). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "8d86adebaee9f38520cddd95e1244a8decea21908e574610b40ded1d4e2697c0",
  "targetAncestry": [
    "States and errors",
    "States",
    "ST-EMPTY-BOARD"
  ]
}
```

### Full source shown text

```text
Signed in, gateway reachable, but the project has no work items at all.
Distinct from ST-EMPTY-FILTER: nothing exists, versus nothing matches.
```

### Full target shown text

```text
Signed in, gateway reachable, but the project has no work items at all.
Distinct from ST-EMPTY-FILTER: nothing exists, versus nothing matches.
```

## claim_f2dbfad6908d2219d0e43956ad5ead5d

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#st-empty-filter; lines 18–18; ancestry ["States and errors","States"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#st-empty-filter; ancestry ["States and errors","States"].
Source digest: ae162b352c1077f2393891f5aa92706ed491476734ab956c889d1b034f4840f8
Target digest: ae162b352c1077f2393891f5aa92706ed491476734ab956c889d1b034f4840f8
Shown source SHA256: 8a3be9b997a676d118802ed1fa4a988cdd7a14ef88ca43bad2cde5012887a1d4
Shown target SHA256: 8a3be9b997a676d118802ed1fa4a988cdd7a14ef88ca43bad2cde5012887a1d4

### Complete proposed decision

```json
{
  "claimId": "claim_f2dbfad6908d2219d0e43956ad5ead5d",
  "sourceUnitDigest": "ae162b352c1077f2393891f5aa92706ed491476734ab956c889d1b034f4840f8",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "st-empty-filter",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/30-states-and-errors.md#st-empty-filter (source lines 18-18) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#st-empty-filter (candidate lines 40-40). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ae162b352c1077f2393891f5aa92706ed491476734ab956c889d1b034f4840f8",
  "targetAncestry": [
    "States and errors",
    "States"
  ]
}
```

### Full source shown text

```text
### ST-EMPTY-FILTER
Items exist, but the active filter/grouping matches none. Always shows
what the active filter is and offers to clear it — a person must never be
left guessing why the board looks empty.
```

### Full target shown text

```text
### ST-EMPTY-FILTER
Items exist, but the active filter/grouping matches none. Always shows
what the active filter is and offers to clear it — a person must never be
left guessing why the board looks empty.
```

## claim_4c11f5b519993b7e09de5246b7233dff

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#unheaded-block-5; lines 19–21; ancestry ["States and errors","States","ST-EMPTY-FILTER"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-7; ancestry ["States and errors","States","ST-EMPTY-FILTER"].
Source digest: dc78b582477b8dbf10e9281aa4de123c7bff4bcf2345a79afc7c73a4c988f60f
Target digest: dc78b582477b8dbf10e9281aa4de123c7bff4bcf2345a79afc7c73a4c988f60f
Shown source SHA256: dc78b582477b8dbf10e9281aa4de123c7bff4bcf2345a79afc7c73a4c988f60f
Shown target SHA256: dc78b582477b8dbf10e9281aa4de123c7bff4bcf2345a79afc7c73a4c988f60f

### Complete proposed decision

```json
{
  "claimId": "claim_4c11f5b519993b7e09de5246b7233dff",
  "sourceUnitDigest": "dc78b582477b8dbf10e9281aa4de123c7bff4bcf2345a79afc7c73a4c988f60f",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/30-states-and-errors.md#unheaded-block-5 (source lines 19-21) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-7 (candidate lines 41-43). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "dc78b582477b8dbf10e9281aa4de123c7bff4bcf2345a79afc7c73a4c988f60f",
  "targetAncestry": [
    "States and errors",
    "States",
    "ST-EMPTY-FILTER"
  ]
}
```

### Full source shown text

```text
Items exist, but the active filter/grouping matches none. Always shows
what the active filter is and offers to clear it — a person must never be
left guessing why the board looks empty.
```

### Full target shown text

```text
Items exist, but the active filter/grouping matches none. Always shows
what the active filter is and offers to clear it — a person must never be
left guessing why the board looks empty.
```

## claim_fd8305adf7410dcf7029089190691d12

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#st-empty-questions; lines 23–23; ancestry ["States and errors","States"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#st-empty-questions; ancestry ["States and errors","States"].
Source digest: 8075b081e44469488c63519e5100ecb51ba2913decc2229c48bef21968c8352f
Target digest: 8075b081e44469488c63519e5100ecb51ba2913decc2229c48bef21968c8352f
Shown source SHA256: f1e9fd35220037c8dfce7830aad03fa23693d694ccf9beab750622bf5daed0ab
Shown target SHA256: f1e9fd35220037c8dfce7830aad03fa23693d694ccf9beab750622bf5daed0ab

### Complete proposed decision

```json
{
  "claimId": "claim_fd8305adf7410dcf7029089190691d12",
  "sourceUnitDigest": "8075b081e44469488c63519e5100ecb51ba2913decc2229c48bef21968c8352f",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "st-empty-questions",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/30-states-and-errors.md#st-empty-questions (source lines 23-23) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#st-empty-questions (candidate lines 45-45). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "8075b081e44469488c63519e5100ecb51ba2913decc2229c48bef21968c8352f",
  "targetAncestry": [
    "States and errors",
    "States"
  ]
}
```

### Full source shown text

```text
### ST-EMPTY-QUESTIONS
Nothing is waiting on a person. This is the good state and reads as such,
not as an error.
```

### Full target shown text

```text
### ST-EMPTY-QUESTIONS
Nothing is waiting on a person. This is the good state and reads as such,
not as an error.
```

## claim_808f0e82855544f8d09f94e674e44287

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#unheaded-block-6; lines 24–25; ancestry ["States and errors","States","ST-EMPTY-QUESTIONS"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-8; ancestry ["States and errors","States","ST-EMPTY-QUESTIONS"].
Source digest: 89f5c24155ba871213196dbc7292ddd6f1592ffd1cdf3ddafceb23d8f7939638
Target digest: 89f5c24155ba871213196dbc7292ddd6f1592ffd1cdf3ddafceb23d8f7939638
Shown source SHA256: 89f5c24155ba871213196dbc7292ddd6f1592ffd1cdf3ddafceb23d8f7939638
Shown target SHA256: 89f5c24155ba871213196dbc7292ddd6f1592ffd1cdf3ddafceb23d8f7939638

### Complete proposed decision

```json
{
  "claimId": "claim_808f0e82855544f8d09f94e674e44287",
  "sourceUnitDigest": "89f5c24155ba871213196dbc7292ddd6f1592ffd1cdf3ddafceb23d8f7939638",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/30-states-and-errors.md#unheaded-block-6 (source lines 24-25) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-8 (candidate lines 46-47). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "89f5c24155ba871213196dbc7292ddd6f1592ffd1cdf3ddafceb23d8f7939638",
  "targetAncestry": [
    "States and errors",
    "States",
    "ST-EMPTY-QUESTIONS"
  ]
}
```

### Full source shown text

```text
Nothing is waiting on a person. This is the good state and reads as such,
not as an error.
```

### Full target shown text

```text
Nothing is waiting on a person. This is the good state and reads as such,
not as an error.
```

## claim_dc81e768a064ae9f503bfbfbeea836f5

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#st-never-parked; lines 27–27; ancestry ["States and errors","States"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#st-never-parked; ancestry ["States and errors","States"].
Source digest: 0b6adf350411162247a40a74d7c82cf198397a12ed9f21e518229ee6eb88b641
Target digest: 0b6adf350411162247a40a74d7c82cf198397a12ed9f21e518229ee6eb88b641
Shown source SHA256: f36b37071e3c35c7e500fa92f5ff79ace145c7c1816026c5e7099d2febffcde0
Shown target SHA256: f36b37071e3c35c7e500fa92f5ff79ace145c7c1816026c5e7099d2febffcde0

### Complete proposed decision

```json
{
  "claimId": "claim_dc81e768a064ae9f503bfbfbeea836f5",
  "sourceUnitDigest": "0b6adf350411162247a40a74d7c82cf198397a12ed9f21e518229ee6eb88b641",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "st-never-parked",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/30-states-and-errors.md#st-never-parked (source lines 27-27) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#st-never-parked (candidate lines 49-49). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0b6adf350411162247a40a74d7c82cf198397a12ed9f21e518229ee6eb88b641",
  "targetAncestry": [
    "States and errors",
    "States"
  ]
}
```

### Full source shown text

```text
### ST-NEVER-PARKED
A task detail whose item has never been parked. Its question/answer
timeline is legitimately empty — normal, not an error
(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled).
```

### Full target shown text

```text
### ST-NEVER-PARKED
A task detail whose item has never been parked. Its question/answer
timeline is legitimately empty — normal, not an error
(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled).
```

## claim_d3d16b8feb8e452e15fe031621dd4629

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#unheaded-block-7; lines 28–30; ancestry ["States and errors","States","ST-NEVER-PARKED"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-9; ancestry ["States and errors","States","ST-NEVER-PARKED"].
Source digest: 7c91a431b7eb89f26d1e8c10cc211b4528c38c3eb4cc72af2e54ab1c31368c51
Target digest: 7c91a431b7eb89f26d1e8c10cc211b4528c38c3eb4cc72af2e54ab1c31368c51
Shown source SHA256: 7c91a431b7eb89f26d1e8c10cc211b4528c38c3eb4cc72af2e54ab1c31368c51
Shown target SHA256: 7c91a431b7eb89f26d1e8c10cc211b4528c38c3eb4cc72af2e54ab1c31368c51

### Complete proposed decision

```json
{
  "claimId": "claim_d3d16b8feb8e452e15fe031621dd4629",
  "sourceUnitDigest": "7c91a431b7eb89f26d1e8c10cc211b4528c38c3eb4cc72af2e54ab1c31368c51",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/30-states-and-errors.md#unheaded-block-7 (source lines 28-30) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-9 (candidate lines 50-52). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7c91a431b7eb89f26d1e8c10cc211b4528c38c3eb4cc72af2e54ab1c31368c51",
  "targetAncestry": [
    "States and errors",
    "States",
    "ST-NEVER-PARKED"
  ]
}
```

### Full source shown text

```text
A task detail whose item has never been parked. Its question/answer
timeline is legitimately empty — normal, not an error
(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled).
```

### Full target shown text

```text
A task detail whose item has never been parked. Its question/answer
timeline is legitimately empty — normal, not an error
(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled).
```

## claim_c005b55a9dc04047098ac2c361e2461f

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#st-narrative-missing; lines 32–32; ancestry ["States and errors","States"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#st-narrative-missing; ancestry ["States and errors","States"].
Source digest: 89d0de517b89fe90ee96cac870abfad16e3800f9efd843c077988f1b5792903c
Target digest: 89d0de517b89fe90ee96cac870abfad16e3800f9efd843c077988f1b5792903c
Shown source SHA256: 7d5bb54642888b2b0c8529db45435bcf07e8a4753905eb1457df0c01a7f32878
Shown target SHA256: 7d5bb54642888b2b0c8529db45435bcf07e8a4753905eb1457df0c01a7f32878

### Complete proposed decision

```json
{
  "claimId": "claim_c005b55a9dc04047098ac2c361e2461f",
  "sourceUnitDigest": "89d0de517b89fe90ee96cac870abfad16e3800f9efd843c077988f1b5792903c",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "st-narrative-missing",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/30-states-and-errors.md#st-narrative-missing (source lines 32-32) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#st-narrative-missing (candidate lines 54-54). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "89d0de517b89fe90ee96cac870abfad16e3800f9efd843c077988f1b5792903c",
  "targetAncestry": [
    "States and errors",
    "States"
  ]
}
```

### Full source shown text

```text
### ST-NARRATIVE-MISSING
A task detail whose item points at a documentation directory that does not
exist. The item still renders; the narrative region says the narrative is
missing and names the path it looked for.
```

### Full target shown text

```text
### ST-NARRATIVE-MISSING
A task detail whose item points at a documentation directory that does not
exist. The item still renders; the narrative region says the narrative is
missing and names the path it looked for.
```

## claim_e3719cba1ffabfc2412cded7ca37041a

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#unheaded-block-8; lines 33–35; ancestry ["States and errors","States","ST-NARRATIVE-MISSING"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-10; ancestry ["States and errors","States","ST-NARRATIVE-MISSING"].
Source digest: 45ee41b24f6371b6ae532ef8d3ccfe93ad3d9c86f0aff3eaeb685985c29e5088
Target digest: 45ee41b24f6371b6ae532ef8d3ccfe93ad3d9c86f0aff3eaeb685985c29e5088
Shown source SHA256: 45ee41b24f6371b6ae532ef8d3ccfe93ad3d9c86f0aff3eaeb685985c29e5088
Shown target SHA256: 45ee41b24f6371b6ae532ef8d3ccfe93ad3d9c86f0aff3eaeb685985c29e5088

### Complete proposed decision

```json
{
  "claimId": "claim_e3719cba1ffabfc2412cded7ca37041a",
  "sourceUnitDigest": "45ee41b24f6371b6ae532ef8d3ccfe93ad3d9c86f0aff3eaeb685985c29e5088",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "unheaded-block-10",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/30-states-and-errors.md#unheaded-block-8 (source lines 33-35) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-10 (candidate lines 55-57). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "45ee41b24f6371b6ae532ef8d3ccfe93ad3d9c86f0aff3eaeb685985c29e5088",
  "targetAncestry": [
    "States and errors",
    "States",
    "ST-NARRATIVE-MISSING"
  ]
}
```

### Full source shown text

```text
A task detail whose item points at a documentation directory that does not
exist. The item still renders; the narrative region says the narrative is
missing and names the path it looked for.
```

### Full target shown text

```text
A task detail whose item points at a documentation directory that does not
exist. The item still renders; the narrative region says the narrative is
missing and names the path it looked for.
```

## claim_d39b9def7f622ee7b7cef995f2dc1bdd

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#st-submitting; lines 37–37; ancestry ["States and errors","States"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#st-submitting; ancestry ["States and errors","States"].
Source digest: 99faed1a60ea75076416859f5322019bc12f40d97beda67cbbd3ac8108655950
Target digest: 99faed1a60ea75076416859f5322019bc12f40d97beda67cbbd3ac8108655950
Shown source SHA256: 55084bb0840b2386a40a84cdf3e72a63fafa70f9bbcddeb181a03c8d22d7d7ac
Shown target SHA256: 55084bb0840b2386a40a84cdf3e72a63fafa70f9bbcddeb181a03c8d22d7d7ac

### Complete proposed decision

```json
{
  "claimId": "claim_d39b9def7f622ee7b7cef995f2dc1bdd",
  "sourceUnitDigest": "99faed1a60ea75076416859f5322019bc12f40d97beda67cbbd3ac8108655950",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "st-submitting",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/30-states-and-errors.md#st-submitting (source lines 37-37) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#st-submitting (candidate lines 59-59). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "99faed1a60ea75076416859f5322019bc12f40d97beda67cbbd3ac8108655950",
  "targetAncestry": [
    "States and errors",
    "States"
  ]
}
```

### Full source shown text

```text
### ST-SUBMITTING
A write is in flight. The control that started it is the one that shows
the progress, and it is the only thing disabled — the rest of the screen
stays readable.
```

### Full target shown text

```text
### ST-SUBMITTING
A write is in flight. The control that started it is the one that shows
the progress, and it is the only thing disabled — the rest of the screen
stays readable.
```

## claim_4bcebe987cb103cc6f08c0c5c0be4943

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#unheaded-block-9; lines 38–40; ancestry ["States and errors","States","ST-SUBMITTING"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-11; ancestry ["States and errors","States","ST-SUBMITTING"].
Source digest: b2979dfc61dbc48cc1ff19423e5bf2494d7dad75757e24c02ad4ce0622d6a9d1
Target digest: b2979dfc61dbc48cc1ff19423e5bf2494d7dad75757e24c02ad4ce0622d6a9d1
Shown source SHA256: b2979dfc61dbc48cc1ff19423e5bf2494d7dad75757e24c02ad4ce0622d6a9d1
Shown target SHA256: b2979dfc61dbc48cc1ff19423e5bf2494d7dad75757e24c02ad4ce0622d6a9d1

### Complete proposed decision

```json
{
  "claimId": "claim_4bcebe987cb103cc6f08c0c5c0be4943",
  "sourceUnitDigest": "b2979dfc61dbc48cc1ff19423e5bf2494d7dad75757e24c02ad4ce0622d6a9d1",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "unheaded-block-11",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/30-states-and-errors.md#unheaded-block-9 (source lines 38-40) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-11 (candidate lines 60-62). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b2979dfc61dbc48cc1ff19423e5bf2494d7dad75757e24c02ad4ce0622d6a9d1",
  "targetAncestry": [
    "States and errors",
    "States",
    "ST-SUBMITTING"
  ]
}
```

### Full source shown text

```text
A write is in flight. The control that started it is the one that shows
the progress, and it is the only thing disabled — the rest of the screen
stays readable.
```

### Full target shown text

```text
A write is in flight. The control that started it is the one that shows
the progress, and it is the only thing disabled — the rest of the screen
stays readable.
```

## claim_d460dc5b3bb56788602326b5e40e00cd

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#st-disconnected; lines 42–42; ancestry ["States and errors","States"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#st-disconnected; ancestry ["States and errors","States"].
Source digest: 3596cc92d8b239eaaacf3856cc17f3ef4573aba3cbb4ecccb50e3194d77885fc
Target digest: 3596cc92d8b239eaaacf3856cc17f3ef4573aba3cbb4ecccb50e3194d77885fc
Shown source SHA256: 2c0ff23f56f553a4cfd6dbc0cf9f7e344a8458f698d2baa712efd76a8bf58163
Shown target SHA256: 2c0ff23f56f553a4cfd6dbc0cf9f7e344a8458f698d2baa712efd76a8bf58163

### Complete proposed decision

```json
{
  "claimId": "claim_d460dc5b3bb56788602326b5e40e00cd",
  "sourceUnitDigest": "3596cc92d8b239eaaacf3856cc17f3ef4573aba3cbb4ecccb50e3194d77885fc",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "st-disconnected",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/30-states-and-errors.md#st-disconnected (source lines 42-42) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#st-disconnected (candidate lines 64-64). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3596cc92d8b239eaaacf3856cc17f3ef4573aba3cbb4ecccb50e3194d77885fc",
  "targetAncestry": [
    "States and errors",
    "States"
  ]
}
```

### Full source shown text

```text
### ST-DISCONNECTED
The gateway is unreachable. Data already on screen is marked stale
explicitly, and a retry is offered. Never presented as current.
```

### Full target shown text

```text
### ST-DISCONNECTED
The gateway is unreachable. Data already on screen is marked stale
explicitly, and a retry is offered. Never presented as current.
```

## claim_caad47154bc6946185ab1956c2af2435

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#unheaded-block-10; lines 43–44; ancestry ["States and errors","States","ST-DISCONNECTED"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-12; ancestry ["States and errors","States","ST-DISCONNECTED"].
Source digest: dfb06d8668600a4799167db2c6b4ab381430dd5497815057cbf7b2460d41171f
Target digest: dfb06d8668600a4799167db2c6b4ab381430dd5497815057cbf7b2460d41171f
Shown source SHA256: dfb06d8668600a4799167db2c6b4ab381430dd5497815057cbf7b2460d41171f
Shown target SHA256: dfb06d8668600a4799167db2c6b4ab381430dd5497815057cbf7b2460d41171f

### Complete proposed decision

```json
{
  "claimId": "claim_caad47154bc6946185ab1956c2af2435",
  "sourceUnitDigest": "dfb06d8668600a4799167db2c6b4ab381430dd5497815057cbf7b2460d41171f",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "unheaded-block-12",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/30-states-and-errors.md#unheaded-block-10 (source lines 43-44) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-12 (candidate lines 65-66). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "dfb06d8668600a4799167db2c6b4ab381430dd5497815057cbf7b2460d41171f",
  "targetAncestry": [
    "States and errors",
    "States",
    "ST-DISCONNECTED"
  ]
}
```

### Full source shown text

```text
The gateway is unreachable. Data already on screen is marked stale
explicitly, and a retry is offered. Never presented as current.
```

### Full target shown text

```text
The gateway is unreachable. Data already on screen is marked stale
explicitly, and a retry is offered. Never presented as current.
```

## claim_0c4304f431d9fd610caa555798eb2915

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#errors; lines 46–46; ancestry ["States and errors"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#errors; ancestry ["States and errors"].
Source digest: 55da08e87735251cc53a5de0f65cc29d7966759757c74c6b3a5769420c8051b5
Target digest: 55da08e87735251cc53a5de0f65cc29d7966759757c74c6b3a5769420c8051b5
Shown source SHA256: 4445f6cf6cdfdbe33eed9850ba59f70a1c3b82555776868538db2f9210383c83
Shown target SHA256: 4445f6cf6cdfdbe33eed9850ba59f70a1c3b82555776868538db2f9210383c83

### Complete proposed decision

```json
{
  "claimId": "claim_0c4304f431d9fd610caa555798eb2915",
  "sourceUnitDigest": "55da08e87735251cc53a5de0f65cc29d7966759757c74c6b3a5769420c8051b5",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "errors",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/30-states-and-errors.md#errors (source lines 46-46) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#errors (candidate lines 68-68). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "55da08e87735251cc53a5de0f65cc29d7966759757c74c6b3a5769420c8051b5",
  "targetAncestry": [
    "States and errors"
  ]
}
```

### Full source shown text

```text
## Errors
```

### Full target shown text

```text
## Errors
```

## claim_a857fae6b9965edc23907b935497cccd

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#err-auth; lines 48–48; ancestry ["States and errors","Errors"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#err-auth; ancestry ["States and errors","Errors"].
Source digest: ffd6e164d4f4383b549b6d5d643586e955282bb3b293217144294e7280d30a18
Target digest: ffd6e164d4f4383b549b6d5d643586e955282bb3b293217144294e7280d30a18
Shown source SHA256: 8510739ee32e8c8e942ae37c4cd222d71e54784ad94f497703515652beba11b4
Shown target SHA256: 8510739ee32e8c8e942ae37c4cd222d71e54784ad94f497703515652beba11b4

### Complete proposed decision

```json
{
  "claimId": "claim_a857fae6b9965edc23907b935497cccd",
  "sourceUnitDigest": "ffd6e164d4f4383b549b6d5d643586e955282bb3b293217144294e7280d30a18",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "err-auth",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/30-states-and-errors.md#err-auth (source lines 48-48) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#err-auth (candidate lines 70-70). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ffd6e164d4f4383b549b6d5d643586e955282bb3b293217144294e7280d30a18",
  "targetAncestry": [
    "States and errors",
    "Errors"
  ]
}
```

### Full source shown text

```text
### ERR-AUTH
Sign-in failed. One message for every cause — wrong token, malformed
request, unknown route — per R3. Never distinguishes.
```

### Full target shown text

```text
### ERR-AUTH
Sign-in failed. One message for every cause — wrong token, malformed
request, unknown route — per R3. Never distinguishes.
```

## claim_4c58ddfb5b033b778fa302b22391743f

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#unheaded-block-11; lines 49–50; ancestry ["States and errors","Errors","ERR-AUTH"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-13; ancestry ["States and errors","Errors","ERR-AUTH"].
Source digest: ebf2a831837a1fd9c887a6b857f3d17d9c0ba3c00cad23f49b9b80af521b6a97
Target digest: ebf2a831837a1fd9c887a6b857f3d17d9c0ba3c00cad23f49b9b80af521b6a97
Shown source SHA256: ebf2a831837a1fd9c887a6b857f3d17d9c0ba3c00cad23f49b9b80af521b6a97
Shown target SHA256: ebf2a831837a1fd9c887a6b857f3d17d9c0ba3c00cad23f49b9b80af521b6a97

### Complete proposed decision

```json
{
  "claimId": "claim_4c58ddfb5b033b778fa302b22391743f",
  "sourceUnitDigest": "ebf2a831837a1fd9c887a6b857f3d17d9c0ba3c00cad23f49b9b80af521b6a97",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "unheaded-block-13",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/30-states-and-errors.md#unheaded-block-11 (source lines 49-50) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-13 (candidate lines 71-72). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ebf2a831837a1fd9c887a6b857f3d17d9c0ba3c00cad23f49b9b80af521b6a97",
  "targetAncestry": [
    "States and errors",
    "Errors",
    "ERR-AUTH"
  ]
}
```

### Full source shown text

```text
Sign-in failed. One message for every cause — wrong token, malformed
request, unknown route — per R3. Never distinguishes.
```

### Full target shown text

```text
Sign-in failed. One message for every cause — wrong token, malformed
request, unknown route — per R3. Never distinguishes.
```

## claim_d8d0977847458c69c1d43b18e460f0b0

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#err-write-refused; lines 52–52; ancestry ["States and errors","Errors"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#err-write-refused; ancestry ["States and errors","Errors"].
Source digest: c6cf6debd4a1921b0a49ed216d310f767cf090f4d98f814404aee95ef976ff76
Target digest: c6cf6debd4a1921b0a49ed216d310f767cf090f4d98f814404aee95ef976ff76
Shown source SHA256: 6efa4234cb2cd1c5eb8441a7712b224420b99f50b0ba16620aadef48923234a1
Shown target SHA256: 6efa4234cb2cd1c5eb8441a7712b224420b99f50b0ba16620aadef48923234a1

### Complete proposed decision

```json
{
  "claimId": "claim_d8d0977847458c69c1d43b18e460f0b0",
  "sourceUnitDigest": "c6cf6debd4a1921b0a49ed216d310f767cf090f4d98f814404aee95ef976ff76",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "err-write-refused",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/30-states-and-errors.md#err-write-refused (source lines 52-52) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#err-write-refused (candidate lines 74-74). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c6cf6debd4a1921b0a49ed216d310f767cf090f4d98f814404aee95ef976ff76",
  "targetAncestry": [
    "States and errors",
    "Errors"
  ]
}
```

### Full source shown text

```text
### ERR-WRITE-REFUSED
The gateway ran the verb and fgOS refused it (a lifecycle rule said no).
The engine's own refusal text is shown verbatim; the UI never paraphrases
it into something friendlier and less true.
```

### Full target shown text

```text
### ERR-WRITE-REFUSED
The gateway ran the verb and fgOS refused it (a lifecycle rule said no).
The engine's own refusal text is shown verbatim; the UI never paraphrases
it into something friendlier and less true.
```

## claim_c8a3f574ec2210840cc738016305180b

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#unheaded-block-12; lines 53–55; ancestry ["States and errors","Errors","ERR-WRITE-REFUSED"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-14; ancestry ["States and errors","Errors","ERR-WRITE-REFUSED"].
Source digest: 504311ca1d958ac45ae1698e7f2e1831d32f5f44ae97aa63c917b2f6634c6477
Target digest: 504311ca1d958ac45ae1698e7f2e1831d32f5f44ae97aa63c917b2f6634c6477
Shown source SHA256: 504311ca1d958ac45ae1698e7f2e1831d32f5f44ae97aa63c917b2f6634c6477
Shown target SHA256: 504311ca1d958ac45ae1698e7f2e1831d32f5f44ae97aa63c917b2f6634c6477

### Complete proposed decision

```json
{
  "claimId": "claim_c8a3f574ec2210840cc738016305180b",
  "sourceUnitDigest": "504311ca1d958ac45ae1698e7f2e1831d32f5f44ae97aa63c917b2f6634c6477",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "unheaded-block-14",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/30-states-and-errors.md#unheaded-block-12 (source lines 53-55) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-14 (candidate lines 75-77). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "504311ca1d958ac45ae1698e7f2e1831d32f5f44ae97aa63c917b2f6634c6477",
  "targetAncestry": [
    "States and errors",
    "Errors",
    "ERR-WRITE-REFUSED"
  ]
}
```

### Full source shown text

```text
The gateway ran the verb and fgOS refused it (a lifecycle rule said no).
The engine's own refusal text is shown verbatim; the UI never paraphrases
it into something friendlier and less true.
```

### Full target shown text

```text
The gateway ran the verb and fgOS refused it (a lifecycle rule said no).
The engine's own refusal text is shown verbatim; the UI never paraphrases
it into something friendlier and less true.
```

## claim_24a94954928e6613710b635d9db3c23b

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#err-approve-unavailable; lines 57–57; ancestry ["States and errors","Errors"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#err-approve-unavailable; ancestry ["States and errors","Errors"].
Source digest: df58a96aab2cff65e99e6dfb617252309aed229a14a27c1aea5c59eefe006133
Target digest: df58a96aab2cff65e99e6dfb617252309aed229a14a27c1aea5c59eefe006133
Shown source SHA256: faa0b7036db95868f4e4810039905035dcff32dfbaace4ced9e64d953a9aadd3
Shown target SHA256: faa0b7036db95868f4e4810039905035dcff32dfbaace4ced9e64d953a9aadd3

### Complete proposed decision

```json
{
  "claimId": "claim_24a94954928e6613710b635d9db3c23b",
  "sourceUnitDigest": "df58a96aab2cff65e99e6dfb617252309aed229a14a27c1aea5c59eefe006133",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "err-approve-unavailable",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/30-states-and-errors.md#err-approve-unavailable (source lines 57-57) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#err-approve-unavailable (candidate lines 79-79). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "df58a96aab2cff65e99e6dfb617252309aed229a14a27c1aea5c59eefe006133",
  "targetAncestry": [
    "States and errors",
    "Errors"
  ]
}
```

### Full source shown text

```text
### ERR-APPROVE-UNAVAILABLE
Approve-merge cannot run because the gateway is not positioned at the
repository's main working tree (R7). Shown as a disabled control with the
reason attached, before the person clicks — not as a failure after.
```

### Full target shown text

```text
### ERR-APPROVE-UNAVAILABLE
Approve-merge cannot run because the gateway is not positioned at the
repository's main working tree (R7). Shown as a disabled control with the
reason attached, before the person clicks — not as a failure after.
```

## claim_aecbc3babae704d462203a431851ec94

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#unheaded-block-13; lines 58–60; ancestry ["States and errors","Errors","ERR-APPROVE-UNAVAILABLE"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-15; ancestry ["States and errors","Errors","ERR-APPROVE-UNAVAILABLE"].
Source digest: 0784a58a7ce6f15c715fcdfb8aba800c83655eb9f5c95098954b0b38e9cf7fe9
Target digest: 0784a58a7ce6f15c715fcdfb8aba800c83655eb9f5c95098954b0b38e9cf7fe9
Shown source SHA256: 0784a58a7ce6f15c715fcdfb8aba800c83655eb9f5c95098954b0b38e9cf7fe9
Shown target SHA256: 0784a58a7ce6f15c715fcdfb8aba800c83655eb9f5c95098954b0b38e9cf7fe9

### Complete proposed decision

```json
{
  "claimId": "claim_aecbc3babae704d462203a431851ec94",
  "sourceUnitDigest": "0784a58a7ce6f15c715fcdfb8aba800c83655eb9f5c95098954b0b38e9cf7fe9",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "unheaded-block-15",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/30-states-and-errors.md#unheaded-block-13 (source lines 58-60) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-15 (candidate lines 80-82). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0784a58a7ce6f15c715fcdfb8aba800c83655eb9f5c95098954b0b38e9cf7fe9",
  "targetAncestry": [
    "States and errors",
    "Errors",
    "ERR-APPROVE-UNAVAILABLE"
  ]
}
```

### Full source shown text

```text
Approve-merge cannot run because the gateway is not positioned at the
repository's main working tree (R7). Shown as a disabled control with the
reason attached, before the person clicks — not as a failure after.
```

### Full target shown text

```text
Approve-merge cannot run because the gateway is not positioned at the
repository's main working tree (R7). Shown as a disabled control with the
reason attached, before the person clicks — not as a failure after.
```

## claim_44161b2503defd6c748dea08cb5223f7

Class: Weak-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#err-narrative-path; lines 62–62; ancestry ["States and errors","Errors"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#err-narrative-path; ancestry ["States and errors","Errors"].
Source digest: 36cb3463773ef5e07e0799d33ea65f93c6a391a7a5a3b21adc167a292a8ccefa
Target digest: 36cb3463773ef5e07e0799d33ea65f93c6a391a7a5a3b21adc167a292a8ccefa
Shown source SHA256: 578c4b2ad76b13c92e66854b459d80be761293f9fb7130282843ea519d5b7ce4
Shown target SHA256: 578c4b2ad76b13c92e66854b459d80be761293f9fb7130282843ea519d5b7ce4

### Complete proposed decision

```json
{
  "claimId": "claim_44161b2503defd6c748dea08cb5223f7",
  "sourceUnitDigest": "36cb3463773ef5e07e0799d33ea65f93c6a391a7a5a3b21adc167a292a8ccefa",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "err-narrative-path",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/ui-spec/30-states-and-errors.md#err-narrative-path (source lines 62-62) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#err-narrative-path (candidate lines 84-84). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "36cb3463773ef5e07e0799d33ea65f93c6a391a7a5a3b21adc167a292a8ccefa",
  "targetAncestry": [
    "States and errors",
    "Errors"
  ]
}
```

### Full source shown text

```text
### ERR-NARRATIVE-PATH
The item's documentation reference resolved outside the documentation
tree and was refused. Shown in the narrative region, not as a page-level
failure.
```

### Full target shown text

```text
### ERR-NARRATIVE-PATH
The item's documentation reference resolved outside the documentation
tree and was refused. Shown in the narrative region, not as a page-level
failure.
```

## claim_01ca3b8e35f5ed270cfdcdfdc91ff7ec

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/30-states-and-errors.md#unheaded-block-14; lines 63–65; ancestry ["States and errors","Errors","ERR-NARRATIVE-PATH"].
Target: docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-16; ancestry ["States and errors","Errors","ERR-NARRATIVE-PATH"].
Source digest: 45109a415776433fff6402225f349518b227508e1e3f0af58fa6d88c7c3c6c82
Target digest: 45109a415776433fff6402225f349518b227508e1e3f0af58fa6d88c7c3c6c82
Shown source SHA256: 45109a415776433fff6402225f349518b227508e1e3f0af58fa6d88c7c3c6c82
Shown target SHA256: 45109a415776433fff6402225f349518b227508e1e3f0af58fa6d88c7c3c6c82

### Complete proposed decision

```json
{
  "claimId": "claim_01ca3b8e35f5ed270cfdcdfdc91ff7ec",
  "sourceUnitDigest": "45109a415776433fff6402225f349518b227508e1e3f0af58fa6d88c7c3c6c82",
  "targetOwner": "docs/platform/ui-spec/contracts/30-states-and-errors.md",
  "targetAnchor": "unheaded-block-16",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/30-states-and-errors.md#unheaded-block-14 (source lines 63-65) is carried at docs/platform/ui-spec/contracts/30-states-and-errors.md#unheaded-block-16 (candidate lines 85-87). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/30-states-and-errors.md verbatim in docs/platform/ui-spec/contracts/30-states-and-errors.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "45109a415776433fff6402225f349518b227508e1e3f0af58fa6d88c7c3c6c82",
  "targetAncestry": [
    "States and errors",
    "Errors",
    "ERR-NARRATIVE-PATH"
  ]
}
```

### Full source shown text

```text
The item's documentation reference resolved outside the documentation
tree and was refused. Shown in the narrative region, not as a page-level
failure.
```

### Full target shown text

```text
The item's documentation reference resolved outside the documentation
tree and was refused. Shown in the narrative region, not as a page-level
failure.
```
